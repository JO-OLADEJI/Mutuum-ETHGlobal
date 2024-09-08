import {
  RuntimeModule,
  runtimeModule,
  state,
  runtimeMethod,
} from "@proto-kit/module";
import { State, assert, StateMap } from "@proto-kit/protocol";
import { NoConfig } from "@proto-kit/common";
import { TokenId, UInt64 } from "@proto-kit/library";
import { PublicKey, Field, Bool, Struct, Provable, provable } from "o1js";
import { Balances } from "./balances";
import { inject } from "tsyringe";

interface MutuumConfig {
  CHAIN_VAULT: PublicKey;
}

export class PositionKey extends Struct({
  tokenId: TokenId,
  address: PublicKey,
}) {
  public static from(tokenId: TokenId, address: PublicKey) {
    return new PositionKey({ tokenId, address });
  }
}

export class DebtPosition extends Struct({
  tokenId: TokenId,
  debt: UInt64,
}) {
  public static from(tokenId: TokenId, address: PublicKey) {
    return new PositionKey({ tokenId, address });
  }
}

class Token extends Struct({
  identifier: Provable.Array(UInt64, 10),
}) {
  public static empty(): Token {
    const identifier = Array<UInt64>(10).fill(UInt64.from(0));
    return new Token({ identifier });
  }
}

export class USDRates extends Struct({
  tokenIds: Provable.Array(TokenId, 6),
  rates: Provable.Array(UInt64, 6),
}) {
  public static empty(): USDRates {
    const tokenIds = Array<TokenId>(6).fill(TokenId.from(0));
    const rates = Array<UInt64>(6).fill(UInt64.from(0));
    return new USDRates({ tokenIds, rates });
  }
}

@runtimeModule()
export class DataFeed<Config = NoConfig> extends RuntimeModule<Config> {
  // tokenId => USD Rate (8 decimals precision)
  @state() public tokenRates = StateMap.from<TokenId, UInt64>(TokenId, UInt64);

  @runtimeMethod()
  public async setUSDRates(data: USDRates) {
    assert(
      Bool.fromJSON(data.tokenIds.length === data.rates.length),
      "Data mismatch!",
    );
    for (let i = 0; i < data.tokenIds.length; i++) {
      await this.tokenRates.set(data.tokenIds[i], data.rates[i]);
    }
  }

  @runtimeMethod()
  public async getUSDRate(tokenId: TokenId) {
    return await this.tokenRates.get(tokenId);
  }
}

@runtimeModule()
export class Mutuum extends RuntimeModule<MutuumConfig> {
  @state() public deposits = StateMap.from<PositionKey, UInt64>(
    PositionKey,
    UInt64,
  );
  @state() public debts = StateMap.from<PositionKey, UInt64>(
    PositionKey,
    UInt64,
  );
  @state() public depositTokens = StateMap.from<PublicKey, Token>(
    PublicKey,
    Token,
  );
  @state() public borrowedTokens = StateMap.from<PublicKey, Token>(
    PublicKey,
    Token,
  );

  public constructor(
    @inject("Balances") public balances: Balances,
    @inject("DataFeed") public dataFeed: DataFeed,
  ) {
    super();
  }

  // @runtimeMethod()
  // public async getHealthFactor() {
  // }

  // @runtimeMethod()
  // public async attemptLiquidate(target: PublicKey) {}

  @runtimeMethod()
  public async supply(tokenId: TokenId, amount: UInt64) {
    const positionId = PositionKey.from(tokenId, this.transaction.sender.value);
    const chainVaultAddr = this.config.CHAIN_VAULT;
    assert(chainVaultAddr.isEmpty().not(), "CHAIN_VAULT not set!");

    const depositTokenMap = await this.depositTokens.get(
      this.transaction.sender.value,
    );
    depositTokenMap.value.identifier[this.tokenIdToIndex(tokenId)] =
      UInt64.from(1);

    await this.deposits.set(positionId, amount);
    await this.depositTokens.set(
      this.transaction.sender.value,
      depositTokenMap.value,
    );

    await this.balances.transfer(
      tokenId,
      this.transaction.sender.value,
      chainVaultAddr,
      amount,
    );
  }

  @runtimeMethod()
  public async withdraw(tokenId: TokenId, amount: UInt64) {
    const senderAddr = this.transaction.sender.value;
    const positionId = PositionKey.from(tokenId, senderAddr);
    const chainVaultAddr = this.config.CHAIN_VAULT;
    const currentPosition = await this.deposits.get(positionId);

    assert(currentPosition.value.greaterThan(UInt64.from(0)), "Null position!");
    assert(
      currentPosition.value.greaterThanOrEqual(amount),
      "Position value exceeded!",
    );

    // 1. optimistically update the position
    const newPosition = currentPosition.value.sub(amount);
    await this.deposits.set(positionId, newPosition);

    // 2. calculate the deposit value after position update
    const settledDepositUSD = await this.getDepositUSD();
    const settledDebtThresholdUSD = settledDepositUSD.mul(75).div(100);

    // 3. calculate debt threshold and require it is less or equivalent
    const debtUSD = await this.getDebtUSD();

    assert(
      settledDebtThresholdUSD.greaterThanOrEqual(debtUSD),
      "Position leverage exceeded!",
    );

    // 4. if position is totally closed out, update deposit-tokens map
    if (Number(newPosition.equals(UInt64.from(0)).value.toString()[4])) {
      const depositTokenMap = await this.depositTokens.get(
        this.transaction.sender.value,
      );

      depositTokenMap.value.identifier[this.tokenIdToIndex(tokenId)] =
        UInt64.from(0);
      await this.depositTokens.set(
        this.transaction.sender.value,
        depositTokenMap.value,
      );
    }

    // 5. move funds from vault to user address
    await this.balances.transfer(tokenId, chainVaultAddr, senderAddr, amount);
  }

  @runtimeMethod()
  public async borrow(tokenId: TokenId, amount: UInt64) {
    const chainVaultAddr = this.config.CHAIN_VAULT;
    const senderAddr = this.transaction.sender.value;
    const positionKey = PositionKey.from(tokenId, senderAddr);

    // 1. evaluate the user's debt position in USD
    const debtUSD = await this.getDebtUSD();

    // 2. evaluate the user's deposit in USD
    const depositUSD = await this.getDepositUSD();

    // 3. get the borrow threshold of 75% in USD
    const debtThresholdUSD = depositUSD.mul(75).div(100);
    assert(
      debtThresholdUSD.greaterThanOrEqual(debtUSD),
      "Under-collateralized position!",
    );

    // 4. determine how much more the user can borrow
    const safeTokenLoans = await this.getSafeTokenLoans(
      debtThresholdUSD.sub(debtUSD),
    );
    const chainVaultDebtTokenBalance = await this.balances.getBalance(
      tokenId,
      chainVaultAddr,
    );
    const maxTokenAllowedDebt = safeTokenLoans[this.tokenIdToIndex(tokenId)];
    assert(
      maxTokenAllowedDebt.greaterThanOrEqual(amount),
      "Debt threshold exceeded!",
    );
    assert(
      chainVaultDebtTokenBalance.greaterThanOrEqual(amount),
      "Insufficient vault liquidity!",
    );

    // 5. lend user the tokens
    const outstandingTokenDebt = await this.debts.get(positionKey);
    const debtTokenMap = await this.borrowedTokens.get(senderAddr);
    debtTokenMap.value.identifier[this.tokenIdToIndex(tokenId)] =
      UInt64.from(1);

    await this.debts.set(positionKey, outstandingTokenDebt.value.add(amount));
    await this.borrowedTokens.set(senderAddr, debtTokenMap.value);

    await this.balances.transfer(tokenId, chainVaultAddr, senderAddr, amount);
  }

  @runtimeMethod()
  public async repay(tokenId: TokenId, amount: UInt64) {
    // adjust borrow position
    const chainVaultAddr = this.config.CHAIN_VAULT;
    const senderAddr = this.transaction.sender.value;
    const positionKey = PositionKey.from(tokenId, senderAddr);
    const pendingDebt = (await this.debts.get(positionKey)).value;

    // if debt is totally cleared, the token map should be updated
    if (Number(amount.greaterThanOrEqual(pendingDebt).value.toString()[4])) {
      await this.debts.set(positionKey, UInt64.from(0));

      const debtTokenMap = await this.borrowedTokens.get(senderAddr);
      debtTokenMap.value.identifier[this.tokenIdToIndex(tokenId)] =
        UInt64.from(0);
      await this.borrowedTokens.set(senderAddr, debtTokenMap.value);

      await this.balances.transfer(
        tokenId,
        senderAddr,
        chainVaultAddr,
        pendingDebt,
      );
    } else {
      await this.debts.set(positionKey, pendingDebt.sub(amount));
      await this.balances.transfer(tokenId, senderAddr, chainVaultAddr, amount);
    }
  }

  // helper methods
  private tokenIdToIndex(tokenId: TokenId) {
    for (let i = 0; i < 10; i++) {
      if (Number(tokenId.equals(TokenId.from(i)).value.toString()[4])) {
        return i;
      }
    }
    return 999;
  }

  private tokenMapToTokenId(map: UInt64[]) {
    const tokenIds: TokenId[] = [];

    for (let i = 0; i < map.length; i++) {
      if (Number(map[i].equals(UInt64.from(1)).value.toString()[4])) {
        tokenIds.push(TokenId.from(i));
      }
    }
    return tokenIds;
  }

  @runtimeMethod()
  private async getDepositUSD() {
    let depositValueUSD = UInt64.from(0);
    const depositTokenMap = await this.depositTokens.get(
      this.transaction.sender.value,
    );

    if (depositTokenMap.value.identifier.length === 0) {
      return UInt64.from(0);
    }

    const depositTokenIds = this.tokenMapToTokenId(
      depositTokenMap.value.identifier,
    );

    for (let i = 0; i < depositTokenIds.length; i++) {
      const dep = await this.deposits.get(
        PositionKey.from(depositTokenIds[i], this.transaction.sender.value),
      );
      const usdRate = await this.dataFeed.getUSDRate(depositTokenIds[i]);
      depositValueUSD = depositValueUSD.add(dep.value.mul(usdRate.value));
    }

    return depositValueUSD;
  }

  private async getDebtUSD() {
    let debtValueUSD = UInt64.from(0);
    const debtTokenMap = await this.borrowedTokens.get(
      this.transaction.sender.value,
    );

    if (debtTokenMap.value.identifier.length === 0) {
      return UInt64.from(0);
    }

    const debtTokenIds = this.tokenMapToTokenId(debtTokenMap.value.identifier);

    for (let i = 0; i < debtTokenIds.length; i++) {
      const debt = await this.debts.get(
        PositionKey.from(debtTokenIds[i], this.transaction.sender.value),
      );
      const usdRate = await this.dataFeed.getUSDRate(debtTokenIds[i]);
      debtValueUSD = debtValueUSD.add(debt.value.mul(usdRate.value));
    }

    return debtValueUSD;
  }

  private async getSafeTokenLoans(safeUSDLoan: UInt64) {
    const safeLoansIndexedByTokenId: UInt64[] = [];

    for (let i = 0; i < 10; i++) {
      const tokenUSDRate = await this.dataFeed.getUSDRate(TokenId.from(i));
      if (
        Number(
          tokenUSDRate.value.equals(UInt64.from(0)).not().value.toString()[4],
        )
      ) {
        const safeTokenLoan = safeUSDLoan.div(tokenUSDRate.value);
        safeLoansIndexedByTokenId.push(safeTokenLoan);
      } else {
        safeLoansIndexedByTokenId.push(UInt64.from(0));
      }
    }

    return safeLoansIndexedByTokenId;
  }
}

import {
  RuntimeModule,
  runtimeModule,
  state,
  runtimeMethod,
} from "@proto-kit/module";
import { State, assert, StateMap } from "@proto-kit/protocol";
import { NoConfig } from "@proto-kit/common";
import { Balance, TokenId, UInt64 } from "@proto-kit/library";
import { PublicKey, Field, Bool, Struct, Provable, provable } from "o1js";
import { Balances } from "./balances";
import { inject } from "tsyringe";

// GOAL
// CREATE A LENDING PLATFORM LIKE AAVE that has the following features:
// 1. Deposit tokens
// 2. Collaterized borrowing
// 3. Loan Repayment
// 4. *Debt asset swap
// 5. Health Factor
//
//
// STEP 1: Write a Mina Smart contract and deploy it to an address - that's where the funds are transferred to for a Supply
//

interface MutuumConfig {
  moderator: PublicKey;
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

@runtimeModule()
export class DataFeed<Config = NoConfig> extends RuntimeModule<Config> {
  // tokenId => USD Rate (8 decimals precision)
  @state() public tokenRates = StateMap.from<TokenId, UInt64>(TokenId, UInt64);

  @runtimeMethod()
  public async setUSDRates(tokenId: TokenId, usdRate: UInt64) {
    await this.tokenRates.set(tokenId, usdRate);
  }

  @runtimeMethod()
  public async getUSDRate(tokenId: TokenId) {
    return await this.tokenRates.get(tokenId);
  }
}

@runtimeModule()
export class Mutuum extends RuntimeModule<MutuumConfig> {
  // @state() public DEBT_THRESHOLD = State.from<UInt64>(UInt64);
  @state() public CHAIN_VAULT = State.from<PublicKey>(PublicKey);
  @state() public deposits = StateMap.from<PositionKey, UInt64>(
    PositionKey,
    UInt64,
  );
  @state() public debts = StateMap.from<PositionKey, UInt64>(
    PositionKey,
    UInt64,
  );
  @state() public depositTokens = StateMap.from<PublicKey, Array<UInt64>>(
    PublicKey,
    Provable.Array(UInt64, 10),
  );
  @state() public borrowedTokens = StateMap.from<PublicKey, Array<UInt64>>(
    PublicKey,
    Provable.Array(UInt64, 10),
  );

  public constructor(
    @inject("Balances") public balances: Balances,
    @inject("DataFeed") public dataFeed: DataFeed,
  ) {
    super();
  }

  @runtimeMethod()
  public async setChainVault(address: PublicKey) {
    assert(
      this.transaction.sender.value.equals(this.config.moderator),
      "Unauthorized!",
    );
    await this.CHAIN_VAULT.set(address);
  }

  @runtimeMethod()
  public async getHealthFactor() {
    // evaluate the user's deposit in USD
    // evaluate the user's debt position in USD
    // get the borrow threshold of 75% in USD
  }

  // @runtimeMethod()
  // public async attemptLiquidate(target: PublicKey) {}

  @runtimeMethod()
  public async supply(tokenId: TokenId, amount: UInt64) {
    const positionId = PositionKey.from(tokenId, this.transaction.sender.value);
    const chainVaultAddr = (await this.CHAIN_VAULT.get()).value;
    assert(chainVaultAddr.isEmpty().not(), "CHAIN_VAULT not set!");

    const depositTokenMap = await this.depositTokens.get(
      this.transaction.sender.value,
    );
    depositTokenMap.value[this.tokenIdToIndex(tokenId)] = UInt64.from(1);

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
    const positionId = PositionKey.from(tokenId, this.transaction.sender.value);
    const chainVaultAddr = await this.CHAIN_VAULT.get();
    const currentPosition = await this.deposits.get(positionId);

    assert(currentPosition.value.greaterThan(UInt64.from(0)), "Null position!");
    assert(
      currentPosition.value.greaterThanOrEqual(amount),
      "Position value exceeded!",
    );

    // TODO: check for health factor before withdrawal

    const newPosition = currentPosition.value.sub(amount);

    if (newPosition.equals(UInt64.from(0))) {
      const depositTokenMap = await this.depositTokens.get(
        this.transaction.sender.value,
      );
      depositTokenMap.value[this.tokenIdToIndex(tokenId)] = UInt64.from(0);
      await this.depositTokens.set(
        this.transaction.sender.value,
        depositTokenMap.value,
      );
    }

    await this.deposits.set(positionId, newPosition);
    await this.balances.transfer(
      tokenId,
      chainVaultAddr.value,
      this.transaction.sender.value,
      amount,
    );
  }

  @runtimeMethod()
  public async borrow(tokenId: TokenId, amount: UInt64) {
    const chainVaultAddr = (await this.CHAIN_VAULT.get()).value;
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
    const chainVaultBorrowTokenBalance = await this.balances.getBalance(
      tokenId,
      chainVaultAddr,
    );
    const maxTokenBorrow = safeTokenLoans[this.tokenIdToIndex(tokenId)];
    assert(
      maxTokenBorrow.greaterThanOrEqual(amount),
      "Debt threshold exceeded!",
    );
    assert(
      chainVaultBorrowTokenBalance.greaterThanOrEqual(amount),
      "Insufficient vault liquidity!",
    );

    // 5. lend user the tokens
    const outstandingTokenDebt = await this.debts.get(positionKey);
    const debtTokenMap = await this.borrowedTokens.get(senderAddr);
    debtTokenMap.value[this.tokenIdToIndex(tokenId)] = UInt64.from(1);

    await this.debts.set(positionKey, outstandingTokenDebt.value.add(amount));
    await this.borrowedTokens.set(senderAddr, debtTokenMap.value);

    await this.balances.transfer(tokenId, chainVaultAddr, senderAddr, amount);
  }

  // @runtimeMethod()
  // public async repay() {}

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

  private async getDepositUSD() {
    let depositValueUSD = UInt64.from(0);
    const depositTokenMap = await this.depositTokens.get(
      this.transaction.sender.value,
    );

    if (depositTokenMap.value.length === 0) {
      return UInt64.from(0);
    }

    const depositTokenIds = this.tokenMapToTokenId(depositTokenMap.value);

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

    if (debtTokenMap.value.length === 0) {
      return UInt64.from(0);
    }

    const debtTokenIds = this.tokenMapToTokenId(debtTokenMap.value);

    for (let i = 0; i < debtTokenIds.length; i++) {
      const debt = await this.debts.get(
        PositionKey.from(debtTokenIds[i], this.transaction.sender.value),
      );
      const usdRate = await this.dataFeed.getUSDRate(debtTokenIds[i]);
      debtValueUSD = debtValueUSD.add(debt.value.mul(usdRate.value));
      Provable.log("Debt (USD): ", debtValueUSD);
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

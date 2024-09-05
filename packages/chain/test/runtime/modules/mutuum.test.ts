import "reflect-metadata";
import { TestingAppChain } from "@proto-kit/sdk";
import {
  Mutuum,
  PositionKey,
  DataFeed,
} from "../../../src/runtime/modules/mutuum";
import { PrivateKey, PublicKey } from "o1js";
import { Balances } from "../../../src/runtime/modules/balances";
import { Balance, BalancesKey, TokenId, UInt64 } from "@proto-kit/library";
import { NoConfig } from "@proto-kit/common";
import { mockFetchUSDPrices } from "../../utils";

const PRIVATE_KEY_LITERAL =
  "EKEyCBFAiDxVJn5G4LiJisKHqGbkHqads8b9a2iWwwGd3MfSJGy6";

describe("Mutuum", () => {
  let mutuum: Mutuum;
  let appChain = TestingAppChain.fromRuntime({
    Mutuum,
    Balances,
    DataFeed,
  });

  const CHAIN_VAULT = PrivateKey.random();
  // const MODERATOR = PrivateKey.random();
  const MODERATOR = PrivateKey.fromBase58(PRIVATE_KEY_LITERAL);
  let tokenId = TokenId.from(0);

  beforeAll(async () => {
    appChain = TestingAppChain.fromRuntime({
      Mutuum,
      Balances,
      DataFeed,
    });
    appChain.configurePartial({
      Runtime: {
        DataFeed: {},
        Mutuum: {
          moderator: MODERATOR.toPublicKey(),
        },
        Balances: {
          totalSupply: Balance.from(21_000_000),
        },
      },
    });

    await appChain.start();
    mutuum = appChain.runtime.resolve("Mutuum") as Mutuum;
  });

  const getBalance = async (target: PublicKey | PrivateKey, id?: TokenId) => {
    return await appChain.query.runtime.Balances.balances.get(
      BalancesKey.from(
        id ?? tokenId,
        target instanceof PublicKey ? target : target.toPublicKey(),
      ),
    );
  };

  const getPosition = async (target: PublicKey | PrivateKey, id?: TokenId) => {
    return await appChain.query.runtime.Mutuum.deposits.get(
      PositionKey.from(
        id ?? tokenId,
        target instanceof PublicKey ? target : target.toPublicKey(),
      ),
    );
  };

  const drip = async (signer: PrivateKey, amount?: UInt64) => {
    appChain.setSigner(signer);
    const tx = await appChain.transaction(signer.toPublicKey(), async () => {
      await mutuum.balances.addBalance(
        tokenId,
        signer.toPublicKey(),
        amount ?? UInt64.from(100),
      );
    });
    await tx.sign();
    await tx.send();
    await appChain.produceBlock();
  };

  const setChainValut = async (signer?: PrivateKey) => {
    appChain.setSigner(signer ?? MODERATOR);
    const tx = await appChain.transaction(
      (signer ?? MODERATOR).toPublicKey(),
      async () => {
        await mutuum.setChainVault(CHAIN_VAULT.toPublicKey());
      },
    );
    await tx.sign();
    await tx.send();
    await appChain.produceBlock();
  };

  const supplyLiquidity = async (signer: PrivateKey, amount: UInt64) => {
    appChain.setSigner(signer);
    const tx = await appChain.transaction(signer.toPublicKey(), async () => {
      await mutuum.supply(tokenId, amount);
    });
    await tx.sign();
    await tx.send();
    await appChain.produceBlock();
  };

  const withdrawLiquidity = async (signer: PrivateKey, amount: UInt64) => {
    appChain.setSigner(signer);
    const tx = await appChain.transaction(signer.toPublicKey(), async () => {
      await mutuum.withdraw(tokenId, amount);
    });
    await tx.sign();
    await tx.send();
    await appChain.produceBlock();
  };

  const initConditions = async (
    signer: PrivateKey,
    dripAmount: UInt64,
    supplyAmount?: UInt64,
  ) => {
    await drip(signer, dripAmount);
    await setChainValut(MODERATOR);
    await supplyLiquidity(signer, supplyAmount ?? dripAmount);
  };

  const setDataFeedRates = async () => {
    appChain.setSigner(MODERATOR);
    const usdPrices = mockFetchUSDPrices();

    for (let i = 0; i < usdPrices.length; i++) {
      const tx = await appChain.transaction(
        MODERATOR.toPublicKey(),
        async () => {
          await mutuum.dataFeed.setUSDRates(TokenId.from(i), usdPrices[i]);
        },
      );
      await tx.sign();
      await tx.send();
      await appChain.produceBlock();
    }
  };

  describe("setChainVault", () => {
    it("should fail if set by a non-authorized public key", async () => {
      const ADAM_SMITH = PrivateKey.random();

      const initChainVault =
        await appChain.query.runtime.Mutuum.CHAIN_VAULT.get();

      await setChainValut(ADAM_SMITH);

      const newChainVault =
        await appChain.query.runtime.Mutuum.CHAIN_VAULT.get();

      if (initChainVault === undefined) {
        expect(newChainVault).toBeUndefined();
      } else {
        expect(initChainVault).toBe(newChainVault);
      }
    });

    // TODO: `fix Do not know how to serialize a BigInt at stringify` error
    // it("should update CHAIN_VAULT when called by moderator", async () => {
    //   const initChainVault =
    //     await appChain.query.runtime.Mutuum.CHAIN_VAULT.get();

    //   await setChainValut(MODERATOR);

    //   const newChainVault =
    //     await appChain.query.runtime.Mutuum.CHAIN_VAULT.get();
    //   expect(newChainVault).toBeDefined();
    //   expect(newChainVault).toBe(CHAIN_VAULT);
    // });
  });

  describe("supply", () => {
    it("should fail if CHAIN_VAULT is not set", async () => {
      const ADAM_SMITH = PrivateKey.random();
      await drip(ADAM_SMITH);

      const adamSmithInitBalance = await getBalance(ADAM_SMITH);
      await supplyLiquidity(
        ADAM_SMITH,
        adamSmithInitBalance
          ? UInt64.from(adamSmithInitBalance)
          : UInt64.from(0),
      );
      const adamSmithFinalBalance = await getBalance(ADAM_SMITH);

      expect(adamSmithInitBalance?.toBigInt()).toBe(
        adamSmithFinalBalance?.toBigInt(),
      );
    });

    it("should transfer balance to CHAIN_VAULT and update position", async () => {
      const ADAM_SMITH = PrivateKey.random();
      await drip(ADAM_SMITH);
      await setChainValut(MODERATOR);

      const adamSmithInitBalance =
        (await getBalance(ADAM_SMITH))?.toBigInt() ?? BigInt(0);
      const chainValutInitBalance =
        (await getBalance(CHAIN_VAULT))?.toBigInt() ?? BigInt(0);

      await supplyLiquidity(
        ADAM_SMITH,
        adamSmithInitBalance
          ? UInt64.from(adamSmithInitBalance)
          : UInt64.from(0),
      );

      const adamSmithFinalBalance =
        (await getBalance(ADAM_SMITH))?.toBigInt() ?? BigInt(0);
      const chainVaultFinalBalance =
        (await getBalance(CHAIN_VAULT))?.toBigInt() ?? BigInt(0);
      const supplyPosition = await getPosition(ADAM_SMITH);
      const depositTokenMap =
        await appChain.query.runtime.Mutuum.depositTokens.get(
          ADAM_SMITH.toPublicKey(),
        );

      const adamSmithBalanceDelta =
        adamSmithFinalBalance - adamSmithInitBalance;
      const chainVaultBalanceDelta =
        chainVaultFinalBalance - chainValutInitBalance;

      if (depositTokenMap) {
        expect(depositTokenMap[0].toBigInt()).toBe(1n);
      }
      expect(adamSmithBalanceDelta * -1n).toEqual(chainVaultBalanceDelta);
      expect(chainVaultBalanceDelta).toBe(supplyPosition?.toBigInt());
    });
  });

  describe("withdraw", () => {
    const initialAirdrop = UInt64.from(100);

    it("should fail if position does not exist", async () => {
      const ADAM_SMITH = PrivateKey.random();
      const withdrawAmount = initialAirdrop.div(UInt64.from(2));

      const initBalance = await getBalance(ADAM_SMITH);
      const initPosition = await getPosition(ADAM_SMITH);

      await withdrawLiquidity(ADAM_SMITH, withdrawAmount);

      const finalBalance = await getBalance(ADAM_SMITH);
      const finalPosition = await getPosition(ADAM_SMITH);

      if (initBalance === undefined) {
        expect(finalBalance?.toBigInt()).toBeFalsy();
      } else {
        expect(initBalance?.toBigInt()).toBe(finalBalance?.toBigInt());
      }

      if (initPosition === undefined) {
        expect(finalPosition?.toBigInt()).toBeFalsy();
      } else {
        expect(initPosition?.toBigInt()).toBe(finalPosition?.toBigInt());
      }
    });

    it("should fail if position value is exceeded", async () => {
      const ADAM_SMITH = PrivateKey.random();
      const withdrawAmount = initialAirdrop.mul(UInt64.from(2));

      await initConditions(ADAM_SMITH, initialAirdrop);
      const initBalance = await getBalance(ADAM_SMITH);
      const initPosition = await getPosition(ADAM_SMITH);

      await withdrawLiquidity(ADAM_SMITH, withdrawAmount);

      const finalBalance = await getBalance(ADAM_SMITH);
      const finalPosition = await getPosition(ADAM_SMITH);

      if (initBalance === undefined) {
        expect(finalBalance?.toBigInt()).toBeFalsy();
      } else {
        expect(initBalance?.toBigInt()).toBe(finalBalance?.toBigInt());
      }

      if (initPosition === undefined) {
        expect(finalPosition?.toBigInt()).toBeFalsy();
      } else {
        expect(initPosition?.toBigInt()).toBe(finalPosition?.toBigInt());
      }
    });

    it("should transfer amount to user and update position", async () => {
      const ADAM_SMITH = PrivateKey.random();
      const withdrawAmount = initialAirdrop.div(UInt64.from(2));

      await initConditions(ADAM_SMITH, initialAirdrop);
      const initBalance = await getBalance(ADAM_SMITH);
      const initPosition = await getPosition(ADAM_SMITH);

      await withdrawLiquidity(ADAM_SMITH, withdrawAmount);

      const finalBalance = await getBalance(ADAM_SMITH);
      const finalPosition = await getPosition(ADAM_SMITH);

      expect(initBalance?.add(withdrawAmount).toBigInt()).toBe(
        finalBalance?.toBigInt(),
      );
      expect(initPosition?.sub(withdrawAmount).toBigInt()).toBe(
        finalPosition?.toBigInt(),
      );
    });
  });

  describe("borrow", () => {
    it("should lend the right amount of tokens", async () => {
      const ADAM_SMITH = PrivateKey.random();
      await initConditions(ADAM_SMITH, UInt64.from(100));
      await setDataFeedRates();

      tokenId = TokenId.from(1);
      await drip(ADAM_SMITH, UInt64.from(100));
      await supplyLiquidity(ADAM_SMITH, UInt64.from(100));

      // borrow tx
      appChain.setSigner(ADAM_SMITH);
      const tx = await appChain.transaction(
        ADAM_SMITH.toPublicKey(),
        async () => {
          await mutuum.borrow(TokenId.from(2), UInt64.from(50));
        },
      );
      await tx.sign();
      await tx.send();
      await appChain.produceBlock();
    });
  });
});

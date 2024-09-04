import "reflect-metadata";
import { TestingAppChain } from "@proto-kit/sdk";
import { Mutuum, PositionKey } from "../../../src/runtime/modules/mutuum";
import { PrivateKey, PublicKey } from "o1js";
import { Balances } from "../../../src/runtime/modules/balances";
import { Balance, BalancesKey, TokenId, UInt64 } from "@proto-kit/library";
import { NoConfig } from "@proto-kit/common";

const PRIVATE_KEY_LITERAL =
  "EKEyCBFAiDxVJn5G4LiJisKHqGbkHqads8b9a2iWwwGd3MfSJGy6";

describe("Mutuum", () => {
  let mutuum: Mutuum;
  let appChain = TestingAppChain.fromRuntime({
    Mutuum,
    Balances,
  });

  const CHAIN_VAULT = PrivateKey.random();
  // const MODERATOR = PrivateKey.random();
  const MODERATOR = PrivateKey.fromBase58(PRIVATE_KEY_LITERAL);
  const tokenId = TokenId.from(0);

  beforeAll(async () => {
    appChain = TestingAppChain.fromRuntime({
      Mutuum,
      Balances,
    });
    appChain.configurePartial({
      Runtime: {
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
    const supplyLiquidity = async (signer: PrivateKey, amount: UInt64) => {
      appChain.setSigner(signer);
      const tx = await appChain.transaction(signer.toPublicKey(), async () => {
        await mutuum.supply(tokenId, amount);
      });
      await tx.sign();
      await tx.send();
      await appChain.produceBlock();
    };

    it("should record no changes if CHAIN_VAULT is not set", async () => {
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

    it("should transfer balance to CHAIN_VAULT and keep track of it", async () => {
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
      const supplyPosition = await appChain.query.runtime.Mutuum.deposits.get(
        PositionKey.from(tokenId, ADAM_SMITH.toPublicKey()),
      );

      const adamSmithBalanceDelta =
        adamSmithFinalBalance - adamSmithInitBalance;
      const chainVaultBalanceDelta =
        chainVaultFinalBalance - chainValutInitBalance;

      expect(adamSmithBalanceDelta * -1n).toEqual(chainVaultBalanceDelta);
      expect(chainVaultBalanceDelta).toBe(supplyPosition?.toBigInt());
    });
  });
});

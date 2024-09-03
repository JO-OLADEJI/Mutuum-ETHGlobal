import "reflect-metadata";
import { TestingAppChain } from "@proto-kit/sdk";
import { Mutuum } from "../../../src/runtime/modules/mutuum";
import { PrivateKey } from "o1js";
import { Balances } from "../../../src/runtime/modules/balances";
import { Balance, TokenId, UInt64 } from "@proto-kit/library";
import { NoConfig } from "@proto-kit/common";

describe("Mutuum", () => {
  let appChain = TestingAppChain.fromRuntime({
    Mutuum,
    Balances,
  });

  const aliceKey = PrivateKey.random();
  const alice = aliceKey.toPublicKey();
  const tokenId = TokenId.from(0);

  beforeAll(async () => {
    appChain = TestingAppChain.fromRuntime({
      Mutuum,
      Balances,
    });
    appChain.configurePartial({
      Runtime: {
        Mutuum: {},
        Balances: {
          totalSupply: Balance.from(21_000_000),
        },
      },
    });

    await appChain.start();
    appChain.setSigner(aliceKey);
  });

  // describe("supply", () => {
  //   beforeEach(async () => {
  //     const mutuum = appChain.runtime.resolve("Mutuum");
  //     const dripAlice = await appChain.transaction(alice, async () => {
  //       await mutuum.balances.addBalance(tokenId, alice, UInt64.from(100));
  //     });

  //     await dripAlice.sign();
  //     await dripAlice.send();
  //     await appChain.produceBlock();
  //   });

  it("should transfer liquidity to the chain vault contract address", async () => {
    // appChain = TestingAppChain.fromRuntime({
    //   Mutuum,
    //   Balances,
    // });
  });
  // });
});

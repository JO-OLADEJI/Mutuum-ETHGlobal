import {
  RuntimeModule,
  runtimeModule,
  state,
  runtimeMethod,
} from "@proto-kit/module";
import { State, assert, StateMap } from "@proto-kit/protocol";
import { NoConfig } from "@proto-kit/common";
import { Balance, TokenId, UInt64 } from "@proto-kit/library";
import { PublicKey, Field, Bool, Struct, Poseidon } from "o1js";
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

export class PositionKey extends Struct({
  tokenId: TokenId,
  address: PublicKey,
}) {
  public static from(tokenId: TokenId, address: PublicKey) {
    return new PositionKey({ tokenId, address });
  }
}

@runtimeModule()
export class Mutuum<Config = NoConfig> extends RuntimeModule<Config> {
  @state() public CHAIN_VAULT_COMMITMENT = State.from<Field>(Field);
  @state() public deposits = StateMap.from<PositionKey, UInt64>(
    PositionKey,
    UInt64,
  );

  public constructor(@inject("Balances") public balances: Balances) {
    super();
  }

  @runtimeMethod()
  public async setChainVaultCommitment(address: PublicKey) {
    await this.CHAIN_VAULT_COMMITMENT.set(Poseidon.hash(address.toFields()));
  }

  // @runtimeMethod()
  // public async getPosition() {}

  @runtimeMethod()
  public async supply(tokenId: TokenId, amount: UInt64, vault: PublicKey) {
    // transfer money from the sender's balance to this smart contract
    const commitment = await this.CHAIN_VAULT_COMMITMENT.get();

    assert(
      Poseidon.hash(vault.toFields()).equals(commitment.value),
      "Invalid CHAIN_VAULT",
    );

    await this.balances.transferSigned(
      tokenId,
      this.transaction.sender.value,
      vault,
      amount,
    );

    // keep track of it
    await this.deposits.set(
      PositionKey.from(tokenId, this.transaction.sender.value),
      amount,
    );
  }

  // @runtimeMethod()
  // public async withdraw() {}

  // @runtimeMethod()
  // public async borrow() {}

  // @runtimeMethod()
  // public async repay() {}
}

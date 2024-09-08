// implement asset staking
// configure function to update data-feed
// calculate stake USD equivalent

import { create } from "zustand";
import { Client } from "./client";
import { immer } from "zustand/middleware/immer";
import { useWalletStore } from "./wallet";
import { PublicKey } from "o1js";
import { TokenId, UInt64 } from "@proto-kit/library";

export interface MutuumState {
  supply: (client: Client, tokenId: TokenId, amount: UInt64) => Promise<void>;
}

export const useMutuumStore = create<MutuumState, [["zustand/immer", never]]>(
  immer((set) => ({
    async supply(client: Client, tokenId: TokenId, amount: UInt64) {
      const connectedWallet = useWalletStore.getState().wallet;
      if (!connectedWallet) return;

      const mutuum = client.runtime.resolve("Mutuum");
      const tx = await client.transaction(
        PublicKey.fromBase58(connectedWallet),
        async () => {
          await mutuum.supply(tokenId, amount);
        },
      );
      await tx.sign();
      await tx.send();
    },
  })),
);

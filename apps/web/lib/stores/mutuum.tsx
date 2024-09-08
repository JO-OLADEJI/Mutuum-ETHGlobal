import { create } from "zustand";
import { Client, useClientStore } from "./client";
import { immer } from "zustand/middleware/immer";
import { useWalletStore } from "./wallet";
import { PublicKey } from "o1js";
import { TokenId, UInt64 } from "@proto-kit/library";
import { TOKENS } from "../constants";
import { PositionKey } from "chain/dist/runtime/modules/mutuum";
import { getTokenId } from "../utils";
import useTokenPricesUSD from "./rates";
import { AppChainTokens } from "../types";
import { useEffect, useMemo, useState } from "react";
import { useChainStore } from "./chain";

export interface MutuumState {
  // depositUSD: number;
  deposits: Partial<{ [key in AppChainTokens]: bigint }>;
  loadDeposits: (client: Client) => Promise<void>;
  supply: (client: Client, tokenId: TokenId, amount: UInt64) => Promise<void>;
  withdraw: (client: Client, tokenId: TokenId, amount: UInt64) => Promise<void>;
}

export const useMutuumStore = create<MutuumState, [["zustand/immer", never]]>(
  immer((set) => ({
    // depositUSD: 0,
    deposits: {},

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

    async withdraw(client: Client, tokenId: TokenId, amount: UInt64) {
      const connectedWallet = useWalletStore.getState().wallet;
      if (!connectedWallet) return;
      const mutuum = client.runtime.resolve("Mutuum");

      const tx = await client.transaction(
        PublicKey.fromBase58(connectedWallet),
        async () => {
          await mutuum.withdraw(tokenId, amount);
        },
      );
      await tx.sign();
      await tx.send();
    },

    async loadDeposits(client: Client) {
      const connectedWallet = useWalletStore.getState().wallet;
      if (!connectedWallet) return;

      const deposits = await Promise.all(
        TOKENS.map((token) =>
          client.query.runtime.Mutuum.deposits.get(
            PositionKey.from(
              getTokenId(token),
              PublicKey.fromBase58(connectedWallet),
            ),
          ),
        ),
      );

      set((state) => {
        state.deposits = deposits
          .map((value) => (value ? value.toBigInt() : BigInt(0)))
          .reduce(
            (acc, value, index) => {
              acc[TOKENS[index]] = value;
              return acc;
            },
            {} as { [key in AppChainTokens]: bigint },
          );
      });
    },
  })),
);

export const useDepositUSD = () => {
  const { block } = useChainStore();
  const { client } = useClientStore();
  const tokenPrices = useTokenPricesUSD();
  const { deposits, loadDeposits } = useMutuumStore();

  const { totalUSD, depositsUSD } = useMemo(() => {
    let total = 0;
    const map: Partial<{ [key in AppChainTokens]: number }> = {};

    TOKENS.forEach((value) => {
      total += Number(deposits[value] ?? 0) * Number(tokenPrices[value] ?? 0);
      map[value] =
        Number(deposits[value] ?? 0) * Number(tokenPrices[value] ?? 0);
    });

    return { totalUSD: total, depositsUSD: map };
  }, [deposits, tokenPrices]);

  useEffect(() => {
    if (!client) return;
    loadDeposits(client);
  }, [block?.height]);

  return { depositsUSD, totalUSD };
};

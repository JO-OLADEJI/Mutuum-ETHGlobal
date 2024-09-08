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
  deposits: Partial<{ [key in AppChainTokens]: bigint }>;
  debts: Partial<{ [key in AppChainTokens]: bigint }>;
  supply: (client: Client, tokenId: TokenId, amount: UInt64) => Promise<void>;
  withdraw: (client: Client, tokenId: TokenId, amount: UInt64) => Promise<void>;
  borrow: (client: Client, tokenId: TokenId, amount: UInt64) => Promise<void>;
  repay: (client: Client, tokenId: TokenId, amount: UInt64) => Promise<void>;
  loadDeposits: (client: Client) => Promise<void>;
  loadDebts: (client: Client) => Promise<void>;
}

export const useMutuumStore = create<MutuumState, [["zustand/immer", never]]>(
  immer((set) => ({
    deposits: {},
    debts: {},

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

    async borrow(client: Client, tokenId: TokenId, amount: UInt64) {
      const connectedWallet = useWalletStore.getState().wallet;
      if (!connectedWallet) return;
      const mutuum = client.runtime.resolve("Mutuum");

      const tx = await client.transaction(
        PublicKey.fromBase58(connectedWallet),
        async () => {
          await mutuum.borrow(tokenId, amount);
        },
      );
      await tx.sign();
      await tx.send();
    },

    async repay(client: Client, tokenId: TokenId, amount: UInt64) {
      const connectedWallet = useWalletStore.getState().wallet;
      if (!connectedWallet) return;
      const mutuum = client.runtime.resolve("Mutuum");

      const tx = await client.transaction(
        PublicKey.fromBase58(connectedWallet),
        async () => {
          await mutuum.repay(tokenId, amount);
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

    async loadDebts(client: Client) {
      const connectedWallet = useWalletStore.getState().wallet;
      if (!connectedWallet) return;

      const debts = await Promise.all(
        TOKENS.map((token) =>
          client.query.runtime.Mutuum.debts.get(
            PositionKey.from(
              getTokenId(token),
              PublicKey.fromBase58(connectedWallet),
            ),
          ),
        ),
      );

      set((state) => {
        state.debts = debts
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

export const useDebtsUSD = () => {
  const { block } = useChainStore();
  const { client } = useClientStore();
  const tokenPrices = useTokenPricesUSD();
  const { debts, loadDebts } = useMutuumStore();
  const { totalUSD: totalDepositUSD } = useDepositUSD();

  const { totalDebtUSD, debtsUSD } = useMemo(() => {
    let total = 0;
    const map: Partial<{ [key in AppChainTokens]: number }> = {};

    TOKENS.forEach((value) => {
      total += Number(debts[value] ?? 0) * Number(tokenPrices[value] ?? 0);
      map[value] = Number(debts[value] ?? 0) * Number(tokenPrices[value] ?? 0);
    });

    console.log({ totalDebtUSD: total });
    return { totalDebtUSD: total, debtsUSD: map };
  }, [debts, tokenPrices]);

  const availableLoans = useMemo(() => {
    const map: Partial<{ [key in AppChainTokens]: number }> = {};

    const maxLoanThresholdUSD = totalDepositUSD * 0.75;
    const availableLoanableUSD = maxLoanThresholdUSD - totalDebtUSD;

    TOKENS.forEach((value) => {
      map[value] = availableLoanableUSD / Number(tokenPrices[value]);
    });
    return map;
  }, [totalDebtUSD, totalDepositUSD, tokenPrices]);

  useEffect(() => {
    if (!client) return;
    loadDebts(client);
  }, [block?.height]);

  return { debtsUSD, totalDebtUSD, availableLoans };
};

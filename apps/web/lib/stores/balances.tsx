import { create } from "zustand";
import { Client, useClientStore } from "./client";
import { immer } from "zustand/middleware/immer";
import { PendingTransaction, UnsignedTransaction } from "@proto-kit/sequencer";
import { Balance, BalancesKey, UInt64, TokenId } from "@proto-kit/library";
import { PublicKey } from "o1js";
import { useCallback, useEffect, useState } from "react";
import { useChainStore } from "./chain";
import { useWalletStore } from "./wallet";
import { useAppStore } from "./app";
import { TOKENS } from "../constants";
import { getTokenId } from "../utils";
import { AppChainTokens } from "../types";

export interface BalancesState {
  loading: boolean;
  balances: {
    // address - balance
    [key: string]: { [key in AppChainTokens]: string };
  };
  loadBalances: (client: Client, address: string) => Promise<void>;
  faucet: (
    client: Client,
    address: string,
    tokenId: TokenId,
  ) => Promise<PendingTransaction>;
  transfer: (
    client: Client,
    fromAddress: PublicKey,
    toAddress: PublicKey,
    amount: UInt64,
    tokenId: TokenId,
  ) => Promise<PendingTransaction>;
}

function isPendingTransaction(
  transaction: PendingTransaction | UnsignedTransaction | undefined,
): asserts transaction is PendingTransaction {
  if (!(transaction instanceof PendingTransaction))
    throw new Error("Transaction is not a PendingTransaction");
}

export const useBalancesStore = create<
  BalancesState,
  [["zustand/immer", never]]
>(
  immer((set) => ({
    loading: Boolean(false),
    balances: {},
    async loadBalances(client: Client, address: string) {
      set((state) => {
        state.loading = true;
      });

      const balances = await Promise.all(
        TOKENS.map((token) =>
          client.query.runtime.Balances.balances.get(
            BalancesKey.from(getTokenId(token), PublicKey.fromBase58(address)),
          ),
        ),
      );

      set((state) => {
        state.loading = false;
        state.balances[address] = balances.reduce(
          (acc, value, index) => {
            acc[TOKENS[index]] = value?.toString() ?? "0";
            return acc;
          },
          {} as { [key in AppChainTokens]: string },
        );
      });
    },
    async faucet(client: Client, address: string, tokenId: TokenId) {
      const balances = client.runtime.resolve("Balances");
      const sender = PublicKey.fromBase58(address);

      const tx = await client.transaction(sender, async () => {
        await balances.addBalance(tokenId, sender, Balance.from(10000));
      });

      await tx.sign();
      await tx.send();

      isPendingTransaction(tx.transaction);
      return tx.transaction;
    },
    async transfer(
      client: Client,
      fromAddress: PublicKey,
      toAddress: PublicKey,
      amount: UInt64,
      tokenId: TokenId,
    ) {
      const balances = client.runtime.resolve("Balances");

      const tx = await client.transaction(fromAddress, async () => {
        await balances.transferSigned(
          tokenId,
          fromAddress,
          toAddress,
          Balance.from(amount),
        );
      });

      await tx.sign();
      await tx.send();

      isPendingTransaction(tx.transaction);
      return tx.transaction;
    },
  })),
);

export const useObserveBalance = () => {
  const { client } = useClientStore();
  const { block } = useChainStore();
  const { wallet } = useWalletStore();
  const { loadBalances } = useBalancesStore();

  useEffect(() => {
    if (!client || !wallet) return;

    loadBalances(client, wallet);
  }, [client, block?.height, wallet]);
};

export const useFaucet = () => {
  const client = useClientStore();
  const balances = useBalancesStore();
  const wallet = useWalletStore();

  return useCallback(
    async (tokenId: TokenId) => {
      if (!client.client || !wallet.wallet) return;

      const pendingTransaction = await balances.faucet(
        client.client,
        wallet.wallet,
        tokenId,
      );

      wallet.addPendingTransaction(pendingTransaction);
    },
    [client.client, wallet.wallet],
  );
};

export const useTransfer = () => {
  const client = useClientStore();
  const balances = useBalancesStore();
  const wallet = useWalletStore();
  const [loading, setLoading] = useState<boolean>(false);

  const action = useCallback(
    async (to: PublicKey, amount: UInt64, tokenId: TokenId) => {
      if (!client.client || !wallet.wallet) return;

      setLoading(true);
      const pendingTransaction = await balances.transfer(
        client.client,
        PublicKey.fromBase58(wallet.wallet),
        to,
        amount,
        tokenId,
      );

      wallet.addPendingTransaction(pendingTransaction);
      setLoading(false);
    },
    [client.client, wallet.wallet],
  );

  return { transfer: action, loading };
};

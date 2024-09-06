import Header from "@/components/header";
import { Toaster } from "@/components/ui/toaster";
import { useBalancesStore, useObserveBalance } from "@/lib/stores/balances";
import { useChainStore, usePollBlockHeight } from "@/lib/stores/chain";
import { useClientStore } from "@/lib/stores/client";
import { useNotifyTransactions, useWalletStore } from "@/lib/stores/wallet";
import { ReactNode, useEffect, useMemo } from "react";

export default function AsyncLayout({ children }: { children: ReactNode }) {
  const walletStore = useWalletStore();
  const clientStore = useClientStore();
  const chainStore = useChainStore();
  const balancesStore = useBalancesStore();

  usePollBlockHeight();
  useObserveBalance();
  useNotifyTransactions();

  useEffect(() => {
    clientStore.start();
  }, []);

  useEffect(() => {
    walletStore.initializeWallet();
    walletStore.observeWalletChange();
  }, []);

  const loading = useMemo(
    () => clientStore.loading || balancesStore.loading,
    [clientStore.loading, balancesStore.loading],
  );

  return (
    <>
      {/*<Header
        loading={clientStore.loading}
        balance={balancesStore.balances[walletStore.wallet ?? ""]?.["mMINA"]}
        balanceLoading={loading}
        wallet={walletStore.wallet}
        onConnectWallet={walletStore.connectWallet}
        blockHeight={chainStore.block?.height ?? "-"}
      />*/}
      {children}
      <Toaster />
    </>
  );
}

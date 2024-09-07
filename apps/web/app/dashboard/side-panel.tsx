"use client";
import Wallet from "@/components/wallet";
import { Faucet } from "@/components/faucet";
import {
  useTransfer,
  useBalancesStore,
  useFaucet,
} from "@/lib/stores/balances";
import useTokenPricesUSD from "@/lib/stores/rates";
import { useWalletStore } from "@/lib/stores/wallet";
import {
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";

const SidePanel = () => {
  const { wallet, connectWallet } = useWalletStore();
  const { transfer, loading: trfLoading } = useTransfer();
  const { balances } = useBalancesStore();
  const tokenPrices = useTokenPricesUSD();
  const faucet = useFaucet();

  return (
    <SheetContent className="overflow-auto">
      <SheetTitle>Title</SheetTitle>
      <SheetDescription>Lorem ipsum description.</SheetDescription>
      <Wallet
        connectedAddress={wallet}
        tokenPrices={tokenPrices}
        balances={balances[wallet ?? ""]}
      />
      <Faucet
        wallet={wallet}
        onConnectWallet={connectWallet}
        onDrip={faucet}
        loading={false}
        trfLoading={trfLoading}
        onTransfer={transfer}
      />
    </SheetContent>
  );
};

export default SidePanel;

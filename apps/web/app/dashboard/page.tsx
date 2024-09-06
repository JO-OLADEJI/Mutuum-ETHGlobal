"use client";
import Link from "next/link";
import Wallet from "@/components/wallet";
import { Faucet } from "@/components/faucet";
import {
  useTransfer,
  useBalancesStore,
  useFaucet,
} from "@/lib/stores/balances";
import useTokenPricesUSD from "@/lib/stores/rates";
import { useWalletStore } from "@/lib/stores/wallet";

const Dashboard = () => {
  const { wallet, connectWallet } = useWalletStore();
  const { transfer, loading: trfLoading } = useTransfer();
  const { balances } = useBalancesStore();
  const tokenPrices = useTokenPricesUSD();
  const faucet = useFaucet();

  return (
    <div className="">
      <h1>Dashboard</h1>
      <p>
        <Link href="/">Go back</Link>
      </p>
      <div>
        <Wallet
          connectedAddress={wallet}
          tokenPrices={tokenPrices}
          balances={balances[wallet ?? ""]}
        />
      </div>
      <div>
        <Faucet
          wallet={wallet}
          onConnectWallet={connectWallet}
          onDrip={faucet}
          loading={false}
          trfLoading={trfLoading}
          onTransfer={transfer}
        />
      </div>
    </div>
  );
};

export default Dashboard;

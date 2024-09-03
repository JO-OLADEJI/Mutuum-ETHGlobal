"use client";
import { Faucet } from "@/components/faucet";
import Wallet from "@/components/wallet";
import {
  useTransfer,
  useFaucet,
  useBalancesStore,
} from "@/lib/stores/balances";
import useTokenPricesUSD from "@/lib/stores/rates";
import { useWalletStore } from "@/lib/stores/wallet";

export default function Home() {
  // const faucet = useFaucet();
  const { wallet } = useWalletStore();
  const { transfer, loading: trfLoading } = useTransfer();
  const { balances } = useBalancesStore();
  const tokenPrices = useTokenPricesUSD();

  return (
    <div className="mx-auto -mt-32 h-full pt-16">
      <div className="flex h-full w-full items-center justify-center pt-16">
        <div className="flex basis-4/12 flex-col items-center justify-center 2xl:basis-3/12">
          <Wallet
            connectedAddress={wallet}
            tokenPrices={tokenPrices}
            balances={balances[wallet ?? ""]}
          />
        </div>
      </div>
    </div>
  );
}

// <Faucet
//   wallet={wallet.wallet}
//   onConnectWallet={wallet.connectWallet}
//   onDrip={faucet}
//   loading={false}
//   trfLoading={trfLoading}
//   onTransfer={transfer}
// />

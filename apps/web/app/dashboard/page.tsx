"use client";
import Image from "next/image";
import { useWalletStore } from "@/lib/stores/wallet";
import { Button } from "@/components/ui/button";
import { Sheet, SheetTrigger } from "@/components/ui/sheet";
import { truncateAddress } from "@/lib/utils";
import SidePanel from "./side-panel";

// assets
import dogecoin from "@/public/dogecoin.png";
import { useState } from "react";

const Dashboard = () => {
  const { wallet, connectWallet } = useWalletStore();
  const [networth, setNetworth] = useState<string>("");
  const [healthFactor, setHealthFactor] = useState<number>(0);

  return (
    <Sheet>
      <SidePanel />
      <nav className="flex justify-between px-12 py-4">
        <div>
          {/*<Image src={} alt="" width={} height={} />*/}
          <h1>Mutuum Protocol</h1>
        </div>
        {!wallet ? (
          <Button onClick={connectWallet}>Connect wallet</Button>
        ) : (
          <SheetTrigger asChild>
            <Button>{truncateAddress(wallet)}</Button>
          </SheetTrigger>
        )}
      </nav>

      <div className="mx-auto my-12 w-10/12">
        <h1 className="text-gray3 text-5xl font-black">Portfolio</h1>
        <div className="mt-4 flex items-start gap-12">
          <div>
            <p className="text-gray5 text-sm">Net Worth</p>
            <h1 className="text-gray3 text-3xl font-black">
              {networth ? (
                <>
                  <span>$</span>
                  {networth}
                </>
              ) : (
                "-"
              )}
            </h1>
          </div>
          <div>
            <p className="text-gray5 text-sm">Health Factor</p>
            <h1 className="text-gray3 text-3xl font-black">
              {healthFactor ? healthFactor : "-"}
            </h1>
          </div>
        </div>
      </div>

      {!wallet ? (
        <div className="border-graye m-auto w-10/12 rounded-sm border border-solid pb-16 pt-12 text-center">
          <Image
            src={dogecoin}
            alt="doegecoin"
            width={200}
            height={200}
            className="mx-auto"
          />
          <h3 className="text-gray3 font-bold">Please, connect your wallet.</h3>
          <p className="text-gray5 mb-4 text-sm">
            Connect your wallet to see your supplies, borrowings, and open
            positions.
          </p>
          <Button
            className="bg-gray2 border-gray1 rounded-sm"
            onClick={connectWallet}
          >
            Connect wallet
          </Button>
        </div>
      ) : null}
    </Sheet>
  );
};

export default Dashboard;

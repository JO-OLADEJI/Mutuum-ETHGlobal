"use client";
import Image from "next/image";
import { useWalletStore } from "@/lib/stores/wallet";
import { Button } from "@/components/ui/button";
import { Sheet, SheetTrigger } from "@/components/ui/sheet";
import { truncateAddress } from "@/lib/utils";
import SidePanel from "./side-panel";
import { useEffect, useState } from "react";
import { useBalancesStore } from "@/lib/stores/balances";
import useTokenPricesUSD from "@/lib/stores/rates";
import { Separator } from "@/components/ui/separator";
import { TOKENS } from "@/lib/constants";
import { Card } from "@/components/ui/card";
import { Avatar } from "@radix-ui/react-avatar";
import { AvatarFallback } from "@/components/ui/avatar";

// assets
import dogecoin from "@/public/dogecoin.png";
import hodl from "@/public/hodl.png";
import coin from "@/public/coin.png";
import { Checkbox } from "@/components/ui/checkbox";
import { Accordion } from "@/components/ui/accordion";
import Supply from "./items/supply";

const Dashboard = () => {
  const { wallet, connectWallet } = useWalletStore();
  const [networth, setNetworth] = useState<string>("");
  const [healthFactor, setHealthFactor] = useState<number>(0);
  const { balances } = useBalancesStore();
  const tokenPrices = useTokenPricesUSD();
  const [hideZeroBalance, setHideZeroBalance] = useState<boolean>(false);
  const tokensWithBalance = TOKENS.filter(
    (name) => balances[wallet ?? ""]?.[name] !== "0",
  );

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

      <div className="mx-auto my-12 flex w-10/12 items-center justify-between">
        <div>
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
        <Image src={hodl} alt="crypto portfolio" width={200} height={200} />
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
      ) : (
        <div className="mx-auto flex w-10/12 items-start justify-between gap-x-2.5">
          <div className="border-graye w-6/12 rounded border border-solid">
            <div className="p-3 pb-7">
              <h1 className="text-gray5 font-bold">
                Assets -{" "}
                <span className="text-xs font-bold">[eligible to stake]</span>
              </h1>
              <div className="flex items-center">
                <Checkbox
                  id="hide-0"
                  className="mr-1 h-3.5 w-3.5"
                  checked={hideZeroBalance}
                  onCheckedChange={() => setHideZeroBalance((prev) => !prev)}
                />
                <label htmlFor="hide-0" className="text-gray7 text-xs">
                  hide zero balace
                </label>
              </div>
            </div>
            <div className="text-gray7 grid grid-cols-4 px-2 text-xs font-semibold">
              <p>Asset</p>
              <p>Balance</p>
              <p>Collateral</p>
            </div>
            <Accordion type="single" collapsible>
              {(hideZeroBalance ? tokensWithBalance : TOKENS).map(
                (name, index) => (
                  <Supply
                    key={index}
                    tokenName={name}
                    balance={balances[wallet]?.[name]}
                    tokenPrice={tokenPrices[name]}
                  />
                ),
              )}
            </Accordion>
            {/*(hideZeroBalance ? tokensWithBalance : TOKENS).map(
              (name, index) => (
                <div
                  key={index}
                  className="border-graye grid grid-cols-4 border-t border-solid p-2"
                >
                  <div className="flex items-center">
                    <p className="text-xs">{name}</p>
                  </div>
                  <div className="text-sm">
                    <p>{balances[wallet]?.[name] ?? "0"}</p>
                    <p className="text-[9px] font-extrabold">
                      {!balances[wallet]?.[name]
                        ? "0"
                        : tokenPrices[name]
                          ? (
                              Number(balances[wallet][name]) *
                              Number(tokenPrices[name])
                            ).toLocaleString("en-US", {
                              style: "currency",
                              currency: "USD",
                            })
                          : "-"}
                    </p>
                  </div>
                  <div className="flex items-center">
                    <p className="text-xs">Toggle</p>
                  </div>
                  <div className="text-center">
                    <Button size={"sm"} variant={"outline"} className="w-fit">
                      Supply
                    </Button>
                  </div>
                </div>
              ),
            )*/}
          </div>
          <div className="border-graye h-96 w-6/12 rounded-sm border border-solid">
            <h1>Borrow</h1>
          </div>
        </div>
      )}
    </Sheet>
  );
};

export default Dashboard;

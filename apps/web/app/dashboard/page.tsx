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
import { TOKENS } from "@/lib/constants";
import dogecoin from "@/public/dogecoin.png";
import hodl from "@/public/hodl.png";
import { Checkbox } from "@/components/ui/checkbox";
import { Accordion } from "@/components/ui/accordion";
import Supply from "./items/supply";
import {
  useDebtsUSD,
  useDepositUSD,
  useMutuumStore,
} from "@/lib/stores/mutuum";
import { useClientStore } from "@/lib/stores/client";
import { TokenId } from "@proto-kit/library";
import Withdraw from "./items/withdraw";
import Borrow from "./items/borrow";

const Dashboard = () => {
  const { wallet, connectWallet } = useWalletStore();
  const [healthFactor, setHealthFactor] = useState<number>(0);
  const { balances } = useBalancesStore();
  const tokenPrices = useTokenPricesUSD();
  const { totalUSD } = useDepositUSD();
  const { availableLoans } = useDebtsUSD();
  const { deposits } = useMutuumStore();
  const [hideZeroBalance, setHideZeroBalance] = useState<boolean>(false);
  const tokensWithBalance = TOKENS.filter(
    (name) => balances[wallet ?? ""]?.[name] !== "0",
  );
  const stakedTokens = TOKENS.filter(
    (name) => (deposits[name] ?? BigInt(0)) > BigInt(0),
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
                {totalUSD ? (
                  <span>
                    {totalUSD.toLocaleString("en-US", {
                      style: "currency",
                      currency: "USD",
                    })}
                  </span>
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
        <>
          <div className="mx-auto mb-8 flex w-10/12 items-start justify-between gap-x-2.5">
            <div className="border-grayd w-6/12 rounded border border-solid">
              <div className="p-3 pb-7">
                <h1 className="text-gray5 font-bold">
                  Stake -{" "}
                  <span className="text-xs font-bold">[current deposits]</span>
                </h1>
                <div className="border-grayd text-gray5 rounded-sm border border-solid px-2 py-1 text-xs">
                  Balance:{" "}
                  <span className="font-bold">
                    {totalUSD.toLocaleString("en-US", {
                      style: "currency",
                      currency: "USD",
                    })}
                  </span>
                </div>
              </div>
              <div className="text-gray3 grid grid-cols-3 px-2 text-xs font-semibold">
                <p>Asset</p>
                <p>Stake</p>
              </div>
              <Accordion type="single" collapsible>
                {stakedTokens.map((name, index) => (
                  <Withdraw
                    key={index}
                    tokenName={name}
                    stake={deposits[name]}
                    tokenPrice={tokenPrices[name]}
                  />
                ))}
              </Accordion>
            </div>
            <div className="border-grayd h-12 w-6/12 rounded-sm border border-solid">
              <h1>Debts</h1>{" "}
              <span className="text-xs font-bold">[owing positions]</span>
            </div>
          </div>
          <div className="mx-auto flex w-10/12 items-start justify-between gap-x-2.5">
            <div className="border-grayd w-6/12 rounded border border-solid">
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
              <div className="text-gray3 grid grid-cols-4 px-2 text-xs font-semibold">
                <p>Asset</p>
                <p>Wallet Balance</p>
                <p>Collateralize</p>
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
            </div>
            <div className="border-grayd w-6/12 rounded-sm border border-solid">
              <div className="p-3 pb-7">
                <h1 className="text-gray5 font-bold">Eligible Loans</h1>
                <p className="text-gray7 text-xs">
                  keep an eye on your health factor
                </p>
              </div>
              <div className="text-gray3 grid grid-cols-4 px-2 text-xs font-semibold">
                <p>Asset</p>
                <p>Available</p>
                <p>APY</p>
              </div>
              <Accordion type="single" collapsible>
                {TOKENS.map((name, index) => (
                  <Borrow
                    key={index}
                    tokenName={name}
                    eligibleLoan={availableLoans[name]}
                    tokenPrice={tokenPrices[name]}
                  />
                ))}
              </Accordion>
            </div>
          </div>
        </>
      )}
      <div className="footer " />
    </Sheet>
  );
};

export default Dashboard;

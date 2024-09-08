"use client";
import Wallet from "@/components/wallet";
import { Faucet } from "@/components/faucet";
import {
  useTransfer,
  useBalancesStore,
  useFaucet,
} from "@/lib/stores/balances";
import useTokenPricesUSD from "@/lib/stores/rates";
import { useDatafeed } from "@/lib/stores/datafeed";
import { useWalletStore } from "@/lib/stores/wallet";
import {
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import airdrop from "@/public/airdrop.png";
import Image from "next/image";
import { TokenId } from "@proto-kit/library";
import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/stores/app";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TOKENS } from "@/lib/constants";

const SidePanel = () => {
  const { wallet, connectWallet } = useWalletStore();
  const { transfer, loading: trfLoading } = useTransfer();
  const { balances } = useBalancesStore();
  const tokenPrices = useTokenPricesUSD();
  const refreshDatafeed = useDatafeed();
  const faucet = useFaucet();
  const [activeTokenId, setActiveTokenId] = useState<TokenId>(TokenId.from(0));
  const { hasRefreshedDataFeed, setHasRefreshedDataFeed } = useAppStore();

  return (
    <SheetContent className="overflow-auto">
      <SheetTitle>Faucet</SheetTitle>
      <SheetDescription>
        Mint test tokens to interact with Mutuum Prootocol
      </SheetDescription>
      <Image
        className="mx-auto my-6"
        src={airdrop}
        alt="airdrop"
        width={200}
        height={200}
      />
      <div>
        <h1 className="text-grayc mb-8 cursor-not-allowed text-9xl font-extrabold">
          1000
        </h1>
        <Select
          onValueChange={(value) => setActiveTokenId(TokenId.from(value))}
        >
          <SelectTrigger className="mb-2.5 w-full">
            <SelectValue placeholder="Select a Token" />
          </SelectTrigger>
          <SelectContent>
            {TOKENS.map((value, index) => (
              <SelectItem key={index} value={index.toString()}>
                {value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button
        className="mb-2.5 w-full rounded-full"
        disabled={hasRefreshedDataFeed}
        onClick={async () => {
          await refreshDatafeed();
          setHasRefreshedDataFeed(true);
        }}
      >
        Refresh DataFeed
      </Button>
      <Button
        className="w-full rounded-full"
        disabled={!hasRefreshedDataFeed}
        onClick={async () => await faucet(activeTokenId)}
      >
        Mint!
      </Button>
    </SheetContent>
  );
};

export default SidePanel;

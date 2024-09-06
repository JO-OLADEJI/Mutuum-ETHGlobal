// functionalties
// 3. send tokens to another address
// 4. receive feature
// 5. swap tokens

import coin from "@/public/coin.png";
import { TOKENS } from "@/lib/constants";
import { Card } from "../ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import { AppChainTokens } from "@/lib/types";
import Image from "next/image";
import { useState } from "react";
import { Button } from "../ui/button";

interface WalletProps {
  connectedAddress: string | undefined;
  balances: { [key in AppChainTokens]: string };
  tokenPrices: Partial<{ [key in AppChainTokens]: string }>;
}

const Wallet = ({ connectedAddress, balances, tokenPrices }: WalletProps) => {
  const [hideZeroBalance, setHideZeroBalance] = useState<boolean>(false);
  const tokensWithBalance = TOKENS.filter((name) => balances?.[name] !== "0");

  return (
    <div className="w-full p-4">
      <div className="mb-6 mt-1 flex items-end justify-between">
        <div>
          <h2 className="mb-1 text-xl font-bold">ResourceX</h2>
          <p className="text-sm text-zinc-500">Token Balance in AppChain</p>
        </div>
        <Button
          variant={hideZeroBalance ? "default" : "outline"}
          size="sm"
          className="h-3 p-2 text-[9px] font-bold"
          onClick={() => setHideZeroBalance((prev) => !prev)}
        >
          hide zero bal.
        </Button>
      </div>
      <div className="mb-6 flex justify-between">
        <Button variant="outline" size="sm" className="w-20 rounded-full">
          buy
        </Button>
        <Button variant="outline" size="sm" className="w-20 rounded-full">
          send
        </Button>
        <Button variant="outline" size="sm" className="w-20 rounded-full">
          swap
        </Button>
        {/*<Button variant="outline" size="sm" className="w-20 rounded-full">
          receive
        </Button>*/}
      </div>
      {(hideZeroBalance ? tokensWithBalance : TOKENS).map((name, index) => (
        <Card
          key={index}
          className="mb-1.5 flex cursor-pointer items-center justify-between rounded-full px-5 py-2 shadow-none"
        >
          <div className="flex items-center">
            <Avatar className="mr-2 h-6 w-6">
              <Image width={32} height={32} src={coin} alt="X" />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
            <p className="text-xs">{name}</p>
          </div>
          <div className="text-right text-sm">
            <p>{balances?.[name] ?? "0"}</p>
            <p className="text-[9px] font-extrabold">
              {!balances?.[name]
                ? "0"
                : tokenPrices[name]
                  ? (
                      Number(balances[name]) * Number(tokenPrices[name])
                    ).toLocaleString("en-US", {
                      style: "currency",
                      currency: "USD",
                    })
                  : "-"}
            </p>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default Wallet;

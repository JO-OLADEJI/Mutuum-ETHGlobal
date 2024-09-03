// functionalties
// 1. View all tokens and dollar equivalent values
// 2. create a script to get token prices from chainlink EVM addresses
// 2. Btn to hide zero token balance
// 3. send tokens to another address
// 4. receive feature

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
          <h2 className="mb-1 text-xl font-bold">Wallet</h2>
          <p className="text-sm text-zinc-500">Token Balance in AppChain</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setHideZeroBalance((prev) => !prev)}
        >
          hide zero bal.
        </Button>
      </div>
      {(hideZeroBalance ? tokensWithBalance : TOKENS).map((name, index) => (
        <Card
          key={index}
          className="mb-4 flex cursor-pointer items-center justify-between p-4"
        >
          <div className="flex items-center">
            <Avatar className="mr-2">
              <Image width={64} height={64} src={coin} alt="X" />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
            <p className="text-xs">{name}</p>
          </div>
          <div className="text-right text-sm">
            <p>{balances?.[name] ?? "0"}</p>
            <p className="font-semibold">
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

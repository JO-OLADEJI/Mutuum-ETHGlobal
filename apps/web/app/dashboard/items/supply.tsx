import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useClientStore } from "@/lib/stores/client";
import { useMutuumStore } from "@/lib/stores/mutuum";
import { AppChainTokens } from "@/lib/types";
import { getTokenId } from "@/lib/utils";
import { TokenId, UInt64 } from "@proto-kit/library";
import { useState } from "react";

interface SupplyProps {
  tokenName: AppChainTokens;
  balance: string | undefined;
  tokenPrice: string | undefined;
}

const Supply = ({ tokenName, balance, tokenPrice }: SupplyProps) => {
  const { client } = useClientStore();
  const { supply: stake } = useMutuumStore();
  const [amount, setAmount] = useState<string>("");

  return (
    <AccordionItem value={tokenName} className="border-b-0 p-0">
      <div className="border-graye grid grid-cols-4 border-t border-solid p-2">
        <div className="flex items-center">
          <p className="text-xs">{tokenName}</p>
        </div>
        <div className="flex items-center">
          <div className="text-sm">
            <p>{balance ?? "0"}</p>
            <p className="text-[9px] font-extrabold">
              {!balance
                ? "0"
                : tokenPrice
                  ? (Number(balance) * Number(tokenPrice)).toLocaleString(
                      "en-US",
                      {
                        style: "currency",
                        currency: "USD",
                      },
                    )
                  : "-"}
            </p>
          </div>
        </div>
        <div className="flex items-center">
          <Switch checked={true} className="scale-75 cursor-not-allowed" />
        </div>
        <div className="flex items-center justify-center">
          <AccordionTrigger className="border-grayd text-gray5 rounded-sm border border-solid px-4 py-1 text-xs hover:no-underline">
            Supply
          </AccordionTrigger>
        </div>
      </div>
      <AccordionContent className="p-2">
        <div className="flex items-center justify-between">
          <Input
            type="number"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-[49%] hover:border-black"
            placeholder="amount"
          />
          <Button
            className="w-[49%]"
            disabled={amount === "0" || amount === ""}
            onClick={async () => {
              await stake(client!!, getTokenId(tokenName), UInt64.from(amount));
              setAmount("");
            }}
          >
            Stake {amount && amount !== "0" && `${amount} ${tokenName}`}
          </Button>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

export default Supply;

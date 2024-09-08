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
import { UInt64 } from "@proto-kit/library";
import { useState } from "react";

interface WithdrawProps {
  tokenName: AppChainTokens;
  stake: bigint | undefined;
  tokenPrice: string | undefined;
}

const Withdraw = ({ tokenName, stake, tokenPrice }: WithdrawProps) => {
  const { client } = useClientStore();
  const { withdraw: unstake } = useMutuumStore();
  const [amount, setAmount] = useState<string>("");

  return (
    <AccordionItem value={tokenName} className="border-b-0 p-0">
      <div className="border-graye grid grid-cols-3 border-t border-solid p-2">
        <div className="flex items-center">
          <p className="text-xs">{tokenName}</p>
        </div>
        <div className="flex items-center">
          <div className="text-sm">
            <p>{Number(stake ?? 0)}</p>
            <p className="text-[9px] font-extrabold">
              {!stake
                ? "0"
                : tokenPrice
                  ? (Number(stake) * Number(tokenPrice)).toLocaleString(
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
        <div className="flex items-center justify-center">
          <AccordionTrigger className="border-grayd text-gray5 rounded-sm border border-solid px-4 py-1 text-xs hover:no-underline">
            Withdraw
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
              await unstake(
                client!!,
                getTokenId(tokenName),
                UInt64.from(amount),
              );
              setAmount("");
            }}
          >
            Withdraw {amount && amount !== "0" && `${amount} ${tokenName}`}
          </Button>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

export default Withdraw;

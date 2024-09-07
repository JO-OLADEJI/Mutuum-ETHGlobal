import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { AppChainTokens } from "@/lib/types";

interface SupplyProps {
  tokenName: AppChainTokens;
  balance: string | undefined;
  tokenPrice: string | undefined;
}

const Supply = ({ tokenName, balance, tokenPrice }: SupplyProps) => {
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
          <Input className="w-[49%]" placeholder="supply tokens here" />
          <Button className="w-[49%]">Execute</Button>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

export default Supply;

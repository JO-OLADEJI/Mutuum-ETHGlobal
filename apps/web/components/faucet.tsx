"use client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel } from "./ui/form";
import { useForm } from "react-hook-form";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { useState } from "react";
import { PublicKey } from "o1js";
import { UInt64, TokenId } from "@proto-kit/library";
import { useAppStore } from "@/lib/stores/app";

export interface FaucetProps {
  wallet?: string;
  loading: boolean;
  trfLoading: boolean;
  onConnectWallet: () => void;
  onDrip: (tokenId: TokenId) => void;
  onTransfer: (to: PublicKey, amount: UInt64, tokenId: TokenId) => void;
}

export function Faucet({
  wallet,
  onConnectWallet,
  onDrip,
  onTransfer,
  loading,
  trfLoading,
}: FaucetProps) {
  const form = useForm();
  const [destAddr, setDestAddr] = useState<string>("");
  const [trfAmount, setTrfAmount] = useState<string>("");

  return (
    <Card className="w-full p-4">
      <div className="mb-2">
        <h2 className="text-xl font-bold">Faucet</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Get testing (L2) MINA tokens for your wallet
        </p>
      </div>
      <Form {...form}>
        <div className="pt-3">
          <FormField
            name="to"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  To{" "}
                  <span className="text-sm text-zinc-500">(your wallet)</span>
                </FormLabel>
                <FormControl>
                  <Input
                    disabled
                    placeholder={wallet ?? "Please connect a wallet first"}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <Button
          size={"lg"}
          type="submit"
          className="mt-6 w-full"
          loading={loading}
          onClick={() => {
            wallet ?? onConnectWallet();
            wallet && onDrip(TokenId.from(0));
          }}
        >
          {wallet ? "Drip 💦" : "Connect wallet"}
        </Button>
      </Form>

      <Separator className="my-6" orientation={"horizontal"} />
      <h2 className="mb-1 text-xl font-bold">Send Funds</h2>
      <div>
        <Input
          disabled={!wallet}
          className="mb-2"
          placeholder={"Destination Address"}
          value={destAddr}
          onChange={(e) => setDestAddr(e.target.value)}
        />
        <Input
          type="number"
          disabled={!wallet}
          placeholder={"Amount"}
          value={trfAmount}
          onChange={(e) => setTrfAmount(e.target.value)}
        />
        <Button
          disabled={!wallet}
          size={"lg"}
          type="submit"
          className="mt-6 w-full"
          loading={trfLoading}
          onClick={() => {
            if (!destAddr || !trfAmount) return;
            onTransfer(
              PublicKey.fromBase58(destAddr),
              UInt64.from(trfAmount),
              TokenId.from(0),
            );
          }}
        >
          Send
        </Button>
      </div>
    </Card>
  );
}

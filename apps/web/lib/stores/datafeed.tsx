import { useCallback } from "react";
import { useClientStore } from "./client";
import { useWalletStore } from "./wallet";
import { PublicKey } from "o1js";
import { USDRates } from "chain/dist/runtime/modules/mutuum";
import useTokenPricesUSD from "./rates";
import { TOKENS } from "../constants";
import { getTokenId } from "../utils";
import { UInt64 } from "@proto-kit/library";

export const useDatafeed = () => {
  const { client } = useClientStore();
  const { wallet } = useWalletStore();
  const tokenPrices = useTokenPricesUSD();

  return useCallback(async () => {
    // if (!wallet || !client) return;

    const mutuum = client!!.runtime.resolve("Mutuum");
    const data = USDRates.empty();

    for (let i = 0; i < TOKENS.length; i++) {
      data.tokenIds[i] = getTokenId(TOKENS[i]);
      data.rates[i] = UInt64.from(
        Math.round(Number(tokenPrices[TOKENS[i]]) * 10 ** 8),
      );
    }

    const tx = await client!!.transaction(
      PublicKey.fromBase58(wallet!!),
      async () => {
        mutuum.dataFeed.setUSDRates(data);
      },
    );
    await tx.sign();
    await tx.send();
  }, [tokenPrices, client, wallet]);
};

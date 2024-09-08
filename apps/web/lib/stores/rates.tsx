import { useCallback, useEffect, useState } from "react";
import { createPublicClient, http, formatUnits } from "viem";
import axios from "axios";
import { mainnet } from "viem/chains";
import {
  AGGREGATORV3_ABI,
  COINGECKO_MINA_ID,
  TOKENS,
  TOKENS_PRICEFEED,
  PRICEFEED_REFRESH_INTERVAL,
} from "../constants";
import { AppChainTokens } from "../types";

const publicClient = createPublicClient({
  chain: mainnet,
  transport: http(),
});

const useTokenPricesUSD = () => {
  const [tokenPrices, setTokenPrices] = useState<
    Partial<{ [key in AppChainTokens]: string }>
  >({});

  const fetchPrices = useCallback(async () => {
    const priceMap: Partial<{ [key in AppChainTokens]: string }> = {};

    try {
      const minaPrice = await axios.get(
        `https://api.coingecko.com/api/v3/simple/price/?ids=${COINGECKO_MINA_ID}&vs_currencies=usd`,
        {
          headers: {
            "Content-Type": "application/json",
            // "x-cg-demo-api-key": process.env.NEXT_PUBLIC_COINGECKO_API_KEY,
            "x-cg-demo-api-key": "CG-WZhGEf2cu4ZxyEtmhTWxfdGf",
          },
        },
      );
      const otherPrices = await Promise.all(
        TOKENS.slice(1).map((name) =>
          publicClient.readContract({
            address: TOKENS_PRICEFEED[name],
            abi: AGGREGATORV3_ABI,
            functionName: "latestRoundData",
          }),
        ),
      );

      priceMap["mMINA"] = minaPrice["data"]["mina-protocol"]["usd"].toString();
      otherPrices.forEach((value, index) => {
        priceMap[TOKENS[index + 1]] = formatUnits(value[1], 8);
      });
      setTokenPrices(() => priceMap);
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    fetchPrices();
  }, []);

  useEffect(() => {
    const refresh = setInterval(
      () => fetchPrices(),
      PRICEFEED_REFRESH_INTERVAL,
    );
    return () => clearInterval(refresh);
  }, [fetchPrices]);

  return tokenPrices;
};

export default useTokenPricesUSD;

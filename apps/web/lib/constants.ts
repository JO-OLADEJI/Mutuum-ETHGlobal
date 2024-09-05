import { AppChainTokens } from "./types";

export const TOKENS = [
  "mMINA",
  "mUNI",
  "mMATIC",
  "mUSDT",
  "mARB",
  "mLINK",
] as const;

// ethereum mainnet
export const TOKENS_PRICEFEED: { [key in AppChainTokens]: `0x${string}` } = {
  mMINA: "0x",
  mUNI: "0x553303d460EE0afB37EdFf9bE42922D8FF63220e",
  mMATIC: "0x7bAC85A8a13A4BcD8abb3eB7d6b4d632c5a57676",
  mUSDT: "0x3E7d1eAB13ad0104d2750B8863b489D65364e32D",
  mARB: "0x31697852a68433DbCc2Ff612c516d69E3D9bd08F",
  mLINK: "0x2c1d072e956AFFC0D435Cb7AC38EF18d24d9127c",
};

export const PRICEFEED_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

export const COINGECKO_MINA_ID = "mina-protocol";

export const AGGREGATORV3_ABI = [
  {
    inputs: [],
    name: "decimals",
    outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "description",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint80", name: "_roundId", type: "uint80" }],
    name: "getRoundData",
    outputs: [
      { internalType: "uint80", name: "roundId", type: "uint80" },
      { internalType: "int256", name: "answer", type: "int256" },
      { internalType: "uint256", name: "startedAt", type: "uint256" },
      { internalType: "uint256", name: "updatedAt", type: "uint256" },
      { internalType: "uint80", name: "answeredInRound", type: "uint80" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "latestRoundData",
    outputs: [
      { internalType: "uint80", name: "roundId", type: "uint80" },
      { internalType: "int256", name: "answer", type: "int256" },
      { internalType: "uint256", name: "startedAt", type: "uint256" },
      { internalType: "uint256", name: "updatedAt", type: "uint256" },
      { internalType: "uint80", name: "answeredInRound", type: "uint80" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "version",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

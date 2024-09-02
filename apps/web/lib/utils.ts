import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { AppChainTokens } from "./types";
import { TokenId } from "@proto-kit/library";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getTokenId = (token: AppChainTokens): TokenId => {
  switch (token) {
    case "mMINA":
      return TokenId.from(0);
    case "mBTC":
      return TokenId.from(1);
    case "mETH":
      return TokenId.from(2);
    case "mDEGEN":
      return TokenId.from(3);
    case "mPROTO":
      return TokenId.from(4);
    case "mFLY":
      return TokenId.from(5);
  }
};

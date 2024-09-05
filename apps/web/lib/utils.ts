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
    case "mUNI":
      return TokenId.from(1);
    case "mMATIC":
      return TokenId.from(2);
    case "mUSDT":
      return TokenId.from(3);
    case "mARB":
      return TokenId.from(4);
    case "mLINK":
      return TokenId.from(5);
  }
};

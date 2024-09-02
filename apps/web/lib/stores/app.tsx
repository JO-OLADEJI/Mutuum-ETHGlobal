import { create } from "zustand";
import { TokenId } from "@proto-kit/library";
import { getTokenId } from "../utils";
// import { BalancesState, useBalancesStore } from "./balances";
// import { useWalletStore } from "./wallet";

interface AppState {
  activeTokenId: TokenId;
  setActiveTokenId: (id: TokenId) => void;
}

export const useAppStore = create<AppState>()((set) => ({
  activeTokenId: getTokenId("mMINA"),
  setActiveTokenId: (id) => {
    set((state) => ({ activeTokenId: id }));

    // below: purely just for a good ux - change balance to a skeleton loader (before a new query for updated balances)
    // const uxChanges: Partial<BalancesState> = { loading: true };
    // const connectedWallet = useWalletStore.getState().wallet;
    // if (connectedWallet) {
    //   const placeholderObject: { [key: string]: string } = {};
    //   placeholderObject[connectedWallet] = "";
    //   uxChanges.balances = placeholderObject;
    // }
    // useBalancesStore.setState(uxChanges);
  },
}));

import { create } from "zustand";

interface AppState {
  hasRefreshedDataFeed: boolean;
  setHasRefreshedDataFeed: (to: boolean) => void;
}

export const useAppStore = create<AppState>()((set) => ({
  hasRefreshedDataFeed: false,
  setHasRefreshedDataFeed: (to) => {
    set((state) => ({ hasRefreshedDataFeed: to }));
  },
}));

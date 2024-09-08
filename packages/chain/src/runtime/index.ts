import { Balance, VanillaRuntimeModules } from "@proto-kit/library";
import { ModulesConfig } from "@proto-kit/common";

import { Balances } from "./modules/balances";
import { Mutuum, DataFeed } from "./modules/mutuum";
import { PublicKey } from "o1js";

export const modules = VanillaRuntimeModules.with({
  Balances,
  DataFeed,
  Mutuum,
});

export const config: ModulesConfig<typeof modules> = {
  Balances: {
    totalSupply: Balance.from(21_000_000),
  },
  DataFeed: {},
  Mutuum: {
    moderator: PublicKey.fromBase58(
      // TODO: read this from a config file
      "B62qpoD3dHu9w69bJkGfujATwMAHiK6AoAzANez8pyghCvbw3koha13",
    ),
    CHAIN_VAULT: PublicKey.fromBase58(
      "B62qqetDk1TAG3sso1CtgZ9MvLYu6msUiBtSukvSeCxsshQmvJM9eDe",
    ),
  },
};

export default {
  modules,
  config,
};

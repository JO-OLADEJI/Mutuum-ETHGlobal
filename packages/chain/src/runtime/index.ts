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
      "B62qpoD3dHu9w69bJkGfujATwMAHiK6AoAzANez8pyghCvbw3koha13",
    ),
  },
};

export default {
  modules,
  config,
};

import { Balance, VanillaRuntimeModules } from "@proto-kit/library";
import { Balances } from "./modules/balances";
export const modules = VanillaRuntimeModules.with({
    Balances,
});
export const config = {
    Balances: {
        totalSupply: Balance.from(10000),
    },
};
export default {
    modules,
    config,
};

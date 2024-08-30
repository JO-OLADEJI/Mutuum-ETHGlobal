import { ModulesConfig } from "@proto-kit/common";
import { Balances } from "./modules/balances";
export declare const modules: {
    Balances: typeof import("@proto-kit/library").Balances;
} & {
    Balances: typeof Balances;
};
export declare const config: ModulesConfig<typeof modules>;
declare const _default: {
    modules: {
        Balances: typeof import("@proto-kit/library").Balances;
    } & {
        Balances: typeof Balances;
    };
    config: ModulesConfig<{
        Balances: typeof import("@proto-kit/library").Balances;
    } & {
        Balances: typeof Balances;
    }>;
};
export default _default;
//# sourceMappingURL=index.d.ts.map
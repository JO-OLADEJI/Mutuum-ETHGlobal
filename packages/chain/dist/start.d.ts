import { Startable } from "@proto-kit/deployment";
import { LogLevelDesc } from "loglevel";
export interface Arguments {
    appChain: string;
    pruneOnStartup: boolean;
    logLevel: LogLevelDesc;
}
export type AppChainFactory = (args: Arguments) => Promise<Startable>;
//# sourceMappingURL=start.d.ts.map
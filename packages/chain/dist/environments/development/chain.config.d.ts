import { AppChain } from "@proto-kit/sdk";
import { DatabasePruneModule } from "@proto-kit/sequencer";
import { PrismaRedisDatabase } from "@proto-kit/persistance";
import { Startable } from "@proto-kit/deployment";
import { Arguments } from "../../start";
export declare const appChain: AppChain<{
    Balances: typeof import("@proto-kit/library").Balances;
} & {
    Balances: typeof import("../../runtime/modules/balances").Balances;
}, import("@proto-kit/protocol").MandatoryProtocolModulesRecord & {
    TransactionFee: typeof import("@proto-kit/library").TransactionFeeHook;
}, {
    DatabasePruneModule: typeof DatabasePruneModule;
    Mempool: typeof import("@proto-kit/sequencer").PrivateMempool;
    BlockProducerModule: typeof import("@proto-kit/sequencer").BlockProducerModule;
    BlockTrigger: typeof import("@proto-kit/sequencer").TimedBlockTrigger;
    GraphqlServer: typeof import("@proto-kit/api").GraphqlServer;
    Graphql: import("@proto-kit/sequencer").TypedClass<import("@proto-kit/api").GraphqlSequencerModule<{
        MempoolResolver: typeof import("@proto-kit/api").MempoolResolver;
        QueryGraphqlModule: typeof import("@proto-kit/api").QueryGraphqlModule;
        BatchStorageResolver: typeof import("@proto-kit/api").BatchStorageResolver;
        NodeStatusResolver: typeof import("@proto-kit/api").NodeStatusResolver;
        BlockResolver: typeof import("@proto-kit/api").BlockResolver;
        MerkleWitnessResolver: typeof import("@proto-kit/api").MerkleWitnessResolver;
    }>>;
    Database: typeof PrismaRedisDatabase;
}, {
    TransactionSender: typeof import("@proto-kit/sdk").InMemoryTransactionSender;
    QueryTransportModule: typeof import("@proto-kit/sdk").StateServiceQueryModule;
    NetworkStateTransportModule: typeof import("@proto-kit/sdk").BlockStorageNetworkStateModule;
}>;
declare const _default: (args: Arguments) => Promise<Startable>;
export default _default;
//# sourceMappingURL=chain.config.d.ts.map
import { GraphqlSequencerModule, GraphqlServer } from "@proto-kit/api";
import { PrivateMempool, TimedBlockTrigger, BlockProducerModule } from "@proto-kit/sequencer";
export declare const apiSequencerModules: {
    GraphqlServer: typeof GraphqlServer;
    Graphql: import("@proto-kit/sequencer").TypedClass<GraphqlSequencerModule<{
        MempoolResolver: typeof import("@proto-kit/api").MempoolResolver;
        QueryGraphqlModule: typeof import("@proto-kit/api").QueryGraphqlModule;
        BatchStorageResolver: typeof import("@proto-kit/api").BatchStorageResolver;
        NodeStatusResolver: typeof import("@proto-kit/api").NodeStatusResolver;
        BlockResolver: typeof import("@proto-kit/api").BlockResolver;
        MerkleWitnessResolver: typeof import("@proto-kit/api").MerkleWitnessResolver;
    }>>;
};
export declare const apiSequencerModulesConfig: {
    Graphql: {
        MempoolResolver: {};
        QueryGraphqlModule: {};
        BatchStorageResolver: {};
        NodeStatusResolver: {};
        BlockResolver: {};
        MerkleWitnessResolver: {};
    };
    GraphqlServer: {
        port: number;
        host: string;
        graphiql: boolean;
    };
};
export declare const baseSequencerModules: {
    Mempool: typeof PrivateMempool;
    BlockProducerModule: typeof BlockProducerModule;
    BlockTrigger: typeof TimedBlockTrigger;
    GraphqlServer: typeof GraphqlServer;
    Graphql: import("@proto-kit/sequencer").TypedClass<GraphqlSequencerModule<{
        MempoolResolver: typeof import("@proto-kit/api").MempoolResolver;
        QueryGraphqlModule: typeof import("@proto-kit/api").QueryGraphqlModule;
        BatchStorageResolver: typeof import("@proto-kit/api").BatchStorageResolver;
        NodeStatusResolver: typeof import("@proto-kit/api").NodeStatusResolver;
        BlockResolver: typeof import("@proto-kit/api").BlockResolver;
        MerkleWitnessResolver: typeof import("@proto-kit/api").MerkleWitnessResolver;
    }>>;
};
export declare const baseSequencerModulesConfig: {
    Mempool: {};
    BlockProducerModule: {};
    BlockTrigger: {
        blockInterval: number;
        produceEmptyBlocks: true;
    };
    Graphql: {
        MempoolResolver: {};
        QueryGraphqlModule: {};
        BatchStorageResolver: {};
        NodeStatusResolver: {};
        BlockResolver: {};
        MerkleWitnessResolver: {};
    };
    GraphqlServer: {
        port: number;
        host: string;
        graphiql: boolean;
    };
};
//# sourceMappingURL=index.d.ts.map
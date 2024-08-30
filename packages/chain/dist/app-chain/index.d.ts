import { BlockStorageNetworkStateModule, InMemoryTransactionSender, StateServiceQueryModule } from "@proto-kit/sdk";
export declare const baseAppChainModules: {
    TransactionSender: typeof InMemoryTransactionSender;
    QueryTransportModule: typeof StateServiceQueryModule;
    NetworkStateTransportModule: typeof BlockStorageNetworkStateModule;
};
export declare const baseAppChainModulesConfig: {
    QueryTransportModule: {};
    NetworkStateTransportModule: {};
    TransactionSender: {};
};
//# sourceMappingURL=index.d.ts.map
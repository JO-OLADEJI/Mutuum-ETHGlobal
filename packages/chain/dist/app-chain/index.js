import { BlockStorageNetworkStateModule, InMemoryTransactionSender, StateServiceQueryModule, } from "@proto-kit/sdk";
export const baseAppChainModules = {
    TransactionSender: InMemoryTransactionSender,
    QueryTransportModule: StateServiceQueryModule,
    NetworkStateTransportModule: BlockStorageNetworkStateModule,
};
export const baseAppChainModulesConfig = {
    QueryTransportModule: {},
    NetworkStateTransportModule: {},
    TransactionSender: {},
};

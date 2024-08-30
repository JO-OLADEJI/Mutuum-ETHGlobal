import { AuroSigner, ClientAppChain } from "@proto-kit/sdk";
export declare const client: ClientAppChain<{
    Balances: typeof import("@proto-kit/library").Balances;
} & {
    Balances: typeof import("@proto-kit/library").Balances;
} & {
    Balances: typeof import("../runtime/modules/balances").Balances;
}, import("@proto-kit/protocol").MandatoryProtocolModulesRecord & {
    TransactionFee: typeof import("@proto-kit/library").TransactionFeeHook;
}, {}, {
    GraphqlClient: typeof import("@proto-kit/sdk").GraphqlClient;
    Signer: import("@proto-kit/common").TypedClass<AuroSigner>;
    TransactionSender: typeof import("@proto-kit/sdk").GraphqlTransactionSender;
    QueryTransportModule: typeof import("@proto-kit/sdk").GraphqlQueryTransportModule;
    NetworkStateTransportModule: typeof import("@proto-kit/sdk").GraphqlNetworkStateTransportModule;
}>;
//# sourceMappingURL=client.config.d.ts.map
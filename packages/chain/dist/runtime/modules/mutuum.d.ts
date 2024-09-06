import { RuntimeModule } from "@proto-kit/module";
import { State, StateMap } from "@proto-kit/protocol";
import { NoConfig } from "@proto-kit/common";
import { TokenId, UInt64 } from "@proto-kit/library";
import { PublicKey } from "o1js";
import { Balances } from "./balances";
interface MutuumConfig {
    moderator: PublicKey;
}
declare const PositionKey_base: (new (value: {
    tokenId: TokenId;
    address: PublicKey;
}) => {
    tokenId: TokenId;
    address: PublicKey;
}) & {
    _isStruct: true;
} & Omit<import("o1js/dist/node/lib/provable/types/provable-intf").Provable<{
    tokenId: TokenId;
    address: PublicKey;
}, {
    tokenId: bigint;
    address: {
        x: bigint;
        isOdd: boolean;
    };
}>, "fromFields"> & {
    fromFields: (fields: import("o1js/dist/node/lib/provable/field").Field[]) => {
        tokenId: TokenId;
        address: PublicKey;
    };
} & {
    fromValue: (value: {
        tokenId: string | number | bigint | import("o1js/dist/node/lib/provable/field").Field | TokenId;
        address: PublicKey | {
            x: bigint | import("o1js/dist/node/lib/provable/field").Field;
            isOdd: boolean | import("o1js/dist/node/lib/provable/bool").Bool;
        };
    }) => {
        tokenId: TokenId;
        address: PublicKey;
    };
    toInput: (x: {
        tokenId: TokenId;
        address: PublicKey;
    }) => {
        fields?: import("o1js/dist/node/lib/provable/field").Field[] | undefined;
        packed?: [import("o1js/dist/node/lib/provable/field").Field, number][] | undefined;
    };
    toJSON: (x: {
        tokenId: TokenId;
        address: PublicKey;
    }) => {
        tokenId: string;
        address: string;
    };
    fromJSON: (x: {
        tokenId: string;
        address: string;
    }) => {
        tokenId: TokenId;
        address: PublicKey;
    };
    empty: () => {
        tokenId: TokenId;
        address: PublicKey;
    };
};
export declare class PositionKey extends PositionKey_base {
    static from(tokenId: TokenId, address: PublicKey): PositionKey;
}
declare const DebtPosition_base: (new (value: {
    tokenId: TokenId;
    debt: UInt64;
}) => {
    tokenId: TokenId;
    debt: UInt64;
}) & {
    _isStruct: true;
} & Omit<import("o1js/dist/node/lib/provable/types/provable-intf").Provable<{
    tokenId: TokenId;
    debt: UInt64;
}, {
    tokenId: bigint;
    debt: {
        value: bigint;
    };
}>, "fromFields"> & {
    fromFields: (fields: import("o1js/dist/node/lib/provable/field").Field[]) => {
        tokenId: TokenId;
        debt: UInt64;
    };
} & {
    fromValue: (value: {
        tokenId: string | number | bigint | import("o1js/dist/node/lib/provable/field").Field | TokenId;
        debt: UInt64 | {
            value: string | number | bigint | import("o1js/dist/node/lib/provable/field").Field;
        };
    }) => {
        tokenId: TokenId;
        debt: UInt64;
    };
    toInput: (x: {
        tokenId: TokenId;
        debt: UInt64;
    }) => {
        fields?: import("o1js/dist/node/lib/provable/field").Field[] | undefined;
        packed?: [import("o1js/dist/node/lib/provable/field").Field, number][] | undefined;
    };
    toJSON: (x: {
        tokenId: TokenId;
        debt: UInt64;
    }) => {
        tokenId: string;
        debt: {
            value: string;
        };
    };
    fromJSON: (x: {
        tokenId: string;
        debt: {
            value: string;
        };
    }) => {
        tokenId: TokenId;
        debt: UInt64;
    };
    empty: () => {
        tokenId: TokenId;
        debt: UInt64;
    };
};
export declare class DebtPosition extends DebtPosition_base {
    static from(tokenId: TokenId, address: PublicKey): PositionKey;
}
export declare class DataFeed<Config = NoConfig> extends RuntimeModule<Config> {
    tokenRates: StateMap<TokenId, UInt64>;
    setUSDRates(tokenId: TokenId, usdRate: UInt64): Promise<void>;
    getUSDRate(tokenId: TokenId): Promise<import("@proto-kit/protocol").Option<UInt64>>;
}
export declare class Mutuum extends RuntimeModule<MutuumConfig> {
    balances: Balances;
    dataFeed: DataFeed;
    CHAIN_VAULT: State<PublicKey>;
    deposits: StateMap<PositionKey, UInt64>;
    debts: StateMap<PositionKey, UInt64>;
    depositTokens: StateMap<PublicKey, UInt64[]>;
    borrowedTokens: StateMap<PublicKey, UInt64[]>;
    constructor(balances: Balances, dataFeed: DataFeed);
    setChainVault(address: PublicKey): Promise<void>;
    getHealthFactor(): Promise<void>;
    supply(tokenId: TokenId, amount: UInt64): Promise<void>;
    withdraw(tokenId: TokenId, amount: UInt64): Promise<void>;
    borrow(tokenId: TokenId, amount: UInt64): Promise<void>;
    repay(tokenId: TokenId, amount: UInt64): Promise<void>;
    private tokenIdToIndex;
    private tokenMapToTokenId;
    private getDepositUSD;
    private getDebtUSD;
    private getSafeTokenLoans;
}
export {};
//# sourceMappingURL=mutuum.d.ts.map
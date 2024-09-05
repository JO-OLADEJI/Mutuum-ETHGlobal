var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { RuntimeModule, runtimeModule, state, runtimeMethod, } from "@proto-kit/module";
import { State, assert, StateMap } from "@proto-kit/protocol";
import { TokenId, UInt64 } from "@proto-kit/library";
import { PublicKey, Bool, Struct, Provable } from "o1js";
import { Balances } from "./balances";
import { inject } from "tsyringe";
export class PositionKey extends Struct({
    tokenId: TokenId,
    address: PublicKey,
}) {
    static from(tokenId, address) {
        return new PositionKey({ tokenId, address });
    }
}
export class DebtPosition extends Struct({
    tokenId: TokenId,
    debt: UInt64,
}) {
    static from(tokenId, address) {
        return new PositionKey({ tokenId, address });
    }
}
let Mutuum = class Mutuum extends RuntimeModule {
    constructor(balances, dataFeed) {
        super();
        this.balances = balances;
        this.dataFeed = dataFeed;
        this.CHAIN_VAULT = State.from(PublicKey);
        this.deposits = StateMap.from(PositionKey, UInt64);
        this.debtPositions = StateMap.from(PublicKey, DebtPosition);
        this.depositTokens = StateMap.from(PublicKey, Provable.Array(UInt64, 10));
        this.borrowedTokens = StateMap.from(PublicKey, Provable.Array(UInt64, 10));
    }
    async setChainVault(address) {
        assert(this.transaction.sender.value.equals(this.config.moderator), "Unauthorized!");
        await this.CHAIN_VAULT.set(address);
    }
    async getHealthFactor() {
        // evaluate the user's deposit in USD
        // evaluate the user's debt position in USD
        // get the borrow threshold of 75% in USD
    }
    // @runtimeMethod()
    // public async attemptLiquidate(target: PublicKey) {}
    async supply(tokenId, amount) {
        const positionId = PositionKey.from(tokenId, this.transaction.sender.value);
        const chainVaultAddr = await this.CHAIN_VAULT.get();
        assert(chainVaultAddr.value.isEmpty().not(), "CHAIN_VAULT not set!");
        const depositTokenMap = await this.depositTokens.get(this.transaction.sender.value);
        depositTokenMap.value[this.tokenIdToIndex(tokenId)] = UInt64.from(1);
        await this.deposits.set(positionId, amount);
        await this.depositTokens.set(this.transaction.sender.value, depositTokenMap.value);
        await this.balances.transfer(tokenId, this.transaction.sender.value, chainVaultAddr.value, amount);
    }
    async withdraw(tokenId, amount) {
        const positionId = PositionKey.from(tokenId, this.transaction.sender.value);
        const chainVaultAddr = await this.CHAIN_VAULT.get();
        const currentPosition = await this.deposits.get(positionId);
        assert(currentPosition.value.greaterThan(UInt64.from(0)), "Null position!");
        assert(currentPosition.value.greaterThanOrEqual(amount), "Position value exceeded!");
        // TODO: check for health factor before withdrawal
        const newPosition = currentPosition.value.sub(amount);
        if (newPosition.equals(UInt64.from(0))) {
            const depositTokenMap = await this.depositTokens.get(this.transaction.sender.value);
            depositTokenMap.value[this.tokenIdToIndex(tokenId)] = UInt64.from(0);
            await this.depositTokens.set(this.transaction.sender.value, depositTokenMap.value);
        }
        await this.deposits.set(positionId, newPosition);
        await this.balances.transfer(tokenId, chainVaultAddr.value, this.transaction.sender.value, amount);
    }
    async borrow(tokenId, amount) {
        // 1. evaluate the user's deposit in USD
        const depositTokenMap = await this.depositTokens.get(this.transaction.sender.value);
        const depositTokenIds = this.tokenMapToTokenId(depositTokenMap.value);
        const depositTokensUSDRate = await this.dataFeed.getUSDRates(depositTokenIds);
        // create an data-feed oracle runtime module
        // PositionKey.from(tokenId, this.transaction.sender.value);
        // get the borrow threshold of 75% in USD
        // evaluate the user's debt position in USD
        // determine how much more the user can borrow
    }
    // @runtimeMethod()
    // public async repay() {}
    // helper methods
    tokenIdToIndex(tokenId) {
        for (let i = 0; i < 10; i++) {
            if (tokenId.equals(TokenId.from(i))) {
                return i;
            }
        }
        return 999;
    }
    tokenMapToTokenId(map) {
        const tokenIds = [];
        for (let i = 0; i < map.length; i++) {
            if (map[i].equals(UInt64.from(1))) {
                tokenIds.push(TokenId.from(i));
            }
        }
        return tokenIds;
    }
};
__decorate([
    state(),
    __metadata("design:type", Object)
], Mutuum.prototype, "CHAIN_VAULT", void 0);
__decorate([
    state(),
    __metadata("design:type", Object)
], Mutuum.prototype, "deposits", void 0);
__decorate([
    state(),
    __metadata("design:type", Object)
], Mutuum.prototype, "debtPositions", void 0);
__decorate([
    state(),
    __metadata("design:type", Object)
], Mutuum.prototype, "depositTokens", void 0);
__decorate([
    state(),
    __metadata("design:type", Object)
], Mutuum.prototype, "borrowedTokens", void 0);
__decorate([
    runtimeMethod(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [PublicKey]),
    __metadata("design:returntype", Promise)
], Mutuum.prototype, "setChainVault", null);
__decorate([
    runtimeMethod(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], Mutuum.prototype, "getHealthFactor", null);
__decorate([
    runtimeMethod(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [TokenId, UInt64]),
    __metadata("design:returntype", Promise)
], Mutuum.prototype, "supply", null);
__decorate([
    runtimeMethod(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [TokenId, UInt64]),
    __metadata("design:returntype", Promise)
], Mutuum.prototype, "withdraw", null);
__decorate([
    runtimeMethod(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [TokenId, UInt64]),
    __metadata("design:returntype", Promise)
], Mutuum.prototype, "borrow", null);
Mutuum = __decorate([
    runtimeModule(),
    __param(0, inject("Balances")),
    __param(1, inject("DataFeed")),
    __metadata("design:paramtypes", [Balances,
        DataFeed])
], Mutuum);
export { Mutuum };
let DataFeed = class DataFeed extends RuntimeModule {
    constructor() {
        super(...arguments);
        // tokenId => USD Rate (8 decimals precision)
        this.tokenRates = StateMap.from(TokenId, UInt64);
    }
    async setUSDRates(tokenIds, usdRates) {
        // TODO: implement some access control
        assert(Bool.fromValue(tokenIds.length === usdRates.length), "Data length mismatch!");
        for (let i = 0; i < tokenIds.length; i++) {
            await this.tokenRates.set(tokenIds[i], usdRates[i]);
        }
    }
    async getUSDRates(tokenIds) {
        const usdRates = [];
        for (let i = 0; i < tokenIds.length; i++) {
            const tokenRate = await this.tokenRates.get(tokenIds[i]);
            usdRates.push(tokenRate.value);
        }
        return usdRates;
    }
};
__decorate([
    state(),
    __metadata("design:type", Object)
], DataFeed.prototype, "tokenRates", void 0);
__decorate([
    runtimeMethod(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array, Array]),
    __metadata("design:returntype", Promise)
], DataFeed.prototype, "setUSDRates", null);
__decorate([
    runtimeMethod(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array]),
    __metadata("design:returntype", Promise)
], DataFeed.prototype, "getUSDRates", null);
DataFeed = __decorate([
    runtimeModule()
], DataFeed);
export { DataFeed };

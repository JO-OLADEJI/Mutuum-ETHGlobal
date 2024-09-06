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
import { PublicKey, Struct, Provable } from "o1js";
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
let DataFeed = class DataFeed extends RuntimeModule {
    constructor() {
        super(...arguments);
        // tokenId => USD Rate (8 decimals precision)
        this.tokenRates = StateMap.from(TokenId, UInt64);
    }
    async setUSDRates(tokenId, usdRate) {
        await this.tokenRates.set(tokenId, usdRate);
    }
    async getUSDRate(tokenId) {
        return await this.tokenRates.get(tokenId);
    }
};
__decorate([
    state(),
    __metadata("design:type", Object)
], DataFeed.prototype, "tokenRates", void 0);
__decorate([
    runtimeMethod(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [TokenId, UInt64]),
    __metadata("design:returntype", Promise)
], DataFeed.prototype, "setUSDRates", null);
__decorate([
    runtimeMethod(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [TokenId]),
    __metadata("design:returntype", Promise)
], DataFeed.prototype, "getUSDRate", null);
DataFeed = __decorate([
    runtimeModule()
], DataFeed);
export { DataFeed };
let Mutuum = class Mutuum extends RuntimeModule {
    constructor(balances, dataFeed) {
        super();
        this.balances = balances;
        this.dataFeed = dataFeed;
        // @state() public DEBT_THRESHOLD = State.from<UInt64>(UInt64);
        this.CHAIN_VAULT = State.from(PublicKey);
        this.deposits = StateMap.from(PositionKey, UInt64);
        this.debts = StateMap.from(PositionKey, UInt64);
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
        const chainVaultAddr = (await this.CHAIN_VAULT.get()).value;
        assert(chainVaultAddr.isEmpty().not(), "CHAIN_VAULT not set!");
        const depositTokenMap = await this.depositTokens.get(this.transaction.sender.value);
        depositTokenMap.value[this.tokenIdToIndex(tokenId)] = UInt64.from(1);
        await this.deposits.set(positionId, amount);
        await this.depositTokens.set(this.transaction.sender.value, depositTokenMap.value);
        await this.balances.transfer(tokenId, this.transaction.sender.value, chainVaultAddr, amount);
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
        const chainVaultAddr = (await this.CHAIN_VAULT.get()).value;
        const senderAddr = this.transaction.sender.value;
        const positionKey = PositionKey.from(tokenId, senderAddr);
        // 1. evaluate the user's debt position in USD
        const debtUSD = await this.getDebtUSD();
        // 2. evaluate the user's deposit in USD
        const depositUSD = await this.getDepositUSD();
        // 3. get the borrow threshold of 75% in USD
        const debtThresholdUSD = depositUSD.mul(75).div(100);
        assert(debtThresholdUSD.greaterThanOrEqual(debtUSD), "Under-collateralized position!");
        // 4. determine how much more the user can borrow
        const safeTokenLoans = await this.getSafeTokenLoans(debtThresholdUSD.sub(debtUSD));
        const chainVaultDebtTokenBalance = await this.balances.getBalance(tokenId, chainVaultAddr);
        const maxTokenAllowedDebt = safeTokenLoans[this.tokenIdToIndex(tokenId)];
        assert(maxTokenAllowedDebt.greaterThanOrEqual(amount), "Debt threshold exceeded!");
        assert(chainVaultDebtTokenBalance.greaterThanOrEqual(amount), "Insufficient vault liquidity!");
        // 5. lend user the tokens
        const outstandingTokenDebt = await this.debts.get(positionKey);
        const debtTokenMap = await this.borrowedTokens.get(senderAddr);
        debtTokenMap.value[this.tokenIdToIndex(tokenId)] = UInt64.from(1);
        await this.debts.set(positionKey, outstandingTokenDebt.value.add(amount));
        await this.borrowedTokens.set(senderAddr, debtTokenMap.value);
        await this.balances.transfer(tokenId, chainVaultAddr, senderAddr, amount);
    }
    async repay(tokenId, amount) {
        // adjust borrow position
        const chainVaultAddr = (await this.CHAIN_VAULT.get()).value;
        const senderAddr = this.transaction.sender.value;
        const positionKey = PositionKey.from(tokenId, senderAddr);
        const pendingDebt = await this.balances.getBalance(tokenId, senderAddr);
        // if debt is totally cleared, the token map should be updated
        if (Number(amount.greaterThanOrEqual(pendingDebt).value.toString()[4])) {
            await this.debts.set(positionKey, UInt64.from(0));
            const debtTokenMap = await this.borrowedTokens.get(senderAddr);
            debtTokenMap.value[this.tokenIdToIndex(tokenId)] = UInt64.from(0);
            await this.borrowedTokens.set(senderAddr, debtTokenMap.value);
            await this.balances.transfer(tokenId, senderAddr, chainVaultAddr, pendingDebt);
        }
        else {
            await this.debts.set(positionKey, pendingDebt.sub(amount));
            await this.balances.transfer(tokenId, senderAddr, chainVaultAddr, amount);
        }
    }
    // helper methods
    tokenIdToIndex(tokenId) {
        for (let i = 0; i < 10; i++) {
            if (Number(tokenId.equals(TokenId.from(i)).value.toString()[4])) {
                return i;
            }
        }
        return 999;
    }
    tokenMapToTokenId(map) {
        const tokenIds = [];
        for (let i = 0; i < map.length; i++) {
            if (Number(map[i].equals(UInt64.from(1)).value.toString()[4])) {
                tokenIds.push(TokenId.from(i));
            }
        }
        return tokenIds;
    }
    async getDepositUSD() {
        let depositValueUSD = UInt64.from(0);
        const depositTokenMap = await this.depositTokens.get(this.transaction.sender.value);
        if (depositTokenMap.value.length === 0) {
            return UInt64.from(0);
        }
        const depositTokenIds = this.tokenMapToTokenId(depositTokenMap.value);
        for (let i = 0; i < depositTokenIds.length; i++) {
            const dep = await this.deposits.get(PositionKey.from(depositTokenIds[i], this.transaction.sender.value));
            const usdRate = await this.dataFeed.getUSDRate(depositTokenIds[i]);
            depositValueUSD = depositValueUSD.add(dep.value.mul(usdRate.value));
        }
        return depositValueUSD;
    }
    async getDebtUSD() {
        let debtValueUSD = UInt64.from(0);
        const debtTokenMap = await this.borrowedTokens.get(this.transaction.sender.value);
        if (debtTokenMap.value.length === 0) {
            return UInt64.from(0);
        }
        const debtTokenIds = this.tokenMapToTokenId(debtTokenMap.value);
        for (let i = 0; i < debtTokenIds.length; i++) {
            const debt = await this.debts.get(PositionKey.from(debtTokenIds[i], this.transaction.sender.value));
            const usdRate = await this.dataFeed.getUSDRate(debtTokenIds[i]);
            debtValueUSD = debtValueUSD.add(debt.value.mul(usdRate.value));
            Provable.log("Debt (USD): ", debtValueUSD);
        }
        return debtValueUSD;
    }
    async getSafeTokenLoans(safeUSDLoan) {
        const safeLoansIndexedByTokenId = [];
        for (let i = 0; i < 10; i++) {
            const tokenUSDRate = await this.dataFeed.getUSDRate(TokenId.from(i));
            if (Number(tokenUSDRate.value.equals(UInt64.from(0)).not().value.toString()[4])) {
                const safeTokenLoan = safeUSDLoan.div(tokenUSDRate.value);
                safeLoansIndexedByTokenId.push(safeTokenLoan);
            }
            else {
                safeLoansIndexedByTokenId.push(UInt64.from(0));
            }
        }
        return safeLoansIndexedByTokenId;
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
], Mutuum.prototype, "debts", void 0);
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
__decorate([
    runtimeMethod(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [TokenId, UInt64]),
    __metadata("design:returntype", Promise)
], Mutuum.prototype, "repay", null);
Mutuum = __decorate([
    runtimeModule(),
    __param(0, inject("Balances")),
    __param(1, inject("DataFeed")),
    __metadata("design:paramtypes", [Balances,
        DataFeed])
], Mutuum);
export { Mutuum };

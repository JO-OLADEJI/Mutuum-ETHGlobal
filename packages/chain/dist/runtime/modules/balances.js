var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { runtimeModule, state, runtimeMethod } from "@proto-kit/module";
import { State, assert } from "@proto-kit/protocol";
import { Balance, Balances as BaseBalances, TokenId } from "@proto-kit/library";
import { PublicKey } from "o1js";
let Balances = class Balances extends BaseBalances {
    constructor() {
        super(...arguments);
        this.circulatingSupply = State.from(Balance);
    }
    async addBalance(tokenId, address, amount) {
        const circulatingSupply = await this.circulatingSupply.get();
        const newCirculatingSupply = Balance.from(circulatingSupply.value).add(amount);
        assert(newCirculatingSupply.lessThanOrEqual(this.config.totalSupply), "Circulating supply would be higher than total supply");
        await this.circulatingSupply.set(newCirculatingSupply);
        await this.mint(tokenId, address, amount);
    }
};
__decorate([
    state(),
    __metadata("design:type", Object)
], Balances.prototype, "circulatingSupply", void 0);
__decorate([
    runtimeMethod(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [TokenId,
        PublicKey,
        Balance]),
    __metadata("design:returntype", Promise)
], Balances.prototype, "addBalance", null);
Balances = __decorate([
    runtimeModule()
], Balances);
export { Balances };

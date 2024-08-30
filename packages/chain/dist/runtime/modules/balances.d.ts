import { State } from "@proto-kit/protocol";
import { Balance, Balances as BaseBalances, TokenId } from "@proto-kit/library";
import { PublicKey } from "o1js";
interface BalancesConfig {
    totalSupply: Balance;
}
export declare class Balances extends BaseBalances<BalancesConfig> {
    circulatingSupply: State<Balance>;
    addBalance(tokenId: TokenId, address: PublicKey, amount: Balance): Promise<void>;
}
export {};
//# sourceMappingURL=balances.d.ts.map
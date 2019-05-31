import { Receipt } from "@blockstack/clarity";
import { Transaction, Evaluation, Principal } from "@blockstack/clarity/src";

export declare class RocketTokenHelper {
  transfer(to: Principal, value: number): Transaction;
  balanceOf(owner: Principal): Evaluation;
  totalSupply(): Evaluation;
}

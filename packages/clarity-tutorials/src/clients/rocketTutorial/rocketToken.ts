// import { Client, Receipt } from "../../../../clarity/src";

export class RocketTokenClient {
  name = "rocket-token";
  filePath = "contracts/rocket-tutorial/rocket-token.scm";

  // async transfer(to: string, value: number, params: { sender: string }): Promise<Receipt> {
  //   const tx = this.createTransaction({
  //     method: { name: "transfer", args: [`'${to}`, `${value}`] }
  //   });
  //   tx.sign(params.sender);
  //   const res = await this.submitTransaction(tx);
  //   return res;
  // }

  // async balanceOf(owner: string): Promise<number> {
  //   const query = this.createEvaluation({ method: { name: "balance-of", args: [`'${owner}`] } });
  //   const res = await this.submitEvaluation(query);
  //   return parseInt(res.data.result);
  // }

  // async totalSupply(): Promise<number> {
  //   const query = this.createEvaluation({ method: { name: "get-total-supply", args: [] } });
  //   const res = await this.submitEvaluation(query);
  //   return parseInt(res.data.result);
  // }
}

import { Client, Receipt } from "../../../../clarity/src";

export class RocketMarketClient extends Client {
  name = "rocket-market";
  filePath = "contracts/rocket-tutorial/rocket-market.scm";

  async balanceOf(owner: string): Promise<number> {
    const query = this.createEvaluation({ method: { name: "balance-of", args: [`'${owner}`] } });
    const res = await this.submitEvaluation(query);
    return parseInt(res.data.result);
  }

  async ownerOf(tokenId: number): Promise<number> {
    const query = this.createEvaluation({ method: { name: "owner-of", args: [`${tokenId}`] } });
    const res = await this.submitEvaluation(query);
    return res.data.result.replace(/'/g, "");
  }

  async transfer(to: string, tokenId: number, params: { sender: string }): Promise<Receipt> {
    const tx = this.createTransaction({
      method: { name: "transfer", args: [`'${to}`, `${tokenId}`] }
    });
    tx.sign(params.sender);
    const res = await this.submitTransaction(tx);
    return res;
  }
}

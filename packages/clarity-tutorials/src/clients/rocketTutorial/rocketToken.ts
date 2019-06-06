import { Client, Receipt } from "@blockstack/clarity";

export class RocketTokenClient extends Client {
  name = "rocket-token";
  filePath = "contracts/rocket-tutorial/rocket-token.scm";

  async transfer(to: string, value: number, params: { sender: string }): Promise<Receipt> {
    const tx = this.createTransaction({
      method: { name: "transfer", args: [`'${to}`, `${value}`] }
    });
    await tx.sign(params.sender);
    const res = await this.submitTransaction(tx);
    return res;
  }

  async balanceOf(owner: string): Promise<number> {
    const query = this.createQuery({ method: { name: "balance-of", args: [`'${owner}`] } });
    const res = await this.submitQuery(query);
    return parseInt(res.data.result);
  }

  async totalSupply(): Promise<number> {
    const query = this.createQuery({ method: { name: "get-total-supply", args: [] } });
    const res = await this.submitQuery(query);
    return parseInt(res.data.result);
  }
}

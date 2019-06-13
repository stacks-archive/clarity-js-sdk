import { Client, Receipt } from "@blockstack/clarity";

export class RocketMarketClient extends Client {
  name = "rocket-market";
  filePath = "rocket-tutorial/rocket-market";

  async balanceOf(owner: string): Promise<number> {
    const query = this.createQuery({ method: { name: "balance-of", args: [`'${owner}`] } });
    const res = await this.submitQuery(query);
    return parseInt(res.result!);
  }

  async ownerOf(tokenId: number): Promise<string> {
    const query = this.createQuery({ method: { name: "owner-of", args: [`${tokenId}`] } });
    const res = await this.submitQuery(query);
    return res.result!.replace(/'/g, "");
  }

  async transfer(to: string, tokenId: number, params: { sender: string }): Promise<Receipt> {
    const tx = this.createTransaction({
      method: { name: "transfer", args: [`'${to}`, `${tokenId}`] }
    });
    await tx.sign(params.sender);
    const res = await this.submitTransaction(tx);
    return res;
  }
}

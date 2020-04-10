import { Client, Provider, Receipt, Result } from "@blockstack/clarity";

export class RocketMarketClient extends Client {
  constructor(provider: Provider) {
    super(
      "SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB.rocket-market",
      "rocket-tutorial/rocket-market",
      provider
    );
  }

  async balanceOf(owner: string): Promise<number> {
    const query = this.createQuery({ atChaintip: true, method: { name: "balance-of", args: [`'${owner}`] } });
    const res = await this.submitQuery(query);
    return Result.unwrapUInt(res);
    // return parseInt(Result.unwrap(res));
  }

  async ownerOf(tokenId: number): Promise<string> {
    const query = this.createQuery({ atChaintip: true, method: { name: "owner-of", args: [`${tokenId}`] } });
    const res = await this.submitQuery(query);
    return Result.unwrap(res).replace(/'/g, "");
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

import { Client, Provider, Receipt, Result } from "@blockstack/clarity";

export class RocketFactoryClient extends Client {
  constructor(provider: Provider) {
    super("rocket-factory", "rocket-tutorial/rocket-factory", provider);
  }

  async canUserBuy(user: string): Promise<boolean> {
    const query = this.createQuery({ method: { name: "can-user-buy", args: [`'${user}`] } });
    const res = await this.submitQuery(query);
    return res.result === "true";
  }

  async canUserClaim(user: string): Promise<boolean> {
    const query = this.createQuery({ method: { name: "can-user-claim", args: [`'${user}`] } });
    const res = await this.submitQuery(query);
    return res.result === "true";
  }

  async rocketClaimableAt(user: string): Promise<number> {
    const query = this.createQuery({ method: { name: "rocket-claimable-at", args: [`'${user}`] } });
    const res = await this.submitQuery(query);
    return parseInt(Result.unwrap(res));
  }

  async orderRocket(size: number, params: { sender: string }): Promise<Receipt> {
    const tx = this.createTransaction({
      method: { name: "order-rocket", args: [`${size}`] }
    });
    await tx.sign(params.sender);
    const res = await this.submitTransaction(tx);
    return res;
  }

  async claimRocket(params: { sender: string }): Promise<Receipt> {
    const tx = this.createTransaction({
      method: { name: "claim-rocket", args: [] }
    });
    await tx.sign(params.sender);
    const res = await this.submitTransaction(tx);
    return res;
  }
}

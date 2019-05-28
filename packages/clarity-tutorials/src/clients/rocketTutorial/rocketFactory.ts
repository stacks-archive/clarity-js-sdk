import { Client, Receipt } from "../../../../clarity/src";

export class RocketFactoryClient extends Client {
  name = "rocket-factory";
  filePath = "contracts/rocket-tutorial/rocket-factory.scm";

  async canUserBuy(user: string): Promise<boolean> {
    const query = this.createQuery({ method: { name: "can-user-buy", args: [`'${user}`] } });
    const res = await this.submitQuery(query);
    return res.data.result === "true";
  }

  async buyRocket(size: number, params: { sender: string }): Promise<Receipt> {
    const tx = this.createTransaction({
      method: { name: "buy-rocket", args: [`${size}`] }
    });
    tx.sign(params.sender);
    const res = await this.submitTransaction(tx);
    return res;
  }
}

import { Receipt } from "../../../../clarity/src";

export class RocketFactoryClient {
  name = "rocket-factory";
  filePath = "contracts/rocket-tutorial/rocket-factory.scm";

  //   async canUserBuy(user: string): Promise<boolean> {
  //     // const query = this.createEvaluation({ method: { name: "can-user-buy", args: [`'${user}`] } });
  //     // const res = await this.submitEvaluation(query);
  //     // return res.data.result === "true";
  //   }

  //   async canUserClaim(user: string): Promise<boolean> {
  //     const query = this.createEvaluation({ method: { name: "can-user-claim", args: [`'${user}`] } });
  //     const res = await this.submitEvaluation(query);
  //     return res.data.result === "true";
  //   }

  //   async rocketClaimableAt(user: string): Promise<number> {
  //     const query = this.createEvaluation({
  //       method: { name: "rocket-claimable-at", args: [`'${user}`] }
  //     });
  //     const res = await this.submitEvaluation(query);
  //     return parseInt(res.data.result);
  //   }

  async orderRocket(size: number, params: { acl: string } = { acl: "public" }): Promise<boolean> {
    return Promise.resolve(true);
  }

  //   async claimRocket(params: { sender: string }): Promise<Receipt> {
  //     const tx = this.createTransaction({
  //       method: { name: "claim-rocket", args: [] }
  //     });
  //     tx.sign(params.sender);
  //     const res = await this.submitTransaction(tx);
  //     return res;
  //   }
}

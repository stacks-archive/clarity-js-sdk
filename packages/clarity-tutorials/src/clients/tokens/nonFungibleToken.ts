import { Client, Receipt } from "../../../../clarity/src";

export class NonFungibleTokenClient extends Client {
  name = "rkt-stock";
  filePath = "contracts/tokens/non-fungible-token.scm";

  async balanceOf(owner: string): Promise<number> {
    const query = this.createQuery({ method: { name: "balance-of", args: [`'${owner}`] } });
    const res = await this.submitQuery(query);
    return parseInt(res.data.result);
  }

  async ownerOf(tokenId: number): Promise<number> {
    const query = this.createQuery({ method: { name: "owner-of", args: [`${tokenId}`] } });
    const res = await this.submitQuery(query);
    return res.data.result.replace(/'/g, "");
  }

  async canTransfer(actor: string, tokenId: number): Promise<boolean> {
    const query = this.createQuery({
      method: { name: "can-transfer", args: [`'${actor}`, `${tokenId}`] }
    });
    const res = await this.submitQuery(query);
    return res.data.result.replace(/'/g, "") === "true";
  }

  async isSpenderApproved(spender: string, tokenId: number): Promise<number> {
    const query = this.createQuery({
      method: { name: "is-spender-approved", args: [`'${spender}`, `${tokenId}`] }
    });
    const res = await this.submitQuery(query);
    return parseInt(res.data.result);
  }

  async isOperatorApproved(owner: string, operator: string): Promise<number> {
    const query = this.createQuery({
      method: { name: "is-operator-approved", args: [`'${owner}`, `'${operator}`] }
    });
    const res = await this.submitQuery(query);
    return parseInt(res.data.result);
  }

  async setSpenderApproval(
    spender: string,
    tokenId: number,
    params: { sender: string }
  ): Promise<Receipt> {
    const tx = this.createTransaction({
      method: { name: "set-spender-approval", args: [`'${spender}`, `${tokenId}`] }
    });
    tx.sign(params.sender);
    const res = await this.submitTransaction(tx);
    return res;
  }

  async setOperatorApproval(
    operator: string,
    isApproved: boolean,
    params: { sender: string }
  ): Promise<Receipt> {
    const tx = this.createTransaction({
      method: { name: "set-operator-approval", args: [`'${operator}`, `'${isApproved}`] }
    });
    tx.sign(params.sender);
    const res = await this.submitTransaction(tx);
    return res;
  }

  async transferFrom(
    from: string,
    to: string,
    tokenId: number,
    params: { sender: string }
  ): Promise<Receipt> {
    const tx = this.createTransaction({
      method: { name: "transfer-from", args: [`'${from}`, `'${to}`, `${tokenId}`] }
    });
    tx.sign(params.sender);
    const res = await this.submitTransaction(tx);
    return res;
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

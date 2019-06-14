import { Client, Receipt, Result } from "@blockstack/clarity";

export class NonFungibleTokenClient extends Client {
  name = "non-fungible-stock";
  filePath = "tokens/non-fungible-token";

  async balanceOf(owner: string): Promise<number> {
    const query = this.createQuery({ method: { name: "balance-of", args: [`'${owner}`] } });
    const res = await this.submitQuery(query);
    return parseInt(Result.get(res));
  }

  async ownerOf(tokenId: number): Promise<string> {
    const query = this.createQuery({ method: { name: "owner-of", args: [`${tokenId}`] } });
    const res = await this.submitQuery(query);
    return Result.get(res).replace(/'/g, "");
  }

  async canTransfer(actor: string, tokenId: number): Promise<boolean> {
    const query = this.createQuery({
      method: { name: "can-transfer", args: [`'${actor}`, `${tokenId}`] }
    });
    const res = await this.submitQuery(query);
    return Result.get(res).replace(/'/g, "") === "true";
  }

  async isSpenderApproved(spender: string, tokenId: number): Promise<number> {
    const query = this.createQuery({
      method: { name: "is-spender-approved", args: [`'${spender}`, `${tokenId}`] }
    });
    const res = await this.submitQuery(query);
    return parseInt(Result.get(res));
  }

  async isOperatorApproved(owner: string, operator: string): Promise<number> {
    const query = this.createQuery({
      method: { name: "is-operator-approved", args: [`'${owner}`, `'${operator}`] }
    });
    const res = await this.submitQuery(query);
    return parseInt(Result.get(res));
  }

  async setSpenderApproval(
    spender: string,
    tokenId: number,
    params: { sender: string }
  ): Promise<Receipt> {
    const tx = this.createTransaction({
      method: { name: "set-spender-approval", args: [`'${spender}`, `${tokenId}`] }
    });
    await tx.sign(params.sender);
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
    await tx.sign(params.sender);
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
    await tx.sign(params.sender);
    const res = await this.submitTransaction(tx);
    return res;
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

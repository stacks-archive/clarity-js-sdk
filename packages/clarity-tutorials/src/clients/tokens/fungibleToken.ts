import { Client, Receipt } from "../../../../clarity/src";

export class FungibleTokenClient extends Client {
  name = "rkt-token";
  filePath = "contracts/tokens/fungible-token.scm";

  async transfer(to: string, value: number, params: { sender: string }): Promise<Receipt> {
    const tx = this.createTransaction({
      method: { name: "transfer", args: [`'${to}`, `${value}`] }
    });
    tx.sign(params.sender);
    const res = await this.submitTransaction(tx);
    return res;
  }

  async balanceOf(owner: string): Promise<number> {
    const query = this.createQuery({ method: { name: "balance-of", args: [`'${owner}`] } });
    const res = await this.submitQuery(query);
    return parseInt(res.data.result);
  }

  async approve(spender: string, amount: number, params: { sender: string }): Promise<Receipt> {
    const tx = this.createTransaction({
      method: { name: "approve", args: [`'${spender}`, `${amount}`] }
    });
    tx.sign(params.sender);
    const res = await this.submitTransaction(tx);
    return res;
  }

  async revoke(spender: string, params: { sender: string }): Promise<Receipt> {
    const tx = this.createTransaction({ method: { name: "revoke", args: [`'${spender}`] } });
    tx.sign(params.sender);
    const res = await this.submitTransaction(tx);
    return res;
  }

  async allowanceOf(spender: string, owner: string): Promise<number> {
    const query = this.createQuery({
      method: { name: "allowance-of", args: [`'${spender}`, `'${owner}`] }
    });
    const res = await this.submitQuery(query);
    return parseInt(res.data.result);
  }

  async transferFrom(
    from: string,
    to: string,
    value: number,
    params: { sender: string }
  ): Promise<Receipt> {
    const tx = this.createTransaction({
      method: { name: "transfer-from", args: [`'${from}`, `'${to}`, `${value}`] }
    });
    tx.sign(params.sender);
    const res = await this.submitTransaction(tx);
    return res;
  }
}

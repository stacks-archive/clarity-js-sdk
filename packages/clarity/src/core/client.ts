import { Method, Query, Receipt, Transaction } from ".";
import { Provider } from "./provider";
import { Result } from "./result";
import { CheckResult } from "./types";

export class Client {
  name: string;
  filePath: string;
  provider: Provider;

  constructor(name: string, filePath: string, provider: Provider) {
    this.name = name;
    this.filePath = filePath;
    this.provider = provider;
  }

  checkContract = async (): Promise<void> => {
    const checkResult = await this.provider.checkContract(this.filePath);
    if (!checkResult.success) {
      throw new Error(checkResult.error);
    }
  };

  deployContract = async (): Promise<Receipt> => {
    const receipt = await this.provider.launchContract(this.name, this.filePath);
    return receipt;
  };

  createTransaction = (params?: { method?: Method }): Transaction => {
    const tx = new Transaction(params && params.method);
    return tx;
  };

  submitTransaction = async (tx: Transaction): Promise<Receipt> => {
    if (!tx.sender) {
      throw new Error("Transaction should have `sender` property");
    }
    if (!tx.method) {
      throw new Error("Transaction should have `method` property");
    }
    let receipt: Receipt;
    try {
      receipt = await this.provider.execute(
        this.name,
        tx.method.name,
        tx.sender,
        ...tx.method.args
      );
    } catch (error) {
      receipt = { success: false, error: error };
    }
    return receipt;
  };

  createQuery = (params: { method?: Method; atChaintip?: boolean }): Query => {
    const query = new Query(params.method, params.atChaintip);
    return query;
  };

  /**
   * Submits the given transaction or read-only request
   * without changing the state of the blockchain. Any change will be rolledback
   * after the request.
   *
   * @param query usualy created using `createQuery`
   */
  submitQuery = async (query: Query): Promise<Receipt> => {
    // let res = await this.node.execute(
    //     this.name,
    //     query.method.name,
    //     "SZ2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKQ9H6DPR",
    //     ...query.method.args)

    if (!query.method) {
      throw new Error("Query should target a method");
    }
    const res = await this.provider.eval(
      this.name,
      `(${query.method.name} ${query.method.args.join(" ")})`,
      true,
      query.atChaintip
    );
    return res;
  };
}

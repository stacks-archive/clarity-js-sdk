import { Method, Query, Receipt, Transaction } from ".";
import { Provider } from "./provider";

export class Client {
  name!: string;
  filePath!: string;
  provider!: Provider;

  constructor() {}

  tearUp = async (provider: Provider) => {
    this.provider = provider;
  };

  checkContract = async (): Promise<boolean> => {
    const res = await this.provider.checkContract(this.filePath);
    return res.success;
  };

  deployContract = async (): Promise<any> => {
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

  createQuery = (params: { method?: Method }): Query => {
    const query = new Query(params.method);
    return query;
  };

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
      true
    );
    return res;
  };
}

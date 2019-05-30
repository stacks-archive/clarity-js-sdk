import { Receipt, Method, Transaction, Evaluation } from ".";
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
    let receipt = await this.provider.launchContract(this.name, this.filePath);
    return receipt;
  };

  createTransaction = (params?: { method: Method }): Transaction => {
    let tx = new Transaction(params.method);
    return tx;
  };

  submitTransaction = async (tx: Transaction): Promise<Receipt> => {
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

  createEvaluation = (params: { method?: Method }): Evaluation => {
    let evaluation = new Evaluation(params.method);
    return evaluation;
  };

  submitEvaluation = async (evaluation: Evaluation): Promise<Receipt> => {
    let res = await this.provider.eval(
      this.name,
      `(${evaluation.method.name} ${evaluation.method.args.join(" ")})`,
      true
    );
    return res;
  };
}

import { Receipt, Method, Transaction, Evaluation } from ".";
import { Provider } from "./provider";
import { Principal } from "./principal";

export class Contract {
  name: string;
  filePath?: string;
  principal?: string;
  provider?: Provider;

  constructor(
    name: string,
    opts: { filePath?: string; principal?: string; provider?: Provider } = {}
  ) {
    this.name = name;
    this.filePath = opts.filePath;
    this.principal = opts.principal;
    this.provider = opts.provider;
  }

  check = async (): Promise<boolean> => {
    const res = await this.provider.checkContract(this.filePath);
    return res.success;
  };

  deploy = async (): Promise<any> => {
    let receipt = await this.provider.launchContract(this.name, this.filePath);
    return receipt;
  };

  helper = (): any => {
    var handler = {
      get: function(contract: Contract, method: string, receiver: any) {
        return function(): Transaction | Evaluation {
          const args = [...arguments].map((arg: any) =>
            arg instanceof Principal ? arg.formattedPublicKey() : arg
          );
          const tx = contract.createTransaction({
            method: { name: method, args: args }
          });
          return tx;
        };
      }
    };
    return new Proxy(this, handler);
  };

  createTransaction = (params?: { method: Method }): Transaction => {
    let tx = new Transaction();
    tx.contractPrincipal = this.name;
    tx.method = params.method;
    tx.provider = this.provider;
    return tx;
  };

  createEvaluation = (params: { method?: Method }): Evaluation => {
    let ev = new Evaluation(params.method);
    ev.contractPrincipal = this.name;
    ev.method = params.method;
    ev.provider = this.provider;
    return ev;
  };
}

import { Method, Receipt } from ".";

export class Transaction {
  sender?: string;
  receipt?: Receipt;
  method?: Method;

  constructor(method?: Method) {
    this.method = method;
  }

  validate = async (): Promise<boolean> => {
    if (!this.sender) {
      throw Error("Transaction should be signed");
    }
    return true;
  };

  sign = async (sender: string): Promise<boolean> => {
    this.sender = sender;
    return true;
  };
}

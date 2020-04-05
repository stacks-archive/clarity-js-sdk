import { Method, Receipt } from ".";

export class Query {
  receipt?: Receipt;
  method?: Method;
  atChaintip?: boolean;

  constructor(method?: Method, atChaintip?: boolean) {
    this.method = method;
    this.atChaintip = atChaintip;
  }

  validate = async (): Promise<boolean> => {
    if (!this.method) {
      throw Error("Query should target a method");
    }
    return true;
  };
}

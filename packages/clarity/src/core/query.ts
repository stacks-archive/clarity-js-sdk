import { Receipt, Method } from ".";

export class Query {
  receipt?: Receipt;
  method?: Method;

  constructor(method?: Method) {
    this.method = method;
  }

  validate = async (): Promise<boolean> => {
    if (!this.method) {
      throw Error("Query should target a method");
    }
    return true;
  };
}

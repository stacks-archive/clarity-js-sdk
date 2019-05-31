import { Receipt, Method } from ".";
import { Provider } from "./provider";
import { Submittable } from "./submittable";

export class Evaluation implements Submittable {
  contractPrincipal: string;
  method: Method;
  provider?: Provider;
  receipt?: Receipt;

  constructor(method?: Method) {
    this.method = method;
  }

  async sign(): Promise<boolean> {
    return Promise.resolve(true);
  }

  async submit(): Promise<Receipt> {
    throw Error("TO DO");
  }

  async signAndSubmit(): Promise<Receipt> {
    throw Error("TO DO");
  }
}

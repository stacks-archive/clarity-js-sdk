import { Receipt, Method } from ".";
import { Provider } from "./provider";
import { Submittable } from "./submittable";
import { Principal } from "./principal";

export class Transaction implements Submittable {
  contractPrincipal: string;
  method: Method;
  issuer: Principal;
  provider?: Provider;
  receipt?: Receipt;

  constructor() {}

  async sign(params: { issuer: Principal }): Promise<boolean> {
    this.issuer = params.issuer;
    return Promise.resolve(true);
  }

  async submit(): Promise<Receipt> {
    let receipt: Receipt;
    try {
      receipt = await this.provider.execute(
        this.contractPrincipal,
        this.method.name,
        this.issuer.stacksAddress,
        ...this.method.args
      );
    } catch (error) {
      receipt = { success: false, error: error };
    }
    return receipt;
  }

  async signAndSubmit(params: { issuer: Principal }): Promise<Receipt> {
    const res = await this.sign(params);
    if (!res) {
      throw Error("Unable to sign transaction");
    }
    return await this.submit();
  }
}

import { Receipt, Principal } from ".";

export abstract class Submittable {
  abstract async sign(params: { issuer: Principal }): Promise<boolean>;

  abstract async submit(): Promise<Receipt>;

  abstract async signAndSubmit(params: { issuer: Principal }): Promise<Receipt>;
}

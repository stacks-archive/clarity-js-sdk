export class Principal {
  stacksAddress: string;

  constructor(stacksAddress: string) {
    this.stacksAddress = stacksAddress;
  }

  validate(): boolean {
    return true;
  }

  formattedPublicKey(): string {
    return `'${this.stacksAddress}`;
  }
}

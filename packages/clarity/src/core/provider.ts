import { CheckResult, Receipt } from ".";

export interface ProviderConstructor {
  create(): Promise<Provider>;
}

export interface Provider {
  initialize(): Promise<void>;

  checkContract(contractFilePath: string): Promise<CheckResult>;

  launchContract(contractName: string, contractFilePath: string): Promise<Receipt>;

  execute(
    contractName: string,
    functionName: string,
    senderAddress: string,
    ...args: string[]
  ): Promise<Receipt>;

  eval(contractName: string, evalStatement: string, includeDebugOutput?: boolean, atChaintip?: boolean): Promise<Receipt>;

  evalRaw(evalStatement: string): Promise<Receipt>;

  getBlockHeight(): Promise<bigint>;

  mineBlock(time?: number | bigint): Promise<void>;

  close(): Promise<void>;
}

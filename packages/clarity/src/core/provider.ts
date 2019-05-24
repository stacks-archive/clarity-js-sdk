import { Receipt } from ".";

export abstract class Provider {
  abstract initialize(): Promise<void>;

  abstract checkContract(contractFilePath: string): Promise<Receipt>;

  abstract launchContract(contractName: string, contractFilePath: string): Promise<Receipt>;

  abstract execute(
    contractName: string,
    functionName: string,
    senderAddress: string,
    ...args: string[]
  ): Promise<Receipt>;

  abstract eval(contractName: string, evalStatement: string): Promise<Receipt>;

  abstract eval(
    contractName: string,
    evalStatement: string,
    includeDebugOutput: true
  ): Promise<Receipt>;

  abstract eval(
    contractName: string,
    evalStatement: string,
    includeDebugOutput?: boolean
  ): Promise<Receipt>;

  abstract evalRaw(evalStatement: string): Promise<Receipt>;

  abstract getBlockHeight(): Promise<bigint>;

  abstract mineBlock(time?: number | bigint): Promise<void>;

  abstract mineBlocks(count: number | bigint): Promise<void>;

  abstract close(): Promise<void>;
}

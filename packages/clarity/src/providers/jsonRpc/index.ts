import { CheckResult, Receipt } from '../../core';
import { Provider } from '../../core/provider';

export class JsonRpcProvider implements Provider {
  async initialize(): Promise<void> {}

  async checkContract(contractFilePath: string): Promise<CheckResult> {
    return {
      success: false,
    };
  }

  async launchContract(contractName: string, contractFilePath: string): Promise<Receipt> {
    return {
      success: false,
    };
  }

  async execute(
    contractName: string,
    functionName: string,
    senderAddress: string,
    ...args: string[]
  ): Promise<Receipt> {
    return {
      success: false,
    };
  }

  async evalRaw(evalStatement: string): Promise<Receipt> {
    return {
      success: false,
    };
  }

  async eval(
    contractName: string,
    evalStatement: string,
    includeDebugOutput = true
  ): Promise<Receipt> {
    return {
      success: false,
    };
  }

  async mineBlock(time?: number | bigint): Promise<void> {}

  async mineBlocks(count: number | bigint): Promise<void> {}

  async getBlockHeight(): Promise<bigint> {
    return BigInt(0);
  }

  async close(): Promise<void> {}
}

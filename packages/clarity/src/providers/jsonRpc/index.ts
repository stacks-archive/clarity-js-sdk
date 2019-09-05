import { CheckResult, LaunchContractResult, Receipt } from "../../core";
import { Provider } from "../../core/provider";

export class JsonRpcProvider implements Provider {
  async initialize(): Promise<void> {
    throw new Error("Not implemented");
  }

  async checkContract(contractFilePath: string): Promise<CheckResult> {
    throw new Error("Not implemented");
  }

  async launchContract(
    contractName: string,
    contractFilePath: string
  ): Promise<LaunchContractResult> {
    throw new Error("Not implemented");
  }

  async execute(
    contractName: string,
    functionName: string,
    senderAddress: string,
    ...args: string[]
  ): Promise<Receipt> {
    throw new Error("Not implemented");
  }

  async evalRaw(evalStatement: string): Promise<Receipt> {
    throw new Error("Not implemented");
  }

  async eval(
    contractName: string,
    evalStatement: string,
    includeDebugOutput = true
  ): Promise<Receipt> {
    throw new Error("Not implemented");
  }

  async mineBlock(time?: number | bigint): Promise<void> {
    throw new Error("Not implemented");
  }

  async mineBlocks(count: number | bigint): Promise<void> {
    throw new Error("Not implemented");
  }

  async getBlockHeight(): Promise<bigint> {
    throw new Error("Not implemented");
  }

  async close(): Promise<void> {
    throw new Error("Not implemented");
  }
}

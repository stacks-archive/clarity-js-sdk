import { CheckResult, Receipt } from "../../core";
import { Provider } from "../../core/provider";
import {
  makeContractCall,
  parseToCV,
  makeSmartContractDeploy,
  getAbi,
  StacksNetwork,
  StacksTestnet,
  broadcastTransaction,
  estimateContractDeploy,
} from "@blockstack/stacks-transactions";
import { getNormalizedContractFilePath } from "../../utils/contractSourceDir";
import { readFileSync } from "fs";
import "cross-fetch/polyfill";
import { ConsoleLogger } from "packages/clarity-native-bin/src/logger";
const BN = require("bn.js");

export class JsonRpcProvider implements Provider {
  static create(network: StacksNetwork, sidecarUrl: string, privateKey: string): JsonRpcProvider {
    return new JsonRpcProvider(network, sidecarUrl, privateKey);
  }

  contractAddress: string = "ST398K1WZTBVY6FE2YEHM6HP20VSNVSSPJTW0D53M";
  readonly privateKey: string;
  privateKeys: Map<string, string> = new Map<string, string>();
  readonly network: StacksNetwork = new StacksTestnet();
  readonly sidecarUrl: string;

  constructor(network: StacksNetwork, sidecarUrl: string, privateKey: string) {
    this.network = network;
    this.sidecarUrl = sidecarUrl;
    this.privateKey = privateKey;
  }

  async initialize(): Promise<void> {}

  async checkContract(contractFilePath: string): Promise<CheckResult> {
    return {
      success: true,
    };
  }

  async launchContract(contractName: string, contractFilePath: string): Promise<Receipt> {
    const contractNameParts = contractName.split(".");
    console.log(contractNameParts);
    const filePath = getNormalizedContractFilePath(contractFilePath);
    const codeBody = readFileSync(filePath);
    let tx = await makeSmartContractDeploy({
      contractName: contractNameParts[1],
      codeBody: codeBody.toString(),
      senderKey: this.privateKey,
      network: this.network,
      fee: new BN(0),
    });
    console.log("estimate fees");
    const fee = await estimateContractDeploy(tx, this.network);
    tx = await makeSmartContractDeploy({
      contractName: contractNameParts[1],
      codeBody: codeBody.toString(),
      senderKey: this.privateKey,
      network: this.network,
      fee: fee,
    });
    console.log("fees " + fee);
    const txId = await broadcastTransaction(tx, this.network);
    console.log(txId);
    return {
      success: true,
    };
  }

  async execute(
    contractName: string,
    functionName: string,
    senderAddress: string,
    ...args: string[]
  ): Promise<Receipt> {
    console.log({ contractName });
    const abi = await getAbi(this.contractAddress, contractName, this.network);
    const filtered = abi.functions.filter((fn) => fn.name === functionName);
    if (filtered.length === 1) {
      const abiFunc = filtered[0];
      const abiArgs = abiFunc.args;

      const tx = await makeContractCall({
        contractAddress: this.contractAddress,
        contractName,
        functionName,
        functionArgs: args.map((arg, index) => parseToCV(arg, abiArgs[index].type)),
        senderKey: this.privateKeys.get(senderAddress) || this.privateKey,
        network: this.network,
      });

      const txId = await broadcastTransaction(tx, this.network);
      console.log(txId);
    }
    return {
      success: true,
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
    /* const response = await fetch(`${this.network.coreApiUrl}/v2/info`);
    const json = await response.json();
    response.burn_block_height;
    */
    return BigInt(0);
  }

  async close(): Promise<void> {}
}

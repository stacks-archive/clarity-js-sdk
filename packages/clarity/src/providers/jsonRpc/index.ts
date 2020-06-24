import { CheckResult, Receipt } from "../../core";
import { Provider } from "../../core/provider";
import {
  makeContractCall,
  parseToCV,
  makeContractDeploy,
  getAbi,
  StacksNetwork,
  StacksTestnet,
  broadcastTransaction,
  estimateContractDeploy,
  TxBroadcastResultRejected,
  TxBroadcastResultOk,
} from "@blockstack/stacks-transactions";
import { getNormalizedContractFilePath } from "../../utils/contractSourceDir";
import { readFileSync } from "fs";
import fetch from "cross-fetch";
const BN = require("bn.js");

export class JsonRpcProvider implements Provider {
  static async create(
    network: StacksNetwork,
    sidecarUrl: string,
    privateKey: string
  ): Promise<JsonRpcProvider> {
    const provider = new JsonRpcProvider(network, sidecarUrl, privateKey);
    await provider.initialize();
    return provider;
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

  async initialize(): Promise<void> {
    const infoUrl = `${this.sidecarUrl}/v2/info`;
    const result = await fetch(infoUrl);
    const info = await result.json();
    console.log({ url: infoUrl, result: info });
    return;
  }

  async checkContract(contractFilePath: string): Promise<CheckResult> {
    return {
      success: true,
    };
  }

  async launchContract(contractName: string, contractFilePath: string): Promise<Receipt> {
    const contractNameParts = contractName.split(".");
    const filePath = getNormalizedContractFilePath(contractFilePath);
    const codeBody = readFileSync(filePath);
    let tx = await makeContractDeploy({
      contractName: contractNameParts[1],
      codeBody: codeBody.toString(),
      senderKey: this.privateKey,
      network: this.network,
      fee: new BN(0),
    });
    const fee = await estimateContractDeploy(tx, this.network);
    tx = await makeContractDeploy({
      contractName: contractNameParts[1],
      codeBody: codeBody.toString(),
      senderKey: this.privateKey,
      network: this.network,
      fee: fee,
    });
    const txResult = await broadcastTransaction(tx, this.network);
    if ((txResult as TxBroadcastResultRejected).error) {
      return {
        success: false,
        error: (txResult as TxBroadcastResultRejected).error,
      };
    } else {
      await this.transactionWithId(txResult as TxBroadcastResultOk);
      return {
        success: true,
      };
    }
  }

  async execute(
    contractName: string,
    functionName: string,
    senderAddress: string,
    ...args: string[]
  ): Promise<Receipt> {
    const contractNameParts = contractName.split(".");

    const abi = await getAbi(contractNameParts[0], contractNameParts[1], this.network);
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
    console.log({ contractName, evalStatement });
    const queryParts = evalStatement.split(" ");
    const result = await this.execute(contractName, queryParts[0], this.privateKey, queryParts);
    return {
      success: false,
    };
  }

  async mineBlock(time?: number | bigint): Promise<void> {}

  async mineBlocks(count: number | bigint): Promise<void> {}

  async getBlockHeight(): Promise<bigint> {
    const response = await fetch(`${this.network.coreApiUrl}/v2/info`);
    const json = await response.json();
    return BigInt(json.stacks_tip_height);
  }

  async close(): Promise<void> {
    // no action
  }

  async wait(ms: number): Promise<void> {
    return new Promise((accept) => setTimeout(accept, ms));
  }

  async transactionWithId(txId: string, maxWait: number = 3000) {
    const options = {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    };

    console.log(`waiting for tx ${txId}`);
    try {
      const waitTime = 500;
      let waitCount = Math.round(maxWait / waitTime);
      while (waitCount > 0) {
        const response = await fetch(`${this.sidecarUrl}/sidecar/v1/tx/${txId}`, options);

        if (response.ok) {
          const json = await response.json();
          if (json.tx_status === "success") {
            return json;
          } else {
            throw new Error(`transaction ${txId} failed: ${json.tx_status}`);
          }
        } else if (response.status === 404) {
          console.log(`waiting ${waitCount}`);
          await this.wait(500);
          waitCount--;
        } else {
          throw new Error(`Request failed with ${response.status} ${response.statusText}`);
        }
      }
      throw new Error(`did not return a value after ${maxWait}`);
    } catch (e) {
      throw e;
    }
  }
}

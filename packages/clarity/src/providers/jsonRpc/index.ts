import BN from "bn.js";
import fetch from "cross-fetch";
import { readFileSync } from "fs";

import {
  broadcastTransaction,
  callReadOnlyFunction,
  cvToString,
  estimateContractDeploy,
  getAbi,
  makeContractCall,
  makeContractDeploy,
  parseToCV,
  StacksNetwork,
  StacksTestnet,
  TxBroadcastResult,
  TxBroadcastResultOk,
  TxBroadcastResultRejected,
  standardPrincipalCV,
} from "@blockstack/stacks-transactions";

import { CheckResult, Receipt } from "../../core";
import { Provider } from "../../core/provider";
import { getNormalizedContractFilePath } from "../../utils/contractSourceDir";
import { ProviderRegistry } from "../registry";

const TIME_TO_MINE_BLOCK = 20000;

export async function createJsonRpcProvider(
  privateKey: string,
  network: StacksNetwork = new StacksTestnet(),
  sidecarUrl: string = "https://sidecar.staging.blockstack.xyz"
) {
  ProviderRegistry.registerProvider({
    create: async () => {
      const provider = await JsonRpcProvider.create(network, sidecarUrl, privateKey);
      return provider;
    },
  });

  return ProviderRegistry.createProvider();
}

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
    const infoUrl = `${this.sidecarUrl}/sidecar/v1/status`;
    const result = await fetch(infoUrl);
    const info = await result.json();
    console.log(`using sidecar ${infoUrl}:\n ${JSON.stringify({ result: info })}`);
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
    try {
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
      console.log(txResult);
      return this.txResultToReceipt(txResult);
    } catch (e) {
      console.log(e);
      return {
        success: false,
        error: e.message,
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
    const ctrAddress = contractNameParts[0];
    const ctrName = contractNameParts[1].trim();
    const abi = await getAbi(ctrAddress, ctrName, this.network);
    const filtered = abi.functions.filter((fn) => fn.name === functionName);
    if (filtered.length === 1) {
      const abiFunc = filtered[0];
      const abiArgs = abiFunc.args;
      if (abiArgs.length !== args.length) {
        console.log({ args });
        throw new Error(`Wrong arguments, expected ${abiArgs.length}, found ${args.length}`);
      }
      const functionArgs = args.map((arg, index) => {
        const argMeta = abiArgs[index];
        if (argMeta.type === "principal") {
          arg = arg.substr(1);
        }
        return parseToCV(arg, argMeta.type);
      });
      if (abiFunc.access === "read_only") {
        const result = await callReadOnlyFunction({
          contractAddress: ctrAddress,
          contractName: ctrName,
          functionName,
          functionArgs,
          senderAddress: ctrAddress,
          network: this.network,
        });
        return { success: true, result: cvToString(result) };
      } else {
        const senderKey = this.privateKeys.get(senderAddress) || this.privateKey;
        const tx = await makeContractCall({
          contractAddress: ctrAddress,
          contractName: ctrName,
          functionName,
          functionArgs,
          senderKey,
          network: this.network,
        });
        try {
          const txResult = await broadcastTransaction(tx, this.network);
          return this.txResultToReceipt(txResult);
        } catch (e) {
          console.log(e);
          return {
            success: false,
            error: e.message,
          };
        }
      }
    } else {
      return {
        success: false,
        error: `function ${functionName} not part of abi ${abi}`,
      };
    }
  }

  async evalRaw(evalStatement: string): Promise<Receipt> {
    return {
      success: false,
      error: "evalRaw not supported - use a different provider",
    };
  }

  async eval(
    contractName: string,
    evalStatement: string,
    includeDebugOutput = true
  ): Promise<Receipt> {
    const innerEval = evalStatement.substr(1, evalStatement.length - 2);
    const queryParts = innerEval
      .split(" ")
      .map((arg) => arg.trim())
      .filter((arg) => arg.length > 0);
    const result = await this.execute(
      contractName,
      queryParts[0],
      this.privateKey,
      ...queryParts.splice(1)
    );

    return result;
  }

  async mineBlock(time?: number | bigint): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, TIME_TO_MINE_BLOCK);
    });
  }

  async mineBlocks(count: number | bigint): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, TIME_TO_MINE_BLOCK * (count as number));
    });
  }

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

  async txResultToReceipt(txResult: TxBroadcastResult): Promise<Receipt> {
    if ((txResult as TxBroadcastResultRejected).error) {
      return {
        success: false,
        error: (txResult as TxBroadcastResultRejected).error,
      };
    } else {
      const txWithQuotes = txResult as TxBroadcastResultOk;
      const result = await this.transactionWithId(txWithQuotes.substr(1, txWithQuotes.length - 2));
      return {
        success: true,
        result,
      };
    }
  }
  async transactionWithId(txId: string, maxWait: number = 60000) {
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
          } else if (json.tx_status === "pending") {
            console.log(`waiting pending ${waitCount}`);
            await this.wait(waitTime);
            waitCount--;
          } else {
            throw new Error(`transaction ${txId} failed: ${JSON.stringify(json)}`);
          }
        } else if (response.status === 404) {
          console.log(`waiting submitting ${waitCount}`);
          await this.wait(waitTime);
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

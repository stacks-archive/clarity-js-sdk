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
  standardPrincipalCV,
  TxBroadcastResult,
  TxBroadcastResultOk,
  TxBroadcastResultRejected,
} from "@stacks/transactions";

import {
  Configuration,
  connectWebSocketClient,
  FetchAPI,
  InfoApi,
  StacksApiWebSocketClient,
  TransactionsApi,
} from "@stacks/blockchain-api-client";
import { StacksNetwork, StacksTestnet } from "@stacks/network";
import { CheckResult, Receipt } from "../../core";
import { Provider } from "../../core/provider";
import { getNormalizedContractFilePath } from "../../utils/contractSourceDir";
import { ProviderRegistry } from "../registry";

const TIME_TO_MINE_BLOCK = 20000;

export async function createJsonRpcProvider(
  privateKey: string,
  network: StacksNetwork = new StacksTestnet(),
  sidecarUrl: string = "https://stacks-node-api.blockstack.org"
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
    const provider = new JsonRpcProvider(
      network,
      "https://stacks-node-api.blockstack.org",
      "ws://stacks-node-api.krypton.blockstack.org",
      privateKey,
      fetch
    );
    await provider.initialize();
    return provider;
  }

  readonly privateKey: string;
  privateKeys: Map<string, string> = new Map<string, string>();
  readonly network: StacksNetwork = new StacksTestnet();
  readonly infoApi: InfoApi;
  readonly transactionsApi: TransactionsApi;
  readonly stacksNodeWebSocketUrl: string;
  stacksApiWebSocketClient: StacksApiWebSocketClient | undefined;

  constructor(
    network: StacksNetwork,
    stacksNodeApiUrl: string,
    stacksNodeWebSocketUrl: string,
    privateKey: string,
    fetchAPI: FetchAPI
  ) {
    this.network = network;
    const config = new Configuration({ basePath: stacksNodeApiUrl, fetchApi: fetchAPI });
    this.infoApi = new InfoApi(config);
    this.transactionsApi = new TransactionsApi(config);
    this.stacksNodeWebSocketUrl = stacksNodeWebSocketUrl;
    this.privateKey = privateKey;
  }

  async initialize(): Promise<void> {
    console.log("init", this.stacksNodeWebSocketUrl);
    this.stacksApiWebSocketClient = await connectWebSocketClient(this.stacksNodeWebSocketUrl);
    console.log("initi2");
    const info = await this.infoApi.getStatus();
    console.log(`using stacks node api:\n ${JSON.stringify({ result: info })}`);
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
        result: JSON.stringify(result as object),
      };
    }
  }

  async transactionWithId(txId: string, maxWait: number = 60000) {
    return new Promise(async (resolve, reject) => {
      let subscription: any;
      subscription = await this.stacksApiWebSocketClient?.subscribeTxUpdates(
        txId,
        async (event) => {
          if (event.tx_status === "success") {
            await subscription.unsubscribe();
            const tx = await this.transactionsApi.getTransactionById({ txId });
            resolve(tx);
          }
        }
      );
      console.log(`waiting for tx ${txId}`);
    });
  }
}

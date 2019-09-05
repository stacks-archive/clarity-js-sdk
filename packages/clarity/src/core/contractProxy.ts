import { Client } from "./client";
import { ClarityContractInterface } from "./contractInterface";
import { Provider } from "./provider";
import { Result } from "./result";

export class ClientProxyHandler implements ProxyHandler<Client> {
  provider: Provider;
  client: Client;
  contractInterface: ClarityContractInterface;

  constructor(provider: Provider, client: Client, contractInterface: ClarityContractInterface) {
    this.provider = provider;
    this.client = client;
    this.contractInterface = contractInterface;
  }

  has(target: Client, p: PropertyKey): boolean {
    const prop = p.valueOf();
    if (typeof prop !== "string") {
      throw new Error(
        `Property key should be of type string but got ${typeof prop}: ${prop.toString()}`
      );
    }
    const interfaceObjects: object[] = [
      /*this.contractInterface.variable_types,
      this.contractInterface.map_types,
      this.contractInterface.private_function_types,
      this.contractInterface.public_function_types,
      this.contractInterface.read_only_function_types*/
    ];
    for (const obj of interfaceObjects) {
      if (Object.keys(obj).includes(prop)) {
        return true;
      }
    }
    return false;
  }

  getVariableInvoker(name: string): (() => Promise<any>) | undefined {
    /* const info = this.contractInterface.variable_types[name];
    if (info === undefined) {
      return;
    }
    return async () => {
      const receipt = await this.client.readVariable(name);
      const result = Result.unwrap(receipt);
      // TODO: parse result based on contract-interface type info
      return result;
    }; */
    throw new Error("not implemented");
  }

  getMapValueInvoker(
    name: string
  ): ((keyTupleName: string, keyTupleValue: any) => Promise<any>) | undefined {
    /*const info = this.contractInterface.map_types[name];
    if (info === undefined) {
      return undefined;
    }
    return async (keyTupleName: string, keyTupleValue: any) => {
      const receipt = await this.client.readMapValue(name, keyTupleName, keyTupleValue);
      const result = Result.unwrap(receipt);
      // TODO: parse result based on contract-interface type info
      return result;
    };*/
    throw new Error("not implemented");
  }

  get(target: Client, p: PropertyKey, receiver: any) {
    const prop = p.valueOf();
    if (typeof prop !== "string") {
      throw new Error(
        `Property key should be of type string but got ${typeof prop}: ${prop.toString()}`
      );
    }

    const variableInvoker = this.getVariableInvoker(prop);
    if (variableInvoker !== undefined) {
      return variableInvoker;
    }

    const mapVariableInvoker = this.getMapValueInvoker(prop);
    if (mapVariableInvoker !== undefined) {
      return mapVariableInvoker;
    }

    const interfaceObjects: object[] = [
      /* this.contractInterface.variable_types,
      this.contractInterface.map_types,
      this.contractInterface.private_function_types,
      this.contractInterface.public_function_types,
      this.contractInterface.read_only_function_types */
    ];
    for (const obj of interfaceObjects) {
      if (prop in obj) {
        return true;
      }
    }
  }
}

// const ff = new Proxy(new Client(), new ClientProxyHandler());
/*
export class ContractProxy extends Client implements ProxyHandler<Client> {
  constructor(name: string, filePath: string, provider: Provider) {
    super(name, filePath, provider);
  }
}
*/

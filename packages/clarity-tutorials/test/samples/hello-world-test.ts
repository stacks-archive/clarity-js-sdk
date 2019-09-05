import { Client, Provider, ProviderRegistry, Result } from "@blockstack/clarity";
import BigInt from "big-integer";
import { assert } from "chai";

describe.only("hello world contract test suite", () => {
  let helloWorldClient: Client;
  let provider: Provider;

  before(async () => {
    provider = await ProviderRegistry.createProvider();
    helloWorldClient = new Client("hello-world", "samples/hello-world", provider);
  });

  it("should have a valid syntax", async () => {
    await helloWorldClient.checkContract();
  });

  const MAX_INT128_VAL = BigInt(2)
    .pow(128)
    .divide(2)
    .subtract(1);
  const MIN_INT128_VAL = BigInt(2)
    .pow(128)
    .divide(2)
    .multiply(-1);

  function validateInt128Size(val: BigInt.BigInteger) {
    assert.isTrue(val.lesserOrEquals(MAX_INT128_VAL), `bigint overflow: ${val}`);
    assert.isTrue(val.greaterOrEquals(MIN_INT128_VAL), `bigint underflow: ${val}`);
  }

  describe("deploying an instance of the contract", () => {
    before(async () => {
      await helloWorldClient.deployContract();
    });

    it("should print hello world message", async () => {
      const query = helloWorldClient.createQuery({ method: { name: "hello-world", args: [] } });
      const receipt = await helloWorldClient.submitQuery(query);

      const helloWorld: any = {};
      const echoFunc: (arg1: number) => Promise<number> = helloWorld["echo"];

      const echoFuncInvoker: {
        execute: (arg1: number) => Promise<number>;
        eval: (arg1: number) => Promise<number>;
        sender: string;
      } = helloWorld["echo"];

      

      const theNumber: number = await helloWorld["echo"];
      await theNumber();

      const result = Result.unwrap(receipt);
      assert.isTrue(result.startsWith("0x"), "not a hex string");
      const parsedResult = Buffer.from(result.replace("0x", ""), "hex").toString();
      assert.equal(parsedResult, "hello world");
    });

    it("should echo number", async () => {
      const numTestValue = BigInt(123);
      validateInt128Size(numTestValue);

      const query = helloWorldClient.createQuery({
        method: { name: "echo-number", args: [numTestValue.toString()] }
      });
      const receipt = await helloWorldClient.submitQuery(query);
      const result: string = Result.unwrap(receipt);
      const resultNum = BigInt(result);
      validateInt128Size(resultNum);

      assert.equal(resultNum.toString(), numTestValue.toString());
    });
  });

  after(async () => {
    await provider.close();
  });
});

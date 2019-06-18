import { Client, Provider, ProviderRegistry, Result } from "@blockstack/clarity";
import { assert } from "chai";

describe("hello world contract test suite", () => {
  let helloWorldClient: Client;
  let provider: Provider;

  before(async () => {
    provider = await ProviderRegistry.createProvider();
    helloWorldClient = new Client("hello-world", "samples/hello-world", provider);
  });

  it("should have a valid syntax", async () => {
    await helloWorldClient.checkContract();
  });

  describe("deploying an instance of the contract", () => {
    before(async () => {
      await helloWorldClient.deployContract();
    });

    it("should print hello world message", async () => {
      const query = helloWorldClient.createQuery({ method: { name: "hello-world", args: [] } });
      const receipt = await helloWorldClient.submitQuery(query);
      const result = Result.unwrap(receipt);
      const parsedResult = Buffer.from(result.replace("0x", ""), "hex").toString();
      assert.equal(parsedResult, "hello world");
    });

    it("should echo number", async () => {
      const query = helloWorldClient.createQuery({
        method: { name: "echo-number", args: ["123"] }
      });
      const receipt = await helloWorldClient.submitQuery(query);
      const result = Result.unwrap(receipt);
      assert.equal(result, "123");
    });
  });

  after(async () => {
    await provider.close();
  });
});

import { Client, Provider, ProviderRegistry, Result } from "@blockstack/clarity";

describe("hello world contract test suite", () => {
  let helloWorldClient: Client;
  let provider: Provider;

  beforeAll(async () => {
    provider = await ProviderRegistry.createProvider();
    helloWorldClient = new Client("SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB.hello-world", "samples/hello-world", provider);
  });

  it("should have a valid syntax", async () => {
    await helloWorldClient.checkContract();
  });

  describe("deploying an instance of the contract", () => {
    beforeAll(async () => {
      await helloWorldClient.deployContract();
    });

    it("should return 'hello world'", async () => {
      const query = helloWorldClient.createQuery({ method: { name: "say-hi", args: [] } });
      const receipt = await helloWorldClient.submitQuery(query);
      const result = Result.unwrapString(receipt, "utf8");
      expect(result).toEqual("hello world");
    });

    it("should echo number", async () => {
      const query = helloWorldClient.createQuery({
        method: { name: "echo-number", args: ["123"] }
      });
      const receipt = await helloWorldClient.submitQuery(query);
      const result = Result.unwrapInt(receipt);
      expect(result).toEqual(123);
    });
  });

  afterAll(async () => {
    await provider.close();
  });
});

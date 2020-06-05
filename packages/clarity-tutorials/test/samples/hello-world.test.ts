import { Client, Provider, ProviderRegistry, Result, JsonRpcProvider } from "@blockstack/clarity";
import { StacksTestnet } from "@blockstack/stacks-transactions";

describe("hello world contract test suite", () => {
  let helloWorldClient: Client;
  let provider: Provider;

  beforeAll(async () => {
    ProviderRegistry.registerProvider({
      create: async () => {
        const provider = JsonRpcProvider.create(
          new StacksTestnet(),
          "https://sidecar.staging.blockstack.xyz/",
          "44767e169d5146c704a308d7ff2e3edac573e2649fb690aa4e8526480678d19e01"
        );

        return provider;
      },
    });
    provider = await ProviderRegistry.createProvider();

    helloWorldClient = new Client(
      "ST398K1WZTBVY6FE2YEHM6HP20VSNVSSPJTW0D53M.hello-world",
      "samples/hello-world",
      provider
    );
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
      const result = Result.unwrapString(receipt);
      expect(result).toEqual("hello world");
    });

    it("should echo number", async () => {
      const query = helloWorldClient.createQuery({
        method: { name: "echo-number", args: ["123"] },
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

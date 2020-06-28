import { Client, JsonRpcProvider, Provider, ProviderRegistry, Result } from "@blockstack/clarity";
import { StacksTestnet } from "@blockstack/stacks-transactions";

let helloWorldClient: Client;
let provider: Provider;

async function init(deploy: boolean = true) {
  ProviderRegistry.registerProvider({
    create: async () => {
      const network = new StacksTestnet();
      network.coreApiUrl = "http://testnet-master.blockstack.org:20443";
      const provider = await JsonRpcProvider.create(
        network,
        "https://sidecar.staging.blockstack.xyz",
        "44767e169d5146c704a308d7ff2e3edac573e2649fb690aa4e8526480678d19e01"
      );

      return provider;
    },
  });

  provider = await ProviderRegistry.createProvider();

  helloWorldClient = new Client(
    "ST398K1WZTBVY6FE2YEHM6HP20VSNVSSPJTW0D53M.hello-world-3",
    "samples/hello-world",
    provider
  );
  if (deploy) {
    await helloWorldClient.deployContract();
  }
}

async function sayHi() {
  const tx = helloWorldClient.createTransaction({ method: { name: "say-hi", args: [] } });
  const receipt = await helloWorldClient.submitTransaction(tx);
  console.log(receipt);
  return Result.unwrapString(receipt);
}

async function echoNumber() {
  const tx = helloWorldClient.createTransaction({
    method: { name: "echo-number", args: ["123"] },
  });
  const receipt = await helloWorldClient.submitTransaction(tx);
  console.log(receipt);
  return Result.unwrapInt(receipt);
}

async function info() {
  const query = helloWorldClient.createQuery({
    method: {
      name: "info-read-only",
      args: ["ST26SR8PD2K5M42XFD34WZHFZFH2QBKDQMVXFXKHK"],
    },
  });
  return helloWorldClient.submitQuery(query);
}

const result = (async function run() {
  await init(false);
  console.log(await info());
})();

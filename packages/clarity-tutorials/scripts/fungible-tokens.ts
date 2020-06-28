import { createJsonRpcProvider } from "@blockstack/clarity";
import { StacksTestnet } from "@blockstack/stacks-transactions";

import { FungibleTokenClient } from "../src/clients/tokens/fungibleToken";

let client: FungibleTokenClient | undefined;

// tslint:disable-next-line: no-floating-promises
(async () => {
  client = new FungibleTokenClient(
    await createJsonRpcProvider(
      "44767e169d5146c704a308d7ff2e3edac573e2649fb690aa4e8526480678d19e01"
    )
  );

  // await client.deployContract();

  const result = await client.balanceOf("ST398K1WZTBVY6FE2YEHM6HP20VSNVSSPJTW0D53M");
  console.log(result);
})();

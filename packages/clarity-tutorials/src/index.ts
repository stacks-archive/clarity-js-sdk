import { CargoBuildProvider, Principal } from "../../clarity/src";
import { Contract } from "../../clarity/src";
import { RocketTokenHelper } from "./types";

const main = async () => {
  // Users involved
  const alice = new Principal("SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7");
  const bob = new Principal("S02J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKPVKG2CE");
  const elon = new Principal("SZ2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKQ9H6DPR");

  //   client.

  // Setup our provider, the proxy to our blockchain node
  const provider = await CargoBuildProvider.createEphemeral();
  const tokenContract = new Contract("rocket-token", {
    filePath: "contracts/rocket-tutorial/rocket-token.scm",
    provider: provider
  });
  const check = await tokenContract.check();
  const res = await tokenContract.deploy();

  const tokenHelper = tokenContract.helper() as RocketTokenHelper;
  const tx = tokenHelper.transfer(bob, 1);
  const receipt = await tx.signAndSubmit({ issuer: alice });

  console.log(receipt);

  // Introducing a token (RKT),
  // The one and only currency for buying an actual rocket.
  //   const rktToken = new FungibleTokenClient();
  // Specify that our rktToken will use 'provider' as a bridge to the blockchain
  //   await rktToken.tearUp(provider);
  // Deploy the contract if not available
  //   if (true) {
  //     try {
  //       await rktToken.deployContract();
  //     } catch (error) {
  //       throw new Error("Unable to deploy contract");
  //     }
  //   }

  // Instantiating a fungible token (RKT)
  //   const rocketFactory = new NonFungibleTokenClient();
  // Specify that our rktToken will use 'provider' as a bridge to the blockchain
  //   await rocketFactory.tearUp(provider);
  // Deploy the contract if not available
  //   if (true) {
  //     try {
  //       await rocketFactory.deployContract();
  //     } catch (error) {
  //       throw new Error("Unable to deploy contract");
  //     }
  //   }
};

main();

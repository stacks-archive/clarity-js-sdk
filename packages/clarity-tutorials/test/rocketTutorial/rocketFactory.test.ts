import { it, before } from "mocha";
import { expect } from "chai";
import { RocketFactoryClient } from "../../src/clients/rocketTutorial/rocketFactory";
import { RocketTokenClient } from "../../src/clients/rocketTutorial/rocketToken";
import { CargoBuildProvider, Receipt } from "../../../clarity/src";

describe("RocketFactoryClient Test Suite", () => {
  let rocketFactoryClient: RocketFactoryClient;
  let rocketTokenClient: RocketTokenClient;

  const addresses = [
    "SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7",
    "S02J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKPVKG2CE",
    "SZ2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKQ9H6DPR"
  ];
  const alice = addresses[0];
  const bob = addresses[1];
  const factory = addresses[2];

  before(async () => {
    const provider = await CargoBuildProvider.createEphemeral();
    rocketFactoryClient = new RocketFactoryClient();
    await rocketFactoryClient.tearUp(provider);

    rocketTokenClient = new RocketTokenClient();
    await rocketTokenClient.tearUp(provider);
  });

  it("should have a valid syntax", async () => {
    // let res = await rocketFactoryClient.checkContract();
    // expect(res).to.be.true;
    // let res = await rocketTokenClient.checkContract();
    // expect(res).to.be.true;
  });

  describe("Deploying an instance of the contract", () => {
    before(async () => {
      await rocketTokenClient.deployContract();
      await rocketFactoryClient.deployContract();
    });

    it("should initialize Alice's state so that she can buy a new rocket", async () => {
      const canAliceBuy = await rocketFactoryClient.canUserBuy(alice);
      expect(canAliceBuy).to.be.true;
    });

    it("should initialize Bob's state so that he can buy a new rocket", async () => {
      const canBobBuy = await rocketFactoryClient.canUserBuy(bob);
      expect(canBobBuy).to.be.true;
    });
  });

  describe("Alice buying a rocket of size 10", () => {
    before(async () => {
      await rocketFactoryClient.buyRocket(10, { sender: alice });
    });

    it("should make Alice unable to buy a new rocket", async () => {
      const canAliceBuy = await rocketFactoryClient.canUserBuy(alice);
      expect(canAliceBuy).to.be.false;
    });

    it("should decrease Alice's balance to 15 RKT", async () => {
      const balanceAlice = await rocketTokenClient.balanceOf(alice);
      expect(balanceAlice).to.equal(15);
    });

    it("should not impact Bob's ability to buy a new rocket", async () => {
      const canBobBuy = await rocketFactoryClient.canUserBuy(bob);
      expect(canBobBuy).to.be.true;
    });
  });

  //   describe("Alice transfering -5 RKT to Bob", () => {
  //     let receipt: Receipt;

  //     before(async () => {
  //       receipt = await rocketFactoryClient.transfer(bob, 16, { sender: alice });
  //     });

  //     it("should return an invalid receipt", async () => {
  //       expect(receipt.success).to.be.false;
  //     });

  //     it("should not increase Alice's balance (15 RKT)", async () => {
  //       const balanceAlice = await rocketFactoryClient.balanceOf(alice);
  //       expect(balanceAlice).to.equal(15);
  //     });

  //     it("should not decrease Bob's balance (15 RKT)", async () => {
  //       const balanceBob = await rocketFactoryClient.balanceOf(bob);
  //       expect(balanceBob).to.equal(15);
  //     });
  //   });

  //   describe("Bob transfering 16 RKT to Alice", () => {
  //     let receipt: Receipt;

  //     before(async () => {
  //       receipt = await rocketFactoryClient.transfer(bob, 16, { sender: alice });
  //     });

  //     it("should return an invalid receipt", async () => {
  //       expect(receipt.success).to.be.false;
  //     });

  //     it("should not increase Alice's balance (15 RKT)", async () => {
  //       const balanceAlice = await rocketFactoryClient.balanceOf(alice);
  //       expect(balanceAlice).to.equal(15);
  //     });

  //     it("should not decrease Bob's balance (15 RKT)", async () => {
  //       const balanceBob = await rocketFactoryClient.balanceOf(bob);
  //       expect(balanceBob).to.equal(15);
  //     });
  //   });
});

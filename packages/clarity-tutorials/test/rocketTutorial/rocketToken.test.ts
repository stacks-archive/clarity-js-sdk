import { it, before } from "mocha";
import { expect } from "chai";
import { RocketTokenClient } from "../../src/clients/rocketTutorial/rocketToken";
import { CargoBuildProvider, Receipt } from "../../../clarity/src";

describe("RocketTokenClient Test Suite", () => {
  let rocketTokenClient: RocketTokenClient;

  const addresses = [
    "SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7",
    "S02J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKPVKG2CE",
    "SZ2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKQ9H6DPR"
  ];
  const alice = addresses[0];
  const bob = addresses[1];
  const zoe = addresses[2];

  before(async () => {
    const provider = await CargoBuildProvider.createEphemeral();
    rocketTokenClient = new RocketTokenClient();
    await rocketTokenClient.tearUp(provider);
  });

  it("should have a valid syntax", async () => {
    const res = await rocketTokenClient.checkContract();
    expect(res).to.be.true;
  });

  describe("Deploying an instance of the contract", () => {
    before(async () => {
      await rocketTokenClient.deployContract();
    });

    it("should initialize Alice's balance (20 RKT)", async () => {
      const balanceAlice = await rocketTokenClient.balanceOf(alice);
      expect(balanceAlice).to.equal(20);
    });

    it("should initialize Bob's balance (10 RKT)", async () => {
      const balanceBob = await rocketTokenClient.balanceOf(bob);
      expect(balanceBob).to.equal(10);
    });

    it("should initialize the total supply of RKT to 30", async () => {
      const totalSupply = await rocketTokenClient.totalSupply();
      expect(totalSupply).to.equal(30);
    });

    it("should initialize Zoe's balance (0 RKT)", async () => {
      const balanceZoe = await rocketTokenClient.balanceOf(zoe);
      expect(balanceZoe).to.equal(0);
    });
  });

  describe("Alice transfering 5 RKT to Bob", () => {
    before(async () => {
      await rocketTokenClient.transfer(bob, 5, { sender: alice });
    });

    it("should decrease Alice's balance (15 RKT)", async () => {
      const balanceAlice = await rocketTokenClient.balanceOf(alice);
      expect(balanceAlice).to.equal(15);
    });

    it("should increase Bob's balance (15 RKT)", async () => {
      const balanceBob = await rocketTokenClient.balanceOf(bob);
      expect(balanceBob).to.equal(15);
    });
  });

  describe("Alice transfering -5 RKT to Bob", () => {
    let receipt: Receipt;

    before(async () => {
      receipt = await rocketTokenClient.transfer(bob, 16, { sender: alice });
    });

    it("should return an invalid receipt", async () => {
      expect(receipt.success).to.be.false;
    });

    it("should not increase Alice's balance (15 RKT)", async () => {
      const balanceAlice = await rocketTokenClient.balanceOf(alice);
      expect(balanceAlice).to.equal(15);
    });

    it("should not decrease Bob's balance (15 RKT)", async () => {
      const balanceBob = await rocketTokenClient.balanceOf(bob);
      expect(balanceBob).to.equal(15);
    });
  });

  describe("Alice transfering 5 RKT to herself", () => {
    let receipt: Receipt;

    before(async () => {
      receipt = await rocketTokenClient.transfer(alice, 5, { sender: alice });
    });

    it("should return an invalid receipt", async () => {
      expect(receipt.success).to.be.false;
    });

    it("should not increase Alice's balance (15 RKT)", async () => {
      const balanceAlice = await rocketTokenClient.balanceOf(alice);
      expect(balanceAlice).to.equal(15);
    });

    it("should not decrease Bob's balance (15 RKT)", async () => {
      const balanceBob = await rocketTokenClient.balanceOf(bob);
      expect(balanceBob).to.equal(15);
    });
  });

  describe("Bob transfering 16 RKT to Alice", () => {
    let receipt: Receipt;

    before(async () => {
      receipt = await rocketTokenClient.transfer(bob, 16, { sender: alice });
    });

    it("should return an invalid receipt", async () => {
      expect(receipt.success).to.be.false;
    });

    it("should not increase Alice's balance (15 RKT)", async () => {
      const balanceAlice = await rocketTokenClient.balanceOf(alice);
      expect(balanceAlice).to.equal(15);
    });

    it("should not decrease Bob's balance (15 RKT)", async () => {
      const balanceBob = await rocketTokenClient.balanceOf(bob);
      expect(balanceBob).to.equal(15);
    });
  });
});

import { DefaultProvider, Receipt } from "@blockstack/clarity";
import { expect } from "chai";
import { before, it } from "mocha";
import { FungibleTokenClient } from "../../src/clients/fungibleToken";

describe("FungibleTokenClient Test Suite", () => {
  let rocketTokenClient: FungibleTokenClient;

  const addresses = [
    "SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7",
    "S02J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKPVKG2CE",
    "SZ2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKQ9H6DPR"
  ];
  const alice = addresses[0];
  const bob = addresses[1];
  const zoe = addresses[2];

  before(async () => {
    const provider = await DefaultProvider.createEphemeral();
    rocketTokenClient = new FungibleTokenClient();
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

  describe("Alice approving Zoe to spend 10 RKT on her behalf, with allowance <= balance", () => {
    before(async () => {
      await rocketTokenClient.approve(zoe, 10, { sender: alice });
    });

    it("should increase Zoe's allowance (10 RKT)", async () => {
      const allowanceZoe = await rocketTokenClient.allowanceOf(zoe, alice);
      expect(allowanceZoe).to.equal(10);
    });

    describe("Zoe transfering 10 RKT to Bob on Alice behalf", () => {
      before(async () => {
        await rocketTokenClient.transferFrom(alice, bob, 10, { sender: zoe });
      });

      it("should decrease Alice's balance (5 RKT)", async () => {
        const balanceAlice = await rocketTokenClient.balanceOf(alice);
        expect(balanceAlice).to.equal(5);
      });

      it("should increase Bob's balance (25 RKT)", async () => {
        const balanceBob = await rocketTokenClient.balanceOf(bob);
        expect(balanceBob).to.equal(25);
      });

      it("should decrease Zoe's allowance (0 RKT)", async () => {
        const allowanceZoe = await rocketTokenClient.allowanceOf(zoe, alice);
        expect(allowanceZoe).to.equal(0);
      });
    });

    describe("Zoe transfering 1 RKT to Bob on Alice behalf", () => {
      let receipt: Receipt;

      before(async () => {
        receipt = await rocketTokenClient.transferFrom(alice, bob, 10, { sender: zoe });
      });

      it("should return an invalid receipt", async () => {
        expect(receipt.success).to.be.false;
      });

      it("should not decrease Alice's balance (5 RKT)", async () => {
        const balanceAlice = await rocketTokenClient.balanceOf(alice);
        expect(balanceAlice).to.equal(5);
      });

      it("should not increase Bob's balance (25 RKT)", async () => {
        const balanceBob = await rocketTokenClient.balanceOf(bob);
        expect(balanceBob).to.equal(25);
      });
    });
  });

  describe("Alice approving Zoe to spend 10 RKT on her behalf, with allowance >= balance, allowance > 0", () => {
    before(async () => {
      await rocketTokenClient.approve(zoe, 10, { sender: alice });
    });

    it("should increase Zoe's allowance (10 RKT)", async () => {
      const allowanceZoe = await rocketTokenClient.allowanceOf(zoe, alice);
      expect(allowanceZoe).to.equal(10);
    });

    describe("Zoe transfering 10 RKT to Bob on Alice behalf", () => {
      let receipt: Receipt;

      before(async () => {
        receipt = await rocketTokenClient.transferFrom(alice, bob, 10, { sender: zoe });
      });

      it("should return an invalid receipt", async () => {
        expect(receipt.success).to.be.false;
      });

      it("should not decrease Alice's balance (5 RKT)", async () => {
        const balanceAlice = await rocketTokenClient.balanceOf(alice);
        expect(balanceAlice).to.equal(5);
      });

      it("should not increase Bob's balance (25 RKT)", async () => {
        const balanceBob = await rocketTokenClient.balanceOf(bob);
        expect(balanceBob).to.equal(25);
      });

      it("should not decrease Zoe's allowance (10 RKT)", async () => {
        const allowanceZoe = await rocketTokenClient.allowanceOf(zoe, alice);
        expect(allowanceZoe).to.equal(10);
      });
    });

    describe("Zoe transfering 5 RKT to Bob on Alice behalf", () => {
      before(async () => {
        await rocketTokenClient.transferFrom(alice, bob, 5, { sender: zoe });
      });

      it("should decrease Alice's balance (0 RKT)", async () => {
        const balanceAlice = await rocketTokenClient.balanceOf(alice);
        expect(balanceAlice).to.equal(0);
      });

      it("should increase Bob's balance (30 RKT)", async () => {
        const balanceBob = await rocketTokenClient.balanceOf(bob);
        expect(balanceBob).to.equal(30);
      });

      it("should decrease Zoe's allowance (5 RKT)", async () => {
        const allowanceZoe = await rocketTokenClient.allowanceOf(zoe, alice);
        expect(allowanceZoe).to.equal(5);
      });
    });
  });

  describe("Alice revoking Zoe as a spender", () => {
    before(async () => {
      const receipt = await rocketTokenClient.revoke(zoe, { sender: alice });
    });

    it("should decrease Zoe's allowance (0 RKT)", async () => {
      const allowanceZoe = await rocketTokenClient.allowanceOf(zoe, alice);
      expect(allowanceZoe).to.equal(0);
    });

    describe("Zoe transfering 1 RKT to Bob on Alice behalf", () => {
      let receipt: Receipt;

      before(async () => {
        receipt = await rocketTokenClient.transferFrom(alice, bob, 1, { sender: zoe });
      });

      it("should return an invalid receipt", async () => {
        expect(receipt.success).to.be.false;
      });

      it("should not decrease Alice's balance (0 RKT)", async () => {
        const balanceAlice = await rocketTokenClient.balanceOf(alice);
        expect(balanceAlice).to.equal(0);
      });

      it("should not increase Bob's balance (30 RKT)", async () => {
        const balanceBob = await rocketTokenClient.balanceOf(bob);
        expect(balanceBob).to.equal(30);
      });
    });
  });

  describe("Alice approving Zoe to spend -10 RKT on her behalf", () => {
    let receipt: Receipt;

    before(async () => {
      receipt = await rocketTokenClient.approve(zoe, -10, { sender: alice });
    });

    it("should return an invalid receipt", async () => {
      expect(receipt.success).to.be.false;
    });

    it("should impact Zoe's allowance (0 RKT)", async () => {
      const allowanceZoe = await rocketTokenClient.allowanceOf(zoe, alice);
      expect(allowanceZoe).to.equal(0);
    });
  });
});

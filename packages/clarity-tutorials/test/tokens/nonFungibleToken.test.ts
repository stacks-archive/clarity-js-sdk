import { it, before } from "mocha";
import { expect } from "chai";
import { NonFungibleTokenClient } from "../../src/clients/tokens/nonFungibleToken";
import { CargoBuildProvider, Receipt } from "../../../clarity/src";

describe("NonFungibleTokenClient Test Suite", () => {
  let nftokenStockClient: NonFungibleTokenClient;

  const addresses = [
    "SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7",
    "S02J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKPVKG2CE",
    "SZ2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKQ9H6DPR",
    "ST2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKQYAC0RQ"
  ];

  const alice = addresses[0];
  const bob = addresses[1];
  const zoe = addresses[2];
  const yann = addresses[3];

  before(async () => {
    const provider = await CargoBuildProvider.createEphemeral();
    nftokenStockClient = new NonFungibleTokenClient();
    await nftokenStockClient.tearUp(provider);
  });

  it("should have a valid syntax", async () => {
    const res = await nftokenStockClient.checkContract();
    expect(res).to.be.true;
  });

  describe("Deploying an instance of the contract", () => {
    before(async () => {
      await nftokenStockClient.deployContract();
    });

    it("should initialize Alice's balance (2 asset)", async () => {
      const balanceAlice = await nftokenStockClient.balanceOf(alice);
      expect(balanceAlice).to.equal(2);
    });

    it("should initialize Bob's balance (1 asset)", async () => {
      const balanceBob = await nftokenStockClient.balanceOf(bob);
      expect(balanceBob).to.equal(1);
    });

    it("should make Alice owner of asset #10001", async () => {
      const owner10001 = await nftokenStockClient.ownerOf(10001);
      expect(owner10001).to.equal(alice);
    });

    it("should make Alice owner of asset #10002", async () => {
      const owner10002 = await nftokenStockClient.ownerOf(10002);
      expect(owner10002).to.equal(alice);
    });

    it("should make Bib owner of asset #10003", async () => {
      const owner10003 = await nftokenStockClient.ownerOf(10003);
      expect(owner10003).to.equal(bob);
    });
  });

  describe("Alice transfering asset #10001 to Bob", () => {
    before(async () => {
      await nftokenStockClient.transfer(bob, 10001, { sender: alice });
    });

    it("should decrease Alice's balance (1 asset)", async () => {
      const balanceAlice = await nftokenStockClient.balanceOf(alice);
      expect(balanceAlice).to.equal(1);
    });

    it("should increase Bob's balance (2 assets)", async () => {
      const balanceBob = await nftokenStockClient.balanceOf(bob);
      expect(balanceBob).to.equal(2);
    });

    it("should make Bob owner of asset #10001", async () => {
      const owner10001 = await nftokenStockClient.ownerOf(10001);
      expect(owner10001).to.equal(bob);
    });
  });

  describe("Alice transfering an asset that she does NOT own to Yann", () => {
    let receipt: Receipt;

    before(async () => {
      receipt = await nftokenStockClient.transfer(bob, 10003, { sender: alice });
    });

    it("should return an invalid receipt", async () => {
      expect(receipt.success).to.be.false;
    });

    it("should not increase Yann's balance (0 assets)", async () => {
      const balanceYann = await nftokenStockClient.balanceOf(yann);
      expect(balanceYann).to.equal(0);
    });

    it("should not decrease Bob's balance (2 assets)", async () => {
      const balanceBob = await nftokenStockClient.balanceOf(bob);
      expect(balanceBob).to.equal(2);
    });
  });

  describe("Alice transfering an asset that she owns to herself", () => {
    let receipt: Receipt;

    before(async () => {
      receipt = await nftokenStockClient.transfer(alice, 10002, { sender: alice });
    });

    it("should return an invalid receipt", async () => {
      expect(receipt.success).to.be.false;
    });

    it("should not increase Yann's balance (0 assets)", async () => {
      const balanceAlice = await nftokenStockClient.balanceOf(alice);
      expect(balanceAlice).to.equal(1);
    });

    it("should not decrease Bob's balance (2 assets)", async () => {
      const balanceBob = await nftokenStockClient.balanceOf(bob);
      expect(balanceBob).to.equal(2);
    });
  });

  describe("Alice transfering an asset that she does NOT own to herself", () => {
    let receipt: Receipt;

    before(async () => {
      receipt = await nftokenStockClient.transfer(alice, 10003, { sender: alice });
    });

    it("should return an invalid receipt", async () => {
      expect(receipt.success).to.be.false;
    });

    it("should not increase Alice's balance (1 assets)", async () => {
      const balanceAlice = await nftokenStockClient.balanceOf(alice);
      expect(balanceAlice).to.equal(1);
    });

    it("should not decrease Bob's balance (2 assets)", async () => {
      const balanceBob = await nftokenStockClient.balanceOf(bob);
      expect(balanceBob).to.equal(2);
    });
  });

  describe("Bob approving Zoe to trade the asset #10003 on his behalf", () => {
    before(async () => {
      await nftokenStockClient.setSpenderApproval(zoe, 10003, { sender: bob });
    });

    it("should make Zoe able to transfer asset #10003", async () => {
      const allowanceZoe = await nftokenStockClient.canTransfer(zoe, 10003);
      expect(allowanceZoe).to.be.true;
    });

    it("should NOT make Zoe able to transfer asset #10001", async () => {
      const allowanceZoe = await nftokenStockClient.canTransfer(zoe, 10001);
      expect(allowanceZoe).to.be.false;
    });

    describe("Zoe transfering asset #10003 from Alice to Bob", () => {
      let receipt: Receipt;

      before(async () => {
        receipt = await nftokenStockClient.transferFrom(alice, bob, 10003, { sender: zoe });
      });

      it("should return an invalid receipt", async () => {
        expect(receipt.success).to.be.false;
      });

      it("should not increase Alice's balance (1 assets)", async () => {
        const balanceAlice = await nftokenStockClient.balanceOf(alice);
        expect(balanceAlice).to.equal(1);
      });

      it("should not decrease Bob's balance (2 assets)", async () => {
        const balanceBob = await nftokenStockClient.balanceOf(bob);
        expect(balanceBob).to.equal(2);
      });
    });

    describe("Zoe transfering asset #10003 to Alice on Bob behalf", () => {
      before(async () => {
        await nftokenStockClient.transferFrom(bob, alice, 10003, { sender: zoe });
      });

      it("should increase Alice's balance (2 asset)", async () => {
        const balanceAlice = await nftokenStockClient.balanceOf(alice);
        expect(balanceAlice).to.equal(2);
      });

      it("should decrease Bob's balance (1 asset)", async () => {
        const balanceBob = await nftokenStockClient.balanceOf(bob);
        expect(balanceBob).to.equal(1);
      });

      it("should make Alice owner of asset #10002", async () => {
        const owner10002 = await nftokenStockClient.ownerOf(10002);
        expect(owner10002).to.equal(alice);
      });

      it("should revoke Zoe's ability to trade asset #10002", async () => {
        const allowanceZoe = await nftokenStockClient.canTransfer(zoe, 10002);
        expect(allowanceZoe).to.be.false;
      });
    });
  });

  describe("Alice approving Yann as an operator", () => {
    before(async () => {
      await nftokenStockClient.setOperatorApproval(yann, true, { sender: alice });
    });

    it("should NOT make Yann able to transfer asset #10001", async () => {
      const allowanceYann = await nftokenStockClient.canTransfer(yann, 10001);
      expect(allowanceYann).to.be.false;
    });

    it("should make Yann able to transfer asset #10002", async () => {
      const allowanceYann = await nftokenStockClient.canTransfer(yann, 10002);
      expect(allowanceYann).to.be.true;
    });

    it("should make Zoe able to transfer asset #10003", async () => {
      const allowanceYann = await nftokenStockClient.canTransfer(yann, 10003);
      expect(allowanceYann).to.be.true;
    });

    describe("Yann transfering asset #10001 from Alice to Bob", () => {
      let receipt: Receipt;

      before(async () => {
        receipt = await nftokenStockClient.transferFrom(alice, bob, 10001, { sender: yann });
      });

      it("should return an invalid receipt", async () => {
        expect(receipt.success).to.be.false;
      });

      it("should not increase Alice's balance (2 assets)", async () => {
        const balanceAlice = await nftokenStockClient.balanceOf(alice);
        expect(balanceAlice).to.equal(2);
      });

      it("should not decrease Bob's balance (1 assets)", async () => {
        const balanceBob = await nftokenStockClient.balanceOf(bob);
        expect(balanceBob).to.equal(1);
      });
    });

    describe("Yann transfering asset #10002 from Bob to Alice", () => {
      let receipt: Receipt;

      before(async () => {
        receipt = await nftokenStockClient.transferFrom(bob, alice, 10002, { sender: yann });
      });

      it("should return an invalid receipt", async () => {
        expect(receipt.success).to.be.false;
      });

      it("should not increase Alice's balance (2 assets)", async () => {
        const balanceAlice = await nftokenStockClient.balanceOf(alice);
        expect(balanceAlice).to.equal(2);
      });

      it("should not decrease Bob's balance (1 assets)", async () => {
        const balanceBob = await nftokenStockClient.balanceOf(bob);
        expect(balanceBob).to.equal(1);
      });
    });

    describe("Yann transfering asset #10002 from Alice to Bob", () => {
      let receipt: Receipt;

      before(async () => {
        receipt = await nftokenStockClient.transferFrom(alice, bob, 10002, { sender: yann });
      });

      it("should return an invalid receipt", async () => {
        expect(receipt.success).to.be.true;
      });

      it("should increase Alice's balance (1 assets)", async () => {
        const balanceAlice = await nftokenStockClient.balanceOf(alice);
        expect(balanceAlice).to.equal(1);
      });

      it("should decrease Bob's balance (2 assets)", async () => {
        const balanceBob = await nftokenStockClient.balanceOf(bob);
        expect(balanceBob).to.equal(2);
      });

      it("should make Bob owner of asset #10002", async () => {
        const owner10002 = await nftokenStockClient.ownerOf(10002);
        expect(owner10002).to.equal(bob);
      });

      it("should revoke Yann's ability to trade asset #10002", async () => {
        const allowanceYann = await nftokenStockClient.canTransfer(yann, 10002);
        expect(allowanceYann).to.be.false;
      });
    });
    describe("Alice revoking Yann as an operator", () => {
      before(async () => {
        await nftokenStockClient.setOperatorApproval(yann, false, { sender: alice });
      });

      it("should revoke Yann's ability to trade asset #10003", async () => {
        const allowanceYann = await nftokenStockClient.canTransfer(yann, 10003);
        expect(allowanceYann).to.be.false;
      });
    });
  });
});

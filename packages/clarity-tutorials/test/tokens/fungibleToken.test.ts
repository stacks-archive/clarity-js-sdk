import { Provider, ProviderRegistry, Receipt } from "@blockstack/clarity";
import { FungibleTokenClient } from "../../src/clients/tokens/fungibleToken";

describe("FungibleTokenClient Test Suite", () => {
  let stacksTokenClient: FungibleTokenClient;
  let provider: Provider;

  const addresses = [
    "SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7",
    "S02J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKPVKG2CE",
    "SZ2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKQ9H6DPR"
  ];
  const alice = addresses[0];
  const bob = addresses[1];
  const zoe = addresses[2];

  beforeAll(async () => {
    provider = await ProviderRegistry.createProvider();
    stacksTokenClient = new FungibleTokenClient(provider);
    await stacksTokenClient.deployContract();
  });

  it("should have a valid syntax", async () => {
    await stacksTokenClient.checkContract();
  });

  describe("Deploying an instance of the contract", () => {

    it("should initialize Alice's balance (20 STX)", async () => {
      const balanceAlice = await stacksTokenClient.balanceOf(alice);
      expect(balanceAlice).toEqual(20);
    });

    it("should initialize Bob's balance (10 STX)", async () => {
      const balanceBob = await stacksTokenClient.balanceOf(bob);
      expect(balanceBob).toEqual(10);
    });

    it("should initialize Zoe's balance (0 STX)", async () => {
      const balanceZoe = await stacksTokenClient.balanceOf(zoe);
      expect(balanceZoe).toEqual(0);
    });
  });

  describe("Alice transfering 5 STX to Bob", () => {
    beforeAll(async () => {
      await stacksTokenClient.transfer(bob, 5, { sender: alice });
    });

    it("should decrease Alice's balance (15 STX)", async () => {
      const balanceAlice = await stacksTokenClient.balanceOf(alice);
      expect(balanceAlice).toEqual(15);
    });

    it("should increase Bob's balance (15 STX)", async () => {
      const balanceBob = await stacksTokenClient.balanceOf(bob);
      expect(balanceBob).toEqual(15);
    });
  });

  describe("Alice transfering -5 STX to Bob", () => {
    let receipt: Receipt;

    beforeAll(async () => {
      receipt = await stacksTokenClient.transfer(bob, 16, { sender: alice });
    });

    it("should return an invalid receipt", async () => {
      expect(receipt.success).toBeFalsy();
    });

    it("should not increase Alice's balance (15 STX)", async () => {
      const balanceAlice = await stacksTokenClient.balanceOf(alice);
      expect(balanceAlice).toEqual(15);
    });

    it("should not decrease Bob's balance (15 STX)", async () => {
      const balanceBob = await stacksTokenClient.balanceOf(bob);
      expect(balanceBob).toEqual(15);
    });
  });

  describe("Bob transfering 16 STX to Alice", () => {
    let receipt: Receipt;

    beforeAll(async () => {
      receipt = await stacksTokenClient.transfer(bob, 16, { sender: alice });
    });

    it("should return an invalid receipt", async () => {
      expect(receipt.success).toBeFalsy();
    });

    it("should not increase Alice's balance (15 STX)", async () => {
      const balanceAlice = await stacksTokenClient.balanceOf(alice);
      expect(balanceAlice).toEqual(15);
    });

    it("should not decrease Bob's balance (15 STX)", async () => {
      const balanceBob = await stacksTokenClient.balanceOf(bob);
      expect(balanceBob).toEqual(15);
    });
  });

  describe("Alice approving Zoe to spend 10 STX on her behalf, with allowance <= balance", () => {
    let receipt: Receipt;
    beforeAll(async () => {
      receipt = await stacksTokenClient.approve(zoe, 10, { sender: alice });
    });

    it("should increase Zoe's allowance (10 STX)", async () => {
      const allowanceZoe = await stacksTokenClient.allowanceOf(zoe, alice);
      expect(allowanceZoe).toEqual(10);
    });

    describe("Zoe transfering 10 STX to Bob on Alice behalf", () => {
      beforeAll(async () => {
        await stacksTokenClient.transferFrom(alice, bob, 10, { sender: zoe });
      });

      it("should decrease Alice's balance (5 STX)", async () => {
        const balanceAlice = await stacksTokenClient.balanceOf(alice);
        expect(balanceAlice).toEqual(5);
      });

      it("should increase Bob's balance (25 STX)", async () => {
        const balanceBob = await stacksTokenClient.balanceOf(bob);
        expect(balanceBob).toEqual(25);
      });

      it("should decrease Zoe's allowance (0 STX)", async () => {
        const allowanceZoe = await stacksTokenClient.allowanceOf(zoe, alice);
        expect(allowanceZoe).toEqual(0);
      });
    });

    describe("Zoe transfering 1 STX to Bob on Alice behalf", () => {
      let receipt: Receipt;

      beforeAll(async () => {
        receipt = await stacksTokenClient.transferFrom(alice, bob, 10, { sender: zoe });
      });

      it("should return an invalid receipt", async () => {
        expect(receipt.success).toBeFalsy();
      });

      it("should not decrease Alice's balance (5 STX)", async () => {
        const balanceAlice = await stacksTokenClient.balanceOf(alice);
        expect(balanceAlice).toEqual(5);
      });

      it("should not increase Bob's balance (25 STX)", async () => {
        const balanceBob = await stacksTokenClient.balanceOf(bob);
        expect(balanceBob).toEqual(25);
      });
    });
  });

  // tslint:disable-next-line: max-line-length
  describe("Alice approving Zoe to spend 10 STX on her behalf, with allowance >= balance, allowance > 0", () => {
    beforeAll(async () => {
      await stacksTokenClient.approve(zoe, 10, { sender: alice });
    });

    it("should increase Zoe's allowance (10 STX)", async () => {
      const allowanceZoe = await stacksTokenClient.allowanceOf(zoe, alice);
      expect(allowanceZoe).toEqual(10);
    });

    describe("Zoe transfering 10 STX to Bob on Alice behalf", () => {
      let receipt: Receipt;

      beforeAll(async () => {
        receipt = await stacksTokenClient.transferFrom(alice, bob, 10, { sender: zoe });
      });

      it("should return an invalid receipt", async () => {
        expect(receipt.success).toBeFalsy();
      });

      it("should not decrease Alice's balance (5 STX)", async () => {
        const balanceAlice = await stacksTokenClient.balanceOf(alice);
        expect(balanceAlice).toEqual(5);
      });

      it("should not increase Bob's balance (25 STX)", async () => {
        const balanceBob = await stacksTokenClient.balanceOf(bob);
        expect(balanceBob).toEqual(25);
      });

      it("should not decrease Zoe's allowance (10 STX)", async () => {
        const allowanceZoe = await stacksTokenClient.allowanceOf(zoe, alice);
        expect(allowanceZoe).toEqual(10);
      });
    });

    describe("Zoe transfering 5 STX to Bob on Alice behalf", () => {
      beforeAll(async () => {
        await stacksTokenClient.transferFrom(alice, bob, 5, { sender: zoe });
      });

      it("should decrease Alice's balance (0 STX)", async () => {
        const balanceAlice = await stacksTokenClient.balanceOf(alice);
        expect(balanceAlice).toEqual(0);
      });

      it("should increase Bob's balance (30 STX)", async () => {
        const balanceBob = await stacksTokenClient.balanceOf(bob);
        expect(balanceBob).toEqual(30);
      });

      it("should decrease Zoe's allowance (5 STX)", async () => {
        const allowanceZoe = await stacksTokenClient.allowanceOf(zoe, alice);
        expect(allowanceZoe).toEqual(5);
      });
    });
  });

  describe("Alice revoking Zoe as a spender", () => {
    beforeAll(async () => {
      const receipt = await stacksTokenClient.revoke(zoe, { sender: alice });
    });

    it("should decrease Zoe's allowance (0 STX)", async () => {
      const allowanceZoe = await stacksTokenClient.allowanceOf(zoe, alice);
      expect(allowanceZoe).toEqual(0);
    });

    describe("Zoe transfering 1 STX to Bob on Alice behalf", () => {
      let receipt: Receipt;

      beforeAll(async () => {
        receipt = await stacksTokenClient.transferFrom(alice, bob, 1, { sender: zoe });
      });

      it("should return an invalid receipt", async () => {
        expect(receipt.success).toBeFalsy();
      });

      it("should not decrease Alice's balance (0 STX)", async () => {
        const balanceAlice = await stacksTokenClient.balanceOf(alice);
        expect(balanceAlice).toEqual(0);
      });

      it("should not increase Bob's balance (30 STX)", async () => {
        const balanceBob = await stacksTokenClient.balanceOf(bob);
        expect(balanceBob).toEqual(30);
      });
    });
  });

  describe("Alice approving Zoe to spend -10 STX on her behalf", () => {
    let receipt: Receipt;

    beforeAll(async () => {
      receipt = await stacksTokenClient.approve(zoe, -10, { sender: alice });
    });

    it("should return an invalid receipt", async () => {
      expect(receipt.success).toBeFalsy();
    });

    it("should impact Zoe's allowance (0 STX)", async () => {
      const allowanceZoe = await stacksTokenClient.allowanceOf(zoe, alice);
      expect(allowanceZoe).toEqual(0);
    });
  });

  afterAll(async () => {
    await provider.close();
  });
});

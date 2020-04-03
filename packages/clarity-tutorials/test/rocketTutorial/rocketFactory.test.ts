import { Provider, ProviderRegistry, Receipt } from "@blockstack/clarity";
import { RocketFactoryClient } from "../../src/clients/rocketTutorial/rocketFactory";
import { RocketMarketClient } from "../../src/clients/rocketTutorial/rocketMarket";
import { RocketTokenClient } from "../../src/clients/rocketTutorial/rocketToken";

describe("RocketFactoryClient Test Suite", () => {
  let rocketFactoryClient: RocketFactoryClient;
  let rocketTokenClient: RocketTokenClient;
  let rocketMarketClient: RocketMarketClient;
  let provider: Provider;

  const addresses = [
    "SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7",
    "S02J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKPVKG2CE",
    "SZ2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKQ9H6DPR"
  ];
  const alice = addresses[0];
  const bob = addresses[1];
  const factory = addresses[2];

  const deployContracts = async () => {
    await rocketTokenClient.deployContract();
    await rocketMarketClient.deployContract();
    await rocketFactoryClient.deployContract();
  };

  beforeAll(async () => {
    provider = await ProviderRegistry.createProvider();

    rocketFactoryClient = new RocketFactoryClient(provider);
    rocketTokenClient = new RocketTokenClient(provider);
    rocketMarketClient = new RocketMarketClient(provider);

    await deployContracts();
  });

  test("should have a valid syntax", async () => {
    await expect(rocketFactoryClient.checkContract()).resolves.not.toThrow();
    await expect(rocketTokenClient.checkContract()).resolves.not.toThrow();
    await expect(rocketMarketClient.checkContract()).resolves.not.toThrow();
    // let res = await rocketTokenClient.checkContract();
    // expect(res).toBeTruthy();
  });

  describe("Deploying an instance of the contract", () => {
    it("should initialize Alice's state so that she can buy a new rocket", async () => {
      const canAliceBuy = await rocketFactoryClient.canUserBuy(alice);
      expect(canAliceBuy).toBeTruthy();
    });

    it("should initialize Bob's state so that he can buy a new rocket", async () => {
      const canBobBuy = await rocketFactoryClient.canUserBuy(bob);
      expect(canBobBuy).toBeTruthy();
    });

    it("should initialize Alice's number of rockets to 0", async () => {
      const aliceBalance = await rocketMarketClient.balanceOf(alice);
      expect(aliceBalance).toEqual(0);
    });

    it("should initialize Bob's number of rockets to 0", async () => {
      const bobBalance = await rocketMarketClient.balanceOf(bob);
      expect(bobBalance).toEqual(0);
    });

    it("should initialize Alice's balance (20 RKT)", async () => {
      const balanceAlice = await rocketTokenClient.balanceOf(alice);
      expect(balanceAlice).toEqual(20);
    });

    it("should initialize Bob's balance (10 RKT)", async () => {
      const balanceBob = await rocketTokenClient.balanceOf(bob);
      expect(balanceBob).toEqual(10);
    });

    it("should initialize the total supply of RKT to 30", async () => {
      const totalSupply = await rocketTokenClient.totalSupply();
      expect(totalSupply).toEqual(30);
    });
  });

  describe("Alice buying a rocket of size 1", () => {
    let receipt: Receipt;

    beforeAll(async () => {
      receipt = await rocketFactoryClient.orderRocket(1, { sender: alice });
    });

    it("should return an invalid receipt", async () => {
      expect(receipt.success).toBeFalsy();
    });

    it("should not make Alice unable to buy a new rocket", async () => {
      const canAliceBuy = await rocketFactoryClient.canUserBuy(alice);
      expect(canAliceBuy).toBeTruthy();
    });

    it("should not decrease Alice's balance (20 RKT remaining)", async () => {
      const balanceAlice = await rocketTokenClient.balanceOf(alice);
      expect(balanceAlice).toEqual(20);
    });
  });

  describe("Alice buying a rocket of size 21", () => {
    let receipt: Receipt;

    beforeAll(async () => {
      receipt = await rocketFactoryClient.orderRocket(1, { sender: alice });
    });

    it("should return an invalid receipt", async () => {
      expect(receipt.success).toBeFalsy();
    });

    it("should not make Alice unable to buy a new rocket", async () => {
      const canAliceBuy = await rocketFactoryClient.canUserBuy(alice);
      expect(canAliceBuy).toBeTruthy();
    });

    it("should not decrease Alice's balance (20 RKT remaining)", async () => {
      const balanceAlice = await rocketTokenClient.balanceOf(alice);
      expect(balanceAlice).toEqual(20);
    });
  });

  describe.skip("Alice buying a rocket of size 2", () => {
    let minedAt: bigint;

    beforeAll(async () => {
      await deployContracts();
      await rocketFactoryClient.orderRocket(2, { sender: alice });
      minedAt = await provider.getBlockHeight();
    });

    it("should make Alice unable to buy a new rocket", async () => {
      const canAliceBuy = await rocketFactoryClient.canUserBuy(alice);
      expect(canAliceBuy).toBeFalsy();
    });

    it("should decrease Alice's balance to 19 RKT", async () => {
      const balanceAlice = await rocketTokenClient.balanceOf(alice);
      expect(balanceAlice).toEqual(19);
    });

    it("should not produce a claimable rocket", async () => {
      const isRocketClaimable = await rocketFactoryClient.canUserBuy(alice);
      expect(isRocketClaimable).toBeFalsy();
    });

    it("should not impact Bob's ability to buy a new rocket", async () => {
      const canBobBuy = await rocketFactoryClient.canUserBuy(bob);
      expect(canBobBuy).toBeTruthy();
    });

    it("should not impact Bob's balance (10 RKT)", async () => {
      const balanceBob = await rocketTokenClient.balanceOf(bob);
      expect(balanceBob).toEqual(10);
    });

    describe("1 block after the transaction, Alice's rocket", () => {
      beforeAll(async () => {
        await provider.mineBlock();
      });

      it("should not be claimable", async () => {
        const isRocketClaimable = await rocketFactoryClient.canUserClaim(alice);
        expect(isRocketClaimable).toBeFalsy();
      });
    });

    describe("2 blocks after the transaction, Alice's rocket", () => {
      beforeAll(async () => {
        await provider.mineBlock();
        await provider.mineBlock();
      });

      it("should be claimable", async () => {
        const isRocketClaimable = await rocketFactoryClient.canUserClaim(alice);
        expect(isRocketClaimable).toBeTruthy();
      });

      describe("Alice claiming her rocket", () => {
        let receipt: Receipt;

        beforeAll(async () => {
          receipt = await rocketFactoryClient.claimRocket({ sender: alice });
        });

        it("should return a valid receipt", async () => {
          expect(receipt.success).toBeTruthy();
        });

        it("should make Alice able to buy a new rocket", async () => {
          const canAliceBuy = await rocketFactoryClient.canUserBuy(alice);
          expect(canAliceBuy).toBeTruthy();
        });

        it("should decrease Alice's balance of 1 RKT (18 RKT remaining)", async () => {
          const balanceAlice = await rocketTokenClient.balanceOf(alice);
          expect(balanceAlice).toEqual(18);
        });

        it("should update Alice's number of rockets to 1", async () => {
          const aliceBalance = await rocketMarketClient.balanceOf(alice);
          expect(aliceBalance).toEqual(1);
        });
      });
    });
  });

  describe.skip("Alice buying a rocket of size 11", () => {
    let minedAt: bigint;

    beforeAll(async () => {
      await rocketFactoryClient.orderRocket(11, { sender: alice });
      minedAt = await provider.getBlockHeight();
    });

    it("should make Alice unable to buy a new rocket", async () => {
      const canAliceBuy = await rocketFactoryClient.canUserBuy(alice);
      expect(canAliceBuy).toBeFalsy();
    });

    it("should decrease Alice's balance to 13 RKT", async () => {
      const balanceAlice = await rocketTokenClient.balanceOf(alice);
      expect(balanceAlice).toEqual(13);
    });

    it("should not produce a claimable rocket", async () => {
      const isRocketClaimable = await rocketFactoryClient.canUserBuy(alice);
      expect(isRocketClaimable).toBeFalsy();
    });

    it("should not impact Bob's ability to buy a new rocket", async () => {
      const canBobBuy = await rocketFactoryClient.canUserBuy(bob);
      expect(canBobBuy).toBeTruthy();
    });

    it("should not impact Bob's balance (10 RKT)", async () => {
      const balanceBob = await rocketTokenClient.balanceOf(bob);
      expect(balanceBob).toEqual(10);
    });

    describe("1 block after the transaction, Alice's rocket", () => {
      beforeAll(async () => {
        await provider.mineBlock();
      });

      it("should not be claimable", async () => {
        const isRocketClaimable = await rocketFactoryClient.canUserClaim(alice);
        expect(isRocketClaimable).toBeFalsy();
      });
    });

    describe("5 blocks after the transaction, Alice's rocket", () => {
      beforeAll(async () => {
        await provider.mineBlock();
        await provider.mineBlock();
        await provider.mineBlock();
        await provider.mineBlock();
      });

      it("should not be claimable", async () => {
        const isRocketClaimable = await rocketFactoryClient.canUserClaim(alice);
        expect(isRocketClaimable).toBeFalsy();
      });
    });

    describe("11 blocks after the transaction, Alice's rocket", () => {
      beforeAll(async () => {
        await provider.mineBlock();
        await provider.mineBlock();
        await provider.mineBlock();
        await provider.mineBlock();
        await provider.mineBlock();
        await provider.mineBlock();
      });

      it("should be claimable", async () => {
        const isRocketClaimable = await rocketFactoryClient.canUserClaim(alice);
        expect(isRocketClaimable).toBeTruthy();
      });

      describe("Alice claiming her rocket", () => {
        beforeAll(async () => {
          await rocketFactoryClient.claimRocket({ sender: alice });
        });

        it("should make Alice able to buy a new rocket", async () => {
          const canAliceBuy = await rocketFactoryClient.canUserBuy(alice);
          expect(canAliceBuy).toBeTruthy();
        });

        it("should decrease Alice's balance of 6 RKT (7 RKT remaining)", async () => {
          const balanceAlice = await rocketTokenClient.balanceOf(alice);
          expect(balanceAlice).toEqual(7);
        });

        it("should update Alice's number of rockets to 1", async () => {
          const aliceBalance = await rocketMarketClient.balanceOf(alice);
          expect(aliceBalance).toEqual(2);
        });
      });
    });
  });

  describe.skip("Alice buying a rocket of size 14", () => {
    let minedAt: bigint;

    beforeAll(async () => {
      await rocketFactoryClient.orderRocket(14, { sender: alice });
      minedAt = await provider.getBlockHeight();
    });

    it("should make Alice unable to buy a new rocket", async () => {
      const canAliceBuy = await rocketFactoryClient.canUserBuy(alice);
      expect(canAliceBuy).toBeFalsy();
    });

    it("should decrease Alice's balance to 0 RKT", async () => {
      const balanceAlice = await rocketTokenClient.balanceOf(alice);
      expect(balanceAlice).toEqual(0);
    });

    it("should not produce a claimable rocket", async () => {
      const isRocketClaimable = await rocketFactoryClient.canUserBuy(alice);
      expect(isRocketClaimable).toBeFalsy();
    });

    describe("14 blocks after the transaction, Alice's rocket", () => {
      beforeAll(async () => {
        for (let i = 0; i < 14; i++) {
          await provider.mineBlock();
        }
      });

      it("should be claimable", async () => {
        const isRocketClaimable = await rocketFactoryClient.canUserClaim(alice);
        expect(isRocketClaimable).toBeTruthy();
      });

      describe("Alice claiming her rocket (with a RKT balance of 0)", () => {
        let receipt: Receipt;

        beforeAll(async () => {
          receipt = await rocketFactoryClient.claimRocket({ sender: alice });
        });

        it("should return an invalid receipt", async () => {
          expect(receipt.success).toBeFalsy();
        });
      });
    });
  });

  afterAll(async () => {
    await provider.close();
  });
});

import { expect } from "chai";
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import BN from "bn.js";

import {
  admin,
  client,
  configPda,
  creator,
  curator,
  poolPda,
  postId,
  tokenMint,
  treasury,
  user,
} from "./helpers";

import {
  derivePoolAddresses,
  findBinPda,
  findConfigPda,
  findMarketStatePda,
  findPoolPda,
  findPoolSolVaultPda,
  findTokenMintPda,
  RedCircleClient,
} from "../sdk/src";

describe("SDK: RedCircleClient", () => {
  let localClient: RedCircleClient;

  before(() => {
    localClient = client;
  });

  describe("PDA helpers", () => {
    it("matches standalone helpers", () => {
      expect(localClient.programId.toBase58()).to.equal(
        client.programId.toBase58()
      );
      expect(localClient.getConfigPda().toBase58()).to.equal(
        findConfigPda(client.programId)[0].toBase58()
      );
      expect(localClient.getPoolPda(postId).toBase58()).to.equal(
        findPoolPda(postId, client.programId)[0].toBase58()
      );
      expect(localClient.getMarketStatePda(poolPda).toBase58()).to.equal(
        findMarketStatePda(poolPda, client.programId)[0].toBase58()
      );
      expect(localClient.getTokenMintPda(poolPda).toBase58()).to.equal(
        findTokenMintPda(poolPda, client.programId)[0].toBase58()
      );
      expect(localClient.getPoolSolVaultPda(poolPda).toBase58()).to.equal(
        findPoolSolVaultPda(poolPda, client.programId)[0].toBase58()
      );
      expect(localClient.getBinPda(poolPda, 1).toBase58()).to.equal(
        findBinPda(poolPda, 1, client.programId)[0].toBase58()
      );
    });

    it("derivePoolAddresses matches standalone helper", () => {
      const fromClient = localClient.derivePoolAddresses(postId);
      const fromHelper = derivePoolAddresses(postId, client.programId);
      expect(fromClient.config.toBase58()).to.equal(
        fromHelper.config.toBase58()
      );
      expect(fromClient.pool.toBase58()).to.equal(fromHelper.pool.toBase58());
      expect(fromClient.marketState.toBase58()).to.equal(
        fromHelper.marketState.toBase58()
      );
      expect(fromClient.tokenMint.toBase58()).to.equal(
        fromHelper.tokenMint.toBase58()
      );
    });
  });

  describe("account fetchers", () => {
    it("fetchConfig returns valid config", async () => {
      const config = await localClient.fetchConfig();
      expect(config.admin.toBase58()).to.equal(admin.publicKey.toBase58());
      expect(config.treasury.toBase58()).to.equal(
        treasury.publicKey.toBase58()
      );
    });

    it("fetchPool returns pool by postId and address", async () => {
      const byPost = await localClient.fetchPool(postId);
      const byAddress = await localClient.fetchPoolByAddress(poolPda);
      expect(byPost.postId).to.equal(postId);
      expect(byAddress.postId).to.equal(postId);
      expect(byPost.tokenMint.toBase58()).to.equal(tokenMint.toBase58());
    });

    it("fetchMarketState returns market metrics", async () => {
      const market = await localClient.fetchMarketState(postId);
      expect(market.pool.toBase58()).to.equal(poolPda.toBase58());
      expect(market.totalTrades.toNumber()).to.be.greaterThan(0);
    });

    it("fetchAllPools returns pool records", async () => {
      const pools = await localClient.fetchAllPools();
      expect(pools.length).to.be.greaterThanOrEqual(1);
      for (const pool of pools) {
        expect(pool.publicKey).to.be.instanceOf(PublicKey);
        expect(pool.account.postId).to.be.a("string");
      }
    });
  });

  describe("instruction builders", () => {
    it("builds createPool instruction", async () => {
      const ix = await localClient.createPool(
        curator.publicKey,
        treasury.publicKey,
        {
          postId: "client-test-pool",
          name: "Client Test",
          symbol: "CTX",
          uri: "https://example.com/ctx",
        }
      );
      expect(ix.programId.toBase58()).to.equal(client.programId.toBase58());
      expect(ix.keys.length).to.be.greaterThan(0);
    });

    it("builds swap/buy/sell instructions", async () => {
      const accounts = {
        user: user.publicKey,
        postId,
        treasury: treasury.publicKey,
        curator: curator.publicKey,
      };
      const buyIx = await localClient.buy(accounts, {
        solAmount: new BN(LAMPORTS_PER_SOL),
        minTokensOut: new BN(0),
      });
      const sellIx = await localClient.sell(accounts, {
        tokenAmount: new BN(1_000_000),
        minSolOut: new BN(0),
      });
      const swapIx = await localClient.swap(accounts, {
        amountIn: new BN(LAMPORTS_PER_SOL),
        minimumAmountOut: new BN(0),
        isBuy: true,
      });
      expect(buyIx.programId.toBase58()).to.equal(client.programId.toBase58());
      expect(sellIx.programId.toBase58()).to.equal(client.programId.toBase58());
      expect(swapIx.programId.toBase58()).to.equal(client.programId.toBase58());
    });

    it("builds admin and fee instructions", async () => {
      const ixs = await Promise.all([
        localClient.initialize(admin.publicKey, treasury.publicKey),
        localClient.updateConfig(admin.publicKey, { isPaused: false }),
        localClient.setCreator(admin.publicKey, postId, creator.publicKey),
        localClient.claimCreatorFees(creator.publicKey, postId),
        localClient.claimCuratorFees(curator.publicKey, postId),
        localClient.claimGrowthFees(
          admin.publicKey,
          postId,
          Keypair.generate().publicKey
        ),
        localClient.migratePool(admin.publicKey, postId, {
          activeBinId: null,
          enforceConditions: false,
        }),
        localClient.initBin(admin.publicKey, postId, {
          binId: 1,
          priceLamportsPerToken: new BN(1_000),
          initialTokenLiquidity: new BN(1),
          initialSolLiquidity: new BN(0),
        }),
      ]);

      for (const ix of ixs) {
        expect(ix.programId.toBase58()).to.equal(client.programId.toBase58());
      }
    });

    it("builds a VersionedTransaction from instructions", async () => {
      const ix = await localClient.updateConfig(admin.publicKey, {
        isPaused: false,
      });
      const tx = await localClient.buildTransaction(admin.publicKey, [ix], {
        computeUnitLimit: 400_000,
      });
      expect(tx).to.exist;
      expect(tx.message).to.exist;
    });
  });

  it("uses the shared config PDA", () => {
    expect(localClient.getConfigPda().toBase58()).to.equal(
      configPda.toBase58()
    );
  });
});

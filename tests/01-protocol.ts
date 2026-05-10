import { expect } from "chai";
import { Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import BN from "bn.js";

import {
  admin,
  airdrop,
  client,
  configPda,
  creator,
  curator,
  growthRecipient,
  marketStatePda,
  nonAdmin,
  poolPda,
  postId,
  program,
  sendIx,
  tokenMint,
  treasury,
  user,
} from "./helpers";

import {
  DEFAULT_SIGMOID_CAP_PRICE,
  DEFAULT_SIGMOID_FLOOR_PRICE,
  DEFAULT_TOKEN_SUPPLY,
  parsePoolModel,
  PoolModel,
} from "../sdk/src";

describe("protocol", () => {
  before(async () => {
    await Promise.all([
      airdrop(admin.publicKey),
      airdrop(treasury.publicKey),
      airdrop(curator.publicKey),
      airdrop(user.publicKey),
      airdrop(creator.publicKey),
      airdrop(growthRecipient.publicKey),
      airdrop(nonAdmin.publicKey),
    ]);
  });

  describe("initialize", () => {
    it("initializes protocol with sigmoid defaults", async () => {
      await sendIx(
        await client.initialize(admin.publicKey, treasury.publicKey, {
          launchProtectionDuration: new BN(0),
          poolCreationFee: new BN(0),
        })
      );

      const config = await client.fetchConfig();
      expect(config.admin.toBase58()).to.equal(admin.publicKey.toBase58());
      expect(config.treasury.toBase58()).to.equal(
        treasury.publicKey.toBase58()
      );
      expect(config.isPaused).to.equal(false);
      expect(config.totalPools.toNumber()).to.equal(0);
      expect(config.defaultSigmoidFloorPrice.toString()).to.equal(
        DEFAULT_SIGMOID_FLOOR_PRICE.toString()
      );
      expect(config.defaultSigmoidCapPrice.toString()).to.equal(
        DEFAULT_SIGMOID_CAP_PRICE.toString()
      );
    });

    it("cannot initialize twice", async () => {
      try {
        await sendIx(
          await client.initialize(admin.publicKey, treasury.publicKey)
        );
        expect.fail("initialize should have failed");
      } catch (err) {
        expect(err).to.exist;
      }
    });
  });

  describe("update_config", () => {
    it("admin can update treasury and restore it", async () => {
      const newTreasury = Keypair.generate();
      await sendIx(
        await client.updateConfig(admin.publicKey, {
          newTreasury: newTreasury.publicKey,
        })
      );

      let config = await client.fetchConfig();
      expect(config.treasury.toBase58()).to.equal(
        newTreasury.publicKey.toBase58()
      );

      await sendIx(
        await client.updateConfig(admin.publicKey, {
          newTreasury: treasury.publicKey,
        })
      );
      config = await client.fetchConfig();
      expect(config.treasury.toBase58()).to.equal(
        treasury.publicKey.toBase58()
      );
    });

    it("non-admin cannot update config", async () => {
      try {
        await sendIx(
          await client.updateConfig(nonAdmin.publicKey, { isPaused: true }),
          [nonAdmin]
        );
        expect.fail("updateConfig should have failed");
      } catch (err: any) {
        expect(err.toString()).to.include("Unauthorized");
      }
    });
  });

  describe("create_pool", () => {
    it("creates a sigmoid bootstrap pool with market state", async () => {
      await sendIx(
        await client.createPool(curator.publicKey, treasury.publicKey, {
          postId,
          name: "Test Post Token",
          symbol: "TPT",
          uri: "https://example.com/metadata.json",
        }),
        [curator]
      );

      const pool = await client.fetchPool(postId);
      const market = await client.fetchMarketState(postId);

      expect(pool.postId).to.equal(postId);
      expect(pool.curator.toBase58()).to.equal(curator.publicKey.toBase58());
      expect(pool.tokenMint.toBase58()).to.equal(tokenMint.toBase58());
      expect(pool.liquiditySolReserve.toNumber()).to.equal(0);
      expect(pool.liquidityTokenReserve.toString()).to.equal(
        DEFAULT_TOKEN_SUPPLY.toString()
      );
      expect(pool.tokensSold.toNumber()).to.equal(0);
      expect(pool.unclaimedGrowthFees.toNumber()).to.equal(0);
      expect(parsePoolModel(pool.model)).to.equal(PoolModel.SigmoidBootstrap);

      expect(market.pool.toBase58()).to.equal(poolPda.toBase58());
      expect(marketStatePda.toBase58()).to.equal(
        client.getMarketStatePda(poolPda).toBase58()
      );
      expect(parsePoolModel(market.model)).to.equal(PoolModel.SigmoidBootstrap);
      expect(market.totalTradeVolume.toNumber()).to.equal(0);

      const config = await client.fetchConfig();
      expect(config.totalPools.toNumber()).to.equal(1);
    });

    it("cannot create duplicate pool for same post", async () => {
      try {
        await sendIx(
          await client.createPool(curator.publicKey, treasury.publicKey, {
            postId,
            name: "Duplicate",
            symbol: "DUP",
            uri: "https://example.com/dup",
          }),
          [curator]
        );
        expect.fail("duplicate pool should have failed");
      } catch (err) {
        expect(err).to.exist;
      }
    });
  });

  it("has enough test SOL for trading", async () => {
    const balance = await program.provider.connection.getBalance(
      user.publicKey
    );
    expect(balance).to.be.greaterThan(10 * LAMPORTS_PER_SOL);
  });
});

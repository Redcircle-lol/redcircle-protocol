import { expect } from "chai";
import {
  Keypair,
  PublicKey,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import BN from "bn.js";

import {
  provider,
  program,
  admin,
  treasury,
  curator,
  user,
  creator,
  inviter,
  configPda,
  postId,
  poolPda,
  tokenMint,
} from "./helpers";

import {
  RedCircleClient,
  findConfigPda,
  findPoolPda,
  findTokenMintPda,
  findPoolSolVaultPda,
  findFeeVaultPda,
  findReferralPda,
  findInviterStatsPda,
  derivePoolAddresses,
} from "../sdk/src";

describe("SDK: RedCircleClient", () => {
  let client: RedCircleClient;

  before(() => {
    client = new RedCircleClient(provider, { programId: program.programId });
  });

  describe("constructor & PDA helpers", () => {
    it("sets programId from opts", () => {
      expect(client.programId.toBase58()).to.equal(
        program.programId.toBase58()
      );
    });

    it("getConfigPda matches standalone helper", () => {
      const fromClient = client.getConfigPda();
      const [fromHelper] = findConfigPda(program.programId);
      expect(fromClient.toBase58()).to.equal(fromHelper.toBase58());
    });

    it("getPoolPda matches standalone helper", () => {
      const fromClient = client.getPoolPda(postId);
      const [fromHelper] = findPoolPda(postId, program.programId);
      expect(fromClient.toBase58()).to.equal(fromHelper.toBase58());
    });

    it("getTokenMintPda matches standalone helper", () => {
      const fromClient = client.getTokenMintPda(poolPda);
      const [fromHelper] = findTokenMintPda(poolPda, program.programId);
      expect(fromClient.toBase58()).to.equal(fromHelper.toBase58());
    });

    it("getPoolSolVaultPda matches standalone helper", () => {
      const fromClient = client.getPoolSolVaultPda(poolPda);
      const [fromHelper] = findPoolSolVaultPda(poolPda, program.programId);
      expect(fromClient.toBase58()).to.equal(fromHelper.toBase58());
    });

    it("getFeeVaultPda matches standalone helper", () => {
      const fromClient = client.getFeeVaultPda();
      const [fromHelper] = findFeeVaultPda(program.programId);
      expect(fromClient.toBase58()).to.equal(fromHelper.toBase58());
    });

    it("getReferralPda matches standalone helper", () => {
      const u = Keypair.generate().publicKey;
      const fromClient = client.getReferralPda(u);
      const [fromHelper] = findReferralPda(u, program.programId);
      expect(fromClient.toBase58()).to.equal(fromHelper.toBase58());
    });

    it("getInviterStatsPda matches standalone helper", () => {
      const inv = Keypair.generate().publicKey;
      const fromClient = client.getInviterStatsPda(inv);
      const [fromHelper] = findInviterStatsPda(inv, program.programId);
      expect(fromClient.toBase58()).to.equal(fromHelper.toBase58());
    });

    it("derivePoolAddresses matches standalone helper", () => {
      const fromClient = client.derivePoolAddresses(postId);
      const fromHelper = derivePoolAddresses(postId, program.programId);
      expect(fromClient.pool.toBase58()).to.equal(fromHelper.pool.toBase58());
      expect(fromClient.tokenMint.toBase58()).to.equal(
        fromHelper.tokenMint.toBase58()
      );
      expect(fromClient.poolSolVault.toBase58()).to.equal(
        fromHelper.poolSolVault.toBase58()
      );
      expect(fromClient.poolTokenVault.toBase58()).to.equal(
        fromHelper.poolTokenVault.toBase58()
      );
      expect(fromClient.config.toBase58()).to.equal(
        fromHelper.config.toBase58()
      );
    });
  });

  describe("account fetchers", () => {
    it("fetchConfig returns valid config", async () => {
      const config = await client.fetchConfig();
      expect(config.admin.toBase58()).to.equal(admin.publicKey.toBase58());
      expect(config.treasury.toBase58()).to.equal(
        treasury.publicKey.toBase58()
      );
      expect(config.totalPools.toNumber()).to.be.greaterThanOrEqual(1);
    });

    it("fetchPool returns pool by postId", async () => {
      const pool = await client.fetchPool(postId);
      expect(pool.postId).to.equal(postId);
      expect(pool.curator.toBase58()).to.equal(curator.publicKey.toBase58());
    });

    it("fetchPoolByAddress returns pool by PDA", async () => {
      const pool = await client.fetchPoolByAddress(poolPda);
      expect(pool.postId).to.equal(postId);
    });

    it("fetchAllPools returns at least 2 pools", async () => {
      const pools = await client.fetchAllPools();
      expect(pools.length).to.be.greaterThanOrEqual(2);
      for (const p of pools) {
        expect(p.publicKey).to.be.instanceOf(PublicKey);
        expect(p.account.postId).to.be.a("string");
      }
    });

    it("fetchReferral returns existing referral", async () => {
      const referral = await client.fetchReferral(user.publicKey);
      expect(referral.user.toBase58()).to.equal(user.publicKey.toBase58());
      expect(referral.inviter.toBase58()).to.equal(
        inviter.publicKey.toBase58()
      );
    });

    it("fetchInviterStats returns existing stats", async () => {
      const stats = await client.fetchInviterStats(inviter.publicKey);
      expect(stats.inviter.toBase58()).to.equal(inviter.publicKey.toBase58());
      expect(stats.totalReferrals.toNumber()).to.be.greaterThanOrEqual(1);
    });
  });

  describe("instruction builders", () => {
    it("createPool returns a TransactionInstruction", async () => {
      const ix = await client.createPool(
        curator.publicKey,
        treasury.publicKey,
        {
          postId: "client-test-pool",
          name: "Client Test",
          symbol: "CTX",
          uri: "https://example.com/ctx",
        }
      );
      expect(ix.programId.toBase58()).to.equal(
        program.programId.toBase58()
      );
      expect(ix.keys.length).to.be.greaterThan(0);
    });

    it("buy returns a TransactionInstruction", async () => {
      const ix = await client.buy(
        user.publicKey,
        postId,
        treasury.publicKey,
        curator.publicKey,
        { solAmount: new BN(LAMPORTS_PER_SOL), minTokensOut: new BN(0) }
      );
      expect(ix.programId.toBase58()).to.equal(
        program.programId.toBase58()
      );
    });

    it("sell returns a TransactionInstruction", async () => {
      const ix = await client.sell(
        user.publicKey,
        postId,
        treasury.publicKey,
        curator.publicKey,
        { tokenAmount: new BN(1000000), minSolOut: new BN(0) }
      );
      expect(ix.programId.toBase58()).to.equal(
        program.programId.toBase58()
      );
    });

    it("swap returns a TransactionInstruction", async () => {
      const ix = await client.swap(
        user.publicKey,
        postId,
        treasury.publicKey,
        curator.publicKey,
        {
          amountIn: new BN(LAMPORTS_PER_SOL),
          minimumAmountOut: new BN(0),
          isBuy: true,
        }
      );
      expect(ix.programId.toBase58()).to.equal(
        program.programId.toBase58()
      );
    });

    it("claimCreatorFees returns a TransactionInstruction", async () => {
      const ix = await client.claimCreatorFees(creator.publicKey, postId);
      expect(ix.programId.toBase58()).to.equal(
        program.programId.toBase58()
      );
    });

    it("claimCuratorFees returns a TransactionInstruction", async () => {
      const ix = await client.claimCuratorFees(curator.publicKey, postId);
      expect(ix.programId.toBase58()).to.equal(
        program.programId.toBase58()
      );
    });

    it("claimInviterFees returns a TransactionInstruction", async () => {
      const ix = await client.claimInviterFees(inviter.publicKey);
      expect(ix.programId.toBase58()).to.equal(
        program.programId.toBase58()
      );
    });

    it("registerReferral returns a TransactionInstruction", async () => {
      const newUser = Keypair.generate().publicKey;
      const ix = await client.registerReferral(newUser, inviter.publicKey);
      expect(ix.programId.toBase58()).to.equal(
        program.programId.toBase58()
      );
    });

    it("setCreator returns a TransactionInstruction", async () => {
      const ix = await client.setCreator(
        admin.publicKey,
        postId,
        creator.publicKey
      );
      expect(ix.programId.toBase58()).to.equal(
        program.programId.toBase58()
      );
    });

    it("updateConfig returns a TransactionInstruction", async () => {
      const ix = await client.updateConfig(admin.publicKey, {
        isPaused: false,
      });
      expect(ix.programId.toBase58()).to.equal(
        program.programId.toBase58()
      );
    });

    it("initialize returns a TransactionInstruction", async () => {
      const ix = await client.initialize(
        admin.publicKey,
        treasury.publicKey
      );
      expect(ix.programId.toBase58()).to.equal(
        program.programId.toBase58()
      );
    });
  });

  describe("buildTransaction", () => {
    it("builds a VersionedTransaction from instructions", async () => {
      const ix = await client.buy(
        user.publicKey,
        postId,
        treasury.publicKey,
        curator.publicKey,
        { solAmount: new BN(LAMPORTS_PER_SOL), minTokensOut: new BN(0) }
      );
      const tx = await client.buildTransaction(user.publicKey, [ix]);
      expect(tx).to.exist;
      expect(tx.message).to.exist;
    });
  });
});

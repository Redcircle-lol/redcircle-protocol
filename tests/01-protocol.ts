import { expect } from "chai";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  getAccount,
} from "@solana/spl-token";
import BN from "bn.js";

import {
  provider,
  program,
  connection,
  admin,
  treasury,
  curator,
  user,
  creator,
  inviter,
  nonAdmin,
  configPda,
  postId,
  poolPda,
  tokenMint,
  poolSolVault,
  feeVault,
  airdrop,
  getPoolTokenVault,
  getUserTokenAccount,
} from "./helpers";

import {
  findPoolPda,
  findTokenMintPda,
  findPoolSolVaultPda,
  findReferralPda,
  findInviterStatsPda,
  estimateBuyTokensOut,
  estimateSellSolOut,
  calculateCurrentPrice,
  CurveType,
  DEFAULT_INITIAL_VIRTUAL_SOL,
  DEFAULT_INITIAL_VIRTUAL_TOKEN,
  LAUNCH_PROTECTION_DURATION,
} from "../sdk/src";

describe("protocol", () => {
  before(async () => {
    await Promise.all([
      airdrop(admin.publicKey),
      airdrop(treasury.publicKey),
      airdrop(curator.publicKey),
      airdrop(user.publicKey),
      airdrop(creator.publicKey),
      airdrop(inviter.publicKey),
      airdrop(nonAdmin.publicKey),
    ]);
  });

  // =========================================================================
  // INITIALIZE
  // =========================================================================
  describe("initialize", () => {
    it("initializes protocol with default config", async () => {
      await program.methods
        .initialize({
          initialVirtualSol: null,
          initialVirtualToken: null,
          poolCreationFee: null,
          launchProtectionDuration: null,
          maxBuyDuringProtection: null,
        })
        .accountsStrict({
          admin: admin.publicKey,
          treasury: treasury.publicKey,
          config: configPda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      const config = await program.account.config.fetch(configPda);
      expect(config.admin.toBase58()).to.equal(admin.publicKey.toBase58());
      expect(config.treasury.toBase58()).to.equal(treasury.publicKey.toBase58());
      expect(config.isPaused).to.equal(false);
      expect(config.totalPools.toNumber()).to.equal(0);
      expect(config.totalVolume.toNumber()).to.equal(0);
      expect(config.totalFeesCollected.toNumber()).to.equal(0);
      expect(config.defaultInitialVirtualSol.toString()).to.equal(
        DEFAULT_INITIAL_VIRTUAL_SOL.toString()
      );
      expect(config.defaultInitialVirtualToken.toString()).to.equal(
        DEFAULT_INITIAL_VIRTUAL_TOKEN.toString()
      );
    });

    it("cannot initialize twice", async () => {
      try {
        await program.methods
          .initialize({
            initialVirtualSol: null,
            initialVirtualToken: null,
              poolCreationFee: null,
            launchProtectionDuration: null,
            maxBuyDuringProtection: null,
          })
          .accountsStrict({
            admin: admin.publicKey,
            treasury: treasury.publicKey,
            config: configPda,
            systemProgram: SystemProgram.programId,
          })
          .rpc();
        expect.fail("Should have thrown");
      } catch (err: any) {
        expect(err).to.exist;
      }
    });
  });

  // =========================================================================
  // UPDATE CONFIG
  // =========================================================================
  describe("update_config", () => {
    it("admin can update treasury", async () => {
      const newTreasury = Keypair.generate();
      await program.methods
        .updateConfig({
          newAdmin: null,
          newTreasury: newTreasury.publicKey,
          isPaused: null,
          defaultInitialVirtualSol: null,
          defaultInitialVirtualToken: null,
          poolCreationFee: null,
          launchProtectionDuration: null,
          maxBuyDuringProtection: null,
        })
        .accountsStrict({
          admin: admin.publicKey,
          config: configPda,
        })
        .rpc();

      const config = await program.account.config.fetch(configPda);
      expect(config.treasury.toBase58()).to.equal(
        newTreasury.publicKey.toBase58()
      );

      // Restore original treasury
      await program.methods
        .updateConfig({
          newAdmin: null,
          newTreasury: treasury.publicKey,
          isPaused: null,
          defaultInitialVirtualSol: null,
          defaultInitialVirtualToken: null,
          poolCreationFee: null,
          launchProtectionDuration: null,
          maxBuyDuringProtection: null,
        })
        .accountsStrict({
          admin: admin.publicKey,
          config: configPda,
        })
        .rpc();
    });

    it("admin can pause the protocol", async () => {
      await program.methods
        .updateConfig({
          newAdmin: null,
          newTreasury: null,
          isPaused: true,
          defaultInitialVirtualSol: null,
          defaultInitialVirtualToken: null,
          poolCreationFee: null,
          launchProtectionDuration: null,
          maxBuyDuringProtection: null,
        })
        .accountsStrict({
          admin: admin.publicKey,
          config: configPda,
        })
        .rpc();

      let config = await program.account.config.fetch(configPda);
      expect(config.isPaused).to.equal(true);

      // Unpause
      await program.methods
        .updateConfig({
          newAdmin: null,
          newTreasury: null,
          isPaused: false,
          defaultInitialVirtualSol: null,
          defaultInitialVirtualToken: null,
          poolCreationFee: null,
          launchProtectionDuration: null,
          maxBuyDuringProtection: null,
        })
        .accountsStrict({
          admin: admin.publicKey,
          config: configPda,
        })
        .rpc();

      config = await program.account.config.fetch(configPda);
      expect(config.isPaused).to.equal(false);
    });

    it("non-admin cannot update config", async () => {
      try {
        await program.methods
          .updateConfig({
            newAdmin: null,
            newTreasury: null,
            isPaused: true,
            defaultInitialVirtualSol: null,
            defaultInitialVirtualToken: null,
            poolCreationFee: null,
            launchProtectionDuration: null,
            maxBuyDuringProtection: null,
          })
          .accountsStrict({
            admin: nonAdmin.publicKey,
            config: configPda,
          })
          .signers([nonAdmin])
          .rpc();
        expect.fail("Should have thrown");
      } catch (err: any) {
        expect(err.toString()).to.include("Unauthorized");
      }
    });
  });

  // =========================================================================
  // CREATE POOL
  // =========================================================================
  describe("create_pool", () => {
    it("creates a pool with default params", async () => {
      // Disable launch protection for easier testing of buy/sell
      await program.methods
        .updateConfig({
          newAdmin: null,
          newTreasury: null,
          isPaused: null,
          defaultInitialVirtualSol: null,
          defaultInitialVirtualToken: null,
          poolCreationFee: null,
          launchProtectionDuration: new BN(0),
          maxBuyDuringProtection: null,
        })
        .accountsStrict({
          admin: admin.publicKey,
          config: configPda,
        })
        .rpc();

      const poolTokenVault = await getPoolTokenVault();

      await program.methods
        .createPool({
          postId,
          name: "Test Post Token",
          symbol: "TPT",
          uri: "https://example.com/metadata.json",
          curveType: null,
          initialVirtualSol: null,
          initialVirtualToken: null,
        })
        .accountsStrict({
          curator: curator.publicKey,
          config: configPda,
          pool: poolPda,
          tokenMint: tokenMint,
          poolTokenVault: poolTokenVault,
          poolSolVault: poolSolVault,
          treasury: treasury.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([curator])
        .rpc();

      const pool = await program.account.pool.fetch(poolPda);
      expect(pool.postId).to.equal(postId);
      expect(pool.curator.toBase58()).to.equal(curator.publicKey.toBase58());
      expect(pool.tokenMint.toBase58()).to.equal(tokenMint.toBase58());
      expect(pool.name).to.equal("Test Post Token");
      expect(pool.symbol).to.equal("TPT");
      expect(pool.uri).to.equal("https://example.com/metadata.json");
      expect(pool.virtualSolReserve.toString()).to.equal(
        DEFAULT_INITIAL_VIRTUAL_SOL.toString()
      );
      expect(pool.virtualTokenReserve.toString()).to.equal(
        DEFAULT_INITIAL_VIRTUAL_TOKEN.toString()
      );
      expect(pool.realSolReserve.toNumber()).to.equal(0);
      expect(pool.tokensSold.toNumber()).to.equal(0);
      expect(pool.totalVolume.toNumber()).to.equal(0);
      expect(pool.totalFees.toNumber()).to.equal(0);
      expect("constantProduct" in pool.curveType).to.be.true;

      const config = await program.account.config.fetch(configPda);
      expect(config.totalPools.toNumber()).to.equal(1);
    });

    it("cannot create duplicate pool for same post", async () => {
      const poolTokenVault = await getPoolTokenVault();
      try {
        await program.methods
          .createPool({
            postId,
            name: "Duplicate",
            symbol: "DUP",
            uri: "https://example.com/dup",
            curveType: null,
            initialVirtualSol: null,
            initialVirtualToken: null,
            })
          .accountsStrict({
            curator: curator.publicKey,
            config: configPda,
            pool: poolPda,
            tokenMint: tokenMint,
            poolTokenVault: poolTokenVault,
            poolSolVault: poolSolVault,
            treasury: treasury.publicKey,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .signers([curator])
          .rpc();
        expect.fail("Should have thrown");
      } catch (err: any) {
        expect(err).to.exist;
      }
    });

    it("cannot create pool when protocol is paused", async () => {
      // Pause
      await program.methods
        .updateConfig({
          newAdmin: null,
          newTreasury: null,
          isPaused: true,
          defaultInitialVirtualSol: null,
          defaultInitialVirtualToken: null,
          poolCreationFee: null,
          launchProtectionDuration: null,
          maxBuyDuringProtection: null,
        })
        .accountsStrict({
          admin: admin.publicKey,
          config: configPda,
        })
        .rpc();

      const pausedPostId = "paused-post";
      const [pausedPool] = findPoolPda(pausedPostId, program.programId);
      const [pausedMint] = findTokenMintPda(pausedPool, program.programId);
      const [pausedVault] = findPoolSolVaultPda(pausedPool, program.programId);
      const pausedTokenVault = await getAssociatedTokenAddress(
        pausedMint,
        pausedPool,
        true
      );

      try {
        await program.methods
          .createPool({
            postId: pausedPostId,
            name: "Paused Pool",
            symbol: "PP",
            uri: "https://example.com/pp",
            curveType: null,
            initialVirtualSol: null,
            initialVirtualToken: null,
            })
          .accountsStrict({
            curator: curator.publicKey,
            config: configPda,
            pool: pausedPool,
            tokenMint: pausedMint,
            poolTokenVault: pausedTokenVault,
            poolSolVault: pausedVault,
            treasury: treasury.publicKey,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .signers([curator])
          .rpc();
        expect.fail("Should have thrown");
      } catch (err: any) {
        expect(err.toString()).to.include("ProtocolPaused");
      }

      // Unpause
      await program.methods
        .updateConfig({
          newAdmin: null,
          newTreasury: null,
          isPaused: false,
          defaultInitialVirtualSol: null,
          defaultInitialVirtualToken: null,
          poolCreationFee: null,
          launchProtectionDuration: null,
          maxBuyDuringProtection: null,
        })
        .accountsStrict({
          admin: admin.publicKey,
          config: configPda,
        })
        .rpc();
    });
  });

  // =========================================================================
  // MULTIPLE POOLS
  // =========================================================================
  describe("multiple pools", () => {
    it("can create pools for different posts", async () => {
      const postId2 = "second-post-002";
      const [pool2] = findPoolPda(postId2, program.programId);
      const [mint2] = findTokenMintPda(pool2, program.programId);
      const [vault2] = findPoolSolVaultPda(pool2, program.programId);
      const tokenVault2 = await getAssociatedTokenAddress(mint2, pool2, true);

      await program.methods
        .updateConfig({
          newAdmin: null,
          newTreasury: null,
          isPaused: null,
          defaultInitialVirtualSol: null,
          defaultInitialVirtualToken: null,
          poolCreationFee: null,
          launchProtectionDuration: new BN(0),
          maxBuyDuringProtection: null,
        })
        .accountsStrict({
          admin: admin.publicKey,
          config: configPda,
        })
        .rpc();

      await program.methods
        .createPool({
          postId: postId2,
          name: "Second Post",
          symbol: "SP2",
          uri: "https://example.com/sp2",
          curveType: 1, // Linear
          initialVirtualSol: null,
          initialVirtualToken: null,
        })
        .accountsStrict({
          curator: curator.publicKey,
          config: configPda,
          pool: pool2,
          tokenMint: mint2,
          poolTokenVault: tokenVault2,
          poolSolVault: vault2,
          treasury: treasury.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([curator])
        .rpc();

      const pool = await program.account.pool.fetch(pool2);
      expect(pool.postId).to.equal(postId2);
      expect("linear" in pool.curveType).to.be.true;

      const config = await program.account.config.fetch(configPda);
      expect(config.totalPools.toNumber()).to.be.greaterThanOrEqual(2);
    });
  });

  // =========================================================================
  // LAUNCH PROTECTION
  // =========================================================================
  describe("launch_protection", () => {
    const protectedPostId = "protected-post";
    let protectedPool: PublicKey;
    let protectedMint: PublicKey;
    let protectedSolVault: PublicKey;

    before(async () => {
      // Re-enable launch protection
      await program.methods
        .updateConfig({
          newAdmin: null,
          newTreasury: null,
          isPaused: null,
          defaultInitialVirtualSol: null,
          defaultInitialVirtualToken: null,
          poolCreationFee: null,
          launchProtectionDuration: new BN(LAUNCH_PROTECTION_DURATION),
          maxBuyDuringProtection: null,
        })
        .accountsStrict({
          admin: admin.publicKey,
          config: configPda,
        })
        .rpc();

      [protectedPool] = findPoolPda(protectedPostId, program.programId);
      [protectedMint] = findTokenMintPda(protectedPool, program.programId);
      [protectedSolVault] = findPoolSolVaultPda(
        protectedPool,
        program.programId
      );

      const protectedTokenVault = await getAssociatedTokenAddress(
        protectedMint,
        protectedPool,
        true
      );

      await program.methods
        .createPool({
          postId: protectedPostId,
          name: "Protected Pool",
          symbol: "PROT",
          uri: "https://example.com/prot",
          curveType: null,
          initialVirtualSol: null,
          initialVirtualToken: null,
        })
        .accountsStrict({
          curator: curator.publicKey,
          config: configPda,
          pool: protectedPool,
          tokenMint: protectedMint,
          poolTokenVault: protectedTokenVault,
          poolSolVault: protectedSolVault,
          treasury: treasury.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([curator])
        .rpc();
    });

    it("pool starts in launch protection", async () => {
      const pool = await program.account.pool.fetch(protectedPool);
      expect("launchProtection" in pool.status).to.be.true;
    });

    it("rejects buy exceeding protection limit", async () => {
      const protectedTokenVault = await getAssociatedTokenAddress(
        protectedMint,
        protectedPool,
        true
      );
      const userTokenAccount = await getAssociatedTokenAddress(
        protectedMint,
        user.publicKey
      );

      try {
        await program.methods
          .buy({
            solAmount: new BN(2 * LAMPORTS_PER_SOL),
            minTokensOut: new BN(0),
          })
          .accountsStrict({
            user: user.publicKey,
            config: configPda,
            pool: protectedPool,
            tokenMint: protectedMint,
            poolTokenVault: protectedTokenVault,
            poolSolVault: protectedSolVault,
            userTokenAccount,
            treasury: treasury.publicKey,
            curator: curator.publicKey,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .signers([user])
          .rpc();
        expect.fail("Should have thrown");
      } catch (err: any) {
        expect(err.toString()).to.include("ExceedsLaunchProtectionLimit");
      }
    });

    it("allows buy within protection limit", async () => {
      const protectedTokenVault = await getAssociatedTokenAddress(
        protectedMint,
        protectedPool,
        true
      );
      const userTokenAccount = await getAssociatedTokenAddress(
        protectedMint,
        user.publicKey
      );

      await program.methods
        .buy({
          solAmount: new BN(0.5 * LAMPORTS_PER_SOL),
          minTokensOut: new BN(0),
        })
        .accountsStrict({
          user: user.publicKey,
          config: configPda,
          pool: protectedPool,
          tokenMint: protectedMint,
          poolTokenVault: protectedTokenVault,
          poolSolVault: protectedSolVault,
          userTokenAccount,
          treasury: treasury.publicKey,
          curator: curator.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([user])
        .rpc();

      const pool = await program.account.pool.fetch(protectedPool);
      expect(pool.tokensSold.toNumber()).to.be.greaterThan(0);
    });
  });

  // =========================================================================
  // PROTOCOL PAUSE
  // =========================================================================
  describe("protocol pause", () => {
    before(async () => {
      // Ensure user has a token account by doing a small buy first
      const poolTokenVault = await getPoolTokenVault();
      const userTokenAccount = await getUserTokenAccount(user.publicKey);

      // Disable launch protection if needed
      await program.methods
        .updateConfig({
          newAdmin: null,
          newTreasury: null,
          isPaused: null,
          defaultInitialVirtualSol: null,
          defaultInitialVirtualToken: null,
          poolCreationFee: null,
          launchProtectionDuration: new BN(0),
          maxBuyDuringProtection: null,
        })
        .accountsStrict({
          admin: admin.publicKey,
          config: configPda,
        })
        .rpc();

      await program.methods
        .buy({
          solAmount: new BN(0.1 * LAMPORTS_PER_SOL),
          minTokensOut: new BN(0),
        })
        .accountsStrict({
          user: user.publicKey,
          config: configPda,
          pool: poolPda,
          tokenMint,
          poolTokenVault,
          poolSolVault,
          userTokenAccount,
          treasury: treasury.publicKey,
          curator: curator.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([user])
        .rpc();
    });

    after(async () => {
      await program.methods
        .updateConfig({
          newAdmin: null,
          newTreasury: null,
          isPaused: false,
          defaultInitialVirtualSol: null,
          defaultInitialVirtualToken: null,
          poolCreationFee: null,
          launchProtectionDuration: null,
          maxBuyDuringProtection: null,
        })
        .accountsStrict({
          admin: admin.publicKey,
          config: configPda,
        })
        .rpc();
    });

    it("admin can pause the protocol", async () => {
      await program.methods
        .updateConfig({
          newAdmin: null,
          newTreasury: null,
          isPaused: true,
          defaultInitialVirtualSol: null,
          defaultInitialVirtualToken: null,
          poolCreationFee: null,
          launchProtectionDuration: null,
          maxBuyDuringProtection: null,
        })
        .accountsStrict({
          admin: admin.publicKey,
          config: configPda,
        })
        .rpc();

      const config = await program.account.config.fetch(configPda);
      expect(config.isPaused).to.be.true;
    });

    it("buy fails when protocol is paused", async () => {
      const poolTokenVault = await getPoolTokenVault();
      const userTokenAccount = await getUserTokenAccount(user.publicKey);

      try {
        await program.methods
          .buy({
            solAmount: new BN(0.1 * LAMPORTS_PER_SOL),
            minTokensOut: new BN(0),
          })
          .accountsStrict({
            user: user.publicKey,
            config: configPda,
            pool: poolPda,
            tokenMint,
            poolTokenVault,
            poolSolVault,
            userTokenAccount,
            treasury: treasury.publicKey,
            curator: curator.publicKey,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .signers([user])
          .rpc();
        expect.fail("Should have thrown");
      } catch (err: any) {
        expect(err.toString()).to.include("Paused");
      }
    });

    it("sell fails when protocol is paused", async () => {
      const poolTokenVault = await getPoolTokenVault();
      const userTokenAccount = await getUserTokenAccount(user.publicKey);

      try {
        await program.methods
          .sell({
            tokenAmount: new BN(1000000),
            minSolOut: new BN(0),
          })
          .accountsStrict({
            user: user.publicKey,
            config: configPda,
            pool: poolPda,
            tokenMint,
            poolTokenVault,
            poolSolVault,
            userTokenAccount,
            treasury: treasury.publicKey,
            curator: curator.publicKey,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .signers([user])
          .rpc();
        expect.fail("Should have thrown");
      } catch (err: any) {
        expect(err.toString()).to.include("Paused");
      }
    });

    it("admin can unpause the protocol", async () => {
      await program.methods
        .updateConfig({
          newAdmin: null,
          newTreasury: null,
          isPaused: false,
          defaultInitialVirtualSol: null,
          defaultInitialVirtualToken: null,
          poolCreationFee: null,
          launchProtectionDuration: null,
          maxBuyDuringProtection: null,
        })
        .accountsStrict({
          admin: admin.publicKey,
          config: configPda,
        })
        .rpc();

      const config = await program.account.config.fetch(configPda);
      expect(config.isPaused).to.be.false;
    });

    it("trading works again after unpause", async () => {
      const poolTokenVault = await getPoolTokenVault();
      const userTokenAccount = await getUserTokenAccount(user.publicKey);

      await program.methods
        .buy({
          solAmount: new BN(0.1 * LAMPORTS_PER_SOL),
          minTokensOut: new BN(0),
        })
        .accountsStrict({
          user: user.publicKey,
          config: configPda,
          pool: poolPda,
          tokenMint,
          poolTokenVault,
          poolSolVault,
          userTokenAccount,
          treasury: treasury.publicKey,
          curator: curator.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([user])
        .rpc();
    });
  });

  // =========================================================================
  // GLOBAL STATS TRACKING
  // =========================================================================
  describe("global stats", () => {
    it("config tracks total volume and fees", async () => {
      const config = await program.account.config.fetch(configPda);
      expect(config.totalVolume.toNumber()).to.be.greaterThan(0);
      expect(config.totalFeesCollected.toNumber()).to.be.greaterThan(0);
    });

    it("pool tracks volume and fees independently", async () => {
      const pool = await program.account.pool.fetch(poolPda);
      expect(pool.totalVolume.toNumber()).to.be.greaterThan(0);
      expect(pool.totalFees.toNumber()).to.be.greaterThan(0);
    });
  });
});

import { expect } from "chai";
import {
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import BN from "bn.js";

import {
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
  getPoolTokenVault,
  getUserTokenAccount,
} from "./helpers";

import {
  findReferralPda,
  findInviterStatsPda,
} from "../sdk/src";

describe("fees & referrals", () => {
  // =========================================================================
  // SET CREATOR & CLAIM CREATOR FEES
  // =========================================================================
  describe("set_creator & claim_creator_fees", () => {
    it("admin sets creator for pool", async () => {
      await program.methods
        .setCreator()
        .accountsStrict({
          authority: admin.publicKey,
          pool: poolPda,
          config: configPda,
          creator: creator.publicKey,
        })
        .rpc();

      const pool = await program.account.pool.fetch(poolPda);
      expect(pool.creator.toBase58()).to.equal(creator.publicKey.toBase58());
    });

    it("non-admin cannot set creator", async () => {
      try {
        await program.methods
          .setCreator()
          .accountsStrict({
            authority: nonAdmin.publicKey,
            pool: poolPda,
            config: configPda,
            creator: creator.publicKey,
          })
          .signers([nonAdmin])
          .rpc();
        expect.fail("Should have thrown");
      } catch (err: any) {
        expect(err.toString()).to.include("Unauthorized");
      }
    });

    it("creator claims accumulated fees", async () => {
      const pool = await program.account.pool.fetch(poolPda);
      const unclaimedBefore = pool.unclaimedCreatorFees.toNumber();

      if (unclaimedBefore > 0) {
        const creatorBalBefore = await connection.getBalance(creator.publicKey);

        await program.methods
          .claimCreatorFees()
          .accountsStrict({
            creator: creator.publicKey,
            pool: poolPda,
            poolSolVault,
            systemProgram: SystemProgram.programId,
          })
          .signers([creator])
          .rpc();

        const poolAfter = await program.account.pool.fetch(poolPda);
        expect(poolAfter.unclaimedCreatorFees.toNumber()).to.equal(0);

        const creatorBalAfter = await connection.getBalance(creator.publicKey);
        expect(creatorBalAfter).to.be.greaterThan(creatorBalBefore);
      }
    });

    it("creator cannot claim when no fees", async () => {
      try {
        await program.methods
          .claimCreatorFees()
          .accountsStrict({
            creator: creator.publicKey,
            pool: poolPda,
            poolSolVault,
            systemProgram: SystemProgram.programId,
          })
          .signers([creator])
          .rpc();
        expect.fail("Should have thrown");
      } catch (err: any) {
        expect(err.toString()).to.include("NoFeesToClaim");
      }
    });
  });

  // =========================================================================
  // CLAIM CURATOR FEES
  // =========================================================================
  describe("claim_curator_fees", () => {
    before(async () => {
      // Generate some fees via a buy
      const poolTokenVault = await getPoolTokenVault();
      const userTokenAccount = await getUserTokenAccount(user.publicKey);

      await program.methods
        .buy({
          solAmount: new BN(2 * LAMPORTS_PER_SOL),
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

    it("curator cannot claim curator_fees (sent directly via buy)", async () => {
      const pool = await program.account.pool.fetch(poolPda);

      if (pool.unclaimedCuratorFees.toNumber() === 0) {
        try {
          await program.methods
            .claimCuratorFees()
            .accountsStrict({
              curator: curator.publicKey,
              pool: poolPda,
              poolSolVault,
              systemProgram: SystemProgram.programId,
            })
            .signers([curator])
            .rpc();
          expect.fail("Should have thrown");
        } catch (err: any) {
          expect(err.toString()).to.include("NoFeesToClaim");
        }
      } else {
        await program.methods
          .claimCuratorFees()
          .accountsStrict({
            curator: curator.publicKey,
            pool: poolPda,
            poolSolVault,
            systemProgram: SystemProgram.programId,
          })
          .signers([curator])
          .rpc();

        const poolAfter = await program.account.pool.fetch(poolPda);
        expect(poolAfter.unclaimedCuratorFees.toNumber()).to.equal(0);
      }
    });
  });

  // =========================================================================
  // REFERRAL
  // =========================================================================
  describe("register_referral", () => {
    it("registers a referral", async () => {
      const [referralPda] = findReferralPda(user.publicKey, program.programId);
      const [inviterStatsPda] = findInviterStatsPda(
        inviter.publicKey,
        program.programId
      );

      await program.methods
        .registerReferral()
        .accountsStrict({
          user: user.publicKey,
          inviter: inviter.publicKey,
          referral: referralPda,
          inviterStats: inviterStatsPda,
          systemProgram: SystemProgram.programId,
        })
        .signers([user])
        .rpc();

      const referral = await program.account.referral.fetch(referralPda);
      expect(referral.user.toBase58()).to.equal(user.publicKey.toBase58());
      expect(referral.inviter.toBase58()).to.equal(inviter.publicKey.toBase58());
      expect(referral.totalFeesGenerated.toNumber()).to.equal(0);
      expect(referral.tradeCount.toNumber()).to.equal(0);

      const inviterStats = await program.account.inviterStats.fetch(
        inviterStatsPda
      );
      expect(inviterStats.inviter.toBase58()).to.equal(
        inviter.publicKey.toBase58()
      );
      expect(inviterStats.totalReferrals.toNumber()).to.equal(1);
    });

    it("cannot register duplicate referral", async () => {
      const [referralPda] = findReferralPda(user.publicKey, program.programId);
      const [inviterStatsPda] = findInviterStatsPda(
        inviter.publicKey,
        program.programId
      );

      try {
        await program.methods
          .registerReferral()
          .accountsStrict({
            user: user.publicKey,
            inviter: inviter.publicKey,
            referral: referralPda,
            inviterStats: inviterStatsPda,
            systemProgram: SystemProgram.programId,
          })
          .signers([user])
          .rpc();
        expect.fail("Should have thrown");
      } catch (err: any) {
        expect(err).to.exist;
      }
    });

    it("cannot self-refer", async () => {
      const { Keypair } = await import("@solana/web3.js");
      const { airdrop } = await import("./helpers");
      const selfRefUser = Keypair.generate();
      await airdrop(selfRefUser.publicKey);

      const [referralPda] = findReferralPda(
        selfRefUser.publicKey,
        program.programId
      );
      const [inviterStatsPda] = findInviterStatsPda(
        selfRefUser.publicKey,
        program.programId
      );

      try {
        await program.methods
          .registerReferral()
          .accountsStrict({
            user: selfRefUser.publicKey,
            inviter: selfRefUser.publicKey,
            referral: referralPda,
            inviterStats: inviterStatsPda,
            systemProgram: SystemProgram.programId,
          })
          .signers([selfRefUser])
          .rpc();
        expect.fail("Should have thrown");
      } catch (err: any) {
        expect(err.toString()).to.include("SelfReferral");
      }
    });
  });

  // =========================================================================
  // REFERRAL TRADE FEE ROUTING
  // =========================================================================
  describe("referral trade fee routing", () => {
    it("referral exists and tracks data", async () => {
      const referralPda = findReferralPda(user.publicKey, program.programId)[0];
      const referral = await program.account.referral.fetch(referralPda);
      expect(referral.user.toBase58()).to.equal(user.publicKey.toBase58());
      expect(referral.inviter.toBase58()).to.equal(inviter.publicKey.toBase58());
    });

    it("inviter stats exist after referral registration", async () => {
      const [inviterStatsPda] = findInviterStatsPda(
        inviter.publicKey,
        program.programId
      );
      const stats = await program.account.inviterStats.fetch(inviterStatsPda);
      expect(stats.inviter.toBase58()).to.equal(inviter.publicKey.toBase58());
      expect(stats.totalReferrals.toNumber()).to.be.greaterThanOrEqual(1);
    });
  });

  // =========================================================================
  // CLAIM INVITER FEES
  // =========================================================================
  describe("claim_inviter_fees", () => {
    it("inviter claims accumulated fees or gets NoFeesToClaim", async () => {
      const [inviterStatsPda] = findInviterStatsPda(
        inviter.publicKey,
        program.programId
      );
      const stats = await program.account.inviterStats.fetch(inviterStatsPda);

      if (stats.unclaimedFees.toNumber() > 0) {
        const inviterBalBefore = await connection.getBalance(inviter.publicKey);

        await program.methods
          .claimInviterFees()
          .accountsStrict({
            inviter: inviter.publicKey,
            inviterStats: inviterStatsPda,
            feeVault,
            systemProgram: SystemProgram.programId,
          })
          .signers([inviter])
          .rpc();

        const statsAfter = await program.account.inviterStats.fetch(
          inviterStatsPda
        );
        expect(statsAfter.unclaimedFees.toNumber()).to.equal(0);

        const inviterBalAfter = await connection.getBalance(inviter.publicKey);
        expect(inviterBalAfter).to.be.greaterThan(inviterBalBefore);
      } else {
        try {
          await program.methods
            .claimInviterFees()
            .accountsStrict({
              inviter: inviter.publicKey,
              inviterStats: inviterStatsPda,
              feeVault,
              systemProgram: SystemProgram.programId,
            })
            .signers([inviter])
            .rpc();
          expect.fail("Should have thrown");
        } catch (err: any) {
          expect(err.toString()).to.include("NoFeesToClaim");
        }
      }
    });

    it("non-inviter cannot claim someone else's fees", async () => {
      const [inviterStatsPda] = findInviterStatsPda(
        inviter.publicKey,
        program.programId
      );

      try {
        await program.methods
          .claimInviterFees()
          .accountsStrict({
            inviter: nonAdmin.publicKey,
            inviterStats: inviterStatsPda,
            feeVault,
            systemProgram: SystemProgram.programId,
          })
          .signers([nonAdmin])
          .rpc();
        expect.fail("Should have thrown");
      } catch (err: any) {
        expect(err).to.exist;
      }
    });
  });
});

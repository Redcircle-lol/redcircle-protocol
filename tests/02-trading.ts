import { expect } from "chai";
import {
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAccount,
} from "@solana/spl-token";
import BN from "bn.js";

import {
  program,
  connection,
  admin,
  treasury,
  curator,
  user,
  configPda,
  postId,
  poolPda,
  tokenMint,
  poolSolVault,
  getPoolTokenVault,
  getUserTokenAccount,
} from "./helpers";

import {
  estimateBuyTokensOut,
  estimateSellSolOut,
  CurveType,
} from "../sdk/src";
import { SystemProgram } from "@solana/web3.js";

describe("trading", () => {
  // =========================================================================
  // BUY
  // =========================================================================
  describe("buy", () => {
    it("buys tokens with SOL", async () => {
      const poolTokenVault = await getPoolTokenVault();
      const userTokenAccount = await getUserTokenAccount(user.publicKey);

      const poolBefore = await program.account.pool.fetch(poolPda);
      const buyAmount = new BN(LAMPORTS_PER_SOL);

      const expectedTokens = estimateBuyTokensOut(
        poolBefore.virtualSolReserve,
        poolBefore.virtualTokenReserve,
        buyAmount
      );

      await program.methods
        .buy({
          solAmount: buyAmount,
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

      const poolAfter = await program.account.pool.fetch(poolPda);
      expect(poolAfter.virtualSolReserve.gt(poolBefore.virtualSolReserve)).to.be
        .true;
      expect(poolAfter.virtualTokenReserve.lt(poolBefore.virtualTokenReserve))
        .to.be.true;
      expect(poolAfter.tokensSold.gt(poolBefore.tokensSold)).to.be.true;

      const userAta = await getAccount(connection, userTokenAccount);
      expect(Number(userAta.amount)).to.be.greaterThan(0);
    });

    it("fails with zero amount", async () => {
      const poolTokenVault = await getPoolTokenVault();
      const userTokenAccount = await getUserTokenAccount(user.publicKey);

      try {
        await program.methods
          .buy({
            solAmount: new BN(0),
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
        expect(err.toString()).to.include("ZeroAmount");
      }
    });

    it("fails with unreachable slippage", async () => {
      const poolTokenVault = await getPoolTokenVault();
      const userTokenAccount = await getUserTokenAccount(user.publicKey);

      try {
        await program.methods
          .buy({
            solAmount: new BN(LAMPORTS_PER_SOL),
            minTokensOut: new BN("999999999999999999"),
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
        expect(err.toString()).to.include("SlippageExceeded");
      }
    });
  });

  // =========================================================================
  // SELL
  // =========================================================================
  describe("sell", () => {
    it("sells tokens for SOL", async () => {
      const poolTokenVault = await getPoolTokenVault();
      const userTokenAccount = await getUserTokenAccount(user.publicKey);

      const poolBefore = await program.account.pool.fetch(poolPda);
      const userAtaBefore = await getAccount(connection, userTokenAccount);
      const sellAmount = new BN(Number(userAtaBefore.amount) / 2);

      const expectedSol = estimateSellSolOut(
        poolBefore.virtualSolReserve,
        poolBefore.virtualTokenReserve,
        sellAmount
      );

      const userBalBefore = await connection.getBalance(user.publicKey);

      await program.methods
        .sell({
          tokenAmount: sellAmount,
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

      const poolAfter = await program.account.pool.fetch(poolPda);
      const userBalAfter = await connection.getBalance(user.publicKey);

      expect(poolAfter.virtualSolReserve.lt(poolBefore.virtualSolReserve)).to.be
        .true;
      expect(
        poolAfter.virtualTokenReserve.gt(poolBefore.virtualTokenReserve)
      ).to.be.true;

      expect(userBalAfter).to.be.greaterThan(userBalBefore - LAMPORTS_PER_SOL);

      const userAtaAfter = await getAccount(connection, userTokenAccount);
      expect(Number(userAtaAfter.amount)).to.be.lessThan(
        Number(userAtaBefore.amount)
      );
    });

    it("fails with zero token amount", async () => {
      const poolTokenVault = await getPoolTokenVault();
      const userTokenAccount = await getUserTokenAccount(user.publicKey);

      try {
        await program.methods
          .sell({
            tokenAmount: new BN(0),
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
        expect(err.toString()).to.include("ZeroAmount");
      }
    });
  });

  // =========================================================================
  // SWAP
  // =========================================================================
  describe("swap", () => {
    it("swaps SOL for tokens (buy via swap)", async () => {
      const poolTokenVault = await getPoolTokenVault();
      const userTokenAccount = await getUserTokenAccount(user.publicKey);

      const poolBefore = await program.account.pool.fetch(poolPda);

      await program.methods
        .swap({
          amountIn: new BN(0.5 * LAMPORTS_PER_SOL),
          minimumAmountOut: new BN(0),
          isBuy: true,
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

      const poolAfter = await program.account.pool.fetch(poolPda);
      expect(poolAfter.virtualSolReserve.gt(poolBefore.virtualSolReserve)).to.be
        .true;
    });

    it("swaps tokens for SOL (sell via swap)", async () => {
      const poolTokenVault = await getPoolTokenVault();
      const userTokenAccount = await getUserTokenAccount(user.publicKey);

      const userAta = await getAccount(connection, userTokenAccount);
      const sellAmount = new BN(Number(userAta.amount) / 4);

      const poolBefore = await program.account.pool.fetch(poolPda);

      await program.methods
        .swap({
          amountIn: sellAmount,
          minimumAmountOut: new BN(0),
          isBuy: false,
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

      const poolAfter = await program.account.pool.fetch(poolPda);
      expect(poolAfter.virtualSolReserve.lt(poolBefore.virtualSolReserve)).to.be
        .true;
    });
  });
});

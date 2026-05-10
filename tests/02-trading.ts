import { expect } from "chai";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { getAccount } from "@solana/spl-token";
import BN from "bn.js";

import {
  client,
  connection,
  curator,
  getUserTokenAccount,
  poolPda,
  postId,
  sendIx,
  treasury,
  user,
} from "./helpers";

import {
  calculateFee,
  estimateSigmoidBuyTokensOut,
  estimateSigmoidSellSolOut,
} from "../sdk/src";

describe("trading", () => {
  describe("sigmoid bootstrap swap", () => {
    it("buys tokens with SOL through the SDK swap wrapper", async () => {
      const poolBefore = await client.fetchPool(postId);
      const marketBefore = await client.fetchMarketState(postId);
      const buyAmount = new BN(LAMPORTS_PER_SOL);
      const expectedTokens = estimateSigmoidBuyTokensOut(
        marketBefore.sigmoid,
        poolBefore.tokensSold,
        buyAmount
      );

      await sendIx(
        await client.buy(
          {
            user: user.publicKey,
            postId,
            treasury: treasury.publicKey,
            curator: curator.publicKey,
          },
          {
            solAmount: buyAmount,
            minTokensOut: expectedTokens.subn(1),
          }
        ),
        [user]
      );

      const poolAfter = await client.fetchPool(postId);
      const marketAfter = await client.fetchMarketState(postId);
      const userTokenAccount = await getUserTokenAccount(user.publicKey);
      const userAta = await getAccount(connection, userTokenAccount);

      expect(poolAfter.liquiditySolReserve.gt(poolBefore.liquiditySolReserve))
        .to.be.true;
      expect(
        poolAfter.liquidityTokenReserve.lt(poolBefore.liquidityTokenReserve)
      ).to.be.true;
      expect(poolAfter.tokensSold.gt(poolBefore.tokensSold)).to.be.true;
      expect(Number(userAta.amount)).to.be.greaterThan(0);
      expect(marketAfter.totalTrades.toNumber()).to.equal(
        marketBefore.totalTrades.toNumber() + 1
      );
      expect(marketAfter.buyTrades.toNumber()).to.equal(
        marketBefore.buyTrades.toNumber() + 1
      );
      expect(marketAfter.totalFeesEarned.toString()).to.equal(
        marketBefore.totalFeesEarned.add(calculateFee(buyAmount)).toString()
      );
    });

    it("fails with zero amount", async () => {
      try {
        await sendIx(
          await client.buy(
            {
              user: user.publicKey,
              postId,
              treasury: treasury.publicKey,
              curator: curator.publicKey,
            },
            { solAmount: new BN(0), minTokensOut: new BN(0) }
          ),
          [user]
        );
        expect.fail("zero buy should have failed");
      } catch (err: any) {
        expect(err.toString()).to.include("ZeroAmount");
      }
    });

    it("fails with unreachable slippage", async () => {
      try {
        await sendIx(
          await client.buy(
            {
              user: user.publicKey,
              postId,
              treasury: treasury.publicKey,
              curator: curator.publicKey,
            },
            {
              solAmount: new BN(LAMPORTS_PER_SOL),
              minTokensOut: new BN("999999999999999999"),
            }
          ),
          [user]
        );
        expect.fail("slippage buy should have failed");
      } catch (err: any) {
        expect(err.toString()).to.include("SlippageExceeded");
      }
    });

    it("sells tokens for SOL through the SDK swap wrapper", async () => {
      const userTokenAccount = await getUserTokenAccount(user.publicKey);
      const userAtaBefore = await getAccount(connection, userTokenAccount);
      const sellAmount = new BN(userAtaBefore.amount.toString()).divn(2);
      const poolBefore = await client.fetchPool(postId);
      const marketBefore = await client.fetchMarketState(postId);
      const expectedSol = estimateSigmoidSellSolOut(
        marketBefore.sigmoid,
        poolBefore.tokensSold,
        sellAmount
      );

      await sendIx(
        await client.sell(
          {
            user: user.publicKey,
            postId,
            treasury: treasury.publicKey,
            curator: curator.publicKey,
          },
          {
            tokenAmount: sellAmount,
            minSolOut: expectedSol.subn(1),
          }
        ),
        [user]
      );

      const poolAfter = await client.fetchPool(postId);
      const marketAfter = await client.fetchMarketState(postId);
      const userAtaAfter = await getAccount(connection, userTokenAccount);

      expect(poolAfter.liquiditySolReserve.lt(poolBefore.liquiditySolReserve))
        .to.be.true;
      expect(
        poolAfter.liquidityTokenReserve.gt(poolBefore.liquidityTokenReserve)
      ).to.be.true;
      expect(poolAfter.tokensSold.lt(poolBefore.tokensSold)).to.be.true;
      expect(userAtaAfter.amount < userAtaBefore.amount).to.equal(true);
      expect(marketAfter.sellTrades.toNumber()).to.equal(
        marketBefore.sellTrades.toNumber() + 1
      );
    });

    it("derives the same pool PDA as the test fixture", () => {
      expect(client.getPoolPda(postId).toBase58()).to.equal(poolPda.toBase58());
    });
  });
});

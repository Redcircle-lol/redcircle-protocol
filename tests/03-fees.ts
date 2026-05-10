import { expect } from "chai";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import BN from "bn.js";

import {
  admin,
  client,
  connection,
  creator,
  curator,
  growthRecipient,
  nonAdmin,
  postId,
  sendIx,
  treasury,
  user,
} from "./helpers";

import { calculateFeeBreakdown } from "../sdk/src";

describe("fees", () => {
  it("admin sets creator for pool", async () => {
    await sendIx(
      await client.setCreator(admin.publicKey, postId, creator.publicKey)
    );

    const pool = await client.fetchPool(postId);
    expect(pool.creator.toBase58()).to.equal(creator.publicKey.toBase58());
  });

  it("non-admin cannot set creator", async () => {
    try {
      await sendIx(
        await client.setCreator(nonAdmin.publicKey, postId, creator.publicKey),
        [nonAdmin]
      );
      expect.fail("setCreator should have failed");
    } catch (err: any) {
      expect(err.toString()).to.include("Unauthorized");
    }
  });

  it("records creator, curator, growth, and platform fee metrics", async () => {
    const marketBefore = await client.fetchMarketState(postId);
    const poolBefore = await client.fetchPool(postId);
    const amount = new BN(2 * LAMPORTS_PER_SOL);
    const fees = calculateFeeBreakdown(amount);

    await sendIx(
      await client.buy(
        {
          user: user.publicKey,
          postId,
          treasury: treasury.publicKey,
          curator: curator.publicKey,
        },
        { solAmount: amount, minTokensOut: new BN(0) }
      ),
      [user]
    );

    const poolAfter = await client.fetchPool(postId);
    const marketAfter = await client.fetchMarketState(postId);

    expect(poolAfter.unclaimedCreatorFees.toString()).to.equal(
      poolBefore.unclaimedCreatorFees.add(fees.creator).toString()
    );
    expect(poolAfter.unclaimedCuratorFees.toString()).to.equal(
      poolBefore.unclaimedCuratorFees.add(fees.curator).toString()
    );
    expect(poolAfter.unclaimedGrowthFees.toString()).to.equal(
      poolBefore.unclaimedGrowthFees.add(fees.growth).toString()
    );
    expect(marketAfter.platformFeesEarned.toString()).to.equal(
      marketBefore.platformFeesEarned.add(fees.platform).toString()
    );
    expect(marketAfter.creatorFeesEarned.toString()).to.equal(
      marketBefore.creatorFeesEarned.add(fees.creator).toString()
    );
    expect(marketAfter.curatorFeesEarned.toString()).to.equal(
      marketBefore.curatorFeesEarned.add(fees.curator).toString()
    );
    expect(marketAfter.growthFeesEarned.toString()).to.equal(
      marketBefore.growthFeesEarned.add(fees.growth).toString()
    );
  });

  it("creator claims accumulated fees", async () => {
    const poolBefore = await client.fetchPool(postId);
    expect(poolBefore.unclaimedCreatorFees.gt(new BN(0))).to.equal(true);
    const balanceBefore = await connection.getBalance(creator.publicKey);

    await sendIx(await client.claimCreatorFees(creator.publicKey, postId), [
      creator,
    ]);

    const poolAfter = await client.fetchPool(postId);
    const balanceAfter = await connection.getBalance(creator.publicKey);
    expect(poolAfter.unclaimedCreatorFees.toNumber()).to.equal(0);
    expect(balanceAfter).to.be.greaterThan(balanceBefore);
  });

  it("curator claims accumulated fees", async () => {
    const poolBefore = await client.fetchPool(postId);
    expect(poolBefore.unclaimedCuratorFees.gt(new BN(0))).to.equal(true);
    const balanceBefore = await connection.getBalance(curator.publicKey);

    await sendIx(await client.claimCuratorFees(curator.publicKey, postId), [
      curator,
    ]);

    const poolAfter = await client.fetchPool(postId);
    const balanceAfter = await connection.getBalance(curator.publicKey);
    expect(poolAfter.unclaimedCuratorFees.toNumber()).to.equal(0);
    expect(balanceAfter).to.be.greaterThan(balanceBefore);
  });

  it("admin claims growth fees to a selected recipient", async () => {
    const poolBefore = await client.fetchPool(postId);
    expect(poolBefore.unclaimedGrowthFees.gt(new BN(0))).to.equal(true);
    const balanceBefore = await connection.getBalance(
      growthRecipient.publicKey
    );

    await sendIx(
      await client.claimGrowthFees(
        admin.publicKey,
        postId,
        growthRecipient.publicKey
      )
    );

    const poolAfter = await client.fetchPool(postId);
    const balanceAfter = await connection.getBalance(growthRecipient.publicKey);
    expect(poolAfter.unclaimedGrowthFees.toNumber()).to.equal(0);
    expect(balanceAfter).to.be.greaterThan(balanceBefore);
  });

  it("creator cannot claim twice without new fees", async () => {
    try {
      await sendIx(await client.claimCreatorFees(creator.publicKey, postId), [
        creator,
      ]);
      expect.fail("claimCreatorFees should have failed");
    } catch (err: any) {
      expect(err.toString()).to.include("NoFeesToClaim");
    }
  });
});

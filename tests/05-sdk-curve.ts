import { expect } from "chai";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import BN from "bn.js";

import {
  BPS_DENOMINATOR,
  calculateFee,
  calculateFeeBreakdown,
  DEFAULT_SIGMOID_CAP_PRICE,
  DEFAULT_SIGMOID_FLOOR_PRICE,
  DEFAULT_SIGMOID_STEEPNESS_BPS,
  DEFAULT_TOKEN_SUPPLY,
  estimateDlmmBuyTokensOut,
  estimateDlmmSellSolOut,
  estimateSigmoidBuyTokensOut,
  estimateSigmoidSellSolOut,
  GROWTH_FEE_BPS,
  priceAtSupply,
  quoteDlmmBuy,
  quoteDlmmSell,
  quoteSigmoidBuy,
  quoteSigmoidSell,
  SigmoidConfig,
  SIGMOID_BAND_BPS,
  TOKEN_UNIT,
  TOTAL_FEE_BPS,
} from "../sdk/src";

describe("SDK: sigmoid and DLMM math", () => {
  const sigmoid: SigmoidConfig = {
    tokenSupply: DEFAULT_TOKEN_SUPPLY,
    floorPriceLamports: DEFAULT_SIGMOID_FLOOR_PRICE,
    capPriceLamports: DEFAULT_SIGMOID_CAP_PRICE,
    midpointSupply: DEFAULT_TOKEN_SUPPLY.divn(2),
    steepnessBps: DEFAULT_SIGMOID_STEEPNESS_BPS,
    bandBps: new BN(SIGMOID_BAND_BPS),
  };

  it("sigmoid price is monotonic across supply", () => {
    const p0 = priceAtSupply(sigmoid, new BN(0));
    const p25 = priceAtSupply(sigmoid, DEFAULT_TOKEN_SUPPLY.divn(4));
    const p50 = priceAtSupply(sigmoid, DEFAULT_TOKEN_SUPPLY.divn(2));
    const p75 = priceAtSupply(sigmoid, DEFAULT_TOKEN_SUPPLY.muln(3).divn(4));
    expect(p0.lte(p25)).to.equal(true);
    expect(p25.lte(p50)).to.equal(true);
    expect(p50.lte(p75)).to.equal(true);
  });

  it("quotes sigmoid buys and sells", () => {
    const buy = quoteSigmoidBuy(sigmoid, new BN(0), new BN(LAMPORTS_PER_SOL));
    expect(buy.amountOut.gt(new BN(0))).to.equal(true);
    expect(buy.grossSol.gt(new BN(0))).to.equal(true);

    const sell = quoteSigmoidSell(
      sigmoid,
      buy.amountOut,
      buy.amountOut.divn(2)
    );
    expect(sell.grossSol.gt(new BN(0))).to.equal(true);
    expect(sell.grossSol.lte(buy.grossSol)).to.equal(true);
  });

  it("keeps full sigmoid round-trip quotes reserve-backed", () => {
    const buy = quoteSigmoidBuy(sigmoid, new BN(0), new BN(970_000_000));
    const sell = quoteSigmoidSell(sigmoid, buy.amountOut, buy.amountOut);
    expect(sell.grossSol.lte(buy.grossSol)).to.equal(true);
  });

  it("fee-aware sigmoid estimates reduce output", () => {
    const solAmount = new BN(LAMPORTS_PER_SOL);
    const gross = quoteSigmoidBuy(sigmoid, new BN(0), solAmount).amountOut;
    const net = estimateSigmoidBuyTokensOut(sigmoid, new BN(0), solAmount);
    expect(net.lt(gross)).to.equal(true);

    const sellGross = quoteSigmoidSell(sigmoid, net, net.divn(2)).grossSol;
    const sellNet = estimateSigmoidSellSolOut(sigmoid, net, net.divn(2));
    expect(sellNet.lt(sellGross)).to.equal(true);
  });

  it("quotes DLMM buys and sells at fixed bin price", () => {
    const price = new BN(1_000);
    const solIn = new BN(1_000_000);
    const tokensOut = quoteDlmmBuy(solIn, price);
    expect(tokensOut.toString()).to.equal("1000000000");
    expect(quoteDlmmSell(tokensOut, price).toString()).to.equal(
      solIn.toString()
    );
  });

  it("fee-aware DLMM estimates reduce output", () => {
    const price = new BN(1_000);
    const solIn = new BN(LAMPORTS_PER_SOL);
    const gross = quoteDlmmBuy(solIn, price);
    const net = estimateDlmmBuyTokensOut(solIn, price);
    expect(net.lt(gross)).to.equal(true);

    const sellGross = quoteDlmmSell(TOKEN_UNIT.muln(10), price);
    const sellNet = estimateDlmmSellSolOut(TOKEN_UNIT.muln(10), price);
    expect(sellNet.lt(sellGross)).to.equal(true);
  });

  it("calculates total and category fees", () => {
    const amount = new BN(10_000);
    const fee = calculateFee(amount);
    const split = calculateFeeBreakdown(amount);

    expect(fee.toNumber()).to.equal((10_000 * TOTAL_FEE_BPS) / BPS_DENOMINATOR);
    expect(split.total.toNumber()).to.equal(300);
    expect(split.growth.toNumber()).to.equal(
      (300 * GROWTH_FEE_BPS) / TOTAL_FEE_BPS
    );
    expect(
      split.platform
        .add(split.creator)
        .add(split.curator)
        .add(split.growth)
        .toString()
    ).to.equal(split.total.toString());
  });
});

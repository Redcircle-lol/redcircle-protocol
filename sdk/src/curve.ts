import BN from "bn.js";
import {
  BPS_DENOMINATOR,
  CREATOR_FEE_BPS,
  CURATOR_FEE_BPS,
  GROWTH_FEE_BPS,
  MAX_SIGMOID_STEPS,
  PLATFORM_FEE_BPS,
  TOKEN_UNIT,
  TOTAL_FEE_BPS,
} from "./constants";
import { SigmoidConfig } from "./types";

export interface SigmoidQuote {
  amountOut: BN;
  grossSol: BN;
}

export interface FeeBreakdown {
  total: BN;
  platform: BN;
  creator: BN;
  curator: BN;
  growth: BN;
}

const ZERO = new BN(0);
const BPS = new BN(BPS_DENOMINATOR);

function assertPositive(value: BN, name: string): void {
  if (value.lte(ZERO)) {
    throw new Error(`${name} must be greater than zero`);
  }
}

export function calculateFee(amount: BN): BN {
  return amount.muln(TOTAL_FEE_BPS).divn(BPS_DENOMINATOR);
}

function splitFee(totalFee: BN, shareBps: number): BN {
  return totalFee.muln(shareBps).divn(TOTAL_FEE_BPS);
}

export function calculateFeeBreakdown(amount: BN): FeeBreakdown {
  const total = calculateFee(amount);
  const creator = splitFee(total, CREATOR_FEE_BPS);
  const curator = splitFee(total, CURATOR_FEE_BPS);
  const growth = splitFee(total, GROWTH_FEE_BPS);
  const platform = total.sub(creator).sub(curator).sub(growth);
  return { total, platform, creator, curator, growth };
}

export function priceAtSupply(config: SigmoidConfig, soldSupply: BN): BN {
  assertPositive(config.tokenSupply, "tokenSupply");
  assertPositive(config.floorPriceLamports, "floorPriceLamports");
  assertPositive(config.capPriceLamports, "capPriceLamports");
  assertPositive(config.midpointSupply, "midpointSupply");
  assertPositive(config.steepnessBps, "steepnessBps");
  assertPositive(config.bandBps, "bandBps");

  if (config.capPriceLamports.lte(config.floorPriceLamports)) {
    throw new Error("capPriceLamports must be greater than floorPriceLamports");
  }
  if (
    config.midpointSupply.gte(config.tokenSupply) ||
    config.midpointSupply.lte(ZERO)
  ) {
    throw new Error("midpointSupply must be inside tokenSupply");
  }

  const clampedSupply = BN.min(soldSupply, config.tokenSupply);
  const belowMidpoint = clampedSupply.lt(config.midpointSupply);
  const distance = belowMidpoint
    ? config.midpointSupply.sub(clampedSupply)
    : clampedSupply.sub(config.midpointSupply);
  const sideRange = belowMidpoint
    ? config.midpointSupply
    : config.tokenSupply.sub(config.midpointSupply);

  const distanceBps = distance.mul(BPS).div(sideRange);
  const adjustedDistanceBps = BN.min(
    distanceBps.mul(config.steepnessBps).div(BPS),
    BPS
  );
  const easedDistanceBps = smoothstepBps(adjustedDistanceBps);
  const halfEased = easedDistanceBps.muln(5_000).div(BPS);
  const sigmoidBps = belowMidpoint
    ? new BN(5_000).sub(halfEased)
    : new BN(5_000).add(halfEased);

  return config.capPriceLamports
    .sub(config.floorPriceLamports)
    .mul(sigmoidBps)
    .div(BPS)
    .add(config.floorPriceLamports);
}

export function quoteSigmoidBuy(
  config: SigmoidConfig,
  soldSupply: BN,
  solIn: BN
): SigmoidQuote {
  assertPositive(solIn, "solIn");

  let remainingSol = solIn;
  let supplyCursor = soldSupply;
  let tokensOut = ZERO;
  let solSpent = ZERO;
  const band = bandSize(config);

  for (let i = 0; i < MAX_SIGMOID_STEPS; i += 1) {
    if (remainingSol.isZero() || supplyCursor.gte(config.tokenSupply)) break;

    const price = priceAtSupply(config, supplyCursor);
    const nextBand = nextBandEnd(supplyCursor, band, config.tokenSupply);
    const bandRemaining = nextBand.sub(supplyCursor);
    const affordableTokens = BN.min(
      remainingSol.mul(TOKEN_UNIT).div(price),
      bandRemaining
    );

    if (affordableTokens.isZero()) break;

    const bandCost = ceilDiv(affordableTokens.mul(price), TOKEN_UNIT);
    tokensOut = tokensOut.add(affordableTokens);
    solSpent = solSpent.add(bandCost);
    remainingSol = remainingSol.sub(bandCost);
    supplyCursor = supplyCursor.add(affordableTokens);
  }

  if (tokensOut.isZero()) throw new Error("invalid sigmoid buy quote");
  return { amountOut: tokensOut, grossSol: solSpent };
}

export function quoteSigmoidSell(
  config: SigmoidConfig,
  soldSupply: BN,
  tokensIn: BN
): SigmoidQuote {
  assertPositive(tokensIn, "tokensIn");
  if (tokensIn.gt(soldSupply)) throw new Error("tokensIn exceeds sold supply");

  let remainingTokens = tokensIn;
  let supplyCursor = soldSupply;
  let solOut = ZERO;
  const band = bandSize(config);

  for (let i = 0; i < MAX_SIGMOID_STEPS; i += 1) {
    if (remainingTokens.isZero() || supplyCursor.isZero()) break;

    const currentBandStart = previousBandStart(supplyCursor, band);
    const price = priceAtSupply(config, currentBandStart);
    const bandAvailable = supplyCursor.sub(currentBandStart);
    const bandTokens = BN.min(remainingTokens, bandAvailable);
    const bandSol = bandTokens.mul(price).div(TOKEN_UNIT);

    solOut = solOut.add(bandSol);
    remainingTokens = remainingTokens.sub(bandTokens);
    supplyCursor = supplyCursor.sub(bandTokens);
  }

  if (!remainingTokens.isZero() || solOut.isZero()) {
    throw new Error("invalid sigmoid sell quote");
  }
  return { amountOut: solOut, grossSol: solOut };
}

export function quoteDlmmBuy(solIn: BN, priceLamportsPerToken: BN): BN {
  assertPositive(solIn, "solIn");
  assertPositive(priceLamportsPerToken, "priceLamportsPerToken");
  const tokensOut = solIn.mul(TOKEN_UNIT).div(priceLamportsPerToken);
  if (tokensOut.isZero()) throw new Error("invalid DLMM buy quote");
  return tokensOut;
}

export function quoteDlmmSell(tokensIn: BN, priceLamportsPerToken: BN): BN {
  assertPositive(tokensIn, "tokensIn");
  assertPositive(priceLamportsPerToken, "priceLamportsPerToken");
  const solOut = tokensIn.mul(priceLamportsPerToken).div(TOKEN_UNIT);
  if (solOut.isZero()) throw new Error("invalid DLMM sell quote");
  return solOut;
}

export function binIdForPrice(
  priceLamportsPerToken: BN,
  binStepBps: number
): number {
  assertPositive(priceLamportsPerToken, "priceLamportsPerToken");
  if (binStepBps <= 0) throw new Error("binStepBps must be positive");
  return priceLamportsPerToken.divn(binStepBps).toNumber();
}

export function estimateSigmoidBuyTokensOut(
  config: SigmoidConfig,
  soldSupply: BN,
  solAmount: BN
): BN {
  const fees = calculateFeeBreakdown(solAmount);
  return quoteSigmoidBuy(config, soldSupply, solAmount.sub(fees.total))
    .amountOut;
}

export function estimateSigmoidSellSolOut(
  config: SigmoidConfig,
  soldSupply: BN,
  tokenAmount: BN
): BN {
  const grossSol = quoteSigmoidSell(config, soldSupply, tokenAmount).grossSol;
  return grossSol.sub(calculateFee(grossSol));
}

export function estimateDlmmBuyTokensOut(
  solAmount: BN,
  priceLamportsPerToken: BN
): BN {
  const fees = calculateFeeBreakdown(solAmount);
  return quoteDlmmBuy(solAmount.sub(fees.total), priceLamportsPerToken);
}

export function estimateDlmmSellSolOut(
  tokenAmount: BN,
  priceLamportsPerToken: BN
): BN {
  const grossSol = quoteDlmmSell(tokenAmount, priceLamportsPerToken);
  return grossSol.sub(calculateFee(grossSol));
}

export function calculateSigmoidMarketCap(
  config: SigmoidConfig,
  soldSupply: BN
): BN {
  return priceAtSupply(config, soldSupply)
    .mul(config.tokenSupply)
    .div(TOKEN_UNIT);
}

function smoothstepBps(tBps: BN): BN {
  const t = BN.min(tBps, BPS);
  const t2 = t.mul(t);
  const t3 = t2.mul(t);
  const first = new BN(3).mul(t2).div(BPS);
  const second = new BN(2).mul(t3).div(BPS.mul(BPS));
  return first.sub(second);
}

function ceilDiv(numerator: BN, denominator: BN): BN {
  if (denominator.isZero()) throw new Error("division by zero");
  return numerator.add(denominator.subn(1)).div(denominator);
}

function bandSize(config: SigmoidConfig): BN {
  const size = config.tokenSupply.mul(config.bandBps).div(BPS);
  if (size.isZero()) throw new Error("invalid sigmoid band size");
  return size;
}

function nextBandEnd(currentSupply: BN, band: BN, tokenSupply: BN): BN {
  const next = currentSupply.div(band).addn(1).mul(band);
  return BN.min(next, tokenSupply);
}

function previousBandStart(currentSupply: BN, band: BN): BN {
  return currentSupply.subn(1).div(band).mul(band);
}

// Backwards-compatible names for callers that only need fee-aware estimates.
export const estimateBuyTokensOut = estimateSigmoidBuyTokensOut;
export const estimateSellSolOut = estimateSigmoidSellSolOut;
export const calculateCurrentPrice = priceAtSupply;
export const calculateMarketCap = calculateSigmoidMarketCap;

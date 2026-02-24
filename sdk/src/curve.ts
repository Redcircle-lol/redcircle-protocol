import BN from "bn.js";
import { CurveType } from "./types";
import { BPS_DENOMINATOR, TOTAL_FEE_BPS } from "./constants";

const PRECISION = new BN("1000000000000"); // 10^12
const PRICE_PRECISION = new BN("1000000000"); // 10^9

// --- Constant Product (x * y = k) ---

function constantProductBuy(
  virtualSolReserve: BN,
  virtualTokenReserve: BN,
  solIn: BN
): BN {
  const k = virtualSolReserve.mul(virtualTokenReserve);
  const newSolReserve = virtualSolReserve.add(solIn);
  const newTokenReserve = k.div(newSolReserve);
  return virtualTokenReserve.sub(newTokenReserve);
}

function constantProductSell(
  virtualSolReserve: BN,
  virtualTokenReserve: BN,
  tokensIn: BN
): BN {
  const k = virtualSolReserve.mul(virtualTokenReserve);
  const newTokenReserve = virtualTokenReserve.add(tokensIn);
  const newSolReserve = k.div(newTokenReserve);
  return virtualSolReserve.sub(newSolReserve);
}

// --- Linear ---

function linearBuy(
  virtualSolReserve: BN,
  virtualTokenReserve: BN,
  solIn: BN
): BN {
  const currentPrice = virtualSolReserve.mul(PRECISION).div(virtualTokenReserve);
  const baseTokens = solIn.mul(PRECISION).div(currentPrice);
  const cpTokens = constantProductBuy(virtualSolReserve, virtualTokenReserve, solIn);
  return baseTokens.add(cpTokens).div(new BN(2));
}

function linearSell(
  virtualSolReserve: BN,
  virtualTokenReserve: BN,
  tokensIn: BN
): BN {
  const currentPrice = virtualSolReserve.mul(PRECISION).div(virtualTokenReserve);
  const baseSol = tokensIn.mul(currentPrice).div(PRECISION);
  const cpSol = constantProductSell(virtualSolReserve, virtualTokenReserve, tokensIn);
  return baseSol.add(cpSol).div(new BN(2));
}

// --- Exponential ---

function exponentialBuy(
  virtualSolReserve: BN,
  virtualTokenReserve: BN,
  solIn: BN
): BN {
  const cpTokens = constantProductBuy(virtualSolReserve, virtualTokenReserve, solIn);
  const sizeFactor = solIn.muln(100).div(virtualSolReserve);
  const reductionBps = BN.min(sizeFactor, new BN(50));
  return cpTokens
    .mul(new BN(10000).sub(reductionBps))
    .div(new BN(10000));
}

function exponentialSell(
  virtualSolReserve: BN,
  virtualTokenReserve: BN,
  tokensIn: BN
): BN {
  const cpSol = constantProductSell(virtualSolReserve, virtualTokenReserve, tokensIn);
  const sizeFactor = tokensIn.muln(100).div(virtualTokenReserve);
  const reductionBps = BN.min(sizeFactor, new BN(50));
  return cpSol
    .mul(new BN(10000).sub(reductionBps))
    .div(new BN(10000));
}

// --- Public API ---

/** Calculate tokens received for a given SOL input (before fees). */
export function calculateTokensOut(
  virtualSolReserve: BN,
  virtualTokenReserve: BN,
  solIn: BN,
  curveType: CurveType = CurveType.ConstantProduct
): BN {
  switch (curveType) {
    case CurveType.ConstantProduct:
      return constantProductBuy(virtualSolReserve, virtualTokenReserve, solIn);
    case CurveType.Linear:
      return linearBuy(virtualSolReserve, virtualTokenReserve, solIn);
    case CurveType.Exponential:
      return exponentialBuy(virtualSolReserve, virtualTokenReserve, solIn);
  }
}

/** Calculate SOL received for a given token input (before fees). */
export function calculateSolOut(
  virtualSolReserve: BN,
  virtualTokenReserve: BN,
  tokensIn: BN,
  curveType: CurveType = CurveType.ConstantProduct
): BN {
  switch (curveType) {
    case CurveType.ConstantProduct:
      return constantProductSell(virtualSolReserve, virtualTokenReserve, tokensIn);
    case CurveType.Linear:
      return linearSell(virtualSolReserve, virtualTokenReserve, tokensIn);
    case CurveType.Exponential:
      return exponentialSell(virtualSolReserve, virtualTokenReserve, tokensIn);
  }
}

/** Calculate current token price in SOL (with 9 decimal precision). */
export function calculateCurrentPrice(
  virtualSolReserve: BN,
  virtualTokenReserve: BN
): BN {
  return virtualSolReserve.mul(PRICE_PRECISION).div(virtualTokenReserve);
}

/** Calculate market cap in lamports. */
export function calculateMarketCap(
  virtualSolReserve: BN,
  virtualTokenReserve: BN,
  totalSupply: BN
): BN {
  const price = calculateCurrentPrice(virtualSolReserve, virtualTokenReserve);
  return price.mul(totalSupply).div(PRICE_PRECISION);
}

/** Calculate the fee amount for a given trade. */
export function calculateFee(amount: BN): BN {
  return amount.muln(TOTAL_FEE_BPS).divn(BPS_DENOMINATOR);
}

/**
 * Estimate tokens received from a buy, accounting for the 3% fee.
 * The fee is deducted from the SOL input before the curve calculation.
 */
export function estimateBuyTokensOut(
  virtualSolReserve: BN,
  virtualTokenReserve: BN,
  solAmount: BN,
  curveType: CurveType = CurveType.ConstantProduct
): BN {
  const fee = calculateFee(solAmount);
  const solAfterFee = solAmount.sub(fee);
  return calculateTokensOut(virtualSolReserve, virtualTokenReserve, solAfterFee, curveType);
}

/**
 * Estimate SOL received from a sell, accounting for the 3% fee.
 * The fee is deducted from the SOL output after the curve calculation.
 */
export function estimateSellSolOut(
  virtualSolReserve: BN,
  virtualTokenReserve: BN,
  tokenAmount: BN,
  curveType: CurveType = CurveType.ConstantProduct
): BN {
  const grossSol = calculateSolOut(virtualSolReserve, virtualTokenReserve, tokenAmount, curveType);
  const fee = calculateFee(grossSol);
  return grossSol.sub(fee);
}

/** Calculate price impact of a trade as basis points. */
export function calculatePriceImpactBps(
  virtualSolReserve: BN,
  virtualTokenReserve: BN,
  solIn: BN,
  curveType: CurveType = CurveType.ConstantProduct
): number {
  const priceBefore = calculateCurrentPrice(virtualSolReserve, virtualTokenReserve);
  const tokensOut = calculateTokensOut(virtualSolReserve, virtualTokenReserve, solIn, curveType);
  const newSolReserve = virtualSolReserve.add(solIn);
  const newTokenReserve = virtualTokenReserve.sub(tokensOut);
  const priceAfter = calculateCurrentPrice(newSolReserve, newTokenReserve);

  if (priceBefore.isZero()) return 0;

  return priceAfter
    .sub(priceBefore)
    .muln(BPS_DENOMINATOR)
    .div(priceBefore)
    .toNumber();
}

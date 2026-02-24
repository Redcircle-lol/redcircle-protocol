import BN from "bn.js";
import { CurveType } from "./types";
/** Calculate tokens received for a given SOL input (before fees). */
export declare function calculateTokensOut(virtualSolReserve: BN, virtualTokenReserve: BN, solIn: BN, curveType?: CurveType): BN;
/** Calculate SOL received for a given token input (before fees). */
export declare function calculateSolOut(virtualSolReserve: BN, virtualTokenReserve: BN, tokensIn: BN, curveType?: CurveType): BN;
/** Calculate current token price in SOL (with 9 decimal precision). */
export declare function calculateCurrentPrice(virtualSolReserve: BN, virtualTokenReserve: BN): BN;
/** Calculate market cap in lamports. */
export declare function calculateMarketCap(virtualSolReserve: BN, virtualTokenReserve: BN, totalSupply: BN): BN;
/** Calculate the fee amount for a given trade. */
export declare function calculateFee(amount: BN): BN;
/**
 * Estimate tokens received from a buy, accounting for the 3% fee.
 * The fee is deducted from the SOL input before the curve calculation.
 */
export declare function estimateBuyTokensOut(virtualSolReserve: BN, virtualTokenReserve: BN, solAmount: BN, curveType?: CurveType): BN;
/**
 * Estimate SOL received from a sell, accounting for the 3% fee.
 * The fee is deducted from the SOL output after the curve calculation.
 */
export declare function estimateSellSolOut(virtualSolReserve: BN, virtualTokenReserve: BN, tokenAmount: BN, curveType?: CurveType): BN;
/** Calculate price impact of a trade as basis points. */
export declare function calculatePriceImpactBps(virtualSolReserve: BN, virtualTokenReserve: BN, solIn: BN, curveType?: CurveType): number;
//# sourceMappingURL=curve.d.ts.map
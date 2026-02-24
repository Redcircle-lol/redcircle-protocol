"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateTokensOut = calculateTokensOut;
exports.calculateSolOut = calculateSolOut;
exports.calculateCurrentPrice = calculateCurrentPrice;
exports.calculateMarketCap = calculateMarketCap;
exports.calculateFee = calculateFee;
exports.estimateBuyTokensOut = estimateBuyTokensOut;
exports.estimateSellSolOut = estimateSellSolOut;
exports.calculatePriceImpactBps = calculatePriceImpactBps;
const bn_js_1 = __importDefault(require("bn.js"));
const types_1 = require("./types");
const constants_1 = require("./constants");
const PRECISION = new bn_js_1.default("1000000000000"); // 10^12
const PRICE_PRECISION = new bn_js_1.default("1000000000"); // 10^9
// --- Constant Product (x * y = k) ---
function constantProductBuy(virtualSolReserve, virtualTokenReserve, solIn) {
    const k = virtualSolReserve.mul(virtualTokenReserve);
    const newSolReserve = virtualSolReserve.add(solIn);
    const newTokenReserve = k.div(newSolReserve);
    return virtualTokenReserve.sub(newTokenReserve);
}
function constantProductSell(virtualSolReserve, virtualTokenReserve, tokensIn) {
    const k = virtualSolReserve.mul(virtualTokenReserve);
    const newTokenReserve = virtualTokenReserve.add(tokensIn);
    const newSolReserve = k.div(newTokenReserve);
    return virtualSolReserve.sub(newSolReserve);
}
// --- Linear ---
function linearBuy(virtualSolReserve, virtualTokenReserve, solIn) {
    const currentPrice = virtualSolReserve.mul(PRECISION).div(virtualTokenReserve);
    const baseTokens = solIn.mul(PRECISION).div(currentPrice);
    const cpTokens = constantProductBuy(virtualSolReserve, virtualTokenReserve, solIn);
    return baseTokens.add(cpTokens).div(new bn_js_1.default(2));
}
function linearSell(virtualSolReserve, virtualTokenReserve, tokensIn) {
    const currentPrice = virtualSolReserve.mul(PRECISION).div(virtualTokenReserve);
    const baseSol = tokensIn.mul(currentPrice).div(PRECISION);
    const cpSol = constantProductSell(virtualSolReserve, virtualTokenReserve, tokensIn);
    return baseSol.add(cpSol).div(new bn_js_1.default(2));
}
// --- Exponential ---
function exponentialBuy(virtualSolReserve, virtualTokenReserve, solIn) {
    const cpTokens = constantProductBuy(virtualSolReserve, virtualTokenReserve, solIn);
    const sizeFactor = solIn.muln(100).div(virtualSolReserve);
    const reductionBps = bn_js_1.default.min(sizeFactor, new bn_js_1.default(50));
    return cpTokens
        .mul(new bn_js_1.default(10000).sub(reductionBps))
        .div(new bn_js_1.default(10000));
}
function exponentialSell(virtualSolReserve, virtualTokenReserve, tokensIn) {
    const cpSol = constantProductSell(virtualSolReserve, virtualTokenReserve, tokensIn);
    const sizeFactor = tokensIn.muln(100).div(virtualTokenReserve);
    const reductionBps = bn_js_1.default.min(sizeFactor, new bn_js_1.default(50));
    return cpSol
        .mul(new bn_js_1.default(10000).sub(reductionBps))
        .div(new bn_js_1.default(10000));
}
// --- Public API ---
/** Calculate tokens received for a given SOL input (before fees). */
function calculateTokensOut(virtualSolReserve, virtualTokenReserve, solIn, curveType = types_1.CurveType.ConstantProduct) {
    switch (curveType) {
        case types_1.CurveType.ConstantProduct:
            return constantProductBuy(virtualSolReserve, virtualTokenReserve, solIn);
        case types_1.CurveType.Linear:
            return linearBuy(virtualSolReserve, virtualTokenReserve, solIn);
        case types_1.CurveType.Exponential:
            return exponentialBuy(virtualSolReserve, virtualTokenReserve, solIn);
    }
}
/** Calculate SOL received for a given token input (before fees). */
function calculateSolOut(virtualSolReserve, virtualTokenReserve, tokensIn, curveType = types_1.CurveType.ConstantProduct) {
    switch (curveType) {
        case types_1.CurveType.ConstantProduct:
            return constantProductSell(virtualSolReserve, virtualTokenReserve, tokensIn);
        case types_1.CurveType.Linear:
            return linearSell(virtualSolReserve, virtualTokenReserve, tokensIn);
        case types_1.CurveType.Exponential:
            return exponentialSell(virtualSolReserve, virtualTokenReserve, tokensIn);
    }
}
/** Calculate current token price in SOL (with 9 decimal precision). */
function calculateCurrentPrice(virtualSolReserve, virtualTokenReserve) {
    return virtualSolReserve.mul(PRICE_PRECISION).div(virtualTokenReserve);
}
/** Calculate market cap in lamports. */
function calculateMarketCap(virtualSolReserve, virtualTokenReserve, totalSupply) {
    const price = calculateCurrentPrice(virtualSolReserve, virtualTokenReserve);
    return price.mul(totalSupply).div(PRICE_PRECISION);
}
/** Calculate the fee amount for a given trade. */
function calculateFee(amount) {
    return amount.muln(constants_1.TOTAL_FEE_BPS).divn(constants_1.BPS_DENOMINATOR);
}
/**
 * Estimate tokens received from a buy, accounting for the 3% fee.
 * The fee is deducted from the SOL input before the curve calculation.
 */
function estimateBuyTokensOut(virtualSolReserve, virtualTokenReserve, solAmount, curveType = types_1.CurveType.ConstantProduct) {
    const fee = calculateFee(solAmount);
    const solAfterFee = solAmount.sub(fee);
    return calculateTokensOut(virtualSolReserve, virtualTokenReserve, solAfterFee, curveType);
}
/**
 * Estimate SOL received from a sell, accounting for the 3% fee.
 * The fee is deducted from the SOL output after the curve calculation.
 */
function estimateSellSolOut(virtualSolReserve, virtualTokenReserve, tokenAmount, curveType = types_1.CurveType.ConstantProduct) {
    const grossSol = calculateSolOut(virtualSolReserve, virtualTokenReserve, tokenAmount, curveType);
    const fee = calculateFee(grossSol);
    return grossSol.sub(fee);
}
/** Calculate price impact of a trade as basis points. */
function calculatePriceImpactBps(virtualSolReserve, virtualTokenReserve, solIn, curveType = types_1.CurveType.ConstantProduct) {
    const priceBefore = calculateCurrentPrice(virtualSolReserve, virtualTokenReserve);
    const tokensOut = calculateTokensOut(virtualSolReserve, virtualTokenReserve, solIn, curveType);
    const newSolReserve = virtualSolReserve.add(solIn);
    const newTokenReserve = virtualTokenReserve.sub(tokensOut);
    const priceAfter = calculateCurrentPrice(newSolReserve, newTokenReserve);
    if (priceBefore.isZero())
        return 0;
    return priceAfter
        .sub(priceBefore)
        .muln(constants_1.BPS_DENOMINATOR)
        .div(priceBefore)
        .toNumber();
}
//# sourceMappingURL=curve.js.map
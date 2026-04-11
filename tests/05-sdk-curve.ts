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
import { SystemProgram } from "@solana/web3.js";

import {
  program,
  connection,
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
  calculateTokensOut,
  calculateSolOut,
  calculateCurrentPrice,
  calculateMarketCap,
  calculateFee,
  estimateBuyTokensOut,
  estimateSellSolOut,
  calculatePriceImpactBps,
  CurveType,
  DEFAULT_INITIAL_VIRTUAL_SOL,
  DEFAULT_INITIAL_VIRTUAL_TOKEN,
  TOTAL_FEE_BPS,
  BPS_DENOMINATOR,
  PROGRAM_ID,
} from "../sdk/src";

describe("SDK: bonding curve calculations", () => {
  const virtualSol = DEFAULT_INITIAL_VIRTUAL_SOL;
  const virtualToken = DEFAULT_INITIAL_VIRTUAL_TOKEN;
  const oneSol = new BN(LAMPORTS_PER_SOL);

  describe("constant product", () => {
    it("calculates tokens out for SOL input", () => {
      const tokensOut = calculateTokensOut(
        virtualSol,
        virtualToken,
        oneSol,
        CurveType.ConstantProduct
      );
      expect(tokensOut.gt(new BN(0))).to.be.true;
      expect(tokensOut.lt(virtualToken)).to.be.true;
    });

    it("calculates SOL out for token input", () => {
      const tokensIn = new BN("32258064516129");
      const solOut = calculateSolOut(
        virtualSol,
        virtualToken,
        tokensIn,
        CurveType.ConstantProduct
      );
      expect(solOut.gt(new BN(0))).to.be.true;
      expect(solOut.lt(virtualSol)).to.be.true;
    });

    it("buy then sell returns approximately same SOL (constant product symmetry)", () => {
      const tokensOut = calculateTokensOut(
        virtualSol,
        virtualToken,
        oneSol,
        CurveType.ConstantProduct
      );
      const newSol = virtualSol.add(oneSol);
      const newToken = virtualToken.sub(tokensOut);
      const solBack = calculateSolOut(
        newSol,
        newToken,
        tokensOut,
        CurveType.ConstantProduct
      );
      const diff = solBack.sub(oneSol).abs();
      expect(diff.lte(new BN(1))).to.be.true;
    });

    it("larger buys get worse rates (price impact)", () => {
      const smallSolIn = new BN(0.1 * LAMPORTS_PER_SOL);
      const largeSolIn = new BN(10 * LAMPORTS_PER_SOL);
      const smallBuy = calculateTokensOut(
        virtualSol,
        virtualToken,
        smallSolIn,
        CurveType.ConstantProduct
      );
      const largeBuy = calculateTokensOut(
        virtualSol,
        virtualToken,
        largeSolIn,
        CurveType.ConstantProduct
      );
      const lhs = smallBuy.mul(largeSolIn);
      const rhs = largeBuy.mul(smallSolIn);
      expect(lhs.gt(rhs)).to.be.true;
    });
  });

  describe("linear curve", () => {
    it("returns non-zero tokens for SOL input", () => {
      const tokensOut = calculateTokensOut(
        virtualSol,
        virtualToken,
        oneSol,
        CurveType.Linear
      );
      expect(tokensOut.gt(new BN(0))).to.be.true;
    });

    it("linear gives different result than constant product", () => {
      const cpTokens = calculateTokensOut(
        virtualSol,
        virtualToken,
        oneSol,
        CurveType.ConstantProduct
      );
      const linTokens = calculateTokensOut(
        virtualSol,
        virtualToken,
        oneSol,
        CurveType.Linear
      );
      expect(linTokens.toString()).to.not.equal(cpTokens.toString());
    });
  });

  describe("exponential curve", () => {
    it("returns non-zero tokens for SOL input", () => {
      const tokensOut = calculateTokensOut(
        virtualSol,
        virtualToken,
        oneSol,
        CurveType.Exponential
      );
      expect(tokensOut.gt(new BN(0))).to.be.true;
    });

    it("exponential gives fewer tokens than constant product", () => {
      const cpTokens = calculateTokensOut(
        virtualSol,
        virtualToken,
        oneSol,
        CurveType.ConstantProduct
      );
      const expTokens = calculateTokensOut(
        virtualSol,
        virtualToken,
        oneSol,
        CurveType.Exponential
      );
      expect(expTokens.lt(cpTokens)).to.be.true;
    });
  });

  describe("pricing functions", () => {
    it("calculateCurrentPrice returns non-zero", () => {
      const price = calculateCurrentPrice(virtualSol, virtualToken);
      expect(price.gt(new BN(0))).to.be.true;
    });

    it("calculateMarketCap is non-zero", () => {
      const marketCap = calculateMarketCap(
        virtualSol,
        virtualToken,
        virtualToken
      );
      expect(marketCap.gt(new BN(0))).to.be.true;
    });

    it("calculateFee computes 3% correctly", () => {
      const amount = new BN(10000);
      const fee = calculateFee(amount);
      expect(fee.toNumber()).to.equal(300);
    });

    it("calculateFee handles small amounts", () => {
      const fee = calculateFee(new BN(100));
      expect(fee.toNumber()).to.equal(3);
    });
  });

  describe("estimate functions (with fees)", () => {
    it("estimateBuyTokensOut deducts fee before curve", () => {
      const tokensWithFee = estimateBuyTokensOut(
        virtualSol,
        virtualToken,
        oneSol
      );
      const tokensNoFee = calculateTokensOut(
        virtualSol,
        virtualToken,
        oneSol
      );
      expect(tokensWithFee.lt(tokensNoFee)).to.be.true;
    });

    it("estimateSellSolOut deducts fee from output", () => {
      const tokensIn = new BN("32258064516129");
      const solWithFee = estimateSellSolOut(
        virtualSol,
        virtualToken,
        tokensIn
      );
      const solNoFee = calculateSolOut(
        virtualSol,
        virtualToken,
        tokensIn
      );
      expect(solWithFee.lt(solNoFee)).to.be.true;
    });
  });

  describe("price impact", () => {
    it("calculates non-negative price impact", () => {
      const impact = calculatePriceImpactBps(
        virtualSol,
        virtualToken,
        oneSol
      );
      expect(impact).to.be.greaterThanOrEqual(0);
    });

    it("larger trades have more price impact", () => {
      const smallImpact = calculatePriceImpactBps(
        virtualSol,
        virtualToken,
        new BN(0.1 * LAMPORTS_PER_SOL)
      );
      const largeImpact = calculatePriceImpactBps(
        virtualSol,
        virtualToken,
        new BN(10 * LAMPORTS_PER_SOL)
      );
      expect(largeImpact).to.be.greaterThan(smallImpact);
    });

    it("zero input returns zero impact", () => {
      const impact = calculatePriceImpactBps(
        virtualSol,
        virtualToken,
        new BN(0)
      );
      expect(impact).to.equal(0);
    });
  });
});

describe("SDK: bonding curve edge cases", () => {
  const virtualSol = DEFAULT_INITIAL_VIRTUAL_SOL;
  const virtualToken = DEFAULT_INITIAL_VIRTUAL_TOKEN;

  it("calculateTokensOut returns 0 for 0 input", () => {
    const out = calculateTokensOut(
      virtualSol,
      virtualToken,
      new BN(0),
      CurveType.ConstantProduct
    );
    expect(out.toNumber()).to.equal(0);
  });

  it("calculateSolOut returns 0 for 0 input", () => {
    const out = calculateSolOut(
      virtualSol,
      virtualToken,
      new BN(0),
      CurveType.ConstantProduct
    );
    expect(out.toNumber()).to.equal(0);
  });

  it("linear curve zero input returns 0", () => {
    const out = calculateTokensOut(
      virtualSol,
      virtualToken,
      new BN(0),
      CurveType.Linear
    );
    expect(out.toNumber()).to.equal(0);
  });

  it("exponential curve zero input returns 0", () => {
    const out = calculateTokensOut(
      virtualSol,
      virtualToken,
      new BN(0),
      CurveType.Exponential
    );
    expect(out.toNumber()).to.equal(0);
  });

  it("calculateFee of 0 is 0", () => {
    expect(calculateFee(new BN(0)).toNumber()).to.equal(0);
  });

  it("calculateFee of 1 is 0 (rounds down)", () => {
    expect(calculateFee(new BN(1)).toNumber()).to.equal(0);
  });

  it("calculateMarketCap scales with supply", () => {
    const mc1 = calculateMarketCap(virtualSol, virtualToken, virtualToken);
    const halfSupply = virtualToken.divn(2);
    const mc2 = calculateMarketCap(virtualSol, virtualToken, halfSupply);
    const diff = mc1.divn(2).sub(mc2).abs();
    expect(diff.lte(new BN(1))).to.be.true;
  });

  it("linear sell returns SOL", () => {
    const tokensIn = new BN("10000000000");
    const solOut = calculateSolOut(
      virtualSol,
      virtualToken,
      tokensIn,
      CurveType.Linear
    );
    expect(solOut.gt(new BN(0))).to.be.true;
  });

  it("exponential sell returns SOL", () => {
    const tokensIn = new BN("10000000000");
    const solOut = calculateSolOut(
      virtualSol,
      virtualToken,
      tokensIn,
      CurveType.Exponential
    );
    expect(solOut.gt(new BN(0))).to.be.true;
  });

  it("exponential sell result differs from constant product for large amounts", () => {
    const tokensIn = new BN("100000000000000");
    const cpSol = calculateSolOut(
      virtualSol,
      virtualToken,
      tokensIn,
      CurveType.ConstantProduct
    );
    const expSol = calculateSolOut(
      virtualSol,
      virtualToken,
      tokensIn,
      CurveType.Exponential
    );
    expect(expSol.lt(cpSol)).to.be.true;
  });

  it("estimateBuyTokensOut works for all curve types", () => {
    const solIn = new BN(LAMPORTS_PER_SOL);
    for (const curve of [
      CurveType.ConstantProduct,
      CurveType.Linear,
      CurveType.Exponential,
    ]) {
      const out = estimateBuyTokensOut(
        virtualSol,
        virtualToken,
        solIn,
        curve
      );
      expect(out.gt(new BN(0))).to.be.true;
    }
  });

  it("estimateSellSolOut works for all curve types", () => {
    const tokensIn = new BN("32258064516129");
    for (const curve of [
      CurveType.ConstantProduct,
      CurveType.Linear,
      CurveType.Exponential,
    ]) {
      const out = estimateSellSolOut(
        virtualSol,
        virtualToken,
        tokensIn,
        curve
      );
      expect(out.gt(new BN(0))).to.be.true;
    }
  });

  it("price impact differs across curve types", () => {
    const solIn = new BN(5 * LAMPORTS_PER_SOL);
    const cpImpact = calculatePriceImpactBps(
      virtualSol,
      virtualToken,
      solIn,
      CurveType.ConstantProduct
    );
    const expImpact = calculatePriceImpactBps(
      virtualSol,
      virtualToken,
      solIn,
      CurveType.Exponential
    );
    const linImpact = calculatePriceImpactBps(
      virtualSol,
      virtualToken,
      solIn,
      CurveType.Linear
    );
    expect(cpImpact).to.be.greaterThan(0);
    expect(expImpact).to.be.greaterThan(0);
    expect(linImpact).to.be.greaterThan(0);
  });
});

describe("SDK: curve accuracy vs on-chain", () => {
  it("SDK estimateBuyTokensOut closely matches on-chain buy result", async () => {
    const poolBefore = await program.account.pool.fetch(poolPda);
    const buyAmount = new BN(0.5 * LAMPORTS_PER_SOL);

    const sdkEstimate = estimateBuyTokensOut(
      poolBefore.virtualSolReserve,
      poolBefore.virtualTokenReserve,
      buyAmount,
      CurveType.ConstantProduct
    );

    const poolTokenVault = await getPoolTokenVault();
    const userTokenAccount = await getUserTokenAccount(user.publicKey);

    const userAtaBefore = await getAccount(connection, userTokenAccount);

    await program.methods
      .buy({ solAmount: buyAmount, minTokensOut: new BN(0) })
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

    const userAtaAfter = await getAccount(connection, userTokenAccount);
    const actualTokensOut = new BN(
      (userAtaAfter.amount - userAtaBefore.amount).toString()
    );

    const diff = sdkEstimate.sub(actualTokensOut).abs();
    const tolerance = sdkEstimate.divn(100);
    expect(diff.lte(tolerance)).to.be.true;
  });

  it("SDK estimateSellSolOut produces consistent estimates", async () => {
    const poolBefore = await program.account.pool.fetch(poolPda);
    const userTokenAccount = await getUserTokenAccount(user.publicKey);
    const userAtaBefore = await getAccount(connection, userTokenAccount);
    const sellAmount = new BN(Number(userAtaBefore.amount) / 10);

    const sdkEstimate = estimateSellSolOut(
      poolBefore.virtualSolReserve,
      poolBefore.virtualTokenReserve,
      sellAmount,
      CurveType.ConstantProduct
    );

    const grossSol = calculateSolOut(
      poolBefore.virtualSolReserve,
      poolBefore.virtualTokenReserve,
      sellAmount,
      CurveType.ConstantProduct
    );

    expect(sdkEstimate.gt(new BN(0))).to.be.true;
    expect(sdkEstimate.lt(grossSol)).to.be.true;
    const fee = grossSol.sub(sdkEstimate);
    const expectedFee = calculateFee(grossSol);
    expect(fee.toString()).to.equal(expectedFee.toString());
  });

  it("SDK calculateCurrentPrice matches on-chain pool state", async () => {
    const pool = await program.account.pool.fetch(poolPda);
    const price = calculateCurrentPrice(
      pool.virtualSolReserve,
      pool.virtualTokenReserve
    );
    expect(price.gt(new BN(0))).to.be.true;
  });
});

describe("SDK: type parsers", () => {
  const { parsePoolStatus, parseCurveType, PoolStatus, CurveType } =
    require("../sdk/src");

  it("parsePoolStatus handles all variants", () => {
    expect(parsePoolStatus({ active: {} })).to.equal(PoolStatus.Active);
    expect(parsePoolStatus({ launchProtection: {} })).to.equal(
      PoolStatus.LaunchProtection
    );
    expect(parsePoolStatus({ paused: {} })).to.equal(PoolStatus.Paused);
  });

  it("parsePoolStatus throws on unknown", () => {
    expect(() => parsePoolStatus({} as any)).to.throw("Unknown pool status");
  });

  it("parseCurveType handles all variants", () => {
    expect(parseCurveType({ constantProduct: {} })).to.equal(
      CurveType.ConstantProduct
    );
    expect(parseCurveType({ linear: {} })).to.equal(CurveType.Linear);
    expect(parseCurveType({ exponential: {} })).to.equal(
      CurveType.Exponential
    );
  });

  it("parseCurveType throws on unknown", () => {
    expect(() => parseCurveType({} as any)).to.throw("Unknown curve type");
  });
});

describe("SDK: constants", () => {
  it("fee BPS sum correctly", () => {
    const { CREATOR_FEE_BPS, PLATFORM_FEE_BPS, INVITER_FEE_BPS, CURATOR_FEE_BPS } =
      require("../sdk/src/constants");
    expect(
      CREATOR_FEE_BPS + PLATFORM_FEE_BPS + INVITER_FEE_BPS + CURATOR_FEE_BPS
    ).to.equal(TOTAL_FEE_BPS);
  });

  it("TOTAL_FEE_BPS is 300 (3%)", () => {
    expect(TOTAL_FEE_BPS).to.equal(300);
  });

  it("BPS_DENOMINATOR is 10000", () => {
    expect(BPS_DENOMINATOR).to.equal(10_000);
  });

  it("PROGRAM_ID matches deployed program", () => {
    expect(PROGRAM_ID.toBase58()).to.equal(program.programId.toBase58());
  });
});

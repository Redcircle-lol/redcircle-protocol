import { expect } from "chai";
import {
  Keypair,
  PublicKey,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
} from "@solana/spl-token";

import {
  program,
  configPda,
  postId,
  poolPda,
  tokenMint,
} from "./helpers";

import {
  findConfigPda,
  findPoolPda,
  findReferralPda,
  findInviterStatsPda,
  findAssociatedTokenAddress,
  derivePoolAddresses,
} from "../sdk/src";

describe("SDK: PDA derivation", () => {
  it("findConfigPda matches on-chain", () => {
    const [pda] = findConfigPda(program.programId);
    expect(pda.toBase58()).to.equal(configPda.toBase58());
  });

  it("findPoolPda is deterministic", () => {
    const [pda1] = findPoolPda("my-post", program.programId);
    const [pda2] = findPoolPda("my-post", program.programId);
    expect(pda1.toBase58()).to.equal(pda2.toBase58());
  });

  it("different postIds produce different PDAs", () => {
    const [pda1] = findPoolPda("post-a", program.programId);
    const [pda2] = findPoolPda("post-b", program.programId);
    expect(pda1.toBase58()).to.not.equal(pda2.toBase58());
  });

  it("derivePoolAddresses returns all needed addresses", () => {
    const addrs = derivePoolAddresses("test-post", program.programId);
    expect(addrs.pool.toBase58()).to.be.a("string");
    expect(addrs.tokenMint.toBase58()).to.be.a("string");
    expect(addrs.poolSolVault.toBase58()).to.be.a("string");
    expect(addrs.poolTokenVault.toBase58()).to.be.a("string");
    expect(addrs.config.toBase58()).to.be.a("string");
  });

  it("findReferralPda is different per user", () => {
    const u1 = Keypair.generate().publicKey;
    const u2 = Keypair.generate().publicKey;
    const [r1] = findReferralPda(u1, program.programId);
    const [r2] = findReferralPda(u2, program.programId);
    expect(r1.toBase58()).to.not.equal(r2.toBase58());
  });

  it("findInviterStatsPda is different per inviter", () => {
    const i1 = Keypair.generate().publicKey;
    const i2 = Keypair.generate().publicKey;
    const [s1] = findInviterStatsPda(i1, program.programId);
    const [s2] = findInviterStatsPda(i2, program.programId);
    expect(s1.toBase58()).to.not.equal(s2.toBase58());
  });
});

describe("SDK: findAssociatedTokenAddress", () => {
  it("matches @solana/spl-token getAssociatedTokenAddress", async () => {
    const { user } = await import("./helpers");
    const sdkAddr = findAssociatedTokenAddress(user.publicKey, tokenMint);
    const splAddr = await getAssociatedTokenAddress(tokenMint, user.publicKey);
    expect(sdkAddr.toBase58()).to.equal(splAddr.toBase58());
  });

  it("PDA-owned ATA matches (allowOwnerOffCurve)", async () => {
    const sdkAddr = findAssociatedTokenAddress(poolPda, tokenMint);
    const splAddr = await getAssociatedTokenAddress(tokenMint, poolPda, true);
    expect(sdkAddr.toBase58()).to.equal(splAddr.toBase58());
  });
});

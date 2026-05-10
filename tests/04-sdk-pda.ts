import { expect } from "chai";
import { Keypair } from "@solana/web3.js";
import { getAssociatedTokenAddress } from "@solana/spl-token";

import { configPda, poolPda, postId, program, tokenMint } from "./helpers";

import {
  derivePoolAddresses,
  findAssociatedTokenAddress,
  findBinPda,
  findConfigPda,
  findMarketStatePda,
  findPoolPda,
  findPositionPda,
  findTokenMintPda,
} from "../sdk/src";

describe("SDK: PDA derivation", () => {
  it("findConfigPda matches shared config PDA", () => {
    const [pda] = findConfigPda(program.programId);
    expect(pda.toBase58()).to.equal(configPda.toBase58());
  });

  it("findPoolPda is deterministic", () => {
    const [pda1] = findPoolPda("my-post", program.programId);
    const [pda2] = findPoolPda("my-post", program.programId);
    expect(pda1.toBase58()).to.equal(pda2.toBase58());
  });

  it("different postIds produce different pool PDAs", () => {
    const [pda1] = findPoolPda("post-a", program.programId);
    const [pda2] = findPoolPda("post-b", program.programId);
    expect(pda1.toBase58()).to.not.equal(pda2.toBase58());
  });

  it("derivePoolAddresses returns pool integration addresses", () => {
    const addrs = derivePoolAddresses(postId, program.programId);
    expect(addrs.config.toBase58()).to.equal(configPda.toBase58());
    expect(addrs.pool.toBase58()).to.equal(poolPda.toBase58());
    expect(addrs.marketState.toBase58()).to.equal(
      findMarketStatePda(poolPda, program.programId)[0].toBase58()
    );
    expect(addrs.tokenMint.toBase58()).to.equal(
      findTokenMintPda(poolPda, program.programId)[0].toBase58()
    );
  });

  it("findBinPda changes by bin id", () => {
    const [binA] = findBinPda(poolPda, 1, program.programId);
    const [binB] = findBinPda(poolPda, 2, program.programId);
    expect(binA.toBase58()).to.not.equal(binB.toBase58());
  });

  it("findPositionPda changes by owner/range", () => {
    const ownerA = Keypair.generate().publicKey;
    const ownerB = Keypair.generate().publicKey;
    const [posA] = findPositionPda(poolPda, ownerA, 1, 2, program.programId);
    const [posB] = findPositionPda(poolPda, ownerB, 1, 2, program.programId);
    const [posC] = findPositionPda(poolPda, ownerA, 2, 3, program.programId);
    expect(posA.toBase58()).to.not.equal(posB.toBase58());
    expect(posA.toBase58()).to.not.equal(posC.toBase58());
  });
});

describe("SDK: associated token derivation", () => {
  it("matches @solana/spl-token for wallet-owned ATAs", async () => {
    const owner = Keypair.generate().publicKey;
    const sdkAddr = findAssociatedTokenAddress(owner, tokenMint);
    const splAddr = await getAssociatedTokenAddress(tokenMint, owner);
    expect(sdkAddr.toBase58()).to.equal(splAddr.toBase58());
  });

  it("matches @solana/spl-token for PDA-owned ATAs", async () => {
    const sdkAddr = findAssociatedTokenAddress(poolPda, tokenMint);
    const splAddr = await getAssociatedTokenAddress(tokenMint, poolPda, true);
    expect(sdkAddr.toBase58()).to.equal(splAddr.toBase58());
  });
});

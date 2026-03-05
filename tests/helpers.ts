import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { RedcircleProtocol } from "../target/types/redcircle_protocol";
import {
  Keypair,
  PublicKey,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
} from "@solana/spl-token";

import {
  findConfigPda,
  findPoolPda,
  findTokenMintPda,
  findPoolSolVaultPda,
  findFeeVaultPda,
} from "../sdk/src";

// Shared provider/program
export const provider = anchor.AnchorProvider.env();
anchor.setProvider(provider);

export const program = anchor.workspace
  .redcircleProtocol as Program<RedcircleProtocol>;
export const connection = provider.connection;

// Test accounts (stable across all test files)
export const admin = provider.wallet as anchor.Wallet;
export const treasury = Keypair.generate();
export const curator = Keypair.generate();
export const user = Keypair.generate();
export const creator = Keypair.generate();
export const inviter = Keypair.generate();
export const nonAdmin = Keypair.generate();

// PDAs
export const postId = "test-post-001";
export const [configPda] = findConfigPda(program.programId);
export const [poolPda] = findPoolPda(postId, program.programId);
export const [tokenMint] = findTokenMintPda(poolPda, program.programId);
export const [poolSolVault] = findPoolSolVaultPda(poolPda, program.programId);
export const [feeVault] = findFeeVaultPda(program.programId);

// Helpers
export async function airdrop(pubkey: PublicKey, amount = 100 * LAMPORTS_PER_SOL) {
  const sig = await connection.requestAirdrop(pubkey, amount);
  await connection.confirmTransaction(sig, "confirmed");
}

export async function getPoolTokenVault(): Promise<PublicKey> {
  return getAssociatedTokenAddress(tokenMint, poolPda, true);
}

export async function getUserTokenAccount(owner: PublicKey): Promise<PublicKey> {
  return getAssociatedTokenAddress(tokenMint, owner);
}

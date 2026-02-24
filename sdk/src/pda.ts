import { PublicKey } from "@solana/web3.js";
import {
  PROGRAM_ID,
  CONFIG_SEED,
  POOL_SEED,
  POOL_SOL_VAULT_SEED,
  FEE_VAULT_SEED,
  REFERRAL_SEED,
  INVITER_STATS_SEED,
  LP_MINT_SEED,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "./constants";

export function findConfigPda(programId: PublicKey = PROGRAM_ID): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([CONFIG_SEED], programId);
}

export function findPoolPda(
  postId: string,
  programId: PublicKey = PROGRAM_ID
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [POOL_SEED, Buffer.from(postId)],
    programId
  );
}

export function findTokenMintPda(
  pool: PublicKey,
  programId: PublicKey = PROGRAM_ID
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [LP_MINT_SEED, pool.toBuffer()],
    programId
  );
}

export function findPoolSolVaultPda(
  pool: PublicKey,
  programId: PublicKey = PROGRAM_ID
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [POOL_SOL_VAULT_SEED, pool.toBuffer()],
    programId
  );
}

export function findFeeVaultPda(programId: PublicKey = PROGRAM_ID): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([FEE_VAULT_SEED], programId);
}

export function findReferralPda(
  user: PublicKey,
  programId: PublicKey = PROGRAM_ID
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [REFERRAL_SEED, user.toBuffer()],
    programId
  );
}

export function findInviterStatsPda(
  inviter: PublicKey,
  programId: PublicKey = PROGRAM_ID
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [INVITER_STATS_SEED, inviter.toBuffer()],
    programId
  );
}

export function findAssociatedTokenAddress(
  owner: PublicKey,
  mint: PublicKey
): PublicKey {
  const [address] = PublicKey.findProgramAddressSync(
    [owner.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
  return address;
}

/** Derive all PDAs needed for a pool given its postId. */
export function derivePoolAddresses(
  postId: string,
  programId: PublicKey = PROGRAM_ID
) {
  const [pool] = findPoolPda(postId, programId);
  const [tokenMint] = findTokenMintPda(pool, programId);
  const [poolSolVault] = findPoolSolVaultPda(pool, programId);
  const poolTokenVault = findAssociatedTokenAddress(pool, tokenMint);
  const [config] = findConfigPda(programId);

  return {
    pool,
    tokenMint,
    poolSolVault,
    poolTokenVault,
    config,
  };
}

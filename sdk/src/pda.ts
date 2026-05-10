import { PublicKey } from "@solana/web3.js";
import {
  PROGRAM_ID,
  CONFIG_SEED,
  POOL_SEED,
  POOL_SOL_VAULT_SEED,
  MARKET_STATE_SEED,
  BIN_SEED,
  POSITION_SEED,
  LP_MINT_SEED,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "./constants";

export function findConfigPda(
  programId: PublicKey = PROGRAM_ID
): [PublicKey, number] {
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

export function findMarketStatePda(
  pool: PublicKey,
  programId: PublicKey = PROGRAM_ID
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [MARKET_STATE_SEED, pool.toBuffer()],
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

export function findBinPda(
  pool: PublicKey,
  binId: number,
  programId: PublicKey = PROGRAM_ID
): [PublicKey, number] {
  const binIdBuffer = Buffer.alloc(4);
  binIdBuffer.writeInt32LE(binId, 0);
  return PublicKey.findProgramAddressSync(
    [BIN_SEED, pool.toBuffer(), binIdBuffer],
    programId
  );
}

export function findPositionPda(
  pool: PublicKey,
  owner: PublicKey,
  lowerBinId: number,
  upperBinId: number,
  programId: PublicKey = PROGRAM_ID
): [PublicKey, number] {
  const lower = Buffer.alloc(4);
  lower.writeInt32LE(lowerBinId, 0);
  const upper = Buffer.alloc(4);
  upper.writeInt32LE(upperBinId, 0);
  return PublicKey.findProgramAddressSync(
    [POSITION_SEED, pool.toBuffer(), owner.toBuffer(), lower, upper],
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

export function derivePoolAddresses(
  postId: string,
  programId: PublicKey = PROGRAM_ID
) {
  const [pool] = findPoolPda(postId, programId);
  const [marketState] = findMarketStatePda(pool, programId);
  const [tokenMint] = findTokenMintPda(pool, programId);
  const [poolSolVault] = findPoolSolVaultPda(pool, programId);
  const poolTokenVault = findAssociatedTokenAddress(pool, tokenMint);
  const [config] = findConfigPda(programId);

  return {
    config,
    pool,
    marketState,
    tokenMint,
    poolSolVault,
    poolTokenVault,
  };
}

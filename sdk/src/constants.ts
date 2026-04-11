import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";

export const PROGRAM_ID = new PublicKey(
  "8vdyo4hfP1ZjmnnEuGrqhHNupt2ZjZ7LmfRtU4kCXS5L"
);

// PDA Seeds
export const CONFIG_SEED = Buffer.from("config");
export const POOL_SEED = Buffer.from("pool");
export const POOL_SOL_VAULT_SEED = Buffer.from("sol_vault");
export const FEE_VAULT_SEED = Buffer.from("fee_vault");
export const REFERRAL_SEED = Buffer.from("referral");
export const INVITER_STATS_SEED = Buffer.from("inviter_stats");
export const LP_MINT_SEED = Buffer.from("lp_mint");

// Fee configuration (basis points)
export const TOTAL_FEE_BPS = 300;
export const CREATOR_FEE_BPS = 100;
export const PLATFORM_FEE_BPS = 100;
export const INVITER_FEE_BPS = 50;
export const CURATOR_FEE_BPS = 50;
export const BPS_DENOMINATOR = 10_000;

// Bonding curve defaults
export const DEFAULT_INITIAL_VIRTUAL_SOL = new BN("30000000000"); // 30 SOL
export const DEFAULT_INITIAL_VIRTUAL_TOKEN = new BN("1000000000000000"); // 1B tokens (6 decimals)
export const DEFAULT_TOKEN_SUPPLY = new BN("1000000000000000"); // 1B tokens (6 decimals)

export const TOKEN_DECIMALS = 6;
export const SOL_DECIMALS = 9;
export const LAMPORTS_PER_SOL = 1_000_000_000;

// Launch protection
export const LAUNCH_PROTECTION_DURATION = 1800; // 30 minutes
export const MAX_BUY_DURING_PROTECTION = new BN("1000000000"); // 1 SOL

// Limits
export const MAX_POST_ID_LEN = 32;
export const MAX_URI_LEN = 256;
export const MAX_NAME_LEN = 32;
export const MAX_SYMBOL_LEN = 8;
export const MIN_TRADE_AMOUNT = new BN("10000"); // 0.00001 SOL

// Solana token programs
export const TOKEN_PROGRAM_ID = new PublicKey(
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
);
export const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey(
  "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
);

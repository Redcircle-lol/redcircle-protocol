import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";

export const PROGRAM_ID = new PublicKey(
  "8vdyo4hfP1ZjmnnEuGrqhHNupt2ZjZ7LmfRtU4kCXS5L"
);

// PDA seeds
export const CONFIG_SEED = Buffer.from("config");
export const POOL_SEED = Buffer.from("pool");
export const POOL_SOL_VAULT_SEED = Buffer.from("sol_vault");
export const MARKET_STATE_SEED = Buffer.from("market");
export const BIN_SEED = Buffer.from("bin");
export const POSITION_SEED = Buffer.from("position");
export const LP_MINT_SEED = Buffer.from("lp_mint");

// Fee configuration
export const TOTAL_FEE_BPS = 300;
export const CREATOR_FEE_BPS = 100;
export const PLATFORM_FEE_BPS = 100;
export const CURATOR_FEE_BPS = 50;
export const GROWTH_FEE_BPS = 50;
export const BPS_DENOMINATOR = 10_000;

// Sigmoid bootstrap defaults
export const DEFAULT_SIGMOID_FLOOR_PRICE = new BN(10);
export const DEFAULT_SIGMOID_CAP_PRICE = new BN(10_000);
export const DEFAULT_SIGMOID_STEEPNESS_BPS = new BN(10_000);
export const DEFAULT_MIGRATION_SUPPLY_THRESHOLD_BPS = 2_500;
export const DEFAULT_MIGRATION_MIN_SOL_RESERVE = new BN("5000000000");
export const DEFAULT_DLMM_BIN_STEP_BPS = 100;
export const MAX_SIGMOID_STEPS = 128;
export const SIGMOID_BAND_BPS = 100;

// Token configuration
export const DEFAULT_TOKEN_SUPPLY = new BN("1000000000000000");
export const TOKEN_DECIMALS = 6;
export const TOKEN_UNIT = new BN("1000000");
export const SOL_DECIMALS = 9;
export const LAMPORTS_PER_SOL = 1_000_000_000;

// Launch protection
export const LAUNCH_PROTECTION_DURATION = 1800;
export const MAX_BUY_DURING_PROTECTION = new BN("1000000000");

// Limits
export const MAX_POST_ID_LEN = 32;
export const MAX_URI_LEN = 256;
export const MAX_NAME_LEN = 32;
export const MAX_SYMBOL_LEN = 8;
export const MIN_TRADE_AMOUNT = new BN("10000");

// Solana token programs
export const TOKEN_PROGRAM_ID = new PublicKey(
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
);
export const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey(
  "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
);

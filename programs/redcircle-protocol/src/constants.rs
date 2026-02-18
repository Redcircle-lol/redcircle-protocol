use anchor_lang::prelude::*;

// SEEDS

#[constant]
pub const CONFIG_SEED: &[u8] = b"config";

#[constant]
pub const POOL_SEED: &[u8] = b"pool";

#[constant]
pub const POOL_SOL_VAULT_SEED: &[u8] = b"sol_vault";

#[constant]
pub const FEE_VAULT_SEED: &[u8] = b"fee_vault";

#[constant]
pub const REFERRAL_SEED: &[u8] = b"referral";

#[constant]
pub const LP_MINT_SEED: &[u8] = b"lp_mint";

// FEE CONFIGURATION (basis points - 1 bp = 0.01%)

/// Total trading fee: 3% (300 basis points)
#[constant]
pub const TOTAL_FEE_BPS: u64 = 300;

/// Creator fee: 1% (100 basis points)
#[constant]
pub const CREATOR_FEE_BPS: u64 = 100;

/// Platform (RedCircle) fee: 1% (100 basis points)
#[constant]
pub const PLATFORM_FEE_BPS: u64 = 100;

/// Inviter (referrer) fee: 0.5% (50 basis points)
#[constant]
pub const INVITER_FEE_BPS: u64 = 50;

/// Curator fee: 0.5% (50 basis points)
#[constant]
pub const CURATOR_FEE_BPS: u64 = 50;

/// Basis points denominator (100% = 10000 bps)
#[constant]
pub const BPS_DENOMINATOR: u64 = 10000;

// BONDING CURVE DEFAULTS

/// Default initial virtual SOL reserve (in lamports)
/// 30 SOL = 30_000_000_000 lamports
#[constant]
pub const DEFAULT_INITIAL_VIRTUAL_SOL: u64 = 30_000_000_000;

/// Default initial virtual token reserve
/// 1 billion tokens with 6 decimals = 1_000_000_000_000_000
#[constant]
pub const DEFAULT_INITIAL_VIRTUAL_TOKEN: u64 = 1_000_000_000_000_000;

/// Default token total supply
/// 1 billion tokens with 6 decimals
#[constant]
pub const DEFAULT_TOKEN_SUPPLY: u64 = 1_000_000_000_000_000;

/// Default migration threshold (SOL collected to trigger graduation)
/// 85 SOL = 85_000_000_000 lamports
#[constant]
pub const DEFAULT_MIGRATION_THRESHOLD: u64 = 85_000_000_000;

/// Token decimals for RPT tokens
#[constant]
pub const TOKEN_DECIMALS: u8 = 6;

// ANTI-BOT / LAUNCH PROTECTION

/// Launch protection duration in seconds (e.g., 30 seconds)
#[constant]
pub const LAUNCH_PROTECTION_DURATION: i64 = 30;

/// Maximum buy during launch protection (in lamports)
/// 1 SOL = 1_000_000_000 lamports
#[constant]
pub const MAX_BUY_DURING_PROTECTION: u64 = 1_000_000_000;

// LIMITS

/// Maximum post ID length
#[constant]
pub const MAX_POST_ID_LEN: usize = 32;

/// Maximum metadata URI length
#[constant]
pub const MAX_URI_LEN: usize = 200;

/// Maximum token name length
#[constant]
pub const MAX_NAME_LEN: usize = 32;

/// Maximum token symbol length
#[constant]
pub const MAX_SYMBOL_LEN: usize = 10;

/// Minimum trade amount (in lamports) - prevents dust attacks
#[constant]
pub const MIN_TRADE_AMOUNT: u64 = 10_000; // 0.00001 SOL

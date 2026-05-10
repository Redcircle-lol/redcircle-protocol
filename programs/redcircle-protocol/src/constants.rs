// SEEDS

pub const CONFIG_SEED: &[u8] = b"config";

pub const POOL_SEED: &[u8] = b"pool";

pub const POOL_SOL_VAULT_SEED: &[u8] = b"sol_vault";

pub const MARKET_STATE_SEED: &[u8] = b"market";

pub const BIN_SEED: &[u8] = b"bin";

pub const POSITION_SEED: &[u8] = b"position";

pub const LP_MINT_SEED: &[u8] = b"lp_mint";

// FEE CONFIGURATION (basis points - 1 bp = 0.01%)

/// Total trading fee: 3% (300 basis points)
pub const TOTAL_FEE_BPS: u64 = 300;

/// Creator fee: 1% (100 basis points)
pub const CREATOR_FEE_BPS: u64 = 100;

/// Platform (RedCircle) fee: 1% (100 basis points)
pub const PLATFORM_FEE_BPS: u64 = 100;

/// Curator fee: 0.5% (50 basis points)
pub const CURATOR_FEE_BPS: u64 = 50;

/// Growth fee: 0.5% (50 basis points)
pub const GROWTH_FEE_BPS: u64 = 50;

/// Basis points denominator (100% = 10000 bps)
pub const BPS_DENOMINATOR: u64 = 10000;

/// Pool creation fee: 1% (100 points)
pub const POOL_CREATION_FEE: u64 = 100;

// SIGMOID BOOTSTRAP DEFAULTS

/// Default floor price in lamports per whole post token.
pub const DEFAULT_SIGMOID_FLOOR_PRICE: u64 = 10;

/// Default cap price in lamports per whole post token.
pub const DEFAULT_SIGMOID_CAP_PRICE: u64 = 10_000;

/// Default sigmoid steepness. 10_000 means use the base smoothstep curve.
pub const DEFAULT_SIGMOID_STEEPNESS_BPS: u64 = 10_000;

/// Token supply sold before the pool can migrate to DLMM.
pub const DEFAULT_MIGRATION_SUPPLY_THRESHOLD_BPS: u16 = 2_500;

/// Minimum bootstrap SOL liquidity required before DLMM migration.
pub const DEFAULT_MIGRATION_MIN_SOL_RESERVE: u64 = 5_000_000_000;

/// Default DLMM bin step: 1%.
pub const DEFAULT_DLMM_BIN_STEP_BPS: u16 = 100;

/// Maximum bins a single sigmoid quote may cross.
pub const MAX_SIGMOID_STEPS: u16 = 128;

/// Sigmoid quote band size as a fraction of total supply.
pub const SIGMOID_BAND_BPS: u64 = 100;

/// Default token total supply
/// 1 billion tokens with 6 decimals
pub const DEFAULT_TOKEN_SUPPLY: u64 = 1_000_000_000_000_000;

/// Token decimals for RPT tokens
pub const TOKEN_DECIMALS: u8 = 6;

/// One whole token in base units.
pub const TOKEN_UNIT: u64 = 1_000_000;

// ANTI-BOT / LAUNCH PROTECTION

/// Launch protection duration in seconds (e.g., 30 minutes)
pub const LAUNCH_PROTECTION_DURATION: i64 = 1800;

/// Maximum buy during launch protection (in lamports)
/// 1 SOL = 1_000_000_000 lamports
pub const MAX_BUY_DURING_PROTECTION: u64 = 1_000_000_000;

// LIMITS

/// Maximum post ID length
pub const MAX_POST_ID_LEN: usize = 32;

/// Maximum metadata URI length
pub const MAX_URI_LEN: usize = 256;

/// Maximum token name length
pub const MAX_NAME_LEN: usize = 32;

/// Maximum token symbol length
pub const MAX_SYMBOL_LEN: usize = 8;

/// Minimum trade amount (in lamports) - prevents dust attacks
pub const MIN_TRADE_AMOUNT: u64 = 10_000; // 0.00001 SOL

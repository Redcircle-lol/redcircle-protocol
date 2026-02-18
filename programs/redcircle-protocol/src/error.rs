use anchor_lang::prelude::*;

#[error_code]
pub enum RedCircleError {
    // AUTHORIZATION ERRORS (6000-6009)
    #[msg("Unauthorized: caller is not the admin")]
    Unauthorized,

    #[msg("Protocol is currently paused")]
    ProtocolPaused,

    #[msg("Invalid authority for this operation")]
    InvalidAuthority,

    // POOL ERRORS (6010-6029)
    #[msg("Pool already exists for this post")]
    PoolAlreadyExists,

    #[msg("Pool is not active")]
    PoolNotActive,

    #[msg("Pool is not tradeable")]
    PoolNotTradeable,

    #[msg("Pool has already migrated")]
    PoolAlreadyMigrated,

    #[msg("Pool cannot be migrated yet - threshold not reached")]
    MigrationThresholdNotReached,

    #[msg("Pool is in launch protection period")]
    LaunchProtectionActive,

    #[msg("Invalid pool status for this operation")]
    InvalidPoolStatus,

    #[msg("Post ID is too long")]
    PostIdTooLong,

    #[msg("Post ID cannot be empty")]
    PostIdEmpty,

    // TRADING ERRORS (6030-6049)
    #[msg("Trade amount is below minimum")]
    TradeBelowMinimum,

    #[msg("Trade amount exceeds maximum")]
    TradeExceedsMaximum,

    #[msg("Slippage tolerance exceeded")]
    SlippageExceeded,

    #[msg("Insufficient tokens in pool")]
    InsufficientPoolTokens,

    #[msg("Insufficient SOL in pool")]
    InsufficientPoolSol,

    #[msg("Insufficient user balance")]
    InsufficientBalance,

    #[msg("Trade would exceed supply")]
    ExceedsSupply,

    #[msg("Zero amount not allowed")]
    ZeroAmount,

    #[msg("Buy amount exceeds launch protection limit")]
    ExceedsLaunchProtectionLimit,

    // MATH ERRORS (6050-6059)
    #[msg("Math overflow occurred")]
    MathOverflow,

    #[msg("Math underflow occurred")]
    MathUnderflow,

    #[msg("Division by zero")]
    DivisionByZero,

    #[msg("Invalid calculation result")]
    InvalidCalculation,

    // FEE ERRORS (6060-6069)
    #[msg("No fees to claim")]
    NoFeesToClaim,

    #[msg("Invalid fee configuration")]
    InvalidFeeConfig,

    #[msg("Fee calculation error")]
    FeeCalculationError,

    // REFERRAL ERRORS (6070-6079)
    #[msg("Referral already registered")]
    ReferralAlreadyRegistered,

    #[msg("Cannot refer yourself")]
    SelfReferral,

    #[msg("Inviter not found")]
    InviterNotFound,

    #[msg("Invalid referral")]
    InvalidReferral,

    // TOKEN ERRORS (6080-6089)
    #[msg("Token name too long")]
    TokenNameTooLong,

    #[msg("Token symbol too long")]
    TokenSymbolTooLong,

    #[msg("Token URI too long")]
    TokenUriTooLong,

    #[msg("Invalid token mint")]
    InvalidTokenMint,

    #[msg("Invalid token account")]
    InvalidTokenAccount,

    // CONFIGURATION ERRORS (6090-6099)
    #[msg("Invalid configuration value")]
    InvalidConfig,

    #[msg("Configuration already initialized")]
    AlreadyInitialized,

    #[msg("Invalid virtual reserves")]
    InvalidVirtualReserves,

    #[msg("Invalid migration threshold")]
    InvalidMigrationThreshold,
}

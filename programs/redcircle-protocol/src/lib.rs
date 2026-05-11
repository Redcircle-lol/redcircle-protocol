pub mod constants;
pub mod error;
pub mod instructions;
pub mod math;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use error::*;
pub use instructions::*;
pub use math::*;
pub use state::*;

declare_id!("7rWhaTDG6vnJMTbcPHMLXeebUbFjSLJiN7NLaZtefR9g");

#[program]
pub mod redcircle_protocol {
    use super::*;

    // ADMIN INSTRUCTIONS

    /// Initialize the protocol with global configuration
    pub fn initialize(ctx: Context<Initialize>, params: InitializeParams) -> Result<()> {
        instructions::initialize::initialize_handler(ctx, params)
    }

    /// Update protocol configuration
    pub fn update_config(ctx: Context<UpdateConfig>, params: UpdateConfigParams) -> Result<()> {
        instructions::initialize::update_config_handler(ctx, params)
    }

    /// Set/verify the creator for a pool (post author)
    pub fn set_creator(ctx: Context<SetCreator>) -> Result<()> {
        instructions::claim_fees::set_creator_handler(ctx)
    }

    // POOL INSTRUCTIONS

    /// Create a new pool for a post (tokenize the post)
    /// Anyone can call this to tokenize a post and become a curator
    pub fn create_pool(ctx: Context<CreatePool>, params: CreatePoolParams) -> Result<()> {
        instructions::create_pool::create_pool_handler(ctx, params)
    }

    /// Migrate a post pool from sigmoid bootstrap to DLMM trading.
    pub fn migrate_pool(ctx: Context<MigratePool>, params: MigratePoolParams) -> Result<()> {
        instructions::migrate_pool::migrate_pool_handler(ctx, params)
    }

    /// Initialize a DLMM bin for a migrated post pool.
    pub fn init_bin(ctx: Context<InitBin>, params: InitBinParams) -> Result<()> {
        instructions::init_bins::init_bin_handler(ctx, params)
    }

    /// Add liquidity to a DLMM bin.
    pub fn add_liquidity(ctx: Context<AddLiquidity>, params: AddLiquidityParams) -> Result<()> {
        instructions::add_liquidity::add_liquidity_handler(ctx, params)
    }

    /// Remove liquidity from a DLMM bin.
    pub fn remove_liquidity(
        ctx: Context<RemoveLiquidity>,
        params: RemoveLiquidityParams,
    ) -> Result<()> {
        instructions::remove_liquidity::remove_liquidity_handler(ctx, params)
    }

    /// Admin emergency control for a single post pool.
    pub fn set_pool_status(ctx: Context<SetPoolStatus>, params: SetPoolStatusParams) -> Result<()> {
        instructions::pool_admin::set_pool_status_handler(ctx, params)
    }

    // TRADING INSTRUCTIONS

    pub fn swap(ctx: Context<Swap>, params: SwapParams) -> Result<()> {
        instructions::swap::swap_handler(ctx, params)
    }

    // FEE INSTRUCTIONS

    /// Claim accumulated creator fees from a pool
    /// Only callable by verified creator of the post
    pub fn claim_creator_fees(ctx: Context<ClaimCreatorFees>) -> Result<()> {
        instructions::claim_fees::claim_creator_fees_handler(ctx)
    }

    /// Claim accumulated curator fees from a pool
    /// Only callable by the curator who tokenized the post
    pub fn claim_curator_fees(ctx: Context<ClaimCuratorFees>) -> Result<()> {
        instructions::claim_fees::claim_curator_fees_handler(ctx)
    }

    /// Claim accumulated growth fees from a pool
    /// Only callable by the protocol admin, payable to an admin-selected wallet
    pub fn claim_growth_fees(ctx: Context<ClaimGrowthFees>) -> Result<()> {
        instructions::claim_fees::claim_growth_fees_handler(ctx)
    }
}

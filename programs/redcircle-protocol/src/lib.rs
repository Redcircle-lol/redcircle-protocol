pub mod constants;
pub mod curve;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use error::*;
pub use instructions::*;
pub use state::*;

declare_id!("8vdyo4hfP1ZjmnnEuGrqhHNupt2ZjZ7LmfRtU4kCXS5L");

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

    // TRADING INSTRUCTIONS

    pub fn swap(ctx: Context<Swap>, params: SwapParams) -> Result<()> {
        instructions::swap::swap_handler(ctx, params)
    }

    /// Simplified buy instruction (SOL -> Token)
    pub fn buy(ctx: Context<Buy>, params: BuyParams) -> Result<()> {
        instructions::buy_sell::buy_handler(ctx, params)
    }

    /// Simplified sell instruction (Token -> SOL)
    pub fn sell(ctx: Context<Sell>, params: SellParams) -> Result<()> {
        instructions::buy_sell::sell_handler(ctx, params)
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

    /// Claim accumulated inviter fees
    /// Only callable by the inviter who referred a user
    pub fn claim_inviter_fees(ctx: Context<ClaimInviterFees>) -> Result<()> {
        instructions::claim_fees::claim_inviter_fees_handler(ctx)
    }

    // REFERRAL INSTRUCTIONS

    /// Register a referral relationship
    /// A user registers with their inviter (referrer)
    pub fn register_referral(ctx: Context<RegisterReferral>) -> Result<()> {
        instructions::referral::register_referral_handler(ctx)
    }
}

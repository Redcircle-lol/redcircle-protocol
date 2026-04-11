use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{Mint, MintTo, Token, TokenAccount, mint_to};

use crate::constants::*;
use crate::error::RedCircleError;
use crate::state::{Config, CurveType, Pool, PoolStatus};

/// Create a new pool for a post (tokenize the post)
#[derive(Accounts)]
#[instruction(params: CreatePoolParams)]
pub struct CreatePool<'info> {
    /// The curator who is tokenizing this post
    #[account(mut)]
    pub curator: Signer<'info>,

    /// Global protocol configuration
    #[account(
        mut,
        seeds = [CONFIG_SEED],
        bump = config.bump,
        constraint = !config.is_paused @ RedCircleError::ProtocolPaused
    )]
    pub config: Account<'info, Config>,

    /// The pool account for this post
    #[account(
        init,
        payer = curator,
        space = Pool::SIZE,
        seeds = [POOL_SEED, params.post_id.as_bytes()],
        bump
    )]
    pub pool: Account<'info, Pool>,

    /// The token mint for this pool's RPT token
    #[account(
        init,
        payer = curator,
        seeds = [LP_MINT_SEED, pool.key().as_ref()],
        bump,
        mint::decimals = TOKEN_DECIMALS,
        mint::authority = pool,
    )]
    pub token_mint: Account<'info, Mint>,

    /// Pool's token vault to hold unminted/unsold tokens
    #[account(
        init,
        payer = curator,
        associated_token::mint = token_mint,
        associated_token::authority = pool,
    )]
    pub pool_token_vault: Account<'info, TokenAccount>,

    /// Pool's SOL vault (PDA that holds collected SOL)
    /// CHECK: This is a PDA that will hold SOL
    #[account(
        mut,
        seeds = [POOL_SOL_VAULT_SEED, pool.key().as_ref()],
        bump
    )]
    pub pool_sol_vault: SystemAccount<'info>,

    /// Treasury to receive pool creation fee (if any)
    /// CHECK: Validated against config
    #[account(
        mut,
        constraint = treasury.key() == config.treasury @ RedCircleError::InvalidAuthority
    )]
    pub treasury: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct CreatePoolParams {
    pub post_id: String,
    pub name: String,
    pub symbol: String,
    pub uri: String,
    pub curve_type: Option<u8>,
    pub initial_virtual_sol: Option<u64>,
    pub initial_virtual_token: Option<u64>,
}

pub fn create_pool_handler(ctx: Context<CreatePool>, params: CreatePoolParams) -> Result<()> {
    // Validate inputs
    require!(
        !params.post_id.is_empty(),
        RedCircleError::PostIdEmpty
    );
    require!(
        params.post_id.len() <= MAX_POST_ID_LEN,
        RedCircleError::PostIdTooLong
    );
    require!(
        params.name.len() <= MAX_NAME_LEN,
        RedCircleError::TokenNameTooLong
    );
    require!(
        params.symbol.len() <= MAX_SYMBOL_LEN,
        RedCircleError::TokenSymbolTooLong
    );
    require!(
        params.uri.len() <= MAX_URI_LEN,
        RedCircleError::TokenUriTooLong
    );

    let config = &ctx.accounts.config;
    let pool = &mut ctx.accounts.pool;
    let clock = Clock::get()?;

    // Pay pool creation fee if configured
    if config.pool_creation_fee > 0 {
        anchor_lang::system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                anchor_lang::system_program::Transfer {
                    from: ctx.accounts.curator.to_account_info(),
                    to: ctx.accounts.treasury.to_account_info(),
                },
            ),
            config.pool_creation_fee,
        )?;
    }

    // Initialize pool state
    pool.post_id = params.post_id.clone();
    pool.token_mint = ctx.accounts.token_mint.key();
    pool.curator = ctx.accounts.curator.key();
    pool.creator = Pubkey::default(); // Will be set when creator claims

    // Set curve type from u8 or default
    pool.curve_type = match params.curve_type {
        Some(0) => CurveType::ConstantProduct,
        Some(1) => CurveType::Linear,
        Some(2) => CurveType::Exponential,
        _ => CurveType::ConstantProduct,
    };

    // Set virtual reserves from params or config defaults
    pool.virtual_sol_reserve = params
        .initial_virtual_sol
        .unwrap_or(config.default_initial_virtual_sol);
    pool.virtual_token_reserve = params
        .initial_virtual_token
        .unwrap_or(config.default_initial_virtual_token);

    // Initialize real reserves
    pool.real_sol_reserve = 0;
    pool.real_token_reserve = pool.virtual_token_reserve; // Start with full token supply
    pool.token_supply = pool.virtual_token_reserve;
    pool.tokens_sold = 0;

    // Initialize counters
    pool.total_volume = 0;
    pool.total_fees = 0;
    pool.unclaimed_creator_fees = 0;
    pool.unclaimed_curator_fees = 0;

    // Set timestamps
    pool.created_at = clock.unix_timestamp;
    pool.launch_protection_ends_at = clock.unix_timestamp + config.launch_protection_duration;

    // Set initial status
    if config.launch_protection_duration > 0 {
        pool.status = PoolStatus::LaunchProtection;
    } else {
        pool.status = PoolStatus::Active;
    }

    // Store bumps
    pool.bump = ctx.bumps.pool;
    pool.token_vault_bump = 0; // ATA doesn't have bump
    pool.sol_vault_bump = ctx.bumps.pool_sol_vault;

    // Store metadata
    pool.name = params.name;
    pool.symbol = params.symbol;
    pool.uri = params.uri;

    // Mint total supply to pool vault
    let post_id = pool.post_id.clone();
    let pool_bump = pool.bump;
    let seeds = &[POOL_SEED, post_id.as_bytes(), &[pool_bump]];
    let signer_seeds = &[&seeds[..]];

    mint_to(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                mint: ctx.accounts.token_mint.to_account_info(),
                to: ctx.accounts.pool_token_vault.to_account_info(),
                authority: pool.to_account_info(),
            },
            signer_seeds,
        ),
        pool.token_supply,
    )?;

    // Update global config
    let config = &mut ctx.accounts.config;
    config.total_pools = config
        .total_pools
        .checked_add(1)
        .ok_or(RedCircleError::MathOverflow)?;

    msg!("Pool created for post: {}", pool.post_id);
    msg!("Token mint: {}", pool.token_mint);
    msg!("Curator: {}", pool.curator);
    msg!("Initial virtual SOL: {}", pool.virtual_sol_reserve);
    msg!("Initial virtual tokens: {}", pool.virtual_token_reserve);

    Ok(())
}

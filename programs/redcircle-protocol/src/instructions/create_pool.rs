use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{mint_to, Mint, MintTo, Token, TokenAccount};

use crate::constants::*;
use crate::error::RedCircleError;
use crate::state::{
    Config, DlmmConfig, MarketState, MigrationConfig, Pool, PoolModel, PoolStatus, SigmoidConfig,
};

#[derive(Accounts)]
#[instruction(params: CreatePoolParams)]
pub struct CreatePool<'info> {
    #[account(mut)]
    pub curator: Signer<'info>,

    #[account(
        mut,
        seeds = [CONFIG_SEED],
        bump = config.bump,
        constraint = !config.is_paused @ RedCircleError::ProtocolPaused
    )]
    pub config: Account<'info, Config>,

    #[account(
        init,
        payer = curator,
        space = Pool::SIZE,
        seeds = [POOL_SEED, params.post_id.as_bytes()],
        bump
    )]
    pub pool: Account<'info, Pool>,

    #[account(
        init,
        payer = curator,
        space = MarketState::SIZE,
        seeds = [MARKET_STATE_SEED, pool.key().as_ref()],
        bump
    )]
    pub market_state: Account<'info, MarketState>,

    #[account(
        init,
        payer = curator,
        seeds = [LP_MINT_SEED, pool.key().as_ref()],
        bump,
        mint::decimals = TOKEN_DECIMALS,
        mint::authority = pool,
    )]
    pub token_mint: Account<'info, Mint>,

    #[account(
        init,
        payer = curator,
        associated_token::mint = token_mint,
        associated_token::authority = pool,
    )]
    pub pool_token_vault: Account<'info, TokenAccount>,

    /// CHECK: PDA that will hold SOL
    #[account(
        mut,
        seeds = [POOL_SOL_VAULT_SEED, pool.key().as_ref()],
        bump
    )]
    pub pool_sol_vault: SystemAccount<'info>,

    /// CHECK: Treasury wallet
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
    pub token_supply: Option<u64>,
    pub sigmoid_floor_price: Option<u64>,
    pub sigmoid_cap_price: Option<u64>,
    pub sigmoid_midpoint_supply: Option<u64>,
    pub sigmoid_steepness_bps: Option<u64>,
    pub migration_supply_threshold_bps: Option<u16>,
    pub migration_min_sol_reserve: Option<u64>,
    pub dlmm_bin_step_bps: Option<u16>,
}

pub fn create_pool_handler(ctx: Context<CreatePool>, params: CreatePoolParams) -> Result<()> {
    require!(!params.post_id.is_empty(), RedCircleError::PostIdEmpty);
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
    let market_state = &mut ctx.accounts.market_state;
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

    // Initialize real reserves
    pool.token_supply = params.token_supply.unwrap_or(DEFAULT_TOKEN_SUPPLY);
    require!(pool.token_supply > 0, RedCircleError::InvalidConfig);
    pool.liquidity_sol_reserve = 0;
    pool.liquidity_token_reserve = pool.token_supply;
    pool.tokens_sold = 0;
    pool.model = PoolModel::SigmoidBootstrap;

    let sigmoid = SigmoidConfig {
        token_supply: pool.token_supply,
        floor_price_lamports: params
            .sigmoid_floor_price
            .unwrap_or(config.default_sigmoid_floor_price),
        cap_price_lamports: params
            .sigmoid_cap_price
            .unwrap_or(config.default_sigmoid_cap_price),
        midpoint_supply: params
            .sigmoid_midpoint_supply
            .unwrap_or(pool.token_supply / 2),
        steepness_bps: params
            .sigmoid_steepness_bps
            .unwrap_or(DEFAULT_SIGMOID_STEEPNESS_BPS),
        band_bps: SIGMOID_BAND_BPS,
    };
    sigmoid.validate()?;

    let migration = MigrationConfig {
        supply_threshold_bps: params
            .migration_supply_threshold_bps
            .unwrap_or(DEFAULT_MIGRATION_SUPPLY_THRESHOLD_BPS),
        min_sol_reserve: params
            .migration_min_sol_reserve
            .unwrap_or(DEFAULT_MIGRATION_MIN_SOL_RESERVE),
    };
    migration.validate()?;

    let dlmm = DlmmConfig {
        bin_step_bps: params
            .dlmm_bin_step_bps
            .unwrap_or(DEFAULT_DLMM_BIN_STEP_BPS),
        active_bin_id: 0,
    };
    dlmm.validate()?;

    market_state.pool = pool.key();
    market_state.model = PoolModel::SigmoidBootstrap;
    market_state.sigmoid = sigmoid;
    market_state.migration = migration;
    market_state.dlmm = dlmm;
    market_state.allocated_token_liquidity = 0;
    market_state.allocated_sol_liquidity = 0;
    market_state.total_trade_volume = 0;
    market_state.total_fees_earned = 0;
    market_state.platform_fees_earned = 0;
    market_state.creator_fees_earned = 0;
    market_state.curator_fees_earned = 0;
    market_state.growth_fees_earned = 0;
    market_state.total_trades = 0;
    market_state.buy_trades = 0;
    market_state.sell_trades = 0;
    market_state.migrated_at = 0;
    market_state.bump = ctx.bumps.market_state;

    pool.total_volume = 0;
    pool.total_fees = 0;
    pool.unclaimed_creator_fees = 0;
    pool.unclaimed_curator_fees = 0;
    pool.unclaimed_growth_fees = 0;

    pool.created_at = clock.unix_timestamp;
    pool.launch_protection_ends_at = pool.created_at + config.launch_protection_duration;

    if config.launch_protection_duration > 0 {
        pool.status = PoolStatus::LaunchProtection;
    } else {
        pool.status = PoolStatus::Active;
    }

    pool.bump = ctx.bumps.pool;
    pool.token_vault_bump = 0; // ATA doesn't have bump
    pool.sol_vault_bump = ctx.bumps.pool_sol_vault;

    pool.name = params.name;
    pool.symbol = params.symbol;
    pool.uri = params.uri;

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

    let config = &mut ctx.accounts.config;
    config.total_pools = config
        .total_pools
        .checked_add(1)
        .ok_or(RedCircleError::MathOverflow)?;

    msg!("Pool created for post: {}", pool.post_id);
    msg!("Token mint: {}", pool.token_mint);
    msg!("Curator: {}", pool.curator);
    msg!(
        "Sigmoid floor price: {}",
        market_state.sigmoid.floor_price_lamports
    );
    msg!(
        "Sigmoid cap price: {}",
        market_state.sigmoid.cap_price_lamports
    );

    Ok(())
}

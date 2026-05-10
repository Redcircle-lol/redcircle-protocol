use anchor_lang::prelude::*;

use crate::constants::*;
use crate::error::RedCircleError;
use crate::state::{Bin, Config, MarketState, Pool, PoolModel};

#[derive(Accounts)]
#[instruction(params: InitBinParams)]
pub struct InitBin<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        seeds = [CONFIG_SEED],
        bump = config.bump,
        constraint = !config.is_paused @ RedCircleError::ProtocolPaused
    )]
    pub config: Account<'info, Config>,

    #[account(
        mut,
        seeds = [POOL_SEED, pool.post_id.as_bytes()],
        bump = pool.bump
    )]
    pub pool: Account<'info, Pool>,

    #[account(
        mut,
        seeds = [MARKET_STATE_SEED, pool.key().as_ref()],
        bump = market_state.bump,
        constraint = market_state.pool == pool.key() @ RedCircleError::InvalidAuthority,
        constraint = market_state.model == PoolModel::DLMM @ RedCircleError::MigrationRequired
    )]
    pub market_state: Account<'info, MarketState>,

    #[account(
        init,
        payer = authority,
        space = Bin::SIZE,
        seeds = [BIN_SEED, pool.key().as_ref(), &params.bin_id.to_le_bytes()],
        bump
    )]
    pub bin: Account<'info, Bin>,

    pub system_program: Program<'info, System>,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct InitBinParams {
    pub bin_id: i32,
    pub price_lamports_per_token: u64,
    pub initial_token_liquidity: u64,
    pub initial_sol_liquidity: u64,
}

pub fn init_bin_handler(ctx: Context<InitBin>, params: InitBinParams) -> Result<()> {
    let authority = ctx.accounts.authority.key();
    require!(
        authority == ctx.accounts.config.admin || authority == ctx.accounts.pool.curator,
        RedCircleError::Unauthorized
    );
    require!(
        params.price_lamports_per_token > 0,
        RedCircleError::InvalidDlmmBin
    );
    require!(
        params.initial_token_liquidity > 0 || params.initial_sol_liquidity > 0,
        RedCircleError::ZeroAmount
    );

    let next_allocated_tokens = ctx
        .accounts
        .market_state
        .allocated_token_liquidity
        .checked_add(params.initial_token_liquidity)
        .ok_or(RedCircleError::MathOverflow)?;
    let next_allocated_sol = ctx
        .accounts
        .market_state
        .allocated_sol_liquidity
        .checked_add(params.initial_sol_liquidity)
        .ok_or(RedCircleError::MathOverflow)?;
    require!(
        next_allocated_tokens <= ctx.accounts.pool.liquidity_token_reserve,
        RedCircleError::InsufficientPoolTokens
    );
    require!(
        next_allocated_sol <= ctx.accounts.pool.liquidity_sol_reserve,
        RedCircleError::InsufficientPoolSol
    );

    let bin = &mut ctx.accounts.bin;
    bin.pool = ctx.accounts.pool.key();
    bin.bin_id = params.bin_id;
    bin.price_lamports_per_token = params.price_lamports_per_token;
    bin.token_liquidity = params.initial_token_liquidity;
    bin.sol_liquidity = params.initial_sol_liquidity;
    bin.fee_growth_sol = 0;
    bin.fee_growth_token = 0;
    bin.bump = ctx.bumps.bin;
    ctx.accounts.market_state.allocated_token_liquidity = next_allocated_tokens;
    ctx.accounts.market_state.allocated_sol_liquidity = next_allocated_sol;

    msg!(
        "Initialized DLMM bin {} for pool {} at price {}",
        params.bin_id,
        ctx.accounts.pool.post_id,
        params.price_lamports_per_token
    );

    Ok(())
}

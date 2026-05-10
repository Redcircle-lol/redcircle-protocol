use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{transfer, Mint, Token, TokenAccount, Transfer};

use crate::constants::*;
use crate::error::RedCircleError;
use crate::math::{quote_dlmm_buy, quote_dlmm_sell, quote_sigmoid_buy, quote_sigmoid_sell};
use crate::state::{Bin, Config, MarketState, Pool, PoolModel, PoolStatus};

#[derive(Accounts)]
pub struct Swap<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [CONFIG_SEED],
        bump = config.bump,
        constraint = !config.is_paused @ RedCircleError::ProtocolPaused
    )]
    pub config: Box<Account<'info, Config>>,

    #[account(
        mut,
        seeds = [POOL_SEED, pool.post_id.as_bytes()],
        bump = pool.bump,
        constraint = pool.is_tradeable() @ RedCircleError::PoolNotTradeable
    )]
    pub pool: Box<Account<'info, Pool>>,

    #[account(
        mut,
        seeds = [MARKET_STATE_SEED, pool.key().as_ref()],
        bump = market_state.bump,
        constraint = market_state.pool == pool.key() @ RedCircleError::InvalidAuthority
    )]
    pub market_state: Box<Account<'info, MarketState>>,

    #[account(address = pool.token_mint @ RedCircleError::InvalidTokenMint)]
    pub token_mint: Box<Account<'info, Mint>>,

    #[account(
        mut,
        associated_token::mint = token_mint,
        associated_token::authority = pool,
    )]
    pub pool_token_vault: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        seeds = [POOL_SOL_VAULT_SEED, pool.key().as_ref()],
        bump = pool.sol_vault_bump
    )]
    pub pool_sol_vault: SystemAccount<'info>,

    /// Active DLMM bin. Required only after the pool has migrated.
    #[account(mut)]
    pub active_bin: Option<Box<Account<'info, Bin>>>,

    #[account(
        init_if_needed,
        payer = user,
        associated_token::mint = token_mint,
        associated_token::authority = user,
    )]
    pub user_token_account: Box<Account<'info, TokenAccount>>,

    /// CHECK: Treasury wallet
    #[account(
        mut,
        constraint = treasury.key() == config.treasury @ RedCircleError::InvalidAuthority
    )]
    pub treasury: UncheckedAccount<'info>,

    /// CHECK: Curator wallet
    #[account(
        mut,
        constraint = curator.key() == pool.curator @ RedCircleError::InvalidAuthority
    )]
    pub curator: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct SwapParams {
    pub amount_in: u64,
    pub minimum_amount_out: u64,
    pub is_buy: bool,
}

struct FeeBreakdown {
    total: u64,
    platform: u64,
    curator: u64,
    creator: u64,
    growth: u64,
}

pub fn swap_handler(mut ctx: Context<Swap>, params: SwapParams) -> Result<()> {
    require!(params.amount_in > 0, RedCircleError::ZeroAmount);
    require!(
        params.amount_in >= MIN_TRADE_AMOUNT,
        RedCircleError::TradeBelowMinimum
    );

    let clock = Clock::get()?;
    if ctx.accounts.pool.status == PoolStatus::LaunchProtection {
        if clock.unix_timestamp >= ctx.accounts.pool.launch_protection_ends_at {
            ctx.accounts.pool.status = PoolStatus::Active;
        } else if params.is_buy {
            require!(
                params.amount_in <= ctx.accounts.config.max_buy_during_protection,
                RedCircleError::ExceedsLaunchProtectionLimit
            );
        }
    }

    require!(
        ctx.accounts.pool.model == ctx.accounts.market_state.model,
        RedCircleError::InvalidPoolStatus
    );

    match ctx.accounts.market_state.model {
        PoolModel::SigmoidBootstrap => {
            if params.is_buy {
                execute_sigmoid_buy(&mut ctx, params)
            } else {
                execute_sigmoid_sell(&mut ctx, params)
            }
        }
        PoolModel::MigrationPending => err!(RedCircleError::MigrationRequired),
        PoolModel::DLMM => {
            if params.is_buy {
                execute_dlmm_buy(&mut ctx, params)
            } else {
                execute_dlmm_sell(&mut ctx, params)
            }
        }
    }
}

fn execute_sigmoid_buy(ctx: &mut Context<Swap>, params: SwapParams) -> Result<()> {
    let fees = calculate_input_fees(params.amount_in)?;
    let sol_after_fee = params
        .amount_in
        .checked_sub(fees.total)
        .ok_or(RedCircleError::MathUnderflow)?;

    let quote = quote_sigmoid_buy(
        &ctx.accounts.market_state.sigmoid,
        ctx.accounts.pool.tokens_sold,
        sol_after_fee,
    )?;
    let tokens_out = quote.amount_out;

    require!(
        tokens_out >= params.minimum_amount_out,
        RedCircleError::SlippageExceeded
    );
    require!(
        tokens_out <= ctx.accounts.pool.liquidity_token_reserve,
        RedCircleError::InsufficientPoolTokens
    );

    transfer_buy_sol(ctx, quote.gross_sol, &fees)?;
    transfer_tokens_from_pool(ctx, tokens_out)?;

    {
        let pool = &mut ctx.accounts.pool;
        pool.liquidity_sol_reserve = pool
            .liquidity_sol_reserve
            .checked_add(quote.gross_sol)
            .ok_or(RedCircleError::MathOverflow)?;
        pool.liquidity_token_reserve = pool
            .liquidity_token_reserve
            .checked_sub(tokens_out)
            .ok_or(RedCircleError::MathUnderflow)?;
        pool.tokens_sold = pool
            .tokens_sold
            .checked_add(tokens_out)
            .ok_or(RedCircleError::MathOverflow)?;
        apply_pool_fee_stats(pool, params.amount_in, &fees)?;

        if ctx.accounts.market_state.migration_conditions_met(pool)? {
            pool.model = PoolModel::MigrationPending;
            ctx.accounts.market_state.model = PoolModel::MigrationPending;
        }
    }

    apply_market_fee_stats(
        &mut ctx.accounts.market_state,
        params.amount_in,
        &fees,
        true,
    )?;
    apply_config_fee_stats(&mut ctx.accounts.config, params.amount_in, &fees)?;

    msg!(
        "Sigmoid buy executed: {} lamports -> {} tokens",
        params.amount_in,
        tokens_out
    );
    Ok(())
}

fn execute_sigmoid_sell(ctx: &mut Context<Swap>, params: SwapParams) -> Result<()> {
    let quote = quote_sigmoid_sell(
        &ctx.accounts.market_state.sigmoid,
        ctx.accounts.pool.tokens_sold,
        params.amount_in,
    )?;
    let gross_sol = quote.gross_sol;
    let fees = calculate_output_fees(gross_sol)?;
    let sol_out = gross_sol
        .checked_sub(fees.total)
        .ok_or(RedCircleError::MathUnderflow)?;

    require!(
        sol_out >= params.minimum_amount_out,
        RedCircleError::SlippageExceeded
    );
    require!(
        gross_sol <= ctx.accounts.pool.liquidity_sol_reserve,
        RedCircleError::InsufficientPoolSol
    );

    transfer_tokens_to_pool(ctx, params.amount_in)?;
    transfer_sell_sol(ctx, sol_out, &fees)?;

    {
        let pool = &mut ctx.accounts.pool;
        pool.liquidity_sol_reserve = pool
            .liquidity_sol_reserve
            .checked_sub(gross_sol)
            .ok_or(RedCircleError::MathUnderflow)?;
        pool.liquidity_token_reserve = pool
            .liquidity_token_reserve
            .checked_add(params.amount_in)
            .ok_or(RedCircleError::MathOverflow)?;
        pool.tokens_sold = pool
            .tokens_sold
            .checked_sub(params.amount_in)
            .ok_or(RedCircleError::MathUnderflow)?;
        apply_pool_fee_stats(pool, gross_sol, &fees)?;
    }

    apply_market_fee_stats(&mut ctx.accounts.market_state, gross_sol, &fees, false)?;
    apply_config_fee_stats(&mut ctx.accounts.config, gross_sol, &fees)?;

    msg!(
        "Sigmoid sell executed: {} tokens -> {} lamports",
        params.amount_in,
        sol_out
    );
    Ok(())
}

fn execute_dlmm_buy(ctx: &mut Context<Swap>, params: SwapParams) -> Result<()> {
    let fees = calculate_input_fees(params.amount_in)?;
    let sol_after_fee = params
        .amount_in
        .checked_sub(fees.total)
        .ok_or(RedCircleError::MathUnderflow)?;

    let pool_key = ctx.accounts.pool.key();
    let bin = ctx
        .accounts
        .active_bin
        .as_mut()
        .ok_or(RedCircleError::InvalidDlmmBin)?;
    require!(bin.pool == pool_key, RedCircleError::InvalidDlmmBin);
    require!(
        bin.bin_id == ctx.accounts.market_state.dlmm.active_bin_id,
        RedCircleError::InvalidDlmmBin
    );

    let tokens_out = quote_dlmm_buy(sol_after_fee, bin.price_lamports_per_token)?;
    require!(
        tokens_out >= params.minimum_amount_out,
        RedCircleError::SlippageExceeded
    );
    require!(
        tokens_out <= bin.token_liquidity,
        RedCircleError::InsufficientBinLiquidity
    );
    require!(
        tokens_out <= ctx.accounts.pool.liquidity_token_reserve,
        RedCircleError::InsufficientPoolTokens
    );

    transfer_buy_sol(ctx, sol_after_fee, &fees)?;
    transfer_tokens_from_pool(ctx, tokens_out)?;

    let bin = ctx.accounts.active_bin.as_mut().unwrap();
    bin.token_liquidity = bin
        .token_liquidity
        .checked_sub(tokens_out)
        .ok_or(RedCircleError::MathUnderflow)?;
    bin.sol_liquidity = bin
        .sol_liquidity
        .checked_add(sol_after_fee)
        .ok_or(RedCircleError::MathOverflow)?;
    ctx.accounts.market_state.allocated_token_liquidity = ctx
        .accounts
        .market_state
        .allocated_token_liquidity
        .checked_sub(tokens_out)
        .ok_or(RedCircleError::MathUnderflow)?;
    ctx.accounts.market_state.allocated_sol_liquidity = ctx
        .accounts
        .market_state
        .allocated_sol_liquidity
        .checked_add(sol_after_fee)
        .ok_or(RedCircleError::MathOverflow)?;
    if bin.token_liquidity == 0 {
        ctx.accounts.market_state.dlmm.active_bin_id = ctx
            .accounts
            .market_state
            .dlmm
            .active_bin_id
            .checked_add(1)
            .ok_or(RedCircleError::MathOverflow)?;
    }

    let pool = &mut ctx.accounts.pool;
    pool.liquidity_sol_reserve = pool
        .liquidity_sol_reserve
        .checked_add(sol_after_fee)
        .ok_or(RedCircleError::MathOverflow)?;
    pool.liquidity_token_reserve = pool
        .liquidity_token_reserve
        .checked_sub(tokens_out)
        .ok_or(RedCircleError::MathUnderflow)?;
    apply_pool_fee_stats(pool, params.amount_in, &fees)?;
    apply_market_fee_stats(
        &mut ctx.accounts.market_state,
        params.amount_in,
        &fees,
        true,
    )?;
    apply_config_fee_stats(&mut ctx.accounts.config, params.amount_in, &fees)?;

    msg!(
        "DLMM buy executed: {} lamports -> {} tokens",
        params.amount_in,
        tokens_out
    );
    Ok(())
}

fn execute_dlmm_sell(ctx: &mut Context<Swap>, params: SwapParams) -> Result<()> {
    let pool_key = ctx.accounts.pool.key();
    let bin = ctx
        .accounts
        .active_bin
        .as_mut()
        .ok_or(RedCircleError::InvalidDlmmBin)?;
    require!(bin.pool == pool_key, RedCircleError::InvalidDlmmBin);
    require!(
        bin.bin_id == ctx.accounts.market_state.dlmm.active_bin_id,
        RedCircleError::InvalidDlmmBin
    );

    let gross_sol = quote_dlmm_sell(params.amount_in, bin.price_lamports_per_token)?;
    let fees = calculate_output_fees(gross_sol)?;
    let sol_out = gross_sol
        .checked_sub(fees.total)
        .ok_or(RedCircleError::MathUnderflow)?;

    require!(
        sol_out >= params.minimum_amount_out,
        RedCircleError::SlippageExceeded
    );
    require!(
        gross_sol <= bin.sol_liquidity,
        RedCircleError::InsufficientBinLiquidity
    );
    require!(
        gross_sol <= ctx.accounts.pool.liquidity_sol_reserve,
        RedCircleError::InsufficientPoolSol
    );

    transfer_tokens_to_pool(ctx, params.amount_in)?;
    transfer_sell_sol(ctx, sol_out, &fees)?;

    let bin = ctx.accounts.active_bin.as_mut().unwrap();
    bin.sol_liquidity = bin
        .sol_liquidity
        .checked_sub(gross_sol)
        .ok_or(RedCircleError::MathUnderflow)?;
    bin.token_liquidity = bin
        .token_liquidity
        .checked_add(params.amount_in)
        .ok_or(RedCircleError::MathOverflow)?;
    ctx.accounts.market_state.allocated_sol_liquidity = ctx
        .accounts
        .market_state
        .allocated_sol_liquidity
        .checked_sub(gross_sol)
        .ok_or(RedCircleError::MathUnderflow)?;
    ctx.accounts.market_state.allocated_token_liquidity = ctx
        .accounts
        .market_state
        .allocated_token_liquidity
        .checked_add(params.amount_in)
        .ok_or(RedCircleError::MathOverflow)?;
    if bin.sol_liquidity == 0 {
        ctx.accounts.market_state.dlmm.active_bin_id = ctx
            .accounts
            .market_state
            .dlmm
            .active_bin_id
            .checked_sub(1)
            .ok_or(RedCircleError::MathUnderflow)?;
    }

    let pool = &mut ctx.accounts.pool;
    pool.liquidity_sol_reserve = pool
        .liquidity_sol_reserve
        .checked_sub(gross_sol)
        .ok_or(RedCircleError::MathUnderflow)?;
    pool.liquidity_token_reserve = pool
        .liquidity_token_reserve
        .checked_add(params.amount_in)
        .ok_or(RedCircleError::MathOverflow)?;
    apply_pool_fee_stats(pool, gross_sol, &fees)?;
    apply_market_fee_stats(&mut ctx.accounts.market_state, gross_sol, &fees, false)?;
    apply_config_fee_stats(&mut ctx.accounts.config, gross_sol, &fees)?;

    msg!(
        "DLMM sell executed: {} tokens -> {} lamports",
        params.amount_in,
        sol_out
    );
    Ok(())
}

fn calculate_input_fees(amount_in: u64) -> Result<FeeBreakdown> {
    calculate_fee_breakdown(amount_in)
}

fn calculate_output_fees(gross_out: u64) -> Result<FeeBreakdown> {
    calculate_fee_breakdown(gross_out)
}

fn calculate_fee_breakdown(amount: u64) -> Result<FeeBreakdown> {
    let total = amount
        .checked_mul(TOTAL_FEE_BPS)
        .ok_or(RedCircleError::MathOverflow)?
        .checked_div(BPS_DENOMINATOR)
        .ok_or(RedCircleError::DivisionByZero)?;
    let curator = split_fee(total, CURATOR_FEE_BPS)?;
    let creator = split_fee(total, CREATOR_FEE_BPS)?;
    let growth = split_fee(total, GROWTH_FEE_BPS)?;
    let platform = total
        .checked_sub(curator)
        .ok_or(RedCircleError::MathUnderflow)?
        .checked_sub(creator)
        .ok_or(RedCircleError::MathUnderflow)?
        .checked_sub(growth)
        .ok_or(RedCircleError::MathUnderflow)?;

    Ok(FeeBreakdown {
        total,
        platform,
        curator,
        creator,
        growth,
    })
}

fn split_fee(total_fee: u64, share_bps: u64) -> Result<u64> {
    total_fee
        .checked_mul(share_bps)
        .ok_or(RedCircleError::MathOverflow)?
        .checked_div(TOTAL_FEE_BPS)
        .ok_or(RedCircleError::DivisionByZero)
        .map_err(Into::into)
}

fn transfer_buy_sol(ctx: &Context<Swap>, pool_sol_amount: u64, fees: &FeeBreakdown) -> Result<()> {
    let pool_deposit = pool_sol_amount
        .checked_add(fees.creator)
        .ok_or(RedCircleError::MathOverflow)?
        .checked_add(fees.curator)
        .ok_or(RedCircleError::MathOverflow)?
        .checked_add(fees.growth)
        .ok_or(RedCircleError::MathOverflow)?;
    if pool_deposit > 0 {
        anchor_lang::system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                anchor_lang::system_program::Transfer {
                    from: ctx.accounts.user.to_account_info(),
                    to: ctx.accounts.pool_sol_vault.to_account_info(),
                },
            ),
            pool_deposit,
        )?;
    }

    if fees.platform > 0 {
        anchor_lang::system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                anchor_lang::system_program::Transfer {
                    from: ctx.accounts.user.to_account_info(),
                    to: ctx.accounts.treasury.to_account_info(),
                },
            ),
            fees.platform,
        )?;
    }

    Ok(())
}

fn transfer_sell_sol(ctx: &Context<Swap>, user_amount: u64, fees: &FeeBreakdown) -> Result<()> {
    let pool_key = ctx.accounts.pool.key();
    let sol_vault_bump = ctx.accounts.pool.sol_vault_bump;
    let seeds: &[&[u8]] = &[POOL_SOL_VAULT_SEED, pool_key.as_ref(), &[sol_vault_bump]];
    let signer = &[seeds];

    if user_amount > 0 {
        anchor_lang::system_program::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.system_program.to_account_info(),
                anchor_lang::system_program::Transfer {
                    from: ctx.accounts.pool_sol_vault.to_account_info(),
                    to: ctx.accounts.user.to_account_info(),
                },
                signer,
            ),
            user_amount,
        )?;
    }

    if fees.platform > 0 {
        anchor_lang::system_program::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.system_program.to_account_info(),
                anchor_lang::system_program::Transfer {
                    from: ctx.accounts.pool_sol_vault.to_account_info(),
                    to: ctx.accounts.treasury.to_account_info(),
                },
                signer,
            ),
            fees.platform,
        )?;
    }

    Ok(())
}

fn transfer_tokens_from_pool(ctx: &Context<Swap>, amount: u64) -> Result<()> {
    let post_id = ctx.accounts.pool.post_id.clone();
    let pool_bump = ctx.accounts.pool.bump;
    let seeds = &[POOL_SEED, post_id.as_bytes(), &[pool_bump]];
    let signer_seeds = &[&seeds[..]];

    transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.pool_token_vault.to_account_info(),
                to: ctx.accounts.user_token_account.to_account_info(),
                authority: ctx.accounts.pool.to_account_info(),
            },
            signer_seeds,
        ),
        amount,
    )
}

fn transfer_tokens_to_pool(ctx: &Context<Swap>, amount: u64) -> Result<()> {
    transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.user_token_account.to_account_info(),
                to: ctx.accounts.pool_token_vault.to_account_info(),
                authority: ctx.accounts.user.to_account_info(),
            },
        ),
        amount,
    )
}

fn apply_pool_fee_stats(pool: &mut Pool, volume: u64, fees: &FeeBreakdown) -> Result<()> {
    pool.total_volume = pool
        .total_volume
        .checked_add(volume as u128)
        .ok_or(RedCircleError::MathOverflow)?;
    pool.total_fees = pool
        .total_fees
        .checked_add(fees.total)
        .ok_or(RedCircleError::MathOverflow)?;
    pool.unclaimed_creator_fees = pool
        .unclaimed_creator_fees
        .checked_add(fees.creator)
        .ok_or(RedCircleError::MathOverflow)?;
    pool.unclaimed_curator_fees = pool
        .unclaimed_curator_fees
        .checked_add(fees.curator)
        .ok_or(RedCircleError::MathOverflow)?;
    pool.unclaimed_growth_fees = pool
        .unclaimed_growth_fees
        .checked_add(fees.growth)
        .ok_or(RedCircleError::MathOverflow)?;
    Ok(())
}

fn apply_market_fee_stats(
    market_state: &mut MarketState,
    volume: u64,
    fees: &FeeBreakdown,
    is_buy: bool,
) -> Result<()> {
    market_state.total_trade_volume = market_state
        .total_trade_volume
        .checked_add(volume as u128)
        .ok_or(RedCircleError::MathOverflow)?;
    market_state.total_fees_earned = market_state
        .total_fees_earned
        .checked_add(fees.total as u128)
        .ok_or(RedCircleError::MathOverflow)?;
    market_state.platform_fees_earned = market_state
        .platform_fees_earned
        .checked_add(fees.platform as u128)
        .ok_or(RedCircleError::MathOverflow)?;
    market_state.creator_fees_earned = market_state
        .creator_fees_earned
        .checked_add(fees.creator as u128)
        .ok_or(RedCircleError::MathOverflow)?;
    market_state.curator_fees_earned = market_state
        .curator_fees_earned
        .checked_add(fees.curator as u128)
        .ok_or(RedCircleError::MathOverflow)?;
    market_state.growth_fees_earned = market_state
        .growth_fees_earned
        .checked_add(fees.growth as u128)
        .ok_or(RedCircleError::MathOverflow)?;
    market_state.total_trades = market_state
        .total_trades
        .checked_add(1)
        .ok_or(RedCircleError::MathOverflow)?;

    if is_buy {
        market_state.buy_trades = market_state
            .buy_trades
            .checked_add(1)
            .ok_or(RedCircleError::MathOverflow)?;
    } else {
        market_state.sell_trades = market_state
            .sell_trades
            .checked_add(1)
            .ok_or(RedCircleError::MathOverflow)?;
    }

    Ok(())
}

fn apply_config_fee_stats(config: &mut Config, volume: u64, fees: &FeeBreakdown) -> Result<()> {
    config.total_volume = config
        .total_volume
        .checked_add(volume as u128)
        .ok_or(RedCircleError::MathOverflow)?;
    config.total_fees_collected = config
        .total_fees_collected
        .checked_add(fees.total as u128)
        .ok_or(RedCircleError::MathOverflow)?;
    Ok(())
}

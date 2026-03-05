use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{Mint, Token, TokenAccount, Transfer, transfer};

use crate::constants::*;
use crate::curve::{calculate_sol_out, calculate_tokens_out};
use crate::error::RedCircleError;
use crate::state::{Config, Pool, PoolStatus};

/// Jupiter-compatible swap instruction
/// Supports both SOL -> Token (buy) and Token -> SOL (sell)
#[derive(Accounts)]
pub struct Swap<'info> {
    /// The user performing the swap
    #[account(mut)]
    pub user: Signer<'info>,

    /// Global protocol configuration
    #[account(
        mut,
        seeds = [CONFIG_SEED],
        bump = config.bump,
        constraint = !config.is_paused @ RedCircleError::ProtocolPaused
    )]
    pub config: Account<'info, Config>,

    /// The pool being traded
    #[account(
        mut,
        seeds = [POOL_SEED, pool.post_id.as_bytes()],
        bump = pool.bump,
        constraint = pool.is_tradeable() @ RedCircleError::PoolNotTradeable
    )]
    pub pool: Account<'info, Pool>,

    /// The token mint
    #[account(
        address = pool.token_mint @ RedCircleError::InvalidTokenMint
    )]
    pub token_mint: Account<'info, Mint>,

    /// Pool's token vault
    #[account(
        mut,
        associated_token::mint = token_mint,
        associated_token::authority = pool,
    )]
    pub pool_token_vault: Account<'info, TokenAccount>,

    /// Pool's SOL vault
    #[account(
        mut,
        seeds = [POOL_SOL_VAULT_SEED, pool.key().as_ref()],
        bump = pool.sol_vault_bump
    )]
    pub pool_sol_vault: SystemAccount<'info>,

    /// User's token account
    #[account(
        init_if_needed,
        payer = user,
        associated_token::mint = token_mint,
        associated_token::authority = user,
    )]
    pub user_token_account: Account<'info, TokenAccount>,

    /// Protocol treasury for platform fees
    /// CHECK: Validated against config
    #[account(
        mut,
        constraint = treasury.key() == config.treasury @ RedCircleError::InvalidAuthority
    )]
    pub treasury: UncheckedAccount<'info>,

    /// Curator of this pool (receives curator fees)
    /// CHECK: Validated against pool
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
    /// Amount of input token (SOL lamports or token amount)
    pub amount_in: u64,
    /// Minimum amount of output token expected (slippage protection)
    pub minimum_amount_out: u64,
    /// Direction: true = buy (SOL -> Token), false = sell (Token -> SOL)
    pub is_buy: bool,
}

pub fn swap_handler(mut ctx: Context<Swap>, params: SwapParams) -> Result<()> {
    require!(params.amount_in > 0, RedCircleError::ZeroAmount);
    require!(
        params.amount_in >= MIN_TRADE_AMOUNT,
        RedCircleError::TradeBelowMinimum
    );

    let pool = &mut ctx.accounts.pool;
    let config = &ctx.accounts.config;
    let clock = Clock::get()?;

    // Check launch protection
    if pool.status == PoolStatus::LaunchProtection {
        if clock.unix_timestamp >= pool.launch_protection_ends_at {
            // Launch protection ended, update status
            pool.status = PoolStatus::Active;
        } else if params.is_buy {
            // During protection, enforce max buy limit
            require!(
                params.amount_in <= config.max_buy_during_protection,
                RedCircleError::ExceedsLaunchProtectionLimit
            );
        }
    }

    if params.is_buy {
        execute_buy(&mut ctx, params)
    } else {
        execute_sell(&mut ctx, params)
    }
}

fn execute_buy(ctx: &mut Context<Swap>, params: SwapParams) -> Result<()> {
    // Calculate fee (3% of SOL input)
    let total_fee = params
        .amount_in
        .checked_mul(TOTAL_FEE_BPS)
        .ok_or(RedCircleError::MathOverflow)?
        .checked_div(BPS_DENOMINATOR)
        .ok_or(RedCircleError::DivisionByZero)?;

    let sol_after_fee = params
        .amount_in
        .checked_sub(total_fee)
        .ok_or(RedCircleError::MathUnderflow)?;

    // Calculate tokens out using bonding curve
    let tokens_out = calculate_tokens_out(
        ctx.accounts.pool.virtual_sol_reserve,
        ctx.accounts.pool.virtual_token_reserve,
        sol_after_fee,
        ctx.accounts.pool.curve_type,
    )?;

    // Check slippage
    require!(
        tokens_out >= params.minimum_amount_out,
        RedCircleError::SlippageExceeded
    );

    // Check pool has enough tokens
    require!(
        tokens_out <= ctx.accounts.pool.real_token_reserve,
        RedCircleError::InsufficientPoolTokens
    );

    // Calculate fee splits
    let platform_fee = total_fee
        .checked_mul(PLATFORM_FEE_BPS)
        .ok_or(RedCircleError::MathOverflow)?
        .checked_div(TOTAL_FEE_BPS)
        .ok_or(RedCircleError::DivisionByZero)?;

    let curator_fee = total_fee
        .checked_mul(CURATOR_FEE_BPS)
        .ok_or(RedCircleError::MathOverflow)?
        .checked_div(TOTAL_FEE_BPS)
        .ok_or(RedCircleError::DivisionByZero)?;

    let creator_fee = total_fee
        .checked_mul(CREATOR_FEE_BPS)
        .ok_or(RedCircleError::MathOverflow)?
        .checked_div(TOTAL_FEE_BPS)
        .ok_or(RedCircleError::DivisionByZero)?;

    // Inviter fee goes to treasury if no referral (simplified - referral handled separately)
    let inviter_fee = total_fee
        .checked_mul(INVITER_FEE_BPS)
        .ok_or(RedCircleError::MathOverflow)?
        .checked_div(TOTAL_FEE_BPS)
        .ok_or(RedCircleError::DivisionByZero)?;

    // Transfer SOL from user to pool vault (main amount + creator fee for later claim)
    anchor_lang::system_program::transfer(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::Transfer {
                from: ctx.accounts.user.to_account_info(),
                to: ctx.accounts.pool_sol_vault.to_account_info(),
            },
        ),
        sol_after_fee
            .checked_add(creator_fee)
            .ok_or(RedCircleError::MathOverflow)?,
    )?;

    // Transfer platform fee + inviter fee to treasury
    anchor_lang::system_program::transfer(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::Transfer {
                from: ctx.accounts.user.to_account_info(),
                to: ctx.accounts.treasury.to_account_info(),
            },
        ),
        platform_fee
            .checked_add(inviter_fee)
            .ok_or(RedCircleError::MathOverflow)?,
    )?;

    // Transfer curator fee
    anchor_lang::system_program::transfer(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::Transfer {
                from: ctx.accounts.user.to_account_info(),
                to: ctx.accounts.curator.to_account_info(),
            },
        ),
        curator_fee,
    )?;

    // Transfer tokens from pool to user
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
        tokens_out,
    )?;

    // Update pool state
    let pool = &mut ctx.accounts.pool;
    pool.virtual_sol_reserve = pool
        .virtual_sol_reserve
        .checked_add(sol_after_fee)
        .ok_or(RedCircleError::MathOverflow)?;
    pool.virtual_token_reserve = pool
        .virtual_token_reserve
        .checked_sub(tokens_out)
        .ok_or(RedCircleError::MathUnderflow)?;
    pool.real_sol_reserve = pool
        .real_sol_reserve
        .checked_add(sol_after_fee)
        .ok_or(RedCircleError::MathOverflow)?
        .checked_add(creator_fee)
        .ok_or(RedCircleError::MathOverflow)?;
    pool.real_token_reserve = pool
        .real_token_reserve
        .checked_sub(tokens_out)
        .ok_or(RedCircleError::MathUnderflow)?;
    pool.tokens_sold = pool
        .tokens_sold
        .checked_add(tokens_out)
        .ok_or(RedCircleError::MathOverflow)?;
    pool.total_volume = pool
        .total_volume
        .checked_add(params.amount_in as u128)
        .ok_or(RedCircleError::MathOverflow)?;
    pool.total_fees = pool
        .total_fees
        .checked_add(total_fee)
        .ok_or(RedCircleError::MathOverflow)?;
    pool.unclaimed_creator_fees = pool
        .unclaimed_creator_fees
        .checked_add(creator_fee)
        .ok_or(RedCircleError::MathOverflow)?;

    // Update global config
    let config = &mut ctx.accounts.config;
    config.total_volume = config
        .total_volume
        .checked_add(params.amount_in as u128)
        .ok_or(RedCircleError::MathOverflow)?;
    config.total_fees_collected = config
        .total_fees_collected
        .checked_add(total_fee as u128)
        .ok_or(RedCircleError::MathOverflow)?;

    msg!(
        "Buy executed: {} SOL -> {} tokens",
        params.amount_in,
        tokens_out
    );

    Ok(())
}

fn execute_sell(ctx: &mut Context<Swap>, params: SwapParams) -> Result<()> {
    // Calculate SOL out using bonding curve
    let sol_out_before_fee = calculate_sol_out(
        ctx.accounts.pool.virtual_sol_reserve,
        ctx.accounts.pool.virtual_token_reserve,
        params.amount_in,
        ctx.accounts.pool.curve_type,
    )?;

    // Calculate fee (3% of SOL output)
    let total_fee = sol_out_before_fee
        .checked_mul(TOTAL_FEE_BPS)
        .ok_or(RedCircleError::MathOverflow)?
        .checked_div(BPS_DENOMINATOR)
        .ok_or(RedCircleError::DivisionByZero)?;

    let sol_out = sol_out_before_fee
        .checked_sub(total_fee)
        .ok_or(RedCircleError::MathUnderflow)?;

    // Check slippage
    require!(
        sol_out >= params.minimum_amount_out,
        RedCircleError::SlippageExceeded
    );

    // Check pool has enough SOL
    require!(
        sol_out_before_fee <= ctx.accounts.pool.real_sol_reserve,
        RedCircleError::InsufficientPoolSol
    );

    // Calculate fee splits
    let platform_fee = total_fee
        .checked_mul(PLATFORM_FEE_BPS)
        .ok_or(RedCircleError::MathOverflow)?
        .checked_div(TOTAL_FEE_BPS)
        .ok_or(RedCircleError::DivisionByZero)?;

    let curator_fee = total_fee
        .checked_mul(CURATOR_FEE_BPS)
        .ok_or(RedCircleError::MathOverflow)?
        .checked_div(TOTAL_FEE_BPS)
        .ok_or(RedCircleError::DivisionByZero)?;

    let creator_fee = total_fee
        .checked_mul(CREATOR_FEE_BPS)
        .ok_or(RedCircleError::MathOverflow)?
        .checked_div(TOTAL_FEE_BPS)
        .ok_or(RedCircleError::DivisionByZero)?;

    let inviter_fee = total_fee
        .checked_mul(INVITER_FEE_BPS)
        .ok_or(RedCircleError::MathOverflow)?
        .checked_div(TOTAL_FEE_BPS)
        .ok_or(RedCircleError::DivisionByZero)?;

    // Transfer tokens from user to pool
    transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.user_token_account.to_account_info(),
                to: ctx.accounts.pool_token_vault.to_account_info(),
                authority: ctx.accounts.user.to_account_info(),
            },
        ),
        params.amount_in,
    )?;

    // Build sol vault PDA signer seeds
    let pool_key = ctx.accounts.pool.key();
    let sol_vault_bump = ctx.accounts.pool.sol_vault_bump;
    let sol_vault_seeds: &[&[u8]] = &[POOL_SOL_VAULT_SEED, pool_key.as_ref(), &[sol_vault_bump]];
    let sol_vault_signer = &[sol_vault_seeds];

    // Transfer SOL from pool vault to user
    anchor_lang::system_program::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::Transfer {
                from: ctx.accounts.pool_sol_vault.to_account_info(),
                to: ctx.accounts.user.to_account_info(),
            },
            sol_vault_signer,
        ),
        sol_out,
    )?;

    // Transfer platform + inviter fees to treasury
    let treasury_fee = platform_fee
        .checked_add(inviter_fee)
        .ok_or(RedCircleError::MathOverflow)?;
    if treasury_fee > 0 {
        anchor_lang::system_program::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.system_program.to_account_info(),
                anchor_lang::system_program::Transfer {
                    from: ctx.accounts.pool_sol_vault.to_account_info(),
                    to: ctx.accounts.treasury.to_account_info(),
                },
                sol_vault_signer,
            ),
            treasury_fee,
        )?;
    }

    // Transfer curator fee
    if curator_fee > 0 {
        anchor_lang::system_program::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.system_program.to_account_info(),
                anchor_lang::system_program::Transfer {
                    from: ctx.accounts.pool_sol_vault.to_account_info(),
                    to: ctx.accounts.curator.to_account_info(),
                },
                sol_vault_signer,
            ),
            curator_fee,
        )?;
    }

    // Update pool state
    let pool = &mut ctx.accounts.pool;
    pool.virtual_sol_reserve = pool
        .virtual_sol_reserve
        .checked_sub(sol_out_before_fee)
        .ok_or(RedCircleError::MathUnderflow)?;
    pool.virtual_token_reserve = pool
        .virtual_token_reserve
        .checked_add(params.amount_in)
        .ok_or(RedCircleError::MathOverflow)?;
    pool.real_sol_reserve = pool
        .real_sol_reserve
        .checked_sub(sol_out_before_fee)
        .ok_or(RedCircleError::MathUnderflow)?
        .checked_add(creator_fee)
        .ok_or(RedCircleError::MathOverflow)?;
    pool.real_token_reserve = pool
        .real_token_reserve
        .checked_add(params.amount_in)
        .ok_or(RedCircleError::MathOverflow)?;
    pool.tokens_sold = pool
        .tokens_sold
        .checked_sub(params.amount_in)
        .ok_or(RedCircleError::MathUnderflow)?;
    pool.total_volume = pool
        .total_volume
        .checked_add(sol_out_before_fee as u128)
        .ok_or(RedCircleError::MathOverflow)?;
    pool.total_fees = pool
        .total_fees
        .checked_add(total_fee)
        .ok_or(RedCircleError::MathOverflow)?;
    pool.unclaimed_creator_fees = pool
        .unclaimed_creator_fees
        .checked_add(creator_fee)
        .ok_or(RedCircleError::MathOverflow)?;

    // Update global config
    let config = &mut ctx.accounts.config;
    config.total_volume = config
        .total_volume
        .checked_add(sol_out_before_fee as u128)
        .ok_or(RedCircleError::MathOverflow)?;
    config.total_fees_collected = config
        .total_fees_collected
        .checked_add(total_fee as u128)
        .ok_or(RedCircleError::MathOverflow)?;

    msg!(
        "Sell executed: {} tokens -> {} SOL",
        params.amount_in,
        sol_out
    );

    Ok(())
}

use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{Mint, Token, TokenAccount, Transfer, transfer};

use crate::constants::*;
use crate::curve::{calculate_sol_out, calculate_tokens_out};
use crate::error::RedCircleError;
use crate::state::{Config, Pool, PoolStatus};

/// Simplified buy instruction (SOL -> Token)
/// This is a convenience wrapper that's easier to use than swap
#[derive(Accounts)]
pub struct Buy<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [CONFIG_SEED],
        bump = config.bump,
        constraint = !config.is_paused @ RedCircleError::ProtocolPaused
    )]
    pub config: Account<'info, Config>,

    #[account(
        mut,
        seeds = [POOL_SEED, pool.reddit_post_id.as_bytes()],
        bump = pool.bump,
        constraint = pool.is_tradeable() @ RedCircleError::PoolNotTradeable
    )]
    pub pool: Account<'info, Pool>,

    #[account(address = pool.token_mint @ RedCircleError::InvalidTokenMint)]
    pub token_mint: Account<'info, Mint>,

    #[account(
        mut,
        associated_token::mint = token_mint,
        associated_token::authority = pool,
    )]
    pub pool_token_vault: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [POOL_SOL_VAULT_SEED, pool.key().as_ref()],
        bump = pool.sol_vault_bump
    )]
    pub pool_sol_vault: SystemAccount<'info>,

    #[account(
        init_if_needed,
        payer = user,
        associated_token::mint = token_mint,
        associated_token::authority = user,
    )]
    pub user_token_account: Account<'info, TokenAccount>,

    /// CHECK: Validated against config
    #[account(mut, constraint = treasury.key() == config.treasury @ RedCircleError::InvalidAuthority)]
    pub treasury: UncheckedAccount<'info>,

    /// CHECK: Validated against pool
    #[account(mut, constraint = curator.key() == pool.curator @ RedCircleError::InvalidAuthority)]
    pub curator: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct BuyParams {
    /// Amount of SOL to spend (in lamports)
    pub sol_amount: u64,
    /// Minimum tokens expected (slippage protection)
    pub min_tokens_out: u64,
}

pub fn buy_handler(ctx: Context<Buy>, params: BuyParams) -> Result<()> {
    require!(params.sol_amount > 0, RedCircleError::ZeroAmount);
    require!(
        params.sol_amount >= MIN_TRADE_AMOUNT,
        RedCircleError::TradeBelowMinimum
    );

    let pool = &mut ctx.accounts.pool;
    let config = &mut ctx.accounts.config;
    let clock = Clock::get()?;

    // Check launch protection
    if pool.status == PoolStatus::LaunchProtection {
        if clock.unix_timestamp >= pool.launch_protection_ends_at {
            pool.status = PoolStatus::Active;
        } else {
            require!(
                params.sol_amount <= config.max_buy_during_protection,
                RedCircleError::ExceedsLaunchProtectionLimit
            );
        }
    }

    // Calculate fee
    let total_fee = params
        .sol_amount
        .checked_mul(TOTAL_FEE_BPS)
        .ok_or(RedCircleError::MathOverflow)?
        .checked_div(BPS_DENOMINATOR)
        .ok_or(RedCircleError::DivisionByZero)?;

    let sol_after_fee = params
        .sol_amount
        .checked_sub(total_fee)
        .ok_or(RedCircleError::MathUnderflow)?;

    // Calculate tokens out
    let tokens_out = calculate_tokens_out(
        pool.virtual_sol_reserve,
        pool.virtual_token_reserve,
        sol_after_fee,
        pool.curve_type,
    )?;

    require!(
        tokens_out >= params.min_tokens_out,
        RedCircleError::SlippageExceeded
    );
    require!(
        tokens_out <= pool.real_token_reserve,
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

    let inviter_fee = total_fee
        .checked_mul(INVITER_FEE_BPS)
        .ok_or(RedCircleError::MathOverflow)?
        .checked_div(TOTAL_FEE_BPS)
        .ok_or(RedCircleError::DivisionByZero)?;

    // Transfer SOL to pool vault
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
            .ok_or(RedCircleError::MathOverflow)?, // Creator fee stays in pool vault
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

    // Transfer tokens to user
    let reddit_post_id = pool.reddit_post_id.clone();
    let pool_bump = pool.bump;
    let seeds = &[POOL_SEED, reddit_post_id.as_bytes(), &[pool_bump]];
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
        .checked_add(params.sol_amount as u128)
        .ok_or(RedCircleError::MathOverflow)?;
    pool.total_fees = pool
        .total_fees
        .checked_add(total_fee)
        .ok_or(RedCircleError::MathOverflow)?;
    pool.unclaimed_creator_fees = pool
        .unclaimed_creator_fees
        .checked_add(creator_fee)
        .ok_or(RedCircleError::MathOverflow)?;

    // Update global stats
    config.total_volume = config
        .total_volume
        .checked_add(params.sol_amount as u128)
        .ok_or(RedCircleError::MathOverflow)?;
    config.total_fees_collected = config
        .total_fees_collected
        .checked_add(total_fee as u128)
        .ok_or(RedCircleError::MathOverflow)?;

    msg!("Buy: {} SOL -> {} tokens", params.sol_amount, tokens_out);

    Ok(())
}

/// Simplified sell instruction (Token -> SOL)
#[derive(Accounts)]
pub struct Sell<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [CONFIG_SEED],
        bump = config.bump,
        constraint = !config.is_paused @ RedCircleError::ProtocolPaused
    )]
    pub config: Account<'info, Config>,

    #[account(
        mut,
        seeds = [POOL_SEED, pool.reddit_post_id.as_bytes()],
        bump = pool.bump,
        constraint = pool.is_tradeable() @ RedCircleError::PoolNotTradeable
    )]
    pub pool: Account<'info, Pool>,

    #[account(address = pool.token_mint @ RedCircleError::InvalidTokenMint)]
    pub token_mint: Account<'info, Mint>,

    #[account(
        mut,
        associated_token::mint = token_mint,
        associated_token::authority = pool,
    )]
    pub pool_token_vault: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [POOL_SOL_VAULT_SEED, pool.key().as_ref()],
        bump = pool.sol_vault_bump
    )]
    pub pool_sol_vault: SystemAccount<'info>,

    #[account(
        mut,
        associated_token::mint = token_mint,
        associated_token::authority = user,
    )]
    pub user_token_account: Account<'info, TokenAccount>,

    /// CHECK: Validated against config
    #[account(mut, constraint = treasury.key() == config.treasury @ RedCircleError::InvalidAuthority)]
    pub treasury: UncheckedAccount<'info>,

    /// CHECK: Validated against pool
    #[account(mut, constraint = curator.key() == pool.curator @ RedCircleError::InvalidAuthority)]
    pub curator: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct SellParams {
    /// Amount of tokens to sell
    pub token_amount: u64,
    /// Minimum SOL expected (slippage protection)
    pub min_sol_out: u64,
}

pub fn sell_handler(ctx: Context<Sell>, params: SellParams) -> Result<()> {
    require!(params.token_amount > 0, RedCircleError::ZeroAmount);

    let pool = &mut ctx.accounts.pool;
    let config = &mut ctx.accounts.config;

    // Calculate SOL out
    let sol_out_before_fee = calculate_sol_out(
        pool.virtual_sol_reserve,
        pool.virtual_token_reserve,
        params.token_amount,
        pool.curve_type,
    )?;

    // Calculate fee
    let total_fee = sol_out_before_fee
        .checked_mul(TOTAL_FEE_BPS)
        .ok_or(RedCircleError::MathOverflow)?
        .checked_div(BPS_DENOMINATOR)
        .ok_or(RedCircleError::DivisionByZero)?;

    let sol_out = sol_out_before_fee
        .checked_sub(total_fee)
        .ok_or(RedCircleError::MathUnderflow)?;

    require!(
        sol_out >= params.min_sol_out,
        RedCircleError::SlippageExceeded
    );
    require!(
        sol_out_before_fee <= pool.real_sol_reserve,
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
        params.token_amount,
    )?;

    // Calculate total to withdraw
    let total_withdraw = sol_out
        .checked_add(platform_fee)
        .ok_or(RedCircleError::MathOverflow)?
        .checked_add(curator_fee)
        .ok_or(RedCircleError::MathOverflow)?
        .checked_add(inviter_fee)
        .ok_or(RedCircleError::MathOverflow)?;

    // Transfer SOL from pool vault
    **ctx.accounts.pool_sol_vault.try_borrow_mut_lamports()? = ctx
        .accounts
        .pool_sol_vault
        .lamports()
        .checked_sub(total_withdraw)
        .ok_or(RedCircleError::MathUnderflow)?;

    **ctx.accounts.user.try_borrow_mut_lamports()? = ctx
        .accounts
        .user
        .lamports()
        .checked_add(sol_out)
        .ok_or(RedCircleError::MathOverflow)?;

    // Transfer fees
    **ctx.accounts.treasury.try_borrow_mut_lamports()? = ctx
        .accounts
        .treasury
        .lamports()
        .checked_add(
            platform_fee
                .checked_add(inviter_fee)
                .ok_or(RedCircleError::MathOverflow)?,
        )
        .ok_or(RedCircleError::MathOverflow)?;

    **ctx.accounts.curator.try_borrow_mut_lamports()? = ctx
        .accounts
        .curator
        .lamports()
        .checked_add(curator_fee)
        .ok_or(RedCircleError::MathOverflow)?;

    // Update pool state
    pool.virtual_sol_reserve = pool
        .virtual_sol_reserve
        .checked_sub(sol_out_before_fee)
        .ok_or(RedCircleError::MathUnderflow)?;
    pool.virtual_token_reserve = pool
        .virtual_token_reserve
        .checked_add(params.token_amount)
        .ok_or(RedCircleError::MathOverflow)?;
    pool.real_sol_reserve = pool
        .real_sol_reserve
        .checked_sub(sol_out_before_fee)
        .ok_or(RedCircleError::MathUnderflow)?
        .checked_add(creator_fee)
        .ok_or(RedCircleError::MathOverflow)?;
    pool.real_token_reserve = pool
        .real_token_reserve
        .checked_add(params.token_amount)
        .ok_or(RedCircleError::MathOverflow)?;
    pool.tokens_sold = pool
        .tokens_sold
        .checked_sub(params.token_amount)
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

    // Update global stats
    config.total_volume = config
        .total_volume
        .checked_add(sol_out_before_fee as u128)
        .ok_or(RedCircleError::MathOverflow)?;
    config.total_fees_collected = config
        .total_fees_collected
        .checked_add(total_fee as u128)
        .ok_or(RedCircleError::MathOverflow)?;

    msg!("Sell: {} tokens -> {} SOL", params.token_amount, sol_out);

    Ok(())
}

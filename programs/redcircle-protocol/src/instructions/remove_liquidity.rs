use anchor_lang::prelude::*;
use anchor_spl::token::{transfer, Mint, Token, TokenAccount, Transfer};

use crate::constants::*;
use crate::error::RedCircleError;
use crate::state::{Bin, Config, MarketState, Pool, PoolModel};

#[derive(Accounts)]
pub struct RemoveLiquidity<'info> {
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
        mut,
        seeds = [BIN_SEED, pool.key().as_ref(), &bin.bin_id.to_le_bytes()],
        bump = bin.bump,
        constraint = bin.pool == pool.key() @ RedCircleError::InvalidDlmmBin
    )]
    pub bin: Account<'info, Bin>,

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
        associated_token::authority = authority,
    )]
    pub authority_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct RemoveLiquidityParams {
    pub token_amount: u64,
    pub sol_amount: u64,
}

pub fn remove_liquidity_handler(
    ctx: Context<RemoveLiquidity>,
    params: RemoveLiquidityParams,
) -> Result<()> {
    let authority = ctx.accounts.authority.key();
    require!(
        authority == ctx.accounts.config.admin || authority == ctx.accounts.pool.curator,
        RedCircleError::Unauthorized
    );
    require!(
        params.token_amount > 0 || params.sol_amount > 0,
        RedCircleError::ZeroAmount
    );
    require!(
        params.token_amount <= ctx.accounts.bin.token_liquidity,
        RedCircleError::InsufficientBinLiquidity
    );
    require!(
        params.sol_amount <= ctx.accounts.bin.sol_liquidity,
        RedCircleError::InsufficientBinLiquidity
    );
    require!(
        params.token_amount <= ctx.accounts.pool.liquidity_token_reserve,
        RedCircleError::InsufficientPoolTokens
    );
    require!(
        params.sol_amount <= ctx.accounts.pool.liquidity_sol_reserve,
        RedCircleError::InsufficientPoolSol
    );

    let post_id = ctx.accounts.pool.post_id.clone();
    let pool_bump = ctx.accounts.pool.bump;
    let pool_seeds = &[POOL_SEED, post_id.as_bytes(), &[pool_bump]];
    let pool_signer = &[&pool_seeds[..]];

    if params.token_amount > 0 {
        transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.pool_token_vault.to_account_info(),
                    to: ctx.accounts.authority_token_account.to_account_info(),
                    authority: ctx.accounts.pool.to_account_info(),
                },
                pool_signer,
            ),
            params.token_amount,
        )?;

        ctx.accounts.bin.token_liquidity = ctx
            .accounts
            .bin
            .token_liquidity
            .checked_sub(params.token_amount)
            .ok_or(RedCircleError::MathUnderflow)?;
        ctx.accounts.pool.liquidity_token_reserve = ctx
            .accounts
            .pool
            .liquidity_token_reserve
            .checked_sub(params.token_amount)
            .ok_or(RedCircleError::MathUnderflow)?;
        ctx.accounts.market_state.allocated_token_liquidity = ctx
            .accounts
            .market_state
            .allocated_token_liquidity
            .checked_sub(params.token_amount)
            .ok_or(RedCircleError::MathUnderflow)?;
    }

    if params.sol_amount > 0 {
        let pool_key = ctx.accounts.pool.key();
        let sol_vault_bump = ctx.accounts.pool.sol_vault_bump;
        let sol_seeds: &[&[u8]] = &[POOL_SOL_VAULT_SEED, pool_key.as_ref(), &[sol_vault_bump]];
        let sol_signer = &[sol_seeds];

        anchor_lang::system_program::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.system_program.to_account_info(),
                anchor_lang::system_program::Transfer {
                    from: ctx.accounts.pool_sol_vault.to_account_info(),
                    to: ctx.accounts.authority.to_account_info(),
                },
                sol_signer,
            ),
            params.sol_amount,
        )?;

        ctx.accounts.bin.sol_liquidity = ctx
            .accounts
            .bin
            .sol_liquidity
            .checked_sub(params.sol_amount)
            .ok_or(RedCircleError::MathUnderflow)?;
        ctx.accounts.pool.liquidity_sol_reserve = ctx
            .accounts
            .pool
            .liquidity_sol_reserve
            .checked_sub(params.sol_amount)
            .ok_or(RedCircleError::MathUnderflow)?;
        ctx.accounts.market_state.allocated_sol_liquidity = ctx
            .accounts
            .market_state
            .allocated_sol_liquidity
            .checked_sub(params.sol_amount)
            .ok_or(RedCircleError::MathUnderflow)?;
    }

    msg!(
        "Removed liquidity from bin {}: {} tokens, {} lamports",
        ctx.accounts.bin.bin_id,
        params.token_amount,
        params.sol_amount
    );

    Ok(())
}

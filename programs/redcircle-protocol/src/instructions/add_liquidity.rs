use anchor_lang::prelude::*;
use anchor_spl::token::{transfer, Mint, Token, TokenAccount, Transfer};

use crate::constants::*;
use crate::error::RedCircleError;
use crate::state::{Bin, Config, MarketState, Pool, PoolModel};

#[derive(Accounts)]
pub struct AddLiquidity<'info> {
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
pub struct AddLiquidityParams {
    pub token_amount: u64,
    pub sol_amount: u64,
}

pub fn add_liquidity_handler(ctx: Context<AddLiquidity>, params: AddLiquidityParams) -> Result<()> {
    let authority = ctx.accounts.authority.key();
    require!(
        authority == ctx.accounts.config.admin || authority == ctx.accounts.pool.curator,
        RedCircleError::Unauthorized
    );
    require!(
        params.token_amount > 0 || params.sol_amount > 0,
        RedCircleError::ZeroAmount
    );

    if params.token_amount > 0 {
        transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.authority_token_account.to_account_info(),
                    to: ctx.accounts.pool_token_vault.to_account_info(),
                    authority: ctx.accounts.authority.to_account_info(),
                },
            ),
            params.token_amount,
        )?;

        ctx.accounts.bin.token_liquidity = ctx
            .accounts
            .bin
            .token_liquidity
            .checked_add(params.token_amount)
            .ok_or(RedCircleError::MathOverflow)?;
        ctx.accounts.pool.liquidity_token_reserve = ctx
            .accounts
            .pool
            .liquidity_token_reserve
            .checked_add(params.token_amount)
            .ok_or(RedCircleError::MathOverflow)?;
        ctx.accounts.market_state.allocated_token_liquidity = ctx
            .accounts
            .market_state
            .allocated_token_liquidity
            .checked_add(params.token_amount)
            .ok_or(RedCircleError::MathOverflow)?;
    }

    if params.sol_amount > 0 {
        anchor_lang::system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                anchor_lang::system_program::Transfer {
                    from: ctx.accounts.authority.to_account_info(),
                    to: ctx.accounts.pool_sol_vault.to_account_info(),
                },
            ),
            params.sol_amount,
        )?;

        ctx.accounts.bin.sol_liquidity = ctx
            .accounts
            .bin
            .sol_liquidity
            .checked_add(params.sol_amount)
            .ok_or(RedCircleError::MathOverflow)?;
        ctx.accounts.pool.liquidity_sol_reserve = ctx
            .accounts
            .pool
            .liquidity_sol_reserve
            .checked_add(params.sol_amount)
            .ok_or(RedCircleError::MathOverflow)?;
        ctx.accounts.market_state.allocated_sol_liquidity = ctx
            .accounts
            .market_state
            .allocated_sol_liquidity
            .checked_add(params.sol_amount)
            .ok_or(RedCircleError::MathOverflow)?;
    }

    msg!(
        "Added liquidity to bin {}: {} tokens, {} lamports",
        ctx.accounts.bin.bin_id,
        params.token_amount,
        params.sol_amount
    );

    Ok(())
}

use anchor_lang::prelude::*;

use crate::constants::*;
use crate::error::RedCircleError;
use crate::state::{Pool, InviterStats};

/// Claim creator fees from a pool
/// Only callable by the verified creator (post author)
#[derive(Accounts)]
pub struct ClaimCreatorFees<'info> {
    /// The creator claiming fees (must be verified)
    #[account(mut)]
    pub creator: Signer<'info>,

    /// The pool to claim from
    #[account(
        mut,
        seeds = [POOL_SEED, pool.post_id.as_bytes()],
        bump = pool.bump,
        constraint = pool.creator == creator.key() @ RedCircleError::Unauthorized
    )]
    pub pool: Account<'info, Pool>,

    /// Pool's SOL vault
    #[account(
        mut,
        seeds = [POOL_SOL_VAULT_SEED, pool.key().as_ref()],
        bump = pool.sol_vault_bump
    )]
    pub pool_sol_vault: SystemAccount<'info>,

    pub system_program: Program<'info, System>,
}

pub fn claim_creator_fees_handler(ctx: Context<ClaimCreatorFees>) -> Result<()> {
    let pool = &mut ctx.accounts.pool;

    let claimable = pool.unclaimed_creator_fees;
    require!(claimable > 0, RedCircleError::NoFeesToClaim);

    // Build sol vault PDA signer seeds
    let pool_key = pool.key();
    let sol_vault_bump = pool.sol_vault_bump;
    let sol_vault_seeds: &[&[u8]] = &[POOL_SOL_VAULT_SEED, pool_key.as_ref(), &[sol_vault_bump]];
    let sol_vault_signer = &[sol_vault_seeds];

    // Transfer SOL from pool vault to creator via CPI
    anchor_lang::system_program::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::Transfer {
                from: ctx.accounts.pool_sol_vault.to_account_info(),
                to: ctx.accounts.creator.to_account_info(),
            },
            sol_vault_signer,
        ),
        claimable,
    )?;

    // Reset unclaimed fees
    pool.unclaimed_creator_fees = 0;

    msg!("Creator claimed {} lamports in fees", claimable);

    Ok(())
}

/// Claim curator fees from a pool
#[derive(Accounts)]
pub struct ClaimCuratorFees<'info> {
    /// The curator claiming fees
    #[account(mut)]
    pub curator: Signer<'info>,

    /// The pool to claim from
    #[account(
        mut,
        seeds = [POOL_SEED, pool.post_id.as_bytes()],
        bump = pool.bump,
        constraint = pool.curator == curator.key() @ RedCircleError::Unauthorized
    )]
    pub pool: Account<'info, Pool>,

    /// Pool's SOL vault
    #[account(
        mut,
        seeds = [POOL_SOL_VAULT_SEED, pool.key().as_ref()],
        bump = pool.sol_vault_bump
    )]
    pub pool_sol_vault: SystemAccount<'info>,

    pub system_program: Program<'info, System>,
}

pub fn claim_curator_fees_handler(ctx: Context<ClaimCuratorFees>) -> Result<()> {
    let pool = &mut ctx.accounts.pool;

    let claimable = pool.unclaimed_curator_fees;
    require!(claimable > 0, RedCircleError::NoFeesToClaim);

    // Build sol vault PDA signer seeds
    let pool_key = pool.key();
    let sol_vault_bump = pool.sol_vault_bump;
    let sol_vault_seeds: &[&[u8]] = &[POOL_SOL_VAULT_SEED, pool_key.as_ref(), &[sol_vault_bump]];
    let sol_vault_signer = &[sol_vault_seeds];

    // Transfer SOL from pool vault to curator via CPI
    anchor_lang::system_program::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::Transfer {
                from: ctx.accounts.pool_sol_vault.to_account_info(),
                to: ctx.accounts.curator.to_account_info(),
            },
            sol_vault_signer,
        ),
        claimable,
    )?;

    // Reset unclaimed fees
    pool.unclaimed_curator_fees = 0;

    msg!("Curator claimed {} lamports in fees", claimable);

    Ok(())
}

/// Claim inviter fees
#[derive(Accounts)]
pub struct ClaimInviterFees<'info> {
    /// The inviter claiming fees
    #[account(mut)]
    pub inviter: Signer<'info>,

    /// Inviter's stats account
    #[account(
        mut,
        seeds = [b"inviter_stats", inviter.key().as_ref()],
        bump = inviter_stats.bump,
        constraint = inviter_stats.inviter == inviter.key() @ RedCircleError::Unauthorized
    )]
    pub inviter_stats: Account<'info, InviterStats>,

    /// Fee vault that holds accumulated inviter fees
    /// CHECK: PDA that holds fees
    #[account(
        mut,
        seeds = [FEE_VAULT_SEED],
        bump
    )]
    pub fee_vault: SystemAccount<'info>,

    pub system_program: Program<'info, System>,
}

pub fn claim_inviter_fees_handler(ctx: Context<ClaimInviterFees>) -> Result<()> {
    let inviter_stats = &mut ctx.accounts.inviter_stats;

    let claimable = inviter_stats.unclaimed_fees;
    require!(claimable > 0, RedCircleError::NoFeesToClaim);

    // Build fee vault PDA signer seeds
    let fee_vault_bump = ctx.bumps.fee_vault;
    let fee_vault_seeds: &[&[u8]] = &[FEE_VAULT_SEED, &[fee_vault_bump]];
    let fee_vault_signer = &[fee_vault_seeds];

    // Transfer SOL from fee vault to inviter via CPI
    anchor_lang::system_program::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::Transfer {
                from: ctx.accounts.fee_vault.to_account_info(),
                to: ctx.accounts.inviter.to_account_info(),
            },
            fee_vault_signer,
        ),
        claimable,
    )?;

    // Reset unclaimed fees
    inviter_stats.unclaimed_fees = 0;

    msg!("Inviter claimed {} lamports in fees", claimable);

    Ok(())
}

/// Set/verify the creator for a pool
/// This allows post authors to claim their creator fees
#[derive(Accounts)]
pub struct SetCreator<'info> {
    /// Admin or authorized verifier
    #[account(mut)]
    pub authority: Signer<'info>,

    /// The pool to update
    #[account(
        mut,
        seeds = [POOL_SEED, pool.post_id.as_bytes()],
        bump = pool.bump
    )]
    pub pool: Account<'info, Pool>,

    /// Global config to verify authority
    #[account(
        seeds = [CONFIG_SEED],
        bump = config.bump,
        constraint = config.admin == authority.key() @ RedCircleError::Unauthorized
    )]
    pub config: Account<'info, crate::state::Config>,

    /// The creator wallet to set
    /// CHECK: Will be stored as creator
    pub creator: UncheckedAccount<'info>,
}

pub fn set_creator_handler(ctx: Context<SetCreator>) -> Result<()> {
    let pool = &mut ctx.accounts.pool;

    pool.creator = ctx.accounts.creator.key();

    msg!(
        "Creator set for pool {}: {}",
        pool.post_id,
        pool.creator
    );

    Ok(())
}

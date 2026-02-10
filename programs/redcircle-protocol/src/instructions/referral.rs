use anchor_lang::prelude::*;

use crate::constants::REFERRAL_SEED;
use crate::error::RedCircleError;
use crate::state::{InviterStats, Referral};

/// Register a referral relationship
/// A user registers with an inviter (referrer)
#[derive(Accounts)]
pub struct RegisterReferral<'info> {
    /// The user registering the referral
    #[account(mut)]
    pub user: Signer<'info>,

    /// The inviter (referrer) who invited this user
    /// CHECK: This is just a wallet address
    pub inviter: UncheckedAccount<'info>,

    /// User's referral account (to be created)
    #[account(
        init,
        payer = user,
        space = Referral::SIZE,
        seeds = [REFERRAL_SEED, user.key().as_ref()],
        bump
    )]
    pub referral: Account<'info, Referral>,

    /// Inviter's stats account (create if doesn't exist)
    #[account(
        init_if_needed,
        payer = user,
        space = InviterStats::SIZE,
        seeds = [b"inviter_stats", inviter.key().as_ref()],
        bump
    )]
    pub inviter_stats: Account<'info, InviterStats>,

    pub system_program: Program<'info, System>,
}

pub fn register_referral_handler(ctx: Context<RegisterReferral>) -> Result<()> {
    let user_key = ctx.accounts.user.key();
    let inviter_key = ctx.accounts.inviter.key();

    // Cannot refer yourself
    require!(user_key != inviter_key, RedCircleError::SelfReferral);

    let clock = Clock::get()?;
    let referral = &mut ctx.accounts.referral;
    let inviter_stats = &mut ctx.accounts.inviter_stats;

    // Initialize referral
    referral.user = user_key;
    referral.inviter = inviter_key;
    referral.total_fees_generated = 0;
    referral.registered_at = clock.unix_timestamp;
    referral.total_volume = 0;
    referral.trade_count = 0;
    referral.bump = ctx.bumps.referral;

    // Update inviter stats
    if inviter_stats.inviter == Pubkey::default() {
        // First time initialization
        inviter_stats.inviter = inviter_key;
        inviter_stats.first_referral_at = clock.unix_timestamp;
        inviter_stats.bump = ctx.bumps.inviter_stats;
    }

    inviter_stats.total_referrals = inviter_stats
        .total_referrals
        .checked_add(1)
        .ok_or(RedCircleError::MathOverflow)?;

    msg!(
        "Referral registered: {} referred by {}",
        user_key,
        inviter_key
    );

    Ok(())
}

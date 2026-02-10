use anchor_lang::prelude::*;

/// Referral account tracking inviter relationships
/// PDA Seed: ["referral", user_wallet.as_bytes()]
#[account]
#[derive(InitSpace)]
pub struct Referral {
    pub user: Pubkey,
    pub inviter: Pubkey,
    pub total_fees_generated: u64,
    pub registered_at: i64,
    pub total_volume: u128,
    pub trade_count: u64,
    pub bump: u8,
    #[max_len(16)]
    pub _reserved: Vec<u8>,
}

impl Referral {
    pub const SIZE: usize = 8 + // discriminator
        32 + // user
        32 + // inviter
        8 +  // total_fees_generated
        8 +  // registered_at
        16 + // total_volume
        8 +  // trade_count
        1 +  // bump
        4 + 16; // reserved
}

/// Inviter stats account tracking referral performance
/// PDA Seed: ["inviter_stats", inviter_wallet.as_bytes()]
#[account]
#[derive(InitSpace)]
pub struct InviterStats {
    pub inviter: Pubkey,
    pub total_referrals: u64,
    pub total_fees_earned: u64,
    pub unclaimed_fees: u64,
    pub total_referral_volume: u128,
    pub first_referral_at: i64,
    pub bump: u8,
    #[max_len(16)]
    pub _reserved: Vec<u8>,
}

impl InviterStats {
    pub const SIZE: usize = 8 + // discriminator
        32 + // inviter
        8 +  // total_referrals
        8 +  // total_fees_earned
        8 +  // unclaimed_fees
        16 + // total_referral_volume
        8 +  // first_referral_at
        1 +  // bump
        4 + 16; // reserved
}

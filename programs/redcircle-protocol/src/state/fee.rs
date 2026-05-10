use anchor_lang::prelude::*;

/// Optional aggregate fee state for future DLMM fee-growth accounting.
#[account]
#[derive(InitSpace)]
pub struct FeeState {
    pub pool: Pubkey,
    pub accrued_platform_fees: u64,
    pub accrued_creator_fees: u64,
    pub accrued_curator_fees: u64,
    pub accrued_growth_fees: u64,
    pub bump: u8,
    #[max_len(32)]
    pub _reserved: Vec<u8>,
}

impl FeeState {
    pub const SIZE: usize = 8 + Self::INIT_SPACE;
}

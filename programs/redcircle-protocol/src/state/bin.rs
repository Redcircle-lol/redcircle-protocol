use anchor_lang::prelude::*;

/// DLMM bin for a post pool.
/// PDA Seed: ["bin", pool, bin_id.to_le_bytes()]
#[account]
#[derive(InitSpace)]
pub struct Bin {
    pub pool: Pubkey,
    pub bin_id: i32,
    pub price_lamports_per_token: u64,
    pub token_liquidity: u64,
    pub sol_liquidity: u64,
    pub fee_growth_sol: u128,
    pub fee_growth_token: u128,
    pub bump: u8,
    #[max_len(32)]
    pub _reserved: Vec<u8>,
}

impl Bin {
    pub const SIZE: usize = 8 + Self::INIT_SPACE;
}

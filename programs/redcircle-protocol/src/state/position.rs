use anchor_lang::prelude::*;

/// Curator/admin managed DLMM position scaffold.
/// PDA Seed: ["position", pool, owner]
#[account]
#[derive(InitSpace)]
pub struct Position {
    pub pool: Pubkey,
    pub owner: Pubkey,
    pub lower_bin_id: i32,
    pub upper_bin_id: i32,
    pub token_liquidity: u64,
    pub sol_liquidity: u64,
    pub bump: u8,
    #[max_len(32)]
    pub _reserved: Vec<u8>,
}

impl Position {
    pub const SIZE: usize = 8 + Self::INIT_SPACE;
}

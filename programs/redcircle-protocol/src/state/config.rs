use anchor_lang::prelude::*;

/// Global protocol configuration
/// PDA Seed: ["config"]
#[account]
#[derive(InitSpace)]
pub struct Config {
    pub admin: Pubkey,
    pub treasury: Pubkey,
    pub is_paused: bool,
    pub total_pools: u64,
    pub total_volume: u128,
    pub total_fees_collected: u128,
    pub default_initial_virtual_sol: u64,
    pub default_initial_virtual_token: u64,
    pub pool_creation_fee: u64,
    pub launch_protection_duration: i64,
    pub max_buy_during_protection: u64,
    pub bump: u8,
    #[max_len(64)]
    pub _reserved: Vec<u8>,
}

impl Config {
    pub const SIZE: usize = 8 + // discriminator
        32 + // admin
        32 + // treasury
        1 +  // is_paused
        8 +  // total_pools
        16 + // total_volume
        16 + // total_fees_collected
        8 +  // default_initial_virtual_sol
        8 +  // default_initial_virtual_token
        8 +  // pool_creation_fee
        8 +  // launch_protection_duration
        8 +  // max_buy_during_protection
        1 +  // bump
        4 + 64; // reserved vec
}

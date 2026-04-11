use anchor_lang::prelude::*;

use crate::constants::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum CurveType {
    ConstantProduct,
    Linear,
    Exponential,
}

impl Default for CurveType {
    fn default() -> Self {
        CurveType::ConstantProduct
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace, Default)]
pub enum PoolStatus {
    #[default]
    Active,
    LaunchProtection,
    Paused,
}

/// Red Post Pool - represents a tokenized post
/// PDA Seed: ["pool", post_id.as_bytes()]
#[account]
#[derive(InitSpace)]
pub struct Pool {
    #[max_len(16)]
    pub post_id: String,
    pub token_mint: Pubkey,
    pub curator: Pubkey,
    pub creator: Pubkey,
    pub status: PoolStatus,
    pub curve_type: CurveType,
    pub virtual_sol_reserve: u64,
    pub virtual_token_reserve: u64,
    pub real_sol_reserve: u64,
    pub real_token_reserve: u64,
    pub tokens_sold: u64,
    pub token_supply: u64,
    pub total_volume: u128,
    pub total_fees: u64,
    pub unclaimed_creator_fees: u64,
    pub unclaimed_curator_fees: u64,
    pub created_at: i64,
    pub launch_protection_ends_at: i64,
    pub bump: u8,
    pub token_vault_bump: u8,
    pub sol_vault_bump: u8,
    #[max_len(32)]
    pub name: String,
    #[max_len(10)]
    pub symbol: String,
    #[max_len(200)]
    pub uri: String,
    #[max_len(32)]
    pub _reserved: Vec<u8>,
}

impl Pool {
    pub const SIZE: usize = 8 + // discriminator
        4 + MAX_POST_ID_LEN + // post_id
        32 + // token_mint
        32 + // curator
        32 + // creator
        1 +  // status
        1 +  // curve_type
        8 +  // virtual_sol_reserve
        8 +  // virtual_token_reserve
        8 +  // real_sol_reserve
        8 +  // real_token_reserve
        8 +  // tokens_sold
        8 +  // token_supply
        16 + // total_volume
        8 +  // total_fees
        8 +  // unclaimed_creator_fees
        8 +  // unclaimed_curator_fees
        8 +  // created_at
        8 +  // launch_protection_ends_at
        1 +  // bump
        1 +  // token_vault_bump
        1 +  // sol_vault_bump
        4 + MAX_NAME_LEN +    // name
        4 + MAX_SYMBOL_LEN +  // symbol
        4 + MAX_URI_LEN +     // uri
        4 + 32; // reserved

    pub fn is_in_launch_protection(&self, current_time: i64) -> bool {
        self.status == PoolStatus::LaunchProtection
            && current_time < self.launch_protection_ends_at
    }

    pub fn is_tradeable(&self) -> bool {
        matches!(self.status, PoolStatus::Active | PoolStatus::LaunchProtection)
    }
}

use anchor_lang::prelude::*;

use crate::constants::*;
use crate::error::RedCircleError;
use crate::state::{Pool, PoolModel};

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, InitSpace)]
pub struct SigmoidConfig {
    pub token_supply: u64,
    pub floor_price_lamports: u64,
    pub cap_price_lamports: u64,
    pub midpoint_supply: u64,
    pub steepness_bps: u64,
    pub band_bps: u64,
}

impl SigmoidConfig {
    pub fn validate(&self) -> Result<()> {
        require!(self.token_supply > 0, RedCircleError::InvalidSigmoidConfig);
        require!(
            self.floor_price_lamports > 0,
            RedCircleError::InvalidSigmoidConfig
        );
        require!(
            self.cap_price_lamports > self.floor_price_lamports,
            RedCircleError::InvalidSigmoidConfig
        );
        require!(
            self.midpoint_supply > 0 && self.midpoint_supply < self.token_supply,
            RedCircleError::InvalidSigmoidConfig
        );
        require!(self.steepness_bps > 0, RedCircleError::InvalidSigmoidConfig);
        require!(self.band_bps > 0, RedCircleError::InvalidSigmoidConfig);
        Ok(())
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, InitSpace)]
pub struct MigrationConfig {
    pub supply_threshold_bps: u16,
    pub min_sol_reserve: u64,
}

impl MigrationConfig {
    pub fn validate(&self) -> Result<()> {
        require!(
            self.supply_threshold_bps > 0 && self.supply_threshold_bps <= BPS_DENOMINATOR as u16,
            RedCircleError::InvalidConfig
        );
        Ok(())
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, InitSpace)]
pub struct DlmmConfig {
    pub bin_step_bps: u16,
    pub active_bin_id: i32,
}

impl DlmmConfig {
    pub fn validate(&self) -> Result<()> {
        require!(self.bin_step_bps > 0, RedCircleError::InvalidConfig);
        Ok(())
    }
}

/// Market state for a tokenized post pool.
/// PDA Seed: ["market", pool]
#[account]
#[derive(InitSpace)]
pub struct MarketState {
    pub pool: Pubkey,
    pub model: PoolModel,
    pub sigmoid: SigmoidConfig,
    pub migration: MigrationConfig,
    pub dlmm: DlmmConfig,
    pub allocated_token_liquidity: u64,
    pub allocated_sol_liquidity: u64,
    pub total_trade_volume: u128,
    pub total_fees_earned: u128,
    pub platform_fees_earned: u128,
    pub creator_fees_earned: u128,
    pub curator_fees_earned: u128,
    pub growth_fees_earned: u128,
    pub total_trades: u64,
    pub buy_trades: u64,
    pub sell_trades: u64,
    pub migrated_at: i64,
    pub bump: u8,
    #[max_len(64)]
    pub _reserved: Vec<u8>,
}

impl MarketState {
    pub const SIZE: usize = 8 + Self::INIT_SPACE;

    pub fn migration_threshold_supply(&self) -> Result<u64> {
        let threshold = (self.sigmoid.token_supply as u128)
            .checked_mul(self.migration.supply_threshold_bps as u128)
            .ok_or(RedCircleError::MathOverflow)?
            .checked_div(BPS_DENOMINATOR as u128)
            .ok_or(RedCircleError::DivisionByZero)?;
        require!(threshold <= u64::MAX as u128, RedCircleError::MathOverflow);
        Ok(threshold as u64)
    }

    pub fn migration_conditions_met(&self, pool: &Pool) -> Result<bool> {
        Ok(pool.tokens_sold >= self.migration_threshold_supply()?
            && pool.liquidity_sol_reserve >= self.migration.min_sol_reserve)
    }
}

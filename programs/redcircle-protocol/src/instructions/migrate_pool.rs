use anchor_lang::prelude::*;

use crate::constants::*;
use crate::error::RedCircleError;
use crate::math::{bin_id_for_price, price_at_supply};
use crate::state::{Config, MarketState, Pool, PoolModel};

#[derive(Accounts)]
pub struct MigratePool<'info> {
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
        constraint = market_state.pool == pool.key() @ RedCircleError::InvalidAuthority
    )]
    pub market_state: Account<'info, MarketState>,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct MigratePoolParams {
    /// Optional active bin override. If omitted, derive from current sigmoid price.
    pub active_bin_id: Option<i32>,
    /// Require the migration checks. Only admin can bypass this for recovery.
    pub enforce_conditions: bool,
}

pub fn migrate_pool_handler(ctx: Context<MigratePool>, params: MigratePoolParams) -> Result<()> {
    let pool = &mut ctx.accounts.pool;
    let market_state = &mut ctx.accounts.market_state;
    let authority = ctx.accounts.authority.key();
    let is_admin = authority == ctx.accounts.config.admin;
    let is_curator = authority == pool.curator;

    require!(is_admin || is_curator, RedCircleError::Unauthorized);
    require!(
        matches!(
            market_state.model,
            PoolModel::SigmoidBootstrap | PoolModel::MigrationPending
        ),
        RedCircleError::AlreadyMigrated
    );

    if params.enforce_conditions || !is_admin {
        require!(
            market_state.migration_conditions_met(pool)?,
            RedCircleError::MigrationConditionsNotMet
        );
    }

    let current_price = price_at_supply(&market_state.sigmoid, pool.tokens_sold)?;
    let active_bin_id = match params.active_bin_id {
        Some(bin_id) => bin_id,
        None => bin_id_for_price(current_price, market_state.dlmm.bin_step_bps)?,
    };

    market_state.model = PoolModel::DLMM;
    market_state.dlmm.active_bin_id = active_bin_id;
    market_state.migrated_at = Clock::get()?.unix_timestamp;
    pool.model = PoolModel::DLMM;

    msg!(
        "Pool {} migrated to DLMM at price {} with active bin {}",
        pool.post_id,
        current_price,
        active_bin_id
    );

    Ok(())
}

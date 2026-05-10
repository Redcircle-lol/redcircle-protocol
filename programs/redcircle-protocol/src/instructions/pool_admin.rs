use anchor_lang::prelude::*;

use crate::constants::*;
use crate::error::RedCircleError;
use crate::state::{Config, Pool, PoolStatus};

#[derive(Accounts)]
pub struct SetPoolStatus<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        seeds = [CONFIG_SEED],
        bump = config.bump,
        constraint = config.admin == admin.key() @ RedCircleError::Unauthorized
    )]
    pub config: Account<'info, Config>,

    #[account(
        mut,
        seeds = [POOL_SEED, pool.post_id.as_bytes()],
        bump = pool.bump
    )]
    pub pool: Account<'info, Pool>,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct SetPoolStatusParams {
    pub status: PoolStatus,
}

pub fn set_pool_status_handler(
    ctx: Context<SetPoolStatus>,
    params: SetPoolStatusParams,
) -> Result<()> {
    let pool = &mut ctx.accounts.pool;
    pool.status = params.status;

    msg!("Pool {} status updated", pool.post_id);

    Ok(())
}

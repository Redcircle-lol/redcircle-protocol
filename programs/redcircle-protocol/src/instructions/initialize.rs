use crate::constants::*;
use crate::error::RedCircleError;
use crate::state::Config;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    /// CHECK: Treasury wallet
    pub treasury: UncheckedAccount<'info>,

    #[account(
        init,
        payer = admin,
        space = Config::SIZE,
        seeds = [CONFIG_SEED],
        bump
    )]
    pub config: Account<'info, Config>,

    pub system_program: Program<'info, System>,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct InitializeParams {
    pub sigmoid_floor_price: Option<u64>,
    pub sigmoid_cap_price: Option<u64>,
    pub pool_creation_fee: Option<u64>,
    pub launch_protection_duration: Option<i64>,
    pub max_buy_during_protection: Option<u64>,
}

pub fn initialize_handler(ctx: Context<Initialize>, params: InitializeParams) -> Result<()> {
    let config = &mut ctx.accounts.config;

    config.admin = ctx.accounts.admin.key();
    config.treasury = ctx.accounts.treasury.key();

    config.is_paused = false;

    config.total_pools = 0;
    config.total_volume = 0;
    config.total_fees_collected = 0;

    config.default_sigmoid_floor_price = params
        .sigmoid_floor_price
        .unwrap_or(DEFAULT_SIGMOID_FLOOR_PRICE);

    config.default_sigmoid_cap_price = params
        .sigmoid_cap_price
        .unwrap_or(DEFAULT_SIGMOID_CAP_PRICE);

    require!(
        config.default_sigmoid_cap_price > config.default_sigmoid_floor_price
            && config.default_sigmoid_floor_price > 0,
        RedCircleError::InvalidSigmoidConfig
    );

    config.pool_creation_fee = params.pool_creation_fee.unwrap_or(POOL_CREATION_FEE);

    config.launch_protection_duration = params
        .launch_protection_duration
        .unwrap_or(LAUNCH_PROTECTION_DURATION);

    config.max_buy_during_protection = params
        .max_buy_during_protection
        .unwrap_or(MAX_BUY_DURING_PROTECTION);

    config.bump = ctx.bumps.config;

    msg!("RedCircle Protocol initialized");
    msg!("Admin: {}", config.admin);
    msg!("Treasury: {}", config.treasury);

    Ok(())
}

#[derive(Accounts)]
pub struct UpdateConfig<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        mut,
        seeds = [CONFIG_SEED],
        bump = config.bump,
        constraint = config.admin == admin.key() @ RedCircleError::Unauthorized
    )]
    pub config: Account<'info, Config>,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct UpdateConfigParams {
    pub new_admin: Option<Pubkey>,
    pub new_treasury: Option<Pubkey>,
    pub is_paused: Option<bool>,
    pub default_sigmoid_floor_price: Option<u64>,
    pub default_sigmoid_cap_price: Option<u64>,
    pub pool_creation_fee: Option<u64>,
    pub launch_protection_duration: Option<i64>,
    pub max_buy_during_protection: Option<u64>,
}

pub fn update_config_handler(ctx: Context<UpdateConfig>, params: UpdateConfigParams) -> Result<()> {
    let config = &mut ctx.accounts.config;

    if let Some(new_admin) = params.new_admin {
        config.admin = new_admin;
        msg!("Admin updated to: {}", new_admin);
    }

    if let Some(new_treasury) = params.new_treasury {
        config.treasury = new_treasury;
        msg!("Treasury updated to: {}", new_treasury);
    }

    if let Some(is_paused) = params.is_paused {
        config.is_paused = is_paused;
        msg!("Protocol paused: {}", is_paused);
    }

    if let Some(floor_price) = params.default_sigmoid_floor_price {
        require!(floor_price > 0, RedCircleError::InvalidSigmoidConfig);
        require!(
            floor_price < config.default_sigmoid_cap_price,
            RedCircleError::InvalidSigmoidConfig
        );
        config.default_sigmoid_floor_price = floor_price;
    }

    if let Some(cap_price) = params.default_sigmoid_cap_price {
        require!(
            cap_price > config.default_sigmoid_floor_price,
            RedCircleError::InvalidSigmoidConfig
        );
        config.default_sigmoid_cap_price = cap_price;
    }

    if let Some(fee) = params.pool_creation_fee {
        config.pool_creation_fee = fee;
    }

    if let Some(duration) = params.launch_protection_duration {
        config.launch_protection_duration = duration;
    }

    if let Some(max_buy) = params.max_buy_during_protection {
        config.max_buy_during_protection = max_buy;
    }

    msg!("Config updated successfully");

    Ok(())
}

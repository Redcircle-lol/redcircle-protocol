use anchor_lang::prelude::*;

use crate::constants::*;
use crate::error::RedCircleError;
use crate::state::SigmoidConfig;

#[derive(Clone, Copy)]
pub struct SigmoidQuote {
    pub amount_out: u64,
    pub gross_sol: u64,
}

pub fn price_at_supply(config: &SigmoidConfig, sold_supply: u64) -> Result<u64> {
    config.validate()?;
    price_at_supply_unchecked(config, sold_supply)
}

fn price_at_supply_unchecked(config: &SigmoidConfig, sold_supply: u64) -> Result<u64> {
    let clamped_supply = sold_supply.min(config.token_supply);
    let (distance, side_range, below_midpoint) = if clamped_supply < config.midpoint_supply {
        (
            config.midpoint_supply - clamped_supply,
            config.midpoint_supply,
            true,
        )
    } else {
        (
            clamped_supply - config.midpoint_supply,
            config
                .token_supply
                .checked_sub(config.midpoint_supply)
                .ok_or(RedCircleError::MathUnderflow)?,
            false,
        )
    };

    let distance_bps = (distance as u128)
        .checked_mul(BPS_DENOMINATOR as u128)
        .ok_or(RedCircleError::MathOverflow)?
        .checked_div(side_range as u128)
        .ok_or(RedCircleError::DivisionByZero)?;

    let adjusted_distance_bps = distance_bps
        .checked_mul(config.steepness_bps as u128)
        .ok_or(RedCircleError::MathOverflow)?
        .checked_div(BPS_DENOMINATOR as u128)
        .ok_or(RedCircleError::DivisionByZero)?
        .min(BPS_DENOMINATOR as u128);

    let eased_distance_bps = smoothstep_bps(adjusted_distance_bps as u64)?;
    let half_eased = eased_distance_bps
        .checked_mul(5_000)
        .ok_or(RedCircleError::MathOverflow)?
        .checked_div(BPS_DENOMINATOR)
        .ok_or(RedCircleError::DivisionByZero)?;

    let sigmoid_bps = if below_midpoint {
        5_000u64
            .checked_sub(half_eased)
            .ok_or(RedCircleError::MathUnderflow)?
    } else {
        5_000u64
            .checked_add(half_eased)
            .ok_or(RedCircleError::MathOverflow)?
    };

    let price_delta = config
        .cap_price_lamports
        .checked_sub(config.floor_price_lamports)
        .ok_or(RedCircleError::MathUnderflow)?;

    let price = (price_delta as u128)
        .checked_mul(sigmoid_bps as u128)
        .ok_or(RedCircleError::MathOverflow)?
        .checked_div(BPS_DENOMINATOR as u128)
        .ok_or(RedCircleError::DivisionByZero)?
        .checked_add(config.floor_price_lamports as u128)
        .ok_or(RedCircleError::MathOverflow)?;

    require!(price <= u64::MAX as u128, RedCircleError::MathOverflow);
    Ok(price as u64)
}

pub fn quote_sigmoid_buy(
    config: &SigmoidConfig,
    sold_supply: u64,
    sol_in: u64,
) -> Result<SigmoidQuote> {
    require!(sol_in > 0, RedCircleError::ZeroAmount);
    config.validate()?;

    let mut remaining_sol = sol_in;
    let mut supply_cursor = sold_supply;
    let mut tokens_out = 0u64;
    let mut sol_spent = 0u64;
    let band_size = band_size(config)?;

    for _ in 0..MAX_SIGMOID_STEPS {
        if remaining_sol == 0 || supply_cursor >= config.token_supply {
            break;
        }

        let price = price_at_supply_unchecked(config, supply_cursor)?;
        let next_band = next_band_end(supply_cursor, band_size, config.token_supply)?;
        let band_remaining = next_band
            .checked_sub(supply_cursor)
            .ok_or(RedCircleError::MathUnderflow)?;

        let affordable_tokens = (remaining_sol as u128)
            .checked_mul(TOKEN_UNIT as u128)
            .ok_or(RedCircleError::MathOverflow)?
            .checked_div(price as u128)
            .ok_or(RedCircleError::DivisionByZero)?
            .min(band_remaining as u128);

        if affordable_tokens == 0 {
            break;
        }

        let band_cost = ceil_div(
            affordable_tokens
                .checked_mul(price as u128)
                .ok_or(RedCircleError::MathOverflow)?,
            TOKEN_UNIT as u128,
        )?;

        require!(band_cost <= u64::MAX as u128, RedCircleError::MathOverflow);

        let band_tokens = affordable_tokens as u64;
        let band_cost = band_cost as u64;

        tokens_out = tokens_out
            .checked_add(band_tokens)
            .ok_or(RedCircleError::MathOverflow)?;
        sol_spent = sol_spent
            .checked_add(band_cost)
            .ok_or(RedCircleError::MathOverflow)?;
        remaining_sol = remaining_sol
            .checked_sub(band_cost)
            .ok_or(RedCircleError::MathUnderflow)?;
        supply_cursor = supply_cursor
            .checked_add(band_tokens)
            .ok_or(RedCircleError::MathOverflow)?;
    }

    require!(tokens_out > 0, RedCircleError::InvalidCalculation);

    Ok(SigmoidQuote {
        amount_out: tokens_out,
        gross_sol: sol_spent,
    })
}

pub fn quote_sigmoid_sell(
    config: &SigmoidConfig,
    sold_supply: u64,
    tokens_in: u64,
) -> Result<SigmoidQuote> {
    require!(tokens_in > 0, RedCircleError::ZeroAmount);
    require!(tokens_in <= sold_supply, RedCircleError::ExceedsSupply);
    config.validate()?;

    let mut remaining_tokens = tokens_in;
    let mut supply_cursor = sold_supply;
    let mut sol_out = 0u64;
    let band_size = band_size(config)?;

    for _ in 0..MAX_SIGMOID_STEPS {
        if remaining_tokens == 0 || supply_cursor == 0 {
            break;
        }

        let current_band_start = previous_band_start(supply_cursor, band_size)?;
        let price = price_at_supply_unchecked(config, current_band_start)?;
        let band_available = supply_cursor
            .checked_sub(current_band_start)
            .ok_or(RedCircleError::MathUnderflow)?;
        let band_tokens = remaining_tokens.min(band_available);

        let band_sol = (band_tokens as u128)
            .checked_mul(price as u128)
            .ok_or(RedCircleError::MathOverflow)?
            .checked_div(TOKEN_UNIT as u128)
            .ok_or(RedCircleError::DivisionByZero)?;

        require!(band_sol <= u64::MAX as u128, RedCircleError::MathOverflow);

        sol_out = sol_out
            .checked_add(band_sol as u64)
            .ok_or(RedCircleError::MathOverflow)?;
        remaining_tokens = remaining_tokens
            .checked_sub(band_tokens)
            .ok_or(RedCircleError::MathUnderflow)?;
        supply_cursor = supply_cursor
            .checked_sub(band_tokens)
            .ok_or(RedCircleError::MathUnderflow)?;
    }

    require!(remaining_tokens == 0, RedCircleError::InvalidCalculation);
    require!(sol_out > 0, RedCircleError::InvalidCalculation);

    Ok(SigmoidQuote {
        amount_out: sol_out,
        gross_sol: sol_out,
    })
}

fn smoothstep_bps(t_bps: u64) -> Result<u64> {
    let t = t_bps.min(BPS_DENOMINATOR);
    let t2 = (t as u128)
        .checked_mul(t as u128)
        .ok_or(RedCircleError::MathOverflow)?;
    let t3 = t2
        .checked_mul(t as u128)
        .ok_or(RedCircleError::MathOverflow)?;

    let first = 3u128
        .checked_mul(t2)
        .ok_or(RedCircleError::MathOverflow)?
        .checked_div(BPS_DENOMINATOR as u128)
        .ok_or(RedCircleError::DivisionByZero)?;
    let second = 2u128
        .checked_mul(t3)
        .ok_or(RedCircleError::MathOverflow)?
        .checked_div((BPS_DENOMINATOR as u128).pow(2))
        .ok_or(RedCircleError::DivisionByZero)?;

    let eased = first
        .checked_sub(second)
        .ok_or(RedCircleError::MathUnderflow)?;
    require!(
        eased <= BPS_DENOMINATOR as u128,
        RedCircleError::MathOverflow
    );
    Ok(eased as u64)
}

fn ceil_div(numerator: u128, denominator: u128) -> Result<u128> {
    require!(denominator > 0, RedCircleError::DivisionByZero);
    numerator
        .checked_add(
            denominator
                .checked_sub(1)
                .ok_or(RedCircleError::MathUnderflow)?,
        )
        .ok_or(RedCircleError::MathOverflow)?
        .checked_div(denominator)
        .ok_or(RedCircleError::DivisionByZero)
        .map_err(Into::into)
}

fn band_size(config: &SigmoidConfig) -> Result<u64> {
    let size = (config.token_supply as u128)
        .checked_mul(config.band_bps as u128)
        .ok_or(RedCircleError::MathOverflow)?
        .checked_div(BPS_DENOMINATOR as u128)
        .ok_or(RedCircleError::DivisionByZero)?;
    require!(size > 0, RedCircleError::InvalidSigmoidConfig);
    require!(size <= u64::MAX as u128, RedCircleError::MathOverflow);
    Ok(size as u64)
}

fn next_band_end(current_supply: u64, band_size: u64, token_supply: u64) -> Result<u64> {
    let next = current_supply
        .checked_div(band_size)
        .ok_or(RedCircleError::DivisionByZero)?
        .checked_add(1)
        .ok_or(RedCircleError::MathOverflow)?
        .checked_mul(band_size)
        .ok_or(RedCircleError::MathOverflow)?;
    Ok(next.min(token_supply))
}

fn previous_band_start(current_supply: u64, band_size: u64) -> Result<u64> {
    let previous = current_supply
        .saturating_sub(1)
        .checked_div(band_size)
        .ok_or(RedCircleError::DivisionByZero)?
        .checked_mul(band_size)
        .ok_or(RedCircleError::MathOverflow)?;
    Ok(previous)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn test_config() -> SigmoidConfig {
        SigmoidConfig {
            token_supply: 1_000_000_000_000,
            floor_price_lamports: 10,
            cap_price_lamports: 10_000,
            midpoint_supply: 500_000_000_000,
            steepness_bps: 10_000,
            band_bps: 100,
        }
    }

    #[test]
    fn price_is_monotonic_across_supply() {
        let config = test_config();
        let early = price_at_supply(&config, 0).unwrap();
        let mid = price_at_supply(&config, config.midpoint_supply).unwrap();
        let late = price_at_supply(&config, config.token_supply).unwrap();

        assert!(early >= config.floor_price_lamports);
        assert!(mid > early);
        assert!(late > mid);
        assert!(late <= config.cap_price_lamports);
    }

    #[test]
    fn buy_and_sell_quotes_cross_bands() {
        let config = test_config();
        let buy = quote_sigmoid_buy(&config, 0, 1_000_000).unwrap();
        assert!(buy.amount_out > 0);
        assert!(buy.gross_sol > 0);

        let sell = quote_sigmoid_sell(&config, buy.amount_out, buy.amount_out / 2).unwrap();
        assert!(sell.amount_out > 0);
        assert!(sell.gross_sol > 0);
        assert!(sell.gross_sol <= buy.gross_sol);
    }

    #[test]
    fn full_round_trip_quote_is_reserve_backed() {
        let config = SigmoidConfig {
            token_supply: DEFAULT_TOKEN_SUPPLY,
            floor_price_lamports: DEFAULT_SIGMOID_FLOOR_PRICE,
            cap_price_lamports: DEFAULT_SIGMOID_CAP_PRICE,
            midpoint_supply: DEFAULT_TOKEN_SUPPLY / 2,
            steepness_bps: DEFAULT_SIGMOID_STEEPNESS_BPS,
            band_bps: SIGMOID_BAND_BPS,
        };

        let buy = quote_sigmoid_buy(&config, 0, 970_000_000).unwrap();
        let sell = quote_sigmoid_sell(&config, buy.amount_out, buy.amount_out).unwrap();
        assert!(sell.gross_sol <= buy.gross_sol);
    }
}

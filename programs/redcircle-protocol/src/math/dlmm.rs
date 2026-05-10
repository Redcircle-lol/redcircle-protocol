use anchor_lang::prelude::*;

use crate::constants::*;
use crate::error::RedCircleError;

pub fn quote_dlmm_buy(sol_in: u64, price_lamports_per_token: u64) -> Result<u64> {
    require!(sol_in > 0, RedCircleError::ZeroAmount);
    require!(price_lamports_per_token > 0, RedCircleError::InvalidDlmmBin);

    let tokens_out = (sol_in as u128)
        .checked_mul(TOKEN_UNIT as u128)
        .ok_or(RedCircleError::MathOverflow)?
        .checked_div(price_lamports_per_token as u128)
        .ok_or(RedCircleError::DivisionByZero)?;

    require!(tokens_out <= u64::MAX as u128, RedCircleError::MathOverflow);
    require!(tokens_out > 0, RedCircleError::InvalidCalculation);
    Ok(tokens_out as u64)
}

pub fn quote_dlmm_sell(tokens_in: u64, price_lamports_per_token: u64) -> Result<u64> {
    require!(tokens_in > 0, RedCircleError::ZeroAmount);
    require!(price_lamports_per_token > 0, RedCircleError::InvalidDlmmBin);

    let sol_out = (tokens_in as u128)
        .checked_mul(price_lamports_per_token as u128)
        .ok_or(RedCircleError::MathOverflow)?
        .checked_div(TOKEN_UNIT as u128)
        .ok_or(RedCircleError::DivisionByZero)?;

    require!(sol_out <= u64::MAX as u128, RedCircleError::MathOverflow);
    require!(sol_out > 0, RedCircleError::InvalidCalculation);
    Ok(sol_out as u64)
}

pub fn bin_id_for_price(price_lamports_per_token: u64, bin_step_bps: u16) -> Result<i32> {
    require!(price_lamports_per_token > 0, RedCircleError::InvalidDlmmBin);
    require!(bin_step_bps > 0, RedCircleError::InvalidConfig);

    let bin_id = price_lamports_per_token
        .checked_div(bin_step_bps as u64)
        .ok_or(RedCircleError::DivisionByZero)?;
    require!(bin_id <= i32::MAX as u64, RedCircleError::MathOverflow);
    Ok(bin_id as i32)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn buy_and_sell_quotes_use_whole_token_unit() {
        let price = 1_000;
        let sol_in = 1_000_000;
        let tokens_out = quote_dlmm_buy(sol_in, price).unwrap();
        assert_eq!(tokens_out, 1_000_000_000);

        let sol_out = quote_dlmm_sell(tokens_out, price).unwrap();
        assert_eq!(sol_out, sol_in);
    }

    #[test]
    fn derives_bin_id_from_price_step() {
        assert_eq!(bin_id_for_price(10_500, 100).unwrap(), 105);
    }
}

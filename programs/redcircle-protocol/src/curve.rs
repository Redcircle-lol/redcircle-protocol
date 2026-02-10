use anchor_lang::prelude::*;

use crate::error::RedCircleError;
use crate::state::CurveType;

/// Precision for fixed-point math operations
/// We use u128 for intermediate calculations to prevent overflow
const PRECISION: u128 = 1_000_000_000_000; // 10^12

/// Calculate tokens received for a given SOL input (buy)
///
/// Uses constant product formula: x * y = k
/// tokens_out = virtual_token_reserve - (k / (virtual_sol_reserve + sol_in))
///
/// # Arguments
/// * `virtual_sol_reserve` - Current virtual SOL in the pool
/// * `virtual_token_reserve` - Current virtual tokens in the pool
/// * `sol_in` - Amount of SOL being spent (after fees)
/// * `curve_type` - Type of bonding curve
///
/// # Returns
/// * `Result<u64>` - Amount of tokens to receive
pub fn calculate_tokens_out(
    virtual_sol_reserve: u64,
    virtual_token_reserve: u64,
    sol_in: u64,
    curve_type: CurveType,
) -> Result<u64> {
    require!(sol_in > 0, RedCircleError::ZeroAmount);
    require!(virtual_sol_reserve > 0, RedCircleError::DivisionByZero);
    require!(virtual_token_reserve > 0, RedCircleError::DivisionByZero);

    match curve_type {
        CurveType::ConstantProduct => {
            calculate_constant_product_buy(virtual_sol_reserve, virtual_token_reserve, sol_in)
        }
        CurveType::Linear => {
            calculate_linear_buy(virtual_sol_reserve, virtual_token_reserve, sol_in)
        }
        CurveType::Exponential => {
            calculate_exponential_buy(virtual_sol_reserve, virtual_token_reserve, sol_in)
        }
    }
}

/// Calculate SOL received for a given token input (sell)
///
/// Uses constant product formula: x * y = k
/// sol_out = virtual_sol_reserve - (k / (virtual_token_reserve + tokens_in))
///
/// # Arguments
/// * `virtual_sol_reserve` - Current virtual SOL in the pool
/// * `virtual_token_reserve` - Current virtual tokens in the pool
/// * `tokens_in` - Amount of tokens being sold
/// * `curve_type` - Type of bonding curve
///
/// # Returns
/// * `Result<u64>` - Amount of SOL to receive
pub fn calculate_sol_out(
    virtual_sol_reserve: u64,
    virtual_token_reserve: u64,
    tokens_in: u64,
    curve_type: CurveType,
) -> Result<u64> {
    require!(tokens_in > 0, RedCircleError::ZeroAmount);
    require!(virtual_sol_reserve > 0, RedCircleError::DivisionByZero);
    require!(virtual_token_reserve > 0, RedCircleError::DivisionByZero);

    match curve_type {
        CurveType::ConstantProduct => {
            calculate_constant_product_sell(virtual_sol_reserve, virtual_token_reserve, tokens_in)
        }
        CurveType::Linear => {
            calculate_linear_sell(virtual_sol_reserve, virtual_token_reserve, tokens_in)
        }
        CurveType::Exponential => {
            calculate_exponential_sell(virtual_sol_reserve, virtual_token_reserve, tokens_in)
        }
    }
}

/// Constant product (x * y = k) buy calculation
fn calculate_constant_product_buy(
    virtual_sol_reserve: u64,
    virtual_token_reserve: u64,
    sol_in: u64,
) -> Result<u64> {
    // k = x * y
    let k = (virtual_sol_reserve as u128)
        .checked_mul(virtual_token_reserve as u128)
        .ok_or(RedCircleError::MathOverflow)?;

    // new_sol_reserve = virtual_sol_reserve + sol_in
    let new_sol_reserve = (virtual_sol_reserve as u128)
        .checked_add(sol_in as u128)
        .ok_or(RedCircleError::MathOverflow)?;

    // new_token_reserve = k / new_sol_reserve
    let new_token_reserve = k
        .checked_div(new_sol_reserve)
        .ok_or(RedCircleError::DivisionByZero)?;

    // tokens_out = virtual_token_reserve - new_token_reserve
    let tokens_out = (virtual_token_reserve as u128)
        .checked_sub(new_token_reserve)
        .ok_or(RedCircleError::MathUnderflow)?;

    // Ensure result fits in u64
    require!(tokens_out <= u64::MAX as u128, RedCircleError::MathOverflow);

    Ok(tokens_out as u64)
}

/// Constant product (x * y = k) sell calculation
fn calculate_constant_product_sell(
    virtual_sol_reserve: u64,
    virtual_token_reserve: u64,
    tokens_in: u64,
) -> Result<u64> {
    // k = x * y
    let k = (virtual_sol_reserve as u128)
        .checked_mul(virtual_token_reserve as u128)
        .ok_or(RedCircleError::MathOverflow)?;

    // new_token_reserve = virtual_token_reserve + tokens_in
    let new_token_reserve = (virtual_token_reserve as u128)
        .checked_add(tokens_in as u128)
        .ok_or(RedCircleError::MathOverflow)?;

    // new_sol_reserve = k / new_token_reserve
    let new_sol_reserve = k
        .checked_div(new_token_reserve)
        .ok_or(RedCircleError::DivisionByZero)?;

    // sol_out = virtual_sol_reserve - new_sol_reserve
    let sol_out = (virtual_sol_reserve as u128)
        .checked_sub(new_sol_reserve)
        .ok_or(RedCircleError::MathUnderflow)?;

    // Ensure result fits in u64
    require!(sol_out <= u64::MAX as u128, RedCircleError::MathOverflow);

    Ok(sol_out as u64)
}

/// Linear curve buy calculation
/// Price increases linearly: price = base_price + slope * tokens_sold
/// For simplicity, we approximate this using the average price
fn calculate_linear_buy(
    virtual_sol_reserve: u64,
    virtual_token_reserve: u64,
    sol_in: u64,
) -> Result<u64> {
    // Current price = virtual_sol_reserve / virtual_token_reserve
    // For linear, we use a simplified approach similar to constant product
    // but with reduced price impact

    let current_price = (virtual_sol_reserve as u128)
        .checked_mul(PRECISION)
        .ok_or(RedCircleError::MathOverflow)?
        .checked_div(virtual_token_reserve as u128)
        .ok_or(RedCircleError::DivisionByZero)?;

    // Calculate base tokens at current price
    let base_tokens = (sol_in as u128)
        .checked_mul(PRECISION)
        .ok_or(RedCircleError::MathOverflow)?
        .checked_div(current_price)
        .ok_or(RedCircleError::DivisionByZero)?;

    // Apply 50% of constant product price impact for linear curve
    let cp_tokens =
        calculate_constant_product_buy(virtual_sol_reserve, virtual_token_reserve, sol_in)?;

    // Linear curve gives average of flat price and CP price impact
    let tokens_out = (base_tokens as u64)
        .checked_add(cp_tokens)
        .ok_or(RedCircleError::MathOverflow)?
        .checked_div(2)
        .ok_or(RedCircleError::DivisionByZero)?;

    Ok(tokens_out)
}

/// Linear curve sell calculation
fn calculate_linear_sell(
    virtual_sol_reserve: u64,
    virtual_token_reserve: u64,
    tokens_in: u64,
) -> Result<u64> {
    // Current price = virtual_sol_reserve / virtual_token_reserve
    let current_price = (virtual_sol_reserve as u128)
        .checked_mul(PRECISION)
        .ok_or(RedCircleError::MathOverflow)?
        .checked_div(virtual_token_reserve as u128)
        .ok_or(RedCircleError::DivisionByZero)?;

    // Calculate base SOL at current price
    let base_sol = (tokens_in as u128)
        .checked_mul(current_price)
        .ok_or(RedCircleError::MathOverflow)?
        .checked_div(PRECISION)
        .ok_or(RedCircleError::DivisionByZero)?;

    // Apply 50% of constant product price impact for linear curve
    let cp_sol =
        calculate_constant_product_sell(virtual_sol_reserve, virtual_token_reserve, tokens_in)?;

    // Linear curve gives average of flat price and CP price impact
    let sol_out = (base_sol as u64)
        .checked_add(cp_sol)
        .ok_or(RedCircleError::MathOverflow)?
        .checked_div(2)
        .ok_or(RedCircleError::DivisionByZero)?;

    Ok(sol_out)
}

/// Exponential curve buy calculation
/// Uses constant product with higher price impact multiplier
/// This creates steeper early price increases
fn calculate_exponential_buy(
    virtual_sol_reserve: u64,
    virtual_token_reserve: u64,
    sol_in: u64,
) -> Result<u64> {
    // Use constant product as base
    let cp_tokens =
        calculate_constant_product_buy(virtual_sol_reserve, virtual_token_reserve, sol_in)?;

    // Apply exponential factor: reduce tokens out by a factor based on size
    // This makes larger buys relatively more expensive
    let size_factor = (sol_in as u128)
        .checked_mul(100)
        .ok_or(RedCircleError::MathOverflow)?
        .checked_div(virtual_sol_reserve as u128)
        .ok_or(RedCircleError::DivisionByZero)?;

    // Cap size factor at 50% reduction max
    let reduction_bps = std::cmp::min(size_factor, 50) as u64;

    // tokens_out = cp_tokens * (10000 - reduction_bps) / 10000
    let tokens_out = (cp_tokens as u128)
        .checked_mul((10000 - reduction_bps) as u128)
        .ok_or(RedCircleError::MathOverflow)?
        .checked_div(10000)
        .ok_or(RedCircleError::DivisionByZero)?;

    require!(tokens_out <= u64::MAX as u128, RedCircleError::MathOverflow);

    Ok(tokens_out as u64)
}

/// Exponential curve sell calculation
fn calculate_exponential_sell(
    virtual_sol_reserve: u64,
    virtual_token_reserve: u64,
    tokens_in: u64,
) -> Result<u64> {
    // Use constant product as base
    let cp_sol =
        calculate_constant_product_sell(virtual_sol_reserve, virtual_token_reserve, tokens_in)?;

    // Apply exponential factor: reduce SOL out by a factor based on size
    // This makes larger sells relatively less valuable (more slippage)
    let size_factor = (tokens_in as u128)
        .checked_mul(100)
        .ok_or(RedCircleError::MathOverflow)?
        .checked_div(virtual_token_reserve as u128)
        .ok_or(RedCircleError::DivisionByZero)?;

    // Cap size factor at 50% reduction max
    let reduction_bps = std::cmp::min(size_factor, 50) as u64;

    // sol_out = cp_sol * (10000 - reduction_bps) / 10000
    let sol_out = (cp_sol as u128)
        .checked_mul((10000 - reduction_bps) as u128)
        .ok_or(RedCircleError::MathOverflow)?
        .checked_div(10000)
        .ok_or(RedCircleError::DivisionByZero)?;

    require!(sol_out <= u64::MAX as u128, RedCircleError::MathOverflow);

    Ok(sol_out as u64)
}

/// Calculate the current price of the token in SOL
/// Price = virtual_sol_reserve / virtual_token_reserve
pub fn calculate_current_price(virtual_sol_reserve: u64, virtual_token_reserve: u64) -> Result<u64> {
    require!(virtual_token_reserve > 0, RedCircleError::DivisionByZero);

    // Price with 9 decimal places precision (lamports per token base unit)
    let price = (virtual_sol_reserve as u128)
        .checked_mul(1_000_000_000) // 10^9 for precision
        .ok_or(RedCircleError::MathOverflow)?
        .checked_div(virtual_token_reserve as u128)
        .ok_or(RedCircleError::DivisionByZero)?;

    require!(price <= u64::MAX as u128, RedCircleError::MathOverflow);

    Ok(price as u64)
}

/// Calculate market cap in SOL
/// Market cap = current_price * total_supply
pub fn calculate_market_cap(
    virtual_sol_reserve: u64,
    virtual_token_reserve: u64,
    total_supply: u64,
) -> Result<u64> {
    let price = calculate_current_price(virtual_sol_reserve, virtual_token_reserve)?;

    // Market cap = price * total_supply / 10^9 (adjust for price precision)
    let market_cap = (price as u128)
        .checked_mul(total_supply as u128)
        .ok_or(RedCircleError::MathOverflow)?
        .checked_div(1_000_000_000)
        .ok_or(RedCircleError::DivisionByZero)?;

    require!(market_cap <= u64::MAX as u128, RedCircleError::MathOverflow);

    Ok(market_cap as u64)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_constant_product_buy() {
        // Initial reserves: 30 SOL, 1B tokens
        let virtual_sol = 30_000_000_000u64; // 30 SOL in lamports
        let virtual_token = 1_000_000_000_000_000u64; // 1B tokens with 6 decimals
        let sol_in = 1_000_000_000u64; // 1 SOL

        let tokens_out =
            calculate_constant_product_buy(virtual_sol, virtual_token, sol_in).unwrap();

        // Should get approximately 32.26M tokens for 1 SOL
        // (30 * 1B) / 31 = ~967.7M remaining, so ~32.3M out
        assert!(tokens_out > 30_000_000_000_000); // > 30M tokens
        assert!(tokens_out < 35_000_000_000_000); // < 35M tokens
    }

    #[test]
    fn test_constant_product_sell() {
        let virtual_sol = 30_000_000_000u64;
        let virtual_token = 1_000_000_000_000_000u64;
        let tokens_in = 32_000_000_000_000u64; // ~32M tokens

        let sol_out =
            calculate_constant_product_sell(virtual_sol, virtual_token, tokens_in).unwrap();

        // Should get approximately 0.93 SOL back
        assert!(sol_out > 900_000_000); // > 0.9 SOL
        assert!(sol_out < 1_000_000_000); // < 1 SOL
    }

    #[test]
    fn test_price_calculation() {
        let virtual_sol = 30_000_000_000u64; // 30 SOL
        let virtual_token = 1_000_000_000_000_000u64; // 1B tokens

        let price = calculate_current_price(virtual_sol, virtual_token).unwrap();

        // Price should be 30 SOL / 1B tokens = 0.00000003 SOL per token
        // With 9 decimals precision: 30 * 10^9 / 10^15 = 30 / 10^6 = 0.00003 (in 10^9 format = 30)
        assert_eq!(price, 30);
    }
}

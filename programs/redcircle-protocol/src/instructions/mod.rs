pub mod buy_sell;
pub mod claim_fees;
pub mod create_pool;
pub mod initialize;
pub mod referral;
pub mod swap;

// Re-export account structs (no naming conflicts)
pub use buy_sell::{Buy, BuyParams, Sell, SellParams};
pub use claim_fees::{ClaimCreatorFees, ClaimCuratorFees, ClaimInviterFees, SetCreator};
pub use create_pool::{CreatePool, CreatePoolParams};
pub use initialize::{Initialize, InitializeParams, UpdateConfig, UpdateConfigParams};
pub use referral::RegisterReferral;
pub use swap::{Swap, SwapParams};

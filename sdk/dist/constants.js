"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ASSOCIATED_TOKEN_PROGRAM_ID = exports.TOKEN_PROGRAM_ID = exports.MIN_TRADE_AMOUNT = exports.MAX_SYMBOL_LEN = exports.MAX_NAME_LEN = exports.MAX_URI_LEN = exports.MAX_POST_ID_LEN = exports.MAX_BUY_DURING_PROTECTION = exports.LAUNCH_PROTECTION_DURATION = exports.LAMPORTS_PER_SOL = exports.SOL_DECIMALS = exports.TOKEN_DECIMALS = exports.DEFAULT_MIGRATION_THRESHOLD = exports.DEFAULT_TOKEN_SUPPLY = exports.DEFAULT_INITIAL_VIRTUAL_TOKEN = exports.DEFAULT_INITIAL_VIRTUAL_SOL = exports.BPS_DENOMINATOR = exports.CURATOR_FEE_BPS = exports.INVITER_FEE_BPS = exports.PLATFORM_FEE_BPS = exports.CREATOR_FEE_BPS = exports.TOTAL_FEE_BPS = exports.LP_MINT_SEED = exports.INVITER_STATS_SEED = exports.REFERRAL_SEED = exports.FEE_VAULT_SEED = exports.POOL_SOL_VAULT_SEED = exports.POOL_SEED = exports.CONFIG_SEED = exports.PROGRAM_ID = void 0;
const web3_js_1 = require("@solana/web3.js");
const bn_js_1 = __importDefault(require("bn.js"));
exports.PROGRAM_ID = new web3_js_1.PublicKey("8vdyo4hfP1ZjmnnEuGrqhHNupt2ZjZ7LmfRtU4kCXS5L");
// PDA Seeds
exports.CONFIG_SEED = Buffer.from("config");
exports.POOL_SEED = Buffer.from("pool");
exports.POOL_SOL_VAULT_SEED = Buffer.from("sol_vault");
exports.FEE_VAULT_SEED = Buffer.from("fee_vault");
exports.REFERRAL_SEED = Buffer.from("referral");
exports.INVITER_STATS_SEED = Buffer.from("inviter_stats");
exports.LP_MINT_SEED = Buffer.from("lp_mint");
// Fee configuration (basis points)
exports.TOTAL_FEE_BPS = 300;
exports.CREATOR_FEE_BPS = 100;
exports.PLATFORM_FEE_BPS = 100;
exports.INVITER_FEE_BPS = 50;
exports.CURATOR_FEE_BPS = 50;
exports.BPS_DENOMINATOR = 10000;
// Bonding curve defaults
exports.DEFAULT_INITIAL_VIRTUAL_SOL = new bn_js_1.default("30000000000"); // 30 SOL
exports.DEFAULT_INITIAL_VIRTUAL_TOKEN = new bn_js_1.default("1000000000000000"); // 1B tokens (6 decimals)
exports.DEFAULT_TOKEN_SUPPLY = new bn_js_1.default("1000000000000000"); // 1B tokens (6 decimals)
exports.DEFAULT_MIGRATION_THRESHOLD = new bn_js_1.default("85000000000"); // 85 SOL
exports.TOKEN_DECIMALS = 6;
exports.SOL_DECIMALS = 9;
exports.LAMPORTS_PER_SOL = 1000000000;
// Launch protection
exports.LAUNCH_PROTECTION_DURATION = 30; // seconds
exports.MAX_BUY_DURING_PROTECTION = new bn_js_1.default("1000000000"); // 1 SOL
// Limits
exports.MAX_POST_ID_LEN = 32;
exports.MAX_URI_LEN = 256;
exports.MAX_NAME_LEN = 32;
exports.MAX_SYMBOL_LEN = 8;
exports.MIN_TRADE_AMOUNT = new bn_js_1.default("10000"); // 0.00001 SOL
// Well-known program addresses
exports.TOKEN_PROGRAM_ID = new web3_js_1.PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
exports.ASSOCIATED_TOKEN_PROGRAM_ID = new web3_js_1.PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");
//# sourceMappingURL=constants.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findConfigPda = findConfigPda;
exports.findPoolPda = findPoolPda;
exports.findTokenMintPda = findTokenMintPda;
exports.findPoolSolVaultPda = findPoolSolVaultPda;
exports.findFeeVaultPda = findFeeVaultPda;
exports.findReferralPda = findReferralPda;
exports.findInviterStatsPda = findInviterStatsPda;
exports.findAssociatedTokenAddress = findAssociatedTokenAddress;
exports.derivePoolAddresses = derivePoolAddresses;
const web3_js_1 = require("@solana/web3.js");
const constants_1 = require("./constants");
function findConfigPda(programId = constants_1.PROGRAM_ID) {
    return web3_js_1.PublicKey.findProgramAddressSync([constants_1.CONFIG_SEED], programId);
}
function findPoolPda(postId, programId = constants_1.PROGRAM_ID) {
    return web3_js_1.PublicKey.findProgramAddressSync([constants_1.POOL_SEED, Buffer.from(postId)], programId);
}
function findTokenMintPda(pool, programId = constants_1.PROGRAM_ID) {
    return web3_js_1.PublicKey.findProgramAddressSync([constants_1.LP_MINT_SEED, pool.toBuffer()], programId);
}
function findPoolSolVaultPda(pool, programId = constants_1.PROGRAM_ID) {
    return web3_js_1.PublicKey.findProgramAddressSync([constants_1.POOL_SOL_VAULT_SEED, pool.toBuffer()], programId);
}
function findFeeVaultPda(programId = constants_1.PROGRAM_ID) {
    return web3_js_1.PublicKey.findProgramAddressSync([constants_1.FEE_VAULT_SEED], programId);
}
function findReferralPda(user, programId = constants_1.PROGRAM_ID) {
    return web3_js_1.PublicKey.findProgramAddressSync([constants_1.REFERRAL_SEED, user.toBuffer()], programId);
}
function findInviterStatsPda(inviter, programId = constants_1.PROGRAM_ID) {
    return web3_js_1.PublicKey.findProgramAddressSync([constants_1.INVITER_STATS_SEED, inviter.toBuffer()], programId);
}
function findAssociatedTokenAddress(owner, mint) {
    const [address] = web3_js_1.PublicKey.findProgramAddressSync([owner.toBuffer(), constants_1.TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()], constants_1.ASSOCIATED_TOKEN_PROGRAM_ID);
    return address;
}
/** Derive all PDAs needed for a pool given its postId. */
function derivePoolAddresses(postId, programId = constants_1.PROGRAM_ID) {
    const [pool] = findPoolPda(postId, programId);
    const [tokenMint] = findTokenMintPda(pool, programId);
    const [poolSolVault] = findPoolSolVaultPda(pool, programId);
    const poolTokenVault = findAssociatedTokenAddress(pool, tokenMint);
    const [config] = findConfigPda(programId);
    return {
        pool,
        tokenMint,
        poolSolVault,
        poolTokenVault,
        config,
    };
}
//# sourceMappingURL=pda.js.map
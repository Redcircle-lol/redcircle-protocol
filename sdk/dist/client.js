"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedCircleClient = void 0;
const anchor = __importStar(require("@coral-xyz/anchor"));
const web3_js_1 = require("@solana/web3.js");
const constants_1 = require("./constants");
const pda_1 = require("./pda");
const idl_1 = __importDefault(require("./idl"));
class RedCircleClient {
    constructor(provider, opts) {
        this.programId = opts?.programId ?? constants_1.PROGRAM_ID;
        this.connection = provider.connection;
        this.program = new anchor.Program(idl_1.default, provider);
    }
    // ---------------------------------------------------------------------------
    // PDA helpers (exposed for convenience)
    // ---------------------------------------------------------------------------
    getConfigPda() {
        return (0, pda_1.findConfigPda)(this.programId)[0];
    }
    getPoolPda(postId) {
        return (0, pda_1.findPoolPda)(postId, this.programId)[0];
    }
    getTokenMintPda(pool) {
        return (0, pda_1.findTokenMintPda)(pool, this.programId)[0];
    }
    getPoolSolVaultPda(pool) {
        return (0, pda_1.findPoolSolVaultPda)(pool, this.programId)[0];
    }
    getFeeVaultPda() {
        return (0, pda_1.findFeeVaultPda)(this.programId)[0];
    }
    getReferralPda(user) {
        return (0, pda_1.findReferralPda)(user, this.programId)[0];
    }
    getInviterStatsPda(inviter) {
        return (0, pda_1.findInviterStatsPda)(inviter, this.programId)[0];
    }
    derivePoolAddresses(postId) {
        return (0, pda_1.derivePoolAddresses)(postId, this.programId);
    }
    // ---------------------------------------------------------------------------
    // Account fetchers
    // ---------------------------------------------------------------------------
    get accounts() {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return this.program.account;
    }
    async fetchConfig() {
        const config = this.getConfigPda();
        return (await this.accounts.config.fetch(config));
    }
    async fetchPool(postId) {
        const pool = this.getPoolPda(postId);
        return (await this.accounts.pool.fetch(pool));
    }
    async fetchPoolByAddress(address) {
        return (await this.accounts.pool.fetch(address));
    }
    async fetchReferral(user) {
        const referral = this.getReferralPda(user);
        return (await this.accounts.referral.fetch(referral));
    }
    async fetchInviterStats(inviter) {
        const stats = this.getInviterStatsPda(inviter);
        return (await this.accounts.inviterStats.fetch(stats));
    }
    async fetchAllPools() {
        const accounts = await this.accounts.pool.all();
        return accounts;
    }
    // ---------------------------------------------------------------------------
    // Instructions - Admin
    // ---------------------------------------------------------------------------
    async initialize(admin, treasury, params = {}) {
        const config = this.getConfigPda();
        return await this.program.methods
            .initialize({
            initialVirtualSol: params.initialVirtualSol ?? null,
            initialVirtualToken: params.initialVirtualToken ?? null,
            migrationThreshold: params.migrationThreshold ?? null,
            poolCreationFee: params.poolCreationFee ?? null,
            launchProtectionDuration: params.launchProtectionDuration ?? null,
            maxBuyDuringProtection: params.maxBuyDuringProtection ?? null,
        })
            .accountsStrict({
            admin,
            treasury,
            config,
            systemProgram: web3_js_1.SystemProgram.programId,
        })
            .instruction();
    }
    async updateConfig(admin, params = {}) {
        const config = this.getConfigPda();
        return await this.program.methods
            .updateConfig({
            newAdmin: params.newAdmin ?? null,
            newTreasury: params.newTreasury ?? null,
            isPaused: params.isPaused ?? null,
            defaultInitialVirtualSol: params.defaultInitialVirtualSol ?? null,
            defaultInitialVirtualToken: params.defaultInitialVirtualToken ?? null,
            defaultMigrationThreshold: params.defaultMigrationThreshold ?? null,
            poolCreationFee: params.poolCreationFee ?? null,
            launchProtectionDuration: params.launchProtectionDuration ?? null,
            maxBuyDuringProtection: params.maxBuyDuringProtection ?? null,
        })
            .accountsStrict({
            admin,
            config,
        })
            .instruction();
    }
    async setCreator(authority, postId, creator) {
        const pool = this.getPoolPda(postId);
        const config = this.getConfigPda();
        return await this.program.methods
            .setCreator()
            .accountsStrict({
            authority,
            pool,
            config,
            creator,
        })
            .instruction();
    }
    // ---------------------------------------------------------------------------
    // Instructions - Pool
    // ---------------------------------------------------------------------------
    async createPool(curator, treasury, params) {
        const addrs = this.derivePoolAddresses(params.postId);
        return await this.program.methods
            .createPool({
            postId: params.postId,
            name: params.name,
            symbol: params.symbol,
            uri: params.uri,
            curveType: params.curveType != null ? params.curveType : null,
            initialVirtualSol: params.initialVirtualSol ?? null,
            initialVirtualToken: params.initialVirtualToken ?? null,
            migrationThreshold: params.migrationThreshold ?? null,
        })
            .accountsStrict({
            curator,
            config: addrs.config,
            pool: addrs.pool,
            tokenMint: addrs.tokenMint,
            poolTokenVault: addrs.poolTokenVault,
            poolSolVault: addrs.poolSolVault,
            treasury,
            tokenProgram: constants_1.TOKEN_PROGRAM_ID,
            associatedTokenProgram: constants_1.ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: web3_js_1.SystemProgram.programId,
        })
            .instruction();
    }
    // ---------------------------------------------------------------------------
    // Instructions - Trading
    // ---------------------------------------------------------------------------
    buildTradeAccounts(user, postId, treasury, curatorPubkey) {
        const addrs = this.derivePoolAddresses(postId);
        return {
            user,
            config: addrs.config,
            pool: addrs.pool,
            tokenMint: addrs.tokenMint,
            poolTokenVault: addrs.poolTokenVault,
            poolSolVault: addrs.poolSolVault,
            userTokenAccount: (0, pda_1.findAssociatedTokenAddress)(user, addrs.tokenMint),
            treasury,
            curator: curatorPubkey,
            tokenProgram: constants_1.TOKEN_PROGRAM_ID,
            associatedTokenProgram: constants_1.ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: web3_js_1.SystemProgram.programId,
        };
    }
    async swap(user, postId, treasury, curator, params) {
        const accounts = this.buildTradeAccounts(user, postId, treasury, curator);
        return await this.program.methods
            .swap({
            amountIn: params.amountIn,
            minimumAmountOut: params.minimumAmountOut,
            isBuy: params.isBuy,
        })
            .accountsStrict(accounts)
            .instruction();
    }
    async buy(user, postId, treasury, curator, params) {
        const accounts = this.buildTradeAccounts(user, postId, treasury, curator);
        return await this.program.methods
            .buy({
            solAmount: params.solAmount,
            minTokensOut: params.minTokensOut,
        })
            .accountsStrict(accounts)
            .instruction();
    }
    async sell(user, postId, treasury, curator, params) {
        const accounts = this.buildTradeAccounts(user, postId, treasury, curator);
        return await this.program.methods
            .sell({
            tokenAmount: params.tokenAmount,
            minSolOut: params.minSolOut,
        })
            .accountsStrict(accounts)
            .instruction();
    }
    // ---------------------------------------------------------------------------
    // Instructions - Fees
    // ---------------------------------------------------------------------------
    async claimCreatorFees(creator, postId) {
        const pool = this.getPoolPda(postId);
        const poolSolVault = this.getPoolSolVaultPda(pool);
        return await this.program.methods
            .claimCreatorFees()
            .accountsStrict({
            creator,
            pool,
            poolSolVault,
            systemProgram: web3_js_1.SystemProgram.programId,
        })
            .instruction();
    }
    async claimCuratorFees(curator, postId) {
        const pool = this.getPoolPda(postId);
        const poolSolVault = this.getPoolSolVaultPda(pool);
        return await this.program.methods
            .claimCuratorFees()
            .accountsStrict({
            curator,
            pool,
            poolSolVault,
            systemProgram: web3_js_1.SystemProgram.programId,
        })
            .instruction();
    }
    async claimInviterFees(inviter) {
        const inviterStats = this.getInviterStatsPda(inviter);
        const feeVault = this.getFeeVaultPda();
        return await this.program.methods
            .claimInviterFees()
            .accountsStrict({
            inviter,
            inviterStats,
            feeVault,
            systemProgram: web3_js_1.SystemProgram.programId,
        })
            .instruction();
    }
    // ---------------------------------------------------------------------------
    // Instructions - Referral
    // ---------------------------------------------------------------------------
    async registerReferral(user, inviter) {
        const referral = this.getReferralPda(user);
        const inviterStats = this.getInviterStatsPda(inviter);
        return await this.program.methods
            .registerReferral()
            .accountsStrict({
            user,
            inviter,
            referral,
            inviterStats,
            systemProgram: web3_js_1.SystemProgram.programId,
        })
            .instruction();
    }
    // ---------------------------------------------------------------------------
    // Convenience: send-and-confirm helpers
    // ---------------------------------------------------------------------------
    /**
     * Build a versioned transaction from instructions, using latest blockhash.
     * The caller can then sign + send it.
     */
    async buildTransaction(payer, instructions) {
        const { blockhash } = await this.connection.getLatestBlockhash();
        const message = new web3_js_1.TransactionMessage({
            payerKey: payer,
            recentBlockhash: blockhash,
            instructions,
        }).compileToV0Message();
        return new web3_js_1.VersionedTransaction(message);
    }
}
exports.RedCircleClient = RedCircleClient;
//# sourceMappingURL=client.js.map
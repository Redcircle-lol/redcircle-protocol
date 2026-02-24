import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
export declare enum PoolStatus {
    Active = "active",
    LaunchProtection = "launchProtection",
    Migrated = "migrated",
    Paused = "paused"
}
export declare enum CurveType {
    ConstantProduct = 0,
    Linear = 1,
    Exponential = 2
}
export interface Config {
    admin: PublicKey;
    treasury: PublicKey;
    isPaused: boolean;
    totalPools: BN;
    totalVolume: BN;
    totalFeesCollected: BN;
    defaultInitialVirtualSol: BN;
    defaultInitialVirtualToken: BN;
    defaultMigrationThreshold: BN;
    poolCreationFee: BN;
    launchProtectionDuration: BN;
    maxBuyDuringProtection: BN;
    bump: number;
}
export interface Pool {
    postId: string;
    tokenMint: PublicKey;
    curator: PublicKey;
    creator: PublicKey;
    status: {
        active: {};
    } | {
        launchProtection: {};
    } | {
        migrated: {};
    } | {
        paused: {};
    };
    curveType: {
        constantProduct: {};
    } | {
        linear: {};
    } | {
        exponential: {};
    };
    virtualSolReserve: BN;
    virtualTokenReserve: BN;
    realSolReserve: BN;
    realTokenReserve: BN;
    tokensSold: BN;
    tokenSupply: BN;
    migrationThreshold: BN;
    totalVolume: BN;
    totalFees: BN;
    unclaimedCreatorFees: BN;
    unclaimedCuratorFees: BN;
    createdAt: BN;
    launchProtectionEndsAt: BN;
    migratedAt: BN;
    bump: number;
    tokenVaultBump: number;
    solVaultBump: number;
    name: string;
    symbol: string;
    uri: string;
}
export interface Referral {
    user: PublicKey;
    inviter: PublicKey;
    totalFeesGenerated: BN;
    registeredAt: BN;
    totalVolume: BN;
    tradeCount: BN;
    bump: number;
}
export interface InviterStats {
    inviter: PublicKey;
    totalReferrals: BN;
    totalFeesEarned: BN;
    unclaimedFees: BN;
    totalReferralVolume: BN;
    firstReferralAt: BN;
    bump: number;
}
export interface InitializeParams {
    initialVirtualSol: BN | null;
    initialVirtualToken: BN | null;
    migrationThreshold: BN | null;
    poolCreationFee: BN | null;
    launchProtectionDuration: BN | null;
    maxBuyDuringProtection: BN | null;
}
export interface UpdateConfigParams {
    newAdmin: PublicKey | null;
    newTreasury: PublicKey | null;
    isPaused: boolean | null;
    defaultInitialVirtualSol: BN | null;
    defaultInitialVirtualToken: BN | null;
    defaultMigrationThreshold: BN | null;
    poolCreationFee: BN | null;
    launchProtectionDuration: BN | null;
    maxBuyDuringProtection: BN | null;
}
export interface CreatePoolParams {
    postId: string;
    name: string;
    symbol: string;
    uri: string;
    curveType?: CurveType;
    initialVirtualSol?: BN;
    initialVirtualToken?: BN;
    migrationThreshold?: BN;
}
export interface SwapParams {
    amountIn: BN;
    minimumAmountOut: BN;
    isBuy: boolean;
}
export interface BuyParams {
    solAmount: BN;
    minTokensOut: BN;
}
export interface SellParams {
    tokenAmount: BN;
    minSolOut: BN;
}
export declare function parsePoolStatus(status: Pool["status"]): PoolStatus;
export declare function parseCurveType(curveType: Pool["curveType"]): CurveType;
//# sourceMappingURL=types.d.ts.map
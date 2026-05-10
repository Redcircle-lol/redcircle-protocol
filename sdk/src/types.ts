import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";

export enum PoolStatus {
  Active = "active",
  LaunchProtection = "launchProtection",
  Paused = "paused",
}

export enum PoolModel {
  SigmoidBootstrap = "sigmoidBootstrap",
  MigrationPending = "migrationPending",
  Dlmm = "dlmm",
}

export type PoolStatusAccount =
  | { active: Record<string, never> }
  | { launchProtection: Record<string, never> }
  | { paused: Record<string, never> };

export type PoolModelAccount =
  | { sigmoidBootstrap: Record<string, never> }
  | { migrationPending: Record<string, never> }
  | { dlmm: Record<string, never> };

export interface Config {
  admin: PublicKey;
  treasury: PublicKey;
  isPaused: boolean;
  totalPools: BN;
  totalVolume: BN;
  totalFeesCollected: BN;
  defaultSigmoidFloorPrice: BN;
  defaultSigmoidCapPrice: BN;
  poolCreationFee: BN;
  launchProtectionDuration: BN;
  maxBuyDuringProtection: BN;
  bump: number;
}

export interface SigmoidConfig {
  tokenSupply: BN;
  floorPriceLamports: BN;
  capPriceLamports: BN;
  midpointSupply: BN;
  steepnessBps: BN;
  bandBps: BN;
}

export interface MigrationConfig {
  supplyThresholdBps: number;
  minSolReserve: BN;
}

export interface DlmmConfig {
  binStepBps: number;
  activeBinId: number;
}

export interface MarketState {
  pool: PublicKey;
  model: PoolModelAccount;
  sigmoid: SigmoidConfig;
  migration: MigrationConfig;
  dlmm: DlmmConfig;
  allocatedTokenLiquidity: BN;
  allocatedSolLiquidity: BN;
  totalTradeVolume: BN;
  totalFeesEarned: BN;
  platformFeesEarned: BN;
  creatorFeesEarned: BN;
  curatorFeesEarned: BN;
  growthFeesEarned: BN;
  totalTrades: BN;
  buyTrades: BN;
  sellTrades: BN;
  migratedAt: BN;
  bump: number;
}

export interface Pool {
  postId: string;
  tokenMint: PublicKey;
  curator: PublicKey;
  creator: PublicKey;
  status: PoolStatusAccount;
  model: PoolModelAccount;
  liquiditySolReserve: BN;
  liquidityTokenReserve: BN;
  tokensSold: BN;
  tokenSupply: BN;
  totalVolume: BN;
  totalFees: BN;
  unclaimedCreatorFees: BN;
  unclaimedCuratorFees: BN;
  unclaimedGrowthFees: BN;
  createdAt: BN;
  launchProtectionEndsAt: BN;
  bump: number;
  tokenVaultBump: number;
  solVaultBump: number;
  name: string;
  symbol: string;
  uri: string;
}

export interface Bin {
  pool: PublicKey;
  binId: number;
  priceLamportsPerToken: BN;
  tokenLiquidity: BN;
  solLiquidity: BN;
  feeGrowthSol: BN;
  feeGrowthToken: BN;
  bump: number;
}

export interface Position {
  pool: PublicKey;
  owner: PublicKey;
  lowerBinId: number;
  upperBinId: number;
  liquidity: BN;
  depositedSol: BN;
  depositedTokens: BN;
  feeCheckpointSol: BN;
  feeCheckpointToken: BN;
  bump: number;
}

export interface InitializeParams {
  sigmoidFloorPrice: BN | null;
  sigmoidCapPrice: BN | null;
  poolCreationFee: BN | null;
  launchProtectionDuration: BN | null;
  maxBuyDuringProtection: BN | null;
}

export interface UpdateConfigParams {
  newAdmin: PublicKey | null;
  newTreasury: PublicKey | null;
  isPaused: boolean | null;
  defaultSigmoidFloorPrice: BN | null;
  defaultSigmoidCapPrice: BN | null;
  poolCreationFee: BN | null;
  launchProtectionDuration: BN | null;
  maxBuyDuringProtection: BN | null;
}

export interface CreatePoolParams {
  postId: string;
  name: string;
  symbol: string;
  uri: string;
  tokenSupply?: BN | null;
  sigmoidFloorPrice?: BN | null;
  sigmoidCapPrice?: BN | null;
  sigmoidMidpointSupply?: BN | null;
  sigmoidSteepnessBps?: BN | null;
  migrationSupplyThresholdBps?: number | null;
  migrationMinSolReserve?: BN | null;
  dlmmBinStepBps?: number | null;
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

export interface MigratePoolParams {
  activeBinId: number | null;
  enforceConditions: boolean;
}

export interface InitBinParams {
  binId: number;
  priceLamportsPerToken: BN;
  initialTokenLiquidity: BN;
  initialSolLiquidity: BN;
}

export interface AddLiquidityParams {
  tokenAmount: BN;
  solAmount: BN;
}

export interface RemoveLiquidityParams {
  tokenAmount: BN;
  solAmount: BN;
}

export interface SetPoolStatusParams {
  status: PoolStatusAccount;
}

export function parsePoolStatus(status: PoolStatusAccount): PoolStatus {
  if ("active" in status) return PoolStatus.Active;
  if ("launchProtection" in status) return PoolStatus.LaunchProtection;
  if ("paused" in status) return PoolStatus.Paused;
  throw new Error("Unknown pool status");
}

export function parsePoolModel(model: PoolModelAccount): PoolModel {
  if ("sigmoidBootstrap" in model) return PoolModel.SigmoidBootstrap;
  if ("migrationPending" in model) return PoolModel.MigrationPending;
  if ("dlmm" in model) return PoolModel.Dlmm;
  throw new Error("Unknown pool model");
}

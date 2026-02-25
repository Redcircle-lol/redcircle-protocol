import * as anchor from "@coral-xyz/anchor";
import {
  Connection,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import BN from "bn.js";
import {
  PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "./constants";
import {
  findConfigPda,
  findPoolPda,
  findTokenMintPda,
  findPoolSolVaultPda,
  findFeeVaultPda,
  findReferralPda,
  findInviterStatsPda,
  findAssociatedTokenAddress,
  derivePoolAddresses,
} from "./pda";
import {
  Config,
  Pool,
  Referral,
  InviterStats,
  CurveType,
  CreatePoolParams,
  BuyParams,
  SellParams,
  SwapParams,
  InitializeParams,
  UpdateConfigParams,
} from "./types";

import idl from "./idl";

export interface RedCircleClientOpts {
  programId?: PublicKey;
}

export class RedCircleClient {
  readonly program: anchor.Program;
  readonly connection: Connection;
  readonly programId: PublicKey;

  constructor(provider: anchor.AnchorProvider, opts?: RedCircleClientOpts) {
    this.programId = opts?.programId ?? PROGRAM_ID;
    this.connection = provider.connection;
    this.program = new anchor.Program(idl as unknown as anchor.Idl, provider);
  }

  // ---------------------------------------------------------------------------
  // PDA helpers (exposed for convenience)
  // ---------------------------------------------------------------------------

  getConfigPda(): PublicKey {
    return findConfigPda(this.programId)[0];
  }

  getPoolPda(postId: string): PublicKey {
    return findPoolPda(postId, this.programId)[0];
  }

  getTokenMintPda(pool: PublicKey): PublicKey {
    return findTokenMintPda(pool, this.programId)[0];
  }

  getPoolSolVaultPda(pool: PublicKey): PublicKey {
    return findPoolSolVaultPda(pool, this.programId)[0];
  }

  getFeeVaultPda(): PublicKey {
    return findFeeVaultPda(this.programId)[0];
  }

  getReferralPda(user: PublicKey): PublicKey {
    return findReferralPda(user, this.programId)[0];
  }

  getInviterStatsPda(inviter: PublicKey): PublicKey {
    return findInviterStatsPda(inviter, this.programId)[0];
  }

  derivePoolAddresses(postId: string) {
    return derivePoolAddresses(postId, this.programId);
  }

  // ---------------------------------------------------------------------------
  // Account fetchers
  // ---------------------------------------------------------------------------

  private get accounts() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.program.account as any;
  }

  async fetchConfig(): Promise<Config> {
    const config = this.getConfigPda();
    return (await this.accounts.config.fetch(config)) as Config;
  }

  async fetchPool(postId: string): Promise<Pool> {
    const pool = this.getPoolPda(postId);
    return (await this.accounts.pool.fetch(pool)) as Pool;
  }

  async fetchPoolByAddress(address: PublicKey): Promise<Pool> {
    return (await this.accounts.pool.fetch(address)) as Pool;
  }

  async fetchReferral(user: PublicKey): Promise<Referral> {
    const referral = this.getReferralPda(user);
    return (await this.accounts.referral.fetch(referral)) as Referral;
  }

  async fetchInviterStats(inviter: PublicKey): Promise<InviterStats> {
    const stats = this.getInviterStatsPda(inviter);
    return (await this.accounts.inviterStats.fetch(stats)) as InviterStats;
  }

  async fetchAllPools(): Promise<{ publicKey: PublicKey; account: Pool }[]> {
    const accounts = await this.accounts.pool.all();
    return accounts as { publicKey: PublicKey; account: Pool }[];
  }

  // ---------------------------------------------------------------------------
  // Instructions - Admin
  // ---------------------------------------------------------------------------

  async initialize(
    admin: PublicKey,
    treasury: PublicKey,
    params: Partial<InitializeParams> = {}
  ): Promise<TransactionInstruction> {
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
        systemProgram: SystemProgram.programId,
      })
      .instruction();
  }

  async updateConfig(
    admin: PublicKey,
    params: Partial<UpdateConfigParams> = {}
  ): Promise<TransactionInstruction> {
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

  async setCreator(
    authority: PublicKey,
    postId: string,
    creator: PublicKey
  ): Promise<TransactionInstruction> {
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

  async createPool(
    curator: PublicKey,
    treasury: PublicKey,
    params: CreatePoolParams
  ): Promise<TransactionInstruction> {
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
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .instruction();
  }

  // ---------------------------------------------------------------------------
  // Instructions - Trading
  // ---------------------------------------------------------------------------

  private buildTradeAccounts(
    user: PublicKey,
    postId: string,
    treasury: PublicKey,
    curatorPubkey: PublicKey
  ) {
    const addrs = this.derivePoolAddresses(postId);
    return {
      user,
      config: addrs.config,
      pool: addrs.pool,
      tokenMint: addrs.tokenMint,
      poolTokenVault: addrs.poolTokenVault,
      poolSolVault: addrs.poolSolVault,
      userTokenAccount: findAssociatedTokenAddress(user, addrs.tokenMint),
      treasury,
      curator: curatorPubkey,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    };
  }

  async swap(
    user: PublicKey,
    postId: string,
    treasury: PublicKey,
    curator: PublicKey,
    params: SwapParams
  ): Promise<TransactionInstruction> {
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

  async buy(
    user: PublicKey,
    postId: string,
    treasury: PublicKey,
    curator: PublicKey,
    params: BuyParams
  ): Promise<TransactionInstruction> {
    const accounts = this.buildTradeAccounts(user, postId, treasury, curator);
    return await this.program.methods
      .buy({
        solAmount: params.solAmount,
        minTokensOut: params.minTokensOut,
      })
      .accountsStrict(accounts)
      .instruction();
  }

  async sell(
    user: PublicKey,
    postId: string,
    treasury: PublicKey,
    curator: PublicKey,
    params: SellParams
  ): Promise<TransactionInstruction> {
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

  async claimCreatorFees(
    creator: PublicKey,
    postId: string
  ): Promise<TransactionInstruction> {
    const pool = this.getPoolPda(postId);
    const poolSolVault = this.getPoolSolVaultPda(pool);
    return await this.program.methods
      .claimCreatorFees()
      .accountsStrict({
        creator,
        pool,
        poolSolVault,
        systemProgram: SystemProgram.programId,
      })
      .instruction();
  }

  async claimCuratorFees(
    curator: PublicKey,
    postId: string
  ): Promise<TransactionInstruction> {
    const pool = this.getPoolPda(postId);
    const poolSolVault = this.getPoolSolVaultPda(pool);
    return await this.program.methods
      .claimCuratorFees()
      .accountsStrict({
        curator,
        pool,
        poolSolVault,
        systemProgram: SystemProgram.programId,
      })
      .instruction();
  }

  async claimInviterFees(inviter: PublicKey): Promise<TransactionInstruction> {
    const inviterStats = this.getInviterStatsPda(inviter);
    const feeVault = this.getFeeVaultPda();
    return await this.program.methods
      .claimInviterFees()
      .accountsStrict({
        inviter,
        inviterStats,
        feeVault,
        systemProgram: SystemProgram.programId,
      })
      .instruction();
  }

  // ---------------------------------------------------------------------------
  // Instructions - Referral
  // ---------------------------------------------------------------------------

  async registerReferral(
    user: PublicKey,
    inviter: PublicKey
  ): Promise<TransactionInstruction> {
    const referral = this.getReferralPda(user);
    const inviterStats = this.getInviterStatsPda(inviter);
    return await this.program.methods
      .registerReferral()
      .accountsStrict({
        user,
        inviter,
        referral,
        inviterStats,
        systemProgram: SystemProgram.programId,
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
  async buildTransaction(
    payer: PublicKey,
    instructions: TransactionInstruction[]
  ): Promise<VersionedTransaction> {
    const { blockhash } = await this.connection.getLatestBlockhash();
    const message = new TransactionMessage({
      payerKey: payer,
      recentBlockhash: blockhash,
      instructions,
    }).compileToV0Message();
    return new VersionedTransaction(message);
  }
}

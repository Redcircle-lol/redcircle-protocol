import * as anchor from "@coral-xyz/anchor";
import {
  Connection,
  ComputeBudgetProgram,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import {
  PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "./constants";
import {
  derivePoolAddresses,
  findAssociatedTokenAddress,
  findBinPda,
  findConfigPda,
  findMarketStatePda,
  findPoolPda,
  findPoolSolVaultPda,
  findPositionPda,
  findTokenMintPda,
} from "./pda";
import {
  AddLiquidityParams,
  Bin,
  BuyParams,
  Config,
  CreatePoolParams,
  InitBinParams,
  InitializeParams,
  MarketState,
  MigratePoolParams,
  Pool,
  Position,
  RemoveLiquidityParams,
  SellParams,
  SetPoolStatusParams,
  SwapParams,
  UpdateConfigParams,
} from "./types";
import idl from "./idl";

export interface RedCircleClientOpts {
  programId?: PublicKey;
}

export interface SwapAccountParams {
  user: PublicKey;
  postId: string;
  treasury: PublicKey;
  curator: PublicKey;
  activeBin?: PublicKey | null;
}

export interface BuildTransactionOpts {
  computeUnitLimit?: number;
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

  getConfigPda(): PublicKey {
    return findConfigPda(this.programId)[0];
  }

  getPoolPda(postId: string): PublicKey {
    return findPoolPda(postId, this.programId)[0];
  }

  getMarketStatePda(pool: PublicKey): PublicKey {
    return findMarketStatePda(pool, this.programId)[0];
  }

  getTokenMintPda(pool: PublicKey): PublicKey {
    return findTokenMintPda(pool, this.programId)[0];
  }

  getPoolSolVaultPda(pool: PublicKey): PublicKey {
    return findPoolSolVaultPda(pool, this.programId)[0];
  }

  getBinPda(pool: PublicKey, binId: number): PublicKey {
    return findBinPda(pool, binId, this.programId)[0];
  }

  getPositionPda(
    pool: PublicKey,
    owner: PublicKey,
    lowerBinId: number,
    upperBinId: number
  ): PublicKey {
    return findPositionPda(
      pool,
      owner,
      lowerBinId,
      upperBinId,
      this.programId
    )[0];
  }

  derivePoolAddresses(postId: string) {
    return derivePoolAddresses(postId, this.programId);
  }

  private get accounts() {
    return this.program.account as any;
  }

  async fetchConfig(): Promise<Config> {
    return (await this.accounts.config.fetch(this.getConfigPda())) as Config;
  }

  async fetchPool(postId: string): Promise<Pool> {
    return this.fetchPoolByAddress(this.getPoolPda(postId));
  }

  async fetchPoolByAddress(address: PublicKey): Promise<Pool> {
    return (await this.accounts.pool.fetch(address)) as Pool;
  }

  async fetchMarketState(postId: string): Promise<MarketState> {
    const pool = this.getPoolPda(postId);
    return this.fetchMarketStateByAddress(this.getMarketStatePda(pool));
  }

  async fetchMarketStateByAddress(address: PublicKey): Promise<MarketState> {
    return (await this.accounts.marketState.fetch(address)) as MarketState;
  }

  async fetchBin(pool: PublicKey, binId: number): Promise<Bin> {
    return (await this.accounts.bin.fetch(this.getBinPda(pool, binId))) as Bin;
  }

  async fetchPosition(
    pool: PublicKey,
    owner: PublicKey,
    lowerBinId: number,
    upperBinId: number
  ): Promise<Position> {
    return (await this.accounts.position.fetch(
      this.getPositionPda(pool, owner, lowerBinId, upperBinId)
    )) as Position;
  }

  async fetchAllPools(): Promise<{ publicKey: PublicKey; account: Pool }[]> {
    return (await this.accounts.pool.all()) as {
      publicKey: PublicKey;
      account: Pool;
    }[];
  }

  async initialize(
    admin: PublicKey,
    treasury: PublicKey,
    params: Partial<InitializeParams> = {}
  ): Promise<TransactionInstruction> {
    return await this.program.methods
      .initialize({
        sigmoidFloorPrice: params.sigmoidFloorPrice ?? null,
        sigmoidCapPrice: params.sigmoidCapPrice ?? null,
        poolCreationFee: params.poolCreationFee ?? null,
        launchProtectionDuration: params.launchProtectionDuration ?? null,
        maxBuyDuringProtection: params.maxBuyDuringProtection ?? null,
      })
      .accountsStrict({
        admin,
        treasury,
        config: this.getConfigPda(),
        systemProgram: SystemProgram.programId,
      })
      .instruction();
  }

  async updateConfig(
    admin: PublicKey,
    params: Partial<UpdateConfigParams> = {}
  ): Promise<TransactionInstruction> {
    return await this.program.methods
      .updateConfig({
        newAdmin: params.newAdmin ?? null,
        newTreasury: params.newTreasury ?? null,
        isPaused: params.isPaused ?? null,
        defaultSigmoidFloorPrice: params.defaultSigmoidFloorPrice ?? null,
        defaultSigmoidCapPrice: params.defaultSigmoidCapPrice ?? null,
        poolCreationFee: params.poolCreationFee ?? null,
        launchProtectionDuration: params.launchProtectionDuration ?? null,
        maxBuyDuringProtection: params.maxBuyDuringProtection ?? null,
      })
      .accountsStrict({
        admin,
        config: this.getConfigPda(),
      })
      .instruction();
  }

  async setCreator(
    authority: PublicKey,
    postId: string,
    creator: PublicKey
  ): Promise<TransactionInstruction> {
    return await this.program.methods
      .setCreator()
      .accountsStrict({
        authority,
        pool: this.getPoolPda(postId),
        config: this.getConfigPda(),
        creator,
      })
      .instruction();
  }

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
        tokenSupply: params.tokenSupply ?? null,
        sigmoidFloorPrice: params.sigmoidFloorPrice ?? null,
        sigmoidCapPrice: params.sigmoidCapPrice ?? null,
        sigmoidMidpointSupply: params.sigmoidMidpointSupply ?? null,
        sigmoidSteepnessBps: params.sigmoidSteepnessBps ?? null,
        migrationSupplyThresholdBps: params.migrationSupplyThresholdBps ?? null,
        migrationMinSolReserve: params.migrationMinSolReserve ?? null,
        dlmmBinStepBps: params.dlmmBinStepBps ?? null,
      })
      .accountsStrict({
        curator,
        config: addrs.config,
        pool: addrs.pool,
        marketState: addrs.marketState,
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

  async migratePool(
    authority: PublicKey,
    postId: string,
    params: MigratePoolParams
  ): Promise<TransactionInstruction> {
    const addrs = this.derivePoolAddresses(postId);
    return await this.program.methods
      .migratePool(params)
      .accountsStrict({
        authority,
        config: addrs.config,
        pool: addrs.pool,
        marketState: addrs.marketState,
      })
      .instruction();
  }

  async initBin(
    authority: PublicKey,
    postId: string,
    params: InitBinParams
  ): Promise<TransactionInstruction> {
    const addrs = this.derivePoolAddresses(postId);
    return await this.program.methods
      .initBin(params)
      .accountsStrict({
        authority,
        config: addrs.config,
        pool: addrs.pool,
        marketState: addrs.marketState,
        bin: this.getBinPda(addrs.pool, params.binId),
        systemProgram: SystemProgram.programId,
      })
      .instruction();
  }

  async addLiquidity(
    authority: PublicKey,
    postId: string,
    binId: number,
    params: AddLiquidityParams
  ): Promise<TransactionInstruction> {
    const addrs = this.derivePoolAddresses(postId);
    return await this.program.methods
      .addLiquidity(params)
      .accountsStrict({
        authority,
        config: addrs.config,
        pool: addrs.pool,
        marketState: addrs.marketState,
        bin: this.getBinPda(addrs.pool, binId),
        tokenMint: addrs.tokenMint,
        poolTokenVault: addrs.poolTokenVault,
        poolSolVault: addrs.poolSolVault,
        authorityTokenAccount: findAssociatedTokenAddress(
          authority,
          addrs.tokenMint
        ),
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .instruction();
  }

  async removeLiquidity(
    authority: PublicKey,
    postId: string,
    binId: number,
    params: RemoveLiquidityParams
  ): Promise<TransactionInstruction> {
    const addrs = this.derivePoolAddresses(postId);
    return await this.program.methods
      .removeLiquidity(params)
      .accountsStrict({
        authority,
        config: addrs.config,
        pool: addrs.pool,
        marketState: addrs.marketState,
        bin: this.getBinPda(addrs.pool, binId),
        tokenMint: addrs.tokenMint,
        poolTokenVault: addrs.poolTokenVault,
        poolSolVault: addrs.poolSolVault,
        authorityTokenAccount: findAssociatedTokenAddress(
          authority,
          addrs.tokenMint
        ),
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .instruction();
  }

  async setPoolStatus(
    admin: PublicKey,
    postId: string,
    params: SetPoolStatusParams
  ): Promise<TransactionInstruction> {
    const addrs = this.derivePoolAddresses(postId);
    return await this.program.methods
      .setPoolStatus(params)
      .accountsStrict({
        admin,
        config: addrs.config,
        pool: addrs.pool,
      })
      .instruction();
  }

  private buildSwapAccounts(params: SwapAccountParams) {
    const addrs = this.derivePoolAddresses(params.postId);
    return {
      user: params.user,
      config: addrs.config,
      pool: addrs.pool,
      marketState: addrs.marketState,
      tokenMint: addrs.tokenMint,
      poolTokenVault: addrs.poolTokenVault,
      poolSolVault: addrs.poolSolVault,
      activeBin: params.activeBin ?? null,
      userTokenAccount: findAssociatedTokenAddress(
        params.user,
        addrs.tokenMint
      ),
      treasury: params.treasury,
      curator: params.curator,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    };
  }

  async swap(
    accounts: SwapAccountParams,
    params: SwapParams
  ): Promise<TransactionInstruction> {
    return await this.program.methods
      .swap(params)
      .accountsStrict(this.buildSwapAccounts(accounts) as any)
      .instruction();
  }

  async buy(
    accounts: Omit<SwapAccountParams, "activeBin"> & {
      activeBin?: PublicKey | null;
    },
    params: BuyParams
  ): Promise<TransactionInstruction> {
    return this.swap(accounts, {
      amountIn: params.solAmount,
      minimumAmountOut: params.minTokensOut,
      isBuy: true,
    });
  }

  async sell(
    accounts: Omit<SwapAccountParams, "activeBin"> & {
      activeBin?: PublicKey | null;
    },
    params: SellParams
  ): Promise<TransactionInstruction> {
    return this.swap(accounts, {
      amountIn: params.tokenAmount,
      minimumAmountOut: params.minSolOut,
      isBuy: false,
    });
  }

  async claimCreatorFees(
    creator: PublicKey,
    postId: string
  ): Promise<TransactionInstruction> {
    const pool = this.getPoolPda(postId);
    return await this.program.methods
      .claimCreatorFees()
      .accountsStrict({
        creator,
        pool,
        poolSolVault: this.getPoolSolVaultPda(pool),
        systemProgram: SystemProgram.programId,
      })
      .instruction();
  }

  async claimCuratorFees(
    curator: PublicKey,
    postId: string
  ): Promise<TransactionInstruction> {
    const pool = this.getPoolPda(postId);
    return await this.program.methods
      .claimCuratorFees()
      .accountsStrict({
        curator,
        pool,
        poolSolVault: this.getPoolSolVaultPda(pool),
        systemProgram: SystemProgram.programId,
      })
      .instruction();
  }

  async claimGrowthFees(
    admin: PublicKey,
    postId: string,
    growthRecipient: PublicKey
  ): Promise<TransactionInstruction> {
    const pool = this.getPoolPda(postId);
    return await this.program.methods
      .claimGrowthFees()
      .accountsStrict({
        admin,
        config: this.getConfigPda(),
        pool,
        poolSolVault: this.getPoolSolVaultPda(pool),
        growthRecipient,
        systemProgram: SystemProgram.programId,
      })
      .instruction();
  }

  async buildTransaction(
    payer: PublicKey,
    instructions: TransactionInstruction[],
    opts: BuildTransactionOpts = {}
  ): Promise<VersionedTransaction> {
    const { blockhash } = await this.connection.getLatestBlockhash();
    const finalInstructions = [...instructions];
    if (opts.computeUnitLimit != null) {
      finalInstructions.unshift(
        ComputeBudgetProgram.setComputeUnitLimit({
          units: opts.computeUnitLimit,
        })
      );
    }
    const message = new TransactionMessage({
      payerKey: payer,
      recentBlockhash: blockhash,
      instructions: finalInstructions,
    }).compileToV0Message();
    return new VersionedTransaction(message);
  }
}

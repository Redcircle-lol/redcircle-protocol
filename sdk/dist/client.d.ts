import * as anchor from "@coral-xyz/anchor";
import { Connection, PublicKey, TransactionInstruction, VersionedTransaction } from "@solana/web3.js";
import { Config, Pool, Referral, InviterStats, CreatePoolParams, BuyParams, SellParams, SwapParams, InitializeParams, UpdateConfigParams } from "./types";
export interface RedCircleClientOpts {
    programId?: PublicKey;
}
export declare class RedCircleClient {
    readonly program: anchor.Program<any>;
    readonly connection: Connection;
    readonly programId: PublicKey;
    constructor(provider: anchor.AnchorProvider, opts?: RedCircleClientOpts);
    getConfigPda(): PublicKey;
    getPoolPda(postId: string): PublicKey;
    getTokenMintPda(pool: PublicKey): PublicKey;
    getPoolSolVaultPda(pool: PublicKey): PublicKey;
    getFeeVaultPda(): PublicKey;
    getReferralPda(user: PublicKey): PublicKey;
    getInviterStatsPda(inviter: PublicKey): PublicKey;
    derivePoolAddresses(postId: string): {
        pool: anchor.web3.PublicKey;
        tokenMint: anchor.web3.PublicKey;
        poolSolVault: anchor.web3.PublicKey;
        poolTokenVault: anchor.web3.PublicKey;
        config: anchor.web3.PublicKey;
    };
    private get accounts();
    fetchConfig(): Promise<Config>;
    fetchPool(postId: string): Promise<Pool>;
    fetchPoolByAddress(address: PublicKey): Promise<Pool>;
    fetchReferral(user: PublicKey): Promise<Referral>;
    fetchInviterStats(inviter: PublicKey): Promise<InviterStats>;
    fetchAllPools(): Promise<{
        publicKey: PublicKey;
        account: Pool;
    }[]>;
    initialize(admin: PublicKey, treasury: PublicKey, params?: Partial<InitializeParams>): Promise<TransactionInstruction>;
    updateConfig(admin: PublicKey, params?: Partial<UpdateConfigParams>): Promise<TransactionInstruction>;
    setCreator(authority: PublicKey, postId: string, creator: PublicKey): Promise<TransactionInstruction>;
    createPool(curator: PublicKey, treasury: PublicKey, params: CreatePoolParams): Promise<TransactionInstruction>;
    private buildTradeAccounts;
    swap(user: PublicKey, postId: string, treasury: PublicKey, curator: PublicKey, params: SwapParams): Promise<TransactionInstruction>;
    buy(user: PublicKey, postId: string, treasury: PublicKey, curator: PublicKey, params: BuyParams): Promise<TransactionInstruction>;
    sell(user: PublicKey, postId: string, treasury: PublicKey, curator: PublicKey, params: SellParams): Promise<TransactionInstruction>;
    claimCreatorFees(creator: PublicKey, postId: string): Promise<TransactionInstruction>;
    claimCuratorFees(curator: PublicKey, postId: string): Promise<TransactionInstruction>;
    claimInviterFees(inviter: PublicKey): Promise<TransactionInstruction>;
    registerReferral(user: PublicKey, inviter: PublicKey): Promise<TransactionInstruction>;
    /**
     * Build a versioned transaction from instructions, using latest blockhash.
     * The caller can then sign + send it.
     */
    buildTransaction(payer: PublicKey, instructions: TransactionInstruction[]): Promise<VersionedTransaction>;
}
//# sourceMappingURL=client.d.ts.map
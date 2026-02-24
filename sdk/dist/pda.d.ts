import { PublicKey } from "@solana/web3.js";
export declare function findConfigPda(programId?: PublicKey): [PublicKey, number];
export declare function findPoolPda(postId: string, programId?: PublicKey): [PublicKey, number];
export declare function findTokenMintPda(pool: PublicKey, programId?: PublicKey): [PublicKey, number];
export declare function findPoolSolVaultPda(pool: PublicKey, programId?: PublicKey): [PublicKey, number];
export declare function findFeeVaultPda(programId?: PublicKey): [PublicKey, number];
export declare function findReferralPda(user: PublicKey, programId?: PublicKey): [PublicKey, number];
export declare function findInviterStatsPda(inviter: PublicKey, programId?: PublicKey): [PublicKey, number];
export declare function findAssociatedTokenAddress(owner: PublicKey, mint: PublicKey): PublicKey;
/** Derive all PDAs needed for a pool given its postId. */
export declare function derivePoolAddresses(postId: string, programId?: PublicKey): {
    pool: PublicKey;
    tokenMint: PublicKey;
    poolSolVault: PublicKey;
    poolTokenVault: PublicKey;
    config: PublicKey;
};
//# sourceMappingURL=pda.d.ts.map
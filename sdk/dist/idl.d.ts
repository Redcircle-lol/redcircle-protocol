/** Auto-generated IDL export for the RedCircle Protocol program. */
declare const IDL: {
    readonly address: "8vdyo4hfP1ZjmnnEuGrqhHNupt2ZjZ7LmfRtU4kCXS5L";
    readonly metadata: {
        readonly name: "redcircle_protocol";
        readonly version: "0.1.0";
        readonly spec: "0.1.0";
        readonly description: "RedCircle Protocol - Tokenize and trade social media posts on Solana";
    };
    readonly instructions: readonly [{
        readonly name: "buy";
        readonly docs: readonly ["Simplified buy instruction (SOL -> Token)"];
        readonly discriminator: readonly [102, 6, 61, 18, 1, 218, 235, 234];
        readonly accounts: readonly [{
            readonly name: "user";
            readonly writable: true;
            readonly signer: true;
        }, {
            readonly name: "config";
            readonly writable: true;
            readonly pda: {
                readonly seeds: readonly [{
                    readonly kind: "const";
                    readonly value: readonly [99, 111, 110, 102, 105, 103];
                }];
            };
        }, {
            readonly name: "pool";
            readonly writable: true;
            readonly pda: {
                readonly seeds: readonly [{
                    readonly kind: "const";
                    readonly value: readonly [112, 111, 111, 108];
                }, {
                    readonly kind: "account";
                    readonly path: "pool.post_id";
                    readonly account: "Pool";
                }];
            };
        }, {
            readonly name: "token_mint";
        }, {
            readonly name: "pool_token_vault";
            readonly writable: true;
            readonly pda: {
                readonly seeds: readonly [{
                    readonly kind: "account";
                    readonly path: "pool";
                }, {
                    readonly kind: "const";
                    readonly value: readonly [6, 221, 246, 225, 215, 101, 161, 147, 217, 203, 225, 70, 206, 235, 121, 172, 28, 180, 133, 237, 95, 91, 55, 145, 58, 140, 245, 133, 126, 255, 0, 169];
                }, {
                    readonly kind: "account";
                    readonly path: "token_mint";
                }];
                readonly program: {
                    readonly kind: "const";
                    readonly value: readonly [140, 151, 37, 143, 78, 36, 137, 241, 187, 61, 16, 41, 20, 142, 13, 131, 11, 90, 19, 153, 218, 255, 16, 132, 4, 142, 123, 216, 219, 233, 248, 89];
                };
            };
        }, {
            readonly name: "pool_sol_vault";
            readonly writable: true;
            readonly pda: {
                readonly seeds: readonly [{
                    readonly kind: "const";
                    readonly value: readonly [115, 111, 108, 95, 118, 97, 117, 108, 116];
                }, {
                    readonly kind: "account";
                    readonly path: "pool";
                }];
            };
        }, {
            readonly name: "user_token_account";
            readonly writable: true;
            readonly pda: {
                readonly seeds: readonly [{
                    readonly kind: "account";
                    readonly path: "user";
                }, {
                    readonly kind: "const";
                    readonly value: readonly [6, 221, 246, 225, 215, 101, 161, 147, 217, 203, 225, 70, 206, 235, 121, 172, 28, 180, 133, 237, 95, 91, 55, 145, 58, 140, 245, 133, 126, 255, 0, 169];
                }, {
                    readonly kind: "account";
                    readonly path: "token_mint";
                }];
                readonly program: {
                    readonly kind: "const";
                    readonly value: readonly [140, 151, 37, 143, 78, 36, 137, 241, 187, 61, 16, 41, 20, 142, 13, 131, 11, 90, 19, 153, 218, 255, 16, 132, 4, 142, 123, 216, 219, 233, 248, 89];
                };
            };
        }, {
            readonly name: "treasury";
            readonly writable: true;
        }, {
            readonly name: "curator";
            readonly writable: true;
        }, {
            readonly name: "token_program";
            readonly address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
        }, {
            readonly name: "associated_token_program";
            readonly address: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL";
        }, {
            readonly name: "system_program";
            readonly address: "11111111111111111111111111111111";
        }];
        readonly args: readonly [{
            readonly name: "params";
            readonly type: {
                readonly defined: {
                    readonly name: "BuyParams";
                };
            };
        }];
    }, {
        readonly name: "claim_creator_fees";
        readonly docs: readonly ["Claim accumulated creator fees from a pool", "Only callable by verified creator of the post"];
        readonly discriminator: readonly [0, 23, 125, 234, 156, 118, 134, 89];
        readonly accounts: readonly [{
            readonly name: "creator";
            readonly docs: readonly ["The creator claiming fees (must be verified)"];
            readonly writable: true;
            readonly signer: true;
        }, {
            readonly name: "pool";
            readonly docs: readonly ["The pool to claim from"];
            readonly writable: true;
            readonly pda: {
                readonly seeds: readonly [{
                    readonly kind: "const";
                    readonly value: readonly [112, 111, 111, 108];
                }, {
                    readonly kind: "account";
                    readonly path: "pool.post_id";
                    readonly account: "Pool";
                }];
            };
        }, {
            readonly name: "pool_sol_vault";
            readonly docs: readonly ["Pool's SOL vault"];
            readonly writable: true;
            readonly pda: {
                readonly seeds: readonly [{
                    readonly kind: "const";
                    readonly value: readonly [115, 111, 108, 95, 118, 97, 117, 108, 116];
                }, {
                    readonly kind: "account";
                    readonly path: "pool";
                }];
            };
        }, {
            readonly name: "system_program";
            readonly address: "11111111111111111111111111111111";
        }];
        readonly args: readonly [];
    }, {
        readonly name: "claim_curator_fees";
        readonly docs: readonly ["Claim accumulated curator fees from a pool", "Only callable by the curator who tokenized the post"];
        readonly discriminator: readonly [106, 117, 99, 225, 132, 67, 27, 207];
        readonly accounts: readonly [{
            readonly name: "curator";
            readonly docs: readonly ["The curator claiming fees"];
            readonly writable: true;
            readonly signer: true;
        }, {
            readonly name: "pool";
            readonly docs: readonly ["The pool to claim from"];
            readonly writable: true;
            readonly pda: {
                readonly seeds: readonly [{
                    readonly kind: "const";
                    readonly value: readonly [112, 111, 111, 108];
                }, {
                    readonly kind: "account";
                    readonly path: "pool.post_id";
                    readonly account: "Pool";
                }];
            };
        }, {
            readonly name: "pool_sol_vault";
            readonly docs: readonly ["Pool's SOL vault"];
            readonly writable: true;
            readonly pda: {
                readonly seeds: readonly [{
                    readonly kind: "const";
                    readonly value: readonly [115, 111, 108, 95, 118, 97, 117, 108, 116];
                }, {
                    readonly kind: "account";
                    readonly path: "pool";
                }];
            };
        }, {
            readonly name: "system_program";
            readonly address: "11111111111111111111111111111111";
        }];
        readonly args: readonly [];
    }, {
        readonly name: "claim_inviter_fees";
        readonly docs: readonly ["Claim accumulated inviter fees", "Only callable by the inviter who referred a user"];
        readonly discriminator: readonly [175, 209, 227, 196, 151, 232, 152, 169];
        readonly accounts: readonly [{
            readonly name: "inviter";
            readonly docs: readonly ["The inviter claiming fees"];
            readonly writable: true;
            readonly signer: true;
        }, {
            readonly name: "inviter_stats";
            readonly docs: readonly ["Inviter's stats account"];
            readonly writable: true;
            readonly pda: {
                readonly seeds: readonly [{
                    readonly kind: "const";
                    readonly value: readonly [105, 110, 118, 105, 116, 101, 114, 95, 115, 116, 97, 116, 115];
                }, {
                    readonly kind: "account";
                    readonly path: "inviter";
                }];
            };
        }, {
            readonly name: "fee_vault";
            readonly docs: readonly ["Fee vault that holds accumulated inviter fees"];
            readonly writable: true;
            readonly pda: {
                readonly seeds: readonly [{
                    readonly kind: "const";
                    readonly value: readonly [102, 101, 101, 95, 118, 97, 117, 108, 116];
                }];
            };
        }, {
            readonly name: "system_program";
            readonly address: "11111111111111111111111111111111";
        }];
        readonly args: readonly [];
    }, {
        readonly name: "create_pool";
        readonly docs: readonly ["Create a new pool for a post (tokenize the post)", "Anyone can call this to tokenize a post and become a curator"];
        readonly discriminator: readonly [233, 146, 209, 142, 207, 104, 64, 188];
        readonly accounts: readonly [{
            readonly name: "curator";
            readonly docs: readonly ["The curator who is tokenizing this post"];
            readonly writable: true;
            readonly signer: true;
        }, {
            readonly name: "config";
            readonly docs: readonly ["Global protocol configuration"];
            readonly writable: true;
            readonly pda: {
                readonly seeds: readonly [{
                    readonly kind: "const";
                    readonly value: readonly [99, 111, 110, 102, 105, 103];
                }];
            };
        }, {
            readonly name: "pool";
            readonly docs: readonly ["The pool account for this post"];
            readonly writable: true;
            readonly pda: {
                readonly seeds: readonly [{
                    readonly kind: "const";
                    readonly value: readonly [112, 111, 111, 108];
                }, {
                    readonly kind: "arg";
                    readonly path: "params.post_id";
                }];
            };
        }, {
            readonly name: "token_mint";
            readonly docs: readonly ["The token mint for this pool's RPT token"];
            readonly writable: true;
            readonly pda: {
                readonly seeds: readonly [{
                    readonly kind: "const";
                    readonly value: readonly [108, 112, 95, 109, 105, 110, 116];
                }, {
                    readonly kind: "account";
                    readonly path: "pool";
                }];
            };
        }, {
            readonly name: "pool_token_vault";
            readonly docs: readonly ["Pool's token vault to hold unminted/unsold tokens"];
            readonly writable: true;
            readonly pda: {
                readonly seeds: readonly [{
                    readonly kind: "account";
                    readonly path: "pool";
                }, {
                    readonly kind: "const";
                    readonly value: readonly [6, 221, 246, 225, 215, 101, 161, 147, 217, 203, 225, 70, 206, 235, 121, 172, 28, 180, 133, 237, 95, 91, 55, 145, 58, 140, 245, 133, 126, 255, 0, 169];
                }, {
                    readonly kind: "account";
                    readonly path: "token_mint";
                }];
                readonly program: {
                    readonly kind: "const";
                    readonly value: readonly [140, 151, 37, 143, 78, 36, 137, 241, 187, 61, 16, 41, 20, 142, 13, 131, 11, 90, 19, 153, 218, 255, 16, 132, 4, 142, 123, 216, 219, 233, 248, 89];
                };
            };
        }, {
            readonly name: "pool_sol_vault";
            readonly docs: readonly ["Pool's SOL vault (PDA that holds collected SOL)"];
            readonly writable: true;
            readonly pda: {
                readonly seeds: readonly [{
                    readonly kind: "const";
                    readonly value: readonly [115, 111, 108, 95, 118, 97, 117, 108, 116];
                }, {
                    readonly kind: "account";
                    readonly path: "pool";
                }];
            };
        }, {
            readonly name: "treasury";
            readonly docs: readonly ["Treasury to receive pool creation fee (if any)"];
            readonly writable: true;
        }, {
            readonly name: "token_program";
            readonly address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
        }, {
            readonly name: "associated_token_program";
            readonly address: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL";
        }, {
            readonly name: "system_program";
            readonly address: "11111111111111111111111111111111";
        }];
        readonly args: readonly [{
            readonly name: "params";
            readonly type: {
                readonly defined: {
                    readonly name: "CreatePoolParams";
                };
            };
        }];
    }, {
        readonly name: "initialize";
        readonly docs: readonly ["Initialize the protocol with global configuration"];
        readonly discriminator: readonly [175, 175, 109, 31, 13, 152, 155, 237];
        readonly accounts: readonly [{
            readonly name: "admin";
            readonly writable: true;
            readonly signer: true;
        }, {
            readonly name: "treasury";
            readonly docs: readonly ["The treasury wallet that receives platform fees"];
        }, {
            readonly name: "config";
            readonly writable: true;
            readonly pda: {
                readonly seeds: readonly [{
                    readonly kind: "const";
                    readonly value: readonly [99, 111, 110, 102, 105, 103];
                }];
            };
        }, {
            readonly name: "system_program";
            readonly address: "11111111111111111111111111111111";
        }];
        readonly args: readonly [{
            readonly name: "params";
            readonly type: {
                readonly defined: {
                    readonly name: "InitializeParams";
                };
            };
        }];
    }, {
        readonly name: "register_referral";
        readonly docs: readonly ["Register a referral relationship", "A user registers with their inviter (referrer)"];
        readonly discriminator: readonly [158, 196, 134, 102, 193, 102, 184, 86];
        readonly accounts: readonly [{
            readonly name: "user";
            readonly docs: readonly ["The user registering the referral"];
            readonly writable: true;
            readonly signer: true;
        }, {
            readonly name: "inviter";
            readonly docs: readonly ["The inviter (referrer) who invited this user"];
        }, {
            readonly name: "referral";
            readonly docs: readonly ["User's referral account (to be created)"];
            readonly writable: true;
            readonly pda: {
                readonly seeds: readonly [{
                    readonly kind: "const";
                    readonly value: readonly [114, 101, 102, 101, 114, 114, 97, 108];
                }, {
                    readonly kind: "account";
                    readonly path: "user";
                }];
            };
        }, {
            readonly name: "inviter_stats";
            readonly docs: readonly ["Inviter's stats account (create if doesn't exist)"];
            readonly writable: true;
            readonly pda: {
                readonly seeds: readonly [{
                    readonly kind: "const";
                    readonly value: readonly [105, 110, 118, 105, 116, 101, 114, 95, 115, 116, 97, 116, 115];
                }, {
                    readonly kind: "account";
                    readonly path: "inviter";
                }];
            };
        }, {
            readonly name: "system_program";
            readonly address: "11111111111111111111111111111111";
        }];
        readonly args: readonly [];
    }, {
        readonly name: "sell";
        readonly docs: readonly ["Simplified sell instruction (Token -> SOL)"];
        readonly discriminator: readonly [51, 230, 133, 164, 1, 127, 131, 173];
        readonly accounts: readonly [{
            readonly name: "user";
            readonly writable: true;
            readonly signer: true;
        }, {
            readonly name: "config";
            readonly writable: true;
            readonly pda: {
                readonly seeds: readonly [{
                    readonly kind: "const";
                    readonly value: readonly [99, 111, 110, 102, 105, 103];
                }];
            };
        }, {
            readonly name: "pool";
            readonly writable: true;
            readonly pda: {
                readonly seeds: readonly [{
                    readonly kind: "const";
                    readonly value: readonly [112, 111, 111, 108];
                }, {
                    readonly kind: "account";
                    readonly path: "pool.post_id";
                    readonly account: "Pool";
                }];
            };
        }, {
            readonly name: "token_mint";
        }, {
            readonly name: "pool_token_vault";
            readonly writable: true;
            readonly pda: {
                readonly seeds: readonly [{
                    readonly kind: "account";
                    readonly path: "pool";
                }, {
                    readonly kind: "const";
                    readonly value: readonly [6, 221, 246, 225, 215, 101, 161, 147, 217, 203, 225, 70, 206, 235, 121, 172, 28, 180, 133, 237, 95, 91, 55, 145, 58, 140, 245, 133, 126, 255, 0, 169];
                }, {
                    readonly kind: "account";
                    readonly path: "token_mint";
                }];
                readonly program: {
                    readonly kind: "const";
                    readonly value: readonly [140, 151, 37, 143, 78, 36, 137, 241, 187, 61, 16, 41, 20, 142, 13, 131, 11, 90, 19, 153, 218, 255, 16, 132, 4, 142, 123, 216, 219, 233, 248, 89];
                };
            };
        }, {
            readonly name: "pool_sol_vault";
            readonly writable: true;
            readonly pda: {
                readonly seeds: readonly [{
                    readonly kind: "const";
                    readonly value: readonly [115, 111, 108, 95, 118, 97, 117, 108, 116];
                }, {
                    readonly kind: "account";
                    readonly path: "pool";
                }];
            };
        }, {
            readonly name: "user_token_account";
            readonly writable: true;
            readonly pda: {
                readonly seeds: readonly [{
                    readonly kind: "account";
                    readonly path: "user";
                }, {
                    readonly kind: "const";
                    readonly value: readonly [6, 221, 246, 225, 215, 101, 161, 147, 217, 203, 225, 70, 206, 235, 121, 172, 28, 180, 133, 237, 95, 91, 55, 145, 58, 140, 245, 133, 126, 255, 0, 169];
                }, {
                    readonly kind: "account";
                    readonly path: "token_mint";
                }];
                readonly program: {
                    readonly kind: "const";
                    readonly value: readonly [140, 151, 37, 143, 78, 36, 137, 241, 187, 61, 16, 41, 20, 142, 13, 131, 11, 90, 19, 153, 218, 255, 16, 132, 4, 142, 123, 216, 219, 233, 248, 89];
                };
            };
        }, {
            readonly name: "treasury";
            readonly writable: true;
        }, {
            readonly name: "curator";
            readonly writable: true;
        }, {
            readonly name: "token_program";
            readonly address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
        }, {
            readonly name: "associated_token_program";
            readonly address: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL";
        }, {
            readonly name: "system_program";
            readonly address: "11111111111111111111111111111111";
        }];
        readonly args: readonly [{
            readonly name: "params";
            readonly type: {
                readonly defined: {
                    readonly name: "SellParams";
                };
            };
        }];
    }, {
        readonly name: "set_creator";
        readonly docs: readonly ["Set/verify the creator for a pool (post author)"];
        readonly discriminator: readonly [254, 148, 255, 112, 207, 142, 170, 165];
        readonly accounts: readonly [{
            readonly name: "authority";
            readonly docs: readonly ["Admin or authorized verifier"];
            readonly writable: true;
            readonly signer: true;
        }, {
            readonly name: "pool";
            readonly docs: readonly ["The pool to update"];
            readonly writable: true;
            readonly pda: {
                readonly seeds: readonly [{
                    readonly kind: "const";
                    readonly value: readonly [112, 111, 111, 108];
                }, {
                    readonly kind: "account";
                    readonly path: "pool.post_id";
                    readonly account: "Pool";
                }];
            };
        }, {
            readonly name: "config";
            readonly docs: readonly ["Global config to verify authority"];
            readonly pda: {
                readonly seeds: readonly [{
                    readonly kind: "const";
                    readonly value: readonly [99, 111, 110, 102, 105, 103];
                }];
            };
        }, {
            readonly name: "creator";
            readonly docs: readonly ["The creator wallet to set"];
        }];
        readonly args: readonly [];
    }, {
        readonly name: "swap";
        readonly discriminator: readonly [248, 198, 158, 145, 225, 117, 135, 200];
        readonly accounts: readonly [{
            readonly name: "user";
            readonly docs: readonly ["The user performing the swap"];
            readonly writable: true;
            readonly signer: true;
        }, {
            readonly name: "config";
            readonly docs: readonly ["Global protocol configuration"];
            readonly writable: true;
            readonly pda: {
                readonly seeds: readonly [{
                    readonly kind: "const";
                    readonly value: readonly [99, 111, 110, 102, 105, 103];
                }];
            };
        }, {
            readonly name: "pool";
            readonly docs: readonly ["The pool being traded"];
            readonly writable: true;
            readonly pda: {
                readonly seeds: readonly [{
                    readonly kind: "const";
                    readonly value: readonly [112, 111, 111, 108];
                }, {
                    readonly kind: "account";
                    readonly path: "pool.post_id";
                    readonly account: "Pool";
                }];
            };
        }, {
            readonly name: "token_mint";
            readonly docs: readonly ["The token mint"];
        }, {
            readonly name: "pool_token_vault";
            readonly docs: readonly ["Pool's token vault"];
            readonly writable: true;
            readonly pda: {
                readonly seeds: readonly [{
                    readonly kind: "account";
                    readonly path: "pool";
                }, {
                    readonly kind: "const";
                    readonly value: readonly [6, 221, 246, 225, 215, 101, 161, 147, 217, 203, 225, 70, 206, 235, 121, 172, 28, 180, 133, 237, 95, 91, 55, 145, 58, 140, 245, 133, 126, 255, 0, 169];
                }, {
                    readonly kind: "account";
                    readonly path: "token_mint";
                }];
                readonly program: {
                    readonly kind: "const";
                    readonly value: readonly [140, 151, 37, 143, 78, 36, 137, 241, 187, 61, 16, 41, 20, 142, 13, 131, 11, 90, 19, 153, 218, 255, 16, 132, 4, 142, 123, 216, 219, 233, 248, 89];
                };
            };
        }, {
            readonly name: "pool_sol_vault";
            readonly docs: readonly ["Pool's SOL vault"];
            readonly writable: true;
            readonly pda: {
                readonly seeds: readonly [{
                    readonly kind: "const";
                    readonly value: readonly [115, 111, 108, 95, 118, 97, 117, 108, 116];
                }, {
                    readonly kind: "account";
                    readonly path: "pool";
                }];
            };
        }, {
            readonly name: "user_token_account";
            readonly docs: readonly ["User's token account"];
            readonly writable: true;
            readonly pda: {
                readonly seeds: readonly [{
                    readonly kind: "account";
                    readonly path: "user";
                }, {
                    readonly kind: "const";
                    readonly value: readonly [6, 221, 246, 225, 215, 101, 161, 147, 217, 203, 225, 70, 206, 235, 121, 172, 28, 180, 133, 237, 95, 91, 55, 145, 58, 140, 245, 133, 126, 255, 0, 169];
                }, {
                    readonly kind: "account";
                    readonly path: "token_mint";
                }];
                readonly program: {
                    readonly kind: "const";
                    readonly value: readonly [140, 151, 37, 143, 78, 36, 137, 241, 187, 61, 16, 41, 20, 142, 13, 131, 11, 90, 19, 153, 218, 255, 16, 132, 4, 142, 123, 216, 219, 233, 248, 89];
                };
            };
        }, {
            readonly name: "treasury";
            readonly docs: readonly ["Protocol treasury for platform fees"];
            readonly writable: true;
        }, {
            readonly name: "curator";
            readonly docs: readonly ["Curator of this pool (receives curator fees)"];
            readonly writable: true;
        }, {
            readonly name: "token_program";
            readonly address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
        }, {
            readonly name: "associated_token_program";
            readonly address: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL";
        }, {
            readonly name: "system_program";
            readonly address: "11111111111111111111111111111111";
        }];
        readonly args: readonly [{
            readonly name: "params";
            readonly type: {
                readonly defined: {
                    readonly name: "SwapParams";
                };
            };
        }];
    }, {
        readonly name: "update_config";
        readonly docs: readonly ["Update protocol configuration"];
        readonly discriminator: readonly [29, 158, 252, 191, 10, 83, 219, 99];
        readonly accounts: readonly [{
            readonly name: "admin";
            readonly writable: true;
            readonly signer: true;
        }, {
            readonly name: "config";
            readonly writable: true;
            readonly pda: {
                readonly seeds: readonly [{
                    readonly kind: "const";
                    readonly value: readonly [99, 111, 110, 102, 105, 103];
                }];
            };
        }];
        readonly args: readonly [{
            readonly name: "params";
            readonly type: {
                readonly defined: {
                    readonly name: "UpdateConfigParams";
                };
            };
        }];
    }];
    readonly accounts: readonly [{
        readonly name: "Config";
        readonly discriminator: readonly [155, 12, 170, 224, 30, 250, 204, 130];
    }, {
        readonly name: "InviterStats";
        readonly discriminator: readonly [133, 87, 60, 176, 12, 201, 188, 45];
    }, {
        readonly name: "Pool";
        readonly discriminator: readonly [241, 154, 109, 4, 17, 177, 109, 188];
    }, {
        readonly name: "Referral";
        readonly discriminator: readonly [30, 235, 136, 224, 106, 107, 49, 64];
    }];
    readonly errors: readonly [{
        readonly code: 6000;
        readonly name: "Unauthorized";
        readonly msg: "Unauthorized: caller is not the admin";
    }, {
        readonly code: 6001;
        readonly name: "ProtocolPaused";
        readonly msg: "Protocol is currently paused";
    }, {
        readonly code: 6002;
        readonly name: "InvalidAuthority";
        readonly msg: "Invalid authority for this operation";
    }, {
        readonly code: 6003;
        readonly name: "PoolAlreadyExists";
        readonly msg: "Pool already exists for this post";
    }, {
        readonly code: 6004;
        readonly name: "PoolNotActive";
        readonly msg: "Pool is not active";
    }, {
        readonly code: 6005;
        readonly name: "PoolNotTradeable";
        readonly msg: "Pool is not tradeable";
    }, {
        readonly code: 6006;
        readonly name: "PoolAlreadyMigrated";
        readonly msg: "Pool has already migrated";
    }, {
        readonly code: 6007;
        readonly name: "MigrationThresholdNotReached";
        readonly msg: "Pool cannot be migrated yet - threshold not reached";
    }, {
        readonly code: 6008;
        readonly name: "LaunchProtectionActive";
        readonly msg: "Pool is in launch protection period";
    }, {
        readonly code: 6009;
        readonly name: "InvalidPoolStatus";
        readonly msg: "Invalid pool status for this operation";
    }, {
        readonly code: 6010;
        readonly name: "PostIdTooLong";
        readonly msg: "Post ID is too long";
    }, {
        readonly code: 6011;
        readonly name: "PostIdEmpty";
        readonly msg: "Post ID cannot be empty";
    }, {
        readonly code: 6012;
        readonly name: "TradeBelowMinimum";
        readonly msg: "Trade amount is below minimum";
    }, {
        readonly code: 6013;
        readonly name: "TradeExceedsMaximum";
        readonly msg: "Trade amount exceeds maximum";
    }, {
        readonly code: 6014;
        readonly name: "SlippageExceeded";
        readonly msg: "Slippage tolerance exceeded";
    }, {
        readonly code: 6015;
        readonly name: "InsufficientPoolTokens";
        readonly msg: "Insufficient tokens in pool";
    }, {
        readonly code: 6016;
        readonly name: "InsufficientPoolSol";
        readonly msg: "Insufficient SOL in pool";
    }, {
        readonly code: 6017;
        readonly name: "InsufficientBalance";
        readonly msg: "Insufficient user balance";
    }, {
        readonly code: 6018;
        readonly name: "ExceedsSupply";
        readonly msg: "Trade would exceed supply";
    }, {
        readonly code: 6019;
        readonly name: "ZeroAmount";
        readonly msg: "Zero amount not allowed";
    }, {
        readonly code: 6020;
        readonly name: "ExceedsLaunchProtectionLimit";
        readonly msg: "Buy amount exceeds launch protection limit";
    }, {
        readonly code: 6021;
        readonly name: "MathOverflow";
        readonly msg: "Math overflow occurred";
    }, {
        readonly code: 6022;
        readonly name: "MathUnderflow";
        readonly msg: "Math underflow occurred";
    }, {
        readonly code: 6023;
        readonly name: "DivisionByZero";
        readonly msg: "Division by zero";
    }, {
        readonly code: 6024;
        readonly name: "InvalidCalculation";
        readonly msg: "Invalid calculation result";
    }, {
        readonly code: 6025;
        readonly name: "NoFeesToClaim";
        readonly msg: "No fees to claim";
    }, {
        readonly code: 6026;
        readonly name: "InvalidFeeConfig";
        readonly msg: "Invalid fee configuration";
    }, {
        readonly code: 6027;
        readonly name: "FeeCalculationError";
        readonly msg: "Fee calculation error";
    }, {
        readonly code: 6028;
        readonly name: "ReferralAlreadyRegistered";
        readonly msg: "Referral already registered";
    }, {
        readonly code: 6029;
        readonly name: "SelfReferral";
        readonly msg: "Cannot refer yourself";
    }, {
        readonly code: 6030;
        readonly name: "InviterNotFound";
        readonly msg: "Inviter not found";
    }, {
        readonly code: 6031;
        readonly name: "InvalidReferral";
        readonly msg: "Invalid referral";
    }, {
        readonly code: 6032;
        readonly name: "TokenNameTooLong";
        readonly msg: "Token name too long";
    }, {
        readonly code: 6033;
        readonly name: "TokenSymbolTooLong";
        readonly msg: "Token symbol too long";
    }, {
        readonly code: 6034;
        readonly name: "TokenUriTooLong";
        readonly msg: "Token URI too long";
    }, {
        readonly code: 6035;
        readonly name: "InvalidTokenMint";
        readonly msg: "Invalid token mint";
    }, {
        readonly code: 6036;
        readonly name: "InvalidTokenAccount";
        readonly msg: "Invalid token account";
    }, {
        readonly code: 6037;
        readonly name: "InvalidConfig";
        readonly msg: "Invalid configuration value";
    }, {
        readonly code: 6038;
        readonly name: "AlreadyInitialized";
        readonly msg: "Configuration already initialized";
    }, {
        readonly code: 6039;
        readonly name: "InvalidVirtualReserves";
        readonly msg: "Invalid virtual reserves";
    }, {
        readonly code: 6040;
        readonly name: "InvalidMigrationThreshold";
        readonly msg: "Invalid migration threshold";
    }];
    readonly types: readonly [{
        readonly name: "BuyParams";
        readonly type: {
            readonly kind: "struct";
            readonly fields: readonly [{
                readonly name: "sol_amount";
                readonly docs: readonly ["Amount of SOL to spend (in lamports)"];
                readonly type: "u64";
            }, {
                readonly name: "min_tokens_out";
                readonly docs: readonly ["Minimum tokens expected (slippage protection)"];
                readonly type: "u64";
            }];
        };
    }, {
        readonly name: "Config";
        readonly docs: readonly ["Global protocol configuration", "PDA Seed: [\"config\"]"];
        readonly type: {
            readonly kind: "struct";
            readonly fields: readonly [{
                readonly name: "admin";
                readonly type: "pubkey";
            }, {
                readonly name: "treasury";
                readonly type: "pubkey";
            }, {
                readonly name: "is_paused";
                readonly type: "bool";
            }, {
                readonly name: "total_pools";
                readonly type: "u64";
            }, {
                readonly name: "total_volume";
                readonly type: "u128";
            }, {
                readonly name: "total_fees_collected";
                readonly type: "u128";
            }, {
                readonly name: "default_initial_virtual_sol";
                readonly type: "u64";
            }, {
                readonly name: "default_initial_virtual_token";
                readonly type: "u64";
            }, {
                readonly name: "default_migration_threshold";
                readonly type: "u64";
            }, {
                readonly name: "pool_creation_fee";
                readonly type: "u64";
            }, {
                readonly name: "launch_protection_duration";
                readonly type: "i64";
            }, {
                readonly name: "max_buy_during_protection";
                readonly type: "u64";
            }, {
                readonly name: "bump";
                readonly type: "u8";
            }, {
                readonly name: "_reserved";
                readonly type: "bytes";
            }];
        };
    }, {
        readonly name: "CreatePoolParams";
        readonly type: {
            readonly kind: "struct";
            readonly fields: readonly [{
                readonly name: "post_id";
                readonly type: "string";
            }, {
                readonly name: "name";
                readonly type: "string";
            }, {
                readonly name: "symbol";
                readonly type: "string";
            }, {
                readonly name: "uri";
                readonly type: "string";
            }, {
                readonly name: "curve_type";
                readonly type: {
                    readonly option: "u8";
                };
            }, {
                readonly name: "initial_virtual_sol";
                readonly type: {
                    readonly option: "u64";
                };
            }, {
                readonly name: "initial_virtual_token";
                readonly type: {
                    readonly option: "u64";
                };
            }, {
                readonly name: "migration_threshold";
                readonly type: {
                    readonly option: "u64";
                };
            }];
        };
    }, {
        readonly name: "CurveType";
        readonly type: {
            readonly kind: "enum";
            readonly variants: readonly [{
                readonly name: "ConstantProduct";
            }, {
                readonly name: "Linear";
            }, {
                readonly name: "Exponential";
            }];
        };
    }, {
        readonly name: "InitializeParams";
        readonly type: {
            readonly kind: "struct";
            readonly fields: readonly [{
                readonly name: "initial_virtual_sol";
                readonly type: {
                    readonly option: "u64";
                };
            }, {
                readonly name: "initial_virtual_token";
                readonly type: {
                    readonly option: "u64";
                };
            }, {
                readonly name: "migration_threshold";
                readonly type: {
                    readonly option: "u64";
                };
            }, {
                readonly name: "pool_creation_fee";
                readonly type: {
                    readonly option: "u64";
                };
            }, {
                readonly name: "launch_protection_duration";
                readonly type: {
                    readonly option: "i64";
                };
            }, {
                readonly name: "max_buy_during_protection";
                readonly type: {
                    readonly option: "u64";
                };
            }];
        };
    }, {
        readonly name: "InviterStats";
        readonly docs: readonly ["Inviter stats account tracking referral performance", "PDA Seed: [\"inviter_stats\", inviter_wallet.as_bytes()]"];
        readonly type: {
            readonly kind: "struct";
            readonly fields: readonly [{
                readonly name: "inviter";
                readonly type: "pubkey";
            }, {
                readonly name: "total_referrals";
                readonly type: "u64";
            }, {
                readonly name: "total_fees_earned";
                readonly type: "u64";
            }, {
                readonly name: "unclaimed_fees";
                readonly type: "u64";
            }, {
                readonly name: "total_referral_volume";
                readonly type: "u128";
            }, {
                readonly name: "first_referral_at";
                readonly type: "i64";
            }, {
                readonly name: "bump";
                readonly type: "u8";
            }, {
                readonly name: "_reserved";
                readonly type: "bytes";
            }];
        };
    }, {
        readonly name: "Pool";
        readonly docs: readonly ["Red Post Pool - represents a tokenized post", "PDA Seed: [\"pool\", post_id.as_bytes()]"];
        readonly type: {
            readonly kind: "struct";
            readonly fields: readonly [{
                readonly name: "post_id";
                readonly type: "string";
            }, {
                readonly name: "token_mint";
                readonly type: "pubkey";
            }, {
                readonly name: "curator";
                readonly type: "pubkey";
            }, {
                readonly name: "creator";
                readonly type: "pubkey";
            }, {
                readonly name: "status";
                readonly type: {
                    readonly defined: {
                        readonly name: "PoolStatus";
                    };
                };
            }, {
                readonly name: "curve_type";
                readonly type: {
                    readonly defined: {
                        readonly name: "CurveType";
                    };
                };
            }, {
                readonly name: "virtual_sol_reserve";
                readonly type: "u64";
            }, {
                readonly name: "virtual_token_reserve";
                readonly type: "u64";
            }, {
                readonly name: "real_sol_reserve";
                readonly type: "u64";
            }, {
                readonly name: "real_token_reserve";
                readonly type: "u64";
            }, {
                readonly name: "tokens_sold";
                readonly type: "u64";
            }, {
                readonly name: "token_supply";
                readonly type: "u64";
            }, {
                readonly name: "migration_threshold";
                readonly type: "u64";
            }, {
                readonly name: "total_volume";
                readonly type: "u128";
            }, {
                readonly name: "total_fees";
                readonly type: "u64";
            }, {
                readonly name: "unclaimed_creator_fees";
                readonly type: "u64";
            }, {
                readonly name: "unclaimed_curator_fees";
                readonly type: "u64";
            }, {
                readonly name: "created_at";
                readonly type: "i64";
            }, {
                readonly name: "launch_protection_ends_at";
                readonly type: "i64";
            }, {
                readonly name: "migrated_at";
                readonly type: "i64";
            }, {
                readonly name: "bump";
                readonly type: "u8";
            }, {
                readonly name: "token_vault_bump";
                readonly type: "u8";
            }, {
                readonly name: "sol_vault_bump";
                readonly type: "u8";
            }, {
                readonly name: "name";
                readonly type: "string";
            }, {
                readonly name: "symbol";
                readonly type: "string";
            }, {
                readonly name: "uri";
                readonly type: "string";
            }, {
                readonly name: "_reserved";
                readonly type: "bytes";
            }];
        };
    }, {
        readonly name: "PoolStatus";
        readonly type: {
            readonly kind: "enum";
            readonly variants: readonly [{
                readonly name: "Active";
            }, {
                readonly name: "LaunchProtection";
            }, {
                readonly name: "Migrated";
            }, {
                readonly name: "Paused";
            }];
        };
    }, {
        readonly name: "Referral";
        readonly docs: readonly ["Referral account tracking inviter relationships", "PDA Seed: [\"referral\", user_wallet.as_bytes()]"];
        readonly type: {
            readonly kind: "struct";
            readonly fields: readonly [{
                readonly name: "user";
                readonly type: "pubkey";
            }, {
                readonly name: "inviter";
                readonly type: "pubkey";
            }, {
                readonly name: "total_fees_generated";
                readonly type: "u64";
            }, {
                readonly name: "registered_at";
                readonly type: "i64";
            }, {
                readonly name: "total_volume";
                readonly type: "u128";
            }, {
                readonly name: "trade_count";
                readonly type: "u64";
            }, {
                readonly name: "bump";
                readonly type: "u8";
            }, {
                readonly name: "_reserved";
                readonly type: "bytes";
            }];
        };
    }, {
        readonly name: "SellParams";
        readonly type: {
            readonly kind: "struct";
            readonly fields: readonly [{
                readonly name: "token_amount";
                readonly docs: readonly ["Amount of tokens to sell"];
                readonly type: "u64";
            }, {
                readonly name: "min_sol_out";
                readonly docs: readonly ["Minimum SOL expected (slippage protection)"];
                readonly type: "u64";
            }];
        };
    }, {
        readonly name: "SwapParams";
        readonly type: {
            readonly kind: "struct";
            readonly fields: readonly [{
                readonly name: "amount_in";
                readonly docs: readonly ["Amount of input token (SOL lamports or token amount)"];
                readonly type: "u64";
            }, {
                readonly name: "minimum_amount_out";
                readonly docs: readonly ["Minimum amount of output token expected (slippage protection)"];
                readonly type: "u64";
            }, {
                readonly name: "is_buy";
                readonly docs: readonly ["Direction: true = buy (SOL -> Token), false = sell (Token -> SOL)"];
                readonly type: "bool";
            }];
        };
    }, {
        readonly name: "UpdateConfigParams";
        readonly type: {
            readonly kind: "struct";
            readonly fields: readonly [{
                readonly name: "new_admin";
                readonly type: {
                    readonly option: "pubkey";
                };
            }, {
                readonly name: "new_treasury";
                readonly type: {
                    readonly option: "pubkey";
                };
            }, {
                readonly name: "is_paused";
                readonly type: {
                    readonly option: "bool";
                };
            }, {
                readonly name: "default_initial_virtual_sol";
                readonly type: {
                    readonly option: "u64";
                };
            }, {
                readonly name: "default_initial_virtual_token";
                readonly type: {
                    readonly option: "u64";
                };
            }, {
                readonly name: "default_migration_threshold";
                readonly type: {
                    readonly option: "u64";
                };
            }, {
                readonly name: "pool_creation_fee";
                readonly type: {
                    readonly option: "u64";
                };
            }, {
                readonly name: "launch_protection_duration";
                readonly type: {
                    readonly option: "i64";
                };
            }, {
                readonly name: "max_buy_during_protection";
                readonly type: {
                    readonly option: "u64";
                };
            }];
        };
    }];
};
export default IDL;
//# sourceMappingURL=idl.d.ts.map
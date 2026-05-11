/** Auto-generated IDL export for the RedCircle Protocol program. */
const IDL = {
  address: "7rWhaTDG6vnJMTbcPHMLXeebUbFjSLJiN7NLaZtefR9g",
  metadata: {
    name: "redcircle_protocol",
    version: "0.1.0",
    spec: "0.1.0",
    description:
      "RedCircle Protocol - Tokenize and trade social media posts on Solana",
  },
  instructions: [
    {
      name: "add_liquidity",
      docs: ["Add liquidity to a DLMM bin."],
      discriminator: [181, 157, 89, 67, 143, 182, 52, 72],
      accounts: [
        {
          name: "authority",
          writable: true,
          signer: true,
        },
        {
          name: "config",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [99, 111, 110, 102, 105, 103],
              },
            ],
          },
        },
        {
          name: "pool",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [112, 111, 111, 108],
              },
              {
                kind: "account",
                path: "pool.post_id",
                account: "Pool",
              },
            ],
          },
        },
        {
          name: "market_state",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [109, 97, 114, 107, 101, 116],
              },
              {
                kind: "account",
                path: "pool",
              },
            ],
          },
        },
        {
          name: "bin",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [98, 105, 110],
              },
              {
                kind: "account",
                path: "pool",
              },
              {
                kind: "account",
                path: "bin.bin_id",
                account: "Bin",
              },
            ],
          },
        },
        {
          name: "token_mint",
        },
        {
          name: "pool_token_vault",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "account",
                path: "pool",
              },
              {
                kind: "const",
                value: [
                  6, 221, 246, 225, 215, 101, 161, 147, 217, 203, 225, 70, 206,
                  235, 121, 172, 28, 180, 133, 237, 95, 91, 55, 145, 58, 140,
                  245, 133, 126, 255, 0, 169,
                ],
              },
              {
                kind: "account",
                path: "token_mint",
              },
            ],
            program: {
              kind: "const",
              value: [
                140, 151, 37, 143, 78, 36, 137, 241, 187, 61, 16, 41, 20, 142,
                13, 131, 11, 90, 19, 153, 218, 255, 16, 132, 4, 142, 123, 216,
                219, 233, 248, 89,
              ],
            },
          },
        },
        {
          name: "pool_sol_vault",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [115, 111, 108, 95, 118, 97, 117, 108, 116],
              },
              {
                kind: "account",
                path: "pool",
              },
            ],
          },
        },
        {
          name: "authority_token_account",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "account",
                path: "authority",
              },
              {
                kind: "const",
                value: [
                  6, 221, 246, 225, 215, 101, 161, 147, 217, 203, 225, 70, 206,
                  235, 121, 172, 28, 180, 133, 237, 95, 91, 55, 145, 58, 140,
                  245, 133, 126, 255, 0, 169,
                ],
              },
              {
                kind: "account",
                path: "token_mint",
              },
            ],
            program: {
              kind: "const",
              value: [
                140, 151, 37, 143, 78, 36, 137, 241, 187, 61, 16, 41, 20, 142,
                13, 131, 11, 90, 19, 153, 218, 255, 16, 132, 4, 142, 123, 216,
                219, 233, 248, 89,
              ],
            },
          },
        },
        {
          name: "token_program",
          address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
        },
        {
          name: "system_program",
          address: "11111111111111111111111111111111",
        },
      ],
      args: [
        {
          name: "params",
          type: {
            defined: {
              name: "AddLiquidityParams",
            },
          },
        },
      ],
    },
    {
      name: "claim_creator_fees",
      docs: [
        "Claim accumulated creator fees from a pool",
        "Only callable by verified creator of the post",
      ],
      discriminator: [0, 23, 125, 234, 156, 118, 134, 89],
      accounts: [
        {
          name: "creator",
          docs: ["The creator claiming fees (must be verified)"],
          writable: true,
          signer: true,
        },
        {
          name: "pool",
          docs: ["The pool to claim from"],
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [112, 111, 111, 108],
              },
              {
                kind: "account",
                path: "pool.post_id",
                account: "Pool",
              },
            ],
          },
        },
        {
          name: "pool_sol_vault",
          docs: ["Pool's SOL vault"],
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [115, 111, 108, 95, 118, 97, 117, 108, 116],
              },
              {
                kind: "account",
                path: "pool",
              },
            ],
          },
        },
        {
          name: "system_program",
          address: "11111111111111111111111111111111",
        },
      ],
      args: [],
    },
    {
      name: "claim_curator_fees",
      docs: [
        "Claim accumulated curator fees from a pool",
        "Only callable by the curator who tokenized the post",
      ],
      discriminator: [106, 117, 99, 225, 132, 67, 27, 207],
      accounts: [
        {
          name: "curator",
          docs: ["The curator claiming fees"],
          writable: true,
          signer: true,
        },
        {
          name: "pool",
          docs: ["The pool to claim from"],
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [112, 111, 111, 108],
              },
              {
                kind: "account",
                path: "pool.post_id",
                account: "Pool",
              },
            ],
          },
        },
        {
          name: "pool_sol_vault",
          docs: ["Pool's SOL vault"],
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [115, 111, 108, 95, 118, 97, 117, 108, 116],
              },
              {
                kind: "account",
                path: "pool",
              },
            ],
          },
        },
        {
          name: "system_program",
          address: "11111111111111111111111111111111",
        },
      ],
      args: [],
    },
    {
      name: "claim_growth_fees",
      docs: [
        "Claim accumulated growth fees from a pool",
        "Only callable by the protocol admin, payable to an admin-selected wallet",
      ],
      discriminator: [6, 29, 146, 220, 204, 179, 183, 225],
      accounts: [
        {
          name: "admin",
          docs: ["Protocol admin approving the growth payout."],
          writable: true,
          signer: true,
        },
        {
          name: "config",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [99, 111, 110, 102, 105, 103],
              },
            ],
          },
        },
        {
          name: "pool",
          docs: ["The pool to claim growth fees from."],
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [112, 111, 111, 108],
              },
              {
                kind: "account",
                path: "pool.post_id",
                account: "Pool",
              },
            ],
          },
        },
        {
          name: "pool_sol_vault",
          docs: ["Pool's SOL vault."],
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [115, 111, 108, 95, 118, 97, 117, 108, 116],
              },
              {
                kind: "account",
                path: "pool",
              },
            ],
          },
        },
        {
          name: "growth_recipient",
          writable: true,
        },
        {
          name: "system_program",
          address: "11111111111111111111111111111111",
        },
      ],
      args: [],
    },
    {
      name: "create_pool",
      docs: [
        "Create a new pool for a post (tokenize the post)",
        "Anyone can call this to tokenize a post and become a curator",
      ],
      discriminator: [233, 146, 209, 142, 207, 104, 64, 188],
      accounts: [
        {
          name: "curator",
          writable: true,
          signer: true,
        },
        {
          name: "config",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [99, 111, 110, 102, 105, 103],
              },
            ],
          },
        },
        {
          name: "pool",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [112, 111, 111, 108],
              },
              {
                kind: "arg",
                path: "params.post_id",
              },
            ],
          },
        },
        {
          name: "market_state",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [109, 97, 114, 107, 101, 116],
              },
              {
                kind: "account",
                path: "pool",
              },
            ],
          },
        },
        {
          name: "token_mint",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [108, 112, 95, 109, 105, 110, 116],
              },
              {
                kind: "account",
                path: "pool",
              },
            ],
          },
        },
        {
          name: "pool_token_vault",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "account",
                path: "pool",
              },
              {
                kind: "const",
                value: [
                  6, 221, 246, 225, 215, 101, 161, 147, 217, 203, 225, 70, 206,
                  235, 121, 172, 28, 180, 133, 237, 95, 91, 55, 145, 58, 140,
                  245, 133, 126, 255, 0, 169,
                ],
              },
              {
                kind: "account",
                path: "token_mint",
              },
            ],
            program: {
              kind: "const",
              value: [
                140, 151, 37, 143, 78, 36, 137, 241, 187, 61, 16, 41, 20, 142,
                13, 131, 11, 90, 19, 153, 218, 255, 16, 132, 4, 142, 123, 216,
                219, 233, 248, 89,
              ],
            },
          },
        },
        {
          name: "pool_sol_vault",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [115, 111, 108, 95, 118, 97, 117, 108, 116],
              },
              {
                kind: "account",
                path: "pool",
              },
            ],
          },
        },
        {
          name: "treasury",
          writable: true,
        },
        {
          name: "token_program",
          address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
        },
        {
          name: "associated_token_program",
          address: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL",
        },
        {
          name: "system_program",
          address: "11111111111111111111111111111111",
        },
      ],
      args: [
        {
          name: "params",
          type: {
            defined: {
              name: "CreatePoolParams",
            },
          },
        },
      ],
    },
    {
      name: "init_bin",
      docs: ["Initialize a DLMM bin for a migrated post pool."],
      discriminator: [47, 63, 90, 84, 140, 181, 232, 247],
      accounts: [
        {
          name: "authority",
          writable: true,
          signer: true,
        },
        {
          name: "config",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [99, 111, 110, 102, 105, 103],
              },
            ],
          },
        },
        {
          name: "pool",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [112, 111, 111, 108],
              },
              {
                kind: "account",
                path: "pool.post_id",
                account: "Pool",
              },
            ],
          },
        },
        {
          name: "market_state",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [109, 97, 114, 107, 101, 116],
              },
              {
                kind: "account",
                path: "pool",
              },
            ],
          },
        },
        {
          name: "bin",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [98, 105, 110],
              },
              {
                kind: "account",
                path: "pool",
              },
              {
                kind: "arg",
                path: "params.bin_id",
              },
            ],
          },
        },
        {
          name: "system_program",
          address: "11111111111111111111111111111111",
        },
      ],
      args: [
        {
          name: "params",
          type: {
            defined: {
              name: "InitBinParams",
            },
          },
        },
      ],
    },
    {
      name: "initialize",
      docs: ["Initialize the protocol with global configuration"],
      discriminator: [175, 175, 109, 31, 13, 152, 155, 237],
      accounts: [
        {
          name: "admin",
          writable: true,
          signer: true,
        },
        {
          name: "treasury",
        },
        {
          name: "config",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [99, 111, 110, 102, 105, 103],
              },
            ],
          },
        },
        {
          name: "system_program",
          address: "11111111111111111111111111111111",
        },
      ],
      args: [
        {
          name: "params",
          type: {
            defined: {
              name: "InitializeParams",
            },
          },
        },
      ],
    },
    {
      name: "migrate_pool",
      docs: ["Migrate a post pool from sigmoid bootstrap to DLMM trading."],
      discriminator: [55, 170, 171, 123, 210, 69, 39, 172],
      accounts: [
        {
          name: "authority",
          writable: true,
          signer: true,
        },
        {
          name: "config",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [99, 111, 110, 102, 105, 103],
              },
            ],
          },
        },
        {
          name: "pool",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [112, 111, 111, 108],
              },
              {
                kind: "account",
                path: "pool.post_id",
                account: "Pool",
              },
            ],
          },
        },
        {
          name: "market_state",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [109, 97, 114, 107, 101, 116],
              },
              {
                kind: "account",
                path: "pool",
              },
            ],
          },
        },
      ],
      args: [
        {
          name: "params",
          type: {
            defined: {
              name: "MigratePoolParams",
            },
          },
        },
      ],
    },
    {
      name: "remove_liquidity",
      docs: ["Remove liquidity from a DLMM bin."],
      discriminator: [80, 85, 209, 72, 24, 206, 177, 108],
      accounts: [
        {
          name: "authority",
          writable: true,
          signer: true,
        },
        {
          name: "config",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [99, 111, 110, 102, 105, 103],
              },
            ],
          },
        },
        {
          name: "pool",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [112, 111, 111, 108],
              },
              {
                kind: "account",
                path: "pool.post_id",
                account: "Pool",
              },
            ],
          },
        },
        {
          name: "market_state",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [109, 97, 114, 107, 101, 116],
              },
              {
                kind: "account",
                path: "pool",
              },
            ],
          },
        },
        {
          name: "bin",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [98, 105, 110],
              },
              {
                kind: "account",
                path: "pool",
              },
              {
                kind: "account",
                path: "bin.bin_id",
                account: "Bin",
              },
            ],
          },
        },
        {
          name: "token_mint",
        },
        {
          name: "pool_token_vault",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "account",
                path: "pool",
              },
              {
                kind: "const",
                value: [
                  6, 221, 246, 225, 215, 101, 161, 147, 217, 203, 225, 70, 206,
                  235, 121, 172, 28, 180, 133, 237, 95, 91, 55, 145, 58, 140,
                  245, 133, 126, 255, 0, 169,
                ],
              },
              {
                kind: "account",
                path: "token_mint",
              },
            ],
            program: {
              kind: "const",
              value: [
                140, 151, 37, 143, 78, 36, 137, 241, 187, 61, 16, 41, 20, 142,
                13, 131, 11, 90, 19, 153, 218, 255, 16, 132, 4, 142, 123, 216,
                219, 233, 248, 89,
              ],
            },
          },
        },
        {
          name: "pool_sol_vault",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [115, 111, 108, 95, 118, 97, 117, 108, 116],
              },
              {
                kind: "account",
                path: "pool",
              },
            ],
          },
        },
        {
          name: "authority_token_account",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "account",
                path: "authority",
              },
              {
                kind: "const",
                value: [
                  6, 221, 246, 225, 215, 101, 161, 147, 217, 203, 225, 70, 206,
                  235, 121, 172, 28, 180, 133, 237, 95, 91, 55, 145, 58, 140,
                  245, 133, 126, 255, 0, 169,
                ],
              },
              {
                kind: "account",
                path: "token_mint",
              },
            ],
            program: {
              kind: "const",
              value: [
                140, 151, 37, 143, 78, 36, 137, 241, 187, 61, 16, 41, 20, 142,
                13, 131, 11, 90, 19, 153, 218, 255, 16, 132, 4, 142, 123, 216,
                219, 233, 248, 89,
              ],
            },
          },
        },
        {
          name: "token_program",
          address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
        },
        {
          name: "system_program",
          address: "11111111111111111111111111111111",
        },
      ],
      args: [
        {
          name: "params",
          type: {
            defined: {
              name: "RemoveLiquidityParams",
            },
          },
        },
      ],
    },
    {
      name: "set_creator",
      docs: ["Set/verify the creator for a pool (post author)"],
      discriminator: [254, 148, 255, 112, 207, 142, 170, 165],
      accounts: [
        {
          name: "authority",
          docs: ["Admin or authorized verifier"],
          writable: true,
          signer: true,
        },
        {
          name: "pool",
          docs: ["The pool to update"],
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [112, 111, 111, 108],
              },
              {
                kind: "account",
                path: "pool.post_id",
                account: "Pool",
              },
            ],
          },
        },
        {
          name: "config",
          docs: ["Global config to verify authority"],
          pda: {
            seeds: [
              {
                kind: "const",
                value: [99, 111, 110, 102, 105, 103],
              },
            ],
          },
        },
        {
          name: "creator",
          docs: ["The creator wallet to set"],
        },
      ],
      args: [],
    },
    {
      name: "set_pool_status",
      docs: ["Admin emergency control for a single post pool."],
      discriminator: [112, 87, 135, 223, 83, 204, 132, 53],
      accounts: [
        {
          name: "admin",
          writable: true,
          signer: true,
        },
        {
          name: "config",
          pda: {
            seeds: [
              {
                kind: "const",
                value: [99, 111, 110, 102, 105, 103],
              },
            ],
          },
        },
        {
          name: "pool",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [112, 111, 111, 108],
              },
              {
                kind: "account",
                path: "pool.post_id",
                account: "Pool",
              },
            ],
          },
        },
      ],
      args: [
        {
          name: "params",
          type: {
            defined: {
              name: "SetPoolStatusParams",
            },
          },
        },
      ],
    },
    {
      name: "swap",
      discriminator: [248, 198, 158, 145, 225, 117, 135, 200],
      accounts: [
        {
          name: "user",
          writable: true,
          signer: true,
        },
        {
          name: "config",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [99, 111, 110, 102, 105, 103],
              },
            ],
          },
        },
        {
          name: "pool",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [112, 111, 111, 108],
              },
              {
                kind: "account",
                path: "pool.post_id",
                account: "Pool",
              },
            ],
          },
        },
        {
          name: "market_state",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [109, 97, 114, 107, 101, 116],
              },
              {
                kind: "account",
                path: "pool",
              },
            ],
          },
        },
        {
          name: "token_mint",
        },
        {
          name: "pool_token_vault",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "account",
                path: "pool",
              },
              {
                kind: "const",
                value: [
                  6, 221, 246, 225, 215, 101, 161, 147, 217, 203, 225, 70, 206,
                  235, 121, 172, 28, 180, 133, 237, 95, 91, 55, 145, 58, 140,
                  245, 133, 126, 255, 0, 169,
                ],
              },
              {
                kind: "account",
                path: "token_mint",
              },
            ],
            program: {
              kind: "const",
              value: [
                140, 151, 37, 143, 78, 36, 137, 241, 187, 61, 16, 41, 20, 142,
                13, 131, 11, 90, 19, 153, 218, 255, 16, 132, 4, 142, 123, 216,
                219, 233, 248, 89,
              ],
            },
          },
        },
        {
          name: "pool_sol_vault",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [115, 111, 108, 95, 118, 97, 117, 108, 116],
              },
              {
                kind: "account",
                path: "pool",
              },
            ],
          },
        },
        {
          name: "active_bin",
          docs: ["Active DLMM bin. Required only after the pool has migrated."],
          writable: true,
          optional: true,
        },
        {
          name: "user_token_account",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "account",
                path: "user",
              },
              {
                kind: "const",
                value: [
                  6, 221, 246, 225, 215, 101, 161, 147, 217, 203, 225, 70, 206,
                  235, 121, 172, 28, 180, 133, 237, 95, 91, 55, 145, 58, 140,
                  245, 133, 126, 255, 0, 169,
                ],
              },
              {
                kind: "account",
                path: "token_mint",
              },
            ],
            program: {
              kind: "const",
              value: [
                140, 151, 37, 143, 78, 36, 137, 241, 187, 61, 16, 41, 20, 142,
                13, 131, 11, 90, 19, 153, 218, 255, 16, 132, 4, 142, 123, 216,
                219, 233, 248, 89,
              ],
            },
          },
        },
        {
          name: "treasury",
          writable: true,
        },
        {
          name: "curator",
          writable: true,
        },
        {
          name: "token_program",
          address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
        },
        {
          name: "associated_token_program",
          address: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL",
        },
        {
          name: "system_program",
          address: "11111111111111111111111111111111",
        },
      ],
      args: [
        {
          name: "params",
          type: {
            defined: {
              name: "SwapParams",
            },
          },
        },
      ],
    },
    {
      name: "update_config",
      docs: ["Update protocol configuration"],
      discriminator: [29, 158, 252, 191, 10, 83, 219, 99],
      accounts: [
        {
          name: "admin",
          writable: true,
          signer: true,
        },
        {
          name: "config",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [99, 111, 110, 102, 105, 103],
              },
            ],
          },
        },
      ],
      args: [
        {
          name: "params",
          type: {
            defined: {
              name: "UpdateConfigParams",
            },
          },
        },
      ],
    },
  ],
  accounts: [
    {
      name: "Bin",
      discriminator: [254, 7, 131, 225, 223, 87, 157, 218],
    },
    {
      name: "Config",
      discriminator: [155, 12, 170, 224, 30, 250, 204, 130],
    },
    {
      name: "MarketState",
      discriminator: [0, 125, 123, 215, 95, 96, 164, 194],
    },
    {
      name: "Pool",
      discriminator: [241, 154, 109, 4, 17, 177, 109, 188],
    },
  ],
  errors: [
    {
      code: 6000,
      name: "Unauthorized",
      msg: "Unauthorized: caller is not the admin",
    },
    {
      code: 6001,
      name: "ProtocolPaused",
      msg: "Protocol is currently paused",
    },
    {
      code: 6002,
      name: "InvalidAuthority",
      msg: "Invalid authority for this operation",
    },
    {
      code: 6003,
      name: "PoolAlreadyExists",
      msg: "Pool already exists for this post",
    },
    {
      code: 6004,
      name: "PoolNotActive",
      msg: "Pool is not active",
    },
    {
      code: 6005,
      name: "PoolNotTradeable",
      msg: "Pool is not tradeable",
    },
    {
      code: 6006,
      name: "LaunchProtectionActive",
      msg: "Pool is in launch protection period",
    },
    {
      code: 6007,
      name: "InvalidPoolStatus",
      msg: "Invalid pool status for this operation",
    },
    {
      code: 6008,
      name: "MigrationRequired",
      msg: "Pool must be migrated before additional trades",
    },
    {
      code: 6009,
      name: "AlreadyMigrated",
      msg: "Pool has already migrated",
    },
    {
      code: 6010,
      name: "MigrationConditionsNotMet",
      msg: "Pool has not met migration requirements",
    },
    {
      code: 6011,
      name: "PostIdTooLong",
      msg: "Post ID is too long",
    },
    {
      code: 6012,
      name: "PostIdEmpty",
      msg: "Post ID cannot be empty",
    },
    {
      code: 6013,
      name: "TradeBelowMinimum",
      msg: "Trade amount is below minimum",
    },
    {
      code: 6014,
      name: "TradeExceedsMaximum",
      msg: "Trade amount exceeds maximum",
    },
    {
      code: 6015,
      name: "SlippageExceeded",
      msg: "Slippage tolerance exceeded",
    },
    {
      code: 6016,
      name: "InsufficientPoolTokens",
      msg: "Insufficient tokens in pool",
    },
    {
      code: 6017,
      name: "InsufficientPoolSol",
      msg: "Insufficient SOL in pool",
    },
    {
      code: 6018,
      name: "InsufficientBalance",
      msg: "Insufficient user balance",
    },
    {
      code: 6019,
      name: "ExceedsSupply",
      msg: "Trade would exceed supply",
    },
    {
      code: 6020,
      name: "ZeroAmount",
      msg: "Zero amount not allowed",
    },
    {
      code: 6021,
      name: "ExceedsLaunchProtectionLimit",
      msg: "Buy amount exceeds launch protection limit",
    },
    {
      code: 6022,
      name: "MathOverflow",
      msg: "Math overflow occurred",
    },
    {
      code: 6023,
      name: "MathUnderflow",
      msg: "Math underflow occurred",
    },
    {
      code: 6024,
      name: "DivisionByZero",
      msg: "Division by zero",
    },
    {
      code: 6025,
      name: "InvalidCalculation",
      msg: "Invalid calculation result",
    },
    {
      code: 6026,
      name: "InvalidSigmoidConfig",
      msg: "Invalid sigmoid configuration",
    },
    {
      code: 6027,
      name: "InvalidDlmmBin",
      msg: "Invalid DLMM bin",
    },
    {
      code: 6028,
      name: "InsufficientBinLiquidity",
      msg: "Insufficient DLMM bin liquidity",
    },
    {
      code: 6029,
      name: "NoFeesToClaim",
      msg: "No fees to claim",
    },
    {
      code: 6030,
      name: "InvalidFeeConfig",
      msg: "Invalid fee configuration",
    },
    {
      code: 6031,
      name: "FeeCalculationError",
      msg: "Fee calculation error",
    },
    {
      code: 6032,
      name: "TokenNameTooLong",
      msg: "Token name too long",
    },
    {
      code: 6033,
      name: "TokenSymbolTooLong",
      msg: "Token symbol too long",
    },
    {
      code: 6034,
      name: "TokenUriTooLong",
      msg: "Token URI too long",
    },
    {
      code: 6035,
      name: "InvalidTokenMint",
      msg: "Invalid token mint",
    },
    {
      code: 6036,
      name: "InvalidTokenAccount",
      msg: "Invalid token account",
    },
    {
      code: 6037,
      name: "InvalidConfig",
      msg: "Invalid configuration value",
    },
    {
      code: 6038,
      name: "AlreadyInitialized",
      msg: "Configuration already initialized",
    },
    {
      code: 6039,
      name: "InvalidVirtualReserves",
      msg: "Invalid virtual reserves",
    },
  ],
  types: [
    {
      name: "AddLiquidityParams",
      type: {
        kind: "struct",
        fields: [
          {
            name: "token_amount",
            type: "u64",
          },
          {
            name: "sol_amount",
            type: "u64",
          },
        ],
      },
    },
    {
      name: "Bin",
      docs: [
        "DLMM bin for a post pool.",
        'PDA Seed: ["bin", pool, bin_id.to_le_bytes()]',
      ],
      type: {
        kind: "struct",
        fields: [
          {
            name: "pool",
            type: "pubkey",
          },
          {
            name: "bin_id",
            type: "i32",
          },
          {
            name: "price_lamports_per_token",
            type: "u64",
          },
          {
            name: "token_liquidity",
            type: "u64",
          },
          {
            name: "sol_liquidity",
            type: "u64",
          },
          {
            name: "fee_growth_sol",
            type: "u128",
          },
          {
            name: "fee_growth_token",
            type: "u128",
          },
          {
            name: "bump",
            type: "u8",
          },
          {
            name: "_reserved",
            type: "bytes",
          },
        ],
      },
    },
    {
      name: "Config",
      docs: ["Global protocol configuration", 'PDA Seed: ["config"]'],
      type: {
        kind: "struct",
        fields: [
          {
            name: "admin",
            type: "pubkey",
          },
          {
            name: "treasury",
            type: "pubkey",
          },
          {
            name: "is_paused",
            type: "bool",
          },
          {
            name: "total_pools",
            type: "u64",
          },
          {
            name: "total_volume",
            type: "u128",
          },
          {
            name: "total_fees_collected",
            type: "u128",
          },
          {
            name: "default_sigmoid_floor_price",
            type: "u64",
          },
          {
            name: "default_sigmoid_cap_price",
            type: "u64",
          },
          {
            name: "pool_creation_fee",
            type: "u64",
          },
          {
            name: "launch_protection_duration",
            type: "i64",
          },
          {
            name: "max_buy_during_protection",
            type: "u64",
          },
          {
            name: "bump",
            type: "u8",
          },
          {
            name: "_reserved",
            type: "bytes",
          },
        ],
      },
    },
    {
      name: "CreatePoolParams",
      type: {
        kind: "struct",
        fields: [
          {
            name: "post_id",
            type: "string",
          },
          {
            name: "name",
            type: "string",
          },
          {
            name: "symbol",
            type: "string",
          },
          {
            name: "uri",
            type: "string",
          },
          {
            name: "token_supply",
            type: {
              option: "u64",
            },
          },
          {
            name: "sigmoid_floor_price",
            type: {
              option: "u64",
            },
          },
          {
            name: "sigmoid_cap_price",
            type: {
              option: "u64",
            },
          },
          {
            name: "sigmoid_midpoint_supply",
            type: {
              option: "u64",
            },
          },
          {
            name: "sigmoid_steepness_bps",
            type: {
              option: "u64",
            },
          },
          {
            name: "migration_supply_threshold_bps",
            type: {
              option: "u16",
            },
          },
          {
            name: "migration_min_sol_reserve",
            type: {
              option: "u64",
            },
          },
          {
            name: "dlmm_bin_step_bps",
            type: {
              option: "u16",
            },
          },
        ],
      },
    },
    {
      name: "DlmmConfig",
      type: {
        kind: "struct",
        fields: [
          {
            name: "bin_step_bps",
            type: "u16",
          },
          {
            name: "active_bin_id",
            type: "i32",
          },
        ],
      },
    },
    {
      name: "InitBinParams",
      type: {
        kind: "struct",
        fields: [
          {
            name: "bin_id",
            type: "i32",
          },
          {
            name: "price_lamports_per_token",
            type: "u64",
          },
          {
            name: "initial_token_liquidity",
            type: "u64",
          },
          {
            name: "initial_sol_liquidity",
            type: "u64",
          },
        ],
      },
    },
    {
      name: "InitializeParams",
      type: {
        kind: "struct",
        fields: [
          {
            name: "sigmoid_floor_price",
            type: {
              option: "u64",
            },
          },
          {
            name: "sigmoid_cap_price",
            type: {
              option: "u64",
            },
          },
          {
            name: "pool_creation_fee",
            type: {
              option: "u64",
            },
          },
          {
            name: "launch_protection_duration",
            type: {
              option: "i64",
            },
          },
          {
            name: "max_buy_during_protection",
            type: {
              option: "u64",
            },
          },
        ],
      },
    },
    {
      name: "MarketState",
      docs: [
        "Market state for a tokenized post pool.",
        'PDA Seed: ["market", pool]',
      ],
      type: {
        kind: "struct",
        fields: [
          {
            name: "pool",
            type: "pubkey",
          },
          {
            name: "model",
            type: {
              defined: {
                name: "PoolModel",
              },
            },
          },
          {
            name: "sigmoid",
            type: {
              defined: {
                name: "SigmoidConfig",
              },
            },
          },
          {
            name: "migration",
            type: {
              defined: {
                name: "MigrationConfig",
              },
            },
          },
          {
            name: "dlmm",
            type: {
              defined: {
                name: "DlmmConfig",
              },
            },
          },
          {
            name: "allocated_token_liquidity",
            type: "u64",
          },
          {
            name: "allocated_sol_liquidity",
            type: "u64",
          },
          {
            name: "total_trade_volume",
            type: "u128",
          },
          {
            name: "total_fees_earned",
            type: "u128",
          },
          {
            name: "platform_fees_earned",
            type: "u128",
          },
          {
            name: "creator_fees_earned",
            type: "u128",
          },
          {
            name: "curator_fees_earned",
            type: "u128",
          },
          {
            name: "growth_fees_earned",
            type: "u128",
          },
          {
            name: "total_trades",
            type: "u64",
          },
          {
            name: "buy_trades",
            type: "u64",
          },
          {
            name: "sell_trades",
            type: "u64",
          },
          {
            name: "migrated_at",
            type: "i64",
          },
          {
            name: "bump",
            type: "u8",
          },
          {
            name: "_reserved",
            type: "bytes",
          },
        ],
      },
    },
    {
      name: "MigratePoolParams",
      type: {
        kind: "struct",
        fields: [
          {
            name: "active_bin_id",
            docs: [
              "Optional active bin override. If omitted, derive from current sigmoid price.",
            ],
            type: {
              option: "i32",
            },
          },
          {
            name: "enforce_conditions",
            docs: [
              "Require the migration checks. Only admin can bypass this for recovery.",
            ],
            type: "bool",
          },
        ],
      },
    },
    {
      name: "MigrationConfig",
      type: {
        kind: "struct",
        fields: [
          {
            name: "supply_threshold_bps",
            type: "u16",
          },
          {
            name: "min_sol_reserve",
            type: "u64",
          },
        ],
      },
    },
    {
      name: "Pool",
      docs: [
        "Red Post Pool - represents a tokenized post",
        'PDA Seed: ["pool", post_id.as_bytes()]',
      ],
      type: {
        kind: "struct",
        fields: [
          {
            name: "post_id",
            type: "string",
          },
          {
            name: "token_mint",
            type: "pubkey",
          },
          {
            name: "curator",
            type: "pubkey",
          },
          {
            name: "creator",
            type: "pubkey",
          },
          {
            name: "status",
            type: {
              defined: {
                name: "PoolStatus",
              },
            },
          },
          {
            name: "model",
            type: {
              defined: {
                name: "PoolModel",
              },
            },
          },
          {
            name: "liquidity_sol_reserve",
            type: "u64",
          },
          {
            name: "liquidity_token_reserve",
            type: "u64",
          },
          {
            name: "tokens_sold",
            type: "u64",
          },
          {
            name: "token_supply",
            type: "u64",
          },
          {
            name: "total_volume",
            type: "u128",
          },
          {
            name: "total_fees",
            type: "u64",
          },
          {
            name: "unclaimed_creator_fees",
            type: "u64",
          },
          {
            name: "unclaimed_curator_fees",
            type: "u64",
          },
          {
            name: "unclaimed_growth_fees",
            type: "u64",
          },
          {
            name: "created_at",
            type: "i64",
          },
          {
            name: "launch_protection_ends_at",
            type: "i64",
          },
          {
            name: "bump",
            type: "u8",
          },
          {
            name: "token_vault_bump",
            type: "u8",
          },
          {
            name: "sol_vault_bump",
            type: "u8",
          },
          {
            name: "name",
            type: "string",
          },
          {
            name: "symbol",
            type: "string",
          },
          {
            name: "uri",
            type: "string",
          },
          {
            name: "_reserved",
            type: "bytes",
          },
        ],
      },
    },
    {
      name: "PoolModel",
      type: {
        kind: "enum",
        variants: [
          {
            name: "SigmoidBootstrap",
          },
          {
            name: "MigrationPending",
          },
          {
            name: "DLMM",
          },
        ],
      },
    },
    {
      name: "PoolStatus",
      type: {
        kind: "enum",
        variants: [
          {
            name: "Active",
          },
          {
            name: "LaunchProtection",
          },
          {
            name: "Paused",
          },
        ],
      },
    },
    {
      name: "RemoveLiquidityParams",
      type: {
        kind: "struct",
        fields: [
          {
            name: "token_amount",
            type: "u64",
          },
          {
            name: "sol_amount",
            type: "u64",
          },
        ],
      },
    },
    {
      name: "SetPoolStatusParams",
      type: {
        kind: "struct",
        fields: [
          {
            name: "status",
            type: {
              defined: {
                name: "PoolStatus",
              },
            },
          },
        ],
      },
    },
    {
      name: "SigmoidConfig",
      type: {
        kind: "struct",
        fields: [
          {
            name: "token_supply",
            type: "u64",
          },
          {
            name: "floor_price_lamports",
            type: "u64",
          },
          {
            name: "cap_price_lamports",
            type: "u64",
          },
          {
            name: "midpoint_supply",
            type: "u64",
          },
          {
            name: "steepness_bps",
            type: "u64",
          },
          {
            name: "band_bps",
            type: "u64",
          },
        ],
      },
    },
    {
      name: "SwapParams",
      type: {
        kind: "struct",
        fields: [
          {
            name: "amount_in",
            type: "u64",
          },
          {
            name: "minimum_amount_out",
            type: "u64",
          },
          {
            name: "is_buy",
            type: "bool",
          },
        ],
      },
    },
    {
      name: "UpdateConfigParams",
      type: {
        kind: "struct",
        fields: [
          {
            name: "new_admin",
            type: {
              option: "pubkey",
            },
          },
          {
            name: "new_treasury",
            type: {
              option: "pubkey",
            },
          },
          {
            name: "is_paused",
            type: {
              option: "bool",
            },
          },
          {
            name: "default_sigmoid_floor_price",
            type: {
              option: "u64",
            },
          },
          {
            name: "default_sigmoid_cap_price",
            type: {
              option: "u64",
            },
          },
          {
            name: "pool_creation_fee",
            type: {
              option: "u64",
            },
          },
          {
            name: "launch_protection_duration",
            type: {
              option: "i64",
            },
          },
          {
            name: "max_buy_during_protection",
            type: {
              option: "u64",
            },
          },
        ],
      },
    },
  ],
} as const;

export default IDL;

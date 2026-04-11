/** Auto-generated IDL export for the RedCircle Protocol program. */
const IDL = {
  address: "8vdyo4hfP1ZjmnnEuGrqhHNupt2ZjZ7LmfRtU4kCXS5L",
  metadata: {
    name: "redcircle_protocol",
    version: "0.1.0",
    spec: "0.1.0",
    description:
      "RedCircle Protocol - Tokenize and trade social media posts on Solana",
  },
  instructions: [
    {
      name: "buy",
      docs: ["Simplified buy instruction (SOL -> Token)"],
      discriminator: [102, 6, 61, 18, 1, 218, 235, 234],
      accounts: [
        { name: "user", writable: true, signer: true },
        {
          name: "config",
          writable: true,
          pda: {
            seeds: [{ kind: "const", value: [99, 111, 110, 102, 105, 103] }],
          },
        },
        {
          name: "pool",
          writable: true,
          pda: {
            seeds: [
              { kind: "const", value: [112, 111, 111, 108] },
              { kind: "account", path: "pool.post_id", account: "Pool" },
            ],
          },
        },
        { name: "token_mint" },
        {
          name: "pool_token_vault",
          writable: true,
          pda: {
            seeds: [
              { kind: "account", path: "pool" },
              {
                kind: "const",
                value: [
                  6, 221, 246, 225, 215, 101, 161, 147, 217, 203, 225, 70, 206,
                  235, 121, 172, 28, 180, 133, 237, 95, 91, 55, 145, 58, 140,
                  245, 133, 126, 255, 0, 169,
                ],
              },
              { kind: "account", path: "token_mint" },
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
              { kind: "account", path: "pool" },
            ],
          },
        },
        {
          name: "user_token_account",
          writable: true,
          pda: {
            seeds: [
              { kind: "account", path: "user" },
              {
                kind: "const",
                value: [
                  6, 221, 246, 225, 215, 101, 161, 147, 217, 203, 225, 70, 206,
                  235, 121, 172, 28, 180, 133, 237, 95, 91, 55, 145, 58, 140,
                  245, 133, 126, 255, 0, 169,
                ],
              },
              { kind: "account", path: "token_mint" },
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
        { name: "treasury", writable: true },
        { name: "curator", writable: true },
        {
          name: "token_program",
          address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
        },
        {
          name: "associated_token_program",
          address: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL",
        },
        { name: "system_program", address: "11111111111111111111111111111111" },
      ],
      args: [{ name: "params", type: { defined: { name: "BuyParams" } } }],
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
              { kind: "const", value: [112, 111, 111, 108] },
              { kind: "account", path: "pool.post_id", account: "Pool" },
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
              { kind: "account", path: "pool" },
            ],
          },
        },
        { name: "system_program", address: "11111111111111111111111111111111" },
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
              { kind: "const", value: [112, 111, 111, 108] },
              { kind: "account", path: "pool.post_id", account: "Pool" },
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
              { kind: "account", path: "pool" },
            ],
          },
        },
        { name: "system_program", address: "11111111111111111111111111111111" },
      ],
      args: [],
    },
    {
      name: "claim_inviter_fees",
      docs: [
        "Claim accumulated inviter fees",
        "Only callable by the inviter who referred a user",
      ],
      discriminator: [175, 209, 227, 196, 151, 232, 152, 169],
      accounts: [
        {
          name: "inviter",
          docs: ["The inviter claiming fees"],
          writable: true,
          signer: true,
        },
        {
          name: "inviter_stats",
          docs: ["Inviter's stats account"],
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  105, 110, 118, 105, 116, 101, 114, 95, 115, 116, 97, 116, 115,
                ],
              },
              { kind: "account", path: "inviter" },
            ],
          },
        },
        {
          name: "fee_vault",
          docs: ["Fee vault that holds accumulated inviter fees"],
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [102, 101, 101, 95, 118, 97, 117, 108, 116],
              },
            ],
          },
        },
        { name: "system_program", address: "11111111111111111111111111111111" },
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
          docs: ["The curator who is tokenizing this post"],
          writable: true,
          signer: true,
        },
        {
          name: "config",
          docs: ["Global protocol configuration"],
          writable: true,
          pda: {
            seeds: [{ kind: "const", value: [99, 111, 110, 102, 105, 103] }],
          },
        },
        {
          name: "pool",
          docs: ["The pool account for this post"],
          writable: true,
          pda: {
            seeds: [
              { kind: "const", value: [112, 111, 111, 108] },
              { kind: "arg", path: "params.post_id" },
            ],
          },
        },
        {
          name: "token_mint",
          docs: ["The token mint for this pool's RPT token"],
          writable: true,
          pda: {
            seeds: [
              { kind: "const", value: [108, 112, 95, 109, 105, 110, 116] },
              { kind: "account", path: "pool" },
            ],
          },
        },
        {
          name: "pool_token_vault",
          docs: ["Pool's token vault to hold unminted/unsold tokens"],
          writable: true,
          pda: {
            seeds: [
              { kind: "account", path: "pool" },
              {
                kind: "const",
                value: [
                  6, 221, 246, 225, 215, 101, 161, 147, 217, 203, 225, 70, 206,
                  235, 121, 172, 28, 180, 133, 237, 95, 91, 55, 145, 58, 140,
                  245, 133, 126, 255, 0, 169,
                ],
              },
              { kind: "account", path: "token_mint" },
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
          docs: ["Pool's SOL vault (PDA that holds collected SOL)"],
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [115, 111, 108, 95, 118, 97, 117, 108, 116],
              },
              { kind: "account", path: "pool" },
            ],
          },
        },
        {
          name: "treasury",
          docs: ["Treasury to receive pool creation fee (if any)"],
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
        { name: "system_program", address: "11111111111111111111111111111111" },
      ],
      args: [
        { name: "params", type: { defined: { name: "CreatePoolParams" } } },
      ],
    },
    {
      name: "initialize",
      docs: ["Initialize the protocol with global configuration"],
      discriminator: [175, 175, 109, 31, 13, 152, 155, 237],
      accounts: [
        { name: "admin", writable: true, signer: true },
        {
          name: "treasury",
          docs: ["The treasury wallet that receives platform fees"],
        },
        {
          name: "config",
          writable: true,
          pda: {
            seeds: [{ kind: "const", value: [99, 111, 110, 102, 105, 103] }],
          },
        },
        { name: "system_program", address: "11111111111111111111111111111111" },
      ],
      args: [
        { name: "params", type: { defined: { name: "InitializeParams" } } },
      ],
    },
    {
      name: "register_referral",
      docs: [
        "Register a referral relationship",
        "A user registers with their inviter (referrer)",
      ],
      discriminator: [158, 196, 134, 102, 193, 102, 184, 86],
      accounts: [
        {
          name: "user",
          docs: ["The user registering the referral"],
          writable: true,
          signer: true,
        },
        {
          name: "inviter",
          docs: ["The inviter (referrer) who invited this user"],
        },
        {
          name: "referral",
          docs: ["User's referral account (to be created)"],
          writable: true,
          pda: {
            seeds: [
              { kind: "const", value: [114, 101, 102, 101, 114, 114, 97, 108] },
              { kind: "account", path: "user" },
            ],
          },
        },
        {
          name: "inviter_stats",
          docs: ["Inviter's stats account (create if doesn't exist)"],
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [
                  105, 110, 118, 105, 116, 101, 114, 95, 115, 116, 97, 116, 115,
                ],
              },
              { kind: "account", path: "inviter" },
            ],
          },
        },
        { name: "system_program", address: "11111111111111111111111111111111" },
      ],
      args: [],
    },
    {
      name: "sell",
      docs: ["Simplified sell instruction (Token -> SOL)"],
      discriminator: [51, 230, 133, 164, 1, 127, 131, 173],
      accounts: [
        { name: "user", writable: true, signer: true },
        {
          name: "config",
          writable: true,
          pda: {
            seeds: [{ kind: "const", value: [99, 111, 110, 102, 105, 103] }],
          },
        },
        {
          name: "pool",
          writable: true,
          pda: {
            seeds: [
              { kind: "const", value: [112, 111, 111, 108] },
              { kind: "account", path: "pool.post_id", account: "Pool" },
            ],
          },
        },
        { name: "token_mint" },
        {
          name: "pool_token_vault",
          writable: true,
          pda: {
            seeds: [
              { kind: "account", path: "pool" },
              {
                kind: "const",
                value: [
                  6, 221, 246, 225, 215, 101, 161, 147, 217, 203, 225, 70, 206,
                  235, 121, 172, 28, 180, 133, 237, 95, 91, 55, 145, 58, 140,
                  245, 133, 126, 255, 0, 169,
                ],
              },
              { kind: "account", path: "token_mint" },
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
              { kind: "account", path: "pool" },
            ],
          },
        },
        {
          name: "user_token_account",
          writable: true,
          pda: {
            seeds: [
              { kind: "account", path: "user" },
              {
                kind: "const",
                value: [
                  6, 221, 246, 225, 215, 101, 161, 147, 217, 203, 225, 70, 206,
                  235, 121, 172, 28, 180, 133, 237, 95, 91, 55, 145, 58, 140,
                  245, 133, 126, 255, 0, 169,
                ],
              },
              { kind: "account", path: "token_mint" },
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
        { name: "treasury", writable: true },
        { name: "curator", writable: true },
        {
          name: "token_program",
          address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
        },
        {
          name: "associated_token_program",
          address: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL",
        },
        { name: "system_program", address: "11111111111111111111111111111111" },
      ],
      args: [{ name: "params", type: { defined: { name: "SellParams" } } }],
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
              { kind: "const", value: [112, 111, 111, 108] },
              { kind: "account", path: "pool.post_id", account: "Pool" },
            ],
          },
        },
        {
          name: "config",
          docs: ["Global config to verify authority"],
          pda: {
            seeds: [{ kind: "const", value: [99, 111, 110, 102, 105, 103] }],
          },
        },
        { name: "creator", docs: ["The creator wallet to set"] },
      ],
      args: [],
    },
    {
      name: "swap",
      discriminator: [248, 198, 158, 145, 225, 117, 135, 200],
      accounts: [
        {
          name: "user",
          docs: ["The user performing the swap"],
          writable: true,
          signer: true,
        },
        {
          name: "config",
          docs: ["Global protocol configuration"],
          writable: true,
          pda: {
            seeds: [{ kind: "const", value: [99, 111, 110, 102, 105, 103] }],
          },
        },
        {
          name: "pool",
          docs: ["The pool being traded"],
          writable: true,
          pda: {
            seeds: [
              { kind: "const", value: [112, 111, 111, 108] },
              { kind: "account", path: "pool.post_id", account: "Pool" },
            ],
          },
        },
        { name: "token_mint", docs: ["The token mint"] },
        {
          name: "pool_token_vault",
          docs: ["Pool's token vault"],
          writable: true,
          pda: {
            seeds: [
              { kind: "account", path: "pool" },
              {
                kind: "const",
                value: [
                  6, 221, 246, 225, 215, 101, 161, 147, 217, 203, 225, 70, 206,
                  235, 121, 172, 28, 180, 133, 237, 95, 91, 55, 145, 58, 140,
                  245, 133, 126, 255, 0, 169,
                ],
              },
              { kind: "account", path: "token_mint" },
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
          docs: ["Pool's SOL vault"],
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [115, 111, 108, 95, 118, 97, 117, 108, 116],
              },
              { kind: "account", path: "pool" },
            ],
          },
        },
        {
          name: "user_token_account",
          docs: ["User's token account"],
          writable: true,
          pda: {
            seeds: [
              { kind: "account", path: "user" },
              {
                kind: "const",
                value: [
                  6, 221, 246, 225, 215, 101, 161, 147, 217, 203, 225, 70, 206,
                  235, 121, 172, 28, 180, 133, 237, 95, 91, 55, 145, 58, 140,
                  245, 133, 126, 255, 0, 169,
                ],
              },
              { kind: "account", path: "token_mint" },
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
          docs: ["Protocol treasury for platform fees"],
          writable: true,
        },
        {
          name: "curator",
          docs: ["Curator of this pool (receives curator fees)"],
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
        { name: "system_program", address: "11111111111111111111111111111111" },
      ],
      args: [{ name: "params", type: { defined: { name: "SwapParams" } } }],
    },
    {
      name: "update_config",
      docs: ["Update protocol configuration"],
      discriminator: [29, 158, 252, 191, 10, 83, 219, 99],
      accounts: [
        { name: "admin", writable: true, signer: true },
        {
          name: "config",
          writable: true,
          pda: {
            seeds: [{ kind: "const", value: [99, 111, 110, 102, 105, 103] }],
          },
        },
      ],
      args: [
        { name: "params", type: { defined: { name: "UpdateConfigParams" } } },
      ],
    },
  ],
  accounts: [
    { name: "Config", discriminator: [155, 12, 170, 224, 30, 250, 204, 130] },
    {
      name: "InviterStats",
      discriminator: [133, 87, 60, 176, 12, 201, 188, 45],
    },
    { name: "Pool", discriminator: [241, 154, 109, 4, 17, 177, 109, 188] },
    { name: "Referral", discriminator: [30, 235, 136, 224, 106, 107, 49, 64] },
  ],
  errors: [
    {
      code: 6000,
      name: "Unauthorized",
      msg: "Unauthorized: caller is not the admin",
    },
    { code: 6001, name: "ProtocolPaused", msg: "Protocol is currently paused" },
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
    { code: 6004, name: "PoolNotActive", msg: "Pool is not active" },
    { code: 6005, name: "PoolNotTradeable", msg: "Pool is not tradeable" },
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
    { code: 6008, name: "PostIdTooLong", msg: "Post ID is too long" },
    { code: 6009, name: "PostIdEmpty", msg: "Post ID cannot be empty" },
    {
      code: 6010,
      name: "TradeBelowMinimum",
      msg: "Trade amount is below minimum",
    },
    {
      code: 6011,
      name: "TradeExceedsMaximum",
      msg: "Trade amount exceeds maximum",
    },
    {
      code: 6012,
      name: "SlippageExceeded",
      msg: "Slippage tolerance exceeded",
    },
    {
      code: 6013,
      name: "InsufficientPoolTokens",
      msg: "Insufficient tokens in pool",
    },
    {
      code: 6014,
      name: "InsufficientPoolSol",
      msg: "Insufficient SOL in pool",
    },
    {
      code: 6015,
      name: "InsufficientBalance",
      msg: "Insufficient user balance",
    },
    { code: 6016, name: "ExceedsSupply", msg: "Trade would exceed supply" },
    { code: 6017, name: "ZeroAmount", msg: "Zero amount not allowed" },
    {
      code: 6018,
      name: "ExceedsLaunchProtectionLimit",
      msg: "Buy amount exceeds launch protection limit",
    },
    { code: 6019, name: "MathOverflow", msg: "Math overflow occurred" },
    { code: 6020, name: "MathUnderflow", msg: "Math underflow occurred" },
    { code: 6021, name: "DivisionByZero", msg: "Division by zero" },
    {
      code: 6022,
      name: "InvalidCalculation",
      msg: "Invalid calculation result",
    },
    { code: 6023, name: "NoFeesToClaim", msg: "No fees to claim" },
    { code: 6024, name: "InvalidFeeConfig", msg: "Invalid fee configuration" },
    { code: 6025, name: "FeeCalculationError", msg: "Fee calculation error" },
    {
      code: 6026,
      name: "ReferralAlreadyRegistered",
      msg: "Referral already registered",
    },
    { code: 6027, name: "SelfReferral", msg: "Cannot refer yourself" },
    { code: 6028, name: "InviterNotFound", msg: "Inviter not found" },
    { code: 6029, name: "InvalidReferral", msg: "Invalid referral" },
    { code: 6030, name: "TokenNameTooLong", msg: "Token name too long" },
    { code: 6031, name: "TokenSymbolTooLong", msg: "Token symbol too long" },
    { code: 6032, name: "TokenUriTooLong", msg: "Token URI too long" },
    { code: 6033, name: "InvalidTokenMint", msg: "Invalid token mint" },
    { code: 6034, name: "InvalidTokenAccount", msg: "Invalid token account" },
    { code: 6035, name: "InvalidConfig", msg: "Invalid configuration value" },
    {
      code: 6036,
      name: "AlreadyInitialized",
      msg: "Configuration already initialized",
    },
    {
      code: 6037,
      name: "InvalidVirtualReserves",
      msg: "Invalid virtual reserves",
    },
  ],
  types: [
    {
      name: "BuyParams",
      type: {
        kind: "struct" as const,
        fields: [
          {
            name: "sol_amount",
            docs: ["Amount of SOL to spend (in lamports)"],
            type: "u64",
          },
          {
            name: "min_tokens_out",
            docs: ["Minimum tokens expected (slippage protection)"],
            type: "u64",
          },
        ],
      },
    },
    {
      name: "Config",
      docs: ["Global protocol configuration", 'PDA Seed: ["config"]'],
      type: {
        kind: "struct" as const,
        fields: [
          { name: "admin", type: "pubkey" },
          { name: "treasury", type: "pubkey" },
          { name: "is_paused", type: "bool" },
          { name: "total_pools", type: "u64" },
          { name: "total_volume", type: "u128" },
          { name: "total_fees_collected", type: "u128" },
          { name: "default_initial_virtual_sol", type: "u64" },
          { name: "default_initial_virtual_token", type: "u64" },
          { name: "pool_creation_fee", type: "u64" },
          { name: "launch_protection_duration", type: "i64" },
          { name: "max_buy_during_protection", type: "u64" },
          { name: "bump", type: "u8" },
          { name: "_reserved", type: "bytes" },
        ],
      },
    },
    {
      name: "CreatePoolParams",
      type: {
        kind: "struct" as const,
        fields: [
          { name: "post_id", type: "string" },
          { name: "name", type: "string" },
          { name: "symbol", type: "string" },
          { name: "uri", type: "string" },
          { name: "curve_type", type: { option: "u8" } },
          { name: "initial_virtual_sol", type: { option: "u64" } },
          { name: "initial_virtual_token", type: { option: "u64" } },
        ],
      },
    },
    {
      name: "CurveType",
      type: {
        kind: "enum" as const,
        variants: [
          { name: "ConstantProduct" },
          { name: "Linear" },
          { name: "Exponential" },
        ],
      },
    },
    {
      name: "InitializeParams",
      type: {
        kind: "struct" as const,
        fields: [
          { name: "initial_virtual_sol", type: { option: "u64" } },
          { name: "initial_virtual_token", type: { option: "u64" } },
          { name: "pool_creation_fee", type: { option: "u64" } },
          { name: "launch_protection_duration", type: { option: "i64" } },
          { name: "max_buy_during_protection", type: { option: "u64" } },
        ],
      },
    },
    {
      name: "InviterStats",
      docs: [
        "Inviter stats account tracking referral performance",
        'PDA Seed: ["inviter_stats", inviter_wallet.as_bytes()]',
      ],
      type: {
        kind: "struct" as const,
        fields: [
          { name: "inviter", type: "pubkey" },
          { name: "total_referrals", type: "u64" },
          { name: "total_fees_earned", type: "u64" },
          { name: "unclaimed_fees", type: "u64" },
          { name: "total_referral_volume", type: "u128" },
          { name: "first_referral_at", type: "i64" },
          { name: "bump", type: "u8" },
          { name: "_reserved", type: "bytes" },
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
        kind: "struct" as const,
        fields: [
          { name: "post_id", type: "string" },
          { name: "token_mint", type: "pubkey" },
          { name: "curator", type: "pubkey" },
          { name: "creator", type: "pubkey" },
          { name: "status", type: { defined: { name: "PoolStatus" } } },
          { name: "curve_type", type: { defined: { name: "CurveType" } } },
          { name: "virtual_sol_reserve", type: "u64" },
          { name: "virtual_token_reserve", type: "u64" },
          { name: "real_sol_reserve", type: "u64" },
          { name: "real_token_reserve", type: "u64" },
          { name: "tokens_sold", type: "u64" },
          { name: "token_supply", type: "u64" },
          { name: "total_volume", type: "u128" },
          { name: "total_fees", type: "u64" },
          { name: "unclaimed_creator_fees", type: "u64" },
          { name: "unclaimed_curator_fees", type: "u64" },
          { name: "created_at", type: "i64" },
          { name: "launch_protection_ends_at", type: "i64" },
          { name: "bump", type: "u8" },
          { name: "token_vault_bump", type: "u8" },
          { name: "sol_vault_bump", type: "u8" },
          { name: "name", type: "string" },
          { name: "symbol", type: "string" },
          { name: "uri", type: "string" },
          { name: "_reserved", type: "bytes" },
        ],
      },
    },
    {
      name: "PoolStatus",
      type: {
        kind: "enum" as const,
        variants: [
          { name: "Active" },
          { name: "LaunchProtection" },
          { name: "Paused" },
        ],
      },
    },
    {
      name: "Referral",
      docs: [
        "Referral account tracking inviter relationships",
        'PDA Seed: ["referral", user_wallet.as_bytes()]',
      ],
      type: {
        kind: "struct" as const,
        fields: [
          { name: "user", type: "pubkey" },
          { name: "inviter", type: "pubkey" },
          { name: "total_fees_generated", type: "u64" },
          { name: "registered_at", type: "i64" },
          { name: "total_volume", type: "u128" },
          { name: "trade_count", type: "u64" },
          { name: "bump", type: "u8" },
          { name: "_reserved", type: "bytes" },
        ],
      },
    },
    {
      name: "SellParams",
      type: {
        kind: "struct" as const,
        fields: [
          {
            name: "token_amount",
            docs: ["Amount of tokens to sell"],
            type: "u64",
          },
          {
            name: "min_sol_out",
            docs: ["Minimum SOL expected (slippage protection)"],
            type: "u64",
          },
        ],
      },
    },
    {
      name: "SwapParams",
      type: {
        kind: "struct" as const,
        fields: [
          {
            name: "amount_in",
            docs: ["Amount of input token (SOL lamports or token amount)"],
            type: "u64",
          },
          {
            name: "minimum_amount_out",
            docs: [
              "Minimum amount of output token expected (slippage protection)",
            ],
            type: "u64",
          },
          {
            name: "is_buy",
            docs: [
              "Direction: true = buy (SOL -> Token), false = sell (Token -> SOL)",
            ],
            type: "bool",
          },
        ],
      },
    },
    {
      name: "UpdateConfigParams",
      type: {
        kind: "struct" as const,
        fields: [
          { name: "new_admin", type: { option: "pubkey" } },
          { name: "new_treasury", type: { option: "pubkey" } },
          { name: "is_paused", type: { option: "bool" } },
          { name: "default_initial_virtual_sol", type: { option: "u64" } },
          { name: "default_initial_virtual_token", type: { option: "u64" } },
          { name: "pool_creation_fee", type: { option: "u64" } },
          { name: "launch_protection_duration", type: { option: "i64" } },
          { name: "max_buy_during_protection", type: { option: "u64" } },
        ],
      },
    },
  ],
} as const;

export default IDL;

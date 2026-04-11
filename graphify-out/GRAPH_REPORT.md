# Graph Report - .  (2026-04-11)

## Corpus Check
- Corpus is ~18,216 words - fits in a single context window. You may not need a graph.

## Summary
- 157 nodes · 224 edges · 12 communities detected
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.83)
- Token cost: 0 input · 0 output

## God Nodes (most connected - your core abstractions)
1. `RedCircleClient` - 30 edges
2. `derivePoolAddresses()` - 6 edges
3. `calculateTokensOut()` - 6 edges
4. `calculate_constant_product_buy()` - 5 edges
5. `calculate_constant_product_sell()` - 5 edges
6. `calculateSolOut()` - 5 edges
7. `calculate_tokens_out()` - 4 edges
8. `calculate_sol_out()` - 4 edges
9. `constantProductBuy()` - 4 edges
10. `constantProductSell()` - 4 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Communities

### Community 0 - "SDK Client"
Cohesion: 0.11
Nodes (1): RedCircleClient

### Community 1 - "Bonding Curve Math"
Cohesion: 0.15
Nodes (27): calculate_constant_product_buy(), calculate_constant_product_sell(), calculate_current_price(), calculate_exponential_buy(), calculate_exponential_sell(), calculate_linear_buy(), calculate_linear_sell(), calculate_market_cap() (+19 more)

### Community 2 - "Pool & Config Init"
Cohesion: 0.11
Nodes (10): Config, CreatePool, CreatePoolParams, Initialize, InitializeParams, UpdateConfig, UpdateConfigParams, RegisterReferral (+2 more)

### Community 3 - "Fee Claims"
Cohesion: 0.12
Nodes (7): ClaimCreatorFees, ClaimCuratorFees, ClaimInviterFees, SetCreator, CurveType, Pool, PoolStatus

### Community 4 - "SDK PDA Helpers"
Cohesion: 0.18
Nodes (6): derivePoolAddresses(), findAssociatedTokenAddress(), findConfigPda(), findPoolPda(), findPoolSolVaultPda(), findTokenMintPda()

### Community 5 - "Program Entry & Errors"
Cohesion: 0.14
Nodes (1): RedCircleError

### Community 6 - "Integration Tests"
Cohesion: 0.2
Nodes (0): 

### Community 7 - "Graphify Config"
Cohesion: 0.36
Nodes (8): GRAPH_REPORT.md, Read GRAPH_REPORT.md Before Architecture Questions, Graphify Integration, graphify-out/ Directory, graphify.watch._rebuild_code, Rebuild Graph After Code Changes, graphify-out/wiki/index.md, Navigate Wiki Index If Available

### Community 8 - "Buy/Sell Instructions"
Cohesion: 0.29
Nodes (4): Buy, BuyParams, Sell, SellParams

### Community 9 - "Swap Instruction"
Cohesion: 0.47
Nodes (5): execute_buy(), execute_sell(), Swap, swap_handler(), SwapParams

### Community 10 - "Migration Deploy"
Cohesion: 1.0
Nodes (0): 

### Community 11 - "SDK Index"
Cohesion: 1.0
Nodes (0): 

## Knowledge Gaps
- **23 isolated node(s):** `RedCircleError`, `Swap`, `SwapParams`, `Initialize`, `InitializeParams` (+18 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Migration Deploy`** (1 nodes): `deploy.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `SDK Index`** (1 nodes): `index.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `RedCircleClient` connect `SDK Client` to `SDK PDA Helpers`?**
  _High betweenness centrality (0.287) - this node is a cross-community bridge._
- **What connects `RedCircleError`, `Swap`, `SwapParams` to the rest of the system?**
  _23 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `SDK Client` be split into smaller, more focused modules?**
  _Cohesion score 0.11 - nodes in this community are weakly interconnected._
- **Should `Pool & Config Init` be split into smaller, more focused modules?**
  _Cohesion score 0.11 - nodes in this community are weakly interconnected._
- **Should `Fee Claims` be split into smaller, more focused modules?**
  _Cohesion score 0.12 - nodes in this community are weakly interconnected._
- **Should `Program Entry & Errors` be split into smaller, more focused modules?**
  _Cohesion score 0.14 - nodes in this community are weakly interconnected._
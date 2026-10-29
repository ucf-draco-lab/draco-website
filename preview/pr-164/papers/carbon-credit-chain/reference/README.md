# Checks for /papers/carbon-credit-chain/

| Script | What it checks | Needs |
|---|---|---|
| `verify-engine.js` | SHA-256 against Node's crypto; the hash chain's tamper detection; the paper's offset example; its market-growth and share arithmetic; the 70% quorum rule; the released-code behaviors the page shows | Node only |
| `verify-contracts.js` | The Ledger model in `carbon-engine.js` against the paper's three contracts (CarbonCreditProject/Carbon-Project, commit a9e478f) compiled with solc 0.6.12 and OpenZeppelin 3.2.0 in ganache: random call sequences, every revert reason, every public value | `solc@0.6.12`, `ganache@7`, `ethers@6`, `@openzeppelin/contracts@3.2.0`; `CARBON=` path to the repository |
| `verify-scenario.js` | The second demo's released-code script, step by step, in both | as above |
| `verify-balancer.js` | `balancer-math.js` against Balancer V1 (`balancer-core`, commit f4ed5d6) compiled with solc 0.5.12: primitives, pool formulas, 150 sequential swaps in a 50/50 BPool with a 0.3% fee, and Balancer's own Decimal.js reference | `solc512@npm:solc@0.5.12`, `ganache@7`, `ethers@6`, `decimal.js`; `BALANCER=` path to the repository |

Results from the October 20, 2026 run are in `results.md`.

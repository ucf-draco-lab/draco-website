# Verification results (October 20, 2026)

Run from this folder with Node 22, solc 0.6.12 and 0.5.12 (solcjs), ganache 7.9.2, ethers 6.13.4, OpenZeppelin Contracts 3.2.0, and decimal.js 10.4.3.
Sources: CarbonCreditProject/Carbon-Project at a9e478f; balancer-labs/balancer-core at f4ed5d6.

## verify-engine.js
```
{"sha256": {"checked": 2408, "mismatches": 0}, "chain": {"blocks": 4, "zeros": 3, "tries": 12399, "validBefore": true, "afterTamper": ["ok", "ok", "work missing", "link broken"]}, "offsetExample": {"shortfall": 20, "bought": 20, "newCap": 120, "compliant": true, "sellerLeft": 30, "uncovered": 0}, "marketGrowth": {"impliedAnnualRate_2005to2009": 90.5, "at108_after4years": 204, "at108_after3years": 98.1, "implied2018": 160.4}, "shares": {"gasShares": 100, "fuelShares": 88, "statedFuelTotal": 89}, "threshold": [[1, 1], [2, 2], [3, 3], [4, 3], [5, 4], [6, 5], [7, 5], [8, 6], [9, 7], [10, 7], [20, 14]], "thresholdMismatches": 0, "doubleMint": {"firstOk": true, "secondOk": true, "balanceAfterTwo": "100", "approved": "50"}, "buy": {"ok": false, "revert": "ERC20: transfer amount exceeds balance"}, "holderBurn": {"ok": false, "revert": "Ownable: caller is not the owner"}}
```

## verify-contracts.js (three seeds, 200 calls each)
```
{"calls": 200, "reverts": 136, "comparisons": 13600, "mismatches": 0}
```
```
{"calls": 200, "reverts": 122, "comparisons": 13600, "mismatches": 0}
```
```
{"calls": 200, "reverts": 132, "comparisons": 13600, "mismatches": 0}
```

## verify-scenario.js
```
┌─────────┬─────────┬────────────────────────┬───────────────────────────────────────────────────┬───────────────────────────────────────────────────┬──────┐
│ (index) │ who     │ fn                     │ evm                                               │ page                                              │ same │
├─────────┼─────────┼────────────────────────┼───────────────────────────────────────────────────┼───────────────────────────────────────────────────┼──────┤
│ 0       │ 'v0'    │ 'registerVerifiers'    │ 'ok'                                              │ 'ok'                                              │ true │
│ 1       │ 'v1'    │ 'registerVerifiers'    │ 'ok'                                              │ 'ok'                                              │ true │
│ 2       │ 'v2'    │ 'registerVerifiers'    │ 'ok'                                              │ 'ok'                                              │ true │
│ 3       │ 'v3'    │ 'registerVerifiers'    │ 'ok'                                              │ 'ok'                                              │ true │
│ 4       │ 'v4'    │ 'registerVerifiers'    │ 'ok'                                              │ 'ok'                                              │ true │
│ 5       │ 'B'     │ 'registerCreditHolder' │ 'ok'                                              │ 'ok'                                              │ true │
│ 6       │ 'A'     │ 'registerCustomer'     │ 'ok'                                              │ 'ok'                                              │ true │
│ 7       │ 'v0'    │ 'approveCreditsHeld'   │ "revert ''"                                       │ "revert ''"                                       │ true │
│ 8       │ 'v1'    │ 'approveCreditsHeld'   │ "revert ''"                                       │ "revert ''"                                       │ true │
│ 9       │ 'v2'    │ 'approveCreditsHeld'   │ "revert ''"                                       │ "revert ''"                                       │ true │
│ 10      │ 'v3'    │ 'approveCreditsHeld'   │ "revert ''"                                       │ "revert ''"                                       │ true │
│ 11      │ 'v4'    │ 'approveCreditsHeld'   │ 'ok'                                              │ 'ok'                                              │ true │
│ 12      │ 'B'     │ 'createCarbonToken'    │ 'ok'                                              │ 'ok'                                              │ true │
│ 13      │ 'B'     │ 'createCarbonToken'    │ 'ok'                                              │ 'ok'                                              │ true │
│ 14      │ 'B'     │ 'transferCredits'      │ 'ok'                                              │ 'ok'                                              │ true │
│ 15      │ 'v4'    │ 'approveBurn'          │ 'ok'                                              │ 'ok'                                              │ true │
│ 16      │ 'A'     │ 'burnTokens'           │ "revert 'Ownable: caller is not the owner'"       │ "revert 'Ownable: caller is not the owner'"       │ true │
│ 17      │ 'A'     │ 'addBurnedTokens'      │ "revert 'Ownable: caller is not the owner'"       │ "revert 'Ownable: caller is not the owner'"       │ true │
│ 18      │ 'A'     │ 'buyCarbonCredits'     │ "revert 'ERC20: transfer amount exceeds balance'" │ "revert 'ERC20: transfer amount exceeds balance'" │ true │
│ 19      │ 'A'     │ 'buyCarbonCredits'     │ 'ok'                                              │ 'ok'                                              │ true │
│ 20      │ 'owner' │ 'approveBurn'          │ "revert ''"                                       │ "revert ''"                                       │ true │
│ 21      │ 'v4'    │ 'approveBurn'          │ 'ok'                                              │ 'ok'                                              │ true │
│ 22      │ 'owner' │ 'burnTokens'           │ "revert 'ERC20: burn amount exceeds balance'"     │ "revert 'ERC20: burn amount exceeds balance'"     │ true │
└─────────┴─────────┴────────────────────────┴───────────────────────────────────────────────────┴───────────────────────────────────────────────────┴──────┘
{
  "steps": 23,
  "agree": 23,
  "state": {
    "evm": {
      "B": "80",
      "A": "20",
      "supply": "100",
      "approvedB": "50",
      "burnedA": "0"
    },
    "page": {
      "B": "80",
      "A": "20",
      "supply": "100",
      "approvedB": "50",
      "burnedA": "0"
    }
  },
  "contractWei": "1"
}
```

## verify-balancer.js (NPRIM=600 NFORM=1500 NSWAP=150)
```
{
  "checks": 7050,
  "mismatches": 0,
  "revertCasesCompared": 0,
  "swaps": 150,
  "swapMismatch": 0,
  "balancesMatch": true,
  "finalPool": {
    "dai": "63855.363920",
    "carbon": "1588.386434"
  },
  "decimalReference": {
    "checks": 374,
    "worstRelativeDiff": 2.9902759310911394e-7,
    "equalWeightChecks": 184,
    "equalWeightWorst": 8.993618564225734e-9,
    "balancerTolerance": 1e-8
  },
  "swapReverts": {
    "ERR_MAX_IN_RATIO": 3
  }
}
```

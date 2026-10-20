---
title: "Carbon Credits on a Shared Ledger"
kicker: "Interactive paper · arXiv white paper 2021"
subtitle: "An interactive companion to Soheil Saraji and Mike Borowczak's design for carbon credits as blockchain tokens: verified before they are minted, traded in a pool instead of through brokers, and burned when a ton of emissions is offset."
description: "Balance a company's emissions with a landowner's credits, follow one carbon token from verification to burning under the paper's rules and under its released hackathon code, buy credits from a fee-charging pool built on Balancer's own arithmetic, and tamper with a hash-linked ledger to see why the record holds."
share_description: "One carbon credit is the right to emit one ton of CO2. This white paper puts credits on a blockchain: verified by most of a panel, minted as tokens, traded in a 0.3% pool, and burned when used. Try every step in your browser, written for five reading levels."
share_text: "Carbon credits as tokens: verified, traded in a pool instead of through brokers, and burned when a ton is offset. Try the ledger in your browser:"
share_image: /papers/carbon-credit-chain/share.png
share_image_alt: "A chart of the DAI it costs to buy carbon tokens from the page's pool with the paper's 0.3% fee, against a 5% broker; the two cost the same at 90 tokens. Beside it, the title Carbon Credits on a Shared Ledger."
date: 2026-10-20
topics: ["Cryptography"]
default_level: public
level_hints:
  public: No background needed
  hs: Percentages, ratios, and a little algebra
  ug: Programming, hashing, and data structures
  grad: Market design, consensus, and contract security
  res: Full design, code reproduction, and open questions
authors:
  - name: Soheil Saraji
    affiliation: Department of Petroleum Engineering, University of Wyoming
  - name: Mike Borowczak
    affiliation: Department of Computer Science, University of Wyoming
    member: mike-borowczak
sources:
  - venue: "arXiv:2107.00185 · white paper · 2021"
    title: "A Blockchain-based Carbon Credit Ecosystem"
    url: https://arxiv.org/abs/2107.00185
    access: Open access (arXiv)
code:
  label: "CarbonCreditProject/Carbon-Project (the paper's hackathon contracts)"
  url: https://github.com/CarbonCreditProject/Carbon-Project
citations:
  - saraji2021blockchain
widget:
  css:
    - /papers/carbon-credit-chain/widget.css
  js:
    - /papers/carbon-credit-chain/balancer-math.js
    - /papers/carbon-credit-chain/carbon-engine.js
    - /papers/carbon-credit-chain/widget.js
credit: "Interactive page by the [DRACO Lab](/). The ledger in `carbon-engine.js` models the three Solidity contracts the paper links (commit a9e478f). Compiled with solc 0.6.12 against OpenZeppelin 3.2 and run in an Ethereum virtual machine, the contracts and the page agree on all 600 randomized calls (every success, every revert reason) and all 40,800 comparisons of calls and public state, and on all 23 steps of the second demo's script. The pool in `balancer-math.js` ports Balancer V1's fixed-point arithmetic (GPLv3, header kept), which the paper's README names for its market; it matches Balancer's compiled `BMath` and `BPool` bit for bit on 7,050 checks, including 150 sequential swaps. SHA-256 matches Node's on 2,408 inputs. The paper's worked offset example (allowance 100, emissions 120, 20 credits bought from a landowner holding 50) is reproduced exactly. The pool's balances and the 25 DAI price are the page's illustration; the paper states no prices. Everything runs on your device."
bibtex: |
  @misc{saraji2021blockchain,
    author       = {Saraji, Soheil and Borowczak, Mike},
    title        = {A Blockchain-based Carbon Credit Ecosystem},
    howpublished = {arXiv preprint arXiv:2107.00185},
    year         = {2021},
    url          = {https://arxiv.org/abs/2107.00185}
  }
---

<div class="lede" data-levels="public" markdown="1">
A carbon credit is a permit to release one ton of carbon dioxide. A company that pollutes more than its limit can buy credits from someone who removed carbon, such as a landowner who protects a forest. Today those credits pass through brokers who keep a cut, different countries run separate markets, and the same credit can be counted twice. Soheil Saraji, a petroleum engineer, and Mike Borowczak, a computer scientist, both then at the University of Wyoming, proposed moving credits onto a blockchain: a shared record that anyone can check and nobody can quietly edit. This page lets you run each piece of their design.
</div>

<div class="lede" data-levels="hs" markdown="1">
A carbon credit is worth one ton of carbon dioxide (CO₂). Saraji and Borowczak propose turning each verified credit into a digital token. A panel of verifiers must agree, at least 70% of them, before a token is created. Tokens trade in a pool that sets prices automatically and charges a small fee (0.3% in their example), instead of a broker's 3 to 8%. When a company uses a credit, the token is burned, destroyed for good, and the company receives a certificate. Every step is written to a blockchain, a list of records where each record carries a fingerprint of the one before it.
</div>

<div class="lede" data-levels="ug" markdown="1">
The paper is a design white paper with four smart contracts: a registry of verifiers, credit holders, and customers; a token contract that mints and burns carbon tokens (ERC-20) and issues certificates (ERC-721 non-fungible tokens); a multi-signature contract requiring 70% of verifiers to approve each mint and burn; and an automated market maker (AMM) that trades carbon tokens against a stablecoin with a 0.3% fee paid to liquidity providers. A 2020 hackathon prototype, linked from the paper, implements three of the contracts in Solidity. This page models those contracts exactly, implements the market with Balancer's pool arithmetic, and builds a hash-linked ledger in the browser.
</div>

<div class="lede" data-levels="grad" markdown="1">
Saraji and Borowczak attribute the limited impact of carbon markets to fragmentation, opaque credit life cycles that permit over-crediting and double counting, verifiers paid by the projects they verify, and broker commissions of 3 to 8% (5% on average). Their design answers each with a mechanism: a public registry, tokenized credits with explicit mint and burn rules, a 70% multi-signature quorum of accredited verifiers, a constant-function market maker with a 0.3% fee, and certificates for burned tokens. The paper reports no experiments. The page therefore reproduces what can be reproduced: its worked example, its stated parameters, and the behavior of the contracts it links.
</div>

<div class="lede" data-levels="res" markdown="1">
Saraji and Borowczak (arXiv:2107.00185, 2021) specify a carbon credit system as four smart contracts serving three stakeholder classes plus liquidity providers, and point to a three-contract prototype from the Fall 2020 ETHGlobal hackathon (CarbonCreditProject/Carbon-Project). This page compiles that prototype unchanged (imports aside) and checks a JavaScript model of it against the Ethereum virtual machine call for call; builds the README's Balancer pool from Balancer V1's own fixed-point code; and contrasts the paper's stated rules with what the released contracts enforce. The differences are substantive for the paper's central claim about double counting, and they are listed in the notes at the end with the page's checks of the paper's market figures.
</div>

## Balance the books

<div id="cc-offset" class="w-demo"></div>

<div data-levels="public" markdown="1">
This is the paper's own example. Company A may emit 100 tons but emits 120. Landowner B protected a forest and holds 50 credits. Company A buys the 20 it needs, and Landowner B keeps 30. Move the sliders to try other cases. The table at the bottom compares two ways to buy: through a broker who takes a commission, or from the paper's trading pool, which charges a much smaller fee.
</div>

<div data-levels="hs" markdown="1">
The rule is one subtraction: shortfall = emitted − allowance. With the paper's numbers, 120 − 100 = 20 credits. At the page's illustrative price of 25 DAI per credit (DAI is a digital token that tracks the US dollar), 20 credits cost 500 DAI before anyone takes a cut. A 5% broker adds 25 DAI, for 525. The pool's 0.3% fee is about 1.52 DAI, and the pool's price creeps up as it sells, adding about 5.05 DAI, for 506.57 in total.
</div>

<div data-levels="ug grad res" markdown="1">
The offset arithmetic is the paper's Section 1.3.1 example and reproduces exactly (shortfall 20, seller keeps 30). The pool row is Balancer's `swapExactAmountOut` on a 50/50 pool of 50,000 DAI and 2,000 tokens with the paper's 0.3% fee; the 506.57 DAI it returns splits into 500 DAI at the starting price, 1.52 DAI of fee, and 5.05 DAI of price impact. The broker row is the commission the paper cites. The pool's size and price are the page's choices; the third demo shows how both change the comparison.
</div>

## One token, from forest to certificate

<div id="cc-life" class="w-demo"></div>

<div data-levels="public" markdown="1">
Press **Next step** to follow 50 credits from Landowner B's forest to Company A's certificate. The numbered buttons are five verifiers; a pressed button means that verifier approves. The design needs at least 70% of them, four of five, before tokens are created or destroyed. Unpress two verifiers and try again: the record refuses. Press **Mint again** after minting: the design refuses to create tokens twice for the same credits, which is how it prevents double counting.
</div>

<div data-levels="hs" markdown="1">
Seventy percent of five is 3.5, and a verifier cannot half-approve, so the rule needs four. Change the number of verifiers and watch the requirement: seven of ten, five of seven, three of four. After the burn, Company A holds no tokens, the total number of tokens drops by 20, and one certificate appears, because the design issues one certificate for every 20 tokens burned.
</div>

<div data-levels="ug" markdown="1">
Switch **Rules** to **The released code** to run the same story through the hackathon contracts, call by call. The log shows each function and whether the transaction succeeds or reverts (is rolled back). Only the most recently registered verifier passes the contract's `onlyVerifier` check, so four of the five approvals revert, and the code has no quorum. **Mint again** succeeds and doubles Landowner B's balance, because `createCarbonToken` never clears the approved amount. Company A cannot burn its own tokens: `burnTokens` is restricted to the account that deployed the contract.
</div>

<div data-levels="grad res" markdown="1">
The design rule is approvals × 10 ≥ 7 × n, the integer form of "at least 70%," so the quorum is ⌈0.7n⌉: three of three, three of four, four of five, and 14 of 20. Any coalition of more than 30% can block a mint or burn, and a 70% coalition can mint unbacked tokens. The released code replaces the quorum with a single signer (the last verifier registered) and leaves the approval amount live after minting, so one holder call repeated *k* times mints *k* × 50 tokens from 50 approved credits. The final step of the code path also fails: `addBurnedTokens` calls the owner-only `burnTokens`, and the certificate's `mint` is declared `internal` with no external caller.
</div>

## A market without a broker

<div id="cc-pool" class="w-demo"></div>

<div data-levels="public" markdown="1">
The paper replaces brokers with a pool: a shared pot of carbon tokens and dollar tokens that anyone can trade against. The curve shows every mix of the two the pool accepts. Buying tokens moves you along the curve, and each token costs a little more than the last. For a small purchase, the pool is cheaper than a broker. Slide toward a large purchase and the rising price overtakes the broker's commission.
</div>

<div data-levels="hs" markdown="1">
The pool keeps the product of its two balances fixed: 50,000 × 2,000 = 100,000,000. Take 20 tokens out, leaving 1,980, and the DAI balance must rise to 100,000,000 ÷ 1,980 ≈ 50,505, so you pay about 505 DAI, plus the 0.3% fee. With this pool, buying through it costs less than a 5% broker up to 89 tokens; from 90 tokens on, the broker is cheaper.
</div>

<div data-levels="ug" markdown="1">
The paper's README names a Balancer smart pool. A Balancer pool with equal weights is a constant-product market maker: the invariant *x*·*y* = *k* holds before fees, and the fee is charged on the amount paid in and stays in the pool for its liquidity providers. Every number here comes from Balancer V1's own fixed-point arithmetic (18 decimal places, its rounding and error checks included), ported to JavaScript BigInt. **Pool size** scales both balances at a fixed starting price: deeper pools cut the price impact of the same purchase.
</div>

<div data-levels="grad res" markdown="1">
For a weighted pool, the cost of Δ tokens out is *x*[(*y*/(*y* − Δ))^(*w*ᵧ/*w*ₓ) − 1]/(1 − *f*), and the marginal price is (*x*/*w*ₓ)/(*y*/*w*ᵧ). With equal weights the exponent is one, and Balancer's `bpow` returns the exact integer power with no series approximation. The crossover against a broker at commission *c* falls roughly where the price impact reaches *c* − *f*: 53 tokens at 3%, 90 at 5%, and 143 at 8% for this pool (the page's computation). Balancer also refuses trades that pay out more than a third of a balance (`MAX_OUT_RATIO`), which caps one purchase at 666 tokens here. The fee selector runs from 0.01% to 10%, inside Balancer's allowed range of 0.0001% to 10%.
</div>

## Try to rewrite the record

<div id="cc-chain" class="w-demo"></div>

<div data-levels="public" markdown="1">
Each row is one block of the record, and its hash is a fingerprint computed from everything in the block, including the previous block's fingerprint. Press **Change 20 to 200 in block 2**, the kind of edit a cheat would make. Block 2's fingerprint changes completely, so it no longer has the required zeros, and block 3 no longer points to it. To hide the change, a cheat must redo the work for block 2 and every block after it, and on a real network, faster than everyone else adding new blocks.
</div>

<div data-levels="hs" markdown="1">
The fingerprint is SHA-256, which turns any text into 64 hexadecimal digits. Finding a block whose fingerprint starts with three zeros takes about 16 × 16 × 16 = 4,096 tries on average, since each digit is zero one time in 16. Press **Re-mine from the change on** and watch the counter. Each extra zero multiplies the work by 16; set four zeros and try again.
</div>

<div data-levels="ug" markdown="1">
Each block hashes the string index | previous hash | data | nonce. Validation recomputes every hash, checks its leading zeros (proof of work), and checks that each block names its predecessor's hash. Editing block 2 breaks its proof of work and block 3's link at once; re-mining block 2 alone fixes the first and leaves the second. SHA-256 here is the page's own implementation, matched against Node's on 2,408 inputs that cross every padding boundary.
</div>

<div data-levels="grad res" markdown="1">
Section 2.1 of the paper describes exactly this structure: a cryptographic puzzle that is costly to solve and cheap to verify, chained so that rewriting history requires redoing all later work. The demo is a single-writer chain; the security argument the paper relies on comes from many independent writers, where a rewrite must outpace the honest majority's work. The paper's market would inherit that guarantee from the underlying chain (Ethereum, in the prototype), not from its own contracts, which is why the contract-level rules in the second demo carry the weight of preventing double counting.
</div>

## What the paper proposes

<div data-levels="public" markdown="1">
- Carbon credits become digital tokens, created only after independent verifiers check the project behind them.
- Most of a verifier panel (70%) must agree before tokens are created or destroyed.
- Buyers and sellers trade in an automated pool with a small fee instead of paying brokers.
- A used credit is destroyed for good, and the buyer gets a certificate proving the offset.
- Companies, landowners, verifiers, governments, and concerned citizens can all see the same record.
</div>

<div data-levels="hs" markdown="1">
- Global greenhouse gas emissions reached 55.6 billion tons of CO₂ equivalent in 2018, about 57% higher than in 1990.
- Brokers in today's carbon markets take 3 to 8% of each sale, 5% on average, and verifiers are often paid by the projects they check.
- The design uses four smart contracts: a registry, a token contract, a 70% verifier vote, and a trading pool with an example fee of 0.3%.
- At a Fall 2020 hackathon, a team led by the project's principal investigator built three of the contracts on an Ethereum test network.
</div>

<div data-levels="ug grad res" markdown="1">
- **Problem.** Fragmented cap-and-trade markets, unclear credit life cycles that allow over-crediting and double counting, verifiers paid by project developers, and broker commissions of 3 to 8% (5% average).
- **Registry (contract 1).** Verifiers, credit holders, and customers register on chain.
- **Token (contract 2).** Approved credits are minted as transferable, burnable carbon tokens; burning yields a non-fungible certificate.
- **Quorum (contract 3).** A multi-signature contract executes a mint or burn only with approval from at least 70% of verifiers.
- **Market (contract 4).** An automated market maker trades carbon tokens against digital money, pays liquidity providers a fee (0.3% in the example), and discovers price from supply and demand.
- **Prototype.** Three contracts from the Fall 2020 ETHGlobal hackathon, deployed to an Ethereum test network; the README names a Balancer pool for the market.
</div>

<div data-levels="grad res" markdown="1">
<div class="cc-table-wrap">
<table class="results-table">
<caption class="w-note">What the paper states and what this page computes from it.</caption>
<thead><tr><th>Quantity</th><th>Paper</th><th>This page</th></tr></thead>
<tbody>
<tr><td>Offset example (Section 1.3.1)</td><td>allowance 100, emitted 120, buys 20 of the landowner's 50</td><td>shortfall 20, seller keeps 30 (exact)</td></tr>
<tr><td>Verifier quorum</td><td>at least 70%</td><td>⌈0.7<i>n</i>⌉: 4 of 5, 7 of 10; released code: 1 (last registered)</td></tr>
<tr><td>Pool fee</td><td>0.3% (example)</td><td>0.3% in Balancer V1 arithmetic; 1.52 DAI on a 20-token purchase</td></tr>
<tr><td>Broker commission</td><td>3 to 8%, average 5%</td><td>pool cheaper below 53, 90, and 143 tokens respectively (page's pool)</td></tr>
<tr><td>Certificates</td><td>one per 20 burned tokens (README)</td><td>design: ⌊burned/20⌋; released code: none can be minted</td></tr>
<tr><td>Market growth, 2005 to 2009</td><td>10.9 to 143.7 billion USD, "annual rate of 108%"</td><td>90.5% per year implied; 108% for four years gives 204.0 billion</td></tr>
<tr><td>Fossil share of CO₂</td><td>89% (coal 39%, oil 31%, gas 18%)</td><td>components sum to 88%</td></tr>
</tbody>
</table>
</div>
</div>

## Why it matters

<div data-levels="public hs" markdown="1">
Carbon markets only cut emissions if every credit stands for a real ton removed and is counted once. A shared, tamper-evident record makes each credit's history visible from the moment it is verified to the moment it is used, and a pool with a small fee leaves more of each sale with the people who did the removing. The same approach could track other credits and permits. Ultimately, the paper's lesson for anyone building such a system is that the rules written into the code are the market's real rules, so they deserve the same scrutiny as the design.
</div>

<div data-levels="ug" markdown="1">
Smart contracts turn market rules into code that every participant can read and nobody can bypass, which is attractive for credits whose value depends entirely on trust in their issuance and retirement. That strength cuts both ways: a contract enforces exactly what it says. The gap between the paper's 70% quorum and the prototype's single signer, visible in the second demo, is the kind of difference an audit catches and a white paper cannot, and it shows why designs like this one need tests that pit the code against the design.
</div>

<div data-levels="grad res" markdown="1">
The design moves three trust problems on chain: issuance (who may mint), retirement (who may burn, and whether a burned credit can reappear), and price discovery (who sets the price and at what cost). Tokenization alone solves none of them; the quorum, the mint-burn invariants, and the market maker do. Constant-function market makers make the trading cost explicit and small for trades that are small relative to pool depth, and large otherwise, which ties the paper's broker comparison to liquidity. Verifier incentives remain off chain: a 70% quorum of verifiers paid by developers inherits the incentive problem the paper identifies.
</div>

<div data-levels="res" markdown="1">
## Notes from building this page

- **Double minting in the released code.** `createCarbonToken` mints `approvedCredits[holder]` and never resets it, so each repeated call mints the approved amount again; in the page's script, 50 approved credits become 100 tokens (`totalSupply` 100, `approvedCredits` still 50), identical in the Ethereum virtual machine. `tokensApprovedForBurn` is likewise never cleared.
- **No quorum in the code.** `onlyVerifier` compares the caller with `verifiers[verifiercount]`, the most recently registered verifier, and `onlyCreditHolder` with the most recent credit holder. `approveCreditsHeld(_holder)` adds the most recent holder's `creditsHeld` to any address. The paper's contract 3 (70% multi-signature) is not in the repository.
- **Burning and certificates.** `burnTokens` is `onlyOwner` and burns the deployer's own approved amount, so a customer cannot retire its tokens. `addBurnedTokens` credits the holder's approved amount after burning the owner's. The certificate's `mint` is `internal` with no caller, and its condition is `burnedTokens > 20` (strictly more than 20), where the README says one certificate per 20 burned.
- **Smaller defects.** The duplicate-verifier check reads `verifiers[reg_no]` while records are stored by count; `getVerifiers` returns slots 0 to *n* − 1 (an empty slot 0, and the last verifier missing); `getCreditHoilders` sizes its array by the verifier count and reverts when holders outnumber verifiers; `buyCarbonCredits` reverts for any nonzero amount, since the contract holds no tokens and can grant no allowance, and with amount zero it accepts ether with no way to withdraw it.
- **Market.** The repository has no market contract; the README names a Balancer smart pool. The page uses Balancer V1 (`balancer-core`, commit f4ed5d6) with equal weights. Against Balancer's own Decimal.js reference model, equal-weight outputs agree to within its 10⁻⁸ test tolerance; unequal weights depend on Balancer's series approximation (`BPOW_PRECISION` 10⁻¹⁰), which the page reproduces exactly but does not correct.
- **Market figures.** Growth from 10.9 to 143.7 billion USD between 2005 and 2009 implies 90.5% per year, not 108% (108% over four years would reach 204.0 billion; over three, 98.1). The coal, oil, and gas shares (39, 31, and 18%) sum to 88%, against the stated 89%, probably rounding. The figures come from the paper's cited sources, which the page did not consult.
- **Licensing.** The prototype's Solidity files carry `SPDX-License-Identifier: UNLICENSED`. The page's ledger is a behavioral model written for comparison, not a copy; the Balancer port carries Balancer's GPLv3 header.
- **What is the page's own.** The pool balances and 25 DAI price, the crossover sizes, the quorum table beyond the 70% rule, the hash-chain format and difficulty, and all code findings are computed or chosen by the page.
</div>

<div data-levels="hs" markdown="1">
## Try this in class

1. Work the paper's example by hand: a company may emit 100 tons and emits 120, and a landowner holds 50 credits. How many credits change hands, and how many does the landowner keep? Then invent two cases of your own and check them in the first demo.
2. A pool holds 50,000 DAI and 2,000 tokens, and the product of the two balances stays fixed. Compute the DAI balance after someone buys 100 tokens, and the price they paid per token. Compare with a 5% broker at 25 DAI per token, and check your answer in the third demo.
3. In the last demo, time how long re-mining takes with three zeros and with four. Predict the time for five zeros before you try it, and explain your prediction to a partner.
</div>

---
title: "Two Chains for One Election: Blockchain Voting Built by Students"
kicker: "Interactive paper · IEEE ISC2 2018"
subtitle: "An interactive companion to Rafer Cooley, Shaya Wolf, and Mike Borowczak's account of two student-built blockchain voting systems, and the trade-off between checking an election and keeping each ballot secret."
description: "Walk a voter through the paper's two-chain voting procedure, compare what a public observer sees on each system's ledger, try to sell a vote with and without a receipt, hack polling stations until the record flips, and sign a ballot for a group without revealing who signed."
share_description: "Two student teams built blockchain voting systems: one on a branch of Ethereum, one from scratch with separate chains for voters and votes. Cast ballots, try to buy a vote, and hack polling stations in your browser, written for five reading levels."
share_text: "Two blockchain voting systems, one trade-off between auditing an election and keeping ballots secret. Try them in your browser:"
share_image: /papers/blockchain-elections/share.png
share_image_alt: "A chart of the chance that hacked polling stations outvote honest ones, against the chance each station is hacked, for 5, 25, and 100 stations; with 100 stations the curve stays near zero until the chance passes 40 percent. Beside it, the title Two Chains for One Election."
date: 2026-10-21
topics: ["Cryptography", "Privacy"]
default_level: public
level_hints:
  public: No background needed
  hs: Hashes, percentages, and a little probability
  ug: Hashing, data structures, and public keys
  grad: Consensus, coercion, and signature schemes
  res: Full design, the page's choices, and open questions
authors:
  - name: Rafer Cooley
    affiliation: Computer Science Department, University of Wyoming
  - name: Shaya Wolf
    affiliation: Computer Science Department, University of Wyoming
  - name: Mike Borowczak
    affiliation: Computer Science Department, University of Wyoming
    member: mike-borowczak
sources:
  - venue: "IEEE ISC2 2018 · Workshop on Blockchain Enabled Sustainable Smart Cities (BLESS)"
    title: "Blockchain-Based Election Infrastructures"
    url: https://doi.org/10.1109/ISC2.2018.8656988
    access: Paywalled (IEEE)
citations:
  - Borowczak2018ISC2-BLESS
widget:
  css:
    - /papers/blockchain-elections/widget.css
  js:
    - /papers/blockchain-elections/election-engine.js
    - /papers/blockchain-elections/widget.js
credit: "Interactive page by the [DRACO Lab](/). The paper publishes no code and no measurements, so `election-engine.js` builds what the paper describes and marks every choice the paper leaves open (the cipher, the block format, the key length, the counting rule among stations, and the ring signature scheme) as the page's own. The voting procedure follows the paper's Figure 1 step for step. An independent Python implementation (`reference/verify.py`, using `hashlib` and Python integers) agrees with the engine on all 1,792 checks: SHA-256 on 300 inputs (also against Node's), 25 replayed elections (every acceptance, refusal, block hash, and count), 10 re-use ledgers, 500 station tallies, 300 binomial tails, and 40 ring signatures matched value for value, with forged, altered, and repeated signatures caught. The paper's one figure, an attacker needing 51% of the voting systems, reproduces as 51 of 100 stations. Everything runs on your device."
bibtex: |
  @inproceedings{cooley2018blockchain,
    author    = {Cooley, Rafer and Wolf, Shaya and Borowczak, Mike},
    title     = {Blockchain-Based Election Infrastructures},
    booktitle = {2018 IEEE International Smart Cities Conference (ISC2)},
    pages     = {1--4},
    year      = {2018},
    doi       = {10.1109/ISC2.2018.8656988}
  }
---

<div class="lede" data-levels="public" markdown="1">
Most elections ask voters to trust one office to collect, count, and protect every ballot. In a course at the University of Wyoming offered only once, students built two voting systems on a blockchain instead: a shared record that every polling station keeps a copy of, so no single office can quietly change it. Rafer Cooley, Shaya Wolf, and Mike Borowczak describe both systems and the hard question they ran into. A record that anyone can check makes cheating hard, yet a voter who can prove a choice can also be paid or pressured to make it. This page lets you run both systems and see that trade-off for yourself.
</div>

<div class="lede" data-levels="hs" markdown="1">
A blockchain is a list of records where each record carries a fingerprint (a hash) of the one before it, so changing an old record breaks every link after it. The paper's first team re-used an existing blockchain, Ethereum. The second team re-invented one with two separate chains: one records which voters received a voting key, and the other records the ballots. Every polling station holds a copy of both. The paper weighs four goals for an election (integrity, security, privacy, and fault tolerance) and shows that two of them, letting voters audit the count and keeping ballots secret, pull in opposite directions.
</div>

<div class="lede" data-levels="ug" markdown="1">
Cooley, Wolf, and Borowczak report two proof-of-concept systems from a one-time University of Wyoming course. The re-use system branches Ethereum, validates a voter identification number against an approved voter database, and records a hash of the ID beside the vote. The re-invent system keeps an ID chain and a vote chain: staff encode voter information and a unique key in the ID chain, a voting station accepts the key only if it appears there and has not voted, and the ballot goes to the vote chain encrypted, under the hashed key. This page implements both procedures in the browser, with SHA-256 hashing, public-key encryption, and a linkable ring signature.
</div>

<div class="lede" data-levels="grad" markdown="1">
The paper is a four-page design report for the IEEE ISC2 2018 workshop on blockchain-enabled smart cities. It argues that a replicated, append-only ledger held by every polling station removes the single trusted tallying authority, and it frames the design space with one tension: auditability against ballot secrecy, since a voter who can verify a ballot's content can also prove it to a coercer. The re-use system favors live transparency; the re-invent system separates voter authentication from ballot storage, encrypts ballots, mentions ring signatures, and withholds receipts. The paper reports no measurements, so the page reproduces its procedure and its one quantitative claim, then lets the reader test each design choice.
</div>

<div class="lede" data-levels="res" markdown="1">
Cooley, Wolf, and Borowczak (ISC2 2018, BLESS workshop) describe two student systems without code, data, or evaluation: an Ethereum branch with hashed voter IDs and plaintext votes, and a two-chain design (ID chain and vote chain) whose procedure appears as a sequence diagram (Fig. 1). Sections on integrity, security, privacy, fault tolerance, mobile voting, and smart contracts state properties qualitatively; the only figure is the claim that an attacker would need 51% of the voting systems. The page instantiates every unspecified primitive (SHA-256, exponential ElGamal, 128-bit keys, a strict-majority rule over online stations, and LSAG ring signatures over a 2048-bit Schnorr group), checks the engine against an independent Python implementation, and lists in the closing notes where the design's stated properties depend on those choices.
</div>

## Cast a ballot, step by step

<div id="be-vote" class="w-demo"></div>

<div data-levels="public" markdown="1">
Press **Next step** seven times to walk the first voter through the paper's procedure, from the check-in table to the ballot box. Election staff record the voter and hand over a key card (the paper uses a QR code). The voting station accepts the card only if staff issued it and nobody has used it. Then try to cheat: press **Scan the same key again** to vote twice, or **Scan a made-up key** to vote without checking in. The station refuses both. When you have a few voters, press **Close the polls and count**.
</div>

<div data-levels="hs" markdown="1">
Watch the two lists at the bottom. The ID chain gets a block when staff check a voter in; the vote chain gets a block when the voter submits a ballot. Neither stores a name or a key directly: each stores a hash, a 64-digit fingerprint that is easy to compute from the key and practically impossible to run backward. The station decides with two lookups: is this key's hash on the ID chain, and is it missing from the vote chain? The ballot itself is stored scrambled (encrypted), so the vote chain shows that someone voted without showing the choice.
</div>

<div data-levels="ug" markdown="1">
Each block stores `index | previous hash | data`, and its own hash covers all three, so the chains are tamper-evident. Registration appends `voter=SHA-256(info); key=SHA-256(key)` to the ID chain. The station's check is two scans: the key hash must appear in some ID-chain block and in no vote-chain block, which enforces the paper's two rules (no ballot without an issued key, no key used twice). The ballot block holds the key hash and an ElGamal ciphertext under the election officials' public key; counting decrypts each ciphertext with the officials' private key. The paper specifies the checks and the encryption, not the formats, so the formats and the cipher are the page's.
</div>

<div data-levels="grad res" markdown="1">
The demo follows Fig. 1 exactly: voter information and a unique key enter the ID chain; the key reaches the voter as a QR code; the station checks uniqueness against the ID chain; the ballot is encoded "with Unique Key into Vote Chain." The Privacy section adds that the re-invent system encrypts the vote and hashes the voter ID. The page encrypts with exponential ElGamal (the message as *g*<sup>*m*</sup>) under a single officials' key and decrypts by search over the three candidates. A real deployment would split that key among several officials (threshold decryption) so that no one office can open single ballots; the paper does not say who holds the key. Note that the ID chain block ties a voter's information to the same key hash that labels the ballot, so ballot secrecy rests entirely on the encryption.
</div>

## What an observer can see

<div id="be-observe" class="w-demo"></div>

<div data-levels="public" markdown="1">
The two systems record the same 12 ballots in different ways. Switch between them. In the **re-use** system, anyone can read each vote beside a scrambled voter number, and anyone can watch the count change during the election. In the **re-invent** system, the ballots stay scrambled until the polls close. Now look at the vote buyer below the table. The paper points out that if voters can see and show their own vote afterward, someone could pay or pressure them for it. Choose **Receipt** to see what goes wrong when a system hands voters that proof.
</div>

<div data-levels="hs" markdown="1">
The re-use count is 4, 5, and 3 votes for Candidates A, B, and C, readable by anyone at any moment. That transparency is what the paper means by auditability: every voter can check the count. The cost appears with the receipt. An encrypted ballot looks like random digits, and the voter cannot prove what is inside. With a receipt (the secret random number used to scramble the ballot), anyone can scramble each candidate's name the same way and see which one matches the block. A receipt turns a secret ballot into a provable one.
</div>

<div data-levels="ug" markdown="1">
ElGamal encryption is randomized: the ciphertext (*g*<sup>*r*</sup>, *g*<sup>*m*</sup>*y*<sup>*r*</sup>) depends on a fresh random *r*, so the same choice encrypts differently every time and a buyer cannot simply encrypt "Candidate C" and compare. Handing the voter *r* removes that protection: the buyer recomputes *g*<sup>*m*</sup>*y*<sup>*r*</sup> for each candidate *m* and finds the match. The paper's re-invent system therefore lets a voter confirm that the block was added to the chain, but not its contents, and states that this choice "prioritizes privacy over auditability."
</div>

<div data-levels="grad res" markdown="1">
The paper's trade-off is the property the voting literature calls receipt-freeness (Benaloh and Tuinstra, 1994): a voter must be unable to prove a vote even if willing to. The re-use ledger lacks it in a way the paper does not discuss: revealing one's voter ID makes the hashed ID a receipt. **Hash every four-digit ID** shows a second weakness, computed by the page: an unsalted hash of a small identifier space is reversible by enumeration, so 9,000 hashes (about a tenth of a second in a browser) unmask every re-use voter, while the re-invent chain's 128-bit random keys resist the same search. Both points are the page's analysis of the design as described, not results reported in the paper.
</div>

## Fifty-one percent of the stations

<div id="be-majority" class="w-demo"></div>

<div data-levels="public" markdown="1">
Every polling station keeps its own copy of the record, and the stations go with whatever most of them hold. The paper's point: a hacker would have to break into 51% of the voting systems instead of one central computer, with little hope of going unnoticed. Press **Hack one more station** until the record flips. With 100 stations, the honest record holds through 49 hacked stations; at 50 neither side has a majority and the count stalls, and at 51 the hacked record wins. Then try **Take one offline**: stations that go dark leave the election running, which is the fault tolerance the paper describes.
</div>

<div data-levels="hs" markdown="1">
A majority means more than half. With 100 stations that is 51, the paper's figure; with 5 stations it is three, or 60%; with 11 it is six. Switch sizes and count the clicks. At exactly 50 hacked and 50 honest, neither record has a majority, and the stations cannot agree. Try taking stations offline first, then hacking: the majority is counted among the stations still running, so every station that goes dark makes the hacker's job a little smaller.
</div>

<div data-levels="ug" markdown="1">
The page's rule: a ledger version is accepted when ⌊*k*/2⌋ + 1 of the *k* online stations hold it, so an attacker needs ⌊*k*/2⌋ + 1 compromised stations, 51 of 100. The paper states the 51% figure but no consensus protocol for the re-invent system (its networking used peer discovery), so the rule is the page's simplest faithful reading. Majority voting tolerates crashed stations, the paper's fault-tolerance claim, as long as the honest copies outnumber the hacked ones among those still running.
</div>

<div data-levels="grad res" markdown="1">
The chart, computed by the page, gives the chance that independent compromises reach a majority, a binomial tail P(*X* ≥ ⌊*n*/2⌋ + 1) with *X* ~ Bin(*n*, *p*). Replication sharpens a threshold rather than removing it: at *p* = 0.30 the hacked record wins with probability 0.16 with 5 stations, 0.017 with 25, and 9.0 × 10⁻⁶ with 100, while at *p* = 0.5 it stays near one half for any size (0.46 for 100, where ties stall). The independence assumption is the weak point: stations running identical software share vulnerabilities, so one exploit moves *p* for all of them at once. Offline stations also shrink the quorum, so an attacker who can disconnect 4 of 10 stations needs only 4 hacked ones, 40% of the total (page's computation). The paper's "51% of the voting systems" counts machines; Ethereum's comparable bound, which the re-use system inherits, counts mining power or stake.
</div>

## Sign for the group

<div id="be-ring" class="w-demo"></div>

<div data-levels="public" markdown="1">
The paper's re-invent system uses ring signatures, a kind of signature that proves "one member of this group signed" without saying which member. Pick a signer and press **Sign and submit**: the station accepts the ballot without learning who cast it. Now sign again with the same member. The station rejects the second ballot because it carries the same tag as the first, so it knows the same person signed twice, yet it still does not know who that person is.
</div>

<div data-levels="hs" markdown="1">
Each member has a secret key and a public key, and the five public keys form the ring. Signing uses the signer's secret key and everyone's public keys, and the check uses only public keys, so the result looks the same whichever member signed. The tag (called a key image) comes from the signer's secret key alone, so a second ballot from the same member carries the same tag. The station can stop double voting by comparing tags, without a list that connects tags to names.
</div>

<div data-levels="ug" markdown="1">
This is LSAG (Liu, Wei, and Wong, 2004). For a ring of public keys *y*<sub>0</sub>…*y*<sub>4</sub>, the signer *π* computes a key image *I* = *h*<sup>*x*<sub>*π*</sub></sup> (with *h* a hash of the ring mapped into the group), then a chain of five challenges, each the hash of the previous step's commitments, which closes into a loop only with knowledge of one secret key. The signature is one challenge, five responses, and the key image: 448 bytes for a ring of five in this 2048-bit group. Switch **In transit** to **Change the ballot after signing** and the loop no longer closes.
</div>

<div data-levels="grad res" markdown="1">
LSAG gives signer ambiguity within the ring, unforgeability, and linkability through the key image *I* = *H*<sub>p</sub>(*L*)<sup>*x*</sup>, where *L* is the ring; two signatures share *I* exactly when one key produced both, which is the paper's "no voter can vote more than once" rule without an identity. The paper names ring signatures for the re-invent system but not the scheme, the ring (all registered voters, or a per-precinct set), or how they combine with the ID chain, whose blocks already link voters to keys; LSAG is the page's choice. Signing and verifying each cost about 4*n* group exponentiations (under a quarter second each for *n* = 5 in the page's tests; the demo shows your device's times), linear in the ring size, which bounds how large an anonymity set a voting station can check per ballot.
</div>

## What the paper describes

<div data-levels="public" markdown="1">
- Students built two blockchain voting systems in a course the University of Wyoming offered only once, with advice from local election officials.
- One system re-used Ethereum, a large existing blockchain; the other was built from scratch with one chain for voters and one for votes.
- Every polling station holds a full copy of the record, so changing the count means breaking into most of the stations.
- Checking an election and keeping each vote secret pull against each other; the from-scratch system chose secrecy.
- The same design could support voting from phones, which the paper sees as a way to raise turnout, with added security needs.
</div>

<div data-levels="hs" markdown="1">
- **Re-use team:** branched Ethereum, checked a voter ID number against an approved voter list, and stored a hash of the ID beside the vote, so anyone can watch the count in real time.
- **Re-invent team:** kept voters and votes on separate chains, gave each voter a one-time key as a QR code, encrypted ballots, and used ring signatures.
- An attacker would have to hack 51% of the voting systems to change the record.
- Letting a voter see a ballot's contents afterward would make the chain easy to audit and would also open the door to bribery and pressure, so the re-invent system shows only that the ballot was added.
- Correcting a mistaken vote after the fact would mean revealing who cast it, so both systems let voters check their ballot before submitting.
</div>

<div data-levels="ug grad res" markdown="1">
- **Re-use (Ethereum branch).** Application programming interface (API) calls pass voter input to the chain; a voter ID is validated against an approved database; the ledger records hashes of voter IDs and shows "who each hash voted for"; integrity comes from Ethereum's consensus.
- **Re-invent (two chains).** An ID chain for voter authentication and a vote chain for ballots, so each can use its own validation rules; one-time keys issued at the polls; ballots encrypted and keys hashed; ring signatures for anonymous signing; peer-discovery networking; several front ends, including mobile.
- **Integrity and security.** Each station keeps the ledger and maintains consensus with the others; a successful attack requires 51% of the voting systems.
- **Privacy.** Auditability trades against anonymity; the re-invent system favors privacy and withholds ballot contents from everyone, the voter included.
- **Fault tolerance and future work.** Stations can fail without stopping the election; node admission still relies on the people who set up voting booths, which the authors propose to replace with a smart contract that adds a node only with majority permission.
</div>

<div data-levels="grad res" markdown="1">
<div class="be-table-wrap">
<table class="results-table">
<caption class="w-note">What the paper states and what this page builds or computes from it.</caption>
<thead><tr><th>Item</th><th>Paper</th><th>This page</th></tr></thead>
<tbody>
<tr><td>Voting procedure</td><td>Fig. 1, seven messages among voter, staff, ID chain, station, and vote chain</td><td>implemented step for step; double use and unissued keys refused</td></tr>
<tr><td>Attack threshold</td><td>"51% of the voting systems"</td><td>⌊<i>k</i>/2⌋ + 1 of <i>k</i> online stations: 51 of 100, 3 of 5</td></tr>
<tr><td>Re-use privacy</td><td>hashes of voter IDs; ledger shows who each hash voted for</td><td>reproduced; 4-digit IDs reversed by 9,000 hashes (page's analysis)</td></tr>
<tr><td>Re-invent privacy</td><td>vote encrypted, voter ID hashed, no receipt</td><td>exponential ElGamal; a receipt (<i>r</i>) makes the vote provable</td></tr>
<tr><td>Ring signatures</td><td>named, scheme unspecified</td><td>LSAG, 2048-bit group, 448-byte signature for a ring of five</td></tr>
<tr><td>Measurements</td><td>none reported</td><td>none claimed; every figure above is computed in the browser</td></tr>
</tbody>
</table>
</div>
</div>

## Why it matters

<div data-levels="public hs" markdown="1">
Elections need two things at once: everyone must be able to trust the count, and nobody should be able to see or prove how any one person voted. A shared record held by many polling stations makes the count much harder to change in secret. Ultimately, the paper's lasting lesson is the trade-off its students found by building: every feature that lets a voter check a ballot has to be weighed against the chance that someone will demand that proof.
</div>

<div data-levels="ug" markdown="1">
Blockchains replace trust in one operator with replication and cryptographic links, which suits a process like voting where the operator is exactly what voters may doubt. The paper shows that the replicated ledger is the easy part. The hard parts are the ones it names: who may join the network, how ballots stay secret while the count stays checkable, and how a voter recovers from a mistake. Building both systems in one course let students meet those questions in working code rather than in a textbook.
</div>

<div data-levels="grad res" markdown="1">
Replication answers tampering after the fact; it does not answer coercion, voter authentication, or the trust placed in whoever admits nodes and holds decryption keys, and the paper identifies the last of these as its open problem. Its auditability-privacy tension anticipates the design goals of end-to-end verifiable voting, where voters verify that a ballot was counted as cast without gaining a receipt for its content. The student systems sit at two ends of that spectrum, and the page's demos make each end concrete enough to test.
</div>

<div data-levels="res" markdown="1">
## Notes from building this page

- **No code, data, or evaluation.** The paper describes two student systems qualitatively and reports no throughput, latency, scale, or security analysis. Every primitive on this page (SHA-256 with "voter|" and "key|" prefixes, 128-bit keys, exponential ElGamal under one officials' key, the block format, the majority rule, and LSAG) is the page's choice and is labeled as such.
- **Ethereum's consensus in 2018.** The paper credits the re-use system with "the same modified proof-of-stake measures that Ethereum uses." Ethereum's main network ran proof of work until September 2022; proof of stake was then a planned transition. A private branch can run either, and the paper does not say which the team configured.
- **Re-use secrecy.** The paper calls identifying a voter's choice "not as trivial" because IDs are hashed. Unsalted hashes of short IDs are reversible by enumeration, and a voter who reveals an ID gives a buyer a receipt. Both observations are the page's.
- **Two links in the re-invent design.** Fig. 1 writes voter information and the unique key to the same ID-chain block, and the vote chain labels each ballot with the key. Anyone holding the ballot decryption key can therefore read individual votes by name. Ring signatures, which the Security section names, could break that link if the ballot carried a ring signature instead of the key; the paper does not say how the two mechanisms fit together.
- **What 51% counts.** The paper's threshold counts voting machines. Under a majority-of-online rule, disconnecting honest stations lowers the number an attacker must compromise; independence of compromises, which the binomial chart assumes, rarely holds for identical machines.
- **Stated but not shown.** Byzantine fault tolerance, mobile front ends, and the proposed smart contract for node admission are described without mechanisms; the page does not model them.
- **Citation details.** The DOI follows the IEEE pattern of the same proceedings (article 8656988) and should be confirmed; the site's bibliography entry gains it in this change.
</div>

<div data-levels="hs" markdown="1">
## Try this in class

1. In the first demo, check in three voters and vote for each. Then try to vote twice and to vote with a made-up key. Write down which chain the station checks for each refusal and why that chain holds the answer.
2. With 5, 11, 25, and 100 stations, find the fewest hacked stations that flip the record. Write the rule as a formula, then predict the answer for 1,000 stations before checking it with your formula.
3. Hold a class debate on the paper's trade-off: should voters be able to see their own ballot on the chain after voting? Use the receipt switch in the second demo to explain what a vote buyer could do with that ability.
</div>

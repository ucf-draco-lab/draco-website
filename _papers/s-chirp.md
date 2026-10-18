---
title: "Round-Robin Talk for Tiny Devices: CHIRP and S-CHIRP"
kicker: "Interactive paper · IEEE ICCE 2018 and IEEE Potentials 2019"
subtitle: "An interactive companion to Mike Borowczak and George Purdy's protocol that lets every device in a swarm talk to every other device in as few rounds as there are devices, with no coordinator, and to the IEEE Potentials article that follows it into crowded, overlapping networks."
description: "Watch a network of small devices pair off round by round until everyone has talked to everyone, knock devices out and bring them back, shuffle the round order to keep outsiders guessing, and see what happens when two networks share one channel."
share_description: "How can a swarm of tiny devices make sure everyone talks to everyone, with no server in charge? One line of modular arithmetic. Step through CHIRP and S-CHIRP in your browser, written for five reading levels."
share_text: "One line of modular arithmetic lets every device in a swarm talk to every other device, with no server in charge. Try it in your browser:"
share_image: /papers/s-chirp/share.png
share_image_alt: "Eight numbered devices on a circle joined by all 28 conversation lines, colored by the round in which each pair talks, beside the title Round-Robin Talk for Tiny Devices."
date: 2026-10-18
default_level: public
level_hints:
  public: No background needed
  hs: Remainders, counting, and a little algebra
  ug: Modular arithmetic and networking basics
  grad: Graph theory, permutations, and threat models
  res: Full protocol, reproduction, and open questions
authors:
  - name: Mike Borowczak
    affiliation: University of Wyoming
    member: mike-borowczak
  - name: George Purdy
    affiliation: University of Cincinnati
  - name: Shaya Wolf
    affiliation: University of Wyoming
  - name: Rafer Cooley
    affiliation: University of Wyoming
sources:
  - venue: "IEEE ICCE · 2018"
    title: "S-CHIRP: Secure Communication for Heterogeneous IoTs with Round-Robin Protection"
    url: https://arxiv.org/abs/1710.00381
    access: Open access (arXiv)
  - venue: "IEEE Potentials 38(1):14–19 · 2019"
    title: "S-CHIRP: Securing Communications in Lightweight Peer-to-Peer Networks in the IoT"
    url: https://doi.org/10.1109/MPOT.2018.2850600
    access: Paywalled (IEEE)
citations:
  - Borowczak2018SCHIRP
  - "8595464"
widget:
  css:
    - /papers/s-chirp/widget.css
  js:
    - /papers/s-chirp/chirp-engine.js
    - /papers/s-chirp/widget.js
credit: "Interactive page by the [DRACO Lab](/). The browser engine implements the paper's pairing rule (Eq. 2), its secure variant (Eq. 6), round recovery (Eq. 4), and the efficiency loss (Eq. 3), plus the article's collocated networks. It reproduces all 56 visible cells of Table I, every row of Table II, the complete-graph and round counts of Figures 1 to 3, the memory estimates of Section II-B, five of six rows of Table III to three figures, and the cycle alignments of the Potentials article's Figures 4 to 6 (every four rounds for device counts four and two; every 15 for five and three). Every pair met exactly once in a full cycle for all network sizes from 2 to 64, in order and shuffled. Everything runs on your device."
bibtex: |
  @inproceedings{borowczak2018schirp,
    author    = {Borowczak, Mike and Purdy, George},
    title     = {{S-CHIRP}: Secure Communication for Heterogeneous {IoTs} with Round-Robin Protection},
    booktitle = {2018 IEEE International Conference on Consumer Electronics (ICCE)},
    pages     = {1--6},
    year      = {2018},
    eprint    = {1710.00381},
    archivePrefix = {arXiv}
  }

  @article{wolf2019schirp,
    author  = {Wolf, Shaya and Cooley, Rafer and Borowczak, Mike},
    title   = {{S-CHIRP}: Securing Communications in Lightweight Peer-to-Peer Networks in the {IoT}},
    journal = {IEEE Potentials},
    volume  = {38},
    number  = {1},
    pages   = {14--19},
    year    = {2019},
    doi     = {10.1109/MPOT.2018.2850600}
  }
---

<div class="lede" data-levels="public" markdown="1">
Picture a swarm of small drones, sensors, or garden sprinklers that must all share information with one another, with no central server to tell them who talks when. Each device can talk to only one other device at a time. Mike Borowczak and George Purdy found a rule so simple that a device needs only three numbers to follow it: its own number, the size of the group, and the current round. With that rule, every device talks to every other device in as many rounds as there are devices, and the group keeps working when devices drop out or come back. A later article by Shaya Wolf, Rafer Cooley, and Mike Borowczak asks what happens when neighbors run their own swarms on the same channel.
</div>

<div class="lede" data-levels="hs" markdown="1">
Number the devices 0, 1, 2, and so on up to *n* − 1. In round *r*, each device computes its partner as (*r* − its own number), then takes the remainder after dividing by *n*. Two devices always agree that they are partners, nobody is double-booked, and after *n* rounds every pair has met exactly once. The secure version, S-CHIRP, plays the rounds in a secret shuffled order, so an outsider cannot predict who talks next. This page lets you run both, step by step.
</div>

<div class="lede" data-levels="ug" markdown="1">
CHIRP (Communication for Heterogeneous IoTs with Round-Robin protection) schedules all-to-all, one-to-one exchanges in an *n*-node peer-to-peer network with one equation: target = (*r* − self) mod Node<sub>cnt</sub> (Eq. 2). Each round is a perfect or near-perfect matching, every edge of the complete graph appears exactly once per *n*-round cycle, and a node joining mid-cycle recovers the round index from the first node that contacts it (Eq. 4). S-CHIRP replaces *r* with Pr(C)[*r*], a shared permutation of the cycle (Eq. 6), so the schedule becomes a per-network key. The Potentials article extends the scheme to cliques of devices that share one channel and proposes distinct prime device counts to keep their cycles apart.
</div>

<div class="lede" data-levels="grad" markdown="1">
The schedule is a round-robin 1-factorization of the complete graph K<sub>n</sub>: node *s* meets node *t* exactly in the round with (*s* + *t*) ≡ *r* (mod *n*), and the solutions of 2*s* ≡ *r* give each node one self-paired checkpoint per cycle. Because a node computes its partner from (*r*, self, *n*) alone, the protocol needs no topology knowledge, no routing state, and no coordinator, and it degrades gracefully: missing nodes cost (Node<sub>cnt</sub> − Node<sub>actual</sub>) / Node<sub>cnt</sub> of each cycle (Eq. 3). S-CHIRP keys the network with one of *n*! cycle orders. The Potentials article studies collocated cliques whose identifiers overlap and classifies their exchanges as valid, invalid, colliding, or inactive.
</div>

<div class="lede" data-levels="res" markdown="1">
Borowczak and Purdy (ICCE 2018) define CHIRP by Algorithm 1 and Eq. 2, prove the *n*-round cycle against the lower bound of Eq. 1, quantify node loss (Eq. 3, Fig. 4) and re-entry (Eq. 4, Tables I and II), and introduce S-CHIRP's permuted cycle (Eq. 6, Algorithm 2, Tables III and IV), suggesting a seeded Fisher–Yates shuffle or a stored permutation. Wolf, Cooley, and Borowczak (IEEE Potentials, 2019) apply the scheme to collocated cliques and propose distinct prime device counts (Figs. 3 to 6). This page implements every equation in JavaScript, checks the printed tables cell by cell, and adds two analyses the papers do not report: an outsider's chance to predict S-CHIRP's next round, and per-round event counts for collocated cliques. Both are labeled as this page's own.
</div>

## Everyone meets everyone

<div id="sc-cycle" class="w-demo"></div>

<div data-levels="public" markdown="1">
Press **Next round** a few times. In each round the devices pair off, and the bold lines show who is talking right now; thin lines are conversations already finished. After eight rounds, all 28 pairs of eight devices have talked. Now tap two devices to take them out, as if their batteries died, and press **Start over**: the rest still meet each other, and the devices that would have talked to a missing one simply wait that round.
</div>

<div data-levels="hs" markdown="1">
Try the rule by hand with eight devices in round 3. Device 1 computes 3 − 1 = 2, so it talks to device 2; device 2 computes 3 − 2 = 1, so it agrees. Device 5 computes 3 − 5 = −2, and the remainder of −2 after dividing by 8 is 6, so device 5 talks to device 6. A shortcut falls out of the rule: devices *a* and *b* meet in the round equal to (*a* + *b*) mod *n*. Every pair has exactly one such round, so every pair meets exactly once per cycle. With *n* devices, the cycle takes *n* rounds.
</div>

<div data-levels="ug" markdown="1">
A round can hold at most ⌊*n*/2⌋ disjoint pairs, so building all *n*(*n* − 1)/2 edges needs at least *n* − 1 rounds for even *n* and *n* for odd *n* (Eq. 1). CHIRP settles on *n* rounds in every case, and the extra round is a feature: each node pairs with itself exactly once per cycle, a built-in checkpoint the paper suggests for resets or internal work. Missing nodes do not break the schedule. A node whose computed partner is absent idles for that round, and each present node idles in exactly Node<sub>cnt</sub> − Node<sub>actual</sub> rounds per cycle, the loss Eq. 3 predicts.
</div>

<div data-levels="grad res" markdown="1">
Each round *r* is the matching {*s*, *r* − *s*}; for odd *n* one node is fixed, and for even *n* rounds of even *r* fix two nodes (*r*/2 and *r*/2 + *n*/2) while odd rounds are perfect matchings. The paper states that each round holds at least (*n* − 1)/2 pairs; for even *n* the even rounds hold *n*/2 − 1, so the bound holds as ⌊(*n* − 1)/2⌋. The page checks the full cycle for every *n* from 2 to 64: each of the *n*(*n* − 1)/2 pairs appears exactly once, each node self-pairs once, and for random sets of missing nodes the measured idle fraction equals Eq. 3 exactly.
</div>

## Joining in the middle of a cycle

<div id="sc-join" class="w-demo"></div>

<div data-levels="public" markdown="1">
A device that wakes up or arrives late does not know which round the group is on. It does not need to ask. The first device that calls it gives away the answer, because the caller's number plus the newcomer's own number points straight at the round. The newcomer checks a few more callers to be sure the rounds count up the way they should, then joins in.
</div>

<div data-levels="hs" markdown="1">
Turning the rule around gives the round: if device *t* calls device *s*, then the round is (*t* + *s*) mod *n* (Eq. 4). In the paper's example, device 4 rejoins an eight-device group. It hears from device 0, then 1, 2, and 3, then nobody (its own checkpoint), then 5, 6, and 7. Adding 4 to each and taking the remainder after dividing by 8 gives rounds 4, 5, 6, 7, 0, 1, 2, and 3, which count up in order. Press **Join at a random moment** to drop in somewhere else.
</div>

<div data-levels="ug grad res" markdown="1">
Re-entry requires Node<sub>actual</sub> < Node<sub>cnt</sub> and an unused index; the round then follows from any inbound contact. The left table is the paper's Table I with the newcomer's column masked; the right is Table II. Validating several consecutive contacts, as the paper suggests, guards against a single spoofed or mistaken contact, and the same idea lets a node detect an index collision: if its inbound contacts do not produce consecutive rounds, its own index is wrong. Under S-CHIRP, Eq. 4 yields Pr(C)[*r*] rather than *r*, so a newcomer also needs the network's permutation to place itself in the cycle.
</div>

## Shuffling the rounds: S-CHIRP

<div id="sc-shuffle" class="w-demo"></div>

<div data-levels="public" markdown="1">
Plain CHIRP is predictable: once you see one round, you know every round that follows. S-CHIRP keeps the same rule but plays the rounds in a secret order that only members of the group know. Everyone still meets everyone once per cycle. An outsider listening in, though, can no longer tell who will talk next, and a device that calls at the wrong moment stands out.
</div>

<div data-levels="hs" markdown="1">
Compare the two settings. In order, the shaded cells (rounds in which someone talks to device 0) run down a diagonal line. Shuffled, they scatter. The number of possible orders is *n*! (*n* factorial: 8 × 7 × 6 × … × 1). Eight devices already have 40,320 orders, and 128 devices have more orders than there are atoms in the observable universe. Storing the chosen order takes very little room: one number per round.
</div>

<div data-levels="ug" markdown="1">
S-CHIRP changes one term: target = (Pr(C)[*r*] − self) mod Node<sub>cnt</sub> (Eq. 6). Because Pr(C) is a bijection on the cycle, each round is still a valid matching and each edge still appears once per cycle; only the order changes. The paper offers two ways to share Pr(C): a seeded Fisher–Yates shuffle computed on each device (O(*n*) time, in place, but every device must run the same random number generator), or a permutation built off-device and stored, at 4*n* bytes with 32-bit indices (40 KB for 10,000 nodes, 4 MB for a million). A footnote adds Sattolo's algorithm, which draws only single *n*-cycles.
</div>

<div data-levels="grad res" markdown="1">
The paper argues that a permuted cycle "requires immense resources to track, detect and exploit," and lists the per-network permutation as the mechanism that lets nodes detect rogue communication. This page quantifies one side of that claim with its own analysis. A receiver can check a caller with (caller + self) mod *n* = Pr(C)[*r*]; that check rejects a rogue that does not know the current round value. The same equation also means one overheard pair reveals that round's value, so the protection against an eavesdropper is forward-looking: after *k* observed rounds of a cycle the next value is uniform over the *n* − *k* unused values, and a permutation reused unchanged across cycles is fully exposed after one cycle. Re-seeding per cycle, which the paper's seeded shuffle makes cheap, removes the second weakness.
</div>

## Two networks, one channel

<div id="sc-cliques" class="w-demo"></div>

<div data-levels="public" markdown="1">
Neighbors run their own device groups, and those groups often share the same airwaves. If two groups count their rounds the same way, their devices can end up talking to the wrong neighbor's devices. The Potentials article suggests a fix: give each group a different prime number of slots (a prime divides only by itself and one), even if that leaves a few slots empty. Press **Figs. 4 and 5**, then **Fig. 6**, and watch how much less often the two groups fall into step.
</div>

<div data-levels="hs" markdown="1">
Each colored box marks the round where a group starts a new cycle. With four and two devices, group B's cycle fits exactly twice into group A's, so the two start together every four rounds, and in half of all rounds the two groups sit at the same step of their cycles. Giving the groups five and three slots instead makes the cycles line up only once every 15 rounds, the least common multiple of 5 and 3. The cost: the extra slots are empty, so some devices spend rounds calling nobody.
</div>

<div data-levels="ug" markdown="1">
Identifiers are assigned within each clique, so device 1 of clique A and device 1 of clique B answer to the same index on a shared medium. When two cliques use the same Node<sub>cnt</sub>, or counts that divide one another, their schedules coincide in many rounds and cross-clique exchanges recur on a short period. The article's remedy pads each clique's count to a distinct prime, which pushes full alignment out to lcm(*p*<sub>1</sub>, *p*<sub>2</sub>) = *p*<sub>1</sub>*p*<sub>2</sub> rounds at the price of inactive exchanges toward empty slots. The table counts each kind of exchange over one joint period under this page's event rules.
</div>

<div data-levels="grad res" markdown="1">
Computed by this page, not reported in the article: for the example cliques of four and two devices, distinct prime counts cut invalid cross-clique pairs from 0.50 to 0.27 per round and collisions from 1.00 to 0.80, while adding 1.47 inactive attempts per round and lowering valid pairs from 2.00 to 1.53. The fraction of rounds with at least one cross-clique event rises from 2 of 4 to 10 of 15, so prime counts make cross-clique contact less regular and less frequent per round without eliminating it, consistent with the article's caution that overlap persists at the least common multiple. S-CHIRP's per-clique permutations address the remaining exposure from a different direction.
</div>

## What the papers found

<div data-levels="public" markdown="1">
- Any number of devices can all talk to one another, one pair at a time, in as many rounds as there are devices, using a rule small enough for the cheapest chip.
- The group keeps working when devices disappear and lets them rejoin without asking anyone for help.
- Playing the rounds in a secret order turns the schedule into a password that outsiders cannot easily guess.
- Neighboring groups on the same channel step on each other less when their sizes are distinct prime numbers.
</div>

<div data-levels="hs" markdown="1">
- One formula, partner = (round − my number) mod *n*, gives every device its partner with no central controller.
- *n* devices need only *n* rounds, and every device gets one free round per cycle to check itself.
- With 64 devices, the number of possible secret round orders passes 10⁸⁹; storing one order for a million devices takes about 4 MB.
- Groups of four and two devices fall into step every four rounds; padding them to five and three slots stretches that to every 15.
</div>

<div data-levels="ug grad res" markdown="1">
- **Complete exchange in *n* rounds.** Eq. 2 yields a complete graph of *n*(*n* − 1)/2 edges in *n* rounds, one round above the lower bound for even *n* (Eq. 1, Figs. 1 to 3).
- **Graceful loss and re-entry.** Efficiency falls linearly with missing nodes (Eq. 3, Fig. 4), and a returning node recovers the round from inbound indices (Eq. 4, Tables I and II).
- **Keyed schedules.** A shared cycle permutation preserves every property above and draws from *n*! schedules (Eq. 6, Tables III and IV); storage is 4*n* bytes, within 10 MB at a million nodes.
- **Collocated cliques.** Overlapping identifiers produce valid, invalid, colliding, and inactive exchanges; distinct prime device counts delay cycle alignment to the least common multiple (Potentials, Figs. 3 to 6).
- **Limits.** The articles name changing populations, the security of the non-keyed protocol, and conflicts with already busy devices as open problems, and leave multi-agent simulation to future work.
</div>

<div data-levels="grad res" markdown="1">
<div class="sc-table-wrap">
<table class="results-table">
<caption class="w-note">Possible cycle orders by network size (ICCE 2018, Table III) and this page's exact values.</caption>
<thead><tr><th>Nodes and rounds</th><th>Paper</th><th>Exact n!</th></tr></thead>
<tbody>
<tr><td>8</td><td>4.03 × 10⁵</td><td>40,320 (4.03 × 10⁴)</td></tr>
<tr><td>10</td><td>3.63 × 10⁶</td><td>3,628,800</td></tr>
<tr><td>16</td><td>2.09 × 10¹³</td><td>2.0923 × 10¹³</td></tr>
<tr><td>32</td><td>2.63 × 10³⁵</td><td>2.6313 × 10³⁵</td></tr>
<tr><td>64</td><td>1.26 × 10⁸⁹</td><td>1.2689 × 10⁸⁹</td></tr>
<tr><td>128</td><td>3.85 × 10²¹⁵</td><td>3.8562 × 10²¹⁵</td></tr>
</tbody>
</table>
</div>
</div>

## Why it matters

<div data-levels="public hs" markdown="1">
Swarms of tiny devices (crop sensors, delivery drones, pill-sized medical sensors, and smart-home gadgets) often have no server, little memory, and no reliable map of who is nearby. CHIRP gives them a way to share everything with everyone using three numbers and one line of arithmetic, and S-CHIRP adds a secret that keeps outsiders guessing. Ultimately, the simpler the rule, the more kinds of devices can follow it, from radios to blinking lights to sound.
</div>

<div data-levels="ug" markdown="1">
Most IoT security work builds on addressing and key distribution schemes that assume a stable topology. CHIRP assumes almost nothing: no routing tables, no leader, and no knowledge of the network beyond its maximum size, which suits ephemeral, heterogeneous swarms where nodes are lost, replaced, or moved. Because the schedule is independent of the physical medium, the same protocol can run over radio, visible light, or sound in a contested electromagnetic environment, and it leaves room to layer existing key-sharing and encryption on top.
</div>

<div data-levels="grad res" markdown="1">
The contribution is a schedule with provable coverage, constant per-node state, and O(1) computation per round, which makes keyed communication patterns affordable on devices that cannot run a routing protocol. Its security rests on the secrecy of the permutation and on per-round validation of callers; the papers do not evaluate an active adversary, and the event analysis above suggests that clique separation by device counts alone reduces, rather than removes, cross-clique contact.
</div>

<div data-levels="res" markdown="1">
## Notes from building this page

- **Table IV is one round value behind Eq. 6.** With Pr(C) = [7, 5, 2, 0, 4, 6, 1, 3], all 64 printed cells equal (Pr(C)[*r*] − 1 − self) mod 8, and none equals Eq. 6 as written. The text's "simple 5 round offset, C = [5, 6, 7, 0, 1, 2, 3]" lists seven values and starts one above Table I's first row, which Eq. 2 places at *r* = 4. Both point to a one-based round counter in the code that produced the tables. The Potentials article numbers rounds from 1, and its figures match Eq. 2 with *r* = round − 1. The page uses Eq. 6 as printed.
- **Table III.** The 8-node row should read 4.03 × 10⁴ (8! = 40,320). The other five rows match to three figures, two of them (64 and 128) by truncation rather than rounding (1.2689 and 3.8562).
- **Pairs per round.** For even *n*, rounds with even *r* hold *n*/2 − 1 pairs, so the stated minimum of (*n* − 1)/2 pairs holds as ⌊(*n* − 1)/2⌋.
- **Distinct primes.** The article's rule ("the nearest unique prime number") is read here as the smallest unused prime greater than the clique's size, which reproduces its example (four and two become five and three). Sizes that are already prime are padded too under this reading; "nearest" could instead allow a prime size to keep its count.
- **Collocated events.** The article defines valid, invalid, collision, and inactive exchanges (Fig. 3) without counts. The rules here (shared channel, shared round counter, an index names a device in each clique that has it, collisions counted once per contested index) are this page's formalization, and the per-round figures in the cliques demo depend on them.
- **Eavesdropper analysis.** The 1 in (*n* − *k*) prediction chance and the observation that one overheard pair reveals Pr(C)[*r*] are this page's analysis, not the paper's.
</div>

<div data-levels="hs" markdown="1">
## Try this in class

1. Seat six classmates in a circle, numbered 0 to 5. For rounds 0 through 5, each student computes (round − own number) mod 6 and stands with that partner. Record the pairs and check that every pair of students met exactly once.
2. Take one student out and repeat. Count the rounds each remaining student spends waiting, and compare with (6 − 5) / 6 of the cycle.
3. Write the six round numbers on cards, shuffle them, and replay the cycle in the shuffled order while one student, who has not seen the cards, tries to predict each next pair. Record how often the predictor is right as the cycle goes on.
</div>

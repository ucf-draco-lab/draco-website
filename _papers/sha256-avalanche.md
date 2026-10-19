---
title: "One Bit In, Half the Bits Out: The Avalanche Inside SHA-256"
kicker: "Interactive paper · Cryptography 2024 and 2026"
subtitle: "An interactive companion to two papers by Riley Vaughn and Mike Borowczak on how SHA-256 spreads a single-bit change, and which of its seven parts do the spreading."
description: "Flip one bit of a message and watch SHA-256 scramble it round by round, switch off any of its seven internal parts, and measure the avalanche in your browser."
share_description: "Flip one bit and about half of SHA-256's output changes. Watch it happen round by round, switch off its seven internal parts, and measure the avalanche in your browser. Written for five reading levels."
share_text: "Flip one bit and about half of SHA-256's output changes. Watch the avalanche round by round and measure it in your browser:"
share_image: /papers/sha256-avalanche/share.png
share_image_alt: "A grid of bits lighting up across 64 rounds of SHA-256, with the title One Bit In, Half the Bits Out."
date: 2026-10-17
topics: ["Cryptography"]
default_level: public
authors:
  - name: Riley Vaughn
    affiliation: University of Wyoming
    link: https://github.com/RileyVaughn
  - name: Mike Borowczak
    affiliation: University of Central Florida
    member: mike-borowczak
sources:
  - venue: "Cryptography 8(3):40 · 2024"
    title: "Strict Avalanche Criterion of SHA-256 and Sub-Function-Removed Variants"
    url: https://www.mdpi.com/2410-387X/8/3/40
    access: Open access
  - venue: "Cryptography 10(3):32 · 2026"
    title: "Relaxation of Strict Avalanche Criterion on All SHA-256 Sub-Function Combinations"
    url: https://www.mdpi.com/2410-387X/10/3/32
    access: Open access
code:
  label: "Sha256-SAC, the authors' Go implementation"
  url: https://github.com/RileyVaughn/Sha256-SAC
citations:
  - cryptography8030040
  - cryptography10030032
widget:
  css:
    - /papers/sha256-avalanche/widget.css
  js:
    - /papers/sha256-avalanche/sha256-engine.js
    - /papers/sha256-avalanche/widget.js
credit: "Interactive page by the [DRACO Lab](/). The in-browser engine is a line-for-line port of the authors' Go implementation, checked bit for bit against it on all 128 sub-function settings, and it reproduces the 2026 paper's single-sub-function SAC-mean values to within 0.00001. Everything runs on your device; nothing you type leaves the page."
bibtex: |
  @article{vaughn2024sac,
    author  = {Vaughn, Riley and Borowczak, Mike},
    title   = {Strict Avalanche Criterion of {SHA-256} and Sub-Function-Removed Variants},
    journal = {Cryptography},
    volume  = {8},
    number  = {3},
    pages   = {40},
    year    = {2024},
    doi     = {10.3390/cryptography8030040}
  }

  @article{vaughn2026sac,
    author  = {Vaughn, Riley and Borowczak, Mike},
    title   = {Relaxation of Strict Avalanche Criterion on All {SHA-256} Sub-Function Combinations},
    journal = {Cryptography},
    volume  = {10},
    number  = {3},
    pages   = {32},
    year    = {2026},
    doi     = {10.3390/cryptography10030032}
  }
---

<div class="lede" data-levels="public" markdown="1">
Every software update, website login, and digital payment leans on a hash function to confirm that nothing changed along the way. SHA-256, one of the most widely used, turns any message into a 256-bit fingerprint. Change a single letter and about half of the fingerprint changes, in a pattern nobody can predict. Riley Vaughn and Mike Borowczak measured how quickly that scrambling takes hold inside SHA-256 and which of its seven internal parts do the work.
</div>

<div class="lede" data-levels="hs" markdown="1">
A hash function takes a message of any length (a word, a photo, a whole movie) and returns a short fingerprint of fixed length. SHA-256 returns 256 bits, usually written as 64 hexadecimal characters. Cryptographers expect a good hash to show an *avalanche*: flip one bit of the input and each output bit should flip with a 50 percent chance, like a fair coin. This page lets you test that claim, then break SHA-256 on purpose to find out which of its parts make the avalanche happen.
</div>

<div class="lede" data-levels="ug" markdown="1">
SHA-256 pads a message, splits it into 512-bit blocks, and runs each block through a compression function: 64 rounds that update eight 32-bit registers, *a* through *h*. Each round draws on seven sub-functions (Σ0, Σ1, Choose, Majority, modular addition, the round constants, and the message schedule). Vaughn and Borowczak measured, round by round, how well the compression function spreads a single-bit change, then repeated the measurement with sub-functions removed to isolate what each one contributes.
</div>

<div class="lede" data-levels="grad" markdown="1">
The Strict Avalanche Criterion (SAC) holds when complementing any single input bit changes every output bit with probability exactly ½. For the SHA-256 compression function, that condition covers a 512 × 256 matrix of flip probabilities. The 2024 paper estimates that matrix after each of the 64 rounds from one million random message blocks and tests its extreme cells with binomial confidence intervals. The 2026 paper adds a Bonferroni correction across all 131,072 cells and repeats the study for every non-empty combination of the seven sub-functions.
</div>

<div class="lede" data-levels="res" markdown="1">
Two studies of round-wise diffusion in the SHA-256 compression function, each estimated from *k* = 1,000,000 random 512-bit blocks. The 2024 paper tests the full function and seven single-removal variants against SAC with binomial confidence intervals on the minimum and maximum matrix cells. The 2026 paper replaces that test with a Bonferroni-corrected band (½ ± 0.266% at 99% family-wise confidence), extends the analysis to all 127 non-empty sub-function combinations, and introduces a diffusion ratio that separates amplification from dampening between sub-functions. Every demo below runs on a port of the authors' Go implementation.
</div>

## Change one letter

<div id="sha-hash" class="w-demo"></div>

<div data-levels="public" markdown="1">
Try your own name, then change one letter. The fingerprint changes completely, yet the same message always produces the same fingerprint. That pairing of repeatable and unpredictable lets a website keep a fingerprint of your password instead of the password itself, and lets your computer confirm that a download arrived intact.
</div>

<div data-levels="hs" markdown="1">
The two starting messages differ in a single bit: lowercase *b* is 01100010 in binary and lowercase *c* is 01100011. That one bit changes roughly 128 of the 256 output bits. Press **Change one letter** a few times and watch the count wander around 128, the same way the number of heads wanders around 128 when you toss 256 coins.
</div>

<div data-levels="ug" markdown="1">
One flipped input bit changes about 128 of the 256 output bits. That average alone does not make a good hash, though. A function could flip the same 128 bits every time and still average one half. SAC asks for more: every individual output bit must flip half the time, for every input bit you could flip.
</div>

<div data-levels="grad res" markdown="1">
A single digest pair gives one sample of the Hamming distance, which for an ideal function follows Binomial(256, ½) with mean 128 and standard deviation 8. SAC is a stronger, per-cell condition: Pr[output bit *j* flips \| input bit *i* flips] = ½ for all 512 × 256 pairs (*i*, *j*). The demos below estimate that matrix directly.
</div>

## The seven parts

<div id="sha-parts" class="w-demo"></div>

<div data-levels="public hs" markdown="1">
SHA-256 mixes your message with seven different parts, 64 times over. Switch any of them off and every demo on this page runs the weakened version, including the fingerprints above. A weakened SHA-256 is insecure, and that is the point of the experiment: a deliberately broken copy shows what each part was doing.
</div>

<div data-levels="hs" markdown="1">
Try **Round constants only** and scroll back up to Messages A and B: two fingerprint bits change instead of about 128. Then try **Mixers only**. About half the fingerprint still changes, yet the chart in the measurement section shows the least-flipped and most-flipped lines stuck at 0 and 1. With only the mixers on, a given input bit flips the same output bits for every message, which is exactly the predictability a hash has to avoid.
</div>

<div data-levels="ug grad res" markdown="1">
Each round computes two temporaries, T1 = *h* + Σ1(*e*) + Ch(*e*, *f*, *g*) + Kₜ + Wₜ and T2 = Σ0(*a*) + Maj(*a*, *b*, *c*), shifts the registers down one place, and sets *a* = T1 + T2 and *e* = *d* + T1. The switches remove terms from those sums the same way the papers do. Removing addition replaces every round addition (and the final feed-forward) with XOR; removing the message schedule repeats the 16 block words four times instead of expanding them.
</div>

<div data-levels="grad res" markdown="1">
Each switch setting is one of the 2026 paper's 127 non-empty combinations, identified here by a 7-bit mask (1 = addition, 2 = K, 4 = Choose, 8 = Majority, 16 = Σ0, 32 = Σ1, 64 = schedule).
</div>

## Watch the change spread

<div id="sha-spread" class="w-demo"></div>

<div data-levels="public" markdown="1">
Press play to watch one changed bit travel through the 64 rounds. Each row is one of the eight words SHA-256 keeps while it works, and lit squares differ between the two versions of the message. For the first two rounds nothing lights up, because the changed letter has not been mixed in yet. Five rounds later about half the squares are lit, and they stay that way to the end.
</div>

<div data-levels="hs" markdown="1">
Every round, SHA-256 slides its eight words down one position (*a* into *b*, *b* into *c*, and so on) and computes fresh values for *a* and *e*. Watch a change that starts in one or two bits reach its neighbors, then everything. The curve under the grid counts the lit squares in every round; the dashed line marks 128, half of the 256 bits.
</div>

<div data-levels="ug" markdown="1">
The grid shows the XOR of the two state vectors (*a* through *h*) after each round. Differences enter through the round word Wₜ, so a flip in block word Wᵢ cannot appear before round *i* + 1. The default flip sits in W2: it enters at round 3 and fills about half the state by round 8. A flip in W15 waits until round 16, which is why the averaged measurement in the next section needs about 20 rounds. Step through the rounds one at a time and watch each row's pattern drop to the row below as the registers shift; switch off Σ1 and the spread slows.
</div>

<div data-levels="grad res" markdown="1">
One trajectory is one sample. The round at which a single pair reaches about 128 differing bits varies with the message and the flipped bit, and the register shift (*b*, *c*, *d* copy *a*; *f*, *g*, *h* copy *e*) means three-quarters of the state each round is a delayed copy of the rest. The measurement in the next section averages over all 512 input bits and *k* random blocks.
</div>

## Measure it the way the papers do

<div id="sha-measure" class="w-demo"></div>

<div data-levels="public" markdown="1">
The papers repeated the experiment above for one million random messages, flipping each of the 512 input bits in turn, and recorded how often every fingerprint bit flipped after every round. The line on the chart follows the average bit. It climbs to one half (a fair coin) around round 20, less than a third of the way through SHA-256's 64 rounds. Your browser can run a smaller version of the same measurement in a few seconds.
</div>

<div data-levels="hs" markdown="1">
The two thinner lines follow the least-flipped and most-flipped of all 131,072 input-output bit pairs. SAC asks that even those two extremes reach one half. At the start they sit at 0 and 1: some output bits never change and some always do. Count how many rounds both lines need to close in on one half, then switch a part off above and count again.
</div>

<div data-levels="ug" markdown="1">
For each random block, the experiment flips each of the 512 input bits, runs both blocks through the compression function, and records which of the 256 state bits differ after every round. Averaging over *k* blocks gives a 512 × 256 matrix of flip rates for each round, and the chart plots that matrix's mean, minimum, and maximum. The dotted vertical line marks the round where the 2026 paper found the current combination settles inside its acceptance band for good, when the paper reports one.
</div>

<div data-levels="grad res" markdown="1">
With *k* blocks, each cell is a binomial proportion with standard deviation √(¼/*k*). The 2026 paper tests all 131,072 cells at once, so it divides α = 0.01 across them (α′ ≈ 7.6 × 10⁻⁸), which puts the critical value at *z* ≈ 5.327 and the acceptance band at ½ ± 5.327·√(¼/*k*). At *k* = 1,000,000 the band is ½ ± 0.266%; the shaded band on the chart applies the same formula to the *k* behind the curves. The 2024 paper instead built a 99% binomial confidence interval around the minimum and maximum cells, a stricter test under which no variant, including the full function, satisfies SAC.
</div>

<div data-levels="res" markdown="1">
Two definitions matter when comparing numbers. The *SAC value* of a round is whichever of the matrix minimum and maximum lies farther from ½, and a round passes when that value falls inside the band. The *plateau round* is the first round after which every later round passes. Under these definitions the full function first passes at round 23, fails at rounds 54 through 57 (SAC value 0.49728 against a lower bound of 0.49734), and plateaus at round 58.
</div>

<div data-levels="grad res" markdown="1">

## All 127 combinations

<div id="sha-map" class="w-demo"></div>

The 2026 paper measures every non-empty subset of the seven sub-functions. This plot places each subset by its size and by the first round at which its matrix falls inside the band, using *k* = 256 runs of this page's engine (band ½ ± 16.6%). The wider band moves absolute rounds a few earlier than the paper's, while the ordering holds: combinations containing Σ1, addition, Choose, and the message schedule cross first, and the message schedule is the only sub-function that reaches SAC alone.

</div>

## What the papers found

<div data-levels="public" markdown="1">
- SHA-256 finishes scrambling a one-bit change by about round 23. The rounds after that keep mixing a message that already looks random.
- Four of the seven parts do most of the scrambling: the mixer for word *e* (Σ1), addition with carries, the chooser, and the message stretcher. Remove Σ1 and the scrambling arrives a few rounds later.
- The message stretcher is the only part that can scramble a message completely on its own, and it needs 40 rounds to do it.
- Measured across one million messages, every one of SHA-256's 131,072 input-output bit pairs lands within about a quarter of a percentage point of a perfect coin flip.
</div>

<div data-levels="hs" markdown="1">
- With all seven parts on, the average output bit reaches 50 percent around round 20, and even the least-flipped and most-flipped bit pairs reach the acceptance band by round 23.
- Removing the mixer for word *e* (Σ1) delays that point by about four rounds; removing addition with carries delays it by about two. Removing Majority, Σ0, or the round constants barely changes anything.
- On its own, each of the six other parts never scrambles the message completely, no matter how many rounds run. The message stretcher manages it alone by round 40.
- Parts work together: some pairs spread a change more than four times as much as you would predict from each part alone, and a few pairs (Choose with Majority, for example) work against each other.
</div>

<div data-levels="ug grad res" markdown="1">
- **The full function reaches SAC by round 23.** In 2024, the matrix mean passes at round 21 and the minimum and maximum plateau by round 23. In 2026, with the Bonferroni band, the full function first passes at round 23 and plateaus at round 58 after a four-round dip.
- **Σ1, addition, and Choose carry the diffusion.** Removing Σ1 slows diffusion by three to four rounds and removing addition by about two; removing Choose steepens the approach without delaying it. Removing Majority, Σ0, or the round constants leaves the curves close to the full function.
- **The message schedule matters less inside the full function than alone.** Removing it changes the plateau by about one round, yet it is the only sub-function that reaches SAC by itself (round 40), with a SAC-mean curve shaped like the full function's and shifted 17 rounds later.
- **Sub-functions interact.** The 2026 diffusion ratio compares a combination's measured SAC-mean with the value expected if its parts flipped bits independently. Ratios run as high as 4.38 (addition with Choose) and as low as 0.43 (Choose, Majority, and K), and dampening appears only in combinations of two or three sub-functions.
</div>

<div data-levels="grad res" markdown="1">
<table class="results-table">
<caption class="w-note">Plateau round for each single-removal variant (2026 paper, Bonferroni band at k = 1,000,000) with the 2024 observations for the same variant.</caption>
<thead><tr><th>Variant</th><th>2026 plateau</th><th>2024 observation</th></tr></thead>
<tbody>
<tr><td>Full SHA-256</td><td>58 (first pass 23)</td><td>Mean passes at 21; min/max plateau at 23 (49.7845% and 50.2024%)</td></tr>
<tr><td>Without Σ0</td><td>23</td><td>Close to the full function</td></tr>
<tr><td>Without Majority</td><td>23</td><td>Close to the full function</td></tr>
<tr><td>Without K</td><td>23</td><td>Close to the full function</td></tr>
<tr><td>Without Choose</td><td>23</td><td>Mean passes at 21; steeper approach to the plateau</td></tr>
<tr><td>Without schedule</td><td>24</td><td>Mean passes at 21; min/max plateau at 23</td></tr>
<tr><td>Without addition</td><td>25</td><td>Mean passes at 22; about two rounds slower</td></tr>
<tr><td>Without Σ1</td><td>27</td><td>Mean passes at 24; three to four rounds slower</td></tr>
</tbody>
</table>
</div>

<div data-levels="res" markdown="1">
<table class="results-table">
<caption class="w-note">Peak SAC-mean for each sub-function on its own, from the 2026 paper and from this page's engine (k = 64). Sub-functions without addition are linear over GF(2), so their SAC-mean barely depends on the sample.</caption>
<thead><tr><th>Sub-function alone</th><th>2026 paper</th><th>This page</th></tr></thead>
<tbody>
<tr><td>Σ0</td><td>0.29590 (round 36)</td><td>0.29590 (round 36)</td></tr>
<tr><td>Σ1</td><td>0.25879 (round 19), 0.276854 (round 55)</td><td>0.25879 (round 19), 0.27686 (round 55)</td></tr>
<tr><td>Addition</td><td>0.04444 (round 64)</td><td>0.04443 (round 64)</td></tr>
<tr><td>Choose</td><td>0.01562 (round 64)</td><td>0.01562 (round 64)</td></tr>
<tr><td>Majority</td><td>0.01561 (round 64)</td><td>0.01562 (round 64)</td></tr>
<tr><td>K</td><td>0.00586 (round 64)</td><td>0.00586 (round 64)</td></tr>
<tr><td>Message schedule</td><td>Reaches SAC at round 40</td><td>Inside the k = 64 band from round 38</td></tr>
</tbody>
</table>

Diffusion ratios from the 2026 paper, by combination size: size two runs from 0.50817 (Choose, Majority) to 4.38483 (addition, Choose); size three from 0.43115 (Choose, Majority, K) to 4.02964 (Choose, addition, K); size four from 1.0 to 3.32819 (addition, Choose, Majority, K); size five peaks at 2.02217 (without Σ1 and the schedule); and at size six the only ratio other than 1.0 belongs to the combination without the schedule (1.36574). At sizes two and three, combinations that include the message schedule stay close to 1.0.
</div>

## Why it matters

<div data-levels="public hs" markdown="1">
Hash functions guard software updates, stored passwords, digital signatures, and cryptocurrency ledgers. Knowing which internal parts carry the scrambling tells cryptographers where to aim their tests first, and tells designers which parts a faster, lighter hash cannot afford to drop.
</div>

<div data-levels="hs" markdown="1">
The method also shows how much of security research works: break a system on purpose, under controlled conditions, and measure what changes. Ultimately, the same idea drives DRACO's hardware work, from side channels in chips to the swarms of small devices that have to trust each other.
</div>

<div data-levels="ug" markdown="1">
Claude Shannon named diffusion as one of the two building blocks of a secure cipher in 1949 (the other is confusion). Diffusion measurements make that idea concrete for a deployed standard: they show which rounds and which sub-functions an attack on SHA-256 has to get past, and how much margin the 64 rounds leave beyond the point where diffusion completes.
</div>

<div data-levels="grad res" markdown="1">
The papers point future cryptanalysis at the sub-functions that carry diffusion (Σ1, addition, Choose, and the message schedule) and at the dampening seen in small combinations of Majority, Choose, and K. Neither paper performs collision analysis; both rest on the premise that faster diffusion goes with stronger collision resistance, which makes the sub-function-removed variants candidate stepping stones for differential attacks.
</div>

<div data-levels="res" markdown="1">
## Notes from building this page

- **The 2024 extremes match an ideal function.** For a function that met SAC exactly, the most extreme of 131,072 cells estimated at *k* = 1,000,000 sits about 4.5 standard deviations (roughly 0.22%) from ½. The reported 2024 minimum and maximum (49.7688% and 50.2119%) fall right at that expectation, which supports the 2026 move to a multiple-comparison correction.
- **The 54 to 57 dip may be one cell.** SHA-256 copies *e* into *f*, *g*, and *h* (and *a* into *b*, *c*, and *d*) over the following three rounds, so one extreme cell entering register *e* at round 54 would reappear unchanged through round 57. The identical SAC value reported for all four rounds (0.49728) fits that pattern, which would make the dip a single sampling deviation rather than four independent failures. This page's own *k* = 256 runs point the same way: every late excursion outside the band lasts exactly four rounds (17 excursions across 16 combinations), with start rounds scattered from 28 to 57. The paper's per-cell data would settle it for *k* = 1,000,000.
- **Reproduction cost.** Each combination at *k* = 1,000,000 takes 513 million compression calls and 64 × 512 × 256 counters; the authors' raw matrices total roughly 500 GB and are available from them on request. The page's engine handles *k* up to 4,096 in a browser tab.
</div>

<div data-levels="hs" markdown="1">
## Try this in class

1. Before switching anything off, predict which part matters most. Record your guess.
2. For full SHA-256, then without Σ1, then with **Mixers only**, note the round where the average bit first reaches 50 percent on the chart.
3. Run the measurement in your browser with 64 messages and again with 256. Compare the two curves and explain why the larger run gives a smoother line.
</div>

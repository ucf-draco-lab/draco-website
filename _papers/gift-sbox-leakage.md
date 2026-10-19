---
title: "Seven S-Boxes on Trial: Scoring a Cipher's Power Leak"
kicker: "Interactive paper · IEEE ISVLSI 2021"
subtitle: "An interactive companion to William Unger, Liljana Babinkostova, Mike Borowczak, and Robert Erbes's study of whether paper-and-pencil S-box scores predict how fast a power analysis attack breaks the GIFT-64 cipher."
description: "Recover a key nibble from simulated power measurements, follow the leak through GIFT-64 round by round, score seven 4-bit S-boxes on non-linearity, transparency order, and DPA signal-to-noise ratio, and race them under the paper's attack protocol in your browser."
share_description: "A lightweight cipher's S-box decides how loudly a chip leaks its key through the power line. This paper scored seven S-boxes with five leakage metrics and attacked each one. Recompute the scores and rerun the attack in your browser, written for five reading levels."
share_text: "Which S-box leaks a cipher's key the fastest? Score seven of them and rerun the power attack in your browser:"
share_image: /papers/gift-sbox-leakage/share.png
share_image_alt: "Simulated attack success curves for seven 4-bit S-boxes rising from zero to one hundred percent as power traces accumulate, beside the title Seven S-Boxes on Trial."
date: 2026-10-19
default_level: public
level_hints:
  public: No background needed
  hs: Bits, hexadecimal, and a little algebra
  ug: Digital logic, ciphers, and programming
  grad: Probability, correlation, and side channels
  res: Full method, reproduction, and open questions
authors:
  - name: William Unger
    affiliation: Boise State University
  - name: Liljana Babinkostova
    affiliation: Boise State University
  - name: Mike Borowczak
    affiliation: University of Wyoming
    member: mike-borowczak
  - name: Robert Erbes
    affiliation: Idaho National Laboratory
sources:
  - venue: "IEEE ISVLSI · 2021 · pp. 236–241"
    title: "Side-channel Leakage Assessment Metrics: A Case Study of GIFT Block Ciphers"
    url: https://doi.org/10.1109/ISVLSI51109.2021.00051
    access: Paywalled (IEEE)
code:
  label: "GIFT designers' reference implementation and test vectors (giftcipher/gift, MIT License)"
  url: https://github.com/giftcipher/gift
citations:
  - "9516763"
widget:
  css:
    - /papers/gift-sbox-leakage/widget.css
  js:
    - /papers/gift-sbox-leakage/gift-engine.js
    - /papers/gift-sbox-leakage/widget.js
credit: "Interactive page by the [DRACO Lab](/). The browser engine computes non-linearity (Eq. 6), transparency order (Eq. 3), revisited transparency order (Eq. 4), and DPA signal-to-noise ratio (Eq. 8) for the seven S-boxes of Table I, and runs GIFT-64 with any S-box. It reproduces 26 of the 28 deterministic cells of Table II (the two S2 cells that differ reproduce after swapping one pair of S2 entries), agrees with an independent NumPy implementation on all 35 metric values, and matches the GIFT designers' reference code on 158,200 round states (seven S-boxes, 200 random inputs each) and on every line of their three GIFT-64 test vectors. The attack demos run the paper's experiment and trial protocol (Algorithms 1 and 2) on simulated Hamming-weight leakage; the paper's measurements came from ChipWhisperer traces of an 8-bit XMEGA, so simulated success curves are this page's own. Everything runs on your device."
bibtex: |
  @inproceedings{unger2021isvlsi,
    author    = {Unger, William and Babinkostova, Liljana and Borowczak, Mike and Erbes, Robert},
    title     = {Side-channel Leakage Assessment Metrics: A Case Study of {GIFT} Block Ciphers},
    booktitle = {2021 IEEE Computer Society Annual Symposium on VLSI (ISVLSI)},
    pages     = {236--241},
    year      = {2021},
    doi       = {10.1109/ISVLSI51109.2021.00051}
  }
---

<div class="lede" data-levels="public" markdown="1">
A chip draws slightly more power when more of its wires carry a 1, and a probe on its power line can measure the difference. When the chip encrypts, those tiny swings can give away the secret key. William Unger, Liljana Babinkostova, Mike Borowczak, and Robert Erbes asked whether one small part of a cipher, its substitution box (S-box), decides how quickly that happens. They put seven different S-boxes into the same lightweight cipher, GIFT-64, scored each one with five published formulas, and then attacked a real microcontroller running each version. One score, non-linearity, lined up with the attack results best.
</div>

<div class="lede" data-levels="hs" markdown="1">
An S-box is a lookup table: it takes four bits (a number from 0 to 15, written 0 to F in hexadecimal) and returns four different bits. Lightweight ciphers such as GIFT, PRESENT, and PICCOLO each use one 16-entry S-box over and over. The paper swapped seven S-boxes into GIFT-64, measured how much power a small chip used while encrypting, and counted how many measurements an attacker needed to recover the key. With the PICCOLO S-box, the attack succeeded about half the time after roughly 35 measurements; with the weakest designed S-box, S3, it took about 50.
</div>

<div class="lede" data-levels="ug" markdown="1">
Correlation power analysis (CPA) predicts the Hamming weight of an intermediate value for every possible subkey and keeps the subkey whose prediction correlates best with measured power. The S-box output is the usual target, so the S-box's algebra shapes how well wrong guesses can masquerade as the right one. The paper evaluates seven 4-bit S-boxes (three from PICCOLO, GIFT, and PRESENT, four designed to vary the scores) with five metrics: non-linearity (NL), transparency order (TO), revisited transparency order (RTO), DPA signal-to-noise ratio (DPA-SNR), and a classical SNR. It then runs CPA on GIFT-64 with each S-box on a ChipWhisperer-hosted 8-bit XMEGA and compares mean success rates.
</div>

<div class="lede" data-levels="grad" markdown="1">
Transparency order and DPA-SNR were proposed as S-box-level predictors of differential power analysis resistance; non-linearity measures resistance to linear cryptanalysis and, by a known tension, tends to make CPA easier. The paper tests these predictors empirically: seven S-boxes in one GIFT-64 software implementation, a first-order Hamming-weight CPA on the round-2 S-box output, and mean success rate per trace count over 100 experiments drawn from 2,000 traces. Its conclusion: NL orders the S-boxes best, SNR separates S-boxes with equal NL, and differences in TO and RTO did not translate into practical CPA resistance.
</div>

<div class="lede" data-levels="res" markdown="1">
Unger, Babinkostova, Borowczak, and Erbes (ISVLSI 2021, pp. 236–241) define NL (Eq. 6), TO (Eq. 3), RTO (Eq. 4), DPA-SNR (Eq. 8), and SNR (Eq. 7), list seven S-boxes (Table I) with their scores (Table II), and report mean CPA success against trace count for GIFT-64 on an ATXMEGA128D4 (Figures 4 to 6), with an early-stopping experiment (Algorithm 1) averaged into trials (Algorithm 2). This page recomputes every deterministic Table II cell, reruns the protocol on simulated Hamming-weight leakage, and adds a rank-correlation comparison of the metrics against attack effort. The simulation, the rank correlations, and the readings of Figure 4 are this page's own and are labeled as such.
</div>

## Find the key from the power line

<div id="gl-guess" class="w-demo"></div>

<div data-levels="public" markdown="1">
The computer below hides a secret number from 0 to F. Each "measurement" is a random input passing through the S-box together with the secret, and the chip's power reading rises with the number of 1s in the S-box's answer, plus random noise. The attacker tries all 16 possible secrets and asks which one best explains the readings. Press **Add 10** a few times: one bar pulls ahead of the rest, and **Reveal the secret** shows whether it found the right one.
</div>

<div data-levels="hs" markdown="1">
For each guess, the attacker looks up what the S-box would output and counts its 1s (its Hamming weight). The bar shows how closely those predicted counts track the noisy readings, as a correlation from −1 to 1. The right guess predicts the readings well; wrong guesses only partly agree. Slide the noise up and the attacker needs more measurements to see the winner, which is why real attacks collect many traces.
</div>

<div data-levels="ug" markdown="1">
Each measurement is L = HW(S[x ⊕ k]) + N(0, σ²) for a uniform input nibble x and a fixed secret k. For every guess g, the page keeps running sums and computes Pearson's r between HW(S[x ⊕ g]) and L (Eq. 1). A wrong guess g correlates with the truth through the S-box's structure, so the S-box changes how far apart the bars sit. This single-nibble view is the inner loop of the paper's attack, which repeats it for all 16 nibbles of a round key.
</div>

<div data-levels="grad res" markdown="1">
The Hamming weight of a uniform nibble has variance 1, so the correlation between one measurement and the correct prediction is at most 1/√(1 + σ²), or 0.55 at the default σ = 1.5. Wrong-key correlations depend on ρ(δ), the correlation between HW(S[x]) and HW(S[x ⊕ δ]); for the seven S-boxes its largest value over δ ≠ 0 ranges from 0.25 (PICCOLO, S1) to 0.50 (PRESENT, S3, S4). The demo's leakage is simulated; it isolates the S-box from everything else a real device leaks.
</div>

## Where the leak sits inside GIFT-64

<div id="gl-cipher" class="w-demo"></div>

<div data-levels="public" markdown="1">
GIFT-64 scrambles 64 bits of data in 28 rounds. Each round runs every four-bit piece through the S-box, shuffles the bits, and mixes in part of the key. The first round adds key material only at its end, so the attacker can compute everything before that point. The highlighted row, the S-boxes of round two, is the first place where the secret affects the chip's work, and that is where the paper listened.
</div>

<div data-levels="hs" markdown="1">
Each row shows the 16 hexadecimal digits of the cipher's state after one step. Change one digit of the plaintext and watch how many digits change by the end of round two. Then pick another S-box: the steps stay the same, only the lookup table changes, which is exactly how the paper built its seven test ciphers.
</div>

<div data-levels="ug" markdown="1">
GIFT-64 rounds are SubCells (16 parallel 4-bit S-boxes), PermBits (a fixed bit permutation), and AddRoundKey, which XORs 32 key bits into bits 4*i* and 4*i* + 1 of each nibble, plus a 6-bit round constant and a fixed 1 in bit 63. The attacker knows x = PermBits(SubCells(plaintext)) and targets HW(S[x ⊕ m]) in round two, where m is the round-1 key-and-constant mask (shown at undergraduate level and up). Guessing all 16 values of each nibble of m recovers the constants along with the key bits, as the paper notes. Since each round key carries only 32 key bits, four consecutive round keys (rounds 2 to 5) are needed to invert the key schedule and recover all 128 bits.
</div>

<div data-levels="grad res" markdown="1">
The engine follows the designers' reference implementation (giftcipher/gift, MIT License) and reproduces every line of their three GIFT-64 test vectors, round by round, and all 158,200 round states from the reference code compiled with each of the seven S-boxes on 200 random inputs. **Designers' test vector** loads test vector 3; with the GIFT S-box, every row matches the published file. The paper's implementation stores nibbles in 8-bit variables, and its round-2 to round-5 points of interest correspond to the highlighted row in rounds two through five.
</div>

## Score the seven S-boxes

<div id="gl-metrics" class="w-demo"></div>

<div data-levels="public" markdown="1">
Each row is one S-box, and each column is one way researchers have tried to predict, with pencil and paper, how easily an S-box leaks. Your device computes them all from the 16-entry tables. Non-linearity measures how far the table is from simple, predictable arithmetic: PICCOLO, GIFT, and PRESENT score 4, the best possible for four bits, while S1, S3, and S4 score 0. Click a row to see its table, or type your own 16 digits.
</div>

<div data-levels="hs" markdown="1">
Try typing `0123456789ABCDEF`, the S-box that changes nothing. It scores 0 for non-linearity, because each output bit is simply an input bit. Now look at S4, which adds one to every input (0 becomes 1, F wraps around to 0), and S3, which subtracts every input from 16 (0 stays 0). Both also score 0: a few of their output bits follow a simple rule an attacker can predict exactly. Ciphers need high non-linearity to resist mathematical attacks; the paper asks what that choice does to the power leak.
</div>

<div data-levels="ug" markdown="1">
**NL** = 2ⁿ⁻¹ − max|W<sub>F</sub>(*u*, *v*)|/2 over nonzero output masks *v* (Eq. 6), using the Walsh transform of Eq. 2. **TO** (Eq. 3) measures how well the derivative of the S-box lets a Hamming-weight model separate keys; higher TO means more exposure, with a maximum of *n* = 4. **RTO** (Eq. 4) rebuilds TO from the cross-correlation spectrum of Eq. 5, and **DPA-SNR** (Eq. 8) estimates the signal a DPA attack sees through the S-box. The values in parentheses are the paper's Table II; 26 of the 28 deterministic cells match, and the two S2 cells that do not are highlighted.
</div>

<div data-levels="grad res" markdown="1">
Differential uniformity (the largest entry of the difference distribution table) is added for context: 4 for PICCOLO and PRESENT, 6 for GIFT, 8 for S2, 10 for S1, and 16 for S3 and S4, whose affine components (output masks *v* = 1, 2, and 3) make them unusable against classical cryptanalysis, as the paper intends. The Walsh heat map shows where the largest coefficients sit; NL = 8 − (largest |W| outside row 0)/2. S3 and S4 share identical TO, RTO, and DPA-SNR despite different tables, a tie the paper's Figure 6 then separates experimentally.
</div>

## Race the S-boxes

<div id="gl-race" class="w-demo"></div>

<div data-levels="public" markdown="1">
This demo repeats the attack 100 times for each S-box, as the paper did, and draws how often it succeeds as the attacker collects more measurements. The curves come from simulated measurements on your device, not from the paper's chip. In the paper's real measurements, PICCOLO fell fastest and the low-scoring S3 held out longest. In the simulation the order changes: here the curves follow a different score, DPA-SNR, which suggests the real chip leaked in ways the simple model leaves out.
</div>

<div data-levels="hs" markdown="1">
Each experiment adds one trace at a time from a pool of 2,000, runs the attack after each addition, and counts a success only when all 16 nibbles of the round key come out right. After five successes in a row, the experiment stops and counts the rest as successes. Averaging 100 experiments gives the mean success rate at each trace count. With the default noise and seed, PICCOLO reaches 50 percent at 36 traces and PRESENT at 47.
</div>

<div data-levels="ug" markdown="1">
Algorithm 1 draws traces without replacement from a fixed pool, attacks after each, and stops after five consecutive full-key successes (the remaining counts marked successful) or at the cap of 150. Algorithm 2 averages 100 experiments. The page keeps the protocol and replaces the hardware with L<sub>j</sub> = HW(S[x<sub>j</sub> ⊕ m<sub>j</sub>]) + N(0, σ²) for each nibble *j*, so the only difference between curves is the S-box. **Non-linearity 4** and **Non-linearity 0** show the same groupings as the paper's Figures 5 and 6.
</div>

<div data-levels="grad res" markdown="1">
The rank-correlation table asks which metric orders the S-boxes by attack effort. Against the paper's Figure 4 (traces to 50 percent read from the figure: PICCOLO 35, GIFT 36, PRESENT 37, S2 38, S1 and S4 44, S3 50), NL gives Spearman ρ = −0.93 and TO −0.94, with DPA-SNR near zero (−0.10). Against the simulation the pattern reverses: across seeds 1 to 3, DPA-SNR gives −0.75 to −0.92 and NL 0.00 to 0.32. DPA-SNR is derived for exactly the leakage the simulation assumes, so its success there is expected; its failure on hardware points to leakage beyond the Hamming weight of the targeted nibble. These correlations, over only seven S-boxes, are this page's analysis, not the paper's.
</div>

## What the paper found

<div data-levels="public" markdown="1">
- Changing only the S-box changed how many power measurements an attacker needed to recover GIFT-64's key.
- GIFT-64 with the PICCOLO S-box was the easiest to break of the seven versions tested.
- S-boxes with high non-linearity, the property that protects against mathematical attacks, leaked their key faster.
- Two newer scores, transparency order and its revised form, did not by themselves predict which S-box resisted the attack.
</div>

<div data-levels="hs" markdown="1">
- The attack reached a 50 percent success rate after about 35 traces with PICCOLO and about 50 with S3, reading from the paper's Figure 4.
- Among the three S-boxes taken from real ciphers (non-linearity 4), PRESENT resisted longest and had the lowest SNR.
- Among the three designed S-boxes with non-linearity 0, S3 resisted longest, and its SNR was the lowest of the three.
- Every experiment reached a 100 percent mean success rate before 150 traces.
</div>

<div data-levels="ug grad res" markdown="1">
- **Non-linearity predicts CPA effort.** S-boxes with NL = 4 (PICCOLO, GIFT, PRESENT) fell faster than S2 (NL = 2), which fell faster than S1, S3, and S4 (NL = 0).
- **SNR breaks ties.** Within equal NL, lower SNR went with slower attacks: PRESENT among the NL = 4 S-boxes and S3 among the NL = 0 S-boxes.
- **TO and RTO fall short.** Variations in TO and RTO were not sufficient to ensure practical CPA resistance, and neither SNR variant was a perfect indicator.
- **Scope.** First-order CPA on an unprotected software implementation; the authors name template, linear regression, and deep-learning attacks, and hardware implementations, as future work.
</div>

<div data-levels="grad res" markdown="1">
<div class="gl-table-wrap">
<table class="results-table">
<caption class="w-note">Table II as printed, with this page's recomputation from Table I in brackets where it differs. Classical SNR (dB) is the paper's average of 100 runs and is not recomputed.</caption>
<thead><tr><th>S-box</th><th>NL</th><th>SNR (dB)</th><th>DPA-SNR</th><th>TO</th><th>RTO</th></tr></thead>
<tbody>
<tr><td>PICCOLO</td><td>4</td><td>39.401</td><td>3.108</td><td>3.666</td><td>3.333</td></tr>
<tr><td>GIFT</td><td>4</td><td>39.348</td><td>2.399</td><td>3.466</td><td>3.066</td></tr>
<tr><td>PRESENT</td><td>4</td><td>34.665</td><td>2.129</td><td>3.533</td><td>3.266</td></tr>
<tr><td>S2</td><td>2</td><td>39.968</td><td>2.946 [2.685]</td><td>3.4</td><td>3.266 [3.067]</td></tr>
<tr><td>S4</td><td>0</td><td>39.252</td><td>2.484</td><td>2.933</td><td>2.933</td></tr>
<tr><td>S1</td><td>0</td><td>38.582</td><td>2.579</td><td>3.266</td><td>3.133</td></tr>
<tr><td>S3</td><td>0</td><td>34.148</td><td>2.484</td><td>2.933</td><td>2.933</td></tr>
</tbody>
</table>
</div>
</div>

## Why it matters

<div data-levels="public hs" markdown="1">
Billions of small devices (door locks, medical sensors, factory controllers) run lightweight ciphers, and many sit where an attacker could attach a probe. Designers choose S-boxes for strength against mathematical attacks, and this paper shows that the same choice can make the power leak easier to read. A designer who knows that trade-off can add protection where the S-box alone falls short. Ultimately, a cipher is only as strong as the chip that runs it.
</div>

<div data-levels="ug" markdown="1">
Metrics computed from a 16-entry table cost nothing next to a hardware measurement campaign, so a reliable one would let designers screen S-boxes early. The paper's result tempers that hope: NL, a classical design target, tracked practical CPA resistance better than the purpose-built TO and RTO on this device. Because the S-boxes chosen for strength against linear cryptanalysis were also the most exposed here, the S-box choice alone cannot protect an unprotected software implementation; countermeasures such as masking still carry that load.
</div>

<div data-levels="grad res" markdown="1">
The study is a case study by design: one microcontroller, one implementation, seven S-boxes, and one trial per S-box shown. Its finding that NL and SNR outperform TO and RTO holds for first-order Hamming-weight CPA on that platform; it does not establish a general ranking of the metrics. The simulation on this page sharpens the question: under a pure Hamming-weight model, DPA-SNR orders the S-boxes almost perfectly, so the gap between metric and measurement is a statement about the device's leakage as much as about the metrics. The same authors' 2022 NIST Lightweight Cryptography Workshop presentation, whose title adds test vector leakage assessment (TVLA) to these metrics, continues the line of work.
</div>

<div data-levels="res" markdown="1">
## Notes from building this page

- **Table II reproduces, with one S-box exception.** NL, TO, RTO (Eq. 4 as printed), and DPA-SNR reproduce for six of the seven S-boxes. For S2 as printed in Table I, NL (2) and TO (3.4) match, but DPA-SNR computes to 2.685 against 2.946 and RTO to 3.067 against 3.266. Swapping any one of three adjacent pairs of S2 entries (inputs 2 and 3, 6 and 7, or 12 and 13) reproduces all four printed values (NL 2, TO 3.4, RTO 3.267, DPA-SNR 2.946), so Table I likely carries a one-pair transcription slip. The S2′ row in the scoring table uses the first swap. Which S2 ran on the chip is unknown.
- **Rounding.** TO and RTO in Table II are truncated to three decimals (3.6667 printed as 3.666); DPA-SNR is rounded (2.1286 printed as 2.129).
- **RTO form.** The printed Eq. 4 puts one absolute value around the double sum over *i* and *j*, and that form reproduces Table II. Taking the absolute value for each output bit *j* before summing, the form this page reads in Li et al. (2020), gives 1.27 to 2.57 for these S-boxes (the "RTO per bit" column). The paper's RTO values therefore belong to the printed variant.
- **Classical SNR is not recomputed.** Eq. 7 defines SNR as Var(signal)/Var(noise), a power ratio, but the dB values are described as 20 log(SNR), the amplitude convention; the paper does not say which trace samples define signal and noise. The 34 to 40 dB values cannot be rebuilt from the text.
- **Metrics against attack effort.** Reading traces to 50 percent from Figure 4 (approximately, to the nearest trace), Spearman correlations across the seven S-boxes are −0.93 for NL, −0.94 for TO, −0.72 for RTO, and −0.10 for DPA-SNR. TO's ordering of the measured S-boxes is as strong as NL's, which qualifies the conclusion that TO variations were not sufficient; the paper's statement concerns S-boxes with equal NL, where TO differences are small. In the simulation, DPA-SNR leads instead (−0.75 to −0.92 over three seeds). Seven S-boxes give little power for any of these correlations.
- **Direction of the NL effect.** The paper's sentence "higher non-linearity results in a cryptographic system being more susceptible to SCA attacks" cites Biryukov et al. (2016). Under pure Hamming-weight leakage the page finds no such trend; the measured trend may come from leakage the simple model omits, such as other intermediate values in the 8-bit implementation.
- **Figure 4 axis.** The figures stop at 80 traces, where S3 sits near 93 percent; the text states that every experiment reached 100 percent before 150 traces.
- **What a success means.** The paper defines success as recovering "the key." The simulation counts success as all 16 nibbles of the round-1 key-and-constant mask; the paper's full attack needs four round keys, so its per-round success criterion may differ.
</div>

<div data-levels="hs" markdown="1">
## Try this in class

1. Write the S-box `0123456789ABCDEF` in binary. Show that its lowest output bit always equals the lowest input bit, then explain why an attacker could predict that bit perfectly.
2. In the first demo, set the noise to 0 and count how many measurements it takes for the right guess to lead. Repeat at noise 2 and compare.
3. In the last demo, run the trials and record traces to 50 percent for each S-box. Rank them, then compare your ranking with the non-linearity column of the scoring table.
</div>

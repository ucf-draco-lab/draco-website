---
title: "Fixed or Random? A Leakage Test for GIFT-COFB"
kicker: "Interactive paper · NIST Lightweight Cryptography Workshop 2022"
subtitle: "An interactive companion to William Unger, Liljana Babinkostova, Mike Borowczak, Robert Erbes, and Aparna Srinath's study of how far S-box scores predict a power attack, and of what a fixed-versus-random leakage test finds in two hardware versions of the GIFT-COFB cipher."
description: "Collect two piles of simulated power traces from GIFT-COFB, watch Welch's t test find where the plaintext enters the datapath, see how often the 4.5 threshold raises a false alarm, and recompute the paper's S-box scores in your browser."
share_description: "Two piles of power measurements, one with a fixed input and one with random inputs: if their averages differ, the chip leaks. Run the fixed-versus-random test on a simulated GIFT-COFB datapath and recompute the paper's S-box scores in your browser, written for five reading levels."
share_text: "Does a chip leak its data through the power line? Run the fixed-versus-random test on GIFT-COFB in your browser:"
share_image: /papers/tvla-gift-cofb/share.png
share_image_alt: "A simulated Welch t curve across the clock cycles of a GIFT-COFB encryption, flat while the nonce and associated data are processed and crossing the dashed plus and minus 4.5 lines once the plaintext enters, beside the title Fixed or Random."
date: 2026-10-23
topics: ["Hardware security", "Cryptography"]
default_level: public
level_hints:
  public: No background needed
  hs: Averages, bits, and a little algebra
  ug: Digital logic, ciphers, and programming
  grad: Hypothesis tests and side channels
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
  - name: Aparna Srinath
    affiliation: Boise State University
sources:
  - venue: "NIST Lightweight Cryptography Workshop · May 2022"
    title: "TVLA, Correlation Power Analysis and Side-Channel Leakage Assessment Metrics"
    url: https://csrc.nist.gov/csrc/media/Events/2022/lightweight-cryptography-workshop-2022/documents/papers/tvla-correlation-power-analysis-and-side-channel-leakage-assessment-metrics.pdf
    access: Open access (NIST)
  - venue: "Workshop presentation · May 10, 2022"
    title: "Slides for the same talk"
    url: https://csrc.nist.gov/Presentations/2022/tvla-correlation-power-analysis-side-channel-leaka
    access: Open access (NIST)
code:
  label: "GIFT-COFB reference code and known-answer tests (rweather/lightweight-crypto, MIT License)"
  url: https://github.com/rweather/lightweight-crypto
citations:
  - "nist-lwc-2022"
widget:
  css:
    - /papers/tvla-gift-cofb/widget.css
  js:
    - /papers/tvla-gift-cofb/cofb-engine.js
    - /papers/gift-sbox-leakage/gift-engine.js
    - /papers/tvla-gift-cofb/widget.js
credit: "Interactive page by the [DRACO Lab](/). The browser engine encrypts with GIFT-COFB and matches all 1,089 vectors of the GIFT-COFB known-answer file; its GIFT-128 rounds, ported from the MIT-licensed lightweight-crypto library, match the GIFT designers' reference code on 12,000 round states (300 random blocks, 40 rounds each). The S-box scores reproduce all 28 deterministic cells of the paper's Table I (non-linearity, transparency order, revisited transparency order, and DPA signal-to-noise ratio for seven S-boxes) using the S-box listings printed in this paper. The power traces are simulated: register bits that flip in a round-based datapath, plus Gaussian noise. The paper measured two FPGA implementations, so every t value on this page is the page's own. Everything runs on your device."
bibtex: |
  @inproceedings{unger2022tvla,
    author    = {Unger, William and Babinkostova, Liljana and Borowczak, Mike and Erbes, Robert and Srinath, Aparna},
    title     = {{TVLA}, Correlation Power Analysis and Side-Channel Leakage Assessment Metrics},
    booktitle = {NIST Lightweight Cryptography Workshop 2022},
    month     = may,
    year      = {2022},
    url       = {https://csrc.nist.gov/csrc/media/Events/2022/lightweight-cryptography-workshop-2022/documents/papers/tvla-correlation-power-analysis-and-side-channel-leakage-assessment-metrics.pdf}
  }
---

<div class="lede" data-levels="public" markdown="1">
A chip uses slightly more or less power depending on the data it handles, and a probe on its power line can measure the difference. The simplest way to check whether that happens is a two-pile test: measure the chip many times with the same input, measure it many times with random inputs, and compare the averages. If the averages differ, the power line carries information about the data. William Unger, Liljana Babinkostova, Mike Borowczak, Robert Erbes, and Aparna Srinath ran that test on two hardware versions of GIFT-COFB, one of the ten finalists in a national competition for lightweight encryption, and both versions leaked. The same paper asked whether scores computed from a cipher's lookup table can predict how fast a power attack succeeds, and found that they fall short.
</div>

<div class="lede" data-levels="hs" markdown="1">
Test vector leakage assessment (TVLA) compares two piles of power measurements. One pile always encrypts the same message; the other encrypts a fresh random message each time. For every moment in the measurement, a t statistic divides the gap between the two averages by how much that gap would wobble by chance. A value beyond 4.5 (or below −4.5) is strong evidence that the power depends on the data. The paper collected 2,000 measurements from each of two FPGA (field-programmable gate array) versions of GIFT-COFB and found t values past the threshold in both.
</div>

<div class="lede" data-levels="ug" markdown="1">
The paper has two parts. First, it runs correlation power analysis (CPA) with a Hamming-weight model on GIFT-64 in software on an 8-bit XMEGA microcontroller, swapping in seven 4-bit S-boxes (PICCOLO, GIFT, PRESENT, and four designed ones) and comparing attack success with five S-box metrics: non-linearity (NL), transparency order (TO), revisited transparency order (RTO), signal-to-noise ratio (SNR), and DPA-SNR. Second, it applies fixed-versus-random TVLA to two unprotected hardware implementations of GIFT-COFB, one written to the NIST Lightweight Cryptography (LWC) hardware interface and one to the earlier CAESAR interface, on the FOBOS measurement platform with a Nexys A7 FPGA clocked at 10 MHz. Both implementations show first-order leakage after 2,000 traces.
</div>

<div class="lede" data-levels="grad" markdown="1">
TVLA asks a narrower question than an attack does: does the mean power at any time point depend on the input? Welch's t test on fixed and random sets answers it without a leakage model or a key hypothesis, which makes it the usual first screen in certification-style evaluations. The paper pairs that screen with model-based CPA on GIFT-64 and with five S-box metrics, and concludes that TO, RTO, SNR, and DPA-SNR do not by themselves ensure practical security: among S-boxes with equal non-linearity, the lower-SNR S-boxes (PRESENT among NL = 4 and S3 among NL = 0) resisted CPA longer, and both unprotected GIFT-COFB hardware implementations failed TVLA at |t| > 4.5 with 2,000 traces.
</div>

<div class="lede" data-levels="res" markdown="1">
Unger, Babinkostova, Borowczak, Erbes, and Srinath (NIST LWC Workshop 2022) restate the S-box metric study of their ISVLSI 2021 paper (Table I: NL, SNR, DPA-SNR, TO, and RTO for seven S-boxes; mean CPA success of first-order Hamming-weight CPA on GIFT-64 on an ATXMEGA128D4, 100 experiments per trial from a pool of 2,000 traces), then add fixed-versus-random TVLA (Welch's t, |t| > 4.5, 2,000 traces) on the LWC and CAESAR hardware implementations of GIFT-COFB on FOBOS. This page reproduces every deterministic cell of Table I, implements GIFT-COFB to the known-answer tests, and runs TVLA on a simulated round-based datapath to show what the test can and cannot say. The datapath model, the false-alarm arithmetic, and the notes at the researcher level are the page's own.
</div>

## Two piles of measurements

<div id="tv-piles" class="w-demo"></div>

<div data-levels="public" markdown="1">
Each line is one simulated power measurement of the chip encrypting a short message: how many tiny switches inside it flip at each tick of its clock. The accent lines always encrypt the same message; the other lines encrypt random messages. One at a time, the measurements look alike, because noise swamps the difference. Switch to **Averages** and press **Measure 250 more** a few times. During the first half of the run, while both piles do exactly the same work, the gap between the averages shrinks toward zero. Once the message enters the chip, the gap stops shrinking and settles near six bit flips.
</div>

<div data-levels="hs" markdown="1">
Averaging is how a small signal climbs out of noise: noise of size σ on one measurement shrinks to about σ/√n on the average of n measurements. With the default noise of 80 bit flips and 500 measurements per pile, chance alone leaves an average gap of about four bit flips between the two averages, and 2,000 per pile bring it down to about two. The real gap after the message enters stays near six, so it stands out more with every press. Before the message enters, while the chip encrypts the nonce and the associated data, both piles use the same values and the only gap is noise.
</div>

<div data-levels="ug grad res" markdown="1">
The simulated device is a round-based GIFT-COFB datapath: one clock cycle loads each 128-bit block into the state register, and one cycle runs each of GIFT-128's 40 rounds. The power of a cycle is the number of bits that change in the state, key, and L registers (a Hamming-distance model), plus Gaussian noise. Both piles share the key, nonce, and associated data, as in the paper; only the plaintext differs, so the averages coincide for the first 82 cycles and separate from the first message block onward.
</div>

## Where GIFT-COFB handles the data

<div id="tv-datapath" class="w-demo"></div>

<div data-levels="public hs" markdown="1">
GIFT-COFB encrypts and authenticates in one pass. It first scrambles a nonce (a number used once), then folds in associated data (information that travels in the clear but must not be altered, such as an address), then mixes in each block of the message, and finally produces a tag that proves nothing changed. The bars show the switching activity for one fixed message; the line shows the average for random messages. The bars turn to the accent color where the message first makes a difference.
</div>

<div data-levels="ug" markdown="1">
COFB (COmbined FeedBack) chains GIFT-128 calls: Y = E<sub>K</sub>(N), then each block is combined with a feedback of Y and a masking value L (doubled or tripled in GF(2<sup>64</sup>) per block) before the next call, and the last output is the tag. Change the inputs to see the cycle count grow with each 16-byte block, and press **One block of plaintext** to drop a GIFT-128 call. The ciphertext and tag come from the page's engine, which matches the official known-answer vectors.
</div>

<div data-levels="grad res" markdown="1">
Under this model the expected gap between the fixed trace and the random-set mean is exactly zero until the varying input reaches a register, then of the order of √32 ≈ 5.7 bit flips per cycle (the standard deviation of the Hamming distance between a fixed and a uniformly random 128-bit value), with individual cycles reaching 13 to 17. Those gaps set how many traces the test needs. The model has no glitches, no combinational leakage, and no coupling between registers, so it understates what an FPGA leaks; the paper does not describe the internal architecture of either implementation.
</div>

## Run the leakage test

<div id="tv-test" class="w-demo"></div>

<div data-levels="public" markdown="1">
Press **Run the test**. The curve shows, for every tick of the clock, how strongly the two piles disagree. Values past the dashed lines count as leakage. Then choose **Random vs random**: with both piles random, the curve stays inside the lines, which shows that the test does not invent leaks where none exist.
</div>

<div data-levels="hs" markdown="1">
Welch's t for one clock cycle is

t = (average<sub>fixed</sub> − average<sub>random</sub>) ÷ √(s²<sub>fixed</sub>/n<sub>fixed</sub> + s²<sub>random</sub>/n<sub>random</sub>)

where s² is each pile's variance and n its size. Doubling the number of traces multiplies a real gap's t by about 1.4 (√2). Try 500, 2,000, and 10,000 traces at the same noise and watch more cycles cross ±4.5; then raise the noise and watch them drop back.
</div>

<div data-levels="ug grad res" markdown="1">
The test needs no key guess and no power model, so it catches leakage that a Hamming-weight attack might miss, but a crossing does not tell an attacker how to recover the key. At the default σ = 80 and the paper's 2,000 traces, the simulation flags one to four cycles in 173 of 200 simulated campaigns and none in ten; at σ = 48 it flags eight to 18, most often ten to 16; with no noise it flags most cycles after the plaintext enters (76 of 82 in one run). **Fixed vs random associated data** moves the onset earlier, to the associated-data block, because that block now differs between the piles.
</div>

<div data-levels="grad res" markdown="1">
For a cycle whose noise-free gap is g, a balanced campaign of N traces crosses 4.5 on average once N ≈ 2(2σ² + v)(4.5/g)², where v ≈ 32 is the extra variance the random inputs add. The largest gap for the default inputs is 17.1 bit flips, so σ = 80 needs about 1,800 traces before even the best cycle reaches 4.5 on average, which matches first crossings between roughly 300 and 1,550 traces in eight simulated campaigns (the earliest ones come from noise pushing a cycle over early). The growth chart shows the largest |t| rising roughly with √N.
</div>

## How often 4.5 raises a false alarm

<div id="tv-alarm" class="w-demo"></div>

<div data-levels="public hs" markdown="1">
A test that checks thousands of moments will now and then see a large value by pure chance. The threshold of 4.5 makes that rare for any single moment (about 7 chances in a million), but the chances add up. Move the slider to see how often a leak-free chip would still trip at least one alarm as the number of checked moments grows.
</div>

<div data-levels="ug grad res" markdown="1">
Under the null hypothesis of no leakage and with enough traces, t at each point is close to standard normal, so P(|t| > 4.5) = 6.8 × 10<sup>−6</sup> per point. Across the 2,000 samples the paper plots, the chance of at least one false alarm is about 1.4 percent; across a million samples, it is near 100 percent. Correlated neighboring samples lower these figures, and the original TVLA methodology guards against chance crossings by repeating the test on a second, independent campaign and requiring a crossing at the same point in both.
</div>

## Scores computed from the S-box

<div id="tv-scores" class="w-demo"></div>

<div data-levels="public hs" markdown="1">
An S-box (substitution box) is the small lookup table at the heart of ciphers such as GIFT: four bits in, four different bits out. Researchers have proposed scores, computed from the 16 entries alone, that try to predict how easily a power attack breaks a cipher built on that S-box. The table recomputes the paper's scores for seven S-boxes. The paper attacked a small processor running each version and found that these scores do not reliably predict which S-box resists the attack longest. The companion page [Seven S-Boxes on Trial](/papers/gift-sbox-leakage/) lets you rerun that attack.
</div>

<div data-levels="ug" markdown="1">
NL measures distance from every affine function (resistance to linear cryptanalysis). TO and RTO, built from auto- and cross-correlation spectra of the coordinate functions, aim to measure how well wrong key guesses can mimic the right one in a differential attack; DPA-SNR comes from the Walsh spectrum of the coordinate functions; the classical SNR in decibels comes from measured traces and cannot be computed from the table. Every computable cell matches Table I.
</div>

<div data-levels="grad res" markdown="1">
With this paper's listing of S2 (5176402E3FBA89CD) all four of S2's computable cells reproduce. The ISVLSI 2021 paper listed S2 with inputs 6 and 7 swapped (517640E23FBA89CD), which gives DPA-SNR 2.685 and RTO 3.067 against the printed 2.946 and 3.266; switch listings to compare. The companion page had proposed exactly this swap as the likely transcription slip, and the 2022 listing confirms it. Table I's S4 contains an entry printed as "10," which makes the listing repeat A and omit E; the page scores 123456789ABCDEF0, the S4 printed in 2021, and every S4 cell then reproduces.
</div>

## What the paper found

<div data-levels="public" markdown="1">
- Both hardware versions of GIFT-COFB leaked: their power depended on the data they encrypted.
- Scores computed from a cipher's lookup table did not reliably predict how quickly a power attack recovered the key.
- Among the S-boxes taken from published ciphers, PRESENT held out longest against the attack.
- The authors plan to test the other competition finalists and to try attacks that use machine learning.
</div>

<div data-levels="hs" markdown="1">
- With 2,000 measurements, both FPGA versions of GIFT-COFB produced t values past ±4.5, evidence of leakage.
- Every attack on the microcontroller reached a 100 percent mean success rate before 150 measurements.
- Among S-boxes with equal non-linearity, the one with the lower SNR resisted longer: PRESENT among the three cipher S-boxes, S3 among the three designed ones with non-linearity zero.
- Transparency order and its revised form did not separate the S-boxes in a way that matched the attack results.
</div>

<div data-levels="ug grad res" markdown="1">
- **Metrics fall short.** TO and RTO, and SNR and DPA-SNR, were "not sufficient to ensure practical security"; the authors write that "it is still unclear how an evaluator can sort SBoxes in terms of resiliency."
- **SNR breaks ties.** Within NL = 4, PRESENT (SNR 34.665 dB) was the most CPA-resistant; within NL = 0, S3 (34.148 dB) had a clearly lower mean success rate than S1 and S4.
- **TVLA flags both implementations.** Fixed-versus-random Welch's t on 2,000 traces showed first-order leakage in the unprotected LWC and CAESAR hardware versions, described as "some leakage at one location."
- **Next steps.** TVLA on other LWC finalists, and non-profiled deep-learning attacks compared with CPA.
</div>

<div data-levels="grad res" markdown="1">
<div class="tv-table-wrap">
<table class="results-table">
<caption class="w-note">Experimental settings as reported. The paper gives no maximum |t| and no count of points beyond 4.5.</caption>
<thead><tr><th>Part</th><th>Target</th><th>Platform</th><th>Measurements</th><th>Criterion</th></tr></thead>
<tbody>
<tr><td>CPA</td><td>GIFT-64 in C, 8-bit types; S-box output, rounds 2 to 5</td><td>ATXMEGA128D4 on ChipWhisperer CW308, ChipWhisperer Lite</td><td>Pool of 2,000 traces; up to 150 per experiment; 100 experiments per trial</td><td>Mean success rate; stop after five consecutive successes</td></tr>
<tr><td>TVLA</td><td>GIFT-COFB, LWC and CAESAR hardware versions, unprotected</td><td>FOBOS: Basys3 control, Nexys A7 at 10 MHz, PicoScope 5244D</td><td>2,000 fixed-versus-random traces; same key, nonce, and associated data</td><td>|t| > 4.5</td></tr>
</tbody>
</table>
</div>
</div>

## Why it matters

<div data-levels="public hs" markdown="1">
Lightweight ciphers protect devices too small for heavier encryption: sensors, medical implants, and controllers in cars and factories. Many of those devices sit where someone could attach a probe. A two-pile test gives designers a quick, model-free check before an attacker ever looks, and this paper shows that two careful hardware versions of a competition finalist still failed it without added protection. Ultimately, a cipher's strength on paper and its behavior on a chip are separate questions, and both need an answer.
</div>

<div data-levels="ug" markdown="1">
NIST selected Ascon over the other finalists, GIFT-COFB among them, in 2023, but the paper's point carries over to any cipher a designer puts in hardware: a fixed-versus-random test is cheap, needs no knowledge of the implementation, and catches leakage that a single attack model may miss. The S-box results add a caution from the other direction. Scores computed from the cipher's table are free to evaluate, yet they did not rank practical CPA resistance on this platform, so measurement remains part of the design loop.
</div>

<div data-levels="grad res" markdown="1">
TVLA is a detection test, not a security metric: failing it shows dependence of mean power on data, and passing it with N traces bounds only first-order leakage detectable at that N. For unprotected implementations, failure is expected; the value of the paper's measurement is a documented FOBOS baseline for the LWC and CAESAR versions of GIFT-COFB against which protected (for example, masked) versions can be compared. The page's simulation makes the sample-size dependence concrete: the same leak can appear at one cycle or at 80, depending on noise and trace count.
</div>

<div data-levels="res" markdown="1">
## Notes from building this page

- **Table I reproduces in full with this paper's listings.** NL, TO, RTO (Eq. 2 as printed, one absolute value around the double sum), and DPA-SNR match for all seven S-boxes: 28 of 28 cells, TO and RTO truncated to three decimals, DPA-SNR rounded. The S2 listing here differs from the ISVLSI 2021 listing by one swapped pair (inputs 6 and 7), and only the 2022 listing reproduces the printed S2 values.
- **S4 listing.** Table I prints S4 as 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, A, B, C, D, F, 0, which is not a permutation. Reading "10" as E restores the 2021 S4 (123456789ABCDEF0), which reproduces every S4 cell.
- **Slides relabel two rows.** The workshop slides' metric table lists S2's values under "S1" and S4's under "S2," and omits S1; the written paper's Table I is self-consistent.
- **TVLA details not reported.** The paper does not state the fixed plaintext, the split between fixed and random sets, trace alignment, samples per trace, the maximum |t|, or the number of points beyond 4.5. It describes spikes between samples 0 and 2,000 and leakage "at one location." The sampling rate is given as 12,000 samples per second at a 10 MHz clock, which would be about one sample every 833 clock cycles; a rate in megasamples per second seems more likely.
- **Confidence level.** The paper states 4.5 as 99.9999 percent confidence. Under a normal approximation, the two-sided tail at 4.5 is 6.8 × 10<sup>−6</sup> (99.9993 percent); the one-sided tail is 3.4 × 10<sup>−6</sup>. Across the 2,000 plotted samples, at least one chance crossing has probability of about 1.4 percent if the samples were independent, so a single crossing benefits from the two-campaign confirmation of the original methodology.
- **One location, read through the simulation.** In the noise-free model every cycle after the plaintext enters has a nonzero gap, and with enough traces nearly all of them cross. At σ = 80 and 2,000 traces the simulation flags one to four cycles in 173 of 200 campaigns, five or six in 17, and none in ten; random-versus-random control campaigns flagged no cycle in 200 of 200. A single flagged location is therefore consistent with widespread data dependence measured at modest trace count and noise; it does not by itself localize the leak to one operation.
- **Datapath model.** The page assumes one load cycle per block and one cycle per GIFT-128 round, with Hamming-distance power on the state, key, and L registers. Real LWC and CAESAR implementations add interface logic, FIFOs, and padding control, and may process rounds differently. The choice of σ = 80 as the default is the page's, picked so that 2,000 traces give a handful of crossings.
- **Two parts, two ciphers.** The CPA and metric study uses GIFT-64 in software; the TVLA study uses GIFT-COFB, built on GIFT-128, in hardware. Both use the GIFT S-box, but the paper does not connect the S-box scores to the hardware leakage, and the page keeps them separate.
</div>

<div data-levels="hs" markdown="1">
## Try this in class

1. Flip a coin 20 times and record heads as 1 and tails as 0; then flip a coin that you tape so it lands heads slightly more often (or use a die and count 1 to 4 as heads). Compute each average and the t statistic from the formula above. Repeat with 100 flips and compare the two t values.
2. In the leakage test, set the noise to 80 and run 500, 2,000, and 10,000 traces. Record how many cycles cross ±4.5 each time and plot the counts against the number of traces.
3. Choose **Random vs random** and run 10,000 traces. Explain why no cycle should cross the threshold, then use the false-alarm demo to estimate how often one would cross by chance.
</div>

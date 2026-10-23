---
title: "Bell Curves on Trial: Normality in AES Power Traces"
kicker: "Interactive paper · Journal of Cybersecurity and Privacy 2023"
subtitle: "An interactive companion to Clay Carper, Stone Olguin, Jarek Brown, Caylie Charlton, and Mike Borowczak's test of the bell-curve assumption behind the standard check for power-line leakage, run on nine versions of a software AES cipher."
description: "Test simulated AES power readings for a bell curve with the paper's Shapiro-Wilk and Kolmogorov-Smirnov tests, map leakage across all ten rounds with Welch's t-test and the Wilcoxon signed-rank test, compare two ways of choosing the numbers a normality test sees, and read the paper's Kruskal-Wallis results by s-box."
share_description: "The standard leakage check for crypto chips assumes power readings follow a bell curve. This paper tested that assumption on nine AES s-boxes and rejected it every time. Test simulated readings yourself, written for five reading levels."
share_text: "Do a chip's power readings follow a bell curve? The leakage test most labs use assumes so. Test it in your browser:"
share_image: /papers/aes-sbox-normality/share.png
share_image_alt: "A histogram of simulated power readings rounded to whole ADC steps under a fitted bell curve, beside the title Bell Curves on Trial."
date: 2026-10-23
topics: ["Hardware security", "Cryptography"]
default_level: public
level_hints:
  public: No background needed
  hs: Bits, bytes, and a histogram
  ug: Statistics courses, ciphers, and programming
  grad: Hypothesis tests and side channels
  res: Full method, page analyses, and open questions
authors:
  - name: Clay Carper
    affiliation: University of Wyoming
  - name: Stone Olguin
    affiliation: University of Wyoming
  - name: Jarek Brown
    affiliation: University of Wyoming
  - name: Caylie Charlton
    affiliation: University of Wyoming
  - name: Mike Borowczak
    affiliation: University of Central Florida
    member: mike-borowczak
sources:
  - venue: "Journal of Cybersecurity and Privacy 3(4):844–857 · 2023"
    title: "Challenging Assumptions of Normality in AES s-Box Configurations under Side-Channel Analysis"
    url: https://doi.org/10.3390/jcp3040038
    access: Open access (CC BY)
  - venue: "FigShare · 2023"
    title: "Trace data for the nine s-box configurations"
    url: https://doi.org/10.6084/m9.figshare.24650373
    access: Open data
code:
  label: "Tiny-AES-c, the AES implementation the paper attacked (kokke/tiny-AES-c, Unlicense)"
  url: https://github.com/kokke/tiny-AES-c
citations:
  - jcp3040038
widget:
  css:
    - /papers/aes-sbox-normality/widget.css
  js:
    - /papers/aes-sbox-normality/engine.js
    - /papers/aes-sbox-normality/widget.js
credit: "Interactive page by the [DRACO Lab](/). The browser engine runs AES-128 with a replaceable S-box in Tiny-AES-c's operation order and matches the C library, compiled with each of this page's four S-boxes, on all 32,964 intermediate states it records (201 plaintexts per S-box) and on the NIST SP 800-38A test block. Its Welch, Shapiro-Wilk (AS R94), Kolmogorov-Smirnov, Wilcoxon signed-rank, and Kruskal-Wallis implementations agree with SciPy 1.18 to a relative error below 10⁻⁹ on 815 checks. **The page does not reproduce the paper's measured numbers:** they come from ChipWhisperer-Lite traces on FigShare that this build could not download, so every trace here is simulated (Hamming-weight leakage, Gaussian noise, a 10-bit ADC) and labeled as such. The Table 1 values are the paper's own. Everything runs on your device."
bibtex: |
  @article{carper2023normality,
    author  = {Carper, Clay and Olguin, Stone and Brown, Jarek and Charlton, Caylie and Borowczak, Mike},
    title   = {Challenging Assumptions of Normality in {AES} s-Box Configurations under Side-Channel Analysis},
    journal = {Journal of Cybersecurity and Privacy},
    volume  = {3},
    number  = {4},
    pages   = {844--857},
    year    = {2023},
    doi     = {10.3390/jcp3040038}
  }
---

<div class="lede" data-levels="public" markdown="1">
A chip that encrypts data draws slightly different amounts of power depending on the secret it handles, and labs check for that leak with a standard statistical test. The test works best when the power readings follow a bell curve. Clay Carper, Stone Olguin, Jarek Brown, Caylie Charlton, and Mike Borowczak asked whether they actually do. They recorded a small processor running the AES cipher with nine different scrambling tables (s-boxes) and ran two bell-curve tests on every configuration. Both tests said no, every time, so the authors recommend checking leaks with methods that make no bell-curve assumption.
</div>

<div class="lede" data-levels="hs" markdown="1">
A power trace is a list of thousands of readings, one every few nanoseconds, taken while a chip encrypts one message. The usual leakage check, the test vector leakage assessment (TVLA), records two piles of traces (one where the chip encrypts the same message over and over, one with random messages) and compares their averages at every moment with Welch's t-test. The paper recorded about 1,000 traces for each of nine AES s-boxes on a 32-bit microcontroller, confirmed that TVLA flagged leakage in all nine, and then showed that the readings fail two tests of normality, the property the t-test assumes.
</div>

<div class="lede" data-levels="ug" markdown="1">
TVLA applies Welch's t-test sample by sample to fixed-plaintext and random-plaintext traces and flags leakage where \|t\| exceeds 4.5. Welch's test assumes each group is normally distributed, and Pearson correlation, the engine of correlation power analysis (CPA), leans on the same assumption. The paper captures Tiny-AES-c on an STM32F303 with a ChipWhisperer-Lite (10-bit ADC, 105 MS/s, 24,400 samples per trace) for the default AES s-box and eight alternatives of equal non-linearity, then applies Shapiro-Wilk and Kolmogorov-Smirnov (K-S) tests for normality and two non-parametric alternatives, the Wilcoxon signed-rank and Kruskal-Wallis tests.
</div>

<div class="lede" data-levels="grad" markdown="1">
Parametric leakage detection rests on an untested premise: that power samples are normal within each group. Carper et al. test it directly on nine AES s-box configurations (about 500 fixed and 500 random traces each) at α = 0.0001. Shapiro-Wilk, applied to sequential subsets of about 2,400 points, and the one-sample K-S test reject normality everywhere; the two-sample K-S test finds the fixed and random groups indistinguishable (p ≥ 0.9); and Kruskal-Wallis separates them only in the upper ten-quantiles. This page rebuilds every test, checks each against SciPy, and runs them on simulated traces so the reader can see which data features drive each verdict.
</div>

<div class="lede" data-levels="res" markdown="1">
Carper, Olguin, Brown, Charlton, and Borowczak (J. Cybersecurity and Privacy 3(4):844–857, 2023) report TVLA, Shapiro-Wilk, one- and two-sample K-S, paired Wilcoxon signed-rank (Figure 4), and Kruskal-Wallis on full traces and ten-quantiles (Table 1) for Tiny-AES-c with nine s-boxes, using the 13th of 20 collections per s-box. The measured traces are on FigShare (doi:10.6084/m9.figshare.24650373); this build could not fetch them, so the page reproduces none of the measured values. It offers verified implementations of the tests, a simulated campaign with controllable noise, leakage, and ADC resolution, the printed Table 1 for the s-boxes that could be read, and notes on how the tests were applied. The simulation and every analysis beyond the paper are labeled as the page's own.
</div>

## Test one moment for a bell curve

<div id="sn-bell" class="w-demo"></div>

<div data-levels="public" markdown="1">
Each bar counts how many recordings landed on one power reading at a single moment of the encryption, and the curve is the bell shape those readings would follow if they were perfectly "normal." The Shapiro-Wilk test turns the gap between bars and curve into a p-value; below 0.0001, the paper's cutoff, the test says the readings are not a bell curve. With the default 1,000 recordings, the random-message readings sit just above the cutoff (p ≈ 0.0003). Press **5,000** and the verdict flips: more recordings make small mismatches easier to detect. The readings here are simulated on your device.
</div>

<div data-levels="hs" markdown="1">
The recorder in the paper's setup, a 10-bit analog-to-digital converter (ADC), can only report 1,024 different values, so every reading is rounded to a whole step. Look at the bars: only about 17 distinct values appear, while a true bell curve is smooth. Switch the recorder to **Ideal** and the same simulated readings, unrounded, pass both tests easily (Shapiro-Wilk p ≈ 0.33). Rounding alone can push a normality test toward "not a bell curve."
</div>

<div data-levels="ug" markdown="1">
Shapiro-Wilk's W is the squared correlation between the ordered sample and the expected normal order statistics; values near 1 look normal. The page follows Royston's algorithm AS R94, the one in R's `shapiro.test` (which the paper used, with its 5,000-point limit) and SciPy's `shapiro`. The K-S row compares the empirical distribution with a normal of the sample's own mean and standard deviation, as R's `ks.test(x, "pnorm", mean(x), sd(x))` does. Both tests count ties heavily: at the default settings the fixed group rejects (p ≈ 6 × 10⁻⁵) and the random group does not (p ≈ 3 × 10⁻⁴), and the gap is rounding and sample size, since the ideal recorder clears both.
</div>

<div data-levels="grad res" markdown="1">
The simulated reading at sample *t* of trace *j* is *b*(*t*) + *o*<sub>*j*</sub> − *g* Σ (HW(*v*) − 4) + ε, where *b* is a fixed instruction waveform, *o*<sub>*j*</sub> ~ N(0, (1 LSB)²) is a per-trace offset, *v* runs over the state bytes leaking at that sample (with half weight on the following sample), *g* = 1.2 LSB per bit, and ε ~ N(0, (2.5 LSB)²), then floored to a 10-bit code on [−0.5, 0.5). At a SubBytes sample the random group is a binomial mixture of normals with *g*/σ ≈ 0.5, close enough to normal that 513 unrounded readings pass. Quantization to about 17 codes is what fails: across all 2,440 samples of the default capture, Shapiro-Wilk rejects at 47 percent of moments in the fixed group and 48 percent in the random group, against none with a 12-bit or ideal converter. The share swings between captures (47 to 81 percent in the fixed group and 24 to 53 percent in the random group over seeds 11 to 20), because 500 rounded readings sit near the test's 0.0001 edge. These rates belong to the simulation, not to the paper's hardware, whose noise and resolution may differ.
</div>

## Map the leak across ten rounds

<div id="sn-tvla" class="w-demo"></div>

<div data-levels="public" markdown="1">
This chart is the leakage check itself. At every moment of the encryption it asks whether the same-message recordings differ from the random-message recordings, and spikes past the dashed lines mean they do: the chip's power gives away something about its data. The simulated chip leaks in all ten rounds of AES, just as the paper's real chip leaked with all nine s-boxes. Click a spike, then return to the first demo and choose **Your pick** to test the readings at that moment.
</div>

<div data-levels="hs" markdown="1">
AES scrambles 16 bytes through ten rounds; each round substitutes every byte through the s-box, shifts rows, mixes columns, and adds a round key. The simulated chip draws a little more power for every 1 bit in the byte it is handling. Try the four S-box buttons. The leak stays strong for every one of them, even the **Identity** table that does no scrambling at all, because a fixed message produces the same bytes every time and a random message does not.
</div>

<div data-levels="ug" markdown="1">
Each point is Welch's *t* = (x̄<sub>F</sub> − x̄<sub>R</sub>)/√(s²<sub>F</sub>/n<sub>F</sub> + s²<sub>R</sub>/n<sub>R</sub>) at one sample. Traces join the fixed or random group by a coin flip, as in the ChipWhisperer TVLA loop, so the default capture has 487 fixed and 513 random traces. **Wilcoxon z (paired)** replaces the t-test with the signed-rank test on differences between the *i*-th fixed and *i*-th random trace, the paired form the paper names; at the default settings 666 moments cross ±4.5 under *t* and 656 under *z*, matching the paper's observation that Wilcoxon results were comparable to the t-test.
</div>

<div data-levels="grad res" markdown="1">
The four S-boxes are this page's stand-ins, not the paper's S1 to S8 (drawn from Siddiqui et al., *PLoS ONE* 2020, and not printed in the paper). **AES, affine copy** rotates the AES output by three bits and XORs 0x5a, so its non-linearity is 112, matching the paper's selection rule; **Shuffled** is a seeded random permutation (non-linearity 94), and **Identity** has non-linearity 0. Any bijective S-box maps uniform inputs to uniform outputs, so the random group's first-round SubBytes readings have the same distribution for all four; fixed-versus-random TVLA separates the groups through the fixed plaintext's particular bytes, and the s-box enters only through which bytes those are. The paper's threshold of 4.5 corresponds to a two-sided normal tail of 6.8 × 10⁻⁶, not 0.0001 (\|*z*\| = 3.89); with 1,000 traces Student's *t* gives 7.6 × 10⁻⁶. Both values are computed by this page.
</div>

<div data-levels="grad res" markdown="1">
## Choose which numbers the test sees

<div id="sn-slices" class="w-demo"></div>

Welch's t-test compares the readings at one moment across traces, so the normality that matters is the accent-colored histogram: one sample index, every trace in a group. The paper describes its Shapiro-Wilk input differently: "each dataset was separated into sequential subsets consisting of approximately 2400 data points," a choice forced by R's 5,000-point limit. If those subsets run along time within a trace (a reading this page takes from the word "sequential," and which the paper should confirm), each subset mixes ten percent of the encryption's instructions, and its histogram takes the shape of the waveform. In the simulation every such slice rejects normality overwhelmingly (largest p ≈ 2 × 10⁻²¹ over 50 traces, with or without rounding), while the same capture's per-moment readings pass under an ideal converter. The paper's largest p of 1.443 × 10⁻³¹ fits that pattern. A per-moment test on the published traces would separate the two readings.
</div>

## Read the paper's Kruskal-Wallis table

<div id="sn-table" class="w-demo"></div>

<div data-levels="public" markdown="1">
The paper also used a test that makes no bell-curve assumption, the Kruskal-Wallis test, to ask whether the same-message and random-message recordings differ. Each dot is one result from the paper's own table, and dots above the dashed line mark a clear difference. On whole recordings, no s-box showed one. When the readings were split into ten parts, parts 8, 9, and 10 showed differences for most s-boxes. This chart shows the paper's measured values for the default s-box and the first two alternatives.
</div>

<div data-levels="hs" markdown="1">
A p-value is the chance of seeing a gap this large if the two groups truly matched. The chart puts p on a scale of powers of ten, so 10⁻²⁵ sits far above the 0.0001 line. Part 9 stands out for every s-box: its p-values run from 10⁻²⁴ to 10⁻²⁸. The paper does not say whether the ten parts split each recording by time or by reading size, so the pattern is a clue the authors leave for future work.
</div>

<div data-levels="ug" markdown="1">
Kruskal-Wallis ranks every observation from both groups together and asks whether one group's ranks run high; with two groups it matches a two-sided Mann-Whitney test without continuity correction. The paper applies it to whole traces and "for each ten-quantile of each group in a pairwise fashion," and bolds p < 0.0001. Every bold cell in the readable blocks agrees with that rule: ringed dots sit below 10⁻⁴, and Default's quantile 10 (p = 0.00026) is correctly unbolded.
</div>

<div data-levels="grad res" markdown="1">
<div class="sn-table-wrap">
<table class="results-table">
<caption class="w-note">Table 1 as printed (Kruskal-Wallis p-values, fixed versus random). Highlighted cells are bold in the paper (p &lt; 0.0001). Only the Default, S1, S2, and first four S3 rows could be read in this session; S3 quantiles 4 to 10 and S4 to S8 are omitted, not missing from the paper.</caption>
<thead><tr><th>Subset</th><th>Default</th><th>S1</th><th>S2</th><th>S3</th></tr></thead>
<tbody>
<tr><td>Full</td><td class="num">0.9178411</td><td class="num">0.8889263</td><td class="num">0.915456</td><td class="num">0.9500724</td></tr>
<tr><td>Quantile 1</td><td class="num">0.7973211</td><td class="num">0.9047302</td><td class="num">0.8438535</td><td class="num">0.9117693</td></tr>
<tr><td>Quantile 2</td><td class="num">0.9492303</td><td class="num">0.9721271</td><td class="num">0.9775268</td><td class="num">0.9705669</td></tr>
<tr><td>Quantile 3</td><td class="num">0.4865965</td><td class="num">0.5588611</td><td class="num">0.5287456</td><td class="num">0.7504782</td></tr>
<tr><td>Quantile 4</td><td class="num">0.003551987</td><td class="num">0.01427206</td><td class="num">0.01392253</td><td class="num">–</td></tr>
<tr><td>Quantile 5</td><td class="num">0.4060664</td><td class="num">0.5762426</td><td class="num">0.5347051</td><td class="num">–</td></tr>
<tr><td>Quantile 6</td><td class="num">0.2482653</td><td class="num">0.1448012</td><td class="num">0.1436789</td><td class="num">–</td></tr>
<tr><td>Quantile 7</td><td class="num">0.03989401</td><td class="num">0.1547279</td><td class="num">0.1304291</td><td class="num">–</td></tr>
<tr><td>Quantile 8</td><td class="num sig">4.704231 × 10⁻⁵</td><td class="num sig">1.198919 × 10⁻⁷</td><td class="num sig">1.721812 × 10⁻⁷</td><td class="num">–</td></tr>
<tr><td>Quantile 9</td><td class="num sig">1.787921 × 10⁻²⁸</td><td class="num sig">6.674018 × 10⁻²⁴</td><td class="num sig">3.478914 × 10⁻²⁵</td><td class="num">–</td></tr>
<tr><td>Quantile 10</td><td class="num">0.0002557376</td><td class="num sig">6.324433 × 10⁻⁶</td><td class="num sig">5.773031 × 10⁻⁶</td><td class="num">–</td></tr>
</tbody>
</table>
</div>

**Add this page's simulation** overlays Kruskal-Wallis on ten equal stretches of time from the current simulated capture. In the default capture no stretch reaches 0.0001, most likely because pooling about 244 consecutive samples per trace mixes moments that leak in opposite directions; the simulated pattern therefore does not resemble the paper's, which leaves the value-quantile reading open.
</div>

<div data-levels="grad res" markdown="1">
## Run every test on one capture

<div id="sn-lab" class="w-demo"></div>

The bench runs all six procedures on one simulated campaign and sets each beside the paper's measured outcome. Three settings reproduce the paper's qualitative picture: TVLA and paired Wilcoxon flag leakage at most of the same moments; 2,400-point slices fail Shapiro-Wilk at any resolution; and pooled two-sample K-S and Kruskal-Wallis miss the leak (default p = 0.14 and 0.48), because pooling every sample of every trace averages a localized difference into the whole waveform. Per-moment normality is the setting that moves: in the default capture 47 percent of fixed-group moments reject at 10 bits (47 to 81 percent over seeds 11 to 20), none at 12 bits or with an ideal converter, all at 8 bits, and all with 5,000 traces at 10 bits. Simulated rates describe this model; the measured traces would show where the STM32F303 capture falls.
</div>

## What the paper found

<div data-levels="public" markdown="1">
- The standard leakage check found that the chip leaked information with all nine scrambling tables tested.
- Two tests of the bell-curve shape rejected it for every configuration, so the standard check's main assumption did not hold for these recordings.
- A test that makes no bell-curve assumption found the same-message and random-message recordings alike as a whole, with differences concentrated in a few slices.
- The authors recommend that labs examine methods free of the bell-curve assumption for both finding and exploiting leaks.
</div>

<div data-levels="hs" markdown="1">
- About 1,000 traces per s-box, roughly half with a fixed message, were recorded at 105 million samples per second, 24,400 readings per trace.
- TVLA flagged leakage (\|t\| above 4.5) for the default AES s-box and all eight alternatives.
- The largest Shapiro-Wilk p-value across all nine configurations was about 1.443 × 10⁻³¹, far below the 0.0001 cutoff.
- In the Kruskal-Wallis test, parts 8 to 10 of the split readings differed for most s-boxes; the default s-box and S6 were the exceptions the authors note.
</div>

<div data-levels="ug grad res" markdown="1">
- **TVLA detects leakage everywhere.** All nine configurations exceed \|t\| = 4.5.
- **Normality fails.** Shapiro-Wilk (largest p ≈ 1.443 × 10⁻³¹ over 2,400-point subsets) and one-sample K-S (largest p ≈ 2 × 10⁻¹⁶) reject normality for every configuration at the 99.99 percent level.
- **Distributions match overall.** Two-sample K-S gives p ≥ 0.9 for fixed versus random in every configuration.
- **Non-parametric tests split the result.** Paired Wilcoxon W-values (Figure 4) behave comparably to the t-test; Kruskal-Wallis on full traces finds no difference (p = 0.89 to 0.95 in the readable blocks), while quantiles 8 to 10 do for most s-boxes, with Default and S6 noted as exceptions.
- **Recommendation and scope.** Non-parametric methods deserve study for leakage detection and exploitation; future work names more s-boxes with varying non-linearity and other processor architectures.
</div>

## Why it matters

<div data-levels="public hs" markdown="1">
Phones, payment cards, car keys, and medical devices all run ciphers on small chips, and certification labs use TVLA to decide whether a chip leaks. A test is only as trustworthy as its assumptions, and this paper checks the central one with data. Ultimately, the result points labs toward leakage tests that hold up whether or not the readings follow a bell curve.
</div>

<div data-levels="ug" markdown="1">
Welch's test tolerates non-normality well with hundreds of samples per group, so a rejected normality test does not by itself invalidate a TVLA verdict. What the paper establishes is narrower and still useful: the assumption is routinely made and rarely checked, and once checked on real captures it fails. The page's simulation adds one practical lesson for anyone running these tests: ADC resolution, sample count, and the choice of which numbers enter the test can each decide a normality verdict before any leakage is involved.
</div>

<div data-levels="grad res" markdown="1">
The study is deliberately small (one microcontroller, one implementation, one collection analyzed per s-box), and its contribution is to make the normality question empirical. Its strongest evidence, the 2,400-point Shapiro-Wilk subsets, answers that question cleanly if the subsets are per-moment collections across traces, and answers a different question if they are consecutive samples within a trace. The FigShare traces make the distinction testable, and the tests on this page are ready to run on them.
</div>

<div data-levels="res" markdown="1">
## Notes from building this page

- **No measured number reproduces here.** Every reported value comes from the FigShare traces, which this build could not download, and the S1 to S8 tables are cited to Siddiqui et al. (2020) rather than printed. The page verifies its AES engine against Tiny-AES-c and its tests against SciPy, and labels all traces as simulated.
- **Which subsets entered Shapiro-Wilk.** "Sequential subsets consisting of approximately 2400 data points" reads as consecutive samples of a trace, which tests the waveform's amplitude distribution; Welch's test assumes normality of one sample index across traces. The two readings give different answers in simulation (above). This note is the page's interpretation and needs the authors' confirmation.
- **The K-S p-value of 2 × 10⁻¹⁶.** R prints p-values below machine epsilon as "< 2.2e-16," so a "maximal p-value of approximately 2 × 10⁻¹⁶" at every point most likely means every p fell below R's display floor. The one-sample test with mean and standard deviation estimated from the same data (Lilliefors' setting) is also conservative under R's Kolmogorov reference distribution, so the true p-values are smaller still.
- **The 4.5 threshold.** The paper equates \|t\| > 4.5 with α = 0.0001. The two-sided normal tail at 4.5 is 6.8 × 10⁻⁶ (Student's *t* with 998 degrees of freedom gives 7.6 × 10⁻⁶), and α = 0.0001 corresponds to \|t\| ≈ 3.89. TVLA's 4.5 is usually quoted as roughly 10⁻⁵ per sample; across 24,400 samples the family-wise rate is larger.
- **Pooled tests and localized leakage.** A two-sample K-S or Kruskal-Wallis test on all samples of all traces compares the groups' overall amplitude distributions, which a leak at a few hundred moments barely moves; the simulation gives p = 0.14 and 0.48 at defaults with 666 leaking moments. The paper's p ≥ 0.9 and full-trace Kruskal-Wallis results fit this, and a per-sample version of each test would be the non-parametric counterpart of TVLA.
- **Pairing in the signed-rank test.** The paper uses the paired Wilcoxon test; fixed and random traces are independent captures, so any pairing is by capture order. The rank-sum (Mann-Whitney) test is the independent-samples alternative and avoids the arbitrary pairing.
- **Default and S6 as exceptions.** The text says quantiles 8 to 10 were significant "except for the Default and S6 configurations," yet Default's quantiles 8 and 9 are bold in Table 1; only its quantile 10 (p = 0.00026) misses the cutoff. The sentence likely means quantile 10. S6's block could not be read here.
- **Why equal non-linearity matters less than it seems.** For random plaintexts any bijective S-box yields uniform first-round SubBytes outputs, so the random group's first-order statistics do not depend on the S-box; differences between configurations enter through the fixed plaintext's bytes and later rounds. Testing S-boxes of different non-linearity, as the authors propose, would probe this directly.
- **Table 1 completeness.** Only the Default, S1, S2, and first four S3 rows could be read in this session; the S3 quantiles 4 to 10 and the S4 to S8 blocks should be added from the article before merge.
</div>

<div data-levels="hs" markdown="1">
## Try this in class

1. In the first demo, choose **First S-box lookup**, then switch the recorder between **10-bit ADC** and **Ideal**. Write down both Shapiro-Wilk p-values and explain, in one sentence, what rounding did to the histogram.
2. Keep the 10-bit recorder and step the traces from 100 to 5,000. Record the p-value at each step and graph it. Describe what happens to a normality test's verdict as the sample grows.
3. In the second demo, compare the number of leaking moments for **Default (AES)** and **Identity**. Explain why a fixed message leaks even when the s-box does no scrambling.
</div>

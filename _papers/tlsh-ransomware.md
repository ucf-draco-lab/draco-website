---
title: "Near Copies, Near Names: Fuzzy Hashing Four Ransomware Campaigns"
kicker: "Interactive paper · IEEE Big Data 2021"
subtitle: "An interactive companion to Rafer Cooley, Michael Cutshaw, Shaya Wolf, Rita Foster, Jed Haile, and Mike Borowczak's comparison of two ways to tell when ransomware samples belong together: TLSH, a fuzzy hash of a file's bytes, and @DisCo, a function-level analysis of its code."
description: "Change one letter and watch SHA-256 scramble while TLSH barely moves; build a TLSH digest counter by counter; break a distance into its terms; run the paper's cluster-by-cutoff pipeline on 162 simulated samples; and check the paper's Table II against its own arithmetic."
share_description: "Change one byte of a file and its SHA-256 name changes completely, so ransomware authors rebuild to slip past blocklists. A fuzzy hash gives near copies near names. Compute TLSH in your browser, written for five reading levels."
share_text: "Change one byte and a file's SHA-256 changes completely. A fuzzy hash gives near copies near names. Try TLSH in your browser:"
share_image: /papers/tlsh-ransomware/share.png
share_image_alt: "A bar chart of TLSH's 128 counters shaded by quarter, beside the title Near Copies, Near Names, with a one-letter edit that changes 60 of 64 SHA-256 digits and moves TLSH by a distance of five."
date: 2026-10-19
topics: ["AI & machine learning", "Networks"]
default_level: public
level_hints:
  public: No background needed
  hs: Bytes, hexadecimal, and counting
  ug: Hash functions, programming, and graphs
  grad: Similarity metrics, clustering, and threat intelligence
  res: Full method, reproduction checks, and open questions
authors:
  - name: Rafer Cooley
    affiliation: Idaho National Laboratory
  - name: Michael Cutshaw
    affiliation: Idaho National Laboratory
  - name: Shaya Wolf
    affiliation: Idaho National Laboratory
  - name: Rita Foster
    affiliation: Idaho National Laboratory
  - name: Jed Haile
    affiliation: Idaho National Laboratory
  - name: Mike Borowczak
    affiliation: University of Wyoming
    member: mike-borowczak
sources:
  - venue: "IEEE International Conference on Big Data · 2021 · pp. 2084–2091"
    title: "Comparing Ransomware using TLSH and @DisCo Analysis Frameworks"
    url: https://doi.org/10.1109/BigData52589.2021.9671573
    access: Paywalled (IEEE)
code:
  label: "TLSH, Trend Micro's reference implementation (trendmicro/tlsh, Apache 2.0 or BSD); @DisCo is not public"
  url: https://github.com/trendmicro/tlsh
citations:
  - ieee-big-data-2021
widget:
  css:
    - /papers/tlsh-ransomware/widget.css
  js:
    - /papers/tlsh-ransomware/tlsh-engine.js
    - /papers/tlsh-ransomware/tlsh-sim.js
    - /papers/tlsh-ransomware/widget.js
credit: "Interactive page by the [DRACO Lab](/). The browser engine (`tlsh-engine.js`, Apache 2.0 header kept) ports Trend Micro's reference TLSH in the configuration the paper used (128 buckets, one checksum byte). It reproduces all 80 digests and all 6,480 distances in the reference repository's regression outputs, and it matches the compiled reference tool on 500 generated files (including 45 that receive no digest) and on all 206,570 pairwise distances, with and without the length term. The paper's 162 samples are live malware and are not redistributed, so the pipeline demo runs on simulated byte strings and says so; @DisCo is not public, so its scores appear as printed. From the printed Table II, the page confirms that the six clusters with an @DisCo score of exactly 1.0000 have an absolute difference equal to one minus their TLSH score, mean and standard deviation, to the fourth decimal. Everything runs on your device; files you load are read locally and never uploaded."
bibtex: |
  @inproceedings{cooley2021ransomware,
    author    = {Cooley, Rafer and Cutshaw, Michael and Wolf, Shaya and Foster, Rita and Haile, Jed and Borowczak, Mike},
    title     = {Comparing Ransomware using {TLSH} and {@DisCo} Analysis Frameworks},
    booktitle = {2021 IEEE International Conference on Big Data (Big Data)},
    pages     = {2084--2091},
    year      = {2021},
    doi       = {10.1109/BigData52589.2021.9671573}
  }
---

<div class="lede" data-levels="public" markdown="1">
Ransomware locks a victim's files and demands payment for the key. Its authors rebuild their programs constantly, and each rebuild gets a new digital fingerprint, so a list of known-bad fingerprints falls behind within days. Rafer Cooley, Michael Cutshaw, Shaya Wolf, Rita Foster, Jed Haile, and Mike Borowczak compared two tools that look past those fingerprints: TLSH, which gives near copies of a file near names, and @DisCo, which compares the programs' code piece by piece. On 162 real samples from four ransomware campaigns, both tools sorted the samples into groups that matched their campaigns, and they agreed most where samples were most alike. This page lets you compute TLSH yourself.
</div>

<div class="lede" data-levels="hs" markdown="1">
A hash function turns any file into a short code. Security teams share the codes of known malware, called indicators, so others can block the same file. A standard hash such as SHA-256 changes completely if one byte of the file changes, which is perfect for proving a file is untouched and poor for catching a rebuilt copy. TLSH (the Trend Micro Locality Sensitive Hash) is a "fuzzy" hash: similar files get similar codes, and a distance score says how similar. The authors hashed 162 ransomware samples (81 Revil, 45 Darkside, 27 WannaCry, and 9 TrickBoot), linked every pair closer than 100, and compared the groups that formed with groups from @DisCo, a tool built at Idaho National Laboratory that compares programs function by function.
</div>

<div class="lede" data-levels="ug" markdown="1">
The paper contrasts two indicator resolutions. TLSH digests a whole binary: a five-byte sliding window feeds byte triplets through a Pearson hash into 128 counters, and the digest records each counter's quartile, plus a length bin, two quartile ratios, and a checksum. @DisCo lifts each binary through angr to the VEX intermediate language, embeds each function's instruction-frequency vector with a trained network, and scores a pair of binaries by the share of functions with a cosine-similarity match above 0.98. The authors computed both 162 × 162 similarity matrices, scaled TLSH distances to 0 to 1 and inverted them, linked pairs with TLSH distance at most 100 into a graph, took connected components as clusters, and compared per-cluster averages.
</div>

<div class="lede" data-levels="grad" markdown="1">
Static cryptographic hashes are brittle indicators of compromise, and context-triggered fuzzy hashes choose their context by size rather than meaning. The paper tests whether a byte-level locality-sensitive hash (TLSH v1, 128 buckets) and a function-level learned similarity (@DisCo) recover the same campaign structure from 162 MalwareBazaar samples. TLSH distances (maximum 1,112) are min-max scaled and inverted; @DisCo scores are directional match ratios. The full matrices differ by 0.201245 on average, yet thresholded TLSH clusters (eight, all single-campaign) and @DisCo clusters (ten, one mixing a WannaCry DLL into TrickBoot) largely coincide, and within clusters the mean absolute difference falls to between 0.0006 and 0.1428.
</div>

<div class="lede" data-levels="res" markdown="1">
Cooley et al. (IEEE Big Data 2021) report a case study, not a benchmark: one sample set, one TLSH cutoff (100, chosen by inspection), manually chosen cluster entry nodes, and a per-cluster comparison in Table II (printed as "Table III" in the text). TLSH is public and deterministic, so this page ports the reference implementation and verifies it against Trend Micro's regression outputs and compiled tool. The samples (SHA-256 list on the first author's site) and @DisCo are not available here, so the pipeline runs on labeled simulated data, and the paper's @DisCo figures are checked only for internal consistency. The notes at the end list what the printed method leaves open, including how the scaler was applied and which clusters Table II describes.
</div>

## One letter, two kinds of hash

<div id="tl-hook" class="w-demo"></div>

<div data-levels="public" markdown="1">
Text A is a short passage about this paper; Text B starts as the same passage with one letter changed ("ships" becomes "shops"). SHA-256 changes 60 of its 64 digits, as if the two passages had nothing in common. TLSH changes six of its 72 characters, and its distance score is 5, where 0 means identical. Press **Swap paragraphs**: SHA-256 scrambles again, and TLSH barely notices (distance 6), because the same pieces are still there. Press **Unrelated text** and the TLSH distance jumps to 285. The paper used 100 as the line between "close enough to group together" and "not."
</div>

<div data-levels="hs" markdown="1">
Each hexadecimal digit stands for four bits, so a 64-digit SHA-256 is 256 bits. Flipping one letter changes about half of those bits (119 of 256 here), the "avalanche" that makes SHA-256 useful for checking a download and useless for spotting a cousin. TLSH works differently: it measures what the file contains, not its exact order of bytes. That is why **Swap paragraphs** gives a distance of 6 while **Add a sentence** gives 32: the added sentence brings new byte patterns and makes the file longer. Edit Text B yourself and watch the distance climb as you change more.
</div>

<div data-levels="ug" markdown="1">
The highlighted characters mark positions that differ between A and B. For the one-letter edit, the TLSH distance of 5 is one point for the checksum byte and four for the body, the 32 bytes that encode the quartile of each of 128 counters. **Add a sentence** costs 32: 17 in the body, 12 for a two-step change in the Q1 ratio, and one each for the length bin, the Q2 ratio, and the checksum (the next demo but one breaks it down). You can also load two of your own files; they are read in the browser and never uploaded. TLSH refuses inputs under 50 bytes and inputs that leave half or more of the 128 counters at zero, returning TNULL.
</div>

<div data-levels="grad res" markdown="1">
TLSH distance is not a metric in the strict sense (the quartile-ratio and length terms use a circular difference and a step penalty), and it has no fixed upper bound; the paper cites the algorithm's authors as saying scores rarely exceed 2,000 in practice, and its own largest pairwise score was 1,112. The scaled similarity shown here, 1 − d/1,112, assumes the paper's minimum of 0 (each sample compared with itself) and its reported maximum. Unrelated English text scores 285, or 0.744 on that scale, which already hints that scaled similarities near 0.9 are less reassuring than they look.
</div>

## How TLSH builds a digest

<div id="tl-mech" class="w-demo"></div>

<div data-levels="public" markdown="1">
TLSH reads a file five bytes (here, five characters) at a time, sliding forward one byte per step. From each group of five it picks six combinations of three bytes and turns each combination into a counter number. Drag the slider to move the window and see which counters it adds to (the highlighted bars). After the whole file is read, TLSH ranks the counters and keeps only which quarter each falls in, from the faintest bars (the lowest quarter) to the most strongly colored (the highest). Those quarters, plus the file's length, become the digest.
</div>

<div data-levels="hs" markdown="1">
The six triplets always include the newest byte, paired with two of the four before it. A lookup table scrambles each triplet into a number from 0 to 255; the default digest uses only counters 0 to 127, so roughly half of the triplets land in counters it ignores (shown in gray). The dashed lines are the three quartiles: a quarter of the counters sit at or below Q1, half at or below Q2, and three quarters at or below Q3. Each counter then gets a two-bit code (0, 1, 2, or 3), and 128 counters × 2 bits = 256 bits, or 64 hexadecimal digits, the body of the digest.
</div>

<div data-levels="ug" markdown="1">
The mapping is Pearson hashing: `h = T[T[T[T[salt] ^ a] ^ b] ^ c]` with a fixed 256-entry permutation `T` and six salts, one per triplet pattern. The header holds a one-byte checksum (the same Pearson hash run over consecutive byte pairs), a length bin on a roughly logarithmic scale (the 803-byte sample text falls in bin 16), and the two ratios ⌊100·Q1/Q3⌋ and ⌊100·Q2/Q3⌋, each kept modulo 16. Because only quartile membership survives, uniform growth of a file leaves the body unchanged, and small edits move only the few counters whose rank crosses a quartile boundary.
</div>

<div data-levels="grad res" markdown="1">
The port follows `TlshImpl::update` and `final` from the reference C++ code. Quartiles are order statistics of the 128 effective counts (positions 31, 63, and 95 after sorting), which is what the reference partition search returns, and the validity rules (at least 50 bytes, Q3 > 0, more than 64 nonzero counters) are the same. Header bytes are nibble-swapped and the body is written last counter first; on the reference regression set the port reproduces all 80 digests character for character. The configuration matters for comparing with the paper: "V1, 128 buckets" corresponds to the T1-prefixed default build with a one-byte checksum, not the 256-bucket or three-byte-checksum variants.
</div>

## Scoring the gap between two digests

<div id="tl-dist" class="w-demo"></div>

<div data-levels="public" markdown="1">
The grid shows the quarter of every counter for Text A (top two rows) and Text B (bottom two rows); outlined cells changed quarter. The distance adds a few points for each changed cell, more for bigger jumps, plus points if the files differ in length or in the spread of their counts. The bar underneath places the score on the paper's scale: the shaded part, up to 100, is where the authors linked two samples together.
</div>

<div data-levels="hs" markdown="1">
A counter that moves one quarter adds 1 point; two quarters add 2; jumping from the lowest quarter to the highest adds 6, so big shifts count much more than small ones. Use the slider to try distances: the paper turned each distance into a similarity between 0 and 1 by computing 1 − distance ÷ 1,112, so the cutoff of 100 equals a similarity of about 0.910. Every pair in the paper scored somewhere between 0 and 1,112.
</div>

<div data-levels="ug" markdown="1">
The total is the sum of five terms from `lsh_bin_totalDiff`: the length term (0 or 1 for adjacent bins, otherwise 12 per bin of circular distance over 256), two quartile-ratio terms (0 or 1 for a step of one, otherwise 12 per additional step over 16), one point for a checksum mismatch, and the body term, summed over 128 two-bit codes with costs 0, 1, 2, and 6. The default build, which the paper used, keeps the length term on, so two otherwise identical files of widely different sizes score far apart. Inverting a min-max scaled distance makes TLSH read like @DisCo's cosine-based score, where 1 means identical.
</div>

<div data-levels="grad res" markdown="1">
The body term is a weighted Hamming-style distance between quantized histograms, and the 6 for a three-quartile jump makes the score sensitive to counters that change rank sharply rather than to small drifts. The port reproduces all 6,480 reference regression distances (with and without the length term) and 206,570 distances between 500 generated files exactly. Scaling by a data set's maximum makes scaled similarities depend on the most distant pair in the set: adding one unusual sample changes every scaled value, which matters when comparing averages across studies or against a fixed threshold such as @DisCo's 0.98.
</div>

## The paper's pipeline, on simulated samples

<div id="tl-pipe" class="w-demo"></div>

<div data-levels="public" markdown="1">
The real samples are live ransomware, so this demo builds 162 harmless stand-in files in four families of the same sizes as the paper's. Each square of the picture compares two files: the stronger its color, the more similar the pair. The outlined squares are the families, and the bright blocks inside them are files that share most of their content. The slider sets how close two files must be to count as linked; linked files form clusters. At the paper's setting of 100, the stand-in files form seven clusters, each from a single family. Slide to 150 and clusters from different families start to merge into one.
</div>

<div data-levels="hs" markdown="1">
Think of every file as a dot and draw a line between any two dots whose TLSH distance is at most the cutoff. A cluster is a group of dots you can walk between along lines. Groups of only one or two files are left out, as in the paper. Some stand-in files are "packed": most of their bytes were replaced with random data, the way an encrypted payload looks, and TLSH cannot link them to anything (3 Revil, 11 Darkside, and 11 WannaCry, the same counts the paper left out). Try a cutoff of 50 and of 150 and count the clusters each time.
</div>

<div data-levels="ug" markdown="1">
Each stand-in "program" is a sequence of function-sized chunks drawn from a family-specific byte distribution, with shared runtime chunks in every family. Families have one or more builds (half of their chunks rewritten), and each sample is a build with light edits; **Edits per sample** sets that rate. With 4% edits, cutoffs from 60 to 85 give eight single-family clusters with the paper's excluded counts, 90 to 100 give seven (the two TrickBoot builds join), and 135 is the first cutoff that merges families (two clusters, one mixing three families). The table applies the paper's scaling with this set's largest distance (about 276) in place of 1,112.
</div>

<div data-levels="grad res" markdown="1">
The stand-in set was designed to resemble Figure 2 (one Revil and one WannaCry build, four Darkside builds, two TrickBoot builds, and packed copies in the paper's excluded counts), so the cluster counts it produces illustrate the procedure and are not evidence about real ransomware. What the demo does show is the sensitivity of single-linkage components to the cutoff: one sub-cutoff edge merges two clusters, so a cutoff chosen by eye on one sample set may not transfer to the next campaign. The scaled within-cluster means here (0.75 to 0.88 at 4% edits and a cutoff of 100) sit below the paper's (0.85 to 0.999) mostly because the denominator is this set's maximum, 276, rather than 1,112; the raw mean distances (38 to 77) are the comparable quantity.
</div>

## Two lenses on the same clusters

<div id="tl-table" class="w-demo"></div>

<div data-levels="public" markdown="1">
For each of the ten groups @DisCo found, the paper reports how similar the samples looked to @DisCo (filled circles) and to TLSH (open circles), from 0 (nothing alike) to 1 (identical). In most groups both tools score the samples as close to identical. Group 7 stands out: @DisCo put a WannaCry sample in with TrickBoot samples, and its average drops with a wide spread. Switch to **Absolute difference** to see how far apart the two tools land in each group; the largest gap is about 0.14.
</div>

<div data-levels="hs" markdown="1">
The lines through each circle span one standard deviation, a measure of how spread out the scores are. Six groups have an @DisCo score of exactly 1.0000 with no spread: every function in every sample matched. For those groups, the gap between the tools has to equal 1 minus the TLSH score, and it does (group 4: 1 − 0.9686 = 0.0314, as printed). Group 7's wide spread fits one sample unlike the rest: the authors note that both the WannaCry sample and the TrickBoot samples in that group are DLLs (dynamic link libraries).
</div>

<div data-levels="ug" markdown="1">
@DisCo's score for binary A against binary B is the share of A's functions whose best match in B has cosine similarity above 0.98, so it is directional, and it saturates at 1 when every function finds a near-identical partner. TLSH's scaled score is symmetric. The within-cluster absolute differences (0.0006 to 0.1428) are much smaller than the 0.201245 average over the full 162 × 162 matrices, which the authors read as agreement where samples are expected to be alike, and disagreement concentrated where the two tools would draw cluster boundaries differently.
</div>

<div data-levels="grad res" markdown="1">
The table below is the page's own check of the printed values. For the six rows with @DisCo exactly 1.0000 ± 0.0000, |@DisCo − TLSH| reduces to 1 − TLSH elementwise, so both the mean and the standard deviation of the difference must match the TLSH column, and all six do to the fourth decimal. The implied mean raw distances, (1 − TLSH) × 1,112, run from about two and under one (clusters 9 and 10, near-identical rebuilds) to about 160 (cluster 7), and three clusters (5, 7, and 8) average above the cutoff of 100. That is possible for single-linkage components, and also consistent with these being @DisCo clusters, which TLSH never had to link.
</div>

## What the paper found

<div data-levels="public" markdown="1">
- Both tools grouped the 162 ransomware samples mostly by campaign: TLSH formed eight groups, each from one campaign, and @DisCo formed ten.
- @DisCo split the Revil campaign into three groups, which may reflect versions built for different victims.
- Inside the groups, the two tools gave nearly the same similarity scores, so each can check the other, and the samples they disagree on are the ones worth a closer look.
</div>

<div data-levels="hs" markdown="1">
- The data set held 162 samples from MalwareBazaar: 81 Revil, 45 Darkside, 27 WannaCry, and 9 TrickBoot.
- Linking pairs with a TLSH distance of 100 or less gave eight clusters with no campaign mixing; 25 samples (11 Darkside, 11 WannaCry, and 3 Revil) were left in groups of one or two.
- @DisCo gave ten clusters and left out 20 samples (13 Darkside, three WannaCry, and four Revil); one cluster mixed a WannaCry DLL into TrickBoot.
- Averaged over all pairs, the two tools differed by about 0.2 on a 0 to 1 scale; inside clusters the difference ranged from 0.0006 to 0.1428.
</div>

<div data-levels="ug grad res" markdown="1">
- **Data.** 162 PE and ELF samples from four campaigns (Table I); TLSH v1 with 128 buckets and default parameters; maximum pairwise TLSH distance 1,112, min-max scaled with scikit-learn 0.24.2 and inverted.
- **Full matrices.** Mean absolute difference between the scaled TLSH and @DisCo matrices: 0.201245 (Figure 1).
- **Clusters.** TLSH at a cutoff of 100: eight single-campaign clusters (Revil 1, WannaCry 2, Darkside 3 to 5 and 8, TrickBoot 6 and 7), 25 samples excluded. @DisCo: ten clusters (Revil 1, 2, and 5; Darkside 3, 4, and 10; WannaCry 6 and 8; TrickBoot 9; TrickBoot plus one WannaCry DLL 7), 20 excluded.
- **Agreement.** Within the ten clusters of Table II, mean absolute difference 0.0006 to 0.1428; @DisCo means 0.8618 to 1.0000 and scaled TLSH means 0.8547 to 0.9994.
</div>

<div data-levels="grad res" markdown="1">
<div class="tl-table-wrap">
<table class="results-table tl-wide">
<caption>Table II as printed: average similarity per cluster (mean ± standard deviation). The text calls it Table III; the rows are the ten @DisCo clusters of Figure 3.</caption>
<thead><tr><th>Cluster</th><th>Campaign</th><th>@DisCo</th><th>TLSH (scaled)</th><th>Absolute difference</th></tr></thead>
<tbody>
<tr><td>1</td><td>Revil</td><td>0.9966 ± 0.0049</td><td>0.9456 ± 0.0309</td><td>0.0509 ± 0.0300</td></tr>
<tr><td>2</td><td>Revil</td><td>0.9803 ± 0.0907</td><td>0.9571 ± 0.0267</td><td>0.0514 ± 0.0635</td></tr>
<tr><td>3</td><td>Darkside</td><td>0.9970 ± 0.0037</td><td>0.9200 ± 0.0529</td><td>0.0770 ± 0.0504</td></tr>
<tr><td>4</td><td>Darkside</td><td>1.0000 ± 0.0000</td><td>0.9686 ± 0.0189</td><td>0.0314 ± 0.0189</td></tr>
<tr><td>5</td><td>Revil</td><td>1.0000 ± 0.0000</td><td>0.8681 ± 0.0893</td><td>0.1319 ± 0.0893</td></tr>
<tr><td>6</td><td>WannaCry</td><td>1.0000 ± 0.0000</td><td>0.9602 ± 0.0166</td><td>0.0398 ± 0.0166</td></tr>
<tr><td>7</td><td>TrickBoot + 1 WannaCry</td><td>0.8618 ± 0.3219</td><td>0.8547 ± 0.2041</td><td>0.1428 ± 0.2016</td></tr>
<tr><td>8</td><td>WannaCry</td><td>1.0000 ± 0.0000</td><td>0.9041 ± 0.1245</td><td>0.0959 ± 0.1245</td></tr>
<tr><td>9</td><td>TrickBoot</td><td>1.0000 ± 0.0000</td><td>0.9981 ± 0.0014</td><td>0.0019 ± 0.0014</td></tr>
<tr><td>10</td><td>Darkside</td><td>1.0000 ± 0.0000</td><td>0.9994 ± 0.0004</td><td>0.0006 ± 0.0004</td></tr>
</tbody>
</table>
</div>
</div>

## Why it matters

<div data-levels="public hs" markdown="1">
Defenders share lists of bad files so that one organization's discovery protects many others. Those lists only work if they recognize the next copy, and ransomware authors rebuild precisely so that the old list fails. A fuzzy hash such as TLSH can still recognize a rebuilt file, and a code-level tool such as @DisCo can explain which parts match. Ultimately, the paper shows that two distinct ways of measuring similarity agree on which samples belong together, which gives defenders a way to double-check each tool and to spot the samples that need a human analyst.
</div>

<div data-levels="ug" markdown="1">
The authors frame four properties of a good indicator: it narrows the search space, explains why two samples are similar, works at more than one resolution of a sample, and scales to the volume of new malware. TLSH is fast and needs no disassembly; @DisCo is slower and needs a working lift of the binary, but its matches point to specific functions. Pairing them gives a cheap first pass and an explainable second pass, and the pairs where they disagree (packed or encrypted regions that @DisCo cannot read, or shared libraries that TLSH sees only as bytes) are exactly where analyst time pays off.
</div>

<div data-levels="grad res" markdown="1">
The contribution is a cross-validation argument for multi-resolution indicators: byte-level and function-level similarity largely recover the same campaign structure, and their disagreements are informative. The limits are those of a single case study: 162 samples from four campaigns, one cutoff chosen visually, manual entry nodes for the cluster search, and no ground truth below the campaign level (build, packer, or victim). The authors' stated next step is to explore other ways of combining @DisCo's function matches into a binary-level score that stays explainable.
</div>

<div data-levels="res" markdown="1">
## Notes from building this page

- **Which clusters Table II describes.** The text says the table averages "the clusters depicted in Figure 2" (TLSH, eight clusters), but the table has ten rows, and the appendix and Figure 3 give @DisCo ten clusters. The campaign labels used on this page assume the rows follow Figure 3's numbering; the six rows with @DisCo exactly 1.0000 are consistent with either reading.
- **Table numbering.** The table is captioned "Table II" and followed by a stray "Table III" line; the text refers to it as Table III.
- **How the scaler was applied.** scikit-learn's `MinMaxScaler` scales each column independently. Applied to the 162 × 162 distance matrix as a 2-D array, each sample's column would be scaled by its own maximum (and minimum 0 from the diagonal), not by the global 1,112. The paper's text implies a global scaling; the page assumes it. Under column-wise scaling the TLSH matrix would not be symmetric, and the implied raw distances in the check table would not apply.
- **What "average" includes.** The text says each cluster's matrix was averaged. Whether the diagonal (self-comparisons, TLSH similarity 1 and @DisCo 1) is included changes the means and shrinks the standard deviations, most for small clusters. This page's simulated table includes the diagonal.
- **Directional @DisCo scores.** @DisCo's A-to-B score can differ from B-to-A. The absolute-difference matrix compares a symmetric TLSH score with a directional one, so its average depends on which direction fills each cell; the paper does not say whether the matrix was symmetrized.
- **Excluded samples.** The TLSH clusters exclude 25 samples and the @DisCo clusters 20, and each cluster set's averages use only its own members, so the two sets of comparisons cover different samples.
- **Average raw distances above the cutoff.** If the scaling was global, clusters 5, 7, and 8 average more than 100 in raw TLSH distance (about 147, 162, and 107). That fits the reading that Table II describes @DisCo clusters, whose members TLSH never linked; it would be unusual, though possible, for TLSH single-linkage clusters.
- **TLSH configuration.** "Version one with 128 buckets" matches the reference library's default T1 build (one checksum byte, length term on). The library's `-xlen` option and the 256-bucket or three-byte-checksum builds give different distances, so the paper's 1,112 maximum and cutoff of 100 are specific to the default.
</div>

<div data-levels="hs" markdown="1">
## Try this in class

1. Copy a paragraph from a textbook into Text A and Text B. Change one word in B and record the SHA-256 digits that change and the TLSH distance. Repeat with two, four, and eight changed words, and graph distance against the number of changes.
2. Shuffle the order of the sentences in B without changing any words. Predict whether the TLSH distance will be small or large before you check, and explain the result using the five-byte window.
3. In the pipeline demo, find the smallest cutoff at which two different families first join one cluster. Discuss what a security team would lose by choosing a cutoff that is too high, and what it would lose with one that is too low.
</div>

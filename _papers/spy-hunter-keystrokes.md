---
title: "Spy Hunter: Recognizing a Typist by Rhythm Alone"
kicker: "Interactive paper · IEEE ICMLA 2019"
subtitle: "An interactive companion to Rasana Manandhar, Shaya Wolf, and Mike Borowczak's continuous authentication system, which keeps checking who is at the keyboard using only the timing of each key press, never the keys themselves."
description: "Type a passage and see the five timings Spy Hunter reads from every keystroke, train its two one-class classifiers on your own rhythm in your browser, then keep typing (or hand the keyboard over) and watch the trust model decide."
share_description: "A password checks you once. Spy Hunter keeps checking, using only how long you hold each key and how quickly you move to the next. Train it on your own typing in your browser, written for five reading levels."
share_text: "A password checks you once. Spy Hunter keeps checking, from the rhythm of your keys alone. Train it on your own typing:"
share_image: /papers/spy-hunter-keystrokes/share.png
share_image_alt: "Seven keystrokes from the paper's Table I drawn as press-to-release bars on a time axis, with the hold, UD, UU, DD, and DU intervals between two of them, beside the title Spy Hunter."
date: 2026-10-18
default_level: public
level_hints:
  public: No background needed
  hs: Timing, averages, and a little algebra
  ug: Programming and an introduction to machine learning
  grad: Statistics, kernels, and biometric error rates
  res: Full method, reproduction, and open questions
authors:
  - name: Rasana Manandhar
    affiliation: University of Wyoming
  - name: Shaya Wolf
    affiliation: University of Wyoming
  - name: Mike Borowczak
    affiliation: University of Wyoming
    member: mike-borowczak
sources:
  - venue: "IEEE ICMLA 2019 · pp. 1259–1266"
    title: "One-class Classification to Continuously Authenticate Users Based on Keystroke Timing Dynamics"
    url: https://doi.org/10.1109/ICMLA.2019.00207
    access: Paywalled (IEEE)
  - venue: "arXiv 1903.03132 · 2019"
    title: "Dynamic Anonymized Evaluation for Behavioral Continuous Authentication"
    url: https://arxiv.org/abs/1903.03132
    access: Open access (arXiv preprint)
code:
  label: "No public code or data; this page's engine (spyhunter-engine.js)"
  url: https://github.com/ucf-draco-lab/draco-website/blob/main/papers/spy-hunter-keystrokes/spyhunter-engine.js
citations:
  - ICMLA
  - ContinuousSpyHunter
widget:
  css:
    - /papers/spy-hunter-keystrokes/widget.css
  js:
    - /papers/spy-hunter-keystrokes/spyhunter-engine.js
    - /papers/spy-hunter-keystrokes/widget.js
credit: "Interactive page by the [DRACO Lab](/). The browser engine extracts the paper's five timing features, applies its 96 to 825 ms filter, trains two one-class support vector machines, and runs its trust model. The feature extraction rebuilds all 30 values of the paper's Table I from seven reconstructed keystrokes (28 exactly, two within the table's 0.1 ms rounding). The one-class SVM is a port of the libsvm solver inside scikit-learn's `OneClassSVM`; over 72 test fits it matches scikit-learn 1.9.1 exactly on the offset and to within 10⁻¹² on every decision value. The study's 20-user data are private, so the paper's error rates are reported from the papers, and every replay on this page uses simulated typists or your own keystrokes. Nothing you type leaves your device."
bibtex: |
  @inproceedings{manandhar2019icmla,
    author    = {Manandhar, Rasana and Wolf, Shaya and Borowczak, Mike},
    title     = {One-class Classification to Continuously Authenticate Users Based on Keystroke Timing Dynamics},
    booktitle = {2019 18th IEEE International Conference on Machine Learning and Applications (ICMLA)},
    pages     = {1259--1266},
    year      = {2019},
    doi       = {10.1109/ICMLA.2019.00207}
  }

  @misc{manandhar2019arxiv,
    author        = {Manandhar, Rasana and Wolf, Shaya and Borowczak, Mike},
    title         = {Dynamic Anonymized Evaluation for Behavioral Continuous Authentication},
    year          = {2019},
    eprint        = {1903.03132},
    archivePrefix = {arXiv},
    primaryClass  = {cs.CR},
    doi           = {10.48550/arXiv.1903.03132}
  }
---

<div class="lede" data-levels="public" markdown="1">
A password proves who you are once, at the moment you log in. After that, anyone who sits down at your unlocked computer is treated as you. Spy Hunter, built by Rasana Manandhar, Shaya Wolf, and Mike Borowczak at the University of Wyoming, keeps checking quietly in the background by learning the rhythm of your typing: how long you hold each key and how quickly you reach the next. It never records which keys you press, so it can recognize you without reading a word you write. This page lets you teach it your own rhythm and then try to fool it.
</div>

<div class="lede" data-levels="hs" markdown="1">
Every key press has two moments: the instant the key goes down and the instant it comes back up. Spy Hunter measures the gaps between those moments for each pair of keys you type, five numbers per keystroke, and learns the pattern those numbers make for one person. Then it watches new typing a few keys at a time and keeps a trust score that falls when the rhythm looks wrong and recovers when it looks right. With the paper's settings, a stranger was locked out after about 77 keystrokes on average, and the rightful user was wrongly locked out 2 percent of the time.
</div>

<div class="lede" data-levels="ug" markdown="1">
Spy Hunter is a continuous authentication system based on keystroke timing dynamics over free text. From the press and release times of consecutive keys it extracts five features (hold, up-down, up-up, down-down, and down-up times), trains two one-class support vector machines (SVMs) on the genuine user's rows alone, and judges new typing in blocks of *n* keystrokes. A trust level starts at 100, drops when the classifiers flag a block as an intruder's, rises when they do not, and locks the session below a threshold λ. On 20 users with five-fold cross-validation, the best settings gave a 2.05 percent false acceptance rate (FAR) and a 2.00 percent false rejection rate (FRR).
</div>

<div class="lede" data-levels="grad" markdown="1">
A privacy-preserving behavioral biometric: no key identities are stored, only five inter-key timings per keystroke. Two RBF-kernel one-class SVMs (γ = 0.01 and γ = 50) model the genuine user without impostor data, and a weighted trust model aggregates per-block flag rates over non-overlapping blocks of *n* keystrokes. The ICMLA paper sweeps *n*, both γ values, the flag-rate threshold acc, and the lock-out threshold λ one at a time, and reports FAR 2.05 percent, FRR 2.00 percent, and 12.78 blocks to detect an intruder at *n* = 6, acc = 65 percent, and λ = 70. The earlier arXiv paper evaluates a single classifier without the trust model on prompted and free typing.
</div>

<div class="lede" data-levels="res" markdown="1">
Manandhar, Wolf, and Borowczak (ICMLA 2019) extend their arXiv preprint (1903.03132) from one one-class SVM with a fixed 65 percent rejection threshold to two RBF one-class SVMs combined through a four-rule trust model with weights (10, 8, 0.03, 2). This page ports the feature extraction, the outlier filter, the one-class SVM (libsvm's solver, as wrapped by scikit-learn), and the trust model to JavaScript, verifies the solver against scikit-learn, and rebuilds the paper's Table I from reconstructed keystrokes. The 20-user dataset is not public, so the error rates in both papers are reported rather than recomputed; the page's own replays run on your keystrokes or on simulated typists and say so. The researcher notes at the end list where the printed method and the reported numbers leave room for interpretation.
</div>

## Your typing rhythm, five numbers at a time

<div id="sh-rhythm" class="w-demo"></div>

<div data-levels="public" markdown="1">
Type the passage into the box. Each bar is one key, drawn from the moment it went down to the moment it came back up; the two brightest bars are your latest pair. The lines underneath measure five gaps between those two keys, and the table keeps the last six sets. Your letters never appear: the bars look the same whether you typed an *a* or a *z*. Press **Show the paper's Table I** to see six real keystrokes from one of the study's volunteers, rebuilt from the numbers printed in the paper.
</div>

<div data-levels="hs" markdown="1">
Call the press time of a key *D* (down) and its release time *U* (up). For two keys in a row, the five features are: hold = *U*₂ − *D*₂, UD = *D*₂ − *U*₁, UU = *U*₂ − *U*₁, DD = *D*₂ − *D*₁, and DU = *U*₂ − *D*₁. Once the previous key's hold time is known, hold and UD fix the other three (UU = hold + UD, DD = previous hold + UD, and DU = DD + hold), which is how this page could rebuild the volunteer's keystrokes from the paper's table. A dashed UD line means you pressed the next key before releasing the last one, so UD came out negative.
</div>

<div data-levels="ug" markdown="1">
The paper's collector used Python's `pynput` listener to log press and release times system-wide; this page uses the browser's `keydown` and `keyup` events, pairs each press with its release by the physical key code, discards the code, and ignores auto-repeat. Rows are formed in press order, one per keystroke after the first. Pre-processing removes any row with a timing below 96 ms or above 825 ms; the study kept 1,039 to 2,724 of the 4,000 rows collected per user. Cells shaded in the table fall outside that window.
</div>

<div data-levels="grad res" markdown="1">
Table I's six rows are consecutive keystrokes: in every row after the first, DD − UD equals the previous row's hold time to within 0.1 ms. That fixes seven press and release times up to a common offset (the key before row 1 was held 81 ms), and the engine recomputes all 30 printed values from them, 28 exactly and two within the table's rounding. The same reconstruction shows that the stated filter would keep only one of the six example rows (row 3): every other row has a hold or UD time under 96 ms.
</div>

## Teaching Spy Hunter your rhythm

<div id="sh-enroll" class="w-demo"></div>

<div data-levels="public" markdown="1">
Each dot is one keystroke, placed by how long you held the key (left to right) and how long you took to reach it from the previous key (bottom to top). Press **Train Spy Hunter** and two separate judges study only your dots, then shade the area they consider "you". Dots outside the shading are keystrokes that already look a little unusual. No examples of anyone else's typing are needed, which matters, because a real system rarely has samples of the intruder in advance. If you have not typed enough, the button trains on a simulated typist instead.
</div>

<div data-levels="hs" markdown="1">
Each judge draws a boundary around the typical part of your dots. Classifier 1 draws a loose, smooth boundary; classifier 2 draws a tight one that hugs clusters of dots. The paper uses both because they make different mistakes: the loose one rarely rejects you but can let a similar typist through, and the tight one catches more intruders but also flags more of your own odd keystrokes. Try switching the filter off and retraining to see how many more of your rows the page can use.
</div>

<div data-levels="ug" markdown="1">
A one-class SVM finds a boundary in a kernel feature space that encloses most of the training rows and labels new rows +1 (inside, genuine) or −1 (outside). With the RBF kernel *k*(**x**, **y**) = exp(−γ‖**x** − **y**‖²), γ sets how local the boundary is: γ = 0.01 (classifier 1) yields an almost spherical region, and γ = 50 (classifier 2) yields a region that follows the data closely. Features are used in seconds without scaling, as the paper describes. The shaded region is a two-dimensional slice of a five-dimensional boundary, with the other three features fixed at their medians.
</div>

<div data-levels="grad res" markdown="1">
The one-class SVM solves min ½ αᵀ*Q*α subject to 0 ≤ αᵢ ≤ 1 and Σαᵢ = ν*l*, with decision function *f*(**x**) = Σαᵢ*k*(**x**ᵢ, **x**) − ρ. The parameter ν is an upper bound on the fraction of training rows left outside the boundary and a lower bound on the fraction of rows that become support vectors. The papers do not report ν. The page uses ν = 0.25 and exposes it in the next demo; the researcher notes explain why the scikit-learn default (ν = 0.5) cannot reproduce a 2 percent FRR under this trust model. The solver is a line-for-line port of libsvm's one-class routine (second-order working set selection, tolerance 0.001, single-precision kernel cache).
</div>

## Who is typing now

<div id="sh-trust" class="w-demo"></div>

<div data-levels="public" markdown="1">
Keep typing in this box after training, or ask someone else to type, or press **Replay a simulated impostor**. Every six keystrokes, both judges vote on how many of those keys look wrong. The line is the trust score: it starts at 100, drops a lot when both judges agree that something is off, drops a little when they are unsure, and climbs back when either judge sees nothing wrong. When it falls below the dashed line at 70, Spy Hunter locks the computer. With Spy Hunter trained on the simulated typist, the simulated impostor is locked out after 10 blocks, or 60 keystrokes.
</div>

<div data-levels="hs" markdown="1">
The bars under the line show what fraction of each block's six keystrokes the two classifiers flagged (*a*₁ and *a*₂). The highlighted rule in the table is the one that fired for the selected block; click any block to see its rule. Penalties scale with the average flag fraction, so the biggest possible drop is 10 points. Starting at 100 with a lock-out at 70, even the most obvious intruder therefore gets four blocks (24 keystrokes) before the lock, which is the price of not locking out the real user over a single clumsy block.
</div>

<div data-levels="ug" markdown="1">
Each block of *n* rows goes to both classifiers, and *a*₁ and *a*₂ are the fractions labeled −1. The four rules, in the order the paper describes them, are applied as shown, and *T* never exceeds 100. The sliders cover the values the paper swept. A small block decides often but on little evidence; a large block decides rarely but surely. Raising λ locks intruders out sooner and genuine users more often. When you type yourself, the second session usually drifts from the first (a different mood, posture, or text), which is exactly the variability the trust model is meant to absorb.
</div>

<div data-levels="grad res" markdown="1">
With ν fixed, each classifier flags a genuine row with probability near ν on training data and somewhat higher on a new session, so the per-block flag count is roughly binomial. Rule (b) fires whenever either count reaches ⌈acc · *n*⌉, which makes the genuine user's penalty rate sensitive to ν, *n*, and acc together, while rule (d) needs a block with no flags at all from one classifier. The γ and ν sliders retrain both classifiers on the enrollment rows, and the current test keystrokes are judged again from the first block.
</div>

## What the papers measured

<div id="sh-results" class="w-demo"></div>

<div data-levels="public" markdown="1">
The first chart comes from the earlier paper, which tested a simpler version of Spy Hunter on the same 20 volunteers. Judging bigger chunks of typing at once let more intruders slip through (the first bar of each pair) but bothered real users less (the second bar). Typing freely, the way people use their computers every day, was easier to recognize than typing an assigned passage. The table compares the later paper's result with earlier keystroke systems; Spy Hunter's errors are among the lower ones, and it needs no samples from intruders.
</div>

<div data-levels="hs" markdown="1">
FAR is the share of times an intruder was accepted, and FRR the share of times the real user was rejected. In the first chart, moving from 30-key to 100-key blocks raised FAR from 0.25 to 5.25 percent while lowering FRR from 5 to 1.25 percent, a trade-off you can see in the bar heights. The numbers under each pair are the average number of blocks needed to reach a decision. With 30-key blocks on free typing, that is 1.82 blocks, or about 55 keystrokes.
</div>

<div data-levels="ug grad res" markdown="1">
The arXiv evaluation trains on the first 1,500 characters of each 2,000-character phase and tests on the remaining 500, cut into blocks, with a fixed rule: reject when the classifier labels more than 65 percent of a block's rows as intruder. A random-segment validation (Table 3, 80-key blocks, five and ten folds) gives FAR 0.83 to 3.2 percent and FRR 0.68 to 1.7 percent. The ICMLA paper replaces the fixed rule with the trust model and reports its comparison against seven earlier free-text systems, two of which also use one-class methods.
</div>

## What the papers found

<div data-levels="public" markdown="1">
- Spy Hunter recognized its 20 volunteers from typing rhythm alone, accepting an intruder about 2 times in 100 and rejecting the rightful user 2 times in 100.
- An intruder was caught within about 77 keystrokes on average, roughly one sentence.
- Free, everyday typing identified people better than copying an assigned passage.
- Spy Hunter never needed to know which keys were pressed, so it protects privacy while it protects the computer.
</div>

<div data-levels="hs" markdown="1">
- With blocks of six keystrokes, the best settings gave a false acceptance rate of 2.05 percent and a false rejection rate of 2.00 percent.
- An intruder was detected after 12.78 blocks on average, about 77 keystrokes.
- Each setting traded one error for the other: a stricter threshold caught more intruders and rejected more genuine users.
- The earlier, simpler version reached a false acceptance rate of zero on free typing with 30- and 50-key blocks, at a cost of 4 to 5 percent false rejections.
</div>

<div data-levels="ug grad res" markdown="1">
- **Error rates.** At *n* = 6, γ₁ = 0.01, γ₂ = 50, acc = 65 percent, and λ = 70, five-fold cross-validation over 20 users gave FAR 2.05 percent and FRR 2.00 percent, with 12.78 blocks (about 77 keystrokes) to detect an intruder (ICMLA, Section V).
- **Block size dominates.** At *n* = 1 genuine users were usually rejected; larger blocks drove FRR toward zero (Figure 3).
- **Kernel width.** Raising γ₂ lowered FAR and raised FRR, which the authors attribute to overfitting at large γ (Figure 5).
- **Thresholds.** acc = 100 percent gave FRR 0 but FAR up to 20 percent; raising λ toward 100 drove FRR to 100 percent and FAR to 0 (Figures 6 and 7).
- **No impostor data.** Against the closest one-class prior work (10 users), FAR fell by a factor of five (11.3 to 2.05 percent) and FRR by a factor of ten (20.4 to 2.00 percent) (Table II).
- **Free text beats prompts.** In the arXiv study, background typing during normal use produced lower FAR and fewer blocks to decide than prompted typing, likely because people type more distinctively when they choose their own words (Tables 1 to 3).
</div>

<div data-levels="grad res" markdown="1">
<div class="sh-table-wrap">
<table class="results-table">
<caption class="w-note">Best value of each swept parameter (ICMLA, Section V). Every best setting gave FAR 2.05 percent, FRR 2.00 percent, and 12.78 blocks to detect an intruder.</caption>
<thead><tr><th>Parameter</th><th>Values tested</th><th>Best</th></tr></thead>
<tbody>
<tr><td>Block size <em>n</em></td><td>1, 5, 6, 10, 15, 20, 30, 50, 80, 100</td><td>6</td></tr>
<tr><td>γ₁ (classifier 1)</td><td>0.01, 0.1, 1, 10, 50, 100</td><td>0.01</td></tr>
<tr><td>γ₂ (classifier 2)</td><td>0.01, 0.1, 1, 10, 50, 100</td><td>50</td></tr>
<tr><td>Threshold accuracy acc</td><td>60, 65, 70, 80, 90, 100 percent</td><td>65 percent</td></tr>
<tr><td>Threshold trust λ</td><td>20, 50, 60, 70, 80, 90, 100</td><td>70</td></tr>
<tr><td>Weights <em>w</em>₁ to <em>w</em>₄</td><td>held constant</td><td>10, 8, 0.03, 2</td></tr>
</tbody>
</table>
</div>
</div>

## Why it matters

<div data-levels="public hs" markdown="1">
Most security checks happen once, at the door. Spy Hunter adds a check that never stops and costs nothing extra: every computer already has a keyboard, and the system listens only to timing, so it can run in the background without storing anything private. A stolen password or an unlocked laptop then buys an intruder seconds instead of a whole session. Because a wrong rejection only means typing your password again, the designers tuned it to catch intruders quickly and to tolerate an occasional false alarm.
</div>

<div data-levels="ug" markdown="1">
Continuous authentication closes the gap that every login-time check leaves open, and keystroke timing is among the cheapest signals available: no sensors, no cameras, and no change to how people work. Anonymizing the features (timings only, no key identities) means the stored model cannot leak what the user typed, and one-class training means the system can be deployed for one person without collecting anyone else's data. The trust model turns noisy per-block decisions into a lock-out policy that a designer can tune with a handful of parameters.
</div>

<div data-levels="grad res" markdown="1">
The design separates three choices that are often entangled in keystroke biometrics: the feature set (anonymous five-interval timing), the novelty detector (one-class SVMs with two kernel scales), and the decision policy (a weighted trust model with a lock-out threshold). That separation makes each piece replaceable and lets the system sit beside other continuous modalities, such as mouse dynamics, in a multi-modal scheme. The evaluation is preliminary by the authors' own account (20 users, one collection session each, knowledge of being recorded), and the authors list attacks on Spy Hunter itself, a browser-extension deployment, and different keyboards as next steps. Later work from the lab, *A Statistical Approach for Keystroke Continuous Authentication Subversion* (IEEE Access, 2026), studies synthetic forgery of keystroke timing.
</div>

<div data-levels="res" markdown="1">
## Notes from building this page

- **Table I is a keystroke sequence.** DD − UD of each row equals the previous row's hold time to 0.1 ms, so the six rows are consecutive keystrokes and seven press and release times can be rebuilt. The engine reproduces all 30 values (28 exactly; row 2's UD and UU differ by 0.1 ms, the printed rounding).
- **The outlier filter as stated keeps one of six Table I rows.** Removing every row with any timing below 96 ms or above 825 ms drops rows 1, 2, 4, 5, and 6. The paper reports keeping 1,039 to 2,724 of 4,000 rows per user, so the filter may have applied to a subset of the features or to different bounds. The page applies it to all five, as written, and offers a switch.
- **The trust equation and its description disagree.** The printed equation assigns the reward to *w*₃ and the smallest penalty to *w*₄, and writes "≥ 0" where the text says a classifier's flag rate is zero or non-zero; read literally, its third case would fire on every block that reaches it. The page follows the text and the stated weights: rule (c) subtracts 0.03 · avg, and rule (d) adds 2 · (1 − avg).
- **ν is not reported, and the library default cannot give FRR 2 percent.** With scikit-learn's default ν = 0.5, each classifier flags about half of a genuine user's rows, so a six-key block reaches four flags (rule (b)) with probability 22/64 ≈ 0.34 per classifier under independence. On 20 simulated typists with the paper's filter and settings, ν = 0.5 rejected the genuine user in 76 of 100 trials. The page uses ν = 0.25, its own choice; the published FRR implies a smaller effective outlier fraction or a different decision rule.
- **Trial counts behind the arXiv tables.** Every "average number of blocks" in Tables 1 and 2, multiplied by 380, gives a whole number (834, 1,014, 1,167, 1,130; 693, 865, 933, 978), consistent with 20 × 19 impostor pairs. Every FAR and FRR in those tables is a multiple of 0.25 percent, consistent with a denominator of 400 (all ordered pairs, including each user against themselves) rather than 380 impostor pairs or 20 genuine trials. The ICMLA rates fit 39 of 1,900 impostor trials and 2 of 100 genuine trials exactly.
- **Two small inconsistencies in the counts.** The discussion gives 1.87 blocks for 30-key blocks on free typing ("about 56 keystrokes"), while Table 2 prints 1.8237 (about 55). The ICMLA paper counts attempts as "*n* times the current block number" (characters) but reports them in blocks; 12.78 blocks of six is 76.7 keystrokes, matching the abstract's "less than 80 characters".
- **Intervals are the page's addition.** The 95 percent Wilson intervals in the results demo (FAR 1.5 to 2.8 percent; FRR 0.55 to 7.0 percent) are computed here from the implied counts. With 100 genuine trials, the FRR is the less certain of the two headline numbers.
- **Solver check.** The JavaScript one-class SVM matches scikit-learn 1.9.1 `OneClassSVM` with shrinking off exactly on ρ and to within 10⁻¹² on decision values over 72 fits (12 simulated datasets × six γ values from the paper's sweep, 26,124 rows scored). With scikit-learn's default shrinking, which stops the solver along a different path, 8 of 26,124 labels differ; every one of those rows has a decision value within 0.00035 of zero, inside the solver's 0.001 tolerance.
</div>

<div data-levels="hs" markdown="1">
## Try this in class

1. Have each student type the same sentence twice into the first demo and copy their last six rows. Compare hold times across the class, find the longest, and note whether anyone's UD goes negative.
2. Pair up. One partner trains Spy Hunter, then both partners type into the third demo in turn. Record how many blocks each partner lasts before the trust score falls below 70.
3. Change the block size and λ sliders and repeat step two. Write a short paragraph on which setting you would choose for a school computer lab, and why.
</div>

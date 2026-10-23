---
title: "Private Averages for Edge Devices: Noise in Whole Numbers"
kicker: "Interactive paper · IEEE CARS 2025"
subtitle: "An interactive companion to Sajjad H. Shah and Mike Borowczak's PCU-FL, a way for many small devices to train one shared model while the server adds calibrated noise to their combined update, entirely in whole numbers."
description: "Watch fifty simulated devices send updates whose average is released with calibrated noise; step through the integer pipeline (Hamilton weights, fixed-point encoding, one decode); draw discrete Gaussian noise with the authors' own sampler; test the trust-budget gate; and read the paper's accuracy, membership-attack, and FP8 results."
share_description: "Fifty devices train one model without sharing their data, and the server adds just enough noise that no single device shows through. PCU-FL does it all in whole numbers. Try the paper's private averaging in your browser, written for five reading levels."
share_text: "Fifty devices, one shared model, and just enough noise that no single device shows through. Try PCU-FL's private averaging in your browser:"
share_image: /papers/pcu-fl-private-aggregation/share.png
share_image_alt: "Fifty simulated device updates inside a clipping circle with two overlapping clouds of noisy released averages, one with every device and one without a single device, beside the title Private Averages for Edge Devices."
date: 2026-10-19
default_level: public
level_hints:
  public: No background needed
  hs: Averages, rounding, and a little probability
  ug: Programming, vectors, and machine learning basics
  grad: Differential privacy, sensitivity, and composition
  res: Full method, reproduction, and open questions
authors:
  - name: Sajjad H. Shah
    affiliation: University of Wyoming
  - name: Mike Borowczak
    affiliation: University of Central Florida
    member: mike-borowczak
sources:
  - venue: "IEEE Cyber Awareness and Research Symposium (CARS) · 2025"
    title: "Discrete Gaussian Integer Aggregation and Trust-Budget Gating for Federated Learning in IoT-Enabled CPS"
    url: https://doi.org/10.1109/CARS67163.2025.11337755
    access: Paywalled (IEEE)
code:
  label: "PCU-FL, the authors' prototype (cybw90/PCU-FL, MIT)"
  url: https://github.com/cybw90/PCU-FL
citations:
  - cars-2025
widget:
  css:
    - /papers/pcu-fl-private-aggregation/widget.css
  js:
    - /papers/pcu-fl-private-aggregation/pcufl-engine.js
    - /papers/pcu-fl-private-aggregation/widget.js
credit: "Interactive page by the [DRACO Lab](/). The browser engine ports the aggregation arithmetic of the authors' PCU-FL repository (MIT; license on `pcufl-engine.js`) and the paper's Eq. (1) and Algorithms 2 and 3. Checked against the repository's own Python: the discrete Gaussian sampler in `noise_commit.py` (HMAC-SHA256 counter stream, 8-byte uniforms, inverse-CDF table) gives identical integers on 1,806,263 draws over 307 seeds, sizes, and widths; the repository's Hamilton weight routine, run unchanged, gives identical integer weights in 84 configurations, and the paper's largest-remainder rule matches on 200 random weight vectors. The page reproduces Table I's noise multipliers (0.0969, 0.4845, and 4.8448 against the printed 0.097, 0.484, and 4.845). The Edge-IIoT training runs behind Tables I to III do not run in a browser, and the repository does not run as released (see the researcher notes), so the accuracy and attack results are shown as printed. Device updates in the demos are simulated and labeled so. Everything runs on your device."
bibtex: |
  @inproceedings{shah2025pcufl,
    author    = {Shah, Sajjad H. and Borowczak, Mike},
    title     = {Discrete Gaussian Integer Aggregation and Trust-Budget Gating for Federated Learning in {IoT}-Enabled {CPS}},
    booktitle = {2025 Cyber Awareness and Research Symposium (CARS)},
    year      = {2025},
    pages     = {1--6},
    doi       = {10.1109/CARS67163.2025.11337755}
  }
---

<div class="lede" data-levels="public" markdown="1">
Factory sensors, medical monitors, and smart meters can learn together without sending their data anywhere. Each device improves a shared model on its own readings and sends back only a small update; a server averages the updates and sends the improved model out again. This is called federated learning. Even an update can give away something about the data behind it, so Sajjad H. Shah and Mike Borowczak add carefully measured random noise to the average, enough that no single device shows through, and do every step of that arithmetic in whole numbers. Their system, PCU-FL, also keeps a budget for each device and stops listening to devices that keep looking suspicious.
</div>

<div class="lede" data-levels="hs" markdown="1">
In federated learning, many devices each send the server a list of numbers (an update) instead of their data. PCU-FL limits how large any update can be, turns every number into a whole number by scaling and rounding, adds the updates with whole-number weights, and adds random whole-number noise before dividing once to get the average. The noise is set so that the released average looks almost the same whether or not any one device took part. The authors test it on Edge-IIoT, a data set of industrial network traffic, at four privacy levels, and measure the accuracy of the shared model and how well an attacker can tell which records were used.
</div>

<div class="lede" data-levels="ug" markdown="1">
PCU-FL is a federated learning pipeline for Internet of Things (IoT) devices in cyber-physical systems. Clients clip their updates to an ℓ₂ norm S, the server converts real aggregation weights to integers on a 1/α grid with Hamilton's largest-remainder method, encodes each update as round(γ·g), forms an exact integer weighted sum, adds discrete Gaussian noise in the integer domain, and decodes once by dividing by γ·W\_int. Noise is calibrated to the sensitivity of the normalized average (Eq. 1), and a metadata-only trust budget decides which clients may participate. On Edge-IIoT with 50 clients and a three-layer perceptron, accuracy falls from 94.6 percent without noise to 75.7 percent at ε = 1 per round.
</div>

<div class="lede" data-levels="grad" markdown="1">
The paper targets two practical pitfalls in differentially private (DP) federated averaging: calibrating noise to the sensitivity of a sum and then normalizing, which mis-scales noise for the mean, and floating-point weights and rounding that bias the aggregate. PCU-FL calibrates a discrete Gaussian to the ℓ₂ sensitivity of the normalized aggregate, Δ\*₂ = (2w\_max/W\_min)(S + √d(1/(2γ) + η\_max)), injects it into an integer sum built with Hamilton-integerized weights that add exactly to αW\_t, and decodes in one division. Client-level add/remove adjacency, an honest-but-curious server, and Rényi DP (RDP) composition at δ = 10⁻⁵ frame the evaluation (Tables I to III); ring learning-with-errors (RLWE) encryption and zero-knowledge (ZK) proofs are specified as blueprints and not used in the experiments.
</div>

<div class="lede" data-levels="res" markdown="1">
Shah and Borowczak (IEEE CARS 2025) present PCU-FL, an encoded-domain DP aggregator with Hamilton integer weights, a table-based (CDT) discrete Gaussian sampler truncated at 8σ\_int, a DP histogram for adaptive clipping, FP8 wire compression, and a longitudinal trust budget B ∈ [0, 100] gated on metadata. They report utility, clipping dynamics, and cumulative ε (Table I), FP8 interactions (Table II), and membership inference resistance (Table III) on Edge-IIoT. This page ports the aggregation arithmetic and verifies it against the authors' repository, reproduces Table I's noise multipliers, and records what the paper and code leave open: the composition behind ε\_total, the dimension and grid parameters behind Δ\*₂ = 0.036, and several differences between the published code and the paper.
</div>

## Fifty devices, one average

<div id="pf-hook" class="w-demo"></div>

<div data-levels="public" markdown="1">
Each gray dot is one device's update, simulated here as a point on a flat map so the arithmetic can be seen. The dashed circle is the size limit: any update reaching past it is shrunk back to the edge. The round colored dots are 120 averages the server could release, each with fresh noise, and the small squares are the same releases with the highlighted device left out. With **No noise**, every release sits on one point, and leaving a device out visibly moves it. Pick **ε = 1** (the strongest privacy in the paper) and the two clouds blur into one: a single release no longer reveals whether that device took part. Use **Close-up** to look at the averages themselves.
</div>

<div data-levels="hs" markdown="1">
The number ε (epsilon) is the privacy dial: smaller ε means more noise and stronger privacy. The demo always picks the device that moves the average the most, because privacy has to protect the most revealing participant. Leaving it out shifts the true average by about 0.02 to 0.03 on this map, so noise of a similar size or larger hides the shift. Compare the readout at the four settings: at ε = 50 the noise is far smaller than the shift and the clouds stay apart, at ε = 10 they overlap in part, and at ε = 1 they overlap almost completely.
</div>

<div data-levels="ug" markdown="1">
Each release runs the paper's Algorithm 3 on a two-coordinate update: clip to S = 1, Hamilton weights on α = 256 (with 50 equal clients, 44 get 5/256 and six get 6/256, so the integer weights already differ from 1/50), encode with γ = 256, add discrete Gaussian noise with σ\_int = σ\_t·γ·W\_int·Δ\*₂, and divide by γ·W\_int. The readout gives the per-coordinate noise in model units, σ\_t·Δ\*₂, against the shift caused by removing one client. Even with no noise, the released point sits a few thousandths from the + because of those unequal integer weights.
</div>

<div data-levels="grad res" markdown="1">
Adjacency is client-level add/remove, so the comparison is the release over 50 clients against the release over 49, with weights renormalized and re-integerized. Δ\*₂ here is 0.047 (w\_max = 6/256, S = 1, d = 2); the actual leave-one-out shift of the mean is well under that bound because the chosen device sits about 1.1 to 1.4 from the mean (depending on the round), not 2S. The clouds are 120 independent releases from the authors' DRBG sampler with per-release seeds; they illustrate the distributions an observer would have to tell apart, not a formal test.
</div>

## Whole numbers all the way

<div id="pf-pipeline" class="w-demo"></div>

<div data-levels="public" markdown="1">
Five devices with different amounts of data take part in one round. Devices with more data count for more, but the server works only with whole numbers, so it first splits 256 grid units among the five devices in proportion to their data. Then each update is multiplied by 256 and rounded, the rounded numbers are added with the whole-number weights, whole-number noise is added, and one division at the end returns an average. Press **New round** to see different devices and noise.
</div>

<div data-levels="hs" markdown="1">
Check the first table: the integer weights always add to exactly 256, even though each device's share of 256 (for example 0.2812 × 256 = 71.98 in the first round) is not a whole number. The second table shows why whole numbers help: the sum Y and the noise z are exact, so the only rounding happens once, at the start, and the final division undoes the scaling. Compare the last two rows to see how close the released average is to the exact one, with and without noise.
</div>

<div data-levels="ug" markdown="1">
Hamilton's rule gives each client ⌊α·w\_i⌋ and hands the remaining units to the largest remainders, ties broken by client ID, so Σw̃_i = αW\_t exactly and each w̃_i is within one unit of α·w\_i (Algorithm 3, lines 3 to 6). Encoding uses round half to even, as `torch.round` does; the integer sum cannot overflow at these sizes. Try **γ = 16**: the encoded updates become coarse and rounding alone moves the average noticeably, while the √d/(2γ) term in Δ\*₂ grows, so the noise grows too.
</div>

<div data-levels="grad res" markdown="1">
The noise seed follows the repository's pattern (SHA-256 of a round and parameter string), and the readout prints its SHA-256 commitment, the value `noise_commit.py` would log for verifiable noise. The integer noise width is σ\_int = σ\_t·γ·W\_int·Δ\*₂ as in Fig. 1 of the paper, which makes the decoded noise σ\_t·Δ\*₂ per coordinate. Here W\_t = 1 and W\_min = 1, as in the repository, so the minimum-weight policy is satisfied trivially; the paper's α ≥ 10³M\_t/W\_min guidance would call for α ≥ 5,000 with five clients, and **α = 1,000** shows how the remainders shrink as the grid gets finer.
</div>

## Drawing noise from a table

<div id="pf-sampler" class="w-demo"></div>

<div data-levels="public" markdown="1">
The noise PCU-FL adds is a random whole number, most often near zero and rarely far from it, following the familiar bell curve. The bars show 20,000 draws made exactly the way the authors' code makes them; the line is the smooth bell curve they approximate. A wider setting spreads the draws out. **Draw again** uses a new seed, and the bars barely change: the shape is the point, not any single draw.
</div>

<div data-levels="hs" markdown="1">
The sampler turns random bytes into a number between 0 and 1 and then looks it up in a table of running totals (a cumulative distribution): the first whole number whose running total passes the random value is the draw. Because every step is whole numbers and table lookups, two machines given the same seed draw exactly the same noise, which lets an auditor check it later. The readout compares the measured spread with the target width.
</div>

<div data-levels="ug" markdown="1">
`noise_commit.py` expands a 32-byte seed with HMAC-SHA256 over an 8-byte counter, reads the stream as little-endian 64-bit integers, divides by 2⁶⁴ − 1, and inverts a table of P(k) ∝ exp(−k²/(2σ²)) over −K ≤ k ≤ K with `searchsorted`. This page computes the same integers, draw for draw. The **noise-size check** below the histogram draws the decoded noise for a full model (d = 24,706 is the size of the repository's network) at the current privacy setting and compares its length with σ\_t·Δ\*₂·√d, the diagnostic the paper reports.
</div>

<div data-levels="grad res" markdown="1">
The repository truncates at K = ⌈σ·√(2 ln(2·10¹²)) + 4⌉, about 7.52σ + 4, rather than the paper's 8σ; both leave tail mass far below the stated 10⁻¹² (the paper's own bound, 2e^(−32), is 2.5 × 10⁻¹⁴). The page's table entries match numpy's to the bit in most places and within three units in the last place elsewhere (numpy's vectorized `exp` against JavaScript's `Math.exp`), which can change a draw only when a uniform lands within a few ulp of a table boundary. At strong privacy σ\_int reaches the tens of thousands (14,924 in the first demo at ε = 1), so the table has a few hundred thousand entries; an O(log K) lookup keeps sampling fast.
</div>

## A budget for suspicious devices

<div id="pf-gate" class="w-demo"></div>

<div data-levels="public" markdown="1">
Noise protects the devices from the server; the trust budget protects the shared model from bad devices. Every device starts with 100 points and loses one each round its behavior looks suspicious (judged only from information like timing and message size, never from the update itself). A device with no points left is ignored. In this simulation, five of 50 devices behave badly most of the time. Watch when the first one is finally shut out, and try a smaller starting budget.
</div>

<div data-levels="hs" markdown="1">
With 100 points and one point lost per round, even a device that looks suspicious every single round keeps taking part until round 100. The shaded band marks the paper's training runs, which lasted 30 to 100 rounds. A budget of 10 or 25 shuts offenders out much sooner, but ordinary devices that occasionally look suspicious (2 percent of rounds here) can also run out over a long run. The behavior of the devices is simulated; the paper does not report results for the gate.
</div>

<div data-levels="ug" markdown="1">
Algorithm 2 computes a metadata threat score θ\_i, decrements B[i] when θ\_i > τ, skips the client when B[i] = 0, and admits it if its policy-bound token verifies. The budget never refills in the paper's description, so it bounds each client's total number of flagged rounds rather than its rate. Weights and the W\_min check follow admission, which is why the gate changes Δ\*₂ only through w\_max and W\_t.
</div>

<div data-levels="grad res" markdown="1">
The **Repository** rule follows `pcu_algo.py`, which checks the budget before decrementing and restores half of B\_max to every exhausted client each tenth round, so offenders return after a short pause. The simulated flag probabilities (persistent offenders at 50 to 100 percent, ordinary clients at 2 percent) are this page's assumptions; the repository's own score adds fixed penalties for submission time, update size against a hard-coded 1,000 parameters, and proof length.
</div>

## What the paper measured

<div id="pf-results" class="w-demo"></div>

<div data-levels="public" markdown="1">
Adding noise costs accuracy: the shared model classified network traffic correctly 94.6 percent of the time without noise, 86.8 percent with light noise, and about 75.7 percent with strong noise. In exchange, an attacker trying to tell whether a particular record was used in training goes from doing noticeably better than a coin flip to doing almost exactly as well as one. **FP8 compression** shows a separate result: shrinking each number to eight bits saves bandwidth, but combined with noise it breaks training.
</div>

<div data-levels="hs" markdown="1">
Read Table I across a row. The noise multiplier σ\_t grows as ε shrinks, by a factor of about 50 from ε = 50 to ε = 1, while accuracy drops by 11.1 points. The page recomputes the σ\_t column from the formula σ\_t = √(2 ln(1.25/δ)) / ε, and the numbers match. The strong setting also needed 100 training rounds instead of 30 or 40, which is part of the cost of privacy.
</div>

<div data-levels="ug" markdown="1">
Accuracy and AUC (area under the receiver operating characteristic curve) are for binary detection on Edge-IIoT (2,219 samples, 61 features) with an MLP of hidden sizes 128, 64, and 32, SGD at learning rate 0.01, batch size 32, and 50 heterogeneous clients. Adaptive clipping lowered S\_clip to 0.45 at ε = 1, where every update was clipped and Δ\*₂ = 0.036. The FP8 E4M3 format alone lost 8.8 points; with DP at ε = 50 and 10 it lost 15.4 and 17.4 points and failed to converge.
</div>

<div data-levels="grad res" markdown="1">
**Total privacy** compares Table I's cumulative ε with three standard rules the page computes for the same σ\_t and round counts: Rényi DP for the Gaussian mechanism with the usual conversion to (ε, δ), basic composition ε·T, and advanced composition. These comparisons are the page's analysis, not the paper's; the researcher notes discuss them.
</div>

## What the paper found

<div data-levels="public" markdown="1">
- Devices can train a shared model that classifies industrial network traffic while the server adds enough noise that no single device's contribution shows through.
- Privacy has a price in accuracy: from 94.6 percent with no noise to 75.7 percent with the strongest noise tested.
- With noise, a standard attack that tries to tell whether a record was used in training does barely better than guessing.
- Compressing each number to eight bits saves bandwidth, but not together with privacy noise.
</div>

<div data-levels="hs" markdown="1">
- At ε = 50, 10, and 1 per round, accuracy was 86.8, 75.6, and 75.7 percent, against 94.6 percent without noise.
- The membership attack's AUC fell from 0.68 without noise to 0.54, 0.52, and 0.51 with noise (0.5 is a coin flip).
- At ε = 1, the attack caught only 2 percent of training records while wrongly flagging 1 percent of others.
- FP8 cut communication four-fold but, combined with noise, dropped accuracy to 71.4 and 58.2 percent and training did not converge.
</div>

<div data-levels="ug grad res" markdown="1">
- **Utility.** Accuracy 94.6, 86.8, 75.6, and 75.7 percent and AUC 0.974, 0.886, 0.773, and 0.735 at ε = ∞, 50, 10, and 1 per round (Table I), with a plateau beyond ε ≈ 10.
- **Calibration.** A roughly 50-fold increase in σ\_t (0.097 to 4.845) cost 11.1 accuracy points; decoded noise norms matched σ\_t·Δ\*₂·√d.
- **Clipping.** Adaptive clipping set S\_clip = 2.18, 2.96, 2.71, and 0.45, clipping 16.7, 13.3, 30.0, and 100 percent of updates.
- **Membership inference.** Attack AUC 0.68 without DP and 0.51 to 0.54 with it; TPR at 1 percent FPR fell from 0.25 to between 0.02 and 0.06 (Table III).
- **FP8.** E4M3 gave 4× compression at −8.8 points alone and −15.4 to −17.4 points with DP, without convergence (Table II).
- **Scope.** The prototype aggregates in plaintext integers with deterministic SHA-256 policy tokens; RLWE encryption and ZK input validation are design blueprints.
</div>

<div data-levels="grad res" markdown="1">
<div class="pf-table-wrap">
<table class="results-table">
<caption class="w-note">Table I as printed: privacy, utility, and clipping on Edge-IIoT (δ = 10⁻⁵).</caption>
<thead><tr><th>Setting</th><th>ε / round</th><th>ε total</th><th>Accuracy</th><th>AUC</th><th>σ<sub>t</sub></th><th>Rounds</th><th>S<sub>clip</sub></th><th>Clipped</th></tr></thead>
<tbody>
<tr><td>No DP</td><td>∞</td><td>∞</td><td>94.6%</td><td>0.974</td><td>0.000</td><td>50</td><td>2.18</td><td>16.7%</td></tr>
<tr><td>Light</td><td>50</td><td>274</td><td>86.8%</td><td>0.886</td><td>0.097</td><td>30</td><td>2.96</td><td>13.3%</td></tr>
<tr><td>Moderate</td><td>10</td><td>63</td><td>75.6%</td><td>0.773</td><td>0.484</td><td>40</td><td>2.71</td><td>30.0%</td></tr>
<tr><td>Strong</td><td>1</td><td>14.2</td><td>75.7%</td><td>0.735</td><td>4.845</td><td>100</td><td>0.45</td><td>100.0%</td></tr>
</tbody>
</table>
</div>
</div>

## Why it matters

<div data-levels="public hs" markdown="1">
Industrial sensors, hospital devices, and home electronics hold data that should stay where it is, yet the models that protect those networks get better with more examples. Federated learning lets the data stay put, and calibrated noise keeps the shared updates from leaking it. Doing the arithmetic in whole numbers matters because small devices and encryption schemes both work in whole numbers; it also makes the noise checkable after the fact. Ultimately, the paper shows the price of that protection in accuracy, so a designer can choose the privacy level with the cost in view.
</div>

<div data-levels="ug" markdown="1">
Integer-domain aggregation is what lattice-based secure aggregation needs: RLWE plaintexts are integers modulo t, so a pipeline that already encodes, sums, and adds noise in integers can move behind encryption without changing its calibration. The single decode and the exact Hamilton weights remove two quiet sources of error, normalization after noise and rounding drift in the weights, and the trust budget offers a lever against repeat offenders that does not require the server to read anyone's update.
</div>

<div data-levels="grad res" markdown="1">
The contribution is a unit-consistent recipe: calibrate to the normalized aggregate, integerize weights exactly, add discrete noise in the encoded domain, and decode once, together with a statement of where FP8 compression belongs (outside the noise path). The evaluation is a single data set and model, with RLWE and ZK left as blueprints, and with privacy, round count, and clipping changing together across rows. The authors name stress tests under targeted poisoning, larger and more heterogeneous client populations, and integration of secure aggregation and lightweight ZK validation as next steps.
</div>

<div data-levels="res" markdown="1">
## Notes from building this page

- **Noise multipliers.** Table I's σ\_t equals the classical Gaussian-mechanism multiplier √(2 ln(1.25/δ))/ε at δ = 10⁻⁵ (0.0969, 0.4845, and 4.8448), which is `get_noise_multiplier` in `server_ops.py`. The classical calibration theorem behind that formula assumes ε < 1, so at ε = 10 and 50 the per-round guarantee rests on the accountant rather than on the formula.
- **Cumulative ε.** The light and moderate totals equal ε·√T to rounding (273.86 → 274 and 63.25 → 63); the strong total, 14.2, does not (ε·√T = 10.00). ε·√T is a scaling heuristic rather than a composition bound. For the same σ\_t and rounds, the Gaussian RDP accountant with the standard conversion gives about 1,869, 148, and 12.0, and basic composition gives 1,500, 400, and 100. The code that produced Table I's accounting (a `metrics_logger` module) is not in the repository, and the per-round ε\_hist = 0.1 for the clipping histogram is said to be included but cannot be separated out.
- **Δ\*₂ = 0.036 depends on unstated parameters.** Eq. (1) at S = 0.45 gives 0.036 for several combinations, for example γ = 4,096 (the repository's `config.py`) with 26 to 28 admitted clients and d ≈ 18,000 (0.0364), or γ = α = 256 (what `main.py` sets) with all 50 clients and the repository network's d = 24,706, which gives 0.0355. The paper does not state d, γ, α, or M\_t.
- **Model size.** The paper describes hidden sizes 128, 64, and 32; `main.py` builds `SimpleMLP` with two hidden layers of 128 (d = 24,706 for 61 inputs and two classes).
- **Integer noise scale in the code.** The paper sets σ\_int = σ\_t·γ·W\_int·Δ\*₂; `_aggregate_with_discrete_dp_encrypted` computes α·γ·W\_int·σ\_t·Δ\*₂. With W\_t = 1 the code's W\_int equals α, so its decoded noise is α (256) times the paper's.
- **The repository does not run as released** (commit ce7ae83): `server_ops.py` has a syntax error at line 198, `metrics_logger` is missing, `run()` returns at the end of its first round by indentation, the encrypted path decodes only the last parameter tensor, and `HEBackend.decrypt` returns residues modulo t, so negative coordinates come back near 2³¹ and are then zeroed by the overflow filter. The page therefore verifies the routines that run on their own (the sampler, the weights, the multiplier) and shows Tables I to III as printed.
- **Adaptive clipping.** The paper sets S\_clip = 0.45 at ε = 1 by the DP histogram; the repository runs adaptive clipping only for ε > 1 and uses a histogram ε of 5.0 rather than 0.1.
- **Weight grid.** With 50 equal clients and α = 256, Hamilton gives 44 weights of 5/256 and six of 6/256, a 20 percent spread that biases the decoded mean slightly toward six clients. The paper's guidance α ≥ 10³M\_t/W\_min would call for α ≥ 50,000 here; its rounding bound M\_tS/(αW\_t) is about 0.20 at α = 256, S = 1.
- **The trust budget cannot act inside the reported runs.** With B\_max = 100 and one unit per flagged round, a client is excluded no earlier than round 100, and the longest run in Table I is 100 rounds. The repository's recovery to B\_max/2 every tenth round is not in the paper. The paper reports no gating results.
- **Signal-to-noise.** Table II reports SNR of 1.1 and 1.0 under DP at ε = 50 and 10. σ\_t grows five-fold between those settings and S\_clip changes only from 2.96 to 2.71, so by Eq. (1) the decoded noise length σ\_t·Δ\*₂·√d grows about 4.6-fold; the reported SNR must use a definition the paper does not give.
- **Rows differ in more than ε.** Rounds (30, 40, 100) and clipping (S\_clip from 0.45 to 2.96) change with the privacy level, so the plateau between ε = 10 and ε = 1 mixes the effects of noise, training length, and clipping.
</div>

<div data-levels="hs" markdown="1">
## Try this in class

1. Five students each pick a secret number from 1 to 10. Compute the class average, then the average without one student, and find whose absence changes it most. Discuss how large random noise would need to be to hide that change.
2. Split 256 points among five groups with 31, 74, 120, 9, and 66 members using the first demo's rule: round each share down, then give the leftover points to the groups with the largest remainders. Check that the total is exactly 256.
3. In the first demo, record the readout's average distance from the true average at ε = 50, 10, and 1. Explain why a smaller ε protects more, and connect it to the accuracy drop in the last demo.
</div>

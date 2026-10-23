---
title: "Hiding a Network's Size in Random Sub-Networks"
kicker: "Interactive paper · IEEE iSES 2022"
subtitle: "An interactive companion to Hui Hu, Jessa Gegax-Randazzo, Clay Carper, and Mike Borowczak's TP-NET, a defense that trains a neural network as a set of randomly sized sub-networks so that a chip's power draw no longer gives away how big the network is."
description: "Compare simulated power captures of a fixed neural network and of TP-NET, count the work each model does with the paper's power equations, run the paper's nearest-neighbor attack against both in your browser, and train both models on the Pima diabetes table to see what the defense costs in accuracy."
share_description: "A chip's power draw can reveal how big a neural network is while it trains. TP-NET hides the size by training randomly sized sub-networks in a random order. Run the attack against it in your browser, written for five reading levels."
share_text: "A chip's power draw can reveal a neural network's size. TP-NET trains random sub-networks to hide it. Try the attack in your browser:"
share_image: /papers/tp-net-privacy/share.png
share_image_alt: "Three simulated power captures each of a traditional network with eight and with ten nodes per layer, lying on top of one another, beside three captures each of TP-NET that spread apart, next to the title Hiding a Network's Size in Random Sub-Networks."
date: 2026-10-19
topics: ["Hardware security", "AI & machine learning"]
default_level: public
level_hints:
  public: No background needed
  hs: Averages, counting, and a little algebra
  ug: Programming, digital logic, and an introduction to neural networks
  grad: Statistics, side-channel analysis, and classifier evaluation
  res: Full method, reproduction, and open questions
authors:
  - name: Hui Hu
    affiliation: University of Wyoming
  - name: Jessa Gegax-Randazzo
    affiliation: University of Wyoming
  - name: Clay Carper
    affiliation: University of Wyoming
  - name: Mike Borowczak
    affiliation: University of Wyoming
    member: mike-borowczak
sources:
  - venue: "IEEE iSES 2022 · pp. 439–444"
    title: "TP-NET: Training Privacy-Preserving Deep Neural Networks under Side-Channel Power Attacks"
    url: https://doi.org/10.1109/iSES54909.2022.00095
    access: Paywalled (IEEE)
code:
  label: "No public code or traces; this page's engine (tpnet-engine.js)"
  url: https://github.com/ucf-draco-lab/draco-website/blob/main/papers/tp-net-privacy/tpnet-engine.js
citations:
  - ises-2022
widget:
  css:
    - /papers/tp-net-privacy/widget.css
  js:
    - /papers/tp-net-privacy/tpnet-engine.js
    - /papers/tp-net-privacy/widget.js
credit: "Interactive page by the [DRACO Lab](/). The paper's ChipWhisperer traces and code are not public, so every power trace on this page comes from a simulated microcontroller (the leakage model of the lab's [Stealing a Model's Settings](/papers/stealing-ml-parameters/) page) and is labeled simulated. The network matches an independent NumPy port on 120 of 120 test runs (same held-out accuracy, outputs within 4 × 10⁻¹⁶); the attack's predictions match scikit-learn's k-nearest-neighbor classifier on 800 of 800 captures; the weight-count distributions match a brute-force enumeration. From the paper, the page reproduces the 713-row, six-feature Diabetes table, the seven Table III structures, and 17 of the 18 percentage changes printed in Tables IV to VII. Everything runs on your device."
bibtex: |
  @inproceedings{hu2022tpnet,
    author    = {Hu, Hui and Gegax-Randazzo, Jessa and Carper, Clay and Borowczak, Mike},
    title     = {{TP-NET}: Training Privacy-Preserving Deep Neural Networks under Side-Channel Power Attacks},
    booktitle = {2022 IEEE International Symposium on Smart Electronic Systems (iSES)},
    pages     = {439--444},
    year      = {2022},
    doi       = {10.1109/iSES54909.2022.00095}
  }
---

<div class="lede" data-levels="public" markdown="1">
A small chip that trains a neural network draws power in a pattern, and a bigger network draws a longer pattern. An attacker with a cheap probe can record that pattern and work out how big the network is, which is a first step toward copying it. Hui Hu, Jessa Gegax-Randazzo, Clay Carper, and Mike Borowczak proposed TP-NET, a defense that splits the network into smaller sub-networks of random sizes and trains them in a random order. The pattern stops matching the network's real size. In their tests, an attack that told two network sizes apart 98 to 100 percent of the time fell to between 41 and 62 percent against TP-NET, while the network's accuracy on a diabetes data set changed by less than one percent.
</div>

<div class="lede" data-levels="hs" markdown="1">
A neural network is a stack of layers of "nodes," and every connection between two nodes costs the chip one multiplication each time the network studies an example. A network with 8 nodes in each of its two hidden layers does 120 of those multiplications per example; one with 10 nodes does 170. A power trace shows that difference plainly. TP-NET keeps the number of nodes, m, as a ceiling and builds two sub-networks whose layer sizes are picked at random between 2 and m, so the work done per example changes from model to model. This page simulates the traces, counts the work, and runs the attack against both kinds of network.
</div>

<div class="lede" data-levels="ug" markdown="1">
The paper defends against a profiled power side-channel attack that recovers a neural network's hidden-layer width from traces captured during training. TP-NET (Algorithm 1) replaces a network with m nodes per hidden layer by r sub-networks whose widths z₁ and z₂ are drawn uniformly from 2 to m, trains them in a random order, and predicts with the sub-network that scores best on the training rows. On a ChipWhisperer-Lite with an XMEGA target, k-nearest-neighbor (k-NN) classification of 5,000-point traces separates 8, 10, and 14 nodes at 98.5 to 100 percent for a fixed network and at 40.6 to 61.9 percent for TP-NET, with r = 2.
</div>

<div class="lede" data-levels="grad" markdown="1">
Hu, Gegax-Randazzo, Carper, and Borowczak randomize the structure of a two-hidden-layer network to defeat width inference from training-time power traces. With r = 2 sub-networks and seven random structures per width (Table III), a Euclidean k-NN trained on 1,600 labeled captures of each of structures 1 to 5 labels 600 captures of structure 6 or 7; accuracy falls from 0.9850 to 1.0000 for fixed networks to 0.4063 to 0.6193 (Tables V to VII). Classification accuracy changes by +0.72 to −0.98 percent on Diabetes and by −1.35 to −9.24 percent on COMPAS (Table IV). Eq. 4 to 11 model training power as a sum of atomic-operation counts. This page rebuilds the models, the counts, and the attack, and simulates the hardware.
</div>

<div class="lede" data-levels="res" markdown="1">
TP-NET (iSES 2022) evaluates structural randomization against the width-inference attack the same lab reported at ISVLSI 2021: r = 2 sub-networks with widths uniform on [2, m] (Algorithm 1, Table III), a random training order, and best-on-training-set prediction (Eq. 2). Results are k-NN (Euclidean, k = 3 and 6) accuracies on CW-Lite traces of an XMEGA target for three width pairs (Tables V to VII) and classification accuracy on Diabetes and COMPAS (Table IV). Neither traces nor code are public. This page reproduces the data preparation, Table III, and the printed percentage changes; verifies its network and classifier against NumPy and scikit-learn; replaces the hardware with a stated leakage model; computes the Bayes limit implied by the paper's own Eq. 11; and records what the reproduction says about the evaluation protocol.
</div>

## Same network, same pattern

<div id="tp-trace" class="w-demo"></div>

<div data-levels="public" markdown="1">
Each line is a simulated recording of the chip's power, smoothed, while a network studies one example. Start with **Traditional network**: the three recordings of the 8-node network lie on top of one another, and so do the three of the 10-node network, which runs longer. Now choose **TP-NET**. Each recording trains two smaller networks of random sizes, one after the other, and the lines no longer agree with one another or with the network's true size.
</div>

<div data-levels="hs" markdown="1">
The scope takes 5,000 samples per recording, as in the paper, and each sample here averages four clock cycles. Read the text under the chart: for TP-NET it lists each sub-network's two layer sizes in the order they trained. Press **New captures** a few times and notice that a TP-NET model with a ceiling of 8 nodes sometimes does more work than one with a ceiling of 10.
</div>

<div data-levels="ug grad res" markdown="1">
The simulated chip runs each training step in single-precision floating point: every multiply, add, exponential, and divide costs a fixed number of cycles and draws a base power for its class plus 0.012 units per set bit of its float32 result, with cycle noise, measurement noise, a start offset of up to 200 cycles, and small gain and baseline drift between captures. One capture is one training step on one random row, for the network or for each sub-network in a fresh random order. These choices are the page's own; the paper does not say how much training each capture covered. **Table III structures** draws each capture from the paper's seven structures; **Fresh each capture** runs Algorithm 1 again for every capture.
</div>

## Counting the work

<div id="tp-count" class="w-demo"></div>

<div data-levels="public" markdown="1">
Most of a network's work is multiplication, one for every connection. A traditional network always does the same amount, so its size shows. The two curves show how much work TP-NET does over every possible pair of random sub-networks: the ranges for the two ceilings overlap, so an amount of work in the middle could come from either one.
</div>

<div data-levels="hs" markdown="1">
The work per example for one sub-network is 6 × z₁ + z₁ × z₂ + z₂ multiplications: six inputs to each first-layer node, every first-layer node to every second-layer node, and every second-layer node to the output. The dots mark the seven structures the paper tested. Look at structure 6 for 8 against 10 nodes: 144 multiplications against 143, nearly the same amount of work from two different models.
</div>

<div data-levels="ug" markdown="1">
Eq. 4 counts the forward pass of sub-network Nᵢ as z₁d + z₂z₁ + z₂ multiplications, z₁ + z₂ additions, and z₁ + z₂ + 1 activations; Eq. 6 to 8 update the same number of weights during backpropagation, so the weight count drives both phases, and Eq. 11 sums over the r sub-networks. The table lists both counts for the selected structure beside the simulated chip's clock cycles for the same step. The simulated instruction stream also includes the loads, stores, and partial sums that Eq. 4 folds into its per-operation constants.
</div>

<div data-levels="grad res" markdown="1">
Equation 11 makes TP-NET's power a function of its random structure, which yields a limit the paper does not state. If every capture revealed the total weight count exactly, and widths were drawn afresh for every capture as Algorithm 1 describes, the best possible attacker would label 8 against 10 nodes correctly 66.1 percent of the time, 8 against 14 at 83.6 percent, and 10 against 14 at 72.1 percent. An attacker who could also split the trace into its two sub-networks reaches 73.4, 90.4, and 79.4 percent. Raising r with **Sub-networks** tightens both distributions around their means and raises both limits (to 69.1 and 79.8 percent for 8 against 10 at r = 3): more sub-networks average out the randomness.
</div>

## Running the attack

<div id="tp-attack" class="w-demo"></div>

<div data-levels="public" markdown="1">
Pick two sizes and a victim, then press **Run the attack**. Your browser simulates recordings, labels some of them as examples, and asks a simple classifier to label the rest by finding the most similar examples and taking a vote. Against the traditional network it is right every time. Against TP-NET the answer depends on which random sub-networks the test model happens to use, and it can even be wrong every time, because a model can look more like the other size than its own.
</div>

<div data-levels="hs" markdown="1">
The paper's test works like this: the attacker studies recordings of five of TP-NET's random structures for each size, then labels recordings of a sixth or seventh structure it has never seen. Structure 6 of the 8-node model does nearly the same work as structure 6 of the 10-node model, and each sits closer to the other size's training examples, so the attack scores below a coin flip. The paper saw the same: 41 percent on that pair.
</div>

<div data-levels="ug" markdown="1">
Each run simulates labeled captures of each structure (or of each fixed network), three quarters as many unlabeled captures per width, and labels the unlabeled ones by majority vote of their *k* nearest labeled captures in Euclidean distance over all 5,000 points. In the simulation, the fixed networks separate perfectly, and a held-out TP-NET structure is labeled almost all right or almost all wrong depending on which labeled structures it resembles. **Fresh structures** follows Algorithm 1 for every capture instead, so the attacker never sees the test structure; accuracy then lands between chance and the counting limit of the previous demo.
</div>

<div data-levels="grad res" markdown="1">
The simulated chip is quieter than real hardware, so held-out structures resolve to all or nothing at default noise. At 16 times the default noise, the page's 8-against-10 structure 6 lands at 41.7 and 43.8 percent (k = 3 and 6), beside the paper's 40.6 and 40.8 percent, while the fixed networks still score 85.0 and 82.9 percent. The agreement is suggestive only; the simulation's noise level is a free parameter. Under fresh structures, the default-noise simulation gives 53 to 63 percent for 8 against 10, 82 to 83 percent for 8 against 14, and 67 to 69 percent for 10 against 14 (60 to 61, 81 to 83, and 69 to 70 percent at the paper's sample sizes), the same ordering as the counting limits and the same trend as the paper's Observation 2: the further apart the widths, the more the traces give away.
</div>

## What the defense costs

<div id="tp-accuracy" class="w-demo"></div>

<div data-levels="public" markdown="1">
A defense is useful only if the model still works. Press **Train both models** to train a traditional network and TP-NET's seven structures on a well-known medical data set, which predicts whether a patient has diabetes from measurements such as blood glucose and age. The paper found that TP-NET lost at most about one percentage point on this data set. Your browser's result changes with every run; the dotted line shows what a model scores by answering "not diabetic" every time.
</div>

<div data-levels="hs" markdown="1">
The chip stores each measurement in one byte (0 to 255), so the authors kept six of the eight measurements and 713 of the 768 patients; this page does the same. TP-NET trains both sub-networks and keeps whichever one scores better on the training rows. Each bar is the accuracy on 143 patients the models never trained on.
</div>

<div data-levels="ug" markdown="1">
The paper gives the architecture (sigmoid activations, a fixed bias of 0.75 on each hidden node, learning rate 0.025) but not the input scaling, initialization, epoch count, or train and test split. The page uses uniform initial weights on ±0.5, squared error, a sequential 80/20 split (570 and 143 rows), and epochs of ten random rows. With bytes divided by 255, every model here settles on "not diabetic" for every row (65.03 percent). Standardized inputs and 1,500 epochs give working models, and TP-NET's best sub-network then trails the traditional network by 0.4 to 2.4 percentage points.
</div>

<div data-levels="grad res" markdown="1">
Table IV's Diabetes accuracies for the traditional network (62.33 to 64.15 percent) sit at or below the majority rate of the board copy (474 of 713 rows, 66.5 percent, negative), so the reported comparison may be one between near-constant classifiers. The page's 100-start averages, in the table below, show TP-NET trailing the traditional network by about 2.4 points at 8 and 10 nodes and 0.4 points at 14 with standardized inputs, a larger cost at the two smaller widths than the paper's +0.17 to −0.98 percent. Selecting the best of r sub-networks on training accuracy partly offsets the smaller widths; in this setting, 104 of 700 TP-NET runs at m = 8 still chose a sub-network that answers "not diabetic" everywhere.
</div>

## What the paper found

<div data-levels="public" markdown="1">
- Training randomly sized sub-networks in a random order cut an attacker's success at guessing a network's size from 98 to 100 percent down to 41 to 62 percent.
- The attack still did better when the two sizes were far apart (8 against 14 nodes) than when they were close (8 against 10).
- On the diabetes data, TP-NET's accuracy changed by less than one percent; on a second data set about repeat offenses, it dropped by up to nine percent at the smallest size.
- The paper's equations show that the power used depends on the number of sub-networks, their sizes, and the cost of each basic math operation.
</div>

<div data-levels="hs" markdown="1">
- Against fixed networks, the attack separated 8 from 10 nodes 98.5 to 98.7 percent of the time, and 8 or 10 from 14 nodes at 99.8 to 100 percent.
- Against TP-NET, the same attack scored 40.6 to 43.0 percent for 8 against 10 nodes, 59.7 to 61.9 percent for 8 against 14, and 46.3 to 59.9 percent for 10 against 14.
- The paper reports every drop as a share of the fixed-network score; the smallest is 38.07 percent.
- Classification accuracy on Diabetes moved from 62.57 to 62.68 percent at 8 nodes, 64.15 to 64.61 at 10, and 62.33 to 61.72 at 14.
</div>

<div data-levels="ug grad res" markdown="1">
- **Fixed structure leaks.** k-NN separates two traditional networks at 0.9850 to 1.0000 for every width pair and both values of k.
- **Random structure hides most of it.** Against TP-NET (r = 2), accuracy falls to 0.4063 to 0.4300 (8 against 10), 0.5970 to 0.6193 (8 against 14), and 0.4630 to 0.5993 (10 against 14), relative decreases of 38.07 to 58.82 percent.
- **Width gaps still show.** Inference is easier when the two widths differ more, for both models (Observation 2), and depends on which random structure is tested (Observation 3).
- **Accuracy holds on Diabetes, less so on COMPAS.** Diabetes changes by +0.17, +0.72, and −0.98 percent; COMPAS by −9.24, −1.78, and −1.35 percent at 8, 10, and 14 nodes.
- **Power follows structure.** Eq. 11 expresses TP-NET's training power as a sum, over sub-networks, of atomic-operation counts set by each sub-network's widths.
</div>

<div data-levels="grad res" markdown="1">
<p class="w-note">Tables V to VII as printed: k-NN inference accuracy on the number of hidden nodes (Diabetes), with the printed relative change and this page's recomputation from the printed values.</p>
<div class="tp-wrap-table">
<table class="results-table">
<thead><tr><th>Widths</th><th>Model</th><th>k = 3</th><th>Change</th><th>k = 6</th><th>Change</th><th>Recomputed</th></tr></thead>
<tbody>
<tr><td>8 vs 10</td><td>Traditional</td><td>0.9867</td><td></td><td>0.9850</td><td></td><td></td></tr>
<tr><td></td><td>TP-NET, structure 6</td><td>0.4063</td><td>−58.82%</td><td>0.4080</td><td>−58.58%</td><td>−58.82%, −58.58%</td></tr>
<tr><td></td><td>TP-NET, structure 7</td><td>0.4300</td><td>−56.42%</td><td>0.4286</td><td>−56.49%</td><td>−56.42%, −56.49%</td></tr>
<tr><td>8 vs 14</td><td>Traditional</td><td>1.0000</td><td></td><td>1.0000</td><td></td><td></td></tr>
<tr><td></td><td>TP-NET, structure 6</td><td>0.6193</td><td>−38.07%</td><td>0.6163</td><td>−38.37%</td><td>−38.07%, −38.37%</td></tr>
<tr><td></td><td>TP-NET, structure 7</td><td>0.5970</td><td>−40.30%</td><td>0.6007</td><td>−39.93%</td><td>−40.30%, −39.93%</td></tr>
<tr><td>10 vs 14</td><td>Traditional</td><td>1.0000</td><td></td><td>0.9983</td><td></td><td></td></tr>
<tr><td></td><td>TP-NET, structure 6</td><td>0.5890</td><td>−41.10%</td><td>0.5993</td><td>−39.97%</td><td>−41.10%, −39.97%</td></tr>
<tr><td></td><td>TP-NET, structure 7</td><td>0.4630</td><td>−53.70%</td><td>0.4667</td><td>−53.25%</td><td>−53.70%, −53.25%</td></tr>
</tbody>
</table>
</div>

<p class="w-note">Table IV as printed: classification accuracy, with the printed relative change and this page's recomputation from the printed values.</p>
<div class="tp-wrap-table">
<table class="results-table">
<thead><tr><th>Width</th><th>Traditional, Diabetes</th><th>TP-NET, Diabetes</th><th>Recomputed</th><th>Traditional, COMPAS</th><th>TP-NET, COMPAS</th><th>Recomputed</th></tr></thead>
<tbody>
<tr><td>8</td><td>0.6257</td><td>0.6268 (+0.17%)</td><td>+0.18%</td><td>0.7644</td><td>0.6938 (−9.24%)</td><td>−9.24%</td></tr>
<tr><td>10</td><td>0.6415</td><td>0.6461 (+0.72%)</td><td>+0.72%</td><td>0.7852</td><td>0.7712 (−1.78%)</td><td>−1.78%</td></tr>
<tr><td>14</td><td>0.6233</td><td>0.6172 (−0.98%)</td><td>−0.98%</td><td>0.7720</td><td>0.7616 (−1.35%)</td><td>−1.35%</td></tr>
</tbody>
</table>
</div>
</div>

## Why it matters

<div data-levels="public hs" markdown="1">
A model running on a cheap device out in the world is physically in an attacker's hands, and knowing its size makes it easier to copy or to fool. Earlier work from the same lab showed that power traces reveal a network's size while it trains. TP-NET answers with a software-only change: the chip runs ordinary code, and randomness in the model's own structure does the hiding. Ultimately, the study shows that a defense against hardware snooping can live in how a model is built, not only in the hardware underneath it.
</div>

<div data-levels="ug" markdown="1">
Countermeasures against power analysis usually work at the circuit or instruction level: masking, hiding, clock randomization, and controlled placement and routing. Each adds hardware cost or complexity when applied to every multiply in a neural network. TP-NET moves the randomness up to the model's structure, which adds no hardware (the cost is training r sub-networks instead of one) and little loss in accuracy on the paper's main data set, and the [Stealing a Model's Settings](/papers/stealing-ml-parameters/) page shows the attack it answers. The counting demo shows the trade-off a designer tunes: the wider the range of random widths, the more the work distributions overlap.
</div>

<div data-levels="grad res" markdown="1">
The contribution is a model-level randomization defense, evaluated on hardware traces against the same profiled k-NN width attack, plus an operation-count model of training power. The evaluation covers one target, two-layer networks sized to fit an 8-bit microcontroller, r = 2, and two held-out structures per width pair. The authors name the next steps: larger networks, and the relation between inference accuracy and the number of random internal structures. The counting limit computed above gives that second question a concrete baseline: with structures drawn afresh for every capture, an attacker who measures work exactly is still bounded away from 100 percent, and the bound depends only on m, r, and the input width.
</div>

<div data-levels="res" markdown="1">
## Notes from building this page

- **The test protocol fixes the structures.** Algorithm 1 draws widths once; Table III lists seven draws per width, and the attack trains on five and tests on one. A held-out structure's label then depends on which labeled structures it resembles. Structure 6 for m = 8, (2, 7) and (8, 7), has 144 weights; structure 6 for m = 10, (6, 2) and (10, 3), has 143; each is nearer to the other width's labeled structures than to its own. In the simulation, that pair is labeled wrong 100 percent of the time at default noise and 58 percent at 16 times the noise, beside the paper's 59 percent. The paper's text, in contrast, says TP-NET "randomly generates independent sub-networks for training each time." The page's **Fresh structures** option implements that reading.
- **Below-chance accuracies.** Six of the 12 TP-NET entries in Tables V to VII sit below 0.5 on a balanced two-class task (0.4063 to 0.4667). Reporting these as accuracy reductions treats systematic mislabeling as privacy; an attacker who knew the structure-to-width relation could invert those labels. Reporting accuracy over many random structures, or the counting limit, would separate the two effects.
- **A counting limit from Eq. 11.** With widths uniform on [2, m] and r = 2, the exact distributions of total weight count give Bayes accuracies of 66.1, 83.6, and 72.1 percent for the three width pairs (73.4, 90.4, and 79.4 percent if each sub-network's count is visible). These are computed by the page, not reported in the paper, and assume work maps to power without noise.
- **Table denominators.** Every traditional-network entry equals a whole number of correct labels out of 1,200 (600 unlabeled captures per width), for example 1,184 of 1,200 for 0.9867. Ten of the 12 TP-NET entries do not (0.4063 of 1,200 is 487.6; only 0.4300 and 0.4667 fit), which fits the paper's statement that it reports average classification performance, presumably over repeated runs; the number of runs is not given.
- **Printed percentages.** All 18 arrows in Tables IV to VII are relative changes from the traditional network. Seventeen recompute exactly from the printed values; the 8-node Diabetes change computes to +0.18 percent (0.6268 against 0.6257) where the table prints +0.17 percent, possibly from unrounded accuracies.
- **Accuracy claims.** The abstract and Observation 1 describe classification accuracy as competitive; the COMPAS drop at 8 nodes is 9.24 percent, and the "at most 0.98 percent" in Observation 2 refers to Diabetes only. Table IV's Diabetes values for the traditional network (62.33 to 64.15 percent) are at or below the board copy's majority rate (66.5 percent overall; 65.03 percent of this page's 143 held-out rows).
- **Model details the page had to choose.** The paper fixes the bias of every hidden node at 0.75; the page reads that as a constant, not a learned parameter. Initialization, loss, input scaling, epochs, and split are unspecified; the page's choices are listed in the accuracy demo and in the engine. With bytes divided by 255, the page's networks collapse to the majority class in all 100 starts; standardized inputs and 1,500 epochs give 77.1, 78.1, and 78.3 percent for 8-, 10-, and 14-node traditional networks and 74.7, 75.7, and 78.0 percent for TP-NET (100 starts each).
- **Eq. 4 counts.** The multiplication term, z₁d + z₂z₁ + z₂, matches the page's instrumented forward pass exactly. The addition term counts one addition per hidden node (z₁ + z₂), while Eq. 3's sum over k inputs takes k additions per node; Eq. 11's conclusion is unchanged because the extra additions also scale with the weight count.
- **Deployment.** Step 3 keeps one sub-network for prediction, so the deployed model has a fixed structure with widths at most m. Training-time traces are protected by the randomization; whether inference-time traces of the chosen sub-network leak its own widths is outside the paper's scope and a natural question for follow-up work.
- **COMPAS.** The page omits COMPAS: the paper's reduction from 18,317 records and 40 features to 5,000 records and 13 features is not specified closely enough to reproduce.
- **Paper-scale simulation.** With the paper's sample sizes (1,600 labeled captures per network or structure, 600 unlabeled per width, 5,000 points), the default-noise simulation gives 100 percent for every traditional pair, 0 percent for 8-against-10 structure 6, 100 percent for every other fixed structure, and 60.3 / 60.6, 80.5 / 83.2, and 68.5 / 70.0 percent (k = 3 / 6) under fresh structures, each below its counting limit.
- **What the simulation can and cannot say.** The leakage model, noise, capture length (one training step), and offsets are the page's choices, carried over from the lab's ISVLSI 2021 page. The simulated tables show mechanisms and trends; they are not predictions of the real traces.
</div>

<div data-levels="hs" markdown="1">
## Try this in class

1. Use the formula 6 × z₁ + z₁ × z₂ + z₂ to count the multiplications for a network with 8 nodes in each hidden layer and for one with 10. Then build two random sub-networks for each ceiling, drawing every layer size at random from 2 up to the ceiling (a random-number app works), and count again. Record which model did more work each time.
2. In the counting demo, find the Table III structure where the two models do almost the same work. Explain why an attacker who has only studied structures 1 to 5 would label it wrong.
3. Run the attack against the traditional network, then against TP-NET structure 6 and structure 7. Record all three accuracies and write two sentences on why an accuracy far below 50 percent still tells an attacker something.
</div>

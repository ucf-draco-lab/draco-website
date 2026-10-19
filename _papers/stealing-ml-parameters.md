---
title: "Stealing a Model's Settings from Its Power Draw"
kicker: "Interactive paper · IEEE ISVLSI 2021"
subtitle: "An interactive companion to Shaya Wolf, Hui Hu, Rafer Cooley, and Mike Borowczak's side-channel attack on machine learning, which tells models and their settings apart from nothing but the power a small chip draws while it trains them."
description: "Watch simulated power traces of a microcontroller training a neural network and a ridge regression, see which operations draw the power, run the paper's nearest-neighbor attack in your browser on three tasks, and reproduce the paper's regression accuracies on the Pima diabetes table."
share_description: "A small chip training a model draws power in a pattern. The pattern gives away which model is training, and even its size. Run the paper's attack on simulated traces in your browser, written for five reading levels."
share_text: "A small chip training a model draws power in a pattern, and the pattern gives the model away. Try the attack in your browser:"
share_image: /papers/stealing-ml-parameters/share.png
share_image_alt: "Two simulated power traces over the same time window, a neural network with eight nodes per hidden layer fitting ten training examples and one with ten nodes fitting about seven, above bars for the paper's best Table I accuracy on each of three tasks, beside the title Stealing a Model's Settings from Its Power Draw."
date: 2026-10-19
topics: ["Hardware security", "AI & machine learning"]
default_level: public
level_hints:
  public: No background needed
  hs: Bits, averages, and a little algebra
  ug: Programming, digital logic, and an introduction to machine learning
  grad: Statistics, side-channel analysis, and classifier evaluation
  res: Full method, reproduction, and open questions
authors:
  - name: Shaya Wolf
    affiliation: University of Wyoming
  - name: Hui Hu
    affiliation: University of Wyoming
  - name: Rafer Cooley
    affiliation: University of Wyoming
  - name: Mike Borowczak
    affiliation: University of Wyoming
    member: mike-borowczak
sources:
  - venue: "IEEE ISVLSI 2021 · pp. 242–247"
    title: "Stealing Machine Learning Parameters via Side Channel Power Attacks"
    url: https://doi.org/10.1109/ISVLSI51109.2021.00052
    access: Paywalled (IEEE)
code:
  label: "No public code or traces; this page's engine (sidechannel-engine.js)"
  url: https://github.com/ucf-draco-lab/draco-website/blob/main/papers/stealing-ml-parameters/sidechannel-engine.js
citations:
  - "9516772"
widget:
  css:
    - /papers/stealing-ml-parameters/widget.css
  js:
    - /papers/stealing-ml-parameters/sidechannel-engine.js
    - /papers/stealing-ml-parameters/widget.js
credit: "Interactive page by the [DRACO Lab](/). The paper's ChipWhisperer traces are not public, so every power trace on this page comes from a simulated microcontroller (each operation draws a base power plus a term for the set bits of its float32 result) and is labeled simulated. The attack (k-nearest neighbors with Euclidean distance or dynamic time warping) agrees with scikit-learn and tslearn on every held-out prediction tested; the ridge regression matches scikit-learn's coefficients to nine significant digits; the neural network gives the same predictions as an independent NumPy port that uses the same random draws. On the Pima diabetes table, the page reproduces the paper's 713 board vectors and both regression accuracies exactly (72.73% at λ = 0.01 and 71.43% at λ = 100, as 112 and 110 of 154 held-out rows). Everything runs on your device."
bibtex: |
  @inproceedings{wolf2021stealing,
    author    = {Wolf, Shaya and Hu, Hui and Cooley, Rafer and Borowczak, Mike},
    title     = {Stealing Machine Learning Parameters via Side Channel Power Attacks},
    booktitle = {2021 IEEE Computer Society Annual Symposium on VLSI (ISVLSI)},
    pages     = {242--247},
    year      = {2021},
    doi       = {10.1109/ISVLSI51109.2021.00052}
  }
---

<div class="lede" data-levels="public" markdown="1">
Every chip draws a little more power for some kinds of work than for others, and an attacker with a cheap probe can record that draw as a wiggly line called a power trace. For decades, attackers have read those lines to pull secret keys out of encryption hardware. Shaya Wolf, Hui Hu, Rafer Cooley, and Mike Borowczak turned the same tools on machine learning. They trained small models on a microcontroller (a computer on a single chip, the kind inside thermostats and fitness bands), recorded its power, and asked a simple program to tell the models apart from the traces alone. It told a neural network from a linear model every time, told two network sizes apart up to 98 percent of the time, and still beat a coin flip on two models that differed in a single number.
</div>

<div class="lede" data-levels="hs" markdown="1">
A microcontroller running a program draws power in a pattern: multiplying draws more than storing a number, and numbers with more 1 bits draw slightly more than numbers with fewer. The authors loaded two kinds of machine learning model onto a small chip, trained each one on a medical data set about diabetes, and recorded 600 power traces of each model, 5,000 measurements per trace. A nearest-neighbor classifier then guessed which model produced a new trace by finding the most similar traces it had already seen. This page simulates those traces so you can watch the patterns, run the same classifier, and see where the attack works and where it struggles.
</div>

<div class="lede" data-levels="ug" markdown="1">
The paper mounts a power side-channel attack against model training on an embedded target. A ChipWhisperer-Lite records 5,000-point traces while an ATxmega128D4 trains either a two-hidden-layer neural network (8 or 10 nodes per layer) or a ridge regression (two penalty values) on the Pima diabetes table. A k-nearest-neighbor (k-NN) classifier, with Euclidean distance or dynamic time warping (DTW), then labels held-out traces in three tasks: network or regression, 8 or 10 hidden nodes, and one regression constant or the other. Accuracy falls from above 99 percent to 82 to 98 percent to 60 to 68 percent as the models grow more alike.
</div>

<div class="lede" data-levels="grad" markdown="1">
Wolf, Hu, Cooley, and Borowczak treat model inference as a side-channel classification problem: given labeled power traces of training runs drawn from a model set and hyperparameter space, classify unlabeled traces by model and setting. With 600 ChipWhisperer captures per model and an 80/20 split, k-NN (k = 3 or 5) on traces reduced to 5,000, 500, 50, or 10 points separates a neural network from ridge regression at 99.18 to 100 percent, two hidden-layer widths at 81.67 to 97.92 percent, and two ridge penalties at 59.58 to 67.92 percent (Table I). This page rebuilds the victim models, simulates their traces with a stated leakage model, and runs the attack on your device.
</div>

<div class="lede" data-levels="res" markdown="1">
Wolf, Hu, Cooley, and Borowczak (ISVLSI 2021) report k-NN classification accuracy for three model-recovery tasks on CW-Lite power traces of an ATxmega128D4 training a 6-8-8-1 or 6-10-10-1 network or a bias-free ridge regression on six byte features of the Pima diabetes table (Table I), plus a trace-similarity heatmap over 150 training vectors. Neither the traces nor the code are public. This page reproduces the data preparation (713 vectors) and the regression accuracies exactly, ports the network as described, replaces the hardware with a simulated leakage model whose assumptions are stated, verifies the classifier against scikit-learn and tslearn, and records what the reproduction says about the regression numbers, the network's accuracy, and Table I.
</div>

## A chip, listening to itself learn

<div id="sp-trace" class="w-demo"></div>

<div data-levels="public" markdown="1">
Each line is a simulated recording of the chip's power while it trains one model for one round. The neural network repeats the same pattern, marked by a dip in the moving-average line, for each training example it studies; the linear model finishes in a short burst and the chip goes quiet. Press **Task 2 pair** to stack a network with 8 nodes per layer above one with 10: the patterns look alike, but the larger network's pattern is longer, so its dips fall on a different beat (about ten in the window for 8 nodes, about seven for 10).
</div>

<div data-levels="hs" markdown="1">
The scope samples the power 5,000 times per capture, as in the paper. Each sample here averages 13 clock cycles, so one capture covers 65,000 cycles. The 8-node network needs about 67,000 cycles for its ten training examples and nearly fills the window; the 10-node network needs about 95,000, so the window shows about seven of its ten examples. **Task 3 pair** shows the hard case: the two linear models differ only in one number, λ, and their traces look the same.
</div>

<div data-levels="ug grad res" markdown="1">
The simulated chip runs the training loops in single-precision floating point. Each operation costs a fixed number of cycles (two for a load, eight for a multiply, 30 for an exponential), and each cycle draws a base power for its operation class plus 0.012 units per set bit of the operation's float32 result, a Hamming-weight leakage model. Cycle noise, measurement noise, a capture start offset of up to 200 cycles, and small gain and baseline drift between captures stand in for the real probe. These choices are the page's own; the paper's traces would differ in every detail, and the next demo shows what the model leaks and why.
</div>

## Where the power goes

<div id="sp-ops" class="w-demo"></div>

<div data-levels="public" markdown="1">
Zoom in to single clock cycles and the trace turns into a sequence of small jobs, colored by kind. A neural network spends most of its time multiplying and adding, one pair for every connection between its nodes, so a bigger network takes longer and its pattern stretches. For the linear model, press **Show λ = 8 minus λ = 10**: across the first 240 cycles, only 24 change at all, and only by a sliver.
</div>

<div data-levels="hs" markdown="1">
The height of each bar comes from two things: the kind of job (a multiply draws more than a load) and how many 1 bits the result holds. The number 8.0 stored as a float has two 1 bits; 10.0 has three. That single bit, stored six times on the matrix diagonal, plus a few low bits that change in later sums, is everything that separates the two linear models in this simulation.
</div>

<div data-levels="ug grad res" markdown="1">
The table counts operations per capture. The 10-node network performs 6,710 multiplies per epoch against 4,730 for 8 nodes (a 42 percent increase, because the hidden-to-hidden layer grows from 64 to 100 weights), so structural differences change both the length and the rhythm of the trace. The two regressions execute identical instruction streams: λ enters only as data, through the diagonal of XᵀX + λI and every value computed from it. Recovering λ is therefore a data-dependent leakage problem, the regime where classic differential power analysis needs many aligned traces.
</div>

## Running the attack

<div id="sp-knn" class="w-demo"></div>

<div data-levels="public" markdown="1">
Pick a task and press **Run the attack**. Your browser simulates captures of each model, keeps 80 percent as examples, and asks the classifier to label the other 20 percent by finding the three most similar examples and taking a vote. Task 1 and Task 2 come out nearly perfect. Task 3 lands near a coin flip, usually between 45 and 70 percent depending on the setting and the run, which matches the paper's finding that a single changed number is much harder to spot than a changed structure.
</div>

<div data-levels="hs" markdown="1">
The paper's Table I lists eight versions of the classifier for each task. "Points" is how many numbers each trace is squeezed into before comparing: 5,000 keeps every sample, 10 averages each tenth of the trace into one number. Euclidean distance compares two traces point by point; dynamic time warping (DTW) lets one trace stretch against the other before comparing, which helps when the same events happen at slightly different times. Try Task 3 at 5,000 points and then at 10: in the page's simulation, as in the paper's Euclidean rows, accuracy drops when each trace is squeezed that hard.
</div>

<div data-levels="ug" markdown="1">
Each run builds the task's traces in a background thread, reduces them by averaging equal-width bins, shuffles them with a fixed seed, and holds out 20 percent. Prediction is a uniform majority vote among the *k* nearest training traces. The table compares every Table I cell with the page's simulation at 600 captures per model. Simulated Tasks 1 and 2 separate more cleanly than the real traces did, a sign that the simulated chip is quieter and more regular than real hardware; Task 3 is the hardest task in both, and in both, Euclidean distance on long traces scores at or near the top.
</div>

<div data-levels="grad res" markdown="1">
The capture conditions decide Task 3. With the same ten training rows in every capture (**Same rows**), the only class signal is the λ-dependent Hamming weight, and Euclidean k-NN on 5,000 or 500 points reaches 79 to 80 percent in the simulation, falling to 53 to 59 percent at 50 and 10 points or under DTW, where averaging and warping blur single-sample differences. With **Fresh rows** (a new random batch per capture), data-dependent variation swamps the λ signal and every Task 3 configuration falls to 43 to 54 percent, while Tasks 1 and 2 stay at 92 to 100 percent. The paper does not say how much its training data changed between captures, and its 60 to 68 percent falls between the fresh-row results and the best same-row results.
</div>

## The models behind the traces

<div id="sp-models" class="w-demo"></div>

<div data-levels="public" markdown="1">
The models being spied on predict whether a patient in a well-known medical data set has diabetes, from measurements such as blood glucose and age. The authors report that the linear model was right 72.73 percent of the time with one setting and 71.43 percent with another. Press the λ buttons to reproduce both numbers in your browser. The neural networks were right about three quarters of the time in the paper; train one here and compare.
</div>

<div data-levels="hs" markdown="1">
Each row of the table is one patient with eight measurements and a yes-or-no answer. A chip that stores every measurement in one byte (0 to 255) cannot hold the two decimal measurements or insulin readings above 255, so the authors kept six measurements and 713 of the 768 patients. Ridge regression multiplies each measurement by a weight and adds them up; a total of 0.5 or more means "diabetic." The penalty λ pulls the weights toward zero, and a larger λ pulls harder.
</div>

<div data-levels="ug" markdown="1">
Ridge regression here is Eq. 3, β = (XᵀX + λI)⁻¹Xᵀy, with no bias term, trained on the first 80 percent of rows in file order and scored on the rest at a 0.5 threshold. The paper's two accuracies reproduce exactly, but only on the full table: all eight features and all 768 rows, 614 to train and 154 to test, give 112 and 110 correct. The six-feature board copy gives 106 of 143 (74.13 percent) at every λ from 0.01 to 100, because λ is tiny next to the byte-scale entries of XᵀX. The network demo trains the paper's 6-8-8-1 or 6-10-10-1 design with 150 epochs of ten random vectors at a learning rate of 0.025.
</div>

<div data-levels="grad res" markdown="1">
Two readings remain open for the network: input scaling (the paper sends bytes; the page divides them by 255, or standardizes them with **Standardized**) and the weight normalization (the page makes each node's incoming weights sum to one). With bytes ÷ 255, 200 random starts give a median of 65.03 percent for both widths, the share of held-out rows without diabetes (93 of 143): in 1,500 updates the network usually settles on one answer for every row (all negative in 175 and 165 of 200 runs, all positive in 10 and 18). Standardized inputs raise the mean to 67.3 and 67.7 percent and reach 72 percent or more in 43 and 47 of 200 runs (best 77.6 and 78.3 percent). The paper's approximately 75 and 72 percent therefore depend on details the text leaves out.
</div>

## What the paper found

<div data-levels="public" markdown="1">
- Power traces recorded while a small chip trained a model were enough to tell a neural network from a linear model essentially every time.
- Two neural networks that differed only in size (8 or 10 nodes per layer) were told apart up to 98 percent of the time.
- Two linear models that differed in a single starting number were told apart 60 to 68 percent of the time: hard, but better than guessing.
- Traces recorded while the network studied different examples looked different from one another, a first hint that the training data itself might leak.
</div>

<div data-levels="hs" markdown="1">
- With 600 traces per model and a nearest-neighbor classifier, the attack separated network from regression with 99.18 to 100 percent accuracy.
- It separated 8 hidden nodes from 10 with 81.67 to 97.92 percent accuracy; the best results came from squeezing each trace to 50 points.
- It separated λ = 8 from λ = 10 with 59.58 to 67.92 percent accuracy.
- The models themselves were ordinary: about 75 percent accuracy for the network and 72.73 percent for the regression on the diabetes data.
</div>

<div data-levels="ug grad res" markdown="1">
- **Model type leaks trivially.** Network against regression: 99.18 to 99.67 percent with Euclidean k-NN and 100 percent with DTW in every configuration.
- **Structure leaks strongly.** Eight against ten hidden nodes: best 97.92 percent (DTW, 50 points, k = 3) and 96.67 percent (Euclidean, 50 points); worst 87.08 and 81.67 percent at 10 points.
- **A hyperparameter leaks weakly.** Two ridge constants: best 67.92 percent (DTW, 10 points, k = 5) and 66.25 percent (Euclidean, 5,000 or 500 points); worst 59.58 percent.
- **Training data may leak.** Pairwise Euclidean distances between traces of 150 training vectors show that each vector produces a reasonably distinct trace (Fig. 5).
</div>

<div data-levels="grad res" markdown="1">
<div class="sp-wrap-table">
<table class="results-table">
<caption class="w-note">Table I as printed: k-NN classification accuracy on held-out traces.</caption>
<thead><tr><th>Method</th><th>Points</th><th>k</th><th>Task 1</th><th>Task 2</th><th>Task 3</th></tr></thead>
<tbody>
<tr><td>Euclidean</td><td>5,000</td><td>3</td><td>0.9918</td><td>0.8434</td><td>0.6625</td></tr>
<tr><td>Euclidean</td><td>500</td><td>3</td><td>0.9966</td><td>0.9000</td><td>0.6625</td></tr>
<tr><td>Euclidean</td><td>50</td><td>3</td><td>0.9967</td><td>0.9667</td><td>0.6083</td></tr>
<tr><td>Euclidean</td><td>10</td><td>3</td><td>0.9966</td><td>0.8167</td><td>0.5958</td></tr>
<tr><td>DTW</td><td>50</td><td>3</td><td>1.0</td><td>0.9792</td><td>0.6292</td></tr>
<tr><td>DTW</td><td>50</td><td>5</td><td>1.0</td><td>0.9542</td><td>0.5958</td></tr>
<tr><td>DTW</td><td>10</td><td>3</td><td>1.0</td><td>0.8708</td><td>0.6583</td></tr>
<tr><td>DTW</td><td>10</td><td>5</td><td>1.0</td><td>0.8750</td><td>0.6792</td></tr>
</tbody>
</table>
</div>

Computed by this page, beyond the paper: if each Task 3 entry counts correct labels among 240 held-out traces (20 percent of 1,200), even the lowest, 143 of 240, is above chance with a one-sided exact binomial p ≈ 0.0018 (0.014 after a Bonferroni correction for the eight configurations, which share one split and so are not independent). The highest, 163 of 240, gives p ≈ 1.5 × 10⁻⁸.
</div>

## Why it matters

<div data-levels="public hs" markdown="1">
Companies spend months building and tuning machine learning models, and a model running on a cheap device in the field is physically in an attacker's hands. Knowing a model's type and size makes it far easier to copy or to fool. This study shows that the inexpensive tools used to break encryption on small chips (the paper notes that pulling an AES key can take as little as a $35 microcontroller) also reveal how a model is built, while it is still learning. Ultimately, protecting embedded machine learning means treating a model's structure as a secret worth hiding, the way designers already treat encryption keys.
</div>

<div data-levels="ug" markdown="1">
Side-channel work has long centered on cryptographic keys, because encryption marks where secrets live. Models carry value too: their structure and hyperparameters cost data and compute to find, and attacks such as data poisoning and adversarial examples become easier when an attacker knows them. The results here suggest an ordering for defenders: structural choices (layer widths, model families) leak through timing and rhythm and need constant-time or padded execution, while numerical settings leak only through data-dependent power and call for the masking and hiding countermeasures developed for cryptography.
</div>

<div data-levels="grad res" markdown="1">
The contribution is a demonstration that profiled, nonparametric classification of raw traces recovers model family and width on a commodity target with off-the-shelf k-NN, and that a scalar hyperparameter remains above chance. The evidence is preliminary by the authors' description: one target, hand-written C models sized to fit its memory, two-class tasks, and a single train/test split. The authors outline the next steps (inferring layer counts and widths directly, separating models by bias or initial weights, and attacking widely used scikit-learn and TensorFlow models), and the lab's 2022 follow-up applied the same k-NN approach to recover the transition order of a finite state machine on a ChipWhisperer target (Carper, Robins, and Borowczak, ICCD 2022).
</div>

<div data-levels="res" markdown="1">
## Notes from building this page

- **The regression accuracies come from the full table.** Ridge regression without a bias term, trained on the first 614 of all 768 rows with all eight features and scored on the last 154 at a 0.5 threshold, gives 112 of 154 (72.73 percent) at λ = 0.01 and 110 of 154 (71.43 percent) at λ = 100, both exactly as printed. The six-feature, 713-row board copy the paper describes gives 106 of 143 (74.13 percent) at every λ from 0 to 100, and no 20 percent test set of 713 rows (143 rows) can produce 71.43 percent. The printed values therefore look computed off-board on the unfiltered table, which is this page's inference.
- **Two sets of λ values.** Section IV-A reports λ = 0.01 and 100; Task 3 says the two regressions start from the identity times 10 and times 8, and Fig. 4's caption gives λ = 8.0 and 10.0. On the full table these give 72.08 and 72.73 percent. The page uses 8 and 10 for the traces and shows all four values in the last demo.
- **The network as described stays near the majority class.** With the stated architecture, initialization, learning rate, and 150 epochs of ten vectors, the page's port reaches a median of 65.03 percent over 200 seeds for both widths (the share of negative rows); standardized inputs reach the paper's approximately 75 percent in some runs. Input scaling, the sum-to-one normalization, and the evaluation split are not specified, so this gap is a question for the authors rather than a finding.
- **Table I denominators.** Every Task 2 and Task 3 entry equals *k*/240 rounded to four places (20 percent of two models times 600 captures), except Task 2 Euclidean at 5,000 points, 0.8434, which falls between 202/240 (0.8417) and 203/240 (0.8458). The three distinct Task 1 values (0.9918, 0.9966, 0.9967) fit no single test-set size up to 3,000, so Task 1 likely used a different pool (for example, all four models) or a different split per configuration.
- **Text against table.** The abstract and conclusion say both classifiers reached 100 percent on Task 1; Table I gives 99.18 to 99.67 percent for Euclidean distance. The discussion refers to comparing a network with an SVM; the study's second model is ridge regression. The introduction mentions an ARM-based target while the methods name the ATxmega128D4-AU, an 8-bit AVR.
- **How traces were shortened.** The paper tests 5,000, 500, 50, and 10 points per trace but does not say how it reduced them. The page averages equal-width bins (piecewise aggregate approximation); keeping every *n*th sample or the first *n* samples would change the low-dimension results.
- **What the simulation can and cannot say.** The leakage model, noise levels, and capture offsets are the page's choices, so the simulated table shows mechanisms and trends rather than predictions of the real traces. Its Task 2 stays at 92 to 100 percent under both the default and the fresh-row conditions, cleaner than the paper's 81.67 to 97.92 percent, and its Task 3 depends almost entirely on whether captures repeat the same training rows (79 to 80 percent at best with the same rows, 43 to 54 percent with fresh rows). Reporting how training batches varied across captures would let readers judge which regime the paper's 60 to 68 percent reflects.
- **Majority baselines.** The board copy's held-out rows are 65.03 percent negative (93 of 143) and the full table's are 64.29 percent (99 of 154), so the reported model accuracies sit seven to ten points above always answering "not diabetic."
- **Data source.** The page ships the 768-row Pima Indians Diabetes Database as distributed through the UCI Machine Learning Repository; its six-feature filter keeps exactly the paper's 713 vectors (all 55 removed rows have insulin above 255).
</div>

<div data-levels="hs" markdown="1">
## Try this in class

1. Write 8 and 10 in binary and count the 1 bits. Then look up how a computer stores 8.0 and 10.0 as 32-bit floating-point numbers (sign, exponent, fraction) and count again. Explain why a chip might draw slightly more power storing one than the other.
2. In the first demo, choose **Task 2 pair** and count the repeating dips in each moving-average line. Use the operation table to explain why the 10-node network's repeats are farther apart.
3. In the attack demo, run Task 3 at 5,000 points and at 10 points with 300 captures per model. Record both accuracies, then explain in two sentences what information is lost when each trace is squeezed to ten numbers.
</div>

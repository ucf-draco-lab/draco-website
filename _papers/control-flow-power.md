---
title: "Same Work, Different Path: Reading Control Flow from Power"
kicker: "Interactive paper · Journal of Cybersecurity and Privacy 2023"
subtitle: "An interactive companion to Andey Robins, Stone Olguin, Jarek Brown, Clay Carper, and Mike Borowczak's study of whether a chip's power draw still reveals which way its program went when every branch does exactly the same work."
description: "Steer a two-state machine whose states run identical additions, watch where two simulated power traces part ways, compare the paper's four classifiers across eight amounts of work per state, and train all four on simulated traces in your browser."
share_description: "Two states, identical work, identical data, and the power trace still gives the path away. The paper's classifiers recovered it 99% of the time. Train the same four classifiers on simulated traces, written for five reading levels."
share_text: "Two states doing identical work, and a chip's power draw still reveals which one ran. Try the attack in your browser:"
share_image: /papers/control-flow-power/share.png
share_image_alt: "Simulated power traces of oracle bytes 77 and 69, which differ in one bit, with their control-flow code shaded and their difference below, beside the title Same Work, Different Path and the paper's headline of 99 percent path recovery on a real chip."
date: 2026-10-23
topics: ["Hardware security", "AI & machine learning"]
default_level: public
level_hints:
  public: No background needed
  hs: Bits, binary numbers, and percentages
  ug: Programming, digital logic, and an introduction to machine learning
  grad: Statistics, side-channel analysis, and classifier evaluation
  res: Full method, reproduction notes, and open questions
authors:
  - name: Andey Robins
    affiliation: University of Central Florida
    link: http://portfolio.andeyrobins.org/
  - name: Stone Olguin
    affiliation: University of Wyoming
  - name: Jarek Brown
    affiliation: University of Wyoming
  - name: Clay Carper
    affiliation: University of Wyoming
  - name: Mike Borowczak
    affiliation: University of Central Florida
    member: mike-borowczak
sources:
  - venue: "Journal of Cybersecurity and Privacy 3(3):351–363 · 2023"
    title: "Power-Based Side-Channel Attacks on Program Control Flow with Machine Learning Models"
    url: https://doi.org/10.3390/jcp3030018
    access: Open access (CC BY 4.0)
  - venue: "FigShare · 2023"
    title: "Homogenous Side Channel State Machine Transition Data"
    url: https://doi.org/10.6084/m9.figshare.23635623
    access: Open data
code:
  label: "The authors' code (GitLab, UWyo-SSC/side-channel-state-machines, GPLv3); this page's engine is cf-engine.js"
  url: https://github.com/ucf-draco-lab/draco-website/blob/main/papers/control-flow-power/cf-engine.js
citations:
  - jcp3030018
widget:
  css:
    - /papers/control-flow-power/widget.css
  js:
    - /papers/control-flow-power/cf-engine.js
    - /papers/control-flow-power/cf-ml.js
    - /papers/control-flow-power/widget.js
credit: "Interactive page by the [DRACO Lab](/). The authors' code and their 40 GB of traces could not be reached from the page's build, so every power trace here comes from a simulated microcontroller (each instruction block draws a base power plus a term for the set bits of the data it handles, with measurement noise and slight gain drift per capture) and is labeled simulated; the cycle counts, power levels, and noise are the page's choices. The firmware's control flow (Figs. 1 to 3), its operands, and the experiment's layout (256 oracle values, eight values of w, an 80/20 split) follow the paper. The page's k-nearest-neighbor classifier makes the same prediction as scikit-learn 1.9.1's on all 1,920 held-out traces tested across nine data sets, and its logistic regression on 319 of 320 (training objective within 0.02 percent); its decision tree matches scikit-learn's node count in eight of nine data sets, and its tree and forest accuracies fall within or near the spread of five scikit-learn seeds, since the two use different random draws. The paper's measured accuracies cannot be reproduced without its traces; the page shows them beside the simulation and never in place of it. Everything runs on your device."
bibtex: |
  @article{robins2023control,
    author  = {Robins, Andey and Olguin, Stone and Brown, Jarek and Carper, Clay and Borowczak, Mike},
    title   = {Power-Based Side-Channel Attacks on Program Control Flow with Machine Learning Models},
    journal = {Journal of Cybersecurity and Privacy},
    volume  = {3},
    number  = {3},
    pages   = {351--363},
    year    = {2023},
    doi     = {10.3390/jcp3030018}
  }
---

<div class="lede" data-levels="public" markdown="1">
Small chips inside thermostats, pumps, and locks follow a plan called a state machine: at each moment the chip is in one state, and its input decides which state comes next. An earlier study from the same group showed that a chip's power draw can reveal that sequence when the states do different jobs. Andey Robins, Stone Olguin, Jarek Brown, Clay Carper, and Mike Borowczak asked a harder question: what if every state does exactly the same work on exactly the same numbers? Their answer: the power draw still gave the path away, and standard machine learning recovered it 99 percent of the time.
</div>

<div class="lede" data-levels="hs" markdown="1">
A byte has eight bits, and here each bit picks the chip's next state: 0 for state one and 1 for state two. Both states run the same line of code, an addition repeated *w* times on two numbers that each hold sixteen 1s. The authors sent every byte from 0 to 255 to a ChipWhisperer-Nano (an open-source board for measuring a chip's power) 100 times each, for eight values of *w* from 1 to 128, and trained four kinds of classifiers to name the byte from its power trace. This page simulates those traces so you can see where the difference hides and train the same four classifiers yourself.
</div>

<div class="lede" data-levels="ug" markdown="1">
The paper removes the easy signal from a control-flow attack. An STM32F0 microcontroller on a ChipWhisperer-Nano runs a two-state finite state machine (FSM) whose eight steps follow the bits of an oracle byte, and both states execute `total = *x + *y` *w* times on operands of equal Hamming weight (16 ones each). Four scikit-learn classifiers (random forest, decision tree, k-nearest neighbors, and logistic regression) trained on raw traces recover the full eight-step path among 256 classes: random forest reaches 100 percent in every fold at *w* = 2, and every classifier fails at *w* = 1.
</div>

<div class="lede" data-levels="grad" markdown="1">
Robins and colleagues test whether profiled classification of raw power traces recovers an FSM's input-driven path when the states are homogeneous: identical instructions on constant-weight operands, so only the control-flow code differs. With 25,600 ChipWhisperer-Nano traces per firmware (256 oracle values × 100), stratified five-fold cross-validation, and default scikit-learn 0.24.2 classifiers, accuracy is near 100 percent for random forest and 98 percent or more for decision trees and logistic regression at *w* ≥ 2, k-NN bottoms out near 80 percent, and every classifier stays under 3 percent at *w* = 1. This page rebuilds the firmware's control flow, simulates its traces under a stated leakage model, and runs all four classifiers on your device.
</div>

<div class="lede" data-levels="res" markdown="1">
Robins, Olguin, Brown, Carper, and Borowczak (JCP 2023) extend the lab's transition recovery attack (ICCD 2022) to homogeneous state machines and four off-the-shelf classifiers, sweeping the work per state *w* over eight powers of two. Results appear as fold-level figures (Figs. 4 to 7), with a handful of values in the text. The traces are public on FigShare and the code on GitLab, but neither could be reached from this page's build. This page ports the control flow, replaces the hardware with a simulated leakage model whose assumptions are stated, verifies its classifiers against scikit-learn, and records what the printed percentages imply about the test folds, where the abstract's 97 percent may come from, and where the simulated and measured results part ways.
</div>

## The machine, the byte, and the work

<div id="cf-machine" class="w-demo"></div>

<div data-levels="public" markdown="1">
Each square is one step, and each step is one bit. A 0 puts the chip in **state one** and a 1 puts it in **state two**, but both states do the same job: they add the same two numbers together *w* times. Press **Play** to walk the eight steps. The line underneath is a simulated power recording. The pale blue stretches are the additions; the thin orange slivers are the only places where the chip decides where to go next. Move **Work per state** from 1 to 128 and watch the slivers shrink to almost nothing next to the additions.
</div>

<div data-levels="hs" markdown="1">
The chip reads the lowest bit first, then shifts the byte one place to the right, so step 1 is the rightmost bit. Byte 77 is 01001101 in binary, so the chip visits state two, then one, two, two, one, one, two, and one. A repeated bit keeps the chip in the same state, which the paper's Figure 1 draws as a loop back to itself. The two numbers being added are shown at the bottom: one is sixteen 1s followed by sixteen 0s (4,294,901,760), the other is the reverse (65,535). Both hold sixteen 1s, and their sum holds thirty-two, so the data looks the same to the power line no matter which state runs.
</div>

<div data-levels="ug grad res" markdown="1">
The simulated firmware follows Figs. 1 to 3: a dispatch block loads the oracle register, tests its low bit, and shifts it; an if/else branches to state one or state two; the state body runs `total = *x + *y` *w* times; control returns for the next bit. On a Cortex-M0, one side of an if/else takes a conditional branch (three cycles) and the other falls through and jumps over the else (one plus three), so the page gives the bit-1 path one extra cycle. That cycle, the shifted register's set bits (0.03 power units each), and nothing else separate the 256 paths. The block lengths and power levels are the page's choices; the paper shows the C source but not its timing. The readout counts the share of cycles in the states; the paper's abstract states that 97 percent of the work lies outside the control-flow structures, a figure the next sections return to.
</div>

## One bit apart

<div id="cf-diff" class="w-demo"></div>

<div data-levels="public" markdown="1">
Here the page compares two bytes that differ in a single step. The top lines are their simulated power recordings, drawn without noise; they lie almost on top of each other. The bottom line is the gap between them, and the gray band is how much a single real recording wobbles from noise. Wherever the gap pokes out of the band, a careful listener could tell the two bytes apart. Pick different steps to flip and see where the gap appears.
</div>

<div data-levels="hs" markdown="1">
Flipping one bit changes two things. While that bit is still in the chip's register, the register holds one more or one fewer 1, and moving a 1 costs a little more power than moving a 0. At the flipped step itself, the chip takes a slightly longer or shorter path to the other state, one clock tick out of hundreds, and every later moment of the recording shifts by that tick. Neither change involves the additions, which are identical in both bytes.
</div>

<div data-levels="ug grad res" markdown="1">
The difference trace isolates what the paper's classifiers must learn: a small amplitude term at every dispatch while the flipped bit remains in the register, and a one-cycle timing offset from the flipped step onward. The offset matters more than its size suggests, because shifting the fixed per-cycle pattern of every later addition by one cycle changes many samples by a little each; a classifier that weighs those samples together, or picks the few where the shift lands on a sharp edge, separates the bytes. At larger *w*, more samples carry the shift, but the share of samples carrying the register term shrinks.
</div>

## What the paper measured

<div id="cf-paper" class="w-demo"></div>

<div data-levels="public" markdown="1">
Each marker is a result the paper reports from the real chip: the share of recordings for which a classifier named the exact byte, out of 256 possibilities. With two or more additions per state, the random forest (a vote among many decision trees) was right essentially every time. With only one addition per state, every classifier failed, managing at best about 3 percent. The dashed lines are this page's simulation, which treats every amount of work alike and so does not show that drop.
</div>

<div data-levels="hs" markdown="1">
Guessing would be right 1 time in 256, about 0.39 percent, the dotted line. The k-nearest-neighbor classifier (which names a recording after the five most similar recordings it has seen) fell to about 81 percent at 16 additions per state, while the random forest stayed at 99.92 percent. The authors expected more work per state to hide the decision better; instead, the attack worked at every amount of work except the smallest.
</div>

<div data-levels="ug" markdown="1">
The paper reports per-fold accuracies in figures (Figs. 4, 6, and 7) and only a few exact values in the text; the chart plots those values and lists the stated bounds below it. Each classifier used scikit-learn 0.24.2's defaults (logistic regression with a solver and iteration cap the paper does not give) on raw, unpreprocessed traces, with 80 percent of each firmware's 25,600 traces for training and 20 percent for testing in each of five stratified folds.
</div>

<div data-levels="grad res" markdown="1">
The simulation (dashed) is one stratified 80/20 split per *w* at the paper's size, 25,600 simulated traces, with scikit-learn 1.9.1 defaults and logistic regression capped at 1,000 iterations. It reproduces the paper's central claim (identical states do not stop the attack: 93.91 to 100 percent across the four classifiers for *w* from 2 to 128) and misses two of its features: the collapse at *w* = 1, where the simulated classifiers still reach 89.34 to 98.38 percent, and k-NN's fall to about 80 percent at *w* = 16 (98.38 percent simulated). Both point to properties of the measured traces that the leakage model leaves out; the researcher notes list candidates.
</div>

## Run the attack

<div id="cf-attack" class="w-demo"></div>

<div data-levels="public" markdown="1">
Press **Run the attack**. Your browser simulates the recordings, keeps 80 percent of each byte's recordings as labeled examples, trains the four classifiers on them, and asks each to name the bytes behind the remaining 20 percent. The bars show how often each was right. Try fewer bytes or more recordings per byte and see which classifier benefits most.
</div>

<div data-levels="hs" markdown="1">
Each classifier learns in its own way. k-nearest neighbors compares a new recording with every stored one and takes a vote of the five closest. A decision tree asks a chain of yes-or-no questions such as "is sample 40 above 5.2?" A random forest grows many trees on different samples of the data and lets them vote. Logistic regression gives every sample a weight for every byte and picks the byte with the highest score. With 256 bytes and 20 recordings each, the browser trains on 4,096 recordings and tests on 1,024.
</div>

<div data-levels="ug grad res" markdown="1">
The worker builds the traces with the engine, splits each oracle value's traces 80/20 with a seeded shuffle, and runs `cf-ml.js`: k-NN with *k* = 5 and uniform votes, CART with Gini impurity grown to purity, a random forest of 30 bootstrap trees with √*p* candidate features per split (scikit-learn's default is 100 trees; the precomputed sweep uses 100), and multinomial logistic regression with an L2 penalty (*C* = 1) fitted by L-BFGS, stopped after 150 iterations, or 40 for 256 values to keep the run near a minute. Hover a result row to see the tree's node count, the forest's size, or the iterations used. The paper column fills only where the paper reports that classifier at that *w* for 256 values.
</div>

<div data-levels="grad res" markdown="1">
## How far above chance

<div id="cf-chance" class="w-demo"></div>

The paper calls the best *w* = 1 result, 3.26 percent, "far from useful," and that is fair for an attacker who needs the whole path. It is also about eight times chance. If each test fold holds 5,120 traces (20 percent of 25,600), 3.26 percent is 167 correct, and an exact binomial tail puts the probability of guessing that many at about 3 × 10<sup>−93</sup>. The *w* = 1 traces therefore still carry path information; the classifiers extract a little of it. This test is the page's, not the paper's.
</div>

## What the paper found

<div data-levels="public" markdown="1">
- A chip's power draw revealed the exact sequence of its states even when every state did the same work on the same numbers: up to 99 percent for the full eight-step sequence, out of 256 possibilities.
- The attack needed only free, standard machine learning tools with their default settings and no cleanup of the recordings.
- When each state did a single addition, the attack failed: no classifier named more than about 3 percent of sequences.
- The authors conclude that making every branch of a program do the same work is not enough to hide which branch ran, and that older defenses against power attacks need a fresh look.
</div>

<div data-levels="hs" markdown="1">
- With two additions per state, the random forest named the right byte in 100 percent of test recordings in all five rounds of testing, and the other three classifiers averaged 99 percent or more.
- From 8 to 16 additions per state, accuracy dipped for every classifier: the random forest from 100 to 99.92 percent, and k-nearest neighbors to 80.8 percent on average.
- With one addition per state, the best result was 3.26 percent.
- The data set is 5.8 GB per amount of work, about 40 GB in all, and is free to download.
</div>

<div data-levels="ug grad res" markdown="1">
- **Homogeneous states still leak.** Random forest recovers the full control flow with near 100 percent accuracy for most firmware, including 100 percent in all five folds at *w* = 2 and a 100 percent average at *w* = 8; decision trees and logistic regression average 98 percent or more.
- **k-NN is the outlier.** Its lower bound sits slightly above 80 percent for *w* ≥ 2; at *w* = 16 it averages 80.8 percent with a best fold of 81.4 percent.
- **The w = 8 to w = 16 dip.** Every classifier loses accuracy from *w* = 8 to *w* = 16 (random forest from 100 to 99.92 percent), and the conclusions attribute the general decline to the captured data rather than the models.
- **The w = 1 failure.** Every classifier stays under 3 percent (best fold 3.26 percent, k-NN); the authors conclude that off-the-shelf models struggle when each state does little work, and that the number of operations has much less influence than they hypothesized.
- **Setup.** ChipWhisperer-Nano (STM32F0, firmware 5.1.0, ChipWhisperer library 5.7.0), 256 oracle values × 100 executions per firmware, no preprocessing, stratified five-fold cross-validation with an 80/20 split, scikit-learn 0.24.2 defaults.
</div>

<div data-levels="grad res" markdown="1">
<div class="cf-wrap-table">
<table class="results-table cf-num-t">
<caption class="w-note">Section 4 as printed beside this page's simulation (one 80/20 split of 25,600 simulated traces per w, 5,120 held out, scikit-learn 1.9.1). Simulated values show the model's behavior; they are not predictions of the real traces.</caption>
<thead><tr><th>w</th><th>Classifier</th><th>Paper (chip)</th><th>Simulated</th></tr></thead>
<tbody>
<tr><td>1</td><td>k-NN</td><td>3.26% (best fold)</td><td>97.17%</td></tr>
<tr><td>1</td><td>All four</td><td>under 3%</td><td>89.34% (tree) to 98.38% (logistic regression)</td></tr>
<tr><td>2</td><td>Random forest</td><td>100% in all five folds</td><td>99.18%</td></tr>
<tr><td>2</td><td>Tree, logistic regression, k-NN</td><td>99% or more on average</td><td>93.91%, 99.49%, 99.32%</td></tr>
<tr><td>8</td><td>Random forest</td><td>100% on average</td><td>99.10%</td></tr>
<tr><td>16</td><td>Random forest</td><td>99.92% on average</td><td>99.18%</td></tr>
<tr><td>16</td><td>k-NN</td><td>80.8% on average; 81.4% best fold</td><td>98.38%</td></tr>
<tr><td>16</td><td>Tree, logistic regression</td><td>over 98% on average</td><td>93.95%, 99.79%</td></tr>
</tbody>
</table>
</div>
</div>

## Why it matters

<div data-levels="public hs" markdown="1">
A common defense against power attacks makes a device do the same amount of work no matter what secret it handles, so the power line has nothing to reveal. This study shows the limit of that idea for control flow: the work inside each branch can be identical, and the act of choosing a branch still leaves a trace. For a device whose steps drive a physical action (opening a valve, dosing a drug), the order of those steps is information worth protecting. Ultimately, designers who balance their branches also need to balance the decisions between them.
</div>

<div data-levels="ug" markdown="1">
Balancing branches (equal instruction counts, equal operand weights) is a standard software countermeasure against timing and power analysis. The paper isolates its blind spot: the dispatch code that selects a branch differs by path even when the branches match. The result builds on the lab's [transition recovery attack](/papers/fsm-transition-recovery/), where the two states ran different routines, and on its earlier [S\*FSM work](/papers/sfsm-secure-fsm/) on state encodings that equalize what a state machine's registers leak.
</div>

<div data-levels="grad res" markdown="1">
The contribution is a controlled negative result for a common assumption: homogeneity of state bodies is neither necessary nor sufficient to defeat profiled classification of control flow on a commodity Cortex-M0, given a known-input oracle and 100 traces per class. The evidence comes from one target, one two-state machine, and one acquisition setup. The authors list the next steps: more homogeneous states, variable transition counts, different state computations, more complex machines, perturbing the collection environment, determining whether a consistent time in each state is necessary, and re-evaluating historical side-channel mitigations against this attack.
</div>

<div data-levels="res" markdown="1">
## Notes from building this page

- **The printed percentages fit 5,120-trace test folds.** 3.26 percent is 167 of 5,120 (3.262 percent), 81.4 percent is 4,168 of 5,120 (81.41 percent), and a five-fold average of 99.92 percent is 25,579 or 25,580 correct of 25,600. Each fold's test set is therefore 20 percent of one firmware's 25,600 traces, consistent with the Methods.
- **Where 97 percent may come from.** The abstract's "99% accuracy even in situations where 97% of work is outside of the control flow structures" is not derived in the text. One reading counts one unit of control flow per step: *w* = 32 then puts 32 of 33 units, 96.97 percent, in the state bodies. In this page's cycle model the share reaches 92.6 percent at *w* = 32 and 96.1 percent at *w* = 64. Fig. 7 would show which firmware reached 99 percent; the page asks the authors which reading applies.
- **The w = 1 collapse is the result to explain.** The leakage that separates paths (dispatch, branch, register) does not depend on *w*, so in the simulation *w* = 1 is nearly as easy as *w* = 2 (97.17 against 99.32 percent for k-NN). Candidates for the measured collapse include the compiler treating a single addition differently (for example, folding it into the dispatch code so the two paths become identical), a capture window or trigger that misaligns very short programs, and the oracle transmission overlapping a program this short. The traces on FigShare could decide among them; the page did not test them.
- **k-NN's 80 percent and the dip from w = 8 to 16.** In the simulation, k-NN stays near the other classifiers because its independent noise is spread evenly across samples. A fall as specific as 80.8 percent at *w* = 16 suggests structure in the real traces that Euclidean distance weighs badly, such as drift between captures or a sample count that grows with *w* while the informative samples do not.
- **Total data.** 5.8 GB per firmware across eight firmware is about 46 GB; the text gives about 40 GB, which matches seven.
- **States or steps.** The text calls the target a two-state machine and also says it "transitioned through eight states"; the second sentence means eight transitions, one per oracle bit. Fig. 1 describes state one's transitions only; the page assumes state two mirrors it (a 1 stays, a 0 returns), so each bit selects its step's state, as in the ICCD 2022 firmware.
- **Undefined names.** Fig. 2's caption says `one_zero`, `zero_one`, and `dest` are discussed in Section 3.1, which defines the first two only.
- **Chance level (page computation).** The best *w* = 1 fold is about eight times chance, with a binomial tail of about 3 × 10<sup>−93</sup> under guessing, so the *w* = 1 traces still carry some path information.
- **What the simulation can and cannot say.** The cycle counts, power levels, register leak, noise, and gain drift are the page's choices; the noise level was chosen once, from a few trial values, so that k-NN and logistic regression land near the paper's 99 percent at *w* = 2, and was not tuned per *w*. The simulated trends show the mechanism (a one-cycle branch difference and a register leak suffice), not predictions of the real traces.
</div>

<div data-levels="hs" markdown="1">
## Try this in class

1. Write 77, 128, and 200 in binary. For each, list the eight states the chip visits (0 = state one, 1 = state two, reading right to left) and mark each step as "stays" or "moves." Check your lists with the first demo.
2. In the first demo, record the share of cycles spent in state work for *w* = 1, 8, and 128. Then compute *w* ÷ (*w* + 1) for the same values. Which *w* first reaches about 97 percent under each way of counting?
3. In the attack demo, run 64 bytes with 20 recordings each at *w* = 1 and at *w* = 16. Record each classifier's accuracy and the chance level. In two sentences, explain why identical work in both states did not stop the attack.
</div>

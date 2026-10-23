---
title: "Reading a State Machine from Its Power Draw"
kicker: "Interactive paper · IEEE ICCD 2022"
subtitle: "An interactive companion to Clay Carper, Andey Robins, and Mike Borowczak's transition recovery attack, which reads the order of a small chip's states from nothing but the power it draws."
description: "Flip the eight bits that steer a two-state machine and watch its simulated power trace change, see why the paper averages captures in threes, run the paper's nearest-neighbor attack on up to 256 oracle bytes in your browser, and compare a simulated version of Figure 6 with the accuracies the paper measured on a ChipWhisperer-Nano."
share_description: "Eight bits steer a small chip between two states, and its power trace gives the order away. Run the paper's nearest-neighbor attack on simulated traces in your browser, written for five reading levels."
share_text: "Eight bits steer a small chip between two states, and its power trace gives them away. Try the attack in your browser:"
share_image: /papers/fsm-transition-recovery/share.png
share_image_alt: "Two simulated power traces of a two-state machine, for oracle bytes 85 and 128, shaded by state (C for compute, S for send), beside the title Reading a State Machine from Its Power Draw and the paper's best result, the right byte of 256 in 81.02 percent of traces."
date: 2026-10-20
topics: ["Hardware security", "AI & machine learning"]
default_level: public
level_hints:
  public: No background needed
  hs: Bits, binary numbers, and averages
  ug: Programming, digital logic, and an introduction to machine learning
  grad: Statistics, side-channel analysis, and classifier evaluation
  res: Full method, reproduction notes, and open questions
authors:
  - name: Clay Carper
    affiliation: University of Wyoming
  - name: Andey Robins
    affiliation: University of Wyoming
    link: http://portfolio.andeyrobins.org/
  - name: Mike Borowczak
    affiliation: University of Wyoming
    member: mike-borowczak
sources:
  - venue: "IEEE ICCD 2022 · pp. 572–576"
    title: "Transition Recovery Attack on Embedded State Machines Using Power Analysis"
    url: https://doi.org/10.1109/ICCD56317.2022.00090
    access: Paywalled (IEEE)
code:
  label: "No public code or traces; this page's engine (fsm-engine.js)"
  url: https://github.com/ucf-draco-lab/draco-website/blob/main/papers/fsm-transition-recovery/fsm-engine.js
citations:
  - iccd-2022
widget:
  css:
    - /papers/fsm-transition-recovery/widget.css
  js:
    - /papers/fsm-transition-recovery/fsm-engine.js
    - /papers/fsm-transition-recovery/widget.js
credit: "Interactive page by the [DRACO Lab](/). The paper's ChipWhisperer-Nano traces are not public, so every power trace on this page comes from a simulated microcontroller (each instruction block draws a base power plus a term for the set bits of the oracle register, with noise and a small trigger offset per capture) and is labeled simulated; its noise level is the page's choice, set so the simulated 256-value attack lands near the paper's best accuracy. The firmware's state order (Fig. 1) and the data layout (200 traces per oracle value, three captures averaged, 80/20 split) follow the paper. The attack agrees with scikit-learn 1.9.1's KNeighborsClassifier (uniform votes, brute-force and k-d tree search) on all 30,912 held-out predictions tested across five data sets and 14 values of k. The paper's measured accuracies cannot be reproduced without its traces; the page shows them beside the simulation and never in place of it. Everything runs on your device."
bibtex: |
  @inproceedings{carper2022transition,
    author    = {Carper, Clay and Robins, Andey and Borowczak, Mike},
    title     = {Transition Recovery Attack on Embedded State Machines Using Power Analysis},
    booktitle = {2022 IEEE 40th International Conference on Computer Design (ICCD)},
    pages     = {572--576},
    year      = {2022},
    doi       = {10.1109/ICCD56317.2022.00090}
  }
---

<div class="lede" data-levels="public" markdown="1">
Many everyday devices (an infusion pump, a thermostat, a door lock) run on a simple plan called a state machine: in each moment the device is in one state, and its input decides which state comes next. Clay Carper, Andey Robins, and Mike Borowczak asked whether someone who can only measure the power a device draws could work out which states it went through, and in what order. They built a two-state machine on a small chip, steered it with eight bits, and recorded its power. A simple matching program named the exact sequence out of 256 possibilities 81 percent of the time, and told two sequences apart every time.
</div>

<div class="lede" data-levels="hs" markdown="1">
A byte has eight bits, and each bit here makes one choice: a 0 sends the chip to a state that does arithmetic, and a 1 sends it to a state that sends a character out of the chip. The authors fed every byte from 0 to 255 to a ChipWhisperer-Nano (an open-source board built for measuring a chip's power), recorded 200 power traces per byte, and trained a nearest-neighbor classifier to name the byte from a trace. This page simulates those traces so you can flip the bits, watch the trace change, and run the same classifier.
</div>

<div class="lede" data-levels="ug" markdown="1">
The paper applies power analysis to control flow rather than to data. An STM32F030 (a Cortex-M0 microcontroller) on a ChipWhisperer-Nano runs a two-state finite state machine (FSM) whose next state is the least significant bit of an 8-bit oracle; the oracle shifts right after every state, so one byte fixes an eight-step path. State one runs a fast inverse square root and state two calls `putch()`. A k-nearest-neighbor (k-NN) classifier on averaged traces recovers the full path among 256 classes with up to 81.02 percent accuracy, and separates two classes perfectly.
</div>

<div class="lede" data-levels="grad" markdown="1">
Carper, Robins, and Borowczak frame state-transition recovery as profiled classification: with a known-input oracle, label each power trace by the 8-bit input that drove a two-state FSM through eight steps, then classify unlabeled traces. Using 200 ChipWhisperer-Nano captures per oracle value, element-wise averages of three traces, an 80/20 split, and scikit-learn's uniform-vote k-NN, they report 67.58 percent at k = 11, a peak of 81.02 percent at k = 111, and 40.06 percent at k = 501 over 256 classes, plus a sweep over the first 2, 4, ..., 256 oracle values (Fig. 6). This page rebuilds the firmware's control flow, simulates its traces under a stated leakage model, and runs the attack on your device.
</div>

<div class="lede" data-levels="res" markdown="1">
Carper, Robins, and Borowczak (ICCD 2022) report k-NN accuracy for recovering the eight-step state path of a two-state FSM on an STM32F030 from ChipWhisperer-Nano power traces: an accuracy-by-k curve over all 256 oracle values (Fig. 5, Section IV-A) and a class-count by k heatmap (Fig. 6, Section IV-B). Neither the traces nor the code are public. This page ports the control flow, replaces the hardware with a simulated leakage model whose assumptions are stated, verifies the classifier against scikit-learn on every prediction tested, and records what the reported percentages imply about the data split, how the experiment's design couples class count with step position, and where the simulated and measured curves part ways.
</div>

## The machine and its byte

<div id="tr-machine" class="w-demo"></div>

<div data-levels="public" markdown="1">
Each square is one step, and each step is one bit. A 0 sends the chip to **Compute**, a burst of arithmetic; a 1 sends it to **Send**, which hands a character to the chip's serial port and then waits. Press **Play** to walk the eight steps. The line underneath is a simulated power recording: Compute draws more power in a busy pattern, Send draws less in a steady ripple, so the shading lines up with the shape of the line. Press **Mystery byte** and try to flip the steps until your shading matches the mystery recording.
</div>

<div data-levels="hs" markdown="1">
The chip reads the lowest bit first, then shifts the byte one place to the right, so step 1 is the rightmost bit of the binary number. Byte 128 is 10000000 in binary: seven 0s come first, so the chip computes seven times and sends once at the end, exactly as the paper describes. Try 85 (01010101), which alternates, and 255, which sends eight times. Every one of the 256 bytes gives a different path, so naming the path and naming the byte are the same task.
</div>

<div data-levels="ug grad res" markdown="1">
The simulated firmware follows Fig. 1: a dispatch block reads and shifts the oracle register, then branches to state one (four soft-float multiplies, one subtract, and the 0x5f3759df bit trick, since the Cortex-M0 has no floating-point unit) or state two (a UART write followed by a status-polling loop). The block lengths (228 cycles for state one and 240 for state two, plus 14 for dispatch), the power levels, and the 0.035-unit leakage per set bit of the oracle register are the page's choices; the paper describes the code, not its cycle counts. The two states take similar time here, so the attack has to use the shape of each step and the small timing drift that builds up across steps.
</div>

## Noise, and why the paper averages in threes

<div id="tr-noise" class="w-demo"></div>

<div data-levels="public" markdown="1">
A real power recording is noisy: the same byte never produces exactly the same line twice. The authors smoothed their recordings by averaging every three of them together, point by point. Switch between **Raw captures** and **Averaged in threes**: the lines bunch closer to the clean shape underneath, and the readout shows the spread shrinking by about 1.7 times.
</div>

<div data-levels="hs" markdown="1">
Averaging works because the noise is random: at any instant one capture reads a little high and another a little low, and the errors partly cancel. Averaging *n* captures shrinks random noise by the square root of *n*, so three captures cut it to about 58 percent (1 ÷ √3). The authors report two benefits: cleaner peaks (compare their Figure 3, raw, with Figure 4, averaged) and about three times less data to load.
</div>

<div data-levels="ug grad res" markdown="1">
Each simulated capture adds Gaussian noise with a standard deviation of 1.0 power units per sample, a trigger offset of zero to six cycles, and 2 percent gain drift, then averages three captures element-wise as the paper does. The paper attributes slightly better accuracy to the averaged traces than to raw ones. Averaging cannot remove what every capture shares, such as the trigger offset when it repeats, so a trace's alignment, rather than its noise, can still limit the attack after averaging.
</div>

## Running the attack

<div id="tr-attack" class="w-demo"></div>

<div data-levels="public" markdown="1">
Choose how many bytes to tell apart and press **Run the attack**. Your browser simulates the recordings, keeps 80 percent of each byte's recordings as labeled examples, and names each remaining recording by finding the *k* most similar examples and taking a vote. Two or four bytes come out nearly perfect. All 256 bytes is much harder; the round dots are the paper's results on the real chip, which peaked at 81.02 percent with 111 neighbors voting. The dashed line is this page's simulation at the paper's full size.
</div>

<div data-levels="hs" markdown="1">
Slide *k* to see how the vote size matters. With *k* = 1, one noisy example decides, and a single unlucky match gives the wrong byte. Larger *k* lets more examples vote, which steadies the answer until the vote starts pulling in examples of other bytes. Chance is 1 in the number of bytes, the dotted line: 50 percent for two, 0.39 percent for 256. The full paper-size run (256 bytes, 200 traces each) compares 10,240 traces with 40,960 others and takes minutes in a browser, so the page ships it precomputed.
</div>

<div data-levels="ug" markdown="1">
The classifier is scikit-learn's KNeighborsClassifier with uniform weights and Euclidean distance; a tie between labels goes to the lowest oracle value, as in scikit-learn. One pass sorts each held-out trace's 501 nearest training traces, so the page draws the whole accuracy-by-*k* curve at once. The bars under the chart count, for the chosen *k*, how often each step's state came out wrong. In the simulation, a wrong guess usually misses only one or two of the eight steps (1.23 on average at the paper's size and *k* = 111), so the attack recovers most of the path even when it misses the byte.
</div>

<div data-levels="grad res" markdown="1">
At the paper's size, the simulated curve rises from 17.10 percent at *k* = 1 and 31.58 percent at *k* = 11 to 64.13 percent at *k* = 111 and keeps rising, to 78.23 percent at *k* = 501. The measured curve rises faster (67.58 percent at *k* = 11), peaks at *k* = 111, and falls to 40.06 percent at *k* = 501. Independent Gaussian noise rewards large votes as long as each class's 160 training traces dominate the neighborhood; a fall as steep as the paper's needs particular oracle values whose traces resemble each other more than noise alone explains, which the simulation does not model. The **Same work in both states** firmware (not in the paper) runs both routines at every step, so only the oracle register's set bits differ: with the same noise, the simulated attack falls to 0.51 percent at *k* = 111 for 256 values (chance: 0.39 percent), against 64.13 percent for the paper's firmware.
</div>

## Fewer bytes, better odds

<div id="tr-classes" class="w-demo"></div>

<div data-levels="public" markdown="1">
Each row is a contest among a smaller set of bytes, from two at the top to all 256 at the bottom, and each column is a vote size. Stronger color means more right answers, from this page's simulation. The outlined squares are where the paper reports a result from the real chip; press one to compare. Telling two bytes apart was perfect on the chip, and the simulation comes close.
</div>

<div data-levels="hs" markdown="1">
The paper's smaller contests use the first bytes in order: 0 and 1, then 0 to 3, then 0 to 7, and so on. Byte 0 to byte 3 differ only in their first two bits, so in those contests only steps 1 and 2 change and every later step is Compute. Fewer choices and fewer changing steps both make the task easier, and the paper's accuracy falls as the number of bytes grows: 100 percent for two, up to 97.5 percent for four, and up to 87.5 percent for eight.
</div>

<div data-levels="ug grad res" markdown="1">
The simulated heatmap reuses the 256-value traces and distances, restricting both training and held-out traces to oracle values below *N*, so every row comes from the same captures. Cells where *k* exceeds the training set (320 traces for two values) are blank, as scikit-learn would refuse them. For two values the simulation misses one of 80 held-out traces at most *k* (98.75 percent, and 87.5 percent at *k* = 1) where the paper reports 100 percent at every *k*; for eight values at *k* = 21 it gives 90.94 percent against the paper's peak of 87.5 percent. Toward the right end of each row, the vote approaches the whole training set and every value ties, so accuracy falls to the lowest value's share (50 percent for two values at *k* = 320, when every training trace votes, as scikit-learn would give).
</div>

## What the paper found

<div data-levels="public" markdown="1">
- Power recordings alone revealed the order of a small chip's states: the attack named the exact eight-step order out of 256 in 81 percent of tries.
- With only two possible orders, it was right every time.
- The more possibilities it had to choose among, the lower its accuracy, but it stayed far above guessing.
- The authors conclude that devices whose state machines handle sensitive actions (their example is an internet-connected IV drip) need protection against power-based attacks, and that even the number of states a device has may be worth keeping secret.
</div>

<div data-levels="hs" markdown="1">
- Using 200 recordings per byte and a nearest-neighbor classifier, the attack named the byte (and so the full path) in 81.02 percent of held-out recordings across all 256 bytes, with 111 neighbors voting.
- Accuracy depended on the vote size: 67.58 percent with 11 neighbors and only 40.06 percent with 501.
- Among the first two bytes, the attack was perfect for every vote size; among four, it reached 97.5 percent; among eight, 87.5 percent.
- The abstract adds that sets of 32 bytes were classified above 95 percent.
</div>

<div data-levels="ug grad res" markdown="1">
- **Full path recovery.** Over 256 oracle values, accuracy rises monotonically from 67.58 percent at *k* = 11 to 81.02 percent at *k* = 111, dips to 78.73 percent at *k* = 121, reaches a local maximum of 80.12 percent at *k* = 171, and falls steadily to 40.06 percent at *k* = 501 (Fig. 5).
- **Class count.** On the first *N* oracle values, two classes give 100 percent at every *k*; four give 87.5 to 97.5 percent, constant at 97.5 percent for *k* ≥ 15; eight peak at 87.5 percent (*k* = 21 and 23); 256 reach 72.52 percent within that experiment's range of *k* (Fig. 6).
- **Averaging.** Element-wise means of three traces reduce peak noise (Figs. 3 and 4), slightly improve accuracy, and cut the data loaded by about a factor of three.
- **Tooling.** Out-of-the-box scikit-learn 1.1.2 k-NN with uniform votes, accelerated with the Intel extension for scikit-learn on a small GPU cluster; only *k* was varied.
</div>

<div data-levels="grad res" markdown="1">
<div class="tr-wrap-table">
<table class="results-table tr-num">
<caption class="w-note">Section IV as printed beside this page's simulation (200 traces per value, 40 held out per value). Simulated values are labeled; they are not predictions of the real traces.</caption>
<thead><tr><th>Oracle values</th><th>k</th><th>Paper (chip)</th><th>Simulated</th></tr></thead>
<tbody>
<tr><td>256</td><td>11</td><td>67.58%</td><td>31.58%</td></tr>
<tr><td>256</td><td>111</td><td>81.02%</td><td>64.13%</td></tr>
<tr><td>256</td><td>121</td><td>78.73%</td><td>65.72%</td></tr>
<tr><td>256</td><td>171</td><td>80.12%</td><td>68.89%</td></tr>
<tr><td>256</td><td>501</td><td>40.06%</td><td>78.23%</td></tr>
<tr><td>2</td><td>every k</td><td>100%</td><td>87.50% (k = 1) to 100%; 98.75% for most k from 11 to 171</td></tr>
<tr><td>4</td><td>k ≥ 15</td><td>97.5%</td><td>93.75% to 99.38%</td></tr>
<tr><td>8</td><td>21</td><td>87.5% (peak)</td><td>90.94%</td></tr>
<tr><td>8</td><td>23</td><td>87.5% (peak)</td><td>90.31%</td></tr>
</tbody>
</table>
</div>

Computed by this page, beyond the paper: every Section IV-A percentage equals a whole number of correct traces out of 10,240 (for example, 81.02 percent is 8,296 of 10,240), the held-out count for 40 traces per oracle value (20 percent of 200). The smallest per-value count that fits all six printed values is 20 (5,120 traces). Averaging 200 captures in separate groups of three would leave 66 traces per value and about 13 held out per value (3,380 in all at 20 percent), which fits none of them.
</div>

## Why it matters

<div data-levels="public hs" markdown="1">
Power analysis began as a way to pull secret keys out of encryption chips. This study turns it on something designers rarely think of as secret: the order of a device's own steps. For a device whose steps control a physical action, knowing the order (or even how many states there are) is the first move toward predicting or steering it. The attack needed only an open-source measurement board and a textbook classifier. Ultimately, treating control flow as information worth protecting belongs at the start of an embedded design, alongside its encryption keys.
</div>

<div data-levels="ug" markdown="1">
Classic differential power analysis targets data in registers and buses. Here the target is control flow, where different branches run different instruction streams and so draw different power over time, a leak that no amount of data masking addresses. The result connects to the lab's earlier work on side-channel-resistant FSM encodings (S\*FSM, 2012) and state encodings that trade security against power (VLSID 2019), which were evaluated in simulation; this paper measures the threat on hardware and calls for protections when FSM-controlled components handle sensitive information.
</div>

<div data-levels="grad res" markdown="1">
The contribution is a hardware demonstration that profiled, nonparametric classification of raw traces recovers an FSM's input-driven path on a commodity Cortex-M0, with a known-input oracle as the threat model. The evidence is preliminary by design: one target, one two-state machine with deliberately different state bodies, one train/test split, and no countermeasure. The authors list the next steps: 16-bit oracles, non-discrete inputs such as a potentiometer, the structure of more complex machines, counting transitions and timing them within a trace, measuring state execution time, and changing the data each state receives.
</div>

<div data-levels="res" markdown="1">
## Notes from building this page

- **The printed percentages imply 40 held-out traces per oracle value.** All six Section IV-A accuracies are exact counts over 10,240 (8,296, 6,920, 8,062, 8,204, 4,102, and 7,426 correct), and so are the four- and eight-class values (97.5 and 87.5 percent are 156 and 140 of 160, and 280 of 320). The text says 200 captures per value were averaged in threes to reduce the number of traces, which would leave about 66 per value; one reading consistent with the counts is 200 averaged traces per value (600 captures), or averaging that does not shrink the set. The page uses 200 averaged traces per value, three captures each, and asks the authors which applies.
- **The peak at k = 111 fits 160 training traces per value.** With about 53 (80 percent of 66), any vote above 53 must include other values and, above about 106, the true value can hold at most half the votes, so a curve still rising at *k* = 111 supports the larger training set.
- **Path and input are the same thing here.** The next state depends only on the input bit, never on the current state, so recovering the transition order is equivalent to recovering the oracle byte. The attack demonstrates input recovery through control flow; machines whose transitions depend on the current state would separate the two questions.
- **Class count and step position move together in Experiment 2.** The first *N* oracle values differ only in their lowest log₂ *N* bits, which are the earliest steps after the trigger, and every later step is state one. Smaller sets therefore test fewer and earlier steps, where alignment to the trigger is tightest. Drawing random subsets of the 256 values would separate the two effects.
- **The fall to 40.06 percent at k = 501.** With 160 training traces per value, a 501-vote must draw at least 341 traces from other values, but in the page's independent-noise simulation accuracy keeps rising to *k* = 501 (78.23 percent). A fall that steep suggests that some oracle values' traces cluster together, for example values that differ only in late steps if the capture window clipped the end of the program, or drift that moved late steps between captures. The paper does not report the capture length, so this is the page's hypothesis.
- **Experiment 2's 256-class maximum.** Section IV-B reports 72.52 percent for 256 classes within its range of *k*, and refers to 81.02 percent from Experiment 1 with larger *k*; the *k* grid of Fig. 6 is not stated (the text mentions *k* = 15, 21, and 23).
- **Text against results.** The discussion says it is "promising to see improved classification accuracy as the number of classes increase"; the results show accuracy falling as classes increase, so the sentence likely means increasing *k*. The abstract's "over 95% in classes with 32 elements" appears only in Fig. 6, not in the text.
- **Misses are near misses (page computation).** In the simulation at the paper's size and *k* = 111, a wrong guess gets 1.23 of eight steps wrong on average, and later steps are wrong more often (step 8 in 888 of 10,240 held-out traces, step 1 in 324), as timing drift accumulates along the trace. Reporting per-step accuracy alongside exact-byte accuracy would show how much of the path a real attacker recovers even when the byte is wrong.
- **Equal work removes most of the simulated signal (page computation).** Running both routines at every step removes the timing and shape differences between states; only the dispatch block's handling of the oracle register still varies, by 0.035 power units per set bit. At the page's noise and 200 traces per value, the attack then sits near chance: 0.31 to 0.54 percent across *k* for 256 values (chance 0.39 percent) and 40 to 65 percent for two values (chance 50 percent, on 80 held-out traces). The register leak remains in the model, so more traces or a stronger leak could still expose it; constant-weight state encodings, the property S\*FSM was designed to provide, target that residue.
- **What the simulation can and cannot say.** The cycle counts, power levels, leakage, noise, and trigger offset are the page's choices; the noise was set so the simulated 256-value accuracy lands near the paper's best. The simulated trends (perfect small sets, near misses, the effect of equal work) show mechanisms, not predictions of the real traces.
</div>

<div data-levels="hs" markdown="1">
## Try this in class

1. Write 128, 85, and 200 in binary. For each, list the eight states the chip runs, reading the bits from right to left (0 = Compute, 1 = Send). Check your lists with the first demo.
2. In the second demo, record the spread for raw captures and for averages of three. Divide one by the other and compare with √3. Predict the spread for averages of 12 captures, and explain why averaging cannot fix every kind of error.
3. In the attack demo, run four bytes, then 64 bytes, with 50 traces each and *k* = 11. Record both accuracies and the chance level for each. In two sentences, explain why more choices make the attack harder, and why it stays far above chance.
</div>

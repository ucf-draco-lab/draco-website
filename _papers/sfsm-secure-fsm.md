---
title: "S*FSM: Rebuilding State Machines So the Power Meter Reads the Same Every Tick"
kicker: "Interactive papers · BioMedCom 2012, MWSCAS 2013, ISVLSI 2014"
subtitle: "An interactive companion to Mike Borowczak and Ranga Vemuri's structurally secure finite state machines: unroll every self-loop, then give every state the same number of ones and every move the same number of bit flips, so the two power models attackers rely on stop changing."
description: "Watch a branch predictor give away its state through power, unroll its self-loops the way the 2012 paper does, search for secure codes in your browser, and measure what the protection costs on 52 MCNC benchmark machines."
share_description: "A controller's power draw can reveal which state it is in. Rebuild the machine and pick its codes so every state and every move looks the same to a power meter. Try S*FSMs in your browser, written for five reading levels."
share_text: "A controller's power draw can reveal which state it is in. S*FSMs make every state and every move look the same to a power meter. Try it in your browser:"
share_image: /papers/sfsm-secure-fsm/share.png
share_image_alt: "The two-bit branch predictor rebuilt as a six-state S*FSM, each state labeled with a four-bit code holding two ones and every transition flipping exactly two bits, beside the title S*FSM."
date: 2026-10-19
topics: ["Hardware security"]
default_level: public
level_hints:
  public: No background needed
  hs: Bits, binary numbers, and a little counting
  ug: Digital logic and state machines
  grad: Side channels, correlation, and logic synthesis
  res: Full method, reproduction, and open questions
authors:
  - name: Mike Borowczak
    affiliation: University of Cincinnati
    member: mike-borowczak
  - name: Ranga Vemuri
    affiliation: University of Cincinnati
sources:
  - venue: "ASE/IEEE BioMedCom, pp. 96–100 · 2012"
    title: "S*FSM: A Paradigm Shift for Attack Resistant FSM Designs and Encodings"
    url: https://doi.org/10.1109/BioMedCom.2012.22
    access: Paywalled (IEEE)
  - venue: "IEEE MWSCAS, pp. 553–557 · 2013"
    title: "Secure Controllers: Requirements of S*FSM"
    url: https://doi.org/10.1109/MWSCAS.2013.6674708
    access: Paywalled (IEEE)
  - venue: "IEEE ISVLSI, pp. 232–235 · 2014"
    title: "Enabling Side Channel Secure FSMs in the Presence of Low Power Requirements"
    url: https://doi.org/10.1109/ISVLSI.2014.78
    access: Paywalled (IEEE)
code:
  label: "LGSynth'91 / MCNC benchmark state machines (KISS2), as packaged in ispras/hdl-benchmarks"
  url: https://github.com/ispras/hdl-benchmarks/tree/master/lgsynth91/kiss2
citations:
  - borowczak2012s
  - borowczak2013secure
  - borowczak2014enabling
widget:
  css:
    - /papers/sfsm-secure-fsm/widget.css
  js:
    - /papers/sfsm-secure-fsm/sfsm-engine.js
    - /papers/sfsm-secure-fsm/widget.js
credit: "Interactive page by the [DRACO Lab](/). The browser engine unrolls self-loops (the 2012 Algorithm 1), computes the Hamming weight and distance readings of any encoding, and runs an exact search for the shortest code with constant weight and constant distance, including the relaxed and low-power families of the 2014 paper. It reproduces the branch predictor's Figure 2 readings and Table 1 ranges (2012), all 11 rows of the S*Opt capacity table and the averages of Tables II to V (2013), and the Figure 1 and 2 readings (2014). An independent Z3 model agrees with the browser search on all 75 shortest code lengths it settled across 22 benchmark machines. Everything runs on your device."
bibtex: |
  @inproceedings{borowczak2012sfsm,
    author    = {Borowczak, Mike and Vemuri, Ranga},
    title     = {{S*FSM}: A Paradigm Shift for Attack Resistant {FSM} Designs and Encodings},
    booktitle = {2012 ASE/IEEE International Conference on BioMedical Computing (BioMedCom)},
    pages     = {96--100},
    year      = {2012},
    doi       = {10.1109/BioMedCom.2012.22}
  }

  @inproceedings{borowczak2013secure,
    author    = {Borowczak, Mike and Vemuri, Ranga},
    title     = {Secure Controllers: Requirements of {S*FSM}},
    booktitle = {2013 IEEE 56th International Midwest Symposium on Circuits and Systems (MWSCAS)},
    pages     = {553--557},
    year      = {2013},
    doi       = {10.1109/MWSCAS.2013.6674708}
  }

  @inproceedings{borowczak2014enabling,
    author    = {Borowczak, Mike and Vemuri, Ranga},
    title     = {Enabling Side Channel Secure {FSMs} in the Presence of Low Power Requirements},
    booktitle = {2014 IEEE Computer Society Annual Symposium on VLSI (ISVLSI)},
    pages     = {232--235},
    year      = {2014},
    doi       = {10.1109/ISVLSI.2014.78}
  }
---

<div class="lede" data-levels="public" markdown="1">
Every chip has small controllers that step from one state to the next: waiting, reading, sending, done. Each state is stored as a short pattern of ones and zeros, and storing or switching those bits draws a little power. Someone watching the power from outside can often tell which step the chip is on. Mike Borowczak and Ranga Vemuri asked what it would take for every state and every step to draw the same amount, so the power meter learns nothing. Their answer has two parts: rebuild the controller so it never simply stays put, then choose patterns that all look alike. This page lets you try both.
</div>

<div class="lede" data-levels="hs" markdown="1">
A finite state machine (FSM) is a controller that is always in one of a fixed set of states and moves between them as inputs arrive. Inside a chip, the current state is a binary code held in flip-flops. Attackers model power two ways: the number of ones in the code (its Hamming weight) and the number of bits that flip on each clock tick (the Hamming distance). These three papers show that a structurally secure FSM, or S\*FSM, keeps both numbers constant. Start with the two-bit branch predictor from the 2012 paper and watch what each choice hides.
</div>

<div class="lede" data-levels="ug" markdown="1">
Power analysis correlates a Hamming model of a register, its weight HW(s) or the distance HD(sₜ, sₜ₊₁) between successive values, with measured current. Borowczak and Vemuri remove the correlation at the model instead of at the cell: if every state code has the same weight c₁ and every transition the same distance c₂, the model is constant and its correlation with any power trace is undefined. A self-loop always has distance zero, so the method first unrolls every self-loop into a pair of states (the 2012 Algorithm 1), then searches for a balanced encoding. The 2013 paper measures the cost on BenGen machines, and the 2014 paper relaxes the constraints toward low-power encodings.
</div>

<div class="lede" data-levels="grad" markdown="1">
A high-level countermeasure for finite state machines against first-order Hamming weight and Hamming distance power models. Two conditions, HW(enc(s)) = c₁ for every state and HD(enc(s), enc(δ(s, α))) = c₂ for every transition, make both models constant, so the Pearson correlation between model and power has a zero numerator and a zero denominator. Condition 2 cannot hold with self-loops, which motivates structural unrolling. The 2013 study reports, on seven BenGen machines synthesized with the SAED 90 nm library, about 72 percent more states, 77 percent more transitions, 79 percent longer codes, and 96 percent more layout area; the 2014 study reports smaller costs on 12 MCNC machines and a family of relaxed encodings that trade leakage for peak current.
</div>

<div class="lede" data-levels="res" markdown="1">
Three short papers by Borowczak and Vemuri define the S\*FSM: BioMedCom 2012 (the two conditions, Algorithm 1 for self-loop unrolling, and the branch predictor example), MWSCAS 2013 (the S\*Opt capacity analysis of Eq. 7 to 10, Table I, and a cost study on BenGen benchmarks through Design Compiler and Nanosim), and ISVLSI 2014 (the RHD relaxation, the peak-current constraints CHD and CHW, and encoding costs on MCNC benchmarks). This page ports Algorithm 1 and the encoding constraints to JavaScript, adds an exact backtracking search for the shortest constant-weight, constant-distance encoding, and runs it on all 52 LGSynth'91 (MCNC) KISS2 machines. The papers' own benchmark netlists, encodings, and synthesis results are not public; the page reproduces every number that can be recomputed from what the papers print and labels its benchmark results as its own.
</div>

## The branch predictor gives itself away

<div id="sf-predictor" class="w-demo"></div>

<div data-levels="public" markdown="1">
This controller guesses whether a program will take its next branch. Four states (strongly taken, weakly taken, weakly not taken, strongly not taken) remember the last few outcomes. Press the branch buttons and watch the two bar rows. With the ordinary **Binary** codes, a weight of two can only mean strongly taken and a weight of zero only strongly not taken, so the meter names the state about half the time. Switch to **S\*FSM** and **S\*Optimal**: every state holds two ones, every tick flips two bits, and both rows go flat.
</div>

<div data-levels="hs" markdown="1">
The original predictor needs only two bits (ST = 11, WT = 10, WNT = 01, SNT = 00), and those codes carry zero, one, or two ones. **One-hot** fixes the weight row (every code has exactly one 1), yet the flips row still drops to zero whenever the predictor stays in ST or SNT. That zero is the self-loop, and no choice of codes can remove it. The **S\*FSM** button splits each of those states into a pair (ST1 and ST2, SNT1 and SNT2) that hand the job back and forth, so even "staying put" flips bits. Then a four-bit code with two ones per state keeps both rows constant.
</div>

<div data-levels="ug" markdown="1">
The codes are the 2012 paper's: Figure 2 for the original machine and Table 1 for the unrolled one. Under minimal binary, the unrolled predictor shows weights 0 to 2 and distances 1 to 3; one-hot (six bits) and S\*Optimal (four bits) show a single weight and a single distance. Applied to the original machine, the S\*Optimal codes keep the weight constant but the distances read 0 or 2, which is the paper's point: encoding alone cannot secure an FSM with self-loops, and structure alone cannot secure one with a minimal encoding. The readout counts the states (or transitions) that share the current reading, the ambiguity an attacker faces with one noiseless sample.
</div>

<div data-levels="grad res" markdown="1">
The 2012 paper drove a high-level simulator with random transition vectors of 10 to 50,000 steps and reported the average correlation over 100 runs between each Hamming model and the state or transition (Table 2), for example 0.63 between state and weight under binary codes at 50,000 cycles. The paper does not say how a state or transition becomes a number for a Pearson correlation, so this page does not repeat that table; the researcher notes explain what the page tried. The demo reports the reading sets instead, which match Figure 2 and Table 1 exactly.
</div>

## Unrolling the self-loops

<div id="sf-unroll" class="w-demo"></div>

<div data-levels="public" markdown="1">
A state that can stay where it is causes the trouble: staying put flips no bits, and no other move looks like that. The fix copies the state. The copy, drawn with a dashed outline, takes over whenever the machine would have stayed, so the machine bounces between the two instead. Everything that left the original state now leaves the copy too, so the controller still does exactly the same job. Press **Unroll the next self-loop** and count what it costs.
</div>

<div data-levels="hs" markdown="1">
Try the three-state machine from the 2014 paper first: B can stay in B, so the method adds Bn. The machine grows from three states and four transitions to four states and six, the same counts as the paper's Figure 2. The branch predictor grows from four states to six. Each new state can raise the number of bits a binary code needs, since *n* bits can only number 2ⁿ states.
</div>

<div data-levels="ug" markdown="1">
Algorithm 1 removes each self-loop *e*(*v*, *v*, *t*), adds a state *v*′ with transitions *v* → *v*′ and *v*′ → *v* on condition *t*, and copies every outgoing transition of *v* to *v*′. Transitions into *v* stay as they were. For a KISS2 description, every product term of a looping state is duplicated, so the term count grows by the number of terms those states had. The 2013 paper's FSM 137 grew from four states and 11 transitions to seven and 20; across the 52 MCNC machines here, unrolling adds 48 percent more states and 52 percent more product terms on average.
</div>

<div data-levels="grad res" markdown="1">
Unrolling is the inverse of state minimization: it adds states that are equivalent in the automata sense, so a synthesis flow must be told not to merge them back. The MCNC benchmarks span the full range, from machines with no self-loops (DK27, DK512, EX2, EX3, MARK1, SCF, TAV) to machines where every state loops (BBARA, CSE, DONFILE, LION, MODULO12, TBK, and others), which doubles both states and terms. Rows that apply in every state (present state "\*", in KISS2 for KIRKMAN, MARK1, OPUS, and SCF) are kept as written.
</div>

## Choosing secure codes

<div id="sf-encode" class="w-demo"></div>

<div data-levels="public" markdown="1">
Now every state needs a pattern with the same number of ones, and every arrow must connect two patterns that differ in the same number of places. For the branch predictor, the six four-bit patterns with two ones fit exactly, as long as no arrow joins two opposite patterns (0101 and 1010 differ everywhere). Press **Shuffle the codes** to scramble them: the dashed arrows are moves a power meter could now tell apart. Press **Search again in your browser** to find a secure arrangement.
</div>

<div data-levels="hs" markdown="1">
Every pattern of four bits with two ones has exactly four others that differ in two places and one, its opposite, that differs in all four. The search places codes state by state and backs up whenever a move would flip the wrong number of bits. Try the other machines. LION and MC need five bits for eight states; DK15 needs seven, two more than a count of states alone would suggest, because so many of its states connect to each other.
</div>

<div data-levels="ug" markdown="1">
The search fixes a code length *n* and a weight *c*₁, requires distance *c*₂ on every transition between distinct states, and increases *n* until a code exists; at the shortest *n* it reports the smallest *c*₂. With weight fixed, every distance is even, and *c*₂ = 2 means each move swaps one 1 for one 0. **Low power: distance 2** and **Distance 4** fix *c*₂ as in the 2014 paper's Table V, and **One-hot** (*c*₁ = 1, *c*₂ = 2) always works with one bit per state. Peak current per edge, N<sub>peak</sub> = *c*₂ / 2 (2014, Eq. 5), so shorter distances also mean smaller current spikes.
</div>

<div data-levels="grad res" markdown="1">
The search is exact: it visits states in a connectivity order, fixes the first code and its first neighbor up to bit permutation, and draws candidates only from codes at distance *c*₂ from an already-placed neighbor, so a failure at length *n* is a proof that no such code exists. Across the 52 benchmarks it settled the shortest secure length for 40 machines within its budget, and an independent Z3 model of the same constraints, run on 22 of the smaller machines, agreed on all 75 shortest lengths it could settle. The papers do not describe their own encoding search; the 2014 paper cites Z3.
</div>

## How many states fit in *n* bits

<div id="sf-capacity" class="w-demo"></div>

<div data-levels="public" markdown="1">
Keeping every pattern's count of ones the same leaves fewer patterns to choose from. With six bits, binary offers 64 patterns, but only 20 have exactly three ones. Move the slider to see how many bits each style needs for a controller of your size.
</div>

<div data-levels="hs" markdown="1">
The number of *n*-bit patterns with *c* ones is "n choose c," written C(*n*, *c*). It peaks when *c* is half of *n*, which is why the paper calls that choice S\*Opt. One-hot is the special case *c* = 1: simple, always secure, and one bit per state.
</div>

<div data-levels="ug grad res" markdown="1">
The 2013 paper's S\*Opt chooses *c* = ⌊*n*/2⌋, which maximizes the number of states, SMAX = C(*n*, ⌊*n*/2⌋) (Eq. 9), and the number of codes reachable by one swap, TMAX = *c*(*n* − *c*) = ⌊*n*²/4⌋ (Eq. 10). A machine with *s* states whose busiest state connects to *t* others needs at least the smallest *n* with SMAX ≥ *s* and TMAX ≥ *t*. The bound assumes *c*₂ = 2. The benchmark search below shows the bound is neither sufficient nor tight: 13 of the 40 settled machines need fewer bits once *c*₂ = 4 is allowed (BBARA needs eight, not nine), and seven need more because their transitions cannot all be realized as single swaps (DK15 needs seven, not five).
</div>

## What security costs

<div id="sf-cost" class="w-demo"></div>

<div data-levels="public" markdown="1">
Each bar is one standard test controller. The first view shows how many states unrolling adds; the others show how much longer the codes become. The dotted line marks the average the 2014 paper reported for its own 12 test controllers; the solid line marks this page's average across the controllers on screen.
</div>

<div data-levels="hs" markdown="1">
Unrolling adds about half again as many states on average, close to the 49 percent the 2014 paper reports. Secure codes cost more: the shortest code that hides both weight and flips averages about 90 percent longer than the original binary code here, against 70 percent in the paper. One-hot is the most expensive, more than four times the binary length for these machines.
</div>

<div data-levels="ug grad res" markdown="1">
All lengths are relative to ⌈log₂ *s*⌉ bits for the original machine, the baseline the papers use. For the 38 machines with at most 32 states after unrolling, the page finds +48 percent states, +51 percent product terms, +18 percent binary length after unrolling, +92 percent for the shortest secure code (37 settled), +34 percent for RHD, +70 percent for RHD plus constant weight, +102 percent at *c*₂ = 4 (37 settled), and +129 percent at *c*₂ = 2 (25 settled). The 2014 paper reports +49, +57, +15, +70, +30, +55, +70, and +112 percent on its unnamed 12 machines. A machine whose search hits the budget is listed but left out of the mean.
</div>

<div data-levels="res" markdown="1">
RHD keeps the self-loops and requires constant distance only between distinct states (2014, Eq. 3); RHD + HW adds constant weight. Both leave the zero-distance self-loop visible, so they trade the security of the full S\*FSM for no added states. The (1, 2) family is one-hot on the unrolled machine; the page computes +328 percent for the 38 smaller machines and +520 percent for all 52, against 400 percent in the paper, a figure that depends heavily on which large machines are included.
</div>

## What the papers found

<div data-levels="public" markdown="1">
- Ordinary state codes let a power meter identify a controller's state, and even its moves, from the simplest power models.
- Changing the codes alone cannot hide a controller that sometimes stays put; the controller has to be rebuilt first.
- Rebuilt controllers with balanced codes give a power meter the same reading every tick, in theory removing what these attacks rely on.
- The protection costs size: about 50 to 70 percent more states and roughly twice the chip area in the authors' tests, comparable to protecting every logic gate.
</div>

<div data-levels="hs" markdown="1">
- Two rules make both power models constant: every state has the same number of ones, and every move flips the same number of bits.
- Self-loops break the second rule for any code, so they must be unrolled into pairs of states.
- On seven test machines, securing them needed 72 percent more states, 77 percent more transitions, and 79 percent more bits on average (2013).
- On 12 standard test machines, rebuilding cost 49 percent more states, and the shortest secure codes were 70 percent longer than binary (2014).
- Relaxed rules save bits or reduce power spikes, at the price of leaving some information visible.
</div>

<div data-levels="ug grad res" markdown="1">
- **Two sufficient conditions.** Constant HW over states and constant HD over transitions make both Hamming models constant, so their correlation with power is undefined (2012 Section 3; 2013 Eq. 3 to 6).
- **Structure is necessary.** A self-loop has HD = 0, so condition 2 fails for any encoding of a multi-state FSM with self-loops; Algorithm 1 removes them (2012).
- **Encoding is necessary.** Minimal binary codes vary in both models even after unrolling (2012 Table 1); one-hot and S\*Optimal codes do not.
- **Measured cost.** Seven BenGen machines: +71.6 percent states, +77.0 percent transitions, +78.6 percent encoding bits, and +96.4 percent layout area at 90 nm, which the authors compare with one-to-one duplication in low-level logic styles (2013 Tables II to V).
- **Relaxations.** Twelve MCNC machines: +49 percent states and +57 percent product terms; encoding length +15 percent (binary), +70 percent (S\*Optimal), +30 percent (RHD), and +55 percent (RHD + HW); peak-current constraints cost +70 percent (*c*₂ = 4), +112 percent (*c*₂ = 2), and +400 percent (one-hot) (2014 Tables III to V).
</div>

<div data-levels="grad res" markdown="1">
<div class="sf-tables">
<table class="results-table">
<caption class="w-note">Seven BenGen machines (2013 Tables II to IV). Every percentage and average recomputes from the printed counts.</caption>
<thead><tr><th>FSM</th><th>States</th><th>S*FSM states</th><th>Transitions</th><th>S*FSM transitions</th><th>Binary bits</th><th>S*FSM binary</th><th>Secure bits</th></tr></thead>
<tbody>
<tr><td>137</td><td>4</td><td>7 (+75%)</td><td>11</td><td>20 (+82%)</td><td>2</td><td>3</td><td>5 (+150%)</td></tr>
<tr><td>94</td><td>7</td><td>8 (+14%)</td><td>8</td><td>10 (+25%)</td><td>3</td><td>3</td><td>5 (+67%)</td></tr>
<tr><td>86</td><td>5</td><td>7 (+40%)</td><td>8</td><td>12 (+50%)</td><td>3</td><td>3</td><td>5 (+67%)</td></tr>
<tr><td>108</td><td>60</td><td>117 (+95%)</td><td>193</td><td>380 (+97%)</td><td>6</td><td>7</td><td>10 (+67%)</td></tr>
<tr><td>60</td><td>57</td><td>114 (+100%)</td><td>211</td><td>422 (+100%)</td><td>6</td><td>7</td><td>10 (+67%)</td></tr>
<tr><td>147</td><td>61</td><td>112 (+84%)</td><td>202</td><td>384 (+90%)</td><td>6</td><td>7</td><td>10 (+67%)</td></tr>
<tr><td>146</td><td>60</td><td>116 (+93%)</td><td>202</td><td>394 (+95%)</td><td>6</td><td>7</td><td>10 (+67%)</td></tr>
<tr><td>Mean</td><td>36.3</td><td>68.7 (+71.6%)</td><td>119.3</td><td>231.7 (+77.0%)</td><td>4.6</td><td>5.3</td><td>7.9 (+78.6%)</td></tr>
</tbody>
</table>

<table class="results-table">
<caption class="w-note">Encoding length relative to the original binary code (2014 Tables IV and V) beside this page's MCNC results for the 38 machines with at most 32 states after unrolling.</caption>
<thead><tr><th>Constraint family</th><th>Weight</th><th>Distance</th><th>Paper (12 machines)</th><th>This page</th></tr></thead>
<tbody>
<tr><td>S*FSM, binary</td><td>varies</td><td>varies</td><td>+15%</td><td>+18% (38)</td></tr>
<tr><td>S*FSM, S*Optimal</td><td>c₁</td><td>c₂</td><td>+70%</td><td>+92% (37)</td></tr>
<tr><td>FSM, RHD</td><td>varies</td><td>c₂ and 0</td><td>+30%</td><td>+34% (36)</td></tr>
<tr><td>FSM, RHD + HW</td><td>c₁</td><td>c₂ and 0</td><td>+55%</td><td>+70% (38)</td></tr>
<tr><td>S*FSM, CHD = 4</td><td>c₁</td><td>4</td><td>+70%</td><td>+102% (37)</td></tr>
<tr><td>S*FSM, CHD = 2</td><td>c₁</td><td>2</td><td>+112%</td><td>+129% (25)</td></tr>
<tr><td>S*FSM, CHD = 2, CHW = 1 (one-hot)</td><td>1</td><td>2</td><td>+400%</td><td>+328% (38)</td></tr>
</tbody>
</table>
</div>
</div>

## Why it matters

<div data-levels="public hs" markdown="1">
Controllers sit inside almost everything that runs on a chip, from door badges and pacemakers to drones and network cards. Most side channel defenses protect the cryptography and redesign individual logic gates, which is expensive. These papers move the defense up to a choice every designer already makes, which pattern stands for which state, and show that a controller can be made unreadable to the common power models before a single gate is drawn.
</div>

<div data-levels="ug" markdown="1">
State assignment and FSM restructuring happen before logic synthesis, so the countermeasure needs no custom cells and no change to the downstream flow, provided synthesis is told not to minimize the unrolled states back together. The 2013 layout results put the cost near that of low-level duplication methods without their design effort. The 2014 relaxations then give designers a dial: keep self-loops to save states, fix the weight to save static power, or fix a small distance to limit peak current.
</div>

<div data-levels="grad res" markdown="1">
The S\*FSM conditions target the state register and first-order Hamming models; they say nothing about the next-state and output logic, glitches, routing imbalance, or higher-order attacks, and the papers' validation is at the model and synthesis level, with silicon attacks listed as future work. The approach became the base for later secure encoding work in the DRACO lineage, including Agrawal, Vemuri, and Borowczak's reachability-based encodings, which relax the conditions to sets of states reachable at the same time; the [interactive page on that work](/papers/fsm-power-encoding/) carries the idea forward.
</div>

<div data-levels="res" markdown="1">
## Notes from building this page

- **2012 Table 2 does not reproduce.** The paper reports average Pearson correlations between each Hamming model and "State" or "Transition" without saying how those become numbers. For the four-state predictor under uniform random branches, labeling the states 0 to 3 in either natural order gives \|*r*\| = 0.95 against weight; only labelings such as ST = 3, WT = 2, SNT = 1, WNT = 0 give the printed 0.63. The binary and one-hot transition columns are identical at every length (0.61, 0.17, 0.17, 0.18), which only happens if every non-loop transition has the same binary distance, as in the two-state machine of Figure 3 rather than the predictor; for that machine, however, state and weight would correlate perfectly. The page therefore reports reading sets, not correlations.
- **2013 Table IV's large machines.** By state count alone, S\*Opt allows nine bits for the four large machines (C(9, 4) = 126 ≥ 117), while the table lists ten. The TMAX condition (20 neighbors at *n* = 9) or the "near S\*Opt" encodings of the experimental flow may explain the extra bit; the BenGen machines are not public, so the page cannot check.
- **The S\*Opt bound is a necessary condition for *c*₂ = 2 only.** On the MCNC machines the exact search finds shorter secure codes than the bound for 13 machines (all with *c*₂ = 4) and longer ones for seven, so the bound neither guarantees nor limits the true length.
- **2013 Table V units.** The layout areas are labeled nm²; at 90 nm a single flip-flop occupies several square micrometers, so the values (407 to 88,445) read as µm².
- **2014 Figure 2 caption.** The caption gives A = 01, but the table's weights and distances (HW(A) = 0, HD(C → A) = 1) require A = 00. The page uses 00.
- **2014 summary figures.** The abstract and conclusion give 53 to 67 percent for the relaxed encodings, while Table IV lists 30 percent (RHD) and 55 percent (RHD + HW). Eq. 3 prints *i* = *j* where the text describes transitions between distinct states (*i* ≠ *j*), and Eq. 5 reads N<sub>peak</sub> = *c*₂ / 2.
- **The 12 MCNC machines are not named.** A search over 12-machine subsets of the 52 LGSynth'91 machines found many that match the reported +49 percent states, +57 percent terms, and +15 percent binary length, so the paper's set cannot be recovered from its averages. The page reports its own means with their machine counts.
- **What the page counts as a transition.** Product terms follow the 2014 paper's wording; the graph views count distinct state pairs. Unrolled BBARA has 20 states and 74 directed state pairs, the same counts as the restructured BBARA in the 2019 follow-up.
</div>

<div data-levels="hs" markdown="1">
## Try this in class

1. Write the branch predictor's four states with the two-bit codes ST = 11, WT = 10, WNT = 01, SNT = 00. For each state, count the ones; for each of the eight transitions, count the bits that flip. Which readings name a single state?
2. Unroll ST and SNT on paper as the demo does. List the four-bit codes with exactly two ones and assign them so every arrow flips exactly two bits. Check your answer with the demo's shuffle and search buttons.
3. Using the capacity demo, find the shortest balanced code for a 30-state controller. In a short paragraph, explain what a designer gains and what the designer pays compared with a five-bit binary code.
</div>

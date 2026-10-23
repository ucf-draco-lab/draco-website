---
title: "Security as a Design Dial: A Quiet Bus and a Shuffled Schedule"
kicker: "Interactive paper · IEEE ISVLSI 2018"
subtitle: "An interactive companion to Mike Borowczak, Rafer Cooley, and Shaya Wolf's case for treating security as a setting designers tune, from the bits a controller puts on its bus to the order in which small devices take turns talking."
description: "Listen to a counter's bus give away its every step, then quiet it with the paper's constant-weight, constant-distance codes, trade bits for security across ten benchmark machines, search for secure codes in your browser, and shuffle a swarm's talking schedule."
share_description: "A chip's power draw can reveal what its controller is doing. Two simple rules on the bits hide it, at a price in bits the designer chooses. Try the paper's design-for-security dials in your browser, written for five reading levels."
share_text: "Two simple rules on a controller's bits hide its steps from a power probe, at a price the designer chooses. Try it in your browser:"
share_image: /papers/design-for-security-iot/share.png
share_image_alt: "Two strip charts of bits flipped per clock for the same 12-step counter: the binary code jumps between zero and four flips, the secure code flips exactly two bits every clock, beside the title Security as a Design Dial."
date: 2026-10-18
topics: ["Hardware security", "Swarms & IoT"]
default_level: public
level_hints:
  public: No background needed
  hs: Bits, binary numbers, and counting
  ug: Digital logic and state machines
  grad: Information theory and side channels
  res: Full method, reproduction, and open questions
authors:
  - name: Mike Borowczak
    affiliation: University of Wyoming
    member: mike-borowczak
  - name: Rafer Cooley
    affiliation: University of Wyoming
  - name: Shaya Wolf
    affiliation: University of Wyoming
sources:
  - venue: "IEEE ISVLSI · 2018 · pp. 684–689"
    title: "Designing for Security Within and Between IoT Devices"
    url: https://doi.org/10.1109/ISVLSI.2018.00129
    access: Paywalled (IEEE)
code:
  label: "LGSynth'91 / MCNC benchmark state machines (KISS2), as packaged in ispras/hdl-benchmarks"
  url: https://github.com/ispras/hdl-benchmarks/tree/master/lgsynth91/kiss2
citations:
  - Borowczak2018ISVLSI
widget:
  css:
    - /papers/design-for-security-iot/widget.css
  js:
    - /papers/design-for-security-iot/dfs-engine.js
    - /papers/design-for-security-iot/widget.js
credit: "Interactive page by the [DRACO Lab](/). The browser engine parses the ten MCNC machines of Table III, splits their self-loops (S*FSM), checks encodings against Eqs. 4 and 5, computes the entropy, mutual information, and peak switching of Eqs. 1 to 3 and 7 to 10, searches for secure codes, and runs the CHIRP pairing of Eq. 11 and Algorithm 1. It reproduces every cell of Table III (binary, S*FSM, and secure S*FSM bit counts, with nine of the ten secure lengths proven shortest by an exhaustive SAT search), the averages of Tables II and III, all 64 cells of Table IV, the 28 pairs of Figure 2, and the Table I counts, and its shortest relaxed encodings average 30.1 and 54.7 percent more bits than binary against the paper's 30 and 55 percent. Everything runs on your device."
bibtex: |
  @inproceedings{borowczak2018isvlsi,
    author    = {Borowczak, Mike and Cooley, Rafer and Wolf, Shaya},
    title     = {Designing for Security Within and Between {IoT} Devices},
    booktitle = {2018 IEEE Computer Society Annual Symposium on VLSI (ISVLSI)},
    pages     = {684--689},
    year      = {2018},
    doi       = {10.1109/ISVLSI.2018.00129}
  }
---

<div class="lede" data-levels="public" markdown="1">
Small connected devices (sensors on a pipeline, monitors inside the body, drones in a swarm) often have no room for heavy encryption. Their security usually comes as an all-or-nothing add-on. Mike Borowczak, Rafer Cooley, and Shaya Wolf argue for a different habit: treat security as a dial the designer turns, the same way designers already trade speed, size, and power. The paper shows two dials. Inside a device, a careful choice of bit patterns stops the chip's power draw from revealing what its controller is doing. Between devices, a shuffled talking schedule keeps outsiders from predicting who talks to whom.
</div>

<div class="lede" data-levels="hs" markdown="1">
A chip spends a little energy every time a wire switches from 0 to 1 or back, and a probe on the power line can measure it. If a controller's steps are stored as plain binary numbers, some steps flip one wire and others flip four, so the power trace spells out the steps. The paper's fix uses two rules: every code has the same number of 1s, and every step flips the same number of bits. Then every step costs the same energy. The price is a few extra wires, and this page lets you see exactly how many.
</div>

<div class="lede" data-levels="ug" markdown="1">
The paper models a bus protocol as a finite state machine (FSM) whose state encoding is the value on the bus, so the bus leaks through two power models: Hamming weight (HW, static power) and Hamming distance (HD, dynamic power). Holding HW constant over all states (Eq. 4) and HD constant over all transitions (Eq. 5) removes both leaks, and splitting each self-loop into two states (the S\*FSM) makes every clock edge switch bits. The designer then relaxes or tightens these constraints to trade security against encoding length and peak current. For communication between devices, the paper reuses CHIRP's one-line pairing rule and shuffles its rounds.
</div>

<div class="lede" data-levels="grad" markdown="1">
Security is framed as minimizing the information entropy on a bus (Eq. 1) and the mutual information between leakage and attack model (Eq. 2), which vanishes when the observed quantity is constant (Eq. 3). Constant Hamming weight c₁ (Eq. 4) and constant Hamming distance c₂ between connected states (Eq. 5) achieve that for the HW and HD models; the peak number of rising or falling bits then equals c₂/2 (Eq. 10), so shrinking c₂ also minimizes peak current. Experiments report encoding lengths for structurally modified (S\*FSM) machines on BenGen and MCNC benchmarks. A second part applies a permuted round order to the CHIRP pairing rule, giving a network one of *n*! schedules.
</div>

<div class="lede" data-levels="res" markdown="1">
Borowczak, Cooley, and Wolf (ISVLSI 2018, pp. 684–689) state the security objective in information-theoretic terms (Eqs. 1 to 3), the S\*FSM encoding constraints (Eqs. 4 and 5) and their peak-current corollary (Eqs. 6 to 10), and report bit lengths for seven BenGen and ten MCNC machines (Tables II and III) plus averages for relaxed and tightened variants. Section II-B recasts CHIRP (Eq. 11) with a permuted cycle (Algorithm 1, Tables I and IV). This page rebuilds the MCNC part from the public KISS2 files, recomputes Table III with an exact search, recomputes Tables I and IV, and adds three items the paper does not report: per-option leakage entropies, shortest lengths for the relaxed variants on the Table III machines, and an input-versus-flips mutual information in the first demo. All three are labeled as this page's own.
</div>

## Listen to the bus

<div id="ds-bus" class="w-demo"></div>

<div data-levels="public" markdown="1">
Press **Play** and watch the bars. With the plain binary code, a pause (an open, flat mark) flips nothing, and a count flips anywhere from one to four bits, so anyone measuring power can tell when the counter paused and roughly where it is. Switch to **Secure S\*FSM** and play again: every clock flips exactly two bits and leaves three bits on, whether the counter pauses or counts. The power line goes quiet about what the controller is doing.
</div>

<div data-levels="hs" markdown="1">
Count the 1s in the binary codes: 0000 has none, 0111 has three, so the number of lit wires changes from step to step. Count the flips: 0111 to 1000 flips all four bits, while 1000 to 1001 flips one. The secure code uses seven wires, every code has exactly three 1s, and every step flips exactly two bits. To make pauses look like counts too, the paper splits each "stay put" step into two twin states that trade places, so even a pause flips two bits.
</div>

<div data-levels="ug" markdown="1">
MODULO12 has 12 states, each with a self-loop on input 0. Binary needs ⌈log₂ 12⌉ = 4 bits, and its HD over the 24 transitions ranges from 0 (every self-loop) to 4 (7 → 8). The S\*FSM replaces each self-loop with a pair *s*A ↔ *s*B (24 states), and the shortest code meeting Eqs. 4 and 5 for that machine has 7 bits, weight c₁ = 3, and distance c₂ = 2, the same 7 bits that Table III reports. The mutual information readout applies Eq. 2 to the run so far, treating the input bit as the secret and the number of flipped bits as the observation.
</div>

<div data-levels="grad res" markdown="1">
Counting every state and every directed transition once, the binary code gives H(HW) = 1.78 bits over the 12 states and H(HD) = 1.86 bits over the 24 transitions, the self-loops all at HD = 0. The 7-bit S\*FSM code gives zero for both, as Eq. 3 predicts for a constant observation, with Npeak = 1 = c₂/2 (Eq. 10) against 3 for binary. The input-versus-flips mutual information is this page's illustration, not the paper's measure; under random inputs it approaches 1 bit per clock for the binary code (every hold flips zero bits, every count at least one) and stays at exactly zero for the secure code.
</div>

## Tighten the rules, pay in bits

<div id="ds-trade" class="w-demo"></div>

<div data-levels="public" markdown="1">
Pick a machine. Each row is a different set of rules, from no protection (binary) to the strictest (one wire per state), and the table shows how many wires each needs and whether a power probe could still tell the states apart. The paper's point is that these are choices on a dial: a designer short on wires can accept a little leakage, and a designer guarding a secret can pay for silence.
</div>

<div data-levels="hs" markdown="1">
Read across a row to see the price. For BBARA, binary needs four wires and leaks; the paper's secure code needs eight, twice as many, and leaks nothing to either power model. The middle rows keep some protection with fewer wires: requiring only equal flips on every real step (the "relaxed" rows) costs five to seven wires but still lets pauses show. The rings on the chart mark the numbers printed in the paper.
</div>

<div data-levels="ug grad res" markdown="1">
**Binary** is the minimal encoding of the original machine. **O.RHD** asks only for a constant HD on the original's non-self-loop transitions; **O.RHD+HW** adds constant HW. **Secure** is Eqs. 4 and 5 on the S\*FSM, the paper's main column, and **One-hot** (CHW=1) is the extreme the paper describes, one bit per S\*FSM state, with c₂ = 2 and the minimum Npeak of 1. Table III's binary, S\*FSM-binary, and secure columns match this page on all ten machines.
</div>

<div data-levels="grad res" markdown="1">
The entropy columns count each state (HW) and each directed transition, self-loops included (HD), once; a value of zero means the corresponding power model observes a constant. Relaxed codes on the original machine still show HD = 0 on self-loops, so their H(HD) stays above zero whenever a machine has both self-loops and real transitions, which is why the paper restructures to the S\*FSM before claiming zero leakage. "At most" marks a length where the SAT search found a code but ran out of its conflict budget on some shorter length.
</div>

## Search for a secure code

<div id="ds-search" class="w-demo"></div>

<div data-levels="public" markdown="1">
Press **Paper's length** to have your device search for a secure code of the length the paper reports; it usually takes a fraction of a second. Then press **One bit fewer**. Your device tries every possible setting at the shorter length and reports that none works, which confirms the paper's numbers as the true minimum.
</div>

<div data-levels="hs" markdown="1">
The three sliders are the design dials: the number of wires, how many of them are 1 in every code, and how many must flip on every step. The search places states one at a time and backs up whenever a state has no code left that sits the right distance from all its already-placed neighbors. Fewer wires means fewer codes to choose from, and at some point the puzzle has no solution.
</div>

<div data-levels="ug grad res" markdown="1">
The browser search is a depth-first assignment over the C(*b*, c₁) codes of weight c₁, states taken in breadth-first order from the reset state, with the first state fixed to the lowest code (any weight-c₁ code is equivalent under a bit permutation). For MODULO12, OPUS, BBARA, and BBSSE it finds the paper's length in milliseconds and exhausts the next shorter length within seconds, independently confirming the SAT results behind the table above. Larger machines (STYR, EX1) can run past the eight-second limit at the boundary; their shortest lengths come from the offline SAT search.
</div>

## Pairs on a shuffled schedule

<div id="ds-chirp" class="w-demo"></div>

<div data-levels="public" markdown="1">
The second half of the paper moves from inside one chip to a group of devices that must all talk to each other, one pair at a time, with no one in charge. Each device follows a simple rule based on its own number and the round number, and after one round per device, everyone has talked to everyone. The paper then shuffles the order of the rounds, so an outsider who learns the rule still cannot predict who talks next. With eight devices there are already 40,320 possible orders.
</div>

<div data-levels="hs" markdown="1">
Each row is a round and each column a device; the cell is that device's partner. Pick any two devices: they appear as each other's partner in exactly one row. Press **Shuffle the rounds** and the rows move around, yet every pair still meets exactly once per cycle. The count of possible orders, *n*! (*n* factorial, 8 × 7 × 6 × … × 1), grows so fast that 16 devices already have about 2.09 × 10¹³ orders.
</div>

<div data-levels="ug" markdown="1">
Algorithm 1 computes target = (Pr(C)[*r*] − self) mod Node<sub>cnt</sub>, where Pr(C) is a permutation of the rounds known to the devices. Because node *s* and node *t* pair when *s* + *t* ≡ Pr(C)[*r*], each round is a matching, every one of the *n*(*n* − 1)/2 pairs occurs in exactly one round, and each node idles once per cycle. With eight nodes, the eight rounds create all 28 edges of the complete graph (Figure 2).
</div>

<div data-levels="grad res" markdown="1">
Table IV, as printed, matches target = (Pr(C)[*r*] − self − 1) mod 8 in all 64 cells, one less than Eq. 11 and Algorithm 1 give. Toggle the indexing to compare: both are valid round-robin schedules with every pair meeting once, and they differ by relabeling which round carries which matching. Table I lists *n*! for 8 to 128 nodes; this page's exact values agree with the printed mantissas to rounding, and the 8-node entry is 4.03 × 10⁴ (40,320). The full protocol, including node loss and re-entry, is the subject of the [CHIRP and S-CHIRP page](../s-chirp/).
</div>

## What the paper found

<div data-levels="public" markdown="1">
- Two simple rules on a controller's bit patterns (same number of 1s everywhere, same number of flips on every step) hide its activity from a power probe.
- The price is extra wires: about 73 percent more on average for ten standard benchmark controllers, and about 79 percent for seven generated ones.
- Designers can loosen the rules to save wires or tighten them to save peak power, so security becomes one more trade-off instead of a yes-or-no add-on.
- For groups of devices, shuffling the order of a simple talking schedule gives a network a secret drawn from a huge number of possibilities without any central controller.
</div>

<div data-levels="hs" markdown="1">
- Secure codes for ten benchmark controllers needed 7 to 9 bits, against 4 to 7 bits for plain binary codes (Table III).
- Forcing every step to flip exactly two bits more than doubled the length (112 percent more bits on average) but brought peak power to its minimum.
- Requiring a single 1 in every code (one-hot) increased the length by almost 400 percent.
- Eight devices can follow any of 40,320 round orders; 128 devices, about 3.86 × 10²¹⁵.
</div>

<div data-levels="ug grad res" markdown="1">
- **Secure encodings.** Constant HW and HD on structurally modified FSMs raised encoding length by 78.6 percent on seven BenGen machines (67 percent excluding the smallest) and 73 percent on ten MCNC machines (Tables II and III).
- **Tightening.** Fixing c₂ = 2 required on average 112 percent more bits and reached the minimum Npeak of 1; fixing c₁ = 1 forced one-hot encodings and nearly 400 percent more bits.
- **Relaxing.** On original machines, a relaxed HD constraint cost about 30 percent more bits than binary and relaxed HD with constant HW about 55 percent.
- **Communication.** Permuting CHIRP's cycle keeps every pair meeting exactly once per cycle while drawing the schedule from *n*! possibilities (Table I), with no discernible diagonal sweep (Table IV).
</div>

<div data-levels="grad res" markdown="1">
<div class="ds-table-wrap">
<table class="results-table ds-paper-table">
<caption class="w-note">Table III, bits needed for ten MCNC machines, with this page's recomputation. BE is binary encoding; S*FSM splits self-loops. Every value matches.</caption>
<thead><tr><th>FSM</th><th>BE orig</th><th>BE S*FSM</th><th>% increase</th><th>Secure S*FSM</th><th>Overall % increase</th><th>States, original / S*FSM (page)</th></tr></thead>
<tbody>
<tr><td>modulo12</td><td>4</td><td>5</td><td>25</td><td>7</td><td>75</td><td>12 / 24</td></tr>
<tr><td>opus</td><td>4</td><td>5</td><td>25</td><td>7</td><td>75</td><td>11 / 17</td></tr>
<tr><td>bbara</td><td>4</td><td>5</td><td>25</td><td>8</td><td>100</td><td>10 / 20</td></tr>
<tr><td>bbsse</td><td>4</td><td>5</td><td>25</td><td>8</td><td>100</td><td>16 / 23</td></tr>
<tr><td>sse</td><td>4</td><td>5</td><td>25</td><td>8</td><td>100</td><td>16 / 23</td></tr>
<tr><td>sand</td><td>5</td><td>6</td><td>20</td><td>8</td><td>60</td><td>32 / 62</td></tr>
<tr><td>planet</td><td>6</td><td>6</td><td>0</td><td>8</td><td>33</td><td>48 / 49</td></tr>
<tr><td>ex1</td><td>5</td><td>6</td><td>20</td><td>9</td><td>80</td><td>20 / 36</td></tr>
<tr><td>styr</td><td>5</td><td>6</td><td>20</td><td>9</td><td>80</td><td>30 / 49</td></tr>
<tr><td>scf</td><td>7</td><td>7</td><td>0</td><td>9</td><td>29</td><td>122 / 122</td></tr>
<tr><td>avg</td><td>4.8</td><td>5.6</td><td>19</td><td>8.1</td><td>73</td><td></td></tr>
</tbody>
</table>
</div>

<div class="ds-table-wrap">
<table class="results-table ds-paper-table">
<caption class="w-note">Table II, seven BenGen machines (paper values; the generated machines are not public, so this page checks only the arithmetic, which holds).</caption>
<thead><tr><th>FSM</th><th>BE orig</th><th>BE S*FSM</th><th>Secure S*FSM</th><th>Overall % increase</th></tr></thead>
<tbody>
<tr><td>137</td><td>2</td><td>3</td><td>5</td><td>150</td></tr>
<tr><td>94</td><td>3</td><td>3</td><td>5</td><td>66.7</td></tr>
<tr><td>86</td><td>3</td><td>3</td><td>5</td><td>66.7</td></tr>
<tr><td>108</td><td>6</td><td>7</td><td>10</td><td>66.7</td></tr>
<tr><td>60</td><td>6</td><td>7</td><td>10</td><td>66.7</td></tr>
<tr><td>147</td><td>6</td><td>7</td><td>10</td><td>66.7</td></tr>
<tr><td>146</td><td>6</td><td>7</td><td>10</td><td>66.7</td></tr>
<tr><td>avg</td><td>4.6</td><td>5.3</td><td>7.9</td><td>78.6</td></tr>
</tbody>
</table>
</div>

<div class="ds-table-wrap">
<table class="results-table ds-paper-table">
<caption class="w-note">Table I, possible round permutations, with this page's exact values.</caption>
<thead><tr><th>Nodes</th><th>Paper</th><th>Exact <em>n</em>!</th></tr></thead>
<tbody>
<tr><td>8</td><td>4.03 × 10⁵ (as printed)</td><td>40,320 = 4.03 × 10⁴</td></tr>
<tr><td>10</td><td>3.63 × 10⁶</td><td>3.6288 × 10⁶</td></tr>
<tr><td>16</td><td>2.09 × 10¹³</td><td>2.0923 × 10¹³</td></tr>
<tr><td>32</td><td>2.63 × 10³⁵</td><td>2.6313 × 10³⁵</td></tr>
<tr><td>64</td><td>1.26 × 10⁸⁹</td><td>1.2689 × 10⁸⁹</td></tr>
<tr><td>128</td><td>3.85 × 10²¹⁵</td><td>3.8562 × 10²¹⁵</td></tr>
</tbody>
</table>
</div>
</div>

## Why it matters

<div data-levels="public hs" markdown="1">
Most of the world's computing happens in small, cheap devices that never get a security upgrade. When protection only comes as a heavy, fixed add-on, designers of those devices often leave it out. This paper gives them settings they can afford: a few more wires on a bus, or a shuffled schedule that costs almost nothing to store. Ultimately, a designer who can turn security up or down a notch is more likely to turn it on.
</div>

<div data-levels="ug" markdown="1">
State assignment and bus protocols are fixed early in a design, long before anyone measures power. Constraints placed there (Eqs. 4 and 5) carry through synthesis without special cells or libraries, and the designer can read their cost directly as bits and peak current. The same mindset applies between devices: a rule simple enough for the smallest node, with a permutation as the tunable secret.
</div>

<div data-levels="grad res" markdown="1">
The paper's contribution is a framing: security as a parameterized constraint with measurable costs, in place of a binary inclusion of cryptographic blocks or secure logic styles. Its guarantees are model-bound. Zero entropy under the HW and HD models removes first-order leakage of the state register, but says nothing about next-state and output logic, glitches, or higher-order attacks, and the round permutation hides schedule order from an outsider who does not hold it, without authenticating anyone. The authors name multi-agent simulation and domain-specific applications as future work; the S-CHIRP and SHARKS pages on this site follow that line.
</div>

<div data-levels="res" markdown="1">
## Notes from building this page

- **How the KISS2 files were read.** Table III's "BE S\*FSM" column reproduces on all ten machines when a reset row whose present state is `*` is kept as an ordinary state named `*` (as a plain tokenizer would) and only written self-loops are split. Dropping reset rows and adding an implied self-loop for every unspecified input also matches nine of ten, but gives SCF 242 S\*FSM states (8 bits) instead of 7. The page uses the first reading. Both readings give the same secure lengths on the seven machines checked under each.
- **Secure lengths are exact minima.** For nine Table III machines, a SAT model of Eqs. 4 and 5 (all weights c₁ and even distances c₂) finds a code at the paper's length and proves that no shorter code exists; for SCF, 8 bits fall short by counting alone (C(8, 4) = 70 < 122). For STYR, the model finds the paper's 9 bits and rules out 8 bits for every weight and distance except c₁ = 3 or 4 with c₂ = 4, which did not finish in this run, so the table marks STYR's length as an upper bound. The browser search confirms the four smallest machines independently. The paper does not say how its encodings were found.
- **Table IV is off by one from Eq. 11.** All 64 printed cells equal (Pr(C)[*r*] − self − 1) mod 8. The difference does not affect correctness, since every pair still meets once, but an implementer following Algorithm 1 literally will not reproduce the table.
- **Table I, 8 nodes.** The text layer of the paper reads 4.03 × 10⁵; 8! = 40,320 = 4.03 × 10⁴. The 64- and 128-node entries are truncated rather than rounded (1.2689 and 3.8562).
- **Relaxed and tightened variants.** The paper reports averages (30 and 55 percent for O.RHD and O.RHD+HW, 112 percent for CHD = 2, nearly 400 percent for one-hot) without naming the machine set. On the ten Table III machines, the page's shortest O.RHD codes average 30.1 percent more bits than binary and its O.RHD+HW codes 54.7 percent, matching the reported 30 and 55 percent, so the relaxed averages most likely come from the same ten machines. Three O.RHD lengths (SAND, PLANET, and SCF) and one O.RHD+HW length (STYR) are upper bounds, since the SAT search ran out of its budget one bit shorter. One-hot coding of the same S\*FSMs averages about 720 percent more bits (SCF alone needs 122), so the "nearly 400 percent" figure likely refers to a different machine set; CHD = 2 was not recomputed.
- **Entropy weighting.** Eq. 1 needs a distribution p(*a*). The page counts each state and each directed transition once; weighting by state transition probabilities would change the values for leaky codes but not the zero for secure ones.
- **Eq. 10 holds for every constant-weight code.** With equal weights, each transition raises and lowers the same number of bits, so N<sub>0→1</sub> = N<sub>1→0</sub> = c₂/2; the page's Npeak column shows this for every Secure code.
</div>

<div data-levels="hs" markdown="1">
## Try this in class

1. Write the numbers 0 to 11 in four-bit binary. For each step from *n* to *n* + 1, count how many bits flip. Which step would draw the most power, and why does that let an attacker find it?
2. In the first demo, switch to the secure code and press **Count** six times. Write down each seven-bit code and check that each has three 1s and differs from the one before in exactly two places.
3. In the last demo, set four devices and press **No shuffle**. Make a table of who talks in each round, then pick a different round order and show that every pair still meets exactly once.
</div>

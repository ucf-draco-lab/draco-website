---
title: "SDMLp: A Logic Cell That Spends the Same Energy Every Clock"
kicker: "Interactive paper · IEEE HOST 2012"
subtitle: "An interactive companion to Lakshmi Narasimhan Ramakrishnan, Manoj Chakkaravarthy, Antarpreet Singh Manchanda, Mike Borowczak, and Ranga Vemuri's dual-rail pass-transistor logic style, which builds a cipher from one multiplexer cell that raises exactly one wire per clock, whatever the data."
description: "Clock the SDMLp cell through pre-discharge and evaluation, synthesize the DES S-boxes into multiplexer cells over all 720 variable orders, compare the paper's area, power, and current-variance tables for three logic styles, and rerun a simulated power analysis attack on S-box 1 in your browser."
share_description: "A chip's power draw can give away a cipher's key. SDMLp builds the circuit from one dual-rail multiplexer cell that switches the same amount every clock. Clock the cell, synthesize DES S-boxes, and rerun the power attack in your browser, written for five reading levels."
share_text: "A logic cell that spends the same energy every clock, so the power line stops telling secrets. Clock it, build DES from it, and attack it in your browser:"
share_image: /papers/sdmlp-dpa-logic/share.png
share_image_alt: "Simulated switching per clock for DES S-box 1: the static CMOS bars jump between 0 and 34 cell switches, while the SDMLp bars sit level at 51, beside the title SDMLp."
date: 2026-10-19
topics: ["Hardware security"]
default_level: public
level_hints:
  public: No background needed
  hs: Bits, logic gates, and a little algebra
  ug: Digital logic, transistors, and decision diagrams
  grad: Correlation, side channels, and logic synthesis
  res: Full method, reproduction, and open questions
authors:
  - name: Lakshmi Narasimhan Ramakrishnan
    affiliation: University of Cincinnati
  - name: Manoj Chakkaravarthy
    affiliation: University of Cincinnati
  - name: Antarpreet Singh Manchanda
    affiliation: University of Cincinnati
  - name: Mike Borowczak
    affiliation: University of Cincinnati
    member: mike-borowczak
  - name: Ranga Vemuri
    affiliation: University of Cincinnati
sources:
  - venue: "IEEE HOST · 2012 · pp. 31–36"
    title: "SDMLp: On the Use of Complementary Pass Transistor Logic for Design of DPA Resistant Circuits"
    url: https://doi.org/10.1109/HST.2012.6224315
    access: Paywalled (IEEE)
code:
  label: "CUDD decision diagram package (the paper's BDD tool), used through the dd Python bindings to check this page's synthesis"
  url: https://github.com/tulip-control/dd
citations:
  - ramakrishnan2012sdmlp
widget:
  css:
    - /papers/sdmlp-dpa-logic/widget.css
  js:
    - /papers/sdmlp-dpa-logic/sdmlp-engine.js
    - /papers/sdmlp-dpa-logic/widget.js
credit: "Interactive page by the [DRACO Lab](/). The browser engine models the SDMLp cell of Fig. 2 at switch level and checks all seven Table I configurations and Eqs. (1) and (2) on every input; it reproduces the average and standard deviation rows of Tables II to VIII (all 21, as sample standard deviations) and the abstract's 43%, 50%, 40×, and 20% figures from Table IX. Its DES tables match PyCryptodome on 1,001 encryptions, including the FIPS 46-3 worked example, and its decision diagrams match CUDD's node counts (with complement edges) on all 5,760 S-box and variable-order combinations. The probe and attack demos use this page's own simulated switching model; the paper's numbers came from HSPICE simulation of 90 nm layouts. Everything runs on your device."
bibtex: |
  @inproceedings{ramakrishnan2012sdmlp,
    author    = {Ramakrishnan, Lakshmi Narasimhan and Chakkaravarthy, Manoj and Manchanda, Antarpreet Singh and Borowczak, Mike and Vemuri, Ranga},
    title     = {{SDMLp}: On the Use of Complementary Pass Transistor Logic for Design of {DPA} Resistant Circuits},
    booktitle = {2012 IEEE International Symposium on Hardware-Oriented Security and Trust (HOST)},
    pages     = {31--36},
    year      = {2012},
    doi       = {10.1109/HST.2012.6224315}
  }
---

<div class="lede" data-levels="public" markdown="1">
Every time a chip flips a wire from 0 to 1, it draws a tiny gulp of current, and an attacker with a probe on the power line can count those gulps. When the chip is encrypting, the count changes with the secret key, and a few hundred measurements can be enough to read the key back. Lakshmi Narasimhan Ramakrishnan, Manoj Chakkaravarthy, Antarpreet Singh Manchanda, Mike Borowczak, and Ranga Vemuri designed a logic cell, SDMLp, that flips exactly one wire every clock no matter what it computes. They built the DES cipher from it, and an attack that broke an ordinary version of the chip after 70 measurements found nothing after 5,000.
</div>

<div class="lede" data-levels="hs" markdown="1">
Ordinary chips use static CMOS logic: a gate's output wire changes only when its answer changes, so the number of wires flipping each clock depends on the data. SDMLp (Secure Differential Multiplexer Logic using pass transistors) gives every signal two wires, one for the value and one for its opposite. Each clock, both wires reset to 0, then exactly one of them rises. The paper builds every gate from one SDMLp cell, assembles the eight lookup tables (S-boxes) of DES from it, and compares it with static CMOS and an earlier secure style, WDDL. SDMLp needed 43% less area and 50% less power than WDDL.
</div>

<div class="lede" data-levels="ug" markdown="1">
SDMLp is a dynamic, differential version of complementary pass-transistor logic (CPL). Each cell is a dual-rail two-to-one multiplexer: two NMOS pass networks select Ip1 or Ip2 (and their complements), a PMOS network forces both internal nodes high when S = Sbar = 0, and output inverters give Out and Outbar. Because one multiplexer realizes any two-input function (Table I) and every node of a binary decision diagram is a multiplexer, the paper synthesizes circuits by mapping a reduced ordered binary decision diagram (ROBDD) node for node onto SDMLp cells, with an extra step that merges a node with its complement. It evaluates basic gates, all eight DES S-boxes, and a full DES in 90 nm against static CMOS (SCMOS) and Wave Dynamic Differential Logic (WDDL).
</div>

<div class="lede" data-levels="grad" markdown="1">
Dynamic and differential logic (DDL) defends against differential power analysis (DPA) by making every gate switch exactly once per cycle, on one of two balanced rails, so the supply current stops depending on the data. WDDL achieves this with standard cells at roughly twice the area and power of SCMOS. SDMLp gets the same one-switch-per-cycle behavior from a single pass-transistor multiplexer cell, synthesized from ROBDDs. On a 90 nm DES, the paper reports 43% less area and 50% less power than WDDL, a 38.5-fold drop in instantaneous current variance, and a 20% lower clock, and a single-round DPA that recovered the SCMOS subkey in 70 vectors but neither DDL subkey in 5,000.
</div>

<div class="lede" data-levels="res" markdown="1">
Ramakrishnan, Chakkaravarthy, Manchanda, Borowczak, and Vemuri (HOST 2012, pp. 31–36) define the SDMLp cell (Fig. 2, Eqs. 1 and 2), its configurations (Table I), and an ROBDD-to-netlist flow with CUDD variable ordering and complementary-node elimination (Figs. 3 and 4). They report cell-level current variance, delay, area, and power (Tables II to V), per-S-box area, power, and current variation for DES (Tables VI to VIII), a full-chip comparison (Table IX), and a correlation attack on one DES round (Figs. 7 and 8). This page reruns the cell logic, the synthesis, and every summary statistic, and adds a simulated attack and a comparison of synthesized cell counts with the printed areas. Those additions are this page's own and are labeled as such.
</div>

## One cell, two rails, one rise per clock

<div id="sd-cell" class="w-demo"></div>

<div data-levels="public" markdown="1">
The table shows the cell's wires in the two halves of each clock. In the first half, pre-discharge, both outputs drop to 0. In the second half, evaluation, the cell works out its answer and raises exactly one output: Out if the answer is 1, Outbar if the answer is 0. Press **Random inputs, 12 clocks** and watch the bottom rows. The secure cell rises once every clock; the ordinary gate rises only when its answer changes from 0 to 1, and an attacker can count that.
</div>

<div data-levels="hs" markdown="1">
Pick a gate, set A and B, and press **Next clock**. The same cell becomes AND, OR, XOR, a multiplexer, or a buffer just by choosing which signals feed its three inputs (the paper's Table I). Ip1 and Ip2 are the two data inputs and S chooses between them. Every row of Table I comes out right on every input, and the page checks that below the chart. The count row is the point of the design: SDMLp always shows 1, while the ordinary CMOS gate shows 0 or 1 depending on the data.
</div>

<div data-levels="ug" markdown="1">
In Fig. 2, m1 and m2 pass Ip1 (when S = 1) or Ip2 (when Sbar = 1) to the internal node x, and m7 and m8 do the same for the complements onto xbar. When S = Sbar = 0, series PMOS m3–m4 and m9–m10 pull x and xbar to Vdd, so both outputs, after their inverters, pre-discharge to 0. During evaluation exactly one of x or xbar falls and exactly one of Out or Outbar rises, which is Eq. (1), Out = (Ip1·S + Ip2·Sbar + S′·Sbar′)′, and Eq. (2) with complemented data. Table I's configurations feed literals of A and B into Ip1, Ip2, and S; the AND row, for example, uses Ip1 = A′, Ip2 = B′, S = B.
</div>

<div data-levels="grad res" markdown="1">
The demo checks 32 input cases across the seven configurations against the switch-level cell, Eqs. (1) and (2), and the pre-discharge state. One rise per cycle holds only if the two rails load equally; the paper uses constant output loads in simulation and points to fat-wire routing for layout. The cell's delay is also nearly data independent: 35.61 to 37.23 ps across AND, OR, XOR, and MUX (standard deviation 0.69 ps), against 24.86 to 49.81 ps for SCMOS (Table III). Early propagation, where a cell evaluates before all its inputs arrive, can still leak (Section III-C); the switch-level model here does not include timing.
</div>

## From an S-box to a tree of multiplexers

<div id="sd-bdd" class="w-demo"></div>

<div data-levels="public" markdown="1">
A DES S-box is a lookup table: six bits in, four bits out. The diagram turns that table into a chain of yes-or-no questions, one input bit per row, and every dot becomes one SDMLp cell. Asking the questions in a better order makes the chain shorter. Switch between **Order b1…b6** and **Best of 720** and watch the count of cells drop: for S-box 1, from 58 to 51.
</div>

<div data-levels="hs" markdown="1">
Six input bits can be asked about in 6 × 5 × 4 × 3 × 2 × 1 = 720 different orders, and your device tries all of them. Each dot asks about one bit: follow the solid line if the bit is 1 and the dashed line if it is 0. Small squares are questions so simple (the answer is just that input bit) that they need only a wire. Untick **Share complementary nodes** to see the paper's extra step undone: S-box 4 grows from 32 cells to 50, because many of its sub-answers are exact opposites of others, and a two-rail cell supplies the opposite for free.
</div>

<div data-levels="ug" markdown="1">
Each non-terminal ROBDD node is a two-to-one multiplexer, f = x′·f₀ + x·f₁, and maps to one SDMLp cell with S = x. The paper finds a good variable order with CUDD and adds one step to the reduction: a node whose function is the complement of an existing node is removed and read from that node's Outbar rail (Fig. 3). This page counts a node as a cell unless it is a bare input literal, which the dual-rail inputs already supply. The table gives the fewest cells over all 720 orders, with the four outputs of each S-box sharing nodes; accented edges read the complemented rail.
</div>

<div data-levels="grad res" markdown="1">
With complement sharing, an ROBDD becomes a decision diagram with complement edges, the form CUDD uses internally; this page's node counts match CUDD's on all 720 orders of all eight S-boxes. **Worst of 720** shows the range the ordering step covers: 51 to 62 cells for S-box 1 with complement sharing (58 in the order b1 to b6). The paper does not print cell counts. Across the eight S-boxes, the fewest-cell counts rank the same way as the paper's SDMLp layout areas in Table VI (Spearman ρ = 0.83), and a least-squares line gives 20.5 λ² per cell against the 18.4 λ² single-cell area of Table IV. The counts do not track the WDDL areas (ρ = 0.10), which come from a different synthesis. This comparison is the page's analysis, not the paper's.
</div>

## What the paper measured

<div id="sd-tables" class="w-demo"></div>

<div data-levels="public" markdown="1">
These are the paper's own numbers, from detailed circuit simulations of chip layouts. Table II and Table VIII measure how much the current swings from one input to the next, which is what a power attack listens for. The gray bars (ordinary logic) sit tens to thousands of times higher than the blue bars (SDMLp); the scale is logarithmic so that both fit. The other tables show the price: SDMLp is larger and slightly slower than ordinary logic, but smaller and leaner than the older secure style, WDDL.
</div>

<div data-levels="hs" markdown="1">
Each table compares three logic styles on the same circuits: four basic gates (Tables II to V) or the eight DES S-boxes (Tables VI to VIII). Your device recomputes the average and standard deviation rows from the numbers above them, and they match what the paper printed. The headline numbers under Table IX also come straight from the paper's own data: 18,715 λ² against 32,715 λ² is 42.8% less area, the paper's "43%."
</div>

<div data-levels="ug grad res" markdown="1">
All 21 printed summary rows reproduce when the standard deviation uses n − 1. The full-chip ratios in Table IX reproduce the abstract: area 42.8% below WDDL, power 50.3% below, current variance 38.5 times smaller, and maximum frequency 20.0% lower (66.67 against 83.33 MHz). Against SCMOS, the S-box tables put SDMLp at 1.41 times the area and 1.44 times the power, while the full chip costs 1.41 times the area and only 1.07 times the power (1.47 against 1.37 mW), with a 33% lower clock.
</div>

## What a power probe would see

<div id="sd-probe" class="w-demo"></div>

<div data-levels="public" markdown="1">
This simulation runs S-box 1, built from 51 cells, on random inputs and counts how many cells switch in each clock. The ordinary version jumps around from clock to clock, and those jumps carry information about the data. The SDMLp version switches all 51 cells, one wire each, every single clock, so its bars form a flat line.
</div>

<div data-levels="hs" markdown="1">
Both versions use the same network of 51 cells from the previous demo. In the ordinary version, a cell counts only if its output changed since the last clock, which averages about 25 of 51 and varies a lot. In SDMLp, every cell resets and rises again each clock, so the count is always 51. Press **New inputs** to see a different stretch of data: the top chart changes, the bottom one does not.
</div>

<div data-levels="ug grad res" markdown="1">
The model's static CMOS leakage is the number of cell outputs whose value changes between consecutive inputs (zero-delay, no glitches): variance 47.9 over 1,000 simulated clocks at the default seed. Its SDMLp leakage is Σᵢ (1 ± m·eᵢ), one rail per cell, where eᵢ is a fixed per-cell imbalance drawn from [−1, 1] and m is the rail mismatch. At m = 0 the variance is exactly 0; at the default 2% it is 0.0043, roughly 11,000 times smaller than static CMOS. The paper's HSPICE ratio for S-box 1 (Table VIII) is about 2,500 (7,490 against 3.03 × 10⁻⁷ A²). The two quantities differ in kind, so only their direction should be compared.
</div>

## Run the attack

<div id="sd-attack" class="w-demo"></div>

<div data-levels="public" markdown="1">
Here the attacker feeds the circuit random inputs, records the simulated power each time, and tests all 64 possible values of a six-bit piece of the key. For each guess, it predicts how many output wires should flip and checks how well the prediction matches the measurements. The orange line is the right guess. Against ordinary logic it pulls clear of the other 63 within a few hundred measurements; against SDMLp it stays buried among them. The paper's attack on its simulated chip found the ordinary key after 70 measurements and nothing from SDMLp after 5,000.
</div>

<div data-levels="hs" markdown="1">
The secret is 20, the value the paper used. Each measurement adds one random input to the statistics, and the chart plots, for every guess, how strongly the predicted flips correlate with the power readings (0 means no relation). With the default settings, the correct guess takes the lead for good at trace 76 against static CMOS. Raise the noise and the attacker needs more traces; press **New random inputs** to see how much the answer varies from run to run.
</div>

<div data-levels="ug" markdown="1">
The device computes S1(x ⊕ k) for random six-bit round inputs x and secret subkey k = 20. For each guess g, the attacker's prediction is the Hamming distance between consecutive S-box outputs, HD(S1(xₜ₋₁ ⊕ g), S1(xₜ ⊕ g)), and the chart tracks Pearson's |r| against the simulated trace as traces accumulate (the paper's Fig. 7), then shows |r| for all 64 guesses at the end (Fig. 8). The rail mismatch slider sets the imbalance the SDMLp simulation leaks through.
</div>

<div data-levels="grad res" markdown="1">
At σ = 1 and 5,000 traces, the static CMOS key leads for good from trace 28 to 401 across seeds 1 to 10 (76 at the default seed), and the SDMLp key never leads, under the Hamming-distance model at 0, 2, 5, and 10% mismatch. **Profiled device** gives the attacker the exact noise-free leakage of every input, a best case for the attacker: static CMOS then falls in 4 to 14 traces, and SDMLp with 2% mismatch falls within 5,000 traces in six of 10 seeds (538 to 3,518 traces), with 5% mismatch in all 10. Perfect balance leaks nothing under any model. The simulation, the models, and the seeds are this page's, not the paper's; the paper attacked HSPICE traces of one DES round and does not state its leakage model beyond the frameworks it cites.
</div>

## What the paper found

<div data-levels="public" markdown="1">
- A single, carefully designed cell can build any logic a cipher needs, while drawing the same amount of current every clock.
- Built from that cell, a full DES chip used 43% less area and 50% less power than an earlier secure design, WDDL.
- A power attack that broke the ordinary chip after 70 measurements could not find the key in the SDMLp or WDDL chips after 5,000.
- The protection costs speed: the SDMLp chip ran at 66.67 MHz, against 100 MHz for ordinary logic and 83.33 MHz for WDDL.
</div>

<div data-levels="hs" markdown="1">
- Across four basic gates, the current swing of ordinary logic averaged 53.15 units against 1.325 for SDMLp, about 40 times larger (Table II).
- Every SDMLp gate has the same area, 18.4 λ², because every gate is the same cell with different inputs (Table IV).
- Across the eight DES S-boxes, the current variation of ordinary logic averaged 4,293 units against 4.66 for SDMLp (Table VIII).
- For the full DES chip, SDMLp used 1.47 mW, ordinary logic 1.37 mW, and WDDL 2.96 mW (Table IX).
</div>

<div data-levels="ug grad res" markdown="1">
- **One cell, any function.** A dual-rail CPL multiplexer with a PMOS pre-discharge network realizes every two-input function (Table I) and maps one-to-one onto ROBDD nodes.
- **Near-constant current.** Cell-level current variance drops from an SCMOS average of 53.15 to 1.325 × 10⁻⁹ A² (WDDL 7.81); full-chip variance from 1,892.3 (SCMOS) and 229.1 (WDDL) to 5.95 × 10⁻⁶ A².
- **Cheaper than WDDL.** Full-chip DES: 18,715 against 32,715 λ² and 1.47 against 2.96 mW, at 66.67 against 83.33 MHz.
- **Attack resistance.** One-round DPA recovered the SCMOS subkey (20) in 70 vectors and neither DDL subkey in 5,000; the authors expected more traces would not help.
- **Next steps.** A comparative side-channel analysis against other styles, and DES chips in all three styles then in fabrication.
</div>

<div data-levels="grad res" markdown="1">
<div class="sd-table-wrap">
<table class="results-table">
<caption class="w-note">Full-chip DES (Table IX) with ratios recomputed by this page.</caption>
<thead><tr><th>Metric</th><th>SCMOS</th><th>SDMLp</th><th>WDDL</th><th>SDMLp vs. WDDL</th><th>SDMLp vs. SCMOS</th></tr></thead>
<tbody>
<tr><td>Area (λ²)</td><td>13,247.21</td><td>18,715.26</td><td>32,714.64</td><td>−42.8%</td><td>+41.3%</td></tr>
<tr><td>Total power (mW)</td><td>1.37</td><td>1.47</td><td>2.96</td><td>−50.3%</td><td>+7.3%</td></tr>
<tr><td>Max. frequency (MHz)</td><td>100</td><td>66.67</td><td>83.33</td><td>−20.0%</td><td>−33.3%</td></tr>
<tr><td>Current variance (10⁻⁶ A²)</td><td>1,892.3</td><td>5.95</td><td>229.1</td><td>38.5× lower</td><td>318× lower</td></tr>
</tbody>
</table>
</div>
</div>

## Why it matters

<div data-levels="public hs" markdown="1">
Smart cards, payment terminals, and small connected devices all carry secret keys, and many of them end up in the hands of people who could attach a probe. Changing the mathematics of a cipher does nothing against this kind of attack, because the leak comes from the transistors. SDMLp moves the defense into the logic itself, at a lower cost in area and power than the secure design that came before it. Ultimately, a key is only as safe as the wires that carry it.
</div>

<div data-levels="ug" markdown="1">
Logic-level countermeasures protect every gate the same way, with no knowledge of the algorithm, which makes them reusable across ciphers. Their cost has kept them out of low-power parts: WDDL roughly doubles area and power. SDMLp narrows that gap with a single cell and a synthesis flow built on decision diagrams, so the designer picks a variable order rather than hand-placing complementary gates. The trade it accepts is speed, from series pass transistors.
</div>

<div data-levels="grad res" markdown="1">
SDMLp's guarantee is structural: one transition per rail pair per cycle, independent of data, provided the rails are balanced and inputs arrive together. The paper evaluates that guarantee in simulation, with constant output loads and one correlation attack, which establishes the first-order behavior. The simulation on this page shows where the remaining risk sits: a perfectly balanced model leaks nothing, while a few percent of rail mismatch gives a profiled attacker a foothold that a Hamming-distance attacker never finds. Routing balance, early propagation, and higher-order or template attacks are where later evaluations of dual-rail styles have concentrated.
</div>

<div data-levels="res" markdown="1">
## Notes from building this page

- **Summary rows reproduce.** All 21 average and standard deviation rows of Tables II to VIII reproduce from their columns when the standard deviation uses n − 1. Two are truncated rather than rounded: Table VI SDMLp (152.58 printed as 152) and Table VIII SCMOS (4,342.81 printed as 4,342).
- **Speed comparison in the abstract.** The abstract places the 20% speed penalty "against SCMOS"; Table IX gives 20.0% against WDDL and 33.3% against SCMOS, and the conclusion states the 20% against WDDL.
- **"Approximately 2 fold reduction in area."** The full-chip ratio to WDDL is 1.75 (32,715 against 18,715 λ²); for the S-boxes it is 1.58 (2,460 against 1,558 λ²); for single gates it is 1.05 (19.4 against 18.4 λ², Table IV).
- **Where "40 fold" comes from.** The full-chip current variance ratio to WDDL is 38.5; the cell-level ratio of SCMOS to SDMLp averages (Table II) is 40.1. The conclusion pairs "40 fold" with "existing secure libraries," which matches the first.
- **SDMLp against SCMOS.** S-box area and power run 1.41 and 1.44 times SCMOS (Tables VI and VII), while the full-chip power is only 1.07 times SCMOS (Table IX). The paper does not break down the full-chip power, so the reason for the smaller gap is open.
- **Two groups in Table VIII.** SCMOS current variation for S-boxes 1, 4, 6, and 7 (7,490 to 9,420) is 23 to 51 times that of S-boxes 2, 3, 5, and 8 (186 to 323). The paper does not comment; SDMLp and WDDL show no such split.
- **Cell counts against Table VI.** The page's fewest-cell counts (51, 49, 48, 32, 53, 49, 48, 43 for S1 to S8, complement sharing, literals as wires, outputs shared) rank with the SDMLp areas at ρ = 0.83, and S-box 4 is smallest in both. The fit slope, 20.5 λ² per cell, sits near the Table IV cell area. The paper names CUDD's "optimal variable ordering" without saying whether it minimized nodes or cells or which reordering method ran; minimizing nodes instead gives the same counts here.
- **Attack details the paper leaves open.** Which S-box, the leakage model, and the number of key bits attacked are not stated beyond "64 key guesses" and the cited frameworks. The page attacks S-box 1 with a Hamming-distance model. Its static CMOS result at the default seed (76 traces) is close to the paper's 70, but the spread across seeds (28 to 401) shows that one run does not pin the number down.
- **Balance is the defense.** In simulation, rail mismatch is the only SDMLp leak. Over seeds 1 to 10, a Hamming-distance attacker never exploits it within 5,000 traces at up to 10% mismatch, and a Hamming-weight attacker does once (10% mismatch, 4,942 traces), but a profiled attacker does at 2% in six of 10 seeds. The paper's HSPICE runs use equal loads, so its 5,000-trace result reflects a balanced layout.
</div>

<div data-levels="hs" markdown="1">
## Try this in class

1. In the first demo, choose XOR and write out all four combinations of A and B. For each, record which wire rises during evaluation, Out or Outbar, and confirm that exactly one rises every time.
2. In the second demo, pick S-box 1 and record the cell count for **Order b1…b6** and for **Best of 720**. Repeat for S-box 4, then untick **Share complementary nodes** and explain in one sentence why the count grows.
3. In the attack demo, record the trace number where the correct key takes the lead against static CMOS at noise 0, 1, and 3. Plot the three points and describe what more noise costs the attacker.
</div>

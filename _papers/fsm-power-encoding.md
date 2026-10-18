---
title: "Secure State Encoding: Hiding a Controller's Steps from Its Power Draw"
kicker: "Interactive paper · Journal of Electronic Testing 2019"
subtitle: "An interactive companion to Richa Agrawal, Ranga Vemuri, and Mike Borowczak's method for choosing the bit patterns of a finite state machine so its power trace stops giving away where it is and where it is going."
description: "Watch a small controller leak its state through power, then group its states by when they can be reached, search for secure encodings in your browser, and trade security against bits and power the way the paper does."
share_description: "A chip's power draw can reveal which state its controller is in. Choosing the right bit patterns hides it. Run the paper's method on MCNC benchmark state machines in your browser, written for five reading levels."
share_text: "A chip's power draw can reveal which state its controller is in. Choosing the right bit patterns hides it. Try the method in your browser:"
share_image: /papers/fsm-power-encoding/share.png
share_image_alt: "The ten-state BBARA controller drawn as a graph, its states colored into four groups and labeled with six-bit secure codes, beside the title Secure State Encoding."
date: 2026-10-18
default_level: public
level_hints:
  public: No background needed
  hs: Bits, binary numbers, and a little algebra
  ug: Digital logic and state machines
  grad: Probability, side channels, and logic synthesis
  res: Full method, reproduction, and open questions
authors:
  - name: Richa Agrawal
    affiliation: University of Cincinnati
  - name: Ranga Vemuri
    affiliation: University of Cincinnati
  - name: Mike Borowczak
    affiliation: University of Wyoming
    member: mike-borowczak
sources:
  - venue: "J. Electronic Testing 35:621–639 · 2019"
    title: "A State Machine Encoding Methodology Against Power Analysis Attacks"
    url: https://doi.org/10.1007/s10836-019-05821-z
    access: Paywalled (Springer)
  - venue: "IEEE VLSID · 2019"
    title: "A State Encoding Methodology for Side-Channel Security vs. Power Trade-off Exploration"
    url: https://doi.org/10.1109/VLSID.2019.00031
    access: Conference version, paywalled (IEEE)
code:
  label: "LGSynth'91 / MCNC benchmark state machines (KISS2), as packaged in ispras/hdl-benchmarks"
  url: https://github.com/ispras/hdl-benchmarks/tree/master/lgsynth91/kiss2
citations:
  - JETTD
  - LPFSMrAgrawal
widget:
  css:
    - /papers/fsm-power-encoding/widget.css
  js:
    - /papers/fsm-power-encoding/fsm-engine.js
    - /papers/fsm-power-encoding/widget.js
credit: "Interactive page by the [DRACO Lab](/). The browser engine computes state transition probabilities, the paper's Algorithm 1, switching activity, and Hamming leakage values for MCNC benchmark machines, and searches for encodings under the paper's constraints. It reproduces the paper's BBARA switching activities for its secure (0.5148) and low power & secure (0.445) encodings, its Figure 6 set division state for state, and seven of the nine power values in Table 7 to within 0.01. An independent Z3 model of the paper's constraints agrees with the browser search on the shortest encoding at every security level. Everything runs on your device."
bibtex: |
  @article{agrawal2019jetta,
    author  = {Agrawal, Richa and Vemuri, Ranga and Borowczak, Mike},
    title   = {A State Machine Encoding Methodology Against Power Analysis Attacks},
    journal = {Journal of Electronic Testing},
    volume  = {35},
    number  = {5},
    pages   = {621--639},
    year    = {2019},
    doi     = {10.1007/s10836-019-05821-z}
  }

  @inproceedings{agrawal2019vlsid,
    author    = {Agrawal, Richa and Borowczak, Mike and Vemuri, Ranga},
    title     = {A State Encoding Methodology for Side-Channel Security vs. Power Trade-off Exploration},
    booktitle = {2019 32nd International Conference on VLSI Design and 2019 18th International Conference on Embedded Systems (VLSID)},
    pages     = {70--75},
    year      = {2019},
    doi       = {10.1109/VLSID.2019.00031}
  }
---

<div class="lede" data-levels="public" markdown="1">
Small chips run on simple controllers that step from one state to the next: idle, waiting, sending, done. Each state is stored as a short pattern of ones and zeros, and every pattern draws a slightly different amount of power. Someone measuring that power from outside can work out which step the chip is on and, with patience, rebuild how the controller works. Richa Agrawal, Ranga Vemuri, and Mike Borowczak showed how to choose the patterns so that many states look alike on a power meter, and how to do it without paying much in extra size or battery.
</div>

<div class="lede" data-levels="hs" markdown="1">
A finite state machine is a controller that is always in one of a fixed set of states and moves between them as inputs arrive. Inside a chip, each state is a binary code held in a few flip-flops. Flipping a bit from 0 to 1 costs a little energy, so a power trace rises and falls with the codes the machine passes through. This paper picks the codes on purpose: states the machine could be in at the same moment get codes with the same number of ones, and moves that could happen at the same moment flip the same number of bits. This page lets you watch the leak, then close it.
</div>

<div class="lede" data-levels="ug" markdown="1">
Power analysis attacks fit a power model (Hamming weight of the state register, Hamming distance of each transition, or a switching distance that weights rising bits more than falling ones) to measured traces, then use the fit to tell states and transitions apart. Agrawal, Vemuri, and Borowczak defend finite state machines (FSMs) at the encoding step, before synthesis: they partition states by how many clock cycles it most likely takes to reach them, require equal Hamming weight within each group and equal Hamming distance within each group of transitions, and let a satisfiability solver find the codes. A single knob, the number of groups *l*, trades security for encoding length, area, and power.
</div>

<div class="lede" data-levels="grad" markdown="1">
A secure state assignment method for small controllers that cannot afford dual-rail or masked logic. Using state transition probabilities (STPs) from the stationary distribution under uniform random inputs, a max-heap traversal assigns each state the most probable cycle count at which it is reached; states (transitions) in the same reachability set must share a Hamming weight (distance). Encodings come from a Z3 SMT model, optionally minimizing expected switching activity. Across more than 100 BenGen and MCNC benchmarks synthesized at 90 nm and simulated with 1,000 random input vectors, mutual information between simulated power and the Hamming models falls toward zero as *l* shrinks, at a cost of 15 to 40 percent more encoding bits for unmodified machines.
</div>

<div class="lede" data-levels="res" markdown="1">
Agrawal, Vemuri, and Borowczak (J. Electronic Testing, 2019) consolidate a HOST 2018 restructuring method and the VLSID 2019 low-power extension into one methodology with three variants: restructured secure FSMs (self-loops split into state pairs, then all three Hamming models equalized), secure original FSMs (self-loops kept), and secure low-power original FSMs (an added switching-activity objective). This page ports the STP computation, Algorithm 1, the switching activity estimate (Eq. 9 and 11), and the constraint model of Section 5 to JavaScript, runs them on the LGSynth'91 KISS2 benchmarks, and checks the results against Tables 2, 3, 4, and 7 and Figures 5, 6, and 13. Gate-level power simulation and the mutual information study (Tables 5, 6, and 8) are out of reach in a browser; the page reports them from the paper.
</div>

## What the power meter sees

<div id="fp-trace" class="w-demo"></div>

<div data-levels="public" markdown="1">
This is BBARA, a 10-state controller from a standard collection of test circuits. Press **Run** to feed it random inputs. The top bars show how many of its storage bits hold a one (more ones, more power); the bottom bars show how many bits flip on each tick (more flips, a bigger spike). With the minimal code, a reading narrows the machine to at most three states, and the code 1111 belongs to st4 alone. Switch to **Low power & secure**: every state shows one of only two readings, and every move between different states flips exactly two bits.
</div>

<div data-levels="hs" markdown="1">
The minimal code uses four bits, the fewest that can number 10 states (2⁴ = 16). Its states carry anywhere from zero to four ones, so the top row takes five different heights. The paper's secure codes spend one or two extra bits so the counts line up: in the six-bit code, six states hold two ones and four hold four, and any move from one state to a different one flips exactly two bits. Most ticks leave BBARA where it is (about 78 percent under random inputs), which shows up as a zero in the bottom row for every code.
</div>

<div data-levels="ug" markdown="1">
The three codes are the paper's Table 3. The top row is the Hamming weight model, HW(E(s)); the bottom row is the Hamming distance model, HD(E(s₁), E(s₂)). Under the minimal code the register takes five weights and five distances. The secure code narrows that to weights {1, 3} and distances {0, 2, 4}; the low power & secure code to weights {2, 4} and distances {0, 2}, one bit longer. A distance of zero marks a self-loop, which the "original FSM" variants keep to save area and power; the restructured variant splits such states in two so even that reading disappears.
</div>

<div data-levels="grad res" markdown="1">
The simulation draws each four-bit input uniformly, the paper's assumption for both STPs and the attacker's stimulus. The readout counts the states that share the current weight, which is the attacker's ambiguity under the HW model with a single noiseless sample. The paper measures leakage differently: it synthesizes each encoding at 90 nm, simulates 1,000 random input vectors in Nanosim, and computes the mutual information between those power traces and each Hamming model. Average simulated power for the three BBARA encodings was 1.59, 1.56, and 1.41 µA.
</div>

## Grouping states by when they can be reached

<div id="fp-sets" class="w-demo"></div>

<div data-levels="public" markdown="1">
The trick is to decide which states need to look alike. Starting from the first state, the method follows the likeliest path through the machine and numbers each state by how many steps it takes to get there. States with the same number could be the answer to "where is the machine after three steps?", so they get codes with the same count of ones. Drag the slider: fewer groups means more states must look alike, which is safer and needs more bits.
</div>

<div data-levels="hs" markdown="1">
Line thickness shows how often the machine takes each path when every input is equally likely. The method keeps a list of paths ordered by likelihood, always follows the likeliest path to a state it has not numbered yet, and gives that state the next number. The slider sets *l*, the number of groups; numbers wrap around after *l* (like a clock), so with four groups, steps 1, 5, and 9 share a group. With *l* = 1 every state must carry the same number of ones.
</div>

<div data-levels="ug" markdown="1">
The STPs come from the stationary distribution: solve P(sₙ) = Σₘ P(sₘ) P(Iₘₙ) with Σ P(sₘ) = 1, then P(sₘ, sₙ) = P(sₘ) P(Iₘₙ), where P(Iₘₙ) is the fraction of input vectors that move sₘ to sₙ. Missing inputs become self-loops, as the paper's FSM checker does (S8 needs 60 of its 80 state and input pairs filled this way). Algorithm 1 then runs a heap-ordered traversal from the start state, ignoring self-loops, and sets SN(v) = (SN(u) + 1) mod *l*. A transition inherits the set of its source state.
</div>

<div data-levels="grad res" markdown="1">
Every state has some most-probable cycle count, so the sets approximate the L-reachability sets S<sub>L</sub> and T<sub>L</sub> of Section 3.1 (exact sets would force near one-hot codes whenever a state is reachable at many cycle counts). The traversal yields *L*<sub>max</sub> sets, seven for BBARA. At *l* = 4 the browser's partition matches the paper's Figure 6 state for state.
</div>

<div data-levels="res" markdown="1">
The paper's pseudocode orders the heap by STP. Ordered that way, three BBARA states (st4, st5, and st6) land in different sets from Figure 6. Ordering by the input probability P(I<sub>mn</sub>) alone, with first-in, first-out ties, reproduces Figure 6 exactly, so the page uses that order everywhere; the switch above shows both. The figure's edge labels are the transition probabilities summed over both directions and scaled by 16, the number of input vectors, consistent with the integer scaling the authors describe for Z3.
</div>

## Finding a secure encoding

<div id="fp-encode" class="w-demo"></div>

<div data-levels="public" markdown="1">
Here the page searches for codes that follow the rule: same group, same number of ones. It starts with the fewest bits possible and adds one at a time until the rule can be met. **Secure and low power** also picks, among all codes of that length, the ones that flip the fewest bits on the paths the machine takes most, which saves battery. Press **Search again in your browser** to watch your own device do the search.
</div>

<div data-levels="hs" markdown="1">
For BBARA with four groups, no five-bit code meets the rule, so the search settles on six bits, the same length the paper reports. Compare the weight column with the group column: every state in a group has the same number of ones. Switching activity is the expected number of bit flips per clock tick; lower activity means lower power. Try *l* = 1: every state then holds three ones, which costs seven bits.
</div>

<div data-levels="ug" markdown="1">
The constraints are those of Section 4.4: distinct codes, equal HW within each state set, and equal HD within each transition set (self-loops excluded), searched for R from ⌈log₂ M⌉ upward. The secure and low-power mode then minimizes switching activity, SA = Σ P(sₘ, sₙ) · HD(E(sₘ), E(sₙ)) (Eq. 11). The paper hands these constraints to the Z3 solver; this page runs a branch-and-bound search over the same constraints and fixes the first state's code up to bit permutation, which changes no weight or distance. For BBARA at *l* = 4 it finds SA = 0.4452 at six bits, the paper's low power & secure value (0.445).
</div>

<div data-levels="grad res" markdown="1">
The switching distance row uses the paper's model: a rising bit costs 1 and a falling bit 1 − δ, with δ = 0.17. Equal weights and equal distances force equal switching distances within a transition set, since rises equal (D + W₂ − W₁)/2 and falls (D − W₂ + W₁)/2 (Eq. 1 to 3). The last row is this page's own leakage measure, not the paper's: with inputs uniform, a reading is a deterministic function of the state (or transition), so the mutual information between state and reading equals the entropy of the reading under the stationary distribution (or the STPs). It falls to zero for the weight model at *l* = 1 and stays at the self-loop entropy for distances, mirroring the paper's finding that original FSMs can reach zero leakage only under the weight model.
</div>

## Security against size and power

<div id="fp-tradeoff" class="w-demo"></div>

<div data-levels="public" markdown="1">
Each column is one setting of the slider. Fewer groups (to the left) make more states look alike, so a power meter learns less; the price is extra storage bits and, often, more bit flips per tick. Pick other machines from the row of names to see how the trade changes from one controller to the next.
</div>

<div data-levels="hs" markdown="1">
For BBARA, the minimal code needs four bits. With seven down to five groups, the secure code needs five; with three or four groups, six; with one or two, seven. The middle chart counts how many different weights the register ever shows: four for a plain binary count (0000 to 1001), one at *l* = 1. The dotted marks are the lengths the paper plotted in its Figure 13.
</div>

<div data-levels="ug grad res" markdown="1">
Bars are the browser's results: the shortest R that satisfies the constraints at each *l*, then the minimum SA at that R. The search is exhaustive unless the page says it hit its budget (the low-power step does at two MODULO12 settings). For BBARA, the browser agrees with Figure 13 at *l* = 1 and *l* = 5 to 7 and needs one more bit at *l* = 2 to 4; the researcher notes below explain why. Encoding length need not fall steadily with *l*: for BBTAS, *l* = 5 needs four bits while *l* = 4 and *l* = 6 need three, because each *l* produces a different partition, not a refinement of the last.
</div>

<div data-levels="res" markdown="1">
The paper's aggregate results come from synthesized circuits and cannot be recomputed here. Averaged over the original benchmark FSMs, mutual information against the HW, HD, and SD models fell from 1.66, 1.75, and 2.57 bits under minimal encoding to 0, 0.66, and 0.86 at *l* = 1 (Table 5). Area rose 40.01 percent at *l* = 1 and 12.90 percent at *L*<sub>max</sub> (Table 6), and the low-power constraint cut power 13 to 19 percent against secure-only encodings at the same *l* (Table 8).
</div>

## Lowest-power codes, no security required

<div id="fp-power" class="w-demo"></div>

<div data-levels="public" markdown="1">
The same search can ignore security and look only for the codes that flip the fewest bits. The paper compared its results with three older tools on nine test controllers, and this page repeats that search on your device. Seven of the nine rows agree to within 0.01.
</div>

<div data-levels="hs ug" markdown="1">
Each row searches every way of giving the machine's states distinct codes of minimal length and keeps the one with the fewest expected bit flips per tick. NOVA and JEDI are classic state assignment programs that optimize for area; the sequential algorithm is a power-oriented heuristic. Power follows the paper's Eq. 10, P = ½ V<sub>DD</sub>² f C · SA. Press **Run** on a row to repeat its search; BBARA takes a few seconds.
</div>

<div data-levels="grad res" markdown="1">
The page reproduces the SAT column for BBARA, BBTAS, DK14, DK27, MODULO12, S27, and S8. BEECOUNT (79.18 in the paper, 80.54 here) and TRAIN11 (62.50 against 78.13) differ; both are incomplete machines, and the paper notes that incomplete MCNC machines "were modified before calculating state transition probabilities" without saying how, so their STPs likely differ from the self-loop completion used here. With the stated parameters (5 V, 5 MHz, 3 pF), Eq. 10 gives microwatts, while the table header says milliwatts.
</div>

## What the paper found

<div data-levels="public" markdown="1">
- Choosing the codes carefully hides which state a controller is in from the simplest power model, at a cost of extra storage bits that the designer controls.
- Fully secure designs that also hide when the machine stays put needed about twice the area; keeping those "stay put" steps visible cut the extra area to about 37 percent.
- Adding a low-power goal saved power at every security level with almost no extra area.
- The paper's approach cost far less area than special secure logic styles, which take three to four and a half times the area and run at half speed.
</div>

<div data-levels="hs" markdown="1">
- At the strongest setting, an attacker's power model told nothing about which state the machine was in (zero mutual information against the weight model).
- Secure codes for unmodified machines were 15 to 40 percent longer than minimal codes; machines rebuilt to hide self-loops needed 40 to 70 percent more bits.
- Power rose by a factor of 1.6 for secure original machines and 3.4 for rebuilt ones, and the low-power goal trimmed 4 to 20 percent.
- One setting, the number of groups *l*, moves a design anywhere between minimal code and full security.
</div>

<div data-levels="ug grad res" markdown="1">
- **Graded security.** Decreasing *l* lowers mutual information between simulated power and all three Hamming models; restructured FSMs reach zero against HW, HD, and SD, and original FSMs reach zero against HW only (Fig. 10, Table 5).
- **Encoding cost.** Maximum security lengthens encodings 15 to 40 percent for original FSMs and 40 to 70 percent for restructured ones, which add 60 percent more states and 158 percent more transitions on average (Fig. 12).
- **Area.** At maximum security, area grows by a factor of 1.37 (original) or 2.04 (restructured), against 3.2 to 3.6 for WDDL and 4.5 for MDPL, both of which also halve speed (Section 7.2).
- **Power.** Secure designs draw 1.6 (original) and 3.4 (restructured) times the power of minimal encodings; the switching activity constraint cuts 0 to 40 percent, 15 percent on average at maximum security, with no loss of security (Fig. 16, Table 8).
- **Scaling.** The SMT search is exact but its run time grows exponentially with machine size and connectivity, which limits it to small and medium FSMs (Section 7.3).
</div>

<div data-levels="grad res" markdown="1">
<div class="fp-table-wrap">
<table class="results-table">
<caption class="w-note">Average mutual information between simulated power and each Hamming model, original FSMs (Table 5). ME is unconstrained minimal encoding.</caption>
<thead><tr><th><em>l</em></th><th>HW</th><th>HD</th><th>SD</th><th>HW, low power</th><th>HD, low power</th><th>SD, low power</th></tr></thead>
<tbody>
<tr><td>1</td><td>0</td><td>0.66</td><td>0.86</td><td>0</td><td>0.70</td><td>0.75</td></tr>
<tr><td>2</td><td>0.69</td><td>1.00</td><td>1.55</td><td>0.70</td><td>0.99</td><td>1.64</td></tr>
<tr><td><em>L</em><sub>median</sub></td><td>0.87</td><td>1.18</td><td>1.89</td><td>0.78</td><td>1.12</td><td>1.81</td></tr>
<tr><td><em>L</em><sub>max</sub></td><td>1.31</td><td>1.37</td><td>2.24</td><td>1.31</td><td>1.25</td><td>2.10</td></tr>
<tr><td>ME</td><td>1.66</td><td>1.75</td><td>2.57</td><td>1.66</td><td>1.75</td><td>2.57</td></tr>
</tbody>
</table>
</div>

<div class="fp-table-wrap">
<table class="results-table">
<caption class="w-note">Area and power of original FSMs as l grows (Tables 6 and 8).</caption>
<thead><tr><th><em>l</em></th><th>Area, secure</th><th>Area, secure and low power</th><th>Power, low power vs. secure</th><th>Power, low power vs. ME</th></tr></thead>
<tbody>
<tr><td>1</td><td>+40.01%</td><td>+34.17%</td><td>−16.29%</td><td>+3.71%</td></tr>
<tr><td>2</td><td>+27.85%</td><td>+29.38%</td><td>−13.06%</td><td>+6.93%</td></tr>
<tr><td><em>L</em><sub>median</sub></td><td>+17.32%</td><td>+19.59%</td><td>−15.50%</td><td>+7.84%</td></tr>
<tr><td><em>L</em><sub>max</sub></td><td>+12.90%</td><td>+12.71%</td><td>−18.51%</td><td>−7.97%</td></tr>
</tbody>
</table>
</div>
</div>

## Why it matters

<div data-levels="public hs" markdown="1">
Billions of small devices (door locks, sensors, medical monitors, drones) run on controllers too small for heavy cryptographic protection. This paper moves part of the defense into a choice designers already make, which bit pattern stands for which state, so protection costs a few extra bits instead of a redesign. The designer also chooses how much protection to buy, since every step toward full security costs some size and power.
</div>

<div data-levels="ug" markdown="1">
State assignment happens before logic synthesis in every FSM design flow, so a constraint there needs no new cells, no new libraries, and no change in clock speed. Cell-level defenses such as WDDL and MDPL equalize power for every gate, at three to four and a half times the area. Constraining only the state register targets the part of a controller that carries its secrets, its sequence of states, and leaves the rest of the flow untouched.
</div>

<div data-levels="grad res" markdown="1">
The method gives designers an explicit security parameter with measured costs in bits, area, and power, and a low-power variant that recovers much of the overhead. Its limits are equally explicit: the Hamming models stand in for the attacker, the STPs assume uniform independent inputs, the guarantees cover the state register rather than the next-state and output logic, and exact SMT search does not scale to large controllers. The authors list combined power and cryptanalysis attacks and deep sub-micron feasibility as future work.
</div>

<div data-levels="res" markdown="1">
## Notes from building this page

- **Figure 6 needs the heap ordered by input probability.** With the heap keyed on STP as written in Algorithm 1, st4, st5, and st6 fall into different BBARA sets; keyed on P(I<sub>mn</sub>) with first-in, first-out ties, all 10 states match. The page uses the second order throughout.
- **The five-bit secure BBARA encoding breaks one constraint.** Under the Figure 6 partition, the Table 3 secure code gives the transitions out of set 3 (st2, st5, and st9) distances of both 2 and 4. Exhaustive search here, cross-checked with an independent Z3 model of Section 5.2, finds no five-bit encoding for *l* = 4, so six bits is the shortest. That matches the low power & secure column and explains why the page needs one bit more than Figure 13 at *l* = 2 to 4.
- **Table 3's minimal-encoding activity.** The printed four-bit codes give SA = 0.4265 rather than 0.443; the secure (0.5148) and low power & secure (0.4452) columns match exactly. Changing a single code (st2 from 0100 to 0101, for example) yields 0.4432, so a transcription difference in one code is the likeliest explanation.
- **Table 4's switching distance lists.** For the minimal and secure codes, the page finds different sets of rise and fall combinations than Table 4 prints (it lists 4 − 4δ for the minimal code, which needs a transition from 1111 to 0000 that BBARA does not have). The Hamming weight and distance lists match for all three encodings.
- **Figures 5 and 6 STPs.** The S8 values in Figure 5 match the self-loop completion of missing inputs to two decimals; one DK15 label (0.14 from s2 to s3) computes to 0.19 here, the same as the s2 self-loop.
- **Table 7 units and incomplete machines.** Seven of nine rows reproduce to within 0.01 when Eq. 10 is read in microwatts. BEECOUNT and TRAIN11 differ, likely because their incomplete transitions were completed differently.
- **The leakage measure in the encoding demo** (entropy of the reading under the stationary distribution) is this page's addition. It captures single-sample, noiseless leakage of each model and does not replace the paper's mutual information between simulated power and model.
</div>

<div data-levels="hs" markdown="1">
## Try this in class

1. Write the 10 BBARA states in the four-bit minimal code and count the ones in each. Which states could an attacker identify from the count alone?
2. With the slider at *l* = 4, list the states in each group. Check in the encoding table that every state in a group has the same number of ones, and count how many bits flip on two transitions of your choice.
3. Set *l* to 1 and then to 7. Explain in a short paragraph what the designer gains and what the designer pays at each end.
</div>

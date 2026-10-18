---
title: "Ordering In-Memory Logic: How a Genetic Algorithm Saves Memory Cells"
kicker: "Interactive paper · IEEE MWSCAS 2024"
subtitle: "An interactive companion to Andey Robins and Mike Borowczak's SAGA, which evolves the order of logic operations inside a memristor memory so a circuit fits in fewer cells."
description: "Run a small circuit gate by gate and watch memory fill and empty, see how gate order changes the memory a benchmark circuit needs, and evolve better orders in your browser with a port of the authors' genetic algorithm."
share_description: "Computing inside memory saves energy, but every intermediate value needs a cell. Changing only the order of operations can cut that by up to half. Evolve orders in your browser, written for five reading levels."
share_text: "Computing inside memory saves energy, but every intermediate value needs a cell. Changing only the order of operations can cut that by up to half. Try it in your browser:"
share_image: /papers/saga-in-memory/share.png
share_image_alt: "Two memory occupancy charts for the 5xp1 benchmark circuit, a breadth-first order needing 56 cells above SAGA's order needing 38, beside the title Ordering In-Memory Logic."
date: 2026-10-18
default_level: public
level_hints:
  public: No background needed
  hs: Logic gates, binary, and a little algebra
  ug: Digital logic, graphs, and programming
  grad: Logic synthesis, heuristics, and statistics
  res: Full method, reproduction, and open questions
authors:
  - name: Andey Robins
    affiliation: University of Central Florida
    link: http://portfolio.andeyrobins.org/
  - name: Mike Borowczak
    affiliation: University of Central Florida
    member: mike-borowczak
sources:
  - venue: "IEEE MWSCAS · 2024"
    title: "SAGA: Synthesis Augmentation with Genetic Algorithms for In-Memory Sequence Optimization"
    url: https://ieeexplore.ieee.org/document/10658837
    access: Paywalled (IEEE)
  - venue: "arXiv 2406.09677 · 2024"
    title: "SAGA: Synthesis Augmentation with Genetic Algorithms for In-Memory Sequence Optimization"
    url: https://arxiv.org/abs/2406.09677
    access: Open access preprint
code:
  label: "andey-robins/saga (Go, GPLv3)"
  url: https://github.com/andey-robins/saga
citations:
  - mwscas2024
widget:
  css:
    - /papers/saga-in-memory/widget.css
  js:
    - /papers/saga-in-memory/go-compat.js
    - /papers/saga-in-memory/saga-engine.js
    - /papers/saga-in-memory/widget.js
credit: "Interactive page by the [DRACO Lab](/). The browser engine is a JavaScript port of the authors' SAGA tool (GPLv3, as is the port), with Go's random number generator and sort carried over so that a seed gives the same run in both. Against the Go tool it matches 800 random orders, 800 mutations, and 16 small evolutionary runs generation by generation, and full runs at the paper's settings (population 2,000, ε = 50) return identical orders on cm150a (five seeds), 5xp1, and clip. The four benchmark netlists come from the SAGA repository; their gate counts equal the cycle counts in the paper's Table I. Everything runs on your device."
bibtex: |
  @inproceedings{robins2024saga,
    author    = {Robins, Andey and Borowczak, Mike},
    title     = {{SAGA}: Synthesis Augmentation with Genetic Algorithms for In-Memory Sequence Optimization},
    booktitle = {2024 IEEE 67th International Midwest Symposium on Circuits and Systems (MWSCAS)},
    year      = {2024},
    month     = {August},
    publisher = {IEEE},
    url       = {https://ieeexplore.ieee.org/document/10658837},
    eprint    = {2406.09677},
    archivePrefix = {arXiv}
  }
---

<div class="lede" data-levels="public" markdown="1">
Most computers spend more energy moving data between memory and processor than computing with it. One fix is to compute inside the memory itself, using memory cells that can also act as logic gates. Every in-between result then needs its own cell until nothing else needs it, so the order in which a circuit's steps run decides how much memory it takes. Andey Robins and Mike Borowczak let a genetic algorithm, a search that breeds and mutates candidate orders the way nature breeds traits, find orders that use fewer cells. On ten standard test circuits it cut the memory needed by up to 52.8 percent.
</div>

<div class="lede" data-levels="hs" markdown="1">
A memristor is a memory cell whose resistance stores a bit, and a few of them wired together can compute a NOR gate by writing the answer into an empty cell. Any digital circuit can be built from NOR and NOT gates, so a memristor array can run any circuit one gate at a time. The answer to each gate occupies a cell until every gate that reads it has run. SAGA, the tool in this paper, searches for the gate order that keeps the fewest answers waiting at once.
</div>

<div class="lede" data-levels="ug" markdown="1">
MAGIC (memristor-aided logic) computes NOR and NOT inside a memristive crossbar by writing results into cells, so a netlist becomes a sequence of writes. Any topological order of the netlist's graph is a valid schedule, and schedules differ in how many values are alive at once, which sets the number of cells the crossbar must provide. Robins and Borowczak treat schedule choice as a search over topological sorts and solve it with a genetic algorithm (GA), using order crossover and a mutation that only swaps gates with no dependency between them. Against SIMPLER, the earlier MAGIC mapping tool, SAGA needs fewer cells on nine of ten benchmarks.
</div>

<div class="lede" data-levels="grad" markdown="1">
SAGA is a final-stage optimization for write-based processing in memory (PIM). A RevLib circuit is minimized and mapped by ABC to a NOR-inverter graph, a breadth-first traversal seeds a population of topological sorts, and a generational GA minimizes the peak number of live values, measured by simulating each schedule with mark-and-sweep reclamation. With a population of 2,000, a 20 percent mutation rate, and stopping after ε generations without improvement, SAGA reduces area by 32.3 percent (geometric mean) against SIMPLER on 10 benchmarks, at a cost of 29.5 percent more cycles, for a 27.5 percent gain in SIMPLER's efficiency measure.
</div>

<div class="lede" data-levels="res" markdown="1">
Robins and Borowczak (MWSCAS 2024) cast MAGIC execution sequencing as a constrained permutation problem and apply a generational GA with single-point order crossover, dependency-aware swap mutation, and truncation selection. This page ports the authors' Go implementation (`andey-robins/saga` v0.2.0) to JavaScript, including Go's `math/rand` and `sort.Slice`, so that every run in the browser follows the Go tool step for step. It reproduces the paper's SAGA cycle counts for the four netlists shipped with the code and the paper's geometric-mean cycle and efficiency changes from Table I, runs the GA at the paper's settings, and records where the released code and the paper's description differ.
</div>

## Same gates, different order

<div id="sg-order" class="w-demo"></div>

<div data-levels="public" markdown="1">
This small circuit checks whether two four-digit binary numbers are equal. Each circle is a gate, and a gate can run once the gates above it have run. Tap gates in any order you like, and watch the row of memory cells below: a result stays in memory until every gate that needs it has used it. **Play breadth-first order** runs the gates row by row and needs 13 cells. **Play one bit at a time** finishes each digit before starting the next and needs 10, the fewest possible. Both compute the same answer.
</div>

<div data-levels="hs" markdown="1">
Each bit pair goes through four NOR gates that compute "a equals b" for that bit (p, q, r, and x), then a NOT gate; the bottom three levels combine the four answers. Running row by row starts all four bits at once, so their half-finished results pile up and the 25 gates need 13 cells. Finishing one bit before starting the next frees that bit's inputs and in-between results early, and 10 cells suffice. Count the bright cells in the strip after each tap and you can predict the total before you finish.
</div>

<div data-levels="ug" markdown="1">
The circuit is a 25-gate NOR-NOT netlist for a four-bit equality comparator. Memory follows SAGA's model: inputs occupy cells from the start, each gate writes its output into the lowest free cell, and a cell is reclaimed once all of its value's readers have executed. The breadth-first order (13 cells) and the bit-serial order (10 cells) are two of the circuit's valid topological sorts. An exhaustive search over all of them, run when the page loads, finds 10 as the minimum and 13 as the maximum.
</div>

<div data-levels="grad res" markdown="1">
With lowest-free reuse, a write needs one cell more than the number of live values just before it, so the peak depends only on which sets of gates have finished, not on the path between them. The page finds the bounds by dynamic programming over the circuit's 2,602 reachable sets of finished gates. Real benchmarks are far too large for that, which is the case for a heuristic search such as SAGA's GA.
</div>

## Memory over time on a benchmark circuit

<div id="sg-memory" class="w-demo"></div>

<div data-levels="public" markdown="1">
Each row of this chart is one memory cell, and each bar shows a value sitting in that cell from the moment it is written until the last gate that needs it has run. The height of the chart is the memory the circuit needs. Switch between the orders: running the gates in the most obvious order (breadth-first) stacks up more waiting values than the order SAGA found. Try the other circuits along the top.
</div>

<div data-levels="hs" markdown="1">
Gray bars are the circuit's inputs, blue bars are in-between results, and the short bright bars are outputs. On cm150a (52 gates, 21 inputs), the breadth-first order needs 25 cells and SAGA's order needs 22, the value the paper reports. On 9symml (306 gates), breadth-first needs 88 cells and SAGA's best order from a single run needs 64. **Random valid** draws a fresh legal order each time you press the button; most land between the two.
</div>

<div data-levels="ug" markdown="1">
The x axis is the write sequence (inputs loaded first, then one write per gate); a bar ends when the mark-and-sweep step frees its cell. The four circuits are the netlists in the authors' repository, and their gate counts (52, 160, 233, and 306) equal SAGA's cycle counts in Table I for cm150a, 5xp1, clip, and 9symml: one write per gate, with no parallel operations. SIMPLER's numbers in the readout come from its own mapping of each benchmark, with a different gate count, so the cell counts compare the two flows rather than two orders of one netlist.
</div>

<div data-levels="grad res" markdown="1">
The checkbox keeps every primary output in its cell until the end. The SAGA tool frees an output as soon as it is written, because its reference count (the number of gates that read it) is zero; on cm150a, clip, and 9symml nothing changes for either order, while on 5xp1, whose 10 outputs finish at different times, SAGA's order needs 41 cells instead of 38 and breadth-first needs 57 instead of 56. This check is the page's own; the paper does not discuss output retention.
</div>

## Evolve better orders

<div id="sg-evolve" class="w-demo"></div>

<div data-levels="public" markdown="1">
Press **Evolve in your browser** to run SAGA's search on your own device. It starts with hundreds of random legal orders (the gray marks at the left), keeps the best quarter, breeds new orders by splicing pairs together, and nudges every order with a small random swap that never breaks the circuit. The bright line is the best order so far. The search stops after a set number of rounds with no improvement.
</div>

<div data-levels="hs" markdown="1">
Each "generation" scores every order by simulating it and counting cells, so lower is better. The bright line falls in steps when the search finds a better order, and the fainter line (the average) shows the whole population improving. **Paper settings** uses the paper's population of 2,000 and stops after 50 quiet generations; on 5xp1 your device needs about 30 seconds. The dotted line marks the paper's result for those settings, and the dashed line marks SIMPLER.
</div>

<div data-levels="ug" markdown="1">
Crossover keeps the first part of one parent and appends the remaining gates in the other parent's order, which always yields a valid topological sort. Mutation picks a gate, rules out its ancestors and descendants, and swaps it with a remaining candidate until the result is valid. The seed makes a run repeatable: with the paper's settings and seed 1, the browser and the authors' Go tool return the identical order, needing 22 cells on cm150a, 38 on 5xp1, and 52 on clip.
</div>

<div data-levels="grad res" markdown="1">
Five browser runs per circuit at the paper's settings (population 2,000, ε = 50, seeds 1 to 5) give 22 cells on cm150a in every run, 34 to 38 on 5xp1, 47 to 53 on clip, and 64 to 68 on 9symml, against the paper's 22, 37, 50, and 66 at ε = 50 (Table III). The paper reports one value per setting, so these spreads show how much a single run can vary. On cm150a the best of the 2,000 random starting orders already needs 22 cells, and no generation improves on it.
</div>

## The paper's ten benchmarks

<div id="sg-results" class="w-demo"></div>

<div data-levels="public" markdown="1">
Each row is one test circuit. The hollow dot is SIMPLER, an earlier tool, and the filled dot is SAGA. Under **Memory cells**, SAGA needs fewer cells on nine of ten circuits and the same number on the tenth. Under **Cycles**, SAGA usually takes longer, because it runs one gate at a time. **Efficiency** combines the two, and SAGA comes out ahead on seven of ten.
</div>

<div data-levels="hs" markdown="1">
Efficiency is one million divided by (cycles × cells): fewer cells or fewer steps both raise it. For cm150a, SIMPLER needs 67 cycles and 39 cells (1,000,000 ÷ 2,613 ≈ 383); SAGA needs 52 cycles and 22 cells (1,000,000 ÷ 1,144 ≈ 874), more than twice as efficient. For sao2, SAGA saves 10 cells but needs 85 more cycles, and its efficiency drops.
</div>

<div data-levels="ug grad res" markdown="1">
Area falls on nine benchmarks (by up to 52.8 percent) and holds on 9symml, cycles rise on nine (by up to 66.4 percent on sao2) and fall only on cm150a, and efficiency improves on seven. The page's averages use the geometric mean of (1 + change) across Table I, which reproduces the paper's 29.5 percent cycle increase and 27.5 percent efficiency gain exactly and gives 33.0 percent for area, against the paper's 32.3.
</div>

<div data-levels="grad res" markdown="1">
The ε buttons swap in Table III's areas for each stopping threshold (cycles stay fixed, since every SAGA schedule of a netlist has one write per gate). Larger ε helps most on the larger circuits: x2 drops from 19 to 16 cells and 5xp1 from 37 to 29 between ε = 50 and ε = 5,000, while cm150a and cm163a do not change.
</div>

## What the paper found

<div data-levels="public" markdown="1">
- Changing only the order of a circuit's steps, with no change to the circuit, cut the memory it needed by about a third on average and by more than half at best.
- The search that found those orders borrows from evolution: keep the best candidates, combine them, and add small random changes.
- Saving memory cost time on most circuits, because SAGA runs one step at a time where the older tool ran some steps together.
- Counting both memory and time, SAGA came out ahead on seven of ten test circuits.
</div>

<div data-levels="hs" markdown="1">
- Area (memory cells) fell by 32.3 percent on average and by 52.8 percent at best, on cm163a.
- Only 9symml kept the same number of cells.
- Cycles rose by 29.5 percent on average, because SAGA does not run several NOT gates in parallel the way SIMPLER does.
- Efficiency improved by 27.5 percent on average and by 128 percent at best, on cm150a.
</div>

<div data-levels="ug grad res" markdown="1">
- **Area.** Geometric-mean reduction of 32.3 percent against SIMPLER, best case 52.8 percent (cm163a); only 9symml shows no reduction (Table I).
- **Cycles.** Geometric-mean increase of 29.5 percent, worst case 66.4 percent (sao2), best case a 22.4 percent decrease (cm150a); the paper attributes the increase to SAGA performing no operations in parallel.
- **Efficiency.** Geometric-mean gain of 27.5 percent, best case 128 percent (cm150a); a one-tailed t-test on the efficiency differences gives p = 0.02934 at α = 0.05 (Table II).
- **Search length.** Longer searches (larger ε) improve area on most benchmarks, with diminishing returns (Table III).
- **Future work.** The authors propose moving GAs earlier in the synthesis flow, tuning hyperparameters and the fitness function, and reducing synthesis time.
</div>

<div data-levels="grad res" markdown="1">
<div class="sg-table-wrap">
<table class="results-table">
<caption class="w-note">Table I: SIMPLER and SAGA on ten benchmarks. C is cycles, A is area in memory cells, E is efficiency (10⁶ ÷ C·A). ε is the stopping threshold for the SAGA result shown.</caption>
<thead><tr><th>Benchmark</th><th>SIMPLER C</th><th>A</th><th>E</th><th>SAGA ε</th><th>C</th><th>A</th><th>E</th></tr></thead>
<tbody>
<tr><td>5xp1</td><td>119</td><td>39</td><td>215</td><td>5,000</td><td>160</td><td>29</td><td>216</td></tr>
<tr><td>9symml</td><td>218</td><td>57</td><td>80</td><td>5,000</td><td>306</td><td>57</td><td>57</td></tr>
<tr><td>clip</td><td>160</td><td>47</td><td>133</td><td>5,000</td><td>233</td><td>40</td><td>107</td></tr>
<tr><td>cm150a</td><td>67</td><td>39</td><td>383</td><td>50</td><td>52</td><td>22</td><td>874</td></tr>
<tr><td>cm162a</td><td>64</td><td>35</td><td>446</td><td>50</td><td>87</td><td>20</td><td>575</td></tr>
<tr><td>cm163a</td><td>66</td><td>36</td><td>421</td><td>50</td><td>76</td><td>17</td><td>774</td></tr>
<tr><td>misex1</td><td>83</td><td>33</td><td>365</td><td>500</td><td>84</td><td>17</td><td>700</td></tr>
<tr><td>parity</td><td>81</td><td>35</td><td>353</td><td>500</td><td>104</td><td>20</td><td>481</td></tr>
<tr><td>sao2</td><td>128</td><td>53</td><td>147</td><td>5,000</td><td>213</td><td>43</td><td>109</td></tr>
<tr><td>x2</td><td>73</td><td>33</td><td>415</td><td>5,000</td><td>80</td><td>16</td><td>781</td></tr>
</tbody>
</table>
</div>
</div>

## Why it matters

<div data-levels="public hs" markdown="1">
Phones, sensors, and data centers all pay an energy cost every time data travels between memory and processor. Computing inside memory avoids much of that trip, but only if circuits fit in the memory available. SAGA shows that a smarter order of operations, found by a search anyone can run on a laptop, can shrink that footprint by a third without touching the circuit itself.
</div>

<div data-levels="ug" markdown="1">
Area in a MAGIC crossbar is set by the peak number of live values, and that peak is a property of the schedule as much as of the netlist. SAGA treats scheduling as its own optimization stage after technology mapping, so it can sit behind any mapper that produces a NOR-inverter graph. The trade it exposes, fewer cells for more cycles, gives designers a second axis to tune when memory is the scarce resource.
</div>

<div data-levels="grad res" markdown="1">
The paper's contribution is a formulation as much as a tool: a valid PIM schedule is a topological sort, peak liveness is its cost, and permutation operators that respect the partial order turn the search into a standard GA. That framing invites other permutation heuristics and exact methods for small circuits, and it makes explicit what a fair comparison needs: the same netlist, a stated cycle model, and repeated runs. The authors frame SAGA as a first step toward GA-driven synthesis earlier in the PIM flow.
</div>

<div data-levels="res" markdown="1">
## Notes from building this page

- **The released code and the paper's description differ in three places.** In SAGA v0.2.0 (`genetics.go`), selection keeps the best quarter of the population, where the paper describes discarding the least-fit half; crossover draws both parents at random from the growing population rather than pairing adjacent survivors; and every gene is mutated every generation, so the 20 percent mutation setting is stored but unused. The page follows the code, since the code is what reproduces the authors' runs; the paper's experiments may have used an earlier version.
- **The best order can be lost.** Survivors are mutated along with offspring, and the tool reports the best member of the final population. In the page's 20 runs at the paper's settings the final best always equaled the best seen, but the code does not guarantee it; the evolve demo says so when it happens.
- **SAGA's cycle count is the gate count.** The paper does not define cycles for SAGA. For the four netlists in the repository, Table I's SAGA cycles (52, 160, 233, and 306) equal the number of gates, so the comparison with SIMPLER also compares two different netlists of each benchmark (SIMPLER lists 67, 119, 160, and 218 cycles for the same four).
- **Outputs are freed when written.** An output has no readers inside the circuit, so the tool reclaims its cell immediately. If outputs must stay readable after the run, the memory demo's checkbox shows the cost for each order; this check is the page's own.
- **Random seeding does much of the work on small circuits.** On cm150a, the best of 2,000 random valid orders already needs 22 cells in all five seeds tried, matching Table I; the GA's contribution shows on the larger circuits, where 5xp1 improves from 41 to 43 cells at the start of a run to 34 to 38 by its end, and 9symml from 72 or 73 to 64 to 68.
- **Table I, Table III, and the summary statistics do not fully agree.** Table I lists cm162a at 20 cells with ε = 50, where Table III gives 21 at ε = 50 and 20 at ε = 5,000; Table I lists clip at 40 cells, where Table III gives 41 at ε = 5,000; Table III's 9symml efficiency (54) does not follow from 306 cycles and 57 cells (57); and three Δ entries in Table III do not match their rows. From Table I, the page reproduces the geometric-mean cycle (−29.5 percent) and efficiency (+27.5 percent) changes but computes 33.0 percent for area against 32.3, and arithmetic means of 34.1 percent for area against 33.6. A one-sample, one-tailed t-test on the ten efficiency changes gives p ≈ 0.031 against the reported 0.02934, and the 95 percent intervals the page computes differ slightly from Table II. These computations are the page's, offered as a check rather than a correction.
- **Table II's sign convention.** The text reports 29.5 percent more cycles; Table II lists −29.5 percent, consistent with Table I's convention that a negative Δ means more cycles.
</div>

<div data-levels="hs" markdown="1">
## Try this in class

1. In the first demo, press **Reset** and run the gates in your own order. Record how many cells you used, then try to beat it.
2. Explain in two sentences why finishing one bit at a time uses fewer cells than running the gates row by row.
3. In the memory chart, pick 5xp1 and compare breadth-first with SAGA's order. Find a moment where the breadth-first chart is tallest and describe which values are waiting in memory then.
</div>

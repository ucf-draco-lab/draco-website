---
title: "Evolving a Swarm's Conversation Schedule: EVO-SCHIRP"
kicker: "Interactive paper · IEEE ISC2 2018"
subtitle: "An interactive companion to Shaya Wolf, Rafer Cooley, Mike Borowczak, and Nicholas Cheney's experiment in evolving, rather than designing, the schedule that tells every device in a swarm whom to talk to and when."
description: "Write a swarm's conversation schedule two ways, score it against the paper's three goals, evolve one with small neural networks, and put several swarms on one channel to see who ends up talking to the wrong neighbor."
share_description: "Evolution tries to beat a one-line formula at scheduling a swarm's conversations. Score schedules, evolve your own, and crowd several swarms onto one channel in your browser, written for five reading levels."
share_text: "Evolution against a one-line formula for scheduling a swarm's conversations. Try it in your browser:"
share_image: /papers/evo-schirp/share.png
share_image_alt: "Fitness by generation for three evolved runs with ten agents, climbing out of the band of random tables but staying far below the dashed line for the CHIRP formula, beside the title Evolving a Swarm's Conversation Schedule."
date: 2026-10-19
topics: ["Swarms & IoT", "Networks"]
default_level: public
level_hints:
  public: No background needed
  hs: Tables, counting, and a little algebra
  ug: Arrays, modular arithmetic, and search
  grad: Evolutionary computation and fitness design
  res: Full method, reproduction, and open questions
authors:
  - name: Shaya Wolf
    affiliation: University of Wyoming
  - name: Rafer Cooley
    affiliation: University of Wyoming
  - name: Mike Borowczak
    affiliation: University of Wyoming
    member: mike-borowczak
  - name: Nicholas Cheney
    affiliation: University of Vermont
sources:
  - venue: "IEEE ISC2 2018 · Workshop on 5G Communication, Security and Privacy in Smart Cities"
    title: "EVO-SCHIRP: Evolved Secure Swarm Communications"
    url: https://doi.org/10.1109/ISC2.2018.8656982
    access: Paywalled (IEEE)
  - venue: "Author copy · University of Vermont Neurobotics Lab"
    title: "EVO-SCHIRP: Evolved Secure Swarm Communications"
    url: https://www.uvm.edu/neurobotics/pubs/pdf/2018_WolfCooleyBorowczakCheney_EvolvedSecureSwarmCommunications_IEEESmartCities.pdf
    access: Free author copy
citations:
  - Borowczak2018ISC2-5GWork
widget:
  css:
    - /papers/evo-schirp/widget.css
  js:
    - /papers/evo-schirp/evo-engine.js
    - /papers/evo-schirp/widget.js
credit: "Interactive page by the [DRACO Lab](/). The authors' code is not public, so the browser engine reconstructs the method from the paper's text: the two encodings, the single-clique and multi-clique fitness functions, and compositional pattern-producing networks evolved for 25 generations with 50 survivors and mutation rates of 0.1. It reproduces Figure 2 cell for cell (both panels encode the CHIRP schedule for five agents), and S-CHIRP with one shared round order scores 0.500, 0.457, and 0.500 on the three multi-clique scenarios, matching the paper's \"approximately .5\" under this page's scaling. Random schedules average 7.4, 14.8, and 38.0 under the unique-encoding fitness, inside the population averages of Figure 3's top row. An independent Python implementation agrees with the engine on 7,462 fitness, scaling, and channel checks. Settings the paper leaves open are marked in the engine source and on the page. Everything runs on your device."
bibtex: |
  @inproceedings{wolf2018evoschirp,
    author    = {Wolf, Shaya and Cooley, Rafer and Borowczak, Mike and Cheney, Nicholas},
    title     = {{EVO-SCHIRP}: Evolved Secure Swarm Communications},
    booktitle = {2018 IEEE International Smart Cities Conference (ISC2)},
    pages     = {1--4},
    year      = {2018},
    doi       = {10.1109/ISC2.2018.8656982}
  }
---

<div class="lede" data-levels="public" markdown="1">
A swarm of drones, sensors, or medical devices often has no central server, so the devices must take turns talking to one another, one partner at a time. An earlier DRACO paper found a one-line formula, called [CHIRP](/papers/s-chirp/), that lets every device talk to every other device in as few rounds as possible. Shaya Wolf, Rafer Cooley, Mike Borowczak, and Nicholas Cheney tested whether evolution, the trial-and-error process that shapes living things, could discover such a schedule on its own, and whether it could do better when several swarms share the same airwaves. This page lets you score schedules, evolve your own, and crowd several swarms onto one channel.
</div>

<div class="lede" data-levels="hs" markdown="1">
Picture a room where everyone must shake hands with everyone else, one handshake at a time per person. A schedule is a table: one row per round, one column per person, and each cell names that person's partner for that round. The CHIRP formula fills the table perfectly. The EVO-SCHIRP paper instead lets small computer "brains" fill the table, scores each table on three goals, keeps the best scorers, and lets them change a little each generation. This page runs the same kind of experiment in your browser.
</div>

<div class="lede" data-levels="ug" markdown="1">
CHIRP (Communication for Heterogeneous IoTs with Round-robin Protection) schedules all-to-all, one-to-one exchanges with T = (R − I) mod N, and S-CHIRP permutes the rounds with a shared secret. EVO-SCHIRP represents a protocol as an N × N matrix (rounds × agents) in one of two encodings, scores it with a fitness function built from three goals, and evolves compositional pattern-producing networks (CPPNs) that emit the matrix one round at a time. Phase 1 compares evolved protocols with CHIRP in a single clique; phase 2 compares them with S-CHIRP when two, four, or ten cliques share a channel.
</div>

<div class="lede" data-levels="grad" markdown="1">
The paper treats schedule design as a search problem. A fully connected CPPN with five or ten hidden layers maps the previous round's row to the next round's row; a Pareto-front tournament with elitism evolves a population for 25 generations at mutation rates of 0.1. Single-clique fitness sums three counts (distinct elements in the worst column, distinct elements in the worst row, and bidirectional pairs); multi-clique fitness adds a count of distinct values in corresponding cells across cliques. The paper reports that evolution does not beat CHIRP in one clique and lands near S-CHIRP's scaled fitness of about 0.5 with several cliques.
</div>

<div class="lede" data-levels="res" markdown="1">
Wolf, Cooley, Borowczak, and Cheney (ISC2 2018, four pages) define unique and paired encodings (Fig. 2), the four kinds of cross-clique event (Fig. 1), a single-clique and a multi-clique fitness function, and three uniform multi-clique scenarios (2 × 5, 4 × 10, and 10 × 25 agents). Results are plots of population-average and top fitness by generation for clique sizes 5, 10, and 25 in each encoding (Fig. 3) and two sentences on phase 2. No code accompanies the paper, so this page reconstructs the method, marks every setting the text leaves open, and reports where its reconstruction agrees with the paper's figures and where it cannot.
</div>

## Everyone shakes hands

<div id="ev-schedule" class="w-demo"></div>

<div data-levels="public" markdown="1">
Press **Next round** with the **CHIRP rule** selected: the agents pair off, and after five rounds all ten pairs of five agents have met. Now choose **Random**. Agents call partners who are busy calling someone else (the dashed arrows), and many pairs never meet. **Evolved** shows what this page's evolution found after 25 generations. Watch closely: it repeats the same two handshakes every round. The score rewarded that habit, and the next demos show why.
</div>

<div data-levels="hs" markdown="1">
The table below the circle is the schedule in the paper's "unique encoding." Read row 1 of the CHIRP schedule: agent 1 writes 4 and agent 4 writes 1, so they shake hands. A star means the agent sits out that round. The paper turns its three goals into three counts: how many different entries the worst column holds (did the worst-off agent meet many partners), how many different entries the worst row holds (did anyone get double-booked), and how many cells point at each other. Add the three to get the score. CHIRP earns 5 + 5 + 10 = 20 with five agents, the highest score possible.
</div>

<div data-levels="ug" markdown="1">
For odd N, CHIRP fills every column with all N − 1 partners plus one idle slot, every row with N distinct entries, and (N − 1)/2 pairs per round, for a score of 2N + N(N − 1)/2. For even N, rounds with even R idle two agents, so the worst row holds N − 1 distinct entries and the cycle has N(N − 1)/2 pairs; with ten agents CHIRP scores 64 of a possible 70, the cost of the full N-round cycle the paper chooses for consistency. The evolved schedule scores 16 with five agents by repeating a perfect matching: the row and pair terms reach their maxima (5 and 10) while the column term collapses to 1.
</div>

<div data-levels="grad res" markdown="1">
The pair term counts pairs per round, not distinct pairs, so it rewards repeating one perfect matching N times as much as cycling through N different matchings. Coverage enters only through the worst-column term, which carries weight N against the pair term's N⌊N/2⌋. A schedule that repeats one matching therefore scores 1 + N + N⌊N/2⌋ (16 with five agents, 61 with ten, 326 with 25), well above anything a random table reaches, while meeting only ⌊N/2⌋ of the N(N − 1)/2 pairs. This page's evolution reaches that optimum for five agents in 11 of 12 runs (seeds 1 to 6, five and ten layers); the twelfth also repeats its pairs every round and scores 15. Any schedule search that sums these terms needs either a distinct-pair count or a penalty on repeats; the paper's own suggestion to scale fitness to [0, 1] would not change the ranking.
</div>

## Two ways to write a schedule

<div id="ev-encode" class="w-demo"></div>

<div data-levels="public" markdown="1">
The same schedule can be written down in two ways. In the left table, two agents who show the same letter in a round talk to each other, like two people holding up matching cards. In the right table, each agent writes the number of the agent it wants to call. With the CHIRP rule and five agents, these tables are the paper's Figure 2.
</div>

<div data-levels="hs" markdown="1">
Letters carry less information than numbers: a letter only says "find the other person holding this card," so a one-sided call cannot be written in the paired table at all. That makes paired tables easier for evolution to get right, and the paper found that paired encodings "worked much better than unique encodings." The catch appears when three agents pick the same letter; this page treats that as no handshake for any of them, because the paper does not say.
</div>

<div data-levels="ug grad res" markdown="1">
The unique encoding is a function from (round, agent) to a partner index; the paired encoding is a partition of each round's agents by symbol. Converting paired to unique is exact when every symbol is held by at most two agents. Figure 2's unique panel equals CHIRP's schedule with round *k* printed as R = *k* − 1, and its paired panel induces the same matching in all five rounds, although its letters are assigned by hand (round 1 uses B and C, round 3 uses A and C). The paper converts paired protocols to unique ones before scoring, so the encodings differ in what evolution can express, not in how a finished table is graded.
</div>

## Evolving a schedule

<div id="ev-evolve" class="w-demo"></div>

<div data-levels="public" markdown="1">
Press **Evolve**. Each colored line is one run: the average score of 50 small networks, generation by generation. Gray dots are the best network in each generation, and the dashed line is the CHIRP formula. Evolution climbs quickly from the shaded band of random tables but stays well below CHIRP, the same story the paper tells: the formula still wins when a single swarm talks among itself.
</div>

<div data-levels="hs" markdown="1">
Each network takes the previous round's row of the table and produces the next row. Evolution copies every network once with small random changes, then holds 49 small contests among parents and copies (four entrants each, the winner survives) and keeps the single best network no matter what. Try 25 agents: a random table already scores near 38, and evolution reaches the 40s, yet CHIRP scores 350 because it fits 12 handshakes into every round.
</div>

<div data-levels="ug" markdown="1">
The paper evolves fully connected CPPNs whose neurons use mixed activation functions, with N inputs and N outputs and five or ten hidden layers, for 25 generations; each parent produces one child, and tournament selection with elitism keeps 50 survivors. This page uses the same structure with six activation functions (sine, hyperbolic tangent, Gaussian, sigmoid, absolute value, and identity), Gaussian weight steps of 0.5, tournaments of four judged on the Pareto front of the three counts, and outputs binned into N partner indices. The shaded band shows the middle 90% of 2,000 uniformly random tables under the same fitness.
</div>

<div data-levels="grad res" markdown="1">
The paper's Figure 3 shows population averages that wander without trend ("a random walk") and top performers scattered across generations. Its unique-encoding averages sit near 5 to 15, 7 to 23, and 24 to 45 for 5, 10, and 25 agents, which matches what this page computes for uniformly random tables (averages 7.4, 14.8, and 38.0). This page's runs instead climb: from 6.4 to 15.6 with five agents (seed 1), 11.9 to 19.7 with ten, and 23.4 to 42.7 with 25, because its elitist Pareto tournament keeps improvements. The two behaviors bracket the paper's conclusion: with or without selection pressure, CPPN-generated schedules remain far from CHIRP once N exceeds a handful of agents. The paired panels of Figure 3 (averages near 28, 72, and 310) do not reproduce under this page's conversion rule (random-table averages of 8.4, 23.7, and 126.4), so their scale depends on details of the paired conversion that the paper does not give.
</div>

## Many swarms, one channel

<div id="ev-cliques" class="w-demo"></div>

<div data-levels="public" markdown="1">
Now several swarms share the airwaves, and agent 3 of one swarm answers to the same number as agent 3 of every other swarm. Each square is one agent in the chosen round, and the legend under the squares names what happened to its call: valid (only its own partner answers), collision (its partner and a stranger both answer), invalid (only strangers answer), or inactive (nobody answers). When every swarm uses the same secret order, every conversation collides. The paper found that its evolved schedules and S-CHIRP both scored about half of the best possible score in this crowded setting.
</div>

<div data-levels="hs" markdown="1">
The crowded score has two halves. One half asks how well each swarm schedules itself (the score from the first demo, divided by the best possible). The other half asks how different the swarms' tables are: if every swarm writes the same number in the same cell, outsiders hear exactly what insiders hear. S-CHIRP with one shared order earns full marks on the first half and zero on the second, so its score lands at one half. Evolved swarms do the opposite: their tables differ, but each swarm schedules itself poorly.
</div>

<div data-levels="ug" markdown="1">
Multi-clique fitness combines the average single-clique score with the number of distinct elements in corresponding cells across the cliques' matrices, "scaled against the maximum possible fitness." This page scales each half to [0, 1] and averages them, which gives S-CHIRP with one shared order exactly 0.500 for 2 × 5 and 10 × 25 agents and 0.457 for 4 × 10 (CHIRP's 64 of 70 for even N). One evolutionary run per scenario (seed 1, five layers) scores 0.850, 0.521, and 0.360. The channel picture applies Figure 1's definitions: a call is valid when only the caller's own partner answers, invalid when only agents from other cliques answer, a collision when both do, and inactive when nobody answers.
</div>

<div data-levels="grad res" markdown="1">
The paper calls S-CHIRP's score unsurprising "since it guarantees overlapping between cliques," which holds when every clique shares one round order. Giving each clique its own secret order, the defining feature of S-CHIRP in the [ICCE paper](/papers/s-chirp/), is an analysis beyond this paper: it keeps every clique's schedule perfect and raises the distinct-cells half, so S-CHIRP then scores 0.700, 0.807, and 0.920 on the three scenarios with the orders this page draws, and valid calls rise from none to 32%, 51%, and 70% of agent-rounds. The scaled values depend on this page's equal weighting; the paper reports neither weights nor per-scenario numbers.
</div>

## What the paper found

<div data-levels="public" markdown="1">
- A simple formula (CHIRP) still schedules a single swarm better than anything evolution found.
- Writing a schedule as matching letters made evolution's job easier than writing partner numbers.
- With several swarms on one channel, evolved schedules and S-CHIRP both reached about half of the best possible score.
- Better scores will need better ways to measure security, such as counting crossed lines and wrong numbers directly.
</div>

<div data-levels="hs" markdown="1">
- Evolution never beat the CHIRP formula with 5, 10, or 25 agents, and running longer did not help.
- Paired (letter) encodings scored better than unique (number) encodings.
- Both EVO-SCHIRP and S-CHIRP scored about 0.5 on the scaled multi-swarm fitness.
- The authors plan lower mutation rates, fitness that rewards correct pairs more, and swarm sizes drawn from normal and gamma distributions.
</div>

<div data-levels="ug grad res" markdown="1">
- **Single clique (phase 1).** CHIRP outperforms every evolved protocol; population fitness behaves like a random walk over 25 generations, and high-fitness individuals appear at random (Fig. 3).
- **Encodings.** Paired encodings "worked much better" than unique encodings, and future work will use them.
- **Multiple cliques (phase 2).** EVO-SCHIRP and S-CHIRP both reach approximately 0.5 scaled fitness across the 2 × 5, 4 × 10, and 10 × 25 scenarios.
- **Next steps.** A security metric built from collisions and invalid communications, normal and gamma distributions of clique size, multi-hop protocols, and malicious agents.
</div>

<div data-levels="grad res" markdown="1">
<div class="ev-table-wrap">
<table class="results-table">
<caption class="w-note">Reference values computed by this page under its reading of the paper's fitness functions. The paper prints none of these numbers; it plots Figure 3 and states "approximately .5" for phase 2.</caption>
<thead><tr><th>Setting</th><th>CHIRP or S-CHIRP</th><th>Highest possible</th><th>Random tables (unique)</th><th>This page's evolution (seed 1)</th></tr></thead>
<tbody>
<tr><td>5 agents</td><td>20</td><td>20</td><td>7.4</td><td>16</td></tr>
<tr><td>10 agents</td><td>64</td><td>70</td><td>14.8</td><td>20</td></tr>
<tr><td>25 agents</td><td>350</td><td>350</td><td>38.0</td><td>43</td></tr>
<tr><td>2 cliques of 5 (scaled)</td><td>0.500</td><td>1</td><td>—</td><td>0.850</td></tr>
<tr><td>4 cliques of 10 (scaled)</td><td>0.457</td><td>1</td><td>—</td><td>0.521</td></tr>
<tr><td>10 cliques of 25 (scaled)</td><td>0.500</td><td>1</td><td>—</td><td>0.360</td></tr>
</tbody>
</table>
</div>
</div>

## Why it matters

<div data-levels="public hs" markdown="1">
Swarms of small devices will keep sharing crowded airwaves, from delivery drones to bridge-inspection robots to sensors worn on the body. A schedule that lets each swarm talk efficiently while keeping outsiders out has to work on the cheapest chips, with no server to coordinate it. This paper tested whether evolution could design such a schedule and learned that the hand-built formula remains the one to beat. Ultimately, the experiment shows how much the scoring rules shape what a search finds, a lesson that applies far beyond swarms.
</div>

<div data-levels="ug" markdown="1">
Secure-by-design scheduling avoids encryption on devices that cannot afford it. EVO-SCHIRP frames that design as an optimization problem, which opens the door to protocols tuned for overlapping cliques, uneven clique sizes, and adversaries, cases where a closed-form rule such as CHIRP offers no guidance. The paper's negative result for single cliques sets the baseline that any learned protocol must clear.
</div>

<div data-levels="grad res" markdown="1">
The work connects neuroevolution with protocol design at a point where analytic constructions exist for the base case (round-robin 1-factorizations of the complete graph) and do not exist for the security objective across collocated cliques. Its main lesson for follow-on work is about the objective: a fitness built from worst-case column and row diversity plus a per-round pair count admits degenerate optima, and a security term built from cell-wise diversity does not measure what an eavesdropping or colliding clique experiences. The paper names that gap and proposes collision- and invalid-communication counts as the next metric.
</div>

<div data-levels="res" markdown="1">
## Notes from building this page

- **No code.** The CPPN library, activation set, population size, tournament size, weight-mutation step, output binning, and input scaling are not in the paper. The page's choices are listed in the evolution demo and marked "PAGE CHOICE" in `evo-engine.js`.
- **Figure 2.** Both panels reproduce: the unique panel equals CHIRP for N = 5 with rounds numbered from 1, and the paired panel induces the same matchings with hand-assigned letters.
- **Pair term.** The fitness counts bidirectional pairs per round, so a schedule that repeats one perfect matching scores 1 + N + N⌊N/2⌋ while covering only ⌊N/2⌋ pairs. This page's evolution reaches that optimum for five agents (score 16). Figure 3's top unique scores (up to 18 with five agents) fit the same pattern, which may explain why some top performers appear suddenly.
- **"Worse than CHIRP."** The conclusion says the authors "were unable to evolve a communication pattern which performed worse than CHIRP in a single clique environment"; the results section says CHIRP outperforms EVO-SCHIRP, so the sentence presumably means "better than."
- **Paired scale.** Figure 3's paired panels (averages near 28, 72, and 310) exceed CHIRP's unique-encoding scores for ten agents (64), so the paired conversion must count matches differently from the unique one (for example, every pair of agents sharing a symbol). This page's rule (a symbol held by exactly two agents forms a pair) gives random-table averages of 8.4, 23.7, and 126.4.
- **Multi-clique scaling.** The paper says only that fitness was "scaled against the maximum possible." This page averages two halves scaled to [0, 1], which yields S-CHIRP's 0.5 exactly for odd clique sizes; other weightings move S-CHIRP away from 0.5. The paper adds that the distinct-cells count registers a collision once and an invalid exchange twice; cell-wise diversity does not identify either event in general, so the page's channel picture computes Figure 1's events directly and reports them beside the score.
- **Shared versus own orders.** Phase 2 treats S-CHIRP as guaranteeing overlap. With independent secret orders per clique (an analysis beyond the paper, shown at graduate and researcher levels), S-CHIRP keeps perfect clique fitness and scores 0.70 to 0.92.
</div>

<div data-levels="hs" markdown="1">
## Try this in class

1. Seat five classmates in a circle, numbered 0 to 4. Use the rule partner = (round − own number) mod 5 for rounds 0 to 4, record the pairs in a five-by-five table, and score it with the paper's three counts.
2. Have each student roll a five-sided die (or draw a number card) to choose a partner each round, record the new table, and score it the same way. Compare the two scores and the number of pairs that met.
3. Find a table that scores at least 16 but lets only two pairs meet, then rewrite the scoring rule so that table scores lower than CHIRP. Explain in one sentence what your new rule rewards.
</div>

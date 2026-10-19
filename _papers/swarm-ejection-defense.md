---
title: "Breaking Formation: How a Swarm Slips Past the Drones That Corral It"
kicker: "Interactive paper · IEEE ICCE-Berlin 2020"
subtitle: "An interactive companion to Shaya Wolf and Mike Borowczak's three ejection defenses, which let a leaderless swarm duck toward its target, slip around rogue agents, and close the gaps they open."
description: "Watch rogue agents herd a circling swarm, switch on three ejection defenses, see the two formulas that decide how far and how often an agent breaks formation, and compare the paper's 11,664 simulated runs with this page's own."
share_description: "A few rogue drones can herd a leaderless swarm and open a hole in its circle. Three simple ways to break formation and come back shrink that hole. Try them in your browser, written for five reading levels."
share_text: "A few rogue drones can herd a leaderless swarm. Breaking formation for a moment, then coming back, shrinks the hole they open. Try it in your browser:"
share_image: /papers/swarm-ejection-defense/share.png
share_image_alt: "A simulated ring of 16 agents around a target with five adversaries in it, beside bars of the paper's spacing error for no defense and three ejection defenses, under the title Breaking Formation."
date: 2026-10-19
default_level: public
level_hints:
  public: No background needed
  hs: Distance, angles, percentages, and chance
  ug: Agent-based simulation and programming
  grad: Distributed algorithms, experiment design, and threat models
  res: Full method, reproduction, and open questions
authors:
  - name: Shaya Wolf
    affiliation: University of Wyoming
  - name: Mike Borowczak
    affiliation: University of Wyoming
    member: mike-borowczak
sources:
  - venue: "IEEE ICCE-Berlin · 2020"
    title: "Defensive Strategies for Autonomous Decentralized Lightweight Swarms"
    url: https://doi.org/10.1109/ICCE-Berlin50680.2020.9352161
    access: Paywalled (IEEE)
citations:
  - icce-2020-sharks
widget:
  css:
    - /papers/swarm-ejection-defense/widget.css
  js:
    - /papers/swarm-ejection-defense/sharks-engine.js
    - /papers/swarm-ejection-defense/ejection-engine.js
    - /papers/swarm-ejection-defense/widget.js
credit: "Interactive page by the [DRACO Lab](/). The browser engine adds the paper's three ejection techniques and its spacing-error metric to this site's [SHARKS engine](/papers/sharks-swarms/), which implements the SHARKS rules and the adversarial swarm. The authors' NetLogo model is not public, so the page fills unstated details (when agents start ejecting, how an ejection moves, how crowding is measured, and which distances the metric averages) with choices listed in the researcher notes. The paper's Tables I to III are drawn exactly as printed. This page's run of the full 11,664-setting design reproduces the design itself, the paper's finding that the dynamic techniques ignore the initial value they replace, and its ranking of the defenses, but not its percentages, which run 1.6 to 3.8 times higher here. Every simulated figure is labeled as the page's. Everything runs on your device."
bibtex: |
  @inproceedings{wolf2020defensive,
    author    = {Wolf, Shaya and Borowczak, Mike},
    title     = {Defensive Strategies for Autonomous Decentralized Lightweight Swarms},
    booktitle = {2020 IEEE 10th International Conference on Consumer Electronics (ICCE-Berlin)},
    year      = {2020},
    doi       = {10.1109/ICCE-Berlin50680.2020.9352161}
  }
---

<div class="lede" data-levels="public" markdown="1">
Picture a dozen small drones circling a burning building, each keeping the same distance from the fire and from its neighbors, with no leader and no radio chatter. Earlier work from the same group showed that a handful of rogue drones can slip into that circle and herd the honest ones together, leaving part of the building unwatched. Shaya Wolf and Mike Borowczak asked how the honest drones could fight back without talking to each other. Their answer: every so often, a drone ducks toward the building, lets the circle move past, and comes back out on the other side of whatever was crowding it. This page lets you watch the attack, switch on three versions of that move, and compare them.
</div>

<div class="lede" data-levels="hs" markdown="1">
In the SHARKS protocol (Secure, Heterogeneous, Autonomous, and Rotational Knowledge for Swarms), each agent follows two rules: stay about δ units from the target, and step away from your nearest neighbor at a slight angle. A small adversarial swarm can use those same rules against it, pushing the honest agents into a clump and opening a hole in the circle. This 2020 paper gives the honest agents a third move, an *ejection*: with some chance each round, an agent steps a few units toward the target and lets the circle carry it past the crowd. The paper tests three ways to choose how far and how often to eject, across 11,664 simulated runs, and scores each run by how far the agents' spacing ends up from perfectly even.
</div>

<div class="lede" data-levels="ug" markdown="1">
SHARKS agents run a Center Rule (hold δ ± ε from the target) and a Dispersion Rule (face the nearest agent, turn 180 + *r* degrees, step *d*). Adversaries run the same rules but disperse only from one another, which lets them corral regular agents. Wolf and Borowczak add an ejection step: an agent moves toward the target and returns through the Center Rule on later epochs. **Basic** ejection uses a fixed distance and a fixed chance each epoch. **Dynamic distance** keeps the chance fixed and sets the distance from how crowded the agent is, (δ/2) · err<sup>1/4</sup>. **Dynamic percentage** keeps the distance fixed and sets the chance to 5 · err<sup>1/4</sup> percent. The paper ran every combination of population, adversary count, δ, ε, *r*, technique, distance, and chance in NetLogo, 11,664 runs, and measured the error between the ideal spacing 2δ sin(180°/*n*) and the agents' average spacing after 1,000 epochs.
</div>

<div class="lede" data-levels="grad" markdown="1">
A defense paper for a decentralized, message-free circling protocol. The threat is a corralling attack: adversaries that skip the empty-patch check and disperse only from each other herd regular agents into clumps. The defense must stay local, so each agent estimates its own congestion as the relative drop of its nearest-neighbor distance below the value it recorded once the swarm settled, and ejects toward the target with a distance or a likelihood that grows with err<sup>1/4</sup>, a concave map chosen so that small congestion already triggers a meaningful response. A full factorial design (4 populations × 3 adversary counts × 3 δ × 3 ε × 3 rotations × 4 techniques × 3 distances × 3 likelihoods = 11,664 runs) scores each technique by the relative error between ideal and average inter-agent spacing after 1,000 epochs. Dynamic distance did best: 8.70 percent averaged over Table I against 13.14 percent with no defense, and 1.36 to 1.83 percent for 64-agent swarms.
</div>

<div class="lede" data-levels="res" markdown="1">
Wolf and Borowczak (IEEE ICCE-Berlin 2020) close the SHARKS attack-and-defense cycle. Regular agents gain a stochastic ejection toward the target, parameterized by an initial distance (4, 5, or 6 units) and an initial per-epoch likelihood (6, 8, or 10 percent); the dynamic variants replace one of the two with a function of a locally sensed congestion error err ∈ [0, 1]: distance (δ/2) · err<sup>1/4</sup>, or likelihood 5 · err<sup>1/4</sup> percent. The security metric changes from the 2019 paper's maximum percent access to |ideal − average| / ideal spacing after 1,000 epochs, with ideal = 2δ sin(180°/*n*). Tables I to III report marginal means of one balanced 11,664-run design. This page draws those tables, implements the defenses on this site's SHARKS engine, reruns the full design once, and lists where the reconstruction and the published numbers part ways.
</div>

## 1. Watch the attack, then break formation

<div id="ej-field" class="w-demo"></div>

<div data-levels="public" markdown="1">
Press **Play**. The blue dots settle into the shaded ring around the target first. Once every one of them is inside, the square adversaries arrive and start herding them together; the bright arc outside the ring marks the biggest hole in the circle. Pick **None** and watch the hole grow, then pick **Dynamic distance** and run it again. A dot with a white outline just ducked toward the target. The number to watch is the spacing error: zero would mean perfectly even spacing, and lower is better.
</div>

<div data-levels="hs" markdown="1">
An epoch is one round in which every agent takes its turn. The run has two parts: the honest swarm settles into the ring δ ± ε, then the adversaries enter and the page counts 1,000 more epochs. The spacing error compares each agent's distance to its nearest neighbor with the even spacing the swarm would have without intruders. For 16 agents on a circle of radius 16, that even spacing is 2 × 16 × sin(180° ÷ 16), about 6.24 units. Try 8 and then 64 agents with the same defense: the paper found big swarms far harder to herd.
</div>

<div data-levels="ug grad res" markdown="1">
Agents start ejecting on the first stable epoch, the same epoch the adversaries enter. An ejection turns the agent toward the target and moves it the ejection distance if the destination patch is free; the Center Rule brings it back on later epochs. **Basic: distance** and **Basic: likelihood** are the paper's initial values: Basic uses both, dynamic distance uses only the likelihood, and dynamic percentage uses only the distance. The spark line plots the page's error for this one run; the dashed line is the paper's Table I average for the same defense, population, and adversary count, which averages 243 runs over every δ, ε, *r*, distance, and likelihood. Expect single runs to scatter widely around any average.
</div>

<div data-levels="res" markdown="1">
The readout shows two readings of the metric. The paper says the error is calculated "between the ideal distance between agents and the current average distance between agents." This page reads "distance between agents" as each regular agent's distance to its nearest regular neighbor, and also reports a second reading that averages the chords between agents adjacent around the ring. The two readings disagree sharply about ejection in large swarms; the researcher notes explain why and which one tracks the paper better.
</div>

## 2. How far, and how often

<div id="ej-rules" class="w-demo"></div>

<div data-levels="public" markdown="1">
Each defense sets two things: how far a drone ducks in and how often. **Basic** always uses the same settings. The two dynamic defenses let each drone check how crowded it feels, from 0 (as roomy as when the circle first settled) to 1 (touching its neighbor). **Dynamic distance** ducks farther when crowded. **Dynamic percentage** ducks more often when crowded. Slide the crowding control and watch the dots move along the curves.
</div>

<div data-levels="hs" markdown="1">
The crowding error is (expected distance − current distance) ÷ expected distance, where the expected distance is the gap to the nearest neighbor when the swarm first settled. Dynamic distance ejects (δ ÷ 2) × err<sup>1/4</sup> units, so with δ = 16 the farthest jump is 8 units, halfway to the target. Dynamic percentage ejects with a chance of 5 × err<sup>1/4</sup> percent each round, so never more than 5 percent. The fourth root climbs fast at first: an error of 0.1 already gives 56 percent of the maximum, because 0.1<sup>1/4</sup> ≈ 0.56.
</div>

<div data-levels="ug grad res" markdown="1">
The authors chose err<sup>1/4</sup> over a linear map, the dotted line, because a linear response "is not sensitive enough to change": they wanted sizable ejections for small disruptions that level off as crowding grows. The 5 percent ceiling on dynamic percentage came from preliminary runs, where agents that ejected more often degraded the whole swarm's stability and agents that ejected less often failed to slip past adversaries. The table's last column, distance × chance, is the expected detour per 100 epochs, a quick way to compare how much motion each defense spends. Basic at the middle settings (5 units, 8 percent) spends 40 units per 100 epochs whether or not anything is wrong; both dynamic defenses spend nothing when the swarm is uncrowded.
</div>

<div data-levels="res" markdown="1">
Two details the paper leaves open shape these curves. First, when the expected distance is recorded: the paper says agents wait until their nearest-neighbor distance is "relatively constant," and elsewhere that the dynamic values update "in the first stable epoch"; this page records it on that epoch. Second, the sign of the error: the page clips negative values to zero, so only crowding (a neighbor closer than expected) triggers a response, which matches the stated intent that agents "eject further when they are more congested." The initial likelihoods (6 to 10 percent) exceed the dynamic percentage technique's 5 percent ceiling, so that technique always ejects less often than Basic at any error.
</div>

## 3. What the paper measured

<div id="ej-tables" class="w-demo"></div>

<div data-levels="public" markdown="1">
These are the paper's own results. Each bar is a spacing error, and lower is better. Every defense beats doing nothing in every setting of Table I, and the gray **None** bar is the tallest in every row. **Dynamic distance**, the bright bar, is the shortest in 11 of the 12 settings. Bigger swarms suffer far less: with 64 drones and dynamic distance, the error stays under 2 percent.
</div>

<div data-levels="hs" markdown="1">
Table I sorts the runs by swarm size and number of adversaries. With 32 agents and three adversaries, no defense left a 7.84 percent error, Basic 5.72, dynamic percentage 5.76, and dynamic distance 3.49, which cuts the attack's effect by more than half. Table II sorts the same runs by the ring's size, and Table III by the initial ejection distance and chance. Look at Table III: the dynamic distance bars barely change when you switch the initial distance, because that defense computes its own distance and never uses the initial one.
</div>

<div data-levels="ug grad res" markdown="1">
Each table is a set of marginal means over the same full factorial design: a Table I cell averages 243 runs, and a Table II or III cell averages 324. Table I carries the effects the paper emphasizes: population dominates (no defense: 17.49 to 21.16 percent for 8 agents, 2.85 to 6.93 for 64), more adversaries do more damage, and dynamic distance lowers the error by 1.49 to 6.58 percentage points against no defense. Table II shows almost no effect of δ or ε (3.35 to 5.85 percent across all 36 cells). Table III shows Basic improving with both a longer and a more frequent ejection (best 9.25 percent at 6 units and 10 percent), dynamic distance improving only with likelihood, and dynamic percentage improving only with distance, exactly the parameter each technique keeps.
</div>

<div data-levels="grad res" markdown="1">
The table below the bars averages each printed table's cells. Because the design is balanced, all three tables should give the same mean for each technique. Tables I and III agree to within 0.01 percentage points for every technique (for example, 8.70 and 8.70 for dynamic distance), which confirms that they summarize the same 11,664 runs. Table II's means are 0.40 to 0.44 times as large (3.48 percent for dynamic distance), so Table II cannot be a marginal of the same runs under the same metric. It may come from a different subset, a different normalization, or an earlier metric; the researcher notes list the possibilities.
</div>

<div data-levels="grad res" markdown="1">
## 4. This page's run of the full design

<div id="ej-sweep" class="w-demo"></div>

The bars come from this page's engine running all 11,664 settings once, with the tick marking the paper's value for the same cell. Every run settled before the attack, so every bar averages the same 243 or 324 runs as the paper's. Under the nearest-neighbor reading, the simulation agrees with the paper on the ordering that matters most: each defense beats none in 32 of the 36 Table I cells (the paper: all 36), and averaged over the whole design, dynamic distance (16.74 percent) and dynamic percentage (17.43) beat Basic (26.45), which beats none (50.42). The percentages themselves run 1.6 to 3.8 times the paper's 8.70, 10.81, 10.94, and 13.14. **Run 12 here** repeats one Table I cell (δ = 16, ε = 4, *r* = 20°, the paper's middle distance and likelihood) on your device with fresh seeds.
</div>

<div data-levels="res" markdown="1">
Switch the metric to **Neighbors around the ring** to see how much the reconstruction depends on one phrase. That reading leaves a settled, unattacked ring with almost no error, so it tracks the attack well (no defense: 55.7 percent for 8 agents down to 2.8 for 64, the paper's direction), but it punishes every ejection in large swarms, because an agent a few units inside the ring sits between two neighbors whose chords then lengthen (Basic: 163.9 percent at 64 agents). The paper's Table I rules this reading out: its 64-agent Basic cells are 1.44 to 4.32 percent.
</div>

## What the paper found

<div data-levels="public" markdown="1">
- A swarm with no leader can defend itself without any messages: each drone only needs to notice when it feels crowded.
- Ducking toward the target and coming back lets drones slip past the rogue agents that herd them.
- Every one of the three defenses helped, in every setting of the main results table.
- Ducking in farther when crowded worked best. Big swarms fared best of all: with 64 drones, the defense kept the disruption under 2 percent.
</div>

<div data-levels="hs" markdown="1">
- The paper ran 11,664 simulations: every combination of 4 swarm sizes, 3 adversary counts, 3 ideal distances, 3 slack widths, 3 rotations, 4 defenses, 3 ejection distances, and 3 ejection chances.
- Dynamic distance had the lowest error in 11 of the 12 Table I settings, and its average across Table I was 8.70 percent against 13.14 percent with no defense.
- Swarm size mattered most: without a defense, 8-agent swarms ended with errors near 20 percent, 64-agent swarms with 2.85 to 6.93 percent.
- The size and width of the ring barely mattered.
</div>

<div data-levels="ug grad res" markdown="1">
- **Every defense helps.** All three techniques lowered the error in every one of the 12 population-by-adversary cells of Table I.
- **Dynamic distance leads.** Lowest error in 11 of 12 Table I cells (the exception: 64 agents and three adversaries, 1.32 percent for dynamic percentage against 1.36), and 1.36 to 1.83 percent in 64-agent swarms. Dynamic percentage and Basic finish close together (Table I means 10.81 and 10.94 percent).
- **Population dominates.** With no defense, the error falls from 17.49 to 21.16 percent at 8 agents to 2.85 to 6.93 percent at 64; more adversaries raise it at every size.
- **The ring's geometry does not.** Within each technique, Table II's nine cells span less than one percentage point.
- **Short detours suffice.** The best Basic setting ejects 6 units 10 percent of the time. The authors note that a step is about the size of an agent, so even one extra step of detour improves the result; the dynamic techniques ignore the initial value they replace, as Table III shows.
</div>

<div data-levels="grad res" markdown="1">
<div class="ej-table-wrap">
<table class="results-table" style="min-width: 520px">
<caption class="w-note">Table I means and selected cells (percent). The mean column is computed by this page from the printed cells.</caption>
<thead><tr><th>Technique</th><th>Table I mean</th><th>32 agents, 3 adversaries</th><th>64 agents, 3 adversaries</th><th>64 agents, 7 adversaries</th></tr></thead>
<tbody>
<tr><td>None</td><td>13.14</td><td>7.84</td><td>2.85</td><td>6.93</td></tr>
<tr><td>Basic</td><td>10.94</td><td>5.72</td><td>1.44</td><td>4.32</td></tr>
<tr><td>Dynamic distance</td><td>8.70</td><td>3.49</td><td>1.36</td><td>1.83</td></tr>
<tr><td>Dynamic percentage</td><td>10.81</td><td>5.76</td><td>1.32</td><td>4.29</td></tr>
</tbody>
</table>
</div>
</div>

## Why it matters

<div data-levels="public hs" markdown="1">
Drone swarms could one day watch over gardens, office buildings, oil spills, or disaster sites. A swarm without a leader or radio links is hard to hijack, but its drones trust whatever they see nearby, which is how rogue drones can herd them. This paper shows that the same simple, local thinking that makes the swarm hard to hijack can also defend it: each drone notices when it feels crowded and takes a short detour. No drone needs to know which neighbors are rogue.
</div>

<div data-levels="ug" markdown="1">
The defenses add one stored number (the expected neighbor distance), one comparison, and one random draw per agent per epoch, which keeps SHARKS cheap enough for small vehicles. They also follow a design habit worth copying: assume the attack will happen and respond to its symptom (congestion), since a message-free agent cannot identify the attacker. The authors frame the paper as completing a cycle of protocol, attack, and mitigation.
</div>

<div data-levels="grad res" markdown="1">
The paper's defenses are anomaly-driven rather than identity-driven: agents never classify neighbors, so the defense survives adversaries that look identical to honest agents. The dynamic variants spend motion only under congestion, which matters for energy-limited vehicles, and the comparison between Basic and the dynamic techniques quantifies that trade. The authors list the open threats themselves: adversaries larger than regular agents, adversaries forming two lines across the stability region, three-dimensional attacks on swarms that ensphere a target, and physical experiments beyond NetLogo.
</div>

<div data-levels="res" markdown="1">
## Notes from building this page

These notes interpret or extend the paper and are flagged for the authors' review.

- **Choices for unstated details.** The SHARKS rules, world (57 × 57 wrapping patches), adversary entry (together at one random point on the ideal circle), and adversary speed (0.2 *d*) come from this site's SHARKS page, which reconstructed the 2018 and 2019 papers. Steps are *d*:*c* = 3:4, which the paper does not state. Adversaries enter on the first stable epoch and the run continues 1,000 epochs. Agents begin ejecting on that same epoch; an ejection faces the target and moves the full distance if the destination patch is free, after the agent's two SHARKS rules for that epoch. Each agent records its nearest-neighbor distance (to any agent, since it cannot tell adversaries apart) on the first stable epoch, and its error is the clipped relative drop below that value. The metric reads the last epoch.
- **What reproduces.** The design's 11,664 settings. The invariance in Table III: in this engine a dynamic-distance run is identical for every initial distance, and a dynamic-percentage run for every initial likelihood, which explains why the paper's values for those techniques vary by at most 0.16 and 0.14 percentage points across the parameter they ignore. Under the nearest-neighbor reading, the ranking of the defenses and their advantage over no defense (32 of 36 Table I cells).
- **What does not.** The magnitudes run 1.6 to 3.8 times the paper's. Part of the gap is a floor: on this page's one-agent-per-patch grid, a settled swarm with no adversaries already scores about 2, 6, 13, and 20 percent for 8, 16, 32, and 64 agents (one run each, δ = 16, ε = 4), because neighbors pair up at one-patch spacing. Under attack, the page's no-defense error falls with population (75.6, 61.4, 40.7, and 24.0 percent averaged over adversary counts) more steeply than the paper's (19.72, 16.91, 10.91, and 5.01). Basic hurts 64-agent swarms here (50.1 percent against 24.0 with no defense), while the paper's Basic helps them. Basic and dynamic distance worsen with a higher likelihood here and improve in the paper's Table III. The authors' NetLogo model, especially its placement rules and how an ejection moves, would settle these.
- **Table II.** Its cell means are 0.40 to 0.44 times those of Tables I and III, which agree with each other to 0.01 points. Possibilities: Table II summarizes a subset of the runs, divides by a different count, or reports an earlier version of the metric. Its narrow range (3.35 to 5.85 percent) also sits below every Table I cell for 8 and 16 agents.
- **Small inconsistencies.** The text says dynamic distance lowered the attack's success "by as much as five percent"; Table I's largest drop is 6.58 points (16 agents, three adversaries: 16.39 to 9.81). Section III says adversaries "disperse faster than the original swarm," while the 2019 paper and this site's SHARKS page use one fifth the speed; the paper does not give *d*′ for these runs. The paper cites its corralling attack to the 2020 IEEE Consumer Electronics Magazine article; the attack's definition and percent-access metric appear in the 2019 ISC2 paper.
- **A cleaner comparison.** The metric mixes two effects, the gap the adversaries open and the radial scatter that ejection itself causes. Reporting the 2019 paper's percent access beside the spacing error would separate them. On this page's runs, the largest gap falls from 53.3 percent of the circle with no defense to 27.2 (Basic), 27.3 (dynamic distance), and 38.3 (dynamic percentage), so the defenses close holes even where the spacing error disagrees with the paper.
</div>

<div data-levels="hs" markdown="1">
## Try this in class

1. In the first demo, set 16 agents and five adversaries. Run **None** three times with **New run** and record the spacing error at the end of each run. Repeat with **Dynamic distance**. Compute both averages and the difference.
2. In the second demo, set the crowding error to 0.0625 and then to 0.5. Compute 0.0625<sup>1/4</sup> and 0.5<sup>1/4</sup> by hand (hint: 0.0625 = 0.5<sup>4</sup>), then check the dynamic distance and dynamic percentage values in the table.
3. In the third demo, read Table I for 8 and 64 agents with three adversaries. For each defense, compute how many times smaller the 64-agent error is than the 8-agent error. Explain in two sentences why a crowded ring might be harder to herd.
</div>

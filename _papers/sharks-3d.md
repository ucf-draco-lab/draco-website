---
title: "Wrapping a Target in a Swarm: SHARKS in Three Dimensions"
kicker: "Interactive paper · IEEE Consumer Electronics Magazine 2020"
subtitle: "An interactive companion to Shaya Wolf, Rafer Cooley, Jason Fantl, and Mike Borowczak's magazine article that carries the SHARKS circling protocol from a flat field into the air, where two rules and a small tilt wrap a leaderless swarm around a target in a sphere."
description: "Fly a leaderless swarm into a sphere around a target, see how one agent turns and tilts away from its neighbor, watch large and small swarms reach 68, 95, and 100 percent stability, and compare a full sweep of 3-D experiments with the magazine's averages."
share_description: "Two rules and a small tilt let a drone swarm wrap a target in a sphere, with no leader, no GPS, and no messages. Fly it in your browser, written for five reading levels."
share_text: "Two rules and a small tilt let a drone swarm wrap a target in a sphere, with no leader and no messages. Try it in your browser:"
share_image: /papers/sharks-3d/share.png
share_image_alt: "A simulated swarm of 16 agents settled on the shell around a target, most of them circling near the target's height, drawn in perspective with the ideal sphere dashed, beside the title Wrapping a Target in a Swarm."
date: 2026-10-20
topics: ["Swarms & IoT"]
default_level: public
level_hints:
  public: No background needed
  hs: Distance, angles, and averages
  ug: Agent-based simulation and 3-D vectors
  grad: Distributed algorithms and experiment design
  res: Full protocol, reconstruction, and open questions
authors:
  - name: Shaya Wolf
    affiliation: University of Wyoming
  - name: Rafer Cooley
    affiliation: University of Wyoming
  - name: Jason Fantl
    affiliation: University of Wyoming
  - name: Mike Borowczak
    affiliation: University of Wyoming
    member: mike-borowczak
sources:
  - venue: "IEEE Consumer Electronics Magazine 9(4):34–40 · 2020"
    title: "Secure and Resilient Swarms: Autonomous Decentralized Lightweight UAVs to the Rescue"
    url: https://doi.org/10.1109/MCE.2020.2969174
    access: Paywalled (IEEE)
citations:
  - 9109421
widget:
  css:
    - /papers/sharks-3d/widget.css
  js:
    - /papers/sharks-3d/sharks3d-engine.js
    - /papers/sharks-3d/widget.js
credit: "Interactive page by the [DRACO Lab](/). The browser engine implements the magazine's Center Rule and 3-D Dispersion Rule (Algorithms 1 and 2). The authors' simulation is not public, and the magazine does not state its field size, shell width, or tilt angles, so the page fills those with stated choices and fits the field size to the magazine's averages; every 3-D figure on the page is the page's own simulation, labeled with its run count. Restricted to a flat field, the engine makes the same moves and random draws as the site's 2-D SHARKS engine in 45,360 epoch-by-epoch checks, and so reproduces the 2018 conference paper's never-stable line starts without rotation and their rescue at one degree. Everything runs on your device."
bibtex: |
  @article{wolf2020resilient,
    author  = {Wolf, Shaya and Cooley, Rafer and Fantl, Jason and Borowczak, Mike},
    title   = {Secure and Resilient Swarms: Autonomous Decentralized Lightweight {UAVs} to the Rescue},
    journal = {IEEE Consumer Electronics Magazine},
    volume  = {9},
    number  = {4},
    pages   = {34--40},
    year    = {2020},
    doi     = {10.1109/MCE.2020.2969174}
  }
---

<div class="lede" data-levels="public" markdown="1">
Picture a dozen small drones arriving at a burning building or a chemical spill. Nobody steers them, no drone is in charge, and they do not talk to each other or use GPS. Each one follows two rules: stay about the right distance from the target, and step away from the closest drone while turning a little. On the ground, those rules make a ring. Shaya Wolf, Rafer Cooley, Jason Fantl, and Mike Borowczak added one more idea, a small tilt of the nose up or down, and the same rules wrap the swarm around the target in a sphere. This page lets you fly it.
</div>

<div class="lede" data-levels="hs" markdown="1">
SHARKS (Secure, Heterogeneous, Autonomous, and Rotational Knowledge for Swarms) gives each agent two rules. The Center Rule moves it toward a shell at distance δ from the target, with slack ε on either side. The Dispersion Rule turns it away from its nearest neighbor by 180 + *r* degrees and moves it. In three dimensions the agent also tilts its nose by *t* degrees toward the target's height. The magazine measures how many rounds, called epochs, a swarm needs before 68, 95, and 100 percent of its agents sit inside the shell, across seven starting layouts, four tilts, two rotations, two distances, two step sizes for each rule, and several swarm sizes.
</div>

<div class="lede" data-levels="ug" markdown="1">
The article carries SHARKS from 2-D to 3-D with one change to the Dispersion Rule: after facing away from the nearest neighbor's compass bearing plus *r* degrees, the agent levels its nose and pitches it *t* degrees down if it is above the target and up otherwise, then moves *d* units if the destination is empty. The Center Rule still faces the target and moves *c* units in or out until the agent sits within δ ± ε. The article reports average epochs to complete stability for each experimental factor and summarizes the earlier 2-D results. This page runs the rules in a 3-D voxel field and sets its simulated averages beside the article's.
</div>

<div class="lede" data-levels="grad" markdown="1">
A magazine synthesis of the SHARKS line of work, with new 3-D experiments. The protocol needs only the bearing of the nearest agent and the target, keeps all state private to each agent, and tolerates the loss of agents down to three. The 3-D study varies initial placement (seven layouts), population, tilt, rotation *r* (0° or 20°), ideal distance δ (8 or 12), and the per-epoch step of each rule (two or three units), and reports mean epochs to complete stability for each factor, with 68 and 95 percent stability for population. The reported factor means are consistent with one balanced design whose grand mean is about 9.7 epochs, a point the researcher notes take up.
</div>

<div class="lede" data-levels="res" markdown="1">
Wolf, Cooley, Fantl, and Borowczak (IEEE Consumer Electronics Magazine 9(4), 2020) give Algorithm 1 (Center Rule) and Algorithm 2 (3-D Dispersion Rule) and report factor-level mean epochs to stability for 3-D swarms, without tables, field size, shell width, tilt angles, run counts, or code. This page implements the two algorithms in a wrapping voxel field, verifies that its flat-field restriction matches the site's 2-D SHARKS engine run for run, fits the field size to the article's averages, and reports where the fitted reconstruction agrees and where it does not. The researcher notes list each choice, each comparison, and a consistency check on the reported means.
</div>

## Two rules and a tilt

<div id="s3-swarm" class="w-demo"></div>

<div data-levels="public" markdown="1">
Press **Play**. The dots start scattered through a cube; a dot turns blue once it sits inside the shell around the target, the dashed sphere. Drag the cube to look from any side. With the starting settings, more than two thirds of the 16 agents reach the shell by epoch 5 and all of them by epoch 20. Try **Line through target** with **Turn r** at 0°: the agents crowd along their starting line and never all settle. Set the turn to 20° and the same swarm is stable by epoch 6.
</div>

<div data-levels="hs" markdown="1">
The **Steps c : d** setting sets how far an agent moves for each rule in one epoch: *c* units toward the shell and *d* units away from its neighbor. Compare 3 : 2 with 2 : 3. When the center step is the larger one, this swarm is stable by epoch 8; when the dispersion step is larger, agents that arrive late keep getting pushed back out by the agents already in the shell, and this run never settles. The magazine found the same direction: favoring the Center Rule by one step per epoch made swarms settle much faster.
</div>

<div data-levels="ug" markdown="1">
Each epoch, every agent applies the Dispersion Rule and then the Center Rule, in a new random order. An agent moves only if the destination voxel (a unit cube of the field) is empty. The field wraps at its faces, the NetLogo 3D default. The thin vertical lines drop each agent to the target's height, so you can read which agents fly above it and which below. The chart under the field tracks the share of agents inside δ ± 4 at each epoch for the current run.
</div>

<div data-levels="grad res" markdown="1">
The magazine gives the rules but not the arena. This field is a 33 × 33 × 33 wrapping cube (the size that fits the magazine's averages best among sizes from 29 to 37), ε = 4, and steps of two and three units. The 2-D layouts keep their 2-D definitions in the target's horizontal plane: the line starts 20 units to one side of the target, and the line through the target lies in that plane. With *r* = 0 and a line through the target, the Dispersion Rule's compass bearing points along the line, so only the tilt can move an agent off it; with *r* = 20° the bearing itself leaves the line.
</div>

## How one agent turns and tilts

<div id="s3-rule" class="w-demo"></div>

<div data-levels="public hs" markdown="1">
From above, the agent finds its nearest neighbor, faces the opposite way, and then turns a little more, *r* degrees clockwise. That extra turn is what makes the swarm circle the target instead of just spreading out. From the side, the agent levels its nose and then tips it down if it is above the target or up if it is below. The tilt pulls the swarm toward the target's height a little at every step, so agents do not drift to the top or bottom of the sphere.
</div>

<div data-levels="ug grad res" markdown="1">
Algorithm 2 sets B<sub>DEST</sub> = B<sub>NN</sub> + 180 + *r* degrees, sets pitch to zero, and then pitches by −*t* above the target and +*t* otherwise. A step of length *d* therefore splits into *d* cos *t* horizontally and *d* sin *t* vertically, and the horizontal part splits again into a component straight away from the neighbor and *d* cos *t* sin *r* to the side. The Center Rule uses heading and pitch toward the target, so it moves along the radius. Only the Dispersion Rule carries an agent around the sphere, and only through *r*.
</div>

## Sixty-eight, 95, and 100 percent

<div id="s3-levels" class="w-demo"></div>

<div data-levels="public hs" markdown="1">
This demo runs 25 swarms of each size on your device and plots, for each size, the average share of agents in the shell as the epochs go by. All four sizes pass 68 percent at about the same time. The last few agents are the slow part, and they take longer in a bigger swarm, because a crowded shell blocks more moves and gives every newcomer more neighbors to push it away. The magazine describes the same pattern.
</div>

<div data-levels="ug grad res" markdown="1">
The magazine reports that every population reached 68 percent stability at about the same time and that 100 percent took longer as the swarm grew (6.6 epochs for four agents, 12.2 for 32). It explains the slower small swarms by sparse dispersion and the slower large ones by a crowded Center Rule. In this page's sweep of all 1,792 settings (five runs each), the 68 percent mark falls between 1.8 and 2.2 epochs for every population, and complete stability takes 7.4, 8.7, 13.0, and 13.3 epochs for 4, 8, 16, and 32 agents. The gap between 95 and 100 percent opens only at 32 agents, where one or two stragglers are enough to stay below 100 percent.
</div>

## The magazine's averages and this page's

<div id="s3-avg" class="w-demo"></div>

<div data-levels="public" markdown="1">
Each pair of bars compares the article's average number of epochs with this page's. Lower is faster. The page agrees on every direction the article reports: boxes that start near the target settle fastest and boxes in a far corner slowest, a 20-degree turn beats no turn, a larger sphere settles faster, and a bigger step toward the target beats a bigger step away from the neighbor.
</div>

<div data-levels="hs" markdown="1">
The article does not say how big its field was, so this page tried several sizes and kept the one whose averages came closest to the article's. Matching after that kind of tuning shows that the rules can produce the article's pattern; it does not prove the page copied the authors' exact setup. Notice the rows where the bars still disagree, such as the line through the target and the tilt.
</div>

<div data-levels="ug grad res" markdown="1">
The page's averages count only runs that reached complete stability within 400 epochs, which is how the magazine's averages read; the third column shows how many did. In this sweep, 7,707 of 8,960 runs became stable. Most failures share one setting: with *c* = 2 and *d* = 3, only 1,159 of 2,240 runs settled, because an agent outside the shell whose nearest neighbor sits inside it moves out three units for every two it moves in. The magazine reports averages for that setting, so its swarms evidently settled; why they did is one of the open questions below.
</div>

## What the article found

<div data-levels="public" markdown="1">
- Two rules and a small tilt are enough for a leaderless swarm to surround a target in three dimensions as well as on the ground.
- Starting close to the target matters more than the exact starting pattern: boxes in the middle of the field settled in about two epochs, boxes in a corner in about 15.
- A 20-degree turn, a larger sphere, and a bigger step toward the target each made swarms settle faster.
- Because the drones need only the direction to their closest neighbor and to the target, they keep working if some drones are lost and they do not rely on GPS, which can be jammed or faked.
</div>

<div data-levels="hs" markdown="1">
- Boxed starts at the center, faces, and edges of the cube settled in 1.8, 2.7, and 8.7 epochs on average, and cornered boxes in 14.7.
- Every swarm size reached 68 percent stability at about the same time; complete stability took 6.6 epochs with four agents and 12.2 with 32.
- A 20-degree turn averaged 7.9 epochs against 11.5 with no turn, and raising the ideal distance from 8 to 12 units cut the time from 13.2 to 6.2 epochs.
- Moving three units per epoch toward the shell averaged 5.2 epochs against 14.2 for two units, while three units of dispersion averaged 13.6 against 5.8 for two.
</div>

<div data-levels="ug grad res" markdown="1">
- **Placement.** Cornered boxes were slowest (14.7 epochs); random, linear, and collinear starts took 13 to 14; boxes on the edges, faces, and center took 8.7, 2.7, and 1.8. The authors conclude that the initial distance to the target matters more than the shape of the starting distribution.
- **Population.** All sizes reached 68 percent together; complete stability took 6.6 epochs for four agents and 12.2 for 32.
- **Tilt and rotation.** Three tilt settings stabilized in eight to ten epochs, slightly slower at larger tilts, but swarms without tilt did not rotate freely around the target. Rotation of 20° averaged 7.9 epochs against 11.5 for none, and collinear starts and small populations could fail to stabilize without rotation.
- **Stability region.** Raising the ideal distance from 8 to 12 units cut the average from 13.2 to 6.2 epochs.
- **Rule weighting.** Center steps of two and three units averaged 14.2 and 5.2 epochs; dispersion steps of two and three averaged 5.8 and 13.6.
- **2-D summary.** In 2-D fields, smaller populations and larger ideal distances settled faster, boxed starts on the target performed best, and collinear starts held the most agents.
</div>

<div data-levels="grad res" markdown="1">
<div class="s3-table-wrap">
<table class="results-table" style="min-width: 480px">
<caption class="w-note">The magazine's reported factor means (epochs to complete stability) and the mean of each factor's levels, computed by this page. Random, linear, and collinear starts are entered as 13.5, the midpoint of the reported "13 to 14."</caption>
<thead><tr><th>Factor</th><th>Reported levels</th><th>Mean of levels</th></tr></thead>
<tbody>
<tr><td>Rotation r: 0°, 20°</td><td>11.5, 7.9</td><td>9.70</td></tr>
<tr><td>Ideal distance: 8, 12</td><td>13.2, 6.2</td><td>9.70</td></tr>
<tr><td>Center step: 2, 3</td><td>14.2, 5.2</td><td>9.70</td></tr>
<tr><td>Dispersion step: 2, 3</td><td>5.8, 13.6</td><td>9.70</td></tr>
<tr><td>Placement: seven layouts</td><td>1.8, 2.7, 8.7, 14.7, and 13.5 three times</td><td>9.77</td></tr>
</tbody>
</table>
</div>
</div>

## Why it matters

<div data-levels="public hs" markdown="1">
Drones that can surround a fire, an oil spill, or a damaged building without a pilot keep people out of danger. A swarm with no leader has no single drone an attacker can knock out to stop it, and a swarm that does not use GPS cannot be fooled by fake GPS signals. Moving from a flat field to the open air is what flying drones, and swimming or space robots, need.
</div>

<div data-levels="ug" markdown="1">
The 3-D extension costs almost nothing: one comparison (above or below the target) and one pitch adjustment per step. That keeps SHARKS within reach of small, cheap vehicles while it inherits the protocol's security properties, which come from what agents do not use: no positions of other agents, no messages, and no satellite positioning.
</div>

<div data-levels="grad res" markdown="1">
The article's security case rests on minimal information per agent: bearings rather than coordinates, no communication after launch, and no dependence on GPS. The same lack of verification lets adversarial agents herd a 2-D swarm, as the authors' 2019 work showed, so the 3-D results set a baseline for measuring attacks and defenses in the setting real aerial swarms occupy.
</div>

<div data-levels="res" markdown="1">
## Notes from building this page

These notes interpret or extend the article and are flagged for the authors' review.

- **Unstated details and this page's choices.** Field: a 33 × 33 × 33 wrapping voxel cube with the target at the center, one agent per voxel. Rule order: Dispersion, then Center, in a random agent order each epoch. Shell half-width ε = 4. Steps of two and three units. Tilts of 0°, 10°, 20°, and 30°; populations of 4, 8, 16, and 32; boxes of 10 × 10 × 10 voxels placed at the center, on a face, on an edge, or in a corner; the line starts keep their 2-D definitions in the target's horizontal plane. Runs that do not reach 100 percent within 400 epochs count as never stable and are left out of averages.
- **How the field size was chosen.** The page ran the full design (seven layouts, four populations, four tilts, two rotations, two distances, and two step sizes for each rule) for field widths of 29 to 37 voxels and ε of 3 to 5, and kept the pair with the smallest root-mean-square log ratio against the 17 reported means. A 33-voxel field with ε = 4 fit best (ε = 5 tied). Laying the line starts in the horizontal plane fit better than reading "above" as vertical. The 2018 conference paper implies a 35-unit 2-D field, close to this fit. Because of this fitting, agreement with the article's averages is evidence that the rules can produce them, not a reproduction.
- **What agrees.** Directions for every reported factor; placement means within 1.5 epochs of the article for corner and edge boxes and for random and linear starts (14.1, 9.3, 11.9, and 13.1 against 14.7, 8.7, and 13 to 14); four agents at 7.4 epochs against 6.6 and 32 at 13.3 against 12.2; 68 percent stability at about the same epoch for every population; rotation, ideal-distance, and center-step means within 2 epochs.
- **What does not.** Collinear starts average 18.4 epochs here against 13 to 14. Larger tilts settle faster here (12.2, 12.4, 9.3, and 7.6 epochs for 0°, 10°, 20°, and 30°) where the article found them slightly slower, and untilted swarms here still rotate about the target (about 37° per 20 epochs against 45° at 10° tilt in one tracked run). The dispersion-step contrast is weaker here (9.1 and 12.0 against 5.8 and 13.6). With *c* = 2 and *d* = 3, about half the runs never settle.
- **A balanced design behind the means.** The two-level means for rotation, ideal distance, center step, and dispersion step all average 9.70 epochs, and the seven placement means average 9.77. That pattern is what a balanced factorial design produces, every factor's marginal means averaging to the same grand mean. If the design was balanced, the four step combinations satisfy *c*2*d*2 + *c*2*d*3 = 28.4 and *c*2*d*2 + *c*3*d*2 = 11.6, so the slowest cell, *c* = 2 with *d* = 3, averaged between 16.8 and 27.2 epochs. This page's value for that cell is 18.5, from the runs that settled.
- **Where the swarm settles on the sphere.** The tilt always points toward the target's height, so settled swarms here gather in a band around the target's horizontal plane rather than covering the whole sphere (mean height of 2.7 units at *t* = 10° against 4.2 units at *t* = 0° in one tracked run with δ = 12). The article's word "ensphere" may describe the shell agents occupy more than an even spread over it; a coverage measure would settle which.
- **The same symbol twice.** The article uses *d* for the dispersion step and, in "when d is increased from 8 units to 12," for a length the same paragraph calls the ideal distance. This page reads that sentence as the ideal distance δ.
- **The 2-D check.** With the third dimension switched off, this engine makes the same moves, in the same order, with the same random draws as the site's 2-D SHARKS engine: 45,360 epoch-by-epoch comparisons over 378 runs, every layout, three populations, both step ratios, and three rotations. The 2-D engine reproduces the 2018 paper's never-stable collinear starts without rotation and their rescue at *r* = 1°, so this engine does as well.
- **Open questions for the authors.** The field size and ε; the tilt angles; whether "above the target" in the line start meant height or the 2-D north direction; the population sizes; how many runs each mean averages and whether runs that never settled were excluded; and what kept *c* = 2, *d* = 3 swarms from stalling.
</div>

<div data-levels="hs" markdown="1">
## Try this in class

1. In the first demo, pick **Box, center**, **Box, face**, **Box, edge**, and **Box, corner** with 16 agents. Record the epoch at which each becomes stable, then measure on the drawing about how far each box starts from the target. Make a scatter plot of starting distance against epochs and describe the pattern in one sentence.
2. In the second demo, set the tilt to 30°. Use the readout to find how much of a three-unit step goes sideways and how much goes up or down. Check the numbers with cosine and sine on a calculator.
3. Run the third demo twice, once with **Random** and once with **Box, corner**. For each population, subtract the epochs to 68 percent from the epochs to 100 percent. Explain why the last third of a swarm can take longer than the first two thirds.
</div>

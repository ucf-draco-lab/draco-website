---
title: "Circling Swarms: Two Rules That Hold a Perimeter, and the Intruders That Break It"
kicker: "Interactive paper · IEEE ISC2 2018 and 2019"
subtitle: "An interactive companion to Rafer Cooley, Shaya Wolf, and Mike Borowczak's SHARKS protocol, which lets a swarm of drones circle a target with no leader and no messages, and to the follow-up study of how a small adversarial swarm can pry that circle open."
description: "Watch a leaderless swarm settle into a ring around a target using two rules, compare how fast it settles from different starting layouts and crowd sizes, then send in adversarial agents and measure the gap they open."
share_description: "Two simple rules let a drone swarm circle a target with no leader. A few rogue drones can still open a gap. Run both in your browser, written for five reading levels."
share_text: "Two simple rules let a drone swarm circle a target with no leader, and a few rogue drones can still open a gap. Try it in your browser:"
share_image: /papers/sharks-swarms/share.png
share_image_alt: "A simulated ring of 16 agents around a target, with three adversaries holding one side open and the largest gap in the ring marked, beside the title Circling Swarms."
date: 2026-10-18
topics: ["Swarms & IoT"]
default_level: public
level_hints:
  public: No background needed
  hs: Distance, angles, and averages
  ug: Agent-based simulation and programming
  grad: Distributed algorithms, experiment design, and threat models
  res: Full protocol, reproduction, and open questions
authors:
  - name: Rafer Cooley
    affiliation: University of Wyoming
  - name: Shaya Wolf
    affiliation: University of Wyoming
  - name: Mike Borowczak
    affiliation: University of Wyoming
    member: mike-borowczak
sources:
  - venue: "IEEE ISC2 · 2018"
    title: "Secure and Decentralized Swarm Behavior with Autonomous Agents for Smart Cities"
    url: https://arxiv.org/abs/1806.02496
    access: Open access (arXiv)
  - venue: "IEEE ISC2 · 2019"
    title: "Adversarial Impacts on Autonomous Decentralized Lightweight Swarms"
    url: https://arxiv.org/abs/2002.09109
    access: Open access (arXiv)
citations:
  - Borowczak2018ISC2
  - smartcities2019
widget:
  css:
    - /papers/sharks-swarms/widget.css
  js:
    - /papers/sharks-swarms/sharks-engine.js
    - /papers/sharks-swarms/widget.js
credit: "Interactive page by the [DRACO Lab](/). The browser engine implements the SHARKS Center and Dispersion Rules (2018, Algorithms 1 and 2) and the adversarial variants (2019, Algorithms 3 and 4) in a NetLogo-style patch world. The authors' NetLogo model is not public, so the page fills unstated details (world size, rule order, step units, adversary entry, and when the gap is measured) with choices listed in the researcher notes. It reproduces all nine stability-region areas of the 2018 capacity tables, the never-stable collinear starts without rotation of Table IV and their rescue at one degree, center-box times within the range of Table II, and the never-measured d:c = 1:0.5 setting of the 2019 Table III. Simulated capacity times fall within a typical factor of 1.3 of Table V; the attack sweep matches the paper for 64-agent swarms and the delay ordering, and runs higher for small swarms. Every simulated figure is labeled as the page's. Everything runs on your device."
bibtex: |
  @inproceedings{cooley2018sharks,
    author    = {Cooley, Rafer and Wolf, Shaya and Borowczak, Mike},
    title     = {Secure and Decentralized Swarm Behavior with Autonomous Agents for Smart Cities},
    booktitle = {2018 IEEE International Smart Cities Conference (ISC2)},
    year      = {2018},
    doi       = {10.1109/ISC2.2018.8656939},
    eprint    = {1806.02496},
    archivePrefix = {arXiv}
  }

  @inproceedings{wolf2019adversarial,
    author    = {Wolf, Shaya and Cooley, Rafer and Borowczak, Mike},
    title     = {Adversarial Impacts on Autonomous Decentralized Lightweight Swarms},
    booktitle = {2019 IEEE International Smart Cities Conference (ISC2)},
    year      = {2019},
    eprint    = {2002.09109},
    archivePrefix = {arXiv}
  }
---

<div class="lede" data-levels="public" markdown="1">
Picture a dozen small drones circling a burning building, an oil spill, or a car crash, keeping watch from a safe distance. Nobody steers them, no drone is in charge, and they send each other no messages. Rafer Cooley, Shaya Wolf, and Mike Borowczak showed that two rules are enough: stay about the right distance from the target, and step away from your closest neighbor at a slight angle. The swarm spreads into a ring and keeps circling. A year later, Shaya Wolf, Rafer Cooley, and Mike Borowczak asked what a few rogue drones following almost the same rules could do to that ring. This page lets you run both.
</div>

<div class="lede" data-levels="hs" markdown="1">
Each agent in a SHARKS swarm (Secure, Heterogeneous, Autonomous, and Rotational Knowledge for Swarms) knows only two things: where the target is and where its nearest neighbor is. Every round it moves toward an ideal distance δ from the target, allowing some slack ε, and moves away from its nearest neighbor after turning a little extra, 180 + *r* degrees. The 2018 paper measures how many rounds the swarm needs to settle inside the ring for different crowd sizes and starting layouts. The 2019 paper adds adversaries that follow a slightly altered version of the same rules and measures the largest gap they open in the ring.
</div>

<div class="lede" data-levels="ug" markdown="1">
SHARKS is a decentralized, leaderless, message-free circling protocol. Each epoch an agent applies a Center Rule (step forward or back *c* units if its distance to the target leaves δ ± ε) and a Dispersion Rule (face the nearest agent, turn 180 + *r* degrees clockwise, step *d* units), each only if the destination patch is empty. The 2018 paper runs the rules in NetLogo across four starting layouts, population sizes from 2 to 256, two step ratios *d*:*c*, and two rotations, and reports epochs to stability. The 2019 paper shows that the same lack of verification that removes a single point of failure also lets adversarial agents herd the swarm: adversaries skip the empty check, disperse only from each other, and do so at one fifth the speed.
</div>

<div class="lede" data-levels="grad" markdown="1">
Two IEEE International Smart Cities Conference papers on one protocol. The 2018 paper defines SHARKS, a two-rule emergent circling behavior that needs only the target's position and the nearest neighbor's, and maps its efficiency (epochs to stability across starting layouts, populations, *d*:*c* ratios, and rotation) and its capacity (populations up to 256 against stability regions of 201 to 1,608 square units). The 2019 paper defines a security metric, percent access, as the largest gap an adversarial swarm opens in the ring normalized by its circumference, and sweeps 3,024 settings (9,072 runs) of population, adversary count, δ, ε, *d*:*c*, and attack delay. Adversaries opened 6 to 23 percent of the perimeter.
</div>

<div class="lede" data-levels="res" markdown="1">
Cooley, Wolf, and Borowczak (ISC2 2018) and Wolf, Cooley, and Borowczak (ISC2 2019) study SHARKS in NetLogo: Algorithms 1 and 2 define the protocol, Algorithms 3 and 4 the adversary, and Tables I to VIII and II to III of the two papers hold the measurements. The authors' NetLogo model is not public, so this page implements the four algorithms as printed and fills each unstated detail (world size, rule order, step units, adversary entry, and when percent access is measured) with a stated choice. It reproduces the papers' stability-region areas exactly and several qualitative results, and it reports where its numbers part from the papers'. The researcher notes at the end list every choice and every difference.
</div>

## Two rules, one ring

<div id="sk-swarm" class="w-demo"></div>

<div data-levels="public" markdown="1">
Press **Play**. Dots start scattered across the field; a dot turns blue once it sits inside the shaded ring around the target. Every dot steps toward the ring and away from its closest neighbor, turning a little as it goes, so the swarm both spreads out and circles. With the starting settings, all 16 agents are inside the ring by epoch 38. Try **Line through target** with **Turn while spreading** set to 0°: the agents never leave their starting line and settle only by squeezing onto the two short stretches where the line crosses the ring (epoch 40 here). Switch **Step sizes** to 1:1 and they never settle at all. Set the turn to 1° and they spread around the ring by epoch 12.
</div>

<div data-levels="hs" markdown="1">
An epoch is one round in which every agent takes its turn. The ring is the set of points between δ − ε and δ + ε units from the target. The **Step sizes** setting picks how far an agent moves for each rule: 3:4 means 0.75 units to get away from a neighbor and 1 unit to fix its distance, so agents lean toward the target; 1:1 moves equally for both. The 2018 paper found that leaning in (3:4) settles the swarm faster in almost every case. Change the number of agents, the ideal distance δ, and the slack ε, and watch how long the swarm takes to settle.
</div>

<div data-levels="ug" markdown="1">
Each step, one agent runs the Dispersion Rule and then the Center Rule (the order the caption of the 2018 paper's Figure 1 suggests); the highlighted lines show which branch the followed agent just took. Tap any agent to follow it. "Empty" means no other agent stands on the destination patch, a unit square of the NetLogo grid, so blocked moves are common in a crowded ring. The field wraps at its edges, NetLogo's default. Stability, as in the paper, means every agent is inside δ ± ε at the same time.
</div>

<div data-levels="grad res" markdown="1">
The papers fix the rules but not the arena. This simulation uses a 57 × 57 unit field (the size that best fits the 2018 capacity results), one agent per patch, a new random turn order every epoch (NetLogo's `ask`), and steps of 0.75 and 1 unit for the 3:4 ratio. With *r* = 0 and a collinear start, the Dispersion Rule points every agent straight along the line and the Center Rule moves agents along the line as well, so no agent can leave it. Agents can then settle only on the two short stretches where the line crosses the ring, which stalls larger swarms, and with equal step sizes the two rules undo each other. Any nonzero rotation breaks the symmetry. That mechanism accounts for the zeros in Table IV, and the simulation reproduces them.
</div>

## How fast, and how many

<div id="sk-tables" class="w-demo"></div>

<div data-levels="public" markdown="1">
These are the 2018 paper's measurements. **How fast** shows how many epochs a swarm needed to settle from each starting layout; lower is better. Starting in a box on top of the target settles fastest (under 30 epochs in every case), and a line through the target with no turning and equal step sizes never settles at all. **How many** asks how crowded a ring can get: when too many agents share too small a ring, the swarm takes far longer to settle or never does.
</div>

<div data-levels="hs" markdown="1">
Each point is an average of five runs. Look at the gap between the solid accent line (3:4 steps with a 20° turn) and the dotted gray line (1:1 steps, no turn): with random starts and 25 agents, the paper measured about 34 epochs against more than 600. In the **How many** table, the ring's area is π((δ + ε)² − (δ − ε)²) = 4πδε. Rows with the same area (for example δ = 16, ε = 2 and δ = 8, ε = 4, both 402 square units) still differ: the bigger circle settles faster, because a larger ideal distance gives agents a longer path to spread along.
</div>

<div data-levels="ug grad res" markdown="1">
The paper's Tables I to IV cover population sizes in two series (4, 8, 16, 32 and 5 to 25 by fives) and Tables V to VIII cover 2 to 256 agents against nine stability regions. The squares and second numbers are this page's simulation; **Rerun in your browser** repeats a whole table on your device. The papers state δ and ε for the capacity tables but not for the efficiency tables, and state the step ratio and rotation for the efficiency tables but not for the capacity tables, so the simulation uses δ = 12, ε = 4 for the first and 3:4 with *r* = 20° for the second. The "Area" column is computed by this page as 4πδε and matches all nine printed values.
</div>

## Sending in adversaries

<div id="sk-attack" class="w-demo"></div>

<div data-levels="public" markdown="1">
Now a few rogue agents (the squares) join the swarm. They follow almost the same rules, with three changes: they push through other agents instead of waiting, they only keep away from each other, and they spread out slowly. The regular agents cannot tell them apart from friends, so they keep stepping away from them, and the rogues herd them together. The highlighted arc marks the largest stretch of the ring with no regular agent in it, the opening an intruder could use. In the starting run, the opening reaches about a third of the circle at its widest.
</div>

<div data-levels="hs" markdown="1">
Percent access is the largest gap between neighboring regular agents around the circle, as a share of the full 360 degrees. Sixteen evenly spaced agents leave gaps of 1/16, or 6.25 percent, so any value well above that is the adversaries' doing. Try 64 regular agents: a crowded ring is much harder to pry open. Then try **No delay**, where the adversaries start at the same time as everyone else and get mixed into the crowd before they can organize.
</div>

<div data-levels="ug grad res" markdown="1">
The adversary follows Algorithms 3 and 4: the same Center Rule with empty checks, and a Dispersion Rule that faces the nearest adversary, turns 180 + *r* degrees, and moves 0.2 *d* without checking the destination. Regular agents still disperse from whichever agent is nearest, adversary or not. The paper does not say where adversaries enter, so they appear together at one random point on the ideal circle, and percent access is measured on every epoch after the regular swarm has first been stable and the adversaries are in the field. With **d:c** set to 1:0.5, the regular swarm in this simulation almost never becomes stable (6 of 756 settings in the page's sweep), so nothing is measured, the same outcome the paper reports as NULL.
</div>

## What the adversaries achieved

<div id="sk-results" class="w-demo"></div>

<div data-levels="public hs" markdown="1">
These bars are the 2019 paper's results, averaged over 9,072 simulated runs. Small swarms suffered most: two adversaries opened 23.54 percent of an eight-agent ring, while a 64-agent ring lost at most 7.81 percent. Waiting until the swarm had settled helped the adversaries a little (13.62 percent against 12.37 percent with no delay). The size and width of the ring barely mattered, with every setting between about 12 and 14 percent.
</div>

<div data-levels="ug" markdown="1">
Population saturation drove the results: the smaller the regular population, the more the adversaries could corral it, and for large populations the number of adversaries mattered little (6.53 percent with two adversaries and 7.81 with eight in a 64-agent swarm). The stability region's δ and ε moved the average only between 11.83 and 14.42 percent (Table II). One step ratio, *d*:*c* = 1:0.5, never produced a measurable gap (Table III). Congestion, the region's area divided by the population, explained more: the attack weakened as agents packed tighter and leveled off at about 16 percent near 75 square units per agent.
</div>

<div data-levels="grad res" markdown="1">
The "page" values beside each bar come from this page's sweep of the same 3,024 settings (one run each instead of three). They agree with the paper on the direction of the delay effect and on the NULL cell, and they land near the paper for large swarms, but they run higher for small swarms and grow with the number of adversaries where the paper's shrink. The researcher notes below discuss why. All three of the paper's averaging views (Table II, Table III, and the delay comparison) are consistent with counting the NULL setting's runs as zero access; this page averages its own runs the same way.
</div>

## What the papers found

<div data-levels="public" markdown="1">
- Two rules, and no leader or radio messages, are enough for a swarm to surround a target and keep circling it.
- Leaning toward the target (moving farther to keep the right distance than to avoid neighbors) and adding a small turn both make the swarm settle much faster.
- Where the swarm starts matters: a cluster near the target settles in a few dozen rounds, while a line through the target settles only if the agents turn while spreading.
- Because agents trust any neighbor they see, a few rogue agents can herd a swarm and open a gap of up to about a quarter of the circle; bigger, denser swarms resist better.
</div>

<div data-levels="hs" markdown="1">
- Random starts settled in about 30 to 40 epochs with 3:4 steps, regardless of swarm size; with 1:1 steps and no turn, 25 agents needed more than 600 epochs.
- A 20-degree turn sped up settling by a factor of two to six in some cases, and one degree was enough to rescue a line through the target.
- A ring of about 400 square units could not hold 128 or 256 agents, and even 64 agents needed 210 epochs in the smallest ring.
- Adversaries opened 6 to 23 percent of the perimeter, never more than 25 percent.
</div>

<div data-levels="ug grad res" markdown="1">
- **Efficiency.** The 3:4 ratio beat 1:1 for every layout, and rotation mattered most when the ratio was 1:1. Center boxes settled in at most 26.6 epochs, against 453.6 for random, 168.75 for linear, and never for collinear starts under the same 32-agent, 1:1, *r* = 0 setting (Tables I to IV).
- **Scaling.** Doubling the population did not double the time to stability; growth was roughly linear in the 5-to-25 series.
- **Capacity.** Time to stability tracked the stability region's area, and for equal areas the larger δ won. Boxed starts with 64 agents took 136.9 epochs in a 201-square-unit region and 16.75 in a 1,608-square-unit region (Table VI).
- **Attack.** Percent access fell with population (23.54 percent for 8 agents and two adversaries, 6.53 to 7.81 percent for 64), barely moved with δ and ε (11.83 to 14.42 percent), and rose slightly with an attack delay (12.37, 13.62, and 13.59 percent).
- **Defense by density.** Congestion neutralized the attack, which the authors propose to amplify by letting agents maneuver around adversaries once corralling starts.
</div>

<div data-levels="grad res" markdown="1">
<div class="sk-table-wrap">
<table class="results-table" style="min-width: 420px">
<caption class="w-note">Percent access by step sizes (2019, Table III), with the paper's other averages for comparison.</caption>
<thead><tr><th>Setting</th><th>Percent access</th></tr></thead>
<tbody>
<tr><td>d 0.5, c 0.5</td><td>17.60%</td></tr>
<tr><td>d 1.0, c 0.5</td><td>NULL</td></tr>
<tr><td>d 0.5, c 1.0</td><td>18.96%</td></tr>
<tr><td>d 1.0, c 1.0</td><td>16.22%</td></tr>
<tr><td>Mean of the four, NULL counted as 0 (computed by this page)</td><td>13.20%</td></tr>
<tr><td>Mean of Table II's nine cells (computed by this page)</td><td>13.19%</td></tr>
<tr><td>Mean of the three delay settings (computed by this page)</td><td>13.19%</td></tr>
</tbody>
</table>
</div>
</div>

## Why it matters

<div data-levels="public hs" markdown="1">
Smart cities could send drone swarms to watch over fires, crashes, spills, and failing bridges, places too dangerous for people. A swarm with no leader has no single drone an attacker can knock out to stop it, and SHARKS does not depend on GPS, which can be jammed or faked. The 2019 paper shows the other side of that design: agents that trust whatever is nearby can be steered by impostors. Measuring how much damage a small rogue swarm can do is the first step toward a protocol that can resist it.
</div>

<div data-levels="ug" markdown="1">
Decentralized protocols remove obvious attack vectors (a lead node, a command channel) and keep per-agent computation tiny, which suits small, cheap vehicles. They also make every agent's input an attack surface, because local rules cannot verify neighbors. The two papers together give a protocol, a quantitative security metric for it, and a measured attack, which turns "decentralized is secure" into a claim with numbers attached, and they point to density and rule weighting as the defenses worth developing.
</div>

<div data-levels="grad res" markdown="1">
The adversary needs no communication, no compromise of regular agents, and only a parameter change to the honest protocol, so the threat model is weak and realistic. The results suggest a tension for designers: the settings that harden the ring (dense populations, smaller δ) are the ones that raise collision risk, which the papers did not track. The authors' follow-up work on defensive strategies and resilient swarms builds on this baseline.
</div>

<div data-levels="res" markdown="1">
## Notes from building this page

These notes interpret or extend the papers and are flagged for the authors' review.

- **Unstated details and this page's choices.** World: 57 × 57 unit patches with wrapping edges, target at the center. Rule order: Dispersion, then Center, in a random agent order each epoch. Steps: 3:4 means *d* = 0.75 and *c* = 1. Efficiency tables: δ = 12, ε = 4. Capacity tables: 3:4 and *r* = 20°. Runs that do not settle within 2,000 epochs count as never stable. Adversaries enter together at one random point on the ideal circle. Percent access is the largest angular gap between regular agents, taken over every epoch after the regular swarm is first stable and the adversaries are present.
- **World size.** The 2018 paper says at most 35 agents fit a linear or collinear start "due to the size of the field," which implies a 35-unit field, yet its regions reach 24 units from the target and its linear start sits 20 units above it. A 35-unit wrapping field also places most random starts inside the wider rings, so swarms would start stable. This page keeps 35-patch lines and uses the field size that best fits Table V: among sizes from 41 to 65 units tried, 53 and 57 units fit about equally well (a typical ratio of 1.3 between simulated and published epochs), and the page uses 57.
- **What reproduces.** The stability-region areas (all nine, 4πδε; the paper prints 1,608.49 for 4π · 128 = 1,608.50). Table IV's zeros for collinear starts without rotation and their disappearance at *r* = 1°. Center-box starts within the 5.6-to-26.6-epoch range of Table II. The capacity failures at 128 and 256 agents in the smallest rings. The NULL cell of Table III: with *d* = 1 and *c* = 0.5 the regular swarm in this simulation became stable in only 6 of 756 settings, which suggests that the NULL marks swarms that never settled rather than attacks that failed.
- **What does not.** Corner-box starts settle more slowly than random starts here (about 43 to 53 epochs with 3:4 and *r* = 20°), while the paper found them faster. In the attack sweep (3,024 settings, one run each), large swarms land near the paper (64 agents: 5.25 percent with two adversaries and 7.05 with eight, against 6.53 and 7.81), but small swarms run higher (31.33 percent for 8 agents and two adversaries, against 23.54), access grows with the number of adversaries where the paper's falls, grows with δ where the paper's barely moves, and keeps rising past 75 square units per agent where the paper's levels off near 16 percent. The delay ordering matches (19.27, 20.98, and 21.03 percent for no delay, stability, and stability + 20). Some single runs here open more than half the circle, while the paper reports no attack above 25 percent. A gap averaged over time instead of its maximum gives 20.18 percent for 8 agents and two adversaries, closer to the paper, but 3.3 percent for 64 agents, farther from it, so neither reading of the metric matches every published number. Where the adversaries enter and how the gap is measured are the likeliest sources of the difference; the authors' model would settle both.
- **The NULL cell in the averages.** Averaging Table III's four cells with NULL as zero gives 13.20 percent; Table II's nine cells average 13.19 percent and the three delay settings 13.19 percent. All three views agree only if the 2,268 runs of the NULL setting (756 settings, three runs each) entered the other averages as zero access. If so, the swarms that did stabilize lost about 17.6 percent of their perimeter on average, a third more than the headline averages show.
- **A floor under percent access.** Evenly spaced, *n* agents leave a gap of 1/*n* of the circle (12.5 percent for 8 agents, 1.6 percent for 64), so part of the 23.54 percent measured for 8 agents is spacing that any 8-agent ring has. Reporting access above that floor would separate the adversaries' effect from population size.
- **Small inconsistencies.** Table VIII's header lists a population of 62 where the other capacity tables list 64. The 2019 paper's arXiv copy lists Wolf, Cooley, and Borowczak as authors; the lab's bibliography lists Cooley first.
</div>

<div data-levels="hs" markdown="1">
## Try this in class

1. In the first demo, set **Line through target** and a 0° turn. Sketch the line and the target, and explain in two sentences why no agent can leave the line. Then set the turn to 1° and record the epoch at which the swarm becomes stable.
2. Compute the ring's area for δ = 8, ε = 4 and for δ = 16, ε = 2 with 4πδε. Run 16 agents in each and record the epochs to stability three times. Explain which ring settles faster and why a bigger circle might help.
3. In the attack demo, run 8, 16, and 64 regular agents with three adversaries. For each, write down the largest percent access and the even-spacing gap (100 ÷ number of agents). Decide which swarm resists best once you subtract the spacing.
</div>


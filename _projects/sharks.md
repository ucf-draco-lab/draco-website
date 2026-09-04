---
title: SHARKS
subtitle: Decentralized Coordination for Multi-Agent Swarms
image: images/projects/sharks.jpg
poster: images/projects/2025/sharks.jpg
poster_caption: SHARKS research poster.
sponsor: [ucf]
projectmembers:
-
  id: marcus-simmonds
  name: "Marcus Simmonds"
  role: "Project Lead"
  start-date: "2026-01-06"
tags:
  - active
  - swarm autonomy
  - multi-agent systems
  - edge computing
  - resilience
prq: Can multi-agent encirclement stay stable under uncertainty, agent loss, and degraded communication — on hardware small enough to fly?
---

Target encirclement is easy to write down and hard to hold. A swarm has to converge on a moving target, distribute itself around it, and keep that distribution while agents drop out, radio links degrade, and the target does something the model did not anticipate. Most published approaches assume more than the field gives them: reliable communication, a shared clock, a central planner, or compute budgets that do not fit on a drone.

SHARKS develops coordination methods that give those assumptions up. The work is decentralized by construction — each agent acts on what it can observe and what its neighbors tell it, with no coordinator to lose. We are interested in three properties at once, and in the fact that they trade against each other:

- **Stability.** The formation converges and stays converged, provably where we can prove it and empirically where we cannot.
- **Resilience.** Losing agents degrades performance rather than collapsing it. An adversary who removes or spoofs a node should not be able to remove the swarm.
- **Efficiency.** The algorithm runs in real time on the class of processor that actually flies, not on a workstation standing in for one.

Simulation is where the algorithms start, not where they are judged. SHARKS flies on [PUPS]({{ site.baseurl }}/projects/pups.html), the lab's untethered swarm platform, which exists specifically so that coordination claims have to survive real radios, real batteries, and real timing.

## Open questions

- How much communication can be removed before encirclement stops converging, and does that boundary move when the target is adversarial rather than merely uncertain?
- What does an attacker who controls a minority of agents actually get? Formation distortion, denial, or something more useful to them?
- Where is the honest ceiling on onboard compute, and which parts of the algorithm are worth spending it on?

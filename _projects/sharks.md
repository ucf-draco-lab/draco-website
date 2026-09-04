---
title: SHARKS
subtitle: Bio-Inspired Swarm Coordination for Contested Missions
image: images/projects/sharks.jpg
poster: images/projects/2025/sharks.jpg
poster_caption: SHARKS research poster.
sponsor: [ucf]
projectmembers:
-
  id: samantha-semmel
  name: "Samantha Semmel"
  role: "Project Lead"
  start-date: "2026-08-17"
-
  id: marcus-simmonds
  name: "Marcus Simmonds"
  role: "Alumni Mentor — prior project lead"
  start-date: "2026-01-06"
tags:
  - active
  - biomimicry
  - swarm autonomy
  - multi-agent systems
  - adversarial robustness
  - edge computing
  - resilience
prq: Which of biology's collective behaviors survive a change of mission, an adversary inside the group, and a real flight computer?
---

Biology has been running swarm coordination for a few hundred million years under constraints an engineered system would call unreasonable: no coordinator, no shared clock, no reliable channel, and a per-agent compute budget measured in neurons. It also ran it under attack the entire time. A school's response to a predator, an ant colony's foraging network, a hive deciding where to move — each of those was selected in the presence of predators, cheats, and mimics. Engineered swarms are usually designed for benign conditions and hardened afterward. Biological ones never had that option.

SHARKS takes that seriously rather than decoratively. We work from collective mechanisms drawn from biology and ask two questions of each one: **what missions can it actually accomplish**, and **what does an adversary get to do to it**.

## Missions

Coordination research tends to fix a single task — usually formation-keeping or encirclement — and optimize it. That hides the more useful result, which is that a mechanism well suited to one mission is often badly suited to the next. We are building out a portfolio and characterizing where each mechanism belongs:

- **Search and coverage.** Sweeping an area nobody has mapped, in the regime where transmitting what you found is expensive or unsafe. Stigmergy — ants coordinating through marks left in the environment rather than through messages — is the obvious candidate, and the obvious question is what plays the part of the pheromone when the environment cannot be written to.
- **Containment and encirclement.** The project's earlier work, reframed. Cooperative hunting in fish, cetaceans, and canids arrives at distributed encirclement with nothing resembling a plan, against a target actively trying to leave.
- **Recruitment and commitment.** Getting the right number of agents to the right place, which honeybees solve with a signal that is simultaneously a location and a vote. The interesting property is not the dance; it is that the colony commits without any individual knowing the outcome.
- **Screening and defense.** Schooling measurably degrades a predator's ability to fix on any one individual. It is the only mission on this list where the swarm's objective is to be hard to attack rather than to accomplish something, and it is the one that most directly inherits biology's adversarial provenance.

## Adversaries

A swarm's signaling system is an attack surface, and biology has been exploiting that surface for as long as the surface has existed. The mechanisms above are attractive precisely because agents act on cheap local evidence without auditing each other, which is also exactly what an adversary is buying:

- **Mimicry.** *Photuris* fireflies answer the mating flashes of another genus and eat the males that respond. That is a spoofing attack on a signaling protocol, with a payoff, executed by an insect. We want the equivalent when the signal is a range measurement or a neighbor's claimed position — and what detecting it would cost.
- **Parasitism.** A brood parasite does not fight the colony; it gets the colony to spend its budget raising the parasite. An infiltrated agent that consumes attention, bandwidth, or formation slots is a cheaper attack than one trying to break convergence outright, and a considerably harder one to notice.
- **Quorum manipulation.** Mechanisms that commit once a threshold of local evidence accumulates are fast because nobody audits the evidence. The threshold that makes a decision quick is the same threshold an attacker has to reach.
- **Attrition.** Predation removes individuals; it does not usually collapse the group. Losing agents should cost performance proportionally rather than categorically, and an adversary who removes or captures a minority should not thereby own the swarm.

Bio-inspiration earns its place or it does not. A mechanism copied from an organism has to beat the engineered baseline on the mission in question — an algorithm is not better for having a good story attached to it. Two failure modes are worth naming up front: taking the metaphor instead of the mechanism, and inheriting robustness that was only ever robustness against one specific historical adversary. A defense that evolved against a particular predator is not a general defense, and neither is an algorithm derived from it.

The lab's earlier work on defensive strategies for decentralized lightweight swarms is where the adversary side of this starts. Simulation is where the algorithms start, not where they are judged: SHARKS flies on [PUPS]({{ site.baseurl }}/projects/pups.html), the lab's untethered swarm platform, which exists so that coordination claims have to survive real radios, real batteries, and real timing. Biological mechanisms tend to be cheap, and much of their appeal at drone scale is exactly that — but *cheap in a beehive* and *cheap on a microcontroller* are different claims, and only the second one can be measured here.

## Open questions

- Which collective mechanisms keep their robustness once they are lifted out of the ecology that produced them, and which only ever worked against one particular predator?
- What does detecting a mimic inside the swarm cost, and is that cost payable by every agent rather than by a privileged one?
- Does a capable adversary force specialization — one mechanism per mission — or is there a coordination scheme that stays general under attack?

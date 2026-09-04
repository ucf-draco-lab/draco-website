---
title: Aegis
subtitle: AI Model Exfiltration and Protection Through Side Channel Analysis
image: images/projects/aegis.jpg
sponsor: [leidos]
projectmembers:
-
  id: alexei-solonari
  name: "Alexei Solonari"
  role: "Project Lead"
  start-date: "2026-08-17"
-
  id: franco-mezzarapa
  name: "Franco Mezzarapa"
  role: "Prior project lead"
  start-date: "2026-01-01"
-
  id: calvin-vanwormer
  name: "Calvin VanWormer"
  role: "Alumni Mentor — prior project lead"
  start-date: "2026-01-01"
tags:
  - active
  - side-channel
  - artificial intelligence
  - model extraction
  - edge computing
  - countermeasures
prq: How much of a deployed edge model can an attacker recover from side channels alone, and what closes the gap?
---

A model deployed to the edge is a model in the adversary's hands. The weights may be encrypted at rest and the inference API may be locked down, but the accelerator still draws power and still radiates, and both are functions of what it is computing. Aegis measures how much that gives away.

The work runs in two directions, and the second is the point of the first:

**Extraction.** We establish what is actually recoverable from power and electromagnetic measurement of edge ML hardware — architecture and layer structure, then parameters, then inputs. Each of those is a different attack with a different cost, and the literature is uneven about which have been demonstrated versus which are assumed to follow. We are interested in the boundary: what an attacker gets with physical access and a modest budget, stated concretely enough to plan against.

**Protection.** Once the leak is characterized, the question is what closes it and what that costs. Masking, shuffling, and noise injection all have well-understood analogues in cryptographic side-channel defense; whether they transfer to ML inference at acceptable latency and accuracy is not settled. Countermeasures that are unaffordable get deployed by nobody, so cost is part of the result, not a footnote to it.

Aegis is supported by [Leidos]({{ site.baseurl }}/members/leidos.html).

## Open questions

- Where is the real boundary between recovering a model's architecture and recovering its weights, on hardware someone actually ships?
- Do cryptographic side-channel countermeasures transfer to ML inference, or does the arithmetic structure of the workload defeat them?
- What is the accuracy and latency cost of a defense strong enough to matter, and is anyone willing to pay it?

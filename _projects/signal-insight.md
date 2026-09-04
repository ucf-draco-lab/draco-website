---
title: Signal Insight
subtitle: Information Theory for Power Estimation and Optimization
image: images/projects/signal_insight.png
poster: images/projects/2025/signal-insights.jpg
poster_caption: Signal Insight research poster.
projectmembers:
-
  id: alicia-thoney
  name: "Alicia Thoney"
  role: "Alumni Mentor — prior project lead"
  start-date: "2025-08-18"
tags:
  - active
  - power estimation
  - information theory
  - low power design
  - optimization
  - eda
prq: How far can entropy substitute for simulation in estimating and reducing power?
---

Accurate power estimation means simulating switching activity, and simulation is expensive enough that it happens late — after the design decisions that determine most of the power have already been made. The result is a familiar loop: estimate late, discover the budget is blown, and repair the design under schedule pressure with the cheapest changes available rather than the best ones.

Signal Insight tests whether information theory offers a way out. Entropy over a signal is a cheap, structural proxy for how much that signal switches, and it can be computed without a full simulation run. The project examines that proposition in two directions:

- **Estimation.** How closely do entropy-based measures track simulated power, and where do they diverge? A proxy that is accurate on average but wrong on the cases a designer cares about is not useful.
- **Optimization.** A measure that only reports is worth less than one that steers. If entropy identifies the signals that dominate power, it can drive restructuring, encoding, and clock-gating decisions early, when they are still cheap to make.

The second is the more interesting claim and the harder one. Plenty of metrics correlate with power; comparatively few tell you what to change.

## Open questions

- Where does entropy-based estimation break down — glitching, correlated inputs, deep sequential logic — and can the error be bounded rather than merely observed?
- Does optimization guided by entropy find reductions a conventional flow misses, or only rediscover them sooner?
- What is the honest accuracy-versus-runtime tradeoff against established estimation methods on the same designs?

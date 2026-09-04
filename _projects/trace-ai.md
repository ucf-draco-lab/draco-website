---
title: Trace-AI
subtitle: Provenance and Attribution for AI Workloads
image: images/projects/trace-ai.jpg
sponsor: [awn]
tags:
  - active
  - side-channel
  - artificial intelligence
  - provenance
  - attribution
  - machine learning
prq: Given an artifact or an observed signal, can we establish which model produced it?
---

[Shadow AI]({{ site.baseurl }}/projects/shadow-ai.html) asks what is running right now. Trace-AI asks a harder question: what ran? Detection happens while the workload is live and the side channel is available. Attribution has to work afterwards, from whatever evidence outlived the execution.

That gap is the whole problem. A power trace is gone the moment nobody is measuring. An output artifact persists but has been through post-processing, quantization, or a deliberate attempt to launder it. Trace-AI is building the evidence chain across that gap — what signatures a model leaves in its own output, how stable those signatures are under transformation, and how much confidence an attribution claim can honestly carry.

The problem matters because the alternative is trusting a claim about provenance rather than checking it. In an incident response context — which is where this work is aimed — the useful question is rarely "is this AI-generated" and almost always "which deployment produced this, and when."

Trace-AI is supported by [Arctic Wolf Networks]({{ site.baseurl }}/members/awn.html), with matching support from the Florida High Tech Corridor.

## Open questions

- Which model characteristics survive quantization, fine-tuning, and output post-processing, and which are erased?
- How distinguishable are two deployments of the same base model, and does that distinguishability decay?
- What does an adversary who knows the attribution method do to defeat it, and what does that cost them in output quality?

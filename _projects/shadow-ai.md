---
title: Shadow AI
subtitle: Workload Detection Through Side Channel Analysis
image: images/projects/shadow_ai.jpg
poster: images/projects/2025/shadow-ai.jpg
poster_caption: Shadow AI research poster.
sponsor: [awn]
redirect_from:
  - /projects/AI_trojan_detection.html
projectmembers:
-
  id: gabriel-martin
  name: "Gabriel Martin"
  role: "Project Lead"
  start-date: "2026-01-06"
-
  id: daniel-de-armas
  name: "Daniel De Armas"
  role: "Project Lead"
  start-date: "2026-01-06"
-
  id: sagar-srujan-somepalli
  name: "Sagar Srujan Somepalli"
  role: "Alumni Mentor"
  start-date: "2026-01-06"
-
  id: yvan-pierre
  name: "Yvan Pierre Jr."
  role: "Alumni Mentor — prior project lead"
  start-date: "2023-10-10"
tags:
  - active
  - side-channel
  - artificial intelligence
  - power analysis
  - machine learning
  - workload fingerprinting
prq: Can a workload be identified from hardware side channels alone, without instrumenting the host?
---

Software cannot hide what it costs. Every workload leaves a signature in the power the processor draws and the fields it radiates, and that signature is available to anyone with physical proximity — no agent installed, no kernel module, no cooperation from the machine being observed.

Shadow AI turns that into a measurement problem. We collect power and electromagnetic traces from systems running known workloads, then train classifiers to recover which workload produced a trace. The interesting cases are the ones where conventional monitoring cannot help: a machine you do not administer, an air-gapped system, a device whose software stack you have no reason to trust.

The name is the threat model. Shadow AI — models running somewhere in an organization that its security team does not know about — is a real and growing problem precisely because it is invisible to software inventory. A side channel does not care whether the workload was sanctioned.

This work grew out of an earlier effort to detect hardware Trojans from power side channels, which established the measurement pipeline and the classification approach the project still uses. [Trace-AI]({{ site.baseurl }}/projects/trace-ai.html) extends it from detection to attribution.

Shadow AI is supported by [Arctic Wolf Networks]({{ site.baseurl }}/members/awn.html), with matching support from the Florida High Tech Corridor.

## Open questions

- How far does a classifier trained on one machine transfer to a different unit of the same model, and to a different model entirely?
- What distance, sample rate, and trace count does a realistic attack require, as opposed to a laboratory demonstration?
- Which workload properties drive separability — memory access pattern, arithmetic intensity, or something the model finds that we have not named?

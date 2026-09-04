---
title: PUPS
subtitle: Platform for Untethered Payload Swarms
image: images/projects/pups.jpg
sponsor: [ucf]
projectmembers:
-
  id: marcus-simmonds
  name: "Marcus Simmonds"
  role: "Alumni Mentor — prior project lead"
  start-date: "2026-01-06"
tags:
  - active
  - swarm autonomy
  - embedded systems
  - edge computing
  - hardware platform
prq: What does a swarm testbed have to provide before results measured on it can be trusted?
---

Swarm autonomy research has a reproducibility problem, and most of it is a hardware problem. Results reported in simulation rarely survive contact with real radios and real batteries, and results reported on bespoke airframes rarely survive contact with anyone else's. PUPS is the lab's answer: a documented, untethered platform built so that a coordination claim can be tested rather than asserted.

The design work is a set of explicit trades, and holding them straight is most of the project:

- **Payload against endurance.** Every gram of sensing or compute is flight time removed. We are characterizing that curve rather than guessing at a point on it.
- **Onboard compute against power.** Running [SHARKS]({{ site.baseurl }}/projects/sharks.html) coordination locally is the point of an untethered platform, but the processor that makes it possible is also a meaningful fraction of the power budget.
- **Telemetry against interference.** A run nobody can reproduce is not a result. PUPS logs enough state to replay a flight, without the telemetry link itself becoming the bottleneck the experiment is measuring.

The platform is deliberately not a product. It is instrumentation — and like any instrument, its own error characteristics have to be known before anything measured with it means much.

## Open questions

- What is the minimum sensing and compute payload that still supports decentralized coordination, and what does carrying it cost in endurance?
- How much of an observed coordination failure is attributable to the algorithm versus the platform, and can the logs separate the two after the fact?
- Can the airframe and stack be documented well enough that another lab reproduces our numbers?

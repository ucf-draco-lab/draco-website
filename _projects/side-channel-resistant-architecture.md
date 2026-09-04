---
title: Side-Channel-Resistant Computer Architecture
subtitle: Partially Homomorphic Execution in Real Hardware
image: images/projects/SHARE.jpeg
redirect_from:
  - /projects/Side-Channel%20Resistance.html
projectmembers:
-
  id: jarred-long
  name: "Jarred Long"
  role: "Project Lead"
  start-date: "2024-08-19"
tags:
  - active
  - hardware security
  - computer architecture
  - side-channel
  - homomorphic encryption
prq: Are partially homomorphic architectures practical for side-channel security once they exist in hardware?
---

An architecture that computes on encrypted data does not leak plaintext through a side channel, because there is no plaintext to leak. That is the appeal of partially homomorphic execution as a side-channel defense, and in simulation the argument holds cleanly.

Hardware is where the argument gets tested. This project builds on the E3X instruction set architecture, which specifies side-channel-resistant execution over a partially homomorphic cryptosystem, and moves it out of simulation and onto real logic. The questions that matter are the ones simulation cannot answer:

- **Timing.** Does the implementation retain the constant-time behavior the ISA specifies, once a real memory hierarchy and real control logic are involved?
- **Power.** Simulation models switching activity; it does not model a power delivery network. Whether the encrypted representation still hides the operand once measured at the pins is an empirical question.
- **Area and performance.** A defense whose overhead is prohibitive is a defense nobody deploys. Establishing the actual cost is part of establishing whether the approach is viable at all.

The project connects directly to the lab's [Encrypted Processor Framework & Accelerator]({{ site.baseurl }}/projects/encrypted-processor.html), which approaches the same territory from the cryptosystem side rather than the architecture side.

## Open questions

- Do the ISA's side-channel guarantees survive synthesis, place-and-route, and measurement on real silicon?
- What is the honest area, power, and performance overhead relative to an unprotected baseline running the same workload?
- Which parts of a realistic program can run encrypted, and where must the architecture fall back — and does that fallback reintroduce the leak?

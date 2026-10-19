---
title: LATTE
subtitle: LATtice Trace Exploration
image: images/projects/latte.jpg
sponsor: [northrop-grumman]
projectmembers:
-
  id: lina-rahama
  name: "Lina Rahama"
  role: "Project Lead — Northrop Grumman Scholar"
  start-date: "2026-10-19"
-
  id: alexei-solonari
  name: "Alexei Solonari"
  role: "Bench Mentor — Aegis lead"
  start-date: "2026-10-19"
-
  id: ilona-van-der-linden
  name: "Ilona van der Linden"
  role: "Research Mentor"
  start-date: "2026-10-19"
tags:
  - active
  - side-channel
  - post-quantum cryptography
  - cryptography
  - embedded systems
  - countermeasures
prq: How much of a post-quantum secret key leaks through a microcontroller's power draw, and what do optimized and masked implementations actually buy?
---

Post-quantum cryptography is no longer a future problem. NIST standardized ML-KEM (FIPS 203, the algorithm formerly called Kyber) in 2024 to replace the key exchange a large quantum computer would break, and it is already being built into embedded and IoT parts. Those are exactly the devices an attacker can hold in their hand and measure.

The core of ML-KEM decryption multiplies the secret key by attacker-supplied ciphertext, one coefficient at a time, in the number-theoretic transform (NTT) domain, then accumulates the results. That is the same arithmetic shape as a neural-network layer: a known input, multiplied by a secret value, summed. Our [Aegis]({{ site.baseurl }}/projects/aegis.html) project already recovers secret weights from that shape on a Cortex-M4. LATTE asks whether the same power models and search methods recover a post-quantum key.

The work runs on the Aegis bench (a ChipWhisperer-Husky capturing an STM32F3 target) and climbs in three steps:

- **Unprotected.** Recover the full secret key from a reference build, using Hamming-weight models of the first product and the running accumulator, with beam search over joint guesses. Each key coefficient has only 3,329 possible values, far fewer than the parameters Aegis already recovers.
- **Optimized.** Repeat against the hand-tuned assembly implementations used in practice, measuring the traces needed for full recovery and running test vector leakage assessment (TVLA).
- **Masked.** Test a first-order masked implementation, so the result says what protection actually costs an attacker.

If the same toolkit reads both neural networks and lattice cryptography off a power trace, that says something general about how multiply-accumulate workloads leak, and about which defenses carry over between them.

LATTE is supported by [Northrop Grumman]({{ site.baseurl }}/members/northrop-grumman.html) through the Northrop Grumman Scholars program.

## Open questions

- Do neural-network extraction methods transfer to the NTT multiply in ML-KEM, and how many traces do they need?
- How much of the leak survives the optimized assembly implementations that real products ship?
- Does a first-order masked implementation close the gap on a modest bench, or only raise the trace count?
- Does the attack carry over from one microcontroller family to another, such as the ESP32?

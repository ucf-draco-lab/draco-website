---
title: Polymorphic Encrypted Components
subtitle: Building Blocks That Never Look the Same Twice
image: images/projects/poly.jpg
tags:
  - active
  - hardware security
  - side-channel
  - obfuscation
  - cryptography
  - logic design
prq: Can a logic component compute a fixed function while presenting a continuously changing implementation to an attacker?
---

Side-channel attacks are statistical. They need many traces of the same operation on the same implementation, and the attack strengthens as traces accumulate. Every countermeasure that works — masking, hiding, shuffling — is at bottom an attempt to break that accumulation.

This project takes the idea from an unlikely source. Polymorphic and metamorphic malware defeats signature detection by never presenting the same binary twice, while preserving behavior exactly. The analogue in hardware would be a component that computes a standard operation under a key that changes continuously, so that the implementation an attacker profiles is never the implementation that runs next.

We are building those components at the level of fundamental logic — the building blocks a larger design composes — rather than as a wrapper around a finished one. The reason is composability: a polymorphic primitive can be used to construct systems whose resistance follows from the parts, instead of being retrofitted onto a design that leaks by construction.

The obvious costs are area, power, and the key schedule itself, which becomes a side-channel target in its own right. Naming that honestly is part of the work; a defense that relocates the vulnerability rather than removing it is worth knowing about before it ships.

## Open questions

- What granularity of polymorphism actually defeats trace accumulation, as opposed to merely slowing it down by a constant factor?
- What are the area and power costs relative to conventional masking at comparable security?
- Does the key distribution and update mechanism become the weakest point, and what does protecting it cost in turn?

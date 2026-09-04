---
title: Encrypted Processor Framework & Accelerator
subtitle: A Framework for Fast, Secure Processing
image: images/projects/epfa.webp
poster: images/projects/2025/encrypted-processor.jpg
poster_caption: Encrypted Processor Framework & Accelerator research poster.
projectmembers:
-
  id: jarred-long
  name: "Jarred Long"
  role: "Project Lead"
  start-date: "2025-08-18"
tags:
  - active
  - encryption
  - computer architecture
  - accelerator
  - homomorphic encryption
  - hardware security
prq: Can a modified cryptosystem support computation on encrypted data at a cost that fully homomorphic encryption cannot reach?
---

Fully homomorphic encryption solves the right problem and charges too much for it. Arbitrary computation over ciphertext is a genuine result, and the overhead — orders of magnitude, depending on the scheme and the circuit depth — keeps it out of most places it would be useful.

This project takes the opposite starting point. Rather than accepting FHE's generality and attacking its cost, we modify a well-understood cryptosystem to support the operations that matter, and build the accelerator that makes those operations fast. The target is deliberately in between: stronger than computing on plaintext, and cheap enough to be a real option where FHE is not.

Two halves, and neither works alone:

- **The framework** defines what can be computed under encryption, what the modification costs in security margin, and where a program must break out to plaintext. That last boundary is the security-critical one, and stating it precisely is most of the intellectual work.
- **The accelerator** makes the resulting primitives fast in hardware. A framework whose operations are too slow to use is a paper result.

The work is a sibling to the lab's [Side-Channel-Resistant Computer Architecture]({{ site.baseurl }}/projects/side-channel-resistant-architecture.html) project, which arrives at overlapping territory from the architecture side.

## Open questions

- What security margin does the modification actually cost, stated against a standard model rather than by analogy?
- Which real workloads fit inside the supported operation set without breaking out to plaintext so often that the guarantee stops meaning anything?
- What is the accelerator's speedup over a software implementation, and how does it compare against FHE on the same problem?

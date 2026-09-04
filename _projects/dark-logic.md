---
title: Dark Logic
subtitle: Complexity Reduction for Formal Verification
image: images/projects/dark_logic.webp
poster: images/projects/2025/dark-logic.jpg
poster_caption: Dark Logic research poster, from the project's earlier phase on AI-generated malicious RTL.
sponsor: [ucf]
redirect_from:
  - /projects/verification_of_ai_generated_models.html
projectmembers:
-
  id: michael-castiglia
  name: "Michael Castiglia"
  role: "Project Lead"
  start-date: "2026-01-06"
-
  id: franco-mezzarapa
  name: "Franco Mezzarapa"
  role: "Prior project lead"
  start-date: "2025-08-18"
-
  id: joshua-joseph
  name: "Joshua Joseph"
  role: "Alumni Mentor — prior project lead"
  start-date: "2023-11-22"
tags:
  - active
  - formal verification
  - model checking
  - theorem proving
  - verilog
  - hardware verification
prq: What makes formal verification tractable on designs large enough to matter?
---

Formal verification is sound, complete, and largely unused on designs of production scale. The reason is not skepticism — it is state explosion. Model checking a block is routine; model checking the system that block sits in is frequently not attempted, because the proof does not finish. Everything downstream of that fact, including the industry's reliance on simulation coverage as a proxy for correctness, follows from it.

Dark Logic attacks the cost directly. The work is on the techniques that shrink what a checker or a prover must actually establish:

- **Abstraction.** Replacing a subsystem with a model coarse enough to reason about and faithful enough that the result still means something. The art is entirely in that second clause.
- **Decomposition.** Splitting a property into obligations that can be discharged separately, and being honest about what the composition of those obligations does and does not prove.
- **Invariant discovery.** Finding the inductive invariants that make a proof close, which is where most of the human effort in a real verification effort actually goes.

The project reached this question from the other side. It began by asking whether generative models could insert malicious RTL that survived formal verification — and the recurring obstacle was that verification frequently did not complete at all on designs of interesting size. A defense that does not scale is not much of a defense, so the scaling problem became the project.

## Open questions

- Which abstractions preserve the security properties we care about, as opposed to the functional properties the literature usually targets?
- Can invariant discovery be automated well enough to matter on RTL that a human did not write with verification in mind?
- Where exactly is the boundary today — what size and structure of design can be verified, and what breaks first when you exceed it?

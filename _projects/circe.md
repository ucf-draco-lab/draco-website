---
title: Circe
subtitle: Cross-Model Identification of Robustness, Correctness & Errors in LLM-Generated RTL Assertions
image: images/projects/circe.jpg
projectmembers:
-
  id: ilona-van-der-linden
  name: "Lona van der Linden"
  role: "Project Lead"
  start-date: "2026-08-17"
-
  id: sebastian-candelaria
  name: "Sebastian Candelaria"
  role: "Undergraduate Researcher"
  start-date: "2026-08-17"
-
  id: nicole-baez-espinosa
  name: "Nicole Baez"
  role: "Undergraduate Researcher"
  start-date: "2026-08-17"
-
  id: matias-segura
  name: "Matias Segura"
  role: "Graduate Researcher"
  start-date: "2026-08-17"
tags:
  - active
  - artificial intelligence
  - formal verification
  - hardware verification
  - assertion-based verification
  - large language models
prq: How reliably can LLM-generated RTL assertions be trusted when specifications are incomplete, ambiguous, or inconsistent, and what interventions best recover correctness?
---

Large language models are increasingly capable of generating hardware verification artifacts, including RTL assertions for assertion-based verification. Most existing approaches, however, are evaluated under favorable conditions: complete specifications, trusted golden RTL models, and metrics that reward syntactic correctness or successful proof. CIRCE asks a different question. When these assumptions begin to break down, how and why do the generated assertions fail?

**Failure Characterization.** We establish a systematic taxonomy of failures in LLM-generated RTL assertions, including vacuity, tautologies, over-constrained properties, hallucinated signals, and specification-misaligned assertions. Rather than treating all incorrect outputs equally, we seek to understand which failures occur, why they occur, and how frequently they arise across models and benchmarks. Particular attention is given to silent failures that appear valid while checking little or nothing meaningful.

**Robustness and Recovery.** We study how assertion quality changes as specifications become ambiguous, incomplete, or inconsistent, and as trusted reference implementations become unavailable. We then evaluate interventions such as human-in-the-loop clarification, LLM-as-judge filtering, formal-tool feedback, and self-consistency techniques to determine which approaches best recover performance and detect silent errors under degraded conditions.

CIRCE aims to provide a benchmark-driven understanding of the trustworthiness, robustness, and failure modes of LLM-generated verification collateral, helping define when these systems can be confidently used in industrial verification workflows.

The project sits alongside the lab's other work on reading hardware rather than writing it — [RTL Insight]({{ site.baseurl }}/projects/rtl-insight.html) asks what static analysis can tell a designer about a design; CIRCE asks what a language model's claims about that design are worth.

## Open questions

- Given a complete spec and a golden RTL model, what failure modes — vacuity, tautology, over-constraint, hallucinated signals, spec-misaligned but valid assertions — do LLM-generated assertions exhibit, and at what rates, as measured by formal oracles?
- To what extent is assertion generation sensitive to specification ambiguity, incompleteness, and inconsistency?
- How can interventions — human-in-the-loop clarification, LLM-as-judge, formal-tool feedback loops, self-consistency — recover performance under degraded conditions?

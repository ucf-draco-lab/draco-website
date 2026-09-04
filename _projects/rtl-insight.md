---
title: RTL Insight
subtitle: Static Analysis for RTL
image: images/projects/rtl-insight.jpg
sponsor: [amd]
redirect_from:
  - /projects/automated_rtl_gen.html
projectmembers:
-
  id: alicia-thoney
  name: "Alicia Thoney"
  role: "Project Lead"
  start-date: "2026-01-06"
-
  id: andey-robins
  name: "Andey Robins"
  role: "Alumni Mentor — prior project lead"
  start-date: "2023-10-10"
tags:
  - active
  - static analysis
  - verilog
  - yosys
  - dataflow analysis
  - design tooling
prq: What can static analysis tell a designer about RTL that reading it cannot?
---

Verilog does not surface its own structure. A module that fits on a screen can have dataflow no reader will reconstruct, and by the time a design reaches production scale the gap between what the code says and what a person can hold in their head is total. Designers compensate with simulation, convention, and institutional memory — none of which is analysis.

RTL Insight builds tooling that closes some of that gap. The work sits on [Yosys](https://yosyshq.net/yosys/), using its elaborated netlist as the substrate for dataflow analysis, and produces two kinds of output: extraction, which answers structural questions about a design, and visualization, which makes the answer legible to the engineer who has to act on it. Both matter. An analysis nobody can read gets ignored the same as no analysis at all.

The techniques are borrowed openly from compilers, where reasoning about program structure at scale has been standard for decades. Hardware description languages have not benefited from that work nearly as much as they could have, largely because the semantics differ enough to make the transfer real research rather than a port.

This project succeeds an earlier effort on automated RTL generation, which evaluated how well transformer models could synthesize Verilog. That work established the harder half of the problem is not generating hardware description but understanding it — which is the question RTL Insight now asks directly.

RTL Insight is supported by [AMD]({{ site.baseurl }}/members/amd.html).

## Open questions

- Which compiler dataflow analyses transfer cleanly to elaborated RTL, and which are defeated by hardware semantics?
- What structural queries do designers actually want answered, as opposed to the ones that are convenient to compute?
- Can security-relevant structure — information flow, unreachable logic, unexpected fan-in to a sensitive signal — be surfaced as a first-class result rather than inferred by hand?

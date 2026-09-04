---
title: Dark Matter
subtitle: Analog and Mixed-Signal Trojans
image: images/projects/dark-matter.jpg
tags:
  - active
  - hardware trojans
  - analog
  - mixed-signal
  - verification
  - trust
prq: What can be hidden in the analog and mixed-signal blocks that digital verification never examines?
---

The hardware trust literature is overwhelmingly digital. Formal verification, equivalence checking, information flow analysis, Trojan detection benchmarks — all of it operates on logic. Meanwhile every real chip contains analog and mixed-signal blocks that the entire digital toolchain treats as opaque: phase-locked loops, data converters, power management, bias and reference circuits, I/O.

Dark Matter is the third entry in the lab's Trojan series, after [Dark Logic]({{ site.baseurl }}/projects/dark-logic.html) at RTL and Dark Fabric at the FPGA bitstream. It moves the question into the part of the design where the standard defenses do not reach — not because they fail, but because they were never pointed there.

The premise is uncomfortable and straightforward. A malicious modification to a clock generator, a reference voltage, or an ADC's calibration does not have to change a single line of RTL to change what the digital logic computes. It does not appear in a netlist diff. It does not violate an equivalence check. Under nominal conditions it may not appear at all, surfacing only at a particular temperature, supply voltage, or process corner — which is also the region where legitimate analog behavior is hardest to distinguish from illegitimate.

## Open questions

- What is the realistic payload of an analog or mixed-signal Trojan? Denial of service is easy; controlled, targeted corruption is the interesting claim.
- Which existing analog verification and test practices incidentally catch these, and which are structurally blind?
- Can detection be built from characterization data a foundry already produces, or does it require measurement nobody is currently taking?

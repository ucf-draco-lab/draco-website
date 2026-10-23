---
title: "Proofs That Become Alarms: Safety-Centric Design for Drone Avionics"
kicker: "Interactive paper · IEEE NAECON 2008"
subtitle: "An interactive companion to Ranga Vemuri, Mike Borowczak, and Annie Avakian's methodology for flight-control computers: prove a design once for a whole family of aircraft computers, then turn the proof into checks that run in flight."
description: "Plant a bug in a pitch-hold controller and see which run-time checks catch it, open each block's proof and the C++ assertion generated from it, and refine a family of aircraft computers to watch one proof carry to every member, following the two-part methodology of the NAECON 2008 paper."
share_description: "Flight software for drones is tested until the budget runs out. This paper proposes proving a design once for a whole family of aircraft computers and turning the proof into alarms that run in flight. Plant a bug and see which alarm catches it, written for five reading levels."
share_text: "Prove a flight controller once, then let the proof watch it in flight. Plant a bug and see which alarm catches it:"
share_image: /papers/avionics-safety-design/share.png
share_image_alt: "A simulated pitch-hold flight in which a flipped integrator sign drifts the aircraft away from its bug-free path while the input and output checks stay quiet and the block-level integrator check fires at once, under the title Proofs That Become Alarms."
date: 2026-10-21
topics: ["Architecture"]
default_level: public
level_hints:
  public: No background needed
  hs: Blocks, signals, and a little algebra
  ug: Control blocks, assertions, and programming
  grad: Formal refinement and run-time verification
  res: Full method, page model, and open questions
authors:
  - name: Ranga Vemuri
    affiliation: University of Cincinnati
  - name: Mike Borowczak
    affiliation: University of Cincinnati
    member: mike-borowczak
  - name: Annie Avakian
    affiliation: University of Cincinnati
sources:
  - venue: "IEEE National Aerospace and Electronics Conference (NAECON) · 2008 · pp. 293–299"
    title: "Safety-Centric Design of Distributed Embedded Avionics"
    url: https://doi.org/10.1109/NAECON.2008.4806561
    access: Paywalled (IEEE)
code:
  label: "This page's engine, independent Python reference, and checks (no authors' code exists)"
  url: https://github.com/ucf-draco-lab/draco-website/tree/main/papers/avionics-safety-design
citations:
  - vemuri2008safety
widget:
  css:
    - /papers/avionics-safety-design/widget.css
  js:
    - /papers/avionics-safety-design/sac-engine.js
    - /papers/avionics-safety-design/widget.js
credit: "Interactive page by the [DRACO Lab](/). The paper presents a methodology and reports no implementation or measurements, so the only published numbers a page can check are its worked refinement example: `sac-engine.js` accepts N1 = 9 and D1 = 15 ms as a refinement of N1 > 4 and D1 < 20 ms and rejects N1 = 4 and D1 = 20 ms, as the paper states. The pitch-hold controller, its five block lemmas, the bugs, and the three monitoring policies are this page's model of Section IV, labeled as simulated. An independent Python implementation (`reference/sac_reference.py`), which checks refinement by brute-force membership instead of interval arithmetic, agrees with the engine on all 2,258 comparisons, including every simulated pitch value bit for bit; the testing-hours figures agree to within one part in 10¹⁴ (JavaScript and C logarithms can differ in the last bit). Everything runs on your device."
bibtex: |
  @inproceedings{vemuri2008safety,
    author    = {Vemuri, Ranga and Borowczak, Mike and Avakian, Annie},
    title     = {Safety-Centric Design of Distributed Embedded Avionics},
    booktitle = {IEEE National Aerospace and Electronics Conference (NAECON 2008)},
    pages     = {293--299},
    year      = {2008},
    publisher = {IEEE},
    doi       = {10.1109/NAECON.2008.4806561}
  }
---

<div class="lede" data-levels="public" markdown="1">
A drone's autopilot runs on small computers that read sensors, decide, and move the control surfaces many times a second. Checking that software by testing alone can consume more than half of a drone's development budget, and a slightly different computer in the next model can mean testing all over again. Ranga Vemuri, Mike Borowczak, and Annie Avakian at the University of Cincinnati proposed two remedies. First, describe a whole family of aircraft computers with a single mathematical model and prove the control software correct once for the family, so every member inherits the proof. Second, turn each step of that proof into an alarm that runs inside the software during flight, so a mistake gets caught close to where it starts.
</div>

<div class="lede" data-levels="hs" markdown="1">
An autopilot is a chain of simple blocks: subtract, multiply, add up over time, and limit. Each block makes a promise ("if my input is in this range, my output follows this rule"), and the promises chain together into a promise for the whole autopilot. Vemuri, Borowczak, and Avakian proposed proving those promises with a computer once, for a whole family of aircraft computers, and then compiling every promise into a check that runs in flight. On this page you can plant a bug in a small autopilot, read the promise behind each block, and see which checks catch which bugs.
</div>

<div class="lede" data-levels="ug" markdown="1">
The paper treats unmanned aerial vehicle (UAV) avionics as sense-actuate-control (SAC) networks: distributed controllers on microcontrollers, digital signal processors (DSPs), and field-programmable gate arrays (FPGAs), each driving a few actuators from a few sensors. It proposes a two-part methodology. Part one defines a family of SAC architectures as a parameterized formal model and derives members by refinement (restriction, specialization, composition, and scheduling), so a proof made at one level holds for everything below it. Part two generates run-time assertions from the design-time correctness proof of a control law, one per lemma, and inserts them at the boundaries of the auto-generated code.
</div>

<div class="lede" data-levels="grad" markdown="1">
Vemuri, Borowczak, and Avakian (NAECON 2008) target the verification and validation (V&V) cost of flight-critical autonomy, where certification asks for a loss-of-control probability below 10⁻⁹ and near-exhaustive testing already exceeds half of UAV development budgets. Their methodology couples two formal techniques. Architectures are higher-order-logic models with typed, uninstantiated parameters; refinement constrains parameters, so a property proved against an abstract architecture holds on every refinement. Control laws composed from tool-kit primitives are proved correct as a chain of local lemmas, ∀*i* ∈ *I*ₖ. *P*ₖ(*i*) ⇒ *P*ₖ₊₁(*F*ₖ(*i*)), and each lemma compiles to an assertion, giving error monitors that mirror the proof tree and can be switched on level by level.
</div>

<div class="lede" data-levels="res" markdown="1">
This is a methodology paper (seven pages, Air Force Research Laboratory (AFRL) Summer Faculty Fellowship support) with no implementation, case study, or measurement; the authors describe tools under development. The page therefore reproduces the paper's worked refinement example exactly and builds everything else as a labeled model: a six-node architecture family with interval-domain refinement and composition, and a pitch-hold control law whose five block lemmas, two module lemmas, and global theorem compile to run-time checks under three monitoring policies, including the escalation policy of Section IV. An independent Python reference verifies the engine bit for bit. The notes at the end list what the model adds and where it exposes limits the paper leaves implicit.
</div>

## Plant a bug, watch the alarms

<div id="av-catch" class="w-demo"></div>

<div data-levels="public" markdown="1">
The dashed line is the pitch the pilot asks for, the faint line is the flight without a bug, and the bright line is the flight with the bug you picked. The page opens on **Integrator sign flipped**, a one-character mistake that makes part of the autopilot push the wrong way. With **Inputs and output only**, no alarm ever rings: the autopilot's output stays inside the range it promised, yet the aircraft drifts more than eight degrees from where it should be. Switch to **Every block** and the alarm rings in the same instant the bug appears, and it names the integrator as the culprit. Then try **Switch to backup law** to see what an early alarm buys.
</div>

<div data-levels="hs" markdown="1">
Each colored box below the chart is one check. Dashed boxes are switched off, filled boxes ran and passed, and red boxes raised an alarm at least once. Try every bug with **Inputs and output only**. The gain typo and the sensor spike trip the outer checks at once; the flipped sign, the memory bit flip, and the stuck sensor slip past. Now switch to **Every block**: the block checks catch the flipped sign and the bit flip immediately and point to the integrator. The cost is more checking: 4,000 checks in an eight-second flight instead of 1,200.
</div>

<div data-levels="ug" markdown="1">
The controller runs every 20 ms for 400 frames, and the bug appears at the slider's time. **Inputs and output only** evaluates the pre-condition *P*ᵢ on the command and the sensor and the post-condition *P*ₒ on the elevator command; **Every block** adds the two module lemmas and the five block lemmas; **Escalate on alarm** follows the paper's policy for performance testing, switching on the next level of checks only after a level above fails. With the gain typo (Kp coded as 15 instead of 1.5), escalation catches the bug at the output, turns on the modules, and pins it to GAIN two frames later. With the flipped sign it never escalates, because nothing at the top ever fails.
</div>

<div data-levels="grad res" markdown="1">
The table holds every bug under every policy at the current onset, with the service action chosen above; "+*n*" is frames from the bug to localization. Two behaviors drive the results. The output post-condition proved from the lemmas, |*u* − sat(*K*ₚ*e*)| ≤ *S*ₘₐₓ, is strictly weaker than their conjunction, so any bug whose effect stays inside the integrator clamp (the flipped sign and the bit flip) is invisible at the boundary. The bit flip is also transient: the clamp absorbs it in one frame, so a policy that waits for a top-level alarm before switching on the integrator check can never catch it. Under **Switch to backup law**, escalation trades diagnosis for safety: the gain bug is masked the moment the backup takes over, and no finer check ever sees it.
</div>

## From a proof to an alarm

<div id="av-proof" class="w-demo"></div>

<div data-levels="public" markdown="1">
The autopilot on this page is five blocks wired together. Pick any block to read the promise it makes: what it assumes about its input and what it guarantees about its output. Engineers prove each promise with a computer before the aircraft flies. The paper's idea is to keep those promises around after the proof and check them during flight as well. A broken promise means the software no longer does what was proved, and the alarm points straight at the block that broke it.
</div>

<div data-levels="hs" markdown="1">
Follow the signals: the error *e* is the command minus the measured pitch, GAIN multiplies it by 1.5, INT keeps a running total of small errors (never more than 15 degrees), SUM2 adds the two, and SAT limits the result to the 25 degrees the elevator can move. Each block's promise only needs the promise of the block before it. Chaining the five promises gives one promise for the whole autopilot, which is how a proof of a big program gets built out of proofs of small pieces.
</div>

<div data-levels="ug" markdown="1">
The code panel shows the assertion the page generates from each lemma, written as it would sit at the block boundary in auto-generated C++. Modules A and B (dashed outlines) group the blocks into the intermediate level of the proof hierarchy; their lemmas compile to coarser checks. The paper places this assertion generator inside the auto-coder itself, so the checks come with the code and follow the same decomposition as the proof. The boundary checks come from the global theorem, shown below the diagram.
</div>

<div data-levels="grad res" markdown="1">
The global property follows from the local ones in the two-step form of Section IV: local correctness ∀*i*. *P*ₖ(*i*) ⇒ *P*ₖ₊₁(*F*ₖ(*i*)) for each block, then global correctness by composition. Here |*s*| ≤ *S*ₘₐₓ (INT), *v* − *p* = *s* (SUM2), and the 1-Lipschitz saturation (SAT) give |*u* − sat(*K*ₚ*e*)| ≤ *S*ₘₐₓ. The block lemmas are functional (equalities to within 10⁻⁹), while the global post-condition is a bound, and that loss of information is what that makes block-level monitors detect bugs the boundary monitors cannot.
</div>

## One proof for a family of aircraft computers

<div id="av-family" class="w-demo"></div>

<div data-levels="public" markdown="1">
Drone makers build families of flight computers: a small one for a cheap drone, a faster one for a larger aircraft, and many in between. Each box here describes a set of possible computers, and each step down the tree pins down more details. Pick a property and the highlighted boxes show where it holds. Once proved at the highest highlighted box, the property holds for every computer below it, with no new testing. ARCH-1 and ARCH-2 use the exact numbers from the paper's example.
</div>

<div data-levels="hs" markdown="1">
The paper's example: an abstract design allows any number of integrator blocks (N1) and any delay (D1). A first refinement says N1 > 4 and D1 < 20 ms, and a second pins N1 = 9 and D1 = 15 ms. Any property proved for every computer with N1 > 4 and D1 < 20 ms still holds when N1 = 9 and D1 = 15 ms, because nine is more than four and 15 is less than 20. Select ARCH-5, a low-end design with at most six integrators: the pitch-hold proof does not reach it, because a delay of up to 30 ms breaks one of its assumptions.
</div>

<div data-levels="ug" markdown="1">
The tree uses all four refinement types the paper names: restriction (ARCH-1, ARCH-5), instantiation (ARCH-2), scheduling and specialization (ARCH-3, at most three differentiators per frame and a generic unit that only adds and subtracts), and composition (ARCH-4 merges ARCH-2 and ARCH-3). Composition checks for conflicts: ARCH-2 with ARCH-5 fails, since no computer has exactly nine integrators and at most six. Use the sliders to refine the selected node yourself; the page reports whether your constraints actually narrow it.
</div>

<div data-levels="grad res" markdown="1">
Each architecture is a box of parameter domains (integer intervals for N1 and K, a real interval with open or closed ends for D1, and a set for the generic unit's operations), refinement is domain inclusion, and composition is intersection with emptiness as the conflict test. A property is a requirement box, and it holds on a node when the node lies inside it. Inheritance down the tree is then transitivity of inclusion. The paper works in higher-order logic, where properties can relate parameters to each other and to the application; the box model captures the paper's examples and its central claim, and the researcher notes list what it leaves out.
</div>

<div data-levels="grad res" markdown="1">
## How long would testing alone take?

<div id="av-testing" class="w-demo"></div>

The paper motivates its methodology with the certification target (a loss-of-control probability below 10⁻⁹) and the cost of near-exhaustive testing. This demo, computed by the page and not taken from the paper, puts a number on that gap. Under a constant failure rate, demonstrating a rate below λ with confidence *C* after failure-free operation needs −ln(1 − *C*)/λ hours: about three billion hours at 95% confidence for 10⁻⁹ per hour, or nearly 60,000 years for 50 test aircraft flying 1,000 hours each per year. Proof-based arguments, with monitors as a run-time backstop, are one way around that bound.
</div>

## What the paper found

<div data-levels="public" markdown="1">
- Testing flight software for drones costs more than half of development budgets and has to be repeated for each new computer design.
- Describing a family of flight computers with one mathematical model lets a proof made for the family carry to every member.
- Each step of a proof can become an alarm inside the flight software, which catches mistakes close to where they start.
- Alarms cost computing time, so the paper suggests switching them on in stages: the outer ones first, and finer ones when an outer alarm rings.
</div>

<div data-levels="hs" markdown="1">
- Certification over civilian airspace asks that the chance of losing control because of a failure be below one in a billion.
- A design family can be narrowed step by step (for example, more than four integrators and under 20 ms of delay, then exactly nine and 15 ms), and anything proved at a step stays true below it.
- Two teams can refine the same design separately and merge their results, as long as the two refinements do not contradict each other.
- Every lemma in a correctness proof can be turned into a software check, so the checks match the proof one to one.
- The authors were building tools and test cases to show the method at work; the paper describes the plan.
</div>

<div data-levels="ug grad res" markdown="1">
- **The problem.** Flight certification requires a loss-of-control probability below 10⁻⁹, and testing-based V&V already consumes more than 50% of UAV development budgets (citing Crum et al., 2004).
- **Architecture families.** A SAC platform is a parameterized formal model of a family; refinement by restriction or instantiation, specialization, composition, and scheduling and allocation derives members, and properties proved at a node hold for all its refinements. Legacy systems can be modeled bottom-up the same way.
- **The worked example.** An abstract architecture with N1 integrators, N2 gain stages, and delays D1 and D2 is refined to N1 > 4 and D1 < 20 ms and then to N1 = 9 and D1 = 15 ms; a controller verified at the first refinement stays verified at the second.
- **Proof-directed monitors.** Control laws are assembled from tool-kit primitives with formal models; the correctness proof is decomposed into local lemmas and a global theorem, and each lemma compiles to a run-time assertion at a procedure boundary, inside the auto-coder.
- **Monitor policies.** All checkers run during pre-deployment test; for performance tests, primary checkers run first and finer ones switch on after a failure; in deployment, the active set trades detection margin, real-time constraints, and localization. A failed check calls a service routine that can abort, restore a stable state, or switch to a safer control law.
</div>

<div data-levels="grad res" markdown="1">
<div class="av-table-wrap">
<table class="results-table">
<caption class="w-note">What the paper states and what this page computes from it.</caption>
<thead><tr><th>Item</th><th>Paper</th><th>This page</th></tr></thead>
<tbody>
<tr><td>Refinement example</td><td>N1 &gt; 4, D1 &lt; 20 ms, then N1 = 9, D1 = 15 ms</td><td>accepted as a refinement; N1 = 4 and D1 = 20 ms rejected</td></tr>
<tr><td>Scheduling example</td><td>no more than three differentiators at the same time</td><td>K ≤ 3 on ARCH-3</td></tr>
<tr><td>Specialization example</td><td>a generic unit that adds and subtracts</td><td>FU = {add, sub} on ARCH-3</td></tr>
<tr><td>Monitors</td><td>one per lemma, along the proof hierarchy</td><td>three boundary, two module, and five block checks</td></tr>
<tr><td>Escalation policy</td><td>described, not evaluated</td><td>simulated on five page-chosen bugs</td></tr>
<tr><td>Measured results</td><td>none (tools under development)</td><td>all simulation results labeled as the page's</td></tr>
</tbody>
</table>
</div>
</div>

## Why it matters

<div data-levels="public hs" markdown="1">
Drones now inspect bridges, deliver medicine, and fly near people, and each new model brings a new flight computer. If every new computer needs the full round of testing, safety either gets expensive or gets skipped. This paper's two ideas push the work earlier: prove once for a family, and keep the proof watching in flight. Ultimately, the page's simulated autopilot shows the payoff and the limit together: block-level alarms catch bugs that outer checks miss, and no alarm can catch a problem that the proof itself assumed away, such as a sensor stuck at a believable value.
</div>

<div data-levels="ug" markdown="1">
Product-line and platform-based design already reuse hardware and software; this paper extends reuse to verification effort, which is the dominant cost for flight-critical code. The monitor half connects two activities that usually live apart, design-time proof and run-time assertion checking, and makes the assertions trustworthy because each one is a proved lemma. The same pattern applies anywhere generated code runs on varied hardware, from automotive controllers to the firmware of programmable logic.
</div>

<div data-levels="grad res" markdown="1">
The paper anticipates two lines of work that matured later: correct-by-construction refinement of platform models, and runtime verification that derives monitors from specifications. Its distinctive move is to derive monitors from the proof's internal lemmas rather than from the top-level specification alone, which buys localization and earlier detection at the cost of overhead, and makes the active monitor set a tunable safety parameter. The page's simulation shows why that choice matters: the boundary property implied by the lemmas can be strictly weaker than the lemmas, and transient faults can vanish before an escalation policy reaches them.
</div>

<div data-levels="res" markdown="1">
## Notes from building this page

- **No results to reproduce.** The paper reports no implementation, benchmarks, or measurements; its conclusion says tools and test cases are in development. The only checkable numbers are the refinement example, which the engine reproduces. Every simulated figure on this page comes from the page's own model and is labeled so.
- **The refinement figure.** The paper's figure shows a Core architecture refined into ARCH-1 to ARCH-6, but the edges cannot be recovered reliably from the text layer. The page's six-node tree is its own; ARCH-1 and ARCH-2 carry the paper's numbers, ARCH-3 carries its scheduling and specialization examples, and ARCH-4 and ARCH-5 are illustrations.
- **Inheritance holds for universal properties.** Interval inclusion makes "proved here, holds below" automatic for properties of the form "every instance satisfies *R*." Properties that quantify existentially (some schedule meets the deadline) or depend on optimality do not inherit this way, and a refinement that adds features (the paper's point that refined architectures can satisfy more) is outside the box model.
- **The boundary theorem is weaker than its lemmas.** On the page's controller the global post-condition bounds the output to within *S*ₘₐₓ of sat(*K*ₚ*e*); bugs confined to the integrator never violate it. The paper's escalation policy starts from boundary checks, so it inherits that blind spot: the flipped sign and the bit flip are never escalated. A deployment policy would need some block-level checks always on for state-holding blocks.
- **Transient faults and escalation.** A one-frame upset is absorbed by the integrator clamp before any finer check switches on. Escalation localizes persistent faults (the gain typo is pinned to GAIN two frames after the first alarm) but not transient ones.
- **Recovery can hide the source.** With the backup law engaged at the first alarm, the faulty implementation stops running and escalation never localizes the gain bug. Diagnosis and recovery compete for the same moment; the paper's service routine would need to snapshot state before switching.
- **Monitors check the implementation, not the assumptions.** A pitch sensor stuck at a believable value violates no assertion, because every block still computes the proved function of its inputs, and the aircraft departs 25.6° from the bug-free flight at the default onset. Catching it needs plausibility or redundancy checks on *P*ᵢ that the correctness proof does not supply.
- **The 10⁻⁹ target.** The paper states the probability without a time base; the testing demo reads it per flight hour, the usual reading for catastrophic failure conditions. The zero-failure bound is the page's computation and appears at graduate and researcher levels only.
- **Page choices.** Plant θ̈ = −4θ − 2.4θ̇ + 4*u* (semi-implicit Euler), *K*ₚ = 1.5, *K*ᵢ = 2.0 per second, integrator clamp 15°, elevator limit 25°, 20 ms frames, input ranges 15° (command) and 30° (sensor), and an equality tolerance of 10⁻⁹ relative. The bit flip toggles bit 61 (an exponent bit) of the stored integrator value.
- **Bibliography.** The `vemuri2008safety` entry in `proceedings.bib` gains a DOI and a DOI link in place of a shortened link. The DOI follows the IEEE pattern for this proceedings (article 4806561) and should be confirmed.
</div>

<div data-levels="hs" markdown="1">
## Try this in class

1. Write the promise for each of the five blocks in your own words, using the first and second demos. Then show, step by step, why the five promises together guarantee that the elevator command never goes past 25 degrees.
2. In the first demo, try all five bugs with **Inputs and output only** and record which ones raise an alarm. For each bug that slips through, explain which block's promise it breaks and why the outer check cannot see it.
3. Design a family of three drone computers in the third demo: select ARCH-1 and move the sliders (try at least eight integrators and a delay of at most 15 ms) until the "Larger control law" property holds. Compare the cost of proving that property once against testing each computer separately.
</div>

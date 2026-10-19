---
title: "Router Canaries: Catching a Flood by How Little It Varies"
kicker: "Interactive paper · IEEE ICCE-Berlin 2020"
subtitle: "An interactive companion to Winston Howard and Mike Borowczak's entropy-based canaries, small listeners on network switches that raise an alarm when the traffic they see stops looking varied."
description: "Watch canaries on a simulated network of switches listen to traffic, count destinations in windows of 50 packets, and raise an alarm when a flood narrows them to one target; then set the alarm level from attack-free runs and compare the paper's detection tables with this page's simulation."
share_description: "Ordinary network traffic goes everywhere; a flood goes to one place. Small canaries on home and office switches can hear the difference within seconds. Try the paper's entropy canaries in your browser, written for five reading levels."
share_text: "Ordinary traffic goes everywhere; a flood goes to one place. Small canaries on switches can hear the difference. Try it in your browser:"
share_image: /papers/router-canaries/share.png
share_image_alt: "A chain of six simulated switches with hosts and canaries, beside an entropy trace that drops below the alarm threshold when a quarter of the hosts start flooding one target, under the title Router Canaries."
date: 2026-10-19
topics: ["Networks", "Swarms & IoT"]
default_level: public
level_hints:
  public: No background needed
  hs: Counting, fractions, and logarithms
  ug: Networks, switches, and programming
  grad: Information theory, detection rates, and experiment design
  res: Full method, reproduction, and open questions
authors:
  - name: Winston Howard
    affiliation: University of Wyoming
  - name: Mike Borowczak
    affiliation: University of Wyoming
    member: mike-borowczak
sources:
  - venue: "IEEE ICCE-Berlin · 2020"
    title: "Detecting DDoS Attacks Near the Edge with Router Canaries"
    url: https://doi.org/10.1109/ICCE-Berlin50680.2020.9352164
    access: Paywalled (IEEE)
code:
  label: "Canary, the authors' simulation package (whoward3/canary, GPLv3)"
  url: https://github.com/whoward3/canary
citations:
  - icce-2020-canary
widget:
  css:
    - /papers/router-canaries/widget.css
  js:
    - /papers/router-canaries/canary-engine.js
    - /papers/router-canaries/widget.js
credit: "Interactive page by the [DRACO Lab](/). The browser engine is a port of the authors' Canary package (GPLv3; license header on `canary-engine.js`): its entropy evaluator, its five-window alarm, its attacker and canary draws (with Python's random number generator reproduced draw for draw), its network layout and traffic scripts, and its report scraper. Checked against the authors' own Python: identical window entropies on 2,001 test windows and on every window of 525 canary streams, identical attacker and canary draws on 750 combinations of seed and setting, the package's unit test (entropy 0.38254 below 0.3826), and identical detection rates, detection times, and thresholds when the authors' scraper reads this page's logs. The paper's three thresholds equal 0.90 times its Table I means to the fourth decimal, and one canary under a full flood alarms at exactly 250 packets, as in Table II. The CORE emulator itself does not run in a browser, so ping timing is modeled; the page's attack-free runs land within 0.03 to 0.11 bits of Table I's means. Every simulated figure is labeled as the page's. Everything runs on your device."
bibtex: |
  @inproceedings{howard2020canaries,
    author    = {Howard, Winston and Borowczak, Mike},
    title     = {Detecting {DDoS} Attacks Near the Edge with Router Canaries},
    booktitle = {2020 IEEE 10th International Conference on Consumer Electronics (ICCE-Berlin)},
    year      = {2020},
    doi       = {10.1109/ICCE-Berlin50680.2020.9352164}
  }
---

<div class="lede" data-levels="public" markdown="1">
A distributed denial-of-service (DDoS) attack knocks a website or device offline by having many hijacked machines (often cameras, routers, and other home devices) send it traffic all at once. Winston Howard and Mike Borowczak propose catching these floods close to where they start, on the ordinary switches that connect a home or office. Each switch carries a small "canary" that listens to where packets are going. Everyday traffic heads to many different places; a flood heads to one. When a canary hears traffic narrow to a single target for long enough, it sounds the alarm, before the flood ever leaves the local network.
</div>

<div class="lede" data-levels="hs" markdown="1">
A canary on a network switch reads the destination address of every packet that passes and groups them in batches of 50. For each batch it computes one number, the entropy, which is high when the 50 packets go to many different addresses and low when most go to the same one. If five batches in a row come in below a set threshold, the canary reports an attack. The paper tests this on a simulated network of switches and hosts, with 0 to 100 percent of the hosts flooding one victim, and asks how often the canaries catch the flood and how quickly.
</div>

<div class="lede" data-levels="ug" markdown="1">
The paper places entropy-based detectors on the switches of a small network instead of at one central point. Each canary keeps a window of 50 destination IP addresses, computes the Shannon entropy of their frequencies (Eq. 3), and flags the window when the entropy falls below a threshold set at 90 percent of the mean attack-free entropy (Eq. 4). Five flagged windows in a row trigger a report. The authors built an open-source Python package on the Common Open Research Emulator (CORE) that builds chains of three, six, or nine switches with five hosts each, starts ping-flooding attackers and random-pinging clients, and runs the canaries on the switches.
</div>

<div class="lede" data-levels="grad" markdown="1">
Entropy-based DDoS detection usually runs at a single vantage point, for example a software-defined networking (SDN) controller, and needs enough traffic and distance from the sources to see the drop in destination entropy. Howard and Borowczak distribute the detector instead: independent canaries on edge switches, each with a 50-packet window, a common threshold T = 0.90 × the baseline mean entropy, and a five-consecutive-window rule. The design varies the number of switches s, the attacker composition c, and the number of canaries n, with 30 attack-free trials per topology to set T (Table I) and 15 trials per configuration for detection time and rate (Tables II and III, six switches).
</div>

<div class="lede" data-levels="res" markdown="1">
Howard and Borowczak (ICCE-Berlin 2020) adapt Mousavi and St-Hilaire's entropy-variation detector to independent canaries on CORE-emulated switches and report baseline entropy statistics for s ∈ {3, 6, 9} (Table I) and the mean detection time and detection rate over c ∈ {0, 0.25, 0.5, 0.75, 1} and n ∈ {1, …, 6} for s = 6 (Tables II and III). This page ports the authors' Canary package, verifies the port against their Python, reproduces the arithmetic behind Tables I to III, models the emulated traffic to rerun all three tables, and records what the code says about details the paper leaves out: how detection time is counted, where hosts and the victim sit, how packets are captured, and how the threshold is computed.
</div>

## Canaries on the switches

<div id="rc-net" class="w-demo"></div>

<div data-levels="public" markdown="1">
Press **Play**. The squares are switches and the dots below them are the computers plugged into each one. Orange dots are attackers, all sending traffic to the ringed victim. Each triangle is a canary: its bar shows how varied the last 50 packets were, and its five small boxes fill up as low readings arrive one after another. When all five fill, the canary sounds the alarm. Try **0%** attackers to see a calm network, then **100%**, and remove canaries to see how much a few listeners can hear.
</div>

<div data-levels="hs" markdown="1">
The line chart shows each canary's entropy, one point per batch of 50 packets, against the dashed threshold. Ordinary traffic stays around 3.4 to 4 bits. Once a quarter of the hosts flood the victim, the canaries that carry that traffic drop below the line, and the first one to collect five low batches in a row raises the alarm, usually within about ten seconds. **New network** picks different attackers and canary positions, the way each of the paper's trials did.
</div>

<div data-levels="ug" markdown="1">
The layout follows the authors' `network_initializer.py`: *s* switches in a chain, host *i* on switch *i* mod *s*, and each host at 10.42.0.(*s* + 1 + *i*). Clients loop `ping -c 1 10.42.0.$((RANDOM % 61))`; attackers run `ping 10.42.0.12`, one echo request a second. A canary logs every IP packet it sees on its switch, so a packet crossing three switches appears in three canaries' windows. The readout gives the detection time the way the authors' scraper counts it: packets logged by all canaries before the first report.
</div>

<div data-levels="grad res" markdown="1">
Attackers and canary sites come from the authors' draws (`random.randint` in `canary_driver.py` and `canary_shark.py`), reproduced with Python's Mersenne Twister, so seed *k* here gives the same lists as `random.seed(k)` there. The traffic is modeled: a ping to a host is answered at once, a ping to an empty address costs its client three seconds (the ARP timeout), and a canary logs a packet once on each switch port it crosses, so twice per switch. These modeling choices are this page's; the next two demos show why they fit the paper's baseline.
</div>

## Fifty packets, one number

<div id="rc-window" class="w-demo"></div>

<div data-levels="public" markdown="1">
Each square is one packet, colored by where it is going. **Ordinary traffic** scatters across many colors, and the entropy (a measure of how mixed the colors are) is high. Drag the slider to send more of the 50 packets to the victim, shown in orange, and watch the number fall. **One address** gives zero: nothing could be less varied.
</div>

<div data-levels="hs" markdown="1">
Entropy adds up one term per destination: the fraction *p* of the 50 packets going there, times log₂ of 1/*p*. Fifty packets to fifty addresses gives log₂ 50 ≈ 5.64 bits, the maximum. Fifty to one address gives 0. Thirty packets to the victim and twenty spread over ten hosts gives about 2.3 bits, far below the 3.42-bit alarm level the paper uses for six switches. **From the network above** loads the latest real window from the first demo.
</div>

<div data-levels="ug grad res" markdown="1">
The table evaluates Eq. 3, H = −Σ (*y*ᵢ/50) log₂(*y*ᵢ/50), term by term, exactly as `CanaryShark.evalutator` does (it divides by 50 rather than by the window's own total). Because each packet in the network demo is logged once per port it crosses, a window of 50 entries holds about 25 distinct packets, which keeps simulated windows under about 4.7 bits. The authors' unit test, a window of 1, 2, and 47 packets to three addresses, gives 0.38254 bits, just under its 0.3826 threshold, and this page computes the same value to the last bit.
</div>

## Setting the alarm level

<div id="rc-baseline" class="w-demo"></div>

<div data-levels="public" markdown="1">
An alarm that rings for ordinary traffic is useless, so the authors first ran each network with no attackers at all, 30 times, and measured how varied normal traffic is. The bars show this page's version of those calm runs. The alarm level sits at 90 percent of the average: low enough that calm traffic rarely dips under it five times in a row, high enough that a flood does.
</div>

<div data-levels="hs" markdown="1">
Table I in the paper lists the lowest, highest, and average entropy of the calm runs for three, six, and nine switches, and a threshold equal to 0.90 times the average. Check the arithmetic: 0.90 × 3.8000 = 3.4200, the threshold for six switches, and the other two match as well. Larger networks have more possible destinations, so their calm traffic is more varied, and each size needs its own threshold.
</div>

<div data-levels="ug grad" markdown="1">
Eq. 4 sets T from attack-free trials with the same topology (*c* = 0, *n* = *s*). The authors' scraper computes it as 0.90 times the mean over every window from every canary, and all three printed thresholds equal 0.90 times the printed means to four decimals. This page's 30 attack-free simulations land within 0.03 (three switches), 0.11 (six), and 0.11 bits (nine) of the paper's means, with similar spreads (standard deviations 0.18, 0.23, and 0.25 against 0.17, 0.24, and 0.28).
</div>

<div data-levels="res" markdown="1">
**Counting** switches the capture model. Counting each packet once per switch overshoots Table I's means by 0.22 to 0.50 bits; counting it once per port it crosses (as a `pyshark.LiveCapture` on every `veth` of a bridge would) brings all three topologies within 0.11 bits and reproduces the ordering (six switches above nine above three). The paper does not describe the capture, so this is the page's inference from the code and the table.
</div>

## Fewer canaries, more attackers

<div id="rc-grid" class="w-demo"></div>

<div data-levels="public" markdown="1">
Each cell is one combination the authors tested 15 times on a six-switch network: the share of hosts attacking (rows) and the number of canaries (columns). With half or more of the hosts attacking, every arrangement caught every flood, with one exception at 93 percent. With a quarter attacking, a full set of canaries caught all of them, and even one canary caught two thirds. Select a cell to load that setting into the first demo.
</div>

<div data-levels="hs" markdown="1">
Switch to **Packets to detect** to see how long the alarm took. More attackers mean a faster alarm, because the flood dominates sooner. The smallest number in the table, 250, is the fastest alarm possible for one canary: five batches of 50 packets. **This page (simulated)** shows the same table from this page's simulation, 15 trials per cell, so you can compare where the model agrees with the paper and where it does not.
</div>

<div data-levels="ug" markdown="1">
Detection time is the number of packets logged across all canaries before the first report, so in this page's simulation it rises with *n*: more canaries log more packets in the same seconds. Detection rate is the share of the 15 trials with any report in the five-minute capture, truncated to a whole percent as `int()` does in the scraper, so 13 of 15 prints as 86 and 10 of 15 as 66. **Rerun all 450 trials here** recomputes the simulated grid on your device in a few seconds.
</div>

<div data-levels="grad res" markdown="1">
With the paper's threshold (3.4200), the simulation matches 23 of the 30 printed rates, including five of six at *c* = 0.25 (100, 100, 93, 100, 93, and 66 percent against the paper's 100, 100, 93, 86, 93, and 66), but with two or more canaries it false-alarms in 13 to 20 percent of attack-free trials, against the paper's single false positive. Its own baseline mean puts the threshold at 3.3247; with that value the attack-free row becomes 6, 0, 6, 0, 0, and 0 percent (paper: 6 and then zeros), 25 of 30 rates match, and detection at *c* = 0.25 drops faster with fewer canaries (100 to 53 percent). Simulated detection times share the paper's trends and its 250-packet floor but run longer at *n* = 6 (900 against 310 packets at *c* = 1), which the researcher notes discuss.
</div>

## What the paper found

<div data-levels="public" markdown="1">
- Small canaries spread across a network's switches caught simulated floods every time when a quarter of the hosts were attacking, even with one switch left unwatched.
- With two switches unwatched they still caught 93 percent, and with one canary for six switches, two thirds.
- Most alarms came within a few hundred to a few thousand packets, early in the attack.
- In 15 calm runs with every switch watched, the canaries raised one false alarm; with fewer canaries, none.
</div>

<div data-levels="hs" markdown="1">
- Calm traffic averaged 3.35, 3.80, and 3.75 bits of entropy per window on networks of three, six, and nine switches, so each size needs its own alarm level (3.01, 3.42, and 3.38 bits).
- With 25 percent of hosts attacking, five canaries on six switches detected the flood in all 15 trials; four canaries detected it in 14 of 15 (93 percent).
- When every host attacked, a single canary always detected the flood at the minimum possible count, 250 packets.
- A single detector at one central point, in earlier work by Mousavi and St-Hilaire, caught 96 percent of attacks with 25 percent attackers.
</div>

<div data-levels="ug grad res" markdown="1">
- **Thresholds depend on topology.** Baseline window entropy differs across three, six, and nine switches (Table I), so each topology gets T = 0.90 × its mean.
- **Coverage.** At *c* = 0.25 on six switches, detection was 100 percent with six or five canaries, 93 with four, 86 with three, 93 with two, and 66 with one (Table III); at *c* ≥ 0.5 it was 93 to 100 percent for every *n*.
- **Speed.** Mean detection took 1,818 to 3,805 packets at *c* = 0.25 and 250 to 433 at *c* = 1 (Table II).
- **False alarms.** One of 15 attack-free trials with six canaries raised a report (at 9,623 packets); none did with fewer canaries.
- **Comparison.** A centralized entropy detector reached 96 percent at 25 percent attackers; the distributed canaries reached 100 percent with one switch unsupervised.
</div>

<div data-levels="grad res" markdown="1">
<div class="rc-table-wrap">
<table class="results-table">
<caption class="w-note">Tables II and III as printed: mean detection time in packets / detection rate, six switches, 15 trials per cell.</caption>
<thead><tr><th>c</th><th>n = 6</th><th>n = 5</th><th>n = 4</th><th>n = 3</th><th>n = 2</th><th>n = 1</th></tr></thead>
<tbody>
<tr><td>0.00</td><td>9,623 / 6%</td><td>– / 0%</td><td>– / 0%</td><td>– / 0%</td><td>– / 0%</td><td>– / 0%</td></tr>
<tr><td>0.25</td><td>1,818 / 100%</td><td>3,120 / 100%</td><td>2,290 / 93%</td><td>2,645 / 86%</td><td>3,139 / 93%</td><td>3,805 / 66%</td></tr>
<tr><td>0.50</td><td>469 / 100%</td><td>605 / 100%</td><td>651 / 100%</td><td>658 / 100%</td><td>519 / 100%</td><td>1,250 / 93%</td></tr>
<tr><td>0.75</td><td>357 / 100%</td><td>467 / 100%</td><td>528 / 100%</td><td>464 / 100%</td><td>448 / 100%</td><td>327 / 100%</td></tr>
<tr><td>1.00</td><td>310 / 100%</td><td>429 / 100%</td><td>433 / 100%</td><td>378 / 100%</td><td>355 / 100%</td><td>250 / 100%</td></tr>
</tbody>
</table>
</div>
</div>

## Why it matters

<div data-levels="public hs" markdown="1">
Hijacked home devices power many of the largest floods on the internet, and their owners rarely notice. Catching a flood at the first switch it crosses means the attack can be stopped inside the home or office that unknowingly launched it, instead of at the target after it has already grown. The canaries need almost nothing: a count of 50 addresses and one small calculation. Ultimately, a defense this light could ship inside the routers people already own.
</div>

<div data-levels="ug" markdown="1">
Central detectors see the sum of all traffic and must separate a flood from everything else at scale. A canary near the edge sees a small slice where a local botnet's traffic stands out, and it needs no communication with other canaries, no training, and a few dozen counters of memory. The results show that partial coverage still works when attackers are a meaningful share of hosts, which matters for networks that cannot instrument every switch.
</div>

<div data-levels="grad res" markdown="1">
The contribution is an architecture with a test bench: decentralized, training-free entropy detectors and an open package that varies topology, composition, and coverage. The evidence is preliminary by the authors' own description. Destination entropy falls for any traffic that concentrates on one host (a backup, a software update, a popular local server), the attackers here are uniform ping floods at one packet per second, and the networks are short chains of emulated switches. The authors call for more diverse topologies and real-world traffic, and their package makes both straightforward to try.
</div>

<div data-levels="res" markdown="1">
## Notes from building this page

- **Detection time counts every canary's packets.** The scraper takes the number of packet entries in the shared trial log before the first report, across all canaries. A single canary under a full flood therefore reports at exactly 5 × 50 = 250 packets (Table II, *n* = 1, *c* = 1), while larger *n* adds the other canaries' entries. The paper explains the 250 but describes the measure as detection time without this qualifier.
- **"High entropy" in the text.** The paragraph on *n* = 1, *c* = 1 says the canary "will always see high entropy traffic"; the code flags windows *below* the threshold, so the intended word is low.
- **Threshold arithmetic.** All three Table I thresholds equal 0.90 × the printed mean (3.0111, 3.4200, 3.3790). Eq. 4 averages per-canary baselines; the scraper averages all windows, which weights busier canaries more. The two agree only when canaries log equal numbers of windows.
- **Rates are truncated.** Every Table III entry is *k*/15 truncated to an integer (13/15 → 86, 10/15 → 66, 1/15 → 6), matching `int()` in the scraper.
- **Hosts, victim, and attackers.** Host *i* sits on switch *i* mod *s* (round robin). The victim is fixed at 10.42.0.12, host 5 on the last switch of the six-switch chain (host 8 on switch 3 of three, host 2 on switch 3 of nine), and may itself be drawn as an attacker. The attacker list draws 5*s* distinct values from 0 to 5*s* inclusive, so one draw can land on a host that does not exist: at *c* = 1, one host stays a client in 30 of 31 trials, and at *c* = 0.25 the seven listed attackers average 6.8 real ones.
- **Clients ping a fixed range.** Clients pick 10.42.0.0 to 10.42.0.60 regardless of *s*; on six switches 30 of those 61 addresses hold a host, so about half of client pings never put an IP packet on the wire. The paper does not report packet rates, so the page's three-second wait for an unanswered ping is a modeling choice that sets the ratio of client to attacker traffic.
- **Capture per port.** Counting a packet on every bridge port it crosses reproduces Table I's means within 0.03 to 0.11 bits; counting it once per switch does not (0.22 to 0.50 bits high). The page uses the per-port reading and offers the other in the third demo. Strict doubling cannot explain Table I's maxima for six and nine switches (4.58 and 4.77 bits): a window of doubled packets holds at most 26 distinct entries, about 4.68 bits. The real capture likely mixed doubled and single entries (dropped copies, or packets seen on one port only), which would also lift the simulated means toward the printed ones.
- **The published driver does not produce Table II's grid.** `canary_driver.py` as released cycles *c* every 15 trials and lowers *n* only when *c* returns to zero, carrying the counter across topologies; 450 trials give *n* = 4 and 3 for six switches and never 6, 5, 2, or 1. Tables II and III must come from other runs or settings.
- **Where the simulation differs.** With the paper's threshold, simulated attack-free trials false-alarm more often (13 to 20 percent against 6 and 0) because the simulated baseline mean for six switches is 0.11 bits lower; with the page's own threshold the attack-free row matches, but *c* = 0.25 detection falls faster with fewer canaries. Simulated detection times at *n* = 6 run about three times the paper's (900 against 310 packets at *c* = 1) while *n* = 1 matches at 250, which suggests the real log interleaved canaries unevenly (each canary is a separate process feeding one queue, and tshark startup staggers them); the paper's *n* = 6 time is also lower than its *n* = 5 to 2 times at *c* = 0.5 to 1.
- **Shared random numbers across cells.** The page seeds each cell's trial *k* with the same Python seed, so attacker and canary lists are nested across *c* and *n* (common random numbers); the paper's trials were independent.
- **Comparison with prior work.** The 96 percent figure from Mousavi and St-Hilaire comes from an SDN controller under a different traffic model, so the comparison with 100 percent here is indicative rather than controlled.
</div>

<div data-levels="hs" markdown="1">
## Try this in class

1. Write down the destinations of 10 imaginary packets, for example A, B, A, C, D, A, B, E, A, F. Compute the entropy by hand: for each letter, take the fraction *p*, multiply by log₂(1/*p*), and add. Then change four of them to A and compute it again.
2. In the second demo, find the smallest number of packets to the victim that pushes the window below the 3.42-bit threshold. Explain why the canary still waits for five such windows before raising the alarm.
3. In the first demo, set 25% attackers and one canary, and press **New network** ten times, noting which runs raise an alarm. Compare your rate with the paper's 66 percent, and explain what the canary's position has to do with it.
</div>

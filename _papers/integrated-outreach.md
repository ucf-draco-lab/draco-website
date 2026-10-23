---
title: "Cyber Camp: How Three Summer Camps Built Interest in Cybersecurity"
kicker: "Interactive paper · Education Sciences 2020 and ASEE 2019"
subtitle: "An interactive companion to Shaya Wolf, Andrea C. Borowczak, Mike Borowczak, and colleagues' study of three free week-long cybersecurity camps for 84 students in 2018 and 2019, redesigned from field notes between summers."
description: "Pick a radio lock box from the camps' Lock-Pick lab, then follow how field notes from two 2018 camps reshaped the 2019 camp, and what 24 paired surveys showed about what students learned and how interested they became."
share_description: "Three free summer camps taught 84 students cybersecurity with pocket-sized computers. Pick a radio lock box from the camps, see what changed between summers, and check what 24 paired surveys showed. Written for five reading levels."
share_text: "Three free summer camps taught 84 students cybersecurity with pocket-sized computers. Pick a lock box from the camps and see what the surveys showed:"
share_image: /papers/integrated-outreach/share.png
share_image_alt: "Five rows of before-and-after dots showing the share of 24 students answering cybersecurity questions correctly, next to the title Integrated Outreach."
date: 2026-10-18
topics: ["Education"]
default_level: public
level_hints:
  public: No background needed
  hs: Classroom math and a little coding
  ug: Intro programming and research methods
  grad: Education research methods and statistics
  res: Full design, data, and open questions
authors:
  - name: Shaya Wolf
    affiliation: University of Wyoming
  - name: Andrea C. Borowczak
    affiliation: University of Wyoming
    member: andrea-borowczak
  - name: Mike Borowczak
    affiliation: University of Wyoming
    member: mike-borowczak
  - name: Mason Johnson
    affiliation: University of Wyoming
  - name: Rafer Cooley
    affiliation: University of Wyoming
  - name: Kyle Mogenson
    affiliation: University of Wyoming
  - name: Fiona P. Moss
    affiliation: University of Wyoming
  - name: Rasana Manandhar
    affiliation: University of Wyoming
  - name: Madison Cooley
    affiliation: University of Wyoming
sources:
  - venue: "Education Sciences 10(12):353 · 2020"
    title: "Integrated Outreach: Increasing Engagement in Computer Science and Cybersecurity"
    url: https://doi.org/10.3390/educsci10120353
    access: Open access
  - venue: "ASEE Annual Conference, Tampa · 2019"
    title: "Building Collaboration and Securing Interest in Computer Science Education through Outreach Opportunities"
    url: https://doi.org/10.18260/1-2--32484
    access: Free to read
citations:
  - IntegratedOuteach
  - asee_peer_27365
widget:
  css:
    - /papers/integrated-outreach/widget.css
  js:
    - /papers/integrated-outreach/io-engine.js
    - /papers/integrated-outreach/widget.js
credit: "Interactive page by the [DRACO Lab](/). Every number about the camps comes from the two papers' text and figure captions; the page checks each printed percentage against the whole counts that could produce it, and reproduces the journal's password example (26<sup>5</sup> = 11,881,376). The key counts, the share checks, and the exact McNemar test are computed by this page and match independent Python implementations (SciPy and exact decimal arithmetic) on 4,949 cases. Everything runs on your device."
bibtex: |
  @article{wolf2020integrated,
    author  = {Wolf, Shaya and Borowczak, Andrea C. and Borowczak, Mike and Johnson, Mason and Cooley, Rafer and Mogenson, Kyle},
    title   = {Integrated Outreach: Increasing Engagement in Computer Science and Cybersecurity},
    journal = {Education Sciences},
    volume  = {10},
    number  = {12},
    pages   = {353},
    year    = {2020},
    doi     = {10.3390/educsci10120353}
  }

  @inproceedings{wolf2019building,
    author    = {Wolf, Shaya and Moss, Fiona P. and Manandhar, Rasana and Cooley, Madison and Cooley, Rafer and Borowczak, Andrea C. and Borowczak, Mike},
    title     = {Building Collaboration and Securing Interest in Computer Science Education through Outreach Opportunities},
    booktitle = {2019 ASEE Annual Conference \& Exposition},
    address   = {Tampa, Florida},
    year      = {2019},
    doi       = {10.18260/1-2--32484}
  }
---

<div class="lede" data-levels="public" markdown="1">
Most schools in the United States offer no computer science class, and fewer still teach cybersecurity, the work of keeping information secret, correct, and available. A team at the University of Wyoming ran three free, week-long summer camps on the subject in 2018 and 2019 for 84 students between 10 and 18 years old. Campers programmed pocket-sized computers to send radio messages, pick electronic locks, and drive small robots, then talked about what each lab meant for the devices and accounts they use every day. This page lets you try one of those labs, then follows how the camp changed between summers and what students reported at the end.
</div>

<div class="lede" data-levels="hs" markdown="1">
Cybersecurity rests on three ideas, called the CIA triad: confidentiality (only the right people can read information), integrity (nobody changed it), and availability (the people who need it can reach it). Shaya Wolf, Andrea C. Borowczak, Mike Borowczak, and their colleagues built camps around those ideas using BBC Micro:Bits, small programmable computers with a radio. The 2018 camps tested the labs; field notes from those weeks reshaped the 2019 camp, and 24 of its students answered the same 10-question survey before and after. Below, you can guess a lock box's key, see what changed between summers, and explore the survey results.
</div>

<div class="lede" data-levels="ug" markdown="1">
Two papers describe the program. The ASEE 2019 paper lays out the 2018 camps, funded in part by the National Security Agency (NSA) and National Science Foundation (NSF) GenCyber program: programming in JavaScript and Python with block and text editors, Micro:Bit radio labs (beacons and scanners, a lock-pick box, robots on a shared channel, and a fitness tracker), and daily peer-instruction sessions on secure-design principles such as least privilege and information hiding. The *Education Sciences* paper asks how a week of outreach shapes students' interest in cybersecurity (RQ1), their security awareness and privacy habits (RQ2), and their content knowledge (RQ3), using field notes from both summers and a new pre/post survey in 2019.
</div>

<div class="lede" data-levels="grad" markdown="1">
A two-summer, design-based outreach study. The 2018 camps (two) produced qualitative field notes, coded into four themes that drove the 2019 redesign; the 2019 camp (one) added a 10-item instrument (nine content items and one interest item) given before camp and in its final hour, plus a one-to-five camp rating. The analytic sample is 24 students with both surveys, out of 84 students across both summers; results are descriptive counts and shares, with no inferential tests. The ASEE 2019 paper documents the curriculum and reports no outcome data.
</div>

<div class="lede" data-levels="res" markdown="1">
Wolf, Burrows, Borowczak, Johnson, Cooley, and Mogenson (2020) report three week-long, no-cost cybersecurity camps for pre-collegiate students (n = 84; ages 10 to 18; about 27% female) in the Rocky Mountain region, with field-note themes from 2018 and a new pre/post survey in 2019 (24 paired responses). The companion ASEE paper (Wolf, Moss, Manandhar, Cooley, Cooley, Burrows Borowczak, and Borowczak, 2019) describes the 2018 curriculum and its four Micro:Bit labs. The journal prints counts and shares without tests; this page checks every printed share against the whole counts that could produce it and, at the graduate and researcher levels, lists every paired table consistent with each item's totals, with an exact McNemar test, labeled as its own.
</div>

## Lab 02: pick a radio lock

<div id="io-lock" class="w-demo"></div>

<div data-levels="public" markdown="1">
In the Lock-Pick lab, each cardboard box held a Micro:Bit and a small motor that worked as a latch. Students opened a box by sending the right key over the radio, a string of ones and zeros. Send a guess, or press **Try every key** to watch the page try keys in order until the box opens. Then make the key longer, or switch to letters, and watch the number of possible keys grow. The journal paper uses the same idea for passwords: five lowercase letters allow 11,881,376 combinations, which a computer can try quickly.
</div>

<div data-levels="hs" markdown="1">
Each position in a key can hold any of the allowed symbols, so the number of keys multiplies: two choices per bit, four bits, 2 × 2 × 2 × 2 = 16 keys. A search that tries every key in order needs 16 guesses at most and 8.5 on average. Boxes in the lab came in several difficulty levels, and the harder boxes hid their code. **Show the box's code** plays the easy box: with the code visible, the key is no secret at all. That is information hiding, one of the design principles the camps taught.
</div>

<div data-levels="ug" markdown="1">
A key of length L over an alphabet of s symbols gives a key space of s<sup>L</sup>; an exhaustive search in counting order opens a uniformly random key after (s<sup>L</sup> + 1) / 2 guesses on average. The demo draws its keys from a seeded generator (Mulberry32) and counts guesses exactly, even when the space is too large to animate. The guessing speeds are the page's illustration; neither paper reports how fast a Micro:Bit radio can send keys. The lab's teaching point follows the ASEE paper: hide the implementation, and an attacker must search; reveal it, and the search costs nothing.
</div>

<div data-levels="grad res" markdown="1">
The lab is the program's vehicle, and the study is the subject: the lock box appears here because it carries the camps' approach in one exercise (a physical device, a radio message, a security principle, and a real-world link to password strength). The journal credits hands-on, student-centered labs for the knowledge gains but does not tie any survey item to a specific lab, and the 2019 schedule (in an appendix the page did not reproduce) is the place to check which labs ran that summer.
</div>

## From 2018 to 2019: the camp, rebuilt from field notes

<div id="io-redesign" class="w-demo"></div>

<div data-levels="public" markdown="1">
The team ran two camps in 2018, watched closely, and took notes. Four patterns stood out: students needed help getting started with code and hardware, activities without computers held their attention less well, students struggled to connect labs to daily life, and the badge system that tracked progress was uneven. Pick **What changed for 2019** to see how the team answered each one, from new step-by-step guides to a daily fresh start on every badge.
</div>

<div data-levels="hs" markdown="1">
Each student wore a badge with a ring of lights that showed their level. In 2019, every level had a fixed checkpoint, and progress reset each day, so a rough day did not follow anyone into the next. Students also split into two rooms by experience, each with its own instructor, and the groups traded rooms partway through, so beginners and experienced coders both worked at a fitting pace. The level-up guides written for the 2019 camp were released for other teachers at wycyberstars.com.
</div>

<div data-levels="ug" markdown="1">
The redesign follows a simple cycle: run, observe, code the field notes into themes, revise, and run again. Each of the four labs in the ASEE paper pairs a device with a security idea: radio groups and signal strength in Beacons and Scanners, information hiding in Lock-Pick, integrity and jamming in Micro:Bots (robots on a shared channel obeyed each other's commands), and intercepted personal data in the fitness tracker (students inferred a partner's activity from it). In 2019, staff made those links explicit, comparing beacons to store advertising and the robots to drones and self-driving cars.
</div>

<div data-levels="grad res" markdown="1">
Format, curriculum, staffing, and grouping all changed between summers, and only 2019 carried the survey, so the study cannot attribute outcomes to any single revision or compare the two designs. The field notes were the authors' own, categorized into themes without a reported coding protocol or reliability check. Participant counts are pooled across both summers (84 students); the 2019 enrollment, and so the paired-survey response rate, is not reported separately.
</div>

## What students knew before and after

<div id="io-knowledge" class="w-demo"></div>

<div data-levels="public" markdown="1">
Each dot pair shows one survey question: the hollow dot before camp, the filled dot after. Before camp, eight of 24 students could say what C, I, and A stand for; after camp, 23 could. Integrity, the idea that nobody changed a message, made the largest jump, from three students to 15. Pick a question to see each student as one square. On the meme question, the most common answer before camp was that the "What ___ character are you?" quizzes are just funny; after camp, most students recognized that they collect answers to common security questions.
</div>

<div data-levels="hs" markdown="1">
Each square is one of the 24 students who answered both surveys, so one square is about 4%. Confidentiality started high (18 students) and rose a little (20); availability and integrity started lower and rose much more. The meme question links the triad to habits: quizzes that ask for a first pet or a childhood street are collecting the answers to account-recovery questions. Switch to **Selections (Figure 3)** to count answers instead of students; some students picked more than one.
</div>

<div data-levels="ug" markdown="1">
Q1 asked what C, I, and A represent; Q2 to Q4 gave a security-failure example and asked which lapse it showed, with five shuffled, select-all options. The paper reports those three by CIA component, not by question number. At this level the page checks each printed share against its count: every share of 24 matches except the meme item's 30% before camp (seven of 24 is 29.2%). The abstract's "22% to 69%" for recognizing threats in daily life matches Figure 3's selections (seven of 31, 18 of 26), not students.
</div>

<div data-levels="grad res" markdown="1">
The paper prints only marginal totals, so the paired 2 × 2 table behind each item is unknown. The page enumerates every table consistent with the totals and runs the exact McNemar test on each. For recall, availability, integrity, and the meme item, every consistent table gives p below 0.05 (recall below 0.0003); for confidentiality, every one gives p of 0.50 or more. These are the page's computations, offered to show what the totals can and cannot support; the paper makes no inferential claim, and five items tested at once would call for a multiplicity correction.
</div>

## Interest, and how students rated the camp

<div id="io-interest" class="w-demo"></div>

<div data-levels="public" markdown="1">
Before camp, seven students said they were highly interested in cybersecurity; after camp, 15 did, and the four students who started with minimal interest all moved up. Nobody rated the camp one or two out of five, and 15 of 24 gave it a five. Switch between the two questions to compare them.
</div>

<div data-levels="hs" markdown="1">
Interest had four answer levels: none, minimal, moderate, and high. Nobody chose "none" either time. Each colored square is one student; dashed squares mark the two students the paper does not place in any category. High interest more than doubled (seven to 15), and 22 of 24 students left with moderate or high interest.
</div>

<div data-levels="ug" markdown="1">
Every printed share matches a count of 24 except two at 30%, both seven students (high interest before, moderate interest after); seven of 23 would print as 30%. The checks below the chart compare the abstract's headline shares with the counts in the Results: content recall matches exactly, threat recognition matches Figure 3's selections, and the interest shares (31% and 65%) match no single denominator or rounding rule.
</div>

<div data-levels="grad res" markdown="1">
Q10 is a single self-report item collected in the camp's final hour, after a week of free, enjoyable activity, so the post measure reflects both interest and the moment. The camp rating has no pre measure. The four categories sum to 22 at both times, so two of the 24 paired students have no interest response in the published counts; the published shares use 24 as the denominator.
</div>

## What the papers found

<div data-levels="public" markdown="1">
- After a week of camp, almost every student (23 of 24) could name the three parts of the CIA triad, up from eight.
- More students could spot a broken promise of availability, integrity, or confidentiality in a real-world example.
- Most students left knowing that online personality quizzes can collect the answers to security questions.
- High interest in cybersecurity more than doubled, and no student left with minimal interest.
- No student rated the camp below three out of five; nearly two thirds gave it a five.
</div>

<div data-levels="hs" markdown="1">
- CIA recall rose from eight of 24 students to 23.
- Availability rose from 10 to 22, integrity from three to 15, and confidentiality from 18 to 20.
- On the meme question, 18 of 24 students chose the security-question answer after camp; before camp, 10 called the memes funny.
- High interest rose from seven students to 15; minimal interest fell from four to zero.
- Camp ratings: three students gave a three, six a four, and 15 a five.
</div>

<div data-levels="ug grad res" markdown="1">
- **Content recall rose.** Q1 moved from 33% (eight of 24) to 96% (23 of 24).
- **Applying the triad improved most for integrity.** Availability moved from 42% to 92%, integrity from 13% to 63%, and confidentiality from 75% to 83%.
- **Awareness changed.** On Q9, the security-question answer became the most common (18 of 24, 75%).
- **Interest rose.** High interest moved from seven students to 15; every minimally interested student moved up, and 92% (22 of 24) ended moderately or highly interested.
- **The camp was well received.** Ratings were 13% threes, 25% fours, and 63% fives.
- **The redesign followed field notes.** Four 2018 themes (learning curve, engagement, real-world connections, and motivation) produced the 2019 level-up guides, skill-based sections, explicit real-world links, and standardized badge checkpoints.
- **The materials are open.** The Micro:Bit activities and level-up guides were released for other educators, and the ASEE paper documents the four labs.
</div>

<div data-levels="grad res" markdown="1">
<div class="io-study-wrap">
<table class="results-table">
<caption class="w-note">Reported 2019 results (n = 24 paired students) with the page's checks. The McNemar range spans every paired table consistent with the printed totals and is computed by this page.</caption>
<thead><tr><th>Item</th><th>Before</th><th>After</th><th>Printed</th><th>Share check</th><th>Exact McNemar p (page)</th></tr></thead>
<tbody>
<tr><td>Q1, what C, I, and A stand for</td><td>8</td><td>23</td><td>33% / 96%</td><td>Both match</td><td>0.00006 to 0.0003</td></tr>
<tr><td>Availability (Q2–Q4)</td><td>10</td><td>22</td><td>42% / 92%</td><td>Both match</td><td>0.0005 to 0.004</td></tr>
<tr><td>Integrity (Q2–Q4)</td><td>3</td><td>15</td><td>13% / 63%</td><td>Both match</td><td>0.0005 to 0.008</td></tr>
<tr><td>Confidentiality (Q2–Q4)</td><td>18</td><td>20</td><td>75% / 83%</td><td>Both match</td><td>0.50 to 0.75</td></tr>
<tr><td>Q9, memes contain security questions</td><td>7</td><td>18</td><td>30% / 75%</td><td>30% matches 7 of 23, not 24</td><td>0.001 to 0.035</td></tr>
<tr><td>Q9 selections (Figure 3)</td><td>7 of 31</td><td>18 of 26</td><td>23% / 70%</td><td>70% matches no rounding (69.2%)</td><td>Not paired</td></tr>
<tr><td>Q10, high interest</td><td>7</td><td>15</td><td>30% / 63%</td><td>30% matches 7 of 23, not 24</td><td>Ordinal item; not tested</td></tr>
</tbody>
</table>
</div>
</div>

## Why it matters

<div data-levels="public hs" markdown="1">
Students cannot choose a career they have never seen. A week of hands-on cybersecurity, built from low-cost hardware and free software, gave these students a working vocabulary for keeping information safe and a reason to keep going. Ultimately, the camps also left something behind for other teachers: open level-up guides that bring the same labs to classrooms far from a university, including rural schools.
</div>

<div data-levels="ug" markdown="1">
Outreach is often reported as a list of activities with a satisfaction score. This program documents both halves, curriculum and outcomes, and shows its revision cycle: what the team saw in 2018, what it changed, and what the 2019 surveys showed. The labs pair each security principle with a device students can touch, from a jammed robot to a guessable lock, which makes the principles concrete for students who have never programmed.
</div>

<div data-levels="grad res" markdown="1">
The study's strength is its design record: a curriculum tied to named security principles, a documented redesign, and open materials others can reuse. The outcome evidence is a single-group pre/post comparison on 24 self-selected students with marginal totals only, which the authors present as perceptions rather than causal proof. The natural next step, which the authors point toward with expanded rural and virtual camps, is linked pre/post data with item-level scoring and a comparison group.
</div>

<div data-levels="res" markdown="1">
## Notes from building this page

- **Seven of 24 printed as 30%.** Q9 before camp, Q10 high interest before camp, and Q10 moderate interest after camp all print seven students as 30%; seven of 24 is 29.2%, which rounds to 29%. Seven of 23 (30.4%) prints as 30%. Every other share in the Results matches a count of 24 under ordinary rounding.
- **Abstract and Results.** The abstract's threat-recognition shares (22% to 69%) match Figure 3's selections (seven of 31 truncated, 18 of 26), while the Results report students (seven and 18 of 24, printed 30% and 75%). Figure 3's caption prints 23% and 70%; 18 of 26 is 69.2%. The abstract's high-interest shares (31% to 65%) match seven of 22 (truncated) and 15 of 23, against the Results' 30% and 63%.
- **Interest categories.** The Q10 counts sum to 22 before and after camp, two short of the 24 paired students.
- **Item mapping and scoring.** The paper reports Q2 to Q4 by CIA component without saying which question tested which, and does not state how a select-all answer was scored as correct.
- **Paired data.** Only marginal totals are printed. The page's exact McNemar ranges (every consistent table) leave four items significant at 0.05 under any pairing and confidentiality not significant under any; the paper makes no inferential claim, and the five items share one small sample.
- **Sample.** The 84 students span both summers; the 2019 enrollment is not given, so the share of 2019 campers in the paired sample is unknown. Seven students were younger than the advertised 13 to 18.
- **The ASEE paper's year.** The conference took place in Tampa in June 2019; some indexes list the paper under 2020.
- **Funding.** The ASEE paper acknowledges NSA and NSF GenCyber award H98230-18-1-0095 (GenCyber:COWPOKES), NSF Noyce award 1339853, and a Wyoming Department of Education Math and Science Partnership grant. The page did not read the journal's funding statement.
- **Byline.** The published records list Andrea C. Borowczak as Andrea C. Burrows and Andrea Carneal Burrows Borowczak; this page uses the name she prefers.
</div>

<div data-levels="hs" markdown="1">
## Try this in class

1. In pairs, one student picks a secret four-bit key (such as 1011) and the other guesses aloud in counting order (0000, 0001, and so on). Count the guesses, then swap roles.
2. Predict how many guesses a five-bit and an eight-bit key would need at most, then check with the demo above. Write the rule that connects key length to the number of keys.
3. Compute how many passwords five lowercase letters allow (26 × 26 × 26 × 26 × 26), and write two sentences on why adding length or symbol types protects a password better than a clever word.
</div>

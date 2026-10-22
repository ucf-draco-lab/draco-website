---
title: "Four Ways to Hold a Room: Building a Cyber Camp Around Engagement"
kicker: "Interactive paper · ASEE Annual Conference 2020"
subtitle: "An interactive companion to Shaya Wolf, Rafer Cooley, Mason Johnson, Andrea C. Borowczak, and Mike Borowczak's account of week-long cybersecurity camps built around four instruction settings, from a whole-room conversation down to one student reflecting alone."
description: "Size a camp and watch it split into the paper's four instruction settings, match each research question to the evidence behind it, and test what the paper's 17.5% and 65% interest figures can mean."
share_description: "Week-long cybersecurity camps for middle and high school students moved between four settings, from a room of 30 to one student alone. Size a camp, trace each claim to its evidence, and test the paper's two interest numbers. Written for five reading levels."
share_text: "A cybersecurity camp built around four ways of grouping students, and two numbers worth a close look:"
share_image: /papers/cs-outreach-engagement/share.png
share_image_alt: "Twenty-eight dots grouped into three boxes of ten, nine, and nine, each box split into two small teams, labeled with the four instruction settings, beside the title Four Ways to Hold a Room."
date: 2026-10-22
topics: ["Education"]
default_level: public
level_hints:
  public: No background needed
  hs: Classroom math and percentages
  ug: Intro research methods
  grad: Education research methods and statistics
  res: Full design, evidence, and open questions
authors:
  - name: Shaya Wolf
    affiliation: University of Wyoming
  - name: Rafer Cooley
    affiliation: University of Wyoming
  - name: Mason Johnson
    affiliation: University of Wyoming
  - name: Andrea C. Borowczak
    affiliation: University of Wyoming
    member: andrea-borowczak
  - name: Mike Borowczak
    affiliation: University of Wyoming
    member: mike-borowczak
sources:
  - venue: "ASEE Virtual Annual Conference · 2020"
    title: "Constructing and Refining Computer Science Outreach Focused on Student Engagement"
    url: https://doi.org/10.18260/1-2--34327
    access: Free to read
  - venue: "Education Sciences 10(12):353 · 2020 (companion data)"
    title: "Integrated Outreach: Increasing Engagement in Computer Science and Cybersecurity"
    url: https://doi.org/10.3390/educsci10120353
    access: Open access
citations:
  - asee_peer_31078
widget:
  css:
    - /papers/cs-outreach-engagement/widget.css
  js:
    - /papers/cs-outreach-engagement/oe-engine.js
    - /papers/cs-outreach-engagement/widget.js
credit: "Interactive page by the [DRACO Lab](/). The settings, group sizes, research questions, objectives, outcome figures, and follow-on programs come from the ASEE paper's text. The interest counts come from the companion *Education Sciences* paper and are labeled as its own. The page reproduces the paper's 65% as 15 of 23 high-interest answers; no reading of those counts gives exactly 17.5% (the nearest, a relative change in the mean interest score, gives 17.4%). Share checks and Wilson intervals match exact-fraction Python and SciPy on 5,930 cases. Everything runs on your device."
bibtex: |
  @inproceedings{wolf2020constructing,
    author    = {Wolf, Shaya and Cooley, Rafer and Johnson, Mason and Borowczak, Andrea C. and Borowczak, Mike},
    title     = {Constructing and Refining Computer Science Outreach Focused on Student Engagement},
    booktitle = {2020 ASEE Virtual Annual Conference Content Access},
    year      = {2020},
    publisher = {ASEE Conferences},
    doi       = {10.18260/1-2--34327}
  }
---

<div class="lede" data-levels="public" markdown="1">
A week of summer camp can change what a teenager thinks computing is for. A team at the University of Wyoming ran week-long cybersecurity camps for middle and high school students and built each day around four ways of grouping people: the whole room talking together, groups of five to ten led by university students, small teams solving problems on their own, and each student reflecting alone. The team surveyed students before and after camp and reported that 65% left highly interested in cybersecurity. This page lets you size a camp and see those four settings, trace each goal to the evidence behind it, and look closely at what the reported numbers mean.
</div>

<div class="lede" data-levels="hs" markdown="1">
Shaya Wolf, Rafer Cooley, Mason Johnson, Andrea C. Borowczak, and Mike Borowczak describe week-long cybersecurity camps for middle and high school students. The camps asked two questions: does a week of outreach raise students' interest in cybersecurity, and does it change how they behave online? Students answered the same survey on the first day and the last. The paper reports two numbers, a 17.5% increase in interest and 65% of students highly interested after camp. Below, you can build a camp, check which claims carry a number, and practice the difference between a percent and a percentage point.
</div>

<div class="lede" data-levels="ug" markdown="1">
This short ASEE paper documents the design of week-long cybersecurity camps for middle and high school students rather than a full evaluation. Instruction moved between four settings (class-wide conversations of 25 to 30, large groups of five to ten led by university students, student-led teams of two to five, and individual reflection), guided by three objectives: connect lessons to familiar concepts, teach skills beyond coding, and improve instruction from camp to camp. Identical pre- and post-surveys addressed two research questions on interest and online behavior. The demos follow that structure, then test the two reported figures against counts from the team's companion journal paper.
</div>

<div class="lede" data-levels="grad" markdown="1">
A design-focused conference paper on cybersecurity outreach camps, with a single-group pre/post survey. The paper states two research questions (interest in cybersecurity, online behavior), three objectives, and a four-tier instruction structure, and reports two outcome figures without counts, items, or denominators: a "17.5% increase in interest level" and "65% reporting high interest." The companion *Education Sciences* paper (Wolf et al., 2020) prints the 2019 camp's interest counts, and those counts reproduce the 65% (15 of 23). This page uses them to test readings of both figures and, at this level, adds Wilson intervals labeled as its own.
</div>

<div class="lede" data-levels="res" markdown="1">
Wolf, Cooley, Johnson, Borowczak, and Borowczak (ASEE 2020, Computers in Education Division) describe week-long cybersecurity camps for pre-collegiate students, funded by NSF (DRL 1923542) and NSA (H98230-18-1-0095 and H98230-19-1-0095). The paper gives the instruction design and two outcome figures but no sample size, camp count, year, instrument, or analysis. The page treats the design as the subject, maps each claim to its evidence, and tests the two figures against the Q10 interest counts in the companion journal paper, whose 2019 survey shares the authors, research questions, and the 65% figure. That link is the page's inference; the ASEE paper does not name its data set.
</div>

## One camp, four settings

<div id="oe-day" class="w-demo"></div>

<div data-levels="public" markdown="1">
Every camp day mixed four settings. Experienced volunteers opened ideas with the whole room. University students then led groups of five to ten in discussion. Small teams of two to five tackled hands-on programming labs, and each student wrote, drew, or answered survey questions alone. Move the slider to change the camp's size, and pick a setting to see how many groups it needs. A room of 28 splits into three large groups (ten, nine, and nine), and each of those splits into two small teams.
</div>

<div data-levels="hs" markdown="1">
Each setting has a size range and a leader. The camp has to cover every student in every setting, so the number of groups depends on the camp's size: 28 campers need at least three large groups (ten, nine, and nine) and six small teams. Try 55 campers: the paper's class-wide range of 25 to 30 now needs two rooms, and every room needs its own experienced volunteer. Count the leaders a camp needs as it grows.
</div>

<div data-levels="ug" markdown="1">
The four settings form a ladder of group size and student control, from volunteer-led instruction to student-led labs to individual reflection. Each rung serves a different purpose: introducing foundational ideas, discussing them with a near-peer leader, applying them to real-world problems, and showing what each student learned. The demo splits a camp into as few groups as each range allows, sizes as even as possible; that rule is the page's, since the paper does not say how groups were formed.
</div>

<div data-levels="grad res" markdown="1">
The design scales by people, not by curriculum. Every 25 to 30 campers need a volunteer with education experience, every five to ten need a university student, and teams lead themselves. The paper offers the four settings as its instructional model but does not link any outcome to a particular setting, so the structure stands as a design description; the companion journal paper's field notes are the place to see how each setting worked in practice.
</div>

## Two questions, three objectives, and the evidence for each

<div id="oe-evidence" class="w-demo"></div>

<div data-levels="public" markdown="1">
The team asked two questions and set three goals for its volunteers. Pick one to see what the paper offers as evidence. Some evidence is a number, some is a statement about what students said or did, and some describes how the camp was built. Interest in cybersecurity carries the paper's two numbers. Online behavior carries one sentence: after camp, students paid more attention to what their actions online could lead to.
</div>

<div data-levels="hs" markdown="1">
Scientists separate what they measured from what they observed and what they designed. Press **Numbers only** and step through the questions: only the interest question and the first objective keep any evidence. That pattern says where a follow-up study would add the most, starting with a measure of online behavior.
</div>

<div data-levels="ug grad res" markdown="1">
The matrix counts each kind of evidence per question or objective. RQ1 rests on the two survey figures and student comments; RQ2 rests on a single summary sentence with no item, count, or effect; objectives two and three rest on the camp's design rather than outcome data. The paper says the identical pre- and post-surveys answer both research questions, so the survey likely held online-behavior items whose results the paper does not print.
</div>

## Same questions, twice: what 65% and 17.5% can mean

<div id="oe-interest" class="w-demo"></div>

<div data-levels="public" markdown="1">
The team's longer journal paper on the same camps lists every interest answer from its 2019 survey, one square per student. Before camp, seven students said they were highly interested; after camp, 15 did, and nobody stayed at minimal interest. Two students left the question blank. The ASEE paper's 65% matches 15 out of 23, so the share depends on who you count. Use the sliders below the chart to see why "up 17.5%" can mean different things.
</div>

<div data-levels="hs" markdown="1">
A percent always has a denominator, the number you divide by. Fifteen highly interested students out of 22 answers is 68.2%, out of 23 is 65.2%, and out of 24 is 62.5%; only 23 prints as 65%. "Percent increase" has the same trap. Going from 30% to 63% is a rise of 33 percentage points, but it is also a 110% increase relative to where it started. Try the sliders and write down both numbers each time.
</div>

<div data-levels="ug" markdown="1">
The ASEE paper does not define "a 17.5% increase in interest level." The rows test six common readings on the journal's counts (4 minimal, 11 moderate, and 7 high before; 7 moderate and 15 high after; 22 answers each time). The closest is the relative change in the mean interest score on a one-to-four scale, 3.136 to 3.682, which gives 17.4%. The 65% does reproduce: 15 high-interest answers out of 23.
</div>

<div data-levels="grad res" markdown="1">
Six readings span 17.4% to 114%, which shows how much an undefined change statistic leaves open. None reproduces 17.5% exactly from the printed counts; 17.5% is reachable only by adding answers the journal does not print, which the page does not adopt. The Wilson intervals are wide: 15 of 23 gives 45% to 81%, so even the paper's clearest figure is compatible with anything from a minority to a large majority of a comparable cohort.
</div>

## What the camps led to

<div id="oe-next" class="w-demo"></div>

<div data-levels="public hs" markdown="1">
The paper ends by listing the outreach these camps helped start: more week-long camps, camps for elementary students, a credential teachers can earn online, and short and week-long workshops that help teachers bring computer science into their own classrooms. Several of those programs have their own pages on this site.
</div>

<div data-levels="ug grad res" markdown="1">
All six follow-on programs include teachers, and four serve teachers alone, which shifts the work from reaching a few dozen students in a week to equipping the teachers who see students all year. The related pages show that later work: the 2019 camp's redesign, the virtual camps of 2020 and 2021, a teacher cybersecurity microcredential, and statewide K–8 integration.
</div>

## What the paper found

<div data-levels="public" markdown="1">
- After a week of camp, 65% of students said they were highly interested in cybersecurity.
- Interest rose by 17.5%, and students said they would come back.
- Students paid more attention to what their behavior online could lead to.
- Mixing coding with teamwork, communication, and problem solving, tied to familiar ideas, helped students learn.
</div>

<div data-levels="hs" markdown="1">
- Students answered the same survey before and after camp.
- 65% reported high interest in cybersecurity after camp, and interest rose by 17.5% by the paper's measure.
- Students showed more attention to how their online behavior could affect them.
- The camps led to more camps and to workshops and credentials for teachers.
</div>

<div data-levels="ug" markdown="1">
- **Design.** Four instruction settings with stated group sizes and leaders, and three objectives for volunteers.
- **Interest.** A 17.5% increase in interest level and 65% reporting high interest after camp, from identical pre- and post-surveys.
- **Behavior.** More attention to the implications of online behavior after camp, reported without numbers.
- **Follow-through.** More camps, elementary camps, teacher microcredentials, and professional development grew from the work.
</div>

<div data-levels="grad res" markdown="1">
<div class="oe-table-wrap">
<table class="results-table">
<caption class="w-note">Reported outcomes with the page's checks against the companion journal's 2019 interest counts (22 answers each time, 24 paired students). Intervals are computed by this page.</caption>
<thead><tr><th>Claim</th><th>Printed</th><th>Journal counts</th><th>Page check</th><th>95% Wilson interval (page)</th></tr></thead>
<tbody>
<tr><td>High interest after camp</td><td>65%</td><td>15 high</td><td>Matches 15 of 23 (65.2%); 15 of 22 is 68.2%, 15 of 24 is 62.5%</td><td>45% to 81% (15 of 23)</td></tr>
<tr><td>Increase in interest level</td><td>17.5%</td><td>4 / 11 / 7 → 0 / 7 / 15</td><td>Not reproduced; nearest reading 17.4% (relative change in mean, scored 1 to 4)</td><td>Not applicable</td></tr>
<tr><td>High interest before camp</td><td>Not printed</td><td>7 high</td><td>Journal prints 30% (results) and 31% (abstract)</td><td>16% to 53% (7 of 22)</td></tr>
<tr><td>Attention to online behavior</td><td>No figure</td><td>Not in the interest item</td><td>Not testable</td><td>Not applicable</td></tr>
</tbody>
</table>
</div>
</div>

## Why it matters

<div data-levels="public hs" markdown="1">
Students cannot choose a field they have never tried. A camp that mixes whole-room talks, near-peer discussion, hands-on teamwork, and quiet reflection gives every student several ways in. Ultimately, the follow-on programs carry the same approach to teachers, who reach far more students in a year than any one camp can.
</div>

<div data-levels="ug" markdown="1">
Outreach reports often list activities and a satisfaction score. This paper names its instructional structure, which makes the camp something another team can copy and size, from the number of volunteers to the number of teams. Its outcome reporting is thin, and the companion journal paper supplies the counts and the redesign record that turn the design into evidence.
</div>

<div data-levels="grad res" markdown="1">
The paper's contribution is a reusable instruction model for short-format outreach, staffed by people with different roles, together with a research agenda (interest and online behavior) that the team's later journal paper carries out. The evidence is a single-group self-report with no reported sample, so the figures describe one cohort's change rather than an effect. A defined interest measure, a behavior instrument, and per-setting observations would let the four-setting model be tested directly.
</div>

<div data-levels="res" markdown="1">
## Notes from building this page

- **Which data set.** The ASEE paper gives no year, camp count, sample size, or instrument. Its research questions, authors, and 65% match the companion journal's 2019 camp survey, and 15 of 23 high-interest answers reproduce the 65%; the page treats the two papers as reporting the same survey, which neither paper states.
- **17.5% is undefined.** No reading tested (relative change in mean score on 1–4 or 0–3, range-scaled mean change, percentage-point change in high or moderate-or-high, relative change in the high share) gives 17.5% from the journal's counts; the nearest is 17.4%. A search over the counts shows 17.5% requires adding answers the journal does not print.
- **Denominators.** The 65% implies 23 respondents, while the journal's interest counts sum to 22 at both times and its paired sample is 24; the journal's own results print 63% (15 of 24).
- **Online behavior (RQ2).** The paper states that identical surveys answer both research questions but reports only one sentence on behavior, with no item or count.
- **Refinement.** The title and objective three describe refining instruction across camps; the paper does not report what changed. The journal paper's field-note themes and 2019 redesign document that cycle.
- **Group sizes.** The four settings come with size ranges but no record of actual group counts; the demo's even split is the page's illustration.
- **Byline.** The published record lists Andrea C. Borowczak as Andrea Carneal Burrows Borowczak; this page uses the name she prefers.
</div>

<div data-levels="hs" markdown="1">
## Try this in class

1. Survey your class with one question ("How interested are you in cybersecurity: none, minimal, moderate, or high?") and record the counts.
2. After a short lesson, ask the same question again. Compute the share of "high" both times, and write the change in percentage points and as a percent of the starting share.
3. Recompute both shares as if one student had skipped the question. Write two sentences on why a report should always give the count behind a percent.
</div>

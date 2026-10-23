---
title: "Science in Hand: A Coffee Pot, a Room of Beakers, and Context in High School Science"
kicker: "Interactive paper · Problems of Education in the 21st Century 2013"
subtitle: "An interactive companion to Andrea C. Borowczak, Gabriel Wickizer, Helen Meyer, and Mike Borowczak's study of two high school science lessons that a university partnership built around application, careers, and societal impact, taught to 55 students in three classes."
description: "See how a graduate engineering Fellow and two teachers built two context lessons, walk a room of students through the Molecule Mixing activity, answer the chemistry class's four heat and work questions, and check what the paper's 17 percent aggregate gain implies; graduate and researcher levels add exact tests the page computes."
share_description: "A vacuum coffee pot for heat and work. A room of students pouring colored water for dynamic equilibrium. Two lessons built by a university partnership, 55 high school students, and correct answers up 17 percent. Walk the room and take the quiz at five reading levels."
share_text: "A coffee pot, a room of beakers, and two high school science lessons built by a partnership. Explore the study:"
share_image: /papers/science-in-hand/share.png
share_image_alt: "Twelve chemistry students' correct answers on four heat and work questions before and after the coffee pot lesson, with the enthalpy question rising from four to 11 students, beside the title Science in Hand."
date: 2026-10-23
topics: ["Education"]
default_level: public
level_hints:
  public: No background needed
  hs: High school chemistry and biology
  ug: Thermodynamics, diffusion, and intro statistics
  grad: Study design and exact tests
  res: Full design, reconstruction, and open questions
authors:
  - name: Andrea C. Borowczak
    affiliation: University of Wyoming
    member: andrea-borowczak
  - name: Gabriel Wickizer
    affiliation: Givaudan Flavour Corporation
  - name: Helen Meyer
    affiliation: University of Cincinnati
  - name: Mike Borowczak
    affiliation: University of Cincinnati
    member: mike-borowczak
sources:
  - venue: "Problems of Education in the 21st Century 54 · 2013 · pp. 7–13"
    title: "Enhancing Pedagogy with Context and Partnerships: Science in Hand"
    url: https://scientiasocialis.lt/pec/node/files/pdf/vol54/7-13.Burrows_Vol.54.pdf
    access: Open access
code: { label: "sh-engine.js (counts, exact tests, aggregate arithmetic, and the mixing model)", url: https://github.com/ucf-draco-lab/draco-website/blob/main/papers/science-in-hand/sh-engine.js }
citations:
  - burrows2013enhancing
widget:
  css:
    - /papers/science-in-hand/widget.css
  js:
    - /papers/science-in-hand/sh-engine.js
    - /papers/science-in-hand/widget.js
credit: "Interactive page by the [DRACO Lab](/). Every percentage comes from the paper's Table 1 and its Results section. The page reads Table 1's eight percentages as whole numbers of the 12 chemistry students (each rounds from exactly one count), totals them to 17 of 48 correct answers before and 27 of 48 after, and confirms the text's statements that questions A and D each rose by more than 20 points and question C did not change. Exact McNemar ranges (graduate and researcher levels) match SciPy's binomial test on 961 cases; the Molecule Mixing room is the page's model of the activity, not classroom data. Everything runs on your device."
bibtex: |
  @article{burrows2013enhancing,
    author  = {Borowczak, Andrea C. and Wickizer, Gabriel and Meyer, Helen and Borowczak, Mike},
    title   = {Enhancing Pedagogy with Context and Partnerships: Science in Hand},
    journal = {Problems of Education in the 21st Century},
    volume  = {54},
    pages   = {7--13},
    year    = {2013},
    url     = {https://scientiasocialis.lt/pec/node/files/pdf/vol54/7-13.Burrows_Vol.54.pdf}
  }
---

<div class="lede" data-levels="public" markdown="1">
Students often ask why a science topic matters. In 2008 and 2009, a partnership between the University of Cincinnati and one high school answered with objects students could hold: a glass coffee pot that pushes boiling water uphill, and a room full of beakers of colored water. Andrea C. Borowczak, Gabriel Wickizer, Helen Meyer, and Mike Borowczak describe the two lessons and how 55 students in three classes did on short questions before and after. Correct answers rose 17 percent overall. This page lets you walk the room, answer the chemistry questions, and see the results.
</div>

<div class="lede" data-levels="hs" markdown="1">
Heat, work, and equilibrium are hard to see. Two lessons in this study made them visible. A vacuum coffee pot showed 12 AP chemistry students heat doing work, and an activity called Molecule Mixing showed 43 biology students how particles keep moving after a mixture looks settled. Each lesson tied the science to three things: where it shows up in daily life, which careers use it, and how it touches society. Students answered open questions at the start and end of class, and their correct answers rose 17 percent in aggregate.
</div>

<div class="lede" data-levels="ug" markdown="1">
Context learning ties abstract content to experiences students already have. This study used the ACS method (application, career connections, and societal impact) to build two high school lessons through Project STEP, an NSF program that placed engineering graduate students in K–12 classrooms. The heat and work lesson used a vacuum coffee pot to motivate enthalpy and Hess's law; the dynamic equilibrium lesson turned a classroom into a well-mixed solution. Pre- and post-lesson open-response questions show gains in all three classes, largest on conceptual questions and absent on the arithmetic one.
</div>

<div class="lede" data-levels="grad" markdown="1">
A mixed-methods case study from one high school in the 2008–2009 school year: two ACS lessons, three classes (12 AP chemistry and 43 biology students), open-response questionnaires at the start and end of class scored as correct, partial, or incorrect, and informal interviews, read through a sociocultural lens. The paper reports Table 1's heat and work rates by question, a gain of more than 15 percent in each biology class, and 17 percent in aggregate, and states that the classes were too small for significance tests. The page adds counts and exact tests at this level, labeled as its own.
</div>

<div class="lede" data-levels="res" markdown="1">
Borowczak, Wickizer, Meyer, and Borowczak (2013) present two partnership-built ACS lessons as evidence that context teaching supports STEM learning, with an aggregate 17 percent rise in correct answers across 55 students. Table 1's percentages resolve to exact counts of 12 students, which allows totals (17 to 27 of 48 answers, 20.8 points), exact McNemar ranges over all pairings, and a check of the aggregate against the per-group statements. The text's "about 10%" for the chemistry class does not match Table 1's totals; the page shows which readings of the aggregate remain consistent.
</div>

## Two lessons, one partnership

<div id="sh-lessons" class="w-demo"></div>

<div data-levels="public" markdown="1">
Each lesson starts with something familiar. Coffee is a drink most students know, and walking around a room is something everyone can do. The partnership then linked each lesson to a job that uses the idea and to a question about the wider world, from the price of coffee to how crowds move through a building.
</div>

<div data-levels="hs" markdown="1">
Switch between the lessons and read the A, C, and S rows: each lesson answers "Where would I see this?", "Who uses this at work?", and "Why does it matter beyond class?" The chemistry lesson ends with two equations; the biology lesson ends with every student holding the same green water.
</div>

<div data-levels="ug grad res" markdown="1">
Project STEP (Science and Technology Enhancement Program) placed University of Cincinnati engineering graduate students in K–12 classrooms as Fellows (NSF grant DGE-0528532). The paper credits the partnership with contributions to every ACS component (the career link to engineers who design appliances, for example), and after the heat and work lesson the teacher asked the Fellow to teach dynamic equilibrium with ACS as well. The teachers had volunteered for Project STEP, which the authors list as a limit on generalizing.
</div>

## Molecule Mixing

<div id="sh-mixing" class="w-demo"></div>

<div data-levels="public" markdown="1">
Press Start walking, then Call freeze partway through and predict the final color. Every time two students meet, they pour water back and forth, so their beakers end up more alike. Blue and yellow spread through the room one meeting at a time until every beaker is the same green. Students keep walking and pouring after that, yet the color stays put.
</div>

<div data-levels="hs" markdown="1">
Watch the two lines under the room. The solid line (how different the beakers still are) falls toward zero, while the dashed line (meetings) keeps climbing. Molecules in a solution at equilibrium behave the same way: they never stop moving or colliding, and the concentrations stay constant because exchanges in each direction balance. The biology students acted out that idea with their own beakers in about 15 minutes.
</div>

<div data-levels="ug" markdown="1">
Each meeting moves both beakers toward the pair's average, so the total of each dye never changes while the differences shrink. Choose Half or Splash to model a partial exchange: the room still reaches the same green, only more slowly. This is the discrete version of diffusion, with net transport proportional to a concentration difference and zero at equilibrium even though individual exchanges continue.
</div>

<div data-levels="grad res" markdown="1">
The model is the page's: students walk at constant speed in straight lines, bounce off walls, and on meeting replace their two dye shares with a weighted average, then pick new headings. Pairwise averaging conserves each dye and drives the variance across beakers to zero, so the uniform state is the only fixed point. Beaker colors are scaled so the final even mix shows at full strength (food coloring is concentrated); the paper reports neither the number of meetings nor how complete each exchange was.
</div>

## Four questions about a cup of coffee

<div id="sh-coffee" class="w-demo"></div>

<div data-levels="public" markdown="1">
Try each question before you reveal the answer. The biggest change came on question D: before the lesson, four of 12 students could name enthalpy as the measure of a system's energy change; afterward, 11 of 12 could. Questions B and C did not move at all.
</div>

<div data-levels="hs" markdown="1">
Question C is bookkeeping: 38 units, minus eight for the cream, leaves 30. The rubric accepted two endings for the work step (10 or 18), because the question does not say which amount the work comes out of. Seven of 12 students answered it correctly before the lesson, and seven after. The lesson moved the ideas (what work is, what enthalpy measures) more than the arithmetic.
</div>

<div data-levels="ug" markdown="1">
The questions follow the lesson's arc: define work (A), decide whether heat in a cup does work (B, where the vapor rising into the upper chamber is the justification for "yes"), track energy through additions and work (C), and name the state function that summarizes it (D). Gains landed on A (8 to 33 percent) and D (33 to 92 percent), the two items that test terms and concepts. The authors read the flat C as the equation question showing no improvement.
</div>

<div data-levels="grad res" markdown="1">
Table 1 prints whole-number percentages for 12 students, and each one rounds from exactly one count, so the dots are exact. The paired structure is not printed: the page cannot tell whether the same seven students answered C correctly both times or whether some lost and others gained it. The exact McNemar ranges below each chart cover every pairing the counts allow.
</div>

## What the three classes gained

<div id="sh-results" class="w-demo"></div>

<div data-levels="public hs" markdown="1">
Every class answered more questions correctly after its lesson. In the chemistry class, correct answers on the four questions rose from 17 of 48 to 27 of 48. Both biology classes gained more than 15 percent, and the three classes together gained 17 percent. The paper does not print the biology questions or their scores.
</div>

<div data-levels="ug" markdown="1">
Use the slider to test the aggregate. If 17 percent is a student-weighted average of the chemistry and biology gains, then any chemistry gain up to about 24 points leaves the biology classes above the text's 15. Table 1's 20.8 points and the text's "about 10%" both fit, so the aggregate alone cannot say which figure describes the chemistry class.
</div>

<div data-levels="grad res" markdown="1">
Only question D clears a conventional threshold on an exact paired test (p = 0.016 to 0.039 across pairings); A's rise from one to four students gives p = 0.25 to 0.375. Both figures are the page's, and both agree with the authors' statement that the classes were too small to establish significance. The stronger evidence in a study like this is the pattern: conceptual items moved and the computational item did not.
</div>

## What the paper found

<div data-levels="public hs" markdown="1">
- Correct answers rose 17 percent across 55 students in three classes.
- In AP chemistry, 11 of 12 students named enthalpy after the coffee pot lesson, up from four.
- The energy arithmetic question did not change: seven of 12 before and after.
- Both biology classes gained more than 15 percent after Molecule Mixing.
- Students connected both activities to their everyday lives in class discussions.
</div>

<div data-levels="ug grad res" markdown="1">
- **Gains in every class.** All three implementations showed a higher rate of correct answers after the lesson; 17 percent in aggregate across 55 students.
- **Concepts moved, arithmetic did not.** In chemistry, questions A and D each rose by more than 20 points (8 to 33 and 33 to 92 percent); C stayed at 58 percent and B at 42 percent.
- **Higher starting points, smaller gains.** Both biology classes improved by more than 15 percent, with smaller gains where pre-scores were higher.
- **Teacher report.** The chemistry teacher judged the ACS gains larger than those from traditional teaching in earlier years (no figures given) and asked for a second ACS lesson.
- **Stated limits.** One high school, one school year, two course types, small classes, and volunteer teachers.
</div>

<div data-levels="grad res" markdown="1">
<div class="sh-table-scroll">
<table class="results-table">
<caption class="w-note">The study as reported, from the paper's Methodology, Results, and Conclusions.</caption>
<thead><tr><th>Element</th><th>What the paper reports</th></tr></thead>
<tbody>
<tr><td>Setting</td><td>One high school working with the University of Cincinnati through Project STEP (NSF DGE-0528532); lessons taught in 2008–2009</td></tr>
<tr><td>Participants</td><td>55 students in three classes: 12 in AP chemistry (heat and work) and 43 in two biology classes (dynamic equilibrium)</td></tr>
<tr><td>Design</td><td>Mixed methods: open-response questionnaires at the start and end of class, scored correct, partial, or incorrect; informal in-class interviews; sociocultural (Vygotskian) lens</td></tr>
<tr><td>Heat and work results</td><td>Table 1: A 8 → 33%, B 42 → 42%, C 58 → 58%, D 33 → 92%; text: about 10% more correct answers</td></tr>
<tr><td>Dynamic equilibrium results</td><td>Both classes more than 15% higher; questions and per-class values not printed</td></tr>
<tr><td>Aggregate</td><td>17% increase in correct answers</td></tr>
<tr><td>Significance</td><td>Not tested; samples too small</td></tr>
</tbody>
</table>
</div>
</div>

## Why it matters

<div data-levels="public hs" markdown="1">
A coffee pot and a few dozen beakers cost little. The study shows how a university and a high school can build lessons together that connect science to daily life, to jobs, and to society, and how short questions at the start and end of class tell a teacher right away what students learned.
</div>

<div data-levels="ug" markdown="1">
The ACS method gives teachers a checklist for any topic: one real application, one career, and one societal link. Partnerships fill in the parts a single teacher may not have, such as an engineer's view of appliance design. The pre- and post-lesson questions double as formative assessment, showing within the hour which ideas landed (enthalpy) and which did not (the energy arithmetic).
</div>

<div data-levels="grad res" markdown="1">
The study is small and uncontrolled, and the authors say so. Its value lies in a reusable design: a context framework (ACS), a partnership model that places engineers in classrooms, and item-level formative checks that separate conceptual from procedural gains. Ultimately, the same structure supports a stronger test, with a comparison class, printed questions for both lessons, and paired scores, that would let later work estimate how much of the gain the context itself produced.
</div>

<div data-levels="res" markdown="1">
## Notes from building this page

- **Two chemistry gains.** Table 1's four items total 17 of 48 correct answers before and 27 of 48 after (35.4 to 56.3 percent, 20.8 points; the mean of the four item gains is also 20.8 points). The Results section describes the chemistry class as answering "about 10%" more often. Figure 2 (correct responses by group) may hold the value the text describes, but its bars were not readable in the copy the page used, so the page shows both figures and labels their sources.
- **What 17 percent means.** The aggregate does not say whether it counts percentage points or relative change, or whether it weights by students or by answers. Under a student-weighted, percentage-point reading, the aggregate and the "more than 15%" biology statement hold for any chemistry gain up to 24.2 points, which includes both 10 and 20.8. A relative reading of Table 1 alone gives 58.8 percent.
- **Exact tests the paper did not run.** Exact McNemar ranges over all pairings consistent with Table 1: A 0.25 to 0.375, B and C 1, D 0.016 to 0.039. These are the page's, labeled as such, and are listed for author review.
- **Equal counts hide movement.** B and C have the same count before and after; the paper's "no change" may include students who switched in both directions. Printing paired outcomes, or the partial-credit counts the rubric defines, would show this.
- **The second lesson's instrument.** The dynamic equilibrium questions and per-class results are not printed, so the biology gains cannot be checked or reused.
- **Attribution.** The partnership, the context framing, the novelty of a guest teacher, and the hands-on objects changed together, with no comparison class; the teacher's comparison with earlier years has no figures.
- **Small details.** Figure 1 calls the activity "Molecular Mixing" and the text calls it "Molecule Mixing"; the paper does not say which author served as the Project STEP Fellow; no DOI for this volume was found.
</div>

<div data-levels="hs" markdown="1">
## Try this in class

1. Give each student a cup of water: two cups get a few drops of blue and yellow food coloring, the rest stay clear. Ask everyone to write down what color the cups will be at the end.
2. Walk the room. When two people meet, pour half of each cup into the other's and back, then change direction. Call "freeze" twice to compare cups and update predictions.
3. When every cup matches, keep walking and pouring for another minute and record whether the color changes. Compare your class's result with the lines in **Molecule Mixing** and explain why the meetings never stop while the color does.
</div>

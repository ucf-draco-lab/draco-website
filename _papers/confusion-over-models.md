---
title: "One Word, Two Meanings: “Modeling” in a Teacher PD"
kicker: "Interactive paper · SAGE Open 2022"
subtitle: "An interactive companion to Todd Reynolds, Andrea C. Borowczak, and Mike Borowczak's study of 40 K–12 teachers in a two-week computer science professional development, where faculty said \"modeling\" and meant a computer model, and most teachers heard a way of teaching."
description: "Code teachers' own words about modeling the way the authors did, walk the study from a two-week summer PD to a year of classroom follow-up, and see how 40 teachers' definitions of modeling moved, and how far, before and after."
share_description: "Forty K–12 teachers spent two weeks learning computer science through models. Faculty meant computer models; most teachers pictured \"I do, we do, you do.\" Code the teachers' words yourself, follow the study, and see how far their definitions moved. Written for five reading levels."
share_text: "Faculty said \"modeling\" and meant a computer model. Most of the 40 teachers in the room heard a way of teaching. See what that did to a summer PD:"
share_image: /papers/confusion-over-models/share.png
share_image_alt: "Three stacked bars of coded definitions of modeling: pre-survey 5 computer model, 29 I do, we do, you do, 6 projects; post-survey 11, 24, 4; interviews 11, 21, 0. Beside them, the title One Word, Two Meanings."
date: 2026-10-21
topics: ["Education"]
default_level: public
level_hints:
  public: No background needed
  hs: Percentages and a little reading between the lines
  ug: Intro research methods
  grad: Qualitative coding and basic statistics
  res: Full design, data, and open questions
authors:
  - name: Todd Reynolds
    affiliation: University of Wyoming
  - name: Andrea C. Borowczak
    affiliation: University of Wyoming
    member: andrea-borowczak
  - name: Mike Borowczak
    affiliation: University of Wyoming
    member: mike-borowczak
sources:
  - venue: "SAGE Open 12(2) · 2022"
    title: "Confusion Over Models: Exploring Discourse in a STEM Professional Development"
    url: https://doi.org/10.1177/21582440221097916
    access: Open access
  - venue: "Author manuscript · NSF Public Access Repository"
    title: "Confusion Over Models: Exploring Discourse in a STEM Professional Development"
    url: https://par.nsf.gov/biblio/10404278
    access: Open access
citations:
  - reynolds2022confusion
widget:
  css:
    - /papers/confusion-over-models/widget.css
  js:
    - /papers/confusion-over-models/cm-engine.js
    - /papers/confusion-over-models/widget.js
credit: "Interactive page by the [DRACO Lab](/). Every number about the study comes from the paper's tables and Findings; the quotations are the teachers' words as printed in the author manuscript. The page recomputes all 15 percentages in Table 1 and the 62.5%, 92%, and 57.5% follow-through figures from the printed counts and checks that Tables 1 and 2 both add to 40; one printed comparison (\"down from five\" projects) does not match the paper's own pre-survey count of six. Wilson intervals, the follow-through bounds, and the exact test of the pre/post shift are computed by this page and match SciPy and statsmodels on 1,060 cases. Everything runs on your device."
bibtex: |
  @article{reynolds2022confusion,
    author  = {Reynolds, Todd and Borowczak, Andrea C. and Borowczak, Mike},
    title   = {Confusion Over Models: Exploring Discourse in a {STEM} Professional Development},
    journal = {SAGE Open},
    volume  = {12},
    number  = {2},
    year    = {2022},
    doi     = {10.1177/21582440221097916}
  }
---

<div class="lede" data-levels="public" markdown="1">
In the summer of 2018, 40 K–12 teachers from 19 school districts spent two full weeks in RAMPED, a University of Wyoming professional development, learning computer science through models: programs that imitate something real, such as a system that learns to spot unusual data or a scale model of distances in space. A year later, few of them had asked for help teaching it. The researchers went back to what the teachers had said and found the problem in one word. When the computer scientists said "modeling," they meant building a computer model. When most teachers heard "modeling," they pictured a way of teaching: the teacher shows how, the class tries it together, then students do it alone. This page lets you sort the teachers' words yourself, follow the study, and see how far the teachers' meaning moved.
</div>

<div class="lede" data-levels="hs" markdown="1">
Todd Reynolds, Andrea C. Borowczak, and Mike Borowczak studied RAMPED, a two-week summer workshop (a professional development, or PD) for 40 K–12 teachers that taught computer science through models of machine learning, anomaly detection, astronomical distances, and virtual reality. Before and after the PD, teachers wrote what they picture when they hear "modeling." The researchers sorted every answer into three meanings: a **computer or conceptual model**, **"I do, we do, you do"** (teaching by example), or **projects**. Below, you can sort real answers, step through the study, and compare the counts before and after.
</div>

<div class="lede" data-levels="ug" markdown="1">
The paper asks how the language of "modeling" used in a computer science PD shaped what teachers and faculty did afterward. Data came from open-ended pre- and post-surveys (40 and 36 respondents), 14 interviews during the PD, and an email survey at the end of the following school year (25 of 40 responded). The authors coded each "modeling is …" statement, merged eight initial themes into three, and read the results through two frames: Burke's terministic screens (the words people use direct what they notice) and schema theory (new ideas attach to what learners already know). The page draws every count the paper reports and checks every printed percentage against it.
</div>

<div class="lede" data-levels="grad" markdown="1">
A qualitative study of discourse in a two-week, 80-plus-hour computer science PD for 40 self-selected K–12 STEM teachers (summer 2018) with academic-year follow-up. Statements of the form "modeling is x" from pre- and post-surveys and interviews were coded inductively (eight themes merged into three) and triangulated against end-of-year email reflections. The paper reports instance counts and percentages, without tests. At the graduate and researcher levels the page adds interval estimates, an exact test of the pre/post distribution, and bounds on the follow-through rate, all labeled as its own.
</div>

<div class="lede" data-levels="res" markdown="1">
Reynolds, Borowczak, and Borowczak (SAGE Open 2022) explain a disappointing PD outcome (few teachers sought computer science or modeling support during the follow-up year) as a mismatch of terministic screens: faculty used "model" in the computational sense, and teachers' schemas mapped it to gradual-release instruction. The evidence is coded instances across four data sources. The page reproduces every printed count and percentage, flags one internal inconsistency, and closes the researcher level with notes from building the page, including what the instance counts can and cannot support.
</div>

## Which modeling did they mean?

<div id="cm-sort" class="w-demo"></div>

<div data-levels="public" markdown="1">
Read each quote and decide which meaning the teacher had in mind. Some are easy. Others sit right on the line: "Teacher (usually) demonstrating a skill, procedure, or finished project" mentions a project, and the authors still read it as teaching by example. The five rows below the quiz show every meaning of "model" the paper found in use. The computer scientists meant the first one. Most teachers walked in with the second.
</div>

<div data-levels="hs" markdown="1">
Notice how the same word lands differently depending on what a person already does every day. A music teacher demonstrates tone; a reading teacher models a strategy aloud; a computer scientist builds a model that runs. Each one is using the word correctly. The researchers call this a **terministic screen**: the words a person brings into a room filter what that person notices. One teacher in the PD put it plainly: "I'm taking this computer class, and he keeps using this word 'modeling' in a different term … I think we're not on the same page."
</div>

<div data-levels="ug" markdown="1">
Coding qualitative data means assigning each statement to a category, here by what the writer says modeling *is*. The paper's three survey codes cover three of the five meanings it names; teaching frameworks and role models appear in the literature review and Figure 1 rather than in the survey counts. The quiz holds the 11 coded quotations the paper prints (six computer or conceptual, five "I do, we do, you do"); the paper quotes no teacher for the projects code.
</div>

<div data-levels="grad res" markdown="1">
The paper reports no inter-rater agreement for its coding, and the quotations it prints are illustrations chosen by the authors, so agreement on this quiz says nothing about coding reliability in the study. The quiz shows the boundary cases, though: demonstration of a "finished project," and a NetLogo example given in answer to the question about modeling a teacher had used or seen, both required a judgment about what the writer meant by the word.
</div>

## Forty teachers, two weeks, one year

<div id="cm-design" class="w-demo"></div>

<div data-levels="public" markdown="1">
Click each step to see what happened and how many teachers took part. The study checked in four times: before the workshop, during it (interviews), on its last day, and a year later by email. The teachers came from 19 school districts and taught everything from kindergarten to high school, in subjects as different as science, library, and welding. Use the switch to see who came.
</div>

<div data-levels="hs" markdown="1">
A study like this measures in several places because one survey can mislead. A teacher might write a new definition on the last day of an exciting workshop and still teach the old way in October. The email a year later asks what actually reached the classroom. Notice that the number of teachers answering shrinks at each step: 40, then 36, then 25.
</div>

<div data-levels="ug" markdown="1">
The design is a single cohort with no comparison group, typical of PD evaluation. The pre- and post-surveys asked the same two open-ended questions, which lets the authors compare definitions directly. Interviews (10 to 20 minutes, 14 teachers) ran during the PD, so they capture definitions in the middle of instruction. Twenty-seven participants were women and 13 men; elementary teachers (13) were the largest single group.
</div>

<div data-levels="grad res" markdown="1">
The sample is self-selected through a statewide call, spans grade bands with different needs, and was geographically dispersed during follow-up, three limitations the authors name. Each checkpoint has its own denominator (40, 36, 14, and 25), and the paper reports instances rather than respondents for the coded data, so shares at different checkpoints are not shares of the same people.
</div>

## Before, during, and after

<div id="cm-shift" class="w-demo"></div>

<div data-levels="public" markdown="1">
Each bar shows how teachers described modeling at one point in the study. Before the workshop, "I do, we do, you do" filled most of the bar (29 of 40 answers), and only five answers described a computer or conceptual model. On the last day, computer models had grown to 11 answers. That doubling is real, and it is still the smaller part of the bar. Two weeks moved some teachers' meaning, and most kept the one they came with.
</div>

<div data-levels="hs" markdown="1">
Switch to **Shares** to compare bars of different lengths fairly. Computer models went from 12.5% of answers (five of 40) to 28.2% (11 of 39), and teaching by example went from 72.5% to 61.5%. In the interviews, held during the workshop, about one answer in three (11 of 32) described a computer model. The paper also notes that many interviewees kept describing demonstration-based teaching even while they discussed computer science content.
</div>

<div data-levels="ug" markdown="1">
The counts are instances, not teachers: some answers contained more than one definition, so the post-survey has 39 instances from 36 respondents and the interviews 32 instances from 14 people. The authors read the shift as slight. "I do, we do, you do" remained the dominant schema at every checkpoint, consistent with schema theory as the paper applies it: new information attaches to frameworks a learner already holds.
</div>

<div data-levels="grad res" markdown="1">
Treating the pre- and post-survey instances as independent samples, the page finds no evidence that the distribution across the three codes changed (Pearson χ² = 3.11, df 2, p = 0.21; Freeman–Halton exact p = 0.22). The 95% Wilson intervals for the computer-model share overlap (5% to 26% before, 17% to 44% after). These analyses are the page's, and the independence assumption is wrong in a known direction: most instances come from the same teachers, which a paired analysis would use to gain power. The paper's per-teacher codes would allow a McNemar-style test of who moved; the instance totals do not.
</div>

## A year later

<div id="cm-follow" class="w-demo"></div>

<div data-levels="public" markdown="1">
Each square is one teacher. At the end of the school year, 25 of the 40 answered an email about what they had brought into their classrooms, and 23 of those 25 had tried something new from the workshop. The other 15 never answered. Move the slider to decide how many of them also changed their teaching, and watch the overall number move. The paper reports the careful version: at least 23 of 40 teachers, or 57.5%.
</div>

<div data-levels="hs" markdown="1">
The same 23 teachers give two different percentages depending on what you divide by: 92% of the teachers who answered, or 57.5% of everyone. Neither is wrong. They answer different questions. Teachers who answered averaged about five new lessons or class periods over the year, from a single 15-minute lesson to a weekly one-hour activity.
</div>

<div data-levels="ug" markdown="1">
Nonresponse is the main threat to the follow-through estimate. If silence means no change, the rate is 57.5%; if the 15 silent teachers resemble the 25 who answered, it is near 92%. The paper reports both figures, and the slider spans every case between them (57.5% to 95%). The email asked about any new idea from the PD; it does not say whether that idea involved computational modeling.
</div>

<div data-levels="grad res" markdown="1">
Interval estimates (computed by the page): response rate 62.5% (95% Wilson 47% to 76%); new idea among respondents 92% (75% to 98%); new idea among all 40, counting silence as no change, 57.5% (42% to 71%). The faculty member's concern that opens the paper, that few teachers asked for modeling or computer science support, sits beside a high self-reported adoption rate, which is the gap the discourse analysis sets out to explain.
</div>

## What the paper found

<div data-levels="public" markdown="1">
- The computer scientists and the teachers used the word "modeling" for different things, and neither side noticed at first.
- Before the workshop, most teachers described modeling as teaching by example; on the last day, most still did.
- Answers describing computer models more than doubled, from five to 11.
- A year later, 23 of the 40 teachers reported bringing something from the workshop into class.
- The authors recommend that workshops define their key words out loud and give teachers time to talk through what the words mean.
</div>

<div data-levels="hs" markdown="1">
- Pre-survey: five computer or conceptual, 29 "I do, we do, you do," and six project answers (40 in all).
- Post-survey: 11, 24, and four (39 answers from 36 teachers).
- Interviews: 11, 21, and zero (32 answers from 14 teachers).
- Email: 25 of 40 answered (62.5%); 23 of 25 used a new idea (92%), which is 23 of 40 overall (57.5%).
- The paper names five meanings of "model," from computer models to role models.
</div>

<div data-levels="ug grad res" markdown="1">
- **"Model" was a terministic screen.** Faculty meant computational models; teachers' prior schema was gradual-release instruction ("I do, we do, you do").
- **The schema moved only slightly.** Computer or conceptual definitions rose from five of 40 instances to 11 of 39; "I do, we do, you do" fell from 29 to 24 and stayed dominant.
- **Interviews matched the surveys.** During the PD, 21 of 32 coded instances were "I do, we do, you do"; none described projects.
- **Self-reported adoption was high.** Twenty-three of 25 email respondents used a new idea (92%; 57.5% of all 40), about five lessons each over the year.
- **Five concepts of modeling.** Computer science data models, teacher modeling practice, teaching and framework models, role models, and project or curricular exemplars.
- **Recommendation.** Make definitions explicit and leave room in the PD for participants to negotiate the terms.
</div>

<div data-levels="grad res" markdown="1">
<div class="cm-study-wrap">
<table class="results-table">
<caption class="w-note">Coded "modeling is …" instances as printed in the Findings, with shares and 95% Wilson intervals for the computer-model share. Shares and intervals are computed by the page.</caption>
<thead><tr><th>Source</th><th>Respondents</th><th>Computer or conceptual</th><th>I do, we do, you do</th><th>Projects</th><th>Instances</th><th>Computer share (95% interval)</th></tr></thead>
<tbody>
<tr><td>Pre-survey</td><td>40</td><td>5</td><td>29</td><td>6</td><td>40</td><td>12.5% (5% to 26%)</td></tr>
<tr><td>Post-survey</td><td>36</td><td>11</td><td>24</td><td>4</td><td>39</td><td>28.2% (17% to 44%)</td></tr>
<tr><td>Interviews</td><td>14</td><td>11</td><td>21</td><td>0</td><td>32</td><td>34.4% (20% to 52%)</td></tr>
</tbody>
</table>
</div>
</div>

## Why it matters

<div data-levels="public hs" markdown="1">
States now ask every school to teach computer science, and a summer workshop is often the main preparation a teacher gets. This study shows that a workshop can be well planned and well taught and still miss, because the experts and the teachers were not using the same words. The fix costs almost nothing: say what you mean by your key words, and ask the room what they mean by them.
</div>

<div data-levels="ug" markdown="1">
Computer science borrows everyday words (model, function, object, class, abstraction) and gives them precise meanings. Teachers new to the field bring the everyday meanings, along with strong professional ones from their own subjects. Ultimately, a PD that names those collisions early creates space for teachers to build the new meaning on top of the old one rather than filing it under the old one.
</div>

<div data-levels="grad res" markdown="1">
The paper's contribution is a lens for diagnosing PD outcomes: when uptake disappoints, examine the vocabulary before the content. Its evidence is a single self-selected cohort, coded instances without reliability statistics, and self-reported follow-through, so it supports the explanation without testing it. The authors' proposed next steps (an explicit negotiation of terms built into the PD, and Bourdieu's forms of capital as a lens on why teachers attend) are where a comparison design would belong.
</div>

<div data-levels="res" markdown="1">
## Notes from building this page

- **"Down from five."** The Findings give the pre-survey projects count as six ("6 instances for modeling as projects") and then describe the post-survey's four as "down from five pre-survey responses." Either the pre-survey count is five (and the pre-survey total is 39 instances, like the post-survey) or the comparison is a typo. The page uses six, the number printed in the pre-survey sentence, and lists the mismatch in its checks.
- **Instances, not people.** Pre-survey instances total 40 for 40 respondents, post-survey 39 for 36, and interviews 32 for 14. The paper notes that some participants gave more than one definition, so shares are of definitions offered. The page's tests treat instances as independent, which they are not.
- **"At the start of each session."** The paper describes the pre-survey as given to 40 participants at the start of each session; with four modeling sessions, that wording could mean four pre-surveys per teacher, which 40 instances would not fit. The page reads it as one pre-survey per teacher.
- **Three codes, five meanings.** Teaching and framework models and role models appear in the literature review and Figure 1, and the paper names only three of its eight initial themes. Whether any survey answers fell under the other two meanings is not reported.
- **What the email measured.** The email asked about any new idea from the PD. The 92% and 57.5% describe general uptake, while the paper's motivating concern is specific to modeling and computer science support; the page keeps the two apart.
- **Table 2.** The page uses Table 2's level and gender totals, which agree with Table 1 (both sum to 40 and split the seven combination teachers two, two, two, and one). The subject-by-level cells were not legible in the text extraction the page worked from and are not shown.
- **Quotations.** The quiz reproduces quotations from the author manuscript on NSF's Public Access Repository, shortened where marked; the codes are the ones the paper's text assigns. Wording should be checked against the version of record.
- **The page's statistics.** Wilson intervals, the follow-through bounds, the Pearson χ², and the Freeman–Halton exact test are computed by this page and are not in the paper.
- **Byline.** The published record lists Andrea C. Borowczak as Andrea C. Burrows; this page uses the name she prefers.
</div>

<div data-levels="hs" markdown="1">
## Try this in class

1. Pick a word your class uses in two subjects (for example, "model," "function," "energy," or "table"). Each student writes one sentence, without talking, about what the word means.
2. Sort the sentences into groups by meaning, the way the researchers coded the teachers' answers, and count each group.
3. Discuss which meaning each subject's teacher would use, then write a one-line definition the whole class agrees to use for the rest of the week.
</div>

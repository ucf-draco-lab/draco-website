---
title: "Twenty Hours a Week in High School: Training Future Engineering Faculty"
kicker: "Interactive paper · ASEE 2010"
subtitle: "An interactive companion to Andrea C. Borowczak, Anant Kukreti, Mike Borowczak, and Amr Safwat's account of Project STEP, a University of Cincinnati program that sent graduate engineering students into high school classrooms for a year to learn how to teach."
description: "Walk the training cycle of Project STEP's graduate Fellows, match the program's three goals to the evidence it collected, read 355 student feedback sheets, and see what 12 Fellows said the year cost them and gave them."
share_description: "Fifteen graduate engineering students spent about 20 hours a week teaching in Cincinnati high schools. Walk their training cycle, see which of the program's goals the paper measured, read what students thought of the lessons, and weigh what the Fellows said it cost and gave them. Written for five reading levels."
share_text: "Graduate engineers spent a year teaching high school to learn how to teach. See what students and the Fellows themselves reported:"
share_image: /papers/future-faculty-step/share.png
share_image_alt: "Two stacked bars of student feedback: 273 of 325 students rated the lesson good or excellent and 263 of 353 agreed they learned a lot. Beside them, the title Twenty Hours a Week in High School."
date: 2026-10-22
topics: ["Education"]
default_level: public
level_hints:
  public: No background needed
  hs: Percentages and a little reading between the lines
  ug: Intro research methods
  grad: Program evaluation and basic statistics
  res: Full design, data, and open questions
authors:
  - name: Andrea C. Borowczak
    affiliation: University of Cincinnati
    member: andrea-borowczak
  - name: Anant Kukreti
    affiliation: University of Cincinnati
  - name: Mike Borowczak
    affiliation: University of Cincinnati
    member: mike-borowczak
  - name: Amr Safwat
    affiliation: University of Cincinnati
sources:
  - venue: "ASEE Annual Conference & Exposition · Louisville, KY · 2010"
    title: "Improving Future Faculty With Graduate Engineering Education"
    url: https://doi.org/10.18260/1-2--16917
    access: Open access (ASEE PEER)
citations:
  - burrows2010improving
widget:
  css:
    - /papers/future-faculty-step/widget.css
  js:
    - /papers/future-faculty-step/ff-engine.js
    - /papers/future-faculty-step/widget.js
credit: "Interactive page by the [DRACO Lab](/). Every number about the program comes from the paper's text and its Figures 2 and 3. The page reproduces all ten printed percentages in Figures 2 and 3 and both totals (91.5% and 99.4%) as counts out of 355 feedback sheets, the only whole number from 300 to 20,000 that fits them all; the paper does not state 355. It also checks which whole counts of the 12 survey respondents produce each printed Fellow percentage (four of seven do). The rounding arithmetic matches an exact rational implementation in Python on 3,000 cases, and the Wilson intervals match statsmodels to 4 × 10⁻¹⁶ on 1,000 cases. Analyses beyond the paper are labeled as the page's own. Everything runs on your device."
bibtex: |
  @inproceedings{burrows2010improving,
    author    = {Borowczak, Andrea C. and Kukreti, Anant and Borowczak, Mike and Safwat, Amr},
    title     = {Improving Future Faculty With Graduate Engineering Education},
    booktitle = {2010 ASEE Annual Conference \& Exposition},
    address   = {Louisville, Kentucky},
    pages     = {15.696.1--15.696.9},
    year      = {2010},
    doi       = {10.18260/1-2--16917}
  }
---

<div class="lede" data-levels="public" markdown="1">
Most engineering professors learned to teach by teaching, in front of their first class, with no training at all. Project STEP at the University of Cincinnati tried something different. It placed graduate engineering students, called Fellows, in about five local high schools a year for about 20 hours a week, where each Fellow worked beside four teachers and taught lessons built from the Fellow's own research. By 2010 the program was in its ninth year. This page walks through how the Fellows were trained, what the program set out to measure, what high school students thought of the lessons, and what the Fellows said the year cost them and gave them.
</div>

<div class="lede" data-levels="hs" markdown="1">
Andrea C. Borowczak, Anant Kukreti, Mike Borowczak, and Amr Safwat describe Project STEP, a program paid for by the National Science Foundation (NSF) that placed graduate students in engineering, mathematics, and science in Cincinnati high schools. From 2006 to 2009, 15 Fellows worked with 36 teachers, created more than 120 lessons, and reached more than 3,000 students. The paper asks whether that year in a high school classroom makes a graduate student a better future professor. Below you can step through the Fellows' training, see which goals were measured, and read the numbers the paper prints.
</div>

<div class="lede" data-levels="ug" markdown="1">
The paper is a program description with evaluation data from an NSF Graduate STEM Fellows in K–12 Education (GK-12) project (award DGE-0538532). It lays out the Fellow training cycle (summer planning class, yearlong practicum, mentoring, and reflection), three long-term goals with an evaluation method for each, two frequency tables from 2008–2009 student feedback sheets, and percentages from an online survey of 12 of the 15 Fellows from 2006 to 2009. The page draws every number the paper reports and checks every printed percentage against the counts that produce it.
</div>

<div class="lede" data-levels="grad" markdown="1">
A descriptive program evaluation of a GK-12 fellowship (University of Cincinnati, ninth funded year) in which graduate STEM students taught in partner high schools roughly 20 hours a week. Evidence comes from student activity feedback forms (2008–2009, all lessons; two five-point items) and an online reflection survey of past Fellows (12 of 15 responding). The paper names observation (the Revised Teaching Observation Protocol, RTOP), lesson pre- and post-tests, and focus groups as methods but prints no results from them. At the graduate and researcher levels the page adds the sheet count implied by the printed percentages, the whole counts behind each Fellow percentage, and interval estimates, all labeled as its own.
</div>

<div class="lede" data-levels="res" markdown="1">
Burrows (now Borowczak), Kukreti, Borowczak, and Safwat (ASEE 2010) argue that a K–12 teaching fellowship prepares graduate engineers for faculty careers by building their ability to explain research to novices. The evidence is two student feedback distributions and Fellow self-reports, with no comparison group. The page reproduces both feedback tables exactly from an inferred base of 355 sheets, shows that three of the five Fellow percentages without printed counts cannot be whole counts of the 12 respondents, and closes the researcher level with notes on what the evidence can and cannot support.
</div>

## The training cycle

<div id="ff-wheel" class="w-demo"></div>

<div data-levels="public" markdown="1">
Click each part of the wheel to see how the program prepared a Fellow. Training started in the summer with short lessons of 10 to 15 minutes, long enough to learn what a room of teenagers feels like. During the school year a Fellow spent about 20 hours a week in a high school and kept coming back to a weekly class, to mentors, and to a weekly written reflection. The year chart shows how those parts overlap.
</div>

<div data-levels="hs" markdown="1">
Each Fellow usually worked with two mathematics teachers and two science teachers. One Fellow wrote that the summer preparation let them start strong in the first week while supporting four courses at once: Physical Science, Geometry, AP Biology, and AP Calculus. The paper's goal for the Fellows reads like a job description for a professor: plan a lesson, teach it, notice what went wrong, and do it better the next week.
</div>

<div data-levels="ug" markdown="1">
The paper lists five objectives for the Fellows (creative teaching that builds STEM skills, a link between their schooling, research, and career plans, coaching in sound teaching methods, hands-on classroom practice, and real high school activities of their own design) and twelve for teachers, students, and schools. After the summer, the authors note, the effects of the practicum and of time in the classroom cannot be separated, and the program has no formal measure of training impact. The page draws the four parts the abstract names; Figure 1's own labels were not legible in the text the page worked from.
</div>

<div data-levels="grad res" markdown="1">
The training cycle combines four interventions delivered concurrently from August on, so any outcome is attributable to the package rather than to a component. The records each part produces (planning-class work, practicum records, meeting notes, and reflections) are qualitative, and the paper uses them to describe the program, not to score Fellows. The summer instructor's interviews about comfort and confidence are the closest thing to a baseline, and the paper reports them informally.
</div>

## Three goals, seven kinds of evidence

<div id="ff-goals" class="w-demo"></div>

<div data-levels="public" markdown="1">
Project STEP had three long-term goals: train the Fellows, build lessons that raise student learning, and keep the program going after the grant ends. For each goal, the paper names how it was checked. Choose a goal to see the methods. Two of the seven come with results in the paper: what students wrote on feedback sheets, and what the Fellows said in a survey. The rest were collected or described, and their results were saved for other reports.
</div>

<div data-levels="hs" markdown="1">
A program can collect a lot of evidence and still print only part of it. Here the classroom observations, the tests students took before and after each lesson, and the yearly focus groups are all described, but the paper gives no scores from them. That matters when you read the conclusion: the claims about student learning rest on what students said, not on test results.
</div>

<div data-levels="ug" markdown="1">
The RTOP rates a lesson in five areas: lesson design and implementation, propositional pedagogic knowledge, procedural pedagogic knowledge, communicative interactions, and student-teacher relationships. Fifteen observations were completed by the end of May each year, and each Fellow received a summary. Lesson pre- and post-tests were given and analyzed. Either data set would speak directly to the paper's two central claims (Fellows teach better; students learn), and neither appears in this paper.
</div>

<div data-levels="grad res" markdown="1">
The evidence the paper prints aligns with goals 1 and 2 through self-report only: student perceptions of interest and learning, and Fellow perceptions of their own growth. Goal 3 (sustainability) is supported by a description of recurring events. The tally above is the page's own reading of the Evaluation Methods section; the authors may have reported the other data elsewhere.
</div>

## What students said

<div id="ff-students" class="w-demo"></div>

<div data-levels="public" markdown="1">
After each lesson or activity, students filled in a short feedback sheet. Each bar shows how students answered one question in the 2008–2009 school year. Most students rated the lesson good or excellent (273 of 325), and most agreed they learned a lot (263 of 353). Few gave the lowest answers: 10 rated a lesson poor or fair, and 16 disagreed that they learned a lot.
</div>

<div data-levels="hs" markdown="1">
Notice that the two questions have different numbers of answers, 325 and 353, from the same stack of sheets. Some students skipped one question. Also notice what the questions measure: whether students enjoyed the lesson and whether they felt they learned. A student can feel they learned a lot and still miss the idea on a test, which is why the program also gave tests before and after each lesson.
</div>

<div data-levels="ug" markdown="1">
Top-two-box shares: 84.0% of answering students rated the lesson good or excellent, and 74.5% agreed or strongly agreed that they learned a lot. The neutral middle is larger on the learning item (20.8% printed) than on the rating item (11.8%), so students were more willing to call a lesson good than to say it taught them a lot. Both items pool every Fellow's lessons for a year, so the figures describe the program, not any one Fellow or lesson.
</div>

<div data-levels="grad res" markdown="1">
Switch the base to see how the printed table works. Every printed percentage, including the two totals of 91.5% and 99.4%, equals the count divided by 355 and rounded to one decimal; dividing by the answering students does not reproduce any of them. The tables are standard statistics-package frequency output with the missing rows left off: 355 sheets, 30 blank on the rating item and two on the learning item. The page's interval estimates (in the note above) treat sheets as independent, which overstates precision when one student contributes a sheet per lesson.
</div>

## What the Fellows said

<div id="ff-fellows" class="w-demo"></div>

<div data-levels="public" markdown="1">
Twelve of the 15 Fellows from 2006 to 2009 answered an online survey; each circle is one Fellow, and the three dashed circles did not answer. Click each result. Most Fellows said the year was good for them: two in three want to teach in the future, and most left more aware of what teachers and students need. The costs show up too. Seven of the 12 said the program took more time and effort than they expected, and four said it left too little time for their own research.
</div>

<div data-levels="hs" markdown="1">
Percentages from a small group are easy to check. With 12 people, each person is worth about 8.3 percentage points, so 58% is seven Fellows and 33% is four. Some of the paper's figures land between whole people (try 70% and 87%), which suggests they come from something other than a simple count, such as an average across several questions. The figure that holds the values (Figure 4) was not readable in the version the page worked from.
</div>

<div data-levels="ug" markdown="1">
The benefits and costs come from the same 12 people and do not contradict each other: 87% rated STEP as helping them manage time more efficiently, and 58% said it took more time than they expected. A demanding schedule can teach time management. The paper names time as the main challenge for Fellows and for teachers, and reports that Fellows' anxiety about time and teaching methods decreased over three years.
</div>

<div data-levels="grad res" markdown="1">
Computed by the page: 67%, 75%, 58%, and 33% are whole counts of 12 (eight, nine, seven, and four), and 70%, 80%, and 87% are not. Switch the base to all 15 Fellows and 80% and 87% become whole counts (12 and 13), and 75% and 58% stop being whole counts, so a single denominator cannot explain the printed set. The most likely reading is that some figures are averages across Figure 4's items or shares of a rating scale; the paper does not say. With n = 12, a 95% Wilson interval around eight of 12 runs from 39% to 86%, so the survey supports direction more than size.
</div>

## What the paper found

<div data-levels="public" markdown="1">
- Graduate engineering students can spend a year teaching in high schools, and most of them come away wanting to teach.
- High school students mostly liked the lessons and felt they learned from them.
- The year is demanding: time was the main challenge for Fellows and teachers alike.
- The authors credit the Fellows' growth as communicators to constant contact with faculty and weekly time in a classroom.
- They suggest comparing former Fellows who became professors with other new professors to see whether the training lasts.
</div>

<div data-levels="hs" markdown="1">
- From 2006 to 2009: 15 Fellows, 36 teachers, about five schools a year, more than 120 lessons, and more than 3,000 students.
- Student ratings: 273 of 325 rated the lesson good or excellent; 263 of 353 agreed they learned a lot.
- Fellow survey (12 of 15): 67% want to teach, 75% left more sensitive to teachers' and students' needs, and 87% said STEP helped them manage time.
- Costs: seven of 12 said it took more time than expected; four said it left too little time for research.
- Challenges named: time for Fellows and teachers, teaching techniques, sharing a classroom, and students' grasp of mathematics and science concepts.
</div>

<div data-levels="ug grad res" markdown="1">
- **A teaching fellowship as faculty preparation.** Twenty hours a week in a high school, with a summer class, a weekly practicum, mentoring, and reflection, gives graduate engineers practice explaining research to novices.
- **Students rated the lessons well.** Of answering students, 84.0% rated lessons good or excellent and 74.5% agreed they learned a lot (2008–2009, all lessons).
- **Fellows reported growth.** Two-thirds want to teach; most reported better time management, verbal communication, presentation skills, and understanding of the K–12 environment.
- **Time is the cost.** Seven of 12 Fellows found the program took more time than expected, and four found too little time for research.
- **Evaluation in progress.** Observation, pre- and post-tests, and focus groups were collected; the paper reports none of their results and notes that no formal measure of training impact exists.
- **Recommendation.** Compare the teaching evaluations of STEP alumni now in faculty positions with those of other new faculty.
</div>

<div data-levels="grad res" markdown="1">
<div class="ff-table-wrap">
<table class="results-table">
<caption class="w-note">Reported values. Counts and printed percentages are the paper's; the page's base of 355 sheets, the whole-count column, and the intervals are computed by the page.</caption>
<thead><tr><th>Measure</th><th>Printed</th><th>Count</th><th>Base</th><th>Page check</th><th>95% Wilson (page)</th></tr></thead>
<tbody>
<tr><td>Lesson rated good or excellent (Fig. 2)</td><td>48.2% + 28.7%</td><td>273</td><td>325 answered (355 sheets)</td><td>All five cells and the 91.5% total = count / 355</td><td>84.0% (79.6% to 87.6%)</td></tr>
<tr><td>Learned a lot, agree or strongly agree (Fig. 3)</td><td>45.9% + 28.2%</td><td>263</td><td>353 answered (355 sheets)</td><td>All five cells and the 99.4% total = count / 355</td><td>74.5% (69.7% to 78.8%)</td></tr>
<tr><td>Fellows who want to teach</td><td>67%</td><td>—</td><td>12</td><td>8 of 12</td><td>39% to 86%</td></tr>
<tr><td>Overall positive effect</td><td>70%</td><td>—</td><td>12</td><td>No whole count of 12 or 15</td><td>—</td></tr>
<tr><td>More sensitive to teachers' and learners' needs</td><td>75%</td><td>—</td><td>12</td><td>9 of 12</td><td>47% to 91%</td></tr>
<tr><td>K–12 environment understanding</td><td>80%</td><td>—</td><td>12</td><td>Not of 12; 12 of 15</td><td>—</td></tr>
<tr><td>Manage time more efficiently</td><td>87%</td><td>—</td><td>12</td><td>Not of 12; 13 of 15</td><td>—</td></tr>
<tr><td>More time and effort than expected</td><td>58%</td><td>7</td><td>12</td><td>7 of 12</td><td>32% to 81%</td></tr>
<tr><td>Too little time for research</td><td>33%</td><td>4</td><td>12</td><td>4 of 12</td><td>14% to 61%</td></tr>
</tbody>
</table>
</div>
</div>

## Why it matters

<div data-levels="public hs" markdown="1">
Every professor learned to teach somewhere, and for many engineers the first real practice comes in front of their own first class. Project STEP moved that first try to a high school, with support around it, and the high school students got lessons built from current research in return. Programs like this create spaces where both sides learn: the graduate student learns to explain, and the teenager meets an engineer.
</div>

<div data-levels="ug" markdown="1">
The paper starts from a gap: graduate engineering programs prepare researchers, and students headed for faculty careers often get little formal training in teaching or practice with it. Ultimately, a fellowship that pairs a graduate student with four teachers for a year builds a sustainable, mutually beneficial partnership: schools gain lessons tied to current research, and the university gains future faculty who have already practiced explaining that research to people without a technical background.
</div>

<div data-levels="grad res" markdown="1">
The paper's contribution is a working model of faculty preparation embedded in K–12 outreach, with nine years of operation behind it. Its evidence is self-report from students and Fellows, without a comparison group, so it supports the program's feasibility and its participants' perceptions rather than a causal effect on teaching quality. The authors' own proposal (teaching evaluations of STEP alumni against other new faculty) and the unreported RTOP and pre/post data are where a stronger test would come from.
</div>

<div data-levels="res" markdown="1">
## Notes from building this page

- **The base of 355 sheets.** Neither the text nor the figures state how many feedback sheets were collected. The printed percentages fit 355 and no other whole number from 300 to 20,000, for both tables at once. The missing rows (30 and two) are the page's inference.
- **Fellow percentages.** The 58% and 33% come with counts (seven and four of 12). Of the other five, 67% and 75% fit 12 respondents, 80% and 87% fit 15 but not 12, and 70% fits neither. The text ties 87% to "the 87% rating (Figure 4)," which suggests a rating-scale summary. The page draws the nearest whole count of 12 for the three that do not fit and says so.
- **"This 80%."** The sentence before it describes the "overwhelming majority" who reported gains in time management, communication, presentation skills, and career goals, without a number. "This 80%" then refers to an 80% the text has not given.
- **Figure 4.** Its values were not legible in the text extraction the page worked from. If the figure shows per-item distributions, the percentages above could be recomputed from it.
- **The instrument name.** The paper expands RTOP as the Revised Teaching Observation Protocol. The instrument with this acronym and these five subscales is widely published as the Reformed Teaching Observation Protocol; the page uses the paper's wording.
- **Interest and learning labels.** Figures 2 and 3 are labeled "Interest" and "Learning." Both are single self-report items, so "learning" here means students' perception that they learned.
- **Training wheel labels.** The page draws the four components the abstract names; Figure 1's labels were not available.
- **Companion paper.** The Fellow Highlight (a Mill Creek water-quality unit in which 18 students used polymerase chain reaction to trace contamination within three hours, April 2009) is the subject of a separate 2010 ASEE paper by Hadaway and colleagues.
- **The page's statistics.** The 355 base, the whole-count checks, and the Wilson intervals are computed by this page and are not in the paper.
- **Byline.** The published record lists Andrea C. Borowczak as Andrea Burrows; this page uses the name she prefers.
</div>

<div data-levels="hs" markdown="1">
## Try this in class

1. Pick something you know well (a game, a sport, a recipe, or a song) and write how you would teach it to a younger student in 10 minutes, the length of a Fellow's first summer lesson.
2. Teach it to a partner, then have the partner fill in a two-question sheet like the one in Figures 2 and 3: rate the lesson from poor to excellent, and agree or disagree with "I learned a lot."
3. Combine the class's sheets, count each answer, and compute the percentages twice, once out of all sheets and once out of the answered ones, then discuss which one a reader should see.
</div>

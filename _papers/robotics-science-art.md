---
title: "Science and Art Form: Two Weeks of Robots for 13 Teachers"
kicker: "Interactive paper · Problems of Education in the 21st Century 2012"
subtitle: "An interactive companion to Andrea C. Borowczak, Mike Borowczak, Timothy F. Slater, and J. Chris Haynes's study of a two-week robotics professional development, where 13 K-12 teachers who mostly called themselves novices finished as intermediates and experts."
description: "Program a grid robot through the lab's three tiers, walk the eight content pairings and the daily quiz cycle, test the self-ranking shift against every pairing the printed counts allow, work out what the quiz percentages require, and encode a secret message like one of the teachers' lessons."
share_description: "Thirteen Wyoming teachers spent two weeks building and programming LEGO MindStorms robots. Nine started as self-described novices; none finished as one, and daily quiz averages rose from 57% to 88%. Explore the study at five reading levels."
share_text: "Two weeks, 13 teachers, and a box of robots: how a summer PD treated computer science as both a science and an art form:"
share_image: /papers/robotics-science-art/share.png
share_image_alt: "Thirteen teachers drawn as dots moving from novice to intermediate and expert self-rankings, beside the title Science and Art Form."
date: 2026-10-22
topics: ["Education"]
default_level: public
level_hints:
  public: No background needed
  hs: Classroom science and a little coding
  ug: Intro programming and research methods
  grad: Education research methods and statistics
  res: Full design, reconstruction, and open questions
authors:
  - name: Andrea C. Borowczak
    affiliation: University of Wyoming
    member: andrea-borowczak
  - name: Mike Borowczak
    affiliation: University of Cincinnati
    member: mike-borowczak
  - name: Timothy F. Slater
    affiliation: University of Wyoming
  - name: J. Chris Haynes
    affiliation: University of Wyoming
sources:
  - venue: "Problems of Education in the 21st Century 47 · 2012 · pp. 6–15"
    title: "Teaching Computer Science & Engineering Through Robotics: Science & Art Form"
    url: http://www.scientiasocialis.lt/pec/node/768
    access: Open access
code: { label: "rb-engine.js (robot model, statistics, and quiz arithmetic)", url: https://github.com/ucf-draco-lab/draco-website/blob/main/papers/robotics-science-art/rb-engine.js }
citations:
  - burrows2012teaching
widget:
  css:
    - /papers/robotics-science-art/widget.css
  js:
    - /papers/robotics-science-art/rb-engine.js
    - /papers/robotics-science-art/widget.js
credit: "Interactive page by the [DRACO Lab](/). Every number about the program comes from the paper's text; its figures and Table 1 are not reproduced. The page reproduces the printed self-ranking percentages (69%, 31%, 62%, and 38%) and the reported p < 0.001 under every pairing of the 13 teachers consistent with the printed counts (largest paired p = 0.00072); its t-tests match SciPy and its exact sign and signed-rank tests match an independent Python enumeration on 398 test cases (largest difference 10<sup>−14</sup>). The robot arena is the page's model of the lab tasks, and its default programs and both wall-following rules were checked on 500 generated mazes. Everything runs on your device."
bibtex: |
  @article{burrows2012teaching,
    author  = {Borowczak, Andrea C. and Borowczak, Mike and Slater, Timothy F. and Haynes, J. Chris},
    title   = {Teaching Computer Science \& Engineering Through Robotics: Science \& Art Form},
    journal = {Problems of Education in the 21st Century},
    volume  = {47},
    pages   = {6--15},
    year    = {2012},
    url     = {http://www.scientiasocialis.lt/pec/node/768}
  }
---

<div class="lede" data-levels="public" markdown="1">
Teachers cannot teach computer science they have never tried. In the summer of 2012, 13 Wyoming teachers (five elementary, five middle school, and three high school) spent two weeks building and programming LEGO MindStorms robots between lessons on astronomy, agriculture, engineering, and more. Before the program, nine of them called themselves novices at programming. Afterward, none did: eight called themselves intermediate and five called themselves experts. This page lets you program a robot the way they did and explore every result the paper reports.
</div>

<div class="lede" data-levels="hs" markdown="1">
A professional development (PD) program is school for teachers. This one ran eight hours a day for two weeks. Its lessons paired eight science, technology, engineering, mathematics, and agriculture topics with computing ideas, and each day sent the teachers to a lab to build and program robots at whatever level they chose. A short quiz before and after each day measured what they learned: the two-week average went from 57% to 88%. The teachers also ranked their own programming skill and wrote lesson plans for their classes.
</div>

<div class="lede" data-levels="ug" markdown="1">
A mixed-methods study of one two-week summer PD for 13 pre-collegiate teachers in a rural western U.S. city, funded through a No Child Left Behind Title II, Part B grant. Days combined content sessions (for example, astronomy with data encoding, agriculture with pH) and self-paced LEGO MindStorms labs. Three data sources answer one question, whether teacher confidence affects the lessons teachers create: a pre/post confidence survey (a self-ranking and seven Likert items), daily pre/post content quizzes (57% to 88%), and at least 13 lesson plans and robot programs coded into three themes.
</div>

<div class="lede" data-levels="grad" markdown="1">
A single-group pre/post design with 13 self-selected K-12 teachers and three instruments. Self-ranked expertise moved from 9 novices and 4 intermediates to 8 intermediates and 5 experts (t-test, p < 0.001). Daily content quizzes rose from 57% to 88% on average, with most daily differences at p < 0.001 (data encoding: p < 0.015). Six of the seven Likert confidence items reached only 85% to 90% confidence. Artifacts fell into three themes. The page reproduces the self-ranking result under every pairing the printed counts allow and, at this level, adds exact rank tests computed by the page.
</div>

<div class="lede" data-levels="res" markdown="1">
Burrows (now Borowczak), Borowczak, Slater, and Haynes (2012) frame computer science, after Denning (2005), as both a science of information processes and a set of "computing arts," and report a two-week robotics PD in which 13 teachers' self-rankings, daily quiz scores, and lesson artifacts all improved. The text prints counts and two-week averages; per-item survey values, daily quiz scores, and theme counts appear only in Figures 3 and 4 and Table 1. Coding the ranks 1 to 3, all five pairings consistent with the printed counts give paired p between 8.5 × 10<sup>−9</sup> and 7.2 × 10<sup>−4</sup>. The notes below cover what the printed percentages constrain, the test choice for ordinal ranks, and what the design can attribute to the robots.
</div>

## Program a robot

<div id="rb-robot" class="w-demo"></div>

<div data-levels="public" markdown="1">
The teachers chose their own level in the lab: novice, intermediate, or expert. Novices made a robot move and repeat a pattern. Intermediates used a light sensor to find a line. Experts sent a robot through a maze and around walls. Facilitators were in the room but were asked not to give answers, so teachers worked out each problem by trying, watching, and trying again. Start with the square, then move the tape and see why a sensor beats counting.
</div>

<div data-levels="hs" markdown="1">
Each tier adds one idea. The novice square needs a loop: one side and one turn, repeated four times. The intermediate task needs a sensor: a robot that counts squares stops in the wrong place once the tape moves, while one that watches its light sensor stops on the tape every time. The expert maze needs rules instead of a fixed list of moves, because the robot cannot see the whole maze. Keeping one hand on the wall is a rule simple enough for a robot and strong enough to solve any maze without loops.
</div>

<div data-levels="ug grad res" markdown="1">
The paper lists the lab tasks (move, loop, sense light and sound, track a line, turn around, navigate a maze, and solve problems such as avoiding a wall) and says teachers worked at self-selected novice, intermediate, or expert levels; it does not assign tasks to tiers or describe the courses. This arena is the page's model of that progression: a block program run a set number of times, a light-sensor block, and a rule-based controller with a bump sensor. The maze generator makes perfect mazes (one path between any two squares), so either wall-following rule always reaches the goal; on 500 generated mazes, both did. The robot is the tool the teachers learned with, and it gets this one demo. The rest of the page is about the study.
</div>

## Two weeks, eight pairings

<div id="rb-days" class="w-demo"></div>

<div data-levels="public hs" markdown="1">
Every day had the same rhythm: a short quiz, a lesson that paired a subject with a computing idea, time in the robot lab, and the quiz again. Pairing astronomy with data encoding, or the GPS (Global Positioning System) with science, showed teachers where code already lives in the subjects they teach.
</div>

<div data-levels="ug grad res" markdown="1">
<div class="ag-table-scroll">
<table class="results-table">
<caption class="w-note">Design of the study, from the paper's methods and results.</caption>
<thead><tr><th>Element</th><th>What the paper reports</th></tr></thead>
<tbody>
<tr><td>Participants</td><td>13 pre-collegiate teachers: 5 elementary, 5 middle school, 3 high school</td></tr>
<tr><td>Setting</td><td>A rural western U.S. city; two weeks of eight-hour days in summer 2012</td></tr>
<tr><td>Funding</td><td>No Child Left Behind (P.L. 107-110, Title II, Part B) through the Wyoming Department of Education, and the Wyoming Excellence in Higher Education Endowed Chair Endowment</td></tr>
<tr><td>Intervention</td><td>Eight content pairings and daily LEGO MindStorms labs at self-chosen levels; facilitators asked not to give answers</td></tr>
<tr><td>Instruments</td><td>Pre/post confidence survey (self-ranking and seven Likert items); daily pre/post quizzes (about five content and three pedagogy questions); lesson plans and robot programs</td></tr>
<tr><td>Analysis</td><td>t-tests on the survey and quizzes; artifacts coded by repeated words and program success</td></tr>
</tbody>
</table>
</div>
</div>

## Novice to expert

<div id="rb-rank" class="w-demo"></div>

<div data-levels="public" markdown="1">
Each dot is one teacher. On the first day, nine said they were novices at programming and four said they were intermediate. After two weeks, no one chose novice: eight chose intermediate and five chose expert. Every teacher who started as a novice moved up at least one level.
</div>

<div data-levels="hs" markdown="1">
Percentages make groups of different sizes easy to compare: 9 of 13 is 69%, and 5 of 13 is 38%. The paper says the shift is statistically significant at p < 0.001, which means a change this large would almost never happen by chance if the program had no effect on how teachers saw themselves.
</div>

<div data-levels="ug grad res" markdown="1">
The paper prints the counts but not who moved where. Because no one finished as a novice, one number fixes every pairing: how many of the four starting intermediates became experts (k, from zero to four). Coding novice, intermediate, and expert as 1, 2, and 3, every pairing has the same mean change (14 levels over 13 teachers, 1.077), and the paired t ranges from 4.50 (k = 0) to 14.0 (k = 4). All five reproduce the paper's p < 0.001. Treating before and after as independent groups gives t(24) = 5.56 and p = 1.0 × 10<sup>−5</sup> for every pairing.
</div>

<div data-levels="grad res" markdown="1">
A self-ranking is ordinal, so a t-test on codes 1 to 3 assumes equal spacing between levels. The exact sign and Wilcoxon signed-rank tests drop that assumption. They depend on how many teachers moved up (9 + k of 13) and give p from 0.0039 (k = 0) to 0.00024 (k = 4); they clear 0.001 only when at least two of the four intermediates became experts. These rank tests are the page's addition, not the paper's, and the conclusion that teachers' self-assessments rose holds under all of them at the 0.01 level.
</div>

## Daily quizzes

<div id="rb-quiz" class="w-demo"></div>

<div data-levels="public" markdown="1">
Teachers took a short quiz at the start and end of each day. Across the two weeks, average scores rose from 57% to 88%. The biggest jump came on the pH (acidity) day, where scores more than doubled. A percent increase compares the gain with the starting score, so a large one can only come from a low start: move a slider to see why.
</div>

<div data-levels="hs" markdown="1">
Two different numbers describe the same change. From 57% to 88% is a gain of 31 percentage points, and 31 is 54% of 57. The paper's topic gains (117% for pH, 91% for structures, 83% for water quality, and 17% for biomedicine) are the second kind. A 117% increase means the posttest score was 2.17 times the pretest score, so the pretest average on that day could not have been above about 46%.
</div>

<div data-levels="ug grad res" markdown="1">
The text prints the two-week averages and four topic gains; the daily pre/post scores and their p-values appear only in Figure 4. Most daily differences are reported at p < 0.001, with data encoding at p < 0.015. A relative gain g caps the pretest at 100/(1 + g): 46.1% for pH, 52.4% for structures, 54.6% for water quality, and 85.5% for biomedicine. The large engineering gains therefore come from days with low starting scores, which fits content that was new to many of these teachers.
</div>

## Lesson-plan themes

<div id="rb-themes" class="w-demo"></div>

<div data-levels="public hs" markdown="1">
The real test of a teacher program is what reaches students. The teachers wrote at least 13 lesson plans and final robot programs, and the authors sorted them into three themes. The elementary encoding lesson turns arithmetic into a secret message: solve each problem, turn each answer into a letter, and read what a classmate sent.
</div>

<div data-levels="ug grad res" markdown="1">
Themes came from repeated words in the plans and from whether the robot programs succeeded. STEM integration plans linked two to four STEM components; engineering and design plans ran a full plan, prototype, and test cycle; encoding plans represented information in another form. The paper's Table 1 gives the counts by theme and is not reproduced here.
</div>

## What the paper found

<div data-levels="public" markdown="1">
- Thirteen teachers started mostly as self-described novices at programming and finished as intermediates and experts.
- Quiz scores rose every day, from an average of 57% to 88%, and the biggest gains came on pH, building structures, and water quality.
- Teachers turned what they learned into lessons that mixed subjects, used engineering design, or taught students to encode information.
</div>

<div data-levels="hs" markdown="1">
- Self-ranking: 9 novices and 4 intermediates before; 8 intermediates and 5 experts after (p < 0.001).
- Daily quizzes: 57% to 88% on average; pH rose 117%, structures 91%, water quality 83%, and biomedicine 17%.
- Confidence surveys moved in the right direction but less clearly; teachers rated their students' abilities about half a point differently from their own confidence, before and after.
- At least 13 lesson plans and robot programs fell into three themes: STEM integration, engineering and design, and encoding.
</div>

<div data-levels="ug" markdown="1">
- **Self-ranking.** From 9 novices and 4 intermediates to 8 intermediates and 5 experts, t-test p < 0.001.
- **Content.** Two-week quiz averages from 57% to 88%; most daily gains at p < 0.001, data encoding at p < 0.015.
- **Confidence.** One self-confidence item reached 99% confidence; the other six reached 85% to 90%, and the paper calls the Likert results not clear (p < 0.15).
- **Artifacts.** Lesson plans and programs grouped into STEM integration, engineering and design, and encoding.
- **Argument.** Confidence and content knowledge lead teachers to write stronger lessons, and computer science PD works best when it treats the field as both a strict science and an art form.
</div>

<div data-levels="grad res" markdown="1">
<div class="ag-table-scroll">
<table class="results-table">
<caption class="w-note">Results as printed in the text. Values from Figures 3 and 4 and Table 1 are not reproduced.</caption>
<thead><tr><th>Measure</th><th>Before</th><th>After</th><th>Reported test</th></tr></thead>
<tbody>
<tr><td>Self-ranking (n = 13)</td><td>9 novice (69%), 4 intermediate (31%)</td><td>8 intermediate (62%), 5 expert (38%)</td><td>t-test, p &lt; 0.001</td></tr>
<tr><td>Self-reported confidence item</td><td colspan="2">Figure 3</td><td>t-test, 99% confidence</td></tr>
<tr><td>Other six Likert items</td><td colspan="2">Figure 3; half-point gap between own confidence and perceived student ability, pre and post</td><td>t-tests, 85% to 90% confidence; overall p &lt; 0.15</td></tr>
<tr><td>Daily quizzes, two-week average</td><td>57%</td><td>88%</td><td>most days p &lt; 0.001; data encoding p &lt; 0.015</td></tr>
<tr><td>Largest topic gains</td><td colspan="2">pH +117%, structures +91%, water quality +83%</td><td></td></tr>
<tr><td>Smallest topic gain</td><td colspan="2">biomedicine +17%</td><td></td></tr>
<tr><td>Artifacts</td><td colspan="2">at least 13 lesson plans and robot programs in three themes (Table 1)</td><td>coded for repeated words and program success</td></tr>
</tbody>
</table>
</div>
</div>

## Why it matters

<div data-levels="public hs" markdown="1">
Students meet computer science through the teachers they already have, and most of those teachers never studied it. Two weeks of hands-on robots moved 13 teachers from "novice" to "intermediate" or "expert" in their own eyes and gave them lessons ready for their classrooms. Confidence is where classroom computing starts.
</div>

<div data-levels="ug grad res" markdown="1">
The study supports a design choice that the authors' later PDs on this site also use: pair computing with the content teachers already teach, and let teachers learn the tool through open-ended building rather than step-by-step instruction. Its contribution is the framing as much as the numbers. Treating computer science as both a science (theory, hierarchy, and explanation) and an art form (bricolage, invention, and construction) gives teachers permission to learn by trial and error.
</div>

<div data-levels="hs" markdown="1">
## Try it in class

1. **Program a square by hand.** Pairs of students write a program for a classmate "robot" using only *forward one step*, *turn left*, and *turn right*. Count the instructions, then rewrite the program with a loop and count again.
2. **Swap a count for a sensor.** Put a strip of tape at an unknown spot on the floor. Compare a program that walks a fixed number of steps with one that says "walk until you see the tape." Move the tape and run both again.
3. **Send a secret message.** Use the encoding demo above to turn a short message into arithmetic, trade with another pair, and decode. Discuss where else information changes form: text to binary, sound to numbers, and a robot's light reading to "dark" or "light."
</div>

<div data-levels="res" markdown="1">
## Notes from building this page

- **What the counts allow.** With no novices afterward, the before and after counts admit exactly five pairings, set by how many starting intermediates became experts. All give paired p < 0.001 on codes 1 to 3, so the reported result does not depend on the unprinted pairing.
- **Test choice for ranks.** Exact sign and signed-rank tests, which do not assume equal spacing between novice, intermediate, and expert, give p from 0.0039 to 0.00024 depending on the pairing. The direction of the finding holds; the p < 0.001 threshold holds only for k ≥ 2. These tests are the page's, not the paper's.
- **Percent increases.** The topic gains are relative to the pretest, which bounds the pretests (pH at most 46.1%). If the 57% and 88% are means of eight session averages, the four unreported sessions must make up the rest; the quiz demo shows what they must average for any choice of the four reported pretests. Whether the two-week averages weight days or teachers equally cannot be settled from the text.
- **Attribution.** Content sessions, labs, facilitators who withheld answers, and daily quizzes all changed together for one self-selected group with no comparison group. The design supports "this PD raised confidence and content scores," not a separate effect of the robots.
- **Survey reporting.** The Likert results are reported as confidence levels (85% to 90%, 99%) and an overall p < 0.15 without item values in the text; the direction of the half-point gap between teachers' own confidence and their view of student ability is not stated.
- **Future work named by the authors.** Gender, elementary versus high school differences, teacher experience versus confidence, a longitudinal follow-up, and a sharper line between computer science and programming.
</div>

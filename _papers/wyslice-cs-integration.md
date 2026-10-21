---
title: "Computer Science in Every Subject: WySLICE in Wyoming's K–8 Classrooms"
kicker: "Interactive paper · ASEE 2021 and ASEE 2024"
subtitle: "An interactive companion to Mike Borowczak, Andrea C. Borowczak, and Mason Johnson's study of a statewide professional development that taught K–8 teachers and librarians to weave computer science into the subjects they already teach."
description: "Build a three-block model that works in science, mathematics, or social studies, then follow WySLICE's design from a July 2020 week to three summers of cohorts: the checkpoints, the knowledge question, the efficacy scales, and the reach the 2024 paper reports."
share_description: "Wyoming asked every K–12 school to offer computer science. WySLICE trained teachers and librarians to build it into science, math, and social studies instead of adding a separate class. Build a model, then follow the week, the surveys, and three years of reach. Written for five reading levels."
share_text: "Wyoming asked every school to offer computer science. WySLICE taught teachers to build it into the subjects they already teach. Explore the study:"
share_image: /papers/wyslice-cs-integration/share.png
share_image_alt: "Twenty-one dots before and after a week of professional development, 17 then 20 filled, next to the title Computer Science in Every Subject."
date: 2026-10-21
topics: ["Education"]
default_level: public
level_hints:
  public: No background needed
  hs: Classroom math and a little coding
  ug: Intro programming and research methods
  grad: Education research methods and statistics
  res: Full design, data, and open questions
authors:
  - name: Mike Borowczak
    affiliation: University of Wyoming; University of Central Florida
    member: mike-borowczak
  - name: Andrea C. Borowczak
    affiliation: University of Wyoming; University of Central Florida
    member: andrea-borowczak
  - name: Mason Johnson
    affiliation: University of Wyoming
sources:
  - venue: "ASEE Virtual Annual Conference · 2021"
    title: "WySLICE - Integrating Computer Science throughout Existing K-12 Core Disciplinary Areas"
    url: https://doi.org/10.18260/1-2--38225
    access: Free to read
  - venue: "ASEE Annual Conference, NSF Grantees Poster Session · 2024"
    title: "Board 319: Integrating Computing Throughout K-12 While Bridging the Digital Divide"
    url: https://doi.org/10.18260/1-2--46898
    access: Free to read
citations:
  - asee-NSFWySLICE
  - asee_peer2024
widget:
  css:
    - /papers/wyslice-cs-integration/widget.css
  js:
    - /papers/wyslice-cs-integration/ws-engine.js
    - /papers/wyslice-cs-integration/widget.js
credit: "Interactive page by the [DRACO Lab](/). Every number about WySLICE and WySTACK comes from the text of the two papers; the page checks each printed percentage against the whole counts that could produce it (17 and 20 of 21 give the printed 81% and 95%; no count of 24 does). The model, the Wilson intervals, the exact McNemar test, and the t threshold are computed by this page and match SciPy and statsmodels on 11,641 cases. Everything runs on your device."
bibtex: |
  @inproceedings{borowczak2021wyslice,
    author    = {Borowczak, Mike and Borowczak, Andrea C. and Johnson, Mason},
    title     = {{WySLICE} - Integrating Computer Science throughout Existing {K-12} Core Disciplinary Areas},
    booktitle = {2021 ASEE Virtual Annual Conference Content Access},
    year      = {2021},
    doi       = {10.18260/1-2--38225}
  }

  @inproceedings{borowczak2024integrating,
    author    = {Borowczak, Mike and Borowczak, Andrea C.},
    title     = {Board 319: Integrating Computing Throughout {K-12} While Bridging the Digital Divide},
    booktitle = {2024 ASEE Annual Conference \& Exposition},
    address   = {Portland, Oregon},
    year      = {2024},
    doi       = {10.18260/1-2--46898}
  }
---

<div class="lede" data-levels="public" markdown="1">
Wyoming requires every K–12 school to offer computer science by 2022. Most elementary and middle school teachers never studied it, and a separate coding class is hard to staff in a small rural school. WySLICE, a project funded by the National Science Foundation, took another route: it trained teachers and school librarians to build computer science into the subjects they already teach, from science and mathematics to social studies. This page lets you try the central idea, then follows the first week of training, what changed for the teachers, and how far the project reached in three years.
</div>

<div class="lede" data-levels="hs" markdown="1">
Computer science is the study of solving problems with step-by-step instructions, or algorithms, that a person or a computer can follow. WySLICE asked K–8 teachers and librarians to teach those ideas inside their own lessons. In July 2020, 24 educators (17 classroom teachers and seven librarians) spent a week learning the approach, then spent the school year using it. The 2021 paper reports what that first group knew and believed before and after the week; the 2024 paper reports three years of the project together with a second one, WySTACK, for high school teachers. Below, you can write a tiny program that models change in three subjects, then explore the study.
</div>

<div class="lede" data-levels="ug" markdown="1">
WySLICE is a research–practice partnership funded by NSF DRL 1923542 (CS for All with EPSCoR): the University of Wyoming, community colleges, school districts, the Wyoming State Library, the state Department of Education, and software companies, organized as a networked improvement community. Its framework adapts six guidelines from Sengupta, Dickes, and Farris (2018), starting with reframing coding as modeling. The 2021 paper reports the first cohort's five-day professional development (July 6 to 10, 2020) with a pre/post efficacy instrument, one knowledge question, and a focus group. The 2024 poster paper places it in three phases (assessment, the week, a year of implementation) and three summers of cohorts, and reports reach alongside WySTACK, a virtual research experience for high school teachers.
</div>

<div class="lede" data-levels="grad" markdown="1">
A mixed-methods study of integrated computer science professional development for K–8 educators (2020 cohort N = 24; 21 with paired surveys). Quantitative measures: the 25-item Science Teaching Efficacy Belief Instrument (STEBI; Riggs and Enochs, 1990) reworded for computer science, with a 13-item personal efficacy scale (α = .91) and a 12-item outcome expectancy scale (α = .77), compared with a paired-samples t-test; and one multiple-choice knowledge item. Qualitative data: a focus group of six. The 2024 paper adds external-evaluation summaries across three cohorts and the WySTACK program. The papers state significance without printing statistics; this page derives what the printed numbers allow and labels its own computations.
</div>

<div class="lede" data-levels="res" markdown="1">
Borowczak, Burrows, and Johnson (ASEE 2021) describe the design and first-year results of WySLICE, an NSF CS for All research–practice partnership for integrating computer science into K–8 core disciplines, with four research questions: changes in teachers' perceptions of computer science (RQ1), baseline and change in content knowledge (RQ2), how teachers and librarians across content areas use the integrated approach (RQ3), and how endorsements and microcredentials sustain it (RQ4). The 2021 paper answers RQ1 and RQ2 for the 2020 cohort. Borowczak and Borowczak (ASEE 2024) summarize three years of WySLICE and WySTACK (NSF CNS 2055621) from external evaluations. Neither paper prints means, standard deviations, or test statistics; the notes at the end list what the printed values imply and where they disagree.
</div>

## The idea: coding as modeling

<div id="ws-model" class="w-demo"></div>

<div data-levels="public" markdown="1">
The program has three steps: start somewhere, repeat, and change by a rule. Pick a subject and move the sliders. A bean plant that grows a little each day, a class savings jar that gains the same amount each week, and a town that grows by a percent each year all run on the same three steps. WySLICE's first guideline asks teachers to treat code this way, as a model of something students already study.
</div>

<div data-levels="hs" markdown="1">
A model is a simplified description of how something changes. Switch the rule between **Add the same amount** and **Grow by a percent**: the first draws a straight line, and the second bends upward, because each step adds a share of a larger number. Students can collect real measurements (a plant's height each morning) and check which rule fits better, which is science, mathematics, and computer science in one lesson.
</div>

<div data-levels="ug" markdown="1">
The block program and the loop below it are the same algorithm: an initial value, a counted loop, and an update x ← x + a (linear) or x ← x(1 + r) (geometric). The 2021 paper's first guideline reframes coding as modeling, giving "mathematical units of measurement of change over time" as the example; the other five call for trans-disciplinary practice, embodied modeling with non-computational materials, disciplinary norms, authentic audiences, and both visual and text-based languages. The demo is this page's illustration of that guideline; the papers do not print a specific lesson.
</div>

<div data-levels="grad res" markdown="1">
The approach is the context, and the study is the subject. The demo appears because the integrated approach depends on teachers seeing one computational idea serve several disciplines, which is what the efficacy instrument and the knowledge item try to capture. Sengupta, Dickes, and Farris (2018) argue for modeling as the bridge between computing and disciplinary learning; the 2021 paper adopts their six guidelines and argues that integration suits rural Wyoming better than stand-alone courses.
</div>

## The design: a week, then a year

<div id="ws-design" class="w-demo"></div>

<div data-levels="public" markdown="1">
WySLICE ran in three phases: find out what teachers already know, spend a week together learning the approach, then support teachers for a full school year while they use it. Pick a phase to see what happened in it. The first week, in July 2020, moved from "What is computer science?" on Monday to building a lesson plan on Friday. Cohorts doubled each summer, from 20 educators to 40 to 80.
</div>

<div data-levels="hs" markdown="1">
A survey before and after the week shows what changed during it, and a focus group, a small guided discussion, shows why. The 2020 group produced over 49 lesson plans and 30 implementation plans, which describe how a teacher will run a lesson with a particular class. Master teachers, experienced teachers who coach others, supported the group through the year, and state libraries were to carry the lessons to rural communities.
</div>

<div data-levels="ug" markdown="1">
Phase A (preliminary assessment and scaffolding), Phase B (a week-long professional development on "effective integration of CS in X"), and Phase C (year-long implementation and support) come from the 2024 paper; the days, surveys, focus group, and plan counts come from the 2021 paper. The page places the 2021 pre-survey in Phase A and the post-survey at the end of Phase B, matching the before-and-after timing of the 2021 surveys. The focus group drew eight of 17 volunteers at random, and six took part (three teachers, two librarians, and one master teacher).
</div>

<div data-levels="grad res" markdown="1">
The design is a classic professional development arc (baseline, intensive institute, sustained support) embedded in a networked improvement community that meets monthly, so the research questions span the week (RQ1, RQ2) and the year after it (RQ3, RQ4). The 2021 paper measures only the week. Its 24 participants also differ from the 2024 paper's first cohort of 20, and the three cohorts total 140 against a reported reach of over 150; the papers do not say how the counts relate.
</div>

## One question: what is computer science?

<div id="ws-knowledge" class="w-demo"></div>

<div data-levels="public" markdown="1">
Before and after the week, educators answered one question: which description fits computer science best? The right answer was about problem solving. Each dot is one educator; filled dots chose the right answer. Seventeen of 21 were right before and 20 of 21 after. Tap **Wrong, then right** to see the four people who changed their answer.
</div>

<div data-levels="hs" markdown="1">
Seventeen of 21 is 81%, and 20 of 21 is 95%, the two shares the paper prints. The paper also says all four people who started wrong finished right. If that were the whole story, 21 would be right afterward, so one person must have gone the other way. Small groups make every person count: each educator here is almost five percentage points.
</div>

<div data-levels="ug" markdown="1">
The paper asked four knowledge questions and reports one. Switch to **Out of 24**: neither printed share matches any count out of all 24 participants, so the percentages use the 21 educators who completed both surveys. The three printed statements (17 before, 20 after, all four early misses corrected) fix the whole two-by-two table: 16 right both times, four gains, and one loss.
</div>

<div data-levels="grad res" markdown="1">
Paired binary outcomes call for McNemar's test, which uses only the discordant pairs. With four gains and one loss, the exact two-sided p is 0.375, and even five gains with no loss would give p ≈ 0.06. The item started at 81% correct, so it had little room to move. The paper reports the shares descriptively and draws no inferential claim from this item; the 2024 summary calls the content knowledge results across cohorts "mixed."
</div>

## The instrument: two summed scales

<div id="ws-scale" class="w-demo"></div>

<div data-levels="public" markdown="1">
To measure confidence, educators rated 25 statements from "strongly disagree" to "strongly agree." Thirteen ask how well the educator can teach computer science; 12 ask whether teachers can change how much students learn. Tap the numbered items to answer like a teacher would, and watch the score move. The paper reports that both scores rose significantly during the week.
</div>

<div data-levels="hs" markdown="1">
Each answer counts one to five points, so 13 items give a score between 13 and 65, and 12 items give a score between 12 and 60. Adding many items smooths out one confusing question. The reported α (alpha) values, 0.91 and 0.77, measure how consistently the items in each scale agree with each other; values near one mean the items move together.
</div>

<div data-levels="ug" markdown="1">
The instrument is the STEBI (Riggs and Enochs, 1990) with "science" replaced by "computer science": personal teaching efficacy (PSTE, 13 items) and outcome expectancy (STOE, 12 items), scored on a five-point scale and summed so that higher scores mean higher efficacy. The paper compares pre and post sums for the 21 paired educators with a paired-samples t-test and reports significant gains on both scales, without printing the means, standard deviations, or t values.
</div>

<div data-levels="grad res" markdown="1">
With 21 pairs, significance at α = .05 requires |t| ≥ 2.086 on 20 degrees of freedom, so a gain is significant when it exceeds 2.086 × SD / √21, about 0.46 standard deviations of the change scores. The slider shows that threshold in scale points for any assumed spread; at an SD of six points the threshold is 2.73 points on a 13-to-65 scale. This page computes the threshold; the paper does not report it. Original STEBI scoring reverse-codes negatively worded items, and the paper does not say whether the CS version did.
</div>

## Three years of reach

<div id="ws-reach" class="w-demo"></div>

<div data-levels="public" markdown="1">
By 2024, WySLICE had reached over 150 teachers and state librarians. Together with WySTACK, a virtual research experience that paired high school teachers with university computer science faculty, the work reached over 190 educators, produced over 300 activities that join computing with another subject, and reached nearly 8,000 students over 600 days of teaching. Switch to **WySTACK teachers** to see how its 36 teachers rated the program.
</div>

<div data-levels="hs" markdown="1">
WySTACK took 12 high school teachers a year for three years. They answered 89% of the computer science knowledge questions correctly and rated the program 3.8 out of four as a good use of their time. Every participant built computing into their lessons, in subjects from astronomy to phonics.
</div>

<div data-levels="ug grad res" markdown="1">
The 2024 figures come from external evaluations by the University of Cincinnati and are printed as floors ("over 190", "nearly eight thousand") without per-cohort breakdowns. WySTACK's results (89% accuracy on knowledge items, five of seven perception items up from pre to follow-up, and mean ratings of 3.8, 3.2, and 3.1 on a four-point scale for the training, faculty mentors, and graduate assistants) are descriptive. For WySLICE, the evaluation summary reports mixed content knowledge results, with some items declining on follow-up, and a significant gain in self-efficacy by the end of the five-day week.
</div>

## What the papers found

<div data-levels="public" markdown="1">
- After one week, almost every educator described computer science as problem solving, up from about four in five.
- Educators felt more able to teach computer science and more sure that teachers can change what students learn.
- Librarians began to see themselves as the computer science leaders in their schools.
- Teachers saw that computer science fits inside reading, math, and social studies, even without computers.
- Over three years, the work reached over 190 educators and nearly 8,000 students.
</div>

<div data-levels="hs" markdown="1">
- The share choosing the problem-solving definition of computer science rose from 81% (17 of 21) to 95% (20 of 21).
- Both confidence scores rose significantly during the week.
- The 2020 group wrote over 49 lesson plans and 30 implementation plans.
- In the focus group, teachers planned to share what they learned, for example with unplugged activities at holiday parties.
- WySTACK teachers answered 89% of knowledge questions correctly and rated the program 3.8 of four.
</div>

<div data-levels="ug grad res" markdown="1">
- **Knowledge rose on the one item reported.** 81% (17 of 21) to 95% (20 of 21); all four early misses were corrected.
- **Efficacy rose.** Significant pre-to-post gains on personal efficacy (PSTE) and outcome expectancy (STOE), by paired t-test, n = 21.
- **Teachers saw computing beyond coding.** Focus group themes: integration strategies, sharing with colleagues, librarians as instructional leaders, computer science as problem solving and "outside the box" thinking, and integration into reading, mathematics, and social studies without computers.
- **Support mattered.** Participants valued the professional development, the lesson plan bank, and access to trainers, and still wanted to keep building their skills.
- **Reach grew.** Over 150 WySLICE educators; with WySTACK, over 190 educators, over 300 activities, and nearly 8,000 students.
</div>

<div data-levels="grad res" markdown="1">
<div class="ws-study-wrap">
<table class="results-table">
<caption class="w-note">Reported results and what the page derives from them.</caption>
<thead><tr><th>Result (source)</th><th>n</th><th>Printed</th><th>Derived by the page</th></tr></thead>
<tbody>
<tr><td>Knowledge item, before (2021)</td><td>21</td><td>81% (n = 17)</td><td>80.95%; Wilson 95% CI 60% to 92%</td></tr>
<tr><td>Knowledge item, after (2021)</td><td>21</td><td>95% (n = 20)</td><td>95.24%; Wilson 95% CI 77% to 99%</td></tr>
<tr><td>Changes on the item (2021)</td><td>21</td><td>Four wrong before, all right after</td><td>Four gains, one loss; exact McNemar p = 0.375</td></tr>
<tr><td>PSTE, 13 items (2021)</td><td>21</td><td>α = .91; significant gain</td><td>Range 13 to 65</td></tr>
<tr><td>STOE, 12 items (2021)</td><td>21</td><td>α = .77; significant gain</td><td>Range 12 to 60</td></tr>
<tr><td>Paired t threshold (page)</td><td>21</td><td>Not printed</td><td>|t| ≥ 2.086, df = 20</td></tr>
<tr><td>WySLICE cohorts (2024)</td><td>20, 40, 80</td><td>Over 150 reached</td><td>Sum of cohorts 140</td></tr>
<tr><td>WySTACK (2024)</td><td>36</td><td>12 a year; 89% knowledge; 5 of 7 items up</td><td>12 × 3 = 36</td></tr>
</tbody>
</table>
</div>
</div>

## Why it matters

<div data-levels="public hs" markdown="1">
A state can require computer science, but teachers deliver it. WySLICE shows one way to make a statewide requirement workable in rural schools: teach computing as a way of thinking that fits inside lessons teachers already know, and give them a year of support instead of a single workshop. Ultimately, librarians and classroom teachers became the people who carry computer science into their communities.
</div>

<div data-levels="ug" markdown="1">
Integration spreads computer science across every class a student takes instead of concentrating it in one elective, and it builds on teachers' existing expertise. The project pairs that approach with a partnership of universities, libraries, districts, and industry, creating a sustainable and mutually beneficial structure that a single school could not build on its own.
</div>

<div data-levels="grad res" markdown="1">
The 2021 paper documents a design and a first cohort; its evidence for change is a significant efficacy gain, one knowledge item, and a small focus group. Those results support the authors' description of a promising start, and the design (networked improvement community, phased support, librarian partners) is the transferable contribution. Effect sizes, the remaining knowledge items, and the classroom-use data the project collected (lesson plans, recordings, rubric scores, and student assessments) are where stronger claims would come from.
</div>

<div data-levels="res" markdown="1">
## Notes from building this page

- **A fifth change on the knowledge item.** The 2021 paper reports 17 of 21 correct before, 20 of 21 after, and that "all four participants who made an incorrect selection in the pre-survey made the correct selection in the post-survey." Those statements together require one educator who answered correctly before and incorrectly after, which the text does not mention.
- **Denominator.** The printed 81% and 95% match 17 and 20 out of 21 and match no count out of 24, so the knowledge shares use the paired sample, as the efficacy analysis does.
- **Efficacy statistics.** The paper reports significant improvement on both scales without means, standard deviations, t, df, p, or effect sizes; the threshold shown in the instrument demo is the page's own and states only what n = 21 requires.
- **Reverse coding.** The original STEBI reverse-scores negatively worded items. The paper describes summed scores where higher means more efficacy and does not mention reverse coding.
- **Four knowledge questions, one reported.** The paper says four questions were designed and analyzes one without giving a reason.
- **Focus group.** The text says eight participants were selected at random and then lists six attendees.
- **"Over 49" lesson plans.** The phrase reads like a floor on a count that was still growing; 50 or more may be meant.
- **Cohort sizes.** The 2024 paper gives cohorts of 20, 40, and 80 (total 140) and a reach of over 150; the 2021 paper reports 24 participants in the first week. The difference may come from librarians, administrators, or later additions, which the papers do not separate.
- **Phases and checkpoints.** The page places the 2021 pre-survey in the 2024 paper's Phase A and the post-survey at the end of Phase B; the 2024 paper names the phases without listing their instruments.
- **Bibliography.** The site's `proceedings.bib` lists the 2021 paper without Mason Johnson and without DOIs; this pull request adds the third author and both DOIs.
- **Byline.** The 2021 record lists Andrea C. Borowczak as Andrea Carneal Burrows; this page uses the name she prefers.
</div>

<div data-levels="hs" markdown="1">
## Try this in class

1. Plant three bean seeds and measure each one's height every school day for two weeks, recording the numbers in a table.
2. Write a three-step program (start, repeat, change) for each rule in the model above, and pick the rule and amount that best match your measurements.
3. Write two sentences on where the model and the real plants disagree, and one change to the rule that would fit better.
</div>

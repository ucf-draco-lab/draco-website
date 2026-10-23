---
title: "From Workshop to Lesson Plan: Grading 46 Plans After a Cybersecurity PD"
kicker: "Interactive paper · ASEE 2022"
subtitle: "An interactive companion to Andey Robins, Andrea C. Borowczak, and Mike Borowczak's study of two summer professional developments for Wyoming teachers and the lesson plans those teachers then wrote and taught."
description: "Sort the 46 lesson plans an outside reviewer rated after two week-long teacher workshops on computer science and cybersecurity, walk the study's steps from new state standards to classrooms, and see which parts of a plan teachers found hardest."
share_description: "Forty-two Wyoming teachers took a week of computer science and cybersecurity training, then wrote lessons taught to more than 1,500 students. An outside reviewer rated 46 plans on six parts. Sort them, follow the study, and see where plans struggled. Written for five reading levels."
share_text: "Forty-two teachers, two summer workshops, and 46 lesson plans rated part by part. See where cybersecurity lessons came out strong and where they struggled:"
share_image: /papers/cyber-pd-lesson-plans/share.png
share_image_alt: "Six stacked bars, one per rubric component, splitting 46 lesson plans into struggling, emerging, and excellent; organization has only two excellent plans. Beside them, the title From Workshop to Lesson Plan."
date: 2026-10-21
topics: ["Education"]
default_level: public
level_hints:
  public: No background needed
  hs: Percentages and a little averaging
  ug: Intro research methods
  grad: Education research methods and statistics
  res: Full design, data, and open questions
authors:
  - name: Andey Robins
    affiliation: University of Wyoming
    link: http://portfolio.andeyrobins.org/
  - name: Andrea C. Borowczak
    affiliation: University of Wyoming
    member: andrea-borowczak
  - name: Mike Borowczak
    affiliation: University of Wyoming
    member: mike-borowczak
sources:
  - venue: "ASEE Annual Conference & Exposition · Minneapolis, MN · 2022"
    title: "On the Development of Cybersecurity and Computing Centric Professional Developments and the Subsequent Implementation of Topics in K12 Lesson Plans (RTP)"
    url: https://doi.org/10.18260/1-2--41203
    access: Free to read
citations:
  - asee_peer_41203
widget:
  css:
    - /papers/cyber-pd-lesson-plans/widget.css
  js:
    - /papers/cyber-pd-lesson-plans/lp-engine.js
    - /papers/cyber-pd-lesson-plans/widget.js
credit: "Interactive page by the [DRACO Lab](/). Every number about the study comes from the paper's text and figures. The page reads the 18 bar labels of Figure 4 as one table of whole counts (46 plans per component) and checks it against all 12 numbers the paper prints: it reproduces Figure 3's 19.6%, 32.6%, and 47.8% and the abstract's seven component shares. Averages, alternative readings, and Wilson intervals are computed by this page and match an independent Python implementation (statsmodels) on 1,890 cases. Everything runs on your device."
bibtex: |
  @inproceedings{robins2022cyberpd,
    author    = {Robins, Andey and Borowczak, Andrea C. and Borowczak, Mike},
    title     = {On the Development of Cybersecurity and Computing Centric Professional Developments and the Subsequent Implementation of Topics in {K12} Lesson Plans ({RTP})},
    booktitle = {2022 ASEE Annual Conference \& Exposition},
    address   = {Minneapolis, MN},
    year      = {2022},
    publisher = {ASEE Conferences},
    doi       = {10.18260/1-2--41203}
  }
---

<div class="lede" data-levels="public" markdown="1">
In January 2022, Wyoming adopted computer science standards for every grade, and the state required every school district to offer computer science by the 2022–23 school year. Many of the teachers who would teach it had few resources for it, and no ready-made curriculum matched the new standards. Over two summers, the University of Wyoming ran week-long workshops, called professional developments (PDs), for 42 teachers, focused on computer science and cybersecurity. The teachers then wrote lessons for their own classes, taught more than 40 of them to more than 1,500 students, and handed in their plans. An outside reviewer graded each plan on six parts. This page lets you sort those plans, follow the study from start to finish, and see which parts came out strong.
</div>

<div class="lede" data-levels="hs" markdown="1">
Cybersecurity is the work of keeping information private, correct, and available to the right people. Andey Robins, Andrea C. Borowczak, and Mike Borowczak studied what happened after two week-long summer workshops for Wyoming teachers: the first (14 teachers) on hands-on cybersecurity, the second (28 teachers) on fitting computer science into the subjects teachers already teach. An outside expert rated each lesson plan the teachers turned in as **struggling**, **emerging**, or **excellent**, on six parts: organization, objectives, integration, activities, question strength, and the plan overall. Below, you can sort the 46 rated plans, step through how the study ran, and compare the six parts.
</div>

<div class="lede" data-levels="ug" markdown="1">
The paper asks three research questions (RQs): to what extent teachers integrated computing and cybersecurity into their lesson plans (RQ1), how teacher perceptions compared between the two PDs (RQ2), and how teachers translated the PD into classroom activities (RQ3). Data came from daily pre- and post-surveys during each PD, teacher reports on each lesson they taught, open-ended reflections, and an external expert's three-level rating of every submitted plan on six components. Analysis is descriptive: shares, averages, and grouped quotes. The page rebuilds Figures 3, 4, and 5 from the counts the paper prints and checks every printed share against them.
</div>

<div class="lede" data-levels="grad" markdown="1">
A descriptive, mixed-methods evaluation of two week-long, constructivist teacher PDs (n = 14 and n = 28) delivered as Wyoming's K–12 computer science standards took effect. The outcome measure is an external expert's three-level rubric rating (struggling 0, emerging 1, excellent 2) of each submitted lesson plan on six components; the paper reports the ratings as counts (Figure 4), shares (Figure 3 and the abstract), and component averages (Figure 5), without tests. Qualitative data are teacher reflections grouped by cohort (RQ2) and teacher-reported evidence of classroom outcomes (RQ3). At the graduate and researcher levels the page adds interval estimates and a sensitivity check on the scoring rule, both labeled as its own.
</div>

<div class="lede" data-levels="res" markdown="1">
Robins, Borowczak, and Borowczak (ASEE 2022, research-to-practice track) evaluate NSF- and NSA-funded teacher PDs at the University of Wyoming by the quality of the lesson plans teachers produced. The paper prints its ratings only as Figure 4 bar labels and seven shares in the abstract; the page reads the 18 labels as one 6 × 3 table (46 plans per component), shows that the table reproduces all 12 printed numbers, and identifies the three other tables that also fit. Notes from building the page, including the table's ambiguities and the cohort pairing, close the researcher level.
</div>

## Forty-six plans, six questions

<div id="lp-plans" class="w-demo"></div>

<div data-levels="public" markdown="1">
Each square is one lesson plan a teacher wrote after the workshop. Pick a part of the plan, and the squares sort into excellent (filled), emerging (shaded), and struggling (outlined). Overall, nearly half the plans earned excellent. Now pick **Organization**: only two plans earned excellent there. A plan can have a strong idea and still be hard to follow, and the reviewer graded those two things separately.
</div>

<div data-levels="hs" markdown="1">
The three levels have plain meanings. **Struggling** means the topic is hard to convey through the lesson as written; **emerging** means the topic is present but needs more; **excellent** means the lesson demonstrates the topic clearly. Switch between parts and watch the counts: objectives earned excellent 22 times, organization twice. Integration, meaning how well computer science was woven into the subject, split almost evenly between excellent (20) and struggling (21), with only five in between.
</div>

<div data-levels="ug" markdown="1">
Figure 3 of the paper reports the overall split (19.6%, 32.6%, and 47.8%), and Figure 4 reports counts for each component. Those three shares fit 46 plans exactly (nine, 15, and 22), and 46 is the smallest plan count that produces all three. Every component's counts also add to 46, which fixes the number of rated plans that the abstract describes as "40+."
</div>

<div data-levels="grad res" markdown="1">
Ratings come from one external subject expert applying a three-level rubric through a constructivist lens. With one rater, the paper reports no reliability estimate, and the rubric's level descriptors are short (one sentence each). The marginal counts per component are all the paper reports; the joint distribution (which plans were weak on organization and also on integration) would answer whether the components measure distinct skills.
</div>

## Two summers, one study

<div id="lp-design" class="w-demo"></div>

<div data-levels="public" markdown="1">
Step through the study in order: new state standards, two summer workshops, lesson plans, classrooms, and the teachers' own reflections. Then compare the two summers. In the first, teachers worked at their own pace and found the content a lot to take in; one compared it to "drinking from a fire hydrant." The team gave the second summer a fixed daily schedule and started with the basics, and teachers' concerns moved from what each day expected of them to how to teach the material.
</div>

<div data-levels="hs" markdown="1">
Each step lists what the researchers measured. Notice that the study measures in several places: surveys during the workshop, the plans themselves, reports on the lessons as taught, and reflections afterward. Both summers ran during the COVID-19 pandemic, so teachers were learning a new subject while also moving their classes online, and some lessons had to work around broken WiFi and too few Micro:Bits (small programmable circuit boards).
</div>

<div data-levels="ug" markdown="1">
The design pairs a PD with three checkpoints after it: the plan (RQ1), the teacher's reflection (RQ2), and the teacher's evidence that the lesson worked (RQ3). Between the two years, the team changed the structure of the PD (from self-paced with suggested daily activities to a rigid learning-management-system schedule) while keeping most resources (videos, activities, and handouts) the same, so the authors attribute the improved perceptions in the second year mainly to that structure.
</div>

<div data-levels="grad res" markdown="1">
The two PDs differ in focus (cybersecurity, then integration into existing curricula), size (14, then 28), and structure at once, and the study has no comparison group, so cohort differences cannot be assigned to any one change. The paper treats the perceptions qualitatively and does not report the daily pre- and post-survey results, so the page shows no knowledge-gain figures. The classroom checkpoint rests on self-report, a limitation the authors state.
</div>

## Where plans were strong, and where they struggled

<div id="lp-components" class="w-demo"></div>

<div data-levels="public" markdown="1">
This chart puts all six parts side by side. The longer the filled section, the more plans earned excellent. Objectives and activities did well, and the authors connect that to how the workshop spent its time: on hands-on cybersecurity activities and clear learning goals. Organization did worst. Switch to **Averages** to see each part as one number, from 0 (struggling) to 2 (excellent).
</div>

<div data-levels="hs" markdown="1">
To average ratings, the paper turns words into numbers: struggling counts 0, emerging 1, and excellent 2. Organization averages 0.59, below emerging. Objectives averages 1.22, and the overall rating 1.28. The averages hide a story the counts tell: integration (0.98) looks middling, yet almost every plan was either excellent or struggling at it.
</div>

<div data-levels="ug" markdown="1">
**Printed numbers** lists every figure the paper gives for the ratings and the count behind each. All 12 follow from the same table. One detail shows how the abstract was written: organization and integration each had 21 struggling plans of 46 (45.65%), and the abstract prints 45% for the first and 46% for the second. The authors read the polarization in integration as a call for more explicit instruction on how to integrate, and the weak organization scores as a call to teach lesson organization in future PDs.
</div>

<div data-levels="grad res" markdown="1">
The abstract maps its four "excellent" shares to "interesting integration, objectives, activities & assessment, and catch" (43%, 48%, 43%, and 48%). Read against the table, "catch" corresponds to the overall rating (22 of 46), which Figure 5 labels "Review" and the Methods call "overall." The overall rating averages 1.28 while the five component ratings average 0.96, so the reviewer's holistic judgment ran above the parts; the paper does not report how the overall rating was formed.
</div>

<div data-levels="grad res" markdown="1">
## How firm is the ranking?

<div id="lp-weights" class="w-demo" data-levels="grad res"></div>

The paper's averages score emerging as exactly halfway between struggling and excellent. Move the weight to test that choice. For every weight from 0 to 2 and for every table that fits the printed numbers, organization ranks last (tied with integration at a weight of 2), and objectives ranks first except in the two readings that swap activities' struggling and emerging counts, once emerging is worth more than one point. Most 95% Wilson intervals at n = 46 run 25 to 30 percentage points wide, so the middle of the ranking (activities, integration, and question strength) is not separable at this sample size. All of this section is computed by the page.
</div>

## Into the classroom

<div data-levels="public hs" markdown="1">
Teachers taught their lessons mostly in sixth and seventh grade, mostly in classes set aside for computer science and computational thinking, and to an almost even mix of girls (50.3%) and boys (49.7%). Teachers could teach the cybersecurity content and talk about it well. The harder step was connecting it to the world outside class, such as careers and news, even though the workshop had paired ransomware with a real attack on a fuel pipeline that was in the news at the time. The strongest lessons joined mathematics and computer science.
</div>

<div data-levels="ug grad res" markdown="1">
RQ3 asked how the PD became classroom activity. Teachers reproduced content and discussed it at a higher level, and the impact and outcomes of cybersecurity learning were consistently weak: teachers struggled to connect topics to society and careers on their own, though the PD had tied ransomware to the Colonial Pipeline attack. Most lessons put cybersecurity, computer science, or computational thinking at the center; some treated the computer science standards as secondary to other goals. Excellent plans were usually tied closely to specific standards, and many came from mathematics classrooms, which leaves open whether the mathematics–computing link or something else drove their quality.
</div>

## What the paper found

<div data-levels="public" markdown="1">
- Nearly half the lesson plans (22 of 46) earned excellent overall, and fewer than one in five (nine) struggled.
- Plans were strongest on their goals (objectives) and activities, the two things the workshop spent the most time on.
- Organization was the weakest part: only two plans earned excellent.
- Teachers either wove computer science into their subject well or struggled to; few landed in between.
- Teachers found the second summer's fixed daily schedule more approachable than the first summer's self-paced format.
- Teachers found it hard to connect cybersecurity to careers and current events on their own.
</div>

<div data-levels="hs" markdown="1">
- Overall ratings: 19.6% struggling, 32.6% emerging, and 47.8% excellent (nine, 15, and 22 of 46 plans).
- Objectives earned excellent in 22 plans; activities in 20; organization in two.
- Integration: 20 excellent, five emerging, and 21 struggling.
- The lessons reached more than 1,500 students, mostly in sixth and seventh grade.
- First-year concerns were about procedure; second-year concerns were about content and teaching it.
- Students and teachers met real classroom problems: COVID-19, WiFi outages, and too few devices.
</div>

<div data-levels="ug grad res" markdown="1">
- **Integration varied widely (RQ1).** Overall ratings split 19.6% struggling, 32.6% emerging, and 47.8% excellent; integration itself polarized at 21, five, and 20 of 46.
- **The PD's emphases showed up in the plans.** Objectives (22 excellent) and activities (20) led; the authors link both to the PD's time on hands-on activities and objectives.
- **Organization lagged.** Two of 46 plans earned excellent on organization, the basis for the authors' recommendation to teach lesson organization explicitly.
- **Structure improved perceptions (RQ2).** The self-paced first year drew procedural concerns; the scheduled second year drew content concerns, with resources largely unchanged.
- **Translation stopped short of context (RQ3).** Teachers reproduced and discussed content but rarely connected it to society and careers.
- **Mathematics lessons stood out.** Many excellent plans came from mathematics classrooms and tied closely to specific standards.
</div>

<div data-levels="grad res" markdown="1">
<div class="lp-study-wrap">
<table class="results-table">
<caption class="w-note">Ratings by component as read from Figure 4 (46 plans each), with the page's averages (0, 1, 2 scoring, as in Figure 5) and 95% Wilson intervals. Intervals are computed by the page.</caption>
<thead><tr><th>Component</th><th>Struggling</th><th>Emerging</th><th>Excellent</th><th>Average</th><th>Excellent, 95% interval</th><th>Printed in the paper</th></tr></thead>
<tbody>
<tr><td>Organization</td><td>21</td><td>23</td><td>2</td><td>0.59</td><td>1% to 15%</td><td>Struggling 45%; two excellent</td></tr>
<tr><td>Objectives</td><td>12</td><td>12</td><td>22</td><td>1.22</td><td>34% to 62%</td><td>Excellent 48%</td></tr>
<tr><td>Integration</td><td>21</td><td>5</td><td>20</td><td>0.98</td><td>30% to 58%</td><td>Struggling 46%; excellent 43%; five emerging</td></tr>
<tr><td>Activities</td><td>16</td><td>10</td><td>20</td><td>1.09</td><td>30% to 58%</td><td>Excellent 43%</td></tr>
<tr><td>Question strength</td><td>19</td><td>12</td><td>15</td><td>0.91</td><td>21% to 47%</td><td>Struggling 41%</td></tr>
<tr><td>Overall ("Review," "catch")</td><td>9</td><td>15</td><td>22</td><td>1.28</td><td>34% to 62%</td><td>19.6%, 32.6%, 47.8%; excellent 48%</td></tr>
</tbody>
</table>
</div>
</div>

## Why it matters

<div data-levels="public hs" markdown="1">
When a state asks every school to teach computer science, a one-week workshop is often the main help teachers get. This study checks that help by looking at what teachers produced afterward, not only at whether they enjoyed the week. The plans show exactly where the next workshop should spend its time: how to organize a lesson, how to weave computing into a subject, and how to connect cybersecurity to students' lives and future jobs.
</div>

<div data-levels="ug" markdown="1">
Satisfaction surveys and content quizzes show what teachers thought of a PD and what they recalled. Rating the artifact teachers produce, component by component, turns an evaluation into a design tool: each weak component maps to a change the facilitators can make. The year-two restructuring shows that loop working on the PD's format, and the component ratings point to its content next.
</div>

<div data-levels="grad res" markdown="1">
The study contributes a practical evaluation pattern for short-format computing PDs (artifact ratings by component, cohort reflections, and teacher-reported classroom evidence) at the moment a state mandate created demand. Its evidence is descriptive, from one rater and two cohorts that differ in several ways at once; the authors' stated next steps (validated instruments, objective classroom data, analysis at the level of individual standards) are where effect estimates belong.
</div>

<div data-levels="res" markdown="1">
## Notes from building this page

- **Reading Figure 4.** The figure's 18 bar labels, read in the order the text extraction returns them, as three series of six (excellent, then emerging, then struggling, each across organization, objectives, integration, activities, question strength, and overall), give a table in which every component sums to 46 and all 12 printed numbers match. Among all 2,592 ways to place the 18 labels so that each component sums to 46 and the text's counts (two excellent organization plans, five emerging integration plans, and Figure 3's nine, 15, and 22) hold, four also match the abstract. They differ only in whether activities is 16 struggling and 10 emerging or the reverse, and whether question strength is 12 emerging and 15 excellent or the reverse. The page uses that reading and offers the other three in the ranking demo.
- **Plan count.** The abstract says "40+" lessons; Figure 3's three shares fit no plan count under 92 except 46, and every component in Figure 4 sums to 46.
- **Rounding.** Organization and integration both have 21 struggling plans (45.65%); the abstract prints 45% and 46%. Every other share rounds correctly.
- **Component names.** The abstract lists organization, objectives, integration, activities & assessment, questions, and "catch"; the Methods list organization, objectives, integration, activities, question strength, and overall; Figure 5 labels the last bar "Review." The page reads "catch" and "Review" as the overall rating, the only component with 22 excellent plans besides objectives.
- **Who rated the plans.** The abstract says the research team evaluated the lessons; Section 3.4.1 says an external subject expert did. No inter-rater reliability is reported.
- **Cohort pairing.** The abstract describes the first PD (n = 14, cybersecurity) and the second (n = 28, integration); Section 4.2 describes the first cohort (Summer 2020) and the second summer. The page pairs them in order. The Colonial Pipeline attack the PD discussed alongside ransomware took place in May 2021, which places cybersecurity content in the second summer as well.
- **Missing results.** The daily pre- and post-surveys are described in the Methods, and their results are not reported; Figures 1 and 2 (students by grade, class types) print no values the page can recover.
- **The page's statistics.** Averages under other emerging weights, the alternative tables, and Wilson intervals are computed by this page. The intervals treat each component's ratings as 46 independent draws; the same plans appear in every component, so between-component comparisons would need the paired ratings.
- **Byline.** The ASEE record lists Andrea C. Borowczak as Andrea Burrows; this page uses the name she prefers. The author manuscript on NSF's Public Access Repository also lists Danny Radosevich, who does not appear on the ASEE PEER record.
</div>

<div data-levels="hs" markdown="1">
## Try this in class

1. In small groups, write a one-paragraph lesson plan that teaches one cybersecurity idea (for example, why a longer password is harder to guess) inside a subject you already study, such as mathematics or history.
2. Swap plans with another group and rate theirs as struggling (0), emerging (1), or excellent (2) on organization, objectives, integration, activities, and questions. Average the five numbers.
3. Compare your class's averages with the chart above. Write two sentences on which part was hardest to do well and one change that would raise it.
</div>

---
title: "Plan Against Product: Twelve Student Projects in a Cybersecurity Course"
kicker: "Interactive paper · ASEE Annual Conference 2018"
subtitle: "An interactive companion to Mike Borowczak and Andrea C. Borowczak's case study of 33 computer security students who chose their own groups and projects, and how often what each group handed in matched what it proposed."
description: "Follow 12 self-selected student groups from proposal to midterm report, final report, poster, and finished product, see the course and the five deliverables behind the study, read each of the paper's confusion matrices, and, at the graduate and researcher levels, test the alignment against chance and rebuild the group sizes from the printed averages."
share_description: "33 computer security students formed 12 groups and proposed their own projects. At the midterm, half delivered what they proposed; by the final report and poster, three in four did. Explore the study at five reading levels."
share_text: "Twelve student groups proposed their own cybersecurity projects. Half matched their plan at midterm, three in four by the end:"
share_image: /papers/cyber-authentic-inquiry/share.png
share_image_alt: "Twelve dots for 12 student groups joined from the project type each proposed to the type it delivered, with alignment rising from 50 percent at the midterm to 75 percent at the final report, poster, and finished product, beside the title Plan Against Product."
date: 2026-10-21
topics: ["Education"]
default_level: public
level_hints:
  public: No background needed
  hs: Fractions, percentages, and tables
  ug: Course projects and a confusion matrix
  grad: Agreement statistics and exact tests
  res: Full design, reconstruction, and open questions
authors:
  - name: Mike Borowczak
    affiliation: University of Wyoming
    member: mike-borowczak
  - name: Andrea C. Borowczak
    affiliation: University of Wyoming
    member: andrea-borowczak
sources:
  - venue: "ASEE Annual Conference & Exposition · Salt Lake City, UT · 2018"
    title: "Enabling Advanced Topics in Computing and Engineering Through Authentic Inquiry: A Cybersecurity Case Study"
    url: https://doi.org/10.18260/1-2--30370
    access: Free to read
citations:
  - asee_peer_30370
widget:
  css:
    - /papers/cyber-authentic-inquiry/widget.css
  js:
    - /papers/cyber-authentic-inquiry/ci-engine.js
    - /papers/cyber-authentic-inquiry/widget.js
credit: "Interactive page by the [DRACO Lab](/). Every count comes from the paper's Tables 1 to 6 and its Methods & Participants section, and the page reproduces the printed alignment of 6 of 12 groups (50 percent) at the midterm and 9 of 12 (75 percent) at the final report, poster, and finished product from the diagonals of Tables 3 to 6. At the graduate and researcher levels it adds Cohen's kappa, an exact test over every table with the printed totals, and a search for the group sizes behind Table 2; all three match an independent Python implementation with exact fractions and are labeled as the page's own. Everything runs on your device."
bibtex: |
  @inproceedings{borowczak2018authentic,
    author    = {Borowczak, Mike and Borowczak, Andrea C.},
    title     = {Enabling Advanced Topics in Computing and Engineering Through Authentic Inquiry: A Cybersecurity Case Study},
    booktitle = {2018 ASEE Annual Conference \& Exposition},
    address   = {Salt Lake City, UT},
    year      = {2018},
    month     = {June},
    publisher = {ASEE Conferences},
    doi       = {10.18260/1-2--30370},
    url       = {https://peer.asee.org/30370}
  }
---

<div class="lede" data-levels="public" markdown="1">
College courses often end with a project, and students often hand in something different from what they set out to build. Mike Borowczak and Andrea C. Borowczak watched that happen in one computer security class at the University of Wyoming. Thirty-three students formed 12 groups of their own choosing, proposed a project, and then turned in a midterm report, a final report, and a poster. At the midterm, half the groups had drifted from their plan. By the end, nine of 12 had delivered what they promised. This page lets you follow every group from plan to product.
</div>

<div class="lede" data-levels="hs" markdown="1">
Each of 12 student groups labeled its own project as one of three kinds: building something (application), finding something out (research), or both. The authors then checked what each group actually handed in at three checkpoints, adding a fourth kind the students never proposed: a literature survey, a summary of what others have published. Matches: 6 of 12 at the midterm (50 percent), then 9 of 12 (75 percent) at the final report, the poster, and the finished work. Every chart below is drawn from the six tables in the paper.
</div>

<div class="lede" data-levels="ug" markdown="1">
Authentic inquiry asks students to work the way practitioners do: pose an open problem, choose a method, and report to a real audience. This case study gave 33 students in an upper-level computer security elective an eight-week, self-directed project with five deliverables, then compared each group's proposal with its later products in four confusion matrices. Alignment rose from 50 percent at the midterm to 75 percent at every later checkpoint, application projects drew the largest groups (3.6 students on average), and four groups planned to keep going toward publication.
</div>

<div class="lede" data-levels="grad" markdown="1">
A pilot, mostly quantitative case study of one course offering: 12 self-selected groups (33 students) classified by project type at the proposal and at four later points, with alignment summarized as the diagonal of a 4 × 4 confusion matrix (proposal as predicted label, product as true label). The paper reports counts, group-size averages, and diagonal shares (50 and 75 percent) without inferential statistics. At this level the page adds chance-corrected agreement (Cohen's kappa) and an exact conditional test for each matrix, both labeled as its own.
</div>

<div class="lede" data-levels="res" markdown="1">
Borowczak and Borowczak (2018) ask three questions of a self-directed inquiry project in a cybersecurity elective: which project types groups choose, how group size relates to type, and whether proposals predict products. Tables 1 to 6 answer all three with counts; the abstract's further claims (ten traits of authentic science scored across five artifacts and related to instructor and peer scores) have no data in the body. This page reproduces the printed alignment, tests it against chance with the printed margins held fixed, and shows that Table 2's averages admit exactly one split of students across Table 6's cells, a split that totals 32 rather than 33.
</div>

## Twelve groups, from plan to product

<div id="ci-flow" class="w-demo"></div>

<div data-levels="public" markdown="1">
Each dot on the left is a group and the kind of project it promised; each dot on the right is what it handed in. Solid lines kept their promise; dashed lines changed course. Start at Midterm: three groups that promised research handed in summaries of other people's work instead. Then step to Final and watch most of the dashed lines straighten out. Pick a type to follow just those groups.
</div>

<div data-levels="hs" markdown="1">
Nobody proposed a literature survey, so every literature survey on the right is a group that drifted. At the midterm there were four of them. Switch between Final, Poster, and Actual: the count of matches stays at nine, but which groups miss changes, because the authors' final reading of the work (Actual) differs from how the reports and posters presented it.
</div>

<div data-levels="ug grad res" markdown="1">
The application groups never moved: all five proposed, built, and presented an application at every checkpoint. All of the drift sits in the research and mixed proposals. The paper prints the four tables independently and never names a group, so the page cannot follow one group across checkpoints; the dots are ordered by type, and each checkpoint's links reproduce that checkpoint's table exactly.
</div>

## The course and the project

<div id="ci-design" class="w-demo"></div>

<div data-levels="public hs" markdown="1">
The class covered security from ethics and codes to hacking tools, malware, and hardware. Most students were seniors, and most were finishing a senior design project in another class at the same time. Groups had two weeks to write a proposal and eight more weeks to do the work, then presented posters to faculty from across campus on the last day of class. Click a checkpoint on the timeline to move every demo on the page to it.
</div>

<div data-levels="ug grad res" markdown="1">
<div class="ci-table-scroll">
<table class="results-table">
<caption class="w-note">Design of the study, from the paper's Methods &amp; Participants and Analysis sections.</caption>
<thead><tr><th>Element</th><th>What the paper reports</th></tr></thead>
<tbody>
<tr><td>Setting</td><td>University of Wyoming; one offering of a three-credit, upper-level computer security elective (semester not stated)</td></tr>
<tr><td>Participants</td><td>33 students: two sophomores, six juniors, 25 seniors; 25 also in a senior capstone; three non-traditional</td></tr>
<tr><td>Groups</td><td>12, self-selected with no size limit; average 2.7 students</td></tr>
<tr><td>Project</td><td>Two weeks to propose, eight weeks to complete (one of them spring break); the abstract says six weeks</td></tr>
<tr><td>Deliverables</td><td>Proposal, midterm report, final report (conference-paper outline, LaTeX template), poster, and poster presentation; then a peer report on the division of labor that could adjust grades</td></tr>
<tr><td>Measures</td><td>Project type at the proposal (self-identified) and at the midterm report, final report, poster, and finished product (actual); group size</td></tr>
<tr><td>Analysis</td><td>Counts, averages, and four confusion matrices with the proposal as the predicted class</td></tr>
<tr><td>Stated limits</td><td>One course, 12 groups, and 33 students; student feedback anecdotal because course evaluations were not yet available</td></tr>
</tbody>
</table>
</div>
</div>

<div data-levels="grad res" markdown="1">
The paper defines the project types only by name. "Research & Application" in Tables 1 and 2 appears as "Mixed" in Tables 3 to 6, and the page treats them as one type. The paper describes the off-target midterm products as "only literature surveys without synthesis or any research activity."
</div>

## Plan against product, table by table

<div id="ci-matrix" class="w-demo"></div>

<div data-levels="public" markdown="1">
This grid is the paper's way of keeping score. Each column is a kind of project groups promised; each row is a kind they delivered. Groups on the shaded diagonal kept their promise. Half of the 12 sat on the diagonal at the midterm, and nine did by the end.
</div>

<div data-levels="hs" markdown="1">
Add the shaded cells and divide by 12 to get the percentage on the line chart: 6 ÷ 12 = 50 percent at the midterm, 9 ÷ 12 = 75 percent afterward. The bottom row never changes (five application, four research, and three mixed proposals) because the proposals were written once.
</div>

<div data-levels="ug" markdown="1">
Reading the proposal as a prediction and the product as the truth turns alignment into accuracy. The midterm column for Research holds the story: of four research proposals, one became an application and three became literature surveys. By the final report two of those four delivered research, one delivered a mixed project, and one remained a survey. The authors note that misaligned groups could be identified and corrected during the course, and they plan to use these off-target projects as non-examples in later offerings.
</div>

<div data-levels="grad res" markdown="1">
A 75 percent diagonal sounds high, but the margins matter: five of 12 groups proposed applications and all five delivered them, so a share of agreement comes from the margins alone. Kappa and the exact test below hold both sets of totals fixed and ask how unusual the printed diagonal is if products were shuffled among the groups. Every checkpoint beats chance; the midterm does so narrowly (kappa 0.33, p = 0.027) and the finished products most clearly (kappa 0.66, p = 0.00011). Both statistics are the page's, and with 12 groups each rests on a handful of cells.
</div>

## Who worked with whom

<div id="ci-groups" class="w-demo"></div>

<div data-levels="public hs" markdown="1">
Groups that set out to build something were the largest, about three or four students each. Groups that set out to do research were the smallest, and the two that finished research projects were students working alone. The authors read this as students sizing their teams to the work they expected.
</div>

<div data-levels="ug" markdown="1">
Table 2 answers the second research question: application groups averaged 3.6 students and research groups 1.8 at the proposal, so application groups were twice as large. By product the gap widens (3.6 against 1.0), because the larger research groups were the ones that ended with literature surveys (2.3 students on average).
</div>

<div data-levels="grad res" markdown="1">
Table 2 prints averages to one decimal for two different classifications of the same groups. Table 6 links the classifications, so each average constrains the sum of students in one or more of five proposal-to-product cells. The search below treats those sums as unknowns and keeps every assignment that reproduces all seven printed averages. Exactly one survives under ordinary rounding, and it accounts for 32 students; no assignment accounts for 33, and none survives if the averages were truncated.
</div>

## What the paper found

<div data-levels="public hs" markdown="1">
- Groups chose a balanced mix: five building projects, four research projects, and three that combined both.
- At the midterm, 6 of 12 groups had delivered the kind of project they proposed.
- By the final report, the poster, and the finished work, 9 of 12 had.
- Groups building something were the largest, and the two groups that finished research projects were single students.
- Fourteen students in four groups planned to keep working toward a published paper.
</div>

<div data-levels="ug grad res" markdown="1">
- **Diverse, balanced choices.** Self-identified: five application (42 percent), four research (33 percent), three research and application (25 percent), and no literature surveys. Actual: five, two, two, and three literature surveys.
- **Group size followed expected complexity.** Average 2.7 students per group; application 3.6, research and application 2.3 (2.5 actual), research 1.8 (1.0 actual), literature survey 2.3 (actual).
- **Drift, then recovery.** Proposal-to-product alignment of 6 of 12 (50 percent) at the midterm and 9 of 12 (75 percent) for the final report, poster, and finished product; three finished products still differed fundamentally from their proposals.
- **Momentum beyond the course.** Fourteen of 33 students and four of 12 groups planned to continue toward peer-reviewed publication.
- **Student response.** Students reported, anecdotally, learning more from the project than from any other single experience in their degree.
</div>

<div data-levels="grad res" markdown="1">
<div class="ci-table-scroll">
<table class="results-table">
<caption class="w-note">Alignment as printed, with chance-corrected agreement and an exact test computed by this page. The last three columns are the page's.</caption>
<thead><tr><th>Product</th><th>Table</th><th>Matches (paper)</th><th>Kappa (page)</th><th>Exact p, one-sided (page)</th><th>Tables with the printed totals (page)</th></tr></thead>
<tbody>
<tr><td>Midterm report</td><td>3</td><td>6/12 (50%)</td><td>0.327</td><td>0.0271</td><td>105</td></tr>
<tr><td>Final report</td><td>4</td><td>9/12 (75%)</td><td>0.633</td><td>0.0028</td><td>203</td></tr>
<tr><td>Poster</td><td>5</td><td>9/12 (75%)</td><td>0.633</td><td>0.0028</td><td>203</td></tr>
<tr><td>Finished product (actual)</td><td>6</td><td>9/12 (75%)</td><td>0.657</td><td>0.00011</td><td>249</td></tr>
</tbody>
</table>
</div>
</div>

## Why it matters

<div data-levels="public hs" markdown="1">
Nearly half of the students who start college in science and engineering fields leave them, a figure the paper cites, and students often struggle to see how coursework connects to real problems. Schools for younger students have studied for decades how hands-on, open-ended projects keep students engaged. This study brings those ideas into a college security course and shows that, given room to choose, students take on real problems, and that teachers can spot a group drifting off course early enough to help.
</div>

<div data-levels="ug" markdown="1">
The authors' argument runs from K–12 practice to the university: inquiry and authentic science, studied in schools for decades, transfer to an upper-level computing course with little change. The midterm is the useful checkpoint. Half the groups had drifted by then, mostly from research toward summarizing others' work, and most recovered by the final report. A course that compares each midterm product with its proposal can catch that drift while there is still time to correct it.
</div>

<div data-levels="grad res" markdown="1">
The design is cheap to repeat: classify each proposal, classify each product at each checkpoint, and keep the matrices. Kept that way, the matrices give a course a running record of how well students scope open problems. The authors call for larger, multi-offering studies and for surveys of graduates and employers to test whether the experience lasts; per-group tracking across checkpoints and the trait scores the abstract describes would make those studies far more informative.
</div>

<div data-levels="res" markdown="1">
## Notes from building this page

- **32 students in Table 2.** Seven printed averages, linked through Table 6's five proposal-to-product cells, admit exactly one split under rounding to the nearest tenth: 18 students in the five application groups, two in the two groups that stayed research (one each), five in the two that stayed mixed, five in the two research proposals that became literature surveys, and two in the mixed proposal that became one. The split totals 32, and 32 ÷ 12 = 2.67 rounds to the printed 2.7, while 33 ÷ 12 = 2.75 rounds to 2.8. One student may have worked outside the 12 groups, or one average may carry a typo; the paper does not say.
- **"Double."** Application groups were twice the size of research groups by proposal (3.6 against 1.8); by product the ratio is 3.6 to 1.0.
- **Two different 75 percents.** Tables 4 and 5 are identical, and both differ from Table 6. In the reports and posters, the misses are one research proposal presented as mixed, one mixed proposal presented as research, and one research proposal presented as a literature survey; in the authors' reading of the finished work, the misses are three literature surveys (two from research proposals, one from a mixed proposal). The text's "all but one group" refers to Tables 4 and 5, and its "three of 12 fundamentally disconnected" to Table 6.
- **The abstract and the body.** The abstract describes scoring five artifacts against ten traits of authentic science and relating them to instructor scores and a peer survey, with half of the traits significant for peer scores. The body names no traits and reports no scores or tests. The abstract also gives a six-week project and two research questions; the body gives eight weeks (with spring break) and three questions.
- **Chance agreement.** The page's kappa and exact test condition on both margins and treat groups as exchangeable. With no literature-survey proposals, every survey is a miss by construction, and the four matrices reuse the same 12 groups, so the four p values are not independent.
- **Small details.** Table 3 prints a dash in one cell (zero by its row total); two of 12 is printed as 16 percent (16.7); the project-type labels change between Tables 1 to 2 ("Research & Application") and 3 to 6 ("Mixed").
</div>

<div data-levels="hs" markdown="1">
## Try this in class

1. Before a group project starts, have each team write one sentence naming its project type: build something, find something out, both, or summarize what others found.
2. At the halfway point and at the end, label what each team actually handed in with the same four types, without looking at the proposals.
3. Make a 4 × 4 table with proposals as columns and products as rows, count the teams on the diagonal, and divide by the number of teams. Compare your class with the 50 and 75 percent in **Plan against product, table by table**.
</div>

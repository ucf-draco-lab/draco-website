---
title: "From Allowed to Embedded: AI Policies Across 71 Engineering Courses"
kicker: "Interactive paper · ASEE Annual Conference 2026"
subtitle: "An interactive companion to Mike Borowczak and Andrea C. Borowczak's participatory audit of 128 course experiences, reported by 30 computing and electrical engineering students over nine semesters: what each course said about generative AI, how clear that was, and what students did anyway."
description: "Walk the paper's five-level policy continuum from Disallowed to Critical Use, follow nine semesters of course reports, compare how clear each kind of policy felt to students, and see which tasks they handed to AI under each one."
share_description: "30 engineering students audited 128 of their own courses for AI policy over nine semesters. Bans faded, vague permission took over, and vague permission felt least clear. 62.5% of reports from courses that banned AI still describe using it. Explore the data at five reading levels."
share_text: "128 engineering courses, five kinds of AI policy, and one clarity gap. Explore what students reported:"
share_image: /papers/allowed-to-embedded/share.png
share_image_alt: "Mean instructor clarity on a one-to-five scale for four AI policies, with Allowed (Informal) at 2.45 far below Disallowed at 4.50, Encouraged at 4.37, and Critical Use at 4.44, next to the title From Allowed to Embedded."
date: 2026-10-20
topics: ["Education", "AI & machine learning"]
default_level: public
level_hints:
  public: No background needed
  hs: Percentages and averages
  ug: Engineering coursework and intro statistics
  grad: Survey methods and statistical tests
  res: Full design, reproduction, and open questions
authors:
  - name: Mike Borowczak
    affiliation: University of Central Florida
    member: mike-borowczak
  - name: Andrea C. Borowczak
    affiliation: University of Central Florida
    member: andrea-borowczak
sources:
  - venue: "ASEE Annual Conference & Exposition · Charlotte, NC · 2026"
    title: "From Allowed to Embedded: Student Perceptions of AI Use Across Engineering Courses"
    url: https://doi.org/10.18260/1-2--59546
    access: Free to read
citations:
  - borowczak2026allowed
widget:
  css:
    - /papers/allowed-to-embedded/widget.css
  js:
    - /papers/allowed-to-embedded/ae-engine.js
    - /papers/allowed-to-embedded/widget.js
credit: "Interactive page by the [DRACO Lab](/). Every percentage, mean, and test statistic comes from the paper's Tables 1 and 2 and its Results text. The page recomputes Table 2's counts from its percentages and the semester counts behind the shares the text states. At the graduate and researcher levels it recovers the one set of whole-number clarity answers that reproduces every printed clarity statistic (means, standard deviation, three Welch t values, three Cohen's d values, F = 38.84, and H = 58.7); its tests and Wilson intervals match SciPy to at least ten significant digits. Recovered counts and intervals are the page's own. Everything runs on your device."
bibtex: |
  @inproceedings{borowczak2026allowed,
    author    = {Borowczak, Mike and Borowczak, Andrea C.},
    title     = {From Allowed to Embedded: Student Perceptions of {AI} Use Across Engineering Courses},
    booktitle = {2026 ASEE Annual Conference \& Exposition},
    address   = {Charlotte, NC},
    year      = {2026},
    month     = {June},
    publisher = {ASEE Conferences},
    doi       = {10.18260/1-2--59546},
    url       = {https://peer.asee.org/59546}
  }
---

<div class="lede" data-levels="public" markdown="1">
When generative artificial intelligence (AI) tools such as ChatGPT reached college classrooms, each instructor had to decide what to tell students about them. Mike Borowczak and Andrea C. Borowczak asked 30 engineering and computing students at the University of Central Florida to report what each of their courses said, from Spring 2023 through Fall 2025. Across 128 course reports, outright bans faded, and the most common replacement was a vague permission that students found the least clear of all. This page lets you explore what the students reported.
</div>

<div class="lede" data-levels="hs" markdown="1">
A course policy on AI can say "never," say nothing, say "fine, I guess," invite students to use it, or require them to use it and then check its work. Over nine semesters, 30 students reported which of these five policies each of their courses had (128 reports in all), rated how clear the policy was from 1 to 5, and checked off what they used AI for. The results turn into percentages and averages you can explore below, including one surprising number: in courses that banned AI, 62.5 percent of the reports still describe using it.
</div>

<div class="lede" data-levels="ug" markdown="1">
Borowczak and Borowczak ran a longitudinal, participatory action research study in which students audited their own computer engineering, computer science, and electrical engineering courses. Each of 128 reports placed a course on a five-level Depth-of-Integration continuum (Disallowed, No Policy Stated, Allowed (Informal), Encouraged (Optional), and Critical Use), rated the instructor's clarity on a five-point scale, and listed the tasks the student used AI for. The paper traces three phases from 2023 to late 2025, measures a "clarity gap" between informal permission and every explicit policy, and names the AI use inside prohibiting courses a "shadow curriculum."
</div>

<div class="lede" data-levels="grad" markdown="1">
A single-institution, opt-in audit: 30 students contributed 128 course-experience reports covering 71 unique courses across nine semesters (Spring 2023 to Fall 2025; 96 undergraduate and 32 graduate reports). Students self-classified each course's AI policy on the authors' five-level continuum and rated instructor clarity on a 1 to 5 item. The analysis compares clarity across four policy groups (one-way analysis of variance, or ANOVA, Welch t-tests with a Bonferroni-adjusted α of 0.0083, and a Kruskal–Wallis check) and tabulates multi-select task use by policy. The page reproduces the printed percentages and, at this level, recovers the answer counts behind the clarity tests.
</div>

<div class="lede" data-levels="res" markdown="1">
Borowczak and Borowczak (2026) document how course-level generative AI policy in computing and electrical engineering moved from reactive prohibition through informal permission to a stratified mix, using 128 student-classified reports. The central quantitative claim is a clarity gap: Allowed (Informal) courses average 2.45 of 5 against 4.37 to 4.50 for explicit policies, F(3, 103) = 38.84. The paper prints means, one standard deviation, Welch t, Cohen's d, F, and H, but no answer distributions. This page finds that exactly one whole-number answer table reproduces all of them, recomputes every test from it, and records what that table adds, alongside notes on the unit of analysis.
</div>

## The study

<div data-levels="public hs" markdown="1">
The authors call the design participatory action research: students did more than answer a survey. They audited their own courses. Each report described one course a student had taken, which of five kinds of AI policy it had, how clear that policy was, and what the student used AI for. Thirty students answered an open call through course announcements, department mailing lists, and word of mouth, and together they described 71 different courses. Most reports came from computer engineering (67) and computer science (44), with 16 from electrical engineering and one from general engineering.
</div>

<div data-levels="ug grad res" markdown="1">
<div class="ae-study-wrap">
<table class="results-table">
<caption class="w-note">Design of the study, from the paper's methodology and results sections.</caption>
<thead><tr><th>Element</th><th>What the paper reports</th></tr></thead>
<tbody>
<tr><td>Setting</td><td>University of Central Florida; computing and electrical engineering courses</td></tr>
<tr><td>Design</td><td>Longitudinal participatory action research: students audit their own course experiences</td></tr>
<tr><td>Window</td><td>Nine semesters, Spring 2023 to Fall 2025, including three summers</td></tr>
<tr><td>Participants</td><td>30 students; open call through course announcements, department mailing lists, and word of mouth; voluntary and non-random; several respondents belong to the lead author's lab</td></tr>
<tr><td>Reports</td><td>128 course experiences across 71 unique courses: 96 undergraduate, 32 graduate; Computer Engineering 67, Computer Science 44, Electrical Engineering 16, General Engineering 1</td></tr>
<tr><td>Policy</td><td>Classified by the student, from syllabus text and verbal instructions, on the five-level Depth-of-Integration continuum</td></tr>
<tr><td>Clarity</td><td>"How clear was the instructor's policy regarding AI usage?" 1 = very unclear to 5 = very clear</td></tr>
<tr><td>Tasks</td><td>Multi-select: explanation, ideation, debugging, verification, critique, or none</td></tr>
<tr><td>Collected, not analyzed here</td><td>Consistency of the policy across assignments, syllabus excerpts, and sentiment items (usefulness, fairness, ethical clarity, confidence)</td></tr>
<tr><td>Analysis</td><td>Shares by semester and policy; clarity compared with a one-way ANOVA, Welch t-tests (Bonferroni α = 0.0083), and Kruskal–Wallis; No Policy Stated left out of the clarity comparison</td></tr>
</tbody>
</table>
</div>
</div>

## Five kinds of course policy

<div id="ae-ladder" class="w-demo"></div>

<div data-levels="public" markdown="1">
Pick a policy and look at the largest number. Courses that ban AI still show students using it: 15 of 24 reports describe at least one use, most often to explain a concept or a lecture. The authors call this the shadow curriculum, learning that happens with AI whether or not the course plans for it. Move to Critical Use and every one of the nine reports describes using AI, and two in three describe critiquing its mistakes.
</div>

<div data-levels="hs" markdown="1">
Each bar is a percentage of that policy's reports, and the count beside it shows where the percentage comes from: 15 of 24 Disallowed reports is 15 ÷ 24 = 0.625, or 62.5 percent. Students could check several tasks, so the bars for one policy add to more than 100 percent. Compare the Debugging bar across the five policies: 29.2 percent under Disallowed and 88.9 percent under Critical Use.
</div>

<div data-levels="ug" markdown="1">
The continuum orders policies by how deeply AI enters the course, from prohibition to required use with critique. The task profile follows that order for the tasks that demand the most from a student. Debugging rises from 29.2 percent (Disallowed) to 88.9 percent (Critical Use), verification of math and logic from 16.7 to 66.7 percent, and critique of AI errors from 16.7 to 66.7 percent. Explanation peaks in the middle of the scale instead: 72.3 percent of Allowed (Informal) reports against 55.6 percent of Critical Use reports.
</div>

<div data-levels="grad res" markdown="1">
Table 2's column sizes (24, 21, 47, 27, and 9) sum to 128, and every printed percentage corresponds to exactly one whole-number count, which the bars show. The rows are binary items from a multi-select list, so a column describes the share of reports marking each task; it does not say how many tasks a report marked or which travel together. The Critical Use column rests on nine reports, the paper's smallest group.
</div>

## Nine semesters of reports

<div id="ae-timeline" class="w-demo"></div>

<div data-levels="public" markdown="1">
Reports grow from eight in Spring 2023 to 31 in Fall 2025, as more students joined and more courses settled on a policy. The authors read the period in three phases. In 2023, courses reacted: half of the first semester's reports name no policy at all, and by that fall three in four describe informal permission. Through 2024 and early 2025, vague permission led while bans faded. By Fall 2025 the picture had split five ways, with Encouraged courses tied with informal permission at 29.0 percent and Critical Use, absent before Fall 2024, at 12.9 percent.
</div>

<div data-levels="hs" markdown="1">
Pick a semester to see the policy shares the paper's text gives and the number of reports behind each one. Fall 2025's five shares (29.0, 29.0, 16.1, 12.9, and 12.9 percent) come from 9, 9, 5, 4, and 4 of 31 reports; added up they make 99.9 percent, because each was rounded on its own. Summer terms carry only two to nine reports, so one report moves a summer share by 11 percentage points or more.
</div>

<div data-levels="ug" markdown="1">
Table 1 gives the sample per semester; Figure 1 gives the policy mix per semester as stacked bars, and the text states exact shares only for selected semesters. The Disallowed share falls from 35.7 percent (5 of 14) in Spring 2024 to 14.8 percent (4 of 27) in Spring 2025 and 12.9 percent (4 of 31) in Fall 2025. Encouraged (22.7 percent) and Critical Use (13.6 percent) first appear in Fall 2024. No Policy Stated never disappears: 16.1 percent of Fall 2025 reports still describe a course that says nothing.
</div>

<div data-levels="grad res" markdown="1">
Unique courses per semester sum to 110 against 71 unique courses overall, so many courses appear in more than one semester, and the same course can be reported by different students. The early semesters carry the phase claims on small denominators: the Phase 1 percentages rest on eight and 12 reports, and every undergraduate-only summer term on nine or fewer. The full Spring 2023 and Fall 2025 breakdowns are stated in the text; for the other semesters the page shows only what the text states and marks the rest.
</div>

## The clarity gap

<div id="ae-clarity" class="w-demo"></div>

<div data-levels="public" markdown="1">
Students rated how clear each policy was, from 1 (very unclear) to 5 (very clear). A ban felt clear (4.50). So did encouragement (4.37) and required, critical use (4.44). Informal permission, the most common policy in the study, averaged 2.45. Students found a firm "no" far clearer than a vague "yes." The gap holds for undergraduate and graduate reports alike.
</div>

<div data-levels="hs" markdown="1">
An average hides how answers spread out. The paper reports one spread, the standard deviation, for Allowed (Informal): 1.14, wide on a five-point scale, which means the answers for that policy spread widely across the scale. For the three explicit policies the averages sit within 0.13 of each other, and the paper's tests find no real difference among them. The difference that matters is about two points, between informal permission and everything else.
</div>

<div data-levels="ug" markdown="1">
The one-way ANOVA across the four compared policies gives F(3, 103) = 38.84, p < .001, and each Welch t-test of Allowed (Informal) against an explicit policy clears the Bonferroni-adjusted α of 0.0083 with an effect size near two standard deviations (d = −2.15, −1.96, and −2.09). A Kruskal–Wallis test, which uses ranks and suits a five-point item, agrees: H(3) = 58.7, p < .001. The authors note one caution: Allowed (Informal) is partly defined by vague wording, so low clarity there is partly built into the category.
</div>

<div data-levels="grad res" markdown="1">
The histograms are not in the paper. The page searched every possible 1 to 5 answer table for the four groups and kept only those matching all printed statistics; the last demo shows the search. One table survives, and every test in the comparison table is recomputed from it. Cohen's d reproduces in its average-variance form (the mean difference over the root mean of the two variances), and H reproduces with the tie correction. The 95 percent intervals use a t quantile on each recovered group and assume independent reports, which the notes below question.
</div>

## What students did with AI

<div id="ae-shadow" class="w-demo"></div>

<div data-levels="public" markdown="1">
Read across the "At least one task" row. Use of AI rises with each step up the policy ladder, from 62.5 percent in banning courses to 100 percent in Critical Use courses. Even where AI was banned, the most common use was to explain a concept or a lecture. The authors describe this use as mostly study help that students did not consider cheating.
</div>

<div data-levels="hs" markdown="1">
Switch to **Count of reports** to see the whole numbers behind each percentage. The Abstained row is the At least one task row subtracted from 100 percent: 9 of the 24 Disallowed reports abstained, and 15 used AI. Pick a policy to highlight its column, then find the task with the largest gap between Disallowed and Critical Use.
</div>

<div data-levels="ug" markdown="1">
Two patterns stand out. Engagement with AI output rises with integration: critique of AI errors is 8.5 percent under Allowed (Informal), 25.9 percent under Encouraged, and 66.7 percent under Critical Use. Abstention falls the other way, from 37.5 to 0 percent. Where a course designs for critique, students report practicing it.
</div>

<div data-levels="grad res" markdown="1">
Each column is a separate policy group, and the reports within a column are not independent (one student can report several courses). The Wilson intervals below the table treat reports as independent draws and so understate the uncertainty; the Disallowed interval for any use runs from 42.7 to 78.8 percent even so. The paper offers no test across columns, and the page adds none.
</div>

<div data-levels="grad res" markdown="1">
## Recovering the answers behind the clarity tests

<div id="ae-recover" class="w-demo"></div>

The search enumerates every way to split each group's ratings across the five answers (about 0.3 million tables), keeps those whose mean, and for Allowed (Informal) standard deviation, round to the printed values, then keeps pairs whose Welch t and Cohen's d against Allowed (Informal) round to the printed values. The search keeps 57 Allowed tables, two Disallowed, two Encouraged, and one Critical Use table, and every one of the 228 combinations gives F = 38.84. Only one gives H = 58.7. The recovered table is the page's reconstruction, not data the paper prints, and it would be confirmed or corrected by the authors' item-level file.
</div>

## What the paper found

<div data-levels="public" markdown="1">
- Outright bans on AI faded over the study: from a quarter of the first semester's reports to 12.9 percent by Fall 2025.
- Vague permission ("allowed," with no guidance) became the most common policy, peaking at three in four reports in Fall 2023.
- Students rated vague permission as the least clear policy, far below bans, encouragement, or required use.
- In courses that banned AI, 62.5 percent of the reports still describe using it, mostly to explain concepts.
- In courses that required students to use AI and check its work, every report describes using it, and students reported the most practice in critiquing its mistakes.
</div>

<div data-levels="hs" markdown="1">
- Disallowed reports fell from 25 percent in Spring 2023 and 35.7 percent in Spring 2024 to 12.9 percent in Fall 2025.
- Allowed (Informal) peaked at 75 percent (9 of 12 reports) in Fall 2023 and was still 29.0 percent in Fall 2025.
- Mean clarity: Allowed (Informal) 2.45, against 4.50 (Disallowed), 4.37 (Encouraged), and 4.44 (Critical Use).
- 62.5 percent of Disallowed reports (15 of 24) describe AI use for at least one task.
- Critique of AI errors: 66.7 percent of Critical Use reports against 8.5 percent of Allowed (Informal) reports.
</div>

<div data-levels="ug grad res" markdown="1">
- **Bans receded.** Disallowed fell from 35.7 percent of reports (Spring 2024) to 14.8 percent (Spring 2025) and 12.9 percent (Fall 2025).
- **Ambiguity filled the space.** Allowed (Informal) peaked at 75 percent in Fall 2023 and remained the most prevalent category through 2024 and early 2025; by Fall 2025 it tied Encouraged at 29.0 percent.
- **A clarity gap.** Allowed (Informal) 2.45 of 5 (SD 1.14, n = 47) against Disallowed 4.50, Encouraged 4.37, and Critical Use 4.44; F(3, 103) = 38.84, p < .001; no significant differences among the three explicit policies.
- **The gap holds by level.** Undergraduate reports: 2.51 (n = 37) against 4.30 (n = 20); graduate reports: 2.20 (n = 10) against 4.57 (n = 7).
- **A shadow curriculum.** 62.5 percent of Disallowed reports describe AI use for at least one task, led by explanation (45.8 percent).
- **Integration shapes the task.** Debugging, verification, and critique rise toward Critical Use (88.9, 66.7, and 66.7 percent).
</div>

<div data-levels="grad res" markdown="1">
<div class="ae-study-wrap">
<table class="results-table">
<caption class="w-note">Clarity statistics as printed, with the answer counts this page recovers. Counts and the last two columns are the page's reconstruction.</caption>
<thead><tr><th>Policy</th><th>n</th><th>Mean (paper)</th><th>Answers 1, 2, 3, 4, 5 (page)</th><th>Mean (page)</th><th>SD (page)</th></tr></thead>
<tbody>
<tr><td>Disallowed</td><td>24</td><td>4.50</td><td>0, 1, 0, 9, 14</td><td>4.500</td><td>0.722</td></tr>
<tr><td>Allowed (Informal)</td><td>47</td><td>2.45 (SD 1.14)</td><td>14, 6, 21, 4, 2</td><td>2.447</td><td>1.138</td></tr>
<tr><td>Encouraged (Optional)</td><td>27</td><td>4.37</td><td>0, 1, 2, 10, 14</td><td>4.370</td><td>0.792</td></tr>
<tr><td>Critical Use</td><td>9</td><td>4.44</td><td>0, 0, 1, 3, 5</td><td>4.444</td><td>0.726</td></tr>
</tbody>
</table>
</div>
</div>

## What the authors recommend

<div data-levels="public hs" markdown="1">
The authors ask engineering programs to replace silence and vague permission with explicit guidance, since every explicit policy, a ban included, rated far clearer than informal permission. Beyond clarity, they propose teaching with AI the way engineers treat any tool that can be wrong: "Trust but Verify." In a "Verification First" course, assignments assume students have AI, and grading rewards checking its output. Ultimately, that turns the shadow curriculum into a planned one.
</div>

<div data-levels="ug grad res" markdown="1">
<div class="ae-study-wrap">
<table class="results-table">
<caption class="w-note">The paper's recommendations, each paired by this page with the finding it answers.</caption>
<thead><tr><th>Recommendation (paper)</th><th>Related finding (page's pairing)</th></tr></thead>
<tbody>
<tr><td>Replace informal policies with explicit guidance</td><td>Allowed (Informal) clarity 2.45 against 4.37 to 4.50 for explicit policies</td></tr>
<tr><td>Verification First: assume AI is available and assess the validation of its output, shifting effort from syntax to semantics and system logic</td><td>Critique of AI errors 66.7 percent under Critical Use against 8.5 percent under Allowed (Informal)</td></tr>
<tr><td>Map AI competencies to accreditation outcomes on ethical and professional responsibility</td><td>Critical Use reports describe the most verification and critique practice</td></tr>
</tbody>
</table>
</div>

The authors propose extending the audit to other disciplines and institutions, adding faculty perspectives, and relating policy type to student performance. The companion paper, [Trust but Verify](/papers/trust-but-verify/), surveys 147 students in the same department on which tools they use and how often they check the output.
</div>

## Why it matters

<div data-levels="public hs" markdown="1">
Students in engineering and computing will work with AI tools that are often right and sometimes wrong. Course policies decide whether they practice checking that work in class or alone. This study shows that the policy students saw most often told them the least, and that the courses which built AI into the work produced the most checking.
</div>

<div data-levels="ug" markdown="1">
Course policy is cheap to change and sets the conditions for everything else an instructor does with AI. A department can rerun this audit each semester with the same five categories and one clarity item, and track whether its courses move from informal permission toward explicit, verification-centered designs.
</div>

<div data-levels="grad res" markdown="1">
The continuum gives programs a shared vocabulary for course-level AI policy, and the student-audit design captures what a syllabus review cannot: the policy as students understood it and the use it did not prevent. Because the clarity statistics are complete enough to recover their answer distribution, later waves or other institutions can compare against these 107 ratings at the level of individual answers.
</div>

<div data-levels="res" markdown="1">
## Notes from building this page

- **One answer table fits.** Means and the Allowed (Informal) standard deviation alone leave 57 tables for that group; adding Welch t and Cohen's d leaves 228 four-group combinations, all with F = 38.84; Kruskal–Wallis H = 58.7 selects one. In it, 14 of 47 Allowed (Informal) ratings are 1 (very unclear) and 21 are 3, with only six at 4 or 5; 23 of 24 Disallowed and 24 of 27 Encouraged ratings are 4 or 5. The bimodal Allowed distribution (a block of 1s and a block of 3s) may separate courses that students read as silent from courses they read as permissive, a split the sentiment items could test.
- **Effect size and rank test conventions.** The printed d values are average-variance d (−2.15, −1.96, −2.09); pooled-variance d gives −2.02, −1.87, and −1.84. H = 58.7 includes the tie correction (55.0 without). Stating both conventions would let readers reproduce the values directly.
- **Reports are nested in students.** Thirty students contributed 128 reports, about 4.3 each, and some courses appear in several reports. The t-tests, ANOVA, Kruskal–Wallis, and the page's intervals all treat reports as independent; a model with a student random intercept, or a sensitivity analysis keeping one report per student and course, would need the student identifiers.
- **Who classifies the policy.** The same student classifies the policy and rates its clarity, so a course read as unclear can land in Allowed (Informal) for that reason; the paper names this overlap and treats the comparison among the three explicit policies as the more interpretable one. Those three do not differ (Welch p = 0.54, 0.85, and 0.80 on the recovered counts).
- **Two summary statements to check against the tables.** The conclusion credits Critical Use with the highest clarity, but its mean (4.44) is below Disallowed (4.50); ethical confidence, the other half of that claim, is not quantified in this paper. The text says critique was rarely reported outside Critical Use; Table 2 gives 25.9 percent under Encouraged and 16.7 percent under Disallowed.
- **Figure 1 in numbers.** The text states complete policy shares for Spring 2023 and Fall 2025 only. Critical Use totals nine reports, three in Fall 2024 and four in Fall 2025, so the other two fall in Spring or Summer 2025 if Fall 2024 is the first appearance. Printing Figure 1's counts as a table would let readers check each phase claim.
- **Scope of the sample.** An opt-in sample that includes lab members probably over-represents students engaged with AI; the authors read the 62.5 percent shadow-use rate as an upper bound. The Wilson interval on that share (42.7 to 78.8 percent, page's own) is wide even before accounting for clustering.
</div>

<div data-levels="hs" markdown="1">
## Try this in class

1. List five courses you have taken (or five classes this year) and place each on the paper's five-level continuum: Disallowed, No Policy Stated, Allowed (Informal), Encouraged, or Critical Use. Rate each policy's clarity from 1 to 5.
2. Pool the class's answers. Compute the average clarity for each policy, and count how many of the Disallowed courses still had students use AI for at least one task.
3. Compare your averages with the **The clarity gap** demo, and write two sentences on which kind of policy your class found clearest and why.
</div>

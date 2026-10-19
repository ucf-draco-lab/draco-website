---
title: "Trust but Verify: How 147 Engineering Students Use Generative AI"
kicker: "Interactive paper · ASEE Southeastern Section 2026"
subtitle: "An interactive companion to Mike Borowczak and Andrea C. Borowczak's survey of 147 electrical and computer engineering students: which AI tools they know, what they use them for, how often they check the output, and what the authors recommend for engineering courses."
description: "Compare your own AI use with 147 engineering students, then explore the survey's five tables: familiarity with four kinds of AI tools, the tasks students hand to AI, how often they verify each kind of output, and where the line between yes and no falls on each answer scale."
share_description: "147 engineering students told us which AI tools they know, what they use them for, and how often they check the output. Code gets checked most; writing least. Compare your own answers and explore the survey's tables. Written for five reading levels."
share_text: "147 engineering students on generative AI: what they use it for and how often they check its work. Compare your answers with theirs:"
share_image: /papers/trust-but-verify/share.png
share_image_alt: "Four horizontal bars showing how often 147 engineering students verify AI output, from code at 67.8 percent to general writing at 43.8 percent, next to the title Trust but Verify."
date: 2026-10-18
default_level: public
level_hints:
  public: No background needed
  hs: Percentages and a little data analysis
  ug: Engineering coursework and intro statistics
  grad: Survey methods and statistics
  res: Full design, reproduction, and open questions
authors:
  - name: Mike Borowczak
    affiliation: University of Central Florida
    member: mike-borowczak
  - name: Andrea C. Borowczak
    affiliation: University of Central Florida
    member: andrea-borowczak
sources:
  - venue: "ASEE Southeastern Section Conference · 2026"
    title: "Trust but Verify: Engineering Students' Adoption of Generative AI and Pedagogical Implications Across Disciplines"
    url: https://doi.org/10.18260/1-2--58017
    access: Free to read
citations:
  - borowczak2026trust
widget:
  css:
    - /papers/trust-but-verify/widget.css
  js:
    - /papers/trust-but-verify/tv-engine.js
    - /papers/trust-but-verify/widget.js
credit: "Interactive page by the [DRACO Lab](/). Every percentage and count comes from the paper's Tables 1 to 5. The page recomputes Table 1's and Table 2's percentages from their printed counts and the abstract's 69.2, 82.2, and 89.0 percent from Table 1. The whole-number counts behind Tables 3 to 5 and the Wilson intervals at the graduate and researcher levels are the page's own, and they match an independent Python search and statsmodels on all 13 rows. Everything runs on your device."
bibtex: |
  @inproceedings{borowczak2026trust,
    author    = {Borowczak, Mike and Borowczak, Andrea C.},
    title     = {Trust but Verify: Engineering Students' Adoption of Generative {AI} and Pedagogical Implications Across Disciplines},
    booktitle = {2026 ASEE Southeastern Section Conference},
    address   = {Memphis, TN},
    year      = {2026},
    month     = {March},
    publisher = {ASEE Conferences},
    doi       = {10.18260/1-2--58017},
    url       = {https://peer.asee.org/58017}
  }
---

<div class="lede" data-levels="public" markdown="1">
Generative artificial intelligence (AI) tools such as ChatGPT arrived in engineering classrooms faster than most courses could adjust. Mike Borowczak and Andrea C. Borowczak asked 147 electrical and computer engineering students at a large public research university how they use these tools. The students knew general chatbots well and specialized engineering tools hardly at all; they used AI most to fix code and to understand hard ideas; and they checked AI-written code more often than AI-written explanations or prose. This page lets you answer the same questions and explore every table in the paper.
</div>

<div class="lede" data-levels="hs" markdown="1">
A survey turns opinions into counts, and counts into percentages. This one asked 147 engineering students nine questions about generative AI, the kind of software that writes text or code from a prompt. Most questions used answer scales, from "never" to "always" or from "strongly disagree" to "strongly agree." Every headline number depends on where you draw the line between a yes and a no on those scales. Below, you can pick your own AI uses, compare them with the students', and move that line yourself.
</div>

<div class="lede" data-levels="ug" markdown="1">
Borowczak and Borowczak surveyed 147 undergraduate and graduate students in electrical and computer engineering about four kinds of AI tools: large language models (LLMs), code generation tools, specialized technical tools (for example, AI inside electronic design automation, or EDA, software), and technical documentation assistants. The survey adapts an instrument the authors first used with graduate students in a microelectronics seminar (GLSVLSI 2025). Students reported familiarity, tasks, how often they verify AI output, perceived impact on how they work, and their attitudes toward AI. The paper ends with four recommendations for engineering courses.
</div>

<div class="lede" data-levels="grad" markdown="1">
A descriptive, single-institution survey (N = 147 completed responses) of electrical and computer engineering students at a large public research university in the U.S. Southeast. The AI-Engineering-Survey, administered in Qualtrics, generalizes the authors' microelectronics instrument (GLSVLSI 2025) into nine items: demographics (Q1 and Q2), familiarity with four tool categories (Q3, five points), a multi-select task list (Q4), verification frequency for four output types (Q5, five points), perceived impact on five aspects of work (Q6, five points), attitudes (Q7, seven points), and two open-ended questions (Q8 and Q9). The analysis reports counts, percentages, collapsed low and high totals, and a thematic summary.
</div>

<div class="lede" data-levels="res" markdown="1">
Borowczak and Borowczak (2026) characterize generative AI adoption among 147 electrical and computer engineering students with five descriptive tables and connect the pattern (broad familiarity with general LLMs, little exposure to domain tools, and verification that is strongest for code) to their earlier microelectronics study. This page reproduces the percentages of Tables 1 and 2 from their printed counts and the abstract's familiarity figures from Table 1. For Tables 3 to 5, which print percentages only, it recovers the unique whole-number counts behind every row and uses them, at the graduate and researcher levels, to explain the small differences between printed totals and to add interval estimates, labeled as the page's own.
</div>

## The study

<div data-levels="public hs" markdown="1">
The survey ran online at a large public research university in the southeastern United States. Of the 147 students who finished it, nearly all were working toward a bachelor's degree in computer engineering (47.6 percent) or electrical engineering (44.2 percent); a few were master's or doctoral students. About six in ten followed the comprehensive (general) track, and about one in five specialized in digital design and very large scale integration (VLSI), the field of designing computer chips. The questions grew out of an earlier survey the authors gave to graduate students who design chips.
</div>

<div data-levels="ug grad res" markdown="1">
<div class="tv-study-wrap">
<table class="results-table">
<caption class="w-note">Design of the study, from the paper's methods and results sections.</caption>
<thead><tr><th>Element</th><th>What the paper reports</th></tr></thead>
<tbody>
<tr><td>Setting</td><td>A large public R1 university in the U.S. Southeast; online survey in Qualtrics</td></tr>
<tr><td>Participants</td><td>N = 147 completed responses. BS Computer Engineering 47.6%, BS Electrical Engineering 44.2%, MS Electrical Engineering 3.4%, MS Computer Engineering 2.7%, PhD about 1.4% combined, with a handful of non-responses</td></tr>
<tr><td>Tracks</td><td>Comprehensive 59.9%, Digital Design and VLSI 21.8%, Power and Renewable Energy 10.9%, with smaller numbers in RF, Communications, and other tracks</td></tr>
<tr><td>Instrument</td><td>AI-Engineering-Survey, adapted from the authors' microelectronics instrument (GLSVLSI 2025): Q1 and Q2 demographics; Q3 familiarity with four tool categories; Q4 tasks (multi-select); Q5 verification of four output types; Q6 impact on five aspects of work; Q7 attitudes; Q8 and Q9 open-ended (current use and future skill needs)</td></tr>
<tr><td>Scales</td><td>Q3 mapped to 1–5 (not familiar to expert); Q5 collapsed to five ordered categories (never to always); Q6 mapped to 1–5 (no impact to significant); Q7 mapped to 1–7 (strongly disagree to strongly agree)</td></tr>
<tr><td>Analysis</td><td>Counts and percentages, combined low and high categories, and a thematic summary of the open-ended answers</td></tr>
</tbody>
</table>
</div>
</div>

## Your turn first

<div id="tv-you" class="w-demo"></div>

<div data-levels="public" markdown="1">
Students could pick as many tasks as applied. Two uses stand far ahead of the rest: debugging code (finding and fixing mistakes) and understanding complex concepts. Fewer than half of the students asked AI for a first draft of code, and about one in four used it to optimize a system.
</div>

<div data-levels="hs" markdown="1">
Each bar is a count out of 147. Debugging drew 118 students, and 118 ÷ 147 = 0.803, or 80.3 percent. Because students could pick several tasks, the percentages add to far more than 100. Notice the order: students lean on AI to explain and to repair, more than to create.
</div>

<div data-levels="ug" markdown="1">
Table 2 prints counts and percentages; every percentage reproduces as count ÷ 147, so the paper uses all completed surveys as the denominator. Initial code generation (47.6 percent) trails debugging (80.3 percent) by more than 30 points.
</div>

<div data-levels="grad res" markdown="1">
Q4 is multi-select, so its rows are 147 binary items, one per task. The table does not report how many tasks each student chose or which tasks travel together; the average below the chart comes from the column total and says nothing about that joint distribution.
</div>

## Which tools students know

<div id="tv-familiar" class="w-demo"></div>

<div data-levels="public" markdown="1">
Most students know general chatbots: seven in ten rate themselves intermediate or better. The picture flips for tools built for engineering work. About six in ten are not familiar with AI tools made for technical specialties, and each of the three specialized categories has exactly one self-described expert among 146 students. Try **Top box only** and **One box wider** to see how the headline changes with the line.
</div>

<div data-levels="hs" markdown="1">
Table 1 gives counts, so you can check every percentage: 72 intermediate LLM users out of 146 is 49.3 percent. Moving the line changes the story you can tell. At "intermediate or more," 101 students know LLMs; at "advanced or expert," only 29 do. Both statements are true, so a good report says where its line is.
</div>

<div data-levels="ug" markdown="1">
The abstract's three familiarity figures all follow from Table 1: 101 of 146 students at least intermediate with LLMs (69.2 percent), 120 of 146 novice or unfamiliar with code generation tools (82.2 percent), and 130 of 146 novice or unfamiliar with specialized technical tools (89.0 percent). For a department that teaches chip design, the last figure marks what the authors call a curricular gap: students meet AI as a chatbot long before they meet it inside the tools of their discipline.
</div>

<div data-levels="grad res" markdown="1">
Table 1 reports N = 146 on every row against 147 completed surveys, consistent with one student skipping Q3. The four rows are the same students rating four categories, so the contrast between LLMs and specialized tools is within-subject; the marginal table supports the description but not a paired test, which would need each student's four ratings.
</div>

## How often students check the output

<div id="tv-verify" class="w-demo"></div>

<div data-levels="public" markdown="1">
The paper's title comes from this table. When AI writes code, about two in three students check it most of the time or always. The share falls for technical explanations, again for research suggestions, and again for general writing, where fewer than half check that often. AI-written prose gets the least checking of the four.
</div>

<div data-levels="hs" markdown="1">
Look at the gap between the top and bottom rows: at the paper's line, 67.8 percent for code against 43.8 percent for general writing, a difference of 24 percentage points. Switch to **Top box only** ("always") and the gap shrinks to about 12 points; switch to **One box wider** and it lands near 17. General writing comes last at every line, while the other three rows trade places, so the safest claim is the one the line cannot move.
</div>

<div data-levels="ug" markdown="1">
At the paper's line the order runs code, explanations, research suggestions, writing. General writing stays last at every cut point the page offers, but counting "sometimes" as checking puts technical explanations ahead of code (89.1 against 87.0 percent), and the "always" box alone puts research suggestions ahead of explanations. The authors link this cautious, verification-oriented stance to their earlier microelectronics study. In an engineering course, that suggests where to teach verification explicitly: in the outputs students currently trust most, explanations and prose.
</div>

<div data-levels="grad res" markdown="1">
Table 3's "Total high" combines "most of the time" and "always," and "Total low" combines "never" and "rarely." The middle category ("sometimes") holds 19.2 to 32.2 percent of each row, the largest share for technical explanations. Four printed totals in this table (the high and low totals for explanations and for research suggestions) differ by 0.1 from the totals the underlying counts give; the last demo shows why.
</div>

## Where to draw the line

<div id="tv-line" class="w-demo"></div>

<div data-levels="public" markdown="1">
Students report the largest change in how they program and how they learn, and the smallest in how they write. In attitudes, most agree that AI has improved their understanding, and few say they rely on it heavily. Press **One box wider** on the attitudes table: counting "somewhat agree" as agreement raises the understanding share from 69.9 to 85.0 percent and doubles the reliance share from 9.7 to 20.6 percent. The answers stay the same; only the line moves.
</div>

<div data-levels="hs" markdown="1">
Agreement scales usually have an odd number of boxes, with "neither" in the middle. The paper counts only "agree" and "strongly agree" as agreement. Counting "somewhat agree" too is also a reasonable choice, and the page shows you what it does to each row. Ask yourself which line you would choose before you look, then check whether the order of the rows changes.
</div>

<div data-levels="ug" markdown="1">
For Table 4, the paper's line ("some" or "significant") puts programming approach first (36.6 percent) and writing approach last (18.6 percent); writing approach carries the largest "low" total (48.9 percent), with time management next (46.2 percent). For Table 5, the critical-thinking statement splits the group: 37.0 percent agree and 28.1 percent pick "neither," the largest neutral share in the table. Students credit AI with helping them understand far more often than with helping them think critically.
</div>

<div data-levels="grad res" markdown="1">
The paper's agreement line is the top two boxes of a seven-point scale. A top-three line is common in survey reporting, and here it changes the reliance figure the most in relative terms (9.7 to 20.6 percent). Both views come from the same marginal distribution; reporting the full distribution, as the paper's tables do, lets a reader apply either one.
</div>

<div data-levels="grad res" markdown="1">
## The counts behind the percentages

<div id="tv-counts" class="w-demo"></div>

Tables 3 to 5 print percentages with one decimal and no counts. Because each row comes from at most 147 students, only a few whole-number counts can round to each printed value, and the page searches every sample size from 1 to 147 for counts that reproduce the whole row. Every one of the 13 rows has exactly one solution: 146 respondents for six rows and 145 for seven, consistent with the "handful of non-responses" the paper mentions. With the counts in hand, the printed totals split into two kinds. Some equal the share computed from the counts, and some equal the sum of the already-rounded parts; the abstract's 56.8 percent for technical explanations is the first kind, and Table 3's 56.9 percent is the second. These counts and the Wilson intervals are computed by this page, not reported by the paper.
</div>

## What the paper found

<div data-levels="public" markdown="1">
- Students know general AI chatbots well, but few have used AI tools built for engineering specialties.
- They use AI most to debug code and to understand hard concepts, and less to write code from scratch.
- They check AI-written code more often than AI-written explanations, research suggestions, or writing.
- They report the largest change in how they program and learn, and the smallest in how they write.
- Most agree AI has improved their understanding; few say they rely on it heavily.
</div>

<div data-levels="hs" markdown="1">
- 69.2 percent rate themselves at least intermediate with large language models; 89.0 percent are novices or unfamiliar with specialized technical AI tools.
- 80.3 percent use AI to debug code and 77.6 percent to understand complex concepts; 47.6 percent use it to generate first drafts of code.
- 67.8 percent check AI-written code most of the time or always, against 43.8 percent for general writing.
- 36.6 percent report some or significant change in how they program, against 18.6 percent in how they write.
- 69.9 percent agree AI has improved their understanding; 9.7 percent describe themselves as heavily reliant on it.
</div>

<div data-levels="ug grad res" markdown="1">
- **Familiarity follows generality.** 69.2 percent at least intermediate with LLMs; 82.2 percent novice or unfamiliar with code generation tools and 89.0 percent with specialized technical tools (Table 1).
- **Debugging and explanation lead.** Debugging (80.3 percent) and understanding complex concepts (77.6 percent) lead; initial code generation (47.6 percent) and system optimization (23.8 percent) trail (Table 2).
- **Verification tracks the output.** Code is checked most of the time or always by 67.8 percent, technical explanations by 56.9, research suggestions by 48.9, and general writing by 43.8 (Table 3).
- **Programming and learning change most.** Some or significant impact: programming approach 36.6 percent, learning approach 33.1, time management 28.3, problem-solving approach 19.3, and writing approach 18.6 (Table 4).
- **Benefit without dependence.** 69.9 percent agree AI has improved their understanding and 60.3 percent that it helps them troubleshoot; 37.0 percent credit it with supporting critical thinking, and 9.7 percent report heavy reliance (Table 5).
- **The open-ended answers** describe efficiency gains tempered by concerns about accuracy, dependence, and the erosion of routine skills.
</div>

<div data-levels="grad res" markdown="1">
<div class="tv-study-wrap">
<table class="results-table">
<caption class="w-note">Printed totals at the paper's line, with the respondents and counts the page recovers. Rows marked † print a total that differs by 0.1 from the share the counts give.</caption>
<thead><tr><th>Row</th><th>N (page)</th><th>Counts, lowest to highest box (page)</th><th>Printed total</th><th>From counts</th></tr></thead>
<tbody>
<tr><td>Table 3 · Code</td><td>146</td><td>5, 14, 28, 68, 31</td><td>67.8</td><td>67.8</td></tr>
<tr><td>Table 3 · Technical explanations †</td><td>146</td><td>5, 11, 47, 68, 15</td><td>56.9</td><td>56.8</td></tr>
<tr><td>Table 3 · Research suggestions †</td><td>145</td><td>13, 21, 40, 54, 17</td><td>48.9</td><td>49.0</td></tr>
<tr><td>Table 3 · General writing</td><td>146</td><td>12, 32, 38, 51, 13</td><td>43.8</td><td>43.8</td></tr>
<tr><td>Table 4 · Problem-solving approach</td><td>145</td><td>14, 36, 67, 19, 9</td><td>19.3</td><td>19.3</td></tr>
<tr><td>Table 4 · Learning approach</td><td>145</td><td>9, 35, 53, 31, 17</td><td>33.1</td><td>33.1</td></tr>
<tr><td>Table 4 · Time management</td><td>145</td><td>26, 41, 37, 35, 6</td><td>28.3</td><td>28.3</td></tr>
<tr><td>Table 4 · Programming approach</td><td>145</td><td>6, 29, 57, 43, 10</td><td>36.6</td><td>36.6</td></tr>
<tr><td>Table 4 · Writing approach</td><td>145</td><td>35, 36, 47, 18, 9</td><td>18.6</td><td>18.6</td></tr>
<tr><td>Table 5 · Understanding</td><td>146</td><td>4, 4, 0, 14, 22, 69, 33</td><td>69.9</td><td>69.9</td></tr>
<tr><td>Table 5 · Troubleshooting</td><td>146</td><td>3, 8, 2, 17, 28, 59, 29</td><td>60.3</td><td>60.3</td></tr>
<tr><td>Table 5 · Critical thinking</td><td>146</td><td>7, 18, 3, 41, 23, 37, 17</td><td>37.0</td><td>37.0</td></tr>
<tr><td>Table 5 · Reliance</td><td>145</td><td>15, 42, 19, 39, 16, 9, 5</td><td>9.7</td><td>9.7</td></tr>
</tbody>
</table>
</div>
</div>

## What the authors recommend

<div data-levels="public hs" markdown="1">
The authors turn the findings into four steps for engineering programs. Teach students what AI is and how to use it responsibly as part of regular courses. Grade the checking, so that assignments reward students for critiquing and verifying AI output. Introduce the specialized AI tools of each engineering field in stages, since most students have never used them. Ultimately, tie all of this to the skills engineering programs already promise their graduates, so that AI literacy becomes part of what an engineering degree means.
</div>

<div data-levels="ug grad res" markdown="1">
<div class="tv-study-wrap">
<table class="results-table">
<caption class="w-note">The paper's four recommendations, each paired by this page with a finding it addresses.</caption>
<thead><tr><th>Recommendation (paper's wording)</th><th>Related finding (page's pairing)</th></tr></thead>
<tbody>
<tr><td>Embed AI literacy and responsible use</td><td>Broad, informal adoption: 80.3% debug with AI, mostly with general LLMs</td></tr>
<tr><td>Design for verification and critique</td><td>Verification falls from 67.8% for code to 43.8% for general writing</td></tr>
<tr><td>Scaffold domain-specific AI tools</td><td>89.0% novice or unfamiliar with specialized technical AI tools</td></tr>
<tr><td>Align with evolving outcome frameworks</td><td>Students already report changes in how they program (36.6%) and learn (33.1%)</td></tr>
</tbody>
</table>
</div>

The authors propose extending the survey to multiple institutions and disciplines, adding longitudinal follow-up, and folding a qualitative analysis of the students' written answers into the design of AI-aware courses.
</div>

## Why it matters

<div data-levels="public hs" markdown="1">
Engineers sign off on designs that other people trust with their safety, from power grids to medical devices. As AI tools enter that work, the habit of checking a confident answer becomes part of engineering itself. This survey shows that students already have that habit for code and need help extending it to everything else AI produces.
</div>

<div data-levels="ug" markdown="1">
Course policies on AI often swing between banning it and ignoring it. This survey gives a department a baseline to plan from: what its students already use, what they have never seen, and where their verification habits are thin. The same nine questions can be rerun each year, which turns a one-time snapshot into a measure of whether new course designs change practice.
</div>

<div data-levels="grad res" markdown="1">
The paper contributes a reusable instrument, now applied in a graduate microelectronics seminar and a sample of 147 engineering students, and a set of tables complete enough to recover their counts. That completeness matters: with every distribution printed, other programs can compare their own students against these 147 at any cut point they choose, and later waves of the same survey can be compared row by row.
</div>

<div data-levels="res" markdown="1">
## Notes from building this page

- **Respondents per row.** The recovered counts imply 146 respondents on six of the 13 rows in Tables 3 to 5 and 145 on the other seven, and Table 1 prints N = 146. Reporting N per row in each table would make these explicit; the solutions are unique for N from 1 to 147.
- **Two kinds of totals.** Of the 13 printed high or agree totals, 11 match the share computed from the recovered counts and 10 match the sum of the rounded parts; the two methods disagree on five rows. Table 3's differing totals (technical explanations, research suggestions) follow the rounded parts, while Table 4's time management and Table 5's critical thinking and reliance follow the counts. The abstract's 56.8 percent and Table 3's 56.9 percent for technical explanations are the same 83 of 146 students, computed the two ways.
- **Paired data.** Every table compares rows answered by the same students, so the contrasts the paper draws (code against writing, LLMs against specialized tools) are within-subject. Testing them would need the item-level responses, for example a McNemar test on each pair of verification items at the paper's line.
- **Sample and title.** The sample is electrical and computer engineering students, and the "disciplines" in the title correspond to tracks within that department (59.9 percent comprehensive). The authors' proposed multi-institution, multi-discipline extension would test whether the pattern holds outside it.
- **Interval estimates.** At the paper's line, the Wilson 95 percent intervals run about ±5 to ±8 percentage points (for example, 59.9 to 74.8 percent for verifying code). They describe sampling variability only and assume a simple random sample, which a voluntary departmental survey is not.
- **Smaller points.** Table 5 labels the reliance statement "Reliant on…" and the Methods list its topics as understanding, reliance, learning from mistakes, and critical thinking, so the page uses the row labels without full item wording. The Introduction cites reference 16 twice in one bracket.
</div>

<div data-levels="hs" markdown="1">
## Try this in class

1. Ask your class the paper's verification question for two kinds of AI output, code and writing: "How often do you check it: never, rarely, sometimes, most of the time, or always?" Record the count in each box for both.
2. Turn each count into a percentage of the class, rounded to one decimal. Then compute the "most of the time or always" total two ways: from the counts, and by adding the two rounded percentages. Note whether the two totals agree.
3. Compare your class with the 147 students in the **How often students check the output** demo, and write two sentences on where your class draws its own line between checking and trusting.
</div>

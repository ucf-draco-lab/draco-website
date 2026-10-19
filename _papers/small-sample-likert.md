---
title: "Seventeen Campers: Weighing Survey Evidence When the Group Is Small"
kicker: "Interactive paper · Problems of Education in the 21st Century 2024"
subtitle: "An interactive companion to Kilty, Kilty, Borowczak, and Borowczak's study of a week-long computer science camp, where 17 campers were too few for the usual survey statistics and the authors turned to exact probabilities instead."
description: "Place the campers' answers, fill empty survey boxes with a Dirichlet prior, and recompute the likelihood ratios a small computer science summer camp used to weigh what changed over one week."
share_description: "Seventeen campers, one week of computer science, and a survey too small for the chi-squared test. See how the authors weighed the evidence with exact probabilities, step by step. Written for five reading levels."
share_text: "Seventeen campers were too few for the usual survey statistics. See how a computer science camp study weighed its evidence with exact probabilities:"
share_image: /papers/small-sample-likert/share.png
share_image_alt: "Dot plot of 17 campers' answers to the statement I rarely feel relaxed within a group, before and after camp, next to the title Seventeen Campers."
date: 2026-10-18
topics: ["Education"]
default_level: public
level_hints:
  public: No background needed
  hs: Percentages, fractions, and a little probability
  ug: Intro statistics and research methods
  grad: Probability models and hypothesis testing
  res: Full method, reproduction, and open questions
authors:
  - name: Trina Johnson Kilty
    affiliation: University of Wyoming
  - name: Kevin T. Kilty
    affiliation: University of Wyoming
  - name: Andrea C. Borowczak
    affiliation: University of Central Florida
    member: andrea-borowczak
  - name: Mike Borowczak
    affiliation: University of Central Florida
    member: mike-borowczak
sources:
  - venue: "Problems of Education in the 21st Century 82(4):507–520 · 2024"
    title: "Quantitative Techniques with Small Sample Sizes: An Educational Summer Camp Example"
    url: https://doi.org/10.33225/pec/24.82.507
    access: Open access
citations:
  - "1742"
widget:
  css:
    - /papers/small-sample-likert/widget.css
  js:
    - /papers/small-sample-likert/likert-engine.js
    - /papers/small-sample-likert/widget.js
credit: "Interactive page by the [DRACO Lab](/). Every count comes from the paper's Tables 1 and 2. The page recomputes the paper's probabilities and likelihood ratios in your browser and matches Table 1's probabilities, its pooled ratio of 0.819, Table 2's ratio of 12.1, and the 7.6 percent posterior. The exact test and Bayes factor at the graduate and researcher levels are the page's own, checked against an independent SciPy implementation. Everything runs on your device."
bibtex: |
  @article{kilty2024small,
    author  = {Kilty, Trina Johnson and Kilty, Kevin T. and Borowczak, Andrea C. and Borowczak, Mike},
    title   = {Quantitative Techniques with Small Sample Sizes: An Educational Summer Camp Example},
    journal = {Problems of Education in the 21st Century},
    volume  = {82},
    number  = {4},
    pages   = {507--520},
    year    = {2024},
    doi     = {10.33225/pec/24.82.507}
  }
---

<div class="lede" data-levels="public" markdown="1">
In the summers of 2022 and 2023, a week-long camp introduced children ages 10 to 14 to computer science through games and puzzles. On the first morning and again on the last afternoon, campers answered surveys about computer science and about working in groups. Only 17 campers answered both times, and most survey statistics need far more people than that. Trina Johnson Kilty, Kevin T. Kilty, Andrea C. Borowczak, and Mike Borowczak showed how to weigh the answers anyway, using probabilities a spreadsheet can compute exactly. This page walks through their method on the one survey statement the paper reports in full.
</div>

<div class="lede" data-levels="hs" markdown="1">
Surveys often ask people to pick from five answers, from "not at all true of me" to "very true of me." With hundreds of people, the shares in each box settle down and standard tests work well. With 17 people, one person changes a box by six percentage points, and some boxes stay empty. This paper, from a computer science summer camp, treats each answer as a roll of a five-sided die, estimates the die's weights from the before-camp answers, and asks how well those weights explain the after-camp answers. You can redo every step below.
</div>

<div class="lede" data-levels="ug" markdown="1">
Small outreach programs rarely enroll enough participants for Pearson's chi-squared test, whose usual rule of thumb asks for an expected count of at least five in every category. Kilty, Kilty, Borowczak, and Borowczak analyze pre- and post-camp Likert responses from two small cohorts (nine campers in 2022, eight in 2023) with a multinomial probability model. They estimate category probabilities with a Bayesian prior that keeps empty categories from receiving probability zero, compare responses with likelihood ratios, and convert a ratio into a posterior probability with Bayes' theorem.
</div>

<div class="lede" data-levels="grad" markdown="1">
A methods paper built on a one-group pre/post design. Two cohorts of a week-long, unplugged computer science camp (N = 9 and N = 8 with paired surveys) answered a 12-item attitude-toward-computer-science scale and a 30-item feelings-toward-group-work scale. The authors model each item's responses as multinomial, estimate category probabilities as Dirichlet(1, …, 1) posterior means, test whether the cohorts can be pooled, and weigh the pre/post change with a likelihood ratio, treating ratios inside 1/8 to 8 as weak evidence. They report the full computation for one item, GW27 ("I rarely feel relaxed within a group").
</div>

<div class="lede" data-levels="res" markdown="1">
Kilty, Kilty, Borowczak, and Borowczak (2024) argue for exact likelihood methods over Pearson's chi-squared approximation in survey studies with fewer than 25 participants, citing Cochran (1952) on the arbitrariness of the expected-count rule and Royall (1997) on the likelihood ratio as a measure of evidence. The worked example is GW27 from the Cantrell and Andrews (2002) group-work instrument, with counts printed in Tables 1 and 2. This page reproduces the printed probabilities, both likelihood ratios that follow one consistent rule, and the 7.6 percent posterior. At the graduate and researcher levels it adds an exact multinomial test and a Bayes factor, labeled as the page's own, and its notes record where the printed numbers and the stated method part ways.
</div>

## The camp and the surveys

<div data-levels="public hs" markdown="1">
The camp skipped programming and taught computing ideas with games and puzzles: how strangers can trust a shared record, how information gets encoded and transformed, and how a blockchain links its pieces together. Computer science graduate students led the week, with undergraduates helping. In 2022, 10 campers enrolled and nine answered both surveys; in 2023, all eight did. A gift to the university's foundation from a U.S. cryptocurrency exchange and bank paid for part of the camps.
</div>

<div data-levels="ug grad res" markdown="1">
<div class="sl-study-wrap">
<table class="results-table">
<caption class="w-note">Design of the study, from the paper's methods section.</caption>
<thead><tr><th>Element</th><th>What the paper reports</th></tr></thead>
<tbody>
<tr><td>Camp</td><td>One week, campers ages 10 to 14, summers 2022 and 2023; unplugged games and puzzles on distributed trust, encoding and transforming information, and blockchain structures</td></tr>
<tr><td>Staff</td><td>Computer science graduate students, assisted by undergraduates</td></tr>
<tr><td>Participants</td><td>2022: 20 planned, 10 enrolled, 9 with both surveys. 2023: 8 with both surveys, more girls than in 2022. Unpaired surveys removed. N = 17</td></tr>
<tr><td>Instruments</td><td>Attitude toward computer science (Rachmatullah et al., 2020), 12 items, strongly disagree to strongly agree. Feelings toward group work (Cantrell and Andrews, 2002), 30 items in five categories, "not at all true of me" to "very true of me." Both five-point scales with a neutral midpoint</td></tr>
<tr><td>Timing</td><td>Pre: first hour of day one. Post: last hour of the last day</td></tr>
<tr><td>Analysis</td><td>Multinomial model per item; Dirichlet-smoothed probabilities; likelihood ratios with 1/8 to 8 as the band of weak evidence; Bayes update from even prior odds</td></tr>
<tr><td>Ethics and funding</td><td>University of Wyoming IRB approval (August 19, 2022), camper assent and guardian consent; part of a gift to the university foundation from a U.S. cryptocurrency exchange and bank</td></tr>
</tbody>
</table>
</div>
</div>

## One statement, seventeen campers

<div id="sl-campers" class="w-demo"></div>

<div data-levels="public" markdown="1">
Each dot is one camper's answer to "I rarely feel relaxed within a group." Before camp, the 2022 and 2023 campers answered in similar ways. After a week of group games and puzzles, more campers moved toward "neutral" and "true of me," meaning more of them said they rarely feel relaxed in a group. Add your own answer to see how much one person moves the picture when the whole group fits on one screen.
</div>

<div data-levels="hs" markdown="1">
The statement is worded in the negative, so agreeing with it means feeling less relaxed. Before camp, nine of 17 campers picked neutral or a "true of me" answer; after camp, 12 did. Count the dots in the "very true" column: two before, four after. With 17 people, that change of two campers is about 12 percentage points, which is why the authors wanted a method that weighs the whole pattern instead of one box at a time.
</div>

<div data-levels="ug" markdown="1">
Pearson's chi-squared test compares observed counts with the counts expected under no change. Here, the expected after-camp counts (dashed outlines, from the smoothed before-camp probabilities) run from 2.3 to 4.6, all below the dotted line at five. The authors take this as the reason to drop the chi-squared approximation and compute probabilities exactly. The after-camp answers are reported only as pooled counts, so the page cannot color them by year.
</div>

<div data-levels="grad res" markdown="1">
The design has no comparison group, and the same 17 campers produced both rows, so the before and after counts are paired observations reported as two marginal distributions. The paper's analysis, and every computation on this page, treats them as two samples. The cohorts differed in composition (more girls in 2023), which the authors connect to pre-camp differences on the computer science scale, not on GW27.
</div>

## Filling empty boxes

<div id="sl-prior" class="w-demo"></div>

<div data-levels="public" markdown="1">
To compare before and after, the authors first estimate how likely each answer is. Using raw shares has a problem: a box nobody picked gets a chance of zero, as if that answer could never happen. The paper adds one imaginary answer to every box before dividing. Press **Three campers** to see the difference: with raw shares, three of the five boxes become impossible; with the paper's prior, every box keeps a small chance.
</div>

<div data-levels="hs" markdown="1">
The paper's rule for each box is (1 + count) ÷ (5 + total). For the nine campers in 2022, the first box held one answer, so its estimate is (1 + 1) ÷ (5 + 9) = 2 ÷ 14 ≈ 0.143. Change the counts and watch the two bars: the prior pulls small groups gently toward equal chances (0.2 each), and its pull fades as more answers arrive.
</div>

<div data-levels="ug" markdown="1">
The estimator p<sub>i</sub> = (1 + f<sub>i</sub>) / (k + N) is Laplace's rule of succession generalized to k = 5 categories. Choose a preset with the paper's prior to see the check mark: the 2022 column and the pooled column of Table 1 both reproduce to all three printed decimals. Every later calculation on this page uses these smoothed probabilities.
</div>

<div data-levels="grad res" markdown="1">
With a symmetric Dirichlet(α) prior and multinomial counts f, the posterior is Dirichlet(α + f), and its mean is (α + f<sub>i</sub>) / (kα + N). The paper uses α = 1, citing Johnson and Christensen (2012). The choice matters at this size: for the 2022 cohort, α = 1 moves the largest category from 0.333 (raw) to 0.286, and α = 5 moves it to 0.235. A sensitivity check over α would be a natural companion to the reported ratios.
</div>

## Weighing the evidence

<div id="sl-evidence" class="w-demo"></div>

<div data-levels="public" markdown="1">
The authors weigh evidence with a likelihood ratio: how probable one set of answers is compared with another under the same assumption. Start with **2022 vs. 2023**. The two years come out close to equal (0.819), so the authors treated the 17 campers as one group. Then switch to **Before vs. after**. Under the assumption that camp changed nothing, the after-camp answers come out 12.1 times less probable than the before-camp answers, past the authors' cutoff of eight for strong evidence. Move the after-camp answers yourself and watch the ratio respond.
</div>

<div data-levels="hs" markdown="1">
Each answer works like one roll of a weighted five-sided die. The chance of a whole set of answers multiplies the chance of each answer, then counts how many orders could produce the same set. The authors use a band from 1/8 to 8: ratios inside it are too weak to call. Pooling the years gave 0.819 (inside the band); before against after gave 12.1 (outside it). Bayes' theorem then turns 12.1 into a change of belief: starting from a 50 percent belief that camp changed nothing, the belief drops to 7.6 percent. Try the belief slider to see how the starting point matters.
</div>

<div data-levels="ug" markdown="1">
The table shows the multinomial probability N! / (x<sub>1</sub>! ⋯ x<sub>5</sub>!) · ∏ p<sub>i</sub><sup>x<sub>i</sub></sup> of each set of counts under the no-change probabilities. The printed ratios are those probabilities divided one by the other: 0.819 for 2022 over 2023 under the pooled probabilities, and 12.1 for before over after under the before-camp probabilities. The Bayes step uses P(no change | data) = p / (p + (1 − p) · LR); with p = 0.5 and LR = 12.1, that is 1 / 13.1 ≈ 7.6 percent.
</div>

<div data-levels="grad res" markdown="1">
Two details decide whether the printed values reproduce. First, the multinomial coefficient: the Methods section writes only ∏ p<sub>i</sub><sup>x<sub>i</sub></sup>, yet without the coefficient the before/after ratio is 1.15, and with it 12.15. Second, rounding: with probabilities rounded to the three printed decimals the ratio is 12.12, which prints as 12.1; unrounded it would print as 12.2. Use the two checkboxes to see each effect. The Methods section defines the likelihood ratio as P(A | H1) / P(A | H0) for one data set A under two hypotheses; that version, labeled as the page's own, appears below the Bayes readout.
</div>

<div data-levels="grad res" markdown="1">
## Exact tail probabilities

<div id="sl-exact" class="w-demo"></div>

The paper points to exact multinomial tests (Resin, 2023; Engels' XNomial) as alternatives but reports none. This demo runs one: it holds the smoothed before-camp probabilities fixed and enumerates all 5,985 ways 17 answers can fill five boxes. At the paper's counts, the exact p-values are 0.258 for Pearson's X², 0.267 for G, and 0.234 when tables are ordered by their own probability. The chi-squared approximation gives 0.258 for X², almost exactly the enumerated value, even though every expected count sits below five, a small illustration of Cochran's point that the rule of five is a rough guide. The Dirichlet-multinomial Bayes factor for "different distributions" against "one shared distribution" is 0.39. These figures come from the page, not the paper, and they rest on the same two-sample assumption as the paper's ratio.
</div>

## What the paper found

<div data-levels="public" markdown="1">
- The 2022 and 2023 campers answered the group-work statement in similar ways before camp, so the authors combined them.
- After camp, more campers said they rarely feel relaxed in a group, and the authors weighed that shift as strong evidence of change (a ratio of 12.1).
- Campers ended the week less positive about enjoying group work and about how well groups work.
- One computer science statement moved up: more campers agreed with "I would like to use creativity and innovation in my future."
- The authors read the results as campers tempering their first enthusiasm with the realities of programming and teamwork, and they recommend structuring group work more carefully in future camps.
</div>

<div data-levels="hs" markdown="1">
- Combining the two years was reasonable: the ratio comparing them (0.819) sat well inside the 1/8 to 8 band.
- Before against after on the group-work statement gave 12.1, and Bayes' theorem turned an even starting belief in "no change" into 7.6 percent.
- Group-work attitudes became more neutral to negative, including comfort working and communicating in a group.
- The creativity statement on the computer science survey shifted toward "true."
- Before camp, girls (more numerous in 2023) were somewhat less sure that computer science would help their future careers.
</div>

<div data-levels="ug grad res" markdown="1">
- **The cohorts could be pooled.** Pre-camp GW27 responses gave a likelihood ratio of 0.819 under the pooled probabilities, inside the authors' 1/8 to 8 band (Table 1).
- **GW27 shifted toward agreement.** Pooled counts moved from 4, 4, 5, 2, 2 to 1, 4, 7, 1, 4; the printed ratio is 12.1, and the posterior probability of no change falls from 50 to 7.6 percent (Table 2).
- **Group-work attitudes cooled.** Campers became more neutral to negative about comfort working and communicating in a group, and less positive about enjoying group work and its effectiveness.
- **One computer science item rose.** "I would like to use creativity and innovation in my future" moved toward "somewhat true" and "very true," which the authors link to the camp's creative activities.
- **The method travels.** The authors argue that exact likelihood ratios work at any sample size, depend only on observed data, and run in a spreadsheet or in R.
</div>

<div data-levels="grad res" markdown="1">
<div class="sl-study-wrap">
<table class="results-table">
<caption class="w-note">GW27 counts and the printed values (Tables 1 and 2), with the page's recomputation under one rule: multinomial coefficient included, probabilities rounded to three decimals.</caption>
<thead><tr><th>Quantity</th><th>Not at all</th><th>Partly not</th><th>Neutral</th><th>Partly true</th><th>Very true</th><th>Printed</th><th>Page</th></tr></thead>
<tbody>
<tr><td>2022, before (N = 9)</td><td>1</td><td>3</td><td>3</td><td>1</td><td>1</td><td></td><td></td></tr>
<tr><td>2023, before (N = 8)</td><td>3</td><td>1</td><td>2</td><td>1</td><td>1</td><td></td><td></td></tr>
<tr><td>Pooled, before (N = 17)</td><td>4</td><td>4</td><td>5</td><td>2</td><td>2</td><td></td><td></td></tr>
<tr><td>Pooled, after (N = 17)</td><td>1</td><td>4</td><td>7</td><td>1</td><td>4</td><td></td><td></td></tr>
<tr><td>p<sub>i</sub>, 2022 only</td><td>0.143</td><td>0.286</td><td>0.286</td><td>0.143</td><td>0.143</td><td>✓</td><td>✓</td></tr>
<tr><td>p<sub>i</sub>, pooled before</td><td>0.227</td><td>0.227</td><td>0.273</td><td>0.136</td><td>0.136</td><td>✓</td><td>✓</td></tr>
<tr><td>Ratio 2022 / 2023, pooled p</td><td colspan="5"></td><td>0.819</td><td>0.819</td></tr>
<tr><td>Ratio 2022 / 2023, 2022-only p</td><td colspan="5"></td><td>2.6</td><td>3.43</td></tr>
<tr><td>Ratio before / after, pooled before p</td><td colspan="5"></td><td>12.1</td><td>12.1</td></tr>
<tr><td>P(no change), even prior</td><td colspan="5"></td><td>7.6%</td><td>7.6%</td></tr>
</tbody>
</table>
</div>
</div>

## Why it matters

<div data-levels="public hs" markdown="1">
Camps, clubs, and teacher workshops often serve a dozen or two people at a time, and their organizers still need to know what worked. This paper gives them a way to put numbers next to what they observe, using arithmetic that fits in a spreadsheet. Ultimately, the camp's own result is a useful one for anyone who runs group activities with children: a week of teamwork can leave campers more cautious about groups, and that is worth planning for.
</div>

<div data-levels="ug" markdown="1">
Much of engineering and computing outreach runs at a scale where standard tests are unreliable, so evaluations fall back on description alone. The authors show a quantitative path that stays exact at any N and adds a Bayesian reading of the evidence. Paired with the qualitative observations from the camp, it gave the team a second line of evidence, and it pointed to a concrete design change: structure the group work more deliberately.
</div>

<div data-levels="grad res" markdown="1">
Small-N evaluation is the norm in informal STEM education, and the paper models a transparent, reproducible calculation that any program evaluator can audit, down to the prior. Its broader contribution is the framing: report the full counts, state the prior, and weigh evidence on a likelihood scale. This page adds the exact multinomial distribution and a Bayes factor so readers can compare the likelihood-ratio reading with the frequentist and fully Bayesian readings of the same 17 answers.
</div>

<div data-levels="res" markdown="1">
## Notes from building this page

- **What the printed ratios compute.** Under one rule (multinomial coefficient included, probabilities rounded to three decimals), Table 1's pooled ratio is P(2022 counts | pooled p) / P(2023 counts | pooled p) = 0.819, and Table 2's ratio is P(before counts | before p) / P(after counts | before p) = 12.12. Both match the printed values. That ratio compares two data sets under one hypothesis, while the Methods define the likelihood ratio as one data set under two hypotheses, P(A | H1) / P(A | H0), and the Bayes step uses 12.1 in that second sense. The paper's statement that the after-camp frequencies are "12.1 times more likely under the alternative" therefore describes a different quantity from the one computed.
- **The Methods version of the ratio.** P(after counts | after p) / P(after counts | before p) is 15.4 with both probability sets smoothed. Because the alternative is estimated from the same 17 answers it is tested on, this ratio exceeds one for almost any data, which a fixed 1/8 to 8 band does not account for.
- **Table 1's 2.6.** The rule that reproduces 0.819 gives 3.43 for the 2022-only column. The closest reading the page found is P(2023 counts | pooled p) / P(2023 counts | 2022-only p), which gives 2.62 with rounded probabilities and 2.66 without.
- **The exact test and Bayes factor.** The page's exact multinomial test (p = 0.23 to 0.27, depending on the ordering) and the Dirichlet-multinomial Bayes factor (0.39, favoring one shared distribution) both read the GW27 shift as within what 17 answers produce by chance. Both, like the paper's ratio, treat the before-camp probabilities as fixed and the two administrations as independent. A paired analysis would need each camper's two answers, which the paper does not report.
- **Multiplicity.** GW27 is one of 42 items, and the paper reports full counts only for it. Selecting the item with the largest shift for the worked example would inflate any single-item measure of evidence; the paper does not say how GW27 was chosen.
- **Smaller points.** Table 2's header reads "LR (Before/After)" while the text describes after over before. The computer science scale is described as 12 items in the Methods and nine in the Discussion. The group-work instrument is cited as Cantrell and Andrews in the text and Cantwell and Andrews in the references. The published record lists Andrea C. Borowczak as A. C. Burrows Borowczak; this page uses the byline she prefers.
</div>

<div data-levels="hs" markdown="1">
## Try this in class

1. Before an activity, ask the class to rate one statement (for example, "I enjoy working in a group") on a five-point scale, and record the counts in each box. Repeat the same statement after the activity.
2. Use the paper's rule, (1 + count) ÷ (5 + total), to turn the before-activity counts into five probabilities. Check that they add to one.
3. Enter the after-activity counts in the **Filling empty boxes** demo to check your arithmetic, then write two sentences on how many students would have to change their answers before you would call the shift real for a group your size.
</div>

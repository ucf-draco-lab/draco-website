---
title: "Soft Skills, Hard Numbers: Six Questions Before and After One Class"
kicker: "Interactive paper · ASEE First Year Engineering Experience 2017"
subtitle: "An interactive companion to Andrea C. Borowczak and Mike Borowczak's baseline study of what 55 engineering and computing undergraduates knew about ABET's professional skills, partnerships, and conflict, and how far one class session moved 18 of them."
description: "Answer the paper's six questions on ABET, partnerships, and conflict, follow the two cohorts behind the study, compare pre- and post-test scores by question and class standing, and, at the graduate and researcher levels, rebuild the class's scores from the printed tables."
share_description: "Before one class session, 18 computing students averaged 3 to 21 percent on six questions about ABET, partnerships, and conflict. Afterward: 67 to 96 percent. Seniors started no higher than freshmen. Explore the study at five reading levels."
share_text: "Six questions on ABET, teamwork, and conflict, asked before and after one class. See how 55 engineering students did:"
share_image: /papers/freshman-soft-skills/share.png
share_image_alt: "Pre-test and post-test averages for six questions on ABET, partnerships, and conflict, rising from between 3 and 21 percent to between 67 and 96 percent, beside the title Soft Skills, Hard Numbers."
date: 2026-10-20
topics: ["Education"]
default_level: public
level_hints:
  public: No background needed
  hs: Percentages and averages
  ug: Engineering coursework and intro statistics
  grad: Survey design and statistical tests
  res: Full design, reconstruction, and open questions
authors:
  - name: Andrea C. Borowczak
    affiliation: University of Wyoming
    member: andrea-borowczak
  - name: Mike Borowczak
    affiliation: University of Wyoming
    member: mike-borowczak
sources:
  - venue: "ASEE First Year Engineering Experience (FYEE) Conference · Daytona Beach, FL · 2017"
    title: "Hardening Freshman Engineering Student Soft Skills"
    url: https://doi.org/10.18260/1-2--29416
    access: Free to read
citations:
  - borowczak2017harden
widget:
  css:
    - /papers/freshman-soft-skills/widget.css
  js:
    - /papers/freshman-soft-skills/ss-engine.js
    - /papers/freshman-soft-skills/widget.js
credit: "Interactive page by the [DRACO Lab](/). Every percentage comes from the paper's Tables I to V and its participants section. The page rebuilds Table IV's means from Tables II and III and reproduces the printed p > 0.85 for Table V as a two-tailed variance-ratio F-test on the six question averages (F(5, 5) = 0.839, p = 0.852). At the graduate and researcher levels it searches every list of 18 partial-credit scores that reproduces Tables II to IV, and bounds the paired t-test from them; its search and tests match an independent SciPy implementation exactly. Reconstructed scores and the tests labeled as the page's are the page's own. Everything runs on your device."
bibtex: |
  @inproceedings{borowczak2017harden,
    author    = {Borowczak, Andrea C. and Borowczak, Mike},
    title     = {Hardening Freshman Engineering Student Soft Skills},
    booktitle = {2017 ASEE First Year Engineering Experience (FYEE) Conference},
    address   = {Daytona Beach, FL},
    year      = {2017},
    month     = {August},
    publisher = {ASEE Conferences},
    doi       = {10.18260/1-2--29416},
    url       = {https://peer.asee.org/29416}
  }
---

<div class="lede" data-levels="public" markdown="1">
Engineers rarely work alone, so engineering programs are expected to teach teamwork, communication, and ethics alongside math and design. Andrea C. Borowczak and Mike Borowczak asked 55 undergraduates at the University of Wyoming six short questions about those skills, from what the accreditation board for engineering programs is to how people approach a conflict. Most students, seniors included, could answer little. Then 18 of them spent one class session on a team game and a short explanation, and their scores jumped. This page lets you take the same six questions and explore what the students wrote.
</div>

<div class="lede" data-levels="hs" markdown="1">
ABET (the Accreditation Board for Engineering and Technology) checks that college engineering and computing programs teach what they promise, including "soft skills" such as teamwork and communication. The authors gave six open questions on ABET, partnerships, and conflict to 55 students, then retaught the material to 18 of them in one class and asked again. Before: averages from 2.78 to 21.11 percent. After: 66.67 to 95.56 percent. Every chart below is built from the averages in the paper's five tables.
</div>

<div class="lede" data-levels="ug" markdown="1">
ABET's student outcomes for engineering and computing programs include six professional ("soft") skills: functioning on multidisciplinary teams, professional and ethical responsibility, communication, understanding the impact of engineering solutions, lifelong learning, and knowledge of contemporary issues. This baseline study asked whether undergraduates know those outcomes exist and whether they can name the parts of a working partnership and of a conflict. A one-session intervention in a junior and senior computing elective raised every question's average by 64 to 79 percentage points, and an F-test found no difference between early and upper-level students on the pre-test.
</div>

<div class="lede" data-levels="grad" markdown="1">
A quantitative baseline with two convenience cohorts: 18 students in a junior and senior computing elective took a six-item open-response test before and after a single class session (team game plus instruction), and 37 undergraduates answered the same items once in an anonymous end-of-year survey. The paper reports per-item means and standard deviations, paired two-tailed t-test bounds (p < 10<sup>−4</sup> to 10<sup>−7</sup>), and an F-test comparing early (n = 16) and upper-level (n = 39) students (p > 0.85). The page reproduces the printed tables and, at this level, the tests behind them.
</div>

<div class="lede" data-levels="res" markdown="1">
Borowczak and Borowczak (2017) measure undergraduate knowledge of ABET's professional-skill outcomes, partnership components, and conflict types and approaches, and report large pre-post gains from one session alongside no early-versus-upper difference at baseline. The paper prints means and standard deviations but no item-level scores. This page shows that the printed values pin the scoring to partial credit in fifths, thirds, and quarters, recovers every 18-student score list consistent with Tables II to IV (exactly one for each conflict item), bounds the paired t-tests, and identifies the Table V comparison as a variance-ratio test on six item averages.
</div>

## Six questions

<div id="ss-quiz" class="w-demo"></div>

<div data-levels="public" markdown="1">
Try each question before you reveal the answer. Almost no one could answer the conflict questions: before the session, the class averaged 5.56 percent on naming three types of conflict and 2.78 percent on naming four ways to approach one. Every engineering team depends on these skills, and few students had ever been taught them by name.
</div>

<div data-levels="hs" markdown="1">
Answers earned partial credit, so an average of 21.11 percent on Q4 means the class gave about a fifth of the full answer on average, not that a fifth of the students got it right. The biggest gain was on Q1 (what ABET is): from 16.67 to 95.56 percent, a jump of almost 79 points.
</div>

<div data-levels="ug" markdown="1">
Questions 1 to 3 test whether students know the accreditation framework that shapes their own degree; questions 4 to 6 test whether they have vocabulary for working with others. The full-credit answers come from ABET's Criterion 3 student outcomes for the Engineering and Computing Accreditation Commissions (EAC and CAC) and from the conflict-management work the paper cites (Burrows and Harkness), which the session covered.
</div>

<div data-levels="grad res" markdown="1">
The items are open response and the paper does not describe its scoring beyond the full-credit column. Every printed mean and standard deviation, however, falls on a grid of steps of one fifth (Q1 to Q4), one third (Q5), or one quarter (Q6) for 18 students, and no list of whole-credit (right or wrong) answers reproduces them. The steps match the number of parts in Q3's, Q5's, and Q6's full answers.
</div>

## The study

<div id="ss-design" class="w-demo"></div>

<div data-levels="public hs" markdown="1">
The study had two groups. In one class, 18 students answered the six questions on paper, played a team game tossing paper balls into targets for points, heard a short explanation of soft skills and conflict, and answered again. A second group of 37 students answered the questions once, online, at the end of the school year. Together they gave the authors a snapshot of 55 students, from freshmen to seniors.
</div>

<div data-levels="ug grad res" markdown="1">
<div class="ss-table-scroll">
<table class="results-table">
<caption class="w-note">Design of the study, from the paper's methods and participants sections.</caption>
<thead><tr><th>Element</th><th>What the paper reports</th></tr></thead>
<tbody>
<tr><td>Setting</td><td>University of Wyoming; engineering population 23 percent non-white and 16 percent female</td></tr>
<tr><td>Design</td><td>Baseline, quantitative only; six open-response items (Table I)</td></tr>
<tr><td>In-class cohort</td><td>18 of 33 enrolled students in a junior and senior computing elective (also called a cybersecurity elective): one sophomore, three juniors, 14 seniors; paper pre-test, one session, paper post-test</td></tr>
<tr><td>Intervention</td><td>Led by the first author: a team game in which students tossed paper balls into target areas for points, followed by explanations of soft skills, partnerships, and conflict; length not stated</td></tr>
<tr><td>Online cohort</td><td>37 of about 150 undergraduates invited to an anonymous end-of-year survey with the same items; no intervention</td></tr>
<tr><td>All participants</td><td>55 unique students: seven freshmen, nine sophomores, 19 juniors, 20 seniors</td></tr>
<tr><td>Analysis</td><td>Paired two-tailed t-test per item (in-class); F-test of early (freshmen and sophomores, 16) against upper-level (juniors and seniors, 39) pre-test averages</td></tr>
<tr><td>Stated limits</td><td>No measure of retention after the session; possible researcher bias toward expecting low ABET knowledge</td></tr>
</tbody>
</table>
</div>
</div>

<div data-levels="grad res" markdown="1">
The online cohort's class standing is not printed; the page derives it by subtracting the in-class counts from the totals (seven freshmen, eight sophomores, 16 juniors, and six seniors). The one-in-four response rate and the self-selection it implies apply to that cohort only.
</div>

## Before and after one class

<div id="ss-prepost" class="w-demo"></div>

<div data-levels="public" markdown="1">
Every question rose. The class went from knowing almost nothing about conflict to naming most of the answer, and from a sixth of a correct definition of ABET to nearly all of it. The rows by class standing show the same story for seniors, juniors, and the one sophomore.
</div>

<div data-levels="hs" markdown="1">
Switch to Seniors (14) and compare the pre-test bars with All 18: seniors, close to graduation, scored 14 percent on what ABET is and 2 percent on each conflict question. Switch to Juniors (3) or Sophomore (1) and remember the sample size: with one student, a single answer is the whole row.
</div>

<div data-levels="ug" markdown="1">
Table IV's averages are the in-class means with standard deviations; every item's gain sits between 64 points (Q6, 2.78 to 66.67 percent) and 79 points (Q1). The post-test standard deviations for the conflict items (43.62 and 46.18 percent) are the largest in the table: most students named every type and approach afterward, and a handful still named none.
</div>

<div data-levels="grad res" markdown="1">
The paired t-tests use the same 18 students before and after, which removes between-student variation from the comparison. The printed p values are bounds rather than exact values; the reconstruction below shows which t statistics the printed tables allow. A post-test given at the end of the same session measures immediate recall of material just taught, which the authors acknowledge by naming retention as unmeasured.
</div>

## Freshmen, sophomores, juniors, and seniors

<div id="ss-levels" class="w-demo"></div>

<div data-levels="public" markdown="1">
You might expect students near graduation to know more about the skills their degree promises. They did not, by much: across the six questions, juniors and seniors averaged about five points more than freshmen and sophomores, and the authors' test found no meaningful difference. Three or four years of engineering coursework had not taught these ideas by name.
</div>

<div data-levels="hs" markdown="1">
The two groups are different sizes (16 and 39 students), so the page compares averages rather than totals. The largest gap is on Q2 (what ABET does): 11.25 percent for early students against 22.56 percent for upper-level students. On Q6 the early students are ahead.
</div>

<div data-levels="ug" markdown="1">
Table V pools the first answer of every participant: the in-class pre-test and the online survey. An F-test returned p > 0.85, so the paper concludes that early and upper-level students come from the same population on this measure, which answers the second research question: years in the program did not add explicit soft-skill knowledge.
</div>

<div data-levels="grad res" markdown="1">
The printed p > 0.85 matches one computation exactly: a two-tailed variance-ratio F-test on the six item averages of each group (the spreadsheet function F.TEST), F(5, 5) = 0.839, p = 0.852. That test compares how much the six averages spread within each group, not how high they sit. Tests of level on the same six averages give p = 0.31 (two-sample t) and p = 0.055 (paired by item); both are the page's own, and neither uses the 55 individual scores, which are not printed.
</div>

<div data-levels="grad res" markdown="1">
## Rebuilding the class

<div id="ss-recover" class="w-demo"></div>

For each item, the page enumerates every list of 18 scores (on the item's step) whose class-standing averages round to Table II or III and whose mean and sample standard deviation round to Table IV. A sample standard deviation (dividing by n − 1) fits every item; a population standard deviation fits none. Students then pair within class standing in every possible order, and the page reports the smallest and largest paired t. Those bounds bracket the paper's t without knowing which student is which.
</div>

## What the paper found

<div data-levels="public hs" markdown="1">
- Before the session, the 18 in-class students averaged 2.78 to 21.11 percent on the six questions.
- After one session, they averaged 66.67 to 95.56 percent.
- Seniors scored 14 percent on what ABET is and 2 percent on each conflict question before the session.
- Early (16) and upper-level (39) students scored about the same before any instruction.
- Students told the authors the material would have helped earlier in their programs.
</div>

<div data-levels="ug grad res" markdown="1">
- **Little explicit knowledge at baseline.** In-class pre-test means of 16.67 (ABET), 11.11 (what ABET does), 8.89 (soft skills), 21.11 (partnerships), 5.56 (conflict types), and 2.78 percent (conflict approaches).
- **Large immediate gains.** Post-test means of 95.56, 80.00, 75.56, 86.67, 74.07, and 66.67 percent; paired two-tailed t-tests significant on every item (p < 10<sup>−4</sup> to 10<sup>−7</sup>).
- **No early advantage for upper-level students.** Pre-test averages for 16 early and 39 upper-level students; F-test p > 0.85.
- **Equal participation.** The first author observed no difference between female and male participation in the session.
- **Timing.** Students reported that the content would have been more useful earlier in their programs.
</div>

<div data-levels="grad res" markdown="1">
<div class="ss-table-scroll">
<table class="results-table">
<caption class="w-note">Table IV as printed, with the paired t range the page computes from its reconstructed scores. The last two columns are the page's.</caption>
<thead><tr><th>Item</th><th>Pre (mean ± SD)</th><th>Post (mean ± SD)</th><th>p (paper)</th><th>Paired t(17) (page)</th><th>p (page)</th></tr></thead>
<tbody>
<tr><td>Q1 ABET</td><td>16.67 ± 31.62</td><td>95.56 ± 10.97</td><td>&lt; 10<sup>−7</sup></td><td>7.97 to 10.78</td><td>5.1 × 10<sup>−9</sup> to 3.8 × 10<sup>−7</sup></td></tr>
<tr><td>Q2 What ABET does</td><td>11.11 ± 25.87</td><td>80.00 ± 25.67</td><td>&lt; 10<sup>−6</sup></td><td>5.84 to 9.98</td><td>1.6 × 10<sup>−8</sup> to 2.0 × 10<sup>−5</sup></td></tr>
<tr><td>Q3 Soft skills</td><td>8.89 ± 18.44</td><td>75.56 ± 27.06</td><td>&lt; 10<sup>−7</sup></td><td>6.52 to 11.44</td><td>2.1 × 10<sup>−9</sup> to 5.2 × 10<sup>−6</sup></td></tr>
<tr><td>Q4 Partnerships</td><td>21.11 ± 25.18</td><td>86.67 ± 25.67</td><td>&lt; 10<sup>−5</sup></td><td>5.69 to 10.54</td><td>7.2 × 10<sup>−9</sup> to 2.7 × 10<sup>−5</sup></td></tr>
<tr><td>Q5 Conflict types</td><td>5.56 ± 17.15</td><td>74.07 ± 43.62</td><td>&lt; 10<sup>−5</sup></td><td>6.08 to 6.68</td><td>3.8 × 10<sup>−6</sup> to 1.2 × 10<sup>−5</sup></td></tr>
<tr><td>Q6 Conflict approaches</td><td>2.78 ± 8.08</td><td>66.67 ± 46.18</td><td>&lt; 10<sup>−4</sup></td><td>5.66 to 6.06</td><td>1.3 × 10<sup>−5</sup> to 2.8 × 10<sup>−5</sup></td></tr>
</tbody>
</table>
</div>
</div>

## Why it matters

<div data-levels="public hs" markdown="1">
Accreditors require every engineering and computing program to teach teamwork, communication, and ethics. This study shows that students can reach graduation without having learned the names and frameworks for those skills, and that a single, well-planned class can change that quickly. The authors argue for teaching them in the first year.
</div>

<div data-levels="ug" markdown="1">
Professional skills are written into every accredited program's outcomes, yet students in this study could not name them, and seniors did no better than freshmen. The authors draw two practical recommendations: teach the vocabulary of partnership and conflict explicitly, early (a first-year course or modules embedded in early courses), and give students real or hypothetical conflict scenarios inside their engineering projects, then assess teamwork, communication, and management directly. They also note that an emphasis on social skills may help programs attract women to engineering.
</div>

<div data-levels="grad res" markdown="1">
The six items make a short, reusable baseline instrument for a program's own students, and the paper's tables are complete enough to recover item-level score distributions, exactly for the conflict items and to a few candidates for the rest. The finding with the most leverage is the null early-versus-upper result: if three years of team projects do not produce explicit knowledge of partnership and conflict frameworks, that knowledge has to be taught on purpose. The authors propose surveying the literature's models (dedicated courses, embedded modules, cooperative learning, and competitions) for their own university as the next step.
</div>

<div data-levels="res" markdown="1">
## Notes from building this page

- **Scoring steps.** No item is consistent with right-or-wrong scoring. Steps of one fifth (Q1 to Q4), one third (Q5), and one quarter (Q6) are the coarsest that reproduce every printed mean, standard deviation, and class-standing average; finer multiples (tenths, sixths, eighths) also fit and give the same conflict-item scores. Stating the rubric would let readers reuse the instrument.
- **One class, recovered.** The search finds exactly one score list for Q5 and Q6 on both tests, one post-test list for Q1, and one pre-test list for Q3. After the session, 13 of 18 students named all three conflict types and four named none; 11 named all four approaches and five named none. All of the zeros are seniors. The conflict items' post-test spread therefore reflects a split class rather than uniform partial learning, and a paired t-test on so bimodal a difference leans on its normality assumption; a sign test on how many students improved would make the same point without it.
- **Paired t bounds.** Every item has pairings that satisfy the printed bound. For Q1 to Q5 some consistent pairings do not (for example, Q1's least favorable pairing gives p = 3.8 × 10<sup>−7</sup> against the printed p < 10<sup>−7</sup>), so the bounds also say something about who improved.
- **The F-test.** The printed p > 0.85 reproduces as a variance-ratio test on six item averages per group, F(5, 5) = 0.839, p = 0.852. That test asks whether the averages spread equally across items, which differs from the research question (whether early and upper-level students know more). On the same averages, a two-sample t-test gives p = 0.31 and a test paired by item gives p = 0.055 (upper-level higher on five of six items); both are the page's, and a test on the 55 individual scores would need the online responses.
- **Two different occasions.** Table V pools in-class pre-tests (on paper, in a classroom) with online answers given at the end of the year, and the early group of 16 contains one in-class student. The comparison mixes cohort, mode, and timing with class standing.
- **Small details.** The abstract says more than 50 students (55 in the text); the online survey went to "all undergraduate computer science students" in the methods and "all the undergraduate engineering students" in the acknowledgments; the elective is called both a computer science and a cybersecurity elective; the analysis mentions right-tailed chi-squared distributions without a test or statistic attached. The title names freshmen, while the in-class cohort was 14 seniors of 18; the paper's case for first-year instruction rests on the seniors' low baseline.
</div>

<div data-levels="hs" markdown="1">
## Try this in class

1. Give the six questions from **Six questions** to your class on paper, with no hints, and collect the answers anonymously.
2. Score each answer with partial credit: one fifth for each part of Q1 to Q4's full answer you find, one third for each conflict type, and one quarter for each approach. Average each question across the class.
3. Teach the answers in one short lesson with a team game, ask the questions again the next day, and compare your class's before-and-after averages with the bars in **Before and after one class**.
</div>

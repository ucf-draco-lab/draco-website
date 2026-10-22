---
title: "Whose Bacteria? Tracing Mill Creek's Pollution in a High School Lab"
kicker: "Interactive paper · ASEE 2010"
subtitle: "An interactive companion to Leslie Hadaway, Megan Urbaitis, Regina Lamendella, Daniel Oerther, Andrea C. Borowczak, Mike Borowczak, and Anant Kukreti's account of a Cincinnati high school water-quality unit, where AP Biology students used DNA to trace the fecal bacteria in an urban creek to their source."
description: "Read a simulated gel with the class's four DNA markers, walk the AP Biology and Physical Science units that Project STEP built around Mill Creek, turn station readings into water-quality ratings, and check the paper's pre/post results and lesson table."
share_description: "High school students filtered Mill Creek water, copied bacterial DNA, and read a gel to find out whose waste was in the creek. Run the test yourself, follow the two classes, and see what the assessments and the lesson review show. Written for five reading levels."
share_text: "Ninth graders and AP Biology students traced the bacteria in a Cincinnati creek to their source with DNA. Try the test yourself:"
share_image: /papers/mill-creek-source-tracking/share.png
share_image_alt: "A simulated gel with lanes for a ladder and the general, human, cow, and pig markers; the general and human lanes show bands. Beside it, the title Whose Bacteria? and the AP Biology average rising from 11 to 53 percent."
date: 2026-10-22
topics: ["Education"]
default_level: public
level_hints:
  public: No background needed
  hs: Biology class and a little algebra
  ug: Intro lab methods and statistics
  grad: Study design and hypothesis tests
  res: Full design, data, and open questions
authors:
  - name: Leslie Hadaway
    affiliation: Norwood High School
  - name: Megan Urbaitis
    affiliation: Norwood High School
  - name: Regina Lamendella
    affiliation: Lawrence Berkeley National Laboratory
  - name: Daniel Oerther
    affiliation: University of Cincinnati
  - name: Andrea C. Borowczak
    affiliation: University of Cincinnati
    member: andrea-borowczak
  - name: Mike Borowczak
    affiliation: University of Cincinnati
    member: mike-borowczak
  - name: Anant Kukreti
    affiliation: University of Cincinnati
sources:
  - venue: "ASEE Annual Conference & Exposition · Louisville, KY · 2010"
    title: "Engineering Education Collaboration: Innovative Pedagogical Methods for High School and University Environmentalists"
    url: https://doi.org/10.18260/1-2--16896
    access: Open access (ASEE PEER)
citations:
  - hadaway2010engineering
widget:
  css:
    - /papers/mill-creek-source-tracking/widget.css
  js:
    - /papers/mill-creek-source-tracking/mc-engine.js
    - /papers/mill-creek-source-tracking/widget.js
credit: "Interactive page by the [DRACO Lab](/). Every number about the study comes from the paper's Table 1, Figures 2 and 3, and its text. The page recovers the whole count behind each of Table 1's 28 percentages (every one is a count out of 32, the smallest denominator that fits all of them) and checks the text's summary percentages against those counts. The gel is a simulation: the paper reports the class's conclusion, not its gel. The dissolved-oxygen conversion matches the U.S. Geological Survey's saturation table at 0 to 30 °C; the t-test arithmetic matches SciPy on 500 cases; the lesson-arrangement checks match a brute-force search on 2,274 cases. Analyses beyond the paper are labeled as the page's own. Everything runs on your device."
bibtex: |
  @inproceedings{hadaway2010engineering,
    author    = {Hadaway, Leslie and Urbaitis, Megan and Lamendella, Regina and Oerther, Daniel B. and Borowczak, Andrea C. and Borowczak, Mike and Kukreti, Anant R.},
    title     = {Engineering Education Collaboration: Innovative Pedagogical Methods for High School and University Environmentalists},
    booktitle = {2010 ASEE Annual Conference \& Exposition},
    address   = {Louisville, Kentucky},
    year      = {2010},
    doi       = {10.18260/1-2--16896}
  }
---

<div class="lede" data-levels="public" markdown="1">
In the spring of 2009, after several days of rain, a class of high school students went to Mill Creek, a heavily polluted urban stream in Cincinnati, to find out whose waste was in the water. They measured oxygen, acidity, and bacteria on the bank, then took water and mud back to school, pulled DNA out of the bacteria, and copied one gene with tests that recognize bacteria from people, cows, and pigs. The answer pointed to people. This page lets you run that test, follow the two classes that took part, and see what the students learned and how the program behind the lesson was built.
</div>

<div class="lede" data-levels="hs" markdown="1">
Leslie Hadaway, Megan Urbaitis, and five university partners describe a water-quality unit at Norwood High School built through Project STEP, a National Science Foundation (NSF) program that placed engineering graduate students in high school classrooms. AP Biology students traced the fecal bacteria in Mill Creek to their source with the polymerase chain reaction (PCR) and gel electrophoresis, the same methods the graduate student used in her own research. Three ninth-grade Physical Science classes measured six water-quality parameters and classified them in a spreadsheet. Below, you can read a gel, step through both classes, and check the results.
</div>

<div class="lede" data-levels="ug" markdown="1">
The paper reports a Project STEP lesson in two implementations at one high school: AP Biology students ran microbial source tracking (filtration, DNA extraction, PCR with general and host-specific Bacteroidales 16S rRNA primers, and agarose gels) on Mill Creek water and sediment, and three Physical Science classes ran station-based chemical and physical tests and classified their averages. Evidence comes from pre/post assessments analyzed with Student's t-test and from the program's coded review of its lessons (Table 1). The page reproduces every printed percentage it can and labels the rest as simulation.
</div>

<div class="lede" data-levels="grad" markdown="1">
A descriptive practitioner paper from an NSF GK-12 project (DGE-0538532): one lesson, two course levels, one school, socio-cultural theory as frame. Outcome evidence is a pre/post comparison per class with Student's t-test, reported as means for one class and p-values for three, without class sizes, spreads, or comparison groups, plus a coded review of the program's lessons for 14 components. At the graduate and researcher levels, the page adds what spread each printed p-value implies and checks the text's summary percentages against Table 1's counts, all labeled as its own.
</div>

<div class="lede" data-levels="res" markdown="1">
Hadaway et al. (ASEE 2010) argue that authentic molecular methods with unknown outcomes make a high school water study meaningful, and they offer the unit as a roadmap. The page treats the paper as a study: it separates the design, the measures, and the outcomes, reproduces Table 1 as whole counts (n = 32), tests the text's derived percentages for consistency with those counts, maps the class sizes and spreads that fit each printed p-value, and closes with notes from building the page.
</div>

## Whose bacteria are in the creek?

<div id="mc-trace" class="w-demo"></div>

<div data-levels="public" markdown="1">
Pick a water sample, then look at the gel. Each column (a lane) tests for one thing. The **General** lane lights up when any fecal bacteria of this group are in the water. The **Human**, **Cow**, and **Pig** lanes light up only for bacteria that live in that animal's gut. A dark lane means that marker was not found. The Mill Creek sample is set up to match what the class concluded: the bacteria most likely came from people, which points to sewage rather than farms.
</div>

<div data-levels="hs" markdown="1">
PCR copies one short stretch of DNA again and again; each cycle roughly doubles it. A primer is the short piece of DNA that decides which stretch gets copied, so a human-specific primer only finds a target in bacteria from human guts. Move the cycles slider down to 22 with the Mill Creek sample: the general lane shows a band and the human lane does not yet, because the human marker started out rarer. Too few cycles can hide a real source. The upstream spring shows the opposite risk: with enough cycles, even a few stray copies can make a faint band.
</div>

<div data-levels="ug" markdown="1">
The class used four primer sets on the 16S rRNA gene of Bacteroidales, a group of gut bacteria that survives poorly outside a host, which makes it a good marker of recent fecal input: one general set and three host-specific sets (human, ruminant, and pig). A positive general lane with no host lane means fecal input from a source the panel does not cover. The amplification chart shows why endpoint PCR reads presence, not amount: every positive reaction reaches the same plateau. The paper does not name its primer sequences or report its gel; the simulated starting amounts are chosen to show the class's stated conclusion.
</div>

<div data-levels="grad res" markdown="1">
Library-independent source tracking with host-associated Bacteroidales markers was an active research method in 2009, and this unit carried a Fellow's research protocol into a high school classroom with little simplification. The inference the paper reports ("most likely" human) is a presence call. It says nothing about the share of the load from each source, and specificity and sensitivity of the markers, replicate reactions, and controls are not described. The no-DNA lane on the page is a standard control added for the demo, not a step the paper reports.
</div>

## Two classes, one creek

<div id="mc-design" class="w-demo"></div>

<div data-levels="public" markdown="1">
Two very different classes worked on the same creek. The AP Biology students did the DNA work and presented their results to a program director at the National Science Foundation, which funded Project STEP. The ninth graders rotated through test stations by the creek and turned their numbers into ratings back in class. Switch to **Project STEP** to see how the lesson itself was made: a graduate student, the teacher, and university faculty built it together over about six weeks.
</div>

<div data-levels="hs" markdown="1">
Notice that both classes start the same way, with a briefing from the people working to restore the creek, and both end with a test that compares what students knew before and after. The middle differs by course. The ninth graders measured six things and each group tested every one, so the class had four readings of each to average. The AP class went further, from the bank to a DNA result that the restoration project could use.
</div>

<div data-levels="ug" markdown="1">
The design is two single-group pre/post implementations in one school, one in a college-level course and one in a ninth-grade survey course, sharing a briefing and a site. The paper's case for the unit rests on authenticity: real equipment, a real stakeholder, and an outcome that neither the teacher nor the students knew in advance. The Project STEP steps show the program's quality controls (teacher-identified need, faculty content check, coordinator approval, and a built-in pre- and posttest).
</div>

<div data-levels="grad res" markdown="1">
Format, content, instructor, and audience vary together across the two implementations, and the abstract mentions surveys after each lab that the body does not report, so the paper supports a description of what was done and a within-class gain, not a comparison between the two versions. Dates are given only for the AP Biology assessments (March 24 and April 21, 2009); the field day falls between them.
</div>

## From readings to a rating

<div id="mc-rate" class="w-demo"></div>

<div data-levels="public" markdown="1">
Four groups measured the same thing, and no two groups got the same number. Averaging their readings gives one best guess. Then comes a judgment: is the water good, fair, or poor? At Mill Creek most measurements looked good, yet the paper calls the creek very poor overall, because one measurement, the count of fecal bacteria, was far over the line. Switch between **Average rating** and **Worst rating** to see how a single bad result can, and should, decide the answer.
</div>

<div data-levels="hs" markdown="1">
Dissolved oxygen is the oxygen gas mixed into water, which fish and insects need. Cold water holds more of it than warm water, so the class converted each reading into a **percent saturation**: how full the water is compared with the most it could hold at that temperature. Try raising the temperature readings and watch the same oxygen reading climb toward 100%. In the second step, compare the two rules. An average treats bacteria as one score among nine; a health risk does not average out.
</div>

<div data-levels="ug" markdown="1">
The Physical Science workflow is a small data pipeline: replicate measurements, a class spreadsheet, averages, a unit conversion, and a classification against categories (excellent, good, fair, or poor), compared with nine years of the site's historical data. The paper does not name the standard behind its categories or print the measured values; it reports the AP Biology ratings shown here and one Physical Science example (nitrates rated fair). The two combination rules are the page's illustration of why the overall call follows the fecal coliform result.
</div>

<div data-levels="grad res" markdown="1">
Neither simple rule reproduces the paper's overall rating from its own parameter ratings: the worst rating among the nine is "poor," and the paper's overall call is "very poor," attributed to an "extreme excess" of fecal coliform. Indices used in practice (for example, the NSF Water Quality Index) weight sub-scores rather than take a minimum, so the overall call here reads as a judgment about the size of the exceedance, which the printed ratings do not carry.
</div>

## Before and after

<div id="mc-scores" class="w-demo"></div>

<div data-levels="public" markdown="1">
The AP Biology class averaged 11% on a test before the unit and 53% after it. All three ninth-grade classes also improved, and the paper reports that every class gained at least 40 points. The very small p-values mean that gains this large would be very unlikely if the unit had made no difference to what students knew.
</div>

<div data-levels="hs" markdown="1">
Switch to **Percent change** and the same AP Biology result reads very differently: from 11% to 53% is a gain of 42 points, and it is also a 382% increase, because the class nearly quintupled its starting score. The paper's "at least 40%" describes points. Whenever a report gives a percent change of a percentage, check which of the two it means.
</div>

<div data-levels="ug" markdown="1">
Student's t-test compares the average change with how much it varies. A p-value of 1.86 × 10⁻⁶ says the observed gain would be very unlikely if the true average change were zero. It does not say how large the gain is in practical terms (the 42 points do that), and a single-group pre/post design cannot separate the unit from anything else that happened in the four weeks between tests. Physical Science scores are drawn in Figure 3 without values, so the page shows only their p-values.
</div>

<div data-levels="grad res" markdown="1">
The paper does not say whether its t-tests were paired or two-sample, and it does not report class sizes or standard deviations. The map fills that gap with arithmetic only: for a given class size and test, it returns the spread that makes the stated gain reach the printed p-value. For AP Biology with 20 students and a paired test, a 42-point gain reaches p = 1.86 × 10⁻⁶ at a standard deviation of change of about 28 points. Bells 3 and 5 share p = 2.85 × 10⁻¹², which at 20 students and a 40-point paired gain corresponds to a spread near 11 points (larger gains allow larger spreads); the identical values may be a copying slip in Figure 3.
</div>

## Thirty-two lessons

<div id="mc-lessons" class="w-demo"></div>

<div data-levels="public" markdown="1">
Project STEP reviewed its own lessons to see what they included. Nearly all of them tied the content to the real world (94% fully), and most used pictures or diagrams. About one in three fully connected the content to careers, and about one in six fully addressed the wrong ideas students often bring with them. Those two gaps are the kind of finding a program can act on in its next round of lessons.
</div>

<div data-levels="hs" markdown="1">
Each bar has two parts: lessons that fully addressed a component (dark) and lessons that partly addressed it (light). Science is in almost every lesson; engineering is fully present in only five of eight but at least partly present in nearly all. Switch between **STEM areas** and **Teaching moves** to compare what the lessons taught with how they taught it.
</div>

<div data-levels="ug" markdown="1">
Two-decimal percentages often reveal their counts. Here, 3.13% is one lesson out of 32 and 78.13% is 25; every value in Table 1 is a multiple of 1/32. The labels on the bars give the fully and partly addressed counts. The paper describes the review as covering "most of the lessons" created since 2006; it does not describe the coders or the rubric.
</div>

<div data-levels="grad res" markdown="1">
The text summarizes Table 1 with derived percentages that the table alone cannot always confirm, because they depend on how components co-occur within lessons. The checks above ask whether some arrangement of 32 lessons with Table 1's totals produces each claim. The 97% claim fits (31 of 32). The 82% claim fits only one way: 23 of 28 lessons. Two summary statements drift from the table at the margin: "more than 97%" for learning styles is 31 of 32 (96.9%), and "less than one-third" for careers is 11 of 32 (34.4%) fully addressed.
</div>

## What the paper found

<div data-levels="public" markdown="1">
- High school students can use the DNA methods that researchers use, and the result (bacteria most likely from people) was useful to the group restoring the creek.
- The AP Biology class went from 11% to 53% on its unit test; three ninth-grade classes also improved by at least 40 points.
- Mill Creek rated very poor overall because of fecal bacteria, even though most other measurements looked good.
- Students found the work meaningful because nobody, including the teacher, knew the answer ahead of time.
- Project STEP lessons almost always connected to the real world, and less often to careers or common misconceptions.
</div>

<div data-levels="hs" markdown="1">
- AP Biology: 11% before, 53% after (p = 1.86 × 10⁻⁶).
- Physical Science: p = 2.85 × 10⁻¹², 0.00017, and 2.85 × 10⁻¹² for Bells 3, 4, and 5; every class gained at least 40 points.
- Ratings: temperature excellent; dissolved oxygen, pH, nitrates, turbidity, orthophosphates, and macroinvertebrates good; biological oxygen demand fair; fecal coliform poor; overall very poor.
- Lessons (Table 1): science 78%, technology 66%, engineering 62.5%, and math 59% fully addressed; application 94%; careers 34%; misconceptions 16%.
- Project STEP: 15 Fellows, 36 teachers, and more than 3,000 students over three years.
</div>

<div data-levels="ug grad res" markdown="1">
- **Authentic methods transfer.** AP Biology students ran filtration, DNA extraction, PCR with four Bacteroidales primer sets, and gels, and concluded the fecal input was most likely human.
- **Gains on every class's assessment.** AP Biology rose from 11% to 53% (Student's t, p = 1.86 × 10⁻⁶); Physical Science p-values ranged from 0.00017 to 2.85 × 10⁻¹², with gains of at least 40 points.
- **One parameter set the verdict.** Most parameters rated good, and fecal coliform drove an overall rating of very poor.
- **Unknown outcomes motivate.** The authors credit engagement to outcomes that neither students nor teacher knew in advance, to real equipment, and to an audience beyond the class (an NSF program director and the restoration project).
- **The lesson review finds gaps.** Of 32 coded lessons, 30 fully include a real-world application, 11 a career connection, and five student misconceptions.
</div>

<div data-levels="grad res" markdown="1">
<div class="mc-table-wrap">
<table class="results-table">
<caption class="w-note">Outcomes as printed. Physical Science p-values are listed in the order Figure 3 prints them. Implied spreads are computed by this page for 20 students and a paired test, an assumption the paper does not state; for Physical Science they use the minimum 40-point gain, so a larger gain allows a larger spread.</caption>
<thead><tr><th>Class</th><th>Pre</th><th>Post</th><th>Gain</th><th>p (Student's t)</th><th>SD of change for 20 students (page)</th></tr></thead>
<tbody>
<tr><td>AP Biology</td><td>11%</td><td>53%</td><td>42 points</td><td>1.86 × 10⁻⁶</td><td>27.8</td></tr>
<tr><td>Physical Science, Bell 3</td><td>not printed</td><td>not printed</td><td>at least 40 points</td><td>2.85 × 10⁻¹²</td><td>11.5 or more</td></tr>
<tr><td>Physical Science, Bell 4</td><td>not printed</td><td>not printed</td><td>at least 40 points</td><td>0.00017</td><td>38.4 or more</td></tr>
<tr><td>Physical Science, Bell 5</td><td>not printed</td><td>not printed</td><td>at least 40 points</td><td>2.85 × 10⁻¹²</td><td>11.5 or more</td></tr>
</tbody>
</table>
</div>
</div>

## Why it matters

<div data-levels="public hs" markdown="1">
A water test usually ends with "the water is dirty." This one ended with a likely culprit, which tells a city where to look and what to fix: leaking sewers and overflows rather than farms. The students produced that answer themselves, with the tools a researcher would use. Ultimately, the unit shows what becomes possible when a graduate student, a teacher, and a community group share a classroom: students do science that matters to someone outside the school.
</div>

<div data-levels="ug" markdown="1">
GK-12 programs paired research with K–12 teaching on the bet that both sides gain: students meet current methods, and graduate students learn to explain them. This paper documents one concrete case of that exchange, including the process that made it repeatable (a six-week development cycle with content checks, approvals, and built-in assessments) and an honest look at where the program's lessons fell short. The same structure, from a teacher-named need to a research-grade activity, transfers to computing and engineering topics.
</div>

<div data-levels="grad res" markdown="1">
As evidence, the paper offers single-group gains without class sizes or spreads, so it supports feasibility and engagement more than effectiveness. Its stronger contribution is the design: a classroom question whose answer a community partner needs, and a lesson process with assessment built in. A replication would gain most from reporting n and standard deviations, the assessment items, and the post-lab surveys the abstract mentions, and from a comparison class taught the same content without the molecular work.
</div>

<div data-levels="res" markdown="1">
## Notes from building this page

- **Table 1 denominator.** All 28 percentages are counts out of 32, and 32 is the smallest denominator that fits them all. The text says the review covered "most of the lessons" created since 2006. With 15 Fellows over three years and at least five major lessons per Fellow per year, the program would have produced at least 75 lessons if each Fellow served one year, so 32 may be a subset or a different unit of count. The paper does not say.
- **Derived percentages.** The 97% (three or more areas, at least partly) fits Table 1 as 31 of 32. The 82% fits only as 23 of 28 lessons with at least one fully addressed area. "More than 97%" for learning styles is 31 of 32 (96.9%); "less than one-third" for careers is 11 of 32 (34.4%) fully, 21 of 32 at least partly. "Only 16%" for misconceptions counts full coverage only (five of 32; six more partly). The text gives engineering as 62% (62.50% in the table).
- **Outcome reporting.** No class sizes, standard deviations, test items, or Physical Science means are printed, and the paper does not say whether its t-tests were paired. Bells 3 and 5 report the same p-value to three significant figures. "At least 40%" reads as percentage points.
- **Surveys and the abstract.** The abstract says findings come from surveys given after each lab and names human, cow, or intestinal bacteria as the sources tested; the body reports pre/post tests and four markers (general, cow, human, and pig).
- **Ratings.** The categories' standard and thresholds are not given, and no measured values are printed. The overall "very poor" does not follow from the nine parameter ratings under an average or a worst-case rule. The text cites Figure 2 for the student classification, which is Figure 1.
- **The simulation.** Starting copies, amplification efficiency, the visible level, band positions, the no-DNA control, and the four practice samples are the page's. Only the Mill Creek reading (general and human markers present) follows the paper.
- **The page's statistics.** The implied spreads, the arrangement checks, and the two rating rules are computed by this page and are not in the paper.
- **Names.** The header lists Regina Lamendella and the text Gina Lamendella. The page uses the published form for her and Andrea C. Borowczak, the name she now uses, for Andrea C. Burrows.
</div>

<div data-levels="hs" markdown="1">
## Try this in class

1. Collect four readings of one quantity around the school (water temperature from several taps, or the time a ball takes to roll down a ramp), one per group, and record them in a shared spreadsheet.
2. Average the readings, find the largest and smallest, and decide as a class on three categories (good, fair, poor) with written cut-offs before you classify the average.
3. Add one more measurement that is far outside the others, then argue whether the overall rating should follow the average or the worst result, and write down the rule you choose.
</div>

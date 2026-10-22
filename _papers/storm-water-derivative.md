---
title: "Go With the Flow: Calculus from a Rainstorm in a Tray"
kicker: "Interactive paper · ASEE Annual Conference 2010"
subtitle: "An interactive companion to Hunt, Lamendella, Garrison, Borowczak, Borowczak, and Kukreti's calculus lesson, in which high school students timed storm water runoff from urban, suburban, and rural trays, turned the readings into derivatives, and raised their assessment averages by 21 and 37 points."
description: "Pour a 500 ml storm on three model watersheds and find each one's runoff rate the way the students did, follow the lesson from the teacher's request to the post-assessment, explore the program's lesson-component table, and compare the two calculus sections' pre- and post-assessment averages."
share_description: "Two high school calculus classes poured rain on urban, suburban, and rural trays, graphed the runoff, and found its derivative. Averages rose from 27 to 64 percent and from 38 to 59 percent. Run the storm yourself at five reading levels."
share_text: "A rainstorm in a cooking tray, a graduated cylinder, and a derivative. See how two calculus classes learned rates of change from storm water:"
share_image: /papers/storm-water-derivative/share.png
share_image_alt: "Simulated cumulative runoff curves from urban, suburban, and rural trays, with the urban tray filling fastest, beside the title Go With the Flow."
date: 2026-10-22
topics: ["Education"]
default_level: public
level_hints:
  public: No background needed
  hs: Graphs, slopes, and a little algebra
  ug: Calculus and spreadsheets
  grad: Study design and statistical tests
  res: Full design, reconstruction, and open questions
authors:
  - name: Brad Hunt
    affiliation: Norwood High School
  - name: Regina Lamendella
    affiliation: Lawrence Berkeley National Laboratory
  - name: Sara Garrison
    affiliation: Norwood City Schools
  - name: Andrea C. Borowczak
    affiliation: University of Cincinnati
    member: andrea-borowczak
  - name: Mike Borowczak
    affiliation: University of Cincinnati
    member: mike-borowczak
  - name: Anant Kukreti
    affiliation: University of Cincinnati
sources:
  - venue: "ASEE Annual Conference & Exposition · Louisville, KY · 2010 · pages 15.626.1 to 15.626.10"
    title: "Go With The Flow: Describing Storm Water Runoff Rates Using The Derivative"
    url: https://doi.org/10.18260/1-2--16900
    access: Free to read
citations:
  - hunt2010go
widget:
  css:
    - /papers/storm-water-derivative/widget.css
  js:
    - /papers/storm-water-derivative/storm-engine.js
    - /papers/storm-water-derivative/widget.js
credit: "Interactive page by the [DRACO Lab](/). The lesson steps, tray construction, group roles, assessment averages, p bounds, the matching item, and the lesson-component percentages come from the paper. The paper prints no runoff readings, so the trays are simulated: how fast each surface releases water is the page's model, labeled on every chart. The page's polynomial trendline matches NumPy's least-squares fit on 90 test cases, its t-test matches SciPy on 50, and its tray model matches a numerical integration on 63. Every one of the lesson-component table's 28 percentages reproduces as a whole number of lessons out of 32, the page's reconstruction. The answer reading for the matching item and the t-test map are the page's own. Everything runs on your device."
bibtex: |
  @inproceedings{hunt2010go,
    author    = {Hunt, Brad and Lamendella, Regina and Garrison, Sara and Borowczak, Andrea C. and Borowczak, Mike and Kukreti, Anant},
    title     = {Go With The Flow: Describing Storm Water Runoff Rates Using The Derivative},
    booktitle = {2010 ASEE Annual Conference \& Exposition},
    address   = {Louisville, KY},
    year      = {2010},
    month     = {June},
    pages     = {15.626.1--15.626.10},
    publisher = {ASEE Conferences},
    doi       = {10.18260/1-2--16900},
    url       = {https://peer.asee.org/16900}
  }
---

<div class="lede" data-levels="public" markdown="1">
When rain falls on a parking lot, the water races off in minutes; when it falls on a field, much of it soaks in and the rest trickles out slowly. How fast runoff arrives decides whether storm drains overflow. In 2010, a high school calculus teacher and an engineering graduate student in Norwood, Ohio, turned that idea into a math lesson: students poured a pretend rainstorm on three model landscapes built in cooking trays, measured the water that came out, and used calculus to find how fast it flowed. Both classes that tried it raised their average on a short quiz by more than 20 points. This page lets you pour the storm and follow the lesson.
</div>

<div class="lede" data-levels="hs" markdown="1">
A derivative is a rate of change: how fast one quantity changes as another moves. Two Norwood High School calculus sections learned it from storm water. Groups poured 500 milliliters of water on urban, suburban, and rural trays, recorded how much had drained into a graduated cylinder over time, graphed the totals in Excel, and computed slopes to find when each tray drained fastest. Average scores on a five-question assessment rose from 27 to 64 percent in one section and from 38 to 59 percent in the other.
</div>

<div class="lede" data-levels="ug" markdown="1">
The lesson teaches the derivative as an instantaneous rate through an environmental engineering problem. Students collect cumulative runoff volume V(t) from three model watersheds, estimate V′(t) from slopes over intervals, fit a polynomial trendline to V(t) in Excel, and differentiate it analytically to find each watershed's peak runoff rate. The paper, written by the teacher, the graduate fellow who designed the lesson, a district colleague, and the University of Cincinnati team behind the National Science Foundation (NSF) program that placed her in the classroom, reports pre- and post-assessment gains in both calculus sections and describes how the lesson was built.
</div>

<div class="lede" data-levels="grad" markdown="1">
A practitioner report from Project STEP (the University of Cincinnati's NSF Graduate STEM Fellows in K–12 Education program, grant DGE-0538532). One lesson, two intact calculus sections, a five-item pre- and post-assessment, and an unpaired Student's t-test (p < 7 × 10<sup>−7</sup> and p < 0.03). Class sizes, item-level scores, and runoff readings are not printed. The page centers the study: the lesson's design and sequence, the program's lesson-component review, and the outcomes, with one simulated demonstration of the tray activity.
</div>

<div class="lede" data-levels="res" markdown="1">
Hunt and colleagues (2010) describe a GK–12 calculus lesson built on a storm water simulation and report pre-to-post gains of 37 and 21 points in two sections, alongside a review of Project STEP lessons by component. The paper prints percentages without denominators. This page shows that the component table's 28 percentages fix the reviewed lessons at 32 (or a multiple), maps the class sizes and score spreads the printed p bounds allow, and lists the design questions a replication would need answered.
</div>

## Pour the storm

<div id="sw-tray" class="w-demo"></div>

<div data-levels="public" markdown="1">
Each dot is a reading a student would call out from the graduated cylinder. The urban tray, covered in blacktop and shingles, sends water out almost as fast as it is poured; the rural tray, covered in grass, moss, and hay, holds much of it back and releases the rest slowly. The lower chart is the derivative: how many milliliters per second leave each tray. Its highest point is the moment a storm drain would be under the most strain.
</div>

<div data-levels="hs" markdown="1">
The flat steps on the lower chart are what students computed first: the change in volume between two readings divided by the ten seconds between them. The smooth curves come from Excel: a polynomial fitted through the dots, then differentiated by hand. With a 30-second pour, the urban tray's steepest step is 13.5 milliliters per second (between 20 and 30 seconds), the suburban tray's is 7.5, and the rural tray's is 3. Try a 10-second pour: the same 500 milliliters arrives faster, and the urban peak climbs to 21 milliliters per second. Notice the smooth curves dip below zero, and the urban one turns upward near three minutes: a polynomial has to bend somewhere, and those bends come from the fit, not from the water.
</div>

<div data-levels="ug" markdown="1">
Two estimates of V′(t) sit side by side: forward differences over each reading interval (plotted across the interval) and the derivative of a least-squares polynomial of the order you choose; Excel's trendline offers orders 2 through 6. Drop the order to 3 with a 30-second pour and the urban tray's fitted derivative peaks at t = 0, before any water has drained: a cubic cannot bend sharply enough to follow a fast rise and a long plateau. Order 6 follows the curve closely (R² above 0.99 on every tray), which makes the comparison worth a class discussion about what a model can and cannot see.
</div>

<div data-levels="grad res" markdown="1">
The paper prints no readings, figures with values, or trendline orders, so the trays here are a model: each surface holds back a share of the pour and releases the rest through two linear stores in series (a Nash cascade with two stores, the textbook unit hydrograph). The retention shares (6, 22, and 42 percent) and time constants (7, 16, and 34 seconds) are the page's choices, picked so the curves rank urban, suburban, and rural as the lesson intends; the dashed lines show the model's exact curves, and the table gives its exact peak beside the students' two estimates. Reading error adds uniform noise of up to 8 milliliters to each reading before rounding to the cylinder's 5-milliliter marks.
</div>

## The lesson, step by step

<div id="sw-lesson" class="w-demo"></div>

<div data-levels="public hs" markdown="1">
The lesson ran from a demonstration to a field trip. A graduate student in civil and environmental engineering, placed in the classroom by Project STEP, designed it with the teacher over about six weeks. In class, students first watched rain fall on two models, took a short quiz, ran their own storms in groups of five roles (timer, marker, recorder, overseer, and rain pourer), analyzed their data in Excel, and discussed how cities can slow runoff. Then they visited Sanitation District 1 in Fort Wright, Kentucky, to see green roofs, porous pavement, detention ponds, wetlands, and streamside buffers, and took the quiz again.
</div>

<div data-levels="ug grad res" markdown="1">
<div class="sw-table-scroll">
<table class="results-table">
<caption class="w-note">Design of the lesson and study, from the paper's Project STEP, Lesson Creation, and Innovative Lesson sections.</caption>
<thead><tr><th>Element</th><th>What the paper reports</th></tr></thead>
<tbody>
<tr><td>Program</td><td>Project STEP, an NSF GK–12 program at the University of Cincinnati (grant DGE-0538532); 15 fellows in the last three years, 36 teachers since 2006, more than 3,000 students</td></tr>
<tr><td>Setting</td><td>Norwood High School, Norwood City Schools, Ohio; two calculus sections (Bell 2 and Bell 5)</td></tr>
<tr><td>Development</td><td>Teacher names the need from the curriculum map; fellow develops with research advisor and investigators; co-investigator checks correctness; grant coordinator approves; teacher leads the post-test; about six weeks</td></tr>
<tr><td>Goal</td><td>Understand the derivative as a rate of change and use it on real environmental engineering problems</td></tr>
<tr><td>Trays</td><td>11 × 14 × 3 inch cooking trays: pea gravel, 1 inch of play sand, 1 inch of topsoil; urban (blacktop, shingles, buildings), suburban (grass and shingles), rural (grass, moss, hay, barn); 1/8 inch drain hole at the bottom center</td></tr>
<tr><td>Storm</td><td>500 ml from a watering can; cumulative volume in a graduated cylinder; three groups, one per tray, with five roles each</td></tr>
<tr><td>Analysis</td><td>Excel graphs of cumulative runoff; slopes over intervals graphed as a derivative; polynomial trendline differentiated analytically (order not stated)</td></tr>
<tr><td>Assessment</td><td>Five questions, same before and after; guessing discouraged; pre-assessment after the opening demonstration, post-assessment after the field trip</td></tr>
<tr><td>Analysis of scores</td><td>Unpaired Student's t-test per section; class sizes, item scores, and lesson length in periods not stated</td></tr>
</tbody>
</table>
</div>
</div>

<div data-levels="grad res" markdown="1">
The post-assessment follows the computer lab, the discussion, and the field trip, so its gains measure the whole sequence, including a panel of county and state scientists and engineers, rather than the tray activity alone. The paper does not report a comparison section.
</div>

## What Project STEP lessons contain

<div id="sw-components" class="w-demo"></div>

<div data-levels="public hs" markdown="1">
This chart steps back from the storm water lesson to every lesson Project STEP fellows had written since 2006. Nearly all included a real-world application (94 percent) and a written assessment (91 percent); few addressed student misconceptions (16 percent) or used an oral assessment (3 percent). The storm water lesson covers science, technology, engineering, and math at once, which most program lessons only partly did.
</div>

<div data-levels="ug" markdown="1">
The paper reports that 78, 66, 62, and 59 percent of the reviewed lessons addressed science, technology, engineering, and math, and that 97 percent at least partially addressed three of the four. Career connections (34 percent addressed, 31 percent partially) and misconceptions are the weakest components, and both are places the storm water lesson invests: a matching question on how engineers use derivatives, and a field trip built around the people who manage storm water.
</div>

<div data-levels="grad res" markdown="1">
The paper does not say how many lessons were reviewed or who scored them. Switch to **Lessons of 32 (page)** to see the counts behind each bar: 32 is the only count under 64 that turns every printed percentage into a whole number of lessons. The text's "97 percent at least partially address three of the four disciplines" is consistent with 31 of 32; its "82 percent of lessons that definitely contain STEM content" uses a subset the paper does not define.
</div>

## Before and after

<div id="sw-scores" class="w-demo"></div>

<div data-levels="public" markdown="1">
Both classes took the same five-question quiz before and after the lesson. One class went from 27 to 64 percent, the other from 38 to 59 percent. Students already knew the definition of a derivative; what they learned most was how engineers use one. Try the question that improved the most: match each kind of engineer with a problem the derivative helps solve.
</div>

<div data-levels="hs" markdown="1">
A gain of 37 points on a five-question quiz is almost two more questions right per student. The matching question tests whether a student can connect a rate of change to a job: a chemical engineer watching a reactor, an environmental engineer tracking chlorine in water pipes, a civil engineer checking a material's strength, or an electrical engineer working on a GPS.
</div>

<div data-levels="ug" markdown="1">
The authors compared each section's pre- and post-assessment with a Student's t-test and report both gains as significant (p < 7 × 10<sup>−7</sup> and p < 0.03). Read in the order the paper lists the sections, the section with the lower starting average gained more. The matching item was the hardest on the pre-assessment and gained the most; the paper does not print its key, so the page offers its own reading for comparison.
</div>

<div data-levels="grad res" markdown="1">
The test needs each section's size and score spread, and the paper prints neither, so the map above treats both as unknowns: for every class size it draws the largest standard deviation (common to both tests) that still produces the printed bound. Three groups of five roles suggests about 15 students per section if each role went to one student, the page's inference. At 15 students, Bell 2's bound requires a standard deviation under 15.9 points on both tests (less than one question's worth, 20 points), while Bell 5's allows up to 25.2. The same students took both tests, so a paired test would be the natural choice; an unpaired test ignores that pairing.
</div>

## What the paper found

<div data-levels="public hs" markdown="1">
- Students in both calculus sections raised their average quiz scores: from 27 to 64 percent and from 38 to 59 percent.
- Students already understood the definition of a derivative; the biggest gain came on how professionals use derivatives.
- Group work with five roles kept every student busy and made precision and communication matter.
- Seeing the runoff graph and its derivative side by side helped students find the fastest runoff.
- The field trip, with interviews of scientists and engineers, was one of the most memorable parts.
</div>

<div data-levels="ug grad res" markdown="1">
- **Gains in both sections.** Average assessment scores rose from 27 to 64 percent and from 38 to 59 percent (unpaired Student's t-test, p < 7 × 10<sup>−7</sup> and p < 0.03).
- **Applications over definitions.** Students did well on the definition of the derivative; matching professions to derivative applications was the weakest item before the lesson and gained the most.
- **Paired graphs.** Comparing cumulative and derivative graphs side by side let students locate maximum runoff rates and connect them to surface type.
- **Roles and precision.** Timer, marker, recorder, overseer, and rain pourer roles demanded precise measurement and communication within each group.
- **Context.** The visit to Sanitation District 1 showed green infrastructure in use and put students in conversation with county and state scientists, engineers, and educators.
- **Program view.** Across Project STEP lessons, 78, 66, 62, and 59 percent addressed science, technology, engineering, and math, and 94 percent included an application.
</div>

## Why it matters

<div data-levels="public hs" markdown="1">
Calculus can feel like symbols on a page. This lesson gave a derivative a physical meaning (how fast water leaves a parking lot) and a social one (why cities build green roofs and detention ponds). Built with a few cooking trays, a watering can, and a spreadsheet, it is a lesson any high school can run.
</div>

<div data-levels="ug" markdown="1">
The lesson pairs a measurement students take themselves with two ways of differentiating it, discrete slopes and an analytic derivative of a fitted model, and asks them to argue about a real design decision from the result. That sequence is the engineering habit in miniature: measure, model, compare, decide. Ultimately, the paper shows a graduate engineering fellow and a high school teacher building that sequence together, which is the partnership Project STEP was designed to create.
</div>

<div data-levels="grad res" markdown="1">
The report documents a replicable lesson and a development process (teacher-identified need, fellow design, faculty review, coordinator approval) more than it tests an effect. Its outcome data support a modest claim: two sections improved on a short instrument after a lesson sequence that ended with a field trip. Reporting class sizes, item-level results, and the full instrument would let other programs compare against it, and a paired analysis would match the design.
</div>

<div data-levels="res" markdown="1">
## Notes from building this page

- **Lessons behind the component table.** All 28 percentages in the paper's Figure 1 (a table) equal a whole number of lessons out of 32, rounded to two decimals; 32 is the smallest count that fits, and only its multiples fit as well (the page's search and an independent Python search agree). The text's rounding of 62.50 to 62 suggests truncation or round-half-to-even.
- **Which average belongs to which section.** The text gives "27% to 64% and 38% to 59%" without naming the sections, and Figure 5's two p labels are not tied to sections in the extracted text. The page reads the pairs in the order the sections are listed (Bell 2 first), which also gives the larger gain the smaller p.
- **Test choice and missing counts.** An unpaired t-test on pre- and post-assessments from the same students discards the pairing. Without class sizes or standard deviations, the printed bounds constrain but do not determine the data; the map shows the feasible region. At 15 students per section, Bell 2's bound needs both tests' standard deviations under 15.9 points; at 10 students, under 11.2.
- **The matching item.** Table 1 lists four professionals and five uses with no key, and two uses (i and iii) both concern reactors. The page's reading (chemical: i or iii; environmental: iv; civil: v or iii; electrical: ii) is the page's own and needs the authors' key.
- **Simulated trays.** No runoff values appear in the paper, and the polynomial order students used is not stated. The page's two-store model and its parameters are illustrative; with a 30-second pour, a cubic trendline puts the urban tray's peak rate at t = 0, which suggests why order matters for this activity.
- **Small details.** Figure 1 is a table labeled as a figure; the fellow appears as Regina Lamendella in the byline and Gina Lamendella in the text.
</div>

<div data-levels="hs" markdown="1">
## Try this in class

1. Build three trays from foil pans: one topped with plastic or shingles (urban), one half grass and half plastic (suburban), and one with sod or moss (rural). Punch a small hole at the bottom center of each and set it over a graduated cylinder.
2. Assign a timer, a marker, a recorder, an overseer, and a rain pourer. Pour 500 milliliters over 30 seconds and record the volume in the cylinder every 10 seconds for three minutes.
3. Graph each tray's readings in a spreadsheet, compute the slope between each pair of readings, and compare your fastest slopes with the steps in **Pour the storm**. Which tray would overwhelm a storm drain first?
</div>

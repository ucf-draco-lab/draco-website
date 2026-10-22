---
title: "Arduinos and Games: Two Days of Computer Science for Teachers"
kicker: "Interactive paper · ASEE Annual Conference 2016"
subtitle: "An interactive companion to Andrea C. Borowczak and Mike Borowczak's evaluation of two computer science days inside LASSI, an astronomy professional development for K-12 teachers, where 20 teachers' content scores rose from 2.45 to 8.70 in one day."
description: "Play a timed model of the no-talking sorting game that opened the first day, walk both days' activities and stations, read the June ratings from 22 teachers, recompute the paired t-test and effect size from Table 3, and, at the graduate and researcher levels, rebuild a class of scores that reproduces the table exactly."
share_description: "Two eight-hour days of board games, Arduinos, NetLogo, and Makey Makey inside an astronomy PD. Twenty K-12 teachers went from 2.45 to 8.70 on a computer science content test, and every June teacher planned to use some of it. Explore the study at five reading levels."
share_text: "Board games, Arduinos, and a no-talking sorting game: how two days of computer science moved 33 K-12 teachers:"
share_image: /papers/arduinos-and-games/share.png
share_image_alt: "Table 3 from the paper drawn as two bars, a pre-test mean of 2.45 and a post-test mean of 8.70 with their standard deviations, beside the title Arduinos and Games."
date: 2026-10-21
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
    affiliation: Erebus Labs
    member: mike-borowczak
sources:
  - venue: "ASEE Annual Conference & Exposition · New Orleans, LA · 2016"
    title: "Arduinos and Games: K-12 Teachers Explore Computer Science (Evaluation)"
    url: https://doi.org/10.18260/p.26275
    access: Free to read
code: { label: "ag-engine.js (statistics, reconstruction, and game model)", url: https://github.com/ucf-draco-lab/draco-website/blob/main/papers/arduinos-and-games/ag-engine.js }
citations:
  - burrows2016arduinos
widget:
  css:
    - /papers/arduinos-and-games/widget.css
  js:
    - /papers/arduinos-and-games/ag-engine.js
    - /papers/arduinos-and-games/widget.js
credit: "Interactive page by the [DRACO Lab](/). Every number about the two days comes from the paper's text and Table 3. The sorting-game timeline is the page's model of the activity, with its timings stated on the demo. From Table 3's printed means, standard deviations, and correlation, the page recovers the only whole-number sums that fit, and from those it reproduces the printed t = 13.64 and r = 0.14 exactly and identifies the printed effect size of 4.008 as the repeated-measures d (4.0077 from the printed t); its enumeration and pairing match an independent Python implementation on every case, and its t distribution matches SciPy. Reconstructed scores and the effect-size reading are the page's own. Everything runs on your device."
bibtex: |
  @inproceedings{borowczak2016arduinos,
    author    = {Borowczak, Andrea C. and Borowczak, Mike},
    title     = {Arduinos and Games: K-12 Teachers Explore Computer Science (Evaluation)},
    booktitle = {2016 ASEE Annual Conference \& Exposition},
    address   = {New Orleans, LA},
    year      = {2016},
    month     = {June},
    publisher = {ASEE Conferences},
    doi       = {10.18260/p.26275},
    url       = {https://peer.asee.org/26275}
  }
---

<div class="lede" data-levels="public" markdown="1">
Teachers cannot teach computer science they have never tried. In 2015, a group of Wyoming science, math, and technology teachers spent two full days sorting sticky notes without talking, playing coding board games, wiring Arduino boards, and turning fruit into keyboard keys, all inside a longer program about astronomy. Andrea C. Borowczak and Mike Borowczak report what those days looked like and what the teachers took away. On a short content test taken before and after the June day, 20 teachers' average score rose from about two and a half to almost nine. This page lets you try the opening game and explore every result the paper reports.
</div>

<div class="lede" data-levels="hs" markdown="1">
LASSI (Launching Astronomy: Standards and STEM Integration) was a 25-day program that helped K-12 teachers bring astronomy research into their classrooms. Two of those days, in March and June 2015, were about computer science and engineering. This paper evaluates those two days: 11 teachers in March, 22 in June, and a pre-test and post-test for 20 of the June teachers. The average score went from 2.45 to 8.70, and every June teacher said they planned to use some of what they learned.
</div>

<div class="lede" data-levels="ug" markdown="1">
An evaluation of two eight-hour computer science days inside a Math and Science Partnership professional development (PD) for K-12 science, mathematics, and technology teachers. The days modeled problem-based learning and engineering design through an unplugged sorting algorithm, NetLogo models, coding board games, Arduino and electronics kits, and Makey Makey boards. The research question asks what learning gains and perceptions teachers show after them. An external evaluator collected a Likert perceptions survey, open responses, and a pre/post content test: mean 2.45 to 8.70 for 20 teachers, paired t = 13.64.
</div>

<div class="lede" data-levels="grad" markdown="1">
A single-group pre/post evaluation of two computer science days (11 and 22 teachers) within a 25-day astronomy PD, LASSI, that served 41 self-selected K-12 teachers. Outcomes are perception ratings (session mean 4.4 of 5), open-response counts, and a content test for 20 teachers (Table 3: 2.45 ± 1.96 to 8.70 ± 0.92, r = 0.14, paired t = 13.64, effect size 4.008). The page reproduces Table 3 and, at this level, shows which effect-size convention the printed 4.008 is.
</div>

<div class="lede" data-levels="res" markdown="1">
Borowczak and Borowczak (2016) evaluate two computer science days within LASSI and report high ratings and a large one-day content gain. Table 3 prints rounded summary statistics only. Assuming whole-number test scores, those statistics pin all five sums of the 20 score pairs (Σx = 49, Σx² = 193, Σy = 174, Σy² = 1530, Σxy = 431); every consistent class then gives t = 13.643 and r = 0.137, and the printed effect size of 4.008 is the repeated-measures d (t√(2(1 − r)/n): 4.0077 from the printed t, 4.0085 from the exact sums), not d<sub>z</sub> (3.05) or d<sub>av</sub> (4.08). The notes below cover the test's timing, its ceiling, and what the design can and cannot attribute to two days.
</div>

## "What is coding?"

<div id="ag-game" class="w-demo"></div>

<div data-levels="public" markdown="1">
The first day opened with a stack of about 50 sticky notes, each naming a city. The teachers had to sort them into regions of the country, with one person taking notes in, one person handing them out, and no talking once the notes started moving. After several tries they arranged themselves in a diamond and finished in under a minute. Only then did they learn what they had built: an algorithm, a set of steps that a computer could follow. Press **Play** on each formation above to see why the diamond wins.
</div>

<div data-levels="hs" markdown="1">
The model gives each step a time: one second to pass a note, two seconds to read a city and decide its region, one second to drop it on a pile. One sorter needs 48 × 3 = 144 seconds. A line of five people is slower still, because the last person does all the reading. The diamond splits the reading among four people, so the job takes about as long as dealing the notes. The paper does not report these timings; they are the page's, chosen to show the idea.
</div>

<div data-levels="ug grad res" markdown="1">
The activity is a parallel algorithm taught without a computer: the diamond is a scatter (input deals work), parallel map (four sorters classify), and gather (output places). The model makes its bottleneck visible; once reading is parallel, throughput is set by the slowest serial stage, the input person dealing one note per second, so the diamond finishes in 52 model seconds. The teachers did not know beforehand that the game simulated an algorithm, and the debrief connected it to efficiency, optimization, and what code lets astronomers and other STEM specialists do. The paper reports the formation and the time (under a minute), not a step model; this timeline is the page's illustration.
</div>

## The two days

<div id="ag-days" class="w-demo"></div>

<div data-levels="public" markdown="1">
Each day mixed playing with talking. Teachers moved between "try-it" stations at their own pace while experts in computer engineering, astronomy, and education asked how each activity could work in their classrooms. In March, six of the 11 teachers said they planned to use the NetLogo simulations, and five named the board games or the sorting game as new ideas they would take back.
</div>

<div data-levels="hs" markdown="1">
NetLogo lets you build a world of small "agents" (wolves and sheep, burning trees, gas molecules, or planets) and watch what happens when each follows simple rules. An Arduino is a small programmable board that reads sensors and controls lights and motors. A Makey Makey turns anything that conducts electricity, even a piece of fruit, into a computer key. Every station in the list connects coding to something a science class already studies.
</div>

<div data-levels="ug grad res" markdown="1">
<div class="ag-table-scroll">
<table class="results-table">
<caption class="w-note">Design of the evaluation, from the paper's methods, results, and limitations.</caption>
<thead><tr><th>Element</th><th>What the paper reports</th></tr></thead>
<tbody>
<tr><td>Program</td><td>LASSI, a Math and Science Partnership PD (Wyoming Department of Education, MSP #WY140202): 25 days across the 2014 and 2015 summers and the academic year, with astronomy research as the context</td></tr>
<tr><td>Participants</td><td>41 self-selected elementary and secondary in-service science, mathematics, and technology teachers in LASSI; 33 in the two days analyzed (11 in March, 22 in June)</td></tr>
<tr><td>Intervention</td><td>Two eight-hour computer science and engineering days (March and June 2015) designed by electrical and computer engineering, astronomy, and education experts</td></tr>
<tr><td>Instruments</td><td>Likert perceptions survey; open-response questions; pre/post "Computing and STEM – Real World Research Applications" content questionnaire (items not printed); data collected by an external evaluator</td></tr>
<tr><td>Analysis</td><td>Means and response distributions; mean, standard deviation, correlation, paired t-test, p, and effect size for the content test; open responses coded for themes</td></tr>
<tr><td>Stated limits</td><td>One western state, mostly homogeneous student population, activities too easy or too hard for some grade levels, expert bias toward their own disciplines, gains possibly due to the other 23 days, and no follow-up</td></tr>
</tbody>
</table>
</div>
</div>

<div data-levels="grad res" markdown="1">
The March counts come from open responses rather than a closed survey, so they show what teachers volunteered: six of 11 named NetLogo, five named Robot Turtles or the sorting game, and six answered the improvement question with "Nothing" or a compliment. Suggestions were individual (fewer activities, a computer science expert on hand for coding questions, time to review SparkFun resources, mobile app development), and varied from teacher to teacher.
</div>

## How teachers rated June

<div id="ag-ratings" class="w-demo"></div>

<div data-levels="public hs" markdown="1">
The June teachers rated the day 4.4 out of five. All of them said they were engaged more than three quarters of the time, all found the hands-on activities meaningful, and all planned to use at least some of the material with their own students. In their own words, the activities helped students "to visually see and experience" coding and showed "how a computer works."
</div>

<div data-levels="ug grad res" markdown="1">
The paper reports these results as summary statements rather than item tables: a mean rating of 4.4, engagement above 75 percent of the time for all teachers, at least 70 percent "very useful" for every activity, and unanimous ratings of meaningful and intent to use. The abstract attributes the same figures to all 33 participants, while the results section attributes them to the 22 June teachers; the page follows the results section. Teachers also rated the collaborative lesson-planning time "extremely meaningful and productive."
</div>

## The content test

<div id="ag-test" class="w-demo"></div>

<div data-levels="public" markdown="1">
Twenty of the June teachers took the same short computer science quiz before and after the day. Their average went from 2.45 to 8.70. The quiz's top score is not stated in the paper, but most teachers ended near the top and almost all started near the bottom.
</div>

<div data-levels="hs" markdown="1">
The whiskers show the standard deviation, a measure of how spread out the scores are. Before the day, scores were spread widely (some teachers knew a little, most knew almost none); afterward they were tightly packed near the top. A gain of 6.25 points on a spread that small is far larger than chance could produce: the paper's test gives p below 0.0001.
</div>

<div data-levels="ug" markdown="1">
A paired t-test compares each teacher with themself, so it tests the average of the 20 individual gains against zero. The printed correlation between pre and post scores is low (0.14): knowing where a teacher started says little about where they finished. Move r to see how t depends on it. With the printed values, the page computes t = 13.67; Table 3 prints 13.64, and the rebuilding below explains the difference as rounding.
</div>

<div data-levels="grad res" markdown="1">
The paper names "effect size" without a formula. Of the common conventions, only the repeated-measures d (d<sub>rm</sub> = t√(2(1 − r)/n), from Dunlap and colleagues and from Morris and DeShon) returns 4.008; d<sub>z</sub> (gain over the standard deviation of gains) gives about 3.05 and d<sub>av</sub> (gain over the average standard deviation) gives about 4.08. Every convention describes a gain several standard deviations wide. The identification is the page's and is listed for the authors' review.
</div>

<div data-levels="grad res" markdown="1">
## Rebuilding Table 3

<div id="ag-recover" class="w-demo"></div>

If each teacher's score is a whole number, Table 3 fixes the sums completely. The mean of 2.45 for 20 teachers means a total of 49, and only one sum of squares (193) gives a standard deviation that rounds to 1.96; likewise 174 and 1530 for the post-test. Among the sums of products that the score lists allow, only 431 gives both r = 0.14 and t = 13.64. Every class consistent with the table therefore has the same statistics to full precision: t(19) = 13.643, p = 2.9 × 10<sup>−11</sup>, r = 0.137, and d<sub>rm</sub> = 4.0085. The individual scores remain unknown; the demo draws one consistent class at a time.
</div>

## What the paper found

<div data-levels="public hs" markdown="1">
- Teachers learned computer science basics quickly when the activities were hands-on and tied to their subjects: average quiz scores rose from 2.45 to 8.70 in one day.
- The June teachers rated the day 4.4 out of five, and all of them planned to use some of it.
- In March, more than half planned to use NetLogo simulations in class.
- Teachers asked for time to practice, try, and fail, just as their students would.
- Astronomy gave teachers a reason to try coding.
</div>

<div data-levels="ug grad res" markdown="1">
- **Large immediate content gains.** Pre-test 2.45 (SD 1.96), post-test 8.70 (SD 0.92), N = 20, r = 0.14, paired t = 13.64, p = .0000, effect size 4.008 (Table 3, June 29).
- **High ratings in June.** Session mean 4.4 of 5; all 22 engaged more than 75 percent of the time; at least 70 percent rated each activity very useful; all rated the hands-on activities meaningful and intended to use some of the content.
- **Uptake in March.** Six of 11 planned to use NetLogo simulations; five named Robot Turtles and the "What is coding?" activity as new ideas.
- **Design lessons.** Teachers need safe time to try tasks, fail, and retry; collaboration with peers and experts supports learning; astronomy serves as an entry point to computer science and engineering.
- **Next steps named by the authors.** Measure K-12 student learning and interview teachers after the PD ends.
</div>

<div data-levels="grad res" markdown="1">
<div class="ag-table-scroll">
<table class="results-table">
<caption class="w-note">Table 3 as printed, with the values the page recovers from whole-number scores. The last column is the page's.</caption>
<thead><tr><th>Statistic</th><th>Paper</th><th>Page (whole-number reconstruction)</th></tr></thead>
<tbody>
<tr><td>Pre-test mean (SD)</td><td>2.45 (1.96)</td><td>2.45 (1.9595)</td></tr>
<tr><td>Post-test mean (SD)</td><td>8.70 (0.92)</td><td>8.70 (0.9234)</td></tr>
<tr><td>Correlation r</td><td>.14</td><td>0.1367</td></tr>
<tr><td>Paired t(19)</td><td>13.64</td><td>13.6429</td></tr>
<tr><td>p</td><td>.0000</td><td>2.9 × 10<sup>−11</sup></td></tr>
<tr><td>Effect size</td><td>4.008</td><td>4.0085 (d<sub>rm</sub>); 3.0506 (d<sub>z</sub>); 4.0805 (d<sub>av</sub>)</td></tr>
</tbody>
</table>
</div>
</div>

## Why it matters

<div data-levels="public hs" markdown="1">
Most K-12 teachers never studied computer science, yet schools increasingly expect them to bring it into science and math classes. This study shows a way in: start with games and objects people can touch, connect them to a subject the teacher already loves (here, astronomy), and give teachers time to try things before asking them to teach them.
</div>

<div data-levels="ug" markdown="1">
The paper argues that computer science and engineering can live inside existing K-12 science and math lessons when PD models the same problem-based, hands-on approach teachers are asked to use. The unplugged sorting game is the clearest example: it teaches algorithms, efficiency, and optimization with sticky notes, and it travels to any classroom for the price of a pad of sticky notes. Ultimately, the recommendation is structural: build safe practice time and expert access into the PD, not only content.
</div>

<div data-levels="grad res" markdown="1">
The evaluation documents a low-cost design (unplugged activities, board games, and inexpensive kits) that teachers rated highly and planned to adopt, with an immediate content gain that chance cannot explain (p &lt; 0.0001). The single-group design, a same-day post-test, and the surrounding 23 PD days limit causal claims about the two days themselves, which the authors acknowledge; the case for the approach rests as much on the uniform intent to use as on the test.
</div>

<div data-levels="res" markdown="1">
## Notes from building this page

- **Effect-size convention.** The printed 4.008 matches d<sub>rm</sub> = t√(2(1 − r)/n): 4.0085 from the recovered sums, and 4.0077 from the printed t with the recovered r. Naming the convention matters here, because d<sub>z</sub> (3.05) is the natural choice for a paired test and sits almost a full unit lower.
- **Whole-number scores.** The reconstruction assumes each teacher's score is a whole number. Under that assumption the five sums are unique, so the table reproduces exactly. The maximum score is not printed; with a maximum of nine, two post-test lists fit (one has 18 teachers at nine and two at six), and with a maximum of ten, ten lists fit (for example, 12 at eight, two at nine, and six at ten). Either way most teachers sit at or near the top on the post-test, so the test's ceiling, not the teachers, limits the post-test spread.
- **Low correlation.** With r = 0.14, pre-test scores barely predict post-test scores. A near-ceiling post-test produces exactly this pattern, and it also means the paired design adds little power over an unpaired comparison here.
- **Same-day post-test.** Table 3 labels both tests "June 29," which reads as a post-test at the end of the day. The gain then measures immediate recall of material taught that day; the authors list the lack of follow-up as a limitation.
- **Which participants.** The abstract attributes the 4.4 rating, 75 percent engagement, and 70 percent "very useful" to all 33 participants; the results section attributes them to the 22 June teachers. Whether any teacher attended both days, so that 33 counts attendances rather than people, is not stated.
- **Program size.** This paper counts 41 LASSI teachers across 2014 and 2015; the 2021 Education Sciences paper on the same program (Borowczak and colleagues, "I Need Time for Practice") counts 30. The difference may reflect who completed the full program.
- **Small details.** The paper spells Khan Academy as "Kahn Academy" and calls Codecademy "Code Academy"; the content questionnaire appears only as Figure 1's title, and Table 1's integrated-STEM example is not printed in the text; p is printed as ".0000" rather than as a bound.
</div>

<div data-levels="hs" markdown="1">
## Try this in class

1. Write the names of about 50 cities on sticky notes. Choose one student to take notes in and one to hand them out, and tell the class to sort the notes into four regions without talking once the notes move. Time each try.
2. Let the class change its formation between tries, then compare the times with the **"What is coding?"** demo: which person is the bottleneck in each formation?
3. Write the class's best formation as numbered steps, the way a computer program would follow them, and discuss what would change with 500 notes instead of 50.
</div>

---
title: "Camp on Screen: Two Virtual Summers of Computer Science"
kicker: "Interactive paper · ASEE Annual Conference 2022"
subtitle: "An interactive companion to Mike Borowczak, Andrea C. Borowczak, Shawna M. Wolf, Shaya Wolf, and Hui Hu's study of how a week-long summer camp's computer science course held its young viewers when it moved to video in 2020 and 2021."
description: "Program the camp's Micro:bit night light, compare the two virtual years side by side, follow every video's views day by day, see who kept watching to the fifth activity, and weigh what parents reported, with the paper's own tables checked at the undergraduate level and up."
share_description: "In 2020, 63 viewers started a summer camp's first computer science video and five reached the last. In 2021, with reworked videos left online for seven weeks: 50 started and 25 reached the last. Explore the study at five reading levels."
share_text: "A summer camp's coding course went to video for two summers. See who kept watching, and why:"
share_image: /papers/virtual-summer-camp/share.png
share_image_alt: "Unique viewers of five camp videos in 2020, falling from 63 to five, beside 2021's, falling from 50 to 25, next to the title Camp on Screen."
date: 2026-10-21
topics: ["Education"]
default_level: public
level_hints:
  public: No background needed
  hs: Percentages, averages, and a little coding
  ug: Programming and descriptive statistics
  grad: Study design and small-sample statistics
  res: Full design, table checks, and open questions
authors:
  - name: Mike Borowczak
    affiliation: University of Wyoming
    member: mike-borowczak
  - name: Andrea C. Borowczak
    affiliation: University of Wyoming
    member: andrea-borowczak
  - name: Shawna M. Wolf
    affiliation: University of Wyoming
  - name: Shaya Wolf
    affiliation: University of Wyoming
  - name: Hui Hu
    affiliation: University of Wyoming
sources:
  - venue: "ASEE Annual Conference & Exposition · Minneapolis, MN · 2022"
    title: "The Artful Craft of Improving Virtual Summer Camps in the Midst of COVID-19 (Work in Progress)"
    url: https://doi.org/10.18260/1-2--41204
    access: Free to read
citations:
  - asee_peer_41204
widget:
  css:
    - /papers/virtual-summer-camp/widget.css
  js:
    - /papers/virtual-summer-camp/vc-engine.js
    - /papers/virtual-summer-camp/widget.js
credit: "Interactive page by the [DRACO Lab](/). Every count, duration, and percentage comes from the paper's Tables 1 to 4 and its Sections 1 to 6. The page reproduces Table 4's totals from the daily views in Tables 1 and 2 (all ten videos), its averages and standard deviations (computed dividing by n), its views per viewer (nine of ten rows) and watch times (all ten, from views × average view duration), the text's 88.2, 35.3, and 5.2 percent watch-time and length changes, and the 66 and 54 percent completion rates; 10,872 checks in `reference/verify.js`, including Fisher and Wilson statistics that match SciPy and statsmodels. The Micro:bit program, the intervals, and the test labeled as the page's are the page's own. Everything runs on your device."
bibtex: |
  @inproceedings{borowczak2022artful,
    author    = {Borowczak, Mike and Borowczak, Andrea C. and Wolf, Shawna M. and Wolf, Shaya and Hu, Hui},
    title     = {The Artful Craft of Improving Virtual Summer Camps in the Midst of {COVID}-19 (Work in Progress)},
    booktitle = {2022 ASEE Annual Conference \& Exposition},
    address   = {Minneapolis, MN},
    year      = {2022},
    month     = {August},
    publisher = {ASEE Conferences},
    doi       = {10.18260/1-2--41204},
    url       = {https://peer.asee.org/41204}
  }
---

<div class="lede" data-levels="public" markdown="1">
Every summer since 2015, the University of Wyoming has run The Artful Craft of Science (TACoS), a week-long camp where up to 80 rising fifth and sixth graders try chemistry, photogram art, geology, and computer science. In 2020 and 2021 the pandemic moved the camp online, so the computer science course became five videos that taught children to program a small circuit board at home. Between the two summers, the team remade the videos and left them online for a month instead of a week. This page lets you try one of the camp's projects, then follow the viewing numbers to see what changed.
</div>

<div class="lede" data-levels="hs" markdown="1">
When a class turns into videos, the video platform keeps score: how many people press play, how long they watch, and whether they come back. The authors used those YouTube numbers for the camp's five computer science videos in two summers. In 2020, 63 viewers started the first video and five reached the fifth. In 2021, after the team redesigned the videos and kept them up for seven weeks, 50 started and 25 reached the end. Every chart below is drawn from the paper's tables.
</div>

<div class="lede" data-levels="ug" markdown="1">
This work-in-progress paper asks two questions about an asynchronous introductory programming course for rising fifth and sixth graders: how video quality affects participation and engagement, and how the time content stays available affects engagement. The data are YouTube analytics for five Micro:bit videos per year (daily views, unique viewers, average view duration, audience retention, and watch time) and 37 parent evaluations. The page redraws every table and, at this level and above, checks the tables' arithmetic against each other.
</div>

<div class="lede" data-levels="grad" markdown="1">
A descriptive two-cohort comparison: the same camp's virtual computer science course in 2020 (one developer, five videos totaling 1:08:33, 14 days of data) and 2021 (three developers, reworked videos totaling 1:43:14, 49 days of data). Outcomes are per-video platform metrics and parent-reported completion (16 of 24 evaluations in 2020, seven of 13 in 2021). The paper reports no inferential tests. The page reproduces the printed summaries and, at this level, adds interval estimates and one exact test, labeled as its own.
</div>

<div class="lede" data-levels="res" markdown="1">
Borowczak and colleagues (2022) compare video-level engagement across two virtual offerings of a camp's computer science course and attribute 2021's flatter attrition curve to better videos and longer availability. Both changed at once, along with video length, developer count, and content, so the design cannot separate the two research questions. The page rebuilds Table 4 from Tables 1 and 2, settles the alignment of Table 2's merged last row, identifies the standard-deviation convention, and lists the internal mismatches in the researcher notes.
</div>

## Program a night light

<div id="vc-microbit" class="w-demo"></div>

<div data-levels="public" markdown="1">
The camp's course taught children to program a Micro:bit, a pocket-sized circuit board with 25 small lights, two buttons, and sensors, which costs about $20. Drag the room's light level below the cutoff and the board lights up, the way a night light does. Switch to the plant check to see the 2020 course's final project, a program that watches a plant's soil.
</div>

<div data-levels="hs" markdown="1">
Each program is a loop that runs forever: read a sensor, compare the reading with a cutoff, and choose what to show. Programs like these can be built by snapping blocks together in Microsoft MakeCode, a free editor for the Micro:bit. Change the cutoff and the same reading can give a different answer, which is how a programmer tunes a device to its room.
</div>

<div data-levels="ug grad res" markdown="1">
The course covered inputs and outputs, variables, Booleans, and control flow, then gamified and music projects, all on the Micro:bit. The JavaScript shown is MakeCode's text form of the same blocks; the paper does not say which editor the camp used. It names the night light (one developer's example) and the moisture-sensor plant program (2020's fifth activity) without printing their code, so the thresholds and icons here are the page's choices.
</div>

## Two virtual summers

<div id="vc-design" class="w-demo"></div>

<div data-levels="public hs" markdown="1">
In 2020, one person built the computer science course, and the videos were online only during camp week. In 2021, three people each built one day, added animations, demonstrations, step-by-step guides, places to pause, and music, and left everything online for about a month. The 2021 videos were also longer: 1 hour and 43 minutes in all, against 1 hour and 9 minutes.
</div>

<div data-levels="ug grad res" markdown="1">
Several things changed between the two years at once: the number of developers, the video production, the content (new modules for returning campers, new hardware, a planned final project), the total length (up about 51 percent), and the viewing window (14 to 49 days of data). The parent survey asked the same questions both years, though with 24 and 13 responses it is small.
</div>

## Day by day

<div id="vc-daily" class="w-demo"></div>

<div data-levels="public" markdown="1">
Each square is one video on one day, and darker squares mean more views. In 2020 the first video drew 49 views on the first day of camp, and each later video drew fewer, mostly in the days after it opened. Switch to 2021: the views are spread thin across many days, and the last row shows the five weeks after the first two, when each video still drew about one view a day.
</div>

<div data-levels="hs" markdown="1">
Read 2020 down the diagonal: Activity 1 peaks Monday (49), Activity 2 Thursday (10), Activity 3 Wednesday (10), Activity 4 Thursday (12), and Activity 5 Friday (four). The authors estimate that five to ten students kept pace through the week. In 2021 no video reaches nine views on any single day, but the views keep coming after camp week.
</div>

<div data-levels="ug grad res" markdown="1">
Tables 1 and 2 index days from a Sunday (index 0); in 2020, index 1 is the first official camp day. Summing each column reproduces Table 4's total views for all ten videos, which also fixes the reading of Table 2's last row: days 14 to 48 printed as a range, followed by one total per activity.
</div>

## Who kept watching

<div id="vc-watch" class="w-demo"></div>

<div data-levels="public" markdown="1">
Start with Viewers. In 2020, most viewers who began the course stopped along the way: 63 started Activity 1 and only five reached Activity 5. In 2021, 25 viewers watched Activity 5, half as many as the 50 who watched Activity 1. Switch to Minutes watched: in both years the average view lasted about ten minutes or less, even when a video ran more than 20.
</div>

<div data-levels="hs" markdown="1">
Retention is the share of a video the average viewer saw. The authors aimed for 50 percent. In 2020, retention swung from 37 to 83 percent, highest on the two shortest videos (about nine minutes each). In 2021 every video landed between 43 and 53 percent, close to the target. Watch time multiplies views by minutes: 2020's fifth video drew 88 percent less watch time than its first, while 2021's drew only 5 percent less.
</div>

<div data-levels="ug" markdown="1">
Table 4 is internally checkable. Views per viewer should equal total views divided by unique views, and watch time should equal views times average view duration; press **Check Table 4's arithmetic** to see both for each video. Nine of ten views-per-viewer entries and all ten watch times agree. Unique views count viewers of one video, so the funnel from Activity 1 to Activity 5 compares five separate audiences rather than following one student.
</div>

<div data-levels="grad res" markdown="1">
The summary rows of Table 4 use the population standard deviation (dividing by five); the sample form does not fit any column. Read as a funnel, the share of first-video viewers who reached the fifth video rose from 7.9 percent (five of 63) to 50 percent (25 of 50), a ratio of printed counts computed by the page. The comparison carries the confounds above, and 2021's longer window gives late viewers time to arrive that 2020 never had.
</div>

## What parents reported

<div id="vc-parents" class="w-demo"></div>

<div data-levels="public hs" markdown="1">
Parents answered a survey about the whole camp, and two questions asked whether their child finished the computer science sessions. Two thirds of 2020's families said yes, and about half of 2021's. The 2021 group was small (13 families), so a few answers move the percentage a lot.
</div>

<div data-levels="ug" markdown="1">
The completion figures count evaluations, not campers, and the survey covered all four camp experiences, so only a few questions bear on computer science. The paper treats the parent data as context for the viewing numbers rather than as a separate test of the research questions.
</div>

<div data-levels="grad res" markdown="1">
The printed 66 percent is 16 of 24 (66.7 percent, cut rather than rounded); 54 percent is seven of 13. The interval and test in the demo are the page's: with 37 evaluations the difference between years is well within chance, so the parent data neither support nor contradict the viewing trend.
</div>

## What the paper found

<div data-levels="public hs" markdown="1">
- In 2020, 63 viewers started the first video and five reached the fifth.
- In 2021, 50 started and 25 reached the fifth, five times as many at the end.
- In 2021 every video held its viewers for about half its length, close to the authors' target.
- The average view lasted about ten minutes or less, however long the video.
- Left online for seven weeks, the 2021 videos kept drawing about one view a day each, and interest faded by the sixth week.
</div>

<div data-levels="ug grad res" markdown="1">
- **Steadier engagement in 2021.** Average retention ranged from 43.04 to 52.64 percent (SD 3.35) against 36.83 to 82.94 percent in 2020 (SD 19.98).
- **Flatter attrition.** Unique views fell from 63 to five across the 2020 videos and from 50 to 25 across 2021's; watch time fell 88.2 percent from the first to the last 2020 video and 5.2 percent in 2021.
- **More total viewing.** 262 views and 37.1 hours of watch time in 2021, against 219 views and 21.3 hours in 2020, with videos 51 percent longer in total.
- **A ten-minute ceiling.** Average view duration stayed at about ten minutes or less in both years (longest, 10:31); the authors recommend videos under nine minutes, with more programming and less listening.
- **Longer availability, late viewers.** After camp week, each 2021 video drew 28 to 45 more views over 35 days, and engagement dwindled by the sixth of seven weeks.
- **Parent-reported completion.** 66 percent of 24 evaluations in 2020 and 54 percent of 13 in 2021 reported the computer science sessions finished.
</div>

<div data-levels="grad res" markdown="1">
<div class="vc-table-scroll">
<table class="results-table">
<caption class="w-note">Table 4 summary rows as printed, with the page's recomputation from the five per-video rows (standard deviations divide by n).</caption>
<thead><tr><th>Measure</th><th>2020 printed</th><th>2020 page</th><th>2021 printed</th><th>2021 page</th></tr></thead>
<tbody>
<tr><td>Total length</td><td>1:08:33</td><td>1:08:33</td><td>1:43:14</td><td>1:43:14</td></tr>
<tr><td>Total views</td><td>219</td><td>219</td><td>262</td><td>262</td></tr>
<tr><td>Total unique views</td><td>122</td><td>122</td><td>165</td><td>165</td></tr>
<tr><td>Total watch time (h)</td><td>21.2896</td><td>21.2896</td><td>37.0837</td><td>37.0819</td></tr>
<tr><td>Average length (SD)</td><td>13:43 (04:03)</td><td>13:43 (04:03)</td><td>20:39 (04:40)</td><td>20:39 (04:39)</td></tr>
<tr><td>Average views (SD)</td><td>43.8 (43.1)</td><td>43.8 (43.07)</td><td>52.4 (12.99)</td><td>52.4 (12.99)</td></tr>
<tr><td>Average views per viewer (SD)</td><td>1.6660 (0.2487)</td><td>1.6660 (0.2487)</td><td>1.6389 (0.2582)</td><td>1.6389 (0.2582)</td></tr>
<tr><td>Average unique views (SD)</td><td>24.4 (20.4)</td><td>24.4 (20.37)</td><td>33 (9.5)</td><td>33 (9.53)</td></tr>
<tr><td>Average view duration (SD)</td><td>07:05 (01:49)</td><td>07:05 (01:49)</td><td>08:54 (01:49)</td><td>08:54 (01:52)</td></tr>
<tr><td>Average retention (SD)</td><td>58.53% (19.98)</td><td>58.53% (19.98)</td><td>48.46% (3.35)</td><td>48.46% (3.35)</td></tr>
<tr><td>Average watch time (SD, h)</td><td>4.2579 (3.1920)</td><td>4.2579 (3.1920)</td><td>7.4164 (0.9388)</td><td>7.4164 (0.9388)</td></tr>
</tbody>
</table>
</div>
</div>

## Why it matters

<div data-levels="public hs" markdown="1">
Many children will learn to code from videos, at home, without a teacher in the room. This study shows what the viewing numbers can tell a camp team: where children stop, how long they stay, and whether they come back. The authors' answer for the next camp is shorter videos with more hands-on programming, kept online long enough for families to fit them in.
</div>

<div data-levels="ug grad res" markdown="1">
Outreach programs that moved online during the pandemic gained a measurement instrument they rarely had in person: moment-by-moment attention data on every lesson. This paper shows how a small team can read that instrument, from daily views to retention curves, and turn it into design rules (segments under about ten minutes, pause points, a clear roadmap, longer availability). Ultimately, the same analytics that tracked a camp's attrition can guide any asynchronous course for young learners, provided the team pairs them with measures of what children built.
</div>

<div data-levels="res" markdown="1">
## Notes from building this page

- **Table 2's last row.** The row prints as "14 - 48 45 30 33 31 28." Subtracting the 14 printed days from Table 4's totals gives 45, 30, 33, 31, and 28, so the row is days 14 to 48 (2021-07-18 to 2021-08-21) followed by one total per activity. The page draws it that way.
- **One views-per-viewer entry.** 2021 Activity 4 prints 2.1364 views per viewer, which is 47 ÷ 22, while its unique views print as 23 in Table 4 and in the text (47 ÷ 23 = 2.0435). The printed average (1.6389) and standard deviation (0.2582) follow from 2.1364, so either the unique count or the ratio is off by one viewer.
- **Retention is not duration over length.** YouTube's audience retention is the share of viewers at each point of the video, averaged across the video, and rewatched sections can push it above 100 percent. The printed retention differs from average view duration ÷ length by up to 8.6 points (2020 Activity 4: 82.94 against 74.4 percent; 2021 Activity 3: 50.55 against 43.8). The 50 percent target applies to the retention measure.
- **Summary rows.** Every Table 4 standard deviation fits the population form (dividing by five). Three summary cells differ slightly from their columns: 2021 total watch time (the column sums to 37.0819 hours, printed 37.0837), the 2021 standard deviation of view duration (01:52, printed 01:49), and of video length (04:39, printed 04:40).
- **Text against tables.** The text says the 2021 final video was 51.1 percent longer than the first; 51.1 percent is the first video's length as a share of the last, and the last is 95.8 percent longer. A few retention values in Section 4.1.2 differ from Table 3 in the second decimal place (40.53, 50.52, and 53.64 against 40.55, 50.53, and 52.64). The abstract describes 20- to 30-minute videos; Table 4's run from 9:14 to 24:13. Unfilled "X%" placeholders remain in Sections 4.1.4 and 4.1.5; from Table 4, average and total length rose 50.6 percent and total watch time 74.2 percent (computed by the page).
- **Completion rates.** 16 of 24 is 66.7 percent and prints as 66; seven of 13 is 53.8 and prints as 54. The 37 evaluations at 46 percent imply 80 or 81 families across both years. A Fisher exact test of the two years gives p = 0.49 (the page's).
- **Design.** Video production, length, content, developer count, and availability all changed between years, so the attrition difference cannot be assigned to video quality (question 1) or to availability (question 2). Discussion headings 5.1.1 and 5.1.2 carry no text in the published version. Views can include parents, staff, and the team (the authors note this), and unique views are counted per video, so the funnel compares audiences rather than tracking campers. The paper does not give 2021's camp dates, which would anchor Table 2's peaks.
</div>

<div data-levels="hs" markdown="1">
## Try this in class

1. Build the night light from **Program a night light** in Microsoft MakeCode (its simulator works without a board), and test three cutoffs to find one that suits your classroom.
2. Use Table 4 in **Who kept watching** to compute views per viewer (views ÷ viewers) and watch time (views × minutes) for one video. Compare your answers with the printed values.
3. Record a video of your night light lesson that runs under nine minutes, with one place to pause and try. Ask classmates to watch it and mark where they stopped, then compare with the camp's ten-minute ceiling.
</div>

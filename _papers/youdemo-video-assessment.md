---
title: "Rate as You Watch: Continuous Video Assessment for Future Science Teachers"
kicker: "Interactive paper · CITE Journal 2016"
subtitle: "An interactive companion to Mike Borowczak and Andrea C. Borowczak's study of YouDemo, a free tool that let preservice science teachers rate each other's teaching videos second by second, and what 27 of them learned about judging their own work."
description: "Rate a short teaching video second by second the way YouDemo's evaluators did, follow the study's five measures of one video, and test the paper's printed numbers: the bias between two metrics, the self-assessments that did not move, and the denominator behind Table 2."
share_description: "Preservice science teachers rated each other's teaching videos second by second with YouDemo, a free tool built for the study. Rate a video yourself, see what the creator sees, and check how 27 future teachers judged their own work. Written for five reading levels."
share_text: "Rate a teaching video second by second, the way 27 future science teachers rated each other's:"
share_image: /papers/youdemo-video-assessment/share.png
share_image_alt: "Clarity ratings from a simulated panel of raters rising and falling across five scenes of a 45-second video, one rater in cyan and the panel average as a heavy line. Beside them, the title Rate as You Watch."
date: 2026-10-22
topics: ["Education"]
default_level: public
level_hints:
  public: No background needed
  hs: Averages, percentages, and a graph or two
  ug: Intro research methods and a little statistics
  grad: Assessment design and basic statistics
  res: Full design, printed numbers, and open questions
authors:
  - name: Mike Borowczak
    affiliation: Erebus Labs
    member: mike-borowczak
  - name: Andrea C. Borowczak
    affiliation: University of Wyoming
    member: andrea-borowczak
sources:
  - venue: "Contemporary Issues in Technology and Teacher Education 16(2):127–150 · 2016"
    title: "Enabling Collaboration and Video Assessment: Exposing Trends in Science Preservice Teachers' Assessments"
    url: https://citejournal.org/volume-16/issue-2-16/science/enabling-collaboration-and-video-assessment-exposing-trends-in-science-preservice-teachers-assessments/
    access: Open access
citations:
  - borowczak2016enabling
widget:
  css:
    - /papers/youdemo-video-assessment/widget.css
  js:
    - /papers/youdemo-video-assessment/yd-engine.js
    - /papers/youdemo-video-assessment/widget.js
credit: "Interactive page by the [DRACO Lab](/). Every number about the study comes from the article's text, Tables 1 and 2, and figure captions; the article's Figures 7 to 9 were interactive Plotly charts whose data are not in the article, so the page draws the printed fit and counts rather than the points. The page checks Table 2 and finds that only one denominator from 1 to 1,000, 60 coded answers, reproduces all four printed percentages; it also finds that the printed Figure 7 fit runs opposite to its caption. The micro-teach in the first demo is an animation written for this page, and the other raters in that demo are simulated. Wilson intervals match statsmodels. Everything runs on your device."
bibtex: |
  @article{borowczak2016enabling,
    author  = {Borowczak, Mike and Borowczak, Andrea C.},
    title   = {Enabling Collaboration and Video Assessment: Exposing Trends in Science Preservice Teachers' Assessments},
    journal = {Contemporary Issues in Technology and Teacher Education},
    volume  = {16},
    number  = {2},
    pages   = {127--150},
    year    = {2016},
    url     = {https://citejournal.org/volume-16/issue-2-16/science/enabling-collaboration-and-video-assessment-exposing-trends-in-science-preservice-teachers-assessments/}
  }
---

<div class="lede" data-levels="public" markdown="1">
Future teachers practice by teaching on camera: a two-minute science demonstration, a short lesson, a pitch for a hot topic in science. Classmates then review the video, usually with a thumbs-up or a few sentences at the end. Mike Borowczak and Andrea C. Borowczak built YouDemo, a free website that changes how that review works. Viewers press arrow keys the whole time a video plays to say how well it is doing on two qualities the video's maker chose, such as clarity and pacing. The maker sees an average line across every viewer, moment by moment, and never a single person's score. The authors used YouDemo for five years with 76 future science teachers. This page lets you rate a short video yourself and then walks through what 27 of those teachers showed about judging their own work.
</div>

<div class="lede" data-levels="hs" markdown="1">
Mike Borowczak and Andrea C. Borowczak studied preservice science teachers (college students training to teach science) who made short teaching videos and reviewed each other's. Their tool, YouDemo, records a rating every time a viewer presses an arrow while the video plays, on a scale from zero to ten for each of two metrics. Averaging all viewers turns many opinions into one line over time. Below, you can rate a 45-second video, step through the study, and check three of the paper's results with its own numbers.
</div>

<div class="lede" data-levels="ug" markdown="1">
The paper introduces YouDemo, a free web tool for continuous, metric-focused assessment of YouTube videos, and reports how preservice science teachers used it. Evaluators adjust two creator-defined metrics with arrow keys during playback; creators see only the aggregate. Over five years, YouDemo collected more than 900 assessments of 170 videos from more than 131 users. A two-year sub-study of 27 preservice teachers compared self-assessments before and after peer review, written peer assessments, and the continuous ratings. The page rebuilds the rating loop, the study design, and every result the article prints as a number.
</div>

<div class="lede" data-levels="grad" markdown="1">
A mixed-methods study of continuous response measurement applied to peer assessment of teaching videos. Twenty-seven preservice science teachers (a two-year subset of 76 across five years and three universities) produced videos, self-assessed before and after peer review, received two written peer assessments per video, and rated peers continuously in YouDemo on two creator-defined metrics. The paper reports validity (r = 0.71 between continuous and written peer scores), consistency (r = 0.61 pre to post), reliability (ω = 0.96, α = 0.89), a fitted bias between metrics, counts of self-assessment shifts, and coded open responses. At the graduate and researcher levels the page adds checks of those printed numbers, labeled as its own.
</div>

<div class="lede" data-levels="res" markdown="1">
Borowczak and Borowczak (CITE Journal 2016) present YouDemo as a continuous, aggregated, anonymous alternative to binary or free-text video feedback, and report four trends: a non-zero bias between simultaneously rated metrics, perceived benefits for assessment, critical thinking, and engagement, self-assessments uncorrelated with peer assessments, and lower self-assessors rated higher by peers. The quantitative evidence lives in Plotly figures whose data are not in the article. The page reproduces what the text allows, infers Table 2's denominator (60 coded answers, unique from 1 to 1,000), shows that the printed Figure 7 fit contradicts its caption unless its axes are swapped, bounds Figure 8's counts, and closes with notes for the authors.
</div>

## Rate as you watch

<div id="yd-rate" class="w-demo"></div>

<div data-levels="public" markdown="1">
Press **Play**, then use the arrow keys (or the arrows on screen) whenever your opinion changes: up and down for how clear the explanation is, left and right for how engaging the visuals are. Watch for the third scene, where the narrator rushes through a formula. When the video ends, you see what its maker would see: the average of everyone who rated it, with your own line visible only to you. The other raters are simulated by this page, so the average looks the same for every visitor.
</div>

<div data-levels="hs" markdown="1">
Each press is stored with the time it happened, so your rating becomes a graph over time rather than a single grade. Averaging the graphs of many viewers smooths out one person's mood and keeps every individual anonymous. The authors noticed two habits in real raters: they pressed arrows most often right after a scene changed, and they pressed "increase" more often than "decrease." The simulated raters here copy both habits.
</div>

<div data-levels="ug" markdown="1">
The paper describes the tool at the level of its interface (Figures 1 to 6) rather than its data format. It does not say what value a rating starts at, how far one press moves it, or how ratings from different viewers line up in time. The page makes those choices explicit: ratings start at five, one press moves one point, each rating holds until the next press, and the average is taken every half second. Word labels come from the paper's Table 1, which maps zero to ten onto five labels from "Non-Existent" to "Excellent."
</div>

<div data-levels="grad res" markdown="1">
Continuous response measurement has a long history in media research (debate dials, music video responses); the authors found no earlier use of it in teaching. The two metrics are rated at once, which is the condition Figure 7 tests, and the aggregate view hides individuals at the cost of hiding disagreement. The faint lines show the simulated panel behind the average. A small class makes the anonymity guarantee weaker than it looks: with two or three raters, a creator who knows who was asked can often infer who scored low, and the paper does not report a minimum number of raters.
</div>

## Five measures of one video

<div id="yd-study" class="w-demo"></div>

<div data-levels="public" markdown="1">
Every video in the study was judged five ways: by its maker before and after seeing classmates' videos, by two classmates in writing, and by classmates pressing arrows while it played. Click a step to read it. Switch to **The tool's five stages** to follow a video through YouDemo itself, and to **Who and how many** for the size of the study.
</div>

<div data-levels="hs" markdown="1">
Measuring the same thing several ways lets researchers check one measure against another. If the arrow-key ratings agree with the written peer scores, the tool is probably measuring what the class meant to measure. The paper reports that they did agree fairly well (a correlation of 0.71, where 1 would be perfect agreement).
</div>

<div data-levels="ug" markdown="1">
The design pairs a formative measure (continuous peer ratings) with summative ones (written peer scores and self-scores) on the same two metrics, plus five open-response questions coded with Tesch's eight steps. The 27 fully matched sets come from the last two years of a five-year trial. The paper names one course (teaching science through STEM integration) and describes the participants as undergraduate and graduate students with STEM backgrounds and science education coursework.
</div>

<div data-levels="grad res" markdown="1">
The validity figure (r = 0.71) correlates YouDemo per-metric averages with written peer scores; the paper does not give the number of pairs. The pre-to-post correlation (r = 0.61) is listed under validity but describes stability of self-assessment. McDonald's ω (0.96) and Cronbach's α (0.89) are reported without the items or sample they were computed on. The cumulative counts (over 900 assessments, 170 videos, and 131 users) span every YouDemo study to date, so they describe the tool's use rather than the 27-person sample.
</div>

## Two metrics, one bias

<div id="yd-bias" class="w-demo"></div>

<div data-levels="public" markdown="1">
Raters scored two qualities at the same time, and the two scores leaned on each other. In the paper's words, rating the first metric low led to an even lower second metric, and rating it high led to an even higher one. A dashed diagonal line marks where the two scores would agree. One strong impression seems to color the other, much as a single great or poor moment can shape how you remember a whole movie.
</div>

<div data-levels="hs" markdown="1">
Each point in the paper's Figure 7 is one video, placed by its average score on Metric 1 (across) and Metric 2 (up). If raters judged the two metrics independently and the videos were equally good at both, the points would scatter around the diagonal. The caption says they tilt more steeply than the diagonal: low gets lower and high gets higher. Move the slider to compare a video's Metric 1 average with where Metric 2 would sit if there were no bias.
</div>

<div data-levels="ug" markdown="1">
The paper fits a line to Figure 7 and prints Y = 0.78X + 1.25, with Metric 2 on the vertical axis. A fitted line flatter than the diagonal is what regression toward the mean produces when two noisy measures of related qualities are compared. Notice that a slope below one puts the line *above* the diagonal for low Metric 1 averages and *below* it for high ones, which is the reverse of what the caption describes. The graduate and researcher levels look at that mismatch.
</div>

<div data-levels="grad res" markdown="1">
The printed fit and the caption cannot both describe Y on X. With slope 0.78 the fit predicts Metric 2 above Metric 1 below 5.68 and below it above 5.68. Solving the same equation for the other axis (X = 0.78Y + 1.25, so Y ≈ 1.28X − 1.60) gives the pattern the caption and the Findings describe, with the same crossing at 5.68 ("below 5 … above 5" in the text). The likeliest explanation is that the regression was fit with the axes reversed, or the equation was printed for X on Y; the page draws both and does not choose. Either way, a halo effect between simultaneously rated metrics and regression toward the mean predict different slopes, so the direction matters for the paper's first trend.
</div>

## Did watching peers change self-ratings?

<div id="yd-self" class="w-demo"></div>

<div data-levels="public" markdown="1">
Each square is one future teacher who scored their own video, rated classmates' videos, and then scored their own again. Fourteen of the 27 did not change their score at all. Fewer than a quarter lowered it. The rest raised it, even though most of them had just seen work that their classmates rated as average. The slider covers every split the paper's numbers allow, because the article reports the totals and not each person.
</div>

<div data-levels="hs" markdown="1">
Judging your own work is harder than judging someone else's. In this study, the teachers whose classmates scored them low tended to rate themselves about twice as high as average, and the teachers whose classmates scored them seven to nine almost never lowered their own score (one of 27). Most peer scores landed on five or six, which the authors read as a sign that new assessors find it hard to tell strengths from weaknesses.
</div>

<div data-levels="ug" markdown="1">
Figure 8 plots each teacher's pre- against post-self-assessment, colored by the average peer score. The text gives three counts: 14 of 27 unchanged, "less than a quarter" lower, and one of 27 lower among those with peer scores of 7 to 9. Together they fix the unchanged group and bound the rest: one to six lower and seven to 12 higher. The authors summarize the comparison as self-assessments uncorrelated with peer assessments.
</div>

<div data-levels="grad res" markdown="1">
The Figure 8 text and the abstract's fourth trend point in different directions. The text says teachers with low peer scores self-assessed "much higher than average by a factor of about 100%," which describes low performers overrating themselves; the abstract says students with lower self-assessments were rated higher by peers. Both could hold in a sample of 27, and both are consistent with self-assessment literature (miscalibration is largest at the bottom), but the individual points would decide it. The Figure 9 text adds a weak linear relationship between average formative (continuous) scores and summative (written) scores, which sits beside the r = 0.71 reported under validity.
</div>

## What the tool changed

<div id="yd-table2" class="w-demo"></div>

<div data-levels="public" markdown="1">
After rating with YouDemo, the teachers answered, in their own words, "How did the tool affect your viewing of this video?" The researchers sorted the answers into themes. The four most common were that the tool made rating possible and easy to get to, that it made rating easier, that it forced them to think critically, and that it kept them engaged. The teachers' own words put it simply: "[It] made me pay attention" and "[It] helped me be more objective."
</div>

<div data-levels="hs" markdown="1">
Table 2 gives a count and a percentage for each theme. Try dividing by the 27 teachers: 37 of 27 is 137%, which cannot be a share of people. Switch to 60 and every printed percentage comes out right. The counts must be answers or coded mentions, with some teachers giving more than one, and 60 answers is the total that fits.
</div>

<div data-levels="ug" markdown="1">
The caption calls these the "top 20%" of responses, which most naturally means the four most frequent of about 20 coded concepts. Coding followed Tesch's eight steps; the paper reports no inter-rater agreement. The article also observes that teachers who rated with the tool recalled more specific details of the video than teachers who did not, and that without the tool, reviewers fixed on small things (a speaker's habits) rather than flow and clarity.
</div>

<div data-levels="grad res" markdown="1">
Denominators are worth checking whenever a table prints counts beside percentages. Here the four printed shares pin the denominator to 60 among every integer from 1 to 1,000 (rounding half up, or half to even; the result is the same). That makes the base the number of coded answers, not the 27 participants named in the caption, and it means the percentages describe shares of answers, which several teachers may have contributed to more than once.
</div>

## What the paper found

<div data-levels="public" markdown="1">
- Rating a video second by second, on two qualities the maker chose, worked as a classroom tool: future teachers said it helped them rate, think critically, and pay attention.
- When people rate two qualities at once, the two scores pull on each other.
- About half of the future teachers did not change their opinion of their own video after reviewing classmates' videos.
- Those whose classmates scored them low tended to rate themselves high.
- Feedback, practice, and a chance to fix mistakes were all built into the assignment, which the authors argue is what skill improvement needs.
</div>

<div data-levels="hs" markdown="1">
- YouDemo use to date: over 900 assessments of 170 videos by over 131 users.
- Study: 76 preservice science teachers over five years at three universities; 27 fully matched sets in the last two years.
- Self-assessment: 14 of 27 unchanged after peer review; fewer than a quarter lower; one of 27 lower among those peers rated seven to nine.
- Most peer scores were five or six on the zero-to-ten scale.
- Top answers about the tool: allowed rating (37), easier to rate (22), forced critical thinking (19), increased engagement (13).
</div>

<div data-levels="ug grad res" markdown="1">
- **Continuous ratings track written ones.** YouDemo averages correlate with written peer scores (r = 0.71); pre- and post-self-assessments correlate at r = 0.61; ω = 0.96 and α = 0.89.
- **Simultaneous metrics are biased.** Metric 2 against Metric 1 deviates from Y = X; the printed fit is Y = 0.78X + 1.25.
- **Self-assessment barely moved.** Fourteen of 27 unchanged; fewer than a quarter lower; one of 27 lower among high peer scores.
- **Low performers overrated themselves.** Teachers with low peer scores self-assessed about 100% above average.
- **Engagement and recall.** Coded answers credit the tool with access to rating, ease, critical thinking, and engagement (Table 2); tool users recalled more specific details.
- **Interaction pattern.** Presses clustered at scene changes, and "increase" was pressed more than "decrease."
</div>

<div data-levels="grad res" markdown="1">
<div class="yd-table-wrap">
<table class="results-table">
<caption class="w-note">Numbers the article prints, with the page's checks. Checks are computed by this page.</caption>
<thead><tr><th>Quantity</th><th>Printed</th><th>Page check</th></tr></thead>
<tbody>
<tr><td>Table 2 shares</td><td>62%, 37%, 32%, 22%</td><td>All four reproduce only with 60 as denominator (1 to 1,000)</td></tr>
<tr><td>Figure 7 fit</td><td>Y = 0.78X + 1.25</td><td>Meets Y = X at 5.68; above it for low X, opposite to the caption</td></tr>
<tr><td>Figure 8 unchanged</td><td>14 of 27</td><td>52% (95% Wilson 34% to 69%)</td></tr>
<tr><td>Figure 8 lower</td><td>"less than a quarter"</td><td>One to six of 27; higher seven to 12</td></tr>
<tr><td>Validity, consistency</td><td>r = 0.71, r = 0.61</td><td>Sample sizes not reported</td></tr>
<tr><td>Reliability</td><td>ω = 0.96, α = 0.89</td><td>Items and sample not reported</td></tr>
</tbody>
</table>
</div>
</div>

## Why it matters

<div data-levels="public hs" markdown="1">
Teachers learn to teach partly by watching themselves and each other, and most video feedback online is still a like button and a comment box. A rating that follows the video moment by moment shows a new teacher exactly where an explanation lost the room, and averaging many viewers keeps the feedback honest without making it personal. The same idea works for any recorded talk, from a class presentation to a science fair pitch.
</div>

<div data-levels="ug" markdown="1">
Peer assessment is often summative and vague, and video makes it easy to grade the speaker instead of the teaching. YouDemo constrains attention to two named metrics for the whole recording, which the authors argue shifted reviewers from surface traits to flow and clarity. Ultimately, the tool creates a space where preservice teachers practice the core skill of assessment itself, judging a performance against criteria, before they do it for a room of students.
</div>

<div data-levels="grad res" markdown="1">
The study links a lightweight tool to established conditions for skill improvement (well-defined tasks, immediate feedback, error correction, and practice) and to Chickering and Gamson's principles. Its evidence is a single course setting, a homogeneous pool, and figures whose data live outside the article, so it supports the design rationale more than any effect size. The untested uses the authors name (instructor-to-student metrics such as "Does this make sense?" in a flipped classroom) and the interface effects they flag are where a comparison design would belong.
</div>

<div data-levels="res" markdown="1">
## Notes from building this page

- **Figure 7 direction.** The printed equation Y = 0.78X + 1.25 (Metric 2 on Metric 1) puts Metric 2 above Metric 1 below X = 5.68 and below it above, but the caption and Findings say low Metric 1 leads to an even lower Metric 2 and high to higher. The equation read as X = 0.78Y + 1.25 matches the text and crosses Y = X at the same point. Worth confirming against the Plotly data (plot 65 in the authors' account).
- **Table 2 base.** The caption cites the 27 participants, but the percentages divide the counts by 60. The page reads 60 as the number of coded answers; the paper should state it.
- **Fourth trend.** The abstract's "lower self-assessments rated higher by peers" and the Figure 8 text's "low peer scores self-assess much higher" describe different relationships. The page reports both as printed.
- **"Uncorrelated" versus "weak."** The abstract calls self- and peer assessments uncorrelated; the Figure 9 text describes a weak linear relationship between formative and summative peer scores. These are different pairs of measures, which the page keeps apart.
- **Table 1 overlap.** "Lacking" is 2 to 3 and "Average" is 3 to 6, so a three carries both labels on this page.
- **Tool mechanics.** The article does not give the starting value, step size, sampling, or time alignment of ratings, or how the four arrows map to the two metrics. The page's choices (start at five, one point per press, hold until the next press, half-second averaging, up and down for Metric 1, left and right for Metric 2) are its own.
- **Simulated raters.** The panel in the first demo is generated by the page with a fixed seed and is not study data. It copies the two habits the paper reports.
- **Cumulative counts.** The 900, 170, and 131 cover all YouDemo use to date, including earlier studies (Borowczak and Burrows 2011; Burrows and Borowczak 2014).
- **Companion article.** Borowczak (2015, Problems of Education in the 21st Century 65:18–27) describes the same non-intrusive assessment approach; the page did not draw on it.
- **Byline.** The published record lists Andrea C. Borowczak as Andrea C. Burrows; this page uses the name she prefers. The article gives Mike Borowczak's affiliation as Erebus Labs.
</div>

<div data-levels="hs" markdown="1">
## Try this in class

1. Record a two-minute explanation of any science idea on a phone, or pick a short public science video, and agree on two metrics as a class (for example, "clear" and "well paced").
2. While it plays, each student raises a hand to a height from zero to ten for one metric and changes it whenever their opinion changes; a partner writes the number down every ten seconds.
3. Average the class's numbers for each ten-second slot, graph the result, and find the moment the line drops. Discuss what happened in the video right then and how the maker could fix it.
</div>

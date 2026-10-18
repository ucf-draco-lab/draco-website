---
title: "Ants Go Marching: Teaching Teachers Computer Science with an Ant Colony"
kicker: "Interactive paper · Education Sciences 2019"
subtitle: "An interactive companion to Mike Borowczak and Andrea C. Borowczak's study of RAMPED, a 16-day professional development course that brought computer science to 30 K–12 STEM teachers, starting with a simulated ant colony."
description: "Take on the ant-colony challenges RAMPED teachers worked through, then explore what the 16-day professional development changed in their computer science knowledge, their confidence, and their classrooms."
share_description: "Thirty K–12 teachers learned computer science by changing the code of a simulated ant colony. Try their challenges, then see what changed in their knowledge, confidence, and classrooms. Written for five reading levels."
share_text: "Thirty K–12 teachers learned computer science by changing the code of a simulated ant colony. Try their challenges and see what changed:"
share_image: /papers/ants-go-marching/share.png
share_image_alt: "A simulated ant colony with glowing scent trails between its nest and three food piles, next to the title Ants Go Marching."
date: 2026-10-18
default_level: public
level_hints:
  public: No background needed
  hs: Classroom science and a little coding
  ug: Intro programming and research methods
  grad: Education research methods and statistics
  res: Full design, data, and open questions
authors:
  - name: Mike Borowczak
    affiliation: University of Wyoming
    member: mike-borowczak
  - name: Andrea C. Borowczak
    affiliation: University of Wyoming
    member: andrea-borowczak
sources:
  - venue: "Education Sciences 9(1):66 · 2019"
    title: "Ants Go Marching: Integrating Computer Science into Teacher Professional Development with NetLogo"
    url: https://www.mdpi.com/2227-7102/9/1/66
    access: Open access
  - venue: "ASEE Annual Conference · 2017"
    title: "Teaching Teachers to Think Like Engineers Using NetLogo"
    url: https://peer.asee.org/28926
    access: Earlier short version, free to read
code:
  label: "Ants, the NetLogo model the teachers modified (Wilensky, 1997)"
  url: https://ccl.northwestern.edu/netlogo/models/Ants
citations:
  - educsci9010066
  - burrows2017Netlogo
widget:
  css:
    - /papers/ants-go-marching/widget.css
  js:
    - /papers/ants-go-marching/ants-engine.js
    - /papers/ants-go-marching/widget.js
credit: "Interactive page by the [DRACO Lab](/). The colony is a JavaScript port of Uri Wilensky's NetLogo [Ants](https://ccl.northwestern.edu/netlogo/models/Ants) model (1997, CC BY-NC-SA 3.0); its random number generator matches NetLogo's draw for draw, and its scent diffusion reproduces NetLogo's own regression test exactly. Every number about the professional development comes from the paper's tables, and the averages, shares, and permutation test are computed by this page from those tables. Everything runs on your device."
bibtex: |
  @article{borowczak2019ants,
    author  = {Borowczak, Mike and Borowczak, Andrea C.},
    title   = {Ants Go Marching---Integrating Computer Science into Teacher Professional Development with {NetLogo}},
    journal = {Education Sciences},
    volume  = {9},
    number  = {1},
    pages   = {66},
    year    = {2019},
    doi     = {10.3390/educsci9010066}
  }

  @inproceedings{borowczak2017netlogo,
    author    = {Borowczak, Andrea C. and Borowczak, Mike},
    title     = {Teaching Teachers to Think Like Engineers Using {NetLogo}},
    booktitle = {2017 ASEE Annual Conference \& Exposition},
    address   = {Columbus, Ohio},
    year      = {2017},
    doi       = {10.18260/1-2--28926}
  }
---

<div class="lede" data-levels="public" markdown="1">
Schools increasingly ask K–12 teachers to teach computer science, yet most of those teachers never studied it. In 2016, 30 STEM teachers spent 16 days in RAMPED, a professional development course built around real uses of computing, from robots and space science to pocket-sized computers. One session handed them a simulated ant colony and asked them to change its code. Mike Borowczak and Andrea C. Borowczak followed what the teachers learned, how their confidence changed, and what reached their classrooms afterward.
</div>

<div class="lede" data-levels="hs" markdown="1">
Computer science sits inside nearly every STEM career, but most K–12 teachers learned their subjects without it. RAMPED (Robotics, Applied Mathematics, Physics, and Engineering Design) gave 30 teachers 16 days of hands-on sessions to close that gap. In the NetLogo session, teachers opened a model of ants searching for food and rewrote its rules, one challenge at a time. This page lets you take on the same challenges, then shows what the researchers measured: the teachers' quiz scores at four checkpoints, how skilled they felt, and how many carried the work into their own classrooms.
</div>

<div class="lede" data-levels="ug" markdown="1">
RAMPED ran six two-day sessions (NetLogo, astronomy and space, robotics, virtual reality, Arduino, and Raspberry Pi), each teaching core computer science (CS) concepts through an authentic application. Five sessions opened with a lecture and then moved to inquiry. The NetLogo session opened with a challenge in a working model and let teachers explore, with the instructor explaining along the way. Borowczak and Borowczak compared that session with the other five on content knowledge, self-efficacy, and planned classroom use.
</div>

<div class="lede" data-levels="grad" markdown="1">
A mixed-methods study of one session inside a 16-day, yearlong engineering education professional development (PD) course. Of 30 participating STEM teachers, 22 attended the two-day NetLogo session and 20 completed every assessment. The researchers measured CS content knowledge at four checkpoints with a seven-item instrument, self-efficacy on a five-point scale before and after the session, usefulness and satisfaction afterward, and classroom implementation three months after the PD, alongside informal interviews and teacher artifacts read through a social constructivist lens.
</div>

<div class="lede" data-levels="res" markdown="1">
Borowczak and Borowczak (2019) revise and extend a 2017 ASEE short paper on the NetLogo Naturally Inspired (NNI) session of RAMPED, a Math–Science Partnership PD funded under NCLB Title II, Part B, with participants drawn in part from the NSF Noyce SWARMS program. The research question asks how pre-collegiate STEM teachers view their CS skill set before and after the PD, and whether those perceptions align with what they know and how they plan to use CS. Data include a custom content assessment given four times, a self-efficacy item (*n* = 22 before, *n* = 21 after), usefulness and satisfaction ratings, a three-month implementation survey, and teacher vignettes collected almost three years later. Every number on this page traces to the paper's tables or to a computation the page runs on them.
</div>

## Day one: the ant challenge

<div id="ag-dayone" class="w-demo"></div>

<div data-levels="public" markdown="1">
Press **Play**. Each ant wanders until it finds food, then carries a crumb home and leaves a scent trail behind it. Ants that cross the trail follow it to the food, and every trip makes the trail stronger. No ant plans the route; the colony finds it anyway. RAMPED teachers started here, then worked through the five challenges below the colony. Each challenge meant changing a few lines of the model's code, and before the course, 90 percent of the teachers had never heard of NetLogo.
</div>

<div data-levels="hs" markdown="1">
The model gives every ant the same short list of rules, run once per tick: look for food or head home, sniff the scent to the left, ahead, and to the right, turn toward the strongest, wiggle a little, and step forward. Tap any ant to follow it; the line under the chart names the rule it just used. Then switch on the challenges in order. Each one needs a small piece of code (a variable, an if-then rule, a counter), the same building blocks the teachers' quiz tested.
</div>

<div data-levels="ug" markdown="1">
Ants (Wilensky, 1997) is NetLogo's classic introductory model, the paper's "Hello World." Every tick, each ant runs one procedure: pick up food or drop it at the nest, climb the gradient of a chemical (or of a nest scent) by sampling the patches 45 degrees to either side, add a random wiggle, and move one patch. Patches share the chemical with their eight neighbors and lose a fixed fraction to evaporation. The code listing under the chart highlights the lines the followed ant just ran. The paper condenses the teachers' first-day work to five challenges, shown here as switches.
</div>

<div data-levels="grad res" markdown="1">
The paper lists the challenge sequence but not the teachers' solutions, so each switch implements one reasonable answer: energy as a 600-step budget refilled on every delivery, reproduction as one hatchling per two deliveries, and mutation as a shift of up to 10 degrees in the wiggle angle at birth. With challenges 2 through 5 off, the colony follows NetLogo 7's own primitives, including its random number generator and the random order in which ants take turns. Turn on energy, reproduction, and mutation together and the colony grows while food lasts, then dies out once the piles are empty (in nine of 10 seeded test runs; the tenth starved with food left). Over runs this short, the mean wiggle angle drifts between about 30 and 50 degrees rather than climbing toward an optimum. The authors note that the five challenges pushed teachers past syntax toward problems "that CS solves that programming alone cannot."
</div>

## Sixteen days, six sessions

<div id="ag-pd" class="w-demo"></div>

<div data-levels="public" markdown="1">
RAMPED ran for 16 days spread across a school year: 10 summer days, when each teacher picked four of six two-day sessions, and six follow-up days during the year. Three of those days went to NetLogo. The researchers quizzed the teachers four times around the NetLogo session and surveyed them again three months after the course ended.
</div>

<div data-levels="hs" markdown="1">
Each of the six sessions paired a computer science idea with a real use of computing, and each was led by an expert in that area with help from education faculty. Five sessions opened with a lecture. The NetLogo session opened with the ant challenge and let teachers work things out together, with the instructor explaining as questions came up. Keep that difference in mind; it returns at the end of the page.
</div>

<div data-levels="ug" markdown="1">
The four content checkpoints bracket the NetLogo session: before the summer PD (pre-pre), right before the two-day session (pre), right after it (post), and at the end of the summer PD (post-post). Self-efficacy was measured once before and once after the session. Beyond the ant challenges, the two NetLogo days covered genetic algorithms (teachers modified a Python or Sketch template to keep a target species alive) and physics-inspired optimization (Hooke's law and annealing applied to placing human settlements). The school-year follow-up day turned to bio-inspired systems such as flocking birds, schooling fish, and foraging ants.
</div>

<div data-levels="grad res" markdown="1">
Of the 22 NetLogo participants, seven were men and 15 were women. The 20 with complete data averaged 12.9 years of teaching and 125.5 students per year (about 12% of them on individualized education plans); 65% taught elementary grades and 63% focused on science, and five also taught art, engineering, or technology. Several came through SWARMS, an NSF Noyce program supporting beginning STEM teachers. Self-efficacy surveys were anonymous, which is why the before and after counts differ (22 and 21) and why the responses cannot be paired. A research team spanning education, CS, physics and astronomy, and engineering ran the PD, and an independent evaluator collected satisfaction, implementation, and content data. The PD totaled 120 hours.
</div>

## What the teachers knew

<div id="ag-knowledge" class="w-demo"></div>

<div data-levels="public" markdown="1">
The teachers answered the same seven short computer science questions four times. Four questions came from the NetLogo session and three from the other sessions. Between the first quiz and the quiz right after the NetLogo session, the share of correct answers rose on every one of the seven.
</div>

<div data-levels="hs" markdown="1">
The NetLogo questions asked teachers to roll a fair 21-sided die 1,000 times, swap two numbers, add one to a number, and report whether a number is even or odd. Pick a question to follow its line. Every score rises through the quiz right after the session. The end-of-summer quiz is where the lines cross: some scores dipped (question 5 fell from 44% to 26%, question 7 from 90% to 82%) while others kept climbing (question 17a reached 100%).
</div>

<div data-levels="ug" markdown="1">
Six of the seven items show code in C++, Python, or LOGO; question 7 uses only pictures. Each targets one concept: syntax, control structures, variables, or Boolean logic. Scores rose on every item from pre-pre to post, from pre to post, and from both early checkpoints to post-post, which the authors read as short- and long-term gains. The averages rise steadily through the first three checkpoints, and most of the fluctuation sits between post and post-post.
</div>

<div data-levels="grad res" markdown="1">
Averaged without weights (computed here from Table 3), the four NetLogo items move from 41.8% to 50.8%, 58.3%, and 73.0% across the checkpoints, and the three other-session items from 25.7% to 34.0%, 63.0%, and 64.7%. Both groups gained across the two-day session, the other-session items by more (29.0 points against 7.5); the paper does not analyze that difference. The instrument was built for RAMPED and, as the authors state, has limited reliability and validity.
</div>

## How the teachers saw themselves

<div id="ag-efficacy" class="w-demo"></div>

<div data-levels="public" markdown="1">
Before the NetLogo session, four of 22 teachers rated their NetLogo skill a 4 or 5 out of 5. Afterward, 14 of 21 did. Nearly every teacher (19 of 20) called the session useful, and 18 of 22 were satisfied with it.
</div>

<div data-levels="hs" markdown="1">
Self-efficacy means how capable you believe you are, and the paper notes that teachers with more of it are more likely to bring computer science into their classes. Switch between thresholds. Counting ratings of 3 or higher, the share rose from 50% to 95%; counting 4 or higher, from 18% to 67% (from four teachers to 14). Before the course, 90% of the teachers had never heard of NetLogo.
</div>

<div data-levels="ug" markdown="1">
Teachers rated their NetLogo skill from 1 (not skillful at all) to 5 (extremely skillful). Usefulness and "stretched thinking" used a three-point scale; satisfaction used five. Interviews told a mixed story: teachers wrote that they loved modeling scenarios with students, and also that their coding background was weak and modifying the code was hard. The researchers coded those responses for engagement terms (love, enjoyed, excellent) and challenge terms (hard time, weak).
</div>

<div data-levels="grad res" markdown="1">
The paper reports counts and percentages without a significance test. Because the surveys were anonymous, the page treats the two administrations as independent samples and runs an exact permutation test on the 43 pooled ratings: the mean rises from 2.55 to 3.86, and a split at least that extreme occurs with probability *p* ≈ 0.0003 under random assignment. Most of the same teachers answered both times, which the unpaired test ignores. The result supports the shift the paper describes; it says nothing about whether perceived skill tracks measured skill, the second half of the research question.
</div>

## From workshop to classroom

<div id="ag-classroom" class="w-demo"></div>

<div data-levels="public" markdown="1">
Three months after the course, teachers reported which sessions they already used in class and which they planned to use. NetLogo led on both counts: 10 percent already using it and 45 percent planning to, ahead of every other session in the survey, and it costs nothing. Almost three years later, two teachers described how NetLogo had fared in their schools, including what got in the way.
</div>

<div data-levels="hs" markdown="1">
One fourth-grade teacher first used the Ants model itself: her students changed the ants' size and color and added a patch of food, the same moves as challenges 1 and 2. She also rewrote a NetLogo erosion model for her science standards, built a quiz to go with it, and used if-then flow charts to teach the subtraction algorithm. A year later, a NetLogo update broke her model and her district switched to Chromebooks, so she turned to the online version to teach simple coding, then to Hour of Code, and now plans to model collisions with it. A high school psychology teacher and a science teacher used NetLogo models of a spreading virus and a spreading social meme, until budget cuts moved the psychology teacher to another subject.
</div>

<div data-levels="ug grad" markdown="1">
Planned activities differed by session: inquiry and a family science night for NetLogo, an electricity unit for Arduino, an integrated project or afterschool club for Raspberry Pi, lecture and lab for virtual reality. Cost ran from free (NetLogo, astronomy) to $25 to more than $100 (virtual reality). Across the board, teachers planned far more than they had yet done, and the activities they named stayed close to what the PD had shown them.
</div>

<div data-levels="res" markdown="1">
The implementation survey asked for current and potential use at three months, and the authors note that teachers were still adopting strategies when the paper went to press. Artifacts showed few real-world examples in teachers' NetLogo use, despite the PD's emphasis on real-world modeling; the authors suggest teachers need more time and more expert collaboration to internalize those connections, and they acknowledge that a "hand-holding honeymoon" phase may have shaped what teachers attempted.
</div>

## What the paper found

<div data-levels="public" markdown="1">
- Teachers' quiz scores rose on all seven computer science questions from the first quiz to the one right after the NetLogo session.
- The share of teachers rating their NetLogo skill a 4 or 5 out of 5 rose from 18 percent to 67 percent.
- Nineteen of 20 teachers found the session useful, and 18 of 22 were satisfied.
- More teachers planned to use NetLogo (45 percent) than any other session's tools.
- Teachers mostly used the activities as the PD presented them; few adapted them, and their courses changed little overall.
</div>

<div data-levels="hs" markdown="1">
- Content scores climbed on every question across the first three quizzes; the end-of-summer quiz showed both gains and dips.
- Confidence rose sharply: half the teachers rated themselves average or better before the session, and 95 percent did after it.
- NetLogo had the highest current (10 percent) and planned (45 percent) classroom use of the five sessions surveyed.
- Two teachers were still working NetLogo into lessons almost three years later, and both described how software updates, new devices, and reassignments interrupted that work.
</div>

<div data-levels="ug grad res" markdown="1">
- **Content knowledge rose on every item.** All seven questions gained from pre-pre to post and to post-post, and from pre to post and to post-post (Table 3).
- **Self-efficacy shifted upward.** Ratings of 4 or 5 went from 4 of 22 to 14 of 21; ratings of 3 or higher from 11 of 22 to 20 of 21 (Table 4).
- **Teachers valued the session.** Usefulness: 19 of 20 moderate or large. Satisfaction: 18 of 22 moderately to completely satisfied. Stretched thinking into classrooms: 20 of 22 moderate or large (Table 5).
- **NetLogo led planned implementation.** 10% current and 45% potential use, against 0 to 5% current and 10 to 30% potential for the lecture-led sessions (Table 2).
- **Adoption stayed inside the PD's scope.** Teachers implemented the activities they had seen, with few adaptations and minimal systemic change in practice.
</div>

<div data-levels="grad res" markdown="1">
<div class="ag-table-wrap">
<table class="results-table">
<caption class="w-note">Percent correct at each checkpoint (Table 3) with the item's concept and session (Table 1).</caption>
<thead><tr><th>Item</th><th>Concept</th><th>Session</th><th>Pre-pre</th><th>Pre</th><th>Post</th><th>Post-post</th></tr></thead>
<tbody>
<tr><td>Q5</td><td>Syntax</td><td>Baseline</td><td>6%</td><td>18%</td><td>44%</td><td>26%</td></tr>
<tr><td>Q7</td><td>Control structures</td><td>Baseline</td><td>39%</td><td>45%</td><td>90%</td><td>82%</td></tr>
<tr><td>Q14</td><td>Variables</td><td>Baseline</td><td>32%</td><td>39%</td><td>55%</td><td>86%</td></tr>
<tr><td>Q17a</td><td>Control structures</td><td>NNI</td><td>60%</td><td>60%</td><td>68%</td><td>100%</td></tr>
<tr><td>Q17b</td><td>Syntax</td><td>NNI</td><td>29%</td><td>55%</td><td>59%</td><td>80%</td></tr>
<tr><td>Q17c</td><td>Variables</td><td>NNI</td><td>30%</td><td>35%</td><td>36%</td><td>50%</td></tr>
<tr><td>Q17d</td><td>Boolean logic</td><td>NNI</td><td>48%</td><td>53%</td><td>70%</td><td>62%</td></tr>
</tbody>
</table>
</div>

<div class="ag-table-wrap">
<table class="results-table">
<caption class="w-note">NetLogo self-efficacy ratings (Table 4) and session ratings (Table 5), as counts from low to high.</caption>
<thead><tr><th>Measure</th><th>n</th><th>1</th><th>2</th><th>3</th><th>4</th><th>5</th></tr></thead>
<tbody>
<tr><td>Self-efficacy, before</td><td>22</td><td>5</td><td>6</td><td>7</td><td>2</td><td>2</td></tr>
<tr><td>Self-efficacy, after</td><td>21</td><td>0</td><td>1</td><td>6</td><td>9</td><td>5</td></tr>
<tr><td>Usefulness (three-point)</td><td>20</td><td>1</td><td>–</td><td>6</td><td>–</td><td>13</td></tr>
<tr><td>Satisfaction</td><td>22</td><td>1</td><td>3</td><td>2</td><td>5</td><td>11</td></tr>
<tr><td>Stretched thinking (three-point)</td><td>22</td><td>2</td><td>–</td><td>8</td><td>–</td><td>12</td></tr>
</tbody>
</table>
</div>
</div>

## Why it matters

<div data-levels="public hs" markdown="1">
Most students meet computer science through a teacher who learned it on the job. This study shows a free modeling tool, taught through exploration, getting teachers comfortable enough to try computer science with their own students. It also shows the limit of a single course: confidence and a first lesson arrive quickly, while the deeper knowledge needed to improvise in class takes sustained support from partners who know the field.
</div>

<div data-levels="ug" markdown="1">
Integrating CS into existing science and mathematics courses, instead of treating it as a separate subject, depends on teachers who can connect computing to their own disciplines. The NetLogo session lowered two barriers at once (cost and starting skill) and paired them with an exploratory format. The authors argue that this combination lets teachers learn CS fundamentals without a degree in the field, and that university partners can supply the expert support teachers need to move from the PD's examples to their own.
</div>

<div data-levels="grad res" markdown="1">
The study adds evidence for constructivist, tool-centered CS PD and points to its ceiling: three days of immersion built comfort and self-efficacy, not the depth needed for spontaneous classroom examples. The authors call for sustained expert support, propose teacher professional learning communities around NetLogo, and ask whether free, self-paced online modules could produce similar gains. The same team later studied that self-paced format directly, with cybersecurity microcredentials for teachers ([Education Sciences, 2021](https://doi.org/10.3390/educsci12010004)).
</div>

<div data-levels="res" markdown="1">
## Notes from building this page

- **Format, content, and instructor travel together.** The NetLogo session differed from the other five in format (inquiry first), in content, in cost, and in who taught it, so the higher planned implementation cannot be credited to format alone. The authors raise this themselves as an open question for a larger, focused study.
- **Table 3 denominators.** The text describes 20 teachers who answered all four times and averages "across all 22 participants," yet several entries match neither a fixed 20 nor a fixed 22 (6%, for example, is neither 1 of 20 nor 1 of 22). The number answering each item likely varied by checkpoint; the paper does not report those counts.
- **Other-session items gained more inside the NetLogo window.** Only the two-day NetLogo session separates the pre and post checkpoints, yet the three baseline items rose 29.0 points on average against 7.5 for the NetLogo items. Transfer of general programming ideas (sequential operation, loops) or repeated testing could explain the gap; the design cannot tell them apart.
- **Timing of post-post.** Methods place the post-post assessment immediately after the summer PD, while the conclusions describe the pre-to-post-post change as long-term (one year).
- **Grade bands.** Participants are described as equally representing elementary, middle, and high school, while 65% of the 20 with complete data taught elementary grades.
- **The permutation test.** The exact test in the self-efficacy demo is this page's addition. It enumerates every split of the 43 pooled ratings into groups of 22 and 21 by dynamic programming over the five rating categories, so the *p*-value is exact, not simulated.
</div>

<div data-levels="hs" markdown="1">
## Try this in class

1. With every challenge off, predict which food pile the colony empties first and how many ticks it takes. Run the colony three times and record the results.
2. Switch on energy and death. Write the rule that decides when an ant dies as an if-then sentence, then predict and test what happens when the food runs out.
3. Switch on reproduction and mutation, then explain in a short paragraph how the colony's numbers change over a run and what the mean wiggle angle does.
</div>

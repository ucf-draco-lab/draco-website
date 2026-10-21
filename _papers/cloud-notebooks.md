---
title: "Code in a Browser Tab: Cloud Notebooks in Teacher Training"
kicker: "Interactive paper · ASEE Annual Conference 2017"
subtitle: "An interactive companion to Mike Borowczak and Andrea C. Borowczak's study of how 20 K–12 teachers in the RAMPED professional development learned computer science through Jupyter notebooks and NetLogo Web, and what stuck after each session."
description: "Run the paper's two cloud-session questions in a working notebook, follow the RAMPED professional development and its checkpoints, compare how cloud and local items held up after each session, meet two teachers who took the tools into their classrooms, and, at the graduate and researcher levels, test which group sizes the printed percentages allow."
share_description: "During their two-day sessions, teachers gained the most on the two local C++ items. By the end of the summer, the two cloud items (Python in Jupyter notebooks, Logo in NetLogo Web) had climbed another 31 and 21 points while the local items slipped. Explore the study at five reading levels."
share_text: "Twenty K–12 teachers learned to code in browser-based notebooks. See what stuck after the summer:"
share_image: /papers/cloud-notebooks/share.png
share_image_alt: "Percent of teachers answering four coding questions correctly at four checkpoints: the two cloud items keep rising to 86 and 80 percent after their sessions while the two local items fall back, beside the title Code in a Browser Tab."
date: 2026-10-21
topics: ["Education"]
default_level: public
level_hints:
  public: No background needed
  hs: A first program and percentages
  ug: Programming and intro statistics
  grad: Study design and measurement
  res: Full design, table checks, and open questions
authors:
  - name: Mike Borowczak
    affiliation: University of Wyoming
    member: mike-borowczak
  - name: Andrea C. Borowczak
    affiliation: University of Wyoming
    member: andrea-borowczak
sources:
  - venue: "ASEE Annual Conference & Exposition · Columbus, OH · 2017"
    title: "Interactive Web Notebooks Using the Cloud to Enable CS in K-16+ Classrooms and PDs"
    url: https://doi.org/10.18260/1-2--28571
    access: Free to read
citations:
  - borowczak2017interactive
widget:
  css:
    - /papers/cloud-notebooks/widget.css
  js:
    - /papers/cloud-notebooks/minipy.js
    - /papers/cloud-notebooks/cn-engine.js
    - /papers/cloud-notebooks/widget.js
credit: "Interactive page by the [DRACO Lab](/). Every percentage comes from the paper's Tables 5.3.1, 6.2.1, and 6.2.2, its Context, Methods, and participants sections, and its two case studies. The page rebuilds Table 6.2.2 from Table 6.2.1: all 12 changes and three of the four averages match the printed table. The notebook runs MiniPy, a Python subset written for this page, which produces output identical to CPython 3.13 on 114 reference cells and 1,850 randomized arithmetic cells; the table arithmetic matches an independent Python check on 814 results. Local and Cloud means and the group-size search are the page's own. Everything runs on your device."
bibtex: |
  @inproceedings{borowczak2017interactive,
    author    = {Borowczak, Mike and Borowczak, Andrea C.},
    title     = {Interactive Web Notebooks Using the Cloud to Enable {CS} in {K-16+} Classrooms and {PDs}},
    booktitle = {2017 ASEE Annual Conference \& Exposition},
    address   = {Columbus, OH},
    year      = {2017},
    month     = {June},
    publisher = {ASEE Conferences},
    doi       = {10.18260/1-2--28571},
    url       = {https://peer.asee.org/28571}
  }
---

<div class="lede" data-levels="public" markdown="1">
Teaching computer science in a school usually starts with a problem that has nothing to do with teaching: getting software installed on every machine. Mike Borowczak and Andrea C. Borowczak tried a different route with 20 K–12 teachers. In a summer training program called RAMPED, the teachers wrote their first programs in a web browser, using notebooks and models that live online. This page lets you write code the same way, then shows what the teachers learned, what they still knew at the end of the summer, and what two of them did next in their own classrooms.
</div>

<div class="lede" data-levels="hs" markdown="1">
A notebook is a web page that mixes text with small boxes of code you can run on the spot. RAMPED, a 16-day professional development (PD) course, used two kinds of browser tools (Jupyter notebooks for Python and NetLogo Web for the Logo language) alongside sessions the paper labels local, which taught C++. The authors quizzed 20 teachers four times. The two cloud questions kept rising after their sessions ended, reaching 86 and 80 percent correct, while the two local questions slipped back. Below, you can try both cloud questions yourself.
</div>

<div class="lede" data-levels="ug" markdown="1">
Cloud-hosted programming environments remove the setup cost (installs, administrator rights, lab machines) that keeps many K–12 classrooms from writing real code. This paper asks two questions: how do such environments help K–16 STEM instructors bring computer science (CS) into their teaching, and do they raise learners' content gains during and after instruction? Within RAMPED, 20 teachers spent 32 hours on Python in Jupyter notebooks and 32 hours on NetLogo Web. Four assessment items, two from cloud sessions and two from local C++ sessions, trace content knowledge across four checkpoints, and two case studies follow teachers into their classrooms.
</div>

<div class="lede" data-levels="grad" markdown="1">
A pilot mixed-methods study inside a Math–Science Partnership PD (RAMPED: six two-day sessions, 120 contact hours, 30 teachers over a year). For the 20 teachers in the Space and NetLogo sessions, the paper reports percent correct on four items at pre-pre, pre, post, and post-post (Table 6.2.1), labels two items Local and two Cloud by the session they test (Table 5.3.1), and tabulates the changes (Table 6.2.2). Qualitative data (interviews, a three-month implementation survey, and teacher presentations) support two case studies. The page rebuilds the change table and, at this level, examines what the printed percentages imply about who answered.
</div>

<div class="lede" data-levels="res" markdown="1">
Borowczak and Borowczak (2017) argue, from a social constructivist frame, that browser-based environments (JupyterHub-hosted notebooks and NetLogo Web) lower the barrier to CS adoption for novice teachers. Evidence: four items across four checkpoints, where both Cloud items rise from post to post-post (+31, +21) and both Local items fall (−18, −8), and two adoption case studies. The page reproduces all 12 changes in Table 6.2.2, finds one average that does not follow from its row (Q5), shows that only five of the 16 printed percentages are whole numbers of the stated 20 participants, and lists the confounds a reader should weigh against the Local–Cloud contrast.
</div>

## A notebook in the browser

<div id="cn-notebook" class="w-demo"></div>

<div data-levels="public" markdown="1">
Press **Run** under each task. The first task starts with a small mistake: change `range(10)` to `range(1, 11)` and run it again. Nothing here was installed on your device; the code runs inside this page, the way the teachers' code ran inside a web page during RAMPED. That one change in setup is the subject of the paper.
</div>

<div data-levels="hs" markdown="1">
These are the two cloud questions from the paper's assessment: print the numbers 1 to 10 (question 14, from the Space session, in Python) and swap two numbers (question 17b, from the NetLogo session, in Logo; the notebook runs it in Python). Load **Common mistake** on Task 2 to see why swapping needs a third variable: after `a = b`, the old value of `a` is gone.
</div>

<div data-levels="ug" markdown="1">
Every cell talks to one kernel, the process that holds the notebook's variables. Run Task 2, then Cell 3: the third cell reads `a` and `b` without defining them, and its last line appears as `Out`. Run the cells out of order, or press **Restart kernel**, and Cell 3 raises a `NameError`. Hidden state like this is the notebook's main teaching hazard and also what makes it feel like a live workspace. The variable table below the notebook shows the kernel's state after every run.
</div>

<div data-levels="grad res" markdown="1">
RAMPED hosted its Python materials on a JupyterHub instance, a multi-user server that gives each participant a notebook kernel through the browser; the paper does not describe the server, accounts, or costs. This page cannot run a Python server, so it runs MiniPy, a Python subset written for the page (loops, conditionals, functions, lists, strings, and Python's integer and float arithmetic). MiniPy's output matches CPython 3.13 exactly on 114 reference cells, including error messages, and on 1,850 randomized arithmetic expressions; the test files ship with the page in `papers/cloud-notebooks/reference/`.
</div>

## The study: RAMPED

<div id="cn-design" class="w-demo"></div>

<div data-levels="public hs" markdown="1">
RAMPED (Robotics, Applied Mathematics, Physics, and Engineering Design) ran for 16 days: two weeks in the summer and six follow-up days during the school year. Thirty teachers took part. In the summer, each teacher picked four of six two-day sessions, and each session ran twice with 10 seats, so 20 teachers went through every session. The researchers quizzed teachers before the summer, before and after each session, and at the end of the summer. Click a session with an item to follow it through the page.
</div>

<div data-levels="ug" markdown="1">
The paper's data come from four sources: use of the cloud tools, formal and informal interviews, content scores at each checkpoint, and an implementation survey about three months after the summer. Each assessment item belongs to one session, and Table 5.3.1 labels each item's session Local or Cloud. Two sessions taught C++ (Robotics and Raspberry Pi) and two used browser environments (Space in Python and Naturally Inspired, or NNI, in Logo through NetLogo). The paper does not define the labels further or report them for the Virtual Reality and Arduino sessions.
</div>

<div data-levels="grad res" markdown="1">
<div class="cn-scroll">
<table class="results-table">
<caption class="w-note">Design of the study, from the paper's Context, Methods, and participants sections.</caption>
<thead><tr><th>Element</th><th>What the paper reports</th></tr></thead>
<tbody>
<tr><td>Program</td><td>RAMPED, a Math–Science Partnership PD funded under NCLB Title II, Part B (Wyoming Department of Education); 16 days, 120 contact hours; 30 teachers over the year</td></tr>
<tr><td>Structure</td><td>Two-week summer PD of six two-day sessions (each teacher chose four; two offerings of 10 seats per session) and six school-year follow-up days covering all six</td></tr>
<tr><td>Participants analyzed</td><td>20 in-service K–12 teachers in the NetLogo and Space sessions: 35% (seven) high school; 63% (13) science-focused; 12.9 years of teaching on average; 125.5 students a year, about 16 of them on individualized instruction plans</td></tr>
<tr><td>Cloud exposure</td><td>32 hours of Python in Jupyter notebooks (JupyterHub) and 32 hours of NetLogo Web, three days each; materials also on NetLogo's site, the Modeling Commons, and GitHub</td></tr>
<tr><td>Assessments</td><td>Pre-pre, pre, post, post-post, pre-follow, post-follow, and final; Table 6.2.1 reports the first four for four items</td></tr>
<tr><td>Qualitative data</td><td>Interviews, an implementation survey about three months after the PD (lessons, student reactions, limitations, and barriers), and teacher presentations at a partnership conference</td></tr>
<tr><td>Instruction</td><td>Content experts led each session; six of eight were already experienced in educational outreach</td></tr>
<tr><td>Framework</td><td>Social constructivism (Vygotsky)</td></tr>
</tbody>
</table>
</div>
</div>

## Four questions, four checkpoints

<div id="cn-scores" class="w-demo"></div>

<div data-levels="public" markdown="1">
Each line is one quiz question; the shaded band is the two-day session that taught it. Every question improved during its session. The difference shows up afterward. The two questions from the browser-based sessions (blue) kept climbing until the end of the summer, to 86 and 80 percent. The two questions from sessions the paper labels local (gray, dashed), which taught C++, fell back. The authors read this as support for browser tools: teachers could keep using them after the session ended.
</div>

<div data-levels="hs" markdown="1">
Switch to **Change between checkpoints** to see Table 6.2.2. A change is the later percentage minus the earlier one: question 14 rose from 55 to 86 percent after its session, a change of +31 points. Pick an item to read its numbers. Question 7 is the only item answered with pictures instead of code, as the paper notes; keep that in mind when comparing its 45-point jump with the others.
</div>

<div data-levels="ug" markdown="1">
Turn on the Local and Cloud means (computed by the page, unweighted across two items each). Across the two-day session, the local items gained more (+35.5 points against +10.0). From the end of the session to the end of the summer, the order flips: Cloud +26.0, Local −13.0. The paper's averages in Table 6.2.2 have a simple form, since the three changes add up to the whole span: the average change is (post-post − pre-pre) ÷ 3. That identity makes the table easy to check, and it shows that Q5's printed 3.33 does not follow from its row (the row gives 6.67).
</div>

<div data-levels="grad res" markdown="1">
The contrast rests on two items per group, and the groups differ in more than location: language (C++ against Python and Logo), session content, and item format (Q7 is graphical). Post-post comes at the end of the summer for everyone, so the post to post-post interval also depends on where in the two weeks a teacher took the session, and the paper does not report session order. Neither table reports item-level counts, standard errors, or a test; the percentages are presented descriptively.
</div>

<div data-levels="grad res" markdown="1">
<div class="cn-scroll">
<table class="results-table">
<caption class="w-note">Tables 5.3.1, 6.2.1, and 6.2.2 as printed, with the average the page computes from each row. The last column is the page's.</caption>
<thead><tr><th>Item</th><th>Session (language)</th><th>Location</th><th>Pre-pre</th><th>Pre</th><th>Post</th><th>Post-post</th><th>Changes (printed)</th><th>Average (printed)</th><th>Average (page)</th></tr></thead>
<tbody>
<tr><td>Q5</td><td>Robotics (C++)</td><td>Local</td><td>6%</td><td>18%</td><td>44%</td><td>26%</td><td>+12, +26, −18</td><td>3.33</td><td>6.67</td></tr>
<tr><td>Q7</td><td>Raspberry Pi (C++)</td><td>Local</td><td>39%</td><td>45%</td><td>90%</td><td>82%</td><td>+6, +45, −8</td><td>14.33</td><td>14.33</td></tr>
<tr><td>Q14</td><td>Space (Python)</td><td>Cloud</td><td>32%</td><td>39%</td><td>55%</td><td>86%</td><td>+7, +16, +31</td><td>18</td><td>18.00</td></tr>
<tr><td>Q17b</td><td>NNI (Logo)</td><td>Cloud</td><td>29%</td><td>55%</td><td>59%</td><td>80%</td><td>+26, +4, +21</td><td>17</td><td>17.00</td></tr>
</tbody>
</table>
</div>
</div>

## Two teachers, two classrooms

<div id="cn-teachers" class="w-demo"></div>

<div data-levels="public hs" markdown="1">
After the summer, teachers presented their classroom plans at a partnership conference. The squares are the slides in two of those presentations, with the slides about each tool filled in. A high school physics teacher, new to teaching, used the notebooks to learn Python on her own and built part of her class around them. A fourth-grade teacher turned NetLogo Web into lessons, and she reported that students who had never coded before were changing the model's code within 15 minutes.
</div>

<div data-levels="ug grad res" markdown="1">
The case studies answer the first research question qualitatively. The physics teacher (under two years of experience) devoted eight of 24 slides to Jupyter, and a follow-up interview matched that emphasis to her implementation plan; the elementary teacher (about 10 years) devoted more than half of 23 slides to NetLogo. The authors' reading: teachers with continuous web access to a working environment became self-learners and carried CS into class, while tools that needed district technology support or per-student purchases were less likely to be adopted.
</div>

<div data-levels="grad res" markdown="1">
## How many teachers answered

<div id="cn-denoms" class="w-demo"></div>

Table 6.2.1 is printed as the percentage of 20 participants answering correctly, but a percentage of 20 must be a multiple of five, and only five of the 16 entries are (45, 90, 55, 55, and 80). The page asks, for every group size *n*, which entries some whole number of correct answers out of *n* can produce when rounded. No single *n* from 10 to 30 fits all four checkpoints of any item; the smallest that does is 34 for Q5 and between 44 and 49 for the others, more teachers than the 30 in the whole PD. The most likely reading is that the number answering changed from checkpoint to checkpoint. This search is the page's analysis, not the paper's.
</div>

## What the paper found

<div data-levels="public hs" markdown="1">
- Teachers improved on all four coding questions during the two-day session that taught each one.
- By the end of the summer, the two questions from browser-based sessions had climbed to 86 and 80 percent correct.
- The two questions from the sessions labeled local fell back after their sessions ended.
- Teachers were frustrated and hesitant at first, then more willing to use free web tools than tools that needed extra support or money for each student.
- A physics teacher and a fourth-grade teacher both built classroom lessons around the browser tools.
</div>

<div data-levels="ug grad res" markdown="1">
- **Gains during instruction on every item.** Percent correct rose from pre-pre to pre to post on all four items (Table 6.2.1).
- **Cloud items kept rising afterward.** From post to post-post, Q14 gained 31 points and Q17b 21; Q5 lost 18 and Q7 lost 8 (Table 6.2.2).
- **Adoption favored free web tools.** After initial frustration, teachers were more willing to adopt free web-based technology than tools requiring added support or per-student spending.
- **Self-learning followed access.** Instructors with web-based programming access were more likely to keep learning on their own and to implement CS in class (two case studies).
- **Stated limits.** Twenty self-selected participants in a paid PD, mostly from one district; a short PD for a new technical area; a survey only three months out; and expert staff unusually experienced in outreach.
</div>

## Why it matters

<div data-levels="public hs" markdown="1">
Many schools want computer science in every grade but lack the computer labs, software licenses, and technical staff to support it. This study suggests a lighter path: browser-based tools let teachers keep practicing after a training ends, and teachers adopt the tools that cost their schools nothing and need no installation. Ultimately, the barrier the authors removed was setup, and the teachers did the rest.
</div>

<div data-levels="ug" markdown="1">
Short web activities, such as an Hour of Code, end where the activity ends; moving on to real programming usually means a local install, which the paper argues stalls learners. Fully functional environments in the browser close that gap for teachers and, through them, for students. The paper's implication for PD designers and university outreach: use cloud-based coding environments to get K–20 instructors incorporating CS into the STEM courses they already teach.
</div>

<div data-levels="grad res" markdown="1">
The design is a pilot, and its quantitative evidence is four items without item-level counts. Its value lies in the question it isolates, retention and reuse after instruction as a function of where the code runs, and in a measurement plan (seven checkpoints through a school year) that a larger study could carry out in full. The same PD appears in the authors' journal study of the NetLogo session ([Education Sciences, 2019](/papers/ants-go-marching/)), which reports the same four items among seven, and the team later moved to fully online, self-paced formats with cybersecurity microcredentials for teachers ([Education Sciences, 2021](/papers/cyber-microcredentials/)).
</div>

<div data-levels="res" markdown="1">
## Notes from building this page

- **Q5's average.** Table 6.2.2's average change equals (post-post − pre-pre) ÷ 3 on three rows; for Q5 that gives 20 ÷ 3 = 6.67, against the printed 3.33 (exactly half). The three printed changes for Q5 are correct.
- **Denominators.** Only five of 16 entries in Table 6.2.1 are whole numbers of 20, and no single group size up to 30 reproduces any item's four checkpoints. The number of teachers answering most likely varied by checkpoint; reporting those counts would allow a paired test. The 2019 journal paper prints the same values for these four items and also averages "across all 22 participants," which supports varying counts.
- **What Local and Cloud mean.** The labels appear only in Table 5.3.1 and attach to sessions, so each comparison also contrasts C++ against Python or Logo, robotics and Raspberry Pi content against space science and bio-inspired models, and one graphical item against code items. With two items per group, the contrast cannot separate these.
- **Timing of post-post.** Post-post follows the whole summer, so the interval after a session depends on when a teacher took it; teachers who took a session in the second week had less time to forget, or to keep practicing. Session order is not reported.
- **Three or two case studies.** The abstract describes three case studies, including a university instructor's PD and undergraduate teaching; the body presents two (Case Studies I and II).
- **Survey results.** Methods state that implementation survey results appear in "Table 6.2.1," which reports assessment scores; the survey results themselves are not tabulated.
- **Small details.** Thirteen of 20 is 65 percent (63 percent printed); "about 12% of their students (16)" reads as 16 of the average 125.5 students, which is 12.7 percent.
</div>

<div data-levels="hs" markdown="1">
## Try this in class

1. Give the class the two notebook tasks above on paper first: write code that prints 1 to 10, and code that swaps two numbers. Collect the answers without grading them.
2. Open this page, run each task's **Starter**, **Common mistake**, and **Solution**, and ask students to explain each output before they press **Run**.
3. A week later, ask both questions again, on paper and without the page, and compare the percent correct with the class's first try, as the RAMPED researchers did with teachers.
</div>

---
title: "Sprints for CS1: Retakes, Reinforcement, and a 92 Percent Pass Rate"
kicker: "Interactive paper · ASEE Annual Conference 2025"
subtitle: "An interactive companion to Andey Robins, Mike Borowczak, and Andrea C. Borowczak's redesign of an introductory programming course into three-week sprints, where every topic is taught, applied, and assessed, and every quest can be retaken."
description: "Walk the 16-week schedule of an agile, constructivist CS1 course, retake a quest built from the course's own Collatz lab, read the pass rates for 219 majors and non-majors, and, at the graduate and researcher levels, recompute Table 2 from the counts in the text and find the one count that rebuilds it."
share_description: "An intro programming course rebuilt as three-week sprints: teach, apply, assess, and let students retake every quest. 92.56 percent passed across two semesters. Explore the course design and the numbers at five reading levels."
share_text: "Teach it, apply it, test it, and let students retake the test. One CS1 course, two semesters, a 92.56 percent pass rate:"
share_image: /papers/flexible-learning-cycles/share.png
share_image_alt: "Sixteen weeks drawn as content, reinforcement, and quest squares with the five chances to take Quest A marked, and pass rates of 95.83 percent for majors, 90.90 for non-majors, and 92.56 overall beside the upper-70s range for CS1, next to the title Sprints for CS1."
date: 2026-10-21
topics: ["Education"]
default_level: public
level_hints:
  public: No background needed
  hs: Schedules, percentages, and a little Python
  ug: Course design, loops, and an autograder
  grad: Interval estimates and a table audit
  res: Full design, reconstruction, and open questions
authors:
  - name: Andey Robins
    affiliation: University of Central Florida
    link: http://portfolio.andeyrobins.org/
  - name: Mike Borowczak
    affiliation: University of Central Florida
    member: mike-borowczak
  - name: Andrea C. Borowczak
    affiliation: University of Central Florida
    member: andrea-borowczak
sources:
  - venue: "ASEE Annual Conference & Exposition · Montreal, QC · 2025"
    title: "Flexible Learning Cycles: Introducing an Agile Constructivist Pedagogy"
    url: https://doi.org/10.18260/1-2--56579
    access: Free to read
code:
  label: "cxedhub/cosc-1010-intro-labs (the course's ten labs, cited by the paper)"
  url: https://github.com/cxedhub/cosc-1010-intro-labs
citations:
  - asee_peer2025
widget:
  css:
    - /papers/flexible-learning-cycles/widget.css
  js:
    - /papers/flexible-learning-cycles/flc-engine.js
    - /papers/flexible-learning-cycles/widget.js
credit: "Interactive page by the [DRACO Lab](/). The schedule is the paper's Table 1 and the pass rates its Table 2; the page reproduces five of Table 2's nine cells exactly from the counts printed in the text (for example, majors 69 of 72 = 95.83 percent) and the printed survey response rates (77 of 129 = 60 percent, 34 of 90 = 38 percent). The quest demo runs Lab 3 from the course's public lab repository (code GPLv3); its model of the lab gives the same outcome as Python on every one of the 1,296 ways to fill the lab's blanks, on all five of the lab's test inputs. The Wilson intervals and the count search at the graduate and researcher levels are the page's own and match an independent Python check (statsmodels, exact fractions). Everything runs on your device."
bibtex: |
  @inproceedings{robins2025flexible,
    author    = {Robins, Andey and Borowczak, Mike and Borowczak, Andrea C.},
    title     = {Flexible Learning Cycles: Introducing an Agile Constructivist Pedagogy},
    booktitle = {2025 ASEE Annual Conference \& Exposition},
    address   = {Montreal, Quebec, Canada},
    year      = {2025},
    month     = {June},
    publisher = {ASEE Conferences},
    doi       = {10.18260/1-2--56579},
    url       = {https://peer.asee.org/56579}
  }
---

<div class="lede" data-levels="public" markdown="1">
First college programming courses lose many students: in the studies this paper cites, more than one in five does not pass. Andey Robins, Mike Borowczak, and Andrea C. Borowczak rebuilt one such course around short, repeating cycles borrowed from how software teams work. Every three weeks, students saw a topic taught, saw it used on real problems, and then tried a "quest" on their own, and they could retake each quest later in the term. Over two semesters, 92.56 percent of 219 students passed. This page lets you walk the schedule, try a quest built from one of the course's labs, and read the results.
</div>

<div class="lede" data-levels="hs" markdown="1">
The course ran 16 weeks in five three-week sprints. Week one of a sprint introduced a topic, week two applied it to problems from genetics, games, and astronomy, and week three held a quest: a short knowledge check and a small program to finish. Each quest could be retaken in later weeks, and only the best attempt counted. Of 219 students across Fall 2022 and Spring 2023, 92.56 percent earned an A, B, or C. Every chart below comes from the paper's two tables or from the course's own lab materials.
</div>

<div class="lede" data-levels="ug" markdown="1">
This paper redesigns CS1 (the first programming course, taught here in Python) as an agile loop: a content week ("I do"), a reinforcement week ("we do"), and a quest week ("you do"), repeated five times. Quests replace high-stakes exams. Each has a knowledge segment (multiple choice, Parsons puzzles, and short answers) and a programming segment (complete a partially finished program), and either segment can be retaken later, with the best score kept. The class reviews what went wrong on each quest before the next topic begins. Across two semesters, 95.83 percent of 72 majors and 90.90 percent of 147 non-majors passed.
</div>

<div class="lede" data-levels="grad" markdown="1">
A descriptive course-design study: one CS1 course, two consecutive offerings (Fall 2022 and Spring 2023, n = 219), no comparison section, and no pre or post measure. Outcomes are pass rates (A to C, 70 percent or higher) by major status and themes from an anonymous department survey (response rates 60 and 38 percent). The paper compares its 92.56 percent pass rate with literature values in the upper 70s without a test. At this level the page adds 95 percent Wilson intervals and an audit of Table 2 against the counts printed in the text, both labeled as its own.
</div>

<div class="lede" data-levels="res" markdown="1">
Robins, Borowczak, and Borowczak (2025) combine gradual release of responsibility with agile sprints and mastery-style retakes in CS1, and report pass rates and survey themes from two offerings. Table 1 fixes the schedule, so the number of attempts per quest follows from it (five for Quest A down to one for the final). Table 2 does not agree with the counts in the text: those counts reproduce five of nine cells. A single replacement count (Fall 2022 non-majors 64 of 70, where the text says 71 of 82) reproduces all nine, and it is the only one with a denominator up to 1,000. The notes at the end list this and other details for the authors.
</div>

## Sixteen weeks, five sprints

<div id="flc-calendar" class="w-demo"></div>

<div data-levels="public" markdown="1">
Each colored square is one week. Dark squares introduce a topic, outlined squares apply it, and bright squares are quest weeks, when students show what they can do on their own. Pick a quest and the dots show every week a student could take it. Quest A, the first, has five chances; the final quest has one. Select any week to see its lab.
</div>

<div data-levels="hs" markdown="1">
Count the dots for each quest: five for A, four for B, three for C, two for D, and one for the final. Early topics get the most chances because everything later builds on them. Retakes sit in reinforcement weeks 5, 8, and 11 and in week 15, so a student who struggled with storing data in week 3 can show progress in week 15, after 12 more weeks of practice.
</div>

<div data-levels="ug grad res" markdown="1">
The five topics run from Storing and Manipulating Data through Controlling Flow and Process, Collections of Data, and Files & More to Advanced Concepts. Labs meet weekly (up to 30 students, one graduate and one or two undergraduate teaching assistants): two lab weeks introduce material, simple first and more abstract second (the Collatz lab has one loop and one `if`; the rock-paper-scissors lab has several of each), and the quest week is open work time. The paper argues that this cycle catches a misconception within three weeks, where revising a traditional course takes a month or longer.
</div>

<div data-levels="res" markdown="1">
The text says segments are retaken in "later reinforcement weeks," while Table 1 lists the last retake window in week 15, a quest week, and lists no retake in week 14, the last reinforcement week. The demo follows Table 1.
</div>

## Try a quest, then try it again

<div id="flc-quest" class="w-demo"></div>

<div data-levels="public" markdown="1">
This is a real lab from the course: a program that counts how many steps a number takes to fall to 1 when you halve even numbers and triple-and-add-one to odd ones. Six lines are blank. Pick an answer for each, press **Run the autograder**, and see how many of five checks pass. Wrong answers cost nothing but an attempt, and only your best attempt counts, which is the whole idea of the course's quests.
</div>

<div data-levels="hs" markdown="1">
Start with 6: it goes 6, 3, 10, 5, 16, 8, 4, 2, 1, which is eight steps, and the autograder expects the output `8`. Try a wrong choice on purpose (`odd_collatz(n)` in the even branch, say) and read the result table: some inputs fail, some never finish, and the error names the problem. That feedback, before the grade is final, is what the retake system buys.
</div>

<div data-levels="ug" markdown="1">
The menus allow 1,296 programs, and exactly two pass all five tests. The lab intends `n // 2`; `n / 2` also passes, because Python's true division makes `n` a float (6 / 2 is 3.0) and the loop still stops at 1.0, which equals 1. Output-only autograding cannot see the difference, which is one reason the course pairs every programming segment with a knowledge segment and a class review. The number of attempts follows the quest picked above: five for Quest A, one for the final.
</div>

<div data-levels="grad res" markdown="1">
The paper's quests are not public, so the demo uses Lab 3 as a stand-in for a quest's programming segment, which the paper describes in the same form (a partially finished program). The model behind the demo was checked against Python itself: every one of the 1,296 filled-in programs gives the same outcome in the page and in CPython (the same output, the same exception class, or no finish in either: 10,000 loop passes in the page, 0.1 seconds in Python) on all five test inputs. Best-of-k scoring is a monotone policy, so a student's counted score can only rise across attempts; the paper does not report how many attempts students used.
</div>

## Who passed

<div id="flc-pass" class="w-demo"></div>

<div data-levels="public" markdown="1">
Each dot is a pass rate: the share of students who earned an A, B, or C. Across both semesters, 92.56 percent passed. Students in the major passed at 95.83 percent and students from other majors at 90.90 percent. The studies the paper cites put typical first programming courses in the upper 70s.
</div>

<div data-levels="hs" markdown="1">
A pass rate is passing students divided by all students. In Fall 2022, 53 of 54 majors passed: 53 ÷ 54 = 0.9815, or 98.15 percent. Spring 2023 had only 18 majors, so two students not passing moved that rate down to 88.88 percent. Small groups swing more, which is why the yearly row (69 of 72 majors) is the steadier number.
</div>

<div data-levels="ug" markdown="1">
Switch to **From the text's counts** to divide the counts the paper prints. Five cells match, including both Spring 2023 cells and the majors' year. Four do not: the text gives Fall 2022 non-majors as 71 of 82 (86.59 percent) where the table prints 91.42, and the year totals inherit the difference. The non-major counts also add to 155, while the table header says 147.
</div>

<div data-levels="grad res" markdown="1">
The Wilson intervals (the page's) show how much two semesters can say. The year's pass rate sits between 86.3 and 93.9 percent on the text's counts (206 of 227), or between 88.3 and 95.4 percent on the rebuilt counts (199 of 215); either way the lower bound clears the upper-70s range the paper cites. The literature range is a summary of other courses, not a measured control, so this comparison describes the gap without testing it. Spring 2023 majors (16 of 18) span 67 to 97 percent. The search below shows that one Fall 2022 non-major count rebuilds the whole table.
</div>

## What students said

<div id="flc-survey" class="w-demo"></div>

<div data-levels="public hs" markdown="1">
Students answered an anonymous, open-ended survey at the end of each semester. Three in five responded in the fall and about two in five in the spring. The most repeated point: retakes turned grade anxiety into what one student called "motivational stress."
</div>

<div data-levels="ug grad res" markdown="1">
The survey asked about three areas: whether assignments met their learning objectives, how engaged students stayed, and how they linked engagement to success. It recorded no majors or grades, so its themes cannot be tied to the pass rates above, and the paper reports no counts per theme. The authors name the anonymous, anecdotal nature of this feedback as a limitation, along with possible after-effects of the COVID-19 pandemic.
</div>

## What the paper found

<div data-levels="public hs" markdown="1">
- Across Fall 2022 and Spring 2023, 92.56 percent of 219 students passed the redesigned course.
- Majors passed at 95.83 percent and non-majors at 90.90 percent over the year.
- Students said retakes lowered the pressure of grades and that applying each topic to real problems helped.
- The teaching team could fix a misunderstanding within three weeks, where revising a course usually takes a month or more.
- In the second semester, students understood a tricky Python rule (how slices count positions) better after only small changes to how it was taught.
</div>

<div data-levels="ug grad res" markdown="1">
- **High pass rates.** 92.56 percent of 219 students passed (A to C) across two offerings; majors 95.83 percent (n = 72), non-majors 90.90 percent (n = 147); literature values for CS1 sit in the upper 70s, with media-computation courses near 90 percent.
- **Fast correction.** Whole-class review after each quest addresses misconceptions within three weeks; the authors credit this turnaround and the lowered pressure to learn each topic once, in one way, for the results.
- **Slicing improved.** Comprehension of Python's half-open slices improved in the second cohort with minimal changes to the presentation.
- **Student response.** Themes: retakes reduced grade pressure, reinforcement lectures built mental models of execution, several instructors with different styles helped, and the material applied beyond the course.
- **Next steps.** Pre and post assessments, longitudinal tracking into later courses, and trials at other institutions.
</div>

<div data-levels="grad res" markdown="1">
<div class="flc-scroll">
<table class="results-table">
<caption class="w-note">Table 2 with the counts in the text and the page's 95 percent Wilson intervals (the last two columns are the page's).</caption>
<thead><tr><th>Semester</th><th>Group</th><th>Printed (%)</th><th>Text's counts</th><th>Wilson 95% (page)</th><th>Rebuilt (page)</th></tr></thead>
<tbody>
<tr><td>Fall 2022</td><td>Majors</td><td>98.15</td><td>53/54</td><td>90.2 to 99.7</td><td>53/54</td></tr>
<tr><td>Fall 2022</td><td>Non-majors</td><td>91.42</td><td>71/82 (86.59)</td><td>77.6 to 92.3</td><td>64/70</td></tr>
<tr><td>Fall 2022</td><td>All</td><td>94.35</td><td>124/136 (91.18)</td><td>85.2 to 94.9</td><td>117/124</td></tr>
<tr><td>Spring 2023</td><td>Majors</td><td>88.88</td><td>16/18</td><td>67.2 to 96.9</td><td>16/18</td></tr>
<tr><td>Spring 2023</td><td>Non-majors</td><td>90.41</td><td>66/73</td><td>81.5 to 95.3</td><td>66/73</td></tr>
<tr><td>Spring 2023</td><td>All</td><td>90.11</td><td>82/91</td><td>82.3 to 94.7</td><td>82/91</td></tr>
<tr><td>Both</td><td>Majors</td><td>95.83</td><td>69/72</td><td>88.5 to 98.6</td><td>69/72</td></tr>
<tr><td>Both</td><td>Non-majors</td><td>90.90</td><td>137/155 (88.39)</td><td>82.4 to 92.5</td><td>130/143</td></tr>
<tr><td>Both</td><td>All</td><td>92.56</td><td>206/227 (90.75)</td><td>86.3 to 93.9</td><td>199/215</td></tr>
</tbody>
</table>
</div>
</div>

## Why it matters

<div data-levels="public hs" markdown="1">
A first programming course often decides whether a student stays in computing. This course gave every student several chances to show what they had learned, and it fixed confusion while the topic was still fresh. Almost everyone passed, including the students who were not computing majors. The design asks for no special software: a schedule, a set of retakeable quests, and a habit of reviewing mistakes together.
</div>

<div data-levels="ug" markdown="1">
The paper moves an idea from industry into the classroom: software teams work in short sprints with frequent review, and this course does the same with teaching. The cost sits with the instructors (writing several versions of each quest, grading retakes, and holding small-group sessions), and the payoff is a course in which an early stumble no longer decides the grade. The labs are public, so another department can start from the same materials.
</div>

<div data-levels="grad res" markdown="1">
The design is portable and the evidence so far is descriptive: one institution, two offerings, no comparison section, and pass rates that depend on grading policy, which the redesign itself changed. The authors call for pre and post measures, longitudinal tracking, and multi-site trials. A controlled comparison, per-student attempt logs, and DFW counts before and after the redesign would let the next study separate the effect of retakes from the effect of the sprint structure.
</div>

<div data-levels="res" markdown="1">
## Notes from building this page

- **One count rebuilds Table 2.** The text's counts reproduce five cells (Fall majors, all three Spring cells, and year majors). Holding those, a search over every Fall 2022 non-major count k of n with n up to 1,000 finds exactly one pair that reproduces the other four printed cells: 64 of 70 (91.43, printed 91.42). It implies 143 non-majors and 215 students for the year, four fewer than the headers' 147 and 219 in each case. The text's 71 of 82 implies 155 and 227.
- **Mixed rounding.** No count fits if every cell is rounded, or if every cell is cut, to two decimals: 98.15 (53/54) is rounded, while 88.88 (16/18), 91.42 (64/70), and 90.90 (130/143) are cut. Table 2 appears to mix the two.
- **219 or 218.** Table 2's 219 equals the survey's enrollments (129 + 90). The lab repository's README reports 218 students across the year.
- **"Significantly higher."** The paper calls 92.56 percent significantly higher than the upper-70s literature values without a test; the intervals above describe the gap, but the literature figures come from other courses and grading policies.
- **DFW.** The abstract reports a reduction in D, F, and withdrawal grades; the body reports pass rates only, with no earlier DFW rate for comparison. Withdrawals are not identified in Table 2.
- **Retake weeks.** The text places retakes in reinforcement weeks; Table 1 places the last window in week 15 (a quest week) and none in week 14. The week 11 lab is printed without its number (Lab 8).
- **Lab 3 starter.** The public `main.py` leaves the odd function's `return` line flush left, so completing the header also requires indenting it; the demo shows the indented form.
- **Title and byline.** The PDF title page reads "Introducing an Agile Constructivist Pedagogy" and lists three authors; the ASEE PEER record reads "Introducing Agile Constructivist Pedagogy" and lists two.
</div>

<div data-levels="hs" markdown="1">
## Try this in class

1. Split a unit into three parts: one day you show a new idea, one day the class uses it together on a real problem, and one day each student tries a short quiz alone.
2. Review the most common mistakes with the whole class before starting the next idea, then offer a retake of the quiz in a later week and keep each student's best score.
3. At the end, divide the number of students who passed by the number enrolled, and compare your rate with the 92.56 percent in **Who passed**.
</div>

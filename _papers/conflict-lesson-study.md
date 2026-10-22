---
title: "One Lesson, Taught Three Times: Action Research and Lesson Study in Engineering"
kicker: "Interactive paper · Educational Action Research 2019"
subtitle: "An interactive companion to Andrea C. Borowczak and Mike Borowczak's year-long study of one soft-skills and conflict lesson, taught to 85 computer science and engineering undergraduates in three rounds and revised from the observers' field notes after each."
description: "Play the lesson's straw-and-paper-ball team game, follow the year of three research lessons (18, 38, and 29 participants), see what the group changed each time, code the paper's field notes into its four themes, and compare your coding with the group's."
share_description: "Three faculty and a graduate student taught one teamwork and conflict lesson three times in a year, watched 85 engineering students, and rewrote the lesson from their notes each time. Play the lesson's game and code the notes yourself, at five reading levels."
share_text: "One soft-skills lesson, taught three times and rebuilt from field notes each time. Play the game and code the notes:"
share_image: /papers/conflict-lesson-study/share.png
share_image_alt: "Three bars for 18, 38, and 29 participants across February 2017, November 2017, and February 2018, beside the title One Lesson, Taught Three Times."
date: 2026-10-22
topics: ["Education"]
default_level: public
level_hints:
  public: No background needed
  hs: Teamwork, notes, and counting
  ug: Engineering coursework and accreditation
  grad: Qualitative methods and coding
  res: Full design, interpretation, and open questions
authors:
  - name: Andrea C. Borowczak
    affiliation: University of Wyoming
    member: andrea-borowczak
  - name: Mike Borowczak
    affiliation: University of Wyoming
    member: mike-borowczak
sources:
  - venue: "Educational Action Research · 2019 (online January 15, 2019)"
    title: "Computer Science and Engineering: Utilizing Action Research and Lesson Study"
    url: https://doi.org/10.1080/09650792.2019.1566082
    access: Paywalled (Taylor & Francis)
citations:
  - burrows2019lesson
widget:
  css:
    - /papers/conflict-lesson-study/widget.css
  js:
    - /papers/conflict-lesson-study/cl-engine.js
    - /papers/conflict-lesson-study/widget.js
credit: "Interactive page by the [DRACO Lab](/). Every count, date, rule, and quotation comes from the paper's methodology and findings sections and its Table 1; the page reproduces the paper's 85 participants from its three lesson counts (18, 38, and 29) and the four themes' printed order. The game's target, puff reach, and drift are the page's choices, so its scores are simulated. The excerpt tallies, the simulated rule comparison, and the kappa statistic at the graduate and researcher levels are the page's own, checked against an independent Python implementation. Everything runs on your device."
bibtex: |
  @article{borowczak2019lesson,
    author    = {Borowczak, Andrea C. and Borowczak, Mike},
    title     = {Computer Science and Engineering: Utilizing Action Research and Lesson Study},
    journal   = {Educational Action Research},
    year      = {2019},
    publisher = {Taylor \& Francis},
    doi       = {10.1080/09650792.2019.1566082}
  }
---

<div class="lede" data-levels="public" markdown="1">
Engineers spend much of their working lives on teams, yet few engineering classes teach how to handle a disagreement. Three faculty members and a graduate student at the University of Wyoming (the "Conflict group") wrote one class session on teamwork and conflict, taught it three times over a year to 85 computer science and engineering students, and watched closely each time. After every round they read their notes together and changed the lesson. This page lets you play the lesson's team game, follow the year, and sort the group's notes yourself.
</div>

<div class="lede" data-levels="hs" markdown="1">
A research team taught the same class session three times, in February 2017, November 2017, and February 2018, to 18, 38, and 29 college students (85 in all). While one member taught, the others wrote down what students said and did. Afterward the team marked each note with a colored dot for one of four themes and used what they found to rewrite the lesson. You can play the team game from the lesson and then try the same note sorting.
</div>

<div class="lede" data-levels="ug" markdown="1">
ABET (the Accreditation Board for Engineering and Technology) expects engineering and computing programs to graduate students who can function on teams and communicate. This paper reports how one interdisciplinary group (two engineering faculty, one education faculty member, and one graduate student) designed and revised a single soft-skills lesson on ABET, partnerships, and conflict management. The lesson ran three times (85 participants), and observational field notes drove each revision. The group ends with a methodological claim: action research and lesson study are related but distinct approaches.
</div>

<div class="lede" data-levels="grad" markdown="1">
A qualitative action research study with an embedded lesson study: one research lesson on ABET soft skills and conflict management, taught in three iterations (n = 18, 38, and 29; 85 in total) between February 2017 and February 2018, with observational field notes as the primary data. Notes from four notebooks were coded by consensus into four themes (interest, discussion, topic expansion, and confusion or complacency), ranked by frequency. Pre and post surveys were collected but not reported. The page lays out the design, the revisions, and the printed evidence, and lets you code the 18 printed excerpts.
</div>

<div class="lede" data-levels="res" markdown="1">
Borowczak and Borowczak (2019) use a year of iterated teaching to argue that action research (AR) and lesson study are separate ventures, against Dudley (2013) and Austin (2017), who treat lesson study as a form of AR. The evidence is a single research lesson revised twice, consensus-coded field notes reported as a theme ranking without counts, and printed excerpts. This page rebuilds the design and timeline, separates what the paper reports from what it infers, connects the first iteration to the authors' 2017 baseline study, and lists the reporting gaps a replication would need to close.
</div>

## The team game

<div id="cl-game" class="w-demo"></div>

<div data-levels="public" markdown="1">
In the lesson, teams of four or five made 20 paper balls from one sheet of paper and took turns blowing them through straws onto a target. Each player had up to five puffs, the order was fixed, and only the team's "associate" could give instructions. The game is small on purpose: a team has to agree on a plan, live with a limited supply of breath, and accept a score that a neighboring team checks.
</div>

<div data-levels="hs" markdown="1">
Count the resources. A team of five has 25 puffs for 20 balls, so no team can move every ball far. In the third lesson the group added a second round with 10 balls and four puffs each and asked for the same score. Switch the rules above and notice how much more each puff has to count. The target rings and how far one puff carries are the page's choices; the paper does not print its target.
</div>

<div data-levels="ug grad res" markdown="1">
Table 1 of the paper sets the roles: a leader who starts and ends play, an associate who is the only member allowed to give instructions, members who keep their places and puff in a fixed order, a 10-minute timer, and an adjacent team that verifies the score. From the second lesson on, the group added common industry conflicts (limited funding, resources, personnel, and peer evaluations), and in the third lesson the second round cut the balls to 10 and the puffs to four while keeping the target score. The page's game models only the puffs, so its scores illustrate the constraint rather than measure anything the paper reports.
</div>

<div data-levels="grad res" markdown="1">
The simulated table holds the team plan fixed (each puff goes to the ball with the most to gain). Under that plan the score depends on the number of puffs, not the number of balls: a team of five under the tighter rules has the same 20 puffs as a team of four under the original rules and scores the same. Reaching the original score under the tighter rules takes a better plan; the paper reports that the tighter round "encouraged detailed discussion about what each participant should do."
</div>

## One year, three research lessons

<div id="cl-cycle" class="w-demo"></div>

<div data-levels="public hs" markdown="1">
The group met every month starting in January 2017. Around each lesson came about four weeks of planning and two weeks of close discussion afterward. In each lesson one member taught and the others took notes, so the members writing down what students said were not the member teaching.
</div>

<div data-levels="ug grad res" markdown="1">
The lesson study cycle the group followed (after Lewis, Perry, and Murata 2006) repeats four steps: study the curriculum and set goals, plan, teach a public "research lesson" while others observe, and reflect on the evidence. The education faculty member taught the first two lessons; an engineering faculty member taught the third. Each iteration had a six- to eight-week period of intense work, about four weeks before the lesson and two weeks after.
</div>

## The lesson, three times

<div id="cl-lesson" class="w-demo"></div>

<div data-levels="public hs" markdown="1">
The seven steps stayed the same each time. What changed was how each idea was taught: first all together, then one at a time with names and examples, then with an example from industry for every idea. After the first round, students also said they wished they had heard this earlier in college, so the next two rounds went to classes with more freshmen and sophomores.
</div>

<div data-levels="ug grad res" markdown="1">
The revisions follow the observations. After Lesson 1, participants' answers to in-class questions missed the connections between components, so Lesson 2 separated five components and named each explicitly, with concrete examples of three conflict types (resource, objective, identity) and four resolution strategies (argumentation, resonance, innovation, action). After Lesson 2, participants could articulate the connections when asked but missed real-world uses, so Lesson 3 attached an industry example to every component. The move to freshman- and sophomore-heavy classes came from participants' comments after Lesson 1; the paper reports that the observational notes did not appear to change with it.
</div>

## Code the notes

<div id="cl-notes" class="w-demo"></div>

<div data-levels="public hs" markdown="1">
The group sorted its notes the same way: pass the notebooks around, put a colored dot next to each note for a theme, and agree on every dot before the meeting ended. Some notes fit two themes. "Hurry up so we can get some points" shows interest and is also part of a discussion; the group picked one by what was happening in the room at the time.
</div>

<div data-levels="ug" markdown="1">
Coding means assigning each piece of qualitative data to a category so patterns can be counted and compared. The group's categories grew out of the notes themselves ("the group changed the number of themes as more observational notes were analyzed"), an inductive approach. Note 8 shows how much context decides: a student saying "I just don't get it" appears under discussion, although on its own the remark reads like confusion; the group placed notes by what was happening in the room.
</div>

<div data-levels="grad res" markdown="1">
The group coded by consensus and did not compute inter-rater reliability. The kappa statistic the page reports compares your coding with the group's final codes over the excerpts you coded; it illustrates the agreement measure a replication could add, and it is the page's analysis, not the paper's. The printed excerpts are a selection ("common statements") rather than a sample, so agreement on them says little about agreement on the full notebooks.
</div>

## What the notes showed

<div id="cl-themes" class="w-demo"></div>

<div data-levels="public" markdown="1">
- Students were interested: the most common notes recorded students leaning forward, laughing in recognition, and sharing examples from their own lives.
- Students talked to each other, especially during the game and the partner activity.
- Some conversation wandered off topic, and some students stayed quiet or said they did not need the lesson.
- One student called the lesson "pretty fun, definitely memorable," and another wrote that learning to work with others matters alongside learning content.
</div>

<div data-levels="hs" markdown="1">
- Four themes, from most to least common in the notes: interest, discussion, topic expansion, and confusion or complacency.
- 85 students took part across three lessons: 18, then 38, then 29.
- The observers saw no difference between how female and male students took part.
- Even after three rounds, the notes did not show students actually using conflict-management skills during the game, so the group suggested a longer, two-day version.
</div>

<div data-levels="ug grad res" markdown="1">
- **Themes.** Interest in the material appeared most often, then discussion about the material, then topic expansion or misdirection, then confusion or complacency.
- **Revisions.** Each lesson changed in response to the previous one's notes: explicit components in Lesson 2, industry examples in Lesson 3, and two rounds of the game with tighter rules.
- **Limits of the outcome.** Conflict identification and management were "almost absent" in the notes and on pretests; participants said they would "try and compromise." The notes did not show conflict-management skills during the game or the think/pair/share activity.
- **Participation.** The observers noted no difference in female and male participation.
- **Method.** The group concludes that it engaged in AR with an embedded lesson study: AR frames a problem with stakeholders and moves a field forward, while lesson study perfects a lesson.
</div>

<div data-levels="grad res" markdown="1">
<div class="cl-scroll">
<table class="results-table">
<caption class="w-note">Design of the study, from the paper's methodology and findings sections.</caption>
<thead><tr><th>Element</th><th>What the paper reports</th></tr></thead>
<tbody>
<tr><td>Setting</td><td>A land-grant university in the western United States (the University of Wyoming); engineering population 23 percent non-white and 16 percent female</td></tr>
<tr><td>Research question</td><td>How do we design a soft skills engineering lesson that encourages undergraduate computer science and engineering students to talk to each other and use the conflict management negotiation skills presented?</td></tr>
<tr><td>Group</td><td>Two education members (faculty and graduate student) and two engineering faculty; met monthly from January 2017</td></tr>
<tr><td>Iterations</td><td>February 2017 (18 participants), November 2017 (38), and February 2018 (29); 85 in all</td></tr>
<tr><td>Primary data</td><td>Observational field notes from four notebooks, coded by consensus with colored dots; no inter-rater reliability</td></tr>
<tr><td>Supplementary data (not reported)</td><td>Pre and post content and soft-skill perception surveys in each lesson; a college-wide perception survey in February 2017 and February 2018</td></tr>
<tr><td>Result</td><td>Four themes ranked by frequency; revisions after each iteration; AR and lesson study judged distinct</td></tr>
<tr><td>Funding</td><td>National Science Foundation award 1339853; Wyoming Department of Education award 1601506MSPA2 (RAMPED)</td></tr>
</tbody>
</table>
</div>
</div>

## Why it matters

<div data-levels="public hs" markdown="1">
Good teaching rarely arrives in its first version. This study shows a practical way to improve one class: teach it while colleagues watch the students, write down what happens, agree on what it means, and change one thing at a time. Ultimately, the same habit of observing, reflecting, and revising is how engineers improve a design.
</div>

<div data-levels="ug grad res" markdown="1">
Engineering programs must show ABET that graduates can work on teams and communicate, and the studies the paper cites find that students reach college with few of those skills taught by name. This paper offers a reproducible process (a small cross-college group, a public research lesson, structured observation, and evidence-based revision) that any department can run on a single class session. Ultimately, its value lies in the process: the group's own notes show where the lesson still falls short, and that evidence sets the agenda for the next iteration.
</div>

<div data-levels="res" markdown="1">
## Notes from building this page

These notes interpret or extend the paper and are flagged for the authors' review.

- **The first lesson and the 2017 baseline study.** Lesson 1 (February 2017, 18 participants, before the move to freshman- and sophomore-heavy classes) matches the in-class cohort in the authors' [FYEE 2017 paper](/papers/freshman-soft-skills/) (18 students in a junior and senior computing elective, pre- and post-test around one session with a paper-ball game). The page reads them as the same session; the FYEE paper reports the survey results this paper collected but did not report. The FYEE paper describes tossing paper balls into target areas, while this paper's Table 1 has teams blowing them through straws.
- **How many courses.** The abstract says three courses, the introduction "one lesson, in one course, in one CEAS computer science classroom over three semesters," and the discussion "several different CEAS university courses." The move to freshman- and sophomore-heavy classes after Lesson 1 implies more than one course.
- **85 participants.** The total adds the three class counts; the paper does not say whether any student attended more than one lesson. The 23 and 16 percent figures describe the college's engineering population, not the 85 participants. An earlier passage mentions "classes of 40 participants."
- **Who took notes.** The methods name two observers per lesson (the engineering faculty member and graduate student for Lessons 1 and 2; the education faculty member and graduate student for Lesson 3), while the findings analyze "four separate notebooks." The paper does not say whether the teaching member also kept notes or how many notes each notebook held.
- **Frequencies without counts.** The paper ranks the themes but reports no counts. The 18 printed excerpts fall 6, 5, 4, and 3 across the themes, which matches the ranking; the page's chart counts those excerpts only, and the printed selection may have been chosen to mirror the ranking.
- **Reliability.** Consensus coding without a reliability statistic, and the group's acknowledged expectation that students would not know ABET's soft skills, leave the theme assignments open to the bias the authors name. A second coder on a subset, with kappa reported, would strengthen a replication; the page's kappa demo shows the calculation.
- **The game.** The paper's target picture is not part of the text. The page's rings, points, puff reach, and drift are its own, and its simulated scores are not evidence about the lesson.
- **The claim about AR and lesson study.** The distinction rests on the group's reflection over one year and one lesson; the paper presents it as a position for discussion rather than a tested result.
</div>

<div data-levels="hs" markdown="1">
## Try it in class

1. **Play.** In teams of four or five, make 20 paper balls from one sheet, tape a paper target to a table, and play the straw game from Table 1 with a leader, an associate who alone gives instructions, and a fixed order. One student per team does not play and writes down what teammates say.
2. **Sort.** Pool the notes and, as a class, mark each one with a colored dot for interest, discussion, off-topic, or confusion. Agree on every dot, and keep a tally of how often you disagreed at first.
3. **Revise.** Change one rule (10 balls, four puffs each, same target score) and play again. Compare the second round's notes with the first, and write one sentence on what the change did to how your team talked.
</div>

---
title: "Reading a Team by Its Traffic: Three Capstone Teams and How They Talked"
kicker: "Interactive paper · Problems of Education in the 21st Century 2015"
subtitle: "An interactive companion to Mike Borowczak's study of three senior capstone teams, which asked whether the record a cloud collaboration tool already keeps (discussions, responses, and when work arrives) can tell a teacher which team is struggling to communicate."
description: "Guess which of three capstone teams struggled as Table 1's eleven metrics appear one at a time, simulate a team's six months of repository activity as a punch card and a monthly trend, compare the teams side by side, and, at the graduate and researcher levels, recover each team's size from the survey numbers."
share_description: "Three senior capstone teams, one shared code repository each. The team that struggled held 13 discussions in a year, averaging 1.9 responses, while the others held 56 and 112. Can a teacher spot team trouble from the traffic alone? Explore the study at five reading levels."
share_text: "Can a teacher spot a struggling team from its repository traffic alone? Three capstone teams, eleven metrics:"
share_image: /papers/stem-team-communication/share.png
share_image_alt: "Total discussions and total meetings for three capstone teams, Ada, Bohr, and Curie, with Bohr far below the other two, beside the title Reading a Team by Its Traffic."
date: 2026-10-23
topics: ["Education"]
default_level: public
level_hints:
  public: No background needed
  hs: Group projects, counts, and averages
  ug: Team projects, version control, and intro statistics
  grad: Education research methods and measurement
  res: Full design, reconstruction, and open questions
authors:
  - name: Mike Borowczak
    affiliation: Erebus Labs, Laramie, Wyoming
    member: mike-borowczak
sources:
  - venue: "Problems of Education in the 21st Century 65 · 2015 · pp. 18–27"
    title: "Communication in STEM Education: A Non-Intrusive Method for Assessment & K20 Educator Feedback"
    url: http://www.scientiasocialis.lt/pec/node/966
    access: Open access
code: { label: "tc-engine.js (Table 1 arithmetic, team-size search, and the simulated repository)", url: https://github.com/ucf-draco-lab/draco-website/blob/main/papers/stem-team-communication/tc-engine.js }
citations:
  - borowczak2015communication
widget:
  css:
    - /papers/stem-team-communication/widget.css
  js:
    - /papers/stem-team-communication/tc-engine.js
    - /papers/stem-team-communication/widget.js
credit: "Interactive page by the [DRACO Lab](/). Every number about the three teams comes from the paper's Table 1 and methods section. The page reproduces Table 1's totals as sums of its other rows (16 + 96 = 112, 9 + 4 = 13, and 56 + 0 = 56 discussions; 26, 10, and 29 meetings) and the meeting ratios behind the printed \"2.5 to 3 times\" (2.5 to 2.9). The punch-card demo is a simulation, labeled as one: its generator and measures match an independent Python implementation on 636 runs (identical counts; measures within 2 × 10<sup>−15</sup>), and its thresholds are the page's. The team-size search at the graduate and researcher levels matches an independent enumeration for every group of 6 to 30 people. Everything runs on your device."
bibtex: |
  @article{borowczak2015communication,
    author  = {Borowczak, Mike},
    title   = {Communication in {STEM} Education: A Non-Intrusive Method for Assessment \& {K20} Educator Feedback},
    journal = {Problems of Education in the 21st Century},
    volume  = {65},
    pages   = {18--27},
    year    = {2015},
    url     = {http://www.scientiasocialis.lt/pec/node/966}
  }
---

<div class="lede" data-levels="public" markdown="1">
Most engineering degrees end with a capstone: a year-long team project for a real client. Teams that talk well tend to finish well, yet nobody grades how well a team talks. Mike Borowczak followed three senior capstone teams, nicknamed Ada, Bohr, and Curie, and asked a simple question: could the online tool every team already used to share its work show which team was in trouble, without anyone filling out a survey? One team held 13 conversations in the tool and by email all project long; the other two held 56 and 112. This page lets you play detective with the same numbers.
</div>

<div class="lede" data-levels="hs" markdown="1">
Three teams of senior computer science and engineering students kept their code, notes, and questions in GitHub, a website built on the version-control tool git. The tool records every discussion, every reply, and the hour each piece of work arrives. The paper turns that record into seven counts and yes-or-no measures, adds four the researcher observed (meetings and a survey), and compares the three teams. One team, Bohr, scored lowest on 10 of the 11 measures, and its own reports showed why.
</div>

<div class="lede" data-levels="ug" markdown="1">
Capstone courses carry most of an engineering program's assessment of ABET's professional-skill outcomes (communication and teamwork among them), and those outcomes usually come from self-reports. This study proposes a non-intrusive alternative: mine the version-control and project-management tool a team already uses (GitHub, here) for discussion counts, thread lengths, and the timing of committed work, then check those metrics against what the team's weekly reports, meeting records, and surveys say. Across three teams, discussion frequency, responses per discussion, and how work spread over the week and the term separated the two teams that communicated well from the one that did not.
</div>

<div class="lede" data-levels="grad" markdown="1">
A three-case comparative study of senior capstone teams (12 students, three instructors, and two sponsors) at one university. Eleven metrics (seven extracted from the teams' GitHub repositories after the projects ended, four observed by the researcher) are set beside themes coded from weekly reports, meeting minutes, and open-response surveys. The paper reports Table 1 and two families of figures (a day-by-hour punch card and a six-month work series per team) and classifies the figures by eye. No inferential statistics are attempted; with three teams, the evidence is the agreement between the tool's metrics and the qualitative record.
</div>

<div class="lede" data-levels="res" markdown="1">
Borowczak (2015) asks two questions: how the communication of senior capstone teams can be assessed, and how that assessment can inform K-20 educators. The method treats a team's cloud repository as an unobtrusive instrument and triangulates it against meeting counts, survey participation, and coded artifacts. This page reproduces Table 1's internal sums and the reported meeting ratios, shows that only one team split reconciles the survey response rates with the nine follow-up responses (5, 3, and 4 students), separates the tool-based metrics that track the team from those that track tool adoption, and makes explicit, as the page's own, the thresholds a teacher would need to run the paper's "first pass."
</div>

## Which team struggled?

<div id="tc-guess" class="w-demo"></div>

<div data-levels="public" markdown="1">
Make a guess, then reveal one measure at a time. The first measure already points one way: Bohr started only nine email conversations. By the end, Bohr has the lowest score on 10 of the 11. The one exception is worth a second look: Curie held no conversations inside the tool at all, because the team did its talking by email and in extra meetings with its client.
</div>

<div data-levels="hs" markdown="1">
Watch the tally as you reveal. A single measure can mislead (online discussions alone would point at Curie, with zero), but when ten measures agree, the pattern is hard to argue with. The paper's written records agree too: Bohr's weekly status reports thinned out and stopped well before the term ended.
</div>

<div data-levels="ug grad res" markdown="1">
The paper's classification rests on the agreement of all eleven metrics with the coded artifacts rather than on any single row. Two rows behave differently from the rest. Online discussions and use of collaborative features (the wiki and "open issues") measure adoption of the tool's features; Curie scored zero and "No" on them while communicating well through email (56 discussions) and nine sponsor meetings, the most of any team. A screen built only on in-tool activity would have flagged a healthy team.
</div>

## The study

<div data-levels="public hs" markdown="1">
The three teams were senior computer science and engineering students working on year-long projects for outside sponsors, who required them to keep everything in GitHub. The researcher, who had no role at the university, counted meetings by hand, read the teams' weekly reports and meeting notes, and asked each student to fill out a short survey at the start and end. The tool's records were downloaded only after the projects were over, so nobody's behavior changed because someone was watching the numbers.
</div>

<div data-levels="ug grad res" markdown="1">
<div class="tc-table-scroll">
<table class="results-table">
<caption class="w-note">Design of the study, from the paper's methods section.</caption>
<thead><tr><th>Element</th><th>What the paper reports</th></tr></thead>
<tbody>
<tr><td>Setting</td><td>Senior capstone projects in computer science and engineering at one American university; the researcher had no direct affiliation with it</td></tr>
<tr><td>Participants</td><td>12 undergraduates, three instructors, and two project sponsors (17); three were female (one of each role). The abstract gives n = 13.</td></tr>
<tr><td>Teams</td><td>Three, anonymized as Ada, Bohr, and Curie; sizes not printed</td></tr>
<tr><td>Tool</td><td>GitHub (cloud-hosted git), required by the sponsors: code, deliverables, meeting notes, a wiki, and "open issues" for questions</td></tr>
<tr><td>Tool-based metrics (7)</td><td>Email and online discussions and their total, average responses per discussion, even distribution of work by day and hour, work over time, use of collaborative features</td></tr>
<tr><td>Observed metrics (4)</td><td>Sponsor-and-team meetings, team-only meetings, total meetings (recorded by hand), and the share of each team that answered the survey</td></tr>
<tr><td>Qualitative record</td><td>Weekly reports coded for communication themes; a 20-minute open-response survey at the start and end of the project; a follow-up survey (n = 9)</td></tr>
<tr><td>Timing</td><td>Repository data downloaded only after the projects ended; Figure 2 spans six months</td></tr>
<tr><td>Analysis</td><td>Metrics compared across teams; Figures 1 and 2 classified by eye (even or uneven; increasing or decreasing); coded themes compared with the metrics</td></tr>
</tbody>
</table>
</div>
</div>

<div data-levels="grad res" markdown="1">
The design is a multiple-case comparison, and its strength is convergence: tool metrics, hand-counted meetings, survey participation, and artifact themes all point the same direction for each team. The paper says it was advised by Tonia Dousay of the University of Wyoming.
</div>

## From a repository to a punch card

<div id="tc-punch" class="w-demo"></div>

<div data-levels="public" markdown="1">
This team is pretend: the computer makes up six months of work from the habits you set. Each dot is an hour of the week, and bigger dots mean more work arrived then. "Like Ada" spreads its work across weekday hours and grows over the term. "Like Bohr" piles work into late nights before a weekly deadline and fades. The paper's real charts showed the same kind of difference, and a teacher can read it at a glance.
</div>

<div data-levels="hs" markdown="1">
Drag "Work done in steady daytime hours" from 85% down to 10% and watch the punch card collapse into a few big dots on Tuesday and Wednesday nights. Then drag "Work trend" below zero and watch the monthly bars shrink. The three checks at the bottom are the paper's suggested first look for a teacher: are conversations more than a reply or two, is work spread out, and is it growing?
</div>

<div data-levels="ug" markdown="1">
The paper's Figure 1 is a punch card of "work submitted" (each row a day, each column an hour, circle size normalized), and Figure 2 is the same work over six months. Both come straight from the repository's timestamps. The simulation draws each work item's day and hour from a mix of a steady daytime pattern and a deadline-crunch pattern, and each month's volume from a Poisson distribution whose mean rises or falls with the trend slider. Discussion rates and lengths in the three presets come from Table 1; the work habits are the page's.
</div>

<div data-levels="grad res" markdown="1">
The paper classifies its figures by eye and states no criteria, which it lists as future work ("defining the interpretations of the distribution of work and the work over time metrics"). The page makes one choice explicit for each: evenness is the Shannon entropy of the 168 day-and-hour cells divided by ln 168 (even at 0.80 or above), and the trend is the sign of a least-squares slope across the six monthly totals. Over 1,000 simulated teams per preset, the Ada and Bohr presets land on the paper's side of every check every time or nearly so (Bohr trips all three in 994), and Curie's simulated discussions fall short of three responses in about one run in 20, because 3.4 sits close to the page's line.
</div>

## The eleven metrics

<div id="tc-table" class="w-demo"></div>

<div data-levels="public" markdown="1">
Ada talked the most, mostly inside the tool. Curie talked by email and met with its sponsors most often. Bohr held a handful of short conversations and about a third as many meetings. Every member of Curie answered the survey; one in three of Bohr did.
</div>

<div data-levels="hs" markdown="1">
Ada's conversations averaged 4.9 replies; Bohr's averaged 1.9, which means most of Bohr's questions got one answer or none. Ada held 8.6 times as many discussions as Bohr, and Ada and Curie each met about two and a half to three times as often.
</div>

<div data-levels="ug" markdown="1">
The paper links the reply counts to two named skills: effective questioning and active listening (a thread of five exchanges is a conversation; a thread of one or two is a notice). It attributes Bohr's difficulty to time-resource and identity conflicts among its members, two of the three conflict types (resource, objective, and identity) that the [freshman soft-skills study](/papers/freshman-soft-skills/) asks students to name.
</div>

<div data-levels="grad res" markdown="1">
Two of the eleven rows (total discussions and total meetings) are sums of others, so the eleven metrics carry fewer than eleven independent observations. Bohr is lowest on all four observed metrics and on five of the seven tool metrics, alone; the tool-based exceptions are the two rows that measure feature adoption.
</div>

<div data-levels="grad res" markdown="1">
## How big was each team?

<div id="tc-sizes" class="w-demo"></div>

The paper prints response rates (80%, 33%, and 100%) and, separately, nine follow-up survey responses, but no team sizes. Only one split of the 12 students produces whole-number responses at those rates that sum to nine: Ada five, Bohr three, and Curie four. Neither 13 (the abstract's count) nor 17 (everyone, including instructors and sponsors) works. The inference assumes the rates and the follow-up count refer to the same survey and to students only.
</div>

## What the paper found

<div data-levels="public hs" markdown="1">
- Two teams, Ada and Curie, communicated well and stayed in sync; Bohr never settled into a routine.
- Bohr held 13 discussions in the year, against 56 for Curie and 112 for Ada, and its discussions averaged 1.9 replies.
- Ada and Curie met 26 and 29 times; Bohr met 10 times.
- Ada and Curie spread their work across the week and did more of it as the project went on; Bohr's work was bunched up and fell off.
- The records the online tool keeps on its own were enough to spot the team that needed help.
</div>

<div data-levels="ug grad res" markdown="1">
- **Tool metrics separate the teams.** Discussions (112, 13, and 56), responses per discussion (4.9, 1.9, and 3.4), work distribution (even, uneven, even), and work over time (increasing, decreasing, increasing) all single out Bohr.
- **Observed metrics agree.** Total meetings of 26, 10, and 29 (sponsor meetings six, two, and nine); survey participation of 80%, 33%, and 100%.
- **Artifacts explain the numbers.** Ada worked as "expert pairs" that brought issues back to the team; Curie made each member a content lead and wrote a shared follow-up after every meeting; Bohr's status reports thinned and ended early, and advisors' minutes urged regular weekly meetings.
- **Tool adoption is a separate question.** Curie used neither online discussions nor collaborative features and still communicated well, through email and sponsor meetings.
- **A first pass for educators.** Conversation length, team dynamics, and when work is produced can flag communication trouble before it shows in deliverables.
</div>

<div data-levels="grad res" markdown="1">
<div class="tc-table-scroll">
<table class="results-table">
<caption class="w-note">Table 1 as printed. The last row is the page's inference from the response rates and the n = 9 follow-up.</caption>
<thead><tr><th>Metric</th><th>Ada</th><th>Bohr</th><th>Curie</th></tr></thead>
<tbody>
<tr><td>Email discussions</td><td>16</td><td>9</td><td>56</td></tr>
<tr><td>Online discussions</td><td>96</td><td>4</td><td>0</td></tr>
<tr><td>Total discussions</td><td>112</td><td>13</td><td>56</td></tr>
<tr><td>Average discussion length</td><td>4.9</td><td>1.9</td><td>3.4</td></tr>
<tr><td>Even distribution of work</td><td>Yes</td><td>No</td><td>Yes</td></tr>
<tr><td>Work over time</td><td>Increasing</td><td>Decreasing</td><td>Increasing</td></tr>
<tr><td>Use of collaborative features</td><td>Yes</td><td>No</td><td>No</td></tr>
<tr><td>Sponsor + team meetings</td><td>6</td><td>2</td><td>9</td></tr>
<tr><td>Observed team meetings</td><td>20</td><td>8</td><td>20</td></tr>
<tr><td>Total meetings</td><td>26</td><td>10</td><td>29</td></tr>
<tr><td>Responded to survey</td><td>80%</td><td>33%</td><td>100%</td></tr>
<tr><td>Team size (page)</td><td>5</td><td>3</td><td>4</td></tr>
</tbody>
</table>
</div>
</div>

## Why it matters

<div data-levels="public hs" markdown="1">
Teamwork and communication are the skills employers ask for most, and the hardest for teachers to see. This study shows that the tools students already use for group work keep a record a teacher can read in minutes, long before a project falls apart. The same idea works for a middle school group project in a shared document: count the conversations, count the replies, and look at when the work shows up.
</div>

<div data-levels="ug" markdown="1">
Accreditation asks programs to show that students can communicate and work in teams, and most programs answer with surveys and self-ratings. A repository is an instrument that runs in the background, costs nothing, and does not depend on a student's memory or candor. The paper's recommendations for teachers follow from Bohr: build small, benign conflicts into group projects so students practice resolving them early, and have teams explain their work to outside assessors, as practicing engineers do.
</div>

<div data-levels="grad res" markdown="1">
The contribution is a measurement idea: process data from collaboration tools as a non-self-report indicator of team communication, validated case by case against qualitative evidence. Its value grows with what the study lists as next steps (more teams, explicit definitions of the distribution and trend metrics, and deeper coding of artifacts), because those steps turn a by-eye comparison into a screen a teacher can run on a class of 30 teams. The Curie case also sets a design constraint for any such screen: count conversation wherever it happens, not only inside the tool.
</div>

<div data-levels="res" markdown="1">
## Notes from building this page

- **Team sizes.** The paper does not print team sizes, but its response rates (80%, 33%, and 100%) admit whole-number response counts, within 12 students, only for an Ada of five or ten, a Bohr of three, six, or nine, and any Curie. Of the splits of 12 students, (5, 3, 4) gives four, one, and four responses, nine in total, matching the follow-up n = 9; (5, 6, 1) gives seven. No split of 13 or 17 people gives nine. This also suggests the abstract's n = 13 is the slip, and that the 33% is one student of three.
- **Per-student rates.** With those sizes, discussions per student are 22.4 (Ada), 4.3 (Bohr), and 14.0 (Curie), and meetings per student are 5.2, 3.3, and 7.3. Team size explains some of Bohr's low counts but not most of them. These rates are the page's.
- **Redundant rows.** Total discussions and total meetings are exact sums of other rows, and Bohr's lowest rank on a total follows from its ranks on the parts. Counting how many of the eleven metrics flag a team overstates the independent evidence; the page reports the count (10 of 11, nine alone) without a test.
- **Adoption versus communication.** Online discussions and collaborative-feature use rank Curie lowest or tied with Bohr, while every other metric and the artifacts place Curie with Ada. A non-intrusive screen needs to pool channels (email, issues, chat) before counting, or it measures adoption of the tool rather than communication.
- **Classification rules.** Even distribution and work-over-time trend are classified by eye from Figures 1 and 2, whose unit ("work submitted") and normalization are not stated. The page's evenness (normalized entropy, threshold 0.80) and trend (least-squares slope) are one explicit choice; the paper names this as future work.
- **Small details.** The abstract reports n = 13 and the methods 17; the paper says the data came from the 2013–2014 or 2014–2015 academic year, while Figure 2 spans six months; the text spells the third team "Currie" in places; Table 1's asterisk on total discussions has no note; four of the eleven metrics are observed by the researcher, which qualifies the description of the method as free of inference or intrusion.
</div>

<div data-levels="hs" markdown="1">
## Try this in class

1. For your next group project, keep every message about the project in one shared place (a class discussion board, a shared document's comments, or a group chat everyone agrees to use), and keep a list of each time the group meets.
2. At the end of each week, count the conversations started and the replies in each, and mark the day and hour each piece of work was added on a seven-row, 24-column grid like the punch card in **From a repository to a punch card**.
3. Compare your group's numbers with Ada, Bohr, and Curie in **The eleven metrics**, and write two sentences on one habit your group would change.
</div>

---
title: "More Hours, Lower Scores: Two Pilots of a Teacher Cybersecurity Course"
kicker: "Interactive paper · Journal of Systemics, Cybernetics and Informatics 2021"
subtitle: "An interactive companion to Bekir Mugayitoglu, Mike Borowczak, and Andrea C. Borowczak's study of the first two pilots of an online cybersecurity microcredential for 21 K–12 teachers."
description: "Sort school breaches into the CIA triad as teachers did in Module 1, then follow two pilots of an online cybersecurity microcredential: how it ran, who took part, and why teachers who spent more hours scored a little lower."
share_description: "Twenty-one K–12 teachers took an online cybersecurity course in 2020. Teachers who spent more hours scored slightly lower. Try the course's first idea, then see who took part and how prior knowledge can explain that pattern. Written for five reading levels."
share_text: "Twenty-one teachers, two pilots, and a correlation that runs backward. Try the course's first module and see why:"
share_image: /papers/cyber-microcredential-framework/share.png
share_image_alt: "A scatter of simulated teachers in two groups, where computer science teachers score higher in fewer hours, beside the title More Hours, Lower Scores."
date: 2026-10-22
topics: ["Education"]
default_level: public
level_hints:
  public: No background needed
  hs: Percentages and a little graphing
  ug: Intro statistics and research methods
  grad: Correlation tests and education research methods
  res: Full design, reported values, and open questions
authors:
  - name: Bekir Mugayitoglu
    affiliation: University of Wyoming
  - name: Mike Borowczak
    affiliation: University of Wyoming
    member: mike-borowczak
  - name: Andrea C. Borowczak
    affiliation: University of Wyoming
    member: andrea-borowczak
sources:
  - venue: "Journal of Systemics, Cybernetics and Informatics 19(2):13–22 · 2021"
    title: "A University's Developmental Framework: Creating, Implementing, and Evaluating a K-12 Teacher Cybersecurity Micro-credential Course"
    url: https://www.iiisci.org/Journal/PDV/sci/pdfs/EB219EV21.pdf
    access: Open access
code: { label: "cf-engine.js (share checks, correlation tests, and the simulated class)", url: https://github.com/ucf-draco-lab/draco-website/blob/main/papers/cyber-microcredential-framework/cf-engine.js }
citations:
  - mugayitoglu2021university
  - iceti-2021-eval
widget:
  css:
    - /papers/cyber-microcredential-framework/widget.css
  js:
    - /papers/cyber-microcredential-framework/cf-engine.js
    - /papers/cyber-microcredential-framework/widget.js
credit: "Interactive page by the [DRACO Lab](/). Every number about the course and its teachers comes from the paper's text; the page rebuilds the combined demographic shares (71%, 14%, 10%, and 5% of 21 teachers) exactly from the two pilots, and finds one Pilot 2 share printed one point low. The CIA triad scenarios and the class of 21 teachers in the time-and-scores demo are the page's own and labeled as such. The correlation test matches SciPy on 500 random cases (largest relative difference 1.2 × 10⁻¹²). Everything runs on your device."
bibtex: |
  @article{mugayitoglu2021university,
    author  = {Mugayitoglu, Bekir and Borowczak, Mike and Borowczak, Andrea C.},
    title   = {A University's Developmental Framework: Creating, Implementing, and Evaluating a {K-12} Teacher Cybersecurity Micro-credential Course},
    journal = {Journal of Systemics, Cybernetics and Informatics},
    volume  = {19},
    number  = {2},
    pages   = {13--22},
    year    = {2021},
    url     = {https://www.iiisci.org/Journal/PDV/sci/pdfs/EB219EV21.pdf}
  }
---

<div class="lede" data-levels="public" markdown="1">
Most K–12 teachers say they know a little about cybersecurity, and few say they know a lot. In 2020, a team at the University of Wyoming built a short online course, called a microcredential, to help teachers of any subject bring cybersecurity into class. Twenty-one teachers took it in two rounds. This page lets you try the course's first big idea, then follows how the two rounds ran, who took part, and a surprising result: teachers who spent more hours in the course scored a little lower.
</div>

<div class="lede" data-levels="hs" markdown="1">
A microcredential is a small online course that certifies one skill. Bekir Mugayitoglu, Mike Borowczak, and Andrea C. Borowczak ran a cybersecurity microcredential for K–12 teachers twice in 2020: Pilot 1 in July (five teachers, two modules) and Pilot 2 from November to December (16 teachers, five modules). They collected quiz and assessment scores, lesson plan scores, hours logged in the course website, interviews, focus groups, and progress reports. Below, you can sort cybersecurity breaches the way teachers did in Module 1, then explore the pilots, the teachers, and how time in the course related to scores.
</div>

<div class="lede" data-levels="ug" markdown="1">
The microcredential ran in the Canvas learning management system (LMS) and drew its content from the GenCyber cybersecurity first principles, grouped into three units (fundamentals, philosophies, and segmentations). Pilot 1 (four weeks) offered Module 0, an introduction to cybersecurity, and Module 1, the confidentiality, integrity, and availability (CIA) triad; Pilot 2 (six weeks) added abstraction, modularity, and least privilege. The paper asks four questions: how the module resources helped teachers build cybersecurity knowledge, whether assessment scores and lesson plan scores correlate with hours in the modules, and what teachers saw as the benefits and challenges.
</div>

<div class="lede" data-levels="grad" markdown="1">
A two-pilot, mixed-methods study of a self-paced cybersecurity microcredential for in-service K–12 teachers (N = 21: five Pilot 1 completers of nine enrolled, and 16 in Pilot 2; 11 computer science and 10 other teachers). Quantitative data are formative quiz, final assessment, and lesson plan scores and LMS hours, analyzed with Pearson correlations; qualitative data are 13 semi-structured interviews, two focus groups, and four biweekly progress reports, coded into themes. The authors frame the design with Loucks-Horsley's principles of effective professional development.
</div>

<div class="lede" data-levels="res" markdown="1">
Mugayitoglu, Borowczak, and Burrows (2021) report the first two pilots of a Wyoming Department of Education and National Science Foundation–funded cybersecurity microcredential; the later [Education Sciences paper and its page](/papers/cyber-microcredentials/) add a third pilot and a self-efficacy survey. RQ1 and RQ4 are qualitative; RQ2 and RQ3 test the correlation of assessment and lesson plan scores with LMS hours and report r = −0.14 and r = −0.23, each with p < 0.05. The paper prints shares, counts, and two coefficients, and its tables and scatter plots carry no further values in text. This page checks every printed share against the whole counts that could produce it, and at the graduate and researcher levels tests the printed coefficients at the study's sample size, labeled as its own.
</div>

## Module 1: confidentiality, integrity, and availability

<div id="cf-cia" class="w-demo"></div>

<div data-levels="public" markdown="1">
Every teacher began with two modules: an introduction to cybersecurity and the CIA triad. The triad names three things worth protecting: information stays private (**c**onfidentiality), stays correct (**i**ntegrity), and stays reachable by the people who need it (**a**vailability). Read each school scenario and pick the part it breaks. When you finish, try a retake. The course let teachers retake its quizzes too, and that choice shaped what the scores could show.
</div>

<div data-levels="hs" markdown="1">
Each module ended with a short quiz that teachers could retake as often as they liked; only the final assessment counted. The triad gives teachers one simple frame for many kinds of problems: a leaked class list, a changed grade, and a crashed website are three different failures. Several scenarios touch more than one part (ransomware often copies files before locking them), and deciding which part matters most is a good classroom discussion.
</div>

<div data-levels="ug" markdown="1">
The CIA triad is the first organizing model in most security courses, and the paper's Table 1 aligns it with Wyoming's computer science standards at four grade bands (K–2, 3–5, 6–8, and 9–12). Module 1's resources were websites, journal articles, and short videos, with interactive flashcards added in Pilot 2. The demo's nine scenarios are the page's own; the paper does not print its quiz items.
</div>

<div data-levels="grad res" markdown="1">
The tool is the context and the study is the subject. The demo matters for one methodological reason: formative quizzes could be retaken without limit, and the authors conclude that most teachers already knew the CIA triad, retook quizzes, and that the assessments were therefore not an accurate measure of learning. The retake log above (first score, best score, attempts) separates the two quantities a retake-friendly quiz confounds: what a teacher knew on arrival and how long they persisted.
</div>

## Two pilots, step by step

<div id="cf-pilots" class="w-demo"></div>

<div data-levels="public" markdown="1">
The first round ran four weeks in July 2020 with two modules. Nine teachers signed up and five finished every part. The second round ran six weeks in late 2020 with five modules and 16 teachers. Both rounds opened and closed with an online meeting and offered weekly online office hours. Instead of one fixed final test, teachers picked how to show what they learned, from a menu laid out like a bingo card: a teaching video, a presentation, or a brochure, for example.
</div>

<div data-levels="hs" markdown="1">
Each pilot is a test run. The team watched what happened, listened to teachers, and changed the course before the next round. Along the way they collected several kinds of evidence: scores, hours logged in the course website, two progress reports per pilot, one focus group per pilot, and 13 interviews in all. Pick a pilot to see what it offered.
</div>

<div data-levels="ug" markdown="1">
The design pairs self-paced LMS modules with light synchronous support: an opening meeting, weekly office hours, email, and a closing meeting. Measurement runs on two tracks. Scores (formative quizzes, the bingo-format final assessment, and lesson plans) and LMS hours answer RQ2 and RQ3; progress reports, focus groups, and interviews answer RQ1 and RQ4. The paper does not print a scoring rubric or point scale for either score.
</div>

<div data-levels="grad res" markdown="1">
Pilot 2 differs from Pilot 1 in length, number of modules, resources (flashcards), season, and cohort at once, so the paper treats each pilot as a design iteration rather than a comparison. Loucks-Horsley's principles appear as design commitments (reflection on practice, learning communities, and teacher leadership), and the closing conclusions report evidence for the last two: teachers shared resources with colleagues and formed networks.
</div>

## Who took part

<div id="cf-people" class="w-demo"></div>

<div data-levels="public" markdown="1">
Twenty-one teachers finished the study: five in the first round and 16 in the second. About half taught computer science, and two of every three were women. Pick a characteristic to light up the teachers in each group, and pick a round to see it on its own.
</div>

<div data-levels="hs" markdown="1">
The paper reports most of these numbers as percentages. Percentages of small groups hide whole people: in a group of five, each teacher is 20%. The dots turn each printed percentage back into a count of teachers. The second round had more teachers from subjects other than computer science (nine of 16) than the first (one of five).
</div>

<div data-levels="ug" markdown="1">
The table under the dots checks each printed share against the count that produces it. Pilot 1's shares (n = 5) and the gender shares print exactly. For race and ethnicity, the combined row (n = 21) pins down Pilot 2's counts: only one split of 16 teachers, 12, two, and two, makes every combined share print as the paper does. That split gives 75% White in Pilot 2, one point above the printed 74%.
</div>

<div data-levels="grad res" markdown="1">
The reconstruction enumerates all 153 ways to divide Pilot 2's 16 teachers among its three printed groups, adds Pilot 1's counts implied by its own shares, and keeps the splits whose combined shares round to 71%, 14%, 10%, and 5% of 21. Exactly one survives. Pilot 2's printed row (74%, 13%, 13%) sums to 100%, while 12, two, and two of 16 round to 75%, 13%, and 13%, which sums to 101%; a one-point adjustment to keep the row at 100% fits the printed value. The reconstruction also confirms that the abstract's 21 teachers are Pilot 1's five completers plus Pilot 2's 16, not all 25 who enrolled.
</div>

## More hours, lower scores

<div id="cf-hours" class="w-demo"></div>

<div data-levels="public" markdown="1">
The team compared each teacher's scores with the hours the course website logged for them. Teachers who spent more time scored a little lower. The authors explain why: computer science teachers already knew much of the material, so they finished faster and scored higher, while teachers new to the subject worked longer and still scored lower. The dots above are a pretend class of 21, made up by this page to show how that explanation works. Press **No head start** and the backward pattern mostly fades; what remains is chance, which changes with each **New class**.
</div>

<div data-levels="hs" markdown="1">
A correlation, written r, runs from −1 to 1 and measures how closely two things rise or fall together. The paper reports r = −0.14 for assessment scores and r = −0.23 for lesson plan scores, both weak and negative. The pretend class shows the authors' explanation: when one group starts ahead and also needs less time, the whole class can show a negative trend even if extra time helps nobody. Press **New class** a few times. With only 21 teachers, r jumps around a lot from class to class.
</div>

<div data-levels="ug" markdown="1">
The simulated class draws 11 computer science and 10 other teachers (the study's split) with group-specific means and no relationship between hours and score inside either group (Points per hour = 0). The pooled correlation still comes out negative, an instance of confounding by group: prior knowledge drives both variables. Set Points per hour above zero and the within-group trends turn positive while the pooled trend can stay negative. The simulation illustrates the paper's explanation; it does not reproduce the paper's data, which appear only as scatter plots.
</div>

<div data-levels="grad res" markdown="1">
The paper reports r = −0.14 and r = −0.23 with p < 0.05 and does not state n. Tested at the study's 21 teachers with the usual t statistic (df = 19), these coefficients give two-sided p = 0.545 and p = 0.316, and the 2,000-class simulation above lands near the same values. At n = 21, p < 0.05 needs |r| ≥ 0.433; r = −0.14 reaches p < 0.05 at n ≥ 197 and r = −0.23 at n ≥ 74. The figures may pool different units than teachers (for example, one point per teacher per module), so the page's calculation shows what the coefficients would support at n = 21 rather than a recomputation of the authors' test. These checks are the page's own and are not in the paper.
</div>

## What the paper found

<div data-levels="public" markdown="1">
- A short online course helped teachers both inside and outside computer science build some cybersecurity knowledge.
- Computer science teachers learned faster and scored higher; teachers new to the subject spent more time and still found the material harder.
- Teachers valued short videos, well-organized materials, and the choice of how to show what they learned.
- Some elementary teachers felt ideas such as abstraction were too advanced for young students and asked for simpler examples.
- Teachers shared the materials with colleagues and formed networks with one another.
</div>

<div data-levels="hs" markdown="1">
- Assessment scores and hours had a weak negative correlation (r = −0.14), and so did lesson plan scores and hours (r = −0.23).
- Most teachers already knew the CIA triad and retook quizzes, so the authors judged the quiz scores a poor measure of learning.
- Computer science teachers found the flashcards and short videos most useful; other teachers progressed more slowly even with weekly online help.
- One teacher said the material could fill "a day or two" of class; another said it could give a school without computer science at least one trained teacher.
- The team planned a longer version, with more modules and more teachers, for summer 2021.
</div>

<div data-levels="ug grad res" markdown="1">
- **RQ1, resources.** The focus groups agreed that resources were well organized. Computer science teachers in Pilot 1 valued short, practical videos and articles that mixed technical and nontechnical content; in Pilot 2 they used flashcards to build CIA triad knowledge and planned to use them with students. Teachers outside computer science found the flashcards and articles less helpful and progressed more slowly despite email and weekly video-call support.
- **RQ2 and RQ3, time and scores.** Pearson's r = −0.14 for assessment scores against LMS hours and r = −0.23 for lesson plan scores, each described as a weak negative correlation and printed with p < 0.05.
- **RQ4, benefits and challenges.** Benefits: the content fit a day or two of instruction, and one trained teacher could serve a school without computer science. Challenges: abstraction and least privilege felt too advanced for K–6 students, and teachers asked for simplified elementary examples.
- **Design lessons.** Bingo-format assessment let teachers demonstrate learning in different ways; short videos carried lower cognitive load; and teacher leadership and peer networks emerged.
- **Limitation and next step.** The authors name the small sample and short pilots as the main limitations and planned a longer, larger replication for summer 2021.
</div>

<div data-levels="grad res" markdown="1">
<div class="cf-study-wrap">
<table class="results-table">
<caption class="w-note">Reported values, with the counts and tests the page derives from them.</caption>
<thead><tr><th>Quantity</th><th>Pilot 1</th><th>Pilot 2</th><th>Combined</th><th>Page check</th></tr></thead>
<tbody>
<tr><td>Teachers</td><td>9 enrolled, 5 completed</td><td>16</td><td>21</td><td>5 + 16 = 21</td></tr>
<tr><td>Computer science / other</td><td>4 / 1</td><td>7 / 9</td><td>11 / 10 (derived)</td><td>Counts printed</td></tr>
<tr><td>Female / male</td><td>60% / 40% (3 / 2)</td><td>69% / 31% (11 / 5)</td><td>67% / 33%</td><td>14 / 7 of 21, exact</td></tr>
<tr><td>White</td><td>60%</td><td>74%</td><td>71%</td><td>3, 12, 15; Pilot 2 prints 75%</td></tr>
<tr><td>Native American</td><td>20%</td><td>13%</td><td>14%</td><td>1, 2, 3, exact</td></tr>
<tr><td>Asian/Pacific Islander</td><td>none</td><td>13%</td><td>10%</td><td>0, 2, 2, exact</td></tr>
<tr><td>Scotch-Irish</td><td>20%</td><td>none</td><td>5%</td><td>1, 0, 1, exact</td></tr>
<tr><td>Interviews / focus groups / progress reports</td><td>5 / 1 / 2</td><td>8 / 1 / 2</td><td>13 / 2 / 4</td><td>Counts printed</td></tr>
<tr><td>Assessment score vs. hours</td><td colspan="2">pooled across pilots</td><td>r = −0.14, p &lt; 0.05</td><td>p = 0.545 at n = 21</td></tr>
<tr><td>Lesson plan score vs. hours</td><td colspan="2">pooled across pilots</td><td>r = −0.23, p &lt; 0.05</td><td>p = 0.316 at n = 21</td></tr>
</tbody>
</table>
</div>
</div>

## Why it matters

<div data-levels="public hs" markdown="1">
Cybersecurity now belongs in classrooms of every subject, and most teachers start as beginners. This study shows that a short, flexible online course can reach teachers wherever they are, and that the same course lands differently for a computer science teacher and a science or literacy teacher. Ultimately, the finding that more hours did not mean higher scores points to a design question: how to give newcomers a faster start, not only more time.
</div>

<div data-levels="ug" markdown="1">
Professional development for teachers is often costly, slow, and one-size-fits-all. A microcredential trades a fixed workshop for portable, self-paced modules, and this paper documents what that trade looked like in its first two iterations: what teachers used, where newcomers stalled, and how assessment choice and short media helped. The negative time-score correlation is a reminder that time on task, by itself, is a weak measure of learning when participants arrive with different backgrounds.
</div>

<div data-levels="grad res" markdown="1">
The study's strongest contribution is design evidence from a hard-to-reach population: in-service teachers, many outside computing, learning cybersecurity online in a rural state. Its quantitative results are descriptive at this sample size, and their most useful reading is the authors' own: prior knowledge separates teachers on both speed and score, so later iterations should differentiate by background. That is the direction the [third pilot](/papers/cyber-microcredentials/) took, with module choice and grade-band examples.
</div>

<div data-levels="res" markdown="1">
## Notes from building this page

- **Sample size behind the correlations.** The paper does not state n for r = −0.14 and r = −0.23. At n = 21 teachers, both are far from p < 0.05 (two-sided p = 0.545 and 0.316); reaching p < 0.05 would take n ≥ 197 and n ≥ 74. Pooling per-module observations, or a one-sided or different test, could change this, and the scatter plots (Figures 3 and 4) would settle it.
- **"Weak" and "strong."** The Results call both coefficients weak negative correlations; the Conclusions describe "a strong negative correlation" between assessment scores and time in Modules 0 and 1.
- **Figure 4's paragraph.** The text under the lesson plan figure refers to "assessment scores"; the caption and research question refer to lesson plan scores.
- **Twenty-one or 25.** Section 5 lists nine Pilot 1 and 16 Pilot 2 teachers (25); the abstract and the combined demographics use 21, which matches five Pilot 1 completers plus 16.
- **Pilot 2 White share.** Every printed share reconstructs to a whole count except Pilot 2's White share: 12 of 16 is 75%, printed as 74%, most likely adjusted so the row sums to 100%.
- **Principles counted.** The paper describes 11 GenCyber principles in one place and "twelve" in another, and introduces seven Loucks-Horsley principles while listing five.
- **Pilot 2 completion.** Pilot 1 reports nine enrolled and five completing; Pilot 2 reports 16 recruited who completed within six weeks, without a separate completion count.
- **Scores.** No rubric, point scale, or score range is printed for the assessment or lesson plan scores, so the simulated class uses an arbitrary 0 to 100 scale and labels it simulated.
- **The page's statistics.** The p-values, critical values, and the 2,000-class null simulation are computed by this page and appear only at the graduate and researcher levels.
- **Byline.** The published record lists Andrea C. Borowczak as Andrea C. Burrows; this page uses the name she prefers. The page lists the journal paper's three authors; the site's earlier record for this paper also named four co-authors of the conference presentation.
</div>

<div data-levels="hs" markdown="1">
## Try this in class

1. Write three short news-style headlines about a school, one that breaks confidentiality, one integrity, and one availability. Trade with a partner and sort each other's headlines.
2. Survey your class: how many minutes did each person spend on last night's homework, and what score did they get? Plot minutes against score and describe the trend.
3. Split the plot by one thing students knew beforehand (for example, whether they took the course before). Describe whether the trend inside each group matches the trend for the whole class, and write two sentences on why the two might differ.
</div>

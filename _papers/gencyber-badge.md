---
title: "A Badge for Camp: Research Before Sophomore Year"
kicker: "Interactive paper · ASEE Annual Conference 2019"
subtitle: "An interactive companion to Garrett Burrows and Mike Borowczak's study of a spring-and-summer research program in which two first-year mechanical engineering students designed and produced a programmable badge for a GenCyber camp, cut its cost per unit by 40 percent, and asked whether work like this keeps students in engineering."
description: "Wear a model of the camp badge (a five-by-five LED face that scrolls a name, keeps score, and resists guessed codes), walk the project's ten requirements and four checkpoints, rerun the cost drop from $17.50 to $10.50, and read every answer the two researchers and their peers gave, with interval estimates at the graduate and researcher levels."
share_description: "Two first-year engineers, one faculty contact, and a deadline: design a wearable, programmable badge for a GenCyber cybersecurity camp. They delivered 25 units by mid-May and 200 more by July, cut the cost per unit 40 percent, and said the work kept them in engineering. Explore the study at five reading levels."
share_text: "Two first-year engineering students built a camp badge, cut its cost 40 percent, and stayed in engineering:"
share_image: /papers/gencyber-badge/share.png
share_image_alt: "A five-by-five LED badge face showing the letter G above two bars, a first-design cost of $17.50 per unit and a final cost of $10.50, labeled 40 percent less, next to the title A Badge for Camp."
date: 2026-10-22
topics: ["Education"]
default_level: public
level_hints:
  public: No background needed
  hs: Bits, a little algebra, and some coding
  ug: Engineering design and intro programming
  grad: Education research methods and statistics
  res: Full design, the paper's tables, and open questions
authors:
  - name: Garrett Burrows
    affiliation: University of Wyoming
  - name: Mike Borowczak
    affiliation: University of Wyoming
    member: mike-borowczak
sources:
  - venue: "ASEE Annual Conference & Exposition · Tampa, FL · 2019"
    title: "Novel STEM Research Programs Could Minimize Attrition in Undergraduate Engineering"
    url: https://doi.org/10.18260/1-2--33136
    access: Free to read
code: { label: "gb-engine.js (badge model, cost arithmetic, and intervals)", url: https://github.com/ucf-draco-lab/draco-website/blob/main/papers/gencyber-badge/gb-engine.js }
citations:
  - asee_peer_27304
widget:
  css:
    - /papers/gencyber-badge/widget.css
  js:
    - /papers/gencyber-badge/gb-engine.js
    - /papers/gencyber-badge/widget.js
credit: "Interactive page by the [DRACO Lab](/). Every number about the program comes from the paper's text and its two tables; the page reproduces the printed 40 percent drop from $17.50 to $10.50 per unit and the Results text's four, one, and two peer counts, and it draws Tables 1 and 2 answer by answer. The badge is the page's model: the paper lists the requirements for its scoring system but not the students' code, so the rule, lockout, and LED font are the page's own and are labeled on the demo. The page's Wilson and exact binomial intervals match SciPy on all 90 cases of up to 12 respondents (largest difference 2 × 10<sup>−16</sup>), and its expected guessing time matches a 200,000-run simulation. Everything runs on your device."
bibtex: |
  @inproceedings{burrows2019novel,
    author    = {Burrows, Garrett and Borowczak, Mike},
    title     = {Novel {STEM} Research Programs Could Minimize Attrition in Undergraduate Engineering},
    booktitle = {2019 ASEE Annual Conference \& Exposition},
    address   = {Tampa, Florida},
    year      = {2019},
    month     = {June},
    publisher = {ASEE Conferences},
    doi       = {10.18260/1-2--33136},
    url       = {https://peer.asee.org/33136}
  }
---

<div class="lede" data-levels="public" markdown="1">
Many students who start an engineering degree leave before their second year, and a common reason is feeling unprepared. Garrett Burrows and Mike Borowczak report a small test of one remedy: hand first-year students a real project with a real deadline. Two mechanical engineering students at the University of Wyoming spent a spring and summer designing a wearable, programmable badge for a GenCyber cybersecurity camp. They delivered 25 badges by mid-May and 200 more by July, made each one 40 percent cheaper, and said the work pushed them to stay in engineering. This page lets you wear a model of the badge and explore every result the paper reports.
</div>

<div class="lede" data-levels="hs" markdown="1">
GenCyber camps, sponsored by the National Security Agency (NSA), introduce students to cybersecurity. Campers at a University of Wyoming GenCyber camp wore a badge built around a Microbit, a small programmable board with a five-by-five grid of lights and two buttons. Two first-year engineering students designed that badge: the 3D-printed case, the nametag, and a JavaScript scoring system shown on the lights. This paper describes how the project ran, what it cost, and what the two students and five of their peers said about it.
</div>

<div class="lede" data-levels="ug" markdown="1">
A case study of a university-sponsored research program, new in 2018, that placed two first-year mechanical engineering students on a design-and-production project in the spring and summer before their sophomore year. The deliverable was a wearable badge housing a Microbit and Motobit for an NSA-sponsored GenCyber camp, against ten requirements that ranged from a 3D-printed housing to a ranking system "secure enough" to resist a quick compromise. Outcomes are the delivered units (25, then 200), a 40 percent drop in cost per unit ($17.50 to $10.50), about 50 hours of JavaScript and cybersecurity coding, and the answers of the two researchers and a peer group to three yes-or-no questions.
</div>

<div class="lede" data-levels="grad" markdown="1">
A two-participant case study with a peer poll, reported descriptively: two first-year students selected for first-semester success from a small applicant pool completed a funded design project, then answered three questions on enjoyment, comparison with an internship, and influence on persistence (Table 1); a peer group of former and current engineering students answered the same questions about the program as described to them (Table 2, five respondents; the text says seven). The page draws both tables, reproduces the paper's cost figure, and, at this level, shows how little five or seven answers can say about a wider population.
</div>

<div class="lede" data-levels="res" markdown="1">
Burrows and Borowczak (2019) argue that an internship-like research experience in the first year can reduce the unpreparedness that drives early engineering attrition. The evidence is two self-reports and a public question session; the paper acknowledges that it cannot generalize. The page reproduces the reported 40 percent cost drop, reconciles the peer counts where the text and Table 2 differ (seven polled versus five rows), draws exact and Wilson intervals around every printed share, and lists the internal inconsistencies for the authors' review. The badge demo implements the paper's requirements 8 to 10 under a rule of the page's own design.
</div>

## Wear the badge

<div id="gb-badge" class="w-demo"></div>

<div data-levels="public" markdown="1">
The real badge sat on a camper's shirt all week. Its lights scrolled the wearer's name, so it doubled as a nametag, and they also showed a score that grew as the camper solved cybersecurity challenges. Press **A** on the badge to switch between name, score, and level. Then press **Solve a challenge** and **Enter code** to earn points, or press **Try a random code** and watch how often a guess gets through.
</div>

<div data-levels="hs" markdown="1">
Each light is one bit: on or off. A letter is a five-by-five picture of bits, and scrolling moves the picture one column to the left about nine times a second. The scoring rule hides a pattern in the four digits of every real code. Try a few real codes from **Solve a challenge** and write them down: what do the first three digits have to do with the last one? A guesser gets through about one time in ten, so three misses lock the badge for ten seconds to slow guessing down.
</div>

<div data-levels="ug grad res" markdown="1">
Requirements 8 to 10 asked for a ranking and leveling system that keeps score through the camps, shows the rank on the LEDs, and is "secure enough" to resist a quick compromise yet "simple enough for patterns to be found eventually." The paper states those requirements but does not describe the students' JavaScript, so this badge implements them under the page's own rule: a four-digit check-digit code (the last digit is the sum of the first three, modulo 10), one point per unused valid code, a level every three points, and a 10-second lock after three consecutive misses. A random guesser passes one try in ten; at five seconds per try, the page's engine puts the expected time to a forged point at 76.9 seconds (about 2.7 lockouts), and a 200,000-run simulation agrees. A camper who notices the pattern needs no guessing at all, which is the design intent the requirement describes.
</div>

## Ten requirements, three checkpoints

<div id="gb-plan" class="w-demo"></div>

<div data-levels="public hs" markdown="1">
In early February, a faculty contact handed the two students a Microbit, a larger Motobit board, and a list of ten requirements. They sketched designs on paper, threw several away, modeled the best one on a computer, and 3D-printed it. Three more versions later, by mid-April, they had a badge that met every requirement. Then came production: 25 working badges for the first camp in mid-May and 200 for the camps in June and July.
</div>

<div data-levels="ug grad res" markdown="1">
The design process followed a standard engineering loop: paper sketches and discarded concepts, a SolidWorks model, a first printed prototype, and three further iterations to a design that met all ten requirements by the mid-April checkpoint. The students managed their own design, resources, and production schedule, and they researched coding and security alongside the mechanical work. The paper reports the counts at each camp checkpoint as "working units" without defining the term; the page reads them as badges delivered and labels them as printed.
</div>

<div data-levels="grad res" markdown="1">
<div class="gb-table-scroll">
<table class="results-table">
<caption class="w-note">Design of the study, from the paper's introduction, methods, results, and limitations.</caption>
<thead><tr><th>Element</th><th>What the paper reports</th></tr></thead>
<tbody>
<tr><td>Program</td><td>A university-sponsored research program at the University of Wyoming, new in 2018, in the spring and summer before the sophomore year</td></tr>
<tr><td>Participants</td><td>Two first-year mechanical engineering students, chosen from a "very small" applicant pool on first-semester success</td></tr>
<tr><td>Project</td><td>A wearable Microbit and Motobit badge for an NSA-sponsored GenCyber camp, against ten requirements; 3D-printed housing modeled in SolidWorks; JavaScript scoring</td></tr>
<tr><td>Checkpoints</td><td>Kickoff in early February; prototype in mid-April; 25 working units for the first camp in mid-May; 200 for the camps in June and July</td></tr>
<tr><td>Measures</td><td>Cost per unit across iterations; hours of coding experience; three yes-or-no questions to the two participants (Table 1) and to a peer group in a public question session (Table 2)</td></tr>
<tr><td>Comparison</td><td>None formal; participants' observations of classmates who did not take part</td></tr>
<tr><td>Stated limits</td><td>Two participants and five peers; a layout that serves only a few students; designed for mechanical engineering</td></tr>
</tbody>
</table>
</div>
</div>

## Cutting the cost per badge

<div id="gb-cost" class="w-demo"></div>

<div data-levels="public hs" markdown="1">
Across their design versions, the students brought the price of each badge down from $17.50 to $10.50 without making it weaker. That is a 40 percent drop: $7 saved on every $17.50. Move the slider to see what that means for a run of badges. For the 225 badges counted at the camp checkpoints, the page's multiplication gives $3,937.50 at the first price and $2,362.50 at the final one.
</div>

<div data-levels="ug grad res" markdown="1">
The paper reports the per-unit price before and after redesign, (10.50 − 17.50) / 17.50 = −40 percent, "with no loss in structural integrity." The abstract calls the same figure a drop in "overall cost." The paper gives no breakdown by component, no print times, and no count of units made at each price, so the totals under the slider assume a single price for a whole run; they are the page's arithmetic on the paper's two prices.
</div>

## What the researchers and their peers said

<div id="gb-answers" class="w-demo"></div>

<div data-levels="public hs" markdown="1">
Both students said the work was enjoyable and that it made them more likely to stay in engineering. Both said they used what they learned the next semester: coding to sort data and make graphs, computer modeling for class problems, and a project mindset for planning. Peers who heard about the program agreed it sounded enjoyable, and most said it would have helped them stay. One student who had already left engineering said it would have made math and science fundamentals stick.
</div>

<div data-levels="ug" markdown="1">
Table 1 records the two researchers' answers; Table 2 records the peer group's answers about the program as described to them. The peer group mixed former and current engineering students in a public setting, so the peer answers measure how attractive the program sounds rather than its effect. Use **Peers (Results text)** to see the counts the text reports for the internship question, which differ from Table 2.
</div>

<div data-levels="grad res" markdown="1">
The intervals put the small samples in proportion. Every share the paper reports is consistent with a broad range of population values: four of five peers saying the program would help them continue gives a 95 percent Wilson interval of 37.6 to 96.4 percent (exact: 28.4 to 99.5 percent), and the text's four of seven for "as good as or better than an internship" gives 25.0 to 84.2 percent. These intervals are the page's addition, computed to show how far five or seven answers reach; the paper itself makes no inferential claim and presents the answers as a first indication.
</div>

## What the paper found

<div data-levels="public hs" markdown="1">
- Two first-year students designed and produced a working camp badge on schedule: 25 for the first camp and 200 for the camps that followed.
- Their redesigns cut the cost of each badge by 40 percent, from $17.50 to $10.50.
- They gained about 50 hours of coding experience in JavaScript and cybersecurity.
- Both said the experience was enjoyable and made them more likely to stay in engineering.
- Peers agreed the program sounded enjoyable, and most said it would have helped them stay.
</div>

<div data-levels="ug grad res" markdown="1">
- **On-time delivery against ten requirements.** A prototype meeting all ten requirements by mid-April after three iterations beyond the first print; 25 working units for the mid-May camp and 200 for the June and July camps.
- **Cost.** Per-unit price down 40 percent, $17.50 to $10.50, with no loss in structural integrity.
- **Skills.** About 50 hours of JavaScript and cybersecurity coding; both participants reported using coding, CAD, and project planning in the following semester and feeling more prepared than classmates who did not take part.
- **Participants (Table 1).** Enjoyable: two of two. Influenced the decision to continue: two of two. Better than an internship: one of two (the other Unknown).
- **Peers (Table 2 and text).** Enjoyable: five of five. Would help continue: four of five. Internship comparison: three better, one worse, one Unknown in Table 2; four as good or better, one worse, two Unknown of seven in the text.
- **Next steps named by the authors.** Scale the program to more students without losing its defining features, and adapt it to other engineering disciplines.
</div>

<div data-levels="grad res" markdown="1">
<div class="gb-table-scroll">
<table class="results-table">
<caption class="w-note">Every share the paper reports, with 95 percent intervals. The last two columns are the page's.</caption>
<thead><tr><th>Group and question</th><th>Paper</th><th>Wilson</th><th>Exact (Clopper–Pearson)</th></tr></thead>
<tbody>
<tr><td>Researchers: enjoyable; helped continue (Table 1)</td><td>2 of 2</td><td>34.2 to 100%</td><td>15.8 to 100%</td></tr>
<tr><td>Peers: enjoyable (Table 2)</td><td>5 of 5</td><td>56.6 to 100%</td><td>47.8 to 100%</td></tr>
<tr><td>Peers: would help continue (Table 2)</td><td>4 of 5</td><td>37.6 to 96.4%</td><td>28.4 to 99.5%</td></tr>
<tr><td>Peers: better than an internship (Table 2)</td><td>3 of 5</td><td>23.1 to 88.2%</td><td>14.7 to 94.7%</td></tr>
<tr><td>Peers: as good as or better than an internship (text)</td><td>4 of 7</td><td>25.0 to 84.2%</td><td>18.4 to 90.1%</td></tr>
<tr><td>Cost per unit, first to final design</td><td>$17.50 to $10.50, 40%</td><td colspan="2">−40.0% (page)</td></tr>
</tbody>
</table>
</div>
</div>

## Why it matters

<div data-levels="public hs" markdown="1">
Students often leave engineering in their first year because they cannot yet see themselves doing the work. A project like this one lets them do the work early: a real customer, real deadlines, real money, and a camp full of students wearing the result. Ultimately, the badge served two groups at once, the campers learning cybersecurity and the two engineers learning that they belonged.
</div>

<div data-levels="ug" markdown="1">
The paper frames the program as a way to offer an internship-like experience during the first year, before the point where many students leave, and the program built it around a deliverable another program needed (here, the GenCyber camp's badges), so the work had stakes beyond a grade. The lab's [Integrated Outreach](/papers/integrated-outreach/) page covers the University of Wyoming's 2018 and 2019 cybersecurity camps, which also used badges to track campers' levels.
</div>

<div data-levels="grad res" markdown="1">
The contribution is a design for a first-year research experience with a concrete deliverable, plus early self-reported evidence that students find it worthwhile; the authors present it as one possible piece of a response to attrition, not a solution. The design separates cleanly into transferable parts (an external client, a requirements list, fixed checkpoints, and a production run), and the authors name scaling as the open problem: the current layout serves only a few students.
</div>

<div data-levels="res" markdown="1">
## Notes from building this page

- **Peer counts.** The Results text says "four out of the seven students polled" rated the program as meaningful as an internship or more, with one disagreeing and two answering unknown. Table 2 shows five peers (three better, one worse, one Unknown), and the Limitations section says five people took part in the public question session. The page shows both versions; reconciling them needs the authors' records.
- **No "same" answers.** The question offers better (+), worse (−), or the same (=), and Table 2 contains no "=". The text's "as meaningful or more" therefore matches only the three "+" answers in Table 2, not four.
- **Table 1 layout.** The printed table runs both participants' answers together in one row ("Yes/Yes", "+/Unknown", "Yes/Yes"); the page reads each slash-separated value as one participant. One participant's Unknown on the internship comparison is not discussed in the text.
- **Selection.** The two participants were chosen from a "very small" applicant pool on first-semester success, so they may already have been less likely than their classmates to leave. Their answers describe the experience, not its effect on persistence.
- **Peer framing.** The peer questions ask whether the program "sounds" enjoyable and "would" influence a decision, answered in a public session that included former students. These are hypothetical judgments of a described program, with possible social desirability in a public setting.
- **Cost wording.** The abstract describes a 40 percent decline in "overall cost," the Results a decline in "price per unit." Both match $17.50 to $10.50; whether the 25 mid-May units were made at the higher price is not stated.
- **Timeline.** The Methods describe the camps as "five to six months" away at the February kickoff; mid-May is about three months later, and July about five. "Working units" is not defined.
- **"Significantly more prepared."** The participants' sense of being more prepared than classmates rests on their own observations, with no comparison data; the paper reports it as such, and the page avoids the word "significantly."
- **Reference [5].** The Results describe it as a Stanford newspaper article; the reference list gives University Wire. The scoring rule, lockout, and font in the badge demo are the page's and should not be read as the students' design.
</div>

<div data-levels="hs" markdown="1">
## Try this in class

1. Draw a five-by-five grid on paper for each student and have them design the letters of their initials, one square per light. Compare designs: which letters need all five columns, and which fit in three?
2. Invent a scoring code for a class challenge: four digits where the last digit checks the first three. Trade codes with a partner and see who can spot the other's rule first, then compare with the badge demo above.
3. Price a classroom set: if one badge costs $17.50 and a redesign brings it to $10.50, what do 30 badges cost each way, and what percent did the redesign save? Check your answer with the cost demo.
</div>

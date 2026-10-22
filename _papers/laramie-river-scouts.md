---
title: "Was the River Fixed? Girl Scouts Test a Laramie River Restoration"
kicker: "Interactive paper · Education Sciences 2018"
subtitle: "An interactive companion to Andrea C. Borowczak, Meghan Lockwood, Mike Borowczak, Edward Janak, and Brian Barber's action research study of 10 Girl Scouts who asked whether a restored stretch of the Laramie River was healthier than a channelized one, and answered it with all eight science and engineering practices."
description: "Run a simulated field day at a restored and a channelized reach of the Laramie River on the scouts' five factors, follow the study from the troop to a capitol rotunda, open each of the eight practices the paper found in the scouts' work, and read what scouts, parents, and leaders said."
share_description: "Ten Girl Scouts in Laramie, Wyoming asked one question: did the river restoration work? Run their field day yourself, see how one question carried all eight science and engineering practices, and read what the community noticed. Written for five reading levels."
share_text: "Ten Girl Scouts asked whether a river restoration worked, and answered it like engineers. Try their field day:"
share_image: /papers/laramie-river-scouts/share.png
share_image_alt: "Five rows, one per factor the scouts measured (macro-invertebrate diversity, riparian height, canopy cover, benthic particle size, and velocity), each with simulated control and restored samples as dots. Beside them, the title Was the River Fixed?"
date: 2026-10-22
topics: ["Education"]
default_level: public
level_hints:
  public: No background needed
  hs: Averages, graphs, and a little ecology
  ug: Intro research methods and statistics
  grad: Study design and basic inference
  res: Full design, the page's analyses, and open questions
authors:
  - name: Andrea C. Borowczak
    affiliation: University of Wyoming
    member: andrea-borowczak
  - name: Meghan Lockwood
    affiliation: Wyoming Game and Fish Department
  - name: Mike Borowczak
    affiliation: University of Wyoming
    member: mike-borowczak
  - name: Edward Janak
    affiliation: University of Toledo
  - name: Brian Barber
sources:
  - venue: "Education Sciences 8(1):4 · 2018"
    title: "Integrated STEM: Focus on Informal Education and Community Collaboration through Engineering"
    url: https://doi.org/10.3390/educsci8010004
    access: Open access
citations:
  - integratedstem
widget:
  css:
    - /papers/laramie-river-scouts/widget.css
  js:
    - /papers/laramie-river-scouts/lr-engine.js
    - /papers/laramie-river-scouts/widget.js
credit: "Interactive page by the [DRACO Lab](/). The study design, the eight practices, the question criteria, and the categories in Tables 1 and 2 come from the paper; the table entries are the page's paraphrases of the printed quotations. The paper reports the direction of each river difference and prints no measurements, so every field value on this page is simulated, from reach settings the page chose to point the way the paper reports. The page's Welch t-test, Shannon index, and incomplete beta function match SciPy on 1,300 cases. Everything runs on your device."
bibtex: |
  @article{burrows2018integrated,
    author  = {Borowczak, Andrea C. and Lockwood, Meghan and Borowczak, Mike and Janak, Edward and Barber, Brian},
    title   = {Integrated {STEM}: Focus on Informal Education and Community Collaboration through Engineering},
    journal = {Education Sciences},
    volume  = {8},
    number  = {1},
    pages   = {4},
    year    = {2018},
    doi     = {10.3390/educsci8010004}
  }
---

<div class="lede" data-levels="public" markdown="1">
In the 1940s, the Laramie River in Laramie, Wyoming was straightened into a channel, and its water ran faster. Between 2009 and 2012, part of it was restored to look and behave more like a natural river. In the 2015 to 2016 school year, a group of Girl Scouts aged 9 to 15 set out to answer one question: did the restoration work? They waded into a restored stretch and an unrestored one, collected the insects living on the riverbed, measured the plants, the rocks, and the current, and presented their answer to the public. The researchers who led them wanted to know something else: how much real science and engineering a group like this does when the problem is open and the river is down the street. This page lets you run the scouts' field day, follow the project, and see what the paper found.
</div>

<div class="lede" data-levels="hs" markdown="1">
Andrea C. Borowczak, Meghan Lockwood, Mike Borowczak, Edward Janak, and Brian Barber studied a Girl Scout water-quality project in Laramie, Wyoming. Ten scouts compared a restored reach (stretch) of the Laramie River with a control reach on five factors: how many kinds of small river animals lived there, how tall the streamside plants grew, how much the trees shaded the water, how big the streambed rocks were, and how fast the water moved. The paper's main result is about the scouts: their project used every one of the eight science and engineering practices that today's science standards ask students to learn. Below, you can collect your own (simulated) samples, step through the study, and open each practice.
</div>

<div class="lede" data-levels="ug" markdown="1">
The paper argues that integrated STEM (science, technology, engineering, and mathematics taught as one field) happens naturally in authentic, community-based problems, and that informal settings can supply the time and resources schools often lack. Its evidence is an action research project with 10 Girl Scouts (ages 9 to 15, fall 2015 to spring 2016) who tested whether the Laramie River restoration succeeded. Data came from field notes on 10 meetings, four focus groups built on the three dimensions of the Next Generation Science Standards (NGSS), a leader's reflective journal, and the scouts' poster. The analysis is qualitative: the authors map the scouts' work onto the eight National Research Council (NRC) practices and sort quotations into scientific engagement, knowledge, and interest.
</div>

<div class="lede" data-levels="grad" markdown="1">
A single-case action research study in an informal setting: 14 Girl Scouts participated, 10 with consent and assent are reported, and the project ran across 10 meetings in fall 2015 and spring 2016. The scouts designed a control-versus-restored comparison on five stream factors; the paper reports the direction of each difference and no measurements. Field notes were color-coded thematically, focus groups followed the NGSS dimensions, and quotations appear in two illustrative tables. The page simulates the field comparison (labeled throughout) and, at the graduate and researcher levels, uses it to show what a two-reach design can and cannot support.
</div>

<div class="lede" data-levels="res" markdown="1">
Borowczak, Lockwood, Borowczak, Janak, and Barber (Education Sciences 2018) pair a history of STEM and of action research with a case: a Girl Scout troop's investigation of the Laramie River restoration, presented as evidence that informal, community-engaged engineering projects elicit all eight NRC science and engineering practices without direct instruction on the product. The empirical claims rest on field notes, four focus groups, a reflective journal, and a poster from 10 participants. The page rebuilds the study's structure and tables, simulates the stream comparison under settings it chooses, adds a pseudo-replication analysis of its own, and closes with notes from building the page, including two internal inconsistencies.
</div>

## Did the restoration work?

<div id="lr-field" class="w-demo"></div>

<div data-levels="public" markdown="1">
Each row is one thing the scouts measured. Each open circle is a sample from the old, straightened channel, and each filled dot is a sample from the restored stretch. Press **Collect new samples** a few times. With three samples per site, each row usually points the way the paper reports (more kinds of animals, taller plants, more shade, smaller rocks, and faster water at the restored stretch), and all five rows agree only about half the time. The first field day shows four of five: one row points the other way. Small samples wobble. That wobble is why the scouts argued with each other about whether the restoration succeeded, and why arguing from evidence counts as one of the eight practices. The tray at the bottom shows the scouts' sorting step: every animal from one net, grouped by family. Watch the mayflies, which the scouts chose as their pollution signal.
</div>

<div data-levels="hs" markdown="1">
Try **2** samples per site, then **8**. With two samples, all five rows match the paper on only about two field days in five; with eight, on more than four in five. One odd sample can flip an average, and more samples settle it. Notice the tray, too. The control sample often holds more animals in total, mostly midges and worms, while the restored sample holds them spread across more families. A scout made the same kind of observation (fewer animals in faster water), and the paper still reports higher diversity at the restored site. Both can be true at once: **diversity** counts how many kinds of animals live somewhere and how evenly they share the space, not how many animals there are.
</div>

<div data-levels="ug" markdown="1">
The simulation draws each family's count from a negative binomial (clumped) distribution and each physical factor from a normal distribution, with means the page chose so the expected differences match the paper's directions. Shannon's H′ rewards both richness and evenness, which is why a sample dominated by midges scores low even when it holds the most animals. The scouts' version of this step was manual: a dichotomous key, ice cube trays, field guides, and counting by hand. The paper says a t-test was explained to them; at the graduate and researcher levels the table adds one.
</div>

<div data-levels="grad res" markdown="1">
Switch **Restoration** to **Did nothing** and press **Repeat 500 field days**. With no reach-to-reach spread, each factor's false-alarm rate sits near 5%, and at least one of the five factors crosses p < 0.05 on roughly one day in five (the multiple-comparisons cost of testing five outcomes). Now set the spread to **25%**: the two reaches differ for ordinary reasons (one sits below a bridge, one has a spring), and the false-alarm rate climbs, faster with more samples. With 25% spread and three samples per reach, about half of all field days flag at least one factor even though the restoration did nothing, the same share as when it worked. One restored reach against one control reach makes the reach, not the restoration, the unit of replication; samples within a reach are subsamples. The scouts' question was well posed, and this design can describe the two reaches; attributing the difference to the restoration needs replicate reaches or before-and-after data. This analysis is the page's own, and the reach settings are invented.
</div>

## Ten scouts, ten meetings

<div id="lr-design" class="w-demo"></div>

<div data-levels="public" markdown="1">
Step through the project from the river's history to the day a few scouts presented their research in a state capitol. Fourteen girls took part; the paper reports on the 10 whose families agreed to be in the study. Nobody handed the scouts a worksheet. They picked their question, their tools, and their sampling spots, and the researchers watched, listened, and took notes.
</div>

<div data-levels="hs" markdown="1">
The researchers collected four kinds of evidence: notes from every meeting, four group discussions, one leader's journal, and the poster the scouts made. Using several sources is called **triangulation**: if field notes, the discussions, and the poster all show the same skill, the claim is stronger than any one source could make it.
</div>

<div data-levels="ug" markdown="1">
Action research is cyclical and participatory: the people being studied help shape the work, and they may agree or disagree with the researchers' interpretations, as these scouts could. The paper notes that the project had no set action research rules and that data collection sometimes overshadowed the participatory process, and that scheduled meetings sometimes forced exchanges. The focus groups asked six questions keyed to the NGSS dimensions, such as "How did we analyze data?"
</div>

<div data-levels="grad res" markdown="1">
The design has no comparison group and reports no measures of the scouts' learning beyond the researchers' coding of observed practice. The paper states that the meetings ran in fall 2015 and spring 2016 and does not give the split, the length of each meeting, or the dates of the field sampling and the symposium. Four of the 14 participants are excluded for consent; the paper reports nothing about how they differed.
</div>

## Eight practices, one river

<div id="lr-practices" class="w-demo"></div>

<div data-levels="public" markdown="1">
Open each row to see what the scouts did. The eight practices come from the national framework behind today's science standards, and the paper's main finding is that the scouts' one question led them through all eight. The first row lets you test questions the way the group did: a good research question has to be answerable, testable, compact, and measurable. "How clean is the water?" sounds like the obvious question and failed one of those tests.
</div>

<div data-levels="hs" markdown="1">
Engineering practices show up in places you might not expect. Weighing dried plants and remembering to subtract the weight of the tin counts as mathematics. A scout who forgot the tin, saw a number that was too big, and worked out why was doing exactly what engineers do when a measurement looks wrong.
</div>

<div data-levels="ug" markdown="1">
The paper presents the eight practices as engineering skills that integrate the other STEM disciplines: science supplies the question and the organisms, technology the tools, and mathematics the counting, weighing, graphing, and statistics. The authors report that the scouts produced the full set "without direct instruction" on what their poster should contain, which is the core of their argument that authentic, informal projects elicit integrated STEM.
</div>

<div data-levels="grad res" markdown="1">
The mapping from observed activity to practice is the authors' coding; the paper does not report how many instances supported each practice, who coded them, or how disagreements were resolved. The practices are therefore best read as present or absent in the project as a whole rather than as rates.
</div>

## What scouts, parents, and leaders said

<div id="lr-voices" class="w-demo"></div>

<div data-levels="public" markdown="1">
The paper's two tables sort what people said into three kinds of evidence: **engagement** (taking part in doing science), **knowledge** (what people learned), and **interest** (wanting more). Table 1 comes from the project itself and Table 2 from parents and visitors at public events. Use the category switch to read one kind at a time. One parent admitted that a daughter now knows more than the parent does; another family went looking for insects in their own backyard.
</div>

<div data-levels="hs" markdown="1">
Table 1 holds nine quotations, three per category; Table 2 holds eight, because one cell is empty in the paper. The wording here is the page's short paraphrase. The paper prints what each person said.
</div>

<div data-levels="ug grad res" markdown="1">
The tables are illustrative: the authors selected quotations that fit each category, so their counts describe the tables and not the frequency of engagement, knowledge, or interest in the data. Their value is in showing reach beyond the participants, since parents, community members, and leaders report learning or interest of their own.
</div>

## What the paper found

<div data-levels="public" markdown="1">
- Ten Girl Scouts turned one open question about their local river into a full investigation, from picking a question to presenting a poster in public.
- Their work used every one of the eight science and engineering practices.
- Their own data pointed to a healthier restored stretch: more kinds of animals, taller plants, more shade, and faster, more varied water.
- Parents and visitors noticed, and some families caught the interest too.
- The authors argue that clubs, camps, and community projects can give students time for real science that a school day often cannot.
</div>

<div data-levels="hs" markdown="1">
- Participants: 14 girls took part; 10 (ages 9 to 15) are reported.
- Evidence: notes from 10 meetings, four group discussions, a leader's journal, and a five-panel poster.
- River results (directions only): diversity, riparian height, and canopy cover rose at the restored site; water there was shallower, faster, and more varied; larger rocks sat at the control site.
- All eight science and engineering practices appeared in the scouts' work.
- The scouts presented at a public symposium, and a select group presented in a capitol rotunda in Montana.
</div>

<div data-levels="ug grad res" markdown="1">
- **Integrated STEM through engineering.** The scouts' project carried all eight NRC practices, with science, technology, and mathematics embedded in each.
- **No direct instruction on the product.** The authors report that the full set of practices emerged without being taught as poster content.
- **River outcomes, as the scouts found them.** Higher macro-invertebrate diversity, riparian height, and canopy cover at the restored site; shallower water with higher and more varied velocities; larger particles at the control site. The paper concludes the restoration improved the site.
- **Community reach.** Table 1 (nine quotations) and Table 2 (eight) show engagement, knowledge, and interest among scouts, parents, and leaders.
- **Social justice, briefly.** Democratic participation appeared at every meeting; transportation, information, and uniforms were the main access barriers, and the authors note the topic received less attention than the STEM content.
- **Question for schools.** The authors ask whether skills learned informally are valued in K–12 settings, suggest they often are not, and call for collaboration among K–12 educators, informal educators, and community members.
</div>

<div data-levels="grad res" markdown="1">
<div class="lr-study-wrap">
<table class="results-table">
<caption class="w-note">The five factors as the paper reports them (directions only; no measurements are printed).</caption>
<thead><tr><th>Factor</th><th>What the paper describes</th><th>Reported difference</th></tr></thead>
<tbody>
<tr><td>Macro-invertebrate diversity</td><td>Samples sorted by family (dichotomous key, ice cube trays, field guides), then counted</td><td>Higher at the restored site</td></tr>
<tr><td>Riparian height</td><td>Streamside vegetation and tree height, graphed</td><td>Higher at the restored site</td></tr>
<tr><td>Canopy cover</td><td>Vegetation cover over the water</td><td>Higher at the restored site</td></tr>
<tr><td>Benthic particle size</td><td>Streambed particles, observed</td><td>Larger at the control site</td></tr>
<tr><td>River velocity</td><td>Current speed, graphed</td><td>Higher and more varied at the restored site, in shallower water</td></tr>
</tbody>
</table>
</div>
</div>

## Why it matters

<div data-levels="public hs" markdown="1">
Science classes often run out of time before students get to ask their own question and chase it to an answer. This project shows what happens when a group gets that time: a troop of girls, a river in their own town, and a question that mattered to their neighbors. Ultimately, the scouts did more than learn about rivers. They practiced the whole job of a scientist and an engineer, and they taught their families along the way.
</div>

<div data-levels="ug" markdown="1">
Engineering enters the NGSS as practices, and practices are hard to teach in 50-minute periods. Informal programs (clubs, camps, scouting, and citizen science) can supply the time, the site, and the community audience that make an investigation authentic. The paper's practical point for K–12 is collaboration: the skills these scouts built transfer only if classroom teachers know about them and value them.
</div>

<div data-levels="grad res" markdown="1">
The paper offers an existence proof and a framework rather than an effect estimate: one troop, one river, and a qualitative mapping onto the NRC practices. Its contribution is the case itself (a well-posed community question that drew out every practice) and the argument that informal and formal educators should build on each other's work. A stronger test would compare practice elicitation across informal and classroom versions of the same investigation.
</div>

<div data-levels="res" markdown="1">
## Notes from building this page

- **No measurements printed.** The paper reports the direction of each river difference and no values. The poster (Figure 2) shows the scouts' graphs, but the page could not read the figure images, so every field value on the page is simulated from settings the page chose. If the scouts' data survive, the simulation could be replaced with them.
- **Did the scouts run the t-test?** Section 3.4 says the scouts did not run computer-programmed statistical tests and were shown how the programs worked; Section 3.5 says they explained statistical programs, such as the t-test, before producing graphs. The two readings are compatible only if "explained" means the scouts described a test someone else ran.
- **Two reaches, one comparison.** With one restored and one control reach, any test on samples within the reaches compares the reaches. The paper's conclusion that the restoration improved water quality at the site attributes the difference to the restoration; the design supports describing the difference. The page's repeated-field-day analysis shows the size of that gap under invented reach-to-reach spread.
- **Abundance and diversity.** Table 1 quotes a scout observing fewer macro-invertebrates in faster water, while the restored site had faster water and higher diversity. The two observations are consistent (fewer animals, more evenly spread across families); the page's simulation is set up that way, and the paper does not report totals.
- **Water quality, measured.** The conclusion speaks of improved water quality, while the measured factors describe habitat (biota, vegetation, substrate, and flow). Dissolved oxygen and turbidity were discussed and not measured.
- **Who is reported.** Fourteen girls took part and 10 are reported; nothing is said about the other four. The paper does not give the fall and spring split of the 10 meetings or the dates of sampling and the symposium.
- **Tables as paraphrases.** The page paraphrases the quotations in Tables 1 and 2 and keeps the paper's categories and layout, including Table 2's empty engagement cell. The wording should be checked against the version of record.
- **Bibliography.** The site's `pubs.bib` entry listed "Megan Lockwood" and a dead short link; the paper prints Meghan Lockwood, and the entry now carries the DOI. Brian Barber's affiliation was not legible in the page's copy of the article and is left blank.
- **Byline.** The published record lists Andrea C. Borowczak as Andrea C. Burrows; this page uses the name she prefers.
- **The page's statistics.** Welch t-tests, SD ratios, Shannon indices, and the repeated-field-day false-alarm rates are computed by this page on simulated data and are not in the paper.
</div>

<div data-levels="hs" markdown="1">
## Try this in class

1. Pick two spots near school that differ in one way you can name (a mowed field and an unmowed edge, a shaded and a sunny patch of ground). As a class, write questions about them and keep only the ones that are answerable, testable, compact, and measurable.
2. Collect three samples at each spot (for example, count the kinds of insects under a set area of leaf litter, or measure plant height), sort them in an egg carton or ice cube tray, and record the counts.
3. Graph both spots, decide whether the difference is real or could be chance, and present your answer to another class, defending it with your data.
</div>

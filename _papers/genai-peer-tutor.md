---
title: "A Tutor That Will Not Give the Answer: Prompting AI to Coach Source Evaluation"
kicker: "Interactive paper · The Pedagogical Promptbook 2026"
subtitle: "An interactive companion to Rae Mair, Michelle Kelley, Taylar Wenzel, Andrea C. Borowczak, Yuqing Li, and Mike Borowczak's chapter on a prompt that turns a chatbot into a Socratic peer tutor, revised across five drafts and tested in three phases, from library student workers to two teacher-education courses to five chatbot platforms."
description: "Step through a five-draft prompt that keeps an AI chatbot from answering for the student, follow its three evaluation phases, compare survey ratings from 9, 40, and 5 responses, and read the rubric behind every Draft 5 score."
share_description: "Can a chatbot coach a student through judging a source without judging it for them? A UCF team revised one prompt five times and tested it with 54 survey responses across three phases. Sort the tutor's moves, read the rubric, and check the numbers at five reading levels."
share_text: "A chatbot tutor that asks instead of answers, five drafts in the making. Explore the study:"
share_image: /papers/genai-peer-tutor/share.png
share_image_alt: "Survey shares across three phases for overall quality rated very good or excellent: 78 percent of 9 responses, 55 percent of 40, and 100 percent of 5, next to the title A Tutor That Will Not Give the Answer."
date: 2026-10-21
topics: ["Education", "AI & machine learning"]
default_level: public
level_hints:
  public: No background needed
  hs: Percentages and fractions
  ug: Course design and survey basics
  grad: Survey methods and small-sample statistics
  res: Full design, reproduction, and open questions
authors:
  - name: Rae Mair
    affiliation: University of Central Florida
  - name: Michelle Kelley
    affiliation: University of Central Florida
  - name: Taylar Wenzel
    affiliation: University of Central Florida
  - name: Andrea C. Borowczak
    affiliation: University of Central Florida
    member: andrea-borowczak
  - name: Yuqing Li
    affiliation: University of Central Florida
  - name: Mike Borowczak
    affiliation: University of Central Florida
    member: mike-borowczak
sources:
  - venue: "The Pedagogical Promptbook (D. Wiley, ed.) · EdTech Books · 2026"
    title: "Generative AI Peer Tutoring to Support Peer-Reviewed Source Identification and Evaluation"
    url: https://doi.org/10.59668/2340.26762
    access: Open access (CC BY 4.0)
citations:
  - mair2026peertutor
widget:
  css:
    - /papers/genai-peer-tutor/widget.css
  js:
    - /papers/genai-peer-tutor/pt-engine.js
    - /papers/genai-peer-tutor/widget.js
credit: "Interactive page by the [DRACO Lab](/). Every percentage, rubric score, and mean comes from the chapter's Tables 1 to 3, its Results text, and its appendices; the prompt steps and rubric lines are condensed from Appendices A, B, and D. The page recovers the whole-number count behind each printed survey percentage (each has exactly one), reproduces the Phase 2 overall-quality share of 55 percent from the two course counts (12 of 15 and 10 of 25), and reproduces Table 1's platform totals and the text's Draft 5 means. At the graduate and researcher levels its Wilson intervals and Fisher's exact test match SciPy and statsmodels to six decimals; recovered counts, intervals, and the test are the page's own. Everything runs on your device."
bibtex: |
  @incollection{mair2026peertutor,
    author    = {Mair, Rae and Kelley, Michelle and Wenzel, Taylar and Borowczak, Andrea C. and Li, Yuqing and Borowczak, Mike},
    title     = {Generative {AI} Peer Tutoring to Support Peer-Reviewed Source Identification and Evaluation},
    booktitle = {The Pedagogical Promptbook: Enacting Evidence-Based Teaching and Instructional Design Practices with Generative {AI}},
    editor    = {Wiley, David},
    publisher = {EdTech Books},
    year      = {2026},
    doi       = {10.59668/2340.26762},
    url       = {https://stars.library.ucf.edu/ucfscholar/1346}
  }
---

<div class="lede" data-levels="public" markdown="1">
In the authors' first tests, chatbots asked to coach a student through judging an article simply answered the questions themselves. That shortcut skips the part a student needs to learn. A team at the University of Central Florida (UCF) wrote instructions, called a prompt, that turn a chatbot into a peer tutor: it asks one question at a time, explains why each question matters, and leaves every decision to the student. They revised the prompt five times and tested it with library student workers, two college classes, and five chatbots. This page walks through the tutor's script and what the testers reported.
</div>

<div class="lede" data-levels="hs" markdown="1">
Research papers ask for "peer-reviewed sources," articles that other experts checked before publication. Telling one apart from a blog post is a skill, and a chatbot that announces the answer takes away the practice. Six UCF authors wrote and revised a prompt that makes the chatbot coach instead. Testers rated it on a survey in three rounds (9, 40, and 5 responses), and the authors scored chat transcripts on a six-part rubric from 1 to 5. Every percentage below comes from a fraction you can check.
</div>

<div class="lede" data-levels="ug" markdown="1">
Mair, Kelley, Wenzel, Borowczak, Li, and Borowczak report the design of a prompt that turns a large language model (LLM) into a Socratic peer tutor for identifying and evaluating peer-reviewed sources. Five criteria drove the design: cognitive congruence (talking like a peer), scaffolded sequential dialogue, adaptability, metacognitive transparency (explaining its reasoning), and following the assignment's directions. Draft 4 went to student workers and two teacher-education courses; Draft 5, rebuilt with XML structure and a stated reason for every rule, went to a technical review on five platforms.
</div>

<div class="lede" data-levels="grad" markdown="1">
A design-based case study in three phases: Phase 1 tested Draft 4 with nine respondents from UCF Libraries and the DRACO Lab on six platforms; Phase 2 used Draft 4 in two teacher-education courses (40 survey responses, 15 and 25 by course); Phase 3 had one DRACO Lab undergraduate run Draft 5 on five platforms (five surveys, five rubric-scored transcripts). Outcomes are shares of favorable answers on five-point items and rubric means on six 1-to-5 criteria. The page recovers each share's count and, at this level, adds interval estimates that make the small denominators visible.
</div>

<div class="lede" data-levels="res" markdown="1">
Mair et al. (2026) contribute a reusable prompt, a six-criterion rubric, and a survey instrument for LLM tutors in information literacy, and they document what changed between drafts: moving from enumerated questions to a described role, then to XML-structured sections with an explicit pedagogical rationale for each directive. The quantitative evidence is descriptive and spans three phases that change prompt, setting, respondents, and platforms at once. This page reproduces the printed arithmetic, finds the one subset of platforms behind Table 1's Average row, and lists the comparisons the design can and cannot support.
</div>

## The tutor's script

<div id="pt-prompt" class="w-demo"></div>

<div data-levels="public" markdown="1">
Press **Next step** to walk the six steps of the final prompt. Notice what the tutor never does: it never says whether an article is peer-reviewed, never suggests a better article, and never writes the assignment. Then try the sorting game at the bottom. Each move either follows the prompt or breaks one of its rules, and the answer explains which.
</div>

<div data-levels="hs" markdown="1">
The tutor works like a good lab partner. In Step 3 it asks about one clue at a time (the journal's name, the authors' universities and degrees, the reference list) and lets you decide what each clue means. Switch between **Draft 4** and **Draft 5** to see the biggest change: Draft 5 explains *why* each rule exists, for example that students "might not know what they don't know." The authors found that the reasons changed the chatbots' behavior more than repeating the rules did.
</div>

<div data-levels="ug" markdown="1">
Drafts 1 to 3 listed questions for the model to ask, and the models answered those questions themselves, so no dialogue formed. Draft 4 described a role and a "what you never do" list; Claude followed it, while ChatGPT still offered answers and sources, CoPilot merged steps, and Gemini lectured. Draft 5 separates role, context, and instructions with XML tags and attaches a rationale to each directive. It also adds a writing-support behavior: help with precise wording that never changes the student's conclusion.
</div>

<div data-levels="grad res" markdown="1">
The Draft 4 to Draft 5 change has three parts that the evaluation cannot separate: structure (XML sections), rationale (the "why" behind each directive), and a new writing-support behavior. The authors credit the rationale as most influential, on the basis of transcript review during prompt engineering. The sorting game is this page's addition; its eight moves are written for the page, and each verdict cites the rule in Appendix A or B that decides it.
</div>

## Three phases of testing

<div id="pt-phases" class="w-demo"></div>

<div data-levels="public hs" markdown="1">
The team tested in rounds. First, nine student testers from the UCF Libraries and the DRACO Lab tried Draft 4 on six chatbots. Next, students in two classes for future teachers used Draft 4 on real assignments: an article review in an introductory course and short literature reviews in a reading-education practicum. Finally, after the rewrite to Draft 5, one student researcher ran the same assignment on five chatbots and filled out the survey for each. Grok and Perplexity were dropped after the first round because they behaved too differently from the others.
</div>

<div data-levels="ug" markdown="1">
Each phase answers a different question. Phase 1 developed the survey and found platform-specific failures. Phase 2 tested Draft 4 in authentic, uncontrolled classroom use, where students picked their own platform (mostly ChatGPT and CoPilot) and the two courses used different survey forms (Qualtrics and an abbreviated Google Form). Phase 3 held the assignment and the student's replies constant to compare platforms on Draft 5. The authors report that whole-course surveys helped least during early drafts and that transcript-level rubric review guided the revisions.
</div>

<div data-levels="grad res" markdown="1">
The phases are sequential and confounded by design: prompt draft, respondent pool, setting, and platform mix change together, and Phase 3's five responses are five platform runs by one technically experienced evaluator. The authors name this in their limitations (single institution, mainly teacher-education students, convenience samples, a single expert evaluator who may inflate scores, and no measure of learning gains). The phase comparison below is therefore descriptive. Phase 1's count of nine also needs a note: the text describes six student workers, three from each unit, and "three more" DRACO Lab students, while Table 2 lists nine responses.
</div>

## What the testers reported

<div id="pt-survey" class="w-demo"></div>

<div data-levels="public" markdown="1">
Pick a measure and compare the three bars. In the classroom round, 70 percent of 40 students said the tutor gave just the right amount of information, and 55 percent rated its overall quality very good or excellent. After the rewrite, the final tester rated all five chatbots favorably on every measure. The course split at the bottom shows a gap worth noticing: 12 of 15 students in the practicum rated the tutor highly, against 10 of 25 in the introductory course.
</div>

<div data-levels="hs" markdown="1">
Each bar shows a fraction. 55.6 percent of nine is five people (5 ÷ 9 = 0.556), and the other four said "a little too much." Check the course split yourself: 12 of 15 is 80 percent, 10 of 25 is 40 percent, and together they make 22 of 40, which is the 55 percent printed for the whole classroom round. The Phase 3 bars reach 100 percent, but they rest on five chatbot runs by one tester.
</div>

<div data-levels="ug" markdown="1">
Natural language rose the most across phases, from 22.2 percent (2 of 9) to 40 percent (16 of 40) and then 100 percent (5 of 5), matching the transcripts' complaint that Draft 4 sounded formal and formulaic. Overall quality fell from Phase 1 (78 percent) to Phase 2 (55 percent) on the same Draft 4, and the authors' lessons name three classroom factors that a tester round lacks: students mostly chose the platforms that handled Draft 4 worst, assignment wording varied in clarity, and students who used AI mainly to generate answers were frustrated by a tutor that withheld them. Information calibration improved from 55.6 to 70 percent, with Phase 2's critiques split evenly between too little and too much.
</div>

<div data-levels="grad res" markdown="1">
Every printed share maps to exactly one whole-number count at its phase's N, which the bars show. The Wilson intervals (this page's) make the denominators visible: Phase 1's 55.6 percent spans 26.7 to 81.1 percent, and Phase 3's 100 percent of five has a lower bound of 56.6 percent. "Positive" means very good or excellent; the per-course "above average" ratings use the same cut, since 12 + 10 = 22 of 40 reproduces the 55 percent Phase 2 figure. The Fisher test on the course split is the page's own and, like every phase comparison here, cannot separate the course from its assignment, survey form, and students.
</div>

## Scoring the final prompt

<div id="pt-rubric" class="w-demo"></div>

<div data-levels="public" markdown="1">
Each square is one chatbot's score on one rubric line, from 1 to 5; press any square to read what that score means. Claude and DeepSeek scored highest (29 of 30), and Gemini lowest (26), mostly because it kept answering for the student: in the transcript it completed parts of the source check and made the keep-or-discard decision itself. The bars below show how far the rewrite moved the scores on three lines, including "avoiding giving answers," from 3.08 to 4.2.
</div>

<div data-levels="hs" markdown="1">
A rubric turns a judgment into a number by describing each level in words. Press Gemini's 3 under **No answers** and compare it with Claude's 5: "sometimes gives answers" against "never gives answers." Add a row to check a total (Gemini: 5 + 4 + 3 + 4 + 5 + 5 = 26). The class-average bars for Draft 4 come from students' real chats; the Draft 5 bars come from one tester, so the rise mixes a better prompt with a more careful user.
</div>

<div data-levels="ug" markdown="1">
Three criteria separate the platforms: step-by-step guidance (ChatGPT and Gemini 4), avoiding answers (Gemini 3, ChatGPT and CoPilot 4), and transparency (Claude, DeepSeek, and CoPilot 4). The evaluator also found CoPilot rigid, reading "step-by-step" too literally, though its step score was 5. Every platform scored 5 on cognitive congruence and on following directions. The authors recommend Claude and ChatGPT for consistency, and they list DeepSeek separately: it tied Claude, but Florida law bars its use in public institutions, and they suggest local hosting of the open model as a workaround.
</div>

<div data-levels="grad res" markdown="1">
Table 1 rests on one transcript per platform, scored by the lead author, so each cell is a single rating with no inter-rater check. The Draft 4 means come from an unstated number of classroom transcripts on mostly two platforms, against Draft 5's five platforms and one evaluator; the 1.62-point rise in cognitive congruence (3.38 to 5.0) therefore bounds the joint effect of prompt, user, and platform. The text's Draft 5 means equal Table 1's five-platform means exactly.
</div>

## What the chapter found

<div data-levels="public" markdown="1">
- A prompt can make a chatbot coach a student through judging a source instead of judging it for them, but only after careful revision.
- Explaining the reason behind each rule worked better than repeating the rule.
- Chatbots differ: the same prompt produced a patient tutor on one platform and an answer machine on another.
- Clear assignment directions and students used to treating AI as a thinking partner made the tutor work better.
- The authors conclude that chatbots are not ready for the classroom out of the box.
</div>

<div data-levels="hs" markdown="1">
- Draft 5 rubric totals: Claude 29, DeepSeek 29, CoPilot 28, ChatGPT 28, and Gemini 26 of 30.
- "Just right" amount of information: 5 of 9 (Phase 1), 28 of 40 (Phase 2), and 5 of 5 (Phase 3).
- Overall quality rated very good or excellent: 7 of 9, 22 of 40, and 5 of 5.
- In the classroom round, 12 of 15 practicum students and 10 of 25 introductory students rated quality highly.
- Avoiding giving answers rose from a mean of 3.08 (Draft 4) to 4.2 (Draft 5) on the 1-to-5 rubric.
</div>

<div data-levels="ug grad res" markdown="1">
- **Rationale over repetition.** Repeating prohibitions reduced ChatGPT's adherence; XML structure with a stated reason for each directive did.
- **Rubric gains.** Cognitive congruence 3.38 to 5.0, adaptability 3.18 to 4.8, and avoiding answers 3.08 to 4.2 (Draft 4 classroom transcripts to Draft 5 technical review).
- **Survey gains.** Natural language rated positively by 22.2, 40, and 100 percent across phases; adaptability by 66.7, 72.5, and 100 percent; information "just right" for 55.6, 70, and 100 percent.
- **Platforms matter.** Draft 5 totals range from 26 (Gemini 3) to 29 (Claude Sonnet 4.5 and DeepSeek 3.2); CoPilot's prompt length limit forced splitting the prompt into two entries.
- **Assignment design matters.** Directions that define acceptable source types worked; vague requests for "scholarly sources" confused both students and the tutor.
- **AI literacy mediates.** Students who already used AI as a thinking partner engaged; students who used it to generate answers were frustrated.
</div>

<div data-levels="grad res" markdown="1">
<div class="pt-wrap">
<table class="results-table">
<caption class="w-note">Survey shares as printed, with the counts and Wilson 95% intervals this page computes. Counts and intervals are the page's.</caption>
<thead><tr><th>Measure</th><th>Phase 1 (N = 9)</th><th>Phase 2 (N = 40)</th><th>Phase 3 (N = 5)</th></tr></thead>
<tbody>
<tr><td>Information "just right"</td><td>55.6% · 5 · 26.7–81.1%</td><td>70% · 28 · 54.6–81.9%</td><td>100% · 5 · 56.6–100%</td></tr>
<tr><td>Natural language, positive</td><td>22.2% · 2 · 6.3–54.7%</td><td>40% · 16 · 26.3–55.4%</td><td>100% · 5 · 56.6–100%</td></tr>
<tr><td>Adaptability, positive</td><td>66.7% · 6 · 35.4–87.9%</td><td>72.5% · 29 · 57.2–83.9%</td><td>100% · 5 · 56.6–100%</td></tr>
<tr><td>Overall quality, positive</td><td>78% · 7 · 45.3–93.7%</td><td>55% · 22 · 39.8–69.3%</td><td>100% · 5 · 56.6–100%</td></tr>
</tbody>
</table>
</div>
</div>

## Why it matters

<div data-levels="public hs" markdown="1">
Students will use chatbots for research whether or not a course plans for it. A tutor prompt that asks instead of answers keeps the thinking with the student, and because the chapter publishes the full prompt, rubric, and survey under an open license, any instructor can copy them, test them on their own assignment, and see whether the chatbot their students use behaves.
</div>

<div data-levels="ug" markdown="1">
The chapter supplies three reusable pieces: a prompt, a six-criterion rubric for judging tutor transcripts, and a survey keyed to the same criteria. Together they let an instructor test a prompt against an assignment before students see it. The authors suggest the same approach for other research tasks (question development, synthesis, gap analysis, outlining, and source integration).
</div>

<div data-levels="grad res" markdown="1">
The rubric and survey give LLM tutoring a shared measurement frame that later studies can apply with larger samples, multiple raters, and learning outcomes. The authors' own future work points that way: longitudinal studies of independent source identification and source quality, student co-design, and tracking platform updates, since every platform result here is a snapshot of one model version.
</div>

<div data-levels="res" markdown="1">
## Notes from building this page

- **Table 1's Average row describes three platforms.** The printed averages (5, 4.33, 3.67, 4.67, 4.67, 5; total 27.33) do not match the five rows, whose means are 5, 4.6, 4.2, 4.8, 4.4, 5 (total 28.0). Of the 31 non-empty sets of platforms, only CoPilot, ChatGPT, and Gemini reproduce every printed average; the row may predate the addition of Claude and DeepSeek. The text's Draft 5 means (5.0, 4.8, and 4.2) use all five.
- **Counts behind the shares.** Each printed percentage has exactly one whole-number count at its phase's N (for example, 78 percent of nine is seven). Table 3 lists an Overall Quality row with empty cells; the text supplies 78, 55, and 100 percent.
- **"Above average" in the course split.** The survey's scale has no "above average" point; 12 + 10 = 22 of 40 equals the Phase 2 overall-quality share, so the page reads it as very good or excellent.
- **Phase 1 respondents.** The text describes six student workers plus three more DRACO Lab students, and Table 2 gives N = 9. Stating whether nine people or six people with nine responses took part would settle the denominator.
- **Unit of analysis in Phase 3.** The five responses are five platforms rated by one evaluator on one assignment, so the 100 percent shares describe platform behavior under expert use rather than student reception; the authors say so in their limitations. A Wilson interval on five of five still runs down to 56.6 percent.
- **Draft 4 rubric sample.** The Draft 4 means come from a "representative sample" of classroom transcripts whose size and platform mix the text does not give, and Figure 2's other three Draft 4 means are not stated in the text. Reporting n per criterion and a second rater's scores would let readers judge the 1.1 to 1.6 point gains.
- **The course gap.** Fisher's exact test on 12 of 15 against 10 of 25 gives p = 0.022 (page's own), but course, assignment, survey form, and student year all differ, so the gap supports the authors' point about assignment design without isolating it.
- **Source record.** UCF STARS lists DOI 10.59668/2340.26762 for this chapter; confirming whether it identifies the chapter or the whole book would make the citation exact.
</div>

<div data-levels="hs" markdown="1">
## Try this in class

1. Pick one article your class is reading. In pairs, one student plays the tutor and may only ask questions (one at a time, never "yes, it is peer-reviewed"); the other decides, using the clues in the chapter's Step 3: journal, author affiliations, reference list, and section headings.
2. After five minutes, the observer scores the tutor on two rubric lines from the **Scoring the final prompt** demo, avoiding giving answers and step-by-step guidance, from 1 to 5.
3. Pool the class's scores, compute each line's average, and compare it with the chatbots' scores in Table 1. Write two sentences on which rule was hardest for a human tutor to follow.
</div>

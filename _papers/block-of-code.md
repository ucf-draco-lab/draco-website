---
title: "A Block of Code: Programming with Blocks You Can Hold"
kicker: "Interactive paper · ASEE Annual Conference 2016"
subtitle: "An interactive companion to Mike Borowczak and Andrea C. Borowczak's paper on a senior capstone that built physical programming blocks for K–12 students, and on what a project with a visible purpose did for the five engineering students who built it."
description: "Snap together the capstone team's programming blocks and run them on a port of the team's own interpreter, then follow the study that compared that team with other capstone teams on interest, conflict, and plans after graduation."
share_description: "Five engineering seniors built fifty programming blocks for K–12 classrooms. Their interest held at 4.7 to 4.8 out of 5 while other capstone teams fell from 3.9 to 3.2, and 80 percent wanted to keep going after graduation, against 10 percent. Build and run a program on the blocks, at five reading levels."
share_text: "Physical programming blocks for K–12 students, built by a senior capstone team. Run the blocks and see what the project did for its builders:"
share_image: /papers/block-of-code/share.png
share_image_alt: "A grid of programming blocks spelling a Fibonacci program, row by row, with its printed output 1, 1, 2, 3, 5, 8, 13, 21, beside the title A Block of Code."
date: 2026-10-22
topics: ["Education", "Programming languages"]
default_level: public
level_hints:
  public: No background needed
  hs: A little coding and binary
  ug: Digital logic, buses, and parsers
  grad: Study design and small-sample statistics
  res: Full design, port checks, and open questions
authors:
  - name: Mike Borowczak
    affiliation: Erebus Labs
    member: mike-borowczak
  - name: Andrea C. Borowczak
    affiliation: University of Wyoming
    member: andrea-borowczak
sources:
  - venue: "ASEE Annual Conference & Exposition · New Orleans, LA · 2016"
    title: "Developing a Creative K-12 Manipulative: An ECECS Capstone"
    url: https://doi.org/10.18260/p.26718
    access: Free to read
code: { label: "Capstone team's repository (blocks-o-code, GPL-2.0)", url: https://github.com/Debrant/blocks-o-code }
citations:
  - borowczak2016developing
widget:
  css:
    - /papers/block-of-code/widget.css
  js:
    - /papers/block-of-code/abc-engine.js
    - /papers/block-of-code/widget.js
credit: "Interactive page by the [DRACO Lab](/). The blocks run on a JavaScript port of the capstone team's own controller software: the block byte and token table, the topology scan, the token spacing step, the Flex lexer, the Bison parser (the team's grammar compiled by GNU Bison 3.8.2 into the same tables), the interpreter, and the five output filters. The port printed exactly what the team's C interpreter printed, standard output and errors, on 34,825 random programs, with no differences; 1,175 more looped forever in both. The byte layout matches the paper's Figure 4, and the set prices match Appendix A. Ratings and percentages come from the paper's study results; count readings and the exact test are the page's own. Everything runs on your device."
bibtex: |
  @inproceedings{borowczak2016developing,
    author    = {Borowczak, Mike and Borowczak, Andrea C.},
    title     = {Developing a Creative K-12 Manipulative: An ECECS Capstone},
    booktitle = {2016 ASEE Annual Conference \& Exposition},
    address   = {New Orleans, LA},
    year      = {2016},
    month     = {June},
    publisher = {ASEE Conferences},
    doi       = {10.18260/p.26718},
    url       = {https://peer.asee.org/26718}
  }
---

<div class="lede" data-levels="public" markdown="1">
Children learn to count with blocks and to read with letter tiles, yet computer programming usually waits for a screen. A team of five engineering seniors at Portland State University set out to change that. Over their capstone project they built about fifty palm-sized blocks that snap together into a program: number blocks, operator blocks, loop blocks, and output blocks that light an LED or sound a buzzer. Mike Borowczak and Andrea C. Borowczak sponsored the project and studied the team along the way. The students who built something for children stayed interested in their work, while students on other capstone teams lost interest. On this page you can build and run a program with the same blocks.
</div>

<div class="lede" data-levels="hs" markdown="1">
Each block in "A Block of Code" holds a small computer chip and a dial. Turning the dial picks what the block means (a digit, a variable, a plus sign, a loop, an output), and placing blocks side by side writes a line of code. A controller board reads the blocks row by row, turns them into text, and runs the program. The paper describes how a five-student capstone team built the blocks, and compares that team with other capstone teams on interest, teamwork, and plans after graduation. The board below runs the team's own software, ported to your browser.
</div>

<div class="lede" data-levels="ug" markdown="1">
"A Block of Code" (ABC) is a tangible programming language: 2 × 2 × 2 inch blocks, each with an ATtiny461 microcontroller and a potentiometer wheel, connected through DB-9 connectors that carry a two-neighbor local SPI bus and a global TWI (I²C) bus. A BeagleBone controller discovers the block layout, reads one byte from every block, maps each byte to a token, and pipes the text through a Flex and Bison parser into an interpreter that drives five output channels. The paper presents the system as an electrical and computer engineering capstone and reports a soft-skills comparison between the ABC team and other capstone teams with the same sponsor.
</div>

<div class="lede" data-levels="grad" markdown="1">
The paper pairs a design report with a small comparative case study. One capstone team (five students) built a K–12 programming manipulative with a visible community purpose; students on the sponsor's other capstone teams formed the baseline. Pre- and post-project self-assessments on a five-point scale, open responses on conflict, an advisory panel's records, GitHub activity, and exit interviews make up the data. The paper reports group means (interest 4.7 → 4.8 against 3.9 → 3.2) and percentages (80% against 10% wanting to continue after graduation) without counts, spreads, or tests. This page shows those results as printed and, at this level, adds count readings and an exact test, labeled as the page's own.
</div>

<div class="lede" data-levels="res" markdown="1">
Borowczak and Borowczak (2016) report a physical programming language built by a Portland State University capstone team and argue that projects with community impact strengthen communication and collaboration. The team's repository holds the complete controller software. This page ports it (token table, scan, spacing step, Flex lexer, Bison tables, interpreter, and output filters) and checks the port against the team's C interpreter on 36,000 random programs. Running the original code surfaces several behaviors the paper does not describe, collected in the notes at the end, along with the gaps in the study's reporting.
</div>

## Build a program with the blocks

<div id="abc-build" class="w-demo"></div>

<div data-levels="public" markdown="1">
Pick an example, then press **Scan and run**. The controller reads each block in turn (watch the highlight), writes out the program, and runs it. In "Count to five," the loop counts from two to five, prints each number, and shows each count on the colored light. Change any block by choosing a type and a token above the board and tapping a square. A block that is not connected to the chain is never read, the same as on the real table.
</div>

<div data-levels="hs" markdown="1">
Each row is one line of code, read left to right. A variable block followed by a value stores the value (`X 1` sets X to 1), and a plus block followed by an equals block becomes `+=`. Neighboring digit blocks join into one number, so 2 and 5 side by side read as 25. Try the two exercises from the paper's appendix: the Fibonacci program here takes 20 blocks, under the paper's challenge of 25. Then change the 25 to a different limit and run it again.
</div>

<div data-levels="ug" markdown="1">
Select a block to see the byte it returns over the TWI bus: two adjacency flags, a two-bit category, and the top four bits of the wheel's ADC reading (the paper's Figure 4). The controller's lexer walks the layout recursively from the block on the cape, looks up each (category, wheel code) pair in a 4 × 16 table, and prints one text line per row. A small spacing pass then joins adjacent digits and joins an arithmetic operator to a following `=`. The text goes to a Flex lexer and a Bison grammar with no statement terminators: a statement ends where the grammar says it must.
</div>

<div data-levels="grad" markdown="1">
The examples come from the paper and the repository: the team's test script, Appendix B's two programming exercises, and the four blocks in Figure 5. Every preset was run through the team's C interpreter as well as through this port, with the same output. The "Raw interpreter output" panel shows the stream the controller's output filters read, including the interpreter's line markers.
</div>

<div data-levels="res" markdown="1">
The port reproduces the C interpreter byte for byte, including error messages, the silent abort on an unrecognized character in expression position, NaN signs as glibc prints them on x86-64, and the line-marker timing that depends on parser lookahead. The board models the hardware's adjacency flags from block positions; the real system also retries the handshake when a neighbor is slow to answer, which this model does not need. The "Output quirk" preset shows one consequence of the spacing pass.
</div>

## What the team was asked to build

<div id="abc-brief" class="w-demo"></div>

<div data-levels="public hs" markdown="1">
The project started as a two-page proposal with three tiers of wishes. The must-have tier asked for blocks under $3 each, open designs anyone could copy, and enough sets for every team member and both sponsors. Some wishes changed on the way: the proposal hoped for magnetic connections between blocks, and the team built them with sturdy nine-pin connectors instead.
</div>

<div data-levels="ug grad res" markdown="1">
Appendix A sets cost caps of $3, $2, and $1 per block (sets of 20 at $60, $40, and $20), asks for a multi-chip design with no single system-on-chip, and asks for an open hardware and software repository. The team met the multi-chip and open-repository asks and replaced magnetic and inductive coupling with DB-9 connectors that carry power and both buses. The paper reports no achieved cost or power figures, so the page leaves those rows open.
</div>

## The study

<div id="abc-design" class="w-demo"></div>

<div data-levels="public hs" markdown="1">
Every capstone team in the comparison had the same sponsor and went through the same selection process. The difference: the A Block of Code team built something for children, while the other teams' projects had no such purpose. The researchers asked students how interested they were before and after the project, kept track of how each team communicated, and talked with the students at the end.
</div>

<div data-levels="ug grad res" markdown="1">
The design is a quasi-experimental comparison of intact groups. The paper names the instruments (Likert and open-response self-assessments before and after, advisory-panel records, GitHub metrics, and exit interviews) but reports no group sizes for the baseline teams, no item wording beyond the conflict question, and no inferential tests. Meeting counts were "nearly identical" across groups, which the authors use to rule out time on task as the explanation.
</div>

## What changed for the students

<div id="abc-interest" class="w-demo"></div>

<div data-levels="public" markdown="1">
The team building blocks for children started interested and stayed interested. Students on the other teams lost interest over the six months. At the end, eight in ten students on the blocks team wanted to keep working on their project after graduation; on the other teams, one in ten did.
</div>

<div data-levels="hs" markdown="1">
On a five-point scale, the blocks team rated its interest 4.7 before and 4.8 after (a change of +0.1). The other teams went from 3.9 to 3.2 (a change of −0.7). The paper also gives the words the scale used: "Significant" for the blocks team, and "Moderately Significant" falling to "Moderately" for the others.
</div>

<div data-levels="ug" markdown="1">
The comparison is between group means on a single Likert item about project interest, plus a yes or no interest in continuing. With five students on the ABC team, 80% corresponds to four students. The baseline percentage is consistent with several group sizes, so the page does not assume one.
</div>

<div data-levels="grad res" markdown="1">
Without counts or standard deviations, the rating change cannot be tested from the paper. The continuation result can be bounded: four of five against any baseline count that rounds to 10% gives a two-sided Fisher exact p from 0.0031 (three of 30) to 0.0170 (one of ten) across the five counts up to 30 that round to 10%. The groups were not randomized, worked on different projects, and differed at baseline (4.7 against 3.9), so the result describes the gap rather than its cause.
</div>

## How the teams handled conflict

<div class="ss-table-scroll" markdown="0">
<table class="results-table">
<tr><th></th><th>Baseline teams</th><th>A Block of Code team</th></tr>
<tr><td>Why resolve a conflict</td><td>"For the grade"</td><td>A "self-imposed goal of a successful project"</td></tr>
<tr><td>How</td><td>"Establishing hierarchies and domain boundaries and contracts"</td><td>"Subsystem champions" who enabled discussion, brainstorming, moderation, and support</td></tr>
<tr><td>Meetings</td><td colspan="2">Nearly identical counts across groups (Figure 10)</td></tr>
<tr><td>Interest in continuing after graduation</td><td>10%</td><td>80%</td></tr>
</table>
</div>

<div data-levels="public hs" markdown="1">
Both kinds of team met about as often. What differed was the reason to work things out. Students on the other teams settled disagreements to protect their grade, often by splitting the work and drawing lines around each person's part. The blocks team gave each part of the system a "champion" who led discussion about it, and they solved problems together because they wanted the blocks to work.
</div>

<div data-levels="ug grad res" markdown="1">
The paper's Figures 9 and 10 chart average discussions, discussion length, and meetings per week for each group; their values are not printed in the text, so this page does not redraw them. The authors argue that the baseline pattern (hierarchy, boundaries, contracts) satisfies the course without building the teamwork and communication outcomes ABET expects, while the champion structure on the ABC team practiced them.
</div>

## What the paper found

<div data-levels="public" markdown="1">
- A five-student team built about fifty programming blocks that a controller reads and runs.
- A few young students (kindergarten through fifth grade, none of whom had programmed before) tried the blocks at a capstone showcase, and the feedback was positive.
- The team with a purpose beyond the grade stayed interested and wanted to keep going; the other teams lost interest.
</div>

<div data-levels="hs" markdown="1">
- Each block sends the controller one byte: who its neighbors are, what type it is, and where its dial points.
- The blocks team rated its interest 4.7 before and 4.8 after; the other teams fell from 3.9 to 3.2.
- 80% of the blocks team, and 10% of the other teams, wanted to continue their project after graduation.
- The young students who tried the blocks numbered fewer than ten, so the authors treat that feedback as a first look.
</div>

<div data-levels="ug" markdown="1">
- **Two buses.** A two-neighbor SPI chain assigns each block an (x, y) address; a global TWI bus then reads one status byte per block.
- **A real toolchain.** A Python lexer, a Bison parser, and a C interpreter run on a BeagleBone, with five output channels.
- **Interest.** ABC 4.7 → 4.8; baseline 3.9 → 3.2 on a five-point scale.
- **Continuation.** 80% of ABC students against 10% of baseline students.
- **Conflict.** Collaborative problem solving on the ABC team; hierarchy and contracts "for the grade" elsewhere.
</div>

<div data-levels="grad res" markdown="1">
<div class="ss-table-scroll" markdown="0">
<table class="results-table">
<tr><th>Measure</th><th>ABC team</th><th>Baseline teams</th><th>Source</th></tr>
<tr><td>Students</td><td>5</td><td>Not stated</td><td>Acknowledgements; Study and Methods</td></tr>
<tr><td>Interest, before</td><td>4.7 ("Significant")</td><td>3.9 ("Moderately Significant")</td><td>Study Results</td></tr>
<tr><td>Interest, after</td><td>4.8 ("Significant")</td><td>3.2 ("Moderately")</td><td>Study Results</td></tr>
<tr><td>Continue after graduation</td><td>80%</td><td>10%</td><td>Study Results</td></tr>
<tr><td>Meetings per week</td><td colspan="2">"Nearly identical" (Figure 10)</td><td>Study Results</td></tr>
<tr><td>K–5 trial</td><td colspan="2">Several students, n &lt; 10, informal feedback</td><td>Results of Physical Implementation</td></tr>
<tr><td>Blocks built</td><td colspan="2">About 50, each 2 × 2 × 2 inches</td><td>Results of Physical Implementation</td></tr>
<tr><td>Four of five against one of ten, Fisher exact (page)</td><td colspan="2">p = 0.0170 (two-sided)</td><td>Computed by this page</td></tr>
</table>
</div>
</div>

## Why it matters

<div data-levels="public hs" markdown="1">
Two groups learned from these blocks. Young students got a way to touch a program and rearrange it with their hands. The engineering students who built the blocks practiced the teamwork and communication that employers and accreditors ask for, and they did it because the project mattered to someone outside the classroom. Ultimately, the paper argues that a capstone with a visible purpose teaches the soft skills that a grade alone does not.
</div>

<div data-levels="ug grad res" markdown="1">
The capstone produced a working, open, multi-chip embedded system: microcontrollers on a discovered topology, two buses, a status-byte protocol, and a language toolchain. The study adds a hypothesis worth testing at scale: matching students to projects with a community purpose may sustain interest and shift teams from contractual to collaborative conflict resolution. The present evidence (one team of five, unreported baseline sizes, no tests) supports that hypothesis as a direction rather than a measured effect.
</div>

<div data-levels="hs" markdown="1">
## Try it in class

1. **Be the blocks.** Write tokens on sticky notes (X, 1, while, <, 2, 5, Print, endwhile, and so on). Each student holds one, and the class lines up in rows to spell the Fibonacci program from the board above.
2. **Be the controller.** One student reads the rows aloud, left to right and top to bottom, while another writes the program on the board. Join digits that stand side by side.
3. **Be the interpreter.** Run the program by hand in a table with columns X, Y, and Z. Then challenge the class to write the Fahrenheit-to-Celsius program in fewer than 18 blocks, and check the answer on this page.
</div>

<div data-levels="res" markdown="1">
## Notes from building this page

These notes come from reading and running the team's code next to the paper. They are the page's observations, offered for the authors' review.

- **The port.** The team's grammar (`parse.y`) compiles with GNU Bison 3.8.2 to 76 states, with 12 shift/reduce and 9 reduce/reduce conflicts resolved by Bison's defaults. The port carries Bison's tables unchanged and follows its LALR driver, including `parse.lac full`. Against the team's C build on 36,000 random programs (structured programs, block layouts, and character soup), 34,825 printed identical standard output and standard error and 1,175 looped forever in both; none differed.
- **Assignment by position.** Appendix B notes that the `=` block tests equality. Assignment comes from placement alone (`X 1` sets X), and compound assignment from an operator block followed by `=`, which the spacing pass joins into `+=`.
- **Preloaded variables.** The interpreter starts with x = −1, y = π, and z = 10 (`globals.c`), so `Print X` before any assignment prints −1.
- **Output blocks and digits.** The spacing pass joins any two neighboring digit tokens, including the channel digit inside an output block's token, so an output block followed by a digit block reads as `output 15` and fails to parse. A variable or a parenthesis between them avoids it.
- **Channel wiring.** The paper's Figure 7 example puts a buzzer on output 2 and a motor on output 4; `orchestrate.py` wires output 2 to an RGB LED, 3 to the motor, and 4 to the buzzer. The paper calls the outputs customizable, so both can be right. In the code, each filter matches `#OUT(` followed by its channel digit as a prefix (so channel 12 reaches the output 1 filter), and the RGB and buzzer filters call Python `int()` on the value text, which stops those filters on a fractional value. These behaviors come from reading the filters; the page simulates them and could not test them on hardware.
- **Line markers.** The interpreter's `#LINECHANGE(n)` markers record the lexer's line count when each statement reduces, minus one, so they often point past the statement (the Fibonacci loop reports line 7 for its `while` row).
- **Silent stops.** An unrecognized character where an expression may start (`Print .`) ends parsing through `YYABORT` with no message, while the same character elsewhere prints an error with its position.
- **Scan direction.** The code names the vertical neighbor flag "above" and climbs column 1 first, then reads rows on the way back; the paper and the team report describe the chain going down. The lexer files blocks by row either way, so the program text is the same.
- **Counts and durations.** The paper reports about 50 blocks; Appendix B's kit lists 52 (15 value, 15 operator, 15 control, and 7 output), matching the team report's 52. The paper describes a 3-month build and a six-month capstone. Appendix B lists value blocks as 1–9; the token table also offers 0, a decimal point, and five variables.
- **Study reporting.** Baseline group sizes, the number of baseline teams, standard deviations, and the source of the continuation question are not reported, and Figures 9 and 10 carry no printed values. The count readings and the exact test on this page are the page's own.
</div>

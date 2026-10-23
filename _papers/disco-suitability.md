---
title: "Fit to Read: Checking a Binary Before a Model Names Its Functions"
kicker: "Interactive paper · IEEE Resilience Week 2021"
subtitle: "An interactive companion to Shaya Wolf, Rita Foster, Jed Haile, and Mike Borowczak's suitability analysis, which decides from a binary's structure whether a malware-trained model should be trusted to read it."
description: "Shade a binary's functions by size and remove the ones too small to name; walk the graph a malware model builds from code; slide the thresholds on 831 match scores; set the split behind a suitability score; and check the paper's predictions against its own result tables."
share_description: "A model trained on one malware family can still read other code, until it cannot. This paper checks a binary's structure first and refuses data the model was never built to read. Explore the suitability call in your browser, written for five reading levels."
share_text: "Before a model reads a binary, check whether the binary is fit to be read. Explore the suitability call in your browser:"
share_image: /papers/disco-suitability/share.png
share_image_alt: "Two grids of 100 squares, one per percent of functions, for Libssh and TRISIS, with small functions highlighted, beside the title Fit to Read and the printed suitability scores of 97.12 and 2 percent."
date: 2026-10-20
topics: ["AI & machine learning", "Hardware security"]
default_level: public
level_hints:
  public: No background needed
  hs: Percentages, counting, and a little programming
  ug: Programs, graphs, and classifiers
  grad: Model evaluation, data shift, and binary analysis
  res: Full method, reproduction checks, and open questions
authors:
  - name: Shaya Wolf
    affiliation: Idaho National Laboratory and University of Wyoming
  - name: Rita Foster
    affiliation: Idaho National Laboratory
  - name: Jed Haile
    affiliation: Idaho National Laboratory
  - name: Mike Borowczak
    affiliation: University of Wyoming
    member: mike-borowczak
sources:
  - venue: "IEEE Resilience Week (RWS) · 2021"
    title: "Data-Driven Suitability Analysis to Enable Machine Learning Explainability and Security"
    url: https://doi.org/10.1109/RWS52686.2021.9611792
    access: Paywalled (IEEE)
code:
  label: "@DisCo and the paper's binaries are not public; this page works from the printed tables and figures"
  url: https://doi.org/10.1109/RWS52686.2021.9611792
citations:
  - wolf2021data
widget:
  css:
    - /papers/disco-suitability/widget.css
  js:
    - /papers/disco-suitability/suit-engine.js
    - /papers/disco-suitability/widget.js
credit: "Interactive page by the [DRACO Lab](/). @DisCo and the paper's binaries are not public, so the page re-runs no model; it works from the printed numbers. `suit-engine.js` recovers the whole-function counts behind every Figure 3 percentage from Table II's totals (one solution for TRISIS's 175 functions, four for Libssh's 10,981 that differ by one function between neighboring bins), digitizes Figure 1's curve (831 points; 514, 186, and 131 at the paper's thresholds against the printed 514, 187, and 130), and finds the split of named and anonymous functions under which one reading of the suitability score reproduces both printed scores, 97.12% and 2%. An independent Python check agrees on every count. The score reading, the split, and Figure 2's bar heights are the page's reconstructions and are labeled so where they appear."
bibtex: |
  @inproceedings{wolf2021data,
    author    = {Wolf, Shaya and Foster, Rita and Haile, Jed and Borowczak, Mike},
    title     = {Data-Driven Suitability Analysis to Enable Machine Learning Explainability and Security},
    booktitle = {2021 Resilience Week (RWS)},
    pages     = {1--7},
    year      = {2021},
    doi       = {10.1109/RWS52686.2021.9611792}
  }
---

<div class="lede" data-levels="public" markdown="1">
A program that has learned from one kind of data can give confident answers about data it has never seen, and those answers can be wrong. Shaya Wolf, Rita Foster, Jed Haile, and Mike Borowczak studied @DisCo, a tool from Idaho National Laboratory that names the pieces of a compiled program (its functions) after learning from 61 copies of one piece of malware. Before handing @DisCo a new program, they checked its structure: how many of its functions are too small to tell apart, and how many have names at all. That check predicted that @DisCo would read a common networking library (Libssh) well and a piece of industrial-control malware (TRISIS) not at all, and both predictions held.
</div>

<div class="lede" data-levels="hs" markdown="1">
Compiled programs are made of functions, and each function is made of blocks, short runs of instructions that execute together. @DisCo learns what a function looks like from the instructions inside it, and it learned from Meltdown malware samples only. The authors asked whether they could tell in advance which new programs @DisCo could handle. Their answer used two percentages: the share of functions with fewer than three blocks (too small to tell apart) and the share with no name (unlikely to look like anything in the training data). From those, Libssh scored 97.12% suitable and TRISIS scored 2%, and @DisCo's later accuracy (up to 72% on Libssh, 0% on TRISIS) agreed.
</div>

<div class="lede" data-levels="ug" markdown="1">
@DisCo (Annotated and Translated Disassembled Code) lifts a binary with angr into the VEX intermediate representation and stores it as a graph (libraries, functions, blocks, and feature nodes) in a graph database. A neural network embeds each function from its VEX instruction counts and names it by cosine similarity to learned embeddings. Trained on 61 Meltdown samples, the model matched 514 of 831 held-out Meltdown embeddings above 0.95. The paper proposes a suitability analysis run on the graph alone, before inference: remove functions with fewer than three blocks, then compare how many named and anonymous functions the removal takes. The analysis rated Libssh well-fit and TRISIS ill-suited, and Tables III and IV confirm both calls.
</div>

<div class="lede" data-levels="grad" markdown="1">
Deployed models fail quietly when inputs drift from the training distribution, and a malware model trained on one family (Meltdown, 61 samples) faces that drift with every new binary. Wolf et al. propose a model-specific suitability gate: structural statistics from @DisCo's graph database (the block-count distribution of functions and the named share) decide whether a binary is fit for inference, so the system can refuse a binary and explain why rather than return confident nonsense. On two test binaries the gate's calls (Libssh 97.12% suitable, TRISIS 2%) match the outcomes: Libssh accuracy 0.64 to 0.72 with every function kept and 0.84 to 0.89 with functions seen at least seven times; TRISIS accuracy 0 at every split.
</div>

<div class="lede" data-levels="res" markdown="1">
Wolf, Foster, Haile, and Borowczak (IEEE Resilience Week 2021) report a case study: one model (@DisCo), one training family, two test binaries, and a two-branch suitability rule stated in prose. @DisCo and the binaries are not public, so this page re-runs no model. It recovers the integer counts behind Figure 3 from Table II, digitizes Figure 1, recomputes the text's comparisons from Tables III and IV, and shows that Figure 3's printed marginals do not by themselves determine the rule's verdict. One reading of the score, stated below, reproduces both printed values exactly. The notes at the end list what the printed method leaves open.
</div>

## One square per function

<div id="ds-waffle" class="w-demo"></div>

<div data-levels="public" markdown="1">
Each grid has 100 squares, and each square stands for one percent of a program's functions. Darker squares are bigger functions. The gray squares are functions with fewer than three blocks, which the authors treat as too small for @DisCo to tell apart: some are empty leftovers of the disassembly, and many are short helpers that look alike. Press **Remove small functions**. Libssh loses about 83 squares in every 100 and TRISIS about 70, so both programs shrink to a small core. Which functions remain decides the outcome, and the demo after next shows how.
</div>

<div data-levels="hs" markdown="1">
A block is a stretch of instructions with one way in and one way out; a function with zero blocks has no code that @DisCo can read. In Libssh, 73.76% of functions have exactly one block, which is typical of a library full of short wrapper functions. TRISIS has fewer one-block functions (17.14%) but many empty ones (48%). The slider moves the cutoff. Notice how little changes past three blocks: for Libssh, removing functions under two blocks already takes 81.7%, and removing everything under six takes 85.6%. The table recovers whole-function counts from the printed percentages, using the totals in Table II (10,981 and 175 functions).
</div>

<div data-levels="ug" markdown="1">
The rule the paper applies is a structural filter on the function nodes of the graph: drop functions whose has-block out-degree is below three. Zero-block functions are artifacts of angr's recovery, and one- or two-block functions give the embedding network too few VEX counts to separate classes. The counts in the table are not printed in the paper; they are the integers that reproduce each printed percentage and sum to Table II's total. For TRISIS the solution is unique; for Libssh four solutions exist, and the choice among them changes no conclusion on this page.
</div>

<div data-levels="grad res" markdown="1">
Integer recovery is a constraint search: for each bin, the counts whose percentage of the total rounds to the printed value, then every combination that sums to the total. TRISIS admits exactly one vector, (84, 30, 8, 3, 2, 5, 43). Libssh admits four, which differ only in whether one function sits in the two- or three-block bin and one in the three- or four-block bin; the removed total is 9,082 or 9,083 of 10,981. The filter at three blocks removes 82.7% of Libssh and 69.7% of TRISIS, so both test binaries lose most of their functions before any suitability judgment is made. The judgment rests on the composition of the removed set, which the next demos take up.
</div>

## How @DisCo reads a program

<div id="ds-graph" class="w-demo"></div>

<div data-levels="public" markdown="1">
@DisCo does not read a program as text. It breaks the program into a family tree: libraries hold functions, functions hold blocks, and blocks hold the individual instructions it counts. Switch between the two programs. Libssh spreads its code across many small functions (about six blocks each, on average), while TRISIS packs its code into fewer, larger blocks. Counted per library, the two programs look much alike; counted per function or per block, they look nothing alike.
</div>

<div data-levels="hs" markdown="1">
Table II gives the counts: Libssh has 8 libraries, 10,981 functions, and 66,162 blocks, and TRISIS has one library, 175 functions, and 825 blocks. Dividing gives the averages, such as 66,162 ÷ 10,981 ≈ 6.03 blocks per function for Libssh. Figure 2 reports the average number of VEX features (instruction counts) at each level; the bar heights here were read from the figure, so they are close but not exact. The authors' point: if you looked only at features per library, you would think the two programs were similar.
</div>

<div data-levels="ug" markdown="1">
The graph's node types are libraries, functions, blocks, and features, joined by has-function, has-block, and has-feature edges, with control-flow edges (branch true, branch false, unconditional, and calls) between blocks. Table II lists as many feature nodes as blocks, which fits one feature node per block holding that block's VEX counts. Figure 2's two left panels agree with Table II: the ratio of features per function to features per block is 6.0 for Libssh and 4.72 for TRISIS, matching Table II's 6.03 and 4.71 blocks per function.
</div>

<div data-levels="grad res" markdown="1">
Multiplying each Figure 2 bar by the matching Table II count should give one total feature count per binary. The per-block and per-function panels agree with each other to within 1% (about 330,000 features for Libssh and 33,600 for TRISIS), but the per-library panel implies about half of that (167,000 and 16,700) for both binaries. A consistent factor of two across two binaries suggests a different denominator or a different feature definition in the library panel; the paper does not say which, and the page does not choose. The authors' qualitative reading, that the libraries look alike while the functions and blocks do not, holds under either total.
</div>

## How sure is a match

<div id="ds-match" class="w-demo"></div>

<div data-levels="public" markdown="1">
Before testing new programs, the authors checked @DisCo on Meltdown data like the data it learned from. For each of 831 functions, @DisCo found its best match and scored it from 0 (nothing alike) to 1 (identical). The curve sorts those scores from highest to lowest. Most functions match strongly, and the curve stays high for a long stretch before it falls. Drag the thresholds to see how many functions count as strong, weak, or unmatched.
</div>

<div data-levels="hs" markdown="1">
The paper calls a score above 0.95 a strong match and a score between 0.85 and 0.95 a weak match: 514 strong, 187 weak, and 130 with no match, which adds to 831. Thirteen functions scored above 0.9999. The authors note that perfect scores everywhere would be a warning sign of over-training, a model that memorized its examples. This curve was traced from the paper's Figure 1, pixel by pixel, so it is a close copy of the published one, and at the paper's thresholds it gives 514, 186, and 131.
</div>

<div data-levels="ug" markdown="1">
Each score is the highest cosine similarity between a function's embedding and any learned class embedding: cos θ = (a · b) / (‖a‖ ‖b‖), which ignores vector length and compares only direction. Sliding the strong threshold from 0.95 to 0.98 (the cutoff @DisCo used in the lab's ransomware study) drops strong matches from 514 to 374 on the digitized curve, because the curve declines slowly through that range. The long plateau and the knee near 0.85 is what the authors call desirable: high scores for most functions, and a clear tail of functions the model does not recognize.
</div>

<div data-levels="grad res" markdown="1">
The digitized curve has 831 points sampled from the plotted line between its first and last pixel columns, with the score axis calibrated on the five gridlines. At 0.95 and 0.85 it gives 514, 186, and 131, within one embedding of the printed counts, so counts at other thresholds are reliable to about one or two embeddings; the count above 0.9999 is below the figure's resolution. This test uses held-out Meltdown functions, the in-distribution case, so it bounds what the model can do; it says nothing yet about Libssh or TRISIS, which is why the suitability analysis exists.
</div>

## The suitability call

<div id="ds-call" class="w-demo"></div>

<div data-levels="public" markdown="1">
Each bar splits one kind of function into the share the size filter removes (highlighted) and the share it keeps. @DisCo can only name functions that resemble ones it has learned, so the call turns on which kind the filter takes. If the filter mostly removes nameless functions, what remains is what @DisCo can read: the program is well-fit. If it mostly removes named functions, what remains is what @DisCo cannot read: the program is ill-suited. Libssh lands on the first side and TRISIS on the second. The paper prints the results as 97.12% suitable for Libssh and 2% for TRISIS.
</div>

<div data-levels="hs" markdown="1">
The paper prints how many functions are named (28.5% of Libssh, 48.6% of TRISIS) and how many are small, but not how many are both. The bars start at one split that reproduces the printed scores exactly; the paper does not print this split. For Libssh, that split removes 7,625 of 7,851 anonymous functions, which is 97.12%. For TRISIS, it keeps only two of its 85 named functions, about 2%. Switch between the two programs and compare which bar crosses the dashed halfway line.
</div>

<div data-levels="ug" markdown="1">
The rule in Section IV-C has two branches: if most named functions are among those removed, the binary is ill-suited; if most anonymous functions are, it is well-fit. Figure 3 prints only the totals of the two-by-two table (named or anonymous, removed or kept), so the slider sets the missing cell within the range those totals allow. Read the score as the share that decides the branch (anonymous functions removed for a well-fit binary, named functions kept for an ill-suited one), and exactly one split per binary reproduces Figure 4. That reading is the page's: the paper reports the scores but not their formula.
</div>

<div data-levels="grad res" markdown="1">
The printed marginals leave the verdict open. For Libssh, any split consistent with Figure 3 removes between 39.3% and 100% of named functions and between 75.8% and 100% of anonymous ones, so a split exists in which both majorities are removed and the rule gives no answer. For TRISIS, the ranges are 37.6% to 100% (named) and 41.1% to 100% (anonymous), so the marginals admit either verdict. Under the page's reading, every one of the 44 combinations of Libssh's possible integer counts yields the same 226 anonymous functions kept (2.88% of the anonymous total), and TRISIS yields two named functions kept (2.35%, printed as 2). The verdicts, and Tables III and IV, depend on the joint table that the paper computed from the graph and did not print.
</div>

## Did the call hold up

<div id="ds-test" class="w-demo"></div>

<div data-levels="public" markdown="1">
To test the predictions, the authors ran @DisCo, still trained only on Meltdown, on Libssh and TRISIS. The bars count how many distinct function names each data set offers; choosing a minimum number of copies keeps only names that appear often. With every function kept (minimum zero), @DisCo named up to 72% of Libssh's functions correctly and none of TRISIS's. With a minimum of seven copies, TRISIS has nothing left to test, and Libssh reaches 84% to 89%, a few points below Meltdown itself. Both predictions held.
</div>

<div data-levels="hs" markdown="1">
Training uses 70%, 80%, or 90% of the Meltdown data, and the rest is held out for testing; pick a split to highlight its row. Loss measures how wrong the model's guesses are (lower is better), and accuracy is the share of functions named correctly. TRISIS's loss of 43.80 to 54.61, against Libssh's 5.71 to 9.27, shows how far outside @DisCo's experience TRISIS falls. With every function kept, the full Meltdown set was too large for the authors' notebook to run, so only the two test programs have results at a minimum of zero.
</div>

<div data-levels="ug" markdown="1">
Each function name is a class, and a minimum of k copies keeps only classes with at least k examples: Meltdown drops from 7,874 classes to 850 at seven copies, and Libssh from 391 to 151. Macro F1 averages per-class F1 with equal weights, and weighted F1 weights each class by its frequency, so the gap between them shows how much rare classes drag the score down (Libssh at zero copies: macro 0.56, weighted 0.67 at the 70/30 split). Training ran for 2,000 epochs. The best Libssh split differs by metric: 70/30 gives the highest accuracy and 90/10 the lowest loss.
</div>

<div data-levels="grad res" markdown="1">
The second table in the demo recomputes the text's Table IV comparisons. "Three times higher" loss at 70/30 is 3.05×, and "3% worse" accuracy is 3.36 percentage points. At 90/10 the text's "nearly doubled" loss and "4%" drop hold against Libssh at 80/20 (1.72× and 4.63 points); against Meltdown at the same split, the loss ratio is 5.33× and the gap 6.87 points. The authors read the 90/10 result as over-training that the in-distribution test does not reveal, which is a useful warning for anyone choosing a split by held-out accuracy alone. Two test binaries confirm the direction of the gate, not its calibration.
</div>

## What the paper found

<div data-levels="public" markdown="1">
- A quick look at a program's structure, without running the model, predicted whether @DisCo would read it well.
- Libssh, a networking library, was predicted to suit @DisCo, and @DisCo named up to 72% of its functions correctly.
- TRISIS, malware that attacks industrial safety systems, was predicted not to suit it, and @DisCo named none of its functions correctly.
- A check like this lets a system refuse unsuitable data and say why, instead of giving a confident wrong answer.
</div>

<div data-levels="hs" markdown="1">
- @DisCo learned from 61 Meltdown samples; on held-out Meltdown data it matched 514 of 831 functions strongly (above 0.95), 187 weakly, and 130 not at all.
- Functions with fewer than three blocks made up 82.71% of Libssh and 69.71% of TRISIS (sums of Figure 3's first three rows).
- The suitability scores were 97.12% for Libssh and 2% for TRISIS.
- With every function kept, Libssh accuracy ran from 64% to 72% depending on the training split; TRISIS accuracy was 0% at every split.
- Keeping only functions seen at least seven times, Libssh accuracy ran from 84% to 89%, within two to seven points of Meltdown's own.
</div>

<div data-levels="ug grad res" markdown="1">
- **Training check.** 831 held-out Meltdown embeddings: 514 above 0.95, 187 from 0.85 to 0.95, 130 below; 13 above 0.9999 (Figure 1).
- **Structure.** Libssh: 8 libraries, 10,981 functions, 66,162 blocks. TRISIS: one library, 175 functions, 825 blocks (Table II).
- **Suitability factors.** Functions with fewer than three blocks and anonymous functions are undesirable (Figure 3); suitability 97.12% for Libssh and 2% for TRISIS (Figure 4).
- **Outcome, minimum copies zero.** Libssh accuracy 0.7153, 0.6427, and 0.7062 at 70/30, 80/20, and 90/10; TRISIS 0 at every split, loss 43.80 to 54.61 (Table III).
- **Outcome, minimum copies seven.** Meltdown accuracy 0.9085 to 0.9121; Libssh 0.8417 to 0.8880, loss 0.65 to 1.12; TRISIS insufficient data (Table IV).
</div>

## Why it matters

<div data-levels="public hs" markdown="1">
Software that learns from examples is increasingly used to inspect other software, including the code that runs power plants and factories. A model that answers every question, whether or not it was built for it, can mislead the people who rely on it. This paper shows a simple habit that guards against that: before the model reads anything, check whether the input looks like what the model learned from, and if it does not, say so plainly. Ultimately, a model that can explain why it will not answer earns more trust than one that always answers.
</div>

<div data-levels="ug" markdown="1">
Most machine learning deployments validate the model and assume the inputs. This work validates the inputs against the model: it uses domain knowledge (wrapper functions and empty functions carry little signal) and the graph structure @DisCo already stores to set boundaries before inference. The statistics come from simple graph queries, so the check runs in seconds even on large binary collections, and its output is an explanation a stakeholder can read: "most of this binary's functions are too small to name."
</div>

<div data-levels="grad res" markdown="1">
The contribution is a pattern for model-specific out-of-distribution gating that stays interpretable: features of the input's structure, chosen with domain knowledge, are mapped to a decision with a stated rule, and the rule's prediction is checked against model performance. The paper connects this to underspecification, data shift, and concept drift, and to the security argument that most attacks on deployed models arrive through their inputs. The evidence is a single case study with two test binaries, so the next steps are the ones the method invites: a written score formula, the joint statistics behind it, and calibration across many binaries and model families.
</div>

<div data-levels="res" markdown="1">
## Notes from building this page

- **The score's formula.** Section IV-C states a two-branch rule (most named functions removed means ill-suited; most anonymous functions removed means well-fit) and Figure 4 prints scores, but no formula links them. The page's reading (the share that decides the branch) reproduces both printed values exactly, with 7,625 of 7,851 anonymous Libssh functions removed and two of 85 named TRISIS functions kept. Other readings may fit as well; one plausible alternative, the named share of the kept functions, fits TRISIS (one of 53 kept, 1.9%) but gives no integer count that rounds to 97.12% for Libssh (1,898 or 1,899 kept).
- **Joint counts.** Figure 3 prints the block-count distribution and the named share separately. The verdict depends on how they overlap, and the printed marginals allow either verdict for TRISIS and an undecided case for Libssh (ranges in the demo text). Publishing the two-by-two table would make the gate reproducible.
- **Integer recovery.** Every Figure 3 percentage matches a whole number of functions out of Table II's totals. TRISIS's counts are unique; Libssh has four block vectors and eleven named counts consistent with one-decimal rounding, and all 44 combinations give the same 226 anonymous functions kept under the page's reading.
- **Figure 2's library panel.** Features per block × blocks and features per function × functions agree for both binaries; features per library × libraries is about half of both. The factor is about two for both binaries, which points to a definitional difference not described in the text.
- **Table II features.** Blocks and feature nodes are equal for both binaries (66,162 and 825), which fits one feature node per block; Figure 2 counts VEX features within those nodes, so "features" means two different things in adjacent displays.
- **Minimum copies.** The text calls zero "the largest number of copies that still allows TRISIS data" and seven the largest that allows Libssh, but Figure 5 shows only 0, 7, 30, and 439, so the largest values are not shown directly. Meltdown keeps one class at 439 copies, more than its 61 libraries, so copies count repeats across all functions, not one per library as the "61 chances" sentence suggests.
- **Text against Table IV.** "Nearly doubled" (1.72×) and "dropped 4%" (4.63 points) compare Libssh at 90/10 with Libssh at 80/20; "3%" and "2%" compare Libssh with Meltdown and are percentage points (3.36 and 2.05).
- **Validation size.** The gate's predictions are checked on two binaries chosen in advance to be a good fit and a poor fit, which confirms the direction of the call; thresholds such as "fewer than three blocks" and "majority" are not tuned or tested on other binaries.
</div>

<div data-levels="hs" markdown="1">
## Try this in class

1. In the first demo, record the share of Libssh and TRISIS functions removed at cutoffs of one through six blocks, and graph both. Explain why the Libssh line jumps between one and two and then barely moves.
2. In the match demo, find the strong threshold that splits the 831 functions exactly in half. Discuss what a team would gain and lose by trusting only matches above that line.
3. Write a short rule, in your own words, that decides whether a model should answer a question it was not trained for. Test it on an example from your own life, such as a spell checker reading a different language.
</div>

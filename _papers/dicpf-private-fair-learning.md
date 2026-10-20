---
title: "Fair Without Asking: A Model That Never Sees the Private Column"
kicker: "Interactive paper · IEEE IJCNN 2021"
subtitle: "An interactive companion to Hui Hu, Mike Borowczak, and Zhengzhang Chen's DicPF, a framework in which local agents keep a sensitive attribute to themselves and send a modeler only the building blocks that pass a fairness test."
description: "Filter three agents' dictionaries by their covariance with a private attribute, train the paper's z-Sparse Fair Learner on the atoms that pass, sweep the fairness threshold, run the paper's genetic-algorithm inference attack, and compare the eleven methods of Tables III to V, all on the authors' Communities and Crime files."
share_description: "Can a model be checked for fairness by people who never share the sensitive data? DicPF keeps that data with local agents and sends only fair building blocks. Train it and attack it in your browser, written for five reading levels."
share_text: "A fair model built without collecting the sensitive data: DicPF keeps it with local agents. Train it and attack it in your browser:"
share_image: /papers/dicpf-private-fair-learning/share.png
share_image_alt: "Bars showing how strongly each of 297 dictionary atoms from three local agents tracks a private attribute, with the 76 atoms under the threshold highlighted, next to the title Fair Without Asking."
date: 2026-10-20
topics: ["AI & machine learning"]
default_level: public
level_hints:
  public: No background needed
  hs: Averages, percentages, and a little algebra
  ug: Programming, linear regression, and an introduction to machine learning
  grad: Statistics, sparse models, and fairness metrics
  res: Full method, reproduction, and open questions
authors:
  - name: Hui Hu
    affiliation: University of Wyoming
  - name: Mike Borowczak
    affiliation: University of Wyoming
    member: mike-borowczak
  - name: Zhengzhang Chen
    affiliation: Northwestern University
sources:
  - venue: "IEEE IJCNN 2021 · pp. 1–9"
    title: "Privacy-Preserving Fair Machine Learning Without Collecting Sensitive Demographic Data"
    url: https://doi.org/10.1109/IJCNN52387.2021.9534017
    access: Paywalled (IEEE)
code:
  label: "Authors' code (HuiHu1/Privacy-Preserving-Fair-Learning) and data (uwyomachinelearning/datasets)"
  url: https://github.com/HuiHu1/Privacy-Preserving-Fair-Learning
citations:
  - "9534017"
widget:
  css:
    - /papers/dicpf-private-fair-learning/widget.css
  js:
    - /papers/dicpf-private-fair-learning/dicpf-engine.js
    - /papers/dicpf-private-fair-learning/widget.js
credit: "Interactive page by the [DRACO Lab](/). The data are the authors' preprocessed Communities and Crime files ([uwyomachinelearning/datasets](https://github.com/uwyomachinelearning/datasets), from the UCI Machine Learning Repository, CC BY 4.0) with their 50 published shuffles. Each agent's dictionary was learned by the authors' own `dic_learning.py`, run unchanged except for using the 99 model features. The browser learner matches a line-by-line Python transliteration of the authors' `Sparsemodel.m` on 10 of 10 trials (same error and parity, coefficients within 2 × 10⁻¹⁴), its atom filter agrees with NumPy on 297 of 297 atoms, and run to convergence it reaches scikit-learn's lasso optimum on four configurations; the attack matches a transliteration of the authors' `Infer.m` draw for draw on three runs. From the paper, the page reproduces the data set (1,993 communities, 101 attributes, a 1,493 and 500 split), the privacy loss below 0.6 on Crime, and the 35.59 and 4.60 percent comparisons; Table III's z-Sparse row does not reproduce from the released files (see the researcher notes). Everything runs on your device."
bibtex: |
  @inproceedings{hu2021dicpf,
    author    = {Hu, Hui and Borowczak, Mike and Chen, Zhengzhang},
    title     = {Privacy-Preserving Fair Machine Learning Without Collecting Sensitive Demographic Data},
    booktitle = {2021 International Joint Conference on Neural Networks (IJCNN)},
    pages     = {1--9},
    year      = {2021},
    doi       = {10.1109/IJCNN52387.2021.9534017}
  }
---

<div class="lede" data-levels="public" markdown="1">
To check whether a computer model treats groups of people fairly, someone usually has to know which group each person belongs to. Privacy laws increasingly forbid collecting that information. Hui Hu, Mike Borowczak, and Zhengzhang Chen proposed DicPF, a way around the conflict: several local offices each keep their own private records, build a set of mathematical building blocks from them, test each block against the private information only they hold, and send the central modeler the blocks that pass. The modeler builds its model from those blocks and never sees the private column. This page rebuilds the method on the authors' own data, a table of 1,993 United States communities, and lets you train it and attack it.
</div>

<div class="lede" data-levels="hs" markdown="1">
The paper's main data set describes 1,993 communities with 100 numbers each (income, housing, family size, and so on) and asks a model to predict whether a community has a high violent-crime rate. The private column marks the 243 communities in which at least half of residents are Black. A model is called fair here if it flags both groups as "high crime" at about the same rate; the gap between the two rates is the **statistical parity**. DicPF lets three local "agents" hold the private column and still help the modeler build a model with a small gap.
</div>

<div class="lede" data-levels="ug" markdown="1">
DicPF (Algorithm 1) splits fair learning between r local agents, which hold a sensitive attribute s, and a modeler, which holds only the non-sensitive features X and labels Y. Each agent learns an accurate dictionary by sparse coding (Eq. 1), keeps the atoms d whose predictions satisfy \|cov(d(x), s)\| ≤ ρ, and sends them; the modeler fits a sparse linear model on the aggregated dictionary by lasso coordinate descent (Eq. 4 to 9). The paper reports the lowest statistical parity of 11 methods on two of its three data sets (0.0189 on Community Crime), a genetic-algorithm inference attack that recovers s at below 0.6, and bounds on fairness and accuracy. The page runs the authors' pipeline on their files.
</div>

<div class="lede" data-levels="grad" markdown="1">
Hu, Borowczak, and Chen remove the modeler's access to demographic data entirely: r agents each learn a K-SVD dictionary on their own rows, release only ρ-fair atoms (Definition 2), and the modeler solves an ℓ₁-penalized least-squares problem in the span of the aggregated dictionary (the z-Sparse Fair Learner). Lemma 5 and Theorem 6 bound cov[f_z(x), s] by √z‖β_z‖ρ and statistical parity by that bound over p(s = 0)p(s = 1). Table III reports SP 0.0189 ± 0.0151 and error 0.1299 ± 0.0614 on Community Crime over 50 random 75/25 splits, against six non-private and four semi-private baselines. This page reruns the released dictionary script, filter, learner, and attack, and reports what the reproduction finds.
</div>

<div class="lede" data-levels="res" markdown="1">
DicPF (IJCNN 2021) extends the authors' ICDM 2019 distributed fair learning framework, which needed a trusted third party holding s, to r agents that release only dictionary atoms filtered by sample covariance with s. Evaluation: Community Crime (ρ = 0.01), Credit Card (0.1), and COMPAS (0.25), 50 trials, λ grid-searched on [1, 1000] in steps of 50, 1,500 coordinate-descent iterations; privacy is measured by Eq. 10 under a GA solving Eq. 11. Code and data are public. This page ships the authors' Crime files and 50 shuffles, learns the three dictionaries with their Python script, ports `Sparsemodel.m`, `Cal.m`, and the `Inference/` scripts to JavaScript with draw-for-draw checks, and documents where the released code and the reported results part ways.
</div>

## Three offices, one filter

<div id="dp-filter" class="w-demo"></div>

<div data-levels="public" markdown="1">
Each panel is one local office. Every bar is one of the 99 building blocks that office learned from its 664 community records, and the height shows how closely that block tracks the private column. Blocks under the dashed line pass the test and travel to the modeler, shown in color. Drag the **Strictness** slider: a stricter test passes fewer blocks, which protects fairness but leaves the modeler less to work with.
</div>

<div data-levels="hs" markdown="1">
A building block turns a community's 99 numbers into one score, a weighted sum. The office computes that score for each of its communities and checks the **covariance** between the score and the private 0 or 1 column: near zero means the score rises and falls with no regard to the group. At the paper's setting, 76 of the 297 blocks pass. The modeler receives only those 76 lists of weights, never the private column.
</div>

<div data-levels="ug grad res" markdown="1">
Each agent's accurate dictionary comes from `dic_learning.py`: the dictionary starts at the left singular vectors of the agent's data, then 1,000 rounds of orthogonal matching pursuit (10 nonzero coefficients per row) and K-SVD atom updates. Step 3 of Algorithm 1 keeps the atoms with \|cov(Xᵢd, sᵢ)\| ≤ ρ, using the sample covariance on the agent's rows. At ρ = 0.01 the three agents keep 24, 27, and 25 atoms (k = 76). The released script gives each agent the first 664 rows of a different shuffle, so the three agents together cover 1,400 distinct communities, and 72 communities belong to all three.
</div>

## Training the modeler

<div id="dp-train" class="w-demo"></div>

<div data-levels="public" markdown="1">
Press **Train the modeler**. Your browser trains 50 models on the blocks that passed, each on a different random three quarters of the communities, and tests each on the rest. Each dot is one model: further right means a bigger gap between the two groups, higher means more mistakes. The square marks the paper's result. The bars under the chart show the catch. In the test communities, high-crime labels are far more common in the mostly Black group, so a model can close the gap only by flagging almost no one, which is what this model learns to do.
</div>

<div data-levels="hs" markdown="1">
The dashed line is the simplest possible rule: call every community "not high crime." That rule is wrong for the 14.4 percent of test communities that do have high crime and has a gap of exactly zero. On the authors' files, at the paper's settings, this page's model lands on that rule in 49 of 50 tries. The paper's model sits slightly below the line (13.0 percent wrong) with a gap of 1.9 percent.
</div>

<div data-levels="ug" markdown="1">
Each trial follows `Sparsemodel.m`: random initial coefficients on (0, 1), 1,500 coordinate-descent steps of Eq. 9 with λ = 50, then a prediction of 1 wherever \|f(x)\| ≥ 0.5. The model has no intercept, and the label is 1 for 14.5 percent of communities. **As described** updates a randomly chosen coefficient at every step, as Section V states. **Released code** follows the MATLAB script as written: after the first step, the line `[row column]=size(prediction_label)` resets `column` to 1, so every later step updates coefficient 1 and the other 75 keep their random starting values. Neither mode reproduces Table III.
</div>

<div data-levels="grad res" markdown="1">
At ρ = 0.01 and λ = 50 the browser gives SP 0.0004 ± 0.0026 and error 0.1444 ± 0.0122 as described (49 of 50 models predict 0 everywhere) and SP 0.0633 ± 0.0518 and error 0.7301 ± 0.0504 under the released code, against the paper's 0.0189 ± 0.0151 and 0.1299 ± 0.0614. The all-zero rule scores error 0.1441 ± 0.0120 on the same 50 test sets. Smaller penalties trade parity for error: λ = 10 with 30,000 steps gives SP 0.0111 and error 0.1413; λ = 1 gives 0.2902 and 0.1168. No setting the page tried reaches both of the paper's values on these dictionaries. Base rates explain the pressure: 141 of 243 minority communities (58.0 percent) carry the high-crime label, against 148 of 1,750 (8.5 percent) of the rest.
</div>

## Strict or loose

<div id="dp-sweep" class="w-demo"></div>

<div data-levels="public" markdown="1">
Press **Sweep the threshold** to train models at 13 settings, from the strictest test to no test at all. The gray bars count the blocks that pass. With a strict test the gap stays near zero; as the test loosens, more blocks pass and the gap grows. On this data, mistakes grow too, because the model has 1,500 small adjustments to spend on more and more blocks.
</div>

<div data-levels="hs ug" markdown="1">
The paper's Theorem 6 says the gap shrinks as the threshold ρ shrinks or as the model uses fewer blocks. The sweep shows the first half of that statement directly. The error curve rises at loose thresholds because each training run makes only 1,500 updates, so with 297 blocks each coefficient receives about five updates, and a few receive none and keep their random starting values.
</div>

<div data-levels="grad res" markdown="1">
Twenty trials per threshold. As described, SP stays at or below 0.01 through ρ = 0.015 and rises to 0.12 at ρ = 0.03 (k = 135) and 0.18 at ρ = 0.05; with no filter (k = 297) SP is 0.12 and error 0.46. Under the released code, error rises from 0.28 at ρ = 0.001 (k = 46) to 0.74 at ρ = 0.01 and 0.83 with no filter, since more atoms with random positive weights push more scores past \|f\| ≥ 0.5. Run to convergence, the same learner reaches scikit-learn's lasso optimum (objective within 10⁻⁸), so the curve reflects the 1,500-step budget and the missing intercept as much as the filter.
</div>

## Can the modeler guess the private column?

<div id="dp-attack" class="w-demo"></div>

<div data-levels="public" markdown="1">
A modeler who wanted to misuse the system might try to work backward from the model's answers to the private column. The paper tests this with a search that guesses, for every community, whether it is mostly Black, choosing the guesses that make the model look most even-handed. Press **Run the attack**. The attack scores about 50 percent, as the paper reports. The second bar is a fair comparison: because most communities are in the larger group, a lazy guess that no community is mostly Black is right 87.8 percent of the time.
</div>

<div data-levels="hs" markdown="1">
The attack is a **genetic algorithm**: it starts with 200 random guesses at the 0 or 1 column, mixes and mutates them, and keeps the ones under which the model's two groups get flagged at the most similar rates. Its score is the share of communities it labels correctly. A coin flip scores 50 percent; always answering "no" scores 87.8 percent here, because only 243 of 1,993 communities are mostly Black.
</div>

<div data-levels="ug" markdown="1">
The port follows `Infer.m` with population 200, crossover rate 0.1, mutation rate 0.01, rank selection, and 500 generations, scoring the recorded best individual by Eq. 10 (accuracy of the inferred s). `Infer.m` calls the released `Sparsemodel`, so the attacked predictions come from the released-code model trained on the first shuffle and applied to all 1,993 communities. The learner as described would leave the attack nothing to work with at ρ = 0.01: it predicts 0 everywhere, every candidate column then has SP 0, and `Filter.m` discards them all.
</div>

<div data-levels="grad res" markdown="1">
The privacy loss lands near 0.50 for every model the page tried (0.5017 ± 0.0127 over 20 runs on the released-code model, 0.5017 at λ = 10, 0.5036 at ρ = 0.03), below the paper's 0.6, as Figure 2 states. Eq. 11 has many minimizers unrelated to s, and Selection.m keeps 80 percent each generation, so the population falls to two individuals within 20 generations; the reported score is that of a nearly random column. A baseline that uses no model at all does far better: one of the modeler's own public features, racePctWhite below 0.5, matches s for 92.3 percent of communities. The page computes these comparisons; the paper does not report them.
</div>

## Eleven methods, three data sets

<div id="dp-tables" class="w-demo"></div>

<div data-levels="public hs" markdown="1">
These are the paper's own results for all 11 methods it compared, on three data sets: communities and crime, credit-card defaults, and repeat offenses (COMPAS). The square marker is DicPF's learner. Further left is fairer, lower is more accurate. On two of the three data sets the square sits furthest left, and on the third it is third from the left, with a small cost in accuracy.
</div>

<div data-levels="ug grad res" markdown="1">
Values as printed in Tables III to V. Non-private methods (FRR, FKR, FGR, two fair PCAs, and LFR) read s directly; semi-private methods (DFRR, DFKRR, DFGR, and DFPCA, from the authors' ICDM 2019 framework) send predictions to a trusted third party that holds s; z-Sparse never exchanges information with the holders of s. z-Sparse ranks first on SP on Crime and Credit and third on COMPAS (behind DFKRR's 0.0034 and FKR's 0.0041); its error sits 0.024 above the lowest error on Crime, 0.057 on Credit, and 0.019 on COMPAS. The 30 baseline entries match the corresponding SP and error columns of the ICDM 2019 paper's Tables I to III exactly.
</div>

## What the paper found

<div data-levels="public" markdown="1">
- A model can be trained for fairness without anyone collecting the sensitive information in one place: local offices keep it and send only building blocks that pass a fairness test.
- On three public data sets, the paper's model had the smallest gap between groups among 11 methods on two and the third-smallest on the third.
- The fairness came with a small loss in accuracy; on the credit data, the gap fell by 35.59 percent while mistakes rose by 4.60 percent against the authors' earlier DFRR method.
- A search that tried to reconstruct the private information from the model guessed right less than 60 percent of the time.
</div>

<div data-levels="hs" markdown="1">
- On communities and crime, the model's gap was 0.0189 (1.9 percentage points) with 13.0 percent of communities labeled wrong.
- On credit-card defaults the gap was 0.0076 with 23.9 percent wrong; on COMPAS, 0.0067 with 23.4 percent wrong.
- Against DFRR, the authors' earlier method that needs a trusted third party, the gap fell from 0.0466 to 0.0189, from 0.0118 to 0.0076, and from 0.0078 to 0.0067.
- Using fewer building blocks made the model fairer, as the theory predicts.
</div>

<div data-levels="ug grad res" markdown="1">
- **No sensitive data at the modeler.** The modeler receives only ρ-fair atoms and trains on public features and labels (Algorithm 1).
- **Lowest or near-lowest parity.** z-Sparse reports SP 0.0189, 0.0076, and 0.0067 on Crime, Credit, and COMPAS, with errors of 0.1299, 0.2388, and 0.2337 (Tables III to V).
- **A stated trade-off.** On Credit, SP falls 35.59 percent and error rises 4.60 percent relative to DFRR; both percentages recompute exactly from the printed values.
- **Inference resistance.** The GA attack's privacy loss stays below 0.6 on Crime and Credit, against 1 for non-private and above 0.6 for semi-private models (Figure 2); fair dictionaries leak slightly more than accurate ones (Figure 3).
- **Bounds.** SP(f_z) ≤ t√z‖β_z‖ with t = ρ/p(s = 0)p(s = 1) (Theorem 6), and a prediction-error bound tied to the dictionary (Theorem 9); Figures 4 and 5 show SP falling with smaller z and rising with larger k.
</div>

<div data-levels="grad res" markdown="1">
<p class="w-note">Table III as printed (Community Crime, 50 trials) beside this page's runs on the authors' files at ρ = 0.01 and λ = 50.</p>
<div class="dp-wrap-table">
<table class="results-table dp-num">
<thead><tr><th>Method</th><th>Access to s</th><th>Statistical parity</th><th>Classifier error</th></tr></thead>
<tbody>
<tr><td>FRR</td><td>Non-private</td><td>.3062 ± .0452</td><td>.1102 ± .0128</td></tr>
<tr><td>FKR</td><td>Non-private</td><td>.0968 ± .0722</td><td>.1208 ± .0054</td></tr>
<tr><td>FGR</td><td>Non-private</td><td>.0898 ± .0971</td><td>.1166 ± .0189</td></tr>
<tr><td>FPCA1</td><td>Non-private</td><td>.0859 ± .0479</td><td>.1731 ± .0089</td></tr>
<tr><td>FPCA2</td><td>Non-private</td><td>.0755 ± .0293</td><td>.1476 ± .0122</td></tr>
<tr><td>LFR</td><td>Non-private</td><td>.0738 ± .0377</td><td>.1264 ± .0068</td></tr>
<tr><td>DFRR</td><td>Semi-private</td><td>.0466 ± .0117</td><td>.1064 ± .0092</td></tr>
<tr><td>DFKRR</td><td>Semi-private</td><td>.0695 ± .0181</td><td>.1216 ± .0143</td></tr>
<tr><td>DFGR</td><td>Semi-private</td><td>.0650 ± .0198</td><td>.1202 ± .0690</td></tr>
<tr><td>DFPCA</td><td>Semi-private</td><td>.0289 ± .0502</td><td>.1351 ± .0111</td></tr>
<tr><td>z-Sparse Fair Learner</td><td>Private</td><td>.0189 ± .0151</td><td>.1299 ± .0614</td></tr>
<tr class="dp-current"><td>z-Sparse, this page, as described</td><td>Private</td><td>.0004 ± .0026</td><td>.1444 ± .0122</td></tr>
<tr class="dp-current"><td>z-Sparse, this page, released code</td><td>Private</td><td>.0633 ± .0518</td><td>.7301 ± .0504</td></tr>
<tr class="dp-current"><td>Always "not high crime," this page</td><td>None</td><td>.0000</td><td>.1441 ± .0120</td></tr>
</tbody>
</table>
</div>
</div>

## Why it matters

<div data-levels="public hs" markdown="1">
Hospitals, banks, and city agencies are increasingly told both to prove that their models treat groups fairly and to stop collecting the data that proof needs. DicPF offers a design in which the sensitive information stays where it was collected and only a filtered summary travels. The demos above also show what makes the problem hard: when the outcome itself differs a great deal between groups, the easiest fair answer is to stop predicting, so a fairness number always needs an accuracy number and a simple baseline beside it. Ultimately, the paper moves the question from whether fair learning needs sensitive data to how little of it, and in what form, a modeler needs to see.
</div>

<div data-levels="ug" markdown="1">
The design moves the sensitive computation to the data holders and reduces what crosses the boundary to a set of vectors in feature space, from K-SVD dictionaries to any basis a holder can test locally. The same pattern fits federated settings at the edge, where each site holds its own demographic records, and it complements the lab's other privacy work, such as [TP-NET](/papers/tp-net-privacy/), which hides a network's structure from a power probe. The reproduction adds a practical lesson for anyone adopting the method: report the trivial classifier's error and parity next to the fair model's, because on imbalanced data the two can be nearly the same.
</div>

<div data-levels="grad res" markdown="1">
The contribution is an architecture with formal guarantees: fairness through the covariance filter (Lemma 5, Theorem 6) and accuracy through sparse representation (Lemma 7, Theorem 9), with no channel from s to the modeler except the selection of atoms. The evaluation covers three standard data sets and one attack model. The authors name improving accuracy as next work. The reproduction suggests two more: an attack model that uses the public features and the released atoms, since public features alone predict s at 92 percent here, and an evaluation protocol that fixes the dictionary file, the λ selection, and the stopping rule, so that published parity values can be regenerated from released code.
</div>

<div data-levels="res" markdown="1">
## Notes from building this page

- **The released learner updates one coefficient.** In `Sparsemodel.m`, `[row column]=size(W_fair)` sets `column` = k before the loop, and `[row column]=size(prediction_label)` inside the loop resets it to 1, so `j = randi(column,1,1)` returns 1 from the second step on. The remaining k − 1 coefficients keep their `rand` initial values on (0, 1). The page offers this behavior as **Released code**, and the paper's description as **As described**.
- **Table III does not reproduce.** With dictionaries from the authors' script on the 99 model features, ρ = 0.01, and λ = 50, the page gets SP 0.0004 and error 0.1444 (as described) or 0.0633 and 0.7301 (released code), against 0.0189 and 0.1299. The script that trains the model reads `fair_accurate_dic.csv`, which the repository does not include and `dic_learning.py` does not write; the reported values may come from a dictionary, λ, or code version other than the released ones. The λ grid (1 to 1,000, step 50) is described but not implemented; the script fixes λ = 50.
- **Dictionary width.** `dic_learning.py` uses `data[:,1:-1]`, 100 columns that include column 101, the normalized violent-crime rate from which the label is computed (label = rate ≥ 0.5). `Sparsemodel.m` uses columns 2 to 100 (99 features), so its dictionary must have 99 rows. The page learns on the 99 model features. Learning on all 100 columns and dropping the crime-rate row gives 22, 27, and 21 ρ-fair atoms and does not reproduce Table III either (for example SP 0.142 and error 0.131 at λ = 1).
- **Error against the trivial rule.** The all-zero classifier has SP 0 and error 0.1441 on the 50 test sets. The paper's z-Sparse error (0.1299) is 0.014 below it, and its standard deviation (0.0614) is five times the trivial rule's. On Crime, every reported error in Table III should be read against 0.144.
- **The attack's objective.** Eq. 11 minimizes the statistical parity of the model's predictions over binary s. Any column that splits the flagged communities evenly achieves SP near 0, so the true s has no special status, and a fair model makes that more true. In the released GA, rank selection keeps 80 percent per generation without refilling the population, Mutation.m writes mutated copies over rows 1 to n rather than the mutated row, and `Selection.m` returns `value(idx(1:p_num))`, re-indexing already sorted values. The recorded best individual in the page's runs comes from the first generation. A privacy loss near 0.5 is therefore what the attack returns for any model, which bounds what Figure 2 can show.
- **Stronger baselines for privacy.** Always guessing s = 0 scores 0.878, and thresholding the public feature racePctWhite at 0.5 scores 0.923. The public features also include racePctAsian and racePctHisp. Both baselines are computed by this page.
- **Agent rows overlap.** Each agent takes rows 1 to 664 of a different shuffle (`start = 0`; the comment beside it suggests `int(1/num*n)+1`), so the agents share data: 1,400 distinct communities in all, 72 in all three. The paper describes a random split into three parts.
- **Threshold on s.** The sensitive flag is racepctblack ≥ 0.5 (five communities sit at exactly 0.50), where the paper and the ICDM paper say "greater than 0.5."
- **Prediction rule.** Predictions use \|f(x)\| ≥ 0.5, so a large negative score counts as a positive prediction; with no intercept, the fitted function must absorb the 14.5 percent base rate.
- **Baseline rows.** All 30 baseline entries in Tables III to V equal the SP and error columns of Hu, Liu, Wang, and Lan (ICDM 2019), Tables I to III, which fits the stated reuse of default hyperparameters and points to a shared evaluation.
- **What the page does not cover.** Credit Card and COMPAS: the authors publish both, but the Credit index file is 308 MB, and the page keeps to the data set on which the method's ρ and the attack are both reported. Figures 3 to 5 report curves without printed values.
</div>

<div data-levels="hs" markdown="1">
## Try this in class

1. In the filter demo, set the slider to the paper's value (0.01) and count the blocks that pass in each office. Then find the strictest setting at which every office still sends at least one block, and record how many pass.
2. Train the modeler at the paper's setting. Using the bars under the chart, compute the gap between the two groups' "flagged" rates yourself and compare it with the dashed-line rule that flags no one. Write two sentences on why a fairness score needs an accuracy score beside it.
3. Run the attack. Then compute, from the numbers on the page, the score of a guess that no community is mostly Black (1,750 of 1,993). Explain which of the two numbers is the better test of whether the private column is safe.
</div>

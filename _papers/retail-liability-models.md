---
title: "Scoring Cashier Risk: Eight Models and a Map of 28 Numbers"
kicker: "Interactive paper · ICIAI 2018"
subtitle: "An interactive companion to Richard R. Yang and Mike Borowczak's study of a retail chain's cashier records, which trains eight machine learning models to reproduce an analyst's risk score, trims 28 features down to two, and flattens the rest into maps a store manager can read."
description: "Guess a cashier's risk score from its nearest neighbors, train the paper's eight regressors side by side in your browser, check that the paper's own Table 1 points to a single test group, eliminate features one at a time down to two, and rebuild the PCA and t-SNE maps the paper scored with silhouettes, all on a simulated chain with the study's shape."
share_description: "A retailer's analysts hand-tune a risk score for every cashier. Eight models learn it from 28 numbers, and two maps show the pattern to a manager. Train the paper's eight models and draw its t-SNE maps in your browser, written for five reading levels."
share_text: "Eight models learn a retailer's cashier risk score from 28 numbers. Train them and draw the maps in your browser:"
share_image: /papers/retail-liability-models/share.png
share_image_alt: "Eight horizontal bars of the paper's Table 1 R² values, from 0.1776 for the linear SVR to 0.6328 for the RBF SVR, beside the title Scoring Cashier Risk."
date: 2026-10-20
topics: ["AI & machine learning"]
default_level: public
level_hints:
  public: No background needed
  hs: Averages, error, and a little algebra
  ug: Programming, regression, and an introduction to machine learning
  grad: Statistics, regularization, kernels, and embeddings
  res: Full method, reproduction, and open questions
authors:
  - name: Richard R. Yang
    affiliation: Stanford University (work completed at the University of Wyoming)
  - name: Mike Borowczak
    affiliation: University of Wyoming
    member: mike-borowczak
sources:
  - venue: "ICIAI 2018 · ACM · pp. 186–190"
    title: "Predictive Liability Models and Visualizations of High Dimensional Retail Employee Data"
    url: https://doi.org/10.1145/3194206.3195587
    access: Free to read (ACM Digital Library)
  - venue: "arXiv 1707.04639v3 · 2018"
    title: "Predictive Liability Models and Visualizations of High Dimensional Retail Employee Data"
    url: https://arxiv.org/abs/1707.04639
    access: Open access (arXiv preprint)
code:
  label: "No public code or data; this page's engine (liability-engine.js)"
  url: https://github.com/ucf-draco-lab/draco-website/blob/main/papers/retail-liability-models/liability-engine.js
citations:
  - "Yang:2018:PLM:3194206.3195587"
widget:
  css:
    - /papers/retail-liability-models/widget.css
  js:
    - /papers/retail-liability-models/liability-engine.js
    - /papers/retail-liability-models/widget.js
credit: "Interactive page by the [DRACO Lab](/). The retailer's 991-row cashier table is private, so every cashier on this page comes from a simulated chain with the study's shape (991 rows, ten regions, 28 features, a risk factor on the paper's 4-to-16 scale); the paper's numbers are reported from the paper. The browser engine ports the scikit-learn pipeline the authors used and was checked against scikit-learn 1.9.1 on three simulated chains: the decision tree and the 10-tree random forest give identical predictions and importances (the port follows scikit-learn's float32 splitter, its xorshift feature order, and numpy's MT19937 bootstrap seeds), k nearest neighbors is identical, least squares, ridge, and lasso agree to within 2 × 10⁻¹³, both support vector regressions (a port of libsvm's solver) to within 3 × 10⁻¹¹, recursive feature elimination keeps the same two features with the same full ranking in all nine runs, and PCA, k-means, and the silhouette agree to within 10⁻¹³. Exact t-SNE follows scikit-learn's schedule step for step (within 10⁻¹³ after five iterations), until floating-point round-off grows chaotically. From the paper, the page reproduces Table 1's internal arithmetic: all eight error rows imply one test group with variance 2.1642 to 2.1646, and R² rebuilt from MSE matches every printed R² to within 0.00022. Everything runs on your device."
bibtex: |
  @inproceedings{yang2018liability,
    author    = {Yang, Richard R. and Borowczak, Mike},
    title     = {Predictive Liability Models and Visualizations of High Dimensional Retail Employee Data},
    booktitle = {Proceedings of the 2nd International Conference on Innovation in Artificial Intelligence (ICIAI '18)},
    pages     = {186--190},
    year      = {2018},
    publisher = {ACM},
    address   = {Shanghai, China},
    doi       = {10.1145/3194206.3195587}
  }

  @misc{yang2017liabilityarxiv,
    author        = {Yang, Richard R. and Borowczak, Mike},
    title         = {Predictive Liability Models and Visualizations of High Dimensional Retail Employee Data},
    year          = {2017},
    eprint        = {1707.04639},
    archivePrefix = {arXiv},
    primaryClass  = {cs.LG}
  }
---

<div class="lede" data-levels="public" markdown="1">
Retailers lose billions of dollars a year to theft, dishonesty, and accounting errors (an estimated $44 billion in the United States in 2016), and experts attribute most of that loss to employees. One large chain paid a consulting firm to score each cashier's risk through a hand-tuned weighting of the cashier's records. Richard R. Yang and Mike Borowczak, at the University of Wyoming, asked whether a computer could learn that score from the same numbers, and whether a manager could see the patterns at a glance. This page rebuilds their study on a simulated store chain, because the real cashier records are private, and lets you try each step yourself.
</div>

<div class="lede" data-levels="hs" markdown="1">
The study had 991 cashiers from ten regions. For each one the retailer recorded 28 numbers (sales per day, items rung up, refunds, voids, and more) and a risk factor from 4 to 16 that analysts assigned. The authors trained eight different prediction methods on 90 percent of the cashiers and tested them on the other 10 percent. The best one missed the analysts' score by 0.68 points on average. They then asked which two of the 28 numbers mattered most, and drew the cashiers on maps where similar cashiers sit close together.
</div>

<div class="lede" data-levels="ug" markdown="1">
The paper is a supervised regression study on a 991 × 28 table with a hand-assigned target. After standardizing the features and holding out 10 percent, the authors fit k nearest neighbors (KNN), ordinary least squares, lasso, ridge, support vector regression (SVR) with linear and radial basis function (RBF) kernels, a decision tree, and a random forest in scikit-learn, and report mean absolute error (MAE), mean squared error (MSE), and R². The RBF SVR led (MAE 0.6816, R² 0.6328). Recursive feature elimination (RFE) then reduced the features to two, and principal component analysis (PCA) and t-distributed stochastic neighbor embedding (t-SNE) produced two-dimensional maps scored by the silhouette of a two-cluster k-means split.
</div>

<div class="lede" data-levels="grad" markdown="1">
Yang and Borowczak frame loss prevention as learning a consultant's hand-tuned risk function from 28 cashier activity features (991 cashiers, ten regions). Table 1 compares eight scikit-learn regressors on a 90/10 split; the RBF SVR (R² 0.6328) and random forest (0.5776) beat every linear model (0.1776 to 0.4178), which the authors attribute to nonlinearity. Feature importance comes from standardized coefficients and from RFE down to two features; interpretability comes from PCA and a log-scale t-SNE grid search scored by the silhouette at k = 2, the best k for k-means on the full data. This page ports the whole pipeline, verifies it against scikit-learn, and runs it on simulated cashiers.
</div>

<div class="lede" data-levels="res" markdown="1">
Yang and Borowczak (ICIAI 2018; arXiv 1707.04639v3) report one 90/10 split, eight regressors with unreported hyperparameters except that k and α were tuned, coefficient and RFE feature rankings, and silhouettes for seven two-dimensional views (Table 2). No code or data are public. This page ports every step to JavaScript against scikit-learn 1.9.1 (exact for the tree and forest, including their random streams), substitutes a simulated chain for the private table, and checks the paper's tables against themselves: Table 1's eight (MSE, R²) pairs imply a single test-set variance, which fixes the spread of the hidden test group. The researcher notes list where the printed method and the tables leave room for interpretation, including a t-SNE setting that never leaves early exaggeration.
</div>

## Ask the neighbors

<div id="rl-neighbors" class="w-demo"></div>

<div data-levels="public" markdown="1">
The simplest of the paper's eight methods guesses a cashier's risk by finding the cashiers whose numbers look most like theirs and averaging those cashiers' scores. Press **Next unseen cashier** to try it on someone the method never saw, or click anywhere on the chart to invent a cashier with that many refunds and voids. Moving the slider changes how many neighbors get a vote. A few neighbors give a jumpy guess; many neighbors give a cautious one that drifts toward the average.
</div>

<div data-levels="hs" markdown="1">
"Nearest" means the smallest distance. With two numbers, the distance between cashiers *a* and *b* is √((*x*ₐ − *x*_b)² + (*y*ₐ − *y*_b)²), after each number is rescaled so that refunds and voids count equally. On the default simulated chain, five neighbors chosen by refunds and voids alone miss the analyst's score by 0.87 points on average over 100 unseen cashiers; five neighbors chosen by all 28 numbers miss by 0.58. More information about each cashier finds better neighbors, even though you can no longer see them on a flat chart.
</div>

<div data-levels="ug" markdown="1">
KNN regression stores the training set and predicts the mean target of the *k* closest training rows under Euclidean distance. Standardization (zero mean, unit variance per column) matters here: without it, the dollar-valued "Department Sales Total Amount" would dominate every distance. The paper notes the rule of thumb *k* ≈ √28 ≈ 5 and tuned *k*, but does not print its choice; the page starts at five, the scikit-learn default. The page's KNN matches scikit-learn's `KNeighborsRegressor` exactly.
</div>

<div data-levels="grad res" markdown="1">
With 28 standardized features, nearest-neighbor distances concentrate, so the gain from 0.87 to 0.58 MAE on the simulated chain reflects how much of the simulated risk depends on features beyond refunds and voids. The paper's KNN reached MAE 0.8455 and R² 0.458 on the retailer's data, between the linear models and the two nonlinear leaders. The two-number mode on this page is a teaching device; every model in the next demo uses all 28 features, as the paper's do.
</div>

## Eight ways to learn a risk score

<div id="rl-models" class="w-demo"></div>

<div data-levels="public" markdown="1">
Press **Train all eight models** to teach eight different methods on the simulated chain and test each one on the 100 cashiers it never saw. The table puts the page's results next to the paper's. Lower error is better, and an R² of 1 would mean perfect guesses. Click a row to see that method's guesses against the true scores: dots on the dashed line are exact. In the paper, the best methods were the ones that can bend to follow curved patterns.
</div>

<div data-levels="hs" markdown="1">
MAE is the average size of a miss. MSE averages the squared misses, so one big miss counts more than several small ones. R² compares a model with the laziest possible guess, the average score of the test group: R² = 1 − MSE ÷ (spread of the true scores). In the paper, the RBF support vector regression missed by 0.68 points on average, and its R² of 0.63 means it removed about 63 percent of the spread. Try **Draw another simulated chain** a few times and watch the rankings shift.
</div>

<div data-levels="ug" markdown="1">
The eight models follow scikit-learn's 2018 defaults wherever the paper is silent: KNN with *k* = 5, least squares, lasso and ridge with the page's α values, ε-SVR with *C* = 1, ε = 0.1, and γ = 1/28 (the then-default `gamma="auto"`), a full-depth regression tree, and a random forest of ten trees (the default until scikit-learn 0.22). Training runs in a background worker; the linear-kernel SVR is the slowest, because its solver needs many iterations on 891 rows.
</div>

<div data-levels="grad res" markdown="1">
On the simulated chain KNN, the linear models, both SVRs, and the forest land within 0.05 of each other in R² (0.72 to 0.77), and the single tree trails (0.47), as in the paper. The paper's wide gap between linear (R² ≤ 0.4178) and nonlinear models (0.5776 and 0.6328) is therefore a property of the retailer's data, which this simulation does not try to imitate. One 100-cashier test set also carries sampling error: on the simulated chain, refitting the RBF SVR on 20 different 90/10 splits gives R² from 0.718 to 0.821 (standard deviation 0.034, the page's own computation), so differences of a few hundredths can come from the split alone. The page's solvers match scikit-learn to within 3 × 10⁻¹¹ (SVR) and exactly for the tree and forest.
</div>

## The paper's table checks itself

<div id="rl-check" class="w-demo"></div>

<div data-levels="public" markdown="1">
The retailer's data are private, so nobody outside the study can rerun it. The paper's own table still holds a clue. Every row reports two kinds of error for the same 100 or so test cashiers, and those two numbers together reveal how spread out the test cashiers' true scores were. Each bar on the chart is one row's answer, with a little room for rounding. All eight bars overlap in one narrow band: the table describes one test group, consistently.
</div>

<div data-levels="hs" markdown="1">
Because R² = 1 − MSE ÷ V, where V is the spread (variance) of the true scores, each row can be solved for V = MSE ÷ (1 − R²). For the RBF SVR, 0.7948 ÷ (1 − 0.6328) = 2.1645. Every other row gives a value between 2.1637 and 2.1647, and once rounding is allowed for, all eight agree on V between 2.1642 and 2.1646. The square root, about 1.47, says that the test cashiers' risk scores typically sat about one and a half points from their average.
</div>

<div data-levels="ug" markdown="1">
scikit-learn's `r2_score` is 1 − SS_res ÷ SS_tot, and dividing both sums by *n* gives R² = 1 − MSE ÷ Var(*y*_test). The printed MSE values carry three or four significant figures and R² four decimal places, so each row bounds the variance to an interval; the intersection of all eight is [2.16416, 2.16458]. Switch to **R² rebuilt from MSE** to see each printed R² recomputed from its MSE with that shared variance. A second check holds as well: MAE² never exceeds MSE, as Jensen's inequality requires.
</div>

<div data-levels="grad res" markdown="1">
This is the page's reproduction of a published number: the R² column of Table 1 follows from the MSE column under one test-set variance, to within 0.00022 on every row. It also settles which R² the authors computed. Section 3.1 defines R² as "(1 − Mean Residual Sum of Squares)/MSE", which taken literally does not give these values; the table follows the standard coefficient of determination. The check cannot confirm the MSE values themselves, only that the two columns came from the same test set.
</div>

## Down to two features

<div id="rl-rfe" class="w-demo"></div>

<div data-levels="public" markdown="1">
A store manager cannot read 28 columns for every cashier. The authors asked a model which number it leans on least, removed that number, retrained, and repeated until only two remained. Drag the slider from 28 down to two to watch the list shrink; struck-out rows are gone, and the bars show how much each remaining number matters to the model. The bold rows are the five numbers the paper names. The chart at the bottom places every cashier on the last two numbers standing.
</div>

<div data-levels="hs" markdown="1">
For a linear model the "importance" of a number is the size of its weight in the formula guess = *w*₁*x*₁ + *w*₂*x*₂ + … + *b*, which is fair to compare only because every number was rescaled first. For the random forest, importance measures how much the trees' splits on that number reduce their errors. On the simulated chain all three models end on the same pair, item voids and an unnamed feature, because the simulation builds risk mostly from voids and refunds and ties every unnamed feature to the same hidden habit.
</div>

<div data-levels="ug" markdown="1">
RFE with `step=1` fits the estimator, drops the feature with the smallest |coefficient| (linear models) or impurity importance (forest), and refits, 26 times here. The paper ran it with linear regression, the SVR, and the random forest; RFE needs coefficients, so the SVR must be the linear-kernel one. Separately, the paper reports the top two standardized coefficients of each linear model: "Department Sales Item Count" and "Department Refunds Item Count" (least squares), "Number of Sales Per Day" and "Number of Item Voids" (lasso), and "Department Sales Total Amount" and "Department Sales Item Count" (ridge).
</div>

<div data-levels="grad res" markdown="1">
Greedy backward elimination is path dependent: a feature removed early because a correlated partner absorbed its weight never returns, so the final pair answers "which two survive this path" rather than "which two predict best." The paper does not name its RFE pairs (Figure 2 plots them), and its Table 2 scores those views by silhouette. On the simulated chain, the page's RFE keeps the same two features and the same complete ranking as scikit-learn's `RFE` in all nine runs (three models on three chains).
</div>

## A map of 28 numbers

<div id="rl-map" class="w-demo"></div>

<div data-levels="public" markdown="1">
Two methods flatten all 28 numbers onto a single page. PCA finds the two directions in which cashiers differ most and draws them as a chart. t-SNE instead tries to keep each cashier's closest look-alikes close on the map, which often reveals groups. Pick a view to see each map; the × marks show the centers of two groups the computer finds on it. The paper used a score called the silhouette to judge which map separates groups most clearly, and its best maps came from t-SNE.
</div>

<div data-levels="hs" markdown="1">
For each cashier the silhouette compares the average distance to the rest of its own group (*a*) with the average distance to the other group (*b*). Its score (*b* − *a*) ÷ max(*a*, *b*) runs from −1 to 1, and the page reports the average over every cashier. The paper's values are small (0.066 to 0.149), meaning the groups overlap heavily. Choose **Your settings** and run t-SNE yourself: watch the first 250 steps, when the method deliberately overstates every attraction to pull groups apart.
</div>

<div data-levels="ug" markdown="1">
PCA projects the standardized data onto the top two eigenvectors of its covariance matrix (29 and 18 percent of the simulated variance). t-SNE converts distances to neighbor probabilities with a per-point Gaussian whose width matches a target perplexity, then moves points in two dimensions to minimize the Kullback–Leibler divergence to a heavy-tailed Student-*t* similarity. The paper's three best settings (perplexity, learning rate, iterations) were (5, 10, 250), (30, 10, 1,000), and (30, 1,000, 500); their maps for the simulated chain are precomputed, and **Your settings** runs a fresh one in your browser.
</div>

<div data-levels="grad res" markdown="1">
The page runs exact t-SNE with scikit-learn's schedule: 250 iterations at early exaggeration 12 and momentum 0.5, then momentum 0.8, gains with a floor of 0.01, and progress checks every 50 iterations. The paper's procedure for the silhouette is underspecified: it chose k = 2 by running k-means "on the original dataset", and its figures mark k-means centers on each view. The page scores k-means run inside each view, and the note under the chart adds two other readings. The sweep below repeats the paper's choice of k on the simulated chain.
</div>

## What the paper found

<div data-levels="public" markdown="1">
- A computer learned the analysts' hand-made risk score well enough to miss by less than one point, on average, on a 4-to-16 scale.
- Methods that can follow curved patterns (a support vector machine with a curved kernel, and a forest of decision trees) did better than straight-line formulas.
- A handful of numbers, such as refunds, voided items, and sales, carried much of the score.
- Flat maps made with t-SNE separated cashiers into groups more clearly than the standard PCA chart.
</div>

<div data-levels="hs" markdown="1">
- The best model, an RBF support vector regression, missed by 0.68 points on average (MSE 0.7948, R² 0.6328).
- The random forest came second (R² 0.5776). The single decision tree and the plain linear formula tied at R² 0.2239, and only the linear-kernel SVR scored lower (0.1776).
- Linear models picked out item counts, refunds, sales per day, voids, and sales totals as their top features.
- k-means on all 28 numbers split the cashiers best into two groups, and the best t-SNE map scored a silhouette of 0.149, against 0.066 for PCA.
</div>

<div data-levels="ug grad res" markdown="1">
- **Nonlinear models lead.** RBF SVR MAE 0.6816, MSE 0.7948, R² 0.6328; random forest 0.7398, 0.9143, 0.5776; the best linear model, lasso, R² 0.4178 (Table 1).
- **The single tree overfits.** Decision tree MAE 0.9744, the worst of the eight, which the authors attribute to too many branching factors for one tree; averaging trees in the forest recovered most of the gap.
- **Interpretable drivers.** Top standardized coefficients name department item counts, refunds, sales per day, item voids, and department sales totals (Section 3.2); the authors leave the interpretation to loss-prevention experts.
- **Two clusters.** k-means on the full data scored the highest silhouette at k = 2 among k = 2 to 10.
- **t-SNE beats PCA on the silhouette.** Best t-SNE 0.14943 (perplexity 5, learning rate 10, 250 iterations), against 0.06615 for PCA and 0.06615 to 0.12499 for the RFE views (Table 2).
</div>

<div data-levels="grad res" markdown="1">
<div class="rl-table-wrap">
<table class="results-table">
<caption class="w-note">Table 1 of the paper (retailer's data, one 90/10 split), with the test-set variance each row implies and its rounding interval (computed by this page).</caption>
<thead><tr><th>Model</th><th>MAE</th><th>MSE</th><th>R²</th><th>MSE ÷ (1 − R²)</th><th>Interval</th></tr></thead>
<tbody>
<tr><td>KNN</td><td>0.8455</td><td>1.173</td><td>0.458</td><td>2.1642</td><td>2.1613 to 2.1671</td></tr>
<tr><td>Linear regression</td><td>0.8407</td><td>1.68</td><td>0.2239</td><td>2.1647</td><td>2.1581 to 2.1713</td></tr>
<tr><td>Lasso regression</td><td>0.8567</td><td>1.26</td><td>0.4178</td><td>2.1642</td><td>2.1554 to 2.1730</td></tr>
<tr><td>Ridge regression</td><td>0.8218</td><td>1.462</td><td>0.3243</td><td>2.1637</td><td>2.1628 to 2.1646</td></tr>
<tr><td>SVR (linear kernel)</td><td>0.8239</td><td>1.78</td><td>0.1776</td><td>2.1644</td><td>2.1582 to 2.1706</td></tr>
<tr><td>SVR (RBF kernel)</td><td>0.6816</td><td>0.7948</td><td>0.6328</td><td>2.1645</td><td>2.1641 to 2.1649</td></tr>
<tr><td>Decision tree</td><td>0.9744</td><td>1.68</td><td>0.2239</td><td>2.1647</td><td>2.1581 to 2.1713</td></tr>
<tr><td>Random forest</td><td>0.7398</td><td>0.9143</td><td>0.5776</td><td>2.1645</td><td>2.1642 to 2.1649</td></tr>
</tbody>
</table>
</div>
</div>

## Why it matters

<div data-levels="public hs" markdown="1">
The retailer's risk score came from a slow, hand-tuned process run by outside analysts. A model that reproduces it from records the store already keeps can score every cashier, every week, at almost no cost, and the feature rankings tell a manager where to look first. The maps turn a spreadsheet of 28 columns into a picture. The score itself still comes from the analysts: the models learn to agree with their judgment, which is only as good as the judgment they copy.
</div>

<div data-levels="ug" markdown="1">
The study is a template for a common industrial request: replace an expensive expert scoring process with a model trained on that process's own outputs, then explain the model well enough that the people who act on it trust it. Each piece answers a different stakeholder: the regressors answer "can we automate this," the coefficients and RFE answer "what drives it," and the embeddings answer "can I see it." Because the target is a consultant's score, the models inherit whatever that score gets wrong, which makes the interpretability steps part of the safeguard as well as the presentation.
</div>

<div data-levels="grad res" markdown="1">
Two methodological lessons travel well beyond retail. First, a published table can be audited without its data when its metrics are algebraically linked, as MSE and R² are through the test-set variance; reviewers can run that check on any regression paper that reports both. Second, scoring embeddings by the silhouette of a k-means split rewards maps that break data into blobs, which t-SNE tends to do by design, so the comparison leans toward t-SNE before any structure in the data is consulted. Insider-risk scoring also raises fairness and privacy questions that the paper does not take up; any deployment would need them answered.
</div>

<div data-levels="res" markdown="1">
## Notes from building this page

- **Table 1 is internally consistent.** All eight (MSE, R²) pairs imply one test-set variance, between 2.16416 and 2.16458 once rounding is allowed (standard deviation about 1.47 on the 4-to-16 scale). R² rebuilt from MSE with that variance matches every printed R² to within 0.00022. The R² formula printed in Section 3.1 is not the one the table follows.
- **Two identical rows.** Linear regression and the decision tree share MSE 1.68 and R² 0.2239 but differ in MAE (0.8407 and 0.9744). Given one test set, the identical R² follows from the identical MSE, so the question is whether the two MSE values coincide to three significant figures or one pair was copied. The paper's text singles out the tree as the weak model, which its MAE supports and its R² does not separate.
- **Two identical silhouettes.** Table 2 gives 0.06615 for both PCA and the linear-regression RFE view, to five digits. Section 3.3.3 calls PCA the worst method and the RFE views "high," while the table ties PCA with an RFE view and ranks every RFE view below every t-SNE setting.
- **The silhouette procedure has three readings.** k = 2 came from k-means on the full data, and the figures mark k-means centers on each view. On the simulated chain, k-means run inside a view and scored there gives 0.35 to 0.46; the full-data clusters scored in each view give 0.12 to 0.39; clusters found in a view but scored with distances in all 28 features give 0.10 to 0.17, the reading closest to the paper's 0.066 to 0.149. These are the page's computations on simulated data and do not determine what the authors did.
- **The best t-SNE map never left early exaggeration.** In scikit-learn (0.19, current in 2018, and 1.9 alike), the first 250 iterations run with exaggeration 12 and momentum 0.5, and with `n_iter=250` the second stage runs zero iterations. The paper's top setting (perplexity 5, learning rate 10, 250 iterations) is therefore the exaggerated layout, which tends to form tight, separated clumps and so favors a high silhouette. The 2018 default was also the Barnes–Hut approximation with random initialization; the page uses exact t-SNE, so its maps differ in detail.
- **Hyperparameters are not reported.** The paper tuned *k* and both α values without printing them, and is silent on SVR *C*, ε, and γ, tree depth, and forest size. The page uses scikit-learn's 2018 defaults (ten trees, γ = 1/28) and its own α values (lasso 0.02, ridge 1), and exposes them at the graduate and researcher levels.
- **Standardization before the split.** Section 2.2 standardizes the whole table and then splits it, so the test rows contribute to the scaling. With 991 rows the effect is small, and the page follows the paper.
- **One split.** Every reported number comes from one 90/10 split of about 100 test cashiers. On the simulated chain, 20 resplits move the RBF SVR's R² between 0.718 and 0.821 (the page's computation), so differences of a few hundredths sit within split-to-split variation; cross-validation or repeated splits would show how stable the paper's ranking is.
- **Solver checks.** Against scikit-learn 1.9.1 on three simulated chains: `DecisionTreeRegressor` and `RandomForestRegressor` (10 trees) predictions identical, with the same tree seeds and importances to 10⁻¹⁶; `KNeighborsRegressor` identical; `LinearRegression`, `Ridge`, and `Lasso` within 2 × 10⁻¹³; `SVR` with shrinking off within 3 × 10⁻¹¹ (the RBF SVR also with default shrinking; the linear SVR within 0.007 with shrinking on, inside the solver tolerance); `RFE` same ranking in nine of nine runs; `PCA` within 4 × 10⁻¹⁴; Lloyd k-means from the same centers, same labels; silhouette within 10⁻¹⁵. Exact t-SNE agrees within 10⁻¹³ after five iterations and 3 × 10⁻⁹ after 20, after which round-off from different summation orders is amplified, as expected for this optimization.
- **Small text issues.** Section 3.1's table reference renders as "table ??" in the ACM version (fixed to "table 1" in arXiv v3), and the lasso's top features are quoted as "Number of Sales Per Day and Number" of "Item Voids".
</div>

<div data-levels="hs" markdown="1">
## Try this in class

1. Use the first demo with five neighbors. Record the guess and the true score for ten unseen cashiers, then compute your own MAE by averaging the size of the ten misses. Compare it with the page's average over all 100.
2. In the third demo, pick any row of the paper's table and compute MSE ÷ (1 − R²) by hand. Compare your answer with a classmate who chose a different row, and explain why the answers almost match.
3. Run t-SNE with **Your settings** twice, once with perplexity 5 and once with perplexity 50. Sketch both maps and write two sentences on which one you would show a store manager, and why.
</div>

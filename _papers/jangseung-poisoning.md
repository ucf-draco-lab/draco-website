---
title: "Jangseung: A Guard at the Door of a Learning Model"
kicker: "Interactive paper · IEEE ISC2 2021"
subtitle: "An interactive companion to Shaya Wolf, Woodrow Gamboa, and Mike Borowczak's Jangseung, a screening step that asks whether each new training example looks like the class it claims before a support vector machine learns from it."
description: "Slip mislabeled handwritten digits past an isolation-forest guard, poison a tumor classifier with and without the guard, map which digit pairs are hardest to defend, and compare this page's reconstruction with the paper's reported accuracies."
share_description: "A model that keeps learning can be taught wrong answers on purpose. Jangseung checks each new example against what its class usually looks like. Poison a classifier in your browser, written for five reading levels."
share_text: "A model that keeps learning can be taught wrong answers on purpose. Jangseung checks each new example first. Try it in your browser:"
share_image: /papers/jangseung-poisoning/share.png
share_image_alt: "Six real handwritten digits shown with wrong labels, beside a chart where an unguarded tumor classifier's accuracy collapses below 20 percent as 500 poisoned records arrive while the guarded classifier stays near 90 percent, under the title Jangseung."
date: 2026-10-19
topics: ["AI & machine learning"]
default_level: public
level_hints:
  public: No background needed
  hs: Averages, percentages, and a little coding
  ug: Classifiers, training data, and programming
  grad: Support vector machines, anomaly detection, and experiment design
  res: Full method, reproduction, and open questions
authors:
  - name: Shaya Wolf
    affiliation: University of Wyoming
  - name: Woodrow Gamboa
    affiliation: Stanford University
  - name: Mike Borowczak
    affiliation: University of Wyoming
    member: mike-borowczak
sources:
  - venue: "IEEE ISC2 · 2021"
    title: "Jangseung: A Guardian for Machine Learning Algorithms to Protect Against Poisoning Attacks"
    url: https://doi.org/10.1109/ISC253183.2021.9562816
    access: Paywalled (IEEE)
citations:
  - wolf2021jangseung
widget:
  css:
    - /papers/jangseung-poisoning/widget.css
  js:
    - /papers/jangseung-poisoning/jangseung-engine.js
    - /papers/jangseung-poisoning/widget.js
credit: "Interactive page by the [DRACO Lab](/). No code from the authors is public, so the page reconstructs the experiment from the paper's two algorithms with the scikit-learn defaults its numbers point to. The browser engine (`jangseung-engine.js`) implements the support vector machine with libsvm's solver and the isolation forest from scratch; on 40 training sets it matches scikit-learn's decision values to within 0.002 with no disagreement on 2,400 predictions, it scores scikit-learn's own exported forests identically (within 2 × 10⁻¹⁶ on 600 queries), and its own forests turn away the same share of poisoned points as scikit-learn's on seven test cases (every difference under 1.4 standard errors). With the default classifier on the 569-record diagnostic tumor data, the page reproduces the paper's clean accuracy range (89.93% to 91.58%). The paper's MNIST accuracy drops do not reproduce with the attack as printed; the researcher notes explain why. Heat map and sweep figures were precomputed with scikit-learn by the page's [reference script](/papers/jangseung-poisoning/reference/pre.py) and are labeled as the page's. MNIST digits: Yann LeCun, Corinna Cortes, and Christopher J. C. Burges. Tumor data: William H. Wolberg, W. Nick Street, and Olvi L. Mangasarian, UCI Machine Learning Repository. Everything else runs on your device."
bibtex: |
  @inproceedings{wolf2021jangseung,
    author    = {Wolf, Shaya and Gamboa, Woodrow and Borowczak, Mike},
    title     = {Jangseung: A Guardian for Machine Learning Algorithms to Protect Against Poisoning Attacks},
    booktitle = {2021 IEEE International Smart Cities Conference (ISC2)},
    pages     = {1--7},
    year      = {2021},
    doi       = {10.1109/ISC253183.2021.9562816}
  }
---

<div class="lede" data-levels="public" markdown="1">
Many city services (traffic forecasts, sensor alerts, and emergency routing) run on computer models that keep learning from new data. Anyone who can slip in a few wrong examples, such as a picture of a 1 labeled as a 7, can slowly teach the model wrong answers. Shaya Wolf, Woodrow Gamboa, and Mike Borowczak built Jangseung, named for the carved guardian posts that stand at the entrance of Korean villages, to stand at the model's door. Before the model learns from a new example, Jangseung asks one question: does this look like the other examples of the class it claims to be? Examples that do not are turned away.
</div>

<div class="lede" data-levels="hs" markdown="1">
A classifier learns from labeled examples, such as thousands of handwritten digits each tagged with the right number. A poisoning attack adds examples with the wrong tag. Jangseung keeps one small "what normal looks like" model for each class and checks every new example against the class its label claims. The paper tests this on handwritten digits (the MNIST set, every pair of digits from 0 and 1 up to 8 and 9) and on medical measurements of breast tumors, adding up to 500 poisoned examples and measuring how accurate the classifier stays with and without the guard.
</div>

<div class="lede" data-levels="ug" markdown="1">
Jangseung is a preprocessing filter for a support vector machine (SVM) that is retrained as new points arrive. The authors train one isolation forest on each class of the clean training data. Each incoming point is checked by the forest of the class its label claims; only points the forest scores as inliers join the guarded model's training set, while an unguarded twin accepts everything. The attack (the paper's Algorithm 1) takes a random training point, flips its label, and nudges it uphill on the hinge loss. The experiments cover 720 MNIST runs (45 digit pairs, four training sizes, four subsets) and tumor-data runs with isolation forests and elliptic envelopes.
</div>

<div class="lede" data-levels="grad" markdown="1">
The paper evaluates a per-class anomaly-detection filter against training-set poisoning of binary SVMs. Poison points come from a gradient-ascent attack in the style of Muñoz-González et al. (step 0.001 along the unit gradient of the hinge loss, tolerance 10⁻⁵); each is screened by an isolation forest (or, on the tumor data, an elliptic envelope) fit to the claimed class, and two SVMs are retrained after every point. Reported effects: under-trained MNIST models (250 training digits) average 53.2% accuracy across 100 attacks unguarded and 91.1% guarded; across a 500-attack sequence, tumor-data models average 75.51% unguarded and 88.18% guarded.
</div>

<div class="lede" data-levels="res" markdown="1">
This page rebuilds both of the paper's algorithms in the browser with scikit-learn's default SVC (RBF kernel, C = 1, gamma "scale") and IsolationForest (100 trees, subsample 256, "auto" cut at −0.5), verified against scikit-learn. Two findings shape the reconstruction. First, the default SVC on the 569-record diagnostic tumor set reproduces the paper's clean accuracy range, which identifies the data set the paper's title names (its Methods quote the 699-record original set's counts). Second, at the printed step size every poisoned point stops after one step and moves 0.001 grey levels, so the attack acts as label flipping of copied training points. The tumor-data results then reproduce in shape; the MNIST accuracy drops do not. The notes at the end list the details and questions for the authors.
</div>

## Mislabeled digits at the door

<div id="js-door" class="w-demo"></div>

<div data-levels="public" markdown="1">
Each tile is a real handwritten digit carrying the wrong label. Jangseung compares it with the training examples of the label it claims and lets it in only if it fits. Try 0 and 1: a 0 looks nothing like a 1, so almost every fake is caught. Now try 4 and 9, two digits many people write alike. Far more fakes slip through, which matches the paper's hardest pair.
</div>

<div data-levels="hs" markdown="1">
The guard is an isolation forest: it builds 100 random "twenty questions" trees that try to separate one example from the rest by asking whether a single pixel is brighter or darker than a random cutoff. Unusual examples get isolated in fewer questions. A 7 labeled as a 1 sits far from every real 1, so the 1-forest isolates it fast and turns it away. Change the pair and count how many of the 100 fakes get caught.
</div>

<div data-levels="ug" markdown="1">
Each trial fits one isolation forest per digit on the training digits (half of the training size each), draws 100 training digits at random, flips their labels, and scores each one with the forest of the claimed digit. A digit passes when its score is at least −0.5, scikit-learn's default cut. The chart below the tiles places genuine digits and poisoned digits on the same score line. The paper's attack also nudges each point along the hinge-loss gradient, but by only 0.001 grey levels (out of 255), so the tiles show each poisoned digit exactly as drawn.
</div>

<div data-levels="grad res" markdown="1">
The anomaly score is s(x) = −2^(−E[h(x)]/c(ψ)), where h(x) is the path length to isolate x in one tree, ψ = min(256, n) is the subsample, and c(ψ) = 2H(ψ − 1) − 2(ψ − 1)/ψ normalizes by the average unsuccessful-search length in a binary search tree. The guard passes s ≥ −0.5. The forest of the claimed class sees a flipped digit as an outlier only when the two digit distributions separate along random single-pixel cuts, which explains why 0 pairs are easy and 4 and 9 are hard. The score line also shows the cost the paper does not report: some genuine digits fall below the cut too, and a guard that screens new data would turn those away as well.
</div>

## Poisoning a tumor classifier

<div id="js-attack" class="w-demo"></div>

<div data-levels="public" markdown="1">
This classifier reads 30 measurements of a breast tumor from a medical image and calls it harmful or harmless. Press Run, and the page sends in poisoned records one at a time: real records with the answer swapped. The gray line has no guard. The colored line has Jangseung. With 500 poisoned records the unguarded classifier ends up worse than a coin flip, while the guarded one stays close to where it started.
</div>

<div data-levels="hs" markdown="1">
The page trains two copies of the same classifier on 300 real records, then adds poisoned records one at a time and retests both copies on 100 records they never saw. The unguarded copy learns from every poisoned record; the guarded copy learns only from the ones Jangseung lets through. Watch what happens once the poisoned records outnumber the real ones: for most patients, the training data now holds more wrong answers than right ones, and the unguarded classifier starts answering backwards.
</div>

<div data-levels="ug" markdown="1">
Algorithm 2 in the browser: a stratified split of the 569-record Wisconsin diagnostic set, an isolation forest per class, and two RBF support vector machines retrained after every poisoned record, all inside a Web Worker. Smaller training sets fail sooner. The paper reports unguarded averages of 90.03% to 90.72% for 50 to 250 poisoned records and 75.51% for 500; the guarded models stay above 91% and at 88.18%, respectively.
</div>

<div data-levels="grad res" markdown="1">
Each poisoned record is a copy of a training record with its label flipped (the gradient step is 0.001 in feature units, negligible next to features that span tens to thousands). Once the flipped copies outnumber the originals, the label majority flips locally almost everywhere, and the RBF machine learns the inverted rule, which is why final unguarded accuracy can sink far below the majority-class rate. The guard caps that by rejecting 67% to 79% of the poison in the page's runs. Features are unscaled, as the default pipeline implies; scaling them would change both the clean accuracy and the guard.
</div>

## Which digit pairs are hardest to defend

<div id="js-heat" class="w-demo"></div>

<div data-levels="public hs" markdown="1">
Each square shows how many of 100 fake digits Jangseung turned away for one pair of digits. Darker squares mean a stronger guard. Every pair with a 0 is easy to defend. The paper's hardest pair, 4 and 9, is the hardest here too, and 7 and 9 comes next in both.
</div>

<div data-levels="ug grad res" markdown="1">
The page's map reproduces the paper's ranking at the extremes: 0 and 1 is the best pair (99.8% here, 100% in the paper), 4 and 9 the worst (20.0% here, 36.5% in the paper), and 7 and 9 the second worst in both. The page turns away fewer poisoned digits overall than the paper reports (55.5% for 1 and 7 against 75%, 44.5% for 5 and 8 against 73%, and six pairs above 95% against ten). Pixel scaling, subsample choices, or a different forest cut in the authors' code could each account for a uniform shift of this kind.
</div>

## More training data, less help needed

<div id="js-scale" class="w-demo"></div>

<div data-levels="public hs" markdown="1">
A classifier trained on more examples is harder to push around, so the guard matters most for small training sets. The tumor view shows this plainly: with only 50 real records, the unguarded classifier drops below 50% on average while the guarded one stays near 91%.
</div>

<div data-levels="ug grad res" markdown="1">
On the tumor data the page shows the paper's pattern, with a larger effect at the smallest size (a 42-point gain at 50 training records here, 15.12 points in the paper) and almost none at the largest (0.4 points at 450 here, 1.03 at 500 in the paper). On MNIST the page's unguarded models stay between 98.5% and 99.3% at every size, far above the paper's 53.2% at 250 digits. The elliptic envelope turns away less poison than the isolation forest and loses ground past 300 attacks, the same ordering as the paper's 89.4% and 91.3% averages.
</div>

## What the paper found

<div data-levels="public" markdown="1">
- With Jangseung in place, the protected model beat the unprotected one in every case the authors tested.
- Handwritten-digit models trained on only 250 examples averaged 53.2% accuracy under attack without the guard and 91.1% with it.
- On tumor data, 500 poisoned records pulled the unguarded model down to an average of 75.51%; the guarded model averaged 88.18%.
- Digits that look alike, such as 4 and 9, were the hardest to protect.
</div>

<div data-levels="hs" markdown="1">
- The guard caught every fake in the 0 and 1 pair and only 36.5% in the 4 and 9 pair.
- After all 100 attacks, the biggest gap between guarded and unguarded digit models was 96.2 percentage points (the 6 and 9 pair).
- Well-trained digit models (1,000 examples) barely needed help: 97.6% unguarded, 97.8% guarded.
- Small training sets gained the most: the guard added 15.12 points with 50 tumor records and 1.03 points with 500.
</div>

<div data-levels="ug grad res" markdown="1">
- **Every pair improved.** Across 720 MNIST experiments the guarded model's average accuracy beat the unguarded model's, by 3.2 points (1 and 8) to 17.6 points (0 and 8).
- **Final accuracy tells the bigger story.** After 100 attacks the guarded model's final accuracy led by 26 points (1 and 2) to 96.2 points (6 and 9).
- **Under-trained models benefit most.** At 250 training digits, 53.2% unguarded against 91.1% guarded; at 1,000 digits, 97.6% against 97.8%.
- **Tumor data.** Clean accuracy 89.93% to 91.58%; averages under attack 84.5% unguarded, 89.4% with an elliptic envelope, and 91.3% with an isolation forest.
- **Longer attacks hurt more.** Unguarded tumor models held 90.03% to 90.72% for 50 to 250 attacks and fell to 75.51% at 500; guarded models stayed above 91% and then 88.18%.
</div>

<div data-levels="grad res" markdown="1">
<div class="js-table-wrap">
<table class="results-table">
<caption>Paper values beside this page's reconstruction (scikit-learn, labeled runs)</caption>
<thead><tr><th>Measure</th><th>Paper</th><th>Page</th><th>Page sample</th></tr></thead>
<tbody>
<tr><td>Tumor clean accuracy, default SVC</td><td class="js-num">89.93% to 91.58%</td><td class="js-num">89.1% to 91.9%</td><td>30 splits per size, 15 train/test sizes</td></tr>
<tr><td>Tumor, 50 to 250 attacks, unguarded average</td><td class="js-num">90.03% to 90.72%</td><td class="js-num">88.2% to 89.7%</td><td>3 runs per point, 300 train, 100 test</td></tr>
<tr><td>Tumor, 500 attacks, unguarded average</td><td class="js-num">75.51%</td><td class="js-num">59.8%</td><td>same</td></tr>
<tr><td>Tumor, 500 attacks, isolation-forest guard</td><td class="js-num">88.18%</td><td class="js-num">89.4%</td><td>same</td></tr>
<tr><td>Tumor, 500 attacks, elliptic-envelope guard</td><td class="js-num">not stated</td><td class="js-num">77.4%</td><td>same</td></tr>
<tr><td>MNIST 250 digits, unguarded average</td><td class="js-num">53.2%</td><td class="js-num">98.9%</td><td>8 pairs, 1 run each</td></tr>
<tr><td>MNIST 250 digits, guarded average</td><td class="js-num">91.1%</td><td class="js-num">98.8%</td><td>same</td></tr>
<tr><td>MNIST 1,000 digits, unguarded and guarded</td><td class="js-num">97.6%, 97.8%</td><td class="js-num">99.3%, 99.3%</td><td>same</td></tr>
<tr><td>Turned away, 0 and 1 pair</td><td class="js-num">100%</td><td class="js-num">99.8%</td><td>8 runs of 100 poisoned digits</td></tr>
<tr><td>Turned away, 4 and 9 pair</td><td class="js-num">36.5%</td><td class="js-num">20.0%</td><td>same</td></tr>
<tr><td>Pairs turning away more than 95%</td><td class="js-num">10</td><td class="js-num">6</td><td>45 pairs</td></tr>
</tbody>
</table>
</div>
</div>

## Why it matters

<div data-levels="public hs" markdown="1">
Models that keep learning after they are deployed are useful exactly because they adapt, and that same openness lets an attacker teach them wrong answers. A guard that checks each new example against what its class normally looks like adds little cost and protects the models most at risk: the ones that start with little data. The same check also catches honest mistakes, such as a mislabeled sensor reading, before they quietly degrade a city service.
</div>

<div data-levels="ug" markdown="1">
Jangseung needs no change to the classifier and no knowledge of the attack; it is a filter in front of the training set, so it can sit in front of models already in service. The cost is false rejections of genuine data that happens to look unusual, a trade-off any deployment would tune with the forest's cut.
</div>

<div data-levels="grad res" markdown="1">
Per-class density screening is a cheap first line against label-flip and near-copy poisoning, the cheapest attacks an adversary can mount on a continuously retrained model. The paper argues a further benefit: guarding weak models removes the easy surrogate an adversary would attack first and transfer to a stronger model. Stronger poisoning attacks that optimize points to look typical of the claimed class are the natural next test.
</div>

<div data-levels="res" markdown="1">
## Notes from building this page

These notes interpret or question the paper and are offered to the authors for review.

- **Which tumor data set.** The title and Methods name the diagnostic set, but Methods quote 699 vectors (458 benign, 241 malignant), which are the counts of the original Wisconsin set. The default SVC (RBF, gamma "scale", unscaled features) gives 89.1% to 91.9% on the 569-record diagnostic set across the paper's train and test sizes, bracketing the reported 89.93% to 91.58%; on the 699-record original set it gives 95.7% to 97.0%. The page uses the diagnostic set.
- **The attack is label flipping.** With step t = 0.001 along the unit gradient and tolerance ε = 10⁻⁵, the loss rises by at most 0.001 times the gradient norm per step, and for every poisoned point the browser engine generated in its tumor and MNIST checks, the loop stopped after one step. A poisoned point is therefore a copy of a training point, moved by 0.001, with its label flipped. The page caps the loop at 10 steps; the cap never binds.
- **MNIST drops do not reproduce.** Under that attack the page's unguarded MNIST models average 98.5% to 99.3% at every training size (eight pairs, one run each), against the paper's 53.2% at 250 digits and its final-accuracy gaps of up to 96.2 points. Copies with flipped labels, about two in seven training points at the smallest size, do not move an RBF machine that far. The paper's drops suggest a larger effective step, rescaled pixels with a larger t, or a different kernel. Question for the authors: which settings produced Figures 1 to 4?
- **Why the tumor model inverts.** Once flipped copies outnumber the training records, most neighborhoods hold more wrong labels than right ones, and unguarded final accuracy falls to 10% to 16% in the page's runs (300 training records, 350 or more attacks).
- **Algorithm 2, line 16** appends every adversarial point to the guarded set; the text says it joins the unguarded set, and the page follows the text.
- **Small inconsistencies.** The isolation-forest tumor average is 91.3% in Results and 91.4% in the Conclusions; Methods describe sixteen tumor train/test combinations and Results ten training sizes; which detector the 88.18% figure uses is not stated.
- **What the paper does not measure.** False rejections of genuine new data, and the guard's behavior against points optimized to look typical of the claimed class. The first demo shows genuine digits below the cut at graduate and researcher levels.
</div>

<div data-levels="hs" markdown="1">
## Try this in class

1. In the first demo, pick five digit pairs you think look alike and five you think look different. Record how many of the 100 fakes the guard turns away for each, and compare the two groups.
2. In the tumor demo, run 500 poisoned records with 50, 200, and 450 training records. Make a table of the final accuracy with and without the guard, and explain why the smallest training set fails first.
3. Discuss as a class: the guard also turns away some real examples. When would that be a price worth paying, and when would it not?
</div>

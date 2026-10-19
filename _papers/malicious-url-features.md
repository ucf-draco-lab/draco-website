---
title: "Reading a Link Without Clicking It: Fifteen Clues to a Malicious URL"
kicker: "Interactive paper · IEEE CARS 2024"
subtitle: "An interactive companion to Sajjad H. Shah, Amit Garu, Duong N. Nguyen, and Mike Borowczak's framework for choosing a small set of features that let machine learning models flag malicious web addresses from their text alone."
description: "Type any web address and watch the authors' extractor turn it into numbers; score a feature the way information gain does; rerun the authors' memory measurement to see what Table III's memory column records; and compare all features against the 15 kept ones across seven classifiers."
share_description: "A web address gives itself away before anyone clicks it: its length, its dots, its capital letters, and its words. This paper keeps 15 such clues and trains detectors faster. Read any URL the way the detector does, in your browser, written for five reading levels."
share_text: "Fifteen clues in the text of a web address, read the way a malicious-URL detector reads them. Try it in your browser:"
share_image: /papers/malicious-url-features/share.png
share_image_alt: "A look-alike login address shown as host and path, with its 15 feature values listed beneath it, next to the title Reading a Link Without Clicking It."
date: 2026-10-19
topics: ["AI & machine learning", "Networks"]
default_level: public
level_hints:
  public: No background needed
  hs: Counting, ratios, and a little probability
  ug: Programming, string parsing, and machine learning basics
  grad: Feature selection, information theory, and experiment design
  res: Full method, reproduction, and open questions
authors:
  - name: Sajjad H. Shah
    affiliation: University of Wyoming
  - name: Amit Garu
    affiliation: University of Wyoming
  - name: Duong N. Nguyen
    affiliation: University of Wyoming
  - name: Mike Borowczak
    affiliation: University of Central Florida
    member: mike-borowczak
sources:
  - venue: "IEEE Cyber Awareness and Research Symposium (CARS) · 2024"
    title: "Feature Selection Framework for Optimizing ML-based Malicious URL Detection"
    url: https://doi.org/10.1109/CARS61786.2024.10778786
    access: Paywalled (IEEE)
code:
  label: "MDND, the authors' feature extraction and classifier scripts (cybw90/MDND, MIT)"
  url: https://github.com/cybw90/MDND
citations:
  - cars-2024
widget:
  css:
    - /papers/malicious-url-features/widget.css
  js:
    - /papers/malicious-url-features/url-engine.js
    - /papers/malicious-url-features/widget.js
credit: "Interactive page by the [DRACO Lab](/). The browser engine ports the authors' feature extractor (`Feature_Exctraction.py` in the MIT-licensed MDND repository, commit 0af1167; license on `url-engine.js`), including Python's `urlparse`. Run against the authors' script, unchanged, on 59,981 generated addresses, it matches 3,298,953 of 3,298,955 values; the two that differ come from the English-word check, which uses the hunspell en_US dictionary (SCOWL) and agrees with pyenchant on 433,524 of 433,526 test words. It also rejects the same 19 addresses Python rejects. The data sets behind the paper are not in the repository, so accuracy and timing are shown as printed. The memory demo reruns the authors' `Classifier_gv4_w_mem.py` on random data of the paper's shape: Naive Bayes and nearest-neighbor peaks land within 0.3 of all four printed Table III values (the Naive Bayes gap between 55 and 15 features, 21.35, against the printed 21.36), which identifies the column as tracemalloc mebibytes printed under a GB label. Everything runs on your device."
bibtex: |
  @inproceedings{shah2024url,
    author    = {Shah, Sajjad H. and Garu, Amit and Nguyen, Duong N. and Borowczak, Mike},
    title     = {Feature Selection Framework for Optimizing {ML}-based Malicious {URL} Detection},
    booktitle = {2024 Cyber Awareness and Research Symposium (CARS)},
    year      = {2024},
    pages     = {1--6},
    doi       = {10.1109/CARS61786.2024.10778786}
  }
---

<div class="lede" data-levels="public" markdown="1">
Phishing emails, scam texts, and malware downloads all arrive the same way: as a link. Checking every link by visiting it is slow and risky, so detectors look only at the link's text, such as its length, how many dots and dashes it has, and whether it contains real English words. Sajjad H. Shah, Amit Garu, Duong N. Nguyen, and Mike Borowczak asked which of those clues a detector needs. Their framework picks 15 of them, and six kinds of machine learning model trained on just those 15 flag malicious links about as accurately as models trained on every clue, while using less memory. This page lets you read any link the way their detector does.
</div>

<div class="lede" data-levels="hs" markdown="1">
A URL (uniform resource locator) is a web address, such as `https://www.example.com/about`. The authors' program turns each URL into a list of numbers called features: its length, its number of dots, its count of each letter and digit, its capital letters, and more. Three methods then vote on which features matter most, and 15 survive. The authors trained six kinds of classifier on two public data sets of 110,000 URLs each (one malicious URL for every ten harmless ones), once with all features and once with the 15, and compared accuracy, training time, and memory.
</div>

<div class="lede" data-levels="ug" markdown="1">
The paper's framework extracts lexical features from each URL string (counts, lengths, and ratios, plus English-word features from a dictionary check), scores them with information gain and random-forest importance at a 0.04 threshold, and runs a genetic algorithm ten times, keeping the features common to every run (Table I). Random forest, logistic regression, a support vector machine, k-nearest neighbors, Gaussian Naive Bayes, and a multilayer perceptron are then trained on Kaggle and UCI samples of 110,000 URLs (10:1 benign to malicious, 70/30 split), with all features and with the 15 selected, three runs each (Table III), and again under memory limits (Table IV).
</div>

<div class="lede" data-levels="grad" markdown="1">
Lexical URL classification trades a richer feature space against training cost, which matters most on edge devices. The paper proposes a three-stage filter-and-wrapper selection (information gain, random-forest impurity importance, and a genetic algorithm wrapped around a classifier) that reduces the authors' extracted feature set to 15, and evaluates six model families on Kaggle and UCI PhiUSIIL samples. Accuracy, precision, and recall stay close to the full-feature baselines (accuracy within 0.04 in all 14 classifier and data-set pairs), training time falls in 9 of 14, and the reported training memory falls in 12 of 14. Under address-space limits of 2 to 20 GB (Table IV), some models train only with the reduced set.
</div>

<div class="lede" data-levels="res" markdown="1">
Shah, Garu, Nguyen, and Borowczak (IEEE CARS 2024) report a hybrid feature-selection pipeline for lexical malicious-URL detection, with results for seven classifier configurations on two 110,000-URL samples (Table III) and a memory-constrained simulation via `resource.setrlimit` (Table IV). The authors' scripts are public (MDND, MIT); the data sets and their derived feature files are not. This page ports the extractor and verifies it against the authors' code, scores features with Eqs. 2 and 3, reruns the authors' memory harness on data of the paper's shape to reproduce Table III's Naive Bayes and k-nearest-neighbor memory values, and records where the released code and the paper's description of it differ.
</div>

## Reading an address without visiting it

<div id="mu-reader" class="w-demo"></div>

<div data-levels="public" markdown="1">
Edit the address in the box, or press a preset. Every preset uses addresses reserved for examples (`example.com` and the `203.0.113` block), so none of them lead anywhere real. The table lists the 15 clues the paper keeps. Compare **Plain page** with **Look-alike login**: the look-alike is almost three times as long, has two hyphens in its host name, a percent sign, and words such as "secure," "login," and "verify" that scam pages like to borrow. No single clue proves anything; a trained model weighs all 15 together.
</div>

<div data-levels="hs" markdown="1">
Try changing one character at a time and watch which numbers move. Add a capital letter and both "Capital letters" and "Letters" go up by one. Add `-` to the host name and "Hyphens in the host name" counts it, but a hyphen in the path does not. The English-word count uses a spelling dictionary, so it finds "secure" and "login" but also counts single letters such as "A" and "B," because a dictionary accepts those as words. Press **No scheme**: without `https://`, the program finds no host at all, and the dot and TLD clues drop to zero.
</div>

<div data-levels="ug" markdown="1">
The first row shows how Python's `urllib.parse.urlparse` splits the string; the host features read only the netloc, so `example.org/downloads/…` without `//` has an empty host and the whole string becomes the path. Switch to **All 55 extracted** to see every column of the authors' `Extracted_Features.csv` in order: the letter counts (25 of them: the script computes `n` but never writes it), ten digit counts, and the host, length, and symbol features. The JavaScript port reproduces Python's code-point string length, its non-overlapping `str.count`, its Unicode `isalpha`, `islower`, and `isupper`, and the cases where `urlparse` raises an error, which would stop the authors' script.
</div>

<div data-levels="grad res" markdown="1">
The port matches the authors' extractor on 59,981 generated URLs (schemes present and absent, IPv4 and IPv6 hosts, ports, user information, `;params`, queries, fragments, mixed case, and non-ASCII text), 3,298,953 of 3,298,955 values; the two differences are all-capital tokens ("DECED," "DECS") that pyenchant and the page's expanded en_US word list judge differently. Several Table I entries name a quantity the code computes differently: "Dots Overall" is the host's dot count, identical to "Dots in Domain"; "TLD" is the length of the last host label (with any port attached); "Average English Words" is the mean length of the English tokens; and "English Words" and "Upper Case Ratio" are not written to the CSV at all. The page computes those two and labels them **page**.
</div>

## Scoring a feature: information gain

<div id="mu-gain" class="w-demo"></div>

<div data-levels="public" markdown="1">
A clue is useful when knowing it makes the answer less of a toss-up. The bars measure that uncertainty, called entropy: a pile with as many malicious as harmless links scores 1, and a pile of only one kind scores 0. Press **Useless split**: both sides keep the same mix as before, so nothing is learned. Press **Strong hint**: most malicious links land on the "yes" side, the piles become purer, and the uncertainty drops. The drop is the clue's score.
</div>

<div data-levels="hs" markdown="1">
Entropy for a pile with a fraction p of malicious links is −p·log₂(p) − (1 − p)·log₂(1 − p) (the paper's Eq. 2). With the paper's mix of one malicious link per ten harmless ones, the starting entropy is about 0.44 bits, not 1, because the pile is already lopsided. Information gain (Eq. 3) subtracts the average entropy after the split, weighting each side by its share of the links. Find the smallest change from **Useless split** that pushes the score past 0.04, the paper's cutoff.
</div>

<div data-levels="ug" markdown="1">
Gain(S, A) = H(S) − Σ (|S\_v|/|S|)·H(S\_v), computed in bits for a binary attribute such as `ip_DNS`. The paper applies a 0.04 cutoff to information gain and to random-forest importance and keeps the features that pass, then runs a genetic algorithm (GA) ten times and keeps the features chosen every time. Gain is never negative, and it reaches H(S) only when each branch is pure, as **Perfect split** shows.
</div>

<div data-levels="grad res" markdown="1">
The released code does not compute Eq. 3. `Feature_importance(IG-RF).py` and `information_gain.py` call scikit-learn's `mutual_info_classif` on all columns as continuous variables, which estimates mutual information in nats with a k-nearest-neighbor (Kraskov-style) estimator, so the 0.04 cutoff applies to that estimate (0.04 nats is 0.058 bits). The random-forest list in the same script is the top ten by impurity importance rather than a 0.04 threshold. Count features such as `Count_&` take few distinct values, where the nearest-neighbor estimator and the plug-in Eq. 3 can rank features differently.
</div>

## What the memory column measured

<div id="mu-memory" class="w-demo"></div>

<div data-levels="public" markdown="1">
Table III of the paper lists how much memory each model used while training, and the numbers look huge: 29.68 GB for Naive Bayes with every feature, 8.32 GB with the 15 kept ones. This demo reran the authors' own measuring program on random numbers arranged like their data (110,000 rows), and the curve lands within a third of a unit of the paper's squares. The program measures in mebibytes, so the real figures are about one thousandth of what the label says: roughly 31 megabytes, not 30 gigabytes. Fewer features still means less memory, which is the paper's point.
</div>

<div data-levels="hs" markdown="1">
A computer stores each number in a few bytes, so a table of 76,998 training rows and 55 features takes about 76,998 × 55 × 8 bytes ≈ 34 megabytes once converted to 8-byte numbers. Slide the number of features and watch Naive Bayes grow in a straight line: each feature adds about half a mebibyte. A mebibyte (MiB) is 1,048,576 bytes; a gigabyte is a billion. The authors' program divides bytes by 1,024 twice, which gives mebibytes, then prints "GB" beside the number.
</div>

<div data-levels="ug" markdown="1">
`utils.track_memory` wraps each classifier call with `tracemalloc` and prints `peak / 1024 / 1024` with the label "GB." Rerunning `Classifier_gv4_w_mem.py` unchanged on random integers with the paper's shape gives Naive Bayes peaks of 8.61 and 29.96 MiB at 15 and 55 features (printed: 8.32 and 29.68) and k-nearest-neighbor peaks of 21.83 and 5.83 (printed: 21.79 and 5.54). Pick **k-nearest neighbors**: memory jumps *down* past 15 features because scikit-learn's `algorithm="auto"` builds a k-d tree for 15 or fewer features and switches to chunked brute-force distances above that, which explains why Table III shows k-NN using more memory with the reduced set.
</div>

<div data-levels="grad res" markdown="1">
Two observations pin down the column. Its values are identical on the Kaggle and UCI samples (36.48, 115, 5.54, 29.68 with all features), as expected when the peak is set by array shapes rather than data values, and the measured Naive Bayes difference between 55 and 15 features, 21.35 MiB, matches the printed 21.36 to the second decimal. The remaining offset of about 0.28 MiB is close to one 4-byte array over the 76,998 training rows. Logistic regression does not reproduce (35.4 and 11.9 MiB here against 115 and 34.46 printed), and the random-forest, support-vector, and MLP peaks depend on the data, so the page does not estimate them. Table IV's limits act on virtual address space (`RLIMIT_AS`), which counts thread pools and library mappings as well as heap, which can explain why runs that peak near 30 MiB fail under a 2 GB limit.
</div>

## Fifteen features against all of them

<div id="mu-results" class="w-demo"></div>

<div data-levels="public" markdown="1">
Gray bars are models trained on every feature; blue bars use only the 15 kept ones. Under **Accuracy**, the pairs are nearly the same length for every model on both data sets. Switch to **Memory** and most blue bars shrink to about a third. Switch to **Time (s)**: on the UCI data six of seven models train faster with 15 features, while on the Kaggle data the neural network on a regular processor slows down, so fewer features does not always mean faster training.
</div>

<div data-levels="hs" markdown="1">
Accuracy is the share of all links classified correctly. Precision is the share of links flagged as malicious that really were, and recall is the share of malicious links that got flagged. With ten harmless links for each malicious one, a model that flagged nothing would still score about 0.91 accuracy, so precision and recall tell more. Compare Naive Bayes on the UCI data: its recall is nearly perfect (0.997) but its precision is 0.22, so it flags about three and a half harmless links for every malicious one it catches.
</div>

<div data-levels="ug" markdown="1">
Each bar pair is a Table III row, averaged over three runs on a Core i7-13700K with an RTX 4090 for the GPU MLP. Random forest and the SVM use standardized features; the MLP has two hidden layers of 150 units (Adam, up to 300 epochs). With the reduced set, accuracy changes by at most 0.04 and memory falls in six of seven rows on each data set. Bold entries in the paper mark improvements of 10 percent or more.
</div>

<div data-levels="grad res" markdown="1">
The table below the chart is Table IV: training time on the UCI sample under `resource.setrlimit(RLIMIT_AS)` caps of 2 to 20 GB. At 2.3 GB, random forest and k-NN train only with the reduced set, and at 3 GB the full-feature k-NN run stalls ("long wait") while the reduced run takes 1.02 s. The 20 GB column tracks Table III's UCI times for most rows (random forest 2.46 against 2.42 s) but not for the CPU MLP (216 against 117.7 s). Precision and recall use different averaging across the repository's scripts: `main.py` and `Classifier_gv4_w_mem.py` score the malicious class, while `Main_Ens.py` and the MLP script report macro averages, so rows produced by different scripts are not directly comparable.
</div>

## What the paper found

<div data-levels="public" markdown="1">
- Fifteen clues taken from the text of a link are enough for models to flag malicious links about as well as with every clue the authors computed.
- Models trained on the 15 clues used less memory in most cases, and some could still train when memory was tightly limited while the full versions could not.
- Training time fell for most models on one data set but not for every model on the other.
</div>

<div data-levels="hs" markdown="1">
- The framework kept 15 features (Table I), from the URL's length and letter counts to its percent signs.
- Across seven models and two data sets, accuracy with 15 features stayed within 0.04 of accuracy with all features.
- Random forest trained in 2.86 s instead of 6.17 s on the Kaggle data, and in 1.17 s instead of 2.42 s on the UCI data.
- Under a memory cap, random forest and k-nearest neighbors trained only with the reduced feature set.
</div>

<div data-levels="ug grad res" markdown="1">
- **Selection.** Information gain and random-forest importance at a 0.04 cutoff, followed by a GA run ten times, yield the 15 features of Table I; the GA-selected set outperformed the two importance-only sets.
- **Accuracy.** Kaggle accuracy ranges from 0.90 (Naive Bayes) to 0.986 (random forest) with all features and from 0.94 to 0.98 with the 15; UCI accuracy runs from 0.72 to 0.93 with all features and from 0.69 to 0.93 with the 15.
- **Cost.** Training time falls in 9 of 14 classifier and data-set pairs; the reported memory falls in 12 of 14 (k-NN rises from 5.54 to 21.79 on both).
- **Constrained memory.** At a 2.3 GB address-space cap, five of seven models train with the reduced set against three with all features; nothing trains at 2 GB (Table IV).
</div>

<div data-levels="grad res" markdown="1">
<div class="mu-table-wrap">
<table class="results-table mu-wide">
<caption>Table III as printed (Kaggle sample): time in seconds, memory as labeled ("GB"; tracemalloc MiB, per the memory demo), accuracy, precision, and recall.</caption>
<thead><tr><th>Model</th><th>Time</th><th>Mem</th><th>Acc</th><th>Prec</th><th>Rec</th><th>Time (15)</th><th>Mem (15)</th><th>Acc (15)</th><th>Prec (15)</th><th>Rec (15)</th></tr></thead>
<tbody>
<tr><td>Random forest</td><td>6.17</td><td>36.48</td><td>0.986</td><td>0.986</td><td>0.86</td><td>2.86</td><td>13.27</td><td>0.98</td><td>0.95</td><td>0.86</td></tr>
<tr><td>Logistic regression</td><td>0.32</td><td>115</td><td>0.98</td><td>0.89</td><td>0.6</td><td>0.67</td><td>34.46</td><td>0.95</td><td>0.88</td><td>0.57</td></tr>
<tr><td>SVM</td><td>50.68</td><td>92.12</td><td>0.97</td><td>0.98</td><td>0.68</td><td>64.29</td><td>25.69</td><td>0.98</td><td>0.95</td><td>0.67</td></tr>
<tr><td>k-NN</td><td>0.84</td><td>5.54</td><td>0.96</td><td>0.9</td><td>0.58</td><td>0.64</td><td>21.79</td><td>0.96</td><td>0.86</td><td>0.6</td></tr>
<tr><td>Naive Bayes</td><td>0.02</td><td>29.68</td><td>0.9</td><td>0.47</td><td>0.7</td><td>0.01</td><td>8.32</td><td>0.94</td><td>0.66</td><td>0.65</td></tr>
<tr><td>MLP (CPU)</td><td>35.86</td><td>45.07</td><td>0.97</td><td>0.94</td><td>0.9</td><td>127.8</td><td>39.97</td><td>0.98</td><td>0.97</td><td>0.91</td></tr>
<tr><td>MLP (GPU)</td><td>26.82</td><td>17.65</td><td>0.98</td><td>0.96</td><td>0.92</td><td>27.56</td><td>5.9</td><td>0.98</td><td>0.97</td><td>0.89</td></tr>
</tbody>
</table>
</div>
</div>

## Why it matters

<div data-levels="public hs" markdown="1">
Every message, chat, and web page can carry a link, and blocklists of known bad addresses miss new ones that appear every day. A detector that reads only the text of a link can run before anyone clicks, without visiting a dangerous site. Keeping that detector small lets it run on phones, routers, and other modest devices instead of a distant server. Ultimately, the paper shows that a short list of simple clues carries most of what a model needs to protect people at the moment they decide whether to click.
</div>

<div data-levels="ug" markdown="1">
Lexical features are cheap, safe to compute (no page fetch, no code execution), and available the instant a URL arrives, which makes them the natural first stage of a detection pipeline. A smaller feature vector shortens training and inference and shrinks the model's working set, which is what an embedded or edge deployment needs; the authors name the NVIDIA Jetson Orin Nano as their next target. The memory demo also shows a practical lesson for any benchmark: report the units the instrument actually measures.
</div>

<div data-levels="grad res" markdown="1">
The contribution is an engineering case for selection before deployment: a wrapper-confirmed subset that keeps detection quality across six model families while reducing cost, framed for edge AI. Its limits are a single feature-engineering scheme (lexical only), two samples with a fixed 10:1 class ratio, three runs per configuration without variance, and timing on a workstation rather than an embedded target. The authors propose adding host- and content-based features, deploying on a Jetson Orin Nano, and extending selection to heterogeneous data in distributed learning.
</div>

<div data-levels="res" markdown="1">
## Notes from building this page

- **The memory column is in MiB.** `track_memory` prints `peak / 1024 / 1024` after the label "GB." Rerunning the harness on random data of the same shape (109,998 rows, 76,998 for training, float32 features) reproduces the Naive Bayes and k-NN values within 0.3 MiB at 15 and 55 features with scikit-learn 1.3.2, 1.4.2, 1.5.1, and 1.5.2 and with NumPy 1.26.4 and 2.0.1; the original feature count implied by the Naive Bayes slope is 55, the number of features the extractor writes. The paper's text also says "GigaByte." The relative comparisons in Table III are unaffected.
- **The k-NN memory rise is an algorithm switch.** scikit-learn's `KNeighborsClassifier(algorithm="auto")` uses a k-d tree at 15 or fewer features and brute force above, so the reduced set is the only configuration that builds a tree.
- **Feature counts.** The paper says 58 features were extracted and the conclusion says "about 50." The extractor writes 58 columns, three of which are the URL, its type, and its label, leaving 55 features; it computes `count_n`, the English-word count, and the `https` count without writing them.
- **Table I and the code.** "Dots Overall" counts host dots (the same as "Dots in Domain"); "TLD" is a label length that includes any port; "HTTP Prefix" counts "http" anywhere, including inside "https" and in paths; "Average English Words" is a mean word length; "English Words" and "Upper Case Ratio" have no column. The notebook in the repository loads a file with 14 features (including `Count_b`, `Count_g`, `Count_l`, and `Count_www`) and 199,997 rows split nearly evenly between benign and malicious, which matches neither Table I nor the 10:1 samples.
- **Information gain.** The scripts use `mutual_info_classif` (a nearest-neighbor estimate in nats) and take the top ten random-forest features, rather than the plug-in Eq. 3 and a 0.04 threshold on both.
- **Scheme-less URLs.** Python's `urlparse` finds a host only after `//`, so an address such as `example.org/path` gets an empty host and zero dot, hyphen, TLD, and IP features. The data sets' URL formats are not described, so the share of rows affected is unknown.
- **English words.** pyenchant's verdicts depend on the dictionary installed with it (here hunspell en_US 2020.12.07). Single letters are accepted as words, so every isolated letter in a URL counts toward the average word length.
- **Scripts and precision.** Seven classifier scripts in the repository differ in hyperparameters (for example, k = 5 or 3, `SVC` or `LinearSVC`, `lbfgs` or `saga`) and in precision averaging (binary or macro); the paper does not say which produced each row. Every classifier script takes its memory cap as a megabyte argument to `limit_memory`.
- **Logistic regression memory.** The page's harness gives 35.4 and 11.9 MiB at 55 and 15 features, against 115 and 34.46 printed. The printed ratio (3.34) is closer to the feature ratio (3.67) than the page's (2.98); the gap likely reflects a library version or solver setting the paper does not state.
</div>

<div data-levels="hs" markdown="1">
## Try this in class

1. Collect ten web addresses from school websites, news sites, and shopping sites. For each one, count by hand its length, dots in the host name, hyphens in the host name, and capital letters, then check your counts in the first demo.
2. Invent five fake look-alike addresses (use `example.com` names), add them to your table, and look for clues that separate them from the real ones. Discuss which clues a scammer could easily change.
3. In the information-gain demo, set 100 malicious and 1,000 harmless links in total and find a split that scores above 0.04. Explain in one sentence why a pile with ten harmless links for each malicious one starts with less than one bit of uncertainty.
</div>

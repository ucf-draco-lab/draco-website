---
title: "Friends Who Tell: Guarding Private Attributes in a Graph Network"
kicker: "Interactive paper · ACM WWW 2022"
subtitle: "An interactive companion to Hui Hu, Lu Cheng, Jayden Parker Vap, and Mike Borowczak's DP-GCN, a graph neural network meant to keep users' undisclosed attributes hidden when their friends have disclosed theirs."
description: "Guess private users' gender from their friends' answers, find the columns that give it away, remove a direction from the feature space and watch what a straight-line attacker still sees, then train a GCN and DP-GCN on the German credit graph in your browser and compare with the paper's tables."
share_description: "In a social graph, friends who share an attribute reveal it for the users who do not. DP-GCN tries to strip that attribute from what a graph network learns. Train it and attack it in your browser, written for five reading levels."
share_text: "Your friends' answers can give yours away. DP-GCN tries to keep a graph network from learning them. Try the attack in your browser:"
share_image: /papers/gcn-private-attributes/share.png
share_image_alt: "A grid of 350 squares, one per private user in the German credit graph, most filled to show a correct guess of gender from friends' answers, beside the title Friends Who Tell."
date: 2026-10-20
topics: ["AI & machine learning", "Privacy"]
default_level: public
level_hints:
  public: No background needed
  hs: Percentages, tables, and a little algebra
  ug: Programming, linear algebra, and an introduction to neural networks
  grad: Graph neural networks, statistics, and privacy attacks
  res: Full method, reproduction, and open questions
authors:
  - name: Hui Hu
    affiliation: University of Wyoming
  - name: Lu Cheng
    affiliation: Arizona State University
  - name: Jayden Parker Vap
    affiliation: University of Wyoming
  - name: Mike Borowczak
    affiliation: University of Wyoming
    member: mike-borowczak
sources:
  - venue: "ACM Web Conference (WWW) 2022 · pp. 3552–3561"
    title: "Learning Privacy-Preserving Graph Convolutional Network with Partially Observed Sensitive Attributes"
    url: https://doi.org/10.1145/3485447.3511975
    access: Paywalled (ACM)
code:
  label: "The authors' repository is no longer public; this page's engine (dpgcn-engine.js)"
  url: https://github.com/ucf-draco-lab/draco-website/blob/main/papers/gcn-private-attributes/dpgcn-engine.js
citations:
  - wsdm-2022
widget:
  css:
    - /papers/gcn-private-attributes/widget.css
  js:
    - /papers/gcn-private-attributes/dpgcn-engine.js
    - /papers/gcn-private-attributes/widget.js
credit: "Interactive page by the [DRACO Lab](/). The repository named in the paper is no longer public, so the GCN and DP-GCN here are rebuilt from the paper's equations, Algorithm 1, and Table 4. The engine's losses and every gradient (GCN weights, W₁, W₂, and the input gradient that trains W₂) match PyTorch autograd to within 5 × 10⁻¹³, and 50 Adam steps match PyTorch's optimizer to within 2 × 10⁻¹⁵. The German credit graph comes from the [NIFTY repository](https://github.com/chirag126/nifty) (MIT license) that the paper links. From the paper, the page reproduces all 20 values of Figure 4 from Tables 1 and 2, the data set's 1,000 users and 27 attributes, and the plain GCN's German credit accuracy (70.90 ± 2.34 over ten runs here; 72.80 ± 1.79 in Table 1). DP-GCN's drop in the attacker's accuracy on German credit did not reproduce; the researcher notes say why. Everything runs on your device."
bibtex: |
  @inproceedings{hu2022dpgcn,
    author    = {Hu, Hui and Cheng, Lu and Vap, Jayden Parker and Borowczak, Mike},
    title     = {Learning Privacy-Preserving Graph Convolutional Network with Partially Observed Sensitive Attributes},
    booktitle = {Proceedings of the ACM Web Conference 2022 (WWW '22)},
    pages     = {3552--3561},
    year      = {2022},
    doi       = {10.1145/3485447.3511975}
  }
---

<div class="lede" data-levels="public" markdown="1">
Some people list their age, gender, or hometown on a social network; others keep it to themselves. The ones who keep it private can still be found out, because people tend to befriend people like themselves. Hui Hu, Lu Cheng, Jayden Parker Vap, and Mike Borowczak asked how a graph neural network, the kind of model that learns from who is connected to whom, can do its job without picking up the attribute the private users chose to hide. Their answer, DP-GCN, splits each user's other information into a part that tracks the private attribute and a part that does not, and uses only the second part. This page runs the attack and the defense on a real data set of 1,000 loan applicants.
</div>

<div class="lede" data-levels="hs" markdown="1">
A graph is a set of dots (users) joined by lines (friendships). A graph neural network learns about each dot by mixing its own information with its neighbors'. That mixing helps it predict things such as whether a loan applicant is a good credit risk, but it can also leak an attribute a user kept private. If 30 percent of users reveal their gender, a model can guess the rest from their friends and from other columns that travel with gender. DP-GCN, the paper's model, removes the part of each user's information that predicts the private attribute before the network ever sees it. This page shows each leak and then trains both models on 1,000 loan applicants.
</div>

<div class="lede" data-levels="ug" markdown="1">
A graph convolutional network (GCN) computes softmax(Â·ReLU(Â·X·W⁽⁰⁾)·W⁽¹⁾), where Â is the normalized adjacency matrix with self loops: each layer averages features over a node's neighbors. The paper's setting: some users (non-private) reveal a sensitive attribute, the rest (private) do not, and an attacker trains a GCN on the revealed values to infer the hidden ones. DP-GCN learns two d × d matrices, W₁ (mapping the non-sensitive features onto the revealed attribute) and W₂ (kept orthogonal to W₁), and trains the GCN on X·W₂. Across five benchmark graphs the paper reports attacker accuracy down by up to 7.9 percent relative to the baselines, with classification accuracy within about two percent.
</div>

<div class="lede" data-levels="grad" markdown="1">
Hu, Cheng, Vap, and Borowczak study attribute inference against GNNs when sensitive attributes are partially observed: 30 percent of training nodes disclose s, and an adversary trains a GCN on those to label the rest. Two channels leak: user dependency (homophily, amplified by message passing) and attribute dependency (non-sensitive features correlated with s). DP-GCN's disentangled representation module fits W₁ by min ‖X_k W₁ − S_k‖²_F, penalizes ‖W₁ᵀW₂‖²_F, and trains the GCN on X W₂ with alternating Adam updates (Algorithm 1). Tables 1 and 2 report ten-run means on Pokec-z, Pokec-n, German credit, Recidivism, and Credit defaulter. This page rebuilds the model on German credit, measures both channels, and reruns the comparison.
</div>

<div class="lede" data-levels="res" markdown="1">
DP-GCN (WWW 2022) defends a two-layer GCN against attribute inference under partial disclosure by projecting features through W₂ with an orthogonality penalty against W₁, the least-squares map from non-sensitive features to the disclosed attribute (Eq. 3 to 10, Algorithm 1, Table 4). The authors' code link no longer resolves. This page reimplements the method, verifies every gradient against PyTorch, reproduces Figure 4 exactly from Tables 1 and 2 and the plain GCN on German credit within its reported spread, and does not reproduce DP-GCN's privacy gain on that graph at the stated settings. The notes examine why: orthogonality in weight space does not remove linear information about s from X W₂, and the German credit edges carry gender on their own.
</div>

## Your friends answer for you

<div id="dp-friends" class="w-demo"></div>

<div data-levels="public" markdown="1">
Each square is a loan applicant who kept their gender private. The attacker looks at that person's connections who did reveal theirs and guesses the more common answer. Most squares come out filled, meaning the guess was right. Try a bigger or smaller share of users revealing, then switch to **Most common answer** to see how much the friendships add over guessing "man" for everyone.
</div>

<div data-levels="hs" markdown="1">
The applicants are linked when their records look alike, so a private user's links mostly point to people of the same gender. With 30 percent revealing, the friends' vote gets 88.6 percent right on average over ten random splits, against 69 percent for always guessing "man." Switch to **One column: Single** for a second leak: in this data set every applicant marked single is a man.
</div>

<div data-levels="ug grad res" markdown="1">
The attacker here uses no model at all: a majority vote over each private node's disclosed neighbors (ties go to the disclosed majority). Over ten splits at k = 30 percent it scores 88.60 ± 3.08 percent on the 350 private training users, close to the paper's GCN attacker on this graph (92.17 ± 1.93 percent, Table 2). Homophily alone carries most of the leak. In the German credit graph, 80.5 percent of the 21,742 edges join two applicants of the same gender, against 57.2 percent expected for random pairs.
</div>

## Columns that travel with the secret

<div id="dp-columns" class="w-demo"></div>

<div data-levels="public hs" markdown="1">
The bars show how strongly each column of an applicant's record goes along with being a woman. **Single** stands out: the original German survey coded marital status and sex together, and no woman in it is coded single. Removing the gender column does not remove gender. The paper calls this attribute dependency.
</div>

<div data-levels="ug grad res" markdown="1">
Pearson correlations of each min-max-scaled feature with s (1 = woman) over all 1,000 applicants, top ten by magnitude. The one-column rule learns, from disclosed users only, which side of the column's mid-range maps to which gender. **Single** alone reaches 85.94 ± 1.01 percent over ten splits; 548 applicants are single (all men), and the other 452 are 310 women and 142 men. A least-squares linear probe on all 26 non-sensitive features reaches 83.63 ± 1.99 percent. This is the attribute dependency that DP-GCN's W₁ and W₂ target.
</div>

## Taking the secret out of the features

<div id="dp-subspace" class="w-demo"></div>

<div data-levels="public" markdown="1">
Each dot is an applicant, placed left or right by an attacker who draws the best straight line through the records of users who revealed their gender. DP-GCN's idea: find the direction in the data that points toward "woman," and keep only what is at right angles to it. Press **Direction removed** with the paper's direction, and the attacker refits and still separates most women from men. Switch to the correlation direction, a check this page adds, and the straight-line attacker has nothing left.
</div>

<div data-levels="hs" markdown="1">
Think of each applicant's record as an arrow with 26 parts. Removing a direction means flattening every arrow along one line, the way a shadow flattens a shape against a wall. The paper picks the line that best predicts gender. The attacker then looks for the next-best line in what remains, and on this data set it finds one that works almost as well (81 percent right instead of 84). Flattening along the line where gender and the record vary together leaves the straight-line attacker at 69 percent, the same as guessing "man" every time.
</div>

<div data-levels="ug grad res" markdown="1">
With W₁ = wwᵀ/‖w‖² and W₂ = I − W₁, W₁ᵀW₂ = 0 exactly, which is the end point of the paper's orthogonality term, and Theorem 2 holds for every applicant (the check under the chart). Removing the least-squares direction w = (X_kᵀX_k)⁻¹X_kᵀs does not remove linear information: the refitted probe moves to another direction and scores 81.46 ± 2.72 percent. Removing the cross-covariance direction Σ(x − x̄)(s − s̄) over disclosed users leaves zero linear correlation with s on those users, so the refitted probe predicts the base rate and scores 69.00 ± 2.01 percent (the scalar case of LEACE, Belrose et al., 2023). The second direction is this page's addition, not the paper's.
</div>

## Train it and attack it

<div id="dp-run" class="w-demo"></div>

<div data-levels="public hs" markdown="1">
Press **Train and attack** to train a model on your device that predicts whether each applicant is a good credit risk, then train an attacker to guess the private users' gender from what that model uses. A good defense keeps the first number up and pushes the second toward 69 percent. Each run takes a few seconds and uses one of ten random splits of the applicants.
</div>

<div data-levels="ug" markdown="1">
Plain GCN follows the paper's baseline: the attacker infers the hidden s from the original features (200 epochs), and the classifier trains on the features plus disclosed or inferred s (300 epochs, weights kept at the lowest validation loss). DP-GCN alternates one Adam step each on W₁, W₂, and the GCN per epoch, with the paper's Table 4 settings, and the attacker then trains on X W₂. The chart tracks how close W₁ and W₂ come to orthogonal: at the paper's learning rate the normalized ‖W₁ᵀW₂‖ only falls from about 0.20 to 0.15 in 300 epochs.
</div>

<div data-levels="grad res" markdown="1">
Settings follow Table 4 (32 hidden units, dropout 0.5, weight decay 10⁻⁵, learning rate 0.001 for θ, W₁, and W₂, 300 training and 200 inference epochs) with a 50/30/20 split and k = 30 percent (Section 5.1). Over ten splits: plain GCN 70.90 ± 2.34 classification, 88.23 ± 3.77 attacker; DP-GCN (α = 1, β = 5, γ = 1, the Section 5.4.3 setting) 71.00 ± 3.67 and 92.34 ± 2.16. The two exact-removal checks show where the leak goes: removing W₁'s direction exactly gives 71.60 ± 2.16 and 90.03 ± 2.04; removing the correlation direction gives 71.35 ± 3.32 and 75.60 ± 3.15. Accuracy holds; the GCN attacker still beats the 69 percent base rate through the graph.
</div>

## What the paper reports

<div id="dp-tables" class="w-demo"></div>

<div data-levels="public" markdown="1">
- On all five data sets, the attacker guessed private attributes less often against DP-GCN than against a plain graph network, by between 0.5 and 6.8 percent.
- The prediction task lost little: at most about two percent of accuracy, and almost none on the two social-network data sets.
- On the German credit applicants, the attacker's success fell from 92 to 87 percent.
</div>

<div data-levels="hs" markdown="1">
- The paper tested DP-GCN on two social networks from Slovakia (Pokec, about 67,000 users each, with region as the private attribute), German credit applicants (gender), people released on bail (race), and credit card holders (age).
- Against a plain graph network, DP-GCN lowered the attacker's accuracy on every data set, most on Pokec-z (77.35 to 72.06 percent).
- Accuracy on the main task stayed within 1.7 points of the plain network.
- The more users revealed their attribute, the better the attacker did against DP-GCN on most data sets (Figure 6).
</div>

<div data-levels="ug grad res" markdown="1">
- **Privacy.** DP-GCN has the lowest attacker accuracy of the five models on four of five data sets (Table 2); RGCN edges it on Pokec-n (71.14 against 72.99).
- **Utility.** Classification accuracy stays within 1.66 points of plain GCN everywhere (Table 1); RGCN beats DP-GCN on Credit defaulter.
- **Figure 4.** The bars are relative changes, (DP-GCN − baseline) / baseline × 100, not percentage points. All 20 values follow from Tables 1 and 2 to four decimals.
- **Hyperparameters.** Raising α or β lowers attacker accuracy; raising β also costs classification accuracy; raising γ raises both (Figure 5).
- **Inferred attributes.** Feeding inferred s to plain GCN changes accuracy by at most 1.6 points (Table 3).
</div>

<div data-levels="grad res" markdown="1">
<div class="dp-table-wrap"><table class="results-table dp-num">
<thead><tr><th>Model</th><th>Pokec-z</th><th>Pokec-n</th><th>German credit</th><th>Recidivism</th><th>Credit defaulter</th></tr></thead>
<tbody>
<tr><td colspan="6"><em>Table 1. Classification accuracy, % (higher is better)</em></td></tr>
<tr><td>GCN</td><td>84.47 ± 0.13</td><td>86.72 ± 0.43</td><td>72.80 ± 1.79</td><td>93.25 ± 0.25</td><td>80.44 ± 0.24</td></tr>
<tr><td>LA-GCN</td><td>85.63 ± 0.53</td><td>87.62 ± 0.64</td><td>72.91 ± 1.68</td><td>92.13 ± 0.53</td><td>79.87 ± 0.44</td></tr>
<tr><td>RGCN</td><td>84.26 ± 0.08</td><td>86.34 ± 0.12</td><td>70.70 ± 1.99</td><td>90.19 ± 0.59</td><td>79.74 ± 0.32</td></tr>
<tr><td>SGCN</td><td>84.05 ± 0.32</td><td>86.39 ± 0.14</td><td>71.5 ± 3.38</td><td>89.96 ± 0.56</td><td>80.40 ± 0.29</td></tr>
<tr><td>DP-GCN</td><td>84.49 ± 0.11</td><td>86.69 ± 0.19</td><td>72.10 ± 2.56</td><td>91.78 ± 0.76</td><td>78.78 ± 0.91</td></tr>
<tr><td colspan="6"><em>Table 2. Attacker accuracy on private users, % (lower is better)</em></td></tr>
<tr><td>GCN</td><td>77.35 ± 1.29</td><td>77.19 ± 2.01</td><td>92.17 ± 1.93</td><td>58.55 ± 0.51</td><td>91.13 ± 0.42</td></tr>
<tr><td>LA-GCN</td><td>78.21 ± 1.71</td><td>77.58 ± 2.09</td><td>93.14 ± 2.11</td><td>54.93 ± 1.46</td><td>91.08 ± 0.40</td></tr>
<tr><td>RGCN</td><td>72.19 ± 0.39</td><td>71.14 ± 0.26</td><td>91.31 ± 2.69</td><td>54.95 ± 0.44</td><td>90.93 ± 0.33</td></tr>
<tr><td>SGCN</td><td>79.31 ± 0.25</td><td>81.60 ± 0.37</td><td>92.57 ± 1.57</td><td>54.98 ± 0.57</td><td>90.85 ± 0.42</td></tr>
<tr><td>DP-GCN</td><td>72.06 ± 1.22</td><td>72.99 ± 2.09</td><td>87.26 ± 3.84</td><td>54.87 ± 0.97</td><td>90.62 ± 0.51</td></tr>
</tbody></table></div>

<div class="dp-table-wrap"><table class="results-table dp-num">
<thead><tr><th>German credit, ten runs on this page (k = 30%)</th><th>Classification, %</th><th>Attacker, %</th><th>Linear probe, %</th></tr></thead>
<tbody>
<tr><td>Friends' vote (no model)</td><td>–</td><td>88.60 ± 3.08</td><td>–</td></tr>
<tr><td>Plain GCN</td><td>70.90 ± 2.34</td><td>88.23 ± 3.77</td><td>83.63 ± 1.99</td></tr>
<tr><td>DP-GCN, paper settings</td><td>71.00 ± 3.67</td><td>92.34 ± 2.16</td><td>83.66 ± 1.98</td></tr>
<tr><td>W₁ direction removed exactly (page)</td><td>71.60 ± 2.16</td><td>90.03 ± 2.04</td><td>81.46 ± 2.72</td></tr>
<tr><td>Correlation direction removed (page)</td><td>71.35 ± 3.32</td><td>75.60 ± 3.15</td><td>69.00 ± 2.01</td></tr>
</tbody></table></div>
</div>

## Why it matters

<div data-levels="public hs" markdown="1">
Keeping a box unchecked on a profile does not keep a fact private when the people around you checked it. The paper names that problem for graph neural networks, which power friend suggestions, feeds, and fraud screens, and offers one way for the model's builder to protect the users who opted out. The demos above also show how hard the problem is: on this data set the friendships alone give away gender almost nine times out of ten.
</div>

<div data-levels="ug grad res" markdown="1">
Most privacy-preserving GNN work assumes the defender knows every user's sensitive attribute, which defeats the purpose for users who withheld it. DP-GCN works from the disclosed subset only, needs no trusted server or added noise, and costs little accuracy in the paper's experiments. The authors list nonlinear disentanglement, other GNN architectures, and evolving networks as next steps. The reproduction here adds a design lesson for that work: a defense has to address the graph channel as well as the feature channel, and a feature-space projection should be judged by what a refitted attacker can still recover.
</div>

<div data-levels="hs" markdown="1">
### Try it in class

1. Draw ten classmates as dots and connect friends with lines. Have half write a favorite sport on a card; keep the other half secret.
2. For each secret dot, guess the most common sport among its revealed friends. Count how many guesses were right, as a percentage.
3. Now hide one more fact, such as which team jersey students wear. Discuss which facts on a profile travel with the secret, and how removing the secret column alone leaves it exposed.
</div>

<div data-levels="res" markdown="1">
## Notes from building this page

These are the page's own observations, offered for discussion with the authors.

- **Reproduction scope.** Only German credit (1,000 nodes) runs in a browser. The plain GCN matches Table 1 (70.90 ± 2.34 here against 72.80 ± 1.79) and comes in under Table 2 (88.23 ± 3.77 against 92.17 ± 1.93). DP-GCN at the stated settings does not lower the attacker's accuracy here (92.34 ± 2.16 against the paper's 87.26 ± 3.84). The authors' tuned α, β, γ per data set and their unpublished code may account for part of the gap.
- **Orthogonality is barely reached.** With N(0, 1) initialization of two 26 × 26 matrices, Adam at 0.001, and one step per epoch, W₁ and W₂ move at most about 0.3 per entry in 300 epochs, and the normalized ‖W₁ᵀW₂‖ falls only from 0.200 to 0.153. W₂ stays close to a random matrix, and X W₂ keeps nearly all of X's information. Driving the residual to 10⁻⁵ (20 inner steps at 0.01, or five at 0.05 with β = 10) leaves the attacker at 89.1 to 89.4 percent on split 1.
- **Weight-space orthogonality is not linear erasure.** W₁ᵀW₂ = 0 removes the column space of W₁ from X W₂, but the least-squares direction is not the direction of linear information: after exact removal, a refitted probe still scores 81.46 percent. Removing the cross-covariance direction instead drops the probe to the base rate and the GCN attacker to 75.60 percent, with no loss of classification accuracy. Theorem 2 (W₁x ⊥ W₂x) holds in both cases, so it does not by itself certify privacy.
- **The German credit graph carries gender in its edges.** The NIFTY loader builds edges from feature similarity over a column list that includes gender; 80.5 percent of the 21,742 edges are same-gender, and a neighbor vote with no features scores 88.60 percent. No feature transform can close that channel.
- **Row and column conventions.** Eq. 3 and Algorithm 1 multiply row vectors (X_kW₁, X W₂), while Theorem 2 and Eq. 5 use column vectors (W₁x, W₂x). For the row form the training uses, each user's two latent vectors are orthogonal when W₁W₂ᵀ = 0; the penalty ‖W₁ᵀW₂‖²_F enforces W₁ᵀW₂ = 0. The two coincide for symmetric W₁ and W₂ (as in the page's check), not in general.
- **Shapes in Eq. 3.** W₁ is d × d while S_k holds one attribute per user, so ‖X_kW₁ − S_k‖ needs S_k repeated across d columns (as here) or W₁ of size d × 1. The paper does not say which.
- **Classification near the base rate.** On German credit, 700 of 1,000 applicants are good risks; every model in Table 1 lands between 70.70 and 72.91 percent, a spread of about one standard deviation, so Table 1 cannot separate the methods there.
- **Figure 4 reports relative change.** The text's "reduces the privacy inference accuracy by 5.44%" on Pokec-n is (77.19 − 72.99) / 77.19, a 4.20-point drop.
- **Section 5.2 text.** The RGCN comparison lists "Credit: 78.78 vs. 79.74," where RGCN is higher; the sentence says "most datasets," so the claim stands.
</div>

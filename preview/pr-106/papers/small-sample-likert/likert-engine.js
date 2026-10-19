/*
  Likert engine for /papers/small-sample-likert/.

  Reproduces the computations in Kilty, Kilty, Borowczak, and Borowczak,
  "Quantitative Techniques with Small Sample Sizes: An Educational Summer
  Camp Example," Problems of Education in the 21st Century 82(4):507-520 (2024),
  doi:10.33225/pec/24.82.507.

  The paper's own steps:
    - Dirichlet-smoothed category probabilities, p_i = (alpha + f_i) / (k*alpha + N),
      with alpha = 1 (the paper's uniform prior);
    - the multinomial probability of a set of counts under a probability vector;
    - the likelihood ratio printed in Tables 1 and 2, and the Bayes update of
      the null hypothesis from even prior odds.

  The page's own additions (graduate and researcher levels only):
    - the likelihood ratio as the Methods section defines it (one data set,
      two hypotheses);
    - an exact multinomial test that enumerates every possible table;
    - Pearson's chi-squared and the G statistic with their chi-squared
      approximations;
    - a Dirichlet-multinomial Bayes factor for "same distribution".

  Loads as a page script or in a Web Worker.
*/
(function (root) {
  "use strict";

  var LN_FACT = [0];
  function lnFact(n) {
    for (var i = LN_FACT.length; i <= n; i++) LN_FACT[i] = LN_FACT[i - 1] + Math.log(i);
    return LN_FACT[n];
  }

  function sum(a) { var s = 0; for (var i = 0; i < a.length; i++) s += a[i]; return s; }

  // Posterior mean of a symmetric Dirichlet(alpha) prior after observing counts.
  function smooth(counts, alpha) {
    if (alpha === undefined) alpha = 1;
    var n = sum(counts), k = counts.length, d = k * alpha + n;
    return counts.map(function (f) { return d > 0 ? (alpha + f) / d : 0; });
  }

  function roundTo(p, places) {
    var m = Math.pow(10, places);
    return p.map(function (x) { return Math.round(x * m) / m; });
  }

  // ln P(counts | p). withCoef adds ln N!/(x1!...xk!). Returns -Infinity when
  // a category with zero probability holds a count.
  function lnMultinomial(counts, p, withCoef) {
    var s = 0;
    for (var i = 0; i < counts.length; i++) {
      if (counts[i] === 0) continue;
      if (!(p[i] > 0)) return -Infinity;
      s += counts[i] * Math.log(p[i]);
    }
    if (withCoef) {
      s += lnFact(sum(counts));
      for (var j = 0; j < counts.length; j++) s -= lnFact(counts[j]);
    }
    return s;
  }

  function multinomial(counts, p, withCoef) { return Math.exp(lnMultinomial(counts, p, withCoef)); }

  // The ratio printed in the paper's tables: the probability of one observed
  // table over the probability of another, both under the same hypothesis
  // probabilities. Options: coef (default true), round (decimal places, default 3;
  // null for none). Reproduces Table 2 (12.1) and Table 1, pooled column (0.819).
  function paperRatio(countsA, countsB, probs, opts) {
    opts = opts || {};
    var coef = opts.coef !== false;
    var places = opts.round === undefined ? 3 : opts.round;
    var p = places === null ? probs : roundTo(probs, places);
    return Math.exp(lnMultinomial(countsA, p, coef) - lnMultinomial(countsB, p, coef));
  }

  // The likelihood ratio as the Methods define it: one data set under two
  // hypotheses. The multinomial coefficient cancels.
  function likelihoodRatio(counts, pNum, pDen) {
    return Math.exp(lnMultinomial(counts, pNum, false) - lnMultinomial(counts, pDen, false));
  }

  // P(H0 | data) from prior P(H0) and LR = P(data | H1) / P(data | H0).
  function posteriorNull(lr, priorNull) {
    if (priorNull === undefined) priorNull = 0.5;
    if (priorNull <= 0) return 0;
    if (priorNull >= 1) return 1;
    return priorNull / (priorNull + (1 - priorNull) * lr);
  }

  /* ------------------------------------------------ chi-squared distribution */

  function lnGamma(x) {
    var g = [676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059,
      12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
    if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - lnGamma(1 - x);
    x -= 1;
    var a = 0.99999999999980993, t = x + 7.5;
    for (var i = 0; i < 8; i++) a += g[i] / (x + i + 1);
    return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
  }

  // Upper regularized incomplete gamma Q(s, x).
  function gammaQ(s, x) {
    if (x <= 0) return 1;
    var lg = lnGamma(s);
    if (x < s + 1) {
      var term = 1 / s, total = term;
      for (var n = 1; n < 500; n++) { term *= x / (s + n); total += term; if (Math.abs(term) < Math.abs(total) * 1e-15) break; }
      return 1 - total * Math.exp(-x + s * Math.log(x) - lg);
    }
    var b = x + 1 - s, c = 1 / 1e-300, d = 1 / b, h = d;
    for (var i = 1; i < 500; i++) {
      var an = -i * (i - s);
      b += 2;
      d = an * d + b; if (Math.abs(d) < 1e-300) d = 1e-300;
      c = b + an / c; if (Math.abs(c) < 1e-300) c = 1e-300;
      d = 1 / d;
      var del = d * c; h *= del;
      if (Math.abs(del - 1) < 1e-15) break;
    }
    return Math.exp(-x + s * Math.log(x) - lg) * h;
  }

  function chiSquareSF(x, df) { return gammaQ(df / 2, x / 2); }

  function pearson(counts, p) {
    var n = sum(counts), x = 0;
    for (var i = 0; i < counts.length; i++) { var e = n * p[i]; if (e > 0) x += (counts[i] - e) * (counts[i] - e) / e; }
    return x;
  }

  function gStat(counts, p) {
    var n = sum(counts), g = 0;
    for (var i = 0; i < counts.length; i++) if (counts[i] > 0) g += counts[i] * Math.log(counts[i] / (n * p[i]));
    return 2 * g;
  }

  /* ------------------------------------------------ exact multinomial test */

  // Calls fn(table) for every way to place n answers in k categories.
  function forEachTable(n, k, fn) {
    var t = new Array(k);
    (function rec(i, left) {
      if (i === k - 1) { t[i] = left; fn(t); return; }
      for (var v = 0; v <= left; v++) { t[i] = v; rec(i + 1, left - v); }
    })(0, n);
  }

  function countTables(n, k) {
    // C(n + k - 1, k - 1)
    var r = 1;
    for (var i = 1; i < k; i++) r = r * (n + i) / i;
    return Math.round(r);
  }

  // Exact goodness-of-fit test of counts against fixed probabilities p.
  // Returns exact p-values for three orderings of "at least as extreme":
  //   prob  - tables no more probable than the observed one (Resin 2023; XNomial "probability")
  //   chisq - Pearson's statistic at least as large
  //   g     - the G (log likelihood ratio) statistic at least as large
  // plus the chi-squared approximations and the distribution of Pearson's statistic.
  function exactTest(counts, p, opts) {
    opts = opts || {};
    var n = sum(counts), k = counts.length, tol = 1e-9;
    var lnObs = lnMultinomial(counts, p, true);
    var xObs = pearson(counts, p), gObs = gStat(counts, p);
    var pr = 0, px = 0, pg = 0, total = 0, tables = 0;
    var bins = opts.bins || 0, hist = bins ? new Float64Array(bins) : null, xmax = opts.xmax || 0;
    forEachTable(n, k, function (t) {
      var lnq = lnMultinomial(t, p, true);
      var q = lnq === -Infinity ? 0 : Math.exp(lnq);
      tables++; total += q;
      if (lnq <= lnObs + tol) pr += q;
      var x = pearson(t, p);
      if (x >= xObs - tol) px += q;
      if (gStat(t, p) >= gObs - tol) pg += q;
      if (hist && xmax > 0) { var b = Math.min(bins - 1, Math.floor(x / xmax * bins)); hist[b] += q; }
    });
    return {
      n: n, tables: tables, total: total,
      pProb: pr, pChisq: px, pG: pg,
      chisq: xObs, g: gObs, df: k - 1,
      pChisqApprox: chiSquareSF(xObs, k - 1), pGApprox: chiSquareSF(gObs, k - 1),
      expected: p.map(function (q) { return n * q; }),
      hist: hist, xmax: xmax
    };
  }

  /* ------------------------------------------------ Bayes factor */

  // ln of the Dirichlet-multinomial marginal probability of a sequence of
  // answers with these counts (coefficient omitted; it cancels below).
  function lnMarginal(counts, alpha) {
    if (alpha === undefined) alpha = 1;
    var k = counts.length, n = sum(counts), s = lnGamma(k * alpha) - lnGamma(k * alpha + n);
    for (var i = 0; i < k; i++) s += lnGamma(alpha + counts[i]) - lnGamma(alpha);
    return s;
  }

  // Bayes factor for "the two groups answer from different distributions"
  // against "one shared distribution", each with a uniform Dirichlet prior.
  function bayesFactorDifferent(a, b, alpha) {
    var pooled = a.map(function (x, i) { return x + b[i]; });
    return Math.exp(lnMarginal(a, alpha) + lnMarginal(b, alpha) - lnMarginal(pooled, alpha));
  }

  /* ------------------------------------------------ the paper's data */

  var DATA = {
    item: "GW27",
    statement: "I rarely feel relaxed within a group.",
    categories: ["Not at all true of me", "Partly not true of me", "Neutral", "Partly true of me", "Very true of me"],
    short: ["Not at all", "Partly not", "Neutral", "Partly true", "Very true"],
    pre2022: [1, 3, 3, 1, 1],   // Table 1, N = 9
    pre2023: [3, 1, 2, 1, 1],   // Table 1, N = 8
    prePooled: [4, 4, 5, 2, 2], // Table 2, N = 17
    post: [1, 4, 7, 1, 4],      // Table 2, N = 17
    table1: { p2022: [0.143, 0.286, 0.286, 0.143, 0.143], pPooled: [0.227, 0.227, 0.273, 0.136, 0.136], lr2022: 2.6, lrPooled: 0.819 },
    table2: { pPre: [0.227, 0.227, 0.273, 0.136, 0.136], lr: 12.1 },
    posteriorPercent: 7.6
  };

  root.LikertEngine = {
    smooth: smooth, roundTo: roundTo, lnFact: lnFact, sum: sum,
    lnMultinomial: lnMultinomial, multinomial: multinomial,
    paperRatio: paperRatio, likelihoodRatio: likelihoodRatio, posteriorNull: posteriorNull,
    pearson: pearson, gStat: gStat, chiSquareSF: chiSquareSF, lnGamma: lnGamma,
    forEachTable: forEachTable, countTables: countTables, exactTest: exactTest,
    lnMarginal: lnMarginal, bayesFactorDifferent: bayesFactorDifferent,
    DATA: DATA
  };
})(typeof self !== "undefined" ? self : this);

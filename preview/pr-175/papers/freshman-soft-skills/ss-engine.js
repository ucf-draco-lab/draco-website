/*
  Engine for /papers/freshman-soft-skills/.
  Burrows (Borowczak) and Borowczak, "Hardening Freshman Engineering Student Soft
  Skills," First Year Engineering Experience (FYEE) Conference 2017
  (DOI 10.18260/1-2--29416).

  DATA holds the paper's printed values: the six questions and full-credit answers
  (Table I), pre- and post-test results by class standing for the 18 in-class
  students (Tables II and III), means, standard deviations, and paired t-test
  bounds (Table IV), the early and upper-level pre-test averages for all 55
  participants (Table V), and the participant counts from the text.

  The rest is the page's own arithmetic:
    - weighted(): Table IV's overall means rebuilt from the Table II and III rows;
    - reconstruct(): every list of 18 partial-credit scores that reproduces a
      question's printed mean, standard deviation, and class-standing averages;
    - pairedRange(): the smallest and largest paired t (and p) any pairing of a
      consistent pre list with a consistent post list allows;
    - fTest(): the two-tailed variance-ratio F-test on Table V's six averages per
      group, which returns p = 0.852 (the paper prints p > 0.85);
    - t-tests and the t, F, and incomplete-beta functions they need.
  Loads as a page script or in a Web Worker.
*/
(function (root) {
  "use strict";

  var DATA = {
    // Table I. unit = the partial-credit step this page infers (see reconstruct()).
    questions: [
      { id: 1, short: "ABET", text: "What is ABET?",
        full: "Accreditation Board for Engineering (and Technology)", unit: 5 },
      { id: 2, short: "ABET's job", text: "What does ABET do?",
        full: "Accredits engineering and computer science programs against criteria on students, faculty, administration, curriculum, and facilities", unit: 5 },
      { id: 3, short: "Soft skills", text: "What are “soft skills” as described by ABET?",
        full: "At least five items from the student outcomes (Criterion 3) of the EAC and CAC criteria", unit: 5 },
      { id: 4, short: "Partnerships", text: "What are essential components of successful partnerships?",
        full: "Common objectives, mutual benefit, communication, effective conflict resolution, and similar", unit: 5 },
      { id: 5, short: "Conflict types", text: "What are three (3) main types of conflict?",
        full: "Resource, objective (goals), and identity", unit: 3 },
      { id: 6, short: "Conflict approaches", text: "What are the four (4) main ways to approach a conflict?",
        full: "Antagonism, resonance, invention, and action", unit: 4 }
    ],

    // In-class class standing (text): 1 sophomore, 3 juniors, 14 seniors.
    groups: [
      { id: "so", name: "Sophomore", n: 1 },
      { id: "jr", name: "Junior", n: 3 },
      { id: "sr", name: "Senior", n: 14 }
    ],
    // Table II (pre) and Table III (post), percent, by class standing and overall.
    pre: {
      so: [0, 0, 0, 0, 0, 0],
      jr: [33, 0, 0, 40, 22, 8],
      sr: [14, 14, 11, 19, 2, 2],
      all: [17, 11, 9, 21, 6, 3]
    },
    post: {
      so: [100, 60, 60, 100, 100, 100],
      jr: [93, 87, 67, 87, 100, 100],
      sr: [96, 80, 79, 86, 67, 57],
      all: [96, 80, 76, 87, 74, 67]
    },
    // Table IV: mean and standard deviation (percent) and the printed p bound.
    t4: {
      preMean:  [16.67, 11.11, 8.89, 21.11, 5.56, 2.78],
      preSD:    [31.62, 25.87, 18.44, 25.18, 17.15, 8.08],
      postMean: [95.56, 80.00, 75.56, 86.67, 74.07, 66.67],
      postSD:   [10.97, 25.67, 27.06, 25.67, 43.62, 46.18],
      pBound:   [-7, -6, -7, -5, -5, -4]   // printed as p < 1 x 10^bound
    },
    // Table V: pre-test averages for all 55 participants (percent).
    t5: {
      early: { n: 16, label: "Freshmen and sophomores", pct: [15.00, 11.25, 5.00, 28.75, 12.50, 15.63] },
      upper: { n: 39, label: "Juniors and seniors", pct: [23.59, 22.56, 11.28, 33.85, 14.53, 12.82] },
      pPrinted: 0.85
    },
    // Participants (text).
    cohorts: {
      inclass: { n: 18, enrolled: 33, fr: 0, so: 1, jr: 3, sr: 14 },
      online:  { n: 37, invited: 150, fr: 7, so: 8, jr: 16, sr: 6 },
      all:     { n: 55, fr: 7, so: 9, jr: 19, sr: 20 }
    }
  };

  /* ----------------------------------------------------- special functions */

  function lgamma(x) {
    var c = [76.18009172947146, -86.50532032941677, 24.01409824083091,
      -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
    var y = x, tmp = x + 5.5;
    tmp -= (x + 0.5) * Math.log(tmp);
    var ser = 1.000000000190015;
    for (var j = 0; j < 6; j++) ser += c[j] / ++y;
    return -tmp + Math.log(2.5066282746310005 * ser / x);
  }
  function betacf(a, b, x) {
    var MAXIT = 300, EPS = 3e-16, FPMIN = 1e-300;
    var qab = a + b, qap = a + 1, qam = a - 1, c = 1, d = 1 - qab * x / qap;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    d = 1 / d;
    var h = d;
    for (var m = 1; m <= MAXIT; m++) {
      var m2 = 2 * m, aa = m * (b - m) * x / ((qam + m2) * (a + m2));
      d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
      c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
      d = 1 / d; h *= d * c;
      aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
      d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
      c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
      d = 1 / d;
      var del = d * c; h *= del;
      if (Math.abs(del - 1) < EPS) break;
    }
    return h;
  }
  // Regularized incomplete beta I_x(a, b).
  function ibeta(x, a, b) {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    var bt = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x));
    if (x < (a + 1) / (a + b + 2)) return bt * betacf(a, b, x) / a;
    return 1 - bt * betacf(b, a, 1 - x) / b;
  }
  function tTwoSided(t, df) { return ibeta(df / (df + t * t), df / 2, 0.5); }
  function fCdf(F, d1, d2) { return F <= 0 ? 0 : ibeta(d1 * F / (d1 * F + d2), d1 / 2, d2 / 2); }

  /* --------------------------------------------------------- small stats */

  function mean(a) { var s = 0; a.forEach(function (v) { s += v; }); return s / a.length; }
  function sampleVar(a) {
    var m = mean(a), s = 0;
    a.forEach(function (v) { s += (v - m) * (v - m); });
    return s / (a.length - 1);
  }

  // Two-tailed variance-ratio F-test (the test spreadsheet F.TEST performs).
  function fTest(a, b) {
    var F = sampleVar(a) / sampleVar(b), d1 = a.length - 1, d2 = b.length - 1;
    var c = fCdf(F, d1, d2);
    return { F: F, df1: d1, df2: d2, p: 2 * Math.min(c, 1 - c) };
  }
  // Student's two-sample t-test (equal variances).
  function tIndependent(a, b) {
    var na = a.length, nb = b.length;
    var sp = ((na - 1) * sampleVar(a) + (nb - 1) * sampleVar(b)) / (na + nb - 2);
    var t = (mean(a) - mean(b)) / Math.sqrt(sp * (1 / na + 1 / nb));
    var df = na + nb - 2;
    return { t: t, df: df, p: tTwoSided(t, df) };
  }
  // Paired t-test.
  function tPaired(a, b) {
    var d = a.map(function (v, i) { return b[i] - v; });
    var t = mean(d) / Math.sqrt(sampleVar(d) / d.length), df = d.length - 1;
    return { t: t, df: df, p: tTwoSided(t, df) };
  }

  /* ------------------------------------------------ Table IV from II, III */

  // Weighted overall mean from the rounded class-standing rows (1, 3, and 14 students).
  function weighted(side, q) {
    var rows = DATA[side], s = 0, n = 0;
    DATA.groups.forEach(function (g) { s += g.n * rows[g.id][q]; n += g.n; });
    return s / n;
  }

  /* ------------------------------------------------------- reconstruction */

  function near(x, target, tol) { return Math.abs(x - target) <= tol + 1e-9; }

  // Multisets of n scores in 0..k (non-decreasing), as arrays of integers.
  function multisets(n, k) {
    var out = [], cur = [];
    (function rec(start, left) {
      if (left === 0) { out.push(cur.slice()); return; }
      for (var v = start; v <= k; v++) { cur.push(v); rec(v, left - 1); cur.pop(); }
    })(0, n);
    return out;
  }

  // Every list of 18 scores (each 0..k steps of 1/k) whose class-standing averages
  // round to Table II or III, and whose mean and sample SD round to Table IV.
  function reconstruct(q, side, k) {
    k = k || DATA.questions[q].unit;
    var rows = DATA[side];
    var M = DATA.t4[side + "Mean"][q], S = DATA.t4[side + "SD"][q];
    var opts = {};
    DATA.groups.forEach(function (g) {
      opts[g.id] = multisets(g.n, k).filter(function (c) {
        var s = 0; c.forEach(function (v) { s += v; });
        return near(100 * s / (k * g.n), rows[g.id][q], 0.5);
      }).map(function (c) {
        var s = 0, s2 = 0; c.forEach(function (v) { s += v; s2 += v * v; });
        return { c: c, s: s, s2: s2 };
      });
    });
    var sols = [], N = 18;
    opts.so.forEach(function (a) {
      opts.jr.forEach(function (b) {
        opts.sr.forEach(function (r) {
          var s = (a.s + b.s + r.s) / k, s2 = (a.s2 + b.s2 + r.s2) / (k * k);
          var m = s / N;
          if (!near(100 * m, M, 0.005)) return;
          var v = (s2 - N * m * m) / (N - 1);
          if (!near(100 * Math.sqrt(Math.max(0, v)), S, 0.005)) return;
          sols.push({ so: a.c, jr: b.c, sr: r.c, k: k, mean: m, sd: Math.sqrt(v) });
        });
      });
    });
    return sols;
  }

  // Histogram of a reconstructed list: counts of students at 0, 1/k, ..., k/k.
  function histogram(sol) {
    var h = []; for (var i = 0; i <= sol.k; i++) h.push(0);
    ["so", "jr", "sr"].forEach(function (g) { sol[g].forEach(function (v) { h[v]++; }); });
    return h;
  }

  // Paired t for one pre list and one post list; students pair only within their
  // class standing. order = 1 pairs low with low (largest t), -1 low with high (smallest t).
  function pairedFor(pre, post, order) {
    var a = [], b = [];
    ["so", "jr", "sr"].forEach(function (g) {
      var x = pre[g].slice().sort(function (u, v) { return u - v; });
      var y = post[g].slice().sort(function (u, v) { return order > 0 ? u - v : v - u; });
      x.forEach(function (v, i) { a.push(v / pre.k); b.push(y[i] / post.k); });
    });
    return tPaired(a, b);
  }

  // Range of paired t and two-tailed p across every consistent pre list, post list, and pairing.
  function pairedRange(preSols, postSols) {
    var lo = null, hi = null;
    preSols.forEach(function (a) {
      postSols.forEach(function (b) {
        [1, -1].forEach(function (o) {
          var r = pairedFor(a, b, o);
          if (!isFinite(r.t)) return;
          if (!lo || r.t < lo.t) lo = r;
          if (!hi || r.t > hi.t) hi = r;
        });
      });
    });
    if (!lo) return null;
    return { tMin: lo.t, tMax: hi.t, pMax: lo.p, pMin: hi.p, df: lo.df };
  }

  function analyze(q, k) {
    var pre = reconstruct(q, "pre", k), post = reconstruct(q, "post", k);
    return { q: q, k: k || DATA.questions[q].unit, pre: pre, post: post, range: pairedRange(pre, post) };
  }

  var api = {
    DATA: DATA,
    weighted: weighted,
    reconstruct: reconstruct,
    histogram: histogram,
    pairedRange: pairedRange,
    analyze: analyze,
    fTest: fTest,
    tIndependent: tIndependent,
    tPaired: tPaired,
    tTwoSided: tTwoSided,
    fCdf: fCdf,
    mean: mean,
    sampleVar: sampleVar
  };
  root.SoftSkillsEngine = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof self !== "undefined" ? self : this);

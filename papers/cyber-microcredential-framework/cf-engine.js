/*
  Arithmetic for /papers/cyber-microcredential-framework/.

  Mugayitoglu, Borowczak, and Burrows (2021), "A University's Developmental
  Framework: Creating, Implementing, and Evaluating a K-12 Teacher
  Cybersecurity Micro-credential Course," Journal of Systemics, Cybernetics
  and Informatics 19(2).

  Everything here is either a number printed in the paper (PAPER) or a
  computation the page runs on those numbers:
    - shareCounts / reconstruct: which whole counts produce a printed percent
    - pearson, pFromR, criticalR, nForP: the correlation test the paper names
    - simulate: a labeled, simulated class of teachers for the mixing demo
  Loads as a page script or in a worker; no dependencies.
*/
(function (root) {
  "use strict";

  /* ------------------------------------------------------- printed values */

  var PAPER = {
    pilots: {
      1: { enrolled: 9, completed: 5, weeks: 4, days: 28, start: "July 1", end: "July 28",
           modules: ["0 Introduction to Cybersecurity", "1 CIA Triad"],
           interviews: 5, focusGroups: 1, progressReports: 2, cs: 4, noncs: 1,
           race: { "White": 60, "Native American": 20, "Scotch-Irish": 20 },
           gender: { "Female": 60, "Male": 40 }, genderCounts: { "Female": 3, "Male": 2 } },
      2: { enrolled: 16, completed: 16, weeks: 6, days: 42, start: "November 20", end: "December 31",
           modules: ["0 Introduction to Cybersecurity", "1 CIA Triad", "2 Abstraction", "3 Modularity", "4 Least Privilege"],
           interviews: 8, focusGroups: 1, progressReports: 2, cs: 7, noncs: 9,
           race: { "White": 74, "Asian/Pacific Islander": 13, "Native American": 13 },
           gender: { "Female": 69, "Male": 31 }, genderCounts: { "Female": 11, "Male": 5 } }
    },
    combined: {
      n: 21,
      race: { "White": 71, "Native American": 14, "Asian/Pacific Islander": 10, "Scotch-Irish": 5 },
      gender: { "Female": 67, "Male": 33 }
    },
    correlations: [
      { id: "assess", label: "Assessment scores vs. hours in modules", r: -0.14, printed: "r = \u22120.14, p < 0.05", words: "weak negative" },
      { id: "lesson", label: "Lesson plan scores vs. hours in modules", r: -0.23, printed: "r = \u22120.23, p < 0.05", words: "weak negative" }
    ]
  };

  /* ------------------------------------------------- shares and counts */

  // Whole counts k (0..n) whose share 100k/n rounds (half up) to pct.
  function shareCounts(pct, n) {
    var out = [];
    for (var k = 0; k <= n; k++) if (Math.floor(100 * k / n + 0.5) === pct) out.push(k);
    return out;
  }

  // Combined race counts out of 21 from Pilot 1 (n = 5) and Pilot 2 (n = 16):
  // enumerate every Pilot 2 split of 16 over its three printed groups, add
  // Pilot 1's counts implied by its printed shares, and keep the splits whose
  // combined shares print exactly as the paper's combined row.
  function reconstruct() {
    var p1 = PAPER.pilots[1], p2 = PAPER.pilots[2], comb = PAPER.combined;
    var p1c = {};
    Object.keys(p1.race).forEach(function (g) {
      var ks = shareCounts(p1.race[g], p1.completed);
      p1c[g] = ks.length === 1 ? ks[0] : null;
    });
    var groups2 = Object.keys(p2.race);
    var all = Object.keys(comb.race);
    var solutions = [];
    for (var a = 0; a <= 16; a++) for (var b = 0; a + b <= 16; b++) {
      var c = 16 - a - b;
      var p2c = {}; p2c[groups2[0]] = a; p2c[groups2[1]] = b; p2c[groups2[2]] = c;
      var ok = all.every(function (g) {
        var k = (p1c[g] || 0) + (p2c[g] || 0);
        return Math.floor(100 * k / comb.n + 0.5) === comb.race[g];
      });
      if (ok) solutions.push({ pilot1: p1c, pilot2: p2c });
    }
    return solutions;
  }

  /* ------------------------------------------------------ correlation */

  function mean(xs) { var s = 0; for (var i = 0; i < xs.length; i++) s += xs[i]; return s / xs.length; }

  function pearson(xs, ys) {
    var mx = mean(xs), my = mean(ys), sxy = 0, sxx = 0, syy = 0;
    for (var i = 0; i < xs.length; i++) {
      var dx = xs[i] - mx, dy = ys[i] - my;
      sxy += dx * dy; sxx += dx * dx; syy += dy * dy;
    }
    return sxx > 0 && syy > 0 ? sxy / Math.sqrt(sxx * syy) : 0;
  }

  // Least-squares slope of y on x.
  function slope(xs, ys) {
    var mx = mean(xs), my = mean(ys), sxy = 0, sxx = 0;
    for (var i = 0; i < xs.length; i++) { sxy += (xs[i] - mx) * (ys[i] - my); sxx += (xs[i] - mx) * (xs[i] - mx); }
    return sxx > 0 ? sxy / sxx : 0;
  }

  // log Gamma (Lanczos, g = 7, n = 9).
  var LG = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313,
    -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
  function lgamma(x) {
    if (x < 0.5) return Math.log(Math.PI / Math.abs(Math.sin(Math.PI * x))) - lgamma(1 - x);
    x -= 1;
    var a = LG[0], t = x + 7.5;
    for (var i = 1; i < 9; i++) a += LG[i] / (x + i);
    return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
  }

  // Continued fraction for the regularized incomplete beta (Numerical Recipes betacf).
  function betacf(a, b, x) {
    var MAXIT = 300, EPS = 1e-15, FPMIN = 1e-300;
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
      var del = d * c;
      h *= del;
      if (Math.abs(del - 1) < EPS) break;
    }
    return h;
  }

  function ibeta(x, a, b) {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    var bt = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x));
    if (x < (a + 1) / (a + b + 2)) return bt * betacf(a, b, x) / a;
    return 1 - bt * betacf(b, a, 1 - x) / b;
  }

  // Two-sided p for Student's t with df degrees of freedom.
  function pFromT(t, df) { return ibeta(df / (df + t * t), df / 2, 0.5); }

  // Two-sided p for a Pearson correlation r from n pairs (t test, df = n - 2).
  function pFromR(r, n) {
    var df = n - 2;
    if (df < 1) return 1;
    if (Math.abs(r) >= 1) return 0;
    var t = r * Math.sqrt(df / (1 - r * r));
    return pFromT(t, df);
  }

  // Smallest |r| with two-sided p <= alpha at sample size n (bisection).
  function criticalR(n, alpha) {
    alpha = alpha || 0.05;
    var lo = 0, hi = 1;
    for (var i = 0; i < 80; i++) {
      var mid = (lo + hi) / 2;
      if (pFromR(mid, n) > alpha) lo = mid; else hi = mid;
    }
    return hi;
  }

  // Smallest n at which |r| reaches two-sided p < alpha.
  function nForP(r, alpha) {
    alpha = alpha || 0.05;
    for (var n = 3; n < 100000; n++) if (pFromR(Math.abs(r), n) < alpha) return n;
    return null;
  }

  /* ------------------------------------------------- simulated teachers */

  function rng(seed) {
    var s = seed >>> 0;
    return function () {
      s = (s + 0x6D2B79F5) >>> 0;
      var t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function normal(r) {
    var u = 0, v = 0;
    while (u === 0) u = r();
    while (v === 0) v = r();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  function clamp(x, lo, hi) { return Math.max(lo, Math.min(hi, x)); }

  /*
    A simulated class: nCS computer science teachers and nNon others.
    opts.gap      score head start of CS teachers (points out of 100)
    opts.extra    extra hours the other teachers spend, on average
    opts.within   points gained per extra hour inside each group
    Scores: CS mean 86, others 86 - gap, SD 6. Hours: CS mean 6, others 6 + extra, SD 2.
  */
  function simulate(opts) {
    var o = opts || {};
    var nCS = o.nCS == null ? 11 : o.nCS, nNon = o.nNon == null ? 10 : o.nNon;
    var r = rng(o.seed == null ? 7 : o.seed);
    var people = [];
    function add(group, n, hMean, sMean) {
      for (var i = 0; i < n; i++) {
        var h = clamp(hMean + 2 * normal(r), 0.5, 24);
        var s = clamp(sMean + (o.within || 0) * (h - hMean) + 6 * normal(r), 0, 100);
        people.push({ group: group, hours: h, score: s });
      }
    }
    add("cs", nCS, 6, 86);
    add("non", nNon, 6 + (o.extra == null ? 3 : o.extra), 86 - (o.gap == null ? 10 : o.gap));
    function pick(g) { return people.filter(function (p) { return !g || p.group === g; }); }
    function rOf(list) { return pearson(list.map(function (p) { return p.hours; }), list.map(function (p) { return p.score; })); }
    return {
      people: people,
      pooled: rOf(pick()),
      cs: rOf(pick("cs")),
      non: rOf(pick("non")),
      pooledP: pFromR(rOf(pick()), people.length)
    };
  }

  root.CFEngine = {
    PAPER: PAPER,
    shareCounts: shareCounts,
    reconstruct: reconstruct,
    pearson: pearson,
    slope: slope,
    pFromT: pFromT,
    pFromR: pFromR,
    criticalR: criticalR,
    nForP: nForP,
    simulate: simulate,
    rng: rng
  };
})(typeof self !== "undefined" ? self : this);

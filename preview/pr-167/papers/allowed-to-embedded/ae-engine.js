/*
  Engine for /papers/allowed-to-embedded/.
  Borowczak and Borowczak, "From Allowed to Embedded: Student Perceptions of AI Use
  Across Engineering Courses," ASEE Annual Conference 2026 (DOI 10.18260/1-2--59546).

  DATA holds the paper's printed values (Table 1, Table 2, the clarity statistics,
  and the policy shares the text states for single semesters).
  The rest is the page's own arithmetic:
    - percentages and counts recomputed from Tables 1 and 2;
    - Welch t-tests, Cohen's d, one-way ANOVA, and Kruskal-Wallis on 1-5 counts;
    - recover(): a search for the whole-number answer counts behind the printed
      clarity means, SD, t, d, F, and H;
    - Wilson score intervals.
  Loads as a page script or in a Web Worker.
*/
(function (root) {
  "use strict";

  var CATS = ["dis", "none", "allowed", "enc", "crit"];

  var DATA = {
    policies: [
      { id: "dis", name: "Disallowed", short: "Disallowed",
        def: "Use is prohibited and treated as academic misconduct." },
      { id: "none", name: "No Policy Stated", short: "No policy",
        def: "The syllabus and course communication say nothing about AI, so students cannot tell whether use is permitted." },
      { id: "allowed", name: "Allowed (Informal)", short: "Allowed",
        def: "No ban and no specific guidance; use is permitted through silence or vague wording." },
      { id: "enc", name: "Encouraged (Optional)", short: "Encouraged",
        def: "The instructor presents AI as a helpful tool for named uses, but it is not central to assessment." },
      { id: "crit", name: "Critical Use", short: "Critical Use",
        def: "Students must use AI and then critique, verify, or modify its output; AI is a subject of study." }
    ],

    // Table 1: reports per semester, unique courses, undergraduate and graduate reports.
    semesters: [
      { id: "sp23", name: "Spring 2023", short: "Sp23", reports: 8,  courses: 6,  ug: 8,  grad: 0 },
      { id: "su23", name: "Summer 2023", short: "Su23", reports: 2,  courses: 2,  ug: 2,  grad: 0 },
      { id: "fa23", name: "Fall 2023",   short: "Fa23", reports: 12, courses: 9,  ug: 8,  grad: 4 },
      { id: "sp24", name: "Spring 2024", short: "Sp24", reports: 14, courses: 13, ug: 11, grad: 3 },
      { id: "su24", name: "Summer 2024", short: "Su24", reports: 3,  courses: 3,  ug: 3,  grad: 0 },
      { id: "fa24", name: "Fall 2024",   short: "Fa24", reports: 22, courses: 21, ug: 14, grad: 8 },
      { id: "sp25", name: "Spring 2025", short: "Sp25", reports: 27, courses: 23, ug: 19, grad: 8 },
      { id: "su25", name: "Summer 2025", short: "Su25", reports: 9,  courses: 7,  ug: 9,  grad: 0 },
      { id: "fa25", name: "Fall 2025",   short: "Fa25", reports: 31, courses: 26, ug: 22, grad: 9 }
    ],
    table1Total: { reports: 128, courses: 71, ug: 96, grad: 32 },

    // Policy shares the Results text states for single semesters (Figure 1 itself
    // is a chart; the page uses only the values written in the text).
    stated: {
      sp23: { none: 50.0, dis: 25.0, allowed: 25.0 },
      fa23: { allowed: 75.0, dis: 16.7 },
      sp24: { dis: 35.7 },
      fa24: { enc: 22.7, crit: 13.6 },
      sp25: { dis: 14.8 },
      fa25: { allowed: 29.0, enc: 29.0, none: 16.1, dis: 12.9, crit: 12.9 }
    },
    phases: [
      { name: "Reactive", from: 0, to: 2, note: "2023" },
      { name: "Rise of ambiguity", from: 3, to: 6, note: "2024 to early 2025" },
      { name: "Stratification", from: 8, to: 8, note: "Fall 2025" }
    ],

    // Table 2: percent of reports in each policy category using AI for each task.
    n: { dis: 24, none: 21, allowed: 47, enc: 27, crit: 9 },
    tasks: [
      { id: "explain", name: "Explanation", what: "concepts and lectures",
        pct: { dis: 45.8, none: 57.1, allowed: 72.3, enc: 70.4, crit: 55.6 } },
      { id: "ideate", name: "Ideation", what: "brainstorming",
        pct: { dis: 33.3, none: 47.6, allowed: 25.5, enc: 59.3, crit: 55.6 } },
      { id: "debug", name: "Debugging", what: "code and troubleshooting",
        pct: { dis: 29.2, none: 38.1, allowed: 36.2, enc: 63.0, crit: 88.9 } },
      { id: "verify", name: "Verification", what: "math and logic",
        pct: { dis: 16.7, none: 28.6, allowed: 27.7, enc: 48.1, crit: 66.7 } },
      { id: "critique", name: "Critique", what: "analyzing AI errors",
        pct: { dis: 16.7, none: 14.3, allowed: 8.5, enc: 25.9, crit: 66.7 } }
    ],
    anyUse:  { dis: 62.5, none: 66.7, allowed: 78.7, enc: 88.9, crit: 100.0 },
    abstain: { dis: 37.5, none: 33.3, allowed: 21.3, enc: 11.1, crit: 0.0 },

    // Instructor clarity, "How clear was the instructor's policy regarding AI usage?"
    // 1 = very unclear, 5 = very clear. No Policy Stated is not in the comparison.
    clarity: {
      groups: ["dis", "allowed", "enc", "crit"],
      mean: { dis: 4.50, allowed: 2.45, enc: 4.37, crit: 4.44 },
      sd: { allowed: 1.14 },
      welch: { // Allowed (Informal) against each group
        dis:  { t: -9.25, d: -2.15 },
        enc:  { t: -8.54, d: -1.96 },
        crit: { t: -6.80, d: -2.09 }
      },
      anova: { F: 38.84, df1: 3, df2: 103 },
      kw: { H: 58.7, df: 3 },
      alpha: 0.0083,
      byLevel: {
        ug:   { allowed: { m: 2.51, n: 37 }, enc: { m: 4.30, n: 20 } },
        grad: { allowed: { m: 2.20, n: 10 }, enc: { m: 4.57, n: 7 } }
      }
    },

    disciplines: { "Computer Engineering": 67, "Computer Science": 44, "Electrical Engineering": 16, "General Engineering": 1 },
    students: 30
  };

  /* ------------------------------------------------------------- rounding */

  function roundTo(x, d) {
    var f = Math.pow(10, d);
    return Math.round(x * f + (x >= 0 ? 1e-9 : -1e-9)) / f;
  }
  function round1(x) { return roundTo(x, 1); }

  // Whole-number count behind a printed percentage of n (null if none or several).
  function countFor(pct, n) {
    var hits = [];
    for (var k = 0; k <= n; k++) if (round1(100 * k / n) === pct) hits.push(k);
    return hits.length === 1 ? hits[0] : null;
  }

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

  // Upper regularized gamma Q(a, x).
  function gammq(a, x) {
    if (x <= 0) return 1;
    var gln = lgamma(a);
    if (x < a + 1) {
      var ap = a, sum = 1 / a, del = sum;
      for (var n = 0; n < 500; n++) { ap += 1; del *= x / ap; sum += del; if (Math.abs(del) < Math.abs(sum) * 1e-16) break; }
      return 1 - sum * Math.exp(-x + a * Math.log(x) - gln);
    }
    var b = x + 1 - a, c = 1 / 1e-300, d = 1 / b, h = d;
    for (var i = 1; i < 500; i++) {
      var an = -i * (i - a); b += 2;
      d = an * d + b; if (Math.abs(d) < 1e-300) d = 1e-300;
      c = b + an / c; if (Math.abs(c) < 1e-300) c = 1e-300;
      d = 1 / d; var del2 = d * c; h *= del2;
      if (Math.abs(del2 - 1) < 1e-16) break;
    }
    return Math.exp(-x + a * Math.log(x) - gln) * h;
  }

  function tTwoSided(t, df) { return ibeta(df / (df + t * t), df / 2, 0.5); }
  function fUpper(F, d1, d2) { return F <= 0 ? 1 : ibeta(d2 / (d2 + d1 * F), d2 / 2, d1 / 2); }
  function chi2Upper(x, k) { return gammq(k / 2, x / 2); }

  /* ------------------------------------------------- statistics on counts */

  // counts: array of five whole numbers, answers 1 to 5.
  function describe(counts) {
    var n = 0, s = 0, q = 0;
    counts.forEach(function (k, i) { n += k; s += (i + 1) * k; q += (i + 1) * (i + 1) * k; });
    var m = s / n;
    var v = n > 1 ? (q - n * m * m) / (n - 1) : 0;
    return { n: n, sum: s, mean: m, sd: Math.sqrt(Math.max(v, 0)), variance: Math.max(v, 0) };
  }

  // Welch t of a against b, its Welch-Satterthwaite df, two-sided p, and
  // Cohen's d on the average of the two variances (d_av).
  function welchStats(a, b) {
    var va = a.variance / a.n, vb = b.variance / b.n;
    var t = (a.mean - b.mean) / Math.sqrt(va + vb);
    var df = (va + vb) * (va + vb) / (va * va / (a.n - 1) + vb * vb / (b.n - 1));
    var dav = (a.mean - b.mean) / Math.sqrt((a.variance + b.variance) / 2);
    var sp = Math.sqrt(((a.n - 1) * a.variance + (b.n - 1) * b.variance) / (a.n + b.n - 2));
    return { t: t, df: df, p: tTwoSided(t, df), d: dav, dPooled: (a.mean - b.mean) / sp };
  }
  function welch(ca, cb) { return welchStats(describe(ca), describe(cb)); }

  function anova(groups) {
    var st = groups.map(describe);
    var N = 0, total = 0;
    st.forEach(function (g) { N += g.n; total += g.sum; });
    var gm = total / N, ssb = 0, ssw = 0;
    st.forEach(function (g) { ssb += g.n * (g.mean - gm) * (g.mean - gm); ssw += (g.n - 1) * g.variance; });
    var df1 = st.length - 1, df2 = N - st.length;
    var F = (ssb / df1) / (ssw / df2);
    return { F: F, df1: df1, df2: df2, p: fUpper(F, df1, df2), eta2: ssb / (ssb + ssw) };
  }

  // Kruskal-Wallis on grouped 1-5 answers, with the tie correction.
  function kruskal(groups) {
    var K = 5, tot = [], N = 0, i;
    for (i = 0; i < K; i++) { tot[i] = 0; groups.forEach(function (g) { tot[i] += g[i]; }); N += tot[i]; }
    var rank = [], c = 0, ties = 0;
    for (i = 0; i < K; i++) { rank[i] = c + (tot[i] + 1) / 2; c += tot[i]; ties += tot[i] * tot[i] * tot[i] - tot[i]; }
    var h = 0;
    groups.forEach(function (g) {
      var n = 0, r = 0;
      for (var j = 0; j < K; j++) { n += g[j]; r += g[j] * rank[j]; }
      h += r * r / n;
    });
    h = 12 / (N * (N + 1)) * h - 3 * (N + 1);
    var corr = 1 - ties / (N * N * N - N);
    var H = h / corr, df = groups.length - 1;
    return { H: H, Hraw: h, df: df, p: chi2Upper(H, df) };
  }

  function wilson(k, n, z) {
    z = z || 1.959963984540054;
    if (!n) return { lo: 0, hi: 0 };
    var p = k / n, z2 = z * z, den = 1 + z2 / n;
    var mid = (p + z2 / (2 * n)) / den;
    var half = z * Math.sqrt(p * (1 - p) / n + z2 / (4 * n * n)) / den;
    return { lo: Math.max(0, mid - half), hi: Math.min(1, mid + half) };
  }

  /* --------------------------------------------- recovering the answers */

  // Every way to put n answers into five boxes.
  function compositions(n, fn) {
    for (var a = 0; a <= n; a++)
      for (var b = 0; a + b <= n; b++)
        for (var c = 0; a + b + c <= n; c++)
          for (var d = 0; a + b + c + d <= n; d++) fn([a, b, c, d, n - a - b - c - d]);
  }

  // Search for the 1-5 answer counts consistent with every printed clarity statistic:
  // means and the Allowed SD (two decimals), the three Welch t values and d values
  // (two decimals), then F(3, 103) and H(3) from the four groups together.
  function recover() {
    var C = DATA.clarity, n = DATA.n, steps = [];
    var A = [];
    compositions(n.allowed, function (c) {
      var s = describe(c);
      if (roundTo(s.mean, 2) === C.mean.allowed && roundTo(s.sd, 2) === C.sd.allowed) A.push(c);
    });
    steps.push({ label: "Allowed (Informal), n = 47: mean 2.45 and SD 1.14", count: A.length });
    var others = {};
    ["dis", "enc", "crit"].forEach(function (g) {
      var hits = [], tried = 0;
      compositions(n[g], function (c) {
        var s = describe(c);
        if (roundTo(s.mean, 2) !== C.mean[g]) return;
        tried++;
        for (var i = 0; i < A.length; i++) {
          var w = welchStats(describe(A[i]), s);
          if (roundTo(w.t, 2) === C.welch[g].t && roundTo(w.d, 2) === C.welch[g].d) { hits.push(c); break; }
        }
      });
      others[g] = hits;
      steps.push({ label: DATA.policies[CATS.indexOf(g)].name + ", n = " + n[g] + ": mean, then t and d against Allowed", count: hits.length, tried: tried });
    });
    var combos = 0, fMatch = 0, sols = [];
    A.forEach(function (a) {
      others.dis.forEach(function (d) {
        others.enc.forEach(function (e) {
          others.crit.forEach(function (cr) {
            // A table is kept only if the t and d against Allowed still match for this Allowed table.
            var ok = [["dis", d], ["enc", e], ["crit", cr]].every(function (pair) {
              var w = welch(a, pair[1]);
              return roundTo(w.t, 2) === C.welch[pair[0]].t && roundTo(w.d, 2) === C.welch[pair[0]].d;
            });
            if (!ok) return;
            combos++;
            var groups = [d, a, e, cr];
            var f = anova(groups);
            if (roundTo(f.F, 2) !== C.anova.F) return;
            fMatch++;
            var k = kruskal(groups);
            if (roundTo(k.H, 1) === C.kw.H) sols.push({ dis: d, allowed: a, enc: e, crit: cr, F: f.F, H: k.H });
          });
        });
      });
    });
    steps.push({ label: "All four together: combinations that keep every t and d", count: combos });
    steps.push({ label: "... that give F(3, 103) = 38.84", count: fMatch });
    steps.push({ label: "... that give H(3) = 58.7", count: sols.length });
    return { steps: steps, solutions: sols };
  }

  /* --------------------------------------------------------- tables */

  function table2Counts() {
    var out = {};
    CATS.forEach(function (c) {
      var n = DATA.n[c], row = {};
      DATA.tasks.forEach(function (t) { row[t.id] = countFor(t.pct[c], n); });
      row.any = countFor(DATA.anyUse[c], n);
      row.abstain = countFor(DATA.abstain[c], n);
      out[c] = row;
    });
    return out;
  }

  // Counts for the semester shares the text states, out of that semester's reports.
  function statedCounts() {
    var out = {};
    DATA.semesters.forEach(function (s) {
      var st = DATA.stated[s.id];
      if (!st) return;
      out[s.id] = {};
      Object.keys(st).forEach(function (c) { out[s.id][c] = countFor(st[c], s.reports); });
    });
    return out;
  }

  var api = {
    DATA: DATA, CATS: CATS,
    round1: round1, roundTo: roundTo, countFor: countFor,
    describe: describe, welch: welch, welchStats: welchStats, anova: anova, kruskal: kruskal, wilson: wilson,
    tTwoSided: tTwoSided, fUpper: fUpper, chi2Upper: chi2Upper, ibeta: ibeta,
    recover: recover, table2Counts: table2Counts, statedCounts: statedCounts
  };
  root.AllowedEmbeddedEngine = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof self !== "undefined" ? self : this);

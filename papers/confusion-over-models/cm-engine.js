/*
  Study engine for /papers/confusion-over-models/.

  Reynolds, Borowczak, and Borowczak (SAGE Open 2022) asked 40 K-12 STEM
  teachers in the 2018 RAMPED professional development (PD) what they picture
  when they hear "modeling," before the PD, on its last day, in interviews, and
  in an email a year later. The paper reports counts only: Table 1 (who came),
  Table 2 (who came, by level and gender), coded "modeling is ..." instances for
  each data source, and the email follow-through. Everything here is arithmetic
  on those printed counts, plus statistics the paper does not report (Wilson
  intervals and an exact test of the pre/post shift), which the page labels as
  its own. Loads as a page script or in Node.
*/
(function (root) {
  "use strict";

  /* ------------------------------------------------------------ the paper's counts */

  var N = 40;

  // Table 1, overall participant demographics (n, printed %).
  var TABLE1 = {
    gender: { label: "Gender", rows: [
      { name: "Female", n: 27, pct: 67.5 },
      { name: "Male", n: 13, pct: 32.5 }
    ] },
    grades: { label: "Grades taught", rows: [
      { name: "Elementary", n: 13, pct: 32.5 },
      { name: "Middle school", n: 9, pct: 22.5 },
      { name: "High school", n: 11, pct: 27.5 },
      { name: "Combination", n: 7, pct: 17.5 }
    ] },
    subjects: { label: "Subjects taught", rows: [
      { name: "Science", n: 9, pct: 22.5 },
      { name: "All subjects (elementary)", n: 7, pct: 17.5 },
      { name: "STEM combination", n: 5, pct: 12.5 },
      { name: "Other disciplines", n: 5, pct: 12.5 },
      { name: "Technology or library", n: 4, pct: 10 },
      { name: "Computer science or computers", n: 3, pct: 7.5 },
      { name: "Industrial arts or welding", n: 3, pct: 7.5 },
      { name: "Engineering", n: 2, pct: 5 },
      { name: "Mathematics", n: 2, pct: 5 }
    ] }
  };

  // Table 2, level totals (the readable rows) and the interviewed subset.
  var TABLE2_LEVELS = [
    { name: "Elementary school", n: 13, f: 10, m: 3 },
    { name: "Elementary and middle school", n: 2, f: 1, m: 1 },
    { name: "Middle school", n: 9, f: 6, m: 3 },
    { name: "Middle and high school", n: 2, f: 1, m: 1 },
    { name: "High school", n: 11, f: 7, m: 4 },
    { name: "K-12", n: 2 },
    { name: "Trade school (AAS, business)", n: 1 }
  ];
  var INTERVIEWED = { f: 10, m: 4, n: 14 };

  // Coded "modeling is ..." instances (Findings). Instances, not people:
  // some answers carried more than one definition.
  var CODES = [
    { key: "comp", name: "Computer or conceptual model", short: "Computer model" },
    { key: "idwd", name: "I do, we do, you do", short: "I do, we do, you do" },
    { key: "proj", name: "Projects", short: "Projects" }
  ];
  var SOURCES = [
    { key: "pre", name: "Pre-survey", when: "Start of the PD", respondents: 40, counts: { comp: 5, idwd: 29, proj: 6 } },
    { key: "post", name: "Post-survey", when: "Last day of the PD", respondents: 36, counts: { comp: 11, idwd: 24, proj: 4 } },
    { key: "int", name: "Interviews", when: "During the PD", respondents: 14, counts: { comp: 11, idwd: 21, proj: 0 } }
  ];

  // Email reflections at the end of the yearlong PD.
  var EMAIL = { invited: 40, responded: 25, usedNew: 23, noneNew: 2, avgLessons: 5,
    printed: { responded: 62.5, usedOfResp: 92, usedOfAll: 57.5 } };

  /* ------------------------------------------------------------ helpers */

  function sum(a) { var s = 0; for (var i = 0; i < a.length; i++) s += a[i]; return s; }
  function vec(src) { return CODES.map(function (c) { return src.counts[c.key]; }); }
  function source(key) { return SOURCES.filter(function (s) { return s.key === key; })[0]; }
  function round(x, d) { var f = Math.pow(10, d); return Math.round(x * f) / f; }

  // Wilson score interval for k of n at 95% (z = 1.959964).
  function wilson(k, n, z) {
    if (z === undefined) z = 1.959963984540054;
    if (n === 0) return [0, 1];
    var p = k / n, z2 = z * z;
    var den = 1 + z2 / n;
    var mid = (p + z2 / (2 * n)) / den;
    var half = (z / den) * Math.sqrt(p * (1 - p) / n + z2 / (4 * n * n));
    return [Math.max(0, mid - half), Math.min(1, mid + half)];
  }

  // log factorials
  var LF = [0];
  function lf(n) { while (LF.length <= n) LF.push(LF[LF.length - 1] + Math.log(LF.length)); return LF[n]; }

  // Probability of a 2 x k table with fixed margins (multivariate hypergeometric).
  function tableLogP(a, b) {
    var k = a.length, r1 = sum(a), r2 = sum(b), n = r1 + r2, s = lf(r1) + lf(r2) - lf(n);
    for (var j = 0; j < k; j++) s += lf(a[j] + b[j]) - lf(a[j]) - lf(b[j]);
    return s;
  }

  // Pearson chi-square for a 2 x k table.
  function chiSquare(a, b) {
    var r1 = sum(a), r2 = sum(b), n = r1 + r2, x = 0, df = 0;
    for (var j = 0; j < a.length; j++) {
      var c = a[j] + b[j];
      if (c === 0) continue;
      df++;
      var e1 = r1 * c / n, e2 = r2 * c / n;
      x += (a[j] - e1) * (a[j] - e1) / e1 + (b[j] - e2) * (b[j] - e2) / e2;
    }
    return { stat: x, df: df - 1 };
  }

  // Freeman-Halton exact test for a 2 x 3 table: sum the probabilities of all
  // tables with the same margins that are no more probable than the observed one.
  // Also returns the exact p of the chi-square statistic (tables with X^2 >= observed).
  function exact2x3(a, b) {
    var cols = [a[0] + b[0], a[1] + b[1], a[2] + b[2]], r1 = sum(a);
    var obsLP = tableLogP(a, b), obsX = chiSquare(a, b).stat;
    var pProb = 0, pChi = 0, tables = 0, eps = 1e-7;
    for (var x0 = Math.max(0, r1 - cols[1] - cols[2]); x0 <= Math.min(cols[0], r1); x0++) {
      for (var x1 = Math.max(0, r1 - x0 - cols[2]); x1 <= Math.min(cols[1], r1 - x0); x1++) {
        var x2 = r1 - x0 - x1;
        if (x2 < 0 || x2 > cols[2]) continue;
        var ta = [x0, x1, x2], tb = [cols[0] - x0, cols[1] - x1, cols[2] - x2];
        var lp = tableLogP(ta, tb), p = Math.exp(lp);
        tables++;
        if (lp <= obsLP + eps) pProb += p;
        if (chiSquare(ta, tb).stat >= obsX - 1e-9) pChi += p;
      }
    }
    return { pFreemanHalton: Math.min(1, pProb), pChiExact: Math.min(1, pChi), tables: tables, chi: chiSquare(a, b) };
  }

  // Upper tail of chi-square with df = 2 (closed form) and df = 1.
  function chiSurvival(x, df) {
    if (df === 2) return Math.exp(-x / 2);
    if (df === 1) return erfc(Math.sqrt(x / 2));
    throw new Error("df " + df + " not supported");
  }
  function erfc(x) {
    // Numerical Recipes erfc, relative error < 1.2e-7
    var z = Math.abs(x), t = 1 / (1 + 0.5 * z);
    var r = t * Math.exp(-z * z - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 +
      t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277)))))))));
    return x >= 0 ? r : 2 - r;
  }

  // Follow-through: share of all 40 teachers who changed practice, if `k` of the
  // 15 who did not answer the email also did. The paper's 57.5% is k = 0.
  function followThrough(k) {
    var silent = EMAIL.invited - EMAIL.responded;
    k = Math.max(0, Math.min(silent, k));
    return { k: k, silent: silent, changed: EMAIL.usedNew + k, share: (EMAIL.usedNew + k) / EMAIL.invited };
  }

  /* ------------------------------------------------------------ checks against the printed numbers */

  function checks() {
    var out = [];
    function add(where, what, printed, computed, ok) { out.push({ where: where, what: what, printed: printed, computed: computed, ok: ok }); }
    Object.keys(TABLE1).forEach(function (k) {
      var t = TABLE1[k], tot = sum(t.rows.map(function (r) { return r.n; }));
      add("Table 1", t.label + " counts sum", "40", String(tot), tot === N);
      t.rows.forEach(function (r) {
        var c = 100 * r.n / N;
        add("Table 1", t.label + ": " + r.name, r.pct + "%", round(c, 1) + "%", Math.abs(c - r.pct) < 0.05);
      });
    });
    var lv = sum(TABLE2_LEVELS.map(function (r) { return r.n; }));
    add("Table 2", "Level totals sum", "40", String(lv), lv === N);
    var combo = sum(TABLE2_LEVELS.filter(function (r) { return /and|K-12|Trade/.test(r.name); }).map(function (r) { return r.n; }));
    add("Tables 1 and 2", "Combination rows (Table 2) match Table 1's 7", "7", String(combo), combo === 7);
    add("Tables 1 and 2", "Elementary, middle, high school", "13, 9, 11", [13, 9, 11].join(", "),
      TABLE2_LEVELS[0].n === 13 && TABLE2_LEVELS[2].n === 9 && TABLE2_LEVELS[4].n === 11);
    var f = sum(TABLE2_LEVELS.filter(function (r) { return r.f !== undefined; }).map(function (r) { return r.f; }));
    add("Table 2", "Female, readable level rows", "27 total", String(f) + " of 27 (K-12 and trade rows unsplit)", f <= 27);
    var e = EMAIL;
    add("Findings", "Email response rate", "62.5%", round(100 * e.responded / e.invited, 1) + "%", 100 * e.responded / e.invited === e.printed.responded);
    add("Findings", "Used a new idea, of respondents", "92%", round(100 * e.usedNew / e.responded, 1) + "%", 100 * e.usedNew / e.responded === e.printed.usedOfResp);
    add("Findings", "Used a new idea, of all 40", "57.5%", round(100 * e.usedNew / e.invited, 1) + "%", 100 * e.usedNew / e.invited === e.printed.usedOfAll);
    add("Findings", "Respondents with nothing new", "2", String(e.responded - e.usedNew), e.responded - e.usedNew === e.noneNew);
    add("Findings", "Post-survey I do, we do, you do (\"down from 29\")", "29 to 24", source("pre").counts.idwd + " to " + source("post").counts.idwd, true);
    add("Findings", "Post-survey computer model (\"up from five\")", "5 to 11", source("pre").counts.comp + " to " + source("post").counts.comp, true);
    add("Findings", "Post-survey projects (\"down from five\")", "5 to 4", source("pre").counts.proj + " to " + source("post").counts.proj, false);
    return out;
  }

  var API = {
    N: N, TABLE1: TABLE1, TABLE2_LEVELS: TABLE2_LEVELS, INTERVIEWED: INTERVIEWED,
    CODES: CODES, SOURCES: SOURCES, EMAIL: EMAIL,
    sum: sum, vec: vec, source: source, wilson: wilson, chiSquare: chiSquare, chiSurvival: chiSurvival,
    exact2x3: exact2x3, followThrough: followThrough, checks: checks
  };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  root.ModelsEngine = API;
})(typeof self !== "undefined" ? self : this);

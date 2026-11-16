/*
  Microcredential engine for /papers/cyber-microcredentials/.

  Holds the numbers the two papers print, and the small computations the page
  runs on them:
    - Burrows, Borowczak, and Mugayitoglu, "Computer Science beyond Coding:
      Partnering to Create Teacher Cybersecurity Microcredentials,"
      Education Sciences 12(1):4, 2022 (published December 22, 2021).
      DOI 10.3390/educsci12010004.
    - Mugayitoglu, Borowczak, and Burrows Borowczak, "Designing a Creative
      Cybersecurity Microcredential for Educators: Challenges and Successes of
      K-12 Teacher Professional Development," ASEE Virtual Annual Conference,
      2021. DOI 10.18260/1-2--36927.

  Computations: the Caesar cipher from the microcredential's unplugged
  activity, an English-likeness score for trying every key, Wilson score
  intervals, Fisher's exact test (two-sided, summing tables no more probable
  than the observed one, as SciPy does), and the counts k out of n that print
  as a given whole percentage when rounded or truncated.

  Loads as a page script or in a Web Worker.
*/
(function (root) {
  "use strict";

  var A = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  /* ------------------------------------------------------------ the papers' numbers */

  var MODULES = [
    { id: 0, name: "Intro to Cybersecurity" },
    { id: 1, name: "CIA Triad" },
    { id: 2, name: "Abstraction" },
    { id: 3, name: "Data Hiding" },
    { id: 4, name: "Simplicity" },
    { id: 5, name: "Minimization" },
    { id: 6, name: "Modularity" },
    { id: 7, name: "Domain Separation" },
    { id: 8, name: "Least Privilege" },
    { id: 9, name: "Layering" },
    { id: 10, name: "Resource Encapsulation" },
    { id: 11, name: "Process Isolation" }
  ];

  // Table 3 of the journal paper: module names by pilot, in each pilot's own numbering.
  var PILOT_MODULES = {
    1: ["Intro to Cybersecurity", "CIA Triad"],
    2: ["Intro to Cybersecurity", "CIA Triad", "Abstraction", "Modularity", "Least Privilege"],
    3: MODULES.map(function (m) { return m.name; })
  };

  // Table 2 of the journal paper, with the cohort seasons from its Methods.
  var PILOTS = [
    { id: 1, season: "Summer 2020", days: 28, n: 5, modules: 2,
      required: "Modules 0 and 1", officeHours: "Twice a week, one-hour slot",
      knowledge: false, attitude: false, interviews: true, progress: true,
      resources: "Custom resources and research materials", choose: 0 },
    { id: 2, season: "Fall 2020", days: 42, n: 16, modules: 5,
      required: "Module 0, then choose two", officeHours: "Twice a week, one-hour slot",
      knowledge: true, attitude: true, interviews: true, progress: true,
      resources: "More resources and research materials; added sample lesson plans and computational thinking flashcards", choose: 2 },
    { id: 3, season: "Summer 2021", days: 49, n: 9, modules: 12,
      required: "Module 0, then choose two", officeHours: "By request",
      knowledge: true, attitude: true, interviews: true, progress: true,
      resources: "More resources, research materials, and sample lesson plans; added design thinking flashcards and videos", choose: 2 }
  ];

  // Table 1 of the journal paper (n = 30; CS teaching years n = 25). Percentages as printed.
  var DEMOGRAPHICS = [
    { key: "gender", label: "Gender", n: 30, multi: false, rows: [["Female", 73], ["Male", 27]] },
    { key: "subjects", label: "Subjects taught", n: 30, multi: true,
      rows: [["Mathematics", 53], ["Science", 47], ["Computer science", 30], ["Literacy and English", 27], ["STEM", 20], ["Other", 10]] },
    { key: "levels", label: "Grades taught", n: 30, multi: true,
      rows: [["PreK–2", 27], ["3–5", 37], ["6–8", 47], ["9–12", 37], ["Higher education", 3]] },
    { key: "prior", label: "Prior cybersecurity class", n: 30, multi: false, rows: [["Yes", 63], ["No", 37]] },
    { key: "years", label: "Years teaching", n: 30, multi: false,
      rows: [["0–3", 7], ["4–6", 17], ["7–10", 10], ["11–15", 7], ["16 or more", 59]] },
    { key: "csyears", label: "Years teaching CS", n: 25, multi: false,
      rows: [["0–3", 88], ["4–6", 12], ["7–10", 0], ["11–15", 0], ["16 or more", 0]] }
  ];

  // Self-efficacy items (journal, Figures 1 and 2): agree or strongly agree, counts printed.
  // Concern items (ASEE 2021): agree or strongly agree, percentages and n printed.
  var ITEMS = [
    { key: "q11", source: "journal", text: "I can effectively teach all students computer science.",
      label: "Item 11", kind: "efficacy",
      points: [{ when: "Before", k: 15, n: 22, pct: 68 }, { when: "After", k: 12, n: 14, pct: 86 }] },
    { key: "q12", source: "journal", text: "I can teach the computer science concepts required by the curriculum.",
      label: "Item 12", kind: "efficacy",
      points: [{ when: "Before", k: 15, n: 22, pct: 68 }, { when: "After", k: 12, n: 14, pct: 86 }] },
    { key: "i8", source: "asee", text: "I am concerned about improving how I teach CS.",
      label: "Item 8", kind: "concern",
      points: [{ when: "Pre", n: 16, pct: 75 }, { when: "Post", n: 11, pct: 77 }, { when: "Post-post", n: 9, pct: 45 }] },
    { key: "i9", source: "asee", text: "I am concerned about working to improve how CS is taught.",
      label: "Item 9", kind: "concern",
      points: [{ when: "Pre", n: 16, pct: 75 }, { when: "Post", n: 9, pct: 44 }, { when: "Post-post", n: 11, pct: 36 }] }
  ];

  var RESPONSES = [
    { cohort: 2, enrolled: 16, pre: 16, post: 11 },
    { cohort: 3, enrolled: 9, pre: 7, post: 5 }
  ];

  var TIME = {
    lms: { min: 2, max: 192, mean: 40, label: "Time logged in the learning management system" },
    self: { min: 6, max: 40, mean: 14, label: "Time teachers reported in biweekly progress reports" }
  };

  // Figure 4: 48 module selections; the text gives two shares.
  var SELECTIONS = { n: 48, shares: { "Abstraction": 29, "Minimization": 2 } };

  var FOLLOW = { k: 14, n: 30, printed: "at least 46%" };
  var INTERVIEWS = { k: 19, n: 30, pct: 63 };

  // Typical English letter frequencies, A to Z (percent), Lewand (2000).
  var ENGLISH = [8.167, 1.492, 2.782, 4.253, 12.702, 2.228, 2.015, 6.094, 6.966, 0.153, 0.772, 4.025, 2.406,
    6.749, 7.507, 1.929, 0.095, 5.987, 6.327, 9.056, 2.758, 0.978, 2.360, 0.150, 1.974, 0.074];

  /* ------------------------------------------------------------ Caesar cipher */

  function mod(a, m) { return ((a % m) + m) % m; }

  // Shift letters A to Z by `shift`, keep case, leave everything else as is.
  function caesar(text, shift) {
    var s = mod(Math.round(shift), 26), out = "";
    for (var i = 0; i < text.length; i++) {
      var c = text.charCodeAt(i);
      if (c >= 65 && c <= 90) out += String.fromCharCode(65 + mod(c - 65 + s, 26));
      else if (c >= 97 && c <= 122) out += String.fromCharCode(97 + mod(c - 97 + s, 26));
      else out += text[i];
    }
    return out;
  }

  function letterCounts(text) {
    var counts = new Array(26).fill(0);
    for (var i = 0; i < text.length; i++) {
      var c = text.charCodeAt(i);
      if (c >= 65 && c <= 90) counts[c - 65]++;
      else if (c >= 97 && c <= 122) counts[c - 97]++;
    }
    return counts;
  }

  // Pearson chi-squared distance from typical English; smaller reads more like English.
  function englishScore(text) {
    var counts = letterCounts(text), n = sum(counts);
    if (!n) return Infinity;
    var x2 = 0;
    for (var i = 0; i < 26; i++) {
      var e = n * ENGLISH[i] / 100;
      x2 += (counts[i] - e) * (counts[i] - e) / e;
    }
    return x2;
  }

  // Every key a code breaker could try: undo shift k for k = 0..25.
  function tryEveryKey(cipherText) {
    var rows = [];
    for (var k = 0; k < 26; k++) {
      var plain = caesar(cipherText, -k);
      rows.push({ key: k, text: plain, score: englishScore(plain) });
    }
    var best = 0;
    rows.forEach(function (r, i) { if (r.score < rows[best].score) best = i; });
    return { rows: rows, best: best };
  }

  /* ------------------------------------------------------------ statistics */

  function sum(a) { var s = 0; for (var i = 0; i < a.length; i++) s += a[i]; return s; }

  // Inverse standard normal CDF (Acklam), for the interval's z.
  function normInv(p) {
    var a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239];
    var b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572];
    var c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
    var d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
    var q, r;
    if (p < 0.02425) { q = Math.sqrt(-2 * Math.log(p)); return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
    if (p > 1 - 0.02425) { q = Math.sqrt(-2 * Math.log(1 - p)); return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
    q = p - 0.5; r = q * q;
    return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  }

  // Wilson score interval for k successes in n trials.
  function wilson(k, n, level) {
    if (!n) return [0, 1];
    var z = normInv(1 - (1 - (level || 0.95)) / 2), p = k / n, z2 = z * z;
    var centre = (p + z2 / (2 * n)) / (1 + z2 / n);
    var half = z * Math.sqrt(p * (1 - p) / n + z2 / (4 * n * n)) / (1 + z2 / n);
    return [Math.max(0, centre - half), Math.min(1, centre + half)];
  }

  function logFact(n) { var s = 0; for (var i = 2; i <= n; i++) s += Math.log(i); return s; }
  function logChoose(n, k) { return logFact(n) - logFact(k) - logFact(n - k); }

  // Fisher's exact test on [[a, b], [c, d]] (rows: groups; columns: agree, not).
  function fisher(a, b, c, d) {
    var r1 = a + b, r2 = c + d, c1 = a + c, n = r1 + r2;
    var lo = Math.max(0, c1 - r2), hi = Math.min(r1, c1);
    var denom = logChoose(n, c1);
    function prob(x) { return Math.exp(logChoose(r1, x) + logChoose(r2, c1 - x) - denom); }
    var pObs = prob(a), two = 0, less = 0, greater = 0;
    for (var x = lo; x <= hi; x++) {
      var px = prob(x);
      if (px <= pObs * (1 + 1e-7)) two += px;
      if (x <= a) less += px;
      if (x >= a) greater += px;
    }
    var or = (b * c) === 0 ? Infinity : (a * d) / (b * c);
    return { twoSided: Math.min(1, two), less: Math.min(1, less), greater: Math.min(1, greater), oddsRatio: or, tables: hi - lo + 1 };
  }

  // Counts k (0..n) that print as `pct` percent when rounded half up, or when truncated.
  function countsFor(pct, n) {
    var rounded = [], truncated = [];
    for (var k = 0; k <= n; k++) {
      var v = 100 * k / n;
      if (Math.floor(v + 0.5 + 1e-9) === pct) rounded.push(k);
      if (Math.floor(v + 1e-9) === pct) truncated.push(k);
    }
    return { rounded: rounded, truncated: truncated };
  }

  // Whole-number count behind a printed share of n, if exactly one rounds to it.
  function backCount(pct, n) {
    var r = countsFor(pct, n).rounded;
    if (r.length === 1) return { k: r[0], exact: true };
    var best = Math.round(pct * n / 100);
    return { k: best, exact: false };
  }

  var api = {
    MODULES: MODULES, PILOT_MODULES: PILOT_MODULES, PILOTS: PILOTS, DEMOGRAPHICS: DEMOGRAPHICS,
    ITEMS: ITEMS, RESPONSES: RESPONSES, TIME: TIME, SELECTIONS: SELECTIONS, FOLLOW: FOLLOW,
    INTERVIEWS: INTERVIEWS, ENGLISH: ENGLISH,
    caesar: caesar, letterCounts: letterCounts, englishScore: englishScore, tryEveryKey: tryEveryKey,
    wilson: wilson, fisher: fisher, countsFor: countsFor, backCount: backCount, sum: sum, normInv: normInv
  };
  root.MicroEngine = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof self !== "undefined" ? self : this);

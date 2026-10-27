/*
  Study engine for /papers/future-faculty-step/.

  Burrows, Kukreti, Borowczak, and Safwat (ASEE Annual Conference 2010)
  describe Project STEP at the University of Cincinnati, an NSF GK-12 program
  (DGE-0538532) that placed graduate engineering students ("Fellows") in local
  high schools for about 20 hours a week. The paper reports two frequency
  tables from the 2008-2009 student activity feedback sheets (Figures 2 and 3)
  and percentages from an online survey of 12 of the 15 Fellows from 2006 to
  2009. Everything here is arithmetic on those printed numbers, plus checks the
  paper does not report (the sheet count behind the printed percentages, the
  whole counts behind each Fellow percentage, and Wilson intervals), which the
  page labels as its own. Loads as a page script or in Node.
*/
(function (root) {
  "use strict";

  /* ------------------------------------------------------------ the paper's numbers */

  var PROGRAM = {
    year: 9,               // "in its ninth year"
    fellows: 15,           // Fellows, 2006-2009
    teachers: 36,          // teachers, 2006-2009
    schoolsPerYear: 5,     // average partner high schools per year
    teachersPerFellow: 4,  // typically two math and two science
    hoursPerWeek: 20,
    lessons: 120,          // "120+" lessons created and implemented
    students: 3000,        // "3,000+" students in the past three years
    pis: 6,
    coordinators: 4,
    observations: 15,      // RTOP observations "by the end of May each year"
    summerLessonMin: [10, 15],
    grant: "DGE-0538532"
  };

  // Figure 2: "Overall, I would rate this lesson as:" (2008-2009 sheets, all lessons).
  // Figure 3: "I learned a lot from this lesson" (same sheets).
  // Frequencies and percents exactly as printed; each table's Total row too.
  var TABLES = [
    { key: "rate", fig: 2, prompt: "Overall, I would rate this lesson as:", short: "Rating of the lesson", measure: "Interest",
      options: ["Poor", "Fair", "Average", "Good", "Excellent"],
      freq: [1, 9, 42, 171, 102], pct: [0.3, 2.5, 11.8, 48.2, 28.7],
      total: { freq: 325, pct: 91.5 } },
    { key: "learn", fig: 3, prompt: "I learned a lot from this lesson", short: "I learned a lot", measure: "Learning",
      options: ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"],
      freq: [3, 13, 74, 163, 100], pct: [0.8, 3.7, 20.8, 45.9, 28.2],
      total: { freq: 353, pct: 99.4 } }
  ];

  // Online survey of past Fellows (Figure 4 and the Fellow Feedback Data text).
  var SURVEY = { invited: 15, responded: 12 };
  var FELLOW_ITEMS = [
    { key: "teach", pct: 67, text: "want to teach at some level in the future", tone: "pos" },
    { key: "positive", pct: 70, text: "report an overall positive effect of STEP", tone: "pos" },
    { key: "sensitive", pct: 75, text: "leave more sensitive to the needs of K-12 teachers and learners", tone: "pos" },
    { key: "k12", pct: 80, text: "say STEP highly influenced their understanding of the K-12 environment", tone: "pos" },
    { key: "time", pct: 87, text: "rate STEP as helping them manage time more efficiently", tone: "pos" },
    { key: "effort", pct: 58, n: 7, text: "agree STEP takes more time and effort than they expected", tone: "cost" },
    { key: "research", pct: 33, n: 4, text: "agree STEP leaves too little time for their research", tone: "cost" }
  ];

  /* ------------------------------------------------------------ exact rounding */

  // Round k/n * 100 to d decimals, half up, in integer arithmetic (no float drift).
  // Returns the rounded value as a number.
  function pctRound(k, n, d) {
    var scale = Math.pow(10, d);            // d <= 3 keeps everything well inside 2^53
    var num = 100 * scale * k;              // value*scale = num / n
    var q = Math.floor((2 * num + n) / (2 * n));
    return q / scale;
  }

  function sum(a) { var s = 0; for (var i = 0; i < a.length; i++) s += a[i]; return s; }

  // Every denominator N in [lo, hi] for which every printed percent (and the
  // printed total percent) is freq/N rounded half up to one decimal.
  function denominators(table, lo, hi) {
    var out = [];
    for (var N = lo; N <= hi; N++) {
      var ok = true;
      for (var i = 0; i < table.freq.length && ok; i++) if (pctRound(table.freq[i], N, 1) !== table.pct[i]) ok = false;
      if (ok && pctRound(table.total.freq, N, 1) !== table.total.pct) ok = false;
      if (ok) out.push(N);
    }
    return out;
  }

  // Denominators that fit both tables at once (the same stack of sheets).
  function sharedDenominators(lo, hi) {
    var a = denominators(TABLES[0], lo, hi), b = denominators(TABLES[1], lo, hi);
    return a.filter(function (n) { return b.indexOf(n) >= 0; });
  }

  // Shares of a table under a chosen base: "sheets" (N sheets) or "answered".
  function shares(table, base, N) {
    var d = base === "answered" ? sum(table.freq) : N;
    return table.freq.map(function (f) { return { k: f, n: d, p: f / d, shown: pctRound(f, d, 1) }; });
  }

  // Whole counts k of d whose percentage rounds (half up, whole percent) to p.
  function countsFor(p, d) {
    var out = [];
    for (var k = 0; k <= d; k++) if (pctRound(k, d, 0) === p) out.push(k);
    return out;
  }

  // Nearest whole count of d to a printed percent (for drawing dots).
  function nearestCount(p, d) { return Math.round(p * d / 100); }

  /* ------------------------------------------------------------ intervals */

  // Wilson score interval for k successes in n trials (two-sided, z for 95% by default).
  function wilson(k, n, z) {
    if (z === undefined) z = 1.959963984540054;
    if (n === 0) return [0, 1];
    var p = k / n, z2 = z * z, den = 1 + z2 / n;
    var mid = (p + z2 / (2 * n)) / den;
    var half = (z / den) * Math.sqrt(p * (1 - p) / n + z2 / (4 * n * n));
    return [Math.max(0, mid - half), Math.min(1, mid + half)];
  }

  // Top-two share (the two most favorable options) under a base.
  function topTwo(table, base, N) {
    var k = table.freq[3] + table.freq[4];
    var n = base === "answered" ? sum(table.freq) : N;
    return { k: k, n: n, p: k / n, ci: wilson(k, n) };
  }

  var API = {
    PROGRAM: PROGRAM, TABLES: TABLES, SURVEY: SURVEY, FELLOW_ITEMS: FELLOW_ITEMS,
    pctRound: pctRound, sum: sum, denominators: denominators, sharedDenominators: sharedDenominators,
    shares: shares, countsFor: countsFor, nearestCount: nearestCount, wilson: wilson, topTwo: topTwo
  };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  root.FutureFacultyEngine = API;
})(typeof self !== "undefined" ? self : this);

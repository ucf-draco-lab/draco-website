/*
  Lesson-plan rating engine for /papers/cyber-pd-lesson-plans/.

  Robins, Borowczak, and Borowczak (ASEE 2022) rated each submitted lesson plan
  as struggling, emerging, or excellent on six components. Figure 4 of the paper
  prints the counts as bar labels; Figure 3 prints the overall shares; the
  abstract prints seven component shares; Figure 5 averages each component with
  struggling = 0, emerging = 1, excellent = 2.

  COUNTS is the page's reading of Figure 4 (labels in series order: excellent,
  emerging, struggling, each across the six components). Every component sums
  to 46 plans, and the reading reproduces Figure 3 and all seven abstract shares.
  ALTERNATIVES lists the other tables that fit every printed number (see notes).

  Everything here is plain arithmetic; it loads as a page script or in Node.
*/
(function (root) {
  "use strict";

  var LEVELS = ["struggling", "emerging", "excellent"];

  var COMPONENTS = [
    { key: "org", name: "Organization", short: "Organization" },
    { key: "obj", name: "Objectives", short: "Objectives" },
    { key: "int", name: "Integration", short: "Integration" },
    { key: "act", name: "Activities", short: "Activities" },
    { key: "q", name: "Question strength", short: "Questions" },
    { key: "overall", name: "Overall", short: "Overall" }
  ];

  // [struggling, emerging, excellent]
  var COUNTS = {
    org: [21, 23, 2],
    obj: [12, 12, 22],
    int: [21, 5, 20],
    act: [16, 10, 20],
    q: [19, 12, 15],
    overall: [9, 15, 22]
  };

  // Figure 4's 18 bar labels as extracted, in print order.
  var FIG4_LABELS = [2, 22, 20, 20, 15, 22, 23, 12, 5, 10, 12, 15, 21, 12, 21, 16, 19, 9];

  // Numbers the paper prints, with where they appear.
  var PRINTED = [
    { where: "Figure 3", comp: "overall", level: 0, pct: 19.6, digits: 1 },
    { where: "Figure 3", comp: "overall", level: 1, pct: 32.6, digits: 1 },
    { where: "Figure 3", comp: "overall", level: 2, pct: 47.8, digits: 1 },
    { where: "Abstract", comp: "org", level: 0, pct: 45, digits: 0 },
    { where: "Abstract", comp: "int", level: 0, pct: 46, digits: 0 },
    { where: "Abstract", comp: "q", level: 0, pct: 41, digits: 0 },
    { where: "Abstract", comp: "int", level: 2, pct: 43, digits: 0 },
    { where: "Abstract", comp: "obj", level: 2, pct: 48, digits: 0 },
    { where: "Abstract", comp: "act", level: 2, pct: 43, digits: 0 },
    { where: "Abstract (“catch”)", comp: "overall", level: 2, pct: 48, digits: 0 },
    { where: "Section 4.1", comp: "org", level: 2, count: 2 },
    { where: "Section 4.1", comp: "int", level: 1, count: 5 }
  ];

  // Other tables consistent with every printed number: activities can swap
  // struggling and emerging (16, 10 or 10, 16), and question strength can swap
  // emerging and excellent (12, 15 or 15, 12).
  var ALTERNATIVES = [
    { act: [16, 10, 20], q: [19, 12, 15], label: "Page reading (Figure 4 label order)" },
    { act: [10, 16, 20], q: [19, 12, 15], label: "Activities swapped" },
    { act: [16, 10, 20], q: [19, 15, 12], label: "Questions swapped" },
    { act: [10, 16, 20], q: [19, 15, 12], label: "Both swapped" }
  ];

  function total(c) { return c[0] + c[1] + c[2]; }

  function shares(c) {
    var n = total(c);
    return [c[0] / n, c[1] / n, c[2] / n];
  }

  // Figure 5: struggling 0, emerging w (paper: 1), excellent 2.
  function average(c, w) {
    if (w === undefined) w = 1;
    return (w * c[1] + 2 * c[2]) / total(c);
  }

  function roundTo(x, d) {
    var f = Math.pow(10, d);
    return Math.round(x * f) / f;
  }

  // Does a printed percentage match k of n under rounding or truncation?
  function matchPrinted(k, n, pct, digits) {
    var exact = 100 * k / n;
    var f = Math.pow(10, digits);
    return {
      exact: exact,
      rounded: Math.round(exact * f) / f === pct,
      truncated: Math.floor(exact * f + 1e-9) / f === pct
    };
  }

  // Every whole count out of n that prints as pct (rounding or truncation).
  function countsFor(pct, n, digits) {
    var out = [];
    for (var k = 0; k <= n; k++) {
      var m = matchPrinted(k, n, pct, digits);
      if (m.rounded || m.truncated) out.push(k);
    }
    return out;
  }

  function checkPrinted(counts) {
    counts = counts || COUNTS;
    return PRINTED.map(function (p) {
      var c = counts[p.comp];
      var n = total(c);
      var k = c[p.level];
      if (p.count !== undefined) return { p: p, k: k, n: n, ok: k === p.count, how: k === p.count ? "count" : "no" };
      var m = matchPrinted(k, n, p.pct, p.digits);
      return { p: p, k: k, n: n, exact: m.exact, ok: m.rounded || m.truncated, how: m.rounded ? "rounded" : (m.truncated ? "truncated" : "no") };
    });
  }

  // Wilson score interval, z = 1.959963984540054 by default.
  function wilson(k, n, z) {
    if (z === undefined) z = 1.959963984540054;
    if (n === 0) return [0, 1];
    var p = k / n;
    var z2 = z * z;
    var den = 1 + z2 / n;
    var mid = (p + z2 / (2 * n)) / den;
    var half = (z / den) * Math.sqrt(p * (1 - p) / n + z2 / (4 * n * n));
    return [Math.max(0, mid - half), Math.min(1, mid + half)];
  }

  // Order components by average under emerging weight w (highest first).
  function ranking(w, counts) {
    counts = counts || COUNTS;
    return COMPONENTS.filter(function (c) { return c.key !== "overall"; })
      .map(function (c) { return { key: c.key, name: c.name, avg: average(counts[c.key], w) }; })
      .sort(function (a, b) { return b.avg - a.avg || (a.key < b.key ? -1 : 1); });
  }

  function withAlternative(i) {
    var a = ALTERNATIVES[i];
    var out = {};
    Object.keys(COUNTS).forEach(function (k) { out[k] = COUNTS[k].slice(); });
    out.act = a.act.slice();
    out.q = a.q.slice();
    return out;
  }

  root.LessonPlanEngine = {
    LEVELS: LEVELS,
    COMPONENTS: COMPONENTS,
    COUNTS: COUNTS,
    FIG4_LABELS: FIG4_LABELS,
    PRINTED: PRINTED,
    ALTERNATIVES: ALTERNATIVES,
    total: total,
    shares: shares,
    average: average,
    roundTo: roundTo,
    matchPrinted: matchPrinted,
    countsFor: countsFor,
    checkPrinted: checkPrinted,
    wilson: wilson,
    ranking: ranking,
    withAlternative: withAlternative
  };
  if (typeof module !== "undefined" && module.exports) module.exports = root.LessonPlanEngine;
})(typeof self !== "undefined" ? self : this);

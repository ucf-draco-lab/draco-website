/*
  Engine for /papers/genai-peer-tutor/.
  Data from Mair, Kelley, Wenzel, Borowczak, Li, and Borowczak, "Generative AI Peer
  Tutoring to Support Peer-Reviewed Source Identification and Evaluation" (2026), a
  chapter in The Pedagogical Promptbook (EdTech Books, CC BY 4.0).
  Printed values are copied from the chapter's Tables 1 to 3 and its text.
  Counts recovered from percentages, Wilson intervals, Fisher's exact test, and the
  average-row subset search are this page's own computations.
  Loads as a page script or in a Web Worker.
*/
(function (root) {
  "use strict";

  var DATA = {
    phases: [
      { id: "p1", name: "Phase 1", short: "Phase 1", draft: 4, n: 9,
        who: "Student workers from UCF Libraries and the DRACO Lab",
        setting: "Testing outside class, with a sample or a real assignment",
        platforms: ["ChatGPT", "Gemini", "Gemini Pro", "Perplexity", "Claude", "Grok"],
        instrument: "Revised survey (Likert items on the five criteria, open items) and transcripts" },
      { id: "p2", name: "Phase 2", short: "Phase 2", draft: 4, n: 40,
        who: "Students in two teacher-education courses (15 practicum, 25 introductory)",
        setting: "Class assignments: an article review and practicum mini literature reviews",
        platforms: ["Student choice, mostly ChatGPT and CoPilot"],
        instrument: "Full survey (Qualtrics) or abbreviated survey (Google Forms), transcripts, and rubric scoring of a sample" },
      { id: "p3", name: "Phase 3", short: "Phase 3", draft: 5, n: 5,
        who: "One undergraduate researcher from the DRACO Lab",
        setting: "Technical review: one assignment, consistent replies, five platforms",
        platforms: ["ChatGPT (GPT-5.2)", "CoPilot (Smart GPT-5.1)", "Gemini 3", "DeepSeek 3.2", "Claude Sonnet 4.5"],
        instrument: "Full survey per platform and rubric scoring of each transcript by the lead author" }
    ],
    // Survey shares as printed (Table 2, Table 3, and the Results text), in percent.
    // dec: decimals the chapter prints for that value.
    survey: [
      { id: "just", name: "Amount of information “just right”", item: "Survey item 1", src: "Table 2",
        v: { p1: [55.6, 1], p2: [70, 0], p3: [100, 0] } },
      { id: "nat", name: "Natural language rated very good or excellent", item: "Survey item 4", src: "Table 3",
        v: { p1: [22.2, 1], p2: [40, 0], p3: [100, 0] } },
      { id: "adapt", name: "Adaptability rated very good or excellent", item: "Survey item 6", src: "Table 3",
        v: { p1: [66.7, 1], p2: [72.5, 1], p3: [100, 0] } },
      { id: "qual", name: "Overall quality rated very good or excellent", item: "Survey item 7", src: "Results text",
        v: { p1: [78, 0], p2: [55, 0], p3: [100, 0] } }
    ],
    critique: { p1: { label: "a little too much", v: [44, 0] },
                p2: [{ label: "needed more", v: [15, 0] }, { label: "wanted less", v: [15, 0] }] },
    courses: [
      { id: "prac", name: "Reading education practicum", k: 12, n: 15, printed: 80 },
      { id: "intro", name: "Introduction to the Teaching Profession", k: 10, n: 25, printed: 40 }
    ],
    criteria: [
      { id: "cc", name: "Cognitive congruence", short: "Congruence" },
      { id: "step", name: "Step-by-step guidance", short: "Steps" },
      { id: "avoid", name: "Avoiding giving answers", short: "No answers" },
      { id: "adapt", name: "Adaptability to student level", short: "Adapts" },
      { id: "trans", name: "Transparency", short: "Explains" },
      { id: "dir", name: "Following assignment directions", short: "Directions" }
    ],
    // Table 1: Draft 5 rubric scores (1 to 5) in criteria order, then printed total.
    table1: [
      { id: "claude", name: "Claude Sonnet 4.5", s: [5, 5, 5, 5, 4, 5], total: 29 },
      { id: "deepseek", name: "DeepSeek 3.2", s: [5, 5, 5, 5, 4, 5], total: 29 },
      { id: "copilot", name: "CoPilot Smart GPT 5.1", s: [5, 5, 4, 5, 4, 5], total: 28 },
      { id: "chatgpt", name: "ChatGPT 5.2", s: [5, 4, 4, 5, 5, 5], total: 28 },
      { id: "gemini", name: "Gemini 3", s: [5, 4, 3, 4, 5, 5], total: 26 }
    ],
    table1Average: { s: [5, 4.33, 3.67, 4.67, 4.67, 5], total: 27.33 },
    // Draft 4 to Draft 5 criterion means stated in the text (Figure 2); null = not stated.
    fig2: { cc: [3.38, 5.0], adapt: [3.18, 4.8], avoid: [3.08, 4.2], step: null, trans: null, dir: null }
  };

  function roundTo(x, d) { var f = Math.pow(10, d); return Math.round(x * f + 1e-9) / f; }

  // Every whole-number k in 0..n whose share rounds to the printed value.
  function countsFor(printed, decimals, n) {
    var out = [];
    for (var k = 0; k <= n; k++) if (Math.abs(roundTo(100 * k / n, decimals) - printed) < 1e-9) out.push(k);
    return out;
  }

  // Wilson score interval, 95 percent (z = 1.959963984540054).
  function wilson(k, n, z) {
    z = z || 1.959963984540054;
    var p = k / n, z2 = z * z, den = 1 + z2 / n;
    var c = (p + z2 / (2 * n)) / den;
    var h = (z / den) * Math.sqrt(p * (1 - p) / n + z2 / (4 * n * n));
    return { lo: Math.max(0, c - h), hi: Math.min(1, c + h) };
  }

  function logFact(n) { var s = 0; for (var i = 2; i <= n; i++) s += Math.log(i); return s; }
  function logChoose(n, k) { return logFact(n) - logFact(k) - logFact(n - k); }

  // Two-sided Fisher exact test on [[a, b], [c, d]] (rows: groups; columns: yes, no).
  // Sums every table with the same margins whose probability is at most the observed one,
  // with the relative tolerance SciPy uses (1 + 1e-7).
  function fisher(a, b, c, d) {
    var r1 = a + b, r2 = c + d, c1 = a + c, n = r1 + r2;
    var lo = Math.max(0, c1 - r2), hi = Math.min(r1, c1);
    function lp(x) { return logChoose(r1, x) + logChoose(r2, c1 - x) - logChoose(n, c1); }
    var obs = lp(a), p = 0;
    for (var x = lo; x <= hi; x++) { var v = lp(x); if (v <= obs + Math.log(1 + 1e-7)) p += Math.exp(v); }
    var or = (b * c) === 0 ? Infinity : (a * d) / (b * c);
    return { p: Math.min(1, p), oddsRatio: or };
  }

  function mean(xs) { var s = 0; xs.forEach(function (x) { s += x; }); return s / xs.length; }

  // Column means of Table 1 over a list of platform rows.
  function columnMeans(rows) {
    var m = DATA.criteria.map(function (_, j) { return mean(rows.map(function (r) { return r.s[j]; })); });
    var tot = mean(rows.map(function (r) { return r.s.reduce(function (a, b) { return a + b; }, 0); }));
    return { s: m, total: tot };
  }

  // Which non-empty subsets of the five platforms reproduce the printed Average row
  // (every column to two decimals)?
  function averageRowSubsets() {
    var rows = DATA.table1, hits = [], target = DATA.table1Average;
    for (var mask = 1; mask < (1 << rows.length); mask++) {
      var pick = rows.filter(function (_, i) { return mask & (1 << i); });
      var m = columnMeans(pick), ok = Math.abs(roundTo(m.total, 2) - target.total) < 1e-9;
      m.s.forEach(function (v, j) { if (Math.abs(roundTo(v, 2) - target.s[j]) > 1e-9) ok = false; });
      if (ok) hits.push(pick.map(function (r) { return r.id; }));
    }
    return hits;
  }

  // Recovered counts for every printed survey share.
  function surveyCounts() {
    var out = {};
    DATA.survey.forEach(function (m) {
      out[m.id] = {};
      DATA.phases.forEach(function (ph) {
        var pv = m.v[ph.id];
        out[m.id][ph.id] = { printed: pv[0], decimals: pv[1], n: ph.n, ks: countsFor(pv[0], pv[1], ph.n) };
      });
    });
    return out;
  }

  var api = {
    DATA: DATA, roundTo: roundTo, countsFor: countsFor, wilson: wilson, fisher: fisher,
    columnMeans: columnMeans, averageRowSubsets: averageRowSubsets, surveyCounts: surveyCounts
  };
  root.PeerTutorEngine = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof self !== "undefined" ? self : this);

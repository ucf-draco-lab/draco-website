/*
  Trust but Verify engine for /papers/trust-but-verify/.

  Data: Tables 1 to 5 of Borowczak and Borowczak, "Trust but Verify: Engineering
  Students' Adoption of Generative AI and Pedagogical Implications Across
  Disciplines" (ASEE Southeastern Section 2026, DOI 10.18260/1-2--58017),
  transcribed as printed.

  Functions:
    pct(count, n)            share in percent, unrounded
    round1(x)                round half up to one decimal (as printed)
    reconstruct(pcts, opts)  every (N, counts) whose shares round to the printed
                             percentages; the paper prints counts only for
                             Tables 1 and 2
    wilson(k, n, z)          Wilson score interval (the page's own addition)
    share(counts, from)      share of answers at or above category index `from`

  Loads as a page script or in a Web Worker.
*/
(function (root) {
  "use strict";

  var DATA = {
    n: 147,
    // Table 1: familiarity with AI tools (Q3), counts as printed, N = 146 per row
    t1: {
      scale: ["Not familiar", "Novice", "Intermediate", "Advanced", "Expert"],
      rows: [
        { key: "llm", label: "Large language models", short: "LLMs", counts: [3, 42, 72, 25, 4], pct: [2.1, 28.8, 49.3, 17.1, 2.7] },
        { key: "code", label: "Code generation tools", short: "Code generation", counts: [61, 59, 20, 5, 1], pct: [41.8, 40.4, 13.7, 3.4, 0.7] },
        { key: "spec", label: "Specialized technical AI tools", short: "Specialized", counts: [92, 38, 15, 0, 1], pct: [63.0, 26.0, 10.3, 0.0, 0.7] },
        { key: "doc", label: "Technical documentation AI assistants", short: "Documentation", counts: [85, 38, 17, 5, 1], pct: [58.2, 26.0, 11.6, 3.4, 0.7] }
      ]
    },
    // Table 2: AI task usage (Q4), multi-select, counts and percent as printed
    t2: {
      rows: [
        { key: "debug", label: "Debugging code", count: 118, pct: 80.3 },
        { key: "concepts", label: "Understanding complex concepts", count: 114, pct: 77.6 },
        { key: "initcode", label: "Initial code generation", count: 70, pct: 47.6 },
        { key: "summary", label: "Document summary", count: 66, pct: 44.9 },
        { key: "litrev", label: "Literature review", count: 55, pct: 37.4 },
        { key: "writedoc", label: "Writing documentation", count: 42, pct: 28.6 },
        { key: "tests", label: "Test case generation", count: 42, pct: 28.6 },
        { key: "optim", label: "System optimization", count: 35, pct: 23.8 },
        { key: "other", label: "Other", count: 10, pct: 6.8 }
      ]
    },
    // Table 3: verification of AI-generated outputs (Q5), percent within row
    t3: {
      scale: ["Never", "Rarely", "Sometimes", "Most of the time", "Always"],
      paperFrom: 3, lowTo: 1,
      lowLabel: "Total low", highLabel: "Total high",
      rows: [
        { key: "code", label: "Code", pct: [3.4, 9.6, 19.2, 46.6, 21.2], low: 13.0, high: 67.8 },
        { key: "expl", label: "Technical explanations", pct: [3.4, 7.5, 32.2, 46.6, 10.3], low: 10.9, high: 56.9 },
        { key: "research", label: "Research suggestions", pct: [9.0, 14.5, 27.6, 37.2, 11.7], low: 23.5, high: 48.9 },
        { key: "writing", label: "General writing", pct: [8.2, 21.9, 26.0, 34.9, 8.9], low: 30.1, high: 43.8 }
      ]
    },
    // Table 4: perceived impacts of AI (Q6), percent within row
    t4: {
      scale: ["No impact", "Minimal", "Average", "Some", "Significant"],
      paperFrom: 3, lowTo: 1,
      lowLabel: "Total low", highLabel: "Total high",
      rows: [
        { key: "problem", label: "Problem-solving approach", pct: [9.7, 24.8, 46.2, 13.1, 6.2], low: 34.5, high: 19.3 },
        { key: "learning", label: "Learning approach", pct: [6.2, 24.1, 36.6, 21.4, 11.7], low: 30.3, high: 33.1 },
        { key: "time", label: "Time management", pct: [17.9, 28.3, 25.5, 24.1, 4.1], low: 46.2, high: 28.3 },
        { key: "programming", label: "Programming approach", pct: [4.1, 20.0, 39.3, 29.7, 6.9], low: 24.1, high: 36.6 },
        { key: "writing", label: "Writing approach", pct: [24.1, 24.8, 32.4, 12.4, 6.2], low: 48.9, high: 18.6 }
      ]
    },
    // Table 5: attitudes toward AI (Q7), percent within statement
    t5: {
      scale: ["Strongly disagree", "Disagree", "Somewhat disagree", "Neither", "Somewhat agree", "Agree", "Strongly agree"],
      paperFrom: 5, lowTo: -1,
      highLabel: "Total agree",
      rows: [
        { key: "understanding", label: "Improved my understanding", short: "Understanding", pct: [2.7, 2.7, 0.0, 9.6, 15.1, 47.3, 22.6], high: 69.9 },
        { key: "troubleshooting", label: "Troubleshooting, learning from mistakes", short: "Troubleshooting", pct: [2.1, 5.5, 1.4, 11.6, 19.2, 40.4, 19.9], high: 60.3 },
        { key: "critical", label: "Critical thinking", short: "Critical thinking", pct: [4.8, 12.3, 2.1, 28.1, 15.8, 25.3, 11.6], high: 37.0 },
        { key: "reliant", label: "Heavy reliance on AI", short: "Reliance", pct: [10.3, 29.0, 13.1, 26.9, 11.0, 6.2, 3.4], high: 9.7 }
      ]
    }
  };

  function sum(a) { var s = 0; for (var i = 0; i < a.length; i++) s += a[i]; return s; }
  function pct(count, n) { return 100 * count / n; }
  // Round half up at one decimal, guarding against binary representation (56.85 -> 56.9).
  function round1(x) { return Math.round(x * 10 + 1e-9) / 10; }
  function share(counts, from) { var s = 0; for (var i = from; i < counts.length; i++) s += counts[i]; return s; }
  function sumRounded(p, from, to) { var s = 0; for (var i = from; i <= to; i++) s += p[i]; return Math.round(s * 10) / 10; }

  // A count c out of N matches a printed one-decimal percent p when 100c/N lies
  // within half a unit of the last printed digit (ties count both ways).
  function matches(c, N, p, tol) { return Math.abs(100 * c / N - p) <= tol + 1e-9; }

  function reconstruct(pcts, opts) {
    opts = opts || {};
    var nMin = opts.nMin || 1, nMax = opts.nMax || DATA.n, tol = opts.tol === undefined ? 0.05 : opts.tol;
    var solutions = [], tried = 0, combos = 0;
    for (var N = nMin; N <= nMax; N++) {
      tried++;
      var cands = [], dead = false;
      for (var j = 0; j < pcts.length; j++) {
        var lo = Math.max(0, Math.floor((pcts[j] - tol) * N / 100) - 1), hi = Math.min(N, Math.ceil((pcts[j] + tol) * N / 100) + 1);
        var list = [];
        for (var c = lo; c <= hi; c++) if (matches(c, N, pcts[j], tol)) list.push(c);
        if (!list.length) { dead = true; break; }
        cands.push(list);
      }
      if (dead) continue;
      // Depth-first over candidate counts, keeping only combinations that sum to N.
      (function walk(j, acc, total) {
        if (j === cands.length) { combos++; if (total === N) solutions.push({ N: N, counts: acc.slice() }); return; }
        for (var k = 0; k < cands[j].length; k++) { acc.push(cands[j][k]); walk(j + 1, acc, total + cands[j][k]); acc.pop(); }
      })(0, [], 0);
    }
    return { solutions: solutions, tried: tried, combos: combos };
  }

  // Wilson score interval for k successes in n trials.
  function wilson(k, n, z) {
    z = z || 1.959963984540054;
    if (!n) return [0, 1];
    var p = k / n, z2 = z * z, den = 1 + z2 / n;
    var center = (p + z2 / (2 * n)) / den;
    var half = z * Math.sqrt(p * (1 - p) / n + z2 / (4 * n * n)) / den;
    return [Math.max(0, center - half), Math.min(1, center + half)];
  }

  // Counts for every row of Tables 3 to 5, reconstructed once.
  var cache = {};
  function countsFor(tableKey, rowKey) {
    var id = tableKey + ":" + rowKey;
    if (cache[id]) return cache[id];
    var t = DATA[tableKey], row = null;
    for (var i = 0; i < t.rows.length; i++) if (t.rows[i].key === rowKey) row = t.rows[i];
    if (!row) return null;
    if (row.counts) { cache[id] = { N: sum(row.counts), counts: row.counts.slice(), printed: true }; return cache[id]; }
    var r = reconstruct(row.pct);
    cache[id] = r.solutions.length === 1 ? { N: r.solutions[0].N, counts: r.solutions[0].counts, printed: false, unique: true } :
      { N: null, counts: null, printed: false, unique: false, solutions: r.solutions };
    return cache[id];
  }

  var api = {
    DATA: DATA, sum: sum, pct: pct, round1: round1, share: share, sumRounded: sumRounded,
    reconstruct: reconstruct, wilson: wilson, countsFor: countsFor
  };
  root.TrustVerifyEngine = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof self !== "undefined" ? self : this);

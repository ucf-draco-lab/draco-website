/*
  Engine for /papers/cyber-authentic-inquiry/.

  Data: Borowczak and Borowczak, "Enabling Advanced Topics in Computing and
  Engineering Through Authentic Inquiry: A Cybersecurity Case Study," ASEE
  Annual Conference 2018 (DOI 10.18260/1-2--30370), Tables 1 to 6 and the
  Methods & Participants and Analysis sections.

  Computations:
    agreement(M)        diagonal count, share, margins, and Cohen's kappa
    exactAgreement(M)   every 4 x 4 table with M's row and column totals, its
                        hypergeometric probability, and P(diagonal >= observed)
    groupSizes(opts)    every split of students across the five
                        proposal -> product cells of Table 6 that reproduces
                        Table 2's averages under a rounding rule
  Everything except the paper's own counts is the page's computation; the
  widget labels it so. Loads as a page script or in Node.
*/
(function (root) {
  "use strict";

  var TYPES = ["app", "res", "mix", "lit"];
  var LABEL = { app: "Application", res: "Research", mix: "Research & Application", lit: "Literature survey" };
  var SHORT = { app: "App", res: "Res", mix: "R&A", lit: "Lit" };

  // Confusion matrices as printed: rows = delivered type (true), columns =
  // proposed type (predicted), order app, res, mix, lit. Table 3 prints "-"
  // in the Application row, Mixed column; its row total (6) makes that cell 0.
  var DATA = {
    students: 33,
    groups: 12,
    standing: { sophomore: 2, junior: 6, senior: 25 },
    nonTraditional: 3,
    capstone: 25,
    continuing: { students: 14, groups: 4 },
    t1: { self: { app: 5, mix: 3, res: 4, lit: 0 }, actual: { app: 5, mix: 2, res: 2, lit: 3 } },
    t2: { self: { app: 3.6, mix: 2.3, res: 1.8, lit: 0 }, actual: { app: 3.6, mix: 2.5, res: 1.0, lit: 2.3 } },
    reportedAverage: 2.7,
    checkpoints: [
      { id: "midterm", label: "Midterm report", short: "Midterm", table: 3, printed: { n: 6, pct: 50 },
        M: [[5, 1, 0, 0], [0, 0, 1, 0], [0, 0, 1, 0], [0, 3, 1, 0]] },
      { id: "final", label: "Final report", short: "Final", table: 4, printed: { n: 9, pct: 75 },
        M: [[5, 0, 0, 0], [0, 2, 1, 0], [0, 1, 2, 0], [0, 1, 0, 0]] },
      { id: "poster", label: "Poster", short: "Poster", table: 5, printed: { n: 9, pct: 75 },
        M: [[5, 0, 0, 0], [0, 2, 1, 0], [0, 1, 2, 0], [0, 1, 0, 0]] },
      { id: "actual", label: "Final product (actual)", short: "Actual", table: 6, printed: { n: 9, pct: 75 },
        M: [[5, 0, 0, 0], [0, 2, 0, 0], [0, 0, 2, 0], [0, 2, 1, 0]] }
    ]
  };

  function rowSums(M) { return M.map(function (r) { return r.reduce(function (a, b) { return a + b; }, 0); }); }
  function colSums(M) { return M[0].map(function (_, j) { return M.reduce(function (a, r) { return a + r[j]; }, 0); }); }
  function total(M) { return rowSums(M).reduce(function (a, b) { return a + b; }, 0); }
  function diag(M) { var s = 0; for (var i = 0; i < M.length; i++) s += M[i][i]; return s; }

  function agreement(M) {
    var n = total(M), r = rowSums(M), c = colSums(M), d = diag(M);
    var po = d / n, pe = 0;
    for (var i = 0; i < r.length; i++) pe += r[i] * c[i];
    pe /= n * n;
    return { n: n, diag: d, share: po, rows: r, cols: c, pe: pe, kappa: (po - pe) / (1 - pe) };
  }

  // log factorials up to 64
  var LF = [0];
  for (var k = 1; k <= 64; k++) LF[k] = LF[k - 1] + Math.log(k);

  // Every non-negative integer table with row totals r and column totals c.
  function tables(r, c, visit) {
    var R = r.length, C = c.length, T = [], colLeft = c.slice();
    for (var i = 0; i < R; i++) T.push(new Array(C).fill(0));
    function fillRow(i, j, left) {
      if (i === R - 1) {
        // last row is forced by the column totals
        for (var jj = 0; jj < C; jj++) T[i][jj] = colLeft[jj];
        var s = 0; for (jj = 0; jj < C; jj++) s += T[i][jj];
        if (s === r[i]) visit(T);
        return;
      }
      if (j === C - 1) {
        if (left > colLeft[j]) return;
        T[i][j] = left; colLeft[j] -= left;
        fillRow(i + 1, 0, r[i + 1]);
        colLeft[j] += left; T[i][j] = 0;
        return;
      }
      var hi = Math.min(left, colLeft[j]);
      for (var v = 0; v <= hi; v++) {
        T[i][j] = v; colLeft[j] -= v;
        fillRow(i, j + 1, left - v);
        colLeft[j] += v;
      }
      T[i][j] = 0;
    }
    fillRow(0, 0, r[0]);
  }

  // Fisher-Freeman-Halton probability of a table given its margins.
  function logProb(T, r, c, n) {
    var lp = -LF[n], i, j;
    for (i = 0; i < r.length; i++) lp += LF[r[i]];
    for (j = 0; j < c.length; j++) lp += LF[c[j]];
    for (i = 0; i < T.length; i++) for (j = 0; j < T[i].length; j++) lp -= LF[T[i][j]];
    return lp;
  }

  function exactAgreement(M) {
    var a = agreement(M), r = a.rows, c = a.cols, n = a.n;
    var count = 0, sum = 0, upper = 0, dist = {};
    tables(r, c, function (T) {
      var p = Math.exp(logProb(T, r, c, n)), d = diag(T);
      count++; sum += p;
      dist[d] = (dist[d] || 0) + p;
      if (d >= a.diag) upper += p;
    });
    var expected = 0;
    Object.keys(dist).forEach(function (d) { expected += Number(d) * dist[d]; });
    return { tables: count, totalProb: sum, p: upper, dist: dist, expectedDiag: expected, observed: a.diag };
  }

  // Rounding rules for a printed one-decimal average.
  var ROUND = {
    nearest: function (x) { return Math.round(x * 10 + 1e-9) / 10; },
    truncate: function (x) { return Math.floor(x * 10 + 1e-9) / 10; }
  };

  // Table 6 says which proposal type became which product. Each nonzero cell
  // is a set of groups whose combined size is unknown; Table 2 constrains the
  // sums through its self-identified (by proposal) and actual (by product)
  // averages. Enumerate every assignment of cell sums (each group 1..maxSize).
  function groupSizes(opts) {
    opts = opts || {};
    var rule = ROUND[opts.rounding || "nearest"];
    var maxSize = opts.maxSize || 8;
    var M = DATA.checkpoints[3].M;
    var cells = [];
    for (var i = 0; i < 4; i++) for (var j = 0; j < 4; j++) if (M[i][j] > 0)
      cells.push({ product: TYPES[i], proposal: TYPES[j], groups: M[i][j] });
    var sols = [];
    var sums = new Array(cells.length).fill(0);
    function check() {
      var byProp = {}, byProd = {}, nProp = {}, nProd = {};
      TYPES.forEach(function (t) { byProp[t] = 0; byProd[t] = 0; nProp[t] = 0; nProd[t] = 0; });
      cells.forEach(function (cell, k) {
        byProp[cell.proposal] += sums[k]; nProp[cell.proposal] += cell.groups;
        byProd[cell.product] += sums[k]; nProd[cell.product] += cell.groups;
      });
      for (var t = 0; t < 4; t++) {
        var ty = TYPES[t];
        var s = nProp[ty] ? rule(byProp[ty] / nProp[ty]) : 0;
        var a = nProd[ty] ? rule(byProd[ty] / nProd[ty]) : 0;
        if (Math.abs(s - DATA.t2.self[ty]) > 1e-9 || Math.abs(a - DATA.t2.actual[ty]) > 1e-9) return;
      }
      var tot = sums.reduce(function (x, y) { return x + y; }, 0);
      if (opts.total && tot !== opts.total) return;
      sols.push({ sums: sums.slice(), total: tot, byProposal: byProp, byProduct: byProd });
    }
    function rec(k) {
      if (k === cells.length) { check(); return; }
      for (var s = cells[k].groups; s <= cells[k].groups * maxSize; s++) { sums[k] = s; rec(k + 1); }
    }
    rec(0);
    var totals = {};
    sols.forEach(function (s) { totals[s.total] = (totals[s.total] || 0) + 1; });
    return { cells: cells, solutions: sols, totals: totals, rounding: opts.rounding || "nearest" };
  }

  root.CyberInquiryEngine = {
    TYPES: TYPES, LABEL: LABEL, SHORT: SHORT, DATA: DATA,
    rowSums: rowSums, colSums: colSums, total: total, diag: diag,
    agreement: agreement, exactAgreement: exactAgreement, groupSizes: groupSizes, ROUND: ROUND
  };
  if (typeof module !== "undefined" && module.exports) module.exports = root.CyberInquiryEngine;
})(typeof self !== "undefined" ? self : this);

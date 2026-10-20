/*
  Spy Hunter engine for /papers/spy-hunter-keystrokes/.

  Ports the method of Manandhar, Wolf, and Borowczak (ICMLA 2019,
  DOI 10.1109/ICMLA.2019.00207; arXiv 1903.03132):
    - five timing features per keystroke (hold, UD, UU, DD, DU), keys never stored
    - the 96 to 825 ms outlier filter
    - one-class support vector machines with RBF kernels, a port of the libsvm
      one-class solver that scikit-learn's OneClassSVM wraps (nu = 0.5, tol = 0.001,
      single-precision kernel cache, second-order working set selection)
    - the trust model that judges blocks of n keystrokes and locks out below lambda

  Loads as a page script or in a Web Worker: exposes self.SpyHunter.
*/
(function (root) {
  "use strict";

  /* ------------------------------------------------------------ features */

  var FEATURES = ["hold", "ud", "uu", "dd", "du"];
  var FEATURE_LABELS = { hold: "Hold", ud: "UD", uu: "UU", dd: "DD", du: "DU" };

  // events: [{ down: seconds, up: seconds }] in any order. Returns one row per
  // keystroke after the first, in press order: [hold, ud, uu, dd, du] in seconds.
  function features(events) {
    var ev = events.slice().sort(function (a, b) { return a.down - b.down; });
    var rows = [];
    for (var k = 1; k < ev.length; k++) {
      var p = ev[k - 1], c = ev[k];
      rows.push([
        c.up - c.down,      // hold: press to release of this key
        c.down - p.up,      // UD: release of previous key to press of this key
        c.up - p.up,        // UU: release to release
        c.down - p.down,    // DD: press to press
        c.up - p.down       // DU: press of previous key to release of this key
      ]);
    }
    return rows;
  }

  // The paper's pre-processing: drop any row with a timing below 96 ms or above 825 ms.
  var FILTER_LO = 0.096, FILTER_HI = 0.825;
  function keepRow(r) {
    for (var i = 0; i < r.length; i++) if (r[i] < FILTER_LO || r[i] > FILTER_HI) return false;
    return true;
  }
  function filterRows(rows) { return rows.filter(keepRow); }

  /* ------------------------------------------------------------ Table I */

  // Table I as printed (seconds): hold, UD, UU, DD, DU.
  var TABLE1 = [
    [0.0957, 0.0235, 0.1192, 0.1045, 0.2002],
    [0.0878, 0.0567, 0.1445, 0.1523, 0.2401],
    [0.0966, 0.3350, 0.4316, 0.4228, 0.5194],
    [0.1114, 0.0410, 0.1524, 0.1376, 0.2490],
    [0.0801, 0.0957, 0.1758, 0.2071, 0.2872],
    [0.0958, 0.3280, 0.4238, 0.4081, 0.5039]
  ];

  // The six rows are consecutive keystrokes: DD - UD of each row equals the hold
  // time of the row before it. Rebuild seven press and release times from the
  // printed hold and DD columns (the key before row 1 held DD1 - UD1 = 81 ms).
  function table1Events() {
    var ev = [{ down: 0, up: TABLE1[0][3] - TABLE1[0][1] }];
    for (var k = 0; k < TABLE1.length; k++) {
      var down = ev[k].down + TABLE1[k][3];
      ev.push({ down: down, up: down + TABLE1[k][0] });
    }
    return ev;
  }

  /* ------------------------------------------------------------ one-class SVM */

  var TAU = 1e-12;
  var f32 = Math.fround || function (x) { return x; };

  function dot(a, b) { var s = 0; for (var i = 0; i < a.length; i++) s += a[i] * b[i]; return s; }

  // Train a one-class SVM (libsvm formulation: min 0.5 a'Qa, 0 <= a_i <= 1,
  // sum a = nu * l). Returns { sv, coef, rho, gamma, iter }.
  function trainOCSVM(X, gamma, nu, eps) {
    nu = nu == null ? 0.5 : nu;
    eps = eps == null ? 1e-3 : eps;
    var l = X.length, i, j, k;
    if (l < 2) throw new Error("need at least two rows");
    var x2 = new Float64Array(l);
    for (i = 0; i < l; i++) x2[i] = dot(X[i], X[i]);
    // Kernel matrix in single precision, as libsvm's Qfloat cache stores it.
    var Q = new Float32Array(l * l);
    for (i = 0; i < l; i++) {
      Q[i * l + i] = 1;
      for (j = i + 1; j < l; j++) {
        var v = f32(Math.exp(-gamma * (x2[i] + x2[j] - 2 * dot(X[i], X[j]))));
        Q[i * l + j] = v; Q[j * l + i] = v;
      }
    }
    var alpha = new Float64Array(l);
    var n = Math.floor(nu * l);
    for (i = 0; i < n; i++) alpha[i] = 1;
    if (n < l) alpha[n] = nu * l - n;
    var G = new Float64Array(l);
    for (i = 0; i < l; i++) {
      if (alpha[i] > 0) {
        var ai = alpha[i], off = i * l;
        for (k = 0; k < l; k++) G[k] += ai * Q[off + k];
      }
    }
    function upper(t) { return alpha[t] >= 1; }
    function lower(t) { return alpha[t] <= 0; }

    var maxIter = Math.max(10000000, 100 * l), iter = 0;
    while (iter < maxIter) {
      // second-order working set selection (Fan, Chen, and Lin 2005), all y = +1
      var Gmax = -Infinity, Gmax2 = -Infinity, iIdx = -1, jIdx = -1, objMin = Infinity;
      for (k = 0; k < l; k++) if (!upper(k) && -G[k] >= Gmax) { Gmax = -G[k]; iIdx = k; }
      if (iIdx < 0) break;
      var oi = iIdx * l;
      for (k = 0; k < l; k++) {
        if (lower(k)) continue;
        var gd = Gmax + G[k];
        if (G[k] >= Gmax2) Gmax2 = G[k];
        if (gd > 0) {
          var qc = 2 - 2 * Q[oi + k];
          var od = qc > 0 ? -(gd * gd) / qc : -(gd * gd) / TAU;
          if (od <= objMin) { jIdx = k; objMin = od; }
        }
      }
      if (Gmax + Gmax2 < eps || jIdx === -1) break;
      iter++;
      i = iIdx; j = jIdx;
      var oj = j * l;
      var oldI = alpha[i], oldJ = alpha[j];
      var quad = 2 - 2 * Q[oi + j];
      if (quad <= 0) quad = TAU;
      var delta = (G[i] - G[j]) / quad;
      var sum = alpha[i] + alpha[j];
      alpha[i] -= delta; alpha[j] += delta;
      if (sum > 1) { if (alpha[i] > 1) { alpha[i] = 1; alpha[j] = sum - 1; } }
      else { if (alpha[j] < 0) { alpha[j] = 0; alpha[i] = sum; } }
      if (sum > 1) { if (alpha[j] > 1) { alpha[j] = 1; alpha[i] = sum - 1; } }
      else { if (alpha[i] < 0) { alpha[i] = 0; alpha[j] = sum; } }
      var dI = alpha[i] - oldI, dJ = alpha[j] - oldJ;
      for (k = 0; k < l; k++) G[k] += Q[oi + k] * dI + Q[oj + k] * dJ;
    }
    // rho, as libsvm's calculate_rho with y = +1
    var ub = Infinity, lb = -Infinity, nFree = 0, sumFree = 0;
    for (k = 0; k < l; k++) {
      if (upper(k)) lb = Math.max(lb, G[k]);
      else if (lower(k)) ub = Math.min(ub, G[k]);
      else { nFree++; sumFree += G[k]; }
    }
    var rho = nFree > 0 ? sumFree / nFree : (ub + lb) / 2;
    var sv = [], coef = [];
    for (k = 0; k < l; k++) if (alpha[k] > 0) { sv.push(X[k]); coef.push(alpha[k]); }
    return { sv: sv, coef: coef, rho: rho, gamma: gamma, nu: nu, iter: iter, l: l };
  }

  function decision(model, x) {
    var s = 0, x2 = dot(x, x);
    for (var i = 0; i < model.sv.length; i++) {
      var v = model.sv[i];
      s += model.coef[i] * Math.exp(-model.gamma * (dot(v, v) + x2 - 2 * dot(v, x)));
    }
    return s - model.rho;
  }
  // libsvm labels a row +1 (genuine) when the decision value is above zero.
  function predict(model, x) { return decision(model, x) > 0 ? 1 : -1; }

  /* ------------------------------------------------------------ trust model */

  // Paper settings (Section V): n = 6, g1 = 0.01, g2 = 50, acc = 65 %,
  // lambda = 70, weights 10, 8, 0.03, and 2.
  var DEFAULTS = { n: 6, g1: 0.01, g2: 50, acc: 0.65, lambda: 70, w1: 10, w2: 8, w3: 0.03, w4: 2, nu: 0.5 };

  // a = fraction of the block's rows labeled intruder (-1) by each classifier.
  // Rules (a) to (d) as the paper's text describes them; the trust level never
  // rises above 100. Returns { T, rule, change }.
  function trustStep(T, a1, a2, p) {
    var avg = (a1 + a2) / 2, rule, change;
    if (a1 >= p.acc && a2 >= p.acc) { rule = "a"; change = -p.w1 * avg; }
    else if (a1 >= p.acc || a2 >= p.acc) { rule = "b"; change = -p.w2 * avg; }
    else if (a1 === 0 || a2 === 0) { rule = "d"; change = p.w4 * (1 - avg); }
    else { rule = "c"; change = -p.w3 * avg; }
    var next = Math.min(100, T + change);
    return { T: next, rule: rule, change: next - T };
  }

  // Judge a stream of rows block by block. Returns { locked, blocks: [...], lockBlock }.
  function runSession(m1, m2, rows, p) {
    var T = 100, out = [], n = p.n;
    for (var b = 0; b + n <= rows.length; b += n) {
      var bad1 = 0, bad2 = 0;
      for (var r = b; r < b + n; r++) {
        if (predict(m1, rows[r]) < 0) bad1++;
        if (predict(m2, rows[r]) < 0) bad2++;
      }
      var a1 = bad1 / n, a2 = bad2 / n;
      var s = trustStep(T, a1, a2, p);
      T = s.T;
      out.push({ a1: a1, a2: a2, T: T, rule: s.rule, change: s.change });
      if (T < p.lambda) return { locked: true, blocks: out, lockBlock: out.length };
    }
    return { locked: false, blocks: out, lockBlock: null };
  }

  function train(rows, p) {
    return { m1: trainOCSVM(rows, p.g1, p.nu), m2: trainOCSVM(rows, p.g2, p.nu) };
  }

  /* ------------------------------------------------------------ simulated typists */

  function mulberry(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function gauss(rnd) {
    var u = 0, v = 0;
    while (u === 0) u = rnd();
    while (v === 0) v = rnd();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  // A simulated typist: log-normal hold times and release-to-press gaps around
  // the typist's own medians, with longer gaps after each word. Simulated, not data.
  function makeTypist(seed) {
    var r = mulberry(seed);
    return {
      seed: seed,
      hold: 0.075 + 0.08 * r(),        // median hold, seconds
      holdSd: 0.1 + 0.1 * r(),         // log-scale spread
      gap: 0.09 + 0.16 * r(),          // median release-to-press gap within a word
      gapSd: 0.25 + 0.2 * r(),
      wordGap: 1.4 + 1.2 * r(),        // multiplier on the gap after a word
      wordLen: 4 + Math.floor(3 * r())
    };
  }
  function typeKeys(typist, count, seed) {
    var r = mulberry(seed), ev = [], t = 0, inWord = 0, lastUp = 0;
    for (var k = 0; k < count; k++) {
      var gap = typist.gap * Math.exp(typist.gapSd * gauss(r));
      if (inWord === 0 && k > 0) gap *= typist.wordGap;
      t = lastUp + gap;
      var hold = typist.hold * Math.exp(typist.holdSd * gauss(r));
      ev.push({ down: t, up: t + hold });
      lastUp = t + hold;
      inWord = (inWord + 1) % (typist.wordLen + 1);
    }
    return ev;
  }

  /* ------------------------------------------------------------ exports */

  root.SpyHunter = {
    FEATURES: FEATURES,
    FEATURE_LABELS: FEATURE_LABELS,
    FILTER_LO: FILTER_LO,
    FILTER_HI: FILTER_HI,
    TABLE1: TABLE1,
    DEFAULTS: DEFAULTS,
    features: features,
    keepRow: keepRow,
    filterRows: filterRows,
    table1Events: table1Events,
    trainOCSVM: trainOCSVM,
    decision: decision,
    predict: predict,
    trustStep: trustStep,
    runSession: runSession,
    train: train,
    mulberry: mulberry,
    makeTypist: makeTypist,
    typeKeys: typeKeys
  };
})(typeof self !== "undefined" ? self : this);

/*
  Jangseung engine for /papers/jangseung-poisoning/.

  A browser reconstruction of the experiment in Wolf, Gamboa, and Borowczak,
  "Jangseung: A Guardian for Machine Learning Algorithms to Protect Against
  Poisoning Attacks" (IEEE ISC2 2021). No code from the authors is public.
  The pieces follow the scikit-learn defaults the paper's numbers point to:

  - SVC: C-support vector classification with an RBF kernel, C = 1,
    gamma = 1 / (n_features * X.var()) ("scale"), solved with libsvm's SMO
    (second-order working-set selection, tolerance 1e-3).
  - IsolationForest: 100 extremely randomized trees on subsamples of
    min(256, n) points drawn without replacement, depth limit
    ceil(log2(subsample)), anomaly score -2^(-E[h(x)] / c(subsample)), and
    the "auto" cut: a point passes when its score is at least -0.5.
  - Adv_Point (the paper's Algorithm 1): unit-vector gradient ascent on the
    hinge loss of the flipped point with step t = 0.001 and tolerance
    1e-5, capped at a fixed number of steps (the page's choice; the paper's
    loop has no cap).
  - Test_Jangseung (Algorithm 2): every poisoned point enters the unguarded
    training set; it enters the guarded set only when the detector trained on
    the class it claims accepts it. Both SVMs are retrained after each point.

  Loads as a page script and inside a Web Worker.
*/
(function (root) {
  "use strict";

  /* ------------------------------------------------------------ random numbers */

  // mulberry32: small, fast, seedable; the page's own generator.
  function rng(seed) {
    var a = (seed >>> 0) || 1;
    var r = function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    r.int = function (n) { return Math.floor(r() * n); };
    r.uniform = function (lo, hi) { return lo + (hi - lo) * r(); };
    return r;
  }
  function shuffle(arr, r) {
    for (var i = arr.length - 1; i > 0; i--) { var j = r.int(i + 1); var t = arr[i]; arr[i] = arr[j]; arr[j] = t; }
    return arr;
  }

  /* ------------------------------------------------------------ data store */

  // A growing set of row vectors with cached pairwise squared distances.
  function Store(d, cap) {
    this.d = d; this.n = 0; this.cap = cap;
    this.X = new Float64Array(cap * d);
    this.y = new Int8Array(cap);
    this.sq = new Float64Array(cap);
    this.D2 = new Float64Array(cap * cap);
    this.sum = 0; this.sum2 = 0;
  }
  Store.prototype.add = function (row, label) {
    var d = this.d, n = this.n, X = this.X, off = n * d, s = 0, i, k;
    if (n >= this.cap) throw new Error("Store full");
    for (k = 0; k < d; k++) { var v = row[k]; X[off + k] = v; s += v * v; this.sum += v; this.sum2 += v * v; }
    this.sq[n] = s; this.y[n] = label;
    for (i = 0; i < n; i++) {
      var dot = 0, o = i * d;
      for (k = 0; k < d; k++) dot += X[o + k] * X[off + k];
      var dd = this.sq[i] + s - 2 * dot; if (dd < 0) dd = 0;
      this.D2[i * this.cap + n] = dd; this.D2[n * this.cap + i] = dd;
    }
    this.D2[n * this.cap + n] = 0;
    this.n = n + 1;
    return n;
  };
  // scikit-learn gamma="scale": 1 / (n_features * X.var()) over every entry.
  Store.prototype.gammaScale = function () {
    var m = this.n * this.d; if (!m) return 1;
    var mean = this.sum / m, v = this.sum2 / m - mean * mean;
    if (v <= 1e-300) return 1;
    // two-pass variance for accuracy
    var X = this.X, acc = 0;
    for (var i = 0; i < m; i++) { var e = X[i] - mean; acc += e * e; }
    v = acc / m;
    return v > 0 ? 1 / (this.d * v) : 1;
  };
  Store.prototype.row = function (i) { return this.X.subarray(i * this.d, (i + 1) * this.d); };

  /* ------------------------------------------------------------ SVC (libsvm SMO) */

  var TAU = 1e-12;
  // Train on the rows listed in idx (indices into store). Returns a model.
  function trainSVC(store, idx, opts) {
    opts = opts || {};
    var C = opts.C || 1, eps = opts.tol || 1e-3;
    var n = idx.length, cap = store.cap, D2 = store.D2;
    var g = opts.gamma != null ? opts.gamma : gammaOver(store, idx);
    var y = new Int8Array(n), K = new Float64Array(n * n), i, j;
    for (i = 0; i < n; i++) y[i] = store.y[idx[i]];
    for (i = 0; i < n; i++) {
      var ri = idx[i] * cap; K[i * n + i] = 1;
      for (j = i + 1; j < n; j++) { var v = Math.exp(-g * D2[ri + idx[j]]); K[i * n + j] = v; K[j * n + i] = v; }
    }
    var a = new Float64Array(n), G = new Float64Array(n);
    for (i = 0; i < n; i++) G[i] = -1;
    var maxIter = Math.max(10000000, n > 21474836 ? 2147483647 : 100 * n), iter = 0;
    while (iter < maxIter) {
      // select working set (WSS 2)
      var Gmax = -Infinity, ii = -1, t;
      for (t = 0; t < n; t++) {
        if (y[t] === 1) { if (a[t] < C && -G[t] >= Gmax) { Gmax = -G[t]; ii = t; } }
        else { if (a[t] > 0 && G[t] >= Gmax) { Gmax = G[t]; ii = t; } }
      }
      var Gmax2 = -Infinity, jj = -1, objMin = Infinity;
      if (ii !== -1) {
        var Ki = ii * n;
        for (t = 0; t < n; t++) {
          var gd, qc;
          if (y[t] === 1) {
            if (a[t] > 0) {
              gd = Gmax + G[t];
              if (G[t] >= Gmax2) Gmax2 = G[t];
              if (gd > 0) {
                qc = 2 - 2 * K[Ki + t];
                var od = -(gd * gd) / (qc > 0 ? qc : TAU);
                if (od <= objMin) { jj = t; objMin = od; }
              }
            }
          } else {
            if (a[t] < C) {
              gd = Gmax - G[t];
              if (-G[t] >= Gmax2) Gmax2 = -G[t];
              if (gd > 0) {
                qc = 2 - 2 * K[Ki + t];
                var od2 = -(gd * gd) / (qc > 0 ? qc : TAU);
                if (od2 <= objMin) { jj = t; objMin = od2; }
              }
            }
          }
        }
      }
      if (ii === -1 || Gmax + Gmax2 < eps || jj === -1) break;
      iter++;
      i = ii; j = jj;
      var Qij = y[i] * y[j] * K[i * n + j];
      var oi = a[i], oj = a[j], quad, delta, diff, sum;
      if (y[i] !== y[j]) {
        quad = 2 + 2 * Qij; if (quad <= 0) quad = TAU;
        delta = (-G[i] - G[j]) / quad; diff = a[i] - a[j];
        a[i] += delta; a[j] += delta;
        if (diff > 0) { if (a[j] < 0) { a[j] = 0; a[i] = diff; } }
        else { if (a[i] < 0) { a[i] = 0; a[j] = -diff; } }
        if (diff > 0) { if (a[i] > C) { a[i] = C; a[j] = C - diff; } }
        else { if (a[j] > C) { a[j] = C; a[i] = C + diff; } }
      } else {
        quad = 2 - 2 * Qij; if (quad <= 0) quad = TAU;
        delta = (G[i] - G[j]) / quad; sum = a[i] + a[j];
        a[i] -= delta; a[j] += delta;
        if (sum > C) { if (a[i] > C) { a[i] = C; a[j] = sum - C; } }
        else { if (a[j] < 0) { a[j] = 0; a[i] = sum; } }
        if (sum > C) { if (a[j] > C) { a[j] = C; a[i] = sum - C; } }
        else { if (a[i] < 0) { a[i] = 0; a[j] = sum; } }
      }
      var dai = a[i] - oi, daj = a[j] - oj, rI = i * n, rJ = j * n, yI = y[i] * dai, yJ = y[j] * daj;
      for (t = 0; t < n; t++) G[t] += y[t] * (yI * K[rI + t] + yJ * K[rJ + t]);
    }
    // rho
    var ub = Infinity, lb = -Infinity, nf = 0, sf = 0;
    for (i = 0; i < n; i++) {
      var yG = y[i] * G[i];
      if (a[i] >= C) { if (y[i] === -1) ub = Math.min(ub, yG); else lb = Math.max(lb, yG); }
      else if (a[i] <= 0) { if (y[i] === 1) ub = Math.min(ub, yG); else lb = Math.max(lb, yG); }
      else { nf++; sf += yG; }
    }
    var rho = nf > 0 ? sf / nf : (ub + lb) / 2;
    var sv = [], coef = [];
    for (i = 0; i < n; i++) if (a[i] > 0) { sv.push(idx[i]); coef.push(a[i] * y[i]); }
    return { gamma: g, rho: rho, sv: sv, coef: Float64Array.from(coef), iter: iter, store: store };
  }
  function gammaOver(store, idx) {
    var d = store.d, X = store.X, m = idx.length * d, s = 0, i, k, o;
    if (!m) return 1;
    for (i = 0; i < idx.length; i++) { o = idx[i] * d; for (k = 0; k < d; k++) s += X[o + k]; }
    var mean = s / m, acc = 0;
    for (i = 0; i < idx.length; i++) { o = idx[i] * d; for (k = 0; k < d; k++) { var e = X[o + k] - mean; acc += e * e; } }
    var v = acc / m;
    return v > 0 ? 1 / (d * v) : 1;
  }
  // decision value for an arbitrary vector x
  function decision(model, x) {
    var st = model.store, d = st.d, X = st.X, g = model.gamma, f = -model.rho;
    var xx = 0, k; for (k = 0; k < d; k++) xx += x[k] * x[k];
    for (var s = 0; s < model.sv.length; s++) {
      var o = model.sv[s] * d, dot = 0;
      for (k = 0; k < d; k++) dot += X[o + k] * x[k];
      var dd = st.sq[model.sv[s]] + xx - 2 * dot; if (dd < 0) dd = 0;
      f += model.coef[s] * Math.exp(-g * dd);
    }
    return f;
  }
  function gradient(model, x) {
    var st = model.store, d = st.d, X = st.X, g = model.gamma, out = new Float64Array(d), k;
    var xx = 0; for (k = 0; k < d; k++) xx += x[k] * x[k];
    for (var s = 0; s < model.sv.length; s++) {
      var o = model.sv[s] * d, dot = 0;
      for (k = 0; k < d; k++) dot += X[o + k] * x[k];
      var dd = st.sq[model.sv[s]] + xx - 2 * dot; if (dd < 0) dd = 0;
      var w = model.coef[s] * Math.exp(-g * dd) * (-2 * g);
      for (k = 0; k < d; k++) out[k] += w * (x[k] - X[o + k]);
    }
    return out;
  }
  // Test set: precompute squared distances test-to-store lazily per store row.
  function TestSet(store, rows, labels) {
    this.store = store; this.m = labels.length; this.d = store.d;
    this.T = new Float64Array(this.m * this.d); this.y = Int8Array.from(labels);
    this.tsq = new Float64Array(this.m);
    for (var i = 0; i < this.m; i++) { var s = 0; for (var k = 0; k < this.d; k++) { var v = rows[i][k]; this.T[i * this.d + k] = v; s += v * v; } this.tsq[i] = s; }
    this.D = []; // D[storeRow] = Float64Array(m)
  }
  TestSet.prototype.dist = function (r) {
    if (this.D[r]) return this.D[r];
    var st = this.store, d = this.d, X = st.X, o = r * d, out = new Float64Array(this.m);
    for (var i = 0; i < this.m; i++) {
      var dot = 0, ti = i * d; for (var k = 0; k < d; k++) dot += X[o + k] * this.T[ti + k];
      var dd = st.sq[r] + this.tsq[i] - 2 * dot; out[i] = dd < 0 ? 0 : dd;
    }
    this.D[r] = out; return out;
  };
  TestSet.prototype.accuracy = function (model) {
    var f = new Float64Array(this.m), g = model.gamma, s, i;
    for (i = 0; i < this.m; i++) f[i] = -model.rho;
    for (s = 0; s < model.sv.length; s++) {
      var D = this.dist(model.sv[s]), c = model.coef[s];
      for (i = 0; i < this.m; i++) f[i] += c * Math.exp(-g * D[i]);
    }
    var ok = 0; for (i = 0; i < this.m; i++) if ((f[i] > 0 ? 1 : -1) === this.y[i]) ok++;
    return ok / this.m;
  };

  /* ------------------------------------------------------------ isolation forest */

  function cPath(n) {
    if (n <= 1) return 0;
    if (n === 2) return 1;
    return 2 * (Math.log(n - 1) + 0.5772156649015329) - 2 * (n - 1) / n;
  }
  // rows: array of Float64Array (or arrays). Returns forest.
  function fitForest(rows, seed, opts) {
    opts = opts || {};
    var r = rng(seed), nT = opts.trees || 100, n = rows.length, d = rows[0].length;
    var ms = Math.min(256, n), maxDepth = Math.ceil(Math.log2(Math.max(ms, 2)));
    var trees = [];
    var all = []; for (var i = 0; i < n; i++) all.push(i);
    for (var t = 0; t < nT; t++) {
      var sub = shuffle(all.slice(), r).slice(0, ms);
      trees.push(buildNode(rows, sub, 0, maxDepth, d, r));
    }
    return { trees: trees, ms: ms, cms: cPath(ms), d: d };
  }
  function buildNode(rows, ids, depth, maxDepth, d, r) {
    var n = ids.length;
    if (depth >= maxDepth || n < 2) return { n: n };
    // draw features until a non-constant one is found (scikit-learn's random splitter)
    var feats = [], f, k;
    for (k = 0; k < d; k++) feats.push(k);
    var left = d;
    while (left > 0) {
      var pick = r.int(left); f = feats[pick]; feats[pick] = feats[left - 1]; feats[left - 1] = f; left--;
      var lo = Infinity, hi = -Infinity;
      for (k = 0; k < n; k++) { var v = rows[ids[k]][f]; if (v < lo) lo = v; if (v > hi) hi = v; }
      if (hi > lo) {
        var thr = r.uniform(lo, hi); if (thr >= hi) thr = lo;
        var L = [], R = [];
        for (k = 0; k < n; k++) (rows[ids[k]][f] <= thr ? L : R).push(ids[k]);
        return { f: f, t: thr, l: buildNode(rows, L, depth + 1, maxDepth, d, r), r: buildNode(rows, R, depth + 1, maxDepth, d, r) };
      }
    }
    return { n: n }; // every feature constant
  }
  function pathLen(node, x) {
    var depth = 0;
    while (node.f != null) { node = x[node.f] <= node.t ? node.l : node.r; depth++; }
    return depth + cPath(node.n);
  }
  function score(forest, x) {
    var s = 0; for (var t = 0; t < forest.trees.length; t++) s += pathLen(forest.trees[t], x);
    return -Math.pow(2, -s / (forest.trees.length * forest.cms));
  }
  // scikit-learn contamination="auto": inlier when score_samples(x) - (-0.5) >= 0
  function accepts(forest, x) { return score(forest, x) >= -0.5; }

  /* ------------------------------------------------------------ the attack (Algorithm 1) */

  function advPoint(model, x0, label, opts) {
    opts = opts || {};
    var t = opts.t != null ? opts.t : 1e-3, eps = opts.eps != null ? opts.eps : 1e-5, cap = opts.cap != null ? opts.cap : 10;
    var x = Float64Array.from(x0), d = x.length, steps = 0;
    function loss(z) { return Math.max(0, 1 - label * decision(model, z)); }
    var l0 = loss(x);
    for (var it = 0; it < cap; it++) {
      var gf = gradient(model, x), nrm = 0, k;
      for (k = 0; k < d; k++) { gf[k] = -label * gf[k]; nrm += gf[k] * gf[k]; }
      nrm = Math.sqrt(nrm); if (!(nrm > 0)) break;
      for (k = 0; k < d; k++) x[k] += gf[k] / nrm * t;
      steps++;
      var l1 = loss(x);
      if (l1 - eps < l0) break;
      l0 = l1;
    }
    var moved = 0; for (var q = 0; q < d; q++) moved += (x[q] - x0[q]) * (x[q] - x0[q]);
    return { x: x, steps: steps, moved: Math.sqrt(moved) };
  }

  /* ------------------------------------------------------------ the experiment (Algorithm 2) */

  // train: {rows, labels}, test: {rows, labels}; labels are +1 / -1.
  // Returns an object with step() that runs one attack and returns a record.
  function Experiment(train, test, opts) {
    opts = opts || {};
    var NA = opts.attacks || 100, seed = opts.seed || 1, r = rng(seed * 7919 + 13);
    var d = train.rows[0].length, n0 = train.rows.length;
    var store = new Store(d, n0 + NA);
    var base = [];
    for (var i = 0; i < n0; i++) base.push(store.add(train.rows[i], train.labels[i]));
    var pos = [], neg = [];
    for (i = 0; i < n0; i++) (train.labels[i] === 1 ? pos : neg).push(train.rows[i]);
    this.ADp = fitForest(pos, seed * 2 + 1, opts.forest);
    this.ADn = fitForest(neg, seed * 2 + 2, opts.forest);
    this.store = store; this.test = new TestSet(store, test.rows, test.labels);
    this.idxU = base.slice(); this.idxG = base.slice();
    this.mU = trainSVC(store, this.idxU); this.mG = this.mU;
    var a0 = this.test.accuracy(this.mU);
    this.accU = [a0]; this.accG = [a0]; this.allowed = 0; this.done = 0; this.NA = NA;
    this.r = r; this.train = train; this.n0 = n0; this.attackOpts = opts.attack || {};
    this.log = [];
  }
  Experiment.prototype.step = function () {
    if (this.done >= this.NA) return null;
    var j = this.r.int(this.n0), xi = this.train.rows[j], li = this.train.labels[j];
    var adv = advPoint(this.mU, xi, -li, this.attackOpts);
    var row = this.store.add(adv.x, -li);
    this.idxU.push(row);
    var det = li === -1 ? this.ADp : this.ADn;   // detector of the class the point claims
    var sc = score(det, adv.x), pass = sc >= -0.5;
    if (pass) { this.idxG.push(row); this.allowed++; }
    this.mU = trainSVC(this.store, this.idxU);
    if (pass || this.done === 0 || this.mG.store !== this.store) this.mG = trainSVC(this.store, this.idxG);
    var aU = this.test.accuracy(this.mU), aG = this.test.accuracy(this.mG);
    this.accU.push(aU); this.accG.push(aG); this.done++;
    var rec = { k: this.done, src: j, from: li, pass: pass, score: sc, steps: adv.steps, moved: adv.moved, accU: aU, accG: aG };
    this.log.push(rec);
    return rec;
  };
  Experiment.prototype.summary = function () {
    function mean(a) { var s = 0; for (var i = 0; i < a.length; i++) s += a[i]; return s / a.length; }
    return {
      clean: this.accU[0], avgU: mean(this.accU), avgG: mean(this.accG),
      lastU: this.accU[this.accU.length - 1], lastG: this.accG[this.accG.length - 1],
      defended: this.done ? 1 - this.allowed / this.done : 0, attacks: this.done
    };
  };

  // Stratified split that keeps the class mix of the full set (as the paper's
  // "maintain class distrib."); returns {train: [...indices], test: [...]}.
  function stratifiedSplit(labels, nTrain, nTest, seed) {
    var r = rng(seed), pos = [], neg = [], i;
    for (i = 0; i < labels.length; i++) (labels[i] === 1 ? pos : neg).push(i);
    shuffle(pos, r); shuffle(neg, r);
    var share = pos.length / labels.length;
    var pTr = Math.round(nTrain * share), pTe = Math.round(nTest * share);
    var train = pos.slice(0, pTr).concat(neg.slice(0, nTrain - pTr));
    var test = pos.slice(pTr, pTr + pTe).concat(neg.slice(nTrain - pTr, nTrain - pTr + nTest - pTe));
    return { train: shuffle(train, r), test: test };
  }

  root.Jangseung = {
    stratifiedSplit: stratifiedSplit,
    rng: rng, shuffle: shuffle, Store: Store, trainSVC: trainSVC, decision: decision, gradient: gradient,
    TestSet: TestSet, fitForest: fitForest, score: score, accepts: accepts, cPath: cPath,
    pathLen: pathLen, advPoint: advPoint, Experiment: Experiment, gammaOver: gammaOver
  };
})(typeof self !== "undefined" ? self : this);

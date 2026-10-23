/*
  The four classifiers of Robins et al. (JCP 2023), written for the browser:
  k-nearest neighbors, a decision tree, a random forest, and multinomial
  logistic regression, each following scikit-learn's defaults (the paper
  used scikit-learn 0.24.2 "with minimal configuration beyond the defaults").

    knn  KNeighborsClassifier(): k = 5, Euclidean distance, uniform votes;
         a tie between labels goes to the lowest label.
    tree DecisionTreeClassifier(): CART with Gini impurity, best split over
         every feature, thresholds halfway between neighboring values, grown
         until leaves are pure. Features are scanned in a fresh random order
         at every node, as scikit-learn does, so when two features give
         exactly the same gain the one scanned first wins; the page's random
         numbers differ from scikit-learn's, so the trees match in kind, not
         node for node.
    rf   RandomForestClassifier(): bootstrap samples, sqrt(features) candidates
         per split (more if every candidate is constant), trees grown until
         pure, and the forest averages the trees' class probabilities. The
         page's own random numbers, so a forest matches scikit-learn's in
         distribution, not tree by tree.
    lr   LogisticRegression(): multinomial softmax with an L2 penalty (C = 1,
         intercepts unpenalized), minimized with L-BFGS.

  Data: X is an array of Float32Array rows, y an array of labels 0..C-1.
  Loads as a page script (window.CfML) and inside a Web Worker.
*/
(function (root) {
  "use strict";

  function rng(seed) {
    var a = (seed >>> 0) || 1;
    var f = function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    f.int = function (n) { return Math.floor(f() * n); };
    return f;
  }
  function argmaxLowest(v) {
    var b = 0;
    for (var i = 1; i < v.length; i++) if (v[i] > v[b]) b = i;
    return b;
  }

  /* ------------------------------------------------------------ k-nearest neighbors */

  function knnPredict(trX, trY, teX, C, k, progress) {
    k = Math.min(k || 5, trX.length);
    var n = trX.length, p = trX[0].length, out = new Int32Array(teX.length);
    var ids = new Int32Array(k), vals = new Float64Array(k), counts = new Int32Array(C);
    for (var t = 0; t < teX.length; t++) {
      var x = teX[t], m = 0;
      for (var i = 0; i < n; i++) {
        var r = trX[i], s = 0;
        for (var j = 0; j < p; j++) { var d = x[j] - r[j]; s += d * d; }
        if (m < k) { var q = m++; while (q > 0 && vals[q - 1] > s) { vals[q] = vals[q - 1]; ids[q] = ids[q - 1]; q--; } vals[q] = s; ids[q] = i; }
        else if (s < vals[k - 1]) { q = k - 1; while (q > 0 && vals[q - 1] > s) { vals[q] = vals[q - 1]; ids[q] = ids[q - 1]; q--; } vals[q] = s; ids[q] = i; }
      }
      counts.fill(0);
      for (i = 0; i < k; i++) counts[trY[ids[i]]]++;
      out[t] = argmaxLowest(counts);
      if (progress) progress(t + 1, teX.length);
    }
    return out;
  }

  /* ------------------------------------------------------------ decision trees */

  // Grows one CART tree on the rows listed in idx (repeats allowed, as in a
  // bootstrap sample). maxFeatures: candidates per split (0 = all features).
  // Returns flat arrays: feature, threshold, left, right (-1 for a leaf), and
  // per-node class probabilities for leaves.
  function growTree(X, y, C, idx, maxFeatures, r) {
    var p = X[0].length, feat = [], thr = [], left = [], right = [], probs = [];
    var order = new Int32Array(p);
    for (var f = 0; f < p; f++) order[f] = f;
    var cl = new Float64Array(C), cr = new Float64Array(C), ctot = new Float64Array(C);

    function leaf(node, rows, lo, hi) {
      var pr = new Float64Array(C);
      for (var i = lo; i < hi; i++) pr[y[rows[i]]]++;
      for (var c = 0; c < C; c++) pr[c] /= (hi - lo);
      feat[node] = -1; thr[node] = 0; left[node] = -1; right[node] = -1; probs[node] = pr;
    }

    var rows = Int32Array.from(idx);
    // Explicit stack: [node, lo, hi]
    var stack = [[0, 0, rows.length]], nNodes = 1;
    while (stack.length) {
      var job = stack.pop(), node = job[0], lo = job[1], hi = job[2], n = hi - lo;
      ctot.fill(0);
      for (var i = lo; i < hi; i++) ctot[y[rows[i]]]++;
      var pure = 0;
      for (var c = 0; c < C; c++) if (ctot[c] > 0) pure++;
      if (pure <= 1 || n < 2) { leaf(node, rows, lo, hi); continue; }
      var sumTot = 0;
      for (c = 0; c < C; c++) sumTot += ctot[c] * ctot[c];

      // Candidate features: all of them, or a fresh random draw (Fisher-Yates
      // prefix) for a forest, extended past maxFeatures while every candidate
      // so far was constant on this node.
      var nCand = maxFeatures > 0 ? Math.min(maxFeatures, p) : p;
      if (maxFeatures > 0) for (f = 0; f < p; f++) order[f] = f;
      var bestGain = -Infinity, bestF = -1, bestT = 0, bestPos = -1, visited = 0, nonConst = 0;
      for (var fi = 0; fi < p; fi++) {
        if (visited >= nCand && nonConst > 0) break;
        var ff;
        if (maxFeatures > 0) { var j = fi + r.int(p - fi); ff = order[j]; order[j] = order[fi]; order[fi] = ff; }
        else ff = fi;
        visited++;
        // Sort the node's rows by this feature.
        var sub = Array.prototype.slice.call(rows, lo, hi);
        sub.sort(function (a, b) { return X[a][ff] - X[b][ff]; });
        if (X[sub[n - 1]][ff] <= X[sub[0]][ff] + 1e-7) continue;   // constant here
        nonConst++;
        cl.fill(0);
        for (c = 0; c < C; c++) cr[c] = ctot[c];
        var sl = 0, sr = sumTot;
        for (i = 0; i < n - 1; i++) {
          var lab = y[sub[i]];
          sl += 2 * cl[lab] + 1; cl[lab]++;
          sr -= 2 * cr[lab] - 1; cr[lab]--;
          var a = X[sub[i]][ff], b = X[sub[i + 1]][ff];
          if (b <= a + 1e-7) continue;
          var nl = i + 1, nr = n - nl;
          var gain = sl / nl + sr / nr;
          if (gain > bestGain) {
            bestGain = gain; bestF = ff; bestPos = i;
            var t = a / 2 + b / 2;
            if (t === b || t === Infinity) t = a;
            bestT = t;
          }
        }
      }
      if (bestF < 0) { leaf(node, rows, lo, hi); continue; }
      // Partition rows[lo..hi) by the chosen split.
      var L = [], R = [];
      for (i = lo; i < hi; i++) (X[rows[i]][bestF] <= bestT ? L : R).push(rows[i]);
      for (i = 0; i < L.length; i++) rows[lo + i] = L[i];
      for (i = 0; i < R.length; i++) rows[lo + L.length + i] = R[i];
      var ln = nNodes++, rn = nNodes++;
      feat[node] = bestF; thr[node] = bestT; left[node] = ln; right[node] = rn; probs[node] = null;
      stack.push([rn, lo + L.length, hi]);
      stack.push([ln, lo, lo + L.length]);
    }
    return { feat: feat, thr: thr, left: left, right: right, probs: probs, nodes: nNodes };
  }
  function treeProbs(tree, x) {
    var node = 0;
    while (tree.feat[node] >= 0) node = x[tree.feat[node]] <= tree.thr[node] ? tree.left[node] : tree.right[node];
    return tree.probs[node];
  }
  // scikit-learn visits the features at each node in a fresh random order
  // even when it considers all of them, so a tie in gain goes to a random
  // feature; the page does the same with its own seeded generator.
  function treeFit(trX, trY, C, seed) {
    var idx = [];
    for (var i = 0; i < trX.length; i++) idx.push(i);
    return growTree(trX, trY, C, idx, trX[0].length, rng(seed || 1));
  }
  function treePredict(tree, teX) {
    return Int32Array.from(teX.map(function (x) { return argmaxLowest(treeProbs(tree, x)); }));
  }

  function forestFit(trX, trY, C, nTrees, seed, progress) {
    var r = rng(seed || 1), n = trX.length, p = trX[0].length, mf = Math.max(1, Math.floor(Math.sqrt(p)));
    var trees = [];
    for (var t = 0; t < nTrees; t++) {
      var idx = new Int32Array(n);
      for (var i = 0; i < n; i++) idx[i] = r.int(n);
      trees.push(growTree(trX, trY, C, idx, mf, r));
      if (progress) progress(t + 1, nTrees);
    }
    return { trees: trees, C: C };
  }
  function forestPredict(forest, teX) {
    var C = forest.C, acc = new Float64Array(C);
    return Int32Array.from(teX.map(function (x) {
      acc.fill(0);
      forest.trees.forEach(function (tr) { var pr = treeProbs(tr, x); for (var c = 0; c < C; c++) acc[c] += pr[c]; });
      return argmaxLowest(acc);
    }));
  }

  /* ------------------------------------------------------------ logistic regression */

  // Multinomial logistic regression. Objective (scikit-learn's, up to a
  // constant factor): sum_i -log softmax(W x_i + b)[y_i] + ||W||^2 / (2C).
  // Parameters: W (K x p) then b (K), in one Float64Array.
  function lrObjective(theta, X, y, K, Cpen, grad) {
    var n = X.length, p = X[0].length, P1 = p + 1, f = 0, z = new Float64Array(K);
    grad.fill(0);
    for (var i = 0; i < n; i++) {
      var x = X[i], mx = -Infinity;
      for (var k = 0; k < K; k++) {
        var s = theta[K * p + k], off = k * p;
        for (var j = 0; j < p; j++) s += theta[off + j] * x[j];
        z[k] = s; if (s > mx) mx = s;
      }
      var se = 0;
      for (k = 0; k < K; k++) { z[k] = Math.exp(z[k] - mx); se += z[k]; }
      f += Math.log(se) + mx - (Math.log(z[y[i]]) + mx);
      for (k = 0; k < K; k++) {
        var g = z[k] / se - (k === y[i] ? 1 : 0);
        if (g === 0) continue;
        off = k * p;
        for (j = 0; j < p; j++) grad[off + j] += g * x[j];
        grad[K * p + k] += g;
      }
    }
    for (var q = 0; q < K * p; q++) { f += theta[q] * theta[q] / (2 * Cpen); grad[q] += theta[q] / Cpen; }
    return f;
  }

  // L-BFGS (memory 10) with a backtracking Armijo line search.
  // Stops when the largest gradient entry falls below tol (scikit-learn's
  // lbfgs uses pgtol = 1e-4 on its scaled objective) or after maxIter steps.
  function lrFit(trX, trY, K, opts, progress) {
    opts = opts || {};
    var Cpen = opts.C || 1, maxIter = opts.maxIter || 300, tol = opts.tol || 1e-4, m = 10;
    var p = trX[0].length, D = K * p + K, n = trX.length;
    var theta = new Float64Array(D), g = new Float64Array(D), gNew = new Float64Array(D), tNew = new Float64Array(D);
    var f = lrObjective(theta, trX, trY, K, Cpen, g);
    var S = [], Y = [], rho = [], dir = new Float64Array(D), alpha = new Float64Array(m), it = 0;
    function maxAbs(v) { var a = 0; for (var i = 0; i < v.length; i++) { var t = Math.abs(v[i]); if (t > a) a = t; } return a; }
    for (it = 0; it < maxIter; it++) {
      if (maxAbs(g) / n < tol) break;
      // Two-loop recursion: dir = -H g
      for (var i = 0; i < D; i++) dir[i] = -g[i];
      for (var h = S.length - 1; h >= 0; h--) {
        var a = 0; for (i = 0; i < D; i++) a += S[h][i] * dir[i];
        a *= rho[h]; alpha[h] = a;
        for (i = 0; i < D; i++) dir[i] -= a * Y[h][i];
      }
      if (S.length) {
        var last = S.length - 1, sy = 1 / rho[last], yy = 0;
        for (i = 0; i < D; i++) yy += Y[last][i] * Y[last][i];
        var gamma = sy / yy;
        for (i = 0; i < D; i++) dir[i] *= gamma;
      } else {
        var gn = maxAbs(g); for (i = 0; i < D; i++) dir[i] /= Math.max(gn, 1);
      }
      for (h = 0; h < S.length; h++) {
        var b = 0; for (i = 0; i < D; i++) b += Y[h][i] * dir[i];
        b *= rho[h];
        for (i = 0; i < D; i++) dir[i] += S[h][i] * (alpha[h] - b);
      }
      var gd = 0; for (i = 0; i < D; i++) gd += g[i] * dir[i];
      if (gd >= 0) { for (i = 0; i < D; i++) dir[i] = -g[i] / Math.max(maxAbs(g), 1); gd = 0; for (i = 0; i < D; i++) gd += g[i] * dir[i]; S = []; Y = []; rho = []; }
      var step = 1, fNew;
      for (var ls = 0; ls < 40; ls++) {
        for (i = 0; i < D; i++) tNew[i] = theta[i] + step * dir[i];
        fNew = lrObjective(tNew, trX, trY, K, Cpen, gNew);
        if (fNew <= f + 1e-4 * step * gd) break;
        step *= 0.5;
      }
      var s = new Float64Array(D), yv = new Float64Array(D), syv = 0;
      for (i = 0; i < D; i++) { s[i] = tNew[i] - theta[i]; yv[i] = gNew[i] - g[i]; syv += s[i] * yv[i]; }
      theta.set(tNew); g.set(gNew); var fOld = f; f = fNew;
      if (syv > 1e-10) { S.push(s); Y.push(yv); rho.push(1 / syv); if (S.length > m) { S.shift(); Y.shift(); rho.shift(); } }
      if (progress) progress(it + 1, maxIter, f);
      if (Math.abs(fOld - f) <= 1e-12 * Math.max(Math.abs(f), 1)) { it++; break; }
    }
    return { theta: theta, K: K, p: p, iterations: it, objective: f, converged: it < maxIter };
  }
  function lrPredict(model, teX) {
    var K = model.K, p = model.p, th = model.theta;
    return Int32Array.from(teX.map(function (x) {
      var best = -1, bv = -Infinity;
      for (var k = 0; k < K; k++) {
        var s = th[K * p + k], off = k * p;
        for (var j = 0; j < p; j++) s += th[off + j] * x[j];
        if (s > bv) { bv = s; best = k; }
      }
      return best;
    }));
  }

  /* ------------------------------------------------------------ helpers */

  function accuracy(pred, truth) {
    var c = 0;
    for (var i = 0; i < pred.length; i++) if (pred[i] === truth[i]) c++;
    return { correct: c, n: pred.length, acc: c / pred.length };
  }
  // Exact upper tail of a binomial: P(X >= k) for X ~ Bin(n, p), in logs.
  function binomTail(k, n, p) {
    function lgamma(z) {
      var g = 7, c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313,
        -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
      if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - lgamma(1 - z);
      z -= 1; var x = c[0];
      for (var i = 1; i < g + 2; i++) x += c[i] / (z + i);
      var t = z + g + 0.5;
      return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
    }
    var lnC = function (i) { return lgamma(n + 1) - lgamma(i + 1) - lgamma(n - i + 1); };
    var terms = [], mx = -Infinity;
    for (var i = k; i <= n; i++) { var v = lnC(i) + i * Math.log(p) + (n - i) * Math.log(1 - p); terms.push(v); if (v > mx) mx = v; }
    var s = 0; terms.forEach(function (v) { s += Math.exp(v - mx); });
    var ln = mx + Math.log(s);
    return { log10: ln / Math.LN10, p: Math.exp(ln) };
  }

  var api = {
    knnPredict: knnPredict, growTree: growTree, treeFit: treeFit, treePredict: treePredict, treeProbs: treeProbs,
    forestFit: forestFit, forestPredict: forestPredict, lrObjective: lrObjective, lrFit: lrFit, lrPredict: lrPredict,
    accuracy: accuracy, binomTail: binomTail, argmaxLowest: argmaxLowest
  };
  root.CfML = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof self !== "undefined" ? self : this);

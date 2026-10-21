/* DP-GCN engine for thedracolab.com/papers/gcn-private-attributes/
 *
 * A browser rebuild of the method in Hu, Cheng, Vap, and Borowczak,
 * "Learning Privacy-Preserving Graph Convolutional Network with Partially
 * Observed Sensitive Attributes" (ACM WWW 2022, doi:10.1145/3485447.3511975).
 * The authors' repository named in the paper is no longer public, so this is
 * an independent implementation from the paper's equations (1)-(10),
 * Algorithm 1, and Table 4. Every gradient here is checked against PyTorch
 * autograd (see the pull request for the verification script and results).
 *
 * Pieces:
 *   - a two-layer GCN, f = softmax(Â relu(Â X W0 + b0) W1 + b1), in the style
 *     of Kipf's pygcn (uniform init of ±1/sqrt(out), dropout on the hidden
 *     layer, NLL loss), trained with Adam and L2 weight decay;
 *   - the attribute-inference adversary: a GCN trained on the users who
 *     reveal the sensitive attribute and scored on those who do not;
 *   - DP-GCN's alternating updates of W1 (sensitive subspace), W2
 *     (non-sensitive subspace), and θ (the GCN), Algorithm 1 lines 3-8.
 *
 * Loads as a page script or inside a Web Worker.
 */
(function (root) {
  "use strict";

  // ---------- random numbers ----------
  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function gauss(rng) {
    var u = 0, v = 0;
    while (u === 0) u = rng();
    v = rng();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }
  function shuffle(arr, rng) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(rng() * (i + 1));
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }

  // ---------- data ----------
  // data: { n, names:[...], x:[[...]], s:[0/1], y:[0/1], edges:[[i,j],...] }
  // Features are min-max scaled to [-1, 1] per column (nifty's feature_norm).
  function prepare(data) {
    var n = data.n, d = data.names.length;
    var X = new Float64Array(n * d);
    for (var c = 0; c < d; c++) {
      var lo = Infinity, hi = -Infinity, i;
      for (i = 0; i < n; i++) { var v = data.x[i][c]; if (v < lo) lo = v; if (v > hi) hi = v; }
      var span = hi - lo || 1;
      for (i = 0; i < n; i++) X[i * d + c] = 2 * (data.x[i][c] - lo) / span - 1;
    }
    return { n: n, d: d, names: data.names, X: X, s: Int8Array.from(data.s), y: Int8Array.from(data.y),
      A: normAdj(n, data.edges), edges: data.edges };
  }

  // Â = D^-1/2 (A + I) D^-1/2, symmetric, as CSR.
  function normAdj(n, edges) {
    var sets = [];
    for (var i = 0; i < n; i++) sets.push(new Set([i]));
    edges.forEach(function (e) { if (e[0] !== e[1]) { sets[e[0]].add(e[1]); sets[e[1]].add(e[0]); } });
    var deg = new Float64Array(n), nnz = 0;
    for (i = 0; i < n; i++) { deg[i] = sets[i].size; nnz += sets[i].size; }
    var ptr = new Int32Array(n + 1), col = new Int32Array(nnz), val = new Float64Array(nnz), k = 0;
    for (i = 0; i < n; i++) {
      ptr[i] = k;
      var nb = Array.from(sets[i]).sort(function (a, b) { return a - b; });
      for (var t = 0; t < nb.length; t++) { col[k] = nb[t]; val[k] = 1 / Math.sqrt(deg[i] * deg[nb[t]]); k++; }
    }
    ptr[n] = k;
    return { n: n, ptr: ptr, col: col, val: val, deg: deg };
  }

  // 50 / 30 / 20 split (Section 5.1.2), then 30 percent of the training users
  // reveal the sensitive attribute (seed2). Returns index arrays.
  function split(n, seed1, seed2, known) {
    var idx = shuffle(range(n), mulberry32(seed1));
    var a = Math.floor(0.5 * n), b = Math.floor(0.8 * n);
    var train = idx.slice(0, a), val = idx.slice(a, b), test = idx.slice(b);
    var tr = shuffle(train.slice(), mulberry32(seed2));
    var kk = Math.round((known == null ? 0.3 : known) * train.length);
    return { train: train, val: val, test: test, known: tr.slice(0, kk), hidden: tr.slice(kk) };
  }
  function range(n) { var a = new Array(n); for (var i = 0; i < n; i++) a[i] = i; return a; }

  // ---------- dense helpers (row-major) ----------
  function matmul(A, B, n, k, m) { // (n×k)(k×m)
    var C = new Float64Array(n * m);
    for (var i = 0; i < n; i++) for (var t = 0; t < k; t++) {
      var a = A[i * k + t]; if (a === 0) continue;
      for (var j = 0; j < m; j++) C[i * m + j] += a * B[t * m + j];
    }
    return C;
  }
  function matmulTN(A, B, n, k, m) { // Aᵀ B with A (n×k), B (n×m) -> k×m
    var C = new Float64Array(k * m);
    for (var i = 0; i < n; i++) for (var t = 0; t < k; t++) {
      var a = A[i * k + t]; if (a === 0) continue;
      for (var j = 0; j < m; j++) C[t * m + j] += a * B[i * m + j];
    }
    return C;
  }
  function matmulNT(A, B, n, k, m) { // A Bᵀ with A (n×k), B (m×k) -> n×m
    var C = new Float64Array(n * m);
    for (var i = 0; i < n; i++) for (var j = 0; j < m; j++) {
      var s = 0; for (var t = 0; t < k; t++) s += A[i * k + t] * B[j * k + t];
      C[i * m + j] = s;
    }
    return C;
  }
  function spmm(Adj, M, m) { // Â M, M is n×m (Â symmetric so also Âᵀ M)
    var n = Adj.n, C = new Float64Array(n * m);
    for (var i = 0; i < n; i++) for (var p = Adj.ptr[i]; p < Adj.ptr[i + 1]; p++) {
      var w = Adj.val[p], r = Adj.col[p] * m;
      for (var j = 0; j < m; j++) C[i * m + j] += w * M[r + j];
    }
    return C;
  }
  function frob2(M) { var s = 0; for (var i = 0; i < M.length; i++) s += M[i] * M[i]; return s; }

  // ---------- Adam (PyTorch semantics, weight decay added to the gradient) ----------
  function Adam(params, lr, wd) {
    this.p = params; this.lr = lr; this.wd = wd || 0; this.t = 0;
    this.m = params.map(function (a) { return new Float64Array(a.length); });
    this.v = params.map(function (a) { return new Float64Array(a.length); });
  }
  Adam.prototype.step = function (grads) {
    var b1 = 0.9, b2 = 0.999, eps = 1e-8;
    this.t++;
    var bc1 = 1 - Math.pow(b1, this.t), bc2 = 1 - Math.pow(b2, this.t);
    for (var q = 0; q < this.p.length; q++) {
      var P = this.p[q], G = grads[q], M = this.m[q], V = this.v[q];
      for (var i = 0; i < P.length; i++) {
        var g = G[i] + this.wd * P[i];
        M[i] = b1 * M[i] + (1 - b1) * g;
        V[i] = b2 * V[i] + (1 - b2) * g * g;
        P[i] -= this.lr * (M[i] / bc1) / (Math.sqrt(V[i] / bc2) + eps);
      }
    }
  };

  // ---------- two-layer GCN ----------
  function GCN(din, hid, ncls, rng) {
    this.din = din; this.hid = hid; this.nc = ncls;
    var s0 = 1 / Math.sqrt(hid), s1 = 1 / Math.sqrt(ncls);
    this.W0 = uni(din * hid, s0, rng); this.b0 = uni(hid, s0, rng);
    this.W1 = uni(hid * ncls, s1, rng); this.b1 = uni(ncls, s1, rng);
  }
  function uni(len, s, rng) { var a = new Float64Array(len); for (var i = 0; i < len; i++) a[i] = (2 * rng() - 1) * s; return a; }
  GCN.prototype.params = function () { return [this.W0, this.b0, this.W1, this.b1]; };
  GCN.prototype.clone = function () {
    var g = Object.create(GCN.prototype);
    g.din = this.din; g.hid = this.hid; g.nc = this.nc;
    g.W0 = this.W0.slice(); g.b0 = this.b0.slice(); g.W1 = this.W1.slice(); g.b1 = this.b1.slice();
    return g;
  };
  // mask: dropout keep-mask scaled by 1/(1-p) on the hidden layer, or null.
  GCN.prototype.forward = function (Adj, Xin, mask) {
    var n = Adj.n, h = this.hid, c = this.nc;
    var AX = spmm(Adj, Xin, this.din);                 // n×din
    var Z1 = matmul(AX, this.W0, n, this.din, h);       // n×h
    for (var i = 0; i < n; i++) for (var j = 0; j < h; j++) Z1[i * h + j] += this.b0[j];
    var H = new Float64Array(n * h);
    for (i = 0; i < H.length; i++) { var r = Z1[i] > 0 ? Z1[i] : 0; H[i] = mask ? r * mask[i] : r; }
    var AH = spmm(Adj, H, h);
    var Z2 = matmul(AH, this.W1, n, h, c);
    var LP = new Float64Array(n * c);                    // log-softmax
    for (i = 0; i < n; i++) {
      var mx = -Infinity, j2;
      for (j2 = 0; j2 < c; j2++) { Z2[i * c + j2] += this.b1[j2]; if (Z2[i * c + j2] > mx) mx = Z2[i * c + j2]; }
      var se = 0; for (j2 = 0; j2 < c; j2++) se += Math.exp(Z2[i * c + j2] - mx);
      var lse = mx + Math.log(se);
      for (j2 = 0; j2 < c; j2++) LP[i * c + j2] = Z2[i * c + j2] - lse;
    }
    return { AX: AX, Z1: Z1, H: H, AH: AH, LP: LP, mask: mask };
  };
  // Mean NLL over idx; returns loss, parameter grads, and optionally dL/dXin.
  GCN.prototype.backward = function (Adj, F, idx, labels, wantInput) {
    var n = Adj.n, h = this.hid, c = this.nc, m = idx.length, loss = 0;
    var dZ2 = new Float64Array(n * c);
    for (var q = 0; q < m; q++) {
      var i = idx[q], yi = labels[i];
      loss -= F.LP[i * c + yi];
      for (var j = 0; j < c; j++) dZ2[i * c + j] = (Math.exp(F.LP[i * c + j]) - (j === yi ? 1 : 0)) / m;
    }
    loss /= m;
    var dW1 = matmulTN(F.AH, dZ2, n, h, c);
    var db1 = new Float64Array(c);
    for (i = 0; i < n; i++) for (j = 0; j < c; j++) db1[j] += dZ2[i * c + j];
    var dAH = matmulNT(dZ2, this.W1, n, c, h);
    var dH = spmm(Adj, dAH, h);
    var dZ1 = new Float64Array(n * h);
    for (i = 0; i < dZ1.length; i++) dZ1[i] = F.Z1[i] > 0 ? dH[i] * (F.mask ? F.mask[i] : 1) : 0;
    var dW0 = matmulTN(F.AX, dZ1, n, this.din, h);
    var db0 = new Float64Array(h);
    for (i = 0; i < n; i++) for (j = 0; j < h; j++) db0[j] += dZ1[i * h + j];
    var out = { loss: loss, grads: [dW0, db0, dW1, db1] };
    if (wantInput) {
      var dAX = matmulNT(dZ1, this.W0, n, h, this.din);
      out.dX = spmm(Adj, dAX, this.din);
    }
    return out;
  };
  GCN.prototype.lossOn = function (F, idx, labels) {
    var c = this.nc, s = 0;
    for (var q = 0; q < idx.length; q++) s -= F.LP[idx[q] * c + labels[idx[q]]];
    return s / idx.length;
  };
  GCN.prototype.accOn = function (F, idx, labels) {
    var c = this.nc, ok = 0;
    for (var q = 0; q < idx.length; q++) {
      var i = idx[q], best = 0;
      for (var j = 1; j < c; j++) if (F.LP[i * c + j] > F.LP[i * c + best]) best = j;
      if (best === labels[i]) ok++;
    }
    return ok / idx.length;
  };
  GCN.prototype.predict = function (F) {
    var c = this.nc, n = F.LP.length / c, out = new Int8Array(n);
    for (var i = 0; i < n; i++) out[i] = F.LP[i * c + 1] > F.LP[i * c] ? 1 : 0;
    return out;
  };
  function dropMask(len, p, rng) {
    if (!p) return null;
    var m = new Float64Array(len), k = 1 / (1 - p);
    for (var i = 0; i < len; i++) m[i] = rng() >= p ? k : 0;
    return m;
  }

  var DEFAULTS = { hidden: 32, dropout: 0.5, lr: 0.001, wd: 1e-5, epochs: 300, inferEpochs: 200,
    lrW: 0.001, alpha: 1, beta: 5, gamma: 1, known: 0.3, n1: 1, n2: 1, n3: 1 };
  function opts(o) { var r = {}, k; for (k in DEFAULTS) r[k] = DEFAULTS[k]; for (k in (o || {})) if (o[k] != null) r[k] = o[k]; return r; }

  // Train a GCN on (Xin, labels) over trainIdx. If valIdx is given, keep the
  // weights with the lowest validation loss (Section 5.1.4); otherwise keep the
  // last epoch. Generator: yields progress every epoch.
  function* trainGCN(Adj, Xin, din, labels, trainIdx, valIdx, o, seed, onEpoch) {
    var rng = mulberry32(seed);
    var g = new GCN(din, o.hidden, 2, rng);
    var opt = new Adam(g.params(), o.lr, o.wd);
    var best = null, bestLoss = Infinity, E = o.epochsOverride || o.epochs;
    for (var e = 0; e < E; e++) {
      var F = g.forward(Adj, Xin, dropMask(Adj.n * o.hidden, o.dropout, rng));
      var B = g.backward(Adj, F, trainIdx, labels, false);
      opt.step(B.grads);
      if (valIdx) {
        var Fe = g.forward(Adj, Xin, null), vl = g.lossOn(Fe, valIdx, labels);
        if (vl < bestLoss) { bestLoss = vl; best = g.clone(); }
      }
      if (onEpoch) onEpoch(e, B.loss);
      yield e;
    }
    return best || g;
  }
  function runGen(gen) { var r; do { r = gen.next(); } while (!r.done); return r.value; }

  // The adversary of Section 5.3: train on the users who revealed the
  // sensitive attribute, predict it for the private users.
  function* infer(D, Xin, din, sp, o, seed) {
    var g = yield* trainGCN(D.A, Xin, din, D.s, sp.known, null, Object.assign({}, o, { epochsOverride: o.inferEpochs }), seed);
    var F = g.forward(D.A, Xin, null);
    return { acc: g.accOn(F, sp.hidden, D.s), pred: g.predict(F) };
  }

  // Baseline GCN (Sections 5.2-5.3): infer the hidden sensitive attribute from
  // the original features, then classify with features plus the revealed or
  // inferred sensitive attribute.
  function* baseline(D, sp, o, seed) {
    o = opts(o);
    var inf = yield* infer(D, D.X, D.d, sp, o, seed + 1);
    var n = D.n, d = D.d, X2 = new Float64Array(n * (d + 1));
    var known = new Uint8Array(n); sp.known.forEach(function (i) { known[i] = 1; });
    for (var i = 0; i < n; i++) {
      for (var c = 0; c < d; c++) X2[i * (d + 1) + c] = D.X[i * d + c];
      var sv = known[i] ? D.s[i] : inf.pred[i];
      X2[i * (d + 1) + d] = 2 * sv - 1;
    }
    var g = yield* trainGCN(D.A, X2, d + 1, D.y, sp.train, sp.val, o, seed + 2);
    var F = g.forward(D.A, X2, null);
    return { privacy: inf.acc, accuracy: g.accOn(F, sp.test, D.y) };
  }

  // DP-GCN, Algorithm 1 with n1 = n2 = n3 = 1 per outer epoch by default.
  // W1, W2 are d×d with N(0,1) entries; S_k is the revealed attribute
  // repeated across d columns so ||X_k W1 − S_k||_F² is defined for d×d W1.
  function* dpgcn(D, sp, o, seed, onEpoch) {
    o = opts(o);
    var n = D.n, d = D.d, rng = mulberry32(seed);
    var W1 = new Float64Array(d * d), W2 = new Float64Array(d * d), i;
    for (i = 0; i < d * d; i++) W1[i] = gauss(rng);
    for (i = 0; i < d * d; i++) W2[i] = gauss(rng);
    var k = sp.known.length, Xk = new Float64Array(k * d), Sk = new Float64Array(k * d);
    sp.known.forEach(function (r, q) { for (var c = 0; c < d; c++) { Xk[q * d + c] = D.X[r * d + c]; Sk[q * d + c] = D.s[r]; } });
    var g = new GCN(d, o.hidden, 2, rng);
    var optT = new Adam(g.params(), o.lr, o.wd), opt1 = new Adam([W1], o.lrW, 0), opt2 = new Adam([W2], o.lrW, 0);
    var best = null, bestLoss = Infinity, hist = [];
    for (var e = 0; e < o.epochs; e++) {
      var t, M, R, G1, G2, Xt, F, B;
      for (t = 0; t < o.n1; t++) {           // line 4
        R = matmul(Xk, W1, k, d, d); for (i = 0; i < R.length; i++) R[i] -= Sk[i];
        G1 = matmulTN(Xk, R, k, d, d); for (i = 0; i < G1.length; i++) G1[i] *= 2 * o.alpha;
        M = matmulTN(W1, W2, d, d, d);       // W1ᵀW2
        var P = matmulNT(W2, M, d, d, d);    // W2 (W1ᵀW2)ᵀ
        for (i = 0; i < G1.length; i++) G1[i] += 2 * o.beta * P[i];
        opt1.step([G1]);
      }
      for (t = 0; t < o.n2; t++) {           // line 6
        M = matmulTN(W1, W2, d, d, d);
        G2 = matmul(W1, M, d, d, d); for (i = 0; i < G2.length; i++) G2[i] *= 2 * o.beta;
        if (o.gamma) {
          Xt = matmul(D.X, W2, n, d, d);
          F = g.forward(D.A, Xt, dropMask(n * o.hidden, o.dropout, rng));
          B = g.backward(D.A, F, sp.train, D.y, true);
          var GX = matmulTN(D.X, B.dX, n, d, d);
          for (i = 0; i < G2.length; i++) G2[i] += o.gamma * GX[i];
        }
        opt2.step([G2]);
      }
      Xt = matmul(D.X, W2, n, d, d);
      var lossT = 0;
      for (t = 0; t < o.n3; t++) {           // line 8
        F = g.forward(D.A, Xt, dropMask(n * o.hidden, o.dropout, rng));
        B = g.backward(D.A, F, sp.train, D.y, false);
        optT.step(B.grads); lossT = B.loss;
      }
      var Fe = g.forward(D.A, Xt, null), vl = g.lossOn(Fe, sp.val, D.y);
      if (vl < bestLoss) { bestLoss = vl; best = { g: g.clone(), W2: W2.slice() }; }
      var h = { epoch: e, loss: lossT, orth: Math.sqrt(frob2(matmulTN(W1, W2, d, d, d))) /
        (Math.sqrt(frob2(W1)) * Math.sqrt(frob2(W2))) };
      hist.push(h);
      if (onEpoch) onEpoch(h);
      yield e;
    }
    var XtB = matmul(D.X, best.W2, n, d, d);
    var Fb = best.g.forward(D.A, XtB, null);
    var accuracy = best.g.accOn(Fb, sp.test, D.y);
    var inf = yield* infer(D, XtB, d, sp, o, seed + 7);
    return { privacy: inf.acc, accuracy: accuracy, W1: W1, W2: best.W2, Xt: XtB, hist: hist };
  }

  // The page's own check (not in the paper): the end point DP-GCN's
  // orthogonality term aims for, reached exactly. W1 = w wᵀ / |w|² and
  // W2 = I − W1 satisfy W1ᵀW2 = W1W2ᵀ = 0, so X W2 keeps every feature
  // direction except w.
  function* projected(D, sp, o, seed) {
    o = opts(o);
    var n = D.n, d = D.d, w = removalDirection(D, sp, o.dir || "ls"), ww = 0, a, b;
    for (a = 0; a < d; a++) ww += w[a] * w[a];
    var W2 = new Float64Array(d * d);
    for (a = 0; a < d; a++) for (b = 0; b < d; b++) W2[a * d + b] = (a === b ? 1 : 0) - w[a] * w[b] / ww;
    var Xt = matmul(D.X, W2, n, d, d);
    var g = yield* trainGCN(D.A, Xt, d, D.y, sp.train, sp.val, o, seed + 2);
    var F = g.forward(D.A, Xt, null);
    var inf = yield* infer(D, Xt, d, sp, o, seed + 1);
    return { privacy: inf.acc, accuracy: g.accOn(F, sp.test, D.y), w: w, W2: W2, Xt: Xt,
      linearBefore: linearProbe(D, D.X, sp), linearAfter: linearProbe(D, Xt, sp) };
  }
  // "ls": the least-squares direction of Eq. 3 (one column, no intercept), the
  //       direction DP-GCN's W1 learns and its W2 is pushed away from.
  // "cov": the cross-covariance direction Σ (x − x̄)(s − s̄) over revealed
  //       users. Removing it leaves no linear correlation with s on those
  //       users (the scalar case of LEACE, Belrose et al. 2023).
  function removalDirection(D, sp, kind) {
    var d = D.d, k = sp.known.length, a, b;
    if (kind === "cov") {
      var mx = new Float64Array(d), ms = 0, u = new Float64Array(d);
      sp.known.forEach(function (r) { ms += D.s[r]; for (a = 0; a < d; a++) mx[a] += D.X[r * d + a]; });
      ms /= k; for (a = 0; a < d; a++) mx[a] /= k;
      sp.known.forEach(function (r) { for (a = 0; a < d; a++) u[a] += (D.X[r * d + a] - mx[a]) * (D.s[r] - ms); });
      return u;
    }
    var XtX = new Float64Array(d * d), Xts = new Float64Array(d);
    sp.known.forEach(function (r) {
      for (a = 0; a < d; a++) { var xa = D.X[r * d + a]; Xts[a] += xa * D.s[r];
        for (b = 0; b < d; b++) XtX[a * d + b] += xa * D.X[r * d + b]; }
    });
    for (a = 0; a < d; a++) XtX[a * d + a] += 1e-6 * k;
    return solve(XtX, Xts, d);
  }
  // Gaussian elimination with partial pivoting (d is small).
  function solve(M, v, d) {
    var A = M.slice(), x = v.slice(), i, j, k;
    for (k = 0; k < d; k++) {
      var p = k; for (i = k + 1; i < d; i++) if (Math.abs(A[i * d + k]) > Math.abs(A[p * d + k])) p = i;
      if (p !== k) { for (j = 0; j < d; j++) { var t = A[k * d + j]; A[k * d + j] = A[p * d + j]; A[p * d + j] = t; } var tv = x[k]; x[k] = x[p]; x[p] = tv; }
      for (i = k + 1; i < d; i++) { var f = A[i * d + k] / A[k * d + k]; if (!f) continue;
        for (j = k; j < d; j++) A[i * d + j] -= f * A[k * d + j]; x[i] -= f * x[k]; }
    }
    for (k = d - 1; k >= 0; k--) { var s = x[k]; for (j = k + 1; j < d; j++) s -= A[k * d + j] * x[j]; x[k] = s / A[k * d + k]; }
    return x;
  }
  // Least-squares linear probe with intercept: fit on revealed users, score
  // the private ones (threshold 0.5). No graph.
  function linearProbe(D, Xin, sp) {
    var d = D.d + 1, M = new Float64Array(d * d), v = new Float64Array(d), a, b;
    function row(r) { var z = new Float64Array(d); for (var c = 0; c < D.d; c++) z[c] = Xin[r * D.d + c]; z[D.d] = 1; return z; }
    sp.known.forEach(function (r) { var z = row(r);
      for (a = 0; a < d; a++) { v[a] += z[a] * D.s[r]; for (b = 0; b < d; b++) M[a * d + b] += z[a] * z[b]; } });
    for (a = 0; a < d; a++) M[a * d + a] += 1e-6 * sp.known.length;
    var w = solve(M, v, d), ok = 0;
    sp.hidden.forEach(function (r) { var z = row(r), t = 0; for (a = 0; a < d; a++) t += z[a] * w[a]; if ((t > 0.5 ? 1 : 0) === D.s[r]) ok++; });
    return ok / sp.hidden.length;
  }

  // The simplest adversary: guess from one revealed column by majority vote.
  function columnRule(D, sp, col) {
    var cnt = [[0, 0], [0, 0]];
    sp.known.forEach(function (i) { cnt[D.X[i * D.d + col] > 0 ? 1 : 0][D.s[i]]++; });
    var rule = [cnt[0][1] > cnt[0][0] ? 1 : 0, cnt[1][1] > cnt[1][0] ? 1 : 0], ok = 0;
    sp.hidden.forEach(function (i) { if (rule[D.X[i * D.d + col] > 0 ? 1 : 0] === D.s[i]) ok++; });
    return ok / sp.hidden.length;
  }

  // Neighbor vote: guess a private user's attribute from the revealed
  // attributes of the user's friends (homophily alone, no features).
  function neighborVote(D, sp) {
    var known = new Int8Array(D.n).fill(-1);
    sp.known.forEach(function (i) { known[i] = D.s[i]; });
    var base = 0; sp.known.forEach(function (i) { base += D.s[i]; });
    var prior = base / sp.known.length >= 0.5 ? 1 : 0, ok = 0, A = D.A;
    sp.hidden.forEach(function (i) {
      var a = 0, b = 0;
      for (var p = A.ptr[i]; p < A.ptr[i + 1]; p++) { var j = A.col[p]; if (j !== i && known[j] >= 0) { if (known[j]) b++; else a++; } }
      var guess = a === b ? prior : (b > a ? 1 : 0);
      if (guess === D.s[i]) ok++;
    });
    return ok / sp.hidden.length;
  }

  function stats(a) {
    var m = 0; a.forEach(function (v) { m += v; }); m /= a.length;
    var v = 0; a.forEach(function (x) { v += (x - m) * (x - m); });
    return { mean: m, sd: a.length > 1 ? Math.sqrt(v / (a.length - 1)) : 0, sdPop: Math.sqrt(v / a.length), n: a.length };
  }

  root.DPGCN = { mulberry32: mulberry32, gauss: gauss, prepare: prepare, normAdj: normAdj, split: split,
    GCN: GCN, Adam: Adam, dropMask: dropMask, trainGCN: trainGCN, infer: infer, baseline: baseline,
    dpgcn: dpgcn, projected: projected, removalDirection: removalDirection, linearProbe: linearProbe, solve: solve, runGen: runGen, columnRule: columnRule, neighborVote: neighborVote, stats: stats,
    matmul: matmul, matmulTN: matmulTN, spmm: spmm, frob2: frob2, DEFAULTS: DEFAULTS, opts: opts };
})(typeof self !== "undefined" ? self : this);

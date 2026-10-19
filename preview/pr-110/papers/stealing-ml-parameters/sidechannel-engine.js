/*
  Stealing machine learning parameters: browser engine for
  /papers/stealing-ml-parameters/.

  Wolf, Hu, Cooley, and Borowczak, "Stealing Machine Learning Parameters via
  Side Channel Power Attacks," IEEE ISVLSI 2021.

  Three parts, all deterministic for a given seed:
    1. The victim models on the Pima diabetes table: closed-form ridge
       regression without a bias term (paper Eq. 2 and 3) and the small neural
       network the paper describes (two hidden layers, ReLU then sigmoid,
       ReLU output, squared error, 150 epochs of ten random vectors).
    2. A simulated power trace of each model training on a microcontroller.
       The paper's traces come from a ChipWhisperer-Lite and are not public,
       so this page models them: every arithmetic step costs a fixed number
       of clock cycles, each cycle draws a base power for its operation plus a
       term proportional to the Hamming weight of the float32 result, and the
       scope averages cycles into equally spaced samples. Everything from this
       part is labeled simulated on the page.
    3. The attack: k-nearest-neighbor classification of traces with Euclidean
       distance or dynamic time warping (DTW), on traces reduced to 5000, 500,
       50, or 10 points, with an 80/20 train/test split.

  Loads as a page script (window.StealML) and inside a Web Worker.
*/
(function (root) {
  "use strict";

  /* ------------------------------------------------------------ random numbers */

  // mulberry32: small, fast, seedable; the page's own generator.
  function rng(seed) {
    var a = (seed >>> 0) || 1;
    var f = function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    var spare = null;
    f.gauss = function () {
      if (spare !== null) { var s = spare; spare = null; return s; }
      var u = 0, v = 0;
      while (u === 0) u = f();
      v = f();
      var r = Math.sqrt(-2 * Math.log(u));
      spare = r * Math.sin(2 * Math.PI * v);
      return r * Math.cos(2 * Math.PI * v);
    };
    f.int = function (n) { return Math.floor(f() * n); };
    return f;
  }

  /* ------------------------------------------------------------ the Pima table */

  var DATA = null;           // rows of nine numbers, set by setData
  function setData(rows) { DATA = rows; cache = {}; }
  var cache = {};

  // "board": the paper's microcontroller copy. Features stored as floats
  // (BMI, pedigree) are dropped and rows with an integer above 255 are
  // removed, leaving six one-byte features on 713 rows (Section IV-A).
  // "full": all eight features on all 768 rows.
  function dataset(variant) {
    if (cache[variant]) return cache[variant];
    if (!DATA) throw new Error("StealML: call setData(rows) first");
    var cols = variant === "full" ? [0, 1, 2, 3, 4, 5, 6, 7] : [0, 1, 2, 3, 4, 7];
    var X = [], y = [];
    DATA.forEach(function (r) {
      var x = cols.map(function (c) { return r[c]; });
      if (variant !== "full" && x.some(function (v) { return v > 255; })) return;
      X.push(x); y.push(r[8]);
    });
    var nTrain = Math.floor(X.length * 0.8);   // first 80% train, last 20% test, file order
    cache[variant] = { variant: variant, cols: cols, X: X, y: y, nTrain: nTrain, n: X.length, d: cols.length };
    return cache[variant];
  }

  /* ------------------------------------------------------------ ridge regression */

  // beta = (X^T X + lambda I)^-1 X^T y, no bias term, float64,
  // Gaussian elimination with partial pivoting.
  function ridgeFit(X, y, lam) {
    var d = X[0].length, A = [], b = [], i, j, k;
    for (i = 0; i < d; i++) { A.push(new Array(d).fill(0)); b.push(0); A[i][i] = lam; }
    for (k = 0; k < X.length; k++) {
      var x = X[k];
      for (i = 0; i < d; i++) {
        b[i] += x[i] * y[k];
        for (j = 0; j < d; j++) A[i][j] += x[i] * x[j];
      }
    }
    return solve(A, b);
  }
  function solve(A, b) {
    var n = b.length, M = A.map(function (r, i) { return r.slice().concat([b[i]]); }), i, j, k;
    for (k = 0; k < n; k++) {
      var p = k;
      for (i = k + 1; i < n; i++) if (Math.abs(M[i][k]) > Math.abs(M[p][k])) p = i;
      var t = M[k]; M[k] = M[p]; M[p] = t;
      for (i = k + 1; i < n; i++) {
        var f = M[i][k] / M[k][k];
        for (j = k; j <= n; j++) M[i][j] -= f * M[k][j];
      }
    }
    var x = new Array(n);
    for (i = n - 1; i >= 0; i--) {
      var s = M[i][n];
      for (j = i + 1; j < n; j++) s -= M[i][j] * x[j];
      x[i] = s / M[i][i];
    }
    return x;
  }
  function dot(a, b) { var s = 0; for (var i = 0; i < a.length; i++) s += a[i] * b[i]; return s; }

  // Accuracy of ridge regression on the sequential 80/20 split, predicting
  // "diabetic" when the fitted value is at least 0.5.
  function ridgeAccuracy(variant, lam) {
    var D = dataset(variant);
    var beta = ridgeFit(D.X.slice(0, D.nTrain), D.y.slice(0, D.nTrain), lam);
    var correct = 0, nTest = D.n - D.nTrain;
    for (var k = D.nTrain; k < D.n; k++) {
      var pred = dot(beta, D.X[k]) >= 0.5 ? 1 : 0;
      if (pred === D.y[k]) correct++;
    }
    return { accuracy: correct / nTest, correct: correct, nTest: nTest, nTrain: D.nTrain, beta: beta, variant: variant, lambda: lam };
  }

  /* ------------------------------------------------------------ the neural network */

  // Six byte features scaled to [0, 1] plus a constant bias input; two hidden
  // layers of h nodes (ReLU, then sigmoid); one ReLU output; squared error.
  // Initial weights are uniform random, normalized so each node's incoming
  // weights sum to one. Each epoch trains on ten randomly drawn vectors.
  // Scaling and the per-node normalization are this page's reading of the
  // paper's description.
  function relu(v) { return v > 0 ? v : 0; }
  function sigmoid(v) { return 1 / (1 + Math.exp(-v)); }
  function initLayer(nOut, nIn, r) {
    var W = [];
    for (var j = 0; j < nOut; j++) {
      var row = [], s = 0;
      for (var i = 0; i < nIn; i++) { var w = r(); row.push(w); s += w; }
      for (i = 0; i < nIn; i++) row[i] /= s;
      W.push(row);
    }
    return W;
  }
  function nnCreate(h, seed) {
    var r = rng(seed);
    return { h: h, W1: initLayer(h, 7, r), W2: initLayer(h, h, r), W3: initLayer(1, h, r)[0], r: r };
  }
  function nnInput(x, z) {
    var v = z ? x.map(function (t, i) { return (t - z.mean[i]) / z.sd[i]; }) : x.map(function (t) { return t / 255; });
    v.push(1); return v;
  }
  // Mean and standard deviation of each feature over the training rows
  // (population form), for the optional standardized inputs.
  function zStats(X) {
    var d = X[0].length, mean = [], sd = [], i, k;
    for (i = 0; i < d; i++) {
      var s = 0; for (k = 0; k < X.length; k++) s += X[k][i];
      var m = s / X.length, q = 0; for (k = 0; k < X.length; k++) q += (X[k][i] - m) * (X[k][i] - m);
      mean.push(m); sd.push(Math.sqrt(q / X.length));
    }
    return { mean: mean, sd: sd };
  }
  function nnForward(net, v) {
    var h = net.h, a1 = new Array(h), a2 = new Array(h), j;
    for (j = 0; j < h; j++) a1[j] = relu(dot(net.W1[j], v));
    for (j = 0; j < h; j++) a2[j] = sigmoid(dot(net.W2[j], a1));
    var z = dot(net.W3, a2);
    return { a1: a1, a2: a2, z: z, out: relu(z) };
  }
  function nnStep(net, v, target, lr) {
    var h = net.h, f = nnForward(net, v), j, k;
    var dOut = 2 * (f.out - target) * (f.z > 0 ? 1 : 0);
    var d2 = new Array(h), d1 = new Array(h);
    for (j = 0; j < h; j++) d2[j] = dOut * net.W3[j] * f.a2[j] * (1 - f.a2[j]);
    for (j = 0; j < h; j++) {
      var s = 0;
      for (k = 0; k < h; k++) s += d2[k] * net.W2[k][j];
      d1[j] = f.a1[j] > 0 ? s : 0;
    }
    for (j = 0; j < h; j++) net.W3[j] -= lr * dOut * f.a2[j];
    for (k = 0; k < h; k++) for (j = 0; j < h; j++) net.W2[k][j] -= lr * d2[k] * f.a1[j];
    for (k = 0; k < h; k++) for (j = 0; j < 7; j++) net.W1[k][j] -= lr * d1[k] * v[j];
  }
  function nnTrain(opts) {
    var h = opts.hidden || 8, seed = opts.seed || 1, epochs = opts.epochs || 150,
        batch = opts.batch || 10, lr = opts.lr || 0.025;
    var D = dataset("board"), net = nnCreate(h, seed), r = net.r, curve = [];
    var z = opts.scale === "z" ? zStats(D.X.slice(0, D.nTrain)) : null;
    var Xtr = D.X.slice(0, D.nTrain).map(function (x) { return nnInput(x, z); }), ytr = D.y.slice(0, D.nTrain);
    var Xte = D.X.slice(D.nTrain).map(function (x) { return nnInput(x, z); }), yte = D.y.slice(D.nTrain);
    function acc() {
      var c = 0;
      for (var k = 0; k < Xte.length; k++) if ((nnForward(net, Xte[k]).out >= 0.5 ? 1 : 0) === yte[k]) c++;
      return c / Xte.length;
    }
    for (var e = 0; e < epochs; e++) {
      for (var b = 0; b < batch; b++) { var k = r.int(Xtr.length); nnStep(net, Xtr[k], ytr[k], lr); }
      if (opts.curve && (e % 5 === 4 || e === epochs - 1)) curve.push([e + 1, acc()]);
    }
    var correct = Math.round(acc() * Xte.length);
    var positives = 0;
    for (var t = 0; t < Xte.length; t++) if (nnForward(net, Xte[t]).out >= 0.5) positives++;
    return { accuracy: correct / Xte.length, correct: correct, nTest: Xte.length, curve: curve, predictedPositive: positives, hidden: h, seed: seed, scale: opts.scale === "z" ? "z" : "255" };
  }

  /* ------------------------------------------------------------ simulated power */

  // Operation classes: clock cycles per operation and base power per cycle
  // (arbitrary units). A software-float microcontroller spends more cycles on
  // multiplies, divides, and exponentials than on loads and compares.
  var OPS = {
    ld:  { cycles: 2,  base: 0.30, name: "load" },
    st:  { cycles: 2,  base: 0.33, name: "store" },
    add: { cycles: 6,  base: 0.46, name: "add" },
    mul: { cycles: 8,  base: 0.62, name: "multiply" },
    div: { cycles: 16, base: 0.55, name: "divide" },
    exp: { cycles: 30, base: 0.52, name: "exponential" },
    cmp: { cycles: 2,  base: 0.24, name: "compare" }
  };
  var OP_ORDER = ["ld", "st", "add", "mul", "div", "exp", "cmp"];
  var IDLE = 0.22;              // power of the idle loop after training ends
  var HW_GAIN = 0.012;          // power per set bit of the float32 result
  var f32 = new Float32Array(1), u32 = new Uint32Array(f32.buffer);
  function hw32(v) {
    f32[0] = v;
    var x = u32[0];
    x = x - ((x >>> 1) & 0x55555555);
    x = (x & 0x33333333) + ((x >>> 2) & 0x33333333);
    return (Math.imul((x + (x >>> 4)) & 0x0F0F0F0F, 0x01010101) >>> 24);
  }
  var fr = Math.fround;

  // A sink receives each operation and its float32 result. Two sinks exist:
  // a cycle recorder (demo 2) and a decimating scope (traces for the attack).
  function cycleSink(maxCycles) {
    var power = [], type = [], hw = [];
    return {
      full: false,
      op: function (t, v) {
        if (this.full) return;
        var o = OPS[t], h = hw32(v);
        for (var c = 0; c < o.cycles; c++) {
          power.push(o.base + HW_GAIN * h + (c === 0 ? 0.04 : 0));
          type.push(t); hw.push(h);
          if (power.length >= maxCycles) { this.full = true; return; }
        }
      },
      result: function () { return { power: power, type: type, hw: hw }; }
    };
  }
  function scopeSink(opts, r) {
    var len = opts.len || 5000, D = opts.decim || 13, noise = opts.noise == null ? 0.05 : opts.noise,
        meas = opts.meas == null ? 0.01 : opts.meas;
    var out = new Float32Array(len), n = 0, acc = 0, cnt = 0;
    var skip = opts.jitter ? r.int(opts.jitter + 1) : 0;   // capture start offset, in cycles
    var gain = 1 + (opts.gain ? opts.gain * r.gauss() : 0);   // probe gain drift between captures
    var shift = opts.offset ? opts.offset * r.gauss() : 0;     // baseline drift between captures
    function push(p) {
      if (skip > 0) { skip--; return; }
      acc += p + (noise ? noise * r.gauss() : 0); cnt++;
      if (cnt === D) {
        out[n++] = gain * (acc / D) + shift + (meas ? meas * r.gauss() : 0);
        acc = 0; cnt = 0;
      }
    }
    return {
      full: false,
      op: function (t, v) {
        if (this.full) return;
        var o = OPS[t], p = o.base + HW_GAIN * hw32(v);
        for (var c = 0; c < o.cycles; c++) {
          push(c === 0 ? p + 0.04 : p);
          if (n >= len) { this.full = true; return; }
        }
      },
      finish: function () { while (n < len) push(IDLE); return out; }
    };
  }

  // Instrumented training code. Values are rounded to float32 the way a
  // microcontroller's single-precision floats would hold them.
  function nnEpochOps(net, X, Y, idx, lr, sink) {
    var h = net.h, j, k, s, v, p;
    lr = fr(lr);
    for (var b = 0; b < idx.length && !sink.full; b++) {
      var x = X[idx[b]], target = Y[idx[b]];
      // forward, layer 1
      var a1 = new Array(h), a2 = new Array(h);
      for (j = 0; j < h; j++) {
        s = 0;
        for (k = 0; k < 7; k++) {
          sink.op("ld", x[k]);
          p = fr(net.W1[j][k] * x[k]); sink.op("mul", p);
          s = fr(s + p); sink.op("add", s);
        }
        sink.op("cmp", s); a1[j] = s > 0 ? s : 0; sink.op("st", a1[j]);
      }
      // forward, layer 2 (sigmoid)
      for (j = 0; j < h; j++) {
        s = 0;
        for (k = 0; k < h; k++) {
          sink.op("ld", a1[k]);
          p = fr(net.W2[j][k] * a1[k]); sink.op("mul", p);
          s = fr(s + p); sink.op("add", s);
        }
        v = fr(Math.exp(-s)); sink.op("exp", v);
        v = fr(1 + v); sink.op("add", v);
        a2[j] = fr(1 / v); sink.op("div", a2[j]); sink.op("st", a2[j]);
      }
      // output (ReLU)
      s = 0;
      for (k = 0; k < h; k++) { sink.op("ld", a2[k]); p = fr(net.W3[k] * a2[k]); sink.op("mul", p); s = fr(s + p); sink.op("add", s); }
      sink.op("cmp", s);
      var out = s > 0 ? s : 0;
      // backward
      var dOut = fr(2 * (out - target) * (s > 0 ? 1 : 0)); sink.op("mul", dOut);
      var d2 = new Array(h), d1 = new Array(h);
      for (j = 0; j < h; j++) {
        v = fr(dOut * net.W3[j]); sink.op("mul", v);
        var g = fr(a2[j] * fr(1 - a2[j])); sink.op("add", fr(1 - a2[j])); sink.op("mul", g);
        d2[j] = fr(v * g); sink.op("mul", d2[j]);
      }
      for (j = 0; j < h; j++) {
        p = fr(lr * fr(dOut * a2[j])); sink.op("mul", fr(dOut * a2[j])); sink.op("mul", p);
        net.W3[j] = fr(net.W3[j] - p); sink.op("add", net.W3[j]); sink.op("st", net.W3[j]);
      }
      for (j = 0; j < h; j++) {
        s = 0;
        for (k = 0; k < h; k++) { p = fr(d2[k] * net.W2[k][j]); sink.op("mul", p); s = fr(s + p); sink.op("add", s); }
        sink.op("cmp", a1[j]); d1[j] = a1[j] > 0 ? s : 0;
      }
      for (k = 0; k < h; k++) for (j = 0; j < h; j++) {
        p = fr(lr * fr(d2[k] * a1[j])); sink.op("mul", fr(d2[k] * a1[j])); sink.op("mul", p);
        net.W2[k][j] = fr(net.W2[k][j] - p); sink.op("add", net.W2[k][j]); sink.op("st", net.W2[k][j]);
      }
      for (k = 0; k < h; k++) for (j = 0; j < 7; j++) {
        p = fr(lr * fr(d1[k] * x[j])); sink.op("mul", fr(d1[k] * x[j])); sink.op("mul", p);
        net.W1[k][j] = fr(net.W1[k][j] - p); sink.op("add", net.W1[k][j]); sink.op("st", net.W1[k][j]);
      }
    }
  }
  // Ridge regression "training" on the board: A = lambda I, accumulate X^T X
  // and X^T y over the batch, solve by Gauss-Jordan elimination, then score
  // the held-out rows (testing follows training, as in the paper).
  function ridgeOps(lam, X, Y, idx, Xte, sink) {
    var d = 6, A = [], b = [], i, j, k, p, s;
    for (i = 0; i < d; i++) {
      A.push(new Array(d + 1).fill(0));
      for (j = 0; j < d; j++) { A[i][j] = i === j ? fr(lam) : 0; sink.op("st", A[i][j]); }
    }
    for (var n = 0; n < idx.length && !sink.full; n++) {
      var x = X[idx[n]], t = Y[idx[n]];
      for (i = 0; i < d; i++) {
        sink.op("ld", x[i]);
        for (j = 0; j < d; j++) {
          p = fr(x[i] * x[j]); sink.op("mul", p);
          A[i][j] = fr(A[i][j] + p); sink.op("add", A[i][j]);
        }
        p = fr(x[i] * t); sink.op("mul", p);
        A[i][d] = fr(A[i][d] + p); sink.op("add", A[i][d]);
      }
    }
    // Gauss-Jordan on the augmented 6 x 7 matrix
    for (k = 0; k < d && !sink.full; k++) {
      var piv = A[k][k];
      for (j = k; j <= d; j++) { A[k][j] = fr(A[k][j] / piv); sink.op("div", A[k][j]); }
      for (i = 0; i < d; i++) {
        if (i === k) continue;
        var f = A[i][k]; sink.op("ld", f);
        for (j = k; j <= d; j++) { p = fr(f * A[k][j]); sink.op("mul", p); A[i][j] = fr(A[i][j] - p); sink.op("add", A[i][j]); }
      }
    }
    var beta = A.map(function (r) { return r[d]; });
    for (n = 0; n < Xte.length && !sink.full; n++) {
      s = 0;
      for (j = 0; j < d; j++) { sink.op("ld", Xte[n][j]); p = fr(beta[j] * Xte[n][j]); sink.op("mul", p); s = fr(s + p); sink.op("add", s); }
      sink.op("cmp", s);
    }
  }

  var MODELS = {
    nn8:  { label: "Neural network, 8 nodes per hidden layer", short: "NN, 8 nodes", kind: "nn", h: 8 },
    nn10: { label: "Neural network, 10 nodes per hidden layer", short: "NN, 10 nodes", kind: "nn", h: 10 },
    lr10: { label: "Linear regression, λ = 10", short: "LR, λ = 10", kind: "lr", lam: 10 },
    lr8:  { label: "Linear regression, λ = 8", short: "LR, λ = 8", kind: "lr", lam: 8 }
  };
  var TASKS = {
    1: { label: "Neural network or linear regression", classes: [["nn8", "nn10"], ["lr10", "lr8"]], names: ["Neural network", "Linear regression"] },
    2: { label: "8 or 10 hidden nodes", classes: [["nn8"], ["nn10"]], names: ["8 nodes", "10 nodes"] },
    3: { label: "λ = 8 or λ = 10", classes: [["lr8"], ["lr10"]], names: ["λ = 8", "λ = 10"] }
  };

  // Shared training material for traces: the board copy, NN inputs scaled.
  function boardForTraces() {
    if (cache.traceData) return cache.traceData;
    var D = dataset("board");
    cache.traceData = {
      Xraw: D.X.slice(0, D.nTrain), Xnn: D.X.slice(0, D.nTrain).map(function (x) { return nnInput(x); }),
      y: D.y.slice(0, D.nTrain), Xte: D.X.slice(D.nTrain)
    };
    return cache.traceData;
  }
  function batchIdx(r, n, m) { var idx = []; for (var i = 0; i < m; i++) idx.push(r.int(n)); return idx; }

  // Run one capture of `model` into `sink`. Each capture is a fresh training
  // run (new initial weights for the networks) on ten random training rows.
  // With opts.same, every capture repeats the same ten rows (and, for the
  // networks, the same initial weights), so captures of one model differ only
  // by measurement noise and timing.
  function runModel(model, seed, sink, opts) {
    var same = opts && opts.same, M = MODELS[model], T = boardForTraces(), dseed = same ? 1 : seed;
    var r = rng(dseed * 7919 + 17);
    var idx = batchIdx(r, T.y.length, 10);
    if (M.kind === "nn") {
      var net = nnCreate(M.h, dseed * 104729 + 3);
      nnEpochOps(net, T.Xnn, T.y, idx, 0.025, sink);
    } else {
      ridgeOps(M.lam, T.Xraw, T.y, idx, T.Xte, sink);
    }
  }
  function cycles(model, seed, maxCycles) {
    var sink = cycleSink(maxCycles || 4000);
    runModel(model, seed, sink);
    return sink.result();
  }
  function trace(model, seed, opts) {
    opts = opts || {};
    var r = rng(seed * 2654435761 + 99);
    var sink = scopeSink(opts, r);
    runModel(model, seed, sink, opts);
    return sink.finish();
  }
  // Count the operations in one epoch (or one ridge fit and score).
  function opCounts(model) {
    var counts = {}, total = 0;
    OP_ORDER.forEach(function (t) { counts[t] = 0; });
    var sink = { full: false, op: function (t) { counts[t]++; total += OPS[t].cycles; } };
    runModel(model, 1, sink);
    return { counts: counts, cycles: total };
  }

  /* ------------------------------------------------------------ the attack */

  // Reduce a trace to n points by averaging equal-width bins
  // (piecewise aggregate approximation). n = length keeps it unchanged.
  function reduce(tr, n) {
    var L = tr.length;
    if (n >= L) return Float64Array.from(tr);
    var out = new Float64Array(n);
    for (var i = 0; i < n; i++) {
      var a = Math.floor(i * L / n), b = Math.floor((i + 1) * L / n), s = 0;
      for (var j = a; j < b; j++) s += tr[j];
      out[i] = s / (b - a);
    }
    return out;
  }
  function euclid2(a, b) { var s = 0; for (var i = 0; i < a.length; i++) { var d = a[i] - b[i]; s += d * d; } return s; }
  // Dynamic time warping, squared-difference cost, no window; returns the
  // square root of the accumulated cost (as tslearn does).
  function dtw(a, b, buf) {
    var n = a.length, m = b.length, prev = buf ? buf[0] : new Float64Array(m + 1), cur = buf ? buf[1] : new Float64Array(m + 1), i, j;
    prev[0] = 0; for (j = 1; j <= m; j++) prev[j] = Infinity;
    for (i = 1; i <= n; i++) {
      cur[0] = Infinity;
      var ai = a[i - 1];
      for (j = 1; j <= m; j++) {
        var d = ai - b[j - 1], best = prev[j - 1];
        if (prev[j] < best) best = prev[j];
        if (cur[j - 1] < best) best = cur[j - 1];
        cur[j] = d * d + best;
      }
      var t = prev; prev = cur; cur = t;
    }
    return Math.sqrt(prev[m]);
  }
  // k-NN with uniform votes; ties between the two classes go to class 0
  // (the lower label, as scikit-learn's argmax does).
  function knnPredict(trainX, trainY, x, k, metric, buf) {
    var best = [];  // [dist, label], sorted ascending, length <= k
    for (var i = 0; i < trainX.length; i++) {
      var d = metric === "dtw" ? dtw(x, trainX[i], buf) : euclid2(x, trainX[i]);
      if (best.length < k || d < best[best.length - 1][0]) {
        var pos = best.length;
        while (pos > 0 && best[pos - 1][0] > d) pos--;
        best.splice(pos, 0, [d, trainY[i]]);
        if (best.length > k) best.pop();
      }
    }
    var votes = [0, 0];
    best.forEach(function (b) { votes[b[1]]++; });
    return votes[1] > votes[0] ? 1 : 0;
  }

  // Build a task's traces: perModel captures of each model in the task,
  // labeled 0 or 1, shuffled and split 80/20 with the split seed.
  function buildTask(task, perModel, seed, opts) {
    var T = TASKS[task], traces = [], labels = [];
    T.classes.forEach(function (models, label) {
      models.forEach(function (m, mi) {
        for (var i = 0; i < perModel; i++) {
          traces.push(trace(m, 1 + i + 100000 * (mi + 1) + 1000000 * label + 7 * seed, opts));
          labels.push(label);
        }
      });
    });
    return { traces: traces, labels: labels };
  }
  function split(n, seed) {
    var r = rng(seed * 31 + 5), idx = [];
    for (var i = 0; i < n; i++) idx.push(i);
    for (i = n - 1; i > 0; i--) { var j = r.int(i + 1); var t = idx[i]; idx[i] = idx[j]; idx[j] = t; }
    var nTest = Math.ceil(n * 0.2);
    return { test: idx.slice(0, nTest), train: idx.slice(nTest) };
  }
  // Classify one configuration. `progress(done, total)` is called as test
  // traces finish; returns accuracy and the confusion counts.
  function classify(built, sp, dims, k, metric, progress) {
    var red = built.traces.map(function (t) { return reduce(t, dims); });
    var trX = sp.train.map(function (i) { return red[i]; }), trY = sp.train.map(function (i) { return built.labels[i]; });
    var buf = [new Float64Array(dims + 1), new Float64Array(dims + 1)];
    var conf = [[0, 0], [0, 0]], correct = 0;
    for (var t = 0; t < sp.test.length; t++) {
      var i = sp.test[t], pred = knnPredict(trX, trY, red[i], k, metric, buf);
      conf[built.labels[i]][pred]++;
      if (pred === built.labels[i]) correct++;
      if (progress && (t % 8 === 7 || t === sp.test.length - 1)) progress(t + 1, sp.test.length);
    }
    return { accuracy: correct / sp.test.length, correct: correct, nTest: sp.test.length, confusion: conf };
  }

  // Table I's eight rows (method, dimension, k) in the paper's order.
  var CONFIGS = [
    { metric: "euclid", dims: 5000, k: 3 }, { metric: "euclid", dims: 500, k: 3 },
    { metric: "euclid", dims: 50, k: 3 },   { metric: "euclid", dims: 10, k: 3 },
    { metric: "dtw", dims: 50, k: 3 },      { metric: "dtw", dims: 50, k: 5 },
    { metric: "dtw", dims: 10, k: 3 },      { metric: "dtw", dims: 10, k: 5 }
  ];
  // Table I as printed (accuracy for Tasks 1, 2, 3).
  var TABLE1 = [
    [0.9918, 0.8434, 0.6625], [0.9966, 0.9000, 0.6625], [0.9967, 0.9667, 0.6083], [0.9966, 0.8167, 0.5958],
    [1.0, 0.9792, 0.6292], [1.0, 0.9542, 0.5958], [1.0, 0.8708, 0.6583], [1.0, 0.8750, 0.6792]
  ];
  // The page's default capture conditions (its own choice; the paper does not
  // report noise or alignment): same ten rows each capture, a start offset of
  // up to 200 cycles, and small gain and baseline drift between captures.
  var DEFAULTS = { len: 5000, decim: 13, noise: 0.15, meas: 0.03, jitter: 200, gain: 0.02, offset: 0.01, same: true };

  var api = {
    rng: rng, setData: setData, dataset: dataset,
    ridgeFit: ridgeFit, ridgeAccuracy: ridgeAccuracy,
    nnTrain: nnTrain, nnCreate: nnCreate, nnForward: nnForward, nnInput: nnInput,
    OPS: OPS, OP_ORDER: OP_ORDER, IDLE: IDLE, HW_GAIN: HW_GAIN, hw32: hw32,
    MODELS: MODELS, TASKS: TASKS, CONFIGS: CONFIGS, TABLE1: TABLE1, DEFAULTS: DEFAULTS,
    cycles: cycles, trace: trace, opCounts: opCounts,
    reduce: reduce, dtw: dtw, euclid2: euclid2, knnPredict: knnPredict,
    buildTask: buildTask, split: split, classify: classify
  };
  root.StealML = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof self !== "undefined" ? self : this);

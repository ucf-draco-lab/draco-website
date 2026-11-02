/*
  TP-NET: browser engine for /papers/tp-net-privacy/.

  Hu, Gegax-Randazzo, Carper, and Borowczak, "TP-NET: Training
  Privacy-Preserving Deep Neural Networks under Side-Channel Power Attacks,"
  IEEE iSES 2022, pp. 439-444.

  Four parts, all deterministic for a given seed:
    1. The models on the Pima diabetes table (the paper's six-byte board copy,
       713 rows): a two-hidden-layer network with sigmoid activations and a
       fixed bias of 0.75 on every hidden node (Section V-A), and TP-NET,
       which builds r sub-networks with random widths in [2, m]
       (Algorithm 1), trains them in a random order, and predicts with the
       sub-network that is most accurate on the training rows (Eq. 2).
    2. The paper's operation-count model of power (Eq. 4 to 11), and the
       exact distribution of a TP-NET's total weight count over random
       structures.
    3. A simulated power trace of one training step. The paper's traces come
       from a ChipWhisperer-Lite and an XMEGA target and are not public, so
       this page models them, using the leakage model of the lab's
       /papers/stealing-ml-parameters/ page: every operation costs a fixed
       number of clock cycles, each cycle draws a base power for its
       operation plus a term for the set bits of its float32 result, and the
       scope averages cycles into 5,000 samples. Every trace from this part
       is labeled simulated on the page.
    4. The attack of Section V-C: k-nearest neighbors (Euclidean distance)
       labels unlabeled traces by hidden-layer width, trained on labeled
       traces of the traditional network or of TP-NET structures 1 to 5 and
       tested on structure 6 or 7 (Table III).

  Loads as a page script (window.TPNet) and inside a Web Worker.
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

  /* ------------------------------------------------------------ the paper's tables */

  // Table III: seven random internal structures of TP-NET (r = 2), as
  // [[z11, z12], [z21, z22]] for each structure and each width m.
  var TABLE3 = {
    8:  [[[6, 5], [4, 3]], [[4, 5], [6, 7]], [[5, 4], [7, 3]], [[2, 5], [4, 4]], [[7, 7], [5, 8]], [[2, 7], [8, 7]], [[2, 8], [4, 8]]],
    10: [[[5, 10], [3, 7]], [[4, 9], [5, 6]], [[3, 9], [8, 8]], [[2, 8], [6, 3]], [[6, 3], [8, 6]], [[6, 2], [10, 3]], [[8, 9], [2, 2]]],
    14: [[[6, 2], [12, 6]], [[8, 10], [9, 9]], [[14, 10], [4, 8]], [[7, 9], [8, 14]], [[14, 4], [6, 10]], [[13, 5], [10, 8]], [[7, 14], [14, 2]]]
  };
  // Table IV: classification accuracy, [traditional, TP-NET, printed change %].
  var TABLE4 = {
    diabetes: { 8: [0.6257, 0.6268, 0.17], 10: [0.6415, 0.6461, 0.72], 14: [0.6233, 0.6172, -0.98] },
    compas:   { 8: [0.7644, 0.6938, -9.24], 10: [0.7852, 0.7712, -1.78], 14: [0.7720, 0.7616, -1.35] }
  };
  // Tables V to VII: k-NN inference accuracy on the number of hidden nodes
  // (Diabetes). Each entry: traditional [k=3, k=6], TP-NET structure 6 and 7
  // [k=3, k=6], and the printed changes in percent.
  var TABLE_INF = {
    "8-10":  { table: "V",   trad: [0.9867, 0.9850], s6: [0.4063, 0.4080], s7: [0.4300, 0.4286], s6pct: [-58.82, -58.58], s7pct: [-56.42, -56.49] },
    "8-14":  { table: "VI",  trad: [1.0000, 1.0000], s6: [0.6193, 0.6163], s7: [0.5970, 0.6007], s6pct: [-38.07, -38.37], s7pct: [-40.30, -39.93] },
    "10-14": { table: "VII", trad: [1.0000, 0.9983], s6: [0.5890, 0.5993], s7: [0.4630, 0.4667], s6pct: [-41.10, -39.97], s7pct: [-53.70, -53.25] }
  };

  // Relative change, in percent, as the paper's arrows report it.
  function relChange(base, x) { return (x - base) / base * 100; }

  /* ------------------------------------------------------------ the Pima table */

  var DATA = null, cache = {};
  function setData(rows) { DATA = rows; cache = {}; }

  // The paper's board copy (Section V-A): features stored as floats (BMI and
  // pedigree) are dropped and rows with an integer above 255 are removed,
  // leaving six one-byte features on 713 rows. The paper does not give its
  // split; the page trains on the first 80 percent in file order (570 rows)
  // and tests on the last 143.
  function dataset() {
    if (cache.board) return cache.board;
    if (!DATA) throw new Error("TPNet: call setData(rows) first");
    var cols = [0, 1, 2, 3, 4, 7], X = [], y = [];
    DATA.forEach(function (r) {
      var x = cols.map(function (c) { return r[c]; });
      if (x.some(function (v) { return v > 255; })) return;
      X.push(x); y.push(r[8]);
    });
    var nTrain = Math.floor(X.length * 0.8);
    var Xs = X.map(function (x) { return x.map(function (v) { return v / 255; }); });
    // Optional standardized copy: mean and standard deviation (population
    // form) of each feature over the training rows.
    var mean = [], sd = [], i, k2;
    for (i = 0; i < cols.length; i++) {
      var s = 0; for (k2 = 0; k2 < nTrain; k2++) s += X[k2][i];
      var mu = s / nTrain, q = 0; for (k2 = 0; k2 < nTrain; k2++) q += (X[k2][i] - mu) * (X[k2][i] - mu);
      mean.push(mu); sd.push(Math.sqrt(q / nTrain));
    }
    var Xz = X.map(function (x) { return x.map(function (v, j) { return (v - mean[j]) / sd[j]; }); });
    var neg = 0; for (var k = nTrain; k < y.length; k++) if (!y[k]) neg++;
    cache.board = { X: X, Xs: Xs, Xz: Xz, y: y, n: X.length, nTrain: nTrain, d: cols.length, removed: DATA.length - X.length, testNegatives: neg };
    return cache.board;
  }

  /* ------------------------------------------------------------ the network */

  // Two hidden layers (z1, z2 nodes) and one output, sigmoid everywhere,
  // squared error, a fixed bias of 0.75 on every hidden node (Section V-A).
  // Initial weights are uniform on [-0.5, 0.5] (the paper does not say).
  var BIAS = 0.75, LR = 0.025;
  function sigmoid(v) { return 1 / (1 + Math.exp(-v)); }
  function layer(nOut, nIn, r) {
    var W = [];
    for (var j = 0; j < nOut; j++) { var row = []; for (var i = 0; i < nIn; i++) row.push(r() - 0.5); W.push(row); }
    return W;
  }
  function netCreate(z1, z2, d, r) {
    return { z1: z1, z2: z2, d: d, W0: layer(z1, d, r), W1: layer(z2, z1, r), W2: layer(1, z2, r)[0] };
  }
  function forward(net, x) {
    var a1 = new Array(net.z1), a2 = new Array(net.z2), j, k, s;
    for (j = 0; j < net.z1; j++) { s = BIAS; for (k = 0; k < net.d; k++) s += net.W0[j][k] * x[k]; a1[j] = sigmoid(s); }
    for (j = 0; j < net.z2; j++) { s = BIAS; for (k = 0; k < net.z1; k++) s += net.W1[j][k] * a1[k]; a2[j] = sigmoid(s); }
    s = 0; for (k = 0; k < net.z2; k++) s += net.W2[k] * a2[k];
    return { a1: a1, a2: a2, out: sigmoid(s) };
  }
  // One stochastic gradient step (Eq. 5) on one row.
  function step(net, x, t, lr) {
    var f = forward(net, x), j, k, s;
    var dOut = 2 * (f.out - t) * f.out * (1 - f.out);
    var d2 = new Array(net.z2), d1 = new Array(net.z1);
    for (j = 0; j < net.z2; j++) d2[j] = dOut * net.W2[j] * f.a2[j] * (1 - f.a2[j]);
    for (j = 0; j < net.z1; j++) { s = 0; for (k = 0; k < net.z2; k++) s += d2[k] * net.W1[k][j]; d1[j] = s * f.a1[j] * (1 - f.a1[j]); }
    for (j = 0; j < net.z2; j++) net.W2[j] -= lr * dOut * f.a2[j];
    for (k = 0; k < net.z2; k++) for (j = 0; j < net.z1; j++) net.W1[k][j] -= lr * d2[k] * f.a1[j];
    for (k = 0; k < net.z1; k++) for (j = 0; j < net.d; j++) net.W0[k][j] -= lr * d1[k] * x[j];
  }
  function accuracy(net, X, y, a, b) {
    var c = 0;
    for (var k = a; k < b; k++) if ((forward(net, X[k]).out >= 0.5 ? 1 : 0) === y[k]) c++;
    return { correct: c, n: b - a, accuracy: c / (b - a) };
  }
  function predictedPositive(net, X, a, b) {
    var p = 0; for (var k = a; k < b; k++) if (forward(net, X[k]).out >= 0.5) p++;
    return p;
  }
  // Train one network for `epochs` passes of `batch` random training rows.
  function inputs(D, scale) { return scale === "z" ? D.Xz : D.Xs; }
  function trainNet(net, D, epochs, batch, r, X) {
    for (var e = 0; e < epochs; e++) for (var b = 0; b < batch; b++) { var k = r.int(D.nTrain); step(net, X[k], D.y[k], LR); }
    return net;
  }

  // Traditional DNN: m nodes in each hidden layer.
  function trainTraditional(m, opts) {
    opts = opts || {};
    var D = dataset(), r = rng((opts.seed || 1) * 7919 + 1), X = inputs(D, opts.scale);
    var net = trainNet(netCreate(m, m, D.d, r), D, opts.epochs || 150, opts.batch || 10, r, X);
    var te = accuracy(net, X, D.y, D.nTrain, D.n), tr = accuracy(net, X, D.y, 0, D.nTrain);
    return { net: net, m: m, train: tr.accuracy, test: te.accuracy, correct: te.correct, nTest: te.n, positives: predictedPositive(net, X, D.nTrain, D.n) };
  }

  // Algorithm 1: r sub-networks, each hidden width uniform on [2, m].
  function construct(m, r, rand) {
    var s = [];
    for (var i = 0; i < r; i++) s.push([2 + rand.int(m - 1), 2 + rand.int(m - 1)]);
    return s;
  }
  // A random training order over r sub-networks (a permutation).
  function order(r, rand) {
    var a = []; for (var i = 0; i < r; i++) a.push(i);
    for (i = r - 1; i > 0; i--) { var j = rand.int(i + 1); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  // TP-NET: train every sub-network in a random order, then predict with
  // the one most accurate on the training rows (ties go to the earlier
  // sub-network in the structure list).
  function trainTPNet(structure, opts) {
    opts = opts || {};
    var D = dataset(), r = rng((opts.seed || 1) * 7919 + 2), X = inputs(D, opts.scale);
    var A = order(structure.length, r), nets = new Array(structure.length);
    A.forEach(function (i) { nets[i] = trainNet(netCreate(structure[i][0], structure[i][1], D.d, r), D, opts.epochs || 150, opts.batch || 10, r, X); });
    var best = 0, trainAcc = nets.map(function (n) { return accuracy(n, X, D.y, 0, D.nTrain).accuracy; });
    for (var i = 1; i < nets.length; i++) if (trainAcc[i] > trainAcc[best]) best = i;
    var te = accuracy(nets[best], X, D.y, D.nTrain, D.n);
    var subTest = nets.map(function (n) { return accuracy(n, X, D.y, D.nTrain, D.n).accuracy; });
    return { net: nets[best], structure: structure, order: A, trainAcc: trainAcc, subTest: subTest, chosen: best, test: te.accuracy, correct: te.correct, nTest: te.n, positives: predictedPositive(nets[best], X, D.nTrain, D.n) };
  }

  /* ------------------------------------------------------------ Eq. 4 to 11 */

  // Executions of each atomic operation for one sub-network and one training
  // sample, as Eq. 4 and Eq. 6 to 8 count them. N1, N2, and N3 (the partial
  // differentiation terms) are left symbolic: the update count is the number
  // of weights each of them multiplies.
  function eqCounts(z1, z2, d) {
    return {
      mul: z1 * d + z2 * z1 + z2,      // Eq. 4, multiplications
      add: z1 + z2,                     // Eq. 4, additions (one per hidden node)
      act: z1 + z2 + 1,                 // Eq. 4, activations
      upd: z2 + z2 * z1 + z1 * d        // Eq. 6 to 8, weights updated
    };
  }
  function weights(z1, z2, d) { return z1 * d + z2 * z1 + z2; }
  function structWeights(structure, d) { return structure.reduce(function (s, z) { return s + weights(z[0], z[1], d); }, 0); }

  // Exact distribution of a TP-NET's total weight count (Eq. 11 up to the
  // per-operation constants) when every width is uniform on [2, m].
  function weightDistribution(m, r, d) {
    var key = m + ":" + r + ":" + d;
    if (cache["wd" + key]) return cache["wd" + key];
    var one = {}, z1, z2, n = m - 1;
    for (z1 = 2; z1 <= m; z1++) for (z2 = 2; z2 <= m; z2++) { var w = weights(z1, z2, d); one[w] = (one[w] || 0) + 1 / (n * n); }
    var dist = { 0: 1 };
    for (var i = 0; i < r; i++) {
      var next = {};
      Object.keys(dist).forEach(function (a) { Object.keys(one).forEach(function (b) { var s = +a + +b; next[s] = (next[s] || 0) + dist[a] * one[b]; }); });
      dist = next;
    }
    cache["wd" + key] = dist;
    return dist;
  }
  // Best possible two-class accuracy (equal priors) for an attacker who reads
  // the total weight count exactly: half the sum of the larger probability.
  function bayesAccuracy(ma, mb, r, d) {
    var A = weightDistribution(ma, r, d), B = weightDistribution(mb, r, d), keys = {}, s = 0;
    Object.keys(A).forEach(function (k) { keys[k] = 1; }); Object.keys(B).forEach(function (k) { keys[k] = 1; });
    Object.keys(keys).forEach(function (k) { s += Math.max(A[k] || 0, B[k] || 0); });
    return s / 2;
  }
  // The same bound when the attacker sees each sub-network's weight count
  // separately (for example, by splitting the trace where one ends).
  function bayesAccuracySplit(ma, mb, r, d) {
    function single(m) { var o = {}, n = m - 1; for (var a = 2; a <= m; a++) for (var b = 2; b <= m; b++) { var w = weights(a, b, d); o[w] = (o[w] || 0) + 1 / (n * n); } return o; }
    // Sub-networks are independent, so the likelihood ratio is a product and
    // the bound follows from the joint distribution over r-tuples.
    var A = single(ma), B = single(mb), keys = {};
    Object.keys(A).forEach(function (k) { keys[k] = 1; }); Object.keys(B).forEach(function (k) { keys[k] = 1; });
    var ks = Object.keys(keys);
    var joint = [[1, 1]];
    for (var i = 0; i < r; i++) {
      var next = [];
      joint.forEach(function (p) { ks.forEach(function (k) { next.push([p[0] * (A[k] || 0), p[1] * (B[k] || 0)]); }); });
      joint = next;
    }
    var s = 0; joint.forEach(function (p) { s += Math.max(p[0], p[1]); });
    return s / 2;
  }

  /* ------------------------------------------------------------ simulated power */

  // Operation classes, clock cycles, and base power per cycle (arbitrary
  // units), as in the lab's stealing-ml-parameters page.
  var OPS = {
    ld:  { cycles: 2,  base: 0.30, name: "load" },
    st:  { cycles: 2,  base: 0.33, name: "store" },
    add: { cycles: 6,  base: 0.46, name: "add" },
    mul: { cycles: 8,  base: 0.62, name: "multiply" },
    div: { cycles: 16, base: 0.55, name: "divide" },
    exp: { cycles: 30, base: 0.52, name: "exponential" }
  };
  var OP_ORDER = ["ld", "st", "add", "mul", "div", "exp"];
  var IDLE = 0.22, HW_GAIN = 0.012;
  var f32 = new Float32Array(1), u32 = new Uint32Array(f32.buffer), fr = Math.fround;
  function hw32(v) {
    f32[0] = v;
    var x = u32[0];
    x = x - ((x >>> 1) & 0x55555555);
    x = (x & 0x33333333) + ((x >>> 2) & 0x33333333);
    return (Math.imul((x + (x >>> 4)) & 0x0F0F0F0F, 0x01010101) >>> 24);
  }

  // The scope: averages four cycles per sample, 5,000 samples per capture,
  // with cycle noise, measurement noise, a random start offset, and small
  // gain and baseline drift between captures.
  var DEFAULTS = { len: 5000, decim: 4, noise: 0.15, meas: 0.03, jitter: 200, gain: 0.02, offset: 0.01 };
  function scopeSink(opts, r) {
    var len = opts.len || 5000, D = opts.decim || 4, noise = opts.noise == null ? 0.15 : opts.noise,
        meas = opts.meas == null ? 0.03 : opts.meas;
    var out = new Float32Array(len), n = 0, acc = 0, cnt = 0, marks = [];
    var skip = opts.jitter ? r.int(opts.jitter + 1) : 0;
    var gain = 1 + (opts.gain ? opts.gain * r.gauss() : 0);
    var shift = opts.offset ? opts.offset * r.gauss() : 0;
    var cyc = 0;
    function push(p) {
      if (skip > 0) { skip--; return; }
      acc += p + (noise ? noise * r.gauss() : 0); cnt++; cyc++;
      if (cnt === D) { out[n++] = gain * (acc / D) + shift + (meas ? meas * r.gauss() : 0); acc = 0; cnt = 0; }
    }
    return {
      full: false,
      mark: function (label) { marks.push({ sample: n, label: label }); },
      op: function (t, v) {
        if (this.full) return;
        var o = OPS[t], p = o.base + HW_GAIN * hw32(v);
        for (var c = 0; c < o.cycles; c++) { push(c === 0 ? p + 0.04 : p); if (n >= len) { this.full = true; return; } }
      },
      finish: function () { var end = n; while (n < len) push(IDLE); return { trace: out, marks: marks, end: end }; }
    };
  }
  function countSink() {
    var counts = {}, cycles = 0;
    OP_ORDER.forEach(function (t) { counts[t] = 0; });
    return { full: false, mark: function () {}, op: function (t) { counts[t]++; cycles += OPS[t].cycles; }, result: function () { return { counts: counts, cycles: cycles }; } };
  }

  // One instrumented training step of a sigmoid network on one row, in
  // single precision, reporting every operation to the sink.
  function stepOps(net, x, t, sink) {
    var j, k, s, p, v, lr = fr(LR);
    function act(sum) { v = fr(Math.exp(-sum)); sink.op("exp", v); v = fr(1 + v); sink.op("add", v); v = fr(1 / v); sink.op("div", v); sink.op("st", v); return v; }
    var a1 = new Array(net.z1), a2 = new Array(net.z2);
    for (j = 0; j < net.z1; j++) {
      s = fr(BIAS); sink.op("ld", s);
      for (k = 0; k < net.d; k++) { sink.op("ld", x[k]); p = fr(net.W0[j][k] * x[k]); sink.op("mul", p); s = fr(s + p); sink.op("add", s); }
      a1[j] = act(s);
    }
    for (j = 0; j < net.z2; j++) {
      s = fr(BIAS); sink.op("ld", s);
      for (k = 0; k < net.z1; k++) { sink.op("ld", a1[k]); p = fr(net.W1[j][k] * a1[k]); sink.op("mul", p); s = fr(s + p); sink.op("add", s); }
      a2[j] = act(s);
    }
    s = 0;
    for (k = 0; k < net.z2; k++) { sink.op("ld", a2[k]); p = fr(net.W2[k] * a2[k]); sink.op("mul", p); s = fr(s + p); sink.op("add", s); }
    var out = act(s);
    var dOut = fr(fr(2 * (out - t)) * fr(out * (1 - out))); sink.op("mul", dOut);
    var d2 = new Array(net.z2), d1 = new Array(net.z1);
    for (j = 0; j < net.z2; j++) { v = fr(dOut * net.W2[j]); sink.op("mul", v); d2[j] = fr(v * fr(a2[j] * fr(1 - a2[j]))); sink.op("add", fr(1 - a2[j])); sink.op("mul", d2[j]); }
    for (j = 0; j < net.z1; j++) {
      s = 0;
      for (k = 0; k < net.z2; k++) { p = fr(d2[k] * net.W1[k][j]); sink.op("mul", p); s = fr(s + p); sink.op("add", s); }
      d1[j] = fr(s * fr(a1[j] * fr(1 - a1[j]))); sink.op("add", fr(1 - a1[j])); sink.op("mul", d1[j]);
    }
    function upd(W, i, g) { p = fr(lr * g); sink.op("mul", g); sink.op("mul", p); W[i] = fr(W[i] - p); sink.op("add", W[i]); sink.op("st", W[i]); }
    for (j = 0; j < net.z2; j++) upd(net.W2, j, fr(dOut * a2[j]));
    for (k = 0; k < net.z2; k++) for (j = 0; j < net.z1; j++) upd(net.W1[k], j, fr(d2[k] * a1[j]));
    for (k = 0; k < net.z1; k++) for (j = 0; j < net.d; j++) upd(net.W0[k], j, fr(d1[k] * x[j]));
  }

  // One capture: a single training step on one random training row for the
  // traditional network, or for every TP-NET sub-network in a fresh random
  // order. Each capture starts from fresh random weights and a fresh row.
  function runCapture(spec, seed, sink) {
    var D = dataset(), r = rng(seed * 104729 + 7);
    var row = r.int(D.nTrain), x = D.Xs[row], t = D.y[row];
    // A spec with structure "fresh" draws new random widths for every
    // capture (Algorithm 1 run again each time).
    var subs = spec.kind === "trad" ? [[spec.m, spec.m]] : spec.structure === "fresh" ? construct(spec.m, spec.r || 2, r) : spec.structure;
    var A = spec.kind === "trad" ? [0] : order(subs.length, r);
    var info = [];
    A.forEach(function (i) {
      var net = netCreate(subs[i][0], subs[i][1], D.d, r);
      sink.mark("N" + (i + 1) + " (" + subs[i][0] + ", " + subs[i][1] + ")");
      stepOps(net, x, t, sink);
      info.push(i);
    });
    return { order: info, row: row, structure: subs };
  }
  function trace(spec, seed, opts) {
    opts = opts || DEFAULTS;
    var r = rng(seed * 2654435761 + 99), sink = scopeSink(opts, r);
    var cap = runCapture(spec, seed, sink), res = sink.finish();
    res.order = cap.order; res.structure = cap.structure;
    return res;
  }
  function opCounts(spec) {
    var sink = countSink();
    runCapture(spec, 1, sink);
    return sink.result();
  }

  /* ------------------------------------------------------------ the attack */

  function reduce(tr, n) {
    var L = tr.length;
    if (n >= L) return Float32Array.from(tr);
    var out = new Float32Array(n);
    for (var i = 0; i < n; i++) {
      var a = Math.floor(i * L / n), b = Math.floor((i + 1) * L / n), s = 0;
      for (var j = a; j < b; j++) s += tr[j];
      out[i] = s / (b - a);
    }
    return out;
  }
  function euclid2(a, b) { var s = 0; for (var i = 0; i < a.length; i++) { var d = a[i] - b[i]; s += d * d; } return s; }
  // Distances from one unlabeled trace to every labeled trace, then the k
  // nearest; uniform votes, and a tie between the two classes goes to class 0
  // (scikit-learn's behavior).
  function knnVote(dists, labels, k) {
    var idx = [];
    for (var i = 0; i < dists.length; i++) {
      if (idx.length < k || dists[i] < dists[idx[idx.length - 1]]) {
        var pos = idx.length;
        while (pos > 0 && dists[idx[pos - 1]] > dists[i]) pos--;
        idx.splice(pos, 0, i);
        if (idx.length > k) idx.pop();
      }
    }
    var v = [0, 0]; idx.forEach(function (j) { v[labels[j]]++; });
    return v[1] > v[0] ? 1 : 0;
  }

  // Section V-C protocol for one pair of widths (ma against mb, labels 0 and
  // 1). Traditional: `labeled` captures of each network as training data and
  // `unlabeled` captures of each as test data. TP-NET: `labeled` captures of
  // each of structures 1 to 5 for each width, and `unlabeled` captures of the
  // test structure (6 or 7) for each width. "fresh" (the page's addition):
  // every capture, labeled or not, draws new random structures, so the
  // labeled set holds 5 x `labeled` captures per width, like TP-NET's.
  function specsFor(model, m, which) {
    if (model === "trad") return [{ kind: "trad", m: m }];
    if (model === "fresh") return [{ kind: "tp", m: m, structure: "fresh", index: which === "labeled" ? 0 : 9 }];
    if (which === "labeled") return [0, 1, 2, 3, 4].map(function (i) { return { kind: "tp", m: m, structure: TABLE3[m][i], index: i + 1 }; });
    return [{ kind: "tp", m: m, structure: TABLE3[m][which - 1], index: which }];
  }
  function buildSet(model, ma, mb, which, per, seed, dims, opts, progress) {
    var X = [], y = [], done = 0, total = 0;
    [ma, mb].forEach(function (m) { total += specsFor(model, m, which).length * per; });
    [ma, mb].forEach(function (m, label) {
      specsFor(model, m, which).forEach(function (spec, si) {
        for (var i = 0; i < per; i++) {
          var s = seed * 1000003 + m * 100003 + (spec.index || 0) * 10007 + (which === "labeled" ? 0 : 500009) + i;
          X.push(reduce(trace(spec, s, opts).trace, dims)); y.push(label);
          done++;
          if (progress && done % 20 === 0) progress(done, total);
        }
      });
    });
    return { X: X, y: y };
  }
  function attack(cfg, progress) {
    var opts = cfg.opts || DEFAULTS, dims = cfg.dims || 5000, ks = cfg.ks || [3, 6];
    var L = buildSet(cfg.model, cfg.ma, cfg.mb, "labeled", cfg.model === "fresh" ? cfg.labeled * 5 : cfg.labeled, cfg.seed || 1, dims, opts, progress && function (d, t) { progress("labeled", d, t); });
    var U = buildSet(cfg.model, cfg.ma, cfg.mb, cfg.model === "tp" ? cfg.test : "unlabeled", cfg.unlabeled, cfg.seed || 1, dims, opts, progress && function (d, t) { progress("unlabeled", d, t); });
    var correct = ks.map(function () { return 0; }), conf = ks.map(function () { return [[0, 0], [0, 0]]; });
    var dists = new Float64Array(L.X.length);
    for (var u = 0; u < U.X.length; u++) {
      for (var i = 0; i < L.X.length; i++) dists[i] = euclid2(U.X[u], L.X[i]);
      ks.forEach(function (k, ki) { var p = knnVote(dists, L.y, k); conf[ki][U.y[u]][p]++; if (p === U.y[u]) correct[ki]++; });
      if (progress && (u % 10 === 9 || u === U.X.length - 1)) progress("classify", u + 1, U.X.length);
    }
    return { ks: ks, accuracy: correct.map(function (c) { return c / U.X.length; }), correct: correct, nTest: U.X.length, nTrain: L.X.length, confusion: conf };
  }

  var api = {
    rng: rng, setData: setData, dataset: dataset,
    TABLE3: TABLE3, TABLE4: TABLE4, TABLE_INF: TABLE_INF, relChange: relChange,
    BIAS: BIAS, LR: LR, netCreate: netCreate, forward: forward, step: step,
    trainTraditional: trainTraditional, trainTPNet: trainTPNet, construct: construct, order: order,
    eqCounts: eqCounts, weights: weights, structWeights: structWeights,
    weightDistribution: weightDistribution, bayesAccuracy: bayesAccuracy, bayesAccuracySplit: bayesAccuracySplit,
    OPS: OPS, OP_ORDER: OP_ORDER, IDLE: IDLE, HW_GAIN: HW_GAIN, DEFAULTS: DEFAULTS, hw32: hw32,
    trace: trace, opCounts: opCounts, reduce: reduce, euclid2: euclid2, knnVote: knnVote,
    specsFor: specsFor, buildSet: buildSet, attack: attack
  };
  root.TPNet = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof self !== "undefined" ? self : this);

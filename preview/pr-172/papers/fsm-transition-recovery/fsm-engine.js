/*
  Transition recovery attack: browser engine for
  /papers/fsm-transition-recovery/.

  Carper, Robins, and Borowczak, "Transition Recovery Attack on Embedded
  State Machines Using Power Analysis," IEEE ICCD 2022, pp. 572-576.

  Three parts, all deterministic for a given seed:
    1. The target program (paper Fig. 1): an 8-bit "oracle" byte drives a
       two-state machine. At each of eight steps the least significant bit
       picks the next state (0: state one, a fast inverse square root;
       1: state two, a putch() that sends a character), and the byte is
       shifted right by one.
    2. A simulated power trace of that program on a small microcontroller.
       The paper's ChipWhisperer-Nano traces are not public, so this page
       models them: each instruction block costs a fixed number of clock
       cycles, each cycle draws a base power for its block plus a term for
       the set bits of the data it handles, the scope averages cycles into
       samples and smooths them, and every capture adds noise and a small
       trigger offset. Everything from this part is labeled simulated.
    3. The attack: k-nearest-neighbor classification of traces (Euclidean
       distance, uniform votes, ties to the lowest label, as scikit-learn's
       KNeighborsClassifier does), with 80 percent of each oracle's traces
       used to train and 20 percent held out.

  Loads as a page script (window.FsmTR) and inside a Web Worker.
*/
(function (root) {
  "use strict";

  /* ------------------------------------------------------------ random numbers */

  // mulberry32 with a Box-Muller normal; the page's own generator.
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
      var u = 0, v;
      while (u === 0) u = f();
      v = f();
      var r = Math.sqrt(-2 * Math.log(u));
      spare = r * Math.sin(2 * Math.PI * v);
      return r * Math.cos(2 * Math.PI * v);
    };
    f.int = function (n) { return Math.floor(f() * n); };
    return f;
  }
  function popcount(x) { x = x >>> 0; var c = 0; while (x) { c += x & 1; x >>>= 1; } return c; }

  /* ------------------------------------------------------------ the target program */

  // The state each of the eight steps runs: bit i of the oracle (LSB first).
  // 1 = state one (fast inverse square root), 2 = state two (putch).
  function states(oracle) {
    var out = [];
    for (var i = 0; i < 8; i++) out.push(((oracle >>> i) & 1) ? 2 : 1);
    return out;
  }

  // Instruction blocks. cycles: clock cycles; base: power drawn per cycle
  // (arbitrary units); wiggle: a fixed per-cycle pattern of this amplitude,
  // drawn once from the block's own seed, standing in for the instruction mix
  // inside a library routine. All values are the page's choices.
  var BLOCKS = {
    dispatch: { cycles: 14, base: 0.42, wiggle: 0.08, seed: 11, label: "Read the bit, shift, branch" },
    fmulA:    { cycles: 46, base: 0.95, wiggle: 0.22, seed: 21, label: "Soft-float multiply (x · 0.5)" },
    hack:     { cycles: 6,  base: 0.70, wiggle: 0.05, seed: 22, label: "Bit trick (0x5f3759df − i/2)" },
    fmulB:    { cycles: 46, base: 0.95, wiggle: 0.22, seed: 23, label: "Soft-float multiply (y · y)" },
    fmulC:    { cycles: 46, base: 0.95, wiggle: 0.22, seed: 24, label: "Soft-float multiply (x2 · y²)" },
    fsub:     { cycles: 38, base: 0.88, wiggle: 0.20, seed: 25, label: "Soft-float subtract (1.5 − …)" },
    fmulD:    { cycles: 46, base: 0.95, wiggle: 0.22, seed: 26, label: "Soft-float multiply (y · …)" },
    uartw:    { cycles: 8,  base: 1.15, wiggle: 0.10, seed: 31, label: "Write the character to the UART" },
    poll:     { cycles: 232, base: 0.55, wiggle: 0.0, period: 5, ripple: 0.12, seed: 32, label: "Wait for the UART to finish" },
    idle:     { cycles: 1,  base: 0.30, wiggle: 0.0, seed: 41, label: "Done; idle" }
  };
  var STATE_BLOCKS = {
    1: ["fmulA", "hack", "fmulB", "fmulC", "fsub", "fmulD"],
    2: ["uartw", "poll"]
  };
  // "Same work" variant (not in the paper): every step runs both routines, so
  // the two states take the same time and draw the same power except for the
  // data they handle.
  var BALANCED_BLOCKS = ["fmulA", "hack", "fmulB", "fmulC", "fsub", "fmulD", "uartw", "poll"];

  var patterns = {};
  function pattern(name) {
    if (patterns[name]) return patterns[name];
    var B = BLOCKS[name], r = rng(B.seed * 7919), p = new Float64Array(B.cycles);
    for (var i = 0; i < B.cycles; i++) {
      var v = B.base + B.wiggle * (2 * r() - 1);
      if (B.period) v += B.ripple * ((i % B.period) === 0 ? 1 : (i % B.period) === 1 ? 0.4 : -0.35);
      p[i] = v;
    }
    patterns[name] = p;
    return p;
  }

  // Simulation settings (the page's own; the paper reports none of these).
  //   cps: clock cycles averaged into one scope sample
  //   len: samples per capture (the capture window)
  //   hw: extra power per set bit of the shifted oracle register
  //   noise: standard deviation of the per-sample measurement noise
  //   jitter: trigger offset, 0 to jitter cycles, drawn per capture
  //   gain: standard deviation of the per-capture gain drift
  //   avg: captures averaged into one trace (the paper averages three)
  var DEFAULTS = { cps: 4, len: 560, hw: 0.035, noise: 1.0, jitter: 6, gain: 0.02, avg: 3, balanced: false };
  function opt(o) {
    var out = {}, k;
    for (k in DEFAULTS) out[k] = DEFAULTS[k];
    if (o) for (k in o) if (o[k] !== undefined) out[k] = o[k];
    return out;
  }

  // The noiseless cycle-by-cycle program for one oracle: power per cycle and,
  // for drawing, which step and state each cycle belongs to.
  var progCache = {};
  function program(oracle, o) {
    o = opt(o);
    var key = oracle + "|" + o.hw + "|" + (o.balanced ? 1 : 0);
    if (progCache[key]) return progCache[key];
    var power = [], step = [], st = [], blocks = [], seq = states(oracle), reg = oracle;
    for (var s = 0; s < 8; s++) {
      var names = ["dispatch"].concat(o.balanced ? BALANCED_BLOCKS : STATE_BLOCKS[seq[s]]);
      names.forEach(function (n) {
        var p = pattern(n), start = power.length;
        // The dispatch block handles the oracle register, so it leaks its set bits.
        var extra = n === "dispatch" ? o.hw * popcount(reg) : 0;
        for (var i = 0; i < p.length; i++) { power.push(p[i] + extra); step.push(s); st.push(seq[s]); }
        blocks.push({ name: n, step: s, state: seq[s], start: start, end: power.length });
      });
      reg = reg >>> 1;
    }
    var prog = { oracle: oracle, power: power, step: step, state: st, blocks: blocks, cycles: power.length, seq: seq };
    progCache[key] = prog;
    return prog;
  }

  // One simulated capture: shift by the trigger offset, pad with idle power,
  // apply gain, average cycles into samples, smooth (first-order, standing in
  // for the probe's bandwidth), then add measurement noise.
  function capture(oracle, r, o) {
    o = opt(o);
    var prog = program(oracle, o), P = prog.power, idle = BLOCKS.idle.base;
    var off = o.jitter ? r.int(o.jitter + 1) : 0, g = 1 + o.gain * r.gauss();
    var out = new Float64Array(o.len), y = idle;
    for (var t = 0; t < o.len; t++) {
      var s = 0;
      for (var c = 0; c < o.cps; c++) {
        var idx = t * o.cps + c - off;
        s += (idx >= 0 && idx < P.length) ? P[idx] : idle;
      }
      var x = g * s / o.cps;
      y = 0.6 * y + 0.4 * x;
      out[t] = y + o.noise * r.gauss();
    }
    return out;
  }
  // One trace as the paper uses it: the element-wise mean of o.avg captures.
  function trace(oracle, seed, o) {
    o = opt(o);
    var r = rng(seed), acc = new Float64Array(o.len);
    for (var a = 0; a < o.avg; a++) {
      var c = capture(oracle, r, o);
      for (var t = 0; t < o.len; t++) acc[t] += c[t];
    }
    for (t = 0; t < o.len; t++) acc[t] /= o.avg;
    return acc;
  }
  // The noiseless trace (what infinite averaging would converge to, with no
  // trigger offset), for drawing.
  function cleanTrace(oracle, o) {
    var q = opt(o); q.noise = 0; q.jitter = 0; q.gain = 0; q.avg = 1;
    return trace(oracle, 1, q);
  }
  // Sample index at which each step starts (no trigger offset), for drawing.
  function stepStarts(oracle, o) {
    o = opt(o);
    var prog = program(oracle, o), out = [], last = -1;
    prog.blocks.forEach(function (b) { if (b.step !== last) { out.push(b.start / o.cps); last = b.step; } });
    out.push(prog.cycles / o.cps);
    return out;
  }

  /* ------------------------------------------------------------ the data set */

  // perOracle traces of each oracle value 0 .. nClasses-1. The paper's second
  // experiment uses the first 2, 4, ..., 256 oracle values, so the classes
  // differ only in their low bits. Seeds depend on the oracle and the trace
  // index, so a subset reuses exactly the traces of the full set.
  function traceSeed(oracle, i, seed) { return (1 + i + 1000 * oracle + 7919 * seed) >>> 0; }
  function build(nClasses, perOracle, seed, o) {
    o = opt(o);
    var X = [], y = [];
    for (var c = 0; c < nClasses; c++)
      for (var i = 0; i < perOracle; i++) { X.push(trace(c, traceSeed(c, i, seed), o)); y.push(c); }
    return { X: X, y: y, len: o.len, nClasses: nClasses, perOracle: perOracle };
  }
  // 80/20 split within each oracle: a seeded shuffle of that oracle's traces,
  // the first ceil(20%) held out. Gives the same held-out count per class.
  function split(data, seed) {
    var train = [], test = [], r = rng(seed * 31 + 5), per = data.perOracle, nTest = Math.ceil(per * 0.2);
    for (var c = 0; c < data.nClasses; c++) {
      var idx = [];
      for (var i = 0; i < per; i++) idx.push(c * per + i);
      for (i = per - 1; i > 0; i--) { var j = r.int(i + 1), t = idx[i]; idx[i] = idx[j]; idx[j] = t; }
      for (i = 0; i < per; i++) (i < nTest ? test : train).push(idx[i]);
    }
    return { train: train, test: test };
  }

  /* ------------------------------------------------------------ the attack */

  function dist2(a, b) { var s = 0; for (var i = 0; i < a.length; i++) { var d = a[i] - b[i]; s += d * d; } return s; }

  // Indices of the kMax smallest values of d (ascending; ties by index),
  // by a bounded insertion list (kMax is small next to the training set).
  function nearest(d, kMax) {
    var n = d.length, k = Math.min(kMax, n), ids = new Int32Array(k), vals = new Float64Array(k), m = 0;
    for (var i = 0; i < n; i++) {
      var v = d[i];
      if (m < k) { var p = m++; while (p > 0 && vals[p - 1] > v) { vals[p] = vals[p - 1]; ids[p] = ids[p - 1]; p--; } vals[p] = v; ids[p] = i; }
      else if (v < vals[k - 1]) { p = k - 1; while (p > 0 && vals[p - 1] > v) { vals[p] = vals[p - 1]; ids[p] = ids[p - 1]; p--; } vals[p] = v; ids[p] = i; }
    }
    return ids;
  }

  // Classify every held-out trace for every k from 1 to kMax at once.
  // A uniform vote among the k nearest training traces; a tie goes to the
  // lowest oracle value (scikit-learn's behavior). Returns per-k correct
  // counts, predictions for the requested ks, and, for every k, how many
  // held-out traces had each step's state wrong.
  function attack(data, sp, kMax, keepKs, progress) {
    var trX = sp.train.map(function (i) { return data.X[i]; }), trY = sp.train.map(function (i) { return data.y[i]; });
    kMax = Math.min(kMax, trX.length);
    var C = data.nClasses, nT = sp.test.length, correct = new Int32Array(kMax + 1);
    var keep = {}; (keepKs || []).forEach(function (k) { if (k <= kMax) keep[k] = new Int32Array(nT); });
    var bitErr = new Int32Array((kMax + 1) * 8);   // bitErr[k * 8 + b]: wrong step b at this k
    var d = new Float64Array(trX.length), counts = new Int32Array(C);
    for (var t = 0; t < nT; t++) {
      var x = data.X[sp.test[t]], truth = data.y[sp.test[t]];
      for (var i = 0; i < trX.length; i++) d[i] = dist2(x, trX[i]);
      var ids = nearest(d, kMax);
      counts.fill(0);
      var best = -1, bestN = 0;
      for (var k = 1; k <= kMax; k++) {
        var l = trY[ids[k - 1]], n = ++counts[l];
        if (n > bestN || (n === bestN && l < best)) { best = l; bestN = n; }
        if (best === truth) correct[k]++;
        if (keep[k]) keep[k][t] = best;
        var diff = best ^ truth;
        if (diff) for (var b = 0; b < 8; b++) if ((diff >>> b) & 1) bitErr[k * 8 + b]++;
      }
      if (progress) progress(t + 1, nT);
    }
    var acc = [];
    for (k = 1; k <= kMax; k++) acc.push(correct[k] / nT);
    var bits = [];
    for (k = 1; k <= kMax; k++) bits.push(Array.prototype.slice.call(bitErr, k * 8, k * 8 + 8));
    return { kMax: kMax, nTest: nT, nTrain: trX.length, correct: Array.prototype.slice.call(correct, 1), accuracy: acc, predictions: keep, bitErrors: bits };
  }

  // Best k and its accuracy from an accuracy-by-k array (first maximum).
  function bestK(acc) {
    var b = 0;
    for (var i = 1; i < acc.length; i++) if (acc[i] > acc[b]) b = i;
    return { k: b + 1, accuracy: acc[b] };
  }

  /* ------------------------------------------------------------ what the paper reports */

  // Experiment 1 (256 oracle values), Section IV-A, accuracy by k.
  var PAPER_K = [
    { k: 11, acc: 0.6758 }, { k: 111, acc: 0.8102 }, { k: 121, acc: 0.7873 },
    { k: 171, acc: 0.8012 }, { k: 501, acc: 0.4006 }
  ];
  // Experiment 2 (first N oracle values), Section IV-B.
  var PAPER_CLASSES = [
    { n: 2, text: "100% for every k" },
    { n: 4, text: "87.5% to 97.5%; 97.5% for every k ≥ 15" },
    { n: 8, text: "peak 87.5% at k = 21 and 23" },
    { n: 256, text: "best 72.52% in this experiment's k range" }
  ];
  var PAPER = { capturesPerOracle: 200, averaged: 3, split: [0.8, 0.2], bestAll: 0.8102, bestK: 111 };

  var api = {
    rng: rng, popcount: popcount, states: states, BLOCKS: BLOCKS, STATE_BLOCKS: STATE_BLOCKS,
    DEFAULTS: DEFAULTS, opt: opt, program: program, capture: capture, trace: trace,
    cleanTrace: cleanTrace, stepStarts: stepStarts, traceSeed: traceSeed, build: build, split: split,
    dist2: dist2, nearest: nearest, attack: attack, bestK: bestK,
    PAPER_K: PAPER_K, PAPER_CLASSES: PAPER_CLASSES, PAPER: PAPER
  };
  root.FsmTR = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof self !== "undefined" ? self : this);

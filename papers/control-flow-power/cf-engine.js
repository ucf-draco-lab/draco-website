/*
  Control flow from power: browser engine for /papers/control-flow-power/.

  Robins, Olguin, Brown, Carper, and Borowczak, "Power-Based Side-Channel
  Attacks on Program Control Flow with Machine Learning Models," Journal of
  Cybersecurity and Privacy 3(3):351-363, 2023. doi:10.3390/jcp3030018

  Three parts, all deterministic for a given seed:
    1. The target program (paper Section 3.1, Figs. 1 to 3): an 8-bit oracle
       steers a two-state machine through eight steps. Bit i of the oracle
       (least significant first) picks the state of step i: 0 is state one,
       1 is state two; a repeated bit stays in the same state and repeats its
       code (Fig. 1). Both states run the same body, total = *x + *y, w times,
       on operands of equal Hamming weight: one_zero = 0xFFFF0000
       (4,294,901,760) and zero_one = 0x0000FFFF (65,535).
    2. A simulated power trace of that program on a small microcontroller.
       The paper's code and traces could not be reached from this page's
       build, so the page models them. Each instruction block costs a fixed
       number of clock cycles (the page's choices, informed by Cortex-M0
       timings) and draws a base power per cycle plus a term for the set bits
       of the data it handles; the scope averages cycles into samples and
       smooths them; each capture adds noise, a trigger offset, and gain
       drift. Everything from this part is labeled simulated.
    3. The data set: oracle values, traces per value, and an 80/20 split
       within each value (the paper's proportions).

  The classifiers live in cf-ml.js. Loads as a page script (window.CfPower)
  and inside a Web Worker.
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

  var ONE_ZERO = 0xFFFF0000 >>> 0;   // 4,294,901,760: sixteen ones, then sixteen zeros
  var ZERO_ONE = 0x0000FFFF;         // 65,535: sixteen zeros, then sixteen ones
  var W_VALUES = [1, 2, 4, 8, 16, 32, 64, 128];

  // The state of each of the eight steps: bit i of the oracle, LSB first.
  function states(oracle) {
    var out = [];
    for (var i = 0; i < 8; i++) out.push(((oracle >>> i) & 1) ? 2 : 1);
    return out;
  }

  // Instruction blocks. cycles: clock cycles; base: power per cycle
  // (arbitrary units); wiggle: a fixed per-cycle pattern of this amplitude,
  // drawn once from the block's seed, standing in for the instruction mix;
  // hw: extra power per set bit of the data the block handles.
  // The branch blocks hold the only control-flow difference between the two
  // states: an if/else on the oracle bit, where one side takes a conditional
  // branch (three cycles on a Cortex-M0) and the other falls through and then
  // jumps over the else (one plus three cycles). All values are the page's
  // choices; the paper shows its code (Figs. 2 and 3) but not its timing.
  var BLOCKS = {
    dispatch: { cycles: 6, base: 0.46, wiggle: 0.06, seed: 11, label: "Load the oracle, test the low bit, shift" },
    br0:      { cycles: 3, base: 0.78, wiggle: 0.10, seed: 12, label: "Bit 0: branch to state one" },
    br1:      { cycles: 4, base: 0.70, wiggle: 0.10, seed: 13, label: "Bit 1: fall through, then jump to state two" },
    call:     { cycles: 6, base: 0.58, wiggle: 0.08, seed: 14, label: "Call the state's code and return" },
    add:      { cycles: 7, base: 0.66, wiggle: 0.12, seed: 21, label: "total = *x + *y (two loads, an add, a store)" },
    loop:     { cycles: 3, base: 0.40, wiggle: 0.04, seed: 31, label: "Next step" },
    idle:     { cycles: 1, base: 0.30, wiggle: 0.0,  seed: 41, label: "Done; idle" }
  };
  // Data each block handles, for the Hamming-weight term.
  //   dispatch: the shifted oracle register
  //   add: both operands and the sum; one_zero + zero_one = 0xFFFFFFFF, so the
  //        add block always handles 16 + 16 + 32 set bits, in either state.
  var ADD_HW = popcount(ONE_ZERO) + popcount(ZERO_ONE) + popcount((ONE_ZERO + ZERO_ONE) >>> 0);

  var patterns = {};
  function pattern(name) {
    if (patterns[name]) return patterns[name];
    var B = BLOCKS[name], r = rng(B.seed * 7919), p = new Float64Array(B.cycles);
    for (var i = 0; i < B.cycles; i++) p[i] = B.base + B.wiggle * (2 * r() - 1);
    patterns[name] = p;
    return p;
  }

  // Simulation settings (the page's own; the paper reports none of these).
  //   cps: clock cycles averaged into one scope sample
  //   hw: extra power per set bit of the oracle register (dispatch block)
  //   dataHw: extra power per set bit handled by the add block
  //   noise: standard deviation of the per-sample measurement noise
  //   jitter: trigger offset, 0 to jitter cycles, drawn per capture
  //   gain: standard deviation of the per-capture gain drift
  //   pad: idle samples after the program ends
  //   scale: scope gain from model power units to trace units
  // The scope samples in step with the target's clock (jitter 0), as a
  // ChipWhisperer capture does; a nonzero jitter is available for experiments.
  var DEFAULTS = { cps: 4, hw: 0.03, dataHw: 0.002, noise: 0.006, jitter: 0, gain: 0.002, pad: 4, scale: 10 };
  function opt(o) {
    var out = {}, k;
    for (k in DEFAULTS) out[k] = DEFAULTS[k];
    if (o) for (k in o) if (o[k] !== undefined) out[k] = o[k];
    return out;
  }

  // The noiseless cycle-by-cycle program for one oracle and one w: power per
  // cycle and, for drawing, the blocks with their step and state.
  var progCache = {};
  function program(oracle, w, o) {
    o = opt(o);
    var key = oracle + "|" + w + "|" + o.hw + "|" + o.dataHw;
    if (progCache[key]) return progCache[key];
    var power = [], blocks = [], seq = states(oracle), reg = oracle;
    function emit(name, step, extra) {
      var p = pattern(name), start = power.length;
      for (var i = 0; i < p.length; i++) power.push(p[i] + extra);
      var last = blocks[blocks.length - 1];
      if (last && last.name === name && last.step === step && name === "add") last.end = power.length, last.reps++;
      else blocks.push({ name: name, step: step, state: step < 0 ? 0 : seq[step], start: start, end: power.length, reps: 1 });
    }
    for (var s = 0; s < 8; s++) {
      emit("dispatch", s, o.hw * popcount(reg));
      emit(seq[s] === 2 ? "br1" : "br0", s, 0);
      emit("call", s, 0);
      for (var k = 0; k < w; k++) emit("add", s, o.dataHw * ADD_HW);
      emit("loop", s, 0);
      reg = reg >>> 1;
    }
    var prog = { oracle: oracle, w: w, power: power, blocks: blocks, cycles: power.length, seq: seq };
    progCache[key] = prog;
    return prog;
  }

  // Cycles of the program in each kind of code. "Control flow" is the
  // dispatch, the branch, the call, and the loop; "state work" is the adds.
  function workShare(oracle, w, o) {
    var prog = program(oracle, w, o), cf = 0, body = 0;
    prog.blocks.forEach(function (b) { if (b.name === "add") body += b.end - b.start; else cf += b.end - b.start; });
    return { control: cf, work: body, total: cf + body, shareWork: body / (cf + body) };
  }

  // Samples per trace for a given w: the longest program (oracle 255, every
  // step through the four-cycle branch) plus the largest trigger offset and
  // the idle pad, so every capture holds the whole program.
  function traceLen(w, o) {
    o = opt(o);
    var longest = program(255, w, o).cycles + o.jitter;
    return Math.ceil(longest / o.cps) + o.pad;
  }

  // One simulated capture: shift by the trigger offset, pad with idle power,
  // apply gain, average cycles into samples, smooth (first-order, standing in
  // for the probe's bandwidth), then add measurement noise.
  function capture(oracle, w, r, o, len) {
    o = opt(o);
    len = len || traceLen(w, o);
    var prog = program(oracle, w, o), P = prog.power, idle = BLOCKS.idle.base;
    var off = o.jitter ? r.int(o.jitter + 1) : 0, g = 1 + o.gain * r.gauss();
    var out = new Float32Array(len), y = idle;
    for (var t = 0; t < len; t++) {
      var s = 0;
      for (var c = 0; c < o.cps; c++) {
        var idx = t * o.cps + c - off;
        s += (idx >= 0 && idx < P.length) ? P[idx] : idle;
      }
      var x = g * s / o.cps;
      y = 0.6 * y + 0.4 * x;
      out[t] = o.scale * (y + o.noise * r.gauss());
    }
    return out;
  }
  function trace(oracle, w, seed, o, len) { return capture(oracle, w, rng(seed), o, len); }
  // The noiseless trace, for drawing.
  function cleanTrace(oracle, w, o) {
    var q = opt(o); q.noise = 0; q.jitter = 0; q.gain = 0;
    return capture(oracle, w, rng(1), q, traceLen(w, o));
  }

  /* ------------------------------------------------------------ the data set */

  // Which oracle values a run uses: all 256, or n of them spread evenly over
  // 0..255 (every 256/n-th value), so smaller runs still exercise all eight steps.
  function oracles(n) {
    var out = [], step = 256 / n;
    for (var i = 0; i < n; i++) out.push(Math.round(i * step));
    return out;
  }
  function traceSeed(oracle, i, w, seed) { return (1 + i + 1000 * oracle + 524287 * w + 7919 * seed) >>> 0; }
  // perOracle traces of each chosen oracle value. Labels are class indices
  // 0..n-1 in the order of oracles(n); data.values maps them back.
  function build(nValues, perOracle, w, seed, o, progress) {
    o = opt(o);
    var vals = oracles(nValues), len = traceLen(w, o), X = [], y = [];
    for (var c = 0; c < vals.length; c++) {
      for (var i = 0; i < perOracle; i++) { X.push(trace(vals[c], w, traceSeed(vals[c], i, w, seed), o, len)); y.push(c); }
      if (progress) progress(c + 1, vals.length);
    }
    return { X: X, y: y, len: len, nClasses: vals.length, values: vals, perOracle: perOracle, w: w };
  }
  // 80/20 split within each value: a seeded shuffle of that value's traces,
  // the first ceil(20%) held out.
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

  /* ------------------------------------------------------------ what the paper reports */

  // Values the text of Section 4 and the figure captions state. Fold accuracy
  // on 256 oracle values; null where the paper gives no number.
  var PAPER = {
    tracesPerOracle: 100, oracleValues: 256, folds: 5, split: [0.8, 0.2],
    gbPerFirmware: 5.8, gbTotalStated: 40,
    w: W_VALUES,
    points: [
      { w: 1,  clf: "knn", kind: "max",  acc: 0.0326, text: "maximum 3.26% (KNN)" },
      { w: 2,  clf: "rf",  kind: "all",  acc: 1.0,    text: "100% in all five folds" },
      { w: 8,  clf: "rf",  kind: "mean", acc: 1.0,    text: "100% average" },
      { w: 16, clf: "rf",  kind: "mean", acc: 0.9992, text: "99.92% average" },
      { w: 16, clf: "knn", kind: "mean", acc: 0.808,  text: "80.8% average" },
      { w: 16, clf: "knn", kind: "max",  acc: 0.814,  text: "81.4% maximum" }
    ],
    bounds: [
      { text: "Decision tree and logistic regression: 98% or more on average for firmware other than w = 1, including w = 16." },
      { text: "Every classifier other than random forest: 99% or more on average at w = 2." },
      { text: "KNN: slightly above 80% at its lowest for w of 2 or more." },
      { text: "w = 1: under 3% for all four classifiers (Fig. 7 caption); about 2% in the Fig. 5 caption." }
    ],
    abstract: { accuracy: 0.99, outside: 0.97 }
  };

  var api = {
    rng: rng, popcount: popcount, states: states, BLOCKS: BLOCKS, DEFAULTS: DEFAULTS, opt: opt,
    ONE_ZERO: ONE_ZERO, ZERO_ONE: ZERO_ONE, ADD_HW: ADD_HW, W_VALUES: W_VALUES,
    program: program, workShare: workShare, traceLen: traceLen, capture: capture, trace: trace,
    cleanTrace: cleanTrace, oracles: oracles, traceSeed: traceSeed, build: build, split: split,
    PAPER: PAPER
  };
  root.CfPower = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof self !== "undefined" ? self : this);

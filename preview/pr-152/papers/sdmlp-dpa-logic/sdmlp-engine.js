/*
  SDMLp engine for /papers/sdmlp-dpa-logic/.

  Ramakrishnan, Chakkaravarthy, Manchanda, Borowczak, and Vemuri,
  "SDMLp: On the Use of Complementary Pass Transistor Logic for Design of
  DPA Resistant Circuits," IEEE HOST 2012, pp. 31-36.

  What this file computes, all on the visitor's device:
    - the SDMLp cell of Fig. 2 at switch level (pre-discharge and evaluation),
      Eqs. (1) and (2), and the seven Table I configurations, checked on every
      input combination;
    - the DES S-boxes, expansion, and round function (FIPS 46-3), plus a full
      DES encryption used only to verify the tables;
    - reduced ordered binary decision diagrams (ROBDDs) of the S-boxes under
      any of the 720 variable orders, with and without the complementary-node
      step of Fig. 3, and the multiplexer netlist each one maps to;
    - a simulated first-order power analysis on DES S-box 1 (this page's own
      model; the paper's traces came from HSPICE simulation of 90 nm layouts).

  Loads as a page script (window.Sdmlp) and in Node (module.exports).
*/
(function (root) {
  "use strict";

  /* --------------------------------------------------------------- DES */
  // FIPS 46-3 S-boxes, rows 0-3, columns 0-15.
  var SBOX = [
    [14,4,13,1,2,15,11,8,3,10,6,12,5,9,0,7, 0,15,7,4,14,2,13,1,10,6,12,11,9,5,3,8,
     4,1,14,8,13,6,2,11,15,12,9,7,3,10,5,0, 15,12,8,2,4,9,1,7,5,11,3,14,10,0,6,13],
    [15,1,8,14,6,11,3,4,9,7,2,13,12,0,5,10, 3,13,4,7,15,2,8,14,12,0,1,10,6,9,11,5,
     0,14,7,11,10,4,13,1,5,8,12,6,9,3,2,15, 13,8,10,1,3,15,4,2,11,6,7,12,0,5,14,9],
    [10,0,9,14,6,3,15,5,1,13,12,7,11,4,2,8, 13,7,0,9,3,4,6,10,2,8,5,14,12,11,15,1,
     13,6,4,9,8,15,3,0,11,1,2,12,5,10,14,7, 1,10,13,0,6,9,8,7,4,15,14,3,11,5,2,12],
    [7,13,14,3,0,6,9,10,1,2,8,5,11,12,4,15, 13,8,11,5,6,15,0,3,4,7,2,12,1,10,14,9,
     10,6,9,0,12,11,7,13,15,1,3,14,5,2,8,4, 3,15,0,6,10,1,13,8,9,4,5,11,12,7,2,14],
    [2,12,4,1,7,10,11,6,8,5,3,15,13,0,14,9, 14,11,2,12,4,7,13,1,5,0,15,10,3,9,8,6,
     4,2,1,11,10,13,7,8,15,9,12,5,6,3,0,14, 11,8,12,7,1,14,2,13,6,15,0,9,10,4,5,3],
    [12,1,10,15,9,2,6,8,0,13,3,4,14,7,5,11, 10,15,4,2,7,12,9,5,6,1,13,14,0,11,3,8,
     9,14,15,5,2,8,12,3,7,0,4,10,1,13,11,6, 4,3,2,12,9,5,15,10,11,14,1,7,6,0,8,13],
    [4,11,2,14,15,0,8,13,3,12,9,7,5,10,6,1, 13,0,11,7,4,9,1,10,14,3,5,12,2,15,8,6,
     1,4,11,13,12,3,7,14,10,15,6,8,0,5,9,2, 6,11,13,8,1,4,10,7,9,5,0,15,14,2,3,12],
    [13,2,8,4,6,15,11,1,10,9,3,14,5,0,12,7, 1,15,13,8,10,3,7,4,12,5,6,11,0,14,9,2,
     7,11,4,1,9,12,14,2,0,6,10,13,15,3,5,8, 2,1,14,7,4,10,8,13,15,12,9,0,3,5,6,11]
  ];
  var IP = [58,50,42,34,26,18,10,2,60,52,44,36,28,20,12,4,62,54,46,38,30,22,14,6,64,56,48,40,32,24,16,8,
            57,49,41,33,25,17,9,1,59,51,43,35,27,19,11,3,61,53,45,37,29,21,13,5,63,55,47,39,31,23,15,7];
  var FP = [40,8,48,16,56,24,64,32,39,7,47,15,55,23,63,31,38,6,46,14,54,22,62,30,37,5,45,13,53,21,61,29,
            36,4,44,12,52,20,60,28,35,3,43,11,51,19,59,27,34,2,42,10,50,18,58,26,33,1,41,9,49,17,57,25];
  var E = [32,1,2,3,4,5,4,5,6,7,8,9,8,9,10,11,12,13,12,13,14,15,16,17,
           16,17,18,19,20,21,20,21,22,23,24,25,24,25,26,27,28,29,28,29,30,31,32,1];
  var P = [16,7,20,21,29,12,28,17,1,15,23,26,5,18,31,10,2,8,24,14,32,27,3,9,19,13,30,6,22,11,4,25];
  var PC1 = [57,49,41,33,25,17,9,1,58,50,42,34,26,18,10,2,59,51,43,35,27,19,11,3,60,52,44,36,
             63,55,47,39,31,23,15,7,62,54,46,38,30,22,14,6,61,53,45,37,29,21,13,5,28,20,12,4];
  var PC2 = [14,17,11,24,1,5,3,28,15,6,21,10,23,19,12,4,26,8,16,7,27,20,13,2,
             41,52,31,37,47,55,30,40,51,45,33,48,44,49,39,56,34,53,46,42,50,36,29,32];
  var SHIFTS = [1,1,2,2,2,2,2,2,1,2,2,2,2,2,2,1];

  // S-box lookup on a 6-bit input b1..b6 (b1 = most significant): row = b1 b6, column = b2..b5.
  function sbox(n, six) {
    var row = ((six >> 4) & 2) | (six & 1);
    var col = (six >> 1) & 15;
    return SBOX[n][row * 16 + col];
  }

  // Bit arrays (index 0 = bit 1 in FIPS numbering) for the verification-only full DES.
  function hexToBits(hex) {
    var bits = [];
    for (var i = 0; i < hex.length; i++) {
      var v = parseInt(hex[i], 16);
      for (var b = 3; b >= 0; b--) bits.push((v >> b) & 1);
    }
    return bits;
  }
  function bitsToHex(bits) {
    var s = "";
    for (var i = 0; i < bits.length; i += 4) s += ((bits[i] << 3) | (bits[i + 1] << 2) | (bits[i + 2] << 1) | bits[i + 3]).toString(16);
    return s.toUpperCase();
  }
  function permute(bits, table) { return table.map(function (p) { return bits[p - 1]; }); }
  function rotl(a, n) { return a.slice(n).concat(a.slice(0, n)); }
  function feistel(r, k) {
    var e = permute(r, E), out = [];
    for (var s = 0; s < 8; s++) {
      var six = 0;
      for (var j = 0; j < 6; j++) six = (six << 1) | (e[s * 6 + j] ^ k[s * 6 + j]);
      var v = sbox(s, six);
      for (var b = 3; b >= 0; b--) out.push((v >> b) & 1);
    }
    return permute(out, P);
  }
  function subkeys(keyHex) {
    var cd = permute(hexToBits(keyHex), PC1), c = cd.slice(0, 28), d = cd.slice(28), ks = [];
    for (var i = 0; i < 16; i++) { c = rotl(c, SHIFTS[i]); d = rotl(d, SHIFTS[i]); ks.push(permute(c.concat(d), PC2)); }
    return ks;
  }
  function desEncrypt(keyHex, ptHex) {
    var ks = subkeys(keyHex), b = permute(hexToBits(ptHex), IP), l = b.slice(0, 32), r = b.slice(32);
    for (var i = 0; i < 16; i++) {
      var f = feistel(r, ks[i]), nr = l.map(function (x, j) { return x ^ f[j]; });
      l = r; r = nr;
    }
    return bitsToHex(permute(r.concat(l), FP));
  }

  /* --------------------------------------------------- the SDMLp cell */
  // Fig. 2 at switch level. Inputs are 0/1. During pre-discharge S = Sbar = 0:
  // m3-m4 (and m9-m10) pull the internal nodes x and xbar to Vdd, and the
  // output inverters drive Out and Outbar to 0. During evaluation S and Sbar
  // are complementary and m1/m2 (m7/m8) pass Ip1 or Ip2 (their complements).
  function cell(ip1, ip2, s, sbar) {
    var pre = !s && !sbar;
    var x, xb;
    if (pre) { x = 1; xb = 1; }
    else if (s && sbar) { return { x: null, xb: null, out: null, outb: null, phase: "invalid" }; }
    else { x = s ? ip1 : ip2; xb = s ? 1 - ip1 : 1 - ip2; }
    return { x: x, xb: xb, out: 1 - x, outb: 1 - xb, phase: pre ? "pre-discharge" : "evaluate" };
  }
  // Eq. (1): Out = NOT(Ip1*S + Ip2*Sbar + S'*Sbar'); Eq. (2) with complemented data inputs.
  function eq1(ip1, ip2, s, sbar) { return 1 - ((ip1 & s) | (ip2 & sbar) | ((1 - s) & (1 - sbar))); }
  function eq2(ip1, ip2, s, sbar) { return 1 - (((1 - ip1) & s) | ((1 - ip2) & sbar) | ((1 - s) & (1 - sbar))); }

  // Table I. Each signal is a literal: "A", "A'", "B", "B'", or "S" (the select of the mux row).
  var TABLE1 = [
    { name: "AND",  ip1: "A'", ip2: "B'", s: "B", out: "A·B",       outb: "(A·B)'",       f: function (a, b) { return a & b; } },
    { name: "OR",   ip1: "B'", ip2: "A'", s: "B", out: "A+B",       outb: "(A+B)'",       f: function (a, b) { return a | b; } },
    { name: "XOR",  ip1: "A",  ip2: "A'", s: "B", out: "A·B'+A'·B", outb: "(A·B'+A'·B)'", f: function (a, b) { return a ^ b; } },
    { name: "MUX",  ip1: "B'", ip2: "A'", s: "S", out: "S'·A+S·B",  outb: "(S'·A+S·B)'",  f: function (a, b, s) { return s ? b : a; }, mux: true },
    { name: "A'·B", ip1: "A",  ip2: "B'", s: "B", out: "A'·B",      outb: "A+B'",         f: function (a, b) { return (1 - a) & b; } },
    { name: "A'+B", ip1: "B'", ip2: "A",  s: "B", out: "A'+B",      outb: "A·B'",         f: function (a, b) { return (1 - a) | b; } },
    { name: "BUF",  ip1: "A'", ip2: "A'", s: "A", out: "A",         outb: "A'",           f: function (a) { return a; } }
  ];
  function lit(name, v) {
    var base = name.charAt(0), val = v[base];
    return name.length > 1 ? 1 - val : val;
  }
  function evalRow(row, a, b, s) {
    var v = { A: a, B: b, S: s };
    var ip1 = lit(row.ip1, v), ip2 = lit(row.ip2, v), sel = lit(row.s, v);
    return cell(ip1, ip2, sel, 1 - sel);
  }
  // Exhaustive check of every row of Table I against the cell, Eq. (1), and Eq. (2).
  function verifyTable1() {
    var results = TABLE1.map(function (row) {
      var ok = true, cases = 0;
      for (var a = 0; a < 2; a++) for (var b = 0; b < 2; b++) for (var s = 0; s < (row.mux ? 2 : 1); s++) {
        var v = { A: a, B: b, S: s }, c = evalRow(row, a, b, s), want = row.f(a, b, s);
        var ip1 = lit(row.ip1, v), ip2 = lit(row.ip2, v), sel = lit(row.s, v);
        cases++;
        if (c.out !== want || c.outb !== 1 - want) ok = false;
        if (eq1(ip1, ip2, sel, 1 - sel) !== c.out || eq2(ip1, ip2, sel, 1 - sel) !== c.outb) ok = false;
        var p = cell(ip1, ip2, 0, 0);
        if (p.out !== 0 || p.outb !== 0) ok = false;
      }
      return { name: row.name, ok: ok, cases: cases };
    });
    return { rows: results, ok: results.every(function (r) { return r.ok; }) };
  }

  /* ------------------------------------------------------------ ROBDD */
  // A function of six inputs is a 64-entry truth table stored as a string of
  // '0'/'1' (index = input value, bit 5 = b1 ... bit 0 = b6). Variables are
  // numbered 0..5 for b1..b6.
  function sboxOutputs(n) {
    var outs = [];
    for (var o = 0; o < 4; o++) {
      var s = "";
      for (var x = 0; x < 64; x++) s += (sbox(n, x) >> (3 - o)) & 1;
      outs.push(s);
    }
    return outs; // outs[0] = most significant output bit
  }
  function flip(tt) { var s = ""; for (var i = 0; i < tt.length; i++) s += tt[i] === "1" ? "0" : "1"; return s; }
  function cofactor(tt, nvars, v, val) {
    // tt over nvars variables indexed by bits; variable v is bit (nvars-1-v) of the index.
    var bit = nvars - 1 - v, s = "";
    for (var i = 0; i < tt.length; i++) if (((i >> bit) & 1) === val) s += tt[i];
    return s;
  }

  // Build the shared ROBDD for a list of 64-entry truth tables under `order`
  // (an array of variable ids 0..5, top first). If `comp` is true, a function
  // and its complement share one node (Fig. 3: the dual-rail cell supplies the
  // complement on its Outbar rail). Returns nodes by level, edge lists, roots,
  // and counts.
  function buildBDD(tts, order, comp) {
    var nv = order.length;
    // Re-index each truth table so that order[0] is the top variable.
    function reorderTT(tt) {
      var s = "";
      for (var j = 0; j < 64; j++) {
        var x = 0;
        for (var k = 0; k < nv; k++) if ((j >> (nv - 1 - k)) & 1) x |= 1 << (5 - order[k]);
        s += tt[x];
      }
      return s;
    }
    var table = {};      // canonical key -> node id
    var nodes = [];      // {id, level, lo, hi, loNeg, hiNeg, fn, literal}
    function canon(tt) {
      if (!comp) return { key: tt, neg: false };
      if (tt.charAt(0) === "1") return { key: flip(tt), neg: true };
      return { key: tt, neg: false };
    }
    // Returns {node: id or "0"/"1", neg}
    function mk(tt, level) {
      if (tt.indexOf("1") < 0) return { node: "0", neg: false };
      if (tt.indexOf("0") < 0) return comp ? { node: "0", neg: true } : { node: "1", neg: false };
      // skip levels the function does not depend on
      var half = tt.length / 2, lo = tt.slice(0, half), hi = tt.slice(half);
      if (lo === hi) return mk(lo, level + 1);
      var c = canon(tt);
      if (table[c.key] != null) return { node: table[c.key], neg: c.neg };
      var t = c.key, h2 = t.length / 2;
      var L = mk(t.slice(0, h2), level + 1), H = mk(t.slice(h2), level + 1);
      var id = nodes.length;
      var literal = (L.node === "0" && H.node === "0" && L.neg !== H.neg) ||
                    (L.node === "0" && H.node === "1") || (L.node === "1" && H.node === "0");
      nodes.push({ id: id, level: level, v: order[level], lo: L.node, loNeg: L.neg, hi: H.node, hiNeg: H.neg, literal: literal, fn: t });
      table[c.key] = id;
      return { node: id, neg: c.neg };
    }
    var roots = tts.map(function (tt) { return mk(reorderTT(tt), 0); });
    var literals = nodes.filter(function (n) { return n.literal; }).length;
    return { order: order.slice(), comp: !!comp, nodes: nodes, roots: roots, size: nodes.length, cells: nodes.length - literals, literals: literals };
  }

  // Evaluate a BDD built by buildBDD on a 6-bit input; returns the output bits.
  function evalBDD(bdd, x) {
    function val(ref, neg) {
      var v;
      if (ref === "0") v = 0; else if (ref === "1") v = 1;
      else {
        var n = bdd.nodes[ref], bit = (x >> (5 - n.v)) & 1;
        v = bit ? val(n.hi, n.hiNeg) : val(n.lo, n.loNeg);
      }
      return neg ? 1 - v : v;
    }
    return bdd.roots.map(function (r) { return val(r.node, r.neg); });
  }
  // Value of every node's function (before any complement on the edge) for input x.
  function nodeValues(bdd, x) {
    var vals = new Array(bdd.nodes.length);
    for (var i = bdd.nodes.length - 1; i >= 0; i--) vals[i] = null;
    function get(ref, neg) {
      var v;
      if (ref === "0") v = 0; else if (ref === "1") v = 1;
      else {
        if (vals[ref] == null) {
          var n = bdd.nodes[ref], bit = (x >> (5 - n.v)) & 1;
          vals[ref] = bit ? get(n.hi, n.hiNeg) : get(n.lo, n.loNeg);
        }
        v = vals[ref];
      }
      return neg ? 1 - v : v;
    }
    for (var j = 0; j < bdd.nodes.length; j++) get(j, false);
    return vals;
  }

  function permutations(arr) {
    if (arr.length <= 1) return [arr.slice()];
    var out = [];
    arr.forEach(function (a, i) {
      var rest = arr.slice(0, i).concat(arr.slice(i + 1));
      permutations(rest).forEach(function (p) { out.push([a].concat(p)); });
    });
    return out;
  }
  var ORDERS = permutations([0, 1, 2, 3, 4, 5]);

  // Exhaustive search over all 720 orders for one S-box. Metric: "cells"
  // (multiplexer cells, literals excluded) or "size" (all BDD nodes).
  function bestOrder(tts, comp, metric) {
    metric = metric || "cells";
    var best = null, worst = null;
    ORDERS.forEach(function (o) {
      var b = buildBDD(tts, o, comp);
      if (!best || b[metric] < best[metric] || (b[metric] === best[metric] && b.size < best.size)) best = b;
      if (!worst || b[metric] > worst[metric]) worst = b;
    });
    return { best: best, worst: worst };
  }

  /* ---------------------------------------------------- PRNG and noise */
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
  function hw(v) { var c = 0; while (v) { c += v & 1; v >>= 1; } return c; }

  /* --------------------------------------------- simulated power model */
  // Netlist of one S-box: the shared, complement-reduced ROBDD under a fixed
  // order, one multiplexer per non-literal node. For each clock cycle the
  // model returns a switching count:
  //   SCMOS: the number of cell outputs that change value from the previous
  //          input (static logic switches only when a value changes);
  //   SDMLp: every cell pre-discharges and then raises exactly one of its two
  //          rails, so each cell contributes one rising edge; rail capacitance
  //          mismatch m (fraction) makes the true rail cost (1 + m*e_i) and the
  //          false rail (1 - m*e_i), with e_i drawn once per cell in [-1, 1].
  function netlist(n, order, comp) {
    var tts = sboxOutputs(n);
    var bdd = buildBDD(tts, order || [0, 1, 2, 3, 4, 5], comp !== false);
    var cellIdx = [];
    bdd.nodes.forEach(function (nd, i) { if (!nd.literal) cellIdx.push(i); });
    var vals = [];
    for (var x = 0; x < 64; x++) {
      var nvx = nodeValues(bdd, x);
      vals.push(cellIdx.map(function (i) { return nvx[i]; }));
    }
    return { sbox: n, bdd: bdd, cells: cellIdx.length, vals: vals };
  }
  function scmosToggles(net, a, b) {
    var va = net.vals[a], vb = net.vals[b], c = 0;
    for (var i = 0; i < va.length; i++) if (va[i] !== vb[i]) c++;
    return c;
  }
  function sdmlpCharge(net, x, eps) {
    var v = net.vals[x], c = 0;
    for (var i = 0; i < v.length; i++) c += 1 + (v[i] ? 1 : -1) * eps[i];
    return c;
  }

  // Simulated attack on S-box 1 of one DES round. The attacker knows the six
  // round-input bits x_t that meet the six subkey bits k; the device computes
  // S1(x_t XOR k). Prediction for guess g: Hamming distance between
  // consecutive S-box outputs, HD(S1(x_{t-1}^g), S1(x_t^g)) (a Hamming-distance
  // model in the spirit of the attack frameworks the paper cites), or with
  // model "hw" the Hamming weight of the current output, or with model
  // "profile" the device's own noise-free leakage for each input. Returns the
  // correlation of every guess at checkpoints, and the trace count from which
  // the true key ranks first for good.
  function attack(opts) {
    var style = opts.style || "scmos", key = opts.key == null ? 20 : opts.key;
    var N = opts.n || 5000, sigma = opts.sigma == null ? 1 : opts.sigma;
    var mismatch = opts.mismatch == null ? 0.02 : opts.mismatch;
    var model = opts.model === "hw" || opts.model === "profile" ? opts.model : "hd";
    var rng = mulberry32(opts.seed == null ? 1 : opts.seed);
    var net = opts.net || netlist(0);
    var eps = [];
    for (var i = 0; i < net.cells; i++) eps.push(2 * rng() - 1);
    var eps2 = eps.map(function (e) { return e * mismatch; });
    // "profile": an attacker who has characterized the device and knows the
    // noise-free leakage of every S-box input (a best case for the attacker).
    var profile = [];
    // (For static CMOS the noise-free leakage depends on the previous input as
    // well, so the profiled prediction there is the exact toggle count.)
    for (var pu = 0; pu < 64; pu++) profile.push(sdmlpCharge(net, pu, eps2));
    var sx = new Float64Array(64), sxx = new Float64Array(64), sxy = new Float64Array(64);
    var sy = 0, syy = 0, t = 0;
    var prevX = Math.floor(rng() * 64);
    var checkpoints = opts.checkpoints || [];
    var trace = [], series = [], revealed = null;
    function corrAll() {
      var r = new Float64Array(64);
      var vy = t * syy - sy * sy;
      for (var g = 0; g < 64; g++) {
        var vx = t * sxx[g] - sx[g] * sx[g];
        var d = Math.sqrt(vx * vy);
        r[g] = d > 0 ? (t * sxy[g] - sx[g] * sy) / d : 0;
      }
      return r;
    }
    var cpIdx = 0, lastTop = false;
    for (t = 0; t < N;) {
      var x = Math.floor(rng() * 64);
      var u = x ^ key, up = prevX ^ key;
      var leak = style === "scmos" ? scmosToggles(net, up, u) : sdmlpCharge(net, u, eps2);
      leak += sigma * gauss(rng);
      if (trace.length < (opts.keepTrace || 0)) trace.push(leak);
      t++;
      sy += leak; syy += leak * leak;
      for (var g = 0; g < 64; g++) {
        var h = model === "hw" ? hw(sbox(0, x ^ g)) :
                model === "profile" ? (style === "scmos" ? scmosToggles(net, prevX ^ g, x ^ g) : profile[x ^ g]) :
                hw(sbox(0, prevX ^ g) ^ sbox(0, x ^ g));
        sx[g] += h; sxx[g] += h * h; sxy[g] += h * leak;
      }
      prevX = x;
      var needCorr = (cpIdx < checkpoints.length && checkpoints[cpIdx] === t) || t === N || opts.trackReveal;
      if (needCorr && t > 2) {
        var r = corrAll(), top = 0;
        for (var q = 1; q < 64; q++) if (Math.abs(r[q]) > Math.abs(r[top])) top = q;
        var isTop = top === key;
        if (isTop && !lastTop) revealed = t;
        if (!isTop) revealed = null;
        lastTop = isTop;
        if (cpIdx < checkpoints.length && checkpoints[cpIdx] === t) { series.push({ n: t, r: Array.prototype.slice.call(r) }); cpIdx++; }
        if (t === N) series.final = Array.prototype.slice.call(r);
      }
    }
    return { style: style, model: model, key: key, n: N, series: series, final: series.final, revealed: revealed, trace: trace, cells: net.cells };
  }

  /* -------------------------------------------- the paper's measurements */
  var GATES = ["AND", "OR", "XOR", "MUX"];
  var STYLES = ["SCMOS", "SDMLp", "WDDL"];
  var TABLES = {
    II:   { title: "Maximum instantaneous current variance", unit: "10⁻⁹ A²", rows: GATES,
            data: { SCMOS: [35.81, 32.63, 69.74, 74.43], SDMLp: [1.29, 1.36, 1.39, 1.26], WDDL: [7.91, 6.96, 7.73, 8.64] },
            printed: { SCMOS: [53.15, 21.98], SDMLp: [1.325, 0.06], WDDL: [7.81, 0.69] } },
    III:  { title: "Propagation delay", unit: "10⁻¹² s", rows: GATES,
            data: { SCMOS: [24.86, 25.6, 49.81, 47.62], SDMLp: [35.61, 36.1, 36.52, 37.23], WDDL: [37.6, 35.56, 78.61, 77.22] },
            printed: { SCMOS: [36.97, 13.59], SDMLp: [36.37, 0.69], WDDL: [57.25, 23.89] } },
    IV:   { title: "Layout area", unit: "λ²", rows: GATES,
            data: { SCMOS: [7.6, 7.6, 12.2, 11.4], SDMLp: [18.4, 18.4, 18.4, 18.4], WDDL: [15.2, 15.2, 24.4, 22.8] },
            printed: { SCMOS: [9.7, 2.45], SDMLp: [18.4, 0.00], WDDL: [19.4, 4.89] } },
    V:    { title: "Average power", unit: "10⁻⁶ W", rows: GATES,
            data: { SCMOS: [5.29, 5.62, 6.69, 7.02], SDMLp: [7.41, 7.43, 7.02, 6.93], WDDL: [13.95, 14.47, 22.12, 21.98] },
            printed: { SCMOS: [6.15, 0.83], SDMLp: [7.20, 0.26], WDDL: [18.13, 4.53] } },
    VI:   { title: "DES S-box layout area", unit: "λ²", rows: ["S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8"],
            data: { SCMOS: [1137.45, 1125.54, 1091.42, 1101.71, 1079.64, 1120.24, 1122.96, 1055.29],
                    SDMLp: [1766.09, 1586.3, 1537.81, 1235.04, 1615.82, 1651.18, 1512.04, 1560.09],
                    WDDL: [2619.83, 2503.26, 2434.72, 2393.85, 2360.16, 2408.69, 2499.77, 2461.09] },
            printed: { SCMOS: [1104, 28], SDMLp: [1558, 152], WDDL: [2460, 82] } },
    VII:  { title: "DES S-box total power", unit: "10⁻⁵ W", rows: ["S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8"],
            data: { SCMOS: [9.03, 9.00, 8.99, 9.04, 8.99, 9.00, 9.02, 8.98], SDMLp: [13.9, 13.2, 12.7, 11.0, 13.9, 13.1, 13.0, 13.2],
                    WDDL: [20.1, 17.9, 18.5, 14.9, 18.7, 19.2, 17.1, 18.3] },
            printed: { SCMOS: [9.00, 0.02], SDMLp: [13.0, 0.91], WDDL: [18.09, 1.56] } },
    VIII: { title: "DES S-box maximum instantaneous current variation", unit: "10⁻⁷ A²", rows: ["S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8"],
            data: { SCMOS: [7490, 186.0, 323.0, 8690, 245.0, 7670, 9420, 323.0], SDMLp: [3.03, 4.01, 4.11, 5.30, 7.18, 4.29, 4.62, 4.77],
                    WDDL: [43.6, 83.6, 38.9, 14.8, 32.3, 53.5, 32.3, 49.7] },
            printed: { SCMOS: [4293, 4342], SDMLp: [4.66, 1.21], WDDL: [43.59, 20.15] } }
  };
  var TABLE9 = {
    area: { label: "Area (λ²)", SCMOS: 13247.21, SDMLp: 18715.26, WDDL: 32714.64 },
    power: { label: "Total power (mW)", SCMOS: 1.37, SDMLp: 1.47, WDDL: 2.96 },
    freq: { label: "Max. operating frequency (MHz)", SCMOS: 100, SDMLp: 66.67, WDDL: 83.33 },
    cvar: { label: "Instantaneous current variance (10⁻⁶ A²)", SCMOS: 1892.3, SDMLp: 5.95, WDDL: 229.1 }
  };
  function mean(a) { return a.reduce(function (s, x) { return s + x; }, 0) / a.length; }
  function sampleSD(a) {
    var m = mean(a);
    return Math.sqrt(a.reduce(function (s, x) { return s + (x - m) * (x - m); }, 0) / (a.length - 1));
  }
  function popSD(a) {
    var m = mean(a);
    return Math.sqrt(a.reduce(function (s, x) { return s + (x - m) * (x - m); }, 0) / a.length);
  }
  // The headline ratios of the abstract and conclusion, from Table IX.
  function headline() {
    return {
      areaVsWDDL: 1 - TABLE9.area.SDMLp / TABLE9.area.WDDL,
      powerVsWDDL: 1 - TABLE9.power.SDMLp / TABLE9.power.WDDL,
      cvarVsWDDL: TABLE9.cvar.WDDL / TABLE9.cvar.SDMLp,
      freqVsWDDL: 1 - TABLE9.freq.SDMLp / TABLE9.freq.WDDL,
      freqVsSCMOS: 1 - TABLE9.freq.SDMLp / TABLE9.freq.SCMOS,
      cvarVsSCMOS: TABLE9.cvar.SCMOS / TABLE9.cvar.SDMLp,
      cellVarVsSCMOS: mean(TABLES.II.data.SCMOS) / mean(TABLES.II.data.SDMLp)
    };
  }
  function spearman(a, b) {
    function ranks(v) {
      var idx = v.map(function (x, i) { return i; }).sort(function (i, j) { return v[i] - v[j]; });
      var r = new Array(v.length), i = 0;
      while (i < idx.length) {
        var j = i;
        while (j + 1 < idx.length && v[idx[j + 1]] === v[idx[i]]) j++;
        for (var k = i; k <= j; k++) r[idx[k]] = (i + j) / 2 + 1;
        i = j + 1;
      }
      return r;
    }
    var ra = ranks(a), rb = ranks(b), ma = mean(ra), mb = mean(rb), num = 0, da = 0, db = 0;
    for (var i = 0; i < a.length; i++) { num += (ra[i] - ma) * (rb[i] - mb); da += (ra[i] - ma) * (ra[i] - ma); db += (rb[i] - mb) * (rb[i] - mb); }
    return num / Math.sqrt(da * db);
  }

  var api = {
    SBOX: SBOX, sbox: sbox, desEncrypt: desEncrypt,
    cell: cell, eq1: eq1, eq2: eq2, TABLE1: TABLE1, evalRow: evalRow, verifyTable1: verifyTable1,
    sboxOutputs: sboxOutputs, buildBDD: buildBDD, evalBDD: evalBDD, nodeValues: nodeValues,
    ORDERS: ORDERS, bestOrder: bestOrder,
    mulberry32: mulberry32, gauss: gauss, hw: hw,
    netlist: netlist, scmosToggles: scmosToggles, sdmlpCharge: sdmlpCharge, attack: attack,
    TABLES: TABLES, TABLE9: TABLE9, STYLES: STYLES, mean: mean, sampleSD: sampleSD, popSD: popSD,
    headline: headline, spearman: spearman, VARS: ["b1", "b2", "b3", "b4", "b5", "b6"]
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Sdmlp = api;
})(typeof self !== "undefined" ? self : this);

/*
 * sfsm-engine.js: structurally secure finite state machines (S*FSMs) after
 * Borowczak and Vemuri, "S*FSM: A Paradigm Shift for Attack Resistant FSM
 * Designs and Encodings" (ASE/IEEE BioMedCom 2012), "Secure Controllers:
 * Requirements of S*FSM" (IEEE MWSCAS 2013), and "Enabling Side Channel
 * Secure FSMs in the Presence of Low Power Requirements" (IEEE ISVLSI 2014).
 *
 * KISS2 parsing, self-loop unrolling (2012 Algorithm 1), Hamming weight and
 * distance readings for an encoding, the S*Opt capacity table (2013 Table I
 * and Eq. 7 to 10), and an exact backtracking search for the shortest
 * encoding with constant Hamming weight (c1) and constant Hamming distance
 * (c2) across transitions, with the relaxed (RHD) and low-power (CHD, CHW)
 * variants of the 2014 paper.
 *
 * Loads as a page script (window.SFSMEngine) and in a Web Worker or Node
 * (self.SFSMEngine / module.exports).
 */
(function (root) {
  "use strict";

  /* ---------- bits ---------- */

  function popcount(x) {
    var c = 0;
    while (x) { x &= x - 1; c++; }
    return c;
  }
  function hd(a, b) { return popcount(a ^ b); }
  function toBits(c, n) { var s = c.toString(2); while (s.length < n) s = "0" + s; return s; }
  function binom(n, k) {
    if (k < 0 || k > n) return 0;
    var r = 1;
    for (var i = 1; i <= k; i++) r = r * (n - k + i) / i;
    return Math.round(r);
  }
  function minBits(s) { return Math.max(1, Math.ceil(Math.log2(s))); }

  /* ---------- KISS2 ---------- */

  function parseKiss2(text) {
    var ni = 0, no = 0, start = null, rows = [], states = [], seen = {};
    text.split(/\r?\n/).forEach(function (raw) {
      var line = raw.replace(/#.*/, "").trim();
      if (!line) return;
      var f = line.split(/\s+/);
      if (f[0] === ".i") ni = +f[1];
      else if (f[0] === ".o") no = +f[1];
      else if (f[0] === ".r") start = f[1];
      else if (f[0].charAt(0) === ".") return;
      else {
        var r = { inp: f[0], cur: f[1], nxt: f[2], out: f[3] || "" };
        rows.push(r);
        [r.cur, r.nxt].forEach(function (s) {
          if (s !== "*" && s !== "-" && !seen[s]) { seen[s] = 1; states.push(s); }
        });
      }
    });
    if (!start) start = rows.length ? rows[0].cur : null;
    return { ni: ni, no: no, start: start, states: states, rows: rows };
  }

  /*
   * Algorithm 1 (2012), FSM Loop Unroll. Each state v with a self-loop gets a
   * twin v' (named v + "n", as in the 2013 and 2014 figures). Every self-loop
   * row v -> v becomes v -> v' and v' -> v on the same condition; every other
   * row leaving v is copied to leave v' as well. Rows entering v are kept.
   * Rows whose present state is "*" (any state) are kept as they are.
   * With `only` (a list of state names), only those states are unrolled.
   */
  function unroll(fsm, only) {
    var loops = {}, taken = {}, allow = null;
    if (only) { allow = {}; only.forEach(function (s) { allow[s] = 1; }); }
    fsm.states.forEach(function (s) { taken[s] = 1; });
    fsm.rows.forEach(function (r) { if (r.cur === r.nxt && r.cur !== "*" && (!allow || allow[r.cur])) loops[r.cur] = 1; });
    var twin = {};
    fsm.states.forEach(function (s) {
      if (!loops[s]) return;
      var t = s + "n";
      while (taken[t]) t += "n";
      taken[t] = 1; twin[s] = t;
    });
    var states = [];
    fsm.states.forEach(function (s) { states.push(s); if (twin[s]) states.push(twin[s]); });
    var rows = [];
    fsm.rows.forEach(function (r) {
      var v = r.cur;
      if (twin[v] && r.nxt === v) {
        rows.push({ inp: r.inp, cur: v, nxt: twin[v], out: r.out, loop: 1 });
        rows.push({ inp: r.inp, cur: twin[v], nxt: v, out: r.out, loop: 1 });
      } else {
        rows.push({ inp: r.inp, cur: v, nxt: r.nxt, out: r.out });
        if (twin[v]) rows.push({ inp: r.inp, cur: twin[v], nxt: r.nxt, out: r.out, copy: 1 });
      }
    });
    return { ni: fsm.ni, no: fsm.no, start: fsm.start, states: states, rows: rows, twin: twin,
             loopStates: fsm.states.filter(function (s) { return fsm.rows.some(function (r) { return r.cur === s && r.nxt === s; }); }) };
  }

  /*
   * Transition structure used by the encoding constraints: directed edges
   * between distinct states (one per state pair), the states with self-loops,
   * and the undirected adjacency the HD constraint applies to. Rows with an
   * unspecified next state ("*" or "-") add no edge; rows from "*" connect
   * every state to their next state.
   */
  function graph(fsm) {
    var idx = {}, N = fsm.states.length;
    fsm.states.forEach(function (s, i) { idx[s] = i; });
    var edges = {}, loop = new Uint8Array(N), list = [];
    function add(a, b) {
      if (a === b) { loop[a] = 1; return; }
      var k = a + "," + b;
      if (!edges[k]) { edges[k] = 1; list.push([a, b]); }
    }
    fsm.rows.forEach(function (r) {
      if (!(r.nxt in idx)) return;
      if (r.cur === "*") { for (var a = 0; a < N; a++) add(a, idx[r.nxt]); }
      else if (r.cur in idx) add(idx[r.cur], idx[r.nxt]);
    });
    var adj = [];
    for (var i = 0; i < N; i++) adj.push([]);
    var und = {};
    list.forEach(function (e) {
      var a = Math.min(e[0], e[1]), b = Math.max(e[0], e[1]), k = a + "," + b;
      if (und[k]) return;
      und[k] = 1; adj[a].push(b); adj[b].push(a);
    });
    var outDeg = 0;
    var out = fsm.states.map(function () { return {}; });
    list.forEach(function (e) { out[e[0]][e[1]] = 1; });
    out.forEach(function (o, i) { var d = Object.keys(o).length + (loop[i] ? 1 : 0); if (d > outDeg) outDeg = d; });
    var nLoop = 0, maxDeg = 0;
    for (i = 0; i < N; i++) { nLoop += loop[i]; if (adj[i].length > maxDeg) maxDeg = adj[i].length; }
    return { names: fsm.states.slice(), edges: list, loop: loop, adj: adj, nLoop: nLoop,
             maxOut: outDeg, maxDeg: maxDeg, terms: fsm.rows.length };
  }

  /* Readings an attacker's Hamming models see under an encoding. */
  function readings(g, codes) {
    var hw = {}, hdv = {};
    codes.forEach(function (c) { var w = popcount(c); hw[w] = (hw[w] || 0) + 1; });
    g.edges.forEach(function (e) { var d = hd(codes[e[0]], codes[e[1]]); hdv[d] = (hdv[d] || 0) + 1; });
    for (var i = 0; i < g.loop.length; i++) if (g.loop[i]) hdv[0] = (hdv[0] || 0) + 1;
    function keys(o) { return Object.keys(o).map(Number).sort(function (a, b) { return a - b; }); }
    return { hw: keys(hw), hd: keys(hdv), hwCount: hw, hdCount: hdv };
  }

  /* ---------- S*Opt capacity (2013 Table I, Eq. 7 to 10) ---------- */

  function sOptRow(n) {
    var c = Math.floor(n / 2);
    return { n: n, c: c, smax: binom(n, c), tmax: c * (n - c) };
  }
  /* Smallest n with C(n, floor(n/2)) >= states and floor(n^2/4) >= connections from one state (Eq. 7 to 10). */
  function sOptBound(states, maxOut) {
    var n = 1;
    while (true) {
      var r = sOptRow(n);
      if (r.smax >= states && r.tmax >= (maxOut || 0)) return r;
      n++;
    }
  }

  /* ---------- constrained encoding search ---------- */

  /*
   * Exact search for codes of n bits such that
   *   every code is distinct,
   *   every code has Hamming weight c1 (c1 === null: weight is free), and
   *   every transition between distinct states has Hamming distance c2.
   * Vertices are visited in a connectivity order; the first code of each
   * connected component and the second code of the first component are fixed
   * up to bit permutation (and, with free weight, translation), which changes
   * no weight or distance. Returns { codes, complete, nodes }.
   */
  function search(g, n, c1, c2, opts) {
    opts = opts || {};
    var budget = opts.budget || 5e6, N = g.names.length, adj = g.adj, nodes = 0;
    if (c1 !== null && binom(n, c1) < N) return { codes: null, complete: true, nodes: 0 };
    if (c1 === null && Math.pow(2, n) < N) return { codes: null, complete: true, nodes: 0 };
    if (c1 !== null && (c2 % 2 || c2 > 2 * Math.min(c1, n - c1))) {
      var anyEdge = g.edges.length > 0;
      if (anyEdge) return { codes: null, complete: true, nodes: 0 };
    }
    // connectivity order: most already-ordered neighbors first, then degree
    var order = [], placed = new Uint8Array(N), cnt = new Int32Array(N);
    for (var k = 0; k < N; k++) {
      var best = -1;
      for (var v = 0; v < N; v++) {
        if (placed[v]) continue;
        if (best < 0 || cnt[v] > cnt[best] || (cnt[v] === cnt[best] && adj[v].length > adj[best].length)) best = v;
      }
      placed[best] = 1; order.push(best);
      adj[best].forEach(function (u) { cnt[u]++; });
    }
    var pos = new Int32Array(N);
    order.forEach(function (v, i) { pos[v] = i; });
    var back = [];
    for (v = 0; v < N; v++) back.push(adj[v].filter(function (u) { return pos[u] < pos[v]; }));
    var code = new Array(N), used = {}, full = (1 << n) - 1;
    // all codes of weight w, for components without an assigned neighbor
    function allCodes() {
      var out = [];
      for (var x = 0; x <= full; x++) if (c1 === null || popcount(x) === c1) out.push(x);
      return out;
    }
    var pool = null;
    // codes at distance c2 from x (keeping weight c1 when set)
    function around(x) {
      var out = [];
      if (c1 === null) {
        for (var y = 0; y <= full; y++) if (popcount(x ^ y) === c2) out.push(y);
      } else {
        var h = c2 / 2, ones = [], zeros = [];
        for (var b = 0; b < n; b++) ((x >> b) & 1 ? ones : zeros).push(b);
        combos(ones.length, h).forEach(function (A) {
          var m1 = 0; A.forEach(function (i) { m1 |= 1 << ones[i]; });
          combos(zeros.length, h).forEach(function (B) {
            var m0 = 0; B.forEach(function (i) { m0 |= 1 << zeros[i]; });
            out.push(x ^ m1 ^ m0);
          });
        });
      }
      return out;
    }
    var aborted = false, firstComp = true;
    function rec(i) {
      if (i === N) return true;
      if (++nodes > budget) { aborted = true; return false; }
      var v = order[i], cands;
      if (!back[v].length) {
        // new component: canonical first code
        var w = c1 === null ? 0 : c1;
        var canon = (1 << w) - 1;
        if (!firstComp || i > 0) {
          if (!pool) pool = allCodes();
          cands = pool;
        } else cands = [canon];
      } else if (i === 1 && firstComp) {
        // second vertex of the first component: canonical neighbor
        var x = code[order[0]];
        if (c1 === null) cands = [(1 << c2) - 1];
        else {
          var h = c2 / 2;
          var drop = 0; for (var b = c1 - h; b < c1; b++) drop |= 1 << b;
          var add = 0; for (b = c1; b < c1 + h; b++) add |= 1 << b;
          cands = [x ^ drop ^ add];
        }
      } else cands = around(code[back[v][0]]);
      for (var c = 0; c < cands.length; c++) {
        var y = cands[c];
        if (used[y]) continue;
        var ok = true;
        for (var j = 0; j < back[v].length; j++) if (popcount(code[back[v][j]] ^ y) !== c2) { ok = false; break; }
        if (!ok) continue;
        code[v] = y; used[y] = 1;
        if (rec(i + 1)) return true;
        used[y] = 0;
        if (aborted) return false;
      }
      return false;
    }
    var found = rec(0);
    return { codes: found ? code.slice() : null, complete: found || !aborted, nodes: nodes };
  }

  function combos(m, k) {
    var out = [], cur = [];
    (function go(s) {
      if (cur.length === k) { out.push(cur.slice()); return; }
      for (var i = s; i < m; i++) { cur.push(i); go(i + 1); cur.pop(); }
    })(0);
    return out;
  }

  /*
   * Shortest encoding under a constraint family.
   *   mode "secure":  constant HW (c1) and constant HD (c2), any values
   *   mode "rhd":     free HW, constant HD on transitions between distinct states
   *   fixed c1/c2:    the 2014 low-power families, e.g. { c2: 2 } or { c1: 1, c2: 2 }
   * At the shortest length, the smallest c2 is reported (lowest peak current,
   * Npeak = c2 / 2 under constant weight).
   */
  function shortest(g, opts) {
    opts = opts || {};
    var N = g.names.length, nodes = 0, complete = true, lo = minBits(N);
    var maxN = opts.maxN || Math.max(N, lo);
    for (var n = lo; n <= maxN; n++) {
      var c2s = [];
      if (opts.c2) c2s = [opts.c2];
      else if (opts.mode === "rhd") for (var d = 1; d <= n; d++) c2s.push(d);
      else for (d = 2; d <= n; d += 2) c2s.push(d);
      var c1s;
      if (opts.mode === "rhd") c1s = [null];
      else if (opts.c1) c1s = [opts.c1];
      else { c1s = []; for (var w = Math.floor(n / 2); w >= 1; w--) c1s.push(w); }
      var nComplete = true;
      for (var a = 0; a < c2s.length; a++) {
        for (var b = 0; b < c1s.length; b++) {
          var c1 = c1s[b], c2 = c2s[a];
          if (c1 !== null && (c2 > 2 * Math.min(c1, n - c1)) && g.edges.length) continue;
          if (!g.edges.length && c2s.length > 1 && a > 0) continue;
          var r = search(g, n, c1, c2, { budget: opts.budget });
          nodes += r.nodes;
          if (r.codes) return { n: n, c1: c1, c2: c2, codes: r.codes, nodes: nodes, complete: complete && nComplete, exact: complete && nComplete };
          if (!r.complete) nComplete = false;
        }
      }
      if (!nComplete) complete = false;
      if (opts.stopAfterIncomplete && !nComplete) return { n: null, nodes: nodes, complete: false };
    }
    return { n: null, nodes: nodes, complete: complete };
  }

  /* ---------- the 2012 branch predictor and the 2014 three-state example ---------- */

  var examples = {
    predictor: {
      title: "Two-bit branch predictor",
      ni: 1,
      start: "ST",
      states: ["ST", "WT", "WNT", "SNT"],
      // [present, input T, next]
      rows: [["ST", "1", "ST"], ["ST", "0", "WT"], ["WT", "1", "ST"], ["WT", "0", "WNT"],
             ["WNT", "1", "WT"], ["WNT", "0", "SNT"], ["SNT", "1", "WNT"], ["SNT", "0", "SNT"]],
      // 2012 Fig. 2 (minimal binary)
      binary: { ST: "11", WT: "10", WNT: "01", SNT: "00" }
    },
    // 2012 Fig. 4 / Table 1: the unrolled predictor and its three encodings
    predictorSecure: {
      states: ["ST1", "ST2", "WT", "WNT", "SNT2", "SNT1"],
      rows: [["ST1", "1", "ST2"], ["ST2", "1", "ST1"], ["ST1", "0", "WT"], ["ST2", "0", "WT"],
             ["WT", "1", "ST1"], ["WT", "0", "WNT"], ["WNT", "1", "WT"], ["WNT", "0", "SNT1"],
             ["SNT1", "0", "SNT2"], ["SNT2", "0", "SNT1"], ["SNT1", "1", "WNT"], ["SNT2", "1", "WNT"]],
      encodings: {
        binary: { ST1: "101", ST2: "100", WT: "011", WNT: "010", SNT2: "001", SNT1: "000" },
        onehot: { ST1: "100000", ST2: "010000", WT: "001000", WNT: "000100", SNT2: "000010", SNT1: "000001" },
        sopt: { ST1: "0101", ST2: "0110", WT: "1100", WNT: "1001", SNT2: "0011", SNT1: "1010" }
      }
    },
    // 2014 Fig. 1 and Fig. 2
    threeState: {
      states: ["A", "B", "C"],
      rows: [["A", "1", "B"], ["B", "1", "C"], ["B", "0", "B"], ["C", "1", "A"]],
      binary: { A: "01", B: "11", C: "10" },
      secureBinary: { A: "00", B: "01", Bn: "11", C: "10" }
    }
  };

  function exampleFsm(ex) {
    return { ni: 1, no: 0, start: ex.start || ex.states[0], states: ex.states.slice(),
             rows: ex.rows.map(function (r) { return { inp: r[1], cur: r[0], nxt: r[2], out: "" }; }) };
  }
  function codesFrom(g, map) { return g.names.map(function (s) { return parseInt(map[s], 2); }); }

  /* One step of a machine with a single input bit (the examples). */
  function step(fsm, state, bit) {
    for (var i = 0; i < fsm.rows.length; i++) {
      var r = fsm.rows[i];
      if (r.cur === state && (r.inp === "-" || +r.inp === bit)) return r.nxt;
    }
    return state;
  }

  /* Pearson correlation; null when either series is constant (the 2013 paper's Eq. 4 to 6). */
  function pearson(x, y) {
    var n = x.length, mx = 0, my = 0, i;
    for (i = 0; i < n; i++) { mx += x[i]; my += y[i]; }
    mx /= n; my /= n;
    var sxy = 0, sxx = 0, syy = 0;
    for (i = 0; i < n; i++) { var a = x[i] - mx, b = y[i] - my; sxy += a * b; sxx += a * a; syy += b * b; }
    if (sxx === 0 || syy === 0) return null;
    return sxy / Math.sqrt(sxx * syy);
  }

  /* xorshift32, seeded, for reproducible demo runs */
  function rng(seed) {
    var s = (seed >>> 0) || 0x9e3779b9;
    return function () { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  }

  var api = {
    popcount: popcount, hd: hd, toBits: toBits, binom: binom, minBits: minBits,
    parseKiss2: parseKiss2, unroll: unroll, graph: graph, readings: readings,
    sOptRow: sOptRow, sOptBound: sOptBound, search: search, shortest: shortest,
    examples: examples, exampleFsm: exampleFsm, codesFrom: codesFrom, step: step,
    pearson: pearson, rng: rng
  };
  root.SFSMEngine = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof self !== "undefined" ? self : this);

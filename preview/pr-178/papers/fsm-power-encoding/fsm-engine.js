/*
 * fsm-engine.js: state transition probabilities, reachability sets, Hamming
 * leakage values, switching activity, and a constrained state-encoding search
 * for finite state machines, after Agrawal, Vemuri, and Borowczak,
 * "A State Machine Encoding Methodology Against Power Analysis Attacks,"
 * J. Electronic Testing 35:621-639 (2019), and Agrawal, Borowczak, and
 * Vemuri, VLSID 2019.
 *
 * Loads as a page script (window.FSMEngine) and in a Web Worker or Node
 * (self.FSMEngine / module.exports).
 */
(function (root) {
  "use strict";

  /* ---------- KISS2 parsing ---------- */

  function parseKiss2(text) {
    var ni = 0, no = 0, start = null, rows = [], order = [], seen = {};
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
          if (s !== "*" && !seen[s]) { seen[s] = 1; order.push(s); }
        });
      }
    });
    if (!start) start = rows.length ? rows[0].cur : null;
    return { ni: ni, no: no, start: start, states: order, rows: rows };
  }

  function cubeMatches(cube, v, ni) {
    for (var b = 0; b < ni; b++) {
      var c = cube.charAt(b);
      if (c === "-") continue;
      var bit = (v >> (ni - 1 - b)) & 1;
      if ((c === "1") !== (bit === 1)) return false;
    }
    return true;
  }

  /*
   * Build the state transition graph with input probabilities. Every primary
   * input is independent and equally likely (the paper's assumption). An
   * input with no row for a state becomes a self-loop (the paper's FSM
   * checker). Overlapping rows with different next states are reported.
   */
  function buildSTG(fsm) {
    var M = fsm.states.length, idx = {}, nIn = 1 << fsm.ni;
    fsm.states.forEach(function (s, i) { idx[s] = i; });
    var pin = [], completed = 0, conflicts = 0;
    for (var m = 0; m < M; m++) pin.push(new Float64Array(M));
    var byState = fsm.states.map(function () { return []; });
    fsm.rows.forEach(function (r) { if (r.cur in idx && r.nxt in idx) byState[idx[r.cur]].push(r); });
    for (m = 0; m < M; m++) {
      for (var v = 0; v < nIn; v++) {
        var nx = -1;
        for (var k = 0; k < byState[m].length; k++) {
          var r = byState[m][k];
          if (cubeMatches(r.inp, v, fsm.ni)) {
            var n = idx[r.nxt];
            if (nx < 0) nx = n; else if (nx !== n) conflicts++;
          }
        }
        if (nx < 0) { nx = m; completed++; }
        pin[m][nx] += 1 / nIn;
      }
    }
    return { names: fsm.states.slice(), start: idx[fsm.start], pin: pin,
             completedInputs: completed, conflicts: conflicts };
  }

  /* Stationary state probabilities: P(s_n) = sum_m P(s_m) P(I_mn), sum P = 1. */
  function stateProbabilities(stg) {
    var M = stg.names.length, A = [], i, j, k;
    for (i = 0; i < M; i++) {
      var row = new Float64Array(M + 1);
      for (j = 0; j < M; j++) row[j] = stg.pin[j][i] - (i === j ? 1 : 0);
      A.push(row);
    }
    // replace the last (redundant) equation with the normalization
    for (j = 0; j < M; j++) A[M - 1][j] = 1;
    A[M - 1][M] = 1;
    for (i = 0; i < M; i++) {
      var p = i;
      for (k = i + 1; k < M; k++) if (Math.abs(A[k][i]) > Math.abs(A[p][i])) p = k;
      var t = A[i]; A[i] = A[p]; A[p] = t;
      var d = A[i][i];
      if (Math.abs(d) < 1e-14) continue;
      for (j = i; j <= M; j++) A[i][j] /= d;
      for (k = 0; k < M; k++) {
        if (k === i || A[k][i] === 0) continue;
        var f = A[k][i];
        for (j = i; j <= M; j++) A[k][j] -= f * A[i][j];
      }
    }
    var P = new Float64Array(M);
    for (i = 0; i < M; i++) P[i] = A[i][M];
    return P;
  }

  /* Transition list with STPs: P((s_m, s_n)) = P(s_m) P(I_mn). */
  function transitions(stg) {
    var P = stateProbabilities(stg), M = stg.names.length, list = [];
    for (var m = 0; m < M; m++)
      for (var n = 0; n < M; n++)
        if (stg.pin[m][n] > 0) list.push({ u: m, v: n, pin: stg.pin[m][n], stp: P[m] * stg.pin[m][n] });
    return { P: P, list: list };
  }

  /*
   * Restructure self-loops (paper Fig. 4): a state s with a self-loop becomes
   * sA and sB; the self-loop inputs toggle between them, other inputs leave
   * from both, and edges into s enter sA.
   */
  function restructure(stg) {
    var M = stg.names.length, names = [], map = [], i, j;
    for (i = 0; i < M; i++) {
      if (stg.pin[i][i] > 0) { map.push([names.length, names.length + 1]); names.push(stg.names[i] + "A", stg.names[i] + "B"); }
      else { map.push([names.length]); names.push(stg.names[i]); }
    }
    var N = names.length, pin = [];
    for (i = 0; i < N; i++) pin.push(new Float64Array(N));
    for (i = 0; i < M; i++) {
      map[i].forEach(function (src, which) {
        for (j = 0; j < M; j++) {
          var p = stg.pin[i][j];
          if (!p) continue;
          if (j === i) pin[src][map[i][1 - which]] += p;
          else pin[src][map[j][0]] += p;
        }
      });
    }
    return { names: names, start: map[stg.start][0], pin: pin, completedInputs: stg.completedInputs, conflicts: stg.conflicts };
  }

  /*
   * Algorithm 1 (paper): partition states and transitions into probabilistic
   * reachability sets with a max-heap of transitions. With l given, set
   * numbers are taken mod l (Section 3.5). Self-loops are ignored. Ties keep
   * insertion order (first pushed, first popped).
   * key "pin" (default) orders the heap by the input probability P(I_mn);
   * key "stp" orders it by the full STP P(s_m) P(I_mn). The paper's Fig. 6
   * partition of BBARA is reproduced with "pin" (see verify notes).
   */
  function partition(stg, trans, l, key) {
    var pri = key === "stp" ? function (t) { return t.stp; } : function (t) { return t.pin; };
    var M = stg.names.length, SN = new Int32Array(M).fill(-1), heap = [], seq = 0;
    var out = stg.names.map(function () { return []; });
    trans.list.forEach(function (t) { if (t.u !== t.v) out[t.u].push(t); });
    function push(t) { heap.push({ t: t, k: pri(t), s: seq++ }); up(heap.length - 1); }
    function better(a, b) { return a.k > b.k || (a.k === b.k && a.s < b.s); }
    function up(i) { while (i > 0) { var p = (i - 1) >> 1; if (better(heap[i], heap[p])) { var x = heap[i]; heap[i] = heap[p]; heap[p] = x; i = p; } else break; } }
    function pop() {
      var top = heap[0], last = heap.pop();
      if (heap.length) {
        heap[0] = last; var i = 0;
        for (;;) {
          var a = 2 * i + 1, b = a + 1, m = i;
          if (a < heap.length && better(heap[a], heap[m])) m = a;
          if (b < heap.length && better(heap[b], heap[m])) m = b;
          if (m === i) break;
          var x = heap[i]; heap[i] = heap[m]; heap[m] = x; i = m;
        }
      }
      return top.t;
    }
    SN[stg.start] = 0;
    out[stg.start].forEach(push);
    while (heap.length) {
      var t = pop();
      if (SN[t.v] < 0) {
        SN[t.v] = l ? (SN[t.u] + 1) % l : SN[t.u] + 1;
        out[t.v].forEach(push);
      }
    }
    var ST = trans.list.map(function (t) { return t.u === t.v ? -1 : (SN[t.u] < 0 ? -1 : SN[t.u]); });
    var nsets = 0;
    for (var i = 0; i < M; i++) if (SN[i] + 1 > nsets) nsets = SN[i] + 1;
    return { SN: SN, ST: ST, sets: nsets };
  }

  function lmax(stg, trans, key) { return partition(stg, trans, 0, key).sets; }

  /* ---------- Hamming models ---------- */

  function hw(x) { var c = 0; while (x) { x &= x - 1; c++; } return c; }
  function hd(a, b) { return hw(a ^ b); }
  /* Switching distance in units: rises count 1, falls count 1 - delta. */
  function sdParts(a, b) { return { rise: hw(~a & b), fall: hw(a & ~b) }; }

  function parseCodes(strs) { return strs.map(function (s) { return parseInt(s, 2); }); }

  /* Estimated switching activity (Eq. 9/11): sum over transitions of STP * HD. */
  function switchingActivity(trans, codes) {
    var sa = 0;
    trans.list.forEach(function (t) { sa += t.stp * hd(codes[t.u], codes[t.v]); });
    return sa;
  }

  /* Distinct HW, HD, and SD values the state register can take (Table 4). */
  function leakageValues(trans, codes, reachableOnly) {
    var hws = {}, hds = {}, sds = {};
    var used = {};
    trans.list.forEach(function (t) { used[t.u] = used[t.v] = 1; });
    codes.forEach(function (c, i) { if (!reachableOnly || used[i]) hws[hw(c)] = 1; });
    trans.list.forEach(function (t) {
      var a = codes[t.u], b = codes[t.v];
      hds[hd(a, b)] = 1;
      var p = sdParts(a, b);
      sds[p.rise + p.fall + "," + p.fall] = { rise: p.rise, fall: p.fall };
    });
    function nums(o) { return Object.keys(o).map(Number).sort(function (x, y) { return x - y; }); }
    var sdl = Object.keys(sds).map(function (k) { return sds[k]; })
      .sort(function (x, y) { return (x.rise + x.fall) - (y.rise + y.fall) || x.fall - y.fall; });
    return { hw: nums(hws), hd: nums(hds), sd: sdl };
  }

  function sdLabel(p) {
    var n = p.rise + p.fall;
    if (p.fall === 0) return String(n);
    return n + "−" + (p.fall === 1 ? "" : p.fall) + "δ";
  }

  /* Check an encoding against a partition: equal HW per state set, equal HD per transition set. */
  function checkEncoding(trans, part, codes) {
    var bad = [], hwBySet = {}, hdBySet = {};
    part.SN.forEach(function (s, i) {
      if (s < 0) return;
      var w = hw(codes[i]);
      if (!(s in hwBySet)) hwBySet[s] = {};
      hwBySet[s][w] = 1;
    });
    trans.list.forEach(function (t, k) {
      var s = part.ST[k];
      if (s < 0) return;
      if (!(s in hdBySet)) hdBySet[s] = {};
      hdBySet[s][hd(codes[t.u], codes[t.v])] = 1;
    });
    Object.keys(hwBySet).forEach(function (s) { if (Object.keys(hwBySet[s]).length > 1) bad.push("states in set " + s + " differ in HW"); });
    Object.keys(hdBySet).forEach(function (s) { if (Object.keys(hdBySet[s]).length > 1) bad.push("transitions in set " + s + " differ in HD"); });
    var distinct = new Set(codes).size === codes.length;
    if (!distinct) bad.push("codes not distinct");
    return { ok: bad.length === 0, problems: bad, hwBySet: hwBySet, hdBySet: hdBySet };
  }

  /*
   * Constrained encoding search (the paper uses the Z3 SMT solver; this is a
   * branch-and-bound search over the same constraints):
   *   distinct codes; equal HW within each state set; equal HD within each
   *   transition set; optionally minimum switching activity.
   * Bit permutations preserve every constraint and the SA, so the first
   * state's code is fixed to the canonical code of its weight.
   * Returns the best encoding found for length R, or null.
   */
  function searchEncoding(stg, trans, part, R, opts) {
    opts = opts || {};
    var minimizeSA = !!opts.minimizeSA, budget = opts.budget || 2e6;
    var M = stg.names.length, nc = 1 << R;
    // order states: BFS from start, then any leftovers
    var order = [], seenS = new Uint8Array(M), q = [stg.start];
    var adj = stg.names.map(function () { return []; });
    trans.list.forEach(function (t) { if (t.u !== t.v) { adj[t.u].push(t.v); adj[t.v].push(t.u); } });
    seenS[stg.start] = 1;
    while (q.length) { var s = q.shift(); order.push(s); adj[s].forEach(function (v) { if (!seenS[v]) { seenS[v] = 1; q.push(v); } }); }
    for (var i = 0; i < M; i++) if (!seenS[i]) order.push(i);
    var pos = new Int32Array(M); order.forEach(function (s, k) { pos[s] = k; });
    // transitions that close when each state (by order position) is assigned
    var closeAt = order.map(function () { return []; });
    trans.list.forEach(function (t, k) {
      if (t.u === t.v) return;
      closeAt[Math.max(pos[t.u], pos[t.v])].push(k);
    });
    var nS = part.sets, nT = 0;
    part.ST.forEach(function (s) { if (s + 1 > nT) nT = s + 1; });
    var setHW = new Int32Array(Math.max(nS, 1)).fill(-1), setHWc = new Int32Array(Math.max(nS, 1));
    var setHD = new Int32Array(Math.max(nT, 1)).fill(-1), setHDc = new Int32Array(Math.max(nT, 1));
    var codes = new Int32Array(M).fill(-1), used = new Uint8Array(nc);
    var best = null, bestSA = Infinity, nodes = 0, exhausted = true;
    var byWeight = [];
    for (var w = 0; w <= R; w++) byWeight.push([]);
    for (var c = 0; c < nc; c++) byWeight[hw(c)].push(c);
    // cheap lower bound: SA so far (unassigned transitions add >= 0)
    function rec(k, sa) {
      if (++nodes > budget) { exhausted = false; return true; }
      if (k === M) {
        if (sa < bestSA - 1e-12) { bestSA = sa; best = Array.prototype.slice.call(codes); }
        return !minimizeSA;
      }
      var s = order[k], set = part.SN[s];
      var cands;
      if (k === 0) {
        cands = [];
        for (var w0 = 0; w0 <= R; w0++) cands.push((1 << w0) - 1);
      } else if (set >= 0 && setHW[set] >= 0) cands = byWeight[setHW[set]];
      else { cands = []; for (var cc = 0; cc < nc; cc++) cands.push(cc); }
      for (var ci = 0; ci < cands.length; ci++) {
        var code = cands[ci];
        if (used[code]) continue;
        codes[s] = code;
        var ok = true, addSA = 0, touched = [];
        var list = closeAt[k];
        for (var j = 0; j < list.length; j++) {
          var t = trans.list[list[j]], d = hd(codes[t.u], codes[t.v]), ts = part.ST[list[j]];
          addSA += t.stp * d;
          if (ts >= 0) {
            if (setHD[ts] < 0) { setHD[ts] = d; setHDc[ts] = 1; touched.push(ts); }
            else if (setHD[ts] !== d) { ok = false; }
            else { setHDc[ts]++; touched.push(ts); }
          }
          if (!ok) break;
        }
        // self-loops add zero HD
        if (ok && minimizeSA && sa + addSA >= bestSA - 1e-12) ok = false;
        if (ok) {
          var newHW = false;
          if (set >= 0) { if (setHW[set] < 0) { setHW[set] = hw(code); newHW = true; } setHWc[set]++; }
          used[code] = 1;
          var stop = rec(k + 1, sa + addSA);
          used[code] = 0;
          if (set >= 0) { setHWc[set]--; if (newHW) setHW[set] = -1; }
          for (j = 0; j < touched.length; j++) { var ts2 = touched[j]; if (--setHDc[ts2] === 0) setHD[ts2] = -1; }
          if (stop) { codes[s] = -1; return true; }
        } else {
          for (j = 0; j < touched.length; j++) { var ts3 = touched[j]; if (--setHDc[ts3] === 0) setHD[ts3] = -1; }
        }
        codes[s] = -1;
      }
      return false;
    }
    rec(0, 0);
    return { codes: best, sa: best ? bestSA : null, nodes: nodes, complete: exhausted };
  }

  /* Smallest R in [Rmin, Rmax] with a satisfying encoding. */
  function shortestEncoding(stg, trans, part, opts) {
    var M = stg.names.length, Rmin = Math.max(1, Math.ceil(Math.log2(M)));
    var Rmax = Math.min(opts && opts.rmax || M, 16);
    for (var R = Rmin; R <= Rmax; R++) {
      var r = searchEncoding(stg, trans, part, R, opts);
      if (r.codes) { r.R = R; return r; }
      if (!r.complete) return { R: R, codes: null, complete: false, nodes: r.nodes };
    }
    return { R: null, codes: null, complete: true };
  }

  function toBits(c, R) { var s = c.toString(2); while (s.length < R) s = "0" + s; return s; }

  /* Random input walk from the start state; returns the visited state sequence. */
  function walk(stg, steps, rand) {
    rand = rand || Math.random;
    var M = stg.names.length, s = stg.start, seq = [s];
    for (var i = 0; i < steps; i++) {
      var r = rand(), acc = 0, nx = s;
      for (var n = 0; n < M; n++) { acc += stg.pin[s][n]; if (r < acc) { nx = n; break; } }
      s = nx; seq.push(s);
    }
    return seq;
  }

  /*
   * Page's own measure (not in the paper): with every input equally likely,
   * how many bits of the current state does one Hamming-weight reading
   * reveal? I(state; HW) under the stationary distribution, and likewise
   * I(transition; HD) and I(transition; SD) under the STPs.
   */
  function leakageInfo(trans, codes, delta) {
    delta = delta == null ? 0.17 : delta;
    function H(map) { var h = 0; Object.keys(map).forEach(function (k) { var p = map[k]; if (p > 0) h -= p * Math.log2(p); }); return h; }
    var hwDist = {}, hdDist = {}, sdDist = {};
    trans.P.forEach(function (p, i) { var k = hw(codes[i]); hwDist[k] = (hwDist[k] || 0) + p; });
    trans.list.forEach(function (t) {
      var a = codes[t.u], b = codes[t.v], d = hd(a, b), sp = sdParts(a, b);
      hdDist[d] = (hdDist[d] || 0) + t.stp;
      var key = (sp.rise + sp.fall * (1 - delta)).toFixed(6);
      sdDist[key] = (sdDist[key] || 0) + t.stp;
    });
    // the leakage is a deterministic function of the state (transition), so I = H(leak)
    return { hw: H(hwDist), hd: H(hdDist), sd: H(sdDist) };
  }

  /* Next-state table next[s][v] for every input vector v (missing rows stay put). */
  function nextTable(fsm) {
    var idx = {}, nIn = 1 << fsm.ni;
    fsm.states.forEach(function (s, i) { idx[s] = i; });
    return fsm.states.map(function (s, m) {
      var row = [];
      for (var v = 0; v < nIn; v++) {
        var nx = m;
        for (var k = 0; k < fsm.rows.length; k++) {
          var r = fsm.rows[k];
          if (r.cur === s && cubeMatches(r.inp, v, fsm.ni)) { nx = idx[r.nxt]; break; }
        }
        row.push(nx);
      }
      return row;
    });
  }

  /* Rebuild the STG and transition list from the page's JSON (trans rows are [u, v, pin, stp]). */
  function fromData(d) {
    var M = d.states.length, pin = [];
    for (var i = 0; i < M; i++) pin.push(new Float64Array(M));
    var list = d.trans.map(function (r) { pin[r[0]][r[1]] = r[2]; return { u: r[0], v: r[1], pin: r[2], stp: r[3] }; });
    var stg = { names: d.states.slice(), start: d.start, pin: pin };
    return { stg: stg, trans: { P: Float64Array.from(d.P), list: list } };
  }

  var api = {
    nextTable: nextTable, fromData: fromData,
    parseKiss2: parseKiss2, buildSTG: buildSTG, stateProbabilities: stateProbabilities,
    transitions: transitions, restructure: restructure, partition: partition, lmax: lmax,
    hw: hw, hd: hd, sdParts: sdParts, sdLabel: sdLabel, parseCodes: parseCodes,
    switchingActivity: switchingActivity, leakageValues: leakageValues,
    checkEncoding: checkEncoding, searchEncoding: searchEncoding,
    shortestEncoding: shortestEncoding, toBits: toBits, walk: walk, leakageInfo: leakageInfo
  };
  root.FSMEngine = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof self !== "undefined" ? self : this);

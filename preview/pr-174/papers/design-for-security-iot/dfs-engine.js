/*
 * dfs-engine.js: the computations behind /papers/design-for-security-iot/,
 * after Borowczak, Cooley, and Wolf, "Designing for Security Within and
 * Between IoT Devices," IEEE ISVLSI 2018, pp. 684-689.
 *
 *   Section II-A  KISS2 parsing, S*FSM restructuring (self-loops split),
 *                 Hamming weight (Eq. 4) and Hamming distance (Eq. 5)
 *                 constraints, information entropy (Eq. 1), mutual
 *                 information (Eqs. 2, 3), peak switching (Eqs. 7, 8, 10),
 *                 total switching (Eq. 9), and a backtracking search for
 *                 encodings that meet Eqs. 4 and 5.
 *   Section II-B  CHIRP pairing (Eq. 11), the permuted cycle (Algorithm 1,
 *                 Table IV), and the count of round permutations (Table I).
 *
 * Loads as a page script (window.DFSEngine), in a Web Worker
 * (self.DFSEngine), or in Node (module.exports).
 */
(function (root) {
  "use strict";

  /* ---------------------------------------------------------------- KISS2 */

  function parseKiss2(text) {
    var ni = 0, start = null, rows = [], order = [], seen = {};
    text.split(/\r?\n/).forEach(function (raw) {
      var line = raw.replace(/#.*/, "").trim();
      if (!line) return;
      var f = line.split(/\s+/);
      if (f[0] === ".i") ni = +f[1];
      else if (f[0] === ".r") start = f[1];
      else if (f[0].charAt(0) === ".") return;
      else {
        var r = { inp: f[0], cur: f[1], nxt: f[2] };
        rows.push(r);
        [r.cur, r.nxt].forEach(function (s) {
          if (s !== "*" && !seen[s]) { seen[s] = 1; order.push(s); }
        });
      }
    });
    return { ni: ni, start: start, states: order, rows: rows };
  }

  /* Does the union of input cubes cover every input vector? */
  function coversAll(cubes, ni) {
    function rec(list, i) {
      if (!list.length) return false;
      for (var c = 0; c < list.length; c++) if (/^-*$/.test(list[c].slice(i))) return true;
      if (i >= ni) return true;
      var allDash = list.every(function (cu) { return cu.charAt(i) === "-"; });
      if (allDash) return rec(list, i + 1);
      var z = list.filter(function (cu) { return cu.charAt(i) !== "1"; });
      var o = list.filter(function (cu) { return cu.charAt(i) !== "0"; });
      return rec(z, i + 1) && rec(o, i + 1);
    }
    return rec(cubes, 0);
  }

  /*
   * State graph. Two readings of a KISS2 file matter for Table III:
   *   opts.star    "state" (default) keeps a row whose present state is "*"
   *                as an ordinary state named "*", as a plain tokenizer
   *                would; "skip" drops those reset rows.
   *   opts.implied false (default) uses only the self-loops written in the
   *                file; true also adds a self-loop to any state whose rows
   *                leave some input vector unspecified.
   * The defaults reproduce the paper's "BE S*FSM" column for all ten
   * Table III machines; skip + implied reproduces nine of ten (scf
   * differs). See the page's researcher notes.
   */
  function graph(fsm, opts) {
    opts = opts || {};
    var star = opts.star || "state", useImplied = !!opts.implied;
    var names = fsm.states.slice();
    var hasStar = fsm.rows.some(function (r) { return r.cur === "*"; });
    if (star === "state" && hasStar) names.unshift("*");
    var M = names.length, idx = {}, i;
    names.forEach(function (s, k) { idx[s] = k; });
    var edges = {}, self = [], by = [];
    for (i = 0; i < M; i++) { self.push(false); by.push([]); }
    fsm.rows.forEach(function (r) {
      if (!(r.cur in idx) || !(r.nxt in idx)) return;
      var u = idx[r.cur], v = idx[r.nxt];
      by[u].push(r.inp);
      if (u === v) self[u] = true; else edges[u + ">" + v] = [u, v];
    });
    var implied = [];
    for (i = 0; i < M; i++) implied.push(useImplied && !coversAll(by[i], fsm.ni));
    var start = fsm.start in idx ? idx[fsm.start] : (hasStar && star === "state" ? 1 : 0);
    return {
      names: names, start: start,
      edges: Object.keys(edges).map(function (k) { return edges[k]; }),
      selfLoop: self, impliedLoop: implied
    };
  }

  /*
   * S*FSM: every state with a self-loop (explicit or implied) becomes a pair
   * sA, sB. The self-loop now toggles between them, edges into s enter sA,
   * and edges out of s leave from both copies. The result has no self-loops,
   * so every clock edge changes the encoding.
   */
  function sfsm(g) {
    var M = g.names.length, names = [], map = [], i;
    for (i = 0; i < M; i++) {
      if (g.selfLoop[i] || g.impliedLoop[i]) {
        map.push([names.length, names.length + 1]);
        names.push(g.names[i] + "A", g.names[i] + "B");
      } else { map.push([names.length]); names.push(g.names[i]); }
    }
    var e = {};
    g.edges.forEach(function (uv) {
      map[uv[0]].forEach(function (su) { e[su + ">" + map[uv[1]][0]] = [su, map[uv[1]][0]]; });
    });
    for (i = 0; i < M; i++) if (map[i].length === 2) {
      e[map[i][0] + ">" + map[i][1]] = [map[i][0], map[i][1]];
      e[map[i][1] + ">" + map[i][0]] = [map[i][1], map[i][0]];
    }
    return {
      names: names, start: map[g.start][0], origin: map.reduce(function (a, m, k) { m.forEach(function () { a.push(k); }); return a; }, []),
      edges: Object.keys(e).map(function (k) { return e[k]; }),
      selfLoop: names.map(function () { return false; }), impliedLoop: names.map(function () { return false; })
    };
  }

  function bitsFor(n) { var b = 0; while ((1 << b) < n) b++; return Math.max(b, 1); }

  /* ---------------------------------------------------------------- Hamming */

  function hw(x) { var c = 0; while (x) { x &= x - 1; c++; } return c; }
  function hd(a, b) { return hw(a ^ b); }
  function toBits(c, b) { var s = c.toString(2); while (s.length < b) s = "0" + s; return s; }

  /* Undirected, loop-free transition pairs. */
  function pairs(g) {
    var seen = {}, out = [];
    g.edges.forEach(function (uv) {
      if (uv[0] === uv[1]) return;
      var a = Math.min(uv[0], uv[1]), b = Math.max(uv[0], uv[1]), k = a + "-" + b;
      if (!seen[k]) { seen[k] = 1; out.push([a, b]); }
    });
    return out;
  }

  /*
   * Check an encoding against Eq. 4 (constant Hamming weight) and Eq. 5
   * (constant Hamming distance between connected states).
   */
  function check(g, codes) {
    var M = g.names.length, uniq = {}, distinct = true, i;
    for (i = 0; i < M; i++) { if (uniq[codes[i]]) distinct = false; uniq[codes[i]] = 1; }
    var hws = {}, hds = {};
    for (i = 0; i < M; i++) hws[hw(codes[i])] = (hws[hw(codes[i])] || 0) + 1;
    pairs(g).forEach(function (p) { var d = hd(codes[p[0]], codes[p[1]]); hds[d] = (hds[d] || 0) + 1; });
    var hwKeys = Object.keys(hws).map(Number), hdKeys = Object.keys(hds).map(Number);
    return {
      distinct: distinct,
      hwValues: hwKeys, hdValues: hdKeys,
      constHW: hwKeys.length === 1, constHD: hdKeys.length <= 1,
      c1: hwKeys.length === 1 ? hwKeys[0] : null,
      c2: hdKeys.length === 1 ? hdKeys[0] : null
    };
  }

  /* ---------------------------------------------------------------- information */

  function entropy(counts) {
    var n = 0, k, h = 0;
    for (k in counts) n += counts[k];
    for (k in counts) { var p = counts[k] / n; if (p > 0) h -= p * Math.log2(p); }
    return h;
  }

  /*
   * Leakage of an encoding under the paper's two attack models: the static
   * model sees HW(state) and the dynamic model sees HD across a transition.
   * Every state and every directed transition (self-loops included, which
   * show HD = 0) counts once; Eq. 1 uses these frequencies as p(a).
   * Because each observation is a function of the state or transition,
   * the mutual information of Eq. 2 between the hidden state (or
   * transition) and the observation equals the observation's entropy, and
   * it is zero exactly when the observation is constant (Eq. 3).
   */
  function leakage(g, codes) {
    var M = g.names.length, hwC = {}, hdC = {}, i;
    for (i = 0; i < M; i++) { var w = hw(codes[i]); hwC[w] = (hwC[w] || 0) + 1; }
    var list = g.edges.slice();
    for (i = 0; i < M; i++) if (g.selfLoop[i] || g.impliedLoop[i]) list.push([i, i]);
    list.forEach(function (uv) { var d = hd(codes[uv[0]], codes[uv[1]]); hdC[d] = (hdC[d] || 0) + 1; });
    return { hwCounts: hwC, hdCounts: hdC, Hhw: entropy(hwC), Hhd: entropy(hdC), transitions: list.length };
  }

  /* Mutual information of a joint table (Eq. 2), for the worked example. */
  function mutualInformation(joint) {
    var pa = {}, pb = {}, n = 0, a, b, mi = 0;
    for (a in joint) for (b in joint[a]) { n += joint[a][b]; pa[a] = (pa[a] || 0) + joint[a][b]; pb[b] = (pb[b] || 0) + joint[a][b]; }
    for (a in joint) for (b in joint[a]) {
      var p = joint[a][b] / n;
      if (p > 0) mi += p * Math.log2(p / ((pa[a] / n) * (pb[b] / n)));
    }
    return mi;
  }

  /* Npeak (Eq. 8) over all transitions and switching total (Eq. 9, uniform p). */
  function switching(g, codes) {
    var peak = 0, tot = 0, list = g.edges;
    list.forEach(function (uv) {
      var a = codes[uv[0]], b = codes[uv[1]];
      var up = hw(~a & b), down = hw(a & ~b);
      peak = Math.max(peak, up, down);
      tot += up + down;
    });
    return { npeak: peak, meanHD: list.length ? tot / list.length : 0 };
  }

  function binaryCodes(g) { return g.names.map(function (_, i) { return i; }); }

  /* ---------------------------------------------------------------- search */

  function combos(b, k) {
    var out = [];
    (function rec(start, left, acc) {
      if (!left) { out.push(acc); return; }
      for (var i = start; i <= b - left; i++) rec(i + 1, left - 1, acc | (1 << i));
    })(0, k, 0);
    return out;
  }

  /*
   * Backtracking search for an encoding with b bits, every code of weight
   * k (Eq. 4, c1 = k), and Hamming distance c2 on every transition
   * (Eq. 5). States are placed in breadth-first order from the start
   * state; each candidate code must sit at distance c2 from every placed
   * neighbor. The start state takes the lowest code (every weight-k code
   * is equivalent under a bit permutation). Pass k = null to drop Eq. 4.
   * Returns { status: "found" | "none" | "timeout", codes, nodes }.
   */
  function search(g, b, k, c2, opts) {
    opts = opts || {};
    var limit = opts.timeLimit || 2000, now = opts.now || Date.now, t0 = now();
    var M = g.names.length, pool = k == null ? null : combos(b, k);
    var all = pool || (function () { var a = []; for (var c = 0; c < (1 << b); c++) a.push(c); return a; })();
    if (all.length < M) return { status: "none", codes: null, nodes: 0 };
    var adj = g.names.map(function () { return []; });
    pairs(g).forEach(function (p) { adj[p[0]].push(p[1]); adj[p[1]].push(p[0]); });
    // order: BFS from start, then any unreached states
    var order = [], seen = new Uint8Array(M), q = [g.start];
    seen[g.start] = 1;
    while (order.length < M) {
      if (!q.length) { for (var s = 0; s < M; s++) if (!seen[s]) { seen[s] = 1; q.push(s); break; } }
      var x = q.shift(); order.push(x);
      adj[x].forEach(function (y) { if (!seen[y]) { seen[y] = 1; q.push(y); } });
    }
    var codes = new Int32Array(M).fill(-1), used = {}, nodes = 0, timedOut = false;
    function rec(i) {
      if (i === M) return true;
      if ((++nodes & 1023) === 0 && now() - t0 > limit) { timedOut = true; return false; }
      var s = order[i], placed = adj[s].filter(function (y) { return codes[y] >= 0; });
      var cands = i === 0 ? [all[0]] : all;
      for (var c = 0; c < cands.length; c++) {
        var code = cands[c];
        if (used[code]) continue;
        var ok = true;
        for (var j = 0; j < placed.length; j++) if (hd(code, codes[placed[j]]) !== c2) { ok = false; break; }
        if (!ok) continue;
        codes[s] = code; used[code] = 1;
        if (rec(i + 1)) return true;
        if (timedOut) return false;
        codes[s] = -1; used[code] = 0;
      }
      return false;
    }
    var found = rec(0);
    return { status: found ? "found" : (timedOut ? "timeout" : "none"), codes: found ? Array.prototype.slice.call(codes) : null, nodes: nodes };
  }

  /* ---------------------------------------------------------------- CHIRP */

  /* Eq. 11 and Algorithm 1: target = (Pr(C)[r] - self + shift) mod n. */
  function target(n, perm, r, self, shift) {
    var v = (perm[r] - self + (shift || 0)) % n;
    return v < 0 ? v + n : v;
  }
  function cycleTable(n, perm, shift) {
    var rows = [];
    for (var r = 0; r < n; r++) {
      var row = [];
      for (var s = 0; s < n; s++) row.push(target(n, perm, r, s, shift));
      rows.push(row);
    }
    return rows;
  }
  /* Every pair meets once per cycle? Returns the count of distinct pairs. */
  function cyclePairs(n, perm, shift) {
    var met = {}, bad = 0;
    cycleTable(n, perm, shift).forEach(function (row) {
      row.forEach(function (t, s) {
        if (row[t] !== s) bad++;
        if (t !== s) met[Math.min(s, t) + "-" + Math.max(s, t)] = 1;
      });
    });
    return { pairs: Object.keys(met).length, asymmetric: bad };
  }

  /* n! as mantissa and exponent, exact via log10 sums (Table I). */
  function factorialSci(n) {
    var l = 0;
    for (var i = 2; i <= n; i++) l += Math.log10(i);
    var e = Math.floor(l + 1e-12), m = Math.pow(10, l - e);
    if (m >= 9.9999999) { m /= 10; e += 1; }
    return { mantissa: m, exponent: e, log10: l };
  }

  /* Seeded shuffle for the demo (mulberry32 + Fisher-Yates). */
  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function shuffle(n, seed) {
    var p = [], r = rng(seed), i;
    for (i = 0; i < n; i++) p.push(i);
    for (i = n - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)), t = p[i]; p[i] = p[j]; p[j] = t; }
    return p;
  }

  var api = {
    parseKiss2: parseKiss2, coversAll: coversAll, graph: graph, sfsm: sfsm, bitsFor: bitsFor,
    hw: hw, hd: hd, toBits: toBits, pairs: pairs, check: check,
    entropy: entropy, leakage: leakage, mutualInformation: mutualInformation, switching: switching,
    binaryCodes: binaryCodes, combos: combos, search: search,
    target: target, cycleTable: cycleTable, cyclePairs: cyclePairs, factorialSci: factorialSci, shuffle: shuffle
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.DFSEngine = api;
})(typeof self !== "undefined" ? self : this);

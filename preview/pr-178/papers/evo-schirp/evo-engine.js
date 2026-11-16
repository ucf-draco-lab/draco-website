/*
  EVO-SCHIRP engine for /papers/evo-schirp/.

  Wolf, Cooley, Borowczak, and Cheney, "EVO-SCHIRP: Evolved Secure Swarm
  Communications" (2018 IEEE International Smart Cities Conference, ISC2,
  workshop on 5G communication, security, and privacy in smart cities).

  The authors' code is not public. This file implements the method as the
  paper describes it (Section II), with every choice the text leaves open
  marked "PAGE CHOICE" below:

  - A protocol is a matrix M with one row per round and one column per agent;
    M[r][i] is agent i's partner in round r. A full cycle of N agents has N
    rounds. Rounds are zero-based here; Figure 2 numbers them from 1.
  - Unique encoding: M[r][i] is a partner index, or -1 ("*") for no partner.
    An agent that names itself is idle, so it is stored as -1.
  - Paired encoding: M[r][i] is a symbol; agents with matching symbols talk.
  - Single-clique fitness: the number of distinct elements in the lowest
    performing column (agent), plus the number of distinct elements in the
    lowest performing row (round), plus the number of correctly paired
    bidirectional communications. Paired protocols are converted to unique
    encodings first.
  - Multi-clique fitness: the average single-clique score, plus the number of
    distinct elements in corresponding cells across the cliques' matrices,
    scaled against the maximum possible.
  - CPPNs (compositional pattern-producing networks) map the previous round's
    row to the current round's row; round 0 is fed a random row. Evolution
    runs 25 generations; each parent makes one child; tournament selection
    with elitism keeps 50 survivors; mutation rate 0.1 for connections and for
    neurons.

  Loads as a page script (window.EvoEngine) or in Node (module.exports).
*/
(function (root) {
  "use strict";

  var IDLE = -1;

  function mod(a, n) { return ((a % n) + n) % n; }

  /* ------------------------------------------------------------ random numbers */

  /* mulberry32: small, fast, seedable; the page only needs reproducible runs. */
  function rng(seed) {
    var a = seed >>> 0;
    var f = function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    f.int = function (n) { return Math.floor(f() * n); };
    f.normal = function () {
      var u = 0, v = 0;
      while (u === 0) u = f();
      v = f();
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    };
    return f;
  }

  /* ------------------------------------------------------------ CHIRP baseline */

  /* CHIRP (Borowczak and Purdy, ICCE 2018): partner T = (R - I) mod N.
     order, when given, is an S-CHIRP round permutation. Unique encoding. */
  function chirp(n, order) {
    var M = [];
    for (var r = 0; r < n; r++) {
      var R = order ? order[r] : r, row = [];
      for (var i = 0; i < n; i++) {
        var t = mod(R - i, n);
        row.push(t === i ? IDLE : t);
      }
      M.push(row);
    }
    return M;
  }

  function shuffled(n, rand) {
    var p = [];
    for (var i = 0; i < n; i++) p.push(i);
    for (var j = n - 1; j > 0; j--) { var k = rand.int(j + 1); var t = p[j]; p[j] = p[k]; p[k] = t; }
    return p;
  }

  /* ------------------------------------------------------------ encodings */

  /* Unique -> paired. Each bidirectional pair gets one letter; anything else
     becomes "*". PAGE CHOICE: letters are given in order of each pair's lower
     index, starting from A in every round. Figure 2 labels its pairs by hand,
     so letters can differ from the figure while the pairs are the same. */
  function toPaired(M) {
    return M.map(function (row) {
      var out = row.map(function () { return "*"; }), next = 0;
      for (var i = 0; i < row.length; i++) {
        var t = row[i];
        if (t > i && row[t] === i) { var s = String.fromCharCode(65 + (next % 26)); if (next >= 26) s += Math.floor(next / 26); out[i] = s; out[t] = s; next++; }
      }
      return out;
    });
  }

  /* Paired -> unique. Two agents that share a symbol name each other.
     PAGE CHOICE: a symbol held by one agent, or by three or more, gives no
     partner (the paper does not say how a crowded symbol converts). */
  function fromPaired(P) {
    return P.map(function (row) {
      var groups = {};
      row.forEach(function (s, i) { if (s === "*" || s === IDLE || s == null) return; (groups[s] = groups[s] || []).push(i); });
      var out = row.map(function () { return IDLE; });
      Object.keys(groups).forEach(function (k) { var g = groups[k]; if (g.length === 2) { out[g[0]] = g[1]; out[g[1]] = g[0]; } });
      return out;
    });
  }

  /* Normalize a unique matrix: self-targets become idle. */
  function normalize(M) {
    return M.map(function (row) { return row.map(function (t, i) { return t === i ? IDLE : t; }); });
  }

  /* ------------------------------------------------------------ fitness */

  function distinct(arr) {
    var seen = {}, k = 0;
    for (var i = 0; i < arr.length; i++) if (!seen[arr[i]]) { seen[arr[i]] = 1; k++; }
    return k;
  }

  /* Single-clique fitness of a unique matrix (rounds x agents).
     PAGE CHOICE: "*" counts as one element when counting distinct elements
     (CHIRP's columns then hold N distinct elements, matching Figure 2). */
  function fitness(M) {
    var rounds = M.length, n = M[0].length;
    var colMin = Infinity, rowMin = Infinity, pairs = 0, worstAgent = 0, worstRound = 0;
    for (var i = 0; i < n; i++) {
      var col = [];
      for (var r = 0; r < rounds; r++) col.push(M[r][i]);
      var d = distinct(col);
      if (d < colMin) { colMin = d; worstAgent = i; }
    }
    for (var r2 = 0; r2 < rounds; r2++) {
      var d2 = distinct(M[r2]);
      if (d2 < rowMin) { rowMin = d2; worstRound = r2; }
      for (var a = 0; a < n; a++) {
        var t = M[r2][a];
        if (t > a && t < n && M[r2][t] === a) pairs++;
      }
    }
    return { col: colMin, row: rowMin, pairs: pairs, total: colMin + rowMin + pairs, worstAgent: worstAgent, worstRound: worstRound };
  }

  /* Highest possible single-clique score for a full cycle of n agents:
     n distinct elements per column, n per row, and floor(n/2) pairs in each
     of n rounds. */
  function maxFitness(n) { return 2 * n + n * Math.floor(n / 2); }

  /* Distinct handshakes over a cycle (how many of the n(n-1)/2 pairs met). */
  function coverage(M) {
    var n = M[0].length, seen = {}, k = 0;
    M.forEach(function (row) {
      for (var a = 0; a < n; a++) { var t = row[a]; if (t > a && row[t] === a && !seen[a * n + t]) { seen[a * n + t] = 1; k++; } }
    });
    return { met: k, all: n * (n - 1) / 2 };
  }

  /* Multi-clique fitness for c cliques of n agents each (unique matrices).
     PAGE CHOICE: the paper scales the result against the maximum possible.
     Here each half is scaled to [0, 1] and the halves are averaged:
       clique part   = mean single-clique score / maxFitness(n)
       distinct part = mean over cells of (distinct values across cliques - 1)
                       / (min(c, n) - 1)
     so cliques that share one schedule score 0 on the distinct part. */
  function multiFitness(Ms) {
    var c = Ms.length, n = Ms[0][0].length, rounds = Ms[0].length;
    var fits = Ms.map(fitness);
    var meanFit = fits.reduce(function (s, f) { return s + f.total; }, 0) / c;
    var cap = Math.min(c, n) - 1, dsum = 0;
    for (var r = 0; r < rounds; r++) for (var i = 0; i < n; i++) {
      var cell = [];
      for (var k = 0; k < c; k++) cell.push(Ms[k][r][i]);
      dsum += cap > 0 ? (distinct(cell) - 1) / cap : 0;
    }
    var distinctPart = dsum / (rounds * n);
    var cliquePart = meanFit / maxFitness(n);
    return { cliquePart: cliquePart, distinctPart: distinctPart, scaled: 0.5 * cliquePart + 0.5 * distinctPart, fits: fits };
  }

  /* Communication events in one round on a shared channel (Figure 1).
     PAGE CHOICE (the paper defines the four types without a channel model):
     an agent that names index t can reach agent t of every clique; two agents
     link when each names the other's index. An agent whose only link is its
     own clique's partner is valid; one with links only outside its clique is
     invalid; one with its partner plus outside links is in a collision; one
     with no link is inactive. Returns per-agent labels and totals. */
  function channelRound(Ms, r) {
    var c = Ms.length, n = Ms[0][0].length, labels = [], totals = { valid: 0, invalid: 0, collision: 0, inactive: 0 };
    for (var k = 0; k < c; k++) {
      var row = [];
      for (var i = 0; i < n; i++) {
        var t = Ms[k][r][i], own = false, other = 0;
        if (t !== IDLE) {
          for (var k2 = 0; k2 < c; k2++) {
            if (Ms[k2][r][t] !== i) continue;
            if (k2 === k) own = true; else other++;
          }
        }
        var lab = !own && !other ? "inactive" : own && !other ? "valid" : own ? "collision" : "invalid";
        totals[lab]++;
        row.push({ label: lab, target: t, own: own, other: other });
      }
      labels.push(row);
    }
    return { labels: labels, totals: totals };
  }

  /* ------------------------------------------------------------ CPPN */

  var ACTS = {
    sin: function (x) { return Math.sin(x); },
    tanh: function (x) { return Math.tanh(x); },
    gauss: function (x) { return 2 * Math.exp(-x * x) - 1; },
    sigmoid: function (x) { return 2 / (1 + Math.exp(-x)) - 1; },
    abs: function (x) { return Math.min(1, Math.abs(x)) * 2 - 1; },
    identity: function (x) { return Math.max(-1, Math.min(1, x)); }
  };
  var ACT_NAMES = Object.keys(ACTS);

  /* A fully connected network: n inputs (the previous row, scaled to [-1, 1]),
     `layers` hidden layers of n neurons, and n outputs (the next row).
     PAGE CHOICE: weights start N(0, 1), each neuron draws one activation
     from ACT_NAMES, and every layer has a bias. */
  function newNet(n, layers, rand) {
    var L = [];
    for (var l = 0; l <= layers; l++) {
      var w = new Float64Array(n * (n + 1)), act = [];
      for (var j = 0; j < w.length; j++) w[j] = rand.normal();
      for (var u = 0; u < n; u++) act.push(l === layers ? "sigmoid" : ACT_NAMES[rand.int(ACT_NAMES.length)]);
      L.push({ w: w, act: act });
    }
    return { n: n, layers: L };
  }

  function cloneNet(net) {
    return { n: net.n, layers: net.layers.map(function (L) { return { w: new Float64Array(L.w), act: L.act.slice() }; }) };
  }

  /* Mutation: each connection changes with probability pConn (Gaussian step
     of 0.5, PAGE CHOICE), each hidden neuron redraws its activation with
     probability pNeuron. The paper sets both rates to 0.1. */
  function mutate(net, rand, pConn, pNeuron) {
    var child = cloneNet(net), last = child.layers.length - 1;
    child.layers.forEach(function (L, li) {
      for (var j = 0; j < L.w.length; j++) if (rand() < pConn) L.w[j] += 0.5 * rand.normal();
      if (li < last) for (var u = 0; u < L.act.length; u++) if (rand() < pNeuron) L.act[u] = ACT_NAMES[rand.int(ACT_NAMES.length)];
    });
    return child;
  }

  function forward(net, input) {
    var n = net.n, x = input;
    for (var l = 0; l < net.layers.length; l++) {
      var L = net.layers[l], y = new Array(n);
      for (var u = 0; u < n; u++) {
        var s = L.w[u * (n + 1) + n], base = u * (n + 1);
        for (var v = 0; v < n; v++) s += L.w[base + v] * x[v];
        y[u] = ACTS[L.act[u]](s);
      }
      x = y;
    }
    return x;
  }

  /* Step the network through a full cycle. Outputs in [-1, 1] map to
     0..n-1 (unique: partner index; paired: symbol). Returns a unique
     matrix (paired protocols are converted with fromPaired) and the raw
     matrix in its own encoding. */
  function protocol(net, seedRow, encoding) {
    var n = net.n, raw = [], prev = seedRow;
    for (var r = 0; r < n; r++) {
      var out = forward(net, prev), row = [];
      for (var i = 0; i < n; i++) row.push(Math.min(n - 1, Math.floor((out[i] + 1) / 2 * n)));
      raw.push(row);
      prev = row.map(function (v) { return n > 1 ? 2 * v / (n - 1) - 1 : 0; });
    }
    if (encoding === "paired") {
      var P = raw.map(function (row) { return row.map(function (v) { return String.fromCharCode(65 + (v % 26)) + (v >= 26 ? Math.floor(v / 26) : ""); }); });
      return { unique: fromPaired(P), raw: P };
    }
    var U = normalize(raw);
    return { unique: U, raw: U };
  }

  function seedRow(n, rand) { var row = []; for (var i = 0; i < n; i++) row.push(rand() * 2 - 1); return row; }

  /* ------------------------------------------------------------ evolution */

  /* Pareto tournament (PAGE CHOICE on the details): draw `k` individuals
     uniformly at random; keep those not dominated on the objectives; the
     winner is the non-dominated one with the highest summed score. */
  function dominates(a, b) {
    var better = false;
    for (var i = 0; i < a.length; i++) { if (a[i] < b[i]) return false; if (a[i] > b[i]) better = true; }
    return better;
  }
  function tournament(pool, k, rand) {
    var group = [];
    for (var i = 0; i < k; i++) group.push(pool[rand.int(pool.length)]);
    var front = group.filter(function (g) { return !group.some(function (h) { return h !== g && dominates(h.obj, g.obj); }); });
    front.sort(function (a, b) { return b.score - a.score; });
    return front[0];
  }

  /* Evolve one population. opts: n, cliques (1 for phase 1), layers,
     encoding ("unique" or "paired"), generations (25), pop (50),
     tournamentSize (4, PAGE CHOICE), pConn and pNeuron (0.1), seed.
     Returns a stepper: call next() once per generation; each call returns
     {gen, mean, max, scores, best}. Phase 2 genomes hold one CPPN per
     clique, and the score is the scaled multi-clique fitness. */
  function evolver(opts) {
    var o = {
      n: opts.n || 5, cliques: opts.cliques || 1, layers: opts.layers || 5, encoding: opts.encoding || "unique",
      generations: opts.generations || 25, pop: opts.pop || 50, tournamentSize: opts.tournamentSize || 4,
      pConn: opts.pConn == null ? 0.1 : opts.pConn, pNeuron: opts.pNeuron == null ? 0.1 : opts.pNeuron, seed: opts.seed || 1
    };
    var rand = rng(o.seed);
    var seeds = [];
    for (var k = 0; k < o.cliques; k++) seeds.push(seedRow(o.n, rand));

    function evaluate(genome) {
      var Ms = genome.nets.map(function (net, ci) { return protocol(net, seeds[ci], o.encoding).unique; });
      if (o.cliques === 1) {
        var f = fitness(Ms[0]);
        genome.obj = [f.col, f.row, f.pairs];
        genome.score = f.total;
        genome.detail = f;
      } else {
        var m = multiFitness(Ms);
        genome.obj = [m.cliquePart, m.distinctPart];
        genome.score = m.scaled;
        genome.detail = m;
      }
      genome.matrices = Ms;
      return genome;
    }
    function fresh() {
      var nets = [];
      for (var k = 0; k < o.cliques; k++) nets.push(newNet(o.n, o.layers, rand));
      return evaluate({ nets: nets });
    }

    var popn = [], gen = -1;
    for (var p = 0; p < o.pop; p++) popn.push(fresh());

    function summary() {
      var scores = popn.map(function (g) { return g.score; });
      var best = popn.reduce(function (a, b) { return b.score > a.score ? b : a; });
      var mean = scores.reduce(function (s, v) { return s + v; }, 0) / scores.length;
      return { gen: gen, mean: mean, max: best.score, scores: scores, best: best };
    }

    return {
      options: o,
      done: function () { return gen >= o.generations - 1; },
      next: function () {
        gen++;
        if (gen > 0) {
          var kids = popn.map(function (g) {
            return evaluate({ nets: g.nets.map(function (net) { return mutate(net, rand, o.pConn, o.pNeuron); }) });
          });
          var pool = popn.concat(kids);
          var elite = pool.reduce(function (a, b) { return b.score > a.score ? b : a; });
          var next = [elite];
          while (next.length < o.pop) next.push(tournament(pool, o.tournamentSize, rand));
          popn = next;
        }
        return summary();
      }
    };
  }

  /* Random protocols: the score distribution of uniformly random matrices,
     for comparison with an unevolved population. */
  function randomScores(n, encoding, count, seed) {
    var rand = rng(seed || 7), out = [];
    for (var s = 0; s < count; s++) {
      var raw = [];
      for (var r = 0; r < n; r++) { var row = []; for (var i = 0; i < n; i++) row.push(rand.int(n)); raw.push(row); }
      var U = encoding === "paired" ? fromPaired(raw) : normalize(raw);
      out.push(fitness(U).total);
    }
    return out;
  }

  var api = {
    IDLE: IDLE, rng: rng, chirp: chirp, shuffled: shuffled, toPaired: toPaired, fromPaired: fromPaired, normalize: normalize,
    fitness: fitness, maxFitness: maxFitness, coverage: coverage, multiFitness: multiFitness, channelRound: channelRound,
    newNet: newNet, mutate: mutate, forward: forward, protocol: protocol, seedRow: seedRow, evolver: evolver,
    randomScores: randomScores, ACT_NAMES: ACT_NAMES
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.EvoEngine = api;
})(typeof self !== "undefined" ? self : this);

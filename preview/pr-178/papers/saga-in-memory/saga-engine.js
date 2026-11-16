/*
  SAGA engine for /papers/saga-in-memory/: a JavaScript port of the SAGA tool
  (Synthesis Augmentation with Genetic Algorithms) by Andey Robins,
  https://github.com/andey-robins/saga (v0.2.0, commit 6cd8927).

  Ported parts: BLIF loading (parsers/blif, graph/io.go), sequence validity and
  memory simulation (graph/graph.go, memory/memory.go), random valid sequences
  and smart mutation (graph/synthesis.go), and the genetic algorithm
  (genetics/genetics.go). With go-compat.js supplying Go's math/rand and
  sort.Slice, a run with a given seed follows the Go tool step for step.

  Copyright (C) 2024 Andey Robins (original Go implementation)
  Copyright (C) 2026 DRACO Lab, University of Central Florida (JavaScript port)

  This program is free software: you can redistribute it and/or modify it
  under the terms of the GNU General Public License as published by the Free
  Software Foundation, either version 3 of the License, or (at your option)
  any later version. This program is distributed in the hope that it will be
  useful, but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General
  Public License for more details: https://www.gnu.org/licenses/gpl-3.0.html
*/
(function (root) {
  "use strict";

  var GC = root.GoCompat || (typeof require === "function" ? require("./go-compat.js") : null);

  /* ------------------------------------------------------------ graph */

  // Graph over node ids 1..n. Ids follow the Go loader: inputs in header order,
  // outputs in header order, then gate outputs by first appearance (A, Y, B).
  function Graph(n, edges, meta) {
    this.n = n;
    this.parents = [];
    this.children = [];
    for (var i = 0; i <= n; i++) { this.parents.push([]); this.children.push([]); }
    for (var e = 0; e < edges.length; e++) {
      this.children[edges[e][0]].push(edges[e][1]);
      this.parents[edges[e][1]].push(edges[e][0]);
    }
    this.edges = edges.length;
    this.meta = meta || {};
    this.inputs = [];
    this.outputs = [];
    for (var v = 1; v <= n; v++) {
      if (this.parents[v].length === 0) this.inputs.push(v);
      if (this.children[v].length === 0) this.outputs.push(v);
    }
    this.isInput = new Uint8Array(n + 1);
    this.inputs.forEach(function (v) { this.isInput[v] = 1; }, this);
    this.gates = n - this.inputs.length;
    this._rel = null;
  }

  // Descendant and ancestor bitsets, used by SmartMutate (the paper's precomputed peers).
  Graph.prototype.relations = function () {
    if (this._rel) return this._rel;
    var n = this.n, W = (n >> 5) + 1, i, v, w;
    var desc = [], anc = [];
    for (i = 0; i <= n; i++) { desc.push(new Uint32Array(W)); anc.push(new Uint32Array(W)); }
    var order = this.topoOrder();
    for (i = order.length - 1; i >= 0; i--) {
      v = order[i];
      this.children[v].forEach(function (c) {
        desc[v][c >> 5] |= 1 << (c & 31);
        for (w = 0; w < W; w++) desc[v][w] |= desc[c][w];
      });
    }
    for (i = 0; i < order.length; i++) {
      v = order[i];
      this.parents[v].forEach(function (p) {
        anc[v][p >> 5] |= 1 << (p & 31);
        for (w = 0; w < W; w++) anc[v][w] |= anc[p][w];
      });
    }
    this._rel = { desc: desc, anc: anc };
    return this._rel;
  };

  // Kahn order over all nodes (inputs first); used only for precomputation.
  Graph.prototype.topoOrder = function () {
    var n = this.n, indeg = new Int32Array(n + 1), q = [], out = [], v;
    for (v = 1; v <= n; v++) { indeg[v] = this.parents[v].length; if (!indeg[v]) q.push(v); }
    while (q.length) {
      v = q.shift(); out.push(v);
      this.children[v].forEach(function (c) { if (--indeg[c] === 0) q.push(c); });
    }
    return out;
  };

  // Depth (longest path from an input) of every node, for drawing.
  Graph.prototype.depths = function () {
    var d = new Int32Array(this.n + 1), order = this.topoOrder();
    order.forEach(function (v) {
      this.parents[v].forEach(function (p) { if (d[p] + 1 > d[v]) d[v] = d[p] + 1; });
    }, this);
    return d;
  };

  /* ------------------------------------------------------------ BLIF */

  function parseBlif(text) {
    var lines = text.replace(/\\\r?\n/g, " ").split(/\r?\n/);
    var inputs = null, outputs = null, model = "", gates = [];
    lines.forEach(function (raw) {
      var line = raw.replace(/#.*/, "").trim();
      if (!line) return;
      var t = line.split(/\s+/);
      if (t[0] === ".model") model = t[1] || "";
      else if (t[0] === ".inputs") inputs = t.slice(1);
      else if (t[0] === ".outputs") outputs = t.slice(1);
      else if (t[0] === ".gate") {
        var pins = {};
        t.slice(2).forEach(function (kv) { var p = kv.split("="); pins[p[0]] = p[1]; });
        var type = t[1].toUpperCase();
        if (type === "NOT") gates.push({ type: "NOT", a: pins.A, y: pins.Y });
        else if (type === "NOR") gates.push({ type: "NOR", a: pins.A, b: pins.B, y: pins.Y });
        else throw new Error("SAGA reads NOT and NOR gates only, found " + t[1]);
      }
    });
    if (!inputs || !outputs) throw new Error("BLIF needs .inputs and .outputs lines");
    var ids = {}, names = [null];
    function id(label) {
      if (ids[label] == null) { ids[label] = names.length; names.push(label); }
      return ids[label];
    }
    inputs.forEach(id);
    outputs.forEach(id);
    if (names.length - 1 !== inputs.length + outputs.length) throw new Error("Repeated input or output name");
    var edges = [], kinds = [];
    gates.forEach(function (g) {
      if (g.type === "NOT") { edges.push([id(g.a), id(g.y)]); kinds[id(g.y)] = "NOT"; }
      else {
        var a = id(g.a), y = id(g.y), b = id(g.b);
        edges.push([a, y]); edges.push([b, y]);
        kinds[y] = "NOR";
      }
    });
    var n = names.length - 1;
    if (n !== inputs.length + gates.length) throw new Error("Each gate must drive exactly one new signal");
    return new Graph(n, edges, { model: model, names: names, kinds: kinds, inputNames: inputs, outputNames: outputs });
  }

  /* ------------------------------------------------------------ sequences */

  // Go: Graph.IsValidSequence. seq holds every non-input node once.
  function isValid(g, seq) {
    var done = new Uint8Array(g.n + 1), i, v, p;
    for (i = 0; i < g.inputs.length; i++) done[g.inputs[i]] = 1;
    for (i = 0; i < seq.length; i++) {
      v = seq[i];
      if (v < 1 || v > g.n) return false;
      if (!done[v]) {
        p = g.parents[v];
        for (var k = 0; k < p.length; k++) if (!done[p[k]]) return false;
      }
      done[v] = 1;
    }
    return true;
  }

  // Go: Graph.SimulateSequence + memory.Memory. Returns the peak number of cells.
  // With trace = true, also returns where each node was written and when cells were freed.
  function simulate(g, seq, trace) {
    var n = g.n;
    var cellOf = new Int32Array(n + 1).fill(-1);   // node id -> cell while valid
    var refs = new Int32Array(n + 1);              // remaining readers per node
    var occ = [];                                  // cell -> node id, 0 when free
    var live = 0, peak = 0, steps = trace ? [] : null;

    function write(v, parents) {
      var c = occ.indexOf(0);
      if (c < 0) { c = occ.length; occ.push(0); }
      occ[c] = v; cellOf[v] = c; refs[v] = g.children[v].length; live++;
      var freed = trace ? [] : null;
      for (var k = 0; k < parents.length; k++) refs[parents[k]]--;
      // mark and sweep: only the new node and its parents can have reached zero
      if (refs[v] <= 0) { occ[c] = 0; cellOf[v] = -1; live--; if (freed) freed.push([v, c]); }
      for (k = 0; k < parents.length; k++) {
        var p = parents[k], pc = cellOf[p];
        if (pc >= 0 && refs[p] <= 0) { occ[pc] = 0; cellOf[p] = -1; live--; if (freed) freed.push([p, pc]); }
      }
      if (occ.length > peak) peak = occ.length;
      if (steps) steps.push({ v: v, cell: c, freed: freed, live: live, cells: occ.length });
    }

    for (var i = 0; i < g.inputs.length; i++) write(g.inputs[i], []);
    var nIn = steps ? steps.length : 0;
    for (i = 0; i < seq.length; i++) write(seq[i], g.parents[seq[i]]);
    if (!trace) return peak;
    return { peak: occ.length, steps: steps, inputSteps: nIn };
  }

  // Go: Graph.SynthesizeRandomValidSequence(seed). rng: a FastRand (or GoRand).
  function randomValid(g, rng) {
    var n = g.n, inSeq = new Uint8Array(n + 1), seq = [], front = [], i, k;
    function ready(v) {
      var p = g.parents[v];
      for (var j = 0; j < p.length; j++) if (!inSeq[p[j]]) return false;
      return true;
    }
    for (i = 0; i < g.inputs.length; i++) { seq.push(g.inputs[i]); inSeq[g.inputs[i]] = 1; }
    for (i = 0; i < g.inputs.length; i++) {
      var ch = g.children[g.inputs[i]];
      for (k = 0; k < ch.length; k++) if (ready(ch[k])) front.push(ch[k]);
    }
    while (front.length > 0) {
      var r = rng.intn(front.length);
      var v = front[r];
      front.splice(r, 1);
      if (inSeq[v]) continue;
      seq.push(v); inSeq[v] = 1;
      var c = g.children[v];
      for (k = 0; k < c.length; k++) if (ready(c[k])) front.push(c[k]);
    }
    return seq.slice(g.inputs.length);
  }

  // The breadth-first order the paper describes for seeding (FIFO front, no randomness).
  function breadthFirst(g) {
    var n = g.n, inSeq = new Uint8Array(n + 1), seq = [], q = [], head = 0;
    g.inputs.forEach(function (v) { inSeq[v] = 1; });
    function ready(v) { return g.parents[v].every(function (p) { return inSeq[p]; }); }
    g.inputs.forEach(function (v) { g.children[v].forEach(function (c) { if (ready(c)) q.push(c); }); });
    while (head < q.length) {
      var v = q[head++];
      if (inSeq[v]) continue;
      seq.push(v); inSeq[v] = 1;
      g.children[v].forEach(function (c) { if (ready(c)) q.push(c); });
    }
    return seq;
  }

  // Go: Graph.SmartMutate(s, seed). Returns a new array.
  function smartMutate(g, seq, rng) {
    var rel = g.relations(), n = g.n;
    var point = rng.intn(seq.length);
    var a = seq[point];
    var D = rel.desc[a], A = rel.anc[a], cand = [];
    for (var v = 1; v <= n; v++) {
      if (g.isInput[v]) continue;
      if ((D[v >> 5] >>> (v & 31)) & 1) continue;
      if ((A[v >> 5] >>> (v & 31)) & 1) continue;
      cand.push(v);
    }
    // swapping a (at i) with b (at j) keeps the order valid exactly when, after the swap,
    // every parent of the earlier node precedes it and every child of the later node follows it
    var pos = null;
    function validSwap(b) {
      if (b === a) return true;
      if (!pos) { pos = new Int32Array(n + 1).fill(-1); for (var t = 0; t < seq.length; t++) pos[seq[t]] = t; }
      var i = pos[a], j = pos[b], x = a, y = b;
      if (j < i) { var tmp = i; i = j; j = tmp; x = b; y = a; }
      // y moves to i: its parents must sit before i; x moves to j: its children must sit after j
      var p = g.parents[y], c = g.children[x], k;
      for (k = 0; k < p.length; k++) if (pos[p[k]] >= i) return false;
      for (k = 0; k < c.length; k++) if (pos[c[k]] <= j) return false;
      return true;
    }
    var b = cand[rng.intn(cand.length)];
    while (!validSwap(b)) b = cand[rng.intn(cand.length)];
    var out = seq.slice();
    if (b !== a) { out[point] = b; out[pos[b]] = a; }
    return out;
  }

  // Go: the closure inside GA.crossover.
  function crossover(g, s1, s2, pt) {
    var seen = new Uint8Array(g.n + 1), out = s1.slice(0, pt), i;
    for (i = 0; i < out.length; i++) seen[out[i]] = 1;
    for (i = 0; i < s2.length; i++) if (!seen[s2[i]]) { out.push(s2[i]); seen[s2[i]] = 1; }
    return out;
  }

  /* ------------------------------------------------------------ genetic algorithm */

  // Go: genetics.NewGA(size, e, mut, graph, seed, ...). mutationChance is stored
  // but, as in SAGA v0.2.0, every gene is mutated every generation.
  function GA(g, opts) {
    var Rand = (opts.exactRng ? GC.GoRand : GC.FastRand);
    this.g = g;
    this.size = opts.size;
    this.epsilon = opts.epsilon;
    this.mutationChance = opts.mutation == null ? 0.2 : opts.mutation;
    this.seed = opts.seed;
    this.Rand = Rand;
    this.rng = new Rand(opts.seed);
    this.generations = 0;
    this.genes = [];
    var total = 0, best = Infinity, bestGene = null;
    for (var i = 0; i < this.size; i++) {
      var seq = randomValid(g, new Rand(this.rng.intSeed()));
      var f = simulate(g, seq);
      var gene = { seq: seq, fit: f };
      this.genes.push(gene);
      total += f;
      if (f < best) { best = f; bestGene = gene; }
    }
    this.initialFits = this.genes.map(function (x) { return x.fit; });
    this.avg = total / this.size;
    this.best = best;
    this.bestGene = bestGene;
    this.bestSeq = bestGene.seq.slice();       // best sequence ever evaluated (not in the Go tool)
    this.bestEver = best;
    this.lastBest = best;
    this.stale = 0;
    this.history = [];
  }

  GA.prototype.done = function () { return this.stale >= this.epsilon; };

  // One pass of the Go loop body: nextEpoch, then the epsilon bookkeeping of Evolve.
  GA.prototype.step = function () {
    var g = this.g, genes = this.genes, i;
    // evaluation
    for (i = 0; i < genes.length; i++) genes[i].fit = simulate(g, genes[i].seq);
    // execute: stats, sort (Go's unstable sort.Slice), keep the best quarter
    var total = 0;
    for (i = 0; i < genes.length; i++) if (genes[i].fit !== 0) total += genes[i].fit;
    this.avg = total / this.size;
    GC.sortSlice(genes, function (x, y) { return x.fit < y.fit; });
    this.best = genes[0].fit;
    this.bestGene = genes[0];
    if (this.best < this.bestEver) { this.bestEver = this.best; this.bestSeq = genes[0].seq.slice(); }
    genes.length = Math.floor(this.size / 4);
    // crossover: parents drawn from the growing population
    while (genes.length < this.size) {
      var g1 = genes[this.rng.intn(genes.length)];
      var g2 = genes[this.rng.intn(genes.length)];
      var pt = this.rng.intn(g1.seq.length);
      var c1 = { seq: crossover(g, g1.seq, g2.seq, pt), fit: 0 };
      var c2 = { seq: crossover(g, g2.seq, g1.seq, pt), fit: 0 };
      genes.push(c1, c2);
    }
    if (genes.length > this.size) genes.length = this.size;
    // mutate every gene, each with its own seeded generator
    for (i = 0; i < genes.length; i++) {
      genes[i].seq = smartMutate(g, genes[i].seq, new this.Rand(this.rng.intSeed()));
    }
    this.generations++;
    this.history.push({ best: this.best, avg: this.avg });
    if (this.best < this.lastBest) { this.stale = 0; this.lastBest = this.best; }
    else this.stale++;
    return this.best;
  };

  // Go: GA.GetBest. Re-evaluates the final population and returns its best member.
  GA.prototype.finalBest = function () {
    var g = this.g, genes = this.genes, i;
    for (i = 0; i < genes.length; i++) genes[i].fit = simulate(g, genes[i].seq);
    GC.sortSlice(genes, function (x, y) { return x.fit < y.fit && x.fit !== 0; });
    for (i = 0; i < genes.length; i++) {
      if (isValid(g, genes[i].seq) && genes[i].fit !== 0) {
        this.best = genes[i].fit; this.bestGene = genes[i];
        return { fit: genes[i].fit, seq: genes[i].seq.slice() };
      }
    }
    return { fit: 0, seq: this.bestGene.seq.slice() };
  };

  GA.prototype.run = function () {
    while (!this.done()) this.step();
    return this.finalBest();
  };

  /* ------------------------------------------------------------ paper metrics */

  // Efficiency as defined by SIMPLER and used in the paper: 10^6 / (cycles x area).
  function efficiency(cycles, area) { return 1e6 / (cycles * area); }

  root.SagaEngine = {
    Graph: Graph,
    parseBlif: parseBlif,
    isValid: isValid,
    simulate: simulate,
    randomValid: randomValid,
    breadthFirst: breadthFirst,
    smartMutate: smartMutate,
    crossover: crossover,
    GA: GA,
    efficiency: efficiency
  };
  if (typeof module !== "undefined" && module.exports) module.exports = root.SagaEngine;
})(typeof self !== "undefined" ? self : this);

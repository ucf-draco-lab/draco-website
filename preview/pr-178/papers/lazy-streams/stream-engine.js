/*
  Lazy stream engine for /papers/lazy-streams/.
  A JavaScript port of the C++ stream classes in Renz and Borowczak,
  "Implementing Lazy Streams in C++" (Morehead Electronic Journal of Applicable
  Mathematics, 2005): Stream, Successor, Times, Merge, List, Hamming (Figs. 2.1 to 2.13),
  Stirling2 (Fig. 3.1), and Topo with Vertex (Figs. 3.4 and 7.4).

  Each class computes its head eagerly in its constructor and returns a brand-new
  object from tail(), exactly as the paper's classes do. Every constructor bumps a
  counter, so the page can report how many stream objects a computation built.
  The counters are the page's instrumentation; the paper reports no costs.

  Loads as a page script (window.LazyStreams) or in Node (module.exports).
*/
(function (root) {
  "use strict";

  var made = {};
  function bump(kind) { made[kind] = (made[kind] || 0) + 1; }
  function resetCounts() { made = {}; }
  function counts() {
    var out = {}, total = 0;
    Object.keys(made).forEach(function (k) { out[k] = made[k]; total += made[k]; });
    out.total = total;
    return out;
  }

  var nextId = 1;
  // Fig. 2.1: the abstract base. isEmpty starts false; head is set by each subclass.
  function Stream(kind) {
    this.kind = kind;
    this.isEmpty = false;
    this.head = undefined;
    this.id = nextId++;
    bump(kind);
    if (root.LazyStreams && root.LazyStreams.onMake) root.LazyStreams.onMake(this);
  }

  // Fig. 2.2: i, i+1, i+2, ...
  function Successor(i) { Stream.call(this, "Successor"); this.head = i; }
  Successor.prototype.tail = function () { return new Successor(this.head + 1); };

  // Fig. 2.5: every token of s multiplied by n; empty when s is empty.
  function Times(n, s) {
    Stream.call(this, "Times");
    this.multiplier = n; this.inStream = s;
    this.isEmpty = s.isEmpty;
    if (!this.isEmpty) this.head = api.int32 ? Math.imul(n, s.head) : n * s.head;
  }
  Times.prototype.tail = function () { return new Times(this.multiplier, this.inStream.tail()); };

  // Fig. 2.7: merge two increasing streams. On equal heads the second argument
  // goes first and the first keeps its equal token, so duplicates are kept.
  function Merge(a, b) {
    Stream.call(this, "Merge");
    if (a.isEmpty && b.isEmpty) { this.branch1 = a; this.branch2 = b; this.isEmpty = true; }
    else if (b.isEmpty) { this.branch1 = a; this.branch2 = b; }
    else if (a.isEmpty) { this.branch1 = b; this.branch2 = a; }
    else if (a.head < b.head) { this.branch1 = a; this.branch2 = b; }
    else { this.branch1 = b; this.branch2 = a; }
    this.head = this.branch1.head;
  }
  Merge.prototype.tail = function () { return new Merge(this.branch1.tail(), this.branch2); };

  // Fig. 2.12: a bounded stream over an array (offset stands in for the C++ pointer).
  function List(tokens, size, offset) {
    Stream.call(this, "List");
    this.tokens = tokens; this.offset = offset || 0;
    this.size = size == null ? tokens.length : size;
    if (this.size > 0) this.head = tokens[this.offset];
    else this.isEmpty = true;
  }
  List.prototype.tail = function () { return new List(this.tokens, this.size - 1, this.offset + 1); };

  // Fig. 2.13: generalized Hamming stream over a stream of increasing primes.
  // tail() hands `this` to Times, so the stream feeds itself.
  function Hamming(p) {
    Stream.call(this, "Hamming");
    this.p = p;
    this.isEmpty = p.isEmpty;
    if (!this.isEmpty) this.head = p.head;
  }
  Hamming.prototype.tail = function () {
    return new Merge(new Times(this.p.head, this), new Hamming(this.p.tail()));
  };

  // Fig. 3.1: Stirling numbers of the second kind, walked row by row as one stream.
  function Stirling2(x, y) {
    Stream.call(this, "Stirling2");
    this.m = x; this.n = y;
    if (this.m === this.n) { this.head = 1; this.m = 0; this.n++; }
    else if (this.m === 1) this.head = 1;
    else if (this.m === 0 || this.n < this.m) this.head = 0;
    else {
      var a = new Stirling2(this.m - 1, this.n - 1);
      var b = new Stirling2(this.m, this.n - 1);
      this.term1 = a.head; this.term2 = b.head;
      this.head = api.int32 ? (this.term1 + Math.imul(this.m, this.term2)) | 0 : this.term1 + this.m * this.term2;
    }
  }
  Stirling2.prototype.tail = function () { return new Stirling2(this.m + 1, this.n); };

  // Fig. 7.4: a vertex with dependencies and the error/done flags Topo uses.
  function Vertex(ident) { this.ident = ident; this.depends = []; this.error = false; this.done = false; }
  Vertex.prototype.requires = function (deps) { this.depends = deps; };

  // Fig. 3.4: topological sort as a stream. The C++ prints "A cycle was found" and
  // exits; here the stream ends with cycle set to the vertex where it was found.
  function CycleFound(vertex) { this.vertex = vertex; }
  function Topo(vertices, trace) {
    Stream.call(this, "Topo");
    this.vertices = vertices;
    this.vertex = null;
    this.cycle = null;
    for (var i = 0; i < vertices.length; i++) {
      var x = vertices[i];
      if (trace) trace.push({ visit: x.ident, state: x.error ? "error" : x.done ? "done" : "open" });
      if (x.error) throw new CycleFound(x);
      if (x.done) continue;
      x.error = true;
      var t;
      try { t = new Topo(x.depends, trace); }
      finally { x.error = false; }
      this.vertex = t.isEmpty ? x : t.vertex;
      this.vertex.done = true;
      this.head = this.vertex.ident;
      return;
    }
    this.isEmpty = true;
  }
  Topo.prototype.tail = function () { return new Topo(this.vertices); };

  // Wrapper that turns the C++ exit(1) into a value the page can show.
  function topoStart(vertices) {
    vertices.forEach(function (v) { v.done = false; v.error = false; });
    return safeTopo(function () { return new Topo(vertices); });
  }
  function topoNext(t) { return safeTopo(function () { return t.tail(); }); }
  function safeTopo(fn) {
    try { return fn(); }
    catch (e) {
      if (!(e instanceof CycleFound)) throw e;
      var s = { kind: "Topo", isEmpty: true, cycle: e.vertex, tail: function () { return s; } };
      return s;
    }
  }

  // Parse the paper's input format (Figs. 7.3 and 7.5): names up to "-", then one
  // run of 0-based indices per vertex, each ending with "-".
  function parseGraph(text) {
    var tok = String(text).trim().split(/\s+/);
    var k = 0, names = [];
    while (k < tok.length && tok[k].charAt(0) !== "-") names.push(tok[k++]);
    k++;
    var vs = names.map(function (n) { return new Vertex(n); });
    for (var i = 0; i < vs.length; i++) {
      var deps = [];
      while (k < tok.length && tok[k].charAt(0) !== "-") {
        var j = parseInt(tok[k++], 10);
        if (j >= 0 && j < vs.length) deps.push(vs[j]);
      }
      k++;
      vs[i].requires(deps);
    }
    return vs;
  }
  var FIG73 = "e a f c d b -\n1 -\n3 4 -\n1 3 -\n4 -\n-\n0 4 -";

  // Fig. 2.3: the consumer, generalized to n tokens. It calls tail() after every
  // printed token, including the last, as the paper's loop does.
  function take(s, n) {
    var out = [];
    for (var i = 0; i < n && !s.isEmpty; i++) { out.push(s.head); s = s.tail(); }
    return out;
  }

  // Fig. 3.2: the Stirling table, 36 cells read from one stream.
  function stirlingTable(rows) {
    rows = rows || 8;
    var s = new Stirling2(1, 1), table = [];
    for (var n = 1; n <= rows; n++) {
      var row = [];
      for (var m = 1; m <= n; m++) { row.push(s.head); s = s.tail(); }
      table.push(row);
    }
    return table;
  }

  /* ---------------------------------------------------------------- beyond the paper
     A memoized Hamming stream: each node computes its tail once and keeps it, the
     way Haskell shares a list. Built for the page's cost comparison only. */
  function MemoCell(head, thunk) { this.head = head; this.isEmpty = false; this._t = thunk; this._v = null; bump("Cell"); }
  MemoCell.prototype.tail = function () { if (!this._v) { this._v = this._t(); this._t = null; } return this._v; };
  var EMPTY = { isEmpty: true, tail: function () { return EMPTY; } };
  function memoTimes(k, s) { return s.isEmpty ? EMPTY : new MemoCell(k * s.head, function () { return memoTimes(k, s.tail()); }); }
  function memoMerge(a, b) {
    if (a.isEmpty) return b;
    if (b.isEmpty) return a;
    if (a.head < b.head) return new MemoCell(a.head, function () { return memoMerge(a.tail(), b); });
    return new MemoCell(b.head, function () { return memoMerge(a, b.tail()); });
  }
  function memoHamming(primes) {
    if (!primes.length) return EMPTY;
    var self = new MemoCell(primes[0], function () {
      return memoMerge(memoTimes(primes[0], self), memoHamming(primes.slice(1)));
    });
    return self;
  }

  // Cost of n tokens in the paper's style and in the memoized style.
  function hammingCost(primes, n) {
    resetCounts();
    var vals = take(new Hamming(new List(primes.slice())), n);
    var paper = counts();
    resetCounts();
    var mv = take(memoHamming(primes.slice()), n);
    var memo = counts();
    return { values: vals, memoValues: mv, paper: paper, memo: memo };
  }

  /* Fig. 1.2: an eager evaluation of hamming always expands its left descendant
     (times p (hamming (p:ps))) first, so it never reaches a token. This returns the
     first `steps` calls such an evaluation would make. */
  function eagerTrace(primes, steps) {
    var out = [];
    for (var i = 0; i < steps; i++) out.push({ depth: i, call: "hamming [" + primes.join(", ") + "]", next: "times " + primes[0] });
    return out;
  }

  // Fig. 2.14's default primes and the first ten tokens printed in the paper's text.
  var PAPER = {
    hammingPrimes: [3, 5, 11],
    hammingFirstTen: [3, 5, 9, 11, 15, 25, 27, 33, 45, 55],
    stirlingRow8: [1, 127, 966, 1701, 1050, 266, 28, 1],
    topoOrder: ["d", "c", "a", "e", "f", "b"]
  };

  // The paper's head is a C++ int. With int32 on, arithmetic wraps at 32 bits the way
  // that int does on common compilers (used to check the port against compiled C++).
  // The page leaves it off and flags tokens above INT_MAX instead.
  var INT_MAX = 2147483647;
  var api;
  api = {
    Stream: Stream, Successor: Successor, Times: Times, Merge: Merge, List: List,
    Hamming: Hamming, Stirling2: Stirling2, Vertex: Vertex, Topo: Topo,
    topoStart: topoStart, topoNext: topoNext, parseGraph: parseGraph, FIG73: FIG73,
    take: take, stirlingTable: stirlingTable, memoHamming: memoHamming,
    hammingCost: hammingCost, eagerTrace: eagerTrace,
    resetCounts: resetCounts, counts: counts, PAPER: PAPER, onMake: null,
    int32: false, INT_MAX: INT_MAX
  };
  root.LazyStreams = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof self !== "undefined" ? self : this);

/*
  Simulated sample set for /papers/tlsh-ransomware/.
  The paper's 162 ransomware binaries are not redistributable, so the
  pipeline demo runs on synthetic byte strings instead. Each "program" is a
  list of function-sized chunks. A family has one or more builds (a base
  program with a share of its chunks rewritten), and each sample is a build
  with light edits (chunks replaced, inserted, deleted, or swapped). A packed
  sample keeps a small loader and replaces the rest with random bytes, the
  way an encrypted payload looks to a byte-level hash. Shared runtime chunks
  appear in every family. Family sizes follow the paper's Table I (81, 45,
  27, 9); builds and packed counts were chosen so the stand-in set has a
  shape like the paper's Figure 2, so the cluster count it produces is a
  property of the simulation, not a finding.
  Requires tlsh-engine.js (TLSHEngine).
*/
(function (root) {
  "use strict";

  function rng(seed) {
    var s = seed >>> 0 || 1;
    return function () {
      s = (s + 0x6d2b79f5) >>> 0;
      var t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // A family's "instruction set": a skewed byte distribution plus common pairs.
  function makeAlphabet(r) {
    var weights = [], total = 0;
    for (var b = 0; b < 256; b++) {
      var w = Math.pow(r(), 4);
      weights.push(w); total += w;
    }
    var cdf = [], acc = 0;
    for (b = 0; b < 256; b++) { acc += weights[b] / total; cdf.push(acc); }
    return function (r2) {
      var u = r2(), lo = 0, hi = 255;
      while (lo < hi) { var mid = (lo + hi) >> 1; if (cdf[mid] < u) lo = mid + 1; else hi = mid; }
      return lo;
    };
  }

  function makeChunk(r, alpha) {
    var n = 120 + Math.floor(r() * 520);
    var c = new Uint8Array(n);
    for (var i = 0; i < n; i++) c[i] = alpha(r);
    // function prologue and epilogue bytes, like a compiler leaves
    c[0] = 0x55; c[1] = 0x48; c[2] = 0x89; c[3] = 0xe5; c[n - 2] = 0x5d; c[n - 1] = 0xc3;
    return c;
  }

  function concat(chunks) {
    var n = 0, i;
    for (i = 0; i < chunks.length; i++) n += chunks[i].length;
    var out = new Uint8Array(n), o = 0;
    for (i = 0; i < chunks.length; i++) { out.set(chunks[i], o); o += chunks[i].length; }
    return out;
  }

  // Light edits: each chunk is rewritten with probability rate; a few inserts, deletes, swaps.
  function mutate(chunks, rate, r, alpha) {
    var out = chunks.slice();
    for (var i = 0; i < out.length; i++) if (r() < rate) out[i] = makeChunk(r, alpha);
    var ops = Math.floor(rate * out.length);
    for (var k = 0; k < ops; k++) {
      var p = Math.floor(r() * out.length), q = Math.floor(r() * out.length), u = r();
      if (u < 0.34) out.splice(p, 0, makeChunk(r, alpha));
      else if (u < 0.67 && out.length > 4) out.splice(p, 1);
      else { var t = out[p]; out[p] = out[q]; out[q] = t; }
    }
    return out;
  }

  function pack(chunks, r) {
    var loader = chunks.slice(0, 3);
    var n = 0;
    for (var i = 3; i < chunks.length; i++) n += chunks[i].length;
    var blob = new Uint8Array(n);
    for (i = 0; i < n; i++) blob[i] = Math.floor(r() * 256);
    return loader.concat([blob]);
  }

  var BUILD_SHIFT = 0.5; // share of chunks rewritten between builds of one family

  var FAMILIES = [
    { name: "Revil", n: 81, builds: [78], packed: 3 },
    { name: "Darkside", n: 45, builds: [12, 9, 7, 6], packed: 11 },
    { name: "WannaCry", n: 27, builds: [16], packed: 11 },
    { name: "TrickBoot", n: 9, builds: [5, 4], packed: 0 }
  ];

  // Build the 162-sample set. opts.edit is the light-edit rate per sample (default 0.04).
  function build(opts) {
    opts = opts || {};
    var edit = opts.edit == null ? 0.04 : opts.edit;
    var r = rng(opts.seed || 2021);
    var runtimeAlpha = makeAlphabet(r);
    var runtime = [];
    for (var i = 0; i < 8; i++) runtime.push(makeChunk(r, runtimeAlpha));
    var samples = [];
    FAMILIES.forEach(function (fam, fi) {
      var alpha = makeAlphabet(r);
      var base = [];
      var nChunks = 50 + Math.floor(r() * 20);
      for (var c = 0; c < nChunks; c++) base.push(makeChunk(r, alpha));
      // runtime chunks sit at the front, as statically linked code would
      base = runtime.slice(0, 5).concat(base);
      var seq = 0;
      fam.builds.forEach(function (count, bi) {
        var b = bi === 0 ? base : mutate(base, BUILD_SHIFT, r, alpha);
        for (var s = 0; s < count; s++) {
          var chunks = mutate(b, edit, r, alpha);
          samples.push({ family: fi, build: bi, packed: false, id: fam.name.slice(0, 2).toUpperCase() + (++seq), bytes: concat(chunks) });
        }
      });
      for (var p = 0; p < fam.packed; p++) {
        var bb = fam.builds.length > 1 ? Math.floor(r() * fam.builds.length) : 0;
        var src = mutate(base, edit, r, alpha);
        samples.push({ family: fi, build: bb, packed: true, id: fam.name.slice(0, 2).toUpperCase() + (++seq), bytes: concat(pack(src, r)) });
      }
    });
    return samples;
  }

  // Hash every sample and fill the distance matrix (TLSH with the length term).
  function analyze(samples, E) {
    var n = samples.length, digests = [], i, j;
    for (i = 0; i < n; i++) digests.push(E.hash(samples[i].bytes));
    var D = new Float64Array(n * n), max = 0;
    for (i = 0; i < n; i++) for (j = i + 1; j < n; j++) {
      var d = E.diff(digests[i], digests[j]);
      D[i * n + j] = D[j * n + i] = d;
      if (d > max) max = d;
    }
    return { n: n, digests: digests, D: D, max: max };
  }

  // Connected components of the graph whose edges have distance <= cutoff.
  function components(A, cutoff) {
    var n = A.n, seen = new Int32Array(n).fill(-1), comps = [];
    for (var s = 0; s < n; s++) {
      if (seen[s] >= 0) continue;
      var stack = [s], members = [];
      seen[s] = comps.length;
      while (stack.length) {
        var v = stack.pop(); members.push(v);
        for (var w = 0; w < n; w++) if (seen[w] < 0 && w !== v && A.D[v * n + w] <= cutoff) { seen[w] = comps.length; stack.push(w); }
      }
      comps.push(members.sort(function (a, b) { return a - b; }));
    }
    return comps;
  }

  // Mean and standard deviation of the scaled similarity over a cluster's full n x n matrix.
  function clusterStats(A, members, max) {
    var vals = [];
    members.forEach(function (a) { members.forEach(function (b) { vals.push(1 - A.D[a * A.n + b] / max); }); });
    var m = vals.reduce(function (s, v) { return s + v; }, 0) / vals.length;
    var v2 = vals.reduce(function (s, v) { return s + (v - m) * (v - m); }, 0) / vals.length;
    var raw = 0, cnt = 0;
    for (var i = 0; i < members.length; i++) for (var j = i + 1; j < members.length; j++) { raw += A.D[members[i] * A.n + members[j]]; cnt++; }
    return { mean: m, sd: Math.sqrt(v2), rawMean: cnt ? raw / cnt : 0 };
  }

  root.TLSHSim = { FAMILIES: FAMILIES, build: build, analyze: analyze, components: components, clusterStats: clusterStats, rng: rng };
})(typeof self !== "undefined" ? self : this);

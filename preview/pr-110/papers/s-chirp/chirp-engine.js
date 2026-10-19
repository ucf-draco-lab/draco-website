/*
  CHIRP and S-CHIRP engine for /papers/s-chirp/.

  Borowczak and Purdy, "S-CHIRP: Secure Communication for Heterogeneous IoTs
  with Round-Robin Protection" (IEEE ICCE 2018; arXiv:1710.00381), and
  Wolf, Cooley, and Borowczak, "S-CHIRP: Securing Communications in
  Lightweight Peer-to-Peer Networks in the IoT" (IEEE Potentials 38(1), 2019).

  Round indices are zero-based (r = 0 is the first round of a cycle). Figures
  in the Potentials article number rounds from 1, so its "round k" is r = k - 1.
  Loads as a page script (window.ChirpEngine) or in Node (module.exports).
*/
(function (root) {
  "use strict";

  function mod(a, n) { return ((a % n) + n) % n; }

  /* Eq. 2 (CHIRP) and Eq. 6 (S-CHIRP): a node's partner in round r.
     perm, when given, is the cycle permutation Pr(C). */
  function target(r, self, count, perm) {
    var c = perm ? perm[mod(r, count)] : r;
    return mod(c - self, count);
  }

  /* Eq. 4: the round index implied by an inbound node index. With a
     permutation this returns Pr(C)[r], the permuted round value. */
  function roundFromInbound(inbound, self, count) { return mod(inbound + self, count); }

  /* Eq. 1: theoretical lower bound on rounds for a complete graph. */
  function rMin(n) { return n % 2 === 0 ? n - 1 : n; }

  /* Eq. 3: communication-efficiency loss when Node_cnt exceeds Node_actual. */
  function ceLoss(count, actual) { return (count - actual) / count; }

  /* The pairs formed in round r among the nodes present (array of booleans,
     or null for all present). Returns {pairs, selfLoops, idle}. idle lists
     present nodes whose partner is absent. */
  function roundPairs(r, count, present, perm) {
    var pairs = [], selfLoops = [], idle = [];
    for (var s = 0; s < count; s++) {
      if (present && !present[s]) continue;
      var t = target(r, s, count, perm);
      if (t === s) selfLoops.push(s);
      else if (present && !present[t]) idle.push(s);
      else if (s < t) pairs.push([s, t]);
    }
    return { pairs: pairs, selfLoops: selfLoops, idle: idle };
  }

  /* Run one full cycle and report what the paper claims about it. */
  function cycle(count, present, perm) {
    var seen = {}, rounds = [], dup = 0, edges = 0, nodeRounds = 0, wasted = 0;
    var selfCount = new Array(count).fill(0);
    var nPresent = 0;
    for (var s = 0; s < count; s++) if (!present || present[s]) nPresent++;
    for (var r = 0; r < count; r++) {
      var rp = roundPairs(r, count, present, perm);
      rp.pairs.forEach(function (p) {
        var k = p[0] * count + p[1];
        if (seen[k]) dup++; else { seen[k] = r; edges++; }
      });
      rp.selfLoops.forEach(function (s) { selfCount[s]++; });
      nodeRounds += nPresent;
      wasted += rp.idle.length;
      rounds.push(rp);
    }
    var maxEdges = nPresent * (nPresent - 1) / 2;
    return {
      rounds: rounds,
      edges: edges,
      maxEdges: maxEdges,
      complete: edges === maxEdges && dup === 0,
      duplicates: dup,
      selfOncePerCycle: selfCount.every(function (c, s) { return (present && !present[s]) || c === 1; }),
      minPairsPerRound: Math.min.apply(null, rounds.map(function (x) { return x.pairs.length; })),
      wastedFraction: nPresent ? wasted / nodeRounds : 0,
      meetRound: seen
    };
  }

  /* n! to three significant figures, as Table III reports it. */
  function factorialSci(n) {
    var f = 1n;
    for (var i = 2n; i <= BigInt(n); i++) f *= i;
    var s = f.toString();
    var exp = s.length - 1;
    var mant = Number(s.slice(0, 1) + "." + s.slice(1, 8));
    return { exact: s, mantissa: mant, exponent: exp };
  }
  function sigFigs(m, digits, truncate) {
    var p = Math.pow(10, digits - 1);
    return (truncate ? Math.floor(m * p + 1e-9) : Math.round(m * p)) / p;
  }

  /* Seeded generator (mulberry32) for repeatable shuffles. */
  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  /* Fisher-Yates (Durstenfeld) shuffle of [0 .. n-1]. */
  function fisherYates(n, rand) {
    var a = [];
    for (var i = 0; i < n; i++) a.push(i);
    for (var j = n - 1; j > 0; j--) {
      var k = Math.floor(rand() * (j + 1));
      var t = a[j]; a[j] = a[k]; a[k] = t;
    }
    return a;
  }
  /* Sattolo's variant (footnote 1): a uniformly random single n-cycle. */
  function sattolo(n, rand) {
    var a = [];
    for (var i = 0; i < n; i++) a.push(i);
    for (var j = n - 1; j > 0; j--) {
      var k = Math.floor(rand() * j);
      var t = a[j]; a[j] = a[k]; a[k] = t;
    }
    return a;
  }

  /* Bytes to store one cycle permutation with 32-bit indices (Section II-B). */
  function permBytes(n) { return 4 * n; }

  /* ------------------------------------------------------------------
     Collocated cliques (Potentials 2019). Each clique k has `size` devices
     with identifiers 0 .. size-1 and uses device count `count` >= size in
     Eq. 2. All cliques share one channel and one global round counter, so an
     identifier names a device in every clique that has it.

     Event rules are this page's formalization of the article's Fig. 3:
       valid     two devices of the same clique compute each other;
       invalid   two devices of different cliques compute each other;
       collision devices of two or more cliques compute the same identifier,
                 and some device holds that identifier;
       inactive  a device computes an identifier no device in its own clique
                 holds (empty slot);
       self      a device computes its own identifier (its checkpoint round).
  ------------------------------------------------------------------ */
  function cliqueRound(r, cliques) {
    var devs = [];
    cliques.forEach(function (c, k) {
      for (var i = 0; i < c.size; i++) devs.push({ k: k, id: i, t: mod(r - i, c.count) });
    });
    var byId = {};
    devs.forEach(function (d) { (byId[d.id] = byId[d.id] || []).push(d); });
    var out = { valid: 0, invalid: 0, collision: 0, inactive: 0, self: 0, links: [] };
    var targetCliques = {};
    devs.forEach(function (d) {
      if (d.t === d.id) { out.self++; return; }
      (targetCliques[d.t] = targetCliques[d.t] || {})[d.k] = true;
      if (d.t >= cliques[d.k].size) out.inactive++;
    });
    for (var a = 0; a < devs.length; a++) {
      for (var b = a + 1; b < devs.length; b++) {
        var x = devs[a], y = devs[b];
        if (x.t === y.id && y.t === x.id && x.id !== y.id) {
          if (x.k === y.k) { out.valid++; out.links.push({ kind: "valid", a: x, b: y }); }
          else { out.invalid++; out.links.push({ kind: "invalid", a: x, b: y }); }
        }
      }
    }
    Object.keys(targetCliques).forEach(function (t) {
      if (Object.keys(targetCliques[t]).length > 1 && byId[t]) out.collision++;
    });
    return out;
  }

  function gcd(a, b) { while (b) { var t = b; b = a % b; a = t; } return a; }
  function lcm(a, b) { return a / gcd(a, b) * b; }

  /* Rounds (zero-based) in [0, horizon) where every clique starts a cycle
     together, and where all cliques sit at the same position in their cycles. */
  function alignment(counts, horizon) {
    var starts = [], same = [];
    for (var r = 0; r < horizon; r++) {
      if (counts.every(function (c) { return r % c === 0; })) starts.push(r);
      var p = r % counts[0];
      if (counts.every(function (c) { return r % c === p; })) same.push(r);
    }
    return { starts: starts, same: same, period: counts.reduce(lcm) };
  }

  function isPrime(n) {
    if (n < 2) return false;
    for (var d = 2; d * d <= n; d++) if (n % d === 0) return false;
    return true;
  }
  /* Distinct prime device counts: each clique gets the smallest prime
     greater than its size that no other clique has taken. One reading of the
     article's "nearest unique prime number"; it reproduces the Fig. 6 example
     (sizes 4 and 2 become counts 5 and 3). */
  function distinctPrimes(sizes) {
    var order = sizes.map(function (s, i) { return i; }).sort(function (a, b) { return sizes[b] - sizes[a]; });
    var used = {}, out = new Array(sizes.length);
    order.forEach(function (i) {
      var p = sizes[i] + 1;
      while (!isPrime(p) || used[p]) p++;
      used[p] = true;
      out[i] = p;
    });
    return out;
  }

  /* Totals over `horizon` rounds starting at r = 0. */
  function cliqueTotals(cliques, horizon) {
    var tot = { valid: 0, invalid: 0, collision: 0, inactive: 0, self: 0, crossRounds: 0 };
    for (var r = 0; r < horizon; r++) {
      var x = cliqueRound(r, cliques);
      ["valid", "invalid", "collision", "inactive", "self"].forEach(function (k) { tot[k] += x[k]; });
      if (x.invalid || x.collision) tot.crossRounds++;
    }
    return tot;
  }

  var api = {
    mod: mod,
    target: target,
    roundFromInbound: roundFromInbound,
    rMin: rMin,
    ceLoss: ceLoss,
    roundPairs: roundPairs,
    cycle: cycle,
    factorialSci: factorialSci,
    sigFigs: sigFigs,
    rng: rng,
    fisherYates: fisherYates,
    sattolo: sattolo,
    permBytes: permBytes,
    cliqueRound: cliqueRound,
    cliqueTotals: cliqueTotals,
    alignment: alignment,
    lcm: lcm,
    isPrime: isPrime,
    distinctPrimes: distinctPrimes,
    PAPER_PERM: [7, 5, 2, 0, 4, 6, 1, 3]
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.ChirpEngine = api;
})(typeof self !== "undefined" ? self : this);

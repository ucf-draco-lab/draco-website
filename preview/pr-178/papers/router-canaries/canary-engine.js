/*
  Router canaries: a browser model of the experiment in W. Howard and
  M. Borowczak, "Detecting DDoS Attacks Near the Edge with Router Canaries,"
  IEEE ICCE-Berlin 2020, doi:10.1109/ICCE-Berlin50680.2020.9352164.

  Adapted from the authors' Canary package (github.com/whoward3/canary,
  PyPI canary-pkg-whoward3 1.0.1). Canary, Copyright (C) 2020 Winston Howard.
  The Canary package is distributed under the GNU General Public License,
  version 3; this adaptation is distributed under the same license.

  Ported from the authors' code, line for line:
    CanaryShark.evalutator   window entropy over 50 destination IPs (Eq. 3),
                             flag when entropy < threshold
    CanaryShark.canary       count IP packets, evaluate every 50, report after
                             five consecutive flagged windows, then reset
    CanaryShark.main         canary placement: n distinct random.randint(1, s)
    CanaryDriver.start       attacker list: 5s distinct random.randint(0, 5s),
                             first int(5s * c) of them; thresholds per topology
    ReportScraper            detection time = log entries from all canaries
                             before the first report; success rate truncated
                             with int(); threshold = 0.90 * mean entropy
    network_initializer      5s hosts, host i on switch i mod s, switches in
                             a chain; host addresses 10.42.0.(s + 1 + i)
    nodeClient / pingAttack  clients ping 10.42.0.($RANDOM % 61) once, in a
                             loop; attackers ping 10.42.0.12 every second

  Modeled, because the paper ran them in the CORE emulator: timing of each
  ping (a reply arrives at once; a ping to an address with no host costs the
  client FAIL_WAIT seconds), and capture on every bridge port (a packet
  crossing a switch is logged once per port it passes, so twice per switch).

  Python's random module (MT19937, seeded with an integer) is reproduced
  draw for draw, so a seed gives the same attackers and canary sites as the
  authors' scripts.

  Loads as a page script (window.RouterCanary) or in a worker.
*/
(function (root) {
  "use strict";

  /* ------------------------------------------------ Python's random module */

  function PyRandom(seed) {
    this.mt = new Uint32Array(624);
    this.mti = 625;
    this.seed(seed == null ? 0 : seed);
  }
  PyRandom.prototype.initGenrand = function (s) {
    var mt = this.mt;
    mt[0] = s >>> 0;
    for (var i = 1; i < 624; i++) {
      var prev = mt[i - 1] ^ (mt[i - 1] >>> 30);
      mt[i] = (Math.imul(1812433253, prev) + i) >>> 0;
    }
    this.mti = 624;
  };
  PyRandom.prototype.seed = function (seed) {
    // random.seed(int): key = |seed| as little-endian 32-bit words
    var n = Math.abs(Math.floor(seed));
    var key = [];
    if (n === 0) key = [0];
    while (n > 0) { key.push(n % 4294967296); n = Math.floor(n / 4294967296); }
    this.initGenrand(19650218);
    var mt = this.mt, i = 1, j = 0, k = Math.max(624, key.length);
    for (; k; k--) {
      var p = mt[i - 1] ^ (mt[i - 1] >>> 30);
      mt[i] = ((mt[i] ^ Math.imul(p, 1664525)) + key[j] + j) >>> 0;
      i++; j++;
      if (i >= 624) { mt[0] = mt[623]; i = 1; }
      if (j >= key.length) j = 0;
    }
    for (k = 623; k; k--) {
      var q = mt[i - 1] ^ (mt[i - 1] >>> 30);
      mt[i] = ((mt[i] ^ Math.imul(q, 1566083941)) - i) >>> 0;
      i++;
      if (i >= 624) { mt[0] = mt[623]; i = 1; }
    }
    mt[0] = 0x80000000;
    this.mti = 624;
  };
  PyRandom.prototype.u32 = function () {
    var mt = this.mt, y, kk;
    if (this.mti >= 624) {
      for (kk = 0; kk < 624; kk++) {
        y = (mt[kk] & 0x80000000) | (mt[(kk + 1) % 624] & 0x7fffffff);
        mt[kk] = mt[(kk + 397) % 624] ^ (y >>> 1) ^ ((y & 1) ? 0x9908b0df : 0);
      }
      this.mti = 0;
    }
    y = mt[this.mti++];
    y ^= y >>> 11;
    y ^= (y << 7) & 0x9d2c5680;
    y ^= (y << 15) & 0xefc60000;
    y ^= y >>> 18;
    return y >>> 0;
  };
  PyRandom.prototype.getrandbits = function (k) { return this.u32() >>> (32 - k); };
  PyRandom.prototype.randbelow = function (n) {
    var k = 0, m = n;
    while (m > 0) { k++; m = Math.floor(m / 2); }
    var r = this.getrandbits(k);
    while (r >= n) r = this.getrandbits(k);
    return r;
  };
  PyRandom.prototype.randint = function (a, b) { return a + this.randbelow(b - a + 1); };
  PyRandom.prototype.random = function () {
    var a = this.u32() >>> 5, b = this.u32() >>> 6;
    return (a * 67108864 + b) / 9007199254740992;
  };

  /* ------------------------------------------------ authors' logic */

  var WINDOW = 50;            // packets per entropy window (Eqs. 2 and 3)
  var CONSECUTIVE = 5;        // flagged windows in a row before a report
  var THRESHOLD_FACTOR = 0.9; // Eq. 4
  // canary_driver.py and Table I
  var PAPER_THRESHOLDS = { 3: 3.0111, 6: 3.4200, 9: 3.3790 };
  var DEFAULT_THRESHOLD = 3.5; // canary_shark.py default when -t is absent

  // CanaryShark.evalutator: entropy of a window of destination counts. The
  // authors divide every count by 50, so counts must sum to one window.
  // math.log(k / 50, 2) for k = 1..50, as Python (glibc) computes it; a few
  // browsers round Math.log differently in the last bit.
  var LOG2_K50 = [0,
    -5.643856189774724, -4.643856189774724, -4.058893689053568, -3.6438561897747253, -3.321928094887362,
    -3.0588936890535687, -2.8365012677171206, -2.643856189774725, -2.473931188332412, -2.321928094887362,
    -2.1844245711374275, -2.0588936890535687, -1.9434164716336324, -1.8365012677171204, -1.7369655941662063,
    -1.6438561897747248, -1.556393348524385, -1.4739311883324124, -1.3959286763311392, -1.3219280948873622,
    -1.2515387669959643, -1.1844245711374275, -1.1202942337177118, -1.0588936890535685, -1.0,
    -0.9434164716336324, -0.8889686876112561, -0.8365012677171205, -0.7858751946471527, -0.7369655941662062,
    -0.6896598793878495, -0.6438561897747247, -0.5994620704162712, -0.5563933485243853, -0.5145731728297583,
    -0.47393118833241243, -0.4344028241457749, -0.3959286763311392, -0.3584539709124763, -0.3219280948873623,
    -0.2863041851566411, -0.2515387669959645, -0.2175914350726268, -0.18442457113742744, -0.15200309344504997,
    -0.12029423371771177, -0.08926733809708741, -0.058893689053568565, -0.029146345659516508, 0.0
  ];
  function windowEntropy(counts) {
    var res = 0;
    for (var ip in counts) {
      if (!Object.prototype.hasOwnProperty.call(counts, ip)) continue;
      var p = counts[ip] / WINDOW;
      res += p * LOG2_K50[counts[ip]];
    }
    return 0 - res;
  }
  function evaluate(counts, thresh) { return windowEntropy(counts) < thresh ? 1 : 0; }

  // CanaryDriver.start: attacker list for s switches and composition c.
  function pickAttackers(rng, s, c) {
    var nodes = [];
    for (var a = 0; a < s * 5; a++) {
      for (;;) {
        var rnd = rng.randint(0, s * 5);
        if (nodes.indexOf(rnd) < 0) { nodes.push(rnd); break; }
      }
    }
    var slc = nodes.length * c;
    return nodes.slice(0, Math.trunc(slc));
  }
  // CanaryShark.main: n distinct bridge ids in 1..s.
  function pickCanaries(rng, s, n) {
    var canaries = [];
    for (var a = 0; a < n; a++) {
      for (;;) {
        var rnd = rng.randint(1, s);
        if (canaries.indexOf(rnd) < 0) { canaries.push(rnd); break; }
      }
    }
    return canaries;
  }

  // network_initializer.py: host i on switch i mod s; node ids are 1..s for
  // switches and s + 1 .. 6s for hosts, and CORE addresses each host
  // 10.42.0.<node id>.
  function topology(s) {
    var hosts = [];
    for (var i = 0; i < s * 5; i++) hosts.push({ idx: i, octet: s + 1 + i, sw: i % s });
    var byOctet = {};
    hosts.forEach(function (h) { byOctet[h.octet] = h; });
    return { s: s, hosts: hosts, byOctet: byOctet, victim: byOctet[12] ? byOctet[12].idx : -1 };
  }

  /* ------------------------------------------------ traffic model */

  // Small fast generator for the emulated traffic (bash $RANDOM, timing).
  function Xor128(seed) {
    var x = (seed ^ 0x9e3779b9) >>> 0 || 1, y = 362436069, z = 521288629, w = (seed * 2654435761) >>> 0 || 88675123;
    for (var i = 0; i < 16; i++) next();
    function next() {
      var t = x ^ (x << 11); x = y; y = z; z = w;
      w = (w ^ (w >>> 19) ^ (t ^ (t >>> 8))) >>> 0;
      return w;
    }
    this.u32 = next;
  }
  Xor128.prototype.unif = function () { return this.u32() / 4294967296; };
  Xor128.prototype.bashRandom = function () { return this.u32() & 32767; };

  var DEFAULTS = {
    s: 6, c: 0.25, n: 6, threshold: null, seed: 1,
    duration: 300,      // canary capture length, seconds (time_delta - 30)
    startDelay: 20,     // driver waits 20 s between network and canaries
    failWait: 3,        // a ping to an empty address: ARP gives up after 3 s
    okWait: 0.01,       // a ping that gets a reply returns at once
    attackInterval: 1,  // ping's default interval
    perPort: true,      // a canary logs a packet on each port it crosses
    keepLog: false,
    keepCounts: false
  };

  function opts(o) {
    var r = {};
    Object.keys(DEFAULTS).forEach(function (k) { r[k] = (o && o[k] != null) ? o[k] : DEFAULTS[k]; });
    if (r.threshold == null) r.threshold = PAPER_THRESHOLDS[r.s] != null ? PAPER_THRESHOLDS[r.s] : DEFAULT_THRESHOLD;
    return r;
  }

  // Binary heap of [time, seq, host]
  function Heap() { this.a = []; }
  Heap.prototype.push = function (t, s, h) {
    var a = this.a, i = a.length; a.push([t, s, h]);
    while (i > 0) { var p = (i - 1) >> 1; if (less(a[i], a[p])) { var x = a[i]; a[i] = a[p]; a[p] = x; i = p; } else break; }
  };
  Heap.prototype.pop = function () {
    var a = this.a, top = a[0], last = a.pop();
    if (a.length) {
      a[0] = last; var i = 0;
      for (;;) {
        var l = 2 * i + 1, r = l + 1, m = i;
        if (l < a.length && less(a[l], a[m])) m = l;
        if (r < a.length && less(a[r], a[m])) m = r;
        if (m === i) break;
        var x = a[i]; a[i] = a[m]; a[m] = x; i = m;
      }
    }
    return top;
  };
  function less(u, v) { return u[0] < v[0] || (u[0] === v[0] && u[1] < v[1]); }

  /*
    One trial. Returns the attackers and canaries chosen, every window each
    canary evaluated, and the first detection as the scraper counts it.
  */
  function trial(o) {
    o = opts(o);
    var s = o.s, topo = topology(s);
    var py = new PyRandom(o.seed);
    var attackers = pickAttackers(py, s, o.c);
    var canaryIds = pickCanaries(py, s, o.n);
    var isAtt = new Array(s * 5).fill(false);
    attackers.forEach(function (a) { if (a < s * 5) isAtt[a] = true; });
    var canaryAt = new Array(s).fill(-1);       // switch -> canary slot
    canaryIds.forEach(function (b, k) { canaryAt[b - 1] = k; });

    var tr = new Xor128((o.seed * 7919 + s * 131 + Math.round(o.c * 100) * 17 + o.n) >>> 0);
    var heap = new Heap(), seq = 0;
    topo.hosts.forEach(function (h) {
      heap.push(tr.unif() * (isAtt[h.idx] ? o.attackInterval : 0.5), seq++, h.idx);
    });

    var start = o.startDelay, stop = o.startDelay + o.duration;
    var cs = canaryIds.map(function (b) {
      return { bridge: b, sw: b - 1, counts: {}, count: 0, flags: 0, windows: [], packets: 0, reports: [] };
    });
    var global = 0;              // log entries from all canaries, in order
    var first = null;            // first report: { packets, time, bridge }
    var log = o.keepLog ? [] : null;
    var victimOctet = 12;

    function observe(t, srcOct, dstOct, srcSw, dstSw) {
      if (t < start || t >= stop) return;
      var lo = Math.min(srcSw, dstSw), hi = Math.max(srcSw, dstSw);
      for (var w = lo; w <= hi; w++) {
        var k = canaryAt[w];
        if (k < 0) continue;
        var copies = o.perPort ? 2 : 1;
        for (var cp = 0; cp < copies; cp++) see(cs[k], t, dstOct, srcOct);
      }
    }
    function see(c, t, dstOct, srcOct) {
      global++;
      c.packets++;
      if (log) log.push("\n" + c.bridge + ": Destination: 10.42.0." + dstOct + "\n" + c.bridge + ": Source: 10.42.0." + srcOct + "\n" + c.bridge + ": Time: " + t.toFixed(6) + "\n");
      var key = "10.42.0." + dstOct;
      c.counts[key] = (c.counts[key] || 0) + 1;
      c.count++;
      if (c.count === WINDOW) {
        var H = windowEntropy(c.counts);
        var flag = H < o.threshold ? 1 : 0;
        c.windows.push(o.keepCounts ? { H: H, flag: flag, t: t, at: global, counts: c.counts } : { H: H, flag: flag, t: t, at: global });
        if (log) log.push("\n@" + c.bridge + ": Bridge Entropy: " + pyFloat(H) + "\n@" + c.bridge + ": IP Table: {}\n@" + c.bridge + ": Time: " + t.toFixed(6) + "\n");
        if (flag === 0) c.flags = 0; else c.flags += flag;
        c.count = 0; c.counts = {};
      }
      if (c.flags === CONSECUTIVE) {
        c.reports.push({ t: t, at: global });
        if (log) log.push("\n~" + c.bridge + ": THRESHOLD VIOLATED, TIME: " + t.toFixed(6));
        if (!first) first = { packets: global, time: t - start, bridge: c.bridge };
        c.flags = 0;
      }
    }
    // The scraper counts packet entries before the first "~". The report is
    // logged after the packet that closed the fifth window, so the count is
    // every packet logged so far, across all canaries.
    function pyFloat(x) { var r = String(x); return /[.e]/.test(r) ? r : r + ".0"; }

    while (heap.a.length) {
      var ev = heap.pop(), t = ev[0], hi = ev[2];
      if (t >= stop) break;
      var h = topo.hosts[hi];
      if (isAtt[hi]) {
        // pingAttack: ping 10.42.0.12 once a second, forever
        var v = topo.byOctet[victimOctet];
        if (v && v.idx !== hi) {
          observe(t, h.octet, v.octet, h.sw, v.sw);
          observe(t + 1e-4, v.octet, h.octet, v.sw, h.sw);
        }
        heap.push(t + o.attackInterval, seq++, hi);
      } else {
        // nodeClient: ping -c 1 10.42.0.($RANDOM % 61)
        var oct = tr.bashRandom() % 61;
        var d = topo.byOctet[oct];
        if (d && d.idx !== hi) {
          observe(t, h.octet, d.octet, h.sw, d.sw);
          observe(t + 1e-4, d.octet, h.octet, d.sw, h.sw);
          heap.push(t + o.okWait, seq++, hi);
        } else if (d && d.idx === hi) {
          heap.push(t + o.okWait, seq++, hi);       // loopback, never on a bridge
        } else {
          heap.push(t + o.failWait, seq++, hi);     // no host there: ARP times out
        }
      }
    }

    return {
      opts: o,
      attackers: attackers,
      canaries: canaryIds,
      victim: topo.victim,
      windows: cs.map(function (c) { return { bridge: c.bridge, sw: c.sw, windows: c.windows, packets: c.packets, reports: c.reports.length, reportList: c.reports }; }),
      totalEntries: global,
      detection: first,
      log: log
    };
  }

  /*
    A set of trials at one (s, c, n), summarized the way canary_scraper.py
    summarizes a folder of reports.
  */
  function summarize(trials) {
    var ent = [], det = [], fails = 0;
    trials.forEach(function (r) {
      r.windows.forEach(function (c) { c.windows.forEach(function (w) { ent.push(w.H); }); });
      if (r.detection) det.push(r.detection.packets); else fails++;
    });
    var out = { trials: trials.length, windows: ent.length, detections: det.length };
    if (ent.length) {
      var m = mean(ent);
      out.maxE = Math.max.apply(null, ent); out.minE = Math.min.apply(null, ent);
      out.meanE = m; out.sdE = sd(ent); out.threshold = m * THRESHOLD_FACTOR;
    }
    out.meanDetect = det.length ? mean(det) : null;
    out.rate = det.length ? Math.trunc(det.length / (det.length + fails) * 100) : 0; // int(), as the scraper
    out.rateExact = trials.length ? det.length / trials.length : 0;
    return out;
  }
  function mean(a) { var x = 0; for (var i = 0; i < a.length; i++) x += a[i]; return x / a.length; }
  function sd(a) { var m = mean(a), v = 0; for (var i = 0; i < a.length; i++) v += (a[i] - m) * (a[i] - m); return Math.sqrt(v / (a.length - 1)); }

  function runSet(o, count, firstSeed) {
    var out = [];
    for (var k = 0; k < count; k++) out.push(trial(Object.assign({}, o, { seed: (firstSeed || 1) + k })));
    return out;
  }

  var api = {
    PyRandom: PyRandom,
    WINDOW: WINDOW, CONSECUTIVE: CONSECUTIVE, THRESHOLD_FACTOR: THRESHOLD_FACTOR,
    PAPER_THRESHOLDS: PAPER_THRESHOLDS, DEFAULTS: DEFAULTS,
    windowEntropy: windowEntropy, evaluate: evaluate,
    pickAttackers: pickAttackers, pickCanaries: pickCanaries, topology: topology,
    trial: trial, runSet: runSet, summarize: summarize, mean: mean, sd: sd
  };
  root.RouterCanary = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof self !== "undefined" ? self : this);

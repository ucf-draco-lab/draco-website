/*
  Portable Tor router engine for /papers/portable-tor-router/.

  1. AES-128 (FIPS-197) in counter mode (NIST SP 800-38A), written out in plain
     JavaScript so it runs the same in a page, a Web Worker, and Node. Checked
     against the FIPS-197 and SP 800-38A test vectors and against Node's crypto
     module (see the PR for the check script).
  2. A teaching onion: the router wraps a request in three layers, one per
     relay, each layer naming the next hop, the way Section II-B of the paper
     describes onion routing. Keys are drawn from a seeded generator here; real
     Tor agrees on them with each relay through a key exchange.
  3. The paper's speed tests, read off Figures 2 to 5 (bin edges and counts),
     with the arithmetic the page reports: sample sizes, ranges, bounds on the
     means, and (graduate and researcher levels) rank tests computed by the page.
*/
(function (root) {
  "use strict";

  /* ------------------------------------------------------------ AES-128 */

  var SBOX = new Uint8Array(256);
  (function buildSbox() {
    // Multiplicative inverse in GF(2^8), then the affine map (FIPS-197 5.1.1).
    var p = 1, q = 1;
    do {
      p = p ^ ((p << 1) & 0xff) ^ (p & 0x80 ? 0x1b : 0);
      q ^= q << 1; q ^= q << 2; q ^= q << 4; q &= 0xff;
      if (q & 0x80) q ^= 0x09;
      var x = q ^ ((q << 1) | (q >> 7)) ^ ((q << 2) | (q >> 6)) ^ ((q << 3) | (q >> 5)) ^ ((q << 4) | (q >> 4));
      SBOX[p] = (x ^ 0x63) & 0xff;
    } while (p !== 1);
    SBOX[0] = 0x63;
  })();

  function xtime(b) { return ((b << 1) ^ (b & 0x80 ? 0x1b : 0)) & 0xff; }

  function expandKey(key) {
    if (key.length !== 16) throw new Error("AES-128 needs a 16-byte key");
    var w = new Uint8Array(176), rcon = 1, i;
    w.set(key);
    for (i = 16; i < 176; i += 4) {
      var t0 = w[i - 4], t1 = w[i - 3], t2 = w[i - 2], t3 = w[i - 1];
      if (i % 16 === 0) {
        var tmp = t0;
        t0 = SBOX[t1] ^ rcon; t1 = SBOX[t2]; t2 = SBOX[t3]; t3 = SBOX[tmp];
        rcon = xtime(rcon);
      }
      w[i] = w[i - 16] ^ t0; w[i + 1] = w[i - 15] ^ t1; w[i + 2] = w[i - 14] ^ t2; w[i + 3] = w[i - 13] ^ t3;
    }
    return w;
  }

  function encryptBlock(w, input) {
    var s = new Uint8Array(16), t = new Uint8Array(16), r, c, i;
    for (i = 0; i < 16; i++) s[i] = input[i] ^ w[i];
    for (r = 1; r <= 10; r++) {
      // SubBytes + ShiftRows (state is column-major: s[4c + row])
      for (c = 0; c < 4; c++) for (var row = 0; row < 4; row++) t[4 * c + row] = SBOX[s[4 * ((c + row) % 4) + row]];
      if (r < 10) {
        for (c = 0; c < 4; c++) {
          var a0 = t[4 * c], a1 = t[4 * c + 1], a2 = t[4 * c + 2], a3 = t[4 * c + 3], all = a0 ^ a1 ^ a2 ^ a3;
          s[4 * c] = a0 ^ all ^ xtime(a0 ^ a1);
          s[4 * c + 1] = a1 ^ all ^ xtime(a1 ^ a2);
          s[4 * c + 2] = a2 ^ all ^ xtime(a2 ^ a3);
          s[4 * c + 3] = a3 ^ all ^ xtime(a3 ^ a0);
        }
      } else s.set(t);
      for (i = 0; i < 16; i++) s[i] ^= w[16 * r + i];
    }
    return s;
  }

  // Counter mode: keystream = AES(K, counter block), counter incremented as a
  // 128-bit big-endian integer. Encryption and decryption are the same call.
  function ctr(key, iv, data) {
    var w = expandKey(key), out = new Uint8Array(data.length), cb = new Uint8Array(iv), ks, i, j;
    for (i = 0; i < data.length; i += 16) {
      ks = encryptBlock(w, cb);
      for (j = 0; j < 16 && i + j < data.length; j++) out[i + j] = data[i + j] ^ ks[j];
      for (j = 15; j >= 0; j--) { cb[j] = (cb[j] + 1) & 0xff; if (cb[j]) break; }
    }
    return out;
  }

  /* ------------------------------------------------------------ bytes */

  function utf8(str) {
    if (typeof TextEncoder !== "undefined") return new TextEncoder().encode(str);
    return new Uint8Array(Buffer.from(str, "utf8"));
  }
  function fromUtf8(bytes) {
    if (typeof TextDecoder !== "undefined") return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
    return Buffer.from(bytes).toString("utf8");
  }
  function hex(bytes, max) {
    var n = max ? Math.min(max, bytes.length) : bytes.length, s = "";
    for (var i = 0; i < n; i++) s += (bytes[i] < 16 ? "0" : "") + bytes[i].toString(16);
    return s;
  }
  function fromHex(h) {
    var out = new Uint8Array(h.length / 2);
    for (var i = 0; i < out.length; i++) out[i] = parseInt(h.substr(2 * i, 2), 16);
    return out;
  }
  function concat(a, b) { var o = new Uint8Array(a.length + b.length); o.set(a); o.set(b, a.length); return o; }

  // Small seeded generator (mulberry32) for demo keys, IVs, and relay picks.
  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function randomBytes(r, n) { var b = new Uint8Array(n); for (var i = 0; i < n; i++) b[i] = Math.floor(r() * 256); return b; }

  /* ------------------------------------------------------------ the onion */

  // Relay names and addresses are invented for the demo (documentation ranges).
  var RELAY_POOL = [
    { name: "Aspen", addr: "198.51.100.23" }, { name: "Basalt", addr: "203.0.113.71" },
    { name: "Cedar", addr: "192.0.2.144" }, { name: "Dune", addr: "198.51.100.187" },
    { name: "Ember", addr: "203.0.113.9" }, { name: "Fjord", addr: "192.0.2.58" },
    { name: "Granite", addr: "198.51.100.212" }, { name: "Harbor", addr: "203.0.113.130" },
    { name: "Iris", addr: "192.0.2.201" }, { name: "Juniper", addr: "198.51.100.66" }
  ];

  function circuit(seed) {
    var r = rng(seed), pool = RELAY_POOL.slice(), roles = ["entry", "middle", "exit"], hops = [];
    for (var k = 0; k < 3; k++) {
      var pick = pool.splice(Math.floor(r() * pool.length), 1)[0];
      hops.push({ role: roles[k], name: pick.name, addr: pick.addr, key: randomBytes(r, 16), iv: randomBytes(r, 16) });
    }
    return { seed: seed, hops: hops, siteKey: randomBytes(r, 16), siteIv: randomBytes(r, 16) };
  }

  // A layer's plaintext is a one-line header naming the next hop, then the inner bytes.
  function header(nextAddr) { return utf8("NEXT " + nextAddr + "\n"); }

  /*
    wrap(circ, opts) with opts = { site, path, message, https }.
    Returns the bytes at every stage, outermost first:
      stages[0]: what leaves the router toward the entry relay
      stages[1]: what the entry relay forwards to the middle relay
      stages[2]: what the middle relay forwards to the exit relay
      stages[3]: what the exit relay sends to the website
  */
  function wrap(circ, opts) {
    var request = utf8("GET " + (opts.path || "/") + " HTTP/1.1\nHost: " + opts.site + "\n\n" + (opts.message || ""));
    var toSite = opts.https ? ctr(circ.siteKey, circ.siteIv, request) : request;
    var dest = opts.site + (opts.https ? ":443" : ":80");
    var h = circ.hops;
    var p3 = concat(header(dest), toSite);            // exit layer plaintext
    var c3 = ctr(h[2].key, h[2].iv, p3);
    var p2 = concat(header(h[2].addr), c3);           // middle layer plaintext
    var c2 = ctr(h[1].key, h[1].iv, p2);
    var p1 = concat(header(h[1].addr), c2);           // entry layer plaintext
    var c1 = ctr(h[0].key, h[0].iv, p1);
    return {
      request: request, toSite: toSite, dest: dest,
      layers: [{ plain: p1, cipher: c1 }, { plain: p2, cipher: c2 }, { plain: p3, cipher: c3 }],
      stages: [c1, c2, c3, toSite]
    };
  }

  // A relay removes its own layer and reads the next hop.
  function peel(hop, bytes) {
    var plain = ctr(hop.key, hop.iv, bytes);
    var nl = plain.indexOf(10);
    var line = fromUtf8(plain.subarray(0, nl));
    return { next: line.replace(/^NEXT /, ""), inner: plain.subarray(nl + 1), headerOk: line.indexOf("NEXT ") === 0 };
  }

  /*
    Who learns what, for each observer, under the three switches in the demo.
    Every entry restates a sentence of the paper (Sections II-B, IV-B, V):
      - router off: the network sees source, destination, timing, and (for HTTP) content.
      - entry relay knows the sender's public address, not the destination or content.
      - middle relay knows only its two neighbors.
      - exit relay sees destination and, without HTTPS, plain text; not the sender.
      - DNS leak: a lookup outside Tor shows where the user is going.
      - devices on the router's own Wi-Fi see traffic before it reaches Tor.
  */
  function observers(o) {
    var tor = o.tor, https = o.https, dnsTor = o.dnsViaTor;
    function row(who, src, dst, content, note) { return { who: who, source: src, dest: dst, content: content, note: note }; }
    var rows = [];
    rows.push(row("wifi", "yes", "yes", https ? "no" : "yes",
      "Traffic on the router's own Wi-Fi has not reached Tor yet."));
    if (!tor) {
      rows.push(row("isp", "yes", "yes", https ? "no" : "yes", "Without Tor the network upstream sees every packet's header."));
      rows.push(row("dns", "yes", "yes", "no", "The lookup names the site before the page loads."));
      rows.push(row("site", "yes", "yes", "yes", "The site sees your public address."));
      return rows;
    }
    rows.push(row("isp", "yes", "no", "no", "It sees encrypted traffic to an entry relay, its size and timing, and that Tor is in use."));
    rows.push(row("dns", dnsTor ? "no" : "yes", dnsTor ? "no" : "yes", "no",
      dnsTor ? "Lookups travel through Tor; the leak test found none." : "A lookup outside Tor is a DNS leak: it names the site."));
    rows.push(row("entry", "yes", "no", "no", "Knows who you are, not where you are going."));
    rows.push(row("middle", "no", "no", "no", "Knows only the relays on either side."));
    rows.push(row("exit", "no", "yes", https ? "no" : "yes",
      https ? "Knows the site, sees only HTTPS ciphertext." : "Knows the site and reads plain text."));
    rows.push(row("site", "no", "yes", "yes", "Sees the exit relay's address, not yours."));
    return rows;
  }

  /* ------------------------------------------------------------ speed tests */

  // Read off Figures 2 to 5 (600 dpi render of the IEEE PDF; axis ticks used
  // for calibration, about ±0.006 Mb/s on downloads and ±0.0006 on uploads).
  // Each bin: [lower edge, upper edge, count], speeds in Mb/s.
  var FIG = {
    torDown:    { fig: 2, label: "Download, through the Tor router", n: 30, titleN: 30,
                  bins: [[0.527, 0.961, 6], [0.961, 1.383, 10], [1.383, 1.817, 7], [1.817, 2.257, 5], [2.257, 2.691, 2]] },
    directDown: { fig: 3, label: "Download, without Tor", n: 10, titleN: 30,
                  bins: [[7.928, 8.339, 5], [8.339, 8.767, 1], [8.767, 9.184, 2], [9.184, 9.601, 2]] },
    torUp:      { fig: 4, label: "Upload, through the Tor router", n: 30, titleN: 30,
                  bins: [[0.010, 0.133, 2], [0.133, 0.255, 4], [0.255, 0.377, 9], [0.377, 0.498, 10], [0.498, 0.619, 5]] },
    directUp:   { fig: 5, label: "Upload, without Tor", n: 10, titleN: 30,
                  bins: [[0.311, 0.397, 1], [0.397, 0.484, 1], [0.484, 0.570, 1], [0.570, 0.657, 3], [0.657, 0.742, 3], [0.742, 0.829, 1]] }
  };
  // Averages printed in Section IV-A (labeled "MB/s" in the text; the figures are in Mb/s).
  var REPORTED = { torDown: 1.7, directDown: 8.3 };

  function summary(key) {
    var f = FIG[key], n = 0, lo = 0, hi = 0, mid = 0;
    f.bins.forEach(function (b) { n += b[2]; lo += b[0] * b[2]; hi += b[1] * b[2]; mid += (b[0] + b[1]) / 2 * b[2]; });
    // The histogram's outer edges are the smallest and largest measurements, so
    // one value sits at each edge; the rest can sit anywhere inside their bins.
    var first = f.bins[0], last = f.bins[f.bins.length - 1];
    var loT = (lo - last[0] + last[1]) / n;   // all at lower edges, one value at the maximum
    var hiT = (hi - first[1] + first[0]) / n; // all at upper edges, one value at the minimum
    var modeBin = f.bins.reduce(function (a, b) { return b[2] > a[2] ? b : a; });
    return {
      n: n, titleN: f.titleN, min: first[0], max: last[1],
      meanLow: loT, meanHigh: hiT, meanMid: mid / n, modeBin: modeBin,
      reported: REPORTED[key] == null ? null : REPORTED[key]
    };
  }

  // Share of measurements at or below x, as a range when x falls inside a bin.
  function shareBelow(key, x) {
    var f = FIG[key], n = 0, sure = 0, maybe = 0;
    f.bins.forEach(function (b) { n += b[2]; if (b[1] <= x) sure += b[2]; else if (b[0] < x) maybe += b[2]; });
    return { n: n, low: sure, high: sure + maybe };
  }

  // Time to move a file of `megabytes` (decimal MB, 8 megabits each) at `mbps`.
  function seconds(megabytes, mbps) { return megabytes * 8 / mbps; }

  // Per-bin download times for a file: [fastest, slowest, count] per bin.
  function timeBins(key, megabytes) {
    return FIG[key].bins.map(function (b) { return [seconds(megabytes, b[1]), seconds(megabytes, b[0]), b[2]]; });
  }

  // log of the binomial coefficient, for exact rank-test p-values.
  function lchoose(n, k) {
    var s = 0; for (var i = 1; i <= k; i++) s += Math.log(n - k + i) - Math.log(i);
    return s;
  }

  /*
    Mann-Whitney U from binned data: U counts pairs (x from A, y from B) with x > y.
    Pairs from bins that do not overlap are decided; pairs from overlapping bins
    are not, so U is reported as a range [Umin, Umax].
  */
  function uRange(keyA, keyB) {
    var A = FIG[keyA].bins, B = FIG[keyB].bins, lo = 0, hi = 0, nA = 0, nB = 0;
    A.forEach(function (a) { nA += a[2]; });
    B.forEach(function (b) { nB += b[2]; });
    A.forEach(function (a) {
      B.forEach(function (b) {
        var pairs = a[2] * b[2];
        if (a[0] >= b[1]) { lo += pairs; hi += pairs; }
        else if (a[1] > b[0]) { hi += pairs; }
      });
    });
    return { nA: nA, nB: nB, Umin: lo, Umax: hi, pairs: nA * nB };
  }

  // Exact two-sided p for complete separation (U = 0 or U = nA nB): 2 / C(nA + nB, nA).
  function separationP(nA, nB) { return 2 * Math.exp(-lchoose(nA + nB, nA)); }

  /*
    Exact null distribution of U (no ties) by the standard recursion
    N(u; m, n) = N(u - n; m - 1, n) + N(u; m, n - 1), kept as probabilities.
    Returns the two-sided p-value for an observed U: 2 * min(P(U <= u), P(U >= u)), capped at 1.
  */
  function mwP(nA, nB, U) {
    var max = nA * nB, m, n, u;
    // f[n][u] for the current m; start with m = 0: only U = 0 is possible.
    var prev = [];
    for (n = 0; n <= nB; n++) { prev.push(new Float64Array(max + 1)); prev[n][0] = 1; }
    for (m = 1; m <= nA; m++) {
      var cur = [];
      for (n = 0; n <= nB; n++) {
        var row = new Float64Array(max + 1);
        if (n === 0) row[0] = 1;
        else {
          var wA = m / (m + n), wB = n / (m + n);
          for (u = 0; u <= m * n; u++) row[u] = (u - n >= 0 ? wA * prev[n][u - n] : 0) + wB * cur[n - 1][u];
        }
        cur.push(row);
      }
      prev = cur;
    }
    var dist = prev[nB], lower = 0, upper = 0;
    for (u = 0; u <= max; u++) { if (u <= U) lower += dist[u]; if (u >= U) upper += dist[u]; }
    return Math.min(1, 2 * Math.min(lower, upper));
  }

  /* ------------------------------------------------------------ slowest link */

  // The paper: "the overall speed of the connection will invariably get
  // throttled by the slowest node in the chain." The demo uses only that rule.
  function chainSpeed(links) {
    var min = Infinity, at = -1;
    links.forEach(function (v, i) { if (v < min) { min = v; at = i; } });
    return { mbps: min, slowest: at };
  }

  var api = {
    aes: { expandKey: expandKey, encryptBlock: encryptBlock, ctr: ctr },
    utf8: utf8, fromUtf8: fromUtf8, hex: hex, fromHex: fromHex, rng: rng,
    circuit: circuit, wrap: wrap, peel: peel, observers: observers,
    FIG: FIG, REPORTED: REPORTED, summary: summary, shareBelow: shareBelow,
    seconds: seconds, timeBins: timeBins, uRange: uRange, separationP: separationP, mwP: mwP, lchoose: lchoose,
    chainSpeed: chainSpeed
  };
  root.TorRouter = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof self !== "undefined" ? self : this);

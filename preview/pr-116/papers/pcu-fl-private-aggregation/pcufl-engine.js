/*
  PCU-FL engine for /papers/pcu-fl-private-aggregation/.

  Browser port of the aggregation arithmetic in Shah and Borowczak, "Discrete
  Gaussian Integer Aggregation and Trust-Budget Gating for Federated Learning in
  IoT-Enabled CPS" (IEEE CARS 2025), following the paper's Eq. (1) and
  Algorithms 2 and 3, and the authors' repository (github.com/cybw90/PCU-FL,
  commit ce7ae83) where the paper leaves a detail open.

  Adapted from PCU-FL (noise_commit.py, pcu_algo.py, server_ops.py):
    MIT License
    Copyright (c) [2025]
    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:
    The above copyright notice and this permission notice shall be included in all
    copies or substantial portions of the Software.
    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE.

  What is reproduced exactly (checked against the repository's Python):
    - derive_gaussian: HMAC-SHA256 counter DRBG, uint64 -> [0,1] uniforms, and
      the inverse-CDF table sampler, draw for draw (numpy's pairwise sum included);
    - get_noise_multiplier: sigma_t = sqrt(2 ln(1.25/delta)) / epsilon;
    - the Hamilton largest-remainder integer weights of _verify_and_gate_with_trust
      (with the weight vector exposed as an argument);
    - Eq. (1), the normalized sensitivity Delta*_2.
  Loads as a page script or in a Web Worker.
*/
(function (root) {
  "use strict";

  /* ---------------------------------------------------------------- SHA-256 */

  var K256 = new Uint32Array([
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ]);
  var W = new Uint32Array(64);

  function sha256(bytes) {
    var len = bytes.length;
    var nblk = ((len + 9 + 63) >> 6);
    var buf = new Uint8Array(nblk * 64);
    buf.set(bytes);
    buf[len] = 0x80;
    var bits = len * 8;
    var hi = Math.floor(bits / 4294967296), lo = bits >>> 0;
    var e = buf.length;
    buf[e - 8] = hi >>> 24; buf[e - 7] = hi >>> 16; buf[e - 6] = hi >>> 8; buf[e - 5] = hi;
    buf[e - 4] = lo >>> 24; buf[e - 3] = lo >>> 16; buf[e - 2] = lo >>> 8; buf[e - 1] = lo;
    var h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a,
        h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;
    for (var off = 0; off < buf.length; off += 64) {
      for (var i = 0; i < 16; i++) {
        var j = off + i * 4;
        W[i] = (buf[j] << 24) | (buf[j + 1] << 16) | (buf[j + 2] << 8) | buf[j + 3];
      }
      for (i = 16; i < 64; i++) {
        var w15 = W[i - 15], w2 = W[i - 2];
        var s0 = ((w15 >>> 7) | (w15 << 25)) ^ ((w15 >>> 18) | (w15 << 14)) ^ (w15 >>> 3);
        var s1 = ((w2 >>> 17) | (w2 << 15)) ^ ((w2 >>> 19) | (w2 << 13)) ^ (w2 >>> 10);
        W[i] = (W[i - 16] + s0 + W[i - 7] + s1) | 0;
      }
      var a = h0, b = h1, c = h2, d = h3, f = h5, g = h6, h = h7, ee = h4;
      for (i = 0; i < 64; i++) {
        var S1 = ((ee >>> 6) | (ee << 26)) ^ ((ee >>> 11) | (ee << 21)) ^ ((ee >>> 25) | (ee << 7));
        var ch = (ee & f) ^ (~ee & g);
        var t1 = (h + S1 + ch + K256[i] + W[i]) | 0;
        var S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
        var mj = (a & b) ^ (a & c) ^ (b & c);
        var t2 = (S0 + mj) | 0;
        h = g; g = f; f = ee; ee = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
      }
      h0 = (h0 + a) | 0; h1 = (h1 + b) | 0; h2 = (h2 + c) | 0; h3 = (h3 + d) | 0;
      h4 = (h4 + ee) | 0; h5 = (h5 + f) | 0; h6 = (h6 + g) | 0; h7 = (h7 + h) | 0;
    }
    var out = new Uint8Array(32), hs = [h0, h1, h2, h3, h4, h5, h6, h7];
    for (i = 0; i < 8; i++) {
      out[i * 4] = hs[i] >>> 24; out[i * 4 + 1] = hs[i] >>> 16; out[i * 4 + 2] = hs[i] >>> 8; out[i * 4 + 3] = hs[i];
    }
    return out;
  }

  function utf8(str) {
    if (typeof TextEncoder !== "undefined") return new TextEncoder().encode(str);
    var out = [];
    for (var i = 0; i < str.length; i++) {
      var c = str.charCodeAt(i);
      if (c < 128) out.push(c);
      else if (c < 2048) out.push(192 | (c >> 6), 128 | (c & 63));
      else out.push(224 | (c >> 12), 128 | ((c >> 6) & 63), 128 | (c & 63));
    }
    return new Uint8Array(out);
  }
  function hex(bytes) {
    var s = "";
    for (var i = 0; i < bytes.length; i++) s += (bytes[i] < 16 ? "0" : "") + bytes[i].toString(16);
    return s;
  }

  // HMAC-SHA256 with a key of at most 64 bytes (seeds here are 32-byte digests).
  function hmacFactory(key) {
    var k = new Uint8Array(64);
    if (key.length > 64) key = sha256(key);
    k.set(key);
    var ipad = new Uint8Array(64), opad = new Uint8Array(64);
    for (var i = 0; i < 64; i++) { ipad[i] = k[i] ^ 0x36; opad[i] = k[i] ^ 0x5c; }
    return function (msg) {
      var inner = new Uint8Array(64 + msg.length);
      inner.set(ipad); inner.set(msg, 64);
      var ih = sha256(inner);
      var outer = new Uint8Array(96);
      outer.set(opad); outer.set(ih, 64);
      return sha256(outer);
    };
  }

  /* ------------------------------------------------- noise_commit.py, ported */

  // _drbg_stream: HMAC(seed, counter as 8-byte big endian), concatenated.
  function drbgStream(seed, nBytes) {
    var mac = hmacFactory(seed);
    var out = new Uint8Array(Math.ceil(nBytes / 32) * 32);
    var msg = new Uint8Array(8);
    for (var ctr = 0, pos = 0; pos < nBytes; ctr++, pos += 32) {
      var c = ctr;
      for (var b = 7; b >= 0; b--) { msg[b] = c % 256; c = Math.floor(c / 256); }
      out.set(mac(msg), pos);
    }
    return out.subarray(0, nBytes);
  }

  // _uniform01_from_bytes: little-endian uint64 / float64(2**64 - 1).
  // Number(BigInt) rounds to nearest like numpy's uint64 -> float64 cast.
  var TWO64 = 18446744073709551615; // float64(2**64 - 1) == 2**64
  var HAS_BIGINT = typeof BigInt === "function";
  function uniforms(bytes) {
    var n = bytes.length >> 3, u = new Float64Array(n);
    for (var i = 0; i < n; i++) {
      var o = i * 8;
      var lo = (bytes[o] | (bytes[o + 1] << 8) | (bytes[o + 2] << 16) | (bytes[o + 3] << 24)) >>> 0;
      var hi = (bytes[o + 4] | (bytes[o + 5] << 8) | (bytes[o + 6] << 16) | (bytes[o + 7] << 24)) >>> 0;
      var x;
      if (HAS_BIGINT) x = Number((BigInt(hi) << BigInt(32)) | BigInt(lo));
      else x = hi * 4294967296 + lo; // fallback: may differ in the last bit
      u[i] = x / TWO64;
    }
    return u;
  }

  // numpy's pairwise summation (umath loops: blocks of 128, eight accumulators).
  function pairwiseSum(a, start, n) {
    var i, res;
    if (n < 8) {
      res = -0.0; // numpy starts from -0.0 for n < 8
      for (i = 0; i < n; i++) res += a[start + i];
      return res;
    } else if (n <= 128) {
      var r0 = a[start], r1 = a[start + 1], r2 = a[start + 2], r3 = a[start + 3],
          r4 = a[start + 4], r5 = a[start + 5], r6 = a[start + 6], r7 = a[start + 7];
      for (i = 8; i < n - (n % 8); i += 8) {
        r0 += a[start + i]; r1 += a[start + i + 1]; r2 += a[start + i + 2]; r3 += a[start + i + 3];
        r4 += a[start + i + 4]; r5 += a[start + i + 5]; r6 += a[start + i + 6]; r7 += a[start + i + 7];
      }
      res = ((r0 + r1) + (r2 + r3)) + ((r4 + r5) + (r6 + r7));
      for (; i < n; i++) res += a[start + i];
      return res;
    } else {
      var n2 = Math.floor(n / 2);
      n2 -= n2 % 8;
      return pairwiseSum(a, start, n2) + pairwiseSum(a, start + n2, n - n2);
    }
  }

  // The repository's truncation: K = ceil(sigma * sqrt(2 ln(2 / 1e-12)) + 4).
  function truncK(sigma) {
    return Math.ceil(sigma * Math.sqrt(2.0 * Math.log(Math.max(2.0 / 1e-12, 2.0))) + 4.0);
  }

  var cdtCache = {};
  function cdt(sigma) {
    var key = String(sigma);
    if (cdtCache[key]) return cdtCache[key];
    var K = truncK(sigma), n = 2 * K + 1;
    var probs = new Float64Array(n);
    var s2 = 2.0 * sigma * sigma;
    for (var i = 0; i < n; i++) { var k = i - K; probs[i] = Math.exp(-(k * k) / s2); }
    var tot = pairwiseSum(probs, 0, n);
    var cdf = new Float64Array(n), run = 0;
    for (i = 0; i < n; i++) { probs[i] = probs[i] / tot; run += probs[i]; cdf[i] = run; }
    var keys = Object.keys(cdtCache);
    if (keys.length > 24) delete cdtCache[keys[0]];
    return (cdtCache[key] = { K: K, cdf: cdf, probs: probs });
  }

  // np.searchsorted(cdf, u, side='right'): count of entries <= u.
  function searchRight(cdf, u) {
    var lo = 0, hi = cdf.length;
    while (lo < hi) { var mid = (lo + hi) >> 1; if (cdf[mid] <= u) lo = mid + 1; else hi = mid; }
    return lo;
  }

  // derive_gaussian(seed, size, sigma_int): returns Int32Array-like (Float64Array of ints).
  function deriveGaussian(seed, size, sigma) {
    var z = new Float64Array(size);
    if (!(sigma > 0)) return z;
    var u = uniforms(drbgStream(seed, 8 * size));
    var T = cdt(sigma);
    for (var i = 0; i < size; i++) {
      var idx = searchRight(T.cdf, u[i]);
      if (idx > T.cdf.length - 1) idx = T.cdf.length - 1; // numpy would index out of range; u == 1 has probability 2^-64
      z[i] = idx - T.K;
    }
    return z;
  }

  function seedFrom(str) { return sha256(utf8(str)); }

  /* ----------------------------------------------------- calibration, Eq. (1) */

  // server_ops.get_noise_multiplier
  function noiseMultiplier(eps, delta) {
    if (!(eps < 100)) return 0;
    if (eps < 0.01) eps = 0.01;
    return Math.sqrt(2 * Math.log(1.25 / delta)) / eps;
  }

  // Eq. (1): Delta*_2 = (2 w_max / W_min) (S_clip + sqrt(d) (1/(2 gamma) + eta_max))
  function sensitivity(o) {
    return (2 * o.wmax / o.Wmin) * (o.S + Math.sqrt(o.d) * (1 / (2 * o.gamma) + (o.eta || 0)));
  }

  /* ------------------------------------------- Hamilton largest remainder */

  // pcu_algo._verify_and_gate_with_trust lines for integer weights, with the
  // weight vector exposed. ids: client ids; w: real weights (sum 1 in the repo).
  // cap: true applies the repository's ceil(alpha/K) cap and redistribution.
  function hamilton(ids, w, alpha, cap) {
    var K = ids.length, q = {}, base = {}, frac = {}, i;
    var sumBase = 0;
    for (i = 0; i < K; i++) {
      var id = ids[i];
      q[id] = w[i] * alpha;
      base[id] = Math.floor(q[id]);
      frac[id] = q[id] - base[id];
      sumBase += base[id];
    }
    var R = Math.round(alpha) - sumBase;
    var order = ids.slice().sort(function (a, b) {
      // sorted(key=(frac, -id), reverse=True): larger frac first, then smaller id
      if (frac[a] !== frac[b]) return frac[b] - frac[a];
      return a - b;
    });
    var tilde = {};
    ids.forEach(function (id) { tilde[id] = base[id]; });
    var plus = {};
    for (i = 0; i < R && i < order.length; i++) { tilde[order[i]] += 1; plus[order[i]] = 1; }
    var capped = false;
    if (cap) {
      var c = Math.ceil(alpha / K);
      ids.forEach(function (id) {
        if (tilde[id] > c) {
          capped = true;
          var excess = tilde[id] - c;
          tilde[id] = c;
          for (var j = 0; j < order.length && excess > 0; j++) {
            var o = order[j];
            if (o !== id && tilde[o] < c) { tilde[o] += 1; excess -= 1; }
          }
        }
      });
    }
    var Wint = 0;
    ids.forEach(function (id) { Wint += tilde[id]; });
    return { tilde: tilde, quota: q, base: base, frac: frac, plus: plus, R: R, order: order, Wint: Wint, capped: capped };
  }

  /* --------------------------------------------------- Algorithm 3, encoded */

  // round half to even, as torch.round and numpy.round do
  function rint(x) {
    var r = Math.round(x);
    if (Math.abs(x % 1) === 0.5) r = 2 * Math.round(x / 2);
    return r;
  }

  function norm2(v) { var s = 0; for (var i = 0; i < v.length; i++) s += v[i] * v[i]; return Math.sqrt(s); }

  // Clip(u, S) then clamp to [-U, U] (client_ops.clip_update)
  function clip(u, S, U) {
    var n = norm2(u), sc = n > S ? S / n : 1, g = new Float64Array(u.length);
    for (var i = 0; i < u.length; i++) {
      var x = u[i] * sc;
      if (U != null) x = Math.max(-U, Math.min(U, x));
      g[i] = x;
    }
    return { g: g, preNorm: n, clipped: n > S };
  }

  /*
    aggregate(o):
      o.updates: array of Float64Array (already clipped g_i)
      o.weights: real weights (sum 1), o.ids
      o.alpha, o.gamma, o.eps, o.delta, o.S, o.Wmin, o.seed (string)
    Returns the integer pipeline and the decoded average.
  */
  function aggregate(o) {
    var d = o.updates[0].length, K = o.updates.length;
    var hw = hamilton(o.ids, o.weights, o.alpha, false);
    var wmax = 0, Wt = 0;
    o.weights.forEach(function (w) { if (w > wmax) wmax = w; Wt += w; });
    var wmaxGrid = 0;
    o.ids.forEach(function (id) { wmaxGrid = Math.max(wmaxGrid, hw.tilde[id] / o.alpha); });
    var D = sensitivity({ wmax: o.wmaxForDelta != null ? o.wmaxForDelta : wmaxGrid, Wmin: o.Wmin, S: o.S, d: d, gamma: o.gamma, eta: 0 });
    var sig = noiseMultiplier(o.eps, o.delta);
    var sigmaInt = sig * o.gamma * hw.Wint * D;           // paper: sigma_t (gamma W_int) Delta*_2
    var enc = o.updates.map(function (g) { var e = new Float64Array(d); for (var j = 0; j < d; j++) e[j] = rint(o.gamma * g[j]); return e; });
    var Y = new Float64Array(d);
    for (var i = 0; i < K; i++) {
      var wi = hw.tilde[o.ids[i]];
      for (var j = 0; j < d; j++) Y[j] += wi * enc[i][j];
    }
    var z = deriveGaussian(seedFrom(o.seed || "round1_demo_0"), d, sigmaInt);
    var denom = o.gamma * hw.Wint;
    var out = new Float64Array(d), clean = new Float64Array(d), exact = new Float64Array(d);
    for (j = 0; j < d; j++) {
      out[j] = (Y[j] + z[j]) / denom;
      clean[j] = Y[j] / denom;
      var s = 0;
      for (i = 0; i < K; i++) s += o.weights[i] * o.updates[i][j];
      exact[j] = s / Wt;
    }
    return {
      d: d, K: K, weights: hw, Delta: D, sigmaT: sig, sigmaInt: sigmaInt, sigmaModel: sig * D,
      encoded: enc, Y: Y, z: z, denom: denom, released: out, noiseless: clean, exact: exact,
      seedCommit: hex(sha256(seedFrom(o.seed || "round1_demo_0")))
    };
  }

  /* ------------------------------------------------ privacy accounting */

  // Composition over T rounds at eps per round (delta = 1e-5). The paper's
  // Table I values are reported; these are the page's comparisons.
  function accountants(eps, T, delta) {
    var sig = noiseMultiplier(eps, delta);
    var basic = eps * T;
    var sqrtT = eps * Math.sqrt(T);
    // Advanced composition (Dwork, Rothblum, Vadhan) with delta' = delta
    var adv = eps * Math.sqrt(2 * T * Math.log(1 / delta)) + T * eps * (Math.exp(eps) - 1);
    // Gaussian RDP: T * lambda / (2 sigma^2) + ln(1/delta) / (lambda - 1), minimized over lambda > 1
    var rdp = Infinity, bestL = null;
    if (sig > 0) {
      for (var l = 1.0005; l <= 512; l *= 1.0015) {
        var v = T * l / (2 * sig * sig) + Math.log(1 / delta) / (l - 1);
        if (v < rdp) { rdp = v; bestL = l; }
      }
    }
    return { sigma: sig, basic: basic, sqrtT: sqrtT, advanced: adv, rdp: rdp, rdpOrder: bestL };
  }

  /* ------------------------------------------------ small seeded PRNG */

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function gauss(rng) {
    var u = 0, v = 0;
    while (u === 0) u = rng();
    while (v === 0) v = rng();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  /* ---------------------------------------------- trust budget, Algorithm 2 */

  /*
    gate(o): simulate Algorithm 2 over o.rounds rounds.
      o.n clients, o.bad (first o.bad ids are persistent offenders),
      o.pBad, o.pGood: probability a round's metadata score exceeds tau,
      o.Bmax, o.recover (repository's every-10-round recovery to Bmax/2), o.seed
  */
  function gate(o) {
    var rng = mulberry32(o.seed || 7);
    var B = [], i, t;
    for (i = 0; i < o.n; i++) B.push(o.Bmax);
    var admitted = [], badAdmitted = [], firstOut = null, budgetsBad = [];
    for (t = 1; t <= o.rounds; t++) {
      if (o.recover && t % 10 === 0) {
        for (i = 0; i < o.n; i++) if (B[i] <= 0) B[i] = Math.floor(o.Bmax / 2);
      }
      var a = 0, ab = 0;
      for (i = 0; i < o.n; i++) {
        var isBad = i < o.bad;
        var flagged = rng() < (isBad ? o.pBad : o.pGood);
        if (o.recover) {
          // repository order: skip at zero first, then decrement
          if (B[i] <= 0) continue;
          if (flagged) B[i] = Math.max(0, B[i] - 1);
        } else {
          // paper Algorithm 2: decrement, then skip if exhausted
          if (flagged) B[i] = Math.max(0, B[i] - 1);
          if (B[i] === 0) continue;
        }
        a++; if (isBad) ab++;
      }
      admitted.push(a); badAdmitted.push(ab);
      if (o.bad > 0 && ab < o.bad && firstOut === null) firstOut = t;
      var mb = 0; for (i = 0; i < o.bad; i++) mb += B[i];
      budgetsBad.push(o.bad ? mb / o.bad : 0);
    }
    return { admitted: admitted, badAdmitted: badAdmitted, firstOut: firstOut, meanBadBudget: budgetsBad };
  }

  /* --------------------------------------------------------- paper data */

  var PAPER = {
    delta: 1e-5,
    table1: [
      { name: "No DP", eps: Infinity, epsTot: Infinity, acc: 94.6, auc: 0.974, sigma: 0.000, rounds: 50, sclip: 2.18, clipPct: 16.7 },
      { name: "Light", eps: 50, epsTot: 274, acc: 86.8, auc: 0.886, sigma: 0.097, rounds: 30, sclip: 2.96, clipPct: 13.3 },
      { name: "Moderate", eps: 10, epsTot: 63, acc: 75.6, auc: 0.773, sigma: 0.484, rounds: 40, sclip: 2.71, clipPct: 30.0 },
      { name: "Strong", eps: 1, epsTot: 14.2, acc: 75.7, auc: 0.735, sigma: 4.845, rounds: 100, sclip: 0.45, clipPct: 100.0 }
    ],
    table2: [
      { config: "Baseline", eps: Infinity, acc: 94.6, dacc: null, comm: 1, snr: ">10", conv: "50 rds" },
      { config: "FP8 E4M3", eps: Infinity, acc: 85.8, dacc: -8.8, comm: 4, snr: "8.2", conv: "75 rds" },
      { config: "DP", eps: 50, acc: 86.8, dacc: null, comm: 1, snr: "1.1", conv: "30 rds" },
      { config: "DP+FP8", eps: 50, acc: 71.4, dacc: -15.4, comm: 4, snr: "0.9", conv: "Failed" },
      { config: "DP", eps: 10, acc: 75.6, dacc: null, comm: 1, snr: "1.0", conv: "40 rds" },
      { config: "DP+FP8", eps: 10, acc: 58.2, dacc: -17.4, comm: 4, snr: "0.8", conv: "Failed" }
    ],
    table3: [
      { name: "No DP", eps: Infinity, acc: 94.6, auc: 0.68, tpr1: 0.25, tpr5: 0.40, status: "Vulnerable" },
      { name: "Light", eps: 50, acc: 86.8, auc: 0.54, tpr1: 0.06, tpr5: 0.15, status: "Protected" },
      { name: "Moderate", eps: 10, acc: 75.6, auc: 0.52, tpr1: 0.03, tpr5: 0.10, status: "Protected" },
      { name: "Strong", eps: 1, acc: 75.7, auc: 0.51, tpr1: 0.02, tpr5: 0.08, status: "Protected" }
    ],
    strongDelta: 0.036,
    strongSclip: 0.45
  };

  root.PCUFL = {
    sha256: sha256, hex: hex, utf8: utf8, hmacFactory: hmacFactory,
    drbgStream: drbgStream, uniforms: uniforms, pairwiseSum: pairwiseSum,
    truncK: truncK, cdt: cdt, deriveGaussian: deriveGaussian, seedFrom: seedFrom,
    noiseMultiplier: noiseMultiplier, sensitivity: sensitivity, hamilton: hamilton,
    rint: rint, norm2: norm2, clip: clip, aggregate: aggregate, accountants: accountants,
    mulberry32: mulberry32, gauss: gauss, gate: gate, PAPER: PAPER
  };
})(typeof self !== "undefined" ? self : this);

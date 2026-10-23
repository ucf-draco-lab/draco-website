/*
  Engine for /papers/tvla-gift-cofb/.
  Companion to Unger, Babinkostova, Borowczak, Erbes, and Srinath, "TVLA,
  Correlation Power Analysis and Side-Channel Leakage Assessment Metrics"
  (NIST Lightweight Cryptography Workshop 2022).

  What it does
  - GIFT-128 in the bitsliced representation used by GIFT-COFB, one round at
    a time, and the GIFT-COFB authenticated encryption mode. Checked against
    all 1,089 vectors of the GIFT-COFB known-answer file and, round by round,
    against the straightforward ("tiny") GIFT-128 of the C library below.
  - A cycle-level power model of a round-based hardware datapath: one cycle
    loads a block into the state register, one cycle per GIFT-128 round. The
    simulated power of a cycle is the number of register bits that flip
    (state, key, and L registers) plus Gaussian noise. This model is the
    page's own; the paper measured an FPGA.
  - Fixed-versus-random test vector leakage assessment (TVLA): Welch's t per
    cycle, accumulated trace by trace.

  The GIFT-128 round, key update, and GIFT-COFB mode are ported from the
  "tiny" variant in Rhys Weatherley's lightweight-crypto library
  (src/individual/GIFT-COFB), which carries this notice:

    Copyright (C) 2020 Southern Storm Software, Pty Ltd.

    Permission is hereby granted, free of charge, to any person obtaining a
    copy of this software and associated documentation files (the "Software"),
    to deal in the Software without restriction, including without limitation
    the rights to use, copy, modify, merge, publish, distribute, sublicense,
    and/or sell copies of the Software, and to permit persons to whom the
    Software is furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included
    in all copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
    OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
    FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
    DEALINGS IN THE SOFTWARE.

  Loads as a page script (window.CofbTvla), in a Web Worker, or in Node.
*/
(function (root) {
  "use strict";

  var RC = [
    0x01, 0x03, 0x07, 0x0F, 0x1F, 0x3E, 0x3D, 0x3B,
    0x37, 0x2F, 0x1E, 0x3C, 0x39, 0x33, 0x27, 0x0E,
    0x1D, 0x3A, 0x35, 0x2B, 0x16, 0x2C, 0x18, 0x30,
    0x21, 0x02, 0x05, 0x0B, 0x17, 0x2E, 0x1C, 0x38,
    0x31, 0x23, 0x06, 0x0D, 0x1B, 0x36, 0x2D, 0x1A
  ];

  /* ------------------------------------------------------------ helpers */
  function popcount(x) {
    x = x - ((x >>> 1) & 0x55555555);
    x = (x & 0x33333333) + ((x >>> 2) & 0x33333333);
    return (((x + (x >>> 4)) & 0x0F0F0F0F) * 0x01010101) >>> 24;
  }
  function rotl(x, r) { return ((x << r) | (x >>> (32 - r))) >>> 0; }
  function step(y, mask, shift) {
    var t = ((y >>> shift) ^ y) & mask;
    return ((y ^ t) ^ (t << shift)) >>> 0;
  }
  function perm3inner(x) {
    x = step(x, 0x0a0a0a0a, 3);
    x = step(x, 0x00cc00cc, 6);
    x = step(x, 0x0000f0f0, 12);
    x = step(x, 0x000000ff, 24);
    return x;
  }
  function hexToBytes(hex) {
    var s = String(hex || "").replace(/[^0-9a-fA-F]/g, "");
    if (s.length % 2) s = s.slice(0, -1);
    var out = new Uint8Array(s.length / 2);
    for (var i = 0; i < out.length; i++) out[i] = parseInt(s.substr(2 * i, 2), 16);
    return out;
  }
  function bytesToHex(b) {
    var s = "";
    for (var i = 0; i < b.length; i++) s += (b[i] < 16 ? "0" : "") + b[i].toString(16);
    return s.toUpperCase();
  }
  function beLoad(b, o) { return ((b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3]) >>> 0; }
  function beStore(b, o, v) { b[o] = v >>> 24; b[o + 1] = (v >>> 16) & 255; b[o + 2] = (v >>> 8) & 255; b[o + 3] = v & 255; }

  /* ------------------------------------------------------------ GIFT-128 */
  /* Key words in the order the round uses them: w0..w3 (tiny variant). */
  function keyWords(key) {
    return [beLoad(key, 0), beLoad(key, 4), beLoad(key, 8), beLoad(key, 12)];
  }
  /*
    Encrypt one 128-bit block given as four big-endian words, in place.
    onRound(r, s, w), if given, sees the state and key registers after
    round r (0..39).
  */
  function gift128(s, key, onRound) {
    var s0 = s[0], s1 = s[1], s2 = s[2], s3 = s[3];
    var w0 = key[0], w1 = key[1], w2 = key[2], w3 = key[3], t;
    var regS = [0, 0, 0, 0], regW = [0, 0, 0, 0];
    for (var r = 0; r < 40; r++) {
      s1 = (s1 ^ (s0 & s2)) >>> 0;
      s0 = (s0 ^ (s1 & s3)) >>> 0;
      s2 = (s2 ^ (s0 | s1)) >>> 0;
      s3 = (s3 ^ s2) >>> 0;
      s1 = (s1 ^ s3) >>> 0;
      s3 = (~s3) >>> 0;
      s2 = (s2 ^ (s0 & s1)) >>> 0;
      t = s0; s0 = s3; s3 = t;
      s0 = rotl(perm3inner(s0), 8);
      s1 = rotl(perm3inner(s1), 16);
      s2 = rotl(perm3inner(s2), 24);
      s3 = perm3inner(s3);
      s2 = (s2 ^ w1) >>> 0;
      s1 = (s1 ^ w3) >>> 0;
      s3 = (s3 ^ 0x80000000 ^ RC[r]) >>> 0;
      t = w3; w3 = w2; w2 = w1; w1 = w0;
      w0 = (((t & 0xFFFC0000) >>> 2) | ((t & 0x00030000) << 14) |
            ((t & 0x00000FFF) << 4) | ((t & 0x0000F000) >>> 12)) >>> 0;
      if (onRound) {
        regS[0] = s0; regS[1] = s1; regS[2] = s2; regS[3] = s3;
        regW[0] = w0; regW[1] = w1; regW[2] = w2; regW[3] = w3;
        onRound(r, regS, regW);
      }
    }
    s[0] = s0; s[1] = s1; s[2] = s2; s[3] = s3;
    return s;
  }

  /* ---------------------------------------------------------- GIFT-COFB */
  function doubleL(L) {
    var mask = (L[0] >> 31) >>> 0;
    L[0] = ((L[0] << 1) | (L[1] >>> 31)) >>> 0;
    L[1] = ((L[1] << 1) ^ (mask & 0x1B)) >>> 0;
  }
  function tripleL(L) {
    var mask = (L[0] >> 31) >>> 0;
    var tx = ((L[0] << 1) | (L[1] >>> 31)) >>> 0;
    var ty = ((L[1] << 1) ^ (mask & 0x1B)) >>> 0;
    L[0] = (L[0] ^ tx) >>> 0;
    L[1] = (L[1] ^ ty) >>> 0;
  }
  function feedback(Y) {
    var lx = Y[0], ly = Y[1];
    Y[0] = Y[2]; Y[1] = Y[3];
    Y[2] = ((lx << 1) | (ly >>> 31)) >>> 0;
    Y[3] = ((ly << 1) | (lx >>> 31)) >>> 0;
  }
  function blockWords(bytes, off, len) {
    var p = new Uint8Array(16);
    for (var i = 0; i < len; i++) p[i] = bytes[off + i];
    if (len < 16) p[len] = 0x80;
    return [beLoad(p, 0), beLoad(p, 4), beLoad(p, 8), beLoad(p, 12)];
  }

  /*
    GIFT-COFB encryption. Returns { ct, tag } as byte arrays. If probe is
    given, it receives probe(kind, label, Y, L, W) after every cycle of the
    datapath model: kind "load" when a block enters the state register,
    kind "round" after each GIFT-128 round.
  */
  function encrypt(key, nonce, ad, m, probe) {
    var K = keyWords(key);
    var Y = [beLoad(nonce, 0), beLoad(nonce, 4), beLoad(nonce, 8), beLoad(nonce, 12)];
    var L = [0, 0];
    var c = new Uint8Array(m.length + 16), co = 0;
    function E(label) {
      if (probe) probe("load", label, Y, L, K);
      gift128(Y, K, probe ? function (r, s, w) { probe("round", label, s, L, w); } : null);
    }
    E("N");
    L[0] = Y[0]; L[1] = Y[1];

    /* associated data */
    var adlen = ad.length, ao = 0, ai = 1;
    while (adlen > 16) {
      doubleL(L); feedback(Y);
      var A = blockWords(ad, ao, 16);
      Y[0] = (Y[0] ^ L[0] ^ A[0]) >>> 0; Y[1] = (Y[1] ^ L[1] ^ A[1]) >>> 0;
      Y[2] = (Y[2] ^ A[2]) >>> 0; Y[3] = (Y[3] ^ A[3]) >>> 0;
      E("A" + ai++);
      ao += 16; adlen -= 16;
    }
    feedback(Y);
    var Al = blockWords(ad, ao, adlen);
    for (var q = 0; q < 4; q++) Y[q] = (Y[q] ^ Al[q]) >>> 0;
    tripleL(L);
    if (adlen !== 16) tripleL(L);
    if (m.length === 0) { tripleL(L); tripleL(L); }
    Y[0] = (Y[0] ^ L[0]) >>> 0; Y[1] = (Y[1] ^ L[1]) >>> 0;
    E("A" + ai);

    /* message */
    var mlen = m.length, mo = 0, mi = 1;
    if (mlen > 0) {
      while (mlen > 16) {
        var P = blockWords(m, mo, 16);
        for (var j = 0; j < 4; j++) beStore(c, co + 4 * j, (Y[j] ^ P[j]) >>> 0);
        doubleL(L); feedback(Y);
        Y[0] = (Y[0] ^ L[0] ^ P[0]) >>> 0; Y[1] = (Y[1] ^ L[1] ^ P[1]) >>> 0;
        Y[2] = (Y[2] ^ P[2]) >>> 0; Y[3] = (Y[3] ^ P[3]) >>> 0;
        E("M" + mi++);
        co += 16; mo += 16; mlen -= 16;
      }
      var Pl = blockWords(m, mo, mlen);
      var ks = new Uint8Array(16);
      for (var k = 0; k < 4; k++) beStore(ks, 4 * k, Y[k]);
      for (var b = 0; b < mlen; b++) c[co + b] = m[mo + b] ^ ks[b];
      co += mlen;
      feedback(Y);
      for (var z = 0; z < 4; z++) Y[z] = (Y[z] ^ Pl[z]) >>> 0;
      tripleL(L);
      if (mlen !== 16) tripleL(L);
      Y[0] = (Y[0] ^ L[0]) >>> 0; Y[1] = (Y[1] ^ L[1]) >>> 0;
      E("M" + mi);
    }
    for (var u = 0; u < 4; u++) beStore(c, co + 4 * u, Y[u]);
    return { ct: c.slice(0, m.length), tag: c.slice(m.length, m.length + 16), full: c };
  }

  /* ---------------------------------------------------------- power model */
  /*
    Noise-free register-flip trace of one encryption: entry i is the number
    of bits that change in the state (128), L (64), and key (128) registers
    at cycle i. Returns { hd: Float64Array, labels: [...] }.
  */
  function hdTrace(key, nonce, ad, m) {
    var prevS = [0, 0, 0, 0], prevL = [0, 0], prevW = [0, 0, 0, 0];
    var first = true, hd = [], labels = [], kinds = [];
    encrypt(key, nonce, ad, m, function (kind, label, S, L, W) {
      var d = 0;
      if (!first) {
        for (var i = 0; i < 4; i++) d += popcount((S[i] ^ prevS[i]) >>> 0) + popcount((W[i] ^ prevW[i]) >>> 0);
        d += popcount((L[0] ^ prevL[0]) >>> 0) + popcount((L[1] ^ prevL[1]) >>> 0);
      } else {
        for (var j = 0; j < 4; j++) d += popcount(S[j]) + popcount(W[j]);
        d += popcount(L[0]) + popcount(L[1]);
      }
      first = false;
      for (var q = 0; q < 4; q++) { prevS[q] = S[q]; prevW[q] = W[q]; }
      prevL[0] = L[0]; prevL[1] = L[1];
      hd.push(d); labels.push(label); kinds.push(kind);
    });
    return { hd: hd, labels: labels, kinds: kinds };
  }
  /* Segments of the cycle axis: [{ label, start, end }]. */
  function segments(labels) {
    var out = [];
    for (var i = 0; i < labels.length; i++) {
      if (!out.length || out[out.length - 1].label !== labels[i]) out.push({ label: labels[i], start: i, end: i });
      else out[out.length - 1].end = i;
    }
    return out;
  }

  /* ------------------------------------------------------------ random */
  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function gauss(rand) {
    var u = 0, v = 0;
    while (u === 0) u = rand();
    v = rand();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }
  function randomBytes(n, rand) {
    var b = new Uint8Array(n);
    for (var i = 0; i < n; i++) b[i] = Math.floor(rand() * 256);
    return b;
  }

  /* ---------------------------------------------------------- Welch's t */
  function Welch(len) {
    this.len = len;
    this.n = [0, 0];
    this.mean = [new Float64Array(len), new Float64Array(len)];
    this.m2 = [new Float64Array(len), new Float64Array(len)];
  }
  Welch.prototype.add = function (g, trace) {
    var n = ++this.n[g], mu = this.mean[g], m2 = this.m2[g];
    for (var i = 0; i < this.len; i++) {
      var d = trace[i] - mu[i];
      mu[i] += d / n;
      m2[i] += d * (trace[i] - mu[i]);
    }
  };
  Welch.prototype.t = function () {
    var out = new Float64Array(this.len), na = this.n[0], nb = this.n[1];
    if (na < 2 || nb < 2) return out;
    for (var i = 0; i < this.len; i++) {
      var va = this.m2[0][i] / (na - 1), vb = this.m2[1][i] / (nb - 1);
      var se = Math.sqrt(va / na + vb / nb);
      out[i] = se > 0 ? (this.mean[0][i] - this.mean[1][i]) / se : 0;
    }
    return out;
  };

  /* ------------------------------------------------------------- TVLA */
  var DEFAULTS = {
    key:   "000102030405060708090A0B0C0D0E0F",
    nonce: "000102030405060708090A0B0C0D0E0F",
    ad:    "000102030405060708090A0B0C0D0E0F",
    pt:    "DA39A3EE5E6B4B0D3255BFEF95601890AFD80709"
  };
  /*
    A fixed-versus-random campaign.
    opts: key, nonce, ad, pt (hex strings: the fixed values), vary: "pt" |
    "ad" | "none" (random-versus-random control), sigma (noise, in bit flips),
    seed. Group 0 is the fixed set, group 1 the random set; each trace joins
    a group by a fair coin flip, as interleaved TVLA campaigns do.
  */
  function Campaign(opts) {
    opts = opts || {};
    this.key = hexToBytes(opts.key || DEFAULTS.key);
    this.nonce = hexToBytes(opts.nonce || DEFAULTS.nonce);
    this.ad = hexToBytes(opts.ad != null ? opts.ad : DEFAULTS.ad);
    this.pt = hexToBytes(opts.pt != null ? opts.pt : DEFAULTS.pt);
    this.vary = opts.vary || "pt";
    this.sigma = opts.sigma == null ? 12 : opts.sigma;
    this.rand = rng(opts.seed == null ? 1 : opts.seed);
    this.fixed = hdTrace(this.key, this.nonce, this.ad, this.pt);
    this.len = this.fixed.hd.length;
    this.welch = new Welch(this.len);
    this.count = 0;
    this.buf = new Float64Array(this.len);
    this.lastTrace = [null, null];
  }
  Campaign.prototype.noiseless = function (group) {
    if (this.vary === "none") {
      return hdTrace(this.key, this.nonce, this.ad, randomBytes(this.pt.length, this.rand)).hd;
    }
    if (group === 0) return this.fixed.hd;
    if (this.vary === "ad") return hdTrace(this.key, this.nonce, randomBytes(this.ad.length, this.rand), this.pt).hd;
    return hdTrace(this.key, this.nonce, this.ad, randomBytes(this.pt.length, this.rand)).hd;
  };
  Campaign.prototype.step = function (k) {
    for (var c = 0; c < k; c++) {
      var g = this.rand() < 0.5 ? 0 : 1;
      var base = this.noiseless(g);
      var tr = new Float64Array(this.len);
      for (var i = 0; i < this.len; i++) tr[i] = base[i] + this.sigma * gauss(this.rand);
      this.welch.add(g, tr);
      this.lastTrace[g] = tr;
      this.count++;
    }
    return this.count;
  };
  Campaign.prototype.t = function () { return this.welch.t(); };
  Campaign.prototype.summary = function (thr) {
    thr = thr || 4.5;
    var t = this.t(), maxAbs = 0, at = -1, over = 0;
    for (var i = 0; i < t.length; i++) {
      var a = Math.abs(t[i]);
      if (a > maxAbs) { maxAbs = a; at = i; }
      if (a > thr) over++;
    }
    return { traces: this.count, nFixed: this.welch.n[0], nRandom: this.welch.n[1], maxAbs: maxAbs, at: at, over: over, t: t };
  };

  /* Expected noiseless gap between the fixed trace and the random-set mean. */
  function meanRandomTrace(key, nonce, ad, pt, vary, n, seed) {
    var rand = rng(seed || 7), len = null, acc = null;
    for (var j = 0; j < n; j++) {
      var tr = vary === "ad"
        ? hdTrace(key, nonce, randomBytes(ad.length, rand), pt).hd
        : hdTrace(key, nonce, ad, randomBytes(pt.length, rand)).hd;
      if (!acc) { len = tr.length; acc = new Float64Array(len); }
      for (var i = 0; i < len; i++) acc[i] += tr[i] / n;
    }
    return acc;
  }

  /* Two-sided normal tail, for the false-alarm arithmetic. */
  function normalTail2(z) {
    // Complementary error function (Numerical Recipes erfcc), |error| < 1.2e-7 relative.
    var x = z / Math.SQRT2, t = 1 / (1 + 0.5 * x);
    var r = t * Math.exp(-x * x - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 +
      t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 +
      t * (-0.82215223 + t * 0.17087277)))))))));
    return r;
  }

  var api = {
    RC: RC, DEFAULTS: DEFAULTS,
    popcount: popcount, hexToBytes: hexToBytes, bytesToHex: bytesToHex,
    keyWords: keyWords, gift128: gift128, encrypt: encrypt,
    hdTrace: hdTrace, segments: segments,
    rng: rng, gauss: gauss, randomBytes: randomBytes,
    Welch: Welch, Campaign: Campaign, meanRandomTrace: meanRandomTrace,
    normalTail2: normalTail2
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.CofbTvla = api;
})(typeof self !== "undefined" ? self : this);

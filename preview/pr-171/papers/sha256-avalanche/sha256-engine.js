/*
  SHA-256 compression with sub-function knockouts.

  A line-for-line port of Sha256_compress_verbose from the authors' published
  Go implementation (github.com/RileyVaughn/Sha256-SAC, research.go), used in
  R. Vaughn and M. Borowczak, "Strict Avalanche Criterion of SHA-256 and
  Sub-Function-Removed Variants," Cryptography 8(3):40, 2024, and
  "Relaxation of Strict Avalanche Criterion on All SHA-256 Sub-Function
  Combinations," Cryptography 10(3):32, 2026.

  Knockout semantics match the Go code exactly:
    ADD   off -> every modular addition in the round and the final feed-forward
                 becomes XOR (the message schedule keeps its additions)
    K     off -> round constant dropped from T1
    CH    off -> Choose dropped from T1
    MAJ   off -> Majority dropped from T2
    S0    off -> Sigma0 dropped from T2
    S1    off -> Sigma1 dropped from T1
    SCHED off -> W[t] = W[t mod 16] (the block repeated four times)

  Loads as a classic script in a page (window.SHA256SAC) or a worker
  (self.SHA256SAC via importScripts).
*/
(function (root) {
  "use strict";

  var K = new Uint32Array([
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ]);

  var IV = new Uint32Array([
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
  ]);

  // Bit flags: a set bit means the sub-function is PRESENT.
  var F = { ADD: 1, K: 2, CH: 4, MAJ: 8, S0: 16, S1: 32, SCHED: 64 };
  var ALL = 127;
  var ORDER = ["S1", "ADD", "CH", "SCHED", "S0", "MAJ", "K"];

  function rotr(x, n) { return (x >>> n) | (x << (32 - n)); }

  var W = new Uint32Array(64);

  function schedule(chunk, mask) {
    var t;
    for (t = 0; t < 16; t++) W[t] = chunk[t];
    if (mask & F.SCHED) {
      for (t = 16; t < 64; t++) {
        var x = W[t - 15], y = W[t - 2];
        var s0 = rotr(x, 7) ^ rotr(x, 18) ^ (x >>> 3);
        var s1 = rotr(y, 17) ^ rotr(y, 19) ^ (y >>> 10);
        W[t] = (W[t - 16] + s0 + W[t - 7] + s1) >>> 0;
      }
    } else {
      for (t = 16; t < 64; t++) W[t] = chunk[t & 15];
    }
  }

  /*
    compress(chunk, iv, mask, rounds)
      chunk  Uint32Array(16) message block
      iv     Uint32Array(8)  chaining value
      mask   present sub-functions (0..127)
      rounds optional Uint32Array(512): state a..h after each of the 64 rounds
    returns a new Uint32Array(8) with the feed-forward applied
  */
  function compress(chunk, iv, mask, rounds) {
    schedule(chunk, mask);
    var a = iv[0], b = iv[1], c = iv[2], d = iv[3], e = iv[4], f = iv[5], g = iv[6], h = iv[7];
    var add = mask & F.ADD, useK = mask & F.K, useCh = mask & F.CH, useMaj = mask & F.MAJ,
        useS0 = mask & F.S0, useS1 = mask & F.S1;
    for (var t = 0; t < 64; t++) {
      var T1, T2 = 0;
      if (add) {
        T1 = (h + W[t]) | 0;
        if (useK) T1 = (T1 + K[t]) | 0;
        if (useCh) T1 = (T1 + ((e & f) ^ (~e & g))) | 0;
        if (useS1) T1 = (T1 + (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25))) | 0;
        if (useMaj) T2 = (T2 + ((a & b) ^ (a & c) ^ (b & c))) | 0;
        if (useS0) T2 = (T2 + (rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22))) | 0;
        h = g; g = f; f = e; e = (d + T1) | 0; d = c; c = b; b = a; a = (T1 + T2) | 0;
      } else {
        T1 = h ^ W[t];
        if (useK) T1 ^= K[t];
        if (useCh) T1 ^= (e & f) ^ (~e & g);
        if (useS1) T1 ^= rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
        if (useMaj) T2 ^= (a & b) ^ (a & c) ^ (b & c);
        if (useS0) T2 ^= rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
        h = g; g = f; f = e; e = d ^ T1; d = c; c = b; b = a; a = T1 ^ T2;
      }
      if (rounds) {
        var o = t << 3;
        rounds[o] = a; rounds[o + 1] = b; rounds[o + 2] = c; rounds[o + 3] = d;
        rounds[o + 4] = e; rounds[o + 5] = f; rounds[o + 6] = g; rounds[o + 7] = h;
      }
    }
    var out = new Uint32Array(8);
    if (add) {
      out[0] = iv[0] + a; out[1] = iv[1] + b; out[2] = iv[2] + c; out[3] = iv[3] + d;
      out[4] = iv[4] + e; out[5] = iv[5] + f; out[6] = iv[6] + g; out[7] = iv[7] + h;
    } else {
      out[0] = iv[0] ^ a; out[1] = iv[1] ^ b; out[2] = iv[2] ^ c; out[3] = iv[3] ^ d;
      out[4] = iv[4] ^ e; out[5] = iv[5] ^ f; out[6] = iv[6] ^ g; out[7] = iv[7] ^ h;
    }
    return out;
  }

  // Standard padding; returns an array of Uint32Array(16) blocks.
  function pad(bytes) {
    var len = bytes.length, total = ((len + 9 + 63) >> 6) << 6;
    var buf = new Uint8Array(total);
    buf.set(bytes);
    buf[len] = 0x80;
    var bits = len * 8;
    buf[total - 4] = (bits >>> 24) & 255; buf[total - 3] = (bits >>> 16) & 255;
    buf[total - 2] = (bits >>> 8) & 255; buf[total - 1] = bits & 255;
    buf[total - 5] = Math.floor(bits / 4294967296) & 255;
    var blocks = [];
    for (var off = 0; off < total; off += 64) {
      var blk = new Uint32Array(16);
      for (var i = 0; i < 16; i++) {
        var p = off + i * 4;
        blk[i] = (buf[p] << 24) | (buf[p + 1] << 16) | (buf[p + 2] << 8) | buf[p + 3];
      }
      blocks.push(blk);
    }
    return blocks;
  }

  function utf8(str) {
    return typeof TextEncoder !== "undefined" ? new TextEncoder().encode(str)
      : Uint8Array.from(unescape(encodeURIComponent(str)), function (c) { return c.charCodeAt(0); });
  }

  // Full hash of a string or bytes with an optional knockout mask.
  function hash(input, mask) {
    if (mask === undefined) mask = ALL;
    var bytes = typeof input === "string" ? utf8(input) : input;
    var blocks = pad(bytes), h = IV;
    for (var i = 0; i < blocks.length; i++) h = compress(blocks[i], h, mask);
    return h;
  }

  function hex(words) {
    var s = "";
    for (var i = 0; i < words.length; i++) s += ("00000000" + (words[i] >>> 0).toString(16)).slice(-8);
    return s;
  }

  // Bit index convention from the Go FlipBit: word = i >> 5, bit = i & 31 (LSB first).
  function flipBit(chunk, i) {
    var c = new Uint32Array(chunk);
    c[i >>> 5] ^= (1 << (i & 31));
    return c;
  }

  function popcount(x) {
    x = x - ((x >>> 1) & 0x55555555);
    x = (x & 0x33333333) + ((x >>> 2) & 0x33333333);
    return (((x + (x >>> 4)) & 0x0f0f0f0f) * 0x01010101) >>> 24;
  }

  /*
    SAC accumulator. Counts, for every round r, input bit i, and state bit j,
    how often state bit j differs after flipping message bit i. Layout is
    [i][r][j] so each flip touches one contiguous 64x256 slab.
  */
  function SacAccumulator(mask) {
    this.mask = mask;
    this.k = 0;
    this.counts = new Uint32Array(512 * 64 * 256);
    this.base = new Uint32Array(512);
    this.alt = new Uint32Array(512);
  }

  SacAccumulator.prototype.addSample = function (chunk) {
    var base = this.base, alt = this.alt, counts = this.counts, mask = this.mask;
    compress(chunk, IV, mask, base);
    var flipped = new Uint32Array(16);
    for (var i = 0; i < 512; i++) {
      flipped.set(chunk);
      flipped[i >>> 5] ^= (1 << (i & 31));
      compress(flipped, IV, mask, alt);
      var slab = i << 14; // i * 64 * 256
      for (var r = 0; r < 64; r++) {
        var ro = r << 3, co = slab + (r << 8);
        for (var w = 0; w < 8; w++) {
          var x = base[ro + w] ^ alt[ro + w];
          var wo = co + (w << 5);
          while (x !== 0) {
            var low = x & -x;
            counts[wo + (31 - Math.clz32(low))]++;
            x ^= low;
          }
        }
      }
    }
    this.k++;
  };

  // Per-round summary: min, max, mean of the 512x256 matrix, plus SAC value
  // (whichever of min or max lies farther from 1/2).
  SacAccumulator.prototype.summary = function () {
    var k = this.k, counts = this.counts, out = [];
    for (var r = 0; r < 64; r++) {
      var mn = Infinity, mx = -Infinity, sum = 0;
      for (var i = 0; i < 512; i++) {
        var o = (i << 14) + (r << 8);
        for (var j = 0; j < 256; j++) {
          var c = counts[o + j];
          if (c < mn) mn = c;
          if (c > mx) mx = c;
          sum += c;
        }
      }
      var min = mn / k, max = mx / k, mean = sum / (k * 131072);
      out.push({ round: r + 1, min: min, max: max, mean: mean,
        sac: (0.5 - min) >= (max - 0.5) ? min : max });
    }
    return out;
  };

  // One round's matrix as bytes (0..255 scaled), 512 rows x 256 columns.
  SacAccumulator.prototype.matrix = function (round) {
    var k = this.k, m = new Uint8ClampedArray(131072), r = round - 1;
    for (var i = 0; i < 512; i++) {
      var o = (i << 14) + (r << 8), row = i << 8;
      for (var j = 0; j < 256; j++) m[row + j] = Math.round(255 * this.counts[o + j] / k);
    }
    return m;
  };

  /*
    Bonferroni-corrected acceptance band, as in the 2026 paper:
    alpha' = 0.01 / (512 * 256), two-tailed, so z is about 5.327 and
    the band is 1/2 +/- z * sqrt(1/4 / k).
  */
  var Z_BONF = 5.327;
  function band(k) { return Z_BONF * Math.sqrt(0.25 / k); }

  root.SHA256SAC = {
    F: F, ALL: ALL, ORDER: ORDER, IV: IV, K: K,
    compress: compress, hash: hash, hex: hex, pad: pad, utf8: utf8,
    flipBit: flipBit, popcount: popcount,
    SacAccumulator: SacAccumulator, band: band, Z_BONF: Z_BONF
  };
})(typeof self !== "undefined" ? self : this);

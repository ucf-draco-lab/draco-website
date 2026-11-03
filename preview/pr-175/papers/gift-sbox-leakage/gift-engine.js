/*
  Engine for /papers/gift-sbox-leakage/.

  Unger, Babinkostova, Borowczak, and Erbes, "Side-channel Leakage Assessment
  Metrics: A Case Study of GIFT Block Ciphers" (IEEE ISVLSI 2021).

  - The seven 4-bit S-boxes of Table I.
  - The deterministic metrics of Table II: non-linearity (Eq. 6), transparency
    order (Eq. 3), revisited transparency order (Eq. 4, as printed, plus the
    per-output-bit form for comparison), and DPA signal-to-noise ratio (Eq. 8).
  - GIFT-64-128 with a pluggable S-box. The cipher follows the designers'
    reference implementation (giftcipher/gift, MIT License, Copyright (c) 2019
    giftcipher) and is checked round by round against its three GIFT-64 test
    vectors.
  - A simulated correlation power analysis (CPA) on the round-2 S-box output
    with the paper's experiment and trial protocol (Algorithms 1 and 2). The
    leakage is simulated (Hamming weight plus Gaussian noise); the paper used
    ChipWhisperer traces from an 8-bit XMEGA.

  Loads as a page script (window.GiftLeak) or in Node (module.exports).
*/
(function (root) {
  "use strict";

  var N = 16, n = 4;

  /* Table I, as printed (input 0..F -> output). */
  var TABLE1 = {
    PICCOLO: "E4B238091A7F6C5D",
    GIFT:    "1A4C6F392DB7508E",
    PRESENT: "C56B90AD3EF84712",
    S2:      "517640E23FBA89CD",
    S4:      "123456789ABCDEF0",
    S1:      "0E7645213FAB89CD",
    S3:      "0FEDCBA987654321"
  };
  var ORDER = ["PICCOLO", "GIFT", "PRESENT", "S2", "S4", "S1", "S3"];

  /* Table II, as printed: NL, SNR (dB, averaged over 100 runs), DPA-SNR, TO, RTO. */
  var TABLE2 = {
    PICCOLO: { nl: 4, snr: 39.401, dpa: 3.108, to: 3.666, rto: 3.333 },
    GIFT:    { nl: 4, snr: 39.348, dpa: 2.399, to: 3.466, rto: 3.066 },
    PRESENT: { nl: 4, snr: 34.665, dpa: 2.129, to: 3.533, rto: 3.266 },
    S2:      { nl: 2, snr: 39.968, dpa: 2.946, to: 3.4,   rto: 3.266 },
    S4:      { nl: 0, snr: 39.252, dpa: 2.484, to: 2.933, rto: 2.933 },
    S1:      { nl: 0, snr: 38.582, dpa: 2.579, to: 3.266, rto: 3.133 },
    S3:      { nl: 0, snr: 34.148, dpa: 2.484, to: 2.933, rto: 2.933 }
  };

  function parse(hex) {
    var s = String(hex).replace(/[^0-9a-fA-F]/g, "");
    if (s.length !== 16) return null;
    var out = [];
    for (var i = 0; i < 16; i++) out.push(parseInt(s[i], 16));
    return out;
  }
  function toHex(F) { return F.map(function (v) { return v.toString(16).toUpperCase(); }).join(""); }

  var HW = [];
  for (var t = 0; t < 256; t++) { var c = 0, x = t; while (x) { c += x & 1; x >>= 1; } HW.push(c); }
  function parity(x) { return HW[x & 255] & 1; }
  function dot(a, b) { return parity(a & b); }
  function bit(y, i) { return (y >> i) & 1; }

  function isPermutation(F) {
    var seen = 0;
    for (var i = 0; i < N; i++) seen |= 1 << F[i];
    return seen === 0xffff;
  }

  /* Walsh transform W_F(u, v) = sum_x (-1)^(v.F(x) + u.x)  (Eq. 2). */
  function walsh(F, u, v) {
    var s = 0;
    for (var x = 0; x < N; x++) s += (dot(v, F[x]) ^ dot(u, x)) ? -1 : 1;
    return s;
  }
  function walshTable(F) {
    var rows = [];
    for (var v = 0; v < N; v++) { var row = []; for (var u = 0; u < N; u++) row.push(walsh(F, u, v)); rows.push(row); }
    return rows; // rows[v][u]
  }

  /* Non-linearity (Eq. 6): 2^(n-1) - max_{u, v != 0} |W_F(u, v)| / 2. */
  function nonlinearity(F) {
    var m = 0, arg = null;
    for (var v = 1; v < N; v++) for (var u = 0; u < N; u++) {
      var w = Math.abs(walsh(F, u, v));
      if (w > m) { m = w; arg = { u: u, v: v }; }
    }
    return { value: N / 2 - m / 2, maxWalsh: m, at: arg };
  }
  /* Non-linearity of each component v.F, v = 1..15. */
  function componentNL(F) {
    var out = [];
    for (var v = 1; v < N; v++) {
      var m = 0;
      for (var u = 0; u < N; u++) m = Math.max(m, Math.abs(walsh(F, u, v)));
      out.push({ v: v, nl: N / 2 - m / 2 });
    }
    return out;
  }

  /* Transparency order (Eq. 3, Prouff 2005), denominator 2^(2n) - 2^n. */
  function transparencyOrder(F) {
    var den = N * N - N, best = -Infinity, arg = 0;
    for (var b = 0; b < N; b++) {
      var sum = 0;
      for (var a = 1; a < N; a++) {
        var s = 0;
        for (var i = 0; i < n; i++) {
          var v = 1 << i, w = 0;
          for (var x = 0; x < N; x++) w += dot(v, F[x] ^ F[x ^ a]) ? -1 : 1; // W_{D_a F}(0, v)
          s += (dot(v, b) ? -1 : 1) * w;
        }
        sum += Math.abs(s);
      }
      var val = Math.abs(n - 2 * HW[b]) - sum / den;
      if (val > best) { best = val; arg = b; }
    }
    return { value: best, beta: arg };
  }

  /* Cross-correlation spectrum (Eq. 5). */
  function crossCorr(F, i, j, a) {
    var s = 0;
    for (var x = 0; x < N; x++) s += (bit(F[x], i) ^ bit(F[x ^ a], j)) ? -1 : 1;
    return s;
  }
  /*
    Revisited transparency order.
    form "printed": Eq. 4 as printed in the paper, one absolute value around
      the double sum over i and j. This form reproduces Table II.
    form "perbit": the absolute value taken for each output bit j before
      summing over j (the form this page reads in Li et al., 2020).
  */
  function revisitedTO(F, form) {
    var den = N * N - N, best = -Infinity, arg = 0;
    for (var b = 0; b < N; b++) {
      var sum = 0;
      for (var a = 1; a < N; a++) {
        if (form === "perbit") {
          for (var j = 0; j < n; j++) {
            var s1 = 0;
            for (var i = 0; i < n; i++) s1 += ((bit(b, i) ^ bit(b, j)) ? -1 : 1) * crossCorr(F, i, j, a);
            sum += Math.abs(s1);
          }
        } else {
          var s2 = 0;
          for (var jj = 0; jj < n; jj++) for (var ii = 0; ii < n; ii++) s2 += ((bit(b, ii) ^ bit(b, jj)) ? -1 : 1) * crossCorr(F, ii, jj, a);
          sum += Math.abs(s2);
        }
      }
      var val = n - sum / den;
      if (val > best) { best = val; arg = b; }
    }
    return { value: best, beta: arg };
  }

  /* DPA signal-to-noise ratio (Eq. 8, Guilley et al. 2004): n 2^(2n) / sqrt(sum_a (sum_i W_{F_i}(a))^4). */
  function dpaSNR(F) {
    var s = 0;
    for (var a = 0; a < N; a++) {
      var t2 = 0;
      for (var i = 0; i < n; i++) t2 += walsh(F, a, 1 << i);
      s += Math.pow(t2, 4);
    }
    return n * N * N / Math.sqrt(s);
  }

  /* Difference distribution table, for the differential-uniformity readout. */
  function differentialUniformity(F) {
    var m = 0;
    for (var a = 1; a < N; a++) {
      var cnt = new Array(N).fill(0);
      for (var x = 0; x < N; x++) cnt[F[x] ^ F[x ^ a]]++;
      for (var b = 0; b < N; b++) m = Math.max(m, cnt[b]);
    }
    return m;
  }

  function metrics(F) {
    return {
      permutation: isPermutation(F),
      nl: nonlinearity(F).value,
      to: transparencyOrder(F).value,
      rto: revisitedTO(F, "printed").value,
      rtoPerBit: revisitedTO(F, "perbit").value,
      dpa: dpaSNR(F),
      du: differentialUniformity(F)
    };
  }

  /* ---------------------------------------------------------------- GIFT-64 */
  /* Nibble arrays, index 0 = least significant nibble (as in the reference). */

  var GIFT_P = [
    0, 17, 34, 51, 48, 1, 18, 35, 32, 49, 2, 19, 16, 33, 50, 3,
    4, 21, 38, 55, 52, 5, 22, 39, 36, 53, 6, 23, 20, 37, 54, 7,
    8, 25, 42, 59, 56, 9, 26, 43, 40, 57, 10, 27, 24, 41, 58, 11,
    12, 29, 46, 63, 60, 13, 30, 47, 44, 61, 14, 31, 28, 45, 62, 15
  ];
  var GIFT_RC = [
    0x01, 0x03, 0x07, 0x0F, 0x1F, 0x3E, 0x3D, 0x3B, 0x37, 0x2F,
    0x1E, 0x3C, 0x39, 0x33, 0x27, 0x0E, 0x1D, 0x3A, 0x35, 0x2B,
    0x16, 0x2C, 0x18, 0x30, 0x21, 0x02, 0x05, 0x0B, 0x17, 0x2E,
    0x1C, 0x38, 0x31, 0x23, 0x06, 0x0D, 0x1B, 0x36, 0x2D, 0x1A,
    0x34, 0x29, 0x12, 0x24, 0x08, 0x11, 0x22, 0x04, 0x09, 0x13,
    0x26, 0x0c, 0x19, 0x32, 0x25, 0x0a, 0x15, 0x2a, 0x14, 0x28,
    0x10, 0x20
  ];

  function hexToNibbles(hex, count) {
    var s = String(hex).replace(/[^0-9a-fA-F]/g, "");
    var out = new Array(count).fill(0);
    for (var i = 0; i < count && i < s.length; i++) out[i] = parseInt(s[s.length - 1 - i], 16);
    return out;
  }
  function nibblesToHex(a) {
    var s = "";
    for (var i = a.length - 1; i >= 0; i--) s += a[i].toString(16);
    return s;
  }

  function subCells(st, S) { for (var i = 0; i < 16; i++) st[i] = S[st[i]]; }
  function permBits(st) {
    var bits = new Array(64), pb = new Array(64), i, j;
    for (i = 0; i < 16; i++) for (j = 0; j < 4; j++) bits[4 * i + j] = (st[i] >> j) & 1;
    for (i = 0; i < 64; i++) pb[GIFT_P[i]] = bits[i];
    for (i = 0; i < 16; i++) { st[i] = 0; for (j = 0; j < 4; j++) st[i] ^= pb[4 * i + j] << j; }
  }
  /* AddRoundKey for round r, in place; returns the 64-bit round-key-plus-constant mask as nibbles. */
  function addRoundKey(st, key, r) {
    var bits = new Array(64), keyBits = new Array(128), i, j, mask = new Array(16).fill(0);
    for (i = 0; i < 16; i++) for (j = 0; j < 4; j++) bits[4 * i + j] = (st[i] >> j) & 1;
    for (i = 0; i < 32; i++) for (j = 0; j < 4; j++) keyBits[4 * i + j] = (key[i] >> j) & 1;
    var mbits = new Array(64).fill(0);
    for (i = 0; i < 16; i++) {
      mbits[4 * i] ^= keyBits[i];        // U = key bits 0..15
      mbits[4 * i + 1] ^= keyBits[i + 16]; // V = key bits 16..31
    }
    // round constants
    var pos = [3, 7, 11, 15, 19, 23];
    for (i = 0; i < 6; i++) mbits[pos[i]] ^= (GIFT_RC[r] >> i) & 1;
    mbits[63] ^= 1;
    for (i = 0; i < 64; i++) bits[i] ^= mbits[i];
    for (i = 0; i < 16; i++) {
      st[i] = 0;
      for (j = 0; j < 4; j++) { st[i] ^= bits[4 * i + j] << j; mask[i] ^= mbits[4 * i + j] << j; }
    }
    return mask;
  }
  function updateKey(key) {
    var temp = new Array(32), i;
    // entire key >>> 32
    for (i = 0; i < 32; i++) temp[i] = key[(i + 8) % 32];
    for (i = 0; i < 24; i++) key[i] = temp[i];
    // k0 >>> 12
    key[24] = temp[27]; key[25] = temp[24]; key[26] = temp[25]; key[27] = temp[26];
    // k1 >>> 2
    key[28] = ((temp[28] & 0xc) >> 2) ^ ((temp[29] & 0x3) << 2);
    key[29] = ((temp[29] & 0xc) >> 2) ^ ((temp[30] & 0x3) << 2);
    key[30] = ((temp[30] & 0xc) >> 2) ^ ((temp[31] & 0x3) << 2);
    key[31] = ((temp[31] & 0xc) >> 2) ^ ((temp[28] & 0x3) << 2);
  }

  /*
    encrypt(pt[16], masterKey[32], rounds, S, onStep)
    onStep(r, stage, stateCopy, extra) with stage in "sub", "perm", "ark", "key".
  */
  function encrypt(pt, masterKey, rounds, S, onStep) {
    var st = pt.slice(), key = masterKey.slice();
    S = S || parse(TABLE1.GIFT);
    for (var r = 0; r < rounds; r++) {
      subCells(st, S); if (onStep) onStep(r, "sub", st.slice());
      permBits(st); if (onStep) onStep(r, "perm", st.slice());
      var mask = addRoundKey(st, key, r); if (onStep) onStep(r, "ark", st.slice(), mask);
      updateKey(key); if (onStep) onStep(r, "key", key.slice());
    }
    return st;
  }

  /* --------------------------------------------------------- simulated CPA */

  function rng(seed) {
    var s = seed >>> 0 || 1;
    return function () {
      s = (s + 0x6D2B79F5) | 0;
      var t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function gauss(rand) {
    var u = 0, v = 0;
    while (u === 0) u = rand();
    v = rand();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  /*
    Round 1 of GIFT-64 adds no key before its S-boxes, so the attacker can
    compute x = PermBits(SubCells(pt)) for every plaintext. The input to the
    round-2 S-boxes is x XOR m, where m is the round-1 key-plus-constant mask.
    Leakage at the round-2 point of interest for nibble j:
      L_j = HW(S[x_j XOR m_j]) + noise,  noise ~ N(0, sigma^2).
    The attacker guesses each 4-bit m_j (16 guesses, constants included, as the
    paper describes) and keeps the guess with the largest correlation.
  */
  function knownX(pt, S) { var st = pt.slice(); subCells(st, S); permBits(st); return st; }
  function roundOneMask(masterKey) {
    var st = new Array(16).fill(0);
    return addRoundKey(st, masterKey.slice(), 0);
  }

  /* A pool of simulated traces: { x: [16 nibbles], L: [16 leakage values] } */
  function makePool(S, masterKey, size, sigma, rand) {
    var m = roundOneMask(masterKey), pool = [];
    for (var t2 = 0; t2 < size; t2++) {
      var pt = [];
      for (var i = 0; i < 16; i++) pt.push(Math.floor(rand() * 16));
      var x = knownX(pt, S), L = new Float64Array(16);
      for (var j = 0; j < 16; j++) L[j] = HW[S[x[j] ^ m[j]]] + sigma * gauss(rand);
      pool.push({ x: x, L: L });
    }
    return { mask: m, traces: pool };
  }

  /* Incremental correlation sums for 16 nibbles x 16 guesses. */
  function Accumulator(S) {
    this.S = S;
    this.n = 0;
    this.sh = new Float64Array(256); this.shh = new Float64Array(256); this.shl = new Float64Array(256);
    this.sl = new Float64Array(16); this.sll = new Float64Array(16);
  }
  Accumulator.prototype.add = function (tr) {
    var S = this.S;
    this.n++;
    for (var j = 0; j < 16; j++) {
      var l = tr.L[j], xj = tr.x[j];
      this.sl[j] += l; this.sll[j] += l * l;
      for (var g = 0; g < 16; g++) {
        var h = HW[S[xj ^ g]], k = j * 16 + g;
        this.sh[k] += h; this.shh[k] += h * h; this.shl[k] += h * l;
      }
    }
  };
  Accumulator.prototype.corr = function (j, g) {
    var k = j * 16 + g, nn = this.n;
    var num = nn * this.shl[k] - this.sh[k] * this.sl[j];
    var den = Math.sqrt((nn * this.shh[k] - this.sh[k] * this.sh[k]) * (nn * this.sll[j] - this.sl[j] * this.sl[j]));
    return den > 0 ? num / den : 0;
  };
  /* Best guess for nibble j (ties broken toward the lowest guess, so a tie is never a lucky success). */
  Accumulator.prototype.best = function (j) {
    var bg = 0, bc = -Infinity;
    for (var g = 0; g < 16; g++) { var c = this.corr(j, g); if (c > bc + 1e-12) { bc = c; bg = g; } }
    return bg;
  };
  Accumulator.prototype.recovered = function (mask) {
    var ok = 0;
    for (var j = 0; j < 16; j++) if (this.best(j) === mask[j]) ok++;
    return ok;
  };

  /*
    Algorithm 1 (experiment): add one random pool trace at a time (without
    replacement), attack after each, stop at the threshold cap or after five
    consecutive successes (remaining counts marked successful). Success means
    all 16 nibbles of the round-1 mask are recovered.
  */
  function experiment(pool, threshold, successLimit, rand) {
    var S = pool.S, acc = new Accumulator(S), res = new Uint8Array(threshold + 1);
    var idx = [], i;
    for (i = 0; i < pool.traces.length; i++) idx.push(i);
    var streak = 0;
    for (var count = 1; count <= threshold; count++) {
      var pick = count - 1 + Math.floor(rand() * (idx.length - count + 1));
      var tmp = idx[count - 1]; idx[count - 1] = idx[pick]; idx[pick] = tmp;
      acc.add(pool.traces[idx[count - 1]]);
      var ok = acc.recovered(pool.mask) === 16;
      res[count] = ok ? 1 : 0;
      if (ok) {
        streak++;
        if (streak === successLimit) { for (var c = count + 1; c <= threshold; c++) res[c] = 1; break; }
      } else streak = 0;
    }
    return res;
  }

  /* Algorithm 2 (trial): mean success rate per trace count over many experiments. */
  function trial(opts) {
    var S = opts.S, rand = rng(opts.seed || 1);
    var threshold = opts.threshold || 150, limit = opts.successLimit || 5, runs = opts.experiments || 100;
    var key = opts.key || hexToNibbles("bd91731eb6bc2713a1f9f6ffc75044e7", 32);
    var pool = makePool(S, key, opts.poolSize || 2000, opts.sigma, rand);
    pool.S = S;
    var sum = new Float64Array(threshold + 1);
    for (var e = 0; e < runs; e++) {
      var r = experiment(pool, threshold, limit, rand);
      for (var c = 1; c <= threshold; c++) sum[c] += r[c];
    }
    var mean = [];
    for (var c2 = 0; c2 <= threshold; c2++) mean.push(sum[c2] / runs);
    return mean;
  }
  function tracesTo(mean, level) {
    for (var c = 1; c < mean.length; c++) if (mean[c] >= level) return c;
    return null;
  }

  var api = {
    TABLE1: TABLE1, TABLE2: TABLE2, ORDER: ORDER, HW: HW,
    parse: parse, toHex: toHex, isPermutation: isPermutation,
    walsh: walsh, walshTable: walshTable, nonlinearity: nonlinearity, componentNL: componentNL,
    transparencyOrder: transparencyOrder, revisitedTO: revisitedTO, crossCorr: crossCorr,
    dpaSNR: dpaSNR, differentialUniformity: differentialUniformity, metrics: metrics,
    hexToNibbles: hexToNibbles, nibblesToHex: nibblesToHex, encrypt: encrypt,
    knownX: knownX, roundOneMask: roundOneMask,
    rng: rng, gauss: gauss, makePool: makePool, Accumulator: Accumulator,
    experiment: experiment, trial: trial, tracesTo: tracesTo
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.GiftLeak = api;
})(typeof self !== "undefined" ? self : this);

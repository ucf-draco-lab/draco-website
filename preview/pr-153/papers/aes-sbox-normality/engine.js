/*
  Engine for /papers/aes-sbox-normality/.

  Companion to Carper, Olguin, Brown, Charlton, and Borowczak, "Challenging
  Assumptions of Normality in AES s-Box Configurations under Side-Channel
  Analysis," Journal of Cybersecurity and Privacy 3(4):844-857, 2023
  (doi:10.3390/jcp3040038).

  Contents
  - AES-128 encryption with a replaceable S-box, following the operation order
    of Tiny-AES-c (kokke/tiny-AES-c, Unlicense): AddRoundKey(0), then
    SubBytes, ShiftRows, MixColumns, AddRoundKey for rounds 1 to 9, and
    SubBytes, ShiftRows, AddRoundKey for round 10. Checked against the C code
    compiled with each S-box this page offers.
  - A simulated power-trace source (Hamming-weight leakage of every state byte
    after every operation, Gaussian noise, a per-trace offset, and a 10-bit
    ADC). The paper's traces came from a ChipWhisperer-Lite and an STM32F303;
    everything this source produces is simulated and labeled as such.
  - The paper's statistics, written to match R and SciPy: Welch's t-test,
    Shapiro-Wilk (Royston 1995, algorithm AS R94, as in R's shapiro.test and
    SciPy's shapiro), one-sample and two-sample Kolmogorov-Smirnov (asymptotic
    p-values), the Wilcoxon signed-rank test (paired, normal approximation with
    tie and continuity corrections), and the Kruskal-Wallis test (tie
    corrected). Checked against SciPy 1.18 to a relative error below 1e-9.

  Loads as a page script (window.SboxNormality) and in a Web Worker.
*/
(function (root) {
  "use strict";

  /* ---------------------------------------------------------------- RNG */
  function rng(seed) {
    // mulberry32
    var a = seed >>> 0;
    function next() {
      a = (a + 0x6d2b79f5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
    var spare = null;
    function normal() {
      if (spare !== null) { var s = spare; spare = null; return s; }
      var u, v, r;
      do { u = 2 * next() - 1; v = 2 * next() - 1; r = u * u + v * v; } while (r >= 1 || r === 0);
      var f = Math.sqrt(-2 * Math.log(r) / r);
      spare = v * f;
      return u * f;
    }
    return { next: next, normal: normal, byte: function () { return (next() * 256) | 0; } };
  }

  /* ---------------------------------------------------------------- AES */
  function xtime(x) { return ((x << 1) ^ (((x >> 7) & 1) * 0x1b)) & 0xff; }
  function gmul(a, b) { var p = 0; while (b) { if (b & 1) p ^= a; a = xtime(a); b >>= 1; } return p; }
  function rotl8(x, s) { return ((x << s) | (x >>> (8 - s))) & 0xff; }

  function aesSbox() {
    var inv = new Uint8Array(256), s = new Uint8Array(256), x, y;
    for (x = 1; x < 256; x++) for (y = 1; y < 256; y++) if (gmul(x, y) === 1) { inv[x] = y; break; }
    for (x = 0; x < 256; x++) {
      var b = inv[x];
      s[x] = b ^ rotl8(b, 1) ^ rotl8(b, 2) ^ rotl8(b, 3) ^ rotl8(b, 4) ^ 0x63;
    }
    return s;
  }
  var AES_SBOX = aesSbox();

  // Page-made comparison S-boxes. None of them is one of the paper's S1 to S8,
  // which come from Siddiqui et al. (2020) and are not printed in the paper.
  function affineVariant() {
    // Output-affine copy of the AES S-box: rotate left by 3 and XOR 0x5a.
    // Affine-equivalent to AES, so its non-linearity is also 112.
    var s = new Uint8Array(256);
    for (var x = 0; x < 256; x++) s[x] = rotl8(AES_SBOX[x], 3) ^ 0x5a;
    return s;
  }
  function identitySbox() { var s = new Uint8Array(256); for (var x = 0; x < 256; x++) s[x] = x; return s; }
  function shuffledSbox(seed) {
    var s = identitySbox(), r = rng(seed);
    for (var i = 255; i > 0; i--) { var j = Math.floor(r.next() * (i + 1)); var t = s[i]; s[i] = s[j]; s[j] = t; }
    return s;
  }
  var SBOXES = {
    "default": { label: "Default (AES)", table: AES_SBOX },
    "affine": { label: "AES, affine copy", table: affineVariant() },
    "shuffle": { label: "Shuffled", table: shuffledSbox(2023) },
    "identity": { label: "Identity", table: identitySbox() }
  };

  var RCON = [0x8d, 0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1b, 0x36];
  function expandKey(key, sbox) {
    // Tiny-AES-c KeyExpansion; the key schedule uses the same S-box table.
    var rk = new Uint8Array(176), i, k;
    for (i = 0; i < 16; i++) rk[i] = key[i];
    var t = new Uint8Array(4);
    for (i = 4; i < 44; i++) {
      k = (i - 1) * 4;
      t[0] = rk[k]; t[1] = rk[k + 1]; t[2] = rk[k + 2]; t[3] = rk[k + 3];
      if (i % 4 === 0) {
        var u = t[0]; t[0] = t[1]; t[1] = t[2]; t[2] = t[3]; t[3] = u;
        t[0] = sbox[t[0]]; t[1] = sbox[t[1]]; t[2] = sbox[t[2]]; t[3] = sbox[t[3]];
        t[0] ^= RCON[i / 4];
      }
      var j = i * 4; k = (i - 4) * 4;
      rk[j] = rk[k] ^ t[0]; rk[j + 1] = rk[k + 1] ^ t[1]; rk[j + 2] = rk[k + 2] ^ t[2]; rk[j + 3] = rk[k + 3] ^ t[3];
    }
    return rk;
  }

  // Encrypt one block and record the state after every operation.
  // Returns { ct, steps: [{name, round, state}] } with 40 steps:
  // ARK0, then per round SB, SR, (MC), ARK.
  function encryptSteps(pt, rk, sbox) {
    var st = new Uint8Array(16), i, r, steps = [];
    for (i = 0; i < 16; i++) st[i] = pt[i] ^ rk[i];
    steps.push({ name: "AddRoundKey", round: 0, state: st.slice() });
    for (r = 1; r <= 10; r++) {
      for (i = 0; i < 16; i++) st[i] = sbox[st[i]];
      steps.push({ name: "SubBytes", round: r, state: st.slice() });
      // ShiftRows: state is column-major, byte (row c of column col) at 4*col + c
      var s2 = st.slice();
      for (var col = 0; col < 4; col++) for (var row = 0; row < 4; row++) st[4 * col + row] = s2[4 * ((col + row) % 4) + row];
      steps.push({ name: "ShiftRows", round: r, state: st.slice() });
      if (r < 10) {
        for (col = 0; col < 4; col++) {
          var a0 = st[4 * col], a1 = st[4 * col + 1], a2 = st[4 * col + 2], a3 = st[4 * col + 3];
          var tmp = a0 ^ a1 ^ a2 ^ a3;
          st[4 * col] = a0 ^ tmp ^ xtime(a0 ^ a1);
          st[4 * col + 1] = a1 ^ tmp ^ xtime(a1 ^ a2);
          st[4 * col + 2] = a2 ^ tmp ^ xtime(a2 ^ a3);
          st[4 * col + 3] = a3 ^ tmp ^ xtime(a3 ^ a0);
        }
        steps.push({ name: "MixColumns", round: r, state: st.slice() });
      }
      for (i = 0; i < 16; i++) st[i] ^= rk[16 * r + i];
      steps.push({ name: "AddRoundKey", round: r, state: st.slice() });
    }
    return { ct: st.slice(), steps: steps };
  }

  function nonlinearity(sbox) {
    // NL = 128 - max |W(a, b)| / 2 over input masks a and nonzero output masks b.
    var best = 0, f = new Int32Array(256);
    for (var b = 1; b < 256; b++) {
      for (var x = 0; x < 256; x++) f[x] = popcount(sbox[x] & b) & 1 ? -1 : 1;
      for (var h = 1; h < 256; h <<= 1) {
        for (var i = 0; i < 256; i += h << 1) for (var j = i; j < i + h; j++) {
          var u = f[j], v = f[j + h]; f[j] = u + v; f[j + h] = u - v;
        }
      }
      for (x = 0; x < 256; x++) { var w = Math.abs(f[x]); if (w > best) best = w; }
    }
    return 128 - best / 2;
  }
  function popcount(x) { x = x - ((x >> 1) & 0x55); x = (x & 0x33) + ((x >> 2) & 0x33); return (x + (x >> 4)) & 0x0f; }
  var HW = new Uint8Array(256);
  for (var hw = 0; hw < 256; hw++) HW[hw] = popcount(hw);

  /* ------------------------------------------------------ trace source */
  // TVLA's standard fixed-vs-random setting (Goodwill et al., 2011).
  var TVLA_KEY = hex("0123456789abcdef123456789abcdef0");
  var TVLA_FIXED = hex("da39a3ee5e6b4b0d3255bfef95601890");
  function hex(s) { var a = new Uint8Array(s.length / 2); for (var i = 0; i < a.length; i++) a[i] = parseInt(s.substr(2 * i, 2), 16); return a; }
  function toHex(a) { var s = ""; for (var i = 0; i < a.length; i++) s += (a[i] < 16 ? "0" : "") + a[i].toString(16); return s; }

  // Time layout of one simulated trace (2,440 samples, one tenth of the
  // paper's 24,400). A short quiet preamble, the 40 operations at 56 samples
  // each, and a quiet tail. Inside an operation, byte i of the state leaks at
  // sample 4 + 3i (weight 1) and the next sample (weight 0.5).
  var T = 2440, PRE = 60, OPLEN = 56;
  var LEAKS = [];
  (function buildLayout() {
    for (var s = 0; s < 40; s++) for (var i = 0; i < 16; i++) LEAKS.push({ step: s, byte: i, at: PRE + s * OPLEN + 4 + 3 * i });
  })();
  // Deterministic baseline: a clock-like waveform with instruction texture.
  var BASE = new Float64Array(T);
  (function buildBase() {
    var r = rng(9);
    var level = 0;
    for (var t = 0; t < T; t++) {
      if (t % 14 === 0) level = (r.next() - 0.5) * 0.06;
      var clock = (t % 4 === 0) ? 0.05 : (t % 4 === 1 ? -0.02 : 0.0);
      BASE[t] = -0.08 + level + clock;
    }
  })();

  var DEFAULTS = { traces: 1000, sigma: 2.5, gain: 1.2, offset: 1.0, adcBits: 10, sbox: "default", seed: 13 };

  // Simulate a fixed-vs-random campaign. Units: noise, gain, and offset are in
  // ADC least significant bits (LSB) of a 10-bit converter spanning [-0.5, 0.5).
  // Each trace joins the fixed or the random group with probability 1/2, as in
  // the ChipWhisperer TVLA capture loop, so group sizes vary.
  function simulate(opts) {
    var o = {};
    for (var k in DEFAULTS) o[k] = (opts && opts[k] != null) ? opts[k] : DEFAULTS[k];
    var sbox = SBOXES[o.sbox] ? SBOXES[o.sbox].table : AES_SBOX;
    var rk = expandKey(TVLA_KEY, sbox);
    var r = rng(o.seed);
    var lsb = 1 / 1024;
    var q = o.adcBits > 0 ? Math.pow(2, o.adcBits) : 0;
    var n = o.traces;
    var data = new Float32Array(n * T);
    var group = new Uint8Array(n); // 1 = fixed, 0 = random
    var row = new Float64Array(T), pt = new Uint8Array(16);
    for (var j = 0; j < n; j++) {
      var fixed = r.next() < 0.5;
      group[j] = fixed ? 1 : 0;
      if (fixed) pt.set(TVLA_FIXED); else for (var b = 0; b < 16; b++) pt[b] = r.byte();
      var res = encryptSteps(pt, rk, sbox);
      var off = o.offset * lsb * r.normal();
      for (var t = 0; t < T; t++) row[t] = BASE[t] + off + o.sigma * lsb * r.normal();
      for (var L = 0; L < LEAKS.length; L++) {
        var lk = LEAKS[L], h = HW[res.steps[lk.step].state[lk.byte]] - 4;
        row[lk.at] -= o.gain * lsb * h;
        row[lk.at + 1] -= 0.5 * o.gain * lsb * h;
      }
      var base = j * T;
      for (t = 0; t < T; t++) {
        var v = row[t];
        if (q) { v = Math.floor((v + 0.5) * q) / q - 0.5; if (v < -0.5) v = -0.5; if (v > 0.5 - 1 / q) v = 0.5 - 1 / q; }
        data[base + t] = v;
      }
    }
    return { n: n, T: T, data: data, group: group, opts: o };
  }

  function column(sim, t, which) {
    // which: 1 fixed, 0 random, -1 both
    var out = [];
    for (var j = 0; j < sim.n; j++) if (which < 0 || sim.group[j] === which) out.push(sim.data[j * sim.T + t]);
    return out;
  }
  function groupRows(sim, which) {
    var rows = [];
    for (var j = 0; j < sim.n; j++) if (sim.group[j] === which) rows.push(j);
    return rows;
  }

  /* ---------------------------------------------------- distributions */
  var SQRT2 = Math.SQRT2, SQRTPI = Math.sqrt(Math.PI);
  function erfcPos(z) {
    // erfc(z) for z >= 0, relative error near 1e-15.
    if (z < 2.5) {
      // erf(z) = 2/sqrt(pi) * exp(-z^2) * sum 2^n z^(2n+1) / (2n+1)!!
      var term = z, sum = z, n = 0, z2 = z * z;
      while (Math.abs(term) > 1e-17 * Math.abs(sum)) { n++; term *= 2 * z2 / (2 * n + 1); sum += term; if (n > 500) break; }
      var erf = 2 / SQRTPI * Math.exp(-z2) * sum;
      return 1 - erf;
    }
    // Continued fraction (modified Lentz).
    var tiny = 1e-300, f = z, C = z, D = 0, a;
    for (var i = 1; i < 500; i++) {
      a = i / 2;
      D = z + a * D; if (Math.abs(D) < tiny) D = tiny; D = 1 / D;
      C = z + a / C; if (Math.abs(C) < tiny) C = tiny;
      var delta = C * D; f *= delta;
      if (Math.abs(delta - 1) < 1e-16) break;
    }
    return Math.exp(-z * z) / SQRTPI / f;
  }
  function normUpper(x) { return x >= 0 ? 0.5 * erfcPos(x / SQRT2) : 1 - 0.5 * erfcPos(-x / SQRT2); }
  function normCdf(x) { return x >= 0 ? 1 - 0.5 * erfcPos(x / SQRT2) : 0.5 * erfcPos(-x / SQRT2); }
  function normPdf(x) { return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI); }
  function qnorm(p) {
    // Acklam's rational approximation, then two Halley steps.
    if (p <= 0) return -Infinity; if (p >= 1) return Infinity;
    var a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02, 1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
    var b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02, 6.680131188771972e+01, -1.328068155288572e+01];
    var c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00, -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00];
    var d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00, 3.754408661907416e+00];
    var x, q, r;
    if (p < 0.02425) { q = Math.sqrt(-2 * Math.log(p)); x = (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
    else if (p > 1 - 0.02425) { q = Math.sqrt(-2 * Math.log(1 - p)); x = -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
    else { q = p - 0.5; r = q * q; x = (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1); }
    for (var it = 0; it < 2; it++) {
      var e = (p < 0.5 ? normCdf(x) - p : (1 - p) - normUpper(x));
      var u = e * Math.sqrt(2 * Math.PI) * Math.exp(x * x / 2);
      x = x - u / (1 + x * u / 2);
    }
    return x;
  }
  function lgamma(x) {
    // Stirling series after shifting x up to at least 15; relative error near 1e-15.
    if (x < 0.5) return Math.log(Math.PI / Math.abs(Math.sin(Math.PI * x))) - lgamma(1 - x);
    var shift = 0;
    while (x < 15) { shift += Math.log(x); x += 1; }
    var x2 = 1 / (x * x);
    var series = (1 / 12 - x2 * (1 / 360 - x2 * (1 / 1260 - x2 * (1 / 1680 - x2 / 1188)))) / x;
    return (x - 0.5) * Math.log(x) - x + 0.5 * Math.log(2 * Math.PI) + series - shift;
  }
  function gammaQ(a, x) {
    // Regularized upper incomplete gamma Q(a, x).
    if (x <= 0) return 1;
    var gln = lgamma(a);
    if (x < a + 1) {
      var ap = a, sum = 1 / a, del = sum;
      for (var n = 0; n < 1000; n++) { ap += 1; del *= x / ap; sum += del; if (Math.abs(del) < Math.abs(sum) * 1e-16) break; }
      return 1 - sum * Math.exp(-x + a * Math.log(x) - gln);
    }
    var b = x + 1 - a, c = 1e300, d = 1 / b, h = d;
    for (var i = 1; i < 1000; i++) {
      var an = -i * (i - a); b += 2;
      d = an * d + b; if (Math.abs(d) < 1e-300) d = 1e-300;
      c = b + an / c; if (Math.abs(c) < 1e-300) c = 1e-300;
      d = 1 / d; var del2 = d * c; h *= del2;
      if (Math.abs(del2 - 1) < 1e-16) break;
    }
    return Math.exp(-x + a * Math.log(x) - gln) * h;
  }
  function chi2Upper(x, df) {
    if (df === 1) return 2 * normUpper(Math.sqrt(Math.max(0, x)));
    return gammaQ(df / 2, x / 2);
  }
  function kolmogorovUpper(t) {
    // P(K > t) for the limiting Kolmogorov distribution.
    if (t <= 0) return 1;
    if (t < 1) {
      // Use the theta-function form for small t.
      var s = 0, w = Math.PI * Math.PI / (8 * t * t);
      for (var k = 1; k < 200; k += 2) { var term = Math.exp(-k * k * w); s += term; if (term < 1e-18) break; }
      return 1 - Math.sqrt(2 * Math.PI) / t * s;
    }
    var p = 0;
    for (var j = 1; j < 200; j++) { var tj = Math.exp(-2 * j * j * t * t); p += (j % 2 ? 1 : -1) * tj; if (tj < 1e-300) break; }
    return Math.min(1, Math.max(0, 2 * p));
  }
  // Student t upper tail via the regularized incomplete beta function.
  function betacf(a, b, x) {
    var qab = a + b, qap = a + 1, qam = a - 1, c = 1, d = 1 - qab * x / qap;
    if (Math.abs(d) < 1e-300) d = 1e-300; d = 1 / d; var h = d;
    for (var m = 1; m <= 1000; m++) {
      var m2 = 2 * m, aa = m * (b - m) * x / ((qam + m2) * (a + m2));
      d = 1 + aa * d; if (Math.abs(d) < 1e-300) d = 1e-300; c = 1 + aa / c; if (Math.abs(c) < 1e-300) c = 1e-300; d = 1 / d; h *= d * c;
      aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
      d = 1 + aa * d; if (Math.abs(d) < 1e-300) d = 1e-300; c = 1 + aa / c; if (Math.abs(c) < 1e-300) c = 1e-300; d = 1 / d;
      var del = d * c; h *= del; if (Math.abs(del - 1) < 1e-16) break;
    }
    return h;
  }
  function ibeta(a, b, x) {
    if (x <= 0) return 0; if (x >= 1) return 1;
    var bt = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x));
    if (x < (a + 1) / (a + b + 2)) return bt * betacf(a, b, x) / a;
    return 1 - bt * betacf(b, a, 1 - x) / b;
  }
  function tTwoSided(t, df) { var x = df / (df + t * t); return ibeta(df / 2, 0.5, x); }

  /* ---------------------------------------------------------- tests */
  function meanVar(x) {
    var n = x.length, m = 0, i;
    for (i = 0; i < n; i++) m += x[i];
    m /= n;
    var v = 0;
    for (i = 0; i < n; i++) { var d = x[i] - m; v += d * d; }
    return { n: n, mean: m, var: n > 1 ? v / (n - 1) : 0 };
  }
  function welch(x, y) {
    var a = meanVar(x), b = meanVar(y);
    var se2 = a.var / a.n + b.var / b.n;
    if (se2 === 0) return { t: 0, df: a.n + b.n - 2, p: 1 };
    var t = (a.mean - b.mean) / Math.sqrt(se2);
    var df = se2 * se2 / (Math.pow(a.var / a.n, 2) / (a.n - 1) + Math.pow(b.var / b.n, 2) / (b.n - 1));
    return { t: t, df: df, p: tTwoSided(t, df) };
  }
  function poly(cc, x) { var r = 0; for (var i = cc.length - 1; i >= 0; i--) r = r * x + cc[i]; return r; }
  var SW_C1 = [0, 0.221157, -0.147981, -2.07119, 4.434685, -2.706056];
  var SW_C2 = [0, 0.042981, -0.293762, -1.752461, 5.682633, -3.582633];
  var SW_C3 = [0.544, -0.39978, 0.025054, -6.714e-4];
  var SW_C4 = [1.3822, -0.77857, 0.062767, -0.0020322];
  var SW_C5 = [-1.5861, -0.31082, -0.083751, 0.0038915];
  var SW_C6 = [-0.4803, -0.082676, 0.0030302];
  var SW_G = [-2.273, 0.459];
  var SW_CACHE = {};
  function shapiro(xin) {
    // Royston (1995), AS R94, as implemented in R's swilk.c and SciPy.
    var n = xin.length;
    if (n < 3 || n > 5000) return { W: NaN, p: NaN, n: n };
    var x = Float64Array.from(xin).sort();
    var range = x[n - 1] - x[0];
    if (range < 1e-300) return { W: 1, p: 1, n: n, constant: true };
    var nn2 = Math.floor(n / 2), a, i;
    var an = n;
    if (SW_CACHE[n]) a = SW_CACHE[n];
    else if (n === 3) { a = new Float64Array(2); a[1] = Math.SQRT1_2; }
    else {
      a = new Float64Array(nn2 + 1);
      var an25 = an + 0.25, summ2 = 0;
      for (i = 1; i <= nn2; i++) { a[i] = qnorm((i - 0.375) / an25); summ2 += a[i] * a[i]; }
      summ2 *= 2;
      var ssumm2 = Math.sqrt(summ2), rsn = 1 / Math.sqrt(an);
      var a1 = poly(SW_C1, rsn) - a[1] / ssumm2, i1, fac;
      if (n > 5) {
        i1 = 3;
        var a2 = -a[2] / ssumm2 + poly(SW_C2, rsn);
        fac = Math.sqrt((summ2 - 2 * a[1] * a[1] - 2 * a[2] * a[2]) / (1 - 2 * a1 * a1 - 2 * a2 * a2));
        a[2] = a2;
      } else {
        i1 = 2;
        fac = Math.sqrt((summ2 - 2 * a[1] * a[1]) / (1 - 2 * a1 * a1));
      }
      a[1] = a1;
      for (i = i1; i <= nn2; i++) a[i] /= -fac;
      SW_CACHE[n] = a;
    }
    // W as the squared correlation between the ordered sample and the
    // antisymmetric coefficient vector (swilk.c's formulation).
    var mean = 0;
    for (i = 0; i < n; i++) mean += x[i];
    mean /= n;
    var ssx = 0, sax = 0;
    for (i = 0; i < n; i++) { var dx = x[i] - mean; ssx += dx * dx; }
    for (i = 1; i <= nn2; i++) sax += a[i] * (x[n - i] - x[i - 1]);
    var W = sax * sax / ssx; // sum of squared coefficients is 1
    if (W > 1) W = 1;
    var w1, m, s, pw;
    if (n === 3) {
      var pi6 = 1.90985931710274, stqr = 1.04719755119660;
      pw = pi6 * (Math.asin(Math.sqrt(W)) - stqr);
      return { W: W, p: Math.max(0, pw), n: n };
    }
    w1 = Math.log(1 - W);
    var xx = Math.log(an);
    if (n <= 11) {
      var gamma = poly(SW_G, an);
      if (w1 >= gamma) return { W: W, p: 1e-99, n: n };
      w1 = -Math.log(gamma - w1);
      m = poly(SW_C3, an);
      s = Math.exp(poly(SW_C4, an));
    } else {
      m = poly(SW_C5, xx);
      s = Math.exp(poly(SW_C6, xx));
    }
    pw = normUpper((w1 - m) / s);
    return { W: W, p: pw, n: n };
  }
  function ksOne(xin) {
    // Normality with parameters estimated from the sample, as in R's
    // ks.test(x, "pnorm", mean(x), sd(x)); asymptotic p-value.
    var x = Float64Array.from(xin).sort(), n = x.length, mv = meanVar(xin), sd = Math.sqrt(mv.var), D = 0;
    if (sd === 0) return { D: 1, p: 0, n: n };
    for (var i = 0; i < n; i++) {
      var F = normCdf((x[i] - mv.mean) / sd);
      var d1 = (i + 1) / n - F, d2 = F - i / n;
      if (d1 > D) D = d1; if (d2 > D) D = d2;
    }
    return { D: D, p: kolmogorovUpper(Math.sqrt(n) * D), n: n };
  }
  function ksTwo(xin, yin) {
    var x = Float64Array.from(xin).sort(), y = Float64Array.from(yin).sort(), n = x.length, m = y.length;
    var i = 0, j = 0, D = 0;
    while (i < n && j < m) {
      var v = x[i] <= y[j] ? x[i] : y[j];
      while (i < n && x[i] <= v) i++;
      while (j < m && y[j] <= v) j++;
      var d = Math.abs(i / n - j / m);
      if (d > D) D = d;
    }
    var en = Math.sqrt(n * m / (n + m));
    return { D: D, p: kolmogorovUpper(en * D), n: n, m: m };
  }
  function rankAvg(vals) {
    // Average ranks (1-based) and the tie term sum(t^3 - t).
    var n = vals.length, idx = new Array(n), r = new Float64Array(n), ties = 0;
    for (var i = 0; i < n; i++) idx[i] = i;
    idx.sort(function (p, q) { return vals[p] - vals[q]; });
    for (i = 0; i < n;) {
      var j = i;
      while (j + 1 < n && vals[idx[j + 1]] === vals[idx[i]]) j++;
      var rr = (i + j) / 2 + 1, t = j - i + 1;
      for (var k = i; k <= j; k++) r[idx[k]] = rr;
      if (t > 1) ties += t * t * t - t;
      i = j + 1;
    }
    return { ranks: r, ties: ties };
  }
  function wilcoxonPaired(x, y) {
    // R's wilcox.test(x, y, paired = TRUE) with the normal approximation
    // (used by R whenever ties or zeros are present), continuity corrected.
    var n0 = Math.min(x.length, y.length), d = [];
    for (var i = 0; i < n0; i++) { var di = x[i] - y[i]; if (di !== 0) d.push(di); }
    var n = d.length;
    if (n === 0) return { V: 0, p: 1, n: 0 };
    var absd = d.map(Math.abs), rk = rankAvg(absd), V = 0;
    for (i = 0; i < n; i++) if (d[i] > 0) V += rk.ranks[i];
    var z = V - n * (n + 1) / 4;
    var sigma = Math.sqrt(n * (n + 1) * (2 * n + 1) / 24 - rk.ties / 48);
    var corr = z > 0 ? 0.5 : (z < 0 ? -0.5 : 0);
    z = (z - corr) / sigma;
    return { V: V, z: z, p: Math.min(1, 2 * normUpper(Math.abs(z))), n: n };
  }
  function kruskal(groups) {
    var all = [], gi = [], k = groups.length;
    groups.forEach(function (g, gidx) { for (var i = 0; i < g.length; i++) { all.push(g[i]); gi.push(gidx); } });
    var N = all.length, rk = rankAvg(all), sums = new Float64Array(k), counts = new Float64Array(k);
    for (var i = 0; i < N; i++) { sums[gi[i]] += rk.ranks[i]; counts[gi[i]] += 1; }
    var H = 0;
    for (var g = 0; g < k; g++) if (counts[g]) H += sums[g] * sums[g] / counts[g];
    H = 12 / (N * (N + 1)) * H - 3 * (N + 1);
    var corr = 1 - rk.ties / (N * N * N - N);
    if (corr > 0) H /= corr;
    return { H: H, df: k - 1, p: chi2Upper(H, k - 1), n: N };
  }

  // Per-sample TVLA over a simulated campaign.
  function tvla(sim, from, to) {
    from = from || 0; to = to || sim.T;
    var tvals = new Float64Array(to - from);
    var nf = 0, nr = 0, j, t;
    var sf = new Float64Array(sim.T), sr = new Float64Array(sim.T), qf = new Float64Array(sim.T), qr = new Float64Array(sim.T);
    for (j = 0; j < sim.n; j++) {
      var base = j * sim.T, fx = sim.group[j] === 1;
      if (fx) nf++; else nr++;
      for (t = from; t < to; t++) { var v = sim.data[base + t]; if (fx) { sf[t] += v; qf[t] += v * v; } else { sr[t] += v; qr[t] += v * v; } }
    }
    var maxAbs = 0, over = 0;
    for (t = from; t < to; t++) {
      var mf = sf[t] / nf, mr = sr[t] / nr;
      var vf = (qf[t] - nf * mf * mf) / (nf - 1), vr = (qr[t] - nr * mr * mr) / (nr - 1);
      var se = Math.sqrt(Math.max(0, vf) / nf + Math.max(0, vr) / nr);
      var tv = se > 0 ? (mf - mr) / se : 0;
      tvals[t - from] = tv;
      if (Math.abs(tv) > maxAbs) maxAbs = Math.abs(tv);
      if (Math.abs(tv) > 4.5) over++;
    }
    return { t: tvals, nFixed: nf, nRandom: nr, maxAbs: maxAbs, over: over };
  }

  // Per-sample paired Wilcoxon z, pairing the i-th fixed trace with the i-th
  // random trace, as a paired test requires.
  function wilcoxonTrace(sim, from, to) {
    from = from || 0; to = to || sim.T;
    var F = groupRows(sim, 1), R = groupRows(sim, 0), m = Math.min(F.length, R.length);
    var z = new Float64Array(to - from), x = new Array(m), y = new Array(m);
    for (var t = from; t < to; t++) {
      for (var i = 0; i < m; i++) { x[i] = sim.data[F[i] * sim.T + t]; y[i] = sim.data[R[i] * sim.T + t]; }
      z[t - from] = wilcoxonPaired(x, y).z || 0;
    }
    return { z: z, pairs: m };
  }

  var LAYOUT = { T: T, pre: PRE, opLen: OPLEN, leaks: LEAKS, steps: 40 };
  function stepAt(t) {
    var s = Math.floor((t - PRE) / OPLEN);
    if (s < 0 || s > 39) return null;
    var names = ["AddRoundKey"];
    for (var r = 1; r <= 10; r++) { names.push("SubBytes", "ShiftRows"); if (r < 10) names.push("MixColumns"); names.push("AddRoundKey"); }
    var rounds = [0];
    for (r = 1; r <= 10; r++) { rounds.push(r, r); if (r < 10) rounds.push(r); rounds.push(r); }
    var within = t - PRE - s * OPLEN, byte = Math.floor((within - 4) / 3);
    return { step: s, name: names[s], round: rounds[s], byte: (within >= 4 && byte < 16) ? byte : null };
  }

  var _lgamma = lgamma;
  var API = {
    _lgamma: _lgamma, _gammaQ: gammaQ, _ibeta: ibeta,
    rng: rng, SBOXES: SBOXES, AES_SBOX: AES_SBOX, expandKey: expandKey, encryptSteps: encryptSteps,
    nonlinearity: nonlinearity, HW: HW, hex: hex, toHex: toHex, TVLA_KEY: TVLA_KEY, TVLA_FIXED: TVLA_FIXED,
    simulate: simulate, column: column, groupRows: groupRows, DEFAULTS: DEFAULTS, LAYOUT: LAYOUT, stepAt: stepAt,
    normCdf: normCdf, normUpper: normUpper, normPdf: normPdf, qnorm: qnorm, chi2Upper: chi2Upper,
    kolmogorovUpper: kolmogorovUpper, tTwoSided: tTwoSided,
    meanVar: meanVar, welch: welch, shapiro: shapiro, ksOne: ksOne, ksTwo: ksTwo,
    wilcoxonPaired: wilcoxonPaired, kruskal: kruskal, tvla: tvla, wilcoxonTrace: wilcoxonTrace
  };
  root.SboxNormality = API;
  if (typeof module !== "undefined" && module.exports) module.exports = API;
})(typeof self !== "undefined" ? self : this);

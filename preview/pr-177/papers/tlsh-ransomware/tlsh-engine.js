/*
 * TLSH engine for /papers/tlsh-ransomware/ (thedracolab.com).
 *
 * Adapted to JavaScript from the reference C++ implementation of TLSH,
 * the Trend Micro Locality Sensitive Hash (github.com/trendmicro/tlsh,
 * src/tlsh_impl.cpp and src/tlsh_util.cpp), default build: 128 buckets,
 * 1-byte checksum, 5-byte sliding window, "T1" digest prefix.
 * The Pearson table (v_table) and length table (topval) are copied verbatim.
 *
 * Original work: Copyright 2013 Trend Micro Incorporated.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Modifications (DRACO Lab, 2026): ported to JavaScript; quartiles taken from
 * a sorted copy (the same order statistics the C++ partition search returns);
 * bucket counts, quartiles, and per-term distances exposed for the page's
 * demos; a SHA-256 helper and a seeded generator of synthetic byte strings
 * added for the page. Verified against the reference build's own regression
 * outputs (Testing/exp) and against the compiled `tlsh` tool on generated data.
 */
(function (root) {
  "use strict";

  var V = new Uint8Array([
    1, 87, 49, 12, 176, 178, 102, 166, 121, 193, 6, 84, 249, 230, 44, 163,
    14, 197, 213, 181, 161, 85, 218, 80, 64, 239, 24, 226, 236, 142, 38, 200,
    110, 177, 104, 103, 141, 253, 255, 50, 77, 101, 81, 18, 45, 96, 31, 222,
    25, 107, 190, 70, 86, 237, 240, 34, 72, 242, 20, 214, 244, 227, 149, 235,
    97, 234, 57, 22, 60, 250, 82, 175, 208, 5, 127, 199, 111, 62, 135, 248,
    174, 169, 211, 58, 66, 154, 106, 195, 245, 171, 17, 187, 182, 179, 0, 243,
    132, 56, 148, 75, 128, 133, 158, 100, 130, 126, 91, 13, 153, 246, 216, 219,
    119, 68, 223, 78, 83, 88, 201, 99, 122, 11, 92, 32, 136, 114, 52, 10,
    138, 30, 48, 183, 156, 35, 61, 26, 143, 74, 251, 94, 129, 162, 63, 152,
    170, 7, 115, 167, 241, 206, 3, 150, 55, 59, 151, 220, 90, 53, 23, 131,
    125, 173, 15, 238, 79, 95, 89, 16, 105, 137, 225, 224, 217, 160, 37, 123,
    118, 73, 2, 157, 46, 116, 9, 145, 134, 228, 207, 212, 202, 215, 69, 229,
    27, 188, 67, 124, 168, 252, 42, 4, 29, 108, 21, 247, 19, 205, 39, 203,
    233, 40, 186, 147, 198, 192, 155, 33, 164, 191, 98, 204, 165, 180, 117, 76,
    140, 36, 210, 172, 41, 54, 159, 8, 185, 232, 113, 196, 231, 47, 146, 120,
    51, 65, 28, 144, 254, 221, 93, 189, 194, 139, 112, 43, 71, 109, 184, 209
  ]);
  var TOPVAL = [
    1, 2, 3, 5, 7, 11, 17, 25,
    38, 57, 86, 129, 194, 291, 437, 656,
    854, 1110, 1443, 1876, 2439, 3171, 3475, 3823,
    4205, 4626, 5088, 5597, 6157, 6772, 7450, 8195,
    9014, 9916, 10907, 11998, 13198, 14518, 15970, 17567,
    19323, 21256, 23382, 25720, 28292, 31121, 34233, 37656,
    41422, 45564, 50121, 55133, 60646, 66711, 73382, 80721,
    88793, 97672, 107439, 118183, 130002, 143002, 157302, 173032,
    190335, 209369, 230306, 253337, 278670, 306538, 337191, 370911,
    408002, 448802, 493682, 543050, 597356, 657091, 722800, 795081,
    874589, 962048, 1058252, 1164078, 1280486, 1408534, 1549388, 1704327,
    1874759, 2062236, 2268459, 2495305, 2744836, 3019320, 3321252, 3653374,
    4018711, 4420582, 4862641, 5348905, 5883796, 6472176, 7119394, 7831333,
    8614467, 9475909, 10423501, 11465851, 12612437, 13873681, 15261050, 16787154,
    18465870, 20312458, 22343706, 24578077, 27035886, 29739474, 32713425, 35984770,
    39583245, 43541573, 47895730, 52685306, 57953837, 63749221, 70124148, 77136564,
    84850228, 93335252, 102668779, 112935659, 124229227, 136652151, 150317384, 165349128,
    181884040, 200072456, 220079703, 242087671, 266296456, 292926096, 322218735, 354440623,
    389884688, 428873168, 471760495, 518936559, 570830240, 627913311, 690704607, 759775136,
    835752671, 919327967, 1011260767, 1112386880, 1223623232, 1345985727, 1480584256, 1628642751,
    1791507135, 1970657856, 2167723648, 2384496256, 2622945920, 2885240448, 3173764736, 3491141248,
    3840255616, 4224281216
  ];

  var EFF_BUCKETS = 128, CODE_SIZE = 32, MIN_DATA_LENGTH = 50;
  var RANGE_LVALUE = 256, RANGE_QRATIO = 16;
  var LENGTH_MULT = 12, QRATIO_MULT = 12;

  // Pearson-style mapping: b_mapping(salt, i, j, k); the salts below are V[salt index].
  function fastB(ms, i, j, k) { return V[V[V[ms ^ i] ^ j] ^ k]; }

  function lCapturing(len) {
    var bottom = 0, top = 170, idx = 85;
    for (;;) {
      if (idx === 0) return 0;
      if (len <= TOPVAL[idx] && len > TOPVAL[idx - 1]) return idx;
      if (len < TOPVAL[idx]) top = idx - 1; else bottom = idx + 1;
      idx = (bottom + top) >> 1;
    }
  }

  function modDiff(x, y, R) {
    var dl, dr;
    if (y > x) { dl = y - x; dr = x + R - y; } else { dl = x - y; dr = y + R - x; }
    return dl > dr ? dr : dl;
  }

  // Two-bit pair distance table: 0, 1, 2, then 6 for a jump of three quartiles.
  var PAIR = [0, 1, 2, 6];
  var BYTE_DIFF = new Uint8Array(65536);
  (function () {
    for (var a = 0; a < 256; a++) for (var b = 0; b < 256; b++) {
      var d = 0;
      for (var s = 0; s < 8; s += 2) d += PAIR[Math.abs(((a >> s) & 3) - ((b >> s) & 3))];
      BYTE_DIFF[(a << 8) | b] = d;
    }
  })();

  function hex2(b) { return (b < 16 ? "0" : "") + b.toString(16).toUpperCase(); }
  function swapByte(b) { return ((b & 0x0f) << 4) | ((b & 0xf0) >> 4); }

  // Count the 128 effective buckets (the C++ code counts 256 and reads the first 128).
  function buckets(data) {
    var a = new Uint32Array(256);
    var n = data.length, checksum = 0;
    for (var i = 4; i < n; i++) {
      var w0 = data[i], w1 = data[i - 1], w2 = data[i - 2], w3 = data[i - 3], w4 = data[i - 4];
      checksum = fastB(1, w0, w1, checksum);
      a[fastB(49, w0, w1, w2)]++;
      a[fastB(12, w0, w1, w3)]++;
      a[fastB(178, w0, w2, w3)]++;
      a[fastB(166, w0, w2, w4)]++;
      a[fastB(84, w0, w1, w4)]++;
      a[fastB(230, w0, w3, w4)]++;
    }
    return { counts: a, checksum: checksum };
  }

  // The six byte triplets each 5-byte window contributes (for the mechanism demo).
  var TRIPLETS = [[49, 0, 1, 2], [12, 0, 1, 3], [178, 0, 2, 3], [166, 0, 2, 4], [84, 0, 1, 4], [230, 0, 3, 4]];
  function windowBuckets(data, i) {
    // window ending at index i: w[0] = data[i], w[1] = data[i-1], ...
    var w = [data[i], data[i - 1], data[i - 2], data[i - 3], data[i - 4]];
    return TRIPLETS.map(function (t) {
      return { salt: t[0], bytes: [w[t[1]], w[t[2]], w[t[3]]], offsets: [t[1], t[2], t[3]], bucket: fastB(t[0], w[t[1]], w[t[2]], w[t[3]]) };
    });
  }

  function quartiles(counts) {
    var c = Array.prototype.slice.call(counts, 0, EFF_BUCKETS).sort(function (x, y) { return x - y; });
    return [c[EFF_BUCKETS / 4 - 1], c[EFF_BUCKETS / 2 - 1], c[EFF_BUCKETS - EFF_BUCKETS / 4 - 1]];
  }

  function toBytes(input) {
    if (input instanceof Uint8Array) return input;
    if (typeof input === "string") {
      if (typeof TextEncoder !== "undefined") return new TextEncoder().encode(input);
      return new Uint8Array(Buffer.from(input, "utf8"));
    }
    return new Uint8Array(input);
  }

  // Full TLSH: returns the digest and every intermediate the page shows.
  function hash(input) {
    var data = toBytes(input);
    var out = { length: data.length, valid: false, digest: "TNULL" };
    var b = buckets(data);
    out.counts = Array.prototype.slice.call(b.counts, 0, EFF_BUCKETS);
    if (data.length < MIN_DATA_LENGTH) { out.reason = "short"; return out; }
    var q = quartiles(b.counts);
    out.q = q;
    if (q[2] === 0) { out.reason = "flat"; return out; }
    var nonzero = 0;
    for (var i = 0; i < EFF_BUCKETS; i++) if (b.counts[i] > 0) nonzero++;
    out.nonzero = nonzero;
    if (nonzero <= 4 * CODE_SIZE / 2) { out.reason = "sparse"; return out; }
    var code = new Uint8Array(CODE_SIZE), levels = new Uint8Array(EFF_BUCKETS);
    for (var c = 0; c < CODE_SIZE; c++) {
      var h = 0;
      for (var j = 0; j < 4; j++) {
        var k = b.counts[4 * c + j], lv = 0;
        if (q[2] < k) lv = 3; else if (q[1] < k) lv = 2; else if (q[0] < k) lv = 1;
        levels[4 * c + j] = lv;
        h += lv << (j * 2);
      }
      code[c] = h;
    }
    var lvalue = lCapturing(data.length);
    var q1ratio = Math.floor(q[0] * 100 / q[2]) % 16;
    var q2ratio = Math.floor(q[1] * 100 / q[2]) % 16;
    var s = "T1" + hex2(swapByte(b.checksum)) + hex2(swapByte(lvalue)) + hex2(swapByte(q1ratio | (q2ratio << 4)));
    for (var r = CODE_SIZE - 1; r >= 0; r--) s += hex2(code[r]);
    out.valid = true;
    out.digest = s;
    out.checksum = b.checksum;
    out.lvalue = lvalue;
    out.q1ratio = q1ratio;
    out.q2ratio = q2ratio;
    out.code = code;
    out.levels = Array.prototype.slice.call(levels);
    return out;
  }

  // Parse a "T1..." (or bare 70-hex) digest back to its fields.
  function parse(str) {
    if (str && typeof str === "object") return str.valid ? str : null;
    str = String(str || "").trim();
    var start = str.slice(0, 2).toUpperCase() === "T1" ? 2 : 0;
    var hx = str.slice(start);
    if (!/^[0-9A-Fa-f]{70}$/.test(hx)) return null;
    var bytes = [];
    for (var i = 0; i < 70; i += 2) bytes.push(parseInt(hx.slice(i, i + 2), 16));
    var qb = swapByte(bytes[2]);
    var code = new Uint8Array(CODE_SIZE);
    for (var c = 0; c < CODE_SIZE; c++) code[c] = bytes[3 + CODE_SIZE - 1 - c];
    return { valid: true, digest: "T1" + hx.toUpperCase(), checksum: swapByte(bytes[0]), lvalue: swapByte(bytes[1]), q1ratio: qb & 15, q2ratio: qb >> 4, code: code };
  }

  // TLSH distance (lsh_bin_totalDiff) with each term reported separately.
  function diffParts(a, b, lenDiff) {
    a = parse(a); b = parse(b);
    if (!a || !b) return null;
    if (lenDiff === undefined) lenDiff = true;
    var parts = { length: 0, q1: 0, q2: 0, checksum: 0, body: 0 };
    if (lenDiff) {
      var ld = modDiff(a.lvalue, b.lvalue, RANGE_LVALUE);
      parts.length = ld === 0 ? 0 : ld === 1 ? 1 : ld * LENGTH_MULT;
    }
    var q1 = modDiff(a.q1ratio, b.q1ratio, RANGE_QRATIO);
    parts.q1 = q1 <= 1 ? q1 : (q1 - 1) * QRATIO_MULT;
    var q2 = modDiff(a.q2ratio, b.q2ratio, RANGE_QRATIO);
    parts.q2 = q2 <= 1 ? q2 : (q2 - 1) * QRATIO_MULT;
    if (a.checksum !== b.checksum) parts.checksum = 1;
    var body = 0;
    for (var i = 0; i < CODE_SIZE; i++) body += BYTE_DIFF[(a.code[i] << 8) | b.code[i]];
    parts.body = body;
    parts.total = parts.length + parts.q1 + parts.q2 + parts.checksum + body;
    return parts;
  }
  function diff(a, b, lenDiff) { var p = diffParts(a, b, lenDiff); return p ? p.total : null; }

  // The paper's scaling: MinMaxScaler over all scores, then inverted (1 = identical).
  function scaled(score, min, max) {
    if (min === undefined) min = 0;
    if (max === undefined) max = 1112;
    return 1 - (score - min) / (max - min);
  }

  /* ---------------------------------------------------------------- SHA-256 */
  var K256 = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];
  function sha256(input) {
    var data = toBytes(input);
    var len = data.length, nBlocks = ((len + 9 + 63) >> 6);
    var m = new Uint8Array(nBlocks * 64);
    m.set(data); m[len] = 0x80;
    var bits = len * 8;
    for (var i = 0; i < 8; i++) m[m.length - 1 - i] = Math.floor(bits / Math.pow(2, 8 * i)) & 255;
    var H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    var W = new Int32Array(64);
    for (var blk = 0; blk < nBlocks; blk++) {
      var o = blk * 64;
      for (var t = 0; t < 16; t++) W[t] = (m[o + 4 * t] << 24) | (m[o + 4 * t + 1] << 16) | (m[o + 4 * t + 2] << 8) | m[o + 4 * t + 3];
      for (t = 16; t < 64; t++) {
        var x = W[t - 15], y = W[t - 2];
        var s0 = ((x >>> 7) | (x << 25)) ^ ((x >>> 18) | (x << 14)) ^ (x >>> 3);
        var s1 = ((y >>> 17) | (y << 15)) ^ ((y >>> 19) | (y << 13)) ^ (y >>> 10);
        W[t] = (W[t - 16] + s0 + W[t - 7] + s1) | 0;
      }
      var a = H[0], b = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
      for (t = 0; t < 64; t++) {
        var S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
        var ch = (e & f) ^ (~e & g);
        var t1 = (h + S1 + ch + K256[t] + W[t]) | 0;
        var S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
        var mj = (a & b) ^ (a & c) ^ (b & c);
        var t2 = (S0 + mj) | 0;
        h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
      }
      H[0] = (H[0] + a) | 0; H[1] = (H[1] + b) | 0; H[2] = (H[2] + c) | 0; H[3] = (H[3] + d) | 0;
      H[4] = (H[4] + e) | 0; H[5] = (H[5] + f) | 0; H[6] = (H[6] + g) | 0; H[7] = (H[7] + h) | 0;
    }
    return H.map(function (v) { return ("00000000" + (v >>> 0).toString(16)).slice(-8); }).join("");
  }

  root.TLSHEngine = {
    hash: hash, parse: parse, diff: diff, diffParts: diffParts, scaled: scaled,
    buckets: function (d) { return buckets(toBytes(d)); }, windowBuckets: windowBuckets,
    quartiles: quartiles, lCapturing: lCapturing, sha256: sha256, toBytes: toBytes,
    EFF_BUCKETS: EFF_BUCKETS, MIN_DATA_LENGTH: MIN_DATA_LENGTH, PAPER_MAX: 1112, PAPER_CUTOFF: 100
  };
})(typeof self !== "undefined" ? self : this);

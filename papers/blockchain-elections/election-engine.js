/*
  election-engine.js: the computations behind /papers/blockchain-elections/.

  Cooley, Wolf, and Borowczak, "Blockchain-Based Election Infrastructures"
  (IEEE ISC2 2018) describe two student-built voting systems and publish no
  code. This file models what the paper states and marks every choice the
  paper leaves open as the page's own.

  1. SHA-256 (the same implementation as /papers/carbon-credit-chain/, checked
     there against Node's on 2,408 inputs and here again by reference/verify.js).
  2. Hash-linked chains (index | previous hash | data). The paper names no
     block format or consensus rule for the re-invent system; this one is the
     page's.
  3. The re-invent system's voting procedure, step for step from the paper's
     Figure 1: staff encode voter information and a unique key in the ID chain,
     the station checks that the key is on the ID chain and unused, and the
     ballot goes to the vote chain with the key, the ballot encrypted and the
     key hashed (Privacy section). The cipher is the page's choice: ElGamal in
     the exponent under an election key.
  4. The re-use system's ledger: hashes of voter IDs beside votes in the clear
     ("the system shows who each hash voted for").
  5. Majority agreement among polling stations ("would have to successfully
     hack 51% of the voting systems") and its binomial risk.
  6. A linkable ring signature (Liu, Wei, and Wong 2004, LSAG), the kind of
     ring signature the paper's Security section names: a block signed by one
     member of a group, without revealing which, with a tag that exposes a
     second signature by the same member. The group is a 2048-bit Schnorr
     group (256-bit prime order) generated with FIPS 186-4 parameters by
     Python's cryptography library; reference/verify.py checks its primes.

  Randomness comes from an injected source so that reference/verify.js can
  replay the Python reference bit for bit. Loads as a page script or in a
  Web Worker.
*/
(function (root) {
  "use strict";

  /* ------------------------------------------------------------------ 1. SHA-256 */

  var K = new Uint32Array([
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2]);
  function utf8(str) {
    if (typeof TextEncoder !== "undefined") return new TextEncoder().encode(str);
    return Uint8Array.from(Buffer.from(str, "utf8"));
  }
  function sha256(input) {
    var msg = typeof input === "string" ? utf8(input) : input;
    var len = msg.length, bitLen = len * 8;
    var total = ((len + 9 + 63) >> 6) << 6;
    var buf = new Uint8Array(total); buf.set(msg); buf[len] = 0x80;
    var hi = Math.floor(bitLen / 0x100000000), lo = bitLen >>> 0;
    buf[total - 8] = hi >>> 24; buf[total - 7] = hi >>> 16; buf[total - 6] = hi >>> 8; buf[total - 5] = hi;
    buf[total - 4] = lo >>> 24; buf[total - 3] = lo >>> 16; buf[total - 2] = lo >>> 8; buf[total - 1] = lo;
    var h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a, h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;
    var w = new Uint32Array(64);
    for (var off = 0; off < total; off += 64) {
      for (var i = 0; i < 16; i++) w[i] = (buf[off + 4 * i] << 24) | (buf[off + 4 * i + 1] << 16) | (buf[off + 4 * i + 2] << 8) | buf[off + 4 * i + 3];
      for (i = 16; i < 64; i++) {
        var x = w[i - 15], y = w[i - 2];
        var s0 = ((x >>> 7) | (x << 25)) ^ ((x >>> 18) | (x << 14)) ^ (x >>> 3);
        var s1 = ((y >>> 17) | (y << 15)) ^ ((y >>> 19) | (y << 13)) ^ (y >>> 10);
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
      }
      var a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;
      for (i = 0; i < 64; i++) {
        var S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
        var ch = (e & f) ^ (~e & g);
        var t1 = (h + S1 + ch + K[i] + w[i]) | 0;
        var S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
        var maj = (a & b) ^ (a & c) ^ (b & c);
        var t2 = (S0 + maj) | 0;
        h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
      }
      h0 = (h0 + a) | 0; h1 = (h1 + b) | 0; h2 = (h2 + c) | 0; h3 = (h3 + d) | 0;
      h4 = (h4 + e) | 0; h5 = (h5 + f) | 0; h6 = (h6 + g) | 0; h7 = (h7 + h) | 0;
    }
    return [h0, h1, h2, h3, h4, h5, h6, h7].map(function (v) { return ("00000000" + (v >>> 0).toString(16)).slice(-8); }).join("");
  }

  function hex(n) { return n.toString(16); }
  function hexToBig(h) { return BigInt("0x" + h); }

  /* ------------------------------------------------------------------ randomness */

  // sfc32 seeded from SHA-256 of a seed string: reproducible runs for the
  // reference check. Pages seed it from crypto.getRandomValues instead.
  function seededRng(seed) {
    var h = sha256("rng|" + seed);
    var a = parseInt(h.slice(0, 8), 16) | 0, b = parseInt(h.slice(8, 16), 16) | 0,
        c = parseInt(h.slice(16, 24), 16) | 0, d = parseInt(h.slice(24, 32), 16) | 0;
    function next() {
      var t = (((a + b) | 0) + d) | 0;
      d = (d + 1) | 0;
      a = b ^ (b >>> 9);
      b = (c + (c << 3)) | 0;
      c = (c << 21) | (c >>> 11);
      c = (c + t) | 0;
      return t >>> 0;
    }
    for (var i = 0; i < 12; i++) next();
    return {
      bytes: function (n) {
        var out = new Uint8Array(n);
        for (var i = 0; i < n; i += 4) {
          var v = next();
          for (var j = 0; j < 4 && i + j < n; j++) out[i + j] = (v >>> (24 - 8 * j)) & 255;
        }
        return out;
      }
    };
  }
  function cryptoRng() {
    var c = (typeof self !== "undefined" && self.crypto) || (typeof crypto !== "undefined" ? crypto : null);
    if (!c && typeof require === "function") c = require("crypto").webcrypto;
    return { bytes: function (n) { var b = new Uint8Array(n); c.getRandomValues(b); return b; } };
  }
  function bytesHex(b) { var s = ""; for (var i = 0; i < b.length; i++) s += (b[i] < 16 ? "0" : "") + b[i].toString(16); return s; }

  /* ------------------------------------------------------------------ 2. Hash-linked chains */

  var GENESIS_PREV = "0000000000000000000000000000000000000000000000000000000000000000";
  function blockHash(b) { return sha256(b.index + "|" + b.prev + "|" + b.data); }
  function Chain(name) { this.name = name; this.blocks = []; }
  Chain.prototype.append = function (data) {
    var prev = this.blocks.length ? this.blocks[this.blocks.length - 1].hash : GENESIS_PREV;
    var b = { index: this.blocks.length, prev: prev, data: data };
    b.hash = blockHash(b);
    this.blocks.push(b);
    return b;
  };
  // First block whose stored hash or back-link no longer checks out, or -1.
  function firstBroken(blocks) {
    for (var i = 0; i < blocks.length; i++) {
      var b = blocks[i];
      if (blockHash(b) !== b.hash) return i;
      if (b.prev !== (i ? blocks[i - 1].hash : GENESIS_PREV)) return i;
    }
    return -1;
  }
  function field(data, name) {
    var m = new RegExp("(?:^|;)" + name + "=([^;]*)").exec(data);
    return m ? m[1] : null;
  }

  /* ------------------------------------------------------------------ group arithmetic */

  var P = hexToBig(
    "93f07abffd3333990d8ba0b2ced409c27eb59a2ae9b1e42f13bf21bfe055e87f" +
    "c2acf4b7ebb59dbedda7f2f8f8a30f9c0843101b4eaa2b3fbded819bffcc3149" +
    "269b4cfead2c409edcfa6d0be26854934ef94b4bd4b546f6f0d8156e48592d05" +
    "456ceaeb4d741b6cdd40ba8a7675e816de6e328045e1c536d48b5cd10c406570" +
    "098349909712abc27ff23be601715ea9b9feb8cb4f3aa680c9aa076fc064f2a1" +
    "b3bb3e90f2f8a572671af7c2038a1a27ccf5e082fe629d2118be52270beafc6b" +
    "790126328864e449ba1a2feded08caed529484cf8646140f7990a503ff5f7611" +
    "55aeb35d0b34967059e69e36b52088859eda0f63f7c102e58def07cb2654fb3d");
  var Q = hexToBig("8872032cb43b86492ca71a8f5a1049a08302f42f867d43459ca708a1044f8f8f");
  var G = hexToBig(
    "242f6a3f174dc8a90b96f0c63d81fff8732c74a8f330947c488b9191107b3dd6" +
    "b00cd5d99b564fe4b6efaf6a26c91636bebd3dacb24a0fdd53d2de82dfe91e57" +
    "640c8c259681f5044397d348a92e5e32b88d30e306bd5d85594a242f96b1419e" +
    "2dcabf25e90ac9d9b483e806c86464c04ebcdd301f41a046c56bd394e0fe3f0c" +
    "7f40b17c7d90f6862e79b446ca1411ba49d9d431a4ad69a9941f3d91588296fc" +
    "68bd523e7f73e0c71c171be0fd29b07d04092b74871aa790097ffe5ba5ef0881" +
    "474eaee2d6c1ae8d3bd15cf9fb0463574b006db95688464e09ab313fc9d93312" +
    "988e531bf8014434956f75556bfd56fdc089163bd2a35405a2134a65f59a593");
  var COFACTOR = (P - 1n) / Q;

  function modpow(b, e, m) {
    var r = 1n; b %= m; if (b < 0n) b += m;
    while (e > 0n) { if (e & 1n) r = (r * b) % m; e >>= 1n; if (e) b = (b * b) % m; }
    return r;
  }
  function mod(a, m) { var r = a % m; return r < 0n ? r + m : r; }
  function randomScalar(rng) { return mod(hexToBig(bytesHex(rng.bytes(48))), Q - 1n) + 1n; }
  function hashScalar(parts) { return mod(hexToBig(sha256(parts.join("|"))), Q); }
  function hashToGroup(s) {
    for (var k = 0; ; k++) {
      var tag = k ? s + "#" + k : s, h = "";
      for (var i = 0; i < 9; i++) h += sha256(tag + "|" + i);
      var e = modpow(mod(hexToBig(h), P), COFACTOR, P);
      if (e !== 1n) return e;
    }
  }
  function keygen(rng) { var x = randomScalar(rng); return { x: x, y: modpow(G, x, P) }; }
  function inGroup(e) { return e > 1n && e < P && modpow(e, Q, P) === 1n; }

  /* ------------------------------------------------------------------ 3. ElGamal in the exponent */

  function encrypt(pk, m, rng) {
    var r = randomScalar(rng);
    return { a: modpow(G, r, P), b: (modpow(G, BigInt(m), P) * modpow(pk, r, P)) % P };
  }
  function decrypt(sk, ct, maxM) {
    var M = (ct.b * modpow(ct.a, Q - sk, P)) % P, t = 1n;
    for (var m = 0; m <= maxM; m++) { if (t === M) return m; t = (t * G) % P; }
    return -1;
  }

  /* ------------------------------------------------------------------ 3. Re-invent: two chains (Figure 1) */

  function Election(opts) {
    opts = opts || {};
    this.rng = opts.rng || cryptoRng();
    this.candidates = opts.candidates || ["A", "B", "C"];
    this.key = keygen(this.rng);              // election key (page's choice)
    this.idChain = new Chain("ID chain");
    this.voteChain = new Chain("Vote chain");
    this.closed = false;
  }
  // Staff: voter information and a unique key encoded in the ID chain.
  Election.prototype.register = function (voterInfo) {
    var key = bytesHex(this.rng.bytes(16));
    var block = this.idChain.append("voter=" + sha256("voter|" + voterInfo) + ";key=" + sha256("key|" + key));
    return { key: key, block: block };
  };
  // Station: check that the key is on the ID chain and not yet on the vote chain.
  Election.prototype.check = function (key) {
    var kh = sha256("key|" + key);
    var issued = this.idChain.blocks.some(function (b) { return field(b.data, "key") === kh; });
    if (!issued) return { ok: false, reason: "not-issued", keyHash: kh };
    var used = this.voteChain.blocks.some(function (b) { return field(b.data, "key") === kh; });
    if (used) return { ok: false, reason: "used", keyHash: kh };
    if (this.closed) return { ok: false, reason: "closed", keyHash: kh };
    return { ok: true, keyHash: kh };
  };
  // Station: encode the (encrypted) vote with the hashed key into the vote chain.
  Election.prototype.cast = function (key, choice) {
    var chk = this.check(key);
    if (!chk.ok) return chk;
    var ct = encrypt(this.key.y, choice, this.rng);
    var block = this.voteChain.append("key=" + chk.keyHash + ";ballot=" + hex(ct.a) + "," + hex(ct.b));
    return { ok: true, keyHash: chk.keyHash, block: block, ct: ct };
  };
  Election.prototype.ballotOf = function (block) {
    var b = field(block.data, "ballot").split(",");
    return { a: hexToBig(b[0]), b: hexToBig(b[1]) };
  };
  Election.prototype.tally = function () {
    var self = this, counts = this.candidates.map(function () { return 0; });
    this.voteChain.blocks.forEach(function (b) {
      var m = decrypt(self.key.x, self.ballotOf(b), self.candidates.length - 1);
      if (m >= 0) counts[m]++;
    });
    return counts;
  };

  /* ------------------------------------------------------------------ 4. Re-use: hashed IDs, votes in the clear */

  function ReuseLedger(approvedIds, candidates) {
    this.approved = {};
    var self = this;
    (approvedIds || []).forEach(function (id) { self.approved[sha256("voter|" + id)] = true; });
    this.candidates = candidates || ["A", "B", "C"];
    this.chain = new Chain("Re-use ledger");
  }
  ReuseLedger.prototype.cast = function (voterId, choice) {
    var vh = sha256("voter|" + voterId);
    if (!this.approved[vh]) return { ok: false, reason: "not-approved", voterHash: vh };
    if (this.chain.blocks.some(function (b) { return field(b.data, "voter") === vh; })) return { ok: false, reason: "used", voterHash: vh };
    var block = this.chain.append("voter=" + vh + ";vote=" + choice);
    return { ok: true, voterHash: vh, block: block };
  };
  ReuseLedger.prototype.tally = function () {
    var counts = this.candidates.map(function () { return 0; });
    this.chain.blocks.forEach(function (b) { counts[+field(b.data, "vote")]++; });
    return counts;
  };

  /* ------------------------------------------------------------------ 5. Majority among polling stations */

  // states: "honest" | "tampered" | "offline". A ledger version is accepted
  // when more than half of the stations still online hold it (page's rule).
  function consensus(states) {
    var online = 0, honest = 0, tampered = 0;
    states.forEach(function (s) { if (s !== "offline") online++; if (s === "honest") honest++; if (s === "tampered") tampered++; });
    var need = Math.floor(online / 2) + 1;
    var winner = online === 0 ? "none" : honest >= need ? "honest" : tampered >= need ? "tampered" : "none";
    return { online: online, honest: honest, tampered: tampered, need: need, winner: winner };
  }
  function minToFlip(n) { return Math.floor(n / 2) + 1; }
  // P(at least k of n stations compromised), each independently with probability p.
  function binomTail(n, k, p) {
    if (k <= 0) return 1; if (k > n) return 0;
    if (p <= 0) return 0; if (p >= 1) return 1;
    var lp = Math.log(p), lq = Math.log(1 - p), lc = 0, tot = 0;
    var logs = [];
    for (var i = 0; i <= n; i++) {
      if (i > 0) lc += Math.log((n - i + 1) / i);
      if (i >= k) logs.push(lc + i * lp + (n - i) * lq);
    }
    var mx = Math.max.apply(null, logs);
    logs.forEach(function (l) { tot += Math.exp(l - mx); });
    return Math.exp(mx) * tot;
  }

  /* ------------------------------------------------------------------ 6. Linkable ring signature (LSAG) */

  function ringText(ring) { return ring.map(hex).join(","); }
  function lsagSign(msg, ring, pi, x, rng) {
    var n = ring.length, L = ringText(ring);
    var h = hashToGroup("ring|" + L), I = modpow(h, x, P);
    var u = randomScalar(rng), c = new Array(n), s = new Array(n);
    c[(pi + 1) % n] = hashScalar(["lsag", L, hex(I), msg, hex(modpow(G, u, P)), hex(modpow(h, u, P))]);
    for (var k = 1; k < n; k++) {
      var i = (pi + k) % n;
      s[i] = randomScalar(rng);
      var z1 = (modpow(G, s[i], P) * modpow(ring[i], c[i], P)) % P;
      var z2 = (modpow(h, s[i], P) * modpow(I, c[i], P)) % P;
      c[(i + 1) % n] = hashScalar(["lsag", L, hex(I), msg, hex(z1), hex(z2)]);
    }
    s[pi] = mod(u - x * c[pi], Q);
    return { c0: c[0], s: s, I: I };
  }
  function lsagVerify(msg, ring, sig) {
    var n = ring.length, L = ringText(ring);
    if (!sig || sig.s.length !== n || !inGroup(sig.I)) return false;
    var h = hashToGroup("ring|" + L), c = sig.c0;
    for (var i = 0; i < n; i++) {
      var z1 = (modpow(G, sig.s[i], P) * modpow(ring[i], c, P)) % P;
      var z2 = (modpow(h, sig.s[i], P) * modpow(sig.I, c, P)) % P;
      c = hashScalar(["lsag", L, hex(sig.I), msg, hex(z1), hex(z2)]);
    }
    return c === sig.c0;
  }
  function linked(a, b) { return a.I === b.I; }

  var api = {
    sha256: sha256, seededRng: seededRng, cryptoRng: cryptoRng, bytesHex: bytesHex,
    GENESIS_PREV: GENESIS_PREV, blockHash: blockHash, Chain: Chain, firstBroken: firstBroken, field: field,
    P: P, Q: Q, G: G, modpow: modpow, randomScalar: randomScalar, hashScalar: hashScalar,
    hashToGroup: hashToGroup, keygen: keygen, inGroup: inGroup, hex: hex,
    encrypt: encrypt, decrypt: decrypt,
    Election: Election, ReuseLedger: ReuseLedger,
    consensus: consensus, minToFlip: minToFlip, binomTail: binomTail,
    lsagSign: lsagSign, lsagVerify: lsagVerify, linked: linked
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.ElectionEngine = api;
})(typeof self !== "undefined" ? self : this);

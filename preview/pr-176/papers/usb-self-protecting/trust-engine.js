/*
  Trust-based tamper detection for /papers/usb-self-protecting/.
  A port of the linear trust rule printed in Anderson, Borowczak, and Wilsey,
  "The Use of Device Simulation in Development of USB Storage Devices"
  (41st Annual Simulation Symposium, 2008), Section 5:

      private static final int START_TRUST = 3;
      private static final int INC_TRUST = 1;
      private static final int MAX_TRUST = 8;
      calcNewTrust(address, previousAddress, trust):
        duplicate address        -> trust unchanged
        previousAddress + 1      -> trust + INC_TRUST, capped at MAX_TRUST
        anything else            -> trust - INC_TRUST
      a tamper event occurs when trust <= 0 (Section 5 text).

  Choices the paper leaves open, each a named option here:
    unit:  "block"   expands each SCSI READ/WRITE into its logical blocks (Figure 4 plots block addresses)
           "request" feeds one address per command (the IoAction start address)
    ops:   "all", "read", or "write" (Section 2: all accesses, reads only, or writes only)
    first: the first access only sets previousAddress and leaves trust unchanged.
  The address cipher below is this page's stand-in; the paper encrypts addresses
  but does not name a cipher.
  Loads as a page script or in a Web Worker.
*/
(function (root) {
  "use strict";

  var PAPER = { start: 3, inc: 1, max: 8 };

  // Exact port of calcNewTrust (Section 5).
  function calcNewTrust(address, previousAddress, trust, p) {
    p = p || PAPER;
    if (previousAddress === address) return trust;
    if (previousAddress + 1 === address) {
      trust += p.inc;
      if (trust > p.max) trust = p.max;
      return trust;
    }
    return trust - p.inc;
  }

  // A trace is a list of [op, lba, length]; op is "READ" or "WRITE".
  function addresses(trace, opts) {
    opts = opts || {};
    var unit = opts.unit || "block", ops = opts.ops || "all";
    var out = [];
    for (var i = 0; i < trace.length; i++) {
      var t = trace[i];
      if (ops === "read" && t[0] !== "READ") continue;
      if (ops === "write" && t[0] !== "WRITE") continue;
      if (unit === "request") out.push({ a: t[1], op: t[0], cmd: i });
      else for (var k = 0; k < t[2]; k++) out.push({ a: t[1] + k, op: t[0], cmd: i });
    }
    return out;
  }

  // Run the detector over an address list. Returns per-step trust and the first tamper step.
  function run(addrs, opts) {
    opts = opts || {};
    var p = { start: opts.start != null ? opts.start : PAPER.start,
              inc: opts.inc != null ? opts.inc : PAPER.inc,
              max: opts.max != null ? opts.max : PAPER.max };
    var trust = p.start, prev = null, tamper = -1, minT = trust;
    var series = new Array(addrs.length), kind = new Array(addrs.length);
    var nonSeq = 0, seq = 0, dup = 0, runNS = 0, maxRunNS = 0;
    for (var i = 0; i < addrs.length; i++) {
      var a = typeof addrs[i] === "number" ? addrs[i] : addrs[i].a;
      if (prev === null) { kind[i] = "first"; }
      else {
        var before = trust;
        trust = calcNewTrust(a, prev, trust, p);
        if (prev === a) { kind[i] = "dup"; dup++; }
        else if (prev + 1 === a) { kind[i] = "seq"; seq++; runNS = 0; }
        else { kind[i] = "jump"; nonSeq++; runNS++; if (runNS > maxRunNS) maxRunNS = runNS; }
        if (trust < minT) minT = trust;
        if (tamper < 0 && trust <= 0) tamper = i;
      }
      series[i] = trust;
      prev = a;
    }
    return { trust: series, kind: kind, tamper: tamper, minTrust: minT, jumps: nonSeq,
             seq: seq, dup: dup, maxRunJumps: maxRunNS, n: addrs.length, params: p };
  }

  // Smallest START_TRUST (with the given inc and max) that never reaches zero on every trace.
  function minimalStart(addrLists, inc, max) {
    for (var s = 1; s <= 64; s++) {
      var ok = addrLists.every(function (al) { return run(al, { start: s, inc: inc, max: max }).tamper < 0; });
      if (ok) return s;
    }
    return null;
  }

  /* ---- deterministic pseudo-random numbers (mulberry32) ---- */
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

  /* ---- stand-in address cipher: a small keyed Feistel permutation with cycle walking ---- */
  function bitsFor(n) { var b = 2; while ((1 << b) < n) b++; if (b % 2) b++; return b; }
  function feistel(x, key, bits, inverse) {
    var h = bits / 2, mask = (1 << h) - 1;
    var L = x >>> h, R = x & mask;
    function F(r, k) { var v = Math.imul(r ^ k, 0x45d9f3b) >>> 0; v ^= v >>> 13; v = Math.imul(v, 0x27d4eb2d) >>> 0; return (v ^ (v >>> 15)) & mask; }
    var keys = [];
    for (var i = 0; i < 4; i++) keys.push(Math.imul(key + i * 0x9e3779b1, 0x85ebca6b) >>> 0);
    if (!inverse) for (var j = 0; j < 4; j++) { var t = R; R = L ^ F(R, keys[j]); L = t; }
    else for (var m = 3; m >= 0; m--) { var u = L; L = R ^ F(L, keys[m]); R = u; }
    return (L << h) | R;
  }
  function encrypt(addr, key, nBlocks) {
    var b = bitsFor(nBlocks), x = addr;
    do { x = feistel(x, key, b, false); } while (x >= nBlocks);
    return x;
  }
  function decrypt(c, key, nBlocks) {
    var b = bitsFor(nBlocks), x = c;
    do { x = feistel(x, key, b, true); } while (x >= nBlocks);
    return x;
  }

  /* ---- access patterns for someone who has the device but not the driver ---- */
  // Each returns the block addresses the device sees after decryption with its own key.
  function intruder(kind, nBlocks, count, seed, deviceKey) {
    var r = rng(seed), out = [], i;
    if (kind === "dump") {             // reads the raw device from block 0 without the driver's cipher
      for (i = 0; i < count; i++) out.push(decrypt(i % nBlocks, deviceKey, nBlocks));
    } else if (kind === "wrongkey") {  // a driver with the wrong key reading files in order
      var guess = (deviceKey ^ 0x5bd1e995) >>> 0;
      for (i = 0; i < count; i++) out.push(decrypt(encrypt(i % nBlocks, guess, nBlocks), deviceKey, nBlocks));
    } else if (kind === "random") {    // random probing of plaintext addresses
      for (i = 0; i < count; i++) out.push(Math.floor(r() * nBlocks));
    } else if (kind === "replay") {    // the right driver, correct cipher: a sequential read of the whole device
      for (i = 0; i < count; i++) out.push(i % nBlocks);
    }
    return out;
  }

  var api = {
    PAPER: PAPER, calcNewTrust: calcNewTrust, addresses: addresses, run: run,
    minimalStart: minimalStart, rng: rng, encrypt: encrypt, decrypt: decrypt, intruder: intruder
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.UsbTrust = api;
})(typeof self !== "undefined" ? self : this);

/*
  carbon-engine.js: the computations behind /papers/carbon-credit-chain/.

  1. Ledger: a JavaScript model of the three Solidity contracts the paper links
     (CarbonCreditProject/Carbon-Project, commit a9e478f: carboncredits.sol,
     credittoken.sol, certification.sol, on OpenZeppelin 3.2 Ownable and ERC20).
     Each call runs as a transaction: it either succeeds and changes state, or
     reverts with the same reason string and leaves state untouched.
     reference/verify-contracts.js runs the same call sequences against the
     compiled contracts in an Ethereum virtual machine and compares every
     result and every public value. The repository's files carry the SPDX tag
     "UNLICENSED"; this file models their behavior and copies no code.
  2. Design: the paper's stated rules that the released code does not
     implement (verifier approval by at least 70 percent of verifiers before a
     mint or burn, one certificate per 20 burned tokens).
  3. SHA-256 and a hash-linked chain with proof of work (Section 2.1).
  4. The paper's worked offset example and its fee figures.

  Loads as a page script or in a Web Worker.
*/
(function (root) {
  "use strict";

  /* ------------------------------------------------------------------ 1. Ledger */

  var ZERO = "0x0";
  var UINT_MAX = (1n << 256n) - 1n;
  function Revert(msg) { this.revert = msg; }
  function fail(msg) { throw new Revert(msg); }
  function big(x) { return typeof x === "bigint" ? x : BigInt(x); }
  function wrap(x) { return x & UINT_MAX; }                 // Solidity 0.6 unchecked arithmetic
  function safeAdd(a, b) { var c = a + b; if (c > UINT_MAX) fail("SafeMath: addition overflow"); return c; }
  function safeSub(a, b, msg) { if (b > a) fail(msg || "SafeMath: subtraction overflow"); return a - b; }

  function Ledger(deployer) {
    this.s = {
      owner: deployer,
      totalRegistered: 0n, verifiercount: 0n, customercount: 0n,
      CreditHolders: {}, verifiers: {}, customers: {},
      totalsupply: 0n, supply: 0n, tokenBurnedCount: 0n,
      BalanceOf: {}, approvedCredits: {}, tokensApprovedForBurn: {},
      idToOwner: {}, ownerToNFTokenCount: {}, burnedTokens: {},
      balances: {}, allowances: {}, totalSupply: 0n
    };
    this.log = [];
  }
  function get(map, k) { return map[k] || 0n; }
  function holderAt(s, i) { return s.CreditHolders[String(i)] || { name: "", id: 0n, holderId: 0n, creditsHeld: 0n, pricepercredit: 0n, creditvalidityperiod: 0n, _addr: ZERO }; }
  function verifierAt(s, i) { return s.verifiers[String(i)] || { name: "", homeCountry: "", reg_no: 0n, license_no: 0n, addr: ZERO, isExist: false }; }
  function customerAt(s, i) { return s.customers[String(i)] || { first_name: "", last_name: "", email: "", contact: 0n, _id: 0n }; }
  function clone(s) {
    var o = {};
    Object.keys(s).forEach(function (k) {
      var v = s[k];
      if (v && typeof v === "object") {
        o[k] = {};
        Object.keys(v).forEach(function (j) { o[k][j] = (v[j] && typeof v[j] === "object") ? Object.assign({}, v[j]) : v[j]; });
      } else o[k] = v;
    });
    return o;
  }

  // OpenZeppelin 3.2 ERC20 internals
  function _transfer(s, from, to, amount) {
    if (from === ZERO) fail("ERC20: transfer from the zero address");
    if (to === ZERO) fail("ERC20: transfer to the zero address");
    s.balances[from] = safeSub(get(s.balances, from), amount, "ERC20: transfer amount exceeds balance");
    s.balances[to] = safeAdd(get(s.balances, to), amount);
  }
  function _mint(s, to, amount) {
    if (to === ZERO) fail("ERC20: mint to the zero address");
    s.totalSupply = safeAdd(s.totalSupply, amount);
    s.balances[to] = safeAdd(get(s.balances, to), amount);
  }
  function _burn(s, from, amount) {
    if (from === ZERO) fail("ERC20: burn from the zero address");
    s.balances[from] = safeSub(get(s.balances, from), amount, "ERC20: burn amount exceeds balance");
    s.totalSupply = safeSub(s.totalSupply, amount);
  }
  function allowKey(o, sp) { return o + ">" + sp; }
  function _approve(s, owner, spender, amount) {
    if (owner === ZERO) fail("ERC20: approve from the zero address");
    if (spender === ZERO) fail("ERC20: approve to the zero address");
    s.allowances[allowKey(owner, spender)] = amount;
  }

  // Modifiers
  function onlyOwner(s, sender) { if (sender !== s.owner) fail("Ownable: caller is not the owner"); }
  function onlyVerifier(s, sender) { if (sender !== verifierAt(s, s.verifiercount).addr) fail(""); }
  function onlyCreditHolder(s, sender) { if (sender !== holderAt(s, s.totalRegistered)._addr) fail(""); }

  function burnTokens(s, sender) {        // CreditToken.burnTokens (onlyOwner)
    onlyOwner(s, sender);
    var amt = get(s.tokensApprovedForBurn, sender);
    _burn(s, sender, amt);
    s.totalsupply = safeSub(s.totalsupply, amt);
    s.BalanceOf[sender] = safeSub(get(s.BalanceOf, sender), amt);
    return true;
  }
  function transferFrom(s, sender, from, to, value) {   // ERC20.transferFrom
    _transfer(s, from, to, value);
    _approve(s, from, sender, safeSub(get(s.allowances, allowKey(from, sender)), value, "ERC20: transfer amount exceeds allowance"));
    return true;
  }

  var FUNCS = {
    // carboncredits.sol
    registerCreditHolder: function (s, sender, a) {
      s.totalRegistered = wrap(s.totalRegistered + 1n);
      s.CreditHolders[String(s.totalRegistered)] = { name: String(a[0]), id: s.totalRegistered, holderId: big(a[1]), creditsHeld: big(a[2]), pricepercredit: big(a[3]), creditvalidityperiod: big(a[4]), _addr: sender };
    },
    registerVerifiers: function (s, sender, a) {
      s.verifiercount = wrap(s.verifiercount + 1n);
      if (verifierAt(s, big(a[2])).isExist !== false) fail("validator already registered");
      s.verifiers[String(s.verifiercount)] = { name: String(a[0]), homeCountry: String(a[1]), reg_no: big(a[2]), license_no: big(a[3]), addr: sender, isExist: true };
    },
    registerCustomer: function (s, sender, a) {
      s.customercount = wrap(s.customercount + 1n);
      s.customers[String(s.customercount)] = { first_name: String(a[0]), last_name: String(a[1]), email: String(a[2]), contact: big(a[3]), _id: s.customercount };
    },
    // credittoken.sol
    approveCreditsHeld: function (s, sender, a) {
      onlyVerifier(s, sender);
      var cred = holderAt(s, s.totalRegistered).creditsHeld;
      s.approvedCredits[a[0]] = wrap(get(s.approvedCredits, a[0]) + cred);
    },
    createCarbonToken: function (s, sender) {
      onlyCreditHolder(s, sender);
      var owner = holderAt(s, s.totalRegistered)._addr;
      s.supply = get(s.approvedCredits, owner);
      s.totalsupply = safeAdd(s.totalsupply, s.supply);
      s.BalanceOf[owner] = safeAdd(get(s.BalanceOf, owner), s.supply);
      _mint(s, sender, s.supply);
      return s.totalsupply;
    },
    transferCredits: function (s, sender, a) {
      onlyCreditHolder(s, sender);
      var to = a[0], value = big(a[1]);
      _transfer(s, sender, to, value);
      s.BalanceOf[sender] = safeSub(get(s.BalanceOf, sender), value);
      s.BalanceOf[to] = safeAdd(get(s.BalanceOf, to), value);
    },
    transferCreditsFrom: function (s, sender, a) {
      var from = a[0], to = a[1], value = big(a[2]);
      transferFrom(s, sender, from, to, value);
      s.BalanceOf[from] = safeSub(get(s.BalanceOf, from), value);
      s.BalanceOf[to] = safeAdd(get(s.BalanceOf, to), value);
    },
    approveBurn: function (s, sender, a) {
      onlyVerifier(s, sender);
      s.tokensApprovedForBurn[a[1]] = wrap(get(s.tokensApprovedForBurn, a[1]) + big(a[0]));
    },
    burnTokens: function (s, sender) { return burnTokens(s, sender); },
    buyCarbonCredits: function (s, sender, a, value, self) {
      var v = wrap(big(a[0]) * 1n);
      if (!(big(value || 0) > 0n)) fail("");
      FUNCS.transferCreditsFrom(s, sender, [self, sender, v]);
    },
    // ERC20 public surface used by the page
    transfer: function (s, sender, a) { _transfer(s, sender, a[0], big(a[1])); return true; },
    approve: function (s, sender, a) { _approve(s, sender, a[0], big(a[1])); return true; },
    // certification.sol
    addBurnedTokens: function (s, sender, a) {
      if (burnTokens(s, sender) === true) {
        var burned = get(s.tokensApprovedForBurn, a[0]);
        s.burnedTokens[a[0]] = safeAdd(get(s.burnedTokens, a[0]), burned);
      }
    }
  };

  Ledger.prototype.call = function (fn, sender, args, value) {
    var before = clone(this.s);
    var entry = { fn: fn, sender: sender, args: args || [], ok: true, revert: null, ret: undefined };
    try { entry.ret = FUNCS[fn](this.s, sender, args || [], value, this.self || "0xC0"); }
    catch (e) {
      if (!(e instanceof Revert)) throw e;
      this.s = before; entry.ok = false; entry.revert = e.revert;
    }
    this.log.push(entry);
    return entry;
  };
  Ledger.prototype.view = function (fn, args, sender) {
    var s = this.s, a = args || [];
    switch (fn) {
      case "owner": return s.owner;
      case "balanceOf": return get(s.balances, a[0]);
      case "totalSupply": return s.totalSupply;
      case "allowance": return get(s.allowances, allowKey(a[0], a[1]));
      case "BalanceOf": return get(s.BalanceOf, a[0]);
      case "approvedCredits": return get(s.approvedCredits, a[0]);
      case "tokensApprovedForBurn": return get(s.tokensApprovedForBurn, a[0]);
      case "burnedTokens": return get(s.burnedTokens, a[0]);
      case "CreditHolders": return holderAt(s, big(a[0]));
      case "verifiers": return verifierAt(s, big(a[0]));
      case "customers": return customerAt(s, big(a[0]));
      case "getVerifiers": {                     // returns slots 0 .. verifiercount-1
        var r = []; for (var i = 0n; i < s.verifiercount; i++) r.push(verifierAt(s, i)); return { ok: true, v: r };
      }
      case "getCreditHoilders": {                // array sized by verifiercount, filled to totalRegistered
        if (s.totalRegistered > s.verifiercount) return { ok: false, v: "out of bounds" };
        var h = []; for (var j = 0n; j < s.verifiercount; j++) h.push(j < s.totalRegistered ? holderAt(s, j) : holderAt(s, -1));
        return { ok: true, v: h };
      }
      case "getCustomerProfile": {
        if (sender !== s.owner) return { ok: false, v: "Ownable: caller is not the owner" };
        var c = []; for (var k = 0n; k < s.customercount; k++) c.push(customerAt(s, k)); return { ok: true, v: c };
      }
    }
    throw new Error("unknown view " + fn);
  };
  Ledger.prototype.snapshot = function () { return clone(this.s); };

  /* ------------------------------------------------------------------ 2. The paper's design rules */

  var Design = {
    THRESHOLD: 0.7,          // Section 3.3.3: "approval by at least 70% of the verifiers"
    CERT_EVERY: 20,          // README: "Mint an ERC721 token for every 20 Carbon tokens burnt"
    AMM_FEE: 0.003,          // Section 3.3.4: "example: 0.3%"
    BROKER_LOW: 0.03, BROKER_HIGH: 0.08, BROKER_AVG: 0.05,  // Section 1.3.2
    // Smallest number of approvals that meets "at least 70%" of n verifiers (integer arithmetic).
    needed: function (n) { return Math.ceil((7 * n) / 10 - 1e-12); },
    approved: function (yes, n) { return n > 0 && yes * 10 >= 7 * n; },
    certificates: function (burned) { return Math.floor(burned / 20); },
    // What the released code would do: certification.sol mints only when burnedTokens > 20, and its mint is internal.
    codeCertificateEligible: function (burned) { return burned > 20; }
  };

  /* ------------------------------------------------------------------ 3. SHA-256 and a hash-linked chain */

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

  var GENESIS_PREV = "0000000000000000000000000000000000000000000000000000000000000000";
  function blockText(b) { return b.index + "|" + b.prev + "|" + b.data + "|" + b.nonce; }
  function blockHash(b) { return sha256(blockText(b)); }
  function meets(hash, zeros) { for (var i = 0; i < zeros; i++) if (hash.charCodeAt(i) !== 48) return false; return true; }
  // Search nonces from `from` for a hash with `zeros` leading hexadecimal zeros; gives up after `budget` tries.
  function mine(b, zeros, budget, from) {
    var n = from || 0, tries = 0, limit = budget || Infinity, hash;
    while (tries < limit) {
      b.nonce = n; hash = blockHash(b); tries++;
      if (meets(hash, zeros)) return { found: true, nonce: n, hash: hash, tries: tries };
      n++;
    }
    return { found: false, nonce: n, tries: tries };
  }
  function buildChain(datas, zeros) {
    var chain = [], prev = GENESIS_PREV, totalTries = 0;
    datas.forEach(function (d, i) {
      var b = { index: i, prev: prev, data: d, nonce: 0 };
      var m = mine(b, zeros, Infinity, 0);
      b.nonce = m.nonce; b.hash = m.hash; totalTries += m.tries;
      chain.push(b); prev = b.hash;
    });
    return { chain: chain, tries: totalTries };
  }
  // Validate the way any node would: recompute each block's hash, check its proof of work,
  // and check that it names the previous block's recomputed hash.
  function validate(chain, zeros) {
    var out = [], prev = GENESIS_PREV;
    chain.forEach(function (b) {
      var h = blockHash(b);
      out.push({ hash: h, linkOk: b.prev === prev, workOk: meets(h, zeros) });
      prev = h;
    });
    return out;
  }

  /* ------------------------------------------------------------------ 4. The paper's numbers */

  // Section 1.3.1: "the regulatory body allots company A 100 units ... emitting 120 units ...
  // Landowner B preserves forest and receives 50 carbon offset credits. Company A buys 20."
  function offset(cap, emitted, landCredits) {
    var shortfall = Math.max(0, emitted - cap);
    var bought = Math.min(shortfall, landCredits);
    return { shortfall: shortfall, bought: bought, newCap: cap + bought, compliant: emitted <= cap + bought, sellerLeft: landCredits - bought, uncovered: shortfall - bought };
  }
  // Section 1.3: "10.9 billion USD in 2005 ... continued to grow at an annual rate of 108%, growing to 143.7 billion USD in 2009"
  function growth(start, end, years) { return Math.pow(end / start, 1 / years) - 1; }
  function project(start, rate, years) { return start * Math.pow(1 + rate, years); }

  root.CarbonChain = {
    Ledger: Ledger, ZERO: ZERO, Design: Design,
    sha256: sha256, blockHash: blockHash, blockText: blockText, mine: mine, meets: meets,
    buildChain: buildChain, validate: validate, GENESIS_PREV: GENESIS_PREV,
    offset: offset, growth: growth, project: project
  };
  if (typeof module !== "undefined" && module.exports) module.exports = root.CarbonChain;
})(typeof self !== "undefined" ? self : this);

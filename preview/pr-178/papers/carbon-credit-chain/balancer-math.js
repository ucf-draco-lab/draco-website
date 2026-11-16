/*
  balancer-math.js: fixed-point pool arithmetic for /papers/carbon-credit-chain/.

  Adapted from Balancer V1 (balancer-labs/balancer-core, commit f4ed5d6,
  contracts/BNum.sol, contracts/BMath.sol, contracts/BConst.sol, and the swap
  checks in contracts/BPool.sol), Copyright Balancer Labs.

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with this program.  If not, see <http://www.gnu.org/licenses/>.

  The paper's README names a Balancer smart pool as the market for carbon
  tokens. Every function below works on 18-decimal fixed-point BigInt values
  (BONE = 10^18), rounds exactly as the Solidity does, and throws the same
  error strings. reference/verify-balancer.js checks it against BMath.sol
  and BPool.sol compiled with solc 0.5.12 and run in an Ethereum virtual machine.
*/
(function (root) {
  "use strict";

  var BONE = 10n ** 18n;
  var C = {
    BONE: BONE,
    MIN_FEE: BONE / 10n ** 6n,
    MAX_FEE: BONE / 10n,
    EXIT_FEE: 0n,
    MIN_WEIGHT: BONE,
    MAX_WEIGHT: BONE * 50n,
    MAX_TOTAL_WEIGHT: BONE * 50n,
    MIN_BALANCE: BONE / 10n ** 12n,
    MIN_BPOW_BASE: 1n,
    MAX_BPOW_BASE: 2n * BONE - 1n,
    BPOW_PRECISION: BONE / 10n ** 10n,
    MAX_IN_RATIO: BONE / 2n,
    MAX_OUT_RATIO: BONE / 3n + 1n
  };
  var UINT_MAX = (1n << 256n) - 1n;

  function fail(msg) { var e = new Error(msg); e.revert = msg; throw e; }
  function u(x) { if (x < 0n || x > UINT_MAX) fail("uint256 out of range"); return x; }

  /* BNum.sol */
  function btoi(a) { return a / BONE; }
  function bfloor(a) { return btoi(a) * BONE; }
  function badd(a, b) { var c = a + b; if (c > UINT_MAX) fail("ERR_ADD_OVERFLOW"); return c; }
  function bsubSign(a, b) { return a >= b ? [a - b, false] : [b - a, true]; }
  function bsub(a, b) { var r = bsubSign(a, b); if (r[1]) fail("ERR_SUB_UNDERFLOW"); return r[0]; }
  function bmul(a, b) {
    var c0 = a * b;
    if (c0 > UINT_MAX) fail("ERR_MUL_OVERFLOW");
    var c1 = c0 + BONE / 2n;
    if (c1 > UINT_MAX) fail("ERR_MUL_OVERFLOW");
    return c1 / BONE;
  }
  function bdiv(a, b) {
    if (b === 0n) fail("ERR_DIV_ZERO");
    var c0 = a * BONE;
    if (c0 > UINT_MAX) fail("ERR_DIV_INTERNAL");
    var c1 = c0 + b / 2n;
    if (c1 > UINT_MAX) fail("ERR_DIV_INTERNAL");
    return c1 / b;
  }
  function bpowi(a, n) {
    var z = n % 2n !== 0n ? a : BONE;
    for (n /= 2n; n !== 0n; n /= 2n) {
      a = bmul(a, a);
      if (n % 2n !== 0n) z = bmul(z, a);
    }
    return z;
  }
  function bpowApprox(base, exp, precision) {
    var a = exp;
    var xs = bsubSign(base, BONE), x = xs[0], xneg = xs[1];
    var term = BONE, sum = term, negative = false;
    for (var i = 1n; term >= precision; i++) {
      var bigK = i * BONE;
      var cs = bsubSign(a, bsub(bigK, BONE)), c = cs[0], cneg = cs[1];
      term = bmul(term, bmul(c, x));
      term = bdiv(term, bigK);
      if (term === 0n) break;
      if (xneg) negative = !negative;
      if (cneg) negative = !negative;
      sum = negative ? bsub(sum, term) : badd(sum, term);
    }
    return sum;
  }
  function bpow(base, exp) {
    if (base < C.MIN_BPOW_BASE) fail("ERR_BPOW_BASE_TOO_LOW");
    if (base > C.MAX_BPOW_BASE) fail("ERR_BPOW_BASE_TOO_HIGH");
    var whole = bfloor(exp);
    var remain = bsub(exp, whole);
    var wholePow = bpowi(base, btoi(whole));
    if (remain === 0n) return wholePow;
    var partial = bpowApprox(base, remain, C.BPOW_PRECISION);
    return bmul(wholePow, partial);
  }

  /* BMath.sol */
  function calcSpotPrice(bIn, wIn, bOut, wOut, fee) {
    var numer = bdiv(bIn, wIn);
    var denom = bdiv(bOut, wOut);
    var ratio = bdiv(numer, denom);
    var scale = bdiv(BONE, bsub(BONE, fee));
    return bmul(ratio, scale);
  }
  function calcOutGivenIn(bIn, wIn, bOut, wOut, aIn, fee) {
    var weightRatio = bdiv(wIn, wOut);
    var adjustedIn = bmul(aIn, bsub(BONE, fee));
    var y = bdiv(bIn, badd(bIn, adjustedIn));
    var foo = bpow(y, weightRatio);
    var bar = bsub(BONE, foo);
    return bmul(bOut, bar);
  }
  function calcInGivenOut(bIn, wIn, bOut, wOut, aOut, fee) {
    var weightRatio = bdiv(wOut, wIn);
    var diff = bsub(bOut, aOut);
    var y = bdiv(bOut, diff);
    var foo = bsub(bpow(y, weightRatio), BONE);
    return bdiv(bmul(bIn, foo), bsub(BONE, fee));
  }

  /* BPool.sol swap checks, on a plain two-token pool record */
  function pool(balanceIn, weightIn, balanceOut, weightOut, fee) {
    return { bIn: u(balanceIn), wIn: weightIn, bOut: u(balanceOut), wOut: weightOut, fee: fee };
  }
  // swapExactAmountIn without the token transfers: returns the amount out and the spot prices.
  function swapExactAmountIn(p, aIn) {
    if (aIn > bmul(p.bIn, C.MAX_IN_RATIO)) fail("ERR_MAX_IN_RATIO");
    var before = calcSpotPrice(p.bIn, p.wIn, p.bOut, p.wOut, p.fee);
    var aOut = calcOutGivenIn(p.bIn, p.wIn, p.bOut, p.wOut, aIn, p.fee);
    var bIn = badd(p.bIn, aIn), bOut = bsub(p.bOut, aOut);
    var after = calcSpotPrice(bIn, p.wIn, bOut, p.wOut, p.fee);
    if (after < before) fail("ERR_MATH_APPROX");
    if (before > bdiv(aIn, aOut)) fail("ERR_MATH_APPROX");
    return { amountOut: aOut, spotBefore: before, spotAfter: after, balanceIn: bIn, balanceOut: bOut };
  }
  function swapExactAmountOut(p, aOut) {
    if (aOut > bmul(p.bOut, C.MAX_OUT_RATIO)) fail("ERR_MAX_OUT_RATIO");
    var before = calcSpotPrice(p.bIn, p.wIn, p.bOut, p.wOut, p.fee);
    var aIn = calcInGivenOut(p.bIn, p.wIn, p.bOut, p.wOut, aOut, p.fee);
    var bIn = badd(p.bIn, aIn), bOut = bsub(p.bOut, aOut);
    var after = calcSpotPrice(bIn, p.wIn, bOut, p.wOut, p.fee);
    if (after < before) fail("ERR_MATH_APPROX");
    if (before > bdiv(aIn, aOut)) fail("ERR_MATH_APPROX");
    return { amountIn: aIn, spotBefore: before, spotAfter: after, balanceIn: bIn, balanceOut: bOut };
  }

  /* Conversions for the page (decimal strings and numbers to and from 18-decimal fixed point) */
  function toFixed(x) {
    if (typeof x === "bigint") return x * BONE;
    var s = typeof x === "number" ? x.toFixed(18) : String(x);
    var neg = s[0] === "-"; if (neg) s = s.slice(1);
    var parts = s.split("."), whole = BigInt(parts[0] || "0");
    var frac = (parts[1] || "").slice(0, 18); while (frac.length < 18) frac += "0";
    var v = whole * BONE + BigInt(frac);
    return neg ? -v : v;
  }
  function toNumber(v) { return Number(v / 10n ** 6n) / 1e12; }
  function toString(v, digits) {
    var neg = v < 0n; if (neg) v = -v;
    var w = v / BONE, f = (v % BONE).toString(); while (f.length < 18) f = "0" + f;
    var out = w.toString() + (digits === 0 ? "" : "." + f.slice(0, digits == null ? 18 : digits));
    return (neg ? "-" : "") + out;
  }

  root.BalancerMath = {
    C: C, btoi: btoi, bfloor: bfloor, badd: badd, bsub: bsub, bsubSign: bsubSign,
    bmul: bmul, bdiv: bdiv, bpowi: bpowi, bpow: bpow, bpowApprox: bpowApprox,
    calcSpotPrice: calcSpotPrice, calcOutGivenIn: calcOutGivenIn, calcInGivenOut: calcInGivenOut,
    pool: pool, swapExactAmountIn: swapExactAmountIn, swapExactAmountOut: swapExactAmountOut,
    toFixed: toFixed, toNumber: toNumber, toString: toString
  };
  if (typeof module !== "undefined" && module.exports) module.exports = root.BalancerMath;
})(typeof self !== "undefined" ? self : this);

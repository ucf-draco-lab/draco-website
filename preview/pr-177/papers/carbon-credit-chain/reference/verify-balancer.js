/*
  Checks balancer-math.js against Balancer V1's own Solidity, compiled with
  solc 0.5.12 and executed in an in-process Ethereum virtual machine (ganache),
  and against Balancer's own regression reference (lib/calc_comparisons.js,
  the Decimal.js model its test suite uses with a 1e-8 relative tolerance).

  Usage (from a folder with solc512@npm:solc@0.5.12, ganache@7, ethers@6, decimal.js):
    BALANCER=/path/to/balancer-core node verify-balancer.js
*/
"use strict";
const fs = require("fs");
const path = require("path");
const solc = require("solc512");
const ganache = require("ganache");
const { ethers } = require("ethers");
const Decimal = require("decimal.js");
const BM = require(process.env.BM || "../balancer-math.js");

const ROOT = process.env.BALANCER;
const REF = require(path.join(ROOT, "lib/calc_comparisons.js"));
Decimal.set({ precision: 60 });

function compile() {
  const files = ["BColor.sol", "BConst.sol", "BNum.sol", "BMath.sol", "BToken.sol", "BPool.sol", "test/TMath.sol", "test/TToken.sol"];
  const sources = {};
  files.forEach((f) => { sources[f] = { content: fs.readFileSync(path.join(ROOT, "contracts", f), "utf8") }; });
  const input = { language: "Solidity", sources, settings: { optimizer: { enabled: true, runs: 100 }, outputSelection: { "*": { "*": ["abi", "evm.bytecode.object"] } } } };
  const out = JSON.parse(solc.compile(JSON.stringify(input), { import: (p) => ({ contents: fs.readFileSync(path.join(ROOT, "contracts", p.replace(/^\.\.\//, "")), "utf8") }) }));
  (out.errors || []).forEach((e) => { if (e.severity === "error") throw new Error(e.formattedMessage); });
  const get = (f, n) => out.contracts[f][n];
  return { TMath: get("test/TMath.sol", "TMath"), BPool: get("BPool.sol", "BPool"), TToken: get("test/TToken.sol", "TToken") };
}

// Deterministic generator (xorshift64*) so the run is repeatable.
let s = 0x9e3779b97f4a7c15n;
function rnd() { s ^= s >> 12n; s ^= (s << 25n) & 0xffffffffffffffffn; s ^= s >> 27n; return Number(((s * 0x2545f4914f6cdd1dn) & 0xffffffffffffffffn) >> 11n) / 2 ** 53; }
function rbig(lo, hi) { // log-uniform BigInt in [lo, hi]
  const l = Math.log(Number(lo)), h = Math.log(Number(hi));
  const v = BigInt(Math.floor(Math.exp(l + (h - l) * rnd())));
  return v < lo ? lo : v > hi ? hi : v;
}
function tryJs(fn) { try { return { ok: true, v: fn() }; } catch (e) { return { ok: false, v: e.revert || e.message }; } }
async function tryEvm(fn) {
  try { return { ok: true, v: await fn() }; } catch (e) {
    const m = (e.shortMessage || e.message || "").match(/ERR_[A-Z_]+/); return { ok: false, v: m ? m[0] : "revert" };
  }
}
function same(a, b) { return a.ok === b.ok && (a.ok ? BigInt(a.v) === BigInt(b.v) : a.v === b.v); }

(async function main() {
  const c = compile();
  const provider = new ethers.BrowserProvider(ganache.provider({ logging: { quiet: true }, chain: { allowUnlimitedContractSize: true }, miner: { blockGasLimit: 100000000 } }));
  const signer = await provider.getSigner(0);
  const deploy = async (k, args) => { const f = new ethers.ContractFactory(k.abi, k.evm.bytecode.object, signer); const x = await f.deploy(...(args || [])); await x.waitForDeployment(); return x; };
  const tm = await deploy(c.TMath);
  const B = BM.C.BONE;
  let checks = 0, mismatches = 0, reverts = 0;
  const report = (name, a, b, ctx) => { checks++; if (!a.ok) reverts++; if (!same(a, b)) { mismatches++; if (mismatches < 10) console.log("MISMATCH", name, ctx, a, b); } };

  // 1. Primitives
  for (let i = 0; i < (+process.env.NPRIM || 1500); i++) {
    const a = rbig(1n, 10n ** 30n), b = rbig(1n, 10n ** 30n);
    report("bmul", tryJs(() => BM.bmul(a, b)), await tryEvm(() => tm.calc_bmul(a, b)), [a, b]);
    report("bdiv", tryJs(() => BM.bdiv(a, b)), await tryEvm(() => tm.calc_bdiv(a, b)), [a, b]);
    const base = rbig(B / 3n, 2n * B - 1n), exp = rbig(1n, 50n * B); // pool bases: MAX_IN_RATIO keeps y >= 2/3
    report("bpow", tryJs(() => BM.bpow(base, exp)), await tryEvm(() => tm.calc_bpow(base, exp)), [base, exp]);
    const n = BigInt(Math.floor(rnd() * 60));
    report("bpowi", tryJs(() => BM.bpowi(base, n)), await tryEvm(() => tm.calc_bpowi(base, n)), [base, n]);
  }
  // 2. The three pool formulas, over balances, weights, amounts, and fees a pool accepts (and a few it rejects)
  let refChecks = 0, refWorst = 0, eqChecks = 0, eqWorst = 0;
  const fees = [BM.C.MIN_FEE, 3n * B / 1000n, B / 100n, B / 10n];
  for (let i = 0; i < (+process.env.NFORM || 3000); i++) {
    const bIn = rbig(10n ** 12n, 10n ** 30n), bOut = rbig(10n ** 12n, 10n ** 30n);
    const wIn = rbig(B, 49n * B), wOut = rbig(B, 49n * B);
    const fee = i % 5 === 4 ? rbig(BM.C.MIN_FEE, BM.C.MAX_FEE) : fees[i % 4];
    const aIn = rbig(1n, bIn / 2n), aOut = rbig(1n, bOut / 3n);
    const sp = [tryJs(() => BM.calcSpotPrice(bIn, wIn, bOut, wOut, fee)), await tryEvm(() => tm.calcSpotPrice(bIn, wIn, bOut, wOut, fee))];
    const og = [tryJs(() => BM.calcOutGivenIn(bIn, wIn, bOut, wOut, aIn, fee)), await tryEvm(() => tm.calcOutGivenIn(bIn, wIn, bOut, wOut, aIn, fee))];
    const ig = [tryJs(() => BM.calcInGivenOut(bIn, wIn, bOut, wOut, aOut, fee)), await tryEvm(() => tm.calcInGivenOut(bIn, wIn, bOut, wOut, aOut, fee))];
    report("calcSpotPrice", sp[0], sp[1], [bIn, wIn, bOut, wOut, fee]);
    report("calcOutGivenIn", og[0], og[1], [bIn, wIn, bOut, wOut, aIn, fee]);
    report("calcInGivenOut", ig[0], ig[1], [bIn, wIn, bOut, wOut, aOut, fee]);
    // Balancer's Decimal reference, on amounts large enough for its 1e-8 tolerance to apply
    const D = (x) => Decimal(x.toString()).div(Decimal(B.toString()));
    // (trades of at least one millionth of the pool and outputs of at least one millionth of a token;
    // below that, one unit of rounding in the last of 18 decimals dominates the relative difference)
    if (og[0].ok && aIn * 10n ** 6n >= bIn && og[0].v >= 10n ** 12n) {
      const ref = REF.calcOutGivenIn(D(bIn), D(wIn), D(bOut), D(wOut), D(aIn), D(fee));
      const rel = Number(REF.calcRelativeDiff(ref, D(og[0].v))); refChecks++; refWorst = Math.max(refWorst, rel);
      if (i % 2 === 0) {                 // the page's pool shape: equal weights
        const o2 = BM.calcOutGivenIn(bIn, B, bOut, B, aIn, fee);
        if (o2 >= 10n ** 12n) {
          const r2 = Number(REF.calcRelativeDiff(REF.calcOutGivenIn(D(bIn), 1, D(bOut), 1, D(aIn), D(fee)), D(o2)));
          eqChecks++; eqWorst = Math.max(eqWorst, r2);
        }
      }
    }
  }
  // 3. End to end: a 50/50 DAI and carbon-token BPool with the paper's 0.3% fee, swapped in sequence
  const dai = await deploy(c.TToken, ["Dai", "DAI", 18]);
  const cct = await deploy(c.TToken, ["Carbon", "C", 18]);
  const me = await signer.getAddress();
  const big = 10n ** 40n;
  await (await dai.mint(me, big)).wait(); await (await cct.mint(me, big)).wait();
  const pool = await deploy(c.BPool);
  await (await dai.approve(await pool.getAddress(), big)).wait(); await (await cct.approve(await pool.getAddress(), big)).wait();
  const daiBal = 50000n * B, cctBal = 2000n * B, w = 25n * B, fee = 3n * B / 1000n;
  await (await pool.bind(await dai.getAddress(), daiBal, w)).wait();
  await (await pool.bind(await cct.getAddress(), cctBal, w)).wait();
  await (await pool.setSwapFee(fee)).wait();
  await (await pool.finalize()).wait();
  let js = { dai: daiBal, cct: cctBal };
  const MAXU = (1n << 256n) - 1n;
  let swaps = 0, swapMismatch = 0, swapReverts = {};
  for (let i = 0; i < (+process.env.NSWAP || 120); i++) {
    const buyCarbon = rnd() < 0.55;
    const tin = buyCarbon ? dai : cct, tout = buyCarbon ? cct : dai;
    const balIn = buyCarbon ? js.dai : js.cct, balOut = buyCarbon ? js.cct : js.dai;
    const exactOut = rnd() < 0.3;
    let jr, er;
    if (!exactOut) {
      const aIn = rbig(B / 100n, balIn * 7n / 10n);
      jr = tryJs(() => BM.swapExactAmountIn(BM.pool(balIn, w, balOut, w, fee), aIn));
      er = await tryEvm(async () => { const r = await pool.swapExactAmountIn.staticCall(await tin.getAddress(), aIn, await tout.getAddress(), 0n, MAXU); await (await pool.swapExactAmountIn(await tin.getAddress(), aIn, await tout.getAddress(), 0n, MAXU)).wait(); return r[0]; });
      checks++; swaps++; if (!jr.ok) swapReverts[jr.v] = (swapReverts[jr.v] || 0) + 1;
      if (!same({ ok: jr.ok, v: jr.ok ? jr.v.amountOut : jr.v }, er)) { swapMismatch++; mismatches++; console.log("SWAP MISMATCH", i, jr, er); }
      if (jr.ok) { if (buyCarbon) { js.dai = jr.v.balanceIn; js.cct = jr.v.balanceOut; } else { js.cct = jr.v.balanceIn; js.dai = jr.v.balanceOut; } }
    } else {
      const aOut = rbig(B / 100n, balOut / 2n);
      jr = tryJs(() => BM.swapExactAmountOut(BM.pool(balIn, w, balOut, w, fee), aOut));
      er = await tryEvm(async () => { const r = await pool.swapExactAmountOut.staticCall(await tin.getAddress(), MAXU >> 1n, await tout.getAddress(), aOut, MAXU); await (await pool.swapExactAmountOut(await tin.getAddress(), MAXU >> 1n, await tout.getAddress(), aOut, MAXU)).wait(); return r[0]; });
      checks++; swaps++; if (!jr.ok) swapReverts[jr.v] = (swapReverts[jr.v] || 0) + 1;
      if (!same({ ok: jr.ok, v: jr.ok ? jr.v.amountIn : jr.v }, er)) { swapMismatch++; mismatches++; console.log("SWAP MISMATCH", i, jr, er); }
      if (jr.ok) { if (buyCarbon) { js.dai = jr.v.balanceIn; js.cct = jr.v.balanceOut; } else { js.cct = jr.v.balanceIn; js.dai = jr.v.balanceOut; } }
    }
  }
  const evmDai = await pool.getBalance(await dai.getAddress()), evmCct = await pool.getBalance(await cct.getAddress());
  const balancesMatch = evmDai === js.dai && evmCct === js.cct;
  const summary = { checks, mismatches, revertCasesCompared: reverts, swaps, swapMismatch, balancesMatch, finalPool: { dai: BM.toString(js.dai, 6), carbon: BM.toString(js.cct, 6) }, decimalReference: { checks: refChecks, worstRelativeDiff: refWorst, equalWeightChecks: eqChecks, equalWeightWorst: eqWorst, balancerTolerance: 1e-8 }, swapReverts };
  console.log(JSON.stringify(summary, null, 2));
  process.exit(mismatches === 0 && balancesMatch && eqWorst < 1e-8 ? 0 : 1);
})();

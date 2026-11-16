/*
  Checks the Ledger model in carbon-engine.js against the paper's own contracts
  (CarbonCreditProject/Carbon-Project, commit a9e478f), compiled with solc 0.6.12
  against OpenZeppelin Contracts 3.2.0 and run in an in-process Ethereum virtual
  machine (ganache). The contracts' GitHub-URL imports are rewritten to the npm
  package paths; nothing else in the Solidity is changed.

  Random call sequences from four accounts exercise every public function. After
  each call the script compares success or revert (with the reason string), and
  then every public value: token balances, allowances, the shadow BalanceOf map,
  approvals, burn records, the three registries, and the three array getters.

  Usage (from a folder with solc@0.6.12, ganache@7, ethers@6, @openzeppelin/contracts@3.2.0):
    CARBON=/path/to/Carbon-Project STEPS=400 SEEDS=3 node verify-contracts.js
*/
"use strict";
const fs = require("fs");
const path = require("path");
const solc = require("solc");
const ganache = require("ganache");
const { ethers } = require("ethers");
const CC = require(process.env.ENGINE || "../carbon-engine.js");

const SRC = process.env.CARBON;
const OZ = path.dirname(require.resolve("@openzeppelin/contracts/package.json"));

function compile() {
  const fix = (t) => t.replace(/'https:\/\/github\.com\/OpenZeppelin\/openzeppelin-contracts\/blob\/master\/contracts\//g, "'@openzeppelin/contracts/");
  const sources = {};
  ["carboncredits.sol", "credittoken.sol", "certification.sol"].forEach((f) => { sources[f] = { content: fix(fs.readFileSync(path.join(SRC, f), "utf8")) }; });
  const input = { language: "Solidity", sources, settings: { outputSelection: { "*": { "*": ["abi", "evm.bytecode.object"] } } } };
  const find = (p) => {
    if (p.startsWith("@openzeppelin/contracts/")) return { contents: fs.readFileSync(path.join(OZ, p.slice(24)), "utf8") };
    return { error: "not found " + p };
  };
  const out = JSON.parse(solc.compile(JSON.stringify(input), { import: find }));
  (out.errors || []).forEach((e) => { if (e.severity === "error") throw new Error(e.formattedMessage); });
  return out.contracts["certification.sol"].Certification;
}

let seed = BigInt(process.env.SEED0 || 12345);
function rnd() { seed ^= seed << 13n; seed &= 0xffffffffffffffffn; seed ^= seed >> 7n; seed ^= seed << 17n; seed &= 0xffffffffffffffffn; return Number(seed % 1000000n) / 1000000; }
function pick(a) { return a[Math.floor(rnd() * a.length)]; }
function small() { return BigInt(Math.floor(rnd() * 40)); }

function norm(v) {                       // ethers Result / struct -> plain strings
  if (typeof v === "bigint") return v.toString();
  if (typeof v === "boolean") return v ? "true" : "false";
  if (typeof v === "string") return v.toLowerCase();
  if (Array.isArray(v) || (v && typeof v.length === "number" && typeof v !== "string")) return Array.from(v).map(norm);
  if (v && typeof v === "object") return Object.values(v).map(norm);
  return String(v);
}
function reason(e) {
  const r = e.reason != null ? e.reason : (e.info && e.info.error && e.info.error.message) || e.shortMessage || e.message || "";
  if (e.reason != null) return e.reason === "require(false)" ? "" : e.reason;
  const m = String(r).match(/reverted with reason string '([^']*)'/) || String(r).match(/revert (.*)$/);
  return m ? m[1].trim() : "";
}

(async function main() {
  const art = compile();
  const STEPS = +(process.env.STEPS || 300), SEEDS = +(process.env.SEEDS || 1);
  let calls = 0, reverts = 0, compared = 0, mismatches = 0;
  const revertKinds = {};
  for (let run = 0; run < SEEDS; run++) {
    const provider = new ethers.BrowserProvider(ganache.provider({ logging: { quiet: true }, chain: { allowUnlimitedContractSize: true }, miner: { blockGasLimit: 30000000 } }));
    const signers = []; for (let i = 0; i < 4; i++) signers.push(await provider.getSigner(i));
    const addrs = []; for (const s of signers) addrs.push((await s.getAddress()).toLowerCase());
    const f = new ethers.ContractFactory(art.abi, art.evm.bytecode.object, signers[0]);
    const c = await f.deploy(); await c.waitForDeployment();
    const self = (await c.getAddress()).toLowerCase();
    const L = new CC.Ledger(addrs[0]); L.self = self;
    const ZERO = "0x0000000000000000000000000000000000000000";
    const jsAddr = (a) => (a === ZERO ? CC.ZERO : a);
    const everyone = addrs.concat([self]);

    for (let step = 0; step < STEPS; step++) {
      const si = Math.floor(rnd() * 4), sender = addrs[si], sg = signers[si];
      const who = () => pick(rnd() < 0.06 ? [ZERO] : everyone);
      const fns = ["registerCreditHolder", "registerVerifiers", "registerCustomer", "approveCreditsHeld", "createCarbonToken", "transferCredits", "approve", "transferCreditsFrom", "approveBurn", "burnTokens", "addBurnedTokens", "buyCarbonCredits", "transfer"];
      const fn = pick(fns);
      let args, value = 0n;
      switch (fn) {
        case "registerCreditHolder": args = ["Holder" + step, small(), small() * 5n, small(), small()]; break;
        case "registerVerifiers": args = ["Verifier" + step, "US", BigInt(Math.floor(rnd() * 6)), small()]; break;
        case "registerCustomer": args = ["First", "Last", "x@y.org", small()]; break;
        case "approveCreditsHeld": args = [who()]; break;
        case "createCarbonToken": case "burnTokens": args = []; break;
        case "transferCredits": case "transfer": args = [who(), small()]; break;
        case "approve": args = [who(), small() * 3n]; break;
        case "transferCreditsFrom": args = [who(), who(), small()]; break;
        case "approveBurn": args = [small(), who()]; break;
        case "addBurnedTokens": args = [who()]; break;
        case "buyCarbonCredits": args = [small()]; value = rnd() < 0.5 ? 0n : 1n; break;
      }
      const jsArgs = args.map((a) => (typeof a === "string" && a.startsWith("0x") ? jsAddr(a) : a));
      const jr = L.call(fn, sender, jsArgs, value);
      let er;
      try {
        await c.connect(sg)[fn].staticCall(...args, { value, gasLimit: 5000000 });
        er = { ok: true };
      } catch (e) { er = { ok: false, revert: reason(e) }; }
      if (er.ok) { const tx = await c.connect(sg)[fn](...args, { value, gasLimit: 5000000 }); await tx.wait(); }
      calls++;
      if (!jr.ok) { reverts++; revertKinds[fn + ": " + (jr.revert || "(no reason)")] = (revertKinds[fn + ": " + (jr.revert || "(no reason)")] || 0) + 1; }
      compared++;
      if (jr.ok !== er.ok || (!jr.ok && (jr.revert || "") !== (er.revert || ""))) {
        mismatches++; console.log("CALL MISMATCH", run, step, fn, args, jr.ok, jr.revert, er);
      }
      // Compare state
      const checks = [];
      for (const a of everyone) {
        checks.push(["balanceOf", [a]], ["BalanceOf", [a]], ["approvedCredits", [a]], ["tokensApprovedForBurn", [a]], ["burnedTokens", [a]]);
        for (const b of everyone) checks.push(["allowance", [a, b]]);
      }
      checks.push(["totalSupply", []], ["owner", []]);
      for (let i = 0; i < 4; i++) checks.push(["CreditHolders", [i]], ["verifiers", [i]], ["customers", [i]]);
      for (const [v, a] of checks) {
        const ev = norm(await c[v](...a));
        let jv = L.view(v, a.map((x) => (typeof x === "number" ? BigInt(x) : x)));
        if (v === "CreditHolders") jv = [jv.name, jv.id, jv.holderId, jv.creditsHeld, jv.pricepercredit, jv.creditvalidityperiod, jv._addr === CC.ZERO ? ZERO : jv._addr];
        if (v === "verifiers") jv = [jv.name, jv.homeCountry, jv.reg_no, jv.license_no, jv.addr === CC.ZERO ? ZERO : jv.addr, jv.isExist];
        if (v === "customers") jv = [jv.first_name, jv.last_name, jv.email, jv.contact, jv._id];
        jv = norm(jv);
        compared++;
        if (JSON.stringify(ev) !== JSON.stringify(jv)) { mismatches++; if (mismatches < 20) console.log("STATE MISMATCH", run, step, fn, v, a, ev, jv); }
      }
      for (const g of ["getVerifiers", "getCreditHoilders", "getCustomerProfile"]) {
        let ev; try { ev = { ok: true, v: norm(await c.connect(signers[0])[g](...(g === "getCustomerProfile" ? [addrs[0]] : []))) }; } catch (e) { ev = { ok: false }; }
        const jv = L.view(g, [], addrs[0]);
        const jn = jv.ok ? norm(jv.v.map((x) => Object.values(x).map((y) => (y === CC.ZERO ? ZERO : y)))) : null;
        compared++;
        if (ev.ok !== jv.ok || (ev.ok && JSON.stringify(ev.v) !== JSON.stringify(jn))) { mismatches++; if (mismatches < 20) console.log("ARRAY MISMATCH", run, step, g, ev, jv.ok, jn); }
      }
    }
  }
  console.log(JSON.stringify({ calls, reverts, comparisons: compared, mismatches, revertKinds }, null, 2));
  process.exit(mismatches === 0 ? 0 : 1);
})();

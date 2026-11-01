/*
  Runs the second demo's "released code" sequence against the compiled contracts
  and against the page's Ledger model, step by step, and prints both outcomes.
  Every finding the page states about the released code comes from this run.

  Usage: CARBON=/path/to/Carbon-Project node verify-scenario.js
*/
"use strict";
const fs = require("fs");
const path = require("path");
const solc = require("solc");
const ganache = require("ganache");
const { ethers } = require("ethers");
const CC = require(process.env.ENGINE || "../carbon-engine.js");
const OZ = path.dirname(require.resolve("@openzeppelin/contracts/package.json"));

function compile() {
  const fix = (t) => t.replace(/'https:\/\/github\.com\/OpenZeppelin\/openzeppelin-contracts\/blob\/master\/contracts\//g, "'@openzeppelin/contracts/");
  const sources = {};
  ["carboncredits.sol", "credittoken.sol", "certification.sol"].forEach((f) => { sources[f] = { content: fix(fs.readFileSync(path.join(process.env.CARBON, f), "utf8")) }; });
  const out = JSON.parse(solc.compile(JSON.stringify({ language: "Solidity", sources, settings: { outputSelection: { "*": { "*": ["abi", "evm.bytecode.object"] } } } }),
    { import: (p) => ({ contents: fs.readFileSync(path.join(OZ, p.slice(24)), "utf8") }) }));
  (out.errors || []).forEach((e) => { if (e.severity === "error") throw new Error(e.formattedMessage); });
  return out.contracts["certification.sol"].Certification;
}
function reason(e) { const r = e.reason; return r == null || r === "require(false)" ? "" : r; }

(async function main() {
  const art = compile();
  const provider = new ethers.BrowserProvider(ganache.provider({ logging: { quiet: true } }));
  const S = []; for (let i = 0; i < 8; i++) S.push(await provider.getSigner(i));
  const A = []; for (const s of S) A.push((await s.getAddress()).toLowerCase());
  // roles: 0 deployer, 1..5 verifiers, 6 Landowner B, 7 Company A
  const role = { owner: 0, v0: 1, v1: 2, v2: 3, v3: 4, v4: 5, B: 6, A: 7 };
  const c = await new ethers.ContractFactory(art.abi, art.evm.bytecode.object, S[0]).deploy(); await c.waitForDeployment();
  const self = (await c.getAddress()).toLowerCase();
  const L = new CC.Ledger("owner"); L.self = "self";
  const addr = (k) => A[role[k]];
  const steps = [];
  for (let i = 0; i < 5; i++) steps.push(["v" + i, "registerVerifiers", ["Verifier " + (i + 1), "US", BigInt(100 + i), BigInt(i + 1)]]);
  steps.push(["B", "registerCreditHolder", ["Landowner B", 1n, 50n, 25n, 365n]]);
  steps.push(["A", "registerCustomer", ["Company", "A", "a@example.org", 0n]]);
  for (let i = 0; i < 5; i++) steps.push(["v" + i, "approveCreditsHeld", ["B"]]);
  steps.push(["B", "createCarbonToken", []]);
  steps.push(["B", "createCarbonToken", []]);              // "Mint again"
  steps.push(["B", "transferCredits", ["A", 20n]]);
  steps.push(["v4", "approveBurn", [20n, "A"]]);
  steps.push(["A", "burnTokens", []]);
  steps.push(["A", "addBurnedTokens", ["A"]]);
  steps.push(["A", "buyCarbonCredits", [5n], 1n]);
  steps.push(["A", "buyCarbonCredits", [0n], 1n]);           // amount zero: accepts the ether
  steps.push(["owner", "approveBurn", [10n, "owner"]]);      // a non-verifier cannot approve
  steps.push(["v4", "approveBurn", [10n, "owner"]]);
  steps.push(["owner", "burnTokens", []]);                   // the deployer holds no tokens
  const rows = [];
  let agree = 0;
  for (const [who, fn, args, value] of steps) {
    const evmArgs = args.map((a) => (typeof a === "string" && role[a] != null ? addr(a) : a));
    let er;
    try { await c.connect(S[role[who]])[fn].staticCall(...evmArgs, { value: value || 0n }); er = { ok: true }; await (await c.connect(S[role[who]])[fn](...evmArgs, { value: value || 0n })).wait(); }
    catch (e) { er = { ok: false, revert: reason(e) }; }
    const jr = L.call(fn, who, args, value || 0n);
    const same = jr.ok === er.ok && (jr.ok || (jr.revert || "") === (er.revert || ""));
    if (same) agree++;
    rows.push({ who, fn, evm: er.ok ? "ok" : "revert '" + er.revert + "'", page: jr.ok ? "ok" : "revert '" + jr.revert + "'", same });
  }
  const bal = async (k) => (await c.balanceOf(addr(k))).toString();
  const state = { evm: { B: await bal("B"), A: await bal("A"), supply: (await c.totalSupply()).toString(), approvedB: (await c.approvedCredits(addr("B"))).toString(), burnedA: (await c.burnedTokens(addr("A"))).toString() },
    page: { B: L.view("balanceOf", ["B"]).toString(), A: L.view("balanceOf", ["A"]).toString(), supply: L.view("totalSupply").toString(), approvedB: L.view("approvedCredits", ["B"]).toString(), burnedA: L.view("burnedTokens", ["A"]).toString() } };
  const contractWei = (await provider.getBalance(self)).toString();   // ether left in the contract (the model keeps no ether)
  console.table(rows);
  console.log(JSON.stringify({ steps: rows.length, agree, state, contractWei }, null, 2));
  process.exit(agree === rows.length && JSON.stringify(state.evm) === JSON.stringify(state.page) ? 0 : 1);
})();

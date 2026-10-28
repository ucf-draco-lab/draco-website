/*
  Fast checks for carbon-engine.js that need no Ethereum virtual machine:
  SHA-256 against Node's crypto, the hash chain's tamper detection, the paper's
  worked offset example, its market-growth arithmetic, and the 70 percent rule.
  Usage: node verify-engine.js
*/
"use strict";
const crypto = require("crypto");
const CC = require(process.env.ENGINE || "../carbon-engine.js");
const out = {};

// 1. SHA-256 against Node, on lengths 0 to 300 (every padding boundary) and random UTF-8 text
let n = 0, bad = 0;
for (let len = 0; len <= 300; len++) {
  for (let k = 0; k < 8; k++) {
    let s = ""; for (let i = 0; i < len; i++) s += String.fromCharCode(32 + ((i * 31 + k * 7 + len) % 95));
    if (k === 7) s += "é中\u{1F332}";
    n++; if (CC.sha256(s) !== crypto.createHash("sha256").update(s, "utf8").digest("hex")) bad++;
  }
}
out.sha256 = { checked: n, mismatches: bad };

// 2. Chain: build, validate, tamper, re-mine
const datas = ["Verifier approves 50 credits for Landowner B", "Mint 50 tokens to Landowner B", "B sends 20 tokens to Company A", "Company A burns 20 tokens"];
const built = CC.buildChain(datas, 3);
const v0 = CC.validate(built.chain, 3).every((r) => r.linkOk && r.workOk);
const t = JSON.parse(JSON.stringify(built.chain)); t[2].data = "B sends 200 tokens to Company A";
const v1 = CC.validate(t, 3);
out.chain = { blocks: built.chain.length, zeros: 3, tries: built.tries, validBefore: v0,
  afterTamper: v1.map((r) => (r.workOk && r.linkOk ? "ok" : [!r.workOk ? "work missing" : "", !r.linkOk ? "link broken" : ""].filter(Boolean).join(", "))) };

// 3. The paper's worked example (Section 1.3.1)
out.offsetExample = CC.offset(100, 120, 50);

// 4. Section 1.3 market figures: 10.9 B USD (2005) growing "at an annual rate of 108%" to 143.7 B USD (2009)
out.marketGrowth = {
  impliedAnnualRate_2005to2009: +(CC.growth(10.9, 143.7, 4) * 100).toFixed(1),
  at108_after4years: +CC.project(10.9, 1.08, 4).toFixed(1),
  at108_after3years: +CC.project(10.9, 1.08, 3).toFixed(1),
  // 34% growth to 215 B USD in 2019 implies 2018:
  implied2018: +(215 / 1.34).toFixed(1)
};
// Section 1.1 shares
out.shares = { gasShares: 72 + 19 + 6 + 3, fuelShares: 39 + 31 + 18, statedFuelTotal: 89 };

// 5. Seventy percent of verifiers
out.threshold = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 20].map((k) => [k, CC.Design.needed(k)]);
let tbad = 0; for (let k = 1; k <= 500; k++) for (let y = 0; y <= k; y++) if (CC.Design.approved(y, k) !== (y >= CC.Design.needed(k)) || CC.Design.approved(y, k) !== (y / k >= 0.7 - 1e-12)) tbad++;
out.thresholdMismatches = tbad;

// 6. Released-code behaviors the page shows (each also exercised in verify-contracts.js)
const L = new CC.Ledger("owner");
L.call("registerVerifiers", "v1", ["V1", "US", 7n, 1n]);
L.call("registerCreditHolder", "B", ["Landowner B", 1n, 50n, 10n, 365n]);
L.call("approveCreditsHeld", "v1", ["B"]);
const m1 = L.call("createCarbonToken", "B", []);
const m2 = L.call("createCarbonToken", "B", []);
out.doubleMint = { firstOk: m1.ok, secondOk: m2.ok, balanceAfterTwo: L.view("balanceOf", ["B"]).toString(), approved: L.view("approvedCredits", ["B"]).toString() };
const buy = L.call("buyCarbonCredits", "A", [5n], 1n);
out.buy = { ok: buy.ok, revert: buy.revert };
const burnB = L.call("burnTokens", "B", []);
out.holderBurn = { ok: burnB.ok, revert: burnB.revert };

console.log(JSON.stringify(out, (k, v) => (typeof v === "bigint" ? v.toString() : v), 2));
const pass = bad === 0 && v0 && tbad === 0 && out.offsetExample.bought === 20 && out.offsetExample.sellerLeft === 30;
process.exit(pass ? 0 : 1);

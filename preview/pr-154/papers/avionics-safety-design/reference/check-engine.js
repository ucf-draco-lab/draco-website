// Compares sac-engine.js against reference.json from sac_reference.py (exact equality for floats).
const E = require("../sac-engine.js");
const R = require(process.argv[2] || "./reference.json");
let n = 0, bad = 0;
function eq(a, b, what) { n++; const same = (Number.isNaN(a) && Number.isNaN(b)) || Object.is(a, b) || a === b; if (!same) { bad++; if (bad < 20) console.log("MISMATCH", what, a, b); } }
const fam = Object.fromEntries(E.family().map(x => [x.id, x.domain]));
const props = Object.fromEntries(E.properties().map(p => [p.id, p.req]));
for (const [key, v] of Object.entries(R.refines)) { const [c, p] = key.split("<"); eq(E.refines(fam[c], fam[p]), v, "refines " + key); }
for (const [key, v] of Object.entries(R.holds)) { const [nd, p] = key.split(":"); eq(E.holds(fam[nd], props[p]), v, "holds " + key); }
for (const [key, v] of Object.entries(R.composeEmpty)) { const [a, b] = key.split("+"); eq(E.compose(fam[a], fam[b]).conflicts.length > 0, v, "compose " + key); }
const m = E.compose(fam.a5, fam.a1).domain.N1; eq(JSON.stringify([m.lo, m.hi]), JSON.stringify([R.members_a5_a1[0], R.members_a5_a1.at(-1)]), "a5+a1 N1");
eq(E.refines(fam.a2, fam.a1), R.paper_example["N1=9,D1=15 inside N1>4,D1<20"], "paper example");
eq(E.holds(E.narrow(fam.core, { N1: E.iv(4, 4) }), { ...fam.a1 }), !R.paper_example["N1=4 rejected"], "N1=4");
eq(E.holds(E.narrow(fam.core, { N1: E.iv(9, 9), D1: E.iv(20, 20) }), { ...fam.a1 }), !R.paper_example["D1=20 rejected"], "D1=20");
for (const [k0, rows] of Object.entries(R.sweeps)) {
  const mine = E.sweep(Number(k0));
  rows.forEach((r, i) => { for (const f of ["fault", "policy", "recover", "detect", "by", "localize", "to", "checks", "dev"]) eq(mine[i][f], r[f], `sweep ${k0} ${r.fault}/${r.policy}/${r.recover} ${f}`); });
}
E.simulate({ fault: "none" }).series.th.forEach((v, i) => eq(v, R.series_none[i], "none th " + i));
E.simulate({ fault: "gain", onset: 100, policy: "all", recover: "backup" }).series.th.forEach((v, i) => eq(v, R.series_gain_all[i], "gain th " + i));
[5.0, -3.25, 0.0, 14.999, 1e-3].forEach((x, i) => eq(E.flipBit61(x), R.flip[i], "flip " + x));
let j = 0; for (const lam of [1e-5, 1e-7, 1e-9]) for (const c of [0.9, 0.95, 0.99]) { const a = E.testHours(lam, c), b = R.testHours[j++]; eq(Math.abs(a - b) <= 1e-14 * b, true, "hours (relative 1e-14; V8 and libm logarithms may differ in the last bit)"); }
console.log(`${n - bad} of ${n} checks match`);
process.exit(bad ? 1 : 0);

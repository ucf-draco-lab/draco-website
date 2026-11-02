// Compares ci-engine.js with the independent Python check (ref.json) and with
// the numbers the paper prints. Run: node verify.js
const E = require("../ci-engine.js");
const ref = require("./ref.json");
const D = E.DATA;
let fails = 0, checks = 0;
function ok(cond, msg) { checks++; if (!cond) { fails++; console.log("FAIL", msg); } }
const close = (a, b) => Math.abs(a - b) < 1e-12;

// Paper: alignment 6/12 (50%) at midterm, 9/12 (75%) for the other three.
for (const c of D.checkpoints) {
  const a = E.agreement(c.M), x = E.exactAgreement(c.M), r = ref[c.id];
  ok(a.n === 12, c.id + " n");
  ok(a.diag === c.printed.n && Math.round(a.share * 100) === c.printed.pct, c.id + " printed alignment");
  ok(a.diag === r.diag, c.id + " diag vs python");
  ok(close(a.kappa, r.kappa), c.id + " kappa vs python");
  ok(x.tables === r.tables, c.id + " table count");
  ok(close(x.totalProb, 1), c.id + " probabilities sum to 1");
  ok(Math.abs(x.p - r.p) < 1e-12, c.id + " exact p vs python");
  // printed column totals (proposal counts) are 5, 4, 3, 0 in every table
  ok(JSON.stringify(a.cols) === "[5,4,3,0]", c.id + " column totals");
}
// Table 6 row totals equal Table 1's actual counts; column totals equal Table 1's self-identified counts.
const a6 = E.agreement(D.checkpoints[3].M);
ok(JSON.stringify(a6.rows) === JSON.stringify(E.TYPES.map(t => D.t1.actual[t])), "Table 6 rows = Table 1 actual");
ok(JSON.stringify(a6.cols) === JSON.stringify(E.TYPES.map(t => D.t1.self[t])), "Table 6 columns = Table 1 self");
// Printed row totals of Tables 3 to 5
ok(JSON.stringify(E.agreement(D.checkpoints[0].M).rows) === "[6,1,1,4]", "Table 3 rows");
ok(JSON.stringify(E.agreement(D.checkpoints[1].M).rows) === "[5,3,3,1]", "Table 4 rows");
// Group-size search
const g = E.groupSizes({ rounding: "nearest", maxSize: 8 });
const order = g.cells.map(c => c.proposal + ">" + c.product);
const pyOrder = ["app>app", "res>res", "res>lit", "mix>mix", "mix>lit"];
const pySols = ref.group_sums.map(s => { const m = {}; pyOrder.forEach((k, i) => m[k] = s[i]); return order.map(k => m[k]).join(","); }).sort();
ok(JSON.stringify(g.solutions.map(s => s.sums.join(",")).sort()) === JSON.stringify(pySols), "group sums vs python");
ok(g.solutions.length === 1 && g.solutions[0].total === 32, "unique solution totals 32");
ok(E.groupSizes({ rounding: "nearest", total: 33 }).solutions.length === 0, "no solution with 33 students");
ok(E.ROUND.nearest(32 / 12) === 2.7 && E.ROUND.nearest(33 / 12) === 2.8, "average 2.7 vs 2.8");
console.log(checks + " checks, " + fails + " failures");
process.exit(fails ? 1 : 0);

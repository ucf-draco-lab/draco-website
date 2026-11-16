// Compares flc-engine.js with the Python references (ref.json from
// check_engine.py, lab_ref.json from check_lab.py) and with the numbers the
// paper prints. Run: node verify.js
const E = require("../flc-engine.js");
const ref = require("./ref.json");
const lab = require("./lab_ref.json");
let fails = 0, checks = 0;
function ok(cond, msg) { checks++; if (!cond) { fails++; console.log("FAIL", msg); } }

// Table 1: attempts per quest.
const want = { A: [3, 5, 8, 11, 15], B: [6, 8, 11, 15], C: [9, 11, 15], D: [12, 15], Final: [16] };
for (const q of E.QUESTS) ok(JSON.stringify(E.questWeeks(q)) === JSON.stringify(want[q]), "quest weeks " + q);
ok(E.WEEKS.length === 16 && E.WEEKS.filter(w => w.cycle === "C").length === 5, "16 weeks, five content weeks");

// Table 2 checks against the text's counts and against the rebuilt counts.
const t = E.checkTable();
ok(JSON.stringify(t.map(c => [c.row, c.group, c.k, c.n, c.how])) ===
   JSON.stringify(ref.text_table.map(c => [c.row, c.group, c.k, c.n, c.how])), "text-count table vs python");
ok(t.filter(c => c.how !== "none").length === 5, "five of nine cells reproduce from the text's counts");
const alt = { f22: { major: [53, 54], nonmajor: [64, 70] }, s23: E.COUNTS.s23 };
const t2 = E.checkTable(alt);
ok(JSON.stringify(t2.map(c => [c.row, c.group, c.k, c.n, c.how])) ===
   JSON.stringify(ref.rebuilt_table.map(c => [c.row, c.group, c.k, c.n, c.how])), "rebuilt table vs python");
ok(t2.every(c => c.how !== "none"), "rebuilt counts reproduce all nine cells");
for (const rule of ["either", "round", "trunc"]) {
  const r = E.rebuildFall({ rule, maxN: 1000 });
  ok(JSON.stringify(r.solutions.map(s => [s.k, s.n])) === JSON.stringify(ref.rebuild[rule]), "rebuild " + rule + " vs python");
}
// Printed survey response rates.
for (const s of E.SURVEY) ok(Math.round(100 * s.respondents / s.enrolled) === s.printedPct, "survey " + s.id);
ok(E.SURVEY[0].enrolled + E.SURVEY[1].enrolled === E.TABLE2.n.total, "survey enrollment sums to Table 2 n");
ok(E.TABLE2.n.major + E.TABLE2.n.nonmajor === E.TABLE2.n.total, "Table 2 n adds up");

// Wilson intervals vs statsmodels.
for (const key of Object.keys(ref.wilson)) {
  const [k, n] = key.split("/").map(Number), w = E.wilson(k, n), r = ref.wilson[key];
  ok(Math.abs(w[0] - r[0]) < 1e-12 && Math.abs(w[1] - r[1]) < 1e-12, "wilson " + key);
}

// Lab 3: every filled-in program, every test input, against Python.
const choices = E.allChoices();
ok(choices.length === Object.keys(lab).length, "program count " + choices.length);
let mism = 0;
for (const c of choices) {
  const key = E.TODOS.map(td => c[td.id]).join(",");
  const js = E.TESTS.map(tst => E.outcome(E.runLab(c, tst[0])));
  const py = lab[key];
  for (let i = 0; i < js.length; i++) { checks++; if (js[i] !== py[i]) { mism++; fails++; if (mism < 15) console.log("LAB", key, E.TESTS[i][0], js[i], py[i]); } }
}
const right = { inc: 0, even: 0, odd: 0, out: 0, evenFn: 0, header: 0 };
const g = E.grade(right);
ok(g.score === 5, "intended answer passes all five tests");
ok(E.TESTS.every(([n, out]) => String(E.collatzSteps(n)) === out), "plain Collatz matches the lab's table");
const passing = choices.filter(c => E.grade(c).score === 5).length;
console.log("programs passing all five tests:", passing, "of", choices.length);
console.log(checks + " checks, " + fails + " failures");
process.exit(fails ? 1 : 0);

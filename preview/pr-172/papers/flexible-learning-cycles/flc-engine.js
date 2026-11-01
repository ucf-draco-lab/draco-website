/*
  Engine for /papers/flexible-learning-cycles/.

  Data: Robins, Borowczak, and Borowczak, "Flexible Learning Cycles:
  Introducing an Agile Constructivist Pedagogy," ASEE Annual Conference 2025
  (DOI 10.18260/1-2--56579): Table 1 (16-week schedule), Table 2 (pass
  rates), and the Quantitative and Qualitative Analysis sections.

  The quest demo runs Lab 3 (Collatz Numbers) from the course's public lab
  repository, github.com/cxedhub/cosc-1010-intro-labs (A. Robins, 2023; text
  CC BY-SA 4.0, code GPLv3). runLab() models the lab's main.py with each of
  its five TODO lines filled from a menu, following Python's semantics for
  the menu's choices (integer and float division, a missing argument, a
  missing function). reference/check_lab.py runs every filled-in program in
  Python and reference/verify.js compares the two outcome for outcome.

  Page computations (labeled on the page as its own):
    wilson(k, n)        95% Wilson score interval
    rebuildFall(opts)   every Fall 2022 non-major count k of n that, with the
                        other counts the text prints, reproduces Table 2's
                        printed percentages
  Loads as a page script or in Node.
*/
(function (root) {
  "use strict";

  /* ------------------------------------------------------------ the paper */

  // Table 1 as printed. cycle: C content, R reinforcement, Q quest.
  var WEEKS = [
    { w: 1,  cycle: "C", concept: "Storing and Manipulating Data", lab: "1: Hello World", quests: [] },
    { w: 2,  cycle: "R", concept: "", lab: "2: Cash Register", quests: [] },
    { w: 3,  cycle: "Q", concept: "", lab: "", quests: ["A"] },
    { w: 4,  cycle: "C", concept: "Controlling Flow and Process", lab: "3: Collatz Numbers", quests: [] },
    { w: 5,  cycle: "R", concept: "", lab: "4: RPS", quests: ["A"], retake: true },
    { w: 6,  cycle: "Q", concept: "", lab: "", quests: ["B"] },
    { w: 7,  cycle: "C", concept: "Collections of Data", lab: "5: toki pona Translator", quests: [] },
    { w: 8,  cycle: "R", concept: "", lab: "6: Genetics Analysis", quests: ["A", "B"], retake: true },
    { w: 9,  cycle: "Q", concept: "", lab: "", quests: ["C"] },
    { w: 10, cycle: "C", concept: "Files & More", lab: "7: Movies I: Pre-Processing", quests: [] },
    { w: 11, cycle: "R", concept: "", lab: "Movies II: Structured Data", quests: ["A", "B", "C"], retake: true },
    { w: 12, cycle: "Q", concept: "", lab: "", quests: ["D"] },
    { w: 13, cycle: "C", concept: "Advanced Concepts", lab: "9: Movies III: Data Visualization", quests: [] },
    { w: 14, cycle: "R", concept: "", lab: "10: Yacht Dice", quests: [] },
    { w: 15, cycle: "Q", concept: "", lab: "", quests: ["A", "B", "C", "D"], retake: true },
    { w: 16, cycle: "Q", concept: "", lab: "", quests: ["Final"] }
  ];
  var QUESTS = ["A", "B", "C", "D", "Final"];

  // Weeks in which a quest can be attempted (first sitting plus retakes).
  function questWeeks(q) {
    return WEEKS.filter(function (x) { return x.quests.indexOf(q) >= 0; }).map(function (x) { return x.w; });
  }

  // Table 2 as printed (percent), and the counts the text prints.
  var TABLE2 = {
    n: { major: 72, nonmajor: 147, total: 219 },
    rows: [
      { id: "f22", label: "Fall 2022",   major: 98.15, nonmajor: 91.42, total: 94.35 },
      { id: "s23", label: "Spring 2023", major: 88.88, nonmajor: 90.41, total: 90.11 },
      { id: "ay",  label: "AY 22-23",    major: 95.83, nonmajor: 90.90, total: 92.56 }
    ]
  };
  var COUNTS = {
    f22: { major: [53, 54], nonmajor: [71, 82] },
    s23: { major: [16, 18], nonmajor: [66, 73] }
  };
  var SURVEY = [
    { id: "f22", label: "Fall 2022", respondents: 77, enrolled: 129, printedPct: 60 },
    { id: "s23", label: "Spring 2023", respondents: 34, enrolled: 90, printedPct: 38 }
  ];
  var LITERATURE = { cs1Low: 75, cs1High: 80, media: 90 }; // "upper seventy percent" (refs 24 to 26); media computation about 90%

  // Count pairs for any cell of Table 2, built from the text's counts.
  function countsFor(rowId, group, counts) {
    counts = counts || COUNTS;
    var rows = rowId === "ay" ? ["f22", "s23"] : [rowId];
    var groups = group === "total" ? ["major", "nonmajor"] : [group];
    var k = 0, n = 0;
    rows.forEach(function (r) { groups.forEach(function (g) { k += counts[r][g][0]; n += counts[r][g][1]; }); });
    return [k, n];
  }

  // Two-decimal percentages, rounded and cut (the printed table uses both).
  function pctRound(x) { return Math.round(x * 10000 + 1e-9) / 100; }
  function pctTrunc(x) { return Math.floor(x * 10000 + 1e-9) / 100; }
  function matches(x, printed, rule) {
    var r = pctRound(x), t = pctTrunc(x), eq = function (a) { return Math.abs(a - printed) < 1e-9; };
    if (rule === "round") return eq(r);
    if (rule === "trunc") return eq(t);
    return eq(r) || eq(t);
  }
  function howMatches(x, printed) {
    var r = Math.abs(pctRound(x) - printed) < 1e-9, t = Math.abs(pctTrunc(x) - printed) < 1e-9;
    return r && t ? "both" : r ? "round" : t ? "trunc" : "none";
  }

  // Check every cell of Table 2 against a set of counts.
  function checkTable(counts) {
    var out = [];
    TABLE2.rows.forEach(function (row) {
      ["major", "nonmajor", "total"].forEach(function (g) {
        var kn = countsFor(row.id, g, counts), x = kn[0] / kn[1];
        out.push({ row: row.id, group: g, k: kn[0], n: kn[1], value: x * 100, printed: row[g], how: howMatches(x, row[g]) });
      });
    });
    return out;
  }

  // Every Fall 2022 non-major count k of n (n up to maxN) that, with the
  // other three printed count pairs, reproduces the four Table 2 cells that
  // depend on it under a rule ("either", "round", or "trunc").
  function rebuildFall(opts) {
    opts = opts || {};
    var rule = opts.rule || "either", maxN = opts.maxN || 1000, sols = [];
    var M = COUNTS.f22.major, S = COUNTS.s23;
    for (var n = 1; n <= maxN; n++) for (var k = 0; k <= n; k++) {
      if (!matches(k / n, 91.42, rule)) continue;
      if (!matches((M[0] + k) / (M[1] + n), 94.35, rule)) continue;
      if (!matches((S.nonmajor[0] + k) / (S.nonmajor[1] + n), 90.90, rule)) continue;
      if (!matches((M[0] + S.major[0] + S.nonmajor[0] + k) / (M[1] + S.major[1] + S.nonmajor[1] + n), 92.56, rule)) continue;
      sols.push({ k: k, n: n });
    }
    return { rule: rule, maxN: maxN, solutions: sols };
  }

  // 95% Wilson score interval for k successes in n trials.
  function wilson(k, n, z) {
    z = z || 1.959963984540054;
    var p = k / n, z2 = z * z, den = 1 + z2 / n;
    var centre = (p + z2 / (2 * n)) / den;
    var half = z * Math.sqrt(p * (1 - p) / n + z2 / (4 * n * n)) / den;
    return [Math.max(0, centre - half), Math.min(1, centre + half)];
  }

  /* ------------------------------------------- Lab 3 with five TODO menus */

  var TESTS = [[6, "8"], [2, "1"], [100, "25"], [47, "104"], [17, "12"]];
  var STEP_LIMIT = 10000;

  // Each TODO's menu; option 0 is the lab's intended answer.
  var TODOS = [
    { id: "inc",    line: "iterations = ",  options: ["iterations + 1", "iterations", "iterations - 1"] },
    { id: "even",   line: "n = ",           options: ["even_collatz(n)", "odd_collatz(n)", "n - 1"] },
    { id: "odd",    line: "n = ",           options: ["odd_collatz(n)", "even_collatz(n)", "n + 1"] },
    { id: "out",    line: "",               options: ["print(iterations)", "print(n)", "print(\"iterations\")", "return iterations"] },
    { id: "evenFn", line: "return ",        options: ["n // 2", "n / 2", "n % 2", "n * 2"] },
    { id: "header", line: "",               options: ["def odd_collatz(n):", "def odd_collatz():", "def even_collatz(n):"] }
  ];

  // Values follow Python: whole numbers are BigInt (unbounded, like Python's
  // int) and floats are Numbers with f set.
  function pyStr(v) {
    if (!v.f) return v.x.toString();
    if (v.x !== v.x) return "nan";
    if (!isFinite(v.x)) return v.x > 0 ? "inf" : "-inf";
    return Number.isInteger(v.x) ? v.x.toFixed(1) : String(v.x);
  }
  function fmod2(x) { var r = x % 2; if (r !== 0 && r < 0) r += 2; return r; } // Python float % 2
  function overflow() { throw { type: "OverflowError", msg: "integer division result too large for a float" }; }

  function half(v) { // n / 2
    if (v.f) return { x: v.x / 2, f: true };
    var q = v.x / 2n, r = v.x % 2n, out = Number(q) + Number(r) / 2;
    if (!isFinite(out)) overflow();
    return { x: out, f: true };
  }
  function floorHalf(v) { // n // 2
    if (v.f) return { x: isFinite(v.x) ? Math.floor(v.x / 2) : NaN, f: true };
    var q = v.x / 2n;
    if (v.x % 2n !== 0n && v.x < 0n) q -= 1n;
    return { x: q, f: false };
  }
  function mod2(v) { return v.f ? { x: isFinite(v.x) ? fmod2(v.x) : NaN, f: true } : { x: ((v.x % 2n) + 2n) % 2n, f: false }; }
  function times(v, k, add) { return v.f ? { x: v.x * k + add, f: true } : { x: v.x * BigInt(k) + BigInt(add), f: false }; }
  function plus(v, d) { return v.f ? { x: v.x + d, f: true } : { x: v.x + BigInt(d), f: false }; }
  function isOne(v) { return v.f ? v.x === 1 : v.x === 1n; }
  function isEven(v) { return v.f ? fmod2(v.x) === 0 : v.x % 2n === 0n; }
  function show(v) { return v.f ? v.x : Number(v.x); }

  // Run the filled-in program on one input.
  function runLab(choice, input) {
    var c = choice;
    var header = TODOS[5].options[c.header];
    var evenBody = TODOS[4].options[c.evenFn];
    var evenIsTriple = header === "def even_collatz(n):"; // second def replaces even_collatz
    var oddDefined = header === "def odd_collatz(n):";
    var oddNoArg = header === "def odd_collatz():";

    function evenFn(v) {
      if (evenIsTriple) return times(v, 3, 1);
      switch (evenBody) {
        case "n // 2": return floorHalf(v);
        case "n / 2": return half(v);
        case "n % 2": return mod2(v);
        default: return times(v, 2, 0);
      }
    }
    function oddFn(v) {
      if (oddNoArg) throw { type: "TypeError", msg: "odd_collatz() takes 0 positional arguments but 1 was given" };
      if (!oddDefined) throw { type: "NameError", msg: "name 'odd_collatz' is not defined" };
      return times(v, 3, 1);
    }

    var n = { x: BigInt(input), f: false }, it = 0, steps = 0, trace = [input];
    try {
      while (!isOne(n)) {
        if (++steps > STEP_LIMIT) return { status: "loop", steps: steps - 1, trace: trace, floatN: n.f };
        var inc = TODOS[0].options[c.inc];
        it = inc === "iterations + 1" ? it + 1 : inc === "iterations - 1" ? it - 1 : it;
        var branch = isEven(n) ? TODOS[1].options[c.even] : TODOS[2].options[c.odd];
        if (branch === "even_collatz(n)") n = evenFn(n);
        else if (branch === "odd_collatz(n)") n = oddFn(n);
        else n = plus(n, branch === "n - 1" ? -1 : 1);
        if (trace.length < 400) trace.push(show(n));
      }
    } catch (e) {
      if (!e || !e.type) throw e;
      return { status: "error", error: e.type, message: e.msg, steps: steps, trace: trace };
    }
    var out = TODOS[3].options[c.out], stdout;
    if (out === "print(iterations)") stdout = String(it);
    else if (out === "print(n)") stdout = pyStr(n);
    else if (out === "print(\"iterations\")") stdout = "iterations";
    else stdout = "";
    return { status: "ok", stdout: stdout, steps: steps, trace: trace, floatN: n.f };
  }

  // Autograder: the lab's five input and output pairs.
  function grade(choice) {
    var results = TESTS.map(function (t) {
      var r = runLab(choice, t[0]);
      r.input = t[0]; r.expected = t[1];
      r.pass = r.status === "ok" && r.stdout === t[1];
      return r;
    });
    return { results: results, score: results.filter(function (r) { return r.pass; }).length, of: TESTS.length };
  }

  // Outcome string for comparison with the Python reference.
  function outcome(r) {
    if (r.status === "ok") return "out:" + r.stdout;
    if (r.status === "error") return "err:" + r.error;
    return "loop";
  }

  function allChoices() {
    var out = [];
    function rec(i, acc) {
      if (i === TODOS.length) { out.push(acc.slice()); return; }
      for (var k = 0; k < TODOS[i].options.length; k++) { acc.push(k); rec(i + 1, acc); acc.pop(); }
    }
    rec(0, []);
    return out.map(function (a) { var c = {}; TODOS.forEach(function (t, i) { c[t.id] = a[i]; }); return c; });
  }

  // Plain Collatz step count, for the "any number" readout.
  function collatzSteps(n) {
    var s = 0;
    while (n !== 1 && s < 100000) { n = n % 2 === 0 ? n / 2 : 3 * n + 1; s++; }
    return s;
  }

  root.FlexibleCyclesEngine = {
    WEEKS: WEEKS, QUESTS: QUESTS, questWeeks: questWeeks,
    TABLE2: TABLE2, COUNTS: COUNTS, SURVEY: SURVEY, LITERATURE: LITERATURE,
    countsFor: countsFor, checkTable: checkTable, rebuildFall: rebuildFall, howMatches: howMatches,
    pctRound: pctRound, pctTrunc: pctTrunc, wilson: wilson,
    TESTS: TESTS, TODOS: TODOS, STEP_LIMIT: STEP_LIMIT, runLab: runLab, grade: grade, outcome: outcome,
    allChoices: allChoices, collatzSteps: collatzSteps
  };
  if (typeof module !== "undefined" && module.exports) module.exports = root.FlexibleCyclesEngine;
})(typeof self !== "undefined" ? self : this);

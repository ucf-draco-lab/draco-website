/*
  Engine for /papers/robotics-science-art/.
  Burrows (now Borowczak), Borowczak, Slater, and Haynes, "Teaching Computer
  Science & Engineering Through Robotics: Science & Art Form," Problems of
  Education in the 21st Century 47 (2012): 6-15.

  Plain arithmetic, no dependencies; loads as a page script or in a worker.
  - PAPER: every number and design element the paper's text reports.
  - Robot model: a block-grid robot (the page's own model of the lab tasks,
    not the LEGO MindStorms firmware) with program and rule interpreters.
  - Statistics: paired and two-sample t, exact sign and signed-rank tests over
    every pairing of the 13 self-rankings consistent with the printed counts.
  - Quiz arithmetic: percent increase, the pre-test ceiling a printed increase
    implies, and what the other days must average.
  - Encoding: the "Arithmetic and Secret Messages" idea (letters as numbers).
*/
(function (root) {
  "use strict";

  var PAPER = {
    n: 13,
    grades: { elementary: 5, middle: 5, high: 3 },
    weeks: 2,
    hoursPerDay: 8,
    // Self-ranking counts (novice, intermediate, expert), before and after.
    rankPre: [9, 4, 0],
    rankPost: [0, 8, 5],
    rankPrinted: { pre: [69, 31, 0], post: [0, 62, 38] },
    rankTest: "t-test, p < 0.001",
    // Confidence survey: seven items.
    survey: { items: 7, selfConfidence: 1, perceivedSelf: 4, perceivedStudents: 2,
      topConfidence: 99, otherConfidence: [85, 90], overallP: 0.15, gap: 0.5 },
    // Daily content quizzes (about five content and three pedagogy questions).
    quiz: { content: 5, pedagogy: 3, pre: 57, post: 88 },
    gains: [
      { key: "ph", topic: "pH", area: "Agriculture", pct: 117, note: "largest" },
      { key: "structures", topic: "Structures", area: "Engineering", pct: 91 },
      { key: "water", topic: "Water quality", area: "Engineering", pct: 83 },
      { key: "biomed", topic: "Biomedicine", area: "Engineering", pct: 17, note: "smallest" }
    ],
    quizP: { most: 0.001, encoding: 0.015 },
    // Content-session pairings, in the order the text lists them.
    sessions: [
      ["Astronomy", "Data encoding"],
      ["Technology", "Reactions"],
      ["Mathematics", "Web software"],
      ["Science", "GPS"],
      ["Agriculture", "pH"],
      ["Engineering", "Water quality"],
      ["Engineering", "Structures (for example, aviation)"],
      ["Engineering", "Biomedicine"]
    ],
    labTasks: ["Move", "Loop", "Sense light", "Sense sound", "Track a line", "Turn around",
      "Navigate a maze", "Solve a problem (for example, avoid a wall)"],
    themes: [
      { key: "stem", name: "STEM integration", what: "Links two to four STEM components",
        example: "Making Tracks", band: "Middle school",
        detail: "Mathematics through spatial reasoning, science through ecology and geography, and technology through GPS and web tools." },
      { key: "design", name: "Engineering and design", what: "Runs a full design cycle: plan, prototype, and test again",
        example: "Salt Water to Fresh Water", band: "High school",
        detail: "Students name a water problem, build a prototype, and refine a way to make drinking water from salt water." },
      { key: "encoding", name: "Encoding", what: "Represents information in another form",
        example: "Arithmetic and Secret Messages", band: "Elementary",
        detail: "Students solve arithmetic to encode a message for a classmate and decode the one they receive." }
    ]
  };

  /* ---------------------------------------------------------- special functions */

  function logGamma(x) {
    var g = 7, c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028,
      771.32342877765313, -176.61502916214059, 12.507343278686905,
      -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
    if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - logGamma(1 - x);
    x -= 1;
    var a = c[0], t = x + g + 0.5;
    for (var i = 1; i < g + 2; i++) a += c[i] / (x + i);
    return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
  }
  function betacf(a, b, x) {
    var MAXIT = 300, EPS = 3e-16, FPMIN = 1e-300;
    var qab = a + b, qap = a + 1, qam = a - 1, c = 1, d = 1 - qab * x / qap;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    d = 1 / d;
    var h = d;
    for (var m = 1; m <= MAXIT; m++) {
      var m2 = 2 * m, aa = m * (b - m) * x / ((qam + m2) * (a + m2));
      d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
      c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
      d = 1 / d; h *= d * c;
      aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
      d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
      c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
      d = 1 / d;
      var del = d * c; h *= del;
      if (Math.abs(del - 1) < EPS) break;
    }
    return h;
  }
  function ibeta(x, a, b) {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    var bt = Math.exp(logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log(1 - x));
    if (x < (a + 1) / (a + b + 2)) return bt * betacf(a, b, x) / a;
    return 1 - bt * betacf(b, a, 1 - x) / b;
  }
  function tTwoSided(t, df) {
    if (!isFinite(t)) return 0;
    return ibeta(df / (df + t * t), df / 2, 0.5);
  }

  /* ----------------------------------------------------------------- statistics */

  function mean(a) { var s = 0; a.forEach(function (v) { s += v; }); return s / a.length; }
  function variance(a) {
    var m = mean(a), s = 0;
    a.forEach(function (v) { s += (v - m) * (v - m); });
    return s / (a.length - 1);
  }

  function pairedT(pre, post) {
    var d = post.map(function (v, i) { return v - pre[i]; });
    var n = d.length, md = mean(d), sd = Math.sqrt(variance(d));
    var t = sd === 0 ? (md === 0 ? 0 : Infinity) : md / (sd / Math.sqrt(n));
    return { t: t, df: n - 1, p: tTwoSided(t, n - 1), meanDiff: md, sdDiff: sd };
  }
  function studentT(a, b) {
    var na = a.length, nb = b.length;
    var sp = ((na - 1) * variance(a) + (nb - 1) * variance(b)) / (na + nb - 2);
    var t = (mean(b) - mean(a)) / Math.sqrt(sp * (1 / na + 1 / nb));
    return { t: t, df: na + nb - 2, p: tTwoSided(t, na + nb - 2) };
  }
  function welchT(a, b) {
    var va = variance(a) / a.length, vb = variance(b) / b.length;
    var t = (mean(b) - mean(a)) / Math.sqrt(va + vb);
    var df = (va + vb) * (va + vb) / (va * va / (a.length - 1) + vb * vb / (b.length - 1));
    return { t: t, df: df, p: tTwoSided(t, df) };
  }
  // Exact two-sided sign test (zeros dropped).
  function signTest(d) {
    var pos = 0, nz = 0;
    d.forEach(function (v) { if (v !== 0) { nz++; if (v > 0) pos++; } });
    var k = Math.min(pos, nz - pos), tail = 0;
    for (var i = 0; i <= k; i++) tail += Math.exp(logGamma(nz + 1) - logGamma(i + 1) - logGamma(nz - i + 1)) * Math.pow(0.5, nz);
    return { positive: pos, nonzero: nz, p: Math.min(1, 2 * tail) };
  }
  // Exact Wilcoxon signed-rank test: zeros dropped, midranks for ties, every
  // sign assignment enumerated (2^n, fine for n <= 20). Two-sided p is the share
  // of assignments whose |W+ - mean| is at least the observed one.
  function signedRank(d) {
    var nz = d.filter(function (v) { return v !== 0; });
    var n = nz.length;
    var abs = nz.map(function (v, i) { return { a: Math.abs(v), i: i }; }).sort(function (x, y) { return x.a - y.a; });
    var ranks = new Array(n);
    for (var i = 0; i < n;) {
      var j = i;
      while (j + 1 < n && abs[j + 1].a === abs[i].a) j++;
      var r = (i + j + 2) / 2;
      for (var k = i; k <= j; k++) ranks[abs[k].i] = r;
      i = j + 1;
    }
    var wPlus = 0, total = 0;
    nz.forEach(function (v, idx) { total += ranks[idx]; if (v > 0) wPlus += ranks[idx]; });
    var mid = total / 2, obs = Math.abs(wPlus - mid) - 1e-9, count = 0, all = 1 << n;
    for (var mask = 0; mask < all; mask++) {
      var w = 0;
      for (var b = 0; b < n; b++) if (mask & (1 << b)) w += ranks[b];
      if (Math.abs(w - mid) >= obs) count++;
    }
    return { wPlus: wPlus, nonzero: n, p: count / all };
  }

  /* ------------------------------------------------- self-ranking reconstructions */

  // Ranks are coded novice = 1, intermediate = 2, expert = 3. The paper prints the
  // counts before (9, 4, 0) and after (0, 8, 5) but not who moved where. With no
  // novices afterward, every pairing is set by k, the number of the four
  // pre-intermediates who became experts (0 to 4); then 5 - k novices became
  // experts and 4 + k became intermediates.
  function pairing(k) {
    var pre = [], post = [], who = [];
    var i;
    for (i = 0; i < 5 - k; i++) { pre.push(1); post.push(3); who.push("N→E"); }
    for (i = 0; i < 4 + k; i++) { pre.push(1); post.push(2); who.push("N→I"); }
    for (i = 0; i < k; i++) { pre.push(2); post.push(3); who.push("I→E"); }
    for (i = 0; i < 4 - k; i++) { pre.push(2); post.push(2); who.push("I→I"); }
    return { k: k, pre: pre, post: post, moves: who };
  }
  function rankAnalysis(k) {
    var pr = pairing(k);
    var d = pr.post.map(function (v, i) { return v - pr.pre[i]; });
    return {
      k: k, pairing: pr, diffs: d,
      paired: pairedT(pr.pre, pr.post),
      student: studentT(pr.pre, pr.post),
      welch: welchT(pr.pre, pr.post),
      sign: signTest(d),
      signedRank: signedRank(d)
    };
  }
  function allRankings() { var out = []; for (var k = 0; k <= 4; k++) out.push(rankAnalysis(k)); return out; }
  function pct(count, n) { return Math.round(100 * count / n); }

  /* --------------------------------------------------------------- quiz arithmetic */

  function percentIncrease(pre, post) { return 100 * (post - pre) / pre; }
  function postFor(pre, pctInc) { return pre * (1 + pctInc / 100); }
  // A printed percent increase g caps the pre-test score at 100 / (1 + g/100).
  function preCeiling(pctInc, max) { return (max || 100) / (1 + pctInc / 100); }
  // If the two-week averages are the mean of `days` day averages, and the four
  // reported topics had the given pre-test scores, what must the other days average?
  function otherDays(preByTopic, days) {
    days = days || PAPER.sessions.length;
    var sPre = 0, sPost = 0;
    PAPER.gains.forEach(function (g) {
      var p = preByTopic[g.key];
      sPre += p; sPost += postFor(p, g.pct);
    });
    var rest = days - PAPER.gains.length;
    var needPre = (PAPER.quiz.pre * days - sPre) / rest;
    var needPost = (PAPER.quiz.post * days - sPost) / rest;
    return { pre: needPre, post: needPost, gain: percentIncrease(needPre, needPost),
      feasible: needPre >= 0 && needPost <= 100 && needPre <= 100 && needPost >= 0 };
  }

  /* ------------------------------------------------------------------ robot model */

  // Grid cells: "#" wall, "." floor, "=" dark tape (the light sensor reads dark),
  // "*" a corner target, "G" the goal. Headings: 0 east, 1 south, 2 west, 3 north.
  var DX = [1, 0, -1, 0], DY = [0, 1, 0, -1];

  function parseGrid(rows) {
    return rows.map(function (r) { return r.split(""); });
  }
  function cellAt(grid, x, y) {
    if (y < 0 || y >= grid.length || x < 0 || x >= grid[0].length) return "#";
    return grid[y][x];
  }

  function squareTask() {
    return {
      key: "square", tier: "novice",
      grid: parseGrid([
        "#########",
        "#.......#",
        "#.*...*.#",
        "#.......#",
        "#.......#",
        "#.......#",
        "#.*...*.#",
        "#.......#",
        "#########"
      ]),
      start: { x: 2, y: 6, h: 3 },
      goal: "Visit all four corner marks and finish back where you started."
    };
  }
  function lineTask(lineX) {
    var rows = [];
    for (var y = 0; y < 7; y++) {
      var r = "";
      for (var x = 0; x < 11; x++) {
        if (y === 0 || y === 6 || x === 0 || x === 10) r += "#";
        else if (x === lineX) r += "=";
        else r += ".";
      }
      rows.push(r);
    }
    return {
      key: "line", tier: "intermediate", lineX: lineX,
      grid: parseGrid(rows),
      start: { x: 1, y: 3, h: 0 },
      goal: "Stop with the light sensor on the dark tape, wherever the tape is."
    };
  }
  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  // A perfect maze (one path between any two rooms) by randomized depth-first search.
  function mazeTask(seed, cols, rowsN) {
    cols = cols || 6; rowsN = rowsN || 4;
    var W = 2 * cols + 1, H = 2 * rowsN + 1, rand = mulberry32(seed || 1);
    var g = [];
    for (var y = 0; y < H; y++) { g.push([]); for (var x = 0; x < W; x++) g[y].push("#"); }
    var seen = {}, stack = [[0, 0]];
    seen["0,0"] = true; g[1][1] = ".";
    while (stack.length) {
      var cur = stack[stack.length - 1], opts = [];
      for (var h = 0; h < 4; h++) {
        var nx = cur[0] + DX[h], ny = cur[1] + DY[h];
        if (nx >= 0 && ny >= 0 && nx < cols && ny < rowsN && !seen[nx + "," + ny]) opts.push([nx, ny, h]);
      }
      if (!opts.length) { stack.pop(); continue; }
      var pick = opts[Math.floor(rand() * opts.length)];
      seen[pick[0] + "," + pick[1]] = true;
      g[2 * cur[1] + 1 + DY[pick[2]]][2 * cur[0] + 1 + DX[pick[2]]] = ".";
      g[2 * pick[1] + 1][2 * pick[0] + 1] = ".";
      stack.push([pick[0], pick[1]]);
    }
    g[H - 2][W - 2] = "G";
    return {
      key: "maze", tier: "expert", seed: seed,
      grid: g, start: { x: 1, y: 1, h: 0 },
      goal: "Reach the goal square in the far corner using the bump sensor alone."
    };
  }

  // Programs for the novice and intermediate tiers: a list of blocks, run `repeat`
  // times. Blocks: {op:"fwd", n}, {op:"left"}, {op:"right"}, {op:"back"},
  // {op:"untilDark"}. A blocked move is a bump: the robot stays put and the run
  // records it. Every step is a frame for animation.
  function runProgram(task, program, repeat, maxSteps) {
    maxSteps = maxSteps || 400;
    var s = { x: task.start.x, y: task.start.y, h: task.start.h };
    var frames = [{ x: s.x, y: s.y, h: s.h, ev: "start" }], bumps = 0, steps = 0, halted = "";
    function push(ev) { frames.push({ x: s.x, y: s.y, h: s.h, ev: ev }); }
    function step() {
      var nx = s.x + DX[s.h], ny = s.y + DY[s.h];
      if (cellAt(task.grid, nx, ny) === "#") { bumps++; push("bump"); return false; }
      s.x = nx; s.y = ny; push("move"); return true;
    }
    outer:
    for (var r = 0; r < (repeat || 1); r++) {
      for (var i = 0; i < program.length; i++) {
        var b = program[i];
        if (steps > maxSteps) { halted = "steps"; break outer; }
        if (b.op === "fwd") { for (var j = 0; j < b.n; j++) { steps++; if (!step()) break; } }
        else if (b.op === "left") { s.h = (s.h + 3) % 4; steps++; push("turn"); }
        else if (b.op === "right") { s.h = (s.h + 1) % 4; steps++; push("turn"); }
        else if (b.op === "back") { s.h = (s.h + 2) % 4; steps++; push("turn"); }
        else if (b.op === "untilDark") {
          var guard = 0;
          while (cellAt(task.grid, s.x, s.y) !== "=" && guard++ < 60) { steps++; if (!step()) break; }
        }
      }
    }
    return finish(task, frames, bumps, halted);
  }

  // Rules for the expert tier, checked every tick until the goal or the limit:
  //   rules.side: "right" | "left" | "none": if that side is open, turn to it and step.
  //   rules.blocked: "left" | "right" | "back": what to do when the way ahead is blocked.
  //   otherwise: step forward.
  // The robot "feels" a side or the front by the bump sensor: it turns, tests,
  // and turns back, so each test counts as a tick.
  function runRules(task, rules, maxTicks) {
    maxTicks = maxTicks || 600;
    var s = { x: task.start.x, y: task.start.y, h: task.start.h };
    var frames = [{ x: s.x, y: s.y, h: s.h, ev: "start" }], ticks = 0, halted = "";
    function open(h) { return cellAt(task.grid, s.x + DX[h], s.y + DY[h]) !== "#"; }
    function push(ev) { frames.push({ x: s.x, y: s.y, h: s.h, ev: ev }); }
    function fwd() { s.x += DX[s.h]; s.y += DY[s.h]; push("move"); }
    var visits = {};
    while (cellAt(task.grid, s.x, s.y) !== "G") {
      if (ticks++ >= maxTicks) { halted = "ticks"; break; }
      var key = s.x + "," + s.y + "," + s.h;
      visits[key] = (visits[key] || 0) + 1;
      if (visits[key] > 1) { halted = "loop"; break; }
      var sideH = rules.side === "right" ? (s.h + 1) % 4 : rules.side === "left" ? (s.h + 3) % 4 : -1;
      if (sideH >= 0 && open(sideH)) { s.h = sideH; push("turn"); fwd(); continue; }
      if (open(s.h)) { fwd(); continue; }
      push("bump");
      s.h = rules.blocked === "left" ? (s.h + 3) % 4 : rules.blocked === "right" ? (s.h + 1) % 4 : (s.h + 2) % 4;
      push("turn");
    }
    return finish(task, frames, 0, halted);
  }

  function finish(task, frames, bumps, halted) {
    var last = frames[frames.length - 1], visited = {};
    frames.forEach(function (f) { visited[f.x + "," + f.y] = true; });
    var res = { frames: frames, bumps: bumps, halted: halted, moves: frames.filter(function (f) { return f.ev === "move"; }).length };
    if (task.key === "square") {
      var marks = [], hit = 0;
      task.grid.forEach(function (row, y) { row.forEach(function (c, x) { if (c === "*") { marks.push([x, y]); if (visited[x + "," + y]) hit++; } }); });
      res.marks = marks.length; res.hit = hit;
      res.home = last.x === task.start.x && last.y === task.start.y;
      res.success = hit === marks.length && res.home;
    } else if (task.key === "line") {
      res.onLine = cellAt(task.grid, last.x, last.y) === "=";
      res.success = res.onLine;
    } else {
      res.success = cellAt(task.grid, last.x, last.y) === "G";
    }
    return res;
  }

  /* ---------------------------------------------------------------------- encoding */

  // A = 1 ... Z = 26, space = 0. Each letter becomes a sum or difference whose
  // answer is that letter's number; solving every problem decodes the message.
  function encodeMessage(text, seed) {
    var rand = mulberry32(seed || 7), out = [];
    text.toUpperCase().split("").forEach(function (ch) {
      var v = ch === " " ? 0 : ch.charCodeAt(0) - 64;
      if (ch !== " " && (v < 1 || v > 26)) return;
      var kind = rand() < 0.5 ? "+" : "−";
      var a, b;
      if (kind === "+") { a = Math.floor(rand() * (v + 1)); b = v - a; }
      else { b = 1 + Math.floor(rand() * 9); a = v + b; }
      out.push({ ch: ch, value: v, a: a, b: b, op: kind });
    });
    return out;
  }
  function decodeProblems(problems) {
    return problems.map(function (p) {
      var v = p.op === "+" ? p.a + p.b : p.a - p.b;
      return v === 0 ? " " : String.fromCharCode(64 + v);
    }).join("");
  }

  var api = {
    PAPER: PAPER,
    tTwoSided: tTwoSided, pairedT: pairedT, studentT: studentT, welchT: welchT,
    signTest: signTest, signedRank: signedRank,
    pairing: pairing, rankAnalysis: rankAnalysis, allRankings: allRankings, pct: pct,
    percentIncrease: percentIncrease, postFor: postFor, preCeiling: preCeiling, otherDays: otherDays,
    squareTask: squareTask, lineTask: lineTask, mazeTask: mazeTask,
    runProgram: runProgram, runRules: runRules, cellAt: cellAt, DX: DX, DY: DY,
    encodeMessage: encodeMessage, decodeProblems: decodeProblems, mulberry32: mulberry32
  };
  root.RoboticsEngine = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof self !== "undefined" ? self : this);

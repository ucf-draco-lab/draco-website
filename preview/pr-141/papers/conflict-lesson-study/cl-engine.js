/*
  Engine for /papers/conflict-lesson-study/.
  Burrows (Borowczak) and Borowczak, "Computer Science and Engineering: Utilizing
  Action Research and Lesson Study," Educational Action Research (2019),
  doi:10.1080/09650792.2019.1566082.

  DATA holds what the paper prints: the three research lessons, the lesson's seven
  steps, the four themes in the order the paper ranks them, the 18 field-note
  excerpts it prints under those themes, and the Table 1 game rules.
  Functions:
    totals()            participants per lesson and in all (18 + 38 + 29 = 85)
    tally()             printed excerpts by theme and by observer (page's count)
    kappa(a, b, k)      Cohen's kappa between two codings (page's analysis)
    Game                the straw game of Table 1, simulated (page's model)
  Loads as a page script and in Node or a Web Worker.
*/
(function (root) {
  "use strict";

  var DATA = {
    lessons: [
      { id: 1, label: "Lesson 1", when: "February 2017", term: "Spring 2017", n: 18, teacher: "CoE faculty member",
        observers: ["CEAS faculty member", "Graduate student"], month: 1,
        audience: "Upper-level computing course (the paper moved later lessons to freshman- and sophomore-heavy classes)",
        game: "Mildly competitive team game (Table 1): 20 paper balls, up to five puffs per member",
        changes: [
          "Baseline lesson: ABET and soft skills, partnership importance, conflict levels, and approaches to conflict, then the team game.",
          "Observers noted that participants missed the connections between the lesson's parts in their answers to in-class questions."
        ] },
      { id: 2, label: "Lesson 2", when: "November 2017", term: "Fall 2017", n: 38, teacher: "CoE faculty member",
        observers: ["CEAS faculty member", "Graduate student"], month: 10,
        audience: "Freshman- and sophomore-heavy class",
        game: "Same game with explicit directions to talk about expectations for the outcome, plus industry conflicts: limited funding, resources, personnel, and peer evaluations",
        changes: [
          "Five components taught separately and named explicitly: ABET, soft skills and communication, partnerships, conflict model types, and means to negotiate conflict.",
          "Concrete examples for each conflict type (resource, objective, identity) and each strategy (argumentation, resonance, innovation, action).",
          "Observers noted that participants now articulated the connections when asked but still missed real-world uses."
        ] },
      { id: 3, label: "Lesson 3", when: "February 2018", term: "Spring 2018", n: 29, teacher: "CEAS faculty member",
        observers: ["CoE faculty member", "Graduate student"], month: 13,
        audience: "Freshman- and sophomore-heavy class; whole-class feedback on the lesson collected in the session",
        game: "Played twice: first as in Lesson 2, then with 10 paper balls and four puffs per member for the same expected score",
        changes: [
          "Every component taught with an industry example.",
          "A participant with about 15 years in semiconductor work led a class discussion of trust, goals, expectations, and negotiation.",
          "The class was asked for feedback on the lesson during the session."
        ] }
    ],
    steps: [
      "Welcome and pretest",
      "ABET overview and soft skills",
      "Reading on partnership importance, with think/pair/share",
      "Partnership components",
      "Team game (Table 1)",
      "Conflict types and management techniques",
      "Posttest and questions"
    ],
    cycle: [
      { name: "Study and set goals", text: "Consider participant learning, long-term goals, and curriculum topics." },
      { name: "Plan", text: "Write the goals, anticipated participant thinking, data collection, and rationale." },
      { name: "Teach the research lesson", text: "One member teaches while the others collect data." },
      { name: "Reflect", text: "Observers share the data, propose next steps, and carry questions forward." }
    ],
    themes: [
      { key: "interest", name: "Interest in the material", short: "Interest" },
      { key: "discussion", name: "Discussion about the material", short: "Discussion" },
      { key: "expansion", name: "Topic expansion or misdirection", short: "Expansion" },
      { key: "confusion", name: "Confusion or complacency", short: "Confusion" }
    ],
    observers: [
      { key: "gs", name: "Graduate student" },
      { key: "ceas", name: "CEAS faculty" },
      { key: "coe", name: "CoE faculty" }
    ],
    // The 18 excerpts printed in the Findings section, in print order. theme = index
    // into themes (the section the paper printed it under). Long notes are shortened
    // with an ellipsis; brackets are the paper's.
    notes: [
      { t: 0, o: "gs", text: "“Everyone is looking forward and seem to be paying attention.”" },
      { t: 0, o: "ceas", text: "Instructor comment on partnerships and “making or breaking an engineering career” got the participants on the edge of their seats. “They actually leaned forward.”" },
      { t: 0, o: "gs", text: "“Chuckles of recognition heard about identity conflicts,” especially at a class project that demanded teamwork but was “rife with conflicts.”" },
      { t: 0, o: "coe", text: "A participant shared a positive example: “I’m married, my wife and I have the same expectations – she cooks and I clean and do the dishes.” The class chuckled." },
      { t: 0, o: "gs", text: "A participant said she would be “sad” if someone questioned her identity as a programmer: “What you’re capable of? I wouldn’t like it.”" },
      { t: 0, o: "coe", text: "Participant says, “Hurry up so we can get some points!”", both: 1 },
      { t: 1, o: "ceas", text: "“Okay. So, go ahead. You need to start so that the rest of us can go in order you know.”" },
      { t: 1, o: "coe", text: "“I’m listening to you but I just don’t get it. Don’t [engineers] do these things already? I have a job. I communicate with others.”" },
      { t: 1, o: "coe", text: "Small talk as clarification of the game began. One asks, “All right, where do you want to begin?”" },
      { t: 1, o: "gs", text: "“Ok, you know what I think?” Then, “So what we’re doing is trying to get at the target… we get 5 tries.”" },
      { t: 1, o: "gs", text: "Discussing expectations with a neighbor: “My dog and I have expectations… he won’t run away if I let him off-leash and he gets a treat.”" },
      { t: 2, o: "gs", text: "One participant mentioned “I used [to] work for [industry company].” The other said, “Oh, making chips?”" },
      { t: 2, o: "coe", text: "Heard talking about “making robots” and “that was a lot cooler, because we were working with high schoolers.”" },
      { t: 2, o: "coe", text: "“Ever play [? video game]?” “Yeah. How far have you gotten?” Then attention returned to the activity." },
      { t: 2, o: "ceas", text: "“What happens when a team is missing a person? What do you do? What does the team do to fill in that gap?”" },
      { t: 3, o: "ceas", text: "Participants quietly reading, some flipping pages, “wondering when the conversations for think/pair/share begin.”" },
      { t: 3, o: "gs", text: "A participant talked about how some of the accrediting board competencies did not pertain to engineering." },
      { t: 3, o: "coe", text: "“Engineers are smart. We know this stuff. Doesn’t seem like we need a lesson on this.”" }
    ],
    game: {
      // Table 1. The target picture is not reproduced in the paper's text; the rings
      // and points below are the page's.
      rules: {
        standard: { balls: 20, puffs: 5, label: "Lessons 1 to 3, first round: 20 balls, five puffs each" },
        tight: { balls: 10, puffs: 4, label: "Lesson 3, second round: 10 balls, four puffs each" }
      },
      rings: [ { r: 0.22, pts: 10 }, { r: 0.48, pts: 5 }, { r: 0.74, pts: 3 }, { r: 1.0, pts: 1 } ],
      start: 1.18,     // balls start just outside the target (Table 1, set-up step 5)
      reach: 0.42,     // farthest one puff carries a ball, in target radii (page's choice)
      table: 1.75      // a ball pushed beyond this radius falls off the table
    }
  };

  function totals() {
    var per = DATA.lessons.map(function (l) { return l.n; });
    return { per: per, all: per.reduce(function (a, b) { return a + b; }, 0) };
  }

  function tally(notes) {
    notes = notes || DATA.notes;
    var byTheme = DATA.themes.map(function () { return 0; });
    var byObs = {}, grid = {};
    DATA.observers.forEach(function (o) { byObs[o.key] = 0; grid[o.key] = DATA.themes.map(function () { return 0; }); });
    notes.forEach(function (n) { byTheme[n.t]++; byObs[n.o]++; grid[n.o][n.t]++; });
    return { byTheme: byTheme, byObs: byObs, grid: grid, n: notes.length };
  }

  // Cohen's kappa for two codings a, b (arrays of category indexes 0..k-1).
  function kappa(a, b, k) {
    var n = a.length, agree = 0, pa = [], pb = [], i;
    for (i = 0; i < k; i++) { pa.push(0); pb.push(0); }
    for (i = 0; i < n; i++) { if (a[i] === b[i]) agree++; pa[a[i]]++; pb[b[i]]++; }
    var po = agree / n, pe = 0;
    for (i = 0; i < k; i++) pe += (pa[i] / n) * (pb[i] / n);
    var kap = pe === 1 ? 1 : (po - pe) / (1 - pe);
    return { agree: agree, n: n, po: po, pe: pe, kappa: kap };
  }

  /* ------------------------------------------------------------- the game */

  // Mulberry32: small seeded generator so simulated runs repeat exactly.
  function rng(seed) {
    var s = seed >>> 0;
    return function () {
      s = (s + 0x6D2B79F5) >>> 0;
      var t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function gauss(r) {
    var u = 1 - r(), v = r();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  function points(x, y) {
    var d = Math.sqrt(x * x + y * y), rings = DATA.game.rings;
    for (var i = 0; i < rings.length; i++) if (d <= rings[i].r) return rings[i].pts;
    return 0;
  }

  // A game: balls start evenly spaced just outside the target; members puff in a
  // fixed order (Table 1, play step 1), each up to `puffs` times.
  function Game(opts) {
    opts = opts || {};
    var rule = DATA.game.rules[opts.rule || "standard"];
    this.rule = opts.rule || "standard";
    this.members = opts.members || 5;
    this.puffsEach = rule.puffs;
    this.nBalls = rule.balls;
    this.r = rng(opts.seed === undefined ? 1 : opts.seed);
    this.balls = [];
    for (var i = 0; i < this.nBalls; i++) {
      var a = (2 * Math.PI * (i + 0.5)) / this.nBalls;
      this.balls.push({ x: DATA.game.start * Math.cos(a), y: DATA.game.start * Math.sin(a), off: false });
    }
    this.turn = 0;                 // puffs taken so far
    this.log = [];
  }
  Game.prototype.totalPuffs = function () { return this.members * this.puffsEach; };
  Game.prototype.member = function () { return this.turn % this.members; };
  Game.prototype.done = function () { return this.turn >= this.totalPuffs(); };
  Game.prototype.score = function () {
    var s = 0;
    this.balls.forEach(function (b) { if (!b.off) s += points(b.x, b.y); });
    return s;
  };
  // Puff ball i toward (tx, ty). The puff travels at most `reach`; its length varies
  // by about 25 percent and it drifts sideways by about 15 percent of the distance.
  Game.prototype.puff = function (i, tx, ty) {
    if (this.done()) return null;
    var b = this.balls[i];
    if (!b || b.off) return null;
    var dx = tx - b.x, dy = ty - b.y, d = Math.sqrt(dx * dx + dy * dy);
    if (d < 1e-9) return null;
    var want = Math.min(d, DATA.game.reach), ux = dx / d, uy = dy / d;
    var len = want * (1 + 0.25 * gauss(this.r));
    var side = want * 0.15 * gauss(this.r);
    var from = { x: b.x, y: b.y };
    b.x += ux * len - uy * side;
    b.y += uy * len + ux * side;
    if (Math.sqrt(b.x * b.x + b.y * b.y) > DATA.game.table) b.off = true;
    var rec = { member: this.member(), ball: i, from: from, to: { x: b.x, y: b.y }, off: b.off };
    this.turn++;
    this.log.push(rec);
    return rec;
  };

  // A simple team plan for the simulated comparison: each puff goes to the ball whose
  // expected gain toward the center is largest (page's strategy).
  Game.prototype.autoPuff = function () {
    var best = -1, bestGain = -Infinity, self = this;
    this.balls.forEach(function (b, i) {
      if (b.off) return;
      var d = Math.sqrt(b.x * b.x + b.y * b.y);
      var nd = Math.max(0, d - DATA.game.reach);
      var gain = points(nd * b.x / (d || 1), nd * b.y / (d || 1)) - points(b.x, b.y);
      if (gain > bestGain + 1e-9) { bestGain = gain; best = i; }
    });
    if (best < 0) return null;
    return this.puff(best, 0, 0);
  };

  // Simulated scores for one rule set over `runs` seeded games.
  function simulate(rule, members, runs, seed0) {
    var scores = [];
    for (var s = 0; s < runs; s++) {
      var g = new Game({ rule: rule, members: members, seed: (seed0 || 1000) + s });
      while (!g.done()) if (!g.autoPuff()) break;
      scores.push(g.score());
    }
    var mean = scores.reduce(function (a, b) { return a + b; }, 0) / runs;
    var sd = Math.sqrt(scores.reduce(function (a, b) { return a + (b - mean) * (b - mean); }, 0) / (runs - 1));
    var sorted = scores.slice().sort(function (a, b) { return a - b; });
    return { scores: scores, mean: mean, sd: sd, min: sorted[0], max: sorted[runs - 1],
      median: runs % 2 ? sorted[(runs - 1) / 2] : (sorted[runs / 2 - 1] + sorted[runs / 2]) / 2, runs: runs };
  }

  var api = { DATA: DATA, totals: totals, tally: tally, kappa: kappa, points: points, Game: Game, simulate: simulate, rng: rng };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.ConflictLessonEngine = api;
})(typeof self !== "undefined" ? self : this);

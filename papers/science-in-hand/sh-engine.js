/*
  Engine for /papers/science-in-hand/.
  Burrows (Borowczak), Wickizer, Meyer, and Borowczak, "Enhancing Pedagogy with
  Context and Partnerships: Science in Hand," Problems of Education in the 21st
  Century 54:7-13 (2013).

  DATA holds the paper's printed values: the two lessons and their ACS
  (application, career, societal impact) links, the class sizes, Table 1's four
  heat/work questions with pre- and post-test correct-answer rates, and the
  results stated in the text.

  The rest is the page's own arithmetic:
    - twelfths(): the counts out of 12 students that round to Table 1's percentages;
    - mcnemarRange(): exact McNemar p bounds over every pairing the counts allow;
    - aggregate(): what the biology classes' gain must be for a 17-point aggregate,
      given a chemistry gain (weighted by students);
    - Mixer: a seeded model of the "Molecule Mixing" activity (students walk in
      straight lines, meet, pour back and forth, and turn).
  Loads as a page script or in a Web Worker.
*/
(function (root) {
  "use strict";

  var DATA = {
    students: { total: 55, chem: 12, bio: 43, bioClasses: 2 },
    lessons: [
      {
        id: "heat", name: "Heat and work", course: "AP chemistry", classes: 1, n: 12,
        tool: "Vacuum coffee pot",
        A: "Making coffee", C: "Engineers who design appliances using chemistry and physics",
        S: "The economics of the coffee trade",
        steps: [
          "The Fellow hands out brewed coffee to get the class's attention.",
          "Students take a short pre-quiz on heat and work.",
          "The brew starts: a flame heats water in the pot's lower chamber, and the Fellow asks, “Where does the heat from the flame go?”",
          "The water expands and rises into the upper chamber, emptying the lower one.",
          "The class discusses what “job” the heat did and reviews the terms heat and work.",
          "Students apply enthalpy, h ≡ u + pv, and Hess's law, ΣΔh(reactants) = ΣΔh(products)."
        ]
      },
      {
        id: "eq", name: "Dynamic equilibrium", course: "Biology", classes: 2, n: 43,
        tool: "Molecule Mixing (beakers of colored water)",
        A: "Room capacity", C: "Chemistry, structural biology, and process engineering",
        S: "How people mix in public spaces while the overall system stays dynamic",
        steps: [
          "Each student holds a 200 ml beaker. One holds dark blue water, one holds yellow, and the rest hold clear water.",
          "Students walk at a constant speed in straight lines.",
          "When two students meet, they stop, pour water back and forth between their beakers, and change direction.",
          "The Fellow calls “freeze!” several times so the class can observe and predict the final color.",
          "Every beaker turns the same green. Students keep moving and pouring, and the color stays the same: dynamic equilibrium.",
          "The activity takes about 15 minutes."
        ]
      }
    ],
    // Table 1 (heat/work, 12 AP chemistry students). pre and post are printed percentages.
    table1: [
      { prong: "A", short: "Define work", q: "How do you define work?",
        full: "A force applied over a distance, or a change in the system's pressure and volume (W = ΔPV)",
        pre: 8, post: 33 },
      { prong: "B", short: "Is heat doing work?", q: "Is the heat energy in your coffee doing any work?",
        full: "No, or yes when justified by the upward motion of the vapor",
        pre: 42, post: 42 },
      { prong: "C", short: "Energy bookkeeping", q: "Your coffee holds 38 units of energy and you add cream with −8 units. How many units of energy are left in the coffee? If the heat then does 20 units of work, how many are left?",
        full: "30, then 10 or 18 (one correct number, or sound logic, earned full credit)",
        pre: 58, post: 58 },
      { prong: "D", short: "Single measure", q: "What single measure might a thermochemist use to describe changes in the energy of the coffee cup system?",
        full: "Enthalpy, ΔH",
        pre: 33, post: 92 }
    ],
    text: {
      chemGainAbout: 10,     // "about 10% more" correct answers (12 chemistry students)
      prongADgainOver: 20,   // A and D each rose by more than 20%
      bioGainOver: 15,       // both biology classes improved by more than 15%
      aggregate: 17          // aggregate increase in correct answers
    },
    funding: "NSF DGE-0528532 (Project STEP, University of Cincinnati)"
  };

  /* ------------------------------------------------------------ Table 1 */

  // Every count k out of n whose percentage rounds (half up) to the printed integer.
  function countsFor(pct, n) {
    var out = [];
    for (var k = 0; k <= n; k++) if (Math.floor(100 * k / n + 0.5) === pct) out.push(k);
    return out;
  }
  function twelfths() {
    return DATA.table1.map(function (r) {
      return { prong: r.prong, pre: countsFor(r.pre, 12), post: countsFor(r.post, 12) };
    });
  }
  function table1Totals() {
    var t = twelfths(), pre = 0, post = 0;
    t.forEach(function (r) { pre += r.pre[0]; post += r.post[0]; });
    var n = 12 * t.length;
    return { pre: pre, post: post, n: n, prePct: 100 * pre / n, postPct: 100 * post / n,
             gain: 100 * (post - pre) / n, relative: 100 * (post - pre) / pre,
             meanProngGain: t.reduce(function (s, r) { return s + 100 * (r.post[0] - r.pre[0]) / 12; }, 0) / t.length };
  }

  /* ------------------------------------------------------- exact tests */

  function lchoose(n, k) { return lgamma(n + 1) - lgamma(k + 1) - lgamma(n - k + 1); }
  function lgamma(x) {
    var c = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
    var y = x, tmp = x + 5.5, ser = 1.000000000190015;
    tmp -= (x + 0.5) * Math.log(tmp);
    for (var j = 0; j < 6; j++) ser += c[j] / ++y;
    return -tmp + Math.log(2.5066282746310005 * ser / x);
  }
  // Exact two-sided McNemar test: binomial on discordant pairs b and c, p = 0.5.
  function mcnemarExact(b, c) {
    var n = b + c;
    if (n === 0) return 1;
    var k = Math.min(b, c), s = 0;
    for (var i = 0; i <= k; i++) s += Math.exp(lchoose(n, i) - n * Math.LN2);
    return Math.min(1, 2 * s);
  }
  // Given a pre count and a post count of correct answers out of n paired students,
  // every pairing gives b (wrong -> right) and c (right -> wrong) with b - c = post - pre.
  function mcnemarRange(pre, post, n) {
    var d = post - pre, rows = [];
    for (var c = 0; c <= n; c++) {
      var b = c + d;
      if (b < 0) continue;
      if (c > pre || b > n - pre) continue;              // c from pre-right, b from pre-wrong
      if (c > n - post || b > post) continue;             // c lands post-wrong, b post-right
      rows.push({ b: b, c: c, p: mcnemarExact(b, c) });
    }
    var ps = rows.map(function (r) { return r.p; });
    return { rows: rows, min: Math.min.apply(null, ps), max: Math.max.apply(null, ps) };
  }

  /* ------------------------------------------------------ aggregate */

  // Aggregate gain weighted by students: (12 g_chem + 43 g_bio) / 55 = 17.
  function bioGainFor(chemGain, agg) {
    var s = DATA.students;
    agg = agg === undefined ? DATA.text.aggregate : agg;
    return (s.total * agg - s.chem * chemGain) / s.bio;
  }
  function aggregate(chemGain, bioGain) {
    var s = DATA.students;
    return (s.chem * chemGain + s.bio * bioGain) / s.total;
  }

  /* --------------------------------------------- Molecule Mixing model */

  // Mulberry32: small seeded generator so every run with a seed repeats exactly.
  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /*
    A room of size w x h (meters). Each student walks at speed v in a straight
    line, bouncing off walls. Two students closer than r meet if neither has met
    anyone in the last `cool` seconds; they pour back and forth, which moves each
    beaker a fraction `mix` of the way toward the pair's average (mix = 1 is a
    complete exchange), then both turn to a new random heading.
    Each beaker tracks the amount of blue and yellow dye as a share of all the
    blue (or yellow) dye in the room, so each column always sums to 1.
  */
  function Mixer(opts) {
    opts = opts || {};
    this.n = opts.n || 22;
    this.w = opts.w || 10;
    this.h = opts.h || 7;
    this.v = opts.v || 0.8;
    this.r = opts.r || 0.45;
    this.mix = opts.mix === undefined ? 1 : opts.mix;
    this.cool = opts.cool === undefined ? 1.5 : opts.cool;
    this.rand = rng(opts.seed === undefined ? 7 : opts.seed);
    this.t = 0;
    this.meetings = 0;
    this.moved = 0;           // total dye share poured between beakers, both colors
    this.p = [];
    for (var i = 0; i < this.n; i++) {
      var a = this.rand() * 2 * Math.PI;
      this.p.push({
        x: this.r + this.rand() * (this.w - 2 * this.r),
        y: this.r + this.rand() * (this.h - 2 * this.r),
        dx: Math.cos(a), dy: Math.sin(a),
        blue: i === 0 ? 1 : 0, yellow: i === 1 ? 1 : 0,
        last: -1e9, flash: -1e9
      });
    }
  }
  Mixer.prototype.step = function (dt) {
    var P = this.p, i, j;
    for (i = 0; i < P.length; i++) {
      var s = P[i];
      s.x += s.dx * this.v * dt; s.y += s.dy * this.v * dt;
      if (s.x < this.r) { s.x = this.r; s.dx = Math.abs(s.dx); }
      if (s.x > this.w - this.r) { s.x = this.w - this.r; s.dx = -Math.abs(s.dx); }
      if (s.y < this.r) { s.y = this.r; s.dy = Math.abs(s.dy); }
      if (s.y > this.h - this.r) { s.y = this.h - this.r; s.dy = -Math.abs(s.dy); }
    }
    this.t += dt;
    for (i = 0; i < P.length; i++) {
      for (j = i + 1; j < P.length; j++) {
        var a = P[i], b = P[j];
        if (this.t - a.last < this.cool || this.t - b.last < this.cool) continue;
        var ddx = a.x - b.x, ddy = a.y - b.y;
        if (ddx * ddx + ddy * ddy > 4 * this.r * this.r) continue;
        this.pour(a, b);
        a.last = b.last = a.flash = b.flash = this.t;
        var t1 = this.rand() * 2 * Math.PI, t2 = this.rand() * 2 * Math.PI;
        a.dx = Math.cos(t1); a.dy = Math.sin(t1);
        b.dx = Math.cos(t2); b.dy = Math.sin(t2);
        this.meetings++;
      }
    }
  };
  Mixer.prototype.pour = function (a, b) {
    var k = this.mix / 2;
    var db = k * (b.blue - a.blue), dy = k * (b.yellow - a.yellow);
    a.blue += db; b.blue -= db;
    a.yellow += dy; b.yellow -= dy;
    this.moved += Math.abs(db) + Math.abs(dy);
  };
  // Spread: how far the beakers are from all matching, as the root-mean-square
  // difference from the equal share 1/n, relative to the starting spread (1 at start, 0 when uniform).
  Mixer.prototype.spread = function () {
    var n = this.p.length, e = 1 / n, s = 0;
    this.p.forEach(function (q) { s += (q.blue - e) * (q.blue - e) + (q.yellow - e) * (q.yellow - e); });
    var s0 = 2 * ((1 - e) * (1 - e) + (n - 1) * e * e);
    return Math.sqrt(s / s0);
  };
  Mixer.prototype.totals = function () {
    var b = 0, y = 0;
    this.p.forEach(function (q) { b += q.blue; y += q.yellow; });
    return { blue: b, yellow: y };
  };
  // Run until spread < tol or tmax seconds. Returns time and meetings at that point.
  Mixer.prototype.runUntil = function (tol, tmax, dt) {
    dt = dt || 0.05;
    while (this.spread() > tol && this.t < tmax) this.step(dt);
    return { t: this.t, meetings: this.meetings, spread: this.spread() };
  };

  var api = {
    DATA: DATA,
    countsFor: countsFor, twelfths: twelfths, table1Totals: table1Totals,
    mcnemarExact: mcnemarExact, mcnemarRange: mcnemarRange,
    bioGainFor: bioGainFor, aggregate: aggregate,
    rng: rng, Mixer: Mixer
  };
  root.ScienceInHandEngine = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof self !== "undefined" ? self : this);

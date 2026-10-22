/*
  Study engine for /papers/mill-creek-source-tracking/.

  Hadaway, Urbaitis, Lamendella, Oerther, Burrows (Borowczak), Borowczak, and
  Kukreti (ASEE 2010) describe a high school water-quality unit built through
  Project STEP (NSF GK-12, DGE-0538532): AP Biology students traced fecal
  pollution in Cincinnati's Mill Creek with PCR on host-specific Bacteroidales
  markers, and three Physical Science classes measured six parameters at
  station rotations and classified them in Excel. The paper prints a lesson-
  component table (Table 1), the AP Biology pre/post means and p-value, three
  Physical Science p-values, and water-quality ratings.

  This file holds:
    - the paper's printed values;
    - whole-count recovery for Table 1 (every percentage is k/32);
    - Gale-Ryser feasibility checks of the text's 97% and 82% claims (page's own);
    - Student's t p-values via the regularized incomplete beta function, and
      the spread that a given class size needs to reach a printed p (page's own);
    - dissolved-oxygen saturation (Benson and Krause, as given in Standard
      Methods 4500-O and USGS DOTABLES) for the percent-saturation step;
    - a simulated PCR (logistic amplification) for the source-tracking demo.
  Loads as a page script or in Node.
*/
(function (root) {
  "use strict";

  /* ------------------------------------------------------------ the paper's values */

  // Table 1, "Percentage of lesson components": [addressed, partially addressed].
  var TABLE1 = [
    { name: "Science", a: 78.13, p: 3.13, stem: "S" },
    { name: "Technology", a: 65.63, p: 25.00, stem: "T" },
    { name: "Engineering", a: 62.50, p: 34.38, stem: "E" },
    { name: "Math", a: 59.38, p: 21.88, stem: "M" },
    { name: "Oral assessment", a: 3.13, p: 3.13 },
    { name: "Written assessment", a: 90.63, p: 3.13 },
    { name: "Misconceptions", a: 15.63, p: 18.75 },
    { name: "Review or essential questions", a: 31.25, p: 21.88 },
    { name: "PowerPoint", a: 59.38, p: 0.00 },
    { name: "Multiple learning styles", a: 59.38, p: 37.50 },
    { name: "Pictures or diagrams", a: 84.38, p: 12.50 },
    { name: "Application", a: 93.75, p: 6.25 },
    { name: "Social impact", a: 59.38, p: 25.00 },
    { name: "Career connection", a: 34.38, p: 31.25 }
  ];

  // Percentages stated in the text about the same lessons.
  var TEXT_CLAIMS = {
    stemPct: { S: 78, T: 66, E: 62, M: 59 },
    threeOrMore: 97,   // "97% of lessons at least partially contain components from at least three"
    twoOfDefinite: 82, // "lessons that definitely contain elements ... 82% contain content from at least two"
    styles: 97,        // "More than 97% ... address or partially address ... multiple learning styles"
    application: 93,   // "More than 93% ... real-world application"
    social: 60,        // "Nearly 60% ... societal or social impacts"
    careers: 1 / 3,    // "less than one-third ... connecting the material to potential careers"
    misconceptions: 16 // "only 16%"
  };

  var SCORES = {
    apbio: { pre: 11, post: 53, p: 1.86e-6, preDate: "2009-03-24", postDate: "2009-04-21" },
    phys: [
      { name: "Bell 3", p: 2.85e-12 },
      { name: "Bell 4", p: 0.00017 },
      { name: "Bell 5", p: 2.85e-12 }
    ],
    minGain: 40
  };

  // Ratings printed for the AP Biology field tests (Results).
  var RATINGS = [
    { name: "Dissolved oxygen", rating: "good" },
    { name: "pH", rating: "good" },
    { name: "Nitrates", rating: "good" },
    { name: "Turbidity", rating: "good" },
    { name: "Orthophosphates", rating: "good" },
    { name: "Macroinvertebrates", rating: "good" },
    { name: "Temperature", rating: "excellent" },
    { name: "Biological oxygen demand", rating: "fair" },
    { name: "Fecal coliform colonies", rating: "poor" }
  ];
  var OVERALL = "very poor";
  var SCALE = ["very poor", "poor", "fair", "good", "excellent"];

  /* ------------------------------------------------------------ Table 1 counts */

  function round2(x) { return Math.round(x * 100 + 1e-9) / 100; }

  // Whole counts k (0..n) whose share k/n prints as pct to two decimals.
  function countsFor(pct, n) {
    var out = [];
    for (var k = 0; k <= n; k++) if (Math.abs(round2(100 * k / n) - pct) < 1e-9) out.push(k);
    return out;
  }

  // Smallest n (up to maxN) for which every printed value in values has a count.
  function smallestDenominator(values, maxN) {
    for (var n = 1; n <= (maxN || 200); n++) {
      var ok = values.every(function (v) { return countsFor(v, n).length > 0; });
      if (ok) return n;
    }
    return null;
  }

  function table1Values() {
    var v = [];
    TABLE1.forEach(function (r) { v.push(r.a, r.p); });
    return v;
  }

  function table1Counts(n) {
    n = n || 32;
    return TABLE1.map(function (r) {
      var a = countsFor(r.a, n), p = countsFor(r.p, n);
      return { name: r.name, stem: r.stem || null, a: a.length === 1 ? a[0] : null, p: p.length === 1 ? p[0] : null, aPct: r.a, pPct: r.p };
    });
  }

  /* ------------------------------------------------------------ Gale-Ryser checks */

  // Is there a 0/1 matrix with row sums rows[] and column sums cols[]?
  function galeRyser(rows, cols) {
    var r = rows.slice().sort(function (a, b) { return b - a; });
    var c = cols.slice();
    var sr = r.reduce(function (s, x) { return s + x; }, 0);
    var sc = c.reduce(function (s, x) { return s + x; }, 0);
    if (sr !== sc) return false;
    var m = c.length;
    for (var k = 1; k <= r.length; k++) {
      var left = 0, right = 0;
      for (var i = 0; i < k; i++) left += r[i];
      for (var j = 0; j < m; j++) right += Math.min(c[j], k);
      if (left > right) return false;
    }
    return true;
  }

  // Every way to give n lessons 0..m disciplines (counts of lessons with each
  // degree) that fits column sums cols. Calls fn(dist) for each feasible one.
  function eachDegreeDistribution(n, cols, fn) {
    var m = cols.length;
    var total = cols.reduce(function (s, x) { return s + x; }, 0);
    var dist = new Array(m + 1).fill(0);
    (function rec(d, left, sum) {
      if (d === 0) {
        dist[0] = left;
        if (sum !== total) return;
        var rows = [];
        for (var k = 0; k <= m; k++) for (var t = 0; t < dist[k]; t++) rows.push(k);
        if (galeRyser(rows, cols)) fn(dist.slice());
        return;
      }
      for (var c = 0; c <= left; c++) {
        if (sum + c * d > total) break;
        dist[d] = c;
        rec(d - 1, left - c, sum + c * d);
      }
      dist[d] = 0;
    })(m, n, 0);
  }

  // Range of the share of lessons with at least k disciplines.
  function shareAtLeast(n, cols, k) {
    var lo = Infinity, hi = -Infinity, count = 0;
    eachDegreeDistribution(n, cols, function (dist) {
      var s = 0;
      for (var d = k; d < dist.length; d++) s += dist[d];
      lo = Math.min(lo, s); hi = Math.max(hi, s); count++;
    });
    return { min: lo, max: hi, n: n, feasible: count };
  }

  // Ratios (lessons with >= 2) / (lessons with >= 1) reachable under cols.
  function ratioTwoOfOne(n, cols) {
    var seen = {};
    eachDegreeDistribution(n, cols, function (dist) {
      var one = n - dist[0], two = one - dist[1];
      if (one > 0) seen[two + "/" + one] = { two: two, one: one, r: two / one };
    });
    return Object.keys(seen).map(function (k) { return seen[k]; }).sort(function (a, b) { return a.r - b.r; });
  }

  /* ------------------------------------------------------------ Student's t */

  function logGamma(x) {
    var g = 7, c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313,
      -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
    if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - logGamma(1 - x);
    x -= 1;
    var a = c[0], t = x + g + 0.5;
    for (var i = 1; i < g + 2; i++) a += c[i] / (x + i);
    return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
  }

  function betacf(a, b, x) {
    var MAXIT = 400, EPS = 3e-16, FPMIN = 1e-300;
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

  // Regularized incomplete beta I_x(a, b).
  function ibeta(x, a, b) {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    var bt = Math.exp(logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log(1 - x));
    if (x < (a + 1) / (a + b + 2)) return bt * betacf(a, b, x) / a;
    return 1 - bt * betacf(b, a, 1 - x) / b;
  }

  // Two-sided p for Student's t with df degrees of freedom.
  function tTwoSided(t, df) {
    var x = df / (df + t * t);
    return ibeta(x, df / 2, 0.5);
  }

  // |t| giving two-sided p at df (bisection on log p).
  function tForP(p, df) {
    var lo = 0, hi = 1;
    while (tTwoSided(hi, df) > p) hi *= 2;
    for (var i = 0; i < 200; i++) {
      var mid = (lo + hi) / 2;
      if (tTwoSided(mid, df) > p) lo = mid; else hi = mid;
    }
    return (lo + hi) / 2;
  }

  // Standard deviation that makes a mean gain of `gain` points reach p with n students.
  // design "paired": SD of each student's change, df = n - 1.
  // design "two": pooled SD of scores, equal groups of n, df = 2n - 2.
  function sdForP(gain, n, p, design) {
    if (design === "paired") {
      var t1 = tForP(p, n - 1);
      return { t: t1, df: n - 1, sd: gain * Math.sqrt(n) / t1 };
    }
    var t2 = tForP(p, 2 * n - 2);
    return { t: t2, df: 2 * n - 2, sd: gain / (t2 * Math.sqrt(2 / n)) };
  }

  function pForSd(gain, n, sd, design) {
    if (design === "paired") return tTwoSided(gain / (sd / Math.sqrt(n)), n - 1);
    return tTwoSided(gain / (sd * Math.sqrt(2 / n)), 2 * n - 2);
  }

  /* ------------------------------------------------------------ dissolved oxygen */

  // Equilibrium DO (mg/L) in fresh water at temperature tC (deg C) and pressure
  // pAtm (atm), Benson and Krause (1984) as given in Standard Methods 4500-O.
  function doSaturation(tC, pAtm) {
    var T = tC + 273.15;
    var lnC = -139.34411 + 1.575701e5 / T - 6.642308e7 / (T * T) + 1.2438e10 / (T * T * T) - 8.621949e11 / (T * T * T * T);
    var c = Math.exp(lnC);
    if (pAtm === undefined || pAtm === 1) return c;
    var pwv = Math.exp(11.8571 - 3840.7 / T - 216961 / (T * T));
    var theta = 0.000975 - 1.426e-5 * tC + 6.436e-8 * tC * tC;
    return c * pAtm * ((1 - pwv / pAtm) * (1 - theta * pAtm)) / ((1 - pwv) * (1 - theta));
  }

  function percentSaturation(doMgL, tC, pAtm) {
    return 100 * doMgL / doSaturation(tC, pAtm);
  }

  function mean(xs) { return xs.reduce(function (s, x) { return s + x; }, 0) / xs.length; }
  function sd(xs) {
    if (xs.length < 2) return 0;
    var m = mean(xs);
    return Math.sqrt(xs.reduce(function (s, x) { return s + (x - m) * (x - m); }, 0) / (xs.length - 1));
  }
  function fToC(f) { return (f - 32) * 5 / 9; }

  /* ------------------------------------------------------------ ratings */

  function rank(r) { return SCALE.indexOf(r); }
  // Two ways to combine parameter ratings into one; the paper does not state its rule.
  function combine(ratings, rule) {
    var ranks = ratings.map(rank);
    if (rule === "worst") return SCALE[Math.min.apply(null, ranks)];
    var m = mean(ranks);
    return SCALE[Math.round(m)];
  }

  /* ------------------------------------------------------------ simulated PCR */

  // Primer sets named in the paper (16S rRNA gene of Bacteroidales).
  var MARKERS = [
    { id: "gen", name: "General", host: "any warm-blooded animal" },
    { id: "hum", name: "Human", host: "people (sewage, septic)" },
    { id: "cow", name: "Cow", host: "cattle and other ruminants" },
    { id: "pig", name: "Pig", host: "pigs" }
  ];

  // Illustrative starting copies of each marker per reaction. Simulated, not
  // the class's data: the paper reports only its conclusion (human sources).
  var SAMPLES = {
    creek: { name: "Mill Creek after rain", copies: { gen: 4e4, hum: 6e3, cow: 0, pig: 0 }, answer: "hum",
      note: "Set up to match the paper's conclusion: Bacteroidales present, human marker present." },
    pasture: { name: "Pasture runoff", copies: { gen: 5e4, hum: 0, cow: 1.5e4, pig: 0 }, answer: "cow" },
    farm: { name: "Hog farm ditch", copies: { gen: 3e4, hum: 0, cow: 0, pig: 8e3 }, answer: "pig" },
    mixed: { name: "Below a farm and a storm overflow", copies: { gen: 9e4, hum: 2e3, cow: 1.2e4, pig: 0 }, answer: "mixed" },
    spring: { name: "Spring upstream", copies: { gen: 3, hum: 0, cow: 0, pig: 0 }, answer: "none" }
  };

  var PCR = { efficiency: 0.92, plateau: 1e12, visible: 2e10 };

  // Copies after each cycle: logistic growth toward the plateau.
  function amplify(n0, cycles, eff, plateau) {
    eff = eff === undefined ? PCR.efficiency : eff;
    plateau = plateau || PCR.plateau;
    var n = n0, out = [n];
    for (var c = 0; c < cycles; c++) {
      n = n + eff * n * (1 - n / plateau);
      out.push(n);
    }
    return out;
  }

  // Band brightness 0..1 for a final copy number (0 below the visible level).
  function band(final) {
    if (final < PCR.visible) return 0;
    var x = Math.log10(final / PCR.visible) / Math.log10(PCR.plateau / PCR.visible);
    return Math.max(0.18, Math.min(1, 0.18 + 0.82 * x));
  }

  function runGel(sampleId, cycles) {
    var s = SAMPLES[sampleId];
    var lanes = MARKERS.map(function (m) {
      var curve = amplify(s.copies[m.id], cycles);
      return { id: m.id, name: m.name, start: s.copies[m.id], final: curve[curve.length - 1], curve: curve, band: band(curve[curve.length - 1]) };
    });
    // a no-template control never amplifies in this model
    lanes.push({ id: "ntc", name: "No DNA", start: 0, final: 0, curve: amplify(0, cycles), band: 0 });
    return lanes;
  }

  // What the bands say.
  function readGel(lanes) {
    var on = {};
    lanes.forEach(function (l) { on[l.id] = l.band > 0; });
    var hosts = ["hum", "cow", "pig"].filter(function (h) { return on[h]; });
    if (!on.gen && hosts.length === 0) return "none";
    if (hosts.length === 0) return "unknown";
    if (hosts.length === 1) return hosts[0];
    return "mixed";
  }

  // Cycle at which a curve first crosses the visible level (null if never).
  function crossing(curve) {
    for (var i = 0; i < curve.length; i++) if (curve[i] >= PCR.visible) return i;
    return null;
  }

  var api = {
    TABLE1: TABLE1, TEXT_CLAIMS: TEXT_CLAIMS, SCORES: SCORES, RATINGS: RATINGS, OVERALL: OVERALL, SCALE: SCALE,
    countsFor: countsFor, smallestDenominator: smallestDenominator, table1Values: table1Values, table1Counts: table1Counts,
    galeRyser: galeRyser, eachDegreeDistribution: eachDegreeDistribution, shareAtLeast: shareAtLeast, ratioTwoOfOne: ratioTwoOfOne,
    logGamma: logGamma, ibeta: ibeta, tTwoSided: tTwoSided, tForP: tForP, sdForP: sdForP, pForSd: pForSd,
    doSaturation: doSaturation, percentSaturation: percentSaturation, mean: mean, sd: sd, fToC: fToC,
    rank: rank, combine: combine,
    MARKERS: MARKERS, SAMPLES: SAMPLES, PCR: PCR, amplify: amplify, band: band, runGel: runGel, readGel: readGel, crossing: crossing
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.MillCreekEngine = api;
})(typeof self !== "undefined" ? self : this);

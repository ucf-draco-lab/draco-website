/*
  Engine for /papers/astronomy-stem-pld/.
  Burrows (Borowczak), Borowczak, Myers, Schwortz, and McKim, "Integrated STEM for
  Teacher Professional Learning and Development: 'I Need Time for Practice',"
  Education Sciences 11(1):21, 2021 (DOI 10.3390/educsci11010021).

  DATA holds the paper's printed values: the three professional learning and
  development (PLD) designs (Table 2), participants (Table 1), content gains
  (Section 6.1, Tables 3 and 4), perceptions (Section 6.2), and planning and
  classroom use (Section 6.3, Tables 8 and 10).

  The rest is the page's own arithmetic:
    - pairedFromT(): the two-sided p of a paired t and the two standardized
      effect sizes it implies (d_z = t / sqrt(n); d_av = d_z * sqrt(2(1 - r)));
      with the paper's t = 2.38, n = 29, and r = 0.94 it returns p = 0.0244 and
      d_av = 0.15, the two values the paper prints;
    - meanOfCounts(): the mean of a rating distribution; the space-session
      usefulness counts (1, 4, 9, 5 of 20) give 1.95, the paper's mean;
    - mcnemarPairings(): every before-and-after pairing consistent with two
      marginal counts, with the exact McNemar p of each;
    - fisher2x2(), twoPropZ(), wilson(): unpaired comparisons and intervals;
    - simulateSky(): a seeded, simulated set of point sources (stars and
      quasars) for the color-cut demo. It is illustrative, not SDSS data.
  Loads as a page script or in a Web Worker.
*/
(function (root) {
  "use strict";

  var DATA = {
    years: [
      {
        id: "2014", name: "2014 LASSI", n: 8, sample: 7,
        goal: "Show K–12 teachers astronomy lessons and how they connect to all of STEM",
        emphasis: "Astronomy exposure with STEM links",
        change: "First iteration",
        day: { scheduled: 6, collab: 2, scheduledLabel: "Scheduled activities", collabLabel: "Collaborative work" },
        data: "Collected during on-campus activities, with peers and faculty helping",
        present: { label: "Talks to peers at the end of the two weeks", outsiders: 0, outsidersText: "no outsiders" },
        examples: ["Scaling the solar system", "Distance to Mars", "Could people colonize Mars"],
        need: "Project work with room to fail",
        level: [2, 2, 2, 2], subject: [1, 0, 0, 3, 4], gender: [4, 4]
      },
      {
        id: "2015", name: "2015 LASSI", n: 22, sample: 21,
        goal: "Have each teacher build an astronomy research question and project of their own, using integrated STEM",
        emphasis: "Authentic astronomy research experience",
        change: "Shifted to independent, authentic research projects",
        day: { scheduled: 2, collab: 6, scheduledLabel: "One planned activity", collabLabel: "Collaborative work with faculty support" },
        data: "Collected during peer work on and off campus, with some faculty support",
        present: { label: "Electronic posters for peers and visitors", outsiders: 5, outsidersText: "about five outsiders" },
        examples: ["Analyzing spectra", "Does Venus have phases", "Telling Jupiter's moons apart", "Sizing bodies by angular size"],
        need: "Project work with more structure and faculty-supported space",
        level: [16, 3, 3, 0], subject: [4, 0, 0, 1, 17], gender: [16, 6]
      },
      {
        id: "2016", name: "2016 RAMPED", n: 30, sample: 29,
        goal: "Expose teachers to many STEM disciplines, astronomy among them, and help them build classroom lessons",
        emphasis: "Varied, engaging STEM exposures",
        change: "Shifted to different content and technology, with less independent work time",
        day: { scheduled: 6, collab: 2, scheduledLabel: "Planned activities", collabLabel: "Collaborative work" },
        data: "Collected during on-campus planned sessions with faculty support",
        present: { label: "Printed posters in a conference-style session", outsiders: 16, outsidersText: "more than 15 outsiders" },
        examples: ["Finding changing-look quasars in SDSS", "Raspberry Pi weather lessons", "Modeling with NetLogo"],
        need: "Fewer focus areas (four at most)",
        level: [6, 14, 9, 1], subject: [15, 1, 1, 3, 10], gender: [19, 11]
      }
    ],
    levelNames: ["Elementary", "Middle", "High", "Other"],
    subjectNames: ["Science", "Technology", "Engineering", "Math", "Other or arts"],
    genderNames: ["Female", "Male"],

    // Table 4, 2015 LASSI: content focus, p (as printed), technical:conceptual split.
    t4_2015: [
      { topic: "Foundations of computing", sig: true, p: "< 0.0001", tech: 60 },
      { topic: "Galileoscopes", sig: false, p: "Not sig.", tech: 80 },
      { topic: "EM spectrum, gravity", sig: true, p: "< 0.0001", tech: 80 },
      { topic: "Doppler effect and angular size", sig: false, p: "Not sig.", tech: 80 },
      { topic: "Stellar classification and gas giant planets", sig: true, p: "< 0.0001", tech: 60 },
      { topic: "Galaxies, quasars, and gas giants' moons", sig: true, p: "< 0.0001", tech: 50 },
      { topic: "Hubble's law, three-color images, and remote observation", sig: true, p: "< 0.0001", tech: 50 }
    ],
    // Table 4, 2016 RAMPED: three questions, one significant; split 33:67.
    t4_2016: { questions: 3, sig: 1, tech: 33 },

    // Section 6.1 MOSART, 2014 LASSI.
    mosart2014: {
      written: { max: 12, scores: [3, 10, 10, 11, 12, 12, 12] },
      drawing: { max: 5, scores: [1, 2, 2, 4, 4, 4, 4, 5] },
      eccentricity: { held: 5, of: 8 }
    },
    // Section 6.1, 2016 RAMPED pooled MOSART items: matched pairs.
    mosart2016: { t: 2.38, p: 0.0244, r: 0.94, d: 0.15, n: 29 },
    // Section 6.1, 2016 space session: identifying astronomy data repositories.
    space: { pre: 15, post: 90, attended: 20, pPrinted: "< 0.00001" },

    // Section 6.2.
    perceptions: [
      { year: "2014", what: "Classroom affected \"quite a bit\" or more", kind: "pct", value: 64, parts: [["Quite a bit", 45], ["Very much", 19]] },
      { year: "2015", what: "Overall session quality (0 poor to 4 excellent)", kind: "scale", max: 4, w1: 2.32, w2: 3.67 },
      { year: "2015", what: "Complexity rated \"just right\"", kind: "pctpair", w1: 41, w2: 76 },
      { year: "2016", what: "\"Somewhat\" or \"very\" satisfied", kind: "pctpair", w1: 93, w2: 97 },
      { year: "2016", what: "Would recommend a PLD like it (0 to 10)", kind: "scale", max: 10, w1: 8.86, w2: 9.07 }
    ],
    // Space-session usefulness, 20 attendees: not at all 5%, small 20%, moderate 45%, large 25%.
    usefulness: { labels: ["Not at all", "Small extent", "Moderate", "Large"], pct: [5, 20, 45, 25], attended: 20, meanPrinted: 1.95 },
    ratio: "three positive comments for every negative one",

    // Section 6.3 and Tables 8 and 10.
    lessonTopics: [
      { year: "2014", astro: 5, of: 6, note: "Science and math dominated" },
      { year: "2015", astro: 13, of: 16, note: "Balanced, with emphasis on science" },
      { year: "2016", astro: 8, of: 15, note: "Technology dominated" }
    ],
    planning2016: { unsure: 4, general: 8, of: 30 },
    observed: { visited: 21, of: 30, astro: 7, vehicle: 6, authentic: 0 },
    t10: [
      { level: "Elementary", n: 3, content: [["Orders of magnitude", 2], ["Space book", 1]], subject: [["Math", 2], ["Reading", 1]] },
      { level: "Middle school", n: 1, content: [["Diffusion of gases, spatial patterns, analyzing spectra", 1]], subject: [["Chemistry", 1]] },
      { level: "High school", n: 3, content: [["Space, gases, and coding", 1], ["Plasma", 1], ["Elliptical orbits", 1]], subject: [["Physics", 2], ["Math", 1]] }
    ]
  };

  /* ------------------------------------------------ special functions */

  function lgamma(x) {
    var c = [76.18009172947146, -86.50532032941677, 24.01409824083091,
      -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
    var y = x, tmp = x + 5.5;
    tmp -= (x + 0.5) * Math.log(tmp);
    var ser = 1.000000000190015;
    for (var j = 0; j < 6; j++) ser += c[j] / ++y;
    return -tmp + Math.log(2.5066282746310005 * ser / x);
  }
  function betacf(a, b, x) {
    var MAXIT = 300, EPS = 3e-16, FPMIN = 1e-300;
    var qab = a + b, qap = a + 1, qam = a - 1, c = 1, d = 1 - qab * x / qap;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    d = 1 / d; var h = d;
    for (var m = 1; m <= MAXIT; m++) {
      var m2 = 2 * m, aa = m * (b - m) * x / ((qam + m2) * (a + m2));
      d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
      c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
      d = 1 / d; h *= d * c;
      aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
      d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
      c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
      d = 1 / d; var del = d * c; h *= del;
      if (Math.abs(del - 1) < EPS) break;
    }
    return h;
  }
  function ibeta(a, b, x) {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    var bt = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x));
    if (x < (a + 1) / (a + b + 2)) return bt * betacf(a, b, x) / a;
    return 1 - bt * betacf(b, a, 1 - x) / b;
  }
  // Two-sided p for Student's t with df degrees of freedom.
  function tTwoSided(t, df) { return ibeta(df / 2, 0.5, df / (df + t * t)); }
  // Standard normal upper tail (Abramowitz-Stegun 7.1.26 is too coarse; use erfc series).
  function erfc(x) {
    var z = Math.abs(x), t = 1 / (1 + 0.5 * z);
    var r = t * Math.exp(-z * z - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 +
      t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 +
      t * (-0.82215223 + t * 0.17087277)))))))));
    return x >= 0 ? r : 2 - r;
  }
  function normTwoSided(z) { return erfc(Math.abs(z) / Math.SQRT2); }
  function lchoose(n, k) { return lgamma(n + 1) - lgamma(k + 1) - lgamma(n - k + 1); }
  function choose(n, k) { return Math.round(Math.exp(lchoose(n, k))); }

  /* ------------------------------------------------ page computations */

  function pairedFromT(t, n, r) {
    var dz = t / Math.sqrt(n);
    return { t: t, n: n, df: n - 1, r: r, p: tTwoSided(t, n - 1), dz: dz, dav: dz * Math.sqrt(2 * (1 - r)) };
  }

  function meanOfCounts(counts, values) {
    var s = 0, n = 0;
    counts.forEach(function (c, i) { s += c * (values ? values[i] : i); n += c; });
    return { mean: n ? s / n : NaN, n: n };
  }
  // Rebuild whole-person counts from percentages of a known group size.
  function countsFromPct(pcts, size) { return pcts.map(function (p) { return Math.round(p * size / 100); }); }

  // Exact two-sided binomial test of b successes in m trials at p = 0.5 (McNemar exact).
  function binomTwoSided(b, m) {
    if (m === 0) return 1;
    var k = Math.min(b, m - b), tail = 0;
    for (var i = 0; i <= k; i++) tail += Math.exp(lchoose(m, i) - m * Math.LN2);
    return Math.min(1, 2 * tail);
  }
  // Every pairing of n people with a correct before and c2 correct after.
  // b = wrong before, right after; c = right before, wrong after.
  function mcnemarPairings(n, a1, a2) {
    var out = [];
    for (var c = 0; c <= Math.min(a1, n - a2); c++) {
      var b = a2 - a1 + c;
      if (b < 0 || b > n - a1) continue;
      var both = a1 - c, neither = n - a1 - b;
      if (neither < 0) continue;
      out.push({ b: b, c: c, both: both, neither: neither, p: binomTwoSided(b, b + c) });
    }
    return out;
  }
  // Fisher's exact test, two-sided (sum of tables no more probable than observed).
  function fisher2x2(a, b, c, d) {
    var r1 = a + b, r2 = c + d, c1 = a + c, n = r1 + r2;
    function lp(x) { return lchoose(r1, x) + lchoose(r2, c1 - x) - lchoose(n, c1); }
    var obs = lp(a), p = 0, lo = Math.max(0, c1 - r2), hi = Math.min(r1, c1);
    for (var x = lo; x <= hi; x++) { var v = lp(x); if (v <= obs + 1e-9) p += Math.exp(v); }
    return Math.min(1, p);
  }
  // Pooled two-proportion z test (equivalent to Pearson chi-square without correction).
  function twoPropZ(x1, n1, x2, n2) {
    var p1 = x1 / n1, p2 = x2 / n2, pp = (x1 + x2) / (n1 + n2);
    var se = Math.sqrt(pp * (1 - pp) * (1 / n1 + 1 / n2));
    var z = (p2 - p1) / se;
    return { z: z, p: normTwoSided(z) };
  }
  // Wilson score interval (95 percent by default).
  function wilson(x, n, z) {
    z = z || 1.959963984540054;
    var p = x / n, den = 1 + z * z / n;
    var mid = (p + z * z / (2 * n)) / den;
    var half = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / den;
    return { lo: Math.max(0, mid - half), hi: Math.min(1, mid + half) };
  }

  /* ------------------------------------------------ simulated sky */

  function mulberry32(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function gauss(rng) {
    var u = 0, v = 0;
    while (u === 0) u = rng();
    while (v === 0) v = rng();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }
  // Point sources in (u - g, g - r) color. Stars follow a curved locus from hot
  // (blue) to cool (red); quasars sit at small u - g, the ultraviolet excess that
  // classic SDSS quasar selection uses. Parameters are illustrative only.
  function simulateSky(seed, nStars, nQuasars) {
    var rng = mulberry32(seed), pts = [];
    for (var i = 0; i < nStars; i++) {
      var s = rng();
      var ug = 0.6 + 2.1 * s + 0.15 * gauss(rng);
      var gr = 0.15 + 1.25 * Math.pow(s, 1.15) + 0.07 * gauss(rng);
      pts.push({ ug: ug, gr: gr, q: false });
    }
    for (var j = 0; j < nQuasars; j++) {
      pts.push({ ug: 0.25 + 0.22 * gauss(rng), gr: 0.2 + 0.15 * gauss(rng), q: true });
    }
    // Shuffle so the drawing order does not reveal the class.
    for (var k = pts.length - 1; k > 0; k--) {
      var m = Math.floor(rng() * (k + 1)), tmp = pts[k]; pts[k] = pts[m]; pts[m] = tmp;
    }
    return pts;
  }
  function scoreCut(pts, cut) {
    var tp = 0, fp = 0, fn = 0, tn = 0;
    pts.forEach(function (p) {
      var called = p.ug < cut;
      if (called && p.q) tp++; else if (called) fp++; else if (p.q) fn++; else tn++;
    });
    return { tp: tp, fp: fp, fn: fn, tn: tn };
  }

  var API = {
    DATA: DATA,
    tTwoSided: tTwoSided, normTwoSided: normTwoSided, ibeta: ibeta, choose: choose,
    pairedFromT: pairedFromT, meanOfCounts: meanOfCounts, countsFromPct: countsFromPct,
    binomTwoSided: binomTwoSided, mcnemarPairings: mcnemarPairings,
    fisher2x2: fisher2x2, twoPropZ: twoPropZ, wilson: wilson,
    simulateSky: simulateSky, scoreCut: scoreCut
  };
  root.PldEngine = API;
  if (typeof module !== "undefined" && module.exports) module.exports = API;
})(typeof self !== "undefined" ? self : this);

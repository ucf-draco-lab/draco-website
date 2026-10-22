/*
  River-reach field-day engine for /papers/laramie-river-scouts/.

  Burrows, Lockwood, Borowczak, Janak, and Barber (Education Sciences 2018)
  report that Girl Scouts compared a restored reach of the Laramie River with a
  control reach on five factors (macro-invertebrate diversity, riparian height,
  canopy cover, benthic particle size, and velocity). The paper prints the
  direction of each difference and no measurements. Every number this engine
  produces is SIMULATED: the reach parameters below are chosen by the page so
  that the expected differences point the way the paper reports them.

  Statistics: Shannon diversity (natural log), family richness, Welch's t-test
  with a two-sided p from the regularized incomplete beta function, and the
  variance ratio. Checked against SciPy by tools in the pull request.

  Loads as a page script or in a Web Worker.
*/
(function (root) {
  "use strict";

  /* ------------------------------------------------------------ random draws */

  function rng(seed) {
    var a = (seed >>> 0) || 1;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function normal(r) {
    var u = 0, v = 0;
    while (u === 0) u = r();
    while (v === 0) v = r();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  // Marsaglia and Tsang gamma(shape k, scale 1)
  function gamma(r, k) {
    if (k < 1) return gamma(r, k + 1) * Math.pow(r(), 1 / k);
    var d = k - 1 / 3, c = 1 / Math.sqrt(9 * d);
    for (;;) {
      var x = normal(r), v = 1 + c * x;
      if (v <= 0) continue;
      v = v * v * v;
      var u = r();
      if (u < 1 - 0.0331 * x * x * x * x) return d * v;
      if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
    }
  }

  function poisson(r, lambda) {
    if (lambda <= 0) return 0;
    if (lambda < 30) {
      var L = Math.exp(-lambda), k = 0, p = 1;
      do { k++; p *= r(); } while (p > L);
      return k - 1;
    }
    return Math.max(0, Math.round(lambda + Math.sqrt(lambda) * normal(r)));
  }

  // Negative binomial as a gamma-Poisson mixture: mean mu, clumping size k.
  function negbin(r, mu, k) { return poisson(r, mu * gamma(r, k) / k); }

  /* ------------------------------------------------------------ the two reaches */

  // Families a dichotomous key separates by tails, legs, and body shape.
  var FAMILIES = [
    { key: "chir", name: "Midges", latin: "Chironomidae", group: "fly" },
    { key: "olig", name: "Aquatic worms", latin: "Oligochaeta", group: "worm" },
    { key: "baet", name: "Small minnow mayflies", latin: "Baetidae", group: "mayfly" },
    { key: "hept", name: "Flat-headed mayflies", latin: "Heptageniidae", group: "mayfly" },
    { key: "hydr", name: "Net-spinning caddisflies", latin: "Hydropsychidae", group: "caddisfly" },
    { key: "elmi", name: "Riffle beetles", latin: "Elmidae", group: "beetle" },
    { key: "simu", name: "Black flies", latin: "Simuliidae", group: "fly" },
    { key: "perl", name: "Stoneflies", latin: "Perlodidae", group: "stonefly" }
  ];

  // Mean count per kick-net sample, by family (order as FAMILIES). Page-chosen.
  var BUGS = {
    control:  [130, 26, 6, 1.5, 4, 2.5, 4, 0.4],
    restored: [95, 16, 11, 4, 8, 5, 6, 1.2]
  };

  // Per-sample factors: mean and spread. Page-chosen; directions follow the paper.
  // riparian height (m), canopy cover (%), median particle size (mm), velocity (m/s)
  var FACTORS = [
    { key: "diversity", name: "Macro-invertebrate diversity", unit: "H′", dp: 2, higher: "restored",
      paper: "Diversity increased at the restored site." },
    { key: "riparian", name: "Riparian height", unit: "m", dp: 2, higher: "restored",
      control: [0.60, 0.25], restored: [0.90, 0.35], min: 0.02,
      paper: "Riparian height increased at the restored site." },
    { key: "canopy", name: "Canopy cover", unit: "%", dp: 0, higher: "restored",
      control: [14, 9], restored: [24, 12], min: 0, max: 100,
      paper: "Canopy cover increased at the restored site." },
    { key: "particle", name: "Benthic particle size", unit: "mm", dp: 0, higher: "control",
      control: [82, 28], restored: [60, 22], min: 2,
      paper: "Larger rocks at the control site; smaller particles had washed down to the restored site." },
    { key: "velocity", name: "River velocity", unit: "m/s", dp: 2, higher: "restored",
      control: [0.40, 0.07], restored: [0.52, 0.16], min: 0.02,
      paper: "Shallower water with higher and more varied velocities at the restored site." }
  ];

  function factorByKey(k) { return FACTORS.filter(function (f) { return f.key === k; })[0]; }

  /* ------------------------------------------------------------ statistics */

  function shannon(counts) {
    var n = 0, h = 0, i;
    for (i = 0; i < counts.length; i++) n += counts[i];
    if (n === 0) return 0;
    for (i = 0; i < counts.length; i++) if (counts[i] > 0) { var p = counts[i] / n; h -= p * Math.log(p); }
    return h;
  }

  function richness(counts) { return counts.filter(function (c) { return c > 0; }).length; }

  function mean(a) { var s = 0; for (var i = 0; i < a.length; i++) s += a[i]; return a.length ? s / a.length : NaN; }
  function variance(a) {
    if (a.length < 2) return NaN;
    var m = mean(a), s = 0;
    for (var i = 0; i < a.length; i++) s += (a[i] - m) * (a[i] - m);
    return s / (a.length - 1);
  }
  function sd(a) { return Math.sqrt(variance(a)); }

  function lgamma(x) {
    var g = 7, c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313,
      -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
    if (x < 0.5) return Math.log(Math.PI / Math.abs(Math.sin(Math.PI * x))) - lgamma(1 - x);
    x -= 1;
    var a = c[0], t = x + g + 0.5;
    for (var i = 1; i < g + 2; i++) a += c[i] / (x + i);
    return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
  }

  // Continued fraction for the incomplete beta (Lentz), as in Numerical Recipes.
  function betacf(a, b, x) {
    var MAXIT = 300, EPS = 1e-15, FPMIN = 1e-300;
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
      var del = d * c;
      h *= del;
      if (Math.abs(del - 1) < EPS) break;
    }
    return h;
  }

  function betainc(a, b, x) {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    var bt = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x));
    if (x < (a + 1) / (a + b + 2)) return bt * betacf(a, b, x) / a;
    return 1 - bt * betacf(b, a, 1 - x) / b;
  }

  // Two-sided p for Student's t with df degrees of freedom.
  function tTwoSided(t, df) {
    if (!isFinite(t)) return 0;
    return betainc(df / 2, 0.5, df / (df + t * t));
  }

  // Welch's unequal-variance t-test (restored minus control).
  function welch(a, b) {
    var na = a.length, nb = b.length;
    if (na < 2 || nb < 2) return null;
    var va = variance(a) / na, vb = variance(b) / nb, se = Math.sqrt(va + vb);
    var diff = mean(a) - mean(b);
    if (se === 0) return { diff: diff, t: diff === 0 ? 0 : Infinity, df: na + nb - 2, p: diff === 0 ? 1 : 0 };
    var df = (va + vb) * (va + vb) / (va * va / (na - 1) + vb * vb / (nb - 1));
    var t = diff / se;
    return { diff: diff, t: t, df: df, p: tTwoSided(t, df) };
  }

  /* ------------------------------------------------------------ a field day */

  /*
    opts.effect: true (reaches differ as above) or false (restoration did nothing:
                 both reaches drawn from the control parameters).
    opts.reachSD: reach-to-reach spread as a fraction of each factor's mean
                 (0 = the two reaches differ only by restoration). Applied once
                 per reach per field day, the way any two real reaches differ.
  */
  function fieldDay(n, seed, opts) {
    opts = opts || {};
    var effect = opts.effect !== false, reachSD = opts.reachSD || 0;
    var r = rng(seed);
    var out = { n: n, seed: seed, effect: effect, reachSD: reachSD, sites: {} };
    ["control", "restored"].forEach(function (site) {
      var src = effect ? site : "control";
      var reachShift = {};
      FACTORS.forEach(function (f) { reachShift[f.key] = 1 + reachSD * normal(r); });
      var bugMeans = BUGS[src].map(function (m) { return m * Math.max(0.05, 1 + reachSD * normal(r)); });
      var s = { samples: [] };
      for (var i = 0; i < n; i++) {
        var row = { counts: bugMeans.map(function (m) { return negbin(r, m, 2.5); }) };
        row.diversity = shannon(row.counts);
        row.richness = richness(row.counts);
        row.total = row.counts.reduce(function (x, y) { return x + y; }, 0);
        FACTORS.forEach(function (f) {
          if (f.key === "diversity") return;
          var p = f[src], v = (p[0] + p[1] * normal(r)) * Math.max(0.05, reachShift[f.key]);
          if (f.min !== undefined) v = Math.max(f.min, v);
          if (f.max !== undefined) v = Math.min(f.max, v);
          row[f.key] = v;
        });
        s.samples.push(row);
      }
      out.sites[site] = s;
    });
    out.tests = {};
    FACTORS.forEach(function (f) {
      var a = out.sites.restored.samples.map(function (x) { return x[f.key]; });
      var b = out.sites.control.samples.map(function (x) { return x[f.key]; });
      var w = welch(a, b);
      out.tests[f.key] = {
        restored: { mean: mean(a), sd: sd(a), values: a },
        control: { mean: mean(b), sd: sd(b), values: b },
        welch: w,
        varRatio: variance(a) / variance(b),
        direction: mean(a) > mean(b) ? "restored" : "control"
      };
    });
    return out;
  }

  // Repeat many field days; share of days on which each factor's Welch p < alpha.
  function repeatDays(days, n, seed, opts, alpha) {
    alpha = alpha || 0.05;
    var hits = {}, any = 0;
    FACTORS.forEach(function (f) { hits[f.key] = 0; });
    for (var d = 0; d < days; d++) {
      var day = fieldDay(n, (seed + d * 7919) >>> 0, opts), anyHit = false;
      FACTORS.forEach(function (f) {
        var w = day.tests[f.key].welch;
        if (w && w.p < alpha) { hits[f.key]++; anyHit = true; }
      });
      if (anyHit) any++;
    }
    var share = {};
    FACTORS.forEach(function (f) { share[f.key] = hits[f.key] / days; });
    return { days: days, n: n, share: share, anyShare: any / days };
  }

  var api = {
    FAMILIES: FAMILIES, FACTORS: FACTORS, BUGS: BUGS, factorByKey: factorByKey,
    rng: rng, normal: normal, gamma: gamma, poisson: poisson, negbin: negbin,
    shannon: shannon, richness: richness, mean: mean, variance: variance, sd: sd,
    lgamma: lgamma, betainc: betainc, tTwoSided: tTwoSided, welch: welch,
    fieldDay: fieldDay, repeatDays: repeatDays
  };
  root.RiverEngine = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof self !== "undefined" ? self : this);

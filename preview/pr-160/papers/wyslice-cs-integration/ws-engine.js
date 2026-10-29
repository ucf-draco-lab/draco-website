/*
  WySLICE page engine for /papers/wyslice-cs-integration/.
  Plain functions, no DOM. Loads as a page script, in a Web Worker, or in Node.

  - modelRun: the "coding as modeling" demo (start value, repeat, change rule).
  - shareCounts: which whole counts out of n print as a given whole percent.
  - wilson: 95% Wilson score interval for a proportion.
  - mcnemarExact: exact two-sided McNemar test (binomial on discordant pairs).
  - tQuantile: Student t quantile (for the paired t-test threshold).
  - scaleRange: summed Likert scale bounds.
  Checked against SciPy and statsmodels by the PR's verification script.
*/
(function (root) {
  "use strict";

  /* ------------------------------------------------------------ data from the two papers */

  var DATA = {
    pd2020: {
      dates: "July 6 to 10, 2020",
      participants: 24, librarians: 7, teachers: 17,
      pairedSurveys: 21, missingPost: 3,
      focusInterested: 17, focusSelected: 8, focusAttended: 6,
      lessonPlans: 49, implementationPlans: 30,
      days: [
        "What is computer science?",
        "What are computer science and the WyCS Standards?",
        "What are computer science, standards, and integrated approaches?",
        "Deep dive with activities",
        "Review and project: lesson plan, activity, and outreach demonstration"
      ],
      knowledge: { n: 21, pre: 17, post: 20, prePct: 81, postPct: 95, wrongPreAllCorrected: true },
      stebi: { items: 25, points: 5, pste: { items: 13, alpha: 0.91 }, stoe: { items: 12, alpha: 0.77 } }
    },
    program2024: {
      cohorts: [20, 40, 80],
      reachedOver: 150,
      educatorsOver: 190,
      activitiesOver: 300,
      studentsNearly: 8000,
      instructionDaysOver: 600,
      wystack: { teachers: 36, perYear: 12, years: 3, knowledgePct: 89, perceptionUp: 5, perceptionItems: 7,
        ratings: { training: 3.8, faculty: 3.2, gradAssistants: 3.1, scale: 4 } }
    }
  };

  /* ------------------------------------------------------------ demo 1: coding as modeling */

  // A three-block program: start at `start`, repeat `steps` times, apply `rule` with `amount`.
  // rule "add": x + amount; rule "times": x * (1 + amount / 100) (percent growth).
  function modelRun(start, steps, rule, amount) {
    var xs = [start];
    var x = start;
    for (var i = 0; i < steps; i++) {
      x = rule === "times" ? x * (1 + amount / 100) : x + amount;
      xs.push(x);
    }
    return xs;
  }

  /* ------------------------------------------------------------ shares and counts */

  // Whole counts k (0..n) whose share rounds half-up to `pct` (a whole percent).
  function shareCounts(pct, n) {
    var out = [];
    for (var k = 0; k <= n; k++) {
      if (Math.floor(100 * k / n + 0.5 + 1e-9) === pct) out.push(k);
    }
    return out;
  }

  /* ------------------------------------------------------------ Wilson interval */

  var Z95 = 1.959963984540054;

  function wilson(k, n, z) {
    z = z || Z95;
    if (n === 0) return [0, 1];
    var p = k / n, z2 = z * z;
    var den = 1 + z2 / n;
    var center = (p + z2 / (2 * n)) / den;
    var half = (z / den) * Math.sqrt(p * (1 - p) / n + z2 / (4 * n * n));
    return [Math.max(0, center - half), Math.min(1, center + half)];
  }

  /* ------------------------------------------------------------ exact McNemar */

  function choose(n, k) {
    if (k < 0 || k > n) return 0;
    k = Math.min(k, n - k);
    var c = 1;
    for (var i = 1; i <= k; i++) c = c * (n - k + i) / i;
    return c;
  }

  // b = discordant pairs one way (wrong -> right), c = the other way (right -> wrong).
  // Two-sided exact p = min(1, 2 * P(X <= min(b, c))) with X ~ Binomial(b + c, 1/2).
  function mcnemarExact(b, c) {
    var m = b + c;
    if (m === 0) return 1;
    var lo = Math.min(b, c), s = 0;
    for (var i = 0; i <= lo; i++) s += choose(m, i);
    return Math.min(1, 2 * s / Math.pow(2, m));
  }

  /* ------------------------------------------------------------ Student t quantile */

  function logGamma(x) {
    var g = [676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059,
      12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
    if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - logGamma(1 - x);
    x -= 1;
    var a = 0.99999999999980993, t = x + 7.5;
    for (var i = 0; i < 8; i++) a += g[i] / (x + i + 1);
    return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
  }

  // Regularized incomplete beta I_x(a, b) by Lentz's continued fraction.
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

  function ibeta(x, a, b) {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    var bt = Math.exp(logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log(1 - x));
    if (x < (a + 1) / (a + b + 2)) return bt * betacf(a, b, x) / a;
    return 1 - bt * betacf(b, a, 1 - x) / b;
  }

  function tCdf(t, df) {
    var x = df / (df + t * t);
    var tail = 0.5 * ibeta(x, df / 2, 0.5);
    return t >= 0 ? 1 - tail : tail;
  }

  // Quantile by bisection on the CDF (monotone; 200 halvings is far beyond double precision).
  function tQuantile(p, df) {
    var lo = -1000, hi = 1000;
    for (var i = 0; i < 200; i++) {
      var mid = (lo + hi) / 2;
      if (tCdf(mid, df) < p) lo = mid; else hi = mid;
    }
    return (lo + hi) / 2;
  }

  // Smallest mean paired change that a two-sided paired t-test at level alpha flags,
  // for n pairs whose differences have standard deviation sd.
  function smallestDetected(n, sd, alpha) {
    var tc = tQuantile(1 - (alpha || 0.05) / 2, n - 1);
    return { tcrit: tc, change: tc * sd / Math.sqrt(n) };
  }

  /* ------------------------------------------------------------ summed Likert scale */

  function scaleRange(items, points) {
    return { min: items, max: items * points, mid: items * (points + 1) / 2 };
  }

  var api = {
    DATA: DATA,
    modelRun: modelRun,
    shareCounts: shareCounts,
    wilson: wilson,
    mcnemarExact: mcnemarExact,
    choose: choose,
    tCdf: tCdf,
    tQuantile: tQuantile,
    smallestDetected: smallestDetected,
    scaleRange: scaleRange
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.WySliceEngine = api;
})(typeof self !== "undefined" ? self : this);

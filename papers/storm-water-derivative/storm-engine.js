/*
  Storm water derivative engine for /papers/storm-water-derivative/.

  Hunt, Lamendella, Garrison, Burrows (Borowczak), Borowczak, and Kukreti,
  "Go With The Flow: Describing Storm Water Runoff Rates Using The Derivative,"
  ASEE Annual Conference & Exposition, 2010. DOI 10.18260/1-2--16900.

  Four pieces, all plain arithmetic:
    1. tray(...)        A simulated rainstorm on one of the lesson's three trays.
                        The paper prints no runoff readings, so the tray is a
                        page model (a two-store linear reservoir cascade, the
                        textbook Nash unit hydrograph with n = 2) whose three
                        parameter sets are the page's choices, labeled simulated.
    2. slopes, polyfit, polyDeriv
                        What the students did in Excel: slopes between readings,
                        a polynomial trendline (order 2 to 6, Excel's range), and
                        the derivative of that polynomial.
    3. recoverCount     The smallest number of lessons that reproduces every
                        percentage in the paper's lesson-component table.
    4. tTest2, studentT Student's unpaired two-sample t-test (pooled variance)
                        and the t distribution, for the page's analysis of the
                        printed p bounds (graduate and researcher levels only).

  Loads as a page script or in a Web Worker.
*/
(function (root) {
  "use strict";

  /* ------------------------------------------------------------- data */

  var DATA = {
    pourMl: 500,                 // paper: 500 ml from a watering can per storm
    trayIn: [11, 14, 3],         // paper: 11 x 14 x 3 inch cooking trays
    holeIn: 0.125,               // paper: 1/8 inch hole, bottom center
    // Page model parameters (not from the paper). retain: share of the pour the
    // surface holds back during the measurement; k: time constant (s) of each
    // of the two stores. Urban is impermeable, rural is grass, moss, and hay.
    sheds: [
      { id: "urban",    label: "Urban",    surface: "Blacktop, shingles, and model buildings", retain: 0.06, k: 7 },
      { id: "suburban", label: "Suburban", surface: "Grass beside shingles and a house",         retain: 0.22, k: 16 },
      { id: "rural",    label: "Rural",    surface: "Grass, moss, and hay with a toy barn",     retain: 0.42, k: 34 }
    ],
    // Paper, Figure 1 (a table): share of Project STEP lessons that addressed
    // (a) or partially addressed (p) each component.
    components: [
      { name: "Science", a: 78.13, p: 3.13 },
      { name: "Technology", a: 65.63, p: 25.00 },
      { name: "Engineering", a: 62.50, p: 34.38 },
      { name: "Math", a: 59.38, p: 21.88 },
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
    ],
    // Paper, Impact on Student Achievement and Figure 5. The text gives the two
    // pairs in the order of the bells; the page reads the first pair as Bell 2.
    scores: [
      { bell: "Bell 2", pre: 27, post: 64, pBound: 7e-7 },
      { bell: "Bell 5", pre: 38, post: 59, pBound: 0.03 }
    ],
    // Paper, Table 1: the assessment item with the largest gain. No key is printed.
    matchPros: ["Chemical Engineer", "Environmental Engineer", "Civil Engineer", "Electrical Engineer"],
    matchUses: [
      "describe how fast a reactor can make a new petroleum product",
      "describe how efficiently a GPS works",
      "describe how a fluid moves inside a reactor",
      "describe the concentration of chlorine in water distribution pipes",
      "describe the strength of materials"
    ]
  };

  /* ------------------------------------------------- 1. the tray model */

  // Cumulative outflow (ml) at times t (s) for a pour of V ml lasting T s into a
  // cascade of two linear stores with time constant k, after a share `retain`
  // is held back. Closed form: the input is a rectangular pulse, so the outflow
  // is the difference of two ramp responses of the gamma(2, k) unit hydrograph.
  function rampResponse(t, k) {
    // integral over [0, t] of the cumulative unit-hydrograph S-curve
    if (t <= 0) return 0;
    var x = t / k;
    // S(t) = 1 - e^-x (1 + x); integral of S from 0 to t = t - k(2 - e^-x (2 + x))
    return t - k * (2 - Math.exp(-x) * (2 + x));
  }
  function cumulative(t, shed, V, T) {
    var rate = V * (1 - shed.retain) / T;  // ml per second entering the stores
    return rate * (rampResponse(t, shed.k) - rampResponse(t - T, shed.k));
  }
  function rateAt(t, shed, V, T) {
    // derivative of cumulative: rate * (S(t) - S(t - T))
    function S(u) { if (u <= 0) return 0; var x = u / shed.k; return 1 - Math.exp(-x) * (1 + x); }
    return V * (1 - shed.retain) / T * (S(t) - S(t - T));
  }
  // Exact peak of the outflow rate: S(t) - S(t-T) peaks where the unit
  // hydrograph values match, u(t) = u(t-T), with u(s) = s e^{-s/k} / k^2.
  function peakRate(shed, V, T) {
    var lo = T, hi = T + 20 * shed.k;
    function g(t) { return t * Math.exp(-t / shed.k) - (t - T) * Math.exp(-(t - T) / shed.k); }
    for (var i = 0; i < 200; i++) { var mid = (lo + hi) / 2; if (g(mid) > 0) lo = mid; else hi = mid; }
    // g(T) = T e^{-T/k} > 0 and g decreases to the root
    var t = (lo + hi) / 2;
    return { t: t, rate: rateAt(t, shed, V, T) };
  }

  // Small deterministic generator (mulberry32) for reading error.
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

  // Readings a group would record: every `step` seconds to `end`, rounded to the
  // cylinder's resolution `res` ml, with uniform reading error of +/- err ml,
  // never decreasing (water in a cylinder cannot leave it).
  function readings(shed, opt) {
    var V = opt.V || DATA.pourMl, T = opt.T || 30, step = opt.step || 10, end = opt.end || 180;
    var res = opt.res || 5, err = opt.err || 0, r = rng(opt.seed || 1);
    var out = [], last = 0;
    for (var t = 0; t <= end + 1e-9; t += step) {
      var v = cumulative(t, shed, V, T);
      if (err > 0) v += (r() * 2 - 1) * err;
      v = Math.max(last, Math.max(0, Math.round(v / res) * res));
      out.push({ t: t, v: v });
      last = v;
    }
    return out;
  }

  /* ---------------------------------------- 2. what the students computed */

  // Slopes between consecutive readings, plotted at the interval midpoint.
  function slopes(pts) {
    var out = [];
    for (var i = 1; i < pts.length; i++) {
      var dt = pts[i].t - pts[i - 1].t;
      out.push({ t: (pts[i].t + pts[i - 1].t) / 2, slope: (pts[i].v - pts[i - 1].v) / dt, t0: pts[i - 1].t, t1: pts[i].t });
    }
    return out;
  }

  // Least-squares polynomial (Excel's polynomial trendline): coefficients c[0..n]
  // of v = c0 + c1 t + ... + cn t^n. Solved by Householder QR on t scaled to
  // [-1, 1], then expanded back to powers of t.
  function polyfit(xs, ys, n) {
    var m = xs.length, i, j, k;
    var xmin = Math.min.apply(null, xs), xmax = Math.max.apply(null, xs);
    var mid = (xmin + xmax) / 2, half = (xmax - xmin) / 2 || 1;
    var A = [], b = ys.slice();
    for (i = 0; i < m; i++) {
      var s = (xs[i] - mid) / half, row = [], p = 1;
      for (j = 0; j <= n; j++) { row.push(p); p *= s; }
      A.push(row);
    }
    var cols = n + 1;
    for (k = 0; k < cols; k++) {
      var norm = 0;
      for (i = k; i < m; i++) norm += A[i][k] * A[i][k];
      norm = Math.sqrt(norm);
      if (norm === 0) continue;
      var alpha = A[k][k] > 0 ? -norm : norm;
      var vvec = [];
      for (i = 0; i < m; i++) vvec.push(i < k ? 0 : A[i][k]);
      vvec[k] -= alpha;
      var vn = 0;
      for (i = k; i < m; i++) vn += vvec[i] * vvec[i];
      if (vn === 0) continue;
      for (j = k; j < cols; j++) {
        var d = 0;
        for (i = k; i < m; i++) d += vvec[i] * A[i][j];
        d = 2 * d / vn;
        for (i = k; i < m; i++) A[i][j] -= d * vvec[i];
      }
      var db = 0;
      for (i = k; i < m; i++) db += vvec[i] * b[i];
      db = 2 * db / vn;
      for (i = k; i < m; i++) b[i] -= db * vvec[i];
    }
    var cs = new Array(cols);
    for (k = cols - 1; k >= 0; k--) {
      var acc = b[k];
      for (j = k + 1; j < cols; j++) acc -= A[k][j] * cs[j];
      cs[k] = acc / A[k][k];
    }
    // expand sum cs[j] ((t - mid)/half)^j into powers of t
    var c = new Array(cols).fill(0);
    for (j = 0; j < cols; j++) {
      var scale = cs[j] / Math.pow(half, j);
      for (var q = 0; q <= j; q++) c[q] += scale * binom(j, q) * Math.pow(-mid, j - q);
    }
    return c;
  }
  function binom(n, k) { var r = 1; for (var i = 1; i <= k; i++) r = r * (n - k + i) / i; return r; }
  function polyval(c, x) { var y = 0; for (var j = c.length - 1; j >= 0; j--) y = y * x + c[j]; return y; }
  function polyDeriv(c) { var d = []; for (var j = 1; j < c.length; j++) d.push(j * c[j]); return d.length ? d : [0]; }
  function rSquared(xs, ys, c) {
    var mean = ys.reduce(function (a, b) { return a + b; }, 0) / ys.length, ssr = 0, sst = 0;
    for (var i = 0; i < xs.length; i++) { var e = ys[i] - polyval(c, xs[i]); ssr += e * e; sst += (ys[i] - mean) * (ys[i] - mean); }
    return sst === 0 ? 1 : 1 - ssr / sst;
  }
  // Largest value of the derivative polynomial on [a, b], sampled finely.
  function maxOn(c, a, b) {
    var best = { x: a, y: -Infinity };
    for (var i = 0; i <= 2000; i++) { var x = a + (b - a) * i / 2000, y = polyval(c, x); if (y > best.y) best = { x: x, y: y }; }
    return best;
  }

  /* -------------------------------- 3. how many lessons behind the table */

  // Smallest n (and every n up to nMax) for which every percentage equals
  // 100 k / n rounded to two decimals for some whole k.
  function recoverCount(values, nMax) {
    var fits = [];
    for (var n = 1; n <= (nMax || 200); n++) {
      var counts = [], ok = true;
      for (var i = 0; i < values.length; i++) {
        var k = Math.round(values[i] * n / 100);
        if (Math.abs(Math.round(10000 * k / n) / 100 - values[i]) > 1e-9) { ok = false; break; }
        counts.push(k);
      }
      if (ok) fits.push({ n: n, counts: counts });
    }
    return fits;
  }

  /* ---------------------------------------------- 4. Student's t-test */

  function lgamma(x) {
    var g = [676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059,
      12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
    if (x < 0.5) return Math.log(Math.PI / Math.abs(Math.sin(Math.PI * x))) - lgamma(1 - x);
    x -= 1;
    var a = 0.99999999999980993, t = x + 7.5;
    for (var i = 0; i < 8; i++) a += g[i] / (x + i + 1);
    return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
  }
  // Regularized incomplete beta I_x(a, b), continued fraction (Lentz).
  function betai(x, a, b) {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    var bt = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x));
    if (x < (a + 1) / (a + b + 2)) return bt * betacf(x, a, b) / a;
    return 1 - bt * betacf(1 - x, b, a) / b;
  }
  function betacf(x, a, b) {
    var TINY = 1e-300, qab = a + b, qap = a + 1, qam = a - 1, c = 1, d = 1 - qab * x / qap;
    if (Math.abs(d) < TINY) d = TINY;
    d = 1 / d;
    var h = d;
    for (var m = 1; m <= 500; m++) {
      var m2 = 2 * m, aa = m * (b - m) * x / ((qam + m2) * (a + m2));
      d = 1 + aa * d; if (Math.abs(d) < TINY) d = TINY;
      c = 1 + aa / c; if (Math.abs(c) < TINY) c = TINY;
      d = 1 / d; h *= d * c;
      aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
      d = 1 + aa * d; if (Math.abs(d) < TINY) d = TINY;
      c = 1 + aa / c; if (Math.abs(c) < TINY) c = TINY;
      d = 1 / d;
      var del = d * c;
      h *= del;
      if (Math.abs(del - 1) < 1e-15) break;
    }
    return h;
  }
  // Two-sided p for Student's t with df degrees of freedom.
  function studentT(t, df) { return betai(df / (df + t * t), df / 2, 0.5); }
  // Unpaired two-sample t-test with pooled variance (equal n and SD per group by default).
  function tTest2(m1, s1, n1, m2, s2, n2) {
    var df = n1 + n2 - 2;
    var sp2 = ((n1 - 1) * s1 * s1 + (n2 - 1) * s2 * s2) / df;
    var t = (m2 - m1) / Math.sqrt(sp2 * (1 / n1 + 1 / n2));
    return { t: t, df: df, p: studentT(Math.abs(t), df) };
  }
  // Largest common SD (percentage points) for which n students per test give
  // p below the bound, for a gain of `diff` points. Bisection on s.
  function maxSD(diff, n, bound) {
    var lo = 0.01, hi = 200;
    if (tTest2(0, hi, n, diff, hi, n).p < bound) return hi;
    if (tTest2(0, lo, n, diff, lo, n).p >= bound) return 0;
    for (var i = 0; i < 100; i++) {
      var mid = (lo + hi) / 2;
      if (tTest2(0, mid, n, diff, mid, n).p < bound) lo = mid; else hi = mid;
    }
    return lo;
  }
  // Largest sample SD a list of n scores on [0, 100] can have.
  function sdCeiling(n) {
    var h = Math.floor(n / 2), m = (n - h) * 100 / n, ss = h * m * m + (n - h) * (100 - m) * (100 - m);
    return Math.sqrt(ss / (n - 1));
  }

  root.StormEngine = {
    DATA: DATA,
    cumulative: cumulative, rateAt: rateAt, peakRate: peakRate, readings: readings,
    slopes: slopes, polyfit: polyfit, polyval: polyval, polyDeriv: polyDeriv, rSquared: rSquared, maxOn: maxOn,
    recoverCount: recoverCount,
    betai: betai, studentT: studentT, tTest2: tTest2, maxSD: maxSD, sdCeiling: sdCeiling
  };
  if (typeof module !== "undefined" && module.exports) module.exports = root.StormEngine;
})(typeof self !== "undefined" ? self : this);

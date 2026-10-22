/*
  Study engine for /papers/youdemo-video-assessment/.

  Borowczak and Burrows (CITE Journal 16(2), 2016) built YouDemo, a free web
  tool that lets viewers rate a YouTube video continuously, on two metrics the
  video's creator chooses, while it plays. They report a two-year sub-study of
  27 preservice science teachers inside a five-year trial (76 participants,
  three universities), with self, peer, and continuous assessments of the
  teachers' own videos.

  The paper reports summary numbers only (no data tables beyond Tables 1 and
  2, and its Figures 7 to 9 were interactive Plotly charts). Everything here is
  arithmetic on those printed numbers, plus checks the paper does not report
  (the denominator behind Table 2, the crossing point of the Figure 7 fit, the
  bounds Figure 8's counts allow, and a Wilson interval), which the page labels
  as its own. The continuous-rating demo uses simulated raters, labeled as such.
  Loads as a page script or in Node.
*/
(function (root) {
  "use strict";

  /* ------------------------------------------------------------ the paper's numbers */

  var STUDY = {
    years: 5, universities: 3, participants: 76,       // Methods
    subYears: 2, subN: 27,                               // Figure 8 subset
    assessments: 900, videos: 170, users: 131,           // "over" each, to date
    peersPerVideo: 2,                                    // written peer assessments
    videoMin: 2, videoMax: 10,                           // minutes
    validityR: 0.71, prePostR: 0.61, omega: 0.96, alpha: 0.89
  };

  // Table 1: Likert value to qualitative text, as printed (ranges overlap at 3).
  var TABLE1 = [
    { lo: 0, hi: 1, text: "Non-Existent" },
    { lo: 2, hi: 3, text: "Lacking" },
    { lo: 3, hi: 6, text: "Average" },
    { lo: 7, hi: 8, text: "Good" },
    { lo: 9, hi: 10, text: "Excellent" }
  ];

  // Table 2: top 20% of coded answers to "How did the tool affect your viewing?"
  var TABLE2 = [
    { concept: "Allowed rating/accessibility", count: 37, pct: 62 },
    { concept: "Easier to rate video", count: 22, pct: 37 },
    { concept: "Forced critical thinking", count: 19, pct: 32 },
    { concept: "Increased engagement", count: 13, pct: 22 }
  ];

  // Figure 7: printed fit of Metric 2 (Y) on Metric 1 (X).
  var FIT = { slope: 0.78, intercept: 1.25 };

  // Figure 8: 27 matched pre/post/peer sets.
  var FIG8 = { n: 27, noShift: 14, lowerFraction: 0.25, highPeerLowered: 1 };

  /* ------------------------------------------------------------ Table 1 lookup */

  // Every Table 1 label whose printed range contains value v (v on 0..10).
  function labelsFor(v) {
    var r = Math.round(v * 100) / 100;
    var out = [];
    TABLE1.forEach(function (row) {
      // integer bins as printed; a non-integer between bins belongs to the nearer integer
      var k = Math.round(r);
      if (k >= row.lo && k <= row.hi) out.push(row.text);
    });
    return out;
  }

  /* ------------------------------------------------------------ Table 2 denominator */

  function roundHalfUp(x) { return Math.floor(x + 0.5 + 1e-9); }

  // All denominators N in [lo, hi] for which every printed percentage equals
  // round(100 * count / N). Rounding is half-up, as a reader would round.
  function table2Bases(lo, hi) {
    var out = [];
    for (var n = lo; n <= hi; n++) {
      var ok = TABLE2.every(function (row) { return roundHalfUp(100 * row.count / n) === row.pct; });
      if (ok) out.push(n);
    }
    return out;
  }

  function sharesFor(n) {
    return TABLE2.map(function (row) { return 100 * row.count / n; });
  }

  /* ------------------------------------------------------------ Figure 7 */

  function printedFit(x) { return FIT.slope * x + FIT.intercept; }
  // The same equation read the other way round: X = 0.78 Y + 1.25, solved for Y.
  function inverseFit(x) { return (x - FIT.intercept) / FIT.slope; }
  // Where each line meets Y = X (the same point for both).
  function crossing() { return FIT.intercept / (1 - FIT.slope); }

  /* ------------------------------------------------------------ Figure 8 */

  // Counts consistent with the text: 14 of 27 unchanged, "less than a quarter"
  // lower (strictly fewer than 27/4 = 6.75, so at most six), the rest higher.
  function fig8Bounds() {
    var maxLower = Math.ceil(FIG8.n * FIG8.lowerFraction) - 1;
    if (maxLower >= FIG8.n * FIG8.lowerFraction) maxLower -= 1;
    var moved = FIG8.n - FIG8.noShift;
    return {
      n: FIG8.n, noShift: FIG8.noShift, moved: moved,
      lowerMin: FIG8.highPeerLowered, lowerMax: maxLower,
      higherMin: moved - maxLower, higherMax: moved - FIG8.highPeerLowered
    };
  }

  /* ------------------------------------------------------------ Wilson interval */

  function wilson(k, n, z) {
    z = z || 1.959963984540054;
    var p = k / n, z2 = z * z, d = 1 + z2 / n;
    var c = (p + z2 / (2 * n)) / d;
    var h = (z / d) * Math.sqrt(p * (1 - p) / n + z2 / (4 * n * n));
    return [Math.max(0, c - h), Math.min(1, c + h)];
  }

  /* ------------------------------------------------------------ continuous rating */

  // A rating trace is a list of [t, value] presses, starting at t = 0.
  // valueAt holds the last value (sample and hold), as a slider would.
  function valueAt(trace, t) {
    var v = trace.length ? trace[0][1] : 5;
    for (var i = 0; i < trace.length; i++) {
      if (trace[i][0] <= t) v = trace[i][1]; else break;
    }
    return v;
  }

  // Resample a trace once per step seconds over [0, duration].
  function resample(trace, duration, step) {
    var out = [];
    for (var t = 0; t <= duration + 1e-9; t += step) out.push(valueAt(trace, t));
    return out;
  }

  // Average several traces second by second: the creator's aggregate view.
  function aggregate(traces, duration, step) {
    var cols = traces.map(function (tr) { return resample(tr, duration, step); });
    var n = cols.length;
    return cols[0].map(function (_, i) {
      var s = 0;
      for (var j = 0; j < n; j++) s += cols[j][i];
      return s / n;
    });
  }

  function mean(a) { var s = 0; a.forEach(function (x) { s += x; }); return s / a.length; }

  // Time-weighted mean of one trace over [0, duration].
  function traceMean(trace, duration) {
    if (!trace.length) return 5;
    var s = 0;
    for (var i = 0; i < trace.length; i++) {
      var t0 = trace[i][0], t1 = i + 1 < trace.length ? trace[i + 1][0] : duration;
      s += trace[i][1] * Math.max(0, Math.min(t1, duration) - t0);
    }
    return s / duration;
  }

  /* ------------------------------------------------------------ simulated raters */

  // Mulberry32: small seeded generator so every visitor sees the same panel.
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

  function clamp(v) { return Math.max(0, Math.min(10, v)); }

  // scenes: [{start, end, m1, m2}] with "true" quality per metric on 0..10.
  // Each simulated rater starts at 5, reacts with a lag after each scene
  // change (presses cluster at scene changes, as the paper observed), moves
  // one step per press toward a personal reading of the scene, and presses
  // "increase" more readily than "decrease".
  function simulateRater(scenes, seed, metric) {
    var r = rng(seed);
    var bias = (r() - 0.5) * 2.4;          // personal leniency, about ±1.2
    var lag = 0.6 + r() * 1.6;             // seconds to react
    var v = 5, trace = [[0, 5]];
    scenes.forEach(function (sc) {
      var target = clamp(Math.round(sc[metric] + bias + (r() - 0.5) * 1.6));
      var t = sc.start + lag;
      while (v !== target && t < sc.end) {
        var up = target > v;
        if (!up && r() < 0.25) { t += 0.9; continue; }   // hesitate before marking down
        v += up ? 1 : -1;
        trace.push([Math.round(t * 10) / 10, v]);
        t += 0.25 + r() * 0.45;
      }
    });
    return trace;
  }

  function simulatePanel(scenes, n, seed) {
    var panel = [];
    for (var i = 0; i < n; i++) {
      panel.push({
        m1: simulateRater(scenes, seed + 101 * i + 1, "m1"),
        m2: simulateRater(scenes, seed + 101 * i + 7, "m2")
      });
    }
    return panel;
  }

  // Least-squares line y = a x + b.
  function ols(xs, ys) {
    var mx = mean(xs), my = mean(ys), sxy = 0, sxx = 0;
    for (var i = 0; i < xs.length; i++) { sxy += (xs[i] - mx) * (ys[i] - my); sxx += (xs[i] - mx) * (xs[i] - mx); }
    var a = sxy / sxx;
    return { slope: a, intercept: my - a * mx };
  }

  var api = {
    STUDY: STUDY, TABLE1: TABLE1, TABLE2: TABLE2, FIT: FIT, FIG8: FIG8,
    labelsFor: labelsFor, roundHalfUp: roundHalfUp, table2Bases: table2Bases, sharesFor: sharesFor,
    printedFit: printedFit, inverseFit: inverseFit, crossing: crossing,
    fig8Bounds: fig8Bounds, wilson: wilson,
    valueAt: valueAt, resample: resample, aggregate: aggregate, traceMean: traceMean, mean: mean,
    rng: rng, simulateRater: simulateRater, simulatePanel: simulatePanel, ols: ols
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.YouDemoEngine = api;
})(typeof self !== "undefined" ? self : this);

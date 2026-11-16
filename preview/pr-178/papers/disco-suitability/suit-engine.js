/*
  Suitability engine for /papers/disco-suitability/.
  Wolf, Foster, Haile, and Borowczak, "Data-Driven Suitability Analysis to
  Enable Machine Learning Explainability and Security," IEEE Resilience Week
  2021 (doi:10.1109/RWS52686.2021.9611792).

  Every number below is either printed in the paper (tables and figure
  labels) or computed here from printed numbers. @DisCo and its data are not
  public, so nothing here re-runs the model. Three things are reconstructed:
    1. Integer function counts behind Figure 3's percentages, constrained to
       Table II's function totals (175 and 10,981).
    2. The Figure 1 score curve, digitized from the figure's pixels
       (fig1-digitized.json); 831 points, as in the paper.
    3. One reading of the suitability score that reproduces both printed
       scores (97.12% and 2%) from those counts. The paper does not define
       the score formula or print the joint named-by-size counts; this
       reading is the page's, and is labeled so wherever it appears.
  Loads as a page script or in Node.
*/
(function (root) {
  "use strict";

  /* ------------------------------------------------------------ paper data */

  // Table II: node counts loaded by @DisCo.
  var TABLE2 = {
    libssh: { libraries: 8, functions: 10981, blocks: 66162, features: 66162 },
    trisis: { libraries: 1, functions: 175, blocks: 825, features: 825 }
  };

  // Figure 3 (top): percent of functions with 0, 1, 2, 3, 4, 5, and 6+ blocks.
  var FIG3_BLOCKS = {
    libssh: [7.98, 73.76, 0.97, 1.48, 0.4, 1.01, 14.39],
    trisis: [48, 17.14, 4.57, 1.71, 1.14, 2.86, 24.57]
  };
  var BLOCK_DECIMALS = { libssh: [2, 2, 2, 2, 1, 2, 2], trisis: [0, 2, 2, 2, 2, 2, 2] };
  // Figure 3 (bottom): percent named and anonymous (one decimal).
  var FIG3_NAMED = { libssh: [28.5, 71.5], trisis: [48.6, 51.4] };
  // Figure 4: suitable / unsuitable percent.
  var FIG4 = { libssh: [97.12, 2.88], trisis: [2, 98] };
  var FIG4_DECIMALS = { libssh: 2, trisis: 0 };

  // Figure 2 bar heights, read from the figure's pixels (approximate, about
  // 1% of each axis). Axes: 0 to 50, 0 to 250, 0 to 25,000.
  var FIG2_READ = {
    libssh: { perBlock: 5.0, perFunction: 30, perLibrary: 20900 },
    trisis: { perBlock: 40.7, perFunction: 192, perLibrary: 16700 }
  };

  // Figure 1 counts as printed (thresholds 0.95 and 0.85, 831 embeddings).
  var FIG1 = { n: 831, strong: 514, weak: 187, none: 130, strongAt: 0.95, weakAt: 0.85, above9999: 13 };

  // Figure 5: number of classes by minimum function copies.
  var FIG5 = {
    copies: [0, 7, 30, 439],
    meltdown: [7874, 850, 834, 1],
    libssh: [391, 151, 0, 0],
    trisis: [50, 0, 0, 0]
  };

  // Tables III and IV: loss, accuracy, macro F1, weighted F1 by split.
  var SPLITS = ["70/30", "80/20", "90/10"];
  var TABLE3 = {
    meltdown: null, // "Crashed Kernel"
    libssh: [[6.37, 0.7153, 0.56, 0.67], [9.27, 0.6427, 0.52, 0.58], [5.71, 0.7062, 0.59, 0.66]],
    trisis: [[43.80, 0, 0, 0], [45.23, 0, 0, 0], [54.61, 0, 0, 0]]
  };
  var TABLE4 = {
    meltdown: [[0.22, 0.9121, 0.88, 0.89], [0.21, 0.9085, 0.87, 0.89], [0.21, 0.9104, 0.89, 0.89]],
    libssh: [[0.67, 0.8785, 0.85, 0.85], [0.65, 0.8880, 0.86, 0.86], [1.12, 0.8417, 0.83, 0.84]],
    trisis: null // "Insufficient Data"
  };

  /* ------------------------------------------------------------ helpers */

  function roundTo(x, d) { var p = Math.pow(10, d); return Math.round(x * p) / p; }
  function pct(k, n) { return 100 * k / n; }
  function matches(k, n, printed, d) { return Math.abs(roundTo(pct(k, n), d) - printed) < 1e-9; }

  /* ------------------------------------------------- Figure 3 reconstruction */

  // All integer vectors (one count per block bin) whose percentages round to
  // the printed values and whose sum equals Table II's function total.
  function blockCountSolutions(ds) {
    var n = TABLE2[ds].functions, printed = FIG3_BLOCKS[ds], dec = BLOCK_DECIMALS[ds];
    var cands = printed.map(function (p, i) {
      var c = [], lo = Math.floor(n * (p - 1) / 100), hi = Math.ceil(n * (p + 1) / 100);
      for (var k = Math.max(0, lo); k <= hi; k++) if (matches(k, n, p, dec[i])) c.push(k);
      return c;
    });
    var out = [];
    (function walk(i, acc, sum) {
      if (i === cands.length) { if (sum === n) out.push(acc.slice()); return; }
      cands[i].forEach(function (k) { if (sum + k <= n) { acc.push(k); walk(i + 1, acc, sum + k); acc.pop(); } });
    })(0, [], 0);
    return out;
  }
  function namedCountSolutions(ds) {
    var n = TABLE2[ds].functions, p = FIG3_NAMED[ds], out = [];
    for (var k = 0; k <= n; k++) if (matches(k, n, p[0], 1) && matches(n - k, n, p[1], 1)) out.push(k);
    return out;
  }

  // The counts the page uses. TRISIS has one solution for each; Libssh has four
  // block vectors (they differ by one function between neighboring bins) and
  // eleven named counts. Every Libssh combination leads to the same 226 kept
  // anonymous functions under the page's reading (checked in check.mjs).
  var COUNTS = {};
  ["libssh", "trisis"].forEach(function (ds) {
    var b = blockCountSolutions(ds), nm = namedCountSolutions(ds);
    COUNTS[ds] = {
      total: TABLE2[ds].functions,
      blocks: b.length ? b[0] : null,
      blockSolutions: b.length,
      // closest to the printed percentage when one decimal allows several
      named: nm.length ? nm.reduce(function (a, k) { var t = TABLE2[ds].functions * FIG3_NAMED[ds][0] / 100; return Math.abs(k - t) < Math.abs(a - t) ? k : a; }) : null,
      namedSolutions: nm
    };
    COUNTS[ds].anonymous = COUNTS[ds].total - COUNTS[ds].named;
  });

  // Functions removed by a cutoff of `minBlocks` (paper: fewer than three).
  function removed(ds, minBlocks) {
    var b = COUNTS[ds].blocks, s = 0;
    for (var i = 0; i < Math.min(minBlocks, b.length); i++) s += b[i];
    return s;
  }

  // Feasible range of "named functions among the removed ones" given only the
  // marginal counts printed in Figure 3.
  function namedRemovedRange(ds, minBlocks) {
    var c = COUNTS[ds], r = removed(ds, minBlocks), kept = c.total - r;
    return { min: Math.max(0, r - c.anonymous, c.named - kept), max: Math.min(r, c.named), removed: r, kept: kept };
  }

  // Given a joint split (named functions removed), the four cells and the
  // paper's two-branch rule (Section IV-C):
  //   majority of named functions removed      -> ill-suited
  //   majority of anonymous functions removed  -> well-fit
  function joint(ds, minBlocks, namedRemoved) {
    var c = COUNTS[ds], r = removed(ds, minBlocks);
    var cells = {
      namedRemoved: namedRemoved,
      anonRemoved: r - namedRemoved,
      namedKept: c.named - namedRemoved,
      anonKept: c.anonymous - (r - namedRemoved)
    };
    var namedRemovedShare = cells.namedRemoved / c.named;
    var anonRemovedShare = cells.anonRemoved / c.anonymous;
    var verdict = namedRemovedShare > 0.5 && anonRemovedShare <= 0.5 ? "ill"
      : anonRemovedShare > 0.5 && namedRemovedShare <= 0.5 ? "well"
      : namedRemovedShare > 0.5 && anonRemovedShare > 0.5 ? "both" : "neither";
    return {
      cells: cells,
      namedRemovedShare: namedRemovedShare,
      anonRemovedShare: anonRemovedShare,
      namedKeptShare: 1 - namedRemovedShare,
      verdict: verdict,
      // Page's reading of the printed score: the share that decides the branch.
      // Well-fit: anonymous functions removed. Ill-suited: named functions kept.
      score: verdict === "well" ? anonRemovedShare : verdict === "ill" ? 1 - namedRemovedShare : null
    };
  }

  // The joint split that makes the page's reading reproduce the printed score.
  function impliedJoint(ds) {
    var c = COUNTS[ds], r = removed(ds, 3), out = [];
    var range = namedRemovedRange(ds, 3);
    for (var nr = range.min; nr <= range.max; nr++) {
      var j = joint(ds, 3, nr);
      if (j.score == null) continue;
      if (Math.abs(roundTo(100 * j.score, FIG4_DECIMALS[ds]) - FIG4[ds][0]) < 1e-9 &&
          Math.abs(roundTo(100 * (1 - j.score), FIG4_DECIMALS[ds]) - FIG4[ds][1]) < 1e-9) out.push(nr);
    }
    return out;
  }

  /* ------------------------------------------------------------ Figure 1 */

  var curve = null;
  function setCurve(arr) { curve = arr; }
  function curveCounts(strongAt, weakAt) {
    if (!curve) return null;
    var s = 0, w = 0, n = 0;
    for (var i = 0; i < curve.length; i++) {
      if (curve[i] > strongAt) s++; else if (curve[i] > weakAt) w++; else n++;
    }
    return { strong: s, weak: w, none: n, total: curve.length };
  }

  /* ------------------------------------------------------------ Figure 2 */

  function structure(ds) {
    var t = TABLE2[ds], f = FIG2_READ[ds];
    return {
      blocksPerFunction: t.blocks / t.functions,
      functionsPerLibrary: t.functions / t.libraries,
      fig2Ratio: f.perFunction / f.perBlock, // should equal blocks per function
      totalFromBlocks: f.perBlock * t.blocks,
      totalFromFunctions: f.perFunction * t.functions,
      totalFromLibraries: f.perLibrary * t.libraries
    };
  }

  /* ------------------------------------------------------------ Table IV text checks */

  function textChecks() {
    var m = TABLE4.meltdown, l = TABLE4.libssh;
    return [
      { claim: "70%: Libssh loss three times the Meltdown loss", value: l[0][0] / m[0][0], unit: "×" },
      { claim: "70%: Libssh accuracy 3% below Meltdown", value: 100 * (m[0][1] - l[0][1]), unit: "points" },
      { claim: "80%: Libssh accuracy 2% below Meltdown", value: 100 * (m[1][1] - l[1][1]), unit: "points" },
      { claim: "90%: Libssh loss nearly doubled (vs. 80% Libssh)", value: l[2][0] / l[1][0], unit: "×" },
      { claim: "90%: Libssh accuracy dropped 4% (vs. 80% Libssh)", value: 100 * (l[1][1] - l[2][1]), unit: "points" },
      { claim: "90%: Libssh accuracy below Meltdown", value: 100 * (m[2][1] - l[2][1]), unit: "points" }
    ];
  }

  root.SuitEngine = {
    TABLE2: TABLE2, FIG3_BLOCKS: FIG3_BLOCKS, FIG3_NAMED: FIG3_NAMED, FIG4: FIG4, FIG2_READ: FIG2_READ,
    FIG1: FIG1, FIG5: FIG5, SPLITS: SPLITS, TABLE3: TABLE3, TABLE4: TABLE4,
    BIN_LABELS: ["0", "1", "2", "3", "4", "5", "6+"],
    COUNTS: COUNTS, blockCountSolutions: blockCountSolutions, namedCountSolutions: namedCountSolutions,
    removed: removed, namedRemovedRange: namedRemovedRange, joint: joint, impliedJoint: impliedJoint,
    setCurve: setCurve, curveCounts: curveCounts, structure: structure, textChecks: textChecks,
    roundTo: roundTo
  };
})(typeof self !== "undefined" ? self : typeof globalThis !== "undefined" ? globalThis : this);

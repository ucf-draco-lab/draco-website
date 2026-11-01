/*
  Verification for vc-engine.js. Run from the repo root:
    node papers/virtual-summer-camp/reference/verify.js
  Part 1 checks that the engine reproduces the paper's printed numbers from the
  paper's own tables. Part 2 compares the page's statistics with SciPy and
  statsmodels (stats-reference.json, made by check_stats.py). Known mismatches
  in the paper are listed as expected findings, not failures.
*/
"use strict";
var path = require("path");
var E = require(path.join(__dirname, "..", "vc-engine.js"));
var REF = require(path.join(__dirname, "stats-reference.json"));
var D = E.DATA, pass = 0, fail = 0, findings = [];

function ok(cond, msg) { if (cond) pass++; else { fail++; console.log("FAIL " + msg); } }
function near(a, b, tol, msg) { ok(Math.abs(a - b) <= tol, msg + " (got " + a + ", want " + b + ")"); }
function note(cond, msg) { if (!cond) findings.push(msg); }
function r(x, d) { var f = Math.pow(10, d); return Math.round(x * f) / f; }

[2020, 2021].forEach(function (y) {
  var Y = D.years[y], P = Y.printed, S = E.summary(y), A = E.perActivity(y);

  // Daily tables sum to Table 4's total views, activity by activity.
  var cs = E.columnSums(y);
  cs.forEach(function (v, j) { ok(v === Y.views[j], y + " " + D.activities[j] + " daily views sum to Table 4 total"); });

  // Totals.
  ok(E.clock(S.totalLengthSec, true) === P.totalLength, y + " total length " + E.clock(S.totalLengthSec, true));
  ok(S.totalViews === P.totalViews, y + " total views");
  ok(S.totalUnique === P.totalUnique, y + " total unique views");
  if (y === 2020) near(S.totalWatch, P.totalWatch, 5e-5, y + " total watch time");
  else note(Math.abs(S.totalWatch - P.totalWatch) < 5e-5, "2021 watch-time column sums to " + r(S.totalWatch, 4) + " h; Table 4 prints " + P.totalWatch);

  // Averages and standard deviations (population form, divide by n).
  ok(E.clock(S.avgLengthSec) === P.avgLength, y + " average length");
  ok(Math.abs(S.sdLengthSec - E.sec(P.sdLength)) <= 1, y + " SD of length within one second (" + E.clock(S.sdLengthSec) + " vs " + P.sdLength + ")");
  near(S.avgViews, P.avgViews, 0.05, y + " average views");
  near(S.sdViews, P.sdViews, y === 2020 ? 0.05 : 0.005, y + " SD views (population)");
  ok(Math.abs(S.sdViewsSample - P.sdViews) > 0.5, y + " sample SD does not fit Table 4");
  near(S.avgVpv, P.avgVpv, 5e-5, y + " average views per viewer");
  near(S.avgUnique, P.avgUnique, 0.05, y + " average unique views");
  near(S.sdUnique, P.sdUnique, 0.05, y + " SD unique views (population)");
  ok(E.clock(S.avgDurationSec) === P.avgDuration, y + " average view duration");
  near(S.avgRetention, P.avgRetention, 0.005, y + " average retention (Table 3)");
  near(S.sdRetention, P.sdRetention, 0.005, y + " SD retention (Table 3, population)");
  near(S.avgWatch, P.avgWatch, 5e-5, y + " average watch time");
  near(S.sdWatch, P.sdWatch, 5e-5, y + " SD watch time (population)");
  if (y === 2020) {
    near(S.sdVpv, P.sdVpv, 5e-5, y + " SD views per viewer");
    ok(Math.abs(S.sdDurationSec - E.sec(P.sdDuration)) <= 1, y + " SD view duration");
  } else {
    near(S.sdVpv, P.sdVpv, 5e-5, "2021 SD views per viewer (from the printed column)");
    note(Math.abs(S.sdDurationSec - E.sec(P.sdDuration)) <= 1, "2021 SD of view duration computes to " + E.clock(S.sdDurationSec) + "; Table 4 prints " + P.sdDuration);
    note(Math.abs(S.sdLengthSec - E.sec(P.sdLength)) < 0.5, "2021 SD of length computes to " + r(S.sdLengthSec, 2) + " s (" + E.clock(S.sdLengthSec) + "); Table 4 prints " + P.sdLength);
  }

  A.forEach(function (a, j) {
    // Views per viewer = total views / unique views.
    if (Math.abs(a.vpvComputed - a.vpvPrinted) < 5e-5) pass++;
    else findings.push(y + " " + a.name + ": " + a.views + "/" + a.unique + " = " + r(a.vpvComputed, 4) + "; Table 4 prints " + a.vpvPrinted + " (= " + a.views + "/" + Math.round(a.views / a.vpvPrinted) + ")");
    // Watch time = views x average view duration, with durations cut to the second.
    ok(a.impliedDurationSec >= a.durationSec - 0.05 && a.impliedDurationSec < a.durationSec + 1.05,
      y + " " + a.name + " watch time implies a view duration within one second of the print (" + r(a.impliedDurationSec, 1) + " s vs " + a.durationSec + " s)");
    // Retention is not average view duration / length.
    note(Math.abs(a.durationShare - a.retention) < 1, y + " " + a.name + ": duration/length = " + r(a.durationShare, 1) + "%, printed retention " + a.retention + "%");
    // Table 3 equals Table 4's retention column.
  });
});

// Table 2 last row: index 14-48, then one value per activity.
var tc = E.tailCheck();
tc.forEach(function (v, j) { ok(v === D.years[2021].tail.views[j], "2021 days 14-48 " + D.activities[j] + " = Table 4 minus 14 printed days (" + v + ")"); });

// Text percentages in Section 4.1.4 and 4.1.3.
var T = E.textChecks();
near(r(T.watchDrop2020, 1), 88.2, 1e-9, "2020 watch time fell 88.2% from Activity 1 to 5");
near(r(T.shorter2020, 1), 35.3, 1e-9, "2020 final video 35.3% shorter than the first");
near(r(T.watchDrop2021, 1), 5.2, 1e-9, "2021 watch time fell 5.2%");
note(Math.abs(T.longer2021 - 51.1) < 0.05, "2021 final video computes " + r(T.longer2021, 1) + "% longer than the first; the text says 51.1% (the first is " + r(T.firstAsShareOfLast2021, 1) + "% of the last)");
near(r(T.firstAsShareOfLast2021, 1), 51.1, 1e-9, "51.1% equals the first 2021 video as a share of the last");
ok(T.availabilityRatio > 3, "2021 available more than three times as long (" + r(T.availabilityRatio, 2) + ")");
ok(T.uniqueFirstGap === 13, "2020 Activity 1 had 13 more unique views than 2021");
ok(T.lastUniqueRatio === 5, "2021 final video unique views five times 2020's");
T.tailPerDay.forEach(function (v, j) { ok(v > 0.75 && v < 1.35, "2021 about one view per day after week two, " + D.activities[j] + " (" + r(v, 2) + ")"); });

// Peaks named in Section 4.1.1.
var d20 = D.years[2020].days;
ok(d20[1][0] === 49 && Math.max.apply(null, d20.map(function (x) { return x[0]; })) === 49, "2020 Activity 1 peak 49 on day 1");
ok(Math.max.apply(null, d20.map(function (x) { return x[1]; })) === 10 && Math.max.apply(null, d20.map(function (x) { return x[2]; })) === 10, "2020 Activities 2 and 3 peak at 10");
ok(d20[4][3] === 12 && d20[5][4] === 4, "2020 Activity 4 twelve views on day 4, Activity 5 four views on day 5");
ok(E.weekday("2020-07-20") === "Mon" && E.weekday("2021-07-05") === "Mon", "day 1 is a Monday in both years");

// Parent evaluations.
var c20 = E.completion(2020), c21 = E.completion(2021);
ok(Math.floor(c20.share) === 66, "2020 completion 16/24 = " + r(c20.share, 2) + "% prints as 66% (cut, not rounded)");
note(Math.round(c20.share) === 66, "2020 completion 16/24 = " + r(c20.share, 2) + "%, printed 66% (rounding gives 67%)");
ok(Math.round(c21.share) === 54, "2021 completion 7/13 = " + r(c21.share, 2) + "% prints as 54%");
ok(c20.surveys + c21.surveys === D.evaluations.total, "24 + 13 = 37 parent evaluations");
ok(Math.round(100 * 37 / 80) === 46, "37 of 80 families = 46%");
var fitN = []; for (var n = 37; n <= 120; n++) if (Math.round(100 * 37 / n) === 46) fitN.push(n);
ok(fitN.join() === "80,81", "46% fits 80 or 81 families (" + fitN.join(", ") + ")");

// Part 2: statistics against SciPy and statsmodels.
var maxF = 0; REF.fisher.forEach(function (c) { var p = E.fisher(c[0], c[1], c[2], c[3]); var e = Math.abs(p - c[4]); maxF = Math.max(maxF, e); ok(e < 1e-9, "Fisher " + c.slice(0, 4).join(",") + " " + p + " vs " + c[4]); });
var maxW = 0; REF.wilson.forEach(function (c) { var w = E.wilson(c[0], c[1]); var e = Math.max(Math.abs(w[0] - c[2]), Math.abs(w[1] - c[3])); maxW = Math.max(maxW, e); ok(e < 1e-12, "Wilson " + c[0] + "/" + c[1]); });
near(E.completionTest().p, REF.completion, 1e-12, "completion Fisher p matches SciPy");

console.log(pass + " checks passed, " + fail + " failed. Max Fisher error " + maxF.toExponential(2) + ", max Wilson error " + maxW.toExponential(2) + ".");
console.log("Findings in the paper (" + findings.length + "):");
findings.forEach(function (f) { console.log(" - " + f); });
process.exit(fail ? 1 : 0);

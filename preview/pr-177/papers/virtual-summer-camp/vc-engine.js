/*
  Virtual summer camp engine for /papers/virtual-summer-camp/.

  Data: Borowczak, Burrows, Wolf, Wolf, and Hu, "The Artful Craft of Improving
  Virtual Summer Camps in the Midst of COVID-19 (Work in Progress)", ASEE Annual
  Conference 2022, DOI 10.18260/1-2--41204. Tables 1 to 4 and the numbers in the
  text are copied as printed. Everything computed here is either a check of a
  printed number (labeled "reproduces") or an analysis of the page's own
  (labeled "page"). Loads as a page script, in a Web Worker, or in Node.
*/
(function (root) {
  "use strict";

  var DATA = {
    activities: ["Activity 1", "Activity 2", "Activity 3", "Activity 4", "Activity 5"],
    years: {
      2020: {
        // Table 1: views per day available, index 0 to 13 (2020-07-19 to 2020-08-01).
        startDate: "2020-07-19",
        days: [
          [3, 0, 0, 0, 0], [49, 0, 0, 0, 0], [8, 9, 0, 0, 0], [19, 8, 10, 0, 0],
          [17, 10, 7, 12, 0], [7, 8, 2, 0, 4], [10, 1, 0, 3, 0], [0, 3, 0, 0, 1],
          [8, 1, 0, 0, 0], [1, 0, 0, 0, 0], [2, 1, 1, 0, 2], [3, 2, 0, 0, 0],
          [0, 0, 2, 3, 2], [0, 0, 0, 0, 0]
        ],
        tail: null,
        daysTracked: 14,
        developers: 1,
        // Table 4, 2020 rows.
        length: ["14:37", "15:10", "20:05", "09:14", "09:27"],
        views: [127, 43, 22, 18, 9],
        viewsPerViewer: [2.0159, 1.7200, 1.2941, 1.5000, 1.8000],
        unique: [63, 25, 17, 12, 5],
        duration: ["04:51", "05:39", "09:57", "06:52", "08:08"],
        retention: [36.83, 40.55, 50.53, 82.94, 81.80],
        watchHours: [10.2988, 4.0566, 3.6506, 2.0632, 1.2204],
        printed: {
          totalLength: "1:08:33", totalViews: 219, totalUnique: 122, totalWatch: 21.2896,
          avgLength: "13:43", sdLength: "04:03", avgViews: 43.8, sdViews: 43.1,
          avgVpv: 1.6660, sdVpv: 0.2487, avgUnique: 24.4, sdUnique: 20.4,
          avgDuration: "07:05", sdDuration: "01:49", avgRetention: 58.53, sdRetention: 19.98,
          avgWatch: 4.2579, sdWatch: 3.1920
        },
        // Section 4.3 parent evaluations.
        surveys: 24, notFinished: 7, noCS: 1, completionPrinted: 66
      },
      2021: {
        // Table 2: index 0 to 13 (2021-07-04 to 2021-07-17), then one row that sums
        // days 14 to 48 (2021-07-18 to 2021-08-21).
        startDate: "2021-07-04",
        days: [
          [1, 0, 0, 1, 0], [2, 1, 1, 2, 0], [5, 4, 4, 2, 3], [3, 1, 1, 0, 0],
          [1, 2, 1, 0, 0], [0, 0, 2, 3, 0], [1, 0, 0, 0, 1], [8, 3, 2, 1, 1],
          [5, 4, 2, 1, 0], [3, 0, 4, 3, 3], [0, 0, 1, 2, 2], [0, 0, 0, 0, 0],
          [1, 0, 0, 0, 0], [2, 2, 1, 1, 1]
        ],
        // The printed last row reads "14 - 48 45 30 33 31 28": index 14 to 48, then one
        // value per activity. The page reads it so; the column sums confirm it (see tailCheck).
        tail: { from: 14, to: 48, views: [45, 30, 33, 31, 28], dates: "2021-07-18 to 2021-08-21" },
        daysTracked: 49,
        developers: 3,
        length: ["11:59", "19:32", "24:02", "24:13", "23:28"],
        views: [77, 47, 52, 47, 39],
        viewsPerViewer: [1.5400, 1.3824, 1.5758, 2.1364, 1.5600],
        unique: [50, 34, 33, 23, 25],
        duration: ["05:15", "09:25", "10:31", "09:29", "09:50"],
        retention: [46.52, 52.64, 50.55, 43.04, 49.55],
        watchHours: [6.7442, 7.3881, 9.1223, 7.4324, 6.3949],
        printed: {
          totalLength: "1:43:14", totalViews: 262, totalUnique: 165, totalWatch: 37.0837,
          avgLength: "20:39", sdLength: "04:40", avgViews: 52.4, sdViews: 12.99,
          avgVpv: 1.6389, sdVpv: 0.2582, avgUnique: 33, sdUnique: 9.5,
          avgDuration: "08:54", sdDuration: "01:49", avgRetention: 48.46, sdRetention: 3.35,
          avgWatch: 7.4164, sdWatch: 0.9388
        },
        surveys: 13, notFinished: 6, noCS: 0, completionPrinted: 54
      }
    },
    // Percentages printed in Section 4.1.4, with the quantities they compare.
    textClaims: {
      watchDrop2020: 88.2, shorter2020: 35.3, watchDrop2021: 5.2, longer2021: 51.1
    },
    evaluations: { total: 37, percent: 46 },
    retentionTarget: 50,
    campCapacity: 80
  };

  /* ---------------------------------------------------------------- times */

  function sec(t) {
    var p = String(t).split(":").map(Number), s = 0;
    for (var i = 0; i < p.length; i++) s = s * 60 + p[i];
    return s;
  }
  function clock(s, withHours) {
    s = Math.round(s);
    var h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
    function two(x) { return (x < 10 ? "0" : "") + x; }
    return (withHours || h > 0) ? h + ":" + two(m) + ":" + two(r) : two(m) + ":" + two(r);
  }

  /* ---------------------------------------------------------------- stats */

  function sum(a) { var s = 0; for (var i = 0; i < a.length; i++) s += a[i]; return s; }
  function mean(a) { return sum(a) / a.length; }
  // Table 4's standard deviations divide by n (population form); see verify.js.
  function sdPop(a) { var m = mean(a), s = 0; for (var i = 0; i < a.length; i++) s += (a[i] - m) * (a[i] - m); return Math.sqrt(s / a.length); }
  function sdSample(a) { var m = mean(a), s = 0; for (var i = 0; i < a.length; i++) s += (a[i] - m) * (a[i] - m); return Math.sqrt(s / (a.length - 1)); }

  // Wilson score interval for k of n (z = 1.959964 for 95 percent).
  function wilson(k, n, z) {
    z = z || 1.959963984540054;
    var p = k / n, z2 = z * z, d = 1 + z2 / n;
    var c = (p + z2 / (2 * n)) / d;
    var h = z * Math.sqrt(p * (1 - p) / n + z2 / (4 * n * n)) / d;
    return [c - h, c + h];
  }

  function logFact(n) { var s = 0; for (var i = 2; i <= n; i++) s += Math.log(i); return s; }
  function hyper(a, r1, c1, n) {
    // P(top-left cell = a) with row-1 total r1, column-1 total c1, grand total n.
    return Math.exp(logFact(r1) + logFact(n - r1) + logFact(c1) + logFact(n - c1) -
      logFact(n) - logFact(a) - logFact(r1 - a) - logFact(c1 - a) - logFact(n - r1 - c1 + a));
  }
  // Two-sided Fisher exact test on [[a, b], [c, d]] (sum of tables no more likely than observed).
  function fisher(a, b, c, d) {
    var r1 = a + b, c1 = a + c, n = a + b + c + d;
    var lo = Math.max(0, c1 - (n - r1)), hi = Math.min(r1, c1);
    var p0 = hyper(a, r1, c1, n), p = 0;
    for (var x = lo; x <= hi; x++) {
      var px = hyper(x, r1, c1, n);
      if (px <= p0 * (1 + 1e-7)) p += px;
    }
    return Math.min(1, p);
  }

  /* -------------------------------------------------------------- derived */

  function year(y) { return DATA.years[y]; }

  // Daily views as a flat list of rows: { label, index, date, views[5], days }.
  function addDays(iso, n) {
    var d = new Date(iso + "T12:00:00Z");
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
  }
  function dailyRows(y) {
    var Y = year(y), rows = Y.days.map(function (v, i) {
      return { index: String(i), date: addDays(Y.startDate, i), views: v.slice(), days: 1 };
    });
    if (Y.tail) rows.push({ index: Y.tail.from + "–" + Y.tail.to, date: Y.tail.dates, views: Y.tail.views.slice(), days: Y.tail.to - Y.tail.from + 1, tail: true });
    return rows;
  }
  function weekday(iso) { return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date(iso + "T12:00:00Z").getUTCDay()]; }

  // Column sums of Table 1 or 2 against Table 4's Total Views.
  function columnSums(y) {
    var rows = dailyRows(y), out = [0, 0, 0, 0, 0];
    rows.forEach(function (r) { r.views.forEach(function (v, j) { out[j] += v; }); });
    return out;
  }
  // The tail row's values follow from Table 4 minus the 14 printed days.
  function tailCheck() {
    var Y = year(2021), first14 = [0, 0, 0, 0, 0];
    Y.days.forEach(function (r) { r.forEach(function (v, j) { first14[j] += v; }); });
    return Y.views.map(function (t, j) { return t - first14[j]; });
  }

  function perActivity(y) {
    var Y = year(y);
    return DATA.activities.map(function (name, j) {
      var L = sec(Y.length[j]), D = sec(Y.duration[j]);
      return {
        name: name,
        lengthSec: L, durationSec: D,
        views: Y.views[j], unique: Y.unique[j],
        vpvPrinted: Y.viewsPerViewer[j], vpvComputed: Y.views[j] / Y.unique[j],
        retention: Y.retention[j], durationShare: 100 * D / L,
        watchHours: Y.watchHours[j], watchFromDuration: Y.views[j] * D / 3600,
        impliedDurationSec: Y.watchHours[j] * 3600 / Y.views[j]
      };
    });
  }

  function summary(y) {
    var Y = year(y), L = Y.length.map(sec), D = Y.duration.map(sec);
    return {
      totalLengthSec: sum(L), totalViews: sum(Y.views), totalUnique: sum(Y.unique), totalWatch: sum(Y.watchHours),
      avgLengthSec: mean(L), sdLengthSec: sdPop(L), avgViews: mean(Y.views), sdViews: sdPop(Y.views),
      avgVpv: mean(Y.viewsPerViewer), sdVpv: sdPop(Y.viewsPerViewer), avgUnique: mean(Y.unique), sdUnique: sdPop(Y.unique),
      avgDurationSec: mean(D), sdDurationSec: sdPop(D), avgRetention: mean(Y.retention), sdRetention: sdPop(Y.retention),
      avgWatch: mean(Y.watchHours), sdWatch: sdPop(Y.watchHours),
      sdViewsSample: sdSample(Y.views), sdRetentionSample: sdSample(Y.retention)
    };
  }

  function textChecks() {
    var a = year(2020), b = year(2021);
    return {
      watchDrop2020: 100 * (1 - a.watchHours[4] / a.watchHours[0]),
      shorter2020: 100 * (1 - sec(a.length[4]) / sec(a.length[0])),
      watchDrop2021: 100 * (1 - b.watchHours[4] / b.watchHours[0]),
      longer2021: 100 * (sec(b.length[4]) / sec(b.length[0]) - 1),
      firstAsShareOfLast2021: 100 * sec(b.length[0]) / sec(b.length[4]),
      availabilityRatio: b.daysTracked / a.daysTracked,
      uniqueFirstGap: a.unique[0] - b.unique[0],
      lastUniqueRatio: b.unique[4] / a.unique[4],
      tailPerDay: b.tail.views.map(function (v) { return v / (b.tail.to - b.tail.from + 1); })
    };
  }

  function completion(y) {
    var Y = year(y), finished = Y.surveys - Y.notFinished - Y.noCS;
    return { surveys: Y.surveys, finished: finished, notFinished: Y.notFinished, noCS: Y.noCS,
      share: 100 * finished / Y.surveys, printed: Y.completionPrinted, wilson: wilson(finished, Y.surveys) };
  }

  // Page analysis (graduate and researcher): did completion differ between years?
  function completionTest() {
    var a = completion(2020), b = completion(2021);
    return { table: [[a.finished, a.surveys - a.finished], [b.finished, b.surveys - b.finished]],
      p: fisher(a.finished, a.surveys - a.finished, b.finished, b.surveys - b.finished) };
  }

  // Unique viewers kept from one activity to the next (a funnel; the page's reading).
  function keep(y) {
    var U = year(y).unique;
    return U.map(function (u, j) { return j === 0 ? 1 : u / U[0]; });
  }

  var api = {
    DATA: DATA, sec: sec, clock: clock, sum: sum, mean: mean, sdPop: sdPop, sdSample: sdSample,
    wilson: wilson, fisher: fisher, dailyRows: dailyRows, weekday: weekday, columnSums: columnSums,
    tailCheck: tailCheck, perActivity: perActivity, summary: summary, textChecks: textChecks,
    completion: completion, completionTest: completionTest, keep: keep
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.VirtualCampEngine = api;
})(typeof self !== "undefined" ? self : this);

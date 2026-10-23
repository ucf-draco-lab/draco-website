/*
  Engine for /papers/stem-team-communication/.
  Borowczak, "Communication in STEM Education: A Non-Intrusive Method for
  Assessment & K20 Educator Feedback," Problems of Education in the 21st Century
  65 (2015), 18-27.

  DATA holds the paper's printed values: the eleven metrics of Table 1 for the
  three capstone teams (Ada, Bohr, and Curie), the participant counts from the
  methods section, and the themes the paper reports from each team's artifacts.

  The rest is the page's own arithmetic:
    - checks(): the two sums Table 1 implies (email + online discussions = total
      discussions; sponsor + team meetings = total meetings) and the meeting
      ratios behind the paper's "2.5 to 3 times";
    - worst(): which team scores lowest on each metric;
    - teamSizes(): every split of the students into three teams whose survey
      response rates round to Table 1's 80%, 33%, and 100%, with the total number
      of responses each split implies (the paper reports nine);
    - simulate() and measure(): a simulated team's six months of repository
      activity (seeded, so the same settings always give the same team), binned
      into a day-by-hour punch card like Figure 1 and a monthly series like
      Figure 2, with the page's own evenness and trend measures. The paper does
      not print its activity data or its classification rules; the simulation
      and every threshold in it are the page's.
  Loads as a page script or in a Web Worker.
*/
(function (root) {
  "use strict";

  var TEAMS = ["Ada", "Bohr", "Curie"];

  var DATA = {
    teams: TEAMS,
    // Table 1, "The eleven quantifiable metrics for three teams."
    // kind: tool (from the cloud tool) or observed (recorded by the researcher).
    // type: count, mean, yesno, trend, pct.
    metrics: [
      { id: "email", label: "Email discussions", kind: "tool", type: "count", values: [16, 9, 56] },
      { id: "online", label: "Online discussions", kind: "tool", type: "count", values: [96, 4, 0] },
      { id: "total", label: "Total discussions", kind: "tool", type: "count", values: [112, 13, 56] },
      { id: "length", label: "Average discussion length (responses)", kind: "tool", type: "mean", values: [4.9, 1.9, 3.4] },
      { id: "even", label: "Even distribution of work", kind: "tool", type: "yesno", values: ["Yes", "No", "Yes"] },
      { id: "trend", label: "Work over time", kind: "tool", type: "trend", values: ["Increasing", "Decreasing", "Increasing"] },
      { id: "collab", label: "Use of collaborative features", kind: "tool", type: "yesno", values: ["Yes", "No", "No"] },
      { id: "sponsor", label: "Sponsor + team meetings", kind: "observed", type: "count", values: [6, 2, 9] },
      { id: "team", label: "Observed team meetings", kind: "observed", type: "count", values: [20, 8, 20] },
      { id: "meetings", label: "Total meetings", kind: "observed", type: "count", values: [26, 10, 29] },
      { id: "survey", label: "Responded to survey", kind: "observed", type: "pct", values: [80, 33, 100] }
    ],
    // Methods: participants.
    participants: { abstract: 13, students: 12, instructors: 3, sponsors: 2, total: 17, female: 3, surveyFollowUp: 9 },
    // Results: themes from weekly reports, meeting minutes, and surveys.
    themes: [
      "Expert pairs: small pairs worked an issue, then brought it to the whole team; regular reports of what was done, planned, and stuck.",
      "Disconnected experts: weekly status reports thinned and stopped well before the term ended; advisors' minutes urged regular weekly meetings.",
      "Content experts: each member led an area, and the team wrote a shared follow-up document after every meeting."
    ],
    months: 6
  };

  function metric(id) {
    for (var i = 0; i < DATA.metrics.length; i++) if (DATA.metrics[i].id === id) return DATA.metrics[i];
    return null;
  }

  /* ------------------------------------------------ Table 1 arithmetic */

  function checks() {
    var e = metric("email").values, o = metric("online").values, t = metric("total").values;
    var s = metric("sponsor").values, m = metric("team").values, tm = metric("meetings").values;
    var out = { discussions: [], meetings: [], ratios: {} };
    for (var i = 0; i < 3; i++) {
      out.discussions.push({ team: TEAMS[i], email: e[i], online: o[i], sum: e[i] + o[i], printed: t[i], ok: e[i] + o[i] === t[i] });
      out.meetings.push({ team: TEAMS[i], sponsor: s[i], team_only: m[i], sum: s[i] + m[i], printed: tm[i], ok: s[i] + m[i] === tm[i] });
    }
    out.ratios = {
      totalAda: tm[0] / tm[1], totalCurie: tm[2] / tm[1],
      teamAda: m[0] / m[1], teamCurie: m[2] / m[1],
      sponsorAda: s[0] / s[1], sponsorCurie: s[2] / s[1],
      discAda: t[0] / t[1], discCurie: t[2] / t[1],
      lengthAda: metric("length").values[0] / metric("length").values[1]
    };
    return out;
  }

  // Score each value so that higher is better, then return the indices of the
  // team(s) with the lowest score.
  function score(m, v) {
    if (m.type === "yesno") return v === "Yes" ? 1 : 0;
    if (m.type === "trend") return v === "Increasing" ? 1 : 0;
    return v;
  }
  function worst(m) {
    var sc = m.values.map(function (v) { return score(m, v); });
    var lo = Math.min.apply(null, sc);
    var idx = [];
    sc.forEach(function (x, i) { if (x === lo) idx.push(i); });
    return idx;
  }
  function tally(ids) {
    var t = [0, 0, 0], alone = [0, 0, 0], shared = 0;
    DATA.metrics.forEach(function (m) {
      if (ids && ids.indexOf(m.id) < 0) return;
      var w = worst(m);
      w.forEach(function (i) { t[i]++; });
      if (w.length === 1) alone[w[0]]++; else shared++;
    });
    return { lowest: t, alone: alone, shared: shared };
  }

  /* ------------------------------------------------ team sizes */

  // Every (a, b, c) with a + b + c = n and each team >= minSize, together with
  // every response count r in 0..size whose rate rounds to the printed percent.
  function teamSizes(n, rates, minSize) {
    rates = rates || metric("survey").values;
    minSize = minSize || 1;
    var out = [];
    function opts(size, rate) {
      var r = [];
      for (var k = 0; k <= size; k++) if (Math.round(100 * k / size) === rate) r.push(k);
      return r;
    }
    for (var a = minSize; a <= n; a++) for (var b = minSize; a + b <= n; b++) {
      var c = n - a - b;
      if (c < minSize) continue;
      var ra = opts(a, rates[0]), rb = opts(b, rates[1]), rc = opts(c, rates[2]);
      ra.forEach(function (x) { rb.forEach(function (y) { rc.forEach(function (z) {
        out.push({ sizes: [a, b, c], responses: [x, y, z], total: x + y + z });
      }); }); });
    }
    return out;
  }

  /* ------------------------------------------------ simulation */

  // mulberry32: a small seeded generator, so a seed always gives the same team.
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
  // Poisson draw by inversion (rates here stay below about 200).
  function poisson(rand, lam) {
    if (lam <= 0) return 0;
    if (lam > 60) { // normal approximation for large rates
      var u = 1 - rand(), v = rand();
      var z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
      return Math.max(0, Math.round(lam + Math.sqrt(lam) * z));
    }
    var L = Math.exp(-lam), k = 0, p = 1;
    do { k++; p *= rand(); } while (p > L);
    return k - 1;
  }
  function pickWeighted(rand, w) {
    var s = 0, i;
    for (i = 0; i < w.length; i++) s += w[i];
    var x = rand() * s;
    for (i = 0; i < w.length; i++) { x -= w[i]; if (x < 0) return i; }
    return w.length - 1;
  }

  // Day 0 = Monday. A steady habit works weekdays in daytime hours with some
  // evenings and weekends; a crunch habit piles work into the evening and night
  // before a weekly Thursday deadline.
  var STEADY_DAY = [1, 1, 1, 1, 1, 0.45, 0.35];
  var STEADY_HOUR = [0.05, 0.02, 0.01, 0.01, 0.01, 0.02, 0.05, 0.15, 0.45, 0.85, 1, 1, 0.8, 0.9, 1, 1, 0.9, 0.7, 0.55, 0.55, 0.5, 0.4, 0.25, 0.12];
  var CRUNCH_DAY = [0.12, 0.2, 1, 0.45, 0.06, 0.04, 0.12];
  var CRUNCH_HOUR = [0.75, 0.6, 0.35, 0.15, 0.04, 0.01, 0.01, 0.01, 0.02, 0.04, 0.05, 0.06, 0.06, 0.06, 0.07, 0.08, 0.1, 0.15, 0.3, 0.55, 0.8, 1, 1, 0.9];

  // params: { work: events per month at the midpoint, steady: 0..1, trend: -1..1,
  //           threads: discussions per month, replies: mean responses per discussion }
  function simulate(params, seed) {
    var rand = rng(seed);
    var months = DATA.months;
    var grid = [], monthly = [], threads = [];
    var d, h, m, i;
    for (d = 0; d < 7; d++) { grid.push([]); for (h = 0; h < 24; h++) grid[d].push(0); }
    for (m = 0; m < months; m++) {
      var x = (m - (months - 1) / 2) / ((months - 1) / 2); // -1 .. 1
      var lam = Math.max(0, params.work * (1 + 0.75 * params.trend * x));
      var n = poisson(rand, lam);
      monthly.push(n);
      for (i = 0; i < n; i++) {
        var steady = rand() < params.steady;
        d = pickWeighted(rand, steady ? STEADY_DAY : CRUNCH_DAY);
        h = pickWeighted(rand, steady ? STEADY_HOUR : CRUNCH_HOUR);
        grid[d][h]++;
      }
      var nt = poisson(rand, params.threads);
      for (i = 0; i < nt; i++) threads.push(poisson(rand, params.replies));
    }
    return { grid: grid, monthly: monthly, threads: threads };
  }

  // Thresholds are the page's: the paper classifies its figures by eye.
  var EVEN_AT = 0.80;   // normalized entropy of the 168 day-and-hour cells
  var LONG_AT = 3.0;    // mean responses per discussion

  function measure(sim) {
    var cells = [], total = 0, d, h;
    for (d = 0; d < 7; d++) for (h = 0; h < 24; h++) { cells.push(sim.grid[d][h]); total += sim.grid[d][h]; }
    var H = 0;
    cells.forEach(function (c) { if (c > 0) { var p = c / total; H -= p * Math.log(p); } });
    var evenness = total > 0 ? H / Math.log(168) : 0;
    // Share of all work in the busiest 10% of cells (17 of 168).
    var sorted = cells.slice().sort(function (a, b) { return b - a; });
    var top = 0;
    for (var k = 0; k < 17; k++) top += sorted[k];
    var topShare = total > 0 ? top / total : 0;
    // Least-squares slope of the monthly totals, relative to their mean.
    var y = sim.monthly, n = y.length, mx = (n - 1) / 2, my = 0, sxy = 0, sxx = 0;
    y.forEach(function (v) { my += v; });
    my /= n;
    y.forEach(function (v, i) { sxy += (i - mx) * (v - my); sxx += (i - mx) * (i - mx); });
    var slope = sxx > 0 ? sxy / sxx : 0;
    var rel = my > 0 ? slope / my : 0;
    var replies = sim.threads.length ? sim.threads.reduce(function (a, b) { return a + b; }, 0) / sim.threads.length : 0;
    var night = 0;
    for (d = 0; d < 7; d++) for (h = 0; h < 24; h++) if (h >= 22 || h < 6) night += sim.grid[d][h];
    return {
      total: total,
      evenness: evenness,
      topShare: topShare,
      nightShare: total > 0 ? night / total : 0,
      slope: slope,
      relSlope: rel,
      trend: slope > 0 ? "Increasing" : "Decreasing",
      even: evenness >= EVEN_AT ? "Yes" : "No",
      discussions: sim.threads.length,
      length: replies,
      long: replies >= LONG_AT ? "Yes" : "No",
      flags: (replies < LONG_AT ? 1 : 0) + (evenness < EVEN_AT ? 1 : 0) + (slope <= 0 ? 1 : 0)
    };
  }

  // Presets: discussion rates and lengths are set from Table 1 (totals over six
  // months); work habits and volumes are the page's choices, picked so the
  // simulated punch cards fall on the side of the page's thresholds that the
  // paper's classification puts each team on.
  var PRESETS = {
    ada:   { label: "Like Ada",   work: 60, steady: 0.85, trend: 0.5,  threads: 112 / 6, replies: 4.9 },
    bohr:  { label: "Like Bohr",  work: 35, steady: 0.1,  trend: -0.7, threads: 13 / 6,  replies: 1.9 },
    curie: { label: "Like Curie", work: 50, steady: 0.8,  trend: 0.4,  threads: 56 / 6,  replies: 3.4 }
  };

  var api = {
    DATA: DATA,
    metric: metric,
    checks: checks,
    worst: worst,
    tally: tally,
    teamSizes: teamSizes,
    rng: rng,
    poisson: poisson,
    simulate: simulate,
    measure: measure,
    PRESETS: PRESETS,
    EVEN_AT: EVEN_AT,
    LONG_AT: LONG_AT
  };
  root.TeamCommEngine = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof self !== "undefined" ? self : this);

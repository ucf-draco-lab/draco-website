/*
  Engine for /papers/cloud-notebooks/.
  Borowczak and Burrows (Borowczak), "Interactive Web Notebooks Using the Cloud to
  Enable CS in K-16+ Classrooms and PDs," ASEE Annual Conference 2017
  (DOI 10.18260/1-2--28571).

  DATA holds the paper's printed values: the RAMPED design (Context and Methods), the
  20 participants, the four assessment items (Table 5.3.1), percent correct at four
  checkpoints (Table 6.2.1), the printed changes and averages (Table 6.2.2), and the
  two case-study presentations (Figures 1 and 2).

  The rest is the page's own arithmetic:
    - deltas(): Table 6.2.2's three changes, rebuilt from Table 6.2.1;
    - averageChange(): their mean, which telescopes to (post-post − pre-pre) / 3;
    - groupSummary(): unweighted Local and Cloud means per checkpoint and per step;
    - counts(pct, n): every whole number of correct answers out of n that rounds to a
      printed percentage; denominators() and sharedDenominators() apply it across
      checkpoints to show which group sizes the table allows.
  reference/check-engine.py recomputes every result independently.
  Loads as a page script or in a Web Worker, and as a Node module.
*/
(function (root) {
  "use strict";

  var DATA = {
    checkpoints: [
      { id: "prepre", label: "Pre-pre", when: "Before the summer PD" },
      { id: "pre", label: "Pre", when: "Before the item's two-day session" },
      { id: "post", label: "Post", when: "Right after the two-day session" },
      { id: "postpost", label: "Post-post", when: "Right after the summer PD" }
    ],
    // The paper's full assessment schedule (Methods); Table 6.2.1 reports the first four.
    schedule: [
      { label: "Pre-pre", when: "before the summer PD", reported: true },
      { label: "Pre", when: "before each two-day session", reported: true },
      { label: "Post", when: "right after each two-day session", reported: true },
      { label: "Post-post", when: "right after the summer PD", reported: true },
      { label: "Pre-follow", when: "before each school-year follow-up", reported: false },
      { label: "Post-follow", when: "right after each follow-up", reported: false },
      { label: "Final", when: "after all 120 contact hours", reported: false }
    ],
    // Context: six two-day sessions; teachers chose four in the summer.
    // lang/location only where Table 5.3.1 states them.
    sessions: [
      { id: "nni", name: "Naturally Inspired (NNI)", lang: "Logo (NetLogo)", location: "Cloud", item: "Q17b" },
      { id: "space", name: "Space", lang: "Python", location: "Cloud", item: "Q14" },
      { id: "robotics", name: "Robotics", lang: "C++", location: "Local", item: "Q5" },
      { id: "vr", name: "Virtual Reality", lang: null, location: null, item: null },
      { id: "arduino", name: "Arduinos", lang: null, location: null, item: null },
      { id: "rpi", name: "Raspberry Pi", lang: "C++", location: "Local", item: "Q7" }
    ],
    pd: {
      name: "RAMPED", expansion: "Robotics, Applied Mathematics, Physics, & Engineering Design",
      days: 16, summerWeeks: 2, followUpDays: 6, contactHours: 120, teachersYearlong: 30,
      sessionsOffered: 6, sessionsChosen: 4, offeringsPerSession: 2, seatsPerOffering: 10,
      pythonDays: 3, pythonHours: 32, netlogoDays: 3, netlogoHours: 32,
      surveyMonthsAfter: 3, expertsOutreach: 6, experts: 8
    },
    participants: { n: 20, highSchool: 7, highSchoolPct: 35, science: 13, sciencePct: 63, years: 12.9, studentsPerYear: 125.5, iepStudents: 16, iepPct: 12 },
    // Table 5.3.1 and Table 6.2.1 (percent correct, n = 20 as printed).
    items: [
      { id: "Q5", session: "Robotics", lang: "C++", location: "Local", text: "Which command queries a robot's joint state?", pct: [6, 18, 44, 26] },
      { id: "Q7", session: "Raspberry Pi", lang: "C++", location: "Local", text: "Which of the following illustrates sequential operation?", graphical: true, pct: [39, 45, 90, 82] },
      { id: "Q14", session: "Space", lang: "Python", location: "Cloud", text: "Print out the numbers 1 to 10.", pct: [32, 39, 55, 86] },
      { id: "Q17b", session: "NNI", lang: "Logo", location: "Cloud", text: "Create a process to swap two numbers.", pct: [29, 55, 59, 80] }
    ],
    // Table 6.2.2 as printed: changes between checkpoints and their average.
    t622: {
      Q5: { d: [12, 26, -18], avg: 3.33 },
      Q7: { d: [6, 45, -8], avg: 14.33 },
      Q14: { d: [7, 16, 31], avg: 18 },
      Q17b: { d: [26, 4, 21], avg: 17 }
    },
    // Figures 1 and 2 and the case-study text.
    cases: [
      { id: "hs", who: "High school physics teacher", years: "fewer than two years", tool: "Jupyter notebooks (Python)",
        slides: 24, toolSlides: 8, toolSlidesExact: true },
      { id: "elem", who: "Fourth-grade teacher", years: "about 10 years", tool: "NetLogo Web",
        slides: 23, toolSlides: 12, toolSlidesExact: false }   // "over half": at least 12 of 23
    ]
  };

  function item(id) {
    for (var i = 0; i < DATA.items.length; i++) if (DATA.items[i].id === id) return DATA.items[i];
    return null;
  }

  function deltas(id) {
    var p = item(id).pct;
    return [p[1] - p[0], p[2] - p[1], p[3] - p[2]];
  }
  function averageChange(id) {
    var d = deltas(id);
    return (d[0] + d[1] + d[2]) / 3;
  }
  function round2(x) { return Math.round(x * 100 + (x >= 0 ? 1e-9 : -1e-9)) / 100; }

  // Compare the rebuilt Table 6.2.2 with the printed one.
  function check622() {
    return DATA.items.map(function (it) {
      var d = deltas(it.id), pr = DATA.t622[it.id], avg = averageChange(it.id);
      var dOk = d.every(function (v, i) { return v === pr.d[i]; });
      return { id: it.id, deltas: d, printedDeltas: pr.d, deltasMatch: dOk,
        average: avg, printedAverage: pr.avg, averageMatch: Math.abs(round2(avg) - pr.avg) < 0.006,
        span: it.pct[3] - it.pct[0] };
    });
  }

  // Unweighted means of the Local items and of the Cloud items (page's own summary).
  function groupSummary() {
    var out = {};
    ["Local", "Cloud"].forEach(function (g) {
      var its = DATA.items.filter(function (it) { return it.location === g; });
      var mean = [0, 1, 2, 3].map(function (c) {
        return its.reduce(function (s, it) { return s + it.pct[c]; }, 0) / its.length;
      });
      out[g] = { items: its.map(function (it) { return it.id; }), mean: mean,
        steps: [mean[1] - mean[0], mean[2] - mean[1], mean[3] - mean[2]] };
    });
    return out;
  }

  // Whole numbers of correct answers k (0..n) with |100k/n − pct| ≤ 0.5.
  function counts(pct, n) {
    var out = [];
    for (var k = 0; k <= n; k++) if (Math.abs(100 * k / n - pct) <= 0.5 + 1e-12) out.push(k);
    return out;
  }
  function denominators(pct, lo, hi) {
    var out = [];
    for (var n = lo; n <= hi; n++) if (counts(pct, n).length) out.push(n);
    return out;
  }
  // Group sizes in [lo, hi] that fit every listed percentage at once.
  function sharedDenominators(pcts, lo, hi) {
    var out = [];
    for (var n = lo; n <= hi; n++) {
      if (pcts.every(function (p) { return counts(p, n).length > 0; })) out.push(n);
    }
    return out;
  }

  var CloudNotebooksEngine = {
    DATA: DATA, item: item, deltas: deltas, averageChange: averageChange, check622: check622,
    groupSummary: groupSummary, counts: counts, denominators: denominators,
    sharedDenominators: sharedDenominators, round2: round2
  };
  if (typeof module !== "undefined" && module.exports) module.exports = CloudNotebooksEngine;
  root.CloudNotebooksEngine = CloudNotebooksEngine;
})(typeof self !== "undefined" ? self : this);

/*
  Engine for /papers/cs-outreach-engagement/.
  Wolf, Cooley, Johnson, Borowczak, and Borowczak, "Constructing and Refining
  Computer Science Outreach Focused on Student Engagement" (ASEE 2020,
  DOI 10.18260/1-2--34327).

  Plain arithmetic, no dependencies; loads as a page script or in a worker.
  - PAPER: everything the ASEE paper states (settings, group sizes, research
    questions, objectives, the two outcome numbers, follow-on programs).
  - COMPANION: the Q10 interest counts printed in the companion journal paper
    (Wolf et al., Education Sciences 2020, DOI 10.3390/educsci10120353), which
    reports a pre/post survey from the same team's 2019 camp. The ASEE paper
    prints no counts; the page uses these to test readings of its numbers and
    labels them as the journal's.
  - partition(): splits a camp into groups that respect a size range.
  - shareMatches(): every whole count k of n that prints as a given percent.
  - readings(): candidate definitions of "a 17.5% increase in interest level".
  - wilson(): Wilson score interval (graduate and researcher levels only).
*/
(function (root) {
  "use strict";

  var PAPER = {
    doi: "10.18260/1-2--34327",
    // The four instruction settings, largest group first, as the paper lists them.
    settings: [
      { key: "class", label: "Class-wide conversations", min: 25, max: 30,
        lead: "Volunteers with education experience",
        does: "Introduce main ideas and foundational concepts" },
      { key: "large", label: "Large group collaboration", min: 5, max: 10,
        lead: "University students",
        does: "Drive discussion of the ideas from the class-wide sessions" },
      { key: "team", label: "Small team problem solving", min: 2, max: 5,
        lead: "Students themselves",
        does: "Work real-world problems in hands-on programming labs" },
      { key: "solo", label: "Individual reflection", min: 1, max: 1,
        lead: "Each student",
        does: "Show progress, interest, and content knowledge through drawings, worksheets, and surveys" }
    ],
    questions: [
      { key: "rq1", label: "RQ1", text: "How do week-long outreach activities impact student interest in cybersecurity?" },
      { key: "rq2", label: "RQ2", text: "How do these activities influence student behavior online?" }
    ],
    objectives: [
      { key: "o1", label: "Objective 1", text: "Engage participants by associating lessons with familiar concepts and suitable applications." },
      { key: "o2", label: "Objective 2", text: "Go beyond coding: creative problem solving, communication, teamwork, and critical thinking." },
      { key: "o3", label: "Objective 3", text: "Improve instruction across camps, kept current with cybersecurity issues." }
    ],
    // What the paper offers as evidence, keyed to the questions and objectives.
    evidence: [
      { key: "e175", text: "A 17.5% increase in interest level", kind: "number", value: 17.5, links: ["rq1", "o1"] },
      { key: "e65", text: "65% reporting high interest after camp", kind: "number", value: 65, links: ["rq1", "o1"] },
      { key: "eagain", text: "Student comments that they would attend the camp again", kind: "statement", links: ["rq1", "o1"] },
      { key: "eonline", text: "More attention to the implications of their behavior online after camp", kind: "statement", links: ["rq2"] },
      { key: "efamiliar", text: "Familiar concepts and suitable applications aided content knowledge", kind: "statement", links: ["o1"] },
      { key: "emix", text: "Coursework mixed foundational skills (coding) with soft skills", kind: "design", links: ["o2"] },
      { key: "erefine", text: "Results feed the next round of outreach", kind: "design", links: ["o3"] }
    ],
    // Identical pre- and post-surveys; the paper reports only these two figures.
    outcomes: { increase: 17.5, highPost: 65 },
    // Follow-on opportunities named in Conclusions and Future Work.
    followOn: [
      { key: "mshs", text: "Week-long camps for middle and high school students and teachers", who: "both", length: "week" },
      { key: "elem", text: "Week-long camps for elementary students and teachers", who: "both", length: "week" },
      { key: "micro", text: "Outreach that lets teachers earn micro-credentials", who: "teachers", length: "self" },
      { key: "eng", text: "One- to two-day professional development on engineering standards for elementary teachers", who: "teachers", length: "short" },
      { key: "k8", text: "Week-long professional development to integrate computer science in K-8 classrooms", who: "teachers", length: "week" },
      { key: "mix", text: "Other professional development that mixes computer science lessons into classrooms", who: "teachers", length: "varied" }
    ],
    funding: ["NSF DRL #1923542", "NSA H98230-18-1-0095", "NSA H98230-19-1-0095"]
  };

  // Companion journal, 2019 camp, Q10 interest (None, Minimal, Moderate, High).
  // Counts as printed; they sum to 22 of the 24 paired students at both times.
  var COMPANION = {
    doi: "10.3390/educsci10120353",
    paired: 24,
    levels: ["None", "Minimal", "Moderate", "High"],
    pre: [0, 4, 11, 7],
    post: [0, 0, 7, 15],
    printed: { highPre: 30, highPost: 63, abstractPre: 31, abstractPost: 65 }
  };

  function sum(a) { var s = 0; for (var i = 0; i < a.length; i++) s += a[i]; return s; }

  // Split n people into the fewest groups whose sizes stay within [min, max],
  // sizes as even as possible. Returns null when no split fits.
  function partition(n, min, max) {
    if (n <= 0) return [];
    if (min <= 1 && max <= 1) { var ones = []; for (var i = 0; i < n; i++) ones.push(1); return ones; }
    for (var g = Math.ceil(n / max); g <= Math.floor(n / min); g++) {
      var base = Math.floor(n / g), extra = n % g;
      if (base < min || base + (extra ? 1 : 0) > max) continue;
      var out = [];
      for (var j = 0; j < g; j++) out.push(base + (j < extra ? 1 : 0));
      return out;
    }
    return null;
  }

  // A whole camp day: n students through the four settings. When a class-wide
  // session cannot hold everyone in range, the camp splits into rooms first.
  function campPlan(n) {
    var rooms = partition(n, PAPER.settings[0].min, PAPER.settings[0].max);
    var roomsFit = !!rooms;
    if (!rooms) rooms = [n];
    var large = [], teams = [];
    rooms.forEach(function (r, ri) {
      var lg = partition(r, PAPER.settings[1].min, PAPER.settings[1].max) || [r];
      lg.forEach(function (sz) {
        large.push({ room: ri, size: sz });
        var tm = partition(sz, PAPER.settings[2].min, PAPER.settings[2].max) || [sz];
        tm.forEach(function (t) { teams.push({ room: ri, group: large.length - 1, size: t }); });
      });
    });
    return {
      n: n, rooms: rooms, roomsFit: roomsFit, large: large, teams: teams,
      leaders: { classWide: rooms.length, university: large.length, teams: teams.length }
    };
  }

  // Every k in 0..n with round(100 k / n, d) equal to pct (half-up), and the
  // truncated reading as well.
  function shareMatches(pct, n, d) {
    d = d || 0;
    var f = Math.pow(10, d), out = [];
    for (var k = 0; k <= n; k++) {
      var v = 100 * k / n;
      var rounded = Math.floor(v * f + 0.5 + 1e-9) / f;
      var truncated = Math.floor(v * f + 1e-9) / f;
      if (Math.abs(rounded - pct) < 1e-9) out.push({ k: k, n: n, value: v, rule: "rounded" });
      else if (Math.abs(truncated - pct) < 1e-9) out.push({ k: k, n: n, value: v, rule: "truncated" });
    }
    return out;
  }

  function meanScore(counts, offset) {
    var s = 0;
    for (var i = 0; i < counts.length; i++) s += (i + offset) * counts[i];
    return s / sum(counts);
  }

  // Candidate readings of "17.5% increase in interest level", each computed
  // from given pre and post counts (None..High) with optional post denominator.
  function readings(pre, post, postN) {
    var nPre = sum(pre), nPost = postN || sum(post);
    var hiPre = pre[3] / nPre, hiPost = post[3] / nPost;
    var mhPre = (pre[2] + pre[3]) / nPre, mhPost = (post[2] + post[3]) / nPost;
    var m1Pre = meanScore(pre, 1), m1Post = meanScore(post, 1);
    var m0Pre = meanScore(pre, 0), m0Post = meanScore(post, 0);
    return [
      { key: "rel14", label: "Relative change in the mean interest score, scored 1 to 4", value: 100 * (m1Post - m1Pre) / m1Pre, unit: "%",
        how: "(" + m1Post.toFixed(3) + " − " + m1Pre.toFixed(3) + ") / " + m1Pre.toFixed(3) },
      { key: "rel03", label: "Relative change in the mean interest score, scored 0 to 3", value: 100 * (m0Post - m0Pre) / m0Pre, unit: "%",
        how: "(" + m0Post.toFixed(3) + " − " + m0Pre.toFixed(3) + ") / " + m0Pre.toFixed(3) },
      { key: "range", label: "Change in the mean score as a share of the scale's range (3 steps)", value: 100 * (m1Post - m1Pre) / 3, unit: "%",
        how: "(" + m1Post.toFixed(3) + " − " + m1Pre.toFixed(3) + ") / 3" },
      { key: "ppMH", label: "Change in moderate-or-high share, in percentage points", value: 100 * (mhPost - mhPre), unit: " pts",
        how: (pre[2] + pre[3]) + "/" + nPre + " → " + (post[2] + post[3]) + "/" + nPost },
      { key: "ppH", label: "Change in high-interest share, in percentage points", value: 100 * (hiPost - hiPre), unit: " pts",
        how: pre[3] + "/" + nPre + " → " + post[3] + "/" + nPost },
      { key: "relH", label: "Relative change in the high-interest share", value: 100 * (hiPost - hiPre) / hiPre, unit: "%",
        how: "(" + (100 * hiPost).toFixed(1) + " − " + (100 * hiPre).toFixed(1) + ") / " + (100 * hiPre).toFixed(1) }
    ];
  }

  // Wilson score interval, z = 1.959963984540054 (95%).
  function wilson(k, n, z) {
    z = z || 1.959963984540054;
    if (n === 0) return [0, 1];
    var p = k / n, z2 = z * z;
    var denom = 1 + z2 / n;
    var center = (p + z2 / (2 * n)) / denom;
    var half = (z * Math.sqrt(p * (1 - p) / n + z2 / (4 * n * n))) / denom;
    return [Math.max(0, center - half), Math.min(1, center + half)];
  }

  // Percent versus percentage points, for the high school activity.
  function percentChange(before, after) {
    return { points: after - before, relative: before === 0 ? Infinity : 100 * (after - before) / before };
  }

  var api = {
    PAPER: PAPER, COMPANION: COMPANION,
    partition: partition, campPlan: campPlan, shareMatches: shareMatches,
    meanScore: meanScore, readings: readings, wilson: wilson, percentChange: percentChange, sum: sum
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.OutreachEngagementEngine = api;
})(typeof self !== "undefined" ? self : this);

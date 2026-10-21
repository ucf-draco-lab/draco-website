/*
  Integrated outreach engine for /papers/integrated-outreach/.

  Holds the numbers the two papers print, and the small computations the page
  runs on them:
    - Wolf, Burrows, Borowczak, Johnson, Cooley, and Mogenson, "Integrated
      Outreach: Increasing Engagement in Computer Science and Cybersecurity,"
      Education Sciences 10(12):353, 2020. DOI 10.3390/educsci10120353.
    - Wolf, Moss, Manandhar, Cooley, Cooley, Burrows Borowczak, and Borowczak,
      "Building Collaboration and Securing Interest in Computer Science
      Education through Outreach Opportunities," ASEE Annual Conference,
      Tampa, 2019. DOI 10.18260/1-2--32484.

  Computations: key-space size and brute-force search for the lock-box lab,
  the counts k out of n that print as a given whole percentage (rounded or
  truncated), the paired tables consistent with a pre/post pair of totals, and
  the exact McNemar test (a two-sided binomial test on the discordant pairs,
  as SciPy's binomtest computes it for p = 0.5).

  Loads as a page script or in a Web Worker.
*/
(function (root) {
  "use strict";

  /* ------------------------------------------------------------ the papers' numbers */

  // Participants (journal, Methods and Tables 1 and 2): both summers together.
  var PEOPLE = {
    students: 84, camps: 3, camps2018: 2, camps2019: 1,
    female: 27, male: 73, meanAge: 13, grades78: 49, ageMin: 10, ageMax: 18,
    advertised: "13 to 18", younger: 7, paired: 24
  };

  // Labs from the ASEE 2019 paper (the 2018 camps).
  var LABS = [
    { id: "01", name: "Beacons and Scanners", idea: "Radio groups and signal strength",
      what: "A hide-and-seek game with radio beacons. Students extended base code to show signal strength and switch radio groups, with standard, tunable, and scanner receivers." },
    { id: "02", name: "Lock-Pick", idea: "Information hiding",
      what: "Students sent binary-string keys by radio to cardboard lock boxes run by a Micro:Bit and a servo motor. Boxes came in several difficulty levels, and the harder boxes hid their code." },
    { id: "03", name: "Micro:Bots", idea: "Integrity and jamming",
      what: "Students drove two-wheeled robots with radio controllers. On a shared channel the robots obeyed each other's commands, which opened a discussion of jamming, then sanctioned hacking rounds and defenses." },
    { id: "04", name: "Fitness Tracker (backup)", idea: "Intercepted personal data",
      what: "Students graphed accelerometer data, then intercepted a partner's data to infer what the partner had been doing." }
  ];

  // Field-note themes from 2018 and the 2019 response (journal, Results 4.1).
  var THEMES = [
    { key: "curve", name: "Learning curve",
      saw: "Most students were new to programming and to the hardware, and online tutorials alone did not build problem solving.",
      did: "Micro:Bit 101 level-up guides: staff-written exercises with checkpoints, released for other educators." },
    { key: "engage", name: "Engagement",
      saw: "Unplugged activities held attention less well than the labs.",
      did: "Two sections by self-reported experience, each with its own instructor, trading rooms partway through; more interactive unplugged work, a longer telephone game on message integrity, and a new Wi-Fi lesson." },
    { key: "world", name: "Real-world connections",
      saw: "Students had to link activities to daily life on their own; the radio beacon lab was hard to connect.",
      did: "Staff named the connection in every lab: beacons to store advertising, Micro:bots to drones and self-driving cars, and a password-strength example." },
    { key: "badge", name: "Motivation",
      saw: "Badge leveling was applied inconsistently.",
      did: "Standardized checkpoints on the LED-ring badges, with progress reset each day so earlier mistakes did not carry over." }
  ];

  // Content items, 2019 paired surveys (n = 24). Counts and shares as printed.
  // The paper reports Q2 to Q4 by CIA component, not by question number.
  var ITEMS = [
    { key: "q1", label: "C, I, and A", q: "Q1", text: "What do the letters C, I, and A stand for in information security?",
      pre: { k: 8, pct: 33 }, post: { k: 23, pct: 96 } },
    { key: "avail", label: "Availability", q: "Q2–Q4", text: "Spot the availability lapse in a security-failure example.",
      pre: { k: 10, pct: 42 }, post: { k: 22, pct: 92 } },
    { key: "integ", label: "Integrity", q: "Q2–Q4", text: "Spot the integrity lapse in a security-failure example.",
      pre: { k: 3, pct: 13 }, post: { k: 15, pct: 63 } },
    { key: "conf", label: "Confidentiality", q: "Q2–Q4", text: "Spot the confidentiality lapse in a security-failure example.",
      pre: { k: 18, pct: 75 }, post: { k: 20, pct: 83 } },
    { key: "q9", label: "Memes", q: "Q9", text: "What are online surveys and “What ___ character are you?” memes? (They contain security questions.)",
      pre: { k: 7, pct: 30 }, post: { k: 18, pct: 75 },
      selections: { pre: { k: 7, of: 31, pct: 23 }, post: { k: 18, of: 26, pct: 70 } },
      popularPre: { label: "The memes are funny", k: 10, pct: 42 } }
  ];

  var N = 24;

  // Q10 interest, as printed. "None" is stated as zero at both times.
  var INTEREST = {
    levels: ["None", "Minimal", "Moderate", "High"],
    pre: [{ k: 0 }, { k: 4, pct: 17 }, { k: 11, pct: 46 }, { k: 7, pct: 30 }],
    post: [{ k: 0 }, { k: 0, pct: 0 }, { k: 7, pct: 30 }, { k: 15, pct: 63 }],
    anyPost: { k: 22, pct: 92 }
  };

  // Camp rating, 1 to 5 (n = 24).
  var RATING = [{ score: 1, k: 0 }, { score: 2, k: 0 }, { score: 3, k: 3, pct: 13 }, { score: 4, k: 6, pct: 25 }, { score: 5, k: 15, pct: 63 }];

  // The abstract's headline shares.
  var ABSTRACT = [
    { key: "recall", label: "Content recall", pre: 33, post: 96, body: "Q1: 8 and 23 of 24" },
    { key: "threat", label: "Threats in everyday life", pre: 22, post: 69, body: "Q9: 7 of 31 and 18 of 26 selections; 7 and 18 of 24 students" },
    { key: "high", label: "Highly interested", pre: 31, post: 65, body: "Q10: 7 and 15 students" }
  ];

  // Password example from the journal (five lowercase letters).
  var PASSWORD = { alphabet: 26, length: 5, printed: 11881376 };

  /* ------------------------------------------------------------ key spaces */

  var ALPHABETS = {
    bits: { label: "Bits (0 or 1)", symbols: "01" },
    digits: { label: "Digits", symbols: "0123456789" },
    lower: { label: "Lowercase letters", symbols: "abcdefghijklmnopqrstuvwxyz" },
    mixed: { label: "Letters and digits", symbols: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789" }
  };

  // Exact count s^L as a BigInt-free decimal string (s and L are small).
  function keySpace(s, L) {
    var digits = [1];
    for (var i = 0; i < L; i++) {
      var carry = 0;
      for (var j = 0; j < digits.length; j++) {
        var v = digits[j] * s + carry;
        digits[j] = v % 10; carry = Math.floor(v / 10);
      }
      while (carry) { digits.push(carry % 10); carry = Math.floor(carry / 10); }
    }
    return digits.reverse().join("");
  }

  function keySpaceNumber(s, L) { return Math.pow(s, L); }

  // The i-th key in counting order (0 is all first symbols).
  function keyAt(index, symbols, L) {
    var s = symbols.length, out = "";
    for (var i = 0; i < L; i++) { out = symbols[index % s] + out; index = Math.floor(index / s); }
    return out;
  }

  function indexOfKey(key, symbols) {
    var s = symbols.length, idx = 0;
    for (var i = 0; i < key.length; i++) {
      var d = symbols.indexOf(key[i]);
      if (d < 0) return -1;
      idx = idx * s + d;
    }
    return idx;
  }

  // Mulberry32: a small seeded generator, so a lock box can be replayed.
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

  function randomKey(symbols, L, rand) {
    var out = "";
    for (var i = 0; i < L; i++) out += symbols[Math.floor(rand() * symbols.length)];
    return out;
  }

  // Counting-order search: guesses needed to open a box with this key.
  function guessesToOpen(key, symbols) { var i = indexOfKey(key, symbols); return i < 0 ? -1 : i + 1; }

  // Expected guesses for a uniformly random key: (N + 1) / 2.
  function expectedGuesses(s, L) { return (Math.pow(s, L) + 1) / 2; }

  /* ------------------------------------------------------------ printed shares */

  function roundHalfUp(v) { return Math.floor(v + 0.5 + 1e-9); }

  // Counts k (0..n) that print as `pct` percent when rounded half up, or when truncated.
  function countsFor(pct, n) {
    var rounded = [], truncated = [];
    for (var k = 0; k <= n; k++) {
      var v = 100 * k / n;
      if (roundHalfUp(v) === pct) rounded.push(k);
      if (Math.floor(v + 1e-9) === pct) truncated.push(k);
    }
    return { rounded: rounded, truncated: truncated };
  }

  // How k of n prints: rounded and truncated whole percentages.
  function prints(k, n) {
    var v = 100 * k / n;
    return { exact: v, rounded: roundHalfUp(v), truncated: Math.floor(v + 1e-9) };
  }

  // Check a printed share against its count: "rounded", "truncated", or "neither".
  function check(k, n, pct) {
    var p = prints(k, n);
    if (p.rounded === pct) return "rounded";
    if (p.truncated === pct) return "truncated";
    return "neither";
  }

  // Denominators in [lo, hi] for which k of n prints as pct (rounded or truncated).
  function denominatorsFor(k, pct, lo, hi) {
    var out = [];
    for (var n = Math.max(lo, k || 1); n <= hi; n++) {
      var c = check(k, n, pct);
      if (c !== "neither") out.push({ n: n, how: c });
    }
    return out;
  }

  /* ------------------------------------------------------------ paired tables */

  function logFact(n) { var s = 0; for (var i = 2; i <= n; i++) s += Math.log(i); return s; }
  function logChoose(n, k) { return logFact(n) - logFact(k) - logFact(n - k); }

  // P(X <= k) for X ~ Binomial(n, 1/2).
  function binomCdfHalf(k, n) {
    if (k < 0) return 0;
    if (k >= n) return 1;
    var s = 0;
    for (var i = 0; i <= k; i++) s += Math.exp(logChoose(n, i) - n * Math.LN2);
    return Math.min(1, s);
  }

  // Exact McNemar test: two-sided binomial test of b improvements against c declines, p = 1/2.
  // With p = 1/2 the distribution is symmetric, so SciPy's two-sided p is 2 * P(X <= min(b, c)), capped at 1.
  function mcnemarExact(b, c) {
    var n = b + c;
    if (n === 0) return 1;
    return Math.min(1, 2 * binomCdfHalf(Math.min(b, c), n));
  }

  // Every 2 x 2 paired table with these totals: n students, a correct before, b correct after.
  function pairedTables(a, b, n) {
    var rows = [];
    for (var both = Math.max(0, a + b - n); both <= Math.min(a, b); both++) {
      var improved = b - both, declined = a - both, neither = n - a - b + both;
      rows.push({ both: both, improved: improved, declined: declined, neither: neither,
        p: mcnemarExact(improved, declined) });
    }
    return rows;
  }

  function pairedRange(a, b, n) {
    var t = pairedTables(a, b, n), lo = Infinity, hi = -Infinity;
    t.forEach(function (r) { lo = Math.min(lo, r.p); hi = Math.max(hi, r.p); });
    return { tables: t, pMin: lo, pMax: hi, minImproved: Math.max(0, b - a), maxImproved: t.length ? t[0].improved : 0 };
  }

  function sum(a) { var s = 0; for (var i = 0; i < a.length; i++) s += a[i]; return s; }

  var api = {
    PEOPLE: PEOPLE, LABS: LABS, THEMES: THEMES, ITEMS: ITEMS, N: N, INTEREST: INTEREST, RATING: RATING,
    ABSTRACT: ABSTRACT, PASSWORD: PASSWORD, ALPHABETS: ALPHABETS,
    keySpace: keySpace, keySpaceNumber: keySpaceNumber, keyAt: keyAt, indexOfKey: indexOfKey,
    rng: rng, randomKey: randomKey, guessesToOpen: guessesToOpen, expectedGuesses: expectedGuesses,
    countsFor: countsFor, prints: prints, check: check, denominatorsFor: denominatorsFor,
    binomCdfHalf: binomCdfHalf, mcnemarExact: mcnemarExact, pairedTables: pairedTables, pairedRange: pairedRange,
    sum: sum
  };
  root.OutreachEngine = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof self !== "undefined" ? self : this);

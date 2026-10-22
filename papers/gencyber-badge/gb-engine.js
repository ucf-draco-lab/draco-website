/*
  Engine for /papers/gencyber-badge/.
  Burrows and Borowczak, "Novel STEM Research Programs Could Minimize Attrition
  in Undergraduate Engineering," ASEE Annual Conference & Exposition 2019,
  Tampa, Florida (DOI 10.18260/1-2--33136).

  DATA holds the paper's printed values: the ten design requirements given to
  the two student researchers, the timeline and unit counts, the per-unit cost
  before and after redesign, the 50 hours of coding experience, and Tables 1
  and 2 (the participants' and the questioned peers' answers to three
  questions), plus the counts the Results text gives for the peers.

  The rest is the page's own:
    - pctChange(): percent change between two prices (reproduces the 40 percent);
    - batchCost(): cost of a run of units at a per-unit price;
    - tally(): counts of each answer in a printed column;
    - wilson(): Wilson score interval for a proportion;
    - clopperPearson(): exact binomial interval (by bisection on the binomial
      tail), for comparison at the researcher level;
    - FONT, textColumns(), scrollFrames(): a 5 x 5 LED font of the page's own
      design and the frames a micro:bit-style display would scroll through;
    - makeBadge(): a page-designed scoring badge that illustrates requirements
      8 to 10 (ranking and leveling, "secure enough" to resist a quick
      compromise, simple enough that a pattern can be found). The paper states
      the requirements only; it does not describe the students' code.
  Loads as a page script or in a Web Worker.
*/
(function (root) {
  "use strict";

  var DATA = {
    paper: {
      title: "Novel STEM Research Programs Could Minimize Attrition in Undergraduate Engineering",
      venue: "2019 ASEE Annual Conference & Exposition, Tampa, Florida",
      doi: "10.18260/1-2--33136"
    },
    researchers: 2,
    codingHours: 50,
    requirements: [
      { id: 1, short: "Housing", text: "Design a prototype housing for the Microbit/Motobit device, using all available resources." },
      { id: 2, short: "Nametag", text: "Identify the wearer, so the device works as a nametag." },
      { id: 3, short: "LED display", text: "Include an LED display that shows information such as the current score." },
      { id: 4, short: "Battery", text: "House and secure a battery." },
      { id: 5, short: "Wearable", text: "Be wearable, visible, and not too intrusive." },
      { id: 6, short: "3D printing", text: "Produce the housing with available 3D printing, on or off campus, in time for the deadlines." },
      { id: 7, short: "JavaScript", text: "Program the Microbit in JavaScript." },
      { id: 8, short: "Ranking", text: "Include a ranking and leveling system that keeps score during the camps." },
      { id: 9, short: "Security", text: "Be secure enough to resist a quick compromise, yet simple enough that patterns can be found eventually." },
      { id: 10, short: "Show the rank", text: "Show the ranking and leveling system on the LEDs." }
    ],
    // Order and wording follow the paper's Methods; dates are as printed.
    timeline: [
      { when: "Early February", what: "First meetings; the faculty contact hands over the Microbit and Motobit hardware and the deadlines", units: null },
      { when: "February to April", what: "Paper sketches, several discarded concepts, the chosen design modeled in SolidWorks, a first printed prototype, then three more iterations", units: null },
      { when: "Mid-April", what: "A prototype that meets every requirement", units: null },
      { when: "Mid-May", what: "First summer camp", units: 25 },
      { when: "June and July", what: "The following camps", units: 200 }
    ],
    cost: { first: 17.50, final: 10.50, printedPercent: 40 },
    questions: [
      { key: "enjoy", participant: "Was the experience enjoyable?", peer: "Does the experience sound enjoyable?" },
      { key: "internship", participant: "Was the program better (+), worse (−), or the same (=) as an internship?", peer: "Does the program sound better (+), worse (−), or the same (=) as an internship?" },
      { key: "continue", participant: "Did the program influence your decision to continue in engineering in a positive way?", peer: "Would the program influence your decision to continue in engineering in a positive way?" }
    ],
    // Table 1 prints each column as slash-separated answers, one per participant.
    table1: { enjoy: ["Yes", "Yes"], internship: ["+", "Unknown"], "continue": ["Yes", "Yes"] },
    // Table 2, five peers.
    table2: { enjoy: ["Yes", "Yes", "Yes", "Yes", "Yes"], internship: ["+", "+", "+", "-", "Unknown"], "continue": ["Yes", "Yes", "Yes", "Yes", "No"] },
    // Results text: "Four out of the seven students polled" rated the program as
    // meaningful as an internship or more; one disagreed; two answered unknown.
    // Limitations: five people took part in the public question session.
    peerText: { polled: 7, asGoodOrBetter: 4, worse: 1, unknown: 2, sessionLimitations: 5 },
    references: 6
  };

  /* ------------------------------------------------------------- arithmetic */

  function pctChange(from, to) { return (to - from) / from * 100; }
  function batchCost(units, price) { return Math.round(units * price * 100) / 100; }

  function tally(column) {
    var out = {};
    column.forEach(function (a) { out[a] = (out[a] || 0) + 1; });
    return out;
  }

  // Wilson score interval (95 percent by default).
  function wilson(k, n, z) {
    z = z || 1.959963984540054;
    if (n === 0) return { lo: 0, hi: 1 };
    var p = k / n, den = 1 + z * z / n;
    var mid = (p + z * z / (2 * n)) / den;
    var half = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / den;
    return { lo: Math.max(0, mid - half), hi: Math.min(1, mid + half) };
  }

  function logChoose(n, k) {
    var s = 0;
    for (var i = 1; i <= k; i++) s += Math.log(n - k + i) - Math.log(i);
    return s;
  }
  // P(X >= k) and P(X <= k) for X ~ Binomial(n, p).
  function binomUpper(k, n, p) {
    if (k <= 0) return 1;
    var s = 0;
    for (var i = k; i <= n; i++) s += Math.exp(logChoose(n, i) + i * Math.log(p) + (n - i) * Math.log(1 - p));
    return Math.min(1, s);
  }
  function binomLower(k, n, p) {
    if (k >= n) return 1;
    var s = 0;
    for (var i = 0; i <= k; i++) s += Math.exp(logChoose(n, i) + i * Math.log(p) + (n - i) * Math.log(1 - p));
    return Math.min(1, s);
  }
  function bisect(f, lo, hi) {
    for (var i = 0; i < 200; i++) {
      var mid = (lo + hi) / 2;
      if (f(mid)) hi = mid; else lo = mid;
    }
    return (lo + hi) / 2;
  }
  // Exact (Clopper-Pearson) 95 percent interval.
  function clopperPearson(k, n, alpha) {
    alpha = alpha || 0.05;
    var lo = k === 0 ? 0 : bisect(function (p) { return binomUpper(k, n, p) >= alpha / 2; }, 0, 1);
    var hi = k === n ? 1 : bisect(function (p) { return binomLower(k, n, p) <= alpha / 2; }, 0, 1);
    return { lo: lo, hi: hi };
  }

  /* ------------------------------------------------------- 5 x 5 LED font */

  // The page's own glyphs, drawn on a five-by-five grid like the micro:bit's.
  var FONT = {
    "A": [".###.", "#...#", "#####", "#...#", "#...#"],
    "B": ["####.", "#...#", "####.", "#...#", "####."],
    "C": [".####", "#....", "#....", "#....", ".####"],
    "D": ["####.", "#...#", "#...#", "#...#", "####."],
    "E": ["#####", "#....", "####.", "#....", "#####"],
    "F": ["#####", "#....", "####.", "#....", "#...."],
    "G": [".####", "#....", "#..##", "#...#", ".###."],
    "H": ["#...#", "#...#", "#####", "#...#", "#...#"],
    "I": ["###", ".#.", ".#.", ".#.", "###"],
    "J": ["..###", "...#.", "...#.", "#..#.", ".##.."],
    "K": ["#..#", "#.#.", "##..", "#.#.", "#..#"],
    "L": ["#...", "#...", "#...", "#...", "####"],
    "M": ["#...#", "##.##", "#.#.#", "#...#", "#...#"],
    "N": ["#...#", "##..#", "#.#.#", "#..##", "#...#"],
    "O": [".###.", "#...#", "#...#", "#...#", ".###."],
    "P": ["####.", "#...#", "####.", "#....", "#...."],
    "Q": [".###.", "#...#", "#.#.#", "#..#.", ".##.#"],
    "R": ["####.", "#...#", "####.", "#..#.", "#...#"],
    "S": [".####", "#....", ".###.", "....#", "####."],
    "T": ["#####", "..#..", "..#..", "..#..", "..#.."],
    "U": ["#...#", "#...#", "#...#", "#...#", ".###."],
    "V": ["#...#", "#...#", "#...#", ".#.#.", "..#.."],
    "W": ["#...#", "#...#", "#.#.#", "##.##", "#...#"],
    "X": ["#...#", ".#.#.", "..#..", ".#.#.", "#...#"],
    "Y": ["#...#", ".#.#.", "..#..", "..#..", "..#.."],
    "Z": ["#####", "...#.", "..#..", ".#...", "#####"],
    "0": [".##.", "#..#", "#..#", "#..#", ".##."],
    "1": [".#.", "##.", ".#.", ".#.", "###"],
    "2": ["###.", "...#", ".##.", "#...", "####"],
    "3": ["###.", "...#", ".##.", "...#", "###."],
    "4": ["#..#", "#..#", "####", "...#", "...#"],
    "5": ["####", "#...", "###.", "...#", "###."],
    "6": [".##.", "#...", "###.", "#..#", ".##."],
    "7": ["####", "...#", "..#.", ".#..", ".#.."],
    "8": [".##.", "#..#", ".##.", "#..#", ".##."],
    "9": [".##.", "#..#", ".###", "...#", ".##."],
    "-": ["...", "...", "###", "...", "..."],
    ":": [".", "#", ".", "#", "."],
    " ": ["..", "..", "..", "..", ".."]
  };

  function glyph(ch) {
    var g = FONT[ch] || FONT[String(ch).toUpperCase()];
    return g || FONT["-"];
  }
  // Columns of a string: each column is an array of five 0/1 values, one blank
  // column between characters.
  function textColumns(text) {
    var cols = [];
    String(text).split("").forEach(function (ch, idx) {
      var g = glyph(ch), w = g[0].length;
      if (idx > 0) cols.push([0, 0, 0, 0, 0]);
      for (var c = 0; c < w; c++) {
        var col = [];
        for (var r = 0; r < 5; r++) col.push(g[r].charAt(c) === "#" ? 1 : 0);
        cols.push(col);
      }
    });
    return cols;
  }
  // Frames of a left-scrolling message: the text enters from the right edge and
  // leaves past the left edge, one column per frame. Each frame is 5 rows x 5.
  function scrollFrames(text) {
    var blank = [0, 0, 0, 0, 0];
    var cols = [blank, blank, blank, blank, blank].concat(textColumns(text), [blank, blank, blank, blank, blank]);
    var frames = [];
    for (var s = 0; s + 5 <= cols.length; s++) {
      var f = [];
      for (var r = 0; r < 5; r++) {
        var row = [];
        for (var c = 0; c < 5; c++) row.push(cols[s + c][r]);
        f.push(row);
      }
      frames.push(f);
    }
    return frames;
  }
  // A level bar: level n of 5 lights the bottom n rows.
  function levelFrame(level) {
    var f = [];
    for (var r = 0; r < 5; r++) {
      var on = (4 - r) < level ? 1 : 0;
      f.push([on, on, on, on, on]);
    }
    return f;
  }

  /* ------------------------------------------- page-designed scoring badge */

  // Rules (the page's, for illustration only):
  //  - a camper earns a four-digit code for each solved challenge;
  //  - the badge accepts a code when its last digit equals the sum of the first
  //    three digits, modulo 10, and the code has not been used before;
  //  - each accepted code adds one point; every three points is a level, up to 5;
  //  - three wrong codes in a row lock the badge for lockSeconds.
  // One random code in ten passes the check, so guessing works eventually; the
  // lockout slows it, and the pattern is there to be found.
  function checkDigit(code) {
    var s = String(code);
    return (Number(s[0]) + Number(s[1]) + Number(s[2])) % 10;
  }
  function validFormat(code) { return /^[0-9]{4}$/.test(String(code)); }
  function passesCheck(code) {
    var s = String(code);
    return validFormat(s) && Number(s[3]) === checkDigit(s);
  }
  function makeBadge(opts) {
    opts = opts || {};
    var lockSeconds = opts.lockSeconds || 10, strikesToLock = opts.strikesToLock || 3, perLevel = opts.perLevel || 3;
    var st = { points: 0, strikes: 0, lockedUntil: 0, used: {}, log: [] };
    function level() { return Math.min(5, 1 + Math.floor(st.points / perLevel)); }
    function submit(code, now) {
      now = now || 0;
      var s = String(code), result;
      if (now < st.lockedUntil) result = "locked";
      else if (!validFormat(s)) result = "format";
      else if (st.used[s]) result = "reused";
      else if (passesCheck(s)) { st.used[s] = true; st.points += 1; st.strikes = 0; result = "accepted"; }
      else {
        st.strikes += 1; result = "rejected";
        if (st.strikes >= strikesToLock) { st.lockedUntil = now + lockSeconds; st.strikes = 0; result = "rejected-locked"; }
      }
      st.log.push({ code: s, result: result, t: now });
      return { result: result, points: st.points, level: level(), lockedUntil: st.lockedUntil };
    }
    return {
      submit: submit,
      state: function () { return { points: st.points, level: level(), strikes: st.strikes, lockedUntil: st.lockedUntil, log: st.log.slice() }; },
      reset: function () { st = { points: 0, strikes: 0, lockedUntil: 0, used: {}, log: [] }; }
    };
  }
  // Expected time for a guesser who tries random untried codes, given the
  // lockout (page's analysis). Each try takes trySeconds; success chance per
  // random try is 1/10.
  function guessTime(trySeconds, lockSeconds, strikesToLock) {
    var p = 0.1, q = 1 - p, k = strikesToLock;
    // Expected tries to first success is 1/p. Each run of k failures costs a lock.
    var expTries = 1 / p;
    // Expected number of completed lock windows before success: sum over j>=1 of P(first k*j tries all fail).
    var expLocks = 0;
    for (var j = 1; j < 400; j++) expLocks += Math.pow(q, k * j);
    return { tries: expTries, locks: expLocks, seconds: expTries * trySeconds + expLocks * lockSeconds };
  }

  function mulberry32(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  // A valid challenge code drawn at random (for the demo's "solve a challenge").
  function challengeCode(rng) {
    var a = Math.floor(rng() * 10), b = Math.floor(rng() * 10), c = Math.floor(rng() * 10);
    return "" + a + b + c + ((a + b + c) % 10);
  }

  var api = {
    DATA: DATA,
    pctChange: pctChange,
    batchCost: batchCost,
    tally: tally,
    wilson: wilson,
    clopperPearson: clopperPearson,
    binomUpper: binomUpper,
    binomLower: binomLower,
    FONT: FONT,
    textColumns: textColumns,
    scrollFrames: scrollFrames,
    levelFrame: levelFrame,
    checkDigit: checkDigit,
    passesCheck: passesCheck,
    makeBadge: makeBadge,
    guessTime: guessTime,
    challengeCode: challengeCode,
    mulberry32: mulberry32
  };
  root.GenCyberBadgeEngine = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof self !== "undefined" ? self : this);

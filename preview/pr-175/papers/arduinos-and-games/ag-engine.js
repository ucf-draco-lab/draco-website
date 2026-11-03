/*
  Engine for /papers/arduinos-and-games/.
  Burrows (Borowczak) and Borowczak, "Arduinos and Games: K-12 Teachers Explore
  Computer Science," ASEE Annual Conference & Exposition 2016
  (DOI 10.18260/p.26275).

  DATA holds the paper's printed values: the program (LASSI, 25 days, two
  computer science days analyzed), the activities and try-it stations of each
  day, participant counts, the March 2015 open-response counts, the June 2015
  perception results, and Table 3 (pre/post content test, N = 20).

  The rest is the page's own arithmetic:
    - pairedFromSummary(): paired t, p, and four effect-size conventions from
      two means, two standard deviations, and a correlation;
    - admissibleSums(): the whole-number totals (sum and sum of squares) whose
      mean and sample standard deviation round to a printed value;
    - scoreLists(): every multiset of N whole-number scores with a given sum and
      sum of squares, between 0 and a chosen maximum;
    - crossSums(): the sums of products (pre × post) whose correlation and paired
      t round to the printed r and t;
    - pairUp(): one pairing of a pre list with a post list that hits a target
      sum of products (seeded, so the same seed gives the same pairing);
    - simulateGame(): a timed model of the "What is coding?" sorting game for
      three team formations (the timings are the page's assumptions);
    - the t distribution through the regularized incomplete beta function.
  Loads as a page script or in a Web Worker.
*/
(function (root) {
  "use strict";

  var DATA = {
    program: {
      name: "LASSI (Launching Astronomy: Standards and STEM Integration)",
      days: 25,
      csDays: 2,
      hoursPerDay: 8,
      teachersTotal: 41,
      teachersAnalyzed: 33,
      funding: "Wyoming Department of Education Math and Science Partnership #WY140202"
    },
    days: [
      {
        id: "march", label: "CS Day 1", date: "March 2015", n: 11,
        activities: [
          { id: "coding", name: "“What is coding?”", detail: "About 50 city notes sorted into regions by the whole group, with one input person, one output person, and no talking once notes moved. After several trials the group settled on a diamond formation and sorted the stack in under a minute. The debrief named what they had built: an algorithm, and the efficiency and optimization that make one better." },
          { id: "netlogo", name: "NetLogo simulations", detail: "Agent-based models in four sciences: energy in a food chain (biology), wildfire spread (ecology), molecules (chemistry), and orbiting bodies (physics and astronomy), each discussed against the seven NGSS crosscutting concepts." },
          { id: "stations", name: "Try-it stations", detail: "Robot Turtles and Code Monkey Island (board games), Arduino boards, Make: it Component Kits 1 and 2 with the book Make: Electronics, and Khan Academy and Codecademy lessons." }
        ]
      },
      {
        id: "june", label: "CS Day 2", date: "June 2015", n: 22,
        activities: [
          { id: "makey", name: "Makey Makey kits", detail: "Circuit boards that turn any conductor into a key; teachers used fruit and play-doh as buttons." },
          { id: "stations2", name: "Try-it stations", detail: "An extension of the March stations, with Arduino systems again." },
          { id: "astro", name: "Astronomy connections", detail: "Discussion of mapping the sky, processing radio-wave emission data, and identifying the characteristics of quasars." }
        ]
      }
    ],
    march: {
      n: 11,
      netlogo: 6,       // "over half (n=6)" planned to use the NetLogo simulations
      newIdeas: 5,      // named Robot Turtles and the "What is coding?" activity as new ideas
      nothing: 6        // answered "Nothing" or only offered a compliment to the improvement question
    },
    june: {
      n: 22,
      rating: 4.4,           // mean session rating, five-point scale
      engagedOver75: 1.0,    // all teachers engaged more than 75 percent of the time
      veryUsefulMin: 0.70,   // at least 70 percent rated every activity "very useful"
      meaningful: 1.0,       // all rated the hands-on activities meaningful
      intendToUse: 1.0       // all intended to use at least some of the content
    },
    table3: {
      n: 20, date: "June 29",
      preMean: 2.45, preSD: 1.96,
      postMean: 8.70, postSD: 0.92,
      r: 0.14, t: 13.64, p: ".0000", d: 4.008
    }
  };

  /* ---------------------------------------------------------- special functions */

  function logGamma(x) {
    var g = 7, c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028,
      771.32342877765313, -176.61502916214059, 12.507343278686905,
      -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
    if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - logGamma(1 - x);
    x -= 1;
    var a = c[0], t = x + g + 0.5;
    for (var i = 1; i < g + 2; i++) a += c[i] / (x + i);
    return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
  }
  function betacf(a, b, x) {
    var MAXIT = 300, EPS = 3e-16, FPMIN = 1e-300;
    var qab = a + b, qap = a + 1, qam = a - 1, c = 1, d = 1 - qab * x / qap;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    d = 1 / d;
    var h = d;
    for (var m = 1; m <= MAXIT; m++) {
      var m2 = 2 * m, aa = m * (b - m) * x / ((qam + m2) * (a + m2));
      d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
      c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
      d = 1 / d; h *= d * c;
      aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
      d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
      c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
      d = 1 / d;
      var del = d * c; h *= del;
      if (Math.abs(del - 1) < EPS) break;
    }
    return h;
  }
  // Regularized incomplete beta I_x(a, b).
  function ibeta(x, a, b) {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    var bt = Math.exp(logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log(1 - x));
    if (x < (a + 1) / (a + b + 2)) return bt * betacf(a, b, x) / a;
    return 1 - bt * betacf(b, a, 1 - x) / b;
  }
  // Two-sided p for Student's t with df degrees of freedom.
  function tTwoSided(t, df) {
    return ibeta(df / (df + t * t), df / 2, 0.5);
  }

  /* --------------------------------------------------------- paired statistics */

  // Paired t from summary statistics, with four effect-size conventions:
  //   dz  = mean difference / SD of the differences (Cohen's d_z);
  //   drm = t * sqrt(2(1 - r) / n), the repeated-measures d of Dunlap et al. (1996)
  //         and Morris and DeShon (2002), which corrects d_z for the correlation;
  //   dav = mean difference / sqrt((s1^2 + s2^2) / 2) (pooled, ignores pairing);
  //   glass = mean difference / pre-test SD.
  function pairedFromSummary(o) {
    var n = o.n, md = o.m2 - o.m1;
    var vd = o.s1 * o.s1 + o.s2 * o.s2 - 2 * o.r * o.s1 * o.s2;
    var sd = Math.sqrt(Math.max(vd, 0));
    var t = md / (sd / Math.sqrt(n));
    return {
      md: md, sdDiff: sd, t: t, df: n - 1, p: tTwoSided(t, n - 1),
      dz: md / sd,
      drm: t * Math.sqrt(2 * (1 - o.r) / n),
      dav: md / Math.sqrt((o.s1 * o.s1 + o.s2 * o.s2) / 2),
      glass: md / o.s1
    };
  }

  // Exact statistics from the five sums of a set of paired whole-number scores.
  function pairedFromSums(s) {
    var n = s.n;
    var sxx = s.sxx - s.sx * s.sx / n, syy = s.syy - s.sy * s.sy / n, sxy = s.sxy - s.sx * s.sy / n;
    var s1 = Math.sqrt(sxx / (n - 1)), s2 = Math.sqrt(syy / (n - 1));
    var r = sxy / Math.sqrt(sxx * syy);
    var out = pairedFromSummary({ n: n, m1: s.sx / n, s1: s1, m2: s.sy / n, s2: s2, r: r });
    out.m1 = s.sx / n; out.m2 = s.sy / n; out.s1 = s1; out.s2 = s2; out.r = r;
    return out;
  }

  function roundsTo(x, printed, dp) {
    var half = 0.5 * Math.pow(10, -dp);
    return Math.abs(x - printed) <= half + 1e-12;
  }

  // Whole-number totals (sum, sum of squares) for n scores whose mean and sample
  // standard deviation round to the printed values (two decimals).
  function admissibleSums(n, mean, sd, dp) {
    dp = dp === undefined ? 2 : dp;
    var out = [];
    var sLo = Math.ceil((mean - 0.5 * Math.pow(10, -dp)) * n - 1e-9);
    var sHi = Math.floor((mean + 0.5 * Math.pow(10, -dp)) * n + 1e-9);
    for (var s = sLo; s <= sHi; s++) {
      if (!roundsTo(s / n, mean, dp)) continue;
      var lo = (sd - 0.5 * Math.pow(10, -dp)), hi = (sd + 0.5 * Math.pow(10, -dp));
      var qLo = Math.ceil(s * s / n + Math.max(lo, 0) * Math.max(lo, 0) * (n - 1) - 1e-9);
      var qHi = Math.floor(s * s / n + hi * hi * (n - 1) + 1e-9);
      for (var q = qLo; q <= qHi; q++) {
        var v = (q - s * s / n) / (n - 1);
        if (v >= 0 && roundsTo(Math.sqrt(v), sd, dp)) out.push({ sum: s, sumSq: q });
      }
    }
    return out;
  }

  // Every multiset of n whole-number scores in [0, max] with the given sum and
  // sum of squares, returned as sorted score lists (ascending).
  function scoreLists(n, sum, sumSq, max, limit) {
    var out = [], counts = new Array(max + 1);
    limit = limit || 100000;
    function rec(v, left, s, q) {
      if (out.length >= limit) return;
      if (v < 0) {
        if (left === 0 && s === sum && q === sumSq) {
          var list = [];
          for (var k = 0; k <= max; k++) for (var j = 0; j < counts[k]; j++) list.push(k);
          out.push(list);
        }
        return;
      }
      // Remaining scores are all <= v: prune on reachable sum and sum of squares.
      var needS = sum - s, needQ = sumSq - q;
      if (needS < 0 || needQ < 0) return;
      if (needS > left * v || needQ > left * v * v) return;
      if (v === 0) {
        if (needS === 0 && needQ === 0) { counts[0] = left; rec(-1, 0, s, q); counts[0] = 0; }
        return;
      }
      for (var c = Math.min(left, Math.floor(needS / v)); c >= 0; c--) {
        counts[v] = c;
        rec(v - 1, left - c, s + c * v, q + c * v * v);
      }
      counts[v] = 0;
    }
    for (var i = 0; i <= max; i++) counts[i] = 0;
    rec(max, n, 0, 0);
    return out;
  }

  // Sums of products that, with the given totals, reproduce the printed r and t.
  function crossSums(n, pre, post, rPrinted, tPrinted) {
    var sxx = pre.sumSq - pre.sum * pre.sum / n, syy = post.sumSq - post.sum * post.sum / n;
    var lo = Math.ceil(pre.sum * post.sum / n - Math.sqrt(sxx * syy)), hi = Math.floor(pre.sum * post.sum / n + Math.sqrt(sxx * syy));
    var out = [];
    for (var c = lo; c <= hi; c++) {
      var st = pairedFromSums({ n: n, sx: pre.sum, sxx: pre.sumSq, sy: post.sum, syy: post.sumSq, sxy: c });
      if (roundsTo(st.r, rPrinted, 2) && roundsTo(st.t, tPrinted, 2)) out.push({ sxy: c, stats: st });
    }
    return out;
  }

  /* ---------------------------------------------------------------- randomness */

  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function shuffle(arr, rand) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(rand() * (i + 1)), t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }

  // Pair pre[i] with post[perm[i]] so that the sum of products equals target.
  // Starts from a seeded random permutation; each step makes the single swap
  // that brings the sum closest to the target (random ties, random kicks when
  // stuck). Returns null if no pairing is found.
  function pairUp(pre, post, target, seed) {
    var n = pre.length, rand = mulberry32(seed || 1);
    var minS = 0, maxS = 0, a = pre.slice().sort(function (x, y) { return x - y; }), b = post.slice().sort(function (x, y) { return x - y; });
    for (var k = 0; k < n; k++) { maxS += a[k] * b[k]; minS += a[k] * b[n - 1 - k]; }
    if (target < minS || target > maxS) return null;
    for (var attempt = 0; attempt < 200; attempt++) {
      var y = shuffle(post.slice(), rand), s = 0;
      for (var i = 0; i < n; i++) s += pre[i] * y[i];
      for (var step = 0; step < 400 && s !== target; step++) {
        var best = Math.abs(s - target), bp = -1, bq = -1, ties = 0;
        for (var p = 0; p < n; p++) for (var q = p + 1; q < n; q++) {
          var d = Math.abs(s + (pre[p] - pre[q]) * (y[q] - y[p]) - target);
          if (d < best) { best = d; bp = p; bq = q; ties = 1; }
          else if (d === best && bp >= 0 && rand() < 1 / (++ties)) { bp = p; bq = q; }
        }
        if (bp < 0) { bp = Math.floor(rand() * n); bq = Math.floor(rand() * n); if (bp === bq) continue; }
        s += (pre[bp] - pre[bq]) * (y[bq] - y[bp]);
        var t = y[bp]; y[bp] = y[bq]; y[bq] = t;
      }
      if (s === target) return y;
    }
    return null;
  }

  /* ------------------------------------------------- the "What is coding?" game */

  // A list of 48 United States cities, 12 in each Census region. The paper used
  // about 50 notes, mostly United States cities; the list and the four regions
  // are the page's.
  var CITIES = {
    Northeast: ["Boston", "New York", "Philadelphia", "Pittsburgh", "Hartford", "Providence", "Burlington", "Portland ME", "Buffalo", "Newark", "Albany", "Manchester"],
    Midwest: ["Chicago", "Detroit", "Minneapolis", "St. Louis", "Kansas City", "Omaha", "Milwaukee", "Columbus", "Indianapolis", "Des Moines", "Fargo", "Sioux Falls"],
    South: ["Atlanta", "Miami", "Orlando", "Dallas", "Houston", "Nashville", "New Orleans", "Charlotte", "Richmond", "Memphis", "Louisville", "Little Rock"],
    West: ["Laramie", "Denver", "Seattle", "Phoenix", "Salt Lake City", "Boise", "Los Angeles", "San Francisco", "Las Vegas", "Albuquerque", "Billings", "Anchorage"]
  };
  var REGIONS = ["Northeast", "Midwest", "South", "West"];
  function deck(seed) {
    var all = [];
    REGIONS.forEach(function (r) { CITIES[r].forEach(function (c) { all.push({ city: c, region: r }); }); });
    return shuffle(all, mulberry32(seed || 7));
  }

  // Timing model (the page's assumptions, in model seconds):
  //   pass   = 1 s to hand one note to a neighbor;
  //   decide = 2 s to read a city and name its region;
  //   place  = 1 s to drop a note on a regional pile.
  // Each person handles one note at a time. Formations:
  //   "solo":    the input person reads, decides, and places every note alone;
  //   "line":    the input passes notes down a line of helpers who only pass;
  //              the output person decides and places every note;
  //   "diamond": the input deals notes without reading them to four sorters in
  //              turn; each sorter decides and passes to the output person, who
  //              places the note on the pile the sorter named.
  var COST = { pass: 1, decide: 2, place: 1 };
  function simulateGame(formation, seed, helpers) {
    var notes = deck(seed);
    helpers = helpers || 3;
    var events = [];   // { note, who, action, start, end }
    var busy = {};     // person -> time free
    function free(p) { return busy[p] || 0; }
    function act(note, who, action, ready, dur) {
      var start = Math.max(ready, free(who));
      var end = start + dur;
      busy[who] = end;
      events.push({ note: note, who: who, action: action, start: start, end: end });
      return end;
    }
    notes.forEach(function (n, i) {
      var t;
      if (formation === "solo") {
        t = act(i, "input", "decide", 0, COST.decide);
        act(i, "input", "place", t, COST.place);
      } else if (formation === "line") {
        t = act(i, "input", "pass", 0, COST.pass);
        for (var h = 0; h < helpers; h++) t = act(i, "helper" + h, "pass", t, COST.pass);
        t = act(i, "output", "decide", t, COST.decide);
        act(i, "output", "place", t, COST.place);
      } else {
        var s = "sorter" + (i % 4);
        t = act(i, "input", "pass", 0, COST.pass);
        t = act(i, s, "decide", t, COST.decide);
        t = act(i, s, "pass", t, COST.pass);
        act(i, "output", "place", t, COST.place);
      }
    });
    var total = 0, work = {};
    events.forEach(function (e) {
      total = Math.max(total, e.end);
      work[e.who] = (work[e.who] || 0) + (e.end - e.start);
    });
    var people = Object.keys(work);
    return { formation: formation, notes: notes, events: events, total: total, people: people, work: work };
  }

  var api = {
    DATA: DATA,
    CITIES: CITIES,
    REGIONS: REGIONS,
    COST: COST,
    deck: deck,
    simulateGame: simulateGame,
    pairedFromSummary: pairedFromSummary,
    pairedFromSums: pairedFromSums,
    admissibleSums: admissibleSums,
    scoreLists: scoreLists,
    crossSums: crossSums,
    pairUp: pairUp,
    roundsTo: roundsTo,
    tTwoSided: tTwoSided,
    ibeta: ibeta,
    mulberry32: mulberry32
  };
  root.ArduinosGamesEngine = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof self !== "undefined" ? self : this);

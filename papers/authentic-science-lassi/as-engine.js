/*
  Engine for /papers/authentic-science-lassi/.
  Burrows (Borowczak), DiPompeo, Myers, Hickox, Borowczak, French, and Schwortz,
  "Authentic Science Experiences: Pre-Collegiate Science Educators' Successes and
  Challenges During Professional Development," Problems of Education in the 21st
  Century 70:59-73, 2016 (DOI 10.33225/pec/16.70.59).

  DATA holds what the paper prints: participants and recruitment, the two-week
  design, the four highlighted research projects, the expert team, Table 1
  (sample quotes by theme and source), the three dated quotes on the engagement
  arc, and the stated content-test results. Pages 68 and 69 (Tables 2 and 3,
  Figures 1 and 2) could not be read for this page, so their values are absent.

  The rest is the page's own arithmetic:
    - keplerMass(): Kepler's third law with a in AU and P in years gives the
      central mass in solar masses (M = a^3 / P^2), reported in Earth masses;
      the real Galilean-moon orbits return Jupiter's mass, 317.8 Earth masses;
    - angularSize(): a = L / D in radians, and its inverse;
    - hubble(): v = c z with z = (lambda - lambda0) / lambda0 (the paper's
      equations), d = v / H0, and the relativistic velocity for comparison;
    - simulateSpectra(): nine seeded, simulated spectra (three stars, three
      galaxies, three quasars) for the sorting demo. Illustrative, not WIRO data;
    - pairedThresholds(): the smallest paired t, and the smallest standardized
      mean change d_z = t / sqrt(n), that reach a two-sided p for n teachers.
  Statistics functions are checked against SciPy (see the pull request).
  Loads as a page script or in a Web Worker.
*/
(function (root) {
  "use strict";

  var DATA = {
    n: 23, invited: 500, radiusKm: 645, radiusMi: 400,
    gender: [["Female", 18], ["Male", 5]],
    subject: [["Science", 21], ["Mathematics", 2]],
    band: [["Elementary (ages 5 to 10)", 17], ["Secondary (ages 11 to 18)", 6]],
    groups: 8, posters: 8, days: 10,
    experts: [["Physics and astronomy experts", 3], ["Computer science and engineering expert", 1], ["Graduate students", 2], ["Science education expert", 1]],
    activeAstronomers: 5,
    star: { name: "STAR telescope", detail: "16-inch Schmidt-Cassegrain on the roof of the University of Wyoming Physical Sciences building", when: "Every evening of the first week" },
    wiro: { name: "WIRO", detail: "Wyoming Infrared Observatory, 2.4 m primary mirror, Jelm Mountain, about 25 miles west of Laramie", altM: 2943.1, altFt: 9656, when: "First half of three nights (sunset to about midnight), three or four teachers each night, with expert observers; several nights were cloudy" },
    sessions: ["Stellar classification", "EM spectrum", "Gravity", "Foundations of computing", "Gas giants", "Hubble's law", "Doppler effect"],
    testTopics: ["Foundations of computing", "Galileoscopes", "Light, EM spectrum, and gravity", "Doppler effect", "Stellar classification", "Galaxies, quasars, and gas giants", "Hubble's law and remote observing"],
    tests: { count: 8, sig05: 8, sig00001: 5, dMin: 0.8 },
    projects: [
      { id: "jupiter", name: "The mass of Jupiter", site: "STAR", what: "Timed the four Galilean moons, used Jupiter's apparent diameter to set the scale, estimated each moon's orbit, and applied Kepler's third law (P² = a³) to find Jupiter's mass in Earth masses; repeated for each moon." },
      { id: "angle", name: "Angular size and distance", site: "STAR", what: "Photographed a quarter of known diameter and other objects at tape-measured distances to calibrate a = L/D; small objects were harder to size than large ones." },
      { id: "spectra", name: "Classifying spectra", site: "WIRO", what: "Sorted nine WIRO spectra, with SDSS spectra for comparison, into three stars, three galaxies, and three quasars." },
      { id: "hubble", name: "Hubble's law", site: "WIRO", what: "Measured the shift of known lines in the three galaxies and three quasars, v/c = (λ − λ₀)/λ₀, and estimated distances with d = v/H₀." }
    ],
    // Table 1: theme, then [interview, notebook, field notes].
    table1: [
      { theme: "Content knowledge", q: ["I need more of the basics.", "Repeated exposure to pretty much the same concepts – in different ways – day after day helped me…", "I thought over the years that astronomy research had declined or lost emphasis…"] },
      { theme: "Project guidance", q: ["More guidance on the project", "I feel that it would be more beneficial to tell us the project question or expectation on the first day.", "Not sure of expectations for the project…somewhat frustrated."] },
      { theme: "Concrete activities for the PD", q: ["I need more activities.", "I'm used to having the answers – a lot of unknowns is surprising. What do I do?", "I'd like more classroom ready activities focusing on astronomy."] },
      { theme: "Classroom support (activities and personnel)", q: ["I would like more ways to specifically take all of this info and apply it to my classroom.", "I have learned a lot of new information but how is it applicable for elementary aged students?", "I have an excitement now for teaching astronomy concepts in my classroom using STEM integration and projects like this."] },
      { theme: "Classroom lesson plans", q: ["I can't believe how easy it can be to use STEM in my classroom, and how real experiences can drive my student interest.", "I now have awesome astronomy lessons to use in my physical science class.", "I appreciate the time to make lesson plans."] },
      { theme: "Expert interaction", q: ["I began to understand things through the help of the experts… and the experiences.", "I have learned so much from the experts and really wish we had longer sessions with them.", "I love the guest speakers!"] },
      { theme: "Time management", q: ["Wow – the time involved to collect data!", "The first week was hard – knowing what to do and getting enough (or any) data for our STAR project due to weather!", "What if all the time I'm taking now will be wasted time, and that I will have to pedal faster…"] },
      { theme: "Surprises", q: ["My sense of 'uncomfortableness' with inquiry-based learning. I haven't had this experience in PDs before.", "The fact that I was able to guess my way to where we were going, but in the end I have much more…", "How in-depth I was able to go, and the amount of knowledge I gained without realizing it."] }
    ],
    sources: ["Informal interviews", "Community notebook", "Observational field notes"],
    // Results: what teachers named as benefits and as concerns.
    benefits: ["Content to take back to classrooms", "Lesson plans they created", "Interaction with experts"],
    concerns: ["Specific project guidance", "Time management", "Teaching the content", "Using project information in classrooms"],
    arc: [
      { day: 3, phase: "Beginning", text: "I learned (and understand) so much more than I knew before!" },
      { day: 6, phase: "Middle", text: "I understand the 'inquiry based' approach and the 'authentic research' opportunities, but quite honestly, this approach felt disconnect[ed] and highly unorganized." },
      { day: 10, phase: "End", text: "[I have] an excitement for teaching astronomy concepts in my classroom using STEM integration." }
    ],
    // The companion 2021 paper's account of the same summer (Education Sciences 11(1):21, Table 1 and Table 4).
    companion2021: {
      n: 22, sample: 21, elementary: 16, female: 16, male: 6,
      topics: [
        ["Foundations of computing", true], ["Galileoscopes", false], ["EM spectrum, gravity", true],
        ["Doppler effect and angular size", false], ["Stellar classification and gas giant planets", true],
        ["Galaxies, quasars, and gas giants' moons", true], ["Hubble's law, three-color images, and remote observation", true]
      ]
    }
  };

  /* ------------------------------------------------ physical constants */

  var C_KMS = 299792.458;          // speed of light, km/s
  var AU_KM = 149597870.7;         // IAU 2012
  var DAY_YR = 365.25;             // Julian year in days
  var SUN_EARTH = 332946.0487;     // solar mass in Earth masses (IAU 2015 nominal GM ratio)
  var R_JUP_KM = 71492;            // Jupiter equatorial radius
  var JUPITER_EARTH = 317.83;      // reference mass, Earth masses
  // Galilean moons: semi-major axis (km) and sidereal period (days), JPL mean elements.
  var MOONS = [
    { name: "Io", aKm: 421700, pDay: 1.769138 },
    { name: "Europa", aKm: 671034, pDay: 3.551181 },
    { name: "Ganymede", aKm: 1070412, pDay: 7.154553 },
    { name: "Callisto", aKm: 1882709, pDay: 16.689017 }
  ];
  var QUARTER_MM = 24.26;          // US quarter diameter (US Mint)

  function keplerMass(aKm, pDay) {
    var a = aKm / AU_KM, p = pDay / DAY_YR;
    var msun = a * a * a / (p * p);
    return { solar: msun, earth: msun * SUN_EARTH };
  }
  // Error propagation for M ∝ a^3 / P^2: fractional errors in a and P.
  function keplerSensitivity(fa, fp) {
    return Math.pow(1 + fa, 3) / Math.pow(1 + fp, 2) - 1;
  }

  function angularSize(L, D) { return L / D; }                 // radians
  function sizeFromAngle(theta, D) { return theta * D; }
  var RAD_DEG = 180 / Math.PI;

  function hubble(lambdaObs, lambdaRest, H0) {
    var z = (lambdaObs - lambdaRest) / lambdaRest;
    var v = C_KMS * z;                                           // the paper's v/c = z
    var rel = C_KMS * ((1 + z) * (1 + z) - 1) / ((1 + z) * (1 + z) + 1);
    return { z: z, v: v, d: v / H0, vRel: rel, dRel: rel / H0 };
  }

  /* ------------------------------------------------ simulated spectra */

  function mulberry32(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function gauss(rng) {
    var u = 0, v = 0;
    while (u === 0) u = rng();
    while (v === 0) v = rng();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  var LINES = {
    star: [["Hα", 656.28, -0.45, 1.2], ["Hβ", 486.13, -0.35, 1.0], ["Hγ", 434.05, -0.3, 0.9], ["Na D", 589.3, -0.18, 0.8]],
    galaxy: [["Ca K", 393.37, -0.35, 0.9], ["Ca H", 396.85, -0.3, 0.9], ["G band", 430.8, -0.15, 1.2], ["Mg b", 517.5, -0.18, 1.2], ["Na D", 589.3, -0.12, 1.0], ["Hα", 656.28, 0.25, 0.8]],
    quasar: [["Lyα", 121.57, 2.4, 6], ["C IV", 154.9, 1.1, 7], ["C III]", 190.9, 0.7, 7], ["Mg II", 279.8, 0.8, 8], ["Hβ", 486.13, 0.6, 9], ["Hα", 656.28, 1.2, 10]]
  };
  var REF = { star: "Hα", galaxy: "Ca K", quasar: "Mg II" };

  // Nine spectra on 380 to 920 nm (the SDSS spectrograph range).
  function simulateSpectra(seed) {
    var rng = mulberry32(seed || 2015);
    var kinds = ["star", "star", "star", "galaxy", "galaxy", "galaxy", "quasar", "quasar", "quasar"];
    var zs = { star: [0, 0, 0], galaxy: [0.018 + 0.01 * rng(), 0.045 + 0.02 * rng(), 0.09 + 0.03 * rng()], quasar: [0.55 + 0.2 * rng(), 1.05 + 0.2 * rng(), 1.6 + 0.3 * rng()] };
    var temps = [9500 + 2000 * rng(), 6500 + 800 * rng(), 5200 + 500 * rng()];
    var count = { star: 0, galaxy: 0, quasar: 0 };
    var out = kinds.map(function (k) {
      var i = count[k]++, z = zs[k][i], grid = [], flux = [], noise = k === "quasar" ? 0.05 : 0.03;
      for (var w = 380; w <= 920; w += 2) {
        var f;
        if (k === "star") {
          var T = temps[i], x = 1.4388e7 / (w * T), x0 = 1.4388e7 / (600 * T);
          f = Math.pow(600 / w, 5) * (Math.exp(x0) - 1) / (Math.exp(x) - 1);
        } else if (k === "galaxy") {
          var wr = w / (1 + z);
          f = 0.35 + 0.65 / (1 + Math.exp(-(wr - 400) / 18)) * (0.9 + 0.1 * Math.min(1, (wr - 400) / 400));
        } else {
          f = 0.6 * Math.pow(w / 600, -0.5);
        }
        LINES[k].forEach(function (ln) {
          var c = ln[1] * (1 + z), s = ln[3] * (1 + z);
          f += (k === "quasar" ? 0.6 : (k === "star" ? f : 1) ) * ln[2] * Math.exp(-0.5 * Math.pow((w - c) / s, 2));
        });
        grid.push(w); flux.push(Math.max(0, f + noise * gauss(rng)));
      }
      var ref = LINES[k].filter(function (ln) { return ln[0] === REF[k]; })[0];
      return { kind: k, z: z, grid: grid, flux: flux, ref: { name: ref[0], rest: ref[1], obs: ref[1] * (1 + z) },
        lines: LINES[k].map(function (ln) { return { name: ln[0], rest: ln[1], obs: ln[1] * (1 + z) }; }).filter(function (l) { return l.obs > 380 && l.obs < 920; }) };
    });
    // Shuffle order so the kinds are mixed.
    for (var j = out.length - 1; j > 0; j--) { var r = Math.floor(rng() * (j + 1)), t = out[j]; out[j] = out[r]; out[r] = t; }
    return out;
  }

  /* ------------------------------------------------ statistics */

  function lgamma(x) {
    var c = [76.18009172947146, -86.50532032941677, 24.01409824083091,
      -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
    var y = x, tmp = x + 5.5;
    tmp -= (x + 0.5) * Math.log(tmp);
    var ser = 1.000000000190015;
    for (var j = 0; j < 6; j++) ser += c[j] / ++y;
    return -tmp + Math.log(2.5066282746310005 * ser / x);
  }
  function betacf(a, b, x) {
    var MAXIT = 300, EPS = 3e-16, FPMIN = 1e-300;
    var qab = a + b, qap = a + 1, qam = a - 1, c = 1, d = 1 - qab * x / qap;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    d = 1 / d; var h = d;
    for (var m = 1; m <= MAXIT; m++) {
      var m2 = 2 * m, aa = m * (b - m) * x / ((qam + m2) * (a + m2));
      d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
      c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
      d = 1 / d; h *= d * c;
      aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
      d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
      c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
      d = 1 / d; var del = d * c; h *= del;
      if (Math.abs(del - 1) < EPS) break;
    }
    return h;
  }
  function ibeta(a, b, x) {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    var bt = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x));
    if (x < (a + 1) / (a + b + 2)) return bt * betacf(a, b, x) / a;
    return 1 - bt * betacf(b, a, 1 - x) / b;
  }
  function tTwoSided(t, df) { return ibeta(df / 2, 0.5, df / (df + t * t)); }
  // Smallest |t| with two-sided p <= alpha (bisection on a monotone tail).
  function tCritical(alpha, df) {
    var lo = 0, hi = 1000;
    for (var i = 0; i < 200; i++) {
      var mid = (lo + hi) / 2;
      if (tTwoSided(mid, df) > alpha) lo = mid; else hi = mid;
    }
    return hi;
  }
  function pairedThresholds(n, alpha) {
    var t = tCritical(alpha, n - 1);
    return { t: t, dz: t / Math.sqrt(n) };
  }
  // p of a paired test whose standardized mean change is d_z.
  function pFromDz(dz, n) { return tTwoSided(dz * Math.sqrt(n), n - 1); }
  // d_av = d_z * sqrt(2 (1 - r)) for pre-post correlation r (equal SDs).
  function dAvFromDz(dz, r) { return dz * Math.sqrt(2 * (1 - r)); }

  var API = {
    DATA: DATA, MOONS: MOONS, C_KMS: C_KMS, AU_KM: AU_KM, R_JUP_KM: R_JUP_KM, SUN_EARTH: SUN_EARTH,
    JUPITER_EARTH: JUPITER_EARTH, QUARTER_MM: QUARTER_MM, RAD_DEG: RAD_DEG,
    keplerMass: keplerMass, keplerSensitivity: keplerSensitivity,
    angularSize: angularSize, sizeFromAngle: sizeFromAngle, hubble: hubble,
    simulateSpectra: simulateSpectra, mulberry32: mulberry32,
    tTwoSided: tTwoSided, tCritical: tCritical, pairedThresholds: pairedThresholds,
    pFromDz: pFromDz, dAvFromDz: dAvFromDz
  };
  root.LassiEngine = API;
  if (typeof module !== "undefined" && module.exports) module.exports = API;
})(typeof self !== "undefined" ? self : this);

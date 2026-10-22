/*
  STEM partnerships page engine (/papers/stem-partnerships/).

  Two parts:
  1. STUDY: the cases, people, lessons, themes, and negotiation episodes as the
     paper reports them (Borowczak, Kilty, and Borowczak, Education Sciences
     15(7):893, 2025). Nothing here is computed; every entry traces to the text.
  2. ATMOSPHERE: the 1976 U.S. Standard Atmosphere (geopotential layers to
     47 km) and the speed of sound in dry air, c = sqrt(gamma R T). The Speed of
     Sound team's post-launch lesson had students graph balloon temperature,
     pressure, and humidity and relate them to the speed of sound; this is the
     reference those graphs can be checked against. Verified against the
     `ambiance` Python package and the 1976 tables (see PR notes).

  Loads as a page script or in a Worker.
*/
(function (root) {
  "use strict";

  /* ------------------------------------------------------------ atmosphere */

  var G0 = 9.80665;          // m/s^2
  var R = 287.05287;         // J/(kg K), dry air (USSA 1976: R*/M0)
  var GAMMA = 1.4;
  var RE = 6356766;          // m, effective Earth radius used for geopotential

  // Base geopotential altitude (m), base temperature (K), lapse rate (K/m).
  var LAYERS = [
    { h: 0,     T: 288.15, L: -0.0065 },
    { h: 11000, T: 216.65, L: 0 },
    { h: 20000, T: 216.65, L: 0.001 },
    { h: 32000, T: 228.65, L: 0.0028 },
    { h: 47000, T: 270.65, L: 0 }
  ];
  var P0 = 101325;

  // Base pressures, computed once from the layer chain.
  (function fillPressures() {
    LAYERS[0].p = P0;
    for (var i = 1; i < LAYERS.length; i++) {
      var b = LAYERS[i - 1], dh = LAYERS[i].h - b.h;
      LAYERS[i].p = layerPressure(b, dh);
    }
  })();

  function layerPressure(b, dh) {
    if (b.L === 0) return b.p * Math.exp(-G0 * dh / (R * b.T));
    return b.p * Math.pow(b.T / (b.T + b.L * dh), G0 / (R * b.L));
  }

  function geopotential(z) { return RE * z / (RE + z); }

  // z: geometric altitude in meters, 0 to 47 000.
  function atmosphere(z) {
    var h = geopotential(Math.max(0, Math.min(z, 47000)));
    var b = LAYERS[0];
    for (var i = LAYERS.length - 1; i >= 0; i--) { if (h >= LAYERS[i].h) { b = LAYERS[i]; break; } }
    var dh = h - b.h;
    var T = b.T + b.L * dh;
    var p = layerPressure(b, dh);
    var rho = p / (R * T);
    return { z: z, h: h, T: T, p: p, rho: rho, c: soundSpeed(T) };
  }

  function soundSpeed(T) { return Math.sqrt(GAMMA * R * T); }

  /* ------------------------------------------------------------ study data */

  // Mullinix (2001) as the paper applies it.
  var LADDER = [
    { key: "pre", label: "Pre-partnership", short: "Pre", body: "Limited, specifically defined relationships; trust just beginning; partners work on their own." },
    { key: "p", label: "Partnership (little p)", short: "little p", body: "Partners work toward mutually valued objectives; in this study, a written agreement on roles." },
    { key: "P", label: "Partnership (big P)", short: "big P", body: "The fullest level in the framework. No team in either case reached it." }
  ];

  // Placement as the paper reports it (Sections 3.3.3 and 5). `pos` is a
  // drawing position on the ladder (0 = pre-partnership, 1 = little p), not a score.
  var TEAMS = [
    {
      key: "coleman", name: "Coleman", school: "Coleman Secondary School", years: "2010–2011",
      setting: "Urban, Midwest; about 300 students", who: "Two teachers, one engineer, one educational liaison",
      level: "pre", pos: 0.0,
      verdict: "Pre-partnership, the most limited of the three",
      lessons: 5, classMin: null, ages: "upper secondary students",
      evidence: [
        { dim: "Time together", text: "About 20 hours a week, the most of any team. The engineer was in class about twice a week." },
        { dim: "In the classroom", text: "The engineer was not integrated as a co-teacher; in one observed class he and the teacher never worked at the same table at the same time." },
        { dim: "Decisions", text: "One teacher: “I can’t really support that shared decisions was a big factor in our partnership.”" },
        { dim: "Feedback", text: "The engineer wanted more feedback on his lesson plans and never said so directly." },
        { dim: "Respect", text: "Each partner respected something different: the teachers’ classroom management, the engineer’s hard work, his engineering knowledge." },
        { dim: "Did they call it a partnership?", text: "All three did. One teacher: “I’ve enjoyed the partnership, and I think that the students truly benefit from that.”" }
      ]
    },
    {
      key: "cosmic", name: "Cosmic Radiation", school: "Rysen Secondary School", years: "2018–2019",
      setting: "Rural, Western U.S.; students aged 15 to 18", who: "Three undergraduates: mechanical engineering, physics and astrophysics, social studies education",
      level: "p", pos: 1.0,
      verdict: "Partnership with a little p in most areas, the strongest of the three",
      lessons: 4, classMin: 90, ages: "students aged 15 to 18",
      evidence: [
        { dim: "Time together", text: "Met weekly in a dedicated space and socialized outside the project." },
        { dim: "In the classroom", text: "Each had a role: the engineering major coded the Arduino with a small group, the physics major taught content one on one, the education major kept lessons on track." },
        { dim: "Decisions", text: "Students formed two competing groups for a “space race,” designing radiation shielding launched side by side." },
        { dim: "Trust", text: "Mutual trust and respect; the classroom teacher gave the team full autonomy." },
        { dim: "Afterward", text: "The three “reunited to present their work at a local education conference.”" }
      ]
    },
    {
      key: "sound", name: "Speed of Sound", school: "Saber Secondary School", years: "2018–2019",
      setting: "Rural, Western U.S.; students aged 11 to 14", who: "Three undergraduates: electrical engineering, physics and astrophysics, English education",
      level: "pre", pos: 0.38,
      verdict: "Pre-partnership with limited little-p aspects",
      lessons: 5, classMin: 50, ages: "students aged 11 to 14",
      evidence: [
        { dim: "Time together", text: "Largely worked on their own; the engineering and physics majors often reviewed lesson plans minutes before teaching." },
        { dim: "In the classroom", text: "The education major led; the others stood to the side. The classroom teacher stepped in for management and clarification." },
        { dim: "Decisions", text: "The education major said the others “kicked me out of their meetings” while they built the payload." },
        { dim: "Explaining", text: "The physics major “didn’t know how far to go down the rabbit hole” with younger students." },
        { dim: "Students’ hands", text: "The students “did not build or touch anything that went into space.”" }
      ]
    }
  ];

  var PEOPLE = [
    { team: "coleman", name: "Alec", role: "Engineer", detail: "Civil engineering Ph.D. student with industry experience", gender: "Male" },
    { team: "coleman", name: "Darryn", role: "Teacher", detail: "Physical science", gender: "Female" },
    { team: "coleman", name: "Emma", role: "Teacher", detail: "STEM technology", gender: "Female" },
    { team: "coleman", name: "(liaison)", role: "Educational liaison", detail: "Education graduate student and researcher", gender: "Female" },
    { team: "cosmic", name: "Ray", role: "Engineering", detail: "Mechanical engineering major", gender: "Male" },
    { team: "cosmic", name: "Rose", role: "Science", detail: "Physics and astrophysics major", gender: "Female" },
    { team: "cosmic", name: "Randy", role: "Education", detail: "Secondary social studies education major", gender: "Male" },
    { team: "sound", name: "Seth", role: "Engineering", detail: "Electrical engineering major", gender: "Male" },
    { team: "sound", name: "Sam", role: "Science", detail: "Physics and astrophysics major", gender: "Male" },
    { team: "sound", name: "Sandy", role: "Education", detail: "Secondary English education major", gender: "Female" }
  ];

  // Study design checkpoints, in time order.
  var STEPS = [
    { when: "Dec 2009", title: "First ethics approval", body: "University of Cincinnati IRB protocol 09-10-28-01E, approved December 7, 2009, covers the first case.", case: 1 },
    { when: "2010–2011", title: "Case 1: Coleman, one school year", body: "An engineer and two teachers, with an educational liaison, build and teach five engineering lessons in an urban secondary school. Data: teacher and engineer focus groups, individual interviews with all three, field notes from 12 full-day observations, and the partners’ own emails.", case: 1 },
    { when: "2018–2019", title: "Case 2: two balloon teams, one project year", body: "Six undergraduates in two teams of three build high-altitude balloon payloads and turn them into lessons for two rural schools: four lessons on cosmic radiation (90-minute classes) and five on the speed of sound (50-minute classes). Data: individual interviews with each undergraduate and field notes from observations.", case: 2 },
    { when: "Nov 2019", title: "Second ethics approval", body: "University of Wyoming IRB protocol 20191101BA02573, approved November 1, 2019, covers the second case. The research was funded in part by National Science Foundation grant DUE-1821566.", case: 2 },
    { when: "2025", title: "Cross-case analysis", body: "The authors compare the cases a decade apart through a socio-cultural lens and Mullinix’s three levels of partnership, asking what partnership meant to each person and how partners negotiated the work.", case: 0 }
  ];

  // Four themes of partnership meaning (Section 3.3); "shared" per cross-case analysis.
  var THEMES = [
    { name: "Lesson creation", coleman: true, cosmic: true, sound: true, note: "Lessons were the product every partner talked about first." },
    { name: "Communication", coleman: true, cosmic: true, sound: true, note: "Strong in Cosmic Radiation; email-heavy at Coleman; thin in Speed of Sound." },
    { name: "Incorporating engineering content", coleman: true, cosmic: true, sound: true, note: "Teachers valued the engineer’s knowledge; undergraduates struggled to pitch it to younger students." },
    { name: "Increasing student learning", coleman: true, cosmic: null, sound: null, note: "Case 2 did not assess student learning, so the theme could not be compared." }
  ];

  // Negotiation episodes (Sections 3.4 and 4). `kind`: what the paper calls it.
  var EPISODES = [
    { topic: "supplies", team: "coleman", title: "No fume hood, no nitric acid", body: "A planned nitric acid demonstration was dropped because the classroom had no fume hood; the partners “ultimately came to the decision together.”", kind: "agreed" },
    { topic: "supplies", team: "coleman", title: "Two days’ notice", body: "“It was mutually decided that requests should be made at least two days in advance,” after last-minute requests frustrated a teacher.", kind: "agreed" },
    { topic: "lessons", team: "coleman", title: "Coke for acid", body: "The engineer emailed that “we will just use Coke” to change the pH of the concrete cubes. The teacher did not respond.", kind: "truncated" },
    { topic: "lessons", team: "coleman", title: "A few minor changes", body: "A teacher made “a few minor changes” to the engineer’s lesson by email, without back-and-forth.", kind: "truncated" },
    { topic: "time", team: "coleman", title: "When to teach which lesson", body: "Teachers and engineer set when his lessons ran against the school’s pacing guides; only the teachers raised scheduling.", kind: "agreed" },
    { topic: "lessons", team: "coleman", title: "Unspoken expectations", body: "The engineer expected detailed feedback on his plans and never told the teachers.", kind: "missing" },
    { topic: "lessons", team: "sound", title: "From magnetic fields to sound", body: "The team first planned to measure electromagnetic fields at altitude, then switched to the speed of sound when the education major doubted she could build lessons around it.", kind: "agreed" },
    { topic: "supplies", team: "sound", title: "Buying parts for a dropped idea", body: "“Seth spoke of purchasing supplies to investigate Sam’s initial idea,” a compromise he never called one.", kind: "compromise" },
    { topic: "time", team: "sound", title: "Plans read minutes before class", body: "The engineering and physics majors often reviewed lesson plans minutes before teaching them.", kind: "missing" },
    { topic: "lessons", team: "cosmic", title: "Roles agreed in writing", body: "Participants who reached a little-p partnership “signed a written agreement focusing on roles” as part of the grant work.", kind: "agreed" }
  ];

  var KINDS = {
    agreed: "Settled together",
    compromise: "Compromise",
    truncated: "Truncated: no back-and-forth",
    missing: "Never negotiated"
  };

  var api = {
    atmosphere: atmosphere, soundSpeed: soundSpeed, geopotential: geopotential,
    LAYERS: LAYERS, GAMMA: GAMMA, R: R,
    LADDER: LADDER, TEAMS: TEAMS, PEOPLE: PEOPLE, STEPS: STEPS, THEMES: THEMES, EPISODES: EPISODES, KINDS: KINDS
  };
  root.PartnershipEngine = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof self !== "undefined" ? self : this);

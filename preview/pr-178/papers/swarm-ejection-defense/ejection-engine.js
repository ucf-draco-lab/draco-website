/*
  Ejection defenses for /papers/swarm-ejection-defense/.

  Wolf and Borowczak, "Defensive Strategies for Autonomous Decentralized
  Lightweight Swarms," IEEE ICCE-Berlin 2020. The paper adds three ejection
  techniques to the SHARKS protocol so regular agents can slip past a corralling
  adversarial swarm, and scores each run by how far the regular agents' average
  spacing sits from the ideal spacing after 1,000 epochs.

  Builds on sharks-engine.js (copied unchanged from /papers/sharks-swarms/), which
  implements the SHARKS rules and the adversaries of Algorithms 1 to 4. The
  authors' NetLogo model is not public; every detail the paper leaves open is
  listed in ASSUMPTIONS and on the page.

  Loads as a page script (window.EjectionEngine, after sharks-engine.js) and in
  Node (module.exports).
*/
(function (root) {
  "use strict";

  var S = (typeof module !== "undefined" && module.exports) ? require("./sharks-engine.js") : root.SharksEngine;
  var Swarm = S.Swarm, wdelta = S.wdelta;

  var TECHNIQUES = ["none", "basic", "dist", "perc"];
  var TECH_LABEL = { none: "None", basic: "Basic", dist: "Dynamic distance", perc: "Dynamic percentage" };

  var ASSUMPTIONS = [
    "SHARKS rules, world, adversary entry, and adversary speed (0.2 d) follow this site's SHARKS page; steps are d:c = 3:4 (0.75 and 1 unit).",
    "Adversaries enter on the first epoch at which every regular agent is inside the ring, and the run continues for 1,000 epochs after that.",
    "Ejecting means turning to face the target and moving the ejection distance toward it, if the destination patch is free, after the agent's Dispersion and Center Rules for that epoch. The Center Rule brings it back on later epochs.",
    "Agents start ejecting on the first stable epoch, the epoch the adversaries enter; dynamic techniques use their formulas from then on, so their initial values never matter (the paper's Table III shows the same).",
    "Each agent records the distance to its nearest neighbor on the first stable epoch as its expected distance. Its error each epoch is (expected - current) / expected, clipped to the range 0 to 1, so only crowding counts.",
    "Dynamic distance: eject (delta / 2) * err^(1/4) units with the initial likelihood. Dynamic percentage: eject the initial distance with likelihood 5 * err^(1/4) percent.",
    "The security metric: ideal = 2 delta sin(180 / n) for n regular agents; average = the mean distance from each regular agent to its nearest regular neighbor; error = |ideal - average| / ideal, read on the last epoch. A second reading (ringSpacing) averages the distances between agents that are neighbors around the ring instead.",
    "A run whose regular swarm never becomes stable within 2,000 epochs is reported as not measured."
  ];

  function idealDistance(delta, n) { return 2 * delta * Math.sin(Math.PI / n); }

  /*
    opts: everything Swarm takes, plus
      ejection: "none" | "basic" | "dist" | "perc"
      ejDist:   initial ejection distance (4, 5, or 6 in the paper)
      ejPct:    initial ejection likelihood in percent (6, 8, or 10)
  */
  function DefendedSwarm(opts) {
    opts = opts || {};
    this.ejection = opts.ejection || "none";
    this.ejDist = opts.ejDist == null ? 5 : opts.ejDist;
    this.ejPct = opts.ejPct == null ? 8 : opts.ejPct;
    this.ejections = 0;          // ejection moves made by regular agents
    this.ejectTrail = [];        // agents that ejected this epoch (for drawing)
    Swarm.call(this, opts);
    for (var i = 0; i < this.agents.length; i++) this.agents[i].expect = 0;
  }
  DefendedSwarm.prototype = Object.create(Swarm.prototype);
  DefendedSwarm.prototype.constructor = DefendedSwarm;

  // Distance from agent a to the nearest other regular agent.
  DefendedSwarm.prototype.nnRegular = function (a) {
    var bd = Infinity, list = this.agents;
    for (var i = 0; i < list.length; i++) {
      var b = list[i];
      if (b === a || b.adv) continue;
      var dx = wdelta(b.x - a.x), dy = wdelta(b.y - a.y), q = dx * dx + dy * dy;
      if (q < bd) bd = q;
    }
    return Math.sqrt(bd);
  };

  // Nearest-neighbor distance to any agent (what an agent can sense).
  DefendedSwarm.prototype.nnAny = function (a) {
    var nb = this.nearest(a, false);
    if (!nb) return Infinity;
    var dx = wdelta(nb.x - a.x), dy = wdelta(nb.y - a.y);
    return Math.sqrt(dx * dx + dy * dy);
  };

  // This agent's congestion error (0 to 1).
  DefendedSwarm.prototype.err = function (a) {
    if (!(a.expect > 0)) return 0;
    var e = (a.expect - this.nnAny(a)) / a.expect;
    return e < 0 ? 0 : (e > 1 ? 1 : e);
  };

  // Likelihood (0 to 1) and distance of an ejection this epoch.
  DefendedSwarm.prototype.plan = function (a) {
    var t = this.ejection;
    if (t === "none") return { p: 0, dist: 0, err: 0 };
    if (this.stableAt < 0) return { p: 0, dist: 0, err: 0 };
    if (t === "basic") return { p: this.ejPct / 100, dist: this.ejDist, err: 0 };
    var e = this.err(a), q = Math.pow(e, 0.25);
    if (t === "dist") return { p: this.ejPct / 100, dist: (this.delta / 2) * q, err: e };
    return { p: 5 * q / 100, dist: this.ejDist, err: e };
  };

  DefendedSwarm.prototype.eject = function (a) {
    var pl = this.plan(a);
    if (pl.p <= 0 || pl.dist <= 0) return false;
    if (this.rand() >= pl.p) return false;
    var dx = -wdelta(a.x), dy = -wdelta(a.y);
    if (dx === 0 && dy === 0) return false;
    var h = Math.atan2(dx, dy) * 180 / Math.PI;
    a.h = h < 0 ? h + 360 : h;
    var step = Math.min(pl.dist, Math.sqrt(dx * dx + dy * dy) - 0.5);   // never onto the target's patch
    if (step <= 0) return false;
    if (!this.freeAhead(a, step)) return false;
    this.move(a, step);
    this.ejections++;
    return true;
  };

  DefendedSwarm.prototype.step = function (trace) {
    var order = this.agents.slice(), i, actions = trace ? {} : null;
    for (i = order.length - 1; i > 0; i--) { var j = this.randInt(i + 1), t = order[i]; order[i] = order[j]; order[j] = t; }
    this.ejectTrail = [];
    for (i = 0; i < order.length; i++) {
      var a = order[i], d, c, ej = false;
      if (this.order === "dc") { d = this.dispersionRule(a); c = this.centerRule(a); }
      else { c = this.centerRule(a); d = this.dispersionRule(a); }
      if (!a.adv && this.ejection !== "none") { ej = this.eject(a); if (ej) this.ejectTrail.push(a.id); }
      if (actions) actions[a.id] = { center: c, dispersion: d, eject: ej };
    }
    this.ticks++;
    var stable = this.regularStable();
    if (stable && this.stableAt < 0) {
      this.stableAt = this.ticks;
      for (i = 0; i < this.agents.length; i++) if (!this.agents[i].adv) this.agents[i].expect = this.nnAny(this.agents[i]);
    }
    if (this.adversaries && this.launchAt < 0 && this.stableAt >= 0) {
      if (this.advDelay === "stability" || (this.advDelay === "stability20" && this.ticks >= this.stableAt + 20)) this.launch();
    }
    this.measuring = this.adversaries > 0 && this.launchAt >= 0 && this.stableAt >= 0;
    if (this.measuring) {
      this.accessNow = this.largestGap();
      if (this.accessNow > this.access) this.access = this.accessNow;
    }
    return actions;
  };

  // The paper's security metric for the current epoch (0 to 1).
  DefendedSwarm.prototype.spacing = function () {
    var n = 0, sum = 0;
    for (var i = 0; i < this.agents.length; i++) {
      var a = this.agents[i];
      if (a.adv) continue;
      sum += this.nnRegular(a); n++;
    }
    var ideal = idealDistance(this.delta, n), avg = n ? sum / n : 0;
    return { ideal: ideal, average: avg, error: ideal > 0 ? Math.abs(ideal - avg) / ideal : 0 };
  };

  // Alternative reading: mean distance between angularly consecutive regular agents.
  DefendedSwarm.prototype.ringSpacing = function () {
    var list = [];
    for (var i = 0; i < this.agents.length; i++) {
      var a = this.agents[i];
      if (a.adv) continue;
      list.push({ t: Math.atan2(wdelta(a.x), wdelta(a.y)), x: wdelta(a.x), y: wdelta(a.y) });
    }
    var n = list.length;
    list.sort(function (p, q) { return p.t - q.t; });
    var sum = 0;
    for (i = 0; i < n; i++) {
      var p = list[i], q = list[(i + 1) % n];
      sum += Math.sqrt((p.x - q.x) * (p.x - q.x) + (p.y - q.y) * (p.y - q.y));
    }
    var ideal = idealDistance(this.delta, n), avg = n ? sum / n : 0;
    return { ideal: ideal, average: avg, error: ideal > 0 ? Math.abs(ideal - avg) / ideal : 0 };
  };

  // One experiment: run to stability (cap 2,000), launch adversaries, run 1,000
  // more epochs, return the error in percent (null if never stable).
  function runExperiment(opts, after, cap) {
    after = after == null ? 1000 : after;
    cap = cap || 2000;
    var o = {}; for (var k in opts) o[k] = opts[k];
    if (o.advDelay == null) o.advDelay = "stability";
    var s = new DefendedSwarm(o);
    if (s.failed) return null;
    while (s.launchAt < 0 && s.ticks < cap) s.step(false);
    if (s.launchAt < 0) return null;
    var end = s.launchAt + after;
    var sumErr = 0, nErr = 0;
    while (s.ticks < end) {
      s.step(false);
      if (s.ticks > end - 100) { sumErr += s.spacing().error; nErr++; }
    }
    var sp = s.spacing();
    return {
      error: 100 * sp.error, ringError: 100 * s.ringSpacing().error, errorLast100: 100 * sumErr / nErr, average: sp.average, ideal: sp.ideal,
      access: 100 * s.access, stableAt: s.stableAt, ejections: s.ejections
    };
  }

  // The paper's full factorial design (11,664 experiments).
  var DESIGN = {
    n: [8, 16, 32, 64], adversaries: [3, 5, 7], delta: [12, 16, 20], epsilon: [2, 4, 6],
    r: [5, 20, 45], ejection: TECHNIQUES, ejDist: [4, 5, 6], ejPct: [6, 8, 10]
  };
  function designSize() {
    var s = 1;
    for (var k in DESIGN) s *= DESIGN[k].length;
    return s;
  }

  var api = {
    Engine: S, DefendedSwarm: DefendedSwarm, runExperiment: runExperiment, idealDistance: idealDistance,
    TECHNIQUES: TECHNIQUES, TECH_LABEL: TECH_LABEL, ASSUMPTIONS: ASSUMPTIONS, DESIGN: DESIGN, designSize: designSize
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.EjectionEngine = api;
})(typeof self !== "undefined" ? self : this);

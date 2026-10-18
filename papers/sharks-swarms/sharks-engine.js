/*
  SHARKS swarm engine for /papers/sharks-swarms/.

  A JavaScript reading of the SHARKS protocol (Cooley, Wolf, and Borowczak,
  IEEE ISC2 2018) and the adversarial swarm built on it (Wolf, Cooley, and
  Borowczak, IEEE ISC2 2019). The authors ran both in NetLogo; their model is
  not public, so this file follows the algorithms as printed (Algorithms 1 to 4)
  and fills unstated details with NetLogo defaults. Every filled-in detail is
  listed in ASSUMPTIONS and on the page.

  Loads as a page script (window.SharksEngine) and in Node (module.exports).
*/
(function (root) {
  "use strict";

  // A NetLogo world of 57 x 57 unit patches that wraps at its edges, target at
  // the center patch. The papers do not give the world size; 57 fits the 2018
  // capacity results (Table V) best among the sizes tried. Line starts are 35
  // patches long, the papers' stated limit for linear and collinear starts.
  var MAXP = 28, SIZE = 2 * MAXP + 1, NP = SIZE * SIZE;
  function setWorld(maxp) { MAXP = maxp; SIZE = 2 * MAXP + 1; NP = SIZE * SIZE; api.MAXP = MAXP; api.SIZE = SIZE; }

  var ASSUMPTIONS = [
    "World: 57 by 57 unit patches with wrapping edges (NetLogo's default topology), target at the center; the size is fitted to the 2018 capacity table.",
    "Line starts are 35 patches long, centered on the target's column (linear, 20 units above the target) or row (collinear, through it); boxes are 10 by 10 patches.",
    "One agent per patch: a move happens only if no other agent stands on the destination patch.",
    "Each epoch, every agent applies the Dispersion Rule and then the Center Rule (the order Figure 1 of the 2018 paper describes), agents taking turns in a new random order each epoch (NetLogo's ask).",
    "Ratios d:c of 3:4 move 0.75 and 1 unit per epoch; 1:1 moves 1 and 1.",
    "Stable means every regular agent lies within delta plus or minus epsilon of the target.",
    "Adversaries enter together on random free patches of a 3 by 3 block centered on a random point of the ideal circle.",
    "Percent access is the largest angular gap between consecutive regular agents, as a share of the full circle, over every epoch after the regular swarm is first stable and the adversaries are in the field."
  ];

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

  function wrap(v) {
    // map to [-MAXP - 0.5, MAXP + 0.5)
    var w = v + MAXP + 0.5;
    w = w - SIZE * Math.floor(w / SIZE);
    return w - MAXP - 0.5;
  }
  function wdelta(d) {
    // shortest wrapped difference
    return d - SIZE * Math.round(d / SIZE);
  }
  function patchIndex(x, y) {
    var px = Math.round(wrap(x)), py = Math.round(wrap(y));
    if (px > MAXP) px -= SIZE;
    if (py > MAXP) py -= SIZE;
    return (py + MAXP) * SIZE + (px + MAXP);
  }

  var DEG = Math.PI / 180;

  /*
    opts: n (regular agents), delta, epsilon, c, d, r (degrees), init
    ("random" | "box" | "linear" | "collinear"), box ("center" | "corner" |
    "side" | "topbottom"), seed, adversaries (count), advDelay ("none" |
    "stability" | "stability20"), advScale (adversary dispersion factor, 0.2).
  */
  function Swarm(opts) {
    opts = opts || {};
    this.n = opts.n == null ? 16 : opts.n;
    this.delta = opts.delta == null ? 12 : opts.delta;
    this.epsilon = opts.epsilon == null ? 4 : opts.epsilon;
    this.c = opts.c == null ? 1 : opts.c;
    this.d = opts.d == null ? 0.75 : opts.d;
    this.r = opts.r == null ? 20 : opts.r;
    this.init = opts.init || "random";
    this.box = opts.box || "center";
    this.adversaries = opts.adversaries || 0;
    this.advDelay = opts.advDelay || "stability";
    this.advScale = opts.advScale == null ? 0.2 : opts.advScale;
    this.order = opts.order || "dc";
    this.seed = opts.seed == null ? 1 : opts.seed;
    this.rand = mulberry32(this.seed * 2654435761 + 12345);
    this.agents = [];
    this.occ = new Int32Array(NP);
    this.ticks = 0;
    this.stableAt = -1;      // first epoch at which every regular agent is in the band
    this.launchAt = -1;      // epoch at which adversaries entered
    this.access = 0;         // largest percent access seen so far (0 to 1)
    this.accessNow = 0;
    this.accessSum = 0;      // for the time-averaged gap
    this.accessN = 0;
    this.measuring = false;
    this.failed = false;     // could not place all agents
    this.setup();
  }

  Swarm.prototype.randInt = function (n) { return Math.floor(this.rand() * n); };

  Swarm.prototype.place = function (px, py, adv) {
    var idx = (py + MAXP) * SIZE + (px + MAXP);
    if (this.occ[idx]) return false;
    if (px === 0 && py === 0) return false; // the target's patch
    this.occ[idx]++;
    this.agents.push({ x: px, y: py, h: this.randInt(360), adv: !!adv, id: this.agents.length });
    return true;
  };

  Swarm.prototype.candidates = function () {
    var out = [], x, y, i;
    if (this.init === "random") {
      for (y = -MAXP; y <= MAXP; y++) for (x = -MAXP; x <= MAXP; x++) out.push([x, y]);
    } else if (this.init === "linear") {
      // a horizontal line 20 units above the target (wraps in a 35-unit world)
      var ly = Math.round(wrap(20));
      for (x = -17; x <= 17; x++) out.push([x, ly]);
    } else if (this.init === "collinear") {
      for (y = -17; y <= 17; y++) out.push([0, y]);
    } else {
      // 10 x 10 boxes: center, a corner, a side, or top/bottom
      var cx = 0, cy = 0, lo = -MAXP, hi = MAXP - 9;
      var spot = this.box;
      if (spot === "corner") { cx = this.rand() < 0.5 ? lo : hi; cy = this.rand() < 0.5 ? lo : hi; }
      else if (spot === "side") { cx = this.rand() < 0.5 ? lo : hi; cy = -5; }
      else if (spot === "topbottom") { cx = -5; cy = this.rand() < 0.5 ? lo : hi; }
      else { cx = -5; cy = -5; }
      for (y = cy; y < cy + 10; y++) for (x = cx; x < cx + 10; x++) out.push([x, y]);
    }
    for (i = out.length - 1; i > 0; i--) {
      var j = this.randInt(i + 1), t = out[i]; out[i] = out[j]; out[j] = t;
    }
    return out;
  };

  Swarm.prototype.setup = function () {
    var cand = this.candidates(), k = 0;
    while (this.agents.length < this.n && k < cand.length) { this.place(cand[k][0], cand[k][1], false); k++; }
    if (this.agents.length < this.n) this.failed = true;
    if (this.adversaries && this.advDelay === "none") this.launch();
  };

  Swarm.prototype.launch = function () {
    var a = this.rand() * 2 * Math.PI;
    var cx = Math.round(this.delta * Math.sin(a)), cy = Math.round(this.delta * Math.cos(a));
    var spots = [], x, y;
    for (y = -1; y <= 1; y++) for (x = -1; x <= 1; x++) spots.push([cx + x, cy + y]);
    for (var i = spots.length - 1; i > 0; i--) { var j = this.randInt(i + 1), t = spots[i]; spots[i] = spots[j]; spots[j] = t; }
    var placed = 0;
    for (i = 0; i < spots.length && placed < this.adversaries; i++) {
      var px = Math.round(wrap(spots[i][0])), py = Math.round(wrap(spots[i][1]));
      if (this.place(px, py, true)) placed++;
    }
    // a crowded circle: fall back to the nearest free patches
    var ring = 2;
    while (placed < this.adversaries && ring < SIZE) {
      for (y = -ring; y <= ring && placed < this.adversaries; y++) for (x = -ring; x <= ring && placed < this.adversaries; x++) {
        if (Math.max(Math.abs(x), Math.abs(y)) !== ring) continue;
        if (this.place(Math.round(wrap(cx + x)), Math.round(wrap(cy + y)), true)) placed++;
      }
      ring++;
    }
    this.launchAt = this.ticks;
  };

  Swarm.prototype.dist = function (a) {
    var dx = wdelta(a.x), dy = wdelta(a.y);
    return Math.sqrt(dx * dx + dy * dy);
  };

  // heading from (x1, y1) toward (x2, y2), NetLogo convention (0 = north, clockwise)
  function towards(x1, y1, x2, y2) {
    var dx = wdelta(x2 - x1), dy = wdelta(y2 - y1);
    if (dx === 0 && dy === 0) return null;
    var h = Math.atan2(dx, dy) / DEG;
    return h < 0 ? h + 360 : h;
  }

  Swarm.prototype.freeAhead = function (a, dist) {
    var nx = a.x + dist * Math.sin(a.h * DEG), ny = a.y + dist * Math.cos(a.h * DEG);
    var idx = patchIndex(nx, ny), own = patchIndex(a.x, a.y);
    var others = this.occ[idx] - (idx === own ? 1 : 0);
    return others <= 0;
  };

  Swarm.prototype.move = function (a, dist) {
    var from = patchIndex(a.x, a.y);
    a.x = wrap(a.x + dist * Math.sin(a.h * DEG));
    a.y = wrap(a.y + dist * Math.cos(a.h * DEG));
    var to = patchIndex(a.x, a.y);
    if (to !== from) { this.occ[from]--; this.occ[to]++; }
  };

  Swarm.prototype.nearest = function (a, advOnly) {
    var best = null, bd = Infinity, list = this.agents;
    for (var i = 0; i < list.length; i++) {
      var b = list[i];
      if (b === a || (advOnly && !b.adv)) continue;
      var dx = wdelta(b.x - a.x), dy = wdelta(b.y - a.y), q = dx * dx + dy * dy;
      if (q < bd) { bd = q; best = b; }
    }
    return best;
  };

  // Algorithms 1 and 3: hold delta +/- epsilon from the target.
  Swarm.prototype.centerRule = function (a) {
    var dist = this.dist(a);
    var h = towards(a.x, a.y, 0, 0);
    if (h === null) return "none";
    a.h = h;
    if (this.delta - dist > this.epsilon) {
      if (this.freeAhead(a, -this.c)) { this.move(a, -this.c); return "back"; }
      return "blocked";
    }
    if (this.delta - dist < -this.epsilon) {
      if (this.freeAhead(a, this.c)) { this.move(a, this.c); return "forward"; }
      return "blocked";
    }
    return "in";
  };

  // Algorithms 2 and 4: face the nearest neighbor, turn 180 + r clockwise, move.
  Swarm.prototype.dispersionRule = function (a) {
    var nb = this.nearest(a, a.adv);
    if (!nb) return "none";
    var h = towards(a.x, a.y, nb.x, nb.y);
    if (h === null) h = a.h;
    a.h = (h + 180 + this.r) % 360;
    if (a.adv) { this.move(a, this.d * this.advScale); return "pushed"; }
    if (this.freeAhead(a, this.d)) { this.move(a, this.d); return "moved"; }
    return "blocked";
  };

  Swarm.prototype.regularStable = function () {
    var lo = this.delta - this.epsilon, hi = this.delta + this.epsilon;
    for (var i = 0; i < this.agents.length; i++) {
      var a = this.agents[i];
      if (a.adv) continue;
      var dd = this.dist(a);
      if (dd < lo || dd > hi) return false;
    }
    return true;
  };

  // Largest angular gap between consecutive regular agents, as a share of 360 degrees.
  Swarm.prototype.largestGap = function () {
    var angles = [];
    for (var i = 0; i < this.agents.length; i++) {
      var a = this.agents[i];
      if (a.adv) continue;
      angles.push(Math.atan2(wdelta(a.x), wdelta(a.y)));
    }
    if (angles.length < 2) return 1;
    angles.sort(function (p, q) { return p - q; });
    var g = angles[0] + 2 * Math.PI - angles[angles.length - 1];
    for (i = 1; i < angles.length; i++) g = Math.max(g, angles[i] - angles[i - 1]);
    return g / (2 * Math.PI);
  };

  Swarm.prototype.gapArc = function () {
    // start and end bearings (radians, NetLogo convention) of the largest gap
    var list = [];
    for (var i = 0; i < this.agents.length; i++) if (!this.agents[i].adv) list.push(Math.atan2(wdelta(this.agents[i].x), wdelta(this.agents[i].y)));
    if (list.length < 2) return null;
    list.sort(function (p, q) { return p - q; });
    var best = list[0] + 2 * Math.PI - list[list.length - 1], from = list[list.length - 1], to = list[0] + 2 * Math.PI;
    for (i = 1; i < list.length; i++) {
      var g = list[i] - list[i - 1];
      if (g > best) { best = g; from = list[i - 1]; to = list[i]; }
    }
    return { from: from, to: to, share: best / (2 * Math.PI) };
  };

  // One epoch. Returns per-agent actions when `trace` is true.
  Swarm.prototype.step = function (trace) {
    var order = this.agents.slice(), i, actions = trace ? {} : null;
    for (i = order.length - 1; i > 0; i--) { var j = this.randInt(i + 1), t = order[i]; order[i] = order[j]; order[j] = t; }
    for (i = 0; i < order.length; i++) {
      var a = order[i];
      var d, c;
      if (this.order === "dc") { d = this.dispersionRule(a); c = this.centerRule(a); }
      else { c = this.centerRule(a); d = this.dispersionRule(a); }
      if (actions) actions[a.id] = { center: c, dispersion: d };
    }
    this.ticks++;
    var stable = this.regularStable();
    if (stable && this.stableAt < 0) this.stableAt = this.ticks;
    if (this.adversaries && this.launchAt < 0 && this.stableAt >= 0) {
      if (this.advDelay === "stability" || (this.advDelay === "stability20" && this.ticks >= this.stableAt + 20)) this.launch();
    }
    this.measuring = this.adversaries > 0 && this.launchAt >= 0 && this.stableAt >= 0;
    if (this.measuring) {
      this.accessNow = this.largestGap();
      if (this.accessNow > this.access) this.access = this.accessNow;
      this.accessSum += this.accessNow;
      this.accessN++;
    }
    return actions;
  };

  // Run to stability (efficiency and capacity experiments). Returns the epoch, or 0 if none by `cap`.
  function epochsToStability(opts, cap) {
    var s = new Swarm(opts);
    if (s.failed) return { epochs: 0, failed: true };
    if (s.regularStable()) return { epochs: 0, failed: false, already: true };
    cap = cap || 2000;
    while (s.ticks < cap) {
      s.step(false);
      if (s.stableAt >= 0) return { epochs: s.stableAt, failed: false };
    }
    return { epochs: 0, failed: false, capped: true };
  }

  // Run an adversarial experiment for `rounds` epochs. Returns percent access
  // (0 to 100): the largest gap seen and the time-averaged gap, or null if the
  // regular swarm never became stable, so the attack was never measured.
  function percentAccess(opts, rounds) {
    var s = new Swarm(opts);
    if (s.failed) return null;
    rounds = rounds || 10000;
    while (s.ticks < rounds) s.step(false);
    if (!s.accessN) return null;
    return { max: 100 * s.access, mean: 100 * s.accessSum / s.accessN, stableAt: s.stableAt };
  }

  // Area of the stability region, the ring delta +/- epsilon: 4 pi delta epsilon.
  function stabilityArea(delta, epsilon) {
    return Math.PI * ((delta + epsilon) * (delta + epsilon) - (delta - epsilon) * (delta - epsilon));
  }

  var api = {
    MAXP: MAXP, SIZE: SIZE, ASSUMPTIONS: ASSUMPTIONS,
    Swarm: Swarm, epochsToStability: epochsToStability, percentAccess: percentAccess,
    stabilityArea: stabilityArea, mulberry32: mulberry32, wdelta: wdelta, setWorld: setWorld
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.SharksEngine = api;
})(typeof self !== "undefined" ? self : this);

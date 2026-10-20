/*
  SHARKS 3-D swarm engine for /papers/sharks-3d/.

  A JavaScript reading of the SHARKS protocol as extended to three dimensions
  in Wolf, Cooley, Fantl, and Borowczak, "Secure and Resilient Swarms:
  Autonomous Decentralized Lightweight UAVs to the Rescue," IEEE Consumer
  Electronics Magazine 9(4), 2020 (Algorithm 1, Center Rule; Algorithm 2,
  Dispersion Rule with pitch). The authors' simulation is not public, so this
  file follows the printed algorithms and fills unstated details with the
  choices in ASSUMPTIONS, which the page lists.

  With dims = 2 (no height, no tilt) the engine makes the same moves and the
  same random draws as /papers/sharks-swarms/sharks-engine.js, the site's
  2-D SHARKS engine, so the two can be checked against each other run for run.

  Loads as a page script (window.Sharks3D), in a Web Worker, and in Node.
*/
(function (root) {
  "use strict";

  var DEG = Math.PI / 180;

  var ASSUMPTIONS = [
    "Field: a 33 by 33 by 33 cube of unit voxels that wraps at its faces (NetLogo 3D's default), target at the center voxel. The magazine does not give the size; 33 fits its averages best among sizes from 29 to 37.",
    "One agent per voxel: a move happens only if no other agent occupies the destination voxel.",
    "Each epoch, every agent applies the Dispersion Rule and then the Center Rule, agents taking turns in a new random order each epoch.",
    "Center Rule: the agent faces the target (heading and pitch) and steps c units forward or back when it is outside delta plus or minus epsilon; inside the shell it steps onto the ideal sphere, never past it (as on the site's 2-D page).",
    "Dispersion Rule: the agent takes the compass bearing of its nearest neighbor, adds 180 + r degrees, levels its nose, tilts it t degrees toward the target's height, and steps d units.",
    "Stability is the share of agents inside the shell delta plus or minus epsilon; the swarm is stable when that share is 100 percent.",
    "Boxes are 10 by 10 by 10 voxels. Lines keep the 2-D definitions in the target's horizontal plane: linear is a 35-voxel line 20 units to one side of the target (it wraps in a 33-voxel field), collinear is a 35-voxel line through the target.",
    "Shell half-width epsilon = 4 (the magazine names delta = 8 and 12 but not epsilon); steps of 2 and 3 units; tilts of 0, 10, 20, and 30 degrees."
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

  /*
    opts: dims (3 | 2), maxp (half-width of the field), n, delta, epsilon,
    c, d, r (degrees), t (tilt, degrees), init ("random" | "linear" |
    "collinear" | "box"), box ("center" | "face" | "edge" | "corner"; in 2-D
    also "side" | "topbottom"), seed, ring ("seek" | "band"),
    lineLen (default 35), boxSize (default 10), lineHeight (default 20).
  */
  function Swarm(opts) {
    opts = opts || {};
    this.dims = opts.dims === 2 ? 2 : 3;
    this.M = opts.maxp == null ? 16 : opts.maxp;
    this.S = 2 * this.M + 1;
    this.n = opts.n == null ? 16 : opts.n;
    this.delta = opts.delta == null ? 12 : opts.delta;
    this.epsilon = opts.epsilon == null ? 4 : opts.epsilon;
    this.c = opts.c == null ? 3 : opts.c;
    this.d = opts.d == null ? 2 : opts.d;
    this.r = opts.r == null ? 20 : opts.r;
    this.t = this.dims === 2 ? 0 : (opts.t == null ? 10 : opts.t);
    this.init = opts.init || "random";
    this.box = opts.box || "center";
    this.ring = opts.ring || "seek";
    this.lineLen = opts.lineLen == null ? 35 : opts.lineLen;
    this.boxSize = opts.boxSize == null ? 10 : opts.boxSize;
    this.lineHeight = opts.lineHeight == null ? 20 : opts.lineHeight;
    this.lines = opts.lines || "plane";   // "plane": the 2-D layouts laid in the target's horizontal plane; "vertical": "above" means +z
    this.seed = opts.seed == null ? 1 : opts.seed;
    this.rand = mulberry32(this.seed * 2654435761 + 12345);
    this.agents = [];
    var nz = this.dims === 3 ? this.S : 1;
    this.occ = new Int32Array(this.S * this.S * nz);
    this.ticks = 0;
    this.reached = { 68: -1, 95: -1, 100: -1 };
    this.stableAt = -1;
    this.failed = false;
    this.setup();
  }

  Swarm.prototype.wrap = function (v) {
    var w = v + this.M + 0.5;
    w = w - this.S * Math.floor(w / this.S);
    return w - this.M - 0.5;
  };
  Swarm.prototype.wdelta = function (d) { return d - this.S * Math.round(d / this.S); };
  Swarm.prototype.cell = function (v) {
    var p = Math.round(this.wrap(v));
    if (p > this.M) p -= this.S;
    return p + this.M;
  };
  Swarm.prototype.index = function (x, y, z) {
    var i = this.cell(y) * this.S + this.cell(x);
    if (this.dims === 3) i += this.cell(z) * this.S * this.S;
    return i;
  };

  Swarm.prototype.randInt = function (n) { return Math.floor(this.rand() * n); };

  Swarm.prototype.place = function (px, py, pz) {
    var idx = this.index(px, py, pz);
    if (this.occ[idx]) return false;
    if (px === 0 && py === 0 && pz === 0) return false; // the target's voxel
    this.occ[idx]++;
    this.agents.push({ x: px, y: py, z: pz, h: this.randInt(360), p: 0, id: this.agents.length });
    return true;
  };

  Swarm.prototype.candidates = function () {
    var out = [], x, y, z, i, M = this.M, half = Math.floor(this.lineLen / 2);
    var B = this.boxSize, lo = -M, hi = M - (B - 1), mid = -Math.floor(B / 2);
    var self = this;
    function edgePick() { return self.rand() < 0.5 ? lo : hi; }
    if (this.dims === 2) {
      // identical to the 2-D page's candidate order and draws
      if (this.init === "random") {
        for (y = -M; y <= M; y++) for (x = -M; x <= M; x++) out.push([x, y, 0]);
      } else if (this.init === "linear") {
        var ly = Math.round(this.wrap(this.lineHeight));
        for (x = -half; x <= half; x++) out.push([x, ly, 0]);
      } else if (this.init === "collinear") {
        for (y = -half; y <= half; y++) out.push([0, y, 0]);
      } else {
        var cx = 0, cy = 0, spot = this.box;
        if (spot === "corner") { cx = edgePick(); cy = edgePick(); }
        else if (spot === "side" || spot === "face" || spot === "edge") { cx = edgePick(); cy = mid; }
        else if (spot === "topbottom") { cx = mid; cy = edgePick(); }
        else { cx = mid; cy = mid; }
        for (y = cy; y < cy + B; y++) for (x = cx; x < cx + B; x++) out.push([x, y, 0]);
      }
    } else {
      if (this.init === "random") {
        for (z = -M; z <= M; z++) for (y = -M; y <= M; y++) for (x = -M; x <= M; x++) out.push([x, y, z]);
      } else if (this.init === "linear") {
        // a horizontal line lineHeight units above the target
        var lz = Math.round(this.wrap(this.lineHeight));
        if (this.lines === "plane") for (x = -half; x <= half; x++) out.push([x, lz, 0]);
        else for (x = -half; x <= half; x++) out.push([x, 0, lz]);
      } else if (this.init === "collinear") {
        // a vertical line through the target
        if (this.lines === "plane") for (y = -half; y <= half; y++) out.push([0, y, 0]);
        else for (z = -half; z <= half; z++) out.push([0, 0, z]);
      } else {
        // a B-voxel cube at the center, on a face, on an edge, or in a corner
        var o = [mid, mid, mid], k = { center: 0, face: 1, edge: 2, corner: 3 }[this.box] || 0;
        var axes = [0, 1, 2];
        for (i = 2; i > 0; i--) { var j = this.randInt(i + 1), tt = axes[i]; axes[i] = axes[j]; axes[j] = tt; }
        for (i = 0; i < k; i++) o[axes[i]] = edgePick();
        for (z = o[2]; z < o[2] + B; z++) for (y = o[1]; y < o[1] + B; y++) for (x = o[0]; x < o[0] + B; x++) out.push([x, y, z]);
      }
    }
    for (i = out.length - 1; i > 0; i--) {
      var jj = this.randInt(i + 1), t = out[i]; out[i] = out[jj]; out[jj] = t;
    }
    return out;
  };

  Swarm.prototype.setup = function () {
    var cand = this.candidates(), k = 0;
    while (this.agents.length < this.n && k < cand.length) { this.place(cand[k][0], cand[k][1], cand[k][2]); k++; }
    if (this.agents.length < this.n) this.failed = true;
    this.record();
  };

  Swarm.prototype.dist = function (a) {
    var dx = this.wdelta(a.x), dy = this.wdelta(a.y), dz = this.wdelta(a.z);
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  };

  // compass heading from a toward (x2, y2), NetLogo convention (0 = +y, clockwise); null if straight above or below
  Swarm.prototype.towards = function (a, x2, y2) {
    var dx = this.wdelta(x2 - a.x), dy = this.wdelta(y2 - a.y);
    if (dx === 0 && dy === 0) return null;
    var h = Math.atan2(dx, dy) / DEG;
    return h < 0 ? h + 360 : h;
  };
  Swarm.prototype.pitchTo = function (a, x2, y2, z2) {
    if (this.dims === 2) return 0;
    var dx = this.wdelta(x2 - a.x), dy = this.wdelta(y2 - a.y), dz = this.wdelta(z2 - a.z);
    return Math.atan2(dz, Math.sqrt(dx * dx + dy * dy)) / DEG;
  };

  Swarm.prototype.dest = function (a, dist) {
    var cp = this.dims === 3 ? Math.cos(a.p * DEG) : 1;
    return [a.x + dist * cp * Math.sin(a.h * DEG),
            a.y + dist * cp * Math.cos(a.h * DEG),
            this.dims === 3 ? a.z + dist * Math.sin(a.p * DEG) : 0];
  };
  Swarm.prototype.freeAhead = function (a, dist) {
    var q = this.dest(a, dist);
    var idx = this.index(q[0], q[1], q[2]), own = this.index(a.x, a.y, a.z);
    return this.occ[idx] - (idx === own ? 1 : 0) <= 0;
  };
  Swarm.prototype.move = function (a, dist) {
    var from = this.index(a.x, a.y, a.z), q = this.dest(a, dist);
    a.x = this.wrap(q[0]); a.y = this.wrap(q[1]);
    if (this.dims === 3) a.z = this.wrap(q[2]);
    var to = this.index(a.x, a.y, a.z);
    if (to !== from) { this.occ[from]--; this.occ[to]++; }
  };

  Swarm.prototype.nearest = function (a) {
    var best = null, bd = Infinity, list = this.agents;
    for (var i = 0; i < list.length; i++) {
      var b = list[i];
      if (b === a) continue;
      var dx = this.wdelta(b.x - a.x), dy = this.wdelta(b.y - a.y), dz = this.wdelta(b.z - a.z), q = dx * dx + dy * dy + dz * dz;
      if (q < bd) { bd = q; best = b; }
    }
    return best;
  };

  // Algorithm 1: hold delta +/- epsilon from the target.
  Swarm.prototype.centerRule = function (a) {
    var dist = this.dist(a);
    var h = this.towards(a, 0, 0);
    if (h === null && this.dims === 2) return "none";
    if (h !== null) a.h = h;
    a.p = this.pitchTo(a, 0, 0, 0);
    if (this.delta - dist > this.epsilon) {
      if (this.freeAhead(a, -this.c)) { this.move(a, -this.c); return "back"; }
      return "blocked";
    }
    if (this.delta - dist < -this.epsilon) {
      if (this.freeAhead(a, this.c)) { this.move(a, this.c); return "forward"; }
      return "blocked";
    }
    if (this.ring === "seek" && Math.abs(this.delta - dist) > 0.05) {
      var step = Math.min(this.c, Math.abs(this.delta - dist)) * (dist > this.delta ? 1 : -1);
      if (this.freeAhead(a, step)) { this.move(a, step); return "settle"; }
      return "in";
    }
    return "in";
  };

  // Algorithm 2 (3-D): bearing of nearest neighbor + 180 + r, nose level, tilt t toward the target's height.
  Swarm.prototype.dispersionRule = function (a) {
    var nb = this.nearest(a);
    if (!nb) return "none";
    var h = this.towards(a, nb.x, nb.y);
    if (h === null) h = a.h;
    a.h = (h + 180 + this.r) % 360;
    if (this.dims === 3) {
      a.p = 0;
      if (this.wdelta(a.z) > 0) a.p = -this.t; else a.p = this.t;
    }
    if (this.freeAhead(a, this.d)) { this.move(a, this.d); return "moved"; }
    return "blocked";
  };

  Swarm.prototype.inShell = function (a) {
    var dd = this.dist(a);
    return dd >= this.delta - this.epsilon && dd <= this.delta + this.epsilon;
  };
  Swarm.prototype.share = function () {
    var k = 0;
    for (var i = 0; i < this.agents.length; i++) if (this.inShell(this.agents[i])) k++;
    return this.agents.length ? k / this.agents.length : 0;
  };
  Swarm.prototype.record = function () {
    var s = this.share();
    if (this.reached[68] < 0 && s >= 0.68) this.reached[68] = this.ticks;
    if (this.reached[95] < 0 && s >= 0.95) this.reached[95] = this.ticks;
    if (this.reached[100] < 0 && s >= 1) { this.reached[100] = this.ticks; this.stableAt = this.ticks; }
    this.lastShare = s;
  };

  Swarm.prototype.step = function (trace) {
    var order = this.agents.slice(), i, actions = trace ? {} : null;
    for (i = order.length - 1; i > 0; i--) { var j = this.randInt(i + 1), t = order[i]; order[i] = order[j]; order[j] = t; }
    for (i = 0; i < order.length; i++) {
      var a = order[i];
      var dr = this.dispersionRule(a), cr = this.centerRule(a);
      if (actions) actions[a.id] = { center: cr, dispersion: dr };
    }
    this.ticks++;
    this.record();
    return actions;
  };

  // Angular spread of the swarm around the target: mean resultant length of
  // the agents' unit directions (0 = evenly spread, 1 = all on one side).
  Swarm.prototype.clumping = function () {
    var sx = 0, sy = 0, sz = 0, n = 0;
    for (var i = 0; i < this.agents.length; i++) {
      var a = this.agents[i], dx = this.wdelta(a.x), dy = this.wdelta(a.y), dz = this.wdelta(a.z), L = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (L > 0) { sx += dx / L; sy += dy / L; sz += dz / L; n++; }
    }
    return n ? Math.sqrt(sx * sx + sy * sy + sz * sz) / n : 0;
  };

  // Run until 100 percent stability or `cap` epochs. Epoch counts are the
  // first epoch at which each level was reached (0 if the start already had it,
  // -1 if never).
  function run(opts, cap) {
    var s = new Swarm(opts);
    if (s.failed) return { failed: true };
    cap = cap || 1000;
    while (s.ticks < cap && s.reached[100] < 0) s.step(false);
    return { failed: false, e68: s.reached[68], e95: s.reached[95], e100: s.reached[100], capped: s.reached[100] < 0 };
  }

  var api = { ASSUMPTIONS: ASSUMPTIONS, Swarm: Swarm, run: run, mulberry32: mulberry32 };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Sharks3D = api;
})(typeof self !== "undefined" ? self : this);

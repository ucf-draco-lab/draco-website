/*
  Safety-centric SAC engine for /papers/avionics-safety-design/.

  Two parts, both small enough to run on any device:

  1. Architecture refinement (Section III of Vemuri, Borowczak, and Avakian, NAECON 2008).
     An architecture is a set of parameter domains. A refinement narrows one or more
     domains; a property proved for a node holds for every node whose domains sit inside
     the property's requirement. The worked example (N1 > 4 and D1 < 20 ms, then N1 = 9
     and D1 = 15 ms), the "no more than three differentiators" scheduling refinement, and
     the add-and-subtract specialization come from the paper. The other nodes and the
     properties are this page's illustrations.

  2. Proof-directed run-time monitors (Section IV). A pitch-hold control law is built from
     five tool-kit blocks. Each block's lemma (pre-condition P_K, post-condition P_K+1)
     compiles to a run-time assertion; module lemmas and the global theorem
     P_I(i) => P_O(F(i)) compile the same way. A fault is injected into the implementation
     and three monitoring policies (top level only, every block, and the paper's
     escalation policy) are compared. The plant, gains, faults, and frame time are this
     page's choices; the paper reports no simulation.

  Loads as a page script (window.SacEngine) or in Node (module.exports).
*/
(function (root) {
  "use strict";

  /* ================================================================ refinement */

  var INF = Infinity;
  var OPS = ["add", "sub", "mul", "div"];

  // An interval {lo, hi, loOpen, hiOpen}; integer parameters are normalized to closed bounds.
  function iv(lo, hi, loOpen, hiOpen) { return { lo: lo, hi: hi, loOpen: !!loOpen, hiOpen: !!hiOpen }; }
  function normInt(a) {
    var lo = a.loOpen ? Math.floor(a.lo) + 1 : Math.ceil(a.lo);
    var hi = a.hi === INF ? INF : (a.hiOpen ? Math.ceil(a.hi) - 1 : Math.floor(a.hi));
    return iv(lo, hi, false, false);
  }
  function ivEmpty(a) {
    if (a.lo > a.hi) return true;
    if (a.lo === a.hi && (a.loOpen || a.hiOpen)) return true;
    return false;
  }
  // a is inside b
  function ivSub(a, b) {
    if (ivEmpty(a)) return true;
    var loOk = a.lo > b.lo || (a.lo === b.lo && (a.loOpen || !b.loOpen));
    var hiOk = a.hi < b.hi || (a.hi === b.hi && (a.hiOpen || !b.hiOpen));
    return loOk && hiOk;
  }
  function ivMeet(a, b) {
    var lo, loOpen, hi, hiOpen;
    if (a.lo > b.lo) { lo = a.lo; loOpen = a.loOpen; } else if (b.lo > a.lo) { lo = b.lo; loOpen = b.loOpen; } else { lo = a.lo; loOpen = a.loOpen || b.loOpen; }
    if (a.hi < b.hi) { hi = a.hi; hiOpen = a.hiOpen; } else if (b.hi < a.hi) { hi = b.hi; hiOpen = b.hiOpen; } else { hi = a.hi; hiOpen = a.hiOpen || b.hiOpen; }
    return iv(lo, hi, loOpen, hiOpen);
  }
  function setSub(a, b) { return a.every(function (x) { return b.indexOf(x) >= 0; }); }
  function setMeet(a, b) { return a.filter(function (x) { return b.indexOf(x) >= 0; }); }

  var PARAMS = [
    { key: "N1", kind: "int", name: "Integrators", unit: "" },
    { key: "D1", kind: "real", name: "Integrator delay", unit: "ms" },
    { key: "K", kind: "int", name: "Differentiators per frame", unit: "" },
    { key: "FU", kind: "set", name: "Generic unit performs", unit: "" }
  ];

  function domain(spec) {
    // spec: {N1: iv, D1: iv, K: iv, FU: [...]}, missing keys stay unconstrained
    var d = {
      N1: iv(0, INF), D1: iv(0, INF, true, false), K: iv(0, INF), FU: OPS.slice()
    };
    Object.keys(spec || {}).forEach(function (k) { d[k] = spec[k]; });
    d.N1 = normInt(d.N1); d.K = normInt(d.K);
    return d;
  }
  function narrow(parent, spec) {
    var d = { N1: parent.N1, D1: parent.D1, K: parent.K, FU: parent.FU.slice() };
    Object.keys(spec || {}).forEach(function (k) { d[k] = spec[k]; });
    d.N1 = normInt(d.N1); d.K = normInt(d.K);
    return d;
  }
  function isEmpty(d) {
    return ivEmpty(d.N1) || ivEmpty(d.D1) || ivEmpty(d.K) || d.FU.length === 0;
  }
  // Which parameters of child widen past parent (empty list = a valid refinement).
  function widens(child, parent) {
    var out = [];
    if (!ivSub(child.N1, parent.N1)) out.push("N1");
    if (!ivSub(child.D1, parent.D1)) out.push("D1");
    if (!ivSub(child.K, parent.K)) out.push("K");
    if (!setSub(child.FU, parent.FU)) out.push("FU");
    return out;
  }
  function refines(child, parent) { return widens(child, parent).length === 0; }
  // Refinement composition: meet of two domains, with the parameters that conflict.
  function compose(a, b) {
    var d = { N1: ivMeet(a.N1, b.N1), D1: ivMeet(a.D1, b.D1), K: ivMeet(a.K, b.K), FU: setMeet(a.FU, b.FU) };
    var conflicts = [];
    if (ivEmpty(d.N1)) conflicts.push("N1");
    if (ivEmpty(d.D1)) conflicts.push("D1");
    if (ivEmpty(d.K)) conflicts.push("K");
    if (d.FU.length === 0) conflicts.push("FU");
    return { domain: d, conflicts: conflicts };
  }
  // A property is a requirement domain; it holds on a node when the node sits inside it.
  function holds(node, req) { return !isEmpty(node) && refines(node, req); }

  function fmtIv(a, kind, unit) {
    var u = unit ? " " + unit : "";
    if (kind === "int") {
      if (a.lo === a.hi) return "= " + a.lo + u;
      if (a.hi === INF) return a.lo === 0 ? "any" : "≥ " + a.lo + u;
      if (a.lo === 0) return "≤ " + a.hi + u;
      return a.lo + "–" + a.hi + u;
    }
    if (a.lo === a.hi && !a.loOpen && !a.hiOpen) return "= " + a.lo + u;
    var loFree = a.lo === 0 && a.loOpen, hiFree = a.hi === INF;
    if (loFree && hiFree) return "any";
    if (loFree) return (a.hiOpen ? "< " : "≤ ") + a.hi + u;
    if (hiFree) return (a.loOpen ? "> " : "≥ ") + a.lo + u;
    return (a.loOpen ? "(" : "[") + a.lo + ", " + a.hi + (a.hiOpen ? ")" : "]") + u;
  }
  function fmtParam(d, key) {
    var p = PARAMS.filter(function (x) { return x.key === key; })[0];
    if (p.kind === "set") return d.FU.length === OPS.length ? "any" : d.FU.join(", ");
    return fmtIv(d[key], p.kind, p.unit);
  }

  // The page's family. Paper-sourced constraints are marked paper: true.
  function family() {
    var core = domain({});
    var a1 = narrow(core, { N1: iv(4, INF, true, false), D1: iv(0, 20, true, true) });
    var a2 = narrow(a1, { N1: iv(9, 9), D1: iv(15, 15) });
    var a3 = narrow(a1, { K: iv(0, 3), FU: ["add", "sub"] });
    var a4c = compose(a2, a3);
    var a5 = narrow(core, { N1: iv(0, 6), D1: iv(0, 30, true, false) });
    return [
      { id: "core", name: "Core", parent: null, domain: core, how: "Platform definition: every parameter left open", paper: true },
      { id: "a1", name: "ARCH-1", parent: "core", domain: a1, how: "Restriction: N1 > 4 and D1 < 20 ms (the paper's example)", paper: true },
      { id: "a2", name: "ARCH-2", parent: "a1", domain: a2, how: "Instantiation: N1 = 9 and D1 = 15 ms (the paper's example)", paper: true },
      { id: "a3", name: "ARCH-3", parent: "a1", domain: a3, how: "Scheduling: at most three differentiators per frame; specialization: the generic unit adds and subtracts (both the paper's examples)", paper: true },
      { id: "a4", name: "ARCH-4", parent: ["a2", "a3"], domain: a4c.domain, how: "Composition of ARCH-2 and ARCH-3 (no conflict)", paper: false },
      { id: "a5", name: "ARCH-5", parent: "core", domain: a5, how: "Restriction for a low-end vehicle: N1 ≤ 6 and D1 ≤ 30 ms (this page's example)", paper: false }
    ];
  }
  function properties() {
    return [
      { id: "p1", name: "Pitch-hold law is correct", needs: "at least two integrators and an integrator delay under 20 ms",
        req: domain({ N1: iv(2, INF), D1: iv(0, 20, true, true) }) },
      { id: "p2", name: "Larger control law is correct", needs: "at least eight integrators and an integrator delay of 15 ms or less",
        req: domain({ N1: iv(8, INF), D1: iv(0, 15, true, false) }) },
      { id: "p3", name: "Frame-time guarantee holds", needs: "no more than three differentiators per frame and integrator delay under 20 ms",
        req: domain({ K: iv(0, 3), D1: iv(0, 20, true, true) }) }
    ];
  }

  /* ================================================================ control law and monitors */

  var T = 0.02;            // frame time, s (page's choice)
  var FRAMES = 400;        // 8 s
  var KP = 1.5, KI = 2.0;  // specification gains (page's choice)
  var SMAX = 15;           // integrator clamp, deg
  var UMAX = 25;           // elevator limit, deg
  var RMAX = 15;           // P_I: command range, deg
  var THMAX = 30;          // P_I: measured pitch range, deg
  var EPS = 1e-9;
  var WN = 2.0, ZETA = 0.6, GAIN = 4.0; // plant: theta'' = -wn^2 theta - 2 zeta wn theta' + g u

  function clamp(x, m) { return x > m ? m : (x < -m ? -m : x); }
  function command(k) { var t = k * T; return t < 0.2 - 1e-12 ? 0 : (t < 4 - 1e-12 ? 10 : -5); }

  // Flip one exponent bit (bit 61) of a double: a single-event upset in stored state.
  function flipBit61(x) {
    var buf = new DataView(new ArrayBuffer(8));
    buf.setFloat64(0, x);
    var hi = buf.getUint32(0);
    buf.setUint32(0, (hi ^ 0x20000000) >>> 0);
    return buf.getFloat64(0);
  }

  var FAULTS = [
    { id: "none", name: "No fault" },
    { id: "gain", name: "Gain typed as 15, not 1.5", where: "GAIN" },
    { id: "sign", name: "Integrator sign flipped", where: "INT" },
    { id: "upset", name: "Bit flip in integrator memory", where: "INT" },
    { id: "spike", name: "Sensor spike to 90°", where: "sensor" },
    { id: "stuck", name: "Sensor stuck in range", where: "sensor" }
  ];
  var POLICIES = [
    { id: "top", name: "Top level only" },
    { id: "all", name: "Every block" },
    { id: "escalate", name: "Escalate on alarm" }
  ];

  // Monitor hierarchy: top (inputs and output), two modules, five leaf blocks.
  var LEAVES = ["SUM1", "GAIN", "INT", "SUM2", "SAT"];
  var MODULE_OF = { SUM1: "A", GAIN: "A", INT: "B", SUM2: "B", SAT: "B" };
  var MONITORS = {
    PI_r: { level: "top", text: "P_I: |r| ≤ " + RMAX + "°" },
    PI_th: { level: "top", text: "P_I: |θ| ≤ " + THMAX + "°" },
    PO: { level: "top", text: "P_O: |u| ≤ " + UMAX + "° and |u − sat(Kp·e)| ≤ " + SMAX + "°" },
    A: { level: "module", text: "Module A: p = Kp·(r − θ)" },
    B: { level: "module", text: "Module B: |s′| ≤ Smax, s = clamp(s′ + Ki·T·e), u = sat(p + s)" },
    SUM1: { level: "leaf", text: "SUM1: e = r − θ" },
    GAIN: { level: "leaf", text: "GAIN: p = Kp·e" },
    INT: { level: "leaf", text: "INT: |s′| ≤ Smax ⇒ s = clamp(s′ + Ki·T·e) and |s| ≤ Smax" },
    SUM2: { level: "leaf", text: "SUM2: v = p + s" },
    SAT: { level: "leaf", text: "SAT: u = clamp(v, ±" + UMAX + "°)" }
  };

  function near(a, b) { return Math.abs(a - b) <= EPS * (1 + Math.abs(b)); }

  // One frame of the implementation, with an optional fault. Returns every internal signal.
  function step(st, r, thTrue, k, fault, k0, useBackup) {
    var active = !useBackup && fault !== "none" && k >= k0;
    var thm = thTrue;
    if (active && fault === "spike" && k === k0) thm = 90;
    if (fault === "stuck" && k >= k0) {
      if (st.stuckVal === null) st.stuckVal = thTrue;
      thm = st.stuckVal;
    }
    var sPrev = st.s;
    if (active && fault === "upset" && k === k0) sPrev = flipBit61(sPrev);
    var e = r - thm;
    var kp = (active && fault === "gain") ? 10 * KP : KP;
    var p = kp * e;
    var inc = KI * T * e;
    var s = clamp((active && fault === "sign") ? sPrev - inc : sPrev + inc, SMAX);
    var v = p + s;
    var u = clamp(v, UMAX);
    st.s = s;
    return { r: r, thm: thm, sPrev: sPrev, e: e, p: p, s: s, v: v, u: u };
  }

  // Evaluate one named monitor on one frame's signals. true = passes.
  function check(name, x) {
    switch (name) {
      case "PI_r": return Math.abs(x.r) <= RMAX + EPS;
      case "PI_th": return Math.abs(x.thm) <= THMAX + EPS;
      case "PO": {
        var e = x.r - x.thm;
        return Math.abs(x.u) <= UMAX + EPS && Math.abs(x.u - clamp(KP * e, UMAX)) <= SMAX + EPS;
      }
      case "A": return near(x.p, KP * (x.r - x.thm));
      case "B": return Math.abs(x.sPrev) <= SMAX + EPS && near(x.s, clamp(x.sPrev + KI * T * x.e, SMAX)) && near(x.u, clamp(x.p + x.s, UMAX));
      case "SUM1": return near(x.e, x.r - x.thm);
      case "GAIN": return near(x.p, KP * x.e);
      case "INT": return Math.abs(x.sPrev) <= SMAX + EPS && near(x.s, clamp(x.sPrev + KI * T * x.e, SMAX)) && Math.abs(x.s) <= SMAX + EPS;
      case "SUM2": return near(x.v, x.p + x.s);
      case "SAT": return near(x.u, clamp(x.v, UMAX));
    }
    throw new Error("unknown monitor " + name);
  }

  /*
    simulate({fault, onset (frame), policy, recover: "log" | "backup"})
    Policies:
      top       P_I and P_O every frame.
      all       every monitor every frame.
      escalate  P_I and P_O; after a top-level alarm the module monitors switch on from the
                next frame; after a module alarm, that module's leaf monitors switch on from
                the next frame (Section IV, "Error-Detection and Recovery").
    Recovery "backup" switches to a correct implementation of the same law at the first
    alarm (the paper's "reconfiguring ... by selecting a safer control law").
  */
  function simulate(opt) {
    var fault = opt.fault || "none", k0 = opt.onset == null ? 100 : opt.onset;
    var policy = opt.policy || "top", recover = opt.recover || "log";
    var st = { s: 0, stuckVal: null };
    var th = 0, q = 0;
    var on = { PI_r: true, PI_th: true, PO: true, A: policy === "all", B: policy === "all" };
    LEAVES.forEach(function (n) { on[n] = policy === "all"; });
    var series = { t: [], r: [], th: [], thm: [], u: [] };
    var events = [], checks = 0;
    var detect = null, localize = null, backup = false;
    for (var k = 0; k < FRAMES; k++) {
      var r = command(k);
      var x = step(st, r, th, k, fault, k0, backup);
      var failed = [];
      var names = ["PI_r", "PI_th", "PO", "A", "B"].concat(LEAVES);
      for (var i = 0; i < names.length; i++) {
        var n = names[i];
        if (!on[n]) continue;
        checks++;
        if (!check(n, x)) failed.push(n);
      }
      if (failed.length) {
        events.push({ k: k, failed: failed.slice() });
        if (!detect) detect = { k: k, by: failed[0] };
        // Localization: the finest monitor that fails names the source.
        if (!localize) {
          var leaf = failed.filter(function (n) { return MONITORS[n].level === "leaf"; })[0];
          var pin = failed.filter(function (n) { return n === "PI_r" || n === "PI_th"; })[0];
          if (leaf) localize = { k: k, to: leaf };
          else if (pin) localize = { k: k, to: pin === "PI_th" ? "sensor" : "command" };
        }
        if (policy === "escalate") {
          failed.forEach(function (n) {
            if (n === "PO") { on.A = true; on.B = true; }
            if (n === "A" || n === "B") LEAVES.forEach(function (l) { if (MODULE_OF[l] === n) on[l] = true; });
          });
        }
        if (recover === "backup" && !backup) {
          backup = true;
          st.s = clamp(st.s, SMAX); // the backup law starts from a sanitized state
        }
      }
      // Plant update (semi-implicit Euler, fixed order).
      var a = -WN * WN * th - 2 * ZETA * WN * q + GAIN * x.u;
      q = q + T * a;
      th = th + T * q;
      series.t.push(k * T); series.r.push(r); series.th.push(th); series.thm.push(x.thm); series.u.push(x.u);
    }
    return { series: series, events: events, checks: checks, detect: detect, localize: localize, backup: backup };
  }

  // Reference (fault-free) trajectory and the largest pitch deviation from it after onset.
  var refCache = null;
  function reference() { if (!refCache) refCache = simulate({ fault: "none", policy: "top" }); return refCache; }
  function deviation(run, k0) {
    var ref = reference().series.th, m = 0, at = -1;
    for (var k = k0; k < FRAMES; k++) { var d = Math.abs(run.series.th[k] - ref[k]); if (d > m) { m = d; at = k; } }
    return { max: m, k: at };
  }

  // Every fault × policy × recovery at one onset: the table the graduate level shows.
  function sweep(onset) {
    var rows = [];
    FAULTS.forEach(function (f) {
      if (f.id === "none") return;
      POLICIES.forEach(function (p) {
        ["log", "backup"].forEach(function (rec) {
          var run = simulate({ fault: f.id, onset: onset, policy: p.id, recover: rec });
          var dev = deviation(run, onset);
          rows.push({
            fault: f.id, policy: p.id, recover: rec,
            detect: run.detect ? run.detect.k - onset : null, by: run.detect ? run.detect.by : null,
            localize: run.localize ? run.localize.k - onset : null, to: run.localize ? run.localize.to : null,
            checks: run.checks, dev: dev.max
          });
        });
      });
    });
    return rows;
  }

  /* ================================================================ assertion code generation */

  // Compile each lemma to the C++ assertion the auto-coder would insert at a block boundary.
  function assertions() {
    return {
      SUM1: ["assert(near(e, r - theta));"],
      GAIN: ["assert(near(p, KP * e));"],
      INT: ["assert(fabs(s_prev) <= SMAX);            // pre-condition", "assert(near(s, clamp(s_prev + KI * T * e, SMAX)));", "assert(fabs(s) <= SMAX);                 // post-condition"],
      SUM2: ["assert(near(v, p + s));"],
      SAT: ["assert(near(u, clamp(v, UMAX)));"],
      A: ["assert(near(p, KP * (r - theta)));"],
      B: ["assert(fabs(s_prev) <= SMAX);", "assert(near(s, clamp(s_prev + KI * T * e, SMAX)));", "assert(near(u, clamp(p + s, UMAX)));"],
      PI: ["assert(fabs(r) <= RMAX && fabs(theta) <= THMAX);"],
      PO: ["assert(fabs(u) <= UMAX);", "assert(fabs(u - clamp(KP * (r - theta), UMAX)) <= SMAX);"]
    };
  }

  /* ================================================================ testing hours */

  // Failure-free test hours needed to claim rate < lambda at confidence c (exponential model).
  function testHours(lambda, c) { return -Math.log(1 - c) / lambda; }

  var api = {
    INF: INF, OPS: OPS, PARAMS: PARAMS,
    iv: iv, domain: domain, narrow: narrow, widens: widens, refines: refines, compose: compose, holds: holds,
    isEmpty: isEmpty, fmtParam: fmtParam, family: family, properties: properties,
    T: T, FRAMES: FRAMES, KP: KP, KI: KI, SMAX: SMAX, UMAX: UMAX, RMAX: RMAX, THMAX: THMAX,
    FAULTS: FAULTS, POLICIES: POLICIES, MONITORS: MONITORS, LEAVES: LEAVES, MODULE_OF: MODULE_OF,
    command: command, flipBit61: flipBit61, simulate: simulate, reference: reference, deviation: deviation,
    sweep: sweep, assertions: assertions, testHours: testHours
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.SacEngine = api;
})(typeof self !== "undefined" ? self : this);

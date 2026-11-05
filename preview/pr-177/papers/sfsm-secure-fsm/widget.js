/*
  S*FSM widget for /papers/sfsm-secure-fsm/.
  Mount points: #sf-predictor, #sf-unroll, #sf-encode, #sf-capacity, #sf-cost.
  Demos 2 and 3 share one machine choice.
*/
(function () {
  "use strict";

  var E = window.SFSMEngine;
  if (!E) return;

  var SCRIPT_BASE = (document.currentScript && document.currentScript.src || "").replace(/[^/]*$/, "");
  var SVGNS = "http://www.w3.org/2000/svg";

  /* ------------------------------------------------------------ paper data */

  // 2012 Table 1 ranges for the unrolled predictor; Fig. 2(b) for the original.
  var PAPER_RANGES = {
    "orig-binary": { hw: "0–2", hd: "0–2" },
    "sfsm-binary": { hw: "0–2", hd: "1–3" },
    "sfsm-onehot": { hw: "1", hd: "2" },
    "sfsm-sopt": { hw: "2", hd: "2" }
  };
  // 2014 Tables III to V: averages over 12 MCNC machines (relative to the original binary length).
  var PAPER_AVG = {
    states: 49, terms: 57, binS: 15, secure: 70, rhd: 30, rhdhw: 55, chd4: 70, chd2: 112, oh: 400
  };

  var EX_LABEL = {
    three: "Three states (2014)",
    predictor: "Branch predictor (2012)"
  };
  var PICKS = ["three", "predictor", "lion", "mc", "train4", "dk15", "dk27", "s8", "bbtas", "shiftreg"];

  /* ------------------------------------------------------------ state */

  var state = {
    data: null,
    machine: "predictor",
    level: window.PaperKit ? window.PaperKit.level() : "public"
  };
  var listeners = [];
  function onChange(fn) { listeners.push(fn); }
  function changed() { listeners.forEach(function (fn) { fn(); }); }
  document.addEventListener("paperlevel", function (e) { state.level = e.detail.level; });

  /* ------------------------------------------------------------ helpers */

  function el(tag, attrs, kids) {
    var node = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === "text") node.textContent = attrs[k];
      else if (k === "html") node.innerHTML = attrs[k];
      else if (k.slice(0, 2) === "on") node.addEventListener(k.slice(2), attrs[k]);
      else node.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (kid) { if (kid) node.appendChild(typeof kid === "string" ? document.createTextNode(kid) : kid); });
    return node;
  }
  function svg(tag, attrs, text) {
    var node = document.createElementNS(SVGNS, tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { node.setAttribute(k, attrs[k]); });
    if (text != null) node.textContent = text;
    return node;
  }
  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }
  function chartWidth(node) {
    var w = node && node.parentNode ? node.parentNode.clientWidth : 640;
    return Math.max(300, Math.min(760, w || 640));
  }
  var resizers = [];
  var resizeTimer = null;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () { resizers.forEach(function (fn) { fn(); }); }, 150);
  });
  function seg(options, value, onPick, label) {
    var wrap = el("div", { class: "seg", role: "radiogroup", "aria-label": label });
    var btns = options.map(function (o) {
      var b = el("button", { type: "button", class: "seg-option", role: "radio", "aria-checked": String(o.value === value), text: o.label });
      if (o.levels) b.setAttribute("data-levels", o.levels);
      if (o.title) b.title = o.title;
      b.addEventListener("click", function () { if (b.disabled) return; set(o.value); onPick(o.value); });
      wrap.appendChild(b);
      return b;
    });
    function set(v) { btns.forEach(function (b, i) { b.setAttribute("aria-checked", String(options[i].value === v)); }); }
    wrap.set = set;
    wrap.btns = btns;
    return wrap;
  }
  var WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
  function num(x) { return x >= 0 && x < 10 && x === Math.floor(x) ? WORDS[x] : String(x); }
  function pct(x) { return (x >= 0 ? "+" : "−") + Math.abs(x).toFixed(0) + "%"; }
  function list(a) { return a.join(", "); }
  function mulberry(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  /* Machine by key: the two paper examples or an MCNC benchmark. */
  function machine(key) {
    if (key === "predictor") return E.exampleFsm(E.examples.predictor);
    if (key === "three") return E.exampleFsm(E.examples.threeState);
    var m = state.data.machines[key];
    return E.parseKiss2(m.kiss);
  }
  function machineLabel(key) { return EX_LABEL[key] || key.toUpperCase(); }
  function machineAbout(key) {
    if (key === "predictor") return "4 states, 1 input, two self-loops";
    if (key === "three") return "3 states, one self-loop";
    var m = state.data.machines[key];
    return m.S + " states, " + m.ni + " input" + (m.ni === 1 ? "" : "s") + ", " + m.T + " product terms, " + m.L + " self-loop" + (m.L === 1 ? "" : "s");
  }

  /* ------------------------------------------------------------ graph drawing */

  /*
   * Positions for a machine (original states first, twins next to their
   * originals). The two paper examples get hand layouts that follow the
   * papers' figures; benchmarks sit on a circle with twins just outside.
   */
  function layout(key, names, twinOf, W, H) {
    var pos = {};
    var orig = names.filter(function (s) { return !twinOf[s]; });
    if (key === "predictor") {
      var xs = { ST: 0.12, ST1: 0.12, WT: 0.38, WNT: 0.62, SNT: 0.88, SNT1: 0.88 };
      orig.forEach(function (s) { pos[s] = [xs[s] * W, 82]; });
    } else if (key === "three") {
      pos.A = [0.18 * W, 0.66 * H]; pos.B = [0.5 * W, 0.24 * H]; pos.C = [0.82 * W, 0.66 * H];
    } else {
      var R = Math.min(W, H) * 0.32;
      orig.forEach(function (s, i) {
        var a = -Math.PI / 2 + 2 * Math.PI * i / orig.length;
        pos[s] = [W / 2 + R * Math.cos(a), H / 2 + R * Math.sin(a)];
      });
    }
    names.forEach(function (s) {
      var o = twinOf[s];
      if (!o) return;
      var p = pos[o];
      if (key === "predictor") pos[s] = [p[0], H - 50];
      else if (key === "three") pos[s] = [p[0] + 0.0 * W, p[1] + 0.42 * H > H - 20 ? H - 22 : p[1] + 0.42 * H];
      else {
        var dx = p[0] - W / 2, dy = p[1] - H / 2, d = Math.sqrt(dx * dx + dy * dy) || 1;
        var R2 = Math.min(W, H) * 0.47;
        pos[s] = [W / 2 + dx / d * R2, H / 2 + dy / d * R2];
      }
    });
    return pos;
  }

  /*
   * Draw a state graph. opts: { codes, cur, edgeHd, highlight, small }.
   * Edges between the same pair in both directions are drawn as two arcs.
   */
  function drawGraph(host, key, fsm, twinOf, opts) {
    opts = opts || {};
    var W = chartWidth(host), small = W < 480;
    var nState = fsm.states.length;
    var hasTwin = Object.keys(twinOf).length > 0;
    var H = key === "predictor" ? (hasTwin ? (small ? 230 : 250) : (small ? 150 : 160)) : key === "three" ? 260 : Math.round(Math.min(W, 560) * 0.82);
    host.setAttribute("viewBox", "0 0 " + W + " " + H);
    clear(host);
    var defs = svg("defs");
    var mk = svg("marker", { id: host.id + "-arrow", viewBox: "0 0 10 10", refX: "9", refY: "5", markerWidth: "7", markerHeight: "7", orient: "auto-start-reverse" });
    mk.appendChild(svg("path", { d: "M0,0 L10,5 L0,10 z", class: "sf-arrowhead" }));
    defs.appendChild(mk);
    host.appendChild(defs);
    var pos = layout(key, fsm.states, twinOf, W, H);
    var r = nState > 14 ? (small ? 11 : 13) : (small ? 15 : 19);
    var g = E.graph(fsm), pairs = {};
    g.edges.forEach(function (e) { pairs[e[0] + "," + e[1]] = 1; });
    var gE = svg("g"), gL = svg("g"), gN = svg("g");
    host.appendChild(gE); host.appendChild(gL); host.appendChild(gN);
    var drawn = {};
    g.edges.forEach(function (e) {
      var a = g.names[e[0]], b = g.names[e[1]], p = pos[a], q = pos[b];
      var both = pairs[e[1] + "," + e[0]];
      var dx = q[0] - p[0], dy = q[1] - p[1], d = Math.sqrt(dx * dx + dy * dy) || 1;
      var ux = dx / d, uy = dy / d;
      var bend = both ? 0.18 * d : 0;
      var mx = (p[0] + q[0]) / 2 - uy * bend, my = (p[1] + q[1]) / 2 + ux * bend;
      // trim to the circles
      var sx = p[0] + (mx - p[0]) / (Math.hypot(mx - p[0], my - p[1]) || 1) * r;
      var sy = p[1] + (my - p[1]) / (Math.hypot(mx - p[0], my - p[1]) || 1) * r;
      var ex = q[0] + (mx - q[0]) / (Math.hypot(mx - q[0], my - q[1]) || 1) * (r + 2);
      var ey = q[1] + (my - q[1]) / (Math.hypot(mx - q[0], my - q[1]) || 1) * (r + 2);
      var cls = "sf-edge";
      if (opts.edgeClass) cls += " " + (opts.edgeClass(e) || "");
      gE.appendChild(svg("path", { d: "M" + sx + "," + sy + " Q" + mx + "," + my + " " + ex + "," + ey, class: cls, "marker-end": "url(#" + host.id + "-arrow)" }));
      var key2 = Math.min(e[0], e[1]) + "," + Math.max(e[0], e[1]);
      if (opts.edgeLabel && !drawn[key2]) {
        drawn[key2] = 1;
        var t = opts.edgeLabel(e);
        if (t != null) {
          var lx = both ? (p[0] + q[0]) / 2 : mx, ly = both ? (p[1] + q[1]) / 2 : my;
          var lab = svg("g", { class: "sf-elabel " + (opts.edgeClass ? opts.edgeClass(e) || "" : "") });
          lab.appendChild(svg("rect", { x: lx - 9, y: ly - 8, width: 18, height: 15 }));
          lab.appendChild(svg("text", { x: lx, y: ly + 4, "text-anchor": "middle" }, t));
          gL.appendChild(lab);
        }
      }
    });
    g.names.forEach(function (s, i) {
      var p = pos[s];
      if (g.loop[i]) {
        gE.appendChild(svg("path", {
          d: "M" + (p[0] - r * 0.55) + "," + (p[1] - r * 0.8) + " C" + (p[0] - r * 1.4) + "," + (p[1] - r * 2.6) + " " + (p[0] + r * 1.4) + "," + (p[1] - r * 2.6) + " " + (p[0] + r * 0.6) + "," + (p[1] - r * 0.85),
          class: "sf-edge sf-loop", "marker-end": "url(#" + host.id + "-arrow)"
        }));
      }
      var cls = "sf-node-g" + (twinOf[s] ? " sf-twin" : "") + (opts.cur === s ? " on" : "") + (opts.nodeClass ? " " + (opts.nodeClass(s, i) || "") : "");
      var ng = svg("g", { class: cls });
      ng.appendChild(svg("circle", { cx: p[0], cy: p[1], r: r, class: "sf-node" }));
      var fs = s.length > 3 ? (r < 16 ? 7.5 : 9.5) : (r < 16 ? 9.5 : 11.5);
      ng.appendChild(svg("text", { x: p[0], y: p[1] + fs / 3, "text-anchor": "middle", class: "sf-node-name", "font-size": fs }, s));
      if (opts.codes) {
        var below = p[1] + r + 13;
        var hasDown = g.adj[i].some(function (j) { return pos[g.names[j]][1] > p[1] + r; });
        if (below > H - 2 || (hasDown && !g.loop[i])) below = p[1] - r - 6;
        ng.appendChild(svg("text", { x: p[0], y: below, "text-anchor": "middle", class: "sf-node-code" }, E.toBits(opts.codes[i], opts.n)));
      }
      gN.appendChild(ng);
    });
    return { pos: pos, g: g };
  }

  /* ------------------------------------------------------------ demo 1: the branch predictor */

  function predictorSetup(structure, enc) {
    var ex = E.examples;
    var fsm, map;
    if (structure === "orig") {
      fsm = E.exampleFsm(ex.predictor);
      if (enc === "binary") map = ex.predictor.binary;
      else if (enc === "onehot") map = { ST: "1000", WT: "0100", WNT: "0010", SNT: "0001" };
      else map = { ST: "0101", WT: "1100", WNT: "1001", SNT: "1010" }; // 2012 S*O codes of ST1, WT, WNT, SNT1
    } else {
      fsm = E.exampleFsm(ex.predictorSecure);
      map = ex.predictorSecure.encodings[enc];
    }
    var g = E.graph(fsm);
    var codes = E.codesFrom(g, map);
    return { fsm: fsm, g: g, codes: codes, n: map[g.names[0]].length };
  }

  function mountPredictor(root) {
    var sim = { structure: "orig", enc: "binary", s: "ST", hist: [], rand: mulberry(11), timer: null, last: null };
    var setup = predictorSetup(sim.structure, sim.enc);
    var structSeg = seg([
      { value: "orig", label: "Original (4 states)" },
      { value: "sfsm", label: "S*FSM (6 states)" }
    ], "orig", function (v) { sim.structure = v; rebuild(true); }, "Structure");
    var encSeg = seg([
      { value: "binary", label: "Binary" },
      { value: "onehot", label: "One-hot" },
      { value: "sopt", label: "S*Optimal" }
    ], "binary", function (v) { sim.enc = v; rebuild(false); }, "Encoding");
    var taken = el("button", { type: "button", class: "w-btn", text: "Branch taken" });
    var notTaken = el("button", { type: "button", class: "w-btn", text: "Not taken" });
    var run = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "Run 40 random branches" });
    var reset = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "Reset" });
    var graphSvg = svg("svg", { id: "sf-pred-graph", class: "sf-graph", role: "img", "aria-label": "The branch predictor's states, codes, and transitions" });
    var chart = svg("svg", { class: "sf-trace-chart", role: "img", "aria-label": "Hamming weight and Hamming distance readings for the last 40 branches" });
    var readout = el("div", { class: "sf-readout", "aria-live": "polite" });
    var summary = el("p", { class: "w-note w-mono", "data-levels": "hs ug grad res" });
    root.appendChild(el("div", { class: "w-actions" }, [el("span", { class: "w-mono", text: "Structure" }), structSeg]));
    root.appendChild(el("div", { class: "w-actions" }, [el("span", { class: "w-mono", text: "Codes" }), encSeg]));
    root.appendChild(graphSvg);
    root.appendChild(el("div", { class: "w-actions" }, [taken, notTaken, run, reset]));
    root.appendChild(chart);
    root.appendChild(readout);
    root.appendChild(summary);
    root.appendChild(el("p", { class: "w-note", text: "Bar heights are the two Hamming models an attacker fits to a power trace: the number of ones held in the state register (weight) and the number of bits that flip on a clock tick (distance). This page computes them from the codes; the 2012 paper simulated the same models in software." }));

    function rebuild(structureChanged) {
      if (structureChanged) {
        sim.s = "ST"; sim.hist = []; sim.last = null;
      } else if (sim.structure === "sfsm" && sim.s === "ST") sim.s = "ST1";
      setup = predictorSetup(sim.structure, sim.enc);
      if (setup.g.names.indexOf(sim.s) < 0) sim.s = sim.structure === "sfsm" ? "ST1" : "ST";
      // re-read history under the new codes
      sim.hist = sim.hist.map(function (h) { return reading(h.from, h.to, h.bit); }).filter(Boolean);
      draw();
    }
    function idx(s) { return setup.g.names.indexOf(s); }
    function reading(from, to, bit) {
      var i = idx(from), j = idx(to);
      if (i < 0 || j < 0) return null;
      return { from: from, to: to, bit: bit, hw: E.popcount(setup.codes[j]), hd: E.hd(setup.codes[i], setup.codes[j]) };
    }
    function stepOnce(bit) {
      var nxt = E.step(setup.fsm, sim.s, bit);
      var r = reading(sim.s, nxt, bit);
      sim.hist.push(r); if (sim.hist.length > 40) sim.hist.shift();
      sim.last = r; sim.s = nxt;
      draw();
    }
    taken.addEventListener("click", function () { stopRun(); stepOnce(1); });
    notTaken.addEventListener("click", function () { stopRun(); stepOnce(0); });
    reset.addEventListener("click", function () { stopRun(); sim.s = sim.structure === "sfsm" ? "ST1" : "ST"; sim.hist = []; sim.last = null; draw(); });
    function stopRun() { if (sim.timer) { clearInterval(sim.timer); sim.timer = null; run.classList.remove("running"); run.textContent = "Run 40 random branches"; } }
    run.addEventListener("click", function () {
      if (sim.timer) { stopRun(); return; }
      var left = 40;
      run.classList.add("running"); run.textContent = "Stop";
      sim.timer = setInterval(function () {
        stepOnce(sim.rand() < 0.5 ? 1 : 0);
        if (--left <= 0) stopRun();
      }, 90);
    });

    function draw() {
      var names = setup.g.names;
      drawGraph(graphSvg, "predictor", setup.fsm, sim.structure === "sfsm" ? { ST2: "ST1", SNT2: "SNT1" } : {}, {
        codes: setup.codes, n: setup.n, cur: sim.s,
        edgeLabel: function (e) { return String(E.hd(setup.codes[e[0]], setup.codes[e[1]])); }
      });
      drawTrace();
      var rd = E.readings(setup.g, setup.codes);
      var key = sim.structure + "-" + sim.enc;
      var paper = PAPER_RANGES[key];
      summary.textContent = "Weights this code can show: " + list(rd.hw) + ". Distances a tick can show: " + list(rd.hd) + "." +
        (paper ? " The paper lists weight " + paper.hw + " and distance " + paper.hd + (key === "orig-binary" ? " (Figure 2)." : " (Table 1).") : "");
      if (!sim.last) {
        readout.innerHTML = "";
        readout.appendChild(el("p", { class: "w-big", html: "Press a branch button. The predictor starts in <strong>" + (sim.structure === "sfsm" ? "ST1" : "ST") + "</strong> (strongly taken)." }));
        return;
      }
      var L = sim.last;
      var sameW = names.filter(function (s, i) { return E.popcount(setup.codes[i]) === L.hw; });
      var sameD = setup.g.edges.filter(function (e) { return E.hd(setup.codes[e[0]], setup.codes[e[1]]) === L.hd; }).length +
        (L.hd === 0 ? setup.g.nLoop : 0);
      var nTrans = setup.g.edges.length + setup.g.nLoop;
      readout.innerHTML = "";
      readout.appendChild(el("p", { class: "w-big", html:
        "Now in <strong>" + L.to + "</strong>. Weight reading " + L.hw + ": " +
        (sameW.length === 1 ? "only <strong>" + L.to + "</strong> shows it, so the meter names the state." :
         sameW.length === names.length ? "every state shows it, so the meter learns nothing about the state." :
         num(sameW.length) + " of " + num(names.length) + " states (" + list(sameW) + ") show it.") }));
      readout.appendChild(el("p", { class: "w-note", html:
        "Distance reading " + L.hd + (L.hd === 0 ? " (the machine stayed put)" : "") + ": " +
        (sameD === nTrans ? "every transition flips the same number of bits, so the move is hidden." :
         num(sameD) + " of " + num(nTrans) + " transitions flip " + num(L.hd) + " bit" + (L.hd === 1 ? "" : "s") + ".") }));
    }
    function drawTrace() {
      var W = chartWidth(chart), H = 150, padL = 74, padR = 8;
      chart.setAttribute("viewBox", "0 0 " + W + " " + H);
      clear(chart);
      var maxN = setup.n, n = 40, bw = (W - padL - padR) / n;
      var rows = [{ y: 10, key: "hw", label: "weight", cls: "sf-bar-hw" }, { y: 82, key: "hd", label: "flips", cls: "sf-bar-hd" }];
      rows.forEach(function (row) {
        var h = 54;
        chart.appendChild(svg("line", { x1: padL, x2: W - padR, y1: row.y + h, y2: row.y + h, class: "c-grid" }));
        chart.appendChild(svg("text", { x: padL - 8, y: row.y + h / 2 + 4, "text-anchor": "end", class: "c-label" }, row.label));
        chart.appendChild(svg("text", { x: padL - 8, y: row.y + h, "text-anchor": "end", class: "c-tick" }, "0"));
        chart.appendChild(svg("text", { x: padL - 8, y: row.y + 9, "text-anchor": "end", class: "c-tick" }, String(maxN)));
        sim.hist.forEach(function (r, i) {
          var v = r[row.key], bh = v / maxN * h;
          chart.appendChild(svg("rect", { x: padL + i * bw + 1, y: row.y + h - bh, width: Math.max(1, bw - 2), height: Math.max(bh, v === 0 ? 0 : 1), class: row.cls }));
        });
      });
    }
    resizers.push(draw);
    draw();
  }

  /* ------------------------------------------------------------ demo 2: unrolling self-loops */

  function machineSeg(onPick) {
    var opts = PICKS.map(function (k) { return { value: k, label: machineLabel(k) }; });
    var s = seg(opts, state.machine, function (v) { state.machine = v; changed(); }, "Machine");
    onChange(function () { s.set(state.machine); });
    void onPick;
    return s;
  }

  function mountUnroll(root) {
    var st = { done: [] };
    var pick = machineSeg();
    var about = el("p", { class: "w-note w-mono" });
    var next = el("button", { type: "button", class: "w-btn", text: "Unroll the next self-loop" });
    var all = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "Unroll all" });
    var reset = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "Reset" });
    var g = svg("svg", { id: "sf-unroll-graph", class: "sf-graph", role: "img", "aria-label": "The selected machine before and after self-loops are unrolled" });
    var table = el("table", { class: "results-table sf-count-table" });
    var readout = el("p", { class: "w-big", "aria-live": "polite" });
    root.appendChild(el("div", { class: "w-actions" }, [pick]));
    root.appendChild(about);
    root.appendChild(el("div", { class: "w-actions" }, [next, all, reset]));
    root.appendChild(g);
    root.appendChild(readout);
    root.appendChild(el("div", { class: "sf-table-wrap" }, [table]));

    var base, loops;
    function load() {
      base = machine(state.machine);
      loops = E.unroll(base).loopStates;
      st.done = [];
      draw();
    }
    next.addEventListener("click", function () { if (st.done.length < loops.length) { st.done.push(loops[st.done.length]); draw(); } });
    all.addEventListener("click", function () { st.done = loops.slice(); draw(); });
    reset.addEventListener("click", function () { st.done = []; draw(); });
    onChange(load);

    function draw() {
      about.textContent = machineAbout(state.machine);
      var cur = st.done.length ? E.unroll(base, st.done) : base;
      var twinOf = {};
      if (cur.twin) Object.keys(cur.twin).forEach(function (s) { twinOf[cur.twin[s]] = s; });
      var lastTwin = st.done.length ? cur.twin[st.done[st.done.length - 1]] : null;
      drawGraph(g, state.machine, cur, twinOf, {
        nodeClass: function (s) { return s === lastTwin ? "sf-new" : ""; },
        edgeClass: function (e) {
          var gg = E.graph(cur);
          return (lastTwin && (gg.names[e[0]] === lastTwin || gg.names[e[1]] === lastTwin)) ? "sf-edge-new" : "";
        }
      });
      var g0 = E.graph(base), g1 = E.graph(cur), gAll = E.graph(E.unroll(base));
      next.disabled = st.done.length >= loops.length;
      if (!loops.length) readout.innerHTML = "This machine has no self-loops, so it is already structurally secure.";
      else if (!st.done.length) readout.innerHTML = "<strong>" + loops.length + "</strong> state" + (loops.length === 1 ? " has a" : "s have") + " self-loop" + (loops.length === 1 ? "" : "s") + ": " + list(loops) + ".";
      else {
        var v = st.done[st.done.length - 1];
        readout.innerHTML = "Unrolled <strong>" + v + "</strong>: its twin <strong>" + cur.twin[v] + "</strong> takes over the stay-put condition, and every move out of " + v + " is copied to leave " + cur.twin[v] + " as well." +
          (st.done.length === loops.length ? " No self-loops remain." : "");
      }
      clear(table);
      var head = el("tr", {}, [el("th", { text: "" }), el("th", { text: "Original" }), el("th", { text: "Now" }), el("th", { text: "All loops unrolled" })]);
      table.appendChild(el("thead", {}, [head]));
      var tb = el("tbody");
      function row(label, a, b, c, levels) {
        var tr = el("tr", {}, [el("th", { text: label, scope: "row" }), el("td", { text: String(a) }), el("td", { text: String(b) }), el("td", { text: String(c) })]);
        if (levels) tr.setAttribute("data-levels", levels);
        tb.appendChild(tr);
      }
      row("States", g0.names.length, g1.names.length, gAll.names.length);
      row("State pairs with a transition", g0.edges.length, g1.edges.length, gAll.edges.length);
      row("Self-loops", g0.nLoop, g1.nLoop, gAll.nLoop);
      if (state.machine !== "predictor" && state.machine !== "three") row("KISS2 product terms", g0.terms, g1.terms, gAll.terms, "ug grad res");
      row("Binary code length (bits)", E.minBits(g0.names.length), E.minBits(g1.names.length), E.minBits(gAll.names.length), "hs ug grad res");
      table.appendChild(tb);
    }
    resizers.push(draw);
    load();
  }

  /* ------------------------------------------------------------ demo 3: secure codes */

  function mountEncode(root) {
    var st = { family: "secure", result: null, codes: null, n: 0, rand: mulberry(5) };
    var pick = machineSeg();
    var fam = seg([
      { value: "secure", label: "Shortest secure code" },
      { value: "chd2", label: "Low power: distance 2", levels: "ug grad res" },
      { value: "chd4", label: "Distance 4", levels: "ug grad res" },
      { value: "oh", label: "One-hot" }
    ], "secure", function (v) { st.family = v; solve(); }, "Code family");
    var find = el("button", { type: "button", class: "w-btn", text: "Search again in your browser" });
    var shuffle = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "Shuffle the codes" });
    var g = svg("svg", { id: "sf-encode-graph", class: "sf-graph", role: "img", "aria-label": "The structurally secure machine labeled with its codes and the bit flips on each transition" });
    var verdict = el("p", { class: "w-big", "aria-live": "polite" });
    var detail = el("p", { class: "w-note w-mono", "data-levels": "ug grad res" });
    root.appendChild(el("div", { class: "w-actions" }, [pick]));
    root.appendChild(el("div", { class: "w-actions" }, [fam]));
    root.appendChild(el("div", { class: "w-actions" }, [find, shuffle]));
    root.appendChild(g);
    root.appendChild(verdict);
    root.appendChild(detail);
    root.appendChild(el("p", { class: "w-note", text: "Numbers on the arrows count the bits that flip on that transition. The search runs on your device and is exact: it proves no shorter code exists before it reports a length." }));

    var fsm, gr, twinOf;
    function load() {
      fsm = E.unroll(machine(state.machine));
      if (state.machine === "predictor") {
        // match the 2012 naming (ST1/ST2, SNT1/SNT2) for the paper's codes
        fsm = E.exampleFsm(E.examples.predictorSecure);
        twinOf = { ST2: "ST1", SNT2: "SNT1" };
      } else {
        twinOf = {};
        Object.keys(fsm.twin).forEach(function (s) { twinOf[fsm.twin[s]] = s; });
      }
      gr = E.graph(fsm);
      solve();
    }
    function solve() {
      var t0 = performance.now(), r;
      if (st.family === "oh") {
        r = { n: gr.names.length, c1: 1, c2: 2, codes: gr.names.map(function (s, i) { return 1 << (gr.names.length - 1 - i); }), exact: true };
      } else if (state.machine === "predictor" && st.family === "secure") {
        // the paper's own S*Optimal codes (Table 1); the search confirms 4 bits is shortest
        var s = E.shortest(gr, { budget: 2e6 });
        r = { n: s.n, c1: s.c1, c2: s.c2, exact: s.exact, codes: E.codesFrom(gr, E.examples.predictorSecure.encodings.sopt), paperCodes: true, nodes: s.nodes };
      } else {
        r = E.shortest(gr, { budget: 2e6, c2: st.family === "chd2" ? 2 : st.family === "chd4" ? 4 : undefined, stopAfterIncomplete: true });
      }
      r.ms = performance.now() - t0;
      st.result = r; st.codes = r.codes; st.n = r.n;
      draw();
    }
    find.addEventListener("click", function () {
      find.disabled = true; find.textContent = "Searching…";
      setTimeout(function () {
        if (state.machine === "predictor" && st.family === "secure") {
          var s = E.shortest(gr, { budget: 2e6 });
          st.result = { n: s.n, c1: s.c1, c2: s.c2, exact: s.exact, codes: s.codes, nodes: s.nodes, ms: 0 };
          st.codes = s.codes; st.n = s.n;
          draw();
        } else solve();
        find.disabled = false; find.textContent = "Search again in your browser";
      }, 20);
    });
    shuffle.addEventListener("click", function () {
      if (!st.codes) return;
      var c = st.codes.slice();
      for (var i = c.length - 1; i > 0; i--) { var j = Math.floor(st.rand() * (i + 1)); var t = c[i]; c[i] = c[j]; c[j] = t; }
      st.codes = c; st.result = Object.assign({}, st.result, { shuffled: true, paperCodes: false });
      draw();
    });
    onChange(load);

    function draw() {
      var r = st.result;
      if (!r || !r.n || !st.codes) {
        drawGraph(g, state.machine, fsm, twinOf, {});
        verdict.textContent = "The search hit its budget before finding a code. The full benchmark table below lists what longer runs found.";
        detail.textContent = "";
        return;
      }
      var target = r.c2;
      drawGraph(g, state.machine, fsm, twinOf, {
        codes: st.codes, n: st.n,
        edgeLabel: function (e) { return String(E.hd(st.codes[e[0]], st.codes[e[1]])); },
        edgeClass: function (e) { return E.hd(st.codes[e[0]], st.codes[e[1]]) !== target ? "sf-bad" : ""; }
      });
      var rd = E.readings(gr, st.codes);
      var bad = gr.edges.filter(function (e) { return E.hd(st.codes[e[0]], st.codes[e[1]]) !== target; }).length;
      var famText = st.family === "oh" ? "One-hot" : st.family === "chd2" ? "With every transition flipping exactly two bits" : st.family === "chd4" ? "With every transition flipping exactly four bits" : "The shortest secure code";
      if (r.shuffled && bad) {
        verdict.innerHTML = "Shuffled: <strong>" + bad + "</strong> of " + gr.edges.length + " transitions now flip a different number of bits, so a power meter could tell them apart. Search again to restore a secure assignment.";
      } else if (r.shuffled) {
        verdict.innerHTML = "This shuffle happens to keep every transition at " + num(target) + " flips. The code is still secure.";
      } else {
        verdict.innerHTML = famText + " uses <strong>" + num(st.n) + " bits</strong>" + (r.paperCodes ? " (the paper's S*Optimal code from Table 1)" : "") +
          ": every state holds " + num(r.c1) + " one" + (r.c1 === 1 ? "" : "s") + " and every transition flips " + num(r.c2) + " bits. A binary code for the same " + num(gr.names.length) + " states needs " + num(E.minBits(gr.names.length)) + ".";
      }
      var parts = ["weights seen: " + list(rd.hw), "distances seen: " + list(rd.hd), "peak flips each way (Npeak) = " + (r.c2 / 2)];
      if (r.nodes != null && st.family !== "oh") parts.push("search nodes: " + r.nodes.toLocaleString() + (r.ms != null ? " in " + Math.max(1, Math.round(r.ms)) + " ms" : ""));
      if (r.exact === false) parts.push("search budget reached; length not proven shortest");
      detail.textContent = parts.join(" · ");
    }
    resizers.push(draw);
    load();
  }

  /* ------------------------------------------------------------ demo 4: capacity (Table I) */

  function mountCapacity(root) {
    var st = { S: 20, T: 6 };
    var sIn = el("input", { type: "range", min: "2", max: "120", value: String(st.S), "aria-label": "States to encode" });
    var tIn = el("input", { type: "range", min: "1", max: "30", value: String(st.T), "aria-label": "Most connections from one state" });
    var sOut = el("output", { text: String(st.S) }), tOut = el("output", { text: String(st.T) });
    var chart = svg("svg", { class: "sf-cap-chart", role: "img", "aria-label": "Codes available at each length for binary, balanced, and one-hot encodings" });
    var readout = el("p", { class: "w-big", "aria-live": "polite" });
    var table = el("table", { class: "results-table sf-cap-table", "data-levels": "ug grad res" });
    root.appendChild(el("label", { class: "w-range" }, [el("span", { text: "States" }), sIn, sOut]));
    root.appendChild(el("label", { class: "w-range", "data-levels": "ug grad res" }, [el("span", { text: "Connections" }), tIn, tOut]));
    root.appendChild(chart);
    root.appendChild(readout);
    root.appendChild(el("div", { class: "sf-table-wrap" }, [table]));
    root.appendChild(el("p", { class: "w-note", text: "Balanced codes have half their bits set (c = ⌊n/2⌋). The table repeats the 2013 paper's Table I; every row is recomputed here and matches." }));
    sIn.addEventListener("input", function () { st.S = +sIn.value; sOut.textContent = sIn.value; draw(); });
    tIn.addEventListener("input", function () { st.T = +tIn.value; tOut.textContent = tIn.value; draw(); });

    function draw() {
      var W = chartWidth(chart), H = 230, padL = 46, padR = 10, padT = 12, padB = 34;
      chart.setAttribute("viewBox", "0 0 " + W + " " + H);
      clear(chart);
      var ns = []; for (var n = 2; n <= 12; n++) ns.push(n);
      var maxLog = Math.log10(4096);
      var x0 = padL, cw = (W - padL - padR) / ns.length;
      function y(v) { return padT + (H - padT - padB) * (1 - Math.log10(Math.max(v, 1)) / maxLog); }
      [1, 10, 100, 1000].forEach(function (v) {
        chart.appendChild(svg("line", { x1: padL, x2: W - padR, y1: y(v), y2: y(v), class: "c-grid" }));
        chart.appendChild(svg("text", { x: padL - 6, y: y(v) + 4, "text-anchor": "end", class: "c-tick" }, v >= 1000 ? "1k" : String(v)));
      });
      chart.appendChild(svg("line", { x1: padL, x2: W - padR, y1: y(st.S), y2: y(st.S), class: "c-paper" }));
      chart.appendChild(svg("text", { x: W - padR, y: y(st.S) - 5, "text-anchor": "end", class: "c-label" }, st.S + " states"));
      var bin = null, bal = null, oh = null;
      ns.forEach(function (n, i) {
        var row = E.sOptRow(n), vals = [Math.pow(2, n), row.smax, n], cls = ["sf-cap-bin", "sf-cap-bal", "sf-cap-oh"];
        var bw = (cw - 6) / 3;
        vals.forEach(function (v, k) {
          chart.appendChild(svg("rect", { x: x0 + i * cw + 3 + k * bw, y: y(v), width: Math.max(1, bw - 1), height: H - padB - y(v), class: cls[k] }));
        });
        chart.appendChild(svg("text", { x: x0 + i * cw + cw / 2, y: H - padB + 14, "text-anchor": "middle", class: "c-tick" }, String(n)));
        if (bin == null && Math.pow(2, n) >= st.S) bin = n;
        if (bal == null && row.smax >= st.S && row.tmax >= st.T) bal = n;
      });
      oh = st.S;
      chart.appendChild(svg("text", { x: padL + (W - padL - padR) / 2, y: H - 4, "text-anchor": "middle", class: "c-label" }, "code length n (bits)"));
      var lg = svg("g");
      [["sf-cap-bin", "binary 2ⁿ"], ["sf-cap-bal", "balanced C(n, ⌊n/2⌋)"], ["sf-cap-oh", "one-hot n"]].forEach(function (p, k) {
        lg.appendChild(svg("rect", { x: padL + 6 + k * 150, y: padT - 2, width: 10, height: 10, class: p[0] }));
        lg.appendChild(svg("text", { x: padL + 20 + k * 150, y: padT + 7, class: "c-label" }, p[1]));
      });
      if (W >= 480) chart.appendChild(lg);
      var balRow = bal ? E.sOptRow(bal) : null;
      if (bal == null) { var nn = 13; while (!(E.sOptRow(nn).smax >= st.S && E.sOptRow(nn).tmax >= st.T)) nn++; bal = nn; balRow = E.sOptRow(nn); }
      readout.innerHTML = st.S + " states need <strong>" + num(bin) + "</strong> bits in binary, <strong>" + num(bal) + "</strong> bits in a balanced S*Opt code" +
        "<span data-levels=\"ug grad res\"> (" + balRow.smax + " codes, each with " + balRow.tmax + " neighbors two flips away, enough for " + st.T + " connections)</span>, and <strong>" + oh + "</strong> one-hot.";
      clear(table);
      table.appendChild(el("thead", {}, [el("tr", {}, ["n", "c", "SMAX = C(n, c)", "TMAX = c(n − c)"].map(function (h) { return el("th", { text: h }); }))]));
      var tb = el("tbody");
      ns.forEach(function (n) {
        var r = E.sOptRow(n);
        var tr = el("tr", { class: n === bal ? "on" : "" }, [r.n, r.c, r.smax, r.tmax].map(function (v) { return el("td", { text: String(v) }); }));
        tb.appendChild(tr);
      });
      table.appendChild(tb);
    }
    resizers.push(draw);
    draw();
  }

  /* ------------------------------------------------------------ demo 5: cost on MCNC benchmarks */

  var COST_METRICS = [
    { value: "states", label: "States", what: "more states after unrolling", paperNote: "Table III" },
    { value: "terms", label: "Product terms", what: "more KISS2 product terms after unrolling", paperNote: "Table III" },
    { value: "binS", label: "Binary bits", what: "longer binary code for the unrolled machine", paperNote: "Table IV, SFSM (Binary)", levels: "hs ug grad res" },
    { value: "secure", label: "Secure bits", what: "longer shortest secure code (constant weight and distance, unrolled machine)", paperNote: "Table IV, SFSM (S*Optimal)" },
    { value: "rhd", label: "RHD bits", what: "longer code that keeps self-loops and equalizes only the distance of every other move (RHD)", paperNote: "Table IV, FSM (RHD)", levels: "ug grad res" },
    { value: "rhdhw", label: "RHD + HW bits", what: "longer code that keeps self-loops and equalizes weight and the distance of every other move", paperNote: "Table IV, FSM (RHD+HW)", levels: "ug grad res" },
    { value: "chd4", label: "Distance 4", what: "longer secure code with every move flipping four bits", paperNote: "Table V, (−, 4)", levels: "grad res" },
    { value: "chd2", label: "Distance 2", what: "longer secure code with every move flipping two bits", paperNote: "Table V, (−, 2)", levels: "grad res" },
    { value: "oh", label: "One-hot", what: "longer one-hot code for the unrolled machine", paperNote: "Table V, (1, 2)", levels: "ug grad res" }
  ];

  function costValue(m, key) {
    if (key === "states") return { v: 100 * (m.S2 / m.S - 1), ok: true };
    if (key === "terms") return { v: 100 * (m.T2 / m.T - 1), ok: true };
    var bits;
    if (key === "binS") bits = m.binS;
    else if (key === "oh") bits = m.S2;
    else {
      var r = m[key];
      if (!r || !r.n) return { v: null, ok: false };
      bits = r.n;
      if (!r.exact) return { v: 100 * (bits / m.binO - 1), ok: false, bits: bits };
    }
    return { v: 100 * (bits / m.binO - 1), ok: true, bits: bits };
  }

  function mountCost(root) {
    var st = { metric: "states", small: true };
    var pick = seg(COST_METRICS, "states", function (v) { st.metric = v; draw(); }, "Cost measure");
    var scope = seg([
      { value: true, label: "Up to 32 states" },
      { value: false, label: "All 52 machines" }
    ], true, function (v) { st.small = v; draw(); }, "Machines");
    var chart = svg("svg", { class: "sf-cost-chart", role: "img", "aria-label": "Percent cost of securing each MCNC benchmark machine" });
    var readout = el("p", { class: "w-big", "aria-live": "polite" });
    var note = el("p", { class: "w-note" });
    root.appendChild(el("div", { class: "w-actions" }, [pick]));
    root.appendChild(el("div", { class: "w-actions" }, [scope]));
    root.appendChild(chart);
    root.appendChild(readout);
    root.appendChild(note);

    function draw() {
      var ms = Object.keys(state.data.machines).map(function (k) { return state.data.machines[k]; })
        .filter(function (m) { return !st.small || m.S2 <= 32; });
      var vals = ms.map(function (m) { var c = costValue(m, st.metric); return { m: m, c: c }; });
      var settled = vals.filter(function (x) { return x.c.ok; });
      settled.sort(function (a, b) { return a.c.v - b.c.v || a.m.name.localeCompare(b.m.name); });
      var open = vals.filter(function (x) { return !x.c.ok; });
      var avg = settled.reduce(function (s, x) { return s + x.c.v; }, 0) / (settled.length || 1);
      var W = chartWidth(chart), rowH = W < 480 ? 13 : 15, padL = 70, padR = 54, padT = 22;
      var rows = settled.concat(open);
      var H = padT + rows.length * rowH + 40;
      chart.setAttribute("viewBox", "0 0 " + W + " " + H);
      clear(chart);
      var paper = PAPER_AVG[st.metric];
      var maxV = Math.max(paper || 0, avg, settled.length ? settled[settled.length - 1].c.v : 0, 10);
      maxV = Math.ceil(maxV / 50) * 50;
      function x(v) { return padL + (W - padL - padR) * Math.max(0, v) / maxV; }
      for (var t = 0; t <= maxV; t += (maxV > 400 ? 200 : maxV > 200 ? 100 : 50)) {
        chart.appendChild(svg("line", { x1: x(t), x2: x(t), y1: padT - 4, y2: H - 36, class: "c-grid" }));
        chart.appendChild(svg("text", { x: x(t), y: padT - 8, "text-anchor": "middle", class: "c-tick" }, "+" + t + "%"));
      }
      rows.forEach(function (r, i) {
        var yy = padT + i * rowH;
        chart.appendChild(svg("text", { x: padL - 6, y: yy + rowH - 4, "text-anchor": "end", class: "c-tick" }, r.m.name));
        if (r.c.ok) {
          chart.appendChild(svg("rect", { x: padL, y: yy + 2, width: Math.max(1, x(r.c.v) - padL), height: rowH - 4, class: "sf-cost-bar" }));
          chart.appendChild(svg("text", { x: x(r.c.v) + 4, y: yy + rowH - 4, class: "c-tick" }, Math.round(r.c.v) + "%"));
        } else {
          chart.appendChild(svg("text", { x: padL + 4, y: yy + rowH - 4, class: "c-tick" }, r.c.bits ? "search budget reached at " + r.c.bits + " bits" : "search budget reached"));
        }
      });
      chart.appendChild(svg("line", { x1: x(avg), x2: x(avg), y1: padT - 4, y2: H - 22, class: "sf-avg" }));
      chart.appendChild(svg("text", { x: Math.min(x(avg), W - 150), y: H - 10, class: "c-label" }, "page mean +" + Math.round(avg) + "%"));
      if (paper != null) {
        chart.appendChild(svg("line", { x1: x(paper), x2: x(paper), y1: padT - 4, y2: H - 36, class: "c-paper" }));
        chart.appendChild(svg("text", { x: Math.min(x(paper), W - 150), y: H - 24, class: "c-label" }, "paper +" + paper + "% (12 machines)"));
      }
      var M = COST_METRICS.filter(function (m) { return m.value === st.metric; })[0];
      readout.innerHTML = "Across <strong>" + settled.length + "</strong> machines, securing them costs <strong>" + pct(avg) + "</strong> on average (" + M.what + ")." +
        (paper != null ? " The 2014 paper reports " + pct(paper) + " for its 12 machines (" + M.paperNote + ")." : "");
      note.textContent = (open.length ? open.length + " machine" + (open.length === 1 ? "" : "s") + " hit the search budget and are left out of the mean. " : "") +
        "Computed by this page on the LGSynth'91 (MCNC) benchmarks; bit lengths are relative to the original machine's binary code. The paper does not name its 12 machines, so the two means describe different sets.";
    }
    resizers.push(draw);
    draw();
  }

  /* ------------------------------------------------------------ boot */

  var mounts = [
    ["sf-predictor", mountPredictor], ["sf-unroll", mountUnroll], ["sf-encode", mountEncode],
    ["sf-capacity", mountCapacity], ["sf-cost", mountCost]
  ];

  fetch(SCRIPT_BASE + "sfsm-data.json").then(function (r) { return r.json(); }).then(function (data) {
    state.data = data;
    mounts.forEach(function (m) {
      var root = document.getElementById(m[0]);
      if (!root) return;
      m[1](root);
      root.classList.add("w-ready");
    });
  }).catch(function (err) {
    mounts.forEach(function (m) {
      var root = document.getElementById(m[0]);
      if (root) root.appendChild(el("p", { class: "w-note", text: "The demo data did not load (" + err + ")." }));
    });
  });
})();

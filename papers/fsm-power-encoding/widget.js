/*
  Secure state encoding widget for /papers/fsm-power-encoding/.
  Mount points: #fp-trace, #fp-sets, #fp-encode, #fp-tradeoff, #fp-power.
  Demos 2 to 4 share one benchmark choice and one security level l.
*/
(function () {
  "use strict";

  var E = window.FSMEngine;
  if (!E) return;

  var SCRIPT_BASE = (document.currentScript && document.currentScript.src || "").replace(/[^/]*$/, "");
  var SVGNS = "http://www.w3.org/2000/svg";
  var DELTA = 0.17;

  /* ------------------------------------------------------------ paper data */

  // Table 3 (JETTA 2019) / Table II (VLSID 2019): BBARA encodings, st0 to st9.
  var TABLE3 = {
    min: { label: "Minimal", bits: "1010 1100 0100 0111 1111 0001 1000 0011 1110 0000", sa: 0.443, power: 1.59,
      hw: "0, 1, 2, 3, 4", hd: "0, 1, 2, 3, 4" },
    sec: { label: "Secure", bits: "01110 00100 10110 11001 01000 11010 01101 11100 10000 10011", sa: 0.5148, power: 1.56,
      hw: "1, 3", hd: "0, 2, 4" },
    lp: { label: "Low power & secure", bits: "101101 100100 100001 100111 000101 000110 110110 110101 010100 001100", sa: 0.445, power: 1.41,
      hw: "2, 4", hd: "0, 2" }
  };
  // Fig. 6: BBARA divided into four sets.
  var FIG6 = { st0: 1, st7: 1, st1: 2, st4: 2, st8: 2, st2: 3, st5: 3, st9: 3, st3: 4, st6: 4 };
  // Fig. 13: increase over the minimal length (4 bits) for BBARA, l = 1 to 7.
  var FIG13 = { 1: 3, 2: 2, 3: 1, 4: 1, 5: 1, 6: 1, 7: 1 };
  // Table 7: dynamic power by encoding style (column labeled mW in the paper).
  var TABLE7 = [
    { n: "bbara", nova: 83.91, jedi: 59.44, seq: 52.77, sat: 51.62 },
    { n: "bbtas", nova: 144.29, jedi: 112.50, seq: 83.15, sat: 83.15 },
    { n: "beecount", nova: 160.50, jedi: 108.05, seq: 89.42, sat: 79.18 },
    { n: "dk14", nova: 311.29, jedi: 263.69, seq: 223.65, sat: 207.28 },
    { n: "dk27", nova: 299.11, jedi: 325.89, seq: 223.21, sat: 223.21 },
    { n: "modulo12", nova: 156.25, jedi: 93.75, seq: 93.75, sat: 93.75 },
    { n: "s27", nova: 216.65, jedi: 170.43, seq: 168.33, sat: 166.22 },
    { n: "s8", nova: 53.21, jedi: 42.41, seq: 33.90, sat: 27.47 },
    { n: "train11", nova: 107.34, jedi: 77.45, seq: 63.52, sat: 62.50 }
  ];
  // Eq. 10 with VDD = 5 V, f = 5 MHz, C = 3 pF: P = 0.5 VDD^2 f C SA, in microwatts.
  var PSCALE = 0.5 * 25 * 5e6 * 3e-12 * 1e6;

  var PICKS = ["bbara", "dk15", "s8", "bbtas", "dk14", "dk27", "s27", "modulo12"];
  var ABOUT = {
    bbara: "10 states, 4 inputs",
    dk15: "4 states, 3 inputs",
    s8: "5 states, 4 inputs",
    bbtas: "6 states, 2 inputs",
    dk14: "7 states, 3 inputs",
    dk27: "7 states, 1 input",
    s27: "6 states, 4 inputs",
    modulo12: "12 states, 1 input"
  };

  /* ------------------------------------------------------------ state */

  var state = {
    data: null,
    fsm: "bbara",
    l: 4,
    mode: "lowpower",
    level: window.PaperKit ? window.PaperKit.level() : "public",
    key: "pin"
  };
  var listeners = [];
  function onChange(fn) { listeners.push(fn); }
  function changed() { listeners.forEach(function (fn) { fn(); }); }
  function setFsm(n) {
    state.fsm = n;
    var d = cur();
    if (n === "bbara") state.l = 4;
    else state.l = Math.min(state.l, d.Lmax);
    changed();
  }
  function setL(l) { state.l = l; changed(); }
  function cur() { return state.data.fsms[state.fsm]; }

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
      b.addEventListener("click", function () { set(o.value); onPick(o.value); });
      wrap.appendChild(b);
      return b;
    });
    function set(v) { btns.forEach(function (b, i) { b.setAttribute("aria-checked", String(options[i].value === v)); }); }
    wrap.set = set;
    return wrap;
  }

  function codesOf(enc) { return enc.codes.map(function (s) { return parseInt(s, 2); }); }
  function sdText(p) { return E.sdLabel({ rise: p[0], fall: p[1] }); }
  function fmt(x, d) { return x == null ? "–" : x.toFixed(d == null ? 4 : d); }
  function setColor(k) { return "fp-set fp-set-" + (k % 8); }

  function mulberry(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  var worker = null, jobs = {}, jobId = 0;
  function runJob(job, cb) {
    if (!worker) {
      try { worker = new Worker(SCRIPT_BASE + "fsm-worker.js"); }
      catch (err) { cb({ error: String(err) }); return; }
      worker.onmessage = function (e) { var fn = jobs[e.data.id]; delete jobs[e.data.id]; if (fn) fn(e.data); };
      worker.onerror = function (e) { Object.keys(jobs).forEach(function (k) { jobs[k]({ error: e.message || "worker error" }); delete jobs[k]; }); worker = null; };
    }
    job.id = ++jobId;
    jobs[job.id] = cb;
    worker.postMessage(job);
  }
  function fsmPayload(d) { return { states: d.states, start: d.start, trans: d.trans, P: d.P }; }

  /* ------------------------------------------------------------ demo 1: what the meter sees */

  function mountTrace(root) {
    var d = state.data.fsms.bbara;
    var order = d.states.map(function (n) { return +n.slice(2); }); // data index -> st number
    var encs = {};
    Object.keys(TABLE3).forEach(function (k) {
      var arr = TABLE3[k].bits.split(" ");
      encs[k] = d.states.map(function (n) { return parseInt(arr[+n.slice(2)], 2); });
      encs[k].R = arr[0].length;
    });
    var sim = { enc: "min", s: d.start, hist: [], rand: mulberry(7), timer: null, inp: null };
    var picker = seg([
      { value: "min", label: "Minimal (4 bits)" },
      { value: "sec", label: "Secure (5 bits)" },
      { value: "lp", label: "Low power & secure (6 bits)" }
    ], "min", function (v) { sim.enc = v; draw(); }, "Encoding");
    var play = el("button", { type: "button", class: "w-btn", text: "Run" });
    var step = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "Step" });
    var reset = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "Reset" });
    var chips = el("div", { class: "fp-chips", role: "list", "aria-label": "BBARA states" });
    var chipEls = [];
    for (var i = 0; i < 10; i++) {
      var di = order.indexOf(i);
      var c = el("div", { class: "fp-chip", role: "listitem" }, [
        el("span", { class: "fp-chip-name", text: "st" + i }),
        el("span", { class: "fp-chip-code", "data-levels": "hs ug grad res" }),
        el("span", { class: "fp-chip-hw", "data-levels": "ug grad res" })
      ]);
      c.dataset.idx = di;
      chips.appendChild(c);
      chipEls.push(c);
    }
    var chart = svg("svg", { class: "fp-trace-chart", role: "img", "aria-label": "Simulated power readings per clock cycle" });
    var readout = el("div", { class: "fp-readout" });
    var inputLine = el("p", { class: "w-note w-mono", "data-levels": "hs ug grad res" });
    root.appendChild(el("div", { class: "w-actions" }, [picker]));
    root.appendChild(el("div", { class: "w-actions" }, [play, step, reset]));
    root.appendChild(chips);
    root.appendChild(inputLine);
    root.appendChild(chart);
    root.appendChild(readout);
    root.appendChild(el("p", { class: "w-note", text: "Simulated with random inputs, the paper's assumption. Bar heights are the Hamming models an attacker fits to a power trace, computed by this page; the paper measured real power with circuit simulation." }));

    function stepOnce() {
      var v = Math.floor(sim.rand() * 16);
      var nx = d.next[sim.s][v];
      sim.hist.push({ from: sim.s, to: nx, v: v });
      if (sim.hist.length > 400) sim.hist.shift();
      sim.s = nx;
      sim.inp = v;
      draw();
    }
    function toggle() {
      if (sim.timer) { clearInterval(sim.timer); sim.timer = null; play.textContent = "Run"; play.classList.remove("running"); }
      else { sim.timer = setInterval(stepOnce, 260); play.textContent = "Pause"; play.classList.add("running"); }
    }
    play.addEventListener("click", toggle);
    step.addEventListener("click", function () { if (sim.timer) toggle(); stepOnce(); });
    reset.addEventListener("click", function () {
      if (sim.timer) toggle();
      sim.s = d.start; sim.hist = []; sim.rand = mulberry(7); sim.inp = null; draw();
    });

    function draw() {
      var codes = encs[sim.enc], R = codes.R;
      chipEls.forEach(function (c) {
        var di = +c.dataset.idx;
        c.classList.toggle("on", di === sim.s);
        c.querySelector(".fp-chip-code").textContent = E.toBits(codes[di], R);
        c.querySelector(".fp-chip-hw").textContent = "weight " + E.hw(codes[di]);
      });
      inputLine.textContent = sim.inp == null ? "Input: press Step or Run." :
        "Input " + E.toBits(sim.inp, 4) + " moved the machine to " + d.states[sim.s] + ".";
      // chart
      var W = chartWidth(chart), H = 196, padL = 34, padR = 8, padT = 26, mid = 98, bot = 186;
      chart.setAttribute("viewBox", "0 0 " + W + " " + H);
      chart.textContent = "";
      var n = Math.max(12, Math.floor((W - padL - padR) / 14));
      var hist = sim.hist.slice(-n), bw = (W - padL - padR) / n;
      var maxv = 6;
      function yA(v) { return mid - (mid - padT) * v / maxv; }
      function yB(v) { return bot - (bot - mid - 30) * v / maxv; }
      [0, 2, 4, 6].forEach(function (g) {
        chart.appendChild(svg("line", { class: "c-grid", x1: padL, x2: W - padR, y1: yA(g), y2: yA(g) }));
        chart.appendChild(svg("text", { class: "c-tick", x: padL - 6, y: yA(g) + 4, "text-anchor": "end" }, g));
      });
      [0, 2, 4, 6].forEach(function (g) {
        chart.appendChild(svg("line", { class: "c-grid", x1: padL, x2: W - padR, y1: yB(g), y2: yB(g) }));
        chart.appendChild(svg("text", { class: "c-tick", x: padL - 6, y: yB(g) + 4, "text-anchor": "end" }, g));
      });
      chart.appendChild(svg("text", { class: "c-label", x: padL, y: 12 }, "Holding the state: Hamming weight"));
      chart.appendChild(svg("text", { class: "c-label", x: padL, y: mid + 18 }, "Switching: Hamming distance"));
      hist.forEach(function (h, k) {
        var x = padL + k * bw + 1, w = Math.max(2, bw - 2);
        var a = E.hw(codes[h.to]), b = E.hd(codes[h.from], codes[h.to]);
        chart.appendChild(svg("rect", { class: "fp-bar-hw", x: x, y: yA(a), width: w, height: Math.max(0, yA(0) - yA(a)) }));
        chart.appendChild(svg("rect", { class: "fp-bar-hd", x: x, y: yB(b), width: w, height: Math.max(0, yB(0) - yB(b)) }));
      });
      // readout
      var hwSeen = {}, hdSeen = {};
      sim.hist.forEach(function (h) { hwSeen[E.hw(codes[h.to])] = 1; hdSeen[E.hd(codes[h.from], codes[h.to])] = 1; });
      var w = E.hw(codes[sim.s]);
      var same = codes.filter(function (c) { return E.hw(c) === w; }).length;
      readout.textContent = "";
      readout.appendChild(el("p", { class: "w-big" }, [
        "This reading fits ", el("strong", { text: String(same) }), " of the 10 states."
      ]));
      readout.appendChild(el("p", { class: "w-note" }, [
        "Different weights seen so far: " + Object.keys(hwSeen).length + ". Different switching distances seen: " + Object.keys(hdSeen).length + ". ",
        el("span", { "data-levels": "ug grad res", text: "Paper, Table 4: weights (" + TABLE3[sim.enc].hw + "), distances (" + TABLE3[sim.enc].hd + ")." })
      ]));
    }
    resizers.push(draw);
    draw();
  }

  /* ------------------------------------------------------------ shared picker */

  function fsmPicker() {
    var wrap = el("div", { class: "w-actions" });
    var s = seg(PICKS.map(function (n) { return { value: n, label: n.toUpperCase(), title: ABOUT[n] }; }), state.fsm, setFsm, "Benchmark state machine");
    onChange(function () { s.set(state.fsm); });
    wrap.appendChild(s);
    return wrap;
  }

  function lSlider() {
    var out = el("output", { text: String(state.l) });
    var input = el("input", { type: "range", min: 1, max: cur().Lmax, step: 1, value: state.l, "aria-label": "Number of sets l" });
    input.addEventListener("input", function () { setL(+input.value); });
    onChange(function () { input.max = cur().Lmax; input.value = state.l; out.textContent = state.l + " of " + cur().Lmax; });
    out.textContent = state.l + " of " + cur().Lmax;
    return el("label", { class: "w-range" }, [el("span", { text: "Sets (l)" }), input, out]);
  }

  /* ------------------------------------------------------------ demo 2: reachability sets */

  var LAYOUT = {
    bbara: { st0: [0.1, 0.05], st1: [0.5, 0.05], st2: [0.9, 0.05], st9: [0.1, 0.36], st3: [0.9, 0.36],
      st8: [0.1, 0.66], st4: [0.5, 0.66], st5: [0.9, 0.66], st7: [0.38, 0.95], st6: [0.8, 0.95] }
  };

  function mountSets(root) {
    root.appendChild(fsmPicker());
    root.appendChild(lSlider());
    var keyPick = seg([
      { value: "pin", label: "Heap on P(I)" },
      { value: "stp", label: "Heap on STP" }
    ], "pin", function (v) { state.key = v; draw(); }, "Heap priority");
    var keyRow = el("div", { class: "w-actions", "data-levels": "res" }, [keyPick]);
    root.appendChild(keyRow);
    var graph = svg("svg", { class: "fp-graph", role: "img", "aria-label": "State transition graph colored by set" });
    root.appendChild(graph);
    var list = el("ol", { class: "fp-setlist" });
    root.appendChild(list);
    var note = el("p", { class: "w-note" });
    root.appendChild(note);

    function draw() {
      var d = cur(), built = E.fromData(d);
      var part = E.partition(built.stg, built.trans, state.l, state.key);
      var M = d.states.length;
      var W = chartWidth(graph), H = Math.round(Math.min(420, Math.max(280, W * 0.62)));
      graph.setAttribute("viewBox", "0 0 " + W + " " + H);
      graph.textContent = "";
      var pad = 30, pos = [];
      var lay = LAYOUT[state.fsm];
      for (var i = 0; i < M; i++) {
        if (lay && lay[d.states[i]]) pos.push([pad + lay[d.states[i]][0] * (W - 2 * pad), pad + lay[d.states[i]][1] * (H - 2 * pad)]);
        else {
          var a = -Math.PI / 2 + 2 * Math.PI * i / M;
          pos.push([W / 2 + (W / 2 - pad - 10) * Math.cos(a) * 0.92, H / 2 + (H / 2 - pad) * Math.sin(a)]);
        }
      }
      var maxStp = 0;
      d.trans.forEach(function (t) { if (t[3] > maxStp) maxStp = t[3]; });
      var pair = {};
      d.trans.forEach(function (t) {
        var u = t[0], v = t[1];
        if (u === v) {
          var p = pos[u];
          graph.appendChild(svg("circle", { class: "fp-edge", cx: p[0], cy: p[1] - 22, r: 9, "stroke-width": 0.8 + 5 * Math.sqrt(t[3] / maxStp) }));
          return;
        }
        var k = Math.min(u, v) + "-" + Math.max(u, v);
        pair[k] = (pair[k] || 0) + t[3];
      });
      Object.keys(pair).forEach(function (k) {
        var uv = k.split("-").map(Number), a = pos[uv[0]], b = pos[uv[1]];
        graph.appendChild(svg("line", { class: "fp-edge", x1: a[0], y1: a[1], x2: b[0], y2: b[1], "stroke-width": 0.8 + 5 * Math.sqrt(pair[k] / maxStp) }));
      });
      for (i = 0; i < M; i++) {
        var p2 = pos[i], sn = part.SN[i];
        var g = svg("g", { class: setColor(sn < 0 ? 7 : sn) });
        g.appendChild(svg("circle", { class: "fp-node", cx: p2[0], cy: p2[1], r: 15 }));
        if (i === d.start) g.appendChild(svg("circle", { class: "fp-start", cx: p2[0], cy: p2[1], r: 19 }));
        g.appendChild(svg("text", { class: "fp-node-set", x: p2[0], y: p2[1] + 4, "text-anchor": "middle" }, sn < 0 ? "–" : String(sn + 1)));
        g.appendChild(svg("text", { class: "c-label", x: p2[0], y: p2[1] + 30, "text-anchor": "middle" }, d.states[i]));
        graph.appendChild(g);
      }
      // set list
      list.textContent = "";
      for (var s = 0; s < part.sets; s++) {
        var members = d.states.filter(function (n, j) { return part.SN[j] === s; });
        var nT = d.trans.filter(function (t, j) { return part.ST[j] === s; }).length;
        list.appendChild(el("li", { class: "fp-setrow" }, [
          el("span", { class: "fp-swatch " + setColor(s) }, [el("span", { text: String(s + 1) })]),
          el("span", { text: members.join(", ") }),
          el("span", { class: "w-mono", "data-levels": "ug grad res", text: nT + " transitions leave this set" })
        ]));
      }
      var loops = d.trans.filter(function (t) { return t[0] === t[1]; }).length;
      var msg = d.states.length + " states, " + d.trans.length + " transitions (" + loops + " self-loops). The longest split gives " + d.Lmax + " sets.";
      if (state.fsm === "bbara" && state.l === 4) {
        var match = d.states.every(function (n, j) { return FIG6[n] === part.SN[j] + 1; });
        msg += match ? " These four sets match the paper's Figure 6 state for state." : " With this heap order, the four sets differ from the paper's Figure 6.";
      }
      note.textContent = msg;
    }
    onChange(draw);
    resizers.push(draw);
    draw();
  }

  /* ------------------------------------------------------------ demo 3: the encoding */

  function mountEncode(root) {
    root.appendChild(fsmPicker());
    root.appendChild(lSlider());
    var modePick = seg([
      { value: "secure", label: "Secure" },
      { value: "lowpower", label: "Secure and low power" }
    ], state.mode, function (v) { state.mode = v; draw(); }, "Constraints");
    var runBtn = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "Search again in your browser" });
    root.appendChild(el("div", { class: "w-actions" }, [modePick, runBtn]));
    var wrap = el("div", { class: "fp-table-wrap" });
    var table = el("table", { class: "results-table fp-enc-table" });
    wrap.appendChild(table);
    root.appendChild(wrap);
    var facts = el("dl", { class: "fp-facts" });
    root.appendChild(facts);
    var status = el("p", { class: "w-note w-mono" });
    root.appendChild(status);
    var live = null;

    function row(dt, dd, levels) {
      var a = el("dt", { text: dt }), b = el("dd");
      if (typeof dd === "string") b.textContent = dd; else b.appendChild(dd);
      if (levels) { a.setAttribute("data-levels", levels); b.setAttribute("data-levels", levels); }
      facts.appendChild(a); facts.appendChild(b);
    }

    function draw() {
      var d = cur(), lev = d.levels[state.l], built = E.fromData(d);
      var part = E.partition(built.stg, built.trans, state.l);
      var enc = lev && (state.mode === "lowpower" ? lev.lowpower : lev.secure);
      if (live && live.fsm === state.fsm && live.l === state.l && live.mode === state.mode) enc = live.enc;
      table.textContent = "";
      var head = el("tr", {}, [el("th", { text: "State" }), el("th", { text: "Set" }), el("th", { text: "Secure code" }),
        el("th", { text: "Weight" }), el("th", { text: "Minimal code", "data-levels": "ug grad res" })]);
      table.appendChild(el("thead", {}, [head]));
      var body = el("tbody");
      d.states.forEach(function (n, i) {
        var sn = part.SN[i];
        body.appendChild(el("tr", {}, [
          el("td", { text: n + (i === d.start ? " (start)" : "") }),
          el("td", {}, [el("span", { class: "fp-swatch " + setColor(sn < 0 ? 7 : sn) }, [el("span", { text: sn < 0 ? "–" : String(sn + 1) })])]),
          el("td", { class: "w-mono fp-code", text: enc ? enc.codes[i] : "–" }),
          el("td", { text: enc ? String(E.hw(parseInt(enc.codes[i], 2))) : "–" }),
          el("td", { class: "w-mono", "data-levels": "ug grad res", text: d.binary.codes[i] })
        ]));
      });
      table.appendChild(body);
      facts.textContent = "";
      if (!enc) { row("Result", "No encoding found within the search budget."); return; }
      var codes = codesOf(enc), lv = E.leakageValues(built.trans, codes), info = E.leakageInfo(built.trans, codes, DELTA);
      var lvB = E.leakageValues(built.trans, codesOf(d.binary));
      row("Bits per state", enc.R + " (minimal: " + d.Rmin + ", one per state: " + d.states.length + ")");
      row("Weights the register shows", lv.hw.join(", ") + "  (minimal code: " + lvB.hw.join(", ") + ")");
      row("Switching distances", lv.hd.join(", ") + "  (minimal code: " + lvB.hd.join(", ") + ")", "hs ug grad res");
      row("Switching distances with rise and fall (δ)", lv.sd.map(function (p) { return E.sdLabel(p); }).join(", "), "grad res");
      row("Switching activity (Eq. 11)", fmt(E.switchingActivity(built.trans, codes)) + "  (minimal code: " + fmt(d.binary.sa) + ", lowest possible at " + d.Rmin + " bits: " + fmt(d.lowpower.sa) + ")", "ug grad res");
      row("Bits one reading reveals (page's measure)", "weight " + fmt(info.hw, 2) + ", distance " + fmt(info.hd, 2) + ", switching " + fmt(info.sd, 2) + "  (minimal code: " + fmt(d.binary.bits.hw, 2) + ", " + fmt(d.binary.bits.hd, 2) + ", " + fmt(d.binary.bits.sd, 2) + ")", "grad res");
      if (state.fsm === "bbara" && state.l === 4) {
        row("Paper, Table 3", "Low power & secure: 6 bits, switching activity 0.445. Secure: 5 bits, 0.5148.", "ug grad res");
      }
      var chk = E.checkEncoding(built.trans, part, codes);
      status.textContent = (live && live.fsm === state.fsm && live.l === state.l && live.mode === state.mode ? live.msg + " " : "") +
        (chk.ok ? "Checked: every set shares one weight and every transition set one distance." : "Check failed: " + chk.problems.join("; ")) +
        (enc.complete === false ? " The search hit its budget, so a shorter or lower-power encoding may exist." : "");
    }

    runBtn.addEventListener("click", function () {
      var d = cur(), fsm = state.fsm, l = state.l, mode = state.mode;
      runBtn.disabled = true; runBtn.classList.add("running"); runBtn.textContent = "Searching…";
      status.textContent = "Searching every code assignment from " + d.Rmin + " bits up…";
      runJob({ task: mode, l: l, fsm: fsmPayload(d), budget: 2e7 }, function (r) {
        runBtn.disabled = false; runBtn.classList.remove("running"); runBtn.textContent = "Search again in your browser";
        if (r.error || !r.codes) { status.textContent = r.error ? "Search failed: " + r.error : "No encoding found within the budget."; return; }
        var pre = d.levels[l] && (mode === "lowpower" ? d.levels[l].lowpower : d.levels[l].secure);
        var same = pre && pre.R === r.R && Math.abs(pre.sa - r.sa) < 1e-6;
        live = { fsm: fsm, l: l, mode: mode,
          enc: { R: r.R, codes: r.codes.map(function (c) { return E.toBits(c, r.R); }), complete: r.complete },
          msg: "Your browser searched " + r.nodes.toLocaleString() + " partial assignments in " + (r.ms / 1000).toFixed(1) + " s" + (same ? ", matching the stored result." : ".") };
        draw();
      });
    });

    onChange(function () { live = null; draw(); });
    draw();
  }

  /* ------------------------------------------------------------ demo 4: trade-off */

  function mountTradeoff(root) {
    root.appendChild(fsmPicker());
    var chart = svg("svg", { class: "fp-trade-chart", role: "img", "aria-label": "Encoding length, readings, and switching activity for each l" });
    root.appendChild(chart);
    var legend = el("p", { class: "w-note" });
    root.appendChild(legend);

    function draw() {
      var d = cur(), L = d.Lmax, res = state.level === "grad" || state.level === "res";
      var W = chartWidth(chart), padL = 44, padR = 10, panelH = 104, gap = 30, top = 18;
      var H = top + 3 * panelH + 2 * gap + 30;
      chart.setAttribute("viewBox", "0 0 " + W + " " + H);
      chart.textContent = "";
      var cw = (W - padL - padR) / L;
      function xc(l) { return padL + (l - 0.5) * cw; }
      var ls = [];
      for (var l = 1; l <= L; l++) ls.push(l);
      // x labels
      ls.forEach(function (l2) {
        var hit = svg("rect", { class: "fp-col" + (l2 === state.l ? " on" : ""), x: padL + (l2 - 1) * cw, y: top - 6, width: cw, height: H - top - 18, tabindex: 0, role: "button", "aria-label": "Use l = " + l2 });
        hit.addEventListener("click", function () { setL(l2); });
        hit.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setL(l2); } });
        chart.appendChild(hit);
        chart.appendChild(svg("text", { class: "c-tick", x: xc(l2), y: H - 4, "text-anchor": "middle" }, l2));
      });
      function panel(k, title, vals, max, opts) {
        var y0 = top + k * (panelH + gap), y1 = y0 + panelH;
        function y(v) { return y1 - (y1 - y0 - 24) * v / max; }
        chart.appendChild(svg("text", { class: "c-label", x: padL, y: y0 + 2 }, title + (opts.refLabel ? " (dashed: " + opts.refLabel + ")" : "")));
        [0, max].forEach(function (g) {
          chart.appendChild(svg("line", { class: "c-grid", x1: padL, x2: W - padR, y1: y(g), y2: y(g) }));
          chart.appendChild(svg("text", { class: "c-tick", x: padL - 6, y: y(g) + 4, "text-anchor": "end" }, opts.tick ? opts.tick(g) : g));
        });
        if (opts.ref != null) {
          chart.appendChild(svg("line", { class: "c-ref", x1: padL, x2: W - padR, y1: y(opts.ref), y2: y(opts.ref) }));
        }
        vals.forEach(function (v, i) {
          if (v == null) return;
          var x = padL + i * cw + cw * 0.2;
          chart.appendChild(svg("rect", { class: "fp-bar" + (i + 1 === state.l ? " on" : ""), x: x, y: y(v), width: cw * 0.6, height: Math.max(0, y(0) - y(v)) }));
          chart.appendChild(svg("text", { class: "c-tick", x: xc(i + 1), y: y(v) - 3, "text-anchor": "middle" }, opts.fmt ? opts.fmt(v) : v));
        });
        if (opts.paper) opts.paper.forEach(function (v, i) {
          if (v == null) return;
          chart.appendChild(svg("line", { class: "c-paper", x1: padL + i * cw + cw * 0.1, x2: padL + i * cw + cw * 0.9, y1: y(v), y2: y(v) }));
        });
      }
      var Rs = ls.map(function (l2) { return d.levels[l2].R; });
      var maxR = Math.max.apply(null, Rs.concat([d.Rmin + 1]));
      panel(0, "Bits per state", Rs, maxR, { ref: d.Rmin, refLabel: "minimal " + d.Rmin,
        paper: state.fsm === "bbara" ? ls.map(function (l2) { return d.Rmin + FIG13[l2]; }) : null });
      var leak = ls.map(function (l2) { var e = d.levels[l2].lowpower; return e ? (res ? e.bits.hw : e.hw.length) : null; });
      var lb = res ? d.binary.bits.hw : d.binary.hw.length;
      panel(1, res ? "Bits one weight reading reveals (page's measure)" : "Different weights the register shows", leak,
        Math.max.apply(null, leak.concat([lb])) || 1, { ref: lb, refLabel: "minimal code " + (res ? lb.toFixed(2) : lb), fmt: res ? function (v) { return v.toFixed(2); } : null,
          tick: res ? function (g) { return g.toFixed(1); } : null });
      var sas = ls.map(function (l2) { var e = d.levels[l2].lowpower; return e ? e.sa : null; });
      panel(2, "Switching activity, lowest found", sas, Math.max.apply(null, sas.concat([d.binary.sa])), { ref: d.binary.sa, refLabel: "minimal code " + d.binary.sa.toFixed(2),
        fmt: function (v) { return v.toFixed(2); }, tick: function (g) { return g.toFixed(1); } });
      legend.textContent = "Columns are the number of sets, l. " + (state.fsm === "bbara" ? "Dotted marks: the paper's Figure 13 lengths for BBARA. " : "") +
        "Computed by this page: the shortest encoding that meets the set constraints, then the lowest switching activity at that length. Tap a column to pick l.";
    }
    onChange(draw);
    resizers.push(draw);
    document.addEventListener("paperlevel", function () { setTimeout(draw, 0); });
    draw();
  }

  /* ------------------------------------------------------------ demo 5: Table 7 */

  function mountPower(root) {
    var wrap = el("div", { class: "fp-table-wrap" });
    var table = el("table", { class: "results-table fp-power-table" });
    wrap.appendChild(table);
    root.appendChild(wrap);
    var note = el("p", { class: "w-note" });
    root.appendChild(note);
    var liveVals = {};

    function draw() {
      table.textContent = "";
      table.appendChild(el("thead", {}, [el("tr", {}, [
        el("th", { text: "FSM" }), el("th", { text: "NOVA" }), el("th", { text: "JEDI" }), el("th", { text: "Sequential" }),
        el("th", { text: "Paper, SAT" }), el("th", { text: "This page" }), el("th", { text: "" })
      ])]));
      var body = el("tbody"), matched = 0;
      TABLE7.forEach(function (r) {
        var d = state.data.fsms[r.n];
        var sa = liveVals[r.n] != null ? liveVals[r.n] : d.lowpower.sa;
        var p = sa * PSCALE, ok = Math.abs(p - r.sat) < 0.015;
        if (ok) matched++;
        var btn = el("button", { type: "button", class: "w-btn w-btn-quiet fp-small", text: liveVals[r.n] != null ? "Rerun" : "Run" });
        btn.addEventListener("click", function () {
          btn.disabled = true; btn.textContent = "…"; btn.classList.add("running");
          runJob({ task: "power", fsm: fsmPayload(d), budget: 1.2e8 }, function (res) {
            btn.disabled = false; btn.classList.remove("running");
            if (res.error || res.sa == null) { btn.textContent = "Failed"; return; }
            liveVals[r.n] = res.sa;
            draw();
            note.textContent = r.n + ": your browser checked " + res.nodes.toLocaleString() + " partial assignments in " + (res.ms / 1000).toFixed(1) + " s" + (res.complete ? "." : " and stopped at its budget.");
          });
        });
        body.appendChild(el("tr", { class: ok ? "fp-match" : "fp-differ" }, [
          el("td", { text: r.n }),
          el("td", { text: r.nova.toFixed(2) }), el("td", { text: r.jedi.toFixed(2) }), el("td", { text: r.seq.toFixed(2) }),
          el("td", { text: r.sat.toFixed(2) }),
          el("td", {}, [document.createTextNode(p.toFixed(2) + " "), el("span", { class: "w-mono", text: ok ? "match" : "differs" })]),
          el("td", {}, [btn])
        ]));
      });
      table.appendChild(body);
      if (!note.textContent) note.textContent = "This page matches " + matched + " of 9 rows to within 0.01. Power is Eq. 10 with the paper's settings (5 V, 5 MHz, 3 pF per bit) applied to the lowest switching activity at the minimal length; with those settings the numbers come out in microwatts. Run repeats a row's exhaustive search here.";
    }
    draw();
  }

  /* ------------------------------------------------------------ boot */

  var mounts = [
    ["fp-trace", mountTrace], ["fp-sets", mountSets], ["fp-encode", mountEncode],
    ["fp-tradeoff", mountTradeoff], ["fp-power", mountPower]
  ];

  fetch(SCRIPT_BASE + "fsm-data.json").then(function (r) { return r.json(); }).then(function (data) {
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

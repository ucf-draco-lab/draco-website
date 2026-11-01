/*
  SHARKS swarms widget for /papers/sharks-swarms/.
  Mount points in the page: #sk-swarm, #sk-tables, #sk-attack, #sk-results.
  Demos 1 and 3 run the swarm engine (sharks-engine.js) live. Demos 2 and 4
  draw the papers' own tables; the page's simulated values beside them come
  from sharks-data.json (precomputed with the same engine in Node) or from a
  run in the visitor's browser, and are labeled as the page's.
*/
(function () {
  "use strict";

  var E = window.SharksEngine;
  var SVGNS = "http://www.w3.org/2000/svg";
  var SCRIPT_BASE = (document.currentScript && document.currentScript.src || "").replace(/[^/]*$/, "");

  /* ---------------------------------------------------------------- the papers' data */

  // 2018 paper, Tables I to IV: epochs to stability. Columns follow the paper's
  // order of population sizes. 0 means the swarm never became stable.
  var EFF_POPS = [4, 8, 16, 32, 5, 10, 15, 20, 25];
  var EFF = {
    random: {
      "3:4,0": [28.60, 35.00, 36.80, 39.80, 32.20, 33.40, 41.60, 43.20, 42.20],
      "3:4,20": [28.80, 35.80, 39.80, 38.40, 26.20, 26.20, 34.20, 41.20, 33.80],
      "1:1,0": [58.20, 260.00, 455.40, 453.60, 92.00, 226.00, 342.80, 366.60, 638.40],
      "1:1,20": [37.80, 108.60, 118.60, 123.40, 61.40, 106.80, 128.00, 122.60, 144.20]
    },
    corner: {
      "3:4,0": [29.0, 36.0, 34.4, 46.0, 36.2, 39.0, 32.8, 41.2, 38.2],
      "3:4,20": [26.6, 37.2, 35.2, 41.6, 33.8, 31.6, 33.8, 36.2, 36.8],
      "1:1,0": [67.0, 62.6, 248.8, 208.6, 80.8, 75.6, 177.4, 179.4, 154.6],
      "1:1,20": [48.2, 76.0, 81.2, 103.0, 48.8, 61.0, 73.8, 78.8, 89.6]
    },
    side: {
      "3:4,0": [15.8, 17.4, 23.0, 26.6, 17.0, 19.8, 19.8, 22.0, 22.0],
      "3:4,20": [14.6, 15.2, 19.6, 26.2, 16.0, 18.8, 17.6, 23.8, 24.2],
      "1:1,0": [35.6, 47.8, 53.2, 52.4, 43.4, 59.2, 63.0, 63.8, 69.4],
      "1:1,20": [21.0, 34.6, 41.0, 38.6, 30.4, 40.8, 30.8, 56.6, 51.8]
    },
    topbottom: {
      "3:4,0": [16.2, 18.8, 21.8, 28.4, 17.0, 18.4, 22.0, 21.8, 26.0],
      "3:4,20": [13.6, 17.2, 19.8, 23.2, 15.2, 19.0, 17.4, 20.4, 22.2],
      "1:1,0": [29.0, 31.2, 71.4, 78.0, 32.8, 34.2, 61.0, 60.2, 75.6],
      "1:1,20": [24.8, 31.8, 45.2, 45.2, 28.2, 49.2, 36.2, 38.6, 56.6]
    },
    center: {
      "3:4,0": [6.4, 8.0, 13.6, 14.8, 6.4, 9.2, 12.4, 12.4, 14.4],
      "3:4,20": [7.4, 8.0, 12.4, 14.6, 7.8, 10.8, 11.8, 12.4, 12.0],
      "1:1,0": [5.6, 12.4, 18.4, 26.6, 5.6, 12.0, 17.4, 19.0, 18.0],
      "1:1,20": [6.6, 16.0, 17.6, 21.4, 9.8, 12.2, 18.4, 19.8, 16.0]
    },
    linear: {
      "3:4,0": [21.60, 32.75, 32.25, 37.75, 35.25, 31.50, 32.75, 34.00, 34.25],
      "3:4,20": [26.75, 28.00, 30.00, 33.00, 28.50, 32.50, 24.50, 34.50, 31.50],
      "1:1,0": [100.25, 152.50, 345.00, 168.75, 68.75, 160.00, 144.75, 294.75, 404.75],
      "1:1,20": [44.50, 97.75, 94.25, 48.00, 54.50, 73.50, 102.25, 112.50, 79.75]
    },
    collinear: {
      "3:4,0": [25.20, 181.00, 0, 0, 32.80, 556.00, 0, 0, 0],
      "3:4,20": [21.20, 22.00, 23.60, 23.60, 19.20, 22.60, 19.00, 26.20, 25.60],
      "1:1,0": [0, 0, 0, 0, 0, 0, 0, 0, 0],
      "1:1,20": [27.60, 57.20, 88.80, 88.00, 43.20, 55.80, 76.80, 73.00, 99.40]
    }
  };
  var EFF_LAYOUTS = [
    { value: "random", label: "Random", table: "Table I" },
    { value: "corner", label: "Box, corner", table: "Table II" },
    { value: "side", label: "Box, side", table: "Table II" },
    { value: "topbottom", label: "Box, top or bottom", table: "Table II" },
    { value: "center", label: "Box, center", table: "Table II" },
    { value: "linear", label: "Line", table: "Table III" },
    { value: "collinear", label: "Line through target", table: "Table IV" }
  ];
  var EFF_SERIES = [
    { key: "3:4,20", label: "d:c 3:4, r 20°", cls: "sk-s1" },
    { key: "3:4,0", label: "d:c 3:4, r 0°", cls: "sk-s2" },
    { key: "1:1,20", label: "d:c 1:1, r 20°", cls: "sk-s3" },
    { key: "1:1,0", label: "d:c 1:1, r 0°", cls: "sk-s4" }
  ];

  // 2018 paper, Tables V to VIII: epochs to stability by epsilon, delta, and population.
  var CAP_POPS = [2, 3, 4, 8, 16, 32, 64, 128, 256];
  var CAP_ROWS = [[2, 8], [2, 12], [2, 16], [4, 8], [4, 12], [4, 16], [8, 8], [8, 12], [8, 16]];
  var CAP_AREA = [201.06, 301.59, 402.12, 402.12, 603.19, 804.25, 804.25, 1206.37, 1608.49];
  var CAP = {
    random: [
      [34.2, 32.0, 35.8, 45.8, 51.6, 50.0, 210.0, 0, 0], [29.8, 21.6, 31.4, 44.0, 37.8, 40.4, 66.8, 0, 0],
      [21.2, 17.6, 24.2, 28.0, 31.6, 29.6, 45.0, 0, 0], [35.0, 32.0, 32.4, 34.4, 48.6, 48.8, 45.8, 53.4, 0],
      [26.0, 28.6, 18.0, 35.4, 46.8, 42.4, 41.8, 48.6, 355.6], [12.4, 14.4, 22.2, 30.2, 35.0, 34.2, 38.4, 41.8, 95.8],
      [27.2, 24.4, 25.6, 26.0, 43.0, 41.2, 37.4, 44.8, 49.4], [19.4, 19.4, 28.2, 35.2, 29.4, 42.4, 31.0, 34.8, 34.8],
      [14.2, 13.6, 15.6, 21.2, 33.6, 26.0, 30.0, 33.2, 32.6]
    ],
    box: [
      [27.25, 22.125, 23.75, 25.75, 22.5, 28.875, 136.875, 0, 0], [22.625, 19.25, 18.125, 20.375, 26.5, 32.75, 89.625, 0, 0],
      [15.375, 16.375, 19.125, 18.5, 23.125, 28.375, 80.0, 0, 0], [23.75, 19.375, 18.75, 23.25, 22.25, 26.625, 28.625, 0, 0],
      [18.625, 19.125, 16.5, 20.25, 23.625, 19.875, 30.0, 0, 0], [14.625, 12.75, 14.125, 18.0, 18.375, 21.25, 26.0, 0, 0],
      [18.75, 16.25, 15.125, 17.25, 20.75, 23.375, 23.625, 0, 0], [18.0, 13.5, 15.25, 15.375, 15.0, 21.75, 21.625, 0, 0],
      [9.625, 8.875, 14.125, 13.625, 14.375, 17.375, 16.75, 0, 0]
    ],
    linear: [
      [30.0, 33.2, 26.0, 32.2, 36.4, 43.6, 0, 0, 0], [17.2, 24.4, 26.2, 31.6, 30.6, 35.6, 0, 0, 0],
      [15.2, 16.4, 21.6, 27.0, 27.4, 31.2, 0, 0, 0], [23.2, 37.2, 31.2, 28.2, 35.6, 36.4, 0, 0, 0],
      [17.4, 29.4, 20.8, 31.8, 28.6, 25.2, 0, 0, 0], [19.6, 22.8, 11.2, 26.2, 21.4, 29.0, 0, 0, 0],
      [22.2, 25.2, 24.0, 30.0, 29.6, 29.8, 0, 0, 0], [15.6, 18.0, 16.0, 20.8, 21.6, 23.8, 0, 0, 0],
      [11.4, 11.0, 15.2, 14.6, 19.0, 20.6, 0, 0, 0]
    ],
    collinear: [
      [22.4, 24.2, 25.4, 33.2, 33.4, 34.4, 0, 0, 0], [23.4, 17.4, 20.2, 24.4, 27.4, 27.2, 0, 0, 0],
      [12.4, 14.8, 15.6, 21.8, 19.6, 21.6, 0, 0, 0], [20.6, 25.0, 20.4, 25.6, 33.6, 25.0, 0, 0, 0],
      [10.2, 13.8, 17.2, 18.0, 22.0, 25.8, 0, 0, 0], [6.0, 16.2, 13.0, 19.8, 18.0, 19.0, 0, 0, 0],
      [18.4, 12.0, 25.6, 22.0, 23.0, 26.8, 0, 0, 0], [7.4, 13.0, 9.4, 16.0, 13.8, 16.4, 0, 0, 0],
      [7.0, 10.0, 7.8, 10.8, 13.8, 11.8, 0, 0, 0]
    ]
  };
  var CAP_LAYOUTS = [
    { value: "random", label: "Random", table: "Table V" },
    { value: "box", label: "Box", table: "Table VI" },
    { value: "linear", label: "Line", table: "Table VII" },
    { value: "collinear", label: "Line through target", table: "Table VIII" }
  ];

  // 2019 paper: percent access.
  var ADV_REGION = { deltas: [8, 12, 16], epsilons: [4, 6, 8],
    values: [[11.83, 13.02, 14.42], [12.51, 13.03, 13.25], [13.30, 13.42, 13.96]] };          // Table II
  var ADV_MOVES = [{ c: 0.5, d: 0.5, v: 17.60 }, { c: 0.5, d: 1, v: null }, { c: 1, d: 0.5, v: 18.96 }, { c: 1, d: 1, v: 16.22 }]; // Table III
  var ADV_DELAY = [{ key: "none", label: "No delay", v: 12.37 }, { key: "stability", label: "At stability", v: 13.62 },
    { key: "stability20", label: "Stability + 20", v: 13.59 }];                                // Section V.D
  var ADV_POP = [{ n: 8, a: 2, v: 23.54 }, { n: 64, a: 8, v: 7.81 }, { n: 64, a: 2, v: 6.53 }]; // Section V.A

  /* ---------------------------------------------------------------- helpers */

  function el(tag, attrs, kids) {
    var node = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (attrs[k] === null || attrs[k] === undefined) return;
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
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function chartWidth(node) {
    var w = node && node.clientWidth ? node.clientWidth : 640;
    return Math.max(300, Math.min(760, w));
  }
  var resizers = [];
  var resizeTimer = null;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () { resizers.forEach(function (fn) { fn(); }); }, 150);
  });
  function level() { return window.PaperKit ? window.PaperKit.level() : "public"; }
  function fmt(v, digits) { return v === null || v === undefined ? "–" : (+v).toFixed(digits == null ? 1 : digits); }

  function segmented(label, options, value, onChange, extra) {
    var wrap = el("div", { class: "seg" + (extra ? " " + extra : ""), role: "radiogroup", "aria-label": label });
    var buttons = options.map(function (opt) {
      var b = el("button", { type: "button", class: "seg-option", role: "radio", "data-value": String(opt.value), text: opt.label });
      if (opt.levels) b.setAttribute("data-levels", opt.levels);
      b.addEventListener("click", function () { set(opt.value); onChange(opt.value); });
      wrap.appendChild(b);
      return b;
    });
    function set(v) {
      buttons.forEach(function (b) { b.setAttribute("aria-checked", b.getAttribute("data-value") === String(v) ? "true" : "false"); });
    }
    set(value);
    wrap.set = set;
    return wrap;
  }
  function controlRow(label, control, levels) {
    return el("div", { class: "sk-row", "data-levels": levels || null }, [el("span", { class: "sk-row-label", text: label }), control]);
  }
  function sliderRow(id, label, min, max, step, value, onInput, levels) {
    var input = el("input", { type: "range", id: id, min: String(min), max: String(max), step: String(step), value: String(value) });
    var out = el("output", { for: id, text: String(value) });
    input.addEventListener("input", function () { out.textContent = input.value; onInput(+input.value); });
    var row = el("div", { class: "w-range", "data-levels": levels || null }, [el("label", { for: id, text: label }), input, out]);
    row.input = input; row.out = out;
    return row;
  }

  function themeColors() {
    var cs = getComputedStyle(document.documentElement);
    function v(name, fallback) { var s = cs.getPropertyValue(name).trim(); return s || fallback; }
    return {
      primary: v("--primary", "#60a5fa"), accent: v("--accent", "#22d3ee"), text: v("--text", "#e0eafc"),
      background: v("--background", "#060d1f"), alt: v("--background-alt", "#0c1a36"),
      light: v("--light-gray", "#1e3a5f"), gray: v("--gray", "#6b8fc4"), dark: v("--dark-gray", "#a3c4f0"),
      code: v("--code", "monospace")
    };
  }
  var themeListeners = [];
  new MutationObserver(function () { themeListeners.forEach(function (fn) { fn(); }); })
    .observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  function randomSeed() {
    try { var a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] % 1000000; }
    catch (err) { return Math.floor(Math.random() * 1000000); }
  }

  /* ---------------------------------------------------------------- the field (canvas) */

  // Draws a swarm: the ring delta +/- epsilon, the target, agents as short
  // heading strokes, adversaries in the accent color, and (optionally) the
  // largest gap among regular agents.
  function Field(root, label) {
    this.canvas = el("canvas", { class: "sk-canvas", role: "img", "aria-label": label });
    this.ctx = this.canvas.getContext("2d");
    this.colors = themeColors();
    root.appendChild(this.canvas);
    var self = this;
    themeListeners.push(function () { self.colors = themeColors(); });
  }
  Field.prototype.draw = function (s, opts) {
    opts = opts || {};
    var c = this.colors, canvas = this.canvas, ctx = this.ctx;
    var cssW = Math.min(canvas.parentNode.clientWidth || 420, 460);
    var dpr = window.devicePixelRatio || 1;
    var size = Math.round(cssW * dpr);
    if (canvas.width !== size) { canvas.width = size; canvas.height = size; }
    canvas.style.width = cssW + "px";
    canvas.style.height = cssW + "px";
    var view = opts.view || E.MAXP + 0.5;          // half-width of the visible field
    var scale = size / (2 * view);
    function sx(x) { return (x + view) * scale; }
    function sy(y) { return (view - y) * scale; }
    ctx.fillStyle = c.alt;
    ctx.fillRect(0, 0, size, size);
    // stability ring
    ctx.beginPath();
    ctx.arc(sx(0), sy(0), (s.delta + s.epsilon) * scale, 0, 2 * Math.PI);
    ctx.arc(sx(0), sy(0), Math.max(0, s.delta - s.epsilon) * scale, 0, 2 * Math.PI, true);
    ctx.fillStyle = c.light;
    ctx.globalAlpha = 0.55;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.setLineDash([3 * dpr, 4 * dpr]);
    ctx.strokeStyle = c.gray;
    ctx.lineWidth = dpr;
    ctx.beginPath();
    ctx.arc(sx(0), sy(0), s.delta * scale, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.setLineDash([]);
    // largest gap
    if (opts.gap) {
      var g = s.gapArc();
      if (g) {
        ctx.strokeStyle = c.accent;
        ctx.lineWidth = 4 * dpr;
        ctx.beginPath();
        // canvas angles: 0 = +x, clockwise on screen; bearing b (0 = north, clockwise) maps to b - 90 degrees
        ctx.arc(sx(0), sy(0), (s.delta + s.epsilon + 1.2) * scale, g.from - Math.PI / 2, g.to - Math.PI / 2);
        ctx.stroke();
      }
    }
    // target
    ctx.fillStyle = c.text;
    ctx.beginPath();
    ctx.arc(sx(0), sy(0), Math.max(3 * dpr, 0.45 * scale), 0, 2 * Math.PI);
    ctx.fill();
    // agents
    var lo = s.delta - s.epsilon, hi = s.delta + s.epsilon;
    ctx.lineCap = "round";
    for (var i = 0; i < s.agents.length; i++) {
      var a = s.agents[i];
      var x = a.x, y = a.y;
      if (Math.abs(x) > view || Math.abs(y) > view) continue;
      var rad = a.h * Math.PI / 180, len = 0.9;
      var hx = Math.sin(rad) * len, hy = Math.cos(rad) * len;
      var d = s.dist(a);
      var col = a.adv ? c.accent : (d >= lo && d <= hi ? c.primary : c.text);
      ctx.strokeStyle = col;
      ctx.fillStyle = col;
      ctx.lineWidth = Math.max(1.5 * dpr, scale * 0.28);
      ctx.beginPath();
      ctx.moveTo(sx(x - hx * 0.6), sy(y - hy * 0.6));
      ctx.lineTo(sx(x + hx), sy(y + hy));
      ctx.stroke();
      if (a.adv) {
        ctx.beginPath();
        ctx.rect(sx(x) - 0.38 * scale, sy(y) - 0.38 * scale, 0.76 * scale, 0.76 * scale);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(sx(x), sy(y), Math.max(2 * dpr, 0.32 * scale), 0, 2 * Math.PI);
        ctx.fill();
      }
    }
    if (opts.follow != null) {
      var f = s.agents[opts.follow];
      if (f) {
        ctx.strokeStyle = c.text;
        ctx.lineWidth = dpr;
        ctx.beginPath();
        ctx.arc(sx(f.x), sy(f.y), 1.6 * scale, 0, 2 * Math.PI);
        ctx.stroke();
      }
    }
  };

  /* ---------------------------------------------------------------- demo 1: the swarm */

  function mountSwarm(root) {
    var st = { n: 16, delta: 12, epsilon: 4, ratio: "3:4", r: 20, init: "random", box: "center",
      seed: 1, playing: false, speed: 1, raf: null, visible: true, follow: 0, last: null };
    var s;

    var side = el("div", { class: "sk-side" });
    var stage = el("div", { class: "sk-stage" });
    var field = new Field(stage, "SHARKS swarm around a target");
    var key = el("p", { class: "w-note sk-key" }, [
      el("span", { class: "sk-k sk-k-out", text: "outside the ring" }), " ",
      el("span", { class: "sk-k sk-k-in", text: "inside the ring" }), " ",
      el("span", { class: "sk-k sk-k-ring", text: "ring: δ ± ε" })
    ]);
    stage.appendChild(key);

    var playBtn = el("button", { type: "button", class: "w-btn", text: "Play" });
    var stepBtn = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "Step" });
    var newBtn = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "New start" });
    var speedSeg = segmented("Speed", [{ value: 1, label: "1×" }, { value: 4, label: "4×" }], st.speed, function (v) { st.speed = v; }, "seg-small");
    var stats = el("p", { class: "w-big sk-stats", "aria-live": "polite" });
    var traceBox = el("p", { class: "w-mono sk-trace", "data-levels": "ug grad res" });
    var codeBox = el("pre", { class: "sk-code", "data-levels": "ug grad res", "aria-label": "The two SHARKS rules for one agent" });
    var CODE = [
      { id: "disp", text: "dispersion: face nearest agent; rt 180 + r" },
      { id: "disp-move", text: "            if patch ahead d is empty [ fd d ]" },
      { id: "center", text: "center:     face target" },
      { id: "back", text: "            if δ − dist > ε  and patch behind c is empty [ bk c ]" },
      { id: "forward", text: "            if δ − dist < −ε and patch ahead c is empty  [ fd c ]" }
    ];
    var codeLines = CODE.map(function (line) {
      var span = el("span", { class: "sk-code-line", "data-rule": line.id, text: line.text + "\n" });
      codeBox.appendChild(span);
      return span;
    });

    var nSlider = sliderRow("sk-n", "Agents", 2, 64, 1, st.n, function (v) { st.n = v; reset(st.seed); });
    var dSlider = sliderRow("sk-delta", "Ideal distance δ", 6, 20, 1, st.delta, function (v) { st.delta = v; reset(st.seed); }, "hs ug grad res");
    var eSlider = sliderRow("sk-eps", "Allowed slack ε", 1, 8, 1, st.epsilon, function (v) { st.epsilon = v; reset(st.seed); }, "hs ug grad res");
    var initSeg = segmented("Starting layout", [
      { value: "random", label: "Scattered" }, { value: "box", label: "Box" },
      { value: "linear", label: "Line" }, { value: "collinear", label: "Line through target" }
    ], st.init, function (v) { st.init = v; reset(st.seed); }, "seg-small");
    var boxSeg = segmented("Box position", [
      { value: "center", label: "Center" }, { value: "corner", label: "Corner" }, { value: "side", label: "Side" }
    ], st.box, function (v) { st.box = v; reset(st.seed); }, "seg-small");
    var boxRow = controlRow("Box at", boxSeg);
    var ratioSeg = segmented("Step sizes d:c", [{ value: "3:4", label: "3:4 (lean in)" }, { value: "1:1", label: "1:1 (equal)" }],
      st.ratio, function (v) { st.ratio = v; reset(st.seed); }, "seg-small");
    var rSeg = segmented("Rotation r", [{ value: 0, label: "0°" }, { value: 1, label: "1°" }, { value: 20, label: "20°" }],
      st.r, function (v) { st.r = v; reset(st.seed); }, "seg-small");

    side.appendChild(el("div", { class: "w-actions" }, [playBtn, stepBtn, newBtn, speedSeg]));
    side.appendChild(stats);
    side.appendChild(nSlider);
    side.appendChild(controlRow("Start", initSeg));
    side.appendChild(boxRow);
    side.appendChild(controlRow("Step sizes", ratioSeg));
    side.appendChild(controlRow("Turn while spreading", rSeg));
    side.appendChild(dSlider);
    side.appendChild(eSlider);
    side.appendChild(traceBox);
    side.appendChild(codeBox);
    var note = el("p", { class: "w-note", text: "Simulated on your device with this page's reading of the SHARKS rules (the authors' NetLogo model is not public). Tap an agent to follow it." });
    root.appendChild(el("div", { class: "sk-split" }, [stage, side]));
    root.appendChild(note);

    function opts() {
      var d = st.ratio === "3:4" ? 0.75 : 1;
      return { n: st.n, delta: st.delta, epsilon: st.epsilon, c: 1, d: d, r: st.r, init: st.init, box: st.box, seed: st.seed };
    }
    function reset(seed) {
      st.seed = seed;
      s = new E.Swarm(opts());
      st.last = null;
      if (st.follow >= s.agents.length) st.follow = 0;
      boxRow.hidden = st.init !== "box";
      draw();
    }
    function tick() {
      st.last = s.step(true);
      if (s.ticks >= 3000) pause();
    }
    var lastFrame = 0;
    function throttled(ts) {
      // about 20 epochs a second at 1x, so a reader can follow single agents
      if (!st.playing) { st.raf = null; return; }
      if (ts - lastFrame >= 50) { lastFrame = ts; for (var i = 0; i < st.speed; i++) tick(); draw(); }
      st.raf = st.visible ? requestAnimationFrame(throttled) : null;
    }
    function play() {
      if (s.ticks >= 3000) reset(randomSeed());
      st.playing = true; playBtn.textContent = "Pause"; playBtn.classList.add("running");
      if (!st.raf) st.raf = requestAnimationFrame(throttled);
    }
    function pause() {
      st.playing = false; playBtn.textContent = "Play"; playBtn.classList.remove("running");
    }
    playBtn.addEventListener("click", function () { st.playing ? pause() : play(); });
    stepBtn.addEventListener("click", function () { pause(); tick(); draw(); });
    newBtn.addEventListener("click", function () { reset(randomSeed()); });

    field.canvas.addEventListener("click", function (ev) {
      var r = field.canvas.getBoundingClientRect();
      var view = E.MAXP + 0.5;
      var px = (ev.clientX - r.left) / r.width * 2 * view - view;
      var py = view - (ev.clientY - r.top) / r.height * 2 * view;
      var best = -1, bd = 16;
      s.agents.forEach(function (a, i) {
        var d = (a.x - px) * (a.x - px) + (a.y - py) * (a.y - py);
        if (d < bd) { bd = d; best = i; }
      });
      if (best >= 0) { st.follow = best; draw(); }
    });

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        st.visible = entries[0].isIntersecting;
        if (st.visible && st.playing && !st.raf) st.raf = requestAnimationFrame(throttled);
      }).observe(field.canvas);
    }

    var CENTER_TEXT = { back: "too close: stepped back c", forward: "too far: stepped toward the target", "in": "inside the ring: no center move",
      blocked: "wanted a center step, but the patch was taken", none: "on the target" };
    var DISP_TEXT = { moved: "turned away from its nearest neighbor and moved d", blocked: "turned away, but the patch ahead was taken", none: "no neighbor" };

    function draw() {
      field.draw(s, { follow: level() === "public" ? null : st.follow });
      var lo = s.delta - s.epsilon, hi = s.delta + s.epsilon, inRing = 0;
      s.agents.forEach(function (a) { var d = s.dist(a); if (d >= lo && d <= hi) inRing++; });
      stats.innerHTML = "";
      stats.appendChild(document.createTextNode("Epoch " + s.ticks + " · "));
      stats.appendChild(el("strong", { text: inRing + " of " + s.agents.length }));
      stats.appendChild(document.createTextNode(" in the ring" + (s.stableAt >= 0 ? " · stable at epoch " + s.stableAt : "")));
      if (s.failed) stats.appendChild(document.createTextNode(" · only " + s.agents.length + " fit this start"));
      var f = s.agents[st.follow];
      var act = st.last && f ? st.last[f.id] : null;
      traceBox.textContent = f ? "Followed agent " + f.id + ": " + fmt(s.dist(f), 1) + " units from the target" +
        (act ? "; " + DISP_TEXT[act.dispersion] + "; " + CENTER_TEXT[act.center] + "." : ". Press Step.") : "";
      codeLines.forEach(function (line) {
        var id = line.getAttribute("data-rule"), hit = false;
        if (act) {
          if (id === "disp") hit = act.dispersion !== "none";
          if (id === "disp-move") hit = act.dispersion === "moved";
          if (id === "center") hit = act.center !== "none";
          if (id === "back") hit = act.center === "back";
          if (id === "forward") hit = act.center === "forward";
        }
        line.classList.toggle("hit", hit);
      });
      field.canvas.setAttribute("aria-label", "Swarm at epoch " + s.ticks + ": " + inRing + " of " + s.agents.length + " agents inside the ring around the target.");
    }

    resizers.push(draw);
    themeListeners.push(function () { setTimeout(draw, 0); });
    document.addEventListener("paperlevel", draw);
    reset(1);
    root.classList.add("w-ready");
  }

  /* ---------------------------------------------------------------- demo 2: the 2018 tables */

  // Runs `jobs` (functions returning a number or null) without freezing the page.
  function runChunked(jobs, onEach, onDone) {
    var i = 0, cancelled = false;
    function work() {
      if (cancelled) return;
      var t0 = Date.now();
      while (i < jobs.length && Date.now() - t0 < 120) { onEach(i, jobs[i]()); i++; }
      if (i < jobs.length) setTimeout(work, 0);
      else if (onDone) onDone();
    }
    setTimeout(work, 0);
    return function () { cancelled = true; };
  }

  function mountTables(root, data) {
    var st = { tab: "eff", effLayout: "random", capLayout: "random", showSim: true, live: {} };
    var tabSeg = segmented("Experiment", [{ value: "eff", label: "How fast (Tables I to IV)" }, { value: "cap", label: "How many (Tables V to VIII)" }],
      st.tab, function (v) { st.tab = v; draw(); });
    var effSeg = segmented("Starting layout", EFF_LAYOUTS, st.effLayout, function (v) { st.effLayout = v; draw(); }, "seg-small");
    var capSeg = segmented("Starting layout", CAP_LAYOUTS, st.capLayout, function (v) { st.capLayout = v; draw(); }, "seg-small");
    var simToggle = segmented("Show", [{ value: "paper", label: "Paper only" }, { value: "both", label: "Paper and this page's runs" }],
      "both", function (v) { st.showSim = v === "both"; draw(); }, "seg-small");
    var effRow = controlRow("Start", effSeg);
    var capRow = controlRow("Start", capSeg);
    var simRow = controlRow("Show", simToggle, "ug grad res");
    var chart = el("div", { class: "sk-chart" });
    var legend = el("div", { class: "c-legend w-mono" });
    var caption = el("p", { class: "w-note" });
    var tableWrap = el("div", { class: "sk-table-wrap" });
    var runBtn = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "Rerun in your browser" });
    var runNote = el("span", { class: "w-mono", "aria-live": "polite" });
    var runRow = el("div", { class: "w-actions", "data-levels": "ug grad res" }, [runBtn, runNote]);

    root.appendChild(el("div", { class: "w-actions" }, [tabSeg]));
    root.appendChild(effRow);
    root.appendChild(capRow);
    root.appendChild(simRow);
    root.appendChild(chart);
    root.appendChild(legend);
    root.appendChild(tableWrap);
    root.appendChild(caption);
    root.appendChild(runRow);

    function simEff(layout) {
      var key = "eff:" + layout;
      return st.live[key] || (data && data.eff ? data.eff[layout] : null);
    }
    function simCap(layout) {
      var key = "cap:" + layout;
      return st.live[key] || (data && data.cap ? data.cap[layout] : null);
    }

    function drawEff() {
      chart.innerHTML = "";
      var W = chartWidth(chart), H = Math.max(280, Math.round(W * 0.56)), m = { l: 46, r: 14, t: 30, b: 40 };
      var order = EFF_POPS.map(function (p, i) { return { p: p, i: i }; }).sort(function (a, b) { return a.p - b.p; });
      var rows = EFF[st.effLayout];
      var sim = st.showSim && level() !== "public" && level() !== "hs" ? simEff(st.effLayout) : null;
      var maxV = 50;
      EFF_SERIES.forEach(function (s) { rows[s.key].forEach(function (v) { maxV = Math.max(maxV, v); }); });
      if (sim) EFF_SERIES.forEach(function (s) { (sim[s.key] || []).forEach(function (v) { if (v) maxV = Math.max(maxV, v); }); });
      var useLog = maxV > 200;
      var yMin = useLog ? 4 : 0, yMax = useLog ? Math.pow(10, Math.ceil(Math.log10(maxV * 1.05) * 4) / 4) : Math.ceil(maxV / 10) * 10;
      var nev = m.t + 4; // the "never stable" lane
      var top = m.t + 22;
      function y(v) {
        if (useLog) return top + (H - m.b - top) * (1 - (Math.log10(v) - Math.log10(yMin)) / (Math.log10(yMax) - Math.log10(yMin)));
        return top + (H - m.b - top) * (1 - (v - yMin) / (yMax - yMin));
      }
      function x(p) { return m.l + (W - m.l - m.r) * (p - 2) / 32; }
      var g = svg("svg", { viewBox: "0 0 " + W + " " + H, class: "sk-svg", role: "img",
        "aria-label": "Epochs to stability by population for the " + st.effLayout + " start, four settings of step ratio and rotation" });
      var ticks = useLog ? [5, 10, 20, 50, 100, 200, 500, 1000].filter(function (t) { return t >= yMin && t <= yMax; })
        : [0, 1, 2, 3, 4, 5].map(function (k) { return Math.round(k * yMax / 5); });
      ticks.forEach(function (t) {
        g.appendChild(svg("line", { x1: m.l, x2: W - m.r, y1: y(t), y2: y(t), class: "c-grid" }));
        g.appendChild(svg("text", { x: m.l - 6, y: y(t) + 4, "text-anchor": "end", class: "c-tick" }, String(t)));
      });
      g.appendChild(svg("text", { x: m.l - 6, y: nev + 8, "text-anchor": "end", class: "c-tick" }, "never"));
      (W < 520 ? [4, 8, 10, 16, 20, 25, 32] : [4, 5, 8, 10, 15, 16, 20, 25, 32]).forEach(function (p) {
        g.appendChild(svg("text", { x: x(p), y: H - m.b + 16, "text-anchor": "middle", class: "c-tick" }, String(p)));
      });
      g.appendChild(svg("text", { x: (m.l + W - m.r) / 2, y: H - 6, "text-anchor": "middle", class: "c-label" }, "Agents in the swarm"));
      g.appendChild(svg("text", { x: 4, y: 12, class: "c-label" }, useLog ? "Epochs to stability (log scale)" : "Epochs to stability"));
      EFF_SERIES.forEach(function (s) {
        var vals = rows[s.key], path = "", started = false;
        order.forEach(function (o) {
          var v = vals[o.i];
          if (v > 0) { path += (started ? "L" : "M") + x(o.p).toFixed(1) + "," + y(v).toFixed(1); started = true; }
          else started = false;
        });
        if (path) g.appendChild(svg("path", { d: path, class: "sk-line " + s.cls }));
        order.forEach(function (o) {
          var v = vals[o.i];
          if (v > 0) g.appendChild(svg("circle", { cx: x(o.p), cy: y(v), r: 3.2, class: "sk-dot " + s.cls }));
          else g.appendChild(svg("text", { x: x(o.p), y: nev + 8, "text-anchor": "middle", class: "sk-never " + s.cls }, "×"));
        });
        if (sim && sim[s.key]) {
          order.forEach(function (o) {
            var v = sim[s.key][o.i];
            if (v > 0) g.appendChild(svg("rect", { x: x(o.p) - 3, y: y(Math.max(yMin, v)) - 3, width: 6, height: 6, class: "sk-simdot " + s.cls }));
            else if (v === 0) g.appendChild(svg("rect", { x: x(o.p) - 3, y: nev + 13, width: 6, height: 6, class: "sk-simdot " + s.cls }));
          });
        }
      });
      chart.appendChild(g);
      legend.innerHTML = "";
      EFF_SERIES.forEach(function (s) { legend.appendChild(el("span", { class: "lg sk-lg " + s.cls, text: s.label })); });
      legend.appendChild(el("span", { class: "lg sk-lg-never", text: "× never stable" }));
      if (sim) legend.appendChild(el("span", { class: "lg sk-lg-sim", text: "▫ this page's runs" }));
      tableWrap.innerHTML = "";
      var lay = EFF_LAYOUTS.filter(function (l) { return l.value === st.effLayout; })[0];
      caption.textContent = "Lines and dots: the paper's " + lay.table + " (2018), averages of " + (lay.table === "Table II" ? "runs at each box position (two per position)" : "five runs") + ". " +
        (sim ? "Squares: this page's simulation, " + (st.live["eff:" + st.effLayout] ? "rerun in your browser" : "precomputed") +
          ", " + (data && data.meta ? data.meta.effRuns : 5) + " runs per point at δ = 12 and ε = 4, which the paper does not state for these tables." : "");
    }

    function capColor(v, maxV) {
      if (!v) return null;
      return Math.min(1, Math.log(v) / Math.log(maxV));
    }
    function drawCap() {
      chart.innerHTML = "";
      legend.innerHTML = "";
      var rows = CAP[st.capLayout];
      var sim = st.showSim && level() !== "public" && level() !== "hs" ? simCap(st.capLayout) : null;
      var t = el("table", { class: "results-table sk-cap" });
      var head = el("tr", {}, [el("th", { text: "ε" }), el("th", { text: "δ" }), el("th", { "data-levels": "ug grad res", text: "Area" })]);
      CAP_POPS.forEach(function (p) { head.appendChild(el("th", { text: String(p) })); });
      t.appendChild(el("thead", {}, [head]));
      var body = el("tbody");
      CAP_ROWS.forEach(function (rw, i) {
        var tr = el("tr", {}, [el("td", { text: String(rw[0]) }), el("td", { text: String(rw[1]) }),
          el("td", { "data-levels": "ug grad res", class: "w-mono", title: "4πδε, computed by this page; the paper prints " + CAP_AREA[i].toFixed(2),
            text: E.stabilityArea(rw[1], rw[0]).toFixed(2) })]);
        rows[i].forEach(function (v, k) {
          var simV = sim && sim[i] ? sim[i][k] : undefined;
          var td = el("td", { class: v ? "sk-cell" : "sk-cell sk-zero" });
          var shade = capColor(v, 360);
          if (shade !== null) td.style.setProperty("--sk-shade", String(Math.round(10 + 60 * shade)) + "%");
          td.appendChild(el("span", { class: "sk-paper", text: v ? fmt(v, v % 1 ? 1 : 0) : "never" }));
          if (simV !== undefined) td.appendChild(el("span", { class: "sk-sim", text: simV === null ? "–" : simV ? fmt(simV, 0) : "never" }));
          tr.appendChild(td);
        });
        body.appendChild(tr);
      });
      t.appendChild(body);
      tableWrap.innerHTML = "";
      tableWrap.appendChild(t);
      var lay = CAP_LAYOUTS.filter(function (l) { return l.value === st.capLayout; })[0];
      caption.textContent = "Epochs to stability by allowed slack ε, ideal distance δ, and swarm size: the paper's " + lay.table +
        " (2018), averages of five runs (eight for box starts). \"Never\" means the swarm did not settle or could not be placed. Darker cells took longer." +
        (sim ? " Second number in each cell: this page's simulation (" + (st.live["cap:" + st.capLayout] ? "rerun in your browser" : "precomputed") +
          ", " + (data && data.meta ? data.meta.capRuns : 5) + " runs, d:c 3:4 and r = 20°, which the paper does not state for these tables)." : "");
    }

    var cancel = null;
    runBtn.addEventListener("click", function () {
      if (cancel) { cancel(); cancel = null; runBtn.textContent = "Rerun in your browser"; runNote.textContent = "Stopped."; return; }
      var jobs = [], cells = [], runs = 5, cap = 2000, key, target;
      if (st.tab === "eff") {
        key = "eff:" + st.effLayout;
        target = {};
        EFF_SERIES.forEach(function (s) { target[s.key] = EFF_POPS.map(function () { return null; }); });
        EFF_SERIES.forEach(function (s) {
          var ratio = s.key.split(",")[0], r = +s.key.split(",")[1];
          EFF_POPS.forEach(function (p, i) { cells.push({ s: s.key, i: i, sum: 0, k: 0, z: 0 });
            for (var rep = 0; rep < runs; rep++) (function (cell, rep) {
              jobs.push(function () {
                var init = st.effLayout === "random" || st.effLayout === "linear" || st.effLayout === "collinear" ? st.effLayout : "box";
                var q = E.epochsToStability({ n: p, delta: 12, epsilon: 4, c: 1, d: ratio === "3:4" ? 0.75 : 1, r: r, init: init,
                  box: st.effLayout, seed: randomSeed() }, cap);
                return { cell: cell, q: q };
              });
            })(cells[cells.length - 1], rep);
          });
        });
      } else {
        key = "cap:" + st.capLayout;
        target = CAP_ROWS.map(function () { return CAP_POPS.map(function () { return null; }); });
        CAP_ROWS.forEach(function (rw, i) {
          CAP_POPS.forEach(function (p, k) {
            var cell = { i: i, k: k, sum: 0, n: 0, z: 0 };
            var boxes = ["corner", "side", "topbottom", "center"];
            for (var rep = 0; rep < runs; rep++) (function (rep) {
              jobs.push(function () {
                var q = E.epochsToStability({ n: p, delta: rw[1], epsilon: rw[0], c: 1, d: 0.75, r: 20,
                  init: st.capLayout, box: boxes[rep % 4], seed: randomSeed() }, cap);
                return { cell: cell, q: q };
              });
            })(rep);
          });
        });
      }
      st.live[key] = target;
      runBtn.textContent = "Stop";
      runNote.textContent = "0 of " + jobs.length + " runs";
      var done = 0;
      cancel = runChunked(jobs, function (i, res) {
        done++;
        var c = res.cell, q = res.q;
        if (q.epochs > 0 || q.already) { c.sum += q.epochs; c.n = (c.n || 0) + 1; } else c.z++;
        var v = c.n ? c.sum / c.n : 0;
        if (c.s !== undefined) target[c.s][c.i] = v; else target[c.i][c.k] = v;
        if (done % 10 === 0 || done === jobs.length) { runNote.textContent = done + " of " + jobs.length + " runs"; draw(); }
      }, function () {
        cancel = null; runBtn.textContent = "Rerun in your browser";
        runNote.textContent = jobs.length + " runs done on your device.";
        draw();
      });
    });

    function draw() {
      effRow.hidden = st.tab !== "eff";
      capRow.hidden = st.tab !== "cap";
      if (st.tab === "eff") drawEff(); else drawCap();
    }
    resizers.push(draw);
    document.addEventListener("paperlevel", draw);
    draw();
    root.classList.add("w-ready");
  }

  /* ---------------------------------------------------------------- demo 3: the attack */

  function mountAttack(root) {
    var st = { n: 16, a: 3, delta: 16, epsilon: 4, moves: "1,1", delay: "stability", seed: 7,
      playing: false, speed: 4, raf: null, visible: true };
    var s;
    var stage = el("div", { class: "sk-stage" });
    var side = el("div", { class: "sk-side" });
    var field = new Field(stage, "A SHARKS swarm with adversarial agents");
    stage.appendChild(el("p", { class: "w-note sk-key" }, [
      el("span", { class: "sk-k sk-k-in", text: "regular agent" }), " ",
      el("span", { class: "sk-k sk-k-adv", text: "adversary" }), " ",
      el("span", { class: "sk-k sk-k-gap", text: "largest gap" })
    ]));

    var playBtn = el("button", { type: "button", class: "w-btn", text: "Play" });
    var newBtn = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "New run" });
    var speedSeg = segmented("Speed", [{ value: 1, label: "1×" }, { value: 4, label: "4×" }, { value: 40, label: "40×" }], st.speed,
      function (v) { st.speed = v; }, "seg-small");
    var stats = el("p", { class: "w-big sk-stats", "aria-live": "polite" });
    var phase = el("p", { class: "w-mono sk-trace" });

    var nSeg = segmented("Regular agents", [8, 16, 32, 64].map(function (v) { return { value: v, label: String(v) }; }), st.n,
      function (v) { st.n = v; reset(st.seed); }, "seg-small");
    var aSeg = segmented("Adversaries", [2, 3, 4, 5, 6, 7, 8].map(function (v) { return { value: v, label: String(v) }; }), st.a,
      function (v) { st.a = v; reset(st.seed); }, "seg-small");
    var delaySeg = segmented("Adversaries enter", ADV_DELAY.map(function (d) { return { value: d.key, label: d.label }; }), st.delay,
      function (v) { st.delay = v; reset(st.seed); }, "seg-small");
    var deltaSeg = segmented("Ideal distance δ", [8, 12, 16].map(function (v) { return { value: v, label: String(v) }; }), st.delta,
      function (v) { st.delta = v; reset(st.seed); }, "seg-small");
    var epsSeg = segmented("Allowed slack ε", [4, 6, 8].map(function (v) { return { value: v, label: String(v) }; }), st.epsilon,
      function (v) { st.epsilon = v; reset(st.seed); }, "seg-small");
    var moveSeg = segmented("Step sizes d:c", ["0.5,0.5", "0.5,1", "1,0.5", "1,1"].map(function (k) {
      var p = k.split(","); return { value: k, label: p[0] + ":" + p[1] };
    }), st.moves, function (v) { st.moves = v; reset(st.seed); }, "seg-small");

    side.appendChild(el("div", { class: "w-actions" }, [playBtn, newBtn, speedSeg]));
    side.appendChild(stats);
    side.appendChild(phase);
    side.appendChild(controlRow("Regular agents", nSeg));
    side.appendChild(controlRow("Adversaries", aSeg));
    side.appendChild(controlRow("Adversaries enter", delaySeg, "hs ug grad res"));
    side.appendChild(controlRow("Ideal distance δ", deltaSeg, "hs ug grad res"));
    side.appendChild(controlRow("Allowed slack ε", epsSeg, "ug grad res"));
    side.appendChild(controlRow("Step sizes d:c", moveSeg, "ug grad res"));
    root.appendChild(el("div", { class: "sk-split" }, [stage, side]));
    root.appendChild(el("p", { class: "w-note", text: "Simulated on your device, one run at a time; the paper averages three runs of each of 3,024 settings over 10,000 epochs. Adversaries enter together at one point on the circle, a detail the paper leaves open." }));

    function reset(seed) {
      st.seed = seed;
      var p = st.moves.split(",");
      s = new E.Swarm({ n: st.n, adversaries: st.a, delta: st.delta, epsilon: st.epsilon, d: +p[0], c: +p[1], r: 20,
        advDelay: st.delay, seed: seed });
      draw();
    }
    var lastFrame = 0;
    function frame(ts) {
      if (!st.playing) { st.raf = null; return; }
      if (ts - lastFrame >= 50) {
        lastFrame = ts;
        for (var i = 0; i < st.speed && s.ticks < 10000; i++) s.step(false);
        if (s.ticks >= 10000) pause();
        draw();
      }
      st.raf = st.visible ? requestAnimationFrame(frame) : null;
    }
    function play() {
      if (s.ticks >= 10000) reset(randomSeed());
      st.playing = true; playBtn.textContent = "Pause"; playBtn.classList.add("running");
      if (!st.raf) st.raf = requestAnimationFrame(frame);
    }
    function pause() { st.playing = false; playBtn.textContent = "Play"; playBtn.classList.remove("running"); }
    playBtn.addEventListener("click", function () { st.playing ? pause() : play(); });
    newBtn.addEventListener("click", function () { reset(randomSeed()); });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        st.visible = entries[0].isIntersecting;
        if (st.visible && st.playing && !st.raf) st.raf = requestAnimationFrame(frame);
      }).observe(field.canvas);
    }

    function draw() {
      field.draw(s, { gap: s.launchAt >= 0 });
      stats.innerHTML = "";
      if (s.measuring) {
        stats.appendChild(document.createTextNode("Open now "));
        stats.appendChild(el("strong", { text: fmt(100 * s.accessNow, 1) + "%" }));
        stats.appendChild(document.createTextNode(" · largest so far " + fmt(100 * s.access, 1) + "%"));
      } else {
        stats.appendChild(document.createTextNode("Epoch " + s.ticks));
      }
      var txt;
      if (s.launchAt < 0) txt = "Epoch " + s.ticks + ": the swarm is settling" + (st.delay === "stability20" && s.stableAt >= 0 ? "; adversaries wait 20 epochs after stability." : "; adversaries wait for it to become stable.");
      else if (s.stableAt < 0) txt = "Epoch " + s.ticks + ": adversaries are in the field; the regular swarm has not been stable yet, so nothing is measured.";
      else txt = "Epoch " + s.ticks + " of 10,000: adversaries entered at epoch " + s.launchAt + ". Percent access is the largest arc with no regular agent, as a share of the circle.";
      phase.textContent = txt;
      field.canvas.setAttribute("aria-label", "Swarm at epoch " + s.ticks + (s.measuring ? ", largest gap " + fmt(100 * s.accessNow, 1) + " percent of the circle" : ""));
    }
    resizers.push(draw);
    themeListeners.push(function () { setTimeout(draw, 0); });
    reset(st.seed);
    root.classList.add("w-ready");
  }

  /* ---------------------------------------------------------------- demo 4: attack results */

  function mountResults(root, data) {
    var sw = data && data.sweep;
    var wrap = el("div", { class: "sk-results" });
    root.appendChild(wrap);

    function bars(title, rows, maxV, simLabel) {
      var block = el("div", { class: "sk-bars" }, [el("p", { class: "sk-bars-title", text: title })]);
      rows.forEach(function (r) {
        var line = el("div", { class: "sk-bar-row" }, [el("span", { class: "sk-bar-label", text: r.label })]);
        var track = el("span", { class: "sk-bar-track" });
        if (r.v === null) track.appendChild(el("span", { class: "sk-bar-null", text: "never measured (NULL)" }));
        else track.appendChild(el("span", { class: "sk-bar", style: "width:" + (100 * r.v / maxV).toFixed(1) + "%" }));
        line.appendChild(track);
        line.appendChild(el("span", { class: "sk-bar-value", text: r.v === null ? "NULL" : fmt(r.v, 2) + "%" }));
        if (r.sim !== undefined) line.appendChild(el("span", { class: "sk-bar-sim", "data-levels": "grad res",
          text: r.sim === null ? "page: rarely stable (6 of 756 runs)" : "page: " + fmt(r.sim, 1) + "%" }));
        block.appendChild(line);
      });
      if (simLabel) block.appendChild(el("p", { class: "w-mono", "data-levels": "grad res", text: simLabel }));
      return block;
    }

    function draw() {
      wrap.innerHTML = "";
      var popRows = ADV_POP.map(function (p) {
        return { label: p.n + " agents, " + p.a + " adversaries", v: p.v, sim: sw ? sw.pop[p.n + "," + p.a] : undefined };
      });
      wrap.appendChild(bars("Swarm size and adversaries (Section V.A, Figure 1)", popRows, 30));
      var delayRows = ADV_DELAY.map(function (d) { return { label: d.label, v: d.v, sim: sw ? sw.delay[d.key] : undefined }; });
      wrap.appendChild(bars("When the adversaries enter (Section V.D)", delayRows, 30));
      var moveRows = ADV_MOVES.map(function (m) {
        return { label: "d " + m.d + ", c " + m.c, v: m.v, sim: sw ? sw.moves[m.d + "," + m.c] : undefined };
      });
      wrap.appendChild(bars("Step sizes, dispersion d and center c (Table III)", moveRows, 30));

      // Table II as a ruled table, with the page's sweep at graduate and researcher levels.
      var t = el("table", { class: "results-table sk-region" });
      var head = el("tr", {}, [el("th", { text: "δ and ε" })]);
      ADV_REGION.epsilons.forEach(function (e) { head.appendChild(el("th", { text: "ε = " + e })); });
      t.appendChild(el("thead", {}, [head]));
      var body = el("tbody");
      ADV_REGION.deltas.forEach(function (d, i) {
        var tr = el("tr", {}, [el("th", { text: "δ = " + d })]);
        ADV_REGION.epsilons.forEach(function (e, k) {
          var td = el("td", {}, [el("span", { class: "sk-paper", text: fmt(ADV_REGION.values[i][k], 2) + "%" })]);
          if (sw && sw.region) td.appendChild(el("span", { class: "sk-sim", "data-levels": "grad res", text: fmt(sw.region[d + "," + e], 1) + "%" }));
          tr.appendChild(td);
        });
        body.appendChild(tr);
      });
      t.appendChild(body);
      wrap.appendChild(el("p", { class: "sk-bars-title", text: "Size of the ring, ideal distance δ and slack ε (Table II)" }));
      wrap.appendChild(el("div", { class: "sk-table-wrap" }, [t]));
      if (sw) {
        wrap.appendChild(el("p", { class: "w-note", "data-levels": "grad res",
          text: "\"Page\" values: this page's simulation of the same 3,024 settings, one run each (" + sw.runs + " runs), 10,000 epochs, the largest gap per run, " +
            "averaged with runs that never became stable counted as 0 percent, which is how the paper's own averages line up with its NULL cell. " +
            "Paper values come from three runs of each setting in NetLogo." }));
      }
    }
    document.addEventListener("paperlevel", draw);
    draw();
    root.classList.add("w-ready");
  }

  /* ---------------------------------------------------------------- start */

  function start(data) {
    var a = document.getElementById("sk-swarm"); if (a) mountSwarm(a);
    var b = document.getElementById("sk-tables"); if (b) mountTables(b, data);
    var c = document.getElementById("sk-attack"); if (c) mountAttack(c);
    var d = document.getElementById("sk-results"); if (d) mountResults(d, data);
  }
  function go() {
    fetch(SCRIPT_BASE + "sharks-data.json").then(function (r) { return r.json(); })
      .then(start, function () { start(null); });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", go);
  else go();
})();

/*
  Swarm ejection defenses widget for /papers/swarm-ejection-defense/.
  Mount points in the page: #ej-field, #ej-rules, #ej-tables, #ej-sweep.
  Demo 1 runs the engine (sharks-engine.js + ejection-engine.js) live. Demo 2
  draws the paper's two ejection formulas. Demo 3 draws the paper's Tables I to
  III. Demo 4 shows this page's own run of the paper's 11,664-setting design
  (ej-data.json, precomputed with the same engine in Node) beside the paper's
  values, and can rerun a slice of it in the visitor's browser.
*/
(function () {
  "use strict";

  var X = window.EjectionEngine;
  var E = X.Engine;
  var SVGNS = "http://www.w3.org/2000/svg";
  var SCRIPT_BASE = (document.currentScript && document.currentScript.src || "").replace(/[^/]*$/, "");

  /* ---------------------------------------------------------------- the paper's data */

  var TECHS = [
    { key: "none", label: "None", short: "None" },
    { key: "basic", label: "Basic", short: "Basic" },
    { key: "dist", label: "Dynamic distance", short: "Dyn. dist." },
    { key: "perc", label: "Dynamic percentage", short: "Dyn. perc." }
  ];
  var POPS = [8, 16, 32, 64], ADVS = [3, 5, 7], DELTAS = [12, 16, 20], EPSS = [2, 4, 6], DISTS = [4, 5, 6], PCTS = [6, 8, 10];

  // Table I: security metric (percent) by technique, adversaries (rows), and population (columns).
  var T1 = {
    none: [[17.49, 16.39, 7.84, 2.85], [20.51, 17.11, 11.25, 5.24], [21.16, 17.24, 13.64, 6.93]],
    basic: [[16.30, 12.76, 5.72, 1.44], [18.33, 14.51, 8.87, 2.96], [19.37, 15.71, 10.98, 4.32]],
    dist: [[14.59, 9.81, 3.49, 1.36], [15.83, 12.26, 6.36, 1.48], [16.46, 13.13, 7.80, 1.83]],
    perc: [[16.45, 12.21, 5.76, 1.32], [18.09, 14.43, 8.86, 2.94], [18.92, 15.57, 10.89, 4.29]]
  };
  // Table II: by technique, delta (rows), and epsilon (columns).
  var T2 = {
    none: [[5.02, 5.05, 5.02], [5.04, 5.05, 5.04], [5.81, 5.85, 5.85]],
    basic: [[4.54, 4.59, 4.55], [4.55, 4.58, 4.55], [5.16, 5.18, 5.14]],
    dist: [[3.35, 3.53, 3.36], [3.35, 3.54, 3.36], [3.52, 3.70, 3.57]],
    perc: [[4.49, 4.56, 4.54], [4.50, 4.57, 4.54], [5.11, 5.16, 5.13]]
  };
  // Table III: by technique, initial ejection distance (rows), and initial likelihood (columns).
  var T3 = {
    none: [[13.05, 13.14, 13.19], [13.00, 13.16, 13.02], [13.28, 13.18, 13.22]],
    basic: [[12.28, 11.86, 11.61], [11.32, 10.94, 10.51], [10.48, 10.11, 9.25]],
    dist: [[9.36, 8.65, 8.07], [9.39, 8.66, 8.05], [9.31, 8.59, 8.21]],
    perc: [[11.80, 11.73, 11.87], [10.85, 10.91, 10.92], [9.70, 9.71, 9.78]]
  };

  var TABLES = {
    t1: { label: "Table I: population and adversaries", rows: ADVS, cols: POPS, data: T1, runs: 243,
      rowName: "adversaries", colName: "agents", rowText: function (v) { return v + " adversaries"; }, colText: function (v) { return v + " agents"; } },
    t2: { label: "Table II: ring size δ and slack ε", rows: DELTAS, cols: EPSS, data: T2, runs: 324,
      rowName: "δ", colName: "ε", rowText: function (v) { return "δ = " + v; }, colText: function (v) { return "ε = " + v; } },
    t3: { label: "Table III: ejection distance and likelihood", rows: DISTS, cols: PCTS, data: T3, runs: 324,
      rowName: "initial distance", colName: "initial likelihood", rowText: function (v) { return "eject " + v + " units"; }, colText: function (v) { return v + "% a turn"; } }
  };

  function mean2(m) {
    var s = 0, n = 0;
    m.forEach(function (row) { row.forEach(function (v) { if (v != null) { s += v; n++; } }); });
    return n ? s / n : null;
  }

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
  var resizers = [], resizeTimer = null;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () { resizers.forEach(function (fn) { fn(); }); }, 150);
  });
  function level() { return window.PaperKit ? window.PaperKit.level() : "public"; }
  function deep() { var l = level(); return l === "grad" || l === "res"; }
  function fmt(v, digits) { return v === null || v === undefined || isNaN(v) ? "–" : (+v).toFixed(digits == null ? 1 : digits); }

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
    return el("div", { class: "ej-row", "data-levels": levels || null }, [el("span", { class: "ej-row-label", text: label }), control]);
  }
  function numOptions(list, suffix) { return list.map(function (v) { return { value: v, label: v + (suffix || "") }; }); }
  function techOptions(shortLabels) { return TECHS.map(function (t) { return { value: t.key, label: shortLabels ? t.short : t.label }; }); }

  function themeColors() {
    var cs = getComputedStyle(document.documentElement);
    function v(name, fallback) { var s = cs.getPropertyValue(name).trim(); return s || fallback; }
    return {
      primary: v("--primary", "#60a5fa"), accent: v("--accent", "#22d3ee"), text: v("--text", "#e0eafc"),
      background: v("--background", "#060d1f"), alt: v("--background-alt", "#0c1a36"),
      light: v("--light-gray", "#1e3a5f"), gray: v("--gray", "#6b8fc4"), dark: v("--dark-gray", "#a3c4f0")
    };
  }
  var themeListeners = [];
  new MutationObserver(function () { themeListeners.forEach(function (fn) { fn(); }); })
    .observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  function randomSeed() {
    try { var a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] % 1000000; }
    catch (err) { return Math.floor(Math.random() * 1000000); }
  }

  // Shared state: every demo follows the same defense, swarm size, and adversary count.
  var shared = { tech: "dist", n: 16, adv: 5, listeners: [] };
  function setShared(key, value, from) {
    shared[key] = value;
    shared.listeners.forEach(function (fn) { if (fn.owner !== from) fn(key, value); });
  }
  function onShared(owner, fn) { fn.owner = owner; shared.listeners.push(fn); }

  /* ---------------------------------------------------------------- demo 1: the field */

  function Field(root, label) {
    this.canvas = el("canvas", { class: "ej-canvas", role: "img", "aria-label": label });
    this.ctx = this.canvas.getContext("2d");
    this.colors = themeColors();
    root.appendChild(this.canvas);
    var self = this;
    themeListeners.push(function () { self.colors = themeColors(); });
  }
  Field.prototype.draw = function (s, recent) {
    var c = this.colors, canvas = this.canvas, ctx = this.ctx;
    var cssW = Math.min(canvas.parentNode.clientWidth || 420, 460);
    var dpr = window.devicePixelRatio || 1;
    var size = Math.round(cssW * dpr);
    if (canvas.width !== size) { canvas.width = size; canvas.height = size; }
    canvas.style.width = cssW + "px";
    canvas.style.height = cssW + "px";
    var view = Math.min(E.MAXP + 0.5, s.delta + s.epsilon + 4);
    var scale = size / (2 * view);
    function sx(x) { return (x + view) * scale; }
    function sy(y) { return (view - y) * scale; }
    ctx.fillStyle = c.alt;
    ctx.fillRect(0, 0, size, size);
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
    if (s.launchAt >= 0) {
      var g = s.gapArc();
      if (g) {
        ctx.strokeStyle = c.accent;
        ctx.lineWidth = 4 * dpr;
        ctx.beginPath();
        ctx.arc(sx(0), sy(0), (s.delta + s.epsilon + 1.4) * scale, g.from - Math.PI / 2, g.to - Math.PI / 2);
        ctx.stroke();
      }
    }
    ctx.fillStyle = c.text;
    ctx.beginPath();
    ctx.arc(sx(0), sy(0), Math.max(3 * dpr, 0.45 * scale), 0, 2 * Math.PI);
    ctx.fill();
    for (var i = 0; i < s.agents.length; i++) {
      var a = s.agents[i];
      if (Math.abs(a.x) > view || Math.abs(a.y) > view) continue;
      var col = a.adv ? c.accent : c.primary;
      ctx.fillStyle = col;
      if (a.adv) {
        ctx.beginPath();
        ctx.rect(sx(a.x) - 0.42 * scale, sy(a.y) - 0.42 * scale, 0.84 * scale, 0.84 * scale);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(sx(a.x), sy(a.y), Math.max(2 * dpr, 0.36 * scale), 0, 2 * Math.PI);
        ctx.fill();
        if (recent[a.id]) {
          ctx.strokeStyle = c.text;
          ctx.globalAlpha = Math.min(1, recent[a.id] / 6);
          ctx.lineWidth = 1.5 * dpr;
          ctx.beginPath();
          ctx.arc(sx(a.x), sy(a.y), Math.max(5 * dpr, 0.85 * scale), 0, 2 * Math.PI);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      }
    }
  };

  function mountField(root) {
    var AFTER = 1000;
    var st = { delta: 16, epsilon: 4, r: 20, ejDist: 5, ejPct: 8, seed: 1, playing: false, speed: 4, raf: null, visible: true };
    var s, recent = {}, history = [];

    var stage = el("div", { class: "ej-stage" });
    var side = el("div", { class: "ej-side" });
    var field = new Field(stage, "A swarm circling a target");
    stage.appendChild(el("p", { class: "w-note ej-key" }, [
      el("span", { class: "ej-k ej-k-reg", text: "regular agent" }), " ",
      el("span", { class: "ej-k ej-k-ej", text: "just ejected" }), " ",
      el("span", { class: "ej-k ej-k-adv", text: "adversary" }), " ",
      el("span", { class: "ej-k ej-k-ring", text: "ring δ ± ε" })
    ]));

    var playBtn = el("button", { type: "button", class: "w-btn", text: "Play" });
    var stepBtn = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "Step" });
    var newBtn = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "New run" });
    var speedSeg = segmented("Speed", [{ value: 1, label: "1×" }, { value: 4, label: "4×" }, { value: 20, label: "20×" }], st.speed,
      function (v) { st.speed = v; }, "seg-small");
    var stats = el("p", { class: "w-big ej-stats", "aria-live": "polite" });
    var readout = el("dl", { class: "ej-readout" });
    function rrow(label, levels) {
      var dd = el("dd"), row = el("div", { "data-levels": levels || null }, [el("dt", { text: label }), dd]);
      readout.appendChild(row);
      return dd;
    }
    var rErr = rrow("Spacing error now (this page's reading)");
    var rPaper = rrow("Paper, Table I average for this defense, size, and adversary count", "hs ug grad res");
    var rNN = rrow("Ring-neighbor reading of the same metric", "res");
    var rGap = rrow("Largest gap in the ring", "ug grad res");
    var rEj = rrow("Ejections so far");
    var spark = el("div", { class: "ej-chart" });

    var techSeg = segmented("Defense", techOptions(false), shared.tech, function (v) { setShared("tech", v, "field"); reset(st.seed); }, "seg-small");
    var nSeg = segmented("Agents", numOptions(POPS), shared.n, function (v) { setShared("n", v, "field"); reset(st.seed); }, "seg-small");
    var aSeg = segmented("Adversaries", numOptions(ADVS), shared.adv, function (v) { setShared("adv", v, "field"); reset(st.seed); }, "seg-small");
    var dSeg = segmented("Ideal distance δ", numOptions(DELTAS), st.delta, function (v) { st.delta = v; reset(st.seed); }, "seg-small");
    var eSeg = segmented("Slack ε", numOptions(EPSS), st.epsilon, function (v) { st.epsilon = v; reset(st.seed); }, "seg-small");
    var rSeg = segmented("Rotation r", numOptions([5, 20, 45], "°"), st.r, function (v) { st.r = v; reset(st.seed); }, "seg-small");
    var jdSeg = segmented("Ejection distance", numOptions(DISTS), st.ejDist, function (v) { st.ejDist = v; reset(st.seed); }, "seg-small");
    var jpSeg = segmented("Ejection likelihood", numOptions(PCTS, "%"), st.ejPct, function (v) { st.ejPct = v; reset(st.seed); }, "seg-small");

    side.appendChild(el("div", { class: "w-actions" }, [playBtn, stepBtn, newBtn, speedSeg]));
    side.appendChild(stats);
    side.appendChild(controlRow("Defense", techSeg));
    side.appendChild(controlRow("Agents", nSeg));
    side.appendChild(controlRow("Adversaries", aSeg));
    side.appendChild(controlRow("Ideal distance δ", dSeg, "ug grad res"));
    side.appendChild(controlRow("Slack ε", eSeg, "ug grad res"));
    side.appendChild(controlRow("Turn r", rSeg, "grad res"));
    side.appendChild(controlRow("Basic: distance", jdSeg, "ug grad res"));
    side.appendChild(controlRow("Basic: likelihood", jpSeg, "ug grad res"));
    side.appendChild(readout);
    side.appendChild(spark);
    root.appendChild(el("div", { class: "ej-split" }, [stage, side]));
    root.appendChild(el("p", { class: "w-note", text: "Simulated on your device with this page's reading of the paper (the authors' NetLogo model is not public). One run; the paper's numbers average hundreds." }));

    function opts() {
      return { n: shared.n, adversaries: shared.adv, delta: st.delta, epsilon: st.epsilon, r: st.r, c: 1, d: 0.75,
        ejection: shared.tech, ejDist: st.ejDist, ejPct: st.ejPct, seed: st.seed, advDelay: "stability" };
    }
    function reset(seed) {
      st.seed = seed;
      s = new X.DefendedSwarm(opts());
      recent = {}; history = [];
      draw();
    }
    function done() { return s.launchAt >= 0 && s.ticks >= s.launchAt + AFTER; }
    function tick() {
      if (done()) return;
      s.step(false);
      Object.keys(recent).forEach(function (k) { if (--recent[k] <= 0) delete recent[k]; });
      s.ejectTrail.forEach(function (id) { recent[id] = 6; });
      if (s.launchAt >= 0) history.push([s.ticks - s.launchAt, 100 * s.spacing().error]);
      if (s.ticks > 2000 && s.launchAt < 0) pause();
      if (done()) pause();
    }
    var lastFrame = 0;
    function frame(ts) {
      if (!st.playing) { st.raf = null; return; }
      if (ts - lastFrame >= 50) { lastFrame = ts; for (var i = 0; i < st.speed; i++) tick(); draw(); }
      st.raf = st.visible ? requestAnimationFrame(frame) : null;
    }
    function play() {
      if (done()) reset(randomSeed());
      st.playing = true; playBtn.textContent = "Pause"; playBtn.classList.add("running");
      if (!st.raf) st.raf = requestAnimationFrame(frame);
    }
    function pause() { st.playing = false; playBtn.textContent = "Play"; playBtn.classList.remove("running"); }
    playBtn.addEventListener("click", function () { st.playing ? pause() : play(); });
    stepBtn.addEventListener("click", function () { pause(); tick(); draw(); });
    newBtn.addEventListener("click", function () { reset(randomSeed()); });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        st.visible = entries[0].isIntersecting;
        if (st.visible && st.playing && !st.raf) st.raf = requestAnimationFrame(frame);
      }).observe(field.canvas);
    }

    function drawSpark() {
      spark.innerHTML = "";
      var W = chartWidth(spark), H = 120, m = { l: 40, r: 10, t: 16, b: 24 };
      var maxY = 20;
      history.forEach(function (p) { if (p[1] > maxY) maxY = p[1]; });
      maxY = Math.ceil(maxY / 10) * 10;
      function x(t) { return m.l + (W - m.l - m.r) * t / AFTER; }
      function y(v) { return m.t + (H - m.t - m.b) * (1 - v / maxY); }
      var g = svg("svg", { viewBox: "0 0 " + W + " " + H, class: "ej-svg", role: "img",
        "aria-label": "Spacing error over the 1,000 epochs after the adversaries enter" });
      [0, maxY / 2, maxY].forEach(function (t) {
        g.appendChild(svg("line", { x1: m.l, x2: W - m.r, y1: y(t), y2: y(t), class: "c-grid" }));
        g.appendChild(svg("text", { x: m.l - 6, y: y(t) + 4, "text-anchor": "end", class: "c-tick" }, t + "%"));
      });
      [0, 250, 500, 750, 1000].forEach(function (t) {
        g.appendChild(svg("text", { x: x(t), y: H - 8, "text-anchor": "middle", class: "c-tick" }, String(t)));
      });
      g.appendChild(svg("text", { x: m.l, y: 10, class: "c-label" }, "Spacing error after the adversaries enter (epochs)"));
      var p = T1[shared.tech] && T1[shared.tech][ADVS.indexOf(shared.adv)];
      var paperV = p ? p[POPS.indexOf(shared.n)] : null;
      if (paperV != null && level() !== "public" && paperV <= maxY) {
        var py = y(paperV);
        g.appendChild(svg("line", { x1: m.l, x2: W - m.r, y1: py, y2: py, class: "ej-cursor" }));
        g.appendChild(svg("text", { x: W - m.r, y: py - 4, "text-anchor": "end", class: "c-label" }, "paper's average " + paperV.toFixed(2) + "%"));
      }
      if (history.length) {
        var step = Math.max(1, Math.floor(history.length / 400)), d = "";
        for (var i = 0; i < history.length; i += step) d += (d ? "L" : "M") + x(history[i][0]).toFixed(1) + " " + y(Math.min(maxY, history[i][1])).toFixed(1);
        g.appendChild(svg("path", { d: d, class: "ej-line t-" + shared.tech }));
      }
      spark.appendChild(g);
    }

    function draw() {
      field.draw(s, recent);
      var phase;
      if (s.launchAt < 0) phase = s.ticks > 2000 ? "The swarm never settled; press New run." : "Settling into the ring. The adversaries enter once every agent is inside it.";
      else if (!done()) phase = "Under attack: epoch " + (s.ticks - s.launchAt) + " of " + AFTER + ".";
      else phase = "Done: 1,000 epochs after the adversaries entered.";
      stats.innerHTML = "";
      stats.appendChild(document.createTextNode("Epoch " + s.ticks + ". "));
      stats.appendChild(el("span", { text: phase }));
      if (s.launchAt >= 0) {
        var sp = s.ringSpacing(), nn = s.spacing();
        rErr.innerHTML = "";
        rErr.appendChild(el("strong", { text: fmt(100 * nn.error, 1) + "%" }));
        rNN.textContent = fmt(100 * sp.error, 1) + "%";
        rGap.textContent = fmt(100 * s.largestGap(), 1) + "% of the circle";
      } else {
        rErr.textContent = "once the attack starts";
        rNN.textContent = "–";
        rGap.textContent = "–";
      }
      var row = T1[shared.tech][ADVS.indexOf(shared.adv)];
      rPaper.textContent = fmt(row[POPS.indexOf(shared.n)], 2) + "%";
      rEj.textContent = String(s.ejections);
      drawSpark();
      field.canvas.setAttribute("aria-label", "Swarm of " + shared.n + " agents and " + shared.adv + " adversaries at epoch " + s.ticks + ", defense: " + X.TECH_LABEL[shared.tech] + ".");
    }

    onShared("field", function (key, value) {
      if (key === "tech") techSeg.set(value);
      if (key === "n") nSeg.set(value);
      if (key === "adv") aSeg.set(value);
      pause(); reset(st.seed);
    });
    resizers.push(draw);
    themeListeners.push(function () { setTimeout(draw, 0); });
    document.addEventListener("paperlevel", draw);
    reset(1);
    root.classList.add("w-ready");
  }

  /* ---------------------------------------------------------------- demo 2: the ejection rules */

  function mountRules(root) {
    var st = { err: 0.3, delta: 16, ejDist: 5, ejPct: 8 };
    var errRow = el("div", { class: "w-range" });
    var errInput = el("input", { type: "range", id: "ej-err", min: "0", max: "1", step: "0.0025", value: String(st.err) });
    function errText(v) { return String(+v.toFixed(4)); }
    var errOut = el("output", { for: "ej-err", text: errText(st.err) });
    errRow.appendChild(el("label", { for: "ej-err", text: "Crowding error" }));
    errRow.appendChild(errInput);
    errRow.appendChild(errOut);
    var dSeg = segmented("Ideal distance δ", numOptions(DELTAS), st.delta, function (v) { st.delta = v; draw(); }, "seg-small");
    var chartD = el("div", { class: "ej-chart" }), chartP = el("div", { class: "ej-chart" });
    var legend = el("div", { class: "c-legend w-mono" }, [
      el("span", { class: "lg t-basic", text: "Basic (fixed)" }),
      el("span", { class: "lg t-dist", text: "Dynamic distance" }),
      el("span", { class: "lg t-perc", text: "Dynamic percentage" }),
      el("span", { class: "lg t-lin", text: "straight-line version", "data-levels": "ug grad res" })
    ]);
    var table = el("table", { class: "results-table ej-now" });
    root.appendChild(errRow);
    root.appendChild(controlRow("Ideal distance δ", dSeg, "hs ug grad res"));
    root.appendChild(chartD);
    root.appendChild(chartP);
    root.appendChild(legend);
    var tableNote = el("p", { class: "w-note" });
    root.appendChild(el("div", { class: "ej-table-wrap" }, [table]));
    root.appendChild(tableNote);
    errInput.addEventListener("input", function () { st.err = +errInput.value; errOut.textContent = errText(st.err); draw(); });

    function plot(node, opts) {
      node.innerHTML = "";
      var W = chartWidth(node), H = Math.max(170, Math.round(W * 0.3)), m = { l: 44, r: 12, t: 22, b: 30 };
      function x(e) { return m.l + (W - m.l - m.r) * e; }
      function y(v) { return m.t + (H - m.t - m.b) * (1 - v / opts.max); }
      var g = svg("svg", { viewBox: "0 0 " + W + " " + H, class: "ej-svg", role: "img", "aria-label": opts.aria });
      opts.ticks.forEach(function (t) {
        g.appendChild(svg("line", { x1: m.l, x2: W - m.r, y1: y(t), y2: y(t), class: "c-grid" }));
        g.appendChild(svg("text", { x: m.l - 6, y: y(t) + 4, "text-anchor": "end", class: "c-tick" }, String(t) + opts.unit));
      });
      [0, 0.25, 0.5, 0.75, 1].forEach(function (t) {
        g.appendChild(svg("text", { x: x(t), y: H - 10, "text-anchor": "middle", class: "c-tick" }, String(t)));
      });
      g.appendChild(svg("text", { x: 4, y: 12, class: "c-label" }, opts.title));
      opts.lines.forEach(function (ln) {
        var d = "";
        for (var i = 0; i <= 100; i++) { var e = i / 100; d += (i ? "L" : "M") + x(e).toFixed(1) + " " + y(ln.f(e)).toFixed(1); }
        var path = svg("path", { d: d, class: "ej-line " + ln.cls });
        if (ln.levels) path.setAttribute("data-levels", ln.levels);
        g.appendChild(path);
      });
      g.appendChild(svg("line", { x1: x(st.err), x2: x(st.err), y1: m.t, y2: H - m.b, class: "ej-cursor" }));
      opts.lines.forEach(function (ln) {
        if (ln.levels) return;
        g.appendChild(svg("circle", { cx: x(st.err), cy: y(ln.f(st.err)), r: 4, class: "ej-dot " + ln.cls }));
      });
      node.appendChild(g);
    }

    function draw() {
      var half = st.delta / 2, q = function (e) { return Math.pow(e, 0.25); };
      plot(chartD, {
        title: "Ejection distance (units toward the target)", unit: "", max: 10,
        ticks: [0, 2, 4, 6, 8, 10], aria: "Ejection distance against crowding error",
        lines: [
          { cls: "t-basic", f: function () { return st.ejDist; } },
          { cls: "t-dist", f: function (e) { return half * q(e); } },
          { cls: "t-lin", f: function (e) { return half * e; }, levels: "ug grad res" }
        ]
      });
      plot(chartP, {
        title: "Ejection chance each epoch", unit: "%", max: 10,
        ticks: [0, 2, 4, 6, 8, 10], aria: "Ejection likelihood against crowding error",
        lines: [
          { cls: "t-basic", f: function () { return st.ejPct; } },
          { cls: "t-perc", f: function (e) { return 5 * q(e); } },
          { cls: "t-lin", f: function (e) { return 5 * e; }, levels: "ug grad res" }
        ]
      });
      var e = st.err, rows = [
        ["Basic", st.ejDist, st.ejPct],
        ["Dynamic distance", half * q(e), st.ejPct],
        ["Dynamic percentage", st.ejDist, 5 * q(e)]
      ];
      table.innerHTML = "";
      table.appendChild(el("thead", null, [el("tr", null, [el("th", { text: "Defense at error " + errText(e) }), el("th", { text: "Distance" }), el("th", { text: "Chance a turn" }), el("th", { text: "Units per 100 turns" })])]));
      var tb = el("tbody");
      rows.forEach(function (r) {
        tb.appendChild(el("tr", null, [el("td", { text: r[0] }), el("td", { text: fmt(r[1], 2) }), el("td", { text: fmt(r[2], 2) + "%" }), el("td", { text: fmt(r[1] * r[2], 0) })]));
      });
      table.appendChild(tb);
      tableNote.textContent = ("Basic uses the initial distance " + st.ejDist + " and likelihood " + st.ejPct + "%. Each dynamic defense keeps one of those and computes the other from the crowding error. Units per 100 turns is distance × chance, the expected detour.");
    }
    resizers.push(draw);
    document.addEventListener("paperlevel", draw);
    draw();
    root.classList.add("w-ready");
  }

  /* ---------------------------------------------------------------- bar rows (demos 3 and 4) */

  // groups: [{ title, bars: [{ tech, value, mark, note }] }]
  function barRows(container, groups, max, unitNote) {
    container.innerHTML = "";
    groups.forEach(function (gr) {
      var g = el("div", { class: "ej-group" }, [el("p", { class: "ej-group-title", text: gr.title })]);
      gr.bars.forEach(function (b) {
        var track = el("span", { class: "ej-bar-track" });
        var pct = b.value == null ? 0 : Math.min(100, 100 * b.value / max);
        track.appendChild(el("span", { class: "ej-bar t-" + b.tech, style: "width:" + pct.toFixed(2) + "%" }));
        if (b.mark != null) track.appendChild(el("span", { class: "ej-bar-mark", style: "left:calc(" + Math.min(100, 100 * b.mark / max).toFixed(2) + "% - 1px)", title: "paper: " + b.mark.toFixed(2) + "%" }));
        var val = el("span", { class: "ej-bar-value", text: b.value == null ? "–" : b.value.toFixed(2) + "%" });
        if (b.note) val.appendChild(el("small", { text: b.note }));
        g.appendChild(el("div", { class: "ej-bar-row t-" + b.tech }, [el("span", { class: "ej-bar-label", text: X.TECH_LABEL[b.tech] }), track, val]));
      });
      container.appendChild(g);
    });
    if (unitNote) container.appendChild(el("p", { class: "w-note", text: unitNote }));
  }

  /* ---------------------------------------------------------------- demo 3: the paper's tables */

  function mountTables(root) {
    var st = { table: "t1", pick: { t1: 1, t2: 1, t3: 1 } };
    var tabSeg = segmented("Table", [{ value: "t1", label: "Table I" }, { value: "t2", label: "Table II" }, { value: "t3", label: "Table III" }],
      st.table, function (v) { st.table = v; build(); }, "");
    var pickWrap = el("div");
    var bars = el("div", { class: "ej-bars" });
    var title = el("p", { class: "w-note" });
    var means = el("div", { class: "ej-table-wrap", "data-levels": "grad res" });
    root.appendChild(el("div", { class: "w-actions" }, [tabSeg]));
    root.appendChild(pickWrap);
    root.appendChild(title);
    root.appendChild(bars);
    root.appendChild(means);

    function build() {
      var T = TABLES[st.table];
      pickWrap.innerHTML = "";
      var opts = T.rows.map(function (v, i) { return { value: i, label: T.rowText(v) }; });
      var seg = segmented(T.rowName, opts, st.pick[st.table], function (v) {
        st.pick[st.table] = +v;
        if (st.table === "t1") setShared("adv", ADVS[+v], "tables");
        draw();
      }, "seg-small");
      pickWrap.appendChild(controlRow(st.table === "t1" ? "Adversaries" : (st.table === "t2" ? "Ideal distance δ" : "Initial distance"), seg));
      draw();
    }
    function draw() {
      var T = TABLES[st.table], ri = st.pick[st.table];
      title.textContent = T.label + ", " + T.rowText(T.rows[ri]) + ". Lower is better: a smaller spacing error means the adversaries disrupted the ring less. Each value averages " + T.runs + " of the paper's 11,664 runs.";
      var groups = T.cols.map(function (cv, ci) {
        return { title: T.colText(cv), bars: TECHS.map(function (t) { return { tech: t.key, value: T.data[t.key][ri][ci] }; }) };
      });
      var max = st.table === "t2" ? 8 : 25;
      barRows(bars, groups, max);
      // grand means: each table averages the same 11,664 runs a different way
      means.innerHTML = "";
      var tbl = el("table", { class: "results-table ej-means" });
      tbl.appendChild(el("thead", null, [el("tr", null, [el("th", { text: "Defense" }), el("th", { text: "Table I mean" }), el("th", { text: "Table II mean" }), el("th", { text: "Table III mean" }), el("th", { text: "II ÷ I" })])]));
      var tb = el("tbody");
      TECHS.forEach(function (t) {
        var a = mean2(T1[t.key]), b = mean2(T2[t.key]), c = mean2(T3[t.key]);
        tb.appendChild(el("tr", null, [el("td", { text: t.label }), el("td", { text: fmt(a, 2) + "%" }), el("td", { text: fmt(b, 2) + "%" }), el("td", { text: fmt(c, 2) + "%" }), el("td", { text: fmt(b / a, 2) })]));
      });
      tbl.appendChild(tb);
      tbl.appendChild(el("caption", { text: "Computed by this page: the unweighted mean of each table's 12 or 9 cells. All three tables slice the same balanced design, so their means should agree." }));
      means.appendChild(tbl);
    }
    onShared("tables", function (key, value) {
      if (key === "adv") { st.pick.t1 = ADVS.indexOf(value); if (st.table === "t1") build(); }
    });
    st.pick.t1 = ADVS.indexOf(shared.adv);
    resizers.push(draw);
    build();
    root.classList.add("w-ready");
  }

  /* ---------------------------------------------------------------- demo 4: this page's sweep */

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

  function mountSweep(root, data) {
    var st = { table: "t1", pick: { t1: ADVS.indexOf(shared.adv), t2: 1, t3: 1 }, metric: "nn", running: null };
    var tabSeg = segmented("Table", [{ value: "t1", label: "Table I" }, { value: "t2", label: "Table II" }, { value: "t3", label: "Table III" }],
      st.table, function (v) { st.table = v; build(); }, "");
    var metricSeg = segmented("Reading of the metric", [{ value: "nn", label: "Nearest neighbor" }, { value: "ring", label: "Neighbors around the ring" }],
      st.metric, function (v) { st.metric = v; draw(); }, "seg-small");
    var pickWrap = el("div");
    var title = el("p", { class: "w-note" });
    var legend = el("div", { class: "c-legend w-mono" }, [el("span", { class: "lg lg-paper", text: "paper's value" }), el("span", { text: "bar: this page's simulation" })]);
    var bars = el("div", { class: "ej-bars" });
    var means = el("div", { class: "ej-table-wrap" });
    var runBtn = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "Run 12 here" });
    var runNote = el("span", { class: "w-mono", "aria-live": "polite" });
    var liveBox = el("div", { class: "ej-table-wrap" });
    root.appendChild(el("div", { class: "w-actions" }, [tabSeg]));
    root.appendChild(controlRow("Metric", metricSeg, "res"));
    root.appendChild(pickWrap);
    root.appendChild(title);
    root.appendChild(legend);
    root.appendChild(bars);
    root.appendChild(means);
    root.appendChild(el("div", { class: "w-actions" }, [runBtn, runNote]));
    root.appendChild(liveBox);

    function cell(table, tech, ri, ci) {
      if (!data) return null;
      var m = data[st.metric];
      return m && m[table] && m[table][tech] ? m[table][tech][ri][ci] : null;
    }
    function build() {
      var T = TABLES[st.table];
      pickWrap.innerHTML = "";
      var opts = T.rows.map(function (v, i) { return { value: i, label: T.rowText(v) }; });
      pickWrap.appendChild(controlRow(st.table === "t1" ? "Adversaries" : (st.table === "t2" ? "Ideal distance δ" : "Initial distance"),
        segmented(T.rowName, opts, st.pick[st.table], function (v) { st.pick[st.table] = +v; if (st.table === "t1") setShared("adv", ADVS[+v], "sweep"); draw(); }, "seg-small")));
      draw();
    }
    function draw() {
      var T = TABLES[st.table], ri = st.pick[st.table];
      if (!data) { bars.innerHTML = ""; title.textContent = "The precomputed sweep did not load; Run 12 here still works."; return; }
      title.textContent = "Simulated by this page: the paper's full 11,664-setting design, one run per setting (the paper also ran each setting once), " + T.rowText(T.rows[ri]) +
        ". Each bar averages " + T.runs + " runs; " + data.nulls + " of 11,664 runs never settled and are left out. The tick marks the paper's value for the same cell.";
      var groups = T.cols.map(function (cv, ci) {
        return { title: T.colText(cv), bars: TECHS.map(function (t) { return { tech: t.key, value: cell(st.table, t.key, ri, ci), mark: T.data[t.key][ri][ci] }; }) };
      });
      var max = 25;
      groups.forEach(function (g) { g.bars.forEach(function (b) { if (b.value != null && b.value > max) max = b.value; }); });
      max = Math.ceil(max / 5) * 5;
      barRows(bars, groups, max);
      means.innerHTML = "";
      var tbl = el("table", { class: "results-table ej-means" });
      tbl.appendChild(el("thead", null, [el("tr", null, [el("th", { text: "Defense" }), el("th", { text: "Paper, Table I mean" }), el("th", { text: "This page, all runs" }), el("th", { text: "This page, 32 and 64 agents" })])]));
      var tb = el("tbody");
      TECHS.forEach(function (t) {
        var g = data[st.metric].grand[t.key];
        tb.appendChild(el("tr", null, [el("td", { text: t.label }), el("td", { text: fmt(mean2(T1[t.key]), 2) + "%" }), el("td", { text: fmt(g.all, 2) + "%" }), el("td", { text: fmt(g.large, 2) + "%" })]));
      });
      tbl.appendChild(tb);
      tbl.appendChild(el("caption", { text: "Simulated by this page (" + (st.metric === "ring" ? "neighbors around the ring" : "nearest neighbor") + " reading); the paper's column is the mean of its Table I." }));
      means.appendChild(tbl);
    }

    runBtn.addEventListener("click", function () {
      if (st.running) return;
      var jobs = [], rows = {};
      TECHS.forEach(function (t) {
        rows[t.key] = [];
        for (var k = 0; k < 3; k++) {
          (function (tech, seed) {
            jobs.push(function () {
              var r = X.runExperiment({ n: shared.n, adversaries: shared.adv, delta: 16, epsilon: 4, r: 20, ejection: tech, ejDist: 5, ejPct: 8, seed: seed });
              return { tech: tech, r: r };
            });
          })(t.key, randomSeed());
        }
      });
      runBtn.disabled = true;
      runNote.textContent = "running 0 of 12";
      st.running = runChunked(jobs, function (i, res) {
        rows[res.tech].push(res.r);
        runNote.textContent = "running " + (i + 1) + " of 12";
      }, function () {
        st.running = null;
        runBtn.disabled = false;
        runNote.textContent = "done: " + shared.n + " agents, " + shared.adv + " adversaries, δ = 16, ε = 4, r = 20°, three runs per defense";
        liveBox.innerHTML = "";
        var tbl = el("table", { class: "results-table ej-now" });
        tbl.appendChild(el("thead", null, [el("tr", null, [el("th", { text: "Defense" }), el("th", { text: "Nearest neighbor" }), el("th", { text: "Ring neighbors" }), el("th", { text: "Paper, Table I" })])]));
        var tb = el("tbody");
        TECHS.forEach(function (t) {
          var ok = rows[t.key].filter(Boolean);
          function avg(f) { return ok.length ? ok.reduce(function (s, r) { return s + r[f]; }, 0) / ok.length : null; }
          tb.appendChild(el("tr", null, [el("td", { text: t.label }), el("td", { text: fmt(avg("error"), 1) + "%" }), el("td", { text: fmt(avg("ringError"), 1) + "%" }),
            el("td", { text: fmt(T1[t.key][ADVS.indexOf(shared.adv)][POPS.indexOf(shared.n)], 2) + "%" })]));
        });
        tbl.appendChild(tb);
        tbl.appendChild(el("caption", { text: "Simulated on your device, three runs per defense with new seeds; the paper's column averages 243 runs over every δ, ε, r, distance, and likelihood." }));
        liveBox.appendChild(tbl);
      });
    });
    onShared("sweep", function (key, value) {
      if (key === "adv") { st.pick.t1 = ADVS.indexOf(value); if (st.table === "t1") build(); }
    });
    resizers.push(draw);
    build();
    root.classList.add("w-ready");
  }

  /* ---------------------------------------------------------------- mount */

  function start() {
    var f = document.getElementById("ej-field"); if (f) mountField(f);
    var r = document.getElementById("ej-rules"); if (r) mountRules(r);
    var t = document.getElementById("ej-tables"); if (t) mountTables(t);
    var s = document.getElementById("ej-sweep");
    if (s) {
      fetch(SCRIPT_BASE + "ej-data.json").then(function (res) { return res.ok ? res.json() : null; })
        .catch(function () { return null; })
        .then(function (data) { mountSweep(s, data); });
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();

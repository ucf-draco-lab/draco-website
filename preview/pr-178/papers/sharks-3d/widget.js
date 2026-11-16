/*
  SHARKS 3-D widget for /papers/sharks-3d/.
  Mount points in the page: #s3-swarm, #s3-rule, #s3-levels, #s3-avg.
  Demos 1 and 3 run the 3-D engine (sharks3d-engine.js) live. Demo 2 draws one
  agent's Dispersion Rule. Demo 4 draws the magazine's reported averages beside
  this page's simulated averages, from sharks3d-data.json (8,960 runs made with
  the same engine in Node) or from a rerun in the visitor's browser.
*/
(function () {
  "use strict";

  var E = window.Sharks3D;
  var SVGNS = "http://www.w3.org/2000/svg";
  var SCRIPT_BASE = (document.currentScript && document.currentScript.src || "").replace(/[^/]*$/, "");
  var DEG = Math.PI / 180;

  /* ---------------------------------------------------------------- the magazine's numbers */

  // Wolf, Cooley, Fantl, and Borowczak, IEEE CE Magazine 2020, "SHARK Swarms in 3-D Fields".
  // Average epochs to complete stability. Random, linear, and collinear are reported together as "13 to 14".
  var MAG = {
    place: { "box-center": 1.8, "box-face": 2.7, "box-edge": 8.7, "box-corner": 14.7, random: "13–14", linear: "13–14", collinear: "13–14" },
    n: { 4: 6.6, 32: 12.2 },
    t: {},
    r: { 0: 11.5, 20: 7.9 },
    delta: { 8: 13.2, 12: 6.2 },
    c: { 2: 14.2, 3: 5.2 },
    d: { 2: 5.8, 3: 13.6 }
  };
  var PLACES = [
    { value: "box-center", label: "Box, center" }, { value: "box-face", label: "Box, face" },
    { value: "box-edge", label: "Box, edge" }, { value: "box-corner", label: "Box, corner" },
    { value: "random", label: "Random" }, { value: "linear", label: "Line" }, { value: "collinear", label: "Line through target" }
  ];
  var FACTORS = [
    { key: "place", label: "Start", name: function (v) { for (var i = 0; i < PLACES.length; i++) if (PLACES[i].value === v) return PLACES[i].label; return v; } },
    { key: "n", label: "Agents", name: function (v) { return v + " agents"; } },
    { key: "r", label: "Turn r", name: function (v) { return "r = " + v + "°"; } },
    { key: "t", label: "Tilt t", name: function (v) { return "t = " + v + "°"; } },
    { key: "delta", label: "Distance δ", name: function (v) { return "δ = " + v; } },
    { key: "c", label: "Center step c", name: function (v) { return "c = " + v; } },
    { key: "d", label: "Dispersion step d", name: function (v) { return "d = " + v; } }
  ];

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
  function fmt(v, digits) { return v === null || v === undefined || v !== v ? "–" : (+v).toFixed(digits == null ? 1 : digits); }

  function segmented(label, options, value, onChange, extra) {
    var wrap = el("div", { class: "seg" + (extra ? " " + extra : ""), role: "radiogroup", "aria-label": label });
    var buttons = options.map(function (opt) {
      var b = el("button", { type: "button", class: "seg-option", role: "radio", "data-value": String(opt.value), text: opt.label });
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
    return el("div", { class: "s3-row", "data-levels": levels || null }, [el("span", { class: "s3-row-label", text: label }), control]);
  }
  function sliderRow(id, label, min, max, step, value, onInput) {
    var input = el("input", { type: "range", id: id, min: String(min), max: String(max), step: String(step), value: String(value) });
    var out = el("output", { for: id, text: value + "°" });
    input.addEventListener("input", function () { out.textContent = input.value + "°"; onInput(+input.value); });
    return el("div", { class: "w-range" }, [el("label", { for: id, text: label }), input, out]);
  }
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

  function placeOpts(v) {
    if (v.indexOf("box-") === 0) return { init: "box", box: v.slice(4) };
    return { init: v };
  }

  /* ---------------------------------------------------------------- the 3-D field (canvas) */

  function View3D(root, label) {
    this.canvas = el("canvas", { class: "s3-canvas", role: "img", "aria-label": label });
    this.ctx = this.canvas.getContext("2d");
    this.colors = themeColors();
    this.yaw = 35 * DEG;
    this.pitch = 22 * DEG;
    root.appendChild(this.canvas);
    var self = this, drag = null;
    themeListeners.push(function () { self.colors = themeColors(); if (self.onchange) self.onchange(); });
    this.canvas.addEventListener("pointerdown", function (e) {
      drag = { x: e.clientX, y: e.clientY, yaw: self.yaw, pitch: self.pitch };
      self.canvas.setPointerCapture(e.pointerId);
    });
    this.canvas.addEventListener("pointermove", function (e) {
      if (!drag) return;
      self.yaw = drag.yaw + (e.clientX - drag.x) * 0.01;
      self.pitch = Math.max(-1.45, Math.min(1.45, drag.pitch + (e.clientY - drag.y) * 0.01));
      if (self.onchange) self.onchange();
    });
    function end() { drag = null; }
    this.canvas.addEventListener("pointerup", end);
    this.canvas.addEventListener("pointercancel", end);
  }
  // world (x, y, z), z up, to screen: rotate about z by yaw, tilt by pitch
  View3D.prototype.project = function (x, y, z) {
    var cy = Math.cos(this.yaw), sy = Math.sin(this.yaw), cp = Math.cos(this.pitch), sp = Math.sin(this.pitch);
    var X = x * cy - y * sy, Y = x * sy + y * cy;
    return { sx: X, sy: -(z * cp - Y * sp), depth: Y * cp + z * sp };
  };
  View3D.prototype.draw = function (s) {
    var c = this.colors, canvas = this.canvas, ctx = this.ctx;
    var cssW = Math.min(canvas.parentNode.clientWidth || 420, 480);
    var dpr = window.devicePixelRatio || 1;
    var size = Math.round(cssW * dpr);
    if (canvas.width !== size) { canvas.width = size; canvas.height = size; }
    canvas.style.width = cssW + "px";
    canvas.style.height = cssW + "px";
    var view = s.M * 1.25, scale = size / (2 * view), self = this;
    function P(x, y, z) { var p = self.project(x, y, z); return { x: size / 2 + p.sx * scale, y: size / 2 + p.sy * scale, d: p.depth }; }
    ctx.fillStyle = c.alt;
    ctx.fillRect(0, 0, size, size);
    // field cube
    var M = s.M + 0.5, corners = [], i;
    for (i = 0; i < 8; i++) corners.push(P(i & 1 ? M : -M, i & 2 ? M : -M, i & 4 ? M : -M));
    ctx.strokeStyle = c.light;
    ctx.lineWidth = dpr;
    [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]].forEach(function (e) {
      ctx.beginPath(); ctx.moveTo(corners[e[0]].x, corners[e[0]].y); ctx.lineTo(corners[e[1]].x, corners[e[1]].y); ctx.stroke();
    });
    // shell: outer silhouette disc, and the ideal sphere as rings
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = c.light;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, (s.delta + s.epsilon) * scale, 0, 2 * Math.PI);
    ctx.arc(size / 2, size / 2, Math.max(0, s.delta - s.epsilon) * scale, 0, 2 * Math.PI, true);
    ctx.fill();
    ctx.globalAlpha = 1;
    function ring(fn) {
      ctx.beginPath();
      for (var k = 0; k <= 72; k++) {
        var a = k / 72 * 2 * Math.PI, q = fn(a), p = P(q[0], q[1], q[2]);
        if (k === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
    }
    var R = s.delta;
    ctx.setLineDash([3 * dpr, 4 * dpr]);
    ctx.strokeStyle = c.gray;
    ring(function (a) { return [R * Math.cos(a), R * Math.sin(a), 0]; });
    ring(function (a) { return [R * Math.cos(a), 0, R * Math.sin(a)]; });
    ring(function (a) { return [0, R * Math.cos(a), R * Math.sin(a)]; });
    ctx.setLineDash([]);
    // target
    var t0 = P(0, 0, 0);
    ctx.fillStyle = c.text;
    ctx.beginPath(); ctx.arc(t0.x, t0.y, 3.5 * dpr, 0, 2 * Math.PI); ctx.fill();
    // agents, far to near
    var list = s.agents.map(function (a) {
      var x = s.wdelta(a.x), y = s.wdelta(a.y), z = s.wdelta(a.z);
      return { a: a, p: P(x, y, z), inside: s.inShell(a), x: x, y: y, z: z };
    });
    list.sort(function (u, v) { return u.p.d - v.p.d; });
    list.forEach(function (o) {
      var r = Math.max(2.2 * dpr, (0.38 + 0.012 * o.p.d) * scale);
      // drop line to the target's plane, faint, so height reads
      var base = P(o.x, o.y, 0);
      ctx.strokeStyle = c.light;
      ctx.lineWidth = dpr;
      ctx.beginPath(); ctx.moveTo(o.p.x, o.p.y); ctx.lineTo(base.x, base.y); ctx.stroke();
      ctx.fillStyle = o.inside ? c.primary : c.text;
      ctx.beginPath(); ctx.arc(o.p.x, o.p.y, r, 0, 2 * Math.PI); ctx.fill();
      ctx.strokeStyle = c.alt;
      ctx.stroke();
    });
  };

  /* ---------------------------------------------------------------- small share-over-time chart */

  function shareChart(host, series, opts) {
    // series: [{ pts: [share per epoch], cls, label }], marks at 68, 95, 100 percent
    host.innerHTML = "";
    var W = chartWidth(host), H = opts.height || 190, L = 42, Rr = 12, T = 10, B = 30;
    var maxE = opts.maxEpoch || 1;
    series.forEach(function (s) { maxE = Math.max(maxE, s.pts.length - 1); });
    var root = svg("svg", { class: "s3-svg", viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": opts.label });
    function X(e) { return L + (W - L - Rr) * e / maxE; }
    function Y(v) { return T + (H - T - B) * (1 - v); }
    [0.68, 0.95, 1].forEach(function (v) {
      root.appendChild(svg("line", { x1: L, x2: W - Rr, y1: Y(v), y2: Y(v), class: "c-grid" }));
      var dy = v === 1 ? -1 : v === 0.95 ? 10 : 4;
      root.appendChild(svg("text", { x: L - 6, y: Y(v) + dy, "text-anchor": "end", class: "c-tick" }, Math.round(v * 100) + "%"));
    });
    root.appendChild(svg("line", { x1: L, x2: W - Rr, y1: Y(0), y2: Y(0), class: "c-grid" }));
    root.appendChild(svg("text", { x: L - 6, y: Y(0) + 4, "text-anchor": "end", class: "c-tick" }, "0%"));
    var step = maxE > 150 ? 50 : maxE > 60 ? 20 : maxE > 25 ? 10 : 5;
    for (var e = 0; e <= maxE; e += step) root.appendChild(svg("text", { x: X(e), y: H - 12, "text-anchor": "middle", class: "c-tick" }, String(e)));
    root.appendChild(svg("text", { x: W - Rr, y: H - 1, "text-anchor": "end", class: "c-label" }, "epoch"));
    series.forEach(function (s) {
      if (!s.pts.length) return;
      var d = s.pts.map(function (v, i) { return (i ? "L" : "M") + X(i).toFixed(1) + " " + Y(v).toFixed(1); }).join(" ");
      root.appendChild(svg("path", { d: d, class: "s3-line " + s.cls }));
    });
    host.appendChild(root);
  }

  /* ---------------------------------------------------------------- demo 1: the swarm */

  function mountSwarm(root) {
    var st = { place: "random", n: 16, delta: 8, cd: "2:2", r: 20, t: 10, seed: 1, playing: false, spin: true, raf: null, visible: true, history: [] };
    var s;
    var stage = el("div", { class: "s3-stage" }), side = el("div", { class: "s3-side" });
    var view = new View3D(stage, "A SHARKS swarm around a target in three dimensions; drag to turn the view");
    stage.appendChild(el("p", { class: "w-note s3-key" }, [
      el("span", { class: "s3-k s3-k-out", text: "outside the shell" }), " ",
      el("span", { class: "s3-k s3-k-in", text: "inside the shell" }), " ",
      el("span", { class: "s3-k s3-k-ring", text: "ideal sphere, distance δ" })
    ]));
    stage.appendChild(el("p", { class: "w-mono", text: "Drag the field to turn it." }));

    var playBtn = el("button", { type: "button", class: "w-btn", text: "Play" });
    var stepBtn = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "Step" });
    var newBtn = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "New start" });
    var spinSeg = segmented("Turn the view", [{ value: true, label: "Spin" }, { value: false, label: "Hold" }], true, function (v) { st.spin = v; draw(); }, "seg-small");
    side.appendChild(el("div", { class: "w-actions" }, [playBtn, stepBtn, newBtn, spinSeg]));

    side.appendChild(controlRow("Start", segmented("Start", PLACES, st.place, function (v) { st.place = v; reset(); }, "seg-small")));
    side.appendChild(controlRow("Agents", segmented("Agents", [4, 8, 16, 32].map(function (v) { return { value: v, label: String(v) }; }), st.n, function (v) { st.n = v; reset(); }, "seg-small")));
    side.appendChild(controlRow("Distance δ", segmented("Ideal distance", [{ value: 8, label: "8" }, { value: 12, label: "12" }], st.delta, function (v) { st.delta = v; reset(); }, "seg-small")));
    side.appendChild(controlRow("Steps c : d", segmented("Center step to dispersion step", [
      { value: "3:2", label: "3 : 2" }, { value: "2:2", label: "2 : 2" }, { value: "3:3", label: "3 : 3" }, { value: "2:3", label: "2 : 3" }
    ], st.cd, function (v) { st.cd = v; reset(); }, "seg-small")));
    side.appendChild(controlRow("Turn r", segmented("Rotation", [{ value: 0, label: "0°" }, { value: 20, label: "20°" }], st.r, function (v) { st.r = v; reset(); }, "seg-small")));
    side.appendChild(controlRow("Tilt t", segmented("Tilt", [0, 10, 20, 30].map(function (v) { return { value: v, label: v + "°" }; }), st.t, function (v) { st.t = v; reset(); }, "seg-small")));

    var big = el("p", { class: "w-big", "aria-live": "polite" });
    var levels = el("p", { class: "w-mono" });
    side.appendChild(big);
    side.appendChild(levels);
    var chartHost = el("div", { class: "s3-chart" });
    var note = el("p", { class: "w-note", text: "Share of agents inside the shell δ ± 4 at each epoch, this run (simulated on this page)." });

    root.appendChild(el("div", { class: "s3-split" }, [stage, side]));
    root.appendChild(chartHost);
    root.appendChild(note);
    root.classList.add("w-ready");

    function reset() {
      var cd = st.cd.split(":");
      s = new E.Swarm(Object.assign({ dims: 3, n: st.n, delta: st.delta, epsilon: 4, c: +cd[0], d: +cd[1], r: st.r, t: st.t, seed: st.seed }, placeOpts(st.place)));
      st.history = [s.share()];
      draw();
    }
    function readout() {
      var pct = Math.round(100 * s.share());
      big.innerHTML = "";
      big.appendChild(document.createTextNode("Epoch " + s.ticks + " · "));
      big.appendChild(el("strong", { text: pct + "%" }));
      big.appendChild(document.createTextNode(" in the shell" + (s.reached[100] >= 0 ? " · stable" : "")));
      function lv(k) { return s.reached[k] >= 0 ? String(s.reached[k]) : "–"; }
      levels.textContent = "Epochs to 68% " + lv(68) + " · to 95% " + lv(95) + " · to 100% " + lv(100) + " · seed " + st.seed;
    }
    function draw() {
      view.draw(s);
      readout();
      shareChart(chartHost, [{ pts: st.history, cls: "s3-s1" }], { label: "Share of agents in the shell by epoch", maxEpoch: 40, height: 150 });
    }
    view.onchange = function () { view.draw(s); };
    function stepOnce() { s.step(false); st.history.push(s.share()); }
    var lastStep = 0;
    function loop(ts) {
      st.raf = null;
      if (!st.visible) return;
      if (st.playing && ts - lastStep > 160) {
        stepOnce(); lastStep = ts;
        if (s.reached[100] >= 0 && s.ticks > s.reached[100] + 25) { st.playing = false; playBtn.textContent = "Play"; playBtn.classList.remove("running"); }
        draw();
      }
      if (st.spin) { view.yaw += 0.004; view.draw(s); }
      if (st.playing || st.spin) st.raf = requestAnimationFrame(loop);
    }
    function kick() { if (!st.raf && st.visible) st.raf = requestAnimationFrame(loop); }
    playBtn.addEventListener("click", function () {
      st.playing = !st.playing;
      playBtn.textContent = st.playing ? "Pause" : "Play";
      playBtn.classList.toggle("running", st.playing);
      kick();
    });
    stepBtn.addEventListener("click", function () { stepOnce(); draw(); });
    newBtn.addEventListener("click", function () { st.seed = 1 + Math.floor(Math.random() * 999999); reset(); });
    spinSeg.addEventListener("click", kick);
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) { st.visible = entries[0].isIntersecting; if (st.visible) kick(); }).observe(root);
    }
    resizers.push(draw);
    reset();
    kick();
  }

  /* ---------------------------------------------------------------- demo 2: one agent's rule */

  function mountRule(root) {
    var st = { r: 20, t: 10, above: true, nb: 60 };
    var host = el("div", { class: "s3-rule" });
    var readout = el("p", { class: "w-mono", "aria-live": "polite" });
    root.appendChild(sliderRow("s3-rule-r", "Turn r", 0, 60, 5, st.r, function (v) { st.r = v; draw(); }));
    root.appendChild(sliderRow("s3-rule-t", "Tilt t", 0, 45, 5, st.t, function (v) { st.t = v; draw(); }));
    root.appendChild(controlRow("This agent is", segmented("Agent height", [{ value: true, label: "above the target" }, { value: false, label: "below the target" }], true, function (v) { st.above = v; draw(); }, "seg-small")));
    root.appendChild(host);
    root.appendChild(readout);
    root.classList.add("w-ready");

    function arrow(g, x1, y1, x2, y2, cls) {
      g.appendChild(svg("line", { x1: x1, y1: y1, x2: x2, y2: y2, class: cls }));
      var a = Math.atan2(y2 - y1, x2 - x1), h = 8;
      g.appendChild(svg("path", { d: "M" + x2 + " " + y2 + " L" + (x2 - h * Math.cos(a - 0.4)) + " " + (y2 - h * Math.sin(a - 0.4)) + " L" + (x2 - h * Math.cos(a + 0.4)) + " " + (y2 - h * Math.sin(a + 0.4)) + " Z", class: cls + "-head" }));
    }
    function draw() {
      host.innerHTML = "";
      var W = chartWidth(host), half = W / 2, H = 220, R = Math.min(80, half / 2 - 10);
      var root2 = svg("svg", { class: "s3-svg", viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": "Top view and side view of one agent's Dispersion Rule" });
      // top view
      var g = svg("g", {}), cx = half / 2, cy = 112;
      g.appendChild(svg("text", { x: cx, y: 14, "text-anchor": "middle", class: "c-label" }, "From above: compass heading"));
      g.appendChild(svg("circle", { cx: cx, cy: cy, r: R, class: "s3-compass" }));
      g.appendChild(svg("text", { x: cx, y: cy - R - 4, "text-anchor": "middle", class: "c-tick" }, "N"));
      var nbA = st.nb * DEG;
      var nx = cx + 0.62 * R * Math.sin(nbA), ny = cy - 0.62 * R * Math.cos(nbA);
      arrow(g, cx, cy, nx, ny, "s3-ar-nb");
      g.appendChild(svg("circle", { cx: nx, cy: ny, r: 6, class: "s3-nb" }));
      var away = (st.nb + 180) * DEG, dest = (st.nb + 180 + st.r) * DEG;
      g.appendChild(svg("line", { x1: cx, y1: cy, x2: cx + R * Math.sin(away), y2: cy - R * Math.cos(away), class: "s3-ar-away" }));
      arrow(g, cx, cy, cx + R * Math.sin(dest), cy - R * Math.cos(dest), "s3-ar-dest");
      g.appendChild(svg("circle", { cx: cx, cy: cy, r: 5, class: "s3-me" }));
      g.appendChild(svg("text", { x: cx, y: H - 4, "text-anchor": "middle", class: "c-tick" }, "neighbor at " + st.nb + "° · go " + ((st.nb + 180 + st.r) % 360) + "°"));
      root2.appendChild(g);
      // side view
      var g2 = svg("g", {}), x0 = half + 30, y0 = 112, len = Math.min(half - 70, 150);
      g2.appendChild(svg("text", { x: half + half / 2, y: 14, "text-anchor": "middle", class: "c-label" }, "From the side: nose tilt"));
      var ty = st.above ? y0 + 62 : y0 - 62;
      g2.appendChild(svg("line", { x1: half + 10, x2: W - 10, y1: ty, y2: ty, class: "c-grid" }));
      g2.appendChild(svg("circle", { cx: half + 22, cy: ty, r: 5, class: "s3-target" }));
      g2.appendChild(svg("text", { x: half + 32, y: ty + (st.above ? 16 : -8), class: "c-tick" }, "target's height"));
      g2.appendChild(svg("line", { x1: x0, x2: x0 + len, y1: y0, y2: y0, class: "s3-ar-away" }));
      var p = (st.above ? -st.t : st.t) * DEG;
      arrow(g2, x0, y0, x0 + len * Math.cos(p), y0 - len * Math.sin(p), "s3-ar-dest");
      g2.appendChild(svg("circle", { cx: x0, cy: y0, r: 5, class: "s3-me" }));
      g2.appendChild(svg("text", { x: x0 + len + 4, y: y0 - 6, class: "c-tick" }, "level"));
      root2.appendChild(g2);
      host.appendChild(root2);
      var d = 3, horiz = d * Math.cos(st.t * DEG), vert = d * Math.sin(st.t * DEG);
      readout.textContent = "A 3-unit dispersion step moves " + horiz.toFixed(2) + " units across and " + vert.toFixed(2) + " units " + (st.t === 0 ? "up or down" : st.above ? "down" : "up") + ". The " + st.r + "° turn sends " + (Math.sin(st.r * DEG) * horiz).toFixed(2) + " units of it sideways, around the target.";
    }
    resizers.push(draw);
    draw();
  }

  /* ---------------------------------------------------------------- demo 3: 68, 95, 100 */

  function mountLevels(root) {
    var st = { place: "random", runs: 25, cap: 120, busy: false };
    var POPS = [4, 8, 16, 32], CLS = ["s3-s1", "s3-s2", "s3-s3", "s3-s4"];
    var runBtn = el("button", { type: "button", class: "w-btn", text: "Run 100 swarms" });
    var status = el("span", { class: "w-mono", "aria-live": "polite" });
    root.appendChild(controlRow("Start", segmented("Start", PLACES, st.place, function (v) { st.place = v; }, "seg-small")));
    root.appendChild(el("div", { class: "w-actions" }, [runBtn, status]));
    var chartHost = el("div", { class: "s3-chart" });
    var legend = el("p", { class: "c-legend w-mono" });
    POPS.forEach(function (n, i) { legend.appendChild(el("span", { class: "lg s3-lg " + CLS[i], text: n + " agents" })); });
    var table = el("div", { class: "s3-table-wrap" });
    var note = el("p", { class: "w-note" });
    root.appendChild(chartHost);
    root.appendChild(legend);
    root.appendChild(table);
    root.appendChild(note);
    root.classList.add("w-ready");

    function run() {
      if (st.busy) return;
      st.busy = true;
      runBtn.classList.add("running");
      var results = POPS.map(function () { return { sum: [], cnt: [], e: { 68: [], 95: [], 100: [] }, never: 0 }; });
      var jobs = [];
      POPS.forEach(function (n, pi) { for (var k = 0; k < st.runs; k++) jobs.push({ pi: pi, n: n, seed: 1 + k }); });
      var j = 0;
      function chunk() {
        var t0 = performance.now();
        while (j < jobs.length && performance.now() - t0 < 30) {
          var job = jobs[j++], res = results[job.pi];
          var s = new E.Swarm(Object.assign({ dims: 3, n: job.n, delta: 8, epsilon: 4, c: 2, d: 2, r: 20, t: 10, seed: job.seed }, placeOpts(st.place)));
          var sh = s.share();
          for (var e = 0; e <= st.cap; e++) {
            if (e > 0) { s.step(false); sh = s.share(); }
            res.sum[e] = (res.sum[e] || 0) + sh; res.cnt[e] = (res.cnt[e] || 0) + 1;
          }
          [68, 95, 100].forEach(function (k) { if (s.reached[k] >= 0) res.e[k].push(s.reached[k]); });
          if (s.reached[100] < 0) res.never++;
        }
        status.textContent = j + " of " + jobs.length + " swarms";
        if (j < jobs.length) { setTimeout(chunk, 0); return; }
        st.busy = false;
        runBtn.classList.remove("running");
        show(results);
      }
      chunk();
    }
    function mean(a) { return a.length ? a.reduce(function (x, y) { return x + y; }, 0) / a.length : NaN; }
    function show(results) {
      var maxE = 0;
      var series = results.map(function (res, i) {
        var pts = res.sum.map(function (v, e) { return v / res.cnt[e]; });
        var last = 0;
        for (var e = 0; e < pts.length; e++) if (pts[e] < 0.999) last = e;
        maxE = Math.max(maxE, last + 3);
        return { pts: pts, cls: CLS[i] };
      });
      maxE = Math.min(st.cap, Math.max(20, maxE));
      series.forEach(function (s) { s.pts = s.pts.slice(0, maxE + 1); });
      shareChart(chartHost, series, { label: "Average share of agents in the shell by epoch, four population sizes", maxEpoch: maxE });
      table.innerHTML = "";
      var tb = el("tbody");
      results.forEach(function (res, i) {
        tb.appendChild(el("tr", {}, [
          el("td", { text: POPS[i] + " agents" }),
          el("td", { text: fmt(mean(res.e[68])) }), el("td", { text: fmt(mean(res.e[95])) }), el("td", { text: fmt(mean(res.e[100])) }),
          el("td", { text: String(res.never) })
        ]));
      });
      table.appendChild(el("table", { class: "results-table", style: "min-width: 420px" }, [
        el("thead", {}, [el("tr", {}, ["Population", "to 68%", "to 95%", "to 100%", "never by " + st.cap].map(function (h) { return el("th", { text: h }); }))]),
        tb
      ]));
      note.textContent = "Simulated on this page: " + st.runs + " swarms per population, random seeds 1 to " + st.runs + ", averaged over the swarms that reached each level (δ = 8, ε = 4, c : d = 2 : 2, r = 20°, t = 10°). The magazine reports averages over its whole experiment set: 6.6 epochs to 100% for 4 agents and 12.2 for 32.";
      resizers.push(function () { shareChart(chartHost, series, { label: "Average share of agents in the shell by epoch", maxEpoch: maxE }); });
    }
    runBtn.addEventListener("click", run);
    // run once when the demo first scrolls into view
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) { if (entries[0].isIntersecting) { io.disconnect(); run(); } });
      io.observe(root);
    } else run();
  }

  /* ---------------------------------------------------------------- demo 4: the magazine's averages */

  function mountAverages(root) {
    var st = { factor: "place", data: null, mine: null, busy: false };
    var seg = segmented("Experiment", FACTORS.map(function (f) { return { value: f.key, label: f.label }; }), st.factor, function (v) { st.factor = v; draw(); }, "seg-small");
    root.appendChild(controlRow("Compare by", seg));
    root.appendChild(el("p", { class: "s3-key w-mono" }, [el("span", { class: "s3-k s3-k-mag", text: "magazine" }), " ", el("span", { class: "s3-k s3-k-page", text: "this page (simulated)" })]));
    var bars = el("div", { class: "s3-bars" });
    var note = el("p", { class: "w-note" });
    var rerun = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "Rerun all 1,792 settings in your browser" });
    var status = el("span", { class: "w-mono", "aria-live": "polite" });
    root.appendChild(bars);
    root.appendChild(el("div", { class: "w-actions", "data-levels": "grad res" }, [rerun, status]));
    root.appendChild(note);
    root.classList.add("w-ready");

    fetch(SCRIPT_BASE + "sharks3d-data.json").then(function (r) { return r.json(); }).then(function (d) { st.data = d; draw(); })
      .catch(function () { bars.textContent = "The precomputed results did not load."; });

    function draw() {
      if (!st.data) return;
      var f = FACTORS.filter(function (x) { return x.key === st.factor; })[0];
      var rows = st.mine ? st.mine[st.factor] : st.data.factors[st.factor];
      var maxV = 1;
      rows.forEach(function (r) {
        var m = MAG[st.factor][r.level];
        maxV = Math.max(maxV, r.e100 || 0, typeof m === "number" ? m : 14);
      });
      bars.innerHTML = "";
      rows.forEach(function (r) {
        var m = MAG[st.factor][r.level];
        var mNum = typeof m === "number" ? m : (m ? 13.5 : null);
        var row = el("div", { class: "s3-bar-row" });
        row.appendChild(el("span", { class: "s3-bar-label", text: f.name(r.level) }));
        var tracks = el("span", { class: "s3-bar-tracks" });
        var t1 = el("span", { class: "s3-bar-track" });
        if (mNum !== null) t1.appendChild(el("span", { class: "s3-bar s3-bar-mag", style: "width:" + (100 * mNum / maxV).toFixed(1) + "%" }));
        else t1.appendChild(el("span", { class: "s3-bar-none", text: "not reported" }));
        var t2 = el("span", { class: "s3-bar-track" }, [el("span", { class: "s3-bar s3-bar-page", style: "width:" + (100 * r.e100 / maxV).toFixed(1) + "%" })]);
        tracks.appendChild(t1); tracks.appendChild(t2);
        row.appendChild(tracks);
        row.appendChild(el("span", { class: "s3-bar-value" }, [
          el("span", { class: "s3-mag", text: m == null ? "–" : (typeof m === "number" ? fmt(m) : m) }),
          el("span", { class: "s3-page", text: fmt(r.e100) })
        ]));
        row.appendChild(el("span", { class: "s3-bar-sim", "data-levels": "ug grad res", text: r.stable + " of " + r.runs + " stable" }));
        bars.appendChild(row);
      });
      var src = st.mine ? "your browser's rerun (one run per setting, " + st.mine.runs + " runs)" : "this page's precomputed sweep (" + st.data.settings.toLocaleString("en-US") + " settings, five runs each, " + st.data.runs.toLocaleString("en-US") + " runs)";
      note.textContent = "Upper bar: the magazine's average epochs to complete stability. Lower bar: " + src + ", averaged over the runs that became stable within " + st.data.cap + " epochs. The magazine reports random, line, and line-through-target starts together as 13 to 14 epochs, and it reports no averages for tilt or for 8 and 16 agents. Simulated values come from a reconstruction with a fitted field size; they are this page's, not the authors'.";
    }

    rerun.addEventListener("click", function () {
      if (st.busy) return;
      st.busy = true;
      rerun.classList.add("running");
      var code = "importScripts(" + JSON.stringify(SCRIPT_BASE + "sharks3d-engine.js") + ");" +
        "onmessage=function(){var P=[['random','center'],['linear','center'],['collinear','center'],['box','corner'],['box','edge'],['box','face'],['box','center']],rows=[],last=Date.now(),total=7*4*4*2*2*2*2;" +
        "P.forEach(function(p){[4,8,16,32].forEach(function(n){[0,10,20,30].forEach(function(t){[0,20].forEach(function(r){[8,12].forEach(function(dl){[2,3].forEach(function(c){[2,3].forEach(function(d){" +
        "var o=Sharks3D.run({dims:3,n:n,init:p[0],box:p[1],t:t,r:r,delta:dl,epsilon:4,c:c,d:d,seed:7},400);rows.push([p[0]==='box'?'box-'+p[1]:p[0],n,t,r,dl,c,d,o.e100]);" +
        "if(Date.now()-last>180){last=Date.now();postMessage({progress:rows.length,total:total});}});});});});});});});postMessage({rows:rows});};";
      var worker;
      try { worker = new Worker(URL.createObjectURL(new Blob([code], { type: "text/javascript" }))); }
      catch (err) { status.textContent = "This browser could not start a worker."; st.busy = false; return; }
      worker.onmessage = function (e) {
        if (e.data.progress) { status.textContent = e.data.progress + " of " + e.data.total + " settings"; return; }
        var rows = e.data.rows, out = { runs: rows.length };
        var idx = { place: 0, n: 1, t: 2, r: 3, delta: 4, c: 5, d: 6 };
        FACTORS.forEach(function (f) {
          out[f.key] = st.data.factors[f.key].map(function (ref) {
            var sel = rows.filter(function (x) { return x[idx[f.key]] === ref.level; });
            var ok = sel.filter(function (x) { return x[7] >= 0; });
            return { level: ref.level, runs: sel.length, stable: ok.length, e100: mean(ok.map(function (x) { return x[7]; })) };
          });
        });
        st.mine = out;
        st.busy = false;
        rerun.classList.remove("running");
        status.textContent = "Done: " + rows.length + " runs, seed 7.";
        worker.terminate();
        draw();
      };
      worker.postMessage(1);
    });
    function mean(a) { return a.length ? a.reduce(function (x, y) { return x + y; }, 0) / a.length : NaN; }
  }

  /* ---------------------------------------------------------------- mount */

  function mount(id, fn) { var node = document.getElementById(id); if (node) fn(node); }
  function start() {
    mount("s3-swarm", mountSwarm);
    mount("s3-rule", mountRule);
    mount("s3-levels", mountLevels);
    mount("s3-avg", mountAverages);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();

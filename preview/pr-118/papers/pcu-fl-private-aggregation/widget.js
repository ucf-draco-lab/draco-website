/*
  PCU-FL widget for /papers/pcu-fl-private-aggregation/.
  Mount points: #pf-hook, #pf-pipeline, #pf-sampler, #pf-gate, #pf-results.
  Shared state: the per-round privacy setting (epsilon) and the round seed.
  All arithmetic comes from pcufl-engine.js. Client updates are simulated and
  labeled so; printed results come from the paper's Tables I to III.
*/
(function () {
  "use strict";

  var E = window.PCUFL;
  if (!E) return;
  var P = E.PAPER;
  var DELTA = P.delta;
  var SVGNS = "http://www.w3.org/2000/svg";

  /* ------------------------------------------------------------ state */

  var state = {
    eps: 10, seed: 1,
    level: window.PaperKit ? window.PaperKit.level() : "public"
  };
  var listeners = [];
  function onChange(fn) { listeners.push(fn); }
  function changed(what) { listeners.forEach(function (fn) { fn(what); }); }
  document.addEventListener("paperlevel", function (e) { state.level = e.detail.level; changed("level"); });
  function deep() { return state.level === "grad" || state.level === "res"; }
  function atLeastUg() { return state.level === "ug" || deep(); }

  var EPS_OPTS = [
    { value: Infinity, label: "No noise", title: "No differential privacy (the paper's baseline)" },
    { value: 50, label: "ε = 50", title: "Light privacy" },
    { value: 10, label: "ε = 10", title: "Moderate privacy" },
    { value: 1, label: "ε = 1", title: "Strong privacy" }
  ];
  function epsName(e) {
    if (!isFinite(e)) return "no noise";
    return { 50: "light", 10: "moderate", 1: "strong" }[e] + " privacy (ε = " + e + " per round)";
  }

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
    var btns = [];
    options.forEach(function (o) {
      var b = el("button", { type: "button", class: "seg-option", role: "radio", "aria-checked": String(o.value === value), text: o.label });
      if (o.title) b.title = o.title;
      if (o.levels) b.setAttribute("data-levels", o.levels);
      b.addEventListener("click", function () { set(o.value); onPick(o.value); });
      wrap.appendChild(b);
      btns.push({ b: b, v: o.value });
    });
    function set(v) { value = v; btns.forEach(function (x) { x.b.setAttribute("aria-checked", String(x.v === v)); }); }
    wrap.set = set;
    return wrap;
  }
  function labeled(label, control, levels) {
    var row = el("div", { class: "pf-ctl" }, [el("span", { class: "pf-ctl-label", text: label }), control]);
    if (levels) row.setAttribute("data-levels", levels);
    return row;
  }
  function fmt(x, d) { return x == null || !isFinite(x) ? "–" : Number(x).toFixed(d == null ? 2 : d); }
  function int(x) { return x == null ? "–" : Math.round(x).toLocaleString("en-US"); }
  function sig(x, n) {
    if (!isFinite(x)) return "∞";
    if (x === 0) return "0";
    var a = Math.abs(x);
    if (a >= 1e6) { var ex = Math.floor(Math.log10(a)); return (x / Math.pow(10, ex)).toFixed(1) + " × 10^" + ex; }
    if (a >= 1000) return int(x);
    return Number(x.toPrecision(n || 3)).toString();
  }
  function words(n) { return ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"][n] || String(n); }

  /* ------------------------------------------------------------ simulated clients */

  // A round of simulated client updates: each client's raw update is a common
  // direction plus its own variation, so clipping and averaging have something to do.
  function simulateUpdates(seed, K, d, spread) {
    var rng = E.mulberry32(seed * 7919 + K * 31 + d);
    var common = [];
    for (var j = 0; j < d; j++) common.push(E.gauss(rng) * 0.35);
    var out = [];
    for (var i = 0; i < K; i++) {
      var scale = 0.4 + rng() * (spread || 1.4);
      var u = new Float64Array(d);
      for (j = 0; j < d; j++) u[j] = common[j] + E.gauss(rng) * 0.45 * scale;
      out.push(u);
    }
    return out;
  }

  /* ------------------------------------------------------------ demo 1: fifty devices, one average */

  function mountHook(root) {
    root.classList.add("w-ready");
    var K = 50, S = 1, ALPHA = 256, GAMMA = 256, N_REL = 120;
    var who = 7;
    var showOut = true;
    var epsSeg = seg(EPS_OPTS, state.eps, function (v) { state.eps = v; changed("eps"); }, "Privacy per round");
    var outSeg = seg([{ value: true, label: "On" }, { value: false, label: "Off" }], showOut, function (v) { showOut = v; draw(); }, "Compare without one device");
    var zoom = false;
    var zSeg = seg([{ value: false, label: "All devices" }, { value: true, label: "Close-up" }], zoom, function (v) { zoom = v; draw(); }, "View");
    var newBtn = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "New devices" });
    newBtn.addEventListener("click", function () { state.seed += 1; changed("seed"); });
    var ctrls = el("div", { class: "pf-ctrls" }, [
      labeled("Privacy", epsSeg),
      labeled("Leave one out", outSeg),
      labeled("View", zSeg)
    ]);
    var plot = svg("svg", { class: "pf-plot", role: "img" });
    var key = el("p", { class: "w-note pf-key" });
    var readout = el("div", { class: "pf-readout", "aria-live": "polite" });
    root.appendChild(ctrls);
    root.appendChild(el("div", { class: "w-actions" }, [newBtn]));
    root.appendChild(plot); root.appendChild(key); root.appendChild(readout);

    var cache = null;
    function compute() {
      var raw = simulateUpdates(state.seed, K, 2, 1.6);
      var g = raw.map(function (u) { return E.clip(u, S, null); });
      var ids = []; for (var i = 0; i < K; i++) ids.push(i);
      // the device whose absence moves the average most (the worst case privacy guards against)
      var mx = 0, my = 0;
      g.forEach(function (x) { mx += x.g[0] / K; my += x.g[1] / K; });
      who = 0;
      g.forEach(function (x, i) { if (Math.hypot(x.g[0] - mx, x.g[1] - my) > Math.hypot(g[who].g[0] - mx, g[who].g[1] - my)) who = i; });
      var w = ids.map(function () { return 1 / K; });
      // releases with everyone, and with device `who` left out
      var idsOut = ids.filter(function (i) { return i !== who; });
      var gOut = idsOut.map(function (i) { return g[i].g; });
      var wOut = idsOut.map(function () { return 1 / (K - 1); });
      var relAll = [], relOut = [], meta = null, metaOut = null;
      for (var r = 0; r < N_REL; r++) {
        var a = E.aggregate({ updates: g.map(function (x) { return x.g; }), ids: ids, weights: w, alpha: ALPHA, gamma: GAMMA, eps: state.eps, delta: DELTA, S: S, Wmin: 1, seed: "hook" + state.seed + "_all_" + r });
        var b = E.aggregate({ updates: gOut, ids: idsOut, weights: wOut, alpha: ALPHA, gamma: GAMMA, eps: state.eps, delta: DELTA, S: S, Wmin: 1, seed: "hook" + state.seed + "_out_" + r });
        relAll.push(a.released); relOut.push(b.released);
        if (!meta) { meta = a; metaOut = b; }
      }
      cache = { raw: raw, g: g, relAll: relAll, relOut: relOut, meta: meta, metaOut: metaOut };
    }

    function draw() {
      if (!cache) compute();
      var W = chartWidth(plot), H = Math.min(420, Math.max(300, W * 0.62));
      plot.setAttribute("viewBox", "0 0 " + W + " " + H);
      plot.setAttribute("width", W); plot.setAttribute("height", H);
      plot.innerHTML = "";
      var c = cache, m = c.meta;
      var span = 1.35, size = Math.min(W - 20, H - 20), ox = (W - size) / 2, oy = (H - size) / 2;
      var c0x = 0, c0y = 0;
      if (zoom) {
        c0x = m.exact[0]; c0y = m.exact[1];
        var shift0 = Math.hypot(m.exact[0] - c.metaOut.exact[0], m.exact[1] - c.metaOut.exact[1]);
        span = Math.max(0.04, 3.2 * m.sigmaModel + 1.6 * shift0);
      }
      function X(v) { return ox + size * (v - c0x + span) / (2 * span); }
      function Y(v) { return oy + size * (1 - (v - c0y + span) / (2 * span)); }
      plot.appendChild(svg("rect", { class: "pf-frame", x: ox, y: oy, width: size, height: size }));
      plot.appendChild(svg("text", { class: "c-tick", x: ox + 4, y: oy + size - 6 }, zoom ? "close-up, width " + sig(2 * span, 2) : "width " + sig(2 * span, 2)));
      plot.setAttribute("aria-label", "Fifty simulated device updates as points in two dimensions inside a clipping circle, with " + N_REL + " noisy released averages, " + epsName(state.eps) + ".");
      var clipG = svg("g", { "clip-path": "url(#pf-hook-clip)" });
      var defs = svg("defs"); var cp = svg("clipPath", { id: "pf-hook-clip" }); cp.appendChild(svg("rect", { x: ox, y: oy, width: size, height: size })); defs.appendChild(cp); plot.appendChild(defs);
      plot.appendChild(clipG);
      var plotRoot = plot; plot = clipG;
      if (!zoom) {
        plot.appendChild(svg("line", { class: "c-grid", x1: X(-span), x2: X(span), y1: Y(0), y2: Y(0) }));
        plot.appendChild(svg("line", { class: "c-grid", x1: X(0), x2: X(0), y1: Y(-span), y2: Y(span) }));
        plot.appendChild(svg("circle", { class: "pf-clip", cx: X(0), cy: Y(0), r: size * S / (2 * span) }));
        plot.appendChild(svg("text", { class: "c-tick", x: X(0.72), y: Y(0.78) }, atLeastUg() ? "clip S = 1" : "size limit"));
      }
      // devices
      c.g.forEach(function (x, i) {
        var raw = c.raw[i];
        if (x.clipped && atLeastUg()) {
          plot.appendChild(svg("line", { class: "pf-cliparrow", x1: X(Math.max(-span, Math.min(span, raw[0]))), y1: Y(Math.max(-span, Math.min(span, raw[1]))), x2: X(x.g[0]), y2: Y(x.g[1]) }));
        }
        plot.appendChild(svg("circle", { class: "pf-dev" + (i === who ? " who" : ""), cx: X(x.g[0]), cy: Y(x.g[1]), r: i === who ? 5 : 3 }));
      });
      // releases
      if (showOut) c.relOut.forEach(function (v) {
        plot.appendChild(svg("rect", { class: "pf-rel-out", x: X(v[0]) - 2, y: Y(v[1]) - 2, width: 4, height: 4 }));
      });
      c.relAll.forEach(function (v) {
        plot.appendChild(svg("circle", { class: "pf-rel", cx: X(v[0]), cy: Y(v[1]), r: 2.4 }));
      });
      // true averages
      var t = m.exact, to = c.metaOut.exact;
      plot.appendChild(svg("path", { class: "pf-true", d: "M" + (X(t[0]) - 7) + "," + Y(t[1]) + "h14M" + X(t[0]) + "," + (Y(t[1]) - 7) + "v14" }));
      if (showOut) plot.appendChild(svg("path", { class: "pf-true-out", d: "M" + (X(to[0]) - 6) + "," + (Y(to[1]) - 6) + "l12,12M" + (X(to[0]) + 6) + "," + (Y(to[1]) - 6) + "l-12,12" }));
      plot = plotRoot;

      key.innerHTML = '<span class="pf-k-dev"></span> device update (simulated) &nbsp; <span class="pf-k-who"></span> device ' + (who + 1) + ' &nbsp; <span class="pf-k-rel"></span> released average, all 50 devices' +
        (showOut ? ' &nbsp; <span class="pf-k-out"></span> released average without device ' + (who + 1) : "") +
        " &nbsp; + true average" + (showOut ? " &nbsp; × true average without device " + (who + 1) : "") + ". " + N_REL + " releases each.";

      // readout
      var shift = Math.hypot(t[0] - to[0], t[1] - to[1]);
      var errs = c.relAll.map(function (v) { return Math.hypot(v[0] - t[0], v[1] - t[1]); });
      var meanErr = errs.reduce(function (a, b) { return a + b; }, 0) / errs.length;
      var html;
      if (!isFinite(state.eps)) {
        html = "<strong>No noise.</strong> Every release lands on the same point, so a single release shows whether device " + (who + 1) + " took part: leaving it out moves the average by " + fmt(shift, 3) + ".";
      } else {
        var ratio = m.sigmaModel / Math.max(shift, 1e-9);
        html = "<strong>" + epsName(state.eps)[0].toUpperCase() + epsName(state.eps).slice(1) + ".</strong> A release lands on average " + fmt(meanErr, 3) + " from the true average. Leaving device " + (who + 1) + " out moves the true average by " + fmt(shift, 3) + ", which is " +
          (ratio < 0.5 ? "far larger than the noise, so the two clouds separate and an observer could tell." : ratio < 2 ? "about the size of the noise, so the clouds overlap in part." : "small next to the noise, so the two clouds overlap and one release says little about device " + (who + 1) + ".");
      }
      if (atLeastUg() && isFinite(state.eps)) {
        html += " <span class='w-mono'>σ_t = " + fmt(m.sigmaT, 4) + ", Δ*₂ = " + fmt(m.Delta, 4) + ", noise per coordinate σ_t·Δ*₂ = " + fmt(m.sigmaModel, 4) + ", σ_int = " + int(m.sigmaInt) + " (γ = α = 256, W_int = " + m.weights.Wint + ")</span>";
      }
      readout.innerHTML = html;
    }
    onChange(function (what) {
      if (what === "eps") { epsSeg.set(state.eps); cache = null; draw(); }
      if (what === "seed") { cache = null; draw(); }
      if (what === "level") draw();
    });
    resizers.push(draw);
    draw();
  }

  /* ------------------------------------------------------------ demo 2: the integer pipeline */

  function mountPipeline(root) {
    root.classList.add("w-ready");
    var K = 5, D = 6, S = 1.0;
    var gamma = 256, alpha = 256;
    var samples = null;
    var gSeg = seg([16, 256, 4096].map(function (v) { return { value: v, label: String(v) }; }), gamma, function (v) { gamma = v; draw(); }, "Fixed-point scale gamma");
    var aSeg = seg([16, 256, 1000].map(function (v) { return { value: v, label: String(v) }; }), alpha, function (v) { alpha = v; draw(); }, "Weight grid alpha");
    var epsSeg = seg(EPS_OPTS, state.eps, function (v) { state.eps = v; changed("eps"); }, "Privacy per round");
    var newBtn = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "New round" });
    newBtn.addEventListener("click", function () { state.seed += 1; changed("seed"); });
    root.appendChild(el("div", { class: "pf-ctrls" }, [
      labeled("Privacy", epsSeg),
      labeled("Scale γ", gSeg, "ug grad res"),
      labeled("Grid α", aSeg, "ug grad res")
    ]));
    root.appendChild(el("div", { class: "w-actions" }, [newBtn]));
    var wTable = el("div", { class: "pf-table-wrap" });
    var vTable = el("div", { class: "pf-table-wrap" });
    var readout = el("div", { class: "pf-readout", "aria-live": "polite" });
    root.appendChild(el("p", { class: "w-note pf-step", html: "<strong>Step 1.</strong> Turn each device's share of the data into a whole number of grid units." }));
    root.appendChild(wTable);
    root.appendChild(el("p", { class: "w-note pf-step", html: "<strong>Step 2.</strong> Round each update to whole numbers, add them with the integer weights, add whole-number noise, and divide once." }));
    root.appendChild(vTable);
    root.appendChild(readout);

    function draw() {
      var rng = E.mulberry32(state.seed * 104729 + 17);
      samples = []; for (var i = 0; i < K; i++) samples.push(20 + Math.floor(rng() * 380));
      var tot = samples.reduce(function (a, b) { return a + b; }, 0);
      var ids = [3, 8, 14, 21, 27];
      var w = samples.map(function (n) { return n / tot; });
      var raw = simulateUpdates(state.seed + 500, K, D, 1.8);
      var clipped = raw.map(function (u) { return E.clip(u, S, 1.0); });
      var agg = E.aggregate({ updates: clipped.map(function (c) { return c.g; }), ids: ids, weights: w, alpha: alpha, gamma: gamma, eps: state.eps, delta: DELTA, S: S, Wmin: 1, seed: "round" + state.seed + "_demo_0" });
      var hw = agg.weights;

      // weights table
      var rows = ids.map(function (id, i) {
        return "<tr" + (hw.plus[id] ? " class='on'" : "") + "><td>Device " + id + "</td><td class='pf-num'>" + samples[i] + "</td><td class='pf-num'>" + fmt(w[i], 4) + "</td>" +
          "<td class='pf-num' data-levels='ug grad res'>" + fmt(hw.quota[id], 3) + "</td><td class='pf-num' data-levels='ug grad res'>" + hw.base[id] + "</td><td class='pf-num' data-levels='ug grad res'>" + fmt(hw.frac[id], 3) + "</td>" +
          "<td class='pf-num'>" + (hw.plus[id] ? "+1" : "") + "</td><td class='pf-num'><strong>" + hw.tilde[id] + "</strong></td></tr>";
      }).join("");
      var sumBase = ids.reduce(function (a, id) { return a + hw.base[id]; }, 0);
      wTable.innerHTML = "<table class='results-table pf-wtable'><thead><tr><th>Device</th><th>Samples</th><th>Weight w</th><th data-levels='ug grad res'>α·w</th><th data-levels='ug grad res'>Floor</th><th data-levels='ug grad res'>Remainder</th><th>Extra</th><th>Integer weight w̃</th></tr></thead><tbody>" + rows +
        "<tr class='pf-sum'><td>Total</td><td class='pf-num'>" + tot + "</td><td class='pf-num'>1</td><td class='pf-num' data-levels='ug grad res'>" + alpha + "</td><td class='pf-num' data-levels='ug grad res'>" + sumBase + "</td><td data-levels='ug grad res'></td><td class='pf-num'>" + hw.R + "</td><td class='pf-num'><strong>" + hw.Wint + "</strong></td></tr></tbody></table>" +
        "<p class='w-note'>" + (atLeastUg()
          ? "Hamilton's largest-remainder rule: every device gets the floor of α·w, and the " + words(hw.R) + " largest remainders get one more unit, so the integer weights add to exactly α·W = " + alpha + " (W = 1 here)."
          : "Every device gets its share of " + alpha + " grid units, rounded down; the leftover " + words(hw.R) + (hw.R === 1 ? " unit goes" : " units go") + " to the devices that lost the most to rounding, so the total stays exactly " + alpha + ".") + "</p>";

      // vectors table
      function rowv(label, arr, cls, digits, levels) {
        var cells = "";
        for (var j = 0; j < D; j++) cells += "<td class='pf-num'>" + (digits == null ? int(arr[j]) : fmt(arr[j], digits)) + "</td>";
        return "<tr" + (cls ? " class='" + cls + "'" : "") + (levels ? " data-levels='" + levels + "'" : "") + "><td>" + label + "</td>" + cells + "</tr>";
      }
      var head = "<tr><th></th>"; for (var j = 0; j < D; j++) head += "<th>x" + (j + 1) + "</th>"; head += "</tr>";
      var body = "";
      ids.forEach(function (id, i) {
        body += rowv("Device " + id + " update" + (clipped[i].clipped ? " (clipped)" : ""), clipped[i].g, "", 3, "ug grad res");
        body += rowv("Device " + id + " × γ, rounded", agg.encoded[i], "pf-int", null);
      });
      body += rowv("Weighted integer sum Y", agg.Y, "pf-sum", null);
      body += rowv("Integer noise z", agg.z, "pf-noise", null);
      body += rowv("Released (Y + z) / (γ·W_int)", agg.released, "pf-sum", 4);
      body += rowv("Exact weighted average", agg.exact, "", 4);
      vTable.innerHTML = "<table class='results-table pf-vtable'><thead>" + head + "</thead><tbody>" + body + "</tbody></table>";

      var errRound = 0, errAll = 0;
      for (j = 0; j < D; j++) { errRound = Math.max(errRound, Math.abs(agg.noiseless[j] - agg.exact[j])); errAll = Math.max(errAll, Math.abs(agg.released[j] - agg.exact[j])); }
      var html = "Dividing once by γ·W_int = " + gamma + " × " + hw.Wint + " = " + int(agg.denom) + " returns the average. Rounding alone moves it by at most " + sig(errRound, 2) + " per coordinate";
      if (isFinite(state.eps)) {
        html += "; with the noise, the largest change is " + sig(errAll, 2) + ".";
        if (errAll > 0.3) html += " With only five devices, each one is a large share of the average, so the noise needed to hide any one of them is larger than the updates themselves; the paper's runs use 50 devices.";
      }
      else html += "; without noise, that rounding is the only difference.";
      if (atLeastUg()) {
        html += " <span class='w-mono'>Eq. (1): Δ*₂ = (2·" + fmt(Math.max.apply(null, ids.map(function (id) { return hw.tilde[id]; })) / alpha, 4) + "/1)·(" + S + " + √" + D + "/(2·" + gamma + ")) = " + fmt(agg.Delta, 4) +
          "; σ_t = " + fmt(agg.sigmaT, 4) + "; σ_int = σ_t·γ·W_int·Δ*₂ = " + sig(agg.sigmaInt, 4) + "; noise seed commitment " + agg.seedCommit.slice(0, 16) + "…</span>";
      }
      readout.innerHTML = html;
    }
    onChange(function (what) {
      if (what === "eps") { epsSeg.set(state.eps); draw(); }
      if (what === "seed" || what === "level") draw();
    });
    draw();
  }

  /* ------------------------------------------------------------ demo 3: the discrete Gaussian sampler */

  function mountSampler(root) {
    root.classList.add("w-ready");
    var sigma = 4, N = 20000, round = 1;
    var sSeg = seg([1.5, 4, 12].map(function (v) { return { value: v, label: "σ = " + v }; }), sigma, function (v) { sigma = v; draw(); }, "Noise width in integer units");
    var againBtn = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "Draw again" });
    againBtn.addEventListener("click", function () { round += 1; draw(); });
    root.appendChild(el("div", { class: "pf-ctrls" }, [labeled("Width", sSeg)]));
    root.appendChild(el("div", { class: "w-actions" }, [againBtn]));
    var hist = svg("svg", { class: "pf-hist", role: "img" });
    var readout = el("div", { class: "pf-readout", "aria-live": "polite" });
    root.appendChild(hist); root.appendChild(readout);

    // noise-norm check (undergrad and up)
    var normBox = el("div", { class: "pf-normbox", "data-levels": "ug grad res" });
    var dSeg = null, dVal = 24706;
    dSeg = seg([{ value: 2000, label: "d = 2,000" }, { value: 24706, label: "d = 24,706" }], dVal, function (v) { dVal = v; }, "Model size");
    var runBtn = el("button", { type: "button", class: "w-btn", text: "Check 20 rounds" });
    var normOut = el("div", { class: "pf-table-wrap" });
    normBox.appendChild(el("p", { class: "w-note pf-step", html: "<strong>Noise-size check.</strong> The paper reports that the decoded noise has length close to σ_t·Δ*₂·√d. Draw it for a full model, 20 rounds, at the current privacy setting." }));
    normBox.appendChild(el("div", { class: "pf-ctrls" }, [labeled("Model size", dSeg)]));
    normBox.appendChild(el("div", { class: "w-actions" }, [runBtn]));
    normBox.appendChild(normOut);
    root.appendChild(normBox);

    runBtn.addEventListener("click", function () {
      runBtn.disabled = true; runBtn.textContent = "Drawing…";
      setTimeout(function () {
        var eps = isFinite(state.eps) ? state.eps : 10;
        var alpha = 256, gamma = 256, K = 50;
        var ids = []; for (var i = 0; i < K; i++) ids.push(i);
        var hw = E.hamilton(ids, ids.map(function () { return 1 / K; }), alpha, true);
        var wmax = 0; for (var k in hw.tilde) wmax = Math.max(wmax, hw.tilde[k] / alpha);
        var S = 0.45;
        var Dl = E.sensitivity({ wmax: wmax, Wmin: 1, S: S, d: dVal, gamma: gamma });
        var st = E.noiseMultiplier(eps, DELTA);
        var sInt = st * gamma * hw.Wint * Dl;
        var theory = st * Dl * Math.sqrt(dVal);
        var norms = [];
        for (var r = 1; r <= 20; r++) {
          var z = E.deriveGaussian(E.seedFrom("round" + r + "_check_" + dVal), dVal, sInt);
          var s = 0; for (var j = 0; j < z.length; j++) { var v = z[j] / (gamma * hw.Wint); s += v * v; }
          norms.push(Math.sqrt(s));
        }
        var mean = norms.reduce(function (a, b) { return a + b; }, 0) / norms.length;
        var lo = Math.min.apply(null, norms), hi = Math.max.apply(null, norms);
        normOut.innerHTML = "<table class='results-table pf-ptable'><tbody>" +
          "<tr><td>Setting</td><td class='pf-num'>ε = " + eps + ", 50 devices, S = 0.45, γ = α = 256, d = " + int(dVal) + "</td></tr>" +
          "<tr><td>Δ*₂ from Eq. (1)</td><td class='pf-num'>" + fmt(Dl, 4) + "</td></tr>" +
          "<tr><td>Predicted noise length σ_t·Δ*₂·√d</td><td class='pf-num'>" + fmt(theory, 3) + "</td></tr>" +
          "<tr><td>Measured, 20 rounds (this page)</td><td class='pf-num'>mean " + fmt(mean, 3) + ", range " + fmt(lo, 3) + " to " + fmt(hi, 3) + "</td></tr>" +
          "<tr><td>Measured ÷ predicted</td><td class='pf-num'>" + fmt(mean / theory, 4) + "</td></tr>" +
          "</tbody></table><p class='w-note'>" + int(20 * dVal) + " draws from the repository's sampler, computed on your device. The paper reports agreement within ±5 percent on its own runs (README) and does not print its d.</p>";
        runBtn.disabled = false; runBtn.textContent = "Check 20 rounds";
      }, 30);
    });

    function draw() {
      var seed = E.seedFrom("sampler_round" + round + "_sigma" + sigma);
      var z = E.deriveGaussian(seed, N, sigma);
      var T = E.cdt(sigma), Kt = T.K;
      var counts = {}, mean = 0, m2 = 0;
      for (var i = 0; i < N; i++) { counts[z[i]] = (counts[z[i]] || 0) + 1; mean += z[i]; }
      mean /= N;
      for (i = 0; i < N; i++) m2 += (z[i] - mean) * (z[i] - mean);
      var sd = Math.sqrt(m2 / N);
      var lim = Math.ceil(4.2 * sigma);
      var W = chartWidth(hist), H = 220;
      hist.setAttribute("viewBox", "0 0 " + W + " " + H); hist.setAttribute("width", W); hist.setAttribute("height", H);
      hist.innerHTML = "";
      hist.setAttribute("aria-label", "Histogram of " + N + " discrete Gaussian draws with width " + sigma + ", against the continuous bell curve.");
      var L = 44, R = 14, Tp = 12, B = 30, iw = W - L - R, ih = H - Tp - B;
      var pmax = 0; for (var k = -lim; k <= lim; k++) pmax = Math.max(pmax, (counts[k] || 0) / N, T.probs[k + Kt] || 0);
      function x(v) { return L + iw * (v + lim + 0.5) / (2 * lim + 1); }
      function y(p) { return Tp + ih * (1 - p / (pmax * 1.08)); }
      [0, 0.5, 1].forEach(function (f) {
        var p = pmax * f;
        hist.appendChild(svg("line", { class: "c-grid", x1: L, x2: L + iw, y1: y(p), y2: y(p) }));
        hist.appendChild(svg("text", { class: "c-tick", x: L - 6, y: y(p) + 4, "text-anchor": "end" }, (p * 100).toFixed(1) + "%"));
      });
      var bw = Math.max(1, iw / (2 * lim + 1) - 1);
      for (k = -lim; k <= lim; k++) {
        var p = (counts[k] || 0) / N;
        hist.appendChild(svg("rect", { class: "pf-bar", x: x(k) - bw / 2, y: y(p), width: bw, height: Math.max(0, y(0) - y(p)) }));
      }
      var pts = [];
      for (var t = -lim; t <= lim; t += lim / 60) pts.push(x(t).toFixed(1) + "," + y(Math.exp(-t * t / (2 * sigma * sigma)) / (sigma * Math.sqrt(2 * Math.PI))).toFixed(1));
      hist.appendChild(svg("polyline", { class: "pf-curve", points: pts.join(" ") }));
      var stepT = sigma < 3 ? 1 : sigma < 8 ? 4 : 10;
      for (k = -Math.floor(lim / stepT) * stepT; k <= lim; k += stepT) hist.appendChild(svg("text", { class: "c-tick", x: x(k), y: H - 10, "text-anchor": "middle" }, String(k)));
      var html = N.toLocaleString("en-US") + " whole-number draws (this page, round " + round + "): mean " + fmt(mean, 3) + ", standard deviation " + fmt(sd, 3) + " against the target " + sigma + ".";
      if (atLeastUg()) {
        html += " The table covers −" + Kt + " to " + Kt + " (" + fmt(Kt / sigma, 2) + "σ); the line is the continuous normal density. <span class='w-mono'>uniforms: HMAC-SHA256(seed, counter), 8 bytes each, as in noise_commit.py; seed commitment " + E.hex(E.sha256(seed)).slice(0, 16) + "…</span>";
      }
      readout.innerHTML = html;
    }
    onChange(function (what) { if (what === "level") draw(); });
    resizers.push(draw);
    draw();
  }

  /* ------------------------------------------------------------ demo 4: the trust budget gate */

  function mountGate(root) {
    root.classList.add("w-ready");
    var o = { n: 50, bad: 5, pBad: 0.9, pGood: 0.02, Bmax: 100, rounds: 300, recover: false, seed: 11 };
    var bSeg = seg([10, 25, 100].map(function (v) { return { value: v, label: String(v), title: v === 100 ? "The paper's B_max" : "" }; }), o.Bmax, function (v) { o.Bmax = v; draw(); }, "Starting budget");
    var pSeg = seg([0.5, 0.9, 1].map(function (v) { return { value: v, label: Math.round(v * 100) + "%" }; }), o.pBad, function (v) { o.pBad = v; draw(); }, "How often an offender looks suspicious");
    var rSeg = seg([{ value: false, label: "Paper (Alg. 2)" }, { value: true, label: "Repository" }], o.recover, function (v) { o.recover = v; draw(); }, "Gate rule");
    var newBtn = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "New run" });
    newBtn.addEventListener("click", function () { o.seed += 1; draw(); });
    root.appendChild(el("div", { class: "pf-ctrls" }, [
      labeled("Budget", bSeg),
      labeled("Offender flagged", pSeg),
      labeled("Rule", rSeg, "grad res")
    ]));
    root.appendChild(el("div", { class: "w-actions" }, [newBtn]));
    var chart = svg("svg", { class: "pf-gatechart", role: "img" });
    var readout = el("div", { class: "pf-readout", "aria-live": "polite" });
    root.appendChild(chart); root.appendChild(readout);

    function draw() {
      var r = E.gate(o);
      var W = chartWidth(chart), H = 210;
      chart.setAttribute("viewBox", "0 0 " + W + " " + H); chart.setAttribute("width", W); chart.setAttribute("height", H);
      chart.innerHTML = "";
      chart.setAttribute("aria-label", "Over " + o.rounds + " simulated rounds, the number of the five offenders admitted each round and their average remaining budget.");
      var L = 40, R = 40, Tp = 26, B = 30, iw = W - L - R, ih = H - Tp - B;
      function x(t) { return L + iw * (t - 1) / (o.rounds - 1); }
      function y(v) { return Tp + ih * (1 - v / o.bad); }
      function yb(v) { return Tp + ih * (1 - v / o.Bmax); }
      for (var v = 0; v <= o.bad; v++) {
        chart.appendChild(svg("line", { class: "c-grid", x1: L, x2: L + iw, y1: y(v), y2: y(v) }));
        chart.appendChild(svg("text", { class: "c-tick", x: L - 6, y: y(v) + 4, "text-anchor": "end" }, String(v)));
      }
      [0, 0.5, 1].forEach(function (f) { chart.appendChild(svg("text", { class: "c-tick pf-bud-tick", x: L + iw + 6, y: yb(o.Bmax * f) + 4 }, String(Math.round(o.Bmax * f)))); });
      [1, 50, 100, 150, 200, 250, 300].forEach(function (t) { chart.appendChild(svg("text", { class: "c-tick", x: x(t), y: H - 10, "text-anchor": "middle" }, t === 1 ? "round 1" : String(t))); });
      chart.appendChild(svg("rect", { class: "pf-paperspan", x: x(1), y: Tp, width: x(100) - x(1), height: ih }));
      chart.appendChild(svg("text", { class: "c-tick", x: x(1), y: Tp - 8 }, W < 520 ? "shaded: the paper's runs" : "shaded: the paper's runs, 30 to 100 rounds"));
      var pa = [], pb = [];
      r.badAdmitted.forEach(function (a, i) { pa.push(x(i + 1).toFixed(1) + "," + y(a).toFixed(1)); });
      r.meanBadBudget.forEach(function (b, i) { pb.push(x(i + 1).toFixed(1) + "," + yb(b).toFixed(1)); });
      chart.appendChild(svg("polyline", { class: "pf-budget", points: pb.join(" ") }));
      chart.appendChild(svg("polyline", { class: "pf-admit", points: pa.join(" ") }));
      chart.appendChild(svg("text", { class: "c-label", x: L + iw, y: Tp - 8, "text-anchor": "end" }, W < 520 ? "admitted · budget (dashed)" : "offenders admitted (left) · mean budget (right, dashed)"));

      var honestOut = 0;
      r.admitted.forEach(function (a, i) { honestOut = Math.max(honestOut, (o.n - o.bad) - (a - r.badAdmitted[i])); });
      var html = "Simulated: 50 devices, five of them persistent offenders whose metadata looks suspicious in " + Math.round(o.pBad * 100) + " percent of rounds (ordinary devices in 2 percent). ";
      if (r.firstOut === null) html += "<strong>No offender is ever shut out</strong> in " + o.rounds + " rounds.";
      else html += "The first offender is shut out in <strong>round " + r.firstOut + "</strong>" + (r.firstOut > 100 ? ", after the longest run in the paper (100 rounds)." : ".");
      if (o.recover) html += " The repository also restores half the budget to every exhausted device each tenth round, so offenders return.";
      if (atLeastUg()) html += " Each flagged round costs one unit; a device with zero budget is skipped. Most honest devices shut out in any round: " + honestOut + ".";
      readout.innerHTML = html;
    }
    onChange(function (what) { if (what === "level") draw(); });
    resizers.push(draw);
    draw();
  }

  /* ------------------------------------------------------------ demo 5: the paper's measurements */

  function mountResults(root) {
    root.classList.add("w-ready");
    var view = "utility";
    var vSeg = seg([
      { value: "utility", label: "Accuracy" },
      { value: "mia", label: "Membership attack" },
      { value: "fp8", label: "FP8 compression" },
      { value: "budget", label: "Total privacy", levels: "grad res" }
    ], view, function (v) { view = v; draw(); }, "Result");
    root.appendChild(el("div", { class: "pf-ctrls" }, [labeled("Show", vSeg)]));
    var chart = svg("svg", { class: "pf-reschart", role: "img" });
    var table = el("div", { class: "pf-table-wrap" });
    var note = el("p", { class: "w-note" });
    root.appendChild(chart); root.appendChild(table); root.appendChild(note);

    function frame(W, H, yMin, yMax, ticks, fmtT, label) {
      var L = 48, R = 16, Tp = 14, B = 34, iw = W - L - R, ih = H - Tp - B;
      chart.setAttribute("viewBox", "0 0 " + W + " " + H); chart.setAttribute("width", W); chart.setAttribute("height", H);
      chart.innerHTML = "";
      function y(v) { return Tp + ih * (1 - (v - yMin) / (yMax - yMin)); }
      ticks.forEach(function (t) {
        chart.appendChild(svg("line", { class: "c-grid", x1: L, x2: L + iw, y1: y(t), y2: y(t) }));
        chart.appendChild(svg("text", { class: "c-tick", x: L - 6, y: y(t) + 4, "text-anchor": "end" }, fmtT(t)));
      });
      chart.appendChild(svg("text", { class: "c-label", x: L + 4, y: Tp - 2 }, label));
      return { L: L, iw: iw, ih: ih, Tp: Tp, B: B, y: y };
    }
    function catX(f, n, i) { return f.L + f.iw * (i + 0.5) / n; }

    function draw() {
      var W = chartWidth(chart), H = 240, rows, f;
      var current = state.eps;
      if (view === "utility") {
        rows = P.table1;
        f = frame(W, H, 50, 100, [50, 60, 70, 80, 90, 100], function (t) { return t + "%"; }, "accuracy (dots) and AUC × 100 (squares), Edge-IIoT");
        chart.setAttribute("aria-label", "Accuracy and AUC at four privacy settings from Table I.");
        var pa = [], pu = [];
        rows.forEach(function (r, i) {
          var cx = catX(f, rows.length, i);
          pa.push(cx + "," + f.y(r.acc)); pu.push(cx + "," + f.y(r.auc * 100));
          chart.appendChild(svg("text", { class: "c-tick" + (r.eps === current ? " pf-cur" : ""), x: cx, y: H - 18, "text-anchor": "middle" }, r.name));
          chart.appendChild(svg("text", { class: "c-tick", x: cx, y: H - 5, "text-anchor": "middle" }, isFinite(r.eps) ? "ε = " + r.eps : "ε = ∞"));
        });
        chart.appendChild(svg("polyline", { class: "pf-line", points: pa.join(" ") }));
        chart.appendChild(svg("polyline", { class: "pf-line alt", points: pu.join(" ") }));
        rows.forEach(function (r, i) {
          var cx = catX(f, rows.length, i);
          chart.appendChild(svg("circle", { class: "pf-dot" + (r.eps === current ? " cur" : ""), cx: cx, cy: f.y(r.acc), r: 4.5 }));
          chart.appendChild(svg("text", { class: "c-tick", x: cx, y: r.auc * 100 < r.acc ? f.y(r.acc) - 10 : f.y(r.acc) + 18, "text-anchor": "middle" }, r.acc + "%"));
          chart.appendChild(svg("rect", { class: "pf-sq", x: cx - 3.5, y: f.y(r.auc * 100) - 3.5, width: 7, height: 7 }));
        });
        table.innerHTML = "<table class='results-table pf-rtable'><caption class='w-note'>Table I as printed (δ = 10⁻⁵). The σ_t column is recomputed by this page from σ_t = √(2 ln(1.25/δ)) / ε.</caption><thead><tr><th>Setting</th><th>ε per round</th><th>ε total</th><th>Accuracy</th><th>AUC</th><th>σ_t (paper)</th><th>σ_t (page)</th><th>Rounds</th><th>S_clip</th><th>Clipped</th></tr></thead><tbody>" +
          rows.map(function (r) {
            var s = E.noiseMultiplier(r.eps, DELTA);
            return "<tr" + (r.eps === current ? " class='on'" : "") + "><td>" + r.name + "</td><td class='pf-num'>" + (isFinite(r.eps) ? r.eps : "∞") + "</td><td class='pf-num'>" + (isFinite(r.epsTot) ? r.epsTot : "∞") + "</td><td class='pf-num'>" + r.acc + "%</td><td class='pf-num'>" + r.auc.toFixed(3) + "</td><td class='pf-num'>" + r.sigma.toFixed(3) + "</td><td class='pf-num'>" + s.toFixed(4) + "</td><td class='pf-num'>" + r.rounds + "</td><td class='pf-num'>" + r.sclip + "</td><td class='pf-num'>" + r.clipPct + "%</td></tr>";
          }).join("") + "</tbody></table>";
        note.textContent = "Accuracy falls from 94.6 to 86.8 percent once noise is added and to about 75.7 percent at the strongest setting, where the noise multiplier is about 50 times larger (4.845 against 0.097) and training runs 100 rounds instead of 30. The privacy control above the first demo highlights its column.";
      } else if (view === "mia") {
        rows = P.table3;
        f = frame(W, H, 0, 0.8, [0, 0.2, 0.4, 0.5, 0.6, 0.8], function (t) { return t.toFixed(1); }, "membership attack: AUC (dots), true positives at 1% and 5% false positives (bars)");
        chart.setAttribute("aria-label", "Membership inference attack results from Table III.");
        chart.appendChild(svg("line", { class: "c-ref", x1: f.L, x2: f.L + f.iw, y1: f.y(0.5), y2: f.y(0.5) }));
        chart.appendChild(svg("text", { class: "c-tick", x: f.L + f.iw - 2, y: f.y(0.5) - 4, "text-anchor": "end" }, "0.5 = guessing"));
        rows.forEach(function (r, i) {
          var cx = catX(f, rows.length, i), bw = Math.min(16, f.iw / 14);
          chart.appendChild(svg("rect", { class: "pf-bar", x: cx - bw - 1, y: f.y(r.tpr1), width: bw, height: f.y(0) - f.y(r.tpr1) }));
          chart.appendChild(svg("rect", { class: "pf-bar alt", x: cx + 1, y: f.y(r.tpr5), width: bw, height: f.y(0) - f.y(r.tpr5) }));
          chart.appendChild(svg("circle", { class: "pf-dot" + (r.eps === current ? " cur" : ""), cx: cx, cy: f.y(r.auc), r: 4.5 }));
          chart.appendChild(svg("text", { class: "c-tick", x: cx + 8, y: f.y(r.auc) - 6 }, r.auc.toFixed(2)));
          chart.appendChild(svg("text", { class: "c-tick" + (r.eps === current ? " pf-cur" : ""), x: cx, y: H - 18, "text-anchor": "middle" }, r.name));
          chart.appendChild(svg("text", { class: "c-tick", x: cx, y: H - 5, "text-anchor": "middle" }, isFinite(r.eps) ? "ε = " + r.eps : "ε = ∞"));
        });
        table.innerHTML = "<table class='results-table pf-rtable'><caption class='w-note'>Table III as printed.</caption><thead><tr><th>Setting</th><th>ε per round</th><th>Accuracy</th><th>Attack AUC</th><th>TPR at 1% FPR</th><th>TPR at 5% FPR</th><th>Status</th></tr></thead><tbody>" +
          rows.map(function (r) { return "<tr" + (r.eps === current ? " class='on'" : "") + "><td>" + r.name + "</td><td class='pf-num'>" + (isFinite(r.eps) ? r.eps : "∞") + "</td><td class='pf-num'>" + r.acc + "%</td><td class='pf-num'>" + r.auc.toFixed(2) + "</td><td class='pf-num'>" + r.tpr1.toFixed(2) + "</td><td class='pf-num'>" + r.tpr5.toFixed(2) + "</td><td>" + r.status + "</td></tr>"; }).join("") + "</tbody></table>";
        note.textContent = "A membership attack tries to tell whether one record was in the training data. Without noise it succeeds well above chance (AUC 0.68, and 25 percent of members caught while wrongly accusing only 1 percent of non-members); with any of the three noise settings the AUC falls to 0.54 or below.";
      } else if (view === "fp8") {
        rows = P.table2;
        f = frame(W, H, 50, 100, [50, 60, 70, 80, 90, 100], function (t) { return t + "%"; }, "accuracy with full precision (dots) and FP8 on the wire (squares)");
        chart.setAttribute("aria-label", "Accuracy with and without FP8 quantization from Table II.");
        var groups = [[0, 1, "No noise"], [2, 3, "ε = 50"], [4, 5, "ε = 10"]];
        groups.forEach(function (g, i) {
          var cx = catX(f, 3, i), a = rows[g[0]], b = rows[g[1]];
          chart.appendChild(svg("line", { class: "pf-drop", x1: cx, x2: cx, y1: f.y(a.acc), y2: f.y(b.acc) }));
          chart.appendChild(svg("circle", { class: "pf-dot", cx: cx, cy: f.y(a.acc), r: 4.5 }));
          chart.appendChild(svg("rect", { class: "pf-sq", x: cx - 4, y: f.y(b.acc) - 4, width: 8, height: 8 }));
          chart.appendChild(svg("text", { class: "c-tick", x: cx + 9, y: f.y(a.acc) + 4 }, a.acc + "%"));
          chart.appendChild(svg("text", { class: "c-tick", x: cx + 9, y: f.y(b.acc) + 4 }, b.acc + "% (" + b.dacc + ")"));
          chart.appendChild(svg("text", { class: "c-tick", x: cx, y: H - 12, "text-anchor": "middle" }, g[2]));
        });
        table.innerHTML = "<table class='results-table pf-rtable'><caption class='w-note'>Table II as printed.</caption><thead><tr><th>Configuration</th><th>ε per round</th><th>Accuracy</th><th>Change</th><th>Communication</th><th>SNR</th><th>Convergence</th></tr></thead><tbody>" +
          rows.map(function (r) { return "<tr><td>" + r.config + "</td><td class='pf-num'>" + (isFinite(r.eps) ? r.eps : "∞") + "</td><td class='pf-num'>" + r.acc + "%</td><td class='pf-num'>" + (r.dacc == null ? "–" : r.dacc) + "</td><td class='pf-num'>" + r.comm + "×</td><td class='pf-num'>" + r.snr + "</td><td>" + r.conv + "</td></tr>"; }).join("") + "</tbody></table>";
        note.textContent = "Eight-bit floating point (FP8) sends a quarter of the bits of a 32-bit number, a four-fold saving. Alone it costs 8.8 accuracy points; combined with privacy noise it costs 15.4 to 17.4 points and training no longer converges, which is why the authors keep FP8 out of the noise path.";
      } else {
        rows = P.table1.filter(function (r) { return isFinite(r.eps); });
        var acc = rows.map(function (r) { return E.accountants(r.eps, r.rounds, DELTA); });
        var series = [
          { key: "paper", label: "Table I", cls: "s0", get: function (r) { return r.epsTot; } },
          { key: "sqrtT", label: "ε·√T", cls: "s1", get: function (r, a) { return a.sqrtT; } },
          { key: "rdp", label: "Gaussian RDP", cls: "s2", get: function (r, a) { return a.rdp; } },
          { key: "basic", label: "ε·T", cls: "s3", get: function (r, a) { return a.basic; } }
        ];
        var lmin = 0, lmax = 4;
        f = frame(W, H, lmin, lmax, [0, 1, 2, 3, 4], function (t) { return String(Math.pow(10, t)); }, "total ε after the run (log scale); bars other than Table I computed by this page");
        chart.setAttribute("aria-label", "Total privacy loss for the three noise settings: the paper's values against three accounting rules computed by the page.");
        rows.forEach(function (r, i) {
          var cx = catX(f, rows.length, i), bw = Math.min(18, f.iw / 20);
          series.forEach(function (s, k) {
            var v = s.get(r, acc[i]), lv = Math.log10(Math.max(1, v));
            var bx = cx + (k - 2) * (bw + 2);
            chart.appendChild(svg("rect", { class: "pf-bar " + s.cls, x: bx, y: f.y(lv), width: bw, height: f.y(0) - f.y(lv) }));
          });
          chart.appendChild(svg("text", { class: "c-tick", x: cx, y: H - 18, "text-anchor": "middle" }, r.name));
          chart.appendChild(svg("text", { class: "c-tick", x: cx, y: H - 5, "text-anchor": "middle" }, "ε = " + r.eps + ", " + r.rounds + " rounds"));
        });
        table.innerHTML = "<table class='results-table pf-rtable'><caption class='w-note'>Total ε at δ = 10⁻⁵. Table I is as printed; the other columns are this page's computations for the same per-round ε, σ_t, and round count.</caption><thead><tr><th>Setting</th><th>Table I</th><th>ε·√T</th><th>Gaussian RDP (order)</th><th>Basic, ε·T</th><th>Advanced composition</th></tr></thead><tbody>" +
          rows.map(function (r, i) { var a = acc[i]; return "<tr><td>" + r.name + "</td><td class='pf-num'>" + r.epsTot + "</td><td class='pf-num'>" + fmt(a.sqrtT, 2) + "</td><td class='pf-num'>" + fmt(a.rdp, 1) + " (λ = " + fmt(a.rdpOrder, 2) + ")</td><td class='pf-num'>" + int(a.basic) + "</td><td class='pf-num'>" + sig(a.advanced, 3) + "</td></tr>"; }).join("") +
          "</tbody></table><p class='w-key-legend w-note'><span class='pf-k-s0'></span> Table I &nbsp; <span class='pf-k-s1'></span> ε·√T &nbsp; <span class='pf-k-s2'></span> Gaussian RDP &nbsp; <span class='pf-k-s3'></span> basic ε·T</p>";
        note.textContent = "Computed by this page and not part of the paper. The light and moderate totals match ε·√T to rounding (273.86 and 63.25); the strong total does not (ε·√T gives 10.00). The Gaussian Rényi accountant, using the paper's σ_t as the noise multiplier and the standard conversion to (ε, δ), gives 1,869, 148, and 12.0. The researcher notes discuss the difference.";
      }
    }
    onChange(function (what) { if (what === "eps" || what === "level") draw(); });
    resizers.push(draw);
    draw();
  }

  /* ------------------------------------------------------------ boot */

  function boot() {
    var m;
    if ((m = document.getElementById("pf-hook"))) mountHook(m);
    if ((m = document.getElementById("pf-pipeline"))) mountPipeline(m);
    if ((m = document.getElementById("pf-sampler"))) mountSampler(m);
    if ((m = document.getElementById("pf-gate"))) mountGate(m);
    if ((m = document.getElementById("pf-results"))) mountResults(m);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();

/*
  Retail liability widget for /papers/retail-liability-models/.
  Mount points: #rl-neighbors, #rl-models, #rl-check, #rl-rfe, #rl-map.
  One shared state: a simulated cashier chain (seed), its standardized
  features and 90/10 split, and the results computed on it. The study's own
  retail data are private, so every chart of cashiers is simulated and says so.
*/
(function () {
  "use strict";

  var L = window.Liability;
  if (!L) return;

  var BASE = (document.currentScript && document.currentScript.src)
    ? document.currentScript.src.replace(/widget\.js(\?.*)?$/, "")
    : "/papers/retail-liability-models/";
  var SVGNS = "http://www.w3.org/2000/svg";
  var DEFAULT_SEED = 2018;

  /* ------------------------------------------------------------ state */

  var state = {
    seed: DEFAULT_SEED,
    data: null,          // { d, X, split, Xtr, ytr, Xte, yte }
    pre: null,           // precomputed.json (seed 2018 only)
    models: null,        // { id: { mae, mse, r2, pred } } for the current seed
    rfe: {},             // { modelId: { kept, steps } }
    tsne: {},            // { configId: { Y, kl, nIter } }
    kcurve: null,
    opts: {},
    level: window.PaperKit ? window.PaperKit.level() : "public"
  };
  var listeners = [];
  function onChange(fn) { listeners.push(fn); }
  function changed(what) { listeners.forEach(function (fn) { fn(what); }); }
  document.addEventListener("paperlevel", function (e) { state.level = e.detail.level; changed("level"); });

  function buildData(seed) {
    var d = L.simulate(seed), X = L.standardize(d.X), sp = L.split(X.length, 0.1, seed);
    state.data = {
      d: d, X: X, split: sp,
      Xtr: L.take(X, sp.train), ytr: Float64Array.from(L.take(d.y, sp.train)),
      Xte: L.take(X, sp.test), yte: Float64Array.from(L.take(d.y, sp.test)),
      trainRaw: L.take(d.X, sp.train), testRaw: L.take(d.X, sp.test)
    };
  }
  function adoptPre() {
    if (!state.pre || state.seed !== state.pre.seed) return;
    state.models = state.pre.models;
    state.rfe = JSON.parse(JSON.stringify(state.pre.rfe));
    state.tsne = state.pre.tsne;
    state.kcurve = state.pre.kcurve;
  }
  function setSeed(seed) {
    state.seed = seed;
    state.models = null; state.rfe = {}; state.tsne = {}; state.kcurve = null;
    buildData(seed);
    adoptPre();
    changed("seed");
  }

  /* ------------------------------------------------------------ worker */

  var worker = null, jobs = {}, jobId = 0;
  function getWorker() {
    if (worker) return worker;
    try { worker = new Worker(BASE + "liability-worker.js"); }
    catch (e) { return null; }
    worker.onmessage = function (e) {
      var m = e.data, job = jobs[m.id];
      if (!job) return;
      if (m.error) { delete jobs[m.id]; job.reject(m.error); return; }
      if (m.done) { delete jobs[m.id]; job.resolve(m); return; }
      if (job.progress) job.progress(m);
    };
    return worker;
  }
  function run(msg, progress) {
    return new Promise(function (resolve, reject) {
      var w = getWorker();
      if (!w) { reject("This browser could not start a background worker."); return; }
      msg.id = ++jobId;
      jobs[msg.id] = { resolve: resolve, reject: reject, progress: progress };
      w.postMessage(msg);
    });
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
  var resizers = [], resizeTimer = null;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () { resizers.forEach(function (fn) { fn(); }); }, 150);
  });
  function seg(options, value, onPick, label) {
    var wrap = el("div", { class: "seg", role: "radiogroup", "aria-label": label });
    var btns = options.map(function (o) {
      var b = el("button", { type: "button", class: "seg-option", role: "radio", "aria-checked": String(o.value === value), text: o.label });
      if (o.title) b.title = o.title;
      if (o.levels) b.setAttribute("data-levels", o.levels);
      b.addEventListener("click", function () { set(o.value); onPick(o.value); });
      wrap.appendChild(b);
      return b;
    });
    function set(v) { btns.forEach(function (b, i) { b.setAttribute("aria-checked", String(options[i].value === v)); }); }
    wrap.set = set;
    return wrap;
  }
  function range(label, min, max, step, value, fmt, onInput) {
    var input = el("input", { type: "range", min: min, max: max, step: step, value: value, "aria-label": label });
    var out = el("output", { text: fmt(value) });
    input.addEventListener("input", function () { out.textContent = fmt(Number(input.value)); onInput(Number(input.value)); });
    var row = el("label", { class: "w-range" }, [el("span", { text: label }), input, out]);
    row.input = input; row.out = out;
    return row;
  }
  function fx(v, d) { return v == null || isNaN(v) ? "–" : v.toFixed(d).replace(/^-/, "−"); }
  function comma(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ","); }
  function riskColor(r) {
    var t = Math.max(0, Math.min(1, (r - 4) / 12));
    return "color-mix(in srgb, var(--accent) " + Math.round(t * 100) + "%, var(--primary));fill-opacity:" + (0.3 + 0.7 * t).toFixed(2);
  }
  var WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
  function num(n) { return n >= 0 && n < 10 && n === Math.floor(n) ? WORDS[n] : comma(n); }
  // Display range that ignores the most extreme 1 percent at each end, so a few
  // far-flung t-SNE points do not shrink the rest of the map to a dot.
  function robustExtent(a) {
    var s = a.slice().sort(function (x, y) { return x - y; });
    var lo = s[Math.floor(0.01 * (s.length - 1))], hi = s[Math.ceil(0.99 * (s.length - 1))];
    var pad = (hi - lo) * 0.12 || 1;
    return [Math.max(s[0], lo - pad), Math.min(s[s.length - 1], hi + pad)];
  }
  function extent(a) { var lo = Infinity, hi = -Infinity; a.forEach(function (v) { if (v < lo) lo = v; if (v > hi) hi = v; }); return [lo, hi]; }
  function niceTicks(lo, hi, n) {
    var span = hi - lo || 1, step = Math.pow(10, Math.floor(Math.log10(span / n)));
    [1, 2, 2.5, 5, 10].some(function (m) { if (span / (step * m) <= n) { step *= m; return true; } return false; });
    var out = [], v = Math.ceil(lo / step) * step;
    for (; v <= hi + 1e-9; v += step) out.push(Number((Math.round(v / step) * step).toPrecision(10)));
    return out;
  }
  function modelLabel(id) { for (var i = 0; i < L.MODELS.length; i++) if (L.MODELS[i].id === id) return L.MODELS[i].label; return id; }
  function paperRow(id) { for (var i = 0; i < L.TABLE1.length; i++) if (L.TABLE1[i].id === id) return L.TABLE1[i]; return null; }
  function simTag() { return "Simulated chain #" + state.seed; }

  // Scatter frame: returns { svg, g, sx, sy, W, H } with axes drawn.
  function frame(host, cls, xs, ys, opt) {
    opt = opt || {};
    var W = chartWidth(host), H = opt.height || Math.round(Math.min(420, Math.max(260, W * 0.62)));
    var m = { l: 46, r: 12, t: 12, b: 40 };
    var x0 = opt.xlim ? opt.xlim[0] : xs[0], x1 = opt.xlim ? opt.xlim[1] : xs[1];
    var y0 = opt.ylim ? opt.ylim[0] : ys[0], y1 = opt.ylim ? opt.ylim[1] : ys[1];
    if (!opt.xlim) { var px = (x1 - x0) * 0.05 || 1; x0 -= px; x1 += px; }
    if (!opt.ylim) { var py = (y1 - y0) * 0.05 || 1; y0 -= py; y1 += py; }
    var sx = function (v) { return m.l + (v - x0) / (x1 - x0) * (W - m.l - m.r); };
    var sy = function (v) { return H - m.b - (v - y0) / (y1 - y0) * (H - m.t - m.b); };
    var s = svg("svg", { class: "rl-chart " + (cls || ""), viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": opt.aria || "chart" });
    var g = svg("g");
    if (!opt.noTicks) {
      niceTicks(x0, x1, Math.max(3, Math.floor(W / 110))).forEach(function (t) {
        g.appendChild(svg("line", { class: "c-grid", x1: sx(t), x2: sx(t), y1: m.t, y2: H - m.b }));
        g.appendChild(svg("text", { class: "c-tick", x: sx(t), y: H - m.b + 15, "text-anchor": "middle" }, opt.xfmt ? opt.xfmt(t) : String(t)));
      });
      niceTicks(y0, y1, 5).forEach(function (t) {
        g.appendChild(svg("line", { class: "c-grid", x1: m.l, x2: W - m.r, y1: sy(t), y2: sy(t) }));
        g.appendChild(svg("text", { class: "c-tick", x: m.l - 6, y: sy(t) + 4, "text-anchor": "end" }, opt.yfmt ? opt.yfmt(t) : String(t)));
      });
    }
    if (opt.xlabel) g.appendChild(svg("text", { class: "c-label", x: (m.l + W - m.r) / 2, y: H - 6, "text-anchor": "middle" }, opt.xlabel));
    if (opt.ylabel) g.appendChild(svg("text", { class: "c-label", x: 12, y: (m.t + H - m.b) / 2, "text-anchor": "middle", transform: "rotate(-90 12 " + ((m.t + H - m.b) / 2) + ")" }, opt.ylabel));
    s.appendChild(g);
    return { svg: s, g: g, sx: sx, sy: sy, W: W, H: H, m: m, x0: x0, x1: x1, y0: y0, y1: y1 };
  }
  function legendRisk() {
    var wrap = el("div", { class: "rl-legend" });
    wrap.appendChild(el("span", { class: "w-mono", text: "Risk factor 4" }));
    wrap.appendChild(el("span", { class: "rl-ramp", "aria-hidden": "true" }));
    wrap.appendChild(el("span", { class: "w-mono", text: "16" }));
    return wrap;
  }

  // Silhouette of k-means (k = 2) found in a two-dimensional view, plus the
  // centers for drawing. Also the alternative reading: 2-means labels from the
  // 28 standardized features, scored in the same view.
  var silCache = {};
  function viewSilhouette(key, Y) {
    var c = silCache[key];
    if (c && c.Y === Y) return c;
    var km = L.kmeans(Y, 2, 7, 10);
    c = { Y: Y, centers: km.centers, labels: km.labels, s: L.silhouette(Y, km.labels) };
    silCache[key] = c;
    return c;
  }
  var labels28 = null, labels28Seed = null;
  function fullLabels() {
    if (labels28Seed === state.seed) return labels28;
    labels28 = L.kmeans(state.data.X, 2, 13, 10).labels;
    labels28Seed = state.seed;
    return labels28;
  }

  buildData(state.seed);

  function mount(id, build) {
    var host = document.getElementById(id);
    if (!host) return;
    host.classList.add("w-ready");
    build(host);
  }

  /* ============================================================ demo 1: neighbors */

  mount("rl-neighbors", function (host) {
    var local = { k: 5, mode: "two", pick: 0, free: null };
    var FX = 3, FY = 4;  // Department Refunds Item Count, Number of Item Voids
    host.appendChild(el("p", { class: "w-note", html: "Each dot is one cashier in a <strong>simulated</strong> store chain (the retailer's records are private). Color shows the risk factor an analyst assigned. The ringed dot is a cashier the model has not seen; the lines reach its nearest neighbors." }));
    var modeSeg = seg([
      { value: "two", label: "Neighbors by these two numbers" },
      { value: "all", label: "Neighbors by all 28 numbers" }
    ], local.mode, function (v) { local.mode = v; local.free = null; draw(); }, "How neighbors are found");
    var kRow = range("Neighbors k", 1, 25, 1, local.k, String, function (v) { local.k = v; draw(); });
    var nextBtn = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "Next unseen cashier", onclick: function () { local.free = null; local.pick = (local.pick + 1) % state.data.Xte.length; draw(); } });
    host.appendChild(el("div", { class: "w-actions" }, [modeSeg, nextBtn]));
    host.appendChild(kRow);
    var chartHost = el("div", { class: "rl-chart-host" });
    host.appendChild(chartHost);
    host.appendChild(legendRisk());
    var readout = el("div", { class: "w-big", "aria-live": "polite" });
    host.appendChild(readout);
    var note = el("p", { class: "w-note" });
    host.appendChild(note);

    function jitter(i, axis) { var r = L.mulberry(i * 2 + axis + 1)(); return (r - 0.5) * 0.6; }

    function draw() {
      var D = state.data;
      var xs = D.trainRaw.map(function (r) { return r[FX]; }), ys = D.trainRaw.map(function (r) { return r[FY]; });
      var ex = extent(xs), ey = extent(ys);
      chartHost.innerHTML = "";
      var f = frame(chartHost, "rl-scatter", ex, ey, { xlabel: "Department Refunds Item Count", ylabel: "Number of Item Voids", aria: "Simulated cashiers by refunds and voids, colored by risk factor" });
      // target
      var target, truth = null;
      if (local.free) target = { raw: local.free };
      else { target = { raw: D.testRaw[local.pick], z: D.Xte[local.pick] }; truth = D.yte[local.pick]; }
      // neighbors
      var nb;
      if (local.mode === "two") {
        // standardize the two shown features with the training set's spread
        var sxs = sd(xs), sys = sd(ys);
        var d2 = D.trainRaw.map(function (r, i) {
          var a = (r[FX] - target.raw[FX]) / sxs, b = (r[FY] - target.raw[FY]) / sys;
          return { i: i, d: a * a + b * b };
        });
        d2.sort(function (a, b) { return a.d - b.d || a.i - b.i; });
        nb = d2.slice(0, local.k).map(function (o) { return o.i; });
      } else {
        nb = L.fitKNN(D.Xtr, D.ytr, local.k).neighbors(target.z);
      }
      var guess = 0;
      nb.forEach(function (i) { guess += D.ytr[i]; });
      guess /= nb.length;
      var gLines = svg("g"), gDots = svg("g");
      var nbSet = {};
      nb.forEach(function (i) { nbSet[i] = true; });
      D.trainRaw.forEach(function (r, i) {
        var cx = f.sx(r[FX] + jitter(i, 0)), cy = f.sy(r[FY] + jitter(i, 1));
        gDots.appendChild(svg("circle", { class: "rl-dot" + (nbSet[i] ? " nb" : ""), cx: cx, cy: cy, r: nbSet[i] ? 4.2 : 2.6, style: "fill:" + riskColor(D.ytr[i]) }));
        if (nbSet[i]) gLines.appendChild(svg("line", { class: "rl-nbline", x1: f.sx(target.raw[FX]), y1: f.sy(target.raw[FY]), x2: cx, y2: cy }));
      });
      f.g.appendChild(gLines); f.g.appendChild(gDots);
      f.g.appendChild(svg("circle", { class: "rl-target", cx: f.sx(target.raw[FX]), cy: f.sy(target.raw[FY]), r: 7 }));
      // click to place a hypothetical cashier (two-number mode only)
      f.svg.addEventListener("click", function (ev) {
        if (local.mode !== "two") return;
        var pt = f.svg.createSVGPoint(); pt.x = ev.clientX; pt.y = ev.clientY;
        var p = pt.matrixTransform(f.svg.getScreenCTM().inverse());
        var vx = f.x0 + (p.x - f.m.l) / (f.W - f.m.l - f.m.r) * (f.x1 - f.x0);
        var vy = f.y0 + (f.H - f.m.b - p.y) / (f.H - f.m.t - f.m.b) * (f.y1 - f.y0);
        var raw = D.testRaw[local.pick].slice();
        raw[FX] = Math.max(0, vx); raw[FY] = Math.max(0, vy);
        local.free = raw;
        draw();
      });
      chartHost.appendChild(f.svg);
      readout.innerHTML = "";
      readout.appendChild(document.createTextNode("Guess: "));
      readout.appendChild(el("strong", { text: fx(guess, 1) }));
      readout.appendChild(document.createTextNode(truth != null ? "   Analyst's risk factor: " + truth : "   (a cashier you placed; no analyst score)"));
      // test-set error for this mode and k
      var mae = testMAE(local.mode, local.k);
      note.textContent = (local.mode === "two"
        ? "Using only refunds and voids, the average of the " + num(local.k) + " nearest cashiers misses the analyst's score by " + fx(mae, 2) + " points on average across the " + D.Xte.length + " unseen cashiers. Click anywhere on the chart to place a cashier of your own."
        : "Using all 28 standardized numbers, as the paper's model does, the average miss across the " + D.Xte.length + " unseen cashiers is " + fx(mae, 2) + " points. Neighbors in 28 dimensions can look far apart on a two-number chart.")
        + " " + simTag() + ", " + D.Xtr.length + " training cashiers.";
    }
    var maeCache = {};
    function testMAE(mode, k) {
      var key = state.seed + "|" + mode + "|" + k;
      if (maeCache[key] != null) return maeCache[key];
      var D = state.data, Xa, Xb;
      if (mode === "two") { Xa = L.cols(D.Xtr, [FX, FY]); Xb = L.cols(D.Xte, [FX, FY]); }
      else { Xa = D.Xtr; Xb = D.Xte; }
      var p = L.fitKNN(Xa, D.ytr, k).predict(Xb);
      return (maeCache[key] = L.metrics(D.yte, p).mae);
    }
    function sd(a) { var m = 0; a.forEach(function (v) { m += v; }); m /= a.length; var s = 0; a.forEach(function (v) { s += (v - m) * (v - m); }); return Math.sqrt(s / a.length) || 1; }
    onChange(function (what) { if (what === "seed") { local.pick = 0; local.free = null; draw(); } });
    resizers.push(draw);
    draw();
  });

  /* ============================================================ demo 2: eight models */

  mount("rl-models", function (host) {
    var local = { sel: "svrrbf", busy: false };
    var status = el("span", { class: "w-mono", "aria-live": "polite" });
    var trainBtn = el("button", { type: "button", class: "w-btn", text: "Train all eight models", onclick: trainAll });
    var newBtn = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "Draw another simulated chain", onclick: function () { setSeed(1 + Math.floor(Math.random() * 99999)); } });
    var resetBtn = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "Back to chain #2018", onclick: function () { setSeed(DEFAULT_SEED); } });
    host.appendChild(el("div", { class: "w-actions" }, [trainBtn, newBtn, resetBtn, status]));
    var ctrls = el("div", { class: "rl-ctrls", "data-levels": "grad res" });
    ctrls.appendChild(range("KNN k", 1, 25, 1, L.DEFAULTS.k, String, function (v) { state.opts.k = v; markStale(); }));
    var lassoVals = [0.001, 0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.5];
    ctrls.appendChild(range("Lasso alpha", 0, lassoVals.length - 1, 1, lassoVals.indexOf(L.DEFAULTS.lassoAlpha), function (i) { return String(lassoVals[i]); }, function (i) { state.opts.lassoAlpha = lassoVals[i]; markStale(); }));
    var ridgeVals = [0.01, 0.1, 1, 10, 100, 1000];
    ctrls.appendChild(range("Ridge alpha", 0, ridgeVals.length - 1, 1, ridgeVals.indexOf(L.DEFAULTS.ridgeAlpha), function (i) { return String(ridgeVals[i]); }, function (i) { state.opts.ridgeAlpha = ridgeVals[i]; markStale(); }));
    ctrls.appendChild(el("p", { class: "w-note", text: "The paper tuned k and both alphas but does not print the values it chose; the page starts at k = 5 (the scikit-learn default, close to the square root of 28 that the paper mentions), lasso α = 0.02, and ridge α = 1. Move a slider, then train again." }));
    host.appendChild(ctrls);
    var tableHost = el("div", { class: "rl-table-wrap" });
    host.appendChild(tableHost);
    var chartHost = el("div", { class: "rl-chart-host" });
    host.appendChild(chartHost);
    var note = el("p", { class: "w-note" });
    host.appendChild(note);

    function markStale() { status.textContent = "Settings changed; train again to update the page's columns."; }

    function trainAll() {
      if (local.busy) return;
      local.busy = true; trainBtn.disabled = true; trainBtn.classList.add("running");
      var partial = {};
      status.textContent = "Training…";
      run({ cmd: "models", seed: state.seed, opts: state.opts }, function (m) {
        partial[m.model] = Object.assign({}, m.result.metrics, { pred: m.result.pred });
        status.textContent = "Trained " + Object.keys(partial).length + " of 8 (" + modelLabel(m.model) + ")";
      }).then(function (m) {
        var res = {};
        Object.keys(m.result).forEach(function (k) { res[k] = Object.assign({}, m.result[k].metrics, { pred: m.result[k].pred }); });
        state.models = res;
        status.textContent = "Trained eight models in " + (m.ms / 1000).toFixed(1) + " s on this device.";
        done();
        draw();
      }, function (err) { status.textContent = String(err); done(); });
      function done() { local.busy = false; trainBtn.disabled = false; trainBtn.classList.remove("running"); }
    }

    function draw() {
      var D = state.data, M = state.models;
      tableHost.innerHTML = "";
      var t = el("table", { class: "results-table rl-models-table" });
      t.appendChild(el("caption", { class: "w-note", text: "Test-set error of each model. Page columns: " + simTag() + ", " + D.Xtr.length + " training and " + D.Xte.length + " test cashiers. Paper columns: Table 1, the retailer's 991 cashiers with a 90/10 split." }));
      var thead = el("thead");
      thead.appendChild(el("tr", {}, [el("th", { text: "Model" }), el("th", { text: "Page MAE" }), el("th", { text: "Page MSE" }), el("th", { text: "Page R²" }), el("th", { text: "Paper MAE" }), el("th", { text: "Paper MSE" }), el("th", { text: "Paper R²" }), el("th", { text: "R², page and paper" })]));
      t.appendChild(thead);
      var tb = el("tbody");
      var bestPage = null, bestPaper = null;
      L.MODELS.forEach(function (m) {
        var pr = paperRow(m.id);
        if (!bestPaper || pr.r2 > paperRow(bestPaper).r2) bestPaper = m.id;
        if (M && M[m.id] && (!bestPage || M[m.id].r2 > M[bestPage].r2)) bestPage = m.id;
      });
      L.MODELS.forEach(function (m) {
        var pr = paperRow(m.id), mine = M && M[m.id];
        var bars = el("span", { class: "rl-r2bars", "aria-hidden": "true" }, [
          el("span", { class: "rl-r2 page", style: "width:" + (mine ? Math.max(0, mine.r2) * 100 : 0) + "%" }),
          el("span", { class: "rl-r2 paper", style: "width:" + Math.max(0, pr.r2) * 100 + "%" })
        ]);
        var tr = el("tr", { class: local.sel === m.id ? "on" : "", tabindex: "0", role: "button", "aria-label": "Show predictions of " + m.label }, [
          el("td", { text: m.label + (m.id === bestPage ? " (page best)" : "") + (m.id === bestPaper ? " (paper best)" : "") }),
          el("td", { class: "rl-num", text: mine ? fx(mine.mae, 4) : "–" }),
          el("td", { class: "rl-num", text: mine ? fx(mine.mse, 4) : "–" }),
          el("td", { class: "rl-num", text: mine ? fx(mine.r2, 4) : "–" }),
          el("td", { class: "rl-num", text: fx(pr.mae, 4) }),
          el("td", { class: "rl-num", text: String(pr.mse) }),
          el("td", { class: "rl-num", text: fx(pr.r2, 4) }),
          el("td", {}, [bars])
        ]);
        function pick() { local.sel = m.id; draw(); }
        tr.addEventListener("click", pick);
        tr.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(); } });
        tb.appendChild(tr);
      });
      t.appendChild(tb);
      tableHost.appendChild(t);
      tableHost.appendChild(el("div", { class: "rl-legend" }, [el("span", { class: "rl-sw page" }), el("span", { class: "w-mono", text: "page (simulated)" }), el("span", { class: "rl-sw paper" }), el("span", { class: "w-mono", text: "paper (Table 1)" })]));
      // predicted vs actual
      chartHost.innerHTML = "";
      if (!M) { note.textContent = "Press Train all eight models to fit them on this simulated chain."; return; }
      var mine = M[local.sel], ys = Array.from(D.yte), ps = mine.pred;
      var lo = Math.min(4, extent(ps)[0]), hi = Math.max(16, extent(ps)[1]);
      var f = frame(chartHost, "rl-scatter", [lo, hi], [lo, hi], { xlim: [lo - 0.5, hi + 0.5], ylim: [lo - 0.5, hi + 0.5], xlabel: "Analyst's risk factor (simulated)", ylabel: "Predicted by " + modelLabel(local.sel), aria: "Predicted against assigned risk for the test cashiers" });
      f.g.appendChild(svg("line", { class: "c-ref", x1: f.sx(lo - 0.5), y1: f.sy(lo - 0.5), x2: f.sx(hi + 0.5), y2: f.sy(hi + 0.5) }));
      ys.forEach(function (y, i) {
        var jit = (L.mulberry(i + 3)() - 0.5) * 0.35;
        f.g.appendChild(svg("circle", { class: "rl-dot", cx: f.sx(y + jit), cy: f.sy(ps[i]), r: 3.2, style: "fill:" + riskColor(y) }));
      });
      chartHost.appendChild(f.svg);
      note.textContent = modelLabel(local.sel) + " on the " + D.Xte.length + " unseen simulated cashiers: points on the dashed line are exact guesses. MAE " + fx(mine.mae, 3) + ", MSE " + fx(mine.mse, 3) + ", R² " + fx(mine.r2, 3) + ". Select another row to compare. The simulated chain is a stand-in with the paper's shape (991 cashiers, 28 features, ten regions), so its numbers show how the methods behave, not what the retailer's data would give.";
    }
    onChange(function (what) {
      if (what === "seed") { status.textContent = state.models ? "" : "New chain: press Train all eight models."; draw(); }
    });
    resizers.push(draw);
    onChange(function (w) { if (w === "ready") draw(); });
  });

  /* ============================================================ demo 3: the paper's table checks itself */

  mount("rl-check", function (host) {
    var local = { view: "variance" };
    var viewSeg = seg([
      { value: "variance", label: "Implied test-set spread" },
      { value: "r2", label: "R² rebuilt from MSE" }
    ], local.view, function (v) { local.view = v; draw(); }, "Check");
    host.appendChild(el("div", { class: "w-actions" }, [viewSeg]));
    var chartHost = el("div", { class: "rl-chart-host" });
    host.appendChild(chartHost);
    var tableHost = el("div", { class: "rl-table-wrap" });
    host.appendChild(tableHost);
    var readout = el("div", { class: "w-big", "aria-live": "polite" });
    host.appendChild(readout);

    function common() {
      var lo = -Infinity, hi = Infinity;
      L.TABLE1.forEach(function (r) { var v = L.impliedVariance(r); lo = Math.max(lo, v.lo); hi = Math.min(hi, v.hi); });
      return { lo: lo, hi: hi, mid: (lo + hi) / 2 };
    }

    function draw() {
      var C = common();
      chartHost.innerHTML = ""; tableHost.innerHTML = "";
      if (local.view === "variance") {
        var W = chartWidth(chartHost), rowH = 28, H = 30 + rowH * L.TABLE1.length + 30;
        var lab = W < 480 ? 92 : 150, x0 = 2.154, x1 = 2.175;
        var sx = function (v) { return lab + (v - x0) / (x1 - x0) * (W - lab - 14); };
        var s = svg("svg", { class: "rl-chart", viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": "Test-set variance implied by each Table 1 row, with rounding intervals" });
        s.appendChild(svg("rect", { class: "rl-band", x: sx(C.lo), y: 14, width: Math.max(1.5, sx(C.hi) - sx(C.lo)), height: rowH * L.TABLE1.length + 6 }));
        niceTicks(x0, x1, Math.max(3, Math.floor((W - lab) / 90))).forEach(function (t) {
          s.appendChild(svg("line", { class: "c-grid", x1: sx(t), x2: sx(t), y1: 14, y2: H - 30 }));
          s.appendChild(svg("text", { class: "c-tick", x: sx(t), y: H - 14, "text-anchor": "middle" }, t.toFixed(3)));
        });
        L.TABLE1.forEach(function (r, i) {
          var v = L.impliedVariance(r), y = 30 + i * rowH;
          s.appendChild(svg("text", { class: "c-tick", x: 4, y: y + 4 }, W < 480 ? L.MODELS[i].label.replace(" regression", "").replace(" (linear kernel)", " lin.").replace(" (RBF kernel)", " RBF") : L.MODELS[i].label));
          s.appendChild(svg("line", { class: "rl-int", x1: sx(v.lo), x2: sx(v.hi), y1: y, y2: y }));
          s.appendChild(svg("circle", { class: "rl-pt", cx: sx(v.v), cy: y, r: 3.5 }));
        });
        s.appendChild(svg("text", { class: "c-label", x: (lab + W) / 2, y: H - 1, "text-anchor": "middle" }, "MSE ÷ (1 − R²), with each row's rounding"));
        chartHost.appendChild(s);
        readout.innerHTML = "";
        readout.appendChild(document.createTextNode("All eight rows fit one test group with variance "));
        readout.appendChild(el("strong", { text: C.lo.toFixed(4) + " to " + C.hi.toFixed(4) }));
      } else {
        var t = el("table", { class: "results-table" });
        t.appendChild(el("caption", { class: "w-note", text: "R² recomputed as 1 − MSE ÷ " + C.mid.toFixed(4) + " (the middle of the shared range), next to the printed value. MAE² can never exceed MSE; the last column checks that too." }));
        t.appendChild(el("thead", {}, [el("tr", {}, [el("th", { text: "Model" }), el("th", { text: "Printed MSE" }), el("th", { text: "Printed R²" }), el("th", { text: "Rebuilt R²" }), el("th", { text: "Difference" }), el("th", { text: "MAE² ≤ MSE" })])]));
        var tb = el("tbody");
        L.TABLE1.forEach(function (r, i) {
          var rb = 1 - r.mse / C.mid;
          tb.appendChild(el("tr", {}, [
            el("td", { text: L.MODELS[i].label }), el("td", { class: "rl-num", text: String(r.mse) }), el("td", { class: "rl-num", text: fx(r.r2, 4) }),
            el("td", { class: "rl-num", text: fx(rb, 4) }), el("td", { class: "rl-num", text: (Math.abs(rb - r.r2) < 5e-6 ? "" : rb - r.r2 > 0 ? "+" : "−") + Math.abs(rb - r.r2).toFixed(5) }),
            el("td", { class: "rl-num", text: (r.mae * r.mae).toFixed(3) + " ≤ " + r.mse + (r.mae * r.mae <= r.mse ? "  yes" : "  no") })
          ]));
        });
        t.appendChild(tb);
        tableHost.appendChild(t);
        readout.innerHTML = "";
        readout.appendChild(document.createTextNode("Every rebuilt R² lands within "));
        var maxd = 0;
        L.TABLE1.forEach(function (r) { maxd = Math.max(maxd, Math.abs(1 - r.mse / C.mid - r.r2)); });
        readout.appendChild(el("strong", { text: maxd.toFixed(5) }));
        readout.appendChild(document.createTextNode(" of the printed value"));
      }
    }
    resizers.push(draw);
    draw();
  });

  /* ============================================================ demo 4: recursive feature elimination */

  mount("rl-rfe", function (host) {
    var local = { model: "ols", left: 2, busy: false };
    var modelSeg = seg([
      { value: "ols", label: "Linear regression" },
      { value: "svrlin", label: "SVR (linear kernel)" },
      { value: "forest", label: "Random forest" }
    ], local.model, function (v) { local.model = v; local.left = 2; slider.input.value = 2; slider.out.textContent = "2"; draw(); }, "Model");
    var status = el("span", { class: "w-mono", "aria-live": "polite" });
    var runBtn = el("button", { type: "button", class: "w-btn", text: "Run elimination", onclick: compute });
    host.appendChild(el("div", { class: "w-actions" }, [modelSeg]));
    var slider = range("Features left", 2, 28, 1, local.left, String, function (v) { local.left = v; draw(); });
    slider.input.setAttribute("dir", "rtl");
    host.appendChild(slider);
    host.appendChild(el("div", { class: "w-actions" }, [runBtn, status]));
    var listHost = el("div", { class: "rl-rfe-list" });
    host.appendChild(listHost);
    var chartHost = el("div", { class: "rl-chart-host" });
    host.appendChild(chartHost);
    host.appendChild(legendRisk());
    var note = el("p", { class: "w-note" });
    host.appendChild(note);

    function compute() {
      if (local.busy) return;
      local.busy = true; runBtn.disabled = true; runBtn.classList.add("running");
      var steps = [];
      status.textContent = "Fitting " + modelLabel(local.model) + " on 28 features…";
      var model = local.model;
      run({ cmd: "rfe", seed: state.seed, model: model, opts: state.opts }, function (m) {
        steps.push(m.step);
        status.textContent = "Removed " + steps.length + " of 26 features";
        state.rfe[model] = { kept: null, steps: steps.slice(), partial: true };
        if (model === local.model) draw();
      }).then(function (m) {
        state.rfe[model] = m.result;
        status.textContent = "Done in " + (m.ms / 1000).toFixed(1) + " s.";
        fin(); draw();
      }, function (err) { status.textContent = String(err); fin(); });
      function fin() { local.busy = false; runBtn.disabled = false; runBtn.classList.remove("running"); }
    }

    function draw() {
      var R = state.rfe[local.model], names = L.FEATURE_NAMES;
      listHost.innerHTML = ""; chartHost.innerHTML = "";
      runBtn.style.display = R && !R.partial ? "none" : "";
      if (!R) { note.textContent = "Press Run elimination to rank the 28 features on " + simTag().toLowerCase() + ". The linear SVR takes the longest (about half a minute on a laptop)."; return; }
      // the fit that ranks the features still in play: steps[i] was fit with
      // 28 - i features; R.final with the last two
      var removedSoFar = 28 - local.left;
      var removedAt = {};
      R.steps.forEach(function (s, i) { if (i < removedSoFar) removedAt[s.removed] = i + 1; });
      var cur = removedSoFar < 26 ? R.steps[removedSoFar] : R.final;
      var scoreOf = {};
      if (cur) cur.support.forEach(function (f, i) { scoreOf[f] = cur.scores[i]; });
      var maxS = 0;
      Object.keys(scoreOf).forEach(function (k) { maxS = Math.max(maxS, scoreOf[k]); });
      var rows = [];
      for (var j = 0; j < 28; j++) rows.push(j);
      rows.sort(function (a, b) {
        var ra = removedAt[a], rb = removedAt[b];
        if (!ra && !rb) return (scoreOf[b] || 0) - (scoreOf[a] || 0);
        if (!ra) return -1; if (!rb) return 1;
        return rb - ra;
      });
      var list = el("ol", { class: "rl-feats" });
      rows.forEach(function (j) {
        var gone = removedAt[j], sc = scoreOf[j];
        var li = el("li", { class: gone ? "gone" : (j < 5 ? "named" : "") }, [
          el("span", { class: "rl-fname", text: names[j] }),
          el("span", { class: "rl-fbar-wrap" }, [el("span", { class: "rl-fbar", style: "width:" + (gone || sc == null || !maxS ? 0 : sc / maxS * 100) + "%" })]),
          el("span", { class: "w-mono", text: gone ? "out at step " + gone : (sc == null ? "" : (local.model === "forest" ? "importance " : "|weight| ") + Number(sc).toPrecision(3)) })
        ]);
        list.appendChild(li);
      });
      listHost.appendChild(list);
      // final two-feature view
      if (R.kept) {
        var kept = R.kept;
        var D = state.data, Y = D.X.map(function (r) { return [r[kept[0]], r[kept[1]]]; });
        var ex = extent(Y.map(function (p) { return p[0]; })), ey = extent(Y.map(function (p) { return p[1]; }));
        var f2 = frame(chartHost, "rl-scatter", ex, ey, { xlabel: names[kept[0]] + " (standardized)", ylabel: names[kept[1]] + " (standardized)", aria: "All cashiers on the last two features" });
        var sil = viewSilhouette("rfe-" + local.model + "-" + state.seed, Y);
        Y.forEach(function (p, i) { f2.g.appendChild(svg("circle", { class: "rl-dot", cx: f2.sx(p[0]), cy: f2.sy(p[1]), r: 2.4, style: "fill:" + riskColor(D.d.y[i]) })); });
        sil.centers.forEach(function (c) { drawX(f2, c); });
        chartHost.appendChild(f2.svg);
        var paperS = { ols: 0.06615, svrlin: 0.12499, forest: 0.12209 }[local.model];
        note.textContent = "The last two features standing for " + modelLabel(local.model) + ": " + names[kept[0]] + " and " + names[kept[1]] + ". All " + comma(D.X.length) + " simulated cashiers drawn on them, with two k-means centers (×). Silhouette of that split: " + fx(sil.s, 3) + " on the page (" + simTag().toLowerCase() + "); the paper reports " + paperS + " for its own data.";
      } else note.textContent = "Eliminating… the list updates after each fit.";
    }
    onChange(function (w) { if (w === "seed" || w === "ready") draw(); });
    resizers.push(draw);
  });

  function drawX(f, c) {
    var x = f.sx(Math.max(f.x0, Math.min(f.x1, c[0]))), y = f.sy(Math.max(f.y0, Math.min(f.y1, c[1]))), s = 7;
    f.g.appendChild(svg("path", { class: "rl-center", d: "M" + (x - s) + " " + (y - s) + "L" + (x + s) + " " + (y + s) + "M" + (x - s) + " " + (y + s) + "L" + (x + s) + " " + (y - s) }));
  }

  /* ============================================================ demo 5: a map of 28 numbers */

  mount("rl-map", function (host) {
    var CFGS = L.TABLE2.filter(function (t) { return t.perplexity; });
    var local = { view: "tsne-5-10-250", custom: { perplexity: 30, learningRate: 200, nIter: 500 }, busy: false, live: null, liveIt: 0, alt: false };
    var opts = [{ value: "pca", label: "PCA" }].concat(CFGS.map(function (c) {
      return { value: c.id, label: "t-SNE " + c.perplexity + " · " + comma(c.learningRate) + " · " + comma(c.nIter), title: "Perplexity " + c.perplexity + ", learning rate " + c.learningRate + ", " + c.nIter + " iterations" };
    })).concat([{ value: "custom", label: "Your settings" }]);
    var viewSeg = seg(opts, local.view, function (v) { local.view = v; draw(); }, "View");
    host.appendChild(el("div", { class: "w-actions" }, [viewSeg]));
    var custom = el("div", { class: "rl-ctrls" });
    var pVals = [2, 5, 10, 30, 50], lrVals = [10, 50, 200, 1000], itVals = [250, 300, 500, 1000];
    custom.appendChild(range("Perplexity", 0, pVals.length - 1, 1, pVals.indexOf(30), function (i) { return String(pVals[i]); }, function (i) { local.custom.perplexity = pVals[i]; }));
    custom.appendChild(range("Learning rate", 0, lrVals.length - 1, 1, lrVals.indexOf(200), function (i) { return comma(lrVals[i]); }, function (i) { local.custom.learningRate = lrVals[i]; }));
    custom.appendChild(range("Iterations", 0, itVals.length - 1, 1, itVals.indexOf(500), function (i) { return comma(itVals[i]); }, function (i) { local.custom.nIter = itVals[i]; }));
    var status = el("span", { class: "w-mono", "aria-live": "polite" });
    var runBtn = el("button", { type: "button", class: "w-btn", text: "Run t-SNE", onclick: function () { compute(local.view === "custom" ? Object.assign({ id: "custom" }, local.custom) : cfgById(local.view)); } });
    custom.appendChild(el("div", { class: "w-actions" }, [runBtn, status]));
    host.appendChild(custom);
    var altRow = el("label", { class: "rl-check", "data-levels": "grad res" }, [el("input", { type: "checkbox", onchange: function (e) { local.alt = e.target.checked; draw(); } }), el("span", { text: " Color by the two clusters found in all 28 features instead of risk" })]);
    host.appendChild(altRow);
    var chartHost = el("div", { class: "rl-chart-host" });
    host.appendChild(chartHost);
    var leg = legendRisk();
    host.appendChild(leg);
    var readout = el("div", { class: "w-big", "aria-live": "polite" });
    host.appendChild(readout);
    var note = el("p", { class: "w-note" });
    host.appendChild(note);
    var kHost = el("div", { class: "rl-chart-host", "data-levels": "grad res" });
    host.appendChild(kHost);
    var kNote = el("p", { class: "w-note", "data-levels": "grad res" });
    host.appendChild(kNote);

    function cfgById(id) { for (var i = 0; i < CFGS.length; i++) if (CFGS[i].id === id) return CFGS[i]; return null; }
    function compute(cfg) {
      if (local.busy || !cfg) return;
      local.busy = true; runBtn.disabled = true; runBtn.classList.add("running");
      var id = cfg.id, startView = local.view;
      status.textContent = "Starting…";
      run({ cmd: "tsne", seed: state.seed, cfg: { perplexity: cfg.perplexity, learningRate: cfg.learningRate, nIter: cfg.nIter, seed: 1 } }, function (m) {
        local.live = m.Y; local.liveIt = m.it;
        status.textContent = "Iteration " + comma(m.it) + " of " + comma(cfg.nIter) + (m.it <= 250 ? " (early exaggeration)" : "");
        if (local.view === startView) draw(true);
      }).then(function (m) {
        state.tsne[id] = m.result;
        if (id === "custom") state.tsne.custom.cfg = Object.assign({}, cfg);
        local.live = null;
        status.textContent = "Finished " + comma(cfg.nIter) + " iterations in " + (m.ms / 1000).toFixed(1) + " s.";
        fin(); draw();
      }, function (err) { status.textContent = String(err); fin(); });
      function fin() { local.busy = false; runBtn.disabled = false; runBtn.classList.remove("running"); }
    }

    function draw(liveOnly) {
      var D = state.data, Y = null, label, paperS = null, t2;
      var isT = local.view !== "pca";
      custom.style.display = (local.view === "custom" || (isT && !state.tsne[local.view])) ? "" : "none";
      custom.querySelectorAll(".w-range").forEach(function (r) { r.style.display = local.view === "custom" ? "" : "none"; });
      if (local.view === "pca") {
        Y = pcaY(); label = "PCA"; paperS = 0.06615;
      } else {
        var T = state.tsne[local.view];
        if (T && (local.view !== "custom" || T.cfg)) Y = T.Y;
        else if (local.live) Y = local.live;
        t2 = cfgById(local.view);
        if (t2) paperS = t2.s;
        label = local.view === "custom" ? "t-SNE, your settings" : t2.label;
      }
      chartHost.innerHTML = "";
      if (!Y) {
        readout.textContent = "";
        note.textContent = "Press Run t-SNE to compute this view on " + simTag().toLowerCase() + " in your browser (about " + (local.view === "custom" ? Math.max(3, Math.round(local.custom.nIter / 120)) : 8) + " s on a laptop).";
        drawK();
        return;
      }
      var ex = isT ? robustExtent(Y.map(function (p) { return p[0]; })) : extent(Y.map(function (p) { return p[0]; }));
      var ey = isT ? robustExtent(Y.map(function (p) { return p[1]; })) : extent(Y.map(function (p) { return p[1]; }));
      var f = frame(chartHost, "rl-scatter", ex, ey, { noTicks: isT, xlim: isT ? ex : null, ylim: isT ? ey : null, xlabel: isT ? "t-SNE 1" : "Principal component 1", ylabel: isT ? "t-SNE 2" : "Principal component 2", aria: label + " of the simulated cashiers" });
      var lab28 = local.alt ? fullLabels() : null;
      var outside = 0;
      Y.forEach(function (p, i) {
        var fill = lab28 ? (lab28[i] ? "var(--accent)" : "var(--primary)") : riskColor(D.d.y[i]);
        var x = p[0], y = p[1], out = x < f.x0 || x > f.x1 || y < f.y0 || y > f.y1;
        if (out) { outside++; x = Math.max(f.x0, Math.min(f.x1, x)); y = Math.max(f.y0, Math.min(f.y1, y)); }
        f.g.appendChild(svg("circle", { class: "rl-dot" + (out ? " out" : ""), cx: f.sx(x), cy: f.sy(y), r: 2.3, style: "fill:" + fill }));
      });
      chartHost.appendChild(f.svg);
      leg.style.visibility = lab28 ? "hidden" : "";
      if (liveOnly && local.live && Y === local.live) {
        readout.textContent = "";
        note.textContent = "Iteration " + comma(local.liveIt) + (local.liveIt <= 250 ? ": the first 250 iterations exaggerate every attraction twelvefold, so clusters form and pull apart." : ": exaggeration off, the map settles.");
        return;
      }
      var sil = viewSilhouette(local.view + "-" + state.seed + (local.view === "custom" ? JSON.stringify(state.tsne.custom && state.tsne.custom.cfg) : ""), Y);
      sil.centers.forEach(function (c) { drawX(f, c); });
      var deep = state.level === "grad" || state.level === "res";
      var alt = deep ? L.silhouette(Y, fullLabels()) : null;
      if (deep && sil.full == null) sil.full = L.silhouette(state.data.X, sil.labels);
      readout.innerHTML = "";
      readout.appendChild(document.createTextNode("Silhouette: "));
      readout.appendChild(el("strong", { text: fx(sil.s, 3) }));
      readout.appendChild(document.createTextNode(paperS != null ? "   paper " + paperS : ""));
      var extra = "";
      if (isT && local.view !== "custom" && t2 && t2.nIter === 250) extra = " With 250 iterations, scikit-learn never leaves its early-exaggeration stage, so this map is the exaggerated layout.";
      if (outside) extra += " " + comma(outside) + " far-flung points sit beyond the frame and are drawn as rings on its edge.";
      note.textContent = label + ", " + comma(D.X.length) + " simulated cashiers colored by risk factor, with the two k-means centers found in this view (×). The page's silhouette scores that two-cluster split in this view." + extra + (deep ? " Two other readings of the paper's procedure: the clusters found in all 28 features, scored in this view, give " + fx(alt, 3) + "; the clusters found in this view, scored with distances in all 28 features, give " + fx(sil.full, 3) + "." : "");
      drawK();
    }
    var pcaCache = { seed: null, Y: null };
    function pcaY() { if (pcaCache.seed !== state.seed) { pcaCache = { seed: state.seed, Y: L.pca(state.data.X, 2).Y }; } return pcaCache.Y; }

    function drawK() {
      kHost.innerHTML = "";
      if (!state.kcurve) {
        kNote.innerHTML = "";
        kNote.appendChild(document.createTextNode("Silhouette against k on all 28 features: "));
        kNote.appendChild(el("button", { type: "button", class: "w-btn w-btn-quiet rl-small", text: "Compute for this chain", onclick: function () {
          kNote.textContent = "Computing k-means for k = 2 to 10…";
          run({ cmd: "kcurve", seed: state.seed }).then(function (m) { state.kcurve = m.result; drawK(); }, function (e) { kNote.textContent = String(e); });
        } }));
        return;
      }
      var C = state.kcurve, best = C[0];
      C.forEach(function (c) { if (c.s > best.s) best = c; });
      var f = frame(kHost, "rl-kcurve", [2, 10], [0, Math.max.apply(null, C.map(function (c) { return c.s; }))], { height: 200, xlim: [1.6, 10.4], ylim: [0, Math.ceil(best.s * 20 + 1) / 20], xlabel: "Number of clusters k", ylabel: "Silhouette", aria: "Silhouette of k-means against k" });
      var d = C.map(function (c, i) { return (i ? "L" : "M") + f.sx(c.k) + " " + f.sy(c.s); }).join("");
      f.g.appendChild(svg("path", { class: "rl-kline", d: d }));
      C.forEach(function (c) { f.g.appendChild(svg("circle", { class: "rl-pt" + (c === best ? " best" : ""), cx: f.sx(c.k), cy: f.sy(c.s), r: c === best ? 5 : 3.5 })); });
      kHost.appendChild(f.svg);
      kNote.textContent = "k-means on all 28 standardized features of " + simTag().toLowerCase() + ", k from 2 to 10, ten starts each. The highest silhouette is at k = " + best.k + " (" + fx(best.s, 3) + "). The paper ran the same sweep on its data and also found k = 2 best, which is why every view above is scored with two clusters.";
    }
    onChange(function (w) { if (w === "seed" || w === "ready" || w === "level") draw(); });
    resizers.push(function () { draw(); });
  });

  /* ------------------------------------------------------------ start */

  fetch(BASE + "precomputed.json").then(function (r) { return r.json(); }).then(function (j) {
    state.pre = j; adoptPre(); changed("ready");
  }).catch(function () { changed("ready"); });
})();

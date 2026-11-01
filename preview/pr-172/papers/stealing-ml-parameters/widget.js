/*
  Stealing machine learning parameters widget for /papers/stealing-ml-parameters/.
  Mount points: #sp-trace, #sp-ops, #sp-knn, #sp-models.
  Shared state: the selected model and the attack task.
  Every power trace is simulated by sidechannel-engine.js and labeled so.
*/
(function () {
  "use strict";

  var E = window.StealML;
  if (!E) return;

  var SVGNS = "http://www.w3.org/2000/svg";
  var BASE = (document.currentScript && document.currentScript.src)
    ? document.currentScript.src.replace(/widget\.js(\?.*)?$/, "")
    : "";

  /* ------------------------------------------------------------ state */

  var state = {
    model: "nn8",
    task: 2,
    seed: 1,
    level: window.PaperKit ? window.PaperKit.level() : "public",
    rows: null,
    attack: null       // precomputed Table I comparison
  };
  var listeners = [];
  function onChange(fn) { listeners.push(fn); }
  function changed(what) { listeners.forEach(function (fn) { fn(what); }); }
  document.addEventListener("paperlevel", function (e) { state.level = e.detail.level; changed("level"); });
  function deep() { return state.level === "grad" || state.level === "res"; }
  function atLeastUg() { return state.level === "ug" || deep(); }

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
    function build(opts) {
      wrap.innerHTML = ""; btns = [];
      opts.forEach(function (o) {
        var b = el("button", { type: "button", class: "seg-option", role: "radio", "aria-checked": String(o.value === value), text: o.label });
        if (o.title) b.title = o.title;
        if (o.levels) b.setAttribute("data-levels", o.levels);
        b.addEventListener("click", function () { if (b.disabled) return; value = o.value; set(o.value); onPick(o.value); });
        wrap.appendChild(b);
        btns.push({ b: b, v: o.value });
      });
    }
    function set(v) { value = v; btns.forEach(function (x) { x.b.setAttribute("aria-checked", String(x.v === v)); }); }
    build(options);
    wrap.set = set;
    wrap.get = function () { return value; };
    wrap.disable = function (v, off) { btns.forEach(function (x) { if (x.v === v) { x.b.disabled = off; x.b.classList.toggle("off", off); } }); };
    return wrap;
  }
  function labeled(label, control, levels) {
    var row = el("div", { class: "sp-ctl" }, [el("span", { class: "sp-ctl-label", text: label }), control]);
    if (levels) row.setAttribute("data-levels", levels);
    return row;
  }
  function pct(x, d) { return x == null ? "–" : (x * 100).toFixed(d == null ? 2 : d) + "%"; }
  function int(x) { return Math.round(x).toLocaleString("en-US"); }
  function words(n) { return ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"][n] || int(n); }

  var MODEL_KEYS = ["nn8", "nn10", "lr10", "lr8"];
  var MODEL_OPTS = MODEL_KEYS.map(function (k) { return { value: k, label: E.MODELS[k].short, title: E.MODELS[k].label }; });

  // Draw a long series as a min/max envelope, one column per pixel.
  function envelopePath(series, x0, w, yOf) {
    var n = series.length, cols = Math.max(1, Math.round(w)), top = "", bot = [];
    for (var c = 0; c < cols; c++) {
      var a = Math.floor(c * n / cols), b = Math.max(a + 1, Math.floor((c + 1) * n / cols)), lo = Infinity, hi = -Infinity;
      for (var i = a; i < b && i < n; i++) { var v = series[i]; if (v < lo) lo = v; if (v > hi) hi = v; }
      var x = (x0 + c * w / cols).toFixed(1);
      top += (c ? "L" : "M") + x + " " + yOf(hi).toFixed(1);
      bot.push(x + " " + yOf(lo).toFixed(1));
    }
    return top + "L" + bot.reverse().join("L") + "Z";
  }
  function linePath(series, x0, w, yOf) {
    var n = series.length, d = "";
    for (var i = 0; i < n; i++) d += (i ? "L" : "M") + (x0 + (n === 1 ? 0 : i * w / (n - 1))).toFixed(1) + " " + yOf(series[i]).toFixed(1);
    return d;
  }

  /* ------------------------------------------------------------ demo 1: the trace */

  function mountTrace(root) {
    root.classList.add("w-ready");
    var cmpOpts = [
      { value: 0, label: "Alone" },
      { value: 1, label: "Task 1 pair", title: "Neural network (8 nodes) against linear regression (λ = 10)" },
      { value: 2, label: "Task 2 pair", title: "8 hidden nodes against 10" },
      { value: 3, label: "Task 3 pair", title: "λ = 10 against λ = 8" }
    ];
    var PAIRS = { 1: ["nn8", "lr10"], 2: ["nn8", "nn10"], 3: ["lr10", "lr8"] };
    var cmp = 0, span = 5000;
    var mSeg = seg(MODEL_OPTS, state.model, function (v) { state.model = v; cmp = 0; cSeg.set(0); changed("model"); }, "Model on the chip");
    var cSeg = seg(cmpOpts, cmp, function (v) { cmp = v; if (v) { state.model = PAIRS[v][0]; mSeg.set(state.model); state.task = v; changed("task"); } draw(); }, "Compare");
    var zSeg = seg([{ value: 5000, label: "All 5,000" }, { value: 1000, label: "First 1,000" }, { value: 200, label: "First 200" }], span,
      function (v) { span = v; draw(); }, "Samples shown");
    var again = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "New capture" });
    again.addEventListener("click", function () { state.seed++; draw(); });
    var chart = svg("svg", { class: "sp-chart", role: "img" });
    var key = el("p", { class: "w-note sp-key" });
    var read = el("p", { class: "w-note" });
    root.appendChild(el("div", { class: "sp-ctrls" }, [
      labeled("Model", mSeg),
      labeled("Compare", cSeg),
      labeled("Show", zSeg, "ug grad res")
    ]));
    root.appendChild(chart);
    root.appendChild(key);
    root.appendChild(el("div", { class: "w-actions" }, [again]));
    root.appendChild(read);

    function draw() {
      var models = cmp ? PAIRS[cmp] : [state.model];
      var traces = models.map(function (m, i) { return E.trace(m, state.seed * 13 + i, E.DEFAULTS); });
      var W = chartWidth(chart), H = cmp ? 280 : 200, L = 40, R = 10, T = 12, B = 30;
      chart.setAttribute("viewBox", "0 0 " + W + " " + H); chart.innerHTML = "";
      var lo = Infinity, hi = -Infinity;
      traces.forEach(function (t) { for (var i = 0; i < span; i++) { if (t[i] < lo) lo = t[i]; if (t[i] > hi) hi = t[i]; } });
      lo = Math.floor(lo * 10) / 10; hi = Math.ceil(hi * 10) / 10;
      var rows = traces.length, rowH = (H - T - B) / rows;
      traces.forEach(function (t, ti) {
        var top = T + ti * rowH, h = rowH - (rows > 1 ? 24 : 0);
        var yOf = function (v) { return top + h - (v - lo) / (hi - lo) * h; };
        [lo, (lo + hi) / 2, hi].forEach(function (v) {
          chart.appendChild(svg("line", { x1: L, x2: W - R, y1: yOf(v), y2: yOf(v), class: "c-grid" }));
          chart.appendChild(svg("text", { x: L - 4, y: yOf(v) + 4, "text-anchor": "end", class: "c-tick" }, v.toFixed(1)));
        });
        var seriesShown = t.subarray(0, span);
        chart.appendChild(svg("path", { d: span > W ? envelopePath(seriesShown, L, W - L - R, yOf) : linePath(seriesShown, L, W - L - R, yOf), class: "sp-trace k" + ti }));
        if (span >= 1000) {
          // a moving average (about 1.7% of the window) brings out the repeating bumps
          var win = Math.max(3, Math.round(span / 60)), sm = [], acc = 0, cols = Math.round(W - L - R), q;
          for (q = 0; q < span; q++) { acc += seriesShown[q]; if (q >= win) acc -= seriesShown[q - win]; if (q >= win - 1) sm.push(acc / win); }
          var pts = [];
          for (q = 0; q < cols; q++) pts.push(sm[Math.floor(q * sm.length / cols)]);
          chart.appendChild(svg("path", { d: linePath(pts, L + (W - L - R) * (win / 2) / span, (W - L - R) * (1 - win / span), yOf), class: "sp-smooth" }));
        }
        chart.appendChild(svg("text", { x: L + 4, y: top + 11, class: "c-label" }, E.MODELS[models[ti]].short + (ti === 0 ? " · simulated" : "")));
      });
      for (var g = 0; g <= 5; g++) {
        var s = Math.round(g * span / 5), x = L + g * (W - L - R) / 5;
        chart.appendChild(svg("text", { x: x, y: H - 12, "text-anchor": g === 0 ? "start" : g === 5 ? "end" : "middle", class: "c-tick" }, int(s)));
      }
      chart.appendChild(svg("text", { x: W - R, y: H - 1, "text-anchor": "end", class: "c-label" }, "sample (13 clock cycles each)"));
      chart.setAttribute("aria-label", "Simulated power trace of " + models.map(function (m) { return E.MODELS[m].label; }).join(" and ") + " training on a microcontroller");
      key.innerHTML = "Simulated capture: one training epoch, power in arbitrary units against time, 5,000 samples as in the paper. The shaded band is every sample; the line is a moving average. " +
        (cmp ? "The two rows use the same scale." : "Press <strong>New capture</strong> for another run.");
      var c = E.opCounts(models[0]);
      var txt;
      if (state.level === "public" || state.level === "hs") {
        txt = cmp === 3 || (!cmp && E.MODELS[state.model].kind === "lr")
          ? "Linear regression finishes in about " + int(Math.round(c.cycles / 1300) * 100) + " samples and the chip goes quiet. Its two settings, λ = 8 and λ = 10, run exactly the same steps."
          : "One epoch of this network takes about " + int(Math.round(c.cycles / 1300) * 100) + " samples. Each repeating dip in the line marks one training example passing through the network and back.";
      } else {
        txt = models.map(function (m) { var k = E.opCounts(m); return E.MODELS[m].short + ": " + int(k.cycles) + " cycles per capture (" + int(k.counts.mul) + " multiplies, " + int(k.counts.add) + " adds)"; }).join("; ") + ". The scope keeps the first 5,000 samples of 13 cycles each (65,000 cycles)" +
          (models.indexOf("nn10") >= 0 ? ", so the 10-node network shows about seven of its ten examples." : models.indexOf("nn8") >= 0 ? ", just short of the 8-node network's full epoch." : ", so the regression finishes early and the rest of the capture is the idle loop.");
      }
      read.textContent = txt;
    }
    onChange(function (what) {
      if (what === "level") draw();
      if (what === "model" && !cmp) { mSeg.set(state.model); draw(); }
    });
    resizers.push(draw);
    draw();
  }

  /* ------------------------------------------------------------ demo 2: where the power goes */

  function mountOps(root) {
    root.classList.add("w-ready");
    var diff = false, view = 240;
    var mSeg = seg(MODEL_OPTS, state.model, function (v) { state.model = v; changed("model"); }, "Model on the chip");
    var dBtn = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "Show λ = 8 minus λ = 10" });
    dBtn.addEventListener("click", function () { diff = !diff; draw(); });
    var vSeg = seg([{ value: 240, label: "240 cycles" }, { value: 1200, label: "1,200" }, { value: 4000, label: "4,000" }], view, function (v) { view = v; draw(); }, "Cycles shown");
    var chart = svg("svg", { class: "sp-chart", role: "img" });
    var key = el("p", { class: "w-note sp-key" });
    var read = el("p", { class: "w-note" });
    var tableWrap = el("div", { class: "sp-table-wrap", "data-levels": "ug grad res" });
    root.appendChild(el("div", { class: "sp-ctrls" }, [labeled("Model", mSeg), labeled("Window", vSeg, "ug grad res")]));
    root.appendChild(chart);
    root.appendChild(key);
    root.appendChild(el("div", { class: "w-actions" }, [dBtn]));
    root.appendChild(read);
    root.appendChild(tableWrap);

    var COLORS = { ld: "op-ld", st: "op-st", add: "op-add", mul: "op-mul", div: "op-div", exp: "op-exp", cmp: "op-cmp" };
    key.innerHTML = E.OP_ORDER.map(function (t) { return '<span class="sp-sw ' + COLORS[t] + '"></span>' + E.OPS[t].name; }).join(" &nbsp; ") +
      " · bar height = power drawn in that clock cycle (simulated, no noise)";

    function draw() {
      var isLr = E.MODELS[state.model].kind === "lr";
      dBtn.style.display = isLr ? "" : "none";
      if (!isLr) diff = false;
      dBtn.textContent = diff ? "Show the power again" : "Show λ = 8 minus λ = 10";
      var W = chartWidth(chart), H = 190, L = 40, R = 10, T = 10, B = 26;
      chart.setAttribute("viewBox", "0 0 " + W + " " + H); chart.innerHTML = "";
      var n = view, a = E.cycles(state.model, 1, n), bw = (W - L - R) / n, ph = H - T - B;
      if (diff) {
        var b = E.cycles(state.model === "lr8" ? "lr10" : "lr8", 1, n);
        var sign = state.model === "lr8" ? 1 : -1, maxd = 0.05, dvals = [], changedCycles = 0;
        for (var i = 0; i < n; i++) { var dv = sign * (a.power[i] - b.power[i]); dvals.push(dv); if (Math.abs(dv) > 1e-9) changedCycles++; }
        var mid = T + ph / 2;
        chart.appendChild(svg("line", { x1: L, x2: W - R, y1: mid, y2: mid, class: "c-grid" }));
        [-maxd, maxd].forEach(function (v) { chart.appendChild(svg("text", { x: L - 4, y: mid - v / maxd * ph / 2 + 4, "text-anchor": "end", class: "c-tick" }, (v > 0 ? "+" : "") + v.toFixed(2))); });
        dvals.forEach(function (dv, i) {
          if (!dv) return;
          var hgt = Math.min(1, Math.abs(dv) / maxd) * ph / 2;
          chart.appendChild(svg("rect", { x: L + i * bw, width: Math.max(bw, 1), y: dv > 0 ? mid - hgt : mid, height: hgt, class: "sp-diff" }));
        });
        read.textContent = "Same ten training rows, same steps: the two settings differ in " + int(changedCycles) + " of these " + int(n) +
          " cycles, and only by a few set bits in a stored number (each bit is worth " + E.HW_GAIN + " units here). On a real chip, measurement noise is larger than these bumps.";
      } else {
        var top = 1.15;
        [0, 0.5, 1].forEach(function (v) {
          var y = T + ph - v / top * ph;
          chart.appendChild(svg("line", { x1: L, x2: W - R, y1: y, y2: y, class: "c-grid" }));
          chart.appendChild(svg("text", { x: L - 4, y: y + 4, "text-anchor": "end", class: "c-tick" }, v.toFixed(1)));
        });
        if (n <= 1200) {
          for (var j = 0; j < n; j++) {
            var hh = a.power[j] / top * ph;
            chart.appendChild(svg("rect", { x: L + j * bw, width: Math.max(bw - (n <= 240 ? 0.3 : 0), 0.6), y: T + ph - hh, height: hh, class: "sp-bar " + COLORS[a.type[j]] }));
          }
        } else {
          // one column per pixel, colored by the commonest operation
          var cols = Math.round(W - L - R);
          for (var c = 0; c < cols; c++) {
            var s0 = Math.floor(c * n / cols), s1 = Math.floor((c + 1) * n / cols), sum = 0, cnt = {}, best = "ld";
            for (var q = s0; q < s1; q++) { sum += a.power[q]; cnt[a.type[q]] = (cnt[a.type[q]] || 0) + 1; if (cnt[a.type[q]] > (cnt[best] || 0)) best = a.type[q]; }
            var avg = sum / Math.max(1, s1 - s0), h2 = avg / top * ph;
            chart.appendChild(svg("rect", { x: L + c, width: 1, y: T + ph - h2, height: h2, class: "sp-bar " + COLORS[best] }));
          }
        }
        var M = E.MODELS[state.model];
        read.textContent = M.kind === "nn"
          ? "The network's training loop is a long run of multiply-then-add pairs, one per connection, broken by a compare (ReLU) after each first-layer node and an exponential and divide (sigmoid) after each second-layer node. With " + M.h + " nodes per layer, those landmarks repeat on a different beat than with " + (M.h === 8 ? 10 : 8) + "."
          : "Linear regression starts by storing λ on the diagonal of a six-by-six matrix, then adds up products of the training rows. The rest of its work is the same whatever λ is.";
      }
      for (var g = 0; g <= 4; g++) {
        chart.appendChild(svg("text", { x: L + g * (W - L - R) / 4, y: H - 8, "text-anchor": g === 0 ? "start" : g === 4 ? "end" : "middle", class: "c-tick" }, int(g * n / 4)));
      }
      chart.setAttribute("aria-label", "Cycle-by-cycle simulated power of " + E.MODELS[state.model].label);
      drawTable();
    }
    function drawTable() {
      var html = '<table class="results-table sp-ops-table"><caption class="w-note">Operations in one simulated capture (one epoch of ten examples, or one fit and scoring of the 143 held-out rows).</caption><thead><tr><th>Model</th>' +
        E.OP_ORDER.map(function (t) { return "<th>" + (E.OPS[t].name === "multiply" ? "multiplies" : E.OPS[t].name + "s") + "</th>"; }).join("") + "<th>cycles</th></tr></thead><tbody>";
      MODEL_KEYS.forEach(function (m) {
        var c = E.opCounts(m);
        html += "<tr" + (m === state.model ? ' class="sp-current"' : "") + "><td>" + E.MODELS[m].short + "</td>" +
          E.OP_ORDER.map(function (t) { return "<td>" + int(c.counts[t]) + "</td>"; }).join("") + "<td>" + int(c.cycles) + "</td></tr>";
      });
      tableWrap.innerHTML = html + "</tbody></table>";
    }
    onChange(function (what) { if (what === "model") { mSeg.set(state.model); draw(); } });
    resizers.push(draw);
    draw();
  }

  /* ------------------------------------------------------------ demo 3: the attack */

  var worker = null;
  function getWorker() {
    if (worker) return worker;
    try { worker = new Worker(BASE + "knn-worker.js"); } catch (e) { worker = null; }
    return worker;
  }

  function mountKnn(root) {
    root.classList.add("w-ready");
    var cfg = { metric: "euclid", dims: 50, k: 3, per: 100, same: true, noise: 1, jitter: 200 };
    var running = false;
    var tSeg = seg([1, 2, 3].map(function (t) { return { value: t, label: "Task " + t, title: E.TASKS[t].label }; }), state.task, function (v) { state.task = v; changed("task"); }, "Task");
    var mSeg = seg([{ value: "euclid", label: "Euclidean" }, { value: "dtw", label: "DTW", title: "Dynamic time warping" }], cfg.metric, function (v) { cfg.metric = v; fixDims(); paperRef(); }, "Distance");
    var dSeg = seg([5000, 500, 50, 10].map(function (d) { return { value: d, label: int(d) }; }), cfg.dims, function (v) { cfg.dims = v; paperRef(); }, "Points per trace");
    var kSeg = seg([3, 5].map(function (k) { return { value: k, label: "k = " + k }; }), cfg.k, function (v) { cfg.k = v; paperRef(); }, "Neighbors");
    var pSeg = seg([{ value: 100, label: "100" }, { value: 300, label: "300" }, { value: 600, label: "600 (paper)" }], cfg.per, function (v) { cfg.per = v; }, "Captures per model");
    var sSeg = seg([{ value: true, label: "Same rows" }, { value: false, label: "Fresh rows" }], cfg.same, function (v) { cfg.same = v; }, "Training rows per capture");
    var nSeg = seg([{ value: 0.5, label: "Half" }, { value: 1, label: "Default" }, { value: 2, label: "Double" }, { value: 4, label: "4×" }], cfg.noise, function (v) { cfg.noise = v; }, "Noise");
    var jSeg = seg([{ value: 0, label: "Aligned" }, { value: 200, label: "≤ 200 cycles" }, { value: 3000, label: "≤ 3,000" }], cfg.jitter, function (v) { cfg.jitter = v; }, "Capture start offset");
    var run = el("button", { type: "button", class: "w-btn", text: "Run the attack" });
    var status = el("p", { class: "w-note sp-status", "aria-live": "polite" });
    var big = el("p", { class: "w-big" });
    var ref = el("p", { class: "w-note" });
    var conf = el("div", { class: "sp-table-wrap" });
    var tableWrap = el("div", { class: "sp-table-wrap", "data-levels": "ug grad res" });
    root.appendChild(el("div", { class: "sp-ctrls" }, [
      labeled("Task", tSeg),
      labeled("Distance", mSeg, "ug grad res"),
      labeled("Points", dSeg, "ug grad res"),
      labeled("Neighbors", kSeg, "grad res"),
      labeled("Captures", pSeg, "hs ug grad res"),
      labeled("Rows", sSeg, "grad res"),
      labeled("Noise", nSeg, "grad res"),
      labeled("Start offset", jSeg, "grad res")
    ]));
    root.appendChild(el("div", { class: "w-actions" }, [run, status]));
    root.appendChild(big);
    root.appendChild(ref);
    root.appendChild(conf);
    root.appendChild(tableWrap);

    function fixDims() {
      var dtwOnly = cfg.metric === "dtw";
      [5000, 500].forEach(function (d) { dSeg.disable(d, dtwOnly); });
      if (dtwOnly && cfg.dims > 50) { cfg.dims = 50; dSeg.set(50); }
    }
    function tableRow() {
      for (var i = 0; i < E.CONFIGS.length; i++) {
        var c = E.CONFIGS[i];
        if (c.metric === cfg.metric && c.dims === cfg.dims && c.k === cfg.k) return i;
      }
      return -1;
    }
    function paperRef() {
      var i = tableRow();
      ref.textContent = i >= 0
        ? "Paper, Table I (real ChipWhisperer traces, 600 captures per model): " + pct(E.TABLE1[i][state.task - 1]) + " for this task and setting."
        : "The paper did not test this combination of distance, points, and neighbors.";
      drawTable();
    }
    function opts() {
      var o = {};
      Object.keys(E.DEFAULTS).forEach(function (k) { o[k] = E.DEFAULTS[k]; });
      o.same = cfg.same; o.jitter = cfg.jitter;
      o.noise = E.DEFAULTS.noise * cfg.noise; o.meas = E.DEFAULTS.meas * cfg.noise;
      return o;
    }
    function show(r, t0) {
      var T = E.TASKS[state.task];
      big.innerHTML = "Accuracy <strong>" + pct(r.accuracy, 1) + "</strong> (" + int(r.correct) + " of " + int(r.nTest) + " held-out captures, simulated)";
      conf.innerHTML = '<table class="results-table sp-conf"><caption class="w-note">Held-out captures by true model (rows) and the attack\'s guess (columns).</caption><thead><tr><th></th><th>guessed ' + T.names[0] + "</th><th>guessed " + T.names[1] + "</th></tr></thead><tbody>" +
        [0, 1].map(function (i) { return "<tr><th>" + T.names[i] + "</th><td>" + r.confusion[i][0] + "</td><td>" + r.confusion[i][1] + "</td></tr>"; }).join("") + "</tbody></table>";
      status.textContent = "Done in " + ((Date.now() - t0) / 1000).toFixed(1) + " s on your device. Chance is 50%.";
    }
    function go() {
      if (running) return;
      running = true; run.disabled = true; run.classList.add("running"); run.textContent = "Running…";
      big.textContent = ""; conf.innerHTML = "";
      var t0 = Date.now(), msg = {
        rows: state.rows, task: state.task, perModel: cfg.per, seed: state.seed, opts: opts(),
        configs: [{ metric: cfg.metric, dims: cfg.dims, k: cfg.k }]
      };
      function finish() { running = false; run.disabled = false; run.classList.remove("running"); run.textContent = "Run the attack"; }
      var w = getWorker();
      if (!w) {
        status.textContent = "Capturing and classifying…";
        setTimeout(function () {
          var built = E.buildTask(msg.task, msg.perModel, msg.seed, msg.opts), sp = E.split(built.labels.length, msg.seed);
          show(E.classify(built, sp, cfg.dims, cfg.k, cfg.metric), t0); finish();
        }, 30);
        return;
      }
      w.onmessage = function (e) {
        var m = e.data;
        if (m.type === "progress") status.textContent = m.stage === "capture" ? "Simulating " + int(m.total) + " captures…" : "Classifying: " + m.done + " of " + m.total + " held-out captures";
        else if (m.type === "result") show(m.result, t0);
        else if (m.type === "done") finish();
      };
      w.onerror = function () { status.textContent = "The attack could not run in a background thread here."; finish(); };
      w.postMessage(msg);
    }
    run.addEventListener("click", go);

    function drawTable() {
      if (!state.attack) { tableWrap.innerHTML = ""; return; }
      var cur = tableRow(), A = state.attack;
      var html = '<table class="results-table sp-t1"><caption class="w-note">Table I as printed beside this page\'s simulation (600 captures per model, default conditions; ' +
        'Task 1 pools both networks against both regressions). Simulated values are the page\'s, not the paper\'s.</caption>' +
        "<thead><tr><th>Distance</th><th>Points</th><th>k</th><th>Task 1 paper</th><th>Task 1 page</th><th>Task 2 paper</th><th>Task 2 page</th><th>Task 3 paper</th><th>Task 3 page</th>" +
        (state.level === "res" ? "<th>Task 2 page, fresh rows</th><th>Task 3 page, fresh rows</th>" : "") + "</tr></thead><tbody>";
      E.CONFIGS.forEach(function (c, i) {
        html += "<tr" + (i === cur ? ' class="sp-current"' : "") + "><td>" + (c.metric === "dtw" ? "DTW" : "Euclidean") + "</td><td>" + int(c.dims) + "</td><td>" + c.k + "</td>";
        [0, 1, 2].forEach(function (t) {
          html += "<td>" + E.TABLE1[i][t].toFixed(4) + "</td><td class=\"sp-sim\">" + A.same.tasks[t + 1][i].acc.toFixed(4) + "</td>";
        });
        if (state.level === "res") html += "<td class=\"sp-sim\">" + A.fresh.tasks[2][i].acc.toFixed(4) + "</td><td class=\"sp-sim\">" + A.fresh.tasks[3][i].acc.toFixed(4) + "</td>";
        html += "</tr>";
      });
      tableWrap.innerHTML = html + "</tbody></table>";
    }
    onChange(function (what) {
      if (what === "task") { tSeg.set(state.task); paperRef(); big.textContent = ""; conf.innerHTML = ""; status.textContent = ""; }
      if (what === "level" || what === "attack") drawTable();
    });
    fixDims();
    paperRef();
  }

  /* ------------------------------------------------------------ demo 4: the models */

  function mountModels(root) {
    root.classList.add("w-ready");
    var variant = "board", logLam = -2;
    var SNAPS = [-2, Math.log10(8), 1, 2];
    var vSeg = seg([{ value: "board", label: "Board copy: 6 features, 713 rows" }, { value: "full", label: "Full table: 8 features, 768 rows" }], variant,
      function (v) { variant = v; draw(); }, "Data");
    var slider = el("input", { type: "range", min: "-2", max: "4", step: "0.01", value: String(logLam), "aria-label": "Ridge penalty λ (log scale)" });
    var out = el("output", {});
    slider.addEventListener("input", function () {
      var v = parseFloat(slider.value);
      SNAPS.forEach(function (s) { if (Math.abs(v - s) < 0.06) v = s; });
      logLam = v; draw();
    });
    var presets = el("div", { class: "w-actions" }, [0.01, 8, 10, 100].map(function (l) {
      var b = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "λ = " + l });
      b.addEventListener("click", function () { logLam = Math.log10(l); slider.value = String(logLam); draw(); });
      return b;
    }));
    var big = el("p", { class: "w-big" });
    var ref = el("p", { class: "w-note" });
    var chart = svg("svg", { class: "sp-chart", role: "img", "aria-label": "Ridge regression accuracy against λ for both copies of the data" });

    var nnHead = el("h3", { class: "sp-sub", text: "The neural networks" });
    var scSeg = seg([{ value: "255", label: "Bytes ÷ 255" }, { value: "z", label: "Standardized" }], "255", function () {}, "Input scaling");
    var trainBtns = el("div", { class: "w-actions" });
    var nnOut = el("p", { class: "w-big" });
    var nnNote = el("p", { class: "w-note" });
    var nnSeed = 2;   // run 1 of the 8-node network is one of the rare all-diabetic runs; start at a typical one
    [8, 10].forEach(function (h) {
      var b = el("button", { type: "button", class: "w-btn", text: "Train " + h + " nodes" });
      b.addEventListener("click", function () {
        var r = E.nnTrain({ hidden: h, seed: nnSeed, scale: scSeg.get(), curve: true });
        nnOut.innerHTML = h + " nodes per hidden layer, run " + nnSeed + ": accuracy <strong>" + pct(r.accuracy, 1) + "</strong> (" + r.correct + " of " + r.nTest + " held-out rows; trained on your device)";
        var maj = 93 / 143;
        nnNote.textContent = (r.predictedPositive === 0
          ? "This run labels every held-out row as not diabetic, which is right for 93 of 143 rows (65.0%). "
          : r.predictedPositive === r.nTest
            ? "This run labels every held-out row as diabetic, which is right for only 50 of 143 rows (35.0%). "
            : "This run labels " + r.predictedPositive + " of the 143 held-out rows as diabetic. ") +
          "The paper reports about 75% for 8 nodes and about 72% for 10." +
          (r.accuracy <= maj + 1e-9 ? " Press again for a different random start." : "");
        nnSeed++;
      });
      trainBtns.appendChild(b);
    });

    root.appendChild(el("div", { class: "sp-ctrls" }, [labeled("Data", vSeg, "ug grad res")]));
    root.appendChild(el("div", { class: "w-range" }, [el("span", { text: "λ (log scale)" }), slider, out]));
    root.appendChild(presets);
    root.appendChild(big);
    root.appendChild(ref);
    root.appendChild(chart);
    root.appendChild(nnHead);
    root.appendChild(el("div", { class: "sp-ctrls" }, [labeled("Inputs", scSeg, "grad res")]));
    root.appendChild(trainBtns);
    root.appendChild(nnOut);
    root.appendChild(nnNote);

    var curves = null;
    function buildCurves() {
      curves = {};
      ["board", "full"].forEach(function (v) {
        var pts = [];
        for (var x = -2; x <= 4.0001; x += 0.05) pts.push([x, E.ridgeAccuracy(v, Math.pow(10, x)).accuracy]);
        curves[v] = pts;
      });
    }
    function lamText(l) { return l >= 100 ? int(l) : l >= 1 ? (Math.round(l * 100) / 100).toString() : l.toFixed(2); }
    function draw() {
      if (!state.rows) return;
      if (!curves) buildCurves();
      var lam = Math.pow(10, logLam);
      out.textContent = lamText(lam);
      var r = E.ridgeAccuracy(variant, lam);
      big.innerHTML = "Ridge regression, λ = " + lamText(lam) + ": accuracy <strong>" + pct(r.accuracy) + "</strong> (" + r.correct + " of " + r.nTest + " held-out rows)";
      var isPaperLam = Math.abs(lam - 0.01) < 1e-9 || Math.abs(lam - 100) < 1e-6;
      var paperVal = Math.abs(lam - 0.01) < 1e-9 ? "72.73%" : "71.43%";
      ref.textContent = isPaperLam
        ? "The paper reports " + paperVal + " at this λ. " + (variant === "full"
          ? "This copy (all eight features, all 768 rows, first 614 to train) reproduces it exactly."
          : "The six-feature board copy gives 74.13% at every λ here; switch to the full table to see the paper's number.")
        : "The paper reports two values: 72.73% at λ = 0.01 and 71.43% at λ = 100.";
      var W = chartWidth(chart), H = 200, L = 46, R = 12, T = 12, B = 30;
      chart.setAttribute("viewBox", "0 0 " + W + " " + H); chart.innerHTML = "";
      var lo = 0.68, hi = 0.76;
      var xOf = function (x) { return L + (x + 2) / 6 * (W - L - R); }, yOf = function (v) { return T + (hi - v) / (hi - lo) * (H - T - B); };
      [0.68, 0.70, 0.72, 0.74, 0.76].forEach(function (v) {
        chart.appendChild(svg("line", { x1: L, x2: W - R, y1: yOf(v), y2: yOf(v), class: "c-grid" }));
        chart.appendChild(svg("text", { x: L - 4, y: yOf(v) + 4, "text-anchor": "end", class: "c-tick" }, Math.round(v * 100) + "%"));
      });
      [-2, -1, 0, 1, 2, 3, 4].forEach(function (x) {
        chart.appendChild(svg("text", { x: xOf(x), y: H - 12, "text-anchor": "middle", class: "c-tick" }, x < 0 ? (x === -2 ? "0.01" : "0.1") : int(Math.pow(10, x))));
      });
      chart.appendChild(svg("text", { x: W - R, y: H - 1, "text-anchor": "end", class: "c-label" }, "λ"));
      ["board", "full"].forEach(function (v) {
        var d = "";
        curves[v].forEach(function (p, i) { d += (i ? "L" : "M") + xOf(p[0]).toFixed(1) + " " + yOf(Math.max(lo, Math.min(hi, p[1]))).toFixed(1); });
        chart.appendChild(svg("path", { d: d, class: "sp-curve" + (v === variant ? " on" : "") + (v === "full" ? " full" : "") }));
      });
      chart.appendChild(svg("text", { x: W - R, y: yOf(0.7413) - 5, "text-anchor": "end", class: "c-label" }, "board copy"));
      chart.appendChild(svg("text", { x: W - R, y: yOf(0.7273) + 14, "text-anchor": "end", class: "c-label" }, "full table"));
      [[0.01, 0.7273], [100, 0.7143]].forEach(function (p) {
        var x = xOf(Math.log10(p[0])), y = yOf(p[1]);
        chart.appendChild(svg("circle", { cx: x, cy: y, r: 5, class: "sp-paper" }));
        chart.appendChild(svg("text", { x: x + 8, y: y + 14, class: "c-label" }, "paper " + (p[1] * 100).toFixed(2) + "%"));
      });
      chart.appendChild(svg("line", { x1: xOf(logLam), x2: xOf(logLam), y1: T, y2: H - B, class: "c-ref" }));
    }
    onChange(function (what) { if (what === "data") draw(); });
    resizers.push(draw);
    draw();
  }

  /* ------------------------------------------------------------ boot */

  var MOUNTS = { "sp-trace": mountTrace, "sp-ops": mountOps, "sp-knn": mountKnn, "sp-models": mountModels };
  function boot() {
    fetch(BASE + "pima.json").then(function (r) { return r.json(); }).then(function (j) {
      state.rows = j.rows;
      E.setData(j.rows);
      Object.keys(MOUNTS).forEach(function (id) {
        var node = document.getElementById(id);
        if (node) {
          try { MOUNTS[id](node); } catch (err) { node.appendChild(el("p", { class: "w-note", text: "This demo could not start: " + err.message })); }
        }
      });
      changed("data");
      return fetch(BASE + "attack-data.json");
    }).then(function (r) { return r.json(); }).then(function (j) { state.attack = j; changed("attack"); })
      .catch(function (err) { if (window.console) console.warn("stealing-ml-parameters:", err); });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();

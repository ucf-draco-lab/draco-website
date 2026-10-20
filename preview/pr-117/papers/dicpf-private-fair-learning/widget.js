/*
  DicPF widget for /papers/dicpf-private-fair-learning/.
  Mount points: #dp-filter, #dp-train, #dp-sweep, #dp-attack, #dp-tables.
  Shared state: the fairness threshold rho and the learner mode, so every demo uses the
  same aggregated dictionary. All computation runs in dicpf-engine.js on the authors'
  Communities and Crime files and the dictionaries their Python script learns.
*/
(function () {
  "use strict";

  var E = window.DicPF;
  if (!E) return;

  var SVGNS = "http://www.w3.org/2000/svg";
  var BASE = (document.currentScript && document.currentScript.src)
    ? document.currentScript.src.replace(/widget\.js(\?.*)?$/, "")
    : "";

  /* ------------------------------------------------------------ paper values */

  // Tables III to V as printed: [method, group, SP mean, SP sd, error mean, error sd]
  var TABLES = {
    crime: { label: "Community Crime", rho: 0.01, rows: [
      ["FRR", "Non-private", .3062, .0452, .1102, .0128], ["FKR", "Non-private", .0968, .0722, .1208, .0054],
      ["FGR", "Non-private", .0898, .0971, .1166, .0189], ["FPCA1", "Non-private", .0859, .0479, .1731, .0089],
      ["FPCA2", "Non-private", .0755, .0293, .1476, .0122], ["LFR", "Non-private", .0738, .0377, .1264, .0068],
      ["DFRR", "Semi-private", .0466, .0117, .1064, .0092], ["DFKRR", "Semi-private", .0695, .0181, .1216, .0143],
      ["DFGR", "Semi-private", .0650, .0198, .1202, .0690], ["DFPCA", "Semi-private", .0289, .0502, .1351, .0111],
      ["z-Sparse", "Private", .0189, .0151, .1299, .0614]] },
    credit: { label: "Credit Card", rho: 0.1, rows: [
      ["FRR", "Non-private", .0994, .0016, .2340, .0058], ["FKR", "Non-private", .0079, .0011, .2001, .0054],
      ["FGR", "Non-private", .0779, .0571, .2412, .0469], ["FPCA1", "Non-private", .1716, .0149, .4025, .0382],
      ["FPCA2", "Non-private", .0981, .0164, .3224, .0045], ["LFR", "Non-private", .0288, .0132, .2835, .0051],
      ["DFRR", "Semi-private", .0118, .0006, .2283, .0062], ["DFKRR", "Semi-private", .0085, .0015, .1823, .0092],
      ["DFGR", "Semi-private", .0494, .0601, .2244, .0382], ["DFPCA", "Semi-private", .0344, .0061, .2304, .0041],
      ["z-Sparse", "Private", .0076, .0063, .2388, .0206]] },
    compas: { label: "COMPAS", rho: 0.25, rows: [
      ["FRR", "Non-private", .0515, .0042, .2276, .0040], ["FKR", "Non-private", .0041, .0013, .2190, .0089],
      ["FGR", "Non-private", .0408, .0162, .2428, .0917], ["FPCA1", "Non-private", .2806, .0182, .3204, .1032],
      ["FPCA2", "Non-private", .1719, .0317, .2390, .0278], ["LFR", "Non-private", .0182, .0211, .2496, .0044],
      ["DFRR", "Semi-private", .0078, .0041, .2302, .0045], ["DFKRR", "Semi-private", .0034, .0015, .2152, .0093],
      ["DFGR", "Semi-private", .0374, .0645, .2617, .0509], ["DFPCA", "Semi-private", .0081, .0046, .2279, .0046],
      ["z-Sparse", "Private", .0067, .0049, .2337, .0271]] }
  };
  var PAPER = { sp: 0.0189, spSd: 0.0151, err: 0.1299, errSd: 0.0614 };

  /* ------------------------------------------------------------ state */

  var state = {
    rho: 0.01,
    mode: "described",
    level: window.PaperKit ? window.PaperKit.level() : "public",
    D: null, covs: null, fair: null, Pall: null, last: null
  };
  var listeners = [];
  function onChange(fn) { listeners.push(fn); }
  function changed(what) { listeners.forEach(function (fn) { fn(what); }); }
  document.addEventListener("paperlevel", function (e) { state.level = e.detail.level; changed("level"); });
  function deep() { return state.level === "grad" || state.level === "res"; }
  function atLeastUg() { return state.level === "ug" || deep(); }
  function plain() { return state.level === "public" || state.level === "hs"; }

  function rebuildFair() {
    state.fair = E.fairDictionary(state.D, state.covs, state.rho);
    state.Pall = state.fair.W.length ? E.allRows(state.D, state.fair.W) : null;
  }

  /* ------------------------------------------------------------ helpers */

  function el(tag, attrs, kids) {
    var node = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === "text") node.textContent = attrs[k];
      else if (k === "html") node.innerHTML = attrs[k];
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
    var wrap = el("div", { class: "seg", role: "radiogroup", "aria-label": label }), btns = [];
    options.forEach(function (o) {
      var b = el("button", { type: "button", class: "seg-option", role: "radio", "aria-checked": String(o.value === value), text: o.label });
      if (o.title) b.title = o.title;
      b.addEventListener("click", function () { set(o.value); onPick(o.value); });
      wrap.appendChild(b); btns.push({ b: b, v: o.value });
    });
    function set(v) { value = v; btns.forEach(function (x) { x.b.setAttribute("aria-checked", String(x.v === v)); }); }
    wrap.set = set;
    return wrap;
  }
  function labeled(label, control, levels) {
    var row = el("div", { class: "dp-ctl" }, [el("span", { class: "dp-ctl-label", text: label }), control]);
    if (levels) row.setAttribute("data-levels", levels);
    return row;
  }
  function pct(x, d) { return x == null || isNaN(x) ? "–" : (x * 100).toFixed(d == null ? 1 : d) + "%"; }
  function f4(x) { return x == null || isNaN(x) ? "–" : x.toFixed(4).replace(/^0\./, ".").replace(/^-0\./, "−."); }
  function later(fn) { setTimeout(fn, 16); }

  // Threshold slider on a log scale, shared by the demos.
  var RHO_STEPS = [0.001, 0.002, 0.003, 0.005, 0.0075, 0.01, 0.015, 0.02, 0.03, 0.05, 0.075, 0.1, 1];
  function rhoText(r) { return r >= 1 ? "no filter" : String(r); }
  function rhoControl() {
    var wrap = el("div", { class: "w-range" });
    var input = el("input", { type: "range", min: "0", max: String(RHO_STEPS.length - 1), step: "1", "aria-label": "Fairness threshold rho" });
    var out = el("output");
    function sync() { var i = RHO_STEPS.indexOf(state.rho); input.value = String(i < 0 ? 5 : i); out.textContent = rhoText(state.rho); }
    input.addEventListener("input", function () { state.rho = RHO_STEPS[+input.value]; out.textContent = rhoText(state.rho); });
    input.addEventListener("change", function () { rebuildFair(); changed("rho"); });
    wrap.appendChild(el("span", { class: "dp-rho-label", html: plain() ? "Strictness" : "Threshold ρ" }));
    wrap.appendChild(input); wrap.appendChild(out);
    onChange(function (w) { if (w === "rho") sync(); if (w === "level") wrap.firstChild.innerHTML = plain() ? "Strictness" : "Threshold ρ"; });
    sync();
    return wrap;
  }
  function modeControl() {
    var s = seg([
      { value: "described", label: "As described", title: "Every step updates a coordinate drawn from all k (Section V)" },
      { value: "released", label: "Released code", title: "Sparsemodel.m as published: after the first step only coefficient 1 is updated" }
    ], state.mode, function (v) { state.mode = v; changed("mode"); }, "Learner");
    onChange(function (w) { if (w === "mode") s.set(state.mode); });
    return labeled("Learner", s, "ug grad res");
  }

  /* ------------------------------------------------------------ demo 1: the filter */

  function mountFilter(root) {
    root.classList.add("w-ready");
    var chart = svg("svg", { class: "dp-chart", role: "img" });
    var read = el("p", { class: "w-big" });
    var note = el("p", { class: "w-note" });
    root.appendChild(el("div", { class: "dp-ctrls" }, [rhoControl()]));
    root.appendChild(chart);
    root.appendChild(read);
    root.appendChild(note);

    function draw() {
      var D = state.D, covs = state.covs, W = chartWidth(chart);
      var H = 260, L = 46, R = 10, T = 26, B = 34, gap = 14;
      chart.setAttribute("viewBox", "0 0 " + W + " " + H); chart.innerHTML = "";
      var maxAbs = 0;
      covs.forEach(function (c) { c.forEach(function (v) { if (Math.abs(v) > maxAbs) maxAbs = Math.abs(v); }); });
      var top = Math.log10(maxAbs * 1.2), bot = -5;
      var pw = (W - L - R - 2 * gap) / 3, ph = H - T - B;
      function yOf(v) { var lv = Math.log10(Math.max(Math.abs(v), 1e-5)); return T + ph - (lv - bot) / (top - bot) * ph; }
      [1e-4, 1e-3, 1e-2, 1e-1].forEach(function (g) {
        if (Math.log10(g) > top) return;
        chart.appendChild(svg("line", { x1: L, x2: W - R, y1: yOf(g), y2: yOf(g), class: "c-grid" }));
        chart.appendChild(svg("text", { x: L - 4, y: yOf(g) + 4, "text-anchor": "end", class: "c-tick" }, String(g)));
      });
      var kept = 0;
      covs.forEach(function (c, a) {
        var x0 = L + a * (pw + gap), bw = pw / c.length;
        // sort atoms by |cov| so the cut reads as a line
        var order = c.map(function (v, i) { return i; }).sort(function (u, v) { return Math.abs(c[u]) - Math.abs(c[v]); });
        order.forEach(function (i, rank) {
          var v = c[i], ok = Math.abs(v) <= state.rho; if (ok) kept++;
          var y = yOf(v);
          chart.appendChild(svg("rect", { x: (x0 + rank * bw).toFixed(2), y: y.toFixed(1), width: Math.max(bw - 0.4, 0.6).toFixed(2), height: Math.max(T + ph - y, 0.5).toFixed(1), class: "dp-atom" + (ok ? " kept" : "") }));
        });
        var nk = c.filter(function (v) { return Math.abs(v) <= state.rho; }).length;
        chart.appendChild(svg("text", { x: x0, y: T - 8, class: "c-label" }, W < 560
          ? (plain() ? "Office " : "W") + (a + 1) + ": " + nk + "/" + c.length
          : (plain() ? "Office " : "Agent W") + (a + 1) + " · " + nk + " of " + c.length));
      });
      if (state.rho < 1) {
        var yr = yOf(state.rho);
        chart.appendChild(svg("line", { x1: L, x2: W - R, y1: yr, y2: yr, class: "c-ref" }));
        chart.appendChild(svg("text", { x: W - R, y: yr - 4, "text-anchor": "end", class: "c-label" }, "ρ = " + state.rho));
      }
      chart.appendChild(svg("text", { x: W < 560 ? 0 : L, y: H - 8, class: "c-label" }, W < 560
        ? (plain() ? "One bar per block; taller = more tied to private column" : "|cov(d(x), s)| per atom, sorted (log scale)")
        : (plain() ? "Each bar is one building block, shortest to tallest; taller means more tied to the private column" : "Atoms sorted by |cov(d(x), s)| on each agent's 664 rows (log scale)")));
      chart.setAttribute("aria-label", "Covariance of each dictionary atom with the private attribute for three local agents; " + kept + " atoms pass the threshold");
      var total = covs.length * covs[0].length;
      read.innerHTML = plain()
        ? "<strong>" + kept + "</strong> of " + total + " building blocks pass to the modeler"
        : "k = <strong>" + kept + "</strong> of " + total + " atoms are ρ-fair";
      note.textContent = plain()
        ? "Each office learns 99 building blocks from its own records, checks each one against the private column only it holds, and sends the modeler only the blocks that pass. The private column itself never leaves the office."
        : "Each agent learns a 99-atom accurate dictionary by K-SVD with orthogonal matching pursuit on its 664 rows (the authors' dic_learning.py), computes cov(Xᵢd, sᵢ) for each atom, and sends the atoms within ρ. The paper uses ρ = 0.01 for this data set. The three agents' rows are the first third of three different shuffles, so they overlap.";
    }
    onChange(function (w) { if (w === "rho" || w === "level") draw(); });
    resizers.push(draw);
    draw();
  }

  /* ------------------------------------------------------------ demo 2: train the modeler */

  function mountTrain(root) {
    root.classList.add("w-ready");
    var trials = 50;
    var run = el("button", { type: "button", class: "w-btn", text: "Train the modeler" });
    var status = el("span", { class: "w-note dp-status" });
    var chart = svg("svg", { class: "dp-chart", role: "img" });
    var groups = svg("svg", { class: "dp-chart", role: "img" });
    var table = el("div", { class: "dp-table-wrap" });
    var read = el("p", { class: "w-note" });
    root.appendChild(el("div", { class: "dp-ctrls" }, [rhoControl(), modeControl()]));
    root.appendChild(el("div", { class: "w-actions" }, [run, status]));
    root.appendChild(chart);
    root.appendChild(groups);
    root.appendChild(read);
    root.appendChild(table);
    var result = null, baseline = null, busy = false;

    function trivial(D) {
      // always predict "not high crime": error = share of high-crime test rows, SP = 0
      var errs = [];
      for (var t = 0; t < 50; t++) {
        var te = D.perms[t].subarray(1493), c = 0;
        for (var i = 0; i < te.length; i++) c += D.y[te[i]];
        errs.push(c / te.length);
      }
      return E.meanStd(errs);
    }
    function go() {
      if (busy) return;
      busy = true; run.disabled = true; run.classList.add("running");
      var D = state.D;
      if (!state.fair.W.length) {
        result = null; status.textContent = "No atom passes this threshold; loosen it.";
        busy = false; run.disabled = false; run.classList.remove("running"); draw(); return;
      }
      var res = { errs: [], sps: [], results: [], stoppedAt: null }, t = 0;
      if (!baseline) baseline = { trivial: trivial(D) };
      function step() {
        var t0 = Date.now();
        while (t < trials && Date.now() - t0 < 120) {
          var g = E.trainTrial(D, t, { W: state.fair.W, Pall: state.Pall, mode: state.mode, seed: 1000 + t + 1 });
          res.results.push(g);
          if (g.posMin === 0 || g.posMaj === 0) { if (res.stoppedAt == null) res.stoppedAt = t; }
          res.errs.push(g.error); res.sps.push(g.sp);
          t++;
        }
        status.textContent = "Trial " + t + " of " + trials + "…";
        if (t < trials) { later(step); return; }
        res.error = E.meanStd(res.errs); res.sp = E.meanStd(res.sps);
        result = res; state.last = res;
        busy = false; run.disabled = false; run.classList.remove("running");
        status.textContent = trials + " trials on the authors' 50 shuffles (1,493 training and 500 test communities each), computed in your browser.";
        draw(); changed("trained");
      }
      step();
    }
    run.addEventListener("click", go);

    function draw() {
      var W = chartWidth(chart), H = 240, L = 50, R = 14, T = 26, B = 40;
      chart.setAttribute("viewBox", "0 0 " + W + " " + H); chart.innerHTML = "";
      groups.innerHTML = "";
      var xMax = 0.1, yMax = 0.3;
      if (result) result.results.forEach(function (g) { if (g.sp * 1.15 > xMax) xMax = Math.min(1, g.sp * 1.15); if (g.error * 1.1 > yMax) yMax = Math.min(1, g.error * 1.1); });
      var xs = xMax <= 0.12 ? 0.02 : xMax <= 0.3 ? 0.05 : 0.1, ys = yMax <= 0.4 ? 0.05 : 0.1;
      function xOf(v) { return L + v / xMax * (W - L - R); }
      function yOf(v) { return T + (H - T - B) - v / yMax * (H - T - B); }
      for (var gx = 0; gx <= xMax + 1e-9; gx += xs) {
        if (W < 520 && Math.round(gx / xs) % 2) continue;
        chart.appendChild(svg("line", { x1: xOf(gx), x2: xOf(gx), y1: T, y2: H - B, class: "c-grid" }));
        chart.appendChild(svg("text", { x: xOf(gx), y: H - B + 14, "text-anchor": "middle", class: "c-tick" }, gx.toFixed(2)));
      }
      for (var gy = 0; gy <= yMax + 1e-9; gy += ys) {
        chart.appendChild(svg("line", { x1: L, x2: W - R, y1: yOf(gy), y2: yOf(gy), class: "c-grid" }));
        chart.appendChild(svg("text", { x: L - 4, y: yOf(gy) + 4, "text-anchor": "end", class: "c-tick" }, gy.toFixed(2)));
      }
      chart.appendChild(svg("text", { x: W - R, y: H - 6, "text-anchor": "end", class: "c-label" }, plain() ? "unfairness: gap in “high crime” rates between groups →" : "statistical parity (Eq. 12) →"));
      chart.appendChild(svg("text", { x: 4, y: T - 4, class: "c-label" }, plain() ? "↑ share of communities labeled wrong" : "↑ classifier error"));
      // paper point and cross
      var px = xOf(PAPER.sp), py = yOf(PAPER.err);
      chart.appendChild(svg("line", { x1: xOf(Math.max(0, PAPER.sp - PAPER.spSd)), x2: xOf(PAPER.sp + PAPER.spSd), y1: py, y2: py, class: "dp-paper" }));
      chart.appendChild(svg("line", { x1: px, x2: px, y1: yOf(Math.max(0, PAPER.err - PAPER.errSd)), y2: yOf(PAPER.err + PAPER.errSd), class: "dp-paper" }));
      chart.appendChild(svg("rect", { x: px - 4, y: py - 4, width: 8, height: 8, class: "dp-paper-pt" }));
      chart.appendChild(svg("text", { x: px + 7, y: py + 16, class: "c-label dp-paper-label" }, "paper, mean ± sd"));
      if (baseline) {
        var by = yOf(baseline.trivial.mean);
        chart.appendChild(svg("line", { x1: L, x2: W - R, y1: by, y2: by, class: "c-ref" }));
        chart.appendChild(svg("text", { x: W - R, y: by - 6, "text-anchor": "end", class: "c-label" }, "always “not high crime” (" + pct(baseline.trivial.mean) + ")"));
      }
      if (result) {
        result.results.forEach(function (g) {
          chart.appendChild(svg("circle", { cx: xOf(g.sp), cy: yOf(g.error), r: 3.2, class: "dp-trial" }));
        });
        var mx = xOf(result.sp.mean), my = yOf(result.error.mean);
        chart.appendChild(svg("circle", { cx: mx, cy: my, r: 6, class: "dp-mean" }));
      }
      chart.setAttribute("aria-label", "Statistical parity against classifier error for each browser trial, with the paper's mean and standard deviation");

      // group bars for the last trial
      if (result) {
        var g = result.results[result.results.length - 1], D = state.D;
        var te = D.perms[g.trial].subarray(1493), yMin = 0, yMaj = 0, nMin = 0, nMaj = 0;
        for (var i = 0; i < te.length; i++) { if (D.s[te[i]] === 1) { nMin++; yMin += D.y[te[i]]; } else { nMaj++; yMaj += D.y[te[i]]; } }
        var GW = chartWidth(groups), GH = 128, GL = plain() ? 150 : 170, GR = 56;
        groups.setAttribute("viewBox", "0 0 " + GW + " " + GH);
        var rows = [
          [plain() ? "Mostly Black communities" : "Minority (s = 1), n = " + nMin, yMin / nMin, g.rateMin],
          [plain() ? "Other communities" : "Majority (s = 0), n = " + nMaj, yMaj / nMaj, g.rateMaj]
        ];
        var bw = GW - GL - GR;
        rows.forEach(function (r, k) {
          var y0 = 18 + k * 52;
          groups.appendChild(svg("text", { x: 0, y: y0 + 12, class: "c-label" }, r[0]));
          groups.appendChild(svg("rect", { x: GL, y: y0, width: Math.max(r[1] * bw, 1), height: 14, class: "dp-bar truth" }));
          groups.appendChild(svg("text", { x: GL + r[1] * bw + 4, y: y0 + 11, class: "c-tick" }, pct(r[1]) + " high crime"));
          groups.appendChild(svg("rect", { x: GL, y: y0 + 17, width: Math.max(r[2] * bw, 1), height: 14, class: "dp-bar pred" }));
          groups.appendChild(svg("text", { x: GL + r[2] * bw + 4, y: y0 + 28, class: "c-tick" }, pct(r[2]) + " flagged"));
        });
        groups.appendChild(svg("text", { x: 0, y: GH - 2, class: "c-label" }, "Last trial's 500 test communities: true rate (top bar) and model's rate (bottom bar)"));
        groups.setAttribute("aria-label", "True and predicted high-crime rates by group for the last trial");
      } else {
        groups.setAttribute("viewBox", "0 0 10 1");
      }

      if (!result) {
        read.textContent = plain()
          ? "Press the button to train the modeler 50 times on the blocks that passed, each time on a different random split of the 1,993 communities."
          : "Press the button to run Sparsemodel.m's 50 trials (λ = 50, 1,500 coordinate steps, 0.5 threshold) on the current aggregated dictionary.";
        table.innerHTML = "";
        return;
      }
      var G = result.results[result.results.length - 1];
      var empty = result.results.filter(function (r) { return r.posMin === 0 || r.posMaj === 0; }).length;
      var flat = result.results.filter(function (r) { return r.positives === 0; }).length;
      if (plain()) {
        read.textContent = "Across 50 tries the model labeled " + pct(result.error.mean) + " of test communities wrong, and its gap between the two groups averaged " + pct(result.sp.mean, 2) +
          ". The paper reports " + pct(PAPER.err) + " and " + pct(PAPER.sp, 2) + ". Notice the dashed line: a rule that calls every community “not high crime” is wrong " +
          pct(baseline.trivial.mean) + " of the time and has no gap at all." +
          (flat ? " In " + flat + " of the 50 tries this model flagged no community at all, which is that same rule." : "");
      } else {
        read.textContent = "Browser, " + result.results.length + " trials: SP " + f4(result.sp.mean) + " ± " + f4(result.sp.std) + ", error " + f4(result.error.mean) + " ± " + f4(result.error.std) +
          " (paper: " + f4(PAPER.sp) + " ± " + f4(PAPER.spSd) + ", " + f4(PAPER.err) + " ± " + f4(PAPER.errSd) + "). k = " + G.k + " atoms; " +
          (state.mode === "released" ? G.updated + " coefficient" + (G.updated === 1 ? "" : "s") + " updated, the rest keep their rand() start. " : G.updated + " of " + G.k + " coefficients updated, " + G.nonzero + " nonzero. ") +
          (flat ? flat + " trial" + (flat === 1 ? "" : "s") + " flagged no community at all. " : "") +
          (empty ? "The released script would stop at the first trial with no positive prediction in a group (" + empty + " here); the browser runs all 50." : "");
      }
      if (deep()) {
        table.innerHTML = '<table class="results-table dp-num"><thead><tr><th>Run</th><th>Statistical parity</th><th>Classifier error</th><th>Trials</th></tr></thead><tbody>' +
          '<tr><td>Paper, Table III (z-Sparse)</td><td>.0189 ± .0151</td><td>.1299 ± .0614</td><td>50</td></tr>' +
          '<tr class="dp-current"><td>This page, ρ = ' + rhoText(state.rho) + ", " + (state.mode === "released" ? "released code" : "as described") + '</td><td>' + f4(result.sp.mean) + " ± " + f4(result.sp.std) + '</td><td>' + f4(result.error.mean) + " ± " + f4(result.error.std) + '</td><td>' + result.results.length + '</td></tr>' +
          '<tr><td>This page, always “not high crime”</td><td>.0000</td><td>' + f4(baseline.trivial.mean) + " ± " + f4(baseline.trivial.std) + '</td><td>50</td></tr>' +
          '</tbody></table>';
      } else table.innerHTML = "";
    }
    onChange(function (w) { if (w === "rho" || w === "mode") { result = null; status.textContent = ""; draw(); } if (w === "level") draw(); });
    resizers.push(draw);
    draw();
  }

  /* ------------------------------------------------------------ demo 3: the trade-off */

  function mountSweep(root) {
    root.classList.add("w-ready");
    var run = el("button", { type: "button", class: "w-btn", text: "Sweep the threshold" });
    var status = el("span", { class: "w-note dp-status" });
    var chart = svg("svg", { class: "dp-chart", role: "img" });
    var read = el("p", { class: "w-note" });
    root.appendChild(el("div", { class: "dp-ctrls" }, [modeControl()]));
    root.appendChild(el("div", { class: "w-actions" }, [run, status]));
    root.appendChild(chart);
    root.appendChild(read);
    var pts = null, busy = false, TR = 20;
    var GRID = [0.001, 0.002, 0.003, 0.005, 0.0075, 0.01, 0.015, 0.02, 0.03, 0.05, 0.075, 0.1, 1];

    function go() {
      if (busy) return;
      busy = true; run.disabled = true; run.classList.add("running");
      var D = state.D, out = [], gi = 0;
      function step() {
        var rho = GRID[gi], fair = E.fairDictionary(D, state.covs, rho);
        if (fair.W.length) {
          var Pall = E.allRows(D, fair.W), errs = [], sps = [], z = [];
          for (var t = 0; t < TR; t++) {
            var g = E.trainTrial(D, t, { W: fair.W, Pall: Pall, mode: state.mode, seed: 1000 + t + 1 });
            errs.push(g.error); sps.push(g.sp); z.push(g.nonzero);
          }
          out.push({ rho: rho, k: fair.W.length, err: E.meanStd(errs), sp: E.meanStd(sps), z: E.meanStd(z) });
        } else out.push({ rho: rho, k: 0 });
        gi++;
        status.textContent = "Threshold " + gi + " of " + GRID.length + "…";
        if (gi < GRID.length) { later(step); return; }
        pts = out; busy = false; run.disabled = false; run.classList.remove("running");
        status.textContent = TR + " trials per threshold, computed in your browser.";
        draw();
      }
      later(step);
    }
    run.addEventListener("click", go);

    function draw() {
      var W = chartWidth(chart), H = 250, L = 46, R = 46, T = 18, B = 40;
      chart.setAttribute("viewBox", "0 0 " + W + " " + H); chart.innerHTML = "";
      var n = GRID.length;
      function xOf(i) { return L + i / (n - 1) * (W - L - R); }
      var yMax = 0.5;
      if (pts) pts.forEach(function (p) { if (p.k) yMax = Math.max(yMax, p.sp.mean, p.err.mean); });
      yMax = Math.min(1, Math.ceil(yMax * 10) / 10);
      function yOf(v) { return T + (H - T - B) - v / yMax * (H - T - B); }
      for (var g = 0; g <= yMax + 1e-9; g += 0.1) {
        chart.appendChild(svg("line", { x1: L, x2: W - R, y1: yOf(g), y2: yOf(g), class: "c-grid" }));
        chart.appendChild(svg("text", { x: L - 4, y: yOf(g) + 4, "text-anchor": "end", class: "c-tick" }, g.toFixed(1)));
      }
      GRID.forEach(function (r, i) {
        if (W < 520 && i % 2 && i !== n - 1) return;
        chart.appendChild(svg("text", { x: xOf(i), y: H - B + 14, "text-anchor": "middle", class: "c-tick" }, r >= 1 ? "none" : String(r)));
      });
      chart.appendChild(svg("text", { x: W - R, y: H - 6, "text-anchor": "end", class: "c-label" }, "threshold ρ (looser →)"));
      var i10 = GRID.indexOf(0.01);
      chart.appendChild(svg("line", { x1: xOf(i10), x2: xOf(i10), y1: T, y2: H - B, class: "c-ref" }));
      chart.appendChild(svg("text", { x: xOf(i10) + 4, y: T + 10, class: "c-label" }, "paper's ρ"));
      if (pts) {
        var spD = "", erD = "", kMax = 0;
        pts.forEach(function (p) { if (p.k > kMax) kMax = p.k; });
        pts.forEach(function (p, i) {
          if (!p.k) return;
          spD += (spD ? "L" : "M") + xOf(i).toFixed(1) + " " + yOf(p.sp.mean).toFixed(1);
          erD += (erD ? "L" : "M") + xOf(i).toFixed(1) + " " + yOf(p.err.mean).toFixed(1);
          var kh = 0.6 * (H - T - B) * p.k / kMax;
          chart.appendChild(svg("rect", { x: xOf(i) - 5, y: H - B - kh, width: 10, height: kh, class: "dp-kbar" }));
        });
        chart.appendChild(svg("path", { d: spD, class: "dp-line sp" }));
        chart.appendChild(svg("path", { d: erD, class: "dp-line err" }));
        pts.forEach(function (p, i) {
          if (!p.k) return;
          chart.appendChild(svg("circle", { cx: xOf(i), cy: yOf(p.sp.mean), r: 3, class: "dp-dot sp" }));
          chart.appendChild(svg("circle", { cx: xOf(i), cy: yOf(p.err.mean), r: 3, class: "dp-dot err" }));
        });
        chart.appendChild(svg("text", { x: W - R + 4, y: T + 10, class: "c-tick" }, "k ≤ " + kMax));
      }
      chart.appendChild(svg("text", { x: 0, y: H - 6, class: "c-label dp-key" }, W < 520 ? "— SP  - - error  ▮ k" : "— SP   - - error   ▮ atoms kept (k)"));
      chart.setAttribute("aria-label", "Mean statistical parity and classifier error against the fairness threshold, with the number of atoms kept");
      if (!pts) { read.textContent = "Press the button to train " + TR + " models at each of " + GRID.length + " thresholds, from 0.001 to no filter at all."; return; }
      var loose = pts[pts.length - 1], at = pts[i10];
      read.textContent = "ρ = 0.01 keeps k = " + at.k + " atoms: SP " + f4(at.sp.mean) + ", error " + f4(at.err.mean) +
        ". With no filter (all " + loose.k + " atoms): SP " + f4(loose.sp.mean) + ", error " + f4(loose.err.mean) + ". " +
        (state.mode === "described" ? "Average nonzero coefficients at ρ = 0.01: " + at.z.mean.toFixed(1) + " of " + at.k + "." : "Under the released code only coefficient 1 is ever fitted, so a looser threshold mainly adds atoms with random weights.");
    }
    onChange(function (w) { if (w === "mode") { pts = null; status.textContent = ""; draw(); } if (w === "level") draw(); });
    resizers.push(draw);
    draw();
  }

  /* ------------------------------------------------------------ demo 4: the inference attack */

  function mountAttack(root) {
    root.classList.add("w-ready");
    var run = el("button", { type: "button", class: "w-btn", text: "Run the attack" });
    var status = el("span", { class: "w-note dp-status" });
    var chart = svg("svg", { class: "dp-chart", role: "img" });
    var read = el("p", { class: "w-big" });
    var note = el("p", { class: "w-note" });
    root.appendChild(el("div", { class: "dp-ctrls" }, [rhoControl()]));
    root.appendChild(el("div", { class: "w-actions" }, [run, status]));
    root.appendChild(chart);
    root.appendChild(read);
    root.appendChild(note);
    var out = null, busy = false, seed = 7, RUNS = 5;

    function predictAll(g) {
      // Infer.m attacks all 1,993 communities with the trained model's predictions
      var D = state.D, pre = new Uint8Array(D.n), beta = g.beta, P = state.Pall;
      for (var i = 0; i < D.n; i++) { var sc = 0; for (var t = 0; t < beta.length; t++) sc += P[t][i] * beta[t]; pre[i] = Math.abs(sc) >= 0.5 ? 1 : 0; }
      return pre;
    }
    function oneFeature() {
      // page's own check: guess s = 1 when the public racePctWhite feature is below 0.5
      var D = state.D, ok = 0, j = D.names ? D.names.indexOf("racePctWhite") : 0;
      for (var i = 0; i < D.n; i++) ok += ((D.X[i * D.p + j] < 0.5 ? 1 : 0) === D.s[i]) ? 1 : 0;
      return ok / D.n;
    }
    function go() {
      if (busy || !state.fair.W.length) { if (!state.fair.W.length) status.textContent = "No atom passes this threshold."; return; }
      busy = true; run.disabled = true; run.classList.add("running");
      // Infer.m calls the released Sparsemodel, so the attacked model is the released-code one
      var D = state.D, g = E.trainTrial(D, 0, { W: state.fair.W, Pall: state.Pall, mode: "released", seed: 1001 });
      var pre = predictAll(g), r = 0, runs = [];
      function step() {
        runs.push(E.inferAttack(pre, D.s, { pop: 200, cross: 0.1, mut: 0.01, generations: 500, seed: seed + r * 17 }));
        r++;
        status.textContent = "Attack " + r + " of " + RUNS + "…";
        if (r < RUNS) { later(step); return; }
        var pls = runs.map(function (x) { return x.privacyLoss; }).filter(function (v) { return !isNaN(v); });
        out = { runs: runs, pl: E.meanStd(pls), maj: E.majorityGuess(D.s), one: oneFeature(), positives: pre.reduce(function (a, b) { return a + b; }, 0) };
        seed += 101; busy = false; run.disabled = false; run.classList.remove("running");
        status.textContent = RUNS + " genetic-algorithm runs on all 1,993 communities, computed in your browser.";
        draw();
      }
      later(step);
    }
    run.addEventListener("click", go);

    function draw() {
      var W = chartWidth(chart), H = 150, L = plain() ? 200 : 190, R = 50, T = 8;
      chart.setAttribute("viewBox", "0 0 " + W + " " + H); chart.innerHTML = "";
      function xOf(v) { return L + v * (W - L - R); }
      [0, 0.25, 0.5, 0.75, 1].forEach(function (g) {
        chart.appendChild(svg("line", { x1: xOf(g), x2: xOf(g), y1: T, y2: H - 22, class: "c-grid" }));
        chart.appendChild(svg("text", { x: xOf(g), y: H - 8, "text-anchor": "middle", class: "c-tick" }, g.toFixed(2)));
      });
      var rows = [];
      rows.push([plain() ? "Attack, in the paper" : "Paper, Fig. 2 (Crime)", null, "below 0.6"]);
      if (out && out.pl.n) {
        rows.push([plain() ? "Attack, run here" : "GA attack, this page", out.pl.mean, f4(out.pl.mean).replace(/^\./, "0.")]);
        rows.push([plain() ? "Guess “not mostly Black”" : "Always guess s = 0", out.maj, f4(out.maj).replace(/^\./, "0.")]);
        if (deep()) rows.push(["racePctWhite < 0.5 (page)", out.one, f4(out.one).replace(/^\./, "0.")]);
      }
      rows.forEach(function (r, k) {
        var y = T + 6 + k * 26;
        chart.appendChild(svg("text", { x: 0, y: y + 11, class: "c-label" }, r[0]));
        if (r[1] == null) {
          chart.appendChild(svg("rect", { x: xOf(0), y: y, width: xOf(0.6) - xOf(0), height: 14, class: "dp-bar paper" }));
        } else chart.appendChild(svg("rect", { x: xOf(0), y: y, width: Math.max(xOf(r[1]) - xOf(0), 1), height: 14, class: "dp-bar " + (k === 1 ? "pred" : "truth") }));
        chart.appendChild(svg("text", { x: (r[1] == null ? xOf(0.6) : xOf(r[1])) + 4, y: y + 11, class: "c-tick" }, r[2]));
      });
      chart.appendChild(svg("text", { x: W - R, y: H - 22 - 4, "text-anchor": "end", class: "c-label" }, plain() ? "share guessed right →" : "privacy loss, Eq. 10 →"));
      chart.setAttribute("aria-label", "Privacy loss of the genetic-algorithm attack compared with simple guesses");
      if (!out) {
        read.textContent = "";
        note.textContent = plain()
          ? "Press the button to play the attacker: the modeler tries to rebuild the private column from the model's answers alone."
          : "Press the button to run Infer.m five times: a genetic algorithm (population 200, crossover 0.1, mutation 0.01, 500 generations) searches for the 0/1 column that makes the model's predictions look most even, and Eq. 10 scores it against the true column.";
        return;
      }
      if (!out.pl.n) {
        read.textContent = "";
        note.textContent = plain()
          ? "This model flags no community as high crime, so every guess at the private column looks equally even, and the authors' attack has nothing to work with: its filter step discards every candidate and stops."
          : "The trained model predicts 0 for all 1,993 rows, so every candidate column has statistical parity 0; Filter.m removes all of them and Infer.m has no individual to score (the MATLAB script would stop with an error). Loosen ρ, or switch the learner, to give the attack predictions to work with.";
        return;
      }
      var pop2 = out.runs.map(function (x) { for (var i = 0; i < x.trace.length; i++) if (x.trace[i].pop <= 2) return i + 1; return null; });
      var bestGen = out.runs.map(function (x) { return x.bestGen; });
      read.innerHTML = plain()
        ? "The attack guessed <strong>" + pct(out.pl.mean, 0) + "</strong> of communities right"
        : "Privacy loss <strong>" + f4(out.pl.mean).replace(/^\./, "0.") + "</strong> ± " + f4(out.pl.std);
      note.textContent = plain()
        ? "That matches the paper: under 60 percent. A guess that every community is in the larger group is right " + pct(out.maj, 0) + " of the time, because only 243 of the 1,993 communities are mostly Black. Scoring an attack well against that simple guess is the harder test."
        : "Five runs average " + f4(out.pl.mean).replace(/^\./, "0.") + ", below the paper's 0.6, as Figure 2 reports. The constant guess s = 0 scores " + f4(out.maj).replace(/^\./, "0.") + " (243 of 1,993 rows have s = 1). " +
          (deep() ? "As written, Selection.m keeps 80 percent of the population each generation, and two individuals survive from generation " + (pop2[0] || "–") + " on; in these runs the recorded best comes from generation " + bestGen.join(", ") + ", a column drawn at random with about half ones, so the score sits near 0.5 whatever the model does. One public feature, racePctWhite below 0.5, recovers s for " + pct(out.one, 1) + " of communities. Those two baselines are this page's own." : "");
    }
    onChange(function (w) { if (w === "rho") { out = null; status.textContent = ""; draw(); } if (w === "level") draw(); });
    resizers.push(draw);
    draw();
  }

  /* ------------------------------------------------------------ demo 5: the paper's tables */

  function mountTables(root) {
    root.classList.add("w-ready");
    var ds = "crime";
    var s = seg(Object.keys(TABLES).map(function (k) { return { value: k, label: TABLES[k].label }; }), ds, function (v) { ds = v; draw(); }, "Data set");
    var chart = svg("svg", { class: "dp-chart", role: "img" });
    var key = el("p", { class: "w-note dp-key-row", html: '<span class="dp-sw np"></span>Non-private <span class="dp-sw sp"></span>Semi-private <span class="dp-sw pv"></span>Private (z-Sparse)' });
    var read = el("p", { class: "w-note" });
    root.appendChild(el("div", { class: "dp-ctrls" }, [labeled("Data set", s)]));
    root.appendChild(chart); root.appendChild(key); root.appendChild(read);
    function draw() {
      var T0 = TABLES[ds], W = chartWidth(chart), H = 270, L = 50, R = 16, T = 14, B = 40;
      chart.setAttribute("viewBox", "0 0 " + W + " " + H); chart.innerHTML = "";
      var xMax = 0, yMin = 1, yMax = 0;
      T0.rows.forEach(function (r) { xMax = Math.max(xMax, r[2]); yMin = Math.min(yMin, r[4]); yMax = Math.max(yMax, r[4]); });
      xMax = Math.ceil(xMax * 11) / 10; yMin = Math.floor(yMin * 50) / 50 - 0.01; yMax = Math.ceil(yMax * 50) / 50 + 0.01;
      function xOf(v) { return L + v / xMax * (W - L - R); }
      function yOf(v) { return T + (H - T - B) - (v - yMin) / (yMax - yMin) * (H - T - B); }
      var xs = xMax > 0.2 ? 0.05 : 0.02;
      for (var g = 0; g <= xMax + 1e-9; g += xs) {
        chart.appendChild(svg("line", { x1: xOf(g), x2: xOf(g), y1: T, y2: H - B, class: "c-grid" }));
        chart.appendChild(svg("text", { x: xOf(g), y: H - B + 14, "text-anchor": "middle", class: "c-tick" }, g.toFixed(2)));
      }
      var ys = (yMax - yMin) > 0.15 ? 0.05 : 0.02;
      for (var h = Math.ceil(yMin / ys) * ys; h <= yMax + 1e-9; h += ys) {
        chart.appendChild(svg("line", { x1: L, x2: W - R, y1: yOf(h), y2: yOf(h), class: "c-grid" }));
        chart.appendChild(svg("text", { x: L - 4, y: yOf(h) + 4, "text-anchor": "end", class: "c-tick" }, h.toFixed(2)));
      }
      chart.appendChild(svg("text", { x: W - R, y: H - 6, "text-anchor": "end", class: "c-label" }, "statistical parity (lower is fairer) →"));
      chart.appendChild(svg("text", { x: 4, y: T - 2, class: "c-label" }, "↑ classifier error"));
      T0.rows.forEach(function (r) {
        var cls = r[1] === "Private" ? "pv" : r[1] === "Semi-private" ? "sp" : "np", x = xOf(r[2]), y = yOf(r[4]);
        chart.appendChild(svg(r[1] === "Private" ? "rect" : "circle", r[1] === "Private" ? { x: x - 5, y: y - 5, width: 10, height: 10, class: "dp-m " + cls } : { cx: x, cy: y, r: 4.5, class: "dp-m " + cls }));
        chart.appendChild(svg("text", { x: x + 7, y: y + 4, class: "c-tick" }, r[0]));
      });
      chart.setAttribute("aria-label", "Statistical parity against classifier error for the eleven methods in the paper's table for " + T0.label);
      var z = T0.rows[10], best = T0.rows.slice().sort(function (a, b) { return a[2] - b[2]; });
      var rank = best.indexOf(z) + 1, minErr = T0.rows.slice().sort(function (a, b) { return a[4] - b[4]; })[0];
      read.textContent = T0.label + " (ρ = " + T0.rho + "): z-Sparse ranks " + (rank === 1 ? "first" : rank === 2 ? "second" : rank === 3 ? "third" : rank + "th") + " of 11 on statistical parity (" + f4(z[2]) +
        ") with error " + f4(z[4]) + "; the lowest error is " + minErr[0] + "'s " + f4(minErr[4]) + ". Values as printed in Tables III to V (means over 50 trials).";
    }
    resizers.push(draw);
    onChange(function (w) { if (w === "level") draw(); });
    draw();
  }

  /* ------------------------------------------------------------ boot */

  var mounts = { "dp-filter": mountFilter, "dp-train": mountTrain, "dp-sweep": mountSweep, "dp-attack": mountAttack };
  var tables = document.getElementById("dp-tables");
  if (tables) mountTables(tables);
  var need = Object.keys(mounts).filter(function (id) { return document.getElementById(id); });
  if (!need.length) return;
  need.forEach(function (id) { document.getElementById(id).appendChild(el("p", { class: "w-note dp-loading", text: "Loading the 1,993 communities and the agents' dictionaries…" })); });
  fetch(BASE + "data.json").then(function (r) { return r.json(); }).then(function (json) {
    state.D = E.decode(json);
    state.covs = [0, 1, 2].map(function (a) { return E.atomCovs(state.D, a); });
    rebuildFair();
    need.forEach(function (id) {
      var node = document.getElementById(id), ld = node.querySelector(".dp-loading");
      if (ld) ld.remove();
      mounts[id](node);
    });
  }).catch(function (err) {
    need.forEach(function (id) { document.getElementById(id).textContent = "The data for this demo did not load (" + err.message + ")."; });
  });
})();

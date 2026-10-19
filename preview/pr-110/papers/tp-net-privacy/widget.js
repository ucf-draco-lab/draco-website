/*
  TP-NET widget for /papers/tp-net-privacy/.
  Mount points: #tp-trace, #tp-count, #tp-attack, #tp-accuracy.
  Shared state: the pair of hidden-layer widths an attacker must tell apart.
  Every power trace is simulated by tpnet-engine.js and labeled so.
*/
(function () {
  "use strict";

  var E = window.TPNet;
  if (!E) return;

  var SVGNS = "http://www.w3.org/2000/svg";
  var BASE = (document.currentScript && document.currentScript.src)
    ? document.currentScript.src.replace(/widget\.js(\?.*)?$/, "")
    : "";

  /* ------------------------------------------------------------ state */

  var PAIRS = { "8-10": [8, 10], "8-14": [8, 14], "10-14": [10, 14] };
  var state = {
    pair: "8-10",
    seed: 1,
    level: window.PaperKit ? window.PaperKit.level() : "public",
    rows: null,
    pre: null          // precomputed attack and accuracy tables
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
    options.forEach(function (o) {
      var b = el("button", { type: "button", class: "seg-option", role: "radio", "aria-checked": String(o.value === value), text: o.label });
      if (o.title) b.title = o.title;
      if (o.levels) b.setAttribute("data-levels", o.levels);
      b.addEventListener("click", function () { value = o.value; set(o.value); onPick(o.value); });
      wrap.appendChild(b);
      btns.push({ b: b, v: o.value });
    });
    function set(v) { value = v; btns.forEach(function (x) { x.b.setAttribute("aria-checked", String(x.v === v)); }); }
    wrap.set = set;
    wrap.get = function () { return value; };
    return wrap;
  }
  function labeled(label, control, levels) {
    var row = el("div", { class: "tp-ctl" }, [el("span", { class: "tp-ctl-label", text: label }), control]);
    if (levels) row.setAttribute("data-levels", levels);
    return row;
  }
  function pct(x, d) { return x == null ? "–" : (x * 100).toFixed(d == null ? 2 : d) + "%"; }
  function int(x) { return Math.round(x).toLocaleString("en-US"); }
  function pairLabel(key) { var p = PAIRS[key]; return p[0] + " or " + p[1] + " nodes"; }
  function pairSeg(onPick) {
    return seg(Object.keys(PAIRS).map(function (k) { return { value: k, label: PAIRS[k][0] + " vs " + PAIRS[k][1], title: "Tell " + pairLabel(k) + " per hidden layer apart" }; }),
      state.pair, function (v) { state.pair = v; changed("pair"); if (onPick) onPick(v); }, "Hidden-layer widths to tell apart");
  }
  function structText(s) { return s.map(function (z) { return "(" + z[0] + ", " + z[1] + ")"; }).join(" + "); }
  function movingAverage(series, end, cols) {
    var win = Math.max(3, Math.round(series.length / 70)), pts = [], acc = 0, sm = [], q;
    for (q = 0; q < series.length; q++) { acc += series[q]; if (q >= win) acc -= series[q - win]; if (q >= win - 1) sm.push(acc / win); }
    for (q = 0; q < cols; q++) pts.push(sm[Math.floor(q * sm.length / cols)]);
    return { pts: pts, win: win };
  }
  function linePath(series, x0, w, yOf) {
    var n = series.length, d = "";
    for (var i = 0; i < n; i++) d += (i ? "L" : "M") + (x0 + (n === 1 ? 0 : i * w / (n - 1))).toFixed(1) + " " + yOf(series[i]).toFixed(1);
    return d;
  }

  /* ------------------------------------------------------------ demo 1: captures */

  function mountTrace(root) {
    root.classList.add("w-ready");
    var model = "trad", source = "table";
    var mSeg = seg([{ value: "trad", label: "Traditional network" }, { value: "tp", label: "TP-NET" }], model, function (v) { model = v; draw(); }, "Network on the chip");
    var pSeg = pairSeg();
    var sSeg = seg([{ value: "table", label: "Table III structures" }, { value: "fresh", label: "Fresh each capture" }], source, function (v) { source = v; draw(); }, "TP-NET structures");
    var again = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "New captures" });
    again.addEventListener("click", function () { state.seed += 3; draw(); });
    var chart = svg("svg", { class: "tp-chart", role: "img" });
    var key = el("p", { class: "w-note tp-key" });
    var read = el("p", { class: "w-note" });
    root.appendChild(el("div", { class: "tp-ctrls" }, [
      labeled("Network", mSeg),
      labeled("Widths", pSeg, "hs ug grad res"),
      labeled("Structures", sSeg, "grad res")
    ]));
    root.appendChild(chart);
    root.appendChild(key);
    root.appendChild(el("div", { class: "w-actions" }, [again]));
    root.appendChild(read);

    function spec(m, i) {
      if (model === "trad") return { kind: "trad", m: m };
      if (source === "fresh") return { kind: "tp", m: m, structure: "fresh" };
      // three different Table III structures per width, in a seeded order
      var r = E.rng(state.seed * 31 + m), idx = [0, 1, 2, 3, 4, 5, 6];
      for (var q = 6; q > 0; q--) { var j = r.int(q + 1), t = idx[q]; idx[q] = idx[j]; idx[j] = t; }
      return { kind: "tp", m: m, structure: E.TABLE3[m][idx[i]] };
    }
    function draw() {
      var widths = PAIRS[state.pair], caps = [];
      widths.forEach(function (m, wi) {
        for (var i = 0; i < 3; i++) {
          var sp = spec(m, i), t = E.trace(sp, state.seed * 101 + wi * 11 + i, E.DEFAULTS);
          caps.push({ m: m, wi: wi, i: i, trace: t, spec: sp });
        }
      });
      var W = chartWidth(chart), H = 300, L = 40, R = 10, T = 14, B = 30, gap = 26;
      chart.setAttribute("viewBox", "0 0 " + W + " " + H); chart.innerHTML = "";
      var cols = Math.round(W - L - R), panelH = (H - T - B - gap) / 2;
      var sm = caps.map(function (c) { return movingAverage(c.trace.trace, c.trace.end, cols); });
      var lo = Infinity, hi = -Infinity;
      sm.forEach(function (s) { s.pts.forEach(function (v) { if (v < lo) lo = v; if (v > hi) hi = v; }); });
      lo = Math.floor(lo * 20) / 20; hi = Math.ceil(hi * 20) / 20;
      widths.forEach(function (m, wi) {
        var top = T + wi * (panelH + gap);
        var yOf = function (v) { return top + panelH - (v - lo) / (hi - lo) * panelH; };
        [lo, hi].forEach(function (v) {
          chart.appendChild(svg("line", { x1: L, x2: W - R, y1: yOf(v), y2: yOf(v), class: "c-grid" }));
          chart.appendChild(svg("text", { x: L - 4, y: yOf(v) + 4, "text-anchor": "end", class: "c-tick" }, v.toFixed(2)));
        });
        caps.forEach(function (c, ci) {
          if (c.wi !== wi) return;
          var s = sm[ci], off = (W - L - R) * (s.win / 2) / c.trace.trace.length;
          chart.appendChild(svg("path", { d: linePath(s.pts, L + off, W - L - R - 2 * off, yOf), class: "tp-cap k" + wi + " n" + c.i }));
        });
        chart.appendChild(svg("text", { x: L + 4, y: top - 2, class: "c-label" },
          (model === "trad" ? "Traditional, " + m + " nodes per layer" : "TP-NET, m = " + m) + (wi === 0 ? " · three simulated captures" : "")));
      });
      var nt = W < 500 ? 2 : 5;
      for (var g = 0; g <= nt; g++) {
        var x = L + g * (W - L - R) / nt;
        chart.appendChild(svg("text", { x: x, y: H - 12, "text-anchor": g === 0 ? "start" : g === nt ? "end" : "middle", class: "c-tick" }, int(g * 5000 / nt)));
      }
      chart.appendChild(svg("text", { x: W - R, y: H - 1, "text-anchor": "end", class: "c-label" }, "sample (4 clock cycles each)"));
      chart.setAttribute("aria-label", "Moving averages of three simulated power captures for each of two hidden-layer widths, " + (model === "trad" ? "traditional network" : "TP-NET"));
      key.innerHTML = "Simulated captures: one training step on one row, power (arbitrary units, moving average) against time, 5,000 samples per capture as in the paper. Each line is one capture.";
      var lines = [];
      widths.forEach(function (m) {
        var mine = caps.filter(function (c) { return c.m === m; });
        if (model === "trad") lines.push(m + " nodes: training ends near sample " + mine.map(function (c) { return int(c.trace.end); }).join(", "));
        else lines.push("m = " + m + ": " + mine.map(function (c) {
          return c.trace.order.map(function (i) { return "(" + c.trace.structure[i][0] + ", " + c.trace.structure[i][1] + ")"; }).join(" then ");
        }).join("; "));
      });
      if (state.level === "public" || state.level === "hs") {
        read.textContent = model === "trad"
          ? "The three captures of each network fall on top of one another, and the larger network keeps working longer. An attacker who has seen a few of each can label a new capture at a glance."
          : "Each capture trains two smaller sub-networks whose sizes were picked at random, one after the other in a random order, so captures of the same model no longer line up and the two models overlap.";
      } else {
        read.textContent = (model === "trad" ? "Every capture repeats the same instruction stream. " : "Sub-network widths (z1, z2), in training order. ") + lines.join(". ") + ".";
      }
    }
    onChange(function (what) { if (what === "pair") { pSeg.set(state.pair); draw(); } if (what === "level") draw(); });
    resizers.push(draw);
    draw();
  }

  /* ------------------------------------------------------------ demo 2: counting the work */

  function mountCount(root) {
    root.classList.add("w-ready");
    var r = 2, showStruct = 6;
    var pSeg = pairSeg();
    var rSeg = seg([2, 3].map(function (v) { return { value: v, label: "r = " + v }; }), r, function (v) { r = v; draw(); }, "Number of sub-networks");
    var stSeg = seg([1, 2, 3, 4, 5, 6, 7].map(function (v) { return { value: v, label: String(v) }; }), showStruct, function (v) { showStruct = v; draw(); }, "Table III structure");
    var chart = svg("svg", { class: "tp-chart", role: "img" });
    var key = el("p", { class: "w-note tp-key" });
    var read = el("p", { class: "w-note" });
    var tableWrap = el("div", { class: "tp-table-wrap", "data-levels": "ug grad res" });
    var bound = el("div", { class: "tp-table-wrap", "data-levels": "grad res" });
    root.appendChild(el("div", { class: "tp-ctrls" }, [
      labeled("Widths", pSeg),
      labeled("Structure", stSeg, "ug grad res"),
      labeled("Sub-networks", rSeg, "grad res")
    ]));
    root.appendChild(chart);
    root.appendChild(key);
    root.appendChild(read);
    root.appendChild(tableWrap);
    root.appendChild(bound);

    function draw() {
      var widths = PAIRS[state.pair], rr = deep() ? r : 2;
      var dists = widths.map(function (m) { return E.weightDistribution(m, rr, 6); });
      var maxW = 0, keys = [];
      dists.forEach(function (d) { Object.keys(d).forEach(function (k) { if (+k > maxW) maxW = +k; }); });
      var trad = widths.map(function (m) { return E.weights(m, m, 6); });
      maxW = Math.max(maxW, trad[1]);
      var bin = maxW > 600 ? 20 : 10, nb = Math.ceil((maxW + 1) / bin);
      var hist = dists.map(function (d) {
        var h = new Array(nb).fill(0);
        Object.keys(d).forEach(function (k) { h[Math.floor(+k / bin)] += d[k]; });
        return h;
      });
      var top = 0; hist.forEach(function (h) { h.forEach(function (v) { if (v > top) top = v; }); });
      var W = chartWidth(chart), H = 250, L = 40, R = 12, T = 38, B = 44;
      chart.setAttribute("viewBox", "0 0 " + W + " " + H); chart.innerHTML = "";
      var xOf = function (w) { return L + w / (nb * bin) * (W - L - R); };
      var yOf = function (p) { return T + (H - T - B) * (1 - p / top); };
      [0, top / 2, top].forEach(function (v) {
        chart.appendChild(svg("line", { x1: L, x2: W - R, y1: yOf(v), y2: yOf(v), class: "c-grid" }));
        chart.appendChild(svg("text", { x: L - 4, y: yOf(v) + 4, "text-anchor": "end", class: "c-tick" }, Math.round(v * 100) + "%"));
      });
      hist.forEach(function (h, wi) {
        var d = "";
        h.forEach(function (v, b) { var x0 = xOf(b * bin), x1 = xOf((b + 1) * bin); d += (b ? "L" : "M") + x0.toFixed(1) + " " + yOf(v).toFixed(1) + "L" + x1.toFixed(1) + " " + yOf(v).toFixed(1); });
        chart.appendChild(svg("path", { d: d, class: "tp-dist k" + wi }));
      });
      // traditional networks: vertical marks
      trad.forEach(function (w, wi) {
        chart.appendChild(svg("line", { x1: xOf(w), x2: xOf(w), y1: 16 + wi * 14, y2: H - B, class: "tp-trad k" + wi }));
        chart.appendChild(svg("text", { x: xOf(w) + (wi ? 4 : -4), y: 12 + wi * 14, "text-anchor": wi ? "start" : "end", class: "c-label" }, "traditional " + widths[wi] + ": " + w));
      });
      // Table III structures (r = 2 only): dots under the axis
      if (rr === 2) widths.forEach(function (m, wi) {
        E.TABLE3[m].forEach(function (s, si) {
          var w = E.structWeights(s, 6), y = H - B + 10 + wi * 10;
          chart.appendChild(svg("circle", { cx: xOf(w), cy: y, r: si + 1 === showStruct ? 4.5 : 3, class: "tp-dot k" + wi + (si + 1 === showStruct ? " on" : "") }));
        });
      });
      for (var g = 0; g <= 5; g++) {
        var wv = Math.round(g * nb * bin / 5 / 10) * 10;
        chart.appendChild(svg("text", { x: xOf(wv), y: H - 4, "text-anchor": g === 0 ? "start" : g === 5 ? "end" : "middle", class: "c-tick" }, int(wv)));
      }
      chart.setAttribute("aria-label", "Probability of each total weight count for TP-NET with m = " + widths.join(" and ") + ", r = " + rr);
      key.innerHTML = '<span class="tp-sw k0"></span>TP-NET, m = ' + widths[0] + ' &nbsp; <span class="tp-sw k1"></span>TP-NET, m = ' + widths[1] +
        " · share of random structures (bins of " + bin + " weights) against total weights, the number of multiplications in one forward pass (Eq. 4)" +
        (rr === 2 ? ". Dots: Table III's seven structures; the larger dot is structure " + showStruct + "." : ".");
      var s8 = E.TABLE3[widths[0]][showStruct - 1], s10 = E.TABLE3[widths[1]][showStruct - 1];
      var w0 = E.structWeights(s8, 6), w1 = E.structWeights(s10, 6);
      if (state.level === "public" || state.level === "hs") {
        read.textContent = "A traditional network with " + widths[0] + " nodes per layer always does " + trad[0] + " multiplications per example, and one with " + widths[1] + " always does " + trad[1] +
          ". TP-NET spreads each model across a wide range, and the two ranges overlap. In the paper's structure 6, the " + widths[0] + "-node TP-NET does " + w0 + " and the " + widths[1] + "-node TP-NET does " + w1 + ".";
      } else {
        read.textContent = "Structure " + showStruct + ": m = " + widths[0] + " is " + structText(s8) + " with " + w0 + " weights; m = " + widths[1] + " is " + structText(s10) + " with " + w1 +
          " weights. The traditional networks have " + trad[0] + " and " + trad[1] + ". Over random structures, the m = " + widths[0] + " TP-NET has more weights than the m = " + widths[1] + " one " + pct(overlap(dists[0], dists[1]), 1) + " of the time.";
      }
      drawTable(widths, rr);
      drawBound();
    }
    function overlap(A, B) {
      var s = 0;
      Object.keys(A).forEach(function (a) { Object.keys(B).forEach(function (b) { if (+a > +b) s += A[a] * B[b]; }); });
      return s;
    }
    function drawTable(widths) {
      var html = '<table class="results-table tp-num"><caption class="w-note">Eq. 4 and Eq. 6 to 8 for one training example: atomic operations per sub-network of structure ' + showStruct + ' (d = 6 inputs), beside the simulated chip\'s clock cycles for the same step.</caption>' +
        "<thead><tr><th>Model</th><th>Sub-network</th><th>Multiplications</th><th>Additions</th><th>Activations</th><th>Weights updated</th><th>Simulated cycles</th></tr></thead><tbody>";
      widths.forEach(function (m) {
        var t = E.eqCounts(m, m, 6), c = E.opCounts({ kind: "trad", m: m });
        html += "<tr><td>Traditional, " + m + "</td><td>(" + m + ", " + m + ")</td><td>" + t.mul + "</td><td>" + t.add + "</td><td>" + t.act + "</td><td>" + t.upd + "</td><td>" + int(c.cycles) + "</td></tr>";
        var s = E.TABLE3[m][showStruct - 1];
        s.forEach(function (z, i) {
          var q = E.eqCounts(z[0], z[1], 6), cc = E.opCounts({ kind: "tp", m: m, structure: [z] });
          html += "<tr><td>" + (i ? "" : "TP-NET, m = " + m) + "</td><td>N" + (i + 1) + " (" + z[0] + ", " + z[1] + ")</td><td>" + q.mul + "</td><td>" + q.add + "</td><td>" + q.act + "</td><td>" + q.upd + "</td><td>" + int(cc.cycles) + "</td></tr>";
        });
      });
      tableWrap.innerHTML = html + "</tbody></table>";
    }
    function drawBound() {
      var rr = deep() ? r : 2;
      var html = '<table class="results-table tp-num"><caption class="w-note">Computed by this page, beyond the paper: the best accuracy any attacker can reach (equal priors) if each capture revealed TP-NET\'s weight count exactly, with widths drawn afresh for every capture as in Algorithm 1 (r = ' + rr + ').</caption>' +
        "<thead><tr><th>Widths</th><th>Total weights only</th><th>Each sub-network's weights</th><th>Traditional network</th></tr></thead><tbody>";
      Object.keys(PAIRS).forEach(function (k) {
        var p = PAIRS[k];
        html += "<tr" + (k === state.pair ? ' class="tp-current"' : "") + "><td>" + p[0] + " vs " + p[1] + "</td><td>" + pct(E.bayesAccuracy(p[0], p[1], rr, 6), 1) + "</td><td>" + pct(E.bayesAccuracySplit(p[0], p[1], rr, 6), 1) + "</td><td>100.0%</td></tr>";
      });
      bound.innerHTML = html + "</tbody></table>";
    }
    onChange(function (what) { if (what === "pair") { pSeg.set(state.pair); draw(); } if (what === "level") draw(); });
    resizers.push(draw);
    draw();
  }

  /* ------------------------------------------------------------ demo 3: the attack */

  var worker = null;
  function getWorker() {
    if (worker) return worker;
    try { worker = new Worker(BASE + "tp-worker.js"); } catch (e) { worker = null; }
    return worker;
  }

  function mountAttack(root) {
    root.classList.add("w-ready");
    var cfg = { model: "trad", per: 40, noise: 1 };
    var running = false;
    var pSeg = pairSeg(function () { paperRef(); });
    var mSeg = seg([
      { value: "trad", label: "Traditional" },
      { value: "s6", label: "TP-NET, structure 6" },
      { value: "s7", label: "TP-NET, structure 7" },
      { value: "fresh", label: "TP-NET, fresh structures", levels: "ug grad res" }
    ], cfg.model, function (v) { cfg.model = v; paperRef(); }, "Victim");
    var cSeg = seg([{ value: 40, label: "40" }, { value: 160, label: "160" }], cfg.per, function (v) { cfg.per = v; }, "Labeled captures per structure");
    var nSeg = seg([{ value: 1, label: "Default" }, { value: 4, label: "4×" }, { value: 16, label: "16×" }], cfg.noise, function (v) { cfg.noise = v; }, "Noise");
    var run = el("button", { type: "button", class: "w-btn", text: "Run the attack" });
    var status = el("p", { class: "w-note tp-status", "aria-live": "polite" });
    var big = el("p", { class: "w-big" });
    var ref = el("p", { class: "w-note" });
    var tableWrap = el("div", { class: "tp-table-wrap", "data-levels": "ug grad res" });
    root.appendChild(el("div", { class: "tp-ctrls" }, [
      labeled("Widths", pSeg),
      labeled("Victim", mSeg),
      labeled("Captures", cSeg, "hs ug grad res"),
      labeled("Noise", nSeg, "grad res")
    ]));
    root.appendChild(el("div", { class: "w-actions" }, [run, status]));
    root.appendChild(big);
    root.appendChild(ref);
    root.appendChild(tableWrap);

    function paperRef() {
      var P = E.TABLE_INF[state.pair];
      var v = cfg.model === "trad" ? P.trad : cfg.model === "s6" ? P.s6 : cfg.model === "s7" ? P.s7 : null;
      ref.textContent = v
        ? "Paper, Table " + P.table + " (real ChipWhisperer traces, 1,600 labeled captures per " + (cfg.model === "trad" ? "network" : "structure") + ", 600 unlabeled per width): " + pct(v[0]) + " with k = 3 and " + pct(v[1]) + " with k = 6."
        : "The paper tested only fixed structures; with widths drawn afresh for every capture, the attacker never sees the test structure in training.";
      drawTable();
    }
    function msgCfg() {
      var o = {}; Object.keys(E.DEFAULTS).forEach(function (k) { o[k] = E.DEFAULTS[k]; });
      o.noise = E.DEFAULTS.noise * cfg.noise; o.meas = E.DEFAULTS.meas * cfg.noise;
      var p = PAIRS[state.pair];
      var model = cfg.model === "trad" ? "trad" : cfg.model === "fresh" ? "fresh" : "tp";
      return { model: model, ma: p[0], mb: p[1], test: cfg.model === "s7" ? 7 : 6, labeled: cfg.per, unlabeled: Math.round(cfg.per * 0.75), dims: 5000, ks: [3, 6], seed: state.seed, opts: o };
    }
    function show(r, t0, c) {
      big.innerHTML = "Accuracy <strong>" + pct(r.accuracy[0], 1) + "</strong> with k = 3 and <strong>" + pct(r.accuracy[1], 1) + "</strong> with k = 6 (" +
        int(r.correct[0]) + " and " + int(r.correct[1]) + " of " + int(r.nTest) + " unlabeled captures; " + int(r.nTrain) + " labeled; simulated)";
      var note = "Done in " + ((Date.now() - t0) / 1000).toFixed(1) + " s on your device. Chance is 50%.";
      if (c.model === "tp" && r.accuracy[0] < 0.4) note += " Below chance: the test structure looks more like the other width's labeled structures than its own.";
      status.textContent = note;
    }
    function go() {
      if (running) return;
      running = true; run.disabled = true; run.classList.add("running"); run.textContent = "Running…";
      big.textContent = "";
      var t0 = Date.now(), c = msgCfg();
      function finish() { running = false; run.disabled = false; run.classList.remove("running"); run.textContent = "Run the attack"; state.seed++; }
      var w = getWorker();
      if (!w) {
        status.textContent = "Capturing and classifying…";
        setTimeout(function () { show(E.attack(c), t0, c); finish(); }, 30);
        return;
      }
      w.onmessage = function (e) {
        var m = e.data;
        if (m.type === "progress") status.textContent = m.stage === "classify" ? "Classifying: " + m.done + " of " + m.total + " unlabeled captures" : "Simulating " + m.stage + " captures: " + int(m.done) + " of " + int(m.total);
        else if (m.type === "result") { show(m.result, t0, c); finish(); }
      };
      w.onerror = function () { status.textContent = "The attack could not run in a background thread here."; finish(); };
      w.postMessage({ rows: state.rows, cfg: c });
    }
    run.addEventListener("click", go);

    function drawTable() {
      if (!state.pre) { tableWrap.innerHTML = ""; return; }
      var A = state.pre.attack, noises = deep() ? ["1", "4", "16"] : ["1"];
      var html = '<table class="results-table tp-num"><caption class="w-note">Tables V to VII as printed beside this page\'s simulation (' + int(A["1"].labeled) + ' labeled captures per network or structure, ' + int(A["1"].unlabeled) +
        ' unlabeled per width, 5,000 points, Euclidean k-NN; k = 3 / k = 6). Simulated values are the page\'s, not the paper\'s.</caption><thead><tr><th>Widths</th><th>Victim</th><th>Paper</th>' +
        noises.map(function (n) { return "<th>Page" + (n === "1" ? "" : ", noise " + n + "×") + "</th>"; }).join("") + "</tr></thead><tbody>";
      Object.keys(PAIRS).forEach(function (k) {
        var P = E.TABLE_INF[k];
        [["trad", "Traditional", P.trad], ["s6", "Structure 6", P.s6], ["s7", "Structure 7", P.s7], ["fresh", "Fresh structures", null]].forEach(function (row, ri) {
          var cur = k === state.pair && row[0] === cfg.model;
          html += "<tr" + (cur ? ' class="tp-current"' : "") + "><td>" + (ri ? "" : PAIRS[k][0] + " vs " + PAIRS[k][1]) + "</td><td>" + row[1] + "</td><td>" + (row[2] ? row[2][0].toFixed(4) + " / " + row[2][1].toFixed(4) : "–") + "</td>" +
            noises.map(function (n) { var x = A[n].results[k][row[0]]; return '<td class="tp-sim">' + x.k3.toFixed(4) + " / " + x.k6.toFixed(4) + "</td>"; }).join("") + "</tr>";
        });
      });
      tableWrap.innerHTML = html + "</tbody></table>";
    }
    onChange(function (what) {
      if (what === "pair") { pSeg.set(state.pair); paperRef(); big.textContent = ""; status.textContent = ""; }
      if (what === "level" || what === "pre") drawTable();
    });
    paperRef();
  }

  /* ------------------------------------------------------------ demo 4: the accuracy cost */

  function mountAccuracy(root) {
    root.classList.add("w-ready");
    var m = 8, scale = "z", epochs = 1500, seed = 1, running = false, last = null;
    var wSeg = seg([8, 10, 14].map(function (v) { return { value: v, label: v + " nodes" }; }), m, function (v) { m = v; refLine(); }, "Hidden-layer width");
    var sSeg = seg([{ value: "255", label: "Bytes ÷ 255" }, { value: "z", label: "Standardized" }], scale, function (v) { scale = v; }, "Input scaling");
    var eSeg = seg([{ value: 150, label: "150" }, { value: 1500, label: "1,500" }], epochs, function (v) { epochs = v; }, "Epochs of ten rows");
    var run = el("button", { type: "button", class: "w-btn", text: "Train both models" });
    var status = el("p", { class: "w-note tp-status", "aria-live": "polite" });
    var chart = svg("svg", { class: "tp-chart", role: "img" });
    var big = el("p", { class: "w-big" });
    var ref = el("p", { class: "w-note" });
    var tableWrap = el("div", { class: "tp-table-wrap", "data-levels": "grad res" });
    root.appendChild(el("div", { class: "tp-ctrls" }, [
      labeled("Width", wSeg),
      labeled("Inputs", sSeg, "ug grad res"),
      labeled("Epochs", eSeg, "ug grad res")
    ]));
    root.appendChild(el("div", { class: "w-actions" }, [run, status]));
    root.appendChild(chart);
    root.appendChild(big);
    root.appendChild(ref);
    root.appendChild(tableWrap);

    function refLine() {
      var P = E.TABLE4.diabetes[m];
      ref.textContent = "Paper, Table IV (Diabetes, " + m + " nodes): traditional " + pct(P[0]) + ", TP-NET " + pct(P[1]) + " (average of the seven structures). Answering \"not diabetic\" for every one of this page's 143 held-out rows scores 65.03%.";
    }
    function go() {
      if (running) return;
      running = true; run.disabled = true; run.classList.add("running"); run.textContent = "Training…";
      var opts = { seed: seed, epochs: epochs, scale: scale }, out = { m: m, trad: null, tp: [] }, t0 = Date.now(), step = 0;
      function next() {
        if (step === 0) out.trad = E.trainTraditional(m, opts);
        else out.tp.push(E.trainTPNet(E.TABLE3[m][step - 1], opts));
        step++;
        status.textContent = "Trained " + step + " of 8 models";
        if (step < 8) setTimeout(next, 0);
        else { last = out; draw(); status.textContent = "Done in " + ((Date.now() - t0) / 1000).toFixed(1) + " s on your device (run " + seed + "). Press again for new random starts."; seed++; running = false; run.disabled = false; run.classList.remove("running"); run.textContent = "Train both models"; }
      }
      setTimeout(next, 20);
    }
    run.addEventListener("click", go);
    function draw() {
      var W = chartWidth(chart), H = 230, L = 46, R = 74, T = 14, B = 40;
      chart.setAttribute("viewBox", "0 0 " + W + " " + H); chart.innerHTML = "";
      if (!last) { chart.setAttribute("aria-label", "No models trained yet"); return; }
      var bars = [{ label: "trad.", v: last.trad.test, cls: "tp-bar trad" }];
      last.tp.forEach(function (r, i) { bars.push({ label: "S" + (i + 1), v: r.test, cls: "tp-bar" }); });
      var mean = last.tp.reduce(function (s, r) { return s + r.test; }, 0) / last.tp.length;
      bars.push({ label: "mean", v: mean, cls: "tp-bar mean" });
      var lo = 0.3, hi = 0.85, bw = (W - L - R) / bars.length;
      var yOf = function (v) { return T + (hi - v) / (hi - lo) * (H - T - B); };
      [0.3, 0.4, 0.5, 0.6, 0.7, 0.8].forEach(function (v) {
        chart.appendChild(svg("line", { x1: L, x2: W - R, y1: yOf(v), y2: yOf(v), class: "c-grid" }));
        chart.appendChild(svg("text", { x: L - 4, y: yOf(v) + 4, "text-anchor": "end", class: "c-tick" }, Math.round(v * 100) + "%"));
      });
      bars.forEach(function (b, i) {
        var x = L + i * bw + bw * 0.18, v = Math.max(lo, b.v);
        chart.appendChild(svg("rect", { x: x, width: bw * 0.64, y: yOf(v), height: yOf(lo) - yOf(v), class: b.cls }));
        chart.appendChild(svg("text", { x: x + bw * 0.32, y: yOf(v) - 4, "text-anchor": "middle", class: "c-tick" }, (b.v * 100).toFixed(1)));
        chart.appendChild(svg("text", { x: x + bw * 0.32, y: H - 22, "text-anchor": "middle", class: "c-label" }, b.label));
      });
      var maj = 93 / 143;
      chart.appendChild(svg("line", { x1: L, x2: W - R, y1: yOf(maj), y2: yOf(maj), class: "c-ref" }));
      chart.appendChild(svg("text", { x: W - R + 4, y: yOf(maj) - 4, class: "c-label" }, "all \"no\""));
      chart.appendChild(svg("text", { x: W - R + 4, y: yOf(maj) + 12, class: "c-label" }, "65.0%"));
      chart.appendChild(svg("text", { x: L, y: H - 4, class: "c-label" }, "held-out accuracy, 143 rows · trained on your device"));
      chart.setAttribute("aria-label", "Held-out accuracy of the traditional network and TP-NET structures 1 to 7 with " + last.m + " nodes");
      var drop = E.relChange(last.trad.test, mean);
      big.innerHTML = last.m + " nodes: traditional <strong>" + pct(last.trad.test, 1) + "</strong>, TP-NET mean <strong>" + pct(mean, 1) + "</strong> (" + (drop >= 0 ? "↑" : "↓") + Math.abs(drop).toFixed(2) + "% relative)";
      var allNeg = last.trad.positives === 0 && last.tp.every(function (r) { return r.positives === 0; });
      if (allNeg) big.innerHTML += "<br><span class=\"w-note\">Every model here answers \"not diabetic\" for all 143 rows. Try standardized inputs and 1,500 epochs.</span>";
    }
    function drawTable() {
      if (!state.pre) return;
      var A = state.pre.accuracy;
      var html = '<table class="results-table tp-num"><caption class="w-note">This page\'s networks over ' + A.seeds + ' random starts (mean held-out accuracy on 143 rows; sequential 80/20 split), beside Table IV. The paper does not report its scaling, epochs, or split.</caption>' +
        "<thead><tr><th>Width</th><th>Paper traditional</th><th>Paper TP-NET</th>" + A.settings.map(function (s) { return "<th>Page traditional, " + s.label + "</th><th>Page TP-NET, " + s.label + "</th>"; }).join("") + "</tr></thead><tbody>";
      [8, 10, 14].forEach(function (w) {
        var P = E.TABLE4.diabetes[w];
        html += "<tr><td>" + w + "</td><td>" + P[0].toFixed(4) + "</td><td>" + P[1].toFixed(4) + "</td>" +
          A.settings.map(function (s) { var r = s.results[w]; return '<td class="tp-sim">' + r.trad.toFixed(4) + '</td><td class="tp-sim">' + r.tp.toFixed(4) + "</td>"; }).join("") + "</tr>";
      });
      tableWrap.innerHTML = html + "</tbody></table>";
    }
    onChange(function (what) { if (what === "pre") drawTable(); });
    resizers.push(draw);
    refLine();
    draw();
  }

  /* ------------------------------------------------------------ boot */

  var MOUNTS = { "tp-trace": mountTrace, "tp-count": mountCount, "tp-attack": mountAttack, "tp-accuracy": mountAccuracy };
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
      return fetch(BASE + "precomputed.json");
    }).then(function (r) { return r.json(); }).then(function (j) { state.pre = j; changed("pre"); })
      .catch(function (err) { if (window.console) console.warn("tp-net-privacy:", err); });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();

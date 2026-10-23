/*
  Widget for /papers/aes-sbox-normality/.
  Mount points: #sn-bell, #sn-tvla, #sn-slices, #sn-table, #sn-lab.
  Every trace on this page is simulated by engine.js (Hamming-weight leakage
  of AES state bytes, Gaussian noise, a per-trace offset, and a 10-bit ADC)
  and labeled as such. The paper's own numbers appear only in the Table 1
  demo and the readouts that cite them.
*/
(function () {
  "use strict";

  var E = window.SboxNormality;
  if (!E) return;
  var SVGNS = "http://www.w3.org/2000/svg";
  var LSB = 1 / 1024, ALPHA = 1e-4, TH = 4.5;

  /* ------------------------------------------------------- shared state */
  var LEAK_SB1 = E.LAYOUT.leaks[16 + 3].at; // round 1 SubBytes, byte 3
  var QUIET = 30;
  var state = { sbox: "default", seed: 13, traces: 1000, adcBits: 10, pick: null };
  var listeners = [];
  function changed(what) { listeners.forEach(function (fn) { fn(what); }); }
  var cache = { key: null, sim: null, tv: null };
  function current() {
    var key = [state.sbox, state.seed, state.traces, state.adcBits].join("|");
    if (cache.key !== key) {
      cache.key = key;
      cache.sim = E.simulate({ sbox: state.sbox, seed: state.seed, traces: state.traces, adcBits: state.adcBits });
      cache.tv = null; cache.wz = null;
    }
    return cache.sim;
  }
  function currentTvla() { var s = current(); if (!cache.tv) cache.tv = E.tvla(s); return cache.tv; }
  function currentWilcoxon() { var s = current(); if (!cache.wz) cache.wz = E.wilcoxonTrace(s); return cache.wz; }

  /* ------------------------------------------------------------ helpers */
  function el(tag, attrs, kids) {
    var node = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === "text") node.textContent = attrs[k];
      else if (k === "html") node.innerHTML = attrs[k];
      else if (k.slice(0, 2) === "on") node.addEventListener(k.slice(2), attrs[k]);
      else node.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (kid) { if (kid != null) node.appendChild(typeof kid === "string" ? document.createTextNode(kid) : kid); });
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
  var resizers = [], resizeTimer = null;
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
    wrap.set = set; wrap.buttons = btns;
    return wrap;
  }
  function labeled(text, node, levels) {
    var w = el("div", { class: "w-actions" }, [el("span", { class: "seg-label", text: text }), node]);
    if (levels) w.setAttribute("data-levels", levels);
    return w;
  }
  function range(label, min, max, step, value, onInput, fmtv) {
    fmtv = fmtv || String;
    var input = el("input", { type: "range", min: min, max: max, step: step, value: value, "aria-label": label });
    var out = el("output", { text: fmtv(value) });
    input.addEventListener("input", function () { out.textContent = fmtv(+input.value); onInput(+input.value); });
    return el("label", { class: "w-range" }, [el("span", { text: label }), input, out]);
  }
  function pfmt(p) {
    if (p == null || isNaN(p)) return "–";
    if (p === 0) return "< 10⁻³⁰⁰";
    if (p >= 0.001) return p.toFixed(p >= 0.1 ? 2 : 3);
    var e = Math.floor(Math.log10(p)), m = p / Math.pow(10, e);
    if (m >= 9.95) { m = 1; e += 1; }
    return m.toFixed(1) + " × 10" + sup(e);
  }
  function sup(n) {
    var map = { "-": "⁻", "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹" };
    return String(n).split("").map(function (c) { return map[c] || c; }).join("");
  }
  function num(n) { return n.toLocaleString("en-US"); }
  function verdict(p) { return p < ALPHA ? el("span", { class: "sn-yes", text: "rejects" }) : el("span", { class: "sn-no", text: "does not reject" }); }
  function readout(head, rows) {
    var t = el("table", { class: "sn-readout" });
    var tr = el("tr");
    head.forEach(function (h) { var th = el("th", { text: h.text || h }); if (h.levels) th.setAttribute("data-levels", h.levels); tr.appendChild(th); });
    t.appendChild(el("thead", {}, [tr]));
    var tb = el("tbody");
    rows.forEach(function (r) {
      var row = el("tr");
      if (r.levels) row.setAttribute("data-levels", r.levels);
      r.cells.forEach(function (c, i) {
        var td = el("td", { class: c && c.num ? "num" : "" });
        var v = c && c.node ? c.node : (c && c.text != null ? c.text : c);
        if (v instanceof Node) td.appendChild(v); else td.textContent = v;
        if (head[i] && head[i].levels) td.setAttribute("data-levels", head[i].levels);
        row.appendChild(td);
      });
      tb.appendChild(row);
    });
    t.appendChild(tb);
    return t;
  }
  function describeSample(t) {
    var st = E.stepAt(t);
    if (!st) return "sample " + num(t) + " (outside the encryption)";
    var r = st.round === 0 ? "the initial AddRoundKey" : st.name + ", round " + st.round;
    return "sample " + num(t) + " (" + r + (st.byte != null ? ", byte " + st.byte : "") + ")";
  }

  /* ---------------------------------------- demo 1: is it a bell curve? */
  function mountBell(root) {
    var moment = "leak", group = 0;
    var momentSeg = seg([
      { value: "quiet", label: "Quiet moment" },
      { value: "leak", label: "First S-box lookup" },
      { value: "pick", label: "Your pick" }
    ], moment, function (v) { moment = v; draw(); }, "Moment in the trace");
    var groupSeg = seg([{ value: 0, label: "Random inputs" }, { value: 1, label: "Fixed input" }], group, function (v) { group = v; draw(); }, "Group");
    var tracesSeg = seg([100, 500, 1000, 5000].map(function (n) { return { value: n, label: num(n) }; }), state.traces, function (v) { state.traces = v; changed("traces"); }, "Traces in both groups");
    var adcSeg = seg([{ value: 10, label: "10-bit ADC" }, { value: 0, label: "Ideal (no rounding)" }], state.adcBits, function (v) { state.adcBits = v; changed("adc"); }, "Recorder");
    var big = el("p", { class: "w-big", "aria-live": "polite" });
    var chart = svg("svg", { class: "sn-chart", role: "img" });
    var tableHost = el("div");
    var note = el("p", { class: "w-note" });
    root.appendChild(labeled("Moment", momentSeg));
    root.appendChild(labeled("Group", groupSeg));
    root.appendChild(labeled("Traces", tracesSeg));
    root.appendChild(labeled("Recorder", adcSeg, "hs ug grad res"));
    root.appendChild(big);
    root.appendChild(el("div", { class: "w-sim", text: "Simulated power readings, not the paper's measurements" }));
    root.appendChild(chart);
    root.appendChild(tableHost);
    root.appendChild(note);
    listeners.push(function () {
      tracesSeg.set(state.traces); adcSeg.set(state.adcBits);
      momentSeg.buttons[2].disabled = state.pick == null;
      draw();
    });
    momentSeg.buttons[2].disabled = true;
    momentSeg.buttons[2].title = "Click a point on the leakage map below to pick a moment";

    function draw() {
      var sim = current();
      var t = moment === "quiet" ? QUIET : (moment === "pick" && state.pick != null ? state.pick : LEAK_SB1);
      var x = E.column(sim, t, group);
      var sw = E.shapiro(x), ks = E.ksOne(x), mv = E.meanVar(x), sd = Math.sqrt(mv.var);
      // histogram in LSB units
      var vals = x.map(function (v) { return v / LSB; });
      var lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals);
      var bw = state.adcBits ? 1 : Math.max(0.25, (hi - lo) / 40);
      var start = state.adcBits ? lo - 0.5 : lo, nb = Math.max(1, Math.ceil((hi - start) / bw + 1e-9) + (state.adcBits ? 0 : 1));
      var counts = new Array(nb).fill(0);
      vals.forEach(function (v) { var b = Math.min(nb - 1, Math.floor((v - start) / bw)); counts[b]++; });
      var W = chartWidth(chart), H = 220, padL = 40, padR = 10, padT = 14, padB = 36;
      chart.setAttribute("viewBox", "0 0 " + W + " " + H);
      clear(chart);
      var xmin = start - bw, xmax = start + nb * bw + bw;
      var cmax = Math.max.apply(null, counts);
      var mu = mv.mean / LSB, s = sd / LSB;
      var peak = s > 0 ? x.length * bw / (s * Math.sqrt(2 * Math.PI)) : cmax;
      var ymax = Math.max(cmax, peak) * 1.1 || 1;
      var X = function (v) { return padL + (v - xmin) / (xmax - xmin) * (W - padL - padR); };
      var Y = function (c) { return H - padB - c / ymax * (H - padT - padB); };
      chart.appendChild(svg("line", { class: "c-axis", x1: padL, x2: W - padR, y1: H - padB, y2: H - padB }));
      for (var b = 0; b < nb; b++) {
        if (!counts[b]) continue;
        var x0 = X(start + b * bw), x1 = X(start + (b + 1) * bw);
        chart.appendChild(svg("rect", { class: "sn-bar", x: x0 + 0.5, y: Y(counts[b]), width: Math.max(1, x1 - x0 - 1), height: H - padB - Y(counts[b]) }));
      }
      if (s > 0) {
        var d = "";
        for (var i = 0; i <= 120; i++) {
          var xv = xmin + (xmax - xmin) * i / 120, z = (xv - mu) / s;
          d += (i ? "L" : "M") + X(xv).toFixed(1) + "," + Y(peak * Math.exp(-0.5 * z * z)).toFixed(1);
        }
        chart.appendChild(svg("path", { class: "sn-curve", d: d }));
      }
      var step = Math.max(1, Math.ceil((xmax - xmin) / 8));
      for (var tv = Math.ceil(xmin); tv <= xmax; tv += step) {
        chart.appendChild(svg("text", { class: "c-tick", x: X(tv), y: H - padB + 14, "text-anchor": "middle" }, String(Math.round(tv))));
      }
      chart.appendChild(svg("text", { class: "c-label", x: (padL + W - padR) / 2, y: H - 4, "text-anchor": "middle" }, "Reading, in ADC steps (1/1,024 of the input range)"));
      chart.appendChild(svg("text", { class: "c-tick", x: padL - 6, y: Y(cmax) + 4, "text-anchor": "end" }, String(cmax)));
      chart.setAttribute("aria-label", "Histogram of " + x.length + " simulated readings with the matching bell curve");

      var distinct = new Set(x).size;
      big.innerHTML = "";
      big.appendChild(document.createTextNode("Shapiro-Wilk: p = "));
      big.appendChild(el("strong", { text: pfmt(sw.p) }));
      big.appendChild(document.createTextNode(sw.p < ALPHA ? "  · not a bell curve at the paper's 0.0001 level" : "  · consistent with a bell curve at the 0.0001 level"));
      clear(tableHost);
      tableHost.appendChild(readout([
        "Test", { text: "Statistic", levels: "ug grad res" }, "p-value", "At α = 0.0001"
      ], [
        { cells: ["Shapiro-Wilk", { text: "W = " + sw.W.toFixed(4), num: true }, { text: pfmt(sw.p), num: true }, { node: verdict(sw.p) }] },
        { cells: ["Kolmogorov-Smirnov (one sample)", { text: "D = " + ks.D.toFixed(4), num: true }, { text: pfmt(ks.p), num: true }, { node: verdict(ks.p) }], levels: "hs ug grad res" }
      ]));
      note.textContent = "Showing " + num(x.length) + " readings at " + describeSample(t) + " from the " + (group ? "fixed" : "random") + " group: " + distinct + " distinct values" +
        (state.adcBits ? " because the 10-bit recorder rounds every reading to a whole step" : "") +
        ". The paper analyzed about 1,000 traces per s-box (about 500 per group) captured on a ChipWhisperer-Lite; these readings are simulated.";
    }
    resizers.push(draw);
    draw();
  }

  /* --------------------------------------------- demo 2: the leakage map */
  function mountTvla(root) {
    var stat = "t";
    var sboxSeg = seg(Object.keys(E.SBOXES).map(function (k) { return { value: k, label: E.SBOXES[k].label }; }), state.sbox, function (v) { state.sbox = v; changed("sbox"); }, "S-box");
    var statSeg = seg([{ value: "t", label: "Welch's t" }, { value: "w", label: "Wilcoxon z (paired)" }], stat, function (v) { stat = v; draw(); }, "Statistic");
    var bNew = el("button", { type: "button", class: "w-btn", text: "New capture", onclick: function () { state.seed += 1; changed("seed"); } });
    var big = el("p", { class: "w-big", "aria-live": "polite" });
    var chart = svg("svg", { class: "sn-chart", role: "img" });
    var tableHost = el("div");
    var note = el("p", { class: "w-note" });
    root.appendChild(labeled("S-box", sboxSeg));
    root.appendChild(labeled("Statistic", statSeg, "ug grad res"));
    root.appendChild(el("div", { class: "w-actions" }, [bNew]));
    root.appendChild(big);
    root.appendChild(el("div", { class: "w-sim", text: "Simulated fixed-versus-random capture · click the chart to pick a moment" }));
    root.appendChild(chart);
    root.appendChild(tableHost);
    root.appendChild(note);
    listeners.push(function (what) { sboxSeg.set(state.sbox); if (what !== "pick") draw(); else drawPick(); });
    var geom = null;
    chart.addEventListener("click", function (ev) {
      if (!geom) return;
      var rect = chart.getBoundingClientRect();
      var vx = (ev.clientX - rect.left) / rect.width * geom.W;
      var t = Math.round((vx - geom.padL) / (geom.W - geom.padL - geom.padR) * (geom.T - 1));
      if (t < 0 || t >= geom.T) return;
      // snap to the strongest sample within three samples
      var best = t, arr = geom.vals;
      for (var k = Math.max(0, t - 3); k <= Math.min(geom.T - 1, t + 3); k++) if (Math.abs(arr[k]) > Math.abs(arr[best])) best = k;
      state.pick = best;
      changed("pick");
    });
    var pickLine = null;
    function drawPick() {
      if (!geom) return;
      if (pickLine) { pickLine.remove(); pickLine = null; }
      if (state.pick == null) return;
      var x = geom.padL + state.pick / (geom.T - 1) * (geom.W - geom.padL - geom.padR);
      pickLine = svg("line", { class: "sn-pick", x1: x, x2: x, y1: geom.padT, y2: geom.H - geom.padB });
      chart.appendChild(pickLine);
      note.textContent = "Picked " + describeSample(state.pick) + ". The first demo can now show the readings at this moment (choose Your pick).";
    }
    function draw() {
      var sim = current(), tv = currentTvla();
      var vals = stat === "t" ? tv.t : currentWilcoxon().z;
      var T = sim.T, W = chartWidth(chart), H = 250, padL = 40, padR = 8, padT = 22, padB = 30;
      geom = { W: W, H: H, padL: padL, padR: padR, padT: padT, padB: padB, T: T, vals: vals };
      chart.setAttribute("viewBox", "0 0 " + W + " " + H);
      clear(chart); pickLine = null;
      var m = 0; for (var i = 0; i < T; i++) m = Math.max(m, Math.abs(vals[i]));
      var ylim = Math.max(8, Math.ceil(m / 5) * 5);
      var X = function (t) { return padL + t / (T - 1) * (W - padL - padR); };
      var Y = function (v) { return padT + (1 - (v + ylim) / (2 * ylim)) * (H - padT - padB); };
      [-ylim, -ylim / 2, 0, ylim / 2, ylim].forEach(function (v) {
        chart.appendChild(svg("line", { class: v === 0 ? "c-axis" : "c-grid", x1: padL, x2: W - padR, y1: Y(v), y2: Y(v) }));
        chart.appendChild(svg("text", { class: "c-tick", x: padL - 6, y: Y(v) + 4, "text-anchor": "end" }, String(v)));
      });
      [TH, -TH].forEach(function (v) { chart.appendChild(svg("line", { class: "sn-band", x1: padL, x2: W - padR, y1: Y(v), y2: Y(v) })); });
      // round labels
      for (var r = 0; r <= 10; r++) {
        var s0 = r === 0 ? 0 : (r === 1 ? 1 : 1 + 4 * (r - 1));
        var t0 = E.LAYOUT.pre + s0 * E.LAYOUT.opLen;
        chart.appendChild(svg("line", { class: "c-grid", x1: X(t0), x2: X(t0), y1: padT - 4, y2: padT + 2 }));
        if (r > 0 && (W >= 480 || r % 2 === 1)) chart.appendChild(svg("text", { class: "sn-round", x: X(t0) + 2, y: padT - 8 }, "R" + r));
      }
      var d = "", stride = Math.max(1, Math.floor(T / (W - padL - padR) / 1));
      for (var t = 0; t < T; t += 1) {
        d += (t ? "L" : "M") + X(t).toFixed(1) + "," + Y(Math.max(-ylim, Math.min(ylim, vals[t]))).toFixed(1);
      }
      chart.appendChild(svg("path", { class: "sn-trace", d: d }));
      chart.appendChild(svg("text", { class: "c-label", x: (padL + W - padR) / 2, y: H - 6, "text-anchor": "middle" }, "Sample (time) · 2,440 per trace · dashed lines at ±4.5"));
      chart.setAttribute("aria-label", (stat === "t" ? "Welch t" : "Wilcoxon z") + " value at each of 2,440 samples");
      var over = 0; for (i = 0; i < T; i++) if (Math.abs(vals[i]) > TH) over++;
      big.innerHTML = "";
      big.appendChild(el("strong", { text: num(over) }));
      big.appendChild(document.createTextNode(" of 2,440 moments cross ±4.5 · leakage " + (over ? "detected" : "not detected")));
      clear(tableHost);
      var nl = E.nonlinearity(E.SBOXES[state.sbox].table);
      tableHost.appendChild(readout(["Capture", "Value"], [
        { cells: ["Traces in the fixed group", { text: num(tv.nFixed), num: true }] },
        { cells: ["Traces in the random group", { text: num(tv.nRandom), num: true }] },
        { cells: ["Largest |" + (stat === "t" ? "t" : "z") + "|", { text: m.toFixed(1), num: true }] },
        { cells: ["S-box non-linearity (computed)", { text: String(nl), num: true }], levels: "ug grad res" }
      ]));
      if (state.pick == null) note.textContent = "Each point compares the fixed group with the random group at one moment of the encryption. The paper found leakage under this test for all nine of its s-box configurations; this capture is simulated with " + E.SBOXES[state.sbox].label + ".";
      drawPick();
    }
    resizers.push(draw);
    draw();
  }

  /* ------------------------- demo 3: which numbers go into the test? */
  function mountSlices(root) {
    var startAt = 0, traceNo = 0;
    var startR = range("Slice start", 0, 40, 4, startAt, function (v) { startAt = v; draw(); }, function (v) { return String(v); });
    var traceR = range("Trace number", 0, 49, 1, traceNo, function (v) { traceNo = v; draw(); }, function (v) { return String(v + 1); });
    var chart = svg("svg", { class: "sn-chart", role: "img" });
    var hist = svg("svg", { class: "sn-chart", role: "img" });
    var tableHost = el("div");
    var note = el("p", { class: "w-note" });
    root.appendChild(el("div", { class: "w-actions" }, [traceR, startR]));
    root.appendChild(el("div", { class: "w-sim", text: "Simulated trace · shaded: one 2,400-point slice" }));
    root.appendChild(chart);
    root.appendChild(el("div", { class: "sn-legend" }, [
      el("span", {}, [el("span", { class: "sn-key", style: "background: var(--primary)" }), "values inside the slice (one trace, consecutive moments)"]),
      el("span", {}, [el("span", { class: "sn-key", style: "background: var(--accent)" }), "one moment across every trace in a group"])
    ]));
    root.appendChild(hist);
    root.appendChild(tableHost);
    root.appendChild(note);
    listeners.push(function () { draw(); });
    function histPath(vals, lo, hi, nb) {
      var c = new Array(nb).fill(0);
      vals.forEach(function (v) { var b = Math.floor((v - lo) / (hi - lo) * nb); if (b >= 0 && b < nb) c[b]++; });
      var tot = vals.length; return c.map(function (k) { return k / tot; });
    }
    function draw() {
      var sim = current(), T = sim.T;
      var row = Array.from(sim.data.slice(traceNo * T, traceNo * T + T));
      var slice = row.slice(startAt, startAt + 2400);
      var t = state.pick != null ? state.pick : LEAK_SB1;
      var across = E.column(sim, t, 0);
      var W = chartWidth(chart), H = 150, padL = 40, padR = 8, padT = 10, padB = 22;
      chart.setAttribute("viewBox", "0 0 " + W + " " + H); clear(chart);
      var lo = Math.min.apply(null, row), hi = Math.max.apply(null, row);
      var X = function (i) { return padL + i / (T - 1) * (W - padL - padR); };
      var Y = function (v) { return padT + (1 - (v - lo) / (hi - lo || 1)) * (H - padT - padB); };
      chart.appendChild(svg("rect", { class: "sn-window", x: X(startAt), y: padT, width: X(startAt + 2399) - X(startAt), height: H - padT - padB }));
      var d = ""; for (var i = 0; i < T; i++) d += (i ? "L" : "M") + X(i).toFixed(1) + "," + Y(row[i]).toFixed(1);
      chart.appendChild(svg("path", { class: "sn-trace", d: d }));
      chart.appendChild(svg("line", { class: "sn-pick", x1: X(t), x2: X(t), y1: padT, y2: H - padB }));
      chart.appendChild(svg("text", { class: "c-label", x: (padL + W - padR) / 2, y: H - 4, "text-anchor": "middle" }, "Trace " + (traceNo + 1) + ", samples 0 to 2,439"));
      // histograms on a shared value axis
      var all = slice.concat(across), lo2 = Math.min.apply(null, all), hi2 = Math.max.apply(null, all) + LSB;
      var nb = Math.min(60, Math.max(10, Math.round((hi2 - lo2) / LSB)));
      var h1 = histPath(slice, lo2, hi2, nb), h2 = histPath(across, lo2, hi2, nb);
      var H2 = 170, padB2 = 30; hist.setAttribute("viewBox", "0 0 " + W + " " + H2); clear(hist);
      var ym = Math.max(Math.max.apply(null, h1), Math.max.apply(null, h2)) * 1.1;
      var bw = (W - padL - padR) / nb;
      for (var b = 0; b < nb; b++) {
        var y1 = H2 - padB2 - h1[b] / ym * (H2 - 10 - padB2), y2 = H2 - padB2 - h2[b] / ym * (H2 - 10 - padB2);
        if (h1[b]) hist.appendChild(svg("rect", { class: "sn-bar", x: padL + b * bw + 0.5, y: y1, width: Math.max(1, bw / 2 - 0.5), height: H2 - padB2 - y1 }));
        if (h2[b]) hist.appendChild(svg("rect", { x: padL + b * bw + bw / 2, y: y2, width: Math.max(1, bw / 2 - 0.5), height: H2 - padB2 - y2, style: "fill: var(--accent)" }));
      }
      hist.appendChild(svg("line", { class: "c-axis", x1: padL, x2: W - padR, y1: H2 - padB2, y2: H2 - padB2 }));
      hist.appendChild(svg("text", { class: "c-label", x: (padL + W - padR) / 2, y: H2 - 8, "text-anchor": "middle" }, "Reading (share of values in each bin)"));
      var swS = E.shapiro(slice), swA = E.shapiro(across);
      var worst = 0;
      for (var j = 0; j < Math.min(50, sim.n); j++) worst = Math.max(worst, E.shapiro(Array.from(sim.data.slice(j * T + startAt, j * T + startAt + 2400))).p);
      clear(tableHost);
      tableHost.appendChild(readout(["What is tested", "n", "Shapiro-Wilk p", "At α = 0.0001"], [
        { cells: ["One 2,400-point slice of trace " + (traceNo + 1), { text: num(slice.length), num: true }, { text: pfmt(swS.p), num: true }, { node: verdict(swS.p) }] },
        { cells: ["Largest p over the slices of traces 1 to 50", { text: "50 × 2,400", num: true }, { text: pfmt(worst), num: true }, { node: verdict(worst) }] },
        { cells: ["One moment (" + describeSample(t) + "), random group", { text: num(across.length), num: true }, { text: pfmt(swA.p), num: true }, { node: verdict(swA.p) }] },
        { cells: ["Paper: largest p across all traces", { text: "≈ 2,400 each", num: true }, { text: "1.443 × 10⁻³¹", num: true }, { node: verdict(1.443e-31) }] }
      ]));
      note.textContent = "A slice of consecutive samples mixes every instruction's power draw, so its histogram has the shape of the waveform, not of the noise. Welch's t-test compares one moment across traces, which is the accent-colored histogram. Which of the two the paper's subsets correspond to is this page's reading of its Methods; both rows above are computed from simulated traces.";
    }
    resizers.push(draw);
    draw();
  }

  /* ------------------------------------------ demo 4: the paper's Table 1 */
  // Kruskal-Wallis p-values as printed in Table 1 (Carper et al., 2023).
  // Only these blocks could be read in this session; see the page notes.
  var TABLE1 = [
    { name: "Default", color: "var(--primary)", p: [0.9178411, 0.7973211, 0.9492303, 0.4865965, 0.003551987, 0.4060664, 0.2482653, 0.03989401, 4.704231e-5, 1.787921e-28, 0.0002557376] },
    { name: "S1", color: "var(--accent)", p: [0.8889263, 0.9047302, 0.9721271, 0.5588611, 0.01427206, 0.5762426, 0.1448012, 0.1547279, 1.198919e-7, 6.674018e-24, 6.324433e-6] },
    { name: "S2", color: "var(--text)", p: [0.915456, 0.8438535, 0.9775268, 0.5287456, 0.01392253, 0.5347051, 0.1436789, 0.1304291, 1.721812e-7, 3.478914e-25, 5.773031e-6] },
    { name: "S3 (first four rows)", color: "var(--gray)", p: [0.9500724, 0.9117693, 0.9705669, 0.7504782, null, null, null, null, null, null, null] }
  ];
  function mountTable(root) {
    var on = { 0: true, 1: true, 2: true, 3: true }, showSim = false;
    var boxes = el("div", { class: "w-actions" });
    TABLE1.forEach(function (row, i) {
      var b = el("button", { type: "button", class: "seg-option", role: "switch", "aria-checked": "true", text: row.name });
      b.style.border = "1px solid var(--light-gray)";
      b.addEventListener("click", function () { on[i] = !on[i]; b.setAttribute("aria-checked", String(on[i])); draw(); });
      boxes.appendChild(b);
    });
    var simBtn = el("button", { type: "button", class: "seg-option", role: "switch", "aria-checked": "false", text: "Add this page's simulation (time tenths)", "data-levels": "grad res" });
    simBtn.style.border = "1px solid var(--light-gray)";
    simBtn.addEventListener("click", function () { showSim = !showSim; simBtn.setAttribute("aria-checked", String(showSim)); draw(); });
    boxes.appendChild(simBtn);
    var chart = svg("svg", { class: "sn-chart", role: "img", "aria-label": "Kruskal-Wallis p-values from Table 1 on a logarithmic scale" });
    var legend = el("div", { class: "sn-legend" });
    var note = el("p", { class: "w-note" });
    root.appendChild(boxes);
    root.appendChild(el("div", { class: "w-sim", text: "Values as printed in the paper's Table 1 (measured traces)" }));
    root.appendChild(chart);
    root.appendChild(legend);
    root.appendChild(note);
    listeners.push(function () { if (showSim) draw(); });
    function simDeciles() {
      var sim = current(), out = [];
      var all = [[], []];
      for (var d = 0; d < 10; d++) {
        var a = Math.floor(d * sim.T / 10), b = Math.floor((d + 1) * sim.T / 10), f = [], r = [];
        for (var j = 0; j < sim.n; j++) { var arr = sim.group[j] ? f : r; for (var t = a; t < b; t++) arr.push(sim.data[j * sim.T + t]); }
        out.push(E.kruskal([f, r]).p);
        all[0] = all[0].concat(f); all[1] = all[1].concat(r);
      }
      return [E.kruskal(all).p].concat(out);
    }
    function draw() {
      var W = chartWidth(chart), H = 260, padL = 44, padR = 10, padT = 14, padB = 40;
      chart.setAttribute("viewBox", "0 0 " + W + " " + H); clear(chart);
      var cats = ["Full"].concat([1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(String));
      var ymax = 30;
      var X = function (i) { return padL + (i + 0.5) / cats.length * (W - padL - padR); };
      var Y = function (p) { var v = -Math.log10(Math.max(p, 1e-30)); return padT + (1 - v / ymax) * (H - padT - padB); };
      [1, 1e-5, 1e-10, 1e-15, 1e-20, 1e-25, 1e-30].forEach(function (p) {
        chart.appendChild(svg("line", { class: "c-grid", x1: padL, x2: W - padR, y1: Y(p), y2: Y(p) }));
        chart.appendChild(svg("text", { class: "c-tick", x: padL - 6, y: Y(p) + 4, "text-anchor": "end" }, p === 1 ? "1" : "10" + sup(Math.round(Math.log10(p)))));
      });
      chart.appendChild(svg("line", { class: "sn-band", x1: padL, x2: W - padR, y1: Y(ALPHA), y2: Y(ALPHA) }));
      chart.appendChild(svg("text", { class: "c-tick", x: W - padR, y: Y(ALPHA) - 4, "text-anchor": "end" }, "α = 0.0001"));
      cats.forEach(function (c, i) { chart.appendChild(svg("text", { class: "c-tick", x: X(i), y: H - padB + 14, "text-anchor": "middle" }, c)); });
      chart.appendChild(svg("text", { class: "c-label", x: (padL + W - padR) / 2, y: H - 8, "text-anchor": "middle" }, "Full trace, then ten-quantiles 1 to 10"));
      var series = TABLE1.map(function (r, i) { return on[i] ? r : null; }).filter(Boolean);
      if (showSim) series.push({ name: "This page's simulation", color: "var(--dark-gray)", p: simDeciles(), sim: true });
      series.forEach(function (r, si) {
        var off = (si - (series.length - 1) / 2) * Math.min(6, (W - padL - padR) / cats.length / (series.length + 1));
        var d = "";
        r.p.forEach(function (p, i) { if (p == null) return; d += (d ? "L" : "M") + (X(i) + off).toFixed(1) + "," + Y(p).toFixed(1); });
        chart.appendChild(svg("path", { d: d, style: "fill:none;stroke:" + r.color + ";stroke-width:1.2;opacity:0.6" + (r.sim ? ";stroke-dasharray:3 3" : "") }));
        r.p.forEach(function (p, i) {
          if (p == null) return;
          var c = svg("circle", { class: "sn-dot" + (p < ALPHA && !r.sim ? " bold" : ""), cx: X(i) + off, cy: Y(p), r: 4, style: "fill:" + r.color });
          c.appendChild(svg("title", {}, r.name + ", " + cats[i] + ": p = " + p.toPrecision(7)));
          chart.appendChild(c);
        });
      });
      clear(legend);
      series.forEach(function (r) { legend.appendChild(el("span", {}, [el("span", { class: "sn-key", style: "background:" + r.color }), r.name])); });
      var sigDefault = TABLE1[0].p.filter(function (p) { return p != null && p < ALPHA; }).length;
      note.textContent = "Higher dots mean stronger evidence that the fixed and random groups differ. In the printed table, the full traces and quantiles 1 to 7 stay above the 0.0001 line for every s-box shown; quantiles 8 and 9 fall below it for Default, S1, and S2, and quantile 10 does for S1 and S2 (Default's is 0.00026). Default has " + sigDefault + " significant cells. Ringed dots are the cells the paper prints in bold." + (showSim ? " The dashed series splits this page's simulated traces into ten equal stretches of time and compares the pooled readings; the paper does not say whether its quantiles split time or values." : "");
    }
    resizers.push(draw);
    draw();
  }

  /* ------------------------------------------------ demo 5: the test bench */
  function mountLab(root) {
    var o = { sigma: 2.5, gain: 1.2, offset: 1.0, adcBits: 10, traces: 1000 };
    var sliders = el("div", {}, [
      range("Noise σ (steps)", 0.5, 6, 0.25, o.sigma, function (v) { o.sigma = v; }, function (v) { return v.toFixed(2); }),
      range("Leak per bit (steps)", 0, 3, 0.1, o.gain, function (v) { o.gain = v; }, function (v) { return v.toFixed(1); }),
      range("Trace offset σ", 0, 4, 0.25, o.offset, function (v) { o.offset = v; }, function (v) { return v.toFixed(2); })
    ]);
    var adc = seg([{ value: 8, label: "8-bit" }, { value: 10, label: "10-bit" }, { value: 12, label: "12-bit" }, { value: 0, label: "Ideal" }], o.adcBits, function (v) { o.adcBits = v; }, "ADC");
    var tr = seg([500, 1000, 2000, 5000].map(function (n) { return { value: n, label: num(n) }; }), o.traces, function (v) { o.traces = v; }, "Traces");
    var bRun = el("button", { type: "button", class: "w-btn", text: "Run every test" });
    var status = el("p", { class: "w-note", "aria-live": "polite" });
    var tableHost = el("div");
    root.appendChild(sliders);
    root.appendChild(labeled("ADC", adc));
    root.appendChild(labeled("Traces", tr));
    root.appendChild(el("div", { class: "w-actions" }, [bRun]));
    root.appendChild(status);
    root.appendChild(el("div", { class: "w-sim", text: "Simulated campaign · every number below is computed by this page" }));
    root.appendChild(tableHost);
    var running = false;
    bRun.addEventListener("click", run);
    function run() {
      if (running) return;
      running = true; bRun.disabled = true;
      status.textContent = "Simulating " + num(o.traces) + " traces…";
      setTimeout(function () {
        var sim = E.simulate({ sigma: o.sigma, gain: o.gain, offset: o.offset, adcBits: o.adcBits, traces: o.traces, sbox: state.sbox, seed: state.seed });
        var tv = E.tvla(sim), T = sim.T, t = 0;
        var acc = { swF: 0, swR: 0, ksF: 0, ksR: 0, wil: 0 };
        var F = E.groupRows(sim, 1), R = E.groupRows(sim, 0), m = Math.min(F.length, R.length);
        function chunk() {
          var end = Math.min(T, t + 160);
          for (; t < end; t++) {
            var f = [], r = [], i;
            for (i = 0; i < F.length; i++) f.push(sim.data[F[i] * T + t]);
            for (i = 0; i < R.length; i++) r.push(sim.data[R[i] * T + t]);
            if (E.shapiro(f).p < ALPHA) acc.swF++;
            if (E.shapiro(r).p < ALPHA) acc.swR++;
            if (E.ksOne(f).p < ALPHA) acc.ksF++;
            if (E.ksOne(r).p < ALPHA) acc.ksR++;
            if (Math.abs(E.wilcoxonPaired(f.slice(0, m), r.slice(0, m)).z) > TH) acc.wil++;
          }
          status.textContent = "Testing every moment: " + Math.round(100 * t / T) + "%";
          if (t < T) { setTimeout(chunk, 0); return; }
          finish();
        }
        function finish() {
          var worst = 0;
          for (var j = 0; j < Math.min(50, sim.n); j++) worst = Math.max(worst, E.shapiro(Array.from(sim.data.slice(j * T, j * T + 2400))).p);
          var Fv = [], Rv = [];
          for (var k = 0; k < sim.n; k++) { var arr = sim.group[k] ? Fv : Rv; for (var u = 0; u < T; u++) arr.push(sim.data[k * T + u]); }
          var ks2 = E.ksTwo(Fv, Rv), kw = E.kruskal([Fv, Rv]);
          var pct = function (c) { return (100 * c / T).toFixed(1) + "% (" + num(c) + ")"; };
          clear(tableHost);
          tableHost.appendChild(readout(["Test, as applied here", "Result on this capture", "Paper (measured)"], [
            { cells: ["Welch's t: moments with |t| > 4.5", { text: pct(tv.over), num: true }, "leakage in all nine s-boxes"] },
            { cells: ["Paired Wilcoxon: moments with |z| > 4.5", { text: pct(acc.wil), num: true }, "\"comparable\" to the t-test (Figure 4)"] },
            { cells: ["Shapiro-Wilk per moment, fixed group: share rejected", { text: pct(acc.swF), num: true }, "–"] },
            { cells: ["Shapiro-Wilk per moment, random group: share rejected", { text: pct(acc.swR), num: true }, "–"] },
            { cells: ["One-sample K-S per moment, fixed / random: share rejected", { text: pct(acc.ksF) + " / " + pct(acc.ksR), num: true }, "–"] },
            { cells: ["Shapiro-Wilk on 2,400-point slices: largest p (traces 1 to 50)", { text: pfmt(worst), num: true }, "largest p ≈ 1.443 × 10⁻³¹"] },
            { cells: ["Two-sample K-S, pooled readings, fixed vs. random", { text: "p = " + pfmt(ks2.p), num: true }, "p ≥ 0.9"] },
            { cells: ["Kruskal-Wallis, pooled readings, fixed vs. random", { text: "p = " + pfmt(kw.p), num: true }, "p = 0.89 to 0.95 (Default, S1 to S3)"] }
          ]));
          status.textContent = "Done: " + num(tv.nFixed) + " fixed and " + num(tv.nRandom) + " random traces, " + E.SBOXES[state.sbox].label + " S-box, α = 0.0001 throughout.";
          running = false; bRun.disabled = false;
        }
        chunk();
      }, 30);
    }
  }

  /* ---------------------------------------------------------------- mount */
  function mount(id, fn) {
    var node = document.getElementById(id);
    if (!node) return;
    try { fn(node); node.classList.add("w-ready"); }
    catch (err) { node.appendChild(el("p", { class: "w-note", text: "This demo could not start: " + err.message })); }
  }
  function start() {
    mount("sn-bell", mountBell);
    mount("sn-tvla", mountTvla);
    mount("sn-slices", mountSlices);
    mount("sn-table", mountTable);
    mount("sn-lab", mountLab);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();

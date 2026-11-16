/*
  Transition recovery attack widget for /papers/fsm-transition-recovery/.
  Mount points: #tr-machine, #tr-noise, #tr-attack, #tr-classes.
  Shared state: the oracle byte the chip runs, and the attack settings.
  Every power trace is simulated by fsm-engine.js and labeled so.
*/
(function () {
  "use strict";

  var E = window.FsmTR;
  if (!E) return;

  var SVGNS = "http://www.w3.org/2000/svg";
  var BASE = (document.currentScript && document.currentScript.src)
    ? document.currentScript.src.replace(/widget\.js(\?.*)?$/, "")
    : "";

  /* ------------------------------------------------------------ state */

  var state = {
    oracle: 128,
    seed: 1,
    level: window.PaperKit ? window.PaperKit.level() : "public",
    pre: null          // precomputed paper-size simulation (precomputed.json)
  };
  var listeners = [];
  function onChange(fn) { listeners.push(fn); }
  function changed(what) { listeners.forEach(function (fn) { fn(what); }); }
  document.addEventListener("paperlevel", function (e) { state.level = e.detail.level; changed("level"); });
  function deep() { return state.level === "grad" || state.level === "res"; }

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
      b.addEventListener("click", function () { if (b.disabled) return; set(o.value); onPick(o.value); });
      wrap.appendChild(b);
      btns.push({ b: b, v: o.value });
    });
    function set(v) { value = v; btns.forEach(function (x) { x.b.setAttribute("aria-checked", String(x.v === v)); }); }
    wrap.set = set;
    wrap.get = function () { return value; };
    wrap.disableAll = function (off) { btns.forEach(function (x) { x.b.disabled = off; }); };
    return wrap;
  }
  function labeled(label, control, levels) {
    var row = el("div", { class: "tr-ctl" }, [el("span", { class: "tr-ctl-label", text: label }), control]);
    if (levels) row.setAttribute("data-levels", levels);
    return row;
  }
  function pct(x, d) { return x == null ? "–" : (x * 100).toFixed(d == null ? 2 : d) + "%"; }
  function int(x) { return Math.round(x).toLocaleString("en-US"); }
  function bin8(v) { var s = (v >>> 0).toString(2); while (s.length < 8) s = "0" + s; return s; }
  function stateName(s) { return s === 1 ? "Compute" : "Send"; }
  function linePath(series, xOf, yOf) {
    var d = "";
    for (var i = 0; i < series.length; i++) d += (i ? "L" : "M") + xOf(i).toFixed(1) + " " + yOf(series[i]).toFixed(1);
    return d;
  }
  function axisY(g, x0, x1, yOf, ticks, fmt) {
    ticks.forEach(function (t) {
      var y = yOf(t);
      g.appendChild(svg("line", { x1: x0, x2: x1, y1: y, y2: y, class: "c-grid" }));
      g.appendChild(svg("text", { x: x0 - 6, y: y + 4, class: "c-tick", "text-anchor": "end" }, fmt(t)));
    });
  }

  /* ------------------------------------------------------------ demo 1: the machine and its byte */

  function mountMachine(root) {
    root.classList.add("w-ready");
    var playing = null, playStep = -1, mystery = null, mysteryTrace = null;

    var bitRow = el("div", { class: "tr-bits", role: "group", "aria-label": "Oracle bits, in the order the chip reads them" });
    var bitBtns = [];
    for (var i = 0; i < 8; i++) (function (b) {
      var btn = el("button", { type: "button", class: "tr-bit", "aria-pressed": "false" });
      btn.addEventListener("click", function () { stop(); state.oracle ^= (1 << b); changed("oracle"); });
      bitBtns.push(btn);
      bitRow.appendChild(el("div", { class: "tr-bitcell" }, [el("span", { class: "tr-bitstep", text: "Step " + (b + 1) }), btn]));
    })(i);

    var presets = [
      { v: 0, t: "0" }, { v: 1, t: "1" }, { v: 128, t: "128" }, { v: 85, t: "85" }, { v: 255, t: "255" }
    ];
    var presetRow = el("div", { class: "w-actions" });
    presets.forEach(function (p) {
      var b = el("button", { type: "button", class: "w-btn w-btn-quiet", text: p.t });
      b.addEventListener("click", function () { stop(); state.oracle = p.v; changed("oracle"); });
      presetRow.appendChild(b);
    });
    var rnd = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "Random" });
    rnd.addEventListener("click", function () { stop(); state.oracle = Math.floor(Math.random() * 256); changed("oracle"); });
    var play = el("button", { type: "button", class: "w-btn", text: "Play" });
    play.addEventListener("click", function () { if (playing) stop(); else start(); });
    presetRow.appendChild(rnd);
    presetRow.appendChild(play);

    var byteNote = el("p", { class: "w-note tr-byte" });
    var fsm = svg("svg", { class: "tr-fsm", viewBox: "0 0 360 130", role: "img", "aria-label": "The two-state machine. A 0 bit moves to state one, Compute; a 1 bit moves to state two, Send." });
    var chart = svg("svg", { class: "tr-chart", role: "img" });
    var read = el("p", { class: "w-note" });

    var mysteryRow = el("div", { class: "w-actions" });
    var mysteryBtn = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "Mystery byte" });
    var revealBtn = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "Reveal" });
    var mysteryNote = el("span", { class: "w-note", "aria-live": "polite" });
    mysteryBtn.addEventListener("click", function () {
      stop();
      mystery = Math.floor(Math.random() * 256);
      mysteryTrace = E.trace(mystery, 50000 + Math.floor(Math.random() * 100000), { avg: 30 });
      revealBtn.disabled = false;
      draw();
    });
    revealBtn.disabled = true;
    revealBtn.addEventListener("click", function () { if (mystery == null) return; state.oracle = mystery; changed("oracle"); });
    mysteryRow.appendChild(mysteryBtn);
    mysteryRow.appendChild(revealBtn);
    mysteryRow.appendChild(mysteryNote);

    root.appendChild(el("p", { class: "w-note", text: "Press a step to flip its bit. The chip reads the bits from step 1 to step 8." }));
    root.appendChild(bitRow);
    root.appendChild(presetRow);
    root.appendChild(byteNote);
    root.appendChild(fsm);
    root.appendChild(chart);
    root.appendChild(read);
    root.appendChild(mysteryRow);

    function stop() { if (playing) { clearInterval(playing); playing = null; } playStep = -1; play.textContent = "Play"; play.classList.remove("running"); }
    function start() {
      playStep = 0; play.textContent = "Stop"; play.classList.add("running"); draw();
      playing = setInterval(function () { playStep++; if (playStep > 7) { stop(); } draw(); }, 700);
    }

    function drawFsm(active) {
      fsm.innerHTML = "";
      var defs = svg("defs");
      var mk = svg("marker", { id: "tr-arrow", viewBox: "0 0 10 10", refX: "9", refY: "5", markerWidth: "7", markerHeight: "7", orient: "auto-start-reverse" });
      mk.appendChild(svg("path", { d: "M0 0L10 5L0 10z", class: "tr-arrowhead" }));
      defs.appendChild(mk); fsm.appendChild(defs);
      var S = [{ x: 95, label: "Compute", sub: "state one", s: 1 }, { x: 265, label: "Send", sub: "state two", s: 2 }];
      // Arrows: 0 into state one, 1 into state two, self-loops on each.
      fsm.appendChild(svg("path", { d: "M128 52 C160 30 200 30 232 52", class: "tr-edge", "marker-end": "url(#tr-arrow)" }));
      fsm.appendChild(svg("text", { x: 180, y: 28, class: "c-label", "text-anchor": "middle" }, "1"));
      fsm.appendChild(svg("path", { d: "M232 80 C200 102 160 102 128 80", class: "tr-edge", "marker-end": "url(#tr-arrow)" }));
      fsm.appendChild(svg("text", { x: 180, y: 112, class: "c-label", "text-anchor": "middle" }, "0"));
      fsm.appendChild(svg("path", { d: "M70 44 C40 10 20 60 62 66", class: "tr-edge", "marker-end": "url(#tr-arrow)" }));
      fsm.appendChild(svg("text", { x: 22, y: 26, class: "c-label" }, "0"));
      fsm.appendChild(svg("path", { d: "M290 44 C320 10 340 60 298 66", class: "tr-edge", "marker-end": "url(#tr-arrow)" }));
      fsm.appendChild(svg("text", { x: 332, y: 26, class: "c-label" }, "1"));
      S.forEach(function (n) {
        var on = active === n.s;
        fsm.appendChild(svg("circle", { cx: n.x, cy: 66, r: 33, class: "tr-node s" + n.s + (on ? " on" : "") }));
        fsm.appendChild(svg("text", { x: n.x, y: 64, class: "tr-node-label", "text-anchor": "middle" }, n.label));
        fsm.appendChild(svg("text", { x: n.x, y: 78, class: "c-tick", "text-anchor": "middle" }, n.sub));
      });
    }

    function draw() {
      var o = state.oracle, seq = E.states(o);
      bitBtns.forEach(function (b, i) {
        var bit = (o >>> i) & 1;
        b.textContent = String(bit);
        b.setAttribute("aria-pressed", String(!!bit));
        b.setAttribute("aria-label", "Step " + (i + 1) + ": bit " + bit + ", " + stateName(seq[i]));
        b.classList.toggle("s2", !!bit);
        b.parentNode.classList.toggle("now", playStep === i);
      });
      byteNote.innerHTML = "";
      byteNote.appendChild(document.createTextNode("Oracle byte "));
      byteNote.appendChild(el("strong", { text: String(o) }));
      byteNote.appendChild(el("span", { "data-levels": "hs ug grad res", text: " = " + bin8(o) + " in binary (written with step 1 last, on the right)" }));
      byteNote.appendChild(document.createTextNode(". States in order: " + seq.map(function (s) { return s === 1 ? "C" : "S"; }).join(" ") + " (C = Compute, S = Send)."));
      drawFsm(playStep >= 0 ? seq[playStep] : null);

      var W = chartWidth(chart), H = mystery != null ? 250 : 200, ml = 40, mr = 10, mt = 22, mb = 30;
      chart.setAttribute("viewBox", "0 0 " + W + " " + H);
      chart.setAttribute("aria-label", "Simulated power trace of the chip running oracle byte " + o + ", shaded by state");
      chart.innerHTML = "";
      var clean = E.cleanTrace(o), L = clean.length, starts = E.stepStarts(o);
      var lo = 0.1, hi = 1.4, xOf = function (i) { return ml + i * (W - ml - mr) / (L - 1); };
      var panels = mystery != null ? [{ top: mt, h: (H - mt - mb) / 2 - 8, series: mysteryTrace, cls: "tr-line mys", label: "Mystery byte: mean of 30 simulated captures" },
                                       { top: mt + (H - mt - mb) / 2 + 8, h: (H - mt - mb) / 2 - 8, series: clean, cls: "tr-line", label: "Your byte (noiseless, simulated)" }]
                                    : [{ top: mt, h: H - mt - mb, series: clean, cls: "tr-line", label: "Simulated power, no noise" }];
      panels.forEach(function (p, pi) {
        var yOf = function (v) { return p.top + p.h - (Math.max(lo - 0.5, Math.min(hi + 0.5, v)) - lo) / (hi - lo) * p.h; };
        if (pi === panels.length - 1 || mystery == null) {
          for (var s = 0; s < 8; s++) {
            var x0 = xOf(starts[s]), x1 = xOf(Math.min(L - 1, starts[s + 1]));
            chart.appendChild(svg("rect", { x: x0, y: p.top, width: Math.max(0, x1 - x0), height: p.h, class: "tr-band s" + seq[s] + (playStep === s ? " now" : "") }));
            chart.appendChild(svg("text", { x: (x0 + x1) / 2, y: p.top - 6, class: "c-tick", "text-anchor": "middle" }, seq[s] === 1 ? "C" : "S"));
          }
        }
        chart.appendChild(svg("path", { d: linePath(p.series, xOf, yOf), class: p.cls }));
        chart.appendChild(svg("text", { x: ml + 4, y: p.top + 12, class: "c-label" }, p.label));
      });
      chart.appendChild(svg("text", { x: ml, y: H - 8, class: "c-tick" }, "0"));
      chart.appendChild(svg("text", { x: W - mr, y: H - 8, class: "c-tick", "text-anchor": "end" }, int(L) + " samples"));
      chart.appendChild(svg("text", { x: (W + ml) / 2, y: H - 8, class: "c-tick", "text-anchor": "middle" }, "time →"));

      var c1 = seq.filter(function (s) { return s === 1; }).length;
      read.textContent = "This byte runs Compute " + c1 + (c1 === 1 ? " time" : " times") + " and Send " + (8 - c1) + (8 - c1 === 1 ? " time" : " times") +
        ". Compute (a burst of arithmetic) draws more power in a busy pattern; Send writes one character and then waits, drawing less power in a steady ripple.";
      if (mystery != null) {
        mysteryNote.textContent = o === mystery ? "Match: your byte is the mystery byte." : "Flip steps until your shading lines up with the mystery capture.";
      } else mysteryNote.textContent = "";
    }
    onChange(function (what) { if (what === "oracle") draw(); });
    resizers.push(draw);
    draw();
  }

  /* ------------------------------------------------------------ demo 2: noise and averaging */

  function mountNoise(root) {
    root.classList.add("w-ready");
    var mode = 1, span = "all", nShow = 6, nSpread = 12, seedBase = 7000;
    var mSeg = seg([{ value: 1, label: "Raw captures" }, { value: 3, label: "Averaged in threes" }], mode, function (v) { mode = v; draw(); }, "Trace type");
    var zSeg = seg([{ value: "all", label: "Whole capture" }, { value: "s1", label: "Steps 1 and 2" }], span, function (v) { span = v; draw(); }, "Window");
    var again = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "New captures" });
    again.addEventListener("click", function () { seedBase += 1000; draw(); });
    var chart = svg("svg", { class: "tr-chart", role: "img" });
    var read = el("p", { class: "w-note" });
    root.appendChild(el("div", { class: "tr-ctrls" }, [labeled("Show", mSeg), labeled("Window", zSeg), again]));
    root.appendChild(chart);
    root.appendChild(read);

    function spread(traces) {
      var L = traces[0].length, n = traces.length, s = 0;
      for (var t = 0; t < L; t++) {
        var m = 0, q = 0, i;
        for (i = 0; i < n; i++) m += traces[i][t];
        m /= n;
        for (i = 0; i < n; i++) q += (traces[i][t] - m) * (traces[i][t] - m);
        s += Math.sqrt(q / (n - 1));
      }
      return s / L;
    }
    function draw() {
      var o = state.oracle, opts = { avg: mode }, traces = [];
      for (var i = 0; i < nShow; i++) traces.push(E.trace(o, seedBase + i, opts));
      var raw = [], avg = [];
      for (i = 0; i < nSpread; i++) { raw.push(E.trace(o, seedBase + 500 + i, { avg: 1 })); avg.push(E.trace(o, seedBase + 500 + i, { avg: 3 })); }
      var sRaw = spread(raw), sAvg = spread(avg);
      var L = traces[0].length, a = 0, b = L;
      if (span === "s1") { var st = E.stepStarts(o); a = 0; b = Math.ceil(st[2]); }
      var W = chartWidth(chart), H = 240, ml = 40, mr = 10, mt = 24, mb = 30;
      chart.setAttribute("viewBox", "0 0 " + W + " " + H);
      chart.setAttribute("aria-label", nShow + " simulated " + (mode === 1 ? "raw captures" : "averaged traces") + " of oracle byte " + o + ", overlaid");
      chart.innerHTML = "";
      var lo = -2.2, hi = 3.4, yOf = function (v) { return mt + (H - mt - mb) - (Math.max(lo, Math.min(hi, v)) - lo) / (hi - lo) * (H - mt - mb); };
      var xOf = function (i) { return ml + i * (W - ml - mr) / Math.max(1, b - a - 1); };
      axisY(chart, ml, W - mr, yOf, [-2, -1, 0, 1, 2, 3], function (t) { return String(t); });
      traces.forEach(function (tr) { chart.appendChild(svg("path", { d: linePath(Array.prototype.slice.call(tr, a, b), xOf, yOf), class: "tr-line over" })); });
      chart.appendChild(svg("path", { d: linePath(Array.prototype.slice.call(E.cleanTrace(o), a, b), xOf, yOf), class: "tr-line clean" }));
      chart.appendChild(svg("text", { x: ml, y: mt - 10, class: "c-label" }, "Simulated: " + nShow + " " + (mode === 1 ? "raw captures" : "traces, each the mean of three captures") + ", oracle " + o));
      chart.appendChild(svg("text", { x: (W + ml) / 2, y: H - 8, class: "c-tick", "text-anchor": "middle" }, "sample (time →)"));
      chart.appendChild(svg("text", { x: ml, y: H - 8, class: "c-tick" }, String(a)));
      chart.appendChild(svg("text", { x: W - mr, y: H - 8, class: "c-tick", "text-anchor": "end" }, String(b)));
      read.innerHTML = "";
      read.appendChild(document.createTextNode("Average spread around the clean line, over " + nSpread + " simulated traces: "));
      read.appendChild(el("strong", { text: sRaw.toFixed(3) }));
      read.appendChild(document.createTextNode(" for raw captures, "));
      read.appendChild(el("strong", { text: sAvg.toFixed(3) }));
      read.appendChild(document.createTextNode(" after averaging three (" + (sRaw / sAvg).toFixed(2) + " times smaller; independent noise shrinks by √3 ≈ 1.73)."));
    }
    onChange(function (what) { if (what === "oracle") draw(); });
    resizers.push(draw);
    draw();
  }

  /* ------------------------------------------------------------ demo 3: the attack */

  var CLASS_OPTS = [2, 4, 8, 16, 32, 64, 128, 256].map(function (n) { return { value: n, label: String(n) }; });
  var PER_OPTS = [{ value: 20, label: "20" }, { value: 50, label: "50" }, { value: 100, label: "100" }, { value: 200, label: "200", title: "The paper's count" }];

  function mountAttack(root) {
    root.classList.add("w-ready");
    var cfg = { n: 16, per: 50, k: 11, balanced: false }, result = null, running = null;
    var cSeg = seg(CLASS_OPTS, cfg.n, function (v) { cfg.n = v; note(); }, "Oracle values to tell apart");
    var pSeg = seg(PER_OPTS, cfg.per, function (v) { cfg.per = v; note(); }, "Traces per oracle value");
    var bSeg = seg([{ value: false, label: "As in the paper" }, { value: true, label: "Same work in both states", title: "Not in the paper: every step runs both routines" }], cfg.balanced,
      function (v) { cfg.balanced = v; note(); }, "Firmware");
    var kIn = el("input", { type: "range", min: "1", max: "501", step: "2", value: String(cfg.k), "aria-label": "Number of neighbors, k" });
    var kOut = el("output", { text: String(cfg.k) });
    kIn.addEventListener("input", function () { cfg.k = +kIn.value; kOut.textContent = kIn.value; show(); });
    var run = el("button", { type: "button", class: "w-btn", text: "Run the attack" });
    var status = el("p", { class: "w-note tr-status", "aria-live": "polite" });
    var big = el("p", { class: "w-big" });
    var chart = svg("svg", { class: "tr-chart", role: "img" });
    var legendBox = el("ul", { class: "tr-legend" });
    var bitsWrap = el("div", { "data-levels": "ug grad res" });
    var bitsChart = svg("svg", { class: "tr-chart", role: "img" });
    var bitsNote = el("p", { class: "w-note" });
    bitsWrap.appendChild(el("h4", { class: "tr-sub", text: "Which steps the attack gets wrong" }));
    bitsWrap.appendChild(bitsChart);
    bitsWrap.appendChild(bitsNote);

    root.appendChild(el("div", { class: "tr-ctrls" }, [
      labeled("Oracle values", cSeg),
      labeled("Traces each", pSeg),
      labeled("Firmware", bSeg, "grad res")
    ]));
    root.appendChild(el("label", { class: "w-range" }, [el("span", { text: "Neighbors, k" }), kIn, kOut]));
    root.appendChild(el("div", { class: "w-actions" }, [run, status]));
    root.appendChild(big);
    root.appendChild(chart);
    root.appendChild(legendBox);
    root.appendChild(bitsWrap);

    function cost() { var n = cfg.n * cfg.per; return n * n * 0.8 * 0.2 * E.DEFAULTS.len; }
    function note() {
      var c = cost();
      status.textContent = c > 2e10 ? "This size takes minutes in a browser; the dashed line shows it precomputed at 200 traces per value." :
        c > 5e9 ? "This size takes about half a minute or more." : c > 1e9 ? "This size takes several seconds." : "";
      if (result && (result.job.n !== cfg.n || result.job.per !== cfg.per || result.job.balanced !== cfg.balanced)) result = null;
      show();
    }
    run.addEventListener("click", function () {
      if (running) { running.terminate(); running = null; run.textContent = "Run the attack"; run.classList.remove("running"); status.textContent = "Stopped."; return; }
      var w;
      try { w = new Worker(BASE + "attack-worker.js"); } catch (e) { status.textContent = "This browser could not start a background worker."; return; }
      running = w; run.textContent = "Stop"; run.classList.add("running");
      var job = { n: cfg.n, per: cfg.per, balanced: cfg.balanced };
      status.textContent = "Simulating captures…";
      w.onmessage = function (e) {
        var m = e.data;
        if (m.type === "progress") {
          status.textContent = (m.stage === "capture" ? "Simulating traces: " : "Classifying held-out traces: ") + int(m.done) + " of " + int(m.total);
        } else if (m.type === "result") {
          result = m.result; result.job = job;
          w.terminate(); running = null; run.textContent = "Run the attack"; run.classList.remove("running");
          status.textContent = "Done: " + int(result.nTrain) + " training traces, " + int(result.nTest) + " held out (simulated).";
          show();
        }
      };
      w.onerror = function () { status.textContent = "The worker stopped with an error."; running = null; run.textContent = "Run the attack"; run.classList.remove("running"); };
      w.postMessage({ nClasses: cfg.n, perOracle: cfg.per, seed: state.seed, kMax: 501, keepKs: [], opts: { balanced: cfg.balanced } });
    });

    function preCurve(n, balanced) {
      var P = state.pre; if (!P) return null;
      var set = balanced ? P.balanced : P.normal;
      return set && set[String(n)] ? set[String(n)] : null;
    }

    function show() {
      var W = chartWidth(chart), H = 250, ml = 44, mr = 12, mt = 16, mb = 34;
      chart.setAttribute("viewBox", "0 0 " + W + " " + H);
      chart.innerHTML = "";
      var job = result ? result.job : null;
      var pre = preCurve(job ? job.n : cfg.n, job ? job.balanced : cfg.balanced);
      var nShown = job ? job.n : cfg.n;
      var kMax = 501, xOf = function (k) { return ml + (k - 1) / (kMax - 1) * (W - ml - mr); };
      var yOf = function (a) { return mt + (1 - a) * (H - mt - mb); };
      axisY(chart, ml, W - mr, yOf, [0, 0.25, 0.5, 0.75, 1], function (t) { return Math.round(t * 100) + "%"; });
      [1, 101, 201, 301, 401, 501].forEach(function (k) { chart.appendChild(svg("text", { x: xOf(k), y: H - mb + 14, class: "c-tick", "text-anchor": "middle" }, String(k))); });
      chart.appendChild(svg("text", { x: (W + ml) / 2, y: H - 4, class: "c-tick", "text-anchor": "middle" }, "neighbors, k"));
      var chance = 1 / nShown;
      chart.appendChild(svg("line", { x1: ml, x2: W - mr, y1: yOf(chance), y2: yOf(chance), class: "c-ref" }));
      chart.appendChild(svg("text", { x: W - mr, y: yOf(chance) - 4, class: "c-tick", "text-anchor": "end" }, "chance, 1 in " + nShown));
      var legend = [];
      if (pre && pre.per === 200) {
        chart.appendChild(svg("path", { d: linePath(pre.acc, function (i) { return xOf(i + 1); }, yOf), class: "tr-curve pre" }));
        legend.push({ cls: "pre", t: "Simulated, " + nShown + " values × 200 traces (precomputed)" });
      }
      if (result) {
        chart.appendChild(svg("path", { d: linePath(result.accuracy, function (i) { return xOf(i + 1); }, yOf), class: "tr-curve live" }));
        legend.push({ cls: "live", t: "Your run, " + job.n + " values × " + job.per + " traces (simulated)" });
      }
      // The paper's reported points: only for its 256-value experiment.
      if (nShown === 256 && !(job ? job.balanced : cfg.balanced)) {
        E.PAPER_K.forEach(function (p) {
          chart.appendChild(svg("circle", { cx: xOf(p.k), cy: yOf(p.acc), r: 4.5, class: "tr-paper" }));
        });
        legend.push({ cls: "paper", t: "Paper, measured on the chip (Section IV-A)" });
      }
      chart.appendChild(svg("line", { x1: xOf(cfg.k), x2: xOf(cfg.k), y1: mt, y2: H - mb, class: "tr-kline" }));
      legendBox.innerHTML = "";
      legend.forEach(function (l) {
        legendBox.appendChild(el("li", {}, [el("span", { class: "tr-key " + l.cls, "aria-hidden": "true" }), l.t]));
      });
      chart.setAttribute("aria-label", "Accuracy against k" + (result ? ", your run and" : ",") + " the precomputed simulation");

      big.innerHTML = "";
      var src = result || (pre && pre.per === 200 ? { accuracy: pre.acc, nTest: pre.nTest, correct: pre.correct, bitErrors: pre.bits, job: { n: nShown, per: 200 }, pre: true } : null);
      if (!src) { big.textContent = "Press Run the attack. Your browser simulates the traces, trains on 80 percent of each oracle value's traces, and labels the rest."; drawBits(null); return; }
      var k = Math.min(cfg.k, src.accuracy.length), a = src.accuracy[k - 1];
      big.appendChild(document.createTextNode((src.pre ? "Precomputed simulation" : "Your run") + ", k = " + k + ": "));
      big.appendChild(el("strong", { text: pct(a) }));
      big.appendChild(document.createTextNode(" of " + int(src.nTest) + " held-out traces named the exact byte, all eight steps right (chance: " + pct(1 / src.job.n) + ")."));
      if (cfg.k > src.accuracy.length) big.appendChild(document.createTextNode(" (k is capped at the " + src.accuracy.length + " training traces.)"));
      drawBits(src, k);
    }
    function drawBits(src, k) {
      bitsChart.innerHTML = "";
      var W = chartWidth(bitsChart), H = 160, ml = 44, mr = 12, mt = 12, mb = 30;
      bitsChart.setAttribute("viewBox", "0 0 " + W + " " + H);
      if (!src || !src.bitErrors) { bitsNote.textContent = ""; return; }
      var bits = src.bitErrors[k - 1], n = src.nTest, steps = Math.round(Math.log(src.job.n) / Math.LN2);
      var max = 0.5, yOf = function (v) { return mt + (1 - Math.min(v, max) / max) * (H - mt - mb); };
      axisY(bitsChart, ml, W - mr, yOf, [0, 0.25, 0.5], function (t) { return Math.round(t * 100) + "%"; });
      var bw = (W - ml - mr) / 8;
      for (var b = 0; b < 8; b++) {
        var v = bits[b] / n, x = ml + b * bw + bw * 0.18;
        bitsChart.appendChild(svg("rect", { x: x, y: yOf(v), width: bw * 0.64, height: Math.max(0, H - mb - yOf(v)), class: "tr-bar" + (b < steps ? "" : " fixed") }));
        bitsChart.appendChild(svg("text", { x: x + bw * 0.32, y: H - mb + 14, class: "c-tick", "text-anchor": "middle" }, "step " + (b + 1)));
        if (b < steps) bitsChart.appendChild(svg("text", { x: x + bw * 0.32, y: yOf(v) - 4, class: "c-tick", "text-anchor": "middle" }, (v * 100).toFixed(1)));
      }
      bitsChart.setAttribute("aria-label", "Share of held-out traces with each step's state wrong, at k = " + k);
      var wrongAny = 1 - src.accuracy[k - 1], meanBits = 0;
      for (b = 0; b < 8; b++) meanBits += bits[b];
      meanBits /= Math.max(1, Math.round(wrongAny * n));
      bitsNote.textContent = "Computed by this page on simulated traces: the share of held-out traces whose predicted byte has the wrong state at each step (percent). " +
        (steps < 8 ? "With the first " + src.job.n + " oracle values, only steps 1 to " + steps + " vary; the others are always Compute. " : "") +
        (wrongAny > 0 ? "A wrong guess gets " + meanBits.toFixed(2) + " of 8 steps wrong on average, so most misses are near misses." : "No held-out trace was misnamed.");
    }
    onChange(function (what) { if (what === "pre" || what === "level") show(); });
    resizers.push(show);
    note();
  }

  /* ------------------------------------------------------------ demo 4: how many classes */

  var HEAT_K = [1, 3, 5, 7, 11, 15, 21, 23, 31, 51, 111, 171, 301, 501];
  var HEAT_N = [2, 4, 8, 16, 32, 64, 128, 256];
  // Cells where the paper reports a value (Section IV).
  function paperCell(n, k) {
    if (n === 2) return "Paper: 100% (every k)";
    if (n === 4 && k >= 15) return "Paper: 97.5% (every k ≥ 15)";
    if (n === 8 && (k === 21 || k === 23)) return "Paper: 87.5% (its peak)";
    if (n === 256) { for (var i = 0; i < E.PAPER_K.length; i++) if (E.PAPER_K[i].k === k) return "Paper: " + pct(E.PAPER_K[i].acc) + " (Section IV-A)"; }
    return null;
  }
  function mountClasses(root) {
    root.classList.add("w-ready");
    var which = "normal", pick = { n: 8, k: 21 };
    var wSeg = seg([{ value: "normal", label: "As in the paper" }, { value: "balanced", label: "Same work in both states" }], which, function (v) { which = v; draw(); }, "Firmware");
    var chart = svg("svg", { class: "tr-chart tr-heat", role: "img" });
    var read = el("p", { class: "w-note", "aria-live": "polite" });
    root.appendChild(el("div", { class: "tr-ctrls", "data-levels": "grad res" }, [labeled("Firmware", wSeg)]));
    root.appendChild(chart);
    root.appendChild(read);
    function draw() {
      chart.innerHTML = "";
      var P = state.pre;
      var W = chartWidth(chart), ml = 44, mr = 6, mt = 6, mb = 38, rowH = 26, H = mt + mb + rowH * HEAT_N.length;
      chart.setAttribute("viewBox", "0 0 " + W + " " + H);
      if (!P) { chart.appendChild(svg("text", { x: ml, y: 30, class: "c-label" }, "Loading the precomputed simulation…")); return; }
      var set = P[which] || {}, cw = (W - ml - mr) / HEAT_K.length;
      HEAT_N.forEach(function (n, r) {
        var cur = set[String(n)], y = mt + r * rowH;
        chart.appendChild(svg("text", { x: ml - 6, y: y + rowH / 2 + 4, class: "c-tick", "text-anchor": "end" }, String(n)));
        HEAT_K.forEach(function (k, c) {
          var x = ml + c * cw, a = cur && k <= cur.acc.length ? cur.acc[k - 1] : null;
          var cell = svg("rect", { x: x + 0.5, y: y + 0.5, width: cw - 1, height: rowH - 1, class: "tr-cell" + (a == null ? " na" : "") });
          if (a != null) cell.setAttribute("style", "fill-opacity:" + (0.08 + 0.92 * a).toFixed(3));
          if (which === "normal" && a != null && paperCell(n, k)) cell.classList.add("paper");
          if (pick.n === n && pick.k === k) cell.classList.add("picked");
          cell.addEventListener("click", function () { pick = { n: n, k: k }; draw(); });
          chart.appendChild(cell);
          if (a != null && cw >= 34) chart.appendChild(svg("text", { x: x + cw / 2, y: y + rowH / 2 + 4, class: "tr-cell-t" + (a > 0.55 ? " dark" : ""), "text-anchor": "middle" }, Math.round(a * 100)));
        });
      });
      HEAT_K.forEach(function (k, c) {
        if (cw < 24 && [1, 11, 51, 111, 501].indexOf(k) < 0) return;
        chart.appendChild(svg("text", { x: ml + c * cw + cw / 2, y: H - mb + 14, class: "c-tick", "text-anchor": "middle" }, String(k)));
      });
      chart.appendChild(svg("text", { x: (W + ml) / 2, y: H - 6, class: "c-tick", "text-anchor": "middle" }, "neighbors, k   (rows: oracle values told apart)"));
      chart.setAttribute("aria-label", "Simulated accuracy for each number of oracle values and each k, 200 traces per value" + (which === "balanced" ? ", same work in both states" : ""));
      var cur = set[String(pick.n)], a = cur && pick.k <= cur.acc.length ? cur.acc[pick.k - 1] : null;
      read.innerHTML = "";
      read.appendChild(el("strong", { text: pick.n + " values, k = " + pick.k + ": " }));
      read.appendChild(document.createTextNode(a == null ? "k is larger than the training set." : "simulated " + pct(a) + " (" + int(cur.correct[pick.k - 1]) + " of " + int(cur.nTest) + " held out, 200 traces per value)."));
      var pc = which === "normal" ? paperCell(pick.n, pick.k) : null;
      if (pc) read.appendChild(document.createTextNode(" " + pc + ", measured on the chip."));
      read.appendChild(el("span", { class: "tr-hint", text: " Press any cell. Outlined cells are the ones the paper reports a value for." }));
    }
    onChange(function (what) { if (what === "pre") draw(); });
    resizers.push(draw);
    draw();
  }

  /* ------------------------------------------------------------ boot */

  function mount(id, fn) { var n = document.getElementById(id); if (n) fn(n); }
  function boot() {
    mount("tr-machine", mountMachine);
    mount("tr-noise", mountNoise);
    mount("tr-attack", mountAttack);
    mount("tr-classes", mountClasses);
    if (window.fetch) fetch(BASE + "precomputed.json").then(function (r) { return r.json(); }).then(function (j) { state.pre = j; changed("pre"); }).catch(function () {});
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();

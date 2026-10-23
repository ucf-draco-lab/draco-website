/*
  Control flow from power: widget for /papers/control-flow-power/.
  Mount points: #cf-machine, #cf-diff, #cf-paper, #cf-attack, #cf-chance.
  Shared state: the oracle byte, the work per state (w), and the attack
  settings. Every power trace is simulated by cf-engine.js and labeled so.
*/
(function () {
  "use strict";

  var E = window.CfPower, M = window.CfML;
  if (!E || !M) return;

  var SVGNS = "http://www.w3.org/2000/svg";
  var BASE = (document.currentScript && document.currentScript.src)
    ? document.currentScript.src.replace(/widget\.js(\?.*)?$/, "")
    : "";

  /* ------------------------------------------------------------ state */

  var state = {
    oracle: 77,
    w: 8,
    flip: 3,           // step flipped in the comparison demo (0-based)
    level: window.PaperKit ? window.PaperKit.level() : "public",
    pre: null          // precomputed scikit-learn sweep (precomputed.json)
  };
  var listeners = [];
  function onChange(fn) { listeners.push(fn); }
  function changed(what) { listeners.forEach(function (fn) { fn(what); }); }
  document.addEventListener("paperlevel", function (e) { state.level = e.detail.level; changed("level"); });
  function deep() { return state.level === "grad" || state.level === "res"; }

  var CLF = {
    knn:  { name: "k-nearest neighbors", short: "KNN", cls: "knn", mark: "circle" },
    tree: { name: "Decision tree", short: "Tree", cls: "tree", mark: "square" },
    rf:   { name: "Random forest", short: "Forest", cls: "rf", mark: "diamond" },
    lr:   { name: "Logistic regression", short: "LogReg", cls: "lr", mark: "triangle" }
  };
  var CLF_ORDER = ["rf", "tree", "lr", "knn"];
  // The paper's names for the classifiers, as keys in the engine's PAPER table.
  var PAPER_KEY = { knn: "knn", tree: "dt", rf: "rf", lr: "lr" };

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
    var row = el("div", { class: "cf-ctl" }, [el("span", { class: "cf-ctl-label", text: label }), control]);
    if (levels) row.setAttribute("data-levels", levels);
    return row;
  }
  function pct(x, d) { return x == null ? "–" : (x * 100).toFixed(d == null ? 2 : d) + "%"; }
  function int(x) { return Math.round(x).toLocaleString("en-US"); }
  function bin8(v) { var s = (v >>> 0).toString(2); while (s.length < 8) s = "0" + s; return s; }
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
  function marker(shape, x, y, r, cls) {
    if (shape === "circle") return svg("circle", { cx: x, cy: y, r: r, class: cls });
    if (shape === "square") return svg("rect", { x: x - r, y: y - r, width: 2 * r, height: 2 * r, class: cls });
    if (shape === "diamond") return svg("path", { d: "M" + x + " " + (y - r * 1.3) + "L" + (x + r * 1.3) + " " + y + "L" + x + " " + (y + r * 1.3) + "L" + (x - r * 1.3) + " " + y + "Z", class: cls });
    return svg("path", { d: "M" + x + " " + (y - r * 1.3) + "L" + (x + r * 1.2) + " " + (y + r) + "L" + (x - r * 1.2) + " " + (y + r) + "Z", class: cls });
  }
  var W_OPTS = E.W_VALUES.map(function (w) { return { label: String(w), value: w }; });

  /* ------------------------------------------------------------ demo 1: the machine */

  function mountMachine(root) {
    root.classList.add("w-ready");
    var playing = null, playStep = -1;

    var bitRow = el("div", { class: "cf-bits", role: "group", "aria-label": "Oracle bits, in the order the chip reads them" });
    var bitBtns = [], bitCells = [];
    for (var i = 0; i < 8; i++) (function (b) {
      var btn = el("button", { type: "button", class: "cf-bit", "aria-pressed": "false" });
      btn.addEventListener("click", function () { stop(); state.oracle ^= (1 << b); changed("oracle"); });
      bitBtns.push(btn);
      var cell = el("div", { class: "cf-bitcell" }, [el("span", { class: "cf-bitstep" }, [el("span", { class: "cf-steplong", text: "Step " }), String(b + 1)]), btn]);
      bitCells.push(cell);
      bitRow.appendChild(cell);
    })(i);

    var presetRow = el("div", { class: "w-actions" });
    [{ v: 0, t: "0" }, { v: 77, t: "77" }, { v: 85, t: "85" }, { v: 128, t: "128" }, { v: 255, t: "255" }].forEach(function (p) {
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

    var wSeg = seg(W_OPTS, state.w, function (v) { stop(); state.w = v; changed("w"); }, "Additions per state, w");
    var ctrls = el("div", { class: "cf-ctrls" }, [labeled("Work per state (w)", wSeg)]);

    var byteNote = el("p", { class: "w-note cf-byte" });
    var fsm = svg("svg", { class: "cf-fsm", viewBox: "0 0 360 120", role: "img", "aria-label": "The two-state machine. A 0 bit moves to or stays in state one; a 1 bit moves to or stays in state two. Both states run the same additions." });
    var path = el("div", { class: "cf-path", "aria-live": "polite" });
    var chart = svg("svg", { class: "cf-chart", role: "img" });
    var legend = el("ul", { class: "cf-legend" }, [
      el("li", {}, [el("span", { class: "cf-swatch ctl" }), "Control flow: read the bit, branch, call, return"]),
      el("li", {}, [el("span", { class: "cf-swatch work" }), "State work: total = *x + *y, w times"])
    ]);
    var read = el("p", { class: "w-note" });
    var ops = el("div", { class: "cf-ops" });

    root.appendChild(ctrls);
    root.appendChild(bitRow);
    root.appendChild(presetRow);
    root.appendChild(byteNote);
    root.appendChild(fsm);
    root.appendChild(path);
    root.appendChild(chart);
    root.appendChild(legend);
    root.appendChild(read);
    root.appendChild(ops);

    // The state machine (Fig. 1), with both states' code beneath them.
    (function drawFsm() {
      var defs = svg("defs");
      var mk = svg("marker", { id: "cf-arrow", viewBox: "0 0 10 10", refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: "auto-start-reverse" });
      mk.appendChild(svg("path", { d: "M0 0L10 5L0 10z", class: "cf-arrowhead" }));
      defs.appendChild(mk);
      fsm.appendChild(defs);
      fsm.appendChild(svg("path", { d: "M128 48 C 160 30, 200 30, 232 48", class: "cf-edge", "marker-end": "url(#cf-arrow)" }));
      fsm.appendChild(svg("text", { x: 180, y: 30, class: "cf-node-label", "text-anchor": "middle" }, "1"));
      fsm.appendChild(svg("path", { d: "M232 72 C 200 90, 160 90, 128 72", class: "cf-edge", "marker-end": "url(#cf-arrow)" }));
      fsm.appendChild(svg("text", { x: 180, y: 100, class: "cf-node-label", "text-anchor": "middle" }, "0"));
      fsm.appendChild(svg("path", { d: "M78 38 C 50 0, 30 30, 66 50", class: "cf-edge", "marker-end": "url(#cf-arrow)" }));
      fsm.appendChild(svg("text", { x: 34, y: 18, class: "cf-node-label", "text-anchor": "middle" }, "0"));
      fsm.appendChild(svg("path", { d: "M282 38 C 310 0, 330 30, 294 50", class: "cf-edge", "marker-end": "url(#cf-arrow)" }));
      fsm.appendChild(svg("text", { x: 326, y: 18, class: "cf-node-label", "text-anchor": "middle" }, "1"));
      [{ x: 100, s: 1 }, { x: 260, s: 2 }].forEach(function (n) {
        fsm.appendChild(svg("circle", { cx: n.x, cy: 60, r: 30, class: "cf-node s" + n.s, id: "cf-node-" + n.s }));
        fsm.appendChild(svg("text", { x: n.x, y: 57, class: "cf-node-label", "text-anchor": "middle" }, "State " + (n.s === 1 ? "one" : "two")));
        fsm.appendChild(svg("text", { x: n.x, y: 72, class: "cf-node-code", "text-anchor": "middle" }, "w additions"));
      });
    })();

    // Operands (Section 3.1): equal Hamming weight in both orders.
    (function drawOps() {
      function strip(label, v) {
        var row = el("div", { class: "cf-oprow" }, [el("span", { class: "cf-oplabel", text: label })]);
        var bits = el("span", { class: "cf-opbits", "aria-label": label + " in binary" });
        for (var b = 31; b >= 0; b--) bits.appendChild(el("span", { class: "cf-ob" + (((v >>> b) & 1) ? " one" : "") }));
        row.appendChild(bits);
        row.appendChild(el("span", { class: "cf-opval", text: int(v) + " · " + E.popcount(v) + " ones" }));
        return row;
      }
      ops.appendChild(strip("one_zero (x)", E.ONE_ZERO));
      ops.appendChild(strip("zero_one (y)", E.ZERO_ONE));
      ops.appendChild(strip("total", (E.ONE_ZERO + E.ZERO_ONE) >>> 0));
    })();

    function start() {
      playStep = -1; play.textContent = "Stop"; play.classList.add("running");
      playing = setInterval(function () {
        playStep++;
        if (playStep >= 8) { stop(); return; }
        draw();
      }, 650);
      draw();
    }
    function stop() {
      if (playing) clearInterval(playing);
      playing = null; playStep = -1; play.textContent = "Play"; play.classList.remove("running");
      draw();
    }

    function draw() {
      var o = state.oracle, w = state.w, seq = E.states(o);
      for (var b = 0; b < 8; b++) {
        var on = ((o >>> b) & 1) === 1;
        bitBtns[b].textContent = on ? "1" : "0";
        bitBtns[b].classList.toggle("s2", on);
        bitBtns[b].setAttribute("aria-pressed", String(on));
        bitBtns[b].setAttribute("aria-label", "Step " + (b + 1) + ": bit " + (on ? 1 : 0) + ", state " + (on ? "two" : "one"));
        bitCells[b].classList.toggle("now", playStep === b);
      }
      byteNote.innerHTML = "Oracle byte <strong>" + o + "</strong> = " + bin8(o) + " in binary. The chip reads it from the right, one bit per step.";
      var cur = playStep >= 0 ? seq[playStep] : 0;
      fsm.querySelector("#cf-node-1").classList.toggle("on", cur === 1);
      fsm.querySelector("#cf-node-2").classList.toggle("on", cur === 2);

      path.innerHTML = "";
      var prev = 1;
      seq.forEach(function (s, i) {
        var move = i === 0 ? (s === 1 ? "start" : "move") : (s === prev ? "stay" : "move");
        var cell = el("span", { class: "cf-pstep s" + s + (playStep === i ? " now" : ""), title: "Step " + (i + 1) }, [
          el("span", { class: "cf-pstate", text: s === 1 ? "one" : "two" }),
          el("span", { class: "cf-pmove", text: move === "stay" ? "stays" : move === "move" ? "moves" : "starts" })
        ]);
        path.appendChild(cell);
        prev = s;
      });

      drawTrace();
      var share = E.workShare(o, w);
      var opsShare = w / (w + 1);
      read.innerHTML = "One pass of the program takes <strong>" + int(share.total) + "</strong> clock cycles in this page's model: " +
        int(share.control) + " in control flow and " + int(share.work) + " in the states' additions, so " +
        pct(share.shareWork, 1) + " of the cycles do state work." +
        (deep() || state.level === "ug" ? " Counting one unit of control flow per step instead, w = " + w + " puts " + w + " of every " + (w + 1) + " units (" + pct(opsShare, 1) + ") inside the states." : "");
    }

    function drawTrace() {
      var W = chartWidth(chart), H = 210, L = 46, R = 10, T = 22, B = 34;
      chart.setAttribute("viewBox", "0 0 " + W + " " + H);
      chart.setAttribute("aria-label", "Simulated power trace of oracle byte " + state.oracle + " at w = " + state.w + ", shaded by control flow and state work");
      while (chart.firstChild) chart.removeChild(chart.firstChild);
      var o = E.opt(), w = state.w, clean = E.cleanTrace(state.oracle, w);
      var noisy = E.trace(state.oracle, w, E.traceSeed(state.oracle, 0, w, 99));
      var n = clean.length, lo = Infinity, hi = -Infinity;
      for (var i = 0; i < n; i++) { lo = Math.min(lo, clean[i], noisy[i]); hi = Math.max(hi, clean[i], noisy[i]); }
      var pad = (hi - lo) * 0.08; lo -= pad; hi += pad;
      var xOf = function (t) { return L + (W - L - R) * t / (n - 1); };
      var yOf = function (v) { return T + (H - T - B) * (1 - (v - lo) / (hi - lo)); };
      var prog = E.program(state.oracle, w);
      var g = svg("g");
      prog.blocks.forEach(function (bk) {
        var x0 = xOf(bk.start / o.cps), x1 = xOf(bk.end / o.cps);
        var cls = bk.name === "add" ? "work" : "ctl";
        var now = playStep === bk.step ? " now" : "";
        g.appendChild(svg("rect", { x: x0, y: T, width: Math.max(0.6, x1 - x0), height: H - T - B, class: "cf-band " + cls + now }));
      });
      chart.appendChild(g);
      // Step labels at the top.
      var starts = [];
      prog.blocks.forEach(function (bk) { if (bk.name === "dispatch") starts.push(bk.start); });
      starts.push(prog.cycles);
      var minGap = Infinity;
      for (i = 0; i < 8; i++) minGap = Math.min(minGap, xOf(starts[i + 1] / o.cps) - xOf(starts[i] / o.cps));
      for (i = 0; i < 8; i++) {
        var xm = (xOf(starts[i] / o.cps) + xOf(starts[i + 1] / o.cps)) / 2;
        chart.appendChild(svg("text", { x: xm, y: T - 7, class: "c-tick", "text-anchor": "middle" }, minGap > 34 ? (prog.seq[i] === 1 ? "one" : "two") : String(i + 1)));
      }
      axisY(chart, L, W - R, yOf, [lo + (hi - lo) * 0.1, (lo + hi) / 2, hi - (hi - lo) * 0.1], function (v) { return v.toFixed(1); });
      chart.appendChild(svg("path", { d: linePath(noisy, xOf, yOf), class: "cf-line over" }));
      chart.appendChild(svg("path", { d: linePath(clean, xOf, yOf), class: "cf-line clean" }));
      chart.appendChild(svg("text", { x: L, y: H - 8, class: "c-label" }, W < 520 ? "Simulated · " + n + " samples · time →" : "Simulated: time (" + n + " scope samples, " + o.cps + " clock cycles each) →"));
      chart.appendChild(svg("text", { x: 12, y: T + (H - T - B) / 2, class: "c-label", transform: "rotate(-90 12 " + (T + (H - T - B) / 2) + ")", "text-anchor": "middle" }, "Power"));
    }

    onChange(function (what) { if (what !== "pre") draw(); });
    resizers.push(drawTrace);
    draw();
  }

  /* ------------------------------------------------------------ demo 2: one bit apart */

  function mountDiff(root) {
    root.classList.add("w-ready");
    var flipSeg = seg([0, 1, 2, 3, 4, 5, 6, 7].map(function (b) { return { label: String(b + 1), value: b }; }), state.flip,
      function (v) { state.flip = v; changed("flip"); }, "Step to flip");
    var wSeg = seg(W_OPTS, state.w, function (v) { state.w = v; changed("w"); }, "Additions per state, w");
    root.appendChild(el("div", { class: "cf-ctrls" }, [labeled("Flip step", flipSeg), labeled("Work per state (w)", wSeg)]));
    var head = el("p", { class: "w-note" });
    var chart = svg("svg", { class: "cf-chart", role: "img" });
    var legend = el("ul", { class: "cf-legend" }, [
      el("li", {}, [el("span", { class: "cf-key a" }), "Byte A (simulated, no noise)"]),
      el("li", {}, [el("span", { class: "cf-key b" }), "Byte B: A with one bit flipped"]),
      el("li", {}, [el("span", { class: "cf-key d" }), "B minus A, with the noise of one capture shaded"])
    ]);
    var read = el("p", { class: "w-note" });
    root.appendChild(head);
    root.appendChild(chart);
    root.appendChild(legend);
    root.appendChild(read);

    function draw() {
      wSeg.set(state.w); flipSeg.set(state.flip);
      var o = E.opt(), w = state.w, A = state.oracle, Bv = A ^ (1 << state.flip);
      head.innerHTML = "Byte A = <strong>" + A + "</strong> (" + bin8(A) + ") from the first demo; byte B = <strong>" + Bv + "</strong> (" + bin8(Bv) + "), which differs only at step " + (state.flip + 1) + ".";
      var ta = E.cleanTrace(A, w), tb = E.cleanTrace(Bv, w), n = ta.length, diff = new Float64Array(n);
      var lo = Infinity, hi = -Infinity, dmax = 0;
      for (var i = 0; i < n; i++) { diff[i] = tb[i] - ta[i]; lo = Math.min(lo, ta[i], tb[i]); hi = Math.max(hi, ta[i], tb[i]); dmax = Math.max(dmax, Math.abs(diff[i])); }
      var sigma = o.scale * o.noise;
      var W = chartWidth(chart), H = 300, L = 46, R = 10, T = 12, mid = 170, B = 34;
      chart.setAttribute("viewBox", "0 0 " + W + " " + H);
      chart.setAttribute("aria-label", "Simulated traces of bytes " + A + " and " + Bv + " and their difference");
      while (chart.firstChild) chart.removeChild(chart.firstChild);
      var xOf = function (t) { return L + (W - L - R) * t / (n - 1); };
      var pad = (hi - lo) * 0.08;
      var yTop = function (v) { return T + (mid - 20 - T) * (1 - (v - lo + pad) / (hi - lo + 2 * pad)); };
      var dr = Math.max(dmax, 3 * sigma) * 1.1;
      var yBot = function (v) { return mid + (H - B - mid) * (0.5 - v / (2 * dr)); };
      // where the flipped step starts in each program
      var pA = E.program(A, w), stepStart = 0;
      pA.blocks.forEach(function (bk) { if (bk.name === "dispatch" && bk.step === state.flip) stepStart = bk.start; });
      var xs = xOf(stepStart / o.cps);
      chart.appendChild(svg("line", { x1: xs, x2: xs, y1: T, y2: H - B, class: "c-ref" }));
      chart.appendChild(svg("text", { x: xs + 4, y: T + 10, class: "c-label" }, "step " + (state.flip + 1)));
      chart.appendChild(svg("rect", { x: L, y: yBot(sigma), width: W - L - R, height: Math.max(0.5, yBot(-sigma) - yBot(sigma)), class: "cf-noise" }));
      chart.appendChild(svg("line", { x1: L, x2: W - R, y1: yBot(0), y2: yBot(0), class: "c-grid" }));
      chart.appendChild(svg("path", { d: linePath(ta, xOf, yTop), class: "cf-line a" }));
      chart.appendChild(svg("path", { d: linePath(tb, xOf, yTop), class: "cf-line b" }));
      chart.appendChild(svg("path", { d: linePath(diff, xOf, yBot), class: "cf-line d" }));
      chart.appendChild(svg("text", { x: L, y: mid - 6, class: "c-label" }, "Simulated traces"));
      chart.appendChild(svg("text", { x: L, y: H - B + 14, class: "c-label" }, W < 520 ? "B − A (±1 σ shaded) · time →" : "Difference B − A (±1 noise σ shaded) · time →"));
      var startSample = Math.floor(stepStart / o.cps), before = 0, after = 0, firstStep = -1;
      for (i = 0; i < n; i++) if (Math.abs(diff[i]) > sigma) { if (i < startSample) before++; else after++; }
      for (i = 0; i < n && firstStep < 0; i++) if (Math.abs(diff[i]) > 1e-9) {
        pA.blocks.forEach(function (bk) { if (firstStep < 0 && i * o.cps < bk.end && (i + 1) * o.cps > bk.start) firstStep = bk.step; });
      }
      read.innerHTML = "Both programs run identical additions on identical data. Two things differ: the register that holds the byte carries the flipped bit until step " + (state.flip + 1) +
        " shifts it out, which changes its leak slightly" + (state.flip > 0 ? " from step " + (firstStep + 1) + " on" : "") + ", and at step " + (state.flip + 1) +
        " the branch takes one clock cycle more or less, which moves every later sample. <strong>" + int(before + after) + "</strong> of " + int(n) +
        " samples differ by more than the noise of one simulated capture (σ = " + sigma.toFixed(2) + "): " + int(before) + " before step " + (state.flip + 1) + " and " + int(after) + " from it on.";
    }
    onChange(function (what) { if (what === "oracle" || what === "w" || what === "flip" || what === "level") draw(); });
    resizers.push(draw);
    draw();
  }

  /* ------------------------------------------------------------ demo 3: what the paper measured */

  function mountPaper(root) {
    root.classList.add("w-ready");
    var zoom = false, showSim = true;
    var zSeg = seg([{ label: "0 to 100%", value: false }, { label: "75 to 100%", value: true }], zoom, function (v) { zoom = v; draw(); }, "Vertical scale");
    var simBtn = el("button", { type: "button", class: "w-btn w-btn-quiet", "aria-pressed": "true", text: "Simulation: on" });
    simBtn.addEventListener("click", function () { showSim = !showSim; simBtn.setAttribute("aria-pressed", String(showSim)); simBtn.textContent = "Simulation: " + (showSim ? "on" : "off"); draw(); });
    root.appendChild(el("div", { class: "cf-ctrls" }, [labeled("Scale", zSeg), simBtn]));
    var chart = svg("svg", { class: "cf-chart", role: "img", "aria-label": "Accuracy against work per state: the paper's stated values as markers and this page's simulation as dashed lines" });
    var legend = el("ul", { class: "cf-legend" });
    var rows = el("div", { class: "cf-bounds" });
    var note = el("p", { class: "w-note" });
    root.appendChild(chart);
    root.appendChild(legend);
    root.appendChild(note);
    root.appendChild(rows);
    CLF_ORDER.forEach(function (k) {
      legend.appendChild(el("li", {}, [
        (function () { var s = svg("svg", { width: 14, height: 14, viewBox: "0 0 14 14", class: "cf-legend-mark" }); s.appendChild(marker(CLF[k].mark, 7, 7, 4.5, "cf-pt " + k)); return s; })(),
        el("span", { text: " " + CLF[k].name })
      ]));
    });
    legend.appendChild(el("li", {}, [el("span", { class: "cf-key sim" }), "This page's simulation (scikit-learn, dashed)"]));
    E.PAPER.bounds.forEach(function (b) { rows.appendChild(el("p", { class: "cf-row", text: b.text })); });

    function draw() {
      var W = chartWidth(chart), H = 280, L = 48, R = 12, T = 14, B = 40;
      chart.setAttribute("viewBox", "0 0 " + W + " " + H);
      while (chart.firstChild) chart.removeChild(chart.firstChild);
      var ws = E.W_VALUES, lo = zoom ? 0.75 : 0, hi = 1.0;
      var xOf = function (i) { return L + 12 + (W - L - R - 24) * i / (ws.length - 1); };
      var yRaw = function (a) { return T + (H - T - B) * (1 - (a - lo) / (hi - lo)); };
      var yOf = function (a) { return Math.max(T, Math.min(H - B, yRaw(a))); };
      axisY(chart, L, W - R, yOf, zoom ? [0.75, 0.8, 0.85, 0.9, 0.95, 1] : [0, 0.25, 0.5, 0.75, 1], function (t) { return Math.round(t * 100) + "%"; });
      ws.forEach(function (w, i) { chart.appendChild(svg("text", { x: xOf(i), y: H - B + 16, class: "c-tick", "text-anchor": "middle" }, String(w))); });
      chart.appendChild(svg("text", { x: (L + W - R) / 2, y: H - 6, class: "c-label", "text-anchor": "middle" }, "Additions per state, w (256 oracle values)"));
      if (!zoom) {
        chart.appendChild(svg("line", { x1: L, x2: W - R, y1: yOf(1 / 256), y2: yOf(1 / 256), class: "c-ref" }));
        chart.appendChild(svg("text", { x: W - R - 2, y: yOf(1 / 256) - 4, class: "c-label", "text-anchor": "end" }, "chance, 1 in 256"));
      }
      if (showSim && state.pre) {
        CLF_ORDER.forEach(function (k) {
          var d = "", key = PAPER_KEY[k];
          ws.forEach(function (w, i) {
            var r = state.pre.runs[String(w)];
            if (!r || !r[key]) return;
            d += (d ? "L" : "M") + xOf(i).toFixed(1) + " " + yOf(r[key].acc).toFixed(1);
          });
          if (d) chart.appendChild(svg("path", { d: d, class: "cf-sim " + k }));
        });
      }
      var clipped = 0;
      E.PAPER.points.forEach(function (p) {
        var k = p.clf === "dt" ? "tree" : p.clf, i = ws.indexOf(p.w), y = yRaw(p.acc);
        if (y > H - B + 0.5) { clipped++; return; }
        var m = marker(CLF[k].mark, xOf(i) + (k === "knn" && p.kind === "max" ? 7 : 0), yOf(p.acc), 5, "cf-pt " + k + (p.kind === "max" ? " open" : ""));
        m.appendChild(svg("title", {}, CLF[k].name + ", w = " + p.w + ": " + p.text));
        chart.appendChild(m);
      });
      note.innerHTML = "Markers are the values the paper's text states (solid: average over five folds or every fold; open: best fold). " +
        (clipped ? "At this scale the w = 1 value (3.26 percent, best fold) sits below the chart. " : "") +
        (state.pre ? "Dashed lines: this page's simulation, one 80/20 split of " + int(state.pre.perOracle * 256) + " simulated traces (" + int(state.pre.nTest) + " held out), scored by scikit-learn " + state.pre.sklearn + "." : "");
    }
    onChange(function (what) { if (what === "pre" || what === "level") draw(); });
    resizers.push(draw);
    draw();
  }

  /* ------------------------------------------------------------ demo 4: run the attack */

  function mountAttack(root) {
    root.classList.add("w-ready");
    var cfg = { nValues: 64, perOracle: 20, w: 8, clfs: { knn: true, tree: true, rf: true, lr: true } };
    var worker = null;
    var wSeg = seg(W_OPTS.slice(0, 6), cfg.w, function (v) { cfg.w = v; }, "Additions per state, w");
    var nSeg = seg([{ label: "16", value: 16 }, { label: "64", value: 64 }, { label: "256", value: 256 }], cfg.nValues, function (v) { cfg.nValues = v; hint(); }, "Oracle values");
    var pSeg = seg([{ label: "10", value: 10 }, { label: "20", value: 20 }, { label: "50", value: 50 }], cfg.perOracle, function (v) { cfg.perOracle = v; hint(); }, "Traces per value");
    var checks = el("div", { class: "cf-checks" });
    CLF_ORDER.forEach(function (k) {
      var id = "cf-chk-" + k, box = el("input", { type: "checkbox", id: id });
      box.checked = true;
      box.addEventListener("change", function () { cfg.clfs[k] = box.checked; hint(); });
      checks.appendChild(el("label", { for: id, class: "cf-check" }, [box, " " + CLF[k].name]));
    });
    root.appendChild(el("div", { class: "cf-ctrls" }, [
      labeled("Work per state (w)", wSeg), labeled("Oracle values", nSeg), labeled("Traces per value", pSeg)
    ]));
    root.appendChild(checks);
    var run = el("button", { type: "button", class: "w-btn", text: "Run the attack" });
    var status = el("span", { class: "w-note cf-status", "aria-live": "polite" });
    root.appendChild(el("div", { class: "w-actions" }, [run, status]));
    var hintP = el("p", { class: "w-note cf-hint" });
    root.appendChild(hintP);
    var table = el("div", { class: "cf-results", role: "table", "aria-label": "Accuracy of each classifier on held-out simulated traces" });
    root.appendChild(table);
    var foot = el("p", { class: "w-note" });
    root.appendChild(foot);

    function lrIter() { return cfg.nValues >= 256 ? 40 : 150; }
    function hint() {
      var n = cfg.nValues * cfg.perOracle, test = cfg.nValues * Math.ceil(cfg.perOracle * 0.2);
      hintP.textContent = "Simulates " + int(n) + " traces, trains on " + int(n - test) + ", and tests on " + int(test) + ". " +
        "The paper used 100 traces for each of 256 values (25,600 per firmware). " +
        (cfg.clfs.lr && cfg.nValues >= 256 ? "Logistic regression on 256 values is the slow one (a minute or more); the page stops it after 40 iterations. " : "") +
        "Chance is 1 in " + cfg.nValues + " (" + pct(1 / cfg.nValues) + ").";
    }
    hint();

    function header() {
      table.innerHTML = "";
      table.appendChild(el("div", { class: "cf-rrow head", role: "row" }, [
        el("span", { role: "columnheader", text: "Classifier" }), el("span", { role: "columnheader", text: "Accuracy (simulated)" }),
        el("span", { role: "columnheader", text: "" }), el("span", { role: "columnheader", text: "Paper, same w" })
      ]));
    }
    function paperFor(k, w, nValues) {
      if (nValues !== 256) return "–";
      var key = PAPER_KEY[k], out = [];
      E.PAPER.points.forEach(function (p) { if (p.w === w && p.clf === key) out.push(p.text); });
      return out.length ? out.join("; ") : "–";
    }
    function row(k, res) {
      var acc = res.correct / res.n;
      var bar = el("span", { class: "cf-bar" }, [el("span", { class: "cf-barfill " + k, style: "width:" + (acc * 100).toFixed(1) + "%" })]);
      return el("div", { class: "cf-rrow", role: "row" }, [
        el("span", { role: "cell", class: "cf-rname", text: CLF[k].name }),
        el("span", { role: "cell", class: "cf-racc", html: "<strong>" + pct(acc) + "</strong> <span class='cf-dim'>" + int(res.correct) + " of " + int(res.n) + "</span>" }),
        el("span", { role: "cell" }, [bar]),
        el("span", { role: "cell", class: "cf-rpaper", text: paperFor(k, cfg.w, cfg.nValues) })
      ]);
    }

    run.addEventListener("click", function () {
      if (worker) { worker.terminate(); worker = null; run.textContent = "Run the attack"; run.classList.remove("running"); status.textContent = "Stopped."; return; }
      var clfs = CLF_ORDER.filter(function (k) { return cfg.clfs[k]; });
      if (!clfs.length) { status.textContent = "Pick at least one classifier."; return; }
      header();
      try { worker = new Worker(BASE + "attack-worker.js"); } catch (err) { status.textContent = "This browser could not start the attack in the background."; return; }
      run.textContent = "Stop"; run.classList.add("running");
      var t0 = Date.now(), runCfg = { w: cfg.w, nValues: cfg.nValues, perOracle: cfg.perOracle };
      var names = { capture: "Simulating traces", knn: "k-nearest neighbors", tree: "Growing the decision tree", rf: "Growing the forest", lr: "Fitting logistic regression" };
      worker.onmessage = function (e) {
        var m = e.data;
        if (m.type === "progress") status.textContent = names[m.stage] + (m.total > 1 ? ": " + int(m.done) + " of " + int(m.total) : "") + "…";
        else if (m.type === "result") {
          table.appendChild(row(m.clf, m));
          if (m.note) table.lastChild.title = m.note;
        } else if (m.type === "done") {
          worker.terminate(); worker = null; run.textContent = "Run the attack"; run.classList.remove("running");
          status.textContent = "Done in " + ((Date.now() - t0) / 1000).toFixed(1) + " s.";
          foot.textContent = "Simulated: " + int(runCfg.nValues) + " oracle values × " + runCfg.perOracle + " traces at w = " + runCfg.w + " (" + m.len + " samples each); " +
            int(m.nTrain) + " traces trained each classifier and " + int(m.nTest) + " were held out. The forest has 30 trees (scikit-learn's default is 100); logistic regression stops after " +
            (runCfg.nValues >= 256 ? 40 : 150) + " iterations. Paper values come from 256 values × 100 measured traces and appear only where the text reports that w.";
        }
      };
      worker.postMessage({ nValues: cfg.nValues, perOracle: cfg.perOracle, w: cfg.w, seed: 1, clfs: clfs, trees: 30, lrIter: lrIter() });
    });
    header();
  }

  /* ------------------------------------------------------------ demo 5: how far above chance */

  function mountChance(root) {
    root.classList.add("w-ready");
    var cfg = { k: 167, n: 5120, classes: 256 };
    function num(label, key, min, max) {
      var input = el("input", { type: "number", min: min, max: max, step: 1, value: cfg[key], class: "cf-num", "aria-label": label });
      input.addEventListener("input", function () { var v = Math.round(+input.value); if (v >= min && v <= max) { cfg[key] = v; draw(); } });
      return { row: labeled(label, input), input: input };
    }
    var kI = num("Correct", "k", 0, 100000), nI = num("Held out", "n", 1, 100000), cI = num("Classes", "classes", 2, 65536);
    var presets = el("div", { class: "w-actions" });
    [{ t: "w = 1, best fold (3.26%)", k: 167, n: 5120 }, { t: "Fig. 5 caption (2%)", k: 102, n: 5120 }, { t: "KNN at w = 16, best fold (81.4%)", k: 4168, n: 5120 }].forEach(function (p) {
      var b = el("button", { type: "button", class: "w-btn w-btn-quiet", text: p.t });
      b.addEventListener("click", function () { cfg.k = p.k; cfg.n = p.n; cfg.classes = 256; kI.input.value = p.k; nI.input.value = p.n; cI.input.value = 256; draw(); });
      presets.appendChild(b);
    });
    root.appendChild(el("div", { class: "cf-ctrls" }, [kI.row, nI.row, cI.row]));
    root.appendChild(presets);
    var out = el("div", { class: "cf-bounds" });
    root.appendChild(out);
    function sci(t) {
      if (t.p >= 1e-4) return t.p.toPrecision(3);
      var e = Math.floor(t.log10), m = Math.pow(10, t.log10 - e);
      if (m >= 9.995) { m = 1; e++; }
      return m.toFixed(2) + " × 10<sup>" + String(e).replace("-", "−") + "</sup>";
    }
    function draw() {
      out.innerHTML = "";
      if (cfg.k > cfg.n) { out.appendChild(el("p", { class: "cf-row", text: "Correct cannot exceed held out." })); return; }
      var p0 = 1 / cfg.classes, acc = cfg.k / cfg.n, exp = cfg.n * p0, tail = M.binomTail(cfg.k, cfg.n, p0);
      var rows = [
        ["Accuracy", pct(acc, 2) + " (" + int(cfg.k) + " of " + int(cfg.n) + ")"],
        ["Chance", pct(p0, 2) + ", or about " + exp.toFixed(1) + " correct by guessing"],
        ["Times chance", (acc / p0).toFixed(1) + "×"],
        ["P(at least " + int(cfg.k) + " correct by guessing)", sci(tail)]
      ];
      rows.forEach(function (r) { out.appendChild(el("p", { class: "cf-row" }, [el("span", { class: "cf-rk", text: r[0] }), el("span", { class: "cf-rv", html: r[1] })])); });
      out.appendChild(el("p", { class: "w-note", text: "Computed by this page with an exact binomial tail; the paper reports no test against chance." }));
    }
    draw();
  }

  /* ------------------------------------------------------------ boot */

  function boot() {
    var mounts = { "cf-machine": mountMachine, "cf-diff": mountDiff, "cf-paper": mountPaper, "cf-attack": mountAttack, "cf-chance": mountChance };
    Object.keys(mounts).forEach(function (id) { var n = document.getElementById(id); if (n) mounts[id](n); });
    if (window.fetch) fetch(BASE + "precomputed.json").then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
      if (j) { state.pre = j; changed("pre"); }
    }).catch(function () {});
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();

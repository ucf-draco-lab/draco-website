/*
  Spy Hunter widget for /papers/spy-hunter-keystrokes/.
  Mount points: #sh-rhythm, #sh-enroll, #sh-trust, #sh-results.
  One shared state: the enrollment keystrokes (yours or a simulated typist's),
  the two trained classifiers, the test keystrokes, and the trust-model settings.
  Key identities are never read or kept: only press and release times.
*/
(function () {
  "use strict";

  var E = window.SpyHunter;
  if (!E) return;

  var SVGNS = "http://www.w3.org/2000/svg";
  var MIN_ROWS = 40;
  var SIM_A = 3, SIM_B = 5;           // simulated typists used by the replay buttons
  var PAGE_NU = 0.25;                 // the paper does not report nu; this page's choice

  /* ------------------------------------------------------------ paper data */

  // arXiv 1903.03132, Tables 1 and 2: block size 30, 50, 80, 100.
  var ARXIV_BLOCKS = [30, 50, 80, 100];
  var ARXIV = {
    prompted: { label: "Phase 1, prompted typing", far: [0.0025, 0.0150, 0.0400, 0.0525], frr: [0.0500, 0.0350, 0.0175, 0.0125], blocks: [2.1947, 2.6684, 3.0711, 2.9737] },
    free: { label: "Phase 2, free use", far: [0.0000, 0.0000, 0.0100, 0.0150], frr: [0.0500, 0.0400, 0.0300, 0.0225], blocks: [1.8237, 2.2763, 2.4553, 2.5737] }
  };
  // arXiv Table 3: random-segment validation, 80 characters per block.
  var ARXIV_T3 = [
    { phase: "Prompted", folds: 5, far: 0.0310, frr: 0.0135, blocks: 2.7932 },
    { phase: "Prompted", folds: 10, far: 0.0320, frr: 0.0068, blocks: 2.9834 },
    { phase: "Free use", folds: 5, far: 0.0083, frr: 0.0170, blocks: 2.6813 },
    { phase: "Free use", folds: 10, far: 0.0120, frr: 0.0115, blocks: 2.8542 }
  ];
  // ICMLA 2019, Table II: free-text keystroke work compared.
  var TABLE2 = [
    { ref: "Montalvão Filho and Freire [6]", method: "Markov chain", n: 15, far: 0.127, frr: 0.127, eer: true, impostor: "Yes" },
    { ref: "Gunetti and Picardi [13]", method: "R and A distances", n: 40, far: 0.00005, frr: 0.05, impostor: "Yes" },
    { ref: "Hempstalk et al. [29]", method: "One-class classification", n: 10, far: 0.113, frr: 0.204, impostor: "No" },
    { ref: "Messerman et al. [15]", method: "R and A distances", n: 55, far: 0.0246, frr: 0.0246, eer: true, impostor: "Yes" },
    { ref: "Kim et al. [20]", method: "K-means clustering", n: 150, far: 0.0044, frr: 0.0044, eer: true, impostor: "Other users" },
    { ref: "Kim et al. [20]", method: "One-class SVM", n: 150, far: 0.0153, frr: 0.0153, eer: true, impostor: "Other users" },
    { ref: "Alsultan et al. [25]", method: "SVM", n: 10, far: 0.00113, frr: 0.00331, impostor: "Yes" },
    { ref: "Spy Hunter (ICMLA 2019)", method: "Two one-class SVMs and a trust model", n: 20, far: 0.0205, frr: 0.0200, impostor: "No", ours: true }
  ];
  // Values the paper swept in Section IV-B; the trust demo's sliders use them.
  var SWEEPS = {
    n: { label: "Block size n", values: [1, 5, 6, 10, 15, 20, 30, 50, 80, 100], best: 6, fmt: function (v) { return String(v); } },
    acc: { label: "Threshold accuracy acc", values: [0.6, 0.65, 0.7, 0.8, 0.9, 1.0], best: 0.65, fmt: function (v) { return Math.round(v * 100) + "%"; } },
    lambda: { label: "Threshold trust λ", values: [20, 50, 60, 70, 80, 90, 100], best: 70, fmt: function (v) { return String(v); } },
    g1: { label: "Gamma g1", values: [0.01, 0.1, 1, 10, 50, 100], best: 0.01, fmt: function (v) { return String(v); } },
    g2: { label: "Gamma g2", values: [0.01, 0.1, 1, 10, 50, 100], best: 50, fmt: function (v) { return String(v); } }
  };

  var PROMPT = "Every morning the lab opens at eight, and the first person in starts the coffee, checks the oscilloscope, and reads the overnight logs. A quiet room is a good place to think about what a machine can learn from the rhythm of your hands.";

  /* ------------------------------------------------------------ state */

  var state = {
    enroll: [],          // [{down, up}] seconds
    enrollSource: null,  // "you" | "sim" | null
    test: [],
    testSource: null,    // "you" | "impostor" | "simself" | null
    table1: false,       // demo 1 shows Table I
    filter: true,
    model: null,
    modelKey: "",
    params: Object.assign({}, E.DEFAULTS, { nu: PAGE_NU }),
    level: window.PaperKit ? window.PaperKit.level() : "public"
  };
  var listeners = [];
  function onChange(fn) { listeners.push(fn); }
  function changed(what) { listeners.forEach(function (fn) { fn(what); }); }
  document.addEventListener("paperlevel", function (e) { state.level = e.detail.level; changed("level"); });

  function enrollRows() {
    var rows = E.features(state.enroll);
    return state.filter ? E.filterRows(rows) : rows;
  }
  function testRows() {
    var rows = E.features(state.test);
    return state.filter ? E.filterRows(rows) : rows;
  }
  function modelKey() { var p = state.params; return [state.enroll.length, state.enrollSource, state.filter, p.g1, p.g2, p.nu].join("|"); }
  function ensureModel() {
    var key = modelKey();
    if (state.model && state.modelKey === key) return state.model;
    var rows = enrollRows();
    if (rows.length < MIN_ROWS) { state.model = null; return null; }
    if (rows.length > 1500) rows = rows.slice(rows.length - 1500);
    state.model = E.train(rows, state.params);
    state.model.rows = rows;
    state.modelKey = key;
    return state.model;
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
    var btns = options.map(function (o) {
      var b = el("button", { type: "button", class: "seg-option", role: "radio", "aria-checked": String(o.value === value), text: o.label });
      if (o.title) b.title = o.title;
      b.addEventListener("click", function () { set(o.value); onPick(o.value); });
      wrap.appendChild(b);
      return b;
    });
    function set(v) { btns.forEach(function (b, i) { b.setAttribute("aria-checked", String(options[i].value === v)); }); }
    wrap.set = set;
    return wrap;
  }
  function ms(x) { return Math.round(x * 1000); }
  function pct(x, d) { return (x * 100).toFixed(d == null ? 2 : d) + "%"; }
  function plural(n, one, many) { return n + " " + (n === 1 ? one : many); }
  function spell(n) { return n >= 0 && n < 10 ? ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"][n] : String(n); }

  // Capture press and release times on a text box. Reads e.code only to pair a
  // press with its release, and forgets it at once. Ignores auto-repeat.
  function capture(box, onKey) {
    var pending = {};
    box.addEventListener("keydown", function (e) {
      if (e.repeat || e.isComposing) return;
      var id = e.code || ("k" + e.keyCode);
      if (pending[id] == null) pending[id] = performance.now() / 1000;
    });
    box.addEventListener("keyup", function (e) {
      var id = e.code || ("k" + e.keyCode);
      if (pending[id] == null) return;
      var down = pending[id];
      delete pending[id];
      onKey({ down: down, up: performance.now() / 1000 });
    });
    box.addEventListener("blur", function () { pending = {}; });
  }

  /* ------------------------------------------------------------ demo 1: rhythm */

  function mountRhythm(root) {
    var box = el("textarea", { class: "sh-box", rows: "3", spellcheck: "false", autocomplete: "off", autocapitalize: "off",
      "aria-label": "Type here to record your keystroke timing", placeholder: "Type the passage above here. Only the timing of each key is recorded, on this device." });
    var prompt = el("p", { class: "sh-prompt" }, [PROMPT]);
    var simBtn = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "Use a simulated typist" });
    var t1Btn = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "Show the paper's Table I" });
    var clrBtn = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "Clear" });
    var count = el("p", { class: "w-big", "aria-live": "polite" });
    var chart = svg("svg", { class: "sh-timeline", role: "img" });
    var tableWrap = el("div", { class: "sh-table-wrap" });
    var note = el("p", { class: "w-note" });
    root.appendChild(prompt);
    root.appendChild(box);
    root.appendChild(el("div", { class: "w-actions" }, [simBtn, t1Btn, clrBtn]));
    root.appendChild(count);
    root.appendChild(chart);
    root.appendChild(tableWrap);
    root.appendChild(note);

    var raf = 0;
    capture(box, function (k) {
      if (state.enrollSource !== "you") { state.enroll = []; state.enrollSource = "you"; }
      state.table1 = false;
      state.enroll.push(k);
      if (!raf) raf = requestAnimationFrame(function () { raf = 0; changed("enroll"); });
    });
    simBtn.addEventListener("click", function () {
      state.enroll = E.typeKeys(E.makeTypist(SIM_A), 400, 11);
      state.enrollSource = "sim";
      state.table1 = false;
      box.value = "";
      changed("enroll");
    });
    t1Btn.addEventListener("click", function () { state.table1 = !state.table1; changed("table1"); });
    clrBtn.addEventListener("click", function () {
      state.enroll = []; state.enrollSource = null; state.table1 = false; box.value = "";
      state.test = []; state.testSource = null;
      changed("enroll");
    });

    function events() { return state.table1 ? E.table1Events() : state.enroll; }

    function drawTimeline() {
      var ev = events().slice().sort(function (a, b) { return a.down - b.down; });
      var show = ev.slice(-8);
      var W = chartWidth(chart), H = 150, padL = 8, padR = 8, top = 14;
      chart.setAttribute("viewBox", "0 0 " + W + " " + H);
      chart.setAttribute("width", W);
      while (chart.firstChild) chart.removeChild(chart.firstChild);
      if (show.length === 0) {
        chart.setAttribute("aria-label", "Keystroke timeline, empty");
        chart.appendChild(svg("text", { x: W / 2, y: H / 2, class: "c-label", "text-anchor": "middle" }, "Start typing, or press a button above"));
        t1Btn.textContent = "Show the paper's Table I";
        return;
      }
      t1Btn.textContent = state.table1 ? "Back to your typing" : "Show the paper's Table I";
      var t0 = show[0].down, t1 = show[show.length - 1].up;
      for (var q = 0; q < show.length; q++) t1 = Math.max(t1, show[q].up);
      var span = Math.max(0.3, t1 - t0);
      var x = function (t) { return padL + (t - t0) / span * (W - padL - padR); };
      var laneH = 16, lanes = 2;
      // time grid every 100 ms
      for (var g = 0; g <= span + 1e-9; g += 0.1) {
        var gx = x(t0 + g);
        chart.appendChild(svg("line", { x1: gx, x2: gx, y1: top - 4, y2: top + lanes * (laneH + 6), class: "c-grid" }));
      }
      chart.appendChild(svg("text", { x: W - padR, y: top - 4, class: "c-tick", "text-anchor": "end" }, "grid: 100 ms"));
      show.forEach(function (k, i) {
        var lane = i % lanes, y = top + lane * (laneH + 6);
        var last2 = i >= show.length - 2;
        chart.appendChild(svg("rect", { x: x(k.down), y: y, width: Math.max(2, x(k.up) - x(k.down)), height: laneH, class: "sh-key" + (last2 ? " on" : "") }));
      });
      // the five intervals of the newest pair
      if (show.length >= 2) {
        var p = show[show.length - 2], c = show[show.length - 1];
        var base = top + lanes * (laneH + 6) + 8;
        var spans = [
          ["Hold", c.down, c.up],
          ["UD", p.up, c.down],
          ["UU", p.up, c.up],
          ["DD", p.down, c.down],
          ["DU", p.down, c.up]
        ];
        spans.forEach(function (s, i) {
          var y = base + i * 15, a = x(Math.min(s[1], s[2])), b = x(Math.max(s[1], s[2]));
          var neg = s[2] < s[1];
          chart.appendChild(svg("line", { x1: a, x2: b, y1: y, y2: y, class: "sh-span" + (neg ? " neg" : "") }));
          chart.appendChild(svg("line", { x1: a, x2: a, y1: y - 3, y2: y + 3, class: "sh-span" }));
          chart.appendChild(svg("line", { x1: b, x2: b, y1: y - 3, y2: y + 3, class: "sh-span" }));
          var lab = s[0] + " " + ms(s[2] - s[1]) + " ms";
          var lx = b + 6, anchor = "start";
          if (lx > W - 90) { lx = a - 6; anchor = "end"; }
          chart.appendChild(svg("text", { x: lx, y: y + 4, class: "c-label", "text-anchor": anchor }, lab));
        });
        H = base + 5 * 15 + 4;
        chart.setAttribute("viewBox", "0 0 " + W + " " + H);
      }
      chart.setAttribute("aria-label", "Timeline of the last " + show.length + " keystrokes as press-to-release bars, with the five intervals between the newest two");
    }

    function drawTable() {
      tableWrap.innerHTML = "";
      var rows = E.features(events());
      var t = el("table", { class: "results-table sh-feat" });
      var head = el("tr", null, [el("th", { text: "#" })].concat(E.FEATURES.map(function (f) { return el("th", { text: E.FEATURE_LABELS[f] + " (s)" }); })).concat([el("th", { text: "Filter" })]));
      t.appendChild(el("thead", null, [head]));
      var tb = el("tbody");
      var start = Math.max(0, rows.length - 6);
      for (var i = start; i < rows.length; i++) {
        var r = rows[i], tr = el("tr");
        tr.appendChild(el("td", { class: "w-mono", text: String(i + 1) }));
        r.forEach(function (v, j) {
          var cell = el("td", { class: "sh-num", text: v.toFixed(4) });
          if (state.table1) {
            var printed = E.TABLE1[i][j], diff = Math.abs(v - printed);
            cell.className += diff < 5e-5 ? " sh-match" : " sh-near";
            cell.title = "Printed in Table I: " + printed.toFixed(4) + " s";
            if (diff >= 5e-5) cell.textContent = v.toFixed(4) + " (" + printed.toFixed(4) + ")";
          } else if (v < E.FILTER_LO || v > E.FILTER_HI) cell.className += " sh-out";
          tr.appendChild(cell);
        });
        tr.appendChild(el("td", { class: "w-mono", text: E.keepRow(r) ? "kept" : "dropped" }));
        tb.appendChild(tr);
      }
      if (!rows.length) tb.appendChild(el("tr", null, [el("td", { colspan: "7", class: "w-mono", text: "No rows yet: each keystroke after the first adds one." })]));
      t.appendChild(tb);
      tableWrap.appendChild(t);
    }

    function update() {
      var ev = events(), rows = E.features(ev), kept = rows.filter(E.keepRow).length;
      if (state.table1) {
        var exact = 0;
        rows.forEach(function (r, i) { r.forEach(function (v, j) { if (Math.abs(v - E.TABLE1[i][j]) < 5e-5) exact++; }); });
        count.innerHTML = "Table I rebuilt: <strong>" + exact + " of 30</strong> values exact";
        note.textContent = "The paper's six example rows are consecutive keystrokes, so seven press and release times can be rebuilt from them. The engine recomputes every feature from those times: " + exact + " of 30 values match exactly and the other " + spell(30 - exact) + " differ by 0.1 ms, the rounding of the printed table. Values in brackets are the printed ones. Only " + spell(kept) + " of the six rows passes the paper's 96 to 825 ms filter.";
      } else {
        count.innerHTML = "<strong>" + ev.length + "</strong> keystrokes · " + rows.length + " rows · " + kept + " pass the filter";
        if (state.enrollSource === "sim") note.textContent = "Simulated typist: 400 keystrokes drawn by this page from a statistical model of one person's hold times and gaps between keys. Simulated, not data from the paper.";
        else if (ev.length) note.textContent = "Timings come from your browser's key events on this device and are never sent anywhere. Phone keyboards report press and release poorly; a physical keyboard gives real hold times. Shaded cells fall outside the paper's 96 to 825 ms filter.";
        else note.textContent = "";
      }
      drawTimeline();
      drawTable();
    }
    onChange(function (what) {
      if (what === "params" || what === "test" || what === "level") return;
      if (state.enrollSource !== "you") box.value = "";
      update();
    });
    resizers.push(drawTimeline);
    update();
  }

  /* ------------------------------------------------------------ demo 2: enroll */

  var AXES = [{ i: 0, label: "Hold (ms)" }, { i: 3, label: "DD, press to press (ms)" }];

  function mountEnroll(root) {
    var trainBtn = el("button", { type: "button", class: "w-btn", text: "Train Spy Hunter" });
    var filterSeg = seg([{ value: true, label: "Paper's 96–825 ms filter" }, { value: false, label: "No filter" }], state.filter, function (v) { state.filter = v; changed("filter"); }, "Outlier filter");
    var clfSeg = seg([{ value: 0, label: "Classifier 1 (g1)" }, { value: 1, label: "Classifier 2 (g2)" }], 1, function (v) { which = v; draw(); }, "Classifier to draw");
    var which = 1;
    var big = el("p", { class: "w-big", "aria-live": "polite" });
    var chart = svg("svg", { class: "sh-scatter", role: "img" });
    var facts = el("dl", { class: "sh-facts" });
    var note = el("p", { class: "w-note" });
    root.appendChild(el("div", { class: "w-actions" }, [trainBtn, filterSeg]));
    root.appendChild(big);
    root.appendChild(el("div", { class: "w-actions" }, [clfSeg]));
    root.appendChild(chart);
    root.appendChild(facts);
    root.appendChild(note);
    var trained = false;

    trainBtn.addEventListener("click", function () {
      if (enrollRows().length < MIN_ROWS) {
        state.enroll = E.typeKeys(E.makeTypist(SIM_A), 400, 11);
        state.enrollSource = "sim";
        state.table1 = false;
      }
      trained = true;
      ensureModel();
      changed("trained");
    });

    function fact(k, v) { facts.appendChild(el("dt", { text: k })); facts.appendChild(el("dd", { text: v })); }

    function draw() {
      var W = chartWidth(chart), H = Math.round(Math.min(320, W * 0.6)), padL = 44, padB = 34, padT = 10, padR = 10;
      chart.setAttribute("viewBox", "0 0 " + W + " " + H);
      chart.setAttribute("width", W);
      while (chart.firstChild) chart.removeChild(chart.firstChild);
      var m = trained ? state.model : null;
      var rows = m ? m.rows : enrollRows();
      if (!rows.length) {
        chart.appendChild(svg("text", { x: W / 2, y: H / 2, class: "c-label", "text-anchor": "middle" }, "Type in the box above, or press Train to use a simulated typist"));
        chart.setAttribute("aria-label", "Scatter of enrollment rows, empty");
        return;
      }
      var xi = AXES[0].i, yi = AXES[1].i;
      var xs = rows.map(function (r) { return r[xi]; }).sort(function (a, b) { return a - b; });
      var ys = rows.map(function (r) { return r[yi]; }).sort(function (a, b) { return a - b; });
      var q = function (a, p) { return a[Math.min(a.length - 1, Math.floor(p * a.length))]; };
      var x0 = Math.max(0, q(xs, 0.01) * 0.8), x1 = Math.max(x0 + 0.08, q(xs, 0.99) * 1.1), y0 = Math.min(0, q(ys, 0.01)) || Math.max(0, q(ys, 0.01) * 0.7), y1 = Math.max(y0 + 0.15, q(ys, 0.99) * 1.1);
      var X = function (v) { return padL + (v - x0) / (x1 - x0) * (W - padL - padR); };
      var Y = function (v) { return H - padB - (v - y0) / (y1 - y0) * (H - padT - padB); };
      if (m) {
        // decision slice: the other three features held at their medians
        var med = [0, 1, 2, 3, 4].map(function (j) { var s = rows.map(function (r) { return r[j]; }).sort(function (a, b) { return a - b; }); return s[Math.floor(s.length / 2)]; });
        var model = which ? m.m2 : m.m1, nx = 48, ny = 30;
        var cw = (W - padL - padR) / nx, chh = (H - padT - padB) / ny;
        for (var a = 0; a < nx; a++) for (var b = 0; b < ny; b++) {
          var pt = med.slice();
          pt[xi] = x0 + (a + 0.5) / nx * (x1 - x0);
          pt[yi] = y1 - (b + 0.5) / ny * (y1 - y0);
          if (E.decision(model, pt) > 0) chart.appendChild(svg("rect", { x: padL + a * cw, y: padT + b * chh, width: cw + 0.5, height: chh + 0.5, class: "sh-inside", "shape-rendering": "crispEdges" }));
        }
      }
      // axes and ticks
      chart.appendChild(svg("line", { x1: padL, x2: W - padR, y1: H - padB, y2: H - padB, class: "c-grid" }));
      chart.appendChild(svg("line", { x1: padL, x2: padL, y1: padT, y2: H - padB, class: "c-grid" }));
      var step = function (lo, hi) { var s = (hi - lo) / 4; return s > 0.15 ? 0.2 : s > 0.07 ? 0.1 : s > 0.035 ? 0.05 : 0.02; };
      var sx = step(x0, x1), sy = step(y0, y1), v;
      for (v = Math.ceil(x0 / sx) * sx; v <= x1 + 1e-9; v += sx) chart.appendChild(svg("text", { x: X(v), y: H - padB + 14, class: "c-tick", "text-anchor": "middle" }, String(ms(v))));
      for (v = Math.ceil(y0 / sy) * sy; v <= y1 + 1e-9; v += sy) chart.appendChild(svg("text", { x: padL - 6, y: Y(v) + 4, class: "c-tick", "text-anchor": "end" }, String(ms(v))));
      chart.appendChild(svg("text", { x: (padL + W - padR) / 2, y: H - 4, class: "c-label", "text-anchor": "middle" }, AXES[0].label));
      chart.appendChild(svg("text", { x: 12, y: (padT + H - padB) / 2, class: "c-label", "text-anchor": "middle", transform: "rotate(-90 12 " + (padT + H - padB) / 2 + ")" }, AXES[1].label));
      rows.forEach(function (r) {
        var cls = "sh-dot";
        if (m) cls += E.predict(which ? m.m2 : m.m1, r) > 0 ? " in" : " out";
        chart.appendChild(svg("circle", { cx: X(Math.max(x0, Math.min(x1, r[xi]))), cy: Y(Math.max(y0, Math.min(y1, r[yi]))), r: 2.6, class: cls }));
      });
      chart.setAttribute("aria-label", "Scatter of " + rows.length + " enrollment rows, hold time against press-to-press time" + (m ? ", with the region classifier " + (which + 1) + " accepts shaded" : ""));
    }

    function update() {
      var rows = enrollRows(), all = E.features(state.enroll).length;
      facts.innerHTML = "";
      var m = trained ? ensureModel() : null;
      if (trained && !m) trained = false;
      trainBtn.textContent = rows.length >= MIN_ROWS ? (trained ? "Retrain" : "Train Spy Hunter") : "Train on a simulated typist";
      if (m) {
        var own1 = 0, own2 = 0;
        m.rows.forEach(function (r) { if (E.predict(m.m1, r) < 0) own1++; if (E.predict(m.m2, r) < 0) own2++; });
        big.innerHTML = "Trained on <strong>" + m.rows.length + "</strong> rows " + (state.enrollSource === "sim" ? "(simulated typist)" : "of your typing");
        fact("Classifier 1", "RBF gamma " + state.params.g1 + ", " + m.m1.sv.length + " support vectors, flags " + pct(own1 / m.rows.length, 1) + " of its own training rows");
        fact("Classifier 2", "RBF gamma " + state.params.g2 + ", " + m.m2.sv.length + " support vectors, flags " + pct(own2 / m.rows.length, 1) + " of its own training rows");
        fact("Rows used", m.rows.length + " of " + all + (state.filter ? " after the 96 to 825 ms filter" : ", unfiltered"));
        fact("ν (nu)", state.params.nu + ", this page's choice (the paper does not report it)");
        note.textContent = "The shaded region is where the chosen classifier says \"genuine\", drawn on a slice through the other three features at their median values. Each one-class SVM learns only from the genuine typist's rows; no intruder data is used in training.";
      } else {
        big.innerHTML = rows.length >= MIN_ROWS ? "<strong>" + rows.length + "</strong> rows ready to train" : "<strong>" + rows.length + "</strong> of " + MIN_ROWS + " rows needed";
        note.textContent = rows.length >= MIN_ROWS ? "Press Train to fit both classifiers on your rows, in your browser." : "Type more of the passage in the first demo (about " + Math.max(0, Math.ceil((MIN_ROWS - rows.length) * 2.2)) + " more keystrokes with the filter on), or train on a simulated typist.";
      }
      draw();
    }
    onChange(function (what) {
      if (what === "enroll" && state.enrollSource !== "you") trained = false;
      if (what === "level" || what === "test") return;
      update();
    });
    resizers.push(draw);
    update();
  }

  /* ------------------------------------------------------------ demo 3: trust */

  function mountTrust(root) {
    var box = el("textarea", { class: "sh-box", rows: "2", spellcheck: "false", autocomplete: "off", autocapitalize: "off",
      "aria-label": "Keep typing here to be judged block by block", placeholder: "After training, keep typing here, or hand the keyboard to someone else." });
    var impBtn = el("button", { type: "button", class: "w-btn", text: "Replay a simulated impostor" });
    var selfBtn = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "Replay more of the simulated typist" });
    var clrBtn = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "Clear" });
    var big = el("p", { class: "w-big", "aria-live": "polite" });
    var chart = svg("svg", { class: "sh-trust-chart", role: "img" });
    var rulesWrap = el("div", { class: "sh-table-wrap" });
    var ctrls = el("div", { class: "sh-ctrls" });
    var note = el("p", { class: "w-note" });
    root.appendChild(box);
    root.appendChild(el("div", { class: "w-actions" }, [impBtn, selfBtn, clrBtn]));
    root.appendChild(big);
    root.appendChild(chart);
    root.appendChild(rulesWrap);
    root.appendChild(ctrls);
    root.appendChild(note);
    var selected = -1, anim = null;

    function needModel() {
      if (!ensureModel()) {
        state.enroll = E.typeKeys(E.makeTypist(SIM_A), 400, 11);
        state.enrollSource = "sim";
        changed("enroll");
        ensureModel();
      }
    }
    var raf = 0;
    capture(box, function (k) {
      stopAnim();
      if (state.testSource !== "you") { state.test = []; state.testSource = "you"; }
      state.test.push(k);
      selected = -1;
      if (!raf) raf = requestAnimationFrame(function () { raf = 0; changed("test"); });
    });
    function replay(ev, source) {
      needModel();
      stopAnim();
      state.testSource = source; box.value = "";
      var full = ev, shown = 0;
      state.test = [];
      anim = setInterval(function () {
        shown += 6;
        state.test = full.slice(0, shown);
        selected = -1;
        changed("test");
        var res = session();
        if (shown >= full.length || (res && res.locked)) {
          stopAnim();
          state.test = full;   // keep the whole stream so slider changes judge all of it
        }
      }, 60);
    }
    function stopAnim() { if (anim) { clearInterval(anim); anim = null; } }
    impBtn.addEventListener("click", function () { replay(E.typeKeys(E.makeTypist(SIM_B), 400, 153), "impostor"); });
    selfBtn.addEventListener("click", function () { replay(E.typeKeys(E.makeTypist(SIM_A), 400, 13), "simself"); });
    clrBtn.addEventListener("click", function () { stopAnim(); state.test = []; state.testSource = null; box.value = ""; changed("test"); });

    function session() {
      var m = state.model && state.modelKey === modelKey() ? state.model : ensureModel();
      if (!m) return null;
      return E.runSession(m.m1, m.m2, testRows(), state.params);
    }

    // controls
    function slider(label, key, values, fmt, levels) {
      var wrap = el("label", { class: "w-range" });
      if (levels) wrap.setAttribute("data-levels", levels);
      var input = el("input", { type: "range", min: "0", max: String(values.length - 1), step: "1" });
      var idx = values.indexOf(state.params[key]);
      input.value = String(idx < 0 ? 0 : idx);
      var out = el("output", { text: fmt(state.params[key]) });
      input.addEventListener("input", function () {
        state.params[key] = values[+input.value];
        out.textContent = fmt(state.params[key]);
        changed("params");
      });
      wrap.appendChild(el("span", { text: label }));
      wrap.appendChild(input);
      wrap.appendChild(out);
      return wrap;
    }
    ctrls.appendChild(slider("Block size n", "n", SWEEPS.n.values, SWEEPS.n.fmt, "ug grad res"));
    ctrls.appendChild(slider("acc", "acc", SWEEPS.acc.values, SWEEPS.acc.fmt, "ug grad res"));
    ctrls.appendChild(slider("λ", "lambda", SWEEPS.lambda.values, SWEEPS.lambda.fmt, "ug grad res"));
    ctrls.appendChild(slider("g1", "g1", SWEEPS.g1.values, SWEEPS.g1.fmt, "grad res"));
    ctrls.appendChild(slider("g2", "g2", SWEEPS.g2.values, SWEEPS.g2.fmt, "grad res"));
    ctrls.appendChild(slider("ν", "nu", [0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.5], String, "grad res"));
    var resetBtn = el("button", { type: "button", class: "w-btn w-btn-quiet sh-small", text: "Paper's settings", "data-levels": "ug grad res" });
    resetBtn.addEventListener("click", function () {
      state.params = Object.assign({}, E.DEFAULTS, { nu: PAGE_NU });
      ctrls.querySelectorAll("input[type=range]").forEach(function (inp, i) {
        var keys = ["n", "acc", "lambda", "g1", "g2", "nu"];
        var vals = [SWEEPS.n.values, SWEEPS.acc.values, SWEEPS.lambda.values, SWEEPS.g1.values, SWEEPS.g2.values, [0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.5]];
        inp.value = String(vals[i].indexOf(state.params[keys[i]]));
        inp.nextSibling.textContent = i === 1 ? SWEEPS.acc.fmt(state.params.acc) : String(state.params[keys[i]]);
      });
      changed("params");
    });
    ctrls.appendChild(resetBtn);

    var RULES = [
      { id: "a", when: "Both classifiers flag at least acc of the block", act: "T − w1 · avg", w: "w1 = 10" },
      { id: "b", when: "One classifier flags at least acc of the block", act: "T − w2 · avg", w: "w2 = 8" },
      { id: "c", when: "Both flag some rows, each below acc", act: "T − w3 · avg", w: "w3 = 0.03" },
      { id: "d", when: "Either classifier flags no rows", act: "T + w4 · (1 − avg), at most 100", w: "w4 = 2" }
    ];
    function drawRules(blk) {
      rulesWrap.innerHTML = "";
      var t = el("table", { class: "results-table sh-rules" });
      t.appendChild(el("thead", null, [el("tr", null, [el("th", { text: "Rule" }), el("th", { text: "When" }), el("th", { text: "Trust level becomes" }), el("th", { text: "Weight" })])]));
      var tb = el("tbody");
      RULES.forEach(function (r) {
        var tr = el("tr", { class: blk && blk.rule === r.id ? "on" : "" }, [el("td", { class: "w-mono", text: "(" + r.id + ")" }), el("td", { text: r.when }), el("td", { class: "w-mono", text: r.act }), el("td", { class: "w-mono", text: r.w })]);
        tb.appendChild(tr);
      });
      t.appendChild(tb);
      rulesWrap.appendChild(t);
    }

    function draw(res) {
      var W = chartWidth(chart), H = 240, padL = 36, padR = 12, padT = 22, padB = 30;
      var midH = 160;  // trust panel height, bars below
      chart.setAttribute("viewBox", "0 0 " + W + " " + H);
      chart.setAttribute("width", W);
      while (chart.firstChild) chart.removeChild(chart.firstChild);
      var blocks = res ? res.blocks : [];
      var nB = Math.max(12, blocks.length);
      var bw = (W - padL - padR) / nB;
      var Y = function (T) { return padT + (100 - Math.max(0, T)) / 100 * (midH - padT); };
      [0, 25, 50, 75, 100].forEach(function (v) {
        chart.appendChild(svg("line", { x1: padL, x2: W - padR, y1: Y(v), y2: Y(v), class: "c-grid" }));
        chart.appendChild(svg("text", { x: padL - 6, y: Y(v) + 4, class: "c-tick", "text-anchor": "end" }, String(v)));
      });
      chart.appendChild(svg("line", { x1: padL, x2: W - padR, y1: Y(state.params.lambda), y2: Y(state.params.lambda), class: "c-ref" }));
      chart.appendChild(svg("text", { x: W - padR, y: Y(state.params.lambda) - 4, class: "c-label", "text-anchor": "end" }, "lock-out λ = " + state.params.lambda));
      chart.appendChild(svg("text", { x: padL, y: padT - 10, class: "c-label" }, "Trust level T"));
      var barTop = midH + 8, barH = H - padB - barTop;
      chart.appendChild(svg("text", { x: padL - 6, y: barTop + 9, class: "c-tick", "text-anchor": "end" }, "a1"));
      chart.appendChild(svg("text", { x: padL - 6, y: barTop + barH / 2 + 9, class: "c-tick", "text-anchor": "end" }, "a2"));
      var path = "M" + padL + "," + Y(100);
      blocks.forEach(function (b, i) {
        var cx = padL + (i + 1) * bw;
        path += " L" + cx + "," + Y(b.T);
        var h1 = b.a1 * (barH / 2 - 2), h2 = b.a2 * (barH / 2 - 2);
        chart.appendChild(svg("rect", { x: padL + i * bw + 1, y: barTop + barH / 2 - 2 - h1, width: Math.max(1, bw - 2), height: h1, class: "sh-a1" }));
        chart.appendChild(svg("rect", { x: padL + i * bw + 1, y: barTop + barH - h2, width: Math.max(1, bw - 2), height: h2, class: "sh-a2" }));
        var hit = svg("rect", { x: padL + i * bw, y: padT, width: bw, height: H - padB - padT, class: "sh-col" + (i === selected ? " on" : ""), tabindex: "0", role: "button", "aria-label": "Block " + (i + 1) + ": rule " + b.rule + ", trust " + b.T.toFixed(1) });
        hit.addEventListener("click", function () { selected = i; changed("select"); });
        hit.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); selected = i; changed("select"); } });
        chart.insertBefore(hit, chart.firstChild);
      });
      chart.appendChild(svg("path", { d: path, class: "sh-trust" + (res && res.locked ? " locked" : "") }));
      blocks.forEach(function (b, i) {
        chart.appendChild(svg("circle", { cx: padL + (i + 1) * bw, cy: Y(b.T), r: i === selected ? 4 : 2.5, class: "sh-tdot" + (res.locked && i === blocks.length - 1 ? " locked" : "") }));
      });
      var tickEvery = nB > 40 ? 10 : nB > 20 ? 5 : 2;
      for (var k = tickEvery; k <= nB; k += tickEvery) chart.appendChild(svg("text", { x: padL + (k - 0.5) * bw, y: H - padB + 14, class: "c-tick", "text-anchor": "middle" }, String(k)));
      chart.appendChild(svg("text", { x: (padL + W - padR) / 2, y: H - 4, class: "c-label", "text-anchor": "middle" }, "Block of " + state.params.n + " keystrokes"));
      chart.setAttribute("aria-label", "Trust level over " + blocks.length + " blocks" + (res && res.locked ? ", locked out at block " + res.lockBlock : ""));
    }

    function update() {
      var res = session();
      var m = state.model;
      selfBtn.style.display = state.enrollSource === "sim" ? "" : "none";
      if (!res) {
        big.innerHTML = "Train first, or press <strong>Replay a simulated impostor</strong>";
        draw(null); drawRules(null);
        note.textContent = "";
        return;
      }
      var blocks = res.blocks, who = { you: "your typing", impostor: "simulated impostor", simself: "simulated typist, new session" }[state.testSource] || "no test typing yet";
      if (res.locked) big.innerHTML = "<strong>Locked out</strong> after " + plural(res.lockBlock, "block", "blocks") + " (" + res.lockBlock * state.params.n + " keystrokes) · " + who;
      else if (blocks.length) big.innerHTML = "Trust <strong>" + blocks[blocks.length - 1].T.toFixed(1) + "</strong> after " + plural(blocks.length, "block", "blocks") + " · " + who;
      else big.innerHTML = "Waiting for the first block of " + state.params.n + " keystrokes · " + who;
      var sel = selected >= 0 && blocks[selected] ? blocks[selected] : blocks[blocks.length - 1];
      draw(res);
      drawRules(sel);
      var trainedOn = state.enrollSource === "sim" ? "a simulated typist" : "your enrollment typing";
      var txt = "Trained on " + trainedOn + " (" + m.rows.length + " rows). ";
      if (sel) {
        var i = blocks.indexOf(sel);
        txt += "Block " + (i + 1) + ": classifier 1 flagged " + pct(sel.a1, 0) + " of rows as intruder, classifier 2 flagged " + pct(sel.a2, 0) + "; rule (" + sel.rule + ") changed the trust level by " + (sel.change >= 0 ? "+" : "") + sel.change.toFixed(2) + ". ";
      }
      if (state.testSource === "impostor" || state.testSource === "simself") txt += "Replayed keystrokes are simulated by this page, not data from the paper.";
      note.textContent = txt;
    }
    onChange(function (what) { if (what !== "level") update(); });
    resizers.push(update);
    update();
  }

  /* ------------------------------------------------------------ demo 4: results */

  function wilson(k, n) {
    var z = 1.959964, p = k / n, d = 1 + z * z / n;
    var c = (p + z * z / (2 * n)) / d, h = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / d;
    return [Math.max(0, c - h), Math.min(1, c + h)];
  }

  function mountResults(root) {
    var phase = "prompted";
    var phaseSeg = seg([{ value: "prompted", label: "Prompted typing" }, { value: "free", label: "Free use" }], phase, function (v) { phase = v; draw(); }, "Data collection phase");
    var chart = svg("svg", { class: "sh-results-chart", role: "img" });
    var cap = el("p", { class: "w-note" });
    var cmp = el("div", { class: "sh-table-wrap" });
    var extra = el("div", { "data-levels": "grad res" });
    root.appendChild(el("div", { class: "w-actions" }, [phaseSeg]));
    root.appendChild(chart);
    root.appendChild(cap);
    root.appendChild(cmp);
    root.appendChild(extra);

    function draw() {
      var d = ARXIV[phase];
      var W = chartWidth(chart), H = 210, padL = 42, padR = 12, padT = 16, padB = 34;
      chart.setAttribute("viewBox", "0 0 " + W + " " + H);
      chart.setAttribute("width", W);
      while (chart.firstChild) chart.removeChild(chart.firstChild);
      var maxV = 0.06;
      var Y = function (v) { return H - padB - v / maxV * (H - padT - padB); };
      [0, 0.02, 0.04, 0.06].forEach(function (v) {
        chart.appendChild(svg("line", { x1: padL, x2: W - padR, y1: Y(v), y2: Y(v), class: "c-grid" }));
        chart.appendChild(svg("text", { x: padL - 6, y: Y(v) + 4, class: "c-tick", "text-anchor": "end" }, Math.round(v * 100) + "%"));
      });
      var gw = (W - padL - padR) / ARXIV_BLOCKS.length, bw = Math.min(34, gw / 3);
      ARXIV_BLOCKS.forEach(function (n, i) {
        var cx = padL + (i + 0.5) * gw;
        [["far", "sh-far", -1], ["frr", "sh-frr", 1]].forEach(function (s) {
          var v = d[s[0]][i], x = cx + (s[2] < 0 ? -bw - 2 : 2);
          chart.appendChild(svg("rect", { x: x, y: Y(v), width: bw, height: Math.max(0.5, Y(0) - Y(v)), class: s[1] }));
          chart.appendChild(svg("text", { x: x + bw / 2, y: Y(v) - 4, class: "c-tick", "text-anchor": "middle" }, (v * 100).toFixed(v * 100 < 10 && v > 0 ? 2 : 1).replace(/\.?0+$/, "") + "%"));
        });
        chart.appendChild(svg("text", { x: cx, y: H - padB + 14, class: "c-tick", "text-anchor": "middle" }, n + " keys · " + d.blocks[i].toFixed(2) + " blocks"));
      });
      chart.appendChild(svg("rect", { x: padL + 4, y: padT - 10, width: 10, height: 10, class: "sh-far" }));
      chart.appendChild(svg("text", { x: padL + 18, y: padT - 1, class: "c-label" }, "False accept (FAR)"));
      chart.appendChild(svg("rect", { x: padL + 150, y: padT - 10, width: 10, height: 10, class: "sh-frr" }));
      chart.appendChild(svg("text", { x: padL + 164, y: padT - 1, class: "c-label" }, "False reject (FRR)"));
      chart.appendChild(svg("text", { x: (padL + W - padR) / 2, y: H - 4, class: "c-label", "text-anchor": "middle" }, "Block size, with the average number of blocks to a decision"));
      chart.setAttribute("aria-label", "False accept and false reject rates by block size, " + d.label + ", from Table " + (phase === "prompted" ? "1" : "2") + " of the 2019 arXiv paper");
      cap.textContent = d.label + ": Table " + (phase === "prompted" ? "1" : "2") + " of the arXiv paper (20 participants, one-class SVM with a 65% threshold, no trust model). Values are the paper's.";
    }

    function drawCompare() {
      cmp.innerHTML = "";
      var t = el("table", { class: "results-table sh-cmp" });
      t.appendChild(el("caption", { class: "w-note", text: "Free-text keystroke studies compared in the ICMLA paper (Table II). EER marks an equal error rate, where FAR and FRR are equal." }));
      t.appendChild(el("thead", null, [el("tr", null, [el("th", { text: "Study" }), el("th", { text: "Method" }), el("th", { text: "Users" }), el("th", { text: "Impostor data in training" }), el("th", { text: "FAR" }), el("th", { text: "FRR" })])]));
      var tb = el("tbody");
      TABLE2.forEach(function (r) {
        var f = function (v) { return (v * 100).toFixed(v < 0.001 ? 3 : 2) + "%"; };
        tb.appendChild(el("tr", { class: r.ours ? "on" : "" }, [el("td", { text: r.ref }), el("td", { text: r.method }), el("td", { class: "sh-num", text: String(r.n) }), el("td", { text: r.impostor }),
          el("td", { class: "sh-num", text: r.eer ? f(r.far) + " (EER)" : f(r.far) }), el("td", { class: "sh-num", text: r.eer ? f(r.frr) + " (EER)" : f(r.frr) })]));
      });
      t.appendChild(tb);
      cmp.appendChild(t);

      // graduate and researcher: counts and intervals computed by the page
      extra.innerHTML = "";
      var far = wilson(39, 1900), frr = wilson(2, 100);
      var t2 = el("table", { class: "results-table sh-ci" });
      t2.appendChild(el("caption", { class: "w-note", text: "Computed by this page, not reported in the papers: the trial counts the published rates imply, with 95% Wilson score intervals." }));
      t2.appendChild(el("thead", null, [el("tr", null, [el("th", { text: "Rate" }), el("th", { text: "Published" }), el("th", { text: "Implied count" }), el("th", { text: "95% interval" })])]));
      var tb2 = el("tbody");
      [
        ["ICMLA FAR", "2.05%", "39 of 1,900 impostor trials (20 users × 19 impostors × 5 folds)", far],
        ["ICMLA FRR", "2.00%", "2 of 100 genuine trials (20 users × 5 folds)", frr],
        ["ICMLA attempts", "12.78 blocks of 6", "76.7 keystrokes on average, under the abstract's 80", null],
        ["arXiv blocks to decide", "Tables 1 and 2", "Every average × 380 is a whole number (834, 1,014, 1,167, 1,130; 693, 865, 933, 978): 380 = 20 × 19 impostor pairs", null]
      ].forEach(function (r) {
        tb2.appendChild(el("tr", null, [el("td", { text: r[0] }), el("td", { class: "sh-num", text: r[1] }), el("td", { text: r[2] }), el("td", { class: "sh-num", text: r[3] ? pct(r[3][0]) + " to " + pct(r[3][1]) : "–" })]));
      });
      t2.appendChild(tb2);
      extra.appendChild(el("div", { class: "sh-table-wrap" }, [t2]));

      var t3 = el("table", { class: "results-table" });
      t3.appendChild(el("caption", { class: "w-note", text: "arXiv Table 3: random-segment validation with 80-key blocks." }));
      t3.appendChild(el("thead", null, [el("tr", null, [el("th", { text: "Phase" }), el("th", { text: "Folds" }), el("th", { text: "FAR" }), el("th", { text: "FRR" }), el("th", { text: "Average blocks" })])]));
      var tb3 = el("tbody");
      ARXIV_T3.forEach(function (r) { tb3.appendChild(el("tr", null, [el("td", { text: r.phase }), el("td", { class: "sh-num", text: String(r.folds) }), el("td", { class: "sh-num", text: pct(r.far) }), el("td", { class: "sh-num", text: pct(r.frr) }), el("td", { class: "sh-num", text: r.blocks.toFixed(4) })])); });
      t3.appendChild(tb3);
      extra.appendChild(el("div", { class: "sh-table-wrap" }, [t3]));
    }
    resizers.push(draw);
    draw();
    drawCompare();
  }

  /* ------------------------------------------------------------ mount */

  function mount(id, fn) {
    var root = document.getElementById(id);
    if (!root) return;
    fn(root);
    root.classList.add("w-ready");
  }
  mount("sh-rhythm", mountRhythm);
  mount("sh-enroll", mountEnroll);
  mount("sh-trust", mountTrust);
  mount("sh-results", mountResults);
})();

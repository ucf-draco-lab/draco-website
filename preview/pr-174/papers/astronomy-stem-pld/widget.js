/*
  Widget for /papers/astronomy-stem-pld/.
  Mount points in the page: #pl-design, #pl-sky, #pl-gains, #pl-feel, #pl-class.

  Demo 1 (Three summers) draws Table 2's three designs and Table 1's participants.
  Demo 2 (Star or quasar) is the one demo of the astronomy itself: a simulated
  color-color plot, standing in for the SDSS point-source work in the 2016 space
  session. It is illustrative and labeled simulated.
  Demo 3 (What teachers learned) draws Table 4, the 2014 MOSART scores, and the
  2016 space-session item; at the graduate and researcher levels it adds the
  matched-pair arithmetic that reproduces p = 0.0244 and d = 0.15, and the
  pairings behind the 15-to-90 percent item.
  Demo 4 (How teachers felt) draws Section 6.2's ratings and rebuilds the
  space-session mean (1.95) from its printed percentages.
  Demo 5 (From plan to classroom) draws Section 6.3, Table 8, and Table 10.
  Demos 1, 4, and 5 share one selected cohort (state.year).
  All arithmetic lives in pld-engine.js; values marked "page" are the page's own.
*/
(function () {
  "use strict";

  var E = window.PldEngine;
  var D = E.DATA;
  var SVGNS = "http://www.w3.org/2000/svg";
  var state = { year: "2016", gains: "2015", seed: 2016, cut: 1.6, reveal: false, pairing: 0, classView: "observed" };

  /* ---------------------------------------------------------------- helpers */

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
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function chartWidth(node) {
    var w = node && node.clientWidth ? node.clientWidth : 640;
    return Math.max(300, Math.min(760, w));
  }
  function fix(x, d) { return Number(x).toFixed(d).replace(/^-/, "−"); }
  function sci(p) {
    if (p >= 0.001) return fix(p, 4);
    var e = Math.floor(Math.log(p) / Math.LN10), m = p / Math.pow(10, e);
    return fix(m, 1) + " × 10<sup>" + String(e).replace("-", "−") + "</sup>";
  }
  var WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
  function words(n) { return n < 10 ? WORDS[n] : String(n); }
  function cap(t) { return t.charAt(0).toUpperCase() + t.slice(1); }
  function yearOf(id) { return D.years.filter(function (y) { return y.id === id; })[0]; }
  function currentLevel() {
    if (window.PaperKit && window.PaperKit.level) return window.PaperKit.level();
    var a = document.querySelector(".paper[data-level]");
    return a ? a.getAttribute("data-level") : "public";
  }

  var redraws = [];
  var resizeTimer = null;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () { redraws.forEach(function (fn) { fn(); }); }, 150);
  });
  document.addEventListener("paperlevel", function () {
    setTimeout(function () { redraws.forEach(function (fn) { fn(); }); }, 0);
  });

  function segmented(label, options, value, onChange) {
    var wrap = el("div", { class: "seg", role: "radiogroup", "aria-label": label });
    var buttons = options.map(function (opt) {
      var attrs = { type: "button", class: "seg-option", role: "radio", "data-value": String(opt.value), text: opt.label };
      if (opt.levels) attrs["data-levels"] = opt.levels;
      var b = el("button", attrs);
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

  var yearControls = [], yearDraws = [];
  function setYear(v) {
    state.year = v;
    yearControls.forEach(function (c) { c.set(v); });
    yearDraws.forEach(function (fn) { fn(); });
  }
  function yearControl() {
    var c = segmented("Cohort", D.years.map(function (y) { return { value: y.id, label: y.name + " (" + y.n + ")" }; }), state.year, setYear);
    yearControls.push(c);
    return c;
  }

  // A horizontal 100 percent stacked bar with labeled segments.
  function stackRow(g, x0, y, w, h, parts, classes) {
    var total = parts.reduce(function (a, p) { return a + p.v; }, 0), x = x0;
    parts.forEach(function (p, i) {
      if (!p.v) return;
      var pw = w * p.v / total;
      g.appendChild(svg("rect", { x: x, y: y, width: Math.max(0, pw - 1), height: h, class: classes[i % classes.length] }));
      if (pw > 22) g.appendChild(svg("text", { x: x + pw / 2, y: y + h / 2 + 4, "text-anchor": "middle", class: "pl-inbar" }, String(p.v)));
      x += pw;
    });
  }

  /* ---------------------------------------------------- demo 1: three summers */

  function mountDesign(root) {
    var ctrl = yearControl();
    var dayWrap = el("div", { class: "pl-chart" });
    var rows = el("div", { class: "pl-rows" });
    var demoWrap = el("div", { class: "pl-chart" });
    var legend = el("div", { class: "c-legend" });
    var src = el("p", { class: "w-source", text: "Source: Table 2 (design) and Table 1 (participants). Every value is printed in the paper." });
    [el("div", { class: "w-actions" }, [ctrl]), dayWrap, rows, el("p", { class: "w-note pl-sub", text: "Who came" }), demoWrap, legend, src].forEach(function (n) { root.appendChild(n); });

    function drawDay(y) {
      var W = chartWidth(dayWrap), L = 8, R = W - 8, H = 70;
      var s = svg("svg", { viewBox: "0 0 " + W + " " + H, class: "pl-svg", role: "img",
        "aria-label": "An eight-hour day: " + y.day.scheduled + " hours of " + y.day.scheduledLabel.toLowerCase() + " and " + y.day.collab + " hours of " + y.day.collabLabel.toLowerCase() + "." });
      var unit = (R - L) / 8;
      var first = y.id === "2015" ? [{ h: y.day.collab, lab: y.day.collabLabel, c: "pl-collab" }, { h: y.day.scheduled, lab: y.day.scheduledLabel, c: "pl-sched" }]
        : [{ h: y.day.scheduled, lab: y.day.scheduledLabel, c: "pl-sched" }, { h: y.day.collab, lab: y.day.collabLabel, c: "pl-collab" }];
      var x = L;
      first.forEach(function (seg) {
        var w = unit * seg.h;
        s.appendChild(svg("rect", { x: x, y: 20, width: w - 1, height: 26, class: seg.c }));
        s.appendChild(svg("text", { x: x + 6, y: 37, class: "pl-inbar", "text-anchor": "start" }, "≈" + seg.h + " h"));
        s.appendChild(svg("text", { x: x, y: 62, class: "c-label" }, seg.lab.length * 6.2 > w && w < 160 ? seg.lab.split(" ")[0] + "…" : seg.lab));
        x += w;
      });
      for (var h = 0; h <= 8; h += 2) {
        s.appendChild(svg("text", { x: L + unit * h, y: 13, class: "c-tick", "text-anchor": h === 0 ? "start" : h === 8 ? "end" : "middle" }, h + " h"));
      }
      dayWrap.innerHTML = "";
      dayWrap.appendChild(el("p", { class: "w-note pl-sub", text: "One day of the two-week summer session (8 hours)" }));
      dayWrap.appendChild(s);
    }

    function drawRows(y) {
      var dots = "";
      var shown = Math.min(y.present.outsiders, 16);
      for (var i = 0; i < shown; i++) dots += "<span class=\"pl-dot\" aria-hidden=\"true\"></span>";
      var html = [
        ["Goal", y.goal],
        ["Emphasis", y.emphasis],
        ["Biggest change", y.change],
        ["Data work", y.data],
        ["Sharing results", y.present.label + "; " + y.present.outsidersText + (shown ? " <span class=\"pl-dots\">" + dots + (y.present.outsiders > 15 ? "+" : "") + "</span>" : "")],
        ["Example projects", y.examples.join("; ")],
        ["What teachers still needed", "<strong>" + y.need + "</strong>"]
      ].map(function (r) { return "<div class=\"pl-row\"><div class=\"pl-k\">" + r[0] + "</div><div class=\"pl-v\">" + r[1] + "</div></div>"; }).join("");
      rows.innerHTML = html;
    }

    function drawDemo(y) {
      var W = chartWidth(demoWrap), lab = W < 420 ? 74 : 110, L = lab, R = W - 8, rowH = 24, gap = 16;
      var groups = [
        { name: "Teaching level", parts: y.level, names: D.levelNames },
        { name: "Primary subject", parts: y.subject, names: D.subjectNames },
        { name: "Gender", parts: y.gender, names: D.genderNames }
      ];
      var H = groups.length * (rowH + gap) + 4;
      var s = svg("svg", { viewBox: "0 0 " + W + " " + H, class: "pl-svg", role: "img",
        "aria-label": y.name + " participants by teaching level, subject, and gender (Table 1)." });
      var classes = ["pl-c1", "pl-c2", "pl-c3", "pl-c4", "pl-c5"];
      groups.forEach(function (gr, i) {
        var yy = i * (rowH + gap) + 4;
        s.appendChild(svg("text", { x: 0, y: yy + rowH / 2 + 4, class: "c-label" }, W < 420 ? gr.name.split(" ").pop() : gr.name));
        stackRow(s, L, yy, R - L, rowH, gr.parts.map(function (v) { return { v: v }; }), classes);
      });
      demoWrap.innerHTML = "";
      demoWrap.appendChild(s);
      legend.innerHTML = groups.map(function (gr) {
        return "<span class=\"pl-lg-group\">" + gr.name + ": " + gr.names.map(function (n, i) {
          return "<span class=\"pl-lg\"><span class=\"pl-sw " + classes[i] + "\"></span>" + n + " " + gr.parts[i] + "</span>";
        }).join(" ") + "</span>";
      }).join("");
    }

    function draw() { var y = yearOf(state.year); drawDay(y); drawRows(y); drawDemo(y); }
    yearDraws.push(draw);
    redraws.push(draw);
    draw();
  }

  /* --------------------------------------------------- demo 2: star or quasar */

  function mountSky(root) {
    var NS = 60, NQ = 20;
    var pts = E.simulateSky(state.seed, NS, NQ);
    var chart = el("div", { class: "pl-chart" });
    var slider = el("input", { type: "range", min: "0", max: "3", step: "0.05", value: String(state.cut), "aria-label": "Quasar cut on u minus g color", class: "pl-range" });
    var cutLabel = el("span", { class: "w-mono" });
    var revealBtn = el("button", { type: "button", class: "w-btn", text: "Reveal which are quasars" });
    var ruleBtn = el("button", { type: "button", class: "w-btn pl-ghost", text: "Use u − g < 0.6" });
    var newBtn = el("button", { type: "button", class: "w-btn pl-ghost", text: "New sky" });
    var readout = el("div", { class: "pl-readout" });
    var note = el("p", { class: "w-note", text: "Simulated point sources (" + NS + " stars and " + NQ + " quasars) with illustrative colors. These are not SDSS measurements and not data from the paper." });
    [el("div", { class: "w-actions" }, [el("label", { class: "w-mono", text: "Call it a quasar when u − g is below" }), slider, cutLabel]),
      el("div", { class: "w-actions" }, [revealBtn, ruleBtn, newBtn]), chart, readout, note].forEach(function (n) { root.appendChild(n); });

    function draw() {
      var W = chartWidth(chart), L = 42, R = W - 10, T = 10, B = 236, H = 268;
      var xmin = -0.4, xmax = 3.2, ymin = -0.3, ymax = 1.8;
      function X(v) { return L + (R - L) * (v - xmin) / (xmax - xmin); }
      function Y(v) { return B - (B - T) * (v - ymin) / (ymax - ymin); }
      var s = svg("svg", { viewBox: "0 0 " + W + " " + H, class: "pl-svg", role: "img",
        "aria-label": "Color-color plot of simulated point sources, u minus g across, g minus r up, with a vertical cut at u minus g equals " + fix(state.cut, 2) + "." });
      [0, 1, 2, 3].forEach(function (v) {
        s.appendChild(svg("line", { x1: X(v), x2: X(v), y1: T, y2: B, class: "c-grid" }));
        s.appendChild(svg("text", { x: X(v), y: B + 16, "text-anchor": "middle", class: "c-tick" }, String(v)));
      });
      [0, 0.5, 1, 1.5].forEach(function (v) {
        s.appendChild(svg("line", { x1: L, x2: R, y1: Y(v), y2: Y(v), class: "c-grid" }));
        s.appendChild(svg("text", { x: L - 6, y: Y(v) + 4, "text-anchor": "end", class: "c-tick" }, fix(v, 1)));
      });
      s.appendChild(svg("text", { x: (L + R) / 2, y: H - 2, "text-anchor": "middle", class: "c-label" }, "u − g (ultraviolet minus green; smaller is bluer)"));
      s.appendChild(svg("text", { x: 4, y: T + 4, class: "c-label", transform: "rotate(90 4 " + (T + 4) + ")" }, "g − r"));
      s.appendChild(svg("rect", { x: X(xmin), y: T, width: Math.max(0, X(state.cut) - X(xmin)), height: B - T, class: "pl-zone" }));
      pts.forEach(function (p) {
        var cls = state.reveal ? (p.q ? "pl-qso" : "pl-star") : "pl-unknown";
        var called = p.ug < state.cut;
        if (state.reveal && called !== p.q) cls += " pl-wrong";
        var cx = Math.max(L, Math.min(R, X(p.ug))), cy = Math.max(T, Math.min(B, Y(p.gr)));
        if (state.reveal && p.q) s.appendChild(svg("rect", { x: cx - 4, y: cy - 4, width: 8, height: 8, class: cls }));
        else s.appendChild(svg("circle", { cx: cx, cy: cy, r: 4, class: cls }));
      });
      s.appendChild(svg("line", { x1: X(state.cut), x2: X(state.cut), y1: T, y2: B, class: "pl-cut" }));
      chart.innerHTML = "";
      chart.appendChild(s);
      cutLabel.textContent = fix(state.cut, 2);
      var sc = E.scoreCut(pts, state.cut);
      var called = sc.tp + sc.fp;
      if (!state.reveal) {
        readout.innerHTML = "<p class=\"w-big\">The cut calls <strong>" + called + "</strong> of " + (NS + NQ) + " points quasars. Press <em>Reveal</em> to score it.</p>";
      } else {
        readout.innerHTML = "<p class=\"w-big\">Found <strong>" + sc.tp + " of " + NQ + "</strong> quasars, with " + sc.fp + " star" + (sc.fp === 1 ? "" : "s") + " mistaken for quasars.</p>" +
          "<p class=\"w-note\" data-levels=\"ug grad res\">Completeness " + fix(100 * sc.tp / NQ, 0) + "% (quasars found ÷ quasars present); purity " + (called ? fix(100 * sc.tp / called, 0) + "%" : "undefined") + " (quasars found ÷ points called quasars). Squares are quasars; outlined marks are the cut's mistakes.</p>";
      }
      revealBtn.textContent = state.reveal ? "Hide answers" : "Reveal which are quasars";
    }
    slider.addEventListener("input", function () { state.cut = Number(slider.value); draw(); });
    revealBtn.addEventListener("click", function () { state.reveal = !state.reveal; draw(); });
    ruleBtn.addEventListener("click", function () { state.cut = 0.6; slider.value = "0.6"; draw(); });
    newBtn.addEventListener("click", function () { state.seed += 1; pts = E.simulateSky(state.seed, NS, NQ); state.reveal = false; draw(); });
    redraws.push(draw);
    draw();
  }

  /* --------------------------------------------- demo 3: what teachers learned */

  function mountGains(root) {
    var ctrl = segmented("Measure", [
      { value: "2015", label: "2015 topics" },
      { value: "mosart", label: "2014 MOSART" },
      { value: "space", label: "2016 space session" },
      { value: "pairs", label: "Matched pairs", levels: "grad res" }
    ], state.gains, function (v) { state.gains = v; draw(); });
    var body = el("div", { class: "pl-gbody" });
    [el("div", { class: "w-actions" }, [ctrl]), body].forEach(function (n) { root.appendChild(n); });

    function topics() {
      var W = chartWidth(body), lab = W < 460 ? 150 : 260, L = lab, R = W - 60, rowH = 22, gap = 10;
      var H = D.t4_2015.length * (rowH + gap) + 24;
      var s = svg("svg", { viewBox: "0 0 " + W + " " + H, class: "pl-svg", role: "img",
        "aria-label": "Table 4, 2015 LASSI: seven content topics, five with significant pre-to-post gains, with the share of technical questions for each." });
      s.appendChild(svg("text", { x: L, y: 10, class: "c-tick" }, "technical"));
      s.appendChild(svg("text", { x: R, y: 10, class: "c-tick", "text-anchor": "end" }, "conceptual"));
      D.t4_2015.forEach(function (t, i) {
        var y = 18 + i * (rowH + gap);
        var name = t.topic;
        if (W < 460 && name.length > 24) name = name.slice(0, 23) + "…";
        s.appendChild(svg("text", { x: 0, y: y + rowH / 2 + 4, class: "c-label" }, name));
        var tw = (R - L) * t.tech / 100;
        s.appendChild(svg("rect", { x: L, y: y, width: tw - 1, height: rowH, class: "pl-tech" }));
        s.appendChild(svg("rect", { x: L + tw, y: y, width: (R - L) - tw, height: rowH, class: "pl-concept" }));
        s.appendChild(svg("text", { x: L + 6, y: y + rowH / 2 + 4, class: "pl-inbar" }, t.tech + ":" + (100 - t.tech)));
        s.appendChild(svg("text", { x: R + 6, y: y + rowH / 2 + 4, class: t.sig ? "pl-sig" : "c-tick" }, t.sig ? "p < .0001" : "n.s."));
      });
      var sig = D.t4_2015.filter(function (t) { return t.sig; }).length;
      body.innerHTML = "";
      body.appendChild(s);
      body.appendChild(el("p", { class: "w-big", html: "Scores rose significantly on <strong>" + words(sig) + " of " + words(D.t4_2015.length) + "</strong> topics (21 of 22 teachers tested, three to five questions per topic)." }));
      body.appendChild(el("p", { class: "w-note", html: "Bars show each topic's split of technical to conceptual questions. 2016 RAMPED's space session asked three questions (" + D.t4_2016.tech + ":" + (100 - D.t4_2016.tech) + "), and " + words(D.t4_2016.sig) + " of them rose significantly." }));
      body.appendChild(el("p", { class: "w-source", text: "Source: Table 4 and Section 6.1. The paper treats p above 0.001 as not significant." }));
    }

    function dotRow(s, y, label, scores, max, W, L, R) {
      s.appendChild(svg("text", { x: 0, y: y + 4, class: "c-label" }, label));
      s.appendChild(svg("line", { x1: L, x2: R, y1: y, y2: y, class: "c-grid" }));
      for (var v = 0; v <= max; v++) {
        if (max > 6 && v % 2) continue;
        s.appendChild(svg("text", { x: L + (R - L) * v / max, y: y + 18, "text-anchor": "middle", class: "c-tick" }, String(v)));
      }
      var seen = {};
      scores.forEach(function (sc) {
        seen[sc] = (seen[sc] || 0) + 1;
        s.appendChild(svg("circle", { cx: L + (R - L) * sc / max, cy: y - 2 - (seen[sc] - 1) * 10, r: 4.5, class: "pl-person" }));
      });
    }
    function mosart() {
      var W = chartWidth(body), L = W < 460 ? 92 : 150, R = W - 14, H = 150;
      var m = D.mosart2014;
      var s = svg("svg", { viewBox: "0 0 " + W + " " + H, class: "pl-svg", role: "img",
        "aria-label": "2014 LASSI MOSART: written items scored out of 12 for seven teachers, drawing items out of five for eight teachers." });
      dotRow(s, 60, W < 460 ? "Written /12" : "Written items (of 12)", m.written.scores, m.written.max, W, L, R);
      dotRow(s, 124, W < 460 ? "Drawing /5" : "Drawing items (of 5)", m.drawing.scores, m.drawing.max, W, L, R);
      body.innerHTML = "";
      body.appendChild(s);
      body.appendChild(el("p", { class: "w-big", html: "<strong>" + words(m.eccentricity.held) + " of " + words(m.eccentricity.of) + "</strong> teachers held a misconception about how stretched Earth's orbit is; the most common one concerned where stars get their energy." }));
      body.appendChild(el("p", { class: "w-note", text: "Each dot is one teacher's score, as listed in Section 6.1. The written row lists seven scores and the drawing row eight." }));
      body.appendChild(el("p", { class: "w-source", text: "Source: Section 6.1 (MOSART, the Misconceptions-Oriented Standards-Based Assessment Resources for Teachers)." }));
    }

    function grid(s, x0, y0, n, filled, cols, size, filledCls, label) {
      for (var i = 0; i < n; i++) {
        var cx = x0 + (i % cols) * (size + 4), cy = y0 + Math.floor(i / cols) * (size + 4);
        s.appendChild(svg("rect", { x: cx, y: cy, width: size, height: size, class: i < filled ? filledCls : "pl-empty" }));
      }
      s.appendChild(svg("text", { x: x0, y: y0 - 8, class: "c-label" }, label));
    }
    function space() {
      var W = chartWidth(body), sp = D.space, n = sp.attended;
      var pre = Math.round(sp.pre * n / 100), post = Math.round(sp.post * n / 100);
      var size = W < 420 ? 14 : 18, cols = 10, gw = cols * (size + 4);
      var twoUp = W >= 2 * gw + 40;
      var H = twoUp ? 90 : 170;
      var s = svg("svg", { viewBox: "0 0 " + W + " " + H, class: "pl-svg", role: "img",
        "aria-label": "Of 20 space-session teachers, 3 identified astronomy data repositories before (15 percent) and 18 after (90 percent)." });
      grid(s, 0, 24, n, pre, cols, size, "pl-before", "Before: " + sp.pre + "%");
      if (twoUp) grid(s, gw + 30, 24, n, post, cols, size, "pl-after", "After: " + sp.post + "%");
      else grid(s, 0, 104, n, post, cols, size, "pl-after", "After: " + sp.post + "%");
      body.innerHTML = "";
      body.appendChild(s);
      body.appendChild(el("p", { class: "w-big", html: "Teachers who could name where astronomers publish their data: <strong>" + sp.pre + "% → " + sp.post + "%</strong> (paper: p " + sp.pPrinted.replace("<", "&lt;") + ")." }));
      body.appendChild(el("p", { class: "w-note", text: "Squares assume the 20 teachers who attended the space session; 15 and 90 percent are exactly 3 and 18 of 20. The paper does not print the number tested." }));

      // Graduate and researcher: what pairing allows.
      var pairs = E.mcnemarPairings(n, pre, post);
      var adv = el("div", { "data-levels": "grad res", class: "pl-adv" });
      var pctl = segmented("Pairing", pairs.map(function (p, i) { return { value: i, label: p.c ? p.c + " lost" : "no one lost it" }; }), state.pairing, function (v) { state.pairing = Number(v); drawPairs(); });
      var out = el("div");
      adv.appendChild(el("p", { class: "w-note pl-sub", text: "Computed by the page: the same 20 people, paired" }));
      adv.appendChild(el("div", { class: "w-actions" }, [pctl]));
      adv.appendChild(out);
      body.appendChild(adv);
      function drawPairs() {
        var p = pairs[state.pairing];
        var f = E.fisher2x2(pre, n - pre, post, n - post), z = E.twoPropZ(pre, n, post, n);
        out.innerHTML = "<table class=\"pl-table\"><thead><tr><th>Test (page)</th><th>Treats the data as</th><th>p</th></tr></thead><tbody>" +
          "<tr><td>Exact McNemar</td><td>Paired: " + p.b + " gained, " + p.c + " lost, " + p.both + " right both times, " + p.neither + " wrong both times</td><td>" + sci(p.p) + "</td></tr>" +
          "<tr><td>Fisher's exact</td><td>Two independent groups of 20</td><td>" + sci(f) + "</td></tr>" +
          "<tr><td>Two-proportion z</td><td>Two independent groups of 20 (z = " + fix(z.z, 2) + ")</td><td>" + sci(z.p) + "</td></tr>" +
          "</tbody></table>" +
          "<p class=\"w-note\">With 20 people, every pairing consistent with 3 and 18 gives a paired p of at least " + sci(pairs[0].p) + ", above the printed 0.00001; the unpaired tests fall below it.</p>";
      }
      drawPairs();
      body.appendChild(el("p", { class: "w-source", text: "Source: Section 6.1. The tests in the shaded block are the page's, not the paper's." }));
    }

    function pairsView() {
      var m = D.mosart2016;
      var form = el("div", { class: "w-actions" });
      function num(label, v, step) {
        var i = el("input", { type: "number", value: String(v), step: String(step), class: "pl-num", "aria-label": label });
        form.appendChild(el("label", { class: "w-mono" }, [label + " ", i]));
        i.addEventListener("input", calc);
        return i;
      }
      var ti = num("t", m.t, 0.01), ni = num("n", m.n, 1), ri = num("r", m.r, 0.01);
      var reset = el("button", { type: "button", class: "w-btn pl-ghost", text: "Paper's values" });
      form.appendChild(reset);
      var out = el("div");
      body.innerHTML = "";
      body.appendChild(el("p", { class: "w-note", text: "2016 RAMPED pooled MOSART items, matched pairs: the paper prints t = 2.38, p = 0.0244, r = 0.94, and an effect size of 0.15, with 29 of 30 teachers in the sample." }));
      body.appendChild(form);
      body.appendChild(out);
      body.appendChild(el("p", { class: "w-source", text: "Source: Section 6.1 and Table 3. p, d_z, and d_av are computed by the page." }));
      function calc() {
        var t = Number(ti.value), n = Math.round(Number(ni.value)), r = Number(ri.value);
        if (!(n >= 2) || !(r > -1 && r < 1) || !isFinite(t)) { out.innerHTML = "<p class=\"w-note\">Enter t, n of at least 2, and r between −1 and 1.</p>"; return; }
        var q = E.pairedFromT(Math.abs(t), n, r);
        var isPaper = Math.abs(t - m.t) < 1e-9 && n === m.n && Math.abs(r - m.r) < 1e-9;
        out.innerHTML = "<table class=\"pl-table\"><thead><tr><th>Quantity</th><th>Page</th><th>Paper</th></tr></thead><tbody>" +
          "<tr><td>Two-sided p, t(" + q.df + ")</td><td>" + sci(q.p) + "</td><td>" + (isPaper ? "0.0244" : "—") + "</td></tr>" +
          "<tr><td>d<sub>z</sub> = t ÷ √n (change ÷ SD of change)</td><td>" + fix(q.dz, 3) + "</td><td>—</td></tr>" +
          "<tr><td>d<sub>av</sub> = d<sub>z</sub> × √(2(1 − r)) (change ÷ average SD)</td><td>" + fix(q.dav, 3) + "</td><td>" + (isPaper ? "0.15" : "—") + "</td></tr>" +
          "</tbody></table>" +
          (isPaper ? "<p class=\"w-big\">With n = 29, both printed values reproduce: p = <strong>" + fix(q.p, 4) + "</strong> and d<sub>av</sub> = <strong>" + fix(q.dav, 2) + "</strong>.</p>" : "");
      }
      reset.addEventListener("click", function () { ti.value = m.t; ni.value = m.n; ri.value = m.r; calc(); });
      calc();
    }

    function draw() {
      var lvl = currentLevel();
      if (state.gains === "pairs" && !(lvl === "grad" || lvl === "res")) { state.gains = "2015"; ctrl.set("2015"); }
      if (state.gains === "2015") topics();
      else if (state.gains === "mosart") mosart();
      else if (state.gains === "space") space();
      else pairsView();
    }
    redraws.push(function () { if (state.gains !== "pairs") draw(); else { var l = currentLevel(); if (!(l === "grad" || l === "res")) draw(); } });
    draw();
  }

  /* ------------------------------------------------ demo 4: how teachers felt */

  function mountFeel(root) {
    var chart = el("div", { class: "pl-chart" });
    var useWrap = el("div", { class: "pl-chart" });
    var readout = el("div");
    var src = el("p", { class: "w-source", text: "Source: Section 6.2. Bars are scaled to each item's own maximum; the 1.95 rebuild and the intervals are the page's." });
    [chart, el("p", { class: "w-note pl-sub", text: "2016 space session: how useful was it? (20 attended)" }), useWrap, readout, src].forEach(function (n) { root.appendChild(n); });

    function draw() {
      var W = chartWidth(chart), narrow = true, L = 0, R = W - 60, rowH = 12;
      var items = D.perceptions;
      var per = narrow ? 58 : 40;
      var H = items.length * per + 8;
      var s = svg("svg", { viewBox: "0 0 " + W + " " + H, class: "pl-svg", role: "img",
        "aria-label": "Teacher ratings by cohort: 2015 quality 2.32 to 3.67 of 4; just right 41 to 76 percent; 2016 satisfied 93 to 97 percent; recommend 8.86 to 9.07 of 10; 2014 classroom impact 64 percent." });
      items.forEach(function (it, i) {
        var y0 = 6 + i * per;
        var labelY = narrow ? y0 + 10 : y0 + 16;
        var barY = narrow ? y0 + 16 : y0 + 4;
        var txt = it.year + " · " + it.what;
        s.appendChild(svg("text", { x: 0, y: labelY, class: "c-label" }, txt));
        var bx = narrow ? L : L, bw = R - bx;
        if (it.kind === "pct") {
          var x = bx;
          it.parts.forEach(function (p, k) {
            var w = bw * p[1] / 100;
            s.appendChild(svg("rect", { x: x, y: barY, width: w - 1, height: rowH * 2 + 2, class: k ? "pl-after" : "pl-before" }));
            x += w;
          });
          s.appendChild(svg("rect", { x: x, y: barY, width: bx + bw - x, height: rowH * 2 + 2, class: "pl-track" }));
          s.appendChild(svg("text", { x: R + 6, y: barY + rowH + 4, class: "pl-val" }, it.value + "%"));
        } else {
          var max = it.kind === "scale" ? it.max : 100;
          [it.w1, it.w2].forEach(function (v, k) {
            var yy = barY + k * (rowH + 2);
            s.appendChild(svg("rect", { x: bx, y: yy, width: bw, height: rowH, class: "pl-track" }));
            s.appendChild(svg("rect", { x: bx, y: yy, width: bw * v / max, height: rowH, class: k ? "pl-after" : "pl-before" }));
            s.appendChild(svg("text", { x: R + 6, y: yy + rowH - 2, class: "pl-val" }, (it.kind === "scale" ? fix(v, 2) : v + "%")));
          });
        }
      });
      chart.innerHTML = "";
      chart.appendChild(s);
      chart.appendChild(el("div", { class: "c-legend", html: "<span class=\"pl-lg\"><span class=\"pl-sw pl-before\"></span>End of week one</span><span class=\"pl-lg\"><span class=\"pl-sw pl-after\"></span>End of week two</span><span class=\"pl-lg\">2014 bar: \"quite a bit\" 45% plus \"very much\" 19%</span>" }));

      // Usefulness histogram and the 1.95 rebuild.
      var u = D.usefulness, counts = E.countsFromPct(u.pct, u.attended), m = E.meanOfCounts(counts);
      var UW = chartWidth(useWrap), UL = 8, UR = UW - 8, UH = 156, base = 122, top = 34;
      var us = svg("svg", { viewBox: "0 0 " + UW + " " + UH, class: "pl-svg", role: "img",
        "aria-label": "Space session usefulness: not at all 1, small extent 4, moderate 9, large 5, of 20 attendees; one did not answer." });
      var bw2 = (UR - UL) / 4, maxC = 10;
      counts.forEach(function (c, i) {
        var h = (base - top) * c / maxC, x = UL + i * bw2 + 6;
        us.appendChild(svg("rect", { x: x, y: base - h, width: bw2 - 12, height: h, class: i >= 2 ? "pl-after" : "pl-before" }));
        us.appendChild(svg("text", { x: x + (bw2 - 12) / 2, y: base - h - 4, "text-anchor": "middle", class: "pl-val" }, c + " (" + u.pct[i] + "%)"));
        us.appendChild(svg("text", { x: x + (bw2 - 12) / 2, y: base + 16, "text-anchor": "middle", class: "c-tick" }, UW < 420 ? String(i) : i + " · " + u.labels[i]));
      });
      us.appendChild(svg("line", { x1: UL, x2: UR, y1: base, y2: base, class: "c-grid" }));
      var mx = UL + (UR - UL) * (m.mean + 0.5) / 4;
      us.appendChild(svg("line", { x1: mx, x2: mx, y1: 16, y2: base, class: "pl-mean" }));
      us.appendChild(svg("text", { x: mx + 4, y: 12, class: "pl-val" }, "mean " + fix(m.mean, 2) + " (page)"));
      useWrap.innerHTML = "";
      useWrap.appendChild(us);

      var w93 = E.wilson(28, 30), w97 = E.wilson(29, 30), w70 = E.wilson(14, 20);
      readout.innerHTML =
        "<p class=\"w-big\">Fourteen of the 20 found the space session moderately or largely useful. Scoring the answers 0 to 3, the page's rebuilt mean is <strong>" + fix(m.mean, 2) + "</strong> over the " + m.n + " who answered; the paper prints " + fix(u.meanPrinted, 2) + ".</p>" +
        "<p class=\"w-note\" data-levels=\"ug grad res\">The printed percentages are of all 20 attendees (5, 20, 45, and 25 percent are 1, 4, 9, and 5 people), which leaves one attendee without an answer. The mean reproduces only when that person is left out: over 20 it would be " + fix(37 / 20, 2) + ".</p>" +
        "<p class=\"w-note\" data-levels=\"grad res\">95% Wilson intervals (page): satisfied at week one 28 of 30, " + fix(100 * w93.lo, 0) + "–" + fix(100 * w93.hi, 0) + "%; week two 29 of 30, " + fix(100 * w97.lo, 0) + "–" + fix(100 * w97.hi, 0) + "%; space session moderately or largely useful 14 of 20, " + fix(100 * w70.lo, 0) + "–" + fix(100 * w70.hi, 0) + "%. Counts are inferred from the printed percentages and cohort sizes. The two week-one and week-two intervals overlap almost entirely.</p>";
    }
    redraws.push(draw);
    draw();
  }

  /* --------------------------------------------- demo 5: from plan to classroom */

  function mountClass(root) {
    var plans = el("div", { class: "pl-chart" });
    var ctrl = segmented("2016 RAMPED view", [
      { value: "observed", label: "Observed lessons" },
      { value: "plans", label: "Planning statements" }
    ], state.classView, function (v) { state.classView = v; drawGrid(); });
    var gridWrap = el("div", { class: "pl-chart" });
    var gridNote = el("p", { class: "w-big" });
    var t10 = el("div", { class: "pl-rows" });
    var src = el("p", { class: "w-source", text: "Source: Table 8 (lesson plan topics), Section 6.3 (planning and observations), Table 10 (observed lessons), and the Discussion." });
    [el("p", { class: "w-note pl-sub", text: "Science lesson plans that used astronomy" }), plans,
      el("p", { class: "w-note pl-sub", text: "2016 RAMPED, 30 teachers" }), el("div", { class: "w-actions" }, [ctrl]), gridWrap, gridNote,
      el("p", { class: "w-note pl-sub", text: "The seven observed lessons that used astronomy (Table 10)" }), t10, src].forEach(function (n) { root.appendChild(n); });

    function drawPlans() {
      var W = chartWidth(plans), L = 92, R = W - 70, rowH = 20, gap = 10;
      var H = D.lessonTopics.length * (rowH + gap) + 4;
      var s = svg("svg", { viewBox: "0 0 " + W + " " + H, class: "pl-svg", role: "img",
        "aria-label": "Astronomy in science lesson plans: 5 of 6 in 2014, 13 of 16 in 2015, 8 of 15 in 2016." });
      D.lessonTopics.forEach(function (lt, i) {
        var y = 2 + i * (rowH + gap);
        var sel = lt.year === state.year;
        s.appendChild(svg("text", { x: 0, y: y + rowH / 2 + 4, class: sel ? "c-label pl-strong" : "c-label" }, yearOf(lt.year).name));
        s.appendChild(svg("rect", { x: L, y: y, width: R - L, height: rowH, class: "pl-track" }));
        s.appendChild(svg("rect", { x: L, y: y, width: (R - L) * lt.astro / lt.of, height: rowH, class: sel ? "pl-after" : "pl-before" }));
        s.appendChild(svg("text", { x: R + 6, y: y + rowH / 2 + 4, class: "pl-val" }, lt.astro + " of " + lt.of));
      });
      plans.innerHTML = "";
      plans.appendChild(s);
      var cur = D.lessonTopics.filter(function (lt) { return lt.year === state.year; })[0];
      plans.appendChild(el("p", { class: "w-note", text: yearOf(state.year).name + ": " + cur.note.toLowerCase() + " across all lesson plans. Choose a cohort in Three summers to highlight it." }));
    }

    function drawGrid() {
      var W = chartWidth(gridWrap), cols = W < 420 ? 10 : 15, size = W < 420 ? 20 : 24, n = D.observed.of;
      var rows = Math.ceil(n / cols), H = rows * (size + 6) + 4;
      var s = svg("svg", { viewBox: "0 0 " + W + " " + H, class: "pl-svg", role: "img" });
      var ob = D.observed, pl = D.planning2016;
      for (var i = 0; i < n; i++) {
        var cls;
        if (state.classView === "observed") cls = i < ob.astro ? "pl-after" : i < ob.visited ? "pl-before" : "pl-empty";
        else cls = i < pl.unsure ? "pl-warn" : i < pl.unsure + pl.general ? "pl-before" : "pl-empty";
        var x = (i % cols) * (size + 6), y = Math.floor(i / cols) * (size + 6) + 2;
        s.appendChild(svg("rect", { x: x, y: y, width: size, height: size, class: cls }));
      }
      if (state.classView === "observed") {
        s.setAttribute("aria-label", "Of 30 teachers, 21 were observed teaching, and 7 of those lessons used astronomy.");
        gridNote.innerHTML = "Peers visited <strong>21 of 30</strong> classrooms; <strong>seven</strong> lessons (33%) used astronomy, and none had an authentic, real-world science focus.";
        gridWrap.innerHTML = "";
        gridWrap.appendChild(s);
        gridWrap.appendChild(el("div", { class: "c-legend", html: "<span class=\"pl-lg\"><span class=\"pl-sw pl-after\"></span>Used astronomy (7)</span><span class=\"pl-lg\"><span class=\"pl-sw pl-before\"></span>Observed, no astronomy (14)</span><span class=\"pl-lg\"><span class=\"pl-sw pl-empty\"></span>Not observed (9)</span>" }));
      } else {
        s.setAttribute("aria-label", "Of 30 teachers, 4 were unsure how they would use the material and 8 made only general statements of classroom use.");
        gridNote.innerHTML = "<strong>Four</strong> teachers (13%) were unsure how they would use what they learned, and <strong>eight</strong> (27%) made only general statements about classroom use.";
        gridWrap.innerHTML = "";
        gridWrap.appendChild(s);
        gridWrap.appendChild(el("div", { class: "c-legend", html: "<span class=\"pl-lg\"><span class=\"pl-sw pl-warn\"></span>Unsure (4)</span><span class=\"pl-lg\"><span class=\"pl-sw pl-before\"></span>General statements (8)</span><span class=\"pl-lg\"><span class=\"pl-sw pl-empty\"></span>Specific plans or not reported (18)</span>" }));
      }
    }

    function drawT10() {
      t10.innerHTML = D.t10.map(function (r) {
        return "<div class=\"pl-row\"><div class=\"pl-k\">" + r.level + " (" + r.n + ")</div><div class=\"pl-v\">" +
          r.content.map(function (c) { return c[0] + (c[1] > 1 ? " (" + c[1] + ")" : ""); }).join("; ") +
          "<br><span class=\"w-mono\">Taught in: " + r.subject.map(function (c) { return c[0] + " " + c[1]; }).join(", ") + "</span></div></div>";
      }).join("");
    }

    function draw() { drawPlans(); drawGrid(); drawT10(); }
    yearDraws.push(drawPlans);
    redraws.push(draw);
    draw();
  }

  /* ------------------------------------------------------------------ boot */

  function mount(id, fn) {
    var node = document.getElementById(id);
    if (!node) return;
    try { fn(node); node.classList.add("w-ready"); }
    catch (err) { node.appendChild(el("p", { class: "w-note", text: "This demo could not start: " + err.message })); if (window.console) console.error(err); }
  }
  function boot() {
    mount("pl-design", mountDesign);
    mount("pl-sky", mountSky);
    mount("pl-gains", mountGains);
    mount("pl-feel", mountFeel);
    mount("pl-class", mountClass);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();

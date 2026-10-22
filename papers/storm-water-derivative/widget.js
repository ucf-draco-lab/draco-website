/*
  Storm water derivative widget for /papers/storm-water-derivative/.
  Mount points in the page: #sw-tray, #sw-lesson, #sw-components, #sw-scores.

  Demo 1 (the lesson's activity): a simulated rainstorm on the three trays, the
  readings a group records, and the two ways the students found the runoff rate
  (slopes between readings and the derivative of an Excel polynomial trendline).
  Demo 2 walks the lesson from need to post-assessment, as the paper describes it.
  Demo 3 draws the paper's lesson-component table (Figure 1) and, at the graduate
  and researcher levels, the lesson counts behind its percentages.
  Demo 4 draws the pre- and post-assessment averages (Figure 5), puts the Table 1
  matching item in front of the reader, and, at the graduate and researcher
  levels, maps which class sizes and spreads the printed p bounds allow.
  All arithmetic lives in storm-engine.js. Anything marked "page" is the page's own.
*/
(function () {
  "use strict";

  var E = window.StormEngine;
  var D = E.DATA;
  var SVGNS = "http://www.w3.org/2000/svg";

  var state = {
    T: 30, step: 10, err: 0, seed: 1, method: "both", order: 6, show: { urban: true, suburban: true, rural: true },
    lessonStep: 0, sort: "paper", counts: false, n: 15, sd: 15
  };

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
    if (p >= 0.001) return fix(p, 3);
    var e = Math.floor(Math.log(p) / Math.LN10), m = p / Math.pow(10, e);
    if (m >= 9.95) { m = 1; e += 1; }
    return fix(m, 1) + " × 10<sup>" + String(e).replace("-", "−") + "</sup>";
  }
  function level() {
    var a = document.querySelector(".paper");
    return (a && a.getAttribute("data-level")) || "public";
  }
  function deep() { var l = level(); return l === "grad" || l === "res"; }

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
      var b = el("button", { type: "button", class: "seg-option", role: "radio", "data-value": String(opt.value), text: opt.label });
      if (opt.title) b.setAttribute("title", opt.title);
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
  function labeled(text, control, levels) {
    var row = el("div", { class: "w-actions" }, [el("span", { class: "w-mono", text: text }), control]);
    if (levels) row.setAttribute("data-levels", levels);
    return row;
  }

  // Axis helper: returns a group with grid and ticks, and scale functions.
  function axes(g, box, xr, yr, xt, yt, xl, yl) {
    function sx(x) { return box.x + (x - xr[0]) / (xr[1] - xr[0]) * box.w; }
    function sy(y) { return box.y + box.h - (y - yr[0]) / (yr[1] - yr[0]) * box.h; }
    yt.forEach(function (v) {
      g.appendChild(svg("line", { x1: box.x, x2: box.x + box.w, y1: sy(v), y2: sy(v), class: "c-grid" }));
      g.appendChild(svg("text", { x: box.x - 6, y: sy(v) + 4, "text-anchor": "end", class: "c-tick" }, String(v)));
    });
    xt.forEach(function (v) {
      g.appendChild(svg("text", { x: sx(v), y: box.y + box.h + 15, "text-anchor": "middle", class: "c-tick" }, String(v)));
    });
    g.appendChild(svg("text", { x: box.x + box.w / 2, y: box.y + box.h + 31, "text-anchor": "middle", class: "c-label" }, xl));
    g.appendChild(svg("text", { x: box.x, y: box.y - 8, "text-anchor": "start", class: "c-label" }, yl));
    return { sx: sx, sy: sy };
  }
  function ticks(max, count) {
    var raw = max / count, mag = Math.pow(10, Math.floor(Math.log(raw) / Math.LN10)), step;
    var r = raw / mag;
    step = (r <= 1 ? 1 : r <= 2 ? 2 : r <= 2.5 ? 2.5 : r <= 5 ? 5 : 10) * mag;
    var out = [];
    for (var v = 0; v <= max + 1e-9; v += step) out.push(Math.round(v * 1000) / 1000);
    return out;
  }
  function pathOf(points) {
    return points.map(function (p, i) { return (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1); }).join(" ");
  }

  /* --------------------------------------------- demo 1: the rain lab */

  function mountTray(root) {
    var showWrap = el("div", { class: "seg", role: "group", "aria-label": "Watersheds" });
    D.sheds.forEach(function (s) {
      var b = el("button", { type: "button", class: "seg-option sw-shed-btn sw-" + s.id, "aria-pressed": "true", text: s.label, title: s.surface });
      b.addEventListener("click", function () {
        state.show[s.id] = !state.show[s.id];
        if (!state.show.urban && !state.show.suburban && !state.show.rural) state.show[s.id] = true;
        b.setAttribute("aria-pressed", state.show[s.id] ? "true" : "false");
        draw();
      });
      showWrap.appendChild(b);
    });
    var pour = segmented("Pour length", [{ value: 10, label: "10 s" }, { value: 30, label: "30 s" }, { value: 60, label: "60 s" }], state.T, function (v) { state.T = v; draw(); });
    var step = segmented("Reading every", [{ value: 5, label: "5 s" }, { value: 10, label: "10 s" }, { value: 20, label: "20 s" }], state.step, function (v) { state.step = v; draw(); });
    var err = segmented("Reading error", [{ value: 0, label: "Exact" }, { value: 8, label: "± 8 ml" }], state.err, function (v) { state.err = v; draw(); });
    var method = segmented("Rate from", [
      { value: "slopes", label: "Slopes", title: "Slopes between consecutive readings" },
      { value: "fit", label: "Trendline", title: "Derivative of the polynomial trendline" },
      { value: "both", label: "Both" }
    ], state.method, function (v) { state.method = v; draw(); });
    var order = segmented("Trendline order", [2, 3, 4, 5, 6].map(function (n) { return { value: n, label: String(n) }; }), state.order, function (v) { state.order = v; draw(); });
    var again = el("button", { type: "button", class: "w-btn", text: "Pour again" });
    again.addEventListener("click", function () { state.seed += 1; draw(); });

    var cumChart = el("div", { class: "sw-chart" });
    var rateChart = el("div", { class: "sw-chart" });
    var legend = el("div", { class: "c-legend" });
    var readout = el("div", { class: "sw-table-scroll" });
    var src = el("p", { class: "w-source" });

    [labeled("Show:", showWrap), labeled("Pour 500 ml over:", pour), labeled("Read the cylinder every:", step, "hs ug grad res"),
      labeled("Reading error:", err, "ug grad res"), labeled("Rate from:", method), labeled("Trendline order:", order, "ug grad res"),
      el("div", { class: "w-actions", "data-levels": "ug grad res" }, [again]),
      el("p", { class: "sw-caption", text: "Cumulative runoff in the graduated cylinder" }), cumChart,
      el("p", { class: "sw-caption", text: "Runoff rate: the derivative" }), rateChart, legend, readout, src
    ].forEach(function (n) { root.appendChild(n); });

    function sheds() { return D.sheds.filter(function (s) { return state.show[s.id]; }); }

    function compute() {
      var lv = level();
      var stepS = lv === "public" ? 10 : state.step;
      var errMl = (lv === "public" || lv === "hs") ? 0 : state.err;
      var ord = (lv === "public" || lv === "hs") ? 6 : state.order;
      return D.sheds.map(function (s) {
        var pts = E.readings(s, { T: state.T, step: stepS, end: 180, err: errMl, seed: state.seed * 31 + s.k });
        var xs = pts.map(function (p) { return p.t; }), ys = pts.map(function (p) { return p.v; });
        var c = E.polyfit(xs, ys, ord), dc = E.polyDeriv(c);
        var sl = E.slopes(pts), best = sl.reduce(function (a, b) { return b.slope > a.slope ? b : a; }, sl[0]);
        return { shed: s, pts: pts, c: c, dc: dc, r2: E.rSquared(xs, ys, c), slopes: sl, bestSlope: best,
          bestFit: E.maxOn(dc, 0, 180), peak: E.peakRate(s, D.pourMl, state.T), ord: ord, stepS: stepS };
      });
    }

    function draw() {
      var res = compute(), show = sheds().map(function (s) { return s.id; });
      var vis = res.filter(function (r) { return show.indexOf(r.shed.id) >= 0; });
      var lv = level(), dp = deep();

      // cumulative chart
      var W = chartWidth(root), H = 230, box = { x: 46, y: 22, w: W - 62, h: H - 64 };
      cumChart.innerHTML = "";
      var s1 = svg("svg", { viewBox: "0 0 " + W + " " + H, class: "sw-svg", role: "img", "aria-label": "Cumulative runoff volume against time for each tray" });
      var ax = axes(s1, box, [0, 180], [0, 500], [0, 30, 60, 90, 120, 150, 180], [0, 100, 200, 300, 400, 500], "time (s)", "volume (ml)");
      s1.appendChild(svg("rect", { x: ax.sx(0), y: box.y, width: ax.sx(state.T) - ax.sx(0), height: box.h, class: "sw-pour" }));
      s1.appendChild(svg("text", { x: ax.sx(state.T) - 4, y: box.y + 12, "text-anchor": "end", class: "c-tick" }, "pouring"));
      vis.forEach(function (r) {
        var cls = "sw-" + r.shed.id;
        if (dp) {
          var mp = [];
          for (var t = 0; t <= 180; t += 1) mp.push([ax.sx(t), ax.sy(E.cumulative(t, r.shed, D.pourMl, state.T))]);
          s1.appendChild(svg("path", { d: pathOf(mp), class: "sw-model " + cls }));
        }
        if (state.method !== "slopes") {
          var fp = [];
          for (var u = 0; u <= 180; u += 1) fp.push([ax.sx(u), ax.sy(Math.max(-40, Math.min(540, E.polyval(r.c, u))))]);
          s1.appendChild(svg("path", { d: pathOf(fp), class: "sw-fit " + cls }));
        }
        r.pts.forEach(function (p) { s1.appendChild(svg("circle", { cx: ax.sx(p.t), cy: ax.sy(p.v), r: 3.2, class: "sw-dot " + cls })); });
      });
      cumChart.appendChild(s1);

      // rate chart
      var maxRate = 0;
      vis.forEach(function (r) {
        r.slopes.forEach(function (q) { maxRate = Math.max(maxRate, q.slope); });
        maxRate = Math.max(maxRate, r.bestFit.y, r.peak.rate);
      });
      maxRate = Math.max(2, Math.ceil(maxRate * 1.1));
      var H2 = 220, box2 = { x: 46, y: 22, w: W - 62, h: H2 - 64 };
      rateChart.innerHTML = "";
      var s2 = svg("svg", { viewBox: "0 0 " + W + " " + H2, class: "sw-svg", role: "img", "aria-label": "Runoff rate against time for each tray" });
      var yt = ticks(maxRate, 4);
      var ax2 = axes(s2, box2, [0, 180], [0, yt[yt.length - 1]], [0, 30, 60, 90, 120, 150, 180], yt, "time (s)", "rate (ml per second)");
      vis.forEach(function (r) {
        var cls = "sw-" + r.shed.id;
        if (dp) {
          var mp = [];
          for (var t = 0; t <= 180; t += 1) mp.push([ax2.sx(t), ax2.sy(E.rateAt(t, r.shed, D.pourMl, state.T))]);
          s2.appendChild(svg("path", { d: pathOf(mp), class: "sw-model " + cls }));
        }
        if (state.method !== "fit") {
          r.slopes.forEach(function (q) {
            s2.appendChild(svg("line", { x1: ax2.sx(q.t0), x2: ax2.sx(q.t1), y1: ax2.sy(q.slope), y2: ax2.sy(q.slope), class: "sw-step " + cls }));
          });
        }
        if (state.method !== "slopes") {
          var top = yt[yt.length - 1], fp = [];
          for (var u = 0; u <= 180; u += 1) fp.push([ax2.sx(u), ax2.sy(Math.max(-0.15 * top, Math.min(1.1 * top, E.polyval(r.dc, u))))]);
          s2.appendChild(svg("path", { d: pathOf(fp), class: "sw-fit " + cls }));
        }
      });
      rateChart.appendChild(s2);

      legend.innerHTML = "";
      vis.forEach(function (r) {
        legend.appendChild(el("span", { class: "sw-lg" }, [el("span", { class: "sw-sw sw-" + r.shed.id }), r.shed.label + ": " + r.shed.surface.toLowerCase()]));
      });
      var keyBits = [];
      if (state.method !== "fit") keyBits.push("flat steps: slope between two readings");
      if (state.method !== "slopes") keyBits.push("solid curve: trendline and its derivative");
      keyBits.push("dots: readings");
      if (dp) keyBits.push("dashed: the page's model");
      legend.appendChild(el("span", { class: "sw-lg w-mono", text: keyBits.join(" · ") }));

      // readout table
      var head = "<tr><th>Tray</th><th>Collected by 180 s</th>" +
        (state.method !== "fit" ? "<th>Fastest slope</th>" : "") +
        (state.method !== "slopes" ? "<th>Peak of derivative</th>" : "") +
        (lv !== "public" && lv !== "hs" && state.method !== "slopes" ? "<th>R²</th>" : "") +
        (dp ? "<th>Model peak (page)</th>" : "") + "</tr>";
      var rows = vis.map(function (r) {
        var last = r.pts[r.pts.length - 1].v;
        return "<tr><td>" + r.shed.label + "</td><td>" + last + " ml</td>" +
          (state.method !== "fit" ? "<td>" + fix(r.bestSlope.slope, 2) + " ml/s, " + r.bestSlope.t0 + " to " + r.bestSlope.t1 + " s</td>" : "") +
          (state.method !== "slopes" ? "<td>" + fix(r.bestFit.y, 2) + " ml/s at " + fix(r.bestFit.x, 0) + " s</td>" : "") +
          (lv !== "public" && lv !== "hs" && state.method !== "slopes" ? "<td>" + fix(r.r2, 4) + "</td>" : "") +
          (dp ? "<td>" + fix(r.peak.rate, 2) + " ml/s at " + fix(r.peak.t, 1) + " s</td>" : "") + "</tr>";
      }).join("");
      var eq = "";
      if (dp && state.method !== "slopes") {
        eq = vis.map(function (r) {
          return "<p class=\"w-mono\">" + r.shed.label + ": V(t) = " + r.c.map(function (c, j) {
            var co = Math.abs(c) >= 0.01 ? fix(c, 4) : c.toExponential(3).replace("-", "−").replace("e", " × 10^");
            return co + (j === 0 ? "" : j === 1 ? " t" : " t^" + j);
          }).join(" + ").replace(/\+ −/g, "− ") + "</p>";
        }).join("");
      }
      readout.innerHTML = "<table class=\"sw-table\"><thead>" + head + "</thead><tbody>" + rows + "</tbody></table>" + eq;

      var r0 = res[0];
      src.textContent = "Simulated: the paper prints no runoff readings. Trays, 500 ml pour, readings, slopes, and an Excel polynomial trendline follow the paper's lesson; " +
        "how fast each surface releases water is the page's model (two linear stores, Nash n = 2). " + "Readings every " + r0.stepS + " s for 180 s, trendline order " + r0.ord + ".";
    }
    redraws.push(draw);
    draw();
  }

  /* -------------------------------------------- demo 2: the lesson */

  var STEPS = [
    { tag: "Need", title: "The teacher names the need", text: "The calculus teacher identifies where a derivative lesson belongs in the curriculum map." },
    { tag: "Design", title: "The Fellow builds the lesson", text: "The Project STEP Fellow, a civil and environmental engineering graduate student, develops the lesson with her research advisor and the program's principal investigators; a co-principal investigator checks it for correctness and the grant coordinator approves it. The teacher leads the post-test. Development takes about six weeks." },
    { tag: "Hook", title: "Rain on two models", text: "The class watches simulated rain fall on an urban model (blacktop and model buildings) and a suburban model (turf and a house) and discusses why the runoff differs." },
    { tag: "Pre", title: "Pre-assessment", text: "Students take a short five-question assessment. Guessing is discouraged." },
    { tag: "Storm", title: "Three trays, five roles", text: "The class splits into three groups, one per tray: urban, suburban, and rural. Each group has a timer, a marker, a recorder, an overseer, and a rain pourer, who pours 500 ml from a watering can while the group records the cumulative volume in a graduated cylinder." },
    { tag: "Excel", title: "Slopes, trendlines, derivatives", text: "In the computer lab, students graph cumulative runoff, calculate slopes over intervals, graph them as a derivative, fit a polynomial trendline with Excel's regression option, and differentiate it by hand." },
    { tag: "Discuss", title: "Maximum rates and solutions", text: "Side-by-side cumulative and derivative graphs let students find each tray's maximum runoff rate, connect it to the surface, name the problems faster runoff brings to an urban setting such as Cincinnati, and recommend management practices." },
    { tag: "Trip", title: "Sanitation District 1", text: "At Sanitation District 1 in Fort Wright, Kentucky, students question a panel of county and state scientists and engineers and tour green roofs, porous pavements, detention ponds, wetlands, and riparian zones." },
    { tag: "Post", title: "Post-assessment", text: "Students finish the lesson with the same five questions." }
  ];

  function mountLesson(root) {
    var list = el("ol", { class: "sw-steps" });
    var buttons = STEPS.map(function (s, i) {
      var b = el("button", { type: "button", class: "sw-step-btn", "aria-current": "false" }, [el("span", { class: "w-mono", text: s.tag }), " " + s.title]);
      b.addEventListener("click", function () { state.lessonStep = i; draw(); });
      var li = el("li", {}, [b]);
      list.appendChild(li);
      return b;
    });
    var detail = el("p", { class: "sw-detail" });
    var prev = el("button", { type: "button", class: "w-btn", text: "Previous" });
    var next = el("button", { type: "button", class: "w-btn", text: "Next" });
    var where = el("span", { class: "w-mono" });
    prev.addEventListener("click", function () { state.lessonStep = (state.lessonStep + STEPS.length - 1) % STEPS.length; draw(); });
    next.addEventListener("click", function () { state.lessonStep = (state.lessonStep + 1) % STEPS.length; draw(); });
    var src = el("p", { class: "w-source", text: "Paper, sections Project STEP, Lesson Creation, and Innovative Lesson · lesson length in class periods is not stated" });
    [el("div", { class: "w-actions" }, [prev, next, where]), detail, list, src].forEach(function (n) { root.appendChild(n); });
    function draw() {
      buttons.forEach(function (b, i) { b.setAttribute("aria-current", i === state.lessonStep ? "step" : "false"); });
      var s = STEPS[state.lessonStep];
      detail.innerHTML = "<strong>" + s.title + ".</strong> " + s.text;
      where.textContent = "Step " + (state.lessonStep + 1) + " of " + STEPS.length;
    }
    draw();
  }

  /* --------------------------------------- demo 3: lesson components */

  function mountComponents(root) {
    var sort = segmented("Sort", [{ value: "paper", label: "Paper's order" }, { value: "a", label: "Most addressed" }, { value: "p", label: "Most partial" }],
      state.sort, function (v) { state.sort = v; draw(); });
    var counts = segmented("Units", [{ value: "pct", label: "Percent" }, { value: "n", label: "Lessons of 32 (page)" }],
      "pct", function (v) { state.counts = v === "n"; draw(); });
    var chart = el("div", { class: "sw-chart" });
    var legend = el("div", { class: "c-legend", html:
      "<span class=\"sw-lg\"><span class=\"sw-sw sw-addr\"></span>Addressed</span>" +
      "<span class=\"sw-lg\"><span class=\"sw-sw sw-part\"></span>Partially addressed</span>" +
      "<span class=\"sw-lg\"><span class=\"sw-sw sw-none\"></span>Neither</span>" });
    var note = el("p", { class: "w-note", "data-levels": "grad res" });
    var src = el("p", { class: "w-source", text: "Paper, Figure 1 (a table): Project STEP lessons created since 2006 · the paper does not state how many lessons were reviewed" });
    [labeled("Sort:", sort), labeled("Show as:", counts, "grad res"), chart, legend, note, src].forEach(function (n) { root.appendChild(n); });

    var fits = (function () { var v = []; D.components.forEach(function (c) { v.push(c.a, c.p); }); return E.recoverCount(v, 200); })();
    var n0 = fits[0].n, cnt = fits[0].counts;

    function draw() {
      var useCounts = state.counts && deep();
      var rows = D.components.map(function (c, i) { return { c: c, a: cnt[2 * i], p: cnt[2 * i + 1], i: i }; });
      if (state.sort === "a") rows.sort(function (x, y) { return y.c.a - x.c.a || y.c.p - x.c.p; });
      if (state.sort === "p") rows.sort(function (x, y) { return y.c.p - x.c.p || y.c.a - x.c.a; });
      var W = chartWidth(root), narrow = W < 520, labW = narrow ? 128 : 230, rowH = 22, top = 8;
      var H = top + rows.length * rowH + 26, x0 = labW, w = W - labW - (narrow ? 84 : 104);
      chart.innerHTML = "";
      var s = svg("svg", { viewBox: "0 0 " + W + " " + H, class: "sw-svg", role: "img", "aria-label": "Share of Project STEP lessons addressing each component" });
      [0, 25, 50, 75, 100].forEach(function (v) {
        var x = x0 + v / 100 * w;
        s.appendChild(svg("line", { x1: x, x2: x, y1: top, y2: top + rows.length * rowH, class: "c-grid" }));
        s.appendChild(svg("text", { x: x, y: top + rows.length * rowH + 15, "text-anchor": "middle", class: "c-tick" }, useCounts ? String(Math.round(v / 100 * n0)) : v + "%"));
      });
      rows.forEach(function (r, k) {
        var y = top + k * rowH, bh = rowH - 7;
        var name = narrow && r.c.name.length > 19 ? r.c.name.slice(0, 18) + "…" : r.c.name;
        var t = svg("text", { x: x0 - 6, y: y + bh - 3, "text-anchor": "end", class: "c-label" }, name);
        t.appendChild(svg("title", {}, r.c.name));
        s.appendChild(t);
        var wa = r.c.a / 100 * w, wp = r.c.p / 100 * w;
        s.appendChild(svg("rect", { x: x0, y: y, width: w, height: bh, class: "sw-none" }));
        s.appendChild(svg("rect", { x: x0, y: y, width: wa, height: bh, class: "sw-addr" }));
        s.appendChild(svg("rect", { x: x0 + wa, y: y, width: wp, height: bh, class: "sw-part" }));
        var lab = useCounts ? r.a + " + " + r.p : (narrow ? fix(r.c.a, 0) + " + " + fix(r.c.p, 0) : fix(r.c.a, 1) + "% + " + fix(r.c.p, 1) + "%");
        s.appendChild(svg("text", { x: x0 + w + 4, y: y + bh - 3, class: "sw-val" }, lab));
      });
      chart.appendChild(s);
      note.innerHTML = "Every one of the table's 28 percentages equals a whole number of lessons out of <strong>" + n0 +
        "</strong>, rounded to two decimals (for example, 78.13% is 25 of 32 and 93.75% is 30 of 32); " + n0 +
        " is the smallest count that fits all 28, and only its multiples (" + fits.slice(1, 4).map(function (f) { return f.n; }).join(", ") +
        ", …) fit as well. The count of 32 is the page's reconstruction; the paper gives percentages only.";
    }
    redraws.push(draw);
    draw();
  }

  /* ------------------------------------ demo 4: the assessment */

  function mountScores(root) {
    var chart = el("div", { class: "sw-chart" });
    var legend = el("div", { class: "c-legend", html:
      "<span class=\"sw-lg\"><span class=\"sw-sw sw-pre\"></span>Pre-assessment</span>" +
      "<span class=\"sw-lg\"><span class=\"sw-sw sw-post\"></span>Post-assessment</span>" });
    var big = el("p", { class: "w-big" });
    var srcA = el("p", { class: "w-source", text: "Paper, Impact on Student Achievement and Figure 5 · two calculus sections; class sizes are not stated · the page reads the first pair of averages as Bell 2" });

    // matching item
    var matchHead = el("p", { class: "sw-q", html: "<strong>Table 1.</strong> Match the professional with how they might use derivatives to solve a real-world problem." });
    var matchRows = el("div", { class: "sw-match" });
    var picks = D.matchPros.map(function () { return -1; });
    D.matchPros.forEach(function (pro, i) {
      var sel = el("select", { class: "sw-select", "aria-label": pro });
      sel.appendChild(el("option", { value: "-1", text: "Choose a use" }));
      D.matchUses.forEach(function (u, j) { sel.appendChild(el("option", { value: String(j), text: ["i", "ii", "iii", "iv", "v"][j] + ". " + u })); });
      sel.addEventListener("change", function () { picks[i] = Number(sel.value); drawMatch(); });
      matchRows.appendChild(el("div", { class: "sw-match-row" }, [el("span", { class: "sw-pro", text: String.fromCharCode(65 + i) + ". " + pro }), sel]));
    });
    var reveal = el("button", { type: "button", class: "w-btn", text: "Compare with the page's reading" });
    var matchOut = el("div", { class: "sw-answer", hidden: "hidden" });
    reveal.addEventListener("click", function () { matchOut.removeAttribute("hidden"); drawMatch(); });
    var srcB = el("p", { class: "w-source", text: "Paper, Table 1: the item with the largest pre-to-post gain · the paper prints no answer key" });

    // t-test map (graduate and researcher)
    var tWrap = el("div", { "data-levels": "grad res" });
    var nCtl = el("input", { type: "range", min: "5", max: "35", step: "1", value: String(state.n), "aria-label": "Students per assessment" });
    var sdCtl = el("input", { type: "range", min: "2", max: "50", step: "1", value: String(state.sd), "aria-label": "Standard deviation of scores" });
    var nLab = el("span", { class: "w-mono" }), sdLab = el("span", { class: "w-mono" });
    var tChart = el("div", { class: "sw-chart" });
    var tOut = el("div", { class: "sw-table-scroll" });
    var tLegend = el("div", { class: "c-legend", html:
      "<span class=\"sw-lg\"><span class=\"sw-sw sw-b2\"></span>Largest spread that still gives Bell 2's p &lt; 7 × 10⁻⁷</span>" +
      "<span class=\"sw-lg\"><span class=\"sw-sw sw-b5\"></span>Largest spread that still gives Bell 5's p &lt; 0.03</span>" +
      "<span class=\"sw-lg\"><span class=\"sw-sw sw-ceil\"></span>Largest spread any 0 to 100 scores allow</span>" });
    nCtl.addEventListener("input", function () { state.n = Number(nCtl.value); drawT(); });
    sdCtl.addEventListener("input", function () { state.sd = Number(sdCtl.value); drawT(); });
    [el("p", { class: "sw-caption", text: "Which class sizes and spreads fit the printed p bounds (page's analysis)" }),
      el("div", { class: "w-actions" }, [el("span", { class: "w-mono", text: "Students per assessment:" }), nCtl, nLab]),
      el("div", { class: "w-actions" }, [el("span", { class: "w-mono", text: "Standard deviation (points):" }), sdCtl, sdLab]),
      tChart, tLegend, tOut,
      el("p", { class: "w-source", text: "Computed by the page: Student's unpaired t-test with pooled variance, the test the paper names, at the averages it prints; class sizes and standard deviations are not printed, so both are free here" })
    ].forEach(function (n) { tWrap.appendChild(n); });

    [chart, legend, big, srcA, matchHead, matchRows, el("div", { class: "w-actions" }, [reveal]), matchOut, srcB, tWrap].forEach(function (n) { root.appendChild(n); });

    function draw() {
      var W = chartWidth(root), H = 220, box = { x: 46, y: 26, w: W - 62, h: H - 66 };
      chart.innerHTML = "";
      var s = svg("svg", { viewBox: "0 0 " + W + " " + H, class: "sw-svg", role: "img", "aria-label": "Average pre- and post-assessment scores for two calculus sections" });
      var ax = axes(s, box, [0, 1], [0, 80], [], [0, 20, 40, 60, 80], "", "average score (%)");
      var gw = box.w / 2, bw = Math.min(70, gw / 3.2);
      D.scores.forEach(function (sc, i) {
        var cx = box.x + gw * (i + 0.5);
        [["pre", sc.pre, -1], ["post", sc.post, 1]].forEach(function (b) {
          var x = cx + (b[2] < 0 ? -bw - 4 : 4);
          s.appendChild(svg("rect", { x: x, y: ax.sy(b[1]), width: bw, height: ax.sy(0) - ax.sy(b[1]), class: "sw-" + b[0] }));
          s.appendChild(svg("text", { x: x + bw / 2, y: ax.sy(b[1]) - 5, "text-anchor": "middle", class: "sw-val" }, b[1] + "%"));
        });
        s.appendChild(svg("text", { x: cx, y: box.y + box.h + 16, "text-anchor": "middle", class: "c-label" }, sc.bell + " (+" + (sc.post - sc.pre) + " points)"));
        var pt = svg("text", { x: cx, y: box.y + box.h + 31, "text-anchor": "middle", class: "c-tick", "data-levels": "ug grad res" }, "p < " + (sc.pBound < 0.001 ? "7 × 10⁻⁷" : sc.pBound));
        s.appendChild(pt);
      });
      chart.appendChild(s);
      big.innerHTML = "Averages rose from <strong>27% to 64%</strong> in one section and from <strong>38% to 59%</strong> in the other.";
    }

    // The page's reading of Table 1 (no key is printed): flagged for the authors.
    var READING = [
      { uses: [0, 2], why: "reaction and production rates, and flow inside a reactor, are a chemical engineer's daily rates of change" },
      { uses: [3], why: "how a disinfectant's concentration changes along a water distribution system is an environmental engineering problem" },
      { uses: [4, 2], why: "strength of materials (how stress and deflection change along a beam) is core civil engineering; fluid flow is shared with environmental and chemical work" },
      { uses: [1], why: "GPS position, velocity, and timing are derivatives handled in electrical engineering" }
    ];
    function drawMatch() {
      if (matchOut.hasAttribute("hidden")) return;
      var rn = ["i", "ii", "iii", "iv", "v"];
      matchOut.innerHTML = "<p><strong>The paper prints no answer key.</strong> One defensible reading (the page's, not the authors'):</p><ul>" +
        D.matchPros.map(function (pro, i) {
          var r = READING[i], mine = picks[i];
          var tag = mine < 0 ? "" : r.uses.indexOf(mine) >= 0 ? " <span class=\"sw-ok\">matches your choice</span>" : " <span class=\"w-mono\">you chose " + rn[mine] + "</span>";
          return "<li><strong>" + pro + ":</strong> " + r.uses.map(function (u) { return rn[u]; }).join(" or ") + ", because " + r.why + "." + tag + "</li>";
        }).join("") + "</ul><p class=\"w-note\">Students in both sections answered the definition questions well; this matching item gave them the most trouble on the pre-assessment and showed the largest gain.</p>";
    }

    function drawT() {
      nLab.textContent = String(state.n);
      sdLab.textContent = String(state.sd);
      var W = chartWidth(root), H = 230, box = { x: 46, y: 22, w: W - 62, h: H - 64 };
      tChart.innerHTML = "";
      var s = svg("svg", { viewBox: "0 0 " + W + " " + H, class: "sw-svg", role: "img", "aria-label": "Largest standard deviation consistent with each printed p bound, by class size" });
      var ax = axes(s, box, [5, 35], [0, 60], [5, 10, 15, 20, 25, 30, 35], [0, 10, 20, 30, 40, 50, 60], "students per assessment (both tests)", "standard deviation (points)");
      function curve(fn, cls) {
        var pts = [];
        for (var n = 5; n <= 35; n++) pts.push([ax.sx(n), ax.sy(Math.min(60, fn(n)))]);
        s.appendChild(svg("path", { d: pathOf(pts), class: cls }));
      }
      curve(function (n) { return E.sdCeiling(n); }, "sw-ceil-line");
      curve(function (n) { return E.maxSD(37, n, 7e-7); }, "sw-b2-line");
      curve(function (n) { return E.maxSD(21, n, 0.03); }, "sw-b5-line");
      s.appendChild(svg("circle", { cx: ax.sx(state.n), cy: ax.sy(state.sd), r: 5, class: "sw-you" }));
      tChart.appendChild(s);
      var rows = D.scores.map(function (sc) {
        var r = E.tTest2(sc.pre, state.sd, state.n, sc.post, state.sd, state.n), ok = r.p < sc.pBound;
        return "<tr><td>" + sc.bell + "</td><td>" + sc.pre + " → " + sc.post + "</td><td>" + fix(r.t, 2) + "</td><td>" + r.df + "</td><td>" + sci(r.p) +
          "</td><td>p &lt; " + (sc.pBound < 0.001 ? "7 × 10<sup>−7</sup>" : sc.pBound) + "</td><td>" + (ok ? "yes" : "no") + "</td></tr>";
      }).join("");
      tOut.innerHTML = "<table class=\"sw-table\"><thead><tr><th>Section</th><th>Averages (paper)</th><th>t (page)</th><th>df</th><th>p (page)</th><th>Printed</th><th>Fits?</th></tr></thead><tbody>" + rows + "</tbody></table>";
    }

    redraws.push(draw, drawT);
    draw();
    drawT();
  }

  /* ------------------------------------------------------------------ boot */

  function mount(id, fn) {
    var node = document.getElementById(id);
    if (!node) return;
    try { fn(node); node.classList.add("w-ready"); }
    catch (err) { node.appendChild(el("p", { class: "w-note", text: "This demo could not start: " + err.message })); if (window.console) console.error(err); }
  }
  function boot() {
    mount("sw-tray", mountTray);
    mount("sw-lesson", mountLesson);
    mount("sw-components", mountComponents);
    mount("sw-scores", mountScores);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();

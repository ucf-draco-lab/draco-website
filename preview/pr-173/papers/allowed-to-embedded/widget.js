/*
  From Allowed to Embedded widget for /papers/allowed-to-embedded/.
  Mount points in the page: #ae-ladder, #ae-timeline, #ae-clarity, #ae-shadow, #ae-recover.

  Demo 1 walks the paper's five-level policy continuum with Table 2's task profile.
  Demo 2 draws Table 1 (nine semesters of reports) and the policy shares the Results
  text states for single semesters.
  Demo 3 draws the clarity means; at the graduate and researcher levels it adds the
  answer counts the page recovers and the tests recomputed from them.
  Demo 4 draws Table 2 as a grid of tasks by policy.
  Demo 5 (graduate and researcher) runs the recovery search live.
  Demos 1, 3, and 4 share one selected policy (state.cat).
  All arithmetic lives in ae-engine.js; recovered counts and intervals are the page's own.
*/
(function () {
  "use strict";

  var E = window.AllowedEmbeddedEngine;
  var D = E.DATA;
  var SVGNS = "http://www.w3.org/2000/svg";

  var state = { cat: "dis", sem: "fa25", view: "all", unit: "pct" };

  var POL = {};
  D.policies.forEach(function (p) { POL[p.id] = p; });

  /* ---------------------------------------------------------------- helpers */

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
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function chartWidth(node) {
    var w = node && node.clientWidth ? node.clientWidth : 640;
    return Math.max(300, Math.min(760, w));
  }
  function fix(x, d) { return Number(x).toFixed(d).replace(/^-/, "\u2212"); }
  function pct(x) { return fix(x, 1) + "%"; }

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
  function note(html, levels) {
    var p = el("p", { class: "w-note", html: html });
    if (levels) p.setAttribute("data-levels", levels);
    return p;
  }

  // The shared policy picker: every copy stays in sync.
  var catControls = [], catDraws = [];
  function setCat(v) {
    state.cat = v;
    catControls.forEach(function (c) { c.set(v); });
    catDraws.forEach(function (fn) { fn(); });
  }
  function catControl(ids) {
    var c = segmented("Course policy", (ids || E.CATS).map(function (id) {
      return { value: id, label: POL[id].short, title: POL[id].name };
    }), state.cat, setCat);
    catControls.push(c);
    return c;
  }

  var t2 = E.table2Counts();

  /* ------------------------------------------------- demo 1: the ladder */

  function mountLadder(root) {
    var head = el("div", { class: "w-actions" }, [el("span", { class: "w-mono", text: "Policy:" }), catControl()]);
    var scale = el("div", { class: "ae-scale", "aria-hidden": "true" }, [
      el("span", { text: "less integration" }), el("span", { text: "more integration" })
    ]);
    var def = el("p", { class: "ae-def" });
    var big = el("p", { class: "w-big" });
    var ci = el("p", { class: "w-note", "data-levels": "grad res" });
    var chart = el("div", { class: "ae-chart" });
    var src = el("p", { class: "w-source" });
    root.appendChild(head);
    root.appendChild(scale);
    root.appendChild(def);
    root.appendChild(big);
    root.appendChild(ci);
    root.appendChild(chart);
    root.appendChild(src);

    function draw() {
      var c = state.cat, n = D.n[c], k = t2[c].any;
      def.innerHTML = "<strong>" + POL[c].name + ".</strong> " + POL[c].def;
      big.innerHTML = "<strong>" + k + " of " + n + "</strong> course reports (" + pct(D.anyUse[c]) + ") say the student used AI for at least one task" +
        (c === "dis" ? ", in courses that prohibit it." : ".");
      var w = E.wilson(k, n);
      ci.innerHTML = "Wilson 95% interval for that share, computed by this page: " + pct(100 * w.lo) + " to " + pct(100 * w.hi) +
        " (reports, not students; see the notes on clustering).";
      var rows = D.tasks.map(function (t) {
        return { label: t.name + " (" + t.what + ")", short: t.name, v: t.pct[c], k: t2[c][t.id] };
      });
      rows.push({ label: "At least one task", short: "Any task", v: D.anyUse[c], k: k, strong: true });
      barRows(chart, rows, n, "Share of " + POL[c].name + " reports using AI for each task");
      src.textContent = "Paper, Table 2 · " + POL[c].name + " column, n = " + n + " reports · counts recomputed from the printed percentages";
    }
    catDraws.push(draw);
    redraws.push(draw);
    draw();
  }

  // Ruled horizontal bars, 0 to 100 percent.
  function barRows(chart, rows, n, aria) {
    chart.innerHTML = "";
    var w = chartWidth(chart);
    var narrow = w < 520;
    var labelW = narrow ? 0 : Math.min(250, Math.round(w * 0.36));
    var valW = 92;
    var barL = labelW + (narrow ? 12 : 10), barR = w - valW;
    var rowH = narrow ? 44 : 30;
    var h = 6 + rows.length * rowH + 24;
    var s = svg("svg", { viewBox: "0 0 " + w + " " + h, class: "ae-svg", role: "img", "aria-label": aria });
    function X(v) { return barL + (barR - barL) * v / 100; }
    [0, 25, 50, 75, 100].forEach(function (g) {
      s.appendChild(svg("line", { x1: X(g), x2: X(g), y1: 4, y2: h - 20, class: "c-grid" }));
      s.appendChild(svg("text", { x: X(g), y: h - 6, "text-anchor": "middle", class: "c-tick" }, g + "%"));
    });
    rows.forEach(function (r, i) {
      var y = 6 + i * rowH;
      var by = narrow ? y + 18 : y + 6;
      var bh = narrow ? 14 : 16;
      s.appendChild(svg("text", { x: narrow ? 0 : labelW, y: narrow ? y + 12 : y + 18, "text-anchor": narrow ? "start" : "end", class: "c-label" }, narrow ? r.short : r.label));
      s.appendChild(svg("rect", { x: X(0), y: by, width: X(100) - X(0), height: bh, class: "ae-track" }));
      s.appendChild(svg("rect", { x: X(0), y: by, width: Math.max(0, X(r.v) - X(0)), height: bh, class: r.strong ? "ae-bar-strong" : "ae-bar" }));
      s.appendChild(svg("text", { x: w - 2, y: by + bh - 3, "text-anchor": "end", class: "ae-val" }, pct(r.v) + (r.k !== null && r.k !== undefined ? " · " + r.k + "/" + n : "")));
    });
    chart.appendChild(s);
  }

  /* ------------------------------------------- demo 2: nine semesters */

  function mountTimeline(root) {
    var chart = el("div", { class: "ae-chart" });
    var legend = el("div", { class: "c-legend" }, [
      el("span", { class: "ae-lg" }, [el("span", { class: "ae-sw ae-sw-ug" }), "Undergraduate reports"]),
      el("span", { class: "ae-lg" }, [el("span", { class: "ae-sw ae-sw-grad" }), "Graduate reports"])
    ]);
    var pick = segmented("Semester", D.semesters.map(function (s) { return { value: s.id, label: s.short, title: s.name }; }), state.sem, function (v) {
      state.sem = v; draw();
    });
    var detail = el("div", { class: "ae-detail" });
    var src = el("p", { class: "w-source", text: "Paper, Table 1 (reports per semester) and the policy shares stated in the Results text · the full Figure 1 breakdown is not printed as numbers" });
    root.appendChild(chart);
    root.appendChild(legend);
    root.appendChild(el("div", { class: "w-actions" }, [el("span", { class: "w-mono", text: "Semester:" }), pick]));
    root.appendChild(detail);
    root.appendChild(src);

    var stated = E.statedCounts();

    function draw() {
      chart.innerHTML = "";
      var w = chartWidth(chart);
      var narrow = w < 520;
      var h = 230, top = 34, base = h - 34;
      var L = 30, R = w - 6;
      var colW = (R - L) / D.semesters.length;
      var maxV = 35;
      function Y(v) { return base - (base - top) * v / maxV; }
      var s = svg("svg", { viewBox: "0 0 " + w + " " + h, class: "ae-svg", role: "img", "aria-label": "Course reports per semester, Spring 2023 to Fall 2025, split into undergraduate and graduate reports" });
      [0, 10, 20, 30].forEach(function (g) {
        s.appendChild(svg("line", { x1: L, x2: R, y1: Y(g), y2: Y(g), class: "c-grid" }));
        s.appendChild(svg("text", { x: L - 4, y: Y(g) + 4, "text-anchor": "end", class: "c-tick" }, String(g)));
      });
      D.phases.forEach(function (p) {
        var x0 = L + p.from * colW + 2, x1 = L + (p.to + 1) * colW - 2;
        s.appendChild(svg("line", { x1: x0, x2: x1, y1: 12, y2: 12, class: "ae-phase" }));
        var lone = p.from === p.to;
        s.appendChild(svg("text", { x: lone ? x1 : (x0 + x1) / 2, y: 26, "text-anchor": lone ? "end" : "middle", class: "c-label" }, narrow && p.name.length > 10 ? (lone ? "Strat." : "Ambiguity") : p.name));
      });
      D.semesters.forEach(function (sem, i) {
        var x = L + i * colW + colW * 0.18, bw = colW * 0.64;
        var g = svg("g", { class: "ae-col" + (sem.id === state.sem ? " is-on" : ""), tabindex: "0", role: "button", "aria-label": sem.name + ": " + sem.reports + " reports" });
        g.appendChild(svg("rect", { x: L + i * colW, y: top, width: colW, height: base - top, class: "ae-hit" }));
        g.appendChild(svg("rect", { x: x, y: Y(sem.ug), width: bw, height: base - Y(sem.ug), class: "ae-ug" }));
        if (sem.grad) g.appendChild(svg("rect", { x: x, y: Y(sem.ug + sem.grad), width: bw, height: Y(sem.ug) - Y(sem.ug + sem.grad), class: "ae-grad" }));
        g.appendChild(svg("text", { x: x + bw / 2, y: Y(sem.reports) - 4, "text-anchor": "middle", class: "ae-val" }, String(sem.reports)));
        g.appendChild(svg("text", { x: x + bw / 2, y: base + 14, "text-anchor": "middle", class: "c-tick" }, narrow ? sem.short.slice(0, 2) : sem.short));
        if (narrow) g.appendChild(svg("text", { x: x + bw / 2, y: base + 26, "text-anchor": "middle", class: "c-tick" }, sem.short.slice(2)));
        function choose() { state.sem = sem.id; pick.set(sem.id); draw(); }
        g.addEventListener("click", choose);
        g.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); choose(); } });
        s.appendChild(g);
      });
      chart.appendChild(s);

      var sem = D.semesters.filter(function (x) { return x.id === state.sem; })[0];
      var st = D.stated[sem.id], sc = stated[sem.id];
      detail.innerHTML = "";
      detail.appendChild(el("p", { class: "w-big", html: "<strong>" + sem.name + "</strong>: " + sem.reports + " reports on " + sem.courses + " courses (" + sem.ug + " undergraduate, " + sem.grad + " graduate)" }));
      var tbl = el("table", { class: "ae-table" });
      tbl.appendChild(el("thead", null, [el("tr", null, [el("th", { text: "Policy" }), el("th", { text: "Share stated in the text" }), el("th", { text: "Reports (page)" })])]));
      var tb = el("tbody");
      var known = 0;
      E.CATS.forEach(function (c) {
        var has = st && st[c] !== undefined;
        if (has) known += sc[c];
        var bar = el("span", { class: "ae-inbar" }, [el("span", { style: "width:" + (has ? st[c] : 0) + "%" })]);
        tb.appendChild(el("tr", null, [
          el("td", { text: POL[c].name }),
          el("td", null, has ? [bar, " " + pct(st[c])] : [el("span", { class: "ae-muted", text: "not stated" })]),
          el("td", { text: has ? sc[c] + " of " + sem.reports : "" })
        ]));
      });
      tbl.appendChild(tb);
      detail.appendChild(el("div", { class: "ae-table-wrap" }, [tbl]));
      var rest = sem.reports - known;
      detail.appendChild(note(rest === 0 ? "The stated shares account for all " + sem.reports + " reports this semester." :
        (known ? "The stated shares account for " + known + " of " + sem.reports + " reports; the text does not give the policy of the other " + rest + "." :
          "The text states no policy shares for this semester; Figure 1 shows them as a chart.")));
    }
    redraws.push(draw);
    draw();
  }

  /* ---------------------------------------------- demo 3: clarity gap */

  var recovered = null;
  function getRecovered() {
    if (!recovered) {
      var r = E.recover();
      recovered = { run: r, sol: r.solutions.length === 1 ? r.solutions[0] : null };
    }
    return recovered;
  }

  function mountClarity(root) {
    var view = segmented("Which reports", [
      { value: "all", label: "All reports" },
      { value: "ug", label: "Undergraduates" },
      { value: "grad", label: "Graduate students" }
    ], state.view, function (v) { state.view = v; draw(); });
    var chart = el("div", { class: "ae-chart" });
    var legend = el("div", { class: "c-legend", "data-levels": "grad res" }, [
      el("span", { class: "ae-lg" }, [el("span", { class: "ae-sw ae-sw-hist" }), "Answers 1 to 5, recovered by this page"]),
      el("span", { class: "ae-lg" }, [el("span", { class: "ae-sw ae-sw-ci" }), "95% interval for the mean (page)"])
    ]);
    var read = el("div", { class: "ae-readout" });
    var src = el("p", { class: "w-source" });
    root.appendChild(el("div", { class: "w-actions" }, [el("span", { class: "w-mono", text: "Show:" }), view]));
    root.appendChild(chart);
    root.appendChild(legend);
    root.appendChild(read);
    root.appendChild(src);

    var ROWS = ["dis", "allowed", "enc", "crit", "none"];

    function draw() {
      chart.innerHTML = "";
      var deep = isDeep();
      var sol = deep && state.view === "all" ? getRecovered().sol : null;
      var w = chartWidth(chart);
      var narrow = w < 520;
      var labelW = narrow ? 0 : 170;
      var valW = 54;
      var L = labelW + (narrow ? 4 : 14), R = w - valW;
      var rowH = narrow ? (sol ? 76 : 46) : (sol ? 64 : 34);
      var h = 8 + ROWS.length * rowH + 40;
      function X(v) { return L + (R - L) * (v - 1) / 4; }
      var s = svg("svg", { viewBox: "0 0 " + w + " " + h, class: "ae-svg", role: "img", "aria-label": "Mean instructor clarity on a 1 to 5 scale by course policy" });
      [1, 2, 3, 4, 5].forEach(function (g) {
        s.appendChild(svg("line", { x1: X(g), x2: X(g), y1: 4, y2: h - 34, class: "c-grid" }));
        s.appendChild(svg("text", { x: X(g), y: h - 20, "text-anchor": "middle", class: "c-tick" }, String(g)));
      });
      s.appendChild(svg("text", { x: X(1), y: h - 4, "text-anchor": "start", class: "c-tick" }, "1 = very unclear"));
      s.appendChild(svg("text", { x: X(5), y: h - 4, "text-anchor": "end", class: "c-tick" }, "5 = very clear"));
      ROWS.forEach(function (c, i) {
        var y = 8 + i * rowH;
        var cy = sol ? y + rowH - 12 : (narrow ? y + rowH - 14 : y + rowH / 2);
        s.appendChild(svg("text", { x: narrow ? 0 : labelW, y: narrow ? y + 12 : cy + 4, "text-anchor": narrow ? "start" : "end", class: "c-label" }, POL[c].name));
        var m = meanFor(c);
        if (m === null) {
          s.appendChild(svg("text", { x: X(3), y: cy + 4, "text-anchor": "middle", class: "ae-muted-svg" },
            c === "none" ? "not in the clarity comparison" : "not reported for this group"));
          return;
        }
        if (sol && sol[c]) {
          var counts = sol[c], n = counts.reduce(function (a, b) { return a + b; }, 0);
          var maxC = Math.max.apply(null, counts);
          var bw = Math.min(22, (R - L) / 4 * 0.5);
          counts.forEach(function (k, j) {
            var hh = (rowH - (narrow ? 44 : 30)) * k / maxC;
            s.appendChild(svg("rect", { x: X(j + 1) - bw / 2, y: cy - 10 - hh, width: bw, height: hh, class: "ae-hist" }));
            if (k) s.appendChild(svg("text", { x: X(j + 1) + bw / 2 + 3, y: cy - 10 - hh + 9, "text-anchor": "start", class: "c-tick" }, String(k)));
          });
          var d = E.describe(counts);
          var tq = tQuantile(n - 1);
          var half = tq * d.sd / Math.sqrt(n);
          s.appendChild(svg("line", { x1: X(Math.max(1, d.mean - half)), x2: X(Math.min(5, d.mean + half)), y1: cy, y2: cy, class: "ae-ci" }));
        }
        s.appendChild(svg("circle", { cx: X(m), cy: cy, r: 6, class: c === "allowed" ? "ae-dot-low" : "ae-dot" }));
        s.appendChild(svg("text", { x: w - 2, y: cy + 4, "text-anchor": "end", class: "ae-val" }, fix(m, 2)));
      });
      chart.appendChild(s);

      // Readout
      read.innerHTML = "";
      var C = D.clarity;
      if (state.view === "all") {
        read.appendChild(note("Allowed (Informal) averages <strong>" + fix(C.mean.allowed, 2) + "</strong> out of 5 (n = 47); the three policies that say something definite average " +
          fix(C.mean.dis, 2) + " (Disallowed), " + fix(C.mean.enc, 2) + " (Encouraged), and " + fix(C.mean.crit, 2) + " (Critical Use). The gap is about two points on a five-point scale."));
      } else {
        var b = C.byLevel[state.view];
        read.appendChild(note((state.view === "ug" ? "Undergraduate" : "Graduate") + " reports: Allowed (Informal) " + fix(b.allowed.m, 2) + " (n = " + b.allowed.n + ") against Encouraged " +
          fix(b.enc.m, 2) + " (n = " + b.enc.n + "). The paper reports these two groups by level; the others are not split."));
      }
      if (deep && state.view === "all") {
        var r = getRecovered();
        if (r.sol) read.appendChild(compareTable(r.sol));
      }
      src.textContent = state.view === "all" ?
        "Paper, Results: clarity means, the Allowed SD, Welch t and d, F(3, 103), and H(3) · answer counts and intervals recovered by this page" :
        "Paper, Results: clarity by student level for Allowed (Informal) and Encouraged";
    }
    function meanFor(c) {
      if (c === "none") return null;
      if (state.view === "all") return D.clarity.mean[c];
      var b = D.clarity.byLevel[state.view];
      return b[c] ? b[c].m : null;
    }
    redraws.push(draw);
    draw();
  }

  function isDeep() {
    var lv = currentLevel();
    return lv === "grad" || lv === "res";
  }
  function currentLevel() {
    if (window.PaperKit && window.PaperKit.level) return window.PaperKit.level();
    var node = document.querySelector("[data-level]");
    return node ? node.getAttribute("data-level") : "public";
  }

  // Two-sided 95% t quantile by bisection on the engine's t distribution.
  function tQuantile(df) {
    var lo = 0, hi = 20;
    for (var i = 0; i < 80; i++) { var mid = (lo + hi) / 2; if (E.tTwoSided(mid, df) > 0.05) lo = mid; else hi = mid; }
    return (lo + hi) / 2;
  }

  function fmtP(p) { return p < 0.001 ? "< .001" : fix(p, 3).replace(/^0/, ""); }

  function compareTable(sol) {
    var groups = [sol.dis, sol.allowed, sol.enc, sol.crit];
    var a = E.anova(groups), k = E.kruskal(groups);
    var rows = [];
    ["dis", "enc", "crit"].forEach(function (g) {
      var w = E.welch(sol.allowed, sol[g]);
      rows.push(["Welch t, Allowed vs " + POL[g].short, fix(D.clarity.welch[g].t, 2), fix(w.t, 2) + " (df " + fix(w.df, 1) + ", p " + fmtP(w.p) + ")"]);
      rows.push(["Cohen's d, Allowed vs " + POL[g].short, fix(D.clarity.welch[g].d, 2), fix(w.d, 2) + " (average-variance d)"]);
    });
    rows.push(["One-way ANOVA F(3, 103)", fix(D.clarity.anova.F, 2), fix(a.F, 2) + " (p " + fmtP(a.p) + ")"]);
    rows.push(["Kruskal–Wallis H(3)", fix(D.clarity.kw.H, 1), fix(k.H, 1) + " with tie correction (" + fix(k.Hraw, 1) + " without)"]);
    [["dis", "enc"], ["dis", "crit"], ["enc", "crit"]].forEach(function (pr) {
      var w = E.welch(sol[pr[0]], sol[pr[1]]);
      rows.push(["Welch p, " + POL[pr[0]].short + " vs " + POL[pr[1]].short, "> .05", fmtP(w.p)]);
    });
    var tbl = el("table", { class: "ae-table" });
    tbl.appendChild(el("caption", { class: "w-note", text: "Printed statistics beside the same statistics computed by this page from the recovered answer counts." }));
    tbl.appendChild(el("thead", null, [el("tr", null, [el("th", { text: "Statistic" }), el("th", { text: "Paper" }), el("th", { text: "Page, from recovered counts" })])]));
    var tb = el("tbody");
    rows.forEach(function (r) { tb.appendChild(el("tr", null, r.map(function (x) { return el("td", { text: x }); }))); });
    tbl.appendChild(tb);
    var wrap = el("div", { class: "ae-table-wrap", "data-levels": "grad res" }, [tbl]);
    return wrap;
  }

  /* ------------------------------------------ demo 4: the task grid */

  function mountShadow(root) {
    var unit = segmented("Cell values", [
      { value: "pct", label: "Percent" },
      { value: "count", label: "Count of reports" }
    ], state.unit, function (v) { state.unit = v; draw(); });
    var actions = el("div", { class: "w-actions" }, [el("span", { class: "w-mono", text: "Show:" }), unit]);
    actions.setAttribute("data-levels", "hs ug grad res");
    var pickRow = el("div", { class: "w-actions" }, [el("span", { class: "w-mono", text: "Highlight:" }), catControl()]);
    var wrap = el("div", { class: "ae-table-wrap" });
    var read = el("div", { class: "ae-readout" });
    var src = el("p", { class: "w-source", text: "Paper, Table 2 · each column is the percent of that policy's reports; students could mark several tasks · counts recomputed from the printed percentages" });
    root.appendChild(pickRow);
    root.appendChild(actions);
    root.appendChild(wrap);
    root.appendChild(read);
    root.appendChild(src);

    function draw() {
      wrap.innerHTML = "";
      var tbl = el("table", { class: "ae-table ae-grid" });
      var hr = el("tr", null, [el("th", { text: "Task" })]);
      E.CATS.forEach(function (c) {
        hr.appendChild(el("th", { class: c === state.cat ? "is-on" : "", text: POL[c].short + " (" + D.n[c] + ")" }));
      });
      tbl.appendChild(el("thead", null, [hr]));
      var tb = el("tbody");
      var rows = D.tasks.map(function (t) { return { name: t.name, id: t.id, pct: t.pct }; });
      rows.push({ name: "At least one task", id: "any", pct: D.anyUse, strong: true });
      rows.push({ name: "Abstained entirely", id: "abstain", pct: D.abstain });
      rows.forEach(function (r) {
        var tr = el("tr", { class: r.strong ? "is-strong" : "" }, [el("td", { text: r.name })]);
        E.CATS.forEach(function (c) {
          var v = r.pct[c], k = t2[c][r.id];
          var txt = state.unit === "pct" ? pct(v) : k + "/" + D.n[c];
          tr.appendChild(el("td", { class: c === state.cat ? "is-on" : "" }, [
            el("span", { class: "ae-inbar" }, [el("span", { style: "width:" + v + "%" })]), " " + txt
          ]));
        });
        tb.appendChild(tr);
      });
      tbl.appendChild(tb);
      wrap.appendChild(tbl);

      read.innerHTML = "";
      var c = state.cat;
      var top = D.tasks.slice().sort(function (a, b) { return b.pct[c] - a.pct[c]; })[0];
      read.appendChild(note("In " + POL[c].name + " courses, the most common use is <strong>" + top.name.toLowerCase() + "</strong> (" + pct(top.pct[c]) +
        "). Critique of AI output, the task closest to checking its work, reaches " + pct(D.tasks[4].pct[c]) + " here, against " + pct(D.tasks[4].pct.crit) + " in Critical Use courses."));
      var ws = E.CATS.map(function (cc) {
        var w = E.wilson(t2[cc].any, D.n[cc]);
        return POL[cc].short + " " + fix(100 * w.lo, 0) + "–" + fix(100 * w.hi, 0) + "%";
      });
      read.appendChild(note("Wilson 95% intervals for “at least one task,” computed by this page: " + ws.join("; ") + ".", "grad res"));
    }
    catDraws.push(draw);
    draw();
  }

  /* ------------------------------------- demo 5: recovering the answers */

  function mountRecover(root) {
    var btn = el("button", { type: "button", class: "w-btn", text: "Run the search" });
    var out = el("div", { class: "ae-readout" });
    root.appendChild(el("div", { class: "w-actions" }, [btn, el("span", { class: "w-mono", text: "every answer table for 107 clarity ratings, about 0.3 million candidates" })]));
    root.appendChild(out);
    btn.addEventListener("click", function () {
      out.innerHTML = "";
      out.appendChild(note("Searching…"));
      setTimeout(function () {
        var t0 = performance.now();
        recovered = null;
        var r = getRecovered();
        var ms = performance.now() - t0;
        out.innerHTML = "";
        var tbl = el("table", { class: "ae-table" });
        tbl.appendChild(el("thead", null, [el("tr", null, [el("th", { text: "Constraint (printed value)" }), el("th", { text: "Answer tables left" })])]));
        var tb = el("tbody");
        r.run.steps.forEach(function (s) { tb.appendChild(el("tr", null, [el("td", { text: s.label }), el("td", { text: String(s.count) })])); });
        tbl.appendChild(tb);
        out.appendChild(el("div", { class: "ae-table-wrap" }, [tbl]));
        if (r.sol) {
          var t2b = el("table", { class: "ae-table" });
          t2b.appendChild(el("caption", { class: "w-note", text: "The one answer table that reproduces every printed clarity statistic (page's reconstruction, not printed in the paper)." }));
          t2b.appendChild(el("thead", null, [el("tr", null, ["Policy", "n", "1", "2", "3", "4", "5", "Mean", "SD"].map(function (x) { return el("th", { text: x }); }))]));
          var b2 = el("tbody");
          ["dis", "allowed", "enc", "crit"].forEach(function (c) {
            var d = E.describe(r.sol[c]);
            b2.appendChild(el("tr", null, [POL[c].name, String(d.n)].concat(r.sol[c].map(String)).concat([fix(d.mean, 3), fix(d.sd, 3)]).map(function (x) { return el("td", { text: x }); })));
          });
          t2b.appendChild(b2);
          out.appendChild(el("div", { class: "ae-table-wrap" }, [t2b]));
        }
        out.appendChild(note("Finished in " + fix(ms, 0) + " ms on this device. " + (r.sol ? "Exactly one table survives." : "No unique table survives.")));
        redraws.forEach(function (fn) { fn(); });
      }, 20);
    });
  }

  /* ---------------------------------------------------------------- mount */

  function mount(id, fn) {
    var node = document.getElementById(id);
    if (!node) return;
    node.classList.add("w-ready");
    fn(node);
  }
  function init() {
    mount("ae-ladder", mountLadder);
    mount("ae-timeline", mountTimeline);
    mount("ae-clarity", mountClarity);
    mount("ae-shadow", mountShadow);
    mount("ae-recover", mountRecover);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();

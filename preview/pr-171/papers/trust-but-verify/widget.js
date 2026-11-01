/*
  Trust but Verify widget for /papers/trust-but-verify/.
  Mount points in the page: #tv-you, #tv-familiar, #tv-verify, #tv-line, #tv-counts.

  Demo 1 lets the visitor mark their own uses of AI against Table 2.
  Demo 2 draws Table 1 (familiarity), demo 3 Table 3 (verification), and demo 4
  Tables 4 and 5 (impacts and attitudes). Demos 2 to 4 share one setting: where
  the line between "yes" and "no" is drawn on each answer scale.
  Demo 5 (graduate and researcher only) recovers the whole-number counts behind
  the percentages of Tables 3 to 5 and adds Wilson intervals; both are the
  page's own computations, not the paper's.
  All arithmetic lives in tv-engine.js.
*/
(function () {
  "use strict";

  var E = window.TrustVerifyEngine;
  var D = E.DATA;
  var SVGNS = "http://www.w3.org/2000/svg";

  // One state object; demos 2 to 4 obey state.cut.
  var state = {
    picks: {},
    cut: "paper",          // "top" | "paper" | "wide"
    line: "t4",            // demo 4: "t4" impacts or "t5" attitudes
    row: "t3:expl"         // demo 5: table and row
  };

  // Where "yes" starts on each scale (category index), per cut setting.
  var CUTS = {
    t1: { top: 3, paper: 2, wide: 1 },
    t3: { top: 4, paper: 3, wide: 2 },
    t4: { top: 4, paper: 3, wide: 2 },
    t5: { top: 6, paper: 5, wide: 4 }
  };
  var CUT_NAMES = {
    t1: { top: "Advanced or expert", paper: "Intermediate or more", wide: "Novice or more" },
    t3: { top: "Always", paper: "Most of the time or always", wide: "Sometimes or more" },
    t4: { top: "Significant", paper: "Some or significant", wide: "Average or more" },
    t5: { top: "Strongly agree", paper: "Agree or strongly agree", wide: "Somewhat agree or more" }
  };

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

  var redraws = [];
  var resizeTimer = null;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () { redraws.forEach(function (fn) { fn(); }); }, 150);
  });
  document.addEventListener("paperlevel", function () {
    // Charts hidden at the previous level had no width; draw them again.
    setTimeout(function () { redraws.forEach(function (fn) { fn(); }); }, 0);
  });

  function fix(x, d) { return Number(x).toFixed(d); }
  function p1(x) { return fix(E.round1(x), 1) + "%"; }

  function segmented(label, options, value, onChange) {
    var wrap = el("div", { class: "seg", role: "radiogroup", "aria-label": label });
    var buttons = options.map(function (opt) {
      var b = el("button", { type: "button", class: "seg-option", role: "radio", "data-value": String(opt.value), text: opt.label });
      if (opt.levels) b.setAttribute("data-levels", opt.levels);
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

  function note(text, levels) {
    var p = el("p", { class: "w-note", html: text });
    if (levels) p.setAttribute("data-levels", levels);
    return p;
  }

  // The shared "where is the line" control. Every copy stays in sync.
  var cutControls = [];
  var cutDraws = [];
  function cutControl() {
    var c = segmented("Where the line falls", [
      { value: "top", label: "Top box only" },
      { value: "paper", label: "The paper's line" },
      { value: "wide", label: "One box wider" }
    ], state.cut, function (v) {
      state.cut = v;
      cutControls.forEach(function (o) { o.set(v); });
      cutDraws.forEach(function (fn) { fn(); });
    });
    cutControls.push(c);
    return el("div", { class: "w-actions" }, [el("span", { class: "w-mono", text: "Count as yes:" }), c]);
  }

  // Shares at or above `from`, from printed percentages (Tables 3 to 5).
  function sumFrom(p, from) { return E.sumRounded(p, from, p.length - 1); }

  // One ruled row per item: label, a 100 percent stacked bar, and a share.
  // segs: array of percentages; from: first "yes" index; marker: printed value or null.
  function stackChart(chart, rows, scale, from, opts) {
    opts = opts || {};
    var w = chartWidth(chart);
    var narrow = w < 520;
    var labelW = narrow ? 0 : Math.min(230, Math.round(w * 0.32));
    var valW = 64;
    var barL = labelW + (narrow ? 0 : 10), barR = w - valW;
    var rowH = narrow ? 50 : 34;
    var top = 4;
    var h = top + rows.length * rowH + 26;
    var s = svg("svg", { viewBox: "0 0 " + w + " " + h, class: "tv-svg", role: "img", "aria-label": opts.aria || "Stacked bars" });
    function X(v) { return barL + (barR - barL) * v / 100; }
    rows.forEach(function (r, i) {
      var y = top + i * rowH;
      var barY = narrow ? y + 18 : y + 8, barH = 16;
      s.appendChild(svg("text", { x: narrow ? 0 : 0, y: narrow ? y + 12 : y + 20, class: "c-label" }, r.label));
      var acc = 0;
      r.segs.forEach(function (v, j) {
        var yes = j >= from;
        var depth = yes ? (j - from + 1) / (r.segs.length - from) : (from - j) / from;
        var rect = svg("rect", { x: X(acc), y: barY, width: Math.max(0, X(acc + v) - X(acc)), height: barH,
          class: yes ? "tv-seg-yes" : "tv-seg-no", "fill-opacity": fix(yes ? 0.45 + 0.55 * depth : 0.25 + 0.5 * depth, 2) });
        rect.appendChild(svg("title", {}, scale[j] + ": " + fix(v, 1) + "%" + (r.counts ? " (" + r.counts[j] + " students)" : "")));
        s.appendChild(rect);
        acc += v;
      });
      var yesShare = r.yes;
      s.appendChild(svg("line", { x1: X(100 - yesShare), x2: X(100 - yesShare), y1: barY - 4, y2: barY + barH + 4, class: "tv-cutline" }));
      s.appendChild(svg("text", { x: w, y: barY + 13, "text-anchor": "end", class: "tv-val" }, p1(yesShare)));
      if (r.marker !== null && r.marker !== undefined) {
        var g = svg("g", { class: "tv-paper" });
        g.appendChild(svg("line", { x1: X(100 - r.marker), x2: X(100 - r.marker), y1: barY - 6, y2: barY + barH + 6, class: "tv-mark" }));
        s.appendChild(g);
      }
    });
    var by = top + rows.length * rowH + 4;
    s.appendChild(svg("line", { x1: X(0), x2: X(100), y1: by, y2: by, class: "c-grid" }));
    [0, 25, 50, 75, 100].forEach(function (t) {
      s.appendChild(svg("text", { x: X(t), y: by + 14, "text-anchor": t === 0 ? "start" : t === 100 ? "end" : "middle", class: "c-tick" }, t + "%"));
    });
    chart.innerHTML = "";
    chart.appendChild(s);
  }

  function legendFor(scale, from) {
    var lg = el("div", { class: "c-legend w-mono" });
    scale.forEach(function (name, j) {
      var yes = j >= from;
      var depth = yes ? (j - from + 1) / (scale.length - from) : (from - j) / from;
      var sw = el("span", { class: "tv-sw " + (yes ? "tv-sw-yes" : "tv-sw-no") });
      sw.style.opacity = fix(yes ? 0.45 + 0.55 * depth : 0.25 + 0.5 * depth, 2);
      lg.appendChild(el("span", { class: "tv-lg" }, [sw, el("span", { text: name })]));
    });
    lg.appendChild(el("span", { class: "tv-lg" }, [el("span", { class: "tv-sw-mark" }), el("span", { text: "Printed total (the paper's line only)" })]));
    return lg;
  }

  /* ---------------------------------------------------------------- demo 1: your uses */

  function mountYou(root) {
    var rows = D.t2.rows;
    var pickRow = el("div", { class: "tv-picks", role: "group", "aria-label": "What you use AI for" });
    var buttons = rows.map(function (r) {
      var b = el("button", { type: "button", class: "tv-pick", "aria-pressed": "false", text: r.label });
      b.addEventListener("click", function () { state.picks[r.key] = !state.picks[r.key]; draw(); });
      pickRow.appendChild(b);
      return b;
    });
    var clear = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "Clear my picks" });
    clear.addEventListener("click", function () { state.picks = {}; draw(); });
    var chart = el("div", { class: "tv-chart" });
    var readout = el("div", { class: "tv-readout", "aria-live": "polite" });

    root.appendChild(el("p", { class: "w-big", text: "Pick every task you use generative AI for, as the students did." }));
    root.appendChild(el("p", { class: "w-source", text: "Question 4, choose all that apply · 147 students (Table 2)" }));
    root.appendChild(pickRow);
    root.appendChild(el("div", { class: "w-actions" }, [clear]));
    root.appendChild(chart);
    root.appendChild(readout);

    function draw() {
      buttons.forEach(function (b, i) { b.setAttribute("aria-pressed", state.picks[rows[i].key] ? "true" : "false"); });
      var w = chartWidth(chart);
      var narrow = w < 520;
      var labelW = narrow ? 0 : Math.min(240, Math.round(w * 0.34));
      var valW = 92, barL = labelW + (narrow ? 0 : 10), barR = w - valW;
      var rowH = narrow ? 44 : 28, top = 4;
      var h = top + rows.length * rowH + 24;
      var s = svg("svg", { viewBox: "0 0 " + w + " " + h, class: "tv-svg", role: "img", "aria-label": "Share of 147 students who use AI for each task" });
      function X(v) { return barL + (barR - barL) * v / 100; }
      rows.forEach(function (r, i) {
        var y = top + i * rowH, mine = !!state.picks[r.key];
        var barY = narrow ? y + 18 : y + 7;
        s.appendChild(svg("text", { x: 0, y: narrow ? y + 12 : y + 18, class: mine ? "c-label tv-mine" : "c-label" }, (mine ? "● " : "") + r.label));
        s.appendChild(svg("rect", { x: X(0), y: barY, width: X(100) - X(0), height: 14, class: "tv-track" }));
        var bar = svg("rect", { x: X(0), y: barY, width: X(r.pct) - X(0), height: 14, class: mine ? "tv-bar tv-bar-mine" : "tv-bar" });
        bar.appendChild(svg("title", {}, r.label + ": " + r.count + " of 147 students"));
        s.appendChild(bar);
        s.appendChild(svg("text", { x: w, y: barY + 12, "text-anchor": "end", class: "tv-val" }, fix(r.pct, 1) + "% · " + r.count));
      });
      var by = top + rows.length * rowH + 2;
      s.appendChild(svg("line", { x1: X(0), x2: X(100), y1: by, y2: by, class: "c-grid" }));
      [0, 50, 100].forEach(function (t) {
        s.appendChild(svg("text", { x: X(t), y: by + 14, "text-anchor": t === 0 ? "start" : t === 100 ? "end" : "middle", class: "c-tick" }, t + "%"));
      });
      chart.innerHTML = "";
      chart.appendChild(s);

      readout.innerHTML = "";
      var mine = rows.filter(function (r) { return state.picks[r.key]; });
      if (!mine.length) {
        readout.appendChild(el("p", { html: "Pick a task above. The two most common uses, <strong>debugging code</strong> (118 students) and <strong>understanding complex concepts</strong> (114), each drew more than three in four students." }));
      } else {
        var shared = mine.filter(function (r) { return r.pct >= 50; }).length;
        var rare = mine.filter(function (r) { return r.pct < 30; }).map(function (r) { return r.label.toLowerCase(); });
        readout.appendChild(el("p", { html: "You picked <strong>" + mine.length + "</strong> of nine tasks. " +
          (shared ? shared + (shared === 1 ? " of them was" : " of them were") + " chosen by more than half of the students. " : "None of your picks was chosen by more than half of the students. ") +
          (rare.length ? "Fewer than three in ten students chose " + rare.join(", ") + "." : "") }));
      }
      var totalPicks = E.sum(rows.map(function (r) { return r.count; }));
      readout.appendChild(note("Computed by this page: the nine counts add to " + totalPicks + " selections, an average of " + fix(totalPicks / D.n, 2) +
        " tasks per student (counting “Other” as one task). The paper reports the counts and percentages, not this average.", "grad res"));
    }
    redraws.push(draw);
    draw();
  }

  /* ---------------------------------------------------------------- demo 2: familiarity */

  function mountFamiliar(root) {
    var chart = el("div", { class: "tv-chart" });
    var legendWrap = el("div");
    var readout = el("div", { class: "tv-readout", "aria-live": "polite" });
    root.appendChild(el("p", { class: "w-big", text: "Familiarity with four kinds of AI tools" }));
    root.appendChild(el("p", { class: "w-source", text: "Question 3, five-point scale · 146 students per row, counts as printed (Table 1)" }));
    root.appendChild(cutControl());
    root.appendChild(chart);
    root.appendChild(legendWrap);
    root.appendChild(readout);

    function draw() {
      var from = CUTS.t1[state.cut];
      var rows = D.t1.rows.map(function (r) {
        var N = E.sum(r.counts);
        return { label: r.label, segs: r.pct, counts: r.counts, yes: E.pct(E.share(r.counts, from), N), marker: null };
      });
      stackChart(chart, rows, D.t1.scale, from, { aria: "Familiarity with four kinds of AI tools, 146 students" });
      legendWrap.innerHTML = "";
      legendWrap.appendChild(legendFor(D.t1.scale, from));
      legendWrap.lastChild.lastChild.style.display = "none";
      readout.innerHTML = "";
      var llm = D.t1.rows[0], code = D.t1.rows[1], spec = D.t1.rows[2];
      var llmYes = E.share(llm.counts, from);
      readout.appendChild(el("p", { html: "Counting <strong>" + CUT_NAMES.t1[state.cut].toLowerCase() + "</strong> as familiar: " +
        "<strong>" + llmYes + " of 146</strong> students (" + p1(E.pct(llmYes, 146)) + ") know large language models, against " +
        E.share(code.counts, from) + " for code generation tools and " + E.share(spec.counts, from) + " for specialized technical tools." }));
      if (state.cut === "paper") {
        readout.appendChild(el("p", { class: "tv-match", html: "✓ Matches the abstract: 69.2% at least intermediate with large language models; " +
          p1(E.pct(code.counts[0] + code.counts[1], 146)) + " novice or unfamiliar with code generation tools (printed 82.2%); " +
          p1(E.pct(spec.counts[0] + spec.counts[1], 146)) + " with specialized tools (printed 89.0%)." }));
      }
      readout.appendChild(note("Table 1 lists N = 146 on every row, one fewer than the 147 completed surveys.", "ug grad res"));
    }
    cutDraws.push(draw);
    redraws.push(draw);
    draw();
  }

  /* ---------------------------------------------------------------- demo 3: verification */

  function mountVerify(root) {
    var chart = el("div", { class: "tv-chart" });
    var legendWrap = el("div");
    var readout = el("div", { class: "tv-readout", "aria-live": "polite" });
    root.appendChild(el("p", { class: "w-big", text: "How often students check what AI gives them" }));
    root.appendChild(el("p", { class: "w-source", text: "Question 5, five-point frequency scale · percent within row, as printed (Table 3)" }));
    root.appendChild(cutControl());
    root.appendChild(chart);
    root.appendChild(legendWrap);
    root.appendChild(readout);

    function draw() {
      var t = D.t3, from = CUTS.t3[state.cut];
      var rows = t.rows.map(function (r) {
        return { label: r.label, segs: r.pct, yes: state.cut === "paper" ? r.high : sumFrom(r.pct, from), marker: state.cut === "paper" ? r.high : null };
      });
      stackChart(chart, rows, t.scale, from, { aria: "How often students verify four kinds of AI output" });
      legendWrap.innerHTML = "";
      legendWrap.appendChild(legendFor(t.scale, from));
      readout.innerHTML = "";
      var code = rows[0].yes, writing = rows[3].yes;
      readout.appendChild(el("p", { html: "Counting <strong>" + CUT_NAMES.t3[state.cut].toLowerCase() + "</strong> as checking: students check <strong>code " +
        fix(code, 1) + "%</strong> of the time against <strong>general writing " + fix(writing, 1) + "%</strong>, a gap of " + fix(code - writing, 1) + " percentage points." }));
      if (state.cut === "paper") readout.appendChild(el("p", { class: "tv-match", text: "✓ At the paper's line the readouts show Table 3's printed totals: 67.8, 56.9, 48.9, and 43.8 percent." }));
      else readout.appendChild(note("The paper reports totals only for its own line (“most of the time” or “always”), so no printed marker appears at this setting."));
      readout.appendChild(note("At the other two lines, shares add the table's printed percentages; the counts behind them appear in the last demo.", "grad res"));
    }
    cutDraws.push(draw);
    redraws.push(draw);
    draw();
  }

  /* ---------------------------------------------------------------- demo 4: impacts and attitudes */

  function mountLine(root) {
    var pick = segmented("Which table", [
      { value: "t4", label: "Impact on how I work" },
      { value: "t5", label: "Attitudes toward AI" }
    ], state.line, function (v) { state.line = v; draw(); });
    var chart = el("div", { class: "tv-chart" });
    var legendWrap = el("div");
    var title = el("p", { class: "w-big" });
    var source = el("p", { class: "w-source" });
    var readout = el("div", { class: "tv-readout", "aria-live": "polite" });
    root.appendChild(el("div", { class: "w-actions" }, [pick]));
    root.appendChild(title);
    root.appendChild(source);
    root.appendChild(cutControl());
    root.appendChild(chart);
    root.appendChild(legendWrap);
    root.appendChild(readout);

    function draw() {
      var key = state.line, t = D[key], from = CUTS[key][state.cut];
      title.textContent = key === "t4" ? "How much AI has changed the way students work" : "What students believe AI does for them";
      source.textContent = key === "t4" ? "Question 6, five-point impact scale · percent within row, as printed (Table 4)" :
        "Question 7, seven-point agreement scale · percent within statement, as printed (Table 5); row labels follow the paper's; the full statements are not printed";
      var rows = t.rows.map(function (r) {
        return { label: r.short && chartWidth(chart) < 520 ? r.short : r.label, segs: r.pct, yes: state.cut === "paper" ? r.high : sumFrom(r.pct, from), marker: state.cut === "paper" ? r.high : null };
      });
      stackChart(chart, rows, t.scale, from, { aria: key === "t4" ? "Perceived impact of AI on five aspects of work" : "Agreement with four statements about AI" });
      legendWrap.innerHTML = "";
      legendWrap.appendChild(legendFor(t.scale, from));
      readout.innerHTML = "";
      if (key === "t4") {
        var best = rows.slice().sort(function (a, b) { return b.yes - a.yes; });
        readout.appendChild(el("p", { html: "Counting <strong>" + CUT_NAMES.t4[state.cut].toLowerCase() + "</strong> as a change: the largest share is <strong>" +
          best[0].label.toLowerCase() + " (" + fix(best[0].yes, 1) + "%)</strong> and the smallest is " + best[best.length - 1].label.toLowerCase() + " (" + fix(best[best.length - 1].yes, 1) + "%)." }));
        if (state.cut === "paper") readout.appendChild(el("p", { class: "tv-match", text: "✓ At the paper's line the readouts show Table 4's printed totals: programming 36.6, learning 33.1, writing 18.6 percent." }));
      } else {
        var u = rows[0].yes, rel = rows[3].yes;
        readout.appendChild(el("p", { html: "Counting <strong>" + CUT_NAMES.t5[state.cut].toLowerCase() + "</strong> as agreement: <strong>" + fix(u, 1) +
          "%</strong> say AI has improved their understanding, and <strong>" + fix(rel, 1) + "%</strong> say they rely heavily on it." }));
        if (state.cut === "paper") readout.appendChild(el("p", { class: "tv-match", text: "✓ The paper's abstract reports 69.9% and 9.7% at this line." }));
        if (state.cut === "wide") readout.appendChild(note("Adding “somewhat agree” moves the understanding share from 69.9 to " + fix(u, 1) +
          " percent and doubles the reliance share. Both readings come from the same answers; the paper states which one it reports."));
      }
      if (state.cut !== "paper") readout.appendChild(note("The paper prints totals only for its own line, so no printed marker appears at this setting."));
    }
    cutDraws.push(draw);
    redraws.push(draw);
    draw();
  }

  /* ---------------------------------------------------------------- demo 5: counts behind the percentages */

  function mountCounts(root) {
    var options = [];
    [["t3", "Table 3"], ["t4", "Table 4"], ["t5", "Table 5"]].forEach(function (tk) {
      D[tk[0]].rows.forEach(function (r) { options.push({ value: tk[0] + ":" + r.key, label: tk[1] + " · " + (r.short || r.label) }); });
    });
    var select = el("select", { class: "tv-select", "aria-label": "Row to reconstruct" });
    options.forEach(function (o) { var op = el("option", { value: o.value, text: o.label }); if (o.value === state.row) op.selected = true; select.appendChild(op); });
    select.addEventListener("change", function () { state.row = select.value; draw(); });
    var runAll = el("button", { type: "button", class: "w-btn", text: "Search all 13 rows" });
    var detail = el("div", { class: "tv-detail" });
    var summary = el("div", { class: "tv-summary" });
    runAll.addEventListener("click", function () { drawSummary(); });

    root.appendChild(el("p", { class: "w-big", text: "The whole numbers of students behind each row of percentages" }));
    root.appendChild(el("p", { class: "w-source", text: "Computed by this page · every N from 1 to 147, every count within 0.05 points of each printed percentage" }));
    root.appendChild(el("div", { class: "w-actions" }, [select, runAll]));
    root.appendChild(detail);
    root.appendChild(summary);

    function draw() {
      var parts = state.row.split(":"), tk = parts[0], t = D[tk];
      var row = t.rows.filter(function (r) { return r.key === parts[1]; })[0];
      var t0 = performance.now();
      var res = E.reconstruct(row.pct);
      var ms = performance.now() - t0;
      detail.innerHTML = "";
      detail.appendChild(el("p", { html: "Tried <strong>" + res.tried + "</strong> sample sizes and " + res.combos.toLocaleString("en-US") + (res.combos === 1 ? " candidate combination in " : " candidate combinations in ") + fix(ms, 1) +
        " ms. Solutions whose counts add to N: <strong>" + res.solutions.length + "</strong>." }));
      if (res.solutions.length !== 1) { detail.appendChild(note("No unique solution; the page shows none.")); return; }
      var sol = res.solutions[0], N = sol.N, from = CUTS[tk].paper;
      var wrap = el("div", { class: "tv-table-wrap" });
      var table = el("table", { class: "tv-table" });
      var head = el("tr", {}, [el("th", { text: "Answer" }), el("th", { text: "Printed %" }), el("th", { text: "Count" }), el("th", { text: "Count ÷ " + N })]);
      table.appendChild(el("thead", {}, [head]));
      var body = el("tbody");
      t.scale.forEach(function (name, j) {
        body.appendChild(el("tr", {}, [el("td", { text: name }), el("td", { text: fix(row.pct[j], 1) }), el("td", { text: String(sol.counts[j]) }), el("td", { text: fix(E.pct(sol.counts[j], N), 2) })]));
      });
      table.appendChild(body);
      wrap.appendChild(table);
      detail.appendChild(wrap);

      var k = E.share(sol.counts, from), fromCounts = E.round1(E.pct(k, N)), fromSum = sumFrom(row.pct, from);
      var ci = E.wilson(k, N);
      var lines = [
        "N = <strong>" + N + "</strong> answered this row" + (N < D.n ? " (" + (["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"][D.n - N] || String(D.n - N)) + " of the 147 left it blank)" : "") + ".",
        t.highLabel + " (" + CUT_NAMES[tk].paper.toLowerCase() + "): printed <strong>" + fix(row.high, 1) + "</strong>; from the counts, " + k + " ÷ " + N + " = <strong>" + fix(fromCounts, 1) +
          "</strong>; adding the printed parts gives <strong>" + fix(fromSum, 1) + "</strong>. " +
          (fromCounts === row.high && fromSum === row.high ? "All three agree." : fromCounts === row.high ? "The printed total matches the counts." : "The printed total matches the sum of rounded parts.")
      ];
      if (t.lowTo >= 0) {
        var kl = E.sum(sol.counts.slice(0, t.lowTo + 1)), lowCounts = E.round1(E.pct(kl, N)), lowSum = E.sumRounded(row.pct, 0, t.lowTo);
        lines.push(t.lowLabel + ": printed <strong>" + fix(row.low, 1) + "</strong>; from the counts <strong>" + fix(lowCounts, 1) + "</strong>; sum of printed parts <strong>" + fix(lowSum, 1) + "</strong>.");
      }
      lines.push("Wilson 95% interval for the " + t.highLabel.toLowerCase() + ": <strong>" + fix(100 * ci[0], 1) + "% to " + fix(100 * ci[1], 1) + "%</strong> (the page's own; it treats the respondents as a simple random sample, which a convenience survey is not).");
      lines.forEach(function (h) { detail.appendChild(el("p", { html: h })); });
    }

    function drawSummary() {
      summary.innerHTML = "";
      var wrap = el("div", { class: "tv-table-wrap" });
      var table = el("table", { class: "tv-table" });
      table.appendChild(el("thead", {}, [el("tr", {}, [el("th", { text: "Row" }), el("th", { text: "Solutions" }), el("th", { text: "N" }), el("th", { text: "Counts" }), el("th", { text: "Printed total" }), el("th", { text: "From counts" }), el("th", { text: "Sum of parts" })])]));
      var body = el("tbody"), unique = 0, matchCounts = 0, matchSum = 0, rowsN = 0;
      ["t3", "t4", "t5"].forEach(function (tk) {
        D[tk].rows.forEach(function (r) {
          var res = E.reconstruct(r.pct), from = CUTS[tk].paper;
          rowsN++;
          if (res.solutions.length === 1) unique++;
          var sol = res.solutions[0];
          var fc = sol ? E.round1(E.pct(E.share(sol.counts, from), sol.N)) : NaN, fs = sumFrom(r.pct, from);
          if (fc === r.high) matchCounts++;
          if (fs === r.high) matchSum++;
          body.appendChild(el("tr", {}, [el("td", { text: "Table " + tk.slice(1) + " · " + (r.short || r.label) }), el("td", { text: String(res.solutions.length) }),
            el("td", { text: sol ? String(sol.N) : "–" }), el("td", { text: sol ? sol.counts.join(", ") : "–" }), el("td", { text: fix(r.high, 1) }),
            el("td", { class: fc === r.high ? "" : "tv-diff", text: fix(fc, 1) }), el("td", { class: fs === r.high ? "" : "tv-diff", text: fix(fs, 1) })]));
        });
      });
      table.appendChild(body);
      wrap.appendChild(table);
      summary.appendChild(el("p", { class: "tv-match", text: unique + " of " + rowsN + " rows have exactly one solution. The printed high or agree total matches the counts on " +
        matchCounts + " rows and the sum of the printed parts on " + matchSum + "." }));
      summary.appendChild(wrap);
    }

    redraws.push(function () {});
    draw();
  }

  /* ---------------------------------------------------------------- mount */

  function mount(id, fn) {
    var node = document.getElementById(id);
    if (!node) return;
    fn(node);
    node.classList.add("w-ready");
  }
  function init() {
    mount("tv-you", mountYou);
    mount("tv-familiar", mountFamiliar);
    mount("tv-verify", mountVerify);
    mount("tv-line", mountLine);
    mount("tv-counts", mountCounts);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();

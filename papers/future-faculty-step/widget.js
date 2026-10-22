/*
  Project STEP widget for /papers/future-faculty-step/.
  Mount points in the page: #ff-wheel, #ff-goals, #ff-students, #ff-fellows.

  Demo 1 draws the Fellow training cycle the paper names (summer planning class,
         practicum, mentoring, and reflection) beside a year of placement.
  Demo 2 maps the program's three goals to the evaluation methods the paper
         lists, and marks which of them have results printed in the paper.
  Demo 3 draws Figures 2 and 3 (2008-2009 student feedback sheets) and checks
         every printed percentage against the sheet count that produces it.
  Demo 4 draws the 12 Fellows who answered the online survey and asks which
         whole count of them each printed percentage can be.
  All arithmetic lives in ff-engine.js.
*/
(function () {
  "use strict";

  var E = window.FutureFacultyEngine;
  var SVGNS = "http://www.w3.org/2000/svg";
  var N_SHEETS = E.sharedDenominators(300, 20000)[0]; // 355, found from the printed percents

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
    setTimeout(function () { redraws.forEach(function (fn) { fn(); }); }, 0);
  });

  function currentLevel() {
    var a = document.querySelector("[data-level]");
    if (a && a.getAttribute("data-level")) return a.getAttribute("data-level");
    var m = /[?&]level=([a-z]+)/.exec(location.search);
    return m ? m[1] : "public";
  }

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

  function note(html, levels) {
    var p = el("p", { class: "w-note", html: html });
    if (levels) p.setAttribute("data-levels", levels);
    return p;
  }

  function words(n) {
    var w = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
    return n < 10 ? w[n] : String(n);
  }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function fmt1(x) { return x.toFixed(1); }

  /* ---------------------------------------------------------------- demo 1: the training cycle */

  var SPOKES = [
    { key: "summer", name: "Summer planning class", when: "Summer",
      body: "Before the school year, Fellows take an instructional planning class and teach short lessons of 10 to 15 minutes to get used to a classroom. The instructor gauges how each Fellow communicates, interviews them about comfort and confidence, and adds training where they seem weakest.",
      data: "Planning-class work; the instructor's informal read of each Fellow (no scores reported)" },
    { key: "practicum", name: "Practicum", when: "Every week, all year",
      body: "A weekly practicum class runs through the school year. Fellows bring what happened in their classrooms, and the group treats each incident as shared learning.",
      data: "Practicum records" },
    { key: "mentor", name: "Mentoring", when: "All year",
      body: "Each Fellow meets with faculty mentors and, every two weeks, with the high school teachers they work beside: usually two in mathematics and two in science.",
      data: "Notes from teacher and mentor meetings" },
    { key: "reflect", name: "Reflection", when: "Every week",
      body: "Fellows write weekly reflections and keep self-reflection notes from the meetings with their teachers.",
      data: "Weekly reflections" }
  ];

  // A year of placement. Months are drawn only where the paper names them.
  var YEAR = [
    { key: "summer", label: "Summer class", from: 0, to: 2, row: 0, levels: "" },
    { key: "practicum", label: "Weekly practicum", from: 2, to: 12, row: 1, levels: "" },
    { key: "class", label: "About 20 hours a week in school", from: 2, to: 12, row: 2, levels: "" },
    { key: "mentor", label: "Teacher meetings every two weeks", from: 2, to: 12, row: 3, levels: "" },
    { key: "reflect", label: "Weekly reflections", from: 2, to: 12, row: 4, levels: "" }
  ];
  var MARKS = [
    { at: 10, label: "Open House (April)", row: 5 },
    { at: 11, label: "15 RTOP observations done (end of May)", row: 6 }
  ];
  var MONTHS = ["Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May"];
  // Month index 0 = June. Summer class June-July; school year August-May.

  function mountWheel(root) {
    var state = { sel: "summer" };

    root.appendChild(el("p", { class: "w-source", text: "Paper, Abstract and Training of the Fellows: the four parts of a Fellow's preparation" }));

    var stats = el("div", { class: "ff-stats" });
    [
      [String(E.PROGRAM.fellows), "Fellows, 2006 to 2009"],
      [String(E.PROGRAM.teachers), "high school teachers"],
      ["about " + words(E.PROGRAM.schoolsPerYear), "partner high schools a year"],
      [cap(words(E.PROGRAM.teachersPerFellow)), "teachers per Fellow"],
      [E.PROGRAM.hoursPerWeek + " h", "a week in school"],
      [E.PROGRAM.lessons + "+", "lessons created"],
      ["3,000+", "students reached in three years"]
    ].forEach(function (s) {
      stats.appendChild(el("div", { class: "ff-stat" }, [el("span", { class: "ff-stat-n", text: s[0] }), el("span", { class: "ff-stat-l", text: s[1] })]));
    });
    root.appendChild(stats);

    var grid = el("div", { class: "ff-wheel-grid" });
    var wheelBox = el("div", { class: "ff-wheel-box" });
    var detail = el("div", { class: "ff-wheel-detail", "aria-live": "polite" });
    grid.appendChild(wheelBox);
    grid.appendChild(detail);
    root.appendChild(grid);

    var rows = el("div", { class: "ff-rows", role: "radiogroup", "aria-label": "Part of the training cycle" });
    var rowBtns = SPOKES.map(function (s, i) {
      var b = el("button", { type: "button", class: "ff-srow", role: "radio", "data-key": s.key }, [
        el("span", { class: "ff-snum", text: String(i + 1) }),
        el("span", { class: "ff-stitle", text: s.name }),
        el("span", { class: "ff-swhen", text: s.when })
      ]);
      b.addEventListener("click", function () { state.sel = s.key; draw(); });
      rows.appendChild(b);
      return b;
    });
    root.appendChild(rows);

    var yearBox = el("div", { class: "ff-chart" });
    root.appendChild(el("p", { class: "w-mono", text: "One year of placement" }));
    root.appendChild(yearBox);
    root.appendChild(note("The paper names the months only for the Open House (April) and the observations (by the end of May). Summer is drawn as June and July, and the school year as August to May, for layout; the Fellow Showcase and Technology Workshop happen during the year on dates the paper does not give."));
    root.appendChild(note("Which record each part produces: " + SPOKES.map(function (s) { return "<strong>" + s.name.toLowerCase() + "</strong>, " + s.data.charAt(0).toLowerCase() + s.data.slice(1); }).join("; ") + ". The paper says these feed its analysis of the Fellows' ability to explain their research and reports no scores from them.", "ug grad res"));

    function drawWheel() {
      wheelBox.innerHTML = "";
      var size = 240, c = size / 2, R = 108, r0 = 40;
      var s = svg("svg", { viewBox: "0 0 " + size + " " + size, class: "ff-svg ff-wheel", role: "img", "aria-label": "Training cycle with four parts around the Fellow" });
      SPOKES.forEach(function (sp, i) {
        var a0 = -Math.PI / 2 + i * Math.PI / 2 + 0.03, a1 = a0 + Math.PI / 2 - 0.06;
        var p = function (rad, a) { return [c + rad * Math.cos(a), c + rad * Math.sin(a)]; };
        var A = p(R, a0), B = p(R, a1), C = p(r0, a1), D = p(r0, a0);
        var d = "M" + A + " A" + R + " " + R + " 0 0 1 " + B + " L" + C + " A" + r0 + " " + r0 + " 0 0 0 " + D + " Z";
        var seg = svg("path", { d: d, class: "ff-spoke" + (state.sel === sp.key ? " ff-spoke-on" : ""), tabindex: "0", role: "button", "aria-label": sp.name });
        seg.addEventListener("click", function () { state.sel = sp.key; draw(); });
        seg.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); state.sel = sp.key; draw(); } });
        s.appendChild(seg);
        var mid = (a0 + a1) / 2, L = p((R + r0) / 2, mid);
        var lines = sp.name.split(" ");
        var t = svg("text", { x: L[0], y: L[1] - (lines.length - 1) * 6, class: "ff-spoke-t" + (state.sel === sp.key ? " ff-spoke-t-on" : ""), "text-anchor": "middle" });
        lines.forEach(function (w, j) { t.appendChild(svg("tspan", { x: L[0], dy: j ? 12 : 0 }, w)); });
        s.appendChild(t);
      });
      s.appendChild(svg("circle", { cx: c, cy: c, r: r0 - 6, class: "ff-hub" }));
      s.appendChild(svg("text", { x: c, y: c + 4, class: "ff-hub-t", "text-anchor": "middle" }, "Fellow"));
      wheelBox.appendChild(s);
    }

    function drawDetail() {
      var sp = SPOKES.filter(function (x) { return x.key === state.sel; })[0];
      detail.innerHTML = "";
      detail.appendChild(el("p", { class: "ff-tag", text: sp.when }));
      detail.appendChild(el("p", { class: "ff-dname", text: sp.name }));
      detail.appendChild(el("p", { class: "ff-dbody", text: sp.body }));
      var rec = el("p", { class: "w-mono", text: "Record it produces: " + sp.data });
      rec.setAttribute("data-levels", "ug grad res");
      detail.appendChild(rec);
    }

    function drawYear() {
      yearBox.innerHTML = "";
      var W = chartWidth(yearBox), padL = 8, padR = 8, top = 18, rowH = 22;
      var nRows = 7, H = top + nRows * rowH + 6;
      var x = function (m) { return padL + (W - padL - padR) * m / 12; };
      var s = svg("svg", { viewBox: "0 0 " + W + " " + H, width: W, height: H, class: "ff-svg", role: "img", "aria-label": "A year of placement from summer through May" });
      MONTHS.forEach(function (mo, i) {
        s.appendChild(svg("line", { x1: x(i), x2: x(i), y1: top - 4, y2: H - 4, class: "c-grid" }));
        if (W >= 420 || i % 2 === 0) s.appendChild(svg("text", { x: x(i) + 3, y: 11, class: "c-tick" }, mo));
      });
      var selMap = { summer: "summer", practicum: "practicum", mentor: "mentor", reflect: "reflect" };
      YEAR.forEach(function (b) {
        var on = selMap[state.sel] === b.key;
        var y = top + b.row * rowH;
        s.appendChild(svg("rect", { x: x(b.from), y: y, width: x(b.to) - x(b.from) - 1, height: rowH - 6, class: "ff-yb" + (on ? " ff-yb-on" : "") + (b.key === "class" ? " ff-yb-class" : "") }));
        s.appendChild(svg("text", { x: x(b.from) + 5, y: y + rowH - 10, class: "c-label ff-yb-t" + (on ? " ff-yb-t-on" : "") }, b.label));
      });
      MARKS.forEach(function (m) {
        var y = top + m.row * rowH, cx = x(m.at) + (x(1) - x(0)) / 2;
        s.appendChild(svg("path", { d: "M" + cx + " " + (y + 1) + " l6 7 l-6 7 l-6 -7 Z", class: "ff-mark" }));
        var right = cx > W * 0.55;
        s.appendChild(svg("text", { x: right ? cx - 10 : cx + 10, y: y + 12, class: "c-label", "text-anchor": right ? "end" : "start" }, m.label));
      });
      yearBox.appendChild(s);
    }

    function draw() {
      rowBtns.forEach(function (b) {
        var on = b.getAttribute("data-key") === state.sel;
        b.setAttribute("aria-checked", on ? "true" : "false");
        b.classList.toggle("ff-srow-on", on);
      });
      drawWheel(); drawDetail(); drawYear();
    }
    redraws.push(drawYear);
    draw();
    root.classList.add("w-ready");
  }

  /* ---------------------------------------------------------------- demo 2: goals and evidence */

  var GOALS = [
    { key: "g1", name: "Train, energize, and sustain Fellows", short: "Train Fellows",
      methods: [
        { name: "RTOP classroom observations", detail: "Recorded lessons rated with the Revised Teaching Observation Protocol (RTOP) in five areas; 15 observations by the end of May each year; summaries go back to each Fellow.", status: "collected" },
        { name: "Online survey of past Fellows", detail: "12 of the 15 Fellows from 2006 to 2009 answered. Percentages appear in the text and Figure 4 (demo 4 below).", status: "reported" },
        { name: "Reflections and instructor interviews", detail: "Weekly reflections and the summer instructor's interviews about comfort and confidence. The paper says no formal measure of training impact exists.", status: "collected" }
      ] },
    { key: "g2", name: "Build hierarchical, expandable STEM lessons and raise student learning", short: "Student learning",
      methods: [
        { name: "Pre- and post-tests for each lesson", detail: "Given and analyzed for each lesson; no results appear in the paper.", status: "collected" },
        { name: "Student activity feedback sheets", detail: "2008-2009 sheets for all lessons, two prompts, printed as Figures 2 and 3 (demo 3 below).", status: "reported" }
      ] },
    { key: "g3", name: "Sustain the project beyond NSF funding", short: "Sustainability",
      methods: [
        { name: "Annual focus groups", detail: "With Fellows, teachers, and principal investigators; no findings appear in the paper.", status: "collected" },
        { name: "Yearly events", detail: "The Fellow Showcase, the Technology Workshop, and the STEP Open House each April; described, with no attendance or outcome data.", status: "described" }
      ] }
  ];
  var STATUS = {
    reported: { label: "Results printed", cls: "ff-st-rep" },
    collected: { label: "Collected, no results printed", cls: "ff-st-col" },
    described: { label: "Described only", cls: "ff-st-des" }
  };

  function mountGoals(root) {
    var state = { goal: "all" };
    root.appendChild(el("p", { class: "w-source", text: "Paper, Evaluation Methods Based on Goals: three long-term goals and how each is measured" }));
    var ctl = el("div", { class: "w-actions" });
    ctl.appendChild(segmented("Goal", [{ value: "all", label: "All goals" }].concat(GOALS.map(function (g, i) { return { value: g.key, label: (i + 1) + ". " + g.short }; })), state.goal, function (v) { state.goal = v; draw(); }));
    root.appendChild(ctl);
    var tally = el("div", { class: "ff-chart" });
    root.appendChild(tally);
    var summary = el("p", { class: "w-big", "aria-live": "polite" });
    root.appendChild(summary);
    var list = el("div", { class: "ff-ev" });
    root.appendChild(list);

    function draw() {
      list.innerHTML = "";
      var goals = GOALS.filter(function (g) { return state.goal === "all" || g.key === state.goal; });
      var counts = { reported: 0, collected: 0, described: 0 }, total = 0;
      goals.forEach(function (g, gi) {
        var gNum = GOALS.indexOf(g) + 1;
        list.appendChild(el("p", { class: "ff-ghead", text: "Goal " + gNum + ". " + g.name }));
        g.methods.forEach(function (m) {
          counts[m.status]++; total++;
          var st = STATUS[m.status];
          list.appendChild(el("div", { class: "ff-evrow" }, [
            el("span", { class: "ff-evname", text: m.name }),
            el("span", { class: "ff-evdetail", text: m.detail }),
            el("span", { class: "ff-evst " + st.cls, text: st.label })
          ]));
        });
      });
      // tally bar
      tally.innerHTML = "";
      var W = chartWidth(tally), H = 34, pad = 2;
      var s = svg("svg", { viewBox: "0 0 " + W + " " + H, width: W, height: H, class: "ff-svg", role: "img", "aria-label": counts.reported + " of " + total + " methods have printed results" });
      var x = pad, unit = (W - 2 * pad) / total;
      ["reported", "collected", "described"].forEach(function (k) {
        for (var i = 0; i < counts[k]; i++) {
          s.appendChild(svg("rect", { x: x + 1, y: 4, width: unit - 3, height: 22, class: "ff-tb " + STATUS[k].cls + "-f" }));
          x += unit;
        }
      });
      tally.appendChild(s);
      summary.textContent = counts.reported === 0 ? "Neither evaluation method for this goal has results printed in the paper." : cap(words(counts.reported)) + " of " + words(total) + " evaluation methods " + (state.goal === "all" ? "across the three goals " : "for this goal ") + (counts.reported === 1 ? "has" : "have") + " results printed in the paper.";
    }
    redraws.push(draw);
    draw();
    root.appendChild(el("div", { class: "c-legend" }, [
      el("span", { class: "lg ff-lg-rep", text: "Results printed" }),
      el("span", { class: "lg ff-lg-col", text: "Collected, no results printed" }),
      el("span", { class: "lg ff-lg-des", text: "Described only" })
    ]));
    root.classList.add("w-ready");
  }

  /* ---------------------------------------------------------------- demo 3: what students said */

  function mountStudents(root) {
    var state = { base: "sheets" };
    root.appendChild(el("p", { class: "w-source", text: "Paper, Figures 2 and 3: 2008-2009 student activity feedback sheets, all lessons" }));
    var ctl = el("div", { class: "w-actions" });
    ctl.setAttribute("data-levels", "grad res");
    ctl.appendChild(el("span", { class: "w-mono", text: "Divide by" }));
    var seg = segmented("Divide by", [
      { value: "sheets", label: "All " + N_SHEETS + " sheets" },
      { value: "answered", label: "Students who answered" }
    ], state.base, function (v) { state.base = v; state.touched = true; draw(); });
    ctl.appendChild(seg);
    root.appendChild(ctl);
    var chart = el("div", { class: "ff-chart" });
    root.appendChild(chart);
    var legend = el("div", { class: "c-legend" });
    root.appendChild(legend);
    var big = el("p", { class: "w-big", "aria-live": "polite" });
    root.appendChild(big);
    var tables = el("div", { class: "ff-tables" });
    tables.setAttribute("data-levels", "grad res");
    root.appendChild(tables);
    var gradNote = el("p", { class: "w-note" });
    gradNote.setAttribute("data-levels", "grad res");
    root.appendChild(gradNote);
    root.appendChild(note("The paper prints each table's total row as 325 (91.5%) and 353 (99.4%) without a denominator. The page searched every whole number of sheets from 300 to 20,000: only " + N_SHEETS + " turns all ten printed percentages and both totals into the printed values, so " + N_SHEETS + " sheets were collected and 30 and two were left blank on these prompts. The paper never states " + N_SHEETS + "; the page infers it.", "grad res"));
    root.appendChild(note("Each bar divides by the students who answered that prompt (325 and 353). The paper's printed percentages use a slightly larger base that includes sheets left blank; the graduate and researcher levels show how the page recovered it.", "public hs ug"));

    var CLS = ["ff-o1", "ff-o2", "ff-o3", "ff-o4", "ff-o5"];

    function draw() {
      var lvl = currentLevel();
      if (lvl !== "grad" && lvl !== "res") state.base = "answered";
      else if (!state.touched) state.base = "sheets";
      seg.set(state.base);
      chart.innerHTML = "";
      var W = chartWidth(chart), labW = 0, top = 6, barH = 30, gap = 40;
      var H = top + E.TABLES.length * (barH + gap) + 18;
      var s = svg("svg", { viewBox: "0 0 " + W + " " + H, width: W, height: H, class: "ff-svg", role: "img", "aria-label": "Stacked bars of student answers to the two feedback prompts" });
      var x0 = labW + 4, x1 = W - 6;
      E.TABLES.forEach(function (t, ti) {
        var y = top + ti * (barH + gap) + (labW ? 0 : 16);
        s.appendChild(svg("text", { x: x0, y: y - 5, class: "c-label" }, "Fig. " + t.fig + ": " + (W < 600 ? t.short : "\u201c" + t.prompt + "\u201d") + " (n = " + (state.base === "sheets" ? N_SHEETS + " sheets" : E.sum(t.freq) + " answered") + ")"));
        var d = state.base === "sheets" ? N_SHEETS : E.sum(t.freq);
        var x = x0;
        t.freq.forEach(function (f, i) {
          var w = (x1 - x0) * f / d;
          s.appendChild(svg("rect", { x: x, y: y, width: Math.max(0, w - 0.5), height: barH, class: "ff-seg " + CLS[i] }));
          if (w > 30) s.appendChild(svg("text", { x: x + w / 2, y: y + barH / 2 + 4, "text-anchor": "middle", class: "ff-in " + (i >= 3 ? "ff-in-dark" : "ff-in-light") }, Math.round(100 * f / d) + "%"));
          x += w;
        });
        if (state.base === "sheets") {
          var miss = N_SHEETS - E.sum(t.freq), w2 = (x1 - x0) * miss / N_SHEETS;
          s.appendChild(svg("rect", { x: x, y: y, width: Math.max(0, w2 - 0.5), height: barH, class: "ff-seg ff-miss" }));
        }
      });
      // axis
      var yAx = H - 6;
      [0, 25, 50, 75, 100].forEach(function (p) {
        var xx = x0 + (x1 - x0) * p / 100;
        s.appendChild(svg("text", { x: xx, y: yAx, class: "c-tick", "text-anchor": p === 0 ? "start" : p === 100 ? "end" : "middle" }, p + "%"));
      });
      chart.appendChild(s);

      legend.innerHTML = "";
      ["Lowest (Poor; Strongly disagree)", "Fair; Disagree", "Average; Neutral", "Good; Agree", "Highest (Excellent; Strongly agree)"].forEach(function (lab, i) {
        legend.appendChild(el("span", { class: "lg ff-lg-" + (i + 1), text: lab }));
      });
      if (state.base === "sheets") legend.appendChild(el("span", { class: "lg ff-lg-miss", text: "Left blank" }));

      var r = E.topTwo(E.TABLES[0], state.base, N_SHEETS), l = E.topTwo(E.TABLES[1], state.base, N_SHEETS);
      big.textContent = r.k + " of " + r.n + " (" + fmt1(100 * r.p) + "%) rated the lesson good or excellent; " + l.k + " of " + l.n + " (" + fmt1(100 * l.p) + "%) agreed they learned a lot.";

      tables.innerHTML = "";
      E.TABLES.forEach(function (t) {
        var sh = E.shares(t, state.base, N_SHEETS);
        var allMatch = true;
        var box = el("div", { class: "ff-tbl" });
        box.appendChild(el("p", { class: "w-mono", text: "Figure " + t.fig + ": “" + t.prompt + "”" }));
        box.appendChild(el("div", { class: "ff-trow ff-thead" }, [el("span", { text: "Answer" }), el("span", { text: "Count" }), el("span", { text: "Printed %" }), el("span", { text: "Page %" }), el("span", { text: "Match" })]));
        t.options.forEach(function (o, i) {
          var m = sh[i].shown === t.pct[i];
          if (!m) allMatch = false;
          box.appendChild(el("div", { class: "ff-trow" }, [
            el("span", { text: o }), el("span", { text: String(t.freq[i]) }), el("span", { text: fmt1(t.pct[i]) }),
            el("span", { text: fmt1(sh[i].shown) }), el("span", { class: m ? "ff-ok" : "ff-no", text: m ? "yes" : "no" })
          ]));
        });
        var totShown = state.base === "sheets" ? E.pctRound(t.total.freq, N_SHEETS, 1) : 100;
        var tm = totShown === t.total.pct;
        box.appendChild(el("div", { class: "ff-trow ff-ttot" }, [
          el("span", { text: "Total" }), el("span", { text: String(t.total.freq) }), el("span", { text: fmt1(t.total.pct) }),
          el("span", { text: fmt1(totShown) }), el("span", { class: tm ? "ff-ok" : "ff-no", text: tm ? "yes" : "no" })
        ]));
        box.appendChild(el("p", { class: "w-note", text: allMatch && tm ? "Every printed percentage is the count divided by " + N_SHEETS + "." : "Dividing by the " + t.total.freq + " students who answered gives different percentages from the printed ones." }));
        tables.appendChild(box);
      });

      gradNote.innerHTML = "Computed by the page (95% Wilson intervals): good or excellent " + fmt1(100 * r.p) + "% (" + fmt1(100 * r.ci[0]) + "% to " + fmt1(100 * r.ci[1]) + "%, n = " + r.n + "); learned a lot " + fmt1(100 * l.p) + "% (" + fmt1(100 * l.ci[0]) + "% to " + fmt1(100 * l.ci[1]) + "%, n = " + l.n + "). The intervals treat sheets as independent. Students filled in a sheet after each lesson or activity, so a student who saw several lessons can appear several times, and the true uncertainty is wider.";
    }
    redraws.push(draw);
    draw();
    root.classList.add("w-ready");
  }

  /* ---------------------------------------------------------------- demo 4: twelve Fellows */

  function mountFellows(root) {
    var state = { item: "teach", d: 12 };
    root.appendChild(el("p", { class: "w-source", text: "Paper, Fellow Feedback Data and Figure 4: online survey of 12 of the 15 Fellows, 2006 to 2009" }));
    var dotsBox = el("div", { class: "ff-chart" });
    root.appendChild(dotsBox);
    var big = el("p", { class: "w-big", "aria-live": "polite" });
    root.appendChild(big);
    var check = el("p", { class: "w-note" });
    check.setAttribute("data-levels", "grad res");
    root.appendChild(check);
    var ctl = el("div", { class: "w-actions" });
    ctl.setAttribute("data-levels", "grad res");
    ctl.appendChild(el("span", { class: "w-mono", text: "Divide by" }));
    ctl.appendChild(segmented("Divide by", [{ value: 12, label: "12 who answered" }, { value: 15, label: "All 15 Fellows" }], state.d, function (v) { state.d = v; draw(); }));
    root.appendChild(ctl);
    var list = el("div", { class: "ff-rows", role: "radiogroup", "aria-label": "Survey result" });
    var btns = E.FELLOW_ITEMS.map(function (it) {
      var b = el("button", { type: "button", class: "ff-irow ff-irow-" + it.tone, role: "radio", "data-key": it.key }, [
        el("span", { class: "ff-ipct", text: it.pct + "%" }),
        el("span", { class: "ff-itext", text: cap(it.text) }),
        el("span", { class: "ff-itone", text: it.tone === "cost" ? "Cost" : "Benefit" })
      ]);
      b.addEventListener("click", function () { state.item = it.key; draw(); });
      list.appendChild(b);
      return b;
    });
    root.appendChild(list);

    function draw() {
      var it = E.FELLOW_ITEMS.filter(function (x) { return x.key === state.item; })[0];
      var lvl = currentLevel();
      var d = (lvl === "grad" || lvl === "res") ? state.d : 12;
      btns.forEach(function (b) { var on = b.getAttribute("data-key") === state.item; b.setAttribute("aria-checked", on ? "true" : "false"); b.classList.toggle("ff-irow-on", on); });
      var exact = E.countsFor(it.pct, d);
      var k = exact.length ? exact[0] : E.nearestCount(it.pct, d);
      if (it.n !== undefined) k = it.n;

      dotsBox.innerHTML = "";
      var W = chartWidth(dotsBox), n = 15, rr = Math.min(16, (W - 20) / (n * 2.6));
      var H = rr * 2 + 34, step = (W - 2 * rr - 8) / (n - 1);
      var s = svg("svg", { viewBox: "0 0 " + W + " " + H, width: W, height: H, class: "ff-svg", role: "img", "aria-label": k + " of " + d + " Fellows marked" });
      for (var i = 0; i < n; i++) {
        var cx = rr + 4 + i * step, cy = rr + 6;
        var responded = i < 12;
        var inBase = i < d;
        var filled = i < k;
        var cls = "ff-dot" + (responded ? "" : " ff-dot-silent") + (filled ? (it.tone === "cost" ? " ff-dot-cost" : " ff-dot-on") : "") + (!inBase ? " ff-dot-out" : "");
        s.appendChild(svg("circle", { cx: cx, cy: cy, r: rr, class: cls }));
      }
      s.appendChild(svg("text", { x: 4, y: H - 4, class: "c-tick" }, "12 answered the survey"));
      s.appendChild(svg("text", { x: W - 4, y: H - 4, class: "c-tick", "text-anchor": "end" }, "3 did not"));
      dotsBox.appendChild(s);

      if (it.n !== undefined && d !== 12) {
        big.textContent = "The paper counts " + words(it.n) + " Fellows who " + it.text.replace(/^agree /, "agree that ") + ". " + cap(words(it.n)) + " of " + d + " would be " + E.pctRound(it.n, d, 0) + "%, so the printed " + it.pct + "% divides by the 12 who answered.";
      } else if (exact.length) {
        big.textContent = cap(words(k)) + " of " + d + " Fellows " + it.text + " (" + it.pct + "% printed).";
      } else if (lvl !== "grad" && lvl !== "res") {
        big.textContent = it.pct + "% of Fellows " + it.text + ". The dots show the nearest whole count, about " + words(k) + " of " + d + ".";
      } else {
        var lo = Math.floor(it.pct * d / 100), hi = lo + 1;
        big.textContent = it.pct + "% of Fellows " + it.text + ". No whole number of the " + d + " gives " + it.pct + "%: " + words(lo) + " is " + E.pctRound(lo, d, 0) + "% and " + words(hi) + " is " + E.pctRound(hi, d, 0) + "%.";
      }
      var c12 = E.countsFor(it.pct, 12), c15 = E.countsFor(it.pct, 15);
      check.textContent = "Whole counts behind " + it.pct + "%: " + (c12.length ? c12[0] + " of 12" : "none of 12") + "; " + (c15.length ? c15[0] + " of 15" : "none of 15") + "." +
        (!exact.length && it.n === undefined ? " The dots show the nearest count. The figure may be an average over several survey items or a share of a rating scale (Figure 4 holds the values, and the page could not read them)." : "");
    }
    redraws.push(draw);
    draw();
    root.classList.add("w-ready");
  }

  /* ---------------------------------------------------------------- boot */

  function boot() {
    var m = [["ff-wheel", mountWheel], ["ff-goals", mountGoals], ["ff-students", mountStudents], ["ff-fellows", mountFellows]];
    m.forEach(function (p) { var node = document.getElementById(p[0]); if (node) p[1](node); });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();

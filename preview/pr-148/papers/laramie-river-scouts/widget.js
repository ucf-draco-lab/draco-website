/*
  Laramie River widget for /papers/laramie-river-scouts/.
  Mount points in the page: #lr-field, #lr-design, #lr-practices, #lr-voices.

  Demo 1 (the scouts' investigation, the one tool demo) runs a SIMULATED field
         day at a control reach and a restored reach on the paper's five factors.
         Graduate and researcher levels add Welch's t-test, a "restoration did
         nothing" switch, reach-to-reach spread, and repeated field days.
  Demo 2 walks the study design: the river, the participants, the meetings, the
         data sources, and how far the results traveled.
  Demo 3 lists the eight science and engineering practices the paper maps onto
         the scouts' work, with the paper's own question-narrowing criteria.
  Demo 4 draws Tables 1 and 2 (who said what, by category), paraphrased.
  All arithmetic lives in lr-engine.js.
*/
(function () {
  "use strict";

  var E = window.RiverEngine;
  var SVGNS = "http://www.w3.org/2000/svg";

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
    if (window.PaperKit && window.PaperKit.level) return window.PaperKit.level();
    var art = document.querySelector("[data-level]");
    if (art) return art.getAttribute("data-level");
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

  function control(label, widget, levels) {
    var row = el("div", { class: "lr-ctl" }, [el("span", { class: "lr-ctl-label", text: label }), widget]);
    if (levels) row.setAttribute("data-levels", levels);
    return row;
  }

  function note(html, levels) {
    var p = el("p", { class: "w-note", html: html });
    if (levels) p.setAttribute("data-levels", levels);
    return p;
  }

  function fmt(x, dp) { return isFinite(x) ? x.toFixed(dp) : "–"; }
  function fmtP(p) {
    if (!isFinite(p)) return "–";
    if (p < 0.001) return "< 0.001";
    return p.toFixed(3);
  }
  function unitSuffix(f) { return f.key === "diversity" ? "" : (f.unit === "%" ? "%" : " " + f.unit); }
  function pct(x) { return Math.round(100 * x) + "%"; }

  /* ---------------------------------------------------------------- demo 1: the field day */

  function mountField(root) {
    var state = { n: 3, seed: 2015, effect: true, reachSD: 0, day: null, repeat: null };

    root.appendChild(el("p", { class: "w-source", text: "Simulated field day. The paper reports the direction of each difference and prints no measurements; every value here is drawn by the page." }));

    var ctl = el("div", { class: "lr-ctls" });
    var nSeg = segmented("Samples per site", [2, 3, 5, 8].map(function (v) { return { value: v, label: String(v) }; }), state.n, function (v) { state.n = v; state.repeat = null; run(); });
    ctl.appendChild(control("Samples per site", nSeg));
    var effSeg = segmented("Restoration", [{ value: "on", label: "Changed the river" }, { value: "off", label: "Did nothing" }], "on", function (v) { state.effect = v === "on"; state.repeat = null; run(); });
    ctl.appendChild(control("Restoration", effSeg, "grad res"));
    var rsdSeg = segmented("Reach-to-reach spread", [{ value: 0, label: "None" }, { value: 0.25, label: "25%" }, { value: 0.5, label: "50%" }], 0, function (v) { state.reachSD = v; state.repeat = null; run(); });
    ctl.appendChild(control("Reach-to-reach spread", rsdSeg, "grad res"));
    root.appendChild(ctl);

    var actions = el("div", { class: "w-actions" });
    var collect = el("button", { type: "button", class: "w-btn", text: "Collect new samples" });
    collect.addEventListener("click", function () { state.seed = (state.seed * 1103515245 + 12345) >>> 0; run(); });
    var repeat = el("button", { type: "button", class: "w-btn w-btn-quiet", "data-levels": "grad res", text: "Repeat 500 field days" });
    repeat.addEventListener("click", function () {
      repeat.disabled = true; repeat.textContent = "Running…";
      setTimeout(function () {
        state.repeat = E.repeatDays(500, state.n, state.seed, { effect: state.effect, reachSD: state.reachSD }, 0.05);
        repeat.disabled = false; repeat.textContent = "Repeat 500 field days";
        draw();
      }, 20);
    });
    actions.appendChild(collect);
    actions.appendChild(repeat);
    root.appendChild(actions);

    var chart = el("div", { class: "lr-chart" });
    root.appendChild(chart);
    var legend = el("div", { class: "c-legend w-mono" }, [
      el("span", { class: "lg lr-lg-c", text: "Control reach (channelized)" }),
      el("span", { class: "lg lr-lg-r", text: "Restored reach" }),
      el("span", { class: "lg lr-lg-m", text: "Mean" })
    ]);
    root.appendChild(legend);

    var table = el("div", { class: "lr-tests-wrap" });
    root.appendChild(table);
    var repeatOut = el("div", { class: "lr-repeat", "data-levels": "grad res", "aria-live": "polite" });
    root.appendChild(repeatOut);

    root.appendChild(el("p", { class: "w-mono lr-tray-head", text: "The ice cube tray: the last sample at each site, sorted by family" }));
    var tray = el("div", { class: "lr-tray" });
    root.appendChild(tray);
    var trayNote = el("p", { class: "w-note" });
    root.appendChild(trayNote);

    root.appendChild(note("Diversity is the Shannon index H′ = −Σ p<sub>i</sub> ln p<sub>i</sub> over the eight families in each sample. Each reach's samples come from one stretch of river.", "ug grad res"));

    function run() { state.day = E.fieldDay(state.n, state.seed, { effect: state.effect, reachSD: state.reachSD }); draw(); }

    function draw() {
      var lv = currentLevel(), day = state.day;
      var W = chartWidth(chart), rowH = 74, left = 4, right = 4, top = 4;
      var H = top + rowH * E.FACTORS.length;
      var s = svg("svg", { class: "lr-svg", viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": "Five factors at the control and restored reaches, one dot per simulated sample" });
      E.FACTORS.forEach(function (f, i) {
        var t = day.tests[f.key], y0 = top + i * rowH;
        var all = t.control.values.concat(t.restored.values);
        var lo = Math.min.apply(null, all), hi = Math.max.apply(null, all);
        if (hi - lo < 1e-9) { hi = lo + 1; }
        var pad = (hi - lo) * 0.08; lo -= pad; hi += pad;
        if (f.key === "canopy") { lo = Math.max(0, lo); }
        var x = function (v) { return left + 6 + (W - left - right - 12) * (v - lo) / (hi - lo); };
        var unit = f.key === "diversity" ? "Shannon H′" : f.unit;
        s.appendChild(svg("text", { class: "c-label", x: 0, y: y0 + 12 }, f.name + " (" + unit + ")"));
        [["control", 28, "lr-dot-c"], ["restored", 46, "lr-dot-r"]].forEach(function (spec) {
          var vals = t[spec[0]].values, yy = y0 + spec[1];
          s.appendChild(svg("line", { class: "c-grid", x1: left, x2: W - right, y1: yy, y2: yy }));
          vals.forEach(function (v) { s.appendChild(svg("circle", { class: spec[2], cx: x(v), cy: yy, r: 4.5 })); });
          var m = t[spec[0]].mean;
          s.appendChild(svg("line", { class: "lr-mean", x1: x(m), x2: x(m), y1: yy - 8, y2: yy + 8 }));
        });
        s.appendChild(svg("text", { class: "c-tick", x: left, y: y0 + 64 }, fmt(lo, f.dp)));
        s.appendChild(svg("text", { class: "c-tick", x: W - right, y: y0 + 64, "text-anchor": "end" }, fmt(hi, f.dp)));
        s.appendChild(svg("line", { class: "c-grid", x1: 0, x2: W, y1: y0 + rowH - 3, y2: y0 + rowH - 3 }));
      });
      chart.innerHTML = "";
      chart.appendChild(s);

      // results rows
      var showStats = lv === "grad" || lv === "res";
      var showMeans = lv !== "public";
      var tbl = el("table", { class: "results-table lr-tests" });
      var head = ["Factor", "Higher at"];
      if (showMeans) head.push("Control mean", "Restored mean");
      head.push("Paper reports");
      if (showStats) head.push("Welch t (df)", "p", "SD ratio");
      tbl.appendChild(el("thead", {}, [el("tr", {}, head.map(function (h) { return el("th", { text: h }); }))]));
      var tb = el("tbody");
      var agree = 0;
      E.FACTORS.forEach(function (f) {
        var t = day.tests[f.key], match = t.direction === f.higher;
        if (match) agree++;
        var cells = [
          el("td", { text: f.name }),
          el("td", { class: match ? "lr-match" : "lr-miss", text: (t.direction === "restored" ? "Restored" : "Control") + (match ? " ✓" : " ✗") })
        ];
        if (showMeans) {
          cells.push(el("td", { text: fmt(t.control.mean, f.dp) + unitSuffix(f) }));
          cells.push(el("td", { text: fmt(t.restored.mean, f.dp) + unitSuffix(f) }));
        }
        cells.push(el("td", { class: "lr-paper", text: f.paper }));
        if (showStats) {
          var w = t.welch;
          cells.push(el("td", { text: w ? fmt(w.t, 2) + " (" + fmt(w.df, 1) + ")" : "–" }));
          cells.push(el("td", { text: w ? fmtP(w.p) : "–" }));
          cells.push(el("td", { text: fmt(Math.sqrt(t.varRatio), 2) }));
        }
        tb.appendChild(el("tr", {}, cells));
      });
      tbl.appendChild(tb);
      table.innerHTML = "";
      table.appendChild(el("p", { class: "w-big", text: agree + " of 5 factors point the way the paper reports" + (state.effect ? "." : " (with restoration switched off, any agreement is chance).") }));
      table.appendChild(tbl);
      table.appendChild(note("Simulated: " + state.n + " samples per reach, drawn by the page. The paper reports directions only, from the scouts' own samples (counts not printed)." + (showStats ? " t-tests, p-values, and SD ratios (restored ÷ control) are the page's own." : "")));

      // repeat
      repeatOut.innerHTML = "";
      if (state.repeat) {
        var R = state.repeat;
        var rows = E.FACTORS.map(function (f) {
          return el("tr", {}, [el("td", { text: f.name }), el("td", { text: pct(R.share[f.key]) })]);
        });
        rows.push(el("tr", { class: "lr-any" }, [el("td", { text: "At least one of the five" }), el("td", { text: pct(R.anyShare) })]));
        repeatOut.appendChild(el("table", { class: "results-table lr-rep" }, [
          el("thead", {}, [el("tr", {}, [el("th", { text: "Factor" }), el("th", { text: "Field days with p < 0.05" })])]),
          el("tbody", {}, rows)
        ]));
        repeatOut.appendChild(note("Computed by the page: 500 simulated field days, " + R.n + " samples per reach, restoration " + (state.effect ? "on" : "off") + ", reach-to-reach spread " + Math.round(state.reachSD * 100) + "%." +
          (!state.effect ? " With restoration off, every p < 0.05 is a false alarm. With spread above zero, the two reaches differ for reasons that have nothing to do with restoration, and more samples per reach make those false alarms more frequent, not less." : "")));
      }

      // tray
      tray.innerHTML = "";
      var lastC = day.sites.control.samples[day.sites.control.samples.length - 1];
      var lastR = day.sites.restored.samples[day.sites.restored.samples.length - 1];
      var trow = el("div", { class: "lr-trow lr-trow-head" }, [el("span", { text: "Family" }), el("span", { text: "Control" }), el("span", { text: "Restored" })]);
      tray.appendChild(trow);
      var maxc = 1;
      E.FAMILIES.forEach(function (fam, k) { maxc = Math.max(maxc, lastC.counts[k], lastR.counts[k]); });
      E.FAMILIES.forEach(function (fam, k) {
        function cell(c, cls) {
          var bar = el("span", { class: "lr-tbar " + cls });
          bar.style.width = Math.max(2, Math.round(100 * Math.sqrt(c / maxc))) + "%";
          return el("span", { class: "lr-tcell" }, [bar, el("span", { class: "lr-tnum", text: String(c) })]);
        }
        tray.appendChild(el("div", { class: "lr-trow" + (fam.group === "mayfly" ? " lr-mayfly" : "") }, [
          el("span", { class: "lr-tname" }, [el("span", { text: fam.name }), el("span", { class: "lr-latin", "data-levels": "ug grad res", text: " " + fam.latin })]),
          cell(lastC.counts[k], "lr-tbar-c"),
          cell(lastR.counts[k], "lr-tbar-r")
        ]));
      });
      var mayC = lastC.counts[2] + lastC.counts[3], mayR = lastR.counts[2] + lastR.counts[3];
      trayNote.textContent = "Totals: control " + lastC.total + " animals in " + lastC.richness + " families (H′ = " + fmt(lastC.diversity, 2) + "); restored " + lastR.total + " in " + lastR.richness + " families (H′ = " + fmt(lastR.diversity, 2) + "). Mayflies, the scouts' pollution indicator: " + mayC + " at the control, " + mayR + " at the restored reach. Bar length grows with the square root of the count. Simulated.";
    }

    run();
    redraws.push(draw);
    root.classList.add("w-ready");
  }

  /* ---------------------------------------------------------------- demo 2: the study design */

  var STEPS = [
    { when: "1940s to 2012", title: "The river", body: "Inside Laramie city limits, the Laramie River was channelized in the 1940s, which sped the water up. A restoration between 2009 and 2012 rebuilt part of it. That restored stretch and an unrestored control stretch became the scouts' two sites.", stat: "Restored 2009 to 2012" },
    { when: "Fall 2015", title: "The troop", body: "Fourteen girls took part in the Girl Scout group. The paper reports the 10 whose parents gave consent and who gave their own assent, ages 9 to 15. Leaders and parents helped; university educators led the group, funded through NSF Wyoming EPSCoR (grant EPS-1208909).", stat: "10 of 14 reported", squares: true },
    { when: "Fall 2015 to spring 2016", title: "The question", body: "The group listed questions on a board and narrowed them by four criteria (answerable, testable, compact, and measurable). They kept one: was the Laramie River restoration successful or not? The scouts also wrote alternative and null hypotheses.", stat: "One question kept" },
    { when: "Fall 2015 to spring 2016", title: "In the river", body: "At both sites the scouts measured five factors: macro-invertebrate diversity, riparian (streamside vegetation) height, canopy cover, benthic (streambed) particle size, and velocity. Dissolved oxygen and turbidity came up in discussion and were not measured.", stat: "Five factors, two sites" },
    { when: "Fall 2015 to spring 2016", title: "At the table", body: "Back inside, the scouts sorted animals by family in ice cube trays with a dichotomous key and field guides, counted them (one group counted hundreds of midges), dried and weighed plant matter (minus the weight of the tin), and graphed every factor. A t-test was explained to them.", stat: "Sort, count, weigh, graph" },
    { when: "Across the project", title: "What the researchers collected", body: "Field notes from 10 Girl Scout meetings, four group discussions built on the three dimensions of the Next Generation Science Standards (practices, core ideas, and crosscutting concepts), the second author's reflective journal, and the scouts' poster. Field notes were color-coded by theme, and the scouts could agree or disagree with the researchers' reading.", stat: "Four data sources" },
    { when: "Spring 2016", title: "The poster", body: "Five panels: the problem, the procedures, two panels of results and analysis, and conclusions with future directions. The scouts rehearsed in practice poster sessions, arguing for their hypotheses with data, then presented at a public symposium.", stat: "Five panels" },
    { when: "After the symposium", title: "How far it traveled", body: "Leaders presented the work to the head of the Laramie Girl Scouts, and a select group of scouts traveled to Montana and presented the research in the capitol rotunda, which the paper notes was not an intended part of the project.", stat: "Laramie to a capitol rotunda" }
  ];

  function mountDesign(root) {
    var state = { i: 0 };
    root.appendChild(el("p", { class: "w-source", text: "Paper, Sections 2 and 3: setting, participants, data sources, and dissemination" }));
    var rail = el("div", { class: "lr-rail", role: "tablist", "aria-label": "Study steps" });
    var detail = el("div", { class: "lr-detail", "aria-live": "polite" });
    var btns = STEPS.map(function (st, k) {
      var b = el("button", { type: "button", class: "lr-step", role: "tab", "aria-selected": "false" }, [
        el("span", { class: "lr-step-n", text: String(k + 1) }),
        el("span", { class: "lr-step-t", text: st.title })
      ]);
      b.addEventListener("click", function () { state.i = k; draw(); });
      rail.appendChild(b);
      return b;
    });
    root.appendChild(rail);
    root.appendChild(detail);
    var nav = el("div", { class: "w-actions" });
    var prev = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "Previous step" });
    var next = el("button", { type: "button", class: "w-btn", text: "Next step" });
    prev.addEventListener("click", function () { state.i = Math.max(0, state.i - 1); draw(); });
    next.addEventListener("click", function () { state.i = Math.min(STEPS.length - 1, state.i + 1); draw(); });
    nav.appendChild(prev); nav.appendChild(next);
    root.appendChild(nav);

    function draw() {
      var st = STEPS[state.i];
      btns.forEach(function (b, k) { b.setAttribute("aria-selected", k === state.i ? "true" : "false"); });
      detail.innerHTML = "";
      detail.appendChild(el("p", { class: "w-mono", text: st.when }));
      detail.appendChild(el("p", { class: "w-big", text: st.stat }));
      detail.appendChild(el("p", { class: "lr-body", text: st.body }));
      if (st.squares) {
        var row = el("div", { class: "lr-squares", role: "img", "aria-label": "14 squares, 10 filled: the 10 girls reported in the paper" });
        for (var k = 0; k < 14; k++) row.appendChild(el("span", { class: "lr-sq" + (k < 10 ? " lr-sq-on" : "") }));
        detail.appendChild(row);
        detail.appendChild(note("Each square is one girl. Filled: reported in the paper (10 of 14, 71%). The four others took part; the paper does not report on them."));
      }
      prev.disabled = state.i === 0;
      next.disabled = state.i === STEPS.length - 1;
    }
    draw();
    root.classList.add("w-ready");
  }

  /* ---------------------------------------------------------------- demo 3: eight practices */

  var PRACTICES = [
    { name: "Asking questions and defining problems", did: "Listed questions on a board during a presentation, then narrowed them by four criteria until one testable question remained.", ask: true },
    { name: "Developing and using models", did: "Used a dichotomous key and a model of macro-invertebrate families. A river that began as \"water\" ended the project as a system." },
    { name: "Planning and carrying out investigations", did: "Chose their own collection tools, how many samples to take, where, and how to analyze them; picked mayflies as an indicator because they \"can show us how polluted the water is.\"" },
    { name: "Analyzing and interpreting data", did: "Sorted animals by family in ice cube trays, counted each family to compare diversity at the two sites, graphed six measures, and explained the results to graduate students, family, and peers." },
    { name: "Using mathematics and computational thinking", did: "Counted (one group, hundreds of midges in a single session), weighed dried plant matter and subtracted the tin, and were shown how a t-test works and how to read it." },
    { name: "Constructing explanations and designing solutions", did: "Found \"healthy\" hard to define, judged the river's health from their own data, and discussed what a future restoration could do." },
    { name: "Engaging in argument from evidence", did: "Disagreed about whether the restoration succeeded, and defended their hypotheses with data in practice poster sessions." },
    { name: "Obtaining, evaluating, and communicating information", did: "Presented a five-panel poster at a public symposium and talked through the work informally with visitors." }
  ];

  var CRITERIA = ["Answerable", "Testable", "Compact", "Measurable"];
  var QUESTIONS = [
    { text: "How clean is the water?", paper: "The group set it aside as not measurable in the time it had.", kept: false, fails: ["Measurable"] },
    { text: "Was the Laramie River restoration successful or not?", paper: "The group kept it as the research question and added alternative and null hypotheses.", kept: true, fails: [] }
  ];

  function mountPractices(root) {
    var state = { open: 0, q: 0, marks: [{}, {}] };
    root.appendChild(el("p", { class: "w-source", text: "Paper, Section 3: the eight science and engineering practices (National Research Council framework) and what the scouts did for each" }));
    var count = el("p", { class: "w-big", text: "8 of 8 practices appear in the scouts' work" });
    root.appendChild(count);
    var list = el("div", { class: "lr-plist" });
    root.appendChild(list);

    function askPanel() {
      var box = el("div", { class: "lr-ask" });
      var qseg = segmented("Question", QUESTIONS.map(function (q, k) { return { value: k, label: "Question " + (k + 1) }; }), state.q, function (v) { state.q = v; draw(); });
      box.appendChild(control("Try the group's test", qseg));
      var q = QUESTIONS[state.q];
      box.appendChild(el("p", { class: "lr-q", text: "“" + q.text + "”" }));
      var crit = el("div", { class: "lr-crit" });
      CRITERIA.forEach(function (c) {
        var on = state.marks[state.q][c] === true;
        var b = el("button", { type: "button", class: "lr-chip", "aria-pressed": on ? "true" : "false", text: (on ? "✓ " : "") + c });
        b.addEventListener("click", function () { state.marks[state.q][c] = !on; draw(); });
        crit.appendChild(b);
      });
      box.appendChild(crit);
      var met = CRITERIA.filter(function (c) { return state.marks[state.q][c]; }).length;
      var touched = Object.keys(state.marks[state.q]).length > 0;
      var verdict = !touched ? "Mark each criterion the question meets." :
        (met === 4 ? "You would keep it. " : "You would set it aside. ") + q.paper;
      box.appendChild(el("p", { class: "w-note", "aria-live": "polite", text: verdict }));
      box.appendChild(note("Both questions and the four criteria are the paper's. The paper names only the failing criterion for the first question.", "ug grad res"));
      return box;
    }

    function draw() {
      list.innerHTML = "";
      PRACTICES.forEach(function (p, k) {
        var open = state.open === k;
        var head = el("button", { type: "button", class: "lr-prow", "aria-expanded": open ? "true" : "false" }, [
          el("span", { class: "lr-pn", text: String(k + 1) }),
          el("span", { class: "lr-pname", text: p.name }),
          el("span", { class: "lr-pmark", text: open ? "−" : "+" })
        ]);
        head.addEventListener("click", function () { state.open = open ? -1 : k; draw(); });
        list.appendChild(head);
        if (open) {
          var body = el("div", { class: "lr-pbody" }, [el("p", { text: p.did })]);
          if (p.ask) body.appendChild(askPanel());
          list.appendChild(body);
        }
      });
    }
    draw();
    root.classList.add("w-ready");
  }

  /* ---------------------------------------------------------------- demo 4: what people said */

  // Tables 1 and 2, paraphrased by the page (the paper prints the quotations).
  var TABLES = {
    t1: {
      title: "Table 1: quotes from scouts, community members, and researchers or leaders during the project",
      cols: ["Girl Scout", "Community member", "Researcher or leader"],
      rows: [
        ["engagement", ["The girls can tell whether the river is cleaner and healthier.", "Impressed that the group can assess a river.", "Patterns mean noticing what happens, beyond pretty designs."]],
        ["knowledge", ["Fewer macro-invertebrates turned up in faster water.", "A parent wants to learn the girls' terms, such as riparian height.", "Asks why larger rocks were placed along the bank."]],
        ["interest", ["Asks for more graphing and data analysis, which she enjoyed.", "A parent feels inspired to take on more community projects.", "Proposes studying plant growth around the river."]]
      ]
    },
    t2: {
      title: "Table 2: community members at public events, by category",
      cols: ["Engagement", "Knowledge", "Interest"],
      byColumn: true,
      rows: [
        [null, ["Everyone worked on different parts at once, unlike school science.", "Marveled at the girls' expertise with college-level water data.", "Amazed at a daughter's interest in bugs; the family searched the backyard."]],
        [null, ["The girls chose their data, methods, and presentation.", "Admits the daughter now knows more than the parent.", "The daughter now checks water quality wherever she goes."]],
        [null, [null, "The daughter understands the scientific process, which will help in a career.", "The daughter wants to join university citizen science events."]]
      ]
    }
  };
  var TAGS = ["engagement", "knowledge", "interest"];

  function mountVoices(root) {
    var state = { t: "t1", tag: "all" };
    root.appendChild(el("p", { class: "w-source", text: "Paper, Tables 1 and 2, paraphrased by the page; the paper prints the speakers' words" }));
    var ctl = el("div", { class: "lr-ctls" });
    ctl.appendChild(control("Table", segmented("Table", [{ value: "t1", label: "Table 1: during" }, { value: "t2", label: "Table 2: public events" }], state.t, function (v) { state.t = v; draw(); })));
    ctl.appendChild(control("Category", segmented("Category", [{ value: "all", label: "All" }].concat(TAGS.map(function (t) { return { value: t, label: t.charAt(0).toUpperCase() + t.slice(1) }; })), state.tag, function (v) { state.tag = v; draw(); })));
    root.appendChild(ctl);
    var grid = el("div", { class: "lr-grid-wrap" });
    root.appendChild(grid);
    var tally = el("p", { class: "w-note", "aria-live": "polite" });
    root.appendChild(tally);
    root.appendChild(note("Each table is a three-by-three grid of selected quotations, one or more per category, chosen by the authors to illustrate. The counts describe the tables, not how often anything was said.", "ug grad res"));

    function draw() {
      var T = TABLES[state.t];
      var tbl = el("table", { class: "results-table lr-grid" });
      tbl.appendChild(el("caption", { class: "w-note", text: T.title }));
      var headCells = [el("th", { text: T.byColumn ? "" : "Category" })].concat(T.cols.map(function (c) { return el("th", { text: c }); }));
      tbl.appendChild(el("thead", {}, [el("tr", {}, headCells)]));
      var tb = el("tbody"), counts = { engagement: 0, knowledge: 0, interest: 0 }, empty = 0;
      T.rows.forEach(function (row, ri) {
        var cells = [el("th", { scope: "row", text: T.byColumn ? "Row " + (ri + 1) : row[0].charAt(0).toUpperCase() + row[0].slice(1) })];
        row[1].forEach(function (txt, ci) {
          var tag = T.byColumn ? TAGS[ci] : row[0];
          var show = state.tag === "all" || state.tag === tag;
          if (txt) counts[tag]++; else empty++;
          cells.push(el("td", { class: "lr-cell lr-tag-" + tag + (show ? "" : " lr-dim") + (txt ? "" : " lr-empty"), text: txt || "(empty in the paper)" }));
        });
        tb.appendChild(el("tr", {}, cells));
      });
      tbl.appendChild(tb);
      grid.innerHTML = "";
      grid.appendChild(tbl);
      var filled = counts.engagement + counts.knowledge + counts.interest;
      tally.textContent = filled + " quotations: engagement " + counts.engagement + ", knowledge " + counts.knowledge + ", interest " + counts.interest + (empty ? "; " + empty + " cell left empty." : ".");
    }
    draw();
    root.classList.add("w-ready");
  }

  /* ---------------------------------------------------------------- mount */

  function mount(id, fn) { var node = document.getElementById(id); if (node) fn(node); }
  function start() {
    mount("lr-field", mountField);
    mount("lr-design", mountDesign);
    mount("lr-practices", mountPractices);
    mount("lr-voices", mountVoices);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();

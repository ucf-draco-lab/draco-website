/*
  Lesson-plan widget for /papers/cyber-pd-lesson-plans/.
  Mount points in the page: #lp-plans, #lp-design, #lp-components, #lp-weights.

  Demo 1 draws the 46 rated lesson plans for one component at a time (Figures 3 and 4).
  Demo 2 walks the study design: standards, the two PDs, the checkpoints, and what each measured.
  Demo 3 draws every component's ratings (Figure 4), their averages (Figure 5), and checks
         every printed share against the counts.
  Demo 4 (graduate and researcher) varies the scoring weight, adds Wilson intervals, and
         swaps in the other tables that fit the printed numbers; all of it is the page's own.
  All arithmetic lives in lp-engine.js.
*/
(function () {
  "use strict";

  var E = window.LessonPlanEngine;
  var SVGNS = "http://www.w3.org/2000/svg";

  var state = { comp: "overall", cohort: "both", step: 1, view: "counts", weight: 1, alt: 0 };

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

  function pct(x, d) { return (100 * x).toFixed(d === undefined ? 0 : d) + "%"; }
  function words(n) {
    var w = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
    return n < 10 ? w[n] : String(n);
  }
  function comp(key) { return E.COMPONENTS.filter(function (c) { return c.key === key; })[0]; }
  var LEVEL_CLASS = ["lp-s", "lp-e", "lp-x"];
  var LEVEL_NAME = ["Struggling", "Emerging", "Excellent"];

  function legend() {
    return el("div", { class: "c-legend w-mono" }, [
      el("span", { class: "lg lp-lg-s", text: "Struggling (0)" }),
      el("span", { class: "lg lp-lg-e", text: "Emerging (1)" }),
      el("span", { class: "lg lp-lg-x", text: "Excellent (2)" })
    ]);
  }

  function compOptions() {
    return E.COMPONENTS.map(function (c) { return { value: c.key, label: c.short }; });
  }

  /* ---------------------------------------------------------------- demo 1: 46 plans */

  function mountPlans(root) {
    var seg = segmented("Rubric component", compOptions(), state.comp, function (v) { state.comp = v; sync(); });
    var chart = el("div", { class: "lp-chart" });
    var readout = el("div", { class: "lp-readout" });

    root.appendChild(el("p", { class: "w-source", text: "Paper, Figures 3 and 4: one external reviewer, three levels, six components, 46 lesson plans" }));
    root.appendChild(el("div", { class: "w-actions" }, [seg]));
    root.appendChild(chart);
    root.appendChild(legend());
    root.appendChild(readout);
    root.appendChild(note("Each square is one plan. The squares are sorted again for every component: the paper reports how many plans earned each rating, not which plan earned which, so a square's position does not follow one plan across components.", "ug grad res"));
    root.appendChild(note("Counts are the page's reading of the Figure 4 bar labels; every component adds to 46 plans, and the reading reproduces Figure 3 and the abstract's shares (checked in the demo further down).", "grad res"));

    function draw() {
      var c = E.COUNTS[state.comp];
      var n = E.total(c);
      var W = chartWidth(chart);
      var cols = W < 420 ? 10 : 23;
      var gap = 4;
      var size = Math.min(26, Math.floor((W - gap * (cols - 1)) / cols));
      var rows = Math.ceil(n / cols);
      var H = rows * (size + gap);
      var s = svg("svg", { class: "lp-svg", viewBox: "0 0 " + W + " " + H, role: "img",
        "aria-label": comp(state.comp).name + ": " + c[0] + " struggling, " + c[1] + " emerging, " + c[2] + " excellent of " + n + " plans" });
      var i = 0;
      [2, 1, 0].forEach(function (lv) {
        for (var j = 0; j < c[lv]; j++, i++) {
          var x = (i % cols) * (size + gap), y = Math.floor(i / cols) * (size + gap);
          s.appendChild(svg("rect", { x: x + 0.5, y: y + 0.5, width: size - 1, height: size - 1, class: "lp-sq " + LEVEL_CLASS[lv] }));
        }
      });
      chart.innerHTML = "";
      chart.appendChild(s);

      readout.innerHTML = "";
      var sh = E.shares(c);
      var rowsEl = el("div", { class: "lp-rows" });
      [2, 1, 0].forEach(function (lv) {
        rowsEl.appendChild(el("div", { class: "lp-row" }, [
          el("span", { class: "lp-row-name " + LEVEL_CLASS[lv] + "-t", text: LEVEL_NAME[lv] }),
          el("span", { class: "lp-row-val", text: c[lv] + " of " + n }),
          el("span", { class: "lp-row-pct", text: pct(sh[lv], 1) })
        ]));
      });
      readout.appendChild(rowsEl);
      var msg = {
        overall: "Taken as a whole, nearly half the plans (22 of 46) earned excellent, and fewer than one in five (nine) struggled. Figure 3 prints 19.6%, 32.6%, and 47.8%.",
        org: "Organization was the weakest component: only two plans earned excellent, the two the paper names in Section 4.1.",
        obj: "Objectives earned excellent most often of the five parts (22 plans), matching the abstract's 48%.",
        int: "Integration split in two: 20 excellent, 21 struggling, and only five emerging, the polarization the paper describes.",
        act: "Activities earned excellent in 20 plans (the abstract's 43%), which the authors connect to the PD's time on hands-on cybersecurity activities.",
        q: "Question strength struggled in 19 plans (the abstract's 41%)."
      };
      readout.appendChild(el("p", { class: "w-big", text: msg[state.comp] }));
    }

    function sync() { seg.set(state.comp); draw(); if (window.__lpSync) window.__lpSync(); }
    root.__sync = function () { seg.set(state.comp); draw(); };
    redraws.push(draw);
    draw();
  }

  /* ---------------------------------------------------------------- demo 2: study design */

  var STEPS = [
    { tag: "Context", title: "Wyoming adopts K–12 computer science standards",
      when: "January 2022; in effect for 2022–23",
      body: "Every district must offer computer science (CS) by the 2022–23 school year. The standards name seven core practices across five grade bands, and no ready-made K–12 curriculum maps to them, so teachers, above all in K–8, build their own lessons.",
      measure: "None; this is why the PDs exist." },
    { tag: "PD", title: "Two week-long professional developments (PDs)",
      when: "Summers 2020 and 2021",
      body: "The first PD (14 teachers) gave hands-on learning in CS focused on cybersecurity. The second (28 teachers) focused on integrating CS into the lessons teachers already teach. Both were built on a constructivist frame: teachers first build their own understanding through activities, then apply it to a lesson.",
      measure: "Daily pre- and post-surveys with identical multiple-choice questions; answers were not revealed during instruction.",
      cohort: true },
    { tag: "RQ1", title: "Teachers write lesson plans that bring in CS and cybersecurity",
      when: "After each PD",
      body: "Teachers integrated cybersecurity into lessons they already taught rather than adding a separate cybersecurity unit, which the authors link to teacher buy-in.",
      measure: "Each plan rated by an external subject expert on six components (organization, objectives, integration, activities, question strength, and overall) as struggling, emerging, or excellent." },
    { tag: "Classroom", title: "The lessons reach students",
      when: "School year after each PD",
      body: "Teachers taught more than 40 lessons to more than 1,500 K–12 students, mostly in sixth and seventh grade and mostly in classes dedicated to CS and computational thinking. Students were split almost evenly: 50.3% female and 49.7% male.",
      measure: "Teacher reports: grade band, student gender, date, length, course, purpose, whether the outcome was met, and the evidence." },
    { tag: "RQ2", title: "Teachers reflect on the PD and the lesson",
      when: "After teaching",
      body: "Open-ended questions asked what teachers would change, what challenged them, and what succeeded. Responses were split by cohort and compared.",
      measure: "Open-ended survey responses, grouped into themes.",
      cohort: true },
    { tag: "RQ3", title: "From PD to classroom activity",
      when: "After teaching",
      body: "Teachers described the evidence that the lesson met its purpose, the data they collected, and a summary of it, with raw data where possible. Teachers reproduced the content and discussed it well, and struggled to connect it to society and careers on their own.",
      measure: "Self-reported evidence and data, read through the constructivist lens." }
  ];

  var COHORTS = {
    y2020: { label: "First cohort (Summer 2020)",
      rows: [
        ["Format", "Self-paced, with suggested activities for each day"],
        ["What teachers raised", "Procedure: what was expected each day, and what to do after falling behind"],
        ["In their words", "Content likened to “drinking from a fire hydrant”; “a little too much, too fast”"]
      ] },
    y2021: { label: "Second cohort (Summer 2021)",
      rows: [
        ["Format", "A more rigid learning-management-system layout with an explicit daily schedule; only basic content on day one"],
        ["What teachers raised", "Content and putting lessons into practice; still fast, but more approachable"],
        ["Same in both years", "Most resources (videos, activities, and handouts)"]
      ] },
    both: { label: "Challenges in both years",
      rows: [
        ["COVID-19", "Adapting subject lessons to online learning while learning a new topic"],
        ["Devices", "WiFi outages and too few Micro:Bits; teachers moved to small groups and unplugged activities"],
        ["Classrooms", "Students skipping directions, falling behind after absences, and tighter time than planned"]
      ] }
  };

  function mountDesign(root) {
    var stepSeg = segmented("Study step", STEPS.map(function (s, i) { return { value: i, label: (i + 1) + " " + s.tag }; }), state.step, function (v) { state.step = v; draw(); });
    var detail = el("div", { class: "lp-step" });
    var cohortBox = el("div", { class: "lp-cohort" });
    var cohortSeg = segmented("Cohort", [
      { value: "y2020", label: "Summer 2020" },
      { value: "y2021", label: "Summer 2021" },
      { value: "both", label: "Both years" }
    ], state.cohort, function (v) { state.cohort = v; drawCohort(); });

    root.appendChild(el("p", { class: "w-source", text: "Paper, Sections 1, 3, and 4: the study's steps, its three research questions (RQs), and what each step measured" }));
    root.appendChild(el("div", { class: "w-actions" }, [stepSeg]));
    root.appendChild(detail);
    root.appendChild(el("p", { class: "w-mono lp-cohort-head", text: "What changed between the two summers (RQ2)" }));
    root.appendChild(el("div", { class: "w-actions" }, [cohortSeg]));
    root.appendChild(cohortBox);
    root.appendChild(note("The paper describes the first PD (14 teachers) and the second (28) in its abstract and the first and second cohorts by summer in Section 4.2. The page pairs them in that order; the paper does not state the pairing outright.", "grad res"));

    function draw() {
      var s = STEPS[state.step];
      detail.innerHTML = "";
      var list = el("div", { class: "lp-rows" });
      STEPS.forEach(function (st, i) {
        var row = el("button", { type: "button", class: "lp-srow" + (i === state.step ? " lp-srow-on" : ""), "aria-pressed": i === state.step ? "true" : "false",
          onclick: function () { state.step = i; stepSeg.set(i); draw(); } }, [
          el("span", { class: "lp-snum", text: String(i + 1) }),
          el("span", { class: "lp-stitle", text: st.title }),
          el("span", { class: "lp-swhen", text: st.when })
        ]);
        list.appendChild(row);
        if (i === state.step) {
          list.appendChild(el("div", { class: "lp-sbody" }, [
            el("p", { text: st.body }),
            el("p", { class: "w-note", html: "<span class=\"lp-tag\">Measured</span> " + st.measure })
          ]));
        }
      });
      detail.appendChild(list);
      stepSeg.set(state.step);
    }

    function drawCohort() {
      var c = COHORTS[state.cohort];
      cohortBox.innerHTML = "";
      var rows = el("div", { class: "lp-rows" });
      c.rows.forEach(function (r) {
        rows.appendChild(el("div", { class: "lp-crow" }, [el("span", { class: "lp-cname", text: r[0] }), el("span", { class: "lp-cval", text: r[1] })]));
      });
      cohortBox.appendChild(el("p", { class: "w-mono", text: c.label }));
      cohortBox.appendChild(rows);
    }

    draw();
    drawCohort();
  }

  /* ---------------------------------------------------------------- demo 3: every component */

  function mountComponents(root) {
    var seg = segmented("View", [
      { value: "counts", label: "Ratings (Figure 4)" },
      { value: "avg", label: "Averages (Figure 5)" },
      { value: "check", label: "Printed numbers", levels: "ug grad res" }
    ], state.view, function (v) { state.view = v; draw(); });
    var chart = el("div", { class: "lp-chart" });
    var extra = el("div", { class: "lp-extra" });

    root.appendChild(el("p", { class: "w-source", text: "Paper, Figures 4 and 5: ratings by component; averages score struggling 0, emerging 1, excellent 2" }));
    root.appendChild(el("div", { class: "w-actions" }, [seg]));
    root.appendChild(chart);
    root.appendChild(extra);

    function drawCounts() {
      var W = chartWidth(chart);
      var labW = W < 420 ? 86 : 132, numW = 40;
      var rowH = 30, top = 4;
      var H = top + rowH * E.COMPONENTS.length + 22;
      var x0 = labW, x1 = W - numW;
      var s = svg("svg", { class: "lp-svg", viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": "Stacked bars of struggling, emerging, and excellent plans for each component" });
      E.COMPONENTS.forEach(function (c, i) {
        var cnt = E.COUNTS[c.key], n = E.total(cnt);
        var y = top + i * rowH;
        var on = c.key === state.comp;
        s.appendChild(svg("line", { x1: 0, x2: W, y1: y + rowH - 0.5, y2: y + rowH - 0.5, class: "c-grid" }));
        s.appendChild(svg("text", { x: 0, y: y + rowH / 2 + 4, class: "c-label" + (on ? " lp-on-t" : "") }, W < 420 ? c.short : c.name));
        var x = x0;
        [0, 1, 2].forEach(function (lv) {
          var w = (x1 - x0) * cnt[lv] / n;
          s.appendChild(svg("rect", { x: x, y: y + 6, width: Math.max(0, w - 1), height: rowH - 12, class: "lp-bar " + LEVEL_CLASS[lv] }));
          if (w > 20) s.appendChild(svg("text", { x: x + w / 2, y: y + rowH / 2 + 4, "text-anchor": "middle", class: "lp-in " + LEVEL_CLASS[lv] + "-in" }, String(cnt[lv])));
          x += w;
        });
        s.appendChild(svg("text", { x: W, y: y + rowH / 2 + 4, "text-anchor": "end", class: "c-tick" }, "n=" + n));
        var hit = svg("rect", { x: 0, y: y, width: W, height: rowH, fill: "transparent", style: "cursor:pointer" });
        hit.addEventListener("click", function () { state.comp = c.key; draw(); if (window.__lpSync) window.__lpSync(); });
        s.appendChild(hit);
      });
      [0, 0.5, 1].forEach(function (t) {
        var x = x0 + (x1 - x0) * t;
        s.appendChild(svg("text", { x: x, y: H - 6, "text-anchor": t === 0 ? "start" : (t === 1 ? "end" : "middle"), class: "c-tick" }, (100 * t) + "%"));
      });
      chart.innerHTML = "";
      chart.appendChild(s);
      chart.appendChild(legend());
      extra.innerHTML = "";
      extra.appendChild(note("Tap a row to show that component in the first demo. Organization stands out with only two excellent plans; integration has only five plans in the middle."));
    }

    function drawAvg() {
      var W = chartWidth(chart);
      var labW = W < 420 ? 86 : 132, numW = 44;
      var rowH = 28, top = 4;
      var H = top + rowH * E.COMPONENTS.length + 22;
      var x0 = labW, x1 = W - numW;
      var s = svg("svg", { class: "lp-svg", viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": "Average rating from 0 to 2 for each component" });
      [0, 0.5, 1, 1.5, 2].forEach(function (t) {
        var x = x0 + (x1 - x0) * t / 2;
        s.appendChild(svg("line", { x1: x, x2: x, y1: top, y2: H - 18, class: "c-grid" }));
        s.appendChild(svg("text", { x: x, y: H - 6, "text-anchor": "middle", class: "c-tick" }, String(t)));
      });
      E.COMPONENTS.forEach(function (c, i) {
        var a = E.average(E.COUNTS[c.key]);
        var y = top + i * rowH;
        s.appendChild(svg("text", { x: 0, y: y + rowH / 2 + 4, class: "c-label" }, W < 420 ? c.short : (c.key === "overall" ? "Overall (“Review”)" : c.name)));
        s.appendChild(svg("rect", { x: x0, y: y + 7, width: (x1 - x0) * a / 2, height: rowH - 14, class: "lp-bar " + (c.key === "overall" ? "lp-x" : "lp-avg") }));
        s.appendChild(svg("text", { x: W, y: y + rowH / 2 + 4, "text-anchor": "end", class: "c-label" }, a.toFixed(2)));
      });
      chart.innerHTML = "";
      chart.appendChild(s);
      extra.innerHTML = "";
      extra.appendChild(note("Bar heights are computed by the page from the Figure 4 counts with the paper's scoring; Figure 5 draws them without printing the values. A score of 1 is emerging; only objectives (1.22), activities (1.09), and the overall rating (1.28) average above it."));
      extra.appendChild(note("The overall rating averages 1.28 while the five parts average 0.96: the reviewer's overall judgment of a plan ran kinder than the parts, a pattern the paper does not discuss.", "grad res"));
    }

    function drawCheck() {
      chart.innerHTML = "";
      extra.innerHTML = "";
      var wrap = el("div", { class: "lp-table-wrap" });
      var t = el("table", { class: "lp-table" });
      t.appendChild(el("thead", {}, [el("tr", {}, ["Where printed", "Component, rating", "Printed", "Count / 46", "Exact", "Match"].map(function (h) { return el("th", { text: h }); }))]));
      var tb = el("tbody");
      E.checkPrinted().forEach(function (r) {
        var p = r.p;
        tb.appendChild(el("tr", {}, [
          el("td", { text: p.where }),
          el("td", { text: comp(p.comp).name + ", " + LEVEL_NAME[p.level].toLowerCase() }),
          el("td", { text: p.count !== undefined ? p.count + " plans" : p.pct + "%" }),
          el("td", { text: r.k + " / " + r.n }),
          el("td", { text: r.exact !== undefined ? r.exact.toFixed(2) + "%" : "—" }),
          el("td", { class: r.how === "truncated" ? "lp-warn" : "lp-okc", text: r.how === "count" ? "same count" : r.how })
        ]));
      });
      t.appendChild(tb);
      wrap.appendChild(t);
      chart.appendChild(wrap);
      extra.appendChild(note("All 12 printed numbers follow from one table of whole counts. Organization and integration both have 21 struggling plans (45.65%), yet the abstract prints 45% for one and 46% for the other, so one of the two was truncated rather than rounded."));
    }

    function draw() {
      seg.set(state.view);
      if (state.view === "counts") drawCounts();
      else if (state.view === "avg") drawAvg();
      else drawCheck();
    }
    redraws.push(draw);
    root.__draw = draw;
    draw();
  }

  /* ---------------------------------------------------------------- demo 4: how firm are the ranks */

  function mountWeights(root) {
    var slider = el("input", { type: "range", min: "0", max: "2", step: "0.1", value: String(state.weight), "aria-label": "Points for an emerging rating" });
    var out = el("output", { "aria-live": "polite" });
    var altSeg = segmented("Table reading", E.ALTERNATIVES.map(function (a, i) { return { value: i, label: a.label }; }), state.alt, function (v) { state.alt = v; draw(); });
    var tableBox = el("div", { class: "lp-table-wrap" });
    var msg = el("p", { class: "w-big" });

    slider.addEventListener("input", function () { state.weight = +slider.value; draw(); });
    root.appendChild(el("p", { class: "w-source", text: "Computed by this page from the Figure 4 counts (46 plans); not in the paper" }));
    root.appendChild(el("label", { class: "w-range" }, [el("span", { text: "Emerging is worth" }), slider, out]));
    root.appendChild(el("p", { class: "w-mono", text: "Which Figure 4 reading" }));
    root.appendChild(el("div", { class: "w-actions" }, [altSeg]));
    root.appendChild(tableBox);
    root.appendChild(msg);
    root.appendChild(note("Intervals are 95% Wilson score intervals for the share of 46 plans at each rating. They treat each component's 46 ratings as independent draws; the same plans are rated on every component, so the intervals describe one component at a time and do not license comparisons between components."));

    function draw() {
      out.textContent = state.weight.toFixed(1);
      var counts = E.withAlternative(state.alt);
      var rank = E.ranking(state.weight, counts);
      tableBox.innerHTML = "";
      var t = el("table", { class: "lp-table" });
      t.appendChild(el("thead", {}, [el("tr", {}, ["Rank", "Component", "Counts S / E / X", "Average", "Excellent, 95% interval", "Struggling, 95% interval"].map(function (h) { return el("th", { text: h }); }))]));
      var tb = el("tbody");
      rank.forEach(function (r, i) {
        var c = counts[r.key], n = E.total(c);
        var wx = E.wilson(c[2], n), ws = E.wilson(c[0], n);
        tb.appendChild(el("tr", {}, [
          el("td", { text: String(i + 1) }),
          el("td", { text: r.name }),
          el("td", { text: c.join(" / ") }),
          el("td", { text: r.avg.toFixed(2) }),
          el("td", { text: pct(c[2] / n) + " (" + pct(wx[0]) + "–" + pct(wx[1]) + ")" }),
          el("td", { text: pct(c[0] / n) + " (" + pct(ws[0]) + "–" + pct(ws[1]) + ")" })
        ]));
      });
      t.appendChild(tb);
      tableBox.appendChild(t);
      var names = rank.map(function (r) { return r.name.toLowerCase(); });
      var tie = Math.abs(rank[rank.length - 1].avg - rank[rank.length - 2].avg) < 1e-9;
      var lead = rank[0].key === "obj" ? "Objectives leads" : rank[0].name + " leads, ahead of objectives";
      msg.textContent = "Order: " + names.join(", ") + ". " + lead + "; organization is " + (tie ? "tied for last with " + rank[rank.length - 2].name.toLowerCase() : "last") + ".";
      if (state.weight >= 1.95) msg.textContent += " At a weight of 2, emerging counts the same as excellent, so the average only measures how few plans struggled.";
    }
    redraws.push(draw);
    draw();
  }

  /* ---------------------------------------------------------------- boot */

  function boot() {
    if (!E) return;
    var mounts = {
      "lp-plans": mountPlans,
      "lp-design": mountDesign,
      "lp-components": mountComponents,
      "lp-weights": mountWeights
    };
    var nodes = {};
    Object.keys(mounts).forEach(function (id) {
      var node = document.getElementById(id);
      if (!node) return;
      nodes[id] = node;
      mounts[id](node);
      node.classList.add("w-ready");
    });
    window.__lpSync = function () {
      if (nodes["lp-plans"] && nodes["lp-plans"].__sync) nodes["lp-plans"].__sync();
      if (nodes["lp-components"] && nodes["lp-components"].__draw) nodes["lp-components"].__draw();
    };
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();

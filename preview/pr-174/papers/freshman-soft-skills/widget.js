/*
  Soft-skills widget for /papers/freshman-soft-skills/.
  Mount points in the page: #ss-quiz, #ss-design, #ss-prepost, #ss-levels, #ss-recover.

  Demo 1 puts the paper's six questions (Table I) in front of the reader, with the
  full-credit answers and the class's pre- and post-test averages (Table IV).
  Demo 2 draws the study design: two cohorts and their class standing (text).
  Demo 3 draws Tables II to IV: pre and post by question and class standing.
  Demo 4 draws Table V (early and upper-level pre-tests) and, at the graduate and
  researcher levels, the F-test that reproduces the printed p > 0.85.
  Demo 5 (graduate and researcher) runs the score reconstruction live.
  Demos 1, 3, and 5 share one selected question (state.q).
  All arithmetic lives in ss-engine.js; reconstructions and tests marked "page" are the page's own.
*/
(function () {
  "use strict";

  var E = window.SoftSkillsEngine;
  var D = E.DATA;
  var SVGNS = "http://www.w3.org/2000/svg";

  var state = { q: 0, grade: "all", cohort: "inclass", self: null, unitMode: "rubric" };

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
  function pct(x, d) { return fix(x, d === undefined ? 1 : d) + "%"; }
  function sci(p) {
    if (p >= 0.001) return fix(p, 3);
    var e = Math.floor(Math.log(p) / Math.LN10), m = p / Math.pow(10, e);
    return fix(m, 1) + " × 10<sup>" + String(e).replace("-", "−") + "</sup>";
  }
  function bound(b) { return "p &lt; 1 × 10<sup>" + String(b).replace("-", "−") + "</sup>"; }
  function frac(v, k) { return v + "/" + k; }
  var WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
  function words(n) { return n < 10 ? WORDS[n] : String(n); }
  function cap(t) { return t.charAt(0).toUpperCase() + t.slice(1); }

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

  // The shared question picker: every copy stays in sync.
  var qControls = [], qDraws = [];
  function setQ(v) {
    state.q = Number(v);
    state.self = null;
    qControls.forEach(function (c) { c.set(state.q); });
    qDraws.forEach(function (fn) { fn(); });
  }
  function qControl() {
    var c = segmented("Question", D.questions.map(function (q, i) {
      return { value: i, label: "Q" + q.id, title: q.short };
    }), state.q, setQ);
    qControls.push(c);
    return c;
  }

  /* ---------------------------------------------- demo 1: six questions */

  function mountQuiz(root) {
    var head = el("div", { class: "w-actions" }, [el("span", { class: "w-mono", text: "Question:" }), qControl()]);
    var qtext = el("p", { class: "ss-q" });
    var answerBtn = el("button", { type: "button", class: "w-btn", text: "Show the full-credit answer" });
    var answer = el("p", { class: "ss-answer", hidden: "hidden" });
    var selfWrap = el("div", { class: "w-actions" });
    var chart = el("div", { class: "ss-chart" });
    var readout = el("p", { class: "w-big" });
    var unitNote = el("p", { class: "w-note", "data-levels": "grad res" });
    var src = el("p", { class: "w-source" });
    [head, qtext, el("div", { class: "w-actions" }, [answerBtn]), answer, selfWrap, readout, chart, unitNote, src].forEach(function (n) { root.appendChild(n); });

    answerBtn.addEventListener("click", function () {
      var open = answer.hasAttribute("hidden");
      if (open) answer.removeAttribute("hidden"); else answer.setAttribute("hidden", "hidden");
      answerBtn.textContent = open ? "Hide the full-credit answer" : "Show the full-credit answer";
    });

    function draw() {
      var q = D.questions[state.q], k = q.unit, i = state.q;
      qtext.innerHTML = "<strong>Q" + q.id + ".</strong> " + q.text;
      answer.innerHTML = "<strong>Full credit:</strong> " + q.full + ".";
      selfWrap.innerHTML = "";
      var opts = [];
      for (var v = 0; v <= k; v++) opts.push({ value: v, label: v === 0 ? "None" : v === k ? "All of it" : frac(v, k) });
      selfWrap.appendChild(el("span", { class: "w-mono", text: "How much could you give?" }));
      selfWrap.appendChild(segmented("Your answer", opts, state.self === null ? "" : state.self, function (v) { state.self = Number(v); drawChart(); }));
      drawChart();
      unitNote.innerHTML = "Partial-credit steps (" + (k === 5 ? "fifths" : k === 3 ? "thirds" : "quarters") +
        " for this question) are the page's reading: they are the coarsest steps whose scores reproduce every average and standard deviation the paper prints for this question. See <strong>Rebuilding the class</strong> below.";
      src.textContent = "Paper, Tables I and IV · 18 in-class students, pre-test before and post-test after one class session";
    }

    function drawChart() {
      var i = state.q, k = D.questions[i].unit;
      var pre = D.t4.preMean[i], post = D.t4.postMean[i];
      readout.innerHTML = "Before the session the class averaged <strong>" + pct(pre, 2) + "</strong> on this question; after it, <strong>" + pct(post, 2) + "</strong>." +
        (state.self !== null ? " Your answer scores " + pct(100 * state.self / k, 0) + "." : "");
      chart.innerHTML = "";
      var w = chartWidth(chart), narrow = w < 520;
      var labelW = narrow ? 64 : 120, valW = 70;
      var L = labelW + 8, R = w - valW;
      var rows = [{ label: "Pre-test", v: pre, cls: "ss-pre" }, { label: "Post-test", v: post, cls: "ss-post" }];
      if (state.self !== null) rows.push({ label: narrow ? "You" : "Your answer", v: 100 * state.self / k, cls: "ss-you" });
      var rowH = 28, h = 6 + rows.length * rowH + 22;
      var s = svg("svg", { viewBox: "0 0 " + w + " " + h, class: "ss-svg", role: "img", "aria-label": "Class average on question " + (i + 1) + " before and after the session" });
      function X(v) { return L + (R - L) * v / 100; }
      [0, 25, 50, 75, 100].forEach(function (g) {
        s.appendChild(svg("line", { x1: X(g), x2: X(g), y1: 4, y2: h - 18, class: "c-grid" }));
        s.appendChild(svg("text", { x: X(g), y: h - 5, "text-anchor": "middle", class: "c-tick" }, g + "%"));
      });
      rows.forEach(function (r, j) {
        var y = 6 + j * rowH;
        s.appendChild(svg("text", { x: labelW, y: y + 15, "text-anchor": "end", class: "c-label" }, r.label));
        s.appendChild(svg("rect", { x: X(0), y: y + 3, width: X(100) - X(0), height: 16, class: "ss-track" }));
        s.appendChild(svg("rect", { x: X(0), y: y + 3, width: Math.max(0, X(r.v) - X(0)), height: 16, class: r.cls }));
        s.appendChild(svg("text", { x: w - 2, y: y + 16, "text-anchor": "end", class: "ss-val" }, pct(r.v, r.cls === "ss-you" ? 0 : 2)));
      });
      chart.appendChild(s);
    }
    qDraws.push(draw);
    redraws.push(drawChart);
    draw();
  }

  /* --------------------------------------------- demo 2: the study design */

  var STANDING = [
    { id: "fr", name: "Freshman", cls: "ss-fr" },
    { id: "so", name: "Sophomore", cls: "ss-so" },
    { id: "jr", name: "Junior", cls: "ss-jr" },
    { id: "sr", name: "Senior", cls: "ss-sr" }
  ];

  function mountDesign(root) {
    var steps = el("ol", { class: "ss-steps" });
    var pick = segmented("Cohort", [
      { value: "inclass", label: "In class (18)" },
      { value: "online", label: "Online (37)" },
      { value: "all", label: "All (55)" }
    ], state.cohort, function (v) { state.cohort = v; draw(); });
    var chart = el("div", { class: "ss-chart" });
    var legend = el("div", { class: "c-legend" }, STANDING.map(function (g) {
      return el("span", { class: "ss-lg" }, [el("span", { class: "ss-sw " + g.cls }), g.name]);
    }));
    var readout = el("p", { class: "w-note" });
    var src = el("p", { class: "w-source" });
    root.appendChild(el("div", { class: "w-actions" }, [el("span", { class: "w-mono", text: "Cohort:" }), pick]));
    root.appendChild(steps);
    root.appendChild(chart);
    root.appendChild(legend);
    root.appendChild(readout);
    root.appendChild(src);

    var STEPS = {
      inclass: [
        ["Pre-test", "Six open questions on paper, before any instruction (Table I)."],
        ["One class session", "Teams toss paper balls into target areas for points, then the first author explains soft skills, partnerships, and conflict."],
        ["Post-test", "The same six questions, answered again by the same 18 students."]
      ],
      online: [
        ["One survey", "The same six questions as an anonymous online survey at the end of the academic year, sent to about 150 undergraduates."],
        ["No session", "These 37 students answered once, with no intervention, so they count only toward the pre-test baseline."]
      ],
      all: [
        ["Pooled baseline", "Every first answer from both cohorts (18 pre-tests and 37 online surveys), split into early undergraduates (16) and upper-level undergraduates (39) for Table V."]
      ]
    };

    function draw() {
      var c = D.cohorts[state.cohort];
      steps.innerHTML = "";
      STEPS[state.cohort].forEach(function (st) {
        steps.appendChild(el("li", { html: "<strong>" + st[0] + ".</strong> " + st[1] }));
      });
      chart.innerHTML = "";
      var w = chartWidth(chart), h = 64, L = 2, R = w - 2;
      var s = svg("svg", { viewBox: "0 0 " + w + " " + h, class: "ss-svg", role: "img", "aria-label": "Class standing of the " + c.n + " students in this cohort" });
      var x = L;
      STANDING.forEach(function (g) {
        var n = c[g.id];
        if (!n) return;
        var bw = (R - L) * n / c.n;
        s.appendChild(svg("rect", { x: x, y: 6, width: Math.max(0, bw - 1), height: 26, class: g.cls }));
        if (bw > 26) s.appendChild(svg("text", { x: x + bw / 2, y: 24, "text-anchor": "middle", class: "ss-inbar" }, String(n)));
        x += bw;
      });
      s.appendChild(svg("text", { x: L, y: 52, class: "c-tick" }, c.n + " students"));
      chart.appendChild(s);
      var PLURAL = { fr: "freshmen", so: "sophomores", jr: "juniors", sr: "seniors" };
      var parts = STANDING.filter(function (g) { return c[g.id]; }).map(function (g) { return words(c[g.id]) + " " + (c[g.id] > 1 ? PLURAL[g.id] : g.name.toLowerCase()); });
      parts[0] = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
      readout.textContent = parts.join(", ") + "." +
        (state.cohort === "inclass" ? " Eighteen of the 33 enrolled students took both tests." : "") +
        (state.cohort === "online" ? " About 150 were invited; 37 answered (roughly one in four)." : "");
      src.textContent = state.cohort === "online"
        ? "Paper, participants section · online class standing derived by this page (all 55 minus the 18 in class)"
        : "Paper, participants section";
    }
    redraws.push(draw);
    draw();
  }

  /* ------------------------------------------- demo 3: pre and post (II to IV) */

  function mountPrePost(root) {
    var gpick = segmented("Class standing", [
      { value: "all", label: "All 18" },
      { value: "sr", label: "Seniors (14)" },
      { value: "jr", label: "Juniors (3)" },
      { value: "so", label: "Sophomore (1)" }
    ], state.grade, function (v) { state.grade = v; draw(); });
    var chart = el("div", { class: "ss-chart" });
    var legend = el("div", { class: "c-legend" }, [
      el("span", { class: "ss-lg" }, [el("span", { class: "ss-sw ss-pre" }), "Pre-test"]),
      el("span", { class: "ss-lg" }, [el("span", { class: "ss-sw ss-post" }), "Post-test"])
    ]);
    var readout = el("div", { class: "ss-readout" });
    var src = el("p", { class: "w-source" });
    root.appendChild(el("div", { class: "w-actions" }, [el("span", { class: "w-mono", text: "Students:" }), gpick]));
    root.appendChild(el("div", { class: "w-actions" }, [el("span", { class: "w-mono", text: "Question:" }), qControl()]));
    root.appendChild(chart);
    root.appendChild(legend);
    root.appendChild(readout);
    root.appendChild(src);

    function draw() {
      var g = state.grade;
      var pre = g === "all" ? D.t4.preMean : D.pre[g];
      var post = g === "all" ? D.t4.postMean : D.post[g];
      chart.innerHTML = "";
      var w = chartWidth(chart), narrow = w < 520;
      var h = 220, top = 16, base = h - 40, L = 34, R = w - 4;
      var colW = (R - L) / 6, bw = Math.min(30, colW * 0.32);
      function Y(v) { return base - (base - top) * v / 100; }
      var s = svg("svg", { viewBox: "0 0 " + w + " " + h, class: "ss-svg", role: "img", "aria-label": "Pre-test and post-test averages for the six questions" });
      [0, 25, 50, 75, 100].forEach(function (t) {
        s.appendChild(svg("line", { x1: L, x2: R, y1: Y(t), y2: Y(t), class: "c-grid" }));
        s.appendChild(svg("text", { x: L - 4, y: Y(t) + 4, "text-anchor": "end", class: "c-tick" }, t + "%"));
      });
      D.questions.forEach(function (q, i) {
        var cx = L + colW * (i + 0.5);
        var grp = svg("g", { class: "ss-col" + (i === state.q ? " is-on" : ""), tabindex: "0", role: "button", "aria-label": "Select question " + q.id });
        grp.appendChild(svg("rect", { x: L + colW * i + 1, y: top - 4, width: colW - 2, height: base - top + 38, class: "ss-hit" }));
        grp.appendChild(svg("rect", { x: cx - bw - 1, y: Y(pre[i]), width: bw, height: Math.max(0, base - Y(pre[i])), class: "ss-pre" }));
        grp.appendChild(svg("rect", { x: cx + 1, y: Y(post[i]), width: bw, height: Math.max(0, base - Y(post[i])), class: "ss-post" }));
        if (!narrow) {
          grp.appendChild(svg("text", { x: cx - bw / 2 - 1, y: Y(pre[i]) - 4, "text-anchor": "middle", class: "ss-val" }, fix(pre[i], 0)));
          grp.appendChild(svg("text", { x: cx + bw / 2 + 1, y: Y(post[i]) - 4, "text-anchor": "middle", class: "ss-val" }, fix(post[i], 0)));
        }
        grp.appendChild(svg("text", { x: cx, y: base + 16, "text-anchor": "middle", class: "c-label" }, "Q" + q.id));
        grp.appendChild(svg("text", { x: cx, y: base + 30, "text-anchor": "middle", class: "c-tick" }, narrow ? "" : q.short));
        grp.addEventListener("click", function () { setQ(i); });
        grp.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setQ(i); } });
        s.appendChild(grp);
      });
      chart.appendChild(s);

      var i = state.q, q = D.questions[i];
      var html = "<p><strong>Q" + q.id + " (" + q.short + "), " + (g === "all" ? "all 18 students" : nameOf(g)) + ":</strong> " +
        pct(pre[i], g === "all" ? 2 : 0) + " before, " + pct(post[i], g === "all" ? 2 : 0) + " after.</p>";
      if (g === "all") {
        html += "<p class=\"w-note\" data-levels=\"ug grad res\">Table IV: pre " + pct(D.t4.preMean[i], 2) + " ± " + pct(D.t4.preSD[i], 2) +
          ", post " + pct(D.t4.postMean[i], 2) + " ± " + pct(D.t4.postSD[i], 2) + "; paired two-tailed t-test, " + bound(D.t4.pBound[i]) + ".</p>";
        html += "<p class=\"w-note\" data-levels=\"ug grad res\">Check: weighting Table II's rounded rows by 1, 3, and 14 students gives " + pct(E.weighted("pre", i), 2) +
          " (printed " + pct(D.t4.preMean[i], 2) + "); Table III's rows give " + pct(E.weighted("post", i), 2) + " (printed " + pct(D.t4.postMean[i], 2) +
          "). The gap is the rounding of each row to a whole percent; the reconstructed scores below reproduce both tables exactly.</p>";
      } else {
        var n = g === "so" ? 1 : g === "jr" ? 3 : 14;
        html += "<p class=\"w-note\">" + cap(words(n)) + (n === 1 ? " student" : " students") + " in this row" +
          (n < 5 ? "; with so few, one answer moves the average by " + fix(100 / n / q.unit, 0) + " points or more." : ".") + "</p>";
      }
      readout.innerHTML = html;
      src.textContent = g === "all" ? "Paper, Table IV · n = 18 in-class students" : "Paper, Tables II and III · " + nameOf(g) + " row, whole percents as printed";
    }
    function nameOf(g) { return g === "sr" ? "the 14 seniors" : g === "jr" ? "the three juniors" : "the one sophomore"; }
    qDraws.push(draw);
    redraws.push(draw);
    draw();
  }

  /* ----------------------------------------- demo 4: early and upper level */

  function mountLevels(root) {
    var chart = el("div", { class: "ss-chart" });
    var legend = el("div", { class: "c-legend" }, [
      el("span", { class: "ss-lg" }, [el("span", { class: "ss-sw ss-early" }), "Freshmen and sophomores (16)"]),
      el("span", { class: "ss-lg" }, [el("span", { class: "ss-sw ss-upper" }), "Juniors and seniors (39)"])
    ]);
    var readout = el("div", { class: "ss-readout" });
    var tests = el("div", { class: "ss-readout", "data-levels": "grad res" });
    var src = el("p", { class: "w-source", text: "Paper, Table V · first answers of all 55 participants (18 pre-tests and 37 online surveys)" });
    [chart, legend, readout, tests, src].forEach(function (n) { root.appendChild(n); });

    var a = D.t5.early.pct, b = D.t5.upper.pct;
    var F = E.fTest(a, b), T = E.tIndependent(a, b), P = E.tPaired(a, b);

    function draw() {
      chart.innerHTML = "";
      var w = chartWidth(chart), narrow = w < 520;
      var h = 190, top = 14, base = h - 26, L = 34, R = w - 4, maxV = 40;
      var colW = (R - L) / 6, bw = Math.min(30, colW * 0.32);
      function Y(v) { return base - (base - top) * v / maxV; }
      var s = svg("svg", { viewBox: "0 0 " + w + " " + h, class: "ss-svg", role: "img", "aria-label": "Pre-test averages by question for early and upper-level undergraduates" });
      [0, 10, 20, 30, 40].forEach(function (t) {
        s.appendChild(svg("line", { x1: L, x2: R, y1: Y(t), y2: Y(t), class: "c-grid" }));
        s.appendChild(svg("text", { x: L - 4, y: Y(t) + 4, "text-anchor": "end", class: "c-tick" }, t + "%"));
      });
      D.questions.forEach(function (q, i) {
        var cx = L + colW * (i + 0.5);
        s.appendChild(svg("rect", { x: cx - bw - 1, y: Y(a[i]), width: bw, height: base - Y(a[i]), class: "ss-early" }));
        s.appendChild(svg("rect", { x: cx + 1, y: Y(b[i]), width: bw, height: base - Y(b[i]), class: "ss-upper" }));
        if (!narrow) {
          s.appendChild(svg("text", { x: cx - bw / 2 - 1, y: Y(a[i]) - 4, "text-anchor": "middle", class: "ss-val" }, fix(a[i], 0)));
          s.appendChild(svg("text", { x: cx + bw / 2 + 1, y: Y(b[i]) - 4, "text-anchor": "middle", class: "ss-val" }, fix(b[i], 0)));
        }
        s.appendChild(svg("text", { x: cx, y: base + 16, "text-anchor": "middle", class: "c-label" }, "Q" + q.id));
      });
      chart.appendChild(s);
      readout.innerHTML = "<p>Upper-level students score higher on five of six questions, by 2.0 to 11.3 points; early students lead on Q6 (" +
        pct(a[5], 2) + " against " + pct(b[5], 2) + "). Averaged over the six questions: " + pct(E.mean(a), 1) + " and " + pct(E.mean(b), 1) + ".</p>";
      tests.innerHTML =
        "<table class=\"ss-table\"><caption class=\"w-note\">Tests on Table V's six averages per group. Computed by this page.</caption>" +
        "<thead><tr><th>Test</th><th>Statistic</th><th>p</th><th>Reads as</th></tr></thead><tbody>" +
        "<tr><td>Variance-ratio F-test, two-tailed (spreadsheet F.TEST)</td><td>F(5, 5) = " + fix(F.F, 3) + "</td><td>" + fix(F.p, 3) + "</td><td>Matches the printed p &gt; 0.85; compares the spread of the six averages</td></tr>" +
        "<tr><td>Two-sample t-test on the six averages</td><td>t(10) = " + fix(T.t, 2) + "</td><td>" + fix(T.p, 2) + "</td><td>Compares the level of the six averages</td></tr>" +
        "<tr><td>Paired t-test by question</td><td>t(5) = " + fix(P.t, 2) + "</td><td>" + fix(P.p, 3) + "</td><td>Pairs each question's two averages</td></tr>" +
        "</tbody></table>";
    }
    redraws.push(draw);
    draw();
  }

  /* --------------------------------------------- demo 5: rebuilding the class */

  function mountRecover(root) {
    var upick = segmented("Scoring steps", [
      { value: "rubric", label: "Rubric steps", title: "Fifths for Q1 to Q4, thirds for Q5, quarters for Q6" },
      { value: "fine", label: "Twice as fine", title: "Tenths, sixths, and eighths" }
    ], state.unitMode, function (v) { state.unitMode = v; run(); });
    var runBtn = el("button", { type: "button", class: "w-btn", text: "Search again" });
    var status = el("p", { class: "w-mono" });
    var big = el("p", { class: "w-big" });
    var pick = el("div", { class: "w-actions" });
    var chart = el("div", { class: "ss-chart" });
    var legend = el("div", { class: "c-legend" }, [
      el("span", { class: "ss-lg" }, [el("span", { class: "ss-sw ss-pre" }), "Pre-test"]),
      el("span", { class: "ss-lg" }, [el("span", { class: "ss-sw ss-post" }), "Post-test"])
    ]);
    var detail = el("div", { class: "ss-readout" });
    var summary = el("div", { class: "ss-table-wrap" });
    var src = el("p", { class: "w-source", text: "Reconstruction by this page from Tables II to IV · every list of 18 scores is searched; nothing is sampled" });
    root.appendChild(el("div", { class: "w-actions" }, [el("span", { class: "w-mono", text: "Question:" }), qControl()]));
    root.appendChild(el("div", { class: "w-actions" }, [el("span", { class: "w-mono", text: "Steps:" }), upick, runBtn]));
    [status, big, pick, chart, legend, detail, summary, src].forEach(function (n) { root.appendChild(n); });

    var cache = {};
    var preIdx = 0, postIdx = 0, current = null;
    function unitFor(i) { var k = D.questions[i].unit; return state.unitMode === "fine" ? 2 * k : k; }
    function get(i) {
      var key = i + ":" + unitFor(i);
      if (!cache[key]) cache[key] = E.analyze(i, unitFor(i));
      return cache[key];
    }

    function run() {
      var t0 = (window.performance || Date).now();
      current = get(state.q);
      preIdx = 0; postIdx = 0;
      var ms = (window.performance || Date).now() - t0;
      status.textContent = "Searched Q" + (state.q + 1) + " in steps of 1/" + current.k + (ms > 1 ? " (" + fix(ms, 0) + " ms)" : "") + ".";
      drawAll();
      drawSummary();
    }

    function drawAll() {
      var a = current, i = state.q, r = a.range;
      big.innerHTML = "<strong>" + a.pre.length + "</strong> pre-test " + (a.pre.length === 1 ? "list" : "lists") + " and <strong>" + a.post.length +
        "</strong> post-test " + (a.post.length === 1 ? "list" : "lists") + " of 18 scores reproduce every printed number for Q" + (i + 1) + ".";
      pick.innerHTML = "";
      if (a.pre.length > 1) pick.appendChild(cycler("Pre list", a.pre.length, function () { return preIdx; }, function (v) { preIdx = v; drawHist(); }));
      if (a.post.length > 1) pick.appendChild(cycler("Post list", a.post.length, function () { return postIdx; }, function (v) { postIdx = v; drawHist(); }));
      drawHist();
      var ok = r && r.pMin < Math.pow(10, D.t4.pBound[i]);
      var always = r && r.pMax < Math.pow(10, D.t4.pBound[i]);
      detail.innerHTML = r ? "<p>Paired t across every consistent pre list, post list, and pairing of students within class standing: t(17) from " +
        fix(r.tMin, 2) + " to " + fix(r.tMax, 2) + ", so p from " + sci(r.pMin) + " to " + sci(r.pMax) + ". The paper prints " + bound(D.t4.pBound[i]) + "; " +
        (always ? "every pairing satisfies it." : ok ? "some pairings satisfy it; if the scores are as reconstructed, the paper's pairing is one of them." : "no pairing satisfies it.") + "</p>" : "<p>No consistent list found.</p>";
    }

    function cycler(label, n, getI, setI) {
      var out = el("span", { class: "ss-cycle" });
      var txt = el("span", { class: "w-mono" });
      var prev = el("button", { type: "button", class: "seg-option", text: "←", "aria-label": label + ": previous" });
      var next = el("button", { type: "button", class: "seg-option", text: "→", "aria-label": label + ": next" });
      function show() { txt.textContent = label + " " + (getI() + 1) + " of " + n; }
      prev.addEventListener("click", function () { setI((getI() + n - 1) % n); show(); });
      next.addEventListener("click", function () { setI((getI() + 1) % n); show(); });
      show();
      out.appendChild(prev); out.appendChild(txt); out.appendChild(next);
      return out;
    }

    function drawHist() {
      chart.innerHTML = "";
      var a = current, k = a.k;
      var hp = E.histogram(a.pre[preIdx] || a.pre[0]), hq = E.histogram(a.post[postIdx] || a.post[0]);
      var w = chartWidth(chart), h = 190, top = 14, base = h - 30, L = 30, R = w - 4, maxV = 18;
      var colW = (R - L) / (k + 1), bw = Math.min(26, colW * 0.36);
      function Y(v) { return base - (base - top) * v / maxV; }
      var s = svg("svg", { viewBox: "0 0 " + w + " " + h, class: "ss-svg", role: "img", "aria-label": "Number of students at each score, pre-test and post-test, in the reconstructed lists" });
      [0, 6, 12, 18].forEach(function (t) {
        s.appendChild(svg("line", { x1: L, x2: R, y1: Y(t), y2: Y(t), class: "c-grid" }));
        s.appendChild(svg("text", { x: L - 4, y: Y(t) + 4, "text-anchor": "end", class: "c-tick" }, String(t)));
      });
      for (var v = 0; v <= k; v++) {
        var cx = L + colW * (v + 0.5);
        s.appendChild(svg("rect", { x: cx - bw - 1, y: Y(hp[v]), width: bw, height: base - Y(hp[v]), class: "ss-pre" }));
        s.appendChild(svg("rect", { x: cx + 1, y: Y(hq[v]), width: bw, height: base - Y(hq[v]), class: "ss-post" }));
        if (hp[v]) s.appendChild(svg("text", { x: cx - bw / 2 - 1, y: Y(hp[v]) - 3, "text-anchor": "middle", class: "ss-val" }, String(hp[v])));
        if (hq[v]) s.appendChild(svg("text", { x: cx + bw / 2 + 1, y: Y(hq[v]) - 3, "text-anchor": "middle", class: "ss-val" }, String(hq[v])));
        s.appendChild(svg("text", { x: cx, y: base + 16, "text-anchor": "middle", class: "c-label" }, v === 0 ? "0" : v === k ? "full" : v + "/" + k));
      }
      s.appendChild(svg("text", { x: R, y: h - 2, "text-anchor": "end", class: "c-tick" }, "score on the question (students out of 18)"));
      chart.appendChild(s);
    }

    function drawSummary() {
      var rows = D.questions.map(function (q, i) {
        var a = get(i), r = a.range;
        return "<tr" + (i === state.q ? " class=\"is-on\"" : "") + "><td>Q" + q.id + "</td><td>1/" + a.k + "</td><td>" + a.pre.length + "</td><td>" + a.post.length +
          "</td><td>" + (r ? fix(r.tMin, 2) + " to " + fix(r.tMax, 2) : "—") + "</td><td>" + (r ? sci(r.pMin) + " to " + sci(r.pMax) : "—") +
          "</td><td>" + bound(D.t4.pBound[i]) + "</td></tr>";
      }).join("");
      summary.innerHTML = "<table class=\"ss-table\"><caption class=\"w-note\">All six questions at the selected steps. Lists, t, and p are the page's; the last column is printed.</caption>" +
        "<thead><tr><th>Q</th><th>Step</th><th>Pre lists</th><th>Post lists</th><th>Paired t(17)</th><th>p (page)</th><th>p (paper)</th></tr></thead><tbody>" + rows + "</tbody></table>";
    }

    runBtn.addEventListener("click", function () { cache = {}; run(); });
    qDraws.push(function () { if (current) run(); });
    redraws.push(function () { if (current) drawHist(); });
    run();
  }

  /* ------------------------------------------------------------------ boot */

  function mount(id, fn) {
    var node = document.getElementById(id);
    if (!node) return;
    try { fn(node); node.classList.add("w-ready"); }
    catch (err) { node.appendChild(el("p", { class: "w-note", text: "This demo could not start: " + err.message })); if (window.console) console.error(err); }
  }
  function boot() {
    mount("ss-quiz", mountQuiz);
    mount("ss-design", mountDesign);
    mount("ss-prepost", mountPrePost);
    mount("ss-levels", mountLevels);
    mount("ss-recover", mountRecover);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();

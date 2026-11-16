/*
  WySLICE widget for /papers/wyslice-cs-integration/.
  Mount points in the page: #ws-model, #ws-design, #ws-knowledge, #ws-scale, #ws-reach.

  Demo 1 illustrates the project's first guideline, coding as modeling (ASEE 2021).
  Demo 2 draws the professional development design: phases A to C (ASEE 2024),
         the five days of July 2020, the checkpoints, and the cohorts.
  Demo 3 draws the 2020 knowledge question (ASEE 2021); graduate and researcher
         levels add a Wilson interval and an exact McNemar test computed by the page.
  Demo 4 draws the efficacy instrument's summed scales (ASEE 2021); graduate and
         researcher levels add the paired t-test threshold computed by the page.
  Demo 5 draws three years of reach from WySLICE and WySTACK (ASEE 2024).
  All arithmetic lives in ws-engine.js.
*/
(function () {
  "use strict";

  var E = window.WySliceEngine;
  var D = E.DATA;
  var SVGNS = "http://www.w3.org/2000/svg";

  var state = {
    model: { subject: "science", rule: "add", amount: 1.5, steps: 14 },
    phase: "B",
    day: 0,
    show: "all",
    denom: 21,
    scale: "pste",
    answers: { pste: [], stoe: [] },
    sd: 6,
    reach: "wyslice"
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

  function range(label, min, max, step, value, fmt, onInput) {
    var input = el("input", { type: "range", min: String(min), max: String(max), step: String(step), "aria-label": label });
    input.value = String(value);
    var out = el("output", { "aria-live": "polite", text: fmt(value) });
    input.addEventListener("input", function () { var v = +input.value; out.textContent = fmt(v); onInput(v); });
    var row = el("label", { class: "w-range" }, [el("span", { text: label }), input, out]);
    row.input = input;
    row.out = out;
    return row;
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
  function fmtNum(x) {
    if (Math.abs(x) >= 1000) return Math.round(x).toLocaleString("en-US");
    if (Math.abs(x) >= 100) return x.toFixed(0);
    return (Math.round(x * 10) / 10).toString();
  }

  /* ---------------------------------------------------------------- demo 1: coding as modeling */

  var SUBJECTS = {
    science: { label: "Science", thing: "Bean plant height", unit: "cm", step: "day", start: 2, rule: "add", amount: 1.5, steps: 14,
      addMax: 3, addStep: 0.5, pctMax: 20 },
    math: { label: "Mathematics", thing: "Class savings", unit: "dollars", step: "week", start: 10, rule: "add", amount: 5, steps: 10,
      addMax: 20, addStep: 1, pctMax: 20 },
    social: { label: "Social studies", thing: "Town population", unit: "people", step: "year", start: 1200, rule: "times", amount: 3, steps: 10,
      addMax: 200, addStep: 10, pctMax: 10 }
  };

  function mountModel(root) {
    var m = state.model;
    var subjSeg = segmented("Subject", Object.keys(SUBJECTS).map(function (k) { return { value: k, label: SUBJECTS[k].label }; }), m.subject, function (v) {
      var s = SUBJECTS[v];
      m.subject = v; m.rule = s.rule; m.amount = s.amount; m.steps = s.steps;
      ruleSeg.set(m.rule); syncSliders(); draw();
    });
    var ruleSeg = segmented("Change rule", [
      { value: "add", label: "Add the same amount" },
      { value: "times", label: "Grow by a percent" }
    ], m.rule, function (v) {
      var s = SUBJECTS[m.subject];
      m.rule = v; m.amount = v === "add" ? s.addMax / 2 : Math.round(s.pctMax / 2);
      syncSliders(); draw();
    });
    var amountRow = range("Change each step", 0, 10, 1, m.amount, function (v) { return String(v); }, function (v) { m.amount = v; draw(); });
    var stepsRow = range("Repeat", 1, 20, 1, m.steps, function (v) { return v + "×"; }, function (v) { m.steps = v; draw(); });

    function syncSliders() {
      var s = SUBJECTS[m.subject];
      var inp = amountRow.input;
      if (m.rule === "add") { inp.min = String(s.addStep); inp.max = String(s.addMax); inp.step = String(s.addStep); }
      else { inp.min = "1"; inp.max = String(s.pctMax); inp.step = "1"; }
      inp.value = String(m.amount);
      amountRow.out.textContent = m.rule === "add" ? "+" + fmtNum(m.amount) : "+" + m.amount + "%";
      amountRow.querySelector("span").textContent = m.rule === "add" ? "Add each " + s.step : "Grow each " + s.step;
      stepsRow.input.value = String(m.steps);
      stepsRow.out.textContent = m.steps + "×";
    }
    amountRow.input.addEventListener("input", function () {
      amountRow.out.textContent = m.rule === "add" ? "+" + fmtNum(m.amount) : "+" + m.amount + "%";
    });

    var program = el("div", { class: "ws-program", role: "group", "aria-label": "The program" });
    var code = el("pre", { class: "ws-code", "data-levels": "ug grad res" });
    var chart = el("div", { class: "ws-chart" });
    var readout = el("p", { class: "w-big", "aria-live": "polite" });

    root.appendChild(el("p", { class: "w-source", text: "Guideline 1 of the project's framework (ASEE 2021): reframe coding as modeling, for example measuring change over time. Illustration built for this page." }));
    root.appendChild(el("div", { class: "w-actions" }, [subjSeg]));
    root.appendChild(el("div", { class: "w-actions" }, [ruleSeg]));
    root.appendChild(amountRow);
    root.appendChild(stepsRow);
    root.appendChild(program);
    root.appendChild(code);
    root.appendChild(chart);
    root.appendChild(readout);
    root.appendChild(note("The same three blocks model a plant, a savings jar, or a town. Only the story around the numbers changes, which is why one coding idea can live inside any subject.", "public hs"));
    root.appendChild(note("Adding a fixed amount draws a straight line (linear change); growing by a percent draws a curve that bends upward (exponential change). Students can test a model by measuring the real thing and comparing.", "hs ug grad res"));

    function draw() {
      var s = SUBJECTS[m.subject];
      var xs = E.modelRun(s.start, m.steps, m.rule, m.amount);
      var last = xs[xs.length - 1];
      program.innerHTML = "";
      var blocks = [
        ["set", s.thing.toLowerCase() + " to " + fmtNum(s.start) + " " + s.unit],
        ["repeat", m.steps + " times (one per " + s.step + ")"],
        ["change", m.rule === "add" ? "add " + fmtNum(m.amount) + " " + s.unit : "multiply by " + (1 + m.amount / 100).toFixed(2) + " (grow " + m.amount + "%)"]
      ];
      blocks.forEach(function (b, i) {
        program.appendChild(el("div", { class: "ws-block ws-block-" + b[0] + (i === 2 ? " ws-indent" : "") }, [
          el("span", { class: "ws-block-key", text: b[0] }), el("span", { class: "ws-block-val", text: b[1] })
        ]));
      });
      code.textContent = "let x = " + s.start + ";            // " + s.thing.toLowerCase() + " (" + s.unit + ")\n" +
        "for (let i = 0; i < " + m.steps + "; i++) {\n" +
        "  x = " + (m.rule === "add" ? "x + " + m.amount : "x * " + (1 + m.amount / 100).toFixed(2)) + ";\n" +
        "}";
      drawChart(xs, s);
      readout.textContent = "After " + m.steps + " " + s.step + (m.steps === 1 ? "" : "s") + ": " + fmtNum(last) + " " + s.unit + ".";
    }

    function drawChart(xs, s) {
      chart.innerHTML = "";
      var W = chartWidth(chart), H = 220, L = 52, R = 14, T = 12, B = 34;
      var maxY = Math.max.apply(null, xs) * 1.08, minY = 0;
      var root2 = svg("svg", { viewBox: "0 0 " + W + " " + H, class: "ws-svg", role: "img",
        "aria-label": s.thing + " over " + (xs.length - 1) + " steps, from " + fmtNum(xs[0]) + " to " + fmtNum(xs[xs.length - 1]) });
      var px = function (i) { return L + (W - L - R) * i / (xs.length - 1); };
      var py = function (v) { return T + (H - T - B) * (1 - (v - minY) / (maxY - minY)); };
      for (var g = 0; g <= 4; g++) {
        var v = minY + (maxY - minY) * g / 4;
        root2.appendChild(svg("line", { x1: L, x2: W - R, y1: py(v), y2: py(v), class: "c-grid" }));
        root2.appendChild(svg("text", { x: L - 6, y: py(v) + 4, "text-anchor": "end", class: "c-tick" }, fmtNum(v)));
      }
      var every = Math.ceil((xs.length - 1) / 10);
      for (var i = 0; i < xs.length; i += every) {
        root2.appendChild(svg("text", { x: px(i), y: H - B + 16, "text-anchor": "middle", class: "c-tick" }, String(i)));
      }
      root2.appendChild(svg("text", { x: (L + W - R) / 2, y: H - 4, "text-anchor": "middle", class: "c-label" }, s.step + "s"));
      var d = xs.map(function (v, i) { return (i ? "L" : "M") + px(i).toFixed(1) + "," + py(v).toFixed(1); }).join("");
      root2.appendChild(svg("path", { d: d, class: "ws-line" }));
      xs.forEach(function (v, i) { root2.appendChild(svg("circle", { cx: px(i), cy: py(v), r: 3, class: "ws-pt" })); });
      chart.appendChild(root2);
    }

    syncSliders();
    draw();
    redraws.push(draw);
  }

  /* ---------------------------------------------------------------- demo 2: the design */

  var PHASES = {
    A: { name: "Phase A", title: "Preliminary assessment and scaffolding", src: "ASEE 2024",
      rows: [["Before the week", "Pre-survey: the 25-item efficacy instrument and four knowledge questions (ASEE 2021)"],
             ["Who", "K–8 teachers, administrators, and state librarians"]] },
    B: { name: "Phase B", title: "Week-long professional development on effective integration of CS in X", src: "ASEE 2021 and 2024",
      rows: [] },
    C: { name: "Phase C", title: "Year-long implementation and support", src: "ASEE 2021 and 2024",
      rows: [["Plans", "Over 49 lesson plans and 30 implementation plans from the 2020 cohort"],
             ["Support", "Master teachers and educational scholars; a monthly networked improvement community meeting"],
             ["Listening", "A focus group: 17 volunteered, eight were drawn at random, six took part (three teachers, two librarians, one master teacher)"],
             ["Sharing", "A lesson plan bank, and state libraries carrying the approach to rural communities"]] }
  };

  function mountDesign(root) {
    var phaseSeg = segmented("Phase", ["A", "B", "C"].map(function (k) { return { value: k, label: PHASES[k].name }; }), state.phase, function (v) { state.phase = v; draw(); });
    var timeline = el("div", { class: "ws-chart" });
    var head = el("p", { class: "w-big", "aria-live": "polite" });
    var rows = el("div", { class: "ws-rows" });
    var cohorts = el("div", { class: "ws-chart" });

    root.appendChild(el("p", { class: "w-source", text: "Design from ASEE 2024 (phases, cohorts) and ASEE 2021 (the July 2020 week, surveys, focus group)" }));
    root.appendChild(el("div", { class: "w-actions" }, [phaseSeg]));
    root.appendChild(timeline);
    root.appendChild(head);
    root.appendChild(rows);
    root.appendChild(el("p", { class: "w-mono", text: "Cohorts by summer (ASEE 2024), with the July 2020 week as ASEE 2021 reports it" }));
    root.appendChild(cohorts);
    root.appendChild(note("Cohorts doubled each summer: 20, then 40, then 80 educators, 140 in all. The July 2020 week reports 24 participants, and the 2024 paper reports that WySLICE reached over 150 teachers and librarians.", "ug grad res"));

    function draw() {
      var p = PHASES[state.phase];
      head.textContent = p.name + ": " + p.title + ".";
      rows.innerHTML = "";
      if (state.phase === "B") {
        D.pd2020.days.forEach(function (t, i) {
          rows.appendChild(el("div", { class: "ws-row" }, [
            el("span", { class: "ws-row-name", text: "Day " + (i + 1) + (i === 0 ? " · July 6" : i === 4 ? " · July 10" : "") }),
            el("span", { class: "ws-row-val", text: t })
          ]));
        });
        rows.appendChild(el("div", { class: "ws-row" }, [
          el("span", { class: "ws-row-name", text: "End of week" }),
          el("span", { class: "ws-row-val", text: "Post-survey; 21 of 24 completed both surveys" })
        ]));
      } else {
        p.rows.forEach(function (r) {
          rows.appendChild(el("div", { class: "ws-row" }, [el("span", { class: "ws-row-name", text: r[0] }), el("span", { class: "ws-row-val", text: r[1] })]));
        });
      }
      drawTimeline();
      drawCohorts();
    }

    function drawTimeline() {
      timeline.innerHTML = "";
      var W = chartWidth(timeline), H = 92, L = 8, R = 8;
      var s = svg("svg", { viewBox: "0 0 " + W + " " + H, class: "ws-svg", role: "img", "aria-label": "Timeline: phase A, a five-day phase B, then a year-long phase C, with checkpoints" });
      var spans = [["A", 0, 0.14], ["B", 0.14, 0.40], ["C", 0.40, 1]];
      var x = function (f) { return L + (W - L - R) * f; };
      spans.forEach(function (sp) {
        var on = sp[0] === state.phase;
        var r = svg("rect", { x: x(sp[1]) + 1, y: 22, width: x(sp[2]) - x(sp[1]) - 2, height: 20, class: on ? "ws-span ws-span-on" : "ws-span" });
        r.style.cursor = "pointer";
        r.addEventListener("click", function () { state.phase = sp[0]; phaseSeg.set(sp[0]); draw(); });
        s.appendChild(r);
        s.appendChild(svg("text", { x: (x(sp[1]) + x(sp[2])) / 2, y: 16, "text-anchor": "middle", class: "c-label" }, "Phase " + sp[0]));
      });
      var marks = [[0.14, "pre-survey", "middle"], [0.40, "post-survey", "middle"], [0.99, "classroom use", "end"]];
      marks.forEach(function (mk) {
        s.appendChild(svg("line", { x1: x(mk[0]), x2: x(mk[0]), y1: 44, y2: 56, class: "ws-mark" }));
        s.appendChild(svg("text", { x: x(mk[0]), y: 72, "text-anchor": mk[2], class: "c-tick" }, mk[1]));
      });
      timeline.appendChild(s);
    }

    function drawCohorts() {
      cohorts.innerHTML = "";
      var data = [["July 2020 week", 24], ["Year 1", 20], ["Year 2", 40], ["Year 3", 80]];
      var W = chartWidth(cohorts), rowH = 24, H = data.length * rowH + 10, L = Math.min(170, W * 0.42), R = 40;
      var s = svg("svg", { viewBox: "0 0 " + W + " " + H, class: "ws-svg", role: "img", "aria-label": "Cohorts: 24 in the July 2020 week (ASEE 2021); 20, 40, and 80 by year (ASEE 2024)" });
      var x = function (v) { return L + (W - L - R) * v / 80; };
      data.forEach(function (d, i) {
        var y = 6 + i * rowH;
        s.appendChild(svg("text", { x: L - 8, y: y + 14, "text-anchor": "end", class: "c-label" }, d[0]));
        s.appendChild(svg("rect", { x: L, y: y + 3, width: Math.max(1, x(d[1]) - L), height: 14, class: i === 0 ? "ws-bar ws-bar-alt" : "ws-bar" }));
        s.appendChild(svg("text", { x: x(d[1]) + 6, y: y + 14, class: "c-tick" }, String(d[1])));
      });
      cohorts.appendChild(s);
    }

    draw();
    redraws.push(draw);
  }

  /* ---------------------------------------------------------------- demo 3: the knowledge question */

  // The only arrangement that fits both statements in ASEE 2021: 17 correct before, 20 after,
  // and all four who were wrong before were right after. That leaves one person right before, wrong after.
  var PEOPLE = (function () {
    var out = [];
    for (var i = 0; i < 16; i++) out.push({ pre: 1, post: 1 });
    for (i = 0; i < 4; i++) out.push({ pre: 0, post: 1 });
    out.push({ pre: 1, post: 0 });
    return out;
  })();

  function mountKnowledge(root) {
    var showSeg = segmented("Highlight", [
      { value: "all", label: "Everyone" },
      { value: "gain", label: "Wrong, then right" },
      { value: "slip", label: "Right, then wrong" }
    ], state.show, function (v) { state.show = v; draw(); });
    var denomSeg = segmented("Out of", [
      { value: 21, label: "Out of 21" },
      { value: 24, label: "Out of 24" }
    ], state.denom, function (v) { state.denom = v; draw(); });
    denomSeg.setAttribute("data-levels", "ug grad res");
    var chart = el("div", { class: "ws-chart" });
    var readout = el("div", { class: "ws-readout", "aria-live": "polite" });
    var stats = el("div", { class: "ws-readout", "data-levels": "grad res" });

    root.appendChild(el("p", { class: "w-source", text: "“Which of the following best describes Computer Science?” The answer about problem solving was correct. ASEE 2021, 21 educators with both surveys" }));
    root.appendChild(el("div", { class: "w-actions" }, [showSeg, denomSeg]));
    root.appendChild(chart);
    root.appendChild(readout);
    root.appendChild(stats);

    function draw() {
      chart.innerHTML = "";
      var W = chartWidth(chart), H = 250, colX = [W * 0.25, W * 0.75], T = 34, rowH = (H - T - 12) / 11;
      var s = svg("svg", { viewBox: "0 0 " + W + " " + H, class: "ws-svg", role: "img",
        "aria-label": "21 educators before and after: 17 correct before, 20 correct after; four moved to correct, one moved away" });
      ["Before the week", "After the week"].forEach(function (t, c) {
        s.appendChild(svg("text", { x: colX[c], y: 16, "text-anchor": "middle", class: "c-label" }, t));
      });
      function pos(i, c) {
        var col = i % 2, row = Math.floor(i / 2);
        return [colX[c] + (col ? 9 : -9), T + row * rowH + rowH / 2];
      }
      // order each column: correct first, then wrong
      function order(key) {
        var idx = PEOPLE.map(function (_, i) { return i; });
        idx.sort(function (a, b) { return PEOPLE[b][key] - PEOPLE[a][key] || a - b; });
        var place = {};
        idx.forEach(function (p, j) { place[p] = j; });
        return place;
      }
      var pre = order("pre"), post = order("post");
      var dots = [];
      PEOPLE.forEach(function (p, i) {
        var a = pos(pre[i], 0), b = pos(post[i], 1);
        var kind = p.pre === p.post ? "same" : p.post ? "gain" : "slip";
        var hot = state.show === kind;
        if (kind !== "same" || state.show === "all") {
          s.appendChild(svg("line", { x1: colX[0] + 16, y1: a[1], x2: colX[1] - 16, y2: b[1],
            class: "ws-link" + (hot ? " ws-link-hot" : "") + (kind === "same" ? " ws-link-same" : "") }));
          [a, b].forEach(function (q, c) {
            if (Math.abs(q[0] - colX[c]) > 0 && ((c === 0 && q[0] < colX[0]) || (c === 1 && q[0] > colX[1]))) {
              s.appendChild(svg("line", { x1: q[0], y1: q[1], x2: c === 0 ? colX[0] + 16 : colX[1] - 16, y2: q[1],
                class: "ws-link" + (hot ? " ws-link-hot" : "") + (kind === "same" ? " ws-link-same" : "") }));
            }
          });
        }
        dots.push([a, b, p, hot]);
      });
      dots.forEach(function (d) {
        var a = d[0], b = d[1], p = d[2], hot = d[3];
        [[a, p.pre], [b, p.post]].forEach(function (pt) {
          s.appendChild(svg("circle", { cx: pt[0][0], cy: pt[0][1], r: 6,
            class: "ws-dot" + (pt[1] ? " ws-dot-on" : "") + (hot ? " ws-dot-hot" : "") }));
        });
      });
      chart.appendChild(s);

      var n = state.denom;
      var preShare = D.pd2020.knowledge.pre / n, postShare = D.pd2020.knowledge.post / n;
      readout.innerHTML = "";
      readout.appendChild(el("p", { class: "w-big", text: "Correct: 17 before, 20 after." }));
      readout.appendChild(el("p", { "data-levels": "public hs", text:
        "Filled dots chose the right answer. The four people who started wrong all finished right. For the total to reach 20 and not 21, one person who started right must have finished wrong; the paper does not mention that person." }));
      var match = n === 21;
      readout.appendChild(el("p", { "data-levels": "ug grad res", html:
        "Printed: 81% before and 95% after. Out of " + n + ": 17 is " + pct(preShare, 1) + " and 20 is " + pct(postShare, 1) +
        (match ? ", which round to the printed shares. The percentages use the 21 educators with both surveys." :
          ". Neither rounds to the printed shares, so the percentages do not use all 24 participants.") }));
      readout.appendChild(el("p", { "data-levels": "ug grad res", text:
        "Statements: 17 right before, 20 right after, and all four early misses corrected. Together they force a fifth change, one right answer that turned wrong." }));

      var ciPre = E.wilson(17, 21), ciPost = E.wilson(20, 21);
      var p = E.mcnemarExact(4, 1);
      stats.innerHTML = "";
      stats.appendChild(el("p", { class: "ws-own", text: "Computed by this page, not reported in the paper" }));
      stats.appendChild(el("p", { text: "95% Wilson intervals: before " + pct(ciPre[0]) + " to " + pct(ciPre[1]) + "; after " + pct(ciPost[0]) + " to " + pct(ciPost[1]) + " (n = 21 each)." }));
      stats.appendChild(el("p", { text: "Exact McNemar test on the five people who changed (four up, one down): two-sided p = " + p.toFixed(3) +
        ". With so few changes, even five up and none down would give p = " + E.mcnemarExact(5, 0).toFixed(4) + ". One question with a high starting rate leaves little room to show a gain." }));
    }

    draw();
    redraws.push(draw);
  }

  /* ---------------------------------------------------------------- demo 4: the instrument */

  function mountScale(root) {
    var st = D.pd2020.stebi;
    var scaleSeg = segmented("Scale", [
      { value: "pste", label: "Personal efficacy (13 items)" },
      { value: "stoe", label: "Outcome expectancy (12 items)" }
    ], state.scale, function (v) { state.scale = v; draw(); });
    var grid = el("div", { class: "ws-items", role: "group", "aria-label": "Item answers" });
    var actions = el("div", { class: "w-actions" }, [
      el("button", { type: "button", class: "w-btn w-btn-quiet", text: "All uncertain (3)", onclick: function () { fill(3); } }),
      el("button", { type: "button", class: "w-btn w-btn-quiet", text: "All strongly agree (5)", onclick: function () { fill(5); } }),
      el("button", { type: "button", class: "w-btn w-btn-quiet", text: "Random teacher", onclick: function () { fill(0); } })
    ]);
    var bar = el("div", { class: "ws-chart" });
    var readout = el("p", { class: "w-big", "aria-live": "polite" });
    var sdRow = range("SD of the change", 1, 15, 0.5, state.sd, function (v) { return v.toFixed(1); }, function (v) { state.sd = v; drawThreshold(); });
    sdRow.setAttribute("data-levels", "grad res");
    var thr = el("div", { class: "ws-readout", "data-levels": "grad res" });

    root.appendChild(el("p", { class: "w-source", text: "Science Teaching Efficacy Belief Instrument (Riggs and Enochs, 1990), reworded for computer science: 25 items, five-point scale, summed (ASEE 2021)" }));
    root.appendChild(el("div", { class: "w-actions" }, [scaleSeg]));
    root.appendChild(note("Tap an item to change its answer: 1 strongly disagree, 2 disagree, 3 uncertain, 4 agree, 5 strongly agree. The paper does not print the item wording, so items are numbered only.", "public hs ug grad res"));
    root.appendChild(grid);
    root.appendChild(actions);
    root.appendChild(bar);
    root.appendChild(readout);
    root.appendChild(el("p", { class: "w-mono", "data-levels": "grad res", text: "What a paired t-test with 21 educators can detect" }));
    root.appendChild(sdRow);
    root.appendChild(thr);

    function cur() { var a = state.answers[state.scale]; var k = st[state.scale].items; while (a.length < k) a.push(3); return a; }
    function fill(v) { var a = cur(); for (var i = 0; i < a.length; i++) a[i] = v || (1 + Math.floor(Math.random() * 5)); draw(); }

    function draw() {
      var a = cur(), sc = st[state.scale], r = E.scaleRange(sc.items, st.points);
      grid.innerHTML = "";
      a.forEach(function (v, i) {
        var b = el("button", { type: "button", class: "ws-item", "aria-label": "Item " + (i + 1) + ", answer " + v }, [
          el("span", { class: "ws-item-num", text: String(i + 1) }), el("span", { class: "ws-item-val", text: String(v) })
        ]);
        b.addEventListener("click", function () { a[i] = a[i] % 5 + 1; draw(); });
        grid.appendChild(b);
      });
      var sum = a.reduce(function (x, y) { return x + y; }, 0);
      drawBar(sum, r);
      readout.textContent = "Score " + sum + " on a scale from " + r.min + " to " + r.max + " (middle " + r.mid + "). Reliability reported: α = " + sc.alpha.toFixed(2) + ".";
      drawThreshold();
    }

    function drawBar(sum, r) {
      bar.innerHTML = "";
      var W = chartWidth(bar), H = 56, L = 14, R = 14;
      var s = svg("svg", { viewBox: "0 0 " + W + " " + H, class: "ws-svg", role: "img", "aria-label": "Score " + sum + " between " + r.min + " and " + r.max });
      var x = function (v) { return L + (W - L - R) * (v - r.min) / (r.max - r.min); };
      s.appendChild(svg("rect", { x: L, y: 14, width: W - L - R, height: 12, class: "ws-track" }));
      s.appendChild(svg("rect", { x: L, y: 14, width: Math.max(1, x(sum) - L), height: 12, class: "ws-bar" }));
      s.appendChild(svg("line", { x1: x(r.mid), x2: x(r.mid), y1: 10, y2: 30, class: "ws-mark" }));
      [r.min, r.mid, r.max].forEach(function (v, i) {
        s.appendChild(svg("text", { x: x(v), y: 46, "text-anchor": i === 0 ? "start" : i === 2 ? "end" : "middle", class: "c-tick" }, String(v)));
      });
      bar.appendChild(s);
    }

    function drawThreshold() {
      var res = E.smallestDetected(21, state.sd, 0.05);
      thr.innerHTML = "";
      thr.appendChild(el("p", { class: "ws-own", text: "Computed by this page; the paper reports no means, standard deviations, or test statistics" }));
      thr.appendChild(el("p", { text: "With 21 pairs, a two-sided test at α = .05 needs |t| ≥ " + res.tcrit.toFixed(3) + " (20 degrees of freedom). If teachers' score changes have a standard deviation of " +
        state.sd.toFixed(1) + " points, any average gain above " + res.change.toFixed(2) + " points reaches significance." }));
    }

    draw();
    redraws.push(drawThreshold);
  }

  /* ---------------------------------------------------------------- demo 5: reach */

  function mountReach(root) {
    var P = D.program2024;
    var seg = segmented("Program", [
      { value: "wyslice", label: "Both projects" },
      { value: "wystack", label: "WySTACK teachers" }
    ], state.reach, function (v) { state.reach = v; draw(); });
    var rows = el("div", { class: "ws-rows" });
    var chart = el("div", { class: "ws-chart" });

    root.appendChild(el("p", { class: "w-source", text: "ASEE 2024: WySLICE (NSF DRL 1923542) with WySTACK, a virtual research experience for teachers (NSF CNS 2055621)" }));
    root.appendChild(el("div", { class: "w-actions" }, [seg]));
    root.appendChild(rows);
    root.appendChild(chart);

    function row(name, val, frac) {
      var r = el("div", { class: "ws-row ws-row-bar" }, [el("span", { class: "ws-row-name", text: name }), el("span", { class: "ws-row-val", text: val })]);
      if (frac !== undefined) {
        var wrap = el("span", { class: "ws-dbar-wrap" });
        var b = el("span", { class: "ws-dbar" });
        b.style.width = (100 * frac).toFixed(1) + "%";
        wrap.appendChild(b);
        r.appendChild(wrap);
      }
      return r;
    }

    function draw() {
      rows.innerHTML = "";
      chart.innerHTML = "";
      if (state.reach === "wyslice") {
        rows.appendChild(row("Educators", "over " + P.educatorsOver + " (K–16 and collegiate)"));
        rows.appendChild(row("Activities joining computing with another subject", "over " + P.activitiesOver));
        rows.appendChild(row("Students", "nearly " + P.studentsNearly.toLocaleString("en-US")));
        rows.appendChild(row("Days of instruction", P.instructionDaysOver + "+"));
        rows.appendChild(row("WySLICE teachers and state librarians", "over " + P.reachedOver));
        rows.appendChild(note("Totals cover both projects across the K–12 grade bands, as the 2024 paper reports them. The paper gives them as round floors (over, nearly), so the page shows them as text rather than as exact bars.", "ug grad res"));
      } else {
        var w = P.wystack;
        rows.appendChild(row("Teachers", w.teachers + " high school STEM teachers, " + w.perYear + " a year for " + words(w.years) + " years (" + w.perYear + " × " + w.years + " = " + (w.perYear * w.years) + ")"));
        rows.appendChild(row("Knowledge items answered correctly", w.knowledgePct + "%", w.knowledgePct / 100));
        rows.appendChild(row("Perception items that rose, pre to follow-up", words(w.perceptionUp) + " of " + words(w.perceptionItems), w.perceptionUp / w.perceptionItems));
        rows.appendChild(row("Training was a good use of time", w.ratings.training.toFixed(1) + " of 4", w.ratings.training / 4));
        rows.appendChild(row("Faculty mentors", w.ratings.faculty.toFixed(1) + " of 4", w.ratings.faculty / 4));
        rows.appendChild(row("Graduate assistants", w.ratings.gradAssistants.toFixed(1) + " of 4", w.ratings.gradAssistants / 4));
        rows.appendChild(note("All participants built integrated computing into their lessons or activities and planned to continue the next school year, in subjects from life science and astronomy to geometry, phonics, and reading.", "public hs ug grad res"));
      }
    }

    draw();
  }

  /* ---------------------------------------------------------------- boot */

  function mount(id, fn) {
    var node = document.getElementById(id);
    if (!node) return;
    fn(node);
    node.classList.add("w-ready");
  }

  function boot() {
    mount("ws-model", mountModel);
    mount("ws-design", mountDesign);
    mount("ws-knowledge", mountKnowledge);
    mount("ws-scale", mountScale);
    mount("ws-reach", mountReach);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();

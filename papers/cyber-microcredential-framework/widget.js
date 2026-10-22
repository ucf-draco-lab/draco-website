/*
  Widget for /papers/cyber-microcredential-framework/.
  Mount points: #cf-cia, #cf-pilots, #cf-people, #cf-hours.

  Demo 1 (the tool): a Module 1 style CIA triad check with retakes. The items
         are the page's own; the course's quiz items are not printed.
  Demo 2 (the design): the two pilots, their modules, supports, and data
         sources, from the paper's Methods and Participants sections.
  Demo 3 (who took part): the printed shares, drawn as the whole counts the
         page reconstructs from them.
  Demo 4 (time and scores): the paper's two correlations, a simulated class
         that shows how prior knowledge can produce a negative correlation,
         and (graduate and researcher) the page's own significance check.
  All arithmetic lives in cf-engine.js.
*/
(function () {
  "use strict";

  var E = window.CFEngine;
  var P = E.PAPER;
  var SVGNS = "http://www.w3.org/2000/svg";

  /* ------------------------------------------------------------- helpers */

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

  function range(label, min, max, step, value, fmt, onInput) {
    var id = "cf-r-" + Math.random().toString(36).slice(2, 8);
    var out = el("output", { for: id, text: fmt(value) });
    var input = el("input", { type: "range", id: id, min: String(min), max: String(max), step: String(step), value: String(value) });
    input.addEventListener("input", function () { out.textContent = fmt(+input.value); onInput(+input.value); });
    return el("div", { class: "w-range" }, [el("label", { for: id, text: label }), input, out]);
  }

  function fmtR(r) { return (r < 0 ? "−" : "") + Math.abs(r).toFixed(2); }
  function fmtP(p) {
    if (p < 0.001) return "< 0.001";
    return p.toFixed(p < 0.01 ? 3 : 2);
  }
  function pct(k, n) { return Math.floor(100 * k / n + 0.5); }

  /* ----------------------------------------- demo 1: CIA triad check */

  var CIA = { C: "Confidentiality", I: "Integrity", A: "Availability" };
  var ITEMS = [
    { q: "A student reads a classmate's grades over a teacher's shoulder.", a: "C", why: "Someone saw information meant for others. Nothing changed and nothing went offline." },
    { q: "A virus changes several answers in the gradebook before report cards print.", a: "I", why: "The information is still private and reachable, but it is no longer correct." },
    { q: "The district's learning site goes down on the day an online test is due.", a: "A", why: "The right people cannot reach the information when they need it." },
    { q: "A teacher emails a class list with home addresses to the wrong parent group.", a: "C", why: "Private information reached people who should not have it." },
    { q: "Someone edits a shared lab data sheet so the results look better.", a: "I", why: "The data were altered without permission, so they can no longer be trusted." },
    { q: "Ransomware locks every file on the school's servers until a payment is made.", a: "A", why: "The files still exist, but no one can open them. (Many ransomware groups also copy files, which breaks confidentiality too.)" },
    { q: "A password written on a sticky note lets a visitor log in as the principal.", a: "C", why: "The password protected secret access; once seen, the secret is gone." },
    { q: "A software update quietly changes how the attendance system records late arrivals.", a: "I", why: "The records are wrong even though nobody stole or blocked them." },
    { q: "Too many students stream video at once and the school network stops loading pages.", a: "A", why: "The network still works in principle, but nobody can use it right now." }
  ];

  function mountCIA(root) {
    var state = { i: 0, answers: {}, attempts: 0, firstScore: null, best: 0, done: false };
    var body = el("div");
    var head = el("p", { class: "w-mono" });
    root.appendChild(note("A check in the style of Module 1's formative quiz. The nine scenarios are this page's own; the paper does not print the course's quiz items.", ""));
    root.appendChild(head);
    root.appendChild(body);
    var log = el("div", { class: "cf-log" });
    root.appendChild(log);

    function score() { var s = 0; ITEMS.forEach(function (it, i) { if (state.answers[i] === it.a) s++; }); return s; }

    function renderLog() {
      log.innerHTML = "";
      if (state.attempts === 0) return;
      var rows = [
        ["Attempts", String(state.attempts)],
        ["First score", state.firstScore + " of " + ITEMS.length],
        ["Best score", state.best + " of " + ITEMS.length]
      ];
      var t = el("div", { class: "cf-rows" });
      rows.forEach(function (r) { t.appendChild(el("div", { class: "cf-row" }, [el("span", { class: "cf-k", text: r[0] }), el("span", { class: "cf-v", text: r[1] })])); });
      log.appendChild(t);
      log.appendChild(note("The course let teachers retake each quiz, and only the final assessment counted. A best score after retakes mostly records persistence, which is one reason the authors judged the quiz scores a poor measure of learning.", "ug grad res"));
      log.appendChild(note("Quizzes in the course could be retaken, so a best score shows who kept going, not only who knew the answer first.", "public hs"));
    }

    function render() {
      body.innerHTML = "";
      head.textContent = state.done ? "Attempt " + state.attempts + " finished" : "Scenario " + (state.i + 1) + " of " + ITEMS.length + (state.attempts ? " · attempt " + (state.attempts + 1) : "");
      if (state.done) {
        var s = score();
        body.appendChild(el("p", { class: "w-big", text: s + " of " + ITEMS.length + " correct" }));
        var list = el("div", { class: "cf-rows" });
        ITEMS.forEach(function (it, i) {
          var ok = state.answers[i] === it.a;
          list.appendChild(el("div", { class: "cf-row cf-row-wide" + (ok ? "" : " cf-miss") }, [
            el("span", { class: "cf-k", text: (ok ? "✓ " : "✗ ") + CIA[it.a] }),
            el("span", { class: "cf-v cf-text", text: it.q })
          ]));
        });
        body.appendChild(list);
        body.appendChild(el("div", { class: "w-actions" }, [
          el("button", { type: "button", class: "w-btn", text: "Retake", onclick: function () { state.i = 0; state.answers = {}; state.done = false; render(); } })
        ]));
        return;
      }
      var it = ITEMS[state.i];
      body.appendChild(el("p", { class: "cf-q", text: it.q }));
      var picked = state.answers[state.i];
      var btns = el("div", { class: "w-actions", role: "group", "aria-label": "Which part of the CIA triad does this break?" });
      ["C", "I", "A"].forEach(function (k) {
        var cls = "w-btn w-btn-quiet cf-choice";
        if (picked) cls += k === it.a ? " cf-right" : (k === picked ? " cf-wrong" : "");
        btns.appendChild(el("button", {
          type: "button", class: cls, text: CIA[k], "aria-pressed": picked === k ? "true" : "false",
          onclick: function () { if (!state.answers.hasOwnProperty(state.i)) { state.answers[state.i] = k; render(); } }
        }));
      });
      body.appendChild(btns);
      if (picked) {
        body.appendChild(el("p", { class: "w-note", html: (picked === it.a ? "<strong>Right.</strong> " : "<strong>This one breaks " + CIA[it.a].toLowerCase() + ".</strong> ") + it.why }));
        body.appendChild(el("div", { class: "w-actions" }, [
          el("button", { type: "button", class: "w-btn", text: state.i + 1 < ITEMS.length ? "Next scenario" : "See score", onclick: function () {
            if (state.i + 1 < ITEMS.length) state.i++;
            else {
              state.done = true; state.attempts++;
              var s = score();
              if (state.firstScore === null) state.firstScore = s;
              state.best = Math.max(state.best, s);
              renderLog();
            }
            render();
          } })
        ]));
      }
    }
    render();
  }

  /* --------------------------------------------- demo 2: two pilots */

  function mountPilots(root) {
    var state = { pilot: 2 };
    var controls = el("div", { class: "w-actions" });
    var chart = el("div", { class: "cf-chart" });
    var rows = el("div");
    root.appendChild(controls);
    root.appendChild(chart);
    root.appendChild(rows);

    controls.appendChild(segmented("Pilot", [{ value: 1, label: "Pilot 1 · summer 2020" }, { value: 2, label: "Pilot 2 · fall 2020" }], state.pilot, function (v) { state.pilot = v; draw(); }));

    function draw() {
      var W = chartWidth(chart), H = 128, L = 56, R = 38;
      var x = function (d) { return L + (W - L - R) * d / 42; };
      chart.innerHTML = "";
      var s = svg("svg", { class: "cf-svg", viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": "Pilot lengths: Pilot 1 ran 28 days with modules 0 and 1; Pilot 2 ran 42 days with modules 0 to 4." });
      [0, 7, 14, 21, 28, 35, 42].forEach(function (d) {
        s.appendChild(svg("line", { class: "c-grid", x1: x(d), x2: x(d), y1: 12, y2: H - 22 }));
        s.appendChild(svg("text", { class: "c-tick", x: x(d), y: H - 6, "text-anchor": "middle" }, d === 0 ? "day 0" : "wk " + d / 7));
      });
      [1, 2].forEach(function (k, row) {
        var p = P.pilots[k], y = 22 + row * 44, on = k === state.pilot;
        s.appendChild(svg("text", { class: "c-label", x: 0, y: y + 13 }, "Pilot " + k));
        var nMod = p.modules.length;
        for (var m = 0; m < nMod; m++) {
          var a = x(p.days * m / nMod), b = x(p.days * (m + 1) / nMod);
          s.appendChild(svg("rect", { class: on ? "cf-bar-on" : "cf-bar", x: a + 1, y: y, width: Math.max(1, b - a - 2), height: 18 }));
          if (b - a > 22) s.appendChild(svg("text", { class: on ? "cf-bar-text" : "c-tick", x: (a + b) / 2, y: y + 13, "text-anchor": "middle" }, "M" + m));
        }
        s.appendChild(svg("text", { class: "c-tick", x: x(p.days) + 4, y: y + 13 }, p.days + " d"));
      });
      chart.appendChild(s);
      chart.appendChild(note("Bars show each pilot's length; the module blocks are drawn evenly because the paper does not give a week-by-week schedule.", "ug grad res"));

      var p = P.pilots[state.pilot];
      rows.innerHTML = "";
      var list = el("div", { class: "cf-rows" });
      function row(k, v, levels) {
        var r = el("div", { class: "cf-row" }, [el("span", { class: "cf-k", text: k }), el("span", { class: "cf-v", html: v })]);
        if (levels) r.setAttribute("data-levels", levels);
        list.appendChild(r);
      }
      row("Dates", p.start + " to " + p.end + " (" + p.weeks + " weeks)");
      row("Teachers", state.pilot === 1 ? "9 enrolled, 5 completed every part" : "16 enrolled and studied");
      row("Modules", p.modules.join("; "));
      row("Each module", "Websites, journal articles, short videos" + (state.pilot === 2 ? ", interactive flashcards" : "") + ", and one formative quiz that could be retaken");
      row("Final assessment", "Teachers chose how to show what they learned from an “assessment bingo” menu (for example, a teaching video, a presentation, or a brochure)");
      row("Support", "Opening virtual meeting, weekly virtual office hours, email, closing virtual meeting");
      row("Checkpoints", p.progressReports + " biweekly progress reports, " + p.focusGroups + " focus group, " + p.interviews + " interviews", "");
      row("Time measure", "Total hours in the modules, from the learning management system (Canvas)", "ug grad res");
      row("Scores", "Assessment scores and lesson plan scores (no rubric or point scale printed)", "ug grad res");
      rows.appendChild(list);
    }
    draw();
    redraws.push(draw);
  }

  /* ------------------------------------------- demo 3: who took part */

  function mountPeople(root) {
    var sol = E.reconstruct()[0];
    var p1 = P.pilots[1], p2 = P.pilots[2];
    var VIEWS = {
      role: { label: "Teaching role", groups: ["Computer science", "Other subjects"],
        counts: { 1: [p1.cs, p1.noncs], 2: [p2.cs, p2.noncs] }, printed: null },
      gender: { label: "Gender", groups: ["Female", "Male"],
        counts: { 1: [p1.genderCounts.Female, p1.genderCounts.Male], 2: [p2.genderCounts.Female, p2.genderCounts.Male] },
        printed: { 1: [60, 40], 2: [69, 31], all: [67, 33] } },
      race: { label: "Race or ethnicity", groups: ["White", "Native American", "Asian/Pacific Islander", "Scotch-Irish"],
        counts: { 1: [sol.pilot1.White, sol.pilot1["Native American"], 0, sol.pilot1["Scotch-Irish"]],
                  2: [sol.pilot2.White, sol.pilot2["Native American"], sol.pilot2["Asian/Pacific Islander"], 0] },
        printed: { 1: [60, 20, null, 20], 2: [74, 13, 13, null], all: [71, 14, 10, 5] } }
    };
    var state = { view: "role", pilot: "all" };
    var controls = el("div", { class: "w-actions" });
    var chart = el("div", { class: "cf-chart" });
    var table = el("div", { class: "cf-table-wrap" });
    root.appendChild(controls);
    root.appendChild(chart);
    root.appendChild(table);
    controls.appendChild(segmented("Characteristic", [{ value: "role", label: "Role" }, { value: "gender", label: "Gender" }, { value: "race", label: "Race or ethnicity" }], state.view, function (v) { state.view = v; draw(); }));
    controls.appendChild(segmented("Pilot", [{ value: "all", label: "Both (21)" }, { value: "1", label: "Pilot 1 (5)" }, { value: "2", label: "Pilot 2 (16)" }], state.pilot, function (v) { state.pilot = v; draw(); }));

    var CLS = ["cf-dot-a", "cf-dot-b", "cf-dot-c", "cf-dot-d"];

    function countsFor(v) {
      if (state.pilot === "all") return v.counts[1].map(function (c, i) { return c + v.counts[2][i]; });
      return v.counts[state.pilot];
    }

    function draw() {
      var v = VIEWS[state.view], c = countsFor(v);
      var n = c.reduce(function (a, b) { return a + b; }, 0);
      var W = chartWidth(chart), cols = 21, gap = 4;
      var size = Math.min(26, Math.floor((W - (cols - 1) * gap) / cols));
      var H = size + 8;
      chart.innerHTML = "";
      var s = svg("svg", { class: "cf-svg", viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": v.label + ": " + v.groups.map(function (g, i) { return g + " " + c[i]; }).join(", ") });
      var k = 0;
      c.forEach(function (count, gi) {
        for (var j = 0; j < count; j++) {
          var cx = k * (size + gap) + size / 2;
          s.appendChild(svg("circle", { class: CLS[gi], cx: cx, cy: H / 2, r: size / 2 - 1 }));
          k++;
        }
      });
      chart.appendChild(s);
      var legend = el("div", { class: "c-legend" });
      v.groups.forEach(function (g, i) {
        if (!c[i]) return;
        legend.appendChild(el("span", { class: "lg " + CLS[i] + "-lg", text: g + ": " + c[i] }));
      });
      chart.appendChild(legend);
      chart.appendChild(note("Each view counts teachers on its own, so a dot is not the same teacher in every view; the paper does not cross role with gender or race.", ""));

      table.innerHTML = "";
      var key = state.pilot;
      var t = el("table", { class: "results-table cf-table" });
      t.appendChild(el("caption", { class: "w-note", text: "Printed shares beside the whole counts that produce them (n = " + n + ")." }));
      t.appendChild(el("thead", {}, [el("tr", {}, [el("th", { text: "Group" }), el("th", { text: "Count" }), el("th", { text: "Count gives" }), el("th", { text: "Paper prints" })])]));
      var tb = el("tbody");
      v.groups.forEach(function (g, i) {
        var printed = v.printed ? v.printed[key][i] : null;
        if (!c[i] && printed == null) return;
        var gives = pct(c[i], n);
        var match = printed == null ? "" : (printed === gives ? "" : " cf-flag");
        tb.appendChild(el("tr", { class: match }, [
          el("td", { text: g }), el("td", { text: String(c[i]) }), el("td", { text: gives + "%" }),
          el("td", { text: printed == null ? (v.printed ? "not listed" : "count printed") : printed + "%" })
        ]));
      });
      t.appendChild(tb);
      table.appendChild(t);
      table.setAttribute("data-levels", "ug grad res");
    }
    draw();
    redraws.push(draw);
  }

  /* -------------------------------------- demo 4: hours and scores */

  function mountHours(root) {
    var state = { gap: 6, extra: 2, within: 0, seed: 356 };

    var printed = el("div", { class: "cf-rows" });
    P.correlations.forEach(function (c) {
      printed.appendChild(el("div", { class: "cf-row" }, [el("span", { class: "cf-k", text: c.label }), el("span", { class: "cf-v", text: c.printed + " (" + c.words + ")" })]));
    });
    root.appendChild(el("p", { class: "w-mono", text: "Printed in the paper" }));
    root.appendChild(printed);

    root.appendChild(el("p", { class: "w-mono", text: "Simulated class of 21 (11 computer science teachers, 10 others)" }));
    var controls = el("div");
    controls.appendChild(range("CS head start", 0, 25, 1, state.gap, function (v) { return v + " pts"; }, function (v) { state.gap = v; draw(); }));
    controls.appendChild(range("Extra hours", 0, 8, 0.5, state.extra, function (v) { return v + " h"; }, function (v) { state.extra = v; draw(); }));
    var within = range("Points per hour", -2, 2, 0.25, state.within, function (v) { return (v > 0 ? "+" : "") + v; }, function (v) { state.within = v; draw(); });
    within.setAttribute("data-levels", "ug grad res");
    controls.appendChild(within);
    root.appendChild(controls);
    root.appendChild(el("div", { class: "w-actions" }, [
      el("button", { type: "button", class: "w-btn w-btn-quiet", text: "New class", onclick: function () { state.seed = (state.seed * 1103515245 + 12345) >>> 0; draw(); } }),
      el("button", { type: "button", class: "w-btn w-btn-quiet", text: "No head start", onclick: function () { state.gap = 0; state.extra = 0; syncRanges(); draw(); } }),
      el("button", { type: "button", class: "w-btn w-btn-quiet", text: "Reset", onclick: function () { state.gap = 6; state.extra = 2; state.within = 0; state.seed = 356; syncRanges(); draw(); } })
    ]));
    var chart = el("div", { class: "cf-chart" });
    var read = el("div", { class: "cf-rows" });
    root.appendChild(chart);
    root.appendChild(read);

    function syncRanges() {
      var ins = controls.querySelectorAll("input");
      var vals = [state.gap, state.extra, state.within];
      for (var i = 0; i < ins.length; i++) { ins[i].value = vals[i]; ins[i].dispatchEvent(new Event("input")); }
    }

    function draw() {
      var sim = E.simulate({ gap: state.gap, extra: state.extra, within: state.within, seed: state.seed });
      var W = chartWidth(chart), H = Math.round(Math.min(330, W * 0.62)), L = 40, R = 12, T = 24, B = 34;
      var maxHrs = Math.max.apply(null, sim.people.map(function (p) { return p.hours; }));
      var minSc = Math.min.apply(null, sim.people.map(function (p) { return p.score; }));
      var maxH = Math.max(14, Math.ceil(maxHrs / 2) * 2);
      var yMin = Math.min(60, Math.floor(minSc / 10) * 10);
      var x = function (h) { return L + (W - L - R) * Math.min(h, maxH) / maxH; };
      var yS = function (v) { return T + (H - T - B) * (100 - Math.max(yMin, v)) / (100 - yMin); };
      chart.innerHTML = "";
      var s = svg("svg", { class: "cf-svg", viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": "Simulated scatter of hours against scores; pooled r " + fmtR(sim.pooled) });
      for (var v = yMin; v <= 100; v += 10) {
        s.appendChild(svg("line", { class: "c-grid", x1: L, x2: W - R, y1: yS(v), y2: yS(v) }));
        s.appendChild(svg("text", { class: "c-tick", x: L - 6, y: yS(v) + 4, "text-anchor": "end" }, String(v)));
      }
      var step = maxH > 16 ? 4 : 2;
      for (var hh = 0; hh <= maxH; hh += step) {
        s.appendChild(svg("text", { class: "c-tick", x: x(hh), y: H - B + 16, "text-anchor": "middle" }, String(hh)));
      }
      s.appendChild(svg("text", { class: "c-label", x: (L + W - R) / 2, y: H - 4, "text-anchor": "middle" }, "hours in the modules (simulated)"));
      s.appendChild(svg("text", { class: "c-label", x: 2, y: 11 }, "score (simulated)"));
      function fitLine(list, cls) {
        var xs = list.map(function (p) { return p.hours; }), ys = list.map(function (p) { return p.score; });
        var b = E.slope(xs, ys), mx = xs.reduce(function (a, c) { return a + c; }, 0) / xs.length, my = ys.reduce(function (a, c) { return a + c; }, 0) / ys.length;
        var x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs);
        s.appendChild(svg("line", { class: cls, x1: x(x0), x2: x(x1), y1: yS(my + b * (x0 - mx)), y2: yS(my + b * (x1 - mx)) }));
      }
      fitLine(sim.people, "cf-fit");
      sim.people.forEach(function (p) {
        s.appendChild(svg(p.group === "cs" ? "circle" : "rect", p.group === "cs"
          ? { class: "cf-dot-a", cx: x(p.hours), cy: yS(p.score), r: 5 }
          : { class: "cf-dot-b", x: x(p.hours) - 4.5, y: yS(p.score) - 4.5, width: 9, height: 9 }));
      });
      chart.appendChild(s);
      var legend = el("div", { class: "c-legend" }, [
        el("span", { class: "lg cf-dot-a-lg", text: "Computer science teachers (11)" }),
        el("span", { class: "lg cf-dot-b-lg cf-sq", text: "Other teachers (10)" }),
        el("span", { class: "lg cf-fit-lg", text: "Trend for everyone" })
      ]);
      chart.appendChild(legend);

      read.innerHTML = "";
      function row(k, v, levels) {
        var r = el("div", { class: "cf-row" }, [el("span", { class: "cf-k", text: k }), el("span", { class: "cf-v", text: v })]);
        if (levels) r.setAttribute("data-levels", levels);
        read.appendChild(r);
      }
      row("Everyone together", "r = " + fmtR(sim.pooled));
      row("Inside each group", "CS r = " + fmtR(sim.cs) + " · others r = " + fmtR(sim.non), "ug grad res");
      row("Two-sided p, pooled (n = 21)", fmtP(sim.pooledP), "grad res");
    }
    draw();
    redraws.push(draw);

    /* graduate and researcher: the page's own significance check */
    var sig = el("div", { "data-levels": "grad res" });
    sig.appendChild(el("p", { class: "w-mono", text: "Computed by this page: what p < 0.05 needs" }));
    var sigChart = el("div", { class: "cf-chart" });
    sig.appendChild(sigChart);
    var sigRows = el("div", { class: "cf-rows" });
    P.correlations.forEach(function (c) {
      sigRows.appendChild(el("div", { class: "cf-row" }, [
        el("span", { class: "cf-k", text: "r = " + fmtR(c.r) }),
        el("span", { class: "cf-v", text: "p = " + fmtP(E.pFromR(c.r, 21)) + " at n = 21 · p < 0.05 needs n ≥ " + E.nForP(c.r) })
      ]));
    });
    sigRows.appendChild(el("div", { class: "cf-row" }, [el("span", { class: "cf-k", text: "n = 21" }), el("span", { class: "cf-v", text: "p < 0.05 needs |r| ≥ " + E.criticalR(21).toFixed(3) })]));
    sig.appendChild(sigRows);
    root.appendChild(sig);

    var nullBox = el("div", { "data-levels": "grad res" });
    nullBox.appendChild(el("p", { class: "w-mono", text: "Computed by this page: chance alone, 2,000 simulated classes of 21 with no relationship" }));
    var nullChart = el("div", { class: "cf-chart" });
    var nullRead = el("div", { class: "cf-rows" });
    nullBox.appendChild(nullChart);
    nullBox.appendChild(nullRead);
    root.appendChild(nullBox);
    var nullRs = null;

    function drawSig() {
      var W = chartWidth(sigChart), H = 220, L = 52, R = 14, T = 10, B = 36;
      var nMax = 220, x = function (n) { return L + (W - L - R) * (n - 3) / (nMax - 3); };
      var ly = function (p) { var lp = Math.log10(Math.max(p, 1e-4)); return T + (H - T - B) * (-lp) / 4; };
      sigChart.innerHTML = "";
      var s = svg("svg", { class: "cf-svg", viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": "Two-sided p against sample size for r = -0.14 and r = -0.23" });
      [1, 0.1, 0.01, 0.001, 0.0001].forEach(function (p) {
        s.appendChild(svg("line", { class: "c-grid", x1: L, x2: W - R, y1: ly(p), y2: ly(p) }));
        s.appendChild(svg("text", { class: "c-tick", x: L - 6, y: ly(p) + 4, "text-anchor": "end" }, String(p)));
      });
      s.appendChild(svg("line", { class: "cf-alpha", x1: L, x2: W - R, y1: ly(0.05), y2: ly(0.05) }));
      s.appendChild(svg("text", { class: "c-label", x: W - R, y: ly(0.05) - 4, "text-anchor": "end" }, "p = 0.05"));
      [3, 50, 100, 150, 200].forEach(function (n) { s.appendChild(svg("text", { class: "c-tick", x: x(n), y: H - B + 16, "text-anchor": "middle" }, String(n))); });
      s.appendChild(svg("text", { class: "c-label", x: (L + W - R) / 2, y: H - 4, "text-anchor": "middle" }, "number of teachers (n)"));
      s.appendChild(svg("line", { class: "cf-mark", x1: x(21), x2: x(21), y1: T, y2: H - B }));
      s.appendChild(svg("text", { class: "c-label", x: x(21) + 4, y: T + 10 }, "n = 21"));
      P.correlations.forEach(function (c, i) {
        var d = "";
        for (var n = 3; n <= nMax; n++) d += (n === 3 ? "M" : "L") + x(n).toFixed(1) + "," + ly(E.pFromR(c.r, n)).toFixed(1);
        s.appendChild(svg("path", { class: i ? "cf-curve-b" : "cf-curve-a", d: d }));
      });
      sigChart.appendChild(s);
      sigChart.appendChild(el("div", { class: "c-legend" }, [
        el("span", { class: "lg cf-curve-a-lg", text: "r = −0.14 (assessments)" }),
        el("span", { class: "lg cf-curve-b-lg", text: "r = −0.23 (lesson plans)" })
      ]));
    }

    function drawNull() {
      if (!nullRs) {
        nullRs = [];
        var r = E.rng(2021);
        for (var k = 0; k < 2000; k++) {
          var xs = [], ys = [];
          for (var i = 0; i < 21; i++) { xs.push(r()); ys.push(r() + r() + r()); }
          nullRs.push(E.pearson(xs, ys));
        }
      }
      var W = chartWidth(nullChart), H = 170, L = 36, R = 12, T = 8, B = 32, bins = 40;
      var hist = new Array(bins).fill(0);
      nullRs.forEach(function (v) { hist[Math.min(bins - 1, Math.floor((v + 1) / 2 * bins))]++; });
      var maxC = Math.max.apply(null, hist);
      var x = function (v) { return L + (W - L - R) * (v + 1) / 2; };
      nullChart.innerHTML = "";
      var s = svg("svg", { class: "cf-svg", viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": "Histogram of correlations from 2,000 simulated classes with no relationship" });
      hist.forEach(function (c, i) {
        var lo = -1 + 2 * i / bins, hi = lo + 2 / bins, h = (H - T - B) * c / maxC;
        s.appendChild(svg("rect", { class: Math.abs((lo + hi) / 2) >= 0.14 ? "cf-bar-on" : "cf-bar", x: x(lo) + 0.5, y: H - B - h, width: Math.max(1, x(hi) - x(lo) - 1), height: h }));
      });
      [-1, -0.5, 0, 0.5, 1].forEach(function (v) { s.appendChild(svg("text", { class: "c-tick", x: x(v), y: H - B + 15, "text-anchor": "middle" }, (v < 0 ? "−" : "") + Math.abs(v))); });
      [-0.23, -0.14, 0.14, 0.23].forEach(function (v) { s.appendChild(svg("line", { class: "cf-mark", x1: x(v), x2: x(v), y1: T, y2: H - B })); });
      s.appendChild(svg("text", { class: "c-label", x: (L + W - R) / 2, y: H - 3, "text-anchor": "middle" }, "correlation r in a class of 21 with no relationship"));
      nullChart.appendChild(s);
      var f14 = nullRs.filter(function (v) { return Math.abs(v) >= 0.14; }).length / nullRs.length;
      var f23 = nullRs.filter(function (v) { return Math.abs(v) >= 0.23; }).length / nullRs.length;
      nullRead.innerHTML = "";
      nullRead.appendChild(el("div", { class: "cf-row" }, [el("span", { class: "cf-k", text: "|r| ≥ 0.14" }), el("span", { class: "cf-v", text: (100 * f14).toFixed(1) + "% of 2,000 simulated classes · exact p = " + E.pFromR(0.14, 21).toFixed(3) })]));
      nullRead.appendChild(el("div", { class: "cf-row" }, [el("span", { class: "cf-k", text: "|r| ≥ 0.23" }), el("span", { class: "cf-v", text: (100 * f23).toFixed(1) + "% of 2,000 simulated classes · exact p = " + E.pFromR(0.23, 21).toFixed(3) })]));
    }

    function drawGrad() { if (sig.offsetParent !== null) { drawSig(); drawNull(); } }
    drawGrad();
    redraws.push(drawGrad);
  }

  /* -------------------------------------------------------------- mount */

  function mount(id, fn) {
    var node = document.getElementById(id);
    if (!node) return;
    fn(node);
    node.classList.add("w-ready");
  }

  function start() {
    mount("cf-cia", mountCIA);
    mount("cf-pilots", mountPilots);
    mount("cf-people", mountPeople);
    mount("cf-hours", mountHours);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();

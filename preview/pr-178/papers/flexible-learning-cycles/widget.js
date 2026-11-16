/*
  Flexible learning cycles widget for /papers/flexible-learning-cycles/.
  Mount points in the page: #flc-calendar, #flc-quest, #flc-pass, #flc-survey.

  Demo 1 draws Table 1: sixteen weeks in five three-week sprints, with every
  week a chosen quest can be attempted.
  Demo 2 runs Lab 3 (Collatz Numbers) from the course's public lab repository
  as a stand-in for a quest's programming segment: fill five blanks, run the
  lab's autograder, and keep the best attempt. The number of attempts follows
  the quest chosen in demo 1.
  Demo 3 draws Table 2; undergraduate and up can recompute it from the
  text's counts, and graduate and researcher add Wilson intervals and a search
  for the counts behind the printed table (both the page's own).
  Demo 4 draws the survey's response rates and themes.
  Demos 1 and 2 share state.quest. All arithmetic lives in flc-engine.js.
*/
(function () {
  "use strict";

  var E = window.FlexibleCyclesEngine;
  var SVGNS = "http://www.w3.org/2000/svg";
  var state = { quest: "A", week: null, view: "printed", rule: "either", level: "public" };

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
  var WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
  function words(n) { return n >= 0 && n < 10 ? WORDS[n] : String(n); }
  function list(xs) {
    if (xs.length === 1) return String(xs[0]);
    if (xs.length === 2) return xs[0] + " and " + xs[1];
    return xs.slice(0, -1).join(", ") + ", and " + xs[xs.length - 1];
  }
  function pct(x, d) { return Number(x).toFixed(d === undefined ? 2 : d); }
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function questName(q) { return q === "Final" ? "the final quest" : "Quest " + q; }
  function isAdvanced() { return state.level === "grad" || state.level === "res"; }
  function isUgUp() { return state.level === "ug" || isAdvanced(); }

  var redraws = [];
  var resizeTimer = null;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () { redraws.forEach(function (fn) { fn(); }); }, 150);
  });
  function readLevel() {
    var holder = document.querySelector("article[data-level], [data-level]");
    var lv = holder ? holder.getAttribute("data-level") : null;
    if (!lv) { var m = /[?&]level=(\w+)/.exec(location.search); lv = m ? m[1] : null; }
    return lv || "public";
  }
  document.addEventListener("paperlevel", function (e) {
    state.level = (e.detail && e.detail.level) || readLevel();
    if (state.view === "rebuilt" && !isAdvanced()) setView("printed");
    if (state.view === "text" && !isUgUp()) setView("printed");
    setTimeout(function () { redraws.forEach(function (fn) { fn(); }); }, 0);
  });

  function segmented(label, options, value, onChange) {
    var wrap = el("div", { class: "seg", role: "radiogroup", "aria-label": label });
    var buttons = options.map(function (opt) {
      var b = el("button", { type: "button", class: "seg-option", role: "radio", "data-value": String(opt.value), text: opt.label });
      if (opt.title) b.setAttribute("title", opt.title);
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

  // Shared quest picker: every copy stays in sync.
  var questControls = [], questListeners = [];
  function setQuest(q) {
    state.quest = q;
    questControls.forEach(function (c) { c.set(q); });
    questListeners.forEach(function (fn) { fn(); });
  }
  function questControl() {
    var c = segmented("Quest", E.QUESTS.map(function (q) {
      return { value: q, label: q === "Final" ? "Final" : "Quest " + q };
    }), state.quest, setQuest);
    questControls.push(c);
    return c;
  }

  /* --------------------------------------------- demo 1: sixteen weeks */

  var CYCLE = { C: "Content", R: "Reinforcement", Q: "Quest" };
  var ROLE = { C: "I do", R: "We do", Q: "You do" };

  function sprintOf(w) { return w === 16 ? 6 : Math.ceil(w / 3); }
  function sprintTopic(s) { return s === 6 ? "Final" : E.WEEKS[(s - 1) * 3].concept; }

  function mountCalendar(root) {
    var head = el("div", { class: "w-actions" }, [el("span", { class: "w-mono", text: "Follow a quest:" }), questControl()]);
    var readout = el("p", { class: "w-big" });
    var chart = el("div", { class: "flc-chart" });
    var legend = el("div", { class: "c-legend", html:
      "<span class=\"flc-lg\"><span class=\"flc-sw flc-c\"></span>Content week</span>" +
      "<span class=\"flc-lg\"><span class=\"flc-sw flc-r\"></span>Reinforcement week</span>" +
      "<span class=\"flc-lg\"><span class=\"flc-sw flc-q\"></span>Quest week</span>" +
      "<span class=\"flc-lg\"><span class=\"flc-dot-sw\"></span>Chance to take the chosen quest</span>" });
    var detail = el("p", { class: "w-note flc-detail", "aria-live": "polite" });
    var lag = el("p", { class: "w-note", "data-levels": "ug grad res" });
    var src = el("p", { class: "w-source", text: "Source: the paper's Table 1 (16-week schedule). Labs: github.com/cxedhub/cosc-1010-intro-labs." });
    [head, readout, chart, legend, detail, lag, src].forEach(function (n) { root.appendChild(n); });

    function draw() {
      var weeks = E.questWeeks(state.quest), n = weeks.length;
      readout.innerHTML = "<strong>" + (n === 1 ? "One chance" : words(n).charAt(0).toUpperCase() + words(n).slice(1) + " chances") +
        "</strong> at " + questName(state.quest) + ": week" + (n > 1 ? "s " : " ") + list(weeks) + "." +
        (n > 1 ? " Only the best attempt counts." : " It comes last, so it has no retake.");

      var W = chartWidth(chart), narrow = W < 520;
      var left = narrow ? 4 : 6, right = 4, colW = (W - left - right) / 16;
      var y0 = 18, bandH = 22, yCycle = y0 + bandH + 6, cellH = 30, yRole = yCycle + cellH + 14, yDots = yRole + 16, H = yDots + 26;
      var s = svg("svg", { class: "flc-svg", viewBox: "0 0 " + W + " " + H, role: "img",
        "aria-label": "Sixteen weeks in five three-week sprints plus a final week; " + questName(state.quest) + " can be taken in weeks " + list(weeks) + "." });

      // sprint bands
      for (var sp = 1; sp <= 6; sp++) {
        var a = sp === 6 ? 15 : (sp - 1) * 3, b = sp === 6 ? 16 : sp * 3;
        var x = left + a * colW, w = (b - a) * colW;
        s.appendChild(svg("rect", { x: x + 1, y: y0, width: w - 2, height: bandH, class: sp % 2 ? "flc-band-a" : "flc-band-b" }));
        var label = sp === 6 ? (narrow ? "F" : "Final") : (narrow ? "S" + sp : "Sprint " + sp);
        s.appendChild(svg("text", { x: x + w / 2, y: y0 + 15, class: "c-label", "text-anchor": "middle" }, label));
      }

      E.WEEKS.forEach(function (wk) {
        var x = left + (wk.w - 1) * colW;
        var g = svg("g", { class: "flc-week" + (state.week === wk.w ? " is-on" : ""), role: "button", tabindex: "0",
          "aria-label": "Week " + wk.w + ", " + CYCLE[wk.cycle] + (wk.lab ? ", lab " + wk.lab : "") + (wk.quests.length ? ", quests " + wk.quests.join(" ") : "") });
        g.appendChild(svg("rect", { x: x + 2, y: yCycle, width: colW - 4, height: cellH, class: "flc-cell flc-" + wk.cycle.toLowerCase() }));
        g.appendChild(svg("text", { x: x + colW / 2, y: yCycle + 19, class: "flc-cell-t flc-t-" + wk.cycle.toLowerCase(), "text-anchor": "middle" }, wk.cycle));
        g.appendChild(svg("text", { x: x + colW / 2, y: 11, class: "c-tick", "text-anchor": "middle" }, String(wk.w)));
        var role = svg("text", { x: x + colW / 2, y: yRole, class: "c-tick", "text-anchor": "middle", "data-levels": "ug grad res" }, narrow ? "" : ROLE[wk.cycle]);
        if (!narrow && colW > 34) g.appendChild(role);
        var on = wk.quests.indexOf(state.quest) >= 0;
        if (on) {
          g.appendChild(svg("circle", { cx: x + colW / 2, cy: yDots, r: 6, class: "flc-dot" }));
          var idx = E.questWeeks(state.quest).indexOf(wk.w) + 1;
          g.appendChild(svg("text", { x: x + colW / 2, y: yDots + 20, class: "c-tick", "text-anchor": "middle" }, idx === 1 ? "first" : "#" + idx));
        }
        g.appendChild(svg("rect", { x: x, y: yCycle - 4, width: colW, height: H - yCycle + 4, class: "flc-hit" }));
        function pick() { state.week = state.week === wk.w ? null : wk.w; draw(); }
        g.addEventListener("click", pick);
        g.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(); } });
        s.appendChild(g);
      });
      chart.innerHTML = "";
      chart.appendChild(s);

      if (state.week) {
        var wk = E.WEEKS[state.week - 1];
        var parts = ["<strong>Week " + wk.w + "</strong> · " + CYCLE[wk.cycle] + " week (" + ROLE[wk.cycle].toLowerCase() + ")",
          "Sprint " + (sprintOf(wk.w) === 6 ? "5, final week" : sprintOf(wk.w) + ": " + sprintTopic(sprintOf(wk.w)))];
        if (wk.lab) parts.push("Lab " + esc(wk.lab));
        else parts.push("Open lab week");
        if (wk.quests.length) parts.push((wk.retake ? "Retakes: " : "") + wk.quests.map(function (q) { return q === "Final" ? "final quest" : "Quest " + q; }).join(", "));
        detail.innerHTML = parts.join(" · ");
      } else {
        detail.textContent = "Select a week for its lab and quests. Week 14 offers no quest, and week 16 holds the final quest.";
      }
      lag.textContent = "Feedback lag: a topic introduced in a content week is assessed two weeks later, and the class hears what went wrong before the next content week, so a misconception is addressed within three weeks of the topic's first lecture.";
    }
    questListeners.push(draw);
    redraws.push(draw);
    draw();
  }

  /* --------------------------------------------- demo 2: a quest to retake */

  function mountQuest(root) {
    var head = el("div", { class: "w-actions" }, [el("span", { class: "w-mono", text: "Attempts follow:" }), questControl()]);
    var intro = el("p", { class: "w-note", text: "Lab 3 counts the steps a number takes to reach 1 under the Collatz rules (halve it if even; triple it and add one if odd). Pick a line for each blank, then run the lab's autograder." });
    var code = el("pre", { class: "flc-code", "aria-label": "Lab 3 main.py with six blanks" });
    var actions = el("div", { class: "w-actions" });
    var run = el("button", { type: "button", class: "flc-btn", text: "Run the autograder" });
    var reset = el("button", { type: "button", class: "flc-btn flc-btn-quiet", text: "Start over" });
    var fill = el("button", { type: "button", class: "flc-btn flc-btn-quiet", text: "Show the lab's intended answer", "data-levels": "ug grad res" });
    actions.appendChild(run); actions.appendChild(reset); actions.appendChild(fill);
    var readout = el("p", { class: "w-big", "aria-live": "polite" });
    var tests = el("div", { class: "flc-scroll" });
    var trace = el("p", { class: "w-mono flc-trace" });
    var log = el("ol", { class: "flc-log" });
    var note = el("p", { class: "w-note" });
    var src = el("p", { class: "w-source", text: "Lab 3 (Collatz Numbers) and its five test pairs: github.com/cxedhub/cosc-1010-intro-labs, 03/README.md and 03/main.py (code GPLv3). The paper's quests are not public; this lab stands in for a quest's programming segment." });
    [head, intro, code, actions, readout, tests, trace, log, note, src].forEach(function (n) { root.appendChild(n); });

    var choice = { inc: null, even: null, odd: null, out: null, evenFn: null, header: null };
    var attempts = [];
    var selects = {};

    function sel(id) {
      var td = E.TODOS.filter(function (t) { return t.id === id; })[0];
      var s = el("select", { class: "flc-select", "aria-label": "Blank: " + id });
      s.appendChild(el("option", { value: "", text: "???" }));
      td.options.forEach(function (o, i) { s.appendChild(el("option", { value: String(i), text: o })); });
      s.addEventListener("change", function () { choice[id] = s.value === "" ? null : Number(s.value); paint(); });
      selects[id] = s;
      return s;
    }
    function line(parts) {
      var span = el("span", { class: "flc-line" });
      parts.forEach(function (p) { span.appendChild(typeof p === "string" ? document.createTextNode(p) : p); });
      span.appendChild(document.createTextNode("\n"));
      code.appendChild(span);
    }
    line(["def is_even(n):"]);
    line(["    return n % 2 == 0"]);
    line([""]);
    line(["def main():"]);
    line(["    n = int(input())"]);
    line(["    iterations = 0"]);
    line(["    while n != 1:"]);
    line(["        iterations = ", sel("inc")]);
    line(["        if is_even(n):"]);
    line(["            n = ", sel("even")]);
    line(["        else:"]);
    line(["            n = ", sel("odd")]);
    line(["    ", sel("out")]);
    line([""]);
    line(["def even_collatz(n):"]);
    line(["    return ", sel("evenFn")]);
    line([""]);
    line([sel("header")]);
    line(["    return n * 3 + 1"]);
    line([""]);
    line(["main()"]);

    function allSet() { return Object.keys(choice).every(function (k) { return choice[k] !== null; }); }
    function limit() { return E.questWeeks(state.quest).length; }
    function best() { return attempts.reduce(function (m, a) { return Math.max(m, a.score); }, -1); }

    function showGrade(g) {
      var h = "<table class=\"flc-table\"><thead><tr><th>Input</th><th>Expected</th><th>Your output</th><th>Result</th></tr></thead><tbody>";
      g.results.forEach(function (r) {
        var got = r.status === "ok" ? (r.stdout === "" ? "(nothing printed)" : esc(r.stdout))
          : r.status === "error" ? esc(r.error) + ": " + esc(r.message)
          : "still running after " + E.STEP_LIMIT.toLocaleString("en-US") + " loop passes";
        h += "<tr class=\"" + (r.pass ? "flc-pass" : "flc-fail") + "\"><td>" + r.input + "</td><td>" + r.expected + "</td><td>" + got + "</td><td>" + (r.pass ? "pass" : "fail") + "</td></tr>";
      });
      tests.innerHTML = h + "</tbody></table>";
      var r6 = g.results[0];
      var seq = r6.trace.slice(0, 24).map(function (x) { return isFinite(x) ? String(x) : "inf"; });
      trace.textContent = "Your program on 6: " + seq.join(" → ") + (r6.trace.length > 24 || r6.status === "loop" ? " → …" : "") +
        (r6.status === "error" ? "  (stopped: " + r6.error + ")" : "");
      var notes = [];
      if (choice.evenFn === 1 && g.results.some(function (r) { return r.floatN; }))
        notes.push("n / 2 is division that returns a float in Python (6 / 2 is 3.0), and the loop still ends because 1.0 equals 1. The step count prints correctly, so the autograder cannot tell; the lab intends n // 2, which keeps n a whole number.");
      if (choice.header === 2) notes.push("Defining even_collatz a second time replaces the first definition, so odd_collatz never exists.");
      if (choice.header === 1) notes.push("The header has no parameter, so calling odd_collatz(n) passes one argument too many.");
      note.textContent = notes.join(" ");
    }

    function paint() {
      var used = attempts.length, lim = limit();
      run.disabled = !allSet() || used >= lim;
      if (!allSet()) {
        readout.innerHTML = "Fill all six blanks to run the autograder. " + questName(state.quest).charAt(0).toUpperCase() + questName(state.quest).slice(1) +
          " allows <strong>" + words(lim) + " attempt" + (lim > 1 ? "s" : "") + "</strong>" + (used ? "; " + words(used) + " used." : ".");
      } else if (used >= lim) {
        readout.innerHTML = "No attempts left at " + questName(state.quest) + ". <strong>Counted score: " + best() + " of 5</strong>, the best of " + words(used) + ".";
      } else if (used) {
        readout.innerHTML = "<strong>Best so far: " + best() + " of 5.</strong> " + words(lim - used).charAt(0).toUpperCase() + words(lim - used).slice(1) + " attempt" + (lim - used > 1 ? "s" : "") + " left; only the best counts.";
      } else {
        readout.innerHTML = "Ready. " + words(lim).charAt(0).toUpperCase() + words(lim).slice(1) + " attempt" + (lim > 1 ? "s" : "") + " at " + questName(state.quest) + (lim > 1 ? ", and only the best counts." : ", with no retake.");
      }
      log.innerHTML = "";
      var b = best(), weeks = E.questWeeks(state.quest);
      attempts.forEach(function (a, i) {
        log.appendChild(el("li", { class: a.score === b && attempts.indexOf(a) === firstBest() ? "is-best" : "",
          html: "Attempt " + (i + 1) + (weeks[i] ? " (week " + weeks[i] + ")" : "") + ": <strong>" + a.score + " of 5</strong>" + (a.score === b && i === firstBest() ? " · counted" : "") }));
      });
    }
    function firstBest() { var b = best(); for (var i = 0; i < attempts.length; i++) if (attempts[i].score === b) return i; return -1; }

    run.addEventListener("click", function () {
      if (!allSet() || attempts.length >= limit()) return;
      var g = E.grade(choice);
      attempts.push({ score: g.score });
      showGrade(g);
      paint();
    });
    reset.addEventListener("click", function () {
      attempts = []; tests.innerHTML = ""; trace.textContent = ""; note.textContent = "";
      Object.keys(choice).forEach(function (k) { choice[k] = null; selects[k].value = ""; });
      paint();
    });
    fill.addEventListener("click", function () {
      Object.keys(choice).forEach(function (k) { choice[k] = 0; selects[k].value = "0"; });
      paint();
    });
    questListeners.push(function () { attempts = []; tests.innerHTML = ""; trace.textContent = ""; note.textContent = ""; paint(); });
    paint();
  }

  /* --------------------------------------------------- demo 3: who passed */

  var GROUPS = [
    { id: "major", label: "Majors" },
    { id: "nonmajor", label: "Non-majors" },
    { id: "total", label: "All students" }
  ];
  var viewControls = [], viewListeners = [];
  function setView(v) {
    state.view = v;
    viewControls.forEach(function (c) { c.set(v); });
    viewListeners.forEach(function (fn) { fn(); });
  }
  var REBUILT = { f22: { major: [53, 54], nonmajor: [64, 70] }, s23: { major: [16, 18], nonmajor: [66, 73] } };

  function mountPass(root) {
    var c = segmented("Values", [
      { value: "printed", label: "As printed", title: "Table 2 as printed" },
      { value: "text", label: "From the text's counts", title: "Recomputed from the counts in the Quantitative Analysis text", levels: "ug grad res" },
      { value: "rebuilt", label: "Rebuilt (page)", title: "The page's reconstruction: Fall 2022 non-majors 64 of 70", levels: "grad res" }
    ], state.view, setView);
    viewControls.push(c);
    var head = el("div", { class: "w-actions" }, [el("span", { class: "w-mono", text: "Show:" }), c]);
    var readout = el("p", { class: "w-big" });
    var chart = el("div", { class: "flc-chart" });
    var legend = el("div", { class: "c-legend" });
    var table = el("div", { class: "flc-scroll", "data-levels": "ug grad res" });
    var search = el("div", { class: "flc-search", "data-levels": "grad res" });
    var src = el("p", { class: "w-source" });
    [head, readout, chart, legend, table, search, src].forEach(function (n) { root.appendChild(n); });

    function cellsFor(view) {
      var out = {};
      if (view === "printed") {
        E.TABLE2.rows.forEach(function (r) { out[r.id] = {}; GROUPS.forEach(function (g) { out[r.id][g.id] = { v: r[g.id] }; }); });
        return out;
      }
      var counts = view === "rebuilt" ? REBUILT : E.COUNTS;
      E.TABLE2.rows.forEach(function (r) {
        out[r.id] = {};
        GROUPS.forEach(function (g) {
          var kn = E.countsFor(r.id, g.id, counts);
          out[r.id][g.id] = { v: 100 * kn[0] / kn[1], k: kn[0], n: kn[1], ci: E.wilson(kn[0], kn[1]) };
        });
      });
      return out;
    }

    function draw() {
      var cells = cellsFor(state.view), adv = isAdvanced();
      var printed = cellsFor("printed");
      if (state.view === "printed") {
        readout.innerHTML = "<strong>92.56 percent</strong> of students passed (A, B, or C) across the two semesters, as Table 2 prints it.";
      } else if (state.view === "text") {
        readout.innerHTML = "The text's counts give <strong>" + pct(cells.ay.total.v) + " percent</strong> (" + cells.ay.total.k + " of " + cells.ay.total.n + ") for both semesters, against the printed 92.56; five of the nine cells match the table.";
      } else {
        readout.innerHTML = "With Fall 2022 non-majors read as <strong>64 of 70</strong>, every printed cell is reproduced (" + cells.ay.total.k + " of " + cells.ay.total.n + " = " + pct(cells.ay.total.v) + " percent overall). The page's reconstruction, not the paper's.";
      }

      var W = chartWidth(chart), narrow = W < 520;
      var labelW = narrow ? 92 : 150, right = 18, x0 = labelW, x1 = W - right;
      var lo = 50, hi = 100;
      function X(v) { return x0 + (x1 - x0) * (v - lo) / (hi - lo); }
      var rowH = 20, gap = 16, top = 26, H = top + 3 * (3 * rowH + gap) + 24;
      var s = svg("svg", { class: "flc-svg", viewBox: "0 0 " + W + " " + H, role: "img",
        "aria-label": "Pass rates by semester and group, " + (state.view === "printed" ? "as printed in Table 2" : state.view === "text" ? "recomputed from the text's counts" : "rebuilt by the page") + "." });
      // literature band (graduate and researcher)
      var lit = svg("g", { "data-levels": "grad res" });
      lit.appendChild(svg("rect", { x: X(E.LITERATURE.cs1Low), y: top - 6, width: X(E.LITERATURE.cs1High) - X(E.LITERATURE.cs1Low), height: H - top - 18, class: "flc-litband" }));
      lit.appendChild(svg("line", { x1: X(E.LITERATURE.media), x2: X(E.LITERATURE.media), y1: top - 6, y2: H - 24, class: "flc-litline" }));
      lit.appendChild(svg("text", { x: X(77.5), y: top - 10, class: "c-tick", "text-anchor": "middle" }, narrow ? "upper 70s" : "typical CS1: upper 70s"));
      lit.appendChild(svg("text", { x: X(E.LITERATURE.media), y: top - 10, class: "c-tick", "text-anchor": "middle" }, narrow ? "≈90" : "media comp. ≈90"));
      if (adv) s.appendChild(lit);
      // grid
      for (var t = lo; t <= hi; t += 10) {
        s.appendChild(svg("line", { x1: X(t), x2: X(t), y1: top - 6, y2: H - 24, class: "c-grid" }));
        s.appendChild(svg("text", { x: X(t), y: H - 8, class: "c-tick", "text-anchor": "middle" }, t + "%"));
      }
      E.TABLE2.rows.forEach(function (r, ri) {
        var yb = top + ri * (3 * rowH + gap);
        s.appendChild(svg("text", { x: 0, y: yb + 4, class: "c-label flc-rowhead" }, r.id === "ay" ? (narrow ? "Both" : "Both semesters") : r.label));
        GROUPS.forEach(function (g, gi) {
          var y = yb + 14 + gi * rowH, cell = cells[r.id][g.id], v = cell.v;
          s.appendChild(svg("text", { x: narrow ? 6 : 12, y: y + 4, class: "c-tick" }, g.label));
          if (cell.ci && adv) {
            s.appendChild(svg("line", { x1: X(Math.max(lo, 100 * cell.ci[0])), x2: X(100 * cell.ci[1]), y1: y, y2: y, class: "flc-ci" }));
          }
          if (state.view !== "printed") {
            s.appendChild(svg("circle", { cx: X(printed[r.id][g.id].v), cy: y, r: 4.5, class: "flc-printed-ring" }));
          }
          var match = state.view === "printed" || E.howMatches(v / 100, printed[r.id][g.id].v) !== "none";
          s.appendChild(svg("circle", { cx: X(Math.max(lo, v)), cy: y, r: 5, class: "flc-pt flc-pt-" + g.id + (match ? "" : " flc-miss") }));
          var lab = pct(v) + (cell.k !== undefined ? (narrow ? "" : " (" + cell.k + "/" + cell.n + ")") : "");
          var tx = X(Math.max(lo, v));
          var anchor = tx > x1 - 110 ? "end" : "start";
          s.appendChild(svg("text", { x: anchor === "end" ? tx - 10 : tx + 10, y: y + 4, class: "flc-val" + (match ? "" : " flc-val-miss"), "text-anchor": anchor }, lab));
        });
      });
      chart.innerHTML = "";
      chart.appendChild(s);

      legend.innerHTML = "<span class=\"flc-lg\"><span class=\"flc-pt-sw flc-pt-major\"></span>Majors (n = 72)</span>" +
        "<span class=\"flc-lg\"><span class=\"flc-pt-sw flc-pt-nonmajor\"></span>Non-majors (n = 147)</span>" +
        "<span class=\"flc-lg\"><span class=\"flc-pt-sw flc-pt-total\"></span>All (n = 219)</span>" +
        (state.view !== "printed" ? "<span class=\"flc-lg\"><span class=\"flc-ring-sw\"></span>Printed value</span><span class=\"flc-lg\"><span class=\"flc-miss-sw\"></span>Does not match the printed value</span>" : "") +
        (adv && state.view !== "printed" ? "<span class=\"flc-lg\"><span class=\"flc-ci-sw\"></span>95% Wilson interval (page)</span>" : "") +
        (adv ? "<span class=\"flc-lg\"><span class=\"flc-band-sw\"></span>Literature range the paper cites</span>" : "");

      // table of the nine cells
      var rowsText = E.checkTable(), rowsRe = E.checkTable(REBUILT);
      var HOW = { round: "rounded", trunc: "cut", both: "either", none: "no match" };
      var h = "<table class=\"results-table flc-results\"><caption class=\"w-note\">Table 2 cell by cell: printed, from the text's counts, and (graduate and researcher) the page's rebuild.</caption><thead><tr><th>Semester</th><th>Group</th><th>Printed</th><th>Text's counts</th><th>Match</th>" +
        (adv ? "<th>Rebuilt (page)</th><th>Match</th>" : "") + "</tr></thead><tbody>";
      rowsText.forEach(function (c, i) {
        var re = rowsRe[i];
        var rowLabel = c.row === "ay" ? "Both" : c.row === "f22" ? "Fall 2022" : "Spring 2023";
        var gl = GROUPS.filter(function (g) { return g.id === c.group; })[0].label;
        h += "<tr" + (c.how === "none" ? " class=\"is-on\"" : "") + "><td>" + rowLabel + "</td><td>" + gl + "</td><td>" + pct(c.printed) + "</td><td>" + c.k + "/" + c.n + " = " + pct(c.value, 3) + "</td><td>" + HOW[c.how] + "</td>" +
          (adv ? "<td>" + re.k + "/" + re.n + " = " + pct(re.value, 3) + "</td><td>" + HOW[re.how] + "</td>" : "") + "</tr>";
      });
      h += "</tbody></table>";
      table.innerHTML = h;

      src.textContent = state.view === "printed"
        ? "Source: the paper's Table 2. Passing means A, B, or C (70 percent or higher). Axis starts at 50 percent."
        : "Counts: the paper's Quantitative Analysis text (Fall 2022: majors 53 of 54, non-majors 71 of 82; Spring 2023: majors 16 of 18, non-majors 66 of 73)" +
          (state.view === "rebuilt" ? ", with Fall 2022 non-majors replaced by the page's 64 of 70." : ".") + " Axis starts at 50 percent.";
    }

    function drawSearch() {
      var r = E.rebuildFall({ rule: state.rule, maxN: 1000 });
      var rules = segmented("Rounding rule", [
        { value: "either", label: "Rounded or cut" },
        { value: "round", label: "Rounded only" },
        { value: "trunc", label: "Cut only" }
      ], state.rule, function (v) { state.rule = v; drawSearch(); });
      search.innerHTML = "";
      search.appendChild(el("h4", { class: "flc-sub", text: "Search: which Fall 2022 non-major count fits the table? (page's analysis)" }));
      search.appendChild(el("p", { class: "w-note", text: "Hold the three count pairs that reproduce (majors 53 of 54 and 16 of 18; Spring non-majors 66 of 73) and try every Fall 2022 non-major count k of n, for n from 1 to 1,000. Keep the pairs that reproduce all four cells that depend on it: Fall non-majors 91.42, Fall total 94.35, both-semester non-majors 90.90, and both-semester total 92.56, each to two decimals." }));
      search.appendChild(el("div", { class: "w-actions" }, [el("span", { class: "w-mono", text: "Two-decimal rule:" }), rules]));
      var txt;
      if (!r.solutions.length) txt = "No count from 1 to 1,000 fits under this rule. The printed table mixes rules: 98.15 is 53/54 rounded, while 88.88 is 16/18 cut.";
      else txt = "<strong>" + (r.solutions.length === 1 ? "One count fits" : r.solutions.length + " counts fit") + ": " +
        r.solutions.map(function (s) { return s.k + " of " + s.n; }).join(", ") + ".</strong> " +
        (r.solutions.length === 1 && r.solutions[0].n === 70 ? "That gives 143 non-majors and 215 students across the year, four fewer in each than the table's headers (147 and 219), and 64 of 70 differs from the text's 71 of 82." : "");
      search.appendChild(el("p", { class: "w-big", html: txt }));
    }

    viewListeners.push(draw);
    redraws.push(draw);
    draw();
    drawSearch();
  }

  /* -------------------------------------------- demo 4: what students said */

  function mountSurvey(root) {
    var chart = el("div", { class: "flc-chart" });
    var themes = el("ol", { class: "flc-rows" });
    var src = el("p", { class: "w-source", text: "Source: the paper's Qualitative Analysis (anonymous department survey; open-response questions). The paper reports no counts per theme." });
    root.appendChild(el("p", { class: "w-big", html: "<strong>111 of 219</strong> enrolled students answered the department's anonymous end-of-course survey." }));
    root.appendChild(chart);
    root.appendChild(el("h4", { class: "flc-sub", text: "Themes the authors report" }));
    root.appendChild(themes);
    root.appendChild(src);
    [
      ["Retakes lowered the pressure of grades.", "“The only stress I felt was motivational stress because I had so many opportunities to improve my grade…”"],
      ["Reinforcement lectures helped students build a mental model of how code runs.", "Several students called the lectures easy to follow."],
      ["Students valued several instructors with different approaches.", ""],
      ["Students saw uses for the material beyond the course.", ""],
      ["Taking part in delivering content improved the experience.", ""]
    ].forEach(function (t) {
      themes.appendChild(el("li", { html: esc(t[0]) + (t[1] ? "<br><span class=\"w-mono\">" + esc(t[1]) + "</span>" : "") }));
    });

    function draw() {
      var W = chartWidth(chart), narrow = W < 520, labelW = narrow ? 92 : 120, x0 = labelW, x1 = W - 70;
      var rowH = 30, top = 8, H = top + E.SURVEY.length * rowH + 24;
      var s = svg("svg", { class: "flc-svg", viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": "Survey response: 77 of 129 in Fall 2022 and 34 of 90 in Spring 2023." });
      function X(v) { return x0 + (x1 - x0) * v; }
      E.SURVEY.forEach(function (sv, i) {
        var y = top + i * rowH;
        s.appendChild(svg("text", { x: 0, y: y + 15, class: "c-label" }, sv.label));
        s.appendChild(svg("rect", { x: X(0), y: y + 3, width: X(1) - X(0), height: 16, class: "flc-bar-bg" }));
        s.appendChild(svg("rect", { x: X(0), y: y + 3, width: X(sv.respondents / sv.enrolled) - X(0), height: 16, class: "flc-bar" }));
        s.appendChild(svg("text", { x: X(1) + 6, y: y + 15, class: "flc-val" }, sv.respondents + "/" + sv.enrolled + " · " + sv.printedPct + "%"));
      });
      [0, 0.5, 1].forEach(function (t) {
        s.appendChild(svg("text", { x: X(t), y: H - 6, class: "c-tick", "text-anchor": "middle" }, Math.round(t * 100) + "%"));
      });
      chart.innerHTML = "";
      chart.appendChild(s);
    }
    redraws.push(draw);
    draw();
  }

  /* ------------------------------------------------------------------ mount */

  function mount(id, fn) {
    var node = document.getElementById(id);
    if (!node) return;
    node.innerHTML = "";
    fn(node);
    node.classList.add("w-ready");
  }
  function init() {
    state.level = readLevel();
    mount("flc-calendar", mountCalendar);
    mount("flc-quest", mountQuest);
    mount("flc-pass", mountPass);
    mount("flc-survey", mountSurvey);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();

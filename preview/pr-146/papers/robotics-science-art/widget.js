/*
  Robotics PD widget for /papers/robotics-science-art/.
  Mount points in the page: #rb-robot, #rb-days, #rb-rank, #rb-quiz, #rb-themes.

  Demo 1 (the tool) is the page's model of the lab tasks: a grid robot programmed
  with blocks (novice, intermediate) or rules (expert). It is not the LEGO
  MindStorms software the teachers used.
  Demo 2 lays out the two weeks: eight content pairings, the daily cycle, and the
  three data sources.
  Demo 3 draws the 13 self-rankings and every pairing consistent with the
  printed counts, with the tests at each level.
  Demo 4 works through the quiz percentages the paper prints.
  Demo 5 shows the three lesson-plan themes and runs the encoding lesson.
  All arithmetic lives in rb-engine.js.
*/
(function () {
  "use strict";

  var E = window.RoboticsEngine;
  var P = E.PAPER;
  var SVGNS = "http://www.w3.org/2000/svg";

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
  function pfmt(p) {
    if (p >= 0.001) return fix(p, 4);
    var e = Math.floor(Math.log(p) / Math.LN10), m = p / Math.pow(10, e);
    if (m >= 9.95) { m = 1; e += 1; }
    return fix(m, 1) + " × 10<sup>" + String(e).replace("-", "−") + "</sup>";
  }
  function currentLevel() {
    if (window.PaperKit && window.PaperKit.level) return window.PaperKit.level();
    var a = document.querySelector("[data-level]");
    return a ? a.getAttribute("data-level") : "public";
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
  function row(label, control, levels) {
    var r = el("div", { class: "w-actions" }, [el("span", { class: "w-mono", text: label }), control]);
    if (levels) r.setAttribute("data-levels", levels);
    return r;
  }

  /* ------------------------------------------------- demo 1: the robot lab */

  var TIERS = [
    { value: "novice", label: "Novice: drive a square", title: "Move and loop" },
    { value: "intermediate", label: "Intermediate: find the tape", title: "Sense light" },
    { value: "expert", label: "Expert: solve a maze", title: "Navigate a maze and avoid walls" }
  ];
  var BLOCK_NAMES = { fwd: "Forward", left: "Turn left", right: "Turn right", back: "Turn around", untilDark: "Forward until the sensor reads dark" };
  var PALETTE = {
    novice: ["fwd", "left", "right"],
    intermediate: ["fwd", "untilDark", "left", "right", "back"]
  };
  var START_PROGRAMS = {
    novice: { blocks: [{ op: "fwd", n: 4 }, { op: "right" }], repeat: 1 },
    intermediate: { blocks: [{ op: "fwd", n: 4 }], repeat: 1 }
  };

  function mountRobot(root) {
    var state = {
      tier: "novice",
      progs: {
        novice: JSON.parse(JSON.stringify(START_PROGRAMS.novice)),
        intermediate: JSON.parse(JSON.stringify(START_PROGRAMS.intermediate))
      },
      rules: { side: "right", blocked: "left" },
      lineX: 5, mazeSeed: 1, frame: 0, result: null, timer: null
    };
    var tierPick = segmented("Lab tier", TIERS, state.tier, function (v) { state.tier = v; stop(); renderEditor(); runNow(false); });
    var editor = el("div", { class: "rb-editor" });
    var runBtn = el("button", { type: "button", class: "w-btn", text: "Run" });
    var resetBtn = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "Start over" });
    var moveBtn = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "Move the tape" });
    var mazeBtn = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "New maze" });
    var readout = el("p", { class: "w-big", "aria-live": "polite" });
    var arena = el("div", { class: "rb-arena" });
    var note = el("p", { class: "w-note" });
    var src = el("p", { class: "w-source", text: "The page's model of the lab tasks, not the LEGO MindStorms software · the paper lists the tasks, not these exact courses" });
    root.appendChild(row("Tier:", tierPick));
    root.appendChild(editor);
    root.appendChild(el("div", { class: "w-actions" }, [runBtn, resetBtn, moveBtn, mazeBtn]));
    [readout, arena, note, src].forEach(function (n) { root.appendChild(n); });

    function task() {
      if (state.tier === "novice") return E.squareTask();
      if (state.tier === "intermediate") return E.lineTask(state.lineX);
      return E.mazeTask(state.mazeSeed);
    }
    function compute() {
      var t = task();
      if (state.tier === "expert") state.result = E.runRules(t, state.rules);
      else { var p = state.progs[state.tier]; state.result = E.runProgram(t, p.blocks, p.repeat); }
      state.task = t;
    }
    function stop() { if (state.timer) { clearInterval(state.timer); state.timer = null; } runBtn.textContent = "Run"; }
    function runNow(animate) {
      stop(); compute();
      if (!animate) { state.frame = state.result.frames.length - 1; draw(); return; }
      state.frame = 0; runBtn.textContent = "Pause"; draw();
      state.timer = setInterval(function () {
        state.frame++;
        if (state.frame >= state.result.frames.length - 1) { state.frame = state.result.frames.length - 1; stop(); }
        draw();
      }, state.tier === "expert" ? 90 : 160);
    }
    runBtn.addEventListener("click", function () { if (state.timer) { stop(); draw(); } else runNow(true); });
    resetBtn.addEventListener("click", function () {
      if (state.tier === "expert") state.rules = { side: "right", blocked: "left" };
      else state.progs[state.tier] = JSON.parse(JSON.stringify(START_PROGRAMS[state.tier]));
      renderEditor(); runNow(false);
    });
    moveBtn.addEventListener("click", function () {
      var opts = [3, 4, 5, 6, 7, 8, 9].filter(function (x) { return x !== state.lineX; });
      state.lineX = opts[Math.floor(Math.random() * opts.length)];
      runNow(true);
    });
    mazeBtn.addEventListener("click", function () { state.mazeSeed = state.mazeSeed % 500 + 1; runNow(true); });

    function renderEditor() {
      editor.innerHTML = "";
      moveBtn.style.display = state.tier === "intermediate" ? "" : "none";
      mazeBtn.style.display = state.tier === "expert" ? "" : "none";
      if (state.tier === "expert") {
        editor.appendChild(row("If the right or left side opens:", segmented("Side rule", [
          { value: "right", label: "Turn right and step" },
          { value: "left", label: "Turn left and step" },
          { value: "none", label: "Ignore it" }
        ], state.rules.side, function (v) { state.rules.side = v; runNow(true); })));
        editor.appendChild(row("If the bump sensor hits a wall ahead:", segmented("Blocked rule", [
          { value: "left", label: "Turn left" },
          { value: "right", label: "Turn right" },
          { value: "back", label: "Turn around" }
        ], state.rules.blocked, function (v) { state.rules.blocked = v; runNow(true); })));
        editor.appendChild(el("p", { class: "w-mono", text: "Otherwise: forward one square. The robot repeats these rules until it reaches the goal." }));
        return;
      }
      var prog = state.progs[state.tier];
      var list = el("ol", { class: "rb-blocks", "aria-label": "Program" });
      prog.blocks.forEach(function (b, i) {
        var li = el("li", { class: "rb-block" });
        li.appendChild(el("span", { class: "rb-block-name", text: BLOCK_NAMES[b.op] }));
        if (b.op === "fwd") {
          var minus = el("button", { type: "button", class: "rb-mini", "aria-label": "Fewer squares", text: "−" });
          var plus = el("button", { type: "button", class: "rb-mini", "aria-label": "More squares", text: "+" });
          minus.addEventListener("click", function () { b.n = Math.max(1, b.n - 1); renderEditor(); runNow(false); });
          plus.addEventListener("click", function () { b.n = Math.min(8, b.n + 1); renderEditor(); runNow(false); });
          li.appendChild(el("span", { class: "rb-step" }, [minus, el("span", { class: "w-mono", text: b.n + (b.n === 1 ? " square" : " squares") }), plus]));
        }
        var del = el("button", { type: "button", class: "rb-mini rb-del", "aria-label": "Remove this block", title: "Remove", text: "×" });
        del.addEventListener("click", function () { prog.blocks.splice(i, 1); renderEditor(); runNow(false); });
        li.appendChild(del);
        list.appendChild(li);
      });
      if (!prog.blocks.length) list.appendChild(el("li", { class: "rb-block rb-empty", text: "Empty program: add a block below." }));
      editor.appendChild(list);
      var pal = el("div", { class: "w-actions" }, [el("span", { class: "w-mono", text: "Add:" })]);
      PALETTE[state.tier].forEach(function (op) {
        var b = el("button", { type: "button", class: "w-btn w-btn-quiet rb-add", text: BLOCK_NAMES[op] });
        b.addEventListener("click", function () {
          if (prog.blocks.length >= 10) return;
          prog.blocks.push(op === "fwd" ? { op: "fwd", n: 2 } : { op: op });
          renderEditor(); runNow(false);
        });
        pal.appendChild(b);
      });
      editor.appendChild(pal);
      var rm = el("button", { type: "button", class: "rb-mini", "aria-label": "Fewer repeats", text: "−" });
      var rp = el("button", { type: "button", class: "rb-mini", "aria-label": "More repeats", text: "+" });
      rm.addEventListener("click", function () { prog.repeat = Math.max(1, prog.repeat - 1); renderEditor(); runNow(false); });
      rp.addEventListener("click", function () { prog.repeat = Math.min(6, prog.repeat + 1); renderEditor(); runNow(false); });
      editor.appendChild(row("Loop: run the whole program", el("span", { class: "rb-step" }, [rm, el("span", { class: "w-mono", text: prog.repeat + (prog.repeat === 1 ? " time" : " times") }), rp])));
    }

    function draw() {
      var t = state.task, res = state.result, g = t.grid;
      var W = chartWidth(arena), cols = g[0].length, rows = g.length;
      var cell = Math.floor(Math.min(W / cols, 34)), Wd = cell * cols, H = cell * rows;
      arena.innerHTML = "";
      var s = svg("svg", { viewBox: "0 0 " + Wd + " " + H, class: "rb-svg", role: "img", "aria-label": "Robot arena" });
      s.style.maxWidth = Wd + "px";
      g.forEach(function (r, y) {
        r.forEach(function (c, x) {
          var cls = c === "#" ? "rb-wall" : c === "=" ? "rb-tape" : c === "G" ? "rb-goal" : "rb-floor";
          s.appendChild(svg("rect", { x: x * cell, y: y * cell, width: cell, height: cell, class: cls }));
          if (c === "*") s.appendChild(svg("circle", { cx: (x + 0.5) * cell, cy: (y + 0.5) * cell, r: cell * 0.16, class: "rb-mark" }));
        });
      });
      var fr = res.frames.slice(0, state.frame + 1), pts = [];
      fr.forEach(function (f) { var pt = ((f.x + 0.5) * cell) + "," + ((f.y + 0.5) * cell); if (pts[pts.length - 1] !== pt) pts.push(pt); });
      s.appendChild(svg("polyline", { points: pts.join(" "), class: "rb-trail" }));
      fr.forEach(function (f) {
        if (f.ev === "bump") s.appendChild(svg("circle", { cx: (f.x + 0.5 + 0.42 * E.DX[f.h]) * cell, cy: (f.y + 0.5 + 0.42 * E.DY[f.h]) * cell, r: cell * 0.12, class: "rb-bump" }));
      });
      var cur = res.frames[state.frame], cx = (cur.x + 0.5) * cell, cy = (cur.y + 0.5) * cell, a = cur.h * 90, rr = cell * 0.36;
      var tri = svg("polygon", { points: (cx + rr) + "," + cy + " " + (cx - rr * 0.7) + "," + (cy - rr * 0.75) + " " + (cx - rr * 0.7) + "," + (cy + rr * 0.75), class: "rb-bot", transform: "rotate(" + a + " " + cx + " " + cy + ")" });
      s.appendChild(tri);
      arena.appendChild(s);

      var done = state.frame >= res.frames.length - 1;
      var msg;
      if (!done) msg = "Running: move " + res.frames.slice(0, state.frame + 1).filter(function (f) { return f.ev === "move"; }).length;
      else if (t.key === "square") msg = res.success ? "Square complete: all four marks, back home, " + res.moves + " moves." :
        "Marks visited: " + res.hit + " of " + res.marks + (res.home ? ", back home" : ", not back home") + (res.bumps ? ", " + res.bumps + (res.bumps === 1 ? " bump" : " bumps") : "") + ".";
      else if (t.key === "line") msg = res.success ? "Stopped on the tape." : "Missed the tape" + (res.bumps ? " and bumped the wall" : "") + ". The tape is " + (t.lineX - 1) + " squares away this time.";
      else msg = res.success ? "Goal reached in " + res.moves + " moves." : res.halted === "loop" ? "Stuck: the robot came back to the same square facing the same way, so it will circle forever." : "Out of time.";
      readout.textContent = msg;
      readout.className = "w-big " + (done ? (res.success ? "rb-ok" : "rb-no") : "");
      note.innerHTML = notes[t.key];
    }
    var notes = {
      square: "A square is one side and one turn, four times. Try the loop counter before adding more blocks: the shortest program that works uses two blocks.",
      line: "A fixed count works only while the tape stays put. Press <strong>Move the tape</strong>, then swap the Forward block for <strong>Forward until the sensor reads dark</strong>.",
      maze: "Keeping one hand on the wall solves any maze with no loops. Rules that ignore the open side, or turn the same way at every wall, often circle forever."
    };
    redraws.push(function () { if (state.result) draw(); });
    renderEditor(); runNow(false);
  }

  /* ---------------------------------------------- demo 2: the two weeks */

  function mountDays(root) {
    var gainBy = {};
    P.gains.forEach(function (g) { gainBy[g.topic] = g; });
    var pick = 4;
    var list = el("ol", { class: "rb-days" });
    var detail = el("div", { class: "rb-day-detail", "aria-live": "polite" });
    root.appendChild(el("p", { class: "w-mono", text: "Eight content pairings, in the order the paper lists them. Choose one." }));
    root.appendChild(list);
    root.appendChild(detail);
    P.sessions.forEach(function (sp, i) {
      var b = el("button", { type: "button", class: "rb-day-btn", "aria-pressed": "false" }, [
        el("span", { class: "rb-day-num", text: String(i + 1) }),
        el("span", { class: "rb-day-area", text: sp[0] }),
        el("span", { class: "rb-day-topic", text: sp[1] })
      ]);
      b.addEventListener("click", function () { pick = i; render(); });
      list.appendChild(el("li", {}, [b]));
    });
    function render() {
      Array.prototype.forEach.call(list.querySelectorAll(".rb-day-btn"), function (b, i) { b.setAttribute("aria-pressed", i === pick ? "true" : "false"); });
      var sp = P.sessions[pick], topic = sp[1].replace(/ \(.*\)$/, ""), g = gainBy[topic];
      var steps = [
        ["Pretest", "About eight questions: five on the day's content, three on pedagogy"],
        ["Content session", sp[0] + " paired with " + sp[1].toLowerCase()],
        ["Robot lab", "Build and program LEGO MindStorms robots at a self-chosen level; facilitators help without giving answers"],
        ["Posttest", "The same kind of quiz again, the same day"]
      ];
      detail.innerHTML = "";
      var ul = el("ul", { class: "rb-cycle" });
      steps.forEach(function (st, i) {
        ul.appendChild(el("li", {}, [el("span", { class: "rb-cycle-step", text: (i + 1) + ". " + st[0] }), el("span", { class: "rb-cycle-what", text: st[1] })]));
      });
      detail.appendChild(ul);
      var res;
      if (g) res = "The paper reports " + (String(g.pct).charAt(0) === "8" ? "an " : "a ") + g.pct + "% increase from pretest to posttest on " + (g.topic === "pH" ? "pH" : g.topic.toLowerCase()) + (g.note ? ", the " + g.note + " gain it reports." : ".");
      else if (topic === "Data encoding") res = "The paper reports this day's quiz gain at p < 0.015, the one exception the paper names to p < 0.001.";
      else res = "The paper does not report this day's quiz numbers separately; they appear only in a figure.";
      detail.appendChild(el("p", { class: "w-big", text: res }));
    }
    var data = el("div", { class: "rb-sources", "data-levels": "ug grad res" }, [
      el("p", { class: "w-mono", text: "Three data sources for 13 teachers (five elementary, five middle, three high school):" }),
      el("ul", { class: "rb-cycle" }, [
        el("li", {}, [el("span", { class: "rb-cycle-step", text: "Confidence survey" }), el("span", { class: "rb-cycle-what", text: "Before and after: a self-ranking (novice, intermediate, or expert) and seven Likert items" })]),
        el("li", {}, [el("span", { class: "rb-cycle-step", text: "Daily quizzes" }), el("span", { class: "rb-cycle-what", text: "Pretest and posttest every day of the two weeks" })]),
        el("li", {}, [el("span", { class: "rb-cycle-step", text: "Artifacts" }), el("span", { class: "rb-cycle-what", text: "At least 13 lesson plans and final robot programs, coded for themes" })])
      ])
    ]);
    root.appendChild(data);
    root.appendChild(el("p", { class: "w-source", text: "From the paper's methods · the day-by-day schedule appears only in the paper's Figure 1, so the pairings are not mapped to dates here" }));
    render();
  }

  /* ---------------------------------------------- demo 3: self-rankings */

  function mountRank(root) {
    var all = E.allRankings();
    var state = { k: 2 };
    var pick = segmented("Intermediates who became experts", [0, 1, 2, 3, 4].map(function (k) { return { value: k, label: String(k) }; }), state.k, function (v) { state.k = v; draw(); });
    var pickRow = row("Of the four starting intermediates, how many became experts?", pick, "ug grad res");
    var chart = el("div", { class: "rb-chart" });
    var readout = el("div", { class: "rb-stats", "aria-live": "polite" });
    var table = el("div", { class: "ag-table-scroll", "data-levels": "res" });
    var src = el("p", { class: "w-source" });
    root.appendChild(pickRow);
    [chart, readout, table, src].forEach(function (n) { root.appendChild(n); });

    var LABELS = ["Novice", "Intermediate", "Expert"];
    function draw() {
      var lvl = currentLevel(), showPairs = /^(ug|grad|res)$/.test(lvl);
      var A = all[state.k], pr = A.pairing;
      var W = chartWidth(chart), H = 232, left = 104, right = W - 104, top = 46, gap = 62;
      chart.innerHTML = "";
      var s = svg("svg", { viewBox: "0 0 " + W + " " + H, class: "ag-svg", role: "img", "aria-label": "Thirteen teachers' self-rankings before and after the program" });
      var yFor = [0, top, top + gap, top + 2 * gap];
      [1, 2, 3].forEach(function (lev) {
        s.appendChild(svg("line", { x1: left - 6, x2: right + 6, y1: yFor[lev], y2: yFor[lev], class: "c-grid" }));
        s.appendChild(svg("text", { x: 4, y: yFor[lev] + 4, class: "c-label" }, LABELS[lev - 1]));
      });
      s.appendChild(svg("text", { x: left, y: 14, class: "c-tick", "text-anchor": "middle" }, "Before"));
      s.appendChild(svg("text", { x: right, y: 14, class: "c-tick", "text-anchor": "middle" }, "After"));
      // Stack dots within each rank in each column, in teacher order.
      function slots(vals) {
        var seen = { 1: 0, 2: 0, 3: 0 };
        return vals.map(function (v) { var i = seen[v]++; return i; });
      }
      var sPre = slots(pr.pre), sPost = slots(pr.post), step = 12;
      function xs(col, i, count) { return col === 0 ? left + 22 + i * step : right - 22 - i * step; }
      if (showPairs) {
        pr.pre.forEach(function (v, i) {
          s.appendChild(svg("line", { x1: xs(0, sPre[i]), y1: yFor[v], x2: xs(1, sPost[i]), y2: yFor[pr.post[i]], class: pr.post[i] > v ? "rb-up" : "rb-flat" }));
        });
      }
      pr.pre.forEach(function (v, i) { s.appendChild(svg("circle", { cx: xs(0, sPre[i]), cy: yFor[v], r: 5, class: "rb-dot-pre" })); });
      pr.post.forEach(function (v, i) { s.appendChild(svg("circle", { cx: xs(1, sPost[i]), cy: yFor[v], r: 5, class: "rb-dot-post" })); });
      [1, 2, 3].forEach(function (lev) {
        var nb = P.rankPre[lev - 1], na = P.rankPost[lev - 1];
        s.appendChild(svg("text", { x: left - 2, y: yFor[lev] - 9, class: "ag-val" }, nb + " (" + E.pct(nb, 13) + "%)"));
        s.appendChild(svg("text", { x: right + 2, y: yFor[lev] - 9, class: "ag-val", "text-anchor": "end" }, na + " (" + E.pct(na, 13) + "%)"));
      });
      s.appendChild(svg("text", { x: W / 2, y: H - 8, class: "c-tick", "text-anchor": "middle" },
        showPairs ? "Lines: one pairing consistent with the printed counts (the paper does not say who moved where)" : "Each dot is one teacher · counts and percentages from the paper"));
      chart.appendChild(s);

      var html = "";
      if (lvl === "public" || lvl === "hs") {
        html = "<p class='w-big'>Before: <strong>9 novices</strong> and 4 intermediates. After: <strong>no novices</strong>, 8 intermediates, and 5 experts.</p>";
      } else {
        html += "<p class='w-big'>Paired t-test on the codes 1, 2, 3: t(12) = <strong>" + fix(A.paired.t, 2) + "</strong>, p = <strong>" + pfmt(A.paired.p) + "</strong></p>";
        html += "<p class='w-note'>Mean change " + fix(A.paired.meanDiff, 3) + " levels (SD " + fix(A.paired.sdDiff, 3) + "). Treated as two independent groups, t(24) = " + fix(A.student.t, 2) + ", p = " + pfmt(A.student.p) + ". The paper reports p &lt; 0.001; every one of the five pairings gives it (largest paired p: " + pfmt(all[0].paired.p) + ").</p>";
        if (lvl === "grad" || lvl === "res") {
          html += "<p class='w-note' data-levels='grad res'><strong>Computed by this page, not in the paper.</strong> Exact tests that treat the ranks as ordered categories: sign test p = " + pfmt(A.sign.p) + " (" + A.sign.positive + " of 13 moved up; the " + (13 - A.sign.nonzero) + " who stayed drop out of both tests), Wilcoxon signed-rank p = " + pfmt(A.signedRank.p) + ". These clear 0.001 only when at least two of the four intermediates became experts.</p>";
        }
      }
      readout.innerHTML = html;

      var rows = all.map(function (a) {
        return "<tr" + (a.k === state.k ? " class='rb-sel'" : "") + "><td>" + a.k + "</td><td>" + (5 - a.k) + " · " + (4 + a.k) + " · " + a.k + " · " + (4 - a.k) + "</td><td>" + fix(a.paired.t, 3) + "</td><td>" + pfmt(a.paired.p) + "</td><td>" + pfmt(a.sign.p) + "</td><td>" + pfmt(a.signedRank.p) + "</td></tr>";
      }).join("");
      table.innerHTML = "<table class='results-table'><caption class='w-note'>Every pairing consistent with 9, 4, 0 before and 0, 8, 5 after (computed by this page). Moves: novice to expert · novice to intermediate · intermediate to expert · intermediate stays.</caption><thead><tr><th>k</th><th>Moves</th><th>Paired t(12)</th><th>Paired p</th><th>Sign p</th><th>Signed-rank p</th></tr></thead><tbody>" + rows + "</tbody></table>";
      src.textContent = "Counts: paper (n = 13) · tests: computed in your browser from those counts; the paper reports a t-test with p < 0.001";
    }
    redraws.push(draw);
    draw();
  }

  /* ---------------------------------------------- demo 4: quiz percentages */

  function mountQuiz(root) {
    var state = { pre: { ph: 40, structures: 46, water: 50, biomed: 70 } };
    var top = el("div", { class: "rb-chart" });
    var rowsWrap = el("div", { class: "rb-quiz-rows" });
    var other = el("p", { class: "w-note", "data-levels": "grad res", "aria-live": "polite" });
    var src = el("p", { class: "w-source", text: "Percent increases and two-week averages: paper (n = 13) · pretest sliders and every derived score: this page's arithmetic" });
    root.appendChild(top);
    root.appendChild(el("p", { class: "w-mono", text: "Move a pretest score; the posttest follows from the paper's percent increase." }));
    root.appendChild(rowsWrap);
    root.appendChild(other);
    root.appendChild(src);

    function drawTop() {
      var W = chartWidth(top), H = 92, x0 = 104, x1 = W - 16;
      function X(v) { return x0 + (x1 - x0) * v / 100; }
      top.innerHTML = "";
      var s = svg("svg", { viewBox: "0 0 " + W + " " + H, class: "ag-svg", role: "img", "aria-label": "Two-week average quiz scores, 57 percent before and 88 percent after" });
      [0, 25, 50, 75, 100].forEach(function (v) {
        s.appendChild(svg("line", { x1: X(v), x2: X(v), y1: 8, y2: 66, class: "c-grid" }));
        s.appendChild(svg("text", { x: X(v), y: 80, class: "c-tick", "text-anchor": "middle" }, v + "%"));
      });
      s.appendChild(svg("text", { x: 4, y: 26, class: "c-label" }, "Pretest"));
      s.appendChild(svg("text", { x: 4, y: 54, class: "c-label" }, "Posttest"));
      s.appendChild(svg("rect", { x: X(0), y: 14, width: X(P.quiz.pre) - X(0), height: 18, class: "ag-pre" }));
      s.appendChild(svg("rect", { x: X(0), y: 42, width: X(P.quiz.post) - X(0), height: 18, class: "ag-post" }));
      s.appendChild(svg("text", { x: X(P.quiz.pre) + 4, y: 27, class: "ag-val" }, P.quiz.pre + "%"));
      s.appendChild(svg("text", { x: X(P.quiz.post) - 4, y: 55, class: "ag-val rb-inbar", "text-anchor": "end" }, P.quiz.post + "%"));
      top.appendChild(s);
      top.appendChild(el("p", { class: "w-note", html: "Two-week averages: " + P.quiz.pre + "% to " + P.quiz.post + "%, a rise of " + (P.quiz.post - P.quiz.pre) + " percentage points, or <strong>" + fix(E.percentIncrease(P.quiz.pre, P.quiz.post), 0) + "%</strong> of the starting score." }));
    }

    var rowNodes = {};
    P.gains.forEach(function (g) {
      var range = el("input", { type: "range", min: "5", max: "95", step: "1", value: String(state.pre[g.key]), class: "ag-range", "aria-label": "Pretest score for " + g.topic });
      var bar = el("div", { class: "rb-mini-chart" });
      var line = el("p", { class: "w-note rb-quiz-line" });
      range.addEventListener("input", function () { state.pre[g.key] = Number(range.value); drawRow(g); drawOther(); });
      var r = el("div", { class: "rb-quiz-row" }, [
        el("div", { class: "rb-quiz-head" }, [el("span", { class: "rb-day-topic", text: g.topic }), el("span", { class: "w-mono", text: g.area + " · +" + g.pct + "%" })]),
        range, bar, line
      ]);
      rowNodes[g.key] = { bar: bar, line: line };
      rowsWrap.appendChild(r);
    });
    function drawRow(g) {
      var n = rowNodes[g.key], pre = state.pre[g.key], post = E.postFor(pre, g.pct), cap = E.preCeiling(g.pct);
      var W = chartWidth(n.bar), H = 30, x0 = 6, x1 = W - 10;
      function X(v) { return x0 + (x1 - x0) * Math.min(v, 220) / 220; }
      n.bar.innerHTML = "";
      var s = svg("svg", { viewBox: "0 0 " + W + " " + H, class: "ag-svg", "aria-hidden": "true" });
      s.appendChild(svg("rect", { x: X(0), y: 2, width: X(pre) - X(0), height: 10, class: "ag-pre" }));
      s.appendChild(svg("rect", { x: X(0), y: 15, width: X(post) - X(0), height: 10, class: post > 100 ? "rb-over" : "ag-post" }));
      s.appendChild(svg("line", { x1: X(100), x2: X(100), y1: 0, y2: 28, class: "ag-minute" }));
      n.bar.appendChild(s);
      n.line.innerHTML = "Pretest " + pre + "% → posttest <strong>" + fix(post, 1) + "%</strong>" +
        (post > 100 ? " (impossible: above 100%)" : "") +
        ". A " + g.pct + "% increase needs a pretest at or below " + fix(cap, 1) + "%.";
    }
    function drawOther() {
      var o = E.otherDays(state.pre, P.sessions.length);
      other.innerHTML = "<strong>Computed by this page, under one reading.</strong> If the two-week averages are the mean of the eight sessions' averages, the other four sessions must average " +
        fix(o.pre, 1) + "% before and " + fix(o.post, 1) + "% after (a " + fix(o.gain, 0) + "% increase)" + (o.feasible ? "." : ", which cannot happen.") +
        " The paper prints the daily values only in a figure, so the page cannot check which reading the averages use.";
    }
    redraws.push(function () { drawTop(); P.gains.forEach(drawRow); });
    drawTop(); P.gains.forEach(drawRow); drawOther();
  }

  /* ---------------------------------------------- demo 5: lesson-plan themes */

  function mountThemes(root) {
    var state = { theme: "encoding", msg: "ROBOTS", seed: 3, shown: false };
    var pick = segmented("Lesson-plan theme", P.themes.map(function (t) { return { value: t.key, label: t.name }; }), state.theme, function (v) { state.theme = v; render(); });
    var body = el("div", { class: "rb-theme" });
    root.appendChild(row("Theme:", pick));
    root.appendChild(body);
    root.appendChild(el("p", { class: "w-source", text: "Themes and example lessons: paper · the secret-message problems are generated by this page" }));
    function render() {
      var t = P.themes.filter(function (x) { return x.key === state.theme; })[0];
      body.innerHTML = "";
      body.appendChild(el("p", { class: "w-big", html: "<strong>" + t.name + ".</strong> " + t.what + "." }));
      body.appendChild(el("p", { class: "w-note", html: "Example lesson: <em>" + t.example + "</em> (" + t.band.toLowerCase() + "). " + t.detail }));
      if (t.key !== "encoding") return;
      var input = el("input", { type: "text", maxlength: "18", value: state.msg, class: "rb-text", "aria-label": "Message to encode (letters and spaces)" });
      var enc = el("button", { type: "button", class: "w-btn", text: "Encode" });
      var dec = el("button", { type: "button", class: "w-btn w-btn-quiet", text: state.shown ? "Hide the answer" : "Decode" });
      var out = el("ol", { class: "rb-code" });
      var ans = el("p", { class: "w-big", "aria-live": "polite" });
      body.appendChild(el("div", { class: "w-actions" }, [el("span", { class: "w-mono", text: "Message:" }), input, enc, dec]));
      body.appendChild(out); body.appendChild(ans);
      function show() {
        var probs = E.encodeMessage(state.msg, state.seed);
        out.innerHTML = "";
        probs.forEach(function (p) {
          out.appendChild(el("li", {}, [el("span", { class: "w-mono", text: p.a + " " + p.op + " " + p.b + " =" }), el("span", { class: "rb-code-ans", text: state.shown ? (p.value + " → " + (p.ch === " " ? "space" : p.ch)) : "?" })]));
        });
        ans.textContent = state.shown ? "Decoded: " + E.decodeProblems(probs) : "Key: 1 = A, 2 = B, … 26 = Z, and 0 = a space.";
      }
      input.addEventListener("input", function () {
        var clean = input.value.toUpperCase().replace(/[^A-Z ]/g, "");
        if (clean !== input.value) input.value = clean;
      });
      enc.addEventListener("click", function () { state.msg = input.value.toUpperCase().replace(/[^A-Z ]/g, "") || "ROBOTS"; state.seed = state.seed * 5 + 1; state.shown = false; dec.textContent = "Decode"; show(); });
      dec.addEventListener("click", function () { state.shown = !state.shown; dec.textContent = state.shown ? "Hide the answer" : "Decode"; show(); });
      show();
    }
    render();
  }

  /* ---------------------------------------------------------------- mount */

  var MOUNTS = { "rb-robot": mountRobot, "rb-days": mountDays, "rb-rank": mountRank, "rb-quiz": mountQuiz, "rb-themes": mountThemes };
  function boot() {
    Object.keys(MOUNTS).forEach(function (id) {
      var node = document.getElementById(id);
      if (!node) return;
      MOUNTS[id](node);
      node.classList.add("w-ready");
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();

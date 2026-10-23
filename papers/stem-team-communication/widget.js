/*
  Team-communication widget for /papers/stem-team-communication/.
  Mount points in the page: #tc-guess, #tc-punch, #tc-table, #tc-sizes.

  Demo 1 reveals Table 1's eleven metrics one at a time and asks which team
  struggled.
  Demo 2 simulates one team's six months in the cloud tool and draws the
  day-by-hour punch card (like Figure 1) and the monthly series (like Figure 2),
  with the page's first-pass screen. Everything in it is simulated.
  Demo 3 draws Table 1 side by side, with the sums and ratios it implies.
  Demo 4 (graduate and researcher) finds every team split consistent with the
  survey response rates and the nine follow-up responses.
  Demos 1 and 3 share the selected team (state.team); demo 2's presets follow it.
  All arithmetic lives in tc-engine.js.
*/
(function () {
  "use strict";

  var E = window.TeamCommEngine;
  var D = E.DATA;
  var SVGNS = "http://www.w3.org/2000/svg";
  var TEAMS = D.teams;
  var TEAM_CLS = ["tc-ada", "tc-bohr", "tc-curie"];
  var DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  var state = {
    team: null,
    revealed: 0,
    guess: null,
    preset: "ada",
    params: copy(E.PRESETS.ada),
    seed: 1,
    filter: "all",
    students: 12
  };

  /* ---------------------------------------------------------------- helpers */

  function copy(o) { var r = {}; Object.keys(o).forEach(function (k) { r[k] = o[k]; }); return r; }
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
  var WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
  function words(n) { return n < 10 ? WORDS[n] : String(n); }
  function cap(t) { return t.charAt(0).toUpperCase() + t.slice(1); }
  function fmt(m, v) {
    if (m.type === "pct") return v + "%";
    if (m.type === "mean") return fix(v, 1);
    return String(v);
  }
  function listTeams(idx) {
    var names = idx.map(function (i) { return TEAMS[i]; });
    return names.length === 1 ? names[0] : names.slice(0, -1).join(", ") + " and " + names[names.length - 1];
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

  // The shared team highlight: every copy stays in sync.
  var teamControls = [], teamDraws = [];
  function setTeam(v) {
    state.team = v === "none" ? null : Number(v);
    teamControls.forEach(function (c) { c.set(state.team === null ? "none" : state.team); });
    teamDraws.forEach(function (fn) { fn(); });
  }
  function teamControl() {
    var c = segmented("Highlight a team", [{ value: "none", label: "None" }].concat(TEAMS.map(function (t, i) {
      return { value: i, label: t };
    })), state.team === null ? "none" : state.team, setTeam);
    teamControls.push(c);
    return c;
  }

  /* ------------------------------------------- demo 1: which team struggled */

  function mountGuess(root) {
    var guess = segmented("Your guess", TEAMS.map(function (t, i) { return { value: i, label: t }; }), "", function (v) {
      state.guess = Number(v); draw();
    });
    var next = el("button", { type: "button", class: "w-btn", text: "Reveal the next metric" });
    var all = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "Reveal all 11" });
    var reset = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "Start over" });
    var wrap = el("div", { class: "tc-table-scroll" });
    var tally = el("p", { class: "w-big", "aria-live": "polite" });
    var verdict = el("p", { class: "tc-verdict" });
    var src = el("p", { class: "w-source", text: "Paper, Table 1 · three capstone teams (Ada, Bohr, Curie), one academic year" });
    root.appendChild(el("div", { class: "w-actions" }, [el("span", { class: "w-mono", text: "Which team struggled?" }), guess]));
    root.appendChild(el("div", { class: "w-actions" }, [next, all, reset]));
    root.appendChild(wrap);
    root.appendChild(tally);
    root.appendChild(verdict);
    root.appendChild(src);

    next.addEventListener("click", function () { if (state.revealed < D.metrics.length) state.revealed++; draw(); });
    all.addEventListener("click", function () { state.revealed = D.metrics.length; draw(); });
    reset.addEventListener("click", function () { state.revealed = 0; state.guess = null; guess.set(""); draw(); });

    function draw() {
      var n = state.revealed, total = D.metrics.length;
      var rows = D.metrics.map(function (m, i) {
        var shown = i < n, low = shown ? E.worst(m) : [];
        var cells = m.values.map(function (v, t) {
          if (!shown) return "<td class=\"tc-hidden\">?</td>";
          var isLow = low.indexOf(t) >= 0;
          return "<td class=\"" + (isLow ? "tc-low" : "") + (state.team === t ? " is-on" : "") + "\">" + fmt(m, v) + (isLow ? " <span class=\"tc-mark\" aria-label=\"lowest\">▼</span>" : "") + "</td>";
        }).join("");
        return "<tr class=\"" + (i === n - 1 ? "tc-new" : "") + "\"><td>" + (shown ? m.label : "Metric " + (i + 1)) +
          "<span class=\"tc-kind\" data-levels=\"ug grad res\">" + (m.kind === "tool" ? "tool" : "observed") + "</span></td>" + cells + "</tr>";
      }).join("");
      wrap.innerHTML = "<table class=\"tc-table\"><thead><tr><th>Metric</th>" + TEAMS.map(function (t) { return "<th>" + t + "</th>"; }).join("") +
        "</tr></thead><tbody>" + rows + "</tbody></table>";
      next.disabled = n >= total;
      next.textContent = n >= total ? "All 11 revealed" : "Reveal metric " + (n + 1) + " of " + total;

      if (n === 0) {
        tally.innerHTML = "Pick the team you think struggled, then reveal the metrics one by one.";
      } else {
        var ids = D.metrics.slice(0, n).map(function (m) { return m.id; });
        var t = E.tally(ids);
        tally.innerHTML = "After " + words(n) + " of 11: lowest score on " +
          TEAMS.map(function (name, i) { return name + " <strong>" + t.lowest[i] + "</strong>"; }).join(", ") +
          (t.shared ? " (one metric ties two teams)" : "") + ".";
      }
      var msg = "";
      if (n >= total) {
        msg = "<strong>The paper's reading:</strong> Ada and Curie communicated well and stayed in sync; Bohr never settled into a routine. " +
          "Bohr scores lowest on 10 of the 11 metrics, alone on nine. The one exception and the one tie both measure the tool rather than the team: Curie held no online discussions and, like Bohr, did not use the collaborative features, because it carried its conversation through email and extra sponsor meetings instead.";
        if (state.guess !== null) msg = (state.guess === 1 ? "Your guess matches the paper. " : "You picked " + TEAMS[state.guess] + "; the paper picks Bohr. ") + msg;
      } else if (state.guess !== null && n > 0) {
        var low = E.tally(D.metrics.slice(0, n).map(function (m) { return m.id; })).lowest;
        msg = "Your guess, " + TEAMS[state.guess] + ", has the lowest score on " + low[state.guess] + " of the " + n + " metrics so far.";
      }
      verdict.innerHTML = msg;
    }
    teamDraws.push(draw);
    draw();
  }

  /* --------------------------------- demo 2: a simulated team's repository */

  var SLIDERS = [
    { key: "steady", label: "Work done in steady daytime hours", min: 0, max: 1, step: 0.05, show: function (v) { return fix(100 * v, 0) + "%"; } },
    { key: "trend", label: "Work trend over six months", min: -1, max: 1, step: 0.05, show: function (v) { return v > 0 ? "rising " + fix(100 * v, 0) : v < 0 ? "falling " + fix(-100 * v, 0) : "flat"; } },
    { key: "threads", label: "Discussions started per month", min: 0, max: 25, step: 0.5, show: function (v) { return fix(v, 1); } },
    { key: "replies", label: "Average responses per discussion", min: 0, max: 7, step: 0.1, show: function (v) { return fix(v, 1); } }
  ];

  function mountPunch(root) {
    var presets = segmented("Team habits", [
      { value: "ada", label: "Like Ada" },
      { value: "bohr", label: "Like Bohr" },
      { value: "curie", label: "Like Curie" },
      { value: "own", label: "Your own" }
    ], state.preset, function (v) {
      state.preset = v;
      if (v !== "own") { state.params = copy(E.PRESETS[v]); state.seed = 1; syncSliders(); }
      draw();
    });
    var resample = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "Another team, same habits" });
    var sliderBox = el("div", { class: "tc-sliders" });
    var inputs = {};
    SLIDERS.forEach(function (s) {
      var id = "tc-s-" + s.key;
      var input = el("input", { type: "range", id: id, min: String(s.min), max: String(s.max), step: String(s.step), value: String(state.params[s.key]) });
      var out = el("output", { for: id, class: "w-mono" });
      input.addEventListener("input", function () {
        state.params[s.key] = Number(input.value);
        if (state.preset !== "own") { state.preset = "own"; presets.set("own"); }
        out.textContent = s.show(state.params[s.key]);
        draw();
      });
      inputs[s.key] = { input: input, out: out, spec: s };
      sliderBox.appendChild(el("div", { class: "tc-slider" }, [el("label", { for: id, text: s.label }), input, out]));
    });
    function syncSliders() {
      Object.keys(inputs).forEach(function (k) {
        inputs[k].input.value = String(state.params[k]);
        inputs[k].out.textContent = inputs[k].spec.show(state.params[k]);
      });
    }
    syncSliders();
    resample.addEventListener("click", function () { state.seed++; draw(); });

    var card = el("div", { class: "tc-chart" });
    var months = el("div", { class: "tc-chart" });
    var screen = el("div", { class: "tc-table-scroll" });
    var note = el("p", { class: "w-note" });
    var src = el("p", { class: "w-source" });
    root.appendChild(el("div", { class: "w-actions" }, [el("span", { class: "w-mono", text: "Habits:" }), presets, resample]));
    root.appendChild(sliderBox);
    root.appendChild(el("p", { class: "tc-sub", text: "When the work arrived (day of week by hour of day)" }));
    root.appendChild(card);
    root.appendChild(el("p", { class: "tc-sub", text: "How much arrived each month" }));
    root.appendChild(months);
    root.appendChild(screen);
    root.appendChild(note);
    root.appendChild(src);

    var sim, met;
    function draw() {
      sim = E.simulate(state.params, state.seed);
      met = E.measure(sim);
      drawCard();
      drawMonths();
      drawScreen();
      src.textContent = "Simulated team, seed " + state.seed + " · six months, " + met.total + " work items, " + met.discussions +
        " discussions · the paper's Figures 1 and 2 show the real teams but print no values";
    }

    function drawCard() {
      card.innerHTML = "";
      var w = chartWidth(card), narrow = w < 520;
      var L = narrow ? 30 : 38, R = w - 4, top = 4;
      var cw = (R - L) / 24, rowH = Math.max(16, Math.min(28, cw * 1.25)), h = top + 7 * rowH + 20;
      var max = 0, d, hr;
      for (d = 0; d < 7; d++) for (hr = 0; hr < 24; hr++) max = Math.max(max, sim.grid[d][hr]);
      var rMax = Math.min(cw, rowH) * 0.48;
      var s = svg("svg", { viewBox: "0 0 " + w + " " + h, class: "tc-svg", role: "img", "aria-label": "Simulated punch card: circle size shows work submitted in each day and hour" });
      for (d = 0; d < 7; d++) {
        var y = top + rowH * (d + 0.5);
        s.appendChild(svg("line", { x1: L, x2: R, y1: y, y2: y, class: "c-grid" }));
        s.appendChild(svg("text", { x: L - 6, y: y + 4, "text-anchor": "end", class: "c-tick" }, narrow ? DAYS[d].charAt(0) + DAYS[d].charAt(1) : DAYS[d]));
        for (hr = 0; hr < 24; hr++) {
          var c = sim.grid[d][hr];
          if (!c) continue;
          s.appendChild(svg("circle", { cx: L + cw * (hr + 0.5), cy: y, r: Math.max(1.2, rMax * Math.sqrt(c / max)), class: "tc-dot" }));
        }
      }
      [0, 6, 12, 18, 23].forEach(function (t) {
        s.appendChild(svg("text", { x: L + cw * (t + 0.5), y: h - 4, "text-anchor": "middle", class: "c-tick" }, t === 0 ? "12a" : t === 12 ? "12p" : t < 12 ? t + "a" : (t - 12) + "p"));
      });
      card.appendChild(s);
    }

    function drawMonths() {
      months.innerHTML = "";
      var w = chartWidth(months), h = 150, top = 12, base = h - 24, L = 34, R = w - 4;
      var y = sim.monthly, max = Math.max.apply(null, y.concat([10]));
      var nice = Math.ceil(max / 20) * 20;
      var colW = (R - L) / 6, bw = Math.min(46, colW * 0.6);
      function Y(v) { return base - (base - top) * v / nice; }
      var s = svg("svg", { viewBox: "0 0 " + w + " " + h, class: "tc-svg", role: "img", "aria-label": "Simulated work items per month with a least-squares trend line" });
      [0, nice / 2, nice].forEach(function (t) {
        s.appendChild(svg("line", { x1: L, x2: R, y1: Y(t), y2: Y(t), class: "c-grid" }));
        s.appendChild(svg("text", { x: L - 4, y: Y(t) + 4, "text-anchor": "end", class: "c-tick" }, String(t)));
      });
      y.forEach(function (v, i) {
        var cx = L + colW * (i + 0.5);
        s.appendChild(svg("rect", { x: cx - bw / 2, y: Y(v), width: bw, height: Math.max(0, base - Y(v)), class: "tc-bar" }));
        s.appendChild(svg("text", { x: cx, y: Y(v) - 3, "text-anchor": "middle", class: "c-val" }, String(v)));
        s.appendChild(svg("text", { x: cx, y: base + 15, "text-anchor": "middle", class: "c-tick" }, "M" + (i + 1)));
      });
      var mean = y.reduce(function (a, b) { return a + b; }, 0) / y.length;
      var y0 = mean + met.slope * (0 - 2.5), y1 = mean + met.slope * (5 - 2.5);
      s.appendChild(svg("line", { x1: L + colW * 0.5, x2: L + colW * 5.5, y1: Y(Math.max(0, y0)), y2: Y(Math.max(0, y1)), class: "tc-trend" }));
      months.appendChild(s);
    }

    function drawScreen() {
      function row(label, value, flag, levels) {
        return "<tr" + (levels ? " data-levels=\"" + levels + "\"" : "") + "><td>" + label + "</td><td>" + value + "</td><td class=\"" + (flag ? "tc-flag" : "tc-ok") + "\">" + (flag ? "check in" : "fine") + "</td></tr>";
      }
      var short = met.length < E.LONG_AT, uneven = met.even === "No", falling = met.slope <= 0;
      screen.innerHTML = "<table class=\"tc-table tc-screen\"><caption class=\"w-note\">The paper's first pass for a teacher: conversation length, how work is spread, and when it arrives. Thresholds are the page's.</caption>" +
        "<thead><tr><th>First-pass check</th><th>This team</th><th>Screen</th></tr></thead><tbody>" +
        row("Average responses per discussion", fix(met.length, 1) + " over " + met.discussions + " discussions", short) +
        row("Work spread across the week", (uneven ? "uneven" : "even") + " <span data-levels=\"grad res\">(evenness " + fix(met.evenness, 3) + "; busiest 17 of 168 hours hold " + fix(100 * met.topShare, 0) + "%)</span>", uneven) +
        row("Work over time", (falling ? "decreasing" : "increasing") + " <span data-levels=\"ug grad res\">(" + (met.slope >= 0 ? "+" : "") + fix(met.slope, 1) + " items a month, " + (met.relSlope >= 0 ? "+" : "") + fix(100 * met.relSlope, 0) + "% of the average)</span>", falling) +
        "</tbody></table>";
      var flags = met.flags;
      note.innerHTML = (flags === 0 ? "This team passes all three checks." : flags === 3 ? "This team trips all three checks: the pattern the paper reports for Bohr." :
        "This team trips " + words(flags) + " of three checks.") +
        " <span data-levels=\"ug grad res\">Even means the normalized entropy of the 168 day-and-hour cells is at least " + fix(E.EVEN_AT, 2) +
        "; increasing means a positive least-squares slope across the six months; long discussions average at least " + fix(E.LONG_AT, 1) +
        " responses. The paper classified its own figures by eye and states no thresholds.</span>";
    }

    teamDraws.push(function () {
      if (state.team !== null && state.preset !== ["ada", "bohr", "curie"][state.team]) {
        state.preset = ["ada", "bohr", "curie"][state.team];
        state.params = copy(E.PRESETS[state.preset]);
        state.seed = 1;
        presets.set(state.preset);
        syncSliders();
        draw();
      }
    });
    redraws.push(function () { drawCard(); drawMonths(); });
    draw();
  }

  /* ----------------------------------------------- demo 3: the eleven metrics */

  function mountTable(root) {
    var filter = segmented("Metrics", [
      { value: "all", label: "All 11" },
      { value: "tool", label: "Tool based (7)" },
      { value: "observed", label: "Observed (4)" }
    ], state.filter, function (v) { state.filter = v; draw(); });
    var wrap = el("div", { class: "tc-table-scroll" });
    var mix = el("div", { class: "tc-chart" });
    var legend = el("div", { class: "c-legend" }, [
      el("span", { class: "tc-lg" }, [el("span", { class: "tc-sw tc-email" }), "Email discussions"]),
      el("span", { class: "tc-lg" }, [el("span", { class: "tc-sw tc-online" }), "Online discussions (in the tool)"])
    ]);
    var readout = el("div", { class: "tc-readout" });
    var src = el("p", { class: "w-source", text: "Paper, Table 1 · sums and ratios computed by this page" });
    root.appendChild(el("div", { class: "w-actions" }, [el("span", { class: "w-mono", text: "Show:" }), filter]));
    root.appendChild(el("div", { class: "w-actions" }, [el("span", { class: "w-mono", text: "Highlight:" }), teamControl()]));
    root.appendChild(wrap);
    root.appendChild(el("p", { class: "tc-sub", text: "Where each team's discussions happened" }));
    root.appendChild(mix);
    root.appendChild(legend);
    root.appendChild(readout);
    root.appendChild(src);

    function draw() {
      var rows = D.metrics.filter(function (m) { return state.filter === "all" || m.kind === state.filter; }).map(function (m) {
        var numeric = m.type === "count" || m.type === "mean" || m.type === "pct";
        var max = numeric ? Math.max.apply(null, m.values) : 1;
        var low = E.worst(m);
        var cells = m.values.map(function (v, t) {
          var on = state.team === t ? " is-on" : "";
          var lowCls = low.indexOf(t) >= 0 ? " tc-low" : "";
          if (!numeric) return "<td class=\"" + lowCls + on + "\">" + v + "</td>";
          var pct = max > 0 ? 100 * v / max : 0;
          return "<td class=\"tc-cell" + lowCls + on + "\"><span class=\"tc-inbar\"><span class=\"tc-fill " + TEAM_CLS[t] + "\" style=\"width:" + fix(pct, 1) + "%\"></span></span>" + fmt(m, v) + "</td>";
        }).join("");
        return "<tr><td>" + m.label + "<span class=\"tc-kind\">" + (m.kind === "tool" ? "tool" : "observed") + "</span></td>" + cells + "</tr>";
      }).join("");
      wrap.innerHTML = "<table class=\"tc-table\"><caption class=\"w-note\">Table 1 as printed. Bars compare the three teams within each row; shading marks each row's lowest team.</caption><thead><tr><th>Metric</th>" +
        TEAMS.map(function (t) { return "<th>" + t + "</th>"; }).join("") + "</tr></thead><tbody>" + rows + "</tbody></table>";
      drawMix();
      var c = E.checks(), r = c.ratios;
      readout.innerHTML =
        "<p>Ada held <strong>" + fix(r.discAda, 1) + "×</strong> as many discussions as Bohr and Curie <strong>" + fix(r.discCurie, 1) + "×</strong>; Ada's discussions also ran " + fix(r.lengthAda, 1) + " times as long as Bohr's.</p>" +
        "<p data-levels=\"ug grad res\" class=\"w-note\">Meetings: Ada " + fix(r.totalAda, 1) + "× and Curie " + fix(r.totalCurie, 1) + "× Bohr's total; " + fix(r.teamAda, 1) + "× each on team-only meetings; " +
        fix(r.sponsorAda, 1) + "× and " + fix(r.sponsorCurie, 1) + "× on sponsor meetings. The paper rounds the first two to \"2.5 to 3 times\".</p>" +
        "<p data-levels=\"grad res\" class=\"w-note\">Checks: email plus online discussions equals the printed total for every team (" +
        c.discussions.map(function (x) { return x.email + " + " + x.online + " = " + x.sum; }).join("; ") + "), and sponsor plus team-only meetings equals total meetings (" +
        c.meetings.map(function (x) { return x.sponsor + " + " + x.team_only + " = " + x.sum; }).join("; ") + "). Three of the eleven rows are therefore sums of others.</p>";
    }

    function drawMix() {
      mix.innerHTML = "";
      var w = chartWidth(mix), narrow = w < 520;
      var labelW = narrow ? 46 : 60, L = labelW + 8, R = w - (narrow ? 64 : 90), rowH = 30, h = 6 + 3 * rowH + 4;
      var em = E.metric("email").values, on = E.metric("online").values, tot = E.metric("total").values;
      var max = Math.max.apply(null, tot);
      var s = svg("svg", { viewBox: "0 0 " + w + " " + h, class: "tc-svg", role: "img", "aria-label": "Email and online discussions for each team" });
      function X(v) { return L + (R - L) * v / max; }
      TEAMS.forEach(function (t, i) {
        var y = 6 + i * rowH;
        s.appendChild(svg("text", { x: labelW, y: y + 15, "text-anchor": "end", class: "c-label" + (state.team === i ? " tc-on-label" : "") }, t));
        s.appendChild(svg("rect", { x: X(0), y: y + 3, width: X(em[i]) - X(0), height: 16, class: "tc-email" }));
        s.appendChild(svg("rect", { x: X(em[i]), y: y + 3, width: X(em[i] + on[i]) - X(em[i]), height: 16, class: "tc-online" }));
        s.appendChild(svg("text", { x: X(tot[i]) + 6, y: y + 16, class: "c-val" }, tot[i] + (narrow ? "" : " (" + fix(100 * em[i] / tot[i], 0) + "% email)")));
      });
      mix.appendChild(s);
    }
    teamDraws.push(draw);
    redraws.push(drawMix);
    draw();
  }

  /* ------------------------------------------ demo 4: how big was each team */

  function mountSizes(root) {
    var pick = segmented("Students surveyed", [
      { value: 12, label: "12 (methods: students)" },
      { value: 13, label: "13 (abstract)" },
      { value: 17, label: "17 (everyone)" }
    ], state.students, function (v) { state.students = Number(v); draw(); });
    var wrap = el("div", { class: "tc-table-scroll" });
    var readout = el("div", { class: "tc-readout" });
    var src = el("p", { class: "w-source", text: "Paper, Table 1 response rates and the methods' n = 9 follow-up · enumeration by this page" });
    root.appendChild(el("div", { class: "w-actions" }, [el("span", { class: "w-mono", text: "People surveyed:" }), pick]));
    root.appendChild(wrap);
    root.appendChild(readout);
    root.appendChild(src);

    function draw() {
      var n = state.students, all = E.teamSizes(n);
      var rows = all.map(function (s) {
        var hit = s.total === D.participants.surveyFollowUp;
        return "<tr class=\"" + (hit ? "tc-hit" : "") + "\"><td>" + s.sizes.join(" · ") + "</td><td>" + s.responses.join(" · ") + "</td><td>" + s.total + (hit ? " ✓" : "") + "</td></tr>";
      }).join("");
      wrap.innerHTML = "<table class=\"tc-table\"><caption class=\"w-note\">Every split of " + n + " people into Ada · Bohr · Curie whose response counts round to 80%, 33%, and 100%.</caption>" +
        "<thead><tr><th>Team sizes</th><th>Responses</th><th>Total responses</th></tr></thead><tbody>" + rows + "</tbody></table>";
      var hits = all.filter(function (s) { return s.total === 9; });
      var html;
      if (hits.length === 1) {
        var s = hits[0], sz = s.sizes;
        var disc = E.metric("total").values, meet = E.metric("meetings").values;
        html = "<p class=\"w-big\">Only one split gives the nine follow-up responses: Ada <strong>" + sz[0] + "</strong>, Bohr <strong>" + sz[1] + "</strong>, Curie <strong>" + sz[2] + "</strong>.</p>" +
          "<p class=\"w-note\">Per student, that makes " + TEAMS.map(function (t, i) { return t + " " + fix(disc[i] / sz[i], 1); }).join(", ") +
          " discussions and " + TEAMS.map(function (t, i) { return t + " " + fix(meet[i] / sz[i], 1); }).join(", ") +
          " meetings. Bohr's gap shrinks per person but does not close. Team sizes and per-student rates are the page's inference; the paper prints neither.</p>";
      } else {
        html = "<p class=\"w-big\">No split of " + n + " people gives nine responses (possible totals: " +
          all.map(function (s) { return s.total; }).filter(function (v, i, a) { return a.indexOf(v) === i; }).sort(function (a, b) { return a - b; }).join(", ") + ").</p>" +
          "<p class=\"w-note\">The response rates and the n = 9 follow-up fit together only if the survey went to the 12 students.</p>";
      }
      readout.innerHTML = html;
    }
    draw();
  }

  /* ------------------------------------------------------------------ boot */

  function mount(id, fn) {
    var node = document.getElementById(id);
    if (!node) return;
    try { fn(node); node.classList.add("w-ready"); }
    catch (err) { node.appendChild(el("p", { class: "w-note", text: "This demo could not start: " + err.message })); if (window.console) console.error(err); }
  }
  function boot() {
    mount("tc-guess", mountGuess);
    mount("tc-punch", mountPunch);
    mount("tc-table", mountTable);
    mount("tc-sizes", mountSizes);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();

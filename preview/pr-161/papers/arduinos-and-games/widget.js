/*
  Arduinos and Games widget for /papers/arduinos-and-games/.
  Mount points in the page: #ag-game, #ag-days, #ag-ratings, #ag-test, #ag-recover.

  Demo 1 runs a timed model of the "What is coding?" sorting game in three team
  formations (the timings are the page's assumptions; the paper reports only the
  diamond and "under a minute").
  Demo 2 walks the two computer science days: activities, stations, attendance,
  and the March open-response counts.
  Demo 3 draws the June perception results (n = 22).
  Demo 4 draws Table 3 (pre/post content test, N = 20) and, from the undergraduate
  level up, recomputes the paired t and effect size from the printed summary
  with a correlation the reader can move.
  Demo 5 (graduate and researcher) rebuilds whole-number score lists and
  pairings that reproduce every value in Table 3.
  All arithmetic lives in ag-engine.js.
*/
(function () {
  "use strict";

  var E = window.ArduinosGamesEngine;
  var D = E.DATA;
  var T = D.table3;
  var SVGNS = "http://www.w3.org/2000/svg";

  var state = { formation: "diamond", day: "march", r: T.r, max: 10, seed: 1 };

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
  function sci(p) {
    if (p >= 0.001) return fix(p, 3);
    var e = Math.floor(Math.log(p) / Math.LN10), m = p / Math.pow(10, e);
    return fix(m, 1) + " × 10<sup>" + String(e).replace("-", "−") + "</sup>";
  }
  function comma(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ","); }

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

  /* ------------------------------------------- demo 1: "What is coding?" */

  var FORMATIONS = [
    { value: "solo", label: "One sorter", title: "One person reads, decides, and places every note" },
    { value: "line", label: "A line of five", title: "Input, three helpers who pass, and an output person who decides" },
    { value: "diamond", label: "Diamond", title: "Input deals to four sorters, who decide and pass to the output person" }
  ];
  var ROLE = { input: "Input", output: "Output" };
  function personLabel(p) {
    if (ROLE[p]) return ROLE[p];
    if (p.indexOf("helper") === 0) return "Helper " + (Number(p.slice(6)) + 1);
    if (p.indexOf("sorter") === 0) return "Sorter " + (Number(p.slice(6)) + 1);
    return p;
  }
  function personOrder(f, people) {
    var order = ["input"];
    people.filter(function (p) { return p.indexOf("helper") === 0; }).sort().forEach(function (p) { order.push(p); });
    people.filter(function (p) { return p.indexOf("sorter") === 0; }).sort().forEach(function (p) { order.push(p); });
    if (people.indexOf("output") >= 0) order.push("output");
    return order;
  }

  function mountGame(root) {
    var pick = segmented("Team formation", FORMATIONS, state.formation, function (v) { state.formation = v; stop(); compute(); draw(0); });
    var playBtn = el("button", { type: "button", class: "w-btn", text: "Play" });
    var reshuffle = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "Shuffle the notes" });
    var readout = el("p", { class: "w-big", "aria-live": "polite" });
    var chart = el("div", { class: "ag-chart" });
    var legend = el("div", { class: "c-legend" }, [
      el("span", { class: "ag-lg" }, [el("span", { class: "ag-sw ag-pass" }), "Pass (1 s)"]),
      el("span", { class: "ag-lg" }, [el("span", { class: "ag-sw ag-decide" }), "Read and decide the region (2 s)"]),
      el("span", { class: "ag-lg" }, [el("span", { class: "ag-sw ag-place" }), "Place on a pile (1 s)"])
    ]);
    var piles = el("div", { class: "ag-piles" });
    var note = el("p", { class: "w-note" });
    var src = el("p", { class: "w-source", text: "Model of the game, not data from the paper · 48 city notes (the paper used about 50) · timings are the page's assumptions" });
    root.appendChild(el("div", { class: "w-actions" }, [el("span", { class: "w-mono", text: "Formation:" }), pick]));
    root.appendChild(el("div", { class: "w-actions" }, [playBtn, reshuffle]));
    [readout, piles, chart, legend, note, src].forEach(function (n) { root.appendChild(n); });

    var sim = null, seed = 7, timer = null, now = 0;
    function compute() { sim = E.simulateGame(state.formation, seed); }
    function stop() { if (timer) { clearInterval(timer); timer = null; } playBtn.textContent = "Play"; }
    playBtn.addEventListener("click", function () {
      if (timer) { stop(); return; }
      if (now >= sim.total) now = 0;
      playBtn.textContent = "Pause";
      var start = Date.now() - now * 60;   // one model second = 60 ms
      timer = setInterval(function () {
        now = Math.min(sim.total, (Date.now() - start) / 60);
        draw(now);
        if (now >= sim.total) stop();
      }, 40);
    });
    reshuffle.addEventListener("click", function () { stop(); seed = seed * 7 + 3; compute(); now = 0; draw(0); });

    function draw(at) {
      if (at === undefined) at = now;
      now = at;
      var f = state.formation, people = personOrder(f, sim.people);
      // Piles: notes placed by time `at`.
      var placed = {}; E.REGIONS.forEach(function (r) { placed[r] = []; });
      sim.events.forEach(function (e) { if (e.action === "place" && e.end <= at + 1e-9) placed[sim.notes[e.note].region].push(sim.notes[e.note].city); });
      piles.innerHTML = "";
      E.REGIONS.forEach(function (r) {
        var list = placed[r];
        piles.appendChild(el("div", { class: "ag-pile" }, [
          el("span", { class: "ag-pile-name", text: r }),
          el("span", { class: "ag-pile-count", text: list.length + " of 12" }),
          el("span", { class: "ag-pile-top", text: list.length ? list[list.length - 1] : "—" })
        ]));
      });
      var done = 0; E.REGIONS.forEach(function (r) { done += placed[r].length; });
      var bottleneck = people.slice().sort(function (a, b) { return sim.work[b] - sim.work[a]; })[0];
      readout.innerHTML = "Model time <strong>" + Math.floor(at) + " s</strong> of " + sim.total + " s · " + done + " of 48 notes sorted";
      var msg = {
        solo: "One person does all the reading and placing: 48 notes at three seconds each is 144 seconds. Nobody else can help.",
        line: "Adding four people who only pass notes makes the job slower (" + sim.total + " s): the output person still reads every note, and the line adds a delay before the first one arrives. More people help only when the work is divided.",
        diamond: "The input person deals notes without reading them, four sorters read in parallel, and the output person only places. The slowest job is now dealing (one second a note), so the stack is done in " + sim.total + " s. The teachers' diamond finished in under a minute."
      }[f];
      note.innerHTML = msg + " Busiest person: <strong>" + personLabel(bottleneck) + "</strong> (" + sim.work[bottleneck] + " s of work).";

      // Gantt chart: one row per person.
      chart.innerHTML = "";
      var w = chartWidth(chart), narrow = w < 520;
      var labelW = narrow ? 62 : 82, L = labelW + 8, R = w - 10;
      var rowH = 20, top = 6, h = top + people.length * rowH + 24;
      var tMax = 150;
      var s = svg("svg", { viewBox: "0 0 " + w + " " + h, class: "ag-svg", role: "img", "aria-label": "Timeline of who is busy, " + FORMATIONS.filter(function (x) { return x.value === f; })[0].label + " formation" });
      function X(t) { return L + (R - L) * t / tMax; }
      for (var g = 0; g <= tMax; g += 30) {
        s.appendChild(svg("line", { x1: X(g), x2: X(g), y1: top, y2: h - 18, class: "c-grid" }));
        s.appendChild(svg("text", { x: X(g), y: h - 5, "text-anchor": "middle", class: "c-tick" }, g + " s"));
      }
      s.appendChild(svg("line", { x1: X(60), x2: X(60), y1: top, y2: h - 18, class: "ag-minute" }));
      if (!narrow) s.appendChild(svg("text", { x: X(60) + 4, y: top + 9, class: "c-tick" }, "one minute"));
      people.forEach(function (p, j) {
        var y = top + j * rowH;
        s.appendChild(svg("text", { x: labelW, y: y + 13, "text-anchor": "end", class: "c-label" }, personLabel(p)));
      });
      sim.events.forEach(function (e) {
        if (e.start > at) return;
        var j = people.indexOf(e.who), y = top + j * rowH;
        var end = Math.min(e.end, at);
        s.appendChild(svg("rect", { x: X(e.start), y: y + 3, width: Math.max(0.6, X(end) - X(e.start) - 0.4), height: rowH - 7, class: "ag-" + e.action }));
      });
      s.appendChild(svg("line", { x1: X(at), x2: X(at), y1: top, y2: h - 18, class: "ag-cursor" }));
      chart.appendChild(s);
    }

    compute();
    draw(sim.total);
    redraws.push(function () { draw(now); });
  }

  /* ----------------------------------------------- demo 2: the two CS days */

  function mountDays(root) {
    var pick = segmented("Day", D.days.map(function (d) {
      return { value: d.id, label: d.date + " (" + d.n + ")" };
    }), state.day, function (v) { state.day = v; draw(); });
    var place = el("p", { class: "w-note" });
    var list = el("ol", { class: "ag-rows" });
    var counts = el("div", { class: "ag-chart" });
    var src = el("p", { class: "w-source" });
    root.appendChild(el("div", { class: "w-actions" }, [el("span", { class: "w-mono", text: "Day:" }), pick]));
    [place, list, counts, src].forEach(function (n) { root.appendChild(n); });

    function draw() {
      var day = D.days.filter(function (d) { return d.id === state.day; })[0];
      place.innerHTML = "LASSI ran " + D.program.days + " days across the 2014 and 2015 summers and the school year. This is <strong>" + day.label + "</strong> (" + day.date + ", eight hours), with <strong>" + day.n + "</strong> teachers. Select an activity to read what happened.";
      list.innerHTML = "";
      day.activities.forEach(function (a, i) {
        var btn = el("button", { type: "button", class: "ag-row-btn", "aria-expanded": "false" }, [
          el("span", { class: "ag-row-num", text: String(i + 1) }), el("span", { class: "ag-row-name", text: a.name })
        ]);
        var detail = el("p", { class: "ag-row-detail", hidden: "hidden", text: a.detail });
        btn.addEventListener("click", function () {
          var open = detail.hasAttribute("hidden");
          if (open) detail.removeAttribute("hidden"); else detail.setAttribute("hidden", "hidden");
          btn.setAttribute("aria-expanded", open ? "true" : "false");
        });
        list.appendChild(el("li", { class: "ag-row" }, [btn, detail]));
      });
      drawCounts(day);
      src.textContent = day.id === "march"
        ? "Paper, Methods and Results (March 2015) · open responses from 11 teachers"
        : "Paper, Methods and Results (June 2015) · 22 teachers; perception results are in the next demo";
    }
    function drawCounts(day) {
      counts.innerHTML = "";
      if (day.id !== "march") return;
      var rows = [
        { label: "Plan to use NetLogo", v: D.march.netlogo },
        { label: "New idea: Robot Turtles, sorting game", short: "New idea: games", v: D.march.newIdeas },
        { label: "Nothing to improve, or a compliment", short: "Nothing to improve", v: D.march.nothing }
      ];
      var w = chartWidth(counts), narrow = w < 560;
      var labelW = narrow ? 128 : 280, L = labelW + 8, R = w - 60;
      var rowH = 26, h = 8 + rows.length * rowH + 22;
      var s = svg("svg", { viewBox: "0 0 " + w + " " + h, class: "ag-svg", role: "img", "aria-label": "March 2015 open-response counts out of 11 teachers" });
      function X(v) { return L + (R - L) * v / 11; }
      [0, 3, 6, 9, 11].forEach(function (g) {
        s.appendChild(svg("line", { x1: X(g), x2: X(g), y1: 6, y2: h - 18, class: "c-grid" }));
        s.appendChild(svg("text", { x: X(g), y: h - 5, "text-anchor": "middle", class: "c-tick" }, String(g)));
      });
      rows.forEach(function (r, j) {
        var y = 8 + j * rowH;
        s.appendChild(svg("text", { x: labelW, y: y + 14, "text-anchor": "end", class: "c-label" }, narrow && r.short ? r.short : r.label));
        s.appendChild(svg("rect", { x: X(0), y: y + 3, width: X(11) - X(0), height: 15, class: "ag-track" }));
        s.appendChild(svg("rect", { x: X(0), y: y + 3, width: X(r.v) - X(0), height: 15, class: "ag-bar" }));
        s.appendChild(svg("text", { x: w - 2, y: y + 15, "text-anchor": "end", class: "ag-val" }, r.v + " of 11"));
      });
      counts.appendChild(s);
    }
    redraws.push(function () { draw(); });
    draw();
  }

  /* ----------------------------------------- demo 3: June perceptions (n = 22) */

  function mountRatings(root) {
    var chart = el("div", { class: "ag-chart" });
    var note = el("p", { class: "w-note" });
    var src = el("p", { class: "w-source", text: "Paper, Results (June 2015) and abstract · 22 teachers, external evaluator's survey · the paper reports these as summary statements, not item tables" });
    root.appendChild(chart);
    root.appendChild(el("div", { class: "c-legend" }, [
      el("span", { class: "ag-lg" }, [el("span", { class: "ag-sw ag-bar" }), "Reported value"]),
      el("span", { class: "ag-lg" }, [el("span", { class: "ag-sw ag-floor" }), "“At least” (a floor, not a measurement)"])
    ]));
    root.appendChild(note);
    root.appendChild(src);
    var rows = [
      { label: "Session rating (mean, out of 5)", short: "Rating (of 5)", v: D.june.rating / 5, txt: "4.4 of 5" },
      { label: "Engaged more than 75% of the time", short: "Engaged > 75%", v: D.june.engagedOver75, txt: "all 22" },
      { label: "Rated each activity “very useful”", short: "Each “very useful”", v: D.june.veryUsefulMin, txt: "≥ 70%", floor: true },
      { label: "Hands-on activities were meaningful", short: "Meaningful", v: D.june.meaningful, txt: "all 22" },
      { label: "Intend to use some of it in class", short: "Will use it", v: D.june.intendToUse, txt: "all 22" }
    ];
    function draw() {
      chart.innerHTML = "";
      var w = chartWidth(chart), narrow = w < 560;
      var labelW = narrow ? 120 : 260, L = labelW + 8, R = w - 62;
      var rowH = 26, h = 8 + rows.length * rowH + 22;
      var s = svg("svg", { viewBox: "0 0 " + w + " " + h, class: "ag-svg", role: "img", "aria-label": "June 2015 perception results for 22 teachers" });
      function X(v) { return L + (R - L) * v; }
      [0, 0.25, 0.5, 0.75, 1].forEach(function (g) {
        s.appendChild(svg("line", { x1: X(g), x2: X(g), y1: 6, y2: h - 18, class: "c-grid" }));
        s.appendChild(svg("text", { x: X(g), y: h - 5, "text-anchor": "middle", class: "c-tick" }, Math.round(g * 100) + "%"));
      });
      rows.forEach(function (r, j) {
        var y = 8 + j * rowH;
        s.appendChild(svg("text", { x: labelW, y: y + 14, "text-anchor": "end", class: "c-label" }, narrow ? r.short : r.label));
        s.appendChild(svg("rect", { x: X(0), y: y + 3, width: X(1) - X(0), height: 15, class: "ag-track" }));
        s.appendChild(svg("rect", { x: X(0), y: y + 3, width: X(r.v) - X(0), height: 15, class: r.floor ? "ag-floor" : "ag-bar" }));
        s.appendChild(svg("text", { x: w - 2, y: y + 15, "text-anchor": "end", class: "ag-val" }, r.txt));
      });
      chart.appendChild(s);
      note.innerHTML = "The rating bar shows 4.4 as a share of the five-point scale (88%). The “very useful” bar is a floor: the paper says at least 70% of teachers gave that rating to every activity, so the true share for any one activity lies between 70% and 100%.";
    }
    redraws.push(draw);
    draw();
  }

  /* ---------------------------------------------- demo 4: Table 3 and the test */

  function mountTest(root) {
    var chart = el("div", { class: "ag-chart" });
    var readout = el("p", { class: "w-big" });
    var calc = el("div", { class: "ag-calc", "data-levels": "ug grad res" });
    var slider = el("input", { type: "range", min: "-0.5", max: "0.9", step: "0.01", value: String(state.r), "aria-label": "Correlation between pre-test and post-test scores", class: "ag-range" });
    var rLabel = el("span", { class: "w-mono" });
    var resetBtn = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "Paper's r = 0.14" });
    var table = el("div", { class: "ag-table-scroll" });
    var calcNote = el("p", { class: "w-note" });
    calc.appendChild(el("div", { class: "w-actions" }, [el("span", { class: "w-mono", text: "Correlation r:" }), slider, rLabel, resetBtn]));
    calc.appendChild(table);
    calc.appendChild(calcNote);
    var src = el("p", { class: "w-source", text: "Paper, Table 3 (June 29) · 20 teachers with both tests · maximum score not printed; the axis stops at 10" });
    [readout, chart, calc, src].forEach(function (n) { root.appendChild(n); });

    slider.addEventListener("input", function () { state.r = Number(slider.value); drawCalc(); });
    resetBtn.addEventListener("click", function () { state.r = T.r; slider.value = String(T.r); drawCalc(); });

    function drawChart() {
      chart.innerHTML = "";
      var w = chartWidth(chart), narrow = w < 520;
      var labelW = narrow ? 70 : 90, L = labelW + 8, R = w - 16;
      var rows = [
        { label: "Pre-test", m: T.preMean, s: T.preSD, cls: "ag-pre" },
        { label: "Post-test", m: T.postMean, s: T.postSD, cls: "ag-post" }
      ];
      var rowH = 34, h = 10 + rows.length * rowH + 22;
      var s = svg("svg", { viewBox: "0 0 " + w + " " + h, class: "ag-svg", role: "img", "aria-label": "Mean and standard deviation of pre-test and post-test scores" });
      function X(v) { return L + (R - L) * v / 10; }
      for (var g = 0; g <= 10; g += 2) {
        s.appendChild(svg("line", { x1: X(g), x2: X(g), y1: 6, y2: h - 18, class: "c-grid" }));
        s.appendChild(svg("text", { x: X(g), y: h - 5, "text-anchor": "middle", class: "c-tick" }, String(g)));
      }
      rows.forEach(function (r, j) {
        var y = 10 + j * rowH;
        s.appendChild(svg("text", { x: labelW, y: y + 14, "text-anchor": "end", class: "c-label" }, r.label));
        s.appendChild(svg("rect", { x: X(0), y: y + 3, width: X(r.m) - X(0), height: 16, class: r.cls }));
        var lo = Math.max(0, r.m - r.s), hi = Math.min(10, r.m + r.s);
        s.appendChild(svg("line", { x1: X(lo), x2: X(hi), y1: y + 11, y2: y + 11, class: "ag-whisker" }));
        s.appendChild(svg("line", { x1: X(lo), x2: X(lo), y1: y + 6, y2: y + 16, class: "ag-whisker" }));
        s.appendChild(svg("line", { x1: X(hi), x2: X(hi), y1: y + 6, y2: y + 16, class: "ag-whisker" }));
        var tx = X(r.m) + 6, anchor = "start";
        if (r.m > 7) { tx = X(lo) - 6; anchor = "end"; }
        s.appendChild(svg("text", { x: tx, y: y + 29, "text-anchor": anchor, class: "ag-val" }, fix(r.m, 2) + " ± " + fix(r.s, 2)));
      });
      chart.appendChild(s);
      readout.innerHTML = "Average score: <strong>" + fix(T.preMean, 2) + "</strong> before, <strong>" + fix(T.postMean, 2) + "</strong> after, a gain of " + fix(T.postMean - T.preMean, 2) + " points. The whiskers span one standard deviation on each side.";
    }

    function drawCalc() {
      var st = E.pairedFromSummary({ n: T.n, m1: T.preMean, s1: T.preSD, m2: T.postMean, s2: T.postSD, r: state.r });
      rLabel.textContent = fix(state.r, 2);
      var atPaper = Math.abs(state.r - T.r) < 1e-9;
      var rows = [
        ["Paired t(19)", fix(st.t, 2), "13.64"],
        ["p (two-sided)", sci(st.p), ".0000"],
        ["d<sub>rm</sub> = t √(2(1 − r)/n)", fix(st.drm, 3), "4.008"],
        ["d<sub>av</sub> = gain / √((s<sub>pre</sub>² + s<sub>post</sub>²)/2)", fix(st.dav, 3), "—"],
        ["d<sub>z</sub> = gain / SD of the gains", fix(st.dz, 3), "—"],
        ["SD of the gains", fix(st.sdDiff, 3), "—"]
      ];
      table.innerHTML = "<table class=\"ag-table\"><thead><tr><th>Statistic</th><th>Page, from the printed summary</th><th>Paper</th></tr></thead><tbody>" +
        rows.map(function (r) { return "<tr><td>" + r[0] + "</td><td>" + r[1] + "</td><td>" + r[2] + "</td></tr>"; }).join("") + "</tbody></table>";
      calcNote.innerHTML = atPaper
        ? "With the printed (rounded) means, standard deviations, and r, the page gets t = 13.67 and d<sub>rm</sub> = 4.008. The small gap in t comes from rounding in the printed table; the reconstruction below recovers t = 13.64 exactly. The paper's 4.008 matches d<sub>rm</sub>, the repeated-measures effect size, and none of the other conventions."
        : "Move r back to the paper's 0.14 to compare. A higher correlation (teachers who start high stay high) shrinks the spread of the gains and raises t, while d<sub>rm</sub> changes little; that stability is why some authors prefer it for pre/post designs.";
    }

    redraws.push(drawChart);
    drawChart();
    drawCalc();
  }

  /* --------------------------------------- demo 5: rebuilding Table 3 (grad res) */

  function mountRecover(root) {
    var pick = segmented("Highest possible score", [
      { value: 9, label: "Out of 9" }, { value: 10, label: "Out of 10" }, { value: 12, label: "Out of 12" }
    ], state.max, function (v) { state.max = Number(v); state.seed = 1; build(); draw(); });
    var again = el("button", { type: "button", class: "w-btn", text: "Draw another class" });
    var sums = el("div", { class: "ag-table-scroll" });
    var counts = el("p", { class: "w-note" });
    var chart = el("div", { class: "ag-chart" });
    var stats = el("p", { class: "w-big" });
    var src = el("p", { class: "w-source", text: "Page reconstruction from Table 3 · 20 whole-number scores per test · one of many consistent classes, not the teachers' answers" });
    root.appendChild(el("div", { class: "w-actions" }, [el("span", { class: "w-mono", text: "Test maximum (not printed):" }), pick]));
    [sums, counts, el("div", { class: "w-actions" }, [again]), stats, chart, src].forEach(function (n) { root.appendChild(n); });

    var preT = E.admissibleSums(T.n, T.preMean, T.preSD)[0];
    var postT = E.admissibleSums(T.n, T.postMean, T.postSD)[0];
    var cross = E.crossSums(T.n, preT, postT, T.r, T.t);
    var preLists = [], postLists = [], current = null;

    sums.innerHTML = "<table class=\"ag-table\"><thead><tr><th>Sum</th><th>Value</th><th>Fixed by</th></tr></thead><tbody>" +
      "<tr><td>Σ pre</td><td>" + preT.sum + "</td><td>mean 2.45 × 20</td></tr>" +
      "<tr><td>Σ pre²</td><td>" + preT.sumSq + "</td><td>SD 1.96 (the only whole number that rounds to it)</td></tr>" +
      "<tr><td>Σ post</td><td>" + postT.sum + "</td><td>mean 8.70 × 20</td></tr>" +
      "<tr><td>Σ post²</td><td>" + postT.sumSq + "</td><td>SD 0.92</td></tr>" +
      "<tr><td>Σ pre × post</td><td>" + cross.map(function (c) { return c.sxy; }).join(", ") + "</td><td>r 0.14 and t 13.64 together</td></tr>" +
      "</tbody></table>";

    function build() {
      preLists = E.scoreLists(T.n, preT.sum, preT.sumSq, state.max);
      postLists = E.scoreLists(T.n, postT.sum, postT.sumSq, state.max);
      counts.innerHTML = "With a maximum of " + state.max + ", <strong>" + comma(preLists.length) + "</strong> pre-test score lists and <strong>" + comma(postLists.length) + "</strong> post-test lists match the printed means and standard deviations. Every list gives the same sums, so every pairing that hits Σ pre × post = " + cross[0].sxy + " reproduces Table 3 to the last printed digit.";
    }
    function pickClass() {
      var rand = E.mulberry32(state.seed * 9973 + state.max);
      for (var tries = 0; tries < 200; tries++) {
        var a = preLists[Math.floor(rand() * preLists.length)], b = postLists[Math.floor(rand() * postLists.length)];
        var y = E.pairUp(a, b, cross[0].sxy, Math.floor(rand() * 1e9));
        if (y) return { pre: a, post: y };
      }
      return null;
    }
    function draw() {
      current = pickClass();
      drawChart();
    }
    function drawChart() {
      chart.innerHTML = "";
      if (!current) { stats.textContent = "No pairing found for this draw; draw again."; return; }
      var sx = 0, sxx = 0, sy = 0, syy = 0, sxy = 0;
      for (var i = 0; i < T.n; i++) { var a = current.pre[i], b = current.post[i]; sx += a; sxx += a * a; sy += b; syy += b * b; sxy += a * b; }
      var st = E.pairedFromSums({ n: T.n, sx: sx, sxx: sxx, sy: sy, syy: syy, sxy: sxy });
      stats.innerHTML = "This class: mean " + fix(st.m1, 2) + " (SD " + fix(st.s1, 2) + ") → " + fix(st.m2, 2) + " (SD " + fix(st.s2, 2) + "), r = " + fix(st.r, 4) +
        ", t(19) = <strong>" + fix(st.t, 4) + "</strong>, p = " + sci(st.p) + ", d<sub>rm</sub> = <strong>" + fix(st.drm, 4) + "</strong>.";
      var w = chartWidth(chart), narrow = w < 520;
      var top = 22, bottom = 26, h = narrow ? 260 : 300;
      var xPre = narrow ? 70 : 120, xPost = w - (narrow ? 70 : 120);
      var max = state.max;
      function Y(v) { return top + (h - top - bottom) * (1 - v / max); }
      var s = svg("svg", { viewBox: "0 0 " + w + " " + h, class: "ag-svg", role: "img", "aria-label": "Each of 20 reconstructed teachers as a line from pre-test score to post-test score" });
      for (var g = 0; g <= max; g++) {
        if (max > 10 && g % 2) continue;
        s.appendChild(svg("line", { x1: xPre, x2: xPost, y1: Y(g), y2: Y(g), class: "c-grid" }));
        s.appendChild(svg("text", { x: xPre - 8, y: Y(g) + 4, "text-anchor": "end", class: "c-tick" }, String(g)));
        s.appendChild(svg("text", { x: xPost + 8, y: Y(g) + 4, "text-anchor": "start", class: "c-tick" }, String(g)));
      }
      s.appendChild(svg("text", { x: xPre, y: 12, "text-anchor": "middle", class: "c-label" }, "Pre-test"));
      s.appendChild(svg("text", { x: xPost, y: 12, "text-anchor": "middle", class: "c-label" }, "Post-test"));
      // Count identical pairs to set line weight.
      var tally = {};
      for (var k = 0; k < T.n; k++) { var key = current.pre[k] + ">" + current.post[k]; tally[key] = (tally[key] || 0) + 1; }
      Object.keys(tally).forEach(function (key) {
        var parts = key.split(">"), a = Number(parts[0]), b = Number(parts[1]), c = tally[key];
        s.appendChild(svg("line", { x1: xPre, x2: xPost, y1: Y(a), y2: Y(b), class: "ag-slope", "stroke-width": String(1 + 1.4 * (c - 1)) }));
        if (c > 1) s.appendChild(svg("text", { x: xPre + (xPost - xPre) * 0.18, y: Y(a) + (Y(b) - Y(a)) * 0.18 - 4, class: "c-tick" }, "×" + c));
      });
      chart.appendChild(s);
    }
    again.addEventListener("click", function () { state.seed += 1; draw(); });
    redraws.push(function () { if (current) drawChart(); });
    build();
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
    mount("ag-game", mountGame);
    mount("ag-days", mountDays);
    mount("ag-ratings", mountRatings);
    mount("ag-test", mountTest);
    mount("ag-recover", mountRecover);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();

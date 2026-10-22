/*
  Outreach engagement widget for /papers/cs-outreach-engagement/.
  Mount points in the page: #oe-day, #oe-evidence, #oe-interest, #oe-next.

  Demo 1 draws the paper's four instruction settings for a camp of any size.
  Demo 2 maps the two research questions and three objectives to the evidence
  the paper offers for each. Demo 3 tests readings of the paper's two outcome
  numbers (17.5% and 65%) against the 2019 interest counts printed in the
  companion journal paper, labeled as the journal's; graduate and researcher
  levels add Wilson intervals, labeled as the page's own. Demo 4 lists the
  follow-on programs the paper names, with related pages on this site.
  All arithmetic lives in oe-engine.js.
*/
(function () {
  "use strict";

  var E = window.OutreachEngagementEngine;
  var P = E.PAPER, C = E.COMPANION;
  var SVGNS = "http://www.w3.org/2000/svg";

  var state = { n: 28, setting: "large", focus: "rq1", only: "all", denom: 23, pre: 30, post: 63, who: "all" };

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

  function range(label, min, max, step, value, onInput, fmt) {
    var id = "oe-r-" + Math.random().toString(36).slice(2, 8);
    var input = el("input", { type: "range", id: id, min: String(min), max: String(max), step: String(step), value: String(value) });
    var out = el("output", { for: id, text: fmt ? fmt(value) : String(value) });
    input.addEventListener("input", function () {
      var v = Number(input.value);
      out.textContent = fmt ? fmt(v) : String(v);
      onInput(v);
    });
    var wrap = el("div", { class: "w-range" }, [el("label", { for: id, text: label }), input, out]);
    wrap.input = input;
    wrap.output = out;
    return wrap;
  }

  var WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
  function words(n) { return n < 10 ? WORDS[n] : String(n); }
  function plural(n, one, many) { return words(n) + " " + (n === 1 ? one : (many || one + "s")); }
  function pct(v, d) { return v.toFixed(d === undefined ? 1 : d) + "%"; }

  /* ---------------------------------------------------------------- demo 1: four settings */

  var SETTING_OPTS = [
    { value: "class", label: "Class-wide" },
    { value: "large", label: "Large groups" },
    { value: "team", label: "Small teams" },
    { value: "solo", label: "Individual" }
  ];

  function mountDay(root) {
    var chart = el("div", { class: "oe-chart" });
    var summary = el("p", { class: "w-big", "aria-live": "polite" });
    var rows = el("div", { class: "oe-rows" });
    var fitNote = note("", "");

    var slider = range("Campers", 10, 60, 1, state.n, function (v) { state.n = v; draw(); }, function (v) { return String(v); });
    var seg = segmented("Instruction setting", SETTING_OPTS, state.setting, function (v) { state.setting = v; draw(); });

    var presets = el("div", { class: "w-actions" }, [
      el("span", { class: "w-mono", text: "Presets" }),
      el("button", { type: "button", class: "w-btn w-btn-quiet", text: "One full room (28)", onclick: function () { setN(28); } }),
      el("button", { type: "button", class: "w-btn w-btn-quiet", text: "Two rooms (55)", onclick: function () { setN(55); } }),
      el("button", { type: "button", class: "w-btn w-btn-quiet", text: "Small camp (12)", onclick: function () { setN(12); } })
    ]);

    function setN(v) {
      state.n = v;
      slider.input.value = String(v);
      slider.output.textContent = String(v);
      draw();
    }

    root.appendChild(el("div", { class: "w-actions" }, [el("span", { class: "w-mono", text: "Highlight" }), seg]));
    root.appendChild(slider);
    root.appendChild(presets);
    root.appendChild(summary);
    root.appendChild(chart);
    root.appendChild(fitNote);
    root.appendChild(rows);
    root.appendChild(note("Group sizes and leaders are the paper's. How a camp of a given size splits into groups (as few groups as the ranges allow, sizes as even as possible) is this page's arithmetic; the paper does not say how many campers attended or how groups were formed.", "ug grad res"));

    function draw() {
      var plan = E.campPlan(state.n);
      var W = chartWidth(chart);
      var dot = W >= 600 ? 14 : 9, gap = W >= 600 ? 6 : 4, pad = W >= 600 ? 10 : 8;
      var perTeamRow = 5;
      var boxW = pad * 2 + perTeamRow * dot + (perTeamRow - 1) * gap; // fits a team of five
      var colGap = 10, roomGap = 22;

      // lay out large groups into rows, keeping rooms together
      var x = 0, y = 26, rowH = 0, items = [];
      var roomBounds = plan.rooms.map(function () { return { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity }; });
      var prevRoom = 0;
      plan.large.forEach(function (g, gi) {
        var teams = plan.teams.filter(function (t) { return t.group === gi; });
        var h = pad * 2 + teams.length * (dot + 6) - 6 + 4;
        if (g.room !== prevRoom) { x += roomGap; prevRoom = g.room; }
        if (x + boxW > W) { x = 0; y += rowH + 30; rowH = 0; }
        items.push({ g: g, gi: gi, x: x, y: y, h: h, teams: teams });
        var b = roomBounds[g.room];
        b.x0 = Math.min(b.x0, x); b.y0 = Math.min(b.y0, y); b.x1 = Math.max(b.x1, x + boxW); b.y1 = Math.max(b.y1, y + h);
        rowH = Math.max(rowH, h);
        x += boxW + colGap;
      });
      var H = y + rowH + 14;

      var s = svg("svg", { class: "oe-svg", viewBox: "0 0 " + W + " " + H, width: W, height: H, role: "img",
        "aria-label": "A camp of " + plan.n + " students split into " + plan.rooms.length + " class-wide room(s), " + plan.large.length + " large groups, and " + plan.teams.length + " small teams." });

      var hl = state.setting;
      roomBounds.forEach(function (b, ri) {
        if (!isFinite(b.x0)) return;
        s.appendChild(svg("rect", { x: b.x0 - 5, y: b.y0 - 20, width: b.x1 - b.x0 + 10, height: b.y1 - b.y0 + 25,
          class: "oe-room" + (hl === "class" ? " is-on" : "") }));
        s.appendChild(svg("text", { x: b.x0, y: b.y0 - 7, class: "c-label" }, "Room " + (ri + 1) + " · " + plan.rooms[ri] + " campers"));
      });

      items.forEach(function (it) {
        s.appendChild(svg("rect", { x: it.x, y: it.y, width: boxW, height: it.h, class: "oe-group" + (hl === "large" ? " is-on" : "") }));
        it.teams.forEach(function (t, ti) {
          var ty = it.y + pad + ti * (dot + 6);
          var tw = t.size * dot + (t.size - 1) * gap;
          s.appendChild(svg("rect", { x: it.x + pad - 3, y: ty - 3, width: tw + 6, height: dot + 6, class: "oe-team" + (hl === "team" ? " is-on" : "") }));
          for (var k = 0; k < t.size; k++) {
            var cx = it.x + pad + k * (dot + gap) + dot / 2, cy = ty + dot / 2;
            s.appendChild(svg("circle", { cx: cx, cy: cy, r: dot / 2, class: "oe-dot" + (hl === "solo" ? " is-on" : "") }));
          }
        });
      });
      chart.innerHTML = "";
      chart.appendChild(s);

      var setting = P.settings.filter(function (x) { return x.key === hl; })[0];
      var counts = { "class": plan.rooms.length, large: plan.large.length, team: plan.teams.length, solo: plan.n };
      var unit = { "class": ["class-wide session", "class-wide sessions"], large: ["large group", "large groups"], team: ["small team", "small teams"], solo: ["student reflecting alone", "students reflecting alone"] }[hl];
      summary.textContent = setting.label + ": " + counts[hl] + " " + (counts[hl] === 1 ? unit[0] : unit[1]) + (hl === "solo" ? "." : ", led by " + setting.lead.toLowerCase() + ".");

      fitNote.innerHTML = plan.roomsFit
        ? ""
        : (plan.n < 25
          ? "With " + plan.n + " campers, the class-wide conversation runs below the paper's 25 to 30."
          : plan.n + " campers cannot split into rooms of 25 to 30 each, so this plan keeps one room of " + plan.n + ".");

      rows.innerHTML = "";
      P.settings.forEach(function (st) {
        var r = el("div", { class: "oe-row" + (st.key === hl ? " is-on" : "") }, [
          el("div", { class: "oe-row-name", text: st.label }),
          el("div", { class: "oe-row-val", text: st.does + "." }),
          el("div", { class: "oe-row-how", text: (st.key === "solo" ? "1 student" : st.min + "–" + st.max + " students") + " · " + st.lead + " · " + counts[st.key] + " here" })
        ]);
        rows.appendChild(r);
      });
    }

    redraws.push(draw);
    draw();
  }

  /* ---------------------------------------------------------------- demo 2: questions, objectives, evidence */

  var KIND = { number: "Number", statement: "Statement", design: "Design description" };

  function mountEvidence(root) {
    var targets = P.questions.concat(P.objectives);
    var seg = segmented("Question or objective", targets.map(function (t) { return { value: t.key, label: t.label }; }), state.focus, function (v) { state.focus = v; draw(); });
    var only = segmented("Evidence shown", [{ value: "all", label: "All evidence" }, { value: "number", label: "Numbers only" }], state.only, function (v) { state.only = v; draw(); });
    var head = el("p", { class: "w-big", "aria-live": "polite" });
    var list = el("div", { class: "oe-rows" });
    var grid = el("div", { class: "oe-matrix-wrap" });

    root.appendChild(el("div", { class: "w-actions" }, [seg]));
    root.appendChild(el("div", { class: "w-actions" }, [only]));
    root.appendChild(head);
    root.appendChild(list);
    root.appendChild(grid);

    function draw() {
      var t = targets.filter(function (x) { return x.key === state.focus; })[0];
      head.textContent = t.label + ": " + t.text;
      var ev = P.evidence.filter(function (e) { return e.links.indexOf(t.key) >= 0 && (state.only === "all" || e.kind === "number"); });
      list.innerHTML = "";
      if (!ev.length) list.appendChild(el("div", { class: "oe-row oe-row-ev" }, [el("div", { class: "oe-row-name", text: "No number" }), el("div", { class: "oe-row-val", text: "The paper offers no figure for this one; switch to All evidence." })]));
      ev.forEach(function (e) {
        list.appendChild(el("div", { class: "oe-row oe-row-ev" }, [
          el("div", { class: "oe-row-name oe-kind-" + e.kind, text: KIND[e.kind] }),
          el("div", { class: "oe-row-val", text: e.text + "." })
        ]));
      });

      // matrix: every question/objective against every evidence kind
      var tbl = el("table", { class: "results-table oe-matrix" });
      var thead = el("thead", {}, [el("tr", {}, [el("th", { text: "" })].concat(["number", "statement", "design"].map(function (k) { return el("th", { text: KIND[k] }); })))]);
      var tbody = el("tbody");
      targets.forEach(function (tt) {
        var tr = el("tr", { class: tt.key === state.focus ? "is-on" : "" }, [el("th", { scope: "row", text: tt.label })]);
        ["number", "statement", "design"].forEach(function (k) {
          var n = P.evidence.filter(function (e) { return e.kind === k && e.links.indexOf(tt.key) >= 0; }).length;
          tr.appendChild(el("td", { text: n ? String(n) : "·" }));
        });
        tbody.appendChild(tr);
      });
      tbl.appendChild(thead);
      tbl.appendChild(tbody);
      grid.innerHTML = "";
      grid.appendChild(tbl);
    }
    root.appendChild(note("The links from each piece of evidence to a question or objective are this page's reading of where the paper places it (the Results section credits the 17.5% and the return comments to engagement, and the survey design to both research questions).", "grad res"));
    draw();
  }

  /* ---------------------------------------------------------------- demo 3: interest, two numbers */

  function mountInterest(root) {
    var chart = el("div", { class: "oe-chart" });
    var check = el("p", { class: "w-big", "aria-live": "polite" });
    var seg = segmented("Denominator after camp", [
      { value: 22, label: "22 who answered" },
      { value: 23, label: "23" },
      { value: 24, label: "24 paired students" }
    ], state.denom, function (v) { state.denom = v; draw(); });

    root.appendChild(note("Interest answers from the 2019 camp, as printed in the companion <em>Education Sciences</em> paper by the same team (n = 24 paired students; 22 interest answers each time). The ASEE paper prints only its two percentages.", ""));
    root.appendChild(chart);
    root.appendChild(el("div", { class: "w-actions" }, [el("span", { class: "w-mono", text: "Share of highly interested campers, out of" }), seg]));
    root.appendChild(check);

    // readings of 17.5%
    var rd = el("div", { class: "oe-rows", "data-levels": "ug grad res" });
    root.appendChild(el("p", { class: "w-mono", "data-levels": "ug grad res", text: "Candidate readings of “a 17.5% increase in interest level” (journal counts, 22 answers each time)" }));
    root.appendChild(rd);
    E.readings(C.pre, C.post).forEach(function (r) {
      var close = Math.abs(r.value - 17.5) < 0.15;
      rd.appendChild(el("div", { class: "oe-row" + (close ? " is-on" : "") }, [
        el("div", { class: "oe-row-name", text: r.label }),
        el("div", { class: "oe-row-val", text: r.value.toFixed(1) + r.unit + (close ? "  · nearest to 17.5" : "") }),
        el("div", { class: "oe-row-how", text: r.how })
      ]));
    });

    // Wilson intervals (graduate and researcher)
    var wi = el("div", { class: "oe-rows", "data-levels": "grad res" });
    root.appendChild(el("p", { class: "w-mono", "data-levels": "grad res", text: "95% Wilson intervals (computed by this page)" }));
    root.appendChild(wi);
    [[7, 22, "High interest before camp"], [15, 22, "High interest after camp, of 22 answers"], [15, 23, "High interest after camp, of 23 (prints as 65%)"], [22, 22, "Moderate or high after camp"]].forEach(function (c) {
      var ci = E.wilson(c[0], c[1]);
      wi.appendChild(el("div", { class: "oe-row" }, [
        el("div", { class: "oe-row-name", text: c[2] }),
        el("div", { class: "oe-row-val", text: c[0] + " of " + c[1] + " = " + pct(100 * c[0] / c[1]) }),
        el("div", { class: "oe-row-how", text: "95% CI " + pct(100 * ci[0]) + " to " + pct(100 * ci[1]) })
      ]));
    });

    // percent versus percentage points (public and high school)
    var calc = el("div", { class: "oe-calc", "data-levels": "public hs" });
    var calcOut = el("p", { class: "w-big", "aria-live": "polite" });
    calc.appendChild(el("p", { class: "w-mono", text: "Percent or percentage points" }));
    calc.appendChild(range("Before camp", 0, 100, 1, state.pre, function (v) { state.pre = v; calcDraw(); }, function (v) { return v + "%"; }));
    calc.appendChild(range("After camp", 0, 100, 1, state.post, function (v) { state.post = v; calcDraw(); }, function (v) { return v + "%"; }));
    calc.appendChild(calcOut);
    root.appendChild(calc);
    function calcDraw() {
      var c = E.percentChange(state.pre, state.post);
      calcOut.textContent = (c.points >= 0 ? "Up " : "Down ") + Math.abs(c.points) + " percentage points, " + (isFinite(c.relative) ? "a " + Math.round(Math.abs(c.relative)) + "% " + (c.relative >= 0 ? "increase" : "decrease") + " relative to where it started." : "and no percent change can be computed from a start of zero.");
    }
    calcDraw();

    function draw() {
      var W = chartWidth(chart);
      var cell = Math.min(18, Math.floor((W - 120) / 26)), g = 3;
      var colors = ["oe-l0", "oe-l1", "oe-l2", "oe-l3"];
      var H = 2 * (cell + 34) + 24;
      var s = svg("svg", { class: "oe-svg", viewBox: "0 0 " + W + " " + H, width: W, height: H, role: "img",
        "aria-label": "Interest before camp: 4 minimal, 11 moderate, 7 high. After camp: 7 moderate, 15 high. Two of 24 paired students have no interest answer." });
      [["Before camp", C.pre], ["After camp", C.post]].forEach(function (row, ri) {
        var y = 18 + ri * (cell + 34);
        s.appendChild(svg("text", { x: 0, y: y - 5, class: "c-label" }, row[0]));
        var x = 0;
        row[1].forEach(function (count, li) {
          for (var k = 0; k < count; k++) {
            var cls = "oe-sq " + colors[li];
            if (ri === 1 && li === 3 && state.denom) cls += " oe-sq-high";
            s.appendChild(svg("rect", { x: x, y: y, width: cell, height: cell, class: cls }));
            x += cell + g;
          }
        });
        // missing answers to 24, and the 23rd slot when that denominator is chosen
        for (var m = 0; m < C.paired - E.sum(row[1]); m++) {
          var dashed = "oe-sq oe-sq-missing";
          if (ri === 1 && state.denom >= 23 + m) dashed += " is-on";
          s.appendChild(svg("rect", { x: x, y: y, width: cell, height: cell, class: dashed }));
          x += cell + g;
        }
        if (ri === 1) {
          var share = 100 * C.post[3] / state.denom;
          s.appendChild(svg("text", { x: Math.min(x + 6, W - 70), y: y + cell - 3, class: "c-label" }, "15 / " + state.denom));
          s.appendChild(svg("text", { x: 0, y: y + cell + 16, class: "c-tick" }, "High interest: " + pct(share) + " of " + state.denom));
        }
      });
      chart.innerHTML = "";
      chart.appendChild(s);

      var share = 100 * C.post[3] / state.denom;
      var m = E.shareMatches(P.outcomes.highPost, state.denom, 0);
      check.textContent = "15 of " + state.denom + " = " + pct(share) + (m.length ? ", which prints as the paper's 65%." : ", which does not print as 65%.");
    }

    var legend = el("div", { class: "c-legend w-mono" });
    C.levels.forEach(function (lv, i) { legend.appendChild(el("span", { class: "lg oe-lg oe-l" + i, text: lv })); });
    legend.appendChild(el("span", { class: "lg oe-lg oe-sq-missing", text: "No answer printed" }));
    root.insertBefore(legend, chart.nextSibling);

    redraws.push(draw);
    draw();
  }

  /* ---------------------------------------------------------------- demo 4: what came next */

  var RELATED = {
    mshs: [{ href: "../integrated-outreach/", text: "Cyber Camp (2018 and 2019 camps)" }, { href: "../virtual-summer-camp/", text: "Camp on Screen (2020 and 2021)" }],
    micro: [{ href: "../cyber-microcredentials/", text: "Beyond Coding (teacher microcredential)" }],
    k8: [{ href: "../wyslice-cs-integration/", text: "WySLICE (K–8 computer science integration)" }],
    mix: [{ href: "../cyber-pd-lesson-plans/", text: "From Workshop to Lesson Plan" }]
  };
  var LENGTH = { week: "Week-long", short: "One to two days", self: "Self-paced credential", varied: "Varied" };

  function mountNext(root) {
    var seg = segmented("Audience", [
      { value: "all", label: "Everything named" },
      { value: "both", label: "Students and teachers" },
      { value: "teachers", label: "Teachers" }
    ], state.who, function (v) { state.who = v; draw(); });
    var count = el("p", { class: "w-big", "aria-live": "polite" });
    var rows = el("div", { class: "oe-rows" });
    root.appendChild(el("div", { class: "w-actions" }, [seg]));
    root.appendChild(count);
    root.appendChild(rows);
    root.appendChild(note("The paper names these programs as outreach the camps helped create. The links point to related interactive pages on this site; the paper itself does not cite them, and linking each item to a page is this site's reading.", "ug grad res"));

    function draw() {
      var list = P.followOn.filter(function (f) { return state.who === "all" || f.who === state.who; });
      count.textContent = list.length + " of " + P.followOn.length + " follow-on programs";
      rows.innerHTML = "";
      list.forEach(function (f) {
        var rel = el("div", { class: "oe-row-how" });
        rel.appendChild(document.createTextNode(LENGTH[f.length] + " · " + (f.who === "both" ? "students and teachers" : "teachers")));
        (RELATED[f.key] || []).forEach(function (r) {
          rel.appendChild(el("br"));
          rel.appendChild(el("a", { href: r.href, text: "Related page: " + r.text }));
        });
        rows.appendChild(el("div", { class: "oe-row oe-row-2" }, [el("div", { class: "oe-row-val", text: f.text + "." }), rel]));
      });
    }
    draw();
  }

  /* ---------------------------------------------------------------- mount */

  function mount(id, fn) {
    var node = document.getElementById(id);
    if (!node) return;
    node.innerHTML = "";
    node.classList.add("w-ready");
    fn(node);
  }

  function start() {
    mount("oe-day", mountDay);
    mount("oe-evidence", mountEvidence);
    mount("oe-interest", mountInterest);
    mount("oe-next", mountNext);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();

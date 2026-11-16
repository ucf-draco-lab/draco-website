/*
  Virtual summer camp widget for /papers/virtual-summer-camp/.
  Mount points in the page: #vc-microbit, #vc-design, #vc-daily, #vc-watch, #vc-parents.

  Demo 1 is the one demo of the camp's content: a Micro:bit night light and plant check
  (projects the paper names; the code is the page's).
  Demo 2 lays out the two virtual years side by side (Sections 1, 3, and 4.2).
  Demo 3 draws Tables 1 and 2: views per activity per day.
  Demo 4 draws Tables 3 and 4: who kept watching, and for how long.
  Demo 5 draws Section 4.3: what parents reported.
  Demos 2 to 4 share one selected year (state.year); demos 3 and 4 share one activity (state.act).
  All arithmetic lives in vc-engine.js; anything marked "page" is the page's own analysis.
*/
(function () {
  "use strict";

  var E = window.VirtualCampEngine;
  var D = E.DATA;
  var SVGNS = "http://www.w3.org/2000/svg";
  var state = { year: 2020, act: 0, metric: "unique", check: false, program: "night", light: 40, soil: 300, lightCut: 60, soilCut: 400 };

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
  var WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
  function words(n) { return n < 10 && n >= 0 && n === Math.round(n) ? WORDS[n] : String(n); }
  function sci(p) {
    if (p >= 0.001) return fix(p, 3);
    var e = Math.floor(Math.log(p) / Math.LN10), m = p / Math.pow(10, e);
    return fix(m, 1) + " × 10<sup>" + String(e).replace("-", "−") + "</sup>";
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

  // Shared year and activity pickers: every copy stays in sync.
  var yearControls = [], actControls = [], shared = [];
  function setYear(v) { state.year = Number(v); yearControls.forEach(function (c) { c.set(state.year); }); shared.forEach(function (fn) { fn(); }); }
  function setAct(v) { state.act = Number(v); actControls.forEach(function (c) { c.set(state.act); }); shared.forEach(function (fn) { fn(); }); }
  function yearControl() {
    var c = segmented("Year", [{ value: 2020, label: "2020" }, { value: 2021, label: "2021" }], state.year, setYear);
    yearControls.push(c); return c;
  }
  function actControl() {
    var c = segmented("Activity", D.activities.map(function (a, j) { return { value: j, label: "A" + (j + 1), title: a }; }), state.act, setAct);
    actControls.push(c); return c;
  }
  function label(text) { return el("span", { class: "w-mono", text: text }); }

  /* --------------------------------------------- demo 1: Micro:bit program */

  // Icons as 5 x 5 masks (row strings).
  var ICONS = {
    on: ["11111", "11111", "11111", "11111", "11111"],
    off: ["00000", "00000", "00000", "00000", "00000"],
    happy: ["00000", "01010", "00000", "10001", "01110"],
    drop: ["00100", "01110", "11111", "11111", "01110"]
  };

  function mountMicrobit(root) {
    var head = el("div", { class: "w-actions" }, [label("Program:"), segmented("Program", [
      { value: "night", label: "Night light" }, { value: "plant", label: "Plant check" }
    ], state.program, function (v) { state.program = v; draw(); })]);
    var board = el("div", { class: "vc-board" });
    var controls = el("div", { class: "vc-sliders" });
    var readout = el("p", { class: "w-big", "aria-live": "polite" });
    var code = el("pre", { class: "vc-code", "data-levels": "ug grad res" });
    var blocks = el("ol", { class: "vc-blocks", "data-levels": "public hs" });
    var note = el("p", { class: "w-note" });
    var src = el("p", { class: "w-source" });
    [head, el("div", { class: "vc-mb-row" }, [board, el("div", { class: "vc-mb-side" }, [controls, readout])]), blocks, code, note, src].forEach(function (n) { root.appendChild(n); });

    function slider(id, text, min, max, key, after) {
      var input = el("input", { type: "range", id: id, min: String(min), max: String(max), step: "1", value: String(state[key]) });
      var val = el("span", { class: "w-mono vc-val" });
      var row = el("label", { class: "vc-slider", for: id }, [el("span", { class: "vc-slabel", text: text }), input, val]);
      function show() { val.textContent = String(state[key]); }
      input.addEventListener("input", function () { state[key] = Number(input.value); show(); after(); });
      show();
      return row;
    }

    function drawBoard(mask) {
      board.innerHTML = "";
      var s = svg("svg", { viewBox: "0 0 150 150", class: "vc-mb", role: "img", "aria-label": "Micro:bit LED display" });
      s.appendChild(svg("rect", { x: 1, y: 1, width: 148, height: 148, class: "vc-mb-face" }));
      for (var r = 0; r < 5; r++) for (var c = 0; c < 5; c++) {
        var on = mask[r].charAt(c) === "1";
        s.appendChild(svg("rect", { x: 17 + c * 25, y: 17 + r * 25, width: 16, height: 16, class: on ? "vc-led is-on" : "vc-led" }));
      }
      board.appendChild(s);
    }

    function draw() {
      controls.innerHTML = "";
      var mask, line, js, steps;
      if (state.program === "night") {
        controls.appendChild(slider("vc-light", "Room light level (0 to 255)", 0, 255, "light", draw2));
        controls.appendChild(slider("vc-lcut", "Turn on below", 0, 255, "lightCut", draw2));
      } else {
        controls.appendChild(slider("vc-soil", "Soil reading on pin 0 (0 to 1023)", 0, 1023, "soil", draw2));
        controls.appendChild(slider("vc-scut", "Water when below", 0, 1023, "soilCut", draw2));
      }
      draw2();
      function draw2() {
        if (state.program === "night") {
          var dark = state.light < state.lightCut;
          mask = dark ? ICONS.on : ICONS.off;
          line = dark ? "The room reads <strong>" + state.light + "</strong>, below " + state.lightCut + ": every light turns on." :
            "The room reads <strong>" + state.light + "</strong>, at or above " + state.lightCut + ": the lights stay off.";
          steps = ["forever", "if light level < " + state.lightCut + " then show all 25 lights", "else clear the screen"];
          js = "basic.forever(function () {\n    if (input.lightLevel() < " + state.lightCut + ") {\n        basic.showLeds(`\n        # # # # #\n        # # # # #\n        # # # # #\n        # # # # #\n        # # # # #\n        `)\n    } else {\n        basic.clearScreen()\n    }\n})";
        } else {
          var dry = state.soil < state.soilCut;
          mask = dry ? ICONS.drop : ICONS.happy;
          line = dry ? "The soil reads <strong>" + state.soil + "</strong>, below " + state.soilCut + ": the board asks for water." :
            "The soil reads <strong>" + state.soil + "</strong>, at or above " + state.soilCut + ": the plant has enough.";
          steps = ["forever", "read pin 0 (the moisture sensor)", "if the reading < " + state.soilCut + " then show a drop, else show a smile"];
          js = "basic.forever(function () {\n    let soil = pins.analogReadPin(AnalogPin.P0)\n    if (soil < " + state.soilCut + ") {\n        basic.showLeds(`\n        . . # . .\n        . # # # .\n        # # # # #\n        # # # # #\n        . # # # .\n        `)\n    } else {\n        basic.showIcon(IconNames.Happy)\n    }\n})";
        }
        drawBoard(mask);
        readout.innerHTML = line;
        blocks.innerHTML = "";
        steps.forEach(function (s) { blocks.appendChild(el("li", { text: s })); });
        code.textContent = js;
      }
      note.innerHTML = state.program === "night" ?
        "One of the course developers built lessons around fun, visual examples, a light-sensitive night light among them. The Micro:bit measures light with its own 25 lights and reports 0 (dark) to 255 (bright)." :
        "The 2020 course ended with a plant-watering program that reads a moisture sensor. A Micro:bit pin reads a sensor's voltage as 0 to 1023.";
      src.textContent = "Projects named in the paper (Sections 4.1 and 4.2); the paper does not print their code, so this program and its thresholds are the page's.";
    }
    draw();
  }

  /* -------------------------------------------- demo 2: two virtual years */

  function mountDesign(root) {
    var head = el("div", { class: "w-actions" }, [label("Highlight:"), yearControl()]);
    var wrap = el("div", { class: "vc-table-scroll" });
    var src = el("p", { class: "w-source", text: "Paper, Sections 1.1, 3.2, 4.1, 4.2, and 4.3, and Table 4" });
    [head, wrap, src].forEach(function (n) { root.appendChild(n); });
    var s20 = E.summary(2020), s21 = E.summary(2021);
    var rows = [
      ["Camp", "The Artful Craft of Science (TACoS), University of Wyoming; one week, up to 80 rising 5th and 6th graders, four experiences (computer science among them)", null, ""],
      ["Delivery", "Videos on YouTube, a course website, and materials mailed home", "Same, with new website modules and new hardware", ""],
      ["Videos", "Five, one per camp day", "Five, one per camp day", ""],
      ["Total length", E.clock(s20.totalLengthSec, true), E.clock(s21.totalLengthSec, true), ""],
      ["Shortest to longest", "9:14 to 20:05", "11:59 to 24:13", "ug grad res"],
      ["Content developers", "One", "Three, one camp day each", ""],
      ["Videos changed", "First virtual year", "Animations, demonstrations, step-by-step guides, pause points, background music, and a roadmap", ""],
      ["Content available", "Camp week (14 days of data)", "About a month (49 days of data)", ""],
      ["Parent evaluations", "24", "13", ""],
      ["Data", "YouTube analytics per video: views per day, unique viewers, average view duration, retention, watch time", null, "ug grad res"],
      ["Research questions", "How does video quality affect participation and engagement? How does the time content stays available affect engagement?", null, "ug grad res"]
    ];
    function draw() {
      wrap.innerHTML = "";
      var t = el("table", { class: "vc-table" });
      var hr = el("tr", {}, [el("th", { text: "" }), el("th", { text: "2020", class: state.year === 2020 ? "is-on" : "" }), el("th", { text: "2021", class: state.year === 2021 ? "is-on" : "" })]);
      t.appendChild(el("thead", {}, [hr]));
      var tb = el("tbody");
      rows.forEach(function (r) {
        var tr = el("tr", r[3] ? { "data-levels": r[3] } : {});
        tr.appendChild(el("td", { text: r[0] }));
        if (r[2] === null) tr.appendChild(el("td", { colspan: "2", text: r[1] }));
        else {
          tr.appendChild(el("td", { text: r[1], class: state.year === 2020 ? "is-on" : "" }));
          tr.appendChild(el("td", { text: r[2], class: state.year === 2021 ? "is-on" : "" }));
        }
        tb.appendChild(tr);
      });
      t.appendChild(tb);
      wrap.appendChild(t);
    }
    shared.push(draw);
    draw();
  }

  /* --------------------------------------------------- demo 3: day by day */

  function mountDaily(root) {
    var head = el("div", { class: "w-actions" }, [label("Year:"), yearControl(), label("Activity:"), actControl()]);
    var chart = el("div", { class: "vc-chart" });
    var readout = el("p", { class: "w-big", "aria-live": "polite" });
    var check = el("p", { class: "w-note", "data-levels": "ug grad res" });
    var src = el("p", { class: "w-source" });
    [head, readout, chart, check, src].forEach(function (n) { root.appendChild(n); });

    function draw() {
      var y = state.year, rows = E.dailyRows(y), j = state.act;
      var W = chartWidth(chart), padL = 92, padR = 10, padT = 22, rowH = 19;
      var colW = (W - padL - padR) / 5, H = padT + rows.length * rowH + 6;
      var max = 0;
      rows.forEach(function (r) { r.views.forEach(function (v) { if (!r.tail && v > max) max = v; }); });
      var s = svg("svg", { viewBox: "0 0 " + W + " " + H, width: W, height: H, class: "vc-svg", role: "img",
        "aria-label": "Views per day for each of the five " + y + " activities" });
      D.activities.forEach(function (a, c) {
        var t = svg("text", { x: padL + colW * c + colW / 2, y: 14, class: c === j ? "c-label vc-on" : "c-label", "text-anchor": "middle" }, "A" + (c + 1));
        s.appendChild(t);
      });
      rows.forEach(function (r, i) {
        var yy = padT + i * rowH;
        var lab = r.tail ? "days " + r.index : r.date.slice(5) + " " + E.weekday(r.date);
        s.appendChild(svg("text", { x: padL - 6, y: yy + 13, class: "c-tick", "text-anchor": "end" }, lab));
        r.views.forEach(function (v, c) {
          var x = padL + colW * c;
          var op = r.tail ? 0 : (max ? v / max : 0);
          var g = svg("g", { class: "vc-cell" + (c === j ? " is-on" : ""), tabindex: "0", role: "button", "aria-label": D.activities[c] + ", " + lab + ": " + v + " views" });
          g.appendChild(svg("rect", { x: x + 1, y: yy + 1, width: colW - 2, height: rowH - 2, class: r.tail ? "vc-tail" : "vc-heat-bg" }));
          if (!r.tail && v > 0) g.appendChild(svg("rect", { x: x + 1, y: yy + 1, width: colW - 2, height: rowH - 2, class: "vc-heat", "fill-opacity": String(0.15 + 0.85 * op) }));
          g.appendChild(svg("text", { x: x + colW / 2, y: yy + 13, class: op > 0.55 ? "vc-inheat" : "vc-cellval", "text-anchor": "middle" }, v === 0 ? "·" : String(v)));
          g.addEventListener("click", function () { setAct(c); });
          g.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setAct(c); } });
          s.appendChild(g);
        });
      });
      chart.innerHTML = "";
      chart.appendChild(s);

      // Readout for the selected activity.
      var col = rows.map(function (r) { return r.tail ? 0 : r.views[j]; });
      var peak = Math.max.apply(null, col), at = col.indexOf(peak), total = E.sum(rows.map(function (r) { return r.views[j]; }));
      var Y = D.years[y], first7 = E.sum(rows.slice(0, 8).map(function (r) { return r.views[j]; }));
      var txt = "Activity " + (j + 1) + " in " + y + ": <strong>" + words(total) + "</strong> views in all; its busiest day was " +
        rows[at].date.slice(5) + " (" + E.weekday(rows[at].date) + ") with <strong>" + words(peak) + "</strong>.";
      if (y === 2021) txt += " After the first two weeks it drew <strong>" + Y.tail.views[j] + "</strong> more over 35 days, about " + fix(Y.tail.views[j] / 35, 1) + " a day.";
      else txt += " By the end of camp week (Sunday " + rows[7].date.slice(5) + "), " + words(first7) + " of those views had happened.";
      readout.innerHTML = txt;
      var cs = E.columnSums(y);
      check.innerHTML = "Check (page): each column of Table " + (y === 2020 ? "1" : "2") + " sums to Table 4's total views for that video (" +
        cs.join(", ") + "), all five match." + (y === 2021 ? " The last printed row reads \"14 - 48 45 30 33 31 28\"; the sums show it is days 14 to 48 followed by one total per activity (45, 30, 33, 31, and 28)." : "");
      src.textContent = "Paper, Table " + (y === 2020 ? "1 · 14 days, 2020-07-19 to 2020-08-01" : "2 · 49 days, 2021-07-04 to 2021-08-21; days 14 to 48 printed as one row") + " · YouTube views of each video";
    }
    shared.push(draw);
    redraws.push(draw);
    draw();
  }

  /* --------------------------------------------- demo 4: who kept watching */

  var METRICS = [
    { value: "unique", label: "Viewers", title: "Unique views (Table 4)" },
    { value: "views", label: "Views", title: "Total views (Table 4)" },
    { value: "duration", label: "Minutes watched", title: "Average view duration against video length (Table 4)" },
    { value: "retention", label: "Retention", title: "Average retention (Table 3)" },
    { value: "watch", label: "Watch time", title: "Lifetime watch time in hours (Table 4)" },
    { value: "vpv", label: "Views per viewer", title: "Average views per viewer (Table 4)", levels: "ug grad res" }
  ];

  function mountWatch(root) {
    var head = el("div", { class: "w-actions" }, [label("Show:"), segmented("Measure", METRICS, state.metric, function (v) { state.metric = v; draw(); })]);
    var head2 = el("div", { class: "w-actions" }, [label("Activity:"), actControl()]);
    var chart = el("div", { class: "vc-chart" });
    var legend = el("div", { class: "c-legend" });
    var readout = el("p", { class: "w-big", "aria-live": "polite" });
    var checkBtn = el("button", { type: "button", class: "w-btn", "data-levels": "ug grad res", text: "Check Table 4's arithmetic" });
    var checkWrap = el("div", { class: "vc-table-scroll", "data-levels": "ug grad res" });
    var src = el("p", { class: "w-source" });
    [head, head2, readout, chart, legend, el("div", { class: "w-actions" }, [checkBtn]), checkWrap, src].forEach(function (n) { root.appendChild(n); });
    checkBtn.addEventListener("click", function () { state.check = !state.check; draw(); });

    function value(a, m) {
      if (m === "unique") return a.unique;
      if (m === "views") return a.views;
      if (m === "duration") return a.durationSec / 60;
      if (m === "retention") return a.retention;
      if (m === "watch") return a.watchHours;
      return a.vpvPrinted;
    }
    function show(v, m) {
      if (m === "duration") return E.clock(v * 60);
      if (m === "retention") return pct(v, 1);
      if (m === "watch") return fix(v, 1) + " h";
      if (m === "vpv") return fix(v, 2);
      return String(v);
    }

    function draw() {
      var m = state.metric, A = { 2020: E.perActivity(2020), 2021: E.perActivity(2021) }, j = state.act;
      var W = chartWidth(chart), padL = 40, padR = 10, padT = 14, padB = 36, H = 250;
      var plotW = W - padL - padR, plotH = H - padT - padB, groupW = plotW / 5, barW = Math.min(30, groupW * 0.32);
      var max = 0;
      [2020, 2021].forEach(function (y) { A[y].forEach(function (a) { max = Math.max(max, value(a, m), m === "duration" ? a.lengthSec / 60 : 0); }); });
      if (m === "retention") max = Math.max(max, 100);
      var nice = m === "retention" ? 100 : m === "duration" ? Math.ceil(max / 5) * 5 : m === "vpv" ? 2.5 : m === "watch" ? Math.ceil(max / 2) * 2 : Math.ceil(max / 20) * 20;
      var yS = function (v) { return padT + plotH - plotH * v / nice; };
      var s = svg("svg", { viewBox: "0 0 " + W + " " + H, width: W, height: H, class: "vc-svg", role: "img", "aria-label": METRICS.filter(function (x) { return x.value === m; })[0].title + ", 2020 and 2021" });
      for (var k = 0; k <= 4; k++) {
        var v = nice * k / 4, yy = yS(v);
        s.appendChild(svg("line", { x1: padL, x2: W - padR, y1: yy, y2: yy, class: "c-grid" }));
        s.appendChild(svg("text", { x: padL - 5, y: yy + 4, class: "c-tick", "text-anchor": "end" }, m === "retention" ? fix(v, 0) + "%" : m === "vpv" ? fix(v, 1) : fix(v, v % 1 ? 1 : 0)));
      }
      if (m === "retention") {
        var ty = yS(D.retentionTarget);
        s.appendChild(svg("line", { x1: padL, x2: W - padR, y1: ty, y2: ty, class: "vc-target" }));
        s.appendChild(svg("text", { x: W - padR, y: ty - 4, class: "c-label", "text-anchor": "end" }, "authors' 50% target"));
      }
      D.activities.forEach(function (name, c) {
        var gx = padL + groupW * c + groupW / 2;
        var g = svg("g", { class: "vc-col" + (c === j ? " is-on" : ""), tabindex: "0", role: "button", "aria-label": name });
        g.appendChild(svg("rect", { x: padL + groupW * c + 2, y: padT, width: groupW - 4, height: plotH, class: "vc-hit" }));
        [2020, 2021].forEach(function (y, side) {
          var a = A[y][c], x = gx + (side ? 3 : -3 - barW), val = value(a, m);
          if (m === "duration") {
            var lt = yS(a.lengthSec / 60);
            g.appendChild(svg("rect", { x: x, y: lt, width: barW, height: padT + plotH - lt, class: "vc-length" }));
          }
          var top = yS(val);
          g.appendChild(svg("rect", { x: x, y: top, width: barW, height: padT + plotH - top, class: side ? "vc-y21" : "vc-y20" }));
          if (c === j || W > 520) g.appendChild(svg("text", { x: x + barW / 2, y: (m === "duration" ? yS(a.lengthSec / 60) : top) - 4, class: "vc-val", "text-anchor": "middle" },
            m === "duration" ? E.clock(a.durationSec) : show(val, m)));
        });
        g.appendChild(svg("text", { x: gx, y: H - padB + 16, class: c === j ? "c-label vc-on" : "c-label", "text-anchor": "middle" }, "A" + (c + 1)));
        g.addEventListener("click", function () { setAct(c); });
        g.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setAct(c); } });
        s.appendChild(g);
      });
      chart.innerHTML = "";
      chart.appendChild(s);

      legend.innerHTML = "";
      legend.appendChild(el("span", { class: "vc-lg" }, [el("span", { class: "vc-sw vc-y20" }), "2020"]));
      legend.appendChild(el("span", { class: "vc-lg" }, [el("span", { class: "vc-sw vc-y21" }), "2021"]));
      if (m === "duration") legend.appendChild(el("span", { class: "vc-lg" }, [el("span", { class: "vc-sw vc-length" }), "full video length"]));

      var a0 = A[2020][j], a1 = A[2021][j], T = E.textChecks(), txt;
      if (m === "unique") {
        txt = "In 2020, <strong>" + A[2020][0].unique + "</strong> viewers started Activity 1 and <strong>" + words(A[2020][4].unique) + "</strong> reached Activity 5. In 2021: <strong>" +
          A[2021][0].unique + "</strong> and <strong>" + A[2021][4].unique + "</strong>, five times as many at the end. Activity " + (j + 1) + ": " + words(a0.unique) + " in 2020, " + words(a1.unique) + " in 2021.";
      } else if (m === "views") {
        txt = "Activity " + (j + 1) + " drew <strong>" + words(a0.views) + "</strong> views in 2020 and <strong>" + words(a1.views) + "</strong> in 2021. Totals: " +
          E.summary(2020).totalViews + " in 2020 and " + E.summary(2021).totalViews + " in 2021. A view counts once someone watches 30 seconds.";
      } else if (m === "duration") {
        txt = "The average view of Activity " + (j + 1) + " lasted <strong>" + E.clock(a0.durationSec) + "</strong> of " + E.clock(a0.lengthSec) + " in 2020 and <strong>" +
          E.clock(a1.durationSec) + "</strong> of " + E.clock(a1.lengthSec) + " in 2021. The authors note the average view lasted about ten minutes or less in both years, however long the video.";
      } else if (m === "retention") {
        txt = "Average retention for Activity " + (j + 1) + ": <strong>" + pct(a0.retention, 2) + "</strong> in 2020 and <strong>" + pct(a1.retention, 2) +
          "</strong> in 2021. Across the five videos the 2020 values spread from 36.83 to 82.94 percent (SD 19.98); 2021 stayed between 43.04 and 52.64 (SD 3.35).";
      } else if (m === "watch") {
        txt = "Watch time fell <strong>" + fix(T.watchDrop2020, 1) + "%</strong> from Activity 1 to Activity 5 in 2020 and <strong>" + fix(T.watchDrop2021, 1) +
          "%</strong> in 2021. Total: " + fix(E.summary(2020).totalWatch, 1) + " hours in 2020, " + fix(D.years[2021].printed.totalWatch, 1) + " in 2021.";
      } else {
        txt = "Each 2020 viewer of Activity " + (j + 1) + " played it <strong>" + fix(a0.vpvPrinted, 2) + "</strong> times on average; in 2021, <strong>" + fix(a1.vpvPrinted, 2) + "</strong>.";
      }
      readout.innerHTML = txt;

      checkBtn.textContent = state.check ? "Hide the check" : "Check Table 4's arithmetic";
      checkWrap.innerHTML = "";
      if (state.check) {
        var t = el("table", { class: "vc-table" });
        t.appendChild(el("caption", { class: "w-note", text: "Computed by the page from Table 4's own columns, for the year selected above. Views per viewer = total views ÷ unique views; watch time = views × average view duration (durations are printed to the second)." }));
        t.appendChild(el("thead", {}, [el("tr", {}, ["Video", "Views ÷ viewers", "Printed", "Views × duration", "Printed", "Duration ÷ length", "Printed retention"].map(function (h) { return el("th", { text: h }); }))]));
        var tb = el("tbody");
        A[state.year].forEach(function (a, c) {
          var vpvOk = Math.abs(a.vpvComputed - a.vpvPrinted) < 5e-5;
          var tr = el("tr", { class: c === j ? "is-on" : "" }, [
            el("td", { text: a.name }),
            el("td", { text: a.views + "/" + a.unique + " = " + fix(a.vpvComputed, 4) }),
            el("td", { text: fix(a.vpvPrinted, 4) + (vpvOk ? " ✓" : " ≠"), class: vpvOk ? "" : "vc-diff" }),
            el("td", { text: fix(a.watchFromDuration, 2) + " h" }),
            el("td", { text: fix(a.watchHours, 4) + " h ✓" }),
            el("td", { text: pct(a.durationShare, 1) }),
            el("td", { text: pct(a.retention, 2) })
          ]);
          tb.appendChild(tr);
        });
        t.appendChild(tb);
        checkWrap.appendChild(t);
        checkWrap.appendChild(el("p", { class: "w-note", html: state.year === 2021 ?
          "2021 Activity 4 prints 2.1364 views per viewer, which is 47 ÷ 22; its unique views print as 23 (47 ÷ 23 = 2.0435). Every other row matches. Retention is YouTube's average of the retention curve and need not equal duration ÷ length (see the researcher notes)." :
          "All five 2020 rows match. Watch time matches views × duration once each duration is taken as cut to the second (for example, 10.2988 h ÷ 127 views = 4 min 51.9 s, printed 04:51). Retention is YouTube's average of the retention curve and need not equal duration ÷ length." }));
      }
      src.textContent = "Paper, Tables 3 and 4 · five YouTube videos per year, 2020 data over 14 days and 2021 over 49";
    }
    shared.push(draw);
    redraws.push(draw);
    draw();
  }

  /* ------------------------------------------------- demo 5: parents */

  function mountParents(root) {
    var chart = el("div", { class: "vc-chart" });
    var readout = el("p", { class: "w-big" });
    var stats = el("div", { "data-levels": "grad res" });
    var qs = el("details", { class: "vc-details" });
    var src = el("p", { class: "w-source", text: "Paper, Section 4.3 · 24 parent evaluations in 2020 and 13 in 2021 (37 in all, 46 percent)" });
    [readout, chart, stats, qs, src].forEach(function (n) { root.appendChild(n); });

    qs.appendChild(el("summary", { text: "The parent survey's questions" }));
    var ol = el("ol", { class: "vc-steps" });
    ["Which sessions did your student attempt but not finish?", "Which sessions did your student finish completely and make a finished product?",
      "I saw my student enjoying the activities at home (yes, sometimes, no).", "Rank the four experiences by how much time you spent helping (first to fourth).",
      "Are you planning to work on the camp's labs at home in the future?", "What suggestions do you have if the camp is held online again?", "Anything else you would like us to know?"
    ].forEach(function (q) { ol.appendChild(el("li", { text: q })); });
    qs.appendChild(ol);
    qs.appendChild(el("p", { class: "w-note", text: "The paper reports counts only for the computer science completion questions." }));

    function draw() {
      var c20 = E.completion(2020), c21 = E.completion(2021);
      var W = chartWidth(chart), padL = 56, padR = 60, rowH = 44, H = 2 * rowH + 34;
      var plotW = W - padL - padR, x = function (v) { return padL + plotW * v / 100; };
      var s = svg("svg", { viewBox: "0 0 " + W + " " + H, width: W, height: H, class: "vc-svg", role: "img", "aria-label": "Share of parent evaluations reporting the computer science sessions finished" });
      [0, 25, 50, 75, 100].forEach(function (v) {
        s.appendChild(svg("line", { x1: x(v), x2: x(v), y1: 6, y2: H - 22, class: "c-grid" }));
        s.appendChild(svg("text", { x: x(v), y: H - 6, class: "c-tick", "text-anchor": "middle" }, v + "%"));
      });
      [c20, c21].forEach(function (c, i) {
        var yy = 12 + i * rowH, bh = 22;
        s.appendChild(svg("text", { x: padL - 8, y: yy + 15, class: "c-label", "text-anchor": "end" }, i ? "2021" : "2020"));
        s.appendChild(svg("rect", { x: x(0), y: yy, width: x(100) - x(0), height: bh, class: "vc-track" }));
        s.appendChild(svg("rect", { x: x(0), y: yy, width: x(c.share) - x(0), height: bh, class: i ? "vc-y21" : "vc-y20" }));
        s.appendChild(svg("text", { x: x(100) + 6, y: yy + 15, class: "vc-val" }, c.finished + " of " + c.surveys));
        var ci = svg("g", { "data-levels": "grad res" });
        ci.appendChild(svg("line", { x1: x(100 * c.wilson[0]), x2: x(100 * c.wilson[1]), y1: yy + bh + 6, y2: yy + bh + 6, class: "vc-ci" }));
        ci.appendChild(svg("line", { x1: x(100 * c.wilson[0]), x2: x(100 * c.wilson[0]), y1: yy + bh + 2, y2: yy + bh + 10, class: "vc-ci" }));
        ci.appendChild(svg("line", { x1: x(100 * c.wilson[1]), x2: x(100 * c.wilson[1]), y1: yy + bh + 2, y2: yy + bh + 10, class: "vc-ci" }));
        s.appendChild(ci);
      });
      chart.innerHTML = "";
      chart.appendChild(s);
      readout.innerHTML = "Parents reported the computer science sessions finished in <strong>" + c20.finished + " of " + c20.surveys +
        "</strong> evaluations in 2020 (the paper prints 66 percent) and <strong>" + words(c21.finished) + " of " + c21.surveys + "</strong> in 2021 (54 percent). In 2020, " +
        words(c20.notFinished) + " said a child started but did not finish and " + words(c20.noCS) + " did not try it; in 2021, " + words(c21.notFinished) + " did not finish.";
      var test = E.completionTest();
      stats.innerHTML = "";
      stats.appendChild(el("p", { class: "w-note", html: "Computed by the page: 95 percent Wilson intervals (the bars under each row) run from " +
        pct(100 * c20.wilson[0], 0) + " to " + pct(100 * c20.wilson[1], 0) + " in 2020 and " + pct(100 * c21.wilson[0], 0) + " to " + pct(100 * c21.wilson[1], 0) +
        " in 2021. A two-sided Fisher exact test of 16 of 24 against seven of 13 gives p = " + sci(test.p) + ". With 37 evaluations, the two years cannot be told apart on this measure. The paper reports no test." }));
    }
    redraws.push(draw);
    draw();
  }

  /* ---------------------------------------------------------------- mount */

  var mounts = { "vc-microbit": mountMicrobit, "vc-design": mountDesign, "vc-daily": mountDaily, "vc-watch": mountWatch, "vc-parents": mountParents };
  function start() {
    Object.keys(mounts).forEach(function (id) {
      var node = document.getElementById(id);
      if (!node) return;
      mounts[id](node);
      node.classList.add("w-ready");
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();

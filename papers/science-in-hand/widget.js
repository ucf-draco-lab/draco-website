/*
  Science in Hand widget for /papers/science-in-hand/.
  Mount points in the page: #sh-lessons, #sh-mixing, #sh-coffee, #sh-results.

  Demo 1 lays out the two lessons the partnership built, with their ACS links
    (application, career, societal impact) and steps, from the paper's text.
  Demo 2 runs a model of the "Molecule Mixing" activity (the page's model, not data).
  Demo 3 puts Table 1's four heat/work questions in front of the reader, with the
    12 chemistry students' pre- and post-test results.
  Demo 4 draws the paper's results: Table 1 totals, the stated gains, and (undergraduate
    and up) what the 17 percent aggregate implies for the biology classes.
  Demos 1 and 4 share the selected lesson (state.lesson); demos 3 and 4 share the
  selected question (state.prong). Arithmetic lives in sh-engine.js.
*/
(function () {
  "use strict";

  var E = window.ScienceInHandEngine;
  var D = E.DATA;
  var SVGNS = "http://www.w3.org/2000/svg";
  var state = { lesson: 0, prong: 3, chemGain: null };
  var T1 = E.twelfths();
  var TOT = E.table1Totals();

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
  var WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
  function words(n) { return n < 10 ? WORDS[n] : String(n); }

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

  // Shared pickers.
  var lessonControls = [], lessonDraws = [];
  function setLesson(v) {
    state.lesson = Number(v);
    lessonControls.forEach(function (c) { c.set(state.lesson); });
    lessonDraws.forEach(function (fn) { fn(); });
  }
  var prongControls = [], prongDraws = [];
  function setProng(v) {
    state.prong = Number(v);
    prongControls.forEach(function (c) { c.set(state.prong); });
    prongDraws.forEach(function (fn) { fn(); });
  }
  function prongControl() {
    var c = segmented("Question", D.table1.map(function (r, i) {
      return { value: i, label: r.prong, title: r.short };
    }), state.prong, setProng);
    prongControls.push(c);
    return c;
  }

  /* -------------------------------------------- demo 1: two lessons */

  function mountLessons(root) {
    var c = segmented("Lesson", D.lessons.map(function (l, i) { return { value: i, label: l.name }; }), state.lesson, setLesson);
    lessonControls.push(c);
    var rows = el("div", { class: "sh-table-scroll" });
    var steps = el("ol", { class: "sh-steps" });
    var src = el("p", { class: "w-source" });
    root.appendChild(el("div", { class: "w-actions" }, [el("span", { class: "w-mono", text: "Lesson:" }), c]));
    root.appendChild(rows);
    root.appendChild(el("p", { class: "w-mono sh-steps-head", text: "How the lesson ran" }));
    root.appendChild(steps);
    root.appendChild(src);

    function draw() {
      var l = D.lessons[state.lesson];
      var t = el("table", { class: "sh-table" });
      var body = el("tbody");
      [
        ["Class", l.course + " · " + words(l.classes) + " class" + (l.classes > 1 ? "es" : "") + " · " + l.n + " students", "all"],
        ["Hands-on object", l.tool, "all"],
        ["A · Application", l.A, "all"],
        ["C · Career", l.C, "all"],
        ["S · Societal impact", l.S, "all"],
        ["Assessment", "Open-response questions at the start and end of class, scored correct, partial, or incorrect; informal interviews during class", "ug grad res"],
        ["Partnership", "An NSF Project STEP Fellow (an engineering graduate student) teaching with the classroom teacher, with university education faculty", "ug grad res"]
      ].forEach(function (r) {
        var tr = el("tr", r[2] === "all" ? null : { "data-levels": r[2] }, [el("th", { scope: "row", text: r[0] }), el("td", { text: r[1] })]);
        body.appendChild(tr);
      });
      t.appendChild(body);
      rows.innerHTML = "";
      rows.appendChild(t);
      steps.innerHTML = "";
      l.steps.forEach(function (s) { steps.appendChild(el("li", { text: s })); });
      src.textContent = "Paper, Methodology, Discussion, and Conclusions · one high school, 2008–2009 school year";
    }
    lessonDraws.push(draw);
    draw();
  }

  /* ----------------------------------------- demo 2: Molecule Mixing */

  // Dye colors are physical colors of the activity (blue, yellow, and the green they make),
  // so they are fixed; everything else uses the site theme.
  var BLUE = [37, 99, 235], GREEN = [22, 163, 74], YELLOW = [234, 179, 8];
  function lerp(a, b, t) { return [0, 1, 2].map(function (i) { return Math.round(a[i] + (b[i] - a[i]) * t); }); }
  function beakerColor(q, n) {
    var s = q.blue + q.yellow;
    if (s < 1e-9) return null;
    var f = q.yellow / s;
    var rgb = f < 0.5 ? lerp(BLUE, GREEN, f / 0.5) : lerp(GREEN, YELLOW, (f - 0.5) / 0.5);
    var alpha = Math.min(1, Math.sqrt(s * n / 2));
    return { rgb: "rgb(" + rgb.join(",") + ")", alpha: alpha };
  }

  function mountMixing(root) {
    var cfg = { n: 22, mix: 1, seed: 7 };
    var m = null, running = false, raf = null, lastT = 0, history = [], frozen = false, guessed = null;
    var room = el("div", { class: "sh-room" });
    var startBtn = el("button", { type: "button", class: "w-btn", text: "Start walking" });
    var freezeBtn = el("button", { type: "button", class: "w-btn sh-ghost", text: "Call freeze" });
    var resetBtn = el("button", { type: "button", class: "w-btn sh-ghost", text: "Reset" });
    var sizeSeg = segmented("Class size", [{ value: 12, label: "12" }, { value: 22, label: "22" }, { value: 30, label: "30" }], cfg.n, function (v) { cfg.n = Number(v); reset(); });
    var mixSeg = segmented("Pour", [{ value: 1, label: "Full swap" }, { value: 0.5, label: "Half" }, { value: 0.25, label: "Splash" }], cfg.mix, function (v) { cfg.mix = Number(v); reset(); });
    var guessWrap = el("div", { class: "w-actions sh-guess", hidden: "hidden" });
    var readout = el("p", { class: "w-big" });
    var chart = el("div", { class: "sh-chart" });
    var note = el("p", { class: "w-note" });
    var src = el("p", { class: "w-source", text: "Page's model of the activity in the paper's Discussion · simulated students, seeded so a run repeats · not classroom data" });

    root.appendChild(el("div", { class: "w-actions" }, [startBtn, freezeBtn, resetBtn]));
    root.appendChild(el("div", { class: "w-actions" }, [el("span", { class: "w-mono", text: "Students:" }), sizeSeg,
      el("span", { class: "w-mono", "data-levels": "ug grad res", text: "Each meeting:" }), (function () { mixSeg.setAttribute("data-levels", "ug grad res"); return mixSeg; })()]));
    root.appendChild(room);
    root.appendChild(guessWrap);
    root.appendChild(readout);
    root.appendChild(chart);
    root.appendChild(note);
    root.appendChild(src);

    function reset() {
      stop();
      m = new E.Mixer({ n: cfg.n, mix: cfg.mix, seed: cfg.seed });
      history = [{ t: 0, s: 1, meet: 0 }];
      frozen = false; guessed = null;
      guessWrap.setAttribute("hidden", "hidden");
      startBtn.textContent = "Start walking";
      drawRoom(); drawChart(); drawReadout();
    }
    function stop() { running = false; if (raf) cancelAnimationFrame(raf); raf = null; }
    function loop(ts) {
      if (!running) return;
      var dt = Math.min(0.1, (ts - lastT) / 1000) || 0.016;
      lastT = ts;
      var sub = Math.max(1, Math.round(dt * 4 / 0.05));   // four model seconds per real second
      for (var i = 0; i < sub; i++) m.step(0.05);
      var last = history[history.length - 1];
      if (m.t - last.t >= 0.5) history.push({ t: m.t, s: m.spread(), meet: m.meetings });
      drawRoom(); drawReadout();
      drawChart();
      if (m.t > 240) { stop(); startBtn.textContent = "Keep walking"; drawChart(); return; }
      raf = requestAnimationFrame(loop);
    }
    startBtn.addEventListener("click", function () {
      if (running) { stop(); startBtn.textContent = "Keep walking"; drawChart(); return; }
      if (m.t > 240) m.t = 240;
      frozen = false; guessWrap.setAttribute("hidden", "hidden");
      running = true; startBtn.textContent = "Pause";
      lastT = performance.now();
      raf = requestAnimationFrame(loop);
    });
    freezeBtn.addEventListener("click", function () {
      stop(); startBtn.textContent = "Keep walking"; frozen = true; guessed = null;
      drawGuess(); drawChart(); drawReadout();
    });
    resetBtn.addEventListener("click", reset);

    function drawGuess() {
      guessWrap.innerHTML = "";
      guessWrap.removeAttribute("hidden");
      guessWrap.appendChild(el("span", { class: "w-mono", text: "Freeze. What color will every beaker be at the end?" }));
      ["Blue", "Yellow", "Green", "Clear", "Stripes of each"].forEach(function (g) {
        var b = el("button", { type: "button", class: "seg-option sh-choice", text: g, "aria-pressed": guessed === g ? "true" : "false" });
        b.addEventListener("click", function () { guessed = g; drawGuess(); drawReadout(); });
        guessWrap.appendChild(b);
      });
    }

    function drawRoom() {
      var W = chartWidth(room), H = Math.round(W * m.h / m.w);
      var sx = W / m.w;
      var s = svg("svg", { viewBox: "0 0 " + W + " " + H, class: "sh-svg", role: "img", "aria-label": "A room of students carrying beakers" });
      s.appendChild(svg("rect", { x: 0.5, y: 0.5, width: W - 1, height: H - 1, class: "sh-floor" }));
      var rad = Math.max(6, m.r * sx * 0.9);
      m.p.forEach(function (q) {
        var g = svg("g");
        if (m.t - q.flash < 0.6) g.appendChild(svg("circle", { cx: q.x * sx, cy: q.y * sx, r: rad + 4, class: "sh-pour" }));
        g.appendChild(svg("circle", { cx: q.x * sx, cy: q.y * sx, r: rad, class: "sh-beaker" }));
        var c = beakerColor(q, m.n);
        if (c) g.appendChild(svg("circle", { cx: q.x * sx, cy: q.y * sx, r: rad - 2, fill: c.rgb, "fill-opacity": fix(c.alpha, 2) }));
        s.appendChild(g);
      });
      room.innerHTML = "";
      room.appendChild(s);
    }

    function drawReadout() {
      var sp = m.spread();
      var txt = "Time: <strong>" + fix(m.t, 0) + " s</strong> (model) · meetings: <strong>" + m.meetings + "</strong> · color difference left: <strong>" + fix(100 * sp, 1) + "%</strong>";
      readout.innerHTML = txt;
      var msg;
      if (frozen && guessed) {
        msg = guessed === "Green"
          ? "That is the class's prediction too. Blue and yellow spread until every beaker holds the same share of each dye, which looks green."
          : "Keep walking and watch. Every meeting averages two beakers, so the dyes spread until every beaker holds the same share of blue and of yellow: green.";
      } else if (sp < 0.02 && m.meetings > 0) {
        msg = "Every beaker is the same green. The students are still meeting and pouring (" + (m.meetings - meetingsAt(sp)) + " meetings since the color settled), yet nothing visible changes: the exchanges balance. That is dynamic equilibrium.";
      } else if (m.meetings === 0) {
        msg = "One beaker holds blue dye, one holds yellow, and the rest are clear. Press Start walking, then Call freeze to make a prediction partway through.";
      } else {
        msg = "Each meeting pours back and forth, so the two beakers end up closer in color. Colored water spreads out from the first two beakers one meeting at a time.";
      }
      note.textContent = msg;
    }
    function meetingsAt(level) {
      for (var i = 0; i < history.length; i++) if (history[i].s < 0.02) return history[i].meet;
      return m.meetings;
    }

    function drawChart() {
      var W = chartWidth(chart), H = 170, L = 44, R = 14, Tp = 12, B = 30;
      var s = svg("svg", { viewBox: "0 0 " + W + " " + H, class: "sh-svg", role: "img", "aria-label": "Color difference and meetings over time" });
      var tmax = Math.max(60, Math.ceil(m.t / 30) * 30);
      var mmax = Math.max(10, m.meetings);
      function X(t) { return L + (W - L - R) * t / tmax; }
      function Y(v) { return Tp + (H - Tp - B) * (1 - v); }
      [0, 0.25, 0.5, 0.75, 1].forEach(function (v) {
        s.appendChild(svg("line", { x1: L, x2: W - R, y1: Y(v), y2: Y(v), class: "c-grid" }));
        s.appendChild(svg("text", { x: L - 6, y: Y(v) + 4, "text-anchor": "end", class: "c-tick" }, fix(100 * v, 0) + "%"));
      });
      for (var t = 0; t <= tmax; t += tmax <= 120 ? 30 : 60) {
        s.appendChild(svg("text", { x: X(t), y: H - B + 16, "text-anchor": "middle", class: "c-tick" }, t + " s"));
      }
      var pa = "", pb = "";
      history.concat([{ t: m.t, s: m.spread(), meet: m.meetings }]).forEach(function (h, i) {
        pa += (i ? "L" : "M") + fix(X(h.t), 1) + "," + fix(Y(h.s), 1);
        pb += (i ? "L" : "M") + fix(X(h.t), 1) + "," + fix(Y(h.meet / mmax), 1);
      });
      s.appendChild(svg("path", { d: pb, class: "sh-line-meet" }));
      s.appendChild(svg("path", { d: pa, class: "sh-line-spread" }));
      chart.innerHTML = "";
      chart.appendChild(s);
      chart.appendChild(el("div", { class: "c-legend" }, [
        el("span", { class: "sh-lg" }, [el("span", { class: "sh-sw sh-sw-spread" }), "Color difference between beakers (100% at the start)"]),
        el("span", { class: "sh-lg" }, [el("span", { class: "sh-sw sh-sw-meet" }), "Meetings so far (scaled to " + mmax + ")"])
      ]));
    }

    redraws.push(function () { drawRoom(); drawChart(); });
    reset();
  }

  /* ------------------------------------ demo 3: four coffee questions */

  function dots(parent, k, n, cls, label, W) {
    var g = svg("g");
    var step = Math.min(26, (W - 110 - 62) / n), r = Math.min(9, step / 2 - 2);
    g.appendChild(svg("text", { x: 0, y: 14, class: "c-label" }, label));
    for (var i = 0; i < n; i++) {
      g.appendChild(svg("circle", { cx: 110 + i * step + r, cy: 10, r: r, class: i < k ? cls : "sh-empty" }));
    }
    g.appendChild(svg("text", { x: 110 + n * step + 6, y: 14, class: "sh-val" }, k + " of " + n));
    parent.appendChild(g);
    return g;
  }

  function mountCoffee(root) {
    var head = el("div", { class: "w-actions" }, [el("span", { class: "w-mono", text: "Question:" }), prongControl()]);
    var qtext = el("p", { class: "sh-q" });
    var answerBtn = el("button", { type: "button", class: "w-btn", text: "Show the full-credit answer" });
    var answer = el("p", { class: "sh-answer", hidden: "hidden" });
    var energy = el("div", { class: "sh-chart" });
    var readout = el("p", { class: "w-big" });
    var chart = el("div", { class: "sh-chart" });
    var unit = el("p", { class: "w-note", "data-levels": "ug grad res" });
    var test = el("p", { class: "w-note", "data-levels": "grad res" });
    var src = el("p", { class: "w-source", text: "Paper, Table 1 · 12 AP chemistry students, open-response questions at the start and end of the class" });
    [head, qtext, el("div", { class: "w-actions" }, [answerBtn]), answer, energy, readout, chart, unit, test, src].forEach(function (n) { root.appendChild(n); });

    answerBtn.addEventListener("click", function () {
      var open = answer.hasAttribute("hidden");
      if (open) answer.removeAttribute("hidden"); else answer.setAttribute("hidden", "hidden");
      answerBtn.textContent = open ? "Hide the full-credit answer" : "Show the full-credit answer";
    });

    function drawEnergy() {
      energy.innerHTML = "";
      if (D.table1[state.prong].prong !== "C") return;
      var W = chartWidth(energy), H = 150, L = 128, R = 40;
      var s = svg("svg", { viewBox: "0 0 " + W + " " + H, class: "sh-svg", role: "img", "aria-label": "Energy bookkeeping for question C" });
      function X(v) { return L + (W - L - R) * v / 40; }
      var rows = [
        ["Coffee", 38, "sh-post"],
        ["+ cream (−8)", 30, "sh-post"],
        ["− work, from 30", 10, "sh-acc"],
        ["− work, from 38", 18, "sh-acc"]
      ];
      rows.forEach(function (r, i) {
        var y = 10 + i * 34;
        s.appendChild(svg("text", { x: 0, y: y + 15, class: "c-label" }, r[0]));
        s.appendChild(svg("rect", { x: L, y: y, width: X(40) - L, height: 20, class: "sh-track" }));
        s.appendChild(svg("rect", { x: L, y: y, width: X(r[1]) - L, height: 20, class: r[2] }));
        s.appendChild(svg("text", { x: X(r[1]) + 6, y: y + 15, class: "sh-val" }, r[1] + " units"));
      });
      energy.appendChild(s);
      energy.appendChild(el("p", { class: "w-note", text: "The rubric accepted both endings: 10 if the 20 units of work come out of the 30 left after the cream, and 18 if they come out of the original 38. Either way, the first number is 30." }));
    }

    function draw() {
      var i = state.prong, r = D.table1[i], t = T1[i];
      qtext.innerHTML = "<strong>" + r.prong + ".</strong> " + r.q;
      answer.innerHTML = "<strong>Full credit:</strong> " + r.full + ".";
      drawEnergy();
      var gain = r.post - r.pre;
      readout.innerHTML = "Correct before the lesson: <strong>" + r.pre + "%</strong>; after it: <strong>" + r.post + "%</strong>" +
        (gain === 0 ? " (no change)." : " (up " + gain + " points).");
      var W = chartWidth(chart), H = 58;
      var s = svg("svg", { viewBox: "0 0 " + W + " " + H, class: "sh-svg", role: "img", "aria-label": "Students answering correctly before and after" });
      dots(s, t.pre[0], 12, "sh-pre", "Before", W);
      var g2 = dots(s, t.post[0], 12, "sh-post", "After", W);
      g2.setAttribute("transform", "translate(0,30)");
      chart.innerHTML = "";
      chart.appendChild(s);
      unit.innerHTML = "Each dot is one of the 12 students. Table 1 prints percentages; " + r.pre + "% and " + r.post + "% of 12 can only be " +
        t.pre[0] + " and " + t.post[0] + " students (the page's reading: every printed value is a whole number of twelfths).";
      var mc = E.mcnemarRange(t.pre[0], t.post[0], 12);
      if (t.pre[0] === t.post[0]) {
        test.innerHTML = "Computed by the page: with the same count before and after, any change in who answered correctly cancels out, and an exact McNemar test gives p = 1. The paper reports no test; it notes the class was too small to establish significance.";
      } else {
        test.innerHTML = "Computed by the page: the paper does not say which students answered correctly each time, so an exact McNemar test (which needs pairs) has a range. At least " + words(mc.rows[0].b) +
          " students moved from incorrect to correct; over every pairing the counts allow, p runs from " + fix(mc.min, 3) + " to " + fix(mc.max, 3) + ". The paper reports no test.";
      }
    }
    prongDraws.push(draw);
    redraws.push(draw);
    draw();
  }

  /* ---------------------------------------------- demo 4: results */

  function mountResults(root) {
    var chart = el("div", { class: "sh-chart" });
    var readout = el("p", { class: "w-big" });
    var src1 = el("p", { class: "w-source", text: "Paper, Table 1 and Results · chemistry: 12 students × 4 questions; biology: 43 students in two classes (values not printed); aggregate: 55 students" });
    var solveWrap = el("div", { "data-levels": "ug grad res" });
    var slider = el("input", { type: "range", min: "0", max: "30", step: "0.5", value: fix(TOT.gain, 1), "aria-label": "Chemistry gain in points", class: "sh-range" });
    var solveOut = el("p", { class: "w-big" });
    var solveChart = el("div", { class: "sh-chart" });
    var solveSrc = el("p", { class: "w-source", text: "Page's arithmetic: (12 × chemistry gain + 43 × biology gain) / 55 = 17, one reading of the aggregate (weighted by students)" });
    var tableWrap = el("div", { class: "sh-table-scroll", "data-levels": "grad res" });

    root.appendChild(chart);
    root.appendChild(readout);
    root.appendChild(src1);
    solveWrap.appendChild(el("p", { class: "w-mono sh-steps-head", text: "What does 17 percent in aggregate require of the biology classes?" }));
    solveWrap.appendChild(el("div", { class: "w-actions" }, [el("span", { class: "w-mono", text: "Chemistry gain:" }), slider]));
    var presets = el("div", { class: "w-actions" });
    [["Table 1 total (" + fix(TOT.gain, 1) + ")", TOT.gain], ["Text: about 10", 10], ["Biology at exactly 15", (55 * 17 - 43 * 15) / 12]].forEach(function (p) {
      var b = el("button", { type: "button", class: "w-btn sh-ghost", text: p[0] });
      b.addEventListener("click", function () { slider.value = fix(p[1], 1); state.chemGain = p[1]; drawSolve(); });
      presets.appendChild(b);
    });
    solveWrap.appendChild(presets);
    solveWrap.appendChild(solveOut);
    solveWrap.appendChild(solveChart);
    solveWrap.appendChild(solveSrc);
    root.appendChild(solveWrap);
    root.appendChild(tableWrap);
    slider.addEventListener("input", function () { state.chemGain = Number(slider.value); drawSolve(); });

    function drawBars() {
      var W = chartWidth(chart), narrow = W < 480, L = narrow ? 0 : 150, R = 76, rowH = 26, lab = narrow ? 18 : 0;
      var rows = [
        { label: "Chemistry, Table 1", pre: TOT.prePct, post: TOT.postPct, note: "" },
        { label: "Chemistry, A", pre: D.table1[0].pre, post: D.table1[0].post, lv: "ug grad res" },
        { label: "Chemistry, B", pre: D.table1[1].pre, post: D.table1[1].post, lv: "ug grad res" },
        { label: "Chemistry, C", pre: D.table1[2].pre, post: D.table1[2].post, lv: "ug grad res" },
        { label: "Chemistry, D", pre: D.table1[3].pre, post: D.table1[3].post, lv: "ug grad res" }
      ];
      var H = 26 + rows.length * (2 * rowH + 8 + lab) + 80;
      var s = svg("svg", { viewBox: "0 0 " + W + " " + H, class: "sh-svg", role: "img", "aria-label": "Percent correct before and after" });
      function X(v) { return L + (W - L - R) * v / 100; }
      [0, 25, 50, 75, 100].forEach(function (v) {
        s.appendChild(svg("line", { x1: X(v), x2: X(v), y1: 14, y2: H - 30, class: "c-grid" }));
        s.appendChild(svg("text", { x: X(v), y: 10, "text-anchor": "middle", class: "c-tick" }, v + "%"));
      });
      var y = 20;
      rows.forEach(function (r) {
        var g = svg("g", r.lv ? { "data-levels": r.lv } : null);
        g.appendChild(svg("text", { x: 0, y: narrow ? y + 12 : y + rowH, class: "c-label" }, r.label));
        var yb = y + lab;
        g.appendChild(svg("rect", { x: L, y: yb, width: X(r.pre) - L, height: rowH - 6, class: "sh-pre" }));
        g.appendChild(svg("text", { x: X(r.pre) + 4, y: yb + 14, class: "sh-val" }, fix(r.pre, r.pre % 1 ? 1 : 0) + "% before"));
        g.appendChild(svg("rect", { x: L, y: yb + rowH, width: X(r.post) - L, height: rowH - 6, class: "sh-post" }));
        g.appendChild(svg("text", { x: X(r.post) + 4, y: yb + rowH + 14, class: "sh-val" }, fix(r.post, r.post % 1 ? 1 : 0) + "% after"));
        s.appendChild(g);
        if (!r.lv || isShown(r.lv)) y += 2 * rowH + 8 + lab;
      });
      var tail = narrow ? [[0, 14, "c-label", "Biology, two classes"], [0, 30, "sh-val", "more than 15% higher (values not printed)"], [0, 54, "c-label", "All three classes"], [0, 70, "sh-val", "17% more correct answers, in aggregate"]]
        : [[0, 14, "c-label", "Biology, two classes"], [L, 14, "sh-val", "more than 15% higher (values not printed)"], [0, 34, "c-label", "All three classes"], [L, 34, "sh-val", "17% more correct answers, in aggregate"]];
      tail.forEach(function (t) { s.appendChild(svg("text", { x: t[0], y: y + t[1], class: t[2] }, t[3])); });
      s.setAttribute("viewBox", "0 0 " + W + " " + (y + (narrow ? 80 : 44)));
      chart.innerHTML = "";
      chart.appendChild(s);
      readout.innerHTML = "Across Table 1's four questions, the chemistry class went from <strong>" + TOT.pre + " of 48</strong> correct answers (" + fix(TOT.prePct, 1) +
        "%) to <strong>" + TOT.post + " of 48</strong> (" + fix(TOT.postPct, 1) + "%), a gain of " + fix(TOT.gain, 1) + " points computed by the page. The text describes the chemistry gain as about 10%.";
    }
    function isShown(lv) {
      var cur = currentLevel();
      return lv.split(" ").indexOf(cur) >= 0;
    }

    function drawSolve() {
      var g = state.chemGain === null ? TOT.gain : state.chemGain;
      var bio = E.bioGainFor(g);
      solveOut.innerHTML = "If the chemistry class gained <strong>" + fix(g, 1) + "</strong> points, the 43 biology students must have gained <strong>" + fix(bio, 1) +
        "</strong> points for the aggregate to be 17. " + (Math.abs(bio - 15) < 0.05 ? "That sits exactly on the text's floor; any larger chemistry gain would leave the biology classes at 15 or below." : bio > 15 ? "That fits the text's “more than 15%.”" : "That falls short of the text's “more than 15%,” so this chemistry gain cannot be the one behind the aggregate under this reading.");
      var W = chartWidth(solveChart), H = 150, L = 44, R = 14, Tp = 10, B = 30;
      var s = svg("svg", { viewBox: "0 0 " + W + " " + H, class: "sh-svg", role: "img", "aria-label": "Required biology gain against chemistry gain" });
      function X(v) { return L + (W - L - R) * v / 30; }
      function Y(v) { return Tp + (H - Tp - B) * (1 - (v - 10) / 15); }
      s.appendChild(svg("rect", { x: L, y: Y(25), width: W - L - R, height: Y(15) - Y(25), class: "sh-ok" }));
      [10, 15, 20, 25].forEach(function (v) {
        s.appendChild(svg("line", { x1: L, x2: W - R, y1: Y(v), y2: Y(v), class: "c-grid" }));
        s.appendChild(svg("text", { x: L - 6, y: Y(v) + 4, "text-anchor": "end", class: "c-tick" }, v));
      });
      [0, 10, 20, 30].forEach(function (v) {
        s.appendChild(svg("text", { x: X(v), y: H - B + 16, "text-anchor": "middle", class: "c-tick" }, v));
      });
      s.appendChild(svg("text", { x: W - R, y: H - 4, "text-anchor": "end", class: "c-tick" }, "chemistry gain (points)"));
      s.appendChild(svg("text", { x: W - R, y: Y(15) + 14, "text-anchor": "end", class: "c-tick" }, "above 15: fits the text"));
      s.appendChild(svg("line", { x1: X(0), y1: Y(E.bioGainFor(0)), x2: X(30), y2: Y(E.bioGainFor(30)), class: "sh-line-spread" }));
      [[TOT.gain, "Table 1"], [10, "text"]].forEach(function (p) {
        s.appendChild(svg("line", { x1: X(p[0]), x2: X(p[0]), y1: Tp, y2: H - B, class: "sh-ref" }));
        s.appendChild(svg("text", { x: X(p[0]) + 3, y: Tp + 10, class: "c-tick" }, p[1]));
      });
      s.appendChild(svg("circle", { cx: X(g), cy: Y(bio), r: 6, class: bio > 15 ? "sh-dot-ok" : "sh-dot-bad" }));
      solveChart.innerHTML = "";
      solveChart.appendChild(s);
    }

    function drawTable() {
      var rows = D.table1.map(function (r, i) {
        var t = T1[i], mc = E.mcnemarRange(t.pre[0], t.post[0], 12);
        return "<tr><td>" + r.prong + " · " + r.short + "</td><td>" + r.pre + "% → " + r.post + "%</td><td>" + t.pre[0] + " → " + t.post[0] + "</td><td>" +
          (mc.min === mc.max ? fix(mc.min, 3) : fix(mc.min, 3) + " to " + fix(mc.max, 3)) + "</td></tr>";
      }).join("");
      tableWrap.innerHTML = "<table class=\"results-table\"><caption class=\"w-note\">Table 1 as printed, with the counts and exact McNemar ranges the page computes (12 students; the last two columns are the page's).</caption>" +
        "<thead><tr><th>Question</th><th>Correct (paper)</th><th>Students (page)</th><th>Exact McNemar p (page)</th></tr></thead><tbody>" + rows +
        "<tr><td>All four</td><td>" + fix(TOT.prePct, 1) + "% → " + fix(TOT.postPct, 1) + "% (page)</td><td>" + TOT.pre + " → " + TOT.post + " of 48</td><td>—</td></tr></tbody></table>";
    }

    redraws.push(drawBars, drawSolve);
    drawBars(); drawSolve(); drawTable();
  }

  function currentLevel() {
    if (window.PaperKit && window.PaperKit.level) return window.PaperKit.level();
    return "public";
  }

  function mount(id, fn) {
    var node = document.getElementById(id);
    if (!node) return;
    fn(node);
    node.classList.add("w-ready");
  }
  function init() {
    mount("sh-lessons", mountLessons);
    mount("sh-mixing", mountMixing);
    mount("sh-coffee", mountCoffee);
    mount("sh-results", mountResults);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();

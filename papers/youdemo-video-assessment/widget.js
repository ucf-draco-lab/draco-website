/*
  YouDemo widget for /papers/youdemo-video-assessment/.
  Mount points in the page: #yd-rate, #yd-study, #yd-bias, #yd-self, #yd-table2.

  Demo 1 puts the reader in the evaluator's seat: a short animated micro-teach
         plays, and the reader rates two creator-chosen metrics continuously
         with the arrow keys (or on-screen arrows), as YouDemo's evaluators did.
         Afterward the creator's view averages the reader with a simulated
         panel, so no single rater can be picked out.
  Demo 2 walks the study: the five-stage assessment cycle (Figure 1) and what
         each of the 27 preservice teachers produced.
  Demo 3 draws Figure 7: Metric 2 against Metric 1, the line of no bias, and
         the printed fit.
  Demo 4 rebuilds what Figure 8's text allows about 27 self-assessments.
  Demo 5 draws Table 2 and tests which denominator its percentages use.
  All arithmetic lives in yd-engine.js.
*/
(function () {
  "use strict";

  var E = window.YouDemoEngine;
  var SVGNS = "http://www.w3.org/2000/svg";

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

  function words(n) {
    var w = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
    return n >= 0 && n < 10 ? w[n] : String(n);
  }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function fmt(x, d) { return x.toFixed(d === undefined ? 1 : d); }

  /* ---------------------------------------------------------------- demo 1: rate as you watch */

  // A 45-second animated micro-teach, written for this page. The "true"
  // quality of each scene drives the simulated panel only.
  var DURATION = 45;
  var METRICS = [
    { key: "m1", name: "Clear explanation", up: "ArrowUp", down: "ArrowDown", upLabel: "↑", downLabel: "↓" },
    { key: "m2", name: "Engaging visuals", up: "ArrowRight", down: "ArrowLeft", upLabel: "→", downLabel: "←" }
  ];
  var SCENES = [
    { start: 0, end: 6, m1: 5, m2: 4, caption: "How long does one swing take?" },
    { start: 6, end: 16, m1: 7, m2: 6, caption: "We hang a weight on a string and time ten full swings, then divide by ten." },
    { start: 16, end: 26, m1: 2, m2: 3, caption: "So obviously T = 2π√(L/g), and the rest follows, moving on …" },
    { start: 26, end: 38, m1: 8, m2: 9, caption: "Side by side: the longer string swings more slowly. The weight does not matter." },
    { start: 38, end: 45, m1: 7, m2: 5, caption: "A string four times longer takes twice as long per swing." }
  ];
  var PANEL_N = 11;
  var PANEL = E.simulatePanel(SCENES, PANEL_N, 2016);

  function sceneAt(t) {
    for (var i = 0; i < SCENES.length; i++) if (t < SCENES[i].end) return i;
    return SCENES.length - 1;
  }

  function drawVideo(g, t, W, H) {
    while (g.firstChild) g.removeChild(g.firstChild);
    var s = sceneAt(t);
    g.appendChild(svg("rect", { x: 0, y: 0, width: W, height: H, class: "yd-screen" }));
    var cx = W / 2, top = 26;
    function pendulum(x, L, period, label, shift) {
      var ang = 0.42 * Math.cos(2 * Math.PI * (t - (shift || 0)) / period);
      var bx = x + L * Math.sin(ang), by = top + L * Math.cos(ang);
      g.appendChild(svg("line", { x1: x - 30, y1: top, x2: x + 30, y2: top, class: "yd-beam" }));
      g.appendChild(svg("line", { x1: x, y1: top, x2: bx, y2: by, class: "yd-string" }));
      g.appendChild(svg("circle", { cx: bx, cy: by, r: 9, class: "yd-bob" }));
      if (label) g.appendChild(svg("text", { x: x, y: top + L + 30, class: "yd-vlabel", "text-anchor": "middle" }, label));
    }
    var scale = Math.min(1, (H - 90) / 120);
    if (s === 0) {
      g.appendChild(svg("text", { x: cx, y: H / 2 - 6, class: "yd-title", "text-anchor": "middle" }, "The Pendulum"));
      g.appendChild(svg("text", { x: cx, y: H / 2 + 16, class: "yd-vlabel", "text-anchor": "middle" }, "a two-minute micro-teach"));
    } else if (s === 1) {
      pendulum(cx, 110 * scale, 2.1, "");
      var swings = Math.min(10, Math.floor((t - 6) / 2.1 * 1));
      g.appendChild(svg("text", { x: 16, y: 20, class: "yd-vlabel" }, "swings: " + swings));
    } else if (s === 2) {
      pendulum(W * 0.86, 150 * scale, 2.4, "", 0.3);
      g.appendChild(svg("text", { x: 14, y: 30, class: "yd-formula" }, "T = 2π√(L/g)"));
      g.appendChild(svg("text", { x: 14, y: 52, class: "yd-vlabel" }, "g = 9.81 m/s², L = ?"));
    } else if (s === 3) {
      pendulum(cx - W * 0.2, 55 * scale, 1.2, "short");
      pendulum(cx + W * 0.2, 110 * scale, 2.4, "long", 0);
      var clock = (t - 26).toFixed(1);
      g.appendChild(svg("text", { x: W - 14, y: 20, class: "yd-vlabel", "text-anchor": "end" }, "t = " + clock + " s"));
    } else {
      g.appendChild(svg("text", { x: cx, y: H / 2 - 10, class: "yd-title", "text-anchor": "middle" }, "4 × length → 2 × time"));
      g.appendChild(svg("text", { x: cx, y: H / 2 + 14, class: "yd-vlabel", "text-anchor": "middle" }, "Try it with a shoelace and a key."));
    }
  }

  function mountRate(root) {
    var state = { t: 0, playing: false, last: null, v: { m1: 5, m2: 5 }, trace: { m1: [[0, 5]], m2: [[0, 5]] }, done: false, presses: 0 };

    root.setAttribute("tabindex", "0");
    root.setAttribute("aria-label", "Continuous rating demo. Use the arrow keys while the video plays.");

    var src = el("p", { class: "w-source", text: "Paper, Figures 1, 4, and 5: the YouDemo assessment page. The micro-teach below is an animation written for this page." });
    var stage = el("div", { class: "yd-stage" });
    var vbox = svg("svg", { class: "yd-video", viewBox: "0 0 640 220", role: "img", "aria-label": "Animated micro-teach about a pendulum" });
    var vg = svg("g");
    vbox.appendChild(vg);
    var caption = el("p", { class: "yd-caption", "aria-live": "off" });
    var bar = el("div", { class: "yd-progress" }, [el("span")]);
    stage.appendChild(vbox);
    stage.appendChild(caption);
    stage.appendChild(bar);

    var meters = el("div", { class: "yd-meters" });
    var meterEls = {};
    METRICS.forEach(function (m) {
      var val = el("span", { class: "yd-mval" });
      var lab = el("span", { class: "yd-mlab" });
      var fill = el("span", { class: "yd-mfill" });
      var down = el("button", { type: "button", class: "w-btn w-btn-quiet yd-arrow", "aria-label": m.name + " down", text: m.downLabel });
      var up = el("button", { type: "button", class: "w-btn w-btn-quiet yd-arrow", "aria-label": m.name + " up", text: m.upLabel });
      down.addEventListener("click", function () { press(m.key, -1); });
      up.addEventListener("click", function () { press(m.key, 1); });
      meters.appendChild(el("div", { class: "yd-mrow" }, [
        el("span", { class: "yd-mname", text: m.name }),
        down,
        el("span", { class: "yd-mtrack" }, [fill]),
        up,
        val, lab
      ]));
      meterEls[m.key] = { val: val, lab: lab, fill: fill };
    });

    var playBtn = el("button", { type: "button", class: "w-btn", text: "Play" });
    var resetBtn = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "Start over" });
    var sampleBtn = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "Fill in a sample rater" });
    var actions = el("div", { class: "w-actions" }, [playBtn, resetBtn, sampleBtn]);
    var keys = el("p", { class: "w-mono", text: "Keys: ↑ ↓ clear explanation · → ← engaging visuals · space play or pause" });
    var status = el("p", { class: "w-big", "aria-live": "polite" });
    var result = el("div", { class: "yd-result" });

    [src, stage, meters, actions, keys, status, result].forEach(function (n) { root.appendChild(n); });

    function press(key, dir) {
      if (state.done) return;
      var v = Math.max(0, Math.min(10, state.v[key] + dir));
      if (v === state.v[key]) return;
      state.v[key] = v;
      state.presses += 1;
      state.trace[key].push([Math.round(state.t * 10) / 10, v]);
      if (!state.playing && state.t === 0) play();
      paintMeters();
    }

    function paintMeters() {
      METRICS.forEach(function (m) {
        var v = state.v[m.key];
        meterEls[m.key].val.textContent = String(v);
        meterEls[m.key].lab.textContent = E.labelsFor(v).join(" / ");
        meterEls[m.key].fill.style.width = (v * 10) + "%";
      });
    }

    function paintVideo() {
      drawVideo(vg, state.t, 640, 220);
      caption.textContent = SCENES[sceneAt(state.t)].caption;
      bar.firstChild.style.width = (100 * state.t / DURATION) + "%";
    }

    function tick(now) {
      if (!state.playing) return;
      if (state.last !== null) state.t = Math.min(DURATION, state.t + (now - state.last) / 1000);
      state.last = now;
      paintVideo();
      if (state.t >= DURATION) { finish(); return; }
      requestAnimationFrame(tick);
    }

    function play() {
      if (state.done) return;
      state.playing = true;
      state.last = null;
      playBtn.textContent = "Pause";
      status.textContent = "Rating while it plays. Press an arrow whenever your opinion changes.";
      requestAnimationFrame(tick);
    }
    function pause() {
      state.playing = false;
      playBtn.textContent = "Play";
      status.textContent = "Paused at " + fmt(state.t) + " s. Pausing does not restart the video, as in YouDemo.";
    }

    function finish() {
      state.playing = false;
      state.done = true;
      playBtn.textContent = "Play";
      playBtn.disabled = true;
      status.textContent = state.presses
        ? "Done. You pressed an arrow " + state.presses + " times. Below is what the video's creator would see."
        : "Done. You did not press any arrows, so your trace stays at five. Try again, or fill in a sample rater.";
      drawResult();
    }

    function reset() {
      state.t = 0; state.playing = false; state.last = null; state.done = false; state.presses = 0;
      state.v = { m1: 5, m2: 5 };
      state.trace = { m1: [[0, 5]], m2: [[0, 5]] };
      playBtn.disabled = false;
      playBtn.textContent = "Play";
      status.textContent = "Press Play, or press any arrow to start. Ratings begin at five (“Average”).";
      while (result.firstChild) result.removeChild(result.firstChild);
      paintMeters();
      paintVideo();
    }

    function useSample() {
      var s = E.simulatePanel(SCENES, 1, 7777)[0];
      state.trace = { m1: s.m1, m2: s.m2 };
      state.presses = s.m1.length + s.m2.length - 2;
      state.t = DURATION;
      state.v = { m1: E.valueAt(s.m1, DURATION), m2: E.valueAt(s.m2, DURATION) };
      paintMeters();
      paintVideo();
      finish();
      status.textContent = "A simulated rater filled in the traces. Below is what the video's creator would see.";
    }

    playBtn.addEventListener("click", function () { state.playing ? pause() : play(); });
    resetBtn.addEventListener("click", reset);
    sampleBtn.addEventListener("click", useSample);

    root.addEventListener("keydown", function (ev) {
      var handled = false;
      METRICS.forEach(function (m) {
        if (ev.key === m.up) { press(m.key, 1); handled = true; }
        if (ev.key === m.down) { press(m.key, -1); handled = true; }
      });
      if (ev.key === " " && ev.target === root) { state.playing ? pause() : play(); handled = true; }
      if (handled) ev.preventDefault();
    });

    var showMetric = "m1";
    function drawResult() {
      while (result.firstChild) result.removeChild(result.firstChild);
      if (!state.done) return;
      var you = state.trace;
      var everyone = PANEL.concat([{ m1: you.m1, m2: you.m2 }]);
      var seg = segmented("Metric", METRICS.map(function (m) { return { value: m.key, label: m.name }; }), showMetric, function (v) { showMetric = v; drawResult(); });
      result.appendChild(el("p", { class: "w-mono", text: "Creator's view: the average of " + everyone.length + " raters, second by second" }));
      result.appendChild(el("div", { class: "w-actions" }, [seg]));
      var chartBox = el("div", { class: "yd-chart" });
      result.appendChild(chartBox);
      var W = chartWidth(root), H = 230, L = 34, R = 12, T = 12, B = 34;
      var s = svg("svg", { class: "yd-svg", viewBox: "0 0 " + W + " " + H, width: W, height: H, role: "img",
        "aria-label": "Ratings over time for " + (showMetric === "m1" ? "clear explanation" : "engaging visuals") });
      function x(t) { return L + (W - L - R) * t / DURATION; }
      function y(v) { return T + (H - T - B) * (1 - v / 10); }
      [0, 2, 4, 6, 8, 10].forEach(function (v) {
        s.appendChild(svg("line", { x1: L, x2: W - R, y1: y(v), y2: y(v), class: "c-grid" }));
        s.appendChild(svg("text", { x: L - 6, y: y(v) + 4, class: "c-tick", "text-anchor": "end" }, String(v)));
      });
      SCENES.forEach(function (sc, i) {
        if (i) s.appendChild(svg("line", { x1: x(sc.start), x2: x(sc.start), y1: T, y2: H - B, class: "yd-scene" }));
        s.appendChild(svg("text", { x: (x(sc.start) + x(sc.end)) / 2, y: H - B + 14, class: "c-tick", "text-anchor": "middle" }, "scene " + (i + 1)));
      });
      s.appendChild(svg("text", { x: W - R, y: H - 4, class: "c-label", "text-anchor": "end" }, "seconds into the video"));
      // simulated raters (graduate and researcher only)
      var others = svg("g", { "data-levels": "grad res" });
      PANEL.forEach(function (p) {
        var pts = E.resample(p[showMetric], DURATION, 0.5).map(function (v, i) { return x(i * 0.5) + "," + y(v); });
        others.appendChild(svg("polyline", { points: pts.join(" "), class: "yd-other" }));
      });
      s.appendChild(others);
      var agg = E.aggregate(everyone.map(function (p) { return p[showMetric]; }), DURATION, 0.5);
      s.appendChild(svg("polyline", { points: agg.map(function (v, i) { return x(i * 0.5) + "," + y(v); }).join(" "), class: "yd-agg" }));
      var mine = E.resample(you[showMetric], DURATION, 0.5);
      s.appendChild(svg("polyline", { points: mine.map(function (v, i) { return x(i * 0.5) + "," + y(v); }).join(" "), class: "yd-mine" }));
      chartBox.appendChild(s);
      result.appendChild(el("div", { class: "c-legend w-mono" }, [
        el("span", { class: "lg yd-lg-agg", text: "Average of all " + everyone.length + " (what the creator sees)" }),
        el("span", { class: "lg yd-lg-mine", text: "You (only you see this line)" }),
        el("span", { class: "lg yd-lg-other", "data-levels": "grad res", text: PANEL_N + " simulated raters" })
      ]));
      var rows = el("div", { class: "yd-rows" });
      METRICS.forEach(function (m) {
        var mineMean = E.traceMean(you[m.key], DURATION);
        var aggMean = E.mean(E.aggregate(everyone.map(function (p) { return p[m.key]; }), DURATION, 0.5));
        rows.appendChild(el("div", { class: "yd-row" }, [
          el("span", { text: m.name }),
          el("span", { text: "you " + fmt(mineMean) + " (" + E.labelsFor(mineMean).join(" / ") + ")" }),
          el("span", { text: "panel " + fmt(aggMean) })
        ]));
      });
      result.appendChild(rows);
      result.appendChild(note("The other " + PANEL_N + " raters are <strong>simulated</strong> by this page, not study data: each starts at five, reacts a second or two after a scene changes, and presses “increase” more readily than “decrease,” two habits the paper reports. The paper does not say how YouDemo lined up raters in time; the page holds each rating until the next press and averages every half second."));
      result.appendChild(note("Word labels follow the paper's Table 1, which prints overlapping ranges (2–3 “Lacking,” 3–6 “Average”), so a three shows both labels.", "ug grad res"));
    }
    redraws.push(function () { if (state.done) drawResult(); });

    reset();
  }

  /* ---------------------------------------------------------------- demo 2: the study */

  var CYCLE = [
    { id: "A", who: "Video creator", title: "Link the video", body: "The creator links a video already on YouTube, adds a summary and a class, and names the two metrics viewers will rate the whole way through (for example, clarity and pacing). YouDemo never hosts or edits the video." },
    { id: "B", who: "Creator and instructor", title: "Ask for assessments", body: "The request goes out by link, including through social media, so raters can come from outside the classroom." },
    { id: "C", who: "Peer evaluators", title: "Rate while watching", body: "Evaluators press arrows (keyboard or screen) whenever their view of either metric changes. Pausing does not restart the video. YouDemo stores the live scores." },
    { id: "D", who: "Creator and instructor", title: "Review the aggregate", body: "Individual ratings are averaged, and the creator sees only the average, so no single peer's score can be identified." },
    { id: "E", who: "Video creator", title: "Share the results", body: "The creator can pass the aggregated results to an instructor, a mentor, or other peers." }
  ];

  var STEPS = [
    { title: "Rate yourself first", when: "before", body: "Each preservice teacher scored their own video on the two metrics and explained why in writing (the pre-self-assessment)." },
    { title: "Post two videos", when: "each class", body: "Two videos per class, 2 to 10 minutes each, on YouTube: a K–12 STEM demonstration, a STEM “hot topic” commercial, or a micro-teach." },
    { title: "Two written peer reviews", when: "after posting", body: "Two classmates scored each video on the same metrics, in writing, with open-response reasons (summative peer assessment)." },
    { title: "Continuous ratings in YouDemo", when: "during viewing", body: "Peers rated the same metrics second by second while the video played (formative peer assessment), then answered five open questions, such as “How did the tool affect your viewing of this video?”" },
    { title: "Rate yourself again", when: "after", body: "Each teacher rescored their own video after assessing peers (the post-self-assessment). Comparing the two self-scores with the peer scores is Figure 8." }
  ];

  function mountStudy(root) {
    var view = "study";
    var body = el("div");
    var seg = segmented("View", [{ value: "study", label: "One teacher's path" }, { value: "cycle", label: "The tool's five stages" }, { value: "scope", label: "Who and how many" }], view, function (v) { view = v; draw(); });
    root.appendChild(el("p", { class: "w-source", text: "Paper, Methods and Figure 1" }));
    root.appendChild(el("div", { class: "w-actions" }, [seg]));
    root.appendChild(body);
    var open = 0;

    function stepper(list, tagFn) {
      var wrap = el("div", { class: "yd-steps" });
      list.forEach(function (s, i) {
        var btn = el("button", { type: "button", class: "yd-srow" + (open === i ? " yd-srow-on" : ""), "aria-expanded": open === i ? "true" : "false" }, [
          el("span", { class: "yd-snum", text: tagFn(s, i) }),
          el("span", { class: "yd-stitle", text: s.title }),
          el("span", { class: "yd-swhen", text: s.who || s.when })
        ]);
        btn.addEventListener("click", function () { open = open === i ? -1 : i; draw(); });
        wrap.appendChild(btn);
        if (open === i) wrap.appendChild(el("div", { class: "yd-sbody" }, [el("p", { text: s.body })]));
      });
      return wrap;
    }

    function draw() {
      while (body.firstChild) body.removeChild(body.firstChild);
      if (view === "study") {
        body.appendChild(stepper(STEPS, function (s, i) { return String(i + 1); }));
        body.appendChild(note("Five measures of the same video from three viewpoints: the creator (before and after), two peers in writing, and peers rating continuously."));
      } else if (view === "cycle") {
        body.appendChild(stepper(CYCLE, function (s) { return s.id; }));
      } else {
        var S = E.STUDY;
        var rows = [
          ["Full trial", cap(words(S.years)) + " years, " + words(S.universities) + " North American universities", S.participants + " preservice science teachers"],
          ["Sub-study (Figure 8)", cap(words(S.subYears)) + " years, one course on teaching science through STEM integration", S.subN + " fully matched sets"],
          ["YouDemo use to date", "all studies, including earlier ones", "over " + S.assessments + " assessments of " + S.videos + " videos by over " + S.users + " users"],
          ["Peer reviewers per video", "written, summative", words(S.peersPerVideo)],
          ["Video length", "posted to YouTube", S.videoMin + " to " + S.videoMax + " minutes"]
        ];
        var wrap = el("div", { class: "yd-rows" });
        rows.forEach(function (r) { wrap.appendChild(el("div", { class: "yd-row yd-row3" }, r.map(function (c) { return el("span", { text: c }); }))); });
        body.appendChild(wrap);
        body.appendChild(note("The 900, 170, and 131 count every YouDemo assessment the authors had collected, not only the 27 teachers' videos; the paper does not break them down by study.", "ug grad res"));
      }
    }
    draw();
  }

  /* ---------------------------------------------------------------- demo 3: two metrics */

  function mountBias(root) {
    var x0 = 3;
    var box = el("div", { class: "yd-chart" });
    var range = el("input", { type: "range", min: "0", max: "10", step: "0.1", value: String(x0), "aria-label": "Metric 1 average" });
    var out = el("output", { text: fmt(x0) });
    var read = el("div", { class: "yd-rows" });
    root.appendChild(el("p", { class: "w-source", text: "Paper, Figure 7: Metric 2 against Metric 1, one point per video (the Plotly data are not in the article)" }));
    root.appendChild(box);
    root.appendChild(el("label", { class: "w-range" }, [el("span", { text: "Metric 1 average" }), range, out]));
    root.appendChild(read);
    root.appendChild(el("div", { class: "c-legend w-mono" }, [
      el("span", { class: "lg yd-lg-eq", text: "No bias: Metric 2 = Metric 1" }),
      el("span", { class: "lg yd-lg-fit", "data-levels": "ug grad res", text: "Printed fit: Y = 0.78X + 1.25" }),
      el("span", { class: "lg yd-lg-inv", "data-levels": "grad res", text: "Same equation, axes swapped (page's reading)" })
    ]));
    root.appendChild(note("The caption's words, at every level: “Rating Metric 1 low leads to an even lower Metric 2. Rating Metric 1 high leads to an even higher Metric 2.” The arrows show that pattern.", "public hs"));
    root.appendChild(note("A line with slope 0.78 is flatter than Y = X, so it sits <em>above</em> Y = X for low Metric 1 and <em>below</em> it for high Metric 1, the opposite of the caption. Both lines cross Y = X at " + fmt(E.crossing(), 2) + ". The printed equation solved the other way round (X = 0.78Y + 1.25) matches the caption. The page computes both; the authors' data would settle which the figure shows.", "grad res"));

    function draw() {
      while (box.firstChild) box.removeChild(box.firstChild);
      var x1 = parseFloat(range.value);
      out.textContent = fmt(x1);
      var W = chartWidth(root), side = Math.min(W, 420), H = side, L = 36, R = 14, T = 12, B = 36;
      var s = svg("svg", { class: "yd-svg", viewBox: "0 0 " + W + " " + H, width: W, height: H, role: "img", "aria-label": "Metric 2 against Metric 1" });
      var pw = side - L - R;
      function X(v) { return L + pw * v / 10; }
      function Y(v) { return T + (H - T - B) * (1 - v / 10); }
      for (var v = 0; v <= 10; v += 2) {
        s.appendChild(svg("line", { x1: L, x2: L + pw, y1: Y(v), y2: Y(v), class: "c-grid" }));
        s.appendChild(svg("line", { x1: X(v), x2: X(v), y1: T, y2: H - B, class: "c-grid" }));
        s.appendChild(svg("text", { x: L - 6, y: Y(v) + 4, class: "c-tick", "text-anchor": "end" }, String(v)));
        s.appendChild(svg("text", { x: X(v), y: H - B + 14, class: "c-tick", "text-anchor": "middle" }, String(v)));
      }
      s.appendChild(svg("text", { x: L + pw, y: H - 4, class: "c-label", "text-anchor": "end" }, "Metric 1 average"));
      s.appendChild(svg("text", { x: L + 4, y: T + 10, class: "c-label" }, "Metric 2 average"));
      s.appendChild(svg("line", { x1: X(0), y1: Y(0), x2: X(10), y2: Y(10), class: "yd-eq" }));
      var fit = svg("g", { "data-levels": "ug grad res" });
      fit.appendChild(svg("line", { x1: X(0), y1: Y(E.printedFit(0)), x2: X(10), y2: Y(E.printedFit(10)), class: "yd-fit" }));
      s.appendChild(fit);
      var inv = svg("g", { "data-levels": "grad res" });
      var a = E.FIT.intercept, b = 10;   // inverse line, clipped to the 0..10 square
      inv.appendChild(svg("line", { x1: X(a), y1: Y(0), x2: X(E.printedFit(10)), y2: Y(b), class: "yd-inv" }));
      inv.appendChild(svg("circle", { cx: X(E.crossing()), cy: Y(E.crossing()), r: 4, class: "yd-cross" }));
      s.appendChild(inv);
      // caption arrows for public and high school
      var arr = svg("g", { "data-levels": "public hs" });
      [[2.5, -1], [7.5, 1]].forEach(function (p) {
        var px = X(p[0]), py0 = Y(p[0]), py1 = Y(p[0] + p[1] * 1.6);
        arr.appendChild(svg("line", { x1: px, y1: py0, x2: px, y2: py1, class: "yd-arrowline" }));
        arr.appendChild(svg("path", { d: "M" + (px - 5) + "," + (py1 + (p[1] > 0 ? 7 : -7)) + " L" + px + "," + py1 + " L" + (px + 5) + "," + (py1 + (p[1] > 0 ? 7 : -7)), class: "yd-arrowline" }));
      });
      s.appendChild(arr);
      s.appendChild(svg("line", { x1: X(x1), x2: X(x1), y1: T, y2: H - B, class: "yd-cursor" }));
      box.appendChild(s);

      while (read.firstChild) read.removeChild(read.firstChild);
      [["No bias", x1, "public hs ug grad res"], ["Printed fit", E.printedFit(x1), "ug grad res"], ["Axes swapped", E.inverseFit(x1), "grad res"]].forEach(function (r) {
        var shown = Math.max(0, Math.min(10, r[1]));
        var d = r[1] - x1;
        var row = el("div", { class: "yd-row", "data-levels": r[2] }, [
          el("span", { text: r[0] }),
          el("span", { text: "Metric 2 ≈ " + fmt(shown) + (r[1] !== shown ? " (off the scale)" : "") }),
          el("span", { text: Math.abs(d) < 0.05 ? "same as Metric 1" : (d > 0 ? "higher" : "lower") + " by " + fmt(Math.abs(d)) })
        ]);
        read.appendChild(row);
      });
      read.appendChild(el("div", { class: "yd-row", "data-levels": "public hs" }, [
        el("span", { text: "Caption's pattern" }),
        el("span", { text: x1 < 5 ? "Metric 2 tends to be even lower" : (x1 > 5 ? "Metric 2 tends to be even higher" : "about where the two agree") }),
        el("span", { text: "Figure 7 caption" })
      ]));
    }
    range.addEventListener("input", draw);
    draw();
    redraws.push(draw);
  }

  /* ---------------------------------------------------------------- demo 4: self-assessment */

  function mountSelf(root) {
    var B = E.fig8Bounds();
    var lower = 3;
    var box = el("div", { class: "yd-chart" });
    var range = el("input", { type: "range", min: String(B.lowerMin), max: String(B.lowerMax), step: "1", value: String(lower), "aria-label": "Teachers who rated themselves lower" });
    var out = el("output");
    var line = el("p", { class: "w-big", "aria-live": "polite" });
    root.appendChild(el("p", { class: "w-source", text: "Paper, Figure 8 text: 27 matched pre, post, and peer sets" }));
    root.appendChild(box);
    root.appendChild(el("label", { class: "w-range" }, [el("span", { text: "Rated themselves lower" }), range, out]));
    root.appendChild(line);
    root.appendChild(el("div", { class: "c-legend w-mono" }, [
      el("span", { class: "lg yd-lg-same", text: "No change (14, printed)" }),
      el("span", { class: "lg yd-lg-up", text: "Rated themselves higher" }),
      el("span", { class: "lg yd-lg-down", text: "Rated themselves lower" })
    ]));
    root.appendChild(note("The paper prints three counts: 14 of 27 unchanged, “less than a quarter” lower, and one of 27 lower among teachers whose peers scored them 7 to 9. The slider moves through every split those counts allow (one to six lower). The individual points of Figure 8 are not in the article, so this is a reconstruction of the counts, not of the people."));

    function draw() {
      lower = parseInt(range.value, 10);
      out.textContent = String(lower);
      var higher = B.moved - lower;
      while (box.firstChild) box.removeChild(box.firstChild);
      var W = chartWidth(root), cols = W < 420 ? 9 : 27, size = Math.min(26, Math.floor((W - 4) / cols) - 4);
      var rowsN = Math.ceil(B.n / cols), H = rowsN * (size + 4) + 4;
      var s = svg("svg", { class: "yd-svg", viewBox: "0 0 " + W + " " + H, width: W, height: H, role: "img",
        "aria-label": B.noShift + " unchanged, " + higher + " higher, " + lower + " lower" });
      for (var i = 0; i < B.n; i++) {
        var cls = i < B.noShift ? "yd-same" : (i < B.noShift + higher ? "yd-up" : "yd-down");
        s.appendChild(svg("rect", { x: 2 + (i % cols) * (size + 4), y: 2 + Math.floor(i / cols) * (size + 4), width: size, height: size, class: "yd-sq " + cls }));
      }
      box.appendChild(s);
      line.textContent = B.noShift + " unchanged, " + higher + " higher, " + lower + " lower. Higher can be anywhere from " + B.higherMin + " to " + B.higherMax + " of 27.";
    }
    range.addEventListener("input", draw);
    draw();
    redraws.push(draw);

    var w = E.wilson(B.noShift, B.n);
    root.appendChild(note("Computed by this page: 14 of 27 is 52% unchanged (95% Wilson interval " + Math.round(100 * w[0]) + "% to " + Math.round(100 * w[1]) + "%). “Less than a quarter” means at most six of 27, so at least seven (26%) rated themselves higher after seeing their peers' work.", "grad res"));
  }

  /* ---------------------------------------------------------------- demo 5: Table 2 */

  function mountTable2(root) {
    var base = 60;
    var box = el("div", { class: "yd-chart" });
    var seg = segmented("Divide by", [{ value: 27, label: "27 participants" }, { value: 60, label: "60 answers (page's inference)" }], base, function (v) { base = v; draw(); });
    root.appendChild(el("p", { class: "w-source", text: "Paper, Table 2: top 20% of coded answers to “How did the tool affect your viewing of the video?”" }));
    root.appendChild(el("div", { class: "w-actions", "data-levels": "hs ug grad res" }, [el("span", { class: "w-mono", text: "Divide by" }), seg]));
    root.appendChild(box);
    var bases = E.table2Bases(1, 1000);
    root.appendChild(note("Checked by this page: of every denominator from 1 to 1,000, only " + bases.join(", ") + " turns all four printed counts into all four printed percentages (37/60 = 61.7% → 62%, and so on). The paper names 27 participants; 60 is most likely the number of coded answers, which the paper does not state.", "grad res"));

    function draw() {
      while (box.firstChild) box.removeChild(box.firstChild);
      var W = chartWidth(root), rowH = 34, labelW = Math.min(230, Math.round(W * 0.42)), H = E.TABLE2.length * rowH + 8;
      var s = svg("svg", { class: "yd-svg", viewBox: "0 0 " + W + " " + H, width: W, height: H, role: "img", "aria-label": "Table 2 counts" });
      var maxC = 40, bw = W - labelW - 70;
      E.TABLE2.forEach(function (r, i) {
        var y0 = 4 + i * rowH;
        s.appendChild(svg("text", { x: 0, y: y0 + 19, class: "c-label" }, r.concept));
        s.appendChild(svg("rect", { x: labelW, y: y0 + 5, width: bw * r.count / maxC, height: rowH - 12, class: "yd-bar" }));
        s.appendChild(svg("text", { x: labelW + bw * r.count / maxC + 6, y: y0 + 19, class: "c-tick" }, String(r.count)));
      });
      box.appendChild(s);
      var rows = el("div", { class: "yd-rows", "data-levels": "hs ug grad res" });
      rows.appendChild(el("div", { class: "yd-row yd-row-head" }, [el("span", { text: "Concept" }), el("span", { text: "Printed" }), el("span", { text: "Count ÷ " + base })]));
      var shares = E.sharesFor(base);
      E.TABLE2.forEach(function (r, i) {
        var match = E.roundHalfUp(shares[i]) === r.pct;
        rows.appendChild(el("div", { class: "yd-row" }, [
          el("span", { text: r.concept }),
          el("span", { text: r.pct + "%" }),
          el("span", { class: match ? "yd-ok" : "yd-miss", text: fmt(shares[i]) + "% " + (match ? "✓ matches" : "✗ does not match") })
        ]));
      });
      box.appendChild(rows);
    }
    draw();
    redraws.push(draw);
  }

  /* ---------------------------------------------------------------- mount */

  function mount(id, fn) {
    var node = document.getElementById(id);
    if (!node) return;
    fn(node);
    node.classList.add("w-ready");
  }

  function init() {
    mount("yd-rate", mountRate);
    mount("yd-study", mountStudy);
    mount("yd-bias", mountBias);
    mount("yd-self", mountSelf);
    mount("yd-table2", mountTable2);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();

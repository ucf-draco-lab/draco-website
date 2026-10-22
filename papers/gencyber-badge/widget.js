/*
  GenCyber badge widget for /papers/gencyber-badge/.
  Mount points in the page: #gb-badge, #gb-plan, #gb-cost, #gb-answers.

  Demo 1 is a five-by-five LED badge with two buttons, like the Microbit the
  students built around. It scrolls a name, shows a score and a level, and
  accepts challenge codes under a scoring rule of the page's own design that
  illustrates requirements 8 to 10 (the paper does not describe the students'
  code).
  Demo 2 walks the project: the timeline and unit counts from the Methods, and
  the ten requirements.
  Demo 3 draws the per-unit cost before and after redesign ($17.50 and $10.50,
  the paper's 40 percent) and the page's arithmetic for a run of units.
  Demo 4 draws Tables 1 and 2 and the Results text's peer counts, with, at the
  graduate and researcher levels, interval estimates the page computes.
  All arithmetic lives in gb-engine.js.
*/
(function () {
  "use strict";

  var E = window.GenCyberBadgeEngine;
  var D = E.DATA;
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
  function money(x) { return "$" + Number(x).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ","); }
  function pct(x, d) { return (x * 100).toFixed(d === undefined ? 0 : d) + "%"; }

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

  /* ------------------------------------------------- demo 1: the badge */

  var MODES = [
    { value: "name", label: "Name", title: "Scroll the wearer's name (requirement 2)" },
    { value: "score", label: "Score", title: "Scroll the current points (requirements 3 and 8)" },
    { value: "level", label: "Level", title: "Light one row per level (requirement 10)" }
  ];

  function mountBadge(root) {
    var badge = E.makeBadge({ lockSeconds: 10, strikesToLock: 3, perLevel: 3 });
    var rng = E.mulberry32(2019);
    var mode = "name", name = "CAMPER", frames = [], frame = 0, timer = null, lockTimer = null;

    // Face
    var W = 220, H = 250;
    var face = svg("svg", { viewBox: "0 0 " + W + " " + H, class: "gb-face", role: "img", "aria-label": "Badge with a five by five LED display and buttons A and B" });
    face.appendChild(svg("rect", { x: 4, y: 4, width: W - 8, height: H - 8, rx: 10, class: "gb-shell" }));
    face.appendChild(svg("text", { x: W / 2, y: 26, "text-anchor": "middle", class: "gb-tag" }, "GenCyber camp badge (model)"));
    var leds = [];
    var x0 = 50, y0 = 44, step = 24;
    for (var r = 0; r < 5; r++) {
      leds.push([]);
      for (var c = 0; c < 5; c++) {
        var led = svg("rect", { x: x0 + c * step, y: y0 + r * step, width: 16, height: 16, rx: 2, class: "gb-led" });
        face.appendChild(led);
        leds[r].push(led);
      }
    }
    function key(label, cx, onPress) {
      var g = svg("g", { role: "button", tabindex: "0", "aria-label": "Button " + label });
      g.appendChild(svg("circle", { cx: cx, cy: 195, r: 17, class: "gb-key" }));
      g.appendChild(svg("text", { x: cx, y: 199, "text-anchor": "middle", class: "gb-key-label" }, label));
      g.addEventListener("click", onPress);
      g.addEventListener("keydown", function (ev) { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); onPress(); } });
      face.appendChild(g);
    }
    key("A", 40, function () { var i = MODES.map(function (m) { return m.value; }).indexOf(mode); setMode(MODES[(i + 1) % MODES.length].value); });
    key("B", W - 40, function () { setMode(mode); });
    face.appendChild(svg("text", { x: W / 2, y: 236, "text-anchor": "middle", class: "c-tick" }, "A: next mode · B: replay"));

    function paint(f) {
      for (var r = 0; r < 5; r++) for (var c = 0; c < 5; c++) leds[r][c].setAttribute("class", "gb-led" + (f[r][c] ? " on" : ""));
    }
    function stopScroll() { if (timer) { clearInterval(timer); timer = null; } }
    function play() {
      stopScroll();
      var st = badge.state();
      if (mode === "level") { frames = [E.levelFrame(st.level)]; paint(frames[0]); return; }
      var text = mode === "name" ? (name || "CAMPER") : String(st.points);
      frames = E.scrollFrames(text);
      frame = 0;
      paint(frames[0]);
      timer = setInterval(function () {
        frame += 1;
        if (frame >= frames.length) { stopScroll(); paint(frames[frames.length - 1]); return; }
        paint(frames[frame]);
      }, 110);
    }
    var modeSeg = segmented("Badge mode", MODES, mode, function (v) { setMode(v); });
    function setMode(v) { mode = v; modeSeg.set(v); play(); }

    // Controls and status
    var nameIn = el("input", { type: "text", class: "gb-input gb-name", maxlength: "12", value: name, "aria-label": "Name on the badge" });
    nameIn.addEventListener("input", function () {
      name = nameIn.value.toUpperCase().replace(/[^A-Z0-9 \-]/g, "").slice(0, 12);
      if (mode === "name") play();
    });
    var codeIn = el("input", { type: "text", class: "gb-input", inputmode: "numeric", maxlength: "4", placeholder: "0000", "aria-label": "Four-digit challenge code" });
    var submitBtn = el("button", { type: "button", class: "w-btn", text: "Enter code" });
    var solveBtn = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "Solve a challenge" });
    var guessBtn = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "Try a random code" });
    var resetBtn = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "Reset badge" });

    var stPoints = el("span"), stLevel = el("span"), stLock = el("span");
    var status = el("div", { class: "gb-status" }, [
      el("div", { class: "gb-stat" }, [el("span", { text: "Points" }), stPoints]),
      el("div", { class: "gb-stat" }, [el("span", { text: "Level" }), stLevel]),
      el("div", { class: "gb-stat" }, [el("span", { text: "Lock" }), stLock])
    ]);
    var log = el("ul", { class: "gb-log", "aria-live": "polite" });
    status.appendChild(log);

    var MSG = {
      accepted: ["gb-ok", "accepted, one point"],
      reused: ["gb-no", "already used"],
      format: ["gb-no", "needs four digits"],
      rejected: ["gb-no", "rejected"],
      "rejected-locked": ["gb-no", "rejected; three misses lock the badge for 10 s"],
      locked: ["gb-no", "badge locked"]
    };
    var t0 = Date.now();
    function now() { return (Date.now() - t0) / 1000; }
    function refresh() {
      var st = badge.state(), left = Math.max(0, st.lockedUntil - now());
      stPoints.textContent = String(st.points);
      stLevel.textContent = st.level + " of 5" + (st.level < 5 ? " (next at " + (st.level * 3) + " points)" : "");
      stLock.textContent = left > 0 ? "locked, " + Math.ceil(left) + " s" : (st.strikes ? st.strikes + " miss" + (st.strikes > 1 ? "es" : "") + " in a row" : "open");
      [submitBtn, guessBtn].forEach(function (b) { b.disabled = left > 0; });
      if (left > 0 && !lockTimer) lockTimer = setInterval(function () { refresh(); if (badge.state().lockedUntil <= now()) { clearInterval(lockTimer); lockTimer = null; refresh(); } }, 250);
    }
    function submit(code) {
      var res = badge.submit(code, now());
      var m = MSG[res.result];
      log.insertBefore(el("li", {}, [code + " ", el("span", { class: m[0], text: m[1] })]), log.firstChild);
      refresh();
      if (mode !== "name") play();
    }
    submitBtn.addEventListener("click", function () { submit(codeIn.value.trim()); });
    codeIn.addEventListener("keydown", function (ev) { if (ev.key === "Enter") submit(codeIn.value.trim()); });
    solveBtn.addEventListener("click", function () { codeIn.value = E.challengeCode(rng); codeIn.focus(); });
    guessBtn.addEventListener("click", function () {
      var c = String(Math.floor(rng() * 10000)); while (c.length < 4) c = "0" + c;
      codeIn.value = c; submit(c);
    });
    resetBtn.addEventListener("click", function () { badge.reset(); log.innerHTML = ""; refresh(); play(); });

    root.appendChild(el("div", { class: "w-actions" }, [el("span", { class: "w-mono", text: "Show:" }), modeSeg, el("span", { class: "w-mono", text: "Name:" }), nameIn]));
    root.appendChild(el("div", { class: "gb-badge-row" }, [face, status]));
    root.appendChild(el("div", { class: "w-actions" }, [codeIn, submitBtn, solveBtn, guessBtn, resetBtn]));
    root.appendChild(el("p", { class: "w-note", "data-levels": "public hs", text: "Each solved camp challenge hands you a code. Enter real codes to level up, or try random ones: most fail, and three misses in a row lock the badge for ten seconds. Watch which codes the badge accepts and see if you can spot the pattern." }));
    root.appendChild(el("p", { class: "w-note", "data-levels": "ug grad res", html: "The page's rule: a code passes when its last digit equals the sum of the first three, modulo 10, and has not been used before; one random code in ten passes. Three points make a level, up to five, and three misses in a row lock the badge for 10 seconds." }));
    root.appendChild(el("p", { class: "w-source", text: "Model of a camp badge, not the students' program · the paper lists the requirements (score, levels, LEDs, \"secure enough\") but not the code · rule, lockout, and font are the page's" }));
    refresh();
    play();
  }

  /* --------------------------------------------- demo 2: the project plan */

  function mountPlan(root) {
    var list = el("ul", { class: "gb-rows" });
    D.timeline.forEach(function (t, i) {
      var detail = el("div", { class: "gb-row-detail", hidden: "" });
      var btn = el("button", { type: "button", class: "gb-row-btn", "aria-expanded": "false" }, [
        el("span", { class: "gb-row-num", text: t.when }),
        el("span", { class: "gb-row-name", text: ["Kickoff", "Design and iterate", "Checkpoint: prototype", "Checkpoint: first camp", "Checkpoint: later camps"][i] })
      ]);
      detail.appendChild(el("p", { text: t.what + (t.units ? " (" + t.units + " working units, as printed)." : ".") }));
      if (i === 2) detail.appendChild(el("p", { text: "All ten requirements below were met at this checkpoint." }));
      btn.addEventListener("click", function () {
        var open = btn.getAttribute("aria-expanded") === "true";
        btn.setAttribute("aria-expanded", open ? "false" : "true");
        if (open) detail.setAttribute("hidden", ""); else detail.removeAttribute("hidden");
      });
      list.appendChild(el("li", { class: "gb-row" }, [btn, detail]));
    });
    root.appendChild(list);

    var chart = el("div", { class: "gb-chart" });
    root.appendChild(el("p", { class: "w-mono", text: "Units for the camps, one square each:" }));
    root.appendChild(chart);
    root.appendChild(el("div", { class: "c-legend" }, [
      el("span", { class: "gb-lg" }, [el("span", { class: "gb-sw gb-save" }), "Mid-May camp: 25"]),
      el("span", { class: "gb-lg" }, [el("span", { class: "gb-sw gb-bar" }), "June and July camps: 200"])
    ]));
    function drawUnits() {
      chart.innerHTML = "";
      var w = chartWidth(chart), cell = w < 420 ? 11 : 14, perRow = Math.floor((w - 4) / cell);
      var total = 225, rows = Math.ceil(total / perRow), h = rows * cell + 4;
      var s = svg("svg", { viewBox: "0 0 " + w + " " + h, class: "gb-svg", role: "img", "aria-label": "225 squares: 25 for the mid-May camp and 200 for the June and July camps" });
      for (var i = 0; i < total; i++) {
        var x = 2 + (i % perRow) * cell, y = 2 + Math.floor(i / perRow) * cell;
        s.appendChild(svg("rect", { x: x, y: y, width: cell - 3, height: cell - 3, class: "gb-unit" + (i < 25 ? " gb-may" : "") }));
      }
      chart.appendChild(s);
    }
    redraws.push(drawUnits);
    drawUnits();

    var req = el("div", { class: "gb-reqs" });
    root.appendChild(el("p", { class: "w-mono", text: "The ten requirements, as given to the two researchers:" }));
    D.requirements.forEach(function (q) {
      req.appendChild(el("div", { class: "gb-req" + (q.id >= 8 && q.id <= 10 ? " gb-hl" : "") }, [el("b", { text: "R" + q.id }), el("span", { text: q.text })]));
    });
    root.appendChild(req);
    root.appendChild(el("p", { class: "w-source", text: "Source: the paper's Methods (requirements, timeline, and unit counts); shaded rows are the ones the badge demo above illustrates · \"working units\" is the paper's term and is not defined" }));
  }

  /* ---------------------------------------------------- demo 3: the cost */

  function mountCost(root) {
    var c = D.cost, units = 225;
    var readout = el("p", { class: "w-big", "aria-live": "polite" });
    var chart = el("div", { class: "gb-chart" });
    var slider = el("input", { type: "range", min: "1", max: "500", step: "1", value: String(units), class: "gb-range", "aria-label": "Number of badges" });
    var presets = segmented("Run size", [
      { value: 25, label: "25 (May)" }, { value: 200, label: "200 (June–July)" }, { value: 225, label: "225 (both)" }
    ], units, function (v) { units = v; slider.value = String(v); draw(); });
    slider.addEventListener("input", function () { units = Number(slider.value); presets.set(units); draw(); });
    var totals = el("p", { class: "w-note" });
    root.appendChild(readout);
    root.appendChild(chart);
    root.appendChild(el("div", { class: "w-actions" }, [el("span", { class: "w-mono", text: "Badges:" }), slider, presets]));
    root.appendChild(totals);
    root.appendChild(el("p", { class: "w-source", text: "Per-unit prices from the paper's Results ($17.50 to $10.50, \"a 40% decrease\") · totals are the page's multiplication, assuming every badge costs the same; the paper does not report what each run cost" }));

    function draw() {
      var drop = E.pctChange(c.first, c.final);
      readout.innerHTML = "Per badge: " + money(c.first) + " → " + money(c.final) + ", <strong>" + Math.abs(drop).toFixed(0) + "% less</strong>";
      chart.innerHTML = "";
      var w = chartWidth(chart), padL = 112, padR = 70, barH = 26, gap = 14, h = 2 * barH + gap + 34;
      var max = c.first * units;
      var X = function (v) { return padL + (w - padL - padR) * v / max; };
      var s = svg("svg", { viewBox: "0 0 " + w + " " + h, class: "gb-svg", role: "img", "aria-label": "Total cost for " + units + " badges at each price" });
      [["First design", c.first, "gb-bar-old"], ["Final design", c.final, "gb-bar"]].forEach(function (row, i) {
        var y = 6 + i * (barH + gap), tot = E.batchCost(units, row[1]);
        s.appendChild(svg("text", { x: 0, y: y + barH / 2 + 4, class: "c-label" }, row[0]));
        s.appendChild(svg("rect", { x: padL, y: y, width: Math.max(1, X(tot) - padL), height: barH, class: row[2] }));
        if (i === 1) s.appendChild(svg("rect", { x: X(tot), y: y, width: Math.max(0, X(max) - X(tot)), height: barH, class: "gb-save" }));
        s.appendChild(svg("text", { x: X(tot) + 6, y: y + barH / 2 + 4, class: "gb-val" }, money(tot)));
      });
      var yAxis = 2 * barH + gap + 12;
      [0, 0.5, 1].forEach(function (f) {
        var v = max * f, x = X(v);
        s.appendChild(svg("line", { x1: x, x2: x, y1: yAxis - 6, y2: yAxis - 2, class: "c-grid" }));
        s.appendChild(svg("text", { x: x, y: yAxis + 10, "text-anchor": f === 0 ? "start" : "middle", class: "c-tick" }, money(v)));
      });
      chart.appendChild(s);
      var save = E.batchCost(units, c.first) - E.batchCost(units, c.final);
      totals.textContent = units + " badge" + (units === 1 ? "" : "s") + " at " + money(c.first) + " cost " + money(E.batchCost(units, c.first)) + "; at " + money(c.final) + ", " + money(E.batchCost(units, c.final)) + ". The redesign saves " + money(save) + " (the shaded part of the lower bar).";
    }
    redraws.push(draw);
    draw();
  }

  /* ------------------------------------------------- demo 4: the answers */

  var CLASS = { "Yes": "gb-dot-yes", "+": "gb-dot-better", "-": "gb-dot-worse", "No": "gb-dot-no", "Unknown": "gb-dot-unknown" };
  var LABEL = { "Yes": "Y", "+": "+", "-": "−", "No": "N", "Unknown": "?" };

  function mountAnswers(root) {
    var group = "peers";
    var pick = segmented("Respondents", [
      { value: "participants", label: "Two researchers (Table 1)" },
      { value: "peers", label: "Peers (Table 2)" },
      { value: "text", label: "Peers (Results text)" }
    ], group, function (v) { group = v; draw(); });
    var chart = el("div", { class: "gb-chart" });
    var note = el("p", { class: "w-note" });
    var ci = el("div", { class: "gb-chart", "data-levels": "grad res" });
    var ciNote = el("p", { class: "w-note", "data-levels": "grad res" });
    root.appendChild(el("div", { class: "w-actions" }, [el("span", { class: "w-mono", text: "Show:" }), pick]));
    root.appendChild(chart);
    root.appendChild(el("div", { class: "c-legend" }, [
      el("span", { class: "gb-lg" }, [el("span", { class: "gb-sw gb-bar" }), "Yes or better (+)"]),
      el("span", { class: "gb-lg" }, [el("span", { class: "gb-sw gb-dot-worse" }), "No or worse (−)"]),
      el("span", { class: "gb-lg" }, [el("span", { class: "gb-sw gb-dot-unknown" }), "Unknown"])
    ]));
    root.appendChild(note);
    root.appendChild(ci);
    root.appendChild(ciNote);
    root.appendChild(el("p", { class: "w-source", text: "Answers from Tables 1 and 2 and the Results text, one mark per respondent · intervals (graduate and researcher levels) are computed by the page" }));

    function rowsFor(g) {
      if (g === "participants") return D.questions.map(function (q) { return { q: q.participant, answers: D.table1[q.key] }; });
      if (g === "peers") return D.questions.map(function (q) { return { q: q.peer, answers: D.table2[q.key] }; });
      var t = D.peerText, a = [];
      for (var i = 0; i < t.asGoodOrBetter; i++) a.push("+");
      for (i = 0; i < t.worse; i++) a.push("-");
      for (i = 0; i < t.unknown; i++) a.push("Unknown");
      return [
        { q: "Enjoyable? (text: \"All students\" thought they would enjoy it; no count)", answers: null },
        { q: "As meaningful as an internship or more? (text: four of seven)", answers: a },
        { q: "Would help them stay in engineering? (text: \"Most\"; one former student explains why; no count)", answers: null }
      ];
    }

    function draw() {
      chart.innerHTML = "";
      var rows = rowsFor(group), w = chartWidth(chart), dot = 24, gapY = 16, lineH = 14;
      // Wrap question text to the width.
      var perLine = Math.max(28, Math.floor((w - 10) / 6.7));
      function wrap(t) {
        var words = t.split(" "), lines = [], cur = "";
        words.forEach(function (wd) { if ((cur + " " + wd).trim().length > perLine) { lines.push(cur.trim()); cur = wd; } else cur += " " + wd; });
        if (cur.trim()) lines.push(cur.trim());
        return lines;
      }
      var layout = rows.map(function (r) { return { r: r, lines: wrap(r.q) }; });
      var h = 4 + layout.reduce(function (s, L) { return s + L.lines.length * lineH + dot + gapY + 4; }, 0);
      var s = svg("svg", { viewBox: "0 0 " + w + " " + h, class: "gb-svg", role: "img", "aria-label": "Answers per question, one mark per respondent" });
      var y = 4;
      layout.forEach(function (L) {
        L.lines.forEach(function (ln) { y += lineH; s.appendChild(svg("text", { x: 0, y: y - 3, class: "c-label" }, ln)); });
        y += 4;
        if (!L.r.answers) {
          s.appendChild(svg("text", { x: 0, y: y + dot / 2 + 4, class: "c-tick" }, "No per-person answers in the text"));
        } else {
          L.r.answers.forEach(function (a, i) {
            var x = i * (dot + 6);
            var cls = CLASS[a] || "gb-dot-unknown";
            s.appendChild(svg("rect", { x: x + 1, y: y + 1, width: dot - 2, height: dot - 2, class: cls }));
            s.appendChild(svg("text", { x: x + dot / 2, y: y + dot / 2 + 4, "text-anchor": "middle", class: "gb-dot-txt" + (a === "Unknown" ? " gb-dark" : "") }, LABEL[a] || "?"));
          });
          var n = L.r.answers.length, k = L.r.answers.filter(function (a) { return a === "Yes" || a === "+"; }).length;
          s.appendChild(svg("text", { x: n * (dot + 6) + 6, y: y + dot / 2 + 4, class: "gb-val" }, k + " of " + n));
        }
        y += dot + gapY;
      });
      chart.appendChild(s);

      if (group === "participants") note.textContent = "Both researchers enjoyed the work and said it pushed them to continue in engineering. One rated it better than an internship; the other answered Unknown.";
      else if (group === "peers") note.textContent = "All five peers in Table 2 said the program sounds enjoyable and four of five said it would help them continue. Three of five rated it better than an internship; nobody chose \"the same\" (=).";
      else note.textContent = "The Results text counts seven students polled: four rated the program as meaningful as an internship or more, one disagreed, and two answered Unknown. Table 2 shows five peers, and the Limitations section says five took part. The page shows both versions as printed.";
      drawCI();
    }

    function drawCI() {
      ci.innerHTML = "";
      var items = [
        { label: "Peers: enjoyable (Table 2)", k: 5, n: 5 },
        { label: "Peers: would help continue (Table 2)", k: 4, n: 5 },
        { label: "Peers: better than internship (Table 2)", k: 3, n: 5 },
        { label: "Peers: as good or better (text)", k: 4, n: 7 },
        { label: "Researchers: helped continue (Table 1)", k: 2, n: 2 }
      ];
      var w = chartWidth(ci), padL = Math.min(250, w * 0.46), padR = 12, rowH = 26, h = items.length * rowH + 30;
      var X = function (p) { return padL + (w - padL - padR) * p; };
      var s = svg("svg", { viewBox: "0 0 " + w + " " + h, class: "gb-svg", role: "img", "aria-label": "95 percent intervals for each share" });
      [0, 0.25, 0.5, 0.75, 1].forEach(function (p) {
        s.appendChild(svg("line", { x1: X(p), x2: X(p), y1: 4, y2: h - 22, class: "c-grid" }));
        s.appendChild(svg("text", { x: X(p), y: h - 8, "text-anchor": "middle", class: "c-tick" }, pct(p)));
      });
      items.forEach(function (it, i) {
        var y = 14 + i * rowH, wl = E.wilson(it.k, it.n), cp = E.clopperPearson(it.k, it.n);
        s.appendChild(svg("text", { x: 0, y: y + 4, class: "c-label" }, (w < 460 ? it.label.replace("Peers: ", "").replace("Researchers: ", "R: ") : it.label) + " " + it.k + "/" + it.n));
        s.appendChild(svg("line", { x1: X(cp.lo), x2: X(cp.hi), y1: y + 6, y2: y + 6, class: "gb-ci-exact" }));
        s.appendChild(svg("line", { x1: X(wl.lo), x2: X(wl.hi), y1: y, y2: y, class: "gb-ci" }));
        s.appendChild(svg("circle", { cx: X(it.k / it.n), cy: y, r: 4, class: "gb-dot-yes" }));
      });
      ci.appendChild(s);
      var a = E.wilson(4, 5), b = E.clopperPearson(4, 5);
      ciNote.innerHTML = "Computed by the page: 95 percent Wilson intervals (solid) and exact Clopper–Pearson intervals (dashed). With five respondents, four of five is consistent with anything from " + pct(a.lo) + " to " + pct(a.hi) + " (Wilson) or " + pct(b.lo) + " to " + pct(b.hi) + " (exact) of a larger group of peers. The paper reports counts only and makes no inferential claim.";
    }
    redraws.push(draw);
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
    mount("gb-badge", mountBadge);
    mount("gb-plan", mountPlan);
    mount("gb-cost", mountCost);
    mount("gb-answers", mountAnswers);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();

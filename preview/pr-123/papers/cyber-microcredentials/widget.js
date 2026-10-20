/*
  Cybersecurity microcredential widget for /papers/cyber-microcredentials/.
  Mount points in the page: #mc-cipher, #mc-pilots, #mc-teachers, #mc-survey.

  Demo 1 is the microcredential's unplugged Caesar cipher activity (ASEE 2021).
  Demo 2 draws the three pilots from Tables 2 and 3 of the journal paper.
  Demo 3 draws Table 1 (who took part) and the reported time ranges.
  Demo 4 draws the reported survey items from both papers; at the graduate and
  researcher levels it adds intervals and an exact test computed by the page.
  All arithmetic lives in mc-engine.js.
*/
(function () {
  "use strict";

  var E = window.MicroEngine;
  var SVGNS = "http://www.w3.org/2000/svg";

  var state = {
    cipher: { text: "MEET AT THE LIBRARY AT NOON", shift: 3, mode: "encode", secret: null, guess: 0, every: false },
    pilot: 3,
    picks: { 2: [], 3: [] },
    group: "gender",
    row: 0,
    item: "q11"
  };

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

  function pct(x, d) { return (100 * x).toFixed(d === undefined ? 0 : d) + "%"; }
  function fmtP(p) { return p < 0.001 ? p.toExponential(1) : p.toFixed(2); }
  function words(n) {
    var w = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
    return n < 10 ? w[n] : String(n);
  }

  /* ---------------------------------------------------------------- demo 1: the cipher */

  var SECRETS = [
    "CONFIDENTIALITY KEEPS A MESSAGE SECRET",
    "INTEGRITY MEANS NOBODY CHANGED THE MESSAGE",
    "AVAILABILITY MEANS THE RIGHT PEOPLE CAN REACH IT",
    "SHARE THE PASSWORD WITH NOBODY",
    "THE CODE TO THE SCIENCE ROOM IS UNDER THE PLANT"
  ];

  function mountCipher(root) {
    var c = state.cipher;
    var mode = segmented("What to do", [
      { value: "encode", label: "Send a secret" },
      { value: "decode", label: "Break a secret" }
    ], c.mode, function (v) { c.mode = v; if (v === "decode" && !c.secret) newSecret(); draw(); });

    var input = el("input", { type: "text", class: "mc-input", maxlength: "80", "aria-label": "Message to encode", spellcheck: "false" });
    input.value = c.text;
    input.addEventListener("input", function () { c.text = input.value; draw(); });

    var slider = el("input", { type: "range", min: "0", max: "25", step: "1", "aria-label": "Shift key" });
    var out = el("output", { "aria-live": "polite" });
    slider.addEventListener("input", function () {
      if (c.mode === "encode") c.shift = +slider.value; else c.guess = +slider.value;
      draw();
    });
    var sliderLabel = el("span");
    var keyRow = el("label", { class: "w-range" }, [sliderLabel, slider, out]);

    var encodeBox = el("div", { class: "mc-encode" }, [
      el("label", { class: "w-mono mc-field-label", text: "Your message" }), input
    ]);
    var decodeActions = el("div", { class: "w-actions mc-decode" }, [
      el("button", { type: "button", class: "w-btn w-btn-quiet", text: "New secret message", onclick: function () { newSecret(); draw(); } }),
      el("button", { type: "button", class: "w-btn", text: "Try every key", onclick: function () { c.every = !c.every; draw(); } })
    ]);

    var wheel = el("div", { class: "mc-wheel" });
    var lines = el("div", { class: "mc-lines" });
    var arith = el("p", { class: "w-note mc-arith", "data-levels": "hs ug grad res" });
    var every = el("div", { class: "mc-every" });

    root.appendChild(el("p", { class: "w-source", text: "Unplugged activity from the microcredential's first modules (ASEE 2021): shift every letter by the same key" }));
    root.appendChild(el("div", { class: "w-actions" }, [mode]));
    root.appendChild(encodeBox);
    root.appendChild(decodeActions);
    root.appendChild(keyRow);
    root.appendChild(el("div", { class: "mc-cipher-grid" }, [wheel, el("div", {}, [lines, arith])]));
    root.appendChild(every);

    function newSecret() {
      var pick = SECRETS[Math.floor(Math.random() * SECRETS.length)];
      if (c.secret && SECRETS.length > 1) while (pick === c.secret.plain) pick = SECRETS[Math.floor(Math.random() * SECRETS.length)];
      var key = 1 + Math.floor(Math.random() * 25);
      c.secret = { plain: pick, key: key, cipher: E.caesar(pick, key) };
      c.guess = 0;
      c.every = false;
    }

    function drawWheel(shift) {
      var w = Math.min(300, chartWidth(wheel));
      var cx = w / 2, cy = w / 2, rOut = w / 2 - 14, rIn = rOut - 30;
      var s = svg("svg", { viewBox: "0 0 " + w + " " + w, class: "mc-svg", role: "img",
        "aria-label": "Cipher wheel: outer ring plain letters, inner ring the letters they become with key " + shift });
      s.appendChild(svg("circle", { cx: cx, cy: cy, r: rOut + 12, class: "mc-ring" }));
      s.appendChild(svg("circle", { cx: cx, cy: cy, r: rIn + 13, class: "mc-ring" }));
      s.appendChild(svg("circle", { cx: cx, cy: cy, r: rIn - 14, class: "mc-ring" }));
      var used = {};
      var src = c.mode === "encode" ? c.text.toUpperCase() : "";
      for (var u = 0; u < src.length; u++) used[src[u]] = true;
      for (var i = 0; i < 26; i++) {
        var a = (i / 26) * 2 * Math.PI - Math.PI / 2;
        var L = String.fromCharCode(65 + i), M = String.fromCharCode(65 + ((i + shift) % 26));
        var hot = used[L];
        s.appendChild(svg("text", { x: cx + rOut * Math.cos(a), y: cy + rOut * Math.sin(a) + 4, class: "mc-letter" + (hot ? " mc-hot" : ""), "text-anchor": "middle" }, L));
        s.appendChild(svg("text", { x: cx + rIn * Math.cos(a), y: cy + rIn * Math.sin(a) + 4, class: "mc-letter mc-inner" + (hot ? " mc-hot" : ""), "text-anchor": "middle" }, M));
      }
      s.appendChild(svg("text", { x: cx, y: cy - 2, class: "c-label", "text-anchor": "middle" }, "key"));
      s.appendChild(svg("text", { x: cx, y: cy + 16, class: "mc-key", "text-anchor": "middle" }, String(shift)));
      wheel.innerHTML = "";
      wheel.appendChild(s);
    }

    function firstLetter(text) {
      for (var i = 0; i < text.length; i++) { var ch = text[i].toUpperCase(); if (ch >= "A" && ch <= "Z") return ch; }
      return null;
    }

    function draw() {
      var enc = c.mode === "encode";
      encodeBox.style.display = enc ? "" : "none";
      decodeActions.style.display = enc ? "none" : "";
      sliderLabel.textContent = enc ? "Key (shift)" : "Your guess";
      var k = enc ? c.shift : c.guess;
      slider.value = String(k);
      out.textContent = String(k);
      drawWheel(enc ? c.shift : c.guess);

      lines.innerHTML = "";
      if (enc) {
        var ct = E.caesar(c.text, c.shift);
        lines.appendChild(el("p", { class: "w-mono", text: "Plain" }));
        lines.appendChild(el("p", { class: "mc-text", text: c.text || " " }));
        lines.appendChild(el("p", { class: "w-mono", text: "Secret (key " + c.shift + ")" }));
        lines.appendChild(el("p", { class: "mc-text mc-ct", text: ct || " " }));
        var f = firstLetter(c.text);
        if (f) {
          var p = f.charCodeAt(0) - 65, q = p + c.shift;
          arith.innerHTML = "Number the letters A = 0 to Z = 25. " + f + " is " + p + ", and " + p + " + " + c.shift + " = " + q +
            (q > 25 ? ", which wraps past Z: " + q + " − 26 = " + (q - 26) : "") +
            ", so " + f + " becomes " + String.fromCharCode(65 + (q % 26)) + ". Decoding subtracts the key.";
        } else arith.textContent = "";
        every.innerHTML = "";
      } else {
        var s = c.secret;
        var guess = E.caesar(s.cipher, -c.guess);
        var solved = c.guess === s.key;
        lines.appendChild(el("p", { class: "w-mono", text: "Intercepted secret" }));
        lines.appendChild(el("p", { class: "mc-text mc-ct", text: s.cipher }));
        lines.appendChild(el("p", { class: "w-mono", text: "Undo key " + c.guess }));
        lines.appendChild(el("p", { class: "mc-text" + (solved ? " mc-solved" : ""), text: guess }));
        lines.appendChild(el("p", { class: "mc-status", "aria-live": "polite", text: solved ? "Solved: the key was " + s.key + "." : "Not yet. Slide the guess or try every key." }));
        arith.textContent = "Only 25 keys change the message, so a code breaker can try them all in a minute with pencil and paper.";
        drawEvery(s);
      }
    }

    function drawEvery(s) {
      every.innerHTML = "";
      if (!c.every) return;
      var r = E.tryEveryKey(s.cipher);
      var tbl = el("table", { class: "mc-table" });
      tbl.appendChild(el("thead", {}, [el("tr", {}, [
        el("th", { text: "Key" }), el("th", { text: "Message with that key undone" }),
        el("th", { "data-levels": "ug grad res", text: "Distance from English (χ²)" })
      ])]));
      var body = el("tbody");
      r.rows.forEach(function (row) {
        if (row.key === 0) return;
        var tr = el("tr", { class: row.key === r.best ? "mc-best" : "" }, [
          el("td", { text: String(row.key) }),
          el("td", { class: "mc-cell-text", text: row.text }),
          el("td", { "data-levels": "ug grad res", text: row.score.toFixed(0) })
        ]);
        tr.addEventListener("click", function () { c.guess = row.key; draw(); });
        body.appendChild(tr);
      });
      tbl.appendChild(body);
      every.appendChild(el("div", { class: "mc-table-wrap" }, [tbl]));
      every.appendChild(note("The highlighted row reads most like English. Tap any row to try that key.", "public hs"));
      every.appendChild(note("The page scores each candidate with Pearson's χ² distance between its letter counts and typical English letter frequencies (Lewand, 2000) and highlights the smallest. The paper describes the activity, not this scoring; it is the standard first step toward frequency analysis.", "ug grad res"));
    }

    draw();
  }

  /* ---------------------------------------------------------------- demo 2: three pilots */

  function mountPilots(root) {
    var pick = segmented("Pilot", E.PILOTS.map(function (p) { return { value: p.id, label: "Pilot " + p.id }; }),
      state.pilot, function (v) { state.pilot = v; draw(); });
    var timeline = el("div", { class: "mc-chart" });
    var rows = el("div", { class: "mc-rows" });
    var strip = el("div", { class: "mc-strip" });
    var path = el("p", { class: "w-note mc-path", "aria-live": "polite" });
    var sel = el("p", { class: "w-note" });

    root.appendChild(el("p", { class: "w-source", text: "Tables 2 and 3 of the journal paper; cohort seasons from its Methods" }));
    root.appendChild(el("div", { class: "w-actions" }, [pick]));
    root.appendChild(timeline);
    root.appendChild(rows);
    root.appendChild(el("p", { class: "w-mono mc-strip-head", text: "Modules in this pilot (tap to build a pathway)" }));
    root.appendChild(strip);
    root.appendChild(path);
    root.appendChild(sel);

    function drawTimeline() {
      var w = chartWidth(timeline), left = w < 420 ? 64 : 84, right = 96, rowH = 30, top = 18;
      var h = top + E.PILOTS.length * rowH + 22;
      var maxD = 56, sx = function (d) { return left + (w - left - right) * d / maxD; };
      var s = svg("svg", { viewBox: "0 0 " + w + " " + h, class: "mc-svg", role: "img",
        "aria-label": "Length of each pilot in days and number of teachers" });
      var narrow = w < 420;
      (narrow ? [0, 28, 56] : [0, 14, 28, 42, 56]).forEach(function (d) {
        s.appendChild(svg("line", { x1: sx(d), x2: sx(d), y1: top - 4, y2: h - 18, class: "c-grid" }));
        s.appendChild(svg("text", { x: sx(d), y: h - 4, class: "c-tick", "text-anchor": "middle" }, d + (d === 56 ? " days" : "")));
      });
      E.PILOTS.forEach(function (p, i) {
        var y = top + i * rowH, on = p.id === state.pilot;
        s.appendChild(svg("text", { x: 0, y: y + 15, class: "c-label" }, "Pilot " + p.id));
        s.appendChild(svg("rect", { x: sx(0), y: y + 4, width: sx(p.days) - sx(0), height: 14, class: on ? "mc-bar-on" : "mc-bar" }));
        s.appendChild(svg("text", { x: sx(p.days) + 6, y: y + 15, class: "c-tick" }, p.days + " d · " + p.n + (narrow ? "" : " teachers")));
      });
      timeline.innerHTML = "";
      timeline.appendChild(s);
    }

    function row(name, value, isNew) {
      return el("div", { class: "mc-row" }, [
        el("span", { class: "mc-row-name", text: name }),
        el("span", { class: "mc-row-val", text: value }),
        el("span", { class: "mc-new", text: isNew ? "changed" : "" })
      ]);
    }

    function draw() {
      drawTimeline();
      var p = E.PILOTS[state.pilot - 1], prev = state.pilot > 1 ? E.PILOTS[state.pilot - 2] : null;
      function ch(k) { return !!prev && prev[k] !== p[k]; }
      function yn(b) { return b ? "Yes" : "No"; }
      rows.innerHTML = "";
      [
        ["Cohort", p.season + " · " + p.n + " teachers · " + p.days + " days", ch("days")],
        ["Modules", String(p.modules), ch("modules")],
        ["Required", p.required, ch("required")],
        ["Virtual office hours", p.officeHours, ch("officeHours")],
        ["Resources", p.resources, ch("resources")],
        ["Content knowledge questionnaire", yn(p.knowledge), ch("knowledge")],
        ["Attitude survey", yn(p.attitude), ch("attitude")],
        ["Focus groups and interviews", yn(p.interviews), false],
        ["Biweekly progress reports", yn(p.progress), false],
        ["Platform", "Canvas learning management system", false]
      ].forEach(function (r) { rows.appendChild(row(r[0], r[1], r[2])); });

      var names = E.PILOT_MODULES[p.id];
      var picks = state.picks[p.id] || [];
      strip.innerHTML = "";
      names.forEach(function (name, i) {
        var required = p.choose === 0 || i === 0;
        var chosen = required || picks.indexOf(i) >= 0;
        var share = E.SELECTIONS.shares[name];
        var b = el("button", { type: "button", class: "mc-mod" + (chosen ? " mc-mod-on" : "") + (required ? " mc-mod-req" : ""),
          "aria-pressed": chosen ? "true" : "false" }, [
          el("span", { class: "mc-mod-num", text: String(i) }),
          el("span", { class: "mc-mod-name", text: name }),
          share !== undefined && p.id > 1 ? el("span", { class: "mc-mod-share", "data-levels": "hs ug grad res", text: share + "% of picks" }) : null
        ]);
        if (required) b.disabled = true;
        b.addEventListener("click", function () {
          var arr = state.picks[p.id], at = arr.indexOf(i);
          if (at >= 0) arr.splice(at, 1);
          else { arr.push(i); if (arr.length > p.choose) arr.shift(); }
          draw();
        });
        strip.appendChild(b);
      });
      var chosenNames = names.filter(function (n, i) { return p.choose === 0 || i === 0 || picks.indexOf(i) >= 0; });
      if (p.choose === 0) path.textContent = "Pilot 1 had no choice: every teacher completed Module 0 and Module 1.";
      else if (picks.length < p.choose) path.textContent = "Module 0 is required. Pick " + words(p.choose - picks.length) + " more" + (picks.length ? "" : " from the other " + (names.length - 1)) + ".";
      else path.textContent = "Your pathway: " + chosenNames.join(", ") + ". Picking two of " + (names.length - 1) + " gives " + ((names.length - 1) * (names.length - 2) / 2) + " possible pathways in this pilot.";
      sel.innerHTML = p.id > 1
        ? "Figure 4 counts 48 module selections across the pilots that offered choices. The text reports two shares: abstraction drew 29% of them (14 of 48) and minimization 2% (one of 48)."
        : "Pilot 1 tested only the two modules every later pilot kept as its foundation.";
    }

    redraws.push(drawTimeline);
    draw();
  }

  /* ---------------------------------------------------------------- demo 3: the teachers */

  function mountTeachers(root) {
    var pick = segmented("Characteristic", E.DEMOGRAPHICS.map(function (g) { return { value: g.key, label: g.label }; }),
      state.group, function (v) { state.group = v; state.row = 0; draw(); });
    var rows = el("div", { class: "mc-rows" });
    var dots = el("div", { class: "mc-chart" });
    var readout = el("p", { class: "w-note", "aria-live": "polite" });
    var time = el("div", { class: "mc-chart" });

    root.appendChild(el("p", { class: "w-source", text: "Table 1 of the journal paper, 30 teachers across three cohorts" }));
    root.appendChild(el("div", { class: "w-actions" }, [pick]));
    root.appendChild(rows);
    root.appendChild(dots);
    root.appendChild(readout);
    root.appendChild(el("p", { class: "w-mono mc-strip-head", text: "Hours spent in the microcredential (journal, Figure 3)" }));
    root.appendChild(time);
    root.appendChild(note("Ranges and averages as reported; the paper does not list individual teachers' hours, so the page draws no points. The 192-hour login, likely a browser left open, was removed before the authors' correlation analysis.", "ug grad res"));

    function group() { return E.DEMOGRAPHICS.filter(function (g) { return g.key === state.group; })[0]; }

    function drawDots() {
      var g = group(), r = g.rows[state.row], bc = E.backCount(r[1], g.n);
      var w = chartWidth(dots), cols = w < 420 ? 10 : 15, rad = w < 420 ? 9 : 10, gap = 2 * rad + 6;
      var lines = Math.ceil(g.n / cols), h = lines * gap + 8;
      var s = svg("svg", { viewBox: "0 0 " + w + " " + h, class: "mc-svg", role: "img",
        "aria-label": bc.k + " of " + g.n + " teachers: " + r[0] });
      for (var i = 0; i < g.n; i++) {
        var x = rad + 4 + (i % cols) * gap, y = rad + 4 + Math.floor(i / cols) * gap;
        s.appendChild(svg("circle", { cx: x, cy: y, r: rad, class: i < bc.k ? "mc-dot-on" : "mc-dot" }));
      }
      dots.innerHTML = "";
      dots.appendChild(s);
    }

    function draw() {
      var g = group();
      rows.innerHTML = "";
      g.rows.forEach(function (r, i) {
        var bc = E.backCount(r[1], g.n);
        var b = el("button", { type: "button", class: "mc-drow" + (i === state.row ? " mc-drow-on" : ""), "aria-pressed": i === state.row ? "true" : "false" }, [
          el("span", { class: "mc-row-name", text: r[0] }),
          el("span", { class: "mc-dbar-wrap" }, [el("span", { class: "mc-dbar", style: "width:" + r[1] + "%" })]),
          el("span", { class: "mc-row-val", text: r[1] + "%" }),
          el("span", { class: "mc-row-count", "data-levels": "ug grad res", text: bc.exact ? bc.k + " of " + g.n : "no whole count" })
        ]);
        b.addEventListener("click", function () { state.row = i; draw(); });
        rows.appendChild(b);
      });
      drawDots();
      var r = g.rows[state.row], bc = E.backCount(r[1], g.n);
      var who = g.key === "csyears" ? "of the 25 teachers who reported computer science teaching" : "of " + g.n + " teachers";
      var txt = r[0] + ": " + (bc.k === 0 ? "none " + who : (bc.exact ? "" : "about ") + bc.k + " " + who) + ".";
      if (g.multi) txt += " Teachers could mark more than one answer, so these shares add to more than 100%.";
      if (!bc.exact) txt += " No whole number of the " + g.n + " teachers prints as " + r[1] + "%; the dots show the nearest count.";
      readout.textContent = txt;
    }

    function drawTime() {
      var w = chartWidth(time), left = w < 420 ? 70 : 150, right = 16, top = 10, rowH = 36;
      var h = top + 2 * rowH + 24, maxH = 200;
      var sx = function (v) { return left + (w - left - right) * v / maxH; };
      var s = svg("svg", { viewBox: "0 0 " + w + " " + h, class: "mc-svg", role: "img", "aria-label": "Ranges of hours logged and hours reported" });
      [0, 50, 100, 150, 200].forEach(function (v) {
        s.appendChild(svg("line", { x1: sx(v), x2: sx(v), y1: top, y2: h - 18, class: "c-grid" }));
        s.appendChild(svg("text", { x: sx(v), y: h - 4, class: "c-tick", "text-anchor": "middle" }, v + (v === 200 ? " h" : "")));
      });
      var narrow = w < 420;
      [[narrow ? "Logged" : "Logged in Canvas", E.TIME.lms], [narrow ? "Reported" : "Self-reported", E.TIME.self]].forEach(function (pair, i) {
        var t = pair[1], y = top + i * rowH + 14;
        s.appendChild(svg("text", { x: 0, y: y + 4, class: "c-label" }, pair[0]));
        s.appendChild(svg("line", { x1: sx(t.min), x2: sx(t.max), y1: y, y2: y, class: "mc-range" }));
        s.appendChild(svg("line", { x1: sx(t.min), x2: sx(t.min), y1: y - 6, y2: y + 6, class: "mc-range" }));
        s.appendChild(svg("line", { x1: sx(t.max), x2: sx(t.max), y1: y - 6, y2: y + 6, class: "mc-range" }));
        s.appendChild(svg("circle", { cx: sx(t.mean), cy: y, r: 5, class: "mc-mean" }));
        s.appendChild(svg("text", { x: sx(t.mean), y: y - 9, class: "c-tick", "text-anchor": "middle" }, "≈" + t.mean));
        s.appendChild(svg("text", { x: sx(t.max), y: y + 18, class: "c-tick", "text-anchor": "end" }, t.min + " to " + t.max + " h"));
      });
      time.innerHTML = "";
      time.appendChild(s);
    }

    redraws.push(drawDots, drawTime);
    draw();
    drawTime();
  }

  /* ---------------------------------------------------------------- demo 4: the surveys */

  function mountSurvey(root) {
    var pick = segmented("Survey item", E.ITEMS.map(function (it) { return { value: it.key, label: it.label }; }),
      state.item, function (v) { state.item = v; draw(); });
    var statement = el("p", { class: "w-big" });
    var source = el("p", { class: "w-source" });
    var chart = el("div", { class: "mc-chart" });
    var legend = el("div", { class: "c-legend w-mono" }, [
      el("span", { class: "lg mc-lg-agree", text: "Agree or strongly agree" }),
      el("span", { class: "lg mc-lg-ci", "data-levels": "grad res", text: "95% Wilson interval (computed by this page)" })
    ]);
    var readout = el("div", { class: "mc-readout", "aria-live": "polite" });
    var resp = el("div", { class: "mc-rows", "data-levels": "ug grad res" });

    root.appendChild(el("div", { class: "w-actions" }, [pick]));
    root.appendChild(statement);
    root.appendChild(source);
    root.appendChild(chart);
    root.appendChild(legend);
    root.appendChild(readout);
    root.appendChild(el("p", { class: "w-mono mc-strip-head", "data-levels": "ug grad res", text: "Who answered the journal survey (Methods)" }));
    root.appendChild(resp);

    E.RESPONSES.forEach(function (r) {
      resp.appendChild(el("div", { class: "mc-row" }, [
        el("span", { class: "mc-row-name", text: "Cohort " + r.cohort + " (Pilot " + r.cohort + ")" }),
        el("span", { class: "mc-row-val", text: "Before: " + r.pre + " of " + r.enrolled + " · After: " + r.post + " of " + r.enrolled }),
        el("span", { class: "mc-new" })
      ]));
    });
    resp.appendChild(el("div", { class: "mc-row" }, [
      el("span", { class: "mc-row-name", text: "Sum of cohorts" }),
      el("span", { class: "mc-row-val", text: "Before: 23 · After: 16 (the figures report 22 and 14)" }),
      el("span", { class: "mc-new" })
    ]));

    function item() { return E.ITEMS.filter(function (it) { return it.key === state.item; })[0]; }

    function draw() {
      var it = item();
      statement.textContent = "“" + it.text + "”";
      source.textContent = it.source === "journal"
        ? "Self-efficacy survey, journal Figure " + (it.key === "q11" ? 1 : 2) + " · Pilots 2 and 3 (Cohort 1 was not surveyed)"
        : "Concerns survey, ASEE 2021 · Pilots 1 and 2, before and after";
      drawChart();
      drawReadout();
    }

    function drawChart() {
      var it = item();
      var w = chartWidth(chart), left = w < 420 ? 70 : 92, right = 70, rowH = 46, top = 8;
      var h = top + it.points.length * rowH + 22;
      var sx = function (v) { return left + (w - left - right) * v; };
      var s = svg("svg", { viewBox: "0 0 " + w + " " + h, class: "mc-svg", role: "img",
        "aria-label": "Share agreeing with " + it.label + " at each administration" });
      [0, 0.25, 0.5, 0.75, 1].forEach(function (v) {
        s.appendChild(svg("line", { x1: sx(v), x2: sx(v), y1: top, y2: h - 18, class: "c-grid" }));
        s.appendChild(svg("text", { x: sx(v), y: h - 4, class: "c-tick", "text-anchor": "middle" }, Math.round(v * 100) + "%"));
      });
      it.points.forEach(function (p, i) {
        var y = top + i * rowH;
        var share = p.k !== undefined ? p.k / p.n : p.pct / 100;
        s.appendChild(svg("text", { x: 0, y: y + 14, class: "c-label" }, p.when));
        s.appendChild(svg("text", { x: 0, y: y + 28, class: "c-tick" }, "n = " + p.n));
        s.appendChild(svg("rect", { x: sx(0), y: y + 4, width: sx(share) - sx(0), height: 14, class: "mc-bar-on" }));
        s.appendChild(svg("text", { x: sx(1) + 8, y: y + 15, class: "c-label" }, p.k !== undefined ? p.k + " of " + p.n : p.pct + "%"));
        // one square per teacher, filled for agreement, where the count is known
        var k = p.k !== undefined ? p.k : E.countsFor(p.pct, p.n).rounded[0];
        var size = Math.min(10, (w - left - right) / p.n - 2);
        for (var j = 0; j < p.n; j++) {
          s.appendChild(svg("rect", { x: sx(0) + j * (size + 2), y: y + 24, width: size, height: size,
            class: k === undefined ? "mc-sq-unknown" : (j < k ? "mc-sq-on" : "mc-sq") }));
        }
        if (k !== undefined) {
          var ci = E.wilson(k, p.n);
          var g = svg("g", { "data-levels": "grad res" });
          g.appendChild(svg("line", { x1: sx(ci[0]), x2: sx(ci[1]), y1: y + 11, y2: y + 11, class: "mc-ci" }));
          g.appendChild(svg("line", { x1: sx(ci[0]), x2: sx(ci[0]), y1: y + 6, y2: y + 16, class: "mc-ci" }));
          g.appendChild(svg("line", { x1: sx(ci[1]), x2: sx(ci[1]), y1: y + 6, y2: y + 16, class: "mc-ci" }));
          s.appendChild(g);
        }
      });
      chart.innerHTML = "";
      chart.appendChild(s);
    }

    function drawReadout() {
      var it = item();
      readout.innerHTML = "";
      if (it.kind === "efficacy") {
        var a = it.points[0], b = it.points[1], f = E.fisher(a.k, a.n - a.k, b.k, b.n - b.k);
        readout.appendChild(note("Agreement rose from " + a.k + " of " + a.n + " teachers (" + a.pct + "%) before the microcredential to " + b.k + " of " + b.n + " (" + b.pct + "%) after it. Items 11 and 12 report the same counts.", "public hs ug"));
        readout.appendChild(note("Before: " + a.k + "/" + a.n + " = " + pct(a.k / a.n, 1) + "; after: " + b.k + "/" + b.n + " = " + pct(b.k / b.n, 1) + ", matching the printed 68% and 86%. " +
          "<span class=\"mc-own\">Computed by this page:</span> 95% Wilson intervals of " + pct(E.wilson(a.k, a.n)[0]) + " to " + pct(E.wilson(a.k, a.n)[1]) + " and " + pct(E.wilson(b.k, b.n)[0]) + " to " + pct(E.wilson(b.k, b.n)[1]) +
          " overlap, and Fisher's exact test on the two administrations gives a two-sided p = " + fmtP(f.twoSided) + " (one-sided " + fmtP(f.less) + "). The test treats the before and after groups as independent; many of the same teachers answered both, and the paper reports no test.", "grad res"));
      } else {
        var pts = it.points.map(function (p) { return p.pct + "% (n = " + p.n + ")"; }).join(", then ");
        readout.appendChild(note("Share agreeing: " + pts + ". Lower means fewer teachers felt concerned.", "public hs ug grad"));
        var bad = it.points.filter(function (p) { return !E.countsFor(p.pct, p.n).rounded.length; });
        var gaps = bad.length
          ? " No whole number of teachers produces " + bad.map(function (p) { return p.pct + "% of " + p.n; }).join(" or ") + "; the squares stay dashed. With the two later sample sizes swapped (n = 9, then 11, as item 9 prints them), 45% is five of 11 and 77% is closest to seven of nine (77.8%)."
          : " Every printed share matches a whole count: " + it.points.map(function (p) { return E.countsFor(p.pct, p.n).rounded[0] + " of " + p.n; }).join(", ") + ".";
        readout.appendChild(note("ASEE 2021 reports these as pre, post, and post-post shares." + gaps, "res"));
      }
    }

    redraws.push(drawChart);
    draw();
  }

  /* ---------------------------------------------------------------- mount */

  function mount(id, fn) {
    var node = document.getElementById(id);
    if (!node) return;
    fn(node);
    node.classList.add("w-ready");
  }

  function start() {
    mount("mc-cipher", mountCipher);
    mount("mc-pilots", mountPilots);
    mount("mc-teachers", mountTeachers);
    mount("mc-survey", mountSurvey);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();

/*
  Integrated outreach widget for /papers/integrated-outreach/.
  Mount points in the page: #io-lock, #io-redesign, #io-knowledge, #io-interest.

  Demo 1 is the camps' Lock-Pick lab (ASEE 2019) with the journal's
  password-strength example. Demo 2 draws the camp design: the 2018 labs and
  the four field-note themes that reshaped the 2019 camp. Demo 3 draws the 2019
  content items (n = 24 paired surveys); at the graduate and researcher levels
  it adds the paired tables consistent with each item's totals and an exact
  McNemar test, labeled as the page's own. Demo 4 draws Q10 interest and the
  camp ratings, with a check of every printed share.
  All arithmetic lives in io-engine.js.
*/
(function () {
  "use strict";

  var E = window.OutreachEngine;
  var SVGNS = "http://www.w3.org/2000/svg";

  var state = {
    lock: { alpha: "bits", len: 4, rate: 1, seed: 20190617, secret: "", show: false, tries: 0, log: [], open: false, timer: null },
    view: "labs",
    lab: 1,
    theme: 0,
    item: "q1",
    count: "students",
    dist: "interest"
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

  var WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
  function words(n) { return n < 10 ? WORDS[n] : String(n); }
  function commas(s) { return String(s).replace(/\B(?=(\d{3})+(?!\d))/g, ","); }
  function fmtP(p) { return p < 0.001 ? p.toExponential(1).replace("e-", " × 10^-") : p.toFixed(p < 0.01 ? 4 : 3); }
  function pctText(k, n, d) { return (100 * k / n).toFixed(d === undefined ? 1 : d) + "%"; }

  function duration(seconds) {
    if (!isFinite(seconds)) return "longer than the universe has existed";
    if (seconds < 1) return "less than a second";
    var units = [["year", 31557600], ["day", 86400], ["hour", 3600], ["minute", 60], ["second", 1]];
    for (var i = 0; i < units.length; i++) {
      var v = seconds / units[i][1];
      if (v >= 1) {
        if (units[i][0] === "year" && v >= 1e6) return "about " + v.toExponential(1).replace("e+", " × 10^") + " years";
        var r = v >= 10 ? Math.round(v) : Math.round(v * 10) / 10;
        return "about " + commas(r) + " " + units[i][0] + (r === 1 ? "" : "s");
      }
    }
    return "less than a second";
  }

  /* ---------------------------------------------------------------- demo 1: lock box */

  var RATES = [
    { value: 1, label: "1 per second" },
    { value: 1000, label: "1,000 per second" },
    { value: 1e9, label: "1 billion per second" }
  ];

  function mountLock(root) {
    var L = state.lock;
    var rand = E.rng(L.seed);

    function symbols() { return E.ALPHABETS[L.alpha].symbols; }
    function newBox() {
      stopSearch();
      L.secret = E.randomKey(symbols(), L.len, rand);
      L.tries = 0; L.log = []; L.open = false;
      guess.value = "";
    }

    var alpha = segmented("Key symbols", Object.keys(E.ALPHABETS).map(function (k) {
      return { value: k, label: E.ALPHABETS[k].label };
    }), L.alpha, function (v) { L.alpha = v; newBox(); draw(); });

    var lenSlider = el("input", { type: "range", min: "1", max: "12", step: "1", value: String(L.len), "aria-label": "Key length" });
    var lenOut = el("output", { "aria-live": "polite" });
    lenSlider.addEventListener("input", function () { L.len = +lenSlider.value; newBox(); draw(); });

    var rate = segmented("Guessing speed", RATES, L.rate, function (v) { L.rate = v; draw(); });

    var guess = el("input", { type: "text", class: "io-input", maxlength: "12", spellcheck: "false", autocomplete: "off", "aria-label": "Key to send" });
    guess.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); send(); } });
    var sendBtn = el("button", { type: "button", class: "w-btn", text: "Send key", onclick: send });
    var everyBtn = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "Try every key", onclick: function () { if (L.timer) stopSearch(); else search(); draw(); } });
    var newBtn = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "New lock box", onclick: function () { newBox(); draw(); } });
    var showBtn = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "Show the box's code", onclick: function () { L.show = !L.show; draw(); } });
    var paperBtn = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "The paper's password: five lowercase letters",
      onclick: function () { L.alpha = "lower"; L.len = 5; alpha.set("lower"); lenSlider.value = "5"; newBox(); draw(); } });

    var box = el("div", { class: "io-box" });
    var status = el("p", { class: "io-status", "aria-live": "polite" });
    var space = el("div", { class: "io-space" });

    root.appendChild(el("p", { class: "w-source", text: "Lab 02, Lock-Pick (ASEE 2019): send a key by radio; the box opens only for its own key" }));
    root.appendChild(el("div", { class: "io-lock-grid" }, [
      box,
      el("div", {}, [
        el("div", { class: "w-actions" }, [alpha]),
        el("label", { class: "w-range" }, [el("span", { text: "Key length" }), lenSlider, lenOut]),
        el("label", { class: "w-mono io-field-label", text: "Your guess" }),
        el("div", { class: "w-actions io-send" }, [guess, sendBtn]),
        el("div", { class: "w-actions" }, [everyBtn, newBtn, showBtn]),
        status
      ])
    ]));
    root.appendChild(space);
    var rateRow = el("div", { class: "w-actions" }, [el("span", { class: "w-mono", text: "Guessing speed (the page's illustration)" }), rate]);
    root.appendChild(rateRow);
    root.appendChild(el("div", { class: "w-actions" }, [paperBtn]));

    function send() {
      if (L.open) return;
      var g = guess.value.trim();
      var sym = symbols();
      if (g.length !== L.len || E.indexOfKey(g, sym) < 0) {
        status.textContent = "A key for this box has exactly " + words(L.len) + " symbol" + (L.len === 1 ? "" : "s") + " from " + E.ALPHABETS[L.alpha].label.toLowerCase() + ".";
        return;
      }
      L.tries++;
      L.open = g === L.secret;
      L.log.unshift(g);
      if (L.log.length > 6) L.log.pop();
      draw();
    }

    function search() {
      var sym = symbols();
      var total = E.keySpaceNumber(sym.length, L.len);
      var need = E.guessesToOpen(L.secret, sym);
      if (total > 4096) {
        L.tries = need; L.open = true; L.log = [L.secret];
        status.dataset.fast = "1";
        return;
      }
      var i = 0, step = Math.max(1, Math.ceil(need / 90));
      L.tries = 0; L.open = false;
      L.timer = setInterval(function () {
        for (var s = 0; s < step && i < need; s++) i++;
        L.tries = i;
        L.log = [E.keyAt(i - 1, sym, L.len)];
        if (i >= need) { L.open = true; stopSearch(); }
        draw();
      }, 30);
    }

    function stopSearch() { if (L.timer) { clearInterval(L.timer); L.timer = null; } }

    function drawBox() {
      box.innerHTML = "";
      var W = 260, H = 190;
      var s = svg("svg", { viewBox: "0 0 " + W + " " + H, class: "io-box-svg", role: "img",
        "aria-label": L.open ? "The lock box is open." : "The lock box is locked." });
      // servo arm: down across the lid when locked, raised when open
      s.appendChild(svg("rect", { x: 30, y: 70, width: 200, height: 100, class: "io-box-body" }));
      s.appendChild(svg("rect", { x: 30, y: L.open ? 40 : 58, width: 200, height: 12, class: "io-box-lid",
        transform: L.open ? "rotate(-14 30 52)" : "" }));
      s.appendChild(svg("circle", { cx: 205, cy: 95, r: 9, class: "io-servo" }));
      s.appendChild(svg("line", { x1: 205, y1: 95, x2: L.open ? 205 : 182, y2: L.open ? 70 : 72, class: "io-arm" }));
      // the Micro:Bit's display: key length as slots
      var sym = symbols(), slots = L.len, sw = Math.min(14, 150 / slots);
      for (var i = 0; i < slots; i++) {
        var ch = L.show ? L.secret[i] : "?";
        s.appendChild(svg("rect", { x: 46 + i * (sw + 2), y: 120, width: sw, height: 20, class: "io-slot" }));
        s.appendChild(svg("text", { x: 46 + i * (sw + 2) + sw / 2, y: 135, "text-anchor": "middle", class: "io-slot-text" }, ch));
      }
      s.appendChild(svg("text", { x: 46, y: 108, class: "c-label" }, L.show ? "code shown: key is " + L.secret : "code hidden"));
      s.appendChild(svg("text", { x: 130, y: 186, "text-anchor": "middle", class: L.open ? "io-open" : "c-tick" }, L.open ? "OPEN" : "LOCKED"));
      box.appendChild(s);
      void sym;
    }

    function draw() {
      var sym = symbols();
      var total = E.keySpaceNumber(sym.length, L.len);
      var exact = E.keySpace(sym.length, L.len);
      lenOut.textContent = String(L.len);
      guess.setAttribute("maxlength", String(L.len));
      guess.placeholder = E.keyAt(0, sym, L.len);
      everyBtn.textContent = L.timer ? "Stop" : "Try every key";
      showBtn.textContent = L.show ? "Hide the box's code" : "Show the box's code";
      drawBox();

      var fast = status.dataset.fast === "1";
      delete status.dataset.fast;
      if (L.open) {
        status.textContent = "Opened after " + commas(L.tries) + " guess" + (L.tries === 1 ? "" : "es") + (fast ? ", counted by the page; " + commas(exact) + " keys are too many to show one by one." : ".");
      } else if (L.timer) {
        status.textContent = "Trying " + L.log[0] + " (guess " + commas(L.tries) + ")";
      } else if (L.tries) {
        status.textContent = "Still locked after " + commas(L.tries) + " guess" + (L.tries === 1 ? "" : "es") + ". Last sent: " + L.log.join(", ") + ".";
      } else {
        status.textContent = "Type a key and send it, or let the page try every key in counting order.";
      }

      space.innerHTML = "";
      var avg = E.expectedGuesses(sym.length, L.len);
      var rows = [
        ["Possible keys", commas(exact), sym.length + "^" + L.len, ""],
        ["Guesses needed, at most", commas(exact), "every key once", "hs ug grad res"],
        ["Guesses needed, on average", commas(Math.round(avg * 10) / 10), "(N + 1) / 2 for a random key", "hs ug grad res"],
        ["Time at " + RATES.filter(function (r) { return r.value === L.rate; })[0].label, duration(total / L.rate), "every key, worst case", ""]
      ];
      var list = el("div", { class: "io-rows" });
      rows.forEach(function (r) {
        var row = el("div", { class: "io-row" }, [
          el("span", { class: "io-row-name", text: r[0] }),
          el("span", { class: "io-row-val", text: r[1] }),
          el("span", { class: "io-row-how", text: r[2], "data-levels": "hs ug grad res" })
        ]);
        if (r[3]) row.setAttribute("data-levels", r[3]);
        list.appendChild(row);
      });
      space.appendChild(list);
      if (sym.length === E.PASSWORD.alphabet && L.len === E.PASSWORD.length) {
        space.appendChild(note("Matches the paper: five lowercase letters give 26<sup>5</sup> = " + commas(E.PASSWORD.printed) + " combinations, the journal's password-strength example."));
      }
      space.appendChild(note("Each added symbol multiplies the keys by " + sym.length + ". Doubling the length squares the count; adding symbol types raises the base.", "ug grad res"));
    }

    newBox();
    draw();
  }

  /* ---------------------------------------------------------------- demo 2: camp design */

  function mountRedesign(root) {
    var P = E.PEOPLE;
    var timeline = el("div", { class: "io-chart" });
    var view = segmented("What to show", [
      { value: "labs", label: "The 2018 labs" },
      { value: "changes", label: "What changed for 2019" }
    ], state.view, function (v) { state.view = v; draw(); });
    var body = el("div");

    root.appendChild(el("p", { class: "w-source", text: "Three free week-long camps for pre-collegiate students: two in summer 2018, one in summer 2019" }));
    root.appendChild(timeline);
    var facts = el("div", { class: "io-rows io-facts" });
    [
      ["Students, both summers", P.students + ", ages " + P.ageMin + " to " + P.ageMax + " (mean about " + P.meanAge + ")"],
      ["Female and male", "about " + P.female + "% and " + P.male + "%"],
      ["In grades 7 and 8", "about " + P.grades78 + "%"],
      ["Younger than the advertised " + P.advertised, words(P.younger) + " students"],
      ["Paired 2019 surveys", P.paired + " students, before camp and in its final hour"]
    ].forEach(function (r) {
      facts.appendChild(el("div", { class: "io-row io-row-2" }, [el("span", { class: "io-row-name", text: r[0] }), el("span", { class: "io-row-val", text: r[1] })]));
    });
    root.appendChild(facts);
    root.appendChild(el("div", { class: "w-actions" }, [view]));
    root.appendChild(body);

    var STEPS = [
      { t: "Summer 2018", d: "Two camps", s: "labs" },
      { t: "Field notes", d: "Four themes", s: "changes" },
      { t: "Summer 2019", d: "One camp, redesigned", s: "changes" },
      { t: "Surveys", d: "24 paired", s: null }
    ];

    function drawTimeline() {
      timeline.innerHTML = "";
      var W = chartWidth(timeline), H = 74, pad = 14, step = (W - 2 * pad) / STEPS.length;
      var s = svg("svg", { viewBox: "0 0 " + W + " " + H, class: "io-svg", role: "img",
        "aria-label": "Timeline: two camps in summer 2018, field notes in four themes, one redesigned camp in summer 2019, then 24 paired surveys." });
      s.appendChild(svg("line", { x1: pad, y1: 22, x2: W - pad, y2: 22, class: "c-grid" }));
      STEPS.forEach(function (st, i) {
        var x = pad + step * i + 6;
        var on = st.s === state.view && (i !== 2 || state.view === "changes");
        s.appendChild(svg("rect", { x: x, y: 16, width: 12, height: 12, class: on ? "io-node io-node-on" : "io-node" }));
        s.appendChild(svg("text", { x: x, y: 46, class: "c-label" }, st.t));
        s.appendChild(svg("text", { x: x, y: 62, class: "c-tick" }, st.d));
      });
      timeline.appendChild(s);
    }

    function draw() {
      drawTimeline();
      body.innerHTML = "";
      if (state.view === "labs") {
        var rows = el("div", { class: "io-rows" });
        E.LABS.forEach(function (lab, i) {
          var on = state.lab === i;
          var b = el("button", { type: "button", class: "io-lrow" + (on ? " io-lrow-on" : ""), "aria-expanded": on ? "true" : "false",
            onclick: function () { state.lab = i; draw(); } }, [
            el("span", { class: "io-row-num", text: "Lab " + lab.id }),
            el("span", { class: "io-row-name", text: lab.name }),
            el("span", { class: "io-row-how", text: lab.idea })
          ]);
          rows.appendChild(b);
          if (on) rows.appendChild(el("p", { class: "w-note io-detail", text: lab.what }));
        });
        body.appendChild(rows);
        body.appendChild(note("Every lab ran on BBC Micro:Bits, pocket-sized computers programmed in block or text code. Badges with LED rings showed each student's level. The ASEE paper describes the labs; it reports no survey results.", "hs ug grad res"));
      } else {
        var t = el("div", { class: "io-rows" });
        t.appendChild(el("div", { class: "io-trow io-thead" }, [
          el("span", { text: "Theme" }), el("span", { text: "What the 2018 field notes showed" }), el("span", { text: "What the team changed for 2019" })
        ]));
        E.THEMES.forEach(function (th, i) {
          t.appendChild(el("div", { class: "io-trow" + (state.theme === i ? " io-trow-on" : "") }, [
            el("span", { class: "io-row-name", text: th.name }),
            el("span", { class: "io-row-val", text: th.saw }),
            el("span", { class: "io-row-val io-did", text: th.did })
          ]));
        });
        body.appendChild(t);
        body.appendChild(note("Field notes from the 2018 camps were sorted into these four themes; the 2019 camp then carried the new survey. Only the 2019 camp was surveyed, so the page cannot compare the two designs' outcomes.", "ug grad res"));
      }
    }

    redraws.push(drawTimeline);
    draw();
  }

  /* ---------------------------------------------------------------- demo 3: knowledge */

  function mountKnowledge(root) {
    var overview = el("div", { class: "io-chart" });
    var picker = segmented("Survey item", E.ITEMS.map(function (it) { return { value: it.key, label: it.label }; }), state.item,
      function (v) { state.item = v; draw(); });
    var countSeg = segmented("Count", [
      { value: "students", label: "Students (text)" },
      { value: "selections", label: "Selections (Figure 3)" }
    ], state.count, function (v) { state.count = v; draw(); });
    var countWrap = el("div", { class: "w-actions" }, [countSeg]);
    var question = el("p", { class: "w-big" });
    var squares = el("div", { class: "io-chart" });
    var readout = el("div", { class: "io-readout" });
    var paired = el("div", { class: "io-paired", "data-levels": "grad res" });

    root.appendChild(el("p", { class: "w-source", text: "2019 pre- and post-camp surveys, 24 students who answered both (journal, Figures 1 to 3)" }));
    root.appendChild(overview);
    root.appendChild(el("div", { class: "w-actions" }, [picker]));
    root.appendChild(question);
    root.appendChild(countWrap);
    root.appendChild(squares);
    root.appendChild(readout);
    root.appendChild(paired);

    function item() { return E.ITEMS.filter(function (it) { return it.key === state.item; })[0]; }

    function drawOverview() {
      overview.innerHTML = "";
      var W = chartWidth(overview), rowH = 30, top = 22, left = Math.min(130, W * 0.32), right = 46;
      var H = top + rowH * E.ITEMS.length + 18;
      var x = function (p) { return left + (W - left - right) * p / 100; };
      var s = svg("svg", { viewBox: "0 0 " + W + " " + H, class: "io-svg", role: "img",
        "aria-label": "Share of the 24 students answering each item correctly, before and after camp." });
      [0, 25, 50, 75, 100].forEach(function (g) {
        s.appendChild(svg("line", { x1: x(g), y1: top - 6, x2: x(g), y2: H - 18, class: "c-grid" }));
        s.appendChild(svg("text", { x: x(g), y: H - 4, "text-anchor": "middle", class: "c-tick" }, g + "%"));
      });
      s.appendChild(svg("text", { x: x(0), y: 11, class: "c-tick" }, "○ before   ● after   (of 24 students)"));
      E.ITEMS.forEach(function (it, i) {
        var y = top + rowH * i + rowH / 2;
        var g = svg("g", { class: "io-dumb" + (it.key === state.item ? " io-dumb-on" : ""), tabindex: "0", role: "button",
          "aria-label": it.label + ": " + it.pre.k + " before, " + it.post.k + " after" });
        g.appendChild(svg("rect", { x: 0, y: y - rowH / 2, width: W, height: rowH, class: "io-hit" }));
        g.appendChild(svg("text", { x: 0, y: y + 4, class: "c-label" }, it.label));
        var a = 100 * it.pre.k / E.N, b = 100 * it.post.k / E.N;
        g.appendChild(svg("line", { x1: x(a), y1: y, x2: x(b), y2: y, class: "io-dumb-line" }));
        g.appendChild(svg("circle", { cx: x(a), cy: y, r: 5, class: "io-pre" }));
        g.appendChild(svg("circle", { cx: x(b), cy: y, r: 5, class: "io-post" }));
        g.appendChild(svg("text", { x: x(b) + 9, y: y + 4, class: "c-tick" }, it.post.pct + "%"));
        g.addEventListener("click", function () { state.item = it.key; picker.set(it.key); draw(); });
        g.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); state.item = it.key; picker.set(it.key); draw(); } });
        s.appendChild(g);
      });
      overview.appendChild(s);
    }

    function drawSquares() {
      var it = item();
      squares.innerHTML = "";
      var sel = it.selections && state.count === "selections";
      var rows = sel
        ? [{ name: "Before", k: it.selections.pre.k, n: it.selections.pre.of }, { name: "After", k: it.selections.post.k, n: it.selections.post.of }]
        : [{ name: "Before", k: it.pre.k, n: E.N }, { name: "After", k: it.post.k, n: E.N }];
      var W = chartWidth(squares), left = 58, maxN = Math.max(rows[0].n, rows[1].n);
      var size = Math.max(7, Math.min(18, Math.floor((W - left - 8) / maxN) - 2));
      var gap = 2, rowH = size + 14, H = rowH * 2 + 8;
      var s = svg("svg", { viewBox: "0 0 " + W + " " + H, class: "io-svg", role: "img",
        "aria-label": it.label + ": " + rows[0].k + " of " + rows[0].n + " before, " + rows[1].k + " of " + rows[1].n + " after." });
      rows.forEach(function (r, j) {
        var y = 6 + j * rowH;
        s.appendChild(svg("text", { x: 0, y: y + size - 2, class: "c-label" }, r.name));
        for (var i = 0; i < r.n; i++) {
          s.appendChild(svg("rect", { x: left + i * (size + gap), y: y, width: size, height: size,
            class: i < r.k ? (j ? "io-sq io-sq-post" : "io-sq io-sq-pre") : "io-sq" }));
        }
      });
      squares.appendChild(s);
    }

    function draw() {
      var it = item();
      picker.set(it.key);
      question.textContent = it.text;
      countWrap.style.display = it.selections ? "" : "none";
      if (!it.selections) state.count = "students";
      countSeg.set(state.count);
      drawOverview();
      drawSquares();

      readout.innerHTML = "";
      var sel = it.selections && state.count === "selections";
      var pre = sel ? { k: it.selections.pre.k, n: it.selections.pre.of, pct: it.selections.pre.pct } : { k: it.pre.k, n: E.N, pct: it.pre.pct };
      var post = sel ? { k: it.selections.post.k, n: it.selections.post.of, pct: it.selections.post.pct } : { k: it.post.k, n: E.N, pct: it.post.pct };
      var unit = sel ? "selections" : "students";
      readout.appendChild(el("p", { class: "w-note", html: "<strong>" + pre.k + " of " + pre.n + "</strong> " + unit + " correct before camp, <strong>" + post.k + " of " + post.n + "</strong> after. Each square is one " + (sel ? "answer chosen; students could choose more than one" : "student") + "." }));
      var rowsList = el("div", { class: "io-rows", "data-levels": "ug grad res" });
      [["Before", pre], ["After", post]].forEach(function (r) {
        var c = E.check(r[1].k, r[1].n, r[1].pct);
        var how = c === "rounded" ? "matches, rounded" : c === "truncated" ? "matches only if truncated" : "matches no rounding of " + r[1].n;
        rowsList.appendChild(el("div", { class: "io-row" }, [
          el("span", { class: "io-row-name", text: r[0] + ": printed " + r[1].pct + "%" }),
          el("span", { class: "io-row-val", text: r[1].k + " / " + r[1].n + " = " + pctText(r[1].k, r[1].n) }),
          el("span", { class: c === "rounded" ? "io-row-how" : "io-row-how io-flag", text: how })
        ]));
      });
      readout.appendChild(rowsList);
      if (it.popularPre && !sel) readout.appendChild(note("Before camp the most common answer was “" + it.popularPre.label.toLowerCase() + "” (" + it.popularPre.k + " students, " + it.popularPre.pct + "%). Seven students chose each of the other answers, which makes 31 selections from 24 students.", "hs ug grad res"));
      if (it.key === "q9") readout.appendChild(note("The abstract's 22% and 69% match Figure 3's selections: 7 of 31 is 22.6% and 18 of 26 is 69.2%, while the caption prints 23% and 70%.", "grad res"));

      // paired tables (graduate and researcher)
      paired.innerHTML = "";
      var r = E.pairedRange(it.pre.k, it.post.k, E.N);
      paired.appendChild(el("p", { class: "io-own", text: "Computed by this page, not reported in the paper" }));
      paired.appendChild(note("The paper prints only the before and after totals, so several pairings of students fit them. Each row below is one: how many students were right both times, improved, declined, or were wrong both times, with the exact McNemar test on the improved and declined counts (two-sided)."));
      var wrap = el("div", { class: "io-table-wrap" });
      var tbl = el("table", { class: "io-table" });
      tbl.appendChild(el("thead", {}, [el("tr", {}, ["Right both times", "Improved", "Declined", "Wrong both times", "Exact McNemar p"].map(function (h) { return el("th", { text: h }); }))]));
      var tb = el("tbody");
      r.tables.forEach(function (t) {
        tb.appendChild(el("tr", {}, [t.both, t.improved, t.declined, t.neither, fmtP(t.p)].map(function (v) { return el("td", { text: String(v) }); })));
      });
      tbl.appendChild(tb);
      wrap.appendChild(tbl);
      paired.appendChild(wrap);
      paired.appendChild(note("Across all " + words(r.tables.length) + " pairings, p runs from " + fmtP(r.pMin) + " to " + fmtP(r.pMax) + ". At least " + r.minImproved + " of 24 students improved."));
    }

    redraws.push(function () { drawOverview(); drawSquares(); });
    draw();
  }

  /* ---------------------------------------------------------------- demo 4: interest and ratings */

  function mountInterest(root) {
    var seg = segmented("Survey question", [
      { value: "interest", label: "Interest in cybersecurity (Q10)" },
      { value: "rating", label: "Camp rating" }
    ], state.dist, function (v) { state.dist = v; draw(); });
    var chart = el("div", { class: "io-chart" });
    var legend = el("div", { class: "c-legend w-mono" });
    var readout = el("div", { class: "io-readout" });
    var heads = el("div", { class: "io-heads", "data-levels": "ug grad res" });

    root.appendChild(el("p", { class: "w-source", text: "2019 surveys, 24 paired students (journal, Figures 4 and 5)" }));
    root.appendChild(el("div", { class: "w-actions" }, [seg]));
    root.appendChild(chart);
    root.appendChild(legend);
    root.appendChild(readout);
    root.appendChild(heads);

    var LEVEL_CLASS = ["io-l0", "io-l1", "io-l2", "io-l3"];
    var RATE_CLASS = ["io-l0", "io-l0", "io-l1", "io-l2", "io-l3"];

    function rows() {
      if (state.dist === "interest") {
        return [
          { name: "Before", parts: E.INTEREST.pre.map(function (p, i) { return { k: p.k, pct: p.pct, label: E.INTEREST.levels[i], cls: LEVEL_CLASS[i] }; }) },
          { name: "After", parts: E.INTEREST.post.map(function (p, i) { return { k: p.k, pct: p.pct, label: E.INTEREST.levels[i], cls: LEVEL_CLASS[i] }; }) }
        ];
      }
      return [{ name: "Rating", parts: E.RATING.map(function (r, i) { return { k: r.k, pct: r.pct, label: r.score + " of 5", cls: RATE_CLASS[i] }; }) }];
    }

    function drawChart() {
      chart.innerHTML = "";
      var rs = rows();
      var W = chartWidth(chart), left = 58, size = Math.max(8, Math.min(22, Math.floor((W - left - 8) / E.N) - 2)), gap = 2;
      var rowH = size + 26, H = rowH * rs.length + 4;
      var s = svg("svg", { viewBox: "0 0 " + W + " " + H, class: "io-svg", role: "img",
        "aria-label": rs.map(function (r) { return r.name + ": " + r.parts.map(function (p) { return p.k + " " + p.label; }).join(", "); }).join("; ") });
      rs.forEach(function (r, j) {
        var y = 4 + j * rowH, i = 0;
        s.appendChild(svg("text", { x: 0, y: y + size - 2, class: "c-label" }, r.name));
        r.parts.forEach(function (p) {
          for (var c = 0; c < p.k; c++, i++) s.appendChild(svg("rect", { x: left + i * (size + gap), y: y, width: size, height: size, class: "io-sq " + p.cls }));
        });
        var missing = E.N - i;
        for (var m = 0; m < missing; m++, i++) s.appendChild(svg("rect", { x: left + i * (size + gap), y: y, width: size, height: size, class: "io-sq io-sq-missing" }));
        if (missing) s.appendChild(svg("text", { x: left + i * (size + gap) - gap, y: y + size + 13, "text-anchor": "end", class: "c-tick" }, missing + " not in any category"));
      });
      chart.appendChild(s);
    }

    function draw() {
      seg.set(state.dist);
      drawChart();
      legend.innerHTML = "";
      var rs = rows();
      rs[0].parts.forEach(function (p) {
        if (state.dist === "rating" && p.k === 0) return;
        legend.appendChild(el("span", { class: "lg io-lg " + p.cls, text: p.label }));
      });
      if (state.dist === "interest") legend.appendChild(el("span", { class: "lg io-lg io-sq-missing", text: "Not reported" }));

      readout.innerHTML = "";
      var list = el("div", { class: "io-rows" });
      rs.forEach(function (r) {
        r.parts.forEach(function (p) {
          if (p.pct === undefined) return;
          var c = E.check(p.k, E.N, p.pct);
          var dens = E.denominatorsFor(p.k, p.pct, 20, 31).filter(function (d) { return d.how === "rounded"; }).map(function (d) { return d.n; });
          var how = c === "rounded" ? "matches, rounded" : "no count of 24 prints this; " + p.k + " of " + (dens.join(" or ") || "none") + " does";
          list.appendChild(el("div", { class: "io-row" }, [
            el("span", { class: "io-row-name", text: (rs.length > 1 ? r.name + ", " : "") + p.label.toLowerCase() }),
            el("span", { class: "io-row-val", text: p.k + " students, printed " + p.pct + "%" }),
            el("span", { class: c === "rounded" ? "io-row-how" : "io-row-how io-flag", text: how, "data-levels": "ug grad res" })
          ]));
        });
      });
      readout.appendChild(list);
      if (state.dist === "interest") {
        readout.appendChild(note("Before camp, " + words(4) + " students were minimally interested; after camp, none were, and " + E.INTEREST.anyPost.k + " of 24 (" + E.INTEREST.anyPost.pct + "%) reported moderate or high interest. The printed categories add to 22 at both times, so two students are not placed in any category.", "hs ug grad res"));
      } else {
        readout.appendChild(note("No student rated the camp one or two. One student who gave it a three still said they would recommend it.", "hs ug grad res"));
      }

      heads.innerHTML = "";
      heads.appendChild(el("p", { class: "w-mono", text: "The abstract's headline shares, checked against the counts in the Results" }));
      var hl = el("div", { class: "io-rows" });
      var checks = {
        recall: [[8, 24, 33], [23, 24, 96]],
        threat: [[7, 31, 22], [18, 26, 69]],
        high: [[7, null, 31], [15, null, 65]]
      };
      E.ABSTRACT.forEach(function (a) {
        var txt = checks[a.key].map(function (c) {
          if (c[1]) {
            var how = E.check(c[0], c[1], c[2]);
            return c[2] + "% = " + c[0] + " of " + c[1] + (how === "rounded" ? "" : how === "truncated" ? " (truncated)" : " (no match)");
          }
          var d = E.denominatorsFor(c[0], c[2], 20, 31);
          return c[2] + "% = " + c[0] + " of " + (d.length ? d.map(function (x) { return x.n + (x.how === "truncated" ? " (truncated)" : ""); }).join(" or ") : "no n from 20 to 31");
        }).join("; ");
        hl.appendChild(el("div", { class: "io-row" }, [
          el("span", { class: "io-row-name", text: a.label + ": " + a.pre + "% to " + a.post + "%" }),
          el("span", { class: "io-row-val", text: txt }),
          el("span", { class: "io-row-how", text: a.body })
        ]));
      });
      heads.appendChild(hl);
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
    mount("io-lock", mountLock);
    mount("io-redesign", mountRedesign);
    mount("io-knowledge", mountKnowledge);
    mount("io-interest", mountInterest);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();

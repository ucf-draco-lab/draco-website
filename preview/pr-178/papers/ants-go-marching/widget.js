/*
  Ants Go Marching widget for /papers/ants-go-marching/.
  Mount points in the page: #ag-dayone, #ag-pd, #ag-knowledge, #ag-efficacy, #ag-classroom.
  Demo 1 runs the ant colony (ants-engine.js). Demos 2 to 5 draw the paper's
  tables; every derived figure (averages, shares, the permutation test) is
  computed here from those tables.
*/
(function () {
  "use strict";

  var E = window.AntsEngine;
  var SVGNS = "http://www.w3.org/2000/svg";

  /* ---------------------------------------------------------------- the paper's data */

  // Table 1 (question summaries and concepts) with Table 3 (percent correct).
  var CHECKS = [
    { id: "prepre", label: "Pre-pre", when: "Before the summer PD" },
    { id: "pre", label: "Pre", when: "Before the NetLogo session" },
    { id: "post", label: "Post", when: "Right after the NetLogo session" },
    { id: "postpost", label: "Post-post", when: "After the summer PD" }
  ];
  var QUESTIONS = [
    { id: "5", group: "base", text: "Which command queries a robot's joint state?", concept: "Syntax", scores: [6, 18, 44, 26] },
    { id: "7", group: "base", text: "Which of these illustrates sequential operation?", concept: "Control structures", scores: [39, 45, 90, 82] },
    { id: "14", group: "base", text: "Print out the numbers 1 to 10", concept: "Variables", scores: [32, 39, 55, 86] },
    { id: "17a", group: "nni", text: "Show 1,000 rolls of a fair 21-sided die", concept: "Control structures", scores: [60, 60, 68, 100] },
    { id: "17b", group: "nni", text: "Create a process to swap two numbers", concept: "Syntax", scores: [29, 55, 59, 80] },
    { id: "17c", group: "nni", text: "Take a number and add one to it", concept: "Variables", scores: [30, 35, 36, 50] },
    { id: "17d", group: "nni", text: "Report if a number is even or odd", concept: "Boolean logic", scores: [48, 53, 70, 62] }
  ];

  // Table 4: NetLogo self-efficacy, ratings 1 (not skillful) to 5 (extremely skillful).
  var EFFICACY = { pre: [5, 6, 7, 2, 2], post: [0, 1, 6, 9, 5] };

  // Table 5: session usefulness and impact (low to high).
  var IMPACT = [
    { id: "useful", label: "Session usefulness", counts: [1, 0, 6, 0, 13],
      scale: ["Negligible", "", "Moderate", "", "Large"] },
    { id: "satisfied", label: "Session satisfaction", counts: [1, 3, 2, 5, 11],
      scale: ["Completely dissatisfied", "Mostly dissatisfied", "Moderately satisfied", "Mostly satisfied", "Completely satisfied"] },
    { id: "stretched", label: "Stretched thinking into the classroom", counts: [2, 0, 8, 0, 12],
      scale: ["Low", "", "Moderate", "", "Large"] }
  ];

  // Table 2: current (and potential) classroom implementation three months after the PD.
  var SESSIONS = [
    { id: "netlogo", name: "NetLogo Naturally Inspired", short: "NetLogo", current: 10, potential: 45,
      cost: "Free", activity: "Inquiry; family science night", style: "Inquiry and explanation" },
    { id: "pi", name: "Raspberry Pi", short: "Raspberry Pi", current: 5, potential: 30,
      cost: "Under $50", activity: "Integrated project; afterschool club", style: "Lecture and inquiry" },
    { id: "vr", name: "Virtual reality", short: "Virtual reality", current: 5, potential: 25,
      cost: "$25 to $100+", activity: "Lecture and lab", style: "Lecture and inquiry" },
    { id: "arduino", name: "Arduino", short: "Arduino", current: 5, potential: 20,
      cost: "Under $50", activity: "Electricity unit", style: "Lecture and inquiry" },
    { id: "space", name: "Astronomy and space", short: "Space", current: 0, potential: 10,
      cost: "Free", activity: "Unknown", style: "Lecture and inquiry" }
  ];

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

  var resizers = [];
  var resizeTimer = null;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () { resizers.forEach(function (fn) { fn(); }); }, 150);
  });

  function pct(a, b) { return Math.round(100 * a / b) + "%"; }
  function sum(a) { return a.reduce(function (p, q) { return p + q; }, 0); }

  // A row of mutually exclusive options (radio semantics, ruled segments).
  function segmented(label, options, value, onChange, extra) {
    var wrap = el("div", { class: "seg", role: "radiogroup", "aria-label": label });
    var buttons = options.map(function (opt) {
      var b = el("button", { type: "button", class: "seg-option", role: "radio", "data-value": opt.value, text: opt.label });
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
    if (extra) wrap.classList.add(extra);
    return wrap;
  }

  function toggle(id, checked, onChange) {
    var input = el("input", { type: "checkbox", id: id });
    input.checked = !!checked;
    input.addEventListener("change", function () { onChange(input.checked); });
    var sw = el("label", { class: "ag-switch", for: id }, [input, el("span", { class: "ag-track", "aria-hidden": "true" })]);
    sw.input = input;
    return sw;
  }

  // Theme colors for the canvas, re-read whenever the site theme changes.
  function themeColors() {
    var cs = getComputedStyle(document.documentElement);
    function v(name, fallback) { var s = cs.getPropertyValue(name).trim(); return s || fallback; }
    return {
      primary: v("--primary", "#60a5fa"), accent: v("--accent", "#22d3ee"), text: v("--text", "#e0eafc"),
      background: v("--background", "#060d1f"), alt: v("--background-alt", "#0c1a36"),
      light: v("--light-gray", "#1e3a5f"), gray: v("--gray", "#6b8fc4"), dark: v("--dark-gray", "#a3c4f0")
    };
  }
  function rgb(hex) {
    var h = String(hex).replace("#", "");
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h.slice(0, 6), 16);
    if (isNaN(n)) return [128, 128, 128];
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  var themeListeners = [];
  new MutationObserver(function () { themeListeners.forEach(function (fn) { fn(); }); })
    .observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  /* ---------------------------------------------------------------- demo 1: day one */

  // Excerpts of Wilensky's Ants code (NetLogo), shown with the rule that just fired.
  var CODE = [
    { id: "ask", text: "ask turtles [" },
    { id: "waiting", text: "  if who >= ticks [ stop ]  ;; leave the nest one at a time" },
    { id: "branch", text: "  ifelse color = red [ look-for-food ] [ return-to-nest ]" },
    { id: "wiggle", text: "  wiggle  fd 1 ]" },
    { id: "", text: "to look-for-food" },
    { id: "pickup", text: "  if food > 0 [ set color orange + 1  set food food - 1  rt 180  stop ]" },
    { id: "sniff-chemical", text: "  if (chemical >= 0.05) and (chemical < 2) [ uphill-chemical ]" },
    { id: "", text: "to return-to-nest" },
    { id: "dropoff", text: "  ifelse nest? [ set color red  rt 180 ]" },
    { id: "sniff-nest", text: "  [ set chemical chemical + 60  uphill-nest-scent ]" },
    { id: "", text: "to wiggle" },
    { id: "wiggle2", text: "  rt random 40  lt random 40  if not can-move? 1 [ rt 180 ]" }
  ];

  var RULES = {
    waiting: "waiting in the nest for its turn to leave",
    pickup: "found food: picked up a crumb and turned around",
    "sniff-chemical": "smelled a trail and sniffed left, ahead, and right",
    "strong-chemical": "standing on a strong trail, so it keeps its heading",
    search: "no food and no trail here, so it keeps searching",
    dropoff: "reached the nest: dropped its crumb and turned around",
    "sniff-nest": "carrying food: left scent and sniffed for the nest"
  };

  var CHALLENGES = [
    { id: "color", n: 1, name: "Change the color of the ants",
      plain: "The simplest change: one line that sets a value.",
      concept: "Variables", code: "set color yellow" },
    { id: "piles", n: 2, name: "Add more food piles",
      plain: "Two more piles give the colony more choices.",
      concept: "Control structures (one more if per pile)", code: "if (distancexy 26 26) < 5 [ set food-source-number 4 ]" },
    { id: "energy", n: 3, name: "Introduce energy and death",
      plain: "Every step costs energy. Bringing food home refills it; an ant that runs out dies.",
      concept: "Variables and Boolean logic", code: "set energy energy - 1\nif energy <= 0 [ die ]" },
    { id: "reproduction", n: 4, name: "Introduce reproduction",
      plain: "Every second crumb delivered to the nest hatches a new ant.",
      concept: "Control structures", code: "if delivered mod 2 = 0 [ hatch 1 [ set energy 600 ] ]" },
    { id: "mutation", n: 5, name: "Introduce mutation",
      plain: "Each newborn wiggles a little more or less than its parent.",
      concept: "Variables and randomness", code: "set wiggle-angle wiggle-angle + 10 * (one-of [-1 0 1])" }
  ];

  var ANT_COLORS = [
    { value: "text", label: "Light" }, { value: "accent", label: "Accent" },
    { value: "primary", label: "Primary" }, { value: "gray", label: "Gray" }
  ];

  function mountDayOne(root) {
    var st = {
      colony: new E.Colony(), seed: 0, playing: false, speed: 2, raf: null, follow: 10, trace: null,
      antColor: "text", piles: 3, energy: false, reproduction: false, mutation: false,
      population: 125, diffusion: 50, evaporation: 10, done: false, visible: true
    };
    var colors = themeColors();

    var canvas = el("canvas", { class: "ag-canvas", role: "img", "aria-label": "Ant colony simulation" });
    var ctx = canvas.getContext("2d");
    var patchCanvas = document.createElement("canvas");
    patchCanvas.width = E.W; patchCanvas.height = E.H;
    var pctx = patchCanvas.getContext("2d");
    var img = pctx.createImageData(E.W, E.H);

    var playBtn = el("button", { type: "button", class: "w-btn", text: "Play" });
    var stepBtn = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "Step" });
    var newBtn = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "New colony" });
    var speedSeg = segmented("Speed", [{ value: 1, label: "1×" }, { value: 2, label: "4×" }, { value: 3, label: "16×" }], st.speed,
      function (v) { st.speed = v; });

    var stats = el("p", { class: "w-mono ag-stats", "aria-live": "polite" });
    var modNote = el("p", { class: "w-note mask-note" });
    var followNote = el("p", { class: "w-note ag-follow", "data-levels": "hs ug grad res" });
    var codeBox = el("pre", { class: "ag-code", "data-levels": "ug grad res", "aria-label": "NetLogo code for one ant" });
    var codeLines = CODE.map(function (line) {
      var span = el("span", { class: "ag-code-line", "data-rule": line.id, text: line.text + "\n" });
      codeBox.appendChild(span);
      return span;
    });
    var chart = el("div", { class: "ag-chart" });
    var seedIn = el("input", { type: "number", id: "ag-seed", value: "0", step: "1", min: "-2147483648", max: "2147483647" });

    function sliderRow(id, label, min, max, value, onInput, note) {
      var input = el("input", { type: "range", id: id, min: String(min), max: String(max), step: "1", value: String(value) });
      var out = el("output", { for: id, text: String(value) });
      input.addEventListener("input", function () { out.textContent = input.value; onInput(+input.value); });
      return el("div", { class: "w-range" }, [el("label", { for: id, text: label }), input, out, note ? el("span", { class: "ag-range-note", text: note }) : null]);
    }

    var sliders = el("div", { class: "ag-sliders" }, [
      sliderRow("ag-pop", "Ants", 0, 200, st.population, function (v) { st.population = v; reset(st.seed); }),
      sliderRow("ag-diff", "Scent spread (diffusion %)", 0, 99, st.diffusion, function (v) { st.diffusion = v; st.colony.setOptions({ diffusion: v }); }),
      sliderRow("ag-evap", "Scent fade (evaporation %)", 0, 99, st.evaporation, function (v) { st.evaporation = v; st.colony.setOptions({ evaporation: v }); })
    ]);

    // challenges
    var rows = {};
    var list = el("ol", { class: "ag-challenges", "aria-label": "The five PD challenges" });
    CHALLENGES.forEach(function (c) {
      var control;
      if (c.id === "color") {
        control = segmented("Ant color", ANT_COLORS, st.antColor, function (v) { st.antColor = v; updateNote(); draw(); }, "seg-small");
      } else if (c.id === "piles") {
        control = segmented("Food piles", [{ value: 3, label: "3" }, { value: 5, label: "5" }], st.piles, function (v) {
          st.piles = v; reset(st.seed);
        }, "seg-small");
      } else {
        control = toggle("ag-ch-" + c.id, false, function (on) {
          st[c.id] = on;
          if (c.id === "mutation" && on && !st.reproduction) { st.reproduction = true; rows.reproduction.control.input.checked = true; }
          if (c.id === "reproduction" && !on && st.mutation) { st.mutation = false; rows.mutation.control.input.checked = false; }
          st.colony.setOptions({ energy: st.energy, reproduction: st.reproduction, mutation: st.mutation });
          st.done = false;
          updateNote(); draw();
        });
      }
      var li = el("li", { class: "ag-challenge" }, [
        el("span", { class: "ag-ch-n", text: String(c.n) }),
        el("span", { class: "ag-ch-text" }, [
          el("span", { class: "ag-ch-name", text: c.name }),
          el("span", { class: "ag-ch-plain", text: c.plain }),
          el("span", { class: "ag-ch-concept", "data-levels": "hs ug grad res", text: "Uses: " + c.concept }),
          el("code", { class: "ag-ch-code", "data-levels": "ug grad res", text: c.code })
        ]),
        el("span", { class: "ag-ch-control" }, [control])
      ]);
      rows[c.id] = { li: li, control: control };
      list.appendChild(li);
    });

    function modified() { return st.piles !== 3 || st.energy || st.reproduction || st.mutation; }
    function updateNote() {
      CHALLENGES.forEach(function (c) {
        var on = c.id === "color" ? st.antColor !== "text" : c.id === "piles" ? st.piles !== 3 : st[c.id];
        rows[c.id].li.classList.toggle("on", !!on);
      });
      modNote.hidden = !modified();
      modNote.textContent = modified() ?
        "Running a modified model. Switch challenges 2 to 5 off to return to Wilensky's original Ants model." : "";
    }

    function reset(seed) {
      st.seed = seed | 0;
      seedIn.value = String(st.seed);
      st.colony = new E.Colony({ population: st.population, diffusion: st.diffusion, evaporation: st.evaporation,
        piles: st.piles, energy: st.energy, reproduction: st.reproduction, mutation: st.mutation });
      st.colony.setup(st.seed);
      st.trace = null; st.done = false;
      if (st.follow >= st.population) st.follow = 0;
      updateNote();
      draw();
    }

    function randomSeed() {
      try { var a = new Int32Array(1); crypto.getRandomValues(a); return a[0]; }
      catch (err) { return Math.floor(Math.random() * 2147483647); }
    }

    function tick() {
      st.trace = st.colony.go(st.follow);
      var c = st.colony;
      var foodLeft = sum(c.pileFood());
      var carrying = c.ants.some(function (a) { return a.carrying; });
      if ((!st.energy && foodLeft === 0 && !carrying) || c.ants.length === 0) {
        st.done = true;
        pause();
      }
    }

    function loop() {
      var steps = st.speed === 1 ? 1 : st.speed === 2 ? 4 : 16;
      for (var i = 0; i < steps && !st.done; i++) tick();
      draw();
      if (st.playing && st.visible) st.raf = requestAnimationFrame(loop);
      else st.raf = null;
    }
    function play() {
      if (st.done) reset(randomSeed());
      st.playing = true; playBtn.textContent = "Pause"; playBtn.classList.add("running");
      if (!st.raf) st.raf = requestAnimationFrame(loop);
    }
    function pause() {
      st.playing = false; playBtn.textContent = st.done ? "Run again" : "Play"; playBtn.classList.remove("running");
    }
    playBtn.addEventListener("click", function () { st.playing ? pause() : play(); });
    stepBtn.addEventListener("click", function () { pause(); if (!st.done) tick(); draw(); });
    newBtn.addEventListener("click", function () { reset(randomSeed()); });
    seedIn.addEventListener("change", function () { pause(); reset(parseInt(seedIn.value, 10) || 0); });

    // Pick the ant to follow by tapping the colony.
    canvas.addEventListener("click", function (ev) {
      var r = canvas.getBoundingClientRect();
      var px = (ev.clientX - r.left) / r.width * E.W + E.MINP - 0.5;
      var py = E.MAXP + 0.5 - (ev.clientY - r.top) / r.height * E.H;
      var best = null, bd = 9;
      st.colony.ants.forEach(function (a) {
        var d = (a.x - px) * (a.x - px) + (a.y - py) * (a.y - py);
        if (d < bd) { bd = d; best = a; }
      });
      if (best) { st.follow = best.who; st.trace = null; draw(); }
    });

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        st.visible = entries[0].isIntersecting;
        if (st.visible && st.playing && !st.raf) st.raf = requestAnimationFrame(loop);
      }).observe(canvas);
    }

    function draw() {
      drawColony();
      drawStats();
      drawChart();
    }

    function drawColony() {
      var c = st.colony, data = img.data;
      var bg = rgb(colors.alt), trail = rgb(colors.primary), nestC = rgb(colors.gray), foodC = rgb(colors.accent);
      for (var p = 0; p < E.NP; p++) {
        var o = p * 4, col = bg, a = 0;
        if (c.nest[p]) { col = nestC; a = 0.6; }
        else if (c.food[p] > 0) { col = foodC; a = c.food[p] === 2 ? 1 : 0.7; }
        else {
          var ch = c.chemical[p];
          if (ch > 0.1) { col = trail; a = Math.min(1, (ch - 0.1) / 4.9) * 0.75; }
        }
        data[o] = Math.round(bg[0] + (col[0] - bg[0]) * a);
        data[o + 1] = Math.round(bg[1] + (col[1] - bg[1]) * a);
        data[o + 2] = Math.round(bg[2] + (col[2] - bg[2]) * a);
        data[o + 3] = 255;
      }
      pctx.putImageData(img, 0, 0);

      var cssW = Math.min(canvas.parentNode.clientWidth || 420, 460);
      var dpr = window.devicePixelRatio || 1;
      var size = Math.round(cssW * dpr);
      if (canvas.width !== size) { canvas.width = size; canvas.height = size; }
      canvas.style.width = cssW + "px";
      canvas.style.height = cssW + "px";
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(patchCanvas, 0, 0, size, size);

      var scale = size / E.W;
      function sx(x) { return (x - E.MINP + 0.5) * scale; }
      function sy(y) { return (E.MAXP + 0.5 - y) * scale; }
      // pile numbers, matching the chart legend
      ctx.fillStyle = colors.gray;
      ctx.font = Math.round(11 * dpr) + "px " + (getComputedStyle(document.documentElement).getPropertyValue("--code") || "monospace");
      E.PILES.slice(0, c.initialFood.length).forEach(function (pl, k) {
        ctx.fillText(String(k + 1), sx(pl.x) + 6 * scale, sy(pl.y) - 4 * scale);
      });
      var searchCol = colors[st.antColor] || colors.text;
      ctx.lineCap = "round";
      ctx.lineWidth = Math.max(1.5, scale * 0.45);
      for (var i = 0; i < c.ants.length; i++) {
        var a = c.ants[i];
        var hx = E.SIN[a.heading] * 0.8, hy = E.COS[a.heading] * 0.8;
        ctx.strokeStyle = a.carrying ? colors.accent : searchCol;
        ctx.beginPath();
        ctx.moveTo(sx(a.x - hx), sy(a.y - hy));
        ctx.lineTo(sx(a.x + hx), sy(a.y + hy));
        ctx.stroke();
      }
      // the followed ant
      var f = c.ants.filter(function (a) { return a.who === st.follow; })[0];
      if (f && (window.PaperKit ? window.PaperKit.level() !== "public" : true)) {
        ctx.strokeStyle = colors.text;
        ctx.lineWidth = Math.max(1, dpr);
        ctx.beginPath();
        ctx.arc(sx(f.x), sy(f.y), scale * 2.2, 0, 2 * Math.PI);
        ctx.stroke();
      }
      canvas.setAttribute("aria-label", "Ant colony at tick " + c.ticks + ": " + c.ants.length + " ants, " +
        sum(c.pileFood()) + " pieces of food left");
    }

    function drawStats() {
      var c = st.colony, food = c.pileFood();
      var parts = ["tick " + c.ticks, c.ants.length + " ants",
        "food left " + food.map(function (v, k) { return "pile " + (k + 1) + ": " + v; }).join(", "),
        c.delivered + " crumbs home"];
      if (st.reproduction) parts.push(c.births + " hatched");
      if (st.energy) parts.push(c.deaths + " starved");
      if (st.mutation && c.ants.length) parts.push("mean wiggle " + c.meanWiggle().toFixed(1) + "°");
      stats.textContent = parts.join(" · ");
      if (st.done) stats.textContent += c.ants.length ? " · all food collected" : " · the colony died out";

      var f = c.ants.filter(function (a) { return a.who === st.follow; })[0];
      var t = st.trace;
      if (!f) { followNote.textContent = "The circled ant is gone. Tap any ant in the colony to follow it."; }
      else if (!t) { followNote.textContent = "Circled: ant " + f.who + ". Press Step to see which rule it follows; tap another ant to switch."; }
      else {
        var msg = "Ant " + f.who + ": " + (RULES[t.rule] || t.rule);
        if (t.sniff) msg += " (" + t.sniff.map(function (v) { return v.toFixed(2); }).join(", ") + ")" +
          (t.turn ? ", turned " + (t.turn > 0 ? "right" : "left") + " 45°" : ", kept its heading");
        if (t.wiggle) msg += "; wiggled right " + t.wiggle[0] + "° and left " + t.wiggle[1] + "°";
        if (t.blocked) msg += "; turned back at the edge";
        followNote.textContent = msg + ".";
      }
      var active = t ? { pickup: ["branch", "pickup"], "sniff-chemical": ["branch", "sniff-chemical"],
        "strong-chemical": ["branch"], search: ["branch"], dropoff: ["branch", "dropoff"],
        "sniff-nest": ["branch", "sniff-nest"], waiting: ["waiting"] }[t.rule] || [] : [];
      if (t && t.rule !== "waiting") active = active.concat(["wiggle", "wiggle2"]);
      codeLines.forEach(function (span) {
        span.classList.toggle("hit", active.indexOf(span.getAttribute("data-rule")) >= 0);
      });
    }

    // Food in each pile over time (NetLogo's plot), plus ants alive when the colony can change size.
    function drawChart() {
      var c = st.colony, hist = c.history, W = chartWidth(root), H = 170, L = 40, R = 12, T = 12, B = 28;
      chart.textContent = "";
      var s = svg("svg", { viewBox: "0 0 " + W + " " + H, class: "ag-food-chart", role: "img",
        "aria-label": "Food in each pile over time" });
      var tmax = Math.max(200, c.ticks);
      var showAnts = st.energy || st.reproduction;
      var ymax = 0;
      c.initialFood.forEach(function (v) { ymax = Math.max(ymax, v); });
      if (showAnts) hist.forEach(function (h) { ymax = Math.max(ymax, h.ants); });
      ymax = Math.max(10, Math.ceil(ymax / 50) * 50);
      function x(t) { return L + (W - L - R) * t / tmax; }
      function y(v) { return T + (H - T - B) * (1 - v / ymax); }
      [0, ymax / 2, ymax].forEach(function (v) {
        s.appendChild(svg("line", { x1: L, x2: W - R, y1: y(v), y2: y(v), class: "c-grid" }));
        s.appendChild(svg("text", { x: L - 6, y: y(v) + 4, class: "c-tick", "text-anchor": "end" }, String(v)));
      });
      s.appendChild(svg("text", { x: W - R, y: H - 6, class: "c-tick", "text-anchor": "end" }, "tick " + tmax));
      s.appendChild(svg("text", { x: L, y: H - 6, class: "c-tick" }, "0"));
      var step = Math.max(1, Math.floor(hist.length / 400));
      var npiles = c.initialFood.length;
      for (var k = 0; k < npiles; k++) {
        var d = "";
        for (var i = 0; i < hist.length; i += step) d += (d ? "L" : "M") + x(hist[i].t).toFixed(1) + " " + y(hist[i].food[k]).toFixed(1);
        var last = hist[hist.length - 1];
        d += "L" + x(last.t).toFixed(1) + " " + y(last.food[k]).toFixed(1);
        s.appendChild(svg("path", { d: d, class: "ag-pile ag-pile-" + (k + 1) }));
      }
      if (showAnts) {
        var da = "";
        for (var j = 0; j < hist.length; j += step) da += (da ? "L" : "M") + x(hist[j].t).toFixed(1) + " " + y(hist[j].ants).toFixed(1);
        s.appendChild(svg("path", { d: da, class: "ag-ants-line" }));
      }
      chart.appendChild(s);
      var legend = el("div", { class: "c-legend w-source" });
      for (var q = 0; q < npiles; q++) legend.appendChild(el("span", { class: "lg ag-lg-" + (q + 1), text: "Pile " + (q + 1) }));
      if (showAnts) legend.appendChild(el("span", { class: "lg ag-lg-ants", text: "Ants alive" }));
      chart.appendChild(legend);
    }

    themeListeners.push(function () { colors = themeColors(); draw(); });
    resizers.push(draw);

    root.appendChild(el("div", { class: "ag-split" }, [
      el("div", { class: "ag-stage" }, [canvas]),
      el("div", { class: "ag-side" }, [
        el("div", { class: "w-actions" }, [playBtn, stepBtn, newBtn]),
        el("div", { class: "w-actions" }, [el("span", { class: "w-mono", text: "Speed" }), speedSeg]),
        sliders,
        el("p", { class: "w-mono", "data-levels": "res" }, [el("label", { for: "ag-seed", text: "Random seed " }), seedIn]),
        el("p", { class: "w-note", text: "The gray disk is the nest and the numbered accent patches are food piles. Trails glow where ants left scent; ants carrying food turn the accent color." })
      ])
    ]));
    root.appendChild(stats);
    root.appendChild(chart);
    root.appendChild(followNote);
    root.appendChild(codeBox);
    root.appendChild(el("h3", { class: "ag-subhead", text: "The five challenges" }));
    root.appendChild(list);
    root.appendChild(modNote);

    reset(randomSeed());
  }

  /* ---------------------------------------------------------------- demo 2: the PD */

  var state = { check: 2, question: "17b", group: "all", threshold: 4, sortBy: "potential" };
  var checkListeners = [];
  function setCheck(i) { state.check = i; checkListeners.forEach(function (fn) { fn(); }); }

  function mountPD(root) {
    // 16 days as 16 cells; three of them were NetLogo days.
    var days = el("div", { class: "ag-days", role: "img",
      "aria-label": "Sixteen PD days: ten summer days and six school-year days, three of them spent on NetLogo" });
    for (var d = 0; d < 16; d++) {
      var netlogo = d === 2 || d === 3 || d === 10;
      days.appendChild(el("span", { class: "ag-day" + (d >= 10 ? " ag-day-year" : "") + (netlogo ? " ag-day-nl" : "") }));
    }
    root.appendChild(el("div", { class: "ag-days-wrap" }, [
      days,
      el("div", { class: "ag-days-key w-source" }, [
        el("span", { text: "10 summer days" }), el("span", { text: "6 school-year days" }),
        el("span", { class: "ag-key-nl", text: "NetLogo days (2 + 1)" })
      ])
    ]));
    root.appendChild(el("p", { class: "w-note", "data-levels": "ug grad res",
      text: "The figure places the summer NetLogo days for illustration; each teacher took four of the six two-day sessions in the order the PD scheduled them." }));

    var phases = [
      { kind: "check", i: 0, when: "Before the summer PD", what: "Pre-pre content assessment (seven questions)" },
      { kind: "phase", when: "Summer, 10 days", what: "Each teacher attends four of six two-day sessions: NetLogo Naturally Inspired, Astronomy and Space, Robotics, Virtual Reality, Arduinos, and Raspberry Pi." },
      { kind: "check", i: 1, when: "Before the NetLogo session", what: "Pre content assessment; self-efficacy survey (n = 22)" },
      { kind: "phase nl", when: "NetLogo session, 2 days", what: "Guided inquiry: the ant challenges, then genetic algorithms and physics-inspired optimization in Python or Sketch." },
      { kind: "check", i: 2, when: "Right after the NetLogo session", what: "Post content assessment; self-efficacy survey (n = 21); usefulness and satisfaction ratings" },
      { kind: "check", i: 3, when: "After the summer PD", what: "Post-post content assessment" },
      { kind: "phase", when: "School year, 6 days", what: "One follow-up day per session, including a NetLogo day on bio-inspired systems (flocking, schooling, ant foraging)." },
      { kind: "phase", when: "Three months after the PD", what: "Implementation survey: activities already used and planned, by session" },
      { kind: "phase", when: "Early 2019, almost three years later", what: "Two teachers describe how NetLogo fared in their classrooms" }
    ];
    var list = el("ol", { class: "ag-timeline" });
    var checkRows = [];
    phases.forEach(function (p) {
      var li = el("li", { class: "ag-tl ag-tl-" + p.kind.split(" ").join(" ag-tl-") }, [
        el("span", { class: "ag-tl-mark", "aria-hidden": "true" }),
        el("span", { class: "ag-tl-when", text: p.when }),
        el("span", { class: "ag-tl-what", text: p.what })
      ]);
      if (p.kind === "check") {
        var b = el("button", { type: "button", class: "ag-tl-pick", text: CHECKS[p.i].label, "aria-pressed": "false" });
        b.addEventListener("click", function () { setCheck(p.i); });
        li.insertBefore(b, li.children[1]);
        checkRows.push({ i: p.i, li: li, b: b });
      }
      list.appendChild(li);
    });
    root.appendChild(list);
    function sync() {
      checkRows.forEach(function (r) {
        var on = r.i === state.check;
        r.li.classList.toggle("on", on);
        r.b.setAttribute("aria-pressed", on ? "true" : "false");
      });
    }
    checkListeners.push(sync);
    sync();
    root.appendChild(el("p", { class: "w-note", text: "Pick a checkpoint to highlight it in the knowledge chart below." }));
  }

  /* ---------------------------------------------------------------- demo 3: knowledge */

  function groupMean(group, i) {
    var qs = QUESTIONS.filter(function (q) { return group === "all" || q.group === group; });
    return sum(qs.map(function (q) { return q.scores[i]; })) / qs.length;
  }

  function mountKnowledge(root) {
    var groupSeg = segmented("Questions", [
      { value: "all", label: "All seven" }, { value: "nni", label: "NetLogo session" }, { value: "base", label: "Other sessions" }
    ], state.group, function (v) { state.group = v; draw(); });
    var holder = el("div", { class: "ag-slope" });
    var readout = el("div", { class: "ag-readout" });
    var qlist = el("ul", { class: "ag-qlist" });
    var qrows = QUESTIONS.map(function (q) {
      var b = el("button", { type: "button", class: "ag-q", "aria-pressed": "false" }, [
        el("span", { class: "ag-q-id", text: "Q" + q.id }),
        el("span", { class: "ag-q-text", text: q.text }),
        el("span", { class: "ag-q-tag", text: q.group === "nni" ? "NetLogo" : "Other session" })
      ]);
      b.addEventListener("click", function () { state.question = q.id; draw(); });
      qlist.appendChild(el("li", {}, [b]));
      return { q: q, b: b };
    });

    function draw() {
      groupSeg.set(state.group);
      var W = chartWidth(root), H = 260, L = 40, R = 70, T = 16, B = 34;
      holder.textContent = "";
      var s = svg("svg", { viewBox: "0 0 " + W + " " + H, class: "ag-slope-chart", role: "img",
        "aria-label": "Percent correct on seven questions at four checkpoints" });
      function x(i) { return L + (W - L - R) * i / 3; }
      function y(v) { return T + (H - T - B) * (1 - v / 100); }
      [0, 25, 50, 75, 100].forEach(function (v) {
        s.appendChild(svg("line", { x1: L, x2: W - R, y1: y(v), y2: y(v), class: "c-grid" }));
        s.appendChild(svg("text", { x: L - 6, y: y(v) + 4, class: "c-tick", "text-anchor": "end" }, v + "%"));
      });
      s.appendChild(svg("rect", { x: x(state.check) - 14, y: T - 6, width: 28, height: H - T - B + 12, class: "ag-band" }));
      CHECKS.forEach(function (c, i) {
        var t = svg("text", { x: x(i), y: H - 12, class: "c-label", "text-anchor": i === 0 ? "start" : i === 3 ? "end" : "middle" }, c.label);
        t.style.cursor = "pointer";
        t.addEventListener("click", function () { setCheck(i); });
        s.appendChild(t);
      });
      QUESTIONS.forEach(function (q) {
        var inGroup = state.group === "all" || q.group === state.group;
        var sel = q.id === state.question;
        var d = q.scores.map(function (v, i) { return (i ? "L" : "M") + x(i).toFixed(1) + " " + y(v).toFixed(1); }).join("");
        var path = svg("path", { d: d, class: "ag-qline" + (q.group === "nni" ? " nni" : " base") + (sel ? " sel" : "") + (inGroup ? "" : " dim") });
        var hit = svg("path", { d: d, class: "ag-qhit", tabindex: "0", role: "button", "aria-label": "Question " + q.id });
        hit.addEventListener("click", function () { state.question = q.id; draw(); });
        hit.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); state.question = q.id; draw(); } });
        s.appendChild(path);
        s.appendChild(hit);
        if (inGroup || sel) {
          var lab = svg("text", { x: x(3) + 6, y: y(q.scores[3]) + 4, class: "c-tick" + (sel ? " ag-sel-label" : "") }, "Q" + q.id);
          s.appendChild(lab);
        }
      });
      // group mean (computed here)
      var meanD = CHECKS.map(function (c, i) { return (i ? "L" : "M") + x(i).toFixed(1) + " " + y(groupMean(state.group, i)).toFixed(1); }).join("");
      s.appendChild(svg("path", { d: meanD, class: "ag-mean" }));
      var sel = QUESTIONS.filter(function (q) { return q.id === state.question; })[0];
      sel.scores.forEach(function (v, i) {
        s.appendChild(svg("circle", { cx: x(i), cy: y(v), r: 4, class: "c-dot" }));
      });
      holder.appendChild(s);
      holder.appendChild(el("div", { class: "c-legend w-source" }, [
        el("span", { class: "lg ag-lg-nni", text: "NetLogo questions" }),
        el("span", { class: "lg ag-lg-base", text: "Other-session questions" }),
        el("span", { class: "lg ag-lg-mean", text: "Mean of the shown questions (computed here)" })
      ]));

      readout.textContent = "";
      readout.appendChild(el("p", { class: "w-big" }, [
        el("strong", { text: "Q" + sel.id }), " " + sel.text
      ]));
      readout.appendChild(el("p", { class: "w-mono" }, [
        CHECKS.map(function (c, i) { return c.label + " " + sel.scores[i] + "%"; }).join(" · "),
        el("span", { "data-levels": "hs ug grad res", text: " · concept: " + sel.concept }),
        el("span", { "data-levels": "ug grad res", text: " · " + (sel.group === "nni" ? "NetLogo session question" : "baseline (other-session) question") })
      ]));
      var gm = CHECKS.map(function (c, i) { return groupMean(state.group, i).toFixed(1) + "%"; });
      readout.appendChild(el("p", { class: "w-mono", "data-levels": "grad res",
        text: "Unweighted mean of the shown questions: " + gm.join(" → ") + " (computed from Table 3)" }));
      readout.appendChild(el("p", { class: "w-note" }, [
        "Highlighted checkpoint: ", el("strong", { text: CHECKS[state.check].label }), " (" + CHECKS[state.check].when.charAt(0).toLowerCase() + CHECKS[state.check].when.slice(1) + ")."
      ]));
      qrows.forEach(function (r) {
        var on = r.q.id === state.question;
        r.b.setAttribute("aria-pressed", on ? "true" : "false");
        r.b.classList.toggle("dim", !(state.group === "all" || r.q.group === state.group));
      });
    }

    root.appendChild(el("div", { class: "w-actions" }, [groupSeg]));
    root.appendChild(holder);
    root.appendChild(readout);
    root.appendChild(qlist);
    root.appendChild(el("p", { class: "w-source", text: "Source: Tables 1 and 3 of the 2019 paper (percent correct)." }));
    checkListeners.push(draw);
    resizers.push(draw);
    draw();
  }

  /* ---------------------------------------------------------------- demo 4: self-efficacy */

  // Exact permutation distribution of the post-group rating sum (pooled ratings, unpaired).
  function permutationTest(pre, post) {
    var c = pre.map(function (v, i) { return v + post[i]; });
    var n1 = sum(pre), n2 = sum(post), N = n1 + n2;
    function choose(n, k) { var r = 1; for (var i = 1; i <= k; i++) r = r * (n - k + i) / i; return r; }
    var dist = [{}]; dist[0][0] = 1;          // dist[k][s] = ways
    c.forEach(function (cnt, idx) {
      var v = idx + 1, next = [];
      for (var k = 0; k < dist.length; k++) {
        if (!dist[k]) continue;
        Object.keys(dist[k]).forEach(function (sKey) {
          var w = dist[k][sKey], s0 = +sKey;
          for (var j = 0; j <= cnt && k + j <= n2; j++) {
            var kk = k + j, ss = s0 + j * v;
            next[kk] = next[kk] || {};
            next[kk][ss] = (next[kk][ss] || 0) + w * choose(cnt, j);
          }
        });
      }
      dist = next;
    });
    var total = choose(N, n2), ways = dist[n2];
    var spre = sum(pre.map(function (v, i) { return v * (i + 1); })), spost = sum(post.map(function (v, i) { return v * (i + 1); }));
    var T = spre + spost;
    function diff(s) { return s / n2 - (T - s) / n1; }
    var obs = diff(spost), p = 0, null_ = [];
    Object.keys(ways).forEach(function (sKey) {
      var s = +sKey, w = ways[sKey] / total;
      null_.push({ d: diff(s), p: w });
      if (Math.abs(diff(s)) >= Math.abs(obs) - 1e-12) p += w;
    });
    null_.sort(function (a, b) { return a.d - b.d; });
    return { meanPre: spre / n1, meanPost: spost / n2, diff: obs, p: p, dist: null_ };
  }

  function mountEfficacy(root) {
    var thrSeg = segmented("Count ratings of at least", [
      { value: 3, label: "3 or higher" }, { value: 4, label: "4 or higher" }, { value: 5, label: "5 only" }
    ], state.threshold, function (v) { state.threshold = v; draw(); });
    var holder = el("div", { class: "ag-hist" });
    var big = el("p", { class: "w-big" });
    var stat = el("div", { class: "ag-stat", "data-levels": "grad res" });
    var impact = el("div", { class: "ag-impact" });
    var test = permutationTest(EFFICACY.pre, EFFICACY.post);

    function draw() {
      thrSeg.set(state.threshold);
      var W = chartWidth(root), H = 200, L = 36, R = 10, T = 14, B = 46;
      holder.textContent = "";
      var s = svg("svg", { viewBox: "0 0 " + W + " " + H, class: "ag-hist-chart", role: "img",
        "aria-label": "NetLogo self-efficacy ratings before and after the session" });
      var groups = [{ key: "pre", label: "Before (n = 22)" }, { key: "post", label: "After (n = 21)" }];
      var gw = (W - L - R) / 2, ymax = 10;
      function y(v) { return T + (H - T - B) * (1 - v / ymax); }
      [0, 5, 10].forEach(function (v) {
        s.appendChild(svg("line", { x1: L, x2: W - R, y1: y(v), y2: y(v), class: "c-grid" }));
        s.appendChild(svg("text", { x: L - 6, y: y(v) + 4, class: "c-tick", "text-anchor": "end" }, String(v)));
      });
      groups.forEach(function (g, gi) {
        var x0 = L + gi * gw, bw = (gw - 24) / 5;
        EFFICACY[g.key].forEach(function (count, i) {
          var rating = i + 1, bx = x0 + 8 + i * bw;
          s.appendChild(svg("rect", { x: bx + 2, y: y(count), width: Math.max(2, bw - 4), height: y(0) - y(count),
            class: "ag-bar" + (rating >= state.threshold ? " hit" : "") }));
          s.appendChild(svg("text", { x: bx + bw / 2, y: y(count) - 4, class: "c-tick", "text-anchor": "middle" }, String(count)));
          s.appendChild(svg("text", { x: bx + bw / 2, y: H - 30, class: "c-tick", "text-anchor": "middle" }, String(rating)));
        });
        s.appendChild(svg("text", { x: x0 + gw / 2, y: H - 10, class: "c-label", "text-anchor": "middle" }, g.label));
      });
      holder.appendChild(s);
      holder.appendChild(el("p", { class: "w-source", text: "Ratings: 1 = not skillful at all, 3 = average, 5 = extremely skillful. Source: Table 4." }));

      var a = sum(EFFICACY.pre.slice(state.threshold - 1)), b = sum(EFFICACY.post.slice(state.threshold - 1));
      big.textContent = "";
      big.appendChild(document.createTextNode("Rated " + (state.threshold === 5 ? "5" : state.threshold + " or higher") + ": "));
      big.appendChild(el("strong", { text: a + " of 22" }));
      big.appendChild(document.createTextNode(" before (" + pct(a, 22) + "), "));
      big.appendChild(el("strong", { text: b + " of 21" }));
      big.appendChild(document.createTextNode(" after (" + pct(b, 21) + ")"));
    }

    // grad and research: means and the exact permutation test, computed here
    stat.appendChild(el("p", { class: "w-mono", text:
      "Mean rating " + test.meanPre.toFixed(2) + " before, " + test.meanPost.toFixed(2) + " after (difference " +
      test.diff.toFixed(2) + "). Exact permutation test on the pooled 43 ratings, two-sided: p = " + test.p.toFixed(5) +
      ". Computed by this page; the paper reports counts and percentages only." }));
    var nullHolder = el("div", { "data-levels": "res" });
    stat.appendChild(nullHolder);
    function drawNull() {
      var W = chartWidth(root), H = 120, L = 10, R = 10, T = 10, B = 26;
      nullHolder.textContent = "";
      var s = svg("svg", { viewBox: "0 0 " + W + " " + H, class: "ag-null-chart", role: "img",
        "aria-label": "Permutation distribution of the difference in mean ratings" });
      var lo = test.dist[0].d, hi = test.dist[test.dist.length - 1].d;
      var span = Math.max(Math.abs(lo), Math.abs(hi), Math.abs(test.diff)) * 1.05;
      var pmax = 0; test.dist.forEach(function (q) { pmax = Math.max(pmax, q.p); });
      function x(d) { return L + (W - L - R) * (d + span) / (2 * span); }
      function y(p) { return T + (H - T - B) * (1 - p / pmax); }
      s.appendChild(svg("line", { x1: L, x2: W - R, y1: y(0), y2: y(0), class: "c-grid" }));
      test.dist.forEach(function (q) {
        s.appendChild(svg("line", { x1: x(q.d), x2: x(q.d), y1: y(0), y2: y(q.p),
          class: Math.abs(q.d) >= Math.abs(test.diff) - 1e-12 ? "ag-null hit" : "ag-null" }));
      });
      s.appendChild(svg("line", { x1: x(test.diff), x2: x(test.diff), y1: T, y2: y(0), class: "c-paper" }));
      s.appendChild(svg("text", { x: x(test.diff) - 4, y: T + 10, class: "c-tick", "text-anchor": "end" }, "observed " + test.diff.toFixed(2)));
      s.appendChild(svg("text", { x: x(0), y: H - 6, class: "c-tick", "text-anchor": "middle" }, "0"));
      s.appendChild(svg("text", { x: W - R, y: H - 6, class: "c-tick", "text-anchor": "end" }, "difference in means"));
      nullHolder.appendChild(s);
      nullHolder.appendChild(el("p", { class: "w-source", text: "Every way of splitting the 43 pooled ratings into groups of 22 and 21, weighted exactly; shaded lines are at least as extreme as the observed split." }));
    }

    // Table 5
    function drawImpact() {
      impact.textContent = "";
      impact.appendChild(el("h3", { class: "ag-subhead", text: "Usefulness and satisfaction after the session" }));
      IMPACT.forEach(function (row) {
        var n = sum(row.counts), mid = sum(row.counts.slice(2));
        var bar = el("div", { class: "ag-stack", role: "img",
          "aria-label": row.label + ": " + row.counts.join(", ") + " responses from low to high" });
        row.counts.forEach(function (cnt, i) {
          if (!cnt) return;
          var seg = el("span", { class: "ag-seg ag-seg-" + i, title: (row.scale[i] || "level " + (i + 1)) + ": " + cnt });
          seg.style.width = (100 * cnt / n) + "%";
          seg.textContent = cnt;
          bar.appendChild(seg);
        });
        impact.appendChild(el("div", { class: "ag-impact-row" }, [
          el("span", { class: "ag-impact-label", text: row.label + " (n = " + n + ")" }),
          bar,
          el("span", { class: "w-mono", text: mid + " of " + n + " moderate or higher (" + pct(mid, n) + ")" })
        ]));
      });
      impact.appendChild(el("p", { class: "w-source", text: "Low (left) to high (right). Usefulness and stretched thinking used a three-point scale, so their second and fourth columns are empty; satisfaction used five points. Source: Table 5." }));
    }

    root.appendChild(el("div", { class: "w-actions" }, [el("span", { class: "w-mono", text: "Count ratings of" }), thrSeg]));
    root.appendChild(holder);
    root.appendChild(big);
    root.appendChild(stat);
    root.appendChild(impact);
    function all() { draw(); drawNull(); drawImpact(); }
    resizers.push(all);
    all();
  }

  /* ---------------------------------------------------------------- demo 5: classroom */

  function mountClassroom(root) {
    var sortSeg = segmented("Sort sessions by", [
      { value: "potential", label: "Planned" }, { value: "current", label: "Already using" }
    ], state.sortBy, function (v) { state.sortBy = v; draw(); });
    var holder = el("div", { class: "ag-dumbbell" });
    var detail = el("div", { class: "ag-readout" });
    var selected = "netlogo";

    function draw() {
      sortSeg.set(state.sortBy);
      var rows = SESSIONS.slice().sort(function (a, b) { return b[state.sortBy] - a[state.sortBy] || b.potential - a.potential; });
      var W = chartWidth(root), rowH = 34, T = 22, B = 26, L = Math.min(150, W * 0.36), R = 16, H = T + B + rowH * rows.length;
      holder.textContent = "";
      var s = svg("svg", { viewBox: "0 0 " + W + " " + H, class: "ag-db-chart", role: "img",
        "aria-label": "Share of teachers already using and planning to use each session's activities" });
      function x(v) { return L + (W - L - R) * v / 50; }
      [0, 10, 20, 30, 40, 50].forEach(function (v) {
        s.appendChild(svg("line", { x1: x(v), x2: x(v), y1: T - 6, y2: H - B + 4, class: "c-grid" }));
        s.appendChild(svg("text", { x: x(v), y: H - 8, class: "c-tick", "text-anchor": "middle" }, v + "%"));
      });
      rows.forEach(function (r, i) {
        var cy = T + rowH * i + rowH / 2;
        var g = svg("g", { class: "ag-db-row" + (r.id === "netlogo" ? " nl" : "") + (r.id === selected ? " sel" : ""), tabindex: "0", role: "button",
          "aria-label": r.name + ": " + r.current + "% already using, " + r.potential + "% planning" });
        g.appendChild(svg("rect", { x: 0, y: cy - rowH / 2, width: W, height: rowH, class: "ag-db-hit" }));
        g.appendChild(svg("text", { x: L - 10, y: cy + 4, class: "c-label", "text-anchor": "end" }, r.short));
        g.appendChild(svg("line", { x1: x(r.current), x2: x(r.potential), y1: cy, y2: cy, class: "ag-db-line" }));
        g.appendChild(svg("circle", { cx: x(r.current), cy: cy, r: 5, class: "ag-db-now" }));
        g.appendChild(svg("circle", { cx: x(r.potential), cy: cy, r: 5, class: "ag-db-plan" }));
        g.appendChild(svg("text", { x: x(r.potential) + 9, y: cy + 4, class: "c-tick" }, r.potential + "%"));
        g.addEventListener("click", function () { selected = r.id; draw(); });
        g.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); selected = r.id; draw(); } });
        s.appendChild(g);
      });
      s.appendChild(svg("text", { x: L, y: 12, class: "c-tick" }, "share of teachers, three months after the PD"));
      holder.appendChild(s);
      holder.appendChild(el("div", { class: "c-legend w-source" }, [
        el("span", { class: "lg ag-lg-now", text: "Already using" }), el("span", { class: "lg ag-lg-plan", text: "Planning to use" })
      ]));

      var r0 = SESSIONS.filter(function (r) { return r.id === selected; })[0];
      detail.textContent = "";
      detail.appendChild(el("p", { class: "w-big" }, [el("strong", { text: r0.name }), " · " + r0.current + "% already using, " + r0.potential + "% planning to"]));
      detail.appendChild(el("p", { class: "w-mono" }, [
        "Cost " + r0.cost + " · planned activity: " + r0.activity,
        el("span", { "data-levels": "hs ug grad res", text: " · session format: " + r0.style.toLowerCase() })
      ]));
    }

    root.appendChild(el("div", { class: "w-actions" }, [el("span", { class: "w-mono", text: "Sort by" }), sortSeg]));
    root.appendChild(holder);
    root.appendChild(detail);
    root.appendChild(el("p", { class: "w-source", text: "Source: Table 2. The table lists five of the six sessions; robotics does not appear." }));
    resizers.push(draw);
    draw();
  }

  /* ---------------------------------------------------------------- start */

  var mounts = { "ag-dayone": E ? mountDayOne : null, "ag-pd": mountPD, "ag-knowledge": mountKnowledge,
    "ag-efficacy": mountEfficacy, "ag-classroom": mountClassroom };
  Object.keys(mounts).forEach(function (id) {
    var node = document.getElementById(id);
    if (node && mounts[id]) { node.textContent = ""; node.classList.add("w-ready"); mounts[id](node); }
  });
  document.addEventListener("paperlevel", function () { resizers.forEach(function (fn) { fn(); }); });
})();

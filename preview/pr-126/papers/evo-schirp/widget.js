/*
  EVO-SCHIRP widget for /papers/evo-schirp/.
  Mount points: #ev-schedule, #ev-encode, #ev-evolve, #ev-cliques.
  Demos 1 and 2 share one schedule; demo 3 can hand its best schedule to them.
  Everything is computed by evo-engine.js in the browser; nothing is fetched.
*/
(function () {
  "use strict";

  var E = window.EvoEngine;
  if (!E) return;

  var SVGNS = "http://www.w3.org/2000/svg";
  var IDLE = E.IDLE;

  /* ------------------------------------------------------------ shared state */

  var state = { n: 5, kind: "chirp", M: E.chirp(5), seed: 1, evolved: {} };
  var listeners = [];
  function onSchedule(fn) { listeners.push(fn); }
  function setSchedule(n, kind, M) {
    state.n = n; state.kind = kind; state.M = M;
    listeners.forEach(function (fn) { fn(); });
  }

  /* ------------------------------------------------------------ helpers */

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
    if (text != null) node.textContent = text;
    return node;
  }
  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }
  function chartWidth(node) {
    var w = node && node.parentNode ? node.parentNode.clientWidth : 640;
    return Math.max(300, Math.min(760, w || 640));
  }
  var resizers = [];
  var resizeTimer = null;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () { resizers.forEach(function (fn) { fn(); }); }, 150);
  });

  function seg(options, value, onPick, label) {
    var wrap = el("div", { class: "seg", role: "radiogroup", "aria-label": label });
    var btns = options.map(function (o) {
      var b = el("button", { type: "button", class: "seg-option", role: "radio", "aria-checked": String(o.value === value), text: o.label });
      if (o.levels) b.setAttribute("data-levels", o.levels);
      if (o.title) b.title = o.title;
      b.addEventListener("click", function () { if (b.disabled) return; set(o.value); onPick(o.value); });
      wrap.appendChild(b);
      return b;
    });
    function set(v) { btns.forEach(function (b, i) { b.setAttribute("aria-checked", String(options[i].value === v)); }); }
    wrap.set = set;
    wrap.buttons = btns;
    return wrap;
  }
  function range(label, min, max, value, onInput) {
    var input = el("input", { type: "range", min: min, max: max, step: 1, value: value, "aria-label": label });
    var out = el("output", { text: String(value) });
    input.addEventListener("input", function () { out.textContent = input.value; onInput(+input.value); });
    var wrap = el("label", { class: "w-range" }, [el("span", { text: label }), input, out]);
    wrap.set = function (v) { input.value = v; out.textContent = String(v); };
    return wrap;
  }
  function fact(dl, term, levels) {
    var dt = el("dt", { text: term }), dd = el("dd");
    if (levels) { dt.setAttribute("data-levels", levels); dd.setAttribute("data-levels", levels); }
    dl.appendChild(dt); dl.appendChild(dd);
    return dd;
  }
  var WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
  function num(k) { return k < 10 && k >= 0 ? WORDS[k] : String(k); }
  function cellText(v) { return v === IDLE ? "*" : String(v); }
  function ring(n, cx, cy, R) {
    var pts = [];
    for (var i = 0; i < n; i++) {
      var a = -Math.PI / 2 + 2 * Math.PI * i / n;
      pts.push({ x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) });
    }
    return pts;
  }
  /* Yield to the browser between chunks of work. */
  function later(fn) { setTimeout(fn, 0); }

  /* Best evolved schedule for n agents (single clique, unique encoding).
     Cached so demos 1 and 2 agree; demo 3 replaces it after a run. */
  function evolvedFor(n) {
    if (state.evolved[n]) return state.evolved[n];
    var ev = E.evolver({ n: n, layers: 5, encoding: "unique", seed: 1 }), last;
    while (!ev.done()) last = ev.next();
    var M = last.best.matrices[0];
    state.evolved[n] = M;
    return M;
  }
  function randomFor(n, seed) {
    var rand = E.rng(1000 + seed * 31 + n), raw = [];
    for (var r = 0; r < n; r++) { var row = []; for (var i = 0; i < n; i++) row.push(rand.int(n)); raw.push(row); }
    return E.normalize(raw);
  }
  function scheduleFor(n, kind) {
    if (kind === "chirp") return E.chirp(n);
    if (kind === "random") return randomFor(n, state.seed);
    return evolvedFor(n);
  }

  function matrixTable(M, opts) {
    opts = opts || {};
    var n = M[0].length;
    var head = el("tr", null, [el("th", { text: opts.corner || "Round" })]);
    for (var i = 0; i < n; i++) head.appendChild(el("th", { text: "A" + i, title: "Agent " + i }));
    var body = el("tbody");
    M.forEach(function (row, r) {
      var tr = el("tr", { class: opts.round === r ? "ev-now" : "" }, [el("td", { text: String(r + 1) })]);
      row.forEach(function (v, i) {
        var td = el("td", { text: typeof v === "number" ? cellText(v) : v });
        if (opts.classify) td.className = opts.classify(r, i, v) || "";
        tr.appendChild(td);
      });
      body.appendChild(tr);
    });
    var t = el("table", { class: "results-table ev-matrix" }, [el("thead", null, [head]), body]);
    return el("div", { class: "ev-table-block" }, [opts.caption ? el("p", { class: "w-note", text: opts.caption }) : null, el("div", { class: "ev-table-wrap" }, [t])]);
  }

  /* Cell class in a unique matrix: mutual pair, one-sided, or idle. */
  function cellClass(M) {
    return function (r, i, v) {
      if (v === IDLE) return "ev-idle";
      return M[r][v] === i ? "ev-pair" : "ev-oneway";
    };
  }

  /* ------------------------------------------------------------ demo 1: the handshake schedule */

  function mountSchedule(root) {
    var sim = { r: -1, timer: null };
    var size = range("Agents", 3, 12, state.n, function (v) { stop(); setSchedule(v, state.kind, scheduleFor(v, state.kind)); });
    var kind = seg([
      { value: "chirp", label: "CHIRP rule" },
      { value: "random", label: "Random" },
      { value: "evolved", label: "Evolved" }
    ], state.kind, function (v) { stop(); setSchedule(state.n, v, scheduleFor(state.n, v)); }, "Schedule");
    var reroll = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "New random" });
    var play = el("button", { type: "button", class: "w-btn", text: "Play" });
    var step = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "Next round" });
    var reset = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "Start over" });
    var chart = svg("svg", { class: "ev-ring", role: "img", "aria-label": "Agents on a circle; lines show who talks to whom" });
    var big = el("p", { class: "w-big", "aria-live": "polite" });
    var dl = el("dl", { class: "ev-facts" });
    var ddRound = fact(dl, "This round");
    var ddGoals = fact(dl, "The three goals", "hs ug grad res");
    var ddScore = fact(dl, "Fitness (paper's three counts)", "ug grad res");
    var tableHolder = el("div", { "data-levels": "hs ug grad res" });

    root.appendChild(el("div", { class: "w-actions" }, [size]));
    root.appendChild(el("div", { class: "w-actions" }, [kind, reroll]));
    root.appendChild(el("div", { class: "w-actions" }, [play, step, reset]));
    root.appendChild(chart);
    root.appendChild(big);
    root.appendChild(dl);
    root.appendChild(tableHolder);
    root.appendChild(el("p", { class: "w-note", text: "Computed by this page. Solid lines are handshakes both agents agreed to; dashed arrows are calls the other agent did not return. \"Evolved\" is the best schedule from one 25-generation run of this page's evolution (50 networks, five layers, seed 1)." }));

    reroll.addEventListener("click", function () {
      stop(); state.seed++;
      kind.set("random");
      setSchedule(state.n, "random", randomFor(state.n, state.seed));
    });
    function stop() { if (sim.timer) { clearInterval(sim.timer); sim.timer = null; play.textContent = "Play"; play.classList.remove("running"); } }
    function advance() {
      if (sim.r >= state.n - 1) { stop(); return; }
      sim.r++; draw();
      if (sim.r >= state.n - 1) stop();
    }
    play.addEventListener("click", function () {
      if (sim.timer) { stop(); return; }
      if (sim.r >= state.n - 1) sim.r = -1;
      advance();
      sim.timer = setInterval(advance, 900);
      play.textContent = "Pause"; play.classList.add("running");
    });
    step.addEventListener("click", function () { stop(); if (sim.r >= state.n - 1) sim.r = -1; advance(); });
    reset.addEventListener("click", function () { stop(); sim.r = -1; draw(); });

    function draw() {
      var M = state.M, n = state.n, W = chartWidth(chart), H = Math.min(360, Math.max(260, W * 0.5));
      chart.setAttribute("viewBox", "0 0 " + W + " " + H);
      clear(chart);
      var R = Math.min(W, H) / 2 - 28, pts = ring(n, W / 2, H / 2, R);
      var met = {}, metCount = 0;
      for (var r = 0; r <= sim.r; r++) for (var a = 0; a < n; a++) {
        var t = M[r][a];
        if (t > a && M[r][t] === a && !met[a * n + t]) { met[a * n + t] = r; metCount++; }
      }
      var defs = svg("defs");
      var marker = svg("marker", { id: "ev-arrow", viewBox: "0 0 10 10", refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: "auto-start-reverse" });
      marker.appendChild(svg("path", { d: "M0,0 L10,5 L0,10 z", class: "ev-arrowhead" }));
      defs.appendChild(marker);
      chart.appendChild(defs);
      Object.keys(met).forEach(function (k) {
        var a = Math.floor(k / n), b = k % n;
        chart.appendChild(svg("line", { x1: pts[a].x, y1: pts[a].y, x2: pts[b].x, y2: pts[b].y, class: "ev-edge" }));
      });
      if (sim.r >= 0) {
        var row = M[sim.r];
        row.forEach(function (t, a) {
          if (t === IDLE) return;
          if (row[t] === a) {
            if (t > a) chart.appendChild(svg("line", { x1: pts[a].x, y1: pts[a].y, x2: pts[t].x, y2: pts[t].y, class: "ev-edge-now" }));
          } else {
            var dx = pts[t].x - pts[a].x, dy = pts[t].y - pts[a].y, L = Math.sqrt(dx * dx + dy * dy) || 1, s = 16 / L;
            chart.appendChild(svg("line", { x1: pts[a].x + dx * s, y1: pts[a].y + dy * s, x2: pts[t].x - dx * s, y2: pts[t].y - dy * s, class: "ev-edge-oneway", "marker-end": "url(#ev-arrow)" }));
          }
        });
      }
      pts.forEach(function (p, i) {
        var ti = sim.r >= 0 ? M[sim.r][i] : IDLE;
        var idle = sim.r >= 0 && (ti === IDLE || M[sim.r][ti] !== i);
        var g = svg("g", { class: "ev-node" + (idle ? " ev-node-idle" : "") });
        g.appendChild(svg("circle", { cx: p.x, cy: p.y, r: 14 }));
        g.appendChild(svg("text", { x: p.x, y: p.y + 4, "text-anchor": "middle" }, String(i)));
        chart.appendChild(g);
      });

      var cov = E.coverage(M), f = E.fitness(M);
      var all = n * (n - 1) / 2;
      big.innerHTML = sim.r < 0
        ? "Press <em>Next round</em> to start. " + all + " handshakes are possible among " + num(n) + " agents."
        : "<strong>" + metCount + "</strong> of " + all + " handshakes done after " + (sim.r + 1) + " of " + n + " rounds" + (sim.r === n - 1 ? (metCount === all ? ". Everyone met everyone." : ". " + (all - metCount) + " pairs never met.") : ".");
      if (sim.r < 0) ddRound.textContent = "Not started";
      else {
        var row2 = M[sim.r], pairs = 0, oneway = 0, idle2 = 0;
        row2.forEach(function (t, a) { if (t === IDLE) idle2++; else if (row2[t] === a) pairs++; else oneway++; });
        ddRound.textContent = "Round " + (sim.r + 1) + ": " + (pairs / 2) + " handshakes, " + oneway + " unanswered calls, " + idle2 + " idle agents";
      }
      ddGoals.textContent = "Talk to everyone: " + cov.met + " of " + cov.all + " pairs meet in the cycle. No double-booking: " + (f.row === n ? "every round has " + n + " different entries." : "the worst round has " + f.row + " different entries out of " + n + ".");
      ddScore.textContent = "Worst agent " + f.col + " + worst round " + f.row + " + paired calls " + f.pairs + " = " + f.total + " (CHIRP: " + E.fitness(E.chirp(n)).total + "; highest possible: " + E.maxFitness(n) + ")";
      clear(tableHolder);
      tableHolder.appendChild(matrixTable(M, { round: sim.r, classify: cellClass(M), caption: "The schedule as a table (unique encoding): row = round, column = agent, entry = the partner that agent calls; * means no call." }));
    }
    onSchedule(function () { sim.r = -1; size.set(state.n); kind.set(state.kind); draw(); });
    resizers.push(draw);
    draw();
  }

  /* ------------------------------------------------------------ demo 2: two encodings */

  var FIG2_PAIRED = [["*", "B", "C", "C", "B"], ["A", "A", "B", "*", "B"], ["A", "*", "A", "C", "C"], ["A", "B", "B", "A", "*"], ["A", "B", "*", "B", "A"]];
  var FIG2_UNIQUE = [["*", 4, 3, 2, 1], [1, 0, 4, "*", 2], [2, "*", 0, 4, 3], [3, 2, 1, 0, "*"], [4, 3, "*", 1, 0]];

  function mountEncode(root) {
    var round = 0;
    var pick = seg([], 0, function () {}, "Round");
    var holder = el("div", { class: "ev-pair-tables" });
    var check = el("p", { class: "w-big", "aria-live": "polite" });
    var note = el("p", { class: "w-note" });
    root.appendChild(el("div", { class: "w-actions" }, [el("span", { class: "w-mono", text: "Highlight round" }), pick]));
    root.appendChild(holder);
    root.appendChild(check);
    root.appendChild(note);

    function buildPicker() {
      var opts = [];
      for (var r = 0; r < state.n; r++) opts.push({ value: r, label: String(r + 1) });
      var fresh = seg(opts, round, function (v) { round = v; draw(); }, "Round");
      pick.parentNode.replaceChild(fresh, pick);
      pick = fresh;
    }
    function draw() {
      var M = state.M, P = E.toPaired(M);
      clear(holder);
      var cls = function (r) { return r === round ? "ev-hl" : ""; };
      holder.appendChild(matrixTable(P, { corner: "Round", round: round, caption: "Paired encoding: agents with the same letter talk.", classify: function (r, i, v) { return v === "*" ? "ev-idle" : cls(r); } }));
      holder.appendChild(matrixTable(M, { corner: "Round", round: round, caption: "Unique encoding: each agent names its partner.", classify: function (r, i, v) { return v === IDLE ? "ev-idle" : (M[r][v] === i ? cls(r) : "ev-oneway"); } }));
      var isFig = state.kind === "chirp" && state.n === 5;
      var same = JSON.stringify(E.fromPaired(FIG2_PAIRED)) === JSON.stringify(E.chirp(5)) &&
        JSON.stringify(FIG2_UNIQUE.map(function (row) { return row.map(function (v) { return v === "*" ? IDLE : v; }); })) === JSON.stringify(E.chirp(5));
      if (isFig) {
        check.innerHTML = same
          ? "<strong>Matches Figure 2.</strong> The unique table equals the paper's cell for cell, and the paper's paired table pairs the same agents in every round."
          : "Figure 2 check failed.";
        note.textContent = "Figure 2 numbers its rounds from 1, so its round 1 is CHIRP's round R = 0. The paper labels each round's pairs by hand (round 1 uses B and C); this page letters pairs from A in order of the lower agent number. Letters are only names, so both labelings describe the same schedule.";
      } else {
        check.innerHTML = "The two tables describe the same schedule. Choose the CHIRP rule with five agents in the first demo to compare with the paper's Figure 2.";
        note.textContent = state.kind === "chirp" ? "" : "Unanswered calls (shaded differently in the unique table) have no letter in the paired table: the paired encoding can only write down handshakes both agents agree to.";
      }
    }
    onSchedule(function () { round = 0; buildPicker(); draw(); });
    buildPicker();
    draw();
  }

  /* ------------------------------------------------------------ demo 3: evolution */

  function mountEvolve(root) {
    var cfg = { n: 5, encoding: "unique", layers: 5, runs: 3 };
    var job = null;
    var sizeSeg = seg([5, 10, 25].map(function (v) { return { value: v, label: v + " agents" }; }), cfg.n, function (v) { cfg.n = v; reset(); }, "Clique size");
    var encSeg = seg([{ value: "unique", label: "Unique" }, { value: "paired", label: "Paired" }], cfg.encoding, function (v) { cfg.encoding = v; reset(); }, "Encoding");
    var layerSeg = seg([{ value: 5, label: "5 layers" }, { value: 10, label: "10 layers" }], cfg.layers, function (v) { cfg.layers = v; reset(); }, "Network layers");
    var runSeg = seg([1, 3, 6].map(function (v) { return { value: v, label: v + (v === 1 ? " run" : " runs") }; }), cfg.runs, function (v) { cfg.runs = v; reset(); }, "Runs");
    var go = el("button", { type: "button", class: "w-btn", text: "Evolve 25 generations" });
    var send = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "Show the best in the first demo", disabled: "disabled" });
    var chart = svg("svg", { class: "ev-chart", role: "img", "aria-label": "Fitness by generation: lines are population averages for each run, dots are the best network in each generation" });
    var big = el("p", { class: "w-big", "aria-live": "polite" });
    var dl = el("dl", { class: "ev-facts" });
    var ddBest = fact(dl, "Best schedule found");
    var ddParts = fact(dl, "Best, by goal", "ug grad res");
    var ddRand = fact(dl, "Random schedules (no evolution)", "grad res");
    var ddSet = fact(dl, "Settings", "grad res");

    root.appendChild(el("div", { class: "w-actions" }, [sizeSeg, encSeg]));
    root.appendChild(el("div", { class: "w-actions", "data-levels": "ug grad res" }, [layerSeg, runSeg]));
    root.appendChild(el("div", { class: "w-actions" }, [go, send]));
    root.appendChild(chart);
    root.appendChild(big);
    root.appendChild(dl);
    root.appendChild(el("p", { class: "w-note", text: "Computed by this page with its own reconstruction of the paper's method; the authors' code is not public. Each run evolves 50 networks for 25 generations. The paper plots its own runs in Figure 3; this chart does not reuse the paper's data." }));

    var series = [], bestOverall = null, randomBand = null;

    function reset() {
      if (job) job.cancel();
      series = []; bestOverall = null; send.setAttribute("disabled", "disabled");
      var s = E.randomScores(cfg.n, cfg.encoding, 2000, 11).sort(function (a, b) { return a - b; });
      randomBand = { lo: s[100], hi: s[1899], mean: s.reduce(function (a, b) { return a + b; }, 0) / s.length };
      draw();
    }

    go.addEventListener("click", function () {
      if (job) { job.cancel(); return; }
      series = []; bestOverall = null;
      var run = 0, ev = null, cancelled = false;
      go.textContent = "Stop"; go.classList.add("running");
      job = { cancel: function () { cancelled = true; finish(); } };
      function finish() { job = null; go.textContent = "Evolve 25 generations"; go.classList.remove("running"); draw(); }
      function tick() {
        if (cancelled) return;
        if (!ev) { ev = E.evolver({ n: cfg.n, layers: cfg.layers, encoding: cfg.encoding, seed: run + 1 }); series.push({ mean: [], best: [] }); }
        var t0 = Date.now();
        while (!ev.done() && Date.now() - t0 < 120) {
          var x = ev.next(), cur = series[series.length - 1];
          cur.mean.push(x.mean); cur.best.push(x.max);
          if (!bestOverall || x.best.score > bestOverall.score) bestOverall = { score: x.best.score, M: x.best.matrices[0], detail: x.best.detail, run: run + 1, gen: x.gen };
        }
        draw();
        if (ev.done()) { run++; ev = null; if (run >= cfg.runs) { finish(); if (bestOverall && cfg.n <= 12) send.removeAttribute("disabled"); return; } }
        later(tick);
      }
      tick();
    });
    send.addEventListener("click", function () {
      if (!bestOverall || cfg.n > 12) return;
      state.evolved[cfg.n] = bestOverall.M;
      setSchedule(cfg.n, "evolved", bestOverall.M);
      var target = document.getElementById("ev-schedule");
      if (target && target.scrollIntoView) target.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    function draw() {
      var W = chartWidth(chart), H = Math.round(Math.min(340, Math.max(240, W * 0.48)));
      chart.setAttribute("viewBox", "0 0 " + W + " " + H);
      clear(chart);
      var m = { l: 44, r: 12, t: 14, b: 34 }, pw = W - m.l - m.r, ph = H - m.t - m.b;
      var chirpScore = E.fitness(E.chirp(cfg.n)).total;
      var ymax = chirpScore * 1.05, ymin = 0;
      var allVals = [];
      series.forEach(function (s) { allVals = allVals.concat(s.best); });
      var topVal = Math.max.apply(null, allVals.concat([randomBand ? randomBand.hi : 0]));
      var zoom = cfg.n > 5 && topVal < chirpScore * 0.5;
      if (zoom) ymax = Math.max(10, topVal * 1.25);
      function X(g) { return m.l + pw * g / 24; }
      function Y(v) { return m.t + ph * (1 - (v - ymin) / (ymax - ymin)); }
      var raw = (ymax - ymin) / 5, mag = Math.pow(10, Math.floor(Math.log(raw) / Math.LN10)), step = mag;
      [1, 2, 5, 10].some(function (m) { step = m * mag; return step >= raw; });
      for (var v = 0; v <= ymax + 1e-9; v += step) {
        chart.appendChild(svg("line", { x1: m.l, x2: W - m.r, y1: Y(v), y2: Y(v), class: "ev-grid" }));
        chart.appendChild(svg("text", { x: m.l - 6, y: Y(v) + 4, "text-anchor": "end", class: "c-tick" }, String(Math.round(v))));
      }
      [0, 5, 10, 15, 20, 24].forEach(function (g) { chart.appendChild(svg("text", { x: X(g), y: H - m.b + 16, "text-anchor": "middle", class: "c-tick" }, String(g))); });
      chart.appendChild(svg("text", { x: m.l + pw / 2, y: H - 4, "text-anchor": "middle", class: "c-label" }, "Generation"));
      if (randomBand) {
        chart.appendChild(svg("rect", { x: m.l, width: pw, y: Y(randomBand.hi), height: Math.max(1, Y(randomBand.lo) - Y(randomBand.hi)), class: "ev-band" }));
        chart.appendChild(svg("text", { x: W - m.r - 4, y: Y(randomBand.hi) - 4, "text-anchor": "end", class: "c-label" }, "random schedules (middle 90%)"));
      }
      if (!zoom) {
        chart.appendChild(svg("line", { x1: m.l, x2: W - m.r, y1: Y(chirpScore), y2: Y(chirpScore), class: "ev-ref" }));
        chart.appendChild(svg("text", { x: m.l + 4, y: Y(chirpScore) - 5, class: "c-label" }, "CHIRP " + chirpScore));
      } else {
        chart.appendChild(svg("text", { x: m.l + 4, y: m.t + 10, class: "c-label" }, "CHIRP scores " + chirpScore + " (above this chart)"));
      }
      series.forEach(function (s, si) {
        s.best.forEach(function (v, g) { chart.appendChild(svg("circle", { cx: X(g), cy: Y(v), r: 3, class: "ev-dot" })); });
        var d = s.mean.map(function (v, g) { return (g ? "L" : "M") + X(g).toFixed(1) + "," + Y(v).toFixed(1); }).join("");
        chart.appendChild(svg("path", { d: d, class: "ev-line ev-line-" + (si % 6) }));
      });

      var chirpF = E.fitness(E.chirp(cfg.n));
      if (!bestOverall) {
        big.innerHTML = job ? "Evolving…" : "Press <em>Evolve</em>. The dashed line is CHIRP's score for " + cfg.n + " agents, the best a full cycle can do here.";
        ddBest.textContent = "None yet";
        ddParts.textContent = "";
      } else {
        var c = E.coverage(bestOverall.M);
        big.innerHTML = "Best evolved schedule: <strong>" + bestOverall.score + "</strong> against CHIRP's " + chirpScore + (job ? " (still running)" : "") + ".";
        ddBest.textContent = "Run " + bestOverall.run + ", generation " + bestOverall.gen + ": " + c.met + " of " + c.all + " pairs meet in the cycle (CHIRP: all " + c.all + ").";
        var d2 = bestOverall.detail;
        ddParts.textContent = "worst agent " + d2.col + " (CHIRP " + chirpF.col + "), worst round " + d2.row + " (CHIRP " + chirpF.row + "), paired calls " + d2.pairs + " (CHIRP " + chirpF.pairs + ")";
      }
      ddRand.textContent = randomBand ? "Average " + randomBand.mean.toFixed(1) + "; middle 90% from " + randomBand.lo + " to " + randomBand.hi + " (2,000 random tables, computed by this page)" : "";
      ddSet.textContent = "Population 50, one child per parent, tournaments of four on the Pareto front of the three goals with elitism, mutation 0.1 for connections and for neurons, " + num(cfg.layers) + " hidden layers of " + num(cfg.n) + " neurons. Paper: 25 generations, 50 survivors, 0.1 and 0.1, five or ten layers; the population and tournament sizes are this page's choices.";
    }
    resizers.push(draw);
    reset();
  }

  /* ------------------------------------------------------------ demo 4: many cliques */

  var SCENARIOS = [{ c: 2, n: 5 }, { c: 4, n: 10 }, { c: 10, n: 25 }];

  function mountCliques(root) {
    var cfg = { s: 0, who: "schirp", round: 0 };
    var cache = {};
    var scenSeg = seg(SCENARIOS.map(function (s, i) { return { value: i, label: s.c + " cliques of " + s.n }; }), cfg.s, function (v) { cfg.s = v; cfg.round = 0; roundSlider.firstChild.nextSibling.max = SCENARIOS[v].n; draw(); }, "Scenario");
    var whoSeg = seg([
      { value: "schirp", label: "S-CHIRP, one shared order" },
      { value: "own", label: "S-CHIRP, own orders", levels: "grad res", title: "Beyond the paper: each clique shuffles its rounds with its own secret order" },
      { value: "evo", label: "EVO-SCHIRP" }
    ], cfg.who, function (v) { cfg.who = v; draw(); }, "Protocol");
    var roundSlider = range("Round", 1, SCENARIOS[0].n, 1, function (v) { cfg.round = v - 1; draw(); });
    var go = el("button", { type: "button", class: "w-btn", text: "Evolve EVO-SCHIRP" });
    var grid = svg("svg", { class: "ev-grid-chart", role: "img", "aria-label": "Every agent in every clique, colored by what happened to its call this round" });
    var bars = svg("svg", { class: "ev-bars", role: "img", "aria-label": "Scaled multi-clique fitness for each protocol, with the paper's value of about 0.5" });
    var big = el("p", { class: "w-big", "aria-live": "polite" });
    var dl = el("dl", { class: "ev-facts" });
    var ddRound = fact(dl, "This round");
    var ddCycle = fact(dl, "Whole cycle");
    var ddParts = fact(dl, "Fitness parts", "ug grad res");

    root.appendChild(el("div", { class: "w-actions" }, [scenSeg]));
    root.appendChild(el("div", { class: "w-actions" }, [whoSeg, go]));
    root.appendChild(el("div", { class: "w-actions" }, [roundSlider]));
    root.appendChild(grid);
    root.appendChild(big);
    root.appendChild(dl);
    root.appendChild(bars);
    root.appendChild(el("p", { class: "w-note", text: "Computed by this page. The paper defines the four kinds of call (Figure 1) and scores multi-clique protocols by clique fitness and by how much the cliques' tables differ, scaled to the maximum; the channel rules and the equal weighting here are this page's reading. One EVO-SCHIRP run: 50 genomes, 25 generations, five layers." }));

    function key() { return cfg.s; }
    function matrices(who) {
      var sc = SCENARIOS[cfg.s], k = key(), c = cache[k] = cache[k] || {};
      if (who === "schirp") {
        if (!c.schirp) { var ord = E.shuffled(sc.n, E.rng(5)); c.schirp = []; for (var i = 0; i < sc.c; i++) c.schirp.push(E.chirp(sc.n, ord)); }
        return c.schirp;
      }
      if (who === "own") {
        if (!c.own) { var rr = E.rng(6); c.own = []; for (var j = 0; j < sc.c; j++) c.own.push(E.chirp(sc.n, E.shuffled(sc.n, rr))); }
        return c.own;
      }
      return c.evo || null;
    }

    var job = null;
    go.addEventListener("click", function () {
      if (job) return;
      var sc = SCENARIOS[cfg.s], k = key();
      var ev = E.evolver({ n: sc.n, cliques: sc.c, layers: 5, encoding: "unique", seed: 1 }), last = null;
      job = true; go.classList.add("running");
      function tick() {
        var t0 = Date.now();
        while (!ev.done() && Date.now() - t0 < 120) last = ev.next();
        go.textContent = "Generation " + (last ? last.gen + 1 : 0) + " of 25";
        if (!ev.done()) { later(tick); return; }
        cache[k] = cache[k] || {};
        cache[k].evo = last.best.matrices;
        job = null; go.classList.remove("running"); go.textContent = "Evolve EVO-SCHIRP";
        cfg.who = "evo"; whoSeg.set("evo");
        if (cfg.s === k) draw();
      }
      later(tick);
    });

    var COLORS = { valid: "ev-valid", invalid: "ev-invalid", collision: "ev-collision", inactive: "ev-inactive" };
    function draw() {
      var sc = SCENARIOS[cfg.s];
      if (cfg.round >= sc.n) cfg.round = 0;
      roundSlider.set(cfg.round + 1);
      var Ms = matrices(cfg.who);
      var W = chartWidth(grid);
      clear(grid);
      if (!Ms) {
        grid.setAttribute("viewBox", "0 0 " + W + " 40");
        grid.appendChild(svg("text", { x: 0, y: 24, class: "c-label" }, "Press Evolve EVO-SCHIRP to run evolution for this scenario."));
        big.textContent = ""; ddRound.textContent = ""; ddCycle.textContent = ""; ddParts.textContent = "";
        drawBars();
        return;
      }
      var labelW = 64, cell = Math.max(8, Math.min(30, (W - labelW) / sc.n)), twoRows = W < 520, H = sc.c * cell + (twoRows ? 64 : 44);
      grid.setAttribute("viewBox", "0 0 " + W + " " + H);
      var ch = E.channelRound(Ms, cfg.round);
      for (var k = 0; k < sc.c; k++) {
        grid.appendChild(svg("text", { x: 0, y: k * cell + cell / 2 + 4, class: "c-tick" }, "Clique " + (k + 1)));
        for (var i = 0; i < sc.n; i++) {
          var lab = ch.labels[k][i];
          var rect = svg("rect", { x: labelW + i * cell + 1, y: k * cell + 1, width: cell - 2, height: cell - 2, class: "ev-cell " + COLORS[lab.label] });
          var tt = svg("title", null, "Clique " + (k + 1) + ", agent " + i + ": calls " + cellText(lab.target) + "; " + lab.label);
          rect.appendChild(tt);
          grid.appendChild(rect);
          if (lab.label === "collision") {
            var x0 = labelW + i * cell + 3, y0 = k * cell + 3, x1 = x0 + cell - 6, y1 = y0 + cell - 6;
            grid.appendChild(svg("path", { d: "M" + x0 + "," + y0 + "L" + x1 + "," + y1 + "M" + x1 + "," + y0 + "L" + x0 + "," + y1, class: "ev-x" }));
          }
        }
      }
      ["valid", "collision", "invalid", "inactive"].forEach(function (name, j) {
        var col = twoRows ? j % 2 : j, rowi = twoRows ? Math.floor(j / 2) : 0;
        var lx = labelW + col * 120, legY = sc.c * cell + 22 + rowi * 20;
        grid.appendChild(svg("rect", { x: lx, y: legY - 10, width: 12, height: 12, class: "ev-cell " + COLORS[name] }));
        if (name === "collision") grid.appendChild(svg("path", { d: "M" + (lx + 2) + "," + (legY - 8) + "l8,8M" + (lx + 10) + "," + (legY - 8) + "l-8,8", class: "ev-x" }));
        grid.appendChild(svg("text", { x: lx + 16, y: legY, class: "c-tick" }, name + " " + ch.totals[name]));
      });

      var tot = { valid: 0, invalid: 0, collision: 0, inactive: 0 };
      for (var r = 0; r < sc.n; r++) { var t2 = E.channelRound(Ms, r).totals; Object.keys(tot).forEach(function (q) { tot[q] += t2[q]; }); }
      var agentRounds = sc.c * sc.n * sc.n;
      var mf = E.multiFitness(Ms);
      big.innerHTML = "Scaled fitness <strong>" + mf.scaled.toFixed(3) + "</strong>" + (cfg.who === "schirp" ? " (paper: about 0.5 for S-CHIRP)" : cfg.who === "evo" ? " (paper: about 0.5 for EVO-SCHIRP)" : " (not in the paper)");
      ddRound.textContent = "Round " + (cfg.round + 1) + ": " + ch.totals.valid + " valid, " + ch.totals.collision + " in collisions, " + ch.totals.invalid + " invalid, " + ch.totals.inactive + " inactive (of " + sc.c * sc.n + " agents)";
      ddCycle.textContent = "Of " + agentRounds.toLocaleString("en-US") + " agent-rounds: " + pct(tot.valid) + " valid, " + pct(tot.collision) + " collisions, " + pct(tot.invalid) + " invalid, " + pct(tot.inactive) + " inactive";
      function pct(v) { return (100 * v / agentRounds).toFixed(0) + "%"; }
      ddParts.textContent = "Clique part " + mf.cliquePart.toFixed(3) + " (mean single-clique fitness over the maximum, " + E.maxFitness(sc.n) + "), distinct-cells part " + mf.distinctPart.toFixed(3) + "; scaled = average of the two";
      drawBars();
    }

    function drawBars() {
      var W = chartWidth(bars), rows = [
        { who: "schirp", label: "S-CHIRP shared" },
        { who: "own", label: "S-CHIRP own", levels: "grad res" },
        { who: "evo", label: "EVO-SCHIRP" }
      ];
      var rowH = 30, labelW = 110, H = rows.length * rowH + 30;
      bars.setAttribute("viewBox", "0 0 " + W + " " + H);
      clear(bars);
      var pw = W - labelW - 50;
      function X(v) { return labelW + pw * v; }
      rows.forEach(function (row, i) {
        var g = svg("g");
        if (row.levels) g.setAttribute("data-levels", row.levels);
        var Ms = matrices(row.who), y = i * rowH + 6;
        g.appendChild(svg("text", { x: 0, y: y + 14, class: "c-tick" }, row.label));
        if (Ms) {
          var v = E.multiFitness(Ms).scaled;
          g.appendChild(svg("rect", { x: labelW, y: y + 2, width: Math.max(1, pw * v), height: 16, class: "ev-bar" + (row.who === cfg.who ? " ev-bar-on" : "") }));
          g.appendChild(svg("text", { x: X(v) + 6, y: y + 14, class: "c-tick" }, v.toFixed(2)));
        } else {
          g.appendChild(svg("text", { x: labelW, y: y + 14, class: "c-label" }, "not run yet"));
        }
        bars.appendChild(g);
      });
      var yb = rows.length * rowH + 4;
      bars.appendChild(svg("line", { x1: X(0.5), x2: X(0.5), y1: 2, y2: yb, class: "ev-ref" }));
      bars.appendChild(svg("text", { x: X(0.5), y: yb + 16, "text-anchor": "middle", class: "c-label" }, "paper: about 0.5"));
      bars.appendChild(svg("text", { x: X(0), y: yb + 16, "text-anchor": "middle", class: "c-tick" }, "0"));
      bars.appendChild(svg("text", { x: X(1), y: yb + 16, "text-anchor": "middle", class: "c-tick" }, "1"));
    }
    resizers.push(draw);
    draw();
  }

  /* ------------------------------------------------------------ mount */

  function mount(id, fn) {
    var root = document.getElementById(id);
    if (!root) return;
    fn(root);
    root.classList.add("w-ready");
  }
  function init() {
    mount("ev-schedule", mountSchedule);
    mount("ev-encode", mountEncode);
    mount("ev-evolve", mountEvolve);
    mount("ev-cliques", mountCliques);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();

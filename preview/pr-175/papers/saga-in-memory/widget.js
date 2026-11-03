/*
  SAGA widget for /papers/saga-in-memory/.
  Mount points: #sg-order, #sg-memory, #sg-evolve, #sg-results.
  Demos 2 and 3 share one benchmark choice.
*/
(function () {
  "use strict";

  var E = window.SagaEngine, GC = window.GoCompat;
  if (!E || !GC) return;

  var SCRIPT_BASE = (document.currentScript && document.currentScript.src || "").replace(/[^/]*$/, "");
  var SVGNS = "http://www.w3.org/2000/svg";

  /* ------------------------------------------------------------ state */

  var state = {
    data: null,
    bench: "cm150a",
    graphs: {},
    level: window.PaperKit ? window.PaperKit.level() : "public"
  };
  var listeners = [];
  function onBench(fn) { listeners.push(fn); }
  function setBench(b) {
    if (b === state.bench) return;
    state.bench = b;
    loadGraph(b, function () { listeners.forEach(function (fn) { fn(); }); });
  }
  document.addEventListener("paperlevel", function (e) { state.level = e.detail.level; });
  function isDeep() { return state.level === "grad" || state.level === "res"; }

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
      b.addEventListener("click", function () { set(o.value); onPick(o.value); });
      wrap.appendChild(b);
      return b;
    });
    function set(v) { btns.forEach(function (b, i) { b.setAttribute("aria-checked", String(options[i].value === v)); }); }
    wrap.set = set;
    return wrap;
  }
  function pct(x, d) { return (x > 0 ? "+" : x < 0 ? "−" : "") + Math.abs(x).toFixed(d == null ? 1 : d) + "%"; }
  function num(x) { return x.toLocaleString("en-US"); }
  function benchSeg(onPick) {
    var s = seg(state.data.order.map(function (k) {
      var b = state.data.benchmarks[k];
      return { value: k, label: k, title: b.gates + " gates, " + b.inputs + " inputs, " + b.outputs + " outputs" };
    }), state.bench, onPick, "Benchmark circuit");
    onBench(function () { s.set(state.bench); });
    return s;
  }
  function loadGraph(b, cb) {
    if (state.graphs[b]) { cb(state.graphs[b]); return; }
    var info = state.data.benchmarks[b];
    fetch(SCRIPT_BASE + info.file).then(function (r) { return r.text(); }).then(function (text) {
      var g = E.parseBlif(text);
      g.blif = text;
      state.graphs[b] = g;
      cb(g);
    });
  }

  // Peak cells with SAGA's rules, or with every primary output (the BLIF .outputs list) kept
  // until the end of the run (this page's check, not the tool's rule).
  function peakCells(g, seq, holdOutputs) {
    if (!holdOutputs) return E.simulate(g, seq);
    var held = new Uint8Array(g.n + 1), nIn = g.meta.inputNames.length;
    g.meta.outputNames.forEach(function (n, i) { held[nIn + 1 + i] = 1; });
    var refs = new Int32Array(g.n + 1), live = 0, peak = 0;
    function write(v, parents) {
      if (live + 1 > peak) peak = live + 1;
      live++;
      refs[v] = g.children[v].length + held[v];
      parents.forEach(function (p) { refs[p]--; if (refs[p] === 0) live--; });
      if (refs[v] === 0) live--;
    }
    g.inputs.forEach(function (v) { write(v, []); });
    seq.forEach(function (v) { write(v, g.parents[v]); });
    return peak;
  }

  var worker = null, jobs = {}, jobId = 0;
  function startJob(job, cb) {
    if (!worker) {
      try { worker = new Worker(SCRIPT_BASE + "saga-worker.js"); }
      catch (err) { cb({ type: "error", error: String(err) }); return null; }
      worker.onmessage = function (e) { var fn = jobs[e.data.id]; if (fn) fn(e.data); if (e.data.type === "done") delete jobs[e.data.id]; };
      worker.onerror = function (e) { Object.keys(jobs).forEach(function (k) { jobs[k]({ type: "error", error: e.message || "worker error" }); delete jobs[k]; }); worker = null; };
    }
    job.id = ++jobId;
    jobs[job.id] = cb;
    worker.postMessage(job);
    return job.id;
  }
  function stopJob(id) { delete jobs[id]; if (worker) worker.postMessage({ task: "stop" }); }

  /* ------------------------------------------------------------ demo 1: order matters */

  var EQ4 = (function () {
    var s = ".model eq4\n.inputs a0 b0 a1 b1 a2 b2 a3 b3\n.outputs eq\n";
    for (var i = 0; i < 4; i++) {
      s += ".gate NOR A=a" + i + " B=b" + i + " Y=p" + i + "\n" +
        ".gate NOR A=a" + i + " B=p" + i + " Y=q" + i + "\n" +
        ".gate NOR A=b" + i + " B=p" + i + " Y=r" + i + "\n" +
        ".gate NOR A=q" + i + " B=r" + i + " Y=x" + i + "\n" +
        ".gate NOT A=x" + i + " Y=y" + i + "\n";
    }
    s += ".gate NOR A=y0 B=y1 Y=z0\n.gate NOR A=y2 B=y3 Y=z1\n.gate NOT A=z0 Y=w0\n.gate NOT A=z1 Y=w1\n.gate NOR A=w0 B=w1 Y=eq\n.end\n";
    return s;
  })();

  // Fewest and most cells over every valid order, by search over sets of finished gates.
  // With lowest-free reuse, a write needs (signals still waiting for a reader) + 1 cells.
  function orderBounds(g) {
    var gates = [], idx = {}, v;
    for (v = 1; v <= g.n; v++) if (!g.isInput[v]) { idx[v] = gates.length; gates.push(v); }
    var full = Math.pow(2, gates.length) - 1;
    function has(mask, u) { return g.isInput[u] || Math.floor(mask / Math.pow(2, idx[u])) % 2 === 1; }
    function waiting(mask) {
      var c = 0;
      for (var u = 1; u <= g.n; u++) {
        if (!has(mask, u) || !g.children[u].length) continue;
        if (g.children[u].some(function (k) { return !has(mask, k); })) c++;
      }
      return c;
    }
    var memo = [new Map(), new Map()];
    function rec(mask, which) {
      if (mask === full) return 0;
      var m = memo[which], got = m.get(mask);
      if (got != null) return got;
      var here = waiting(mask) + 1, best = which ? -1 : Infinity;
      for (var i = 0; i < gates.length; i++) {
        var u = gates[i];
        if (has(mask, u)) continue;
        if (!g.parents[u].every(function (p) { return has(mask, p); })) continue;
        var r = Math.max(here, rec(mask + Math.pow(2, i), which));
        best = which ? Math.max(best, r) : Math.min(best, r);
      }
      m.set(mask, best);
      return best;
    }
    return { min: rec(0, 0), max: rec(0, 1) };
  }

  function mountOrder(root) {
    var g = E.parseBlif(EQ4), names = g.meta.names;
    var bounds = orderBounds(g);
    var idOf = {};
    names.forEach(function (n, i) { if (n) idOf[n] = i; });
    var seq = [];
    var presets = {
      bfs: E.breadthFirst(g),
      bit: ["p0", "q0", "r0", "x0", "y0", "p1", "q1", "r1", "x1", "y1", "z0", "w0",
        "p2", "q2", "r2", "x2", "y2", "p3", "q3", "r3", "x3", "y3", "z1", "w1", "eq"].map(function (n) { return idOf[n]; })
    };
    var timer = null;

    var graph = svg("svg", { class: "sg-eq", role: "img", "aria-label": "A four-bit equality checker built from 25 NOR and NOT gates. Gates that are ready to run are outlined." });
    var strip = el("div", { class: "sg-strip", "aria-live": "polite" });
    var count = el("p", { class: "w-big" });
    var note = el("p", { class: "w-note sg-order-note" });
    var bBfs = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "Play breadth-first order" });
    var bBit = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "Play one bit at a time" });
    var bUndo = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "Undo" });
    var bReset = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "Reset" });
    root.appendChild(el("p", { class: "w-note", text: "Tap a gate with a bright outline to run it next. Its inputs must already be in memory." }));
    root.appendChild(graph);
    root.appendChild(count);
    root.appendChild(strip);
    root.appendChild(note);
    root.appendChild(el("div", { class: "w-actions" }, [bBfs, bBit, bUndo, bReset]));
    root.appendChild(el("p", { class: "w-note", text: "Example circuit drawn for this page (not one of the paper's benchmarks): it checks whether two four-bit numbers a and b are equal. Memory follows SAGA's rules: a value stays in its cell until its last reader has run, and each new value takes the lowest free cell. The fewest and most cells over all valid orders were found by this page with an exhaustive search." }));

    function play(order) {
      stop();
      seq = [];
      var i = 0;
      timer = setInterval(function () {
        if (i >= order.length) { stop(); return; }
        seq.push(order[i++]);
        draw();
      }, 220);
      draw();
    }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    bBfs.addEventListener("click", function () { play(presets.bfs); });
    bBit.addEventListener("click", function () { play(presets.bit); });
    bUndo.addEventListener("click", function () { stop(); seq.pop(); draw(); });
    bReset.addEventListener("click", function () { stop(); seq = []; draw(); });

    // fixed layout: one column per bit, rows by depth
    function layout(W) {
      var pos = {}, colW = W / 4, top = 18, dy = 34;
      for (var i = 0; i < 4; i++) {
        var cx = colW * (i + 0.5), off = Math.min(26, colW * 0.28);
        pos["a" + i] = [cx - off, top]; pos["b" + i] = [cx + off, top];
        pos["p" + i] = [cx, top + dy];
        pos["q" + i] = [cx - off, top + 2 * dy]; pos["r" + i] = [cx + off, top + 2 * dy];
        pos["x" + i] = [cx, top + 3 * dy]; pos["y" + i] = [cx, top + 4 * dy];
      }
      pos.z0 = [colW, top + 5 * dy]; pos.z1 = [colW * 3, top + 5 * dy];
      pos.w0 = [colW, top + 6 * dy]; pos.w1 = [colW * 3, top + 6 * dy];
      pos.eq = [colW * 2, top + 7 * dy];
      return { pos: pos, H: top + 7 * dy + 22 };
    }

    function draw() {
      var tr = E.simulate(g, seq, true);
      var done = new Uint8Array(g.n + 1);
      g.inputs.forEach(function (v) { done[v] = 1; });
      seq.forEach(function (v) { done[v] = 1; });
      var cellOf = {};
      // occupancy after the last step
      var occ = [];
      tr.steps.forEach(function (s) {
        while (occ.length < s.cells) occ.push(0);
        occ[s.cell] = s.v;
        (s.freed || []).forEach(function (f) { occ[f[1]] = 0; });
      });
      occ.forEach(function (v, c) { if (v) cellOf[v] = c; });

      var W = chartWidth(graph), L = layout(W), pos = L.pos;
      graph.setAttribute("viewBox", "0 0 " + W + " " + L.H);
      graph.textContent = "";
      var ge = svg("g", { class: "sg-edges" });
      for (var v = 1; v <= g.n; v++) {
        g.children[v].forEach(function (c) {
          var a = pos[names[v]], b = pos[names[c]];
          ge.appendChild(svg("line", { x1: a[0], y1: a[1], x2: b[0], y2: b[1], class: "sg-edge" + (done[v] && cellOf[v] != null ? " live" : "") }));
        });
      }
      graph.appendChild(ge);
      var r = W < 420 ? 11 : 13;
      for (v = 1; v <= g.n; v++) {
        var p = pos[names[v]], cls = "sg-node";
        var ready = !done[v] && g.parents[v].every(function (u) { return done[u]; });
        if (g.isInput[v]) cls += " input";
        if (done[v]) cls += cellOf[v] != null ? " live" : " spent";
        else if (ready) cls += " ready";
        if (seq.length && v === seq[seq.length - 1]) cls += " last";
        var node = svg("g", { class: cls, transform: "translate(" + p[0].toFixed(1) + "," + p[1].toFixed(1) + ")" });
        node.appendChild(svg("circle", { r: r }));
        node.appendChild(svg("text", { "text-anchor": "middle", dy: "0.35em" }, names[v]));
        if (ready && !timer) {
          node.setAttribute("tabindex", "0");
          node.setAttribute("role", "button");
          node.setAttribute("aria-label", "Run gate " + names[v]);
          (function (id) {
            function go() { seq.push(id); draw(); }
            node.addEventListener("click", go);
            node.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
          })(v);
        }
        graph.appendChild(node);
      }
      // memory strip
      strip.textContent = "";
      occ.forEach(function (v, c) {
        strip.appendChild(el("span", { class: "sg-cell" + (v ? (g.isInput[v] ? " input" : " gate") : " free"), title: "Cell " + c }, [v ? names[v] : "·"]));
      });
      var finished = seq.length === g.gates;
      count.innerHTML = "Cells used: <strong>" + occ.length + "</strong> <span class=\"w-mono\">" + seq.length + " of " + g.gates + " gates run</span>";
      if (finished) {
        note.textContent = occ.length === bounds.min ?
          "Done with " + occ.length + " cells, the fewest any order can use for this circuit." :
          "Done with " + occ.length + " cells. The best order uses " + bounds.min + "; the worst uses " + bounds.max + ".";
      } else {
        note.textContent = "Every order computes the same answer. Across all valid orders, this circuit needs between " + bounds.min + " and " + bounds.max + " cells.";
      }
    }
    draw();
    resizers.push(draw);
  }

  /* ------------------------------------------------------------ demo 2: memory over time */

  function mountMemory(root) {
    var view = { order: "saga", hold: false, seed: 1 };
    var bseg = benchSeg(setBench);
    var oseg = seg([
      { value: "bfs", label: "Breadth-first" },
      { value: "random", label: "Random valid" },
      { value: "saga", label: "SAGA's best" }
    ], view.order, function (v) { view.order = v; draw(); }, "Gate order");
    var reroll = el("button", { type: "button", class: "w-btn w-btn-quiet fp-small", text: "Another random order" });
    reroll.addEventListener("click", function () { view.order = "random"; oseg.set("random"); view.seed++; draw(); });
    var holdBox = el("input", { type: "checkbox", id: "sg-hold" });
    holdBox.addEventListener("change", function () { view.hold = holdBox.checked; draw(); });
    var holdRow = el("label", { class: "sg-check", for: "sg-hold", "data-levels": "grad res" }, [holdBox, " Keep outputs in memory until the end (this page's check, not the paper's rule)"]);
    var chart = svg("svg", { class: "sg-occ", role: "img", "aria-label": "Memory cells over time: each row is one cell, each bar one value held in it" });
    var readout = el("div", { class: "sg-readout" });
    root.appendChild(el("div", { class: "w-actions" }, [bseg]));
    root.appendChild(el("div", { class: "w-actions" }, [oseg, reroll]));
    root.appendChild(holdRow);
    root.appendChild(chart);
    root.appendChild(readout);
    var srcNote = el("p", { class: "w-note" });
    root.appendChild(srcNote);

    function seqFor(g) {
      var info = state.data.benchmarks[state.bench];
      if (view.order === "bfs") return E.breadthFirst(g);
      if (view.order === "saga") return info.go.seq;
      return E.randomValid(g, new GC.FastRand(view.seed * 7919));
    }

    function draw() {
      loadGraph(state.bench, function (g) {
        var info = state.data.benchmarks[state.bench];
        var seq = seqFor(g);
        var tr = E.simulate(g, seq, true);
        var peak = view.hold ? peakCells(g, seq, true) : tr.peak;
        // bars: [cell, start, end, kind]
        var start = {}, cellAt = {}, bars = [], T = tr.steps.length;
        tr.steps.forEach(function (s, t) {
          start[s.v] = t; cellAt[s.v] = s.cell;
          (s.freed || []).forEach(function (f) {
            bars.push([f[1], start[f[0]], t, kind(f[0])]);
            delete start[f[0]];
          });
        });
        Object.keys(start).forEach(function (v) { bars.push([cellAt[v], start[v], T, kind(+v)]); });
        function kind(v) { return g.isInput[v] ? "input" : g.children[v].length ? "gate" : "output"; }

        var W = chartWidth(chart), padL = 36, padR = 8, padT = 10, padB = 30;
        var rows = view.hold ? Math.max(peak, tr.peak) : tr.peak;
        var rowH = Math.max(2, Math.min(9, 300 / Math.max(rows, 1)));
        var H = padT + rows * rowH + padB;
        chart.setAttribute("viewBox", "0 0 " + W + " " + H);
        chart.textContent = "";
        var x = function (t) { return padL + (W - padL - padR) * t / T; };
        var y = function (c) { return padT + c * rowH; };
        var inEnd = x(tr.inputSteps);
        chart.appendChild(svg("rect", { x: padL, y: padT, width: inEnd - padL, height: rows * rowH, class: "sg-inzone" }));
        bars.forEach(function (b) {
          var w = Math.max(1.2, x(Math.max(b[2], b[1] + 1)) - x(b[1]));
          chart.appendChild(svg("rect", { x: x(b[1]).toFixed(1), y: (y(b[0]) + 0.5).toFixed(1), width: w.toFixed(1), height: Math.max(1, rowH - 1).toFixed(1), class: "sg-bar " + b[3] }));
        });
        chart.appendChild(svg("line", { x1: padL, x2: W - padR, y1: y(tr.peak), y2: y(tr.peak), class: "c-ref" }));
        chart.appendChild(svg("text", { x: padL - 6, y: y(tr.peak) + 4, "text-anchor": "end", class: "c-tick" }, String(tr.peak)));
        chart.appendChild(svg("text", { x: padL - 6, y: padT + 8, "text-anchor": "end", class: "c-tick" }, "0"));
        chart.appendChild(svg("text", { x: padL, y: H - 10, class: "c-label" }, "load inputs"));
        chart.appendChild(svg("text", { x: W - padR, y: H - 10, "text-anchor": "end", class: "c-label" }, g.gates + " gate writes →"));
        chart.appendChild(svg("text", { x: 4, y: padT + rows * rowH / 2, class: "c-label", transform: "rotate(-90 10 " + (padT + rows * rowH / 2) + ")", "text-anchor": "middle" }, "cell"));

        var lines = [];
        lines.push(el("p", { class: "w-big", html: "Peak memory: <strong>" + peak + "</strong> cells" + (view.hold ? " with outputs kept" : "") + " <span class=\"w-mono\">" + g.gates + " gate writes, " + g.inputs.length + " inputs</span>" }));
        var bfs = E.simulate(g, E.breadthFirst(g)), best = E.simulate(g, info.go.seq);
        lines.push(el("p", { class: "w-note", html: "For " + state.bench + ": breadth-first order " + bfs + " cells, SAGA's best " + best + " cells (the paper reports " + info.saga.a + " at ε = " + num(info.saga.eps) + "). SIMPLER, the earlier tool, reported " + info.simpler.a + " cells for its own mapping of the same benchmark." }));
        if (view.hold) {
          lines.push(el("p", { class: "w-note", text: "With every output kept until the end, this order needs " + peak + " cells instead of " + tr.peak + ". The SAGA tool frees an output as soon as it is written, because nothing inside the circuit reads it." }));
        }
        readout.textContent = "";
        lines.forEach(function (l) { readout.appendChild(l); });
        var checked = info.go.runs.some(function (r) { return r.seed === 1 && r.sameSeq; });
        srcNote.innerHTML = "Circuits are the NOR and NOT netlists shipped with the authors' SAGA repository. “SAGA's best” is the order SAGA returns with the paper's settings (population 2,000, ε = 50, <code>-seed 1</code>), computed with this page's port; " +
          (checked ? "the authors' Go tool returns the identical order for " + state.bench + "." : "for " + state.bench + " it has not yet been compared with the Go tool's output.");
      });
    }
    onBench(draw);
    resizers.push(draw);
    document.addEventListener("paperlevel", function () { setTimeout(draw, 0); });
    draw();
  }

  /* ------------------------------------------------------------ demo 3: evolve */

  function mountEvolve(root) {
    var run = { size: 200, epsilon: 15, seed: 1, id: null, hist: [], init: null, result: null, startBest: null, t0: 0 };
    var bseg = benchSeg(function (b) { stop(); setBench(b); });
    var pseg = seg([
      { value: 100, label: "100" }, { value: 200, label: "200" }, { value: 2000, label: "2,000 (paper)" }
    ], run.size, function (v) { run.size = v; reset(); }, "Population size");
    var eseg = seg([
      { value: 15, label: "15" }, { value: 50, label: "50 (paper)" },
      { value: 500, label: "500 (paper)", levels: "grad res" }
    ], run.epsilon, function (v) { run.epsilon = v; reset(); }, "Generations without improvement before stopping");
    var seedIn = el("input", { type: "number", min: "1", max: "999999", value: "1", class: "sg-seed", "aria-label": "Random seed" });
    seedIn.addEventListener("change", function () { run.seed = Math.max(1, Math.floor(+seedIn.value) || 1); seedIn.value = run.seed; reset(); });
    var go = el("button", { type: "button", class: "w-btn", text: "Evolve in your browser" });
    var preset = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "Paper settings" });
    var chart = svg("svg", { class: "sg-evo", role: "img", "aria-label": "Fewest memory cells in the population, generation by generation" });
    var readout = el("div", { class: "sg-readout", "aria-live": "polite" });
    root.appendChild(el("div", { class: "w-actions" }, [bseg]));
    root.appendChild(el("div", { class: "sg-controls" }, [
      el("span", { class: "sg-ctl-label", text: "Population" }), pseg,
      el("span", { class: "sg-ctl-label", html: "Stop after <em>ε</em> quiet generations" }), eseg,
      el("span", { class: "sg-ctl-label", text: "Seed", "data-levels": "ug grad res" }), el("span", { "data-levels": "ug grad res" }, [seedIn])
    ]));
    root.appendChild(el("div", { class: "w-actions" }, [go, preset]));
    root.appendChild(chart);
    root.appendChild(readout);
    root.appendChild(el("p", { class: "w-note", text: "Runs SAGA's genetic algorithm, ported from the authors' Go code, in a background thread on your device. Each generation keeps the best quarter of the orders, refills the population by order crossover, and mutates every order with a dependency-safe swap. The paper used a population of 2,000; a run that large on 9symml can take several minutes." }));

    preset.addEventListener("click", function () {
      run.size = 2000; run.epsilon = 50; run.seed = 1; seedIn.value = 1;
      pseg.set(2000); eseg.set(50); reset(); start();
    });
    go.addEventListener("click", function () { if (run.id) stop(); else start(); });

    function reset() { stop(); run.hist = []; run.init = null; run.result = null; draw(); }
    function stop() {
      if (run.id) { stopJob(run.id); run.id = null; }
      go.textContent = "Evolve in your browser"; go.classList.remove("running");
    }
    function start() {
      loadGraph(state.bench, function (g) {
        run.hist = []; run.init = null; run.result = null; run.t0 = Date.now();
        go.textContent = "Stop"; go.classList.add("running");
        var bench = state.bench;
        run.id = startJob({ blif: g.blif, size: run.size, epsilon: run.epsilon, seed: run.seed }, function (m) {
          if (bench !== state.bench) return;
          if (m.type === "error") { readout.textContent = "The background thread failed: " + m.error; stop(); return; }
          if (m.type === "start") { run.init = m.initial; run.startBest = m.best; }
          if (m.history) run.hist = run.hist.concat(m.history);
          if (m.type === "done") {
            run.result = m; run.id = null;
            go.textContent = "Evolve again"; go.classList.remove("running");
          }
          draw();
        });
      });
    }

    function draw() {
      var info = state.data.benchmarks[state.bench];
      var W = chartWidth(chart), H = 230, padL = 36, padR = 10, padT = 14, padB = 30;
      chart.setAttribute("viewBox", "0 0 " + W + " " + H);
      chart.textContent = "";
      var hist = run.hist, n = Math.max(hist.length, 10);
      var vals = [info.simpler.a, info.saga.a];
      if (run.init) vals = vals.concat(run.init);
      hist.forEach(function (h) { vals.push(h.best, h.avg); });
      var lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals);
      lo = Math.max(0, Math.floor(lo - 2)); hi = Math.ceil(hi + 2);
      var x = function (t) { return padL + (W - padL - padR) * t / n; };
      var y = function (v) { return padT + (H - padT - padB) * (hi - v) / (hi - lo); };
      // grid
      var step = Math.max(1, Math.ceil((hi - lo) / 6));
      for (var v = Math.ceil(lo / step) * step; v <= hi; v += step) {
        chart.appendChild(svg("line", { x1: padL, x2: W - padR, y1: y(v), y2: y(v), class: "c-grid" }));
        chart.appendChild(svg("text", { x: padL - 6, y: y(v) + 4, "text-anchor": "end", class: "c-tick" }, String(v)));
      }
      chart.appendChild(svg("text", { x: padL, y: H - 8, class: "c-label" }, "generation 0"));
      chart.appendChild(svg("text", { x: W - padR, y: H - 8, "text-anchor": "end", class: "c-label" }, String(n)));
      // reference lines
      function ref(val, label, cls, levels) {
        var gEl = svg("g", levels ? { "data-levels": levels } : {});
        gEl.appendChild(svg("line", { x1: padL, x2: W - padR, y1: y(val), y2: y(val), class: cls }));
        gEl.appendChild(svg("text", { x: W - padR - 2, y: y(val) - 4, "text-anchor": "end", class: "c-label" }, label));
        chart.appendChild(gEl);
      }
      ref(info.simpler.a, "SIMPLER: " + info.simpler.a, "c-ref");
      var t3 = info.table3[run.epsilon];
      if (run.size === 2000 && t3) ref(t3[0], "paper, ε = " + run.epsilon + ": " + t3[0], "c-paper");
      // initial population spread at generation 0
      if (run.init) {
        var counts = {};
        run.init.forEach(function (f) { counts[f] = (counts[f] || 0) + 1; });
        var maxc = Math.max.apply(null, Object.keys(counts).map(function (k) { return counts[k]; }));
        Object.keys(counts).forEach(function (k) {
          var w = 3 + 22 * counts[k] / maxc;
          chart.appendChild(svg("rect", { x: x(0), y: y(+k) - 1.5, width: w, height: 3, class: "sg-init" }));
        });
      }
      if (hist.length) {
        var pts = function (key) { return hist.map(function (h, i) { return x(i + 1).toFixed(1) + "," + y(h[key]).toFixed(1); }).join(" "); };
        chart.appendChild(svg("polyline", { points: x(0) + "," + y(run.startBest) + " " + pts("best"), class: "sg-line-best" }));
        chart.appendChild(svg("polyline", { points: pts("avg"), class: "sg-line-avg", "data-levels": "hs ug grad res" }));
      }
      // readout
      readout.textContent = "";
      if (!run.init && !run.id) {
        readout.appendChild(el("p", { class: "w-note", text: "Press Evolve. Short bars at generation 0 show how many of the random starting orders need each number of cells." }));
        return;
      }
      var best = run.result ? run.result.final : (hist.length ? Math.min.apply(null, hist.map(function (h) { return h.best; })) : run.startBest);
      var secs = ((Date.now() - run.t0) / 1000).toFixed(1);
      readout.appendChild(el("p", { class: "w-big", html: (run.result ? "Finished: <strong>" : "Running: <strong>") + best + "</strong> cells <span class=\"w-mono\">" + hist.length + " generations, " + (run.result ? (run.result.ms / 1000).toFixed(1) : secs) + " s, population " + num(run.size) + "</span>" }));
      if (run.init) {
        var rb = Math.min.apply(null, run.init), rw = Math.max.apply(null, run.init);
        readout.appendChild(el("p", { class: "w-note", text: "The " + num(run.init.length) + " random starting orders needed " + rb + " to " + rw + " cells. SIMPLER reported " + info.simpler.a + " for its own netlist; the paper's SAGA result is " + info.saga.a + " (population 2,000, ε = " + num(info.saga.eps) + ")." }));
      }
      if (run.result) {
        var goRun = null;
        if (run.size === 2000 && run.epsilon === 50) info.go.runs.forEach(function (r) { if (r.seed === run.seed) goRun = r; });
        if (goRun) {
          readout.appendChild(el("p", { class: "w-note sg-check-line", html: "Checked: the authors' Go tool with <code>-pop 2000 -epsilon 50 -seed " + run.seed + "</code> returns " + (goRun.gens ? "after " + goRun.gens + " generations " : "") + "an order needing " + goRun.final + " cells" + (goRun.final === run.result.final && (!goRun.gens || goRun.gens === hist.length) ? (goRun.sameSeq ? ", the same order your browser found." : ", the same as your browser.") : ". Your browser differs; please report this.") }));
        }
        if (run.result.bestEver < run.result.final) {
          readout.appendChild(el("p", { class: "w-note", "data-levels": "grad res", text: "The tool reports the best order in its final population (" + run.result.final + "). An earlier generation held an order needing " + run.result.bestEver + " cells; mutation changed it before the run ended." }));
        }
      }
    }
    onBench(reset);
    resizers.push(draw);
    document.addEventListener("paperlevel", function () { setTimeout(draw, 0); });
    draw();
  }

  /* ------------------------------------------------------------ demo 4: the paper's results */

  function mountResults(root) {
    var view = { metric: "a", eps: "t1" };
    var mseg = seg([
      { value: "a", label: "Memory cells" }, { value: "c", label: "Cycles" }, { value: "e", label: "Efficiency" }
    ], view.metric, function (v) { view.metric = v; draw(); }, "Measure");
    var eSeg = seg([
      { value: "t1", label: "Table I" }, { value: "50", label: "ε = 50" }, { value: "500", label: "ε = 500" }, { value: "5000", label: "ε = 5,000" }
    ], view.eps, function (v) { view.eps = v; draw(); }, "SAGA result to show");
    var chart = svg("svg", { class: "sg-dumb", role: "img", "aria-label": "SIMPLER and SAGA results for ten benchmark circuits" });
    var summary = el("div", { class: "sg-readout" });
    root.appendChild(el("div", { class: "w-actions" }, [mseg]));
    root.appendChild(el("div", { class: "w-actions", "data-levels": "grad res" }, [eSeg]));
    root.appendChild(chart);
    root.appendChild(summary);
    root.appendChild(el("p", { class: "w-note", text: "Values from the paper's Tables I and III. Efficiency is 1,000,000 ÷ (cycles × cells), the measure SIMPLER introduced; higher is better. Summary percentages are computed by this page from Table I." }));

    function sagaRow(r) {
      if (view.eps === "t1" || !isDeep()) return { c: r.saga.c, a: r.saga.a, e: r.saga.e };
      var t = r.table3[view.eps];
      return { c: r.saga.c, a: t[0], e: t[1] };
    }

    function draw() {
      var rows = state.data.table1, m = view.metric;
      var W = chartWidth(chart), rowH = 26, padL = 70, padR = 58, padT = 22, H = padT + rows.length * rowH + 12;
      chart.setAttribute("viewBox", "0 0 " + W + " " + H);
      chart.textContent = "";
      var all = [];
      rows.forEach(function (r) { all.push(r.simpler[m], sagaRow(r)[m]); });
      var hi = Math.max.apply(null, all) * 1.05;
      var x = function (v) { return padL + (W - padL - padR) * v / hi; };
      chart.appendChild(svg("circle", { cx: padL + 6, cy: 9, r: 5, class: "sg-dot simpler" }));
      chart.appendChild(svg("text", { x: padL + 15, y: 13, class: "c-label" }, "SIMPLER"));
      chart.appendChild(svg("circle", { cx: padL + 96, cy: 9, r: 5, class: "sg-dot saga" }));
      chart.appendChild(svg("text", { x: padL + 105, y: 13, class: "c-label" }, "SAGA"));
      rows.forEach(function (r, i) {
        var s = sagaRow(r), a = r.simpler[m], b = s[m], yy = padT + i * rowH + rowH / 2;
        var better = m === "e" ? b > a : b < a;
        chart.appendChild(svg("line", { x1: padL, x2: W - padR, y1: yy, y2: yy, class: "c-grid" }));
        chart.appendChild(svg("text", { x: padL - 8, y: yy + 4, "text-anchor": "end", class: "c-tick" }, r.name));
        chart.appendChild(svg("line", { x1: x(a), x2: x(b), y1: yy, y2: yy, class: "sg-link " + (better ? "better" : "worse") }));
        chart.appendChild(svg("circle", { cx: x(a), cy: yy, r: 5, class: "sg-dot simpler" }));
        chart.appendChild(svg("circle", { cx: x(b), cy: yy, r: 5, class: "sg-dot saga" }));
        var d = m === "e" ? (b - a) / a * 100 : (a - b) / a * 100;
        chart.appendChild(svg("text", { x: W - 4, y: yy + 4, "text-anchor": "end", class: "c-label sg-delta " + (better ? "better" : "worse") }, (d > 0 ? "better " : d < 0 ? "worse " : "same ") + Math.abs(d).toFixed(0) + "%"));
      });
      // summary: geometric mean of (1 + change), the form that matches the paper's averages
      var ratios = rows.map(function (r) {
        var s = sagaRow(r);
        return { c: (r.simpler.c - s.c) / r.simpler.c, a: (r.simpler.a - s.a) / r.simpler.a, e: (s.e - r.simpler.e) / r.simpler.e };
      });
      function geo(key) { return (Math.exp(ratios.reduce(function (t, q) { return t + Math.log(1 + q[key]); }, 0) / ratios.length) - 1) * 100; }
      var paper = { a: "32.3% fewer", c: "29.5% more", e: "27.5% higher" };
      var mine = { a: geo("a"), c: geo("c"), e: geo("e") };
      var label = { a: "memory cells", c: "cycles", e: "efficiency" };
      summary.textContent = "";
      var txt = { a: Math.abs(mine.a).toFixed(1) + "% " + (mine.a >= 0 ? "fewer" : "more"),
        c: Math.abs(mine.c).toFixed(1) + "% " + (mine.c >= 0 ? "fewer" : "more"),
        e: Math.abs(mine.e).toFixed(1) + "% " + (mine.e >= 0 ? "higher" : "lower") };
      summary.appendChild(el("p", { class: "w-big", html: "Across the ten circuits, SAGA averages <strong>" + txt[m] + "</strong> " + label[m] + "." }));
      summary.appendChild(el("p", { class: "w-note", "data-levels": "ug grad res", text: "Geometric mean of (1 + change) over Table I, computed by this page; the paper reports " + paper[m] + " " + label[m] + "." + (isDeep() && view.eps !== "t1" ? " The ε row above uses Table III areas; its average is the page's own." : "") }));
    }
    resizers.push(draw);
    document.addEventListener("paperlevel", function () { setTimeout(draw, 0); });
    draw();
  }

  /* ------------------------------------------------------------ boot */

  var mounts = [["sg-order", mountOrder], ["sg-memory", mountMemory], ["sg-evolve", mountEvolve], ["sg-results", mountResults]];

  fetch(SCRIPT_BASE + "saga-data.json").then(function (r) { return r.json(); }).then(function (data) {
    state.data = data;
    loadGraph(state.bench, function () {
      mounts.forEach(function (m) {
        var root = document.getElementById(m[0]);
        if (!root) return;
        m[1](root);
        root.classList.add("w-ready");
      });
    });
  }).catch(function (err) {
    mounts.forEach(function (m) {
      var root = document.getElementById(m[0]);
      if (root) root.appendChild(el("p", { class: "w-note", text: "The demo data did not load (" + err + ")." }));
    });
  });
})();

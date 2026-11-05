/*
  Lazy streams widget for /papers/lazy-streams/.
  Mount points: #ls-pull, #ls-hamming, #ls-eager, #ls-stirling, #ls-topo.
  Every stream here is a live object from stream-engine.js, the port of the
  paper's C++ classes; nothing on the page is precomputed.
*/
(function () {
  "use strict";

  var L = window.LazyStreams;
  if (!L) return;

  var SVGNS = "http://www.w3.org/2000/svg";
  var state = { level: window.PaperKit ? window.PaperKit.level() : "public" };
  var listeners = [];
  document.addEventListener("paperlevel", function (e) {
    state.level = e.detail.level;
    listeners.forEach(function (fn) { fn(); });
  });
  function atLeastUg() { return state.level === "ug" || state.level === "grad" || state.level === "res"; }
  function deep() { return state.level === "grad" || state.level === "res"; }

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
    var w = node && node.clientWidth ? node.clientWidth : 640;
    return Math.max(300, Math.min(760, w));
  }
  var resizers = [];
  var resizeTimer = null;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () { resizers.forEach(function (fn) { fn(); }); }, 150);
  });
  function seg(options, value, onPick, label) {
    var wrap = el("div", { class: "seg", role: "radiogroup", "aria-label": label });
    var btns = [];
    options.forEach(function (o) {
      var b = el("button", { type: "button", class: "seg-option", role: "radio", "aria-checked": String(o.value === value), text: o.label });
      if (o.title) b.title = o.title;
      b.addEventListener("click", function () { set(o.value); onPick(o.value); });
      wrap.appendChild(b);
      btns.push({ b: b, v: o.value });
    });
    function set(v) { value = v; btns.forEach(function (x) { x.b.setAttribute("aria-checked", String(x.v === v)); }); }
    wrap.set = set;
    return wrap;
  }
  function btn(text, onClick, quiet) {
    return el("button", { type: "button", class: "w-btn" + (quiet ? " w-btn-quiet" : ""), text: text, onclick: onClick });
  }
  function labeled(label, control, levels) {
    var row = el("div", { class: "ls-ctl" }, [el("span", { class: "ls-ctl-label", text: label }), control]);
    if (levels) row.setAttribute("data-levels", levels);
    return row;
  }
  function num(x) { return Number(x).toLocaleString("en-US", { maximumFractionDigits: 0 }); }
  function words(n) { return ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"][n] || num(n); }
  function factor(n) {
    var parts = [], x = n;
    for (var p = 2; p * p <= x; p++) {
      var e = 0;
      while (x % p === 0) { x /= p; e++; }
      if (e) parts.push(p + (e > 1 ? sup(e) : ""));
    }
    if (x > 1) parts.push(String(x));
    return parts.join("·");
  }
  function sup(e) { return String(e).split("").map(function (d) { return "⁰¹²³⁴⁵⁶⁷⁸⁹"[+d]; }).join(""); }
  function measure(fn) {
    var before = L.counts().total || 0;
    var out = fn();
    return { value: out, made: (L.counts().total || 0) - before };
  }

  /* ------------------------------------------------------------ live object trees */

  // Describe a stream object as a tree for drawing. Children follow the objects
  // the stream holds: a Times holds its input, a Merge its two branches.
  function describe(s, depth, maxDepth, onPath) {
    if (!s) return null;
    var node = { kind: s.kind, head: s.isEmpty ? null : s.head, empty: s.isEmpty, kids: [], label: "", onPath: !!onPath && !s.isEmpty };
    if (s.kind === "Successor") node.label = "Successor";
    else if (s.kind === "Times") node.label = "Times ×" + s.multiplier;
    else if (s.kind === "Merge") node.label = "Merge";
    else if (s.kind === "List") node.label = "List [" + s.tokens.slice(s.offset, s.offset + Math.max(0, s.size)).join(", ") + "]";
    else if (s.kind === "Hamming") node.label = "Hamming [" + (s.p.isEmpty ? "" : s.p.tokens.slice(s.p.offset, s.p.offset + s.p.size).join(", ")) + "]";
    else node.label = s.kind;
    if (depth >= maxDepth) {
      if (s.kind === "Times" || s.kind === "Merge") node.more = true;
      return node;
    }
    if (s.kind === "Times") node.kids.push(describe(s.inStream, depth + 1, maxDepth, node.onPath));
    if (s.kind === "Merge") {
      node.kids.push(describe(s.branch1, depth + 1, maxDepth, node.onPath));
      node.kids.push(describe(s.branch2, depth + 1, maxDepth, false));
    }
    return node;
  }

  // Simple tidy layout: leaves left to right, parents centered over children.
  function layout(root) {
    var leaves = 0, maxD = 0;
    (function walk(n, d) {
      n.depth = d; maxD = Math.max(maxD, d);
      if (!n.kids.length) { n.x = leaves++; return; }
      n.kids.forEach(function (k) { walk(k, d + 1); });
      n.x = (n.kids[0].x + n.kids[n.kids.length - 1].x) / 2;
    })(root, 0);
    return { leaves: Math.max(1, leaves), depth: maxD };
  }

  function drawTree(host, stream, maxDepth, caption) {
    host.innerHTML = "";
    if (chartWidth(host) < 560) maxDepth = Math.min(maxDepth, 2);
    var root = describe(stream, 0, maxDepth, true);
    var dims = layout(root);
    var W = chartWidth(host), boxW = Math.min(132, (W - 20) / dims.leaves - 8), boxH = 34, rowH = 58;
    var compact = boxW < 92;
    var H = (dims.depth + 1) * rowH + 30;
    var g = svg("svg", { viewBox: "0 0 " + W + " " + H, class: "ls-tree", role: "img", "aria-label": caption });
    var span = (W - 20) / dims.leaves;
    function px(n) { return 10 + span * (n.x + 0.5); }
    function py(n) { return 22 + n.depth * rowH; }
    g.appendChild(svg("text", { x: px(root), y: 12, "text-anchor": "middle", class: "c-label" }, "consumer reads the top head ↑"));
    (function edges(n) {
      n.kids.forEach(function (k) {
        g.appendChild(svg("line", { x1: px(n), y1: py(n) + boxH, x2: px(k), y2: py(k), class: "ls-edge" + (k.onPath ? " next" : "") }));
        edges(k);
      });
    })(root);
    (function nodes(n) {
      var x = px(n) - boxW / 2, y = py(n);
      g.appendChild(svg("rect", { x: x, y: y, width: boxW, height: boxH, class: "ls-node k-" + n.kind + (n.onPath ? " next" : "") + (n.empty ? " empty" : "") }));
      var label = n.label;
      if (compact && label.length > 12) label = label.replace("Successor", "Succ").replace("Hamming", "Ham").replace("Times ", "");
      if (label.length > 18) label = label.slice(0, 17) + "…";
      g.appendChild(svg("text", { x: px(n), y: y + 13, "text-anchor": "middle", class: "ls-node-kind" }, label));
      g.appendChild(svg("text", { x: px(n), y: y + 28, "text-anchor": "middle", class: "ls-node-head" }, n.empty ? "empty" : (compact ? "" : "head ") + num(n.head)));
      if (n.more) g.appendChild(svg("text", { x: px(n), y: y + boxH + 13, "text-anchor": "middle", class: "c-tick" }, "⋮"));
      n.kids.forEach(nodes);
    })(root);
    host.appendChild(g);
  }

  /* ============================================================ 1. pull */

  function mountPull(host) {
    var presets = {
      count: { label: "Count up", fig: "Fig. 2.4", build: function () { return new L.Successor(1); }, code: "consumer(new Successor(1))" },
      times: { label: "Times 5", fig: "Fig. 2.6", build: function () { return new L.Times(5, new L.Successor(1)); }, code: "consumer(new Times(5, new Successor(1)))" },
      merge: { label: "Merge 2s and 3s", fig: "Fig. 2.8", build: function () { return new L.Merge(new L.Times(2, new L.Successor(1)), new L.Times(3, new L.Successor(1))); }, code: "consumer(new Merge(new Times(2, new Successor(1)), new Times(3, new Successor(1))))" },
      shared: { label: "One counter, two readers", fig: "Fig. 2.10", build: function () { var s = new L.Successor(1); return new L.Merge(new L.Times(2, s), s); }, code: "s = new Successor(1); consumer(new Merge(new Times(2, s), s))" }
    };
    var st = { key: "merge", cur: null, out: [], made: 0 };
    var treeHost = el("div", { class: "ls-tree-host" });
    var tokens = el("div", { class: "ls-tokens", "aria-live": "polite" });
    var readout = el("p", { class: "ls-readout" });
    var code = el("p", { class: "w-mono", "data-levels": "ug grad res" });

    function reset() {
      var r = measure(function () { return presets[st.key].build(); });
      st.cur = r.value; st.out = []; st.made = r.made;
      draw();
    }
    function pull(k) {
      for (var i = 0; i < k && !st.cur.isEmpty; i++) {
        st.out.push(st.cur.head);
        var r = measure(function () { return st.cur.tail(); });
        st.cur = r.value; st.made += r.made;
      }
      draw();
    }
    function draw() {
      tokens.innerHTML = "";
      if (!st.out.length) tokens.appendChild(el("span", { class: "ls-empty", text: "Nothing read yet. The stream has computed only its first head: " + st.cur.head + "." }));
      st.out.forEach(function (t, i) {
        var dup = i > 0 && st.out[i - 1] === t;
        tokens.appendChild(el("span", { class: "ls-token" + (dup ? " dup" : ""), text: String(t), title: dup ? "Repeated: Merge keeps equal tokens from both inputs" : "" }));
      });
      tokens.appendChild(el("span", { class: "ls-token next", text: String(st.cur.head), title: "Already computed, not yet read" }));
      drawTree(treeHost, st.cur, 4, "Stream objects behind the next token");
      var dups = 0;
      st.out.forEach(function (t, i) { if (i && st.out[i - 1] === t) dups++; });
      readout.innerHTML = "Read <strong>" + st.out.length + "</strong> token" + (st.out.length === 1 ? "" : "s") +
        "; stream objects built so far: <strong>" + st.made + "</strong>" +
        (dups ? "; repeated tokens: " + dups : "") + ".";
      code.textContent = presets[st.key].fig + ": " + presets[st.key].code;
    }

    var pick = seg(Object.keys(presets).map(function (k) { return { value: k, label: presets[k].label, title: presets[k].fig }; }), st.key, function (v) { st.key = v; reset(); }, "Stream to read");
    host.appendChild(labeled("Stream", pick));
    host.appendChild(el("div", { class: "w-actions" }, [btn("Read one token", function () { pull(1); }), btn("Read ten", function () { pull(10); }, true), btn("Start over", reset, true)]));
    host.appendChild(tokens);
    host.appendChild(readout);
    host.appendChild(treeHost);
    host.appendChild(code);
    host.appendChild(el("p", { class: "w-note", text: "Highlighted boxes are the path the next token comes from. Each read calls tail() once, which builds new objects and computes exactly one new head." }));
    resizers.push(draw);
    reset();
  }

  /* ============================================================ 2. Hamming */

  function mountHamming(host) {
    var PRIMES = [2, 3, 5, 7, 11, 13];
    var st = { primes: L.PAPER.hammingPrimes.slice(), cur: null, out: [], made: 0 };
    var chips = el("div", { class: "seg ls-primes", role: "group", "aria-label": "Primes" });
    var tokens = el("div", { class: "ls-tokens", "aria-live": "polite" });
    var check = el("p", { class: "ls-check" });
    var readout = el("p", { class: "ls-readout" });
    var treeHost = el("div", { class: "ls-tree-host", "data-levels": "ug grad res" });
    var costWrap = el("div", { class: "ls-cost", "data-levels": "grad res" });

    PRIMES.forEach(function (p) {
      var b = el("button", { type: "button", class: "seg-option", "aria-pressed": "false", text: String(p) });
      b.addEventListener("click", function () {
        var i = st.primes.indexOf(p);
        if (i >= 0) { if (st.primes.length > 1) st.primes.splice(i, 1); }
        else { st.primes.push(p); st.primes.sort(function (a, c) { return a - c; }); }
        reset();
      });
      chips.appendChild(b);
    });

    function reset() {
      Array.prototype.forEach.call(chips.children, function (b) { b.setAttribute("aria-pressed", String(st.primes.indexOf(+b.textContent) >= 0)); });
      var r = measure(function () { return new L.Hamming(new L.List(st.primes.slice())); });
      st.cur = r.value; st.out = []; st.made = r.made;
      draw();
      drawCost();
    }
    function pull(k) {
      for (var i = 0; i < k && !st.cur.isEmpty; i++) {
        st.out.push(st.cur.head);
        var r = measure(function () { return st.cur.tail(); });
        st.cur = r.value; st.made += r.made;
      }
      draw();
    }
    function draw() {
      tokens.innerHTML = "";
      var showFactors = state.level !== "public";
      st.out.forEach(function (t) {
        var over = t > L.INT_MAX && deep();
        var tok = el("span", { class: "ls-token" + (over ? " over" : ""), title: factor(t) + (over ? " (larger than the 32-bit int the paper's head uses)" : "") }, [String(num(t))]);
        if (showFactors) tok.appendChild(el("small", { text: factor(t) }));
        tokens.appendChild(tok);
      });
      tokens.appendChild(el("span", { class: "ls-token next", title: "Already computed, not yet read" }, [num(st.cur.head)]));
      var isPaper = st.primes.join(",") === L.PAPER.hammingPrimes.join(",");
      if (isPaper) {
        var n = Math.min(10, st.out.length), ok = true;
        for (var i = 0; i < n; i++) if (st.out[i] !== L.PAPER.hammingFirstTen[i]) ok = false;
        check.innerHTML = n < 10
          ? "Paper check: the text lists the first ten tokens for 3, 5, and 11. Read " + (10 - n) + " more to compare."
          : (ok ? "<strong>Matches the paper:</strong> " : "<strong>Differs from the paper:</strong> ") + "3, 5, 9, 11, 15, 25, 27, 33, 45, 55 (Section 1).";
      } else {
        check.textContent = "The paper lists tokens only for the primes 3, 5, and 11; pick exactly those to compare.";
      }
      readout.innerHTML = "Read <strong>" + st.out.length + "</strong>; stream objects built so far: <strong>" + num(st.made) + "</strong> (this page's count).";
      drawTree(treeHost, st.cur, state.level === "ug" ? 3 : 4, "Live stream objects inside the Hamming stream");
    }

    function drawCost() {
      costWrap.innerHTML = "";
      var Ns = [10, 20, 50, 100, 200, 400, 800];
      var rows = Ns.map(function (n) {
        var c = L.hammingCost(st.primes.slice(), n);
        return { n: n, paper: c.paper.total, memo: c.memo.total, same: c.values.join() === c.memoValues.join() };
      });
      L.resetCounts();
      var W = chartWidth(costWrap.parentNode || costWrap), H = 220, m = { l: 56, r: 14, t: 14, b: 34 };
      var g = svg("svg", { viewBox: "0 0 " + W + " " + H, class: "ls-chart", role: "img", "aria-label": "Stream objects built against tokens read, paper style and memoized" });
      var lx = function (n) { return m.l + (Math.log10(n) - 1) / (Math.log10(800) - 1) * (W - m.l - m.r); };
      var ymax = Math.max.apply(null, rows.map(function (r) { return r.paper; }));
      var top = Math.pow(10, Math.ceil(Math.log10(ymax)));
      var ly = function (v) { return H - m.b - (Math.log10(v) - 1) / (Math.log10(top) - 1) * (H - m.t - m.b); };
      for (var e = 1; Math.pow(10, e) <= top; e++) {
        var v = Math.pow(10, e);
        g.appendChild(svg("line", { x1: m.l, x2: W - m.r, y1: ly(v), y2: ly(v), class: "c-grid" }));
        g.appendChild(svg("text", { x: m.l - 6, y: ly(v) + 4, "text-anchor": "end", class: "c-tick" }, num(v)));
      }
      Ns.forEach(function (n) { g.appendChild(svg("text", { x: lx(n), y: H - m.b + 15, "text-anchor": "middle", class: "c-tick" }, String(n))); });
      g.appendChild(svg("text", { x: (W + m.l) / 2, y: H - 4, "text-anchor": "middle", class: "c-label" }, "tokens read (log scale)"));
      function line(key, cls) {
        var d = rows.map(function (r, i) { return (i ? "L" : "M") + lx(r.n).toFixed(1) + " " + ly(r[key]).toFixed(1); }).join(" ");
        g.appendChild(svg("path", { d: d, class: "ls-line " + cls }));
        rows.forEach(function (r) { g.appendChild(svg("circle", { cx: lx(r.n), cy: ly(r[key]), r: 3, class: "ls-dot " + cls })); });
        var last = rows[rows.length - 1];
        g.appendChild(svg("text", { x: lx(last.n) - 4, y: ly(last[key]) + (key === "memo" ? 16 : -8), "text-anchor": "end", class: "c-label " + cls }, key === "paper" ? "paper's classes" : "memoized (page)"));
      }
      line("paper", "paper");
      line("memo", "memo");
      costWrap.appendChild(el("p", { class: "w-big", html: "Cost of reading the stream, computed by this page" }));
      costWrap.appendChild(g);
      var a = rows[rows.length - 2], b = rows[rows.length - 1];
      var slope = Math.log(b.paper / a.paper) / Math.log(b.n / a.n);
      costWrap.appendChild(el("p", { class: "w-note", html:
        "Stream objects built to read <em>n</em> tokens of Hamming [" + st.primes.join(", ") + "], counting every constructor call. " +
        "At " + num(b.n) + " tokens the paper's classes build " + num(b.paper) + " objects and a version that keeps each computed tail builds " + num(b.memo) +
        "; between " + num(a.n) + " and " + num(b.n) + " tokens the paper-style count grows as about <em>n</em><sup>" + slope.toFixed(2) + "</sup>. " +
        "Both produce the same tokens" + (rows.every(function (r) { return r.same; }) ? " at every size checked" : "") + ". The paper reports no costs; this comparison is the page's." }));
    }

    host.appendChild(labeled("Primes", chips));
    host.appendChild(el("div", { class: "w-actions" }, [btn("Read one token", function () { pull(1); }), btn("Read ten", function () { pull(10); }, true), btn("Start over", reset, true)]));
    host.appendChild(tokens);
    host.appendChild(check);
    host.appendChild(readout);
    host.appendChild(treeHost);
    host.appendChild(costWrap);
    listeners.push(draw);
    resizers.push(function () { draw(); drawCost(); });
    reset();
  }

  /* ============================================================ 3. eager vs lazy */

  function mountEager(host) {
    var primes = L.PAPER.hammingPrimes;
    var MAX = 18;
    var st = { t: 0, timer: null, lazy: null, lazyOut: [] };
    var fig = el("div", { class: "ls-eager-host" });
    var readout = el("p", { class: "ls-readout" });
    var go = btn("Run both", function () { if (st.timer) stop(); else start(); });

    function start() {
      if (st.t >= MAX) resetAll();
      go.textContent = "Pause"; go.classList.add("running");
      st.timer = setInterval(step, 420);
    }
    function stop() { clearInterval(st.timer); st.timer = null; go.textContent = st.t >= MAX ? "Run again" : "Run both"; go.classList.remove("running"); }
    function resetAll() {
      st.t = 0;
      st.lazy = new L.Hamming(new L.List(primes.slice()));
      st.lazyOut = [];
      draw();
    }
    function step() {
      if (st.t >= MAX) { stop(); return; }
      st.t++;
      st.lazyOut.push(st.lazy.head);
      st.lazy = st.lazy.tail();
      draw();
      if (st.t >= MAX) stop();
    }
    function frame() { return "hamming [" + primes.join(", ") + "]"; }
    function draw() {
      fig.innerHTML = "";
      var W = chartWidth(fig), half = W / 2, rowH = 15, H = 46 + Math.max(4, st.t) * rowH;
      var g = svg("svg", { viewBox: "0 0 " + W + " " + H, class: "ls-eager", role: "img", "aria-label": "Eager evaluation keeps calling deeper while lazy evaluation returns tokens" });
      g.appendChild(svg("text", { x: 6, y: 14, class: "ls-lane-title" }, "Eager: evaluate everything first"));
      g.appendChild(svg("text", { x: half + 10, y: 14, class: "ls-lane-title" }, "Lazy: compute on demand"));
      g.appendChild(svg("line", { x1: half, x2: half, y1: 4, y2: H - 4, class: "c-grid" }));
      for (var k = 0; k < st.t; k++) {
        var y = 30 + k * rowH;
        var indent = Math.min(k * 9, half * 0.45);
        g.appendChild(svg("rect", { x: 6 + indent, y: y - 11, width: half - 14 - indent, height: rowH - 2, class: "ls-frame" }));
        var txt = "call " + (k + 1) + ": " + frame(0) + ", left child first";
        g.appendChild(svg("text", { x: 10 + indent, y: y, class: "ls-frame-text" }, txt.length > (half - indent) / 6.2 ? txt.slice(0, Math.floor((half - indent) / 6.2) - 1) + "…" : txt));
      }
      st.lazyOut.forEach(function (t, i) {
        var y = 30 + i * rowH;
        g.appendChild(svg("text", { x: half + 10, y: y, class: "ls-lazy-token" }, "token " + (i + 1) + ": " + t));
      });
      g.appendChild(svg("text", { x: 6, y: H - 6, class: "c-label" }, "tokens produced: 0"));
      g.appendChild(svg("text", { x: half + 10, y: H - 6, class: "c-label" }, "tokens produced: " + st.lazyOut.length));
      fig.appendChild(g);
      readout.innerHTML = st.t === 0
        ? "Both start from hamming [" + primes.join(", ") + "]. Press <strong>Run both</strong>."
        : "After " + st.t + " steps the eager evaluation is " + st.t + " calls deep and has produced nothing; it never reaches the right branch (Fig. 1.2). The lazy stream has produced " + st.lazyOut.length + " tokens." +
          (st.t >= MAX ? " The eager stack would keep growing until the program runs out of memory." : "");
    }
    host.appendChild(el("div", { class: "w-actions" }, [go, btn("Reset", function () { stop(); resetAll(); }, true)]));
    host.appendChild(fig);
    host.appendChild(readout);
    resizers.push(draw);
    resetAll();
  }

  /* ============================================================ 4. Stirling */

  function mountStirling(host) {
    var st = { rows: 8, s: null, filled: [], made: 0, last: null };
    var gridHost = el("div", { class: "ls-table-wrap" });
    var readout = el("p", { class: "ls-readout" });
    var check = el("p", { class: "ls-check" });
    var rowsPick = seg([{ value: 8, label: "8 rows (Fig. 7.1)" }, { value: 10, label: "10 rows" }, { value: 12, label: "12 rows" }], 8, function (v) { st.rows = v; reset(); }, "Rows");

    function reset() {
      var r = measure(function () { return new L.Stirling2(1, 1); });
      st.s = r.value; st.filled = []; st.made = r.made; st.last = null;
      draw();
    }
    function cells() { return st.rows * (st.rows + 1) / 2; }
    function step(k) {
      for (var i = 0; i < k && st.filled.length < cells(); i++) {
        var pos = posOf(st.filled.length);
        var info = { n: pos.n, m: pos.m, head: st.s.head, t1: st.s.term1, t2: st.s.term2, before: st.made };
        st.filled.push(st.s.head);
        var r = measure(function () { return st.s.tail(); });
        st.s = r.value; st.made += r.made;
        info.cost = r.made;
        st.last = info;
      }
      draw();
    }
    function posOf(idx) {
      var n = 1;
      while (idx >= n) { idx -= n; n++; }
      return { n: n, m: idx + 1 };
    }
    function draw() {
      gridHost.innerHTML = "";
      var tbl = el("table", { class: "results-table ls-stir" });
      var head = el("tr", {}, [el("th", { text: "n / m" })]);
      for (var m = 1; m <= st.rows; m++) head.appendChild(el("th", { text: String(m) }));
      tbl.appendChild(el("thead", {}, [head]));
      var body = el("tbody");
      var idx = 0;
      var nextPos = st.filled.length < cells() ? posOf(st.filled.length) : null;
      for (var n = 1; n <= st.rows; n++) {
        var tr = el("tr", {}, [el("th", { text: String(n) })]);
        for (var mm = 1; mm <= st.rows; mm++) {
          var td = el("td", { class: "ls-num" });
          if (mm <= n) {
            if (idx < st.filled.length) td.textContent = num(st.filled[idx]);
            if (st.last && st.last.n === n && st.last.m === mm) td.className += " on";
            if (nextPos && nextPos.n === n && nextPos.m === mm) { td.className += " pending"; td.textContent = "·"; }
            if (st.last && st.last.t1 != null && ((st.last.n - 1 === n && st.last.m - 1 === mm) || (st.last.n - 1 === n && st.last.m === mm))) td.className += " src";
            idx++;
          }
          tr.appendChild(td);
        }
        body.appendChild(tr);
      }
      tbl.appendChild(body);
      gridHost.appendChild(tbl);
      var l = st.last;
      var msg = "Filled <strong>" + st.filled.length + "</strong> of " + cells() + " cells from one stream; stream objects built: <strong>" + num(st.made) + "</strong> (this page's count).";
      if (l) {
        var rule = l.t1 != null
          ? "S(" + l.n + ", " + l.m + ") = S(" + (l.n - 1) + ", " + (l.m - 1) + ") + " + l.m + " × S(" + (l.n - 1) + ", " + l.m + ") = " + num(l.t1) + " + " + l.m + " × " + num(l.t2) + " = " + num(l.head)
          : "S(" + l.n + ", " + l.m + ") = " + l.head + (l.m === l.n ? " (m = n, so the next call starts row " + (l.n + 1) + ")" : " (m = 1)");
        msg += "<span class=\"w-mono\">" + rule + (atLeastUg() && l.t1 != null ? "; the constructor built two fresh Stirling2 objects to get the two terms" : "") + "</span>";
      }
      readout.innerHTML = msg;
      if (st.rows >= 8 && st.filled.length >= 36) {
        var row8 = st.filled.slice(28, 36), ok = row8.join() === L.PAPER.stirlingRow8.join();
        check.innerHTML = (ok ? "<strong>Matches the paper:</strong> " : "<strong>Differs from the paper:</strong> ") + "all eight rows equal Fig. 7.1, ending 1, 127, 966, 1,701, 1,050, 266, 28, 1.";
      } else {
        check.textContent = "Fill the first eight rows to compare with the paper's sample output (Fig. 7.1).";
      }
    }
    host.appendChild(labeled("Table", rowsPick, "ug grad res"));
    host.appendChild(el("div", { class: "w-actions" }, [btn("Next number", function () { step(1); }), btn("Next row", function () {
      var pos = st.filled.length < cells() ? posOf(st.filled.length) : null;
      step(pos ? pos.n - pos.m + 1 : 0);
    }, true), btn("Fill the table", function () { step(cells()); }, true), btn("Start over", reset, true)]));
    host.appendChild(gridHost);
    host.appendChild(readout);
    host.appendChild(check);
    listeners.push(draw);
    reset();
  }

  /* ============================================================ 5. topological sort */

  function mountTopo(host) {
    var files = {
      paper: { label: "Fig. 7.3", text: L.FIG73 },
      reordered: { label: "Same graph, names reordered", text: "d b f e c a -\n-\n0 3 -\n5 4 -\n5 -\n0 -\n4 0 -" },
      cycle: { label: "Add a cycle", text: "e a f c d b -\n1 -\n3 4 -\n1 3 -\n4 -\n5 -\n0 4 -" }
    };
    var st = { key: "paper", text: files.paper.text, vs: null, t: null, out: [], cycle: null, trace: [] };
    var fig = el("div", { class: "ls-graph-host" });
    var outRow = el("div", { class: "ls-tokens", "aria-live": "polite" });
    var check = el("p", { class: "ls-check" });
    var traceP = el("p", { class: "w-mono", "data-levels": "ug grad res" });
    var area = el("textarea", { class: "ls-file", rows: "7", spellcheck: "false", "aria-label": "Input file in the paper's format" });
    var fileRow = el("div", { class: "ls-file-row", "data-levels": "ug grad res" }, [
      el("p", { class: "w-note", text: "The input file, in the paper's format (Fig. 7.3): vertex names up to a dash, then one line per vertex listing the 0-based positions of the vertices it depends on, each ending with a dash. Edit it and press Load." }),
      area,
      el("div", { class: "w-actions" }, [btn("Load", function () { st.key = "custom"; pick.set(null); st.text = area.value; reset(); }, true)])
    ]);

    function reset() {
      st.vs = L.parseGraph(st.text);
      area.value = st.text;
      st.out = []; st.cycle = null; st.trace = [];
      st.vs.forEach(function (v) { v.done = false; v.error = false; });
      build();
    }
    function build() {
      var trace = [];
      st.trace = trace;
      // Same construction the C++ performs, with a visit trace for the page.
      try { st.t = new L.Topo(st.vs, trace); }
      catch (e) {
        if (!e || !e.vertex) throw e;
        st.t = { isEmpty: true, cycle: e.vertex, tail: function () { return st.t; } };
      }
      st.cycle = st.t.cycle || null;
      draw();
    }
    function next() {
      if (st.t.isEmpty) return;
      st.out.push(st.t.head);
      build();
    }
    function levels() {
      var depth = {}, byName = {};
      st.vs.forEach(function (v) { byName[v.ident] = v; });
      function d(v, seen) {
        if (depth[v.ident] != null) return depth[v.ident];
        if (seen[v.ident]) return 0;
        seen[v.ident] = true;
        var best = 0;
        v.depends.forEach(function (u) { best = Math.max(best, d(u, seen) + 1); });
        seen[v.ident] = false;
        depth[v.ident] = best;
        return best;
      }
      st.vs.forEach(function (v) { d(v, {}); });
      return depth;
    }
    function draw() {
      fig.innerHTML = "";
      var depth = levels();
      var cols = {}, maxD = 0;
      st.vs.forEach(function (v) { var k = depth[v.ident]; (cols[k] = cols[k] || []).push(v); maxD = Math.max(maxD, k); });
      var W = chartWidth(fig), maxRows = Math.max.apply(null, Object.keys(cols).map(function (k) { return cols[k].length; }));
      var H = Math.max(190, maxRows * 62 + 70);
      var pos = {};
      Object.keys(cols).forEach(function (k) {
        cols[k].forEach(function (v, i) {
          pos[v.ident] = { x: 40 + (maxD ? k / maxD : 0.5) * (W - 80), y: ((H - 50) / (cols[k].length + 1)) * (i + 1) + 10 };
        });
      });
      var g = svg("svg", { viewBox: "0 0 " + W + " " + H, class: "ls-graph", role: "img", "aria-label": "Dependency graph; arrows point from a vertex to the vertices that depend on it" });
      var defs = svg("defs");
      var mk = svg("marker", { id: "ls-arrow", viewBox: "0 0 10 10", refX: "9", refY: "5", markerWidth: "7", markerHeight: "7", orient: "auto-start-reverse" });
      mk.appendChild(svg("path", { d: "M0 0 L10 5 L0 10 z", class: "ls-arrowhead" }));
      defs.appendChild(mk); g.appendChild(defs);
      var R = 17;
      st.vs.forEach(function (v) {
        v.depends.forEach(function (u) {
          var a = pos[u.ident], b = pos[v.ident];
          var dx = b.x - a.x, dy = b.y - a.y, len = Math.sqrt(dx * dx + dy * dy) || 1;
          var back = depth[u.ident] >= depth[v.ident];
          var cls = "ls-dep" + (back ? " back" : "");
          if (back) {
            var mx = (a.x + b.x) / 2 + dy * 0.35, my = (a.y + b.y) / 2 - dx * 0.35 - 30;
            g.appendChild(svg("path", { d: "M" + a.x + " " + (a.y - R) + " Q" + mx + " " + my + " " + b.x + " " + (b.y - R), class: cls, "marker-end": "url(#ls-arrow)" }));
          } else if (depth[v.ident] - depth[u.ident] > 1) {
            // Long edges bend below the row so they do not run through other vertices.
            var bend = 26 + 10 * (depth[v.ident] - depth[u.ident]);
            var cx = (a.x + b.x) / 2, cy = Math.max(a.y, b.y) + bend;
            g.appendChild(svg("path", { d: "M" + a.x + " " + (a.y + R) + " Q" + cx + " " + cy + " " + b.x + " " + (b.y + R + 2), class: cls, "marker-end": "url(#ls-arrow)" }));
          } else {
            g.appendChild(svg("line", { x1: a.x + dx / len * R, y1: a.y + dy / len * R, x2: b.x - dx / len * (R + 3), y2: b.y - dy / len * (R + 3), class: cls, "marker-end": "url(#ls-arrow)" }));
          }
        });
      });
      var visited = {};
      st.trace.forEach(function (t) { visited[t.visit] = true; });
      st.vs.forEach(function (v) {
        var p = pos[v.ident];
        var isHead = !st.t.isEmpty && st.t.head === v.ident;
        var cls = "ls-vert" + (v.done && !isHead ? " done" : "") + (isHead ? " head" : "") + (st.cycle === v ? " cycle" : "");
        g.appendChild(svg("circle", { cx: p.x, cy: p.y, r: R, class: cls }));
        g.appendChild(svg("text", { x: p.x, y: p.y + 5, "text-anchor": "middle", class: "ls-vert-label" + (v.done && !isHead ? " done" : "") }, v.ident));
        var k = st.out.indexOf(v.ident);
        if (k >= 0) g.appendChild(svg("text", { x: p.x + R + 2, y: p.y - R + 4, class: "c-tick" }, "#" + (k + 1)));
      });
      fig.appendChild(g);

      outRow.innerHTML = "";
      st.out.forEach(function (n) { outRow.appendChild(el("span", { class: "ls-token", text: n })); });
      if (!st.t.isEmpty) outRow.appendChild(el("span", { class: "ls-token next", text: st.t.head, title: "Already computed, not yet read" }));
      if (st.cycle) outRow.appendChild(el("span", { class: "ls-token cycle", text: "A cycle was found" }));
      else if (st.t.isEmpty) outRow.appendChild(el("span", { class: "ls-empty", text: "Stream empty: every vertex is placed." }));

      if (st.key === "paper") {
        check.innerHTML = st.out.length < 6
          ? "The paper gives d, c, a, e, f, b as one valid order for this graph. Read all six to compare."
          : (st.out.join() === L.PAPER.topoOrder.join() ? "<strong>Matches the paper:</strong> d, c, a, e, f, b." : "<strong>Differs from the paper.</strong>");
      } else if (st.key === "reordered") {
        check.textContent = "Same dependencies as Fig. 7.3, listed in a different order. The stream scans vertices in file order, so the result changes and stays valid; the paper notes that more than one order is correct.";
      } else if (st.key === "cycle") {
        check.textContent = "Here d also depends on b, while b depends on d: no order can satisfy both. The C++ prints \"A cycle was found\" and exits.";
      } else check.textContent = "Your file: " + st.vs.length + " vertices.";
      traceP.textContent = st.trace.length
        ? (st.out.length ? "Last tail() visited: " : "Building the stream visited: ") + st.trace.map(function (t) { return t.visit + (t.state === "done" ? " (done, skipped)" : t.state === "error" ? " (already on the path: cycle)" : ""); }).join(" → ")
        : "";
    }
    var pick = seg(Object.keys(files).map(function (k) { return { value: k, label: files[k].label }; }), st.key, function (v) { st.key = v; st.text = files[v].text; reset(); }, "Graph");
    host.appendChild(labeled("Graph", pick));
    host.appendChild(el("div", { class: "w-actions" }, [btn("Next vertex", next), btn("Read all", function () { while (!st.t.isEmpty) next(); }, true), btn("Start over", reset, true)]));
    host.appendChild(fig);
    host.appendChild(outRow);
    host.appendChild(check);
    host.appendChild(traceP);
    host.appendChild(fileRow);
    resizers.push(draw);
    reset();
  }

  /* ------------------------------------------------------------ mount */

  var mounts = { "ls-pull": mountPull, "ls-hamming": mountHamming, "ls-eager": mountEager, "ls-stirling": mountStirling, "ls-topo": mountTopo };
  Object.keys(mounts).forEach(function (id) {
    var host = document.getElementById(id);
    if (!host) return;
    host.classList.add("w-ready");
    mounts[id](host);
  });
})();

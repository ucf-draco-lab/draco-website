/*
  Suitability widget for /papers/disco-suitability/.
  Mount points: #ds-waffle, #ds-graph, #ds-match, #ds-call, #ds-test.
  Shared state: the binary in focus (Libssh or TRISIS), the block cutoff
  (paper: fewer than three blocks is removed), and, per binary, how many named
  functions the cutoff removes (not printed in the paper; set by the reader
  within the range the printed counts allow).
  Numbers come from suit-engine.js: printed values, integer counts
  reconstructed from Figure 3, and Figure 1's curve digitized from the figure.
*/
(function () {
  "use strict";

  var E = window.SuitEngine;
  if (!E) return;
  var SVGNS = "http://www.w3.org/2000/svg";
  var BASE = (function () {
    var s = document.querySelector('script[src*="disco-suitability/suit-engine.js"]');
    return s ? s.getAttribute("src").replace(/suit-engine\.js.*$/, "") : "/papers/disco-suitability/";
  })();

  var NAMES = { libssh: "Libssh", trisis: "TRISIS", meltdown: "Meltdown" };
  var implied = { libssh: E.impliedJoint("libssh")[0], trisis: E.impliedJoint("trisis")[0] };

  var state = {
    ds: "libssh",
    cutoff: 3,
    namedRemoved: { libssh: implied.libssh, trisis: implied.trisis },
    level: window.PaperKit ? window.PaperKit.level() : "public"
  };
  var listeners = [];
  function onChange(fn) { listeners.push(fn); }
  function changed(what) { listeners.forEach(function (fn) { fn(what); }); }
  document.addEventListener("paperlevel", function (e) { state.level = e.detail.level; changed("level"); });
  function deep() { return state.level === "grad" || state.level === "res"; }
  function atLeastUg() { return state.level === "ug" || deep(); }
  function atLeastHs() { return state.level !== "public"; }

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
    var btns = [];
    options.forEach(function (o) {
      var b = el("button", { type: "button", class: "seg-option", role: "radio", "aria-checked": String(o.value === value), text: o.label });
      b.addEventListener("click", function () { set(o.value); onPick(o.value); });
      wrap.appendChild(b);
      btns.push({ b: b, v: o.value });
    });
    function set(v) { value = v; btns.forEach(function (x) { x.b.setAttribute("aria-checked", String(x.v === v)); }); }
    wrap.set = set;
    return wrap;
  }
  function labeled(label, control, levels) {
    var row = el("div", { class: "ds-ctl" }, [el("span", { class: "ds-ctl-label", text: label }), control]);
    if (levels) row.setAttribute("data-levels", levels);
    return row;
  }
  function slider(min, max, step, value, onInput, aria) {
    var input = el("input", { type: "range", min: String(min), max: String(max), step: String(step), value: String(value), "aria-label": aria });
    var out = el("span", { class: "ds-num" });
    input.addEventListener("input", function () { onInput(Number(input.value), out); });
    var wrap = el("span", { class: "ds-slider" }, [input, out]);
    wrap.input = input; wrap.out = out;
    return wrap;
  }
  function n(x) { return Number(x).toLocaleString("en-US"); }
  function p(x, d) { return (100 * x).toFixed(d == null ? 1 : d) + "%"; }
  function words(k) { return ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"][k] || n(k); }
  function dsSeg(label) {
    var s = seg([{ value: "libssh", label: "Libssh" }, { value: "trisis", label: "TRISIS" }], state.ds, function (v) { state.ds = v; changed("ds"); }, label || "Binary");
    onChange(function (w) { if (w === "ds") s.set(state.ds); });
    return s;
  }
  function ready(node) { node.classList.add("w-ready"); }

  /* ------------------------------------------------ 1. one square per function */

  // Largest-remainder allocation of 100 squares to the seven block bins.
  function squares(ds) {
    var b = E.COUNTS[ds].blocks, tot = E.COUNTS[ds].total;
    var raw = b.map(function (k) { return 100 * k / tot; });
    var base = raw.map(Math.floor), left = 100 - base.reduce(function (a, x) { return a + x; }, 0);
    raw.map(function (x, i) { return { i: i, r: x - Math.floor(x) }; })
      .sort(function (a, c) { return c.r - a.r; })
      .slice(0, left).forEach(function (o) { base[o.i]++; });
    var out = [];
    base.forEach(function (k, i) { for (var j = 0; j < k; j++) out.push(i); });
    return out;
  }

  function mountWaffle(node) {
    var scrubbed = false;
    var cut = slider(1, 6, 1, state.cutoff, function (v) { state.cutoff = v; changed("cutoff"); }, "Remove functions with fewer than this many blocks");
    var scrub = el("button", { type: "button", class: "w-btn", "aria-pressed": "false", text: "Remove small functions" });
    scrub.addEventListener("click", function () {
      scrubbed = !scrubbed;
      scrub.setAttribute("aria-pressed", String(scrubbed));
      scrub.textContent = scrubbed ? "Put them back" : "Remove small functions";
      draw();
    });
    var chart = el("div", { class: "ds-waffles" });
    var readout = el("p", { class: "ds-readout", "aria-live": "polite" });
    var table = el("div", { class: "ds-table-wrap" });
    node.appendChild(el("div", { class: "w-actions" }, [scrub]));
    node.appendChild(labeled("Fewer than", cut));
    node.appendChild(chart);
    node.appendChild(readout);
    node.appendChild(table);

    function waffle(ds) {
      var sq = squares(ds), size = 18, gap = 3, w = 10 * (size + gap), h = w + 22;
      var s = svg("svg", { viewBox: "0 0 " + w + " " + h, class: "ds-waffle", role: "img", "aria-label": NAMES[ds] + ": 100 squares, one per percent of functions, shaded by block count" });
      s.appendChild(svg("text", { x: 0, y: 13, class: "c-label" }, NAMES[ds] + " · " + n(E.COUNTS[ds].total) + " functions"));
      sq.forEach(function (bin, k) {
        var x = (k % 10) * (size + gap), y = 22 + Math.floor(k / 10) * (size + gap);
        var small = bin < state.cutoff;
        var cls = "ds-sq b" + Math.min(bin, 6) + (small ? " small" : "") + (small && scrubbed ? " gone" : "");
        var r = svg("rect", { x: x, y: y, width: size, height: size, class: cls });
        r.appendChild(svg("title", null, E.BIN_LABELS[bin] + " blocks"));
        s.appendChild(r);
      });
      return s;
    }
    function draw() {
      chart.innerHTML = "";
      chart.appendChild(waffle("libssh"));
      chart.appendChild(waffle("trisis"));
      cut.out.textContent = words(state.cutoff) + (state.cutoff === 1 ? " block" : " blocks") + (state.cutoff === 3 ? " (the paper's cutoff)" : "");
      var rl = E.removed("libssh", state.cutoff), rt = E.removed("trisis", state.cutoff);
      var tl = E.COUNTS.libssh.total, tt = E.COUNTS.trisis.total;
      readout.innerHTML = "Functions with fewer than " + words(state.cutoff) + (state.cutoff === 1 ? " block" : " blocks") +
        ": <strong>" + p(rl / tl) + "</strong> of Libssh (" + n(rl) + " of " + n(tl) + ") and <strong>" + p(rt / tt) + "</strong> of TRISIS (" + n(rt) + " of " + n(tt) + ")." +
        (scrubbed ? " What remains is what @DisCo would be asked to name." : "");
      // Figure 3 table with reconstructed counts (high school and up).
      table.innerHTML = "";
      if (!atLeastHs()) return;
      var t = el("table", { class: "results-table ds-fig3" });
      t.appendChild(el("caption", { text: "Figure 3 as printed, with the whole-function counts that reproduce each percentage (Table II totals)." }));
      t.appendChild(el("thead", null, [el("tr", null, [el("th", { text: "Blocks" }), el("th", { text: "Libssh %" }), el("th", { text: "Libssh count" }), el("th", { text: "TRISIS %" }), el("th", { text: "TRISIS count" })])]));
      var tb = el("tbody");
      E.BIN_LABELS.forEach(function (lab, i) {
        var tr = el("tr", { class: i < state.cutoff ? "on" : "" }, [
          el("td", { text: lab }),
          el("td", { text: String(E.FIG3_BLOCKS.libssh[i]) }), el("td", { text: n(E.COUNTS.libssh.blocks[i]) }),
          el("td", { text: String(E.FIG3_BLOCKS.trisis[i]) }), el("td", { text: n(E.COUNTS.trisis.blocks[i]) })
        ]);
        tb.appendChild(tr);
      });
      t.appendChild(tb);
      table.appendChild(t);
      if (deep()) table.appendChild(el("p", { class: "w-note", text: "TRISIS has exactly one set of counts that rounds to the printed percentages and sums to 175. Libssh has four, which differ by one function between neighboring bins (106 or 107 with two blocks, 162 or 163 with three); the page shows the first." }));
    }
    onChange(function (w) { if (w === "cutoff") { cut.input.value = state.cutoff; draw(); } if (w === "level") draw(); });
    draw();
    ready(node);
  }

  /* ------------------------------------------------ 2. the graph @DisCo stores */

  function mountGraph(node) {
    var pick = dsSeg("Binary for the graph");
    var holder = el("div");
    var readout = el("p", { class: "ds-readout" });
    var bars = el("div");
    var check = el("div", { class: "ds-table-wrap", "data-levels": "grad res" });
    node.appendChild(labeled("Binary", pick));
    node.appendChild(holder);
    node.appendChild(readout);
    node.appendChild(bars);
    node.appendChild(check);

    function drawTree() {
      var t = E.TABLE2[state.ds], W = chartWidth(holder), H = 170;
      var s = svg("svg", { viewBox: "0 0 " + W + " " + H, class: "ds-chart", role: "img", "aria-label": "Graph structure: libraries contain functions, functions contain blocks, blocks carry VEX features" });
      var cols = [
        { k: "Libraries", v: t.libraries }, { k: "Functions", v: t.functions },
        { k: "Blocks", v: t.blocks }, { k: "Feature nodes", v: t.features }
      ];
      var step = (W - 20) / cols.length;
      var edges = ["has-function", "has-block", "has-feature"];
      cols.forEach(function (c, i) {
        var cx = 10 + step * i + step / 2;
        var r = 6 + 22 * Math.log10(1 + c.v) / Math.log10(1 + 66162);
        s.appendChild(svg("circle", { cx: cx, cy: 70, r: r, class: "ds-node n" + i }));
        s.appendChild(svg("text", { x: cx, y: 120, class: "c-label", "text-anchor": "middle" }, c.k));
        s.appendChild(svg("text", { x: cx, y: 138, class: "c-tick ds-strong", "text-anchor": "middle" }, n(c.v)));
        if (i < cols.length - 1) {
          var nx = 10 + step * (i + 1) + step / 2;
          s.appendChild(svg("line", { x1: cx + r + 3, y1: 70, x2: nx - 30, y2: 70, class: "ds-edge" }));
          s.appendChild(svg("text", { x: (cx + nx) / 2, y: 30, class: "c-tick", "text-anchor": "middle" }, edges[i]));
        }
      });
      holder.innerHTML = "";
      holder.appendChild(s);
      var st = E.structure(state.ds);
      readout.innerHTML = NAMES[state.ds] + ": <strong>" + st.blocksPerFunction.toFixed(2) + "</strong> blocks per function and " +
        n(Math.round(st.functionsPerLibrary)) + " functions per library (Table II). " +
        (atLeastUg() ? "Blocks also carry branch-true, branch-false, unconditional, and call edges, which the counts here leave out." : "");
    }

    function drawBars() {
      var W = chartWidth(bars), H = 190, panels = [
        { k: "perBlock", t: "Features per block", max: 50 },
        { k: "perFunction", t: "Features per function", max: 250 },
        { k: "perLibrary", t: "Features per library", max: 25000 }
      ];
      var pw = W / 3, s = svg("svg", { viewBox: "0 0 " + W + " " + H, class: "ds-chart", role: "img", "aria-label": "Figure 2 bar heights, read from the figure" });
      panels.forEach(function (pn, i) {
        var x0 = i * pw + 8, base = 150, top = 30;
        s.appendChild(svg("text", { x: x0, y: 14, class: "c-label" }, pn.t));
        s.appendChild(svg("line", { x1: x0, y1: base, x2: x0 + pw - 20, y2: base, class: "c-grid" }));
        ["libssh", "trisis"].forEach(function (ds, j) {
          var v = E.FIG2_READ[ds][pn.k], h = (base - top) * v / pn.max, bw = (pw - 40) / 2.6;
          var bx = x0 + 6 + j * (bw + 10);
          s.appendChild(svg("rect", { x: bx, y: base - h, width: bw, height: h, class: "ds-bar " + ds + (ds === state.ds ? " on" : "") }));
          s.appendChild(svg("text", { x: bx + bw / 2, y: base - h - 4, class: "c-tick", "text-anchor": "middle" }, "≈" + n(v)));
          s.appendChild(svg("text", { x: bx + bw / 2, y: base + 14, class: "c-tick", "text-anchor": "middle" }, NAMES[ds]));
        });
      });
      s.appendChild(svg("text", { x: 8, y: H - 6, class: "c-tick" }, "Bar heights read from Figure 2's pixels (about 1% of each axis)."));
      bars.innerHTML = "";
      bars.appendChild(s);
    }

    function drawCheck() {
      check.innerHTML = "";
      var t = el("table", { class: "results-table" });
      t.appendChild(el("caption", { text: "Total VEX features implied by each Figure 2 panel (bar height × Table II count). Computed by this page." }));
      t.appendChild(el("thead", null, [el("tr", null, [el("th", { text: "Binary" }), el("th", { text: "per block × blocks" }), el("th", { text: "per function × functions" }), el("th", { text: "per library × libraries" })])]));
      var tb = el("tbody");
      ["libssh", "trisis"].forEach(function (ds) {
        var st = E.structure(ds);
        tb.appendChild(el("tr", { class: ds === state.ds ? "on" : "" }, [el("td", { text: NAMES[ds] }),
          el("td", { text: "≈" + n(Math.round(st.totalFromBlocks / 100) * 100) }),
          el("td", { text: "≈" + n(Math.round(st.totalFromFunctions / 100) * 100) }),
          el("td", { text: "≈" + n(Math.round(st.totalFromLibraries / 100) * 100) })]));
      });
      t.appendChild(tb);
      check.appendChild(t);
    }
    function draw() { drawTree(); drawBars(); drawCheck(); }
    onChange(function (w) { if (w === "ds" || w === "level") draw(); });
    resizers.push(draw);
    draw();
    ready(node);
  }

  /* ------------------------------------------------ 3. how sure is a match */

  function mountMatch(node) {
    var strongAt = E.FIG1.strongAt, weakAt = E.FIG1.weakAt;
    var holder = el("div");
    var readout = el("p", { class: "ds-readout", "aria-live": "polite" });
    var sS = slider(80, 100, 1, 95, function (v) { strongAt = v / 100; if (weakAt >= strongAt) weakAt = strongAt - 0.01; sW.input.value = Math.round(weakAt * 100); draw(); }, "Strong match threshold");
    var sW = slider(50, 99, 1, 85, function (v) { weakAt = v / 100; if (strongAt <= weakAt) strongAt = weakAt + 0.01; sS.input.value = Math.round(strongAt * 100); draw(); }, "Weak match threshold");
    var reset = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "Paper's thresholds" });
    reset.addEventListener("click", function () { strongAt = 0.95; weakAt = 0.85; sS.input.value = 95; sW.input.value = 85; draw(); });
    node.appendChild(labeled("Strong above", sS));
    node.appendChild(labeled("Weak above", sW));
    node.appendChild(el("div", { class: "w-actions" }, [reset]));
    node.appendChild(holder);
    node.appendChild(readout);
    var loaded = false;

    function draw() {
      sS.out.textContent = strongAt.toFixed(2);
      sW.out.textContent = weakAt.toFixed(2);
      var c = E.curveCounts(strongAt, weakAt);
      if (!c) { readout.textContent = "Loading the digitized curve…"; return; }
      var data = window.__dsCurve, W = chartWidth(holder), H = 230, L = 40, R = 10, T = 10, B = 34;
      var x = function (i) { return L + (W - L - R) * i / (data.length - 1); };
      var y = function (v) { return T + (H - T - B) * (1 - (v - 0.4) / 0.6); };
      var s = svg("svg", { viewBox: "0 0 " + W + " " + H, class: "ds-chart", role: "img", "aria-label": "Sorted match scores for 831 Meltdown function embeddings, digitized from Figure 1" });
      [0.4, 0.6, 0.8, 1.0].forEach(function (v) {
        s.appendChild(svg("line", { x1: L, y1: y(v), x2: W - R, y2: y(v), class: "c-grid" }));
        s.appendChild(svg("text", { x: L - 6, y: y(v) + 4, class: "c-tick", "text-anchor": "end" }, v.toFixed(1)));
      });
      [0, 200, 400, 600, 800].forEach(function (i) {
        s.appendChild(svg("text", { x: x(i), y: H - B + 16, class: "c-tick", "text-anchor": "middle" }, String(i)));
      });
      s.appendChild(svg("text", { x: L, y: H - 4, class: "c-tick" }, "Embedding, sorted by match score (digitized from Figure 1, 831 points)"));
      // shaded zones
      s.appendChild(svg("rect", { x: x(0), y: T, width: Math.max(0, x(c.strong) - x(0)), height: H - T - B, class: "ds-zone strong" }));
      s.appendChild(svg("rect", { x: x(c.strong), y: T, width: Math.max(0, x(c.strong + c.weak) - x(c.strong)), height: H - T - B, class: "ds-zone weak" }));
      var d = data.map(function (v, i) { return (i ? "L" : "M") + x(i).toFixed(1) + " " + y(v).toFixed(1); }).join("");
      s.appendChild(svg("path", { d: d, class: "ds-curve" }));
      s.appendChild(svg("line", { x1: L, y1: y(strongAt), x2: W - R, y2: y(strongAt), class: "ds-thr strong" }));
      s.appendChild(svg("line", { x1: L, y1: y(weakAt), x2: W - R, y2: y(weakAt), class: "ds-thr weak" }));
      holder.innerHTML = "";
      holder.appendChild(s);
      var atPaper = Math.abs(strongAt - 0.95) < 1e-9 && Math.abs(weakAt - 0.85) < 1e-9;
      readout.innerHTML = "<strong>" + n(c.strong) + "</strong> strong, <strong>" + n(c.weak) + "</strong> weak, and <strong>" + n(c.none) + "</strong> no match, of 831 (" +
        p(c.strong / 831) + ", " + p(c.weak / 831) + ", " + p(c.none / 831) + ")." +
        (atPaper ? " The paper prints 514, 187, and 130; the digitized curve lands within one embedding of each." : "");
    }
    fetch(BASE + "fig1-digitized.json").then(function (r) { return r.json(); }).then(function (arr) {
      window.__dsCurve = arr; E.setCurve(arr); loaded = true; draw();
    }).catch(function () { readout.textContent = "The digitized curve did not load."; });
    resizers.push(function () { if (loaded) draw(); });
    draw();
    ready(node);
  }

  /* ------------------------------------------------ 4. the suitability call */

  function mountCall(node) {
    var pick = dsSeg("Binary for the suitability call");
    var holder = el("div");
    var verdict = el("p", { class: "ds-readout", "aria-live": "polite" });
    var jointRow = el("div", { "data-levels": "ug grad res" });
    var js = slider(0, 1, 1, 0, function (v) { state.namedRemoved[state.ds] = v; draw(); }, "Named functions among the removed ones");
    var back = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "Split that matches the printed score" });
    back.addEventListener("click", function () { state.namedRemoved[state.ds] = implied[state.ds]; if (state.cutoff !== 3) { state.cutoff = 3; changed("cutoff"); } draw(); });
    jointRow.appendChild(labeled("Named removed", js));
    jointRow.appendChild(el("div", { class: "w-actions" }, [back]));
    var cellTable = el("div", { class: "ds-table-wrap", "data-levels": "grad res" });
    node.appendChild(labeled("Binary", pick));
    node.appendChild(jointRow);
    node.appendChild(holder);
    node.appendChild(verdict);
    node.appendChild(cellTable);

    function bar(s, y, label, total, removedK, W) {
      var L = 0, R = 10, w = W - L - R, h = 24;
      s.appendChild(svg("text", { x: 0, y: y - 6, class: "c-label" }, label));
      var wr = w * removedK / total;
      s.appendChild(svg("rect", { x: L, y: y, width: wr, height: h, class: "ds-seg removed" }));
      s.appendChild(svg("rect", { x: L + wr, y: y, width: w - wr, height: h, class: "ds-seg kept" }));
      s.appendChild(svg("line", { x1: L + w / 2, y1: y - 4, x2: L + w / 2, y2: y + h + 4, class: "c-ref" }));
      if (wr > 70) s.appendChild(svg("text", { x: L + 6, y: y + 17, class: "c-tick ds-on-bar" }, p(removedK / total) + " removed"));
      if (w - wr > 70) s.appendChild(svg("text", { x: L + w - 6, y: y + 17, class: "c-tick", "text-anchor": "end" }, p(1 - removedK / total) + " kept"));
    }

    function draw() {
      var ds = state.ds, c = E.COUNTS[ds], range = E.namedRemovedRange(ds, state.cutoff);
      var nr = Math.max(range.min, Math.min(range.max, state.namedRemoved[ds]));
      state.namedRemoved[ds] = nr;
      js.input.min = range.min; js.input.max = range.max; js.input.value = nr;
      js.out.textContent = n(nr) + " of " + n(c.named) + " (possible: " + n(range.min) + " to " + n(range.max) + ")";
      var j = E.joint(ds, state.cutoff, nr);
      var W = chartWidth(holder), H = 128;
      var s = svg("svg", { viewBox: "0 0 " + W + " " + H, class: "ds-chart", role: "img", "aria-label": "Share of named and anonymous functions removed by the cutoff" });
      bar(s, 20, "Named functions (" + n(c.named) + ")", c.named, j.cells.namedRemoved, W);
      bar(s, 76, "Anonymous functions (" + n(c.anonymous) + ")", c.anonymous, j.cells.anonRemoved, W);
      s.appendChild(svg("text", { x: 0, y: H - 6, class: "c-tick" }, "Dashed line: half. Cutoff: fewer than " + words(state.cutoff) + " blocks."));
      holder.innerHTML = "";
      holder.appendChild(s);

      var printed = E.FIG4[ds];
      var isPaper = state.cutoff === 3 && nr === implied[ds];
      var v = j.verdict === "well" ? "<strong>well-fit</strong>: most anonymous functions are removed, so the functions @DisCo would see are mostly ones it can name"
        : j.verdict === "ill" ? "<strong>ill-suited</strong>: most named functions are removed, so the functions @DisCo could name are mostly gone"
        : j.verdict === "both" ? "<strong>undecided</strong>: the cutoff removes most of both groups"
        : "<strong>undecided</strong>: the cutoff removes less than half of each group";
      var txt = "Under the paper's rule, " + NAMES[ds] + " is " + v + ". The paper scores " + NAMES[ds] + " <strong>" + printed[0] + "%</strong> suitable and " + printed[1] + "% unsuitable (Figure 4).";
      if (atLeastUg()) {
        txt += j.score == null ? " No score under the page's reading." :
          " Page's reading of the score (" + (j.verdict === "well" ? "share of anonymous functions removed" : "share of named functions kept") + "): <strong>" + p(j.score, 2) + "</strong>" +
          (isPaper ? ", which rounds to the printed value." : ".");
      } else if (isPaper) {
        txt += " The bars show one split of the paper's counts that gives exactly those scores; the paper does not print the split itself.";
      }
      verdict.innerHTML = txt;

      cellTable.innerHTML = "";
      var t = el("table", { class: "results-table" });
      t.appendChild(el("caption", { text: NAMES[ds] + " at this setting: functions by name and size. Row and column totals come from Figure 3; the four cells are the reader's split (not printed in the paper)." }));
      t.appendChild(el("thead", null, [el("tr", null, [el("th", { text: "" }), el("th", { text: "Removed" }), el("th", { text: "Kept" }), el("th", { text: "Total" })])]));
      t.appendChild(el("tbody", null, [
        el("tr", null, [el("td", { text: "Named" }), el("td", { text: n(j.cells.namedRemoved) }), el("td", { text: n(j.cells.namedKept) }), el("td", { text: n(c.named) })]),
        el("tr", null, [el("td", { text: "Anonymous" }), el("td", { text: n(j.cells.anonRemoved) }), el("td", { text: n(j.cells.anonKept) }), el("td", { text: n(c.anonymous) })]),
        el("tr", null, [el("td", { text: "Total" }), el("td", { text: n(range.removed) }), el("td", { text: n(range.kept) }), el("td", { text: n(c.total) })])
      ]));
      cellTable.appendChild(t);
    }
    onChange(function (w) { if (w === "ds" || w === "cutoff" || w === "level") draw(); });
    resizers.push(draw);
    draw();
    ready(node);
  }

  /* ------------------------------------------------ 5. did the call hold up */

  function mountTest(node) {
    var copies = 0, split = 0;
    var cSeg = seg(E.FIG5.copies.map(function (k) { return { value: k, label: String(k) }; }), copies, function (v) { copies = v; draw(); }, "Minimum function copies");
    var sSeg = seg(E.SPLITS.map(function (s, i) { return { value: i, label: s }; }), split, function (v) { split = v; draw(); }, "Training and testing split");
    var holder = el("div");
    var tableBox = el("div", { class: "ds-table-wrap" });
    var readout = el("p", { class: "ds-readout", "aria-live": "polite" });
    var checks = el("div", { class: "ds-table-wrap", "data-levels": "grad res" });
    node.appendChild(labeled("Minimum copies", cSeg));
    node.appendChild(labeled("Train / test", sSeg));
    node.appendChild(holder);
    node.appendChild(readout);
    node.appendChild(tableBox);
    node.appendChild(checks);

    function draw() {
      var ci = E.FIG5.copies.indexOf(copies), W = chartWidth(holder), H = 190, L = 10, B = 30, T = 40;
      var s = svg("svg", { viewBox: "0 0 " + W + " " + H, class: "ds-chart", role: "img", "aria-label": "Number of function classes per dataset at this minimum (Figure 5)" });
      var sets = ["meltdown", "libssh", "trisis"], bw = (W - 2 * L) / 3 - 20;
      var maxv = Math.log10(1 + 7874);
      sets.forEach(function (ds, i) {
        var v = E.FIG5[ds][ci], h = (H - T - B) * Math.log10(1 + v) / maxv, x = L + i * (bw + 20);
        s.appendChild(svg("rect", { x: x, y: H - B - h, width: bw, height: Math.max(h, 1), class: "ds-bar " + ds }));
        s.appendChild(svg("text", { x: x + bw / 2, y: H - B - h - 4, class: "c-tick ds-strong", "text-anchor": "middle" }, n(v) + (v === 1 ? " class" : " classes")));
        s.appendChild(svg("text", { x: x + bw / 2, y: H - B + 16, class: "c-label", "text-anchor": "middle" }, NAMES[ds]));
      });
      s.appendChild(svg("text", { x: L, y: 12, class: "c-tick" }, "Figure 5, log scale: classes with at least " + copies + " copies"));
      holder.innerHTML = "";
      holder.appendChild(s);

      var tab = copies === 0 ? E.TABLE3 : copies === 7 ? E.TABLE4 : null;
      tableBox.innerHTML = "";
      if (!tab) {
        readout.innerHTML = "The paper tested @DisCo at minimums of zero and seven only. At " + copies + ", Libssh and TRISIS have no classes left to test.";
        sSeg.style.opacity = 0.5;
        return;
      }
      sSeg.style.opacity = 1;
      var t = el("table", { class: "results-table ds-wide" });
      t.appendChild(el("caption", { text: (copies === 0 ? "Table III" : "Table IV") + " as printed: @DisCo trained on Meltdown, tested on each set (2,000 epochs)." }));
      t.appendChild(el("thead", null, [el("tr", null, ["Test set", "Train / test", "Loss", "Accuracy", "Macro F1", "Weighted F1"].map(function (h) { return el("th", { text: h }); }))]));
      var tb = el("tbody");
      ["meltdown", "libssh", "trisis"].forEach(function (ds) {
        if (!tab[ds]) {
          tb.appendChild(el("tr", null, [el("td", { text: NAMES[ds] }), el("td", { text: "All" }), el("td", { colspan: "4", text: copies === 0 ? "Crashed kernel" : "Insufficient data" })]));
          return;
        }
        tab[ds].forEach(function (row, i) {
          tb.appendChild(el("tr", { class: i === split ? "on" : "" }, [el("td", { text: NAMES[ds] }), el("td", { text: E.SPLITS[i] }),
            el("td", { text: row[0].toFixed(2) }), el("td", { text: row[1].toFixed(4) }), el("td", { text: row[2].toFixed(2) }), el("td", { text: row[3].toFixed(2) })]));
        });
      });
      t.appendChild(tb);
      tableBox.appendChild(t);

      var l = tab.libssh[split];
      if (copies === 0) {
        readout.innerHTML = "With every function kept, Libssh reaches <strong>" + p(l[1]) + "</strong> accuracy at " + E.SPLITS[split] + "; TRISIS matches no function at any split (accuracy 0), as the suitability call predicted. Meltdown itself was too large to test.";
      } else {
        var m = tab.meltdown[split];
        readout.innerHTML = "Keeping only functions seen at least seven times, Libssh reaches <strong>" + p(l[1]) + "</strong> accuracy against Meltdown's own " + p(m[1]) + " at " + E.SPLITS[split] + ", a gap of " + (100 * (m[1] - l[1])).toFixed(1) + " points. TRISIS has no function with seven copies.";
      }

      checks.innerHTML = "";
      var ct = el("table", { class: "results-table ds-wide" });
      ct.appendChild(el("caption", { text: "The text's comparisons for Table IV, recomputed from the printed table by this page." }));
      ct.appendChild(el("thead", null, [el("tr", null, [el("th", { text: "Claim in the text" }), el("th", { text: "From Table IV" })])]));
      var cb = el("tbody");
      E.textChecks().forEach(function (c) {
        cb.appendChild(el("tr", null, [el("td", { text: c.claim }), el("td", { text: (c.unit === "×" ? c.value.toFixed(2) + "×" : c.value.toFixed(2) + " points") })]));
      });
      ct.appendChild(cb);
      checks.appendChild(ct);
    }
    onChange(function (w) { if (w === "level") draw(); });
    resizers.push(draw);
    draw();
    ready(node);
  }

  /* ------------------------------------------------------------ mount */

  function mount(id, fn) { var node = document.getElementById(id); if (node) fn(node); }
  function start() {
    mount("ds-waffle", mountWaffle);
    mount("ds-graph", mountGraph);
    mount("ds-match", mountMatch);
    mount("ds-call", mountCall);
    mount("ds-test", mountTest);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();

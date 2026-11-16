/*
  Jangseung widget for /papers/jangseung-poisoning/.
  Mount points: #js-door, #js-attack, #js-heat, #js-scale.
  Shared state: the digit pair and training size (demos 1 and 3), the tumor
  run settings (demo 2), and the reading level. Every figure computed here or
  precomputed for the page is labeled as the page's, with its sample size.
*/
(function () {
  "use strict";

  var E = window.Jangseung;
  if (!E) return;

  var SVGNS = "http://www.w3.org/2000/svg";
  var BASE = (document.currentScript && document.currentScript.src)
    ? document.currentScript.src.replace(/widget\.js(\?.*)?$/, "")
    : "";

  /* ------------------------------------------------------------ paper numbers */

  // Percent of poisoned digits turned away, as stated in the text (Section IV.A and V)
  var PAIR_PAPER = {
    "0-1": { v: 100, text: "100%" },
    "4-9": { v: 36.5, text: "36.5%" },
    "1-7": { v: 75, text: "75%" },
    "5-8": { v: 73, text: "73%" },
    "3-6": { v: 90, text: "over 90%" },
    "6-7": { v: 90, text: "over 90%" }
  };
  // Section V: average accuracy over the attack sequence by MNIST training size
  var MNIST_SIZE_PAPER = { 250: { u: 53.2, g: 91.1 }, 1000: { u: 97.6, g: 97.8 } };
  // Section IV.B: tumor data, by number of poisoned points
  var BCW_ATTACK_PAPER = { 500: { u: 75.51, g: 88.18 } };

  /* ------------------------------------------------------------ state */

  var state = {
    a: 1, b: 7, size: 250, seed: 1,
    level: window.PaperKit ? window.PaperKit.level() : "public",
    sheet: null, wdbc: null, data: null
  };
  var listeners = [];
  function onChange(fn) { listeners.push(fn); }
  function changed(what) { listeners.forEach(function (fn) { fn(what); }); }
  document.addEventListener("paperlevel", function (e) { state.level = e.detail.level; changed("level"); });
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
      if (o.title) b.title = o.title;
      b.addEventListener("click", function () { set(o.value); onPick(o.value); });
      wrap.appendChild(b);
      btns.push({ b: b, v: o.value });
    });
    function set(v) { btns.forEach(function (x) { x.b.setAttribute("aria-checked", String(x.v === v)); }); }
    wrap.set = set;
    return wrap;
  }
  function labeled(label, control, levels) {
    var row = el("div", { class: "js-ctl" }, [el("span", { class: "js-ctl-label", text: label }), control]);
    if (levels) row.setAttribute("data-levels", levels);
    return row;
  }
  function pct(x, d) { return x == null ? "–" : (100 * x).toFixed(d == null ? 1 : d) + "%"; }
  function words(n) { return ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"][n] || String(n); }
  function cssVar(name, fallback) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(name);
    return (v && v.trim()) || fallback;
  }
  function pairKey(a, b) { return Math.min(a, b) + "-" + Math.max(a, b); }

  /* ------------------------------------------------------------ data loading */

  var sheetPromise = null;
  function loadSheet() {
    if (sheetPromise) return sheetPromise;
    sheetPromise = new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () {
        var c = document.createElement("canvas"); c.width = img.width; c.height = img.height;
        var ctx = c.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(img, 0, 0);
        var px = ctx.getImageData(0, 0, img.width, img.height).data;
        var cols = img.width / 28, per = 375, digits = [];
        for (var d = 0; d < 10; d++) {
          var list = [];
          for (var j = 0; j < per; j++) {
            var k = d * per + j, r = Math.floor(k / cols), col = k % cols, v = new Float64Array(784);
            for (var y = 0; y < 28; y++) for (var x = 0; x < 28; x++) v[y * 28 + x] = px[((r * 28 + y) * img.width + col * 28 + x) * 4];
            list.push(v);
          }
          digits.push(list);
        }
        state.sheet = digits; resolve(digits);
      };
      img.onerror = reject;
      img.src = BASE + "mnist-sheet.png";
    });
    return sheetPromise;
  }
  var jsonCache = {};
  function loadJSON(name) {
    if (!jsonCache[name]) jsonCache[name] = fetch(BASE + name).then(function (r) { return r.json(); });
    return jsonCache[name];
  }

  function drawDigit(canvas, v, ink) {
    var ctx = canvas.getContext("2d"), im = ctx.createImageData(28, 28);
    var m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i.exec(ink.replace("#", ""));
    var rgb = m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [128, 128, 128];
    for (var i = 0; i < 784; i++) { im.data[i * 4] = rgb[0]; im.data[i * 4 + 1] = rgb[1]; im.data[i * 4 + 2] = rgb[2]; im.data[i * 4 + 3] = v[i]; }
    ctx.putImageData(im, 0, 0);
  }
  function toHex(color) {
    // resolve any CSS color to #rrggbb through a 1x1 canvas
    var c = document.createElement("canvas"); c.width = c.height = 1;
    var ctx = c.getContext("2d"); ctx.fillStyle = "#808080"; ctx.fillStyle = color; ctx.fillRect(0, 0, 1, 1);
    var d = ctx.getImageData(0, 0, 1, 1).data;
    return "#" + [d[0], d[1], d[2]].map(function (x) { return ("0" + x.toString(16)).slice(-2); }).join("");
  }

  /* ------------------------------------------------------------ guard trial (demos 1 and 3) */

  // One trial of the guard on a digit pair: train detectors on each digit,
  // draw 100 training digits at random, flip their labels, and ask the
  // detector of the claimed digit whether to let each one in.
  function guardTrial(a, b, size, seed) {
    var D = state.sheet, r = E.rng(seed * 1009 + a * 31 + b), half = size / 2;
    var pa = E.shuffle(D[a].slice(0, 250), r).slice(0, half);
    var pb = E.shuffle(D[b].slice(0, 250), r).slice(0, half);
    var ADa = E.fitForest(pa, seed * 2 + 1), ADb = E.fitForest(pb, seed * 2 + 2);
    var out = [];
    for (var k = 0; k < 100; k++) {
      var fromA = r() < 0.5, src = fromA ? pa[r.int(half)] : pb[r.int(half)];
      var det = fromA ? ADb : ADa;         // the flipped digit claims the other class
      var s = E.score(det, src);
      out.push({ v: src, real: fromA ? a : b, claim: fromA ? b : a, score: s, pass: s >= -0.5 });
    }
    // genuine digits of each class, for the score scale
    var gen = pa.slice(0, 40).map(function (v) { return E.score(ADa, v); }).concat(pb.slice(0, 40).map(function (v) { return E.score(ADb, v); }));
    return { a: a, b: b, size: size, list: out, genuine: gen, turned: out.filter(function (x) { return !x.pass; }).length };
  }

  /* ------------------------------------------------------------ demo 1: digits at the door */

  var doorApi = null;
  function mountDoor(root) {
    root.classList.add("w-ready");
    var digits = []; for (var d = 0; d < 10; d++) digits.push({ value: d, label: String(d) });
    var aSeg = seg(digits, state.a, function (v) { if (v === state.b) { state.b = state.a; bSeg.set(state.b); } state.a = v; run(); }, "First digit");
    var bSeg = seg(digits, state.b, function (v) { if (v === state.a) { state.a = state.b; aSeg.set(state.a); } state.b = v; run(); }, "Second digit");
    var sizeSeg = seg([{ value: 250, label: "250" }, { value: 500, label: "500" }], state.size, function (v) { state.size = v; run(); }, "Training digits");
    var again = el("button", { type: "button", class: "w-btn", text: "Send a new batch" });
    again.addEventListener("click", function () { state.seed++; run(); });
    var ctrls = el("div", { class: "js-ctrls" }, [
      labeled("First digit", aSeg), labeled("Second digit", bSeg), labeled("Training digits", sizeSeg, "ug grad res")
    ]);
    var head = el("p", { class: "js-readout" });
    var grid = el("div", { class: "js-tiles", role: "list" });
    var scale = el("div", { class: "js-scale-wrap", "data-levels": "ug grad res" });
    var foot = el("p", { class: "w-note" });
    root.appendChild(ctrls);
    root.appendChild(el("div", { class: "w-actions" }, [again]));
    root.appendChild(head);
    root.appendChild(grid);
    root.appendChild(scale);
    root.appendChild(foot);

    var trial = null;
    function run() {
      head.textContent = "Loading digits…";
      loadSheet().then(function () {
        trial = guardTrial(state.a, state.b, state.size, state.seed);
        draw();
        changed("pair");
      }).catch(function () { head.textContent = "The digit images could not load."; });
    }
    function draw() {
      if (!trial) return;
      var ink = toHex(cssVar("--text", "#222"));
      grid.innerHTML = "";
      trial.list.slice(0, 24).forEach(function (t) {
        var c = el("canvas", { width: 28, height: 28, class: "js-digit", "aria-hidden": "true" });
        drawDigit(c, t.v, ink);
        var cap = el("span", { class: "js-tile-cap" }, [
          el("span", { text: "labeled " + t.claim }),
          el("span", { class: "js-tile-score", "data-levels": "grad res", text: "s = " + t.score.toFixed(3) })
        ]);
        var verdict = el("span", { class: "js-verdict", text: t.pass ? "let in" : "turned away" });
        grid.appendChild(el("div", { class: "js-tile" + (t.pass ? " pass" : " stop"), role: "listitem",
          "aria-label": "A handwritten " + t.real + " labeled " + t.claim + ", " + (t.pass ? "let in" : "turned away") }, [c, cap, verdict]));
      });
      var key = pairKey(trial.a, trial.b), paper = PAIR_PAPER[key];
      head.innerHTML = "";
      head.appendChild(document.createTextNode("Out of 100 mislabeled digits, Jangseung turned away "));
      head.appendChild(el("strong", { text: trial.turned + "" }));
      head.appendChild(document.createTextNode(state.level === "public" || state.level === "hs"
        ? ". The first 24 are shown."
        : " (" + trial.turned + "%). The first 24 are shown."));
      foot.textContent = "Computed in your browser: one trial, " + trial.size + " training digits (" + trial.size / 2 + " of each), 100 poisoned digits. " +
        (paper ? "The paper reports " + paper.text + " turned away for the " + key.replace("-", " and ") + " pair, averaged over its sixteen runs of that pair." :
          "The paper does not state a value for this pair; its Figure 5 shades all 45 pairs.") +
        " The paper's gradient step moves each digit by one thousandth of a grey level, so each poisoned digit is drawn as it appears in the training set.";
      drawScale();
    }
    function drawScale() {
      if (!trial) return;
      scale.innerHTML = "";
      var W = chartWidth(scale), H = 136, L = 14, R = 14, top = 40, base = 84;
      var s = svg("svg", { class: "js-chart", viewBox: "0 0 " + W + " " + H, role: "img",
        "aria-label": "Anomaly scores of genuine digits and poisoned digits on a line from minus 0.7 to minus 0.3, with the cut at minus 0.5" });
      var lo = -0.75, hi = -0.3;
      function X(v) { return L + (W - L - R) * (Math.min(hi, Math.max(lo, v)) - lo) / (hi - lo); }
      s.appendChild(svg("line", { x1: L, x2: W - R, y1: base, y2: base, class: "c-grid" }));
      [-0.7, -0.6, -0.5, -0.4, -0.3].forEach(function (t) {
        s.appendChild(svg("line", { x1: X(t), x2: X(t), y1: base, y2: base + 4, class: "c-grid" }));
        s.appendChild(svg("text", { x: X(t), y: base + 16, "text-anchor": "middle", class: "c-tick" }, t.toFixed(1)));
      });
      s.appendChild(svg("line", { x1: X(-0.5), x2: X(-0.5), y1: top - 10, y2: base + 4, class: "js-cut" }));
      s.appendChild(svg("text", { x: X(-0.5) + 4, y: top - 12, class: "c-label js-cut-text" }, "cut −0.5: higher passes"));
      trial.genuine.forEach(function (v, i) { s.appendChild(svg("circle", { cx: X(v), cy: top + 6 + (i % 4) * 3, r: 2.4, class: "js-dot-gen" })); });
      trial.list.forEach(function (t, i) { s.appendChild(svg("circle", { cx: X(t.score), cy: base - 12 - (i % 5) * 3, r: 2.4, class: t.pass ? "js-dot-pass" : "js-dot-stop" })); });
      s.appendChild(svg("text", { x: L, y: 12, class: "c-label" }, "genuine (top) and poisoned (bottom) digits"));
      s.appendChild(svg("text", { x: L, y: H - 4, class: "c-tick" }, "isolation-forest score (less negative looks more typical)"));
      scale.appendChild(s);
      var below = trial.genuine.filter(function (v) { return v < -0.5; }).length;
      scale.appendChild(el("p", { class: "w-mono", "data-levels": "grad res",
        text: below + " of " + trial.genuine.length + " genuine training digits also score below the cut (scored by the forest that trained on them)." }));
    }
    resizers.push(drawScale);
    onChange(function (what) { if (what === "level" || what === "theme") draw(); });
    doorApi = { set: function (a, b) { state.a = a; state.b = b; aSeg.set(a); bSeg.set(b); run(); } };
    run();
  }

  /* ------------------------------------------------------------ demo 2: tumor classifier under attack */

  function mountAttack(root) {
    root.classList.add("w-ready");
    var cfg = { train: 300, attacks: 500, seed: 5 };
    var trSeg = seg([50, 100, 200, 300, 450].map(function (v) { return { value: v, label: String(v) }; }), cfg.train, function (v) { cfg.train = v; reset(); }, "Training records");
    var naSeg = seg([50, 100, 250, 500].map(function (v) { return { value: v, label: String(v) }; }), cfg.attacks, function (v) { cfg.attacks = v; reset(); }, "Poisoned records");
    var go = el("button", { type: "button", class: "w-btn", text: "Run the attack" });
    var again = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "New split" });
    var ctrls = el("div", { class: "js-ctrls" }, [labeled("Training records", trSeg, "hs ug grad res"), labeled("Poisoned records", naSeg)]);
    var chart = el("div", { class: "js-chart-wrap" });
    var read = el("div", { class: "js-readout" });
    var note = el("p", { class: "w-note" });
    root.appendChild(ctrls);
    root.appendChild(el("div", { class: "w-actions" }, [go, again]));
    root.appendChild(chart); root.appendChild(read); root.appendChild(note);

    var worker = null, runId = 0, accU = [], accG = [], summary = null, running = false;
    function ensureWorker() {
      if (worker) return Promise.resolve(worker);
      return loadJSON("wdbc.json").then(function (w) {
        state.wdbc = w;
        worker = new Worker(BASE + "jangseung-worker.js");
        worker.postMessage({ type: "data", wdbc: { X: w.X, y: w.y } });
        worker.onmessage = function (e) {
          var m = e.data; if (m.id !== runId) return;
          accU = accU.concat(m.accU); accG = accG.concat(m.accG); summary = m.summary;
          if (m.type === "done") { running = false; go.classList.remove("running"); go.textContent = "Run the attack"; }
          draw();
        };
        return worker;
      });
    }
    function start() {
      if (running) { stop(); return; }
      ensureWorker().then(function (wk) {
        runId++; accU = []; accG = []; summary = null; running = true;
        go.classList.add("running"); go.textContent = "Stop";
        wk.postMessage({ type: "run", id: runId, train: cfg.train, test: 100, attacks: cfg.attacks, seed: cfg.seed });
        draw();
      }).catch(function () { read.textContent = "The tumor data could not load."; });
    }
    function stop() {
      if (worker) { worker.terminate(); worker = null; }
      runId++; running = false; go.classList.remove("running"); go.textContent = "Run the attack"; draw();
    }
    function reset() { if (running) stop(); accU = []; accG = []; summary = null; draw(); }
    go.addEventListener("click", start);
    again.addEventListener("click", function () { cfg.seed++; if (running) stop(); start(); });

    function draw() {
      chart.innerHTML = "";
      var W = chartWidth(chart), H = 250, L = 44, R = 12, T = 14, B = 40;
      var s = svg("svg", { class: "js-chart", viewBox: "0 0 " + W + " " + H, role: "img",
        "aria-label": "Test accuracy of the guarded and unguarded tumor classifiers as poisoned records are added" });
      var n = cfg.attacks;
      function X(k) { return L + (W - L - R) * k / n; }
      function Y(a) { return T + (H - T - B) * (1 - a); }
      [0, 0.25, 0.5, 0.75, 1].forEach(function (a) {
        s.appendChild(svg("line", { x1: L, x2: W - R, y1: Y(a), y2: Y(a), class: "c-grid" }));
        s.appendChild(svg("text", { x: L - 6, y: Y(a) + 4, "text-anchor": "end", class: "c-tick" }, Math.round(a * 100) + "%"));
      });
      [0, n / 2, n].forEach(function (k) { s.appendChild(svg("text", { x: X(k), y: H - B + 16, "text-anchor": "middle", class: "c-tick" }, String(k))); });
      s.appendChild(svg("text", { x: (L + W - R) / 2, y: H - 6, "text-anchor": "middle", class: "c-label" }, "poisoned records sent (simulated)"));
      function line(arr, cls) {
        if (arr.length < 2) return;
        var d = arr.map(function (a, k) { return (k ? "L" : "M") + X(k).toFixed(1) + " " + Y(a).toFixed(1); }).join("");
        s.appendChild(svg("path", { d: d, class: cls }));
      }
      line(accU, "js-line-u"); line(accG, "js-line-g");
      if (accU.length) {
        var k = accU.length - 1;
        s.appendChild(svg("text", { x: W - R, y: Math.min(H - B - 4, Y(accG[k]) + 16), "text-anchor": "end", class: "c-label js-lab-g" }, "with Jangseung"));
        s.appendChild(svg("text", { x: W - R, y: Math.min(H - B - 4, Y(accU[k]) + 16), "text-anchor": "end", class: "c-label js-lab-u" }, "unguarded"));
      } else {
        s.appendChild(svg("text", { x: (L + W - R) / 2, y: Y(0.5), "text-anchor": "middle", class: "c-label" }, "Press Run the attack"));
      }
      chart.appendChild(s);

      read.innerHTML = "";
      if (!summary) { note.textContent = noteText(); return; }
      var rows = [
        ["Clean accuracy", pct(summary.clean)],
        ["Average while under attack, unguarded", pct(summary.avgU)],
        ["Average while under attack, with Jangseung", pct(summary.avgG)],
        ["Final accuracy, unguarded", pct(summary.lastU)],
        ["Final accuracy, with Jangseung", pct(summary.lastG)],
        ["Poisoned records turned away", pct(summary.defended, 0) + " of " + summary.attacks]
      ];
      var keep = state.level === "public" ? [0, 3, 4, 5] : [0, 1, 2, 3, 4, 5];
      var tbl = el("table", { class: "results-table js-mini" });
      keep.forEach(function (i) { tbl.appendChild(el("tr", null, [el("td", { text: rows[i][0] }), el("td", { class: "js-num", text: rows[i][1] })])); });
      read.appendChild(tbl);
      note.textContent = noteText();
    }
    function noteText() {
      var p = BCW_ATTACK_PAPER[cfg.attacks];
      return "Simulated in your browser: one run on " + cfg.train + " training and 100 test records from the 569-record diagnostic set, with a support vector machine retrained after every poisoned record. " +
        (p ? "For 500 poisoned records the paper reports average accuracies of " + p.u + "% unguarded and " + p.g + "% with Jangseung, averaged over its runs with that many attacks."
           : "For 50 to 250 poisoned records the paper reports unguarded averages of 90.03% to 90.72% and guarded averages above 91%.");
    }
    resizers.push(draw);
    onChange(function (w) { if (w === "level") draw(); });
    draw();
  }

  /* ------------------------------------------------------------ demo 3: all 45 pairs */

  function mountHeat(root) {
    root.classList.add("w-ready");
    var wrap = el("div", { class: "js-heat-wrap" });
    var note = el("p", { class: "w-note" });
    root.appendChild(wrap); root.appendChild(note);
    var heat = null;
    loadJSON("jangseung-data.json").then(function (d) { state.data = d; heat = d.mnist_heat; draw(); })
      .catch(function () { wrap.textContent = "The precomputed results could not load."; });
    function draw() {
      if (!heat) return;
      wrap.innerHTML = "";
      var tbl = el("table", { class: "js-heat", role: "grid", "aria-label": "Percent of poisoned digits turned away for each digit pair" });
      var hr = el("tr", null, [el("th", { text: "" })]);
      for (var c = 1; c < 10; c++) hr.appendChild(el("th", { scope: "col", text: String(c) }));
      tbl.appendChild(hr);
      for (var r = 0; r < 9; r++) {
        var tr = el("tr", null, [el("th", { scope: "row", text: String(r) })]);
        for (c = 1; c < 10; c++) {
          if (c <= r) { tr.appendChild(el("td", { class: "js-hcell empty" })); continue; }
          var key = r + "-" + c, v = heat[key], paper = PAIR_PAPER[key];
          var sel = pairKey(state.a, state.b) === key;
          var td = el("td", { class: "js-hcell" + (sel ? " sel" : "") + (paper ? " paper" : ""), tabindex: "0", role: "gridcell",
            style: "--shade:" + v.toFixed(3),
            title: r + " and " + c + ": " + Math.round(v * 100) + "% turned away (page)" + (paper ? "; paper " + paper.text : ""),
            "aria-label": r + " and " + c + ", " + Math.round(v * 100) + " percent turned away" + (paper ? ", paper " + paper.text : "") }, [
            el("span", { text: String(Math.round(v * 100)) }),
            paper ? el("span", { class: "js-hpaper", "data-levels": "hs ug grad res", text: paper.text.replace("over ", ">") }) : null
          ]);
          (function (a, b) {
            function pick() { if (doorApi) doorApi.set(a, b); }
            td.addEventListener("click", pick);
            td.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(); } });
          })(r, c);
          tr.appendChild(td);
        }
        tbl.appendChild(tr);
      }
      wrap.appendChild(tbl);
      var n = state.data.meta.heat_runs;
      note.textContent = "Computed for this page with scikit-learn: " + n + " runs per pair (training sizes 250, 500, 750, and 1,000, two runs each), 100 poisoned digits per run, 45 pairs. " +
        "Small numbers under a cell are the paper's stated values; the paper ran 16 experiments per pair. Select a cell to try that pair above.";
    }
    onChange(function (w) { if (w === "pair") draw(); });
  }

  /* ------------------------------------------------------------ demo 4: training size and attack length */

  function mountScale(root) {
    root.classList.add("w-ready");
    var view = "mnist";
    var vSeg = seg([
      { value: "mnist", label: "Digits by training size" },
      { value: "bcwsize", label: "Tumors by training size" },
      { value: "bcwatt", label: "Tumors by poisoned records" }
    ], view, function (v) { view = v; draw(); }, "Result view");
    var chart = el("div", { class: "js-chart-wrap" });
    var note = el("p", { class: "w-note" });
    root.appendChild(el("div", { class: "js-ctrls" }, [vSeg]));
    root.appendChild(chart); root.appendChild(note);
    var D = null;
    loadJSON("jangseung-data.json").then(function (d) { D = d; draw(); }).catch(function () { chart.textContent = "The precomputed results could not load."; });

    function series() {
      if (view === "mnist") {
        var xs = [250, 500, 750, 1000];
        return { xs: xs, xlabel: "training digits", ymin: 0.4,
          lines: [
            { ys: xs.map(function (x) { return D.mnist_size[x].avgU; }), cls: "js-line-u", label: "unguarded (page)" },
            { ys: xs.map(function (x) { return D.mnist_size[x].avgG; }), cls: "js-line-g", label: "with Jangseung (page)" }
          ],
          paper: [{ x: 250, y: 0.532, cls: "u" }, { x: 250, y: 0.911, cls: "g" }, { x: 1000, y: 0.976, cls: "u" }, { x: 1000, y: 0.978, cls: "g" }],
          note: "Average accuracy across 100 poisoned digits. Page: " + D.meta.mnist_pairs.length + " digit pairs (" + D.meta.mnist_pairs.join(", ") + "), one run per pair and size, scikit-learn. Paper: all 45 pairs, four runs each; open markers show its stated averages at 250 and 1,000 digits."
        };
      }
      if (view === "bcwsize") {
        var xs2 = D.bcw_size_x;
        return { xs: xs2, xlabel: "training records", ymin: 0.7,
          lines: [
            { ys: xs2.map(function (x) { return D.bcw_size[x].avgU; }), cls: "js-line-u", label: "unguarded (page)" },
            { ys: xs2.map(function (x) { return D.bcw_size[x].avgG; }), cls: "js-line-g", label: "with Jangseung (page)" }
          ],
          paper: [],
          note: "Average accuracy across 100 poisoned records, isolation-forest guard, 100 test records. Page: three runs per size, scikit-learn. The paper reports a gain of 15.12 points at 50 training records and 1.03 points at 500; it states values only at those two sizes."
        };
      }
      var xs3 = D.bcw_att_x;
      return { xs: xs3, xlabel: "poisoned records", ymin: 0.5,
        lines: [
          { ys: xs3.map(function (x) { return D.bcw_att.if[x].avgU; }), cls: "js-line-u", label: "unguarded (page)" },
          { ys: xs3.map(function (x) { return D.bcw_att.if[x].avgG; }), cls: "js-line-g", label: "isolation forest (page)" },
          { ys: xs3.map(function (x) { return D.bcw_att.ee[x].avgG; }), cls: "js-line-e", label: "elliptic envelope (page)" }
        ],
        paper: [{ x: 500, y: 0.7551, cls: "u" }, { x: 500, y: 0.8818, cls: "g" }],
        note: "Average accuracy across the attack sequence, 300 training and 100 test records. Page: three runs per point, scikit-learn. Paper: open markers at 500 attacks (75.51% unguarded, 88.18% with Jangseung); for 50 to 250 attacks it reports 90.03% to 90.72% unguarded."
      };
    }
    function draw() {
      if (!D) return;
      var S = series();
      chart.innerHTML = "";
      var W = chartWidth(chart), H = 240, L = 44, R = 12, T = 14, B = 40;
      var s = svg("svg", { class: "js-chart", viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": S.note });
      var x0 = S.xs[0], x1 = S.xs[S.xs.length - 1], y0 = S.ymin;
      function X(x) { return L + (W - L - R) * (x - x0) / (x1 - x0); }
      function Y(a) { return T + (H - T - B) * (1 - (a - y0) / (1 - y0)); }
      for (var a = y0; a <= 1.0001; a += 0.1) {
        s.appendChild(svg("line", { x1: L, x2: W - R, y1: Y(a), y2: Y(a), class: "c-grid" }));
        s.appendChild(svg("text", { x: L - 6, y: Y(a) + 4, "text-anchor": "end", class: "c-tick" }, Math.round(a * 100) + "%"));
      }
      S.xs.forEach(function (x) { s.appendChild(svg("text", { x: X(x), y: H - B + 16, "text-anchor": "middle", class: "c-tick" }, String(x))); });
      s.appendChild(svg("text", { x: (L + W - R) / 2, y: H - 6, "text-anchor": "middle", class: "c-label" }, S.xlabel));
      var legend = el("div", { class: "js-legend" });
      S.lines.forEach(function (ln) {
        legend.appendChild(el("span", { class: "js-key" }, [el("i", { class: "js-sw " + ln.cls + "-sw" }), ln.label]));
        var d = ln.ys.map(function (v, i) { return (i ? "L" : "M") + X(S.xs[i]).toFixed(1) + " " + Y(v).toFixed(1); }).join("");
        s.appendChild(svg("path", { d: d, class: ln.cls }));
        ln.ys.forEach(function (v, i) { s.appendChild(svg("circle", { cx: X(S.xs[i]), cy: Y(v), r: 3, class: ln.cls + "-pt" })); });
      });
      S.paper.forEach(function (p) { s.appendChild(svg("circle", { cx: X(p.x), cy: Y(p.y), r: 5.5, class: "js-paper-pt " + p.cls })); });
      if (S.paper.length) legend.appendChild(el("span", { class: "js-key" }, [el("i", { class: "js-sw js-sw-paper" }), "paper (open markers)"]));
      chart.appendChild(legend);
      chart.appendChild(s);
      note.textContent = S.note;
    }
    resizers.push(draw);
  }

  /* ------------------------------------------------------------ boot */

  function mount(id, fn) { var n = document.getElementById(id); if (n) fn(n); }
  function boot() {
    mount("js-door", mountDoor);
    mount("js-attack", mountAttack);
    mount("js-heat", mountHeat);
    mount("js-scale", mountScale);
    // redraw digits when the visitor changes theme
    var mo = new MutationObserver(function () { changed("theme"); });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "class"] });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();

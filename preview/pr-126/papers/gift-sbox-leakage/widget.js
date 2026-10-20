/*
  Widget for /papers/gift-sbox-leakage/.
  Mount points: #gl-guess, #gl-cipher, #gl-metrics, #gl-race.
  Everything is computed on the visitor's device by gift-engine.js. The
  attack demos use simulated leakage (Hamming weight plus Gaussian noise),
  labeled as such on every figure.
*/
(function () {
  "use strict";

  var E = window.GiftLeak;
  if (!E) return;
  var SVGNS = "http://www.w3.org/2000/svg";
  var state = { sbox: "GIFT", level: window.PaperKit ? window.PaperKit.level() : "public" };
  var listeners = [];
  document.addEventListener("paperlevel", function (e) { state.level = e.detail.level; });
  function setSbox(name) { state.sbox = name; listeners.forEach(function (fn) { fn(name); }); }

  /* ------------------------------------------------------------ helpers */
  function el(tag, attrs, kids) {
    var node = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === "text") node.textContent = attrs[k];
      else if (k === "html") node.innerHTML = attrs[k];
      else if (k.slice(0, 2) === "on") node.addEventListener(k.slice(2), attrs[k]);
      else node.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (kid) { if (kid != null) node.appendChild(typeof kid === "string" ? document.createTextNode(kid) : kid); });
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
  var resizers = [], resizeTimer = null;
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
  function range(label, min, max, step, value, onInput, fmtv) {
    fmtv = fmtv || String;
    var input = el("input", { type: "range", min: min, max: max, step: step, value: value, "aria-label": label });
    var out = el("output", { text: fmtv(value) });
    input.addEventListener("input", function () { out.textContent = fmtv(+input.value); onInput(+input.value); });
    return el("label", { class: "w-range" }, [el("span", { text: label }), input, out]);
  }
  function fmt(x, d) { return x == null || isNaN(x) ? "–" : x.toFixed(d == null ? 3 : d); }
  function hex1(v) { return v.toString(16).toUpperCase(); }
  var SBOX_OPTS = E.ORDER.map(function (k) { return { value: k, label: k }; });
  function sboxOf(name) { return E.parse(E.TABLE1[name]); }

  function sboxStrip(F) {
    var strip = el("div", { class: "gl-strip", "aria-label": "S-box table" });
    strip.appendChild(el("span", { class: "gl-rowlab", text: "in" }));
    for (var i = 0; i < 16; i++) strip.appendChild(el("span", { text: hex1(i) }));
    strip.appendChild(el("span", { class: "gl-rowlab", text: "out" }));
    for (var j = 0; j < 16; j++) strip.appendChild(el("span", { class: "gl-out", text: hex1(F[j]) }));
    return strip;
  }

  /* ------------------------------------------------ demo 1: guess the key */
  function mountGuess(root) {
    var rand = E.rng((Date.now() & 0xffff) + 11);
    var s = { sigma: 1.5, acc: null, secret: 0, revealed: false, n: 0, history: [] };
    var stripHost = el("div");
    var sboxSeg = seg(SBOX_OPTS, state.sbox, function (v) { setSbox(v); }, "S-box");
    var noise = range("Noise σ", 0, 3, 0.25, s.sigma, function (v) { s.sigma = v; reset(true); }, function (v) { return v.toFixed(2); });
    noise.setAttribute("data-levels", "hs ug grad res");
    var b1 = el("button", { type: "button", class: "w-btn", text: "Add 1 measurement", onclick: function () { add(1); } });
    var b10 = el("button", { type: "button", class: "w-btn", text: "Add 10", onclick: function () { add(10); } });
    var bReveal = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "Reveal the secret", onclick: function () { s.revealed = true; draw(); } });
    var bNew = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "New secret", onclick: function () { reset(true); } });
    var big = el("p", { class: "w-big", "aria-live": "polite" });
    var chart = svg("svg", { class: "gl-chart", role: "img" });
    var note = el("p", { class: "w-note" });
    root.appendChild(el("div", { class: "w-actions" }, [sboxSeg]));
    root.appendChild(stripHost);
    root.appendChild(el("div", { class: "w-actions" }, [noise]));
    root.appendChild(el("div", { class: "w-actions" }, [b1, b10, bReveal, bNew]));
    root.appendChild(big);
    root.appendChild(el("div", { class: "w-sim", text: "Simulated measurements: Hamming weight of one S-box output plus Gaussian noise" }));
    root.appendChild(chart);
    root.appendChild(note);

    function reset(newSecret) {
      var F = sboxOf(state.sbox);
      clear(stripHost); stripHost.appendChild(sboxStrip(F));
      if (newSecret) s.secret = Math.floor(rand() * 16);
      s.acc = new E.Accumulator(F);
      s.revealed = false; s.n = 0;
      draw();
    }
    function add(k) {
      var F = s.acc.S;
      for (var i = 0; i < k; i++) {
        var x = Math.floor(rand() * 16);
        var L = new Float64Array(16), xs = new Array(16).fill(0);
        xs[0] = x; L[0] = E.HW[F[x ^ s.secret]] + s.sigma * E.gauss(rand);
        s.acc.add({ x: xs, L: L });
        s.n++;
      }
      draw();
    }
    function draw() {
      var W = chartWidth(chart), H = 230, padL = 40, padR = 8, padT = 24, padB = 34;
      chart.setAttribute("viewBox", "0 0 " + W + " " + H);
      chart.setAttribute("aria-label", "Correlation for each of the 16 key guesses after " + s.n + " measurements");
      clear(chart);
      var corr = [], lead = 0;
      for (var g = 0; g < 16; g++) { corr.push(s.n >= 3 ? s.acc.corr(0, g) : 0); if (corr[g] > corr[lead]) lead = g; }
      var y = function (v) { return padT + (1 - (v + 1) / 2) * (H - padT - padB); };
      [-1, -0.5, 0, 0.5, 1].forEach(function (v) {
        chart.appendChild(svg("line", { class: v === 0 ? "c-axis" : "c-grid", x1: padL, x2: W - padR, y1: y(v), y2: y(v) }));
        chart.appendChild(svg("text", { class: "c-tick", x: padL - 6, y: y(v) + 4, "text-anchor": "end" }, v.toFixed(1)));
      });
      var bw = (W - padL - padR) / 16;
      for (var g2 = 0; g2 < 16; g2++) {
        var v = corr[g2], cls = "gl-bar";
        if (s.n >= 3 && g2 === lead) cls += " lead";
        if (s.revealed && g2 === s.secret) cls += " secret";
        var y0 = y(0), y1 = y(v);
        chart.appendChild(svg("rect", { class: cls, x: padL + g2 * bw + bw * 0.15, width: bw * 0.7, y: Math.min(y0, y1), height: Math.max(1, Math.abs(y1 - y0)) }));
        chart.appendChild(svg("text", { class: "c-tick", x: padL + g2 * bw + bw / 2, y: H - padB + 14, "text-anchor": "middle" }, hex1(g2)));
      }
      chart.appendChild(svg("text", { class: "c-label", x: padL + (W - padL - padR) / 2, y: H - 4, "text-anchor": "middle" }, "key guess (0 to F)"));
      chart.appendChild(svg("text", { class: "c-label", x: 2, y: 11 }, "correlation"));
      if (s.n < 3) big.innerHTML = "Add a few measurements to start.";
      else big.innerHTML = "After <strong>" + s.n + "</strong> measurement" + (s.n === 1 ? "" : "s") + ", the best guess is <strong>" + hex1(lead) + "</strong>" + (s.revealed ? (lead === s.secret ? ", which is the secret." : "; the secret is " + hex1(s.secret) + ".") : ".");
      var second = -2;
      for (var g3 = 0; g3 < 16; g3++) if (g3 !== lead) second = Math.max(second, corr[g3]);
      note.textContent = s.n < 3 ? "" : "Lead over the runner-up: " + fmt(corr[lead] - second, 3) + " in correlation. With noise σ = " + s.sigma.toFixed(2) + ", one measurement's correlation with the true prediction is about " + fmt(1 / Math.sqrt(1 + s.sigma * s.sigma), 2) + " at best.";
    }
    listeners.push(function (name) { sboxSeg.set(name); reset(false); });
    resizers.push(draw);
    reset(true);
  }

  /* ------------------------------------------------ demo 2: inside GIFT-64 */
  function mountCipher(root) {
    var TV = { pt: "c450c7727a9b8a7d", key: "bd91731eb6bc2713a1f9f6ffc75044e7", ct: null };
    var s = { pt: TV.pt, key: TV.key, rounds: 2 };
    var sboxSeg = seg(SBOX_OPTS, state.sbox, function (v) { setSbox(v); }, "S-box");
    var ptIn = el("input", { class: "gl-hex", value: s.pt, maxlength: 16, spellcheck: "false", "aria-label": "Plaintext, 16 hex digits" });
    var keyIn = el("input", { class: "gl-hex", value: s.key, maxlength: 32, spellcheck: "false", "aria-label": "Key, 32 hex digits" });
    var roundsSeg = seg([{ value: 2, label: "Rounds 1–2" }, { value: 5, label: "Rounds 1–5", levels: "ug grad res" }, { value: 28, label: "All 28", levels: "ug grad res" }], 2, function (v) { s.rounds = v; draw(); }, "Rounds shown");
    var host = el("div", { class: "gl-state-wrap" });
    var out = el("p", { class: "w-note", "aria-live": "polite" });
    ptIn.addEventListener("input", function () { s.pt = ptIn.value; draw(); });
    keyIn.addEventListener("input", function () { s.key = keyIn.value; draw(); });
    root.appendChild(el("div", { class: "w-actions" }, [sboxSeg]));
    root.appendChild(el("div", { class: "gl-inputs" }, [
      el("label", {}, ["Plaintext (hex)", ptIn]),
      el("label", {}, ["Key (hex)", keyIn])
    ]));
    root.appendChild(el("div", { class: "w-actions" }, [roundsSeg,
      el("button", { type: "button", class: "w-btn w-btn-quiet", text: "Designers' test vector", onclick: function () { ptIn.value = s.pt = TV.pt; keyIn.value = s.key = TV.key; setSbox("GIFT"); } })]));
    root.appendChild(host);
    root.appendChild(out);

    function nib(a) { return E.nibblesToHex(a).split("").map(function (c) { return el("span", { class: "gl-nib", text: c }); }); }
    function draw() {
      var ptHex = s.pt.replace(/[^0-9a-fA-F]/g, ""), keyHex = s.key.replace(/[^0-9a-fA-F]/g, "");
      if (ptHex.length !== 16 || keyHex.length !== 32) { out.textContent = "Enter 16 hex digits of plaintext and 32 of key."; return; }
      var F = sboxOf(state.sbox), rows = [], masks = [];
      var ct = E.encrypt(E.hexToNibbles(ptHex, 16), E.hexToNibbles(keyHex, 32), 28, F, function (r, stage, st, mask) {
        if (r < s.rounds && stage !== "key") rows.push({ r: r, stage: stage, st: st, mask: mask });
        if (stage === "ark") masks.push(mask);
      });
      clear(host);
      var tbl = el("table", { class: "gl-state" });
      tbl.appendChild(el("thead", {}, [el("tr", {}, [el("th", { text: "Round" }), el("th", { text: "Step" }), el("th", { text: "State (nibble 15 … 0)" })])]));
      var tb = el("tbody");
      tb.appendChild(el("tr", {}, [el("td", { text: "–" }), el("td", { text: "plaintext" }), el("td", {}, nib(E.hexToNibbles(ptHex, 16)))]));
      var NAMES = { sub: "SubCells", perm: "PermBits", ark: "AddRoundKey" };
      rows.forEach(function (row) {
        var tr = el("tr", {}, [el("td", { text: String(row.r + 1) }), el("td", { text: NAMES[row.stage] + (row.r === 1 && row.stage === "sub" ? " ← point of interest" : "") }), el("td", {}, nib(row.st))]);
        if (row.r === 1 && row.stage === "sub") tr.className = "gl-poi";
        tb.appendChild(tr);
        if (row.stage === "ark" && row.r === 0) tb.appendChild(el("tr", { "data-levels": "ug grad res" }, [el("td", { text: "1" }), el("td", { text: "key + constant mask" }), el("td", {}, nib(row.mask))]));
      });
      tbl.appendChild(tb);
      host.appendChild(tbl);
      var ctHex = E.nibblesToHex(ct);
      var tvMatch = state.sbox === "GIFT" && ptHex.toLowerCase() === TV.pt && keyHex.toLowerCase() === TV.key;
      out.innerHTML = "Ciphertext after 28 rounds: <code>" + ctHex + "</code>." + (tvMatch ? " <span class=\"gl-ok\">Every round above matches the GIFT designers' published test vector.</span>" : (state.sbox !== "GIFT" ? " With the " + state.sbox + " S-box this is a variant of GIFT-64, as in the paper's experiments." : ""));
    }
    listeners.push(function (name) { sboxSeg.set(name); draw(); });
    draw();
  }

  /* ------------------------------------------------ demo 3: score an S-box */
  function mountMetrics(root) {
    var rows = E.ORDER.map(function (k) { return { name: k, hex: E.TABLE1[k], paper: E.TABLE2[k] }; });
    rows.push({ name: "S2′", hex: "516740E23FBA89CD", paper: null, levels: "res", note: "S2 with entries 2 and 3 swapped" });
    var custom = { name: "Yours", hex: "", paper: null };
    var selected = state.sbox, heatFn = null;
    resizers.push(function () { if (heatFn) heatFn(); });
    var input = el("input", { class: "gl-hex", placeholder: "16 hex digits, e.g. 0123456789ABCDEF", maxlength: 24, spellcheck: "false", "aria-label": "Your S-box, 16 hex digits" });
    var msg = el("span", { class: "w-note" });
    var wrap = el("div", { class: "gl-table-wrap" });
    var detail = el("div");
    root.appendChild(el("div", { class: "gl-inputs" }, [el("label", {}, ["Try your own S-box (outputs for inputs 0 to F)", input])]));
    root.appendChild(msg);
    root.appendChild(wrap);
    root.appendChild(detail);
    input.addEventListener("input", function () {
      var F = E.parse(input.value);
      custom.hex = F ? E.toHex(F) : "";
      msg.textContent = input.value && !F ? "Needs exactly 16 hex digits." : (F && !E.isPermutation(F) ? "Not a permutation: some outputs repeat, so the cipher could not be decrypted. Metrics still compute." : "");
      if (F) selected = "Yours";
      draw();
    });

    var COLS = [
      { key: "nl", label: "Non-linearity", d: 0 },
      { key: "dpa", label: "DPA-SNR", d: 3, levels: "ug grad res" },
      { key: "to", label: "TO", d: 3 },
      { key: "rto", label: "RTO (Eq. 4)", d: 3, levels: "ug grad res" },
      { key: "rtoPerBit", label: "RTO per bit", d: 3, levels: "res" },
      { key: "du", label: "Diff. uniformity", d: 0, levels: "grad res" }
    ];
    function cell(v, p, d, levels) {
      var td = el("td", { class: "num" });
      if (levels) td.setAttribute("data-levels", levels);
      td.appendChild(document.createTextNode(fmt(v, d)));
      if (p != null) {
        var ok = Math.abs(v - p) < 0.0011;
        td.appendChild(el("span", { class: ok ? "gl-paper" : "gl-miss", "data-levels": "ug grad res", text: " (" + p + ")" }));
      }
      return td;
    }
    function draw() {
      clear(wrap);
      var tbl = el("table", { class: "results-table gl-metrics" });
      var hr = el("tr", {}, [el("th", { text: "S-box" })]);
      COLS.forEach(function (c) { var th = el("th", { text: c.label }); if (c.levels) th.setAttribute("data-levels", c.levels); hr.appendChild(th); });
      tbl.appendChild(el("thead", {}, [hr]));
      var tb = el("tbody");
      rows.concat(custom.hex ? [custom] : []).forEach(function (r) {
        var m = E.metrics(E.parse(r.hex));
        var tr = el("tr", { tabindex: "0" }, [el("td", { text: r.name })]);
        if (r.levels) tr.setAttribute("data-levels", r.levels);
        if (r.name === selected) tr.className = "on";
        COLS.forEach(function (c) { tr.appendChild(cell(m[c.key], r.paper && r.paper[c.key] != null ? r.paper[c.key] : null, c.d, c.levels)); });
        function pick() { selected = r.name; if (E.TABLE1[r.name]) setSbox(r.name); else draw(); }
        tr.addEventListener("click", pick);
        tr.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(); } });
        tb.appendChild(tr);
      });
      tbl.appendChild(tb);
      wrap.appendChild(tbl);
      wrap.appendChild(el("p", { class: "w-note", "data-levels": "ug grad res", text: "Computed in your browser from Table I. Parentheses show the paper's Table II; a highlighted value disagrees with it." }));
      drawDetail();
    }
    function drawDetail() {
      clear(detail);
      var r = rows.concat([custom]).filter(function (x) { return x.name === selected && x.hex; })[0] || rows[1];
      var F = E.parse(r.hex);
      detail.appendChild(el("p", { class: "w-note", text: r.name + (r.note ? " (" + r.note + ")" : "") + ": select another row to compare." }));
      detail.appendChild(sboxStrip(F));
      var comp = E.componentNL(F), affine = comp.filter(function (c) { return c.nl === 0; }).map(function (c) { return c.v; });
      detail.appendChild(el("p", { class: "w-note", "data-levels": "ug grad res", text: affine.length ? "Affine output combinations (non-linearity 0): v = " + affine.map(hex1).join(", ") + ". An attacker's model can predict these bits exactly from the key and input bits they touch." : "No output combination is affine; the worst-case component non-linearity is " + Math.min.apply(null, comp.map(function (c) { return c.nl; })) + "." }));
      // Walsh heat map (grad and res)
      var box = el("div", { "data-levels": "grad res" });
      var chart = svg("svg", { class: "gl-chart", role: "img", "aria-label": "Walsh spectrum magnitude for " + r.name });
      box.appendChild(chart);
      box.appendChild(el("p", { class: "w-note", text: "Walsh spectrum |W_F(u, v)|, rows v (output mask), columns u (input mask). Non-linearity = 8 − (largest value outside row 0) / 2." }));
      detail.appendChild(box);
      function heat() {
        var W = chartWidth(chart), cell2 = Math.min(28, (W - 40) / 16), H = cell2 * 16 + 30;
        chart.setAttribute("viewBox", "0 0 " + W + " " + H);
        clear(chart);
        var tab = E.walshTable(F);
        for (var v = 0; v < 16; v++) {
          chart.appendChild(svg("text", { class: "c-tick", x: 24, y: 22 + v * cell2 + cell2 * 0.65, "text-anchor": "end" }, hex1(v)));
          for (var u = 0; u < 16; u++) {
            var a = Math.abs(tab[v][u]) / 16;
            chart.appendChild(svg("rect", { x: 30 + u * cell2, y: 20 + v * cell2, width: cell2 - 1, height: cell2 - 1, fill: "var(--primary)", "fill-opacity": v === 0 ? 0.08 : (0.06 + 0.94 * a).toFixed(3) }));
            if (cell2 >= 20 && v > 0 && tab[v][u] !== 0) chart.appendChild(svg("text", { class: "gl-cell-text", x: 30 + u * cell2 + cell2 / 2, y: 20 + v * cell2 + cell2 * 0.65, "text-anchor": "middle" }, String(Math.abs(tab[v][u]))));
          }
          chart.appendChild(svg("text", { class: "c-tick", x: 30 + v * cell2 + cell2 / 2, y: 14, "text-anchor": "middle" }, hex1(v)));
        }
      }
      heatFn = heat;
      heat();
    }
    listeners.push(function (name) { selected = name; draw(); });
    draw();
  }

  /* ------------------------------------------------ demo 4: race the S-boxes */
  /* Traces to a 50 percent mean success rate, read from the paper's Figure 4 (approximate). */
  var FIG4_50 = { PICCOLO: 35, GIFT: 36, PRESENT: 37, S2: 38, S4: 44, S1: 44, S3: 50 };
  var STYLE = {
    PICCOLO: { c: "var(--primary)", d: "" }, GIFT: { c: "var(--primary)", d: "6 3" }, PRESENT: { c: "var(--primary)", d: "2 3" },
    S2: { c: "var(--text)", d: "" },
    S4: { c: "var(--accent)", d: "" }, S1: { c: "var(--accent)", d: "6 3" }, S3: { c: "var(--accent)", d: "2 3" }
  };
  function ranks(a) {
    var idx = a.map(function (v, i) { return i; }).sort(function (i, j) { return a[i] - a[j]; });
    var r = new Array(a.length), k = 0;
    while (k < idx.length) {
      var m = k;
      while (m + 1 < idx.length && a[idx[m + 1]] === a[idx[k]]) m++;
      for (var t = k; t <= m; t++) r[idx[t]] = (k + m) / 2 + 1;
      k = m + 1;
    }
    return r;
  }
  function spearman(a, b) {
    var ra = ranks(a), rb = ranks(b), n = a.length;
    var ma = ra.reduce(function (s, v) { return s + v; }, 0) / n, mb = rb.reduce(function (s, v) { return s + v; }, 0) / n;
    var num = 0, va = 0, vb = 0;
    for (var i = 0; i < n; i++) { num += (ra[i] - ma) * (rb[i] - mb); va += (ra[i] - ma) * (ra[i] - ma); vb += (rb[i] - mb) * (rb[i] - mb); }
    return num / Math.sqrt(va * vb);
  }

  function mountRace(root) {
    var s = { sigma: 1.5, seed: 1, group: "all", results: {}, running: false, maxX: 100 };
    var groupSeg = seg([{ value: "all", label: "All seven" }, { value: "nl4", label: "Non-linearity 4" }, { value: "nl0", label: "Non-linearity 0" }], "all", function (v) { s.group = v; draw(); }, "S-boxes shown");
    var noise = range("Noise σ", 0.5, 3, 0.25, s.sigma, function (v) { s.sigma = v; }, function (v) { return v.toFixed(2); });
    var runBtn = el("button", { type: "button", class: "w-btn", text: "Run the trials", onclick: function () { run(); } });
    var seedBtn = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "New random seed", onclick: function () { s.seed = 1 + Math.floor(Math.random() * 1e6); run(); } });
    var status = el("p", { class: "w-note", "aria-live": "polite" });
    var legend = el("div", { class: "w-actions" });
    var chart = svg("svg", { class: "gl-chart", role: "img" });
    var tableHost = el("div", { class: "gl-table-wrap" });
    root.appendChild(el("div", { class: "w-actions" }, [groupSeg]));
    root.appendChild(el("div", { class: "w-actions" }, [noise, runBtn, seedBtn]));
    root.appendChild(status);
    root.appendChild(el("div", { class: "w-sim", text: "Simulated CPA, paper's protocol: 100 experiments per S-box, pool of 2,000 traces, cap 150, stop after five straight successes" }));
    root.appendChild(legend);
    root.appendChild(chart);
    root.appendChild(tableHost);

    function shown() {
      if (s.group === "nl4") return ["PICCOLO", "GIFT", "PRESENT"];
      if (s.group === "nl0") return ["S4", "S1", "S3"];
      return E.ORDER;
    }
    function run() {
      if (s.running) return;
      s.running = true; runBtn.disabled = true; seedBtn.disabled = true;
      s.results = {};
      var queue = E.ORDER.slice(), t0 = performance.now();
      (function next() {
        if (!queue.length) {
          s.running = false; runBtn.disabled = false; seedBtn.disabled = false;
          status.textContent = "Done: 700 simulated experiments in " + Math.round(performance.now() - t0) + " ms on your device (noise σ = " + s.sigma.toFixed(2) + ", seed " + s.seed + ").";
          draw(); return;
        }
        var k = queue.shift();
        status.textContent = "Running " + k + " …";
        s.results[k] = E.trial({ S: sboxOf(k), sigma: s.sigma, seed: s.seed, experiments: 100, poolSize: 2000, threshold: 150, successLimit: 5 });
        draw();
        setTimeout(next, 0);
      })();
    }
    function draw() {
      var names = shown();
      clear(legend);
      names.forEach(function (k) {
        var sw = svg("svg", { width: 22, height: 8, "aria-hidden": "true" });
        sw.appendChild(svg("line", { x1: 0, x2: 22, y1: 4, y2: 4, stroke: STYLE[k].c, "stroke-width": 2, "stroke-dasharray": STYLE[k].d }));
        legend.appendChild(el("span", { class: "w-note", style: "margin:0" }, [sw, " " + k]));
      });
      var W = chartWidth(chart), H = 260, padL = 44, padR = 10, padT = 10, padB = 36;
      chart.setAttribute("viewBox", "0 0 " + W + " " + H);
      chart.setAttribute("aria-label", "Mean success rate against number of traces for " + names.join(", "));
      clear(chart);
      var x = function (c) { return padL + (c / s.maxX) * (W - padL - padR); };
      var y = function (v) { return padT + (1 - v) * (H - padT - padB); };
      [0, 0.25, 0.5, 0.75, 1].forEach(function (v) {
        chart.appendChild(svg("line", { class: "c-grid", x1: padL, x2: W - padR, y1: y(v), y2: y(v) }));
        chart.appendChild(svg("text", { class: "c-tick", x: padL - 6, y: y(v) + 4, "text-anchor": "end" }, Math.round(v * 100) + "%"));
      });
      for (var c = 0; c <= s.maxX; c += 20) chart.appendChild(svg("text", { class: "c-tick", x: x(c), y: H - padB + 14, "text-anchor": "middle" }, String(c)));
      chart.appendChild(svg("text", { class: "c-label", x: padL + (W - padL - padR) / 2, y: H - 4, "text-anchor": "middle" }, "traces used"));
      names.forEach(function (k) {
        var m = s.results[k];
        if (!m) return;
        var d = "";
        for (var c2 = 1; c2 <= s.maxX; c2++) d += (c2 === 1 ? "M" : "L") + x(c2).toFixed(1) + "," + y(m[c2]).toFixed(1);
        chart.appendChild(svg("path", { class: "gl-line", d: d, stroke: STYLE[k].c, "stroke-dasharray": STYLE[k].d }));
      });
      drawTable(names);
    }
    function drawTable(names) {
      clear(tableHost);
      if (!names.every(function (k) { return s.results[k]; })) return;
      var tbl = el("table", { class: "results-table gl-race-table" });
      tbl.appendChild(el("thead", {}, [el("tr", {}, [
        el("th", { text: "S-box" }), el("th", { text: "Non-linearity" }),
        el("th", { text: "Traces to 50% (simulated)" }), el("th", { text: "Traces to 90% (simulated)", "data-levels": "ug grad res" }),
        el("th", { text: "Paper, 50% (read from Fig. 4)", "data-levels": "grad res" })
      ])]));
      var tb = el("tbody");
      names.forEach(function (k) {
        var m = s.results[k];
        tb.appendChild(el("tr", {}, [
          el("td", { text: k }), el("td", { class: "num", text: String(E.TABLE2[k].nl) }),
          el("td", { class: "num", text: String(E.tracesTo(m, 0.5) || "> 150") }),
          el("td", { class: "num", "data-levels": "ug grad res", text: String(E.tracesTo(m, 0.9) || "> 150") }),
          el("td", { class: "num", "data-levels": "grad res", text: "≈ " + FIG4_50[k] })
        ]));
      });
      tbl.appendChild(tb);
      tableHost.appendChild(tbl);
      if (names.length === 7) {
        // which metric predicts attack effort? Spearman rank correlation across the seven S-boxes
        var simT = E.ORDER.map(function (k) { return E.tracesTo(s.results[k], 0.5) || 151; });
        var papT = E.ORDER.map(function (k) { return FIG4_50[k]; });
        var mets = E.ORDER.map(function (k) { return E.metrics(sboxOf(k)); });
        var rowsM = [["Non-linearity", "nl"], ["DPA-SNR", "dpa"], ["TO", "to"], ["RTO (Eq. 4)", "rto"]];
        var t2 = el("table", { class: "results-table gl-race-table", "data-levels": "grad res" });
        t2.appendChild(el("caption", { class: "w-note", text: "Spearman rank correlation between each metric and traces needed for 50% success, across the seven S-boxes. Negative means a higher score goes with an easier attack. Computed by this page; metrics from Table I as printed." }));
        t2.appendChild(el("thead", {}, [el("tr", {}, [el("th", { text: "Metric" }), el("th", { text: "vs simulated traces" }), el("th", { text: "vs paper's Fig. 4 (approximate)" })])]));
        var tb2 = el("tbody");
        rowsM.forEach(function (r) {
          var v = mets.map(function (m) { return m[r[1]]; });
          tb2.appendChild(el("tr", {}, [el("td", { text: r[0] }), el("td", { class: "num", text: fmt(spearman(v, simT), 2) }), el("td", { class: "num", text: fmt(spearman(v, papT), 2) })]));
        });
        t2.appendChild(tb2);
        tableHost.appendChild(t2);
      }
    }
    resizers.push(draw);
    draw();
    run();
  }

  /* ---------------------------------------------------------------- mount */
  function mount(id, fn) {
    var node = document.getElementById(id);
    if (!node) return;
    try { fn(node); node.classList.add("w-ready"); }
    catch (err) { node.appendChild(el("p", { class: "w-note", text: "This demo could not start: " + err.message })); }
  }
  function start() {
    mount("gl-guess", mountGuess);
    mount("gl-cipher", mountCipher);
    mount("gl-metrics", mountMetrics);
    mount("gl-race", mountRace);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();

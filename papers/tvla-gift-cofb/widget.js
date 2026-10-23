/*
  Widget for /papers/tvla-gift-cofb/.
  Mount points: #tv-piles, #tv-datapath, #tv-test, #tv-alarm, #tv-scores.
  Everything runs on the visitor's device. cofb-engine.js encrypts with
  GIFT-COFB and simulates a round-based datapath; the S-box scores reuse the
  engine of /papers/gift-sbox-leakage/ (gift-engine.js). Simulated power is
  labeled as simulated on every figure.
*/
(function () {
  "use strict";

  var E = window.CofbTvla, G = window.GiftLeak;
  if (!E) return;
  var SVGNS = "http://www.w3.org/2000/svg";
  var THR = 4.5;
  var PT_TEXT = "DRACO Lab TVLA demo, fixed input";
  function textHex(s) { var h = ""; for (var i = 0; i < s.length; i++) h += (s.charCodeAt(i) < 16 ? "0" : "") + s.charCodeAt(i).toString(16); return h.toUpperCase(); }

  var state = {
    key: E.DEFAULTS.key, nonce: E.DEFAULTS.nonce, ad: E.DEFAULTS.ad, pt: textHex(PT_TEXT),
    vary: "pt", sigma: 80,
    level: window.PaperKit ? window.PaperKit.level() : "public"
  };
  var listeners = [];
  function changed(what) { listeners.forEach(function (fn) { fn(what); }); }
  document.addEventListener("paperlevel", function (e) { state.level = e.detail.level; changed("level"); });

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
    var wrap = el("label", { class: "w-range" }, [el("span", { text: label }), input, out]);
    wrap.setValue = function (v) { input.value = v; out.textContent = fmtv(v); };
    return wrap;
  }
  function fmt(x, d) { return x == null || isNaN(x) ? "–" : x.toFixed(d == null ? 1 : d); }
  function comma(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ","); }
  function bytes(h) { return E.hexToBytes(h); }

  var SEG_NAME = { N: "Nonce", A1: "Associated data", A2: "Associated data 2", A3: "Associated data 3", A4: "Associated data 4",
    M1: "Message block 1", M2: "Message block 2", M3: "Message block 3", M4: "Message block 4" };
  var SEG_SHORT = { N: "N", A1: "AD", A2: "AD2", A3: "AD3", A4: "AD4", M1: "M1", M2: "M2", M3: "M3", M4: "M4" };
  function segName(l) { return SEG_NAME[l] || l; }
  function lastLabel(labels) { return labels[labels.length - 1]; }
  function segTitle(l, labels) {
    var n = segName(l);
    if (l === lastLabel(labels)) n += " and tag";
    return n;
  }

  function fixedTrace() { return E.hdTrace(bytes(state.key), bytes(state.nonce), bytes(state.ad), bytes(state.pt)); }

  /*
    Shared cycle-axis frame: draws segment bands and labels, returns the x()
    mapping and plot box. opts: { W, H, padL, padR, padT, padB, labels, y: {min,max,ticks,fmt}, ylabel }.
  */
  function frame(chart, o) {
    var W = o.W, H = o.H, L = o.padL, R = o.padR, T = o.padT, B = o.padB;
    chart.setAttribute("viewBox", "0 0 " + W + " " + H);
    clear(chart);
    var n = o.labels.length;
    var x = function (i) { return L + (i + 0.5) / n * (W - L - R); };
    var y = function (v) { return T + (1 - (v - o.y.min) / (o.y.max - o.y.min)) * (H - T - B); };
    var segs = E.segments(o.labels);
    segs.forEach(function (s, k) {
      var x0 = L + s.start / n * (W - L - R), x1 = L + (s.end + 1) / n * (W - L - R);
      if (k % 2 === 1) chart.appendChild(svg("rect", { class: "tv-band", x: x0, y: T, width: x1 - x0, height: H - T - B }));
      var full = segName(s.label), room = x1 - x0 - 6;
      chart.appendChild(svg("text", { class: "c-label", x: (x0 + x1) / 2, y: T - 6, "text-anchor": "middle" },
        full.length * 6.7 <= room ? full : (SEG_SHORT[s.label] || s.label)));
    });
    o.y.ticks.forEach(function (v) {
      chart.appendChild(svg("line", { class: v === 0 ? "c-axis" : "c-grid", x1: L, x2: W - R, y1: y(v), y2: y(v) }));
      chart.appendChild(svg("text", { class: "c-tick", x: L - 6, y: y(v) + 4, "text-anchor": "end" }, o.y.fmt ? o.y.fmt(v) : String(v)));
    });
    chart.appendChild(svg("text", { class: "c-tick", x: (L + W - R) / 2, y: H - 6, "text-anchor": "middle" }, "Clock cycle (0 to " + (n - 1) + ")"));
    if (o.ylabel) chart.appendChild(svg("text", { class: "c-tick", x: 12, y: (T + H - B) / 2, "text-anchor": "middle", transform: "rotate(-90 12 " + ((T + H - B) / 2) + ")" }, o.ylabel));
    return { x: x, y: y, segs: segs };
  }
  function path(points) {
    return points.map(function (p, i) { return (i ? "L" : "M") + p[0].toFixed(1) + "," + p[1].toFixed(1); }).join("");
  }
  function niceTicks(lo, hi, count) {
    var span = hi - lo, stepRaw = span / (count || 5), mag = Math.pow(10, Math.floor(Math.log10(stepRaw)));
    var stp = [1, 2, 2.5, 5, 10].map(function (m) { return m * mag; }).filter(function (s) { return s >= stepRaw; })[0];
    var out = [];
    for (var v = Math.ceil(lo / stp) * stp; v <= hi + 1e-9; v += stp) out.push(Math.round(v * 1000) / 1000);
    return out;
  }

  function varyWords(v) {
    return v === "ad" ? "associated data" : v === "none" ? "nothing (both piles random)" : "plaintext";
  }

  /* --------------------------------------- demo 1: two piles of traces */
  function mountPiles(root) {
    var rand = E.rng((Date.now() & 0xffff) + 3);
    var s = { mode: "single", base: null, recent: [[], []], sum: null, n: 0 };
    var modeSeg = seg([{ value: "single", label: "Single measurements" }, { value: "avg", label: "Averages" }], s.mode,
      function (v) { s.mode = v; draw(); }, "What to show");
    var b1 = el("button", { type: "button", class: "w-btn", text: "Measure 1 more of each", onclick: function () { add(1); } });
    var b25 = el("button", { type: "button", class: "w-btn", text: "Measure 25 more", onclick: function () { add(25); } });
    var b250 = el("button", { type: "button", class: "w-btn", text: "Measure 250 more", onclick: function () { add(250); } });
    var bReset = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "Start over", onclick: function () { reset(); } });
    var big = el("p", { class: "w-big", "aria-live": "polite" });
    var chart = svg("svg", { class: "tv-chart", role: "img" });
    var legend = el("p", { class: "w-note tv-legend" });
    root.appendChild(el("div", { class: "w-actions" }, [modeSeg]));
    root.appendChild(el("div", { class: "w-actions" }, [b1, b25, b250, bReset]));
    root.appendChild(big);
    root.appendChild(el("div", { class: "w-sim", text: "Simulated power: register bits that flip each clock cycle, plus noise" }));
    root.appendChild(chart);
    root.appendChild(legend);

    function reset() {
      s.base = fixedTrace();
      s.recent = [[], []];
      s.sum = [new Float64Array(s.base.hd.length), new Float64Array(s.base.hd.length)];
      s.n = 0;
      add(5);
    }
    function one(group) {
      var base;
      if (state.vary === "none" || group === 1) {
        var k = bytes(state.key), n = bytes(state.nonce), a = bytes(state.ad), p = bytes(state.pt);
        if (state.vary === "ad" && group === 1) a = E.randomBytes(a.length, rand);
        else p = E.randomBytes(p.length, rand);
        base = E.hdTrace(k, n, a, p).hd;
      } else base = s.base.hd;
      var tr = new Float64Array(base.length);
      for (var i = 0; i < base.length; i++) tr[i] = base[i] + state.sigma * E.gauss(rand);
      return tr;
    }
    function add(k) {
      for (var j = 0; j < k; j++) {
        for (var g = 0; g < 2; g++) {
          var tr = one(g);
          for (var i = 0; i < tr.length; i++) s.sum[g][i] += tr[i];
          s.recent[g].push(tr);
          if (s.recent[g].length > 5) s.recent[g].shift();
        }
        s.n++;
      }
      draw();
    }
    function draw() {
      var W = chartWidth(chart), H = 250;
      var labels = s.base.labels, len = labels.length;
      var mean = [0, 1].map(function (g) { return Array.prototype.map.call(s.sum[g], function (v) { return v / s.n; }); });
      var lo, hi;
      if (s.mode === "single") { lo = 95 - 3 * state.sigma - 40; hi = 95 + 3 * state.sigma + 40; }
      else {
        lo = Infinity; hi = -Infinity;
        mean.forEach(function (m) { m.forEach(function (v) { if (v < lo) lo = v; if (v > hi) hi = v; }); });
        var pad = Math.max(8, (hi - lo) * 0.1); lo -= pad; hi += pad;
      }
      lo = Math.max(lo, -400);
      var f = frame(chart, { W: W, H: H, padL: 42, padR: 8, padT: 22, padB: 30, labels: labels,
        y: { min: lo, max: hi, ticks: niceTicks(lo, hi, 4), fmt: function (v) { return String(Math.round(v)); } } });
      chart.setAttribute("aria-label", s.mode === "single"
        ? "The latest five simulated measurements from each pile, overlaid"
        : "Average simulated power of each pile after " + s.n + " measurements per pile");
      if (s.mode === "single") {
        [1, 0].forEach(function (g) {
          s.recent[g].forEach(function (tr) {
            chart.appendChild(svg("path", { class: "tv-line thin " + (g === 0 ? "fixed" : "random"),
              d: path(Array.prototype.map.call(tr, function (v, i) { return [f.x(i), f.y(Math.max(lo, Math.min(hi, v)))]; })) }));
          });
        });
      } else {
        [1, 0].forEach(function (g) {
          chart.appendChild(svg("path", { class: "tv-line " + (g === 0 ? "fixed" : "random"),
            d: path(mean[g].map(function (v, i) { return [f.x(i), f.y(v)]; })) }));
        });
      }
      /* average gap where the piles share every input, and where they differ */
      var cut = len;
      if (state.vary !== "none") {
        var first = labels.indexOf(state.vary === "ad" ? "A1" : "M1");
        if (first >= 0) cut = first;
      }
      var gs = 0, ns = 0, gd = 0, nd = 0;
      for (var i = 0; i < len; i++) {
        var d = Math.abs(mean[0][i] - mean[1][i]);
        if (i < cut) { gs += d; ns++; } else { gd += d; nd++; }
      }
      big.innerHTML = "";
      big.appendChild(document.createTextNode(comma(s.n) + " measurements in each pile. "));
      if (s.mode === "single") big.appendChild(document.createTextNode("Single measurements look alike; switch to Averages."));
      else if (!nd || !ns) {
        big.appendChild(document.createTextNode("Average gap between the piles: "));
        big.appendChild(el("strong", { text: fmt((gs + gd) / len) }));
        big.appendChild(document.createTextNode(" bit flips, all of it noise."));
      } else {
        big.appendChild(document.createTextNode("Average gap before the " + varyWords(state.vary) + " enters: " + fmt(gs / ns) + " bit flips; after: "));
        big.appendChild(el("strong", { text: fmt(gd / nd) }));
        big.appendChild(document.createTextNode("."));
      }
      legend.textContent = (state.vary === "none"
        ? "Both piles use random plaintexts (a control). "
        : "Accent: the fixed-input pile (the same " + varyWords(state.vary) + " every time). Primary: the random pile (fresh random " + varyWords(state.vary) + " each time). ")
        + "Key, nonce, and the other inputs stay the same in both piles. Noise σ = " + state.sigma + " bit flips.";
    }
    listeners.push(function (what) { if (what === "inputs" || what === "vary" || what === "sigma") reset(); });
    resizers.push(draw);
    reset();
    root.classList.add("w-ready");
  }

  /* -------------------------------------- demo 2: where the data enters */
  var KAT = [
    { k: "000102030405060708090A0B0C0D0E0F", n: "000102030405060708090A0B0C0D0E0F", pt: "", ad: "", ct: "368965836D36614DE2FC24D0F801B9AF" },
    { k: "000102030405060708090A0B0C0D0E0F", n: "000102030405060708090A0B0C0D0E0F", pt: "", ad: "00", ct: "AE5DCDD1285D5177FE251DEB99D727DC" },
    { k: "000102030405060708090A0B0C0D0E0F", n: "000102030405060708090A0B0C0D0E0F", pt: "", ad: "0001", ct: "C4879E1B355D97DEA42CB661B2C1F9CA" },
    { k: "000102030405060708090A0B0C0D0E0F", n: "000102030405060708090A0B0C0D0E0F", pt: "", ad: "000102", ct: "059FE55D95148D4C1C485DDBF54D13CE" }
  ];
  function mountDatapath(root) {
    var fields = {};
    function field(name, label, maxBytes, exact) {
      var input = el("input", { class: "tv-hex", type: "text", spellcheck: "false", autocomplete: "off", value: state[name], "aria-label": label });
      var msg = el("span", { class: "tv-msg" });
      input.addEventListener("change", function () {
        var h = input.value.replace(/[^0-9a-fA-F]/g, "").toUpperCase();
        if (h.length % 2) h = h.slice(0, -1);
        if (exact && h.length !== 2 * exact) { msg.textContent = "needs " + exact + " bytes (" + 2 * exact + " hex digits)"; return; }
        if (h.length > 2 * maxBytes) h = h.slice(0, 2 * maxBytes);
        msg.textContent = "";
        input.value = h; state[name] = h; changed("inputs");
      });
      fields[name] = input;
      return el("label", {}, [el("span", { text: label }), input, msg]);
    }
    var inputs = el("div", { class: "tv-inputs" }, [
      field("key", "Key (16 bytes)", 16, 16), field("nonce", "Nonce (16 bytes)", 16, 16),
      field("ad", "Associated data (up to 64 bytes)", 64), field("pt", "Plaintext (up to 64 bytes)", 64)
    ]);
    inputs.setAttribute("data-levels", "ug grad res");
    var bText = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "Plaintext: “" + PT_TEXT + "”", onclick: function () {
      state.pt = textHex(PT_TEXT); fields.pt.value = state.pt; changed("inputs");
    } });
    var bZero = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "Plaintext: 32 zero bytes", onclick: function () {
      state.pt = "00".repeat(32); fields.pt.value = state.pt; changed("inputs");
    } });
    var bOne = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "One block of plaintext", onclick: function () {
      state.pt = textHex(PT_TEXT).slice(0, 32); fields.pt.value = state.pt; changed("inputs");
    } });
    var out = el("div", { class: "tv-out" });
    var big = el("p", { class: "w-big", "aria-live": "polite" });
    var chart = svg("svg", { class: "tv-chart", role: "img" });
    var note = el("p", { class: "w-note" });
    var kat = el("p", { class: "w-note tv-kat" });
    root.appendChild(inputs);
    root.appendChild(el("div", { class: "w-actions" }, [bText, bZero, bOne]));
    root.appendChild(out);
    root.appendChild(big);
    root.appendChild(el("div", { class: "w-sim", text: "Simulated datapath: noise-free register bit flips per clock cycle" }));
    root.appendChild(chart);
    root.appendChild(note);
    root.appendChild(kat);

    var pass = KAT.filter(function (v) {
      var r = E.encrypt(bytes(v.k), bytes(v.n), bytes(v.ad), bytes(v.pt));
      return E.bytesToHex(r.full) === v.ct;
    }).length;
    kat.textContent = "Check: the engine reproduces " + pass + " of " + KAT.length +
      " official GIFT-COFB known-answer vectors in your browser (all 1,089 matched when the page was built).";

    var cache = null;
    function compute() {
      var k = bytes(state.key), n = bytes(state.nonce), a = bytes(state.ad), p = bytes(state.pt);
      var fx = E.hdTrace(k, n, a, p);
      var mean = state.vary === "none" ? null : E.meanRandomTrace(k, n, a, p, state.vary, 300, 11);
      var r = E.encrypt(k, n, a, p);
      cache = { fx: fx, mean: mean, r: r };
    }
    function draw() {
      if (!cache) compute();
      var fx = cache.fx, labels = fx.labels, len = labels.length;
      clear(out);
      out.appendChild(el("div", {}, [el("span", { class: "tv-k", text: "Ciphertext" }), el("code", { text: E.bytesToHex(cache.r.ct) || "(none)" })]));
      out.appendChild(el("div", {}, [el("span", { class: "tv-k", text: "Tag" }), el("code", { text: E.bytesToHex(cache.r.tag) })]));
      var W = chartWidth(chart), H = 250;
      var hi = 0; fx.hd.forEach(function (v) { if (v > hi) hi = v; });
      hi = Math.ceil((hi + 10) / 50) * 50;
      var f = frame(chart, { W: W, H: H, padL: 42, padR: 8, padT: 22, padB: 30, labels: labels,
        y: { min: 0, max: hi, ticks: niceTicks(0, hi, 4) } });
      chart.setAttribute("aria-label", "Bit flips per clock cycle for the chosen inputs, " + len + " cycles");
      var bw = Math.max(1, (W - 50) / len - 0.6);
      var enter = -1;
      if (state.vary !== "none") for (var i = 0; i < len; i++) if (Math.abs(fx.hd[i] - cache.mean[i]) > 0.75) { enter = i; break; }
      for (var j = 0; j < len; j++) {
        var cls = "tv-bar" + (enter >= 0 && j >= enter ? " hot" : "");
        chart.appendChild(svg("rect", { class: cls, x: f.x(j) - bw / 2, y: f.y(fx.hd[j]), width: bw, height: f.y(0) - f.y(fx.hd[j]) }));
      }
      if (cache.mean) {
        chart.appendChild(svg("path", { class: "tv-line random", d: path(Array.prototype.map.call(cache.mean, function (v, i) { return [f.x(i), f.y(v)]; })) }));
      }
      var nCalls = E.segments(labels).length;
      big.innerHTML = "";
      big.appendChild(document.createTextNode(nCalls + " block-cipher calls, " + len + " clock cycles. "));
      if (enter >= 0) {
        big.appendChild(document.createTextNode("The " + varyWords(state.vary) + " first changes the power at cycle "));
        big.appendChild(el("strong", { text: String(enter) }));
        big.appendChild(document.createTextNode("."));
      } else if (state.vary === "none") big.appendChild(document.createTextNode("Both piles are random in the control setting."));
      else big.appendChild(document.createTextNode("The " + varyWords(state.vary) + " does not change the power for these inputs."));
      note.textContent = "Bars: bits that flip in the state, L, and key registers each cycle for the inputs above" +
        (enter >= 0 ? " (accent from the first cycle the varying input reaches)" : "") + ". " +
        (cache.mean ? "Line: the average over 300 random " + varyWords(state.vary) + " values. " : "") +
        "One cycle loads each block; 40 cycles run the 40 GIFT-128 rounds.";
    }
    listeners.push(function (what) { if (what === "inputs" || what === "vary") { cache = null; draw(); } });
    resizers.push(draw);
    draw();
    root.classList.add("w-ready");
  }

  /* ---------------------------------------------- demo 3: run the test */
  function mountTest(root) {
    var s = { target: 2000, camp: null, running: false, history: [], firstCross: null, raf: null };
    var varySeg = seg([
      { value: "pt", label: "Fixed vs random plaintext (paper)" },
      { value: "ad", label: "Fixed vs random associated data", levels: "ug grad res" },
      { value: "none", label: "Random vs random (control)" }
    ], state.vary, function (v) { state.vary = v; changed("vary"); }, "What differs between the piles");
    var noise = range("Noise σ", 0, 160, 4, state.sigma, function (v) { state.sigma = v; changed("sigma"); }, function (v) { return String(v); });
    noise.setAttribute("data-levels", "hs ug grad res");
    var targetSeg = seg([
      { value: 500, label: "500 traces" }, { value: 2000, label: "2,000 (paper)" }, { value: 10000, label: "10,000" }, { value: 50000, label: "50,000", levels: "grad res" }
    ], s.target, function (v) { s.target = v; draw(); }, "Number of traces");
    var bRun = el("button", { type: "button", class: "w-btn", text: "Run the test", onclick: function () { s.running ? pause() : run(); } });
    var bReset = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "Reset", onclick: function () { reset(); } });
    var big = el("p", { class: "w-big", "aria-live": "polite" });
    var chart = svg("svg", { class: "tv-chart", role: "img" });
    var grow = svg("svg", { class: "tv-chart tv-grow", role: "img" });
    grow.setAttribute("data-levels", "ug grad res");
    var stats = el("div", { class: "tv-stats" });
    var note = el("p", { class: "w-note" });
    root.appendChild(el("div", { class: "w-actions" }, [varySeg]));
    root.appendChild(el("div", { class: "w-actions" }, [noise, targetSeg]));
    root.appendChild(el("div", { class: "w-actions" }, [bRun, bReset]));
    root.appendChild(big);
    root.appendChild(el("div", { class: "w-sim", text: "Simulated campaign: Welch's t for each clock cycle" }));
    root.appendChild(chart);
    root.appendChild(stats);
    root.appendChild(grow);
    root.appendChild(note);

    function reset() {
      pause();
      s.camp = new E.Campaign({ key: state.key, nonce: state.nonce, ad: state.ad, pt: state.pt, vary: state.vary, sigma: state.sigma, seed: (Date.now() & 0xfffff) + 1 });
      s.history = []; s.firstCross = null;
      bRun.textContent = "Run the test";
      varySeg.set(state.vary); noise.setValue(state.sigma);
      draw();
    }
    function run() {
      if (s.camp.count >= s.target) reset();
      s.running = true; bRun.textContent = "Pause";
      var per = Math.max(20, Math.round(s.target / 90));
      (function tick() {
        if (!s.running) return;
        var k = Math.min(per, s.target - s.camp.count);
        s.camp.step(k);
        var sm = s.camp.summary(THR);
        s.history.push([s.camp.count, sm.maxAbs]);
        if (s.firstCross == null && sm.maxAbs > THR && s.camp.welch.n[0] > 1 && s.camp.welch.n[1] > 1) s.firstCross = s.camp.count;
        draw(sm);
        if (s.camp.count >= s.target) { pause(); return; }
        s.raf = requestAnimationFrame(tick);
      })();
    }
    function pause() {
      s.running = false; bRun.textContent = s.camp && s.camp.count >= s.target ? "Run again" : (s.camp && s.camp.count ? "Resume" : "Run the test");
      if (s.raf) cancelAnimationFrame(s.raf);
    }
    function draw(sm) {
      sm = sm || s.camp.summary(THR);
      var labels = s.camp.fixed.labels, len = labels.length;
      var W = chartWidth(chart), H = 260;
      var lim = Math.max(8, Math.ceil(sm.maxAbs + 1));
      var f = frame(chart, { W: W, H: H, padL: 42, padR: 8, padT: 22, padB: 30, labels: labels,
        y: { min: -lim, max: lim, ticks: niceTicks(-lim, lim, 6).filter(function (v) { return Math.abs(v) <= lim; }) } });
      chart.setAttribute("aria-label", "Welch t statistic per clock cycle after " + sm.traces + " traces; " + sm.over + " cycles beyond plus or minus 4.5");
      [THR, -THR].forEach(function (v) {
        chart.appendChild(svg("line", { class: "tv-thr", x1: 42, x2: W - 8, y1: f.y(v), y2: f.y(v) }));
      });
      chart.appendChild(svg("text", { class: "c-label", x: W - 10, y: f.y(THR) - 4, "text-anchor": "end" }, "±4.5"));
      if (sm.traces > 2) {
        chart.appendChild(svg("path", { class: "tv-line tline", d: path(Array.prototype.map.call(sm.t, function (v, i) { return [f.x(i), f.y(v)]; })) }));
        for (var i = 0; i < len; i++) if (Math.abs(sm.t[i]) > THR) chart.appendChild(svg("circle", { class: "tv-hit", cx: f.x(i), cy: f.y(sm.t[i]), r: 3 }));
      }
      big.innerHTML = "";
      if (!sm.traces) big.appendChild(document.createTextNode("Press Run to collect " + comma(s.target) + " simulated traces."));
      else if (sm.over > 0) {
        big.appendChild(el("strong", { text: String(sm.over) }));
        big.appendChild(document.createTextNode(" of " + len + " cycles cross ±4.5 after " + comma(sm.traces) + " traces: the test flags leakage."));
      } else {
        big.appendChild(document.createTextNode("No cycle crosses ±4.5 after " + comma(sm.traces) + " traces: the test finds no evidence of leakage."));
      }
      clear(stats);
      function row(k, v, levels) { var r = el("div", {}, [el("span", { class: "tv-k", text: k }), el("span", { text: v })]); if (levels) r.setAttribute("data-levels", levels); stats.appendChild(r); }
      row("Traces (fixed / random)", comma(sm.nFixed) + " / " + comma(sm.nRandom));
      row("Largest |t|", sm.traces > 2 ? fmt(sm.maxAbs, 2) + " at cycle " + sm.at + " (" + segTitle(labels[sm.at], labels).toLowerCase() + ")" : "–");
      row("First crossing", s.firstCross ? "after " + comma(s.firstCross) + " traces" : "–", "hs ug grad res");
      row("Setting", varyWords(state.vary) + "; noise σ = " + state.sigma, "ug grad res");
      drawGrow();
      note.textContent = "The paper collected 2,000 fixed-versus-random traces from each FPGA implementation and plotted t for its first 2,000 samples. " +
        "This chart is the page's simulation of " + len + " clock cycles of a round-based datapath; traces join the fixed or random pile by coin flip.";
    }
    function drawGrow() {
      var W = chartWidth(grow), H = 170, L = 42, R = 8, T = 14, B = 30;
      grow.setAttribute("viewBox", "0 0 " + W + " " + H);
      clear(grow);
      var hiT = 8; s.history.forEach(function (p) { if (p[1] > hiT) hiT = p[1]; });
      hiT = Math.ceil(hiT + 1);
      var x = function (n) { return L + n / s.target * (W - L - R); };
      var y = function (v) { return T + (1 - v / hiT) * (H - T - B); };
      niceTicks(0, hiT, 4).forEach(function (v) {
        grow.appendChild(svg("line", { class: v === 0 ? "c-axis" : "c-grid", x1: L, x2: W - R, y1: y(v), y2: y(v) }));
        grow.appendChild(svg("text", { class: "c-tick", x: L - 6, y: y(v) + 4, "text-anchor": "end" }, String(v)));
      });
      grow.appendChild(svg("line", { class: "tv-thr", x1: L, x2: W - R, y1: y(THR), y2: y(THR) }));
      grow.appendChild(svg("text", { class: "c-tick", x: (L + W - R) / 2, y: H - 6, "text-anchor": "middle" }, W < 480 ? "Traces collected" : "Traces collected (largest |t| over all cycles)"));
      [0, 0.5, 1].forEach(function (q) {
        grow.appendChild(svg("text", { class: "c-tick", x: x(q * s.target), y: H - 18, "text-anchor": q === 0 ? "start" : q === 1 ? "end" : "middle" }, comma(q * s.target)));
      });
      if (s.history.length > 1) grow.appendChild(svg("path", { class: "tv-line tline", d: path(s.history.map(function (p) { return [x(p[0]), y(p[1])]; })) }));
      grow.setAttribute("aria-label", "Largest absolute t against traces collected");
    }
    listeners.push(function (what) { if (what === "inputs" || what === "vary" || what === "sigma") reset(); });
    resizers.push(function () { draw(); });
    reset();
    root.classList.add("w-ready");
  }

  /* -------------------------------------------- demo 4: false alarms */
  function mountAlarm(root) {
    var STOPS = [1, 10, 100, 164, 1000, 2000, 10000, 100000, 1000000];
    var s = { idx: 5 };
    var slider = range("Points tested", 0, STOPS.length - 1, 1, s.idx, function (v) { s.idx = v; draw(); }, function (v) { return comma(STOPS[v]); });
    var big = el("p", { class: "w-big", "aria-live": "polite" });
    var chart = svg("svg", { class: "tv-chart", role: "img" });
    var stats = el("div", { class: "tv-stats" });
    var note = el("p", { class: "w-note" });
    root.appendChild(el("div", { class: "w-actions" }, [slider]));
    root.appendChild(big);
    root.appendChild(chart);
    root.appendChild(stats);
    root.appendChild(note);
    var THRS = [{ t: 4.5, cls: "a", levels: null }, { t: 5, cls: "b", levels: "grad res" }, { t: 6, cls: "c", levels: "grad res" }];
    function pAny(t, S) { var p = E.normalTail2(t); return 1 - Math.exp(S * Math.log1p(-p)); }
    function draw() {
      var S = STOPS[s.idx], p = E.normalTail2(THR), any = pAny(THR, S);
      var W = chartWidth(chart), H = 210, L = 46, R = 10, T = 14, B = 34;
      chart.setAttribute("viewBox", "0 0 " + W + " " + H);
      clear(chart);
      var lx0 = 0, lx1 = 6;
      var x = function (S) { return L + (Math.log10(S) - lx0) / (lx1 - lx0) * (W - L - R); };
      var y = function (v) { return T + (1 - v) * (H - T - B); };
      [0, 0.25, 0.5, 0.75, 1].forEach(function (v) {
        chart.appendChild(svg("line", { class: v === 0 ? "c-axis" : "c-grid", x1: L, x2: W - R, y1: y(v), y2: y(v) }));
        chart.appendChild(svg("text", { class: "c-tick", x: L - 6, y: y(v) + 4, "text-anchor": "end" }, Math.round(v * 100) + "%"));
      });
      for (var d = 0; d <= 6; d++) chart.appendChild(svg("text", { class: "c-tick", x: x(Math.pow(10, d)), y: H - 18, "text-anchor": d === 0 ? "start" : d === 6 ? "end" : "middle" }, d === 0 ? "1" : "10" + "⁰¹²³⁴⁵⁶"[d]));
      chart.appendChild(svg("text", { class: "c-tick", x: (L + W - R) / 2, y: H - 4, "text-anchor": "middle" }, "Points tested in one trace (log scale)"));
      THRS.forEach(function (th) {
        var pts = [];
        for (var e = 0; e <= 60; e++) { var SS = Math.pow(10, e / 10); pts.push([x(SS), y(pAny(th.t, SS))]); }
        var g = svg("g", th.levels ? { "data-levels": th.levels } : {});
        g.appendChild(svg("path", { class: "tv-line alarm " + th.cls, d: path(pts) }));
        g.appendChild(svg("text", { class: "c-label", x: W - R - 2, y: y(pAny(th.t, 1e6)) + (th.t === 4.5 ? 14 : -4), "text-anchor": "end" }, "|t| > " + th.t));
        chart.appendChild(g);
      });
      [[164, "this page's model"], [2000, "paper's plotted window"]].forEach(function (m, k) {
        chart.appendChild(svg("line", { class: "c-grid tv-mark", x1: x(m[0]), x2: x(m[0]), y1: T, y2: H - B }));
        chart.appendChild(svg("text", { class: "c-label", x: x(m[0]) + 3, y: y(0.62 - 0.1 * k) }, m[1]));
      });
      chart.appendChild(svg("circle", { class: "tv-hit", cx: x(S), cy: y(any), r: 4 }));
      chart.setAttribute("aria-label", "Chance of at least one false alarm against the number of points tested");
      big.innerHTML = "";
      big.appendChild(document.createTextNode("With no leakage at all, a test of " + comma(S) + " points crosses ±4.5 somewhere with probability "));
      big.appendChild(el("strong", { text: (any < 0.001 ? (any * 100).toFixed(4) : (any * 100).toFixed(2)) + "%" }));
      big.appendChild(document.createTextNode("."));
      clear(stats);
      function row(k, v, levels) { var r = el("div", {}, [el("span", { class: "tv-k", text: k }), el("span", { text: v })]); if (levels) r.setAttribute("data-levels", levels); stats.appendChild(r); }
      row("One point beyond ±4.5", "p = " + p.toExponential(2) + " (about 1 in " + comma(1 / p) + ")");
      row("Expected false alarms", (S * p).toPrecision(3), "ug grad res");
      row("One point beyond ±5 / ±6", E.normalTail2(5).toExponential(2) + " / " + E.normalTail2(6).toExponential(2), "grad res");
      note.textContent = "Computed by the page from the normal approximation to Welch's t, treating points as independent (neighboring samples of a real trace are correlated, which lowers the true rate). The paper reports 4.5 as a 99.9999 percent confidence level; the two-sided tail at 4.5 is 99.9993 percent.";
    }
    resizers.push(draw);
    draw();
    root.classList.add("w-ready");
  }

  /* ------------------------------------------- demo 5: S-box scores */
  function mountScores(root) {
    if (!G) { root.appendChild(el("p", { class: "w-note", text: "The S-box engine did not load." })); return; }
    var LIST = [
      { name: "PICCOLO", hex: "E4B238091A7F6C5D", printed: { nl: 4, snr: 39.401, dpa: 3.108, to: 3.666, rto: 3.333 } },
      { name: "GIFT-64", hex: "1A4C6F392DB7508E", printed: { nl: 4, snr: 39.348, dpa: 2.399, to: 3.466, rto: 3.066 } },
      { name: "PRESENT", hex: "C56B90AD3EF84712", printed: { nl: 4, snr: 34.665, dpa: 2.129, to: 3.533, rto: 3.266 } },
      { name: "S2", hex: "5176402E3FBA89CD", alt: "517640E23FBA89CD", printed: { nl: 2, snr: 39.968, dpa: 2.946, to: 3.4, rto: 3.266 } },
      { name: "S4", hex: "123456789ABCDEF0", printed: { nl: 0, snr: 39.252, dpa: 2.484, to: 2.933, rto: 2.933 }, asPrinted: "1 2 3 4 5 6 7 8 9 10 A B C D F 0" },
      { name: "S1", hex: "0E7645213FAB89CD", printed: { nl: 0, snr: 38.582, dpa: 2.579, to: 3.266, rto: 3.133 } },
      { name: "S3", hex: "0FEDCBA987654321", printed: { nl: 0, snr: 34.148, dpa: 2.484, to: 2.933, rto: 2.933 } }
    ];
    var s = { s2: "nist", pick: "GIFT-64" };
    var s2Seg = seg([{ value: "nist", label: "S2 as listed in this paper" }, { value: "isvlsi", label: "S2 as listed in ISVLSI 2021" }], s.s2,
      function (v) { s.s2 = v; draw(); }, "Which S2 listing");
    s2Seg.setAttribute("data-levels", "grad res");
    var pickSeg = seg(LIST.map(function (r) { return { value: r.name, label: r.name }; }), s.pick, function (v) { s.pick = v; draw(); }, "S-box");
    var strip = el("div");
    var wrap = el("div", { class: "tv-table-wrap" });
    var note = el("p", { class: "w-note" });
    root.appendChild(el("div", { class: "w-actions" }, [pickSeg]));
    root.appendChild(strip);
    root.appendChild(el("div", { class: "w-actions" }, [s2Seg]));
    root.appendChild(wrap);
    root.appendChild(note);
    function trunc3(v) { return (Math.floor(v * 1000 + 1e-9) / 1000).toFixed(3); }
    function draw() {
      var cur = LIST.filter(function (r) { return r.name === s.pick; })[0];
      var F = G.parse(cur.name === "S2" && s.s2 === "isvlsi" ? cur.alt : cur.hex);
      clear(strip);
      var st = el("div", { class: "tv-strip", "aria-label": cur.name + " S-box table" });
      st.appendChild(el("span", { class: "tv-rowlab", text: "in" }));
      for (var i = 0; i < 16; i++) st.appendChild(el("span", { text: i.toString(16).toUpperCase() }));
      st.appendChild(el("span", { class: "tv-rowlab", text: "out" }));
      for (var j = 0; j < 16; j++) st.appendChild(el("span", { class: "tv-out", text: F[j].toString(16).toUpperCase() }));
      strip.appendChild(st);

      var table = el("table", { class: "results-table tv-scores" });
      var head = el("tr", {}, ["S-box", "NL", "TO", "RTO", "DPA-SNR", "SNR (dB)"].map(function (h, k) {
        var th = el("th", { text: h }); if (k === 5) th.setAttribute("data-levels", "ug grad res"); return th;
      }));
      table.appendChild(el("thead", {}, [head]));
      var body = el("tbody");
      var matched = 0, cells = 0;
      LIST.forEach(function (r) {
        var hex = r.name === "S2" && s.s2 === "isvlsi" ? r.alt : r.hex;
        var m = G.metrics(G.parse(hex));
        var vals = [
          [String(m.nl), String(r.printed.nl), m.nl === r.printed.nl],
          [trunc3(m.to), r.printed.to.toFixed(3), Math.abs(Math.floor(m.to * 1000 + 1e-9) / 1000 - r.printed.to) < 1e-9],
          [trunc3(m.rto), r.printed.rto.toFixed(3), Math.abs(Math.floor(m.rto * 1000 + 1e-9) / 1000 - r.printed.rto) < 1e-9],
          [m.dpa.toFixed(3), r.printed.dpa.toFixed(3), Math.abs(m.dpa - r.printed.dpa) < 0.0006]
        ];
        var tr = el("tr", { class: r.name === s.pick ? "tv-pick" : "" });
        tr.appendChild(el("td", { text: r.name }));
        vals.forEach(function (v) {
          cells++; if (v[2]) matched++;
          var td = el("td", { class: v[2] ? "tv-ok" : "tv-miss" });
          td.appendChild(document.createTextNode(v[0]));
          if (!v[2]) td.appendChild(el("span", { class: "tv-printed", text: " (printed " + v[1] + ")" }));
          tr.appendChild(td);
        });
        var snr = el("td", { text: r.printed.snr.toFixed(3), class: "tv-printed-cell" });
        snr.setAttribute("data-levels", "ug grad res");
        tr.appendChild(snr);
        body.appendChild(tr);
      });
      table.appendChild(body);
      clear(wrap); wrap.appendChild(table);
      note.textContent = "Computed in your browser: " + matched + " of " + cells + " cells match Table I (TO and RTO truncated to three decimals, as printed; DPA-SNR rounded). " +
        "SNR in decibels comes from the paper's measurements and is shown as printed. " +
        "Table I lists S4 with an entry “10” (" + LIST[4].asPrinted + "), which repeats A and drops E; the page uses 123456789ABCDEF0, the S4 of the ISVLSI 2021 paper.";
    }
    draw();
    root.classList.add("w-ready");
  }

  function mount(id, fn) { var node = document.getElementById(id); if (node) fn(node); }
  mount("tv-piles", mountPiles);
  mount("tv-datapath", mountDatapath);
  mount("tv-test", mountTest);
  mount("tv-alarm", mountAlarm);
  mount("tv-scores", mountScores);
})();

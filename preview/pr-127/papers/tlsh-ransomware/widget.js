/*
  TLSH and @DisCo widget for /papers/tlsh-ransomware/.
  Mount points: #tl-hook, #tl-mech, #tl-dist, #tl-pipe, #tl-table.
  Shared state: two inputs, A and B (text typed on the page or files read
  locally), used by the first three demos.
  Digests and distances come from tlsh-engine.js, a port of Trend Micro's
  reference TLSH verified against its regression outputs. The pipeline demo
  runs on simulated samples (tlsh-sim.js); Table II values are as printed.
  Nothing typed or loaded here leaves the device.
*/
(function () {
  "use strict";

  var E = window.TLSHEngine, Sim = window.TLSHSim;
  if (!E || !Sim) return;
  var SVGNS = "http://www.w3.org/2000/svg";

  /* ------------------------------------------------------------ paper data */

  // Table II (printed as "Table III" in the text): ten @DisCo clusters, mean ± SD.
  var T2 = [
    [0.9966, 0.0049, 0.9456, 0.0309, 0.0509, 0.0300],
    [0.9803, 0.0907, 0.9571, 0.0267, 0.0514, 0.0635],
    [0.9970, 0.0037, 0.9200, 0.0529, 0.0770, 0.0504],
    [1.0000, 0.0000, 0.9686, 0.0189, 0.0314, 0.0189],
    [1.0000, 0.0000, 0.8681, 0.0893, 0.1319, 0.0893],
    [1.0000, 0.0000, 0.9602, 0.0166, 0.0398, 0.0166],
    [0.8618, 0.3219, 0.8547, 0.2041, 0.1428, 0.2016],
    [1.0000, 0.0000, 0.9041, 0.1245, 0.0959, 0.1245],
    [1.0000, 0.0000, 0.9981, 0.0014, 0.0019, 0.0014],
    [1.0000, 0.0000, 0.9994, 0.0004, 0.0006, 0.0004]
  ];
  // Figure 3 caption: campaign of each @DisCo cluster.
  var T2_FAMILY = ["Revil", "Revil", "Darkside", "Darkside", "Revil", "WannaCry", "TrickBoot + 1 WannaCry", "WannaCry", "TrickBoot", "Darkside"];

  var TEXT_A = [
    "A ransomware campaign rarely ships one file. The authors rebuild their code for each target, swap a configuration block, change a ransom note, or wrap the program in a new layer of encryption, and every rebuild becomes a new sample for defenders to catch.",
    "A cryptographic hash such as MD5 or SHA-256 names one exact file. Change a single byte and the name changes completely, so a list of known-bad hashes misses the next rebuild. A fuzzy hash summarizes the shape of a file instead, so near copies get near names.",
    "TLSH, the Trend Micro Locality Sensitive Hash, slides a five-byte window across the file, counts which byte triplets appear, and keeps only whether each count sits in the lowest, second, third, or highest quarter. Two files that share most of their content share most of those quarters."
  ];
  var A0 = TEXT_A.join("\n\n");
  var PRESETS = [
    { id: "same", label: "Same text", make: function () { return A0; } },
    { id: "letter", label: "One letter", make: function () { return A0.replace("rarely ships", "rarely shops"); } },
    { id: "sentence", label: "Add a sentence", make: function () { return A0 + "\n\nThat is why defenders compare samples by similarity as well as by name."; } },
    { id: "swap", label: "Swap paragraphs", make: function () { return [TEXT_A[2], TEXT_A[0], TEXT_A[1]].join("\n\n"); } },
    { id: "other", label: "Unrelated text", make: function () { return "Spring wheat goes in as soon as the ground can be worked. Farmers in the northern plains watch soil temperature more than the calendar, because seed sown into cold ground sits idle and invites disease. A field drilled in late April can head out by early July, and a dry August brings it in fast.\n\nOats follow a similar schedule but tolerate wetter soil, which is why many farms rotate the two. Barley, grown for malt, needs steadier moisture and a careful hand with nitrogen so the grain stays low in protein."; } }
  ];

  /* ------------------------------------------------------------ state */

  var state = {
    a: A0, b: PRESETS[1].make(), aName: "Text A", bName: "Text B", aBytes: null, bBytes: null, preset: "letter",
    level: window.PaperKit ? window.PaperKit.level() : "public"
  };
  var listeners = [];
  function onChange(fn) { listeners.push(fn); }
  function changed(what) { listeners.forEach(function (fn) { fn(what); }); }
  document.addEventListener("paperlevel", function (e) { state.level = e.detail.level; changed("level"); });
  function deep() { return state.level === "grad" || state.level === "res"; }
  function atLeastUg() { return state.level === "ug" || deep(); }

  var cache = { a: null, b: null };
  function bytesA() { return state.aBytes || E.toBytes(state.a); }
  function bytesB() { return state.bBytes || E.toBytes(state.b); }
  function hashes() {
    if (!cache.a) cache.a = E.hash(bytesA());
    if (!cache.b) cache.b = E.hash(bytesB());
    return cache;
  }
  onChange(function (what) { if (what === "a") cache.a = null; if (what === "b") cache.b = null; });

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
      if (o.title) b.title = o.title;
      b.addEventListener("click", function () { set(o.value); onPick(o.value); });
      wrap.appendChild(b);
      btns.push({ b: b, v: o.value });
    });
    function set(v) { value = v; btns.forEach(function (x) { x.b.setAttribute("aria-checked", String(x.v === v)); }); }
    wrap.set = set;
    return wrap;
  }
  function labeled(label, control, levels) {
    var row = el("div", { class: "tl-ctl" }, [el("span", { class: "tl-ctl-label", text: label }), control]);
    if (levels) row.setAttribute("data-levels", levels);
    return row;
  }
  function fmt(x, d) { return x == null || !isFinite(x) ? "–" : Number(x).toFixed(d == null ? 2 : d); }
  function words(n) { return ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"][n] || n.toLocaleString("en-US"); }
  function cssVar(name, fallback) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  }
  function parseColor(c) {
    var m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(c);
    if (m) {
      var h = m[1].length === 3 ? m[1].replace(/(.)/g, "$1$1") : m[1];
      return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
    }
    m = /rgba?\(([^)]+)\)/.exec(c);
    if (m) return m[1].split(",").slice(0, 3).map(function (x) { return parseFloat(x); });
    return null;
  }
  function bitsDiff(h1, h2) {
    var n = 0;
    for (var i = 0; i < h1.length; i++) {
      var x = parseInt(h1[i], 16) ^ parseInt(h2[i], 16);
      while (x) { n += x & 1; x >>= 1; }
    }
    return n;
  }
  // Show a hex string with the characters that differ from `other` marked.
  function hexDiff(str, other) {
    var span = el("code", { class: "tl-hex" });
    for (var i = 0; i < str.length; i++) {
      var ch = str[i];
      if (other && other[i] !== ch) span.appendChild(el("mark", { text: ch }));
      else span.appendChild(document.createTextNode(ch));
    }
    return span;
  }
  function countDiffChars(a, b) { var n = 0; for (var i = 0; i < Math.min(a.length, b.length); i++) if (a[i] !== b[i]) n++; return n; }
  function verdict(d) {
    if (d == null) return "";
    return d <= E.PAPER_CUTOFF ? "within the paper's cutoff of 100, so the two would be linked into one cluster" : "above the paper's cutoff of 100, so the two would not be linked directly";
  }
  function invalidText(h) {
    if (h.reason === "short") return "too short for TLSH (it needs at least 50 bytes)";
    if (h.reason === "sparse" || h.reason === "flat") return "too uniform for TLSH (more than half of the 128 counters must be nonzero)";
    return "no digest";
  }

  /* ------------------------------------------------------------ demo 1: one change */

  function mountHook(root) {
    var presets = el("div", { class: "w-actions" });
    var presetBtns = [];
    PRESETS.forEach(function (p) {
      var b = el("button", { type: "button", class: "w-btn w-btn-quiet", text: p.label, "aria-pressed": String(p.id === state.preset), onclick: function () {
        state.preset = p.id; state.b = p.make(); state.bBytes = null; state.bName = "Text B";
        tb.value = state.b; tb.disabled = false;
        presetBtns.forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
        changed("b");
      } });
      presetBtns.push(b); presets.appendChild(b);
    });
    var ta = el("textarea", { class: "tl-text", rows: "8", spellcheck: "false", "aria-label": "Text A" });
    var tb = el("textarea", { class: "tl-text", rows: "8", spellcheck: "false", "aria-label": "Text B" });
    ta.value = state.a; tb.value = state.b;
    var ta_t = null, tb_t = null;
    ta.addEventListener("input", function () { clearTimeout(ta_t); ta_t = setTimeout(function () { state.a = ta.value; state.aBytes = null; changed("a"); }, 120); });
    tb.addEventListener("input", function () { clearTimeout(tb_t); tb_t = setTimeout(function () { state.b = tb.value; state.bBytes = null; state.preset = null; presetBtns.forEach(function (x) { x.setAttribute("aria-pressed", "false"); }); changed("b"); }, 120); });

    function fileInput(which) {
      var inp = el("input", { type: "file", class: "tl-file", "aria-label": "Load a file as " + which.toUpperCase() });
      inp.addEventListener("change", function () {
        var f = inp.files && inp.files[0];
        if (!f) return;
        var reader = new FileReader();
        reader.onload = function () {
          var bytes = new Uint8Array(reader.result);
          if (which === "a") { state.aBytes = bytes; state.aName = f.name; ta.value = "(" + f.name + ", " + bytes.length.toLocaleString("en-US") + " bytes, read on this device)"; ta.disabled = true; changed("a"); }
          else { state.bBytes = bytes; state.bName = f.name; tb.value = "(" + f.name + ", " + bytes.length.toLocaleString("en-US") + " bytes, read on this device)"; tb.disabled = true; state.preset = null; presetBtns.forEach(function (x) { x.setAttribute("aria-pressed", "false"); }); changed("b"); }
        };
        reader.readAsArrayBuffer(f);
      });
      return inp;
    }
    var reset = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "Back to the sample text", onclick: function () {
      state.a = A0; state.aBytes = null; state.aName = "Text A"; ta.value = A0; ta.disabled = false;
      state.b = PRESETS[1].make(); state.bBytes = null; state.bName = "Text B"; tb.value = state.b; tb.disabled = false; state.preset = "letter";
      presetBtns.forEach(function (x, i) { x.setAttribute("aria-pressed", String(i === 1)); });
      changed("a"); changed("b");
    } });
    var files = el("div", { class: "tl-files", "data-levels": "ug grad res" }, [
      el("span", { class: "tl-ctl-label", text: "Your own files" }),
      el("label", { class: "tl-filelab" }, ["A ", fileInput("a")]),
      el("label", { class: "tl-filelab" }, ["B ", fileInput("b")]),
      reset
    ]);
    var cols = el("div", { class: "tl-cols" }, [
      el("div", { class: "tl-col" }, [el("span", { class: "tl-ctl-label", text: "Text A" }), ta]),
      el("div", { class: "tl-col" }, [el("span", { class: "tl-ctl-label", text: "Text B" }), tb])
    ]);
    var out = el("div", { class: "tl-rows", "aria-live": "polite" });
    root.appendChild(el("div", { class: "tl-ctl" }, [el("span", { class: "tl-ctl-label", text: "Change B" }), presets]));
    root.appendChild(cols);
    root.appendChild(files);
    root.appendChild(out);

    function row(label, a, b, note) {
      return el("div", { class: "tl-row" }, [
        el("div", { class: "tl-row-k", text: label }),
        el("div", { class: "tl-row-v" }, [el("div", {}, [el("span", { class: "tl-tag", text: "A" }), a]), el("div", {}, [el("span", { class: "tl-tag", text: "B" }), b]), note ? el("p", { class: "tl-row-note", html: note }) : null])
      ]);
    }
    function render() {
      var h = hashes();
      var sa = E.sha256(bytesA()), sb = E.sha256(bytesB());
      out.innerHTML = "";
      var nd = countDiffChars(sa, sb), bd = bitsDiff(sa, sb);
      var shaNote = sa === sb ? "Identical inputs give identical hashes." :
        "<strong>" + nd + " of 64</strong> hex digits differ" + (atLeastUg() ? " (" + bd + " of 256 bits, " + fmt(100 * bd / 256, 0) + "%)" : "") + ". Any change, however small, scrambles the whole name.";
      out.appendChild(row("SHA-256", hexDiff(sa, sb), hexDiff(sb, sa), shaNote));
      var tA = h.a.valid ? hexDiff(h.a.digest, h.b.valid ? h.b.digest : null) : el("code", { class: "tl-hex", text: "TNULL: " + invalidText(h.a) });
      var tB = h.b.valid ? hexDiff(h.b.digest, h.a.valid ? h.a.digest : null) : el("code", { class: "tl-hex", text: "TNULL: " + invalidText(h.b) });
      var tNote;
      if (h.a.valid && h.b.valid) {
        var d = E.diff(h.a, h.b);
        tNote = "<strong>" + countDiffChars(h.a.digest, h.b.digest) + " of 72</strong> characters differ. TLSH distance <strong>" + d + "</strong>, " + verdict(d) + ".";
        if (atLeastUg()) tNote += " On the paper's 0 to 1 scale (1 − distance/1,112) the pair scores " + fmt(E.scaled(d), 3) + ".";
      } else tNote = "TLSH needs at least 50 bytes with some variety; shorter or flatter inputs get the placeholder TNULL.";
      out.appendChild(row("TLSH", tA, tB, tNote));
    }
    onChange(function (w) { if (w === "a" || w === "b" || w === "level") render(); });
    render();
  }

  /* ------------------------------------------------------------ demo 2: how the digest is built */

  function mountMech(root) {
    var which = "a";
    var srcSeg = seg([{ value: "a", label: "Text A" }, { value: "b", label: "Text B" }], which, function (v) { which = v; pos = null; render(); }, "Input");
    var slider = el("input", { type: "range", min: "4", max: "100", value: "40", "aria-label": "Window position" });
    var pos = null;
    slider.addEventListener("input", function () { pos = +slider.value; render(); });
    var winBox = el("div", { class: "tl-window", "aria-live": "polite" });
    var chart = svg("svg", { class: "tl-chart", role: "img" });
    var legend = el("p", { class: "w-note" });
    var anatomy = el("div", { class: "tl-anatomy" });
    root.appendChild(labeled("Input", srcSeg));
    root.appendChild(labeled("Window at byte", slider));
    root.appendChild(winBox);
    root.appendChild(chart);
    root.appendChild(legend);
    root.appendChild(anatomy);

    function show(b) {
      if (b >= 32 && b < 127) return String.fromCharCode(b) === " " ? "␣" : String.fromCharCode(b);
      if (b === 10) return "↵";
      return "·";
    }
    function render() {
      var bytes = which === "a" ? bytesA() : bytesB();
      var h = which === "a" ? hashes().a : hashes().b;
      var n = bytes.length;
      winBox.innerHTML = ""; anatomy.innerHTML = "";
      while (chart.firstChild) chart.removeChild(chart.firstChild);
      if (n < 5) { winBox.appendChild(el("p", { class: "w-note", text: "Type at least five characters." })); return; }
      slider.max = String(n - 1);
      if (pos == null || pos > n - 1) pos = Math.min(n - 1, Math.max(4, Math.floor(n * 0.3)));
      slider.value = String(pos);
      var trip = E.windowBuckets(bytes, pos);
      // window strip
      var strip = el("div", { class: "tl-strip" });
      for (var i = pos - 4; i <= pos; i++) {
        strip.appendChild(el("span", { class: "tl-byte" }, [el("b", { text: show(bytes[i]) }), el("small", { text: (bytes[i] < 16 ? "0" : "") + bytes[i].toString(16).toUpperCase() })]));
      }
      winBox.appendChild(el("div", { class: "tl-ctl" }, [el("span", { class: "tl-ctl-label", text: "Bytes " + (pos - 4) + " to " + pos }), strip]));
      var list = el("div", { class: "tl-trips" });
      var inEff = 0;
      trip.forEach(function (t) {
        var eff = t.bucket < 128;
        if (eff) inEff++;
        var txt = t.bytes.slice().reverse().map(show).join(""); // file order
        list.appendChild(el("span", { class: "tl-trip" + (eff ? "" : " off") }, [el("code", { text: txt }), " → " + (eff ? "counter " + t.bucket : "#" + t.bucket + " (unused)")]));
      });
      winBox.appendChild(list);

      // histogram
      var counts = h.counts || E.buckets(bytes).counts;
      var W = chartWidth(chart), H = 210, L = 40, R = 52, T = 14, B = 34;
      chart.setAttribute("viewBox", "0 0 " + W + " " + H);
      chart.setAttribute("width", W); chart.setAttribute("height", H);
      var max = 1;
      for (i = 0; i < 128; i++) if (counts[i] > max) max = counts[i];
      var bw = (W - L - R) / 128;
      var y = function (v) { return T + (H - T - B) * (1 - v / max); };
      [0, 0.5, 1].forEach(function (f) {
        var v = Math.round(max * f);
        chart.appendChild(svg("line", { class: "c-grid", x1: L, x2: W - R, y1: y(v), y2: y(v) }));
        chart.appendChild(svg("text", { class: "c-tick", x: L - 4, y: y(v) + 4, "text-anchor": "end" }, String(v)));
      });
      var hot = {};
      trip.forEach(function (t) { if (t.bucket < 128) hot[t.bucket] = true; });
      for (i = 0; i < 128; i++) {
        var lv = h.valid ? h.levels[i] : 0;
        var r = svg("rect", { class: "tl-bar q" + lv + (hot[i] ? " hot" : ""), x: L + i * bw + 0.5, width: Math.max(1, bw - 1), y: y(counts[i]), height: Math.max(0, y(0) - y(counts[i])) });
        r.appendChild(svg("title", {}, "Counter " + i + ": " + counts[i] + (h.valid ? " (quarter " + (lv + 1) + ")" : "")));
        chart.appendChild(r);
      }
      if (h.valid) {
        [["Q1", h.q[0]], ["Q2", h.q[1]], ["Q3", h.q[2]]].forEach(function (q) {
          chart.appendChild(svg("line", { class: "c-ref", x1: L, x2: W - R, y1: y(q[1]), y2: y(q[1]) }));
          chart.appendChild(svg("text", { class: "c-label", x: W - R + 4, y: y(q[1]) + 4, "text-anchor": "start" }, q[0] + " " + q[1]));
        });
      }
      [0, 32, 64, 96, 127].forEach(function (k) {
        chart.appendChild(svg("text", { class: "c-tick", x: L + (k + 0.5) * bw, y: H - B + 14, "text-anchor": "middle" }, String(k)));
      });
      chart.appendChild(svg("text", { class: "c-label", x: L + (W - L - R) / 2, y: H - 4, "text-anchor": "middle" }, "Counter (128 used by the default digest)"));
      chart.setAttribute("aria-label", "Bar chart of TLSH's 128 counters for the selected input, with quartile lines");

      if (!h.valid) {
        legend.textContent = "This input gives TNULL: " + invalidText(h) + ".";
        return;
      }
      legend.innerHTML = (state.level === "public" || state.level === "hs" ?
        "Each bar counts how often a group of three bytes from the window landed in that counter. The most strongly colored bars are the top quarter; the faintest are the bottom quarter. The window above adds one to each of its highlighted counters." :
        "Bars are shaded by quarter: above Q3 (code 3), above Q2 (2), above Q1 (1), else 0. The window contributes " + words(inEff) + " of its six triplets to the 128 counters the default digest reads; the rest land in counters 128 to 255, which the 128-bucket build ignores.") +
        " " + bytes.length.toLocaleString("en-US") + " bytes, " + h.nonzero + " of 128 counters nonzero.";

      // digest anatomy
      var d = h.digest;
      var parts = [
        { k: "Version", v: d.slice(0, 2), note: "T1: 128 counters, one checksum byte" },
        { k: "Checksum", v: d.slice(2, 4), note: "running byte checksum " + h.checksum },
        { k: "Length", v: d.slice(4, 6), note: "log-scale length bin " + h.lvalue },
        { k: "Quartile ratios", v: d.slice(6, 8), note: "Q1/Q3 → " + h.q1ratio + ", Q2/Q3 → " + h.q2ratio },
        { k: "Body", v: d.slice(8), note: "128 two-bit quarter codes, four per byte" }
      ];
      parts.forEach(function (p) {
        anatomy.appendChild(el("div", { class: "tl-part" }, [el("span", { class: "tl-ctl-label", text: p.k }), el("code", { class: "tl-hex", text: p.v }), el("span", { class: "tl-part-note", text: p.note, "data-levels": "ug grad res" })]));
      });
      if (deep()) anatomy.appendChild(el("p", { class: "w-note", text: "Q1 = " + h.q[0] + ", Q2 = " + h.q[1] + ", Q3 = " + h.q[2] + ". Ratios are ⌊100·Q1/Q3⌋ mod 16 = " + h.q1ratio + " and ⌊100·Q2/Q3⌋ mod 16 = " + h.q2ratio + ". Header bytes are nibble-swapped and the body is written last counter first, as the reference code does." }));
    }
    onChange(function (w) { if ((w === "a" && which === "a") || (w === "b" && which === "b") || w === "level") { if (w !== "level") pos = null; render(); } });
    resizers.push(render);
    render();
  }

  /* ------------------------------------------------------------ demo 3: the distance */

  function mountDist(root) {
    var out = el("div", { "aria-live": "polite" });
    var grid = svg("svg", { class: "tl-chart", role: "img", "aria-label": "Quarter codes of A and B for all 128 counters" });
    var scale = svg("svg", { class: "tl-chart", role: "img", "aria-label": "Distance on the paper's scale" });
    var slider = el("input", { type: "range", min: "0", max: "400", value: "0", "aria-label": "Try a distance" });
    var tryRow = labeled("Try a distance", slider, "hs ug grad res");
    var tryOut = el("span", { class: "tl-num" });
    tryRow.appendChild(tryOut);
    var manual = null;
    slider.addEventListener("input", function () { manual = +slider.value; drawScale(); });
    root.appendChild(out);
    root.appendChild(grid);
    root.appendChild(scale);
    root.appendChild(tryRow);

    var cur = null;
    function render() {
      var h = hashes();
      out.innerHTML = ""; while (grid.firstChild) grid.removeChild(grid.firstChild);
      if (!h.a.valid || !h.b.valid) {
        cur = null;
        out.appendChild(el("p", { class: "w-note", text: "Both inputs need a TLSH digest. Shorten or vary the text in the first demo." }));
        drawScale(); return;
      }
      var p = E.diffParts(h.a, h.b);
      cur = p.total; manual = null; slider.value = String(Math.min(400, cur));
      var terms = [
        { k: "Length", v: p.length, hint: "0 or 1 for neighboring length bins, else 12 per bin" },
        { k: "Q1 ratio", v: p.q1, hint: "0 or 1 for a step of one, else 12 per extra step" },
        { k: "Q2 ratio", v: p.q2, hint: "same rule as Q1" },
        { k: "Checksum", v: p.checksum, hint: "1 if the checksum bytes differ" },
        { k: "Body", v: p.body, hint: "per counter: 0, 1, or 2 for a jump of that many quarters, 6 for a jump of three" }
      ];
      var tbl = el("table", { class: "results-table tl-terms" });
      tbl.appendChild(el("caption", { text: "TLSH distance between A and B, term by term" }));
      var thead = el("thead", {}, [el("tr", {}, [el("th", { text: "Term" }), el("th", { text: "Adds" }), el("th", { text: "Rule", "data-levels": "ug grad res" })])]);
      var tb = el("tbody");
      terms.forEach(function (t) { tb.appendChild(el("tr", {}, [el("td", { text: t.k }), el("td", { class: "tl-num", text: String(t.v) }), el("td", { text: t.hint, "data-levels": "ug grad res" })])); });
      tb.appendChild(el("tr", { class: "on" }, [el("td", { html: "<strong>Total</strong>" }), el("td", { class: "tl-num", html: "<strong>" + p.total + "</strong>" }), el("td", { text: verdict(p.total), "data-levels": "ug grad res" })]));
      tbl.appendChild(thead); tbl.appendChild(tb);
      out.appendChild(el("div", { class: "tl-table-wrap" }, [tbl]));

      // quarter-code grid: 2 rows x 128 cells
      var W = chartWidth(grid), L = 20, R = 6, cell = (W - L - R) / 64, rows = 2, H = 4 * cell * 1 + 40;
      grid.setAttribute("viewBox", "0 0 " + W + " " + H);
      grid.setAttribute("width", W); grid.setAttribute("height", H);
      var changedCells = 0;
      [["A", h.a], ["B", h.b]].forEach(function (pair, r) {
        for (var i = 0; i < 128; i++) {
          var row = r * 2 + (i >= 64 ? 1 : 0), col = i % 64;
          var lv = pair[1].levels[i], other = (r === 0 ? h.b : h.a).levels[i];
          var x = L + col * cell, y = 4 + row * (cell + 1) + (r === 1 ? 6 : 0);
          var rc = svg("rect", { class: "tl-cell q" + lv + (lv !== other ? " ch" : ""), x: x + 0.5, y: y, width: Math.max(1, cell - 1), height: cell });
          rc.appendChild(svg("title", {}, pair[0] + ", counter " + i + ": quarter " + (lv + 1)));
          grid.appendChild(rc);
          if (r === 0 && lv !== other) changedCells++;
        }
        grid.appendChild(svg("text", { class: "c-label", x: 2, y: 4 + (r * 2) * (cell + 1) + (r === 1 ? 6 : 0) + cell * 1.4 }, pair[0]));
      });
      grid.appendChild(svg("text", { class: "c-tick", x: L, y: H - 6 }, changedCells + " of 128 counters changed quarter (outlined)"));
      drawScale();
    }
    function drawScale() {
      while (scale.firstChild) scale.removeChild(scale.firstChild);
      var d = manual != null ? manual : cur;
      var W = chartWidth(scale), H = 74, L = 10, R = 14;
      scale.setAttribute("viewBox", "0 0 " + W + " " + H);
      scale.setAttribute("width", W); scale.setAttribute("height", H);
      var MAX = E.PAPER_MAX;
      var x = function (v) { return L + (W - L - R) * Math.min(v, MAX) / MAX; };
      scale.appendChild(svg("rect", { class: "tl-track", x: L, y: 22, width: W - L - R, height: 10 }));
      scale.appendChild(svg("rect", { class: "tl-near", x: L, y: 22, width: x(100) - L, height: 10 }));
      (W < 520 ? [0, 100, 500, 1112] : [0, 100, 250, 500, 750, 1112]).forEach(function (v) {
        scale.appendChild(svg("line", { class: "c-grid", x1: x(v), x2: x(v), y1: 32, y2: 38 }));
        scale.appendChild(svg("text", { class: "c-tick", x: x(v), y: 50, "text-anchor": v === 1112 ? "end" : v === 0 ? "start" : "middle" }, v === 1112 ? (W < 520 ? "1,112 max" : "1,112 (paper's max)") : String(v)));
      });
      scale.appendChild(svg("text", { class: "c-label", x: x(100) + 4, y: 16 }, "cutoff 100"));
      if (d != null) {
        scale.appendChild(svg("line", { class: "tl-mark", x1: x(d), x2: x(d), y1: 18, y2: 36 }));
        scale.appendChild(svg("text", { class: "c-label", x: x(d), y: 68, "text-anchor": x(d) < W / 2 ? "start" : "end" }, "distance " + d + " → similarity " + fmt(E.scaled(d), 3)));
      }
      tryOut.textContent = d != null ? d + " → " + fmt(E.scaled(d), 3) : "";
    }
    onChange(function (w) { if (w === "a" || w === "b" || w === "level") render(); });
    resizers.push(render);
    render();
  }

  /* ------------------------------------------------------------ demo 4: the pipeline on simulated samples */

  function mountPipe(root) {
    var cutoff = 100, edit = 0.04, A = null, S = null, building = false;
    var cutSlider = el("input", { type: "range", min: "20", max: "250", step: "5", value: String(cutoff), "aria-label": "Edge cutoff" });
    var cutOut = el("span", { class: "tl-num", text: String(cutoff) });
    cutSlider.addEventListener("input", function () { cutoff = +cutSlider.value; cutOut.textContent = String(cutoff); draw(); });
    var cutRow = labeled("Link pairs at distance ≤", el("span", { class: "tl-slider" }, [cutSlider, cutOut]));
    var editSeg = seg([{ value: 0.02, label: "2%" }, { value: 0.04, label: "4%" }, { value: 0.08, label: "8%" }, { value: 0.15, label: "15%" }], edit, function (v) { edit = v; build(); }, "Edits per sample");
    var editRow = labeled("Edits per sample", editSeg, "ug grad res");
    var status = el("p", { class: "w-note", "aria-live": "polite" });
    var canvas = el("canvas", { class: "tl-heat", role: "img", "aria-label": "Heat map of scaled TLSH similarity between 162 simulated samples, grouped by family" });
    var famKey = el("div", { class: "tl-key" });
    var summary = el("p", { class: "tl-readout", "aria-live": "polite" });
    var tableWrap = el("div", { class: "tl-table-wrap" });
    root.appendChild(el("p", { class: "tl-sim", text: "Simulated samples: 162 synthetic byte strings in four families sized like the paper's (81, 45, 27, and 9). Distances are real TLSH; the files are not malware." }));
    root.appendChild(cutRow);
    root.appendChild(editRow);
    root.appendChild(status);
    root.appendChild(canvas);
    root.appendChild(famKey);
    root.appendChild(summary);
    root.appendChild(tableWrap);

    var FAM = Sim.FAMILIES.map(function (f) { return f.name; });
    function build() {
      if (building) return;
      building = true;
      status.textContent = "Building and hashing 162 simulated samples…";
      setTimeout(function () {
        S = Sim.build({ edit: edit });
        var digests = [], i = 0;
        (function step() {
          var t0 = Date.now();
          while (i < S.length && Date.now() - t0 < 40) { digests.push(E.hash(S[i].bytes)); i++; }
          if (i < S.length) { status.textContent = "Hashing simulated samples: " + i + " of " + S.length + "…"; setTimeout(step, 0); return; }
          var n = S.length, D = new Float64Array(n * n), max = 0;
          for (var a = 0; a < n; a++) for (var b = a + 1; b < n; b++) { var d = E.diff(digests[a], digests[b]); D[a * n + b] = D[b * n + a] = d; if (d > max) max = d; }
          A = { n: n, digests: digests, D: D, max: max };
          var bytes = 0; S.forEach(function (s) { bytes += s.bytes.length; });
          status.textContent = n + " samples, " + (bytes / 1048576).toFixed(1) + " MB hashed on this device; largest distance " + max + " (the paper's real binaries reached 1,112).";
          building = false;
          draw();
        })();
      }, 20);
    }
    function color(v, bg, fg) {
      return "rgb(" + [0, 1, 2].map(function (k) { return Math.round(bg[k] + (fg[k] - bg[k]) * v); }).join(",") + ")";
    }
    function draw() {
      if (!A) return;
      var n = A.n;
      var W = Math.min(chartWidth(canvas), 520), dpr = window.devicePixelRatio || 1;
      canvas.style.width = W + "px"; canvas.style.height = W + "px";
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(W * dpr);
      var ctx = canvas.getContext("2d");
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var bg = parseColor(cssVar("--background", "#ffffff")) || [255, 255, 255];
      var fg = parseColor(cssVar("--primary", "#1f6feb")) || [31, 111, 235];
      var ac = cssVar("--accent", "#d97706");
      var c = W / n;
      for (var i = 0; i < n; i++) for (var j = 0; j < n; j++) {
        var s = 1 - A.D[i * n + j] / A.max;
        ctx.fillStyle = color(s * s, bg, fg);
        ctx.fillRect(j * c, i * c, Math.ceil(c), Math.ceil(c));
      }
      // family bands and linked pairs
      var start = 0;
      ctx.strokeStyle = ac; ctx.lineWidth = 1.5;
      Sim.FAMILIES.forEach(function (f) { ctx.strokeRect(start * c + 0.5, start * c + 0.5, f.n * c - 1, f.n * c - 1); start += f.n; });
      var comps = Sim.components(A, cutoff);
      var big = comps.filter(function (m) { return m.length > 2; });
      var excluded = [0, 0, 0, 0];
      comps.filter(function (m) { return m.length <= 2; }).forEach(function (m) { m.forEach(function (k) { excluded[S[k].family]++; }); });
      famKey.innerHTML = "";
      start = 0;
      Sim.FAMILIES.forEach(function (f) {
        famKey.appendChild(el("span", { class: "tl-keyitem", text: f.name + " " + (start + 1) + "–" + (start + f.n) }));
        start += f.n;
      });
      famKey.appendChild(el("span", { class: "tl-keyitem tl-keynote", text: "Stronger color = more similar; outlined squares are families" }));
      var mixed = big.filter(function (m) { var f = S[m[0]].family; return m.some(function (k) { return S[k].family !== f; }); }).length;
      summary.innerHTML = "At a cutoff of <strong>" + cutoff + "</strong>: <strong>" + big.length + "</strong> clusters of three or more samples" +
        (mixed ? ", <strong>" + mixed + "</strong> of them mixing families" : ", each from a single family") +
        "; left out as groups of one or two: " + FAM.map(function (f, k) { return excluded[k] + " " + f; }).join(", ") + ". (The paper, at 100: eight clusters, none mixed; 3 Revil, 11 Darkside, and 11 WannaCry left out.)";
      tableWrap.innerHTML = "";
      if (atLeastUg()) {
        var tbl = el("table", { class: "results-table" });
        tbl.appendChild(el("caption", { text: "Simulated clusters, scaled like the paper (1 − distance/" + A.max + ", this set's largest distance); mean ± SD over each cluster's full matrix" }));
        tbl.appendChild(el("thead", {}, [el("tr", {}, [el("th", { text: "Cluster" }), el("th", { text: "Size" }), el("th", { text: "Families" }), el("th", { text: "TLSH similarity" }), el("th", { text: "Mean distance", "data-levels": "grad res" })])]));
        var tb = el("tbody");
        big.forEach(function (m, k) {
          var st = Sim.clusterStats(A, m, A.max);
          var f = [0, 0, 0, 0]; m.forEach(function (x) { f[S[x].family]++; });
          var mix = FAM.map(function (name, q) { return f[q] ? name + " " + f[q] : null; }).filter(Boolean).join(", ");
          tb.appendChild(el("tr", {}, [el("td", { text: String(k + 1) }), el("td", { class: "tl-num", text: String(m.length) }), el("td", { text: mix }), el("td", { class: "tl-num", text: fmt(st.mean, 4) + " ± " + fmt(st.sd, 4) }), el("td", { class: "tl-num", text: fmt(st.rawMean, 1), "data-levels": "grad res" })]));
        });
        tbl.appendChild(tb);
        tableWrap.appendChild(tbl);
      }
    }
    var started = false;
    function start() { if (!started) { started = true; build(); } }
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { start(); io.disconnect(); } }); }, { rootMargin: "300px" });
      io.observe(root);
    } else start();
    onChange(function (w) { if (w === "level") draw(); });
    resizers.push(draw);
    root.startNow = start;
  }

  /* ------------------------------------------------------------ demo 5: Table II */

  function mountTable(root) {
    var mode = "sim";
    var modeSeg = seg([{ value: "sim", label: "Similarity" }, { value: "diff", label: "Absolute difference" }], mode, function (v) { mode = v; draw(); }, "Show");
    var chart = svg("svg", { class: "tl-chart", role: "img" });
    var key = el("p", { class: "w-note" });
    var checks = el("div", { class: "tl-table-wrap", "data-levels": "grad res" });
    root.appendChild(labeled("Show", modeSeg));
    root.appendChild(chart);
    root.appendChild(key);
    root.appendChild(checks);

    function draw() {
      while (chart.firstChild) chart.removeChild(chart.firstChild);
      var W = chartWidth(chart), H = 250, L = 44, R = 10, T = 12, B = 46;
      chart.setAttribute("viewBox", "0 0 " + W + " " + H);
      chart.setAttribute("width", W); chart.setAttribute("height", H);
      var lo = mode === "sim" ? 0.5 : 0, hi = mode === "sim" ? 1.0 : 0.35;
      var y = function (v) { return T + (H - T - B) * (1 - (Math.max(lo, Math.min(hi, v)) - lo) / (hi - lo)); };
      var ticks = mode === "sim" ? [0.5, 0.6, 0.7, 0.8, 0.9, 1.0] : [0, 0.1, 0.2, 0.3];
      ticks.forEach(function (v) {
        chart.appendChild(svg("line", { class: "c-grid", x1: L, x2: W - R, y1: y(v), y2: y(v) }));
        chart.appendChild(svg("text", { class: "c-tick", x: L - 4, y: y(v) + 4, "text-anchor": "end" }, v.toFixed(1)));
      });
      var gw = (W - L - R) / 10;
      T2.forEach(function (r, i) {
        var cx = L + gw * (i + 0.5);
        chart.appendChild(svg("text", { class: "c-tick", x: cx, y: H - B + 15, "text-anchor": "middle" }, String(i + 1)));
        if (mode === "sim") {
          [[r[0], r[1], "tl-disco", -gw * 0.15, "@DisCo"], [r[2], r[3], "tl-tlsh", gw * 0.15, "TLSH"]].forEach(function (s) {
            var x = cx + s[3];
            var top = s[0] + s[1], bot = s[0] - s[1];
            chart.appendChild(svg("line", { class: s[2] + "-whisk", x1: x, x2: x, y1: y(top), y2: y(bot) }));
            if (top > hi) chart.appendChild(svg("text", { class: "c-tick", x: x, y: y(hi) - 2, "text-anchor": "middle" }, "▲"));
            if (bot < lo) chart.appendChild(svg("text", { class: "c-tick", x: x, y: y(lo) + 10, "text-anchor": "middle" }, "▼"));
            var dot = svg("circle", { class: s[2], cx: x, cy: y(s[0]), r: 4.5 });
            dot.appendChild(svg("title", {}, "Cluster " + (i + 1) + " (" + T2_FAMILY[i] + "), " + s[4] + ": " + s[0].toFixed(4) + " ± " + s[1].toFixed(4)));
            chart.appendChild(dot);
          });
        } else {
          var bw = gw * 0.5;
          var rect = svg("rect", { class: "tl-diffbar", x: cx - bw / 2, y: y(r[4]), width: bw, height: y(0) - y(r[4]) });
          rect.appendChild(svg("title", {}, "Cluster " + (i + 1) + " (" + T2_FAMILY[i] + "): " + r[4].toFixed(4) + " ± " + r[5].toFixed(4)));
          chart.appendChild(rect);
          chart.appendChild(svg("line", { class: "tl-tlsh-whisk", x1: cx, x2: cx, y1: y(r[4] + r[5]), y2: y(Math.max(0, r[4] - r[5])) }));
        }
      });
      chart.appendChild(svg("text", { class: "c-label", x: L + (W - L - R) / 2, y: H - 8, "text-anchor": "middle" }, "@DisCo cluster (Figure 3 numbering)"));
      chart.setAttribute("aria-label", mode === "sim" ? "Table II: mean @DisCo and scaled TLSH similarity per cluster with standard deviations" : "Table II: mean absolute difference between @DisCo and scaled TLSH similarity per cluster");
      key.innerHTML = mode === "sim" ?
        "Filled circle, accent color: @DisCo (function-level cosine similarity). Circle, primary color: scaled TLSH. Lines span ± one standard deviation; arrows mark lines cut off at the chart's edge. Values as printed in the paper." :
        "Mean absolute difference between the two scores within each cluster, ± one standard deviation, as printed.";

      // page checks (grad/res)
      checks.innerHTML = "";
      var tbl = el("table", { class: "results-table tl-wide" });
      tbl.appendChild(el("caption", { text: "Computed by this page from the printed table: where @DisCo is exactly 1.0000 ± 0.0000, the absolute difference must equal 1 − TLSH with the same SD; and (1 − TLSH) × 1,112 converts each TLSH mean back to an average raw distance, if the scaling used the global minimum 0 and maximum 1,112." }));
      tbl.appendChild(el("thead", {}, [el("tr", {}, [el("th", { text: "Cluster" }), el("th", { text: "Campaign" }), el("th", { text: "1 − TLSH" }), el("th", { text: "Printed diff" }), el("th", { text: "Match" }), el("th", { text: "Implied mean distance" })])]));
      var tb = el("tbody"), matches = 0, tested = 0;
      T2.forEach(function (r, i) {
        var exact = r[0] === 1 && r[1] === 0;
        var pred = 1 - r[2];
        var ok = exact ? (Math.abs(pred - r[4]) < 0.00005 && Math.abs(r[3] - r[5]) < 0.00005) : null;
        if (exact) { tested++; if (ok) matches++; }
        tb.appendChild(el("tr", exact ? { class: "on" } : {}, [
          el("td", { text: String(i + 1) }), el("td", { text: T2_FAMILY[i] }),
          el("td", { class: "tl-num", text: pred.toFixed(4) }), el("td", { class: "tl-num", text: r[4].toFixed(4) }),
          el("td", { text: exact ? (ok ? "yes (mean and SD)" : "no") : "not applicable" }),
          el("td", { class: "tl-num", text: fmt(pred * 1112, 1) })
        ]));
      });
      tbl.appendChild(tb);
      checks.appendChild(tbl);
      checks.appendChild(el("p", { class: "w-note", text: matches + " of " + tested + " testable rows match to the fourth decimal." }));
    }
    resizers.push(draw);
    draw();
  }

  /* ------------------------------------------------------------ mount */

  function mount(id, fn) {
    var node = document.getElementById(id);
    if (!node) return;
    node.classList.add("w-ready");
    fn(node);
  }
  mount("tl-hook", mountHook);
  mount("tl-mech", mountMech);
  mount("tl-dist", mountDist);
  mount("tl-pipe", mountPipe);
  mount("tl-table", mountTable);
})();

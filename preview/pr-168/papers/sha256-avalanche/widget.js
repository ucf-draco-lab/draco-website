/*
  SHA-256 avalanche widget for /papers/sha256-avalanche/.
  Mount points in the page: #sha-hash, #sha-parts, #sha-spread, #sha-measure, #sha-map.
  Every demo shares one set of sub-function switches (the knockout mask).
*/
(function () {
  "use strict";

  var E = window.SHA256SAC;
  if (!E) return;

  var SCRIPT_BASE = (document.currentScript && document.currentScript.src || "").replace(/[^/]*$/, "");
  var SVGNS = "http://www.w3.org/2000/svg";

  /* ---------------------------------------------------------------- data */

  var PARTS = [
    { id: "S1", sym: "Σ1", name: "Sigma 1", plain: "Mixer for word e",
      lay: "Stirs one word by rotating it three different ways and combining the copies.",
      tech: "Rotates register e by 6, 11, and 25 bits and XORs the copies into T1.",
      formula: "Σ1(e) = ROTR⁶(e) ⊕ ROTR¹¹(e) ⊕ ROTR²⁵(e)", off: "dropped from T1" },
    { id: "ADD", sym: "+", name: "Addition", plain: "Adding with carries",
      lay: "Adds numbers the long way, so a change in one bit can carry into the bits above it.",
      tech: "Every round combines words with addition mod 2³², whose carries move changes toward higher bits.",
      formula: "x + y mod 2³²", off: "every round addition and the final feed-forward become XOR" },
    { id: "CH", sym: "Ch", name: "Choose", plain: "Chooser",
      lay: "Uses one word as a switch that picks each bit from one of two other words.",
      tech: "Each bit of e selects the matching bit of f (when 1) or g (when 0).",
      formula: "Ch(e, f, g) = (e ∧ f) ⊕ (¬e ∧ g)", off: "dropped from T1" },
    { id: "SCHED", sym: "W", name: "Message schedule", plain: "Message stretcher",
      lay: "Stretches your 16 message words into 64, mixing them together as it goes.",
      tech: "Expands the 16 block words into the 64 round words with shifts, rotations, and additions.",
      formula: "Wₜ = σ1(Wₜ₋₂) + Wₜ₋₇ + σ0(Wₜ₋₁₅) + Wₜ₋₁₆", off: "block repeated four times (Wₜ = Wₜ mod 16)" },
    { id: "S0", sym: "Σ0", name: "Sigma 0", plain: "Mixer for word a",
      lay: "Stirs a different word the same way the first mixer does.",
      tech: "Rotates register a by 2, 13, and 22 bits and XORs the copies into T2.",
      formula: "Σ0(a) = ROTR²(a) ⊕ ROTR¹³(a) ⊕ ROTR²²(a)", off: "dropped from T2" },
    { id: "MAJ", sym: "Maj", name: "Majority", plain: "Majority vote",
      lay: "Looks at three words and keeps, bit by bit, whichever value appears at least twice.",
      tech: "Bitwise majority of registers a, b, and c.",
      formula: "Maj(a, b, c) = (a ∧ b) ⊕ (a ∧ c) ⊕ (b ∧ c)", off: "dropped from T2" },
    { id: "K", sym: "K", name: "Round constants", plain: "Fixed numbers",
      lay: "Adds a different fixed number in each of the 64 rounds.",
      tech: "Adds the round constant Kₜ (from the cube roots of the first 64 primes) to T1.",
      formula: "T1 += Kₜ", off: "dropped from T1" }
  ];
  PARTS.forEach(function (p) { p.bit = E.F[p.id]; });

  // Plateau rounds stated in the text of the 2026 paper (k = 1,000,000, Bonferroni band).
  var PAPER = {
    127: { plateau: 58, note: "First inside the band at round 23, outside at rounds 54 to 57 (SAC value 0.49728), and inside for good from round 58." },
    111: { plateau: 23 }, 119: { plateau: 23 }, 125: { plateau: 23 }, 123: { plateau: 23 },
    63: { plateau: 24 }, 126: { plateau: 25 }, 95: { plateau: 27 },
    64: { plateau: 40, note: "The only single sub-function that reaches SAC on its own." },
    33: { plateau: 25, note: "The earliest of the two-function combinations." },
    37: { plateau: 24, note: "The earliest of the three-function combinations." },
    101: { plateau: 23, note: "The earliest of the four-function combinations." },
    118: { plateau: 63, note: "The latest of the five-function combinations." }
  };
  [1, 2, 4, 8, 16, 32].forEach(function (m) { PAPER[m] = { plateau: null, note: "Never reaches SAC in the 2026 paper." }; });

  var PRESETS = [
    { label: "Full SHA-256", mask: 127 },
    { label: "Without Σ1", mask: 127 - E.F.S1 },
    { label: "Without +", mask: 127 - E.F.ADD },
    { label: "Schedule only", mask: E.F.SCHED },
    { label: "Mixers only", mask: E.F.S0 | E.F.S1 },
    { label: "Round constants only", mask: E.F.K }
  ];

  /* ---------------------------------------------------------------- state */

  var state = {
    mask: 127,
    level: window.PaperKit ? window.PaperKit.level() : "public",
    msgA: "DRACO Lab",
    msgB: "DRACO Lac",
    bit: 88,
    round: 64,
    playing: null,
    pre: null,          // precomputed k = 256 summaries for all 127 combinations
    live: null,         // {mask, k, summary} from a browser run
    running: false,
    worker: null,
    runK: 256,
    heatRound: 24,
    mapFilter: "S1"
  };

  var listeners = [];
  function onMask(fn) { listeners.push(fn); }
  function setMask(mask) {
    mask = mask & 127;
    if (mask === 0) return;
    state.mask = mask;
    listeners.forEach(function (fn) { fn(); });
  }

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

  function svg(tag, attrs) {
    var node = document.createElementNS(SVGNS, tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { node.setAttribute(k, attrs[k]); });
    return node;
  }

  // Chart width follows the container so 11px labels stay 11px on phones.
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

  function pct(x, d) { return (100 * x).toFixed(d === undefined ? 1 : d) + "%"; }
  function popcount(words) { var n = 0; for (var i = 0; i < words.length; i++) n += E.popcount(words[i]); return n; }
  function sizeOf(mask) { var n = 0; for (var b = 0; b < 7; b++) if (mask & (1 << b)) n++; return n; }
  function maskNames(mask) {
    return PARTS.filter(function (p) { return mask & p.bit; }).map(function (p) { return p.sym; });
  }
  function maskLabel(mask) {
    if (mask === 127) return "full SHA-256";
    var off = PARTS.filter(function (p) { return !(mask & p.bit); }).map(function (p) { return p.sym; });
    var on = maskNames(mask);
    return on.length <= 3 ? "only " + on.join(", ") : "without " + off.join(", ");
  }

  // Bonferroni band for k samples and the first and settled rounds inside it.
  function bandStats(summary, k) {
    var b = E.band(k), first = null, plateau = null;
    for (var r = 0; r < summary.length; r++) {
      var s = summary[r];
      var sac = (0.5 - s.min) >= (s.max - 0.5) ? s.min : s.max;
      var inside = Math.abs(sac - 0.5) <= b;
      if (inside && first === null) first = r + 1;
      if (inside && plateau === null) plateau = r + 1;
      if (!inside) plateau = null;
    }
    return { band: b, first: first, plateau: plateau };
  }

  function preSummary(mask) {
    if (!state.pre) return null;
    var c = state.pre.combos[String(mask)];
    if (!c) return null;
    return c.mean.map(function (m, i) { return { round: i + 1, mean: m, min: c.min[i], max: c.max[i] }; });
  }

  function hexDiff(a, b, into) {
    into.textContent = "";
    for (var i = 0; i < b.length; i++) {
      var ch = b[i];
      if (a[i] !== ch) into.appendChild(el("mark", { text: ch }));
      else into.appendChild(document.createTextNode(ch));
    }
  }

  function bitGrid(container, count, cols, cls) {
    container.textContent = "";
    container.style.setProperty("--cols", cols);
    var cells = [];
    for (var i = 0; i < count; i++) {
      var c = el("span", { class: "bit " + (cls || "") });
      container.appendChild(c);
      cells.push(c);
    }
    return cells;
  }

  // Output bit j of 8 words, most significant bit of word 0 first.
  function bitOf(words, j) { return (words[j >>> 5] >>> (31 - (j & 31))) & 1; }

  /* ---------------------------------------------------------------- demo 1: one letter */

  function mountHash(root) {
    var inA = el("input", { type: "text", id: "sha-msg-a", value: state.msgA, spellcheck: "false", autocomplete: "off", "aria-describedby": "sha-msg-help" });
    var inB = el("input", { type: "text", id: "sha-msg-b", value: state.msgB, spellcheck: "false", autocomplete: "off" });
    var hexA = el("code", { class: "hex" }), hexB = el("code", { class: "hex hex-b" });
    var grid = el("div", { class: "bitgrid bitgrid-256", role: "img", "aria-label": "Output bits that changed" });
    var cells = bitGrid(grid, 256, 16);
    var count = el("strong"), pctEl = el("span"), stat = el("span", { "data-levels": "grad res" });
    var maskNote = el("p", { class: "w-note mask-note" });

    function randomLetterChange() {
      var src = inA.value || "DRACO Lab";
      var idx = [], i;
      for (i = 0; i < src.length; i++) if (/[A-Za-z]/.test(src[i])) idx.push(i);
      if (!idx.length) { inB.value = src + "a"; update(); return; }
      var at = idx[Math.floor(Math.random() * idx.length)];
      var letters = "abcdefghijklmnopqrstuvwxyz", cur = src[at], next = cur;
      while (next.toLowerCase() === cur.toLowerCase()) next = letters[Math.floor(Math.random() * 26)];
      if (cur === cur.toUpperCase()) next = next.toUpperCase();
      inB.value = src.slice(0, at) + next + src.slice(at + 1);
      update();
    }

    function update() {
      state.msgA = inA.value;
      state.msgB = inB.value;
      var hA = E.hash(state.msgA, state.mask), hB = E.hash(state.msgB, state.mask);
      var xA = E.hex(hA), xB = E.hex(hB);
      hexA.textContent = xA;
      hexDiff(xA, xB, hexB);
      var diff = 0;
      for (var j = 0; j < 256; j++) {
        var d = bitOf(hA, j) !== bitOf(hB, j);
        cells[j].classList.toggle("on", d);
        if (d) diff++;
      }
      grid.setAttribute("aria-label", diff + " of 256 output bits changed");
      count.textContent = diff + " of 256";
      pctEl.textContent = " fingerprint bits changed (" + pct(diff / 256) + ")";
      var z = (diff - 128) / 8;
      stat.textContent = " · Hamming distance " + diff + ", " + (z >= 0 ? "+" : "") + z.toFixed(2) + " standard deviations from the 128 expected for 256 fair coins";
      maskNote.textContent = state.mask === 127 ? "" :
        "Running " + maskLabel(state.mask) + " (" + sizeOf(state.mask) + " of 7 parts). Switch parts back on in the panel below.";
      maskNote.hidden = state.mask === 127;
      document.dispatchEvent(new CustomEvent("sha-messages"));
    }

    inA.addEventListener("input", update);
    inB.addEventListener("input", update);

    root.appendChild(el("div", { class: "w-fields" }, [
      el("label", { for: "sha-msg-a" }, [el("span", { text: "Message A" }), inA]),
      el("label", { for: "sha-msg-b" }, [el("span", { text: "Message B" }), inB])
    ]));
    root.appendChild(el("p", { id: "sha-msg-help", class: "w-note" }, [
      el("span", { "data-levels": "public hs", text: "Type anything. Message B starts one letter away from Message A." }),
      el("span", { "data-levels": "ug grad res", text: "Defaults differ in one character, b (0x62) versus c (0x63): a single flipped input bit." })
    ]));
    root.appendChild(el("div", { class: "w-actions" }, [
      el("button", { type: "button", class: "w-btn", text: "Change one letter", onclick: randomLetterChange }),
      el("button", { type: "button", class: "w-btn w-btn-quiet", text: "Reset", onclick: function () {
        inA.value = "DRACO Lab"; inB.value = "DRACO Lac"; update(); } })
    ]));
    root.appendChild(el("dl", { class: "w-hexes" }, [
      el("dt", { text: "Fingerprint A" }), el("dd", {}, [hexA]),
      el("dt", { text: "Fingerprint B" }), el("dd", {}, [hexB])
    ]));
    root.appendChild(el("div", { class: "w-split" }, [
      grid,
      el("div", { class: "w-readout" }, [
        el("p", { class: "w-big" }, [count, pctEl, stat]),
        el("p", { class: "w-note" }, [
          el("span", { "data-levels": "public hs", text: "Each square is one bit of the fingerprint. Lit squares flipped between A and B. A good hash lights about half of them, in no pattern you could predict." }),
          el("span", { "data-levels": "ug grad res", text: "Each cell is one of the 256 output bits (row-major, most significant bit of H₀ first). Lit cells differ between the two digests." })
        ]),
        maskNote
      ])
    ]));

    onMask(update);
    update();
  }

  /* ---------------------------------------------------------------- the seven parts */

  function mountParts(root) {
    var rows = [];
    var summary = el("p", { class: "w-note parts-summary" });
    var presetBar = el("div", { class: "w-actions parts-presets" });

    PRESETS.forEach(function (p) {
      presetBar.appendChild(el("button", { type: "button", class: "w-btn w-btn-quiet", "data-mask": p.mask, text: p.label,
        onclick: function () { setMask(p.mask); } }));
    });

    var list = el("ul", { class: "parts" });
    PARTS.forEach(function (p) {
      var box = el("input", { type: "checkbox", id: "part-" + p.id, checked: "checked" });
      box.addEventListener("change", function () {
        var next = box.checked ? (state.mask | p.bit) : (state.mask & ~p.bit);
        if (next === 0) { box.checked = true; summary.textContent = "At least one part has to stay on."; return; }
        setMask(next);
      });
      var li = el("li", { class: "part" }, [
        el("label", { for: "part-" + p.id, class: "part-switch" }, [box, el("span", { class: "part-track", "aria-hidden": "true" })]),
        el("span", { class: "part-sym", text: p.sym, "aria-hidden": "true" }),
        el("div", { class: "part-text" }, [
          el("label", { for: "part-" + p.id, class: "part-name" }, [
            el("span", { "data-levels": "public hs", text: p.plain }),
            el("span", { "data-levels": "ug grad res", text: p.name + " (" + p.sym + ")" })
          ]),
          el("span", { class: "part-desc", "data-levels": "public hs", text: p.lay }),
          el("span", { class: "part-desc", "data-levels": "ug", text: p.tech }),
          el("span", { class: "part-desc part-formula", "data-levels": "grad res", text: p.formula + "  ·  off: " + p.off })
        ])
      ]);
      list.appendChild(li);
      rows.push({ part: p, box: box, li: li });
    });

    root.appendChild(presetBar);
    root.appendChild(list);
    root.appendChild(summary);

    function sync() {
      rows.forEach(function (r) {
        var on = !!(state.mask & r.part.bit);
        r.box.checked = on;
        r.li.classList.toggle("off", !on);
      });
      presetBar.querySelectorAll("button").forEach(function (b) {
        b.setAttribute("aria-pressed", String(+b.getAttribute("data-mask") === state.mask));
      });
      var n = sizeOf(state.mask);
      summary.textContent = "";
      summary.appendChild(el("span", { "data-levels": "public hs",
        text: n === 7 ? "All seven parts are on: this is real SHA-256." : n + " of 7 parts are on. Every demo on this page now runs this weakened version." }));
      summary.appendChild(el("span", { "data-levels": "ug grad res",
        text: "Combination " + maskLabel(state.mask) + ": size " + n + " of 7, one of the 127 non-empty combinations in the 2026 study (mask " + state.mask + ")." }));
    }
    onMask(sync);
    sync();
  }

  /* ---------------------------------------------------------------- demo 2: watch it spread */

  function mountSpread(root) {
    var regGrid = el("div", { class: "bitgrid bitgrid-reg", role: "img" });
    var regCells = bitGrid(regGrid, 256, 32);
    var labels = el("div", { class: "reg-labels", "aria-hidden": "true" });
    "abcdefgh".split("").forEach(function (r) { labels.appendChild(el("span", { text: r })); });

    var msgGrid = el("div", { class: "bitgrid bitgrid-msg", role: "group", "aria-label": "Message block bits; select one to flip" });
    var msgCells = [];
    for (var i = 0; i < 512; i++) {
      (function (idx) {
        var b = el("button", { type: "button", class: "bit", "aria-label": "Flip word " + (idx >>> 5) + " bit " + (idx & 31),
          onclick: function () { state.bit = idx; stopPlay(); state.round = 64; render(); } });
        msgGrid.appendChild(b);
        msgCells.push(b);
      })(i);
    }
    msgGrid.style.setProperty("--cols", 32);

    var roundIn = el("input", { type: "range", min: "1", max: "64", value: "64", id: "sha-round", "aria-label": "Round" });
    var playBtn = el("button", { type: "button", class: "w-btn", text: "Play rounds 1 to 64" });
    var bitLabel = el("span", { class: "w-mono" });
    var readout = el("p", { class: "w-big" });
    var curve = svg("svg", { viewBox: "0 0 640 166", class: "spread-curve", role: "img", "aria-label": "Changed state bits per round" });
    var explain = el("p", { class: "w-note" });

    var base = new Uint32Array(512), alt = new Uint32Array(512), counts = [];

    function block() {
      var blocks = E.pad(E.utf8(state.msgA));
      return blocks[0];
    }

    function compute() {
      var b = block();
      E.compress(b, E.IV, state.mask, base);
      E.compress(E.flipBit(b, state.bit), E.IV, state.mask, alt);
      counts = [];
      for (var r = 0; r < 64; r++) {
        var n = 0;
        for (var w = 0; w < 8; w++) n += E.popcount(base[r * 8 + w] ^ alt[r * 8 + w]);
        counts.push(n);
      }
      return b;
    }

    function drawCurve() {
      curve.textContent = "";
      var W = chartWidth(curve), H = 150, L = 34, R = 8, T = 10, B = 24;
      curve.setAttribute("viewBox", "0 0 " + W + " " + (H + 16));
      var x = function (r) { return L + (r - 1) * (W - L - R) / 63; };
      var y = function (v) { return T + (1 - v / 256) * (H - T - B); };
      curve.appendChild(svg("line", { x1: L, x2: W - R, y1: y(128), y2: y(128), class: "c-ref" }));
      var xt = svg("text", { x: (L + W - R) / 2, y: H + 12, class: "c-label", "text-anchor": "middle" });
      xt.textContent = "round";
      curve.appendChild(xt);
      var t = svg("text", { x: W - R, y: y(128) - 4, class: "c-label", "text-anchor": "end" });
      t.textContent = "128 = half";
      curve.appendChild(t);
      [0, 128, 256].forEach(function (v) {
        var lab = svg("text", { x: L - 6, y: y(v) + 4, class: "c-tick", "text-anchor": "end" });
        lab.textContent = v;
        curve.appendChild(lab);
      });
      [1, 16, 32, 48, 64].forEach(function (r) {
        var lab = svg("text", { x: x(r), y: H - 6, class: "c-tick", "text-anchor": "middle" });
        lab.textContent = r;
        curve.appendChild(lab);
      });
      var d = counts.map(function (n, i) { return (i ? "L" : "M") + x(i + 1).toFixed(1) + " " + y(n).toFixed(1); }).join(" ");
      curve.appendChild(svg("path", { d: d, class: "c-line" }));
      curve.appendChild(svg("line", { x1: x(state.round), x2: x(state.round), y1: T, y2: H - B, class: "c-cursor" }));
      curve.appendChild(svg("circle", { cx: x(state.round), cy: y(counts[state.round - 1]), r: 4, class: "c-dot" }));
    }

    function render() {
      var b = compute();
      var r = state.round, n = counts[r - 1];
      for (var j = 0; j < 256; j++) {
        var w = j >>> 5, bit = 31 - (j & 31);
        regCells[j].classList.toggle("on", !!(((base[(r - 1) * 8 + w] ^ alt[(r - 1) * 8 + w]) >>> bit) & 1));
      }
      regGrid.setAttribute("aria-label", "After round " + r + ", " + n + " of 256 state bits differ");
      for (var i = 0; i < 512; i++) {
        msgCells[i].classList.toggle("on", !!((b[i >>> 5] >>> (i & 31)) & 1));
        msgCells[i].classList.toggle("sel", i === state.bit);
      }
      roundIn.value = r;
      var word = state.bit >>> 5, pos = state.bit & 31;
      bitLabel.textContent = "Flipped bit " + state.bit + " (word W" + word + ", bit " + pos + ")";
      readout.textContent = "Round " + r + ": " + n + " of 256 state bits differ (" + pct(n / 256) + ")";
      var firstMove = counts.findIndex(function (c) { return c > 0; }) + 1;
      var halfAt = counts.findIndex(function (c) { return c >= 100; }) + 1;
      var parts = [];
      if (firstMove > 0) parts.push("The change first reaches the state in round " + firstMove + ".");
      else parts.push("With these parts switched off, the flipped bit never reaches the state.");
      if (halfAt > 0) parts.push("By round " + halfAt + ", at least 100 of 256 bits differ.");
      else if (firstMove > 0) parts.push("The difference never spreads to 100 of 256 bits.");
      if (word > 0 && firstMove === word + 1) parts.push("Word W" + word + " does not enter the rounds until round " + (word + 1) + ", which is why nothing moves before then.");
      explain.textContent = parts.join(" ");
      drawCurve();
    }

    function stopPlay() {
      if (state.playing) { clearInterval(state.playing); state.playing = null; playBtn.textContent = "Play rounds 1 to 64"; }
    }

    playBtn.addEventListener("click", function () {
      if (state.playing) { stopPlay(); return; }
      state.round = 1;
      render();
      playBtn.textContent = "Pause";
      var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      state.playing = setInterval(function () {
        if (state.round >= 64) { stopPlay(); return; }
        state.round++;
        render();
      }, reduce ? 250 : 110);
    });

    roundIn.addEventListener("input", function () { stopPlay(); state.round = +roundIn.value; render(); });

    var randomBtn = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "Flip a different bit", onclick: function () {
      stopPlay(); state.bit = Math.floor(Math.random() * 512); state.round = 64; render(); } });

    root.appendChild(el("div", { class: "w-actions" }, [playBtn, randomBtn, bitLabel]));
    root.appendChild(el("label", { class: "w-range", for: "sha-round" }, [el("span", { text: "Round" }), roundIn]));
    root.appendChild(el("div", { class: "reg-wrap" }, [labels, regGrid]));
    root.appendChild(readout);
    root.appendChild(curve);
    root.appendChild(explain);
    root.appendChild(el("details", { class: "w-details", "data-levels": "ug grad res" }, [
      el("summary", { text: "Pick the input bit yourself (the 512-bit block of Message A)" }),
      el("p", { class: "w-note", text: "Rows are the 16 message words W0 to W15, bit 0 at the left. Lit cells are 1 bits; the outlined cell is the bit being flipped. Click any cell to flip that bit instead. The block includes SHA-256 padding." }),
      msgGrid
    ]));

    // Follow the one-bit difference between Message A and B when there is one.
    document.addEventListener("sha-messages", function () {
      var a = E.pad(E.utf8(state.msgA))[0], b = E.pad(E.utf8(state.msgB))[0], diffBit = -1, n = 0;
      for (var i = 0; i < 512; i++) {
        if (((a[i >>> 5] ^ b[i >>> 5]) >>> (i & 31)) & 1) { n++; diffBit = i; }
      }
      if (n === 1) state.bit = diffBit;
      if (!state.playing) render();
    });
    onMask(function () { stopPlay(); render(); });
    resizers.push(drawCurve);
    render();
  }

  /* ---------------------------------------------------------------- demo 3: measure SAC */

  function mountMeasure(root) {
    var chart = svg("svg", { viewBox: "0 0 640 316", class: "sac-chart", role: "img", "aria-label": "Avalanche statistics per round" });
    var source = el("p", { class: "w-note w-source" });
    var result = el("div", { class: "sac-result" });
    var progress = el("progress", { max: "1", value: "0", hidden: "" });
    var runBtn = el("button", { type: "button", class: "w-btn", text: "Run it in my browser" });
    var kBar = el("div", { class: "k-options", role: "radiogroup", "aria-label": "Number of random messages" });
    var KS = [
      { k: 64, levels: "public hs ug grad res" },
      { k: 256, levels: "public hs ug grad res" },
      { k: 1024, levels: "ug grad res" },
      { k: 4096, levels: "grad res" }
    ];
    KS.forEach(function (o) {
      kBar.appendChild(el("button", { type: "button", role: "radio", class: "k-option", "data-k": o.k, "data-levels": o.levels,
        "aria-checked": String(o.k === state.runK), text: o.k.toLocaleString() + " messages",
        onclick: function () { state.runK = o.k; syncK(); } }));
    });
    function syncK() {
      kBar.querySelectorAll(".k-option").forEach(function (b) { b.setAttribute("aria-checked", String(+b.getAttribute("data-k") === state.runK)); });
      var cost = state.runK * 513;
      runBtn.textContent = "Run " + state.runK.toLocaleString() + " messages in my browser";
      runBtn.title = cost.toLocaleString() + " compression-function calls";
    }

    var heatWrap = el("div", { class: "heat", "data-levels": "grad res", hidden: "" });
    var heatCanvas = el("canvas", { width: "512", height: "256", class: "heat-canvas", role: "img" });
    var heatRound = el("input", { type: "range", min: "1", max: "64", value: String(state.heatRound), id: "sha-heat-round", "aria-label": "Round for the dependency matrix" });
    var heatLabel = el("span", { class: "w-mono" });
    heatWrap.appendChild(el("h3", { text: "The full dependency matrix from your run" }));
    heatWrap.appendChild(el("p", { class: "w-note", text: "Columns are the 512 input bits, rows the 256 state bits. Neutral cells sit at the ideal one half; brighter cells sit farther from it (one color below one half, the other above). Early rounds show the structure of the round function; by the mid-20s the matrix turns to uniform noise." }));
    heatWrap.appendChild(el("label", { class: "w-range", for: "sha-heat-round" }, [el("span", { text: "Round" }), heatRound, heatLabel]));
    heatWrap.appendChild(heatCanvas);

    root.appendChild(chart);
    root.appendChild(source);
    root.appendChild(result);
    root.appendChild(el("div", { class: "w-actions" }, [runBtn, kBar]));
    root.appendChild(progress);
    root.appendChild(el("p", { class: "w-note", "data-levels": "ug grad res",
      text: "Each message costs 513 compression-function calls (the original plus one per flipped input bit), and every call is checked at all 64 rounds. Phones take longer than laptops; the run stops whenever you press the button again." }));
    root.appendChild(heatWrap);

    function current() {
      if (state.live && state.live.mask === state.mask) return state.live;
      var pre = preSummary(state.mask);
      return pre ? { mask: state.mask, k: state.pre.k, summary: pre, pre: true } : null;
    }

    function draw() {
      var data = current();
      chart.textContent = "";
      var W = chartWidth(chart), H = W < 480 ? 260 : 300, L = 44, R = 12, T = 14, B = 30;
      chart.setAttribute("viewBox", "0 0 " + W + " " + (H + 16));
      var x = function (r) { return L + (r - 1) * (W - L - R) / 63; };
      var y = function (v) { return T + (1 - v) * (H - T - B); };
      var xt = svg("text", { x: (L + W - R) / 2, y: H + 12, class: "c-label", "text-anchor": "middle" });
      xt.textContent = "round";
      chart.appendChild(xt);

      // axes and ticks
      [0, 0.25, 0.5, 0.75, 1].forEach(function (v) {
        chart.appendChild(svg("line", { x1: L, x2: W - R, y1: y(v), y2: y(v), class: v === 0.5 ? "c-ref" : "c-grid" }));
        var t = svg("text", { x: L - 6, y: y(v) + 4, class: "c-tick", "text-anchor": "end" });
        t.textContent = v === 0.5 ? "½" : String(v);
        chart.appendChild(t);
      });
      [1, 8, 16, 24, 32, 40, 48, 56, 64].forEach(function (r) {
        var t = svg("text", { x: x(r), y: H - 10, class: "c-tick", "text-anchor": "middle" });
        t.textContent = r;
        chart.appendChild(t);
      });
      var yl = svg("text", { x: L + 4, y: T + 10, class: "c-label" });
      yl.textContent = "flip rate";
      chart.appendChild(yl);

      if (!data) {
        source.textContent = "Loading the precomputed curves…";
        return;
      }
      var s = data.summary, k = data.k, st = bandStats(s, k);

      // Bonferroni band (graduate and researcher views)
      var bandG = svg("g", { "data-levels": "grad res" });
      bandG.appendChild(svg("rect", { x: L, width: W - L - R, y: y(0.5 + st.band), height: y(0.5 - st.band) - y(0.5 + st.band), class: "c-band" }));
      chart.appendChild(bandG);

      // paper markers for this combination
      var paper = PAPER[state.mask];
      if (paper && paper.plateau) {
        var pg = svg("g", { "data-levels": "ug grad res" });
        pg.appendChild(svg("line", { x1: x(paper.plateau), x2: x(paper.plateau), y1: T, y2: H - B, class: "c-paper" }));
        var pt = svg("text", { x: x(paper.plateau) + (paper.plateau > 52 ? -4 : 4), y: T + 12, class: "c-label c-paper-label", "text-anchor": paper.plateau > 52 ? "end" : "start" });
        pt.textContent = "paper: settles at " + paper.plateau;
        pg.appendChild(pt);
        chart.appendChild(pg);
      }

      function path(key) {
        return s.map(function (row, i) { return (i ? "L" : "M") + x(i + 1).toFixed(1) + " " + y(row[key]).toFixed(1); }).join(" ");
      }
      var mm = svg("g", { "data-levels": "hs ug grad res" });
      mm.appendChild(svg("path", { d: path("min"), class: "c-min" }));
      mm.appendChild(svg("path", { d: path("max"), class: "c-max" }));
      chart.appendChild(mm);
      chart.appendChild(svg("path", { d: path("mean"), class: "c-mean" }));

      if (st.first) {
        var fg = svg("g", { "data-levels": "ug grad res" });
        fg.appendChild(svg("circle", { cx: x(st.first), cy: y(0.5), r: 5, class: "c-dot" }));
        chart.appendChild(fg);
      }

      // legend
      var lg = el("p", { class: "c-legend" }, [
        el("span", { class: "lg lg-mean", text: "average bit" }),
        el("span", { class: "lg lg-min", "data-levels": "hs ug grad res", text: "least-flipped bit" }),
        el("span", { class: "lg lg-max", "data-levels": "hs ug grad res", text: "most-flipped bit" }),
        el("span", { class: "lg lg-band", "data-levels": "grad res", text: "Bonferroni band for this k" }),
        el("span", { class: "lg lg-paper", "data-levels": "ug grad res", text: "paper (k = 1,000,000)" })
      ]);

      var who = data.pre ? "Precomputed with this page's engine" : "Computed in your browser";
      source.textContent = "";
      source.appendChild(document.createTextNode(who + ": " + maskLabel(state.mask) + ", k = " + k.toLocaleString() + " random messages. The papers used k = 1,000,000."));
      source.appendChild(lg);

      result.textContent = "";
      var meanR = s.findIndex(function (row) { return Math.abs(row.mean - 0.5) <= 0.01; }) + 1;
      var r64 = s[63];
      result.appendChild(el("p", { "data-levels": "public",
        text: meanR > 0 ? "By round " + meanR + ", an average fingerprint bit flips about half the time. SHA-256 runs 64 rounds, so it keeps mixing for " + (64 - meanR) + " more."
          : "With these parts switched off, the average bit never reaches half. The mixing never finishes." }));
      result.appendChild(el("p", { "data-levels": "hs",
        text: meanR > 0 ? "Average bit reaches 50% (±1%) by round " + meanR + ". After round 64, the least-flipped bit flips " + pct(r64.min) + " of the time and the most-flipped bit " + pct(r64.max) + "."
          : "The average bit never gets within 1% of 50%. After round 64 it sits at " + pct(r64.mean) + "." }));
      result.appendChild(el("p", { "data-levels": "ug grad res",
        text: (st.first ? "Every one of the 131,072 matrix cells falls inside the acceptance band from round " + st.first + (st.plateau && st.plateau !== st.first ? "; it settles there for good at round " + st.plateau : "") + "."
          : "The matrix never fits inside the acceptance band.") +
          " Band at k = " + k.toLocaleString() + ": ½ ± " + pct(st.band, 2) + "." +
          (paper ? (paper.plateau ? " Paper (band ½ ± 0.27%): settles at round " + paper.plateau + "." : "") + (paper.note ? " " + paper.note : "") : "") }));
      result.appendChild(el("p", { class: "w-note", "data-levels": "grad res",
        text: "The band narrows as k grows (it scales with 1/√k), so a small run passes earlier than the paper's million-message run. The SAC-mean is far less sensitive to k because it averages all 131,072 cells." }));
    }

    function finishRun() {
      state.running = false;
      runBtn.classList.remove("running");
      syncK();
      progress.hidden = true;
    }

    function requestHeat() {
      if (!state.worker || !state.live) return;
      state.worker.postMessage({ type: "matrix", round: state.heatRound });
    }

    function themeColor(name, fallback) {
      var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      var m = /^#([0-9a-f]{6})$/i.exec(v);
      if (!m) return fallback;
      var n = parseInt(m[1], 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }

    function paintHeat(data, round) {
      var ctx = heatCanvas.getContext("2d");
      var img = ctx.createImageData(512, 256);
      var lo = themeColor("--primary", [96, 165, 250]), hi = themeColor("--accent", [34, 211, 238]),
          mid = themeColor("--background-alt", [12, 26, 54]);
      // data is 512 rows (input bits) x 256 columns (state bits); draw input bits as columns
      for (var i = 0; i < 512; i++) {
        for (var j = 0; j < 256; j++) {
          var v = data[(i << 8) + j] / 255, d = Math.min(1, Math.abs(v - 0.5) * 2), c = v < 0.5 ? lo : hi;
          var o = ((j * 512) + i) * 4;
          img.data[o] = mid[0] + (c[0] - mid[0]) * d;
          img.data[o + 1] = mid[1] + (c[1] - mid[1]) * d;
          img.data[o + 2] = mid[2] + (c[2] - mid[2]) * d;
          img.data[o + 3] = 255;
        }
      }
      ctx.putImageData(img, 0, 0);
      heatLabel.textContent = "Round " + round;
      heatCanvas.setAttribute("aria-label", "Dependency matrix after round " + round);
    }

    function startWorker() {
      try {
        var w = new Worker(SCRIPT_BASE + "sac-worker.js");
        w.onmessage = function (ev) {
          var m = ev.data;
          if (m.type === "matrix") { paintHeat(m.data, m.round); return; }
          if (m.summary) state.live = { mask: state.runMask, k: m.k, summary: m.summary };
          progress.value = m.k / m.total;
          if (m.type === "progress") runBtn.textContent = "Stop (" + m.k.toLocaleString() + " of " + m.total.toLocaleString() + ")";
          draw();
          if (m.type === "done" || m.type === "stopped") {
            finishRun();
            if (state.live && state.live.mask === state.mask) { heatWrap.hidden = false; requestHeat(); }
          }
        };
        w.onerror = function () { state.worker = null; finishRun(); source.textContent = "This browser blocked the background worker, so the live run is unavailable. The precomputed curves above still apply."; };
        return w;
      } catch (err) { return null; }
    }

    runBtn.addEventListener("click", function () {
      if (state.running) { if (state.worker) state.worker.postMessage({ type: "stop" }); return; }
      if (!state.worker) state.worker = startWorker();
      if (!state.worker) { source.textContent = "This browser cannot run the measurement in the background."; return; }
      state.running = true;
      state.runMask = state.mask;
      state.live = null;
      progress.hidden = false;
      progress.value = 0;
      runBtn.classList.add("running");
      runBtn.textContent = "Starting…";
      state.worker.postMessage({ type: "run", mask: state.mask, k: state.runK });
    });

    heatRound.addEventListener("input", function () { state.heatRound = +heatRound.value; requestHeat(); });

    onMask(function () {
      if (state.running && state.worker) state.worker.postMessage({ type: "stop" });
      heatWrap.hidden = !(state.live && state.live.mask === state.mask);
      draw();
    });
    document.addEventListener("sha-pre", draw);
    resizers.push(draw);
    syncK();
    draw();
  }

  /* ---------------------------------------------------------------- demo 4: all 127 combinations */

  function mountMap(root) {
    var filter = el("div", { class: "k-options map-filter", role: "radiogroup", "aria-label": "Highlight combinations that contain" });
    PARTS.forEach(function (p) {
      filter.appendChild(el("button", { type: "button", role: "radio", class: "k-option", "data-part": p.id, text: p.sym,
        "aria-checked": String(p.id === state.mapFilter), onclick: function () { state.mapFilter = p.id; draw(); } }));
    });
    var plot = svg("svg", { viewBox: "0 0 640 300", class: "map-chart", role: "img",
      "aria-label": "First round inside the acceptance band for each of the 127 combinations, by combination size" });
    var note = el("p", { class: "w-note" });

    root.appendChild(el("div", { class: "w-actions" }, [el("span", { class: "w-mono", text: "Highlight combinations containing" }), filter]));
    root.appendChild(plot);
    root.appendChild(note);

    function draw() {
      filter.querySelectorAll(".k-option").forEach(function (b) { b.setAttribute("aria-checked", String(b.getAttribute("data-part") === state.mapFilter)); });
      plot.textContent = "";
      if (!state.pre) { note.textContent = "Loading…"; return; }
      var W = chartWidth(plot), H = 310, L = 40, R = 60, T = 28, B = 52;
      plot.setAttribute("viewBox", "0 0 " + W + " " + H);
      var x = function (r) { return L + (r - 1) * (W - L - R) / 63; };
      var xNever = W - R + 30;
      var y = function (size) { return T + (size - 1) * (H - T - B) / 6; };
      for (var s = 1; s <= 7; s++) {
        plot.appendChild(svg("line", { x1: L, x2: W - 8, y1: y(s), y2: y(s), class: "c-grid" }));
        var t = svg("text", { x: L - 8, y: y(s) + 4, class: "c-tick", "text-anchor": "end" });
        t.textContent = s;
        plot.appendChild(t);
      }
      [1, 16, 32, 48, 64].forEach(function (r) {
        var t = svg("text", { x: x(r), y: H - 30, class: "c-tick", "text-anchor": "middle" });
        t.textContent = r;
        plot.appendChild(t);
      });
      var nv = svg("text", { x: xNever, y: H - 30, class: "c-tick", "text-anchor": "middle" });
      nv.textContent = "never";
      plot.appendChild(nv);
      plot.appendChild(svg("line", { x1: W - R + 12, x2: W - R + 12, y1: T - 6, y2: H - B + 6, class: "c-grid" }));
      var ax = svg("text", { x: (L + W - R) / 2, y: H - 8, class: "c-label", "text-anchor": "middle" });
      ax.textContent = "first round inside the band (k = 256)";
      var ay = svg("text", { x: 4, y: 12, class: "c-label" });
      ay.textContent = "combination size";
      plot.appendChild(ay);

      var bit = E.F[state.mapFilter], countIn = 0, withPart = [], without = [];
      var bySlot = {};
      for (var m = 1; m <= 127; m++) {
        var st = bandStats(preSummary(m), state.pre.k);
        var size = sizeOf(m), first = st.first;
        var key = size + ":" + (first || "n");
        var slot = bySlot[key] = (bySlot[key] || 0) + 1;
        var jitter = ((slot % 5) - 2) * 4.2;
        var cx = first ? x(first) : xNever, cy = y(size) + jitter;
        var has = !!(m & bit);
        if (first) (has ? withPart : without).push(first);
        var dot = svg("circle", { cx: cx.toFixed(1), cy: cy.toFixed(1), r: m === state.mask ? 6 : 4,
          class: "map-dot" + (has ? " has" : "") + (m === state.mask ? " current" : ""), tabindex: "0", role: "button" });
        var tt = svg("title");
        tt.textContent = maskLabel(m) + " (size " + size + "): " + (first ? "inside the band from round " + first : "never inside the band");
        dot.appendChild(tt);
        (function (mm) {
          dot.addEventListener("click", function () { setMask(mm); });
          dot.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setMask(mm); } });
        })(m);
        plot.appendChild(dot);
        if (first) countIn++;
      }
      plot.appendChild(ax);
      var med = function (a) { a = a.slice().sort(function (p, q) { return p - q; }); return a.length ? a[Math.floor(a.length / 2)] : null; };
      var p = PARTS.filter(function (q) { return q.id === state.mapFilter; })[0];
      note.textContent = countIn + " of 127 combinations fall inside the band at k = 256. Median first round with " + p.sym + " present: " +
        med(withPart) + "; without it: " + (med(without) || "none") + ". Select any dot to load that combination into every demo on the page. Figure 5 of the 2026 paper groups plateau rounds the same way at k = 1,000,000.";
    }

    onMask(draw);
    document.addEventListener("sha-pre", draw);
    resizers.push(draw);
    draw();
  }

  /* ---------------------------------------------------------------- start */

  var mounts = {
    "sha-hash": mountHash, "sha-parts": mountParts, "sha-spread": mountSpread,
    "sha-measure": mountMeasure, "sha-map": mountMap
  };
  Object.keys(mounts).forEach(function (id) {
    var node = document.getElementById(id);
    if (node) { node.textContent = ""; node.classList.add("w-ready"); mounts[id](node); }
  });

  document.addEventListener("paperlevel", function (e) { state.level = e.detail.level; });

  fetch(SCRIPT_BASE + "sac-127.json")
    .then(function (r) { return r.json(); })
    .then(function (json) { state.pre = json; document.dispatchEvent(new CustomEvent("sha-pre")); })
    .catch(function () { /* demos 1 and 2 do not need it */ });
})();

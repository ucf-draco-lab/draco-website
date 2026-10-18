/*
  Widget for /papers/design-for-security-iot/.
  Mount points: #ds-bus, #ds-trade, #ds-search, #ds-chirp.
  The engine (dfs-engine.js) parses the benchmark machines shipped in
  dfs-data.json, rebuilds their S*FSM versions, re-checks every shipped
  encoding against Eqs. 4 and 5, and computes all leakage figures on the
  visitor's device. The searches run in dfs-worker.js.
*/
(function () {
  "use strict";

  var E = window.DFSEngine;
  if (!E) return;
  var SCRIPT_BASE = (document.currentScript && document.currentScript.src || "").replace(/[^/]*$/, "");
  var SVGNS = "http://www.w3.org/2000/svg";
  var state = { data: null, level: window.PaperKit ? window.PaperKit.level() : "public" };
  document.addEventListener("paperlevel", function (e) { state.level = e.detail.level; });

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
  function range(label, min, max, value, onInput) {
    var input = el("input", { type: "range", min: min, max: max, step: 1, value: value, "aria-label": label });
    var out = el("output", { text: String(value) });
    input.addEventListener("input", function () { out.textContent = input.value; onInput(+input.value); });
    var wrap = el("label", { class: "w-range" }, [el("span", { text: label }), input, out]);
    wrap.set = function (v, lo, hi) {
      if (lo != null) input.min = lo;
      if (hi != null) input.max = hi;
      input.value = v; out.textContent = String(v);
    };
    return wrap;
  }
  function fact(dl, term, levels) {
    var dt = el("dt", { text: term }), dd = el("dd");
    if (levels) { dt.setAttribute("data-levels", levels); dd.setAttribute("data-levels", levels); }
    dl.appendChild(dt); dl.appendChild(dd);
    return dd;
  }
  var WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
  function num(k) { return k >= 0 && k < 10 ? WORDS[k] : String(k); }
  function bitsWord(k) { return num(k) + (k === 1 ? " bit" : " bits"); }
  function fmt(x, d) { return x == null || isNaN(x) ? "–" : x.toFixed(d == null ? 2 : d); }
  function sup(e) {
    var map = { "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹" };
    return String(e).split("").map(function (c) { return map[c] || c; }).join("");
  }
  function mulberry(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  var worker = null, jobs = {}, jobId = 0;
  function runJob(job, cb) {
    if (!worker) {
      try { worker = new Worker(SCRIPT_BASE + "dfs-worker.js"); }
      catch (err) { cb({ error: String(err) }); return; }
      worker.onmessage = function (e) { var fn = jobs[e.data.id]; delete jobs[e.data.id]; if (fn) fn(e.data); };
      worker.onerror = function (e) { Object.keys(jobs).forEach(function (k) { jobs[k]({ error: e.message || "worker error" }); delete jobs[k]; }); worker = null; };
    }
    job.id = ++jobId;
    jobs[job.id] = cb;
    worker.postMessage(job);
  }

  /* Machines, built once from the shipped KISS2 text. */
  var machines = {};
  function machine(name) {
    if (machines[name]) return machines[name];
    var d = state.data.machines[name];
    var g = E.graph(E.parseKiss2(d.kiss));
    var s = E.sfsm(g);
    var m = { name: name, d: d, g: g, s: s, options: {} };
    // binary on the original machine, then every shipped encoding (re-checked here)
    m.options.binary = { graph: g, codes: E.binaryCodes(g), bits: E.bitsFor(g.names.length), proven: true };
    Object.keys(d.options).forEach(function (key) {
      var o = d.options[key], gr = (key === "rhd" || key === "rhdhw") ? g : s;
      var codes = o.codes.map(function (c) { return parseInt(c, 2); });
      var chk = E.check(gr, codes);
      m.options[key] = { graph: gr, codes: codes, bits: o.bits, proven: o.proven, k: o.k, c2: o.c2, check: chk };
    });
    m.options.onehot = { graph: s, codes: null, bits: s.names.length, proven: true, k: 1, c2: 2, onehot: true };
    machines[name] = m;
    return m;
  }

  var OPTION_ROWS = [
    { key: "binary", label: "Binary (minimal)", short: "Binary", note: "Original machine, ⌈log₂ states⌉ bits, codes in file order" },
    { key: "rhd", label: "Relaxed HD (O.RHD)", short: "O.RHD", note: "Original machine, every transition flips the same number of bits; any weight" },
    { key: "rhdhw", label: "Relaxed HD + HW (O.RHD+HW)", short: "O.RHD+HW", note: "Original machine, constant distance and constant weight" },
    { key: "secure", label: "Secure S*FSM (Eqs. 4, 5)", short: "Secure", note: "Self-loops split, constant weight, constant distance" },
    { key: "onehot", label: "One-hot (CHW=1)", short: "One-hot", note: "One bit per S*FSM state" }
  ];

  /* Leakage, switching, and checks for one option of one machine. */
  function measure(m, key) {
    var o = m.options[key];
    if (!o) return null;
    if (o.onehot) {
      var n = o.bits;
      return { bits: n, c1: 1, c2: 2, Hhw: 0, Hhd: 0, npeak: 1, ok: true, proven: true };
    }
    var lk = E.leakage(o.graph, o.codes), sw = E.switching(o.graph, o.codes), chk = E.check(o.graph, o.codes);
    var ok = chk.distinct;
    if (key === "rhd") ok = ok && chk.constHD;
    if (key === "rhdhw" || key === "secure") ok = ok && chk.constHD && chk.constHW;
    return { bits: o.bits, c1: chk.c1, c2: chk.c2, Hhw: lk.Hhw, Hhd: lk.Hhd, npeak: sw.npeak, ok: ok, proven: o.proven };
  }

  /* ------------------------------------------------------------ demo 1: the bus */

  function mountBus(root) {
    var m = machine("modulo12");
    var enc = "binary";
    var rand = mulberry(2018);
    var sim = { orig: 0, split: m.s.start, hist: [], timer: null };
    var MAXH = 32;

    // S*FSM index of state i, copy A or B
    function splitIndex(i, copy) { return m.s.names.indexOf(m.g.names[i] + copy); }
    var secure = m.options.secure;

    function code(which) {
      if (enc === "binary") return { c: m.options.binary.codes[sim.orig], b: m.options.binary.bits };
      return { c: secure.codes[sim.split], b: secure.bits };
    }
    function step(input) {
      var before = code();
      var name = m.s.names[sim.split], base = name.slice(0, -1), copy = name.slice(-1);
      var i = m.g.names.indexOf(base);
      if (input === 1) { sim.orig = (i + 1) % 12; sim.split = splitIndex(sim.orig, "A"); }
      else { sim.split = splitIndex(i, copy === "A" ? "B" : "A"); }
      var after = code();
      sim.hist.push({ input: input, hw: E.hw(after.c), hd: E.hd(before.c, after.c), state: sim.orig });
      if (sim.hist.length > 400) sim.hist.shift();
      draw();
    }

    var encSeg = seg([
      { value: "binary", label: "Binary, 4 bits" },
      { value: "secure", label: "Secure S*FSM, " + secure.bits + " bits" }
    ], enc, function (v) { enc = v; sim.hist = []; draw(); }, "Encoding");
    var play = el("button", { type: "button", class: "w-btn", text: "Play" });
    var count = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "Count (input 1)" });
    var hold = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "Hold (input 0)" });
    var reset = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "Start over" });
    var busRow = el("div", { class: "ds-bus", role: "img" });
    var big = el("p", { class: "w-big", "aria-live": "polite" });
    var chart = svg("svg", { class: "ds-chart", role: "img", "aria-label": "Bits switching on each clock, newest at the right" });
    var dl = el("dl", { class: "ds-facts" });
    var ddState = fact(dl, "Counter value");
    var ddMeter = fact(dl, "What a power probe sees");
    var ddLearn = fact(dl, "Holds you can spot from the bars", "public hs ug");
    var ddMI = fact(dl, "Mutual information, input vs. bits flipped (Eq. 2)", "ug grad res");
    var ddH = fact(dl, "Entropy over the whole machine (Eq. 1)", "grad res");

    root.appendChild(el("div", { class: "w-actions" }, [encSeg]));
    root.appendChild(el("div", { class: "w-actions" }, [play, count, hold, reset]));
    root.appendChild(busRow);
    root.appendChild(big);
    root.appendChild(chart);
    root.appendChild(dl);
    root.appendChild(el("p", { class: "w-note", text: "The machine is MODULO12, a 12-step counter from the MCNC benchmarks: input 1 counts, input 0 holds. Play feeds it random inputs. Every number here is computed by this page from the benchmark file; the secure code is the page's shortest, re-checked against Eqs. 4 and 5 on load." }));

    function stop() { if (sim.timer) { clearInterval(sim.timer); sim.timer = null; play.textContent = "Play"; play.classList.remove("running"); } }
    play.addEventListener("click", function () {
      if (sim.timer) { stop(); return; }
      sim.timer = setInterval(function () { step(rand() < 0.5 ? 1 : 0); }, 650);
      play.textContent = "Pause"; play.classList.add("running");
    });
    count.addEventListener("click", function () { stop(); step(1); });
    hold.addEventListener("click", function () { stop(); step(0); });
    reset.addEventListener("click", function () { stop(); sim.orig = 0; sim.split = m.s.start; sim.hist = []; rand = mulberry(2018); draw(); });

    function draw() {
      var c = code(), bits = E.toBits(c.c, c.b);
      clear(busRow);
      busRow.setAttribute("aria-label", "Bus value " + bits);
      var last = sim.hist.length ? sim.hist[sim.hist.length - 1] : null;
      var prevBits = null;
      if (last) {
        // recover previous code from flip count for highlighting: recompute directly
        prevBits = sim.prevBits || null;
      }
      bits.split("").forEach(function (ch, i) {
        var flipped = prevBits && prevBits.length === bits.length && prevBits.charAt(i) !== ch;
        busRow.appendChild(el("span", { class: "ds-bit" + (ch === "1" ? " on" : "") + (flipped ? " flip" : ""), text: ch }));
      });
      sim.prevBits = bits;
      var name = m.s.names[sim.split];
      ddState.textContent = sim.orig + (enc === "secure" ? " (S*FSM state " + name.replace("st", "") + ")" : "");
      if (last) {
        big.innerHTML = "<strong>" + last.hd + "</strong> " + (last.hd === 1 ? "bit" : "bits") + " flipped on the last clock (" + (last.input ? "count" : "hold") + "); <strong>" + last.hw + "</strong> " + (last.hw === 1 ? "bit is" : "bits are") + " on.";
      } else big.textContent = "Press Count, Hold, or Play.";
      ddMeter.textContent = enc === "binary"
        ? "Holds flip no bits, and counts flip one to four, so the bars give away both the input and where the count is (7 to 8 flips all four bits)."
        : "Every clock flips exactly " + num(secure.check.c2) + " bits and leaves exactly " + num(secure.check.c1) + " bits on, whether the counter holds or counts.";
      var holds = sim.hist.filter(function (h) { return h.input === 0; });
      var spotted = holds.filter(function (h) { return sim.hist.every(function (o) { return o.input === 0 || o.hd !== h.hd; }); }).length;
      ddLearn.textContent = sim.hist.length ? spotted + " of " + holds.length + " holds stand out from every count in this run" : "–";
      var joint = {};
      sim.hist.forEach(function (h) { joint[h.input] = joint[h.input] || {}; joint[h.input][h.hd] = (joint[h.input][h.hd] || 0) + 1; });
      ddMI.textContent = sim.hist.length ? fmt(E.mutualInformation(joint), 3) + " bits per clock over the " + sim.hist.length + " clocks so far (this page's measure; 1 bit means the bars reveal every input)" : "–";
      var o = enc === "binary" ? m.options.binary : secure;
      var lk = E.leakage(o.graph, o.codes);
      ddH.textContent = "H(HW) = " + fmt(lk.Hhw, 3) + " bits over " + o.graph.names.length + " states; H(HD) = " + fmt(lk.Hhd, 3) + " bits over " + lk.transitions + " transitions, each counted once";
      drawChart();
    }

    function drawChart() {
      var W = chartWidth(chart), H = 150, padL = 34, padR = 8, padT = 12, padB = 26;
      chart.setAttribute("viewBox", "0 0 " + W + " " + H);
      clear(chart);
      var maxY = enc === "binary" ? 4 : Math.max(4, secure.check.c2);
      var y = function (v) { return padT + (H - padT - padB) * (1 - v / maxY); };
      for (var t = 0; t <= maxY; t++) {
        chart.appendChild(svg("line", { x1: padL, x2: W - padR, y1: y(t), y2: y(t), class: "c-grid" }));
        chart.appendChild(svg("text", { x: padL - 6, y: y(t) + 4, "text-anchor": "end", class: "c-tick" }, String(t)));
      }
      chart.appendChild(svg("text", { x: padL, y: H - 6, class: "c-label" }, "bits flipped per clock, last " + MAXH + " clocks (bars); open = hold"));
      var h = sim.hist.slice(-MAXH), bw = (W - padL - padR) / MAXH;
      h.forEach(function (e, i) {
        var x = padL + i * bw + bw * 0.15, w = bw * 0.7;
        var top = y(e.hd), base = y(0);
        if (e.hd === 0) {
          chart.appendChild(svg("rect", { x: x, y: base - 2, width: w, height: 2, class: "ds-bar-hold" }));
        } else {
          chart.appendChild(svg("rect", { x: x, y: top, width: w, height: base - top, class: e.input ? "ds-bar" : "ds-bar ds-bar-holdbar" }));
        }
      });
    }
    resizers.push(drawChart);
    draw();
  }

  /* ------------------------------------------------------------ demo 2: trade-offs */

  function mountTrade(root) {
    var names = state.data.order;
    var pick = "bbara";
    var pickSeg = seg(names.map(function (n) { return { value: n, label: n }; }), pick, function (v) { pick = v; draw(); }, "Benchmark machine");
    var head = el("p", { class: "w-big", "aria-live": "polite" });
    var wrap = el("div", { class: "ds-table-wrap" });
    var chart = svg("svg", { class: "ds-chart", role: "img", "aria-label": "Bits needed by each encoding for all ten machines" });
    root.appendChild(el("div", { class: "w-actions" }, [pickSeg]));
    root.appendChild(head);
    root.appendChild(wrap);
    root.appendChild(chart);
    root.appendChild(el("p", { class: "w-note", html: "Bits for Binary and One-hot follow from the state counts. The other rows are the shortest encodings this page's SAT search found (SAT is a Boolean satisfiability solver); “shortest” means every shorter length was ruled out, and “at most” means the search ran out of time below it. Each shipped encoding is re-checked against its constraints when the page loads. Rings mark the paper's Table III values." }));

    function draw() {
      var m = machine(pick);
      head.innerHTML = "<strong>" + m.g.names.length + "</strong> states in " + pick.toUpperCase() + ", <strong>" + m.s.names.length + "</strong> after splitting self-loops (S*FSM).";
      clear(wrap);
      var base = m.options.binary.bits, paper = m.d.paper;
      var t = el("table", { class: "results-table ds-trade" });
      t.appendChild(el("thead", null, [el("tr", null, [
        el("th", { text: "Encoding" }), el("th", { text: "Bits" }), el("th", { text: "More bits than binary" }),
        el("th", { text: "Hides the state?", "data-levels": "public hs" }),
        el("th", { text: "Weight c₁", "data-levels": "ug grad res" }), el("th", { text: "Distance c₂", "data-levels": "ug grad res" }),
        el("th", { text: "Npeak", "data-levels": "grad res" }),
        el("th", { text: "H(HW)", "data-levels": "grad res" }), el("th", { text: "H(HD)", "data-levels": "grad res" }),
        el("th", { text: "Paper", "data-levels": "ug grad res" })
      ])]));
      var body = el("tbody");
      OPTION_ROWS.forEach(function (row) {
        var r = measure(m, row.key);
        if (!r) return;
        var hide = r.Hhw === 0 && r.Hhd === 0 ? "Yes: weight and flips constant" : r.Hhd === 0 ? "Flips constant, weight varies" : r.Hhw === 0 ? "Weight constant, flips vary" : "No";
        var p = row.key === "binary" ? paper.be : row.key === "secure" ? paper.sec : null;
        var bitsTxt = (r.proven ? "" : "≤ ") + r.bits;
        body.appendChild(el("tr", { title: row.note }, [
          el("td", { text: row.label }),
          el("td", { text: bitsTxt + (r.ok ? "" : " (check failed)") }),
          el("td", { text: row.key === "binary" ? "–" : "+" + Math.round(100 * (r.bits - base) / base) + "%" }),
          el("td", { text: hide, "data-levels": "public hs" }),
          el("td", { text: r.c1 == null ? "varies" : String(r.c1), "data-levels": "ug grad res" }),
          el("td", { text: r.c2 == null ? "varies" : String(r.c2), "data-levels": "ug grad res" }),
          el("td", { text: String(r.npeak), "data-levels": "grad res" }),
          el("td", { text: fmt(r.Hhw, 2), "data-levels": "grad res" }),
          el("td", { text: fmt(r.Hhd, 2), "data-levels": "grad res" }),
          el("td", { text: p == null ? "–" : p + (p === r.bits ? " ✓" : ""), "data-levels": "ug grad res" })
        ]));
      });
      t.appendChild(body);
      wrap.appendChild(t);
      drawChart();
    }

    function drawChart() {
      var W = chartWidth(chart), H = 230, padL = 34, padR = 8, padT = 14, padB = 44;
      chart.setAttribute("viewBox", "0 0 " + W + " " + H);
      clear(chart);
      var keys = ["binary", "rhd", "rhdhw", "secure"];
      var maxY = 16;
      names.forEach(function (n) { var m = machine(n); keys.forEach(function (k) { var r = m.options[k]; if (r && r.bits > maxY) maxY = Math.ceil(r.bits / 4) * 4; }); });
      var y = function (v) { return padT + (H - padT - padB) * (1 - v / maxY); };
      for (var t = 0; t <= maxY; t += 4) {
        chart.appendChild(svg("line", { x1: padL, x2: W - padR, y1: y(t), y2: y(t), class: "c-grid" }));
        chart.appendChild(svg("text", { x: padL - 6, y: y(t) + 4, "text-anchor": "end", class: "c-tick" }, String(t)));
      }
      var cw = (W - padL - padR) / names.length;
      names.forEach(function (n, i) {
        var m = machine(n), cx = padL + cw * (i + 0.5);
        var g = svg("g", { class: n === pick ? "ds-col on" : "ds-col" });
        g.appendChild(svg("text", { x: cx, y: H - padB + 14, "text-anchor": "middle", class: "c-tick", transform: W < 520 ? "rotate(-35 " + cx + " " + (H - padB + 14) + ")" : "" }, n));
        keys.forEach(function (k, j) {
          var r = m.options[k];
          if (!r) return;
          var x = cx + (j - 1.5) * Math.min(8, cw / 6);
          g.appendChild(svg("circle", { cx: x, cy: y(r.bits), r: 3.4, class: "ds-dot ds-dot-" + k }));
        });
        var p = m.d.paper;
        g.appendChild(svg("circle", { cx: cx + (0 - 1.5) * Math.min(8, cw / 6), cy: y(p.be), r: 6, class: "ds-ring" }));
        g.appendChild(svg("circle", { cx: cx + (3 - 1.5) * Math.min(8, cw / 6), cy: y(p.sec), r: 6, class: "ds-ring" }));
        g.addEventListener("click", function () { pick = n; pickSeg.set(n); draw(); });
        chart.appendChild(g);
      });
      // legend
      var lx = padL, ly = H - 8;
      [["binary", "Binary"], ["rhd", "O.RHD"], ["rhdhw", "O.RHD+HW"], ["secure", "Secure"]].forEach(function (l) {
        chart.appendChild(svg("circle", { cx: lx + 4, cy: ly - 4, r: 3.4, class: "ds-dot ds-dot-" + l[0] }));
        var tx = svg("text", { x: lx + 11, y: ly, class: "c-label" }, l[1]);
        chart.appendChild(tx);
        lx += 18 + l[1].length * 6.6;
      });
      chart.appendChild(svg("circle", { cx: lx + 6, cy: ly - 4, r: 6, class: "ds-ring" }));
      chart.appendChild(svg("text", { x: lx + 15, y: ly, class: "c-label" }, "paper"));
    }
    resizers.push(drawChart);
    draw();
  }

  /* ------------------------------------------------------------ demo 3: search */

  function mountSearch(root) {
    var names = state.data.order.filter(function (n) { return n !== "scf"; });
    var pick = "bbara", job = { b: 8, k: 3, c2: 4 };
    function m() { return machine(pick); }
    function setFromSecure() {
      var o = m().options.secure || { bits: m().d.paper.sec, k: 3, c2: 4 };
      job = { b: o.bits, k: o.k, c2: o.c2 };
      syncControls();
    }
    var pickSeg = seg(names.map(function (n) { return { value: n, label: n }; }), pick, function (v) { pick = v; setFromSecure(); out(null); }, "Benchmark machine");
    var rb = range("Bits", 3, 14, job.b, function (v) { job.b = v; clampK(); });
    var rk = range("Ones per code, c₁", 1, 7, job.k, function (v) { job.k = v; clampC2(); });
    var rc = range("Bits flipped, c₂", 2, 8, job.c2, function (v) { job.c2 = v; });
    function clampK() { job.k = Math.min(job.k, job.b - 1); rk.set(job.k, 1, job.b - 1); clampC2(); }
    function clampC2() {
      var hi = 2 * Math.min(job.k, job.b - job.k);
      job.c2 = Math.max(2, Math.min(job.c2 - job.c2 % 2, hi));
      rc.set(job.c2, 2, Math.max(2, hi));
    }
    function syncControls() { rb.set(job.b); clampK(); rk.set(job.k); rc.set(job.c2); }
    var go = el("button", { type: "button", class: "w-btn", text: "Search" });
    var paperBtn = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "Paper's length" });
    var fewer = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "One bit fewer" });
    var status = el("p", { class: "w-big", "aria-live": "polite" });
    var wrap = el("div", { class: "ds-table-wrap" });
    root.appendChild(el("div", { class: "w-actions" }, [pickSeg]));
    root.appendChild(el("div", { class: "ds-ranges" }, [rb, rk, rc]));
    root.appendChild(el("div", { class: "w-actions" }, [go, paperBtn, fewer]));
    root.appendChild(status);
    root.appendChild(wrap);
    root.appendChild(el("p", { class: "w-note", text: "The search runs on your device: a backtracking search over codes with c₁ ones, placing states in breadth-first order and keeping every placed neighbor exactly c₂ bits away. It stops after eight seconds. Steps of c₂ are even because two codes with the same number of ones always differ in an even number of bits." }));

    paperBtn.addEventListener("click", function () {
      var o = m().options.secure || { bits: 0 };
      job = { b: m().d.paper.sec, k: o.bits === m().d.paper.sec ? o.k : 3, c2: o.bits === m().d.paper.sec ? o.c2 : 4 };
      syncControls();
      run();
    });
    fewer.addEventListener("click", function () { job.b = Math.max(3, job.b - 1); syncControls(); runAll(); });
    go.addEventListener("click", run);

    function out(res, label) {
      clear(wrap);
      if (!res) { status.textContent = "Pick settings and press Search."; return; }
      if (res.error) { status.textContent = "The search could not start here (" + res.error + ")."; return; }
      if (res.status === "found") {
        status.innerHTML = "<strong>Found</strong> a " + job.b + "-bit secure encoding for " + pick.toUpperCase() + " in " + res.ms + " ms (" + res.nodes.toLocaleString() + " search steps). Weight " + res.check.c1 + " everywhere, distance " + res.check.c2 + " on every transition.";
        var t = el("table", { class: "results-table ds-codes" });
        t.appendChild(el("thead", null, [el("tr", null, [el("th", { text: "S*FSM state" }), el("th", { text: "Code" }), el("th", { text: "Ones" })])]));
        var body = el("tbody");
        res.names.forEach(function (n, i) {
          body.appendChild(el("tr", null, [el("td", { text: n }), el("td", { class: "w-mono-cell", text: E.toBits(res.codes[i], job.b) }), el("td", { text: String(E.hw(res.codes[i])) })]));
        });
        t.appendChild(body);
        wrap.appendChild(t);
      } else if (res.status === "none") {
        status.innerHTML = label || ("<strong>No</strong> " + job.b + "-bit encoding exists with " + num(job.k) + (job.k === 1 ? " one" : " ones") + " per code and " + num(job.c2) + " bits flipped per transition (the search covered every case in " + res.ms + " ms).");
      } else {
        status.innerHTML = "<strong>Undecided</strong> after " + res.ms + " ms and " + res.nodes.toLocaleString() + " steps. The page's offline SAT search settles this case; see the table above.";
      }
    }
    function run() {
      status.textContent = "Searching…";
      runJob({ kiss: m().d.kiss, split: true, b: job.b, k: job.k, c2: job.c2, timeLimit: 8000 }, function (r) { out(r); });
    }
    // try every (c1, c2) at this length; report the first hit or a full "none"
    function runAll() {
      var b = job.b, cases = [];
      for (var k = 1; k <= Math.floor(b / 2); k++) for (var c2 = 2; c2 <= 2 * Math.min(k, b - k); c2 += 2) cases.push([k, c2]);
      var i = 0, anyTimeout = false, total = 0, t0 = Date.now();
      status.textContent = "Trying every weight and distance at " + b + " bits…";
      (function next() {
        if (i >= cases.length) {
          out({ status: anyTimeout ? "timeout" : "none", nodes: total, ms: Date.now() - t0 },
            anyTimeout ? null : "<strong>No</strong> " + b + "-bit secure encoding of " + pick.toUpperCase() + " exists for any weight or distance (" + cases.length + " cases, " + total.toLocaleString() + " search steps, " + (Date.now() - t0) + " ms).");
          return;
        }
        var c = cases[i++];
        runJob({ kiss: m().d.kiss, split: true, b: b, k: c[0], c2: c[1], timeLimit: 4000 }, function (r) {
          if (r.error) { out(r); return; }
          total += r.nodes;
          if (r.status === "found") { job.k = c[0]; job.c2 = c[1]; syncControls(); out(r); return; }
          if (r.status === "timeout") anyTimeout = true;
          next();
        });
      })();
    }
    out(null);
  }

  /* ------------------------------------------------------------ demo 4: CHIRP */

  function mountChirp(root) {
    var PAPER = [7, 5, 2, 0, 4, 6, 1, 3];
    var sim = { n: 8, perm: PAPER.slice(), seed: 1, shift: -1 };
    var size = range("Devices", 2, 16, sim.n, function (v) { sim.n = v; sim.perm = v === 8 ? PAPER.slice() : E.shuffle(v, sim.seed); draw(); });
    var shuffleBtn = el("button", { type: "button", class: "w-btn", text: "Shuffle the rounds" });
    var paperBtn = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "Paper's order (8 devices)" });
    var plain = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "No shuffle" });
    var shiftSeg = seg([
      { value: -1, label: "As printed in Table IV" },
      { value: 0, label: "Eq. 11 as written" }
    ], sim.shift, function (v) { sim.shift = v; draw(); }, "Indexing");
    var wrap = el("div", { class: "ds-table-wrap" });
    var dl = el("dl", { class: "ds-facts" });
    var ddOrder = fact(dl, "Round order Pr(C)");
    var ddPairs = fact(dl, "Pairs that met in one cycle");
    var ddPerm = fact(dl, "Possible round orders (Table I)");
    root.appendChild(el("div", { class: "w-actions" }, [size]));
    root.appendChild(el("div", { class: "w-actions" }, [shuffleBtn, paperBtn, plain]));
    root.appendChild(el("div", { class: "w-actions", "data-levels": "grad res" }, [shiftSeg]));
    root.appendChild(wrap);
    root.appendChild(dl);
    root.appendChild(el("p", { class: "w-note", html: "Row = round, column = device; each cell names that device's partner, and “–” marks the one round a device pairs with itself. The full protocol, with dropouts and late joiners, has its own page: <a href=\"../s-chirp/\">CHIRP and S-CHIRP</a>." }));

    shuffleBtn.addEventListener("click", function () { sim.seed++; sim.perm = E.shuffle(sim.n, sim.seed * 7919); draw(); });
    paperBtn.addEventListener("click", function () { sim.n = 8; size.set(8); sim.perm = PAPER.slice(); draw(); });
    plain.addEventListener("click", function () { sim.perm = []; for (var i = 0; i < sim.n; i++) sim.perm.push(i); draw(); });

    function draw() {
      clear(wrap);
      var T = E.cycleTable(sim.n, sim.perm, sim.shift);
      var t = el("table", { class: "results-table ds-matrix" });
      var hr = el("tr", null, [el("th", { text: "Round" }), el("th", { text: "Pr(C)" })]);
      for (var s = 0; s < sim.n; s++) hr.appendChild(el("th", { text: String(s) }));
      t.appendChild(el("thead", null, [hr]));
      var body = el("tbody");
      T.forEach(function (row, r) {
        var tr = el("tr", null, [el("td", { text: String(r) }), el("td", { class: "ds-pr", text: String(sim.perm[r]) })]);
        row.forEach(function (tg, s2) { tr.appendChild(el("td", { class: tg === s2 ? "ds-self" : "", text: tg === s2 ? "–" : String(tg) })); });
        body.appendChild(tr);
      });
      t.appendChild(body);
      wrap.appendChild(t);
      ddOrder.textContent = "[" + sim.perm.join(", ") + "]";
      var cp = E.cyclePairs(sim.n, sim.perm, sim.shift);
      ddPairs.textContent = cp.pairs + " of " + (sim.n * (sim.n - 1) / 2) + (cp.asymmetric ? " (some partners disagree)" : ", and both partners always agree");
      var f = E.factorialSci(sim.n);
      ddPerm.textContent = sim.n + "! = " + (sim.n <= 12 ? Math.round(Math.pow(10, f.log10)).toLocaleString() + " ≈ " : "") + f.mantissa.toFixed(2) + " × 10" + sup(f.exponent);
    }
    draw();
  }

  /* ------------------------------------------------------------ boot */

  var mounts = [["ds-bus", mountBus], ["ds-trade", mountTrade], ["ds-search", mountSearch], ["ds-chirp", mountChirp]];
  fetch(SCRIPT_BASE + "dfs-data.json").then(function (r) { return r.json(); }).then(function (data) {
    state.data = data;
    mounts.forEach(function (mt) {
      var rootEl = document.getElementById(mt[0]);
      if (!rootEl) return;
      mt[1](rootEl);
      rootEl.classList.add("w-ready");
    });
  }).catch(function (err) {
    mounts.forEach(function (mt) {
      var rootEl = document.getElementById(mt[0]);
      if (rootEl) rootEl.appendChild(el("p", { class: "w-note", text: "The demo data did not load (" + err + ")." }));
    });
  });
})();

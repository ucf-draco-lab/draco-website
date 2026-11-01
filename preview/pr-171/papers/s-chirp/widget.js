/*
  CHIRP and S-CHIRP widget for /papers/s-chirp/.
  Mount points: #sc-cycle, #sc-join, #sc-shuffle, #sc-cliques.
  Demos 1 to 3 share one node count; demo 4 has its own two cliques.
  Everything is computed by chirp-engine.js on page load; nothing is fetched.
*/
(function () {
  "use strict";

  var E = window.ChirpEngine;
  if (!E) return;

  var SVGNS = "http://www.w3.org/2000/svg";

  /* ------------------------------------------------------------ shared state */

  var state = { n: 8, level: window.PaperKit ? window.PaperKit.level() : "public" };
  var listeners = [];
  function onN(fn) { listeners.push(fn); }
  function setN(n) { state.n = n; listeners.forEach(function (fn) { fn(); }); }
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
  function plural(k, one, many) { return k + " " + (k === 1 ? one : many); }
  var WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
  function num(k) { return k < 10 && k >= 0 ? WORDS[k] : String(k); }
  function sci(m, e) { return m.toFixed(2) + " × 10" + sup(e); }
  function sup(e) {
    var map = { "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹", "-": "⁻" };
    return String(e).split("").map(function (c) { return map[c] || c; }).join("");
  }

  /* Node positions on a circle. */
  function ring(n, cx, cy, R) {
    var pts = [];
    for (var i = 0; i < n; i++) {
      var a = -Math.PI / 2 + 2 * Math.PI * i / n;
      pts.push({ x: cx + R * Math.cos(a), y: cy + R * Math.sin(a), a: a });
    }
    return pts;
  }

  /* ------------------------------------------------------------ demo 1: the cycle */

  function mountCycle(root) {
    var sim = { r: -1, present: null, timer: null };
    function resetPresent() { sim.present = []; for (var i = 0; i < state.n; i++) sim.present.push(true); }
    resetPresent();

    var size = range("Nodes", 2, 16, state.n, function (v) { setN(v); });
    var play = el("button", { type: "button", class: "w-btn", text: "Play" });
    var step = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "Next round" });
    var reset = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "Start over" });
    var chart = svg("svg", { class: "sc-ring", role: "img", "aria-label": "Nodes on a circle; lines show who has talked to whom" });
    var big = el("p", { class: "w-big", "aria-live": "polite" });
    var dl = el("dl", { class: "sc-facts" });
    var ddRound = fact(dl, "This round");
    var ddRule = fact(dl, "Each node's partner", "hs ug grad res");
    var ddBound = fact(dl, "Fewest rounds possible (Eq. 1)", "ug grad res");
    var ddLoss = fact(dl, "Lost to missing nodes (Eq. 3)", "hs ug grad res");
    var ddCheck = fact(dl, "Check over one full cycle", "grad res");

    root.appendChild(el("div", { class: "w-actions" }, [size]));
    root.appendChild(el("div", { class: "w-actions" }, [play, step, reset]));
    root.appendChild(chart);
    root.appendChild(big);
    root.appendChild(dl);
    root.appendChild(el("p", { class: "w-note", text: "Tap a node to take it out of the network or bring it back. Computed by this page from the paper's pairing rule; each line is one conversation." }));

    function stop() { if (sim.timer) { clearInterval(sim.timer); sim.timer = null; play.textContent = "Play"; play.classList.remove("running"); } }
    function advance() {
      if (sim.r >= state.n - 1) { stop(); return; }
      sim.r++;
      draw();
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
    reset.addEventListener("click", function () { stop(); sim.r = -1; resetPresent(); draw(); });
    onN(function () { stop(); size.set(state.n); sim.r = -1; resetPresent(); draw(); });

    function draw() {
      var n = state.n;
      var W = chartWidth(chart), H = Math.min(420, Math.max(300, W * 0.62));
      chart.setAttribute("viewBox", "0 0 " + W + " " + H);
      chart.textContent = "";
      var R = Math.min(W, H) / 2 - 34, cx = W / 2, cy = H / 2;
      var pts = ring(n, cx, cy, R);
      var cyc = E.cycle(n, sim.present);
      // past rounds
      for (var r = 0; r <= sim.r; r++) {
        var rp = cyc.rounds[r];
        rp.pairs.forEach(function (p) {
          var now = r === sim.r;
          chart.appendChild(svg("line", { class: now ? "sc-edge sc-edge-now" : "sc-edge", x1: pts[p[0]].x, y1: pts[p[0]].y, x2: pts[p[1]].x, y2: pts[p[1]].y }));
        });
        if (r === sim.r) rp.idle.forEach(function (s) {
          var t = E.target(r, s, n);
          chart.appendChild(svg("line", { class: "sc-edge-idle", x1: pts[s].x, y1: pts[s].y, x2: pts[t].x, y2: pts[t].y }));
        });
      }
      var now = sim.r >= 0 ? cyc.rounds[sim.r] : null;
      pts.forEach(function (p, i) {
        var g = svg("g", { class: "sc-node" + (sim.present[i] ? "" : " sc-off") + (now && now.selfLoops.indexOf(i) >= 0 ? " sc-self" : ""), tabindex: 0, role: "button", "aria-label": "Node " + i + (sim.present[i] ? ", in the network" : ", missing") });
        g.appendChild(svg("circle", { cx: p.x, cy: p.y, r: 15 }));
        g.appendChild(svg("text", { x: p.x, y: p.y + 4, "text-anchor": "middle" }, i));
        function toggle() { stop(); sim.present[i] = !sim.present[i]; draw(); }
        g.addEventListener("click", toggle);
        g.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); } });
        chart.appendChild(g);
      });
      chart.appendChild(svg("text", { class: "c-label", x: 8, y: 16 }, sim.r < 0 ? "Before round 0" : "Round " + sim.r + " · rounds 0 to " + (n - 1)));

      var made = 0;
      for (var k = 0; k <= sim.r; k++) made += cyc.rounds[k].pairs.length;
      var nPresent = sim.present.filter(Boolean).length;
      big.innerHTML = "";
      big.appendChild(document.createTextNode("Conversations so far: "));
      big.appendChild(el("strong", { text: String(made) }));
      big.appendChild(document.createTextNode(" of " + cyc.maxEdges + " pairs, after " + plural(sim.r + 1, "round", "rounds") + " of " + n + "."));

      if (!now) ddRound.textContent = "Press Next round or Play.";
      else {
        var bits = [plural(now.pairs.length, "pair talks", "pairs talk")];
        if (now.selfLoops.length) bits.push("node " + now.selfLoops.join(" and node ") + " pairs with itself (its checkpoint round)");
        if (now.idle.length) bits.push(plural(now.idle.length, "node waits", "nodes wait") + " on a missing partner");
        ddRound.textContent = bits.join("; ") + ".";
      }
      var r0 = Math.max(sim.r, 0);
      ddRule.textContent = "partner = (round − my number) mod " + n + ". In round " + r0 + ", node 1 talks to node " + E.target(r0, 1, n) + ". Any two nodes a and b meet in round (a + b) mod " + n + ".";
      ddBound.textContent = n + " nodes need at least " + E.rMin(n) + " rounds (" + (n % 2 ? "odd" : "even") + " n); CHIRP uses " + n + ", one per node, so every node gets one checkpoint round.";
      var loss = E.ceLoss(n, nPresent);
      ddLoss.textContent = (100 * loss).toFixed(1) + "% of each node's rounds (" + (n - nPresent) + " missing of " + n + "). Measured over this cycle: " + (100 * cyc.wastedFraction).toFixed(1) + "%.";
      ddCheck.textContent = (cyc.complete ? "Every pair of present nodes met exactly once" : "Some pairs did not meet") + "; " + (cyc.selfOncePerCycle ? "each node paired with itself once" : "self-pairing uneven") + "; each round holds " + Math.min.apply(null, cyc.rounds.map(function (x) { return x.pairs.length; })) + " to " + Math.max.apply(null, cyc.rounds.map(function (x) { return x.pairs.length; })) + " pairs.";
    }
    resizers.push(draw);
    draw();
  }

  /* ------------------------------------------------------------ matrix helper */

  function matrix(n, perm, opts) {
    opts = opts || {};
    var table = el("table", { class: "results-table sc-matrix" });
    var head = el("tr");
    head.appendChild(el("th", { text: opts.roundHead || "Round" }));
    if (perm) head.appendChild(el("th", { text: "Pr(C)" }));
    for (var s = 0; s < n; s++) head.appendChild(el("th", { text: String(s), class: s === opts.mask ? "sc-mask" : "" }));
    table.appendChild(el("thead", null, [head]));
    var body = el("tbody");
    for (var k = 0; k < n; k++) {
      var r = (opts.start || 0) + k;
      var tr = el("tr");
      tr.appendChild(el("td", { class: "w-mono", text: opts.label ? opts.label(k, r) : String(r % n) }));
      if (perm) tr.appendChild(el("td", { class: "w-mono", text: String(perm[r % n]) }));
      for (var s2 = 0; s2 < n; s2++) {
        var t = E.target(r, s2, n, perm);
        var cell;
        if (s2 === opts.mask) cell = el("td", { class: "sc-mask", text: "?" });
        else if (t === s2) cell = el("td", { class: "sc-selfcell", text: "–" });
        else {
          cell = el("td", { text: String(t) });
          if (opts.highlight != null && t === opts.highlight) cell.classList.add("sc-hit");
        }
        tr.appendChild(cell);
      }
      body.appendChild(tr);
    }
    table.appendChild(body);
    return el("div", { class: "sc-table-wrap" }, [table]);
  }

  /* ------------------------------------------------------------ demo 2: joining mid-cycle */

  function mountJoin(root) {
    var sim = { node: 4, start: 4 };
    var nodeRange = range("Newcomer", 0, state.n - 1, sim.node, function (v) { sim.node = v; draw(); });
    var again = el("button", { type: "button", class: "w-btn", text: "Join at a random moment" });
    var paperBtn = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "Paper's example" });
    var holder = el("div");
    var big = el("p", { class: "w-big", "aria-live": "polite" });
    var note = el("p", { class: "w-note" });
    root.appendChild(el("div", { class: "w-actions" }, [nodeRange]));
    root.appendChild(el("div", { class: "w-actions" }, [again, paperBtn]));
    root.appendChild(holder);
    root.appendChild(big);
    root.appendChild(note);

    again.addEventListener("click", function () {
      var s;
      do { s = Math.floor(Math.random() * state.n); } while (state.n > 1 && s === sim.start);
      sim.start = s; draw();
    });
    paperBtn.addEventListener("click", function () { if (state.n !== 8) setN(8); sim.node = 4; sim.start = 4; nodeRange.set(4); draw(); });
    onN(function () {
      var inp = nodeRange.querySelector("input");
      inp.max = state.n - 1;
      if (sim.node > state.n - 1) sim.node = Math.min(4, state.n - 1);
      sim.start = sim.start % state.n;
      nodeRange.set(sim.node);
      draw();
    });

    function draw() {
      var n = state.n, me = sim.node;
      holder.textContent = "";
      var left = matrix(n, null, { mask: me, start: sim.start, roundHead: "Round", label: function (k) { return k === 0 ? "j" : "j+" + k; } });
      var t2 = el("table", { class: "results-table sc-inbound" });
      t2.appendChild(el("thead", null, [el("tr", null, [el("th", { text: "Unknown round" }), el("th", { text: "Heard from" }), el("th", { text: "Computed round (Eq. 4)" })])]));
      var tb = el("tbody"), rounds = [];
      for (var k = 0; k < n; k++) {
        var r = sim.start + k;
        var inbound = E.target(r, me, n);
        var calc = E.roundFromInbound(inbound, me, n);
        rounds.push(calc);
        tb.appendChild(el("tr", null, [
          el("td", { class: "w-mono", text: k === 0 ? "j" : "j+" + k }),
          el("td", { class: "w-mono", text: inbound === me ? "nobody (self)" : "node " + inbound }),
          el("td", { class: "w-mono", text: "(" + inbound + " + " + me + ") mod " + n + " = " + calc })
        ]));
      }
      t2.appendChild(tb);
      holder.appendChild(el("div", { class: "sc-join" }, [left, el("div", { class: "sc-table-wrap" }, [t2])]));
      var seq = rounds.every(function (v, k) { return k === 0 || v === (rounds[k - 1] + 1) % n; });
      big.innerHTML = "";
      big.appendChild(document.createTextNode("Node " + me + " works out that round j is round "));
      big.appendChild(el("strong", { text: String(rounds[0]) }));
      big.appendChild(document.createTextNode(seq ? ", and the rounds that follow count up by one, as they should." : "."));
      var isPaper = n === 8 && me === 4 && sim.start === 4;
      note.textContent = isPaper ?
        "These are the paper's Table I and Table II exactly: eight nodes, node four masked, and the round index hidden." :
        "Computed by this page with Eq. 2 and Eq. 4. Press Paper's example for the case printed in Tables I and II.";
    }
    draw();
  }

  /* ------------------------------------------------------------ demo 3: shuffled rounds */

  function mountShuffle(root) {
    var sim = { mode: "secure", source: "paper", seed: 2018 };
    var modeSeg = seg([
      { value: "plain", label: "CHIRP: rounds in order" },
      { value: "secure", label: "S-CHIRP: shuffled rounds" }
    ], sim.mode, function (v) { sim.mode = v; draw(); }, "Protocol");
    var srcSeg = seg([
      { value: "paper", label: "Paper's shuffle (8 nodes)" },
      { value: "fy", label: "Fisher–Yates", levels: "ug grad res" },
      { value: "sattolo", label: "Sattolo", levels: "grad res" }
    ], sim.source, function (v) { sim.source = v; if (v === "paper" && state.n !== 8) setN(8); else draw(); }, "Shuffle");
    var again = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "New shuffle" });
    var holder = el("div");
    var dl = el("dl", { class: "sc-facts" });
    var ddPerm = fact(dl, "Round order Pr(C)");
    var ddCount = fact(dl, "Possible round orders");
    var ddMem = fact(dl, "Memory to store the order", "hs ug grad res");
    var ddGuess = fact(dl, "Outsider's chance to name the next round's pairs (this page's analysis)", "grad res");
    var t3 = el("div", { "data-levels": "ug grad res" });
    root.appendChild(el("div", { class: "w-actions" }, [modeSeg]));
    root.appendChild(el("div", { class: "w-actions" }, [srcSeg, again]));
    root.appendChild(holder);
    root.appendChild(dl);
    root.appendChild(t3);

    again.addEventListener("click", function () {
      sim.seed = (Math.random() * 4294967296) >>> 0;
      if (sim.source === "paper") { sim.source = "fy"; srcSeg.set("fy"); }
      if (sim.mode === "plain") { sim.mode = "secure"; modeSeg.set("secure"); }
      draw();
    });
    onN(function () { if (state.n !== 8 && sim.source === "paper") { sim.source = "fy"; srcSeg.set("fy"); } draw(); });

    function perm() {
      var n = state.n;
      if (sim.source === "paper" && n === 8) return E.PAPER_PERM.slice();
      var rand = E.rng(sim.seed + n * 7919);
      return sim.source === "sattolo" ? E.sattolo(n, rand) : E.fisherYates(n, rand);
    }

    function draw() {
      var n = state.n, p = perm();
      var secure = sim.mode === "secure";
      holder.textContent = "";
      holder.appendChild(matrix(n, secure ? p : null, { highlight: 0 }));
      holder.appendChild(el("p", { class: "w-note", text: secure ?
        "Each row is one round; each column is one node; the number is that node's partner, and a dash is its checkpoint round. The shaded cells are the rounds in which someone talks to node 0. Shuffling the rounds keeps every pair meeting exactly once and scatters the shaded cells." :
        "Each row is one round; each column is one node; the number is that node's partner, and a dash is its checkpoint round. In order, every partner steps up by one each round, so the shaded cells (someone talking to node 0) run in a diagonal line. Anyone who sees one round can predict every round after it." }));
      ddPerm.textContent = secure ? "[" + p.join(", ") + "]" + (sim.source === "paper" && n === 8 ? " (the paper's example)" : sim.source === "sattolo" ? " (one single cycle, Sattolo's algorithm)" : " (Fisher–Yates shuffle, seed " + sim.seed + ")") : "[" + p.map(function (_, i) { return i; }).join(", ") + "] (no shuffle)";
      var f = E.factorialSci(n);
      ddCount.textContent = n + "! = " + (f.exponent < 7 ? Number(f.exact).toLocaleString("en-US") : sci(f.mantissa, f.exponent)) + (secure ? "; the network's shared secret is which one it uses." : "; plain CHIRP always uses the same one.");
      ddMem.textContent = n + " numbers of four bytes each: " + E.permBytes(n) + " bytes. The paper's estimates: 40 KB for 10,000 nodes and 4 MB for a million.";
      if (!secure) ddGuess.textContent = "100% in every round: the order is public.";
      else ddGuess.textContent = "After watching k rounds of this cycle, 1 in (" + n + " − k): " + (100 / n).toFixed(1) + "% before the first round, rising to 100% for the last round. One overheard pair (a, b) reveals that round's value, (a + b) mod " + n + ". Reusing the same order every cycle hands it to anyone who watched one full cycle.";

      t3.textContent = "";
      var tab = el("table", { class: "results-table sc-t3" });
      tab.appendChild(el("thead", null, [el("tr", null, [el("th", { text: "Nodes and rounds" }), el("th", { text: "Paper (Table III)" }), el("th", { text: "n!, computed" })])]));
      var tb = el("tbody");
      [[8, "4.03 × 10⁵"], [10, "3.63 × 10⁶"], [16, "2.09 × 10¹³"], [32, "2.63 × 10³⁵"], [64, "1.26 × 10⁸⁹"], [128, "3.85 × 10²¹⁵"]].forEach(function (row) {
        var g = E.factorialSci(row[0]);
        tb.appendChild(el("tr", null, [el("td", { class: "w-mono", text: String(row[0]) }), el("td", { class: "w-mono", text: row[1] }), el("td", { class: "w-mono", text: g.mantissa.toFixed(4) + " × 10" + sup(g.exponent) })]));
      });
      tab.appendChild(tb);
      t3.appendChild(el("div", { class: "sc-table-wrap" }, [tab]));
      t3.appendChild(el("p", { class: "w-note", text: "Computed with exact integer arithmetic in your browser. Five rows agree to three figures; for 8 nodes, 8! = 40,320 is 4.03 × 10⁴." }));
    }
    draw();
  }

  /* ------------------------------------------------------------ demo 4: collocated cliques */

  function mountCliques(root) {
    var sim = { a: 4, b: 2, mode: "exact" };
    var HORIZON = 30;
    var aR = range("Network A devices", 1, 8, sim.a, function (v) { sim.a = v; draw(); });
    var bR = range("Network B devices", 1, 8, sim.b, function (v) { sim.b = v; draw(); });
    var modeSeg = seg([
      { value: "exact", label: "Count = devices" },
      { value: "prime", label: "Distinct prime counts" }
    ], sim.mode, function (v) { sim.mode = v; draw(); }, "Device count rule");
    var fig4 = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "Figs. 4 and 5" });
    var fig6 = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "Fig. 6" });
    var chart = svg("svg", { class: "sc-timeline", role: "img", "aria-label": "Two networks' round cycles over 30 rounds" });
    var big = el("p", { class: "w-big", "aria-live": "polite" });
    var dl = el("dl", { class: "sc-facts" });
    var ddCounts = fact(dl, "Device counts used in Eq. 2");
    var ddSame = fact(dl, "Rounds where both sit at the same step", "hs ug grad res");
    var events = el("div", { "data-levels": "ug grad res" });

    root.appendChild(el("div", { class: "w-actions" }, [aR, bR]));
    root.appendChild(el("div", { class: "w-actions" }, [modeSeg, fig4, fig6]));
    root.appendChild(chart);
    root.appendChild(big);
    root.appendChild(dl);
    root.appendChild(events);
    root.appendChild(el("p", { class: "w-note", text: "Rounds numbered from 1, as in the article's figures. Computed by this page." }));

    fig4.addEventListener("click", function () { sim.a = 4; sim.b = 2; sim.mode = "exact"; aR.set(4); bR.set(2); modeSeg.set("exact"); draw(); });
    fig6.addEventListener("click", function () { sim.a = 4; sim.b = 2; sim.mode = "prime"; aR.set(4); bR.set(2); modeSeg.set("prime"); draw(); });

    function counts() { return sim.mode === "prime" ? E.distinctPrimes([sim.a, sim.b]) : [sim.a, sim.b]; }

    function draw() {
      var c = counts();
      var al = E.alignment(c, HORIZON);
      var W = chartWidth(chart), padL = 26, padR = 6, cell = (W - padL - padR) / HORIZON;
      var H = 132;
      chart.setAttribute("viewBox", "0 0 " + W + " " + H);
      chart.textContent = "";
      var rows = [{ y: 20, n: c[0], size: sim.a, name: "A" }, { y: 58, n: c[1], size: sim.b, name: "B" }];
      rows.forEach(function (row) {
        chart.appendChild(svg("text", { class: "c-label", x: 2, y: row.y + 19 }, row.name));
        for (var r = 0; r < HORIZON; r++) {
          var pos = r % row.n;
          var x = padL + r * cell;
          var cls = "sc-step" + (pos === 0 ? " sc-start" : "") + (al.same.indexOf(r) >= 0 ? " sc-same" : "");
          chart.appendChild(svg("rect", { class: cls, x: x + 0.5, y: row.y, width: Math.max(1, cell - 1), height: 28 }));
          if (cell >= 14) chart.appendChild(svg("text", { class: "sc-step-num" + (pos === 0 ? " on" : ""), x: x + cell / 2, y: row.y + 18, "text-anchor": "middle" }, pos));
        }
      });
      al.starts.forEach(function (r) {
        var x = padL + r * cell + cell / 2;
        chart.appendChild(svg("path", { class: "sc-mark", d: "M" + (x - 5) + " 98 L" + (x + 5) + " 98 L" + x + " 90 Z" }));
        chart.appendChild(svg("text", { class: "c-tick", x: x, y: 112, "text-anchor": "middle" }, r + 1));
      });
      chart.appendChild(svg("text", { class: "c-tick", x: padL, y: 128 }, "▲ both networks start a cycle together"));
      chart.appendChild(svg("text", { class: "c-tick", x: padL, y: 12 }, "Step within each network's cycle, rounds 1 to " + HORIZON));

      big.innerHTML = "";
      big.appendChild(document.createTextNode("The two cycles line up every "));
      big.appendChild(el("strong", { text: String(al.period) }));
      big.appendChild(document.createTextNode(" rounds (rounds " + al.starts.slice(0, 4).map(function (r) { return r + 1; }).join(", ") + ", …)."));
      ddCounts.textContent = "A uses " + c[0] + (c[0] > sim.a ? " (" + (c[0] - sim.a) + " empty slot" + (c[0] - sim.a > 1 ? "s" : "") + ")" : "") + ", B uses " + c[1] + (c[1] > sim.b ? " (" + (c[1] - sim.b) + " empty slot" + (c[1] - sim.b > 1 ? "s" : "") + ")" : "") + ". The cycles repeat together every lcm(" + c[0] + ", " + c[1] + ") = " + al.period + " rounds.";
      var sameIn = al.same.filter(function (r) { return r < al.period; }).length;
      ddSame.textContent = plural(sameIn, "round", "rounds") + " in every " + al.period + " (" + al.same.slice(0, 8).map(function (r) { return r + 1; }).join(", ") + (al.same.length > 8 ? ", …" : "") + "). Full alignment, with both cycles starting together, comes once per period.";

      var tot = E.cliqueTotals([{ size: sim.a, count: c[0] }, { size: sim.b, count: c[1] }], al.period);
      events.textContent = "";
      var tab = el("table", { class: "results-table sc-events" });
      tab.appendChild(el("thead", null, [el("tr", null, ["Over one joint period of " + al.period + " rounds", "Count", "Per round"].map(function (h) { return el("th", { text: h }); }))]));
      var tb = el("tbody");
      [["Valid: a pair inside one network", tot.valid], ["Invalid: a pair across networks", tot.invalid], ["Collision: both networks address one number", tot.collision], ["Inactive: addressed an empty slot", tot.inactive], ["Checkpoint: a device pairs with itself", tot.self]].forEach(function (row) {
        tb.appendChild(el("tr", null, [el("td", { text: row[0] }), el("td", { class: "w-mono", text: String(row[1]) }), el("td", { class: "w-mono", text: (row[1] / al.period).toFixed(2) })]));
      });
      tab.appendChild(tb);
      events.appendChild(el("div", { class: "sc-table-wrap" }, [tab]));
      events.appendChild(el("p", { class: "w-note", text: "Event rules are this page's reading of the article's Figure 3 (both networks share one channel and one round counter, and a number names a device in each network that has it). The article defines the categories but reports no counts." }));
    }
    resizers.push(draw);
    draw();
  }

  /* ------------------------------------------------------------ boot */

  [["sc-cycle", mountCycle], ["sc-join", mountJoin], ["sc-shuffle", mountShuffle], ["sc-cliques", mountCliques]].forEach(function (m) {
    var root = document.getElementById(m[0]);
    if (!root) return;
    try { m[1](root); root.classList.add("w-ready"); }
    catch (err) { root.appendChild(el("p", { class: "w-note", text: "This demo could not start (" + err.message + ")." })); }
  });
})();

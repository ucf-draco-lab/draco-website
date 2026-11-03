/*
  DP-GCN widget for /papers/gcn-private-attributes/.
  Mount points: #dp-friends, #dp-columns, #dp-subspace, #dp-run, #dp-tables.
  Shared state: the data split (seed) and the share of users who reveal
  their gender. Every number is computed from the German credit graph in
  german.json by dpgcn-engine.js, or copied from the paper's Tables 1 and 2.
*/
(function () {
  "use strict";

  var E = window.DPGCN;
  if (!E) return;

  var SVGNS = "http://www.w3.org/2000/svg";
  var BASE = (document.currentScript && document.currentScript.src)
    ? document.currentScript.src.replace(/widget\.js(\?.*)?$/, "")
    : "";

  /* ------------------------------------------------------------ paper tables */

  var DATASETS = ["Pokec-z", "Pokec-n", "German credit", "Recidivism", "Credit defaulter"];
  var METHODS = ["GCN", "LA-GCN", "RGCN", "SGCN", "DP-GCN"];
  // [mean, sd] per dataset, Table 1 (classification, higher is better)
  var T1 = {
    "GCN":    [[84.47, 0.13], [86.72, 0.43], [72.80, 1.79], [93.25, 0.25], [80.44, 0.24]],
    "LA-GCN": [[85.63, 0.53], [87.62, 0.64], [72.91, 1.68], [92.13, 0.53], [79.87, 0.44]],
    "RGCN":   [[84.26, 0.08], [86.34, 0.12], [70.70, 1.99], [90.19, 0.59], [79.74, 0.32]],
    "SGCN":   [[84.05, 0.32], [86.39, 0.14], [71.5, 3.38],  [89.96, 0.56], [80.40, 0.29]],
    "DP-GCN": [[84.49, 0.11], [86.69, 0.19], [72.10, 2.56], [91.78, 0.76], [78.78, 0.91]]
  };
  // Table 2 (privacy inference, lower is better)
  var T2 = {
    "GCN":    [[77.35, 1.29], [77.19, 2.01], [92.17, 1.93], [58.55, 0.51], [91.13, 0.42]],
    "LA-GCN": [[78.21, 1.71], [77.58, 2.09], [93.14, 2.11], [54.93, 1.46], [91.08, 0.40]],
    "RGCN":   [[72.19, 0.39], [71.14, 0.26], [91.31, 2.69], [54.95, 0.44], [90.93, 0.33]],
    "SGCN":   [[79.31, 0.25], [81.60, 0.37], [92.57, 1.57], [54.98, 0.57], [90.85, 0.42]],
    "DP-GCN": [[72.06, 1.22], [72.99, 2.09], [87.26, 3.84], [54.87, 0.97], [90.62, 0.51]]
  };
  var SENS = ["region", "region", "gender", "race", "age"];

  /* ------------------------------------------------------------ state */

  var state = {
    level: window.PaperKit ? window.PaperKit.level() : "public",
    known: 0.3,
    seed: 0,
    D: null, raw: null, pre: null
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
    var w = node && node.parentNode ? node.parentNode.clientWidth : 640;
    return Math.max(300, Math.min(760, w || 640));
  }
  var resizers = [], resizeTimer = null;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () { resizers.forEach(function (fn) { fn(); }); }, 150);
  });
  function seg(options, value, onPick, label) {
    var wrap = el("div", { class: "seg", role: "radiogroup", "aria-label": label }), btns = [];
    options.forEach(function (o) {
      var b = el("button", { type: "button", class: "seg-option", role: "radio", "aria-checked": String(o.value === value), text: o.label });
      if (o.title) b.title = o.title;
      if (o.levels) b.setAttribute("data-levels", o.levels);
      b.addEventListener("click", function () { set(o.value); onPick(o.value); });
      wrap.appendChild(b); btns.push({ b: b, v: o.value });
    });
    function set(v) { value = v; btns.forEach(function (x) { x.b.setAttribute("aria-checked", String(x.v === v)); }); }
    wrap.set = set;
    return wrap;
  }
  function labeled(label, control, levels) {
    var row = el("div", { class: "dp-ctl" }, [el("span", { class: "dp-ctl-label", text: label }), control]);
    if (levels) row.setAttribute("data-levels", levels);
    return row;
  }
  function pct(x, d) { return x == null || isNaN(x) ? "–" : (x * 100).toFixed(d == null ? 1 : d) + "%"; }
  function pretty(name) {
    var map = { geq: "≥", lt: "<" };
    return name.replace(/_(geq|lt)_(\d+)/, function (_, op, v) { return " " + map[op] + " " + v; })
      .replace(/([a-z])([A-Z])/g, "$1 $2").replace(/_/g, " ");
  }
  var SHARES = [0.1, 0.3, 0.5, 0.7, 0.9];
  function knownSeg() {
    var s = seg(SHARES.map(function (v) { return { value: v, label: Math.round(v * 100) + "%" }; }), state.known,
      function (v) { state.known = v; changed("known"); }, "Share of users who reveal their gender");
    onChange(function (w) { if (w === "known") s.set(state.known); });
    return s;
  }
  function currentSplit() { return E.split(state.D.n, 100 + state.seed, 10 + state.seed, state.known); }

  /* ------------------------------------------------------------ guesses */

  function guessFriends(D, sp) {
    var known = new Int8Array(D.n).fill(-1), base = 0;
    sp.known.forEach(function (i) { known[i] = D.s[i]; base += D.s[i]; });
    var prior = base / sp.known.length >= 0.5 ? 1 : 0, A = D.A;
    return sp.hidden.map(function (i) {
      var a = 0, b = 0;
      for (var p = A.ptr[i]; p < A.ptr[i + 1]; p++) { var j = A.col[p]; if (j !== i && known[j] >= 0) { if (known[j]) b++; else a++; } }
      return { i: i, guess: a === b ? prior : (b > a ? 1 : 0), women: b, men: a };
    });
  }
  function guessColumn(D, sp, col) {
    var cnt = [[0, 0], [0, 0]];
    sp.known.forEach(function (i) { cnt[D.X[i * D.d + col] > 0 ? 1 : 0][D.s[i]]++; });
    var rule = [cnt[0][1] > cnt[0][0] ? 1 : 0, cnt[1][1] > cnt[1][0] ? 1 : 0];
    return sp.hidden.map(function (i) { return { i: i, guess: rule[D.X[i * D.d + col] > 0 ? 1 : 0] }; });
  }
  function guessMajority(D, sp) {
    var f = 0; sp.known.forEach(function (i) { f += D.s[i]; });
    var g = f / sp.known.length >= 0.5 ? 1 : 0;
    return sp.hidden.map(function (i) { return { i: i, guess: g }; });
  }
  function score(D, gs) { var ok = 0; gs.forEach(function (g) { if (g.guess === D.s[g.i]) ok++; }); return ok / gs.length; }

  /* ------------------------------------------------------------ demo 1: friends */

  function mountFriends(root) {
    root.classList.add("w-ready");
    var how = "friends";
    var hSeg = seg([
      { value: "friends", label: "Friends' answers", title: "Guess the answer most of the user's revealing friends gave" },
      { value: "single", label: "One column: Single", title: "Guess from the Single column alone" },
      { value: "majority", label: "Most common answer", title: "Guess the answer most revealing users gave, for everyone" }
    ], how, function (v) { how = v; draw(); }, "How the attacker guesses");
    var chart = svg("svg", { class: "dp-chart", role: "img" });
    var big = el("p", { class: "w-big" }), read = el("p", { class: "w-note" }), key = el("p", { class: "w-note dp-key", html:
      '<span class="dp-sw ok"></span>guessed right &nbsp; <span class="dp-sw bad"></span>guessed wrong &nbsp; Each square is one private user.' });
    root.appendChild(el("div", { class: "dp-ctrls" }, [labeled("Attacker uses", hSeg), labeled("Users revealing", knownSeg())]));
    root.appendChild(big); root.appendChild(chart); root.appendChild(key); root.appendChild(read);
    function draw() {
      var D = state.D, sp = currentSplit();
      var gs = how === "friends" ? guessFriends(D, sp) : how === "single" ? guessColumn(D, sp, D.names.indexOf("Single")) : guessMajority(D, sp);
      var acc = score(D, gs), right = Math.round(acc * gs.length);
      big.innerHTML = "<strong>" + right + "</strong> of " + gs.length + " private users guessed right (" + pct(acc) + ")";
      var W = chartWidth(chart), cell = W < 420 ? 10 : 12, cols = Math.floor((W - 2) / cell), rows = Math.ceil(gs.length / cols);
      chart.innerHTML = "";
      chart.setAttribute("viewBox", "0 0 " + W + " " + (rows * cell + 2));
      chart.setAttribute("aria-label", right + " of " + gs.length + " private users guessed correctly");
      gs.forEach(function (g, q) {
        var ok = g.guess === D.s[g.i], x = 1 + (q % cols) * cell, y = 1 + Math.floor(q / cols) * cell;
        var r = svg("rect", { x: x + 1, y: y + 1, width: cell - 3, height: cell - 3, class: ok ? "dp-cell ok" : "dp-cell bad" });
        var t = "User " + (g.i + 1) + ": " + (D.s[g.i] ? "woman" : "man") + ", guessed " + (g.guess ? "woman" : "man");
        if (how === "friends") t += " (revealing friends: " + g.women + " women, " + g.men + " men)";
        r.appendChild(svg("title", null, t));
        chart.appendChild(r);
      });
      var maj = score(D, guessMajority(D, sp));
      read.textContent = sp.known.length + " of the 500 training users reveal their gender; the other " + sp.hidden.length +
        " keep it private. Guessing “man” for everyone scores " + pct(maj) + ", since 69 percent of the 1,000 applicants are men. Split " + (state.seed + 1) + " of 10.";
    }
    onChange(function (w) { if (w === "known" || w === "seed") draw(); });
    resizers.push(draw);
    draw();
  }

  /* ------------------------------------------------------------ demo 2: columns */

  function mountColumns(root) {
    root.classList.add("w-ready");
    var D = state.D, d = D.d, n = D.n, rows = [], i, c;
    var ms = 0; for (i = 0; i < n; i++) ms += D.s[i]; ms /= n;
    for (c = 0; c < d; c++) {
      var mx = 0; for (i = 0; i < n; i++) mx += D.X[i * d + c]; mx /= n;
      var sxy = 0, sxx = 0, syy = 0;
      for (i = 0; i < n; i++) { var a = D.X[i * d + c] - mx, b = D.s[i] - ms; sxy += a * b; sxx += a * a; syy += b * b; }
      rows.push({ c: c, name: D.names[c], r: sxy / Math.sqrt(sxx * syy) });
    }
    rows.sort(function (p, q) { return Math.abs(q.r) - Math.abs(p.r); });
    var top = rows.slice(0, 10), pick = top[0].c;
    var chart = svg("svg", { class: "dp-chart", role: "img", "aria-label": "Correlation of each attribute with gender" });
    var read = el("p", { class: "w-note" });
    root.appendChild(chart); root.appendChild(read);
    function draw() {
      var W = chartWidth(chart), narrow = W < 480, rowH = narrow ? 38 : 26, L = narrow ? 8 : 210, R = 46, H = top.length * rowH + 28;
      var mid = L + (W - L - R) / 2, half = (W - L - R) / 2;
      chart.innerHTML = "";
      chart.setAttribute("viewBox", "0 0 " + W + " " + H);
      chart.appendChild(svg("line", { x1: mid, x2: mid, y1: 4, y2: H - 20, class: "c-grid" }));
      [-1, -0.5, 0.5, 1].forEach(function (t) {
        chart.appendChild(svg("text", { x: mid + t * half, y: H - 6, class: "c-tick", "text-anchor": "middle" }, String(t)));
      });
      chart.appendChild(svg("text", { x: mid, y: H - 6, class: "c-tick", "text-anchor": "middle" }, "0"));
      top.forEach(function (r, q) {
        var y = 6 + q * rowH, x2 = mid + r.r * half;
        var g = svg("g", { class: "dp-bar-row" + (r.c === pick ? " on" : ""), tabindex: "0", role: "button" });
        g.appendChild(svg("rect", { x: 0, y: y - 2, width: W, height: rowH - 2, class: "dp-hit" }));
        var by = narrow ? y + 16 : y + 4, bh = narrow ? 14 : rowH - 12;
        g.appendChild(narrow ? svg("text", { x: 0, y: y + 10, class: "c-label" }, pretty(r.name))
          : svg("text", { x: L - 8, y: y + 14, class: "c-label", "text-anchor": "end" }, pretty(r.name)));
        g.appendChild(svg("rect", { x: Math.min(mid, x2), y: by, width: Math.max(1, Math.abs(x2 - mid)), height: bh, class: "dp-bar" + (r.c === pick ? " on" : "") }));
        g.appendChild(svg("text", { x: W - 4, y: by + bh - 3, class: "c-tick", "text-anchor": "end" }, r.r.toFixed(2)));
        g.appendChild(svg("title", null, pretty(r.name) + ": correlation with being a woman " + r.r.toFixed(3)));
        function choose() { pick = r.c; draw(); }
        g.addEventListener("click", choose);
        g.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); choose(); } });
        chart.appendChild(g);
      });
      var sp = currentSplit(), acc = score(D, guessColumn(D, sp, pick));
      var vals = {}, women = {};
      for (i = 0; i < n; i++) { var v = state.raw.x[i][pick]; vals[v] = (vals[v] || 0) + 1; women[v] = (women[v] || 0) + D.s[i]; }
      var keys = Object.keys(vals), text = "";
      if (keys.length === 2) {
        text = keys.sort().map(function (k) { return pretty(state.raw.names[pick]) + " = " + k + ": " + vals[k] + " applicants, " + women[k] + " women"; }).join("; ") + ". ";
      } else {
        text = pretty(state.raw.names[pick]) + " takes " + keys.length + " values. ";
      }
      read.textContent = text + "Guessing gender from this one column (split at the middle of its range, rule learned from the revealing users) is right for " +
        pct(acc) + " of the " + sp.hidden.length + " private users. Correlations use all 1,000 applicants. Pick a row to try another column.";
    }
    onChange(function (w) { if (w === "known" || w === "seed") draw(); });
    resizers.push(draw);
    draw();
  }

  /* ------------------------------------------------------------ demo 3: subspace */

  function probeFit(D, Xin, sp) {
    var d = D.d + 1, M = new Float64Array(d * d), v = new Float64Array(d), a, b;
    sp.known.forEach(function (r) {
      for (a = 0; a < d; a++) { var za = a < D.d ? Xin[r * D.d + a] : 1; v[a] += za * D.s[r];
        for (b = 0; b < d; b++) M[a * d + b] += za * (b < D.d ? Xin[r * D.d + b] : 1); }
    });
    for (a = 0; a < d; a++) M[a * d + a] += 1e-6 * sp.known.length;
    var w = E.solve(M, v, d), sc = new Float64Array(D.n);
    for (var i = 0; i < D.n; i++) { var t = w[D.d]; for (a = 0; a < D.d; a++) t += Xin[i * D.d + a] * w[a]; sc[i] = t; }
    return sc;
  }
  function topPC(D, Xin) {
    var d = D.d, n = D.n, m = new Float64Array(d), i, a, v = new Float64Array(d).fill(1);
    for (i = 0; i < n; i++) for (a = 0; a < d; a++) m[a] += Xin[i * d + a] / n;
    for (var it = 0; it < 60; it++) {
      var nv = new Float64Array(d);
      for (i = 0; i < n; i++) { var t = 0; for (a = 0; a < d; a++) t += (Xin[i * d + a] - m[a]) * v[a];
        for (a = 0; a < d; a++) nv[a] += t * (Xin[i * d + a] - m[a]); }
      var nn = Math.sqrt(E.frob2(nv)) || 1; for (a = 0; a < d; a++) v[a] = nv[a] / nn;
    }
    var out = new Float64Array(n);
    for (i = 0; i < n; i++) { var s = 0; for (a = 0; a < d; a++) s += (Xin[i * d + a] - m[a]) * v[a]; out[i] = s; }
    return out;
  }
  function mountSubspace(root) {
    root.classList.add("w-ready");
    var dir = "ls", after = false;
    var dSeg = seg([
      { value: "ls", label: "The paper's direction (W₁)", title: "The least-squares direction of Eq. 3, the one DP-GCN keeps W₂ orthogonal to" },
      { value: "cov", label: "The correlation direction (page's check)", title: "The cross-covariance direction; removing it leaves no straight-line correlation with gender" }
    ], dir, function (v) { dir = v; draw(); }, "Direction to remove");
    var aSeg = seg([{ value: false, label: "Original features" }, { value: true, label: "Direction removed" }], after,
      function (v) { after = v; draw(); }, "Features the attacker sees");
    var chart = svg("svg", { class: "dp-chart", role: "img" });
    var big = el("p", { class: "w-big" }), read = el("p", { class: "w-note" });
    var theorem = el("p", { class: "w-note", "data-levels": "ug grad res" });
    var key = el("p", { class: "w-note dp-key", html: '<span class="dp-dot-sw f"></span>woman &nbsp; <span class="dp-dot-sw m"></span>man &nbsp; Hollow points revealed their gender; filled points are private.' });
    root.appendChild(el("div", { class: "dp-ctrls" }, [labeled("Remove", dSeg), labeled("Attacker sees", aSeg)]));
    root.appendChild(big); root.appendChild(chart); root.appendChild(key); root.appendChild(read); root.appendChild(theorem);
    var cache = {};
    function compute() {
      var k = dir + "|" + state.known + "|" + state.seed;
      if (cache[k]) return cache[k];
      var D = state.D, d = D.d, n = D.n, sp = currentSplit(), w = E.removalDirection(D, sp, dir), ww = 0, a, b;
      for (a = 0; a < d; a++) ww += w[a] * w[a];
      var W2 = new Float64Array(d * d);
      for (a = 0; a < d; a++) for (b = 0; b < d; b++) W2[a * d + b] = (a === b ? 1 : 0) - w[a] * w[b] / ww;
      var Xt = E.matmul(D.X, W2, n, d, d);
      // Theorem 2 check with W1 = w wᵀ/|w|² (so W2 = I − W1): <W1 x, W2 x> for every user, and ||W1ᵀ W2||
      var W1 = new Float64Array(d * d); for (a = 0; a < d; a++) for (b = 0; b < d; b++) W1[a * d + b] = w[a] * w[b] / ww;
      var orth = Math.sqrt(E.frob2(E.matmulTN(W1, W2, d, d, d))) / (Math.sqrt(E.frob2(W1)) * Math.sqrt(E.frob2(W2)));
      var A1 = E.matmul(D.X, W1, n, d, d), maxDot = 0;
      for (var i = 0; i < n; i++) { var s = 0, ns = 0; for (a = 0; a < d; a++) { s += A1[i * d + a] * Xt[i * d + a]; ns += A1[i * d + a] * A1[i * d + a]; }
        maxDot = Math.max(maxDot, Math.abs(s) / (Math.sqrt(ns) * Math.sqrt(E.frob2(Xt.subarray(i * d, i * d + d))) || 1)); }
      return (cache[k] = { sp: sp, before: probeFit(D, D.X, sp), after: probeFit(D, Xt, sp), pcB: topPC(D, D.X), pcA: topPC(D, Xt), orth: orth, maxCos: maxDot });
    }
    function draw() {
      var D = state.D, c = compute(), sp = c.sp, sc = after ? c.after : c.before, pc = after ? c.pcA : c.pcB;
      var ok = 0; sp.hidden.forEach(function (i) { if ((sc[i] > 0.5 ? 1 : 0) === D.s[i]) ok++; });
      var acc = ok / sp.hidden.length, okB = 0;
      sp.hidden.forEach(function (i) { if ((c.before[i] > 0.5 ? 1 : 0) === D.s[i]) okB++; });
      big.innerHTML = "Straight-line guess: <strong>" + pct(acc) + "</strong> right on " + sp.hidden.length + " private users";
      var W = chartWidth(chart), H = Math.round(Math.min(340, W * 0.6)), L = 34, B = 30, T = 8;
      var lo = -0.6, hi = 1.6, pmin = Infinity, pmax = -Infinity, i;
      for (i = 0; i < D.n; i++) { if (pc[i] < pmin) pmin = pc[i]; if (pc[i] > pmax) pmax = pc[i]; }
      function X(v) { return L + (Math.max(lo, Math.min(hi, v)) - lo) / (hi - lo) * (W - L - 8); }
      function Y(v) { return T + (pmax - v) / ((pmax - pmin) || 1) * (H - T - B); }
      chart.innerHTML = "";
      chart.setAttribute("viewBox", "0 0 " + W + " " + H);
      chart.setAttribute("aria-label", "Each applicant placed by the attacker's straight-line score; " + pct(acc) + " of private users guessed right");
      chart.appendChild(svg("line", { x1: X(0.5), x2: X(0.5), y1: T, y2: H - B, class: "c-ref" }));
      [0, 0.5, 1].forEach(function (t) { chart.appendChild(svg("text", { x: X(t), y: H - B + 14, class: "c-tick", "text-anchor": "middle" }, String(t))); });
      chart.appendChild(svg("text", { x: L + 4, y: H - 4, class: "c-label" }, "← guessed man · attacker's score · guessed woman →"));
      chart.appendChild(svg("text", { x: 10, y: T + 10, class: "c-tick", transform: "rotate(-90 10 " + (T + 10) + ")", "text-anchor": "end" }, "spread"));
      var knownSet = {}; sp.known.forEach(function (j) { knownSet[j] = 1; });
      for (i = 0; i < D.n; i++) {
        chart.appendChild(svg("circle", { cx: X(sc[i]).toFixed(1), cy: Y(pc[i]).toFixed(1), r: 2.6,
          class: "dp-pt " + (D.s[i] ? "f" : "m") + (knownSet[i] ? " known" : "") }));
      }
      read.textContent = (after
        ? (dir === "ls"
          ? "After removing the paper's direction, the attacker refits a straight line on what is left and still finds gender: the women stay to the right."
          : "After removing the correlation direction, the refitted straight line has nothing to work with: every applicant lands on the same side, and the guess equals “man” for everyone.")
        : "Before removal, a straight line fitted to the " + sp.known.length + " revealing users separates most women from most men.") +
        " Before removal the same guess scored " + pct(okB / sp.hidden.length) + ". Points past 1.6 or below −0.6 are drawn at the edge.";
      theorem.textContent = "Theorem 2 check, with W₁ = wwᵀ/|w|² and W₂ = I − W₁: the normalized |W₁ᵀW₂| is " +
        c.orth.toExponential(1) + ", and the largest cosine between W₁x and W₂x over all 1,000 applicants is " + c.maxCos.toExponential(1) +
        ". The two pieces are orthogonal, as the theorem says, whichever direction is removed.";
    }
    onChange(function (w) { if (w === "known" || w === "seed") draw(); });
    resizers.push(draw);
    draw();
  }

  /* ------------------------------------------------------------ demo 4: run */

  var VALS = [0.1, 0.5, 1, 5, 10];
  function mountRun(root) {
    root.classList.add("w-ready");
    var method = "dpgcn", hp = { alpha: 1, beta: 5, gamma: 1 }, worker = null, result = null, hist = [];
    var mSeg = seg([
      { value: "gcn", label: "Plain GCN" },
      { value: "dpgcn", label: "DP-GCN" },
      { value: "ls", label: "W₁ removed exactly", levels: "grad res", title: "Page's check: W₂ = I − wwᵀ/|w|² with the paper's least-squares direction" },
      { value: "cov", label: "Correlation removed", levels: "grad res", title: "Page's check: remove the cross-covariance direction" }
    ], method, function (v) { method = v; result = null; hist = []; draw(); }, "Model");
    function hpSeg(name) {
      return seg(VALS.map(function (v) { return { value: v, label: String(v) }; }), hp[name], function (v) { hp[name] = v; }, name);
    }
    var seedSel = seg([0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(function (v) { return { value: v, label: String(v + 1) }; }), state.seed,
      function (v) { state.seed = v; changed("seed"); }, "Data split");
    onChange(function (w) { if (w === "seed") seedSel.set(state.seed); });
    var run = el("button", { type: "button", class: "w-btn", text: "Train and attack" });
    var status = el("p", { class: "w-note dp-status" });
    var chart = svg("svg", { class: "dp-chart", role: "img", "data-levels": "ug grad res" });
    var table = el("div", { class: "dp-table-wrap" });
    root.appendChild(el("div", { class: "dp-ctrls" }, [
      labeled("Model", mSeg),
      labeled("Users revealing", knownSeg(), "ug grad res"),
      labeled("Data split", seedSel, "ug grad res"),
      labeled("α (sensitive fit)", hpSeg("alpha"), "grad res"),
      labeled("β (orthogonality)", hpSeg("beta"), "grad res"),
      labeled("γ (task loss in W₂)", hpSeg("gamma"), "grad res")
    ]));
    root.appendChild(el("div", { class: "w-actions" }, [run, status]));
    root.appendChild(table); root.appendChild(chart);
    run.addEventListener("click", function () {
      if (worker) { worker.terminate(); worker = null; run.textContent = "Train and attack"; run.classList.remove("running"); status.textContent = "Stopped."; return; }
      result = null; hist = []; draw();
      try { worker = new Worker(BASE + "dp-worker.js"); } catch (err) { status.textContent = "This browser could not start a background worker."; return; }
      run.textContent = "Stop"; run.classList.add("running");
      var t0 = Date.now();
      worker.onmessage = function (e) {
        var m = e.data;
        if (m.type === "progress") {
          status.textContent = "Training on your device: step " + m.epoch + " of " + m.total + (m.orth != null ? " · |W₁ᵀW₂| " + m.orth.toFixed(3) : "");
          if (m.orth != null) { hist.push(m.orth); drawChart(); }
        } else if (m.type === "result") {
          result = m.result; if (m.result.hist) hist = m.result.hist;
          status.textContent = "Done in " + ((Date.now() - t0) / 1000).toFixed(1) + " s.";
          worker.terminate(); worker = null; run.textContent = "Train and attack"; run.classList.remove("running");
          draw();
        }
      };
      worker.postMessage({ data: state.raw, method: method, seed: state.seed,
        opts: { known: state.known, alpha: hp.alpha, beta: hp.beta, gamma: hp.gamma } });
    });
    function preStats(key) {
      var runs = state.pre.runs, map = { gcn: ["gcnAcc", "gcnPriv"], dpgcn: ["dpAcc", "dpPriv"], ls: ["lsAcc", "lsPriv"], cov: ["covAcc", "covPriv"] }[key];
      return [E.stats(runs.map(function (r) { return r[map[0]]; })), E.stats(runs.map(function (r) { return r[map[1]]; }))];
    }
    function ms(s) { return (100 * s.mean).toFixed(2) + " ± " + (100 * s.sd).toFixed(2); }
    function draw() {
      var label = { gcn: "Plain GCN", dpgcn: "DP-GCN", ls: "W₁ removed exactly (page)", cov: "Correlation removed (page)" }[method];
      var ps = preStats(method), paperKey = method === "gcn" ? "GCN" : method === "dpgcn" ? "DP-GCN" : null;
      var defaults = state.known === 0.3 && hp.alpha === 1 && hp.beta === 5 && hp.gamma === 1;
      var rows = '<table class="results-table dp-num"><thead><tr><th>' + label + ' on German credit</th><th>Classification accuracy (higher is better)</th><th>Gender guessed (lower is better)</th></tr></thead><tbody>';
      rows += "<tr class=\"dp-current\"><td>This run, split " + (state.seed + 1) + (result ? " (" + result.test + " test users, " + result.hidden + " private users)" : "") + "</td><td>" +
        (result ? pct(result.accuracy, 2) : "press Train") + "</td><td>" + (result ? pct(result.privacy, 2) : "–") + "</td></tr>";
      rows += "<tr><td>This page, 10 runs at the paper's settings" + (method === "dpgcn" ? " (α = 1, β = 5, γ = 1)" : "") + "</td><td>" + ms(ps[0]) + "</td><td>" + ms(ps[1]) + "</td></tr>";
      if (paperKey) rows += "<tr><td>Paper, Tables 1 and 2 (10 runs)</td><td>" + T1[paperKey][2][0].toFixed(2) + " ± " + T1[paperKey][2][1].toFixed(2) +
        "</td><td>" + T2[paperKey][2][0].toFixed(2) + " ± " + T2[paperKey][2][1].toFixed(2) + "</td></tr>";
      rows += "</tbody></table>";
      table.innerHTML = rows + '<p class="w-note">Guessing the most common answer scores about 70 percent on both columns (700 of 1,000 applicants are good credit risks; 690 are men).' +
        (defaults ? "" : " This run's settings differ from the ten-run rows.") + "</p>";
      drawChart();
    }
    function drawChart() {
      var W = chartWidth(chart), H = 168, L = 40, B = 44, T = 8;
      chart.innerHTML = "";
      chart.setAttribute("viewBox", "0 0 " + W + " " + H);
      if (method !== "dpgcn") { chart.setAttribute("aria-label", "Orthogonality chart applies to DP-GCN only"); chart.appendChild(svg("text", { x: L, y: 40, class: "c-label" }, "The orthogonality trace applies to DP-GCN runs.")); return; }
      chart.setAttribute("aria-label", "Normalized size of W1 transpose W2 over training epochs");
      var pre = state.pre.orth, ep = state.pre.orthEpochs, top = 0.25;
      function X(e) { return L + e / 299 * (W - L - 10); }
      function Y(v) { return T + (1 - Math.min(v, top) / top) * (H - T - B); }
      [0, 0.1, 0.2].forEach(function (t) { chart.appendChild(svg("line", { x1: L, x2: W - 10, y1: Y(t), y2: Y(t), class: "c-grid" }));
        chart.appendChild(svg("text", { x: L - 6, y: Y(t) + 4, class: "c-tick", "text-anchor": "end" }, String(t))); });
      [0, 100, 200, 300].forEach(function (t) { chart.appendChild(svg("text", { x: X(Math.min(t, 299)), y: H - B + 14, class: "c-tick", "text-anchor": "middle" }, String(t))); });
      chart.appendChild(svg("text", { x: L, y: H - 4, class: "c-label" }, "epoch · |W₁ᵀW₂| / (|W₁||W₂|), 0 = orthogonal"));
      chart.appendChild(svg("path", { d: ep.map(function (e, q) { return (q ? "L" : "M") + X(e).toFixed(1) + " " + Y(pre[q]).toFixed(1); }).join(""), class: "dp-line pre" }));
      if (hist.length) {
        var n = hist.length, total = result ? n : 300;
        chart.appendChild(svg("path", { d: hist.map(function (v, q) { return (q ? "L" : "M") + X(q * 299 / Math.max(1, total - 1)).toFixed(1) + " " + Y(v).toFixed(1); }).join(""), class: "dp-line now" }));
      }
    }
    onChange(function (w) { if (w === "known" || w === "seed") { result = null; hist = []; draw(); } });
    resizers.push(drawChart);
    draw();
  }

  /* ------------------------------------------------------------ demo 5: tables */

  function mountTables(root) {
    root.classList.add("w-ready");
    var ds = 2;
    var dSeg = seg(DATASETS.map(function (n, q) { return { value: q, label: n }; }), ds, function (v) { ds = v; draw(); }, "Data set");
    var chart = svg("svg", { class: "dp-chart", role: "img" }), read = el("p", { class: "w-note" });
    root.appendChild(el("div", { class: "dp-ctrls" }, [labeled("Data set", dSeg)]));
    root.appendChild(chart); root.appendChild(read);
    function panel(g, x0, w, title, T, lowGood, y0, rowH) {
      var vals = METHODS.map(function (m) { return T[m][ds]; }), lo = Infinity, hi = -Infinity;
      vals.forEach(function (v) { lo = Math.min(lo, v[0] - v[1]); hi = Math.max(hi, v[0] + v[1]); });
      var pad = Math.max(0.5, (hi - lo) * 0.15); lo = Math.floor(lo - pad); hi = Math.ceil(hi + pad);
      function X(v) { return x0 + (v - lo) / (hi - lo) * w; }
      g.appendChild(svg("text", { x: x0, y: y0 - 8, class: "c-label" }, title + (lowGood ? " (lower is better)" : " (higher is better)")));
      METHODS.forEach(function (m, q) {
        var y = y0 + q * rowH + rowH / 2, v = T[m][ds], cls = m === "DP-GCN" ? "dp-pt-m on" : "dp-pt-m";
        g.appendChild(svg("line", { x1: x0, x2: x0 + w, y1: y, y2: y, class: "c-grid" }));
        g.appendChild(svg("line", { x1: X(v[0] - v[1]), x2: X(v[0] + v[1]), y1: y, y2: y, class: "dp-err" + (m === "DP-GCN" ? " on" : "") }));
        var c = svg("circle", { cx: X(v[0]), cy: y, r: 4.5, class: cls });
        c.appendChild(svg("title", null, m + ": " + v[0].toFixed(2) + " ± " + v[1].toFixed(2)));
        g.appendChild(c);
      });
      [lo, hi].forEach(function (t) { g.appendChild(svg("text", { x: X(t), y: y0 + METHODS.length * rowH + 12, class: "c-tick", "text-anchor": "middle" }, String(t))); });
    }
    function draw() {
      var W = chartWidth(chart), narrow = W < 560, rowH = 24, Lab = 64, gap = 24;
      var pw = narrow ? W - Lab - 10 : (W - Lab - gap - 10) / 2;
      var H = narrow ? 2 * (METHODS.length * rowH + 44) + 10 : METHODS.length * rowH + 52;
      chart.innerHTML = "";
      chart.setAttribute("viewBox", "0 0 " + W + " " + H);
      chart.setAttribute("aria-label", "Tables 1 and 2 of the paper for " + DATASETS[ds]);
      var g = svg("g");
      var blocks = narrow ? [[Lab, 24], [Lab, 24 + METHODS.length * rowH + 44]] : [[Lab, 24], [Lab + pw + gap, 24]];
      blocks.forEach(function (b, q) {
        if (q === 0 || narrow) METHODS.forEach(function (m, r) {
          g.appendChild(svg("text", { x: Lab - 8, y: b[1] + r * rowH + rowH / 2 + 4, class: "c-label" + (m === "DP-GCN" ? " dp-hl" : ""), "text-anchor": "end" }, m));
        });
      });
      panel(g, blocks[0][0], pw, "Classification accuracy, %", T1, false, blocks[0][1], rowH);
      panel(g, blocks[1][0], pw, "Private " + SENS[ds] + " guessed, %", T2, true, blocks[1][1], rowH);
      chart.appendChild(g);
      var rc = function (a, b) { return 100 * (a - b) / b; };
      var dpc = T1["DP-GCN"][ds][0], dpp = T2["DP-GCN"][ds][0];
      read.textContent = "Paper's values; bars are ± one standard deviation over 10 runs. Against plain GCN, DP-GCN changes classification accuracy by " +
        rc(dpc, T1.GCN[ds][0]).toFixed(2) + "% and the attacker's accuracy by " + rc(dpp, T2.GCN[ds][0]).toFixed(2) +
        "% (relative changes, the paper's Figure 4a). In points: " + (dpc - T1.GCN[ds][0]).toFixed(2) + " and " + (dpp - T2.GCN[ds][0]).toFixed(2) + ".";
    }
    resizers.push(draw);
    draw();
  }

  /* ------------------------------------------------------------ boot */

  var MOUNTS = { "dp-friends": mountFriends, "dp-columns": mountColumns, "dp-subspace": mountSubspace, "dp-run": mountRun, "dp-tables": mountTables };
  function boot() {
    var tables = document.getElementById("dp-tables");
    if (tables) mountTables(tables);
    Promise.all([fetch(BASE + "german.json").then(function (r) { return r.json(); }), fetch(BASE + "precomputed.json").then(function (r) { return r.json(); })])
      .then(function (res) {
        state.raw = res[0]; state.pre = res[1]; state.D = E.prepare(res[0]);
        Object.keys(MOUNTS).forEach(function (id) {
          if (id === "dp-tables") return;
          var node = document.getElementById(id);
          if (node) MOUNTS[id](node);
        });
      })
      .catch(function () {
        Object.keys(MOUNTS).forEach(function (id) {
          var node = document.getElementById(id);
          if (node && id !== "dp-tables") { node.classList.add("w-ready"); node.appendChild(el("p", { class: "w-note", text: "The data for this demo did not load." })); }
        });
      });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();

/*
  Router canaries widget for /papers/router-canaries/.
  Mount points: #rc-net, #rc-window, #rc-baseline, #rc-grid.
  One shared state: switches s, attacker share c, canaries n, and the seed.
  Every simulated figure comes from canary-engine.js and is labeled simulated.
*/
(function () {
  "use strict";

  var E = window.RouterCanary;
  if (!E) return;

  var SVGNS = "http://www.w3.org/2000/svg";
  var DATA_URL = (document.currentScript && document.currentScript.src)
    ? document.currentScript.src.replace(/widget\.js(\?.*)?$/, "canary-data.json")
    : "canary-data.json";

  /* ------------------------------------------------------------ paper data */

  var CS = [0, 0.25, 0.5, 0.75, 1];
  var NS = [6, 5, 4, 3, 2, 1];
  // Table I, baseline entropy (30 attack-free trials per topology)
  var TABLE1 = {
    3: { min: 2.6567, max: 3.7860, mean: 3.3457, sd: 0.1710, threshold: 3.0111 },
    6: { min: 2.6917, max: 4.5782, mean: 3.8000, sd: 0.2413, threshold: 3.4200 },
    9: { min: 2.4268, max: 4.7683, mean: 3.7545, sd: 0.2822, threshold: 3.3790 }
  };
  // Table II, mean detection time in packets, six switches; rows c, columns n = 6..1
  var TABLE2 = {
    "0": [9623, null, null, null, null, null],
    "0.25": [1818, 3120, 2290, 2645, 3139, 3805],
    "0.5": [469, 605, 651, 658, 519, 1250],
    "0.75": [357, 467, 528, 464, 448, 327],
    "1": [310, 429, 433, 378, 355, 250]
  };
  // Table III, detection rate (percent), six switches, 15 trials per cell
  var TABLE3 = {
    "0": [6, 0, 0, 0, 0, 0],
    "0.25": [100, 100, 93, 86, 93, 66],
    "0.5": [100, 100, 100, 100, 100, 93],
    "0.75": [100, 100, 100, 100, 100, 100],
    "1": [100, 100, 100, 100, 100, 100]
  };

  /* ------------------------------------------------------------ state */

  var state = {
    s: 6, c: 0.25, n: 6, seed: 1,
    level: window.PaperKit ? window.PaperKit.level() : "public",
    data: null,
    run: null,          // current trial for demo 1
    playT: 0,           // seconds into the capture
    win: null           // window shown in demo 2 {counts, source}
  };
  var listeners = [];
  function onChange(fn) { listeners.push(fn); }
  function changed(what) { listeners.forEach(function (fn) { fn(what); }); }
  document.addEventListener("paperlevel", function (e) { state.level = e.detail.level; changed("level"); });
  function deep() { return state.level === "grad" || state.level === "res"; }
  function atLeastUg() { return state.level === "ug" || deep(); }

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
    function build(opts) {
      wrap.innerHTML = ""; btns = [];
      opts.forEach(function (o) {
        var b = el("button", { type: "button", class: "seg-option", role: "radio", "aria-checked": String(o.value === value), text: o.label });
        if (o.title) b.title = o.title;
        b.addEventListener("click", function () { value = o.value; set(o.value); onPick(o.value); });
        wrap.appendChild(b);
        btns.push({ b: b, v: o.value });
      });
    }
    function set(v) { value = v; btns.forEach(function (x) { x.b.setAttribute("aria-checked", String(x.v === v)); }); }
    build(options);
    wrap.set = set;
    wrap.rebuild = function (opts, v) { value = v; build(opts); };
    return wrap;
  }
  function labeled(label, control, levels) {
    var row = el("div", { class: "rc-ctl" }, [el("span", { class: "rc-ctl-label", text: label }), control]);
    if (levels) row.setAttribute("data-levels", levels);
    return row;
  }
  function fmt(x, d) { return x == null ? "–" : Number(x).toFixed(d == null ? 2 : d); }
  function int(x) { return x == null ? "–" : Math.round(x).toLocaleString("en-US"); }
  function pctLabel(c) { return Math.round(c * 100) + "%"; }
  function words(n) { return ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"][n] || String(n); }
  function cellPaper(c, n) {
    var k = NS.indexOf(n);
    return { rate: TABLE3[String(c)][k], packets: TABLE2[String(c)][k] };
  }

  /* ------------------------------------------------------------ demo 1: the network */

  function mountNet(root) {
    root.classList.add("w-ready");
    var sSeg = seg([3, 6, 9].map(function (v) { return { value: v, label: String(v) }; }), state.s, function (v) {
      state.s = v; if (state.n > v) state.n = v; rebuildN(); newRun();
    }, "Switches");
    var cSeg = seg(CS.map(function (v) { return { value: v, label: pctLabel(v) }; }), state.c, function (v) { state.c = v; newRun(); }, "Share of hosts attacking");
    var nSeg = seg([], state.n, function (v) { state.n = v; newRun(); }, "Canaries");
    function rebuildN() {
      var opts = []; for (var k = 1; k <= state.s; k++) opts.push({ value: k, label: String(k) });
      nSeg.rebuild(opts, state.n);
    }
    rebuildN();
    var speeds = [{ value: 5, label: "5×" }, { value: 20, label: "20×" }, { value: 80, label: "80×" }];
    var speed = 20;
    var spSeg = seg(speeds, speed, function (v) { speed = v; }, "Playback speed");

    var playBtn = el("button", { type: "button", class: "w-btn", text: "Play" });
    var newBtn = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "New network" });
    var endBtn = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "Skip to end" });

    var ctrls = el("div", { class: "rc-ctrls" }, [
      labeled("Switches", sSeg, "ug grad res"),
      labeled("Hosts attacking", cSeg),
      labeled("Canaries", nSeg),
      labeled("Speed", spSeg)
    ]);
    var actions = el("div", { class: "w-actions" }, [playBtn, endBtn, newBtn]);
    var netSvg = svg("svg", { class: "rc-net", role: "img" });
    var stripSvg = svg("svg", { class: "rc-strip", role: "img" });
    var readout = el("div", { class: "rc-readout", "aria-live": "polite" });
    var paperLine = el("p", { class: "w-note" });
    var key = el("p", { class: "w-note rc-key", html:
      '<span class="rc-sw-key"></span> switch &nbsp; <span class="rc-host-key"></span> ordinary host &nbsp; <span class="rc-att-key"></span> attacker &nbsp; <span class="rc-vic-key"></span> victim (10.42.0.12) &nbsp; <span class="rc-can-key"></span> canary. Simulated traffic.' });
    root.appendChild(ctrls); root.appendChild(actions); root.appendChild(netSvg); root.appendChild(key);
    root.appendChild(stripSvg); root.appendChild(readout); root.appendChild(paperLine);

    var raf = null, lastTs = 0;
    function newRun(keepSeed) {
      stop();
      if (!keepSeed) {}
      state.run = E.trial({ s: state.s, c: state.c, n: state.n, seed: state.seed, keepCounts: true });
      state.playT = 0;
      sSeg.set(state.s); cSeg.set(state.c); nSeg.set(state.n);
      draw();
      changed("run");
    }
    newBtn.addEventListener("click", function () { state.seed += 1; newRun(); });
    endBtn.addEventListener("click", function () { stop(); state.playT = state.run.opts.duration; draw(); changed("play"); });
    playBtn.addEventListener("click", function () {
      if (raf) { stop(); return; }
      if (state.playT >= state.run.opts.duration) state.playT = 0;
      playBtn.textContent = "Pause"; playBtn.classList.add("running");
      lastTs = 0; raf = requestAnimationFrame(tick);
    });
    function stop() {
      if (raf) cancelAnimationFrame(raf);
      raf = null; playBtn.textContent = "Play"; playBtn.classList.remove("running");
    }
    function tick(ts) {
      if (!lastTs) lastTs = ts;
      var dt = Math.min(0.1, (ts - lastTs) / 1000); lastTs = ts;
      state.playT = Math.min(state.run.opts.duration, state.playT + dt * speed);
      draw();
      if (state.playT >= state.run.opts.duration) { stop(); changed("play"); return; }
      raf = requestAnimationFrame(tick);
    }

    // State of each canary at playT.
    function canaryAt(c, T) {
      var abs = state.run.opts.startDelay + T;
      var last = null, idx = -1;
      for (var i = 0; i < c.windows.length; i++) { if (c.windows[i].t <= abs) { last = c.windows[i]; idx = i; } else break; }
      var streak = 0;
      for (var j = idx; j >= 0 && c.windows[j].flag; j--) streak++;
      var reports = c.reportList.filter(function (r) { return r.t <= abs; });
      return { last: last, idx: idx, streak: streak % 5 === 0 && streak > 0 ? 5 : streak % 5, reported: reports.length > 0, windows: idx + 1 };
    }

    function draw() {
      drawNet(); drawStrip(); drawReadout();
    }

    function drawNet() {
      var r = state.run, s = r.opts.s;
      var W = chartWidth(netSvg), H = 190;
      netSvg.setAttribute("viewBox", "0 0 " + W + " " + H);
      netSvg.setAttribute("width", W); netSvg.setAttribute("height", H);
      netSvg.innerHTML = "";
      netSvg.setAttribute("aria-label", "Network of " + s + " switches in a chain, five hosts each, " + r.attackers.length + " attackers, and " + r.canaries.length + " canaries.");
      var pad = 22, gap = (W - 2 * pad) / s, swY = 92, sw = Math.min(34, gap * 0.55);
      var topo = E.topology(s);
      var isAtt = {}; r.attackers.forEach(function (a) { isAtt[a] = true; });
      var canBySw = {}; r.windows.forEach(function (c) { canBySw[c.sw] = c; });
      // chain links
      for (var k = 0; k < s - 1; k++) {
        netSvg.appendChild(svg("line", { class: "rc-link", x1: pad + gap * (k + 0.5), y1: swY, x2: pad + gap * (k + 1.5), y2: swY }));
      }
      for (var w = 0; w < s; w++) {
        var cx = pad + gap * (w + 0.5);
        var hosts = topo.hosts.filter(function (h) { return h.sw === w; });
        hosts.forEach(function (h, j) {
          var sp = Math.min(13, gap / 5.5), hr = Math.max(2.5, Math.min(5, sp / 2 - 0.4));
          var hx = cx + (j - 2) * sp, hy = 160;
          netSvg.appendChild(svg("line", { class: "rc-link thin", x1: cx, y1: swY + sw / 2, x2: hx, y2: hy - 5 }));
          var cls = "rc-host" + (isAtt[h.idx] ? " att" : "");
          netSvg.appendChild(svg("circle", { class: cls, cx: hx, cy: hy, r: hr }));
          if (h.idx === topo.victim) netSvg.appendChild(svg("circle", { class: "rc-victim", cx: hx, cy: hy, r: 8.5 }));
          if (h.idx === topo.victim && atLeastUg()) netSvg.appendChild(svg("text", { class: "c-tick", x: hx, y: hy + 22, "text-anchor": "middle" }, "10.42.0.12"));
        });
        netSvg.appendChild(svg("rect", { class: "rc-switch", x: cx - sw / 2, y: swY - sw / 2, width: sw, height: sw }));
        netSvg.appendChild(svg("text", { class: "rc-switch-label", x: cx, y: swY + 4, "text-anchor": "middle" }, String(w + 1)));
        var c = canBySw[w];
        if (c) {
          var st = canaryAt(c, state.playT);
          var bh = 46, by = 10, bw = 9;
          var Hval = st.last ? st.last.H : null;
          var frac = Hval == null ? 0 : Math.max(0, Math.min(1, Hval / 5));
          netSvg.appendChild(svg("rect", { class: "rc-meter-bg", x: cx - bw - 3, y: by, width: bw, height: bh }));
          netSvg.appendChild(svg("rect", { class: "rc-meter" + (st.last && st.last.flag ? " low" : ""), x: cx - bw - 3, y: by + bh * (1 - frac), width: bw, height: bh * frac }));
          var ty = by + bh * (1 - r.opts.threshold / 5);
          netSvg.appendChild(svg("line", { class: "rc-thr", x1: cx - bw - 6, x2: cx - 0, y1: ty, y2: ty }));
          for (var p = 0; p < 5; p++) {
            netSvg.appendChild(svg("rect", { class: "rc-pip" + (p < st.streak ? " on" : ""), x: cx + 2, y: by + bh - (p + 1) * 9 + 1, width: 7, height: 7 }));
          }
          if (st.reported) netSvg.appendChild(svg("text", { class: "rc-chirp", x: cx + 12, y: by + 8 }, "!"));
          netSvg.appendChild(svg("polygon", { class: "rc-canary" + (st.reported ? " alarm" : ""), points: (cx - 6) + "," + (swY - sw / 2 - 3) + " " + (cx + 6) + "," + (swY - sw / 2 - 3) + " " + cx + "," + (swY - sw / 2 - 13) }));
        }
      }
    }

    function drawStrip() {
      var r = state.run, W = chartWidth(stripSvg), H = 170;
      stripSvg.setAttribute("viewBox", "0 0 " + W + " " + H);
      stripSvg.setAttribute("width", W); stripSvg.setAttribute("height", H);
      stripSvg.innerHTML = "";
      stripSvg.setAttribute("aria-label", "Window entropy over the capture for each canary, with the alarm threshold.");
      var L = 40, R = 18, T = 10, B = 28, iw = W - L - R, ih = H - T - B;
      var dur = r.opts.duration, yMax = 5;
      function x(t) { return L + iw * (t / dur); }
      function y(v) { return T + ih * (1 - v / yMax); }
      [0, 1, 2, 3, 4, 5].forEach(function (v) {
        stripSvg.appendChild(svg("line", { class: "c-grid", x1: L, x2: L + iw, y1: y(v), y2: y(v) }));
        stripSvg.appendChild(svg("text", { class: "c-tick", x: L - 6, y: y(v) + 4, "text-anchor": "end" }, String(v)));
      });
      [0, 60, 120, 180, 240, 300].forEach(function (t) {
        stripSvg.appendChild(svg("text", { class: "c-tick", x: x(t), y: H - 10, "text-anchor": "middle" }, t + " s"));
      });
      stripSvg.appendChild(svg("text", { class: "c-label", x: L + 6, y: T + 10 }, "entropy, bits"));
      stripSvg.appendChild(svg("line", { class: "rc-thr-line", x1: L, x2: L + iw, y1: y(r.opts.threshold), y2: y(r.opts.threshold) }));
      stripSvg.appendChild(svg("text", { class: "c-tick rc-thr-text", x: L + iw - 2, y: y(r.opts.threshold) - 4, "text-anchor": "end" }, "threshold " + r.opts.threshold.toFixed(4)));
      var abs0 = r.opts.startDelay, Tnow = state.playT;
      r.windows.forEach(function (c, k) {
        var pts = [];
        c.windows.forEach(function (w) { var t = w.t - abs0; if (t <= Tnow) pts.push(x(t).toFixed(1) + "," + y(Math.min(yMax, w.H)).toFixed(1)); });
        if (pts.length > 1) stripSvg.appendChild(svg("polyline", { class: "rc-eline k" + (k % 4), points: pts.join(" ") }));
        c.reportList.forEach(function (rep) {
          var t = rep.t - abs0;
          if (t <= Tnow) stripSvg.appendChild(svg("circle", { class: "rc-rep", cx: x(t), cy: y(r.opts.threshold), r: 3.5 }));
        });
      });
      stripSvg.appendChild(svg("line", { class: "rc-playhead", x1: x(Tnow), x2: x(Tnow), y1: T, y2: T + ih }));
    }

    function drawReadout() {
      var r = state.run, d = r.detection, T = state.playT;
      var done = d && d.time <= T;
      var html = "";
      var seen = 0;
      r.windows.forEach(function (c) { var st = canaryAt(c, T); seen += st.windows; });
      if (done) {
        html = "<strong>Alarm.</strong> The canary on switch " + d.bridge + " saw five low-entropy windows in a row, " + fmt(d.time, 1) + " seconds into the capture";
        if (atLeastUg()) html += ", after " + int(d.packets) + " packets in the shared log (the paper's detection time)";
        html += ".";
      } else if (T >= r.opts.duration) {
        html = r.opts.c === 0 ? "<strong>No alarm.</strong> Five minutes of ordinary traffic and no canary raised a false alarm." : "<strong>Missed.</strong> No canary saw five low-entropy windows in a row in five minutes.";
      } else {
        html = "Listening: " + fmt(T, 0) + " of 300 seconds, " + seen + " windows of 50 packets checked so far.";
      }
      if (r.opts.c === 0 && done) html += " No host is attacking, so this alarm is a false positive.";
      if (atLeastUg()) {
        html += " <span class='w-mono'>s = " + r.opts.s + ", c = " + r.opts.c + ", n = " + r.opts.n + ", attackers " + r.attackers.filter(function (a) { return a < r.opts.s * 5; }).length + " of " + r.opts.s * 5 + ", canaries on switches " + r.canaries.slice().sort(function (a, b) { return a - b; }).join(", ") + ", seed " + r.opts.seed + "</span>";
      }
      readout.innerHTML = html;
      if (r.opts.s === 6) {
        var p = cellPaper(r.opts.c, r.opts.n);
        paperLine.textContent = "Paper, 15 trials in the CORE emulator at this setting (six switches, " + pctLabel(r.opts.c) + " attackers, " + words(r.opts.n) + (r.opts.n === 1 ? " canary" : " canaries") + "): detection rate " + p.rate + "%" + (p.packets ? ", mean detection time " + int(p.packets) + " packets." : ", no detection time reported.");
      } else {
        paperLine.textContent = "The paper reports detection results for six switches only; with " + r.opts.s + " switches it reports the baseline entropy (Table I).";
      }
    }

    onChange(function (what) {
      if (what === "level") draw();
      if (what === "pick") { rebuildN(); newRun(); }
    });
    resizers.push(draw);
    newRun();
  }

  /* ------------------------------------------------------------ demo 2: one window */

  function mountWindow(root) {
    root.classList.add("w-ready");
    var k = 10;
    var presets = [
      { value: "quiet", label: "Ordinary traffic" },
      { value: "live", label: "From the network above" },
      { value: "flood", label: "Flood" },
      { value: "one", label: "One address" },
      { value: "fifty", label: "Fifty addresses" }
    ];
    var mode = "quiet";
    var pSeg = seg(presets, mode, function (v) { mode = v; load(); }, "Window to show");
    var slider = el("input", { type: "range", min: "0", max: "50", step: "1", value: String(k), "aria-label": "Packets addressed to the victim" });
    var out = el("output", { text: String(k) });
    var sRow = el("label", { class: "w-range" }, [el("span", { text: "To victim" }), slider, out]);
    slider.addEventListener("input", function () { k = +slider.value; out.textContent = String(k); mode = "slider"; pSeg.set(null); load(); });
    var grid = svg("svg", { class: "rc-grid50", role: "img" });
    var big = el("p", { class: "w-big" });
    var note = el("p", { class: "w-note" });
    var tableWrap = el("div", { class: "rc-table-wrap", "data-levels": "ug grad res" });
    root.appendChild(el("div", { class: "rc-ctrls" }, [pSeg]));
    root.appendChild(sRow);
    root.appendChild(grid); root.appendChild(big); root.appendChild(note); root.appendChild(tableWrap);

    function threshold() { return state.run ? state.run.opts.threshold : E.PAPER_THRESHOLDS[6]; }

    // A window of 50 destinations: an array of {ip, count}.
    function build() {
      var counts = {};
      if (mode === "live" && state.run) {
        var T = state.run.opts.startDelay + state.playT, best = null;
        state.run.windows.forEach(function (c) {
          c.windows.forEach(function (w) { if (w.t <= T && (!best || w.t > best.w.t)) best = { w: w, c: c }; });
        });
        if (!best) { best = null; state.run.windows.forEach(function (c) { if (c.windows.length && !best) best = { w: c.windows[0], c: c }; }); }
        if (best) { counts = best.w.counts; note.textContent = "Latest window from the canary on switch " + best.c.bridge + " in the network above (simulated)."; return counts; }
      }
      if (mode === "quiet") {
        var q = E.trial({ s: 6, c: 0, n: 6, seed: 3, keepCounts: true, duration: 40 });
        counts = q.windows[2].windows[3].counts;
        note.textContent = "A window from a simulated network with no attackers: replies and requests spread across many hosts.";
        return counts;
      }
      if (mode === "flood") { k = 30; }
      if (mode === "one") { k = 50; }
      if (mode === "fifty") { var f = {}; for (var i = 0; i < 50; i++) f["10.42.0." + (i + 7) % 61] = 1; note.textContent = "Fifty packets to fifty different addresses: the most spread a window can have."; return f; }
      // victim gets k, the rest spread round-robin over ten other hosts
      counts["10.42.0.12"] = k;
      for (var j = 0; j < 50 - k; j++) { var ip = "10.42.0." + (13 + (j % 10)); counts[ip] = (counts[ip] || 0) + 1; }
      if (k === 0) delete counts["10.42.0.12"];
      note.textContent = mode === "one" ? "Every packet goes to one address, the victim." : k + " packets go to the victim and the other " + (50 - k) + " are spread over ten hosts.";
      return counts;
    }
    function load() {
      var counts = build();
      if (mode !== "slider" && mode !== "live" && mode !== "quiet" && mode !== "fifty") { slider.value = String(k); out.textContent = String(k); }
      draw(counts);
    }
    function draw(counts) {
      var list = Object.keys(counts).map(function (ip) { return { ip: ip, n: counts[ip] }; }).sort(function (a, b) { return b.n - a.n; });
      var Hv = E.windowEntropy(counts), thr = threshold();
      var W = chartWidth(grid), cols = W < 420 ? 10 : 25, cell = Math.floor((W - 2) / cols), rows = Math.ceil(50 / cols), Hh = rows * cell + 4;
      grid.setAttribute("viewBox", "0 0 " + W + " " + Hh); grid.setAttribute("width", W); grid.setAttribute("height", Hh);
      grid.innerHTML = "";
      grid.setAttribute("aria-label", "Fifty packets colored by destination: " + list.length + " different destinations.");
      var i = 0;
      list.forEach(function (d, rank) {
        for (var m = 0; m < d.n; m++, i++) {
          var x = (i % cols) * cell, y = Math.floor(i / cols) * cell;
          var cls = "rc-pkt" + (d.ip === "10.42.0.12" ? " vic" : " r" + (rank % 6));
          grid.appendChild(svg("rect", { class: cls, x: x + 1, y: y + 1, width: cell - 3, height: cell - 3 }));
        }
      });
      var flagged = Hv < thr;
      big.innerHTML = "Entropy <strong>" + Hv.toFixed(3) + "</strong> bits · " + list.length + (list.length === 1 ? " destination · " : " destinations · ") +
        (flagged ? "<span class='rc-flag'>below the threshold " + thr.toFixed(4) + ": flagged</span>" : "above the threshold " + thr.toFixed(4) + ": not flagged");
      tableWrap.innerHTML = "";
      var t = el("table", { class: "results-table rc-ptable" });
      t.appendChild(el("caption", { class: "w-note", text: "Eq. 3, term by term: H = −Σ (yᵢ/50) log₂(yᵢ/50)." }));
      t.appendChild(el("thead", null, [el("tr", null, ["Destination", "yᵢ", "yᵢ/50", "−p log₂ p"].map(function (h) { return el("th", { text: h }); }))]));
      var tb = el("tbody");
      list.slice(0, 12).forEach(function (d) {
        var p = d.n / 50;
        tb.appendChild(el("tr", null, [el("td", { class: "rc-num", text: d.ip }), el("td", { class: "rc-num", text: String(d.n) }), el("td", { class: "rc-num", text: p.toFixed(2) }), el("td", { class: "rc-num", text: (-p * Math.log2(p)).toFixed(4) })]));
      });
      if (list.length > 12) {
        var rest = list.slice(12), s = 0, cnt = 0;
        rest.forEach(function (d) { var p = d.n / 50; s += -p * Math.log2(p); cnt += d.n; });
        tb.appendChild(el("tr", null, [el("td", { text: rest.length + " more" }), el("td", { class: "rc-num", text: String(cnt) }), el("td", { class: "rc-num", text: (cnt / 50).toFixed(2) }), el("td", { class: "rc-num", text: s.toFixed(4) })]));
      }
      tb.appendChild(el("tr", { class: "on" }, [el("td", { text: "Sum" }), el("td", { class: "rc-num", text: "50" }), el("td", { class: "rc-num", text: "1.00" }), el("td", { class: "rc-num", text: Hv.toFixed(4) })]));
      t.appendChild(tb);
      tableWrap.appendChild(t);
    }
    onChange(function (what) { if (mode === "live" && (what === "run" || what === "play")) load(); });
    resizers.push(load);
    load();
  }

  /* ------------------------------------------------------------ demo 3: baseline and threshold */

  function mountBaseline(root) {
    root.classList.add("w-ready");
    var s = 6, capture = "perPort";
    var sSeg = seg([3, 6, 9].map(function (v) { return { value: v, label: v + " switches" }; }), s, function (v) { s = v; draw(); }, "Topology");
    var capSeg = seg([{ value: "perPort", label: "Every port (as captured)" }, { value: "single", label: "Once per switch" }], capture, function (v) { capture = v; draw(); }, "Capture model");
    var chart = svg("svg", { class: "rc-hist", role: "img" });
    var tableWrap = el("div", { class: "rc-table-wrap" });
    var note = el("p", { class: "w-note" });
    root.appendChild(el("div", { class: "rc-ctrls" }, [sSeg, labeled("Counting", capSeg, "res")]));
    root.appendChild(chart); root.appendChild(note); root.appendChild(tableWrap);

    function draw() {
      if (!state.data) { note.textContent = "Loading the precomputed runs…"; return; }
      var cap = state.level === "res" ? capture : "perPort";
      var pg = state.data.tableI[s][cap], pp = TABLE1[s];
      var W = chartWidth(chart), H = 200, L = 40, R = 10, T = 14, B = 30, iw = W - L - R, ih = H - T - B;
      chart.setAttribute("viewBox", "0 0 " + W + " " + H); chart.setAttribute("width", W); chart.setAttribute("height", H);
      chart.innerHTML = "";
      chart.setAttribute("aria-label", "Histogram of baseline window entropy for " + s + " switches, with the paper's and this page's mean and threshold.");
      var lo = 1.5, hi = 5.5, bins = pg.hist, mx = Math.max.apply(null, bins) || 1;
      function x(v) { return L + iw * (v - lo) / (hi - lo); }
      for (var v = 2; v <= 5; v++) {
        chart.appendChild(svg("line", { class: "c-grid", x1: x(v), x2: x(v), y1: T, y2: T + ih }));
        chart.appendChild(svg("text", { class: "c-tick", x: x(v), y: H - 12, "text-anchor": "middle" }, v + " bits"));
      }
      var bw = iw / ((hi - lo) / 0.1);
      bins.forEach(function (b, i) {
        var h = ih * b / mx;
        var center = lo + 0.1 * i + 0.05;
        chart.appendChild(svg("rect", { class: "rc-bar" + (center < pp.threshold ? " low" : ""), x: x(lo + 0.1 * i) + 0.5, y: T + ih - h, width: Math.max(1, bw - 1), height: h }));
      });
      function vline(val, cls, label, dy) {
        chart.appendChild(svg("line", { class: cls, x1: x(val), x2: x(val), y1: T, y2: T + ih }));
        chart.appendChild(svg("text", { class: "c-tick", x: x(val) + 3, y: T + 10 + dy }, label));
      }
      vline(pp.threshold, "rc-thr-line", "paper threshold " + pp.threshold.toFixed(4), 0);
      vline(pp.mean, "c-ref", "paper mean " + pp.mean.toFixed(4), 14);
      vline(pg.mean, "rc-mean", "page mean " + pg.mean.toFixed(4), 28);
      var below = 0, tot = 0;
      bins.forEach(function (b, i) { tot += b; if (lo + 0.1 * i + 0.05 < pp.threshold) below += b; });
      note.textContent = "Simulated: " + int(pg.windows) + " windows of 50 packets from 30 attack-free trials (the paper also ran 30). Bars left of the paper's threshold (about " + Math.round(100 * below / tot) + "% of windows) would be flagged; an alarm needs five in a row.";
      tableWrap.innerHTML = "";
      var t = el("table", { class: "results-table" });
      t.appendChild(el("caption", { class: "w-note", text: "Table I, entropy thresholds, " + s + " switches: the paper's values beside this page's simulation." }));
      t.appendChild(el("thead", null, [el("tr", null, ["", "Min", "Max", "Mean", "Std. dev.", "Threshold (0.90 × mean)"].map(function (h) { return el("th", { text: h }); }))]));
      var tb = el("tbody");
      function row(label, d, check) {
        tb.appendChild(el("tr", null, [el("td", { text: label })].concat(["min", "max", "mean", "sd", "threshold"].map(function (kk) { return el("td", { class: "rc-num", text: d[kk].toFixed(4) }); }))));
      }
      row("Paper (CORE)", pp);
      row("This page (simulated)", pg);
      tb.appendChild(el("tr", null, [el("td", { text: "0.90 × paper mean" }), el("td"), el("td"), el("td"), el("td"), el("td", { class: "rc-num", text: (0.9 * pp.mean).toFixed(4) + (Math.abs(0.9 * pp.mean - pp.threshold) < 0.00005 ? " ✓ matches" : "") })]));
      t.appendChild(tb);
      tableWrap.appendChild(t);
    }
    onChange(function (what) { if (what === "data" || what === "level") draw(); });
    resizers.push(draw);
    draw();
  }

  /* ------------------------------------------------------------ demo 4: the paper's grid */

  function mountGrid(root) {
    root.classList.add("w-ready");
    var source = "paper", metric = "rate", thrMode = "paper", live = null, running = false;
    var srcSeg = seg([{ value: "paper", label: "Paper" }, { value: "page", label: "This page (simulated)" }], source, function (v) { source = v; draw(); }, "Source");
    var mSeg = seg([{ value: "rate", label: "Detection rate" }, { value: "packets", label: "Packets to detect" }], metric, function (v) { metric = v; draw(); }, "Measure");
    var tSeg = seg([{ value: "paper", label: "Paper's 3.4200" }, { value: "page", label: "Page's own baseline" }], thrMode, function (v) { thrMode = v; live = null; draw(); }, "Threshold");
    var runBtn = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "Rerun all 450 trials here" });
    var prog = el("span", { class: "w-mono" });
    var tableWrap = el("div", { class: "rc-table-wrap" });
    var note = el("p", { class: "w-note" });
    root.appendChild(el("div", { class: "rc-ctrls" }, [srcSeg, mSeg, labeled("Threshold", tSeg, "grad res")]));
    root.appendChild(tableWrap); root.appendChild(note);
    root.appendChild(el("div", { class: "w-actions", "data-levels": "ug grad res" }, [runBtn, prog]));

    function pageCells() {
      if (live && live.thr === thrMode) return live.cells;
      return state.data ? state.data.grid[thrMode].cells : null;
    }
    runBtn.addEventListener("click", function () {
      if (running) return;
      running = true; runBtn.disabled = true;
      var thr = thrMode === "paper" ? E.PAPER_THRESHOLDS[6] : state.data.pageThresholds[6];
      var jobs = []; CS.forEach(function (c) { NS.forEach(function (n) { jobs.push([c, n]); }); });
      var cells = {}, j = 0, t0 = performance.now(), mine = thrMode;
      (function step() {
        var until = performance.now() + 120;
        while (j < jobs.length && performance.now() < until) {
          var c = jobs[j][0], n = jobs[j][1];
          var trials = E.runSet({ s: 6, c: c, n: n, threshold: thr }, 15, 1000);
          var m = E.summarize(trials);
          cells[c + "|" + n] = { rate: m.rate, meanDetect: m.meanDetect, detected: m.detections };
          j++;
        }
        prog.textContent = (j * 15) + " of 450 trials";
        if (j < jobs.length) { setTimeout(step, 0); return; }
        live = { thr: mine, cells: cells };
        running = false; runBtn.disabled = false;
        prog.textContent = "450 trials in " + ((performance.now() - t0) / 1000).toFixed(1) + " s on your device; same seeds as the stored table, so the numbers match it.";
        source = "page"; srcSeg.set("page"); draw();
      })();
    });

    function draw() {
      tableWrap.innerHTML = "";
      var cells = source === "page" ? pageCells() : null;
      if (source === "page" && !cells) { note.textContent = "Loading the precomputed runs…"; return; }
      var t = el("table", { class: "results-table rc-gridtable" });
      var cap = (metric === "rate" ? "Detection rate (Table III)" : "Mean detection time in packets (Table II)") + ", six switches, 15 trials per cell. " +
        (source === "paper" ? "Values printed in the paper." : "Simulated on this page" + (deep() ? " with threshold " + (thrMode === "paper" ? "3.4200" : state.data.pageThresholds[6].toFixed(4)) : "") + ".") +
        " Select a cell to load it into the network above.";
      t.appendChild(el("caption", { class: "w-note", text: cap }));
      t.appendChild(el("thead", null, [el("tr", null, [el("th", { text: "Attackers" })].concat(NS.map(function (n) { return el("th", { text: "n = " + n }); })))]));
      var tb = el("tbody");
      CS.forEach(function (c) {
        var tr = el("tr");
        tr.appendChild(el("td", { class: "rc-num", text: "c = " + c.toFixed(2) }));
        NS.forEach(function (n) {
          var v, sub = "";
          if (source === "paper") {
            var p = cellPaper(c, n);
            v = metric === "rate" ? p.rate : p.packets;
          } else {
            var x = cells[c + "|" + n];
            v = metric === "rate" ? x.rate : x.meanDetect;
            if (metric === "rate" && deep()) sub = x.detected + "/15";
          }
          var txt = v == null ? "–" : (metric === "rate" ? v + "%" : int(v));
          var shade = metric === "rate" ? (v == null ? 0 : v / 100) : (v == null ? 0 : Math.max(0, 1 - Math.log10(v / 250) / Math.log10(40)));
          var td = el("td", { class: "rc-cell" + (state.s === 6 && state.c === c && state.n === n ? " sel" : ""), tabindex: "0", role: "button", "aria-label": "Load c = " + c + ", n = " + n + " into the network demo" });
          td.style.setProperty("--shade", String(Math.round(shade * 100) / 100));
          td.appendChild(el("span", { class: "rc-v", text: txt }));
          if (sub) td.appendChild(el("span", { class: "rc-sub", text: sub }));
          function pick() { state.s = 6; state.c = c; state.n = n; changed("pick"); draw(); }
          td.addEventListener("click", pick);
          td.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(); } });
          tr.appendChild(td);
        });
        tb.appendChild(tr);
      });
      t.appendChild(tb);
      tableWrap.appendChild(t);
      if (source === "paper") {
        note.textContent = metric === "rate"
          ? "Darker cells detect more often. With a quarter of the hosts attacking, removing canaries lowers the rate from 100% to 66%; with half or more attacking, almost any canary sees the flood."
          : "Fewer packets means an earlier alarm. The count includes packets logged by every canary, so it is a measure of total listening before the first alarm. With one canary and every host attacking, the minimum possible, 250 (five windows of 50), is reached.";
      } else {
        note.textContent = "Simulated in your browser's engine, 15 trials per cell (the paper ran 15 in the CORE emulator). The simulation follows the authors' scripts for topology, traffic, entropy, and alarms, and models the timing of each ping.";
      }
    }
    onChange(function (what) { if (what === "data" || what === "level" || what === "run") draw(); });
    draw();
  }

  /* ------------------------------------------------------------ boot */

  function boot() {
    var m;
    if ((m = document.getElementById("rc-net"))) mountNet(m);
    if ((m = document.getElementById("rc-window"))) mountWindow(m);
    if ((m = document.getElementById("rc-baseline"))) mountBaseline(m);
    if ((m = document.getElementById("rc-grid"))) mountGrid(m);
    fetch(DATA_URL).then(function (r) { return r.json(); }).then(function (d) { state.data = d; changed("data"); })
      .catch(function () { /* demos 3 and 4 keep their loading note */ });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();

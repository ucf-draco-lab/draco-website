/*
  Safety-centric avionics widget for /papers/avionics-safety-design/.
  Mount points: #av-catch, #av-proof, #av-family, #av-testing.
  One shared state: the injected fault, the monitoring policy, the service action, the
  fault onset, and the selected block, node, and property.
  The computation is sac-engine.js (window.SacEngine).
*/
(function () {
  "use strict";

  var E = window.SacEngine;
  if (!E) return;

  var SVGNS = "http://www.w3.org/2000/svg";

  /* ------------------------------------------------------------ state */

  var state = {
    fault: "sign", policy: "top", recover: "log", onset: 2.0,
    block: "INT", node: "a1", prop: "p1", compA: "a2", compB: "a3",
    custom: { min: 6, max: 12, d1: 18 },
    rate: 1e-9, conf: 0.95, fleet: 50, hours: 1000,
    level: window.PaperKit ? window.PaperKit.level() : "public"
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
    var row = el("div", { class: "av-ctl" }, [el("span", { class: "av-ctl-label", text: label }), control]);
    if (levels) row.setAttribute("data-levels", levels);
    return row;
  }
  function range(label, min, max, step, value, fmt, onInput, levels) {
    var input = el("input", { type: "range", min: String(min), max: String(max), step: String(step), value: String(value), "aria-label": label });
    var out = el("output", { text: fmt(value) });
    input.addEventListener("input", function () { out.textContent = fmt(Number(input.value)); onInput(Number(input.value)); });
    var row = el("label", { class: "w-range" }, [el("span", { text: label }), input, out]);
    if (levels) row.setAttribute("data-levels", levels);
    row.set = function (v) { input.value = String(v); out.textContent = fmt(v); };
    return row;
  }
  function int(x) { return Math.round(x).toLocaleString("en-US"); }
  function sec(frames) { return (frames * E.T).toFixed(2) + " s"; }
  function words(n) { return ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"][n] || int(n); }
  var MON_NAME = {
    PI_r: "input check on the command", PI_th: "input check on the pitch sensor", PO: "output check",
    A: "module A check", B: "module B check", SUM1: "SUM1 check", GAIN: "GAIN check", INT: "integrator check",
    SUM2: "SUM2 check", SAT: "limiter check", sensor: "the pitch sensor", command: "the pitch command"
  };
  function faultById(id) { return E.FAULTS.filter(function (f) { return f.id === id; })[0]; }

  /* ------------------------------------------------------------ demo 1: plant a bug */

  function mountCatch(root) {
    root.classList.add("w-ready");
    var faults = seg(E.FAULTS.map(function (f) { return { value: f.id, label: f.name }; }), state.fault,
      function (v) { state.fault = v; changed("run"); }, "Bug to plant");
    var policy = seg([
      { value: "top", label: "Inputs and output only", title: "Check the controller's inputs and its output every frame" },
      { value: "all", label: "Every block", title: "Check every module and every block every frame" },
      { value: "escalate", label: "Escalate on alarm", title: "Check inputs and output; after an alarm, switch on the next level down" }
    ], state.policy, function (v) { state.policy = v; changed("run"); }, "Checks switched on");
    var recover = seg([
      { value: "log", label: "Log only" },
      { value: "backup", label: "Switch to backup law" }
    ], state.recover, function (v) { state.recover = v; changed("run"); }, "On alarm");
    var onset = range("Bug appears at", 0.5, 7, 0.1, state.onset, function (v) { return v.toFixed(1) + " s"; },
      function (v) { state.onset = v; changed("run"); });

    var chart = svg("svg", { class: "av-chart", role: "img" });
    var tree = svg("svg", { class: "av-tree", role: "img" });
    var readout = el("p", { class: "av-readout", "aria-live": "polite" });
    var key = el("p", { class: "av-key" }, [
      ["cmd", "pitch command"], ["ref", "flight without the bug"], ["act", "flight with the bug"], ["bug", "bug"], ["alarm", "first alarm"]
    ].map(function (k) { return el("span", { class: "av-key-item" }, [el("span", { class: "av-k " + k[0] }), k[1]]); }));
    var tableWrap = el("div", { class: "av-sweep-wrap", "data-levels": "grad res" });

    root.appendChild(labeled("Bug", faults));
    root.appendChild(labeled("Checks on", policy));
    root.appendChild(labeled("On alarm", recover));
    root.appendChild(onset);
    root.appendChild(chart);
    root.appendChild(key);
    root.appendChild(readout);
    root.appendChild(tree);
    root.appendChild(tableWrap);

    var run = null;
    function onsetFrame() { return Math.round(state.onset / E.T); }

    function drawChart() {
      var W = chartWidth(chart), H = 300, L = 40, R = 12, Tp = 14, B = 34;
      var split = 196; // pitch panel above, elevator panel below
      chart.setAttribute("viewBox", "0 0 " + W + " " + H); chart.setAttribute("width", W); chart.setAttribute("height", H);
      chart.innerHTML = "";
      var n = E.FRAMES, k0 = onsetFrame();
      var x = function (k) { return L + (W - L - R) * k / (n - 1); };
      var y1 = function (v) { return Tp + (split - Tp - 10) * (1 - (v + 20) / 50); };   // pitch −20..30
      var y2 = function (v) { return split + 14 + (H - B - split - 14) * (1 - (v + 25) / 50); }; // elevator ±25
      [-20, -10, 0, 10, 20, 30].forEach(function (v) {
        chart.appendChild(svg("line", { class: "c-grid", x1: L, x2: W - R, y1: y1(v), y2: y1(v) }));
        chart.appendChild(svg("text", { class: "c-tick", x: L - 6, y: y1(v) + 4, "text-anchor": "end" }, v + "°"));
      });
      [-25, 0, 25].forEach(function (v) {
        chart.appendChild(svg("line", { class: "c-grid", x1: L, x2: W - R, y1: y2(v), y2: y2(v) }));
        chart.appendChild(svg("text", { class: "c-tick", x: L - 6, y: y2(v) + 4, "text-anchor": "end" }, v + "°"));
      });
      for (var s = 0; s <= 8; s += 2) {
        var kk = Math.min(n - 1, s / E.T);
        chart.appendChild(svg("text", { class: "c-tick", x: x(kk), y: H - B + 16, "text-anchor": "middle" }, s + " s"));
      }
      chart.appendChild(svg("text", { class: "c-label", x: L + 4, y: Tp + 2 }, "pitch"));
      chart.appendChild(svg("text", { class: "c-label", x: L + 4, y: split + 12 }, "elevator command"));
      function path(arr, yf, cls) {
        var d = "";
        for (var k = 0; k < arr.length; k++) {
          var v = Math.max(-40, Math.min(60, arr[k]));
          d += (k ? "L" : "M") + x(k).toFixed(1) + " " + yf(v).toFixed(1);
        }
        chart.appendChild(svg("path", { class: cls, d: d }));
      }
      var ref = E.reference();
      path(run.series.r, y1, "av-cmd");
      path(ref.series.th, y1, "av-ref");
      path(run.series.th, y1, "av-act");
      path(ref.series.u, y2, "av-ref");
      path(run.series.u, y2, "av-act");
      if (state.fault !== "none") {
        chart.appendChild(svg("line", { class: "av-bug", x1: x(k0), x2: x(k0), y1: Tp, y2: H - B }));
        chart.appendChild(svg("text", { class: "c-label av-bug-label", x: x(k0) + 4, y: H - B - 4 }, "bug"));
      }
      if (run.detect) {
        var kd = run.detect.k;
        chart.appendChild(svg("line", { class: "av-alarm", x1: x(kd), x2: x(kd), y1: Tp, y2: H - B }));
        var lx = x(kd) + 4, anchor = "start";
        if (lx > W - 90) { lx = x(kd) - 4; anchor = "end"; }
        chart.appendChild(svg("text", { class: "c-label av-alarm-label", x: lx, y: Tp + 14, "text-anchor": anchor }, "alarm"));
      }
      chart.setAttribute("aria-label", "Pitch and elevator over eight seconds of simulated flight. " + readout.textContent);
    }

    // Monitor hierarchy at the end of the run: off, on and passing, or failed at least once.
    function drawTree() {
      var W = chartWidth(tree), H = 150;
      tree.setAttribute("viewBox", "0 0 " + W + " " + H); tree.setAttribute("width", W); tree.setAttribute("height", H);
      tree.innerHTML = "";
      var failedEver = {}, everOn = {};
      run.events.forEach(function (ev) { ev.failed.forEach(function (n) { failedEver[n] = failedEver[n] == null ? ev.k : failedEver[n]; }); });
      ["PI_r", "PI_th", "PO"].forEach(function (n) { everOn[n] = true; });
      if (state.policy === "all") { ["A", "B"].concat(E.LEAVES).forEach(function (n) { everOn[n] = true; }); }
      if (state.policy === "escalate") {
        run.events.forEach(function (ev) { ev.failed.forEach(function (n) {
          if (n === "PO") { everOn.A = true; everOn.B = true; }
          if (n === "A" || n === "B") E.LEAVES.forEach(function (l) { if (E.MODULE_OF[l] === n) everOn[l] = true; });
        }); });
      }
      var rows = [
        { label: "inputs and output", names: ["PI_r", "PI_th", "PO"], short: { PI_r: "command in", PI_th: "sensor in", PO: "output" } },
        { label: "modules", names: ["A", "B"], short: { A: "module A", B: "module B" } },
        { label: "blocks", names: E.LEAVES, short: { SUM1: "SUM1", GAIN: "GAIN", INT: "INT", SUM2: "SUM2", SAT: "SAT" } }
      ];
      var LW = W < 460 ? 0 : 118;
      rows.forEach(function (row, ri) {
        var y = 10 + ri * 46;
        if (LW) tree.appendChild(svg("text", { class: "c-label", x: 0, y: y + 21 }, row.label));
        var avail = W - LW, bw = Math.min(110, (avail - 6 * (row.names.length - 1)) / row.names.length);
        row.names.forEach(function (n, i) {
          var bx = LW + i * (bw + 6);
          var cls = "av-mon" + (everOn[n] ? " on" : "") + (failedEver[n] != null ? " fail" : "");
          var g = svg("g", {});
          g.appendChild(svg("rect", { class: cls, x: bx, y: y, width: bw, height: 32 }));
          g.appendChild(svg("text", { class: "av-mon-text" + (failedEver[n] != null ? " fail" : ""), x: bx + bw / 2, y: y + 20, "text-anchor": "middle" }, row.short[n]));
          var t = svg("title", {}, E.MONITORS[n].text + (everOn[n] ? (failedEver[n] != null ? " — failed first at " + sec(failedEver[n]) : " — on, never failed") : " — off"));
          g.appendChild(t);
          tree.appendChild(g);
        });
      });
      tree.setAttribute("aria-label", "Which checks were on during the flight and which raised an alarm.");
    }

    function writeReadout() {
      var k0 = onsetFrame();
      var dev = E.deviation(run, state.fault === "none" ? 0 : k0);
      var parts = [];
      if (state.fault === "none") {
        parts.push("No bug planted: every check that is on passes for the whole eight-second flight.");
      } else if (!run.detect) {
        parts.push("<strong>No alarm.</strong> The bug ran for " + (8 - k0 * E.T).toFixed(1) + " s and none of the checks that were on caught it.");
      } else {
        var lag = run.detect.k - k0;
        parts.push("<strong>Alarm " + (lag === 0 ? "in the same frame as the bug" : sec(lag) + " after the bug") + "</strong>, raised by the " + MON_NAME[run.detect.by] + ".");
        if (run.localize) {
          var ll = run.localize.k - k0;
          parts.push(" Traced to " + MON_NAME[run.localize.to].replace(" check", "") + (ll === lag ? " at once." : " " + sec(ll) + " after the bug."));
        } else {
          parts.push(" The source was not pinned to one block.");
        }
      }
      parts.push(" Largest pitch departure from the bug-free flight: " + dev.max.toFixed(1) + "°.");
      parts.push('<span class="w-mono">' + int(run.checks) + " assertion checks in 400 frames of 20 ms" +
        (run.backup ? "; switched to the backup law at " + sec(run.detect.k) : "") + ". Simulated flight; the plant, gains, and bugs are this page's choices.</span>");
      readout.innerHTML = parts.join("");
    }

    function drawTable() {
      tableWrap.innerHTML = "";
      if (!deep()) return;
      var k0 = onsetFrame();
      var rows = E.sweep(k0).filter(function (r) { return r.recover === state.recover; });
      var table = el("table", { class: "results-table av-sweep" });
      tableWrap.appendChild(el("p", { class: "w-note", text: "Every bug under every policy, bug at " + state.onset.toFixed(1) + " s, " + (state.recover === "log" ? "log only" : "backup law on alarm") + ". Frames are 20 ms. Computed by this page on its simulated controller." }));
      var head = el("tr", {}, ["Bug", "Checks on", "Alarm after", "Traced to", "Checks run", "Max departure"].map(function (h) { return el("th", { text: h }); }));
      table.appendChild(el("thead", {}, [head]));
      var tb = el("tbody");
      var pname = { top: "inputs and output", all: "every block", escalate: "escalate" };
      rows.forEach(function (r) {
        var tr = el("tr", { class: (r.fault === state.fault && r.policy === state.policy) ? "on" : "" }, [
          el("td", { text: faultById(r.fault).name }),
          el("td", { text: pname[r.policy] }),
          el("td", { class: "av-num", text: r.detect == null ? "never" : r.detect + " frames" }),
          el("td", { class: "av-num", text: r.localize == null ? "—" : r.to + " (+" + r.localize + ")" }),
          el("td", { class: "av-num", text: int(r.checks) }),
          el("td", { class: "av-num", text: r.dev.toFixed(1) + "°" })
        ]);
        tb.appendChild(tr);
      });
      table.appendChild(tb);
      tableWrap.appendChild(el("div", { class: "av-scroll" }, [table]));
    }

    function update() {
      run = E.simulate({ fault: state.fault, onset: onsetFrame(), policy: state.policy, recover: state.recover });
      writeReadout(); drawChart(); drawTree(); drawTable();
    }
    onChange(function (what) { if (what === "run" || what === "level") update(); });
    resizers.push(function () { drawChart(); drawTree(); });
    update();
  }

  /* ------------------------------------------------------------ demo 2: from proof to alarm */

  var BLOCKS = {
    SUM1: { title: "SUM1 (subtract)", plain: "Takes the pitch the pilot asked for and subtracts the pitch the sensor reads. The difference is the error.",
      pre: "|r| ≤ 15° and |θ| ≤ 30°", post: "e = r − θ", formal: "∀(r, θ). P_I(r, θ) ⇒ e = r − θ ∧ |e| ≤ 45°" },
    GAIN: { title: "GAIN (multiply by Kp = 1.5)", plain: "Turns the error into a push on the elevator: 1.5 degrees of elevator for every degree of error.",
      pre: "|e| ≤ 45°", post: "p = 1.5·e", formal: "∀e. |e| ≤ 45 ⇒ p = Kp·e ∧ |p| ≤ 67.5°" },
    INT: { title: "INT (integrator, clamped)", plain: "Adds up small errors over time so the aircraft settles exactly on the command, and never lets that running total grow past 15°.",
      pre: "|s′| ≤ 15° (the stored total)", post: "s = clamp(s′ + Ki·T·e, ±15°)", formal: "∀(s′, e). |s′| ≤ Smax ⇒ s = clamp(s′ + Ki·T·e) ∧ |s| ≤ Smax" },
    SUM2: { title: "SUM2 (add)", plain: "Adds the push from the error and the running total.",
      pre: "|p| ≤ 67.5° and |s| ≤ 15°", post: "v = p + s", formal: "∀(p, s). P_3 ⇒ v = p + s ∧ |v − p| ≤ Smax" },
    SAT: { title: "SAT (limiter)", plain: "Keeps the elevator command inside the 25° the actuator can move.",
      pre: "v is a number", post: "u = clamp(v, ±25°)", formal: "∀v. u = sat(v) ∧ |u| ≤ Umax ∧ |sat(a) − sat(b)| ≤ |a − b|" }
  };

  function mountProof(root) {
    root.classList.add("w-ready");
    var diagram = svg("svg", { class: "av-diagram", role: "img" });
    var detail = el("div", { class: "av-detail", "aria-live": "polite" });
    var chain = el("div", { class: "av-chain", "data-levels": "ug grad res" });
    root.appendChild(el("p", { class: "w-note", text: "Select a block to see the property proved for it and the check generated from that proof." }));
    root.appendChild(diagram);
    root.appendChild(detail);
    root.appendChild(chain);

    function draw() {
      var W = chartWidth(diagram), narrow = W < 520;
      var H = narrow ? 250 : 170;
      diagram.setAttribute("viewBox", "0 0 " + W + " " + H); diagram.setAttribute("width", W); diagram.setAttribute("height", H);
      diagram.innerHTML = "";
      var defs = svg("defs", {});
      var mk = svg("marker", { id: "av-arrow", viewBox: "0 0 10 10", refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: "auto-start-reverse" });
      mk.appendChild(svg("path", { d: "M0 0 L10 5 L0 10 z", class: "av-arrowhead" }));
      defs.appendChild(mk); diagram.appendChild(defs);
      // positions (x, y) of block centers
      var bw = narrow ? 64 : 76, bh = 34, pos;
      if (!narrow) {
        var gx = (W - 40) / 5;
        pos = { SUM1: [40 + gx * 0.5, 62], GAIN: [40 + gx * 1.6, 62], INT: [40 + gx * 1.6, 132], SUM2: [40 + gx * 2.8, 92], SAT: [40 + gx * 4.0, 92] };
      } else {
        pos = { SUM1: [W * 0.22, 56], GAIN: [W * 0.55, 56], INT: [W * 0.55, 128], SUM2: [W * 0.55, 200], SAT: [W * 0.85, 200] };
      }
      // module boxes
      function modBox(names, label) {
        var xs = names.map(function (n) { return pos[n][0]; }), ys = names.map(function (n) { return pos[n][1]; });
        var x0 = Math.min.apply(null, xs) - bw / 2 - 8, x1 = Math.max.apply(null, xs) + bw / 2 + 8;
        var y0 = Math.min.apply(null, ys) - bh / 2 - 16, y1 = Math.max.apply(null, ys) + bh / 2 + 6;
        var g = svg("g", { "data-levels": "ug grad res" });
        g.appendChild(svg("rect", { class: "av-module", x: x0, y: y0, width: x1 - x0, height: y1 - y0 }));
        g.appendChild(svg("text", { class: "c-label", x: x0 + 4, y: y0 + 11 }, label));
        diagram.appendChild(g);
      }
      modBox(["SUM1", "GAIN"], "module A");
      modBox(narrow ? ["INT", "SUM2", "SAT"] : ["INT", "SUM2", "SAT"], "module B");
      function wire(a, b, label, via) {
        var d = "M" + a[0] + " " + a[1] + (via ? " L" + via[0] + " " + via[1] : "") + " L" + b[0] + " " + b[1];
        diagram.appendChild(svg("path", { class: "av-wire", d: d, "marker-end": "url(#av-arrow)" }));
        if (label) {
          var lp = via || [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
          diagram.appendChild(svg("text", { class: "c-tick", x: lp[0] + 3, y: lp[1] - 4 }, label));
        }
      }
      var h = bw / 2;
      var inX = narrow ? 8 : 4;
      diagram.appendChild(svg("text", { class: "c-label", x: inX, y: pos.SUM1[1] - 14 }, "r, θ"));
      wire([inX, pos.SUM1[1]], [pos.SUM1[0] - h, pos.SUM1[1]]);
      wire([pos.SUM1[0] + h, pos.SUM1[1]], [pos.GAIN[0] - h, pos.GAIN[1]], "e");
      wire([pos.SUM1[0], pos.SUM1[1] + bh / 2], [pos.INT[0] - h, pos.INT[1]], null, [pos.SUM1[0], pos.INT[1]]);
      if (!narrow) {
        wire([pos.GAIN[0] + h, pos.GAIN[1]], [pos.SUM2[0] - h, pos.SUM2[1] - 6], "p");
        wire([pos.INT[0] + h, pos.INT[1]], [pos.SUM2[0] - h, pos.SUM2[1] + 6], "s");
        wire([pos.SUM2[0] + h, pos.SUM2[1]], [pos.SAT[0] - h, pos.SAT[1]], "v");
        wire([pos.SAT[0] + h, pos.SAT[1]], [W - 4, pos.SAT[1]], "u");
      } else {
        wire([pos.GAIN[0] + h, pos.GAIN[1]], [pos.SUM2[0] + h - 10, pos.SUM2[1] - bh / 2], "p", [pos.GAIN[0] + h + 12, pos.SUM2[1] - bh / 2 - 12]);
        wire([pos.INT[0], pos.INT[1] + bh / 2], [pos.SUM2[0], pos.SUM2[1] - bh / 2], "s");
        wire([pos.SUM2[0] + h, pos.SUM2[1]], [pos.SAT[0] - h, pos.SAT[1]], "v");
        wire([pos.SAT[0], pos.SAT[1] + bh / 2], [pos.SAT[0], H - 2], "u");
      }
      E.LEAVES.forEach(function (n) {
        var p = pos[n];
        var g = svg("g", { class: "av-block" + (state.block === n ? " sel" : ""), tabindex: "0", role: "button", "aria-label": BLOCKS[n].title, "aria-pressed": String(state.block === n) });
        g.appendChild(svg("rect", { x: p[0] - h, y: p[1] - bh / 2, width: bw, height: bh }));
        g.appendChild(svg("text", { x: p[0], y: p[1] + 4, "text-anchor": "middle" }, n));
        function pick() { state.block = n; draw(); writeDetail(); }
        g.addEventListener("click", pick);
        g.addEventListener("keydown", function (ev) { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); pick(); } });
        diagram.appendChild(g);
      });
      diagram.setAttribute("aria-label", "A pitch-hold control law built from five blocks: SUM1, GAIN, INT, SUM2, and SAT, grouped into modules A and B.");
    }

    function writeDetail() {
      var b = BLOCKS[state.block], code = E.assertions()[state.block];
      detail.innerHTML = "";
      detail.appendChild(el("h3", { class: "av-detail-title", text: b.title }));
      detail.appendChild(el("p", { class: "av-detail-plain", text: b.plain }));
      var table = el("table", { class: "results-table av-lemma" });
      var tb = el("tbody");
      tb.appendChild(el("tr", {}, [el("th", { text: "Assumes (pre-condition)" }), el("td", { class: "av-num", text: b.pre })]));
      tb.appendChild(el("tr", {}, [el("th", { text: "Guarantees (post-condition)" }), el("td", { class: "av-num", text: b.post })]));
      var fr = el("tr", { "data-levels": "grad res" }, [el("th", { text: "Lemma" }), el("td", { class: "av-num", text: b.formal })]);
      tb.appendChild(fr);
      table.appendChild(tb);
      detail.appendChild(el("div", { class: "av-table-wrap" }, [table]));
      var pre = el("pre", { class: "av-code", "data-levels": "ug grad res" });
      pre.textContent = "// generated from the " + state.block + " lemma, inserted at the block boundary\n" + code.join("\n");
      detail.appendChild(pre);
    }

    function writeChain() {
      chain.innerHTML = "";
      var a = E.assertions();
      var pre = el("pre", { class: "av-code" });
      pre.textContent =
        "// global theorem, from the five local lemmas (Section IV):\n" +
        "//   P_I(r, θ) ⇒ |u| ≤ " + E.UMAX + "° ∧ |u − sat(Kp·e)| ≤ Smax\n" +
        "// because |s| ≤ Smax (INT), v − p = s (SUM2), and sat is 1-Lipschitz (SAT)\n" +
        a.PI.join("\n") + "\n" + a.PO.join("\n");
      chain.appendChild(el("p", { class: "w-note", text: "The checks at the controller's boundary come from the global theorem, which the five block lemmas prove together. The output check is weaker than the blocks' checks combined: it constrains u only to within Smax of the proportional term." }));
      chain.appendChild(pre);
    }

    draw(); writeDetail(); writeChain();
    resizers.push(draw);
  }

  /* ------------------------------------------------------------ demo 3: a family of architectures */

  function mountFamily(root) {
    root.classList.add("w-ready");
    var fam = E.family(), props = E.properties();
    var byId = {}; fam.forEach(function (n) { byId[n.id] = n; });
    var propSeg = seg(props.map(function (p) { return { value: p.id, label: p.name, title: "Needs " + p.needs }; }), state.prop,
      function (v) { state.prop = v; draw(); writeNode(); }, "Property proved");
    var treeSvg = svg("svg", { class: "av-family", role: "img" });
    var needs = el("p", { class: "w-note" });
    var nodeInfo = el("div", { class: "av-node", "aria-live": "polite" });
    var compose = el("div", { class: "av-compose", "data-levels": "ug grad res" });
    var custom = el("div", { class: "av-custom", "data-levels": "ug grad res" });
    root.appendChild(labeled("Property", propSeg));
    root.appendChild(needs);
    root.appendChild(treeSvg);
    root.appendChild(nodeInfo);
    root.appendChild(compose);
    root.appendChild(custom);

    var POS = { core: [0.5, 0], a1: [0.32, 1], a5: [0.8, 1], a2: [0.16, 2], a3: [0.5, 2], a4: [0.33, 3] };
    function draw() {
      var W = chartWidth(treeSvg), H = 262, nw = W < 460 ? 78 : 96, nh = 36;
      treeSvg.setAttribute("viewBox", "0 0 " + W + " " + H); treeSvg.setAttribute("width", W); treeSvg.setAttribute("height", H);
      treeSvg.innerHTML = "";
      var prop = props.filter(function (p) { return p.id === state.prop; })[0];
      needs.textContent = "“" + prop.name + "” needs " + prop.needs + ". Highlighted nodes satisfy it, so the proof done once at the highest of them carries to every node below.";
      function at(id) { return [12 + nw / 2 + (W - 24 - nw) * POS[id][0], 22 + POS[id][1] * 64]; }
      fam.forEach(function (n) {
        var parents = n.parent == null ? [] : [].concat(n.parent);
        parents.forEach(function (pid) {
          var a = at(pid), b = at(n.id);
          treeSvg.appendChild(svg("line", { class: "av-edge" + (parents.length > 1 ? " compose" : ""), x1: a[0], y1: a[1] + nh / 2, x2: b[0], y2: b[1] - nh / 2 }));
        });
      });
      fam.forEach(function (n) {
        var p = at(n.id), ok = E.holds(n.domain, prop.req);
        var g = svg("g", { class: "av-arch" + (ok ? " holds" : "") + (state.node === n.id ? " sel" : ""), tabindex: "0", role: "button", "aria-pressed": String(state.node === n.id),
          "aria-label": n.name + (ok ? ", property holds" : ", property not established") });
        g.appendChild(svg("rect", { x: p[0] - nw / 2, y: p[1] - nh / 2, width: nw, height: nh }));
        g.appendChild(svg("text", { x: p[0], y: p[1] - 2, "text-anchor": "middle", class: "av-arch-name" }, n.name));
        g.appendChild(svg("text", { x: p[0], y: p[1] + 12, "text-anchor": "middle", class: "av-arch-sub" }, ok ? "holds" : "not proved"));
        function pick() { state.node = n.id; draw(); writeNode(); writeCustom(); }
        g.addEventListener("click", pick);
        g.addEventListener("keydown", function (ev) { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); pick(); } });
        treeSvg.appendChild(g);
      });
      var holdsCount = fam.filter(function (n) { return E.holds(n.domain, prop.req); }).length;
      treeSvg.setAttribute("aria-label", "A family of six architectures. The selected property holds on " + holdsCount + " of them.");
    }

    function paramTable(d, parentD) {
      var table = el("table", { class: "results-table av-params" });
      table.appendChild(el("thead", {}, [el("tr", {}, [el("th", { text: "Parameter" }), el("th", { text: "Allowed values" })])]));
      var tb = el("tbody");
      E.PARAMS.forEach(function (p) {
        var val = E.fmtParam(d, p.key);
        var narrowed = parentD && E.fmtParam(parentD, p.key) !== val;
        tb.appendChild(el("tr", { class: narrowed ? "on" : "" }, [el("td", { text: p.name + " (" + p.key + ")" }), el("td", { class: "av-num", text: val })]));
      });
      table.appendChild(tb);
      return el("div", { class: "av-table-wrap" }, [table]);
    }

    function writeNode() {
      var n = byId[state.node];
      var parentD = n.parent == null ? null : (Array.isArray(n.parent) ? null : byId[n.parent].domain);
      var proved = props.filter(function (p) { return E.holds(n.domain, p.req); }).map(function (p) { return p.name.toLowerCase(); });
      nodeInfo.innerHTML = "";
      nodeInfo.appendChild(el("p", { class: "av-readout", html: "<strong>" + n.name + "</strong>: " + n.how + "." }));
      nodeInfo.appendChild(paramTable(n.domain, parentD));
      nodeInfo.appendChild(el("p", { class: "w-note", text: proved.length ? "Proved properties that hold here without new work: " + proved.join("; ") + "." : "None of the three properties is established at this level; the parameters are still too open." }));
    }

    var selA, selB, compOut;
    function buildCompose() {
      function sel(value, onPick) {
        var s = el("select", { class: "av-select" });
        fam.forEach(function (n) { var o = el("option", { value: n.id, text: n.name }); if (n.id === value) o.selected = true; s.appendChild(o); });
        s.addEventListener("change", function () { onPick(s.value); writeCompose(); });
        return s;
      }
      selA = sel(state.compA, function (v) { state.compA = v; });
      selB = sel(state.compB, function (v) { state.compB = v; });
      compOut = el("p", { class: "av-readout", "aria-live": "polite" });
      compose.appendChild(el("h3", { class: "av-sub", text: "Compose two refinements" }));
      compose.appendChild(el("div", { class: "av-ctl" }, [selA, el("span", { class: "av-ctl-label", text: "with" }), selB]));
      compose.appendChild(compOut);
      writeCompose();
    }
    function writeCompose() {
      var a = byId[state.compA], b = byId[state.compB], c = E.compose(a.domain, b.domain);
      if (c.conflicts.length) {
        compOut.innerHTML = "<strong>Conflict.</strong> " + a.name + " and " + b.name + " cannot be merged: no design satisfies both on " +
          c.conflicts.map(function (k) { return E.PARAMS.filter(function (p) { return p.key === k; })[0].name.toLowerCase() + " (" + E.fmtParam(a.domain, k) + " against " + E.fmtParam(b.domain, k) + ")"; }).join(" and ") + ".";
      } else {
        var proved = props.filter(function (p) { return E.holds(c.domain, p.req); }).map(function (p) { return p.id.toUpperCase(); });
        compOut.innerHTML = "<strong>Compatible.</strong> The merged architecture allows " +
          E.PARAMS.map(function (p) { return p.key + " " + E.fmtParam(c.domain, p.key); }).join(", ") +
          (proved.length ? "; it keeps " + proved.join(", ") + "." : "; none of the three properties is established.");
      }
    }

    var cMin, cMax, cD1, cOut;
    function buildCustom() {
      cMin = range("N1 at least", 0, 20, 1, state.custom.min, String, function (v) { state.custom.min = v; writeCustom(); });
      cMax = range("N1 at most", 1, 21, 1, state.custom.max, function (v) { return v > 20 ? "any" : String(v); }, function (v) { state.custom.max = v; writeCustom(); });
      cD1 = range("D1 at most", 1, 40, 1, state.custom.d1, function (v) { return v + " ms"; }, function (v) { state.custom.d1 = v; writeCustom(); });
      cOut = el("p", { class: "av-readout", "aria-live": "polite" });
      custom.appendChild(el("h3", { class: "av-sub", text: "Refine the selected node yourself" }));
      custom.appendChild(cMin); custom.appendChild(cMax); custom.appendChild(cD1);
      custom.appendChild(cOut);
      writeCustom();
    }
    function writeCustom() {
      if (!cOut) return;
      var n = byId[state.node];
      var hi = state.custom.max > 20 ? E.INF : state.custom.max;
      var child = E.narrow(n.domain, { N1: E.iv(state.custom.min, hi), D1: E.iv(0, state.custom.d1, true, false) });
      if (E.isEmpty(child)) { cOut.innerHTML = "<strong>Empty.</strong> No design has at least " + state.custom.min + " and at most " + state.custom.max + " integrators."; return; }
      var w = E.widens(child, n.domain);
      if (w.length) {
        cOut.innerHTML = "<strong>Not a refinement of " + n.name + ".</strong> It widens " + w.map(function (k) { return k + " (" + n.name + " allows " + E.fmtParam(n.domain, k) + ", yours allows " + E.fmtParam(child, k) + ")"; }).join(" and ") +
          ", so proofs made at " + n.name + " would not carry over.";
      } else {
        var proved = props.filter(function (p) { return E.holds(child, p.req); });
        cOut.innerHTML = "<strong>A valid refinement of " + n.name + "</strong> (N1 " + E.fmtParam(child, "N1") + ", D1 " + E.fmtParam(child, "D1") + "). " +
          (proved.length ? "It inherits " + proved.map(function (p) { return "“" + p.name + "”"; }).join(", ") + " with no new proof." : "None of the three properties is established yet.");
      }
    }

    draw(); writeNode(); buildCompose(); buildCustom();
    resizers.push(draw);
  }

  /* ------------------------------------------------------------ demo 4: how long would testing take */

  function mountTesting(root) {
    root.classList.add("w-ready");
    var rate = seg([
      { value: 1e-5, label: "1 in 100,000 h" }, { value: 1e-7, label: "1 in 10 million h" }, { value: 1e-9, label: "1 in a billion h" }
    ], state.rate, function (v) { state.rate = v; update(); }, "Failure rate to demonstrate");
    var conf = seg([
      { value: 0.9, label: "90%" }, { value: 0.95, label: "95%" }, { value: 0.99, label: "99%" }
    ], state.conf, function (v) { state.conf = v; update(); }, "Confidence");
    var fleet = range("Test aircraft", 1, 500, 1, state.fleet, String, function (v) { state.fleet = v; update(); });
    var hours = range("Hours each per year", 100, 4000, 100, state.hours, int, function (v) { state.hours = v; update(); });
    var chart = svg("svg", { class: "av-chart av-bars", role: "img" });
    var out = el("p", { class: "av-readout", "aria-live": "polite" });
    root.appendChild(labeled("Rate", rate));
    root.appendChild(labeled("Confidence", conf));
    root.appendChild(fleet); root.appendChild(hours);
    root.appendChild(chart); root.appendChild(out);

    function draw() {
      var W = chartWidth(chart), H = 150, L = 128, R = 64;
      chart.setAttribute("viewBox", "0 0 " + W + " " + H); chart.setAttribute("width", W); chart.setAttribute("height", H);
      chart.innerHTML = "";
      var rows = [1e-5, 1e-7, 1e-9];
      var lmin = 4, lmax = 10;
      var x = function (h) { return L + (W - L - R) * (Math.log10(h) - lmin) / (lmax - lmin); };
      for (var e = lmin; e <= lmax; e += 2) {
        chart.appendChild(svg("line", { class: "c-grid", x1: x(Math.pow(10, e)), x2: x(Math.pow(10, e)), y1: 6, y2: H - 22 }));
        chart.appendChild(svg("text", { class: "c-tick", x: x(Math.pow(10, e)), y: H - 6, "text-anchor": "middle" }, "10^" + e + " h"));
      }
      rows.forEach(function (lam, i) {
        var h = E.testHours(lam, state.conf), y = 12 + i * 38;
        chart.appendChild(svg("text", { class: "c-label", x: 0, y: y + 15 }, lam === 1e-5 ? "1 in 100,000 h" : lam === 1e-7 ? "1 in 10 million h" : "1 in a billion h"));
        chart.appendChild(svg("rect", { class: "av-bar" + (lam === state.rate ? " sel" : ""), x: L, y: y, width: Math.max(1, x(h) - L), height: 22 }));
        chart.appendChild(svg("text", { class: "c-tick", x: x(h) + 4, y: y + 15 }, h.toExponential(1).replace("e+", "×10^") + " h"));
      });
      chart.setAttribute("aria-label", "Failure-free test hours needed at " + Math.round(state.conf * 100) + " percent confidence, on a log scale.");
    }
    function update() {
      var h = E.testHours(state.rate, state.conf), perYear = state.fleet * state.hours, years = h / perYear;
      out.innerHTML = "Showing a failure rate below " + (state.rate === 1e-9 ? "one in a billion" : state.rate === 1e-7 ? "one in 10 million" : "one in 100,000") + " flight hours with " +
        Math.round(state.conf * 100) + "% confidence takes <strong>" + int(h) + " failure-free hours</strong>: " +
        (years >= 100 ? int(years) : years.toFixed(years < 10 ? 1 : 0)) + " years for " + int(state.fleet) + " aircraft flying " + int(state.hours) + " hours each per year." +
        '<span class="w-mono">Computed by this page: hours = −ln(1 − confidence) / rate, the zero-failure bound for a constant failure rate. The paper states the 10⁻⁹ target; it does not compute test time.</span>';
      draw();
    }
    resizers.push(draw);
    update();
  }

  /* ------------------------------------------------------------ mount */

  function mount(id, fn) { var node = document.getElementById(id); if (node) fn(node); }
  function start() {
    mount("av-catch", mountCatch);
    mount("av-proof", mountProof);
    mount("av-family", mountFamily);
    mount("av-testing", mountTesting);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();

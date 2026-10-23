/*
  Widget for /papers/sdmlp-dpa-logic/.
  Mount points: #sd-cell, #sd-bdd, #sd-tables, #sd-probe, #sd-attack.
  Everything is computed on the visitor's device by sdmlp-engine.js. The probe
  and attack demos use simulated switching (this page's model), labeled as
  such on every figure; the paper's measurements came from HSPICE simulation
  of 90 nm layouts and appear only in the tables demo.
*/
(function () {
  "use strict";

  var E = window.Sdmlp;
  if (!E) return;
  var SVGNS = "http://www.w3.org/2000/svg";
  var SCRIPT_BASE = (document.currentScript && document.currentScript.src || "").replace(/[^/]*$/, "");
  var state = { sbox: 0, level: window.PaperKit ? window.PaperKit.level() : "public", data: null };
  var levelListeners = [], dataListeners = [];
  document.addEventListener("paperlevel", function (e) {
    state.level = e.detail.level;
    levelListeners.forEach(function (fn) { fn(state.level); });
  });
  function atLeast(lv) {
    var order = ["public", "hs", "ug", "grad", "res"];
    return order.indexOf(state.level) >= order.indexOf(lv);
  }

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
    var lab = el("label", { class: "w-range" }, [el("span", { text: label }), input, out]);
    lab.input = input; lab.out = out;
    return lab;
  }
  function check(label, value, onChange) {
    var input = el("input", { type: "checkbox" });
    input.checked = !!value;
    input.addEventListener("change", function () { onChange(input.checked); });
    var lab = el("label", { class: "w-check" }, [input, el("span", { text: label })]);
    lab.input = input;
    return lab;
  }
  function fmt(x, d) { return x == null || isNaN(x) ? "–" : x.toFixed(d == null ? 3 : d); }
  function num(x) { return Math.round(x).toLocaleString("en-US"); }
  var SBOX_OPTS = [0, 1, 2, 3, 4, 5, 6, 7].map(function (n) { return { value: n, label: "S" + (n + 1) }; });

  /* ------------------------------------------- demo 1: the SDMLp cell */
  function mountCell(root) {
    var s = { row: 0, a: 1, b: 0, sel: 0, history: [], play: null };
    var GATE_OPTS = E.TABLE1.map(function (r, i) { return { value: i, label: r.name }; });
    var gateSeg = seg(GATE_OPTS, 0, function (v) { s.row = v; s.history = []; step(); }, "Gate");
    function bitBtn(name) {
      var b = el("button", { type: "button", class: "w-btn w-btn-quiet sd-bit" });
      b.addEventListener("click", function () { s[name] = 1 - s[name]; render(); });
      b.refresh = function () { b.textContent = (name === "sel" ? "S" : name.toUpperCase()) + " = " + s[name]; };
      return b;
    }
    var bA = bitBtn("a"), bB = bitBtn("b"), bS = bitBtn("sel");
    var bClock = el("button", { type: "button", class: "w-btn", text: "Next clock", onclick: function () { step(); } });
    var bPlay = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "Random inputs, 12 clocks", onclick: function () { play(); } });
    var nodeHost = el("div", { class: "sd-table-wrap" });
    var chart = svg("svg", { class: "sd-chart", role: "img" });
    var big = el("p", { class: "w-big", "aria-live": "polite" });
    var verify = el("p", { class: "w-note" });
    root.appendChild(el("div", { class: "w-actions" }, [gateSeg]));
    root.appendChild(el("div", { class: "w-actions" }, [bA, bB, bS, bClock, bPlay]));
    root.appendChild(nodeHost);
    root.appendChild(big);
    root.appendChild(chart);
    root.appendChild(verify);

    var v = E.verifyTable1(), cases = v.rows.reduce(function (t, r) { return t + r.cases; }, 0);
    verify.innerHTML = (v.ok ? "Checked on this device: all seven rows of Table I" : "Check failed: not every row of Table I") +
      " give the printed Out and Outbar on every input (" + cases + " cases), Eqs. (1) and (2) agree with the switch-level cell, and pre-discharge drives both outputs to 0.";

    function eval1(a, b, sel) {
      var row = E.TABLE1[s.row];
      var c = E.evalRow(row, a, b, sel);
      return { out: c.out, outb: c.outb, scmos: row.f(a, b, sel) };
    }
    function step(a, b, sel) {
      if (a != null) { s.a = a; s.b = b; s.sel = sel; }
      var e = eval1(s.a, s.b, s.sel);
      var prev = s.history.length ? s.history[s.history.length - 1] : null;
      s.history.push({ a: s.a, b: s.b, sel: s.sel, out: e.out, outb: e.outb, scmos: e.scmos,
                       scmosRise: prev ? (prev.scmos === 0 && e.scmos === 1 ? 1 : 0) : 0,
                       scmosFall: prev ? (prev.scmos === 1 && e.scmos === 0 ? 1 : 0) : 0 });
      if (s.history.length > 12) s.history.shift();
      render();
    }
    function play() {
      if (s.play) return;
      var rng = E.mulberry32((Date.now() & 0xffff) + 3), k = 0;
      s.history = [];
      s.play = setInterval(function () {
        step(rng() < 0.5 ? 0 : 1, rng() < 0.5 ? 0 : 1, rng() < 0.5 ? 0 : 1);
        if (++k >= 12) { clearInterval(s.play); s.play = null; }
      }, 220);
    }
    function render() {
      var row = E.TABLE1[s.row], vars = { A: s.a, B: s.b, S: s.sel };
      bA.refresh(); bB.refresh(); bS.refresh();
      bB.style.display = row.name === "BUF" ? "none" : "";
      bS.style.display = row.mux ? "" : "none";
      function lit(n) { var x = vars[n.charAt(0)]; return n.length > 1 ? 1 - x : x; }
      var ip1 = lit(row.ip1), ip2 = lit(row.ip2), sel = lit(row.s);
      var pre = E.cell(ip1, ip2, 0, 0), ev = E.cell(ip1, ip2, sel, 1 - sel);
      clear(nodeHost);
      var t = el("table", { class: "results-table sd-nodes" });
      t.appendChild(el("thead", {}, [el("tr", {}, ["Phase", "S", "Sbar", "Ip1 (" + row.ip1 + ")", "Ip2 (" + row.ip2 + ")", "x", "xbar", "Out", "Outbar"].map(function (h, i) {
        var th = el("th", { text: h });
        if (i >= 3 && i <= 6) th.setAttribute("data-levels", "ug grad res");
        return th;
      }))]));
      var tb = el("tbody");
      [["Pre-discharge", 0, 0, pre], ["Evaluate", sel, 1 - sel, ev]].forEach(function (r) {
        var c = r[3];
        var tds = [r[0], r[1], r[2], ip1, ip2, c.x, c.xb, c.out, c.outb].map(function (val, i) {
          var td = el("td", { text: String(val) });
          if (i >= 3 && i <= 6) td.setAttribute("data-levels", "ug grad res");
          if (i >= 7 && val === 1) td.className = "sd-hot";
          return td;
        });
        tb.appendChild(el("tr", {}, tds));
      });
      t.appendChild(tb);
      nodeHost.appendChild(t);
      big.innerHTML = row.name + " of A = " + s.a + (row.name === "BUF" ? "" : ", B = " + s.b) + (row.mux ? ", S = " + s.sel : "") +
        ": Out = <strong>" + ev.out + "</strong>, Outbar = <strong>" + ev.outb + "</strong>. One of the two rails rose from 0, as it does every clock.";
      draw();
    }
    function draw() {
      var W = chartWidth(chart), padL = 92, padR = 8, rowH = 26, top = 18;
      var rows = [
        { key: "pre", label: "S, Sbar" },
        { key: "out", label: "SDMLp Out" },
        { key: "outb", label: "SDMLp Outbar" },
        { key: "scmos", label: "CMOS output" }
      ];
      var H = top + rows.length * rowH + 50;
      chart.setAttribute("viewBox", "0 0 " + W + " " + H);
      chart.setAttribute("aria-label", "Waveforms over the last " + s.history.length + " clock cycles");
      clear(chart);
      var n = Math.max(1, s.history.length), cw = (W - padL - padR) / 12;
      rows.forEach(function (r, i) {
        var y0 = top + i * rowH + rowH - 6, y1 = top + i * rowH + 6;
        chart.appendChild(svg("text", { class: "c-label", x: 0, y: y0 - 4 }, r.label));
        var d = "", cls = r.key === "scmos" ? "sd-wave cmos" : "sd-wave";
        s.history.forEach(function (h, k) {
          var x0 = padL + k * cw, xm = x0 + cw / 2, x1 = x0 + cw;
          var vPre, vEv;
          if (r.key === "pre") { vPre = 0; vEv = 1; }
          else if (r.key === "scmos") { vPre = h.scmos; vEv = h.scmos; }
          else { vPre = 0; vEv = h[r.key]; }
          var yp = vPre ? y1 : y0, ye = vEv ? y1 : y0;
          d += (k === 0 ? "M" : "L") + x0 + "," + yp + " L" + xm + "," + yp + " L" + xm + "," + ye + " L" + x1 + "," + ye;
          if (r.key !== "pre" && r.key !== "scmos" && vEv) chart.appendChild(svg("text", { class: "sd-rise", x: xm, y: y1 - 1, "text-anchor": "middle" }, "↑"));
          if (r.key === "scmos" && h.scmosRise) chart.appendChild(svg("text", { class: "sd-rise", x: x0, y: y1 - 1, "text-anchor": "middle" }, "↑"));
        });
        if (d) chart.appendChild(svg("path", { class: cls, d: d }));
        chart.appendChild(svg("line", { class: "c-grid", x1: padL, x2: W - padR, y1: y0 + 3, y2: y0 + 3 }));
      });
      // rising-edge counts per cycle
      var yc = top + rows.length * rowH + 16;
      chart.appendChild(svg("text", { class: "c-label", x: 0, y: yc }, "rises, SDMLp"));
      chart.appendChild(svg("text", { class: "c-label", x: 0, y: yc + 16 }, "rises, CMOS"));
      s.history.forEach(function (h, k) {
        var xm = padL + k * cw + cw / 2;
        chart.appendChild(svg("text", { class: "c-tick", x: xm, y: yc, "text-anchor": "middle" }, "1"));
        chart.appendChild(svg("text", { class: "c-tick" + (h.scmosRise ? " sd-tick-hot" : ""), x: padL + k * cw, y: yc + 16, "text-anchor": "middle" }, k === 0 ? "" : String(h.scmosRise)));
      });
      if (!s.history.length) chart.appendChild(svg("text", { class: "c-label", x: padL, y: top + 40 }, "Press Next clock."));
    }
    resizers.push(draw);
    step();
  }

  /* ------------------------------------- demo 2: S-box to multiplexers */
  function mountBDD(root) {
    var s = { out: -1, order: "best", comp: true };
    var sboxSeg = seg(SBOX_OPTS, state.sbox, function (v) { state.sbox = v; draw(); }, "S-box");
    var outSeg = seg([{ value: -1, label: "All four outputs" }, { value: 0, label: "Bit 1" }, { value: 1, label: "Bit 2" }, { value: 2, label: "Bit 3" }, { value: 3, label: "Bit 4" }],
      -1, function (v) { s.out = v; draw(); }, "Outputs");
    var orderSeg = seg([{ value: "natural", label: "Order b1…b6" }, { value: "best", label: "Best of 720" }, { value: "worst", label: "Worst of 720", levels: "grad res" }],
      "best", function (v) { s.order = v; draw(); }, "Variable order");
    var compBox = check("Share complementary nodes (Fig. 3)", true, function (v) { s.comp = v; draw(); });
    compBox.setAttribute("data-levels", "hs ug grad res");
    var big = el("p", { class: "w-big", "aria-live": "polite" });
    var chart = svg("svg", { class: "sd-chart", role: "img" });
    var note = el("p", { class: "w-note" });
    var tableHost = el("div", { class: "sd-table-wrap", "data-levels": "ug grad res" });
    root.appendChild(el("div", { class: "w-actions" }, [sboxSeg]));
    root.appendChild(el("div", { class: "w-actions" }, [outSeg]));
    root.appendChild(el("div", { class: "w-actions" }, [orderSeg, compBox]));
    root.appendChild(big);
    root.appendChild(chart);
    root.appendChild(note);
    root.appendChild(tableHost);

    function orderFor(n, comp) {
      if (s.order === "natural") return [0, 1, 2, 3, 4, 5];
      var d = state.data && state.data.sboxes[n];
      if (!d) return [0, 1, 2, 3, 4, 5];
      var m = comp ? d.comp : d.plain;
      return s.order === "best" ? m.bestOrder : m.worstOrder;
    }
    function draw() {
      var n = state.sbox, tts = E.sboxOutputs(n);
      var useTT = s.out < 0 ? tts : [tts[s.out]];
      var order = orderFor(n, s.comp);
      if (s.out >= 0 && s.order !== "natural") {
        // best and worst orders are stored for the shared four-output graph; for one bit, search here.
        var r = E.bestOrder(useTT, s.comp, "cells");
        order = (s.order === "best" ? r.best : r.worst).order;
      }
      var bdd = E.buildBDD(useTT, order, s.comp);
      // verify the netlist against the S-box on all 64 inputs
      var ok = true;
      for (var x = 0; x < 64; x++) {
        var got = E.evalBDD(bdd, x), want = E.sbox(n, x);
        for (var k = 0; k < useTT.length; k++) {
          var bit = s.out < 0 ? 3 - k : 3 - s.out;
          if (got[k] !== ((want >> bit) & 1)) ok = false;
        }
      }
      big.innerHTML = "S" + (n + 1) + (s.out < 0 ? ", all four outputs" : ", output bit " + (s.out + 1)) + ": <strong>" + bdd.cells + "</strong> SDMLp cells";
      note.textContent = bdd.size + " decision nodes, of which " + bdd.literals + " are a bare input and need only a wire, because every input arrives on two rails. " +
        (ok ? "Checked on this device: the multiplexer network reproduces S" + (n + 1) + " on all 64 inputs." : "Check failed against the S-box table.") +
        " Order, top to bottom: " + order.map(function (v) { return E.VARS[v]; }).join(", ") + ".";
      drawGraph(bdd, useTT.length);
      drawTable();
    }
    function drawGraph(bdd, nRoots) {
      var W = chartWidth(chart), padL = 30, padR = 8, top = 26, rowH = 46;
      var H = top + 6 * rowH + 48;
      chart.setAttribute("viewBox", "0 0 " + W + " " + H);
      chart.setAttribute("aria-label", "Decision diagram with " + bdd.size + " nodes in six levels");
      clear(chart);
      var byLevel = [[], [], [], [], [], []];
      bdd.nodes.forEach(function (nd) { byLevel[nd.level].push(nd); });
      var pos = {};
      byLevel.forEach(function (list, lv) {
        var y = top + lv * rowH + 16, span = W - padL - padR;
        list.forEach(function (nd, i) { pos[nd.id] = { x: padL + span * (i + 0.5) / list.length, y: y }; });
        chart.appendChild(svg("text", { class: "c-label", x: 0, y: y + 4 }, E.VARS[bdd.order[lv]]));
      });
      var ty = top + 6 * rowH + 10;
      // terminals live under their own keys so they never collide with node ids 0 and 1
      function key(ref) { return ref === "0" || ref === "1" ? "T" + ref : ref; }
      pos.T0 = { x: padL + (W - padL - padR) * (bdd.comp ? 0.5 : 0.35), y: ty };
      pos.T1 = { x: padL + (W - padL - padR) * 0.65, y: ty };
      var gEdges = svg("g"), gNodes = svg("g");
      chart.appendChild(gEdges); chart.appendChild(gNodes);
      bdd.nodes.forEach(function (nd) {
        if (nd.literal) return;
        [["lo", nd.lo, nd.loNeg], ["hi", nd.hi, nd.hiNeg]].forEach(function (e) {
          var a = pos[nd.id], b = pos[key(e[1])];
          if (!b) return;
          gEdges.appendChild(svg("line", { class: "sd-edge " + e[0] + (e[2] ? " neg" : ""), x1: a.x, y1: a.y, x2: b.x, y2: b.y }));
        });
      });
      bdd.nodes.forEach(function (nd) {
        var p = pos[nd.id];
        if (nd.literal) gNodes.appendChild(svg("rect", { class: "sd-lit", x: p.x - 3, y: p.y - 3, width: 6, height: 6 }));
        else gNodes.appendChild(svg("circle", { class: "sd-node", cx: p.x, cy: p.y, r: 4.5 }));
      });
      // terminals: only drawn if some non-literal edge reaches them
      var used = { T0: false, T1: false };
      bdd.nodes.forEach(function (nd) { if (!nd.literal) { used[key(nd.lo)] = true; used[key(nd.hi)] = true; } });
      ["0", "1"].forEach(function (t) {
        if (!used["T" + t]) return;
        var p = pos["T" + t];
        gNodes.appendChild(svg("rect", { class: "sd-term", x: p.x - 9, y: p.y - 9, width: 18, height: 18 }));
        gNodes.appendChild(svg("text", { class: "c-tick", x: p.x, y: p.y + 4, "text-anchor": "middle" }, bdd.comp && t === "0" ? "0/1" : t));
      });
      // roots
      bdd.roots.forEach(function (r, i) {
        var p = pos[key(r.node)]; if (!p) return;
        var x = p.x;
        chart.appendChild(svg("text", { class: "sd-root", x: x, y: 10, "text-anchor": "middle" }, (nRoots > 1 ? "y" + (i + 1) : "y") + (r.neg ? "′" : "")));
        chart.appendChild(svg("line", { class: "sd-edge hi", x1: x, y1: 13, x2: x, y2: p.y - 5 }));
      });
      // legend
      var ly = H - 4;
      chart.appendChild(svg("line", { class: "sd-edge hi", x1: padL, x2: padL + 18, y1: ly - 4, y2: ly - 4 }));
      chart.appendChild(svg("text", { class: "c-tick", x: padL + 22, y: ly }, "input = 1"));
      chart.appendChild(svg("line", { class: "sd-edge lo", x1: padL + 92, x2: padL + 110, y1: ly - 4, y2: ly - 4 }));
      chart.appendChild(svg("text", { class: "c-tick", x: padL + 114, y: ly }, "input = 0"));
      if (bdd.comp) {
        var lg = svg("g", { "data-levels": "ug grad res" });
        lg.appendChild(svg("line", { class: "sd-edge hi neg", x1: padL + 184, x2: padL + 202, y1: ly - 4, y2: ly - 4 }));
        lg.appendChild(svg("text", { class: "c-tick", x: padL + 206, y: ly }, "take Outbar"));
        chart.appendChild(lg);
      }
    }
    function drawTable() {
      clear(tableHost);
      var d = state.data;
      if (!d) { tableHost.appendChild(el("p", { class: "w-note", text: "Loading the 720-order search for all eight S-boxes…" })); return; }
      var t = el("table", { class: "results-table" });
      t.appendChild(el("caption", { class: "w-note", text: "Fewest SDMLp cells over all 720 variable orders, four outputs shared, computed by this page. The last column is the paper's Table VI layout area for each SDMLp S-box." }));
      var head = ["S-box", "Plain ROBDD", "With Fig. 3 step", "Order b1…b6", "Paper: area (λ²)"];
      t.appendChild(el("thead", {}, [el("tr", {}, head.map(function (h, i) { var th = el("th", { text: h }); if (i === 4) th.setAttribute("data-levels", "grad res"); return th; }))]));
      var tb = el("tbody");
      d.sboxes.forEach(function (r, i) {
        var tr = el("tr", { class: i === state.sbox ? "on" : "" }, [
          el("td", { text: "S" + r.sbox }), el("td", { class: "num", text: String(r.plain.best) }),
          el("td", { class: "num", text: String(r.comp.best) }), el("td", { class: "num", text: String(r.comp.natural) }),
          el("td", { class: "num", "data-levels": "grad res", text: E.TABLES.VI.data.SDMLp[i].toFixed(2) })
        ]);
        tr.addEventListener("click", function () { state.sbox = i; sboxSeg.set(i); draw(); });
        tb.appendChild(tr);
      });
      t.appendChild(tb);
      tableHost.appendChild(t);
      var cells = d.sboxes.map(function (r) { return r.comp.best; }), area = E.TABLES.VI.data.SDMLp;
      var rho = E.spearman(cells, area), mx = E.mean(cells), my = E.mean(area), sxy = 0, sxx = 0;
      cells.forEach(function (c, i) { sxy += (c - mx) * (area[i] - my); sxx += (c - mx) * (c - mx); });
      tableHost.appendChild(el("p", { class: "w-note", "data-levels": "grad res",
        text: "Computed by this page, not the paper: across the eight S-boxes, the fewest-cell count and the paper's SDMLp area have Spearman ρ = " + fmt(rho, 2) +
          "; a least-squares line gives " + fmt(sxy / sxx, 1) + " λ² per cell, close to the 18.4 λ² single-cell area of Table IV. The same count against WDDL area gives ρ = " +
          fmt(E.spearman(cells, E.TABLES.VI.data.WDDL), 2) + "." }));
    }
    dataListeners.push(function () { draw(); });
    resizers.push(draw);
    draw();
  }

  /* ------------------------------------- demo 3: the paper's tables */
  function mountTables(root) {
    var KEYS = ["II", "III", "IV", "V", "VI", "VII", "VIII"];
    var s = { t: "II", log: true };
    var tSeg = seg(KEYS.map(function (k) { return { value: k, label: "Table " + k }; }), "II", function (v) { s.t = v; s.log = (v === "II" || v === "VIII"); logBox.input.checked = s.log; draw(); }, "Table");
    var logBox = check("Logarithmic scale", true, function (v) { s.log = v; draw(); });
    var title = el("p", { class: "w-big" });
    var chart = svg("svg", { class: "sd-chart", role: "img" });
    var legend = el("p", { class: "w-note sd-legend" });
    var sumHost = el("div", { class: "sd-table-wrap" });
    var headHost = el("div", { class: "sd-table-wrap" });
    root.appendChild(el("div", { class: "w-actions" }, [tSeg]));
    root.appendChild(el("div", { class: "w-actions" }, [logBox]));
    root.appendChild(title);
    root.appendChild(chart);
    root.appendChild(legend);
    root.appendChild(sumHost);
    root.appendChild(headHost);
    legend.innerHTML = '<span class="sd-key scmos"></span>SCMOS (static CMOS) &nbsp; <span class="sd-key sdmlp"></span>SDMLp &nbsp; <span class="sd-key wddl"></span>WDDL';

    function draw() {
      var T = E.TABLES[s.t];
      title.innerHTML = "Table " + s.t + ": " + T.title + " (" + T.unit + ")";
      var W = chartWidth(chart), padL = 46, padR = 8, padT = 10, padB = 28, H = 230;
      chart.setAttribute("viewBox", "0 0 " + W + " " + H);
      chart.setAttribute("aria-label", "Bar chart of Table " + s.t + " for three logic styles");
      clear(chart);
      var all = [];
      E.STYLES.forEach(function (st) { all = all.concat(T.data[st]); });
      var max = Math.max.apply(null, all), min = Math.min.apply(null, all);
      var lo = s.log ? Math.pow(10, Math.floor(Math.log10(min))) : 0;
      var hi = s.log ? Math.pow(10, Math.ceil(Math.log10(max))) : max * 1.08;
      function y(v) {
        var f = s.log ? (Math.log10(v) - Math.log10(lo)) / (Math.log10(hi) - Math.log10(lo)) : (v - lo) / (hi - lo);
        return H - padB - f * (H - padT - padB);
      }
      var ticks = [];
      if (s.log) for (var p = Math.log10(lo); p <= Math.log10(hi) + 1e-9; p++) ticks.push(Math.pow(10, p));
      else for (var k = 0; k <= 4; k++) ticks.push(hi * k / 4);
      ticks.forEach(function (tv) {
        chart.appendChild(svg("line", { class: "c-grid", x1: padL, x2: W - padR, y1: y(tv), y2: y(tv) }));
        chart.appendChild(svg("text", { class: "c-tick", x: padL - 5, y: y(tv) + 4, "text-anchor": "end" }, tv >= 1000 ? num(tv) : String(+tv.toPrecision(3))));
      });
      var nr = T.rows.length, gw = (W - padL - padR) / nr, bw = gw * 0.24;
      T.rows.forEach(function (rname, i) {
        E.STYLES.forEach(function (st, j) {
          var v = T.data[st][i], x = padL + i * gw + gw * 0.14 + j * bw;
          var rect = svg("rect", { class: "sd-bar " + st.toLowerCase(), x: x, width: bw * 0.9, y: y(v), height: Math.max(1, H - padB - y(v)) });
          rect.appendChild(svg("title", {}, st + ", " + rname + ": " + v));
          chart.appendChild(rect);
        });
        chart.appendChild(svg("text", { class: "c-tick", x: padL + i * gw + gw / 2, y: H - padB + 15, "text-anchor": "middle" }, rname));
      });
      chart.appendChild(svg("line", { class: "c-axis", x1: padL, x2: W - padR, y1: H - padB, y2: H - padB }));
      // summary rows
      clear(sumHost);
      var t = el("table", { class: "results-table" });
      t.appendChild(el("caption", { class: "w-note", text: "Average and standard deviation recomputed by this page from the rows above, next to the printed values. The printed deviations are sample standard deviations (n − 1)." }));
      t.appendChild(el("thead", {}, [el("tr", {}, ["Style", "Average (page)", "Printed", "Std dev (page)", "Printed"].map(function (h) { return el("th", { text: h }); }))]));
      var tb = el("tbody");
      E.STYLES.forEach(function (st) {
        var m = E.mean(T.data[st]), sd = E.sampleSD(T.data[st]), pr = T.printed[st];
        var dec = String(pr[0]).split(".")[1], dd = dec ? dec.length : 0;
        var dec2 = String(pr[1]).split(".")[1], dd2 = dec2 ? dec2.length : 0;
        tb.appendChild(el("tr", {}, [el("td", { text: st }), el("td", { class: "num", text: fmt(m, Math.max(dd, 2)) }), el("td", { class: "num sd-paper", text: String(pr[0]) }),
          el("td", { class: "num", text: fmt(sd, Math.max(dd2, 2)) }), el("td", { class: "num sd-paper", text: String(pr[1]) })]));
      });
      t.appendChild(tb);
      sumHost.appendChild(t);
    }
    // Table IX and the headline claims
    (function () {
      var t = el("table", { class: "results-table" });
      t.appendChild(el("caption", { class: "w-note", text: "Table IX, full-chip DES in each style, with the headline ratios recomputed by this page." }));
      t.appendChild(el("thead", {}, [el("tr", {}, ["Full-chip DES", "SCMOS", "SDMLp", "WDDL"].map(function (h) { return el("th", { text: h }); }))]));
      var tb = el("tbody");
      Object.keys(E.TABLE9).forEach(function (k) {
        var r = E.TABLE9[k];
        tb.appendChild(el("tr", {}, [el("td", { text: r.label }), el("td", { class: "num", text: String(r.SCMOS) }), el("td", { class: "num", text: String(r.SDMLp) }), el("td", { class: "num", text: String(r.WDDL) })]));
      });
      t.appendChild(tb);
      headHost.appendChild(t);
      var h = E.headline();
      headHost.appendChild(el("p", { class: "w-note", html:
        "Against WDDL, SDMLp uses <strong>" + fmt(100 * h.areaVsWDDL, 1) + "%</strong> less area (paper: 43%), <strong>" + fmt(100 * h.powerVsWDDL, 1) +
        "%</strong> less power (paper: 50%), and shows <strong>" + fmt(h.cvarVsWDDL, 1) + "×</strong> less current variance (paper: 40×), at a <strong>" +
        fmt(100 * h.freqVsWDDL, 1) + "%</strong> lower clock (paper: 20%)." }));
      headHost.appendChild(el("p", { class: "w-note", "data-levels": "grad res", html:
        "Against static CMOS, the clock is " + fmt(100 * h.freqVsSCMOS, 1) + "% lower and the current variance " + num(h.cvarVsSCMOS) +
        "× smaller. At the cell level (Table II), the average SCMOS variance is " + fmt(h.cellVarVsSCMOS, 1) + "× the SDMLp average." }));
    })();
    resizers.push(draw);
    draw();
  }

  /* -------------------------------- demo 4: what the power probe sees */
  var NET = null;
  function net() {
    if (NET) return NET;
    var d = state.data, order = d ? d.sboxes[0].comp.bestOrder : [0, 1, 2, 3, 4, 5];
    NET = E.netlist(0, order, true);
    return NET;
  }
  function mountProbe(root) {
    var s = { mismatch: 0.02, seed: 7 };
    var bNew = el("button", { type: "button", class: "w-btn", text: "New inputs", onclick: function () { s.seed++; draw(); } });
    var mm = range("Rail mismatch", 0, 0.2, 0.01, s.mismatch, function (v) { s.mismatch = v; draw(); }, function (v) { return Math.round(v * 100) + "%"; });
    mm.setAttribute("data-levels", "ug grad res");
    var sim = el("div", { class: "w-sim", text: "Simulated switching for DES S-box 1 (this page's model, not the paper's measurements)" });
    var chart = svg("svg", { class: "sd-chart", role: "img" });
    var big = el("p", { class: "w-big", "aria-live": "polite" });
    var note = el("p", { class: "w-note" });
    root.appendChild(el("div", { class: "w-actions" }, [bNew, mm]));
    root.appendChild(sim);
    root.appendChild(chart);
    root.appendChild(big);
    root.appendChild(note);
    function draw() {
      var nt = net(), rng = E.mulberry32(s.seed);
      var eps = []; for (var i = 0; i < nt.cells; i++) eps.push((2 * rng() - 1) * s.mismatch);
      var xs = []; for (var j = 0; j < 1001; j++) xs.push(Math.floor(rng() * 64));
      var cm = [], sd = [];
      for (var k = 1; k < xs.length; k++) { cm.push(E.scmosToggles(nt, xs[k - 1], xs[k])); sd.push(E.sdmlpCharge(nt, xs[k], eps)); }
      var vC = Math.pow(E.sampleSD(cm), 2), vS = Math.pow(E.sampleSD(sd), 2);
      var W = chartWidth(chart), padL = 92, padR = 8, H = 220, panel = 82, n = 40;
      chart.setAttribute("viewBox", "0 0 " + W + " " + H);
      chart.setAttribute("aria-label", "Switching per clock for 40 clocks in static CMOS and SDMLp");
      clear(chart);
      var max = nt.cells * 1.25, bw = (W - padL - padR) / n;
      [["Static CMOS", cm, "scmos", 8], ["SDMLp", sd, "sdmlp", 8 + panel + 24]].forEach(function (p) {
        var y0 = p[3] + panel;
        chart.appendChild(svg("text", { class: "c-label", x: 0, y: p[3] + 14 }, p[0]));
        chart.appendChild(svg("text", { class: "c-tick", x: 0, y: y0 - 2 }, "per clock"));
        chart.appendChild(svg("line", { class: "c-axis", x1: padL, x2: W - padR, y1: y0, y2: y0 }));
        var yC = y0 - (nt.cells / max) * panel;
        chart.appendChild(svg("line", { class: "c-grid", x1: padL, x2: W - padR, y1: yC, y2: yC }));
        chart.appendChild(svg("text", { class: "c-tick", x: padL - 4, y: yC + 4, "text-anchor": "end" }, String(nt.cells)));
        chart.appendChild(svg("text", { class: "c-tick", x: padL - 4, y: y0 + 4, "text-anchor": "end" }, "0"));
        for (var q = 0; q < n; q++) {
          var v = p[1][q], h = (v / max) * panel;
          chart.appendChild(svg("rect", { class: "sd-bar " + p[2], x: padL + q * bw + bw * 0.12, width: bw * 0.76, y: y0 - h, height: Math.max(1, h) }));
        }
      });
      big.innerHTML = "Spread over 1,000 simulated clocks: static CMOS variance <strong>" + fmt(vC, 1) + "</strong>, SDMLp variance <strong>" + (vS < 0.0005 ? "0" : fmt(vS, 4)) + "</strong>.";
      note.textContent = "Units are cell switchings (the netlist has " + nt.cells + " cells). In static CMOS a cell switches only when its value changes, so the count follows the data. " +
        "Every SDMLp cell pre-discharges and then raises exactly one of its two rails each clock" + (s.mismatch > 0 ? "; a rail mismatch of " + Math.round(s.mismatch * 100) + "% makes the true and false rails cost slightly different charge, which leaves a small data-dependent ripple." : ", so the count never changes.") +
        " The paper's HSPICE measurement for S-box 1 (Table VIII): 7,490 for SCMOS against 3.03 for SDMLp, in units of 10⁻⁷ A².";
    }
    dataListeners.push(function () { NET = null; draw(); });
    resizers.push(draw);
    draw();
  }

  /* ------------------------------------------- demo 5: run the attack */
  function mountAttack(root) {
    var s = { n: 5000, sigma: 1, mismatch: 0.02, model: "hd", seed: 1, res: null, running: false };
    var nSeg = seg([{ value: 500, label: "500 traces" }, { value: 5000, label: "5,000 traces" }, { value: 50000, label: "50,000", levels: "grad res" }], 5000, function (v) { s.n = v; run(); }, "Traces");
    var noise = range("Noise σ", 0, 4, 0.5, s.sigma, function (v) { s.sigma = v; }, function (v) { return v.toFixed(1); });
    noise.setAttribute("data-levels", "hs ug grad res");
    noise.input.addEventListener("change", function () { run(); });
    var mm = range("Rail mismatch", 0, 0.2, 0.01, s.mismatch, function (v) { s.mismatch = v; }, function (v) { return Math.round(v * 100) + "%"; });
    mm.setAttribute("data-levels", "ug grad res");
    mm.input.addEventListener("change", function () { run(); });
    var modelSeg = seg([{ value: "hd", label: "Bit flips (HD)" }, { value: "hw", label: "Ones (HW)" }, { value: "profile", label: "Profiled device" }], "hd", function (v) { s.model = v; run(); }, "Attacker's model");
    var modelWrap = el("div", { class: "w-actions", "data-levels": "grad res" }, [el("span", { class: "w-sim", text: "Attacker's model" }), modelSeg]);
    var bRun = el("button", { type: "button", class: "w-btn", text: "New random inputs", onclick: function () { s.seed++; run(); } });
    var big = el("p", { class: "w-big", "aria-live": "polite" });
    var sim = el("div", { class: "w-sim", text: "Simulated power traces, DES S-box 1, secret subkey 20 (this page's model; the paper attacked HSPICE traces). Charts show |correlation| for all 64 guesses, key 20 highlighted; the lower bars are scaled to each panel's largest." });
    var chart = svg("svg", { class: "sd-chart", role: "img" });
    var chart2 = svg("svg", { class: "sd-chart", role: "img" });
    var note = el("p", { class: "w-note" });
    root.appendChild(el("div", { class: "w-actions" }, [nSeg, bRun]));
    root.appendChild(el("div", { class: "w-actions" }, [noise, mm]));
    root.appendChild(modelWrap);
    root.appendChild(big);
    root.appendChild(sim);
    root.appendChild(chart);
    root.appendChild(chart2);
    root.appendChild(note);

    function checkpoints(n) {
      var cps = [], v = 5;
      while (v < n) { cps.push(Math.round(v)); v *= 1.12; }
      cps.push(n);
      return cps.filter(function (x, i, a) { return a.indexOf(x) === i; });
    }
    function run() {
      if (s.running) return;
      s.running = true;
      big.textContent = "Running…";
      setTimeout(function () {
        var nt = net(), cps = checkpoints(s.n);
        var a = E.attack({ style: "scmos", net: nt, n: s.n, sigma: s.sigma, mismatch: s.mismatch, model: s.model, seed: s.seed, checkpoints: cps, trackReveal: true });
        var b = E.attack({ style: "sdmlp", net: nt, n: s.n, sigma: s.sigma, mismatch: s.mismatch, model: s.model, seed: s.seed, checkpoints: cps, trackReveal: true });
        s.res = [a, b];
        s.running = false;
        draw();
      }, 20);
    }
    function rankOf(r, key) {
      var a = Math.abs(r[key]), rank = 1;
      for (var g = 0; g < 64; g++) if (g !== key && Math.abs(r[g]) > a) rank++;
      return rank;
    }
    function draw() {
      if (!s.res) return;
      var W = chartWidth(chart), padL = 46, padR = 8, panel = 110, gap = 34, H = 2 * panel + gap + 44;
      chart.setAttribute("viewBox", "0 0 " + W + " " + H);
      chart.setAttribute("aria-label", "Correlation of all 64 key guesses against the number of traces, for static CMOS and SDMLp");
      clear(chart);
      var maxN = s.n, minN = 5;
      function x(n) { return padL + (Math.log(n) - Math.log(minN)) / (Math.log(maxN) - Math.log(minN)) * (W - padL - padR); }
      var ymax = 0.5;
      s.res.forEach(function (res, pi) {
        var top = 8 + pi * (panel + gap), y0 = top + panel;
        function y(v) { return y0 - Math.min(1, v / ymax) * panel; }
        chart.appendChild(svg("text", { class: "c-label", x: padL + 4, y: top + 10 }, pi === 0 ? "Static CMOS" : "SDMLp"));
        [0, 0.25, 0.5].forEach(function (tv) {
          chart.appendChild(svg("line", { class: tv === 0 ? "c-axis" : "c-grid", x1: padL, x2: W - padR, y1: y(tv), y2: y(tv) }));
          chart.appendChild(svg("text", { class: "c-tick", x: padL - 5, y: y(tv) + 4, "text-anchor": "end" }, tv.toFixed(2)));
        });
        for (var g = 0; g < 64; g++) {
          if (g === res.key) continue;
          var d = "";
          res.series.forEach(function (pt, k) { d += (k ? "L" : "M") + x(pt.n).toFixed(1) + "," + y(Math.abs(pt.r[g])).toFixed(1); });
          chart.appendChild(svg("path", { class: "sd-line other", d: d }));
        }
        var dk = "";
        res.series.forEach(function (pt, k) { dk += (k ? "L" : "M") + x(pt.n).toFixed(1) + "," + y(Math.abs(pt.r[res.key])).toFixed(1); });
        chart.appendChild(svg("path", { class: "sd-line key", d: dk }));
        if (res.revealed) {
          chart.appendChild(svg("line", { class: "sd-ref", x1: x(res.revealed), x2: x(res.revealed), y1: top, y2: y0 }));
          chart.appendChild(svg("text", { class: "c-tick", x: Math.min(W - padR - 70, x(res.revealed) + 4), y: top + 24 }, "key leads from " + num(res.revealed)));
        }
        if (pi === 0 && maxN >= 70) {
          chart.appendChild(svg("line", { class: "sd-paperref", x1: x(70), x2: x(70), y1: top, y2: y0 }));
          chart.appendChild(svg("text", { class: "c-tick", x: x(70) + 4, y: y0 - 6 }, "paper: 70"));
        }
      });
      [5, 10, 100, 1000, 10000, 50000].forEach(function (tv) {
        if (tv > maxN) return;
        chart.appendChild(svg("text", { class: "c-tick", x: x(tv), y: H - 22, "text-anchor": "middle" }, num(tv)));
      });
      chart.appendChild(svg("text", { class: "c-label", x: padL + (W - padL - padR) / 2, y: H - 6, "text-anchor": "middle" }, "traces (log scale)"));

      // final correlation per key guess
      var W2 = W, H2 = 2 * 92 + 50;
      chart2.setAttribute("viewBox", "0 0 " + W2 + " " + H2);
      chart2.setAttribute("aria-label", "Final correlation for each of the 64 key guesses");
      clear(chart2);
      var bw = (W2 - padL - padR) / 64;
      s.res.forEach(function (res, pi) {
        var top = 6 + pi * (92 + 18), y0 = top + 80;
        var fmax = Math.max.apply(null, res.final.map(Math.abs)) || 1;
        chart2.appendChild(svg("text", { class: "c-label", x: padL + 4, y: top + 10 }, (pi === 0 ? "Static CMOS" : "SDMLp") + ", after " + num(res.n)));
        chart2.appendChild(svg("line", { class: "c-axis", x1: padL, x2: W2 - padR, y1: y0, y2: y0 }));
        chart2.appendChild(svg("text", { class: "c-tick", x: padL - 5, y: top + 18, "text-anchor": "end" }, fmt(fmax, 2)));
        chart2.appendChild(svg("text", { class: "c-tick", x: padL - 5, y: y0 + 4, "text-anchor": "end" }, "0"));
        for (var g = 0; g < 64; g++) {
          var h = Math.abs(res.final[g]) / fmax * 62;
          chart2.appendChild(svg("rect", { class: "sd-bar " + (g === res.key ? "key" : "guess"), x: padL + g * bw + bw * 0.12, width: bw * 0.76, y: y0 - h, height: Math.max(1, h) }));
        }
      });
      [0, 20, 40, 63].forEach(function (g) {
        chart2.appendChild(svg("text", { class: "c-tick", x: padL + g * bw + bw / 2, y: H2 - 18, "text-anchor": "middle" }, String(g)));
      });
      chart2.appendChild(svg("text", { class: "c-label", x: padL + (W2 - padL - padR) / 2, y: H2 - 4, "text-anchor": "middle" }, "key guess (0 to 63)"));

      var a = s.res[0], b = s.res[1];
      big.innerHTML = "Static CMOS: " + (a.revealed ? "key 20 leads for good from trace <strong>" + num(a.revealed) + "</strong>" : "key 20 <strong>not found</strong> in " + num(a.n) + " traces") +
        ". SDMLp: " + (b.revealed ? "key 20 leads from trace <strong>" + num(b.revealed) + "</strong>" : "key 20 <strong>not found</strong> in " + num(b.n) + " traces (rank " + rankOf(b.final, 20) + " of 64)") + ".";
      note.textContent = "Paper (Section V-C, HSPICE traces of one DES round): the SCMOS key appeared after 70 vectors; the SDMLp and WDDL keys stayed hidden after 5,000. " +
        "This page's traces are simulated: static CMOS leaks the number of cells that change value; SDMLp leaks only through the rail mismatch" +
        (s.mismatch > 0 ? " (" + Math.round(s.mismatch * 100) + "% here)" : " (0% here, so nothing)") + ", plus Gaussian noise σ = " + s.sigma.toFixed(1) + ". The curves change with the random inputs; press New random inputs to see the spread.";
    }
    dataListeners.push(function () { NET = null; run(); });
    resizers.push(draw);
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
    mount("sd-cell", mountCell);
    mount("sd-bdd", mountBDD);
    mount("sd-tables", mountTables);
    mount("sd-probe", mountProbe);
    mount("sd-attack", mountAttack);
    fetch(SCRIPT_BASE + "sdmlp-data.json").then(function (r) { return r.json(); }).then(function (data) {
      state.data = data;
      dataListeners.forEach(function (fn) { fn(); });
    }).catch(function () { /* the demos fall back to the b1…b6 order */ });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();

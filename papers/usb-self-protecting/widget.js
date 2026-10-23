/*
  Self-protecting USB storage widget for /papers/usb-self-protecting/.
  Mount points: #us-steal, #us-cbw, #us-trust, #us-traces, #us-tune.
  One shared state: the three trust constants, the address unit, and the operations watched.
  The detector is trust-engine.js (a port of the paper's printed calcNewTrust).
  File-system traces come from fat-traces.json (recorded with pyfatfs, labeled recreated).
*/
(function () {
  "use strict";

  var E = window.UsbTrust;
  if (!E) return;

  var SVGNS = "http://www.w3.org/2000/svg";
  var DATA_URL = (document.currentScript && document.currentScript.src)
    ? document.currentScript.src.replace(/widget\.js(\?.*)?$/, "fat-traces.json")
    : "fat-traces.json";
  var DEVICE_KEY = 0x1234abcd;     // the stand-in key shared by the owner's driver and the device
  var TRACE_ORDER = ["format", "write_files", "read_files", "delete_files"];

  /* ------------------------------------------------------------ state */

  var state = {
    start: 3, inc: 1, max: 8,     // the paper's constants
    unit: "block", ops: "all",
    trace: "write_files",
    level: window.PaperKit ? window.PaperKit.level() : "public",
    data: null
  };
  var listeners = [];
  function onChange(fn) { listeners.push(fn); }
  function changed(what) { listeners.forEach(function (fn) { fn(what); }); }
  document.addEventListener("paperlevel", function (e) { state.level = e.detail.level; changed("level"); });
  function deep() { return state.level === "grad" || state.level === "res"; }
  function atLeastUg() { return state.level === "ug" || deep(); }
  function params() { return { start: state.start, inc: state.inc, max: state.max }; }
  function isPaper() { return state.start === 3 && state.inc === 1 && state.max === 8; }

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
    var row = el("div", { class: "us-ctl" }, [el("span", { class: "us-ctl-label", text: label }), control]);
    if (levels) row.setAttribute("data-levels", levels);
    return row;
  }
  function range(label, min, max, value, onInput, levels) {
    var input = el("input", { type: "range", min: String(min), max: String(max), step: "1", value: String(value), "aria-label": label });
    var out = el("output", { text: String(value) });
    input.addEventListener("input", function () { out.textContent = input.value; onInput(Number(input.value)); });
    var row = el("label", { class: "w-range" }, [el("span", { text: label }), input, out]);
    if (levels) row.setAttribute("data-levels", levels);
    row.set = function (v) { input.value = String(v); out.textContent = String(v); };
    return row;
  }
  function int(x) { return Math.round(x).toLocaleString("en-US"); }
  function words(n) { return ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"][n] || int(n); }
  function hex(v, bytes) { var s = (v >>> 0).toString(16).toUpperCase(); while (s.length < bytes * 2) s = "0" + s; return s; }
  function opsToTrace(rows) { return rows.map(function (r) { return [r[0] ? "WRITE" : "READ", r[1], r[2]]; }); }
  function traceOf(key) { return opsToTrace(state.data.traces[key].ops); }

  // Shared constant controls (one copy per demo that needs them; all stay in sync).
  var constControls = [];
  function constantsBlock(levels) {
    var s = range("START_TRUST", 1, 12, state.start, function (v) { state.start = v; if (state.max < v) { state.max = v; } sync(); changed("params"); });
    var m = range("MAX_TRUST", 1, 16, state.max, function (v) { state.max = v; if (state.start > v) { state.start = v; } sync(); changed("params"); });
    var i = range("INC_TRUST", 1, 4, state.inc, function (v) { state.inc = v; sync(); changed("params"); });
    var reset = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "Paper's values (3, 1, 8)" });
    reset.addEventListener("click", function () { state.start = 3; state.inc = 1; state.max = 8; sync(); changed("params"); });
    var box = el("div", { class: "us-consts" }, [s, i, m, el("div", { class: "w-actions" }, [reset])]);
    if (levels) box.setAttribute("data-levels", levels);
    constControls.push({ s: s, m: m, i: i });
    return box;
  }
  function sync() { constControls.forEach(function (c) { c.s.set(state.start); c.m.set(state.max); c.i.set(state.inc); }); }

  // Trust meter: MAX pips, filled to the current trust.
  function meter(svgNode, trust, max, locked) {
    var W = chartWidth(svgNode), H = 44;
    svgNode.setAttribute("viewBox", "0 0 " + W + " " + H); svgNode.setAttribute("width", W); svgNode.setAttribute("height", H);
    svgNode.innerHTML = "";
    var n = Math.max(1, max), gap = 4, label = 92, pw = Math.min(30, (W - label - 90 - gap * n) / n);
    svgNode.appendChild(svg("text", { class: "c-label", x: 0, y: 26 }, "trust " + Math.max(trust, 0) + " of " + max));
    for (var k = 0; k < n; k++) {
      svgNode.appendChild(svg("rect", { class: "us-pip" + (k < trust ? " on" : "") + (locked ? " dead" : ""), x: label + k * (pw + gap), y: 12, width: pw, height: 20 }));
    }
    var sx = label + n * (pw + gap) + 8;
    svgNode.appendChild(svg("text", { class: "us-status" + (locked ? " locked" : ""), x: sx, y: 27 }, locked ? "LOCKED" : "OPEN"));
    svgNode.setAttribute("aria-label", locked ? "The drive has locked." : "Trust " + trust + " of " + max + "; the drive is open.");
  }

  /* ------------------------------------------------------------ demo 1: steal the drive */

  function mountSteal(root) {
    root.classList.add("w-ready");
    var N = state.data.blocks;
    var scenarios = [
      { value: "owner", label: "Owner copies files", title: "The owner's driver encrypts each address; the drive decrypts and sees ordinary file-system traffic" },
      { value: "dump", label: "Thief copies the raw drive", title: "A copy tool reads blocks 0, 1, 2, ... without the driver's cipher" },
      { value: "random", label: "Thief probes at random", title: "Random addresses, as a forensic carving tool might try" }
    ];
    var pick = "owner";
    var sSeg = seg(scenarios, pick, function (v) { pick = v; build(); }, "Who is reading");
    var playBtn = el("button", { type: "button", class: "w-btn", text: "Play" });
    var stepBtn = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "One access" });
    var endBtn = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "Skip to end" });
    var tiles = el("div", { class: "us-tiles", "aria-hidden": "true" });
    var meterSvg = svg("svg", { class: "us-meter", role: "img" });
    var readout = el("div", { class: "us-readout", "aria-live": "polite" });
    var key = el("p", { class: "w-note us-key", html: '<span class="us-k seq"></span> next block (+1 trust) &nbsp; <span class="us-k dup"></span> same block (no change) &nbsp; <span class="us-k jump"></span> jump (−1 trust)' });
    root.appendChild(labeled("Who is reading", sSeg));
    root.appendChild(el("div", { class: "w-actions" }, [playBtn, stepBtn, endBtn]));
    root.appendChild(meterSvg); root.appendChild(tiles); root.appendChild(key); root.appendChild(readout);

    var addrs = [], wire = [], res = null, pos = 0, timer = null;
    function build() {
      stop();
      if (pick === "owner") {
        var al = E.addresses(traceOf("write_files"), { unit: state.unit, ops: state.ops }).map(function (x) { return x.a; });
        addrs = al.slice(0, 260);
      } else {
        addrs = E.intruder(pick, N, 260, 11, DEVICE_KEY);
      }
      // What travels on the cable: the owner's driver encrypts; a raw copy tool sends plain counters.
      wire = addrs.map(function (a, i) {
        if (pick === "owner") return E.encrypt(a, DEVICE_KEY, N);
        if (pick === "dump") return i;
        return E.encrypt(a, DEVICE_KEY, N);
      });
      res = E.run(addrs, params());
      pos = 0;
      draw();
    }
    function stop() { if (timer) clearInterval(timer); timer = null; playBtn.textContent = "Play"; playBtn.classList.remove("running"); }
    function advance() {
      var limit = res.tamper >= 0 ? res.tamper + 1 : addrs.length;
      if (pos >= limit) { stop(); return; }
      pos++; draw();
      if (pos >= limit) stop();
    }
    playBtn.addEventListener("click", function () {
      if (timer) { stop(); return; }
      var limit = res.tamper >= 0 ? res.tamper + 1 : addrs.length;
      if (pos >= limit) { pos = 0; }
      playBtn.textContent = "Pause"; playBtn.classList.add("running");
      timer = setInterval(advance, pick === "owner" ? 60 : 380);
    });
    stepBtn.addEventListener("click", function () { stop(); advance(); });
    endBtn.addEventListener("click", function () { stop(); pos = res.tamper >= 0 ? res.tamper + 1 : addrs.length; draw(); });

    function draw() {
      var locked = res.tamper >= 0 && pos > res.tamper;
      var trust = pos === 0 ? state.start : res.trust[pos - 1];
      meter(meterSvg, trust, state.max, locked);
      tiles.innerHTML = "";
      var from = Math.max(0, pos - 24);
      for (var i = from; i < pos; i++) {
        var k = res.kind[i];
        var t = el("span", { class: "us-tile " + k });
        t.appendChild(el("b", { text: String(addrs[i]) }));
        if (atLeastUg()) t.appendChild(el("i", { text: "wire " + wire[i] }));
        tiles.appendChild(t);
      }
      if (pos === 0) tiles.appendChild(el("span", { class: "w-note", text: "Press Play. Each tile is one block the drive is asked for." }));
      var html;
      if (locked) {
        html = "<strong>Locked after " + words(res.tamper + 1) + " accesses.</strong> " +
          (pick === "dump" ? "The copy tool asked for blocks 0, 1, 2, and so on, but the drive decrypts every address it receives, so to the drive the requests landed all over the disk. Trust started at " + state.start + " and fell to zero."
            : "Random addresses are almost never one block apart, so each request cost one unit of trust until none was left.");
      } else if (pos >= addrs.length) {
        html = pick === "owner"
          ? "<strong>Still open after " + int(addrs.length) + " accesses.</strong> A file system mostly reads and writes runs of neighboring blocks, so trust stays high; the jumps between the file table, the directory, and the data cost a unit each and are quickly earned back."
          : "<strong>Still open.</strong> With these constants this pattern did not drain the trust.";
      } else {
        html = "Access " + pos + " of " + addrs.length + (pos ? ": block " + addrs[pos - 1] + ", trust " + trust + "." : ".");
      }
      if (atLeastUg()) {
        html += " <span class='w-mono'>tile: block the drive sees after decryption; wire: address on the cable. Constants " + state.start + ", " + state.inc + ", " + state.max +
          (pick === "owner" ? "; first 260 block accesses of the recreated write trace (" + (state.unit === "block" ? "one address per block" : "one address per command") + ")" : "; stand-in cipher, 32,768-block drive") + ".</span>";
      }
      readout.innerHTML = html;
    }
    onChange(function (what) { if (what === "params" || what === "unit") build(); else if (what === "level") draw(); });
    resizers.push(draw);
    build();
  }

  /* ------------------------------------------------------------ demo 2: one READ command */

  function mountCbw(root) {
    root.classList.add("w-ready");
    var lba = 1000, len = 8, tag = 0x0000002A;
    var lbaR = range("Block address", 0, 32767, lba, function (v) { lba = v; draw(); });
    var lenR = range("Blocks", 1, 16, len, function (v) { len = v; draw(); });
    var bytesBox = el("div", { class: "us-bytes", role: "img" });
    var tableWrap = el("div", { "data-levels": "ug grad res" });
    var plain = el("p", { class: "us-readout", "data-levels": "public hs" });
    var sees = el("p", { class: "us-readout" });
    root.appendChild(lbaR); root.appendChild(lenR);
    root.appendChild(bytesBox); root.appendChild(plain); root.appendChild(tableWrap); root.appendChild(sees);

    function draw() {
      var b = [];
      function u32le(v) { b.push(v & 255, (v >>> 8) & 255, (v >>> 16) & 255, (v >>> 24) & 255); }
      u32le(0x43425355);          // dCBWSignature "USBC"
      u32le(tag);                  // dCBWTag
      u32le(len * 512);            // dCBWDataTransferLength
      b.push(0x80, 0x00, 0x0A);    // bCBWFlags (device to host), bCBWLUN, bCBWCBLength
      var cdb = [0x28, 0, (lba >>> 24) & 255, (lba >>> 16) & 255, (lba >>> 8) & 255, lba & 255, 0, (len >>> 8) & 255, len & 255, 0];
      for (var i = 0; i < 16; i++) b.push(i < cdb.length ? cdb[i] : 0);
      var groups = [
        { n: 4, cls: "f-sig", name: "dCBWSignature" }, { n: 4, cls: "f-tag", name: "dCBWTag" },
        { n: 4, cls: "f-len", name: "dCBWDataTransferLength" }, { n: 1, cls: "f-flag", name: "bCBWFlags" },
        { n: 1, cls: "f-lun", name: "bCBWLUN" }, { n: 1, cls: "f-cbl", name: "bCBWCBLength" },
        { n: 1, cls: "f-op", name: "opcode" }, { n: 1, cls: "f-pad", name: "" }, { n: 4, cls: "f-lba", name: "LBA" },
        { n: 1, cls: "f-pad", name: "" }, { n: 2, cls: "f-cnt", name: "length" }, { n: 7, cls: "f-pad", name: "" }
      ];
      bytesBox.innerHTML = ""; var idx = 0;
      groups.forEach(function (g) {
        for (var k = 0; k < g.n; k++) { bytesBox.appendChild(el("span", { class: "us-byte " + g.cls, title: g.name ? g.name : "unused", text: hex(b[idx], 1) })); idx++; }
      });
      bytesBox.setAttribute("aria-label", "The 31 bytes of a Command Block Wrapper carrying a SCSI READ(10) of " + len + " blocks at block " + lba + ".");
      plain.innerHTML = "The computer's request is " + b.length + " bytes long. Most of it is bookkeeping; the highlighted bytes say <strong>read " + len + (len === 1 ? " block" : " blocks") + " starting at block " + lba + "</strong>.";
      var rows = [
        ["0–3", "dCBWSignature", "55 53 42 43", "magic number “USBC”, for synchronization"],
        ["4–7", "dCBWTag", hex(tag, 4), "transaction ID, echoed in the device's status reply"],
        ["8–11", "dCBWDataTransferLength", int(len * 512), "bytes expected: " + len + " × 512"],
        ["12", "bCBWFlags", "80", "direction bit set: data flows device to host"],
        ["13", "bCBWLUN", "00", "logical unit 0"],
        ["14", "bCBWCBLength", "0A", "a 10-byte SCSI command follows"],
        ["15–30", "CBWCB", "28 … ", "READ(10): opcode 28h, block " + int(lba) + " in bytes 17 to 20, length " + len + " in bytes 22 and 23"]
      ];
      var t = el("table", { class: "results-table us-cbw-table" });

      var th = el("tr"); ["bytes", "field", "value", "meaning"].forEach(function (h) { th.appendChild(el("th", { text: h })); });
      t.appendChild(el("thead", null, [th]));
      var tb = el("tbody");
      rows.forEach(function (r) { var tr = el("tr"); r.forEach(function (c, j) { tr.appendChild(el("td", { class: j < 3 ? "us-num" : "", text: c })); }); tb.appendChild(tr); });
      t.appendChild(tb);
      tableWrap.innerHTML = "";
      tableWrap.appendChild(el("p", { class: "w-note", text: "The paper's CBW struct, field by field (4 + 4 + 4 + 1 + 1 + 1 + 16 = 31 bytes)." }));
      tableWrap.appendChild(el("div", { class: "us-table-wrap" }, [t]));
      var list = []; for (var q = 0; q < Math.min(len, 6); q++) list.push(lba + q);
      var blockTxt = list.join(", ") + (len > 6 ? ", …, " + (lba + len - 1) : "");
      sees.innerHTML = state.unit === "block" || !atLeastUg()
        ? "The tamper detector checks <strong>" + words(len) + (len === 1 ? " address" : " addresses") + "</strong>: " + blockTxt + (len > 1 ? ". Each one is the previous plus one, so a single multi-block read earns trust." : ".")
        : "Reading <strong>one address per command</strong>, the detector checks only block " + lba + ". The next sequential read would start at " + (lba + len) + ", which is not " + lba + " + 1, so even a steady file read counts as a jump.";
      if (atLeastUg()) sees.innerHTML += " <span class='w-mono'>ScsiInterpreter::InterpretCmdRead10 calls AnalyzeReadRequest(" + lba + ", " + len + ").</span>";
    }
    onChange(function (what) { if (what === "unit" || what === "level") draw(); });
    draw();
  }

  /* ------------------------------------------------------------ demo 3: the trust counter */

  function mountTrust(root) {
    root.classList.add("w-ready");
    var seq = [100];
    var presets = [
      { value: "three", label: "Three jumps", seq: [100, 512, 7, 3000] },
      { value: "earn", label: "Earn, then jump", seq: [100, 101, 102, 103, 104, 105, 106, 107, 108, 2000, 40, 77, 9, 1500, 600, 61, 900, 3] },
      { value: "file", label: "A small file save", seq: [1, 2, 65, 66, 97, 98, 99, 100, 101, 102, 103, 104, 1, 65] },
      { value: "dup", label: "Same block again", seq: [500, 500, 500, 501, 501, 502, 9000, 9000, 9001] }
    ];
    var pSeg = seg(presets.map(function (p) { return { value: p.value, label: p.label }; }), null, function (v) {
      presets.forEach(function (p) { if (p.value === v) seq = p.seq.slice(); }); draw();
    }, "Example sequences");
    var b1 = el("button", { type: "button", class: "w-btn", text: "Next block (+1)" });
    var b2 = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "Same block" });
    var b3 = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "Jump" });
    var b4 = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "Clear" });
    var r = E.rng(5);
    b1.addEventListener("click", function () { seq.push(seq[seq.length - 1] + 1); pSeg.set(null); draw(); });
    b2.addEventListener("click", function () { seq.push(seq[seq.length - 1]); pSeg.set(null); draw(); });
    b3.addEventListener("click", function () { var a; do { a = Math.floor(r() * 4000); } while (a === seq[seq.length - 1] || a === seq[seq.length - 1] + 1); seq.push(a); pSeg.set(null); draw(); });
    b4.addEventListener("click", function () { seq = [100]; pSeg.set(null); draw(); });
    var chart = svg("svg", { class: "us-chart", role: "img" });
    var readout = el("div", { class: "us-readout", "aria-live": "polite" });
    var code = el("pre", { class: "us-code", "data-levels": "ug grad res" });
    root.appendChild(labeled("Examples", pSeg));
    root.appendChild(el("div", { class: "w-actions" }, [b1, b2, b3, b4]));
    root.appendChild(constantsBlock("ug grad res"));
    root.appendChild(chart); root.appendChild(readout); root.appendChild(code);

    function draw() {
      if (seq.length > 40) seq = seq.slice(seq.length - 40);
      var res = E.run(seq, params());
      var W = chartWidth(chart), H = 210, L = 34, R = 10, T = 14, B = 44;
      chart.setAttribute("viewBox", "0 0 " + W + " " + H); chart.setAttribute("width", W); chart.setAttribute("height", H);
      chart.innerHTML = "";
      var n = seq.length, iw = W - L - R, ih = H - T - B;
      var lo = Math.min(-1, res.minTrust), hi = state.max;
      function x(i) { return L + (n <= 1 ? iw / 2 : iw * (i / (n - 1))); }
      function y(v) { return T + ih * (1 - (v - lo) / (hi - lo)); }
      for (var v = lo; v <= hi; v++) {
        if ((hi - lo) > 12 && v % 2) continue;
        chart.appendChild(svg("line", { class: v === 0 ? "us-zero" : "c-grid", x1: L, x2: L + iw, y1: y(v), y2: y(v) }));
        chart.appendChild(svg("text", { class: "c-tick", x: L - 6, y: y(v) + 4, "text-anchor": "end" }, String(v)));
      }
      chart.appendChild(svg("text", { class: "c-label us-zero-label", x: L + iw, y: y(0) + 14, "text-anchor": "end" }, "trust ≤ 0: tamper event, drive disabled"));
      chart.appendChild(svg("line", { class: "us-max", x1: L, x2: L + iw, y1: y(state.max), y2: y(state.max) }));
      var pts = res.trust.map(function (t, i) { return x(i).toFixed(1) + "," + y(t).toFixed(1); });
      chart.appendChild(svg("polyline", { class: "us-line", points: pts.join(" ") }));
      res.trust.forEach(function (t, i) {
        chart.appendChild(svg("circle", { class: "us-dot " + res.kind[i] + (res.tamper >= 0 && i >= res.tamper ? " dead" : ""), cx: x(i), cy: y(t), r: 4 }));
        if (n <= 20 || i % Math.ceil(n / 20) === 0) chart.appendChild(svg("text", { class: "c-tick us-addr", x: x(i), y: H - B + 18, "text-anchor": "middle", transform: n > 12 ? "rotate(-40 " + x(i) + " " + (H - B + 18) + ")" : "" }, String(seq[i])));
      });
      chart.appendChild(svg("text", { class: "c-label", x: L, y: H - 4 }, "block address of each access"));
      chart.setAttribute("aria-label", "Trust after each of " + n + " accesses; lowest " + res.minTrust + ".");
      var html;
      if (res.tamper >= 0) html = "<strong>Tamper event at access " + (res.tamper + 1) + "</strong> (block " + seq[res.tamper] + "). In the device, every later request would be refused.";
      else html = "Trust is <strong>" + res.trust[n - 1] + "</strong> after " + words(n) + (n === 1 ? " access" : " accesses") + ". The first access only sets the starting point.";
      html += " " + res.seq + " sequential, " + res.dup + " repeated, " + res.jumps + " jumps.";
      if (!isPaper()) html += " <span class='w-mono'>Constants changed from the paper's 3, 1, 8.</span>";
      readout.innerHTML = html;
      code.textContent =
        "// Paper, Section 5 (Java test harness)\n" +
        "START_TRUST = " + state.start + ";  INC_TRUST = " + state.inc + ";  MAX_TRUST = " + state.max + ";\n" +
        "if (previousAddress == address)        return trust;               // duplicate\n" +
        "else if (previousAddress + 1 == address) trust = min(trust + INC_TRUST, MAX_TRUST);\n" +
        "else                                   trust -= INC_TRUST;          // jump\n" +
        "// tamper event when trust <= 0";
    }
    onChange(function (what) { if (what === "params" || what === "level") draw(); });
    resizers.push(draw);
    draw();
  }

  /* ------------------------------------------------------------ demo 4: file-system traces */

  function mountTraces(root) {
    root.classList.add("w-ready");
    var tSeg = seg(TRACE_ORDER.map(function (k) { return { value: k, label: state.data.traces[k].label }; }), state.trace, function (v) { state.trace = v; draw(); }, "Trace");
    var uSeg = seg([{ value: "block", label: "Each block" }, { value: "request", label: "Each command" }], state.unit, function (v) { state.unit = v; changed("unit"); }, "Address checked");
    var oSeg = seg([{ value: "all", label: "All" }, { value: "read", label: "Reads" }, { value: "write", label: "Writes" }], state.ops, function (v) { state.ops = v; changed("unit"); }, "Operations watched");
    var chart = svg("svg", { class: "us-chart", role: "img" });
    var tchart = svg("svg", { class: "us-chart", role: "img" });
    var readout = el("div", { class: "us-readout", "aria-live": "polite" });
    var summary = el("div", { "data-levels": "ug grad res" });
    root.appendChild(labeled("Trace", tSeg));
    root.appendChild(labeled("Address checked", uSeg, "ug grad res"));
    root.appendChild(labeled("Watching", oSeg, "grad res"));
    root.appendChild(chart); root.appendChild(tchart);
    root.appendChild(el("p", { class: "w-note us-key", html: '<span class="us-k read"></span> read &nbsp; <span class="us-k write"></span> write &nbsp; <span class="us-k jump"></span> jump. Recreated traces: pyfatfs on a 16 MB FAT16 drive, not the paper\'s Windows captures.' }));
    root.appendChild(readout); root.appendChild(summary);

    function draw() {
      var tr = traceOf(state.trace);
      var al = E.addresses(tr, { unit: state.unit, ops: state.ops });
      var res = E.run(al, params());
      var lay = state.data.layout;
      var n = al.length;
      var maxA = 0; al.forEach(function (x) { if (x.a > maxA) maxA = x.a; });
      maxA = Math.max(120, Math.ceil((maxA + 1) / 50) * 50);
      // address scatter
      var W = chartWidth(chart), H = 230, L = 46, R = 70, T = 10, B = 26, iw = W - L - R, ih = H - T - B;
      chart.setAttribute("viewBox", "0 0 " + W + " " + H); chart.setAttribute("width", W); chart.setAttribute("height", H);
      chart.innerHTML = "";
      function x(i) { return L + iw * (n <= 1 ? 0.5 : i / (n - 1)); }
      function y(a) { return T + ih * (1 - a / maxA); }
      var bands = [["FAT", lay.fat1[0], lay.fat2[1]], ["directory", lay.root[0], lay.root[1]]];
      bands.forEach(function (b, k) {
        chart.appendChild(svg("rect", { class: "us-band b" + k, x: L, y: y(b[2] + 1), width: iw, height: Math.max(1, y(b[1]) - y(b[2] + 1)) }));
        chart.appendChild(svg("text", { class: "c-tick", x: L + iw + 4, y: (y(b[1]) + y(b[2] + 1)) / 2 + 4 }, b[0]));
      });
      chart.appendChild(svg("text", { class: "c-tick", x: L + iw + 4, y: y(maxA * 0.6) }, "file data"));
      [0, maxA / 2, maxA].forEach(function (v) {
        chart.appendChild(svg("line", { class: "c-grid", x1: L, x2: L + iw, y1: y(v), y2: y(v) }));
        chart.appendChild(svg("text", { class: "c-tick", x: L - 6, y: y(v) + 4, "text-anchor": "end" }, int(v)));
      });
      chart.appendChild(svg("text", { class: "c-label", x: L + 4, y: T + 12 }, "block address"));
      var step = Math.max(1, Math.floor(n / 1400));
      for (var i = 0; i < n; i += step) {
        var a = al[i];
        chart.appendChild(svg("rect", { class: "us-pt " + (a.op === "READ" ? "read" : "write") + (res.kind[i] === "jump" ? " jump" : ""), x: x(i) - 1.2, y: y(a.a) - 1.2, width: 2.4, height: 2.4 }));
      }
      chart.setAttribute("aria-label", "Block address of each of " + n + " accesses in the " + state.data.traces[state.trace].label + " trace.");
      // trust strip
      var H2 = 130, T2 = 10, B2 = 26, ih2 = H2 - T2 - B2;
      tchart.setAttribute("viewBox", "0 0 " + W + " " + H2); tchart.setAttribute("width", W); tchart.setAttribute("height", H2);
      tchart.innerHTML = "";
      var lo = Math.max(-12, Math.min(0, res.minTrust)), hi = state.max;
      function y2(v) { return T2 + ih2 * (1 - (Math.max(lo, v) - lo) / Math.max(1, hi - lo)); }
      tchart.appendChild(svg("line", { class: "us-zero", x1: L, x2: L + iw, y1: y2(0), y2: y2(0) }));
      tchart.appendChild(svg("text", { class: "c-tick", x: L - 6, y: y2(0) + 4, "text-anchor": "end" }, "0"));
      tchart.appendChild(svg("text", { class: "c-tick", x: L - 6, y: y2(hi) + 4, "text-anchor": "end" }, String(hi)));
      tchart.appendChild(svg("line", { class: "us-max", x1: L, x2: L + iw, y1: y2(hi), y2: y2(hi) }));
      var pts = [];
      for (var j = 0; j < n; j += step) pts.push(x(j).toFixed(1) + "," + y2(res.trust[j]).toFixed(1));
      if (n) pts.push(x(n - 1).toFixed(1) + "," + y2(res.trust[n - 1]).toFixed(1));
      tchart.appendChild(svg("polyline", { class: "us-line", points: pts.join(" ") }));
      if (res.tamper >= 0) {
        tchart.appendChild(svg("line", { class: "us-tamper", x1: x(res.tamper), x2: x(res.tamper), y1: T2, y2: T2 + ih2 }));
        tchart.appendChild(svg("text", { class: "c-label us-tamper-label", x: Math.min(L + iw - 4, x(res.tamper) + 4), y: T2 + 12, "text-anchor": x(res.tamper) > L + iw * 0.7 ? "end" : "start" }, "tamper event"));
      }
      tchart.appendChild(svg("text", { class: "c-label", x: L + 4, y: H2 - 6 }, "trust after each access (" + int(n) + " accesses)"));
      tchart.setAttribute("aria-label", "Trust over the trace; lowest value " + res.minTrust + (res.tamper >= 0 ? "; tamper event at access " + (res.tamper + 1) : "; no tamper event") + ".");
      var html = res.tamper >= 0
        ? "<strong>False alarm.</strong> This legitimate trace drains the trust at access " + int(res.tamper + 1) + " of " + int(n) + ", so the drive would lock on its own owner."
        : "<strong>Accepted.</strong> Trust never falls below " + res.minTrust + " across " + int(n) + " accesses, so the owner never notices the detector.";
      html += " " + int(res.jumps) + " jumps; the longest run of back-to-back jumps is " + words(res.maxRunJumps) + ".";
      readout.innerHTML = html;
      // summary table over all four traces
      var t = el("table", { class: "results-table" });
      var cap = el("p", { class: "w-note", text: "All four recreated traces with the current constants (" + state.start + ", " + state.inc + ", " + state.max + "), " + (state.unit === "block" ? "one address per block" : "one address per command") + ", " + (state.ops === "all" ? "all operations" : state.ops + "s only") + ". Computed by this page." });
      var hr = el("tr"); ["trace", "commands", "addresses checked", "jumps", "longest jump run", "lowest trust", "outcome"].forEach(function (h) { hr.appendChild(el("th", { text: h })); });
      t.appendChild(el("thead", null, [hr]));
      var tb = el("tbody");
      TRACE_ORDER.forEach(function (k) {
        var trk = traceOf(k), a2 = E.addresses(trk, { unit: state.unit, ops: state.ops }), r2 = E.run(a2, params());
        var row = el("tr", k === state.trace ? { class: "on" } : null);
        [state.data.traces[k].label, int(trk.length), int(a2.length), int(r2.jumps), String(r2.maxRunJumps), String(r2.minTrust), a2.length === 0 ? "no accesses" : (r2.tamper >= 0 ? "locks at " + int(r2.tamper + 1) : "accepted")].forEach(function (c, ci) {
          row.appendChild(el("td", { class: ci > 0 && ci < 6 ? "us-num" : "", text: c }));
        });
        tb.appendChild(row);
      });
      t.appendChild(tb);
      summary.innerHTML = ""; summary.appendChild(cap); summary.appendChild(el("div", { class: "us-table-wrap" }, [t]));
      uSeg.set(state.unit); oSeg.set(state.ops);
    }
    onChange(function (what) { if (what === "params" || what === "unit" || what === "level") draw(); });
    resizers.push(draw);
    draw();
  }

  /* ------------------------------------------------------------ demo 5: tuning the constants */

  function mountTune(root) {
    root.classList.add("w-ready");
    var capBox = el("div");
    var wrap = el("div", { class: "us-table-wrap" });
    var readout = el("div", { class: "us-readout", "aria-live": "polite" });
    root.appendChild(capBox); root.appendChild(wrap); root.appendChild(readout);
    root.appendChild(el("p", { class: "w-note", text: "Each cell runs the detector over the four recreated traces and over an intruder whose addresses look random to the drive. Select a cell to load its constants into the other demos. Computed by this page." }));

    function draw() {
      var lists = TRACE_ORDER.map(function (k) { return E.addresses(traceOf(k), { unit: state.unit, ops: state.ops }).map(function (x) { return x.a; }); });
      var thief = E.intruder("random", state.data.blocks, 400, 3, DEVICE_KEY);
      var starts = [1, 2, 3, 4, 5, 6, 8, 10], maxes = [2, 4, 6, 8, 10, 12, 16];
      var t = el("table", { class: "results-table us-tune" });
      var cap = el("p", { class: "w-note", text: "Rows START_TRUST, columns MAX_TRUST, INC_TRUST = " + state.inc + ". Top: legitimate traces accepted (of four). Bottom: accesses an intruder gets before the lock." });
      var hr = el("tr"); hr.appendChild(el("th", { text: "start \\ max" }));
      maxes.forEach(function (m) { hr.appendChild(el("th", { text: String(m) })); });
      t.appendChild(el("thead", null, [hr]));
      var tb = el("tbody");
      starts.forEach(function (s) {
        var row = el("tr"); row.appendChild(el("th", { text: String(s) }));
        maxes.forEach(function (m) {
          var td;
          if (m < s) { td = el("td", { class: "us-na", text: "–" }); row.appendChild(td); return; }
          var p = { start: s, inc: state.inc, max: m };
          var ok = lists.filter(function (al) { return al.length && E.run(al, p).tamper < 0; }).length;
          var tot = lists.filter(function (al) { return al.length; }).length;
          var rt = E.run(thief, p), got = rt.tamper >= 0 ? rt.tamper + 1 : thief.length;
          td = el("td", { class: "us-cell" + (ok === tot ? " good" : "") + (s === state.start && m === state.max ? " sel" : "") + (s === 3 && m === 8 && state.inc === 1 ? " paper" : ""), tabindex: "0", role: "button",
            "aria-label": "Start " + s + ", max " + m + ": " + ok + " of " + tot + " traces accepted; intruder locked out after " + got + " accesses." });
          td.appendChild(el("span", { text: ok + "/" + tot }));
          td.appendChild(el("span", { class: "us-sub", text: got + " acc." }));
          function pick() { state.start = s; state.max = m; sync(); changed("params"); }
          td.addEventListener("click", pick);
          td.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(); } });
          row.appendChild(td);
        });
        tb.appendChild(row);
      });
      t.appendChild(tb);
      wrap.innerHTML = ""; capBox.innerHTML = ""; capBox.appendChild(cap); wrap.appendChild(t);
      var p0 = params(), okNow = lists.filter(function (al) { return al.length && E.run(al, p0).tamper < 0; }).length;
      var minS = E.minimalStart(lists.filter(function (al) { return al.length; }), state.inc, state.max);
      readout.innerHTML = "With START_TRUST " + state.start + " and MAX_TRUST " + state.max + ", " + words(okNow) + " of the four traces pass and an intruder whose addresses land at random is locked out after " + words(state.start + 1) + " accesses (the first sets the starting point, then " + words(Math.ceil(state.start / state.inc)) + (state.start / state.inc === 1 ? " jump" : " jumps") + ")." +
        (minS != null ? " The smallest START_TRUST that accepts every trace here is " + minS + "." : " No START_TRUST up to 64 accepts every trace with these settings.") +
        (isPaper() ? " The outlined cell is the paper's choice." : "");
    }
    onChange(function (what) { if (what === "params" || what === "unit" || what === "level") draw(); });
    draw();
  }

  /* ------------------------------------------------------------ boot */

  function mountAll() {
    var m = {
      "us-steal": mountSteal, "us-cbw": mountCbw, "us-trust": mountTrust, "us-traces": mountTraces, "us-tune": mountTune
    };
    Object.keys(m).forEach(function (id) { var node = document.getElementById(id); if (node) m[id](node); });
  }
  function boot() {
    fetch(DATA_URL).then(function (r) { return r.json(); }).then(function (d) { state.data = d; mountAll(); })
      .catch(function () {
        ["us-steal", "us-traces", "us-tune"].forEach(function (id) { var n = document.getElementById(id); if (n) n.textContent = "The trace data did not load."; });
        var c = document.getElementById("us-cbw"); if (c) mountCbw(c);
        var t = document.getElementById("us-trust"); if (t) mountTrust(t);
      });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();

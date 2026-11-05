/*
  "A Block of Code" widget for /papers/block-of-code/.
  Mount points in the page: #abc-build, #abc-brief, #abc-design, #abc-interest.

  Demo 1 (the tool) lays out blocks on a board, scans them the way the controller's
  lexer does (abc_lexer.py), turns them into program text (squishy_tylo.py), and runs
  the team's interpreter, ported in abc-engine.js and checked against the C original.
  Demo 2 draws the capstone brief (Appendix A) next to what the paper reports was built.
  Demo 3 draws the study design and its checkpoints.
  Demo 4 draws the paper's interest ratings and continuation percentages; at the
  graduate and researcher levels it adds the page's own count readings and exact test.
*/
(function () {
  "use strict";

  var ABC = window.ABC;
  var SVGNS = "http://www.w3.org/2000/svg";

  /* ---------------------------------------------------------------- helpers */
  function el(tag, attrs, kids) {
    var node = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === "text") node.textContent = attrs[k];
      else if (k === "html") node.innerHTML = attrs[k];
      else node.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (kid) { if (kid) node.appendChild(typeof kid === "string" ? document.createTextNode(kid) : kid); });
    return node;
  }
  function svg(tag, attrs, text) {
    var node = document.createElementNS(SVGNS, tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { node.setAttribute(k, attrs[k]); });
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function chartWidth(node) {
    var w = node && node.clientWidth ? node.clientWidth : 640;
    return Math.max(300, Math.min(760, w));
  }
  function minus(s) { return String(s).replace(/^-/, "−"); }
  var WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
  function words(n) { return n < 10 && n >= 0 ? WORDS[n] : String(n); }

  var redraws = [];
  var resizeTimer = null;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () { redraws.forEach(function (fn) { fn(); }); }, 150);
  });
  document.addEventListener("paperlevel", function () {
    setTimeout(function () { redraws.forEach(function (fn) { fn(); }); }, 0);
  });
  function level() {
    var p = document.querySelector(".paper");
    return (p && p.getAttribute("data-level")) || "public";
  }

  function segmented(label, options, value, onChange) {
    var wrap = el("div", { class: "seg", role: "radiogroup", "aria-label": label });
    var buttons = options.map(function (opt) {
      var b = el("button", { type: "button", class: "seg-option", role: "radio", "data-value": String(opt.value), text: opt.label });
      if (opt.title) b.setAttribute("title", opt.title);
      if (opt.levels) b.setAttribute("data-levels", opt.levels);
      b.addEventListener("click", function () { set(opt.value); onChange(opt.value); });
      wrap.appendChild(b);
      return b;
    });
    function set(v) {
      buttons.forEach(function (b) { b.setAttribute("aria-checked", b.getAttribute("data-value") === String(v) ? "true" : "false"); });
    }
    set(value);
    wrap.set = set;
    return wrap;
  }

  /* ======================================================= demo 1: the blocks */

  var CAT_NAMES = ["Value", "Operator", "Control", "Output"];
  var CAT_SHORT = ["val", "op", "ctl", "out"];
  var COLS = 12, ROWS = 9;

  function findBlock(token) {
    for (var c = 0; c < 4; c++) {
      var k = ABC.TOKENS[c].indexOf(token);
      if (k >= 0) return { cat: c, adc: k };
    }
    throw new Error("No block for " + token);
  }
  function gridFrom(rows) {
    var g = {};
    rows.forEach(function (r, yi) { r.forEach(function (t, x) { g[x + "," + (yi + 1)] = findBlock(t); }); });
    return g;
  }
  /* Presets. Each one was run through the team's C interpreter and through this
     page's port; the outputs matched (see the PR for the comparison). */
  var PRESETS = [
    { id: "count", label: "Count to five", rows: [["X", "1"], ["while", "X", "<", "5"], ["X", "+", "=", "1"], ["Print", "X"], ["output 2", "X"], ["endwhile"]],
      note: "Adapted from the team's own test script (testscript.abc): a loop that counts and sends each count to the RGB light on output 2." },
    { id: "f2c", label: "Exercise 1: °F to °C", rows: [["X", "9", "8", ".", "6"], ["Y", "(", "X", "-", "3", "2", ")", "*", "5", "/", "9"], ["Print", "Y"]],
      note: "Appendix B, exercise 1: convert a Fahrenheit temperature to Celsius and print it. This version uses 18 blocks." },
    { id: "fib", label: "Exercise 2: Fibonacci", rows: [["X", "1"], ["Y", "1"], ["while", "X", "<", "2", "5"], ["Print", "X"], ["Z", "X", "+", "Y"], ["X", "Y"], ["Y", "Z"], ["endwhile"]],
      note: "Appendix B, exercise 2: print the Fibonacci numbers below 25, and ask whether it takes fewer than 50 blocks, or fewer than 25. This version uses 20 blocks, and all 15 value blocks in the kit." },
    { id: "fig5", label: "Figure 5", rows: [["2", "^", "while", "output 1"]],
      note: "The four blocks in the paper's Figure 5, one from each category: value 2, operator ^, control while, and output 1. Side by side they do not form a program, so the interpreter rejects them." },
    { id: "squish", label: "Output quirk", levels: "grad res", rows: [["output 1", "5"], ["output 1", "(", "5", ")"]],
      note: "Researcher note. The spacing step joins neighboring digit tokens, so an output block followed by a digit block reads as \"output 15\" with no value, a syntax error. Parentheses (or a variable) between them fix it. Remove the first row to see the second one run." },
    { id: "empty", label: "Empty board", rows: [],
      note: "Pick a block type and a token, then tap the board. The first block goes in the top-left corner, beside the controller." }
  ];
  var INVENTORY = [15, 15, 15, 7];   /* Appendix B */

  function mountBuild(root) {
    var st = { grid: {}, brush: { cat: 0, adc: 1 }, sel: null, preset: "count", timer: null, running: false };

    var presetSeg = segmented("Example program", PRESETS.map(function (p) {
      return { value: p.id, label: p.label, levels: p.levels };
    }), st.preset, loadPreset);
    var presetNote = el("p", { class: "w-note abc-pnote" });

    /* Palette */
    var catSeg = segmented("Block type", CAT_NAMES.map(function (n, i) { return { value: i, label: n }; }), 0, function (c) {
      st.brush = { cat: Number(c), adc: ABC.CHOICES[c][0].adc }; drawPalette();
    });
    var tokWrap = el("div", { class: "abc-tokens", role: "radiogroup", "aria-label": "Token on the block's wheel" });
    var eraser = el("button", { type: "button", class: "seg-option abc-eraser", role: "radio", text: "Remove" });
    eraser.addEventListener("click", function () { st.brush = null; drawPalette(); });

    /* Board */
    var board = el("div", { class: "abc-board", role: "grid", "aria-label": "Block board. Row 1 sits on the controller." });
    var boardNote = el("p", { class: "w-mono abc-boardnote" });

    /* Block inspector (bytes) */
    var inspect = el("div", { class: "abc-inspect", "data-levels": "ug grad res" });

    /* Run */
    var runBtn = el("button", { type: "button", class: "w-btn", text: "Scan and run" });
    var skipBtn = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "Skip to the end", hidden: "hidden" });
    var counts = el("p", { class: "w-mono abc-counts" });

    var progWrap = el("div", { class: "abc-prog", "data-levels": "hs ug grad res" });
    var outWrap = el("div", { class: "abc-out" });
    var rawWrap = el("details", { class: "abc-raw", "data-levels": "grad res" });
    var scanWrap = el("details", { class: "abc-scan", "data-levels": "ug grad res" });
    var src = el("p", { class: "w-source", text: "Token table, scan, spacing, interpreter, and output devices: the team's code (abc_lexer.py, squishy_tylo.py, parse.l, parse.y, eval.c, outputs/*.py), ported to JavaScript. Block counts: Appendix B." });

    root.appendChild(el("div", { class: "w-actions" }, [el("span", { class: "w-mono", text: "Example:" }), presetSeg]));
    root.appendChild(presetNote);
    root.appendChild(el("div", { class: "w-actions" }, [el("span", { class: "w-mono", text: "Block:" }), catSeg]));
    root.appendChild(el("div", { class: "w-actions abc-palette" }, [tokWrap, eraser]));
    root.appendChild(board);
    root.appendChild(boardNote);
    root.appendChild(counts);
    root.appendChild(inspect);
    root.appendChild(el("div", { class: "w-actions" }, [runBtn, skipBtn]));
    root.appendChild(progWrap);
    root.appendChild(outWrap);
    root.appendChild(scanWrap);
    root.appendChild(rawWrap);
    root.appendChild(src);

    runBtn.addEventListener("click", function () { runProgram(true); });
    skipBtn.addEventListener("click", function () { finish(); });

    function drawPalette() {
      tokWrap.innerHTML = "";
      var cat = st.brush ? st.brush.cat : -1;
      catSeg.set(st.brush ? st.brush.cat : "");
      var list = ABC.CHOICES[cat >= 0 ? cat : 0];
      list.forEach(function (ch) {
        var b = el("button", { type: "button", class: "seg-option abc-tok abc-c" + (cat >= 0 ? cat : 0), role: "radio", text: ch.token });
        b.setAttribute("aria-checked", st.brush && st.brush.adc === ch.adc && st.brush.cat === cat ? "true" : "false");
        b.addEventListener("click", function () { st.brush = { cat: cat >= 0 ? cat : 0, adc: ch.adc }; drawPalette(); });
        tokWrap.appendChild(b);
      });
      eraser.setAttribute("aria-checked", st.brush ? "false" : "true");
    }

    function loadPreset(id) {
      st.preset = id;
      presetSeg.set(id);
      var p = PRESETS.filter(function (q) { return q.id === id; })[0];
      st.grid = gridFrom(p.rows);
      st.sel = p.rows.length ? "0,1" : null;
      presetNote.textContent = p.note;
      resetRun();
      drawBoard();
    }

    function cellClick(x, y) {
      var key = x + "," + y;
      if (!st.brush) { delete st.grid[key]; if (st.sel === key) st.sel = null; }
      else {
        var cur = st.grid[key];
        if (cur && cur.cat === st.brush.cat && cur.adc === st.brush.adc) st.sel = key;
        else { st.grid[key] = { cat: st.brush.cat, adc: st.brush.adc }; st.sel = key; }
      }
      resetRun();
      drawBoard();
    }

    var cells = {};
    function drawBoard() {
      board.innerHTML = "";
      cells = {};
      var sc = ABC.scan(st.grid);
      var readIdx = {};
      sc.reads.forEach(function (b, i) { readIdx[b.x + "," + b.y] = i; });
      var maxX = 0, maxY = 0;
      Object.keys(st.grid).forEach(function (k) { var p = k.split(","); maxX = Math.max(maxX, +p[0]); maxY = Math.max(maxY, +p[1]); });
      var cols = Math.min(COLS, Math.max(6, maxX + 2)), rows = Math.min(ROWS, Math.max(4, maxY + 1));
      board.style.setProperty("--abc-cols", cols);
      board.appendChild(el("div", { class: "abc-cape", text: "controller", title: "BeagleBone Black controller cape: it starts the scan at row 1, column 1" }));
      for (var y = 1; y <= rows; y++) {
        for (var x = 0; x < cols; x++) {
          (function (x, y) {
            var key = x + "," + y, b = st.grid[key];
            var c = el("button", { type: "button", class: "abc-cell", role: "gridcell" });
            c.style.gridColumn = String(x + 2);
            c.style.gridRow = String(y);
            if (b) {
              var tok = ABC.tokenAt(b.cat, b.adc);
              c.classList.add("abc-block", "abc-c" + b.cat);
              if (readIdx[key] === undefined) c.classList.add("is-unread");
              if (st.sel === key) c.classList.add("is-sel");
              c.appendChild(el("span", { class: "abc-btok" + (tok.length > 5 ? " abc-long" : ""), text: tok.replace("output ", "out ") }));
              c.appendChild(el("span", { class: "abc-bcat", text: CAT_SHORT[b.cat] }));
              c.setAttribute("aria-label", CAT_NAMES[b.cat] + " block " + tok + ", row " + y + ", column " + (x + 1) + (readIdx[key] === undefined ? ", not connected" : ""));
            } else {
              c.setAttribute("aria-label", "Empty, row " + y + ", column " + (x + 1));
            }
            c.addEventListener("click", function () { cellClick(x, y); });
            cells[key] = c;
            board.appendChild(c);
          })(x, y);
        }
      }
      var n = Object.keys(st.grid).length;
      boardNote.textContent = sc.unread.length ? sc.unread.length + " of " + n + " blocks are not connected to the chain and will not be read (dimmed). The lexer follows column 1 down, then each row to the right." : "Rows read left to right, top to bottom. Row 1 sits on the controller.";
      drawCounts();
      drawInspect();
    }

    function drawCounts() {
      var by = [0, 0, 0, 0], n = 0;
      Object.keys(st.grid).forEach(function (k) { by[st.grid[k].cat]++; n++; });
      var parts = by.map(function (v, i) { return CAT_NAMES[i].toLowerCase() + " " + v + "/" + INVENTORY[i]; });
      var over = by.some(function (v, i) { return v > INVENTORY[i]; });
      counts.textContent = n + " blocks (" + parts.join(", ") + " in the Appendix B kit)" +
        (n ? (n < 25 ? " · under 25" : n < 50 ? " · under 50" : " · 50 or more") : "") +
        (over ? " · uses more blocks of one type than the kit holds" : "");
    }

    function drawInspect() {
      inspect.innerHTML = "";
      if (!st.sel || !st.grid[st.sel]) {
        inspect.appendChild(el("p", { class: "w-note", text: "Select a block to see the byte it sends to the controller." }));
        return;
      }
      var p = st.sel.split(","), x = +p[0], y = +p[1], b = st.grid[st.sel];
      var has = function (k) { return Object.prototype.hasOwnProperty.call(st.grid, k); };
      var v = has(x + "," + (y + 1)), h = has((x + 1) + "," + y);
      var byte = ABC.encodeByte(b.cat, b.adc, v, h);
      var bits = byte.toString(2).padStart(8, "0");
      var tbl = el("table", { class: "abc-bits" });
      var head = el("tr"), row = el("tr"), lab = el("tr");
      ["7", "6", "5", "4", "3", "2", "1", "0"].forEach(function (i) { head.appendChild(el("th", { text: "bit " + i })); });
      bits.split("").forEach(function (bit, i) {
        var cls = i < 2 ? "abc-bf" : i < 4 ? "abc-bc" : "abc-ba";
        row.appendChild(el("td", { class: cls, text: bit }));
      });
      lab.appendChild(el("td", { class: "abc-bf", text: "below" }));
      lab.appendChild(el("td", { class: "abc-bf", text: "right" }));
      lab.appendChild(el("td", { class: "abc-bc", colspan: "2", text: "category" }));
      lab.appendChild(el("td", { class: "abc-ba", colspan: "4", text: "wheel (ADC)" }));
      tbl.appendChild(head); tbl.appendChild(row); tbl.appendChild(lab);
      inspect.appendChild(el("p", { class: "w-big", html: "Row " + y + ", column " + (x + 1) + ": <strong>" + ABC.tokenAt(b.cat, b.adc) + "</strong> sends 0x" + byte.toString(16).padStart(2, "0") + " (" + byte + ")" }));
      inspect.appendChild(el("div", { class: "ss-table-scroll" }, [tbl]));
      var wheel = el("input", { type: "range", min: "0", max: "15", step: "1", value: String(b.adc), "aria-label": "Wheel position (ADC code 0 to 15)" });
      var wl = el("span", { class: "w-mono" });
      function wtxt() { wl.textContent = "wheel code " + b.adc + " of 0–15 → " + ABC.tokenAt(b.cat, b.adc); }
      wheel.addEventListener("input", function () {
        b.adc = Number(wheel.value); wtxt(); resetRun();
        var c = cells[st.sel]; if (c) c.querySelector(".abc-btok").textContent = ABC.tokenAt(b.cat, b.adc).replace("output ", "out ");
        drawInspect.lazy = true;
        var nb = ABC.encodeByte(b.cat, b.adc, v, h);
        inspect.querySelector(".w-big").innerHTML = "Row " + y + ", column " + (x + 1) + ": <strong>" + ABC.tokenAt(b.cat, b.adc) + "</strong> sends 0x" + nb.toString(16).padStart(2, "0") + " (" + nb + ")";
        var tds = row.querySelectorAll("td"), nbits = nb.toString(2).padStart(8, "0");
        for (var i = 0; i < 8; i++) tds[i].textContent = nbits[i];
      });
      wtxt();
      inspect.appendChild(el("div", { class: "w-actions" }, [el("span", { class: "w-mono", text: "Turn the wheel:" }), wheel, wl]));
      inspect.appendChild(el("p", { class: "w-note", text: "The top two bits say whether another block touches this one below or to the right. The next two give the block type, and the low four carry the top four bits of the wheel's analog reading, so each wheel has 16 positions. The team's lookup table maps type and position to a token; several positions share a token." }));
    }

    /* Output panel */
    var dev = {};
    function buildOut() {
      outWrap.innerHTML = "";
      var tbl = el("table", { class: "abc-dev" });
      tbl.appendChild(el("tr", {}, [el("th", { text: "Channel" }), el("th", { text: "Device" }), el("th", { text: "Last action" })]));
      ABC.CHANNELS.forEach(function (c) {
        var cell = el("td", { class: "abc-devstate", text: "idle" });
        dev[c.ch] = cell;
        tbl.appendChild(el("tr", {}, [el("td", { class: "w-mono", text: "output " + c.ch }), el("td", { text: c.name }), cell]));
      });
      var cons = el("pre", { class: "abc-console", "aria-live": "polite" });
      dev.console = cons;
      dev.status = el("p", { class: "w-big abc-status" });
      outWrap.appendChild(dev.status);
      outWrap.appendChild(el("p", { class: "w-mono", text: "Printed (Print blocks):" }));
      outWrap.appendChild(cons);
      outWrap.appendChild(el("div", { class: "ss-table-scroll" }, [tbl]));
    }
    buildOut();

    var pending = [], result = null;
    function resetRun() {
      if (st.timer) { clearTimeout(st.timer); st.timer = null; }
      pending = []; result = null;
      skipBtn.setAttribute("hidden", "hidden");
      Object.keys(cells).forEach(function (k) { cells[k].classList.remove("is-scan", "is-scanned"); });
      buildOut();
      dev.status.textContent = "Press Scan and run.";
      progWrap.innerHTML = ""; scanWrap.innerHTML = ""; rawWrap.innerHTML = "";
    }

    function showDevice(ev) {
      if (ev.type === "print") {
        dev.console.textContent += ev.text + "\n";
        return;
      }
      if (ev.type !== "out") return;
      var line = ev.text, ch = ABC.routeOut(line);
      if (!ch) { dev.console.textContent += line + "   (no device on channel " + ev.channel + "; the line passes through)\n"; return; }
      var d = ABC.device(ch, ev.arg), cell = dev[ch];
      cell.innerHTML = "";
      if (ch !== ev.channel) cell.appendChild(el("span", { class: "w-mono", text: "(channel " + ev.channel + " caught by the output " + ch + " filter) " }));
      if (!d.ok) { cell.appendChild(el("span", { class: "abc-crash", text: "filter stops: " + d.crash })); return; }
      if (ch === 1) cell.appendChild(el("span", { class: "abc-lcd", text: d.lcd[0] + "\n" + d.lcd[1] }));
      if (ch === 2) {
        var sw = el("span", { class: "abc-rgb", title: "RGB " + d.color.join(", ") });
        sw.style.background = "rgb(" + d.color.join(",") + ")";
        cell.appendChild(sw);
        cell.appendChild(document.createTextNode(" " + ["red", "orange", "yellow", "green", "blue", "indigo", "violet"][d.index] + " (" + ev.arg.trim() + " mod 7 = " + d.index + ")"));
      }
      if (ch === 3) cell.appendChild(document.createTextNode(isFinite(d.seconds) ? "runs " + d.seconds.toFixed(2).replace(/\.?0+$/, "") + " s" : "value " + ev.arg.trim()));
      if (ch === 4) cell.appendChild(document.createTextNode(d.beeps + " beep" + (d.beeps === 1 ? "" : "s") + " " + "♪".repeat(d.beeps)));
      if (ch === 5) cell.appendChild(el("span", { class: "w-mono", text: d.text }));
      cell.classList.remove("is-flash"); void cell.offsetWidth; cell.classList.add("is-flash");
    }

    function runProgram(animate) {
      resetRun();
      var sc = ABC.scan(st.grid);
      var res = ABC.run(sc.text, { maxSteps: 200000 });
      result = { sc: sc, res: res };
      /* Program text and token stream */
      progWrap.appendChild(el("p", { class: "w-mono", text: "Program text the lexer prints for the interpreter:" }));
      progWrap.appendChild(el("pre", { class: "abc-text", text: sc.text.replace(/^ /, "").replace(/\n+$/, "") || "(nothing connected)" }));
      /* Scan order */
      scanWrap.appendChild(el("summary", { text: "Scan order and bytes (" + sc.reads.length + " reads)" }));
      var list = el("ol", { class: "abc-reads" });
      sc.reads.forEach(function (b) {
        list.appendChild(el("li", { class: "w-mono", text: "row " + b.y + ", col " + (b.x + 1) + ": 0x" + b.byte.toString(16).padStart(2, "0") + " = " + b.byte.toString(2).padStart(8, "0") + " → " + b.token }));
      });
      scanWrap.appendChild(list);
      scanWrap.appendChild(el("p", { class: "w-note", text: "The scan climbs column 1 first, then reads each row to its right end on the way back, and the lexer files every block under its own row, so the text still comes out row by row." }));
      /* Raw interpreter stream */
      rawWrap.appendChild(el("summary", { text: "Raw interpreter output (stdout and stderr)" }));
      rawWrap.appendChild(el("pre", { class: "abc-text", text: res.stdout.concat(res.stderr.map(function (l) { return "[stderr] " + l; })).join("\n") || "(no output)" }));
      rawWrap.appendChild(el("p", { class: "w-note", text: "#LINECHANGE(n) is the interpreter's line marker for the error and status lights. It records the lexer's line count at the moment the parser finished each statement, which is often a line or more past the statement itself (the Fibonacci loop reports line 7 for the while row)." }));

      var steps = [];
      sc.reads.forEach(function (b) { steps.push({ kind: "scan", key: b.x + "," + b.y }); });
      res.events.forEach(function (e) { if (e.type === "print" || e.type === "out") steps.push({ kind: "ev", ev: e }); });
      steps.push({ kind: "done" });
      pending = steps;
      if (!animate || window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) { finish(); return; }
      skipBtn.removeAttribute("hidden");
      dev.status.textContent = "Scanning…";
      tick();
    }
    function apply(s) {
      if (s.kind === "scan") {
        Object.keys(cells).forEach(function (k) { cells[k].classList.remove("is-scan"); });
        if (cells[s.key]) cells[s.key].classList.add("is-scan", "is-scanned");
      } else if (s.kind === "ev") {
        Object.keys(cells).forEach(function (k) { cells[k].classList.remove("is-scan"); });
        dev.status.textContent = "Running…";
        showDevice(s.ev);
      } else if (s.kind === "done") {
        Object.keys(cells).forEach(function (k) { cells[k].classList.remove("is-scan"); });
        skipBtn.setAttribute("hidden", "hidden");
        dev.status.innerHTML = statusText(result.res);
      }
    }
    function tick() {
      if (!pending.length) return;
      var s = pending.shift();
      apply(s);
      if (pending.length) st.timer = setTimeout(tick, s.kind === "scan" ? 110 : 420);
    }
    function finish() {
      if (st.timer) { clearTimeout(st.timer); st.timer = null; }
      while (pending.length) apply(pending.shift());
    }
    function statusText(res) {
      if (!result.sc.reads.length) return "Nothing is connected to the controller. Place a block in the top-left square first.";
      var outs = res.events.filter(function (e) { return e.type === "out" || e.type === "print"; }).length;
      if (res.status === "ok") return outs ? "Program ran: <strong>" + outs + "</strong> output" + (outs === 1 ? "" : "s") + "." : "Program ran with no output.";
      if (res.status === "stopped") return "Stopped after " + res.steps.toLocaleString() + " steps: the loop does not end. (The real controller would keep going.)";
      if (res.status === "syntax") return "<strong>Syntax error.</strong> The interpreter rejects the program and runs nothing" + (res.errorAt ? " (the parser stopped at “" + res.errorAt.text + "” on line " + res.errorAt.line + ")" : "") + ". On the blocks, the error light turns on.";
      if (res.status === "aborted") return "The interpreter stopped without running the program.";
      if (res.status === "oom") return "The interpreter ran out of its 2,048 parse nodes.";
      return res.status;
    }

    loadPreset("count");
    drawPalette();
    root.classList.add("w-ready");
  }

  /* ========================================================= demo 2: the brief */

  function mountBrief(root) {
    var TIERS = [
      { id: "must", label: "Must have", cost: 3, extra: 0 },
      { id: "like", label: "Like to have", cost: 2, extra: 5 },
      { id: "nice", label: "Nice to have", cost: 1, extra: 10 }
    ];
    var ROWS = [
      { tier: "must", ask: "Hardware under $3 a block (a set of 20 for $60)", got: "The paper reports no per-block cost." },
      { tier: "must", ask: "Open-source hardware design and board", got: "Board files, code, and test plans sit in the team's public repository." },
      { tier: "must", ask: "Several chips, not one system-on-chip", got: "Built: an ATtiny461 microcontroller in every block and a BeagleBone controller." },
      { tier: "must", ask: "Magnetic and inductive coupling between blocks", got: "Built differently: four DB-9 connectors per block (two male, two female)." },
      { tier: "must", ask: "Working grammar: assignment and binary operators", got: "Built: four block types read by a lexer, parser, and interpreter." },
      { tier: "must", ask: "Open software repository on GitHub", got: "Built." },
      { tier: "must", ask: "Ultra-low-power operation; a built-in power source or separate power blocks", got: "The paper does not report power figures." },
      { tier: "must", ask: "A set for each team member and both sponsors", got: "About 50 blocks of 2 × 2 × 2 inches (the Appendix B kit lists 52)." },
      { tier: "like", ask: "Under $2 a block ($40 a set); several functions per block", got: "Built: one wheel per block picks among up to 16 positions." },
      { tier: "nice", ask: "Under $1 a block ($20 a set); inductive recharging; an app that simulates the blocks or reads a photo of them", got: "The simulator on this page is a version of that last wish." }
    ];
    var state = { tier: "must" };
    var seg = segmented("Wish-list tier", TIERS.map(function (t) { return { value: t.id, label: t.label }; }), state.tier, function (v) { state.tier = v; draw(); });
    var calc = el("p", { class: "w-big" });
    var calcNote = el("p", { class: "w-note", "data-levels": "ug grad res" });
    var tbl = el("table", { class: "ss-table abc-brief" });
    root.appendChild(el("div", { class: "w-actions" }, [el("span", { class: "w-mono", text: "Tier:" }), seg]));
    root.appendChild(calc);
    root.appendChild(calcNote);
    root.appendChild(el("div", { class: "ss-table-scroll" }, [tbl]));
    root.appendChild(el("p", { class: "w-source", text: "Requirements: Appendix A (the two-page capstone proposal). What was built: the paper's technical sections; repository contents: the team's GitHub repository. Set arithmetic: the page's." }));
    function draw() {
      var t = TIERS.filter(function (x) { return x.id === state.tier; })[0];
      var sets = 5 + 2 + t.extra, blocks = sets * 20;
      calc.innerHTML = "<strong>" + sets + " sets</strong> of 20 = " + blocks + " blocks at under $" + t.cost + " each: under <strong>$" + (blocks * t.cost).toLocaleString() + "</strong>";
      calcNote.textContent = "Page arithmetic: five team members plus two sponsors" + (t.extra ? ", plus " + words(t.extra) + " extra sets" : "") + ", at the tier's price cap. The proposal allowed a team of four to six; the team that took the project had five students. The paper reports about 50 finished blocks.";
      tbl.innerHTML = "";
      tbl.appendChild(el("tr", {}, [el("th", { text: "Tier" }), el("th", { text: "The proposal asked for" }), el("th", { text: "What the paper reports" })]));
      var order = { must: 0, like: 1, nice: 2 }, cur = order[state.tier];
      ROWS.forEach(function (r) {
        var tr = el("tr", {}, [el("td", { class: "w-mono", text: TIERS[order[r.tier]].label }), el("td", { text: r.ask }), el("td", { text: r.got })]);
        if (order[r.tier] <= cur) tr.classList.add("is-on");
        tbl.appendChild(tr);
      });
    }
    draw();
    root.classList.add("w-ready");
  }

  /* ======================================================== demo 3: the study */

  function mountDesign(root) {
    var STEPS = [
      { id: "prop", label: "Proposal", text: "A sponsor proposal (Appendix A) goes to the capstone program, like every other sponsored project. Each team goes through the same selection process and capstone experience.", measure: "None yet." },
      { id: "pre", label: "Pre-survey", text: "Immediately before the project, each student rates their interest in the project and their communication and collaboration skills on a five-point scale, and answers open questions, including how and why they deal with conflict.", measure: "Likert ratings and open responses." },
      { id: "work", label: "Six months", text: "Three capstone teams, including A Block of Code, work with an advisory panel (both authors and one more engineering faculty member). The panel tracks each group's communication and conflict, and the teams' GitHub activity adds a record of how often they communicate.", measure: "Discussions and their length per week (Figure 9); meetings per week (Figure 10)." },
      { id: "post", label: "Post-survey", text: "Immediately after the project, the same self-assessment again. The paper also reports how many students wanted to keep working on their project after graduation, without saying which instrument asked.", measure: "Likert ratings, open responses, and interest in continuing." },
      { id: "talk", label: "Interviews", text: "End-of-project interviews check the patterns seen in the surveys and the GitHub data.", measure: "Interview themes." },
      { id: "show", label: "Showcase", text: "At the annual computer science and electrical and computer engineering capstone presentation, several randomly chosen K–5 students (fewer than ten, none with programming experience and none known to the researchers) try the blocks.", measure: "Informal feedback." }
    ];
    var state = { i: 2 };
    var chart = el("div", { class: "ss-chart" });
    var detail = el("div", { class: "abc-step" });
    var groups = el("table", { class: "ss-table" });
    root.appendChild(chart);
    root.appendChild(detail);
    root.appendChild(el("p", { class: "w-mono", text: "Who is compared:" }));
    root.appendChild(el("div", { class: "ss-table-scroll" }, [groups]));
    root.appendChild(el("p", { class: "w-source", text: "Source: the paper's \"The Study and Methods\" and \"Results of Physical Implementation\" sections." }));
    groups.appendChild(el("tr", {}, [el("th", { text: "Group" }), el("th", { text: "Who" }), el("th", { text: "Project" })]));
    groups.appendChild(el("tr", {}, [el("td", { class: "w-mono", text: "ABC" }), el("td", { text: "The five students on the A Block of Code team" }), el("td", { text: "A teaching tool for K–12 students, with a visible community purpose" })]));
    groups.appendChild(el("tr", {}, [el("td", { class: "w-mono", text: "Baseline" }), el("td", { text: "Students on the sponsor's other capstone teams (team count and sizes not stated)" }), el("td", { text: "Projects from the same sponsor without that student-facing purpose" })]));

    function draw() {
      chart.innerHTML = "";
      var W = chartWidth(chart), narrow = W < 600, H = narrow ? 84 : 74, pad = 26, n = STEPS.length, ly = narrow ? 40 : 26;
      var s = svg("svg", { class: "ss-svg", viewBox: "0 0 " + W + " " + H, role: "group", "aria-label": "Study timeline with six checkpoints" });
      s.appendChild(svg("line", { x1: pad, x2: W - pad, y1: ly, y2: ly, class: "c-grid" }));
      STEPS.forEach(function (stp, i) {
        var x = pad + i * (W - 2 * pad) / (n - 1);
        var g = svg("g", { class: "abc-node" + (i === state.i ? " is-on" : ""), tabindex: "0", role: "button", "aria-label": stp.label });
        g.appendChild(svg("rect", { x: x - 22, y: 4, width: 44, height: 64, class: "ss-hit" }));
        g.appendChild(svg("circle", { cx: x, cy: ly, r: i === state.i ? 9 : 6, class: i === state.i ? "abc-dot-on" : "abc-dot" }));
        var lab = svg("text", { x: x, y: narrow && i % 2 ? 16 : ly + 28, "text-anchor": i === 0 ? "start" : i === n - 1 ? "end" : "middle", class: "c-label" }, stp.label);
        if (i === 0) lab.setAttribute("x", x - 6);
        if (i === n - 1) lab.setAttribute("x", x + 6);
        g.appendChild(lab);
        function pick() { state.i = i; draw(); }
        g.addEventListener("click", pick);
        g.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(); } });
        s.appendChild(g);
      });
      chart.appendChild(s);
      var stp = STEPS[state.i];
      detail.innerHTML = "";
      detail.appendChild(el("p", { class: "w-big", html: "<strong>" + stp.label + "</strong>" }));
      detail.appendChild(el("p", { text: stp.text }));
      detail.appendChild(el("p", { class: "w-mono", text: "Measured: " + stp.measure }));
    }
    redraws.push(draw);
    draw();
    root.classList.add("w-ready");
  }

  /* ===================================================== demo 4: the outcomes */

  /* Exact two-sided Fisher test (sum of tables no more likely than the observed one). */
  function lchoose(n, k) { var s = 0; for (var i = 1; i <= k; i++) s += Math.log(n - k + i) - Math.log(i); return s; }
  function fisher(a, b, c, d) {
    var n1 = a + b, n2 = c + d, k = a + c, N = n1 + n2;
    function p(x) { return Math.exp(lchoose(n1, x) + lchoose(n2, k - x) - lchoose(N, k)); }
    var p0 = p(a), tot = 0;
    for (var x = Math.max(0, k - n2); x <= Math.min(k, n1); x++) { var px = p(x); if (px <= p0 * (1 + 1e-7)) tot += px; }
    return Math.min(1, tot);
  }
  /* Group sizes up to 30 whose whole-percent share can print as 10%. */
  function tenPercentOptions() {
    var out = [];
    for (var n = 2; n <= 30; n++) for (var k = 0; k <= n; k++) if (Math.round(100 * k / n) === 10) out.push({ n: n, k: k });
    return out;
  }

  function mountInterest(root) {
    var D = { abc: { pre: 4.7, post: 4.8, cont: 80 }, base: { pre: 3.9, post: 3.2, cont: 10 } };
    var chart = el("div", { class: "ss-chart" });
    var legend = el("div", { class: "c-legend" });
    var read = el("p", { class: "w-big" });
    var dots = el("div", { class: "ss-chart" });
    var grad = el("div", { "data-levels": "grad res" });
    root.appendChild(read);
    root.appendChild(chart);
    root.appendChild(legend);
    root.appendChild(el("p", { class: "w-mono", text: "Interested in continuing the project after graduation:" }));
    root.appendChild(dots);
    root.appendChild(grad);
    root.appendChild(el("p", { class: "w-source", text: "Ratings 4.7 → 4.8 and 3.9 → 3.2 on the five-point scale, with the paper's descriptors; 80% and 10%: the paper's Study Results. Count readings and the exact test: the page's." }));
    legend.appendChild(el("span", { class: "ss-lg" }, [el("span", { class: "ss-sw abc-sw-abc" }), "A Block of Code team"]));
    legend.appendChild(el("span", { class: "ss-lg" }, [el("span", { class: "ss-sw abc-sw-base" }), "Baseline teams"]));
    read.innerHTML = "Interest in the project: ABC <strong>4.7 → 4.8</strong>; baseline <strong>3.9 → 3.2</strong>";

    function drawSlope() {
      chart.innerHTML = "";
      var W = chartWidth(chart), H = 230, L = 46, R = W < 420 ? 112 : 170, T = 14, B = 30;
      var s = svg("svg", { class: "ss-svg", viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": "Slope chart: ABC team interest 4.7 before and 4.8 after; baseline teams 3.9 before and 3.2 after, on a five-point scale." });
      var y = function (v) { return T + (5 - v) / 2.5 * (H - T - B); };   /* axis 2.5 to 5 */
      var x0 = L + 10, x1 = W - R;
      [2.5, 3, 3.5, 4, 4.5, 5].forEach(function (v) {
        s.appendChild(svg("line", { x1: L, x2: W - R + 8, y1: y(v), y2: y(v), class: "c-grid" }));
        s.appendChild(svg("text", { x: L - 6, y: y(v) + 4, "text-anchor": "end", class: "c-tick" }, v.toFixed(1)));
      });
      s.appendChild(svg("text", { x: x0, y: H - 8, "text-anchor": "middle", class: "c-label" }, "before"));
      s.appendChild(svg("text", { x: x1, y: H - 8, "text-anchor": "middle", class: "c-label" }, "after"));
      [["abc", D.abc, ["Significant", "Significant"]], ["base", D.base, ["Moderately Significant", "Moderately"]]].forEach(function (g) {
        var d = g[1];
        s.appendChild(svg("line", { x1: x0, x2: x1, y1: y(d.pre), y2: y(d.post), class: "abc-ln-" + g[0] }));
        s.appendChild(svg("circle", { cx: x0, cy: y(d.pre), r: 5, class: "abc-pt-" + g[0] }));
        s.appendChild(svg("circle", { cx: x1, cy: y(d.post), r: 5, class: "abc-pt-" + g[0] }));
        s.appendChild(svg("text", { x: x0 + 10, y: y(d.pre) + (g[0] === "abc" ? -8 : 16), class: "ss-val" }, d.pre.toFixed(1)));
        var lx = x1 + 10;
        s.appendChild(svg("text", { x: lx, y: y(d.post) + 4, class: "ss-val" }, d.post.toFixed(1)));
        var desc = svg("text", { x: lx, y: y(d.post) + 18, class: "c-tick" }, "“" + g[2][1] + "”");
        s.appendChild(desc);
      });
      chart.appendChild(s);
    }
    function drawDots() {
      dots.innerHTML = "";
      var W = chartWidth(dots), H = 74, size = Math.min(22, (W - 130) / 10 - 4);
      var s = svg("svg", { class: "ss-svg", viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": "Eight in ten ABC students and one in ten baseline students wanted to keep working on their project after graduation." });
      [["abc", "ABC", 8, "80%"], ["base", "Baseline", 1, "10%"]].forEach(function (r, ri) {
        var yy = 6 + ri * 36;
        s.appendChild(svg("text", { x: 0, y: yy + size * 0.75, class: "c-label" }, r[1]));
        for (var i = 0; i < 10; i++) {
          s.appendChild(svg("rect", { x: 72 + i * (size + 4), y: yy, width: size, height: size, class: i < r[2] ? "abc-pt-" + r[0] : "ss-track" }));
        }
        s.appendChild(svg("text", { x: 72 + 10 * (size + 4) + 6, y: yy + size * 0.75, class: "ss-val" }, r[3]));
      });
      dots.appendChild(s);
    }
    /* Graduate and researcher: what counts the percentages allow, and an exact test. */
    var opts = tenPercentOptions();
    var bn = { n: 10, k: 1 };
    var nSeg = segmented("Baseline group size", opts.filter(function (o) { return o.n <= 30; }).map(function (o) { return { value: o.n + ":" + o.k, label: o.k + "/" + o.n }; }), "10:1", function (v) {
      var p = v.split(":"); bn = { n: +p[0], k: +p[1] }; drawGrad();
    });
    var gradOut = el("div", {});
    grad.appendChild(el("p", { class: "w-note", text: "The paper reports percentages without counts. The ABC team had five students, so 80% means four of five. The baseline group's size is not stated; these are the counts up to 30 students that round to 10%. Pick one to run an exact test (the page's own analysis)." }));
    grad.appendChild(el("div", { class: "w-actions" }, [el("span", { class: "w-mono", text: "Baseline count:" }), nSeg]));
    grad.appendChild(gradOut);
    function drawGrad() {
      var p = fisher(4, 1, bn.k, bn.n - bn.k);
      gradOut.innerHTML = "";
      gradOut.appendChild(el("p", { class: "w-big", html: "4 of 5 against " + bn.k + " of " + bn.n + ": Fisher's exact two-sided <strong>p = " + p.toFixed(4) + "</strong>" }));
      gradOut.appendChild(el("p", { class: "w-note", text: "Computed by this page. The team was not randomly assigned and the groups worked on different projects, so the test describes the size of the gap, not its cause. The 4.7 and 3.9 averages come with no spread or count, so the page runs no test on them." }));
    }
    function drawAll() { drawSlope(); drawDots(); drawGrad(); }
    redraws.push(drawAll);
    drawAll();
    root.classList.add("w-ready");
  }

  /* ------------------------------------------------------------------ mount */
  function mount(id, fn) {
    var node = document.getElementById(id);
    if (!node) return;
    try { fn(node); } catch (e) {
      node.appendChild(el("p", { class: "w-note", text: "This demo could not start: " + e.message }));
      if (window.console) console.error(e);
    }
  }
  function init() {
    mount("abc-build", mountBuild);
    mount("abc-brief", mountBrief);
    mount("abc-design", mountDesign);
    mount("abc-interest", mountInterest);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();

/*
  Cloud notebooks widget for /papers/cloud-notebooks/.
  Mount points in the page: #cn-notebook, #cn-design, #cn-scores, #cn-teachers, #cn-denoms.

  Demo 1 is a working notebook in the browser (MiniPy, minipy.js) with the paper's two
  cloud-session items as tasks: print the numbers 1 to 10 (Q14) and swap two numbers
  (Q17b, which the PD asked in Logo).
  Demo 2 draws RAMPED: six two-day sessions, where each reported item ran (Table 5.3.1),
  and the seven assessment points, four of which the paper reports.
  Demo 3 draws Table 6.2.1 (percent correct at four checkpoints) and Table 6.2.2 (the
  changes and their average), rebuilt from Table 6.2.1.
  Demo 4 draws the two teacher case studies (Figures 1 and 2).
  Demo 5 (graduate and researcher) searches the group sizes the printed percentages allow.
  Demos 2, 3, and 5 share one selected item (state.item).
  All arithmetic lives in cn-engine.js; results labeled "page" are the page's own.
*/
(function () {
  "use strict";

  var E = window.CloudNotebooksEngine;
  var D = E.DATA;
  var SVGNS = "http://www.w3.org/2000/svg";

  var state = { item: "all", view: "pct", groups: false, n: 20 };

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
  function fix(x, d) { return Number(x).toFixed(d).replace(/^-/, "−"); }
  function signed(x, d) { var s = fix(Math.abs(x), d === undefined ? 0 : d); return (x > 0 ? "+" : x < 0 ? "−" : "") + s; }
  var WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
  function words(n) { return n < 10 ? WORDS[n] : String(n); }
  function escapeHtml(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

  var redraws = [];
  var resizeTimer = null;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () { redraws.forEach(function (fn) { fn(); }); }, 150);
  });
  document.addEventListener("paperlevel", function () {
    setTimeout(function () { redraws.forEach(function (fn) { fn(); }); }, 0);
  });

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

  // Shared item picker: every copy stays in sync.
  var itemControls = [], itemDraws = [];
  function setItem(v) {
    state.item = v;
    itemControls.forEach(function (c) { c.set(v); });
    itemDraws.forEach(function (fn) { fn(); });
  }
  function itemControl(withAll) {
    var opts = (withAll ? [{ value: "all", label: "All four" }] : []).concat(D.items.map(function (it) {
      return { value: it.id, label: it.id, title: it.session + " (" + it.location.toLowerCase() + ")" };
    }));
    var c = segmented("Assessment item", opts, state.item, setItem);
    itemControls.push(c);
    return c;
  }
  function selectedItem() { return state.item === "all" ? null : E.item(state.item); }

  /* ---------------------------------------------- demo 1: the notebook */

  var TASKS = [
    { id: "count", title: "Task 1 · the paper's question 14",
      prompt: "Print out the numbers 1 to 10.",
      variants: {
        starter: "# Print the numbers 1 to 10, one per line.\nfor i in range(10):\n    print(i)\n",
        solution: "for i in range(1, 11):\n    print(i)\n",
        mistake: "# Starts at 0 and stops at 9: range(10) covers ten numbers, not 1 to 10.\nfor i in range(10):\n    print(i)\n"
      },
      check: function (r) {
        var nums = r.stdout.split(/[\s,]+/).filter(Boolean);
        if (r.error) return null;
        var want = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
        if (nums.length === want.length && nums.every(function (v, i) { return v === want[i]; })) return { ok: true, text: "Done: the output lists 1 to 10 in order." };
        if (nums.length && nums[0] === "0") return { ok: false, text: "Close: the output starts at 0. range(a, b) starts at a and stops before b." };
        return { ok: false, text: "Not yet: the output should list 1 to 10 in order." };
      } },
    { id: "swap", title: "Task 2 · the paper's question 17b",
      prompt: "Swap the values of two variables, so a holds 7 and b holds 3. (RAMPED asked this in Logo; this notebook runs Python.)",
      variants: {
        starter: "a = 3\nb = 7\n# Swap a and b here.\n\nprint(a, b)\n",
        solution: "a = 3\nb = 7\ntemp = a\na = b\nb = temp\nprint(a, b)\n",
        mistake: "a = 3\nb = 7\n# Copies b into a first, so the 3 is lost.\na = b\nb = a\nprint(a, b)\n"
      },
      check: function (r, kernel) {
        if (r.error) return null;
        var g = kernel.globals;
        var ok = ("a" in g) && ("b" in g) && MiniPy.repr(g.a) === "7" && MiniPy.repr(g.b) === "3";
        if (ok) return { ok: true, text: "Done: a is 7 and b is 3." };
        if (("a" in g) && ("b" in g) && MiniPy.repr(g.a) === MiniPy.repr(g.b)) return { ok: false, text: "Both variables now hold " + MiniPy.repr(g.a) + ": the first assignment overwrote the value the second one needed. Hold it in a third variable first." };
        return { ok: false, text: "Not yet: a should end as 7 and b as 3." };
      } },
    { id: "share", title: "Cell 3 · one kernel behind every cell",
      prompt: "A notebook remembers what earlier cells did. Run Task 2 first, then this cell: it reads a and b from the kernel. The last line's value appears as Out.",
      variants: { starter: "print('a is', a, 'and b is', b)\na * 10 + b\n" },
      check: null }
  ];

  function mountNotebook(root) {
    var kernel = new MiniPy.Kernel();
    var cells = [];
    var status = el("span", { class: "w-mono cn-kstatus", text: "Kernel: idle · nothing run yet" });
    var runAll = el("button", { type: "button", class: "w-btn", text: "Run all" });
    var restart = el("button", { type: "button", class: "w-btn cn-btn-quiet", text: "Restart kernel" });
    root.appendChild(el("div", { class: "w-actions" }, [runAll, restart, status]));

    var nb = el("div", { class: "cn-nb", role: "group", "aria-label": "Notebook" });
    root.appendChild(nb);

    var varsWrap = el("div", { class: "cn-vars", "data-levels": "ug grad res" });
    root.appendChild(varsWrap);
    var src = el("p", { class: "w-source", text: "Tasks: paper, Table 5.3.1 (Q14 and Q17b) · runs MiniPy, a Python subset in this page that matches CPython 3.13 on every reference test" });
    root.appendChild(src);

    function drawVars() {
      var vars = kernel.variables();
      varsWrap.innerHTML = "";
      varsWrap.appendChild(el("p", { class: "w-mono", text: "Kernel variables (" + vars.length + ")" }));
      if (!vars.length) { varsWrap.appendChild(el("p", { class: "w-note", text: "The kernel holds no variables. Run a cell to create some." })); return; }
      var tb = el("tbody");
      vars.forEach(function (v) {
        tb.appendChild(el("tr", null, [el("td", { text: v.name }), el("td", { text: v.type }), el("td", { text: v.repr.length > 60 ? v.repr.slice(0, 57) + "..." : v.repr })]));
      });
      varsWrap.appendChild(el("div", { class: "cn-scroll" }, [el("table", { class: "cn-table cn-vartable" }, [
        el("thead", null, [el("tr", null, [el("th", { text: "Name" }), el("th", { text: "Type" }), el("th", { text: "Value" })])]), tb])]));
    }

    function runCell(c) {
      var r = kernel.run(c.input.value);
      c.prompt.textContent = "In [" + r.count + "]:";
      c.out.innerHTML = "";
      if (r.stdout) c.out.appendChild(el("pre", { class: "cn-stdout", text: r.stdout.replace(/\n$/, "") }));
      if (r.value !== null) c.out.appendChild(el("pre", { class: "cn-value" }, [el("span", { class: "cn-outp", text: "Out[" + r.count + "]: " }), r.value]));
      if (r.error) c.out.appendChild(el("pre", { class: "cn-error", text: (r.line ? "Line " + r.line + ": " : "") + r.error }));
      if (c.task && c.task.check) {
        var verdict = c.task.check(r, kernel);
        if (verdict) c.out.appendChild(el("p", { class: "cn-verdict" + (verdict.ok ? " is-ok" : ""), text: verdict.text }));
      }
      status.textContent = "Kernel: " + kernel.variables().length + " variable" + (kernel.variables().length === 1 ? "" : "s") + " · " + r.count + " run" + (r.count === 1 ? "" : "s") + " since restart";
      drawVars();
      return r;
    }

    function fit(t) { t.style.height = "auto"; t.style.height = Math.max(54, t.scrollHeight + 2) + "px"; }

    TASKS.forEach(function (task) {
      var md = el("div", { class: "cn-md" }, [el("p", { class: "cn-md-title", text: task.title }), el("p", { class: "cn-md-text", text: task.prompt })]);
      var prompt = el("span", { class: "cn-prompt", text: "In [ ]:" });
      var input = el("textarea", { class: "cn-code", spellcheck: "false", autocapitalize: "off", autocomplete: "off", "aria-label": task.title + " code" });
      input.value = task.variants.starter;
      var run = el("button", { type: "button", class: "w-btn cn-run", text: "Run", "aria-label": "Run " + task.title });
      var out = el("div", { class: "cn-out", "aria-live": "polite" });
      var c = { task: task, input: input, prompt: prompt, out: out };
      var tools = el("div", { class: "cn-celltools" }, [run]);
      if (task.variants.solution) {
        var opts = [{ value: "starter", label: "Starter" }, { value: "mistake", label: "Common mistake", levels: "hs ug grad res" }, { value: "solution", label: "Solution" }];
        tools.appendChild(segmented("Load code for " + task.title, opts, "starter", function (v) {
          input.value = task.variants[v]; fit(input); runCell(c);
        }));
      }
      tools.appendChild(el("span", { class: "w-mono cn-hint", text: "Shift+Enter runs" }));
      run.addEventListener("click", function () { runCell(c); });
      input.addEventListener("keydown", function (ev) {
        if (ev.key === "Enter" && ev.shiftKey) { ev.preventDefault(); runCell(c); }
        if (ev.key === "Tab" && !ev.shiftKey) {
          ev.preventDefault();
          var s = input.selectionStart, e = input.selectionEnd;
          input.value = input.value.slice(0, s) + "    " + input.value.slice(e);
          input.selectionStart = input.selectionEnd = s + 4;
        }
      });
      input.addEventListener("input", function () { fit(input); });
      var cell = el("div", { class: "cn-cell" }, [md, el("div", { class: "cn-incell" }, [prompt, input]), tools, out]);
      nb.appendChild(cell);
      cells.push(c);
      setTimeout(function () { fit(input); }, 0);
    });

    runAll.addEventListener("click", function () { cells.forEach(runCell); });
    restart.addEventListener("click", function () {
      kernel = new MiniPy.Kernel();
      cells.forEach(function (c) { c.prompt.textContent = "In [ ]:"; c.out.innerHTML = ""; });
      status.textContent = "Kernel: restarted · every variable cleared";
      drawVars();
    });
    drawVars();
    redraws.push(function () { cells.forEach(function (c) { fit(c.input); }); });
    root.notebook = { run: function (i) { return runCell(cells[i]); }, kernel: function () { return kernel; }, cells: cells };
  }

  /* ---------------------------------------------- demo 2: RAMPED design */

  function mountDesign(root) {
    var timeline = el("div", { class: "cn-chart" });
    var rows = el("div", { class: "cn-scroll" });
    var readout = el("p", { class: "w-note" });
    root.appendChild(el("p", { class: "w-mono", text: "The seven assessment points" }));
    root.appendChild(timeline);
    root.appendChild(el("p", { class: "w-mono", text: "The six two-day sessions (each teacher chose four in the summer)" }));
    root.appendChild(rows);
    root.appendChild(readout);
    root.appendChild(el("p", { class: "w-source", text: "Paper, Context, Methods, and Table 5.3.1 · RAMPED, 30 teachers over the year, 20 in the sessions this paper analyzes" }));

    function drawTimeline() {
      var W = chartWidth(timeline), narrow = W < 520;
      var n = D.schedule.length, padL = narrow ? 30 : 44, padR = narrow ? 30 : 44, H = narrow ? 128 : 104, y = 34;
      var step = (W - padL - padR) / (n - 1);
      var s = svg("svg", { viewBox: "0 0 " + W + " " + H, class: "cn-svg", role: "img",
        "aria-label": "Seven assessment points; the paper reports pre-pre, pre, post, and post-post." });
      // summer and school-year spans
      var xSummerEnd = padL + step * 3 + step / 2;
      s.appendChild(svg("line", { x1: padL - 24, x2: xSummerEnd - 6, y1: y - 18, y2: y - 18, class: "cn-span" }));
      s.appendChild(svg("text", { x: padL - 24, y: y - 24, class: "c-label" }, "Summer PD · two weeks"));
      s.appendChild(svg("line", { x1: xSummerEnd + 6, x2: W - padR + 24, y1: y - 18, y2: y - 18, class: "cn-span" }));
      s.appendChild(svg("text", { x: W - padR + 24, y: y - 24, class: "c-label", "text-anchor": "end" }, narrow ? "School year" : "School year · six follow-up days"));
      s.appendChild(svg("line", { x1: padL, x2: W - padR, y1: y, y2: y, class: "c-grid" }));
      D.schedule.forEach(function (p, i) {
        var x = padL + step * i;
        s.appendChild(svg("circle", { cx: x, cy: y, r: 7, class: p.reported ? "cn-dot-on" : "cn-dot-off" }));
        var ty = y + 22 + (narrow && i % 2 ? 26 : 0);
        var anchor = "middle";
        s.appendChild(svg("text", { x: x, y: ty, class: "c-tick", "text-anchor": anchor }, p.label));
        if (!narrow) s.appendChild(svg("text", { x: x, y: ty + 14, class: "c-tick cn-dim", "text-anchor": anchor }, p.reported ? "reported" : "not reported"));
      });
      timeline.innerHTML = "";
      timeline.appendChild(s);
      var lg = el("div", { class: "c-legend" }, [
        el("span", { class: "cn-lg" }, [el("span", { class: "cn-sw cn-sw-on" }), "Reported in Table 6.2.1"]),
        el("span", { class: "cn-lg" }, [el("span", { class: "cn-sw cn-sw-off" }), "Given, not reported here"])
      ]);
      timeline.appendChild(lg);
    }

    function drawRows() {
      var tb = el("tbody");
      D.sessions.forEach(function (ss) {
        var on = ss.item && state.item === ss.item;
        var tr = el("tr", { class: (on ? "is-on " : "") + (ss.item ? "cn-pick" : ""), tabindex: ss.item ? "0" : "-1" }, [
          el("td", { text: ss.name }),
          el("td", { text: ss.lang || "not stated" }),
          el("td", { html: ss.location ? "<span class=\"cn-tag cn-tag-" + ss.location.toLowerCase() + "\">" + ss.location + "</span>" : "not stated" }),
          el("td", { text: ss.item || "none on this page" })
        ]);
        if (ss.item) {
          tr.addEventListener("click", function () { setItem(ss.item); });
          tr.addEventListener("keydown", function (ev) { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); setItem(ss.item); } });
        }
        tb.appendChild(tr);
      });
      rows.innerHTML = "";
      rows.appendChild(el("table", { class: "cn-table" }, [
        el("thead", null, [el("tr", null, [el("th", { text: "Session" }), el("th", { text: "Language" }), el("th", { text: "Location (Table 5.3.1)" }), el("th", { text: "Item" })])]), tb]));
      var it = selectedItem();
      if (it) {
        readout.innerHTML = "<strong>" + it.id + "</strong> came from the " + it.session + " session (" + it.lang + ", " + it.location.toLowerCase() +
          "): " + escapeHtml(it.text) + (it.graphical ? " The paper notes this was the only item answered with pictures rather than code." : "");
      } else {
        readout.innerHTML = "Pick a session with an item to follow it through the page. Two offerings of each session, with 10 seats each, put 20 teachers in every session.";
      }
    }

    function draw() { drawTimeline(); drawRows(); }
    draw();
    redraws.push(drawTimeline);
    itemDraws.push(drawRows);
  }

  /* ---------------------------------------------- demo 3: Tables 6.2.1 and 6.2.2 */

  function mountScores(root) {
    var viewCtl = segmented("View", [
      { value: "pct", label: "Percent correct" },
      { value: "delta", label: "Change between checkpoints" }
    ], state.view, function (v) { state.view = v; draw(); });
    var groupBtn = el("button", { type: "button", class: "w-btn cn-btn-quiet", "data-levels": "ug grad res", "aria-pressed": "false", text: "Show Local and Cloud means" });
    groupBtn.addEventListener("click", function () {
      state.groups = !state.groups;
      groupBtn.setAttribute("aria-pressed", state.groups ? "true" : "false");
      groupBtn.textContent = state.groups ? "Hide Local and Cloud means" : "Show Local and Cloud means";
      draw();
    });
    root.appendChild(el("div", { class: "w-actions" }, [el("span", { class: "w-mono", text: "Item:" }), itemControl(true)]));
    root.appendChild(el("div", { class: "w-actions" }, [el("span", { class: "w-mono", text: "Show:" }), viewCtl, groupBtn]));
    var chart = el("div", { class: "cn-chart" });
    var readout = el("div", { class: "cn-readout" });
    var src = el("p", { class: "w-source" });
    root.appendChild(chart);
    root.appendChild(readout);
    root.appendChild(src);

    function lineChart() {
      var W = chartWidth(chart), H = 290, padL = 40, padR = W < 480 ? 50 : 70, padT = 16, padB = 50;
      var iw = W - padL - padR, ih = H - padT - padB;
      var s = svg("svg", { viewBox: "0 0 " + W + " " + H, class: "cn-svg", role: "img",
        "aria-label": "Percent of teachers answering each item correctly at four checkpoints (Table 6.2.1)." });
      function X(c) { return padL + iw * c / 3; }
      function Y(v) { return padT + ih * (1 - v / 100); }
      [0, 25, 50, 75, 100].forEach(function (v) {
        s.appendChild(svg("line", { x1: padL, x2: padL + iw, y1: Y(v), y2: Y(v), class: "c-grid" }));
        s.appendChild(svg("text", { x: padL - 6, y: Y(v) + 4, class: "c-tick", "text-anchor": "end" }, v + "%"));
      });
      D.checkpoints.forEach(function (c, i) {
        s.appendChild(svg("text", { x: X(i), y: H - padB + 18 + (W < 480 && i % 2 ? 14 : 0), class: "c-tick", "text-anchor": i === 0 ? "start" : i === 3 ? "end" : "middle" }, c.label));
      });
      // the session sits between pre and post
      s.appendChild(svg("rect", { x: X(1), y: padT, width: X(2) - X(1), height: ih, class: "cn-band" }));
      s.appendChild(svg("text", { x: (X(1) + X(2)) / 2, y: padT + 12, class: "c-label", "text-anchor": "middle" }, "two-day session"));
      var sel = state.item;
      var labels = [];
      D.items.forEach(function (it) {
        var dim = sel !== "all" && sel !== it.id;
        var cls = "cn-line cn-" + it.location.toLowerCase() + (dim ? " is-dim" : "") + (sel === it.id ? " is-sel" : "");
        var d = it.pct.map(function (v, i) { return (i ? "L" : "M") + X(i).toFixed(1) + " " + Y(v).toFixed(1); }).join(" ");
        var g = svg("g", { class: "cn-series", "data-item": it.id });
        g.appendChild(svg("path", { d: d, class: cls }));
        it.pct.forEach(function (v, i) {
          var dot = svg("circle", { cx: X(i), cy: Y(v), r: sel === it.id ? 4.5 : 3.5, class: "cn-pt cn-" + it.location.toLowerCase() + (dim ? " is-dim" : "") });
          dot.appendChild(svg("title", null, it.id + " " + D.checkpoints[i].label + ": " + v + "%"));
          g.appendChild(dot);
          if (sel === it.id) s.appendChild(svg("text", { x: X(i), y: Y(v) - 9, class: "cn-val", "text-anchor": i === 0 ? "start" : i === 3 ? "end" : "middle" }, v + "%"));
        });
        g.style.cursor = "pointer";
        g.addEventListener("click", function () { setItem(sel === it.id ? "all" : it.id); });
        s.appendChild(g);
        labels.push({ id: it.id, y: Y(it.pct[3]), cls: "cn-" + it.location.toLowerCase(), dim: dim });
      });
      if (state.groups) {
        var gs = E.groupSummary();
        ["Local", "Cloud"].forEach(function (gname) {
          var m = gs[gname].mean;
          var d = m.map(function (v, i) { return (i ? "L" : "M") + X(i).toFixed(1) + " " + Y(v).toFixed(1); }).join(" ");
          s.appendChild(svg("path", { d: d, class: "cn-mean cn-" + gname.toLowerCase() }));
          labels.push({ id: gname + " mean", y: Y(m[3]), cls: "cn-" + gname.toLowerCase(), dim: false, mean: true });
        });
      }
      // end labels, nudged apart
      labels.sort(function (a, b) { return a.y - b.y; });
      for (var i = 1; i < labels.length; i++) if (labels[i].y - labels[i - 1].y < 12) labels[i].y = labels[i - 1].y + 12;
      labels.forEach(function (l) {
        s.appendChild(svg("text", { x: X(3) + 8, y: l.y + 4, class: "cn-endlabel " + l.cls + (l.dim ? " is-dim" : "") + (l.mean ? " cn-meanlabel" : "") }, l.id));
      });
      return s;
    }

    function deltaChart() {
      var W = chartWidth(chart), H = 280, padL = 40, padR = 12, padT = 16, padB = 44;
      var iw = W - padL - padR, ih = H - padT - padB;
      var s = svg("svg", { viewBox: "0 0 " + W + " " + H, class: "cn-svg", role: "img",
        "aria-label": "Change in percent correct between checkpoints for each item (Table 6.2.2)." });
      var lo = -30, hi = 50;
      function Y(v) { return padT + ih * (hi - v) / (hi - lo); }
      [-20, 0, 20, 40].forEach(function (v) {
        s.appendChild(svg("line", { x1: padL, x2: padL + iw, y1: Y(v), y2: Y(v), class: v === 0 ? "cn-zero" : "c-grid" }));
        s.appendChild(svg("text", { x: padL - 6, y: Y(v) + 4, class: "c-tick", "text-anchor": "end" }, (v > 0 ? "+" : v < 0 ? "−" : "") + Math.abs(v)));
      });
      var steps = ["Pre-pre → pre", "Pre → post", "Post → post-post"];
      var stepsShort = ["to pre", "to post", "to post-post"];
      var groupW = iw / 3, sel = state.item;
      var shown = D.items;
      var bw = Math.min(26, (groupW - 16) / (shown.length + (state.groups ? 2 : 0)));
      steps.forEach(function (st, j) {
        var gx = padL + groupW * j;
        s.appendChild(svg("text", { x: gx + groupW / 2, y: H - padB + 18, class: "c-tick", "text-anchor": "middle" }, W < 480 ? stepsShort[j] : st));
        var bars = shown.map(function (it) { return { id: it.id, v: E.deltas(it.id)[j], cls: "cn-" + it.location.toLowerCase(), dim: sel !== "all" && sel !== it.id }; });
        if (state.groups) {
          var gs = E.groupSummary();
          bars.push({ id: "Local mean", v: gs.Local.steps[j], cls: "cn-local cn-meanbar", dim: false });
          bars.push({ id: "Cloud mean", v: gs.Cloud.steps[j], cls: "cn-cloud cn-meanbar", dim: false });
        }
        var start = gx + (groupW - bw * bars.length) / 2;
        bars.forEach(function (b, k) {
          var x = start + k * bw, y0 = Y(0), y1 = Y(b.v);
          var r = svg("rect", { x: x + 1, y: Math.min(y0, y1), width: bw - 2, height: Math.max(1, Math.abs(y1 - y0)), class: "cn-bar " + b.cls + (b.dim ? " is-dim" : "") });
          r.appendChild(svg("title", null, b.id + ", " + st + ": " + signed(b.v, b.id.indexOf("mean") > 0 ? 1 : 0) + " points"));
          s.appendChild(r);
          if (!b.dim && (sel === b.id || (sel === "all" && bw >= 18))) {
            s.appendChild(svg("text", { x: x + bw / 2, y: b.v >= 0 ? y1 - 4 : y1 + 12, class: "cn-val", "text-anchor": "middle" }, signed(b.v, b.id.indexOf("mean") > 0 ? 1 : 0)));
          }
        });
      });
      s.appendChild(svg("text", { x: padL, y: H - 6, class: "c-label" }, "Change in percentage points"));
      return s;
    }

    function drawReadout() {
      var it = selectedItem(), checks = E.check622();
      var html = "";
      if (!it) {
        html += "<p class=\"w-big\" data-levels=\"public hs\">Cloud items kept climbing after their session; local items slipped back.</p>";
        html += "<p data-levels=\"public hs\">Between the end of each session and the end of the summer, the two cloud items gained " +
          "<strong>31</strong> and <strong>21</strong> points, and the two local items lost <strong>18</strong> and <strong>8</strong>.</p>";
        var gs = E.groupSummary();
        html += "<p data-levels=\"ug grad res\">Across the two-day session the local items gained more (mean " + signed(gs.Local.steps[1], 1) + " points against " + signed(gs.Cloud.steps[1], 1) +
          "); from the end of the session to the end of the summer, the cloud items gained (" + signed(gs.Cloud.steps[2], 1) + ") while the local items lost (" + signed(gs.Local.steps[2], 1) +
          "). Means are unweighted across two items each and computed by the page.</p>";
      } else {
        var c = checks.filter(function (x) { return x.id === it.id; })[0];
        html += "<p class=\"w-big\"><strong>" + it.id + "</strong> · " + it.session + " · " + it.lang + " · " + it.location + "</p>";
        html += "<p>" + escapeHtml(it.text) + " Correct: " + it.pct.map(function (v, i) { return D.checkpoints[i].label.toLowerCase() + " <strong>" + v + "%</strong>"; }).join(", ") + ".</p>";
        html += "<p data-levels=\"hs ug grad res\">Changes: " + c.deltas.map(function (v) { return "<strong>" + signed(v) + "</strong>"; }).join(", then ") +
          " points. Table 6.2.2 prints the same three changes.</p>";
        html += "<p data-levels=\"ug grad res\">Average change: the page computes (" + c.deltas.map(function (v) { return signed(v); }).join(" ") + ") ÷ 3 = <strong>" + fix(E.round2(c.average), 2) +
          "</strong>, which equals (post-post − pre-pre) ÷ 3 = (" + it.pct[3] + " − " + it.pct[0] + ") ÷ 3. Table 6.2.2 prints <strong>" + fix(c.printedAverage, 2) + "</strong>" +
          (c.averageMatch ? ", a match." : ", which does not match; the printed value is half of the computed one.") + "</p>";
      }
      readout.innerHTML = html;
          }

    function draw() {
      chart.innerHTML = "";
      chart.appendChild(state.view === "pct" ? lineChart() : deltaChart());
      var lg = el("div", { class: "c-legend" }, [
        el("span", { class: "cn-lg" }, [el("span", { class: "cn-sw cn-sw-local" }), "Local (Table 5.3.1): Robotics and Raspberry Pi, in C++"]),
        el("span", { class: "cn-lg" }, [el("span", { class: "cn-sw cn-sw-cloud" }), "Cloud (Table 5.3.1): Space, in Python, and NNI, in Logo"])
      ]);
      chart.appendChild(lg);
      drawReadout();
      src.textContent = state.view === "pct"
        ? "Paper, Table 6.2.1 · percent correct, printed as n = 20 · Local and Cloud means are the page's"
        : "Paper, Table 6.2.2, rebuilt from Table 6.2.1 · all 12 changes match the printed table · means are the page's";
    }
    draw();
    redraws.push(draw);
    itemDraws.push(draw);
  }

  /* ---------------------------------------------- demo 4: two teachers */

  var QUOTES = {
    hs: "“the [Jupyter Notebook] tutorials really helped me understand Python code.”",
    elem: "“it would be great if I could have my students programming online.”"
  };
  var CASE_TEXT = {
    hs: "Learned Python on her own through the PD's notebooks, then planned part of her physics class around them. Her follow-up interview matched the plan in her slides, and she asked about taking a Python class.",
    elem: "Moved from learning NetLogo Web to teaching it. She reported that fourth graders who had never coded were changing NetLogo code within 15 minutes of first opening the interface."
  };

  function mountTeachers(root) {
    var list = el("div", { class: "cn-cases" });
    root.appendChild(list);
    root.appendChild(el("p", { class: "w-source", text: "Paper, Analysis and Findings (Case Studies I and II) and Figures 1 and 2 · slides counted from the figure captions" }));

    function draw() {
      list.innerHTML = "";
      var W = chartWidth(list);
      D.cases.forEach(function (c) {
        var cols = W < 480 ? 12 : 24, size = Math.floor(Math.min(22, (W - 4) / cols) - 3), gap = 3;
        var rowsN = Math.ceil(c.slides / cols);
        var sw = cols * (size + gap), sh = rowsN * (size + gap);
        var s = svg("svg", { viewBox: "0 0 " + sw + " " + sh, width: sw, height: sh, class: "cn-slides", role: "img",
          "aria-label": c.slides + " slides, " + (c.toolSlidesExact ? c.toolSlides : "more than half, at least " + c.toolSlides) + " on " + c.tool });
        for (var i = 0; i < c.slides; i++) {
          var x = (i % cols) * (size + gap), y = Math.floor(i / cols) * (size + gap);
          s.appendChild(svg("rect", { x: x, y: y, width: size, height: size, class: i < c.toolSlides ? "cn-slide-on" : "cn-slide-off" }));
        }
        var share = c.toolSlidesExact
          ? c.toolSlides + " of " + c.slides + " slides (" + Math.round(100 * c.toolSlides / c.slides) + "%) on " + c.tool
          : "More than half of " + c.slides + " slides (at least " + c.toolSlides + ") on " + c.tool;
        list.appendChild(el("div", { class: "cn-case" }, [
          el("p", { class: "cn-case-head", html: "<strong>" + c.who + "</strong> · " + c.years + " of teaching" }),
          s,
          el("p", { class: "w-mono", text: share }),
          el("p", { class: "cn-quote", text: QUOTES[c.id] }),
          el("p", { class: "w-note", text: CASE_TEXT[c.id] })
        ]));
      });
    }
    draw();
    redraws.push(draw);
  }

  /* ---------------------------------------------- demo 5: group sizes */

  function mountDenoms(root) {
    var nCtl = el("input", { type: "range", min: "10", max: "30", step: "1", value: String(state.n), "aria-label": "Number of teachers answering" });
    var nOut = el("span", { class: "w-mono cn-nout" });
    root.appendChild(el("div", { class: "w-actions" }, [el("span", { class: "w-mono", text: "Item:" }), itemControl(true)]));
    root.appendChild(el("div", { class: "w-actions" }, [el("label", { class: "w-mono", text: "Teachers answering, n:" }), nCtl, nOut]));
    var presets = el("div", { class: "w-actions" }, [el("span", { class: "w-mono", text: "Try:" })]);
    [{ n: 20, label: "n = 20 (as printed)" }, { n: 22, label: "n = 22" }, { n: 30, label: "n = 30 (all teachers)" }].forEach(function (p) {
      var b = el("button", { type: "button", class: "w-btn cn-btn-quiet", text: p.label });
      b.addEventListener("click", function () { state.n = p.n; nCtl.value = String(p.n); draw(); });
      presets.appendChild(b);
    });
    root.appendChild(presets);
    var grid = el("div", { class: "cn-scroll" });
    var readout = el("div", { class: "cn-readout" });
    root.appendChild(grid);
    root.appendChild(readout);
    root.appendChild(el("p", { class: "w-source", text: "Computed by the page from Table 6.2.1 · a percentage fits n when some whole number k of n teachers gives 100k/n within half a point of it" }));
    nCtl.addEventListener("input", function () { state.n = Number(nCtl.value); draw(); });

    function draw() {
      var n = state.n, its = state.item === "all" ? D.items : [E.item(state.item)];
      nOut.textContent = String(n);
      var head = el("tr", null, [el("th", { text: "Item" })].concat(D.checkpoints.map(function (c) { return el("th", { text: c.label }); })).concat([el("th", { text: "Smallest n that fits all four" })]));
      var tb = el("tbody");
      var fit = 0, total = 0;
      its.forEach(function (it) {
        var tds = [el("td", { text: it.id })];
        it.pct.forEach(function (p) {
          var ks = E.counts(p, n); total++; if (ks.length) fit++;
          tds.push(el("td", { class: ks.length ? "cn-fit" : "cn-nofit", html: p + "%<br><span class=\"cn-k\">" + (ks.length ? ks.join(" or ") + " of " + n : "no k") + "</span>" }));
        });
        var shared = E.sharedDenominators(it.pct, 5, 60);
        tds.push(el("td", { text: shared.length ? String(shared[0]) : "none up to 60" }));
        tb.appendChild(el("tr", null, tds));
      });
      grid.innerHTML = "";
      grid.appendChild(el("table", { class: "cn-table cn-denoms" }, [el("thead", null, [head]), tb]));
      var all = D.items.map(function (it) { return E.sharedDenominators(it.pct, 10, 30).length; }).reduce(function (a, b) { return a + b; }, 0);
      var allFit20 = 0; D.items.forEach(function (it) { it.pct.forEach(function (p) { if (E.counts(p, 20).length) allFit20++; }); });
      readout.innerHTML = "<p class=\"w-big\">With <strong>" + n + "</strong> teachers answering, <strong>" + fit + " of " + total + "</strong> printed percentages " + (fit === 1 ? "is" : "are") + " reachable.</p>" +
        "<p>The table is printed for 20 participants, yet only " + words(allFit20) + " of its 16 percentages are whole numbers of 20 (6%, for example, would need 1.2 teachers). " +
        (all === 0 ? "No single group size from 10 to 30 reproduces all four checkpoints of any item, so the number of teachers answering most likely changed from one checkpoint to the next." : "") + "</p>";
    }
    draw();
    itemDraws.push(draw);
  }

  /* ---------------------------------------------------------------- mount */

  function mount(id, fn) {
    var root = document.getElementById(id);
    if (!root) return;
    root.innerHTML = "";
    fn(root);
    root.classList.add("w-ready");
  }
  function init() {
    mount("cn-notebook", mountNotebook);
    mount("cn-design", mountDesign);
    mount("cn-scores", mountScores);
    mount("cn-teachers", mountTeachers);
    mount("cn-denoms", mountDenoms);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();

/*
  Small-sample Likert widget for /papers/small-sample-likert/.
  Mount points in the page: #sl-campers, #sl-prior, #sl-evidence, #sl-exact.

  Demo 1 draws the paper's GW27 answers (Tables 1 and 2) as one dot per camper.
  Demo 2 recomputes the Dirichlet-smoothed probabilities of Table 1.
  Demo 3 recomputes the likelihood ratios of Tables 1 and 2 and the Bayes update.
  Demo 4 (graduate and researcher only) is the page's own exact test; the paper
  reports no p-values.
  All arithmetic lives in likert-engine.js.
*/
(function () {
  "use strict";

  var E = window.LikertEngine;
  var D = E.DATA;
  var SVGNS = "http://www.w3.org/2000/svg";
  var K = 5;

  // One state object; demos 3 and 4 share the after-camp counts.
  var state = {
    post: D.post.slice(),
    you: -1,                // demo 1: the visitor's own answer, or -1
    campersView: "both",
    prior: { counts: D.pre2022.slice(), alpha: 1, preset: "y2022" },
    evidence: { view: "t2", coef: true, round: true, priorNull: 50 },
    exact: { stat: "chisq" }
  };

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

  var redraws = [];
  var resizeTimer = null;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () { redraws.forEach(function (fn) { fn(); }); }, 150);
  });
  document.addEventListener("paperlevel", function () {
    // Charts hidden at the previous level had no width; draw them again.
    setTimeout(function () { redraws.forEach(function (fn) { fn(); }); }, 0);
  });

  function sum(a) { return E.sum(a); }
  function fix(x, d) { return Number(x).toFixed(d); }
  function pct(x, d) { return (100 * x).toFixed(d === undefined ? 0 : d) + "%"; }
  function fmtRatio(r) {
    if (!isFinite(r)) return r > 0 ? "∞" : "0";
    if (r >= 100) return Math.round(r).toLocaleString("en-US");
    if (r >= 10) return fix(r, 1);
    if (r >= 1) return fix(r, 2);
    return fix(r, 3);
  }
  function fmtP(p) {
    if (p < 0.0001) return p.toExponential(1);
    if (p < 0.01) return fix(p, 4);
    return fix(p, 3);
  }
  function sci(x) {
    if (x === 0) return "0";
    if (x >= 0.001) return fix(x, 5);
    var e = Math.floor(Math.log10(x)), m = x / Math.pow(10, e);
    var sup = { "-": "⁻", "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹" };
    return fix(m, 2) + " × 10" + String(e).split("").map(function (ch) { return sup[ch]; }).join("");
  }

  function segmented(label, options, value, onChange) {
    var wrap = el("div", { class: "seg", role: "radiogroup", "aria-label": label });
    var buttons = options.map(function (opt) {
      var b = el("button", { type: "button", class: "seg-option", role: "radio", "data-value": String(opt.value), text: opt.label });
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

  function checkbox(id, label, checked, onChange) {
    var input = el("input", { type: "checkbox", id: id });
    input.checked = !!checked;
    input.addEventListener("change", function () { onChange(input.checked); });
    return el("label", { class: "sl-check", for: id }, [input, el("span", { text: label })]);
  }

  function stepper(label, get, set, min, max) {
    var out = el("output", { class: "sl-step-val", "aria-live": "polite" });
    var minus = el("button", { type: "button", class: "sl-step", "aria-label": "One fewer: " + label, text: "−" });
    var plus = el("button", { type: "button", class: "sl-step", "aria-label": "One more: " + label, text: "+" });
    minus.addEventListener("click", function () { if (get() > min) set(get() - 1); });
    plus.addEventListener("click", function () { if (get() < max) set(get() + 1); });
    var wrap = el("span", { class: "sl-stepper" }, [minus, out, plus]);
    wrap.refresh = function () { out.textContent = String(get()); minus.disabled = get() <= min; plus.disabled = get() >= max; };
    wrap.refresh();
    return wrap;
  }

  function note(text, levels) {
    var p = el("p", { class: "w-note", html: text });
    if (levels) p.setAttribute("data-levels", levels);
    return p;
  }

  /* ---------------------------------------------------------------- demo 1: campers */

  function mountCampers(root) {
    var view = segmented("Which answers to show", [
      { value: "pre", label: "Before camp" },
      { value: "post", label: "After camp" },
      { value: "both", label: "Both" }
    ], state.campersView, function (v) { state.campersView = v; draw(); });

    var chart = el("div", { class: "sl-chart" });
    var legend = el("div", { class: "c-legend w-mono" }, [
      el("span", { class: "lg sl-lg-2022", text: "2022 camper (before)" }),
      el("span", { class: "lg sl-lg-2023", text: "2023 camper (before)" }),
      el("span", { class: "lg sl-lg-post", text: "Camper (after; years not reported)" }),
      el("span", { class: "lg sl-lg-you", text: "You" }),
      el("span", { class: "lg sl-lg-exp", "data-levels": "ug grad res", text: "Expected after-camp count if nothing changed" })
    ]);

    var youRow = el("div", { class: "w-actions sl-you" }, [el("span", { class: "w-mono", text: "Your answer:" })]);
    var youButtons = D.short.map(function (s, i) {
      var b = el("button", { type: "button", class: "sl-pick", "aria-pressed": "false", text: s });
      b.addEventListener("click", function () { state.you = state.you === i ? -1 : i; draw(); });
      youRow.appendChild(b);
      return b;
    });
    var readout = el("div", { class: "sl-readout" });

    root.appendChild(el("p", { class: "w-big", html: "“" + D.statement + "”" }));
    root.appendChild(el("p", { class: "w-source", text: "Item GW27, feelings toward group work · 17 campers who answered both surveys (Tables 1 and 2)" }));
    root.appendChild(el("div", { class: "w-actions" }, [view]));
    root.appendChild(chart);
    root.appendChild(legend);
    root.appendChild(youRow);
    root.appendChild(readout);

    function draw() {
      var w = chartWidth(chart);
      var show = state.campersView;
      var panels = show === "both" ? ["pre", "post"] : [show];
      var r = w < 420 ? 6 : 8, gap = 2 * r + 3;
      var maxStack = 9; // the tallest column (7 after camp) plus room for you
      var panelH = maxStack * gap + 58;
      var h = panels.length * panelH + 8;
      var left = 8, colW = (w - left - 8) / K;
      var s = svg("svg", { viewBox: "0 0 " + w + " " + h, class: "sl-svg", role: "img",
        "aria-label": "Dot plot of the 17 campers' answers to GW27 before and after camp" });

      panels.forEach(function (which, pi) {
        var top = pi * panelH + 20;
        var base = top + maxStack * gap;
        s.appendChild(svg("text", { x: left, y: top - 4, class: "c-label" }, which === "pre" ? "Before camp (first hour, day one)" : "After camp (last hour, last day)"));
        s.appendChild(svg("line", { x1: left, x2: w - 8, y1: base + 2, y2: base + 2, class: "c-grid" }));
        var counts = which === "pre" ? D.prePooled : state.post;
        var n = sum(counts) + (which === "post" && state.you >= 0 ? 1 : 0);
        var expected = E.smooth(D.prePooled).map(function (p) { return p * sum(state.post); });
        for (var c = 0; c < K; c++) {
          var cx = left + colW * (c + 0.5);
          if (which === "post") {
            var eh = expected[c] * gap;
            var ge = svg("g", { "data-levels": "ug grad res" });
            ge.appendChild(svg("rect", { x: cx - r - 4, y: base - eh, width: 2 * r + 8, height: eh, class: "sl-exp" }));
            s.appendChild(ge);
          }
          var dots = [];
          if (which === "pre") {
            for (var a = 0; a < D.pre2022[c]; a++) dots.push("y2022");
            for (var b = 0; b < D.pre2023[c]; b++) dots.push("y2023");
          } else {
            for (var p = 0; p < counts[c]; p++) dots.push("post");
            if (state.you === c) dots.push("you");
          }
          dots.forEach(function (kind, j) {
            s.appendChild(svg("circle", { cx: cx, cy: base - r - j * gap, r: r, class: "sl-dot sl-dot-" + kind }));
          });
          var share = n ? (counts[c] + (which === "post" && state.you === c ? 1 : 0)) / n : 0;
          s.appendChild(svg("text", { x: cx, y: base + 16, "text-anchor": "middle", class: "c-tick" }, D.short[c]));
          s.appendChild(svg("text", { x: cx, y: base + 29, "text-anchor": "middle", class: "c-label" }, pct(share)));
        }
        if (which === "post") {
          var g5 = svg("g", { "data-levels": "ug grad res" });
          g5.appendChild(svg("line", { x1: left, x2: w - 8, y1: base - 5 * gap, y2: base - 5 * gap, class: "sl-five" }));
          g5.appendChild(svg("text", { x: w - 10, y: base - 5 * gap - 4, "text-anchor": "end", class: "c-tick" }, "5 expected: chi-squared rule of thumb"));
          s.appendChild(g5);
        }
      });
      chart.innerHTML = "";
      chart.appendChild(s);

      youButtons.forEach(function (b, i) { b.setAttribute("aria-pressed", state.you === i ? "true" : "false"); });
      var lines = [];
      var shift = state.post[2] + state.post[3] + state.post[4] - (D.prePooled[2] + D.prePooled[3] + D.prePooled[4]);
      lines.push(el("p", { html: "Neutral or true of me: <strong>" + (D.prePooled[2] + D.prePooled[3] + D.prePooled[4]) + " of 17</strong> before camp, <strong>" +
        (state.post[2] + state.post[3] + state.post[4]) + " of " + sum(state.post) + "</strong> after." +
        (shift > 0 ? " More campers agreed, at least partly, that they rarely feel relaxed in a group." : "") }));
      if (state.you >= 0) {
        lines.push(el("p", { html: "With your answer the after-camp group holds 18 people, and one person moves any column by about <strong>" + pct(1 / 18, 1) + "</strong>. In a group this small, every single answer shows." }));
      } else {
        lines.push(el("p", { class: "w-note", text: "Pick an answer to add yourself as an 18th camper. Your answer stays on this page and changes nothing in the other demos." }));
      }
      var exp = E.smooth(D.prePooled).map(function (p) { return p * 17; });
      lines.push(note("Expected after-camp counts if camp changed nothing: " + exp.map(function (x) { return fix(x, 2); }).join(", ") +
        ". Every one sits below 5, the usual threshold for Pearson's chi-squared test, so the authors set that test aside.", "ug grad res"));
      readout.innerHTML = "";
      lines.forEach(function (l) { readout.appendChild(l); });
    }
    redraws.push(draw);
    draw();
  }

  /* ---------------------------------------------------------------- demo 2: the prior */

  var PRESETS = [
    { value: "y2022", label: "2022, before", counts: D.pre2022, paper: { alpha: 1, probs: D.table1.p2022, where: "Table 1, 2022 column" } },
    { value: "y2023", label: "2023, before", counts: D.pre2023 },
    { value: "pooled", label: "Both years, before", counts: D.prePooled, paper: { alpha: 1, probs: D.table1.pPooled, where: "Tables 1 and 2, pooled column" } },
    { value: "post", label: "After camp", counts: D.post },
    { value: "empty", label: "Three campers", counts: [0, 0, 2, 1, 0] }
  ];

  function mountPrior(root) {
    var presetSeg = segmented("Answers to start from", PRESETS.map(function (p) { return { value: p.value, label: p.label }; }),
      state.prior.preset, function (v) {
        var p = PRESETS.filter(function (x) { return x.value === v; })[0];
        state.prior.preset = v; state.prior.counts = p.counts.slice(); refreshAll();
      });
    var alphaSeg = segmented("Prior", [
      { value: 0, label: "Raw shares" },
      { value: 1, label: "The paper's prior" },
      { value: 0.5, label: "α = ½", levels: "grad res" },
      { value: 2, label: "α = 2", levels: "grad res" },
      { value: 5, label: "α = 5", levels: "grad res" }
    ], state.prior.alpha, function (v) { state.prior.alpha = v; refreshAll(); });

    var rows = el("div", { class: "sl-rows" });
    var steppers = [];
    var bars = [];
    D.categories.forEach(function (name, i) {
      var st = stepper(name, function () { return state.prior.counts[i]; }, function (v) {
        state.prior.counts[i] = v; state.prior.preset = "custom"; presetSeg.set("custom"); refreshAll();
      }, 0, 20);
      steppers.push(st);
      var bar = el("div", { class: "sl-bars" });
      bars.push(bar);
      rows.appendChild(el("div", { class: "sl-row" }, [el("span", { class: "sl-row-name", text: name }), st, bar]));
    });
    var readout = el("div", { class: "sl-readout" });

    root.appendChild(el("div", { class: "w-actions" }, [presetSeg]));
    root.appendChild(el("div", { class: "w-actions" }, [alphaSeg]));
    root.appendChild(el("div", { class: "c-legend w-mono" }, [
      el("span", { class: "lg sl-lg-raw", text: "Share of answers" }),
      el("span", { class: "lg sl-lg-smooth", text: "Estimated probability with the prior" })
    ]));
    root.appendChild(rows);
    root.appendChild(readout);

    function refreshAll() {
      var c = state.prior.counts, a = state.prior.alpha, n = sum(c);
      var raw = c.map(function (x) { return n ? x / n : 0; });
      var sm = E.smooth(c, a);
      var top = Math.max(0.5, Math.max.apply(null, raw.concat(sm)));
      steppers.forEach(function (s) { s.refresh(); });
      bars.forEach(function (bar, i) {
        bar.innerHTML = "";
        bar.appendChild(el("span", { class: "sl-bar sl-bar-raw", style: "width:" + (100 * raw[i] / top) + "%" }));
        bar.appendChild(el("span", { class: "sl-bar-val", text: fix(raw[i], 3) }));
        bar.appendChild(el("span", { class: "sl-bar sl-bar-smooth", style: "width:" + (100 * sm[i] / top) + "%" }));
        bar.appendChild(el("span", { class: "sl-bar-val sl-bar-val-smooth", text: fix(sm[i], 3) }));
      });
      var lines = [];
      var zeros = c.filter(function (x) { return x === 0; }).length;
      lines.push(el("p", { html: "<strong>" + n + "</strong> answers" + (zeros ? ", <strong>" + zeros + "</strong> empty box" + (zeros > 1 ? "es" : "") : "") + "." +
        (zeros && a === 0 ? " An empty box gets probability zero, so any later answer that lands there would count as impossible." : "") +
        (zeros && a > 0 ? " The prior gives every empty box a small probability instead of zero." : "") }));
      var i0 = 0;
      lines.push(note("Worked for the first box: (" + fix(a, a % 1 ? 1 : 0) + " + " + c[i0] + ") ÷ (" + K + " × " + fix(a, a % 1 ? 1 : 0) + " + " + n + ") = <strong>" + fix(sm[i0], 3) + "</strong>.", "hs ug grad res"));
      var preset = PRESETS.filter(function (p) { return p.value === state.prior.preset; })[0];
      if (preset && preset.paper) {
        if (a === 1) {
          var r3 = E.roundTo(sm, 3);
          var same = r3.every(function (x, i) { return Math.abs(x - preset.paper.probs[i]) < 1e-9; });
          lines.push(el("p", { class: "sl-match", html: (same ? "✓ Matches " : "Differs from ") + preset.paper.where + ": " + preset.paper.probs.map(function (x) { return fix(x, 3); }).join(", ") + "." }));
        } else {
          lines.push(note("Choose the paper's prior to compare with " + preset.paper.where + "."));
        }
      }
      lines.push(note("With α imaginary answers in each box, the estimate is the mean of a Dirichlet(α, …, α) posterior. Larger α pulls every box toward 1/5 = 0.2; α = 1, the paper's choice, is the uniform prior.", "grad res"));
      readout.innerHTML = "";
      lines.forEach(function (l) { readout.appendChild(l); });
    }
    refreshAll();
  }

  /* ---------------------------------------------------------------- demo 3: evidence */

  function mountEvidence(root) {
    var viewSeg = segmented("Comparison", [
      { value: "t2", label: "Before vs. after (Table 2)" },
      { value: "t1", label: "2022 vs. 2023 (Table 1)" }
    ], state.evidence.view, function (v) { state.evidence.view = v; draw(); });

    var opts = el("div", { class: "w-actions", "data-levels": "grad res" }, [
      checkbox("sl-round", "Round probabilities to three places, as printed", state.evidence.round, function (v) { state.evidence.round = v; draw(); }),
      checkbox("sl-coef", "Include the multinomial coefficient", state.evidence.coef, function (v) { state.evidence.coef = v; draw(); })
    ]);

    var tableWrap = el("div", { class: "sl-table-wrap" });
    var editRow = el("div", { class: "sl-edit" });
    var postSteppers = D.short.map(function (s, i) {
      return stepper(s, function () { return state.post[i]; }, function (v) { state.post[i] = v; changed(); }, 0, 17);
    });
    var reset = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "Reset to the paper's counts" });
    reset.addEventListener("click", function () { state.post = D.post.slice(); changed(); });
    editRow.appendChild(el("p", { class: "w-mono", text: "Move the after-camp answers:" }));
    var stepRow = el("div", { class: "sl-step-row" });
    postSteppers.forEach(function (st, i) { stepRow.appendChild(el("span", { class: "sl-step-cell" }, [el("span", { class: "c-tick-html", text: D.short[i] }), st])); });
    editRow.appendChild(stepRow);
    editRow.appendChild(el("div", { class: "w-actions" }, [reset]));

    var big = el("p", { class: "w-big" });
    var scale = el("div", { class: "sl-chart" });
    var prior = el("input", { type: "range", min: "1", max: "99", step: "1", value: String(state.evidence.priorNull), "aria-label": "Prior probability that camp changed nothing" });
    var priorOut = el("output");
    prior.addEventListener("input", function () { state.evidence.priorNull = +prior.value; draw(); });
    var bayes = el("div", { class: "sl-bayes" }, [
      el("div", { class: "w-range" }, [el("span", { text: "Belief before: no change" }), prior, priorOut])
    ]);
    var readout = el("div", { class: "sl-readout" });

    root.appendChild(el("div", { class: "w-actions" }, [viewSeg]));
    root.appendChild(opts);
    root.appendChild(tableWrap);
    root.appendChild(editRow);
    root.appendChild(big);
    root.appendChild(scale);
    root.appendChild(bayes);
    root.appendChild(readout);

    function probsFor(counts) {
      var p = E.smooth(counts);
      return state.evidence.round ? E.roundTo(p, 3) : p;
    }
    function ratio(a, b, counts) {
      return E.paperRatio(a, b, E.smooth(counts), { coef: state.evidence.coef, round: state.evidence.round ? 3 : null });
    }
    function changed() { postSteppers.forEach(function (s) { s.refresh(); }); draw(); if (exactRedraw) exactRedraw(); }

    function countRow(label, counts, pmf) {
      var tr = el("tr", null, [el("td", { text: label })]);
      counts.forEach(function (x) { tr.appendChild(el("td", { text: String(x) })); });
      tr.appendChild(el("td", { text: String(sum(counts)) }));
      tr.appendChild(el("td", { class: "sl-pmf", text: pmf === undefined ? "" : sci(pmf) }));
      return tr;
    }
    function probRow(label, p, cls) {
      var tr = el("tr", { class: cls || "" }, [el("td", { text: label })]);
      p.forEach(function (x) { tr.appendChild(el("td", { text: fix(x, 3) })); });
      tr.appendChild(el("td", { text: "" }));
      tr.appendChild(el("td", { text: "" }));
      return tr;
    }
    function table(head, rows) {
      var thead = el("tr", null, [el("th", { text: "" })]);
      D.short.forEach(function (s) { thead.appendChild(el("th", { text: s })); });
      thead.appendChild(el("th", { text: "N" }));
      thead.appendChild(el("th", { class: "sl-pmf", text: "Probability of these counts" }));
      var t = el("table", { class: "results-table sl-table" }, [el("caption", { class: "w-note", text: head }), el("thead", null, [thead])]);
      var tb = el("tbody");
      rows.forEach(function (r) { tb.appendChild(r); });
      t.appendChild(tb);
      return t;
    }

    function draw() {
      var ev = state.evidence;
      var coef = ev.coef, places = ev.round ? 3 : null;
      tableWrap.innerHTML = "";
      readout.innerHTML = "";
      var lr, label, paperVal = null, lines = [];
      if (ev.view === "t2") {
        editRow.hidden = false;
        var p0 = probsFor(D.prePooled);
        var pre = E.multinomial(D.prePooled, p0, coef), post = E.multinomial(state.post, p0, coef);
        lr = pre / post;
        var isPaper = state.post.join() === D.post.join() && coef && ev.round;
        paperVal = isPaper ? D.table2.lr : null;
        tableWrap.appendChild(table("Hypothesis of no change: probabilities from the before-camp answers (Table 2), with the paper's prior.", [
          probRow("No-change probabilities", p0, "sl-hyp"),
          countRow("Before camp", D.prePooled, pre),
          countRow("After camp", state.post, post)
        ]));
        label = "Before-camp answers ÷ after-camp answers, both under the no-change probabilities";
        big.innerHTML = "Likelihood ratio: <strong>" + fmtRatio(lr) + "</strong>" + (paperVal ? " <span class='sl-match'>✓ Table 2 prints " + paperVal + "</span>" : "");
        lines.push(el("p", { "data-levels": "public hs", html: "If camp changed nothing, the after-camp answers should look as probable as the before-camp answers. Under that no-change pattern, the after-camp answers come out <strong>" + fmtRatio(lr) + " times</strong> less probable." }));
        lines.push(el("p", { "data-levels": "ug grad res", html: "The ratio divides the probability of the before-camp counts by the probability of the after-camp counts, both computed with the no-change probabilities. That calculation reproduces the printed 12.1. The paper reads it as evidence that the after-camp answers fit the camp's effect " + "12.1 times better than they fit no change." }));
        if (!sum(state.post)) lines.push(note("Add at least one after-camp answer."));
      } else {
        editRow.hidden = true;
        var p22 = probsFor(D.pre2022), pp = probsFor(D.prePooled);
        var r22 = E.multinomial(D.pre2022, p22, coef) / E.multinomial(D.pre2023, p22, coef);
        var rpool = E.multinomial(D.pre2022, pp, coef) / E.multinomial(D.pre2023, pp, coef);
        lr = rpool;
        paperVal = coef && ev.round ? D.table1.lrPooled : null;
        tableWrap.appendChild(table("Before-camp answers by year (Table 1), with the paper's prior.", [
          probRow("2022-only probabilities", p22, "sl-hyp"),
          probRow("Pooled probabilities", pp, "sl-hyp"),
          countRow("2022 campers", D.pre2022, E.multinomial(D.pre2022, pp, coef)),
          countRow("2023 campers", D.pre2023, E.multinomial(D.pre2023, pp, coef))
        ]));
        label = "2022 answers ÷ 2023 answers, both under the pooled probabilities";
        big.innerHTML = "Likelihood ratio: <strong>" + fmtRatio(rpool) + "</strong>" + (paperVal ? " <span class='sl-match'>✓ Table 1 prints " + paperVal + "</span>" : "");
        lines.push(el("p", { html: "The two years' answers are about equally probable under one shared pattern, so the ratio lands well inside the band where the authors call the evidence too weak to separate the groups. That is why they combined the 2022 and 2023 campers into one group of 17." }));
        lines.push(note("The same calculation with the 2022-only probabilities gives <strong>" + fmtRatio(r22) + "</strong>; Table 1 prints 2.6 in that column. The page could not reproduce 2.6 with the rule that reproduces 0.819 and 12.1 (see the researcher notes).", "grad res"));
      }
      drawScale(lr, label);

      priorOut.textContent = ev.priorNull + "%";
      var postNull = E.posteriorNull(ev.view === "t2" ? lr : lr, ev.priorNull / 100);
      if (ev.view === "t2") {
        bayes.hidden = false;
        lines.push(el("p", { html: "Treating the ratio as the evidence for change, a " + ev.priorNull + "% belief in no change before the data drops to <strong>" + pct(postNull, 1) + "</strong> after it." +
          (ev.priorNull === 50 && paperVal ? " <span class='sl-match'>✓ The paper reports 50% falling to 7.6%.</span>" : "") }));
        lines.push(note("Bayes' theorem with the likelihood ratio LR: P(no change | data) = p ÷ (p + (1 − p) × LR), where p is the prior belief.", "ug grad res"));
        var methodsLR = E.likelihoodRatio(state.post, E.smooth(state.post), E.smooth(D.prePooled));
        lines.push(note("<span class='sl-own'>Computed by this page:</span> the likelihood ratio as the Methods section defines it, P(after-camp answers | after-camp probabilities) ÷ P(after-camp answers | no-change probabilities), is <strong>" + fmtRatio(methodsLR) + "</strong>. Both hypotheses then describe the same 17 answers, and the multinomial coefficient cancels.", "grad res"));
      } else {
        bayes.hidden = true;
      }
      lines.forEach(function (l) { readout.appendChild(l); });
    }

    function drawScale(lr, label) {
      var w = chartWidth(scale), h = 74, left = 14, right = w - 14;
      var lo = Math.log(1 / 64), hi = Math.log(64);
      function x(v) { var t = (Math.log(Math.max(1e-6, v)) - lo) / (hi - lo); return left + Math.max(0, Math.min(1, t)) * (right - left); }
      var s = svg("svg", { viewBox: "0 0 " + w + " " + h, class: "sl-svg", role: "img", "aria-label": "Likelihood ratio on a log scale from 1/64 to 64, with the 1/8 to 8 band the authors treat as weak evidence" });
      s.appendChild(svg("rect", { x: x(1 / 8), y: 18, width: x(8) - x(1 / 8), height: 22, class: "sl-band" }));
      s.appendChild(svg("text", { x: (x(1 / 8) + x(8)) / 2, y: 14, "text-anchor": "middle", class: "c-tick" }, "1/8 to 8: too weak to call (the paper's band)"));
      s.appendChild(svg("line", { x1: left, x2: right, y1: 40, y2: 40, class: "c-grid" }));
      [[1 / 64, "1/64"], [1 / 8, "1/8"], [1, "1"], [8, "8"], [64, "64"]].forEach(function (t) {
        s.appendChild(svg("line", { x1: x(t[0]), x2: x(t[0]), y1: 36, y2: 44, class: "c-grid" }));
        s.appendChild(svg("text", { x: x(t[0]), y: 58, "text-anchor": "middle", class: "c-tick" }, t[1]));
      });
      if (isFinite(lr) && lr > 0) {
        var mx = x(lr);
        s.appendChild(svg("line", { x1: mx, x2: mx, y1: 18, y2: 44, class: "sl-mark" }));
        s.appendChild(svg("circle", { cx: mx, cy: 29, r: 6, class: "c-dot" }));
        var off = lr > 64 || lr < 1 / 64 ? " (off scale)" : "";
        s.appendChild(svg("text", { x: Math.min(right, Math.max(left, mx)), y: 71, "text-anchor": mx > w * 0.7 ? "end" : (mx < w * 0.3 ? "start" : "middle"), class: "c-label" }, fmtRatio(lr) + off));
      }
      scale.innerHTML = "";
      scale.appendChild(s);
      scale.setAttribute("title", label);
    }

    redraws.push(draw);
    draw();
  }

  /* ---------------------------------------------------------------- demo 4: exact test (page's own) */

  var exactRedraw = null;

  function mountExact(root) {
    var statSeg = segmented("Ordering of tables", [
      { value: "chisq", label: "Pearson X²" },
      { value: "g", label: "G statistic" },
      { value: "prob", label: "Table probability" }
    ], state.exact.stat, function (v) { state.exact.stat = v; draw(); });
    var chart = el("div", { class: "sl-chart" });
    var readout = el("div", { class: "sl-readout" });
    root.appendChild(el("p", { class: "w-source", html: "<span class='sl-own'>Computed by this page.</span> The paper reports no p-values; it cites exact multinomial tests (Resin, 2023; Engels' XNomial) as alternatives." }));
    root.appendChild(el("div", { class: "w-actions" }, [statSeg]));
    root.appendChild(chart);
    root.appendChild(el("div", { class: "c-legend w-mono" }, [
      el("span", { class: "lg sl-lg-hist", text: "Exact probability of each statistic value (all tables of N answers)" }),
      el("span", { class: "lg sl-lg-tail", text: "At least as extreme as observed" }),
      el("span", { class: "lg sl-lg-curve", text: "Chi-squared approximation, 4 degrees of freedom" })
    ]));
    root.appendChild(readout);

    function draw() {
      var p0 = E.smooth(D.prePooled);
      var obs = state.post, n = sum(obs);
      readout.innerHTML = "";
      chart.innerHTML = "";
      if (n === 0) { readout.appendChild(note("Add at least one after-camp answer in the demo above.")); return; }
      var res = E.exactTest(obs, p0);
      var stat = state.exact.stat;
      // Collect the distribution of the chosen statistic.
      var vals = [];
      var lnObs = E.lnMultinomial(obs, p0, true);
      var sObs = stat === "chisq" ? res.chisq : stat === "g" ? res.g : -lnObs;
      E.forEachTable(n, K, function (t) {
        var lnq = E.lnMultinomial(t, p0, true);
        var v = stat === "chisq" ? E.pearson(t, p0) : stat === "g" ? E.gStat(t, p0) : -lnq;
        vals.push([v, Math.exp(lnq)]);
      });
      var lo = stat === "prob" ? Math.min.apply(null, vals.map(function (v) { return v[0]; })) : 0;
      var cap = stat === "prob" ? lo + 14 : Math.max(16, Math.min(40, sObs * 2.2));
      var bins = 48, width = (cap - lo) / bins, hist = new Float64Array(bins), tail = new Float64Array(bins);
      vals.forEach(function (v) {
        var b = Math.min(bins - 1, Math.max(0, Math.floor((v[0] - lo) / width)));
        hist[b] += v[1];
        if (v[0] >= sObs - 1e-9) tail[b] += v[1];
      });
      var w = chartWidth(chart), h = 190, L = 44, R = w - 10, T = 10, B = h - 32;
      var ymax = Math.max.apply(null, Array.prototype.slice.call(hist));
      if (stat !== "prob") {
        for (var i = 0; i < bins; i++) {
          var xm = lo + (i + 0.5) * width;
          ymax = Math.max(ymax, chiPdf(xm, 4) * width);
        }
      }
      ymax *= 1.08;
      function X(v) { return L + (v - lo) / (cap - lo) * (R - L); }
      function Y(p) { return B - p / ymax * (B - T); }
      var s = svg("svg", { viewBox: "0 0 " + w + " " + h, class: "sl-svg", role: "img", "aria-label": "Exact distribution of the chosen statistic with the observed value marked" });
      [0, 0.5, 1].forEach(function (f) {
        var yv = ymax * f / 1.08;
        s.appendChild(svg("line", { x1: L, x2: R, y1: Y(yv), y2: Y(yv), class: "c-grid" }));
        s.appendChild(svg("text", { x: L - 6, y: Y(yv) + 4, "text-anchor": "end", class: "c-tick" }, fix(yv, 2)));
      });
      for (var j = 0; j < bins; j++) {
        var x0 = X(lo + j * width), bw = Math.max(1, X(lo + (j + 1) * width) - x0 - 1);
        if (hist[j] > 0) s.appendChild(svg("rect", { x: x0, y: Y(hist[j]), width: bw, height: B - Y(hist[j]), class: "sl-hist" }));
        if (tail[j] > 0) s.appendChild(svg("rect", { x: x0, y: Y(tail[j]), width: bw, height: B - Y(tail[j]), class: "sl-tail" }));
      }
      if (stat !== "prob") {
        var d = "";
        for (var k2 = 0; k2 <= 160; k2++) {
          var xv = lo + (cap - lo) * k2 / 160;
          d += (k2 ? "L" : "M") + X(xv).toFixed(1) + "," + Y(chiPdf(Math.max(xv, 1e-6), 4) * width).toFixed(1);
        }
        s.appendChild(svg("path", { d: d, class: "sl-curve" }));
      }
      var xo = X(Math.min(sObs, cap));
      s.appendChild(svg("line", { x1: xo, x2: xo, y1: T, y2: B, class: "sl-mark" }));
      s.appendChild(svg("text", { x: xo + (xo > w * 0.7 ? -4 : 4), y: T + 12, "text-anchor": xo > w * 0.7 ? "end" : "start", class: "c-label" }, "observed " + fix(sObs, 2)));
      s.appendChild(svg("line", { x1: L, x2: R, y1: B, y2: B, class: "c-grid" }));
      var tickStep = (cap - lo) > 24 ? 10 : 4;
      for (var tv = Math.ceil(lo / tickStep) * tickStep; tv <= cap; tv += tickStep) {
        s.appendChild(svg("text", { x: X(tv), y: B + 14, "text-anchor": "middle", class: "c-tick" }, String(tv)));
      }
      s.appendChild(svg("text", { x: (L + R) / 2, y: h - 4, "text-anchor": "middle", class: "c-label" },
        stat === "chisq" ? "Pearson X²" : stat === "g" ? "G = 2 Σ O ln(O/E)" : "−ln P(table)  (larger = less probable)"));
      chart.appendChild(s);

      var exactP = stat === "chisq" ? res.pChisq : stat === "g" ? res.pG : res.pProb;
      var approx = stat === "chisq" ? res.pChisqApprox : stat === "g" ? res.pGApprox : null;
      var bf = E.bayesFactorDifferent(D.prePooled, obs);
      var isPaper = obs.join() === D.post.join();
      readout.appendChild(el("p", { class: "w-big", html: "Exact p = <strong>" + fmtP(exactP) + "</strong>" + (approx !== null ? " · chi-squared approximation " + fmtP(approx) : "") }));
      readout.appendChild(el("p", { html: "Enumerated all <strong>" + res.tables.toLocaleString("en-US") + "</strong> ways " + n + " campers can fill five boxes, each weighted by its multinomial probability under the no-change probabilities (" +
        p0.map(function (x) { return fix(x, 3); }).join(", ") + "). Exact p for all three orderings: X² " + fmtP(res.pChisq) + ", G " + fmtP(res.pG) + ", table probability " + fmtP(res.pProb) + "." }));
      readout.appendChild(el("p", { html: "Dirichlet-multinomial Bayes factor, different distributions before and after against one shared distribution (uniform priors): <strong>" + fmtRatio(bf) + "</strong>" +
        (bf < 1 ? " (it favors one shared distribution by " + fmtRatio(1 / bf) + " to 1)." : ".") }));
      if (isPaper) readout.appendChild(note("All three treat the before-camp probabilities as fixed and the after-camp answers as an independent sample. The same 17 campers answered both times; the paper reports only the pooled counts, so a paired analysis is not possible from the tables."));
    }
    function chiPdf(x, k) { return Math.exp((k / 2 - 1) * Math.log(x) - x / 2 - (k / 2) * Math.log(2) - E.lnGamma(k / 2)); }
    exactRedraw = draw;
    redraws.push(draw);
    draw();
  }

  /* ---------------------------------------------------------------- mount */

  function mount(id, fn) {
    var node = document.getElementById(id);
    if (!node) return;
    fn(node);
    node.classList.add("w-ready");
  }
  function init() {
    mount("sl-campers", mountCampers);
    mount("sl-prior", mountPrior);
    mount("sl-exact", mountExact);
    mount("sl-evidence", mountEvidence);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();

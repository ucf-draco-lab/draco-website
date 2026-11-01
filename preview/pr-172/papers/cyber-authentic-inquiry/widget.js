/*
  Authentic-inquiry widget for /papers/cyber-authentic-inquiry/.
  Mount points in the page: #ci-flow, #ci-design, #ci-matrix, #ci-groups.

  Demo 1 (hook) lines up the 12 groups by the project type they proposed and by
  what they delivered at a chosen checkpoint (Tables 1 and 3 to 6).
  Demo 2 draws the study: the course, its 33 students, and the five deliverables.
  Demo 3 draws each confusion matrix and the alignment across checkpoints; at the
  graduate and researcher levels it adds Cohen's kappa and an exact test (page's own).
  Demo 4 draws Table 2's group sizes; at the graduate and researcher levels it
  searches every split of students that reproduces Table 2 (page's own).
  Demos 1 to 3 share one checkpoint (state.cp) and one highlighted type (state.type).
  All arithmetic lives in ci-engine.js.
*/
(function () {
  "use strict";

  var E = window.CyberInquiryEngine;
  var D = E.DATA, T = E.TYPES;
  var SVGNS = "http://www.w3.org/2000/svg";
  var state = { cp: 0, type: null, side: "self", rounding: "nearest", total: 0 };

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
  var WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
  function words(n) { return n < 10 ? WORDS[n] : String(n); }
  function cap(t) { return t.charAt(0).toUpperCase() + t.slice(1); }
  function plural(n, one, many) { return words(n) + " " + (n === 1 ? one : many); }
  function sci(p) {
    if (p >= 0.001) return fix(p, 4);
    var e = Math.floor(Math.log(p) / Math.LN10), m = p / Math.pow(10, e);
    return fix(m, 2) + " × 10<sup>" + String(e).replace("-", "−") + "</sup>";
  }

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

  // Shared checkpoint and type pickers: every copy stays in sync.
  var cpControls = [], typeControls = [], shared = [];
  function setCp(v) { state.cp = Number(v); cpControls.forEach(function (c) { c.set(state.cp); }); shared.forEach(function (fn) { fn(); }); }
  function setType(v) { state.type = v === "none" ? null : v; typeControls.forEach(function (c) { c.set(state.type || "none"); }); shared.forEach(function (fn) { fn(); }); }
  function cpControl() {
    var c = segmented("Checkpoint", D.checkpoints.map(function (cp, i) {
      return { value: i, label: cp.short, title: cp.label + " (Table " + cp.table + ")" };
    }), state.cp, setCp);
    cpControls.push(c);
    return c;
  }
  function typeControl() {
    var opts = T.map(function (t) { return { value: t, label: E.SHORT[t], title: E.LABEL[t] }; });
    opts.push({ value: "none", label: "All" });
    var c = segmented("Project type", opts, state.type || "none", setType);
    typeControls.push(c);
    return c;
  }
  function typeName(t) { return E.LABEL[t].toLowerCase().replace("research & application", "research-and-application"); }

  /* ------------------------------------- demo 1: twelve groups, plan to product */

  // Order the 12 groups: by proposed type, then by delivered type at checkpoint.
  function groupsAt(cpIndex) {
    var M = D.checkpoints[cpIndex].M, out = [];
    for (var j = 0; j < 4; j++) for (var i = 0; i < 4; i++) for (var k = 0; k < M[i][j]; k++)
      out.push({ proposal: T[j], product: T[i] });
    return out;
  }

  function mountFlow(root) {
    var head = el("div", { class: "w-actions" }, [el("span", { class: "w-mono", text: "Checkpoint:" }), cpControl()]);
    var pick = el("div", { class: "w-actions" }, [el("span", { class: "w-mono", text: "Follow a type:" }), typeControl()]);
    var readout = el("p", { class: "w-big" });
    var detail = el("p", { class: "w-note" });
    var chart = el("div", { class: "ci-chart" });
    var legend = el("div", { class: "c-legend" });
    var src = el("p", { class: "w-source" });
    [head, pick, readout, chart, legend, detail, src].forEach(function (n) { root.appendChild(n); });

    function draw() {
      var cp = D.checkpoints[state.cp], groups = groupsAt(state.cp), a = E.agreement(cp.M);
      readout.innerHTML = "<strong>" + a.diag + " of 12</strong> groups handed in the kind of project they proposed at the " + cp.label.toLowerCase().replace(" (actual)", "") + " (" + Math.round(a.share * 100) + " percent).";
      if (cp.id === "actual") readout.innerHTML = "<strong>" + a.diag + " of 12</strong> groups' finished work matched the kind of project they proposed (" + Math.round(a.share * 100) + " percent), as the authors classified it.";

      var W = chartWidth(chart), rowH = 26, top = 34, H = top + 12 * rowH + 10;
      var side = W < 480 ? 90 : Math.max(110, W * 0.26);
      var xL = side, xR = W - side;
      var s = svg("svg", { class: "ci-svg", viewBox: "0 0 " + W + " " + H, role: "img",
        "aria-label": "Twelve groups: the project type each proposed, joined to what it delivered at the " + cp.label + "." });
      s.appendChild(svg("text", { x: xL + 6, y: 16, class: "c-label", "text-anchor": "end" }, "Proposed"));
      s.appendChild(svg("text", { x: xR - 6, y: 16, class: "c-label", "text-anchor": "start" }, (W < 480 ? "" : "Delivered · ") + cp.short));

      // right side: groups sorted by delivered type, keeping a stable order
      var right = groups.map(function (g, idx) { return { g: g, idx: idx }; }).sort(function (u, v) {
        return T.indexOf(u.g.product) - T.indexOf(v.g.product) || u.idx - v.idx;
      });
      var yR = {};
      right.forEach(function (r, pos) { yR[r.idx] = top + pos * rowH + rowH / 2; });

      // type labels at each side's block centre
      function blockLabels(side, key, x, anchor, ys) {
        T.forEach(function (t) {
          var ysT = [];
          groups.forEach(function (g, idx) { if (g[key] === t) ysT.push(ys(idx)); });
          if (!ysT.length) return;
          var y = (Math.min.apply(null, ysT) + Math.max.apply(null, ysT)) / 2 + 4;
          var lab = W < 480 ? E.SHORT[t] : E.LABEL[t];
          s.appendChild(svg("text", { x: x, y: y, class: "c-label ci-type-" + t + (state.type && state.type !== t ? " ci-dim" : ""), "text-anchor": anchor }, lab + " (" + ysT.length + ")"));
        });
      }
      blockLabels("L", "proposal", xL - 14, "end", function (idx) { return top + idx * rowH + rowH / 2; });
      blockLabels("R", "product", xR + 14, "start", function (idx) { return yR[idx]; });

      groups.forEach(function (g, idx) {
        var y1 = top + idx * rowH + rowH / 2, y2 = yR[idx], same = g.proposal === g.product;
        var on = !state.type || g.proposal === state.type || g.product === state.type;
        var mid = (xL + xR) / 2;
        s.appendChild(svg("path", {
          d: "M" + xL + " " + y1 + " C" + mid + " " + y1 + " " + mid + " " + y2 + " " + xR + " " + y2,
          class: "ci-link " + (same ? "ci-same" : "ci-diff") + (on ? "" : " ci-dim")
        }));
        s.appendChild(svg("circle", { cx: xL, cy: y1, r: 6, class: "ci-dot ci-type-" + g.proposal + (on ? "" : " ci-dim") }));
        s.appendChild(svg("circle", { cx: xR, cy: y2, r: 6, class: "ci-dot ci-type-" + g.product + (on ? "" : " ci-dim") }));
      });
      chart.innerHTML = "";
      chart.appendChild(s);

      legend.innerHTML = "";
      T.forEach(function (t) {
        legend.appendChild(el("span", { class: "ci-lg" }, [el("span", { class: "ci-sw ci-type-" + t }), E.LABEL[t]]));
      });
      legend.appendChild(el("span", { class: "ci-lg" }, [el("span", { class: "ci-line ci-same" }), "matches the proposal"]));
      legend.appendChild(el("span", { class: "ci-lg" }, [el("span", { class: "ci-line ci-diff" }), "differs"]));

      // what happened to the followed type
      var t = state.type;
      if (!t) {
        var moved = [];
        groups.forEach(function (g) { if (g.proposal !== g.product) moved.push(g); });
        detail.innerHTML = moved.length
          ? cap(words(moved.length)) + " groups delivered something other than what they proposed: " + summarize(moved) + ". Pick a type above to follow it."
          : "Every group delivered what it proposed.";
      } else {
        var prop = groups.filter(function (g) { return g.proposal === t; });
        var got = groups.filter(function (g) { return g.product === t; });
        var txt = "";
        if (!prop.length) txt = "No group proposed " + ONE[t] + ". ";
        else {
          var kept = prop.filter(function (g) { return g.product === t; }).length;
          txt = cap(plural(prop.length, "group", "groups")) + " proposed " + MANY[t] + "; " + (kept === 0 ? "none" : words(kept)) + " stayed on plan at this checkpoint";
          var other = prop.filter(function (g) { return g.product !== t; });
          txt += other.length ? ", and " + summarize(other, true) + ". " : ". ";
        }
        txt += cap(plural(got.length, "group", "groups")) + " delivered " + (got.length === 1 ? ONE[t] : MANY[t]) + " at this checkpoint.";
        detail.innerHTML = txt;
      }
      src.textContent = "Paper, Tables 1 and " + cp.table + " · 12 self-selected groups, 33 students · individual groups are not named in the paper; the page orders them by type";
    }

    var ONE = { app: "an application", res: "a research project", mix: "a research-and-application project", lit: "a literature survey" };
    var MANY = { app: "applications", res: "research projects", mix: "research-and-application projects", lit: "literature surveys" };
    function summarize(list, productOnly) {
      var counts = {};
      list.forEach(function (g) {
        var k = productOnly ? g.product : g.proposal + ">" + g.product;
        counts[k] = (counts[k] || 0) + 1;
      });
      return Object.keys(counts).map(function (k) {
        var n = counts[k];
        if (productOnly) return words(n) + " delivered " + (n === 1 ? ONE[k] : MANY[k]);
        var p = k.split(">");
        return words(n) + " " + typeName(p[0]) + " " + (n === 1 ? "proposal" : "proposals") + " became " + (n === 1 ? ONE[p[1]] : MANY[p[1]]);
      }).join(productOnly ? ", " : "; ");
    }

    shared.push(draw);
    redraws.push(draw);
    draw();
  }

  /* ------------------------------------------------------- demo 2: the study */

  function mountDesign(root) {
    var head = el("div", { class: "w-actions" }, [el("span", { class: "w-mono", text: "Checkpoint:" }), cpControl()]);
    var chart = el("div", { class: "ci-chart" });
    var note = el("p", { class: "w-note" });
    var people = el("div", { class: "ci-chart" });
    var plist = el("ul", { class: "ci-rows" });
    var src = el("p", { class: "w-source" });
    [head, chart, note, people, plist, src].forEach(function (n) { root.appendChild(n); });

    var STEPS = [
      { id: "proposal", label: "Proposal", text: "Groups formed themselves (no size limit) and proposed a problem, an approach, a definition of done, and prior work. Two weeks." },
      { id: "midterm", cp: 0, label: "Midterm report", text: "Conference-paper outline on a LaTeX template: executive summary, accomplishments and remaining work, obstacles, results, and references." },
      { id: "final", cp: 1, label: "Final report", text: "The same outline, completed. A peer report on the division of labor followed and could adjust report and poster grades." },
      { id: "poster", cp: 2, label: "Poster and pitch", text: "Last class day, faculty invited from across campus: a one-minute pitch per group, then three 15-minute poster sessions." },
      { id: "actual", cp: 3, label: "Authors' reading", text: "After the course, the authors classified what each group had actually produced." }
    ];

    function draw() {
      var W = chartWidth(chart), H = 104, x0 = 12, x1 = W - 12;
      var xProp = x0 + (x1 - x0) * 0.2; // proposal phase: 2 of 10 weeks
      var s = svg("svg", { class: "ci-svg", viewBox: "0 0 " + W + " " + H, role: "img",
        "aria-label": "Timeline: two weeks for the proposal, then eight weeks (one of them spring break) for the project, with the midterm report, final report, and poster session." });
      s.appendChild(svg("rect", { x: x0, y: 40, width: xProp - x0, height: 14, class: "ci-phase-a" }));
      s.appendChild(svg("rect", { x: xProp, y: 40, width: x1 - xProp, height: 14, class: "ci-phase-b" }));
      s.appendChild(svg("text", { x: x0, y: 30, class: "c-tick" }, "2 weeks"));
      s.appendChild(svg("text", { x: x1, y: 30, class: "c-tick", "text-anchor": "end" }, "8 weeks, one of them spring break"));
      var xs = [x0 + 4, xProp + (x1 - xProp) * 0.42, xProp + (x1 - xProp) * 0.86, x1 - 4, null];
      STEPS.forEach(function (st, i) {
        if (xs[i] === null) return;
        var on = st.cp === state.cp;
        var g = svg("g", { class: "ci-step" + (on ? " is-on" : ""), tabindex: st.cp === undefined ? -1 : 0, role: st.cp === undefined ? "img" : "button", "aria-label": st.label });
        var anchorX = i === 0 ? xs[i] : i === 3 ? xs[i] - 90 : xs[i] - 45;
        g.appendChild(svg("rect", { x: anchorX, y: 32, width: 90, height: 72, class: "ci-hit" }));
        g.appendChild(svg("line", { x1: xs[i], x2: xs[i], y1: 36, y2: 64, class: "ci-tickline" }));
        g.appendChild(svg("circle", { cx: xs[i], cy: 47, r: on ? 8 : 6, class: "ci-mark" }));
        var anchor = i === 0 ? "start" : i === 3 ? "end" : "middle";
        var lab = W < 480 ? st.label.split(" ")[0] : st.label;
        g.appendChild(svg("text", { x: xs[i], y: 82 + (i % 2) * 16, class: "c-label", "text-anchor": anchor }, lab));
        if (st.cp !== undefined) {
          g.addEventListener("click", function () { setCp(st.cp); });
          g.addEventListener("keydown", function (ev) { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); setCp(st.cp); } });
        }
        s.appendChild(g);
      });
      chart.innerHTML = "";
      chart.appendChild(s);
      var cur = STEPS.filter(function (st) { return st.cp === state.cp; })[0];
      note.innerHTML = "<strong>" + cur.label + ".</strong> " + cur.text + "<br><strong>Before it, the proposal.</strong> " + STEPS[0].text + "<br>The paper does not give due weeks inside the eight; the marks show order only.";

      // people bar: 33 students by standing
      var Wp = chartWidth(people), Hp = 64, px0 = 12, px1 = Wp - 12, n = D.students;
      var sp = svg("svg", { class: "ci-svg", viewBox: "0 0 " + Wp + " " + Hp, role: "img", "aria-label": "33 students: 2 sophomores, 6 juniors, 25 seniors." });
      var x = px0, parts = [["sophomore", "Sophomores", "ci-so"], ["junior", "Juniors", "ci-jr"], ["senior", "Seniors", "ci-sr"]];
      parts.forEach(function (p, i) {
        var w = (px1 - px0) * D.standing[p[0]] / n;
        sp.appendChild(svg("rect", { x: x, y: 8, width: Math.max(1, w - 1), height: 22, class: p[2] }));
        var lab = D.standing[p[0]] + " " + (Wp < 480 && i < 2 ? p[1].slice(0, 2) + "." : p[1].toLowerCase());
        sp.appendChild(svg("text", { x: i === 0 ? x : i === 1 ? x + w / 2 : x + w - 2, y: 48 + (i === 1 ? 12 : 0), class: "c-label", "text-anchor": i === 0 ? "start" : i === 1 ? "middle" : "end" }, lab));
        x += w;
      });
      people.innerHTML = "";
      people.appendChild(sp);
    }

    plist.innerHTML = "";
    [
      "33 students in one three-credit, upper-level computer security elective at the University of Wyoming; prerequisites were foundational computer science courses only.",
      "25 of the 33 (76 percent) were also in their senior capstone; three (9 percent) were non-traditional students.",
      "Topics, in order: ethics, threat models, cryptography, Internet of Things attacks and defense, binary exploits, penetration testing, malware and ransomware, authentication, network security, botnets, cyber-warfare, critical infrastructure (healthcare and transportation), and hardware security.",
      "Grades came mostly from three kinds of work (synthesis, applications, and the inquiry project), with a few points for attendance and participation."
    ].forEach(function (t) { plist.appendChild(el("li", { text: t })); });
    src.textContent = "Paper, Methods & Participants · semester and grading weights are not stated";

    shared.push(draw);
    redraws.push(draw);
    draw();
  }

  /* ------------------------------------------- demo 3: plan against product */

  var exactCache = {};
  function exact(i) { if (!exactCache[i]) exactCache[i] = E.exactAgreement(D.checkpoints[i].M); return exactCache[i]; }

  function mountMatrix(root) {
    var head = el("div", { class: "w-actions" }, [el("span", { class: "w-mono", text: "Checkpoint:" }), cpControl()]);
    var tableWrap = el("div", { class: "ci-table-scroll" });
    var readout = el("p", { class: "w-big" });
    var trend = el("div", { class: "ci-chart" });
    var stats = el("div", { class: "ci-stats", "data-levels": "grad res" });
    var src = el("p", { class: "w-source" });
    [head, readout, tableWrap, trend, stats, src].forEach(function (n) { root.appendChild(n); });

    function draw() {
      var cp = D.checkpoints[state.cp], M = cp.M, a = E.agreement(M);
      readout.innerHTML = "Diagonal: <strong>" + a.diag + " of " + a.n + "</strong> groups (" + Math.round(a.share * 100) + " percent), as printed in Table " + cp.table + ".";

      var h = "<table class=\"ci-matrix\"><caption class=\"w-note\">Table " + cp.table + ": rows are what groups delivered (" + cp.label.toLowerCase() + "), columns what they proposed. Shaded cells are matches.</caption><thead><tr><th scope=\"col\">Delivered ↓ · Proposed →</th>";
      T.forEach(function (t) { h += "<th scope=\"col\" class=\"" + (state.type === t ? "is-on" : "") + "\">" + E.SHORT[t] + "</th>"; });
      h += "<th scope=\"col\">Total</th></tr></thead><tbody>";
      for (var i = 0; i < 4; i++) {
        h += "<tr class=\"" + (state.type === T[i] ? "is-on" : "") + "\"><th scope=\"row\">" + E.LABEL[T[i]] + "</th>";
        for (var j = 0; j < 4; j++) {
          var shown = (cp.id === "midterm" && i === 0 && j === 2) ? "–" : String(M[i][j]);
          h += "<td class=\"" + (i === j ? "ci-diag" : M[i][j] ? "ci-off" : "") + "\">" + shown + "</td>";
        }
        h += "<td>" + a.rows[i] + "</td></tr>";
      }
      h += "<tr class=\"ci-tot\"><th scope=\"row\">Total</th>";
      a.cols.forEach(function (c) { h += "<td>" + c + "</td>"; });
      h += "<td>" + a.n + "</td></tr></tbody></table>";
      if (cp.id === "midterm") h += "<p class=\"w-note\">The paper prints a dash in the Application row, Research &amp; Application column; the row total of six makes it zero.</p>";
      tableWrap.innerHTML = h;

      // trend across checkpoints
      var W = chartWidth(trend), H = 170, l = 44, r = 16, t = 16, b = 40;
      var showK = /grad|res/.test(currentLevel());
      var s = svg("svg", { class: "ci-svg", viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": "Share of groups whose product matched their proposal at each checkpoint: 50, 75, 75, and 75 percent." });
      for (var g = 0; g <= 100; g += 25) {
        var y = t + (H - t - b) * (1 - g / 100);
        s.appendChild(svg("line", { x1: l, x2: W - r, y1: y, y2: y, class: "c-grid" }));
        s.appendChild(svg("text", { x: l - 6, y: y + 4, class: "c-tick", "text-anchor": "end" }, g + "%"));
      }
      var xs = D.checkpoints.map(function (_, k) { return l + (W - l - r) * (k + 0.5) / 4; });
      function line(vals, cls) {
        var d = vals.map(function (v, k) { return (k ? "L" : "M") + xs[k] + " " + (t + (H - t - b) * (1 - v)); }).join(" ");
        s.appendChild(svg("path", { d: d, class: cls }));
        vals.forEach(function (v, k) {
          s.appendChild(svg("circle", { cx: xs[k], cy: t + (H - t - b) * (1 - v), r: k === state.cp ? 6 : 4, class: cls + "-dot" }));
        });
      }
      line(D.checkpoints.map(function (c) { return E.agreement(c.M).share; }), "ci-trend");
      if (showK) line(D.checkpoints.map(function (c, k) { return exact(k).expectedDiag / 12; }), "ci-chance");
      D.checkpoints.forEach(function (c, k) {
        s.appendChild(svg("text", { x: xs[k], y: H - b + 18, class: "c-label", "text-anchor": "middle" }, c.short));
        var hit = svg("rect", { x: xs[k] - (W - l - r) / 8, y: t, width: (W - l - r) / 4, height: H - t - b + 24, class: "ci-hit" });
        hit.addEventListener("click", function () { setCp(k); });
        s.appendChild(hit);
      });
      trend.innerHTML = "";
      trend.appendChild(s);
      var lg = el("div", { class: "c-legend" }, [el("span", { class: "ci-lg" }, [el("span", { class: "ci-line ci-same" }), "matched the proposal (paper)"])]);
      if (showK) lg.appendChild(el("span", { class: "ci-lg" }, [el("span", { class: "ci-line ci-chance-sw" }), "expected by chance with the same totals (page)"]));
      trend.appendChild(lg);

      // graduate and researcher statistics (page's own)
      var x = exact(state.cp);
      var rows = D.checkpoints.map(function (c, k) {
        var ak = E.agreement(c.M), xk = exact(k);
        return "<tr class=\"" + (k === state.cp ? "is-on" : "") + "\"><td>" + c.label + " (T" + c.table + ")</td><td>" + ak.diag + "/12</td><td>" + fix(xk.expectedDiag, 2) + "</td><td>" + fix(ak.kappa, 3) + "</td><td>" + xk.tables + "</td><td>" + sci(xk.p) + "</td></tr>";
      }).join("");
      stats.innerHTML = "<p class=\"w-note\">Computed by this page from the printed tables (not in the paper). Cohen's kappa corrects the diagonal for agreement expected from the row and column totals alone. The exact test lists every 4 × 4 table with the same totals, weights each by its probability when products are assigned to proposals at random, and adds the probability of a diagonal at least as large as the printed one.</p>" +
        "<div class=\"ci-table-scroll\"><table class=\"results-table\"><thead><tr><th>Checkpoint</th><th>Matches (paper)</th><th>Expected by chance</th><th>Kappa</th><th>Tables with these totals</th><th>Exact p, one-sided</th></tr></thead><tbody>" + rows + "</tbody></table></div>" +
        distChart(x);
      src.textContent = "Paper, Tables 3 to 6 · n = 12 groups at every checkpoint" + (showK ? " · kappa, chance line, and exact test: this page" : "");
    }

    function distChart(x) {
      var keys = Object.keys(x.dist).map(Number).sort(function (a, b) { return a - b; });
      var W = chartWidth(stats) || 600, H = 140, l = 44, r = 12, t = 12, b = 34;
      var maxP = Math.max.apply(null, keys.map(function (k) { return x.dist[k]; }));
      var s = "<svg class=\"ci-svg\" viewBox=\"0 0 " + W + " " + H + "\" role=\"img\" aria-label=\"Chance distribution of the number of matches with the same totals; observed " + x.observed + "\">";
      var bw = (W - l - r) / 13;
      for (var d = 0; d <= 12; d++) {
        var p = x.dist[d] || 0, hgt = (H - t - b) * p / maxP, xx = l + d * bw;
        s += "<rect x=\"" + (xx + 2) + "\" y=\"" + (H - b - hgt) + "\" width=\"" + (bw - 4) + "\" height=\"" + hgt + "\" class=\"" + (d >= x.observed ? "ci-tail" : "ci-bar") + "\"></rect>";
        if (d % 2 === 0 || W > 520) s += "<text x=\"" + (xx + bw / 2) + "\" y=\"" + (H - b + 14) + "\" class=\"c-tick\" text-anchor=\"middle\">" + d + "</text>";
      }
      s += "<text x=\"" + l + "\" y=\"" + (H - 4) + "\" class=\"c-label\">Matches out of 12 if products were shuffled among the groups (page); shaded: " + x.observed + " or more</text></svg>";
      return s;
    }

    shared.push(draw);
    redraws.push(draw);
    draw();
  }

  function currentLevel() {
    var paper = document.querySelector(".paper[data-level]");
    return paper ? paper.getAttribute("data-level") : "public";
  }

  /* ------------------------------------------------------ demo 4: group sizes */

  function mountGroups(root) {
    var head = el("div", { class: "w-actions" }, [el("span", { class: "w-mono", text: "Project type by:" }),
      segmented("Classification", [{ value: "self", label: "Proposal (self-identified)" }, { value: "actual", label: "Product (actual)" }], state.side, function (v) { state.side = v; draw(); })]);
    var readout = el("p", { class: "w-big" });
    var chart = el("div", { class: "ci-chart" });
    var src = el("p", { class: "w-source" });
    var search = el("div", { class: "ci-search", "data-levels": "grad res" });
    [head, readout, chart, src, search].forEach(function (n) { root.appendChild(n); });

    var rule = segmented("Rounding", [{ value: "nearest", label: "Round to nearest" }, { value: "truncate", label: "Truncate" }], state.rounding, function (v) { state.rounding = v; drawSearch(); });
    var tot = segmented("Class size", [{ value: 0, label: "Any total" }, { value: 32, label: "32" }, { value: 33, label: "33" }], state.total, function (v) { state.total = Number(v); drawSearch(); });
    var sOut = el("div");
    search.appendChild(el("h3", { class: "ci-sub", text: "Rebuilding the groups (page)" }));
    search.appendChild(el("p", { class: "w-note", html: "Table 6 says which proposals became which products, so the 12 groups fall into five cells. The page tries every number of students in each cell (one to eight per group) and keeps the splits whose averages, by proposal and by product, print as Table 2's." }));
    search.appendChild(el("div", { class: "w-actions" }, [el("span", { class: "w-mono", text: "Printed averages:" }), rule]));
    search.appendChild(el("div", { class: "w-actions" }, [el("span", { class: "w-mono", text: "Students in groups:" }), tot]));
    search.appendChild(sOut);

    function draw() {
      var side = state.side, vals = D.t2[side], counts = D.t1[side];
      var W = chartWidth(chart), rowH = 34, l = W < 480 ? 64 : 170, r = 56, t = 6, H = t + 4 * rowH + 26;
      var s = svg("svg", { class: "ci-svg", viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": "Average students per group by project type, " + (side === "self" ? "self-identified" : "actual") + ", Table 2." });
      var max = 4;
      for (var g = 0; g <= max; g++) {
        var x = l + (W - l - r) * g / max;
        s.appendChild(svg("line", { x1: x, x2: x, y1: t, y2: t + 4 * rowH, class: "c-grid" }));
        s.appendChild(svg("text", { x: x, y: t + 4 * rowH + 16, class: "c-tick", "text-anchor": "middle" }, String(g)));
      }
      T.forEach(function (ty, i) {
        var y = t + i * rowH;
        var w = (W - l - r) * vals[ty] / max;
        s.appendChild(svg("text", { x: l - 8, y: y + rowH / 2 + 4, class: "c-label", "text-anchor": "end" }, (W < 480 ? E.SHORT[ty] : E.LABEL[ty])));
        s.appendChild(svg("rect", { x: l, y: y + 7, width: Math.max(0, w), height: rowH - 14, class: "ci-type-" + ty + "-fill" }));
        s.appendChild(svg("text", { x: l + w + 6, y: y + rowH / 2 + 4, class: "ci-val" }, counts[ty] ? fix(vals[ty], 1) + " · " + counts[ty] + (counts[ty] === 1 ? " group" : " groups") : "no groups"));
      });
      chart.innerHTML = "";
      chart.appendChild(s);
      if (side === "self") readout.innerHTML = "Proposed application groups averaged <strong>3.6</strong> students; proposed research groups, <strong>1.8</strong>. That is the paper's \"double.\"";
      else readout.innerHTML = "By what they delivered, application groups still averaged <strong>3.6</strong>; the two groups that finished research projects had <strong>one student each</strong>.";
      src.textContent = "Paper, Tables 1 and 2 · average students per group, printed to one decimal · 12 groups";
    }

    function drawSearch() {
      var res = E.groupSizes({ rounding: state.rounding, total: state.total || undefined, maxSize: 8 });
      var cells = res.cells, h = "";
      if (!res.solutions.length) {
        h = "<p class=\"w-big\"><strong>No split</strong> of students reproduces Table 2 " + (state.rounding === "truncate" ? "when averages are truncated" : "") + (state.total ? (state.rounding === "truncate" ? " and" : "") + " with " + state.total + " students in groups" : "") + ".</p>";
      } else {
        h = "<p class=\"w-big\"><strong>" + (res.solutions.length === 1 ? "Exactly one split" : res.solutions.length + " splits") + "</strong> reproduce" + (res.solutions.length === 1 ? "s" : "") + " Table 2: <strong>" + res.solutions[0].total + " students</strong> in the 12 groups.</p>";
        h += "<div class=\"ci-table-scroll\"><table class=\"results-table\"><thead><tr><th>Proposed</th><th>Delivered (actual)</th><th>Groups</th><th>Students (page)</th></tr></thead><tbody>";
        cells.forEach(function (c, k) {
          h += "<tr><td>" + E.LABEL[c.proposal] + "</td><td>" + E.LABEL[c.product] + "</td><td>" + c.groups + "</td><td>" + res.solutions.map(function (sol) { return sol.sums[k]; }).join(", ") + "</td></tr>";
        });
        h += "</tbody></table></div>";
      }
      h += "<p class=\"w-note\">The paper reports 33 students and an average group of 2.7. Twelve groups of 33 average 2.75, which rounds to 2.8; 32 students average 2.67, which rounds to 2.7. Search space: every cell total from one to eight students per group, " + ruleText() + ".</p>";
      sOut.innerHTML = h;
    }
    function ruleText() { return state.rounding === "truncate" ? "averages cut after one decimal" : "averages rounded to the nearest tenth"; }

    redraws.push(draw);
    draw();
    drawSearch();
  }

  /* ------------------------------------------------------------------ mount */

  function mount(id, fn) {
    var node = document.getElementById(id);
    if (!node) return;
    node.innerHTML = "";
    fn(node);
    node.classList.add("w-ready");
  }
  function init() {
    mount("ci-flow", mountFlow);
    mount("ci-design", mountDesign);
    mount("ci-matrix", mountMatrix);
    mount("ci-groups", mountGroups);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();

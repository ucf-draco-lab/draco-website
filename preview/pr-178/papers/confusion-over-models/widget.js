/*
  Modeling-discourse widget for /papers/confusion-over-models/.
  Mount points in the page: #cm-sort, #cm-design, #cm-shift, #cm-follow.

  Demo 1 asks the reader to code teachers' own words the way the authors did
         (computer or conceptual model, or "I do, we do, you do"), then lists the
         five meanings of "model" the paper names.
  Demo 2 walks the study: who came (Tables 1 and 2), the PD, and each checkpoint
         with its number of respondents.
  Demo 3 draws the coded definitions before, during, and after the PD (Findings),
         with an exact test of the pre/post shift at graduate and researcher levels.
  Demo 4 follows the year after the PD (email reflections) and shows how the
         follow-through rate depends on the 15 teachers who did not answer.
  All arithmetic lives in cm-engine.js.
*/
(function () {
  "use strict";

  var E = window.ModelsEngine;
  var SVGNS = "http://www.w3.org/2000/svg";

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
    setTimeout(function () { redraws.forEach(function (fn) { fn(); }); }, 0);
  });

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

  function note(html, levels) {
    var p = el("p", { class: "w-note", html: html });
    if (levels) p.setAttribute("data-levels", levels);
    return p;
  }

  function pct(x, d) { return (100 * x).toFixed(d === undefined ? 0 : d) + "%"; }
  function words(n) {
    var w = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
    return n < 10 ? w[n] : String(n);
  }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  var CODE_CLASS = { comp: "cm-c", idwd: "cm-i", proj: "cm-p" };

  /* ---------------------------------------------------------------- demo 1: code the words */

  // Teachers' words as quoted in the paper (author manuscript, NSF PAR 10404278),
  // with the code and data source the paper gives. "…" marks a quote shortened here.
  var QUOTES = [
    { text: "When I think of modeling, I think of systems and physical or mathematical representations of real-world phenomena.", code: "comp", src: "Pre-survey" },
    { text: "When I think of modeling in the classroom, I think of the classic approach of I do, we do, you do.", code: "idwd", src: "Pre-survey" },
    { text: "The kids were studying wildlife issues in [state] and they created models in NetLogo …", code: "comp", src: "Pre-survey" },
    { text: "This approach can be used in any situation with teaching be it modeling behavior, reading strategies …", code: "idwd", src: "Pre-survey" },
    { text: "There's modeling where I go up and show them how something is actually done …", code: "idwd", src: "Interview" },
    { text: "Let's say you're doing like the Ideal Gas Law. So, you can start to manipulate these variables in a simulation …", code: "comp", src: "Interview" },
    { text: "You're talking about vast systems of looking at large amounts of data and running it through processes …", code: "comp", src: "Interview" },
    { text: "I envision demonstration. I demonstrate proper tone production, etc., all the time.", code: "idwd", src: "Post-survey" },
    { text: "Modeling is a representation of evidence, or novel approaches to visualized problem/solutions/inquiry.", code: "comp", src: "Post-survey" },
    { text: "Teacher (usually) demonstrating a skill, procedure, or finished project.", code: "idwd", src: "Post-survey" },
    { text: "… creating situations – physically or on a computer – that allows students to conceptualize big pictures …", code: "comp", src: "Post-survey" }
  ];

  var MEANINGS = [
    { name: "Computer science data models", body: "A program that represents a system so it can be run, tested, and changed: a simulation, an agent-based model, a model trained on data. This is what the PD's computer science faculty meant.", coded: "comp" },
    { name: "Teacher modeling practice", body: "“I do, we do, you do”: the teacher demonstrates, the class practices together, then students work alone. Rooted in literacy instruction and social learning theory.", coded: "idwd" },
    { name: "Teaching and framework models", body: "Models of learning, process, concepts, logic, or change: frameworks that describe how teaching or learning works.", coded: null },
    { name: "Role models", body: "People whose example represents what students could become; the paper groups representation from individuals here.", coded: null },
    { name: "Project, curricular, and other models", body: "Exemplars: a finished project, a model lesson, or a curriculum to follow.", coded: "proj" }
  ];

  function mountSort(root) {
    var order = QUOTES.map(function (_, i) { return i; });
    var state = { i: 0, answers: {} };

    var counter = el("p", { class: "w-mono" });
    var quote = el("blockquote", { class: "cm-quote" });
    var src = el("p", { class: "w-source" });
    var choices = el("div", { class: "w-actions" });
    var verdict = el("p", { class: "w-big", "aria-live": "polite" });
    var nav = el("div", { class: "w-actions" });
    var tally = el("div", { class: "cm-rows" });

    root.appendChild(el("p", { class: "w-source", text: "Paper, Findings: teachers' own words about modeling, with the code the authors gave each" }));
    root.appendChild(counter);
    root.appendChild(quote);
    root.appendChild(src);
    root.appendChild(choices);
    root.appendChild(verdict);
    root.appendChild(nav);
    root.appendChild(tally);

    var options = [
      { key: "comp", label: "A computer or conceptual model" },
      { key: "idwd", label: "Teaching by example (I do, we do, you do)" }
    ];
    var btns = options.map(function (o) {
      var b = el("button", { type: "button", class: "w-btn w-btn-quiet", text: o.label });
      b.addEventListener("click", function () { state.answers[state.i] = o.key; draw(); });
      choices.appendChild(b);
      return b;
    });
    var prev = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "Previous" });
    var next = el("button", { type: "button", class: "w-btn", text: "Next quote" });
    var reset = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "Start over" });
    prev.addEventListener("click", function () { state.i = Math.max(0, state.i - 1); draw(); });
    next.addEventListener("click", function () { state.i = Math.min(order.length - 1, state.i + 1); draw(); });
    reset.addEventListener("click", function () { state.i = 0; state.answers = {}; draw(); });
    nav.appendChild(prev); nav.appendChild(next); nav.appendChild(reset);

    var mean = el("div", { class: "cm-meanings" });
    root.appendChild(el("p", { class: "w-mono cm-mhead", text: "Five meanings of “model” the paper names (Figure 1)" }));
    MEANINGS.forEach(function (m, k) {
      var tag = m.coded ? E.CODES.filter(function (c) { return c.key === m.coded; })[0].short : "not among the survey codes";
      mean.appendChild(el("div", { class: "cm-mrow" }, [
        el("span", { class: "cm-mnum", text: String(k + 1) }),
        el("span", { class: "cm-mname", text: m.name }),
        el("span", { class: "cm-mbody", text: m.body }),
        el("span", { class: "cm-mtag " + (m.coded ? CODE_CLASS[m.coded] + "-t" : ""), text: m.coded ? "Survey code: " + tag : "Not one of the three codes" })
      ]));
    });
    root.appendChild(mean);
    root.appendChild(note("The surveys were coded into three of these meanings. Faculty used the first; teachers most often used the second. The paper quotes no teacher for the projects code, so it does not appear in the quiz.", "ug grad res"));

    function draw() {
      var q = QUOTES[order[state.i]];
      counter.textContent = "Quote " + (state.i + 1) + " of " + order.length;
      quote.textContent = "“" + q.text + "”";
      var a = state.answers[state.i];
      src.textContent = a ? "Source: " + q.src : "Which meaning of modeling is this teacher using?";
      btns.forEach(function (b, k) {
        b.setAttribute("aria-pressed", a === options[k].key ? "true" : "false");
        b.className = "w-btn " + (a === options[k].key ? "" : "w-btn-quiet");
      });
      if (!a) verdict.textContent = "";
      else {
        var codeName = q.code === "comp" ? "a computer or conceptual model" : "teaching by example (I do, we do, you do)";
        verdict.textContent = (a === q.code ? "Same as the authors: " : "The authors coded this as ") + codeName + ".";
      }
      prev.disabled = state.i === 0;
      next.disabled = state.i === order.length - 1;

      var done = Object.keys(state.answers).length, agree = 0, byCode = { comp: 0, idwd: 0 };
      Object.keys(state.answers).forEach(function (k) {
        if (state.answers[k] === QUOTES[order[k]].code) agree++;
        byCode[state.answers[k]]++;
      });
      tally.innerHTML = "";
      tally.appendChild(el("div", { class: "cm-row" }, [
        el("span", { class: "cm-row-name", text: "You coded" }),
        el("span", { class: "cm-row-val", text: done + " of " + order.length + " quotes" }),
        el("span", { class: "cm-row-pct", text: done ? agree + " match" : "" })
      ]));
      tally.appendChild(el("div", { class: "cm-row" }, [
        el("span", { class: "cm-row-name cm-c-t", text: "Computer model" }),
        el("span", { class: "cm-row-val", text: "you " + byCode.comp + ", authors " + QUOTES.filter(function (x) { return x.code === "comp"; }).length }),
        el("span", { class: "cm-row-pct", text: "" })
      ]));
      tally.appendChild(el("div", { class: "cm-row" }, [
        el("span", { class: "cm-row-name cm-i-t", text: "I do, we do, you do" }),
        el("span", { class: "cm-row-val", text: "you " + byCode.idwd + ", authors " + QUOTES.filter(function (x) { return x.code === "idwd"; }).length }),
        el("span", { class: "cm-row-pct", text: "" })
      ]));
    }
    draw();
  }

  /* ---------------------------------------------------------------- demo 2: the study */

  var STEPS = [
    { tag: "Recruit", title: "A statewide call brings 40 teachers", when: "2018", n: "40 teachers, 19 districts",
      body: "Teachers chose to apply (self-selection). They taught from elementary school through high school and across subjects, from science and library to industrial arts and welding. The state had set the 2022–23 school year as the deadline for computer science in its schools." },
    { tag: "Checkpoint", title: "Pre-survey: what do you picture when you hear modeling?", when: "Start of the PD", n: "40 instances coded",
      body: "Two open-ended questions: what participants envision when they think of modeling in the classroom, and an example of modeling they had used or seen." },
    { tag: "PD", title: "RAMPED: two full weeks, four modeling sessions", when: "Summer 2018, 80+ hours", n: "40 teachers",
      body: "Computer science faculty led four sessions built around models: machine learning, anomaly detection, large astronomical distances, and virtual reality. The PD offered free, existing lessons teachers could adapt rather than ready-to-teach packets, and the team presented computer science as problem solving, with coding as one tool." },
    { tag: "Checkpoint", title: "Interviews during the PD", when: "Summer 2018", n: "14 teachers, 10 to 20 minutes each",
      body: "Questions on computer science and coding, integrating STEM subjects, and modeling. Ten women and four men were interviewed." },
    { tag: "Checkpoint", title: "Post-survey: the same questions", when: "Last day of the PD", n: "36 teachers, 39 instances",
      body: "Four participants did not complete it. Some answers held more than one definition, so the paper counts instances rather than people." },
    { tag: "Follow-up", title: "A school year of support", when: "2018–19", n: "40 teachers invited",
      body: "Faculty offered to co-lead lessons and to give just-in-time video feedback. The opening of the paper records one faculty member's worry at the end of the year: few teachers had asked for modeling or computer science support." },
    { tag: "Checkpoint", title: "Email reflections", when: "End of the yearlong PD", n: "25 of 40 answered",
      body: "Teachers reported what they had brought into their classrooms, how often, and how it went." }
  ];

  function mountDesign(root) {
    var state = { step: 2, table: "grades" };
    var list = el("div", { class: "cm-steps" });
    root.appendChild(el("p", { class: "w-source", text: "Paper, Methods and Findings: the study's steps, with the number of teachers at each" }));
    root.appendChild(list);

    function drawSteps() {
      list.innerHTML = "";
      STEPS.forEach(function (s, k) {
        var on = k === state.step;
        var row = el("button", { type: "button", class: "cm-srow" + (on ? " cm-srow-on" : ""), "aria-expanded": on ? "true" : "false" }, [
          el("span", { class: "cm-snum", text: String(k + 1) }),
          el("span", { class: "cm-stitle" }, [el("span", { class: "cm-tag", text: s.tag + " " }), s.title]),
          el("span", { class: "cm-swhen", text: s.when })
        ]);
        row.addEventListener("click", function () { state.step = k; drawSteps(); });
        list.appendChild(row);
        if (on) list.appendChild(el("div", { class: "cm-sbody" }, [
          el("p", { text: s.body }),
          el("p", { class: "w-mono", text: "n: " + s.n })
        ]));
      });
    }
    drawSteps();

    root.appendChild(el("p", { class: "w-mono cm-mhead", text: "Who came (Table 1, 40 teachers)" }));
    var seg = segmented("Table 1 grouping", [
      { value: "grades", label: "Grades" }, { value: "subjects", label: "Subjects" }, { value: "gender", label: "Gender" }
    ], state.table, function (v) { state.table = v; drawTable(); });
    root.appendChild(el("div", { class: "w-actions" }, [seg]));
    var chart = el("div", { class: "cm-chart" });
    root.appendChild(chart);
    root.appendChild(note("Table 2 splits the seven “combination” teachers into elementary and middle school (two), middle and high school (two), K–12 (two), and one trade-school instructor. The page checks that both tables add to 40.", "ug grad res"));

    function drawTable() {
      var rows = E.TABLE1[state.table].rows;
      var W = chartWidth(chart), labelW = Math.min(230, Math.round(W * 0.42)), rowH = 24, padR = 70;
      var H = rows.length * rowH + 4;
      var max = Math.max.apply(null, rows.map(function (r) { return r.n; }));
      var s = svg("svg", { class: "cm-svg", viewBox: "0 0 " + W + " " + H, role: "img",
        "aria-label": E.TABLE1[state.table].label + ": " + rows.map(function (r) { return r.name + " " + r.n; }).join(", ") });
      rows.forEach(function (r, k) {
        var y = k * rowH + 2, bw = (W - labelW - padR) * r.n / max;
        s.appendChild(svg("text", { x: labelW - 8, y: y + 15, class: "c-label", "text-anchor": "end" }, W < 420 && r.name.length > 24 ? r.name.slice(0, 22) + "…" : r.name));
        s.appendChild(svg("rect", { x: labelW, y: y + 4, width: Math.max(1, bw), height: rowH - 9, class: "cm-bar" }));
        s.appendChild(svg("text", { x: labelW + bw + 6, y: y + 15, class: "c-tick" }, r.n + " (" + r.pct + "%)"));
      });
      chart.innerHTML = "";
      chart.appendChild(s);
    }
    drawTable();
    redraws.push(drawTable);
  }

  /* ---------------------------------------------------------------- demo 3: the shift */

  function mountShift(root) {
    var state = { view: "count" };
    var seg = segmented("Show", [{ value: "count", label: "Instances" }, { value: "share", label: "Shares" }], state.view,
      function (v) { state.view = v; draw(); });
    var chart = el("div", { class: "cm-chart" });
    var readout = el("div", { class: "cm-rows" });
    var stats = el("div", { class: "cm-stats", "data-levels": "grad res" });
    root.appendChild(el("p", { class: "w-source", text: "Paper, Findings: coded “modeling is …” instances, before, during, and after the PD" }));
    root.appendChild(el("div", { class: "w-actions" }, [seg]));
    root.appendChild(chart);
    root.appendChild(el("div", { class: "c-legend w-mono" }, E.CODES.map(function (c) {
      return el("span", { class: "lg cm-lg-" + c.key, text: c.short });
    })));
    root.appendChild(readout);
    root.appendChild(stats);

    function draw() {
      var srcs = E.SOURCES;
      var W = chartWidth(chart), labelW = W < 420 ? 82 : 110, rowH = 40, padR = 12;
      var H = srcs.length * rowH + 22;
      var s = svg("svg", { class: "cm-svg", viewBox: "0 0 " + W + " " + H, role: "img",
        "aria-label": srcs.map(function (r) { return r.name + ": " + E.CODES.map(function (c) { return r.counts[c.key] + " " + c.short; }).join(", "); }).join("; ") });
      var maxTot = Math.max.apply(null, srcs.map(function (r) { return E.sum(E.vec(r)); }));
      var plotW = W - labelW - padR;
      // axis
      var ticks = state.view === "share" ? [0, 0.25, 0.5, 0.75, 1] : [0, 10, 20, 30, 40];
      ticks.forEach(function (t) {
        var x = labelW + plotW * (state.view === "share" ? t : t / Math.max(40, maxTot));
        s.appendChild(svg("line", { x1: x, x2: x, y1: 0, y2: H - 18, class: "c-grid" }));
        s.appendChild(svg("text", { x: x, y: H - 4, class: "c-tick", "text-anchor": "middle" }, state.view === "share" ? pct(t) : String(t)));
      });
      srcs.forEach(function (r, k) {
        var y = k * rowH + 6, x = labelW, tot = E.sum(E.vec(r));
        s.appendChild(svg("text", { x: labelW - 8, y: y + 17, class: "c-label", "text-anchor": "end" }, W < 420 ? r.name.replace("-survey", "") : r.name));
        E.CODES.forEach(function (c) {
          var v = r.counts[c.key];
          var w = plotW * (state.view === "share" ? v / tot : v / Math.max(40, maxTot));
          if (v > 0) {
            s.appendChild(svg("rect", { x: x, y: y + 2, width: w, height: rowH - 16, class: "cm-seg " + CODE_CLASS[c.key] }));
            if (w > 22) s.appendChild(svg("text", { x: x + w / 2, y: y + 17, class: "cm-in " + CODE_CLASS[c.key] + "-in", "text-anchor": "middle" },
              state.view === "share" ? pct(v / tot) : String(v)));
          }
          x += w;
        });
      });
      chart.innerHTML = "";
      chart.appendChild(s);

      readout.innerHTML = "";
      srcs.forEach(function (r) {
        var tot = E.sum(E.vec(r));
        readout.appendChild(el("div", { class: "cm-row" }, [
          el("span", { class: "cm-row-name", text: r.name }),
          el("span", { class: "cm-row-val", text: tot + " instances from " + r.respondents + " teachers" }),
          el("span", { class: "cm-row-pct cm-c-t", text: pct(r.counts.comp / tot, 1) + " computer" })
        ]));
      });

      var pre = E.vec(E.source("pre")), post = E.vec(E.source("post"));
      var t = E.exact2x3(pre, post);
      var wpre = E.wilson(pre[0], E.sum(pre)), wpost = E.wilson(post[0], E.sum(post));
      stats.innerHTML = "";
      stats.appendChild(el("p", { class: "w-mono", text: "Computed by this page, not reported in the paper" }));
      [["Computer model share, pre", pct(pre[0] / E.sum(pre), 1) + " (95% Wilson " + pct(wpre[0]) + " to " + pct(wpre[1]) + ")"],
       ["Computer model share, post", pct(post[0] / E.sum(post), 1) + " (95% Wilson " + pct(wpost[0]) + " to " + pct(wpost[1]) + ")"],
       ["Pre vs. post, Pearson χ²", t.chi.stat.toFixed(2) + ", df " + t.chi.df + ", p = " + E.chiSurvival(t.chi.stat, t.chi.df).toFixed(3)],
       ["Pre vs. post, exact (Freeman–Halton)", "p = " + t.pFreemanHalton.toFixed(3) + " over " + t.tables + " tables"]
      ].forEach(function (row) {
        stats.appendChild(el("div", { class: "cm-row" }, [
          el("span", { class: "cm-row-name", text: row[0] }),
          el("span", { class: "cm-row-val", text: row[1] }),
          el("span", { class: "cm-row-pct", text: "" })
        ]));
      });
      stats.appendChild(note("Both tests treat the 40 pre-survey and 39 post-survey instances as independent draws. Most are the same teachers answering twice, and some teachers gave two definitions, so these p-values describe the counts as printed, not a paired before-and-after comparison, which would need each teacher's answers."));
    }
    draw();
    redraws.push(draw);
  }

  /* ---------------------------------------------------------------- demo 4: a year later */

  function mountFollow(root) {
    var state = { k: 0 };
    var e = E.EMAIL;
    var chart = el("div", { class: "cm-chart" });
    var range = el("input", { type: "range", min: "0", max: String(e.invited - e.responded), step: "1", value: "0", id: "cm-k", "aria-label": "Teachers among the 15 who did not answer who also changed their teaching" });
    var out = el("output", { for: "cm-k", text: "0" });
    var big = el("p", { class: "w-big", "aria-live": "polite" });
    var stats = el("div", { class: "cm-rows", "data-levels": "grad res" });

    root.appendChild(el("p", { class: "w-source", text: "Paper, Findings: email reflections at the end of the yearlong PD (40 teachers invited)" }));
    root.appendChild(chart);
    root.appendChild(el("div", { class: "c-legend w-mono" }, [
      el("span", { class: "lg cm-lg-used", text: "Reported a new idea in class" }),
      el("span", { class: "lg cm-lg-none", text: "Answered, nothing new" }),
      el("span", { class: "lg cm-lg-silent", text: "Did not answer" }),
      el("span", { class: "lg cm-lg-assumed", text: "Assumed by you" })
    ]));
    root.appendChild(el("label", { class: "w-range" }, [el("span", { text: "Of the 15 silent, changed" }), range, out]));
    root.appendChild(big);
    root.appendChild(stats);
    range.addEventListener("input", function () { state.k = parseInt(range.value, 10); draw(); });

    function draw() {
      var f = E.followThrough(state.k);
      out.textContent = String(f.k);
      var W = chartWidth(chart), cols = 20, gap = 4;
      var size = Math.min(28, Math.floor((W - gap * (cols - 1)) / cols));
      var H = 2 * (size + gap);
      var s = svg("svg", { class: "cm-svg", viewBox: "0 0 " + W + " " + H, role: "img",
        "aria-label": e.usedNew + " reported a new idea, " + e.noneNew + " answered with nothing new, " + f.silent + " did not answer, " + f.k + " of them assumed to have changed" });
      for (var i = 0; i < e.invited; i++) {
        var cls = i < e.usedNew ? "cm-used" : i < e.responded ? "cm-none" : (i - e.responded < f.k ? "cm-assumed" : "cm-silent");
        var x = (i % cols) * (size + gap), y = Math.floor(i / cols) * (size + gap);
        s.appendChild(svg("rect", { x: x + 0.5, y: y + 0.5, width: size - 1, height: size - 1, class: "cm-sq " + cls }));
      }
      chart.innerHTML = "";
      chart.appendChild(s);

      if (f.k === 0) big.textContent = "Counting only what teachers reported: 23 of 40 teachers (57.5%) brought something from the PD into class. Among the 25 who answered, the share is 92%.";
      else big.textContent = "If " + words(f.k) + " of the 15 who stayed silent also changed their teaching, " + f.changed + " of 40 did (" + pct(f.share, 1) + "). The paper's 57.5% assumes none did; 92% assumes they resemble the teachers who answered.";

      stats.innerHTML = "";
      stats.appendChild(el("p", { class: "w-mono", text: "Computed by this page, not reported in the paper" }));
      var w1 = E.wilson(e.usedNew, e.responded), w2 = E.wilson(e.usedNew, e.invited), w3 = E.wilson(e.responded, e.invited);
      [["Response rate, 25 of 40", "95% Wilson " + pct(w3[0]) + " to " + pct(w3[1])],
       ["New idea, 23 of 25 answering", "95% Wilson " + pct(w1[0]) + " to " + pct(w1[1])],
       ["New idea, 23 of all 40", "95% Wilson " + pct(w2[0]) + " to " + pct(w2[1])],
       ["Bounds over the 15 silent", "57.5% (none changed) to 95.0% (all changed)"]
      ].forEach(function (row) {
        stats.appendChild(el("div", { class: "cm-row" }, [
          el("span", { class: "cm-row-name", text: row[0] }),
          el("span", { class: "cm-row-val", text: row[1] }),
          el("span", { class: "cm-row-pct", text: "" })
        ]));
      });
    }
    draw();
    redraws.push(draw);
  }

  /* ---------------------------------------------------------------- mount */

  function mount(id, fn) {
    var node = document.getElementById(id);
    if (!node) return;
    fn(node);
    node.classList.add("w-ready");
  }

  function init() {
    mount("cm-sort", mountSort);
    mount("cm-design", mountDesign);
    mount("cm-shift", mountShift);
    mount("cm-follow", mountFollow);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();

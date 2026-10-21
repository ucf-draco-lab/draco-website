/*
  Generative AI peer tutor widget for /papers/genai-peer-tutor/.
  Mount points in the page: #pt-prompt, #pt-phases, #pt-survey, #pt-rubric.

  Demo 1 walks the Draft 5 prompt (Appendix B) one step at a time, contrasts its
  structure with Draft 4 (Appendix A, Figure 1), and asks the reader to sort tutor
  moves by the prompt's rules. The moves are written for this page; the rules are
  the chapter's.
  Demo 2 lays out the three evaluation phases.
  Demo 3 draws the survey shares (Tables 2 and 3, Results text) with the counts the
  page recovers from them; graduate and researcher levels add Wilson intervals and
  Fisher's exact test, both the page's own.
  Demo 4 draws Table 1 with the Appendix D rubric behind every cell, the Draft 4 to
  Draft 5 means the text states, and (researcher) the Average-row check.
  Demos 2 and 3 share one selected phase (state.phase).
  Arithmetic lives in pt-engine.js.
*/
(function () {
  "use strict";

  var E = window.PeerTutorEngine;
  var D = E.DATA;
  var SVGNS = "http://www.w3.org/2000/svg";

  var state = { phase: "p2", metric: "just", step: 0, draft: 5, plat: "gemini", crit: 2 };
  var PH = {};
  D.phases.forEach(function (p) { PH[p.id] = p; });

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
  function fix(x, d) { return Number(x).toFixed(d); }
  function pctStr(v, d) { return fix(v, d) + "%"; }

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
  function note(html, levels) {
    var p = el("p", { class: "w-note", html: html });
    if (levels) p.setAttribute("data-levels", levels);
    return p;
  }

  var phaseControls = [], phaseDraws = [];
  function setPhase(v) {
    state.phase = v;
    phaseControls.forEach(function (c) { c.set(v); });
    phaseDraws.forEach(function (fn) { fn(); });
  }
  function phaseControl() {
    var c = segmented("Evaluation phase", D.phases.map(function (p) {
      return { value: p.id, label: p.short + " · Draft " + p.draft, title: p.who };
    }), state.phase, setPhase);
    phaseControls.push(c);
    return c;
  }

  /* ------------------------------------------------- demo 1: the prompt */

  // Draft 5, Appendix B: six steps, condensed by this page.
  var STEPS = [
    { name: "Introduction", goal: "The tutor introduces itself, explains how the session works, and outlines the process. It asks for the assignment directions and any completed example, then checks that the student is ready.",
      rules: ["One guiding question at a time", "Invite clarifying questions", "Say why the process builds research skill"] },
    { name: "Post introduction", goal: "The tutor asks for the full text of one article (a PDF, or the title, authors, and link) and the student’s first thoughts on what peer review means.",
      rules: ["If the student cannot reach the full text, explain how to get it through the library", "If the student has no source, explain how to search library databases", "Never suggest a specific source"] },
    { name: "Peer-reviewed identification", goal: "The tutor asks about one feature of the article at a time (journal, author affiliations and degrees, volume and issue, reference list, terminology, section headings) and the student decides what each feature suggests.",
      rules: ["Never confirm or deny peer-review status", "Give background only as needed", "For a doubtful venue, send the student to the publication’s own description of its review process"] },
    { name: "Source evaluation", goal: "The tutor confirms the student’s research question, asks how the article relates to it, and then walks through an evaluation scheme such as CRAAP one criterion at a time.",
      rules: ["Explain each criterion before the student answers", "Encourage the student when a source is rejected", "Never offer an alternative source"] },
    { name: "Final decision", goal: "The student decides whether to use the source and explains why. A one-word answer earns a request for reasoning.",
      rules: ["Offer tips for academic precision", "Never rewrite the student’s work or change the conclusion"] },
    { name: "Closing", goal: "The tutor thanks the student, names a strength it saw, reminds the student to cite the AI conversation, and offers to evaluate another source.",
      rules: ["Ask whether the student has more questions"] }
  ];

  var STRUCT = {
    4: { label: "Draft 4 (Appendix A)",
         parts: [
           ["Role", "A friendly, adaptable peer tutor for finding and evaluating peer-reviewed sources"],
           ["Interaction flow", "Seven stages: introduction, post introduction, content customization, conversation flow, source evaluation, concept mastery, closing"],
           ["Guiding principles", "Encourage inquiry, stay in scope, adapt to level, guide rather than answer, give background a little at a time, ask the professor when in doubt"],
           ["What you never do", "A list of seven prohibitions: no analysis or summary of the source, no source type, no direct answers, no finding or suggesting sources, no searches, no completed assignment, no peer-review verdict"]
         ],
         note: "Rules without reasons. In testing, ChatGPT still gave answers and offered to find sources; repeating a prohibition reduced adherence." },
    5: { label: "Draft 5 (Appendix B)",
         parts: [
           ["Role", "The tutor’s persona, the evaluation schemes it knows (CRAAP, RADAR, SIFT, and IBEAM), and its hard limits"],
           ["Context", "Why the student needs a tutor: gaps in information literacy, confidence still forming, and students who “might not know what they don’t know”"],
           ["Instructions", "Six explicit steps, one question per turn, a summary after each answer, and writing support that never changes the student’s conclusion"],
           ["Markup", "Each section wrapped in XML tags, with the reason for each directive stated beside it"]
         ],
         note: "Every rule now carries its reason. The authors name that “why” as the most influential revision." }
  };

  // Tutor moves written for this page; each verdict cites the chapter's rule.
  var MOVES = [
    { text: "Tell the student, “Yes, this article is peer-reviewed.”", ok: false, why: "The tutor never confirms or denies peer-review status; the student decides (Step 3)." },
    { text: "Ask which journal published the article, then wait for the answer.", ok: true, why: "One question at a time about one feature of the article (Step 3)." },
    { text: "Suggest three stronger articles on the student’s topic.", ok: false, why: "The tutor never finds or suggests sources, even after a rejection (Steps 2 and 4)." },
    { text: "Explain what Currency means in CRAAP before asking the student to judge it.", ok: true, why: "The tutor explains each criterion before the student answers (Step 4)." },
    { text: "Ask four questions in one message to save time.", ok: false, why: "One question per turn, and no moving on without the student’s input (Role)." },
    { text: "Write the article summary the assignment asks for.", ok: false, why: "The tutor never completes the assignment (Role; Draft 4 also bans summarizing the source)." },
    { text: "Offer a tip that makes the student’s sentence more precise, keeping the student’s conclusion.", ok: true, why: "Writing support that never changes the student’s conclusion (Step 5)." },
    { text: "Explain how to reach the full text through the library.", ok: true, why: "The prescribed response when the student cannot open the article (Step 2)." }
  ];

  function mountPrompt(root) {
    // Part A: the six steps.
    var head = el("div", { class: "w-actions" }, [el("span", { class: "w-mono", text: "Draft 5 step:" })]);
    var stepSeg = segmented("Prompt step", STEPS.map(function (s, i) { return { value: i, label: String(i + 1), title: s.name }; }), state.step, function (v) { state.step = Number(v); drawStep(); });
    head.appendChild(stepSeg);
    var prev = el("button", { type: "button", class: "w-btn w-btn-ghost", text: "Back" });
    var next = el("button", { type: "button", class: "w-btn", text: "Next step" });
    prev.addEventListener("click", function () { state.step = Math.max(0, state.step - 1); stepSeg.set(state.step); drawStep(); });
    next.addEventListener("click", function () { state.step = (state.step + 1) % STEPS.length; stepSeg.set(state.step); drawStep(); });
    head.appendChild(prev);
    head.appendChild(next);
    var track = el("ol", { class: "pt-track", "aria-hidden": "true" });
    STEPS.forEach(function (s, i) {
      var li = el("li", { "data-i": String(i) }, [el("span", { class: "pt-track-n", text: String(i + 1) }), el("span", { class: "pt-track-l", text: s.name })]);
      li.addEventListener("click", function () { state.step = i; stepSeg.set(i); drawStep(); });
      track.appendChild(li);
    });
    var stepOut = el("div", { class: "pt-step", "aria-live": "polite" });
    root.appendChild(head);
    root.appendChild(track);
    root.appendChild(stepOut);
    root.appendChild(el("p", { class: "w-source", text: "Chapter, Appendix B (Draft 5 prompt) · condensed by this page" }));

    function drawStep() {
      var s = STEPS[state.step];
      Array.prototype.forEach.call(track.children, function (li, i) { li.className = i === state.step ? "is-on" : (i < state.step ? "is-done" : ""); });
      stepOut.innerHTML = "";
      stepOut.appendChild(el("p", { class: "w-big", html: "<strong>Step " + (state.step + 1) + ". " + s.name + ".</strong>" }));
      stepOut.appendChild(el("p", { class: "pt-goal", text: s.goal }));
      var ul = el("ul", { class: "pt-rules" });
      s.rules.forEach(function (r) { ul.appendChild(el("li", { text: r })); });
      stepOut.appendChild(ul);
    }
    drawStep();

    // Part B: Draft 4 against Draft 5 (graduate levels see it too; everyone may).
    var structWrap = el("div", { class: "pt-struct" });
    var structHead = el("div", { class: "w-actions" }, [el("span", { class: "w-mono", text: "Prompt structure:" })]);
    var draftSeg = segmented("Prompt draft", [{ value: 4, label: "Draft 4" }, { value: 5, label: "Draft 5" }], state.draft, function (v) { state.draft = Number(v); drawStruct(); });
    structHead.appendChild(draftSeg);
    var structOut = el("div");
    structWrap.appendChild(structHead);
    structWrap.appendChild(structOut);
    structWrap.appendChild(el("p", { class: "w-source", text: "Chapter, Appendices A and B and Figure 1 · condensed by this page" }));
    root.appendChild(structWrap);

    function drawStruct() {
      var st = STRUCT[state.draft];
      structOut.innerHTML = "";
      var tbl = el("table", { class: "pt-rows" });
      var tb = el("tbody");
      st.parts.forEach(function (p) { tb.appendChild(el("tr", null, [el("th", { scope: "row", text: p[0] }), el("td", { text: p[1] })])); });
      tbl.appendChild(tb);
      structOut.appendChild(el("div", { class: "pt-table-wrap" }, [tbl]));
      structOut.appendChild(el("p", { class: "w-note", text: st.note }));
    }
    drawStruct();

    // Part C: sort the moves.
    var quiz = el("div", { class: "pt-quiz" });
    quiz.appendChild(el("p", { class: "w-big", html: "<strong>Your turn.</strong> Would the Draft 5 tutor make each move?" }));
    var score = el("p", { class: "w-note", "aria-live": "polite" });
    var answered = 0, right = 0;
    var list = el("ol", { class: "pt-moves" });
    MOVES.forEach(function (m) {
      var verdict = el("p", { class: "pt-verdict" });
      var yes = el("button", { type: "button", class: "seg-option", text: "Allowed" });
      var no = el("button", { type: "button", class: "seg-option", text: "Off limits" });
      var seg = el("div", { class: "seg", role: "group", "aria-label": "Verdict" }, [yes, no]);
      function pick(choice) {
        if (seg.getAttribute("data-done")) return;
        seg.setAttribute("data-done", "1");
        (choice ? yes : no).setAttribute("aria-checked", "true");
        var good = choice === m.ok;
        answered++; if (good) right++;
        verdict.className = "pt-verdict " + (good ? "is-good" : "is-miss");
        verdict.textContent = (m.ok ? "Allowed. " : "Off limits. ") + m.why;
        score.textContent = right + " of " + answered + " sorted the way the prompt would" + (answered === MOVES.length ? ". Every move above is a rule the chapter states." : ".");
      }
      yes.addEventListener("click", function () { pick(true); });
      no.addEventListener("click", function () { pick(false); });
      list.appendChild(el("li", null, [el("p", { class: "pt-move", text: m.text }), seg, verdict]));
    });
    quiz.appendChild(list);
    quiz.appendChild(score);
    var reset = el("button", { type: "button", class: "w-btn w-btn-ghost", text: "Clear answers" });
    reset.addEventListener("click", function () { root.innerHTML = ""; mountPrompt(root); });
    quiz.appendChild(el("div", { class: "w-actions" }, [reset]));
    quiz.appendChild(el("p", { class: "w-source", text: "Moves written for this page · verdicts from the chapter’s Appendix A and B rules" }));
    root.appendChild(quiz);
    root.classList.add("w-ready");
  }

  /* ------------------------------------------------- demo 2: the phases */

  function mountPhases(root) {
    root.appendChild(el("div", { class: "w-actions" }, [el("span", { class: "w-mono", text: "Phase:" }), phaseControl()]));
    var chart = el("div", { class: "pt-chart" });
    var out = el("div");
    root.appendChild(chart);
    root.appendChild(out);
    root.appendChild(el("p", { class: "w-source", text: "Chapter, Prompt Evaluation Process and Table 2 · the chapter gives no dates for the phases" }));

    function drawChart() {
      var W = chartWidth(root), H = 112;
      var s = svg("svg", { viewBox: "0 0 " + W + " " + H, class: "pt-svg", role: "img",
        "aria-label": "Three phases in order: Phase 1, Draft 4, 9 responses; Phase 2, Draft 4, 40 responses; Phase 3, Draft 5, 5 responses." });
      var m = Math.min(90, W * 0.2); var xs = D.phases.map(function (_, i) { return m + i * ((W - 2 * m) / 2); });
      s.appendChild(svg("line", { x1: xs[0], x2: xs[2], y1: 40, y2: 40, class: "pt-axis" }));
      // Draft boundary between phase 2 and 3.
      var mid = (xs[1] + xs[2]) / 2;
      s.appendChild(svg("line", { x1: mid, x2: mid, y1: 14, y2: 66, class: "pt-boundary" }));
      s.appendChild(svg("text", { x: mid, y: 10, class: "c-tick", "text-anchor": "middle" }, "prompt revised"));
      D.phases.forEach(function (p, i) {
        var on = p.id === state.phase;
        var r = 6 + 14 * Math.sqrt(p.n / 40);
        var g = svg("g", { class: "pt-node" + (on ? " is-on" : ""), tabindex: "0", role: "button", "aria-label": p.name });
        g.appendChild(svg("circle", { cx: xs[i], cy: 40, r: r, class: on ? "pt-dot-on" : "pt-dot" }));
        g.appendChild(svg("text", { x: xs[i], y: 82, class: "c-label", "text-anchor": "middle" }, p.name + " · Draft " + p.draft));
        g.appendChild(svg("text", { x: xs[i], y: 98, class: "c-tick", "text-anchor": "middle" }, "N = " + p.n + " survey responses"));
        g.addEventListener("click", function () { setPhase(p.id); });
        g.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setPhase(p.id); } });
        s.appendChild(g);
      });
      chart.innerHTML = "";
      chart.appendChild(s);
    }
    function drawRows() {
      var p = PH[state.phase];
      out.innerHTML = "";
      var tb = el("tbody");
      [["Prompt", "Draft " + p.draft], ["Who", p.who], ["Setting", p.setting], ["Platforms", p.platforms.join(", ")],
       ["Survey responses", String(p.n)], ["Evidence", p.instrument]].forEach(function (r) {
        tb.appendChild(el("tr", null, [el("th", { scope: "row", text: r[0] }), el("td", { text: r[1] })]));
      });
      out.appendChild(el("div", { class: "pt-table-wrap" }, [el("table", { class: "pt-rows" }, [tb])]));
    }
    function draw() { drawChart(); drawRows(); }
    phaseDraws.push(draw);
    redraws.push(draw);
    draw();
    root.classList.add("w-ready");
  }

  /* ------------------------------------------------- demo 3: the survey */

  var counts = E.surveyCounts();

  function mountSurvey(root) {
    var mSeg = segmented("Survey measure", D.survey.map(function (m) {
      return { value: m.id, label: { just: "Just right", nat: "Natural", adapt: "Adapts", qual: "Quality" }[m.id], title: m.name };
    }), state.metric, function (v) { state.metric = v; draw(); });
    root.appendChild(el("div", { class: "w-actions" }, [el("span", { class: "w-mono", text: "Measure:" }), mSeg]));
    root.appendChild(el("div", { class: "w-actions" }, [el("span", { class: "w-mono", text: "Highlight:" }), phaseControl()]));
    var title = el("p", { class: "w-big" });
    var chart = el("div", { class: "pt-chart" });
    var legend = el("div", { class: "c-legend", "data-levels": "grad res" }, [
      el("span", { class: "pt-lg" }, [el("span", { class: "pt-sw pt-sw-ci" }), "Wilson 95% interval (this page)"])
    ]);
    var read = el("p", { class: "w-note", "aria-live": "polite" });
    var src = el("p", { class: "w-source" });
    root.appendChild(title);
    root.appendChild(chart);
    root.appendChild(legend);
    root.appendChild(read);
    root.appendChild(src);

    // Course split.
    var split = el("div", { class: "pt-split" });
    split.appendChild(el("p", { class: "w-big", html: "<strong>Phase 2, course by course.</strong> Overall quality rated very good or excellent." }));
    var splitChart = el("div", { class: "pt-chart" });
    var splitRead = el("p", { class: "w-note" });
    var splitStat = el("p", { class: "w-note", "data-levels": "grad res" });
    split.appendChild(splitChart);
    split.appendChild(splitRead);
    split.appendChild(splitStat);
    split.appendChild(el("p", { class: "w-source", text: "Chapter, Student Survey Outcomes · 12 of 15 and 10 of 25 as printed; the pooled 22 of 40 and the test are this page’s" }));
    root.appendChild(split);

    function bars(host, rows, label) {
      var W = chartWidth(root), rowH = 34, padL = Math.min(170, Math.round(W * 0.34)), padR = 70, top = 18;
      var H = top + rows.length * rowH + 22;
      var s = svg("svg", { viewBox: "0 0 " + W + " " + H, class: "pt-svg", role: "img", "aria-label": label });
      var x = function (v) { return padL + (W - padL - padR) * v / 100; };
      [0, 25, 50, 75, 100].forEach(function (t) {
        s.appendChild(svg("line", { x1: x(t), x2: x(t), y1: top - 4, y2: H - 20, class: "c-grid" }));
        s.appendChild(svg("text", { x: x(t), y: H - 6, class: "c-tick", "text-anchor": "middle" }, t + "%"));
      });
      rows.forEach(function (r, i) {
        var y = top + i * rowH;
        s.appendChild(svg("text", { x: padL - 8, y: y + 13, class: "c-label", "text-anchor": "end" }, r.label));
        if (r.sub) s.appendChild(svg("text", { x: padL - 8, y: y + 26, class: "c-tick", "text-anchor": "end" }, r.sub));
        s.appendChild(svg("rect", { x: x(0), y: y + 2, width: x(100) - x(0), height: 16, class: "pt-track-bar" }));
        s.appendChild(svg("rect", { x: x(0), y: y + 2, width: Math.max(0, x(r.v) - x(0)), height: 16, class: r.on ? "pt-bar-on" : "pt-bar" }));
        if (r.ci) {
          var g = svg("g", { "data-levels": "grad res" });
          g.appendChild(svg("line", { x1: x(100 * r.ci.lo), x2: x(100 * r.ci.hi), y1: y + 10, y2: y + 10, class: "pt-ci" }));
          g.appendChild(svg("line", { x1: x(100 * r.ci.lo), x2: x(100 * r.ci.lo), y1: y + 5, y2: y + 15, class: "pt-ci" }));
          g.appendChild(svg("line", { x1: x(100 * r.ci.hi), x2: x(100 * r.ci.hi), y1: y + 5, y2: y + 15, class: "pt-ci" }));
          s.appendChild(g);
        }
        s.appendChild(svg("text", { x: x(100) + 6, y: y + 14, class: "pt-val" }, r.text));
      });
      host.innerHTML = "";
      host.appendChild(s);
    }

    function draw() {
      var m = D.survey.filter(function (q) { return q.id === state.metric; })[0];
      title.innerHTML = "<strong>" + m.name + "</strong> · " + m.item;
      var rows = D.phases.map(function (p) {
        var c = counts[m.id][p.id], k = c.ks[0];
        return { label: p.name + " · Draft " + p.draft, sub: p.id === "p3" ? "5 platform runs" : (p.id === "p1" ? "student testers" : "two courses"),
                 v: c.printed, text: k + " of " + c.n, on: p.id === state.phase, ci: E.wilson(k, c.n) };
      });
      bars(chart, rows, m.name + " by phase");
      var c = counts[m.id][state.phase], k = c.ks[0], w = E.wilson(k, c.n), p = PH[state.phase];
      var msg = p.name + ": the chapter prints " + pctStr(c.printed, c.decimals) + " of " + c.n + " responses, which only " + k + " of " + c.n + " produces.";
      if (m.id === "just" && state.phase === "p1") msg += " The other 4 of 9 (44%) found it a little too much.";
      if (m.id === "just" && state.phase === "p2") msg += " Of the rest, 6 of 40 (15%) needed more and 6 of 40 (15%) wanted less.";
      if (m.id === "qual" && state.phase === "p2") msg += " The course split below gives the same 22 of 40.";
      read.innerHTML = msg + "<span data-levels=\"grad res\"> Wilson 95% interval: " + pctStr(100 * w.lo, 1) + " to " + pctStr(100 * w.hi, 1) + ".</span>";
      src.textContent = "Chapter, " + m.src + " · counts recovered by this page from the printed percentages and N";

      var rowsC = D.courses.map(function (co) {
        return { label: co.id === "prac" ? "Reading practicum" : "Intro to Teaching", sub: co.n + " students", v: 100 * co.k / co.n,
                 text: co.k + " of " + co.n, on: false, ci: E.wilson(co.k, co.n) };
      });
      rowsC.push({ label: "Both courses", sub: "pooled by this page", v: 55, text: "22 of 40", on: true, ci: E.wilson(22, 40) });
      bars(splitChart, rowsC, "Overall quality by course in Phase 2");
      splitRead.textContent = "80% of the practicum students and 40% of the introductory students rated the tutor’s overall quality very good or excellent. Together that is 22 of 40, exactly the 55% the chapter reports for Phase 2.";
      var f = E.fisher(12, 3, 10, 15);
      splitStat.innerHTML = "Computed by this page, not in the chapter: Fisher’s exact test on 12 of 15 against 10 of 25 gives two-sided p = " + fix(f.p, 4) +
        " (odds ratio " + fix(f.oddsRatio, 1) + "). The courses differ in assignment, survey form, and student year as well as in outcome, so the test cannot say which difference matters.";
    }
    phaseDraws.push(draw);
    redraws.push(draw);
    draw();
    root.classList.add("w-ready");
  }

  /* ------------------------------------------------- demo 4: the rubric */

  // Appendix D descriptors, paraphrased by this page; index 0 is a score of 1.
  var RUBRIC = [
    ["Ignores confusion; language too technical or unclear", "Rarely accessible; often misses signs of difficulty", "Sometimes relatable; handles difficulty unevenly", "Generally relatable; responds to most difficulties", "Mirrors the student’s language, shows it understands the confusion, adapts tone naturally"],
    ["No clear steps; vague or incomplete", "Few steps; skips key parts or loses order", "Some steps; clarity or flow uneven", "Mostly a logical sequence with clear explanations", "Scaffolds the whole process in clear steps that build understanding"],
    ["Often gives final answers or does the task", "Often gives answers", "Sometimes gives answers", "Rarely gives answers; mostly prompts the student’s thinking", "Never gives answers; keeps prompting reasoning and reflection"],
    ["Never adjusts; generic replies", "Adjusts without regard to the student’s level", "Adjusts at least once to the student’s level", "Adapts to level and tries more than one approach when asked", "Tailors every reply and adjusts style before being asked"],
    ["Answers without reasoning", "Rarely explains its reasoning", "Sometimes explains, without depth", "Regularly explains its reasoning clearly", "Models its reasoning, invites reflection, explains why each step matters"],
    ["Ignores the directions or drifts off task", "Misses most key requirements", "Follows some directions; incomplete", "Follows most directions and stays on task", "Meets every requirement and keeps focus"]
  ];
  var LEVELS = ["Ineffective", "Developing", "Basic", "Proficient", "Exemplary"];

  function mountRubric(root) {
    var wrap = el("div", { class: "pt-table-wrap" });
    var desc = el("div", { class: "pt-desc", "aria-live": "polite" });
    root.appendChild(el("p", { class: "w-note", text: "Pick any score to read the rubric line behind it." }));
    root.appendChild(wrap);
    root.appendChild(desc);
    root.appendChild(el("p", { class: "w-source", text: "Chapter, Table 1 (Draft 5, Phase 3) and Appendix D rubric · descriptors paraphrased by this page" }));

    var five = E.columnMeans(D.table1);

    function drawGrid() {
      var tbl = el("table", { class: "pt-grid" });
      var hr = el("tr", null, [el("th", { text: "Platform" })]);
      D.criteria.forEach(function (c, j) { hr.appendChild(el("th", { class: j === state.crit ? "is-on" : "", title: c.name, text: c.short })); });
      hr.appendChild(el("th", { text: "Total of 30" }));
      tbl.appendChild(el("thead", null, [hr]));
      var tb = el("tbody");
      D.table1.forEach(function (r) {
        var tr = el("tr", null, [el("th", { scope: "row", text: r.name })]);
        r.s.forEach(function (v, j) {
          var on = r.id === state.plat && j === state.crit;
          var b = el("button", { type: "button", class: "pt-cell s" + v + (on ? " is-on" : ""), "aria-label": r.name + ", " + D.criteria[j].name + ": " + v + " of 5", text: String(v) });
          b.addEventListener("click", function () { state.plat = r.id; state.crit = j; draw(); });
          tr.appendChild(el("td", { class: j === state.crit ? "is-col" : "" }, [b]));
        });
        tr.appendChild(el("td", { class: "pt-total", text: String(r.total) }));
        tb.appendChild(tr);
      });
      var mr = el("tr", { class: "pt-mean" }, [el("th", { scope: "row", text: "Mean of the five (this page)" })]);
      five.s.forEach(function (v, j) { mr.appendChild(el("td", { class: j === state.crit ? "is-col" : "", text: fix(v, 1) })); });
      mr.appendChild(el("td", { class: "pt-total", text: fix(five.total, 1) }));
      tb.appendChild(mr);
      tbl.appendChild(tb);
      wrap.innerHTML = "";
      wrap.appendChild(tbl);
    }
    function drawDesc() {
      var r = D.table1.filter(function (x) { return x.id === state.plat; })[0], j = state.crit, v = r.s[j];
      desc.innerHTML = "";
      desc.appendChild(el("p", { class: "w-big", html: "<strong>" + r.name + ", " + D.criteria[j].name.toLowerCase() + ": " + v + " of 5 (" + LEVELS[v - 1] + ").</strong>" }));
      var tb = el("tbody");
      for (var s = 5; s >= 1; s--) {
        tb.appendChild(el("tr", { class: s === v ? "is-on" : "" }, [el("th", { scope: "row", text: s + " " + LEVELS[s - 1] }), el("td", { text: RUBRIC[j][s - 1] })]));
      }
      desc.appendChild(el("div", { class: "pt-table-wrap" }, [el("table", { class: "pt-rows pt-levels" }, [tb])]));
    }

    // Draft 4 to Draft 5 means stated in the text.
    var fig = el("div", { class: "pt-fig2" });
    fig.appendChild(el("p", { class: "w-big", html: "<strong>Draft 4 to Draft 5.</strong> Mean rubric score, 1 to 5, for the three criteria the text reports." }));
    var figChart = el("div", { class: "pt-chart" });
    var figLegend = el("div", { class: "c-legend" }, [
      el("span", { class: "pt-lg" }, [el("span", { class: "pt-sw pt-sw-d4" }), "Draft 4 (classroom transcripts)"]),
      el("span", { class: "pt-lg" }, [el("span", { class: "pt-sw pt-sw-d5" }), "Draft 5 (five platforms, one evaluator)"])
    ]);
    fig.appendChild(figChart);
    fig.appendChild(figLegend);
    fig.appendChild(note("The text says every criterion improved but states Draft 4 means only for these three; the other three are left out here rather than read off Figure 2. Each Draft 5 value matches the mean of Table 1’s five platforms (5.0, 4.8, and 4.2)."));
    fig.appendChild(el("p", { class: "w-source", text: "Chapter, Rubric Outcomes and Figure 2 · Draft 4 transcript count not stated" }));
    root.appendChild(fig);

    function drawFig() {
      var W = chartWidth(root), top = 14, rowH = 46, padL = Math.min(170, Math.round(W * 0.34)), padR = 44;
      var narrow = W < 520;
      var rows = [["cc", narrow ? "Congruence" : "Cognitive congruence"], ["adapt", "Adaptability"], ["avoid", narrow ? "No answers" : "Avoiding answers"]];
      var H = top + rows.length * rowH + 22;
      var s = svg("svg", { viewBox: "0 0 " + W + " " + H, class: "pt-svg", role: "img",
        "aria-label": "Draft 4 to Draft 5 means: cognitive congruence 3.38 to 5.0, adaptability 3.18 to 4.8, avoiding giving answers 3.08 to 4.2." });
      var x = function (v) { return padL + (W - padL - padR) * (v - 1) / 4; };
      [1, 2, 3, 4, 5].forEach(function (t) {
        s.appendChild(svg("line", { x1: x(t), x2: x(t), y1: top - 4, y2: H - 20, class: "c-grid" }));
        s.appendChild(svg("text", { x: x(t), y: H - 6, class: "c-tick", "text-anchor": "middle" }, String(t)));
      });
      rows.forEach(function (r, i) {
        var y = top + i * rowH, v = D.fig2[r[0]];
        s.appendChild(svg("text", { x: padL - 8, y: y + 20, class: "c-label", "text-anchor": "end" }, r[1]));
        s.appendChild(svg("rect", { x: x(1), y: y + 4, width: x(v[0]) - x(1), height: 12, class: "pt-d4" }));
        s.appendChild(svg("rect", { x: x(1), y: y + 20, width: x(v[1]) - x(1), height: 12, class: "pt-d5" }));
        s.appendChild(svg("text", { x: x(v[0]) + 5, y: y + 14, class: "pt-val" }, fix(v[0], 2)));
        s.appendChild(svg("text", { x: x(v[1]) + 5, y: y + 30, class: "pt-val" }, fix(v[1], 1)));
      });
      figChart.innerHTML = "";
      figChart.appendChild(s);
    }

    // Researcher: the printed Average row.
    var avg = el("div", { class: "pt-avg", "data-levels": "res" });
    avg.appendChild(el("p", { class: "w-big", html: "<strong>Checking Table 1’s Average row.</strong>" }));
    var hits = E.averageRowSubsets();
    var three = E.columnMeans(D.table1.filter(function (r) { return hits.length && hits[0].indexOf(r.id) >= 0; }));
    var atb = el("tbody");
    function arow(label, s, total) {
      var tr = el("tr", null, [el("th", { scope: "row", text: label })]);
      s.forEach(function (v) { tr.appendChild(el("td", { text: fix(v, 2) })); });
      tr.appendChild(el("td", { text: fix(total, 2) }));
      atb.appendChild(tr);
    }
    arow("Average row, as printed", D.table1Average.s, D.table1Average.total);
    arow("Mean of all five platforms", five.s, five.total);
    arow("Mean of CoPilot, ChatGPT, and Gemini", three.s, three.total);
    var ahr = el("tr", null, [el("th", { text: "" })]);
    D.criteria.forEach(function (c) { ahr.appendChild(el("th", { text: c.short })); });
    ahr.appendChild(el("th", { text: "Total" }));
    avg.appendChild(el("div", { class: "pt-table-wrap" }, [el("table", { class: "pt-grid pt-avg-table" }, [el("thead", null, [ahr]), atb])]));
    avg.appendChild(note("This page tried all 31 non-empty sets of the five platforms. Exactly " + (hits.length === 1 ? "one" : String(hits.length)) +
      " reproduces every printed average to two decimals: CoPilot, ChatGPT, and Gemini, without Claude and DeepSeek. The text’s Draft 5 means (5.0, 4.8, and 4.2) match the five-platform row instead."));
    root.appendChild(avg);

    function draw() { drawGrid(); drawDesc(); drawFig(); }
    redraws.push(draw);
    draw();
    root.classList.add("w-ready");
  }

  /* ---------------------------------------------------------------- mount */

  function mount(id, fn) { var node = document.getElementById(id); if (node) fn(node); }
  function start() {
    mount("pt-prompt", mountPrompt);
    mount("pt-phases", mountPhases);
    mount("pt-survey", mountSurvey);
    mount("pt-rubric", mountRubric);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();

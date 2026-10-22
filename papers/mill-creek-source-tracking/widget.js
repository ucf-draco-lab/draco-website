/*
  Mill Creek widget for /papers/mill-creek-source-tracking/.
  Mount points in the page: #mc-trace, #mc-design, #mc-rate, #mc-scores, #mc-lessons.

  Demo 1 runs a simulated PCR source-tracking test with the paper's four
         Bacteroidales primer sets (general, human, cow, pig) and asks the
         reader to read the gel.
  Demo 2 walks the two class implementations and the Project STEP process
         that produced the unit.
  Demo 3 does the Physical Science spreadsheet step (average replicates,
         convert dissolved oxygen to percent saturation) and shows the paper's
         ratings with two ways of combining them.
  Demo 4 draws the pre/post results and, at graduate and researcher levels,
         the spread a class would need to reach each printed p-value.
  Demo 5 draws Table 1 and checks the text's percentages against it.
  All arithmetic lives in mc-engine.js.
*/
(function () {
  "use strict";

  var E = window.MillCreekEngine;
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

  function range(label, min, max, step, value, onInput, fmt) {
    var id = "mc-r-" + Math.random().toString(36).slice(2, 8);
    var input = el("input", { type: "range", id: id, min: min, max: max, step: step, value: value });
    var out = el("output", { for: id, text: fmt ? fmt(value) : String(value) });
    input.addEventListener("input", function () {
      var v = Number(input.value);
      out.textContent = fmt ? fmt(v) : String(v);
      onInput(v);
    });
    return el("div", { class: "w-range" }, [el("label", { for: id, text: label }), input, out]);
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
  function sci(p) {
    if (p >= 0.0001) return p.toFixed(5).replace(/0+$/, "");
    var e = Math.floor(Math.log10(p)), m = p / Math.pow(10, e);
    return m.toFixed(2) + " × 10<sup>" + e + "</sup>";
  }

  /* ---------------------------------------------------------------- demo 1: trace the source */

  var READINGS = [
    { id: "hum", label: "People" },
    { id: "cow", label: "Cows" },
    { id: "pig", label: "Pigs" },
    { id: "mixed", label: "More than one" },
    { id: "unknown", label: "Feces, source unclear" },
    { id: "none", label: "No fecal signal" }
  ];
  var READ_TEXT = {
    hum: "The general and human lanes light up: fecal bacteria are there, and the human marker says people are the likely source.",
    cow: "The general and cow lanes light up: the bacteria most likely came from cattle.",
    pig: "The general and pig lanes light up: the bacteria most likely came from pigs.",
    mixed: "Two host lanes light up: more than one kind of animal contributed.",
    unknown: "Only the general lane lights up: fecal Bacteroidales are present, but none of the three host markers is. The source could be another animal (a deer, a goose, a dog) that the class had no primer for.",
    none: "No lane lights up: at this many cycles, nothing in the sample reached a visible band."
  };
  // Illustrative band heights (fraction of gel height). The paper gives no sizes.
  var BAND_Y = { gen: 0.36, hum: 0.48, cow: 0.43, pig: 0.46 };
  var LADDER = [0.18, 0.26, 0.33, 0.40, 0.47, 0.55, 0.64, 0.74];

  function mountTrace(root) {
    var state = { sample: "creek", cycles: 30, guess: null };

    var steps = el("div", { class: "mc-steps-inline" });
    [["Filter", "Pump creek water (or stirred sediment) through filter paper to catch the bacteria."],
     ["Extract", "Break the cells open and spin out the DNA in a centrifuge."],
     ["Copy (PCR)", "Copy one stretch of the bacteria's 16S rRNA gene, once with each of four primer sets."],
     ["Gel", "Run the copies through an agarose gel and photograph it."],
     ["Read", "A band means that marker was in the water."]].forEach(function (s, i) {
      steps.appendChild(el("div", { class: "mc-step" }, [
        el("span", { class: "mc-step-n", text: String(i + 1) }),
        el("span", { class: "mc-step-t", text: s[0] }),
        el("span", { class: "mc-step-b", text: s[1] })
      ]));
    });

    var sampleSeg = segmented("Water sample", Object.keys(E.SAMPLES).map(function (k) {
      return { value: k, label: E.SAMPLES[k].name };
    }), state.sample, function (v) { state.sample = v; state.guess = null; draw(); });

    var cyc = range("PCR cycles", 20, 40, 1, state.cycles, function (v) { state.cycles = v; draw(); });
    cyc.setAttribute("data-levels", "hs ug grad res");

    var gelBox = el("div", { class: "mc-chart" });
    var ask = el("p", { class: "w-mono", text: "Where did the bacteria come from? Read the gel, then choose." });
    var guessWrap = el("div", { class: "w-actions" });
    var guessButtons = READINGS.map(function (r) {
      var b = el("button", { type: "button", class: "w-btn w-btn-quiet", text: r.label });
      b.addEventListener("click", function () { state.guess = r.id; drawVerdict(); });
      guessWrap.appendChild(b);
      return b;
    });
    var verdict = el("p", { class: "w-big", "aria-live": "polite" });

    var curveBox = el("div", { class: "mc-chart", "data-levels": "ug grad res" });
    var curveNote = note("", "ug grad res");

    root.appendChild(steps);
    root.appendChild(el("p", { class: "w-mono", text: "Water sample" }));
    root.appendChild(sampleSeg);
    root.appendChild(cyc);
    root.appendChild(gelBox);
    root.appendChild(ask);
    root.appendChild(guessWrap);
    root.appendChild(verdict);
    root.appendChild(curveBox);
    root.appendChild(curveNote);
    root.appendChild(note("Simulated. The paper reports the class's conclusion (human sources most likely), not its gel, its primer sequences, or its cycle count. Starting amounts, band positions, the visible level, and the no-DNA control lane are this page's illustration; the five samples other than Mill Creek are made up for practice."));

    var lanes = [];

    function drawGel() {
      gelBox.innerHTML = "";
      var W = chartWidth(gelBox), H = 230;
      var names = ["Ladder"].concat(lanes.map(function (l) { return l.name; }));
      var left = 8, laneW = (W - 2 * left) / names.length;
      var s = svg("svg", { class: "mc-svg", viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": "Simulated gel: " + lanes.map(function (l) { return l.name + (l.band > 0 ? " band" : " no band"); }).join(", ") });
      s.appendChild(svg("rect", { x: left, y: 22, width: W - 2 * left, height: H - 30, class: "mc-gel" }));
      names.forEach(function (n, i) {
        var x = left + i * laneW + laneW * 0.18, w = laneW * 0.64;
        s.appendChild(svg("text", { x: left + i * laneW + laneW / 2, y: 14, "text-anchor": "middle", class: "c-tick" }, n));
        s.appendChild(svg("rect", { x: x, y: 28, width: w, height: 6, class: "mc-well" }));
        if (i === 0) {
          LADDER.forEach(function (fy) { s.appendChild(svg("rect", { x: x, y: 22 + fy * (H - 30), width: w, height: 4, class: "mc-band", opacity: 0.55 })); });
          return;
        }
        var l = lanes[i - 1];
        if (l.band > 0) {
          var y = 22 + BAND_Y[l.id === "ntc" ? "gen" : l.id] * (H - 30);
          s.appendChild(svg("rect", { x: x, y: y, width: w, height: 6, class: "mc-band", opacity: l.band.toFixed(2) }));
        }
      });
      gelBox.appendChild(s);
    }

    function drawCurves() {
      curveBox.innerHTML = "";
      var W = chartWidth(curveBox), H = 200, m = { l: 46, r: 12, t: 12, b: 30 };
      var iw = W - m.l - m.r, ih = H - m.t - m.b;
      var yMin = 0, yMax = 12;
      function X(c) { return m.l + iw * c / 40; }
      function Y(v) { var lv = v > 1 ? Math.log10(v) : 0; return m.t + ih * (1 - (lv - yMin) / (yMax - yMin)); }
      var s = svg("svg", { class: "mc-svg", viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": "Copies of each marker by PCR cycle, log scale" });
      [0, 3, 6, 9, 12].forEach(function (e) {
        s.appendChild(svg("line", { x1: m.l, x2: W - m.r, y1: Y(Math.pow(10, e)), y2: Y(Math.pow(10, e)), class: "c-grid" }));
        s.appendChild(svg("text", { x: m.l - 6, y: Y(Math.pow(10, e)) + 4, "text-anchor": "end", class: "c-tick" }, e === 0 ? "1" : "10^" + e));
      });
      [0, 10, 20, 30, 40].forEach(function (c) {
        s.appendChild(svg("text", { x: X(c), y: H - 12, "text-anchor": "middle", class: "c-tick" }, String(c)));
      });
      s.appendChild(svg("text", { x: m.l + iw / 2, y: H - 1, "text-anchor": "middle", class: "c-label" }, "cycle"));
      s.appendChild(svg("line", { x1: m.l, x2: W - m.r, y1: Y(E.PCR.visible), y2: Y(E.PCR.visible), class: "mc-thresh" }));
      s.appendChild(svg("text", { x: W - m.r, y: Y(E.PCR.visible) - 4, "text-anchor": "end", class: "c-label" }, "visible band"));
      s.appendChild(svg("line", { x1: X(state.cycles), x2: X(state.cycles), y1: m.t, y2: m.t + ih, class: "mc-now" }));
      lanes.forEach(function (l, i) {
        if (l.id === "ntc") return;
        var curve = E.amplify(l.start, 40);
        var d = curve.map(function (v, c) { return (c ? "L" : "M") + X(c).toFixed(1) + " " + Y(v).toFixed(1); }).join(" ");
        s.appendChild(svg("path", { d: d, class: "mc-curve mc-curve-" + l.id }));
        if (l.start > 0) s.appendChild(svg("text", { x: X(1), y: Y(curve[1]) + (l.id === "gen" ? -5 : 13), class: "c-label" }, l.name));
      });
      curveBox.appendChild(s);
      var parts = lanes.filter(function (l) { return l.id !== "ntc" && l.start > 0; }).map(function (l) {
        var c = E.crossing(E.amplify(l.start, 40));
        return l.name + " starts near " + Math.round(l.start).toLocaleString("en-US") + " copies and " + (c === null ? "never reaches a visible band by cycle 40" : "reaches a visible band at cycle " + c);
      });
      curveNote.innerHTML = "Each cycle roughly doubles the copies (92% efficiency in this model) until the reaction runs out of ingredients and levels off. " +
        (parts.length ? parts.join("; ") + "." : "No marker is present in this sample.") +
        " Past the plateau, every positive lane looks equally bright, which is why a gel reads presence or absence, not amount.";
    }

    function drawVerdict() {
      var truth = E.readGel(lanes);
      guessButtons.forEach(function (b, i) { b.setAttribute("aria-pressed", READINGS[i].id === state.guess ? "true" : "false"); });
      if (!state.guess) { verdict.textContent = ""; return; }
      var right = state.guess === truth;
      verdict.textContent = (right ? "That matches the gel. " : "Look again. ") + READ_TEXT[truth];
      verdict.className = "w-big " + (right ? "mc-ok" : "mc-miss");
    }

    function draw() {
      lanes = E.runGel(state.sample, state.cycles);
      drawGel();
      drawCurves();
      drawVerdict();
    }
    redraws.push(draw);
    draw();
  }

  /* ---------------------------------------------------------------- demo 2: the study */

  var DESIGN = {
    apbio: {
      label: "AP Biology",
      steps: [
        ["Briefing", "Before the trip", "Lora Alberto of the Mill Creek Restoration Project gave the class the creek's history: a heavily polluted urban watershed in Cincinnati."],
        ["Pre-assessment", "March 24, 2009", "A pretest on the unit's content. The paper does not print its items or the number of students."],
        ["Field day", "Vorhees and Kheener Parks", "Students ran chemical tests (orthophosphate, pH, conductivity, dissolved oxygen, biological and chemical oxygen demand, nitrates), physical tests (temperature, turbidity, suspended solids), and biological tests (fecal coliform counts, benthic macroinvertebrates), and collected water and sediment. It had rained for several days, so runoff was high."],
        ["Lab", "Back at school", "Two teams, one for water and one for sediment, filtered the bacteria with a suction pump, broke the cells open, and isolated DNA by centrifuging."],
        ["PCR and gels", "Four primer sets", "Each team copied the 16S rRNA gene of Bacteroidales with four primer sets (general, cow, human, and pig), ran the products on precast agarose gels, and photographed them."],
        ["Conclusion", "From the gels", "The fecal bacteria were \"most likely\" from human sources, and the creek rated very poor overall."],
        ["Post-assessment", "April 21, 2009", "The same content, led by the teacher. The class average rose from 11% to 53%."],
        ["Sharing", "Beyond the class", "A poster, a presentation to a National Science Foundation (NSF) program director, and results sent to the restoration project."]
      ]
    },
    phys: {
      label: "Physical Science",
      steps: [
        ["Briefing", "Before the trip", "The same restoration-project history, plus an introduction to water-quality standards and parameters, fecal source tracking, DNA extraction, PCR, and gel electrophoresis."],
        ["Pre-assessment", "Three classes", "Bells 3, 4, and 5 took a pretest. Dates and items are not printed."],
        ["Stations", "Vorhees Park", "Groups of three to four ninth graders rotated through six stations (pH, dissolved oxygen, nitrates, temperature, phosphates, and turbidity) with a Hach kit or similar. Every group ran every test at least once, giving four replicates per parameter."],
        ["Spreadsheet", "Back at school", "Groups reported to the class and everyone entered the same data in Excel, alongside the site's historical data back to 2000. Students averaged the replicates and converted dissolved oxygen to percent saturation."],
        ["Classify", "Excellent to poor", "Each average went into a water-quality category; nitrates, for example, fell in the fair range."],
        ["Discuss", "Nine years of data", "How the site had changed, what might cause high values, what poor water quality means, and what could fix it."],
        ["Post-assessment", "Three classes", "The paper reports an increase of at least 40% for every class (p from 0.00017 down to 2.85 × 10⁻¹²)."]
      ]
    },
    step: {
      label: "Project STEP",
      steps: [
        ["The program", "NSF GK-12, since 2006", "Project STEP placed engineering and science graduate students (STEP Fellows) in Cincinnati-area high schools: 15 Fellows, 36 teachers, and more than 3,000 students over three years."],
        ["Preparation", "Summer and school year", "A three-credit summer course in instructional planning (standards, lesson planning, models of instruction, student culture, and assessment), then a one-credit field practicum each quarter."],
        ["The need", "Teacher first", "The teacher names a curriculum need. Here, a Civil and Environmental Engineering Fellow, Gina Lamendella, brought the molecular methods of her own research."],
        ["Drafting", "About six weeks", "The Fellow drafts the lesson with research advisors; a co-principal investigator checks the content and the coordinator approves it. Each Fellow builds at least five major lessons a year."],
        ["Assessment", "Built in", "Every lesson carries a pretest and a posttest, and the teacher leads the posttest."],
        ["Lesson review", "Table 1", "The authors coded the program's lessons for 14 components, from science content to career connections (the last demo on this page)."]
      ]
    }
  };

  function mountDesign(root) {
    var state = { which: "apbio", open: 0 };
    var seg = segmented("Class", Object.keys(DESIGN).map(function (k) { return { value: k, label: DESIGN[k].label }; }), state.which,
      function (v) { state.which = v; state.open = 0; draw(); });
    var list = el("div", { class: "mc-rows" });
    root.appendChild(seg);
    root.appendChild(list);
    root.appendChild(note("Steps, dates, and counts as printed in the paper. Click a step to read it."));

    function draw() {
      list.innerHTML = "";
      DESIGN[state.which].steps.forEach(function (s, i) {
        var on = state.open === i;
        var row = el("button", { type: "button", class: "mc-srow" + (on ? " mc-srow-on" : ""), "aria-expanded": on ? "true" : "false" }, [
          el("span", { class: "mc-snum", text: String(i + 1) }),
          el("span", { class: "mc-stitle", text: s[0] }),
          el("span", { class: "mc-swhen", text: s[1] })
        ]);
        row.addEventListener("click", function () { state.open = on ? -1 : i; draw(); });
        list.appendChild(row);
        if (on) list.appendChild(el("div", { class: "mc-sbody" }, [el("p", { text: s[2] })]));
      });
    }
    draw();
  }

  /* ---------------------------------------------------------------- demo 3: readings to ratings */

  function mountRate(root) {
    // Part A: the spreadsheet step
    var reps = { doMg: [9.8, 10.4, 9.6, 10.1], temp: [12.5, 13.0, 12.0, 12.5] };
    var units = { f: false };
    var inputs = { doMg: [], temp: [] };

    var gridA = el("div", { class: "mc-reps" });
    function repRow(key, label, step) {
      var row = el("div", { class: "mc-rep-row" }, [el("span", { class: "mc-rep-l", text: label })]);
      reps[key].forEach(function (v, i) {
        var inp = el("input", { type: "number", step: step, value: String(v), class: "mc-num", "aria-label": label + ", group " + (i + 1) });
        inp.addEventListener("input", function () { var x = parseFloat(inp.value); if (isFinite(x)) { reps[key][i] = x; calc(); } });
        inputs[key].push(inp);
        row.appendChild(inp);
      });
      var out = el("span", { class: "mc-rep-avg" });
      row.appendChild(out);
      gridA.appendChild(row);
      return out;
    }
    var head = el("div", { class: "mc-rep-row mc-rep-head" }, [el("span", { class: "mc-rep-l", text: "" })]);
    [1, 2, 3, 4].forEach(function (g) { head.appendChild(el("span", { class: "mc-rep-h", text: "Group " + g })); });
    head.appendChild(el("span", { class: "mc-rep-h", text: "Average" }));
    gridA.appendChild(head);
    var outDo = repRow("doMg", "Dissolved oxygen (mg/L)", "0.1");
    var outT = repRow("temp", "Temperature (°C)", "0.5");
    var resA = el("p", { class: "w-big", "aria-live": "polite" });
    var resA2 = note("", "ug grad res");

    root.appendChild(el("p", { class: "w-mono", text: "Step 1: average the four groups' readings, then convert dissolved oxygen to percent saturation" }));
    root.appendChild(gridA);
    root.appendChild(resA);
    root.appendChild(resA2);
    root.appendChild(note("The readings above are made-up examples to edit; the paper prints no measured values. Saturation uses the Benson and Krause equation for fresh water at sea-level pressure (as in Standard Methods 4500-O), which this page matches to the U.S. Geological Survey's published table at 0 to 30 °C."));

    function calc() {
      var mDo = E.mean(reps.doMg), mT = E.mean(reps.temp);
      outDo.textContent = mDo.toFixed(2);
      outT.textContent = mT.toFixed(1);
      var sat = E.doSaturation(mT), ps = 100 * mDo / sat;
      resA.textContent = "At " + mT.toFixed(1) + " °C, water can hold " + sat.toFixed(2) + " mg/L of oxygen, so " + mDo.toFixed(2) + " mg/L is " + ps.toFixed(0) + "% saturation.";
      resA2.innerHTML = "Spread across groups: dissolved oxygen standard deviation " + E.sd(reps.doMg).toFixed(2) + " mg/L, temperature " + E.sd(reps.temp).toFixed(2) + " °C. Cold water holds more oxygen than warm water, which is why a reading in mg/L means little until it is compared with what the water could hold at that temperature.";
    }
    calc();

    // Part B: the paper's ratings
    var ratings = E.RATINGS.map(function (r) { return { name: r.name, rating: r.rating, orig: r.rating }; });
    var state = { rule: "worst" };
    root.appendChild(el("p", { class: "w-mono mc-gap", text: "Step 2: rate each parameter, then the creek (AP Biology field tests, ratings as printed)" }));
    var ruleSeg = segmented("Combine ratings by", [
      { value: "average", label: "Average rating" },
      { value: "worst", label: "Worst rating" }
    ], state.rule, function (v) { state.rule = v; drawB(); });
    var listB = el("div", { class: "mc-rows" });
    var resB = el("p", { class: "w-big", "aria-live": "polite" });
    var reset = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "Reset to the paper's ratings" });
    reset.addEventListener("click", function () { ratings.forEach(function (r) { r.rating = r.orig; }); drawB(); });
    root.appendChild(el("div", { class: "w-actions" }, [el("span", { class: "w-mono", text: "Combine by" }), ruleSeg, reset]));
    root.appendChild(listB);
    root.appendChild(resB);
    root.appendChild(note("Click a dot to change a rating. The paper rates the creek very poor overall \"due to an extreme excess of fecal coliform bacteria from human sources\"; it does not say how it combined the parameters, so both rules here are the page's illustration."));

    function drawB() {
      listB.innerHTML = "";
      ratings.forEach(function (r) {
        var dots = el("span", { class: "mc-dots", role: "radiogroup", "aria-label": r.name + " rating" });
        E.SCALE.forEach(function (lvl) {
          var b = el("button", { type: "button", class: "mc-dot" + (lvl === r.rating ? " mc-dot-on" : ""), role: "radio", "aria-checked": lvl === r.rating ? "true" : "false", title: lvl, "aria-label": lvl });
          b.addEventListener("click", function () { r.rating = lvl; drawB(); });
          dots.appendChild(b);
        });
        listB.appendChild(el("div", { class: "mc-rrow" + (r.rating !== r.orig ? " mc-rrow-chg" : "") }, [
          el("span", { class: "mc-rname", text: r.name }), dots, el("span", { class: "mc-rlbl", text: r.rating })
        ]));
      });
      var overall = E.combine(ratings.map(function (r) { return r.rating; }), state.rule);
      var changed = ratings.some(function (r) { return r.rating !== r.orig; });
      resB.textContent = (state.rule === "worst" ? "Worst rating decides: " : "Average of the ratings: ") + overall + ". Paper's overall call: " + E.OVERALL + "." +
        (!changed && state.rule === "average" ? " Averaging lets seven good scores hide the bacteria." : "") +
        (!changed && state.rule === "worst" ? " The worst-rating rule points at fecal coliform, as the paper does." : "");
    }
    drawB();
  }

  /* ---------------------------------------------------------------- demo 4: scores */

  var TARGETS = {
    apbio: { label: "AP Biology", gain: 42, p: E.SCORES.apbio.p, gainNote: "the printed 11% to 53%" },
    bell4: { label: "Bell 4", gain: 40, p: 0.00017, gainNote: "the stated minimum gain of 40 points" },
    bell35: { label: "Bells 3 and 5", gain: 40, p: 2.85e-12, gainNote: "the stated minimum gain of 40 points" }
  };

  function mountScores(root) {
    var state = { mode: "points", target: "apbio", n: 20, design: "paired" };

    var barBox = el("div", { class: "mc-chart" });
    var modeSeg = segmented("Show the change as", [
      { value: "points", label: "Points gained" },
      { value: "relative", label: "Percent change" }
    ], state.mode, function (v) { state.mode = v; drawBars(); });
    modeSeg.setAttribute("data-levels", "hs ug grad res");
    var barRead = el("p", { class: "w-big", "aria-live": "polite" });

    var physRows = el("div", { class: "mc-rows" });
    E.SCORES.phys.forEach(function (c) {
      physRows.appendChild(el("div", { class: "mc-prow" }, [
        el("span", { class: "mc-pname", text: "Physical Science, " + c.name }),
        el("span", { class: "mc-pval", html: "p = " + sci(c.p) }),
        el("span", { class: "mc-pnote", text: "scores not printed" })
      ]));
    });

    root.appendChild(modeSeg);
    root.appendChild(barBox);
    root.appendChild(barRead);
    root.appendChild(physRows);
    root.appendChild(note("AP Biology averages and p from Figure 2; Physical Science p-values from Figure 3, read in the order printed (Bell 3, 4, 5). The paper names Student's t-test and does not report class sizes, spreads, or the Physical Science averages."));

    // graduate and researcher: what spread fits each printed p
    var gr = el("div", { "data-levels": "grad res" });
    gr.appendChild(el("p", { class: "w-mono mc-gap", text: "What spread would a class need? (computed by this page)" }));
    var tSeg = segmented("Result", Object.keys(TARGETS).map(function (k) { return { value: k, label: TARGETS[k].label }; }), state.target, function (v) { state.target = v; drawMap(); });
    var dSeg = segmented("Test", [{ value: "paired", label: "Paired t" }, { value: "two", label: "Two-sample t" }], state.design, function (v) { state.design = v; drawMap(); });
    gr.appendChild(el("div", { class: "w-actions" }, [tSeg, dSeg]));
    gr.appendChild(range("Students", 5, 35, 1, state.n, function (v) { state.n = v; drawMap(); }));
    var mapBox = el("div", { class: "mc-chart" });
    var mapRead = el("p", { class: "w-big", "aria-live": "polite" });
    gr.appendChild(mapBox);
    gr.appendChild(mapRead);
    gr.appendChild(note("For a gain of g points with n students, the paired test needs the standard deviation of each student's change to be g·√n / t, where t is the critical value that gives the printed p at n − 1 degrees of freedom; the two-sample test (equal groups, pooled spread) uses g / (t·√(2/n)) at 2n − 2. t-values match SciPy to 1.5 × 10⁻¹³ (relative) on 500 cases."));
    root.appendChild(gr);

    function drawBars() {
      barBox.innerHTML = "";
      var W = chartWidth(barBox), H = 170, m = { l: 92, r: 50, t: 10, b: 24 };
      var iw = W - m.l - m.r;
      var s = svg("svg", { class: "mc-svg", viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": "AP Biology average score: pre 11 percent, post 53 percent" });
      [0, 25, 50, 75, 100].forEach(function (v) {
        var x = m.l + iw * v / 100;
        s.appendChild(svg("line", { x1: x, x2: x, y1: m.t, y2: H - m.b, class: "c-grid" }));
        s.appendChild(svg("text", { x: x, y: H - 8, "text-anchor": "middle", class: "c-tick" }, v + "%"));
      });
      var rows = [["Pre (Mar 24)", E.SCORES.apbio.pre, "mc-pre"], ["Post (Apr 21)", E.SCORES.apbio.post, "mc-post"]];
      rows.forEach(function (r, i) {
        var y = m.t + 14 + i * 56;
        s.appendChild(svg("text", { x: m.l - 8, y: y + 20, "text-anchor": "end", class: "c-label" }, r[0]));
        s.appendChild(svg("rect", { x: m.l, y: y, width: iw * r[1] / 100, height: 30, class: r[2] }));
        s.appendChild(svg("text", { x: m.l + iw * r[1] / 100 + 6, y: y + 20, class: "c-label" }, r[1] + "%"));
      });
      barBox.appendChild(s);
      var g = E.SCORES.apbio.post - E.SCORES.apbio.pre;
      barRead.innerHTML = state.mode === "points"
        ? "AP Biology: " + E.SCORES.apbio.pre + "% to " + E.SCORES.apbio.post + "%, a gain of " + g + " points (p = " + sci(E.SCORES.apbio.p) + ")."
        : "AP Biology: the average rose to " + (E.SCORES.apbio.post / E.SCORES.apbio.pre).toFixed(1) + " times its starting value, a " + Math.round(100 * g / E.SCORES.apbio.pre) + "% increase. The same change reads as 42 points or 382%; \"an increase of at least 40%\" only fits the first reading.";
    }

    function drawMap() {
      mapBox.innerHTML = "";
      var T = TARGETS[state.target];
      var W = chartWidth(mapBox), H = 210, m = { l: 46, r: 14, t: 12, b: 32 };
      var iw = W - m.l - m.r, ih = H - m.t - m.b;
      var ns = []; for (var n = 5; n <= 35; n++) ns.push(n);
      var series = ["paired", "two"].map(function (d) { return ns.map(function (n) { return E.sdForP(T.gain, n, T.p, d).sd; }); });
      var yMax = 60;
      function X(n) { return m.l + iw * (n - 5) / 30; }
      function Y(v) { return m.t + ih * (1 - Math.min(v, yMax) / yMax); }
      var s = svg("svg", { class: "mc-svg", viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": "Standard deviation needed to reach p = " + T.p + " by class size" });
      [0, 20, 40, 60].forEach(function (v) {
        s.appendChild(svg("line", { x1: m.l, x2: W - m.r, y1: Y(v), y2: Y(v), class: "c-grid" }));
        s.appendChild(svg("text", { x: m.l - 6, y: Y(v) + 4, "text-anchor": "end", class: "c-tick" }, String(v)));
      });
      [5, 10, 15, 20, 25, 30, 35].forEach(function (n) { s.appendChild(svg("text", { x: X(n), y: H - 16, "text-anchor": "middle", class: "c-tick" }, String(n))); });
      s.appendChild(svg("text", { x: m.l + iw / 2, y: H - 2, "text-anchor": "middle", class: "c-label" }, "students"));
      s.appendChild(svg("text", { x: m.l + 4, y: m.t + 10, class: "c-label" }, "SD (points)"));
      ["paired", "two"].forEach(function (d, k) {
        var dd = series[k].map(function (v, i) { return (i ? "L" : "M") + X(ns[i]).toFixed(1) + " " + Y(v).toFixed(1); }).join(" ");
        s.appendChild(svg("path", { d: dd, class: "mc-line " + (d === state.design ? "mc-line-on" : "mc-line-off") }));
      });
      var r = E.sdForP(T.gain, state.n, T.p, state.design);
      s.appendChild(svg("circle", { cx: X(state.n), cy: Y(r.sd), r: 5, class: "mc-mark" }));
      mapBox.appendChild(s);
      mapRead.innerHTML = T.label + ", " + state.n + " students, " + (state.design === "paired" ? "paired" : "two-sample") + " t: a gain of " + T.gain + " points (" + T.gainNote + ") reaches p = " + sci(T.p) +
        " when the standard deviation is " + r.sd.toFixed(1) + " points (t = " + r.t.toFixed(2) + ", df = " + r.df + "). Smaller spreads give smaller p.";
    }

    redraws.push(drawBars, drawMap);
    drawBars();
    drawMap();
  }

  /* ---------------------------------------------------------------- demo 5: lessons */

  function mountLessons(root) {
    var N = 32;
    var rows = E.table1Counts(N);
    var state = { filter: "all" };
    var seg = segmented("Components", [
      { value: "all", label: "All 14" },
      { value: "stem", label: "STEM areas" },
      { value: "teach", label: "Teaching moves" }
    ], state.filter, function (v) { state.filter = v; draw(); });
    var box = el("div", { class: "mc-chart" });
    var legend = el("div", { class: "c-legend w-mono" }, [
      el("span", { class: "lg mc-lg-a", text: "Addressed" }),
      el("span", { class: "lg mc-lg-p", text: "Partially addressed" })
    ]);
    root.appendChild(seg);
    root.appendChild(box);
    root.appendChild(legend);
    root.appendChild(note("Table 1 as printed. At the undergraduate level and above, each bar also shows the whole number of lessons behind it: every one of the table's 28 percentages is a count out of 32, and 32 is the smallest number of lessons that fits all of them (checked from 1 to 500).", "ug grad res"));
    root.appendChild(note("Table 1 as printed: the share of Project STEP lessons that addressed each component fully or in part.", "public hs"));

    var checks = el("div", { "data-levels": "grad res" });
    checks.appendChild(el("p", { class: "w-mono mc-gap", text: "The text's percentages, checked against Table 1 (computed by this page)" }));
    var list = el("div", { class: "mc-rows" });
    checks.appendChild(list);
    checks.appendChild(note("The 97% and 82% rows ask which arrangements of 32 lessons can produce Table 1's column totals (Gale–Ryser theorem, every distribution of disciplines per lesson enumerated). The checker matches a brute-force search over every 0/1 matrix on 2,274 small cases."));
    root.appendChild(checks);

    function draw() {
      box.innerHTML = "";
      var shown = rows.filter(function (r) {
        return state.filter === "all" || (state.filter === "stem" ? !!r.stem : !r.stem);
      });
      var W = chartWidth(box), rowH = 26, m = { l: Math.min(190, W * 0.4), r: 64, t: 8, b: 22 };
      var H = m.t + m.b + shown.length * rowH, iw = W - m.l - m.r;
      var s = svg("svg", { class: "mc-svg", viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": "Table 1: share of lessons addressing each component" });
      [0, 25, 50, 75, 100].forEach(function (v) {
        var x = m.l + iw * v / 100;
        s.appendChild(svg("line", { x1: x, x2: x, y1: m.t, y2: H - m.b, class: "c-grid" }));
        s.appendChild(svg("text", { x: x, y: H - 6, "text-anchor": "middle", class: "c-tick" }, v + "%"));
      });
      shown.forEach(function (r, i) {
        var y = m.t + i * rowH + 4;
        s.appendChild(svg("text", { x: m.l - 6, y: y + 13, "text-anchor": "end", class: "c-label" }, r.name));
        var wa = iw * r.aPct / 100, wp = iw * r.pPct / 100;
        s.appendChild(svg("rect", { x: m.l, y: y, width: wa, height: 17, class: "mc-a" }));
        s.appendChild(svg("rect", { x: m.l + wa, y: y, width: wp, height: 17, class: "mc-p" }));
        var lab = svg("text", { x: m.l + wa + wp + 5, y: y + 13, class: "c-label", "data-levels": "public hs" }, String(Math.round(r.aPct)) + "%");
        s.appendChild(lab);
        s.appendChild(svg("text", { x: m.l + wa + wp + 5, y: y + 13, class: "c-label", "data-levels": "ug grad res" }, r.a + "+" + r.p));
      });
      box.appendChild(s);
    }

    function row(claim, check, ok) {
      list.appendChild(el("div", { class: "mc-crow" }, [
        el("span", { class: "mc-cclaim", text: claim }),
        el("span", { class: "mc-ccheck", html: check }),
        el("span", { class: "mc-cflag " + (ok ? "mc-ok" : "mc-miss"), text: ok ? "fits" : "does not fit" })
      ]));
    }

    function drawChecks() {
      list.innerHTML = "";
      var by = {}; rows.forEach(function (r) { by[r.name] = r; });
      var stem = ["Science", "Technology", "Engineering", "Math"].map(function (k) { return by[k]; });
      row("Science, technology, engineering, math: 78%, 66%, 62%, 59%",
        stem.map(function (r) { return r.a + "/32 = " + (100 * r.a / 32).toFixed(2) + "%"; }).join("; ") + ". Engineering's 62.50% appears as 62% (rounding half up would give 63%).", true);
      var part = stem.map(function (r) { return r.a + r.p; });
      var three = E.shareAtLeast(N, part, 3);
      row("97% at least partially cover three or more of the four areas",
        "Totals " + part.join(", ") + " allow " + three.min + " to " + three.max + " lessons with three or more; 31/32 = 96.9% is one of them.", three.min <= 31 && three.max >= 31);
      var full = stem.map(function (r) { return r.a; });
      var ratios = E.ratioTwoOfOne(N, full).filter(function (x) { return Math.round(100 * x.r) === 82; });
      row("82% of lessons with a fully addressed area cover two or more",
        ratios.length ? "Of every split the totals allow, only " + ratios.map(function (x) { return x.two + " of " + x.one; }).join(", ") + " rounds to 82%: 28 lessons fully address an area and 23 of them address two or more." : "No split rounds to 82%.", ratios.length > 0);
      var ms = by["Multiple learning styles"];
      row("More than 97% address multiple learning styles at least partly",
        ms.a + " + " + ms.p + " = " + (ms.a + ms.p) + " of 32 = " + (100 * (ms.a + ms.p) / 32).toFixed(2) + "%, just under 97%.", (ms.a + ms.p) / 32 > 0.97);
      var ap = by["Application"];
      row("More than 93% contain a real-world application", ap.a + "/32 = " + (100 * ap.a / 32).toFixed(2) + "% fully; all 32 at least partly.", ap.a / 32 > 0.93);
      var so = by["Social impact"];
      row("Nearly 60% deal with social impact", so.a + "/32 = " + (100 * so.a / 32).toFixed(2) + "%.", true);
      var mi = by["Misconceptions"];
      row("Only 16% address misconceptions", mi.a + "/32 = " + (100 * mi.a / 32).toFixed(2) + "% fully (another " + mi.p + " partly).", true);
      var ca = by["Career connection"];
      row("Less than one-third connect to careers", ca.a + "/32 = " + (100 * ca.a / 32).toFixed(2) + "% fully, slightly more than one-third (" + (ca.a + ca.p) + " at least partly).", ca.a / 32 < 1 / 3);
    }

    redraws.push(draw);
    draw();
    drawChecks();
  }

  /* ---------------------------------------------------------------- mount */

  function mount(id, fn) {
    var node = document.getElementById(id);
    if (!node) return;
    fn(node);
    node.classList.add("w-ready");
  }

  function start() {
    mount("mc-trace", mountTrace);
    mount("mc-design", mountDesign);
    mount("mc-rate", mountRate);
    mount("mc-scores", mountScores);
    mount("mc-lessons", mountLessons);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();

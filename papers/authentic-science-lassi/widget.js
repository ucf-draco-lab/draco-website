/*
  Widget for /papers/authentic-science-lassi/.
  Mount points in the page: #as-design, #as-projects, #as-arc, #as-voices, #as-tests.

  Demo 1 (Two weeks at LASSI) draws the design and participants as printed.
  Demo 2 (The teachers' research) is the one demo of the astronomy itself: the
  four projects the paper highlights, rebuilt as calculators. The Galilean-moon
  orbits are real (JPL mean elements); the nine spectra are simulated, because
  the WIRO spectra are not published. Every number the calculators produce is
  the page's own; the paper reports the methods, not the teachers' values.
  Demo 3 (The middle dip) places the paper's three dated quotes on the ten days.
  Demo 4 (In their words) draws Table 1.
  Demo 5 (What the tests showed) draws the stated test results; at the graduate
  and researcher levels it adds the page's threshold arithmetic and, at the
  researcher level, the companion 2021 paper's account of the same summer.
  All arithmetic lives in as-engine.js.
*/
(function () {
  "use strict";

  var E = window.LassiEngine;
  var D = E.DATA;
  var SVGNS = "http://www.w3.org/2000/svg";
  var state = {
    project: "jupiter", moon: 0, aErr: 0, pErr: 0, t: 0,
    dist: 2, mystery: 0.5,
    seed: 2015, pick: 0, calls: {}, reveal: false, H0: 70,
    source: -1, view: "all",
    n: 23, alpha: 0.00001, r: 0.5
  };

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
  function grp(x) { return String(Math.round(x)).replace(/\B(?=(\d{3})+(?!\d))/g, ","); }
  function sci(p) {
    if (p >= 0.001) return fix(p, 4);
    var e = Math.floor(Math.log(p) / Math.LN10), m = p / Math.pow(10, e);
    return fix(m, 1) + " × 10<sup>" + String(e).replace("-", "−") + "</sup>";
  }
  var WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
  function words(n) { return n < 10 ? WORDS[n] : String(n); }
  function cap(t) { return t.charAt(0).toUpperCase() + t.slice(1); }
  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }

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
      var attrs = { type: "button", class: "seg-option", role: "radio", "data-value": String(opt.value), text: opt.label };
      if (opt.levels) attrs["data-levels"] = opt.levels;
      var b = el("button", attrs);
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
  function slider(label, min, max, step, value, onInput, id) {
    var input = el("input", { type: "range", min: min, max: max, step: step, value: value, class: "as-range", id: id, "aria-label": label });
    input.addEventListener("input", function () { onInput(parseFloat(input.value)); });
    return input;
  }
  function row(k, v, levels) {
    var attrs = { class: "as-row" };
    if (levels) attrs["data-levels"] = levels;
    return el("div", attrs, [el("div", { class: "as-k", html: k }), el("div", { class: "as-v", html: v })]);
  }
  function button(text, onClick, ghost) {
    var b = el("button", { type: "button", class: "w-btn" + (ghost ? " as-ghost" : ""), text: text });
    b.addEventListener("click", onClick);
    return b;
  }

  // A labeled horizontal split bar (counts out of a total).
  function splitBar(g, x0, y, w, h, parts, classes) {
    var total = parts.reduce(function (a, p) { return a + p[1]; }, 0), x = x0;
    parts.forEach(function (p, i) {
      var pw = w * p[1] / total;
      g.appendChild(svg("rect", { x: x, y: y, width: Math.max(0, pw - 1), height: h, class: classes[i % classes.length] }));
      if (pw > 24) g.appendChild(svg("text", { x: x + 6, y: y + h / 2 + 4, class: "as-inbar" }, String(p[1])));
      x += pw;
    });
  }

  /* -------------------------------------------- demo 1: two weeks at LASSI */

  function mountDesign(root) {
    var gridWrap = el("div", { class: "as-chart" });
    var legend = el("div", { class: "c-legend" }, [
      el("span", { class: "as-lg" }, [el("span", { class: "as-sw as-research" }), "Research projects (mornings)"]),
      el("span", { class: "as-lg" }, [el("span", { class: "as-sw as-content" }), "Content sessions (afternoons)"]),
      el("span", { class: "as-lg" }, [el("span", { class: "as-sw as-observe" }), "STAR observing (evenings, week one)"]),
      el("span", { class: "as-lg" }, [el("span", { class: "as-sw as-share" }), "Poster session"])
    ]);
    var who = el("div", { class: "as-chart" });
    var rows = el("div", { class: "as-rows" });
    var src = el("p", { class: "w-source", text: "Source: Methodology of Research and Professional Development Experiences during LASSI. Every value is printed in the paper; percentages marked \"page\" are the page's arithmetic." });
    [gridWrap, legend, el("p", { class: "as-sub", text: "Who came" }), who, rows, src].forEach(function (n) { root.appendChild(n); });

    function drawGrid() {
      clear(gridWrap);
      var W = chartWidth(gridWrap), L = W < 480 ? 64 : 96, R = W - 6, top = 22;
      var rowsDef = [["Morning", "as-research"], ["Afternoon", "as-content"], ["Evening", "as-observe"]];
      var rh = 24, gap = 4, H = top + rowsDef.length * (rh + gap) + 30;
      var s = svg("svg", { viewBox: "0 0 " + W + " " + H, class: "as-svg", role: "img",
        "aria-label": "Ten program days in two weeks. Mornings: research projects. Afternoons: content sessions. Evenings of week one: STAR telescope observing. Day ten ends with a poster session." });
      var cw = (R - L) / 10;
      for (var d = 1; d <= 10; d++) {
        var x = L + (d - 1) * cw + (d > 5 ? 4 : 0) - (d > 5 ? 0 : 0);
        s.appendChild(svg("text", { x: x + cw / 2, y: 14, "text-anchor": "middle", class: "c-tick" }, (W < 480 ? "" : "Day ") + d));
      }
      rowsDef.forEach(function (rd, i) {
        var y = top + i * (rh + gap);
        s.appendChild(svg("text", { x: 0, y: y + rh / 2 + 4, class: "c-label" }, rd[0]));
        for (var d2 = 1; d2 <= 10; d2++) {
          var x2 = L + (d2 - 1) * cw;
          var cls = rd[1];
          if (i === 2 && d2 > 5) cls = "as-off";
          if (i === 1 && d2 === 10) cls = "as-share";
          s.appendChild(svg("rect", { x: x2 + 1, y: y, width: cw - 2, height: rh, class: cls }));
        }
      });
      var yb = top + 3 * (rh + gap) + 6;
      s.appendChild(svg("line", { x1: L, x2: L + 5 * cw - 2, y1: yb, y2: yb, class: "as-brace" }));
      s.appendChild(svg("line", { x1: L + 5 * cw + 2, x2: R, y1: yb, y2: yb, class: "as-brace" }));
      s.appendChild(svg("text", { x: L + 2.5 * cw, y: yb + 16, "text-anchor": "middle", class: "c-tick" }, "Week one"));
      s.appendChild(svg("text", { x: L + 7.5 * cw, y: yb + 16, "text-anchor": "middle", class: "c-tick" }, "Week two"));
      gridWrap.appendChild(s);
      gridWrap.appendChild(el("p", { class: "w-note", text: "WIRO, the 2.4 m telescope on Jelm Mountain, ran on the first half of three nights (sunset to about midnight), with three or four teachers each night; the paper does not give which nights, so the grid leaves them out. The exact day of each content session is not given either." }));
    }

    function drawWho() {
      clear(who);
      var W = chartWidth(who), L = W < 480 ? 92 : 150, R = W - 8, bh = 18;
      var bars = [["Gender", D.gender], ["Subject taught", D.subject], ["Grade band", D.band]];
      var H = bars.length * 44 + 4;
      var s = svg("svg", { viewBox: "0 0 " + W + " " + H, class: "as-svg", role: "img",
        "aria-label": "23 teachers: 18 female and five male; 21 science and two mathematics; 17 elementary and six secondary." });
      bars.forEach(function (b, i) {
        var y = 6 + i * 44;
        s.appendChild(svg("text", { x: 0, y: y + 13, class: "c-label" }, b[0]));
        splitBar(s, L, y, R - L, bh, b[1], ["as-c1", "as-c3"]);
        var x = L;
        b[1].forEach(function (p, j) {
          var pw = (R - L) * p[1] / D.n;
          var lab = W < 480 ? p[0].split(" ")[0] : p[0];
          s.appendChild(svg("text", { x: j === 0 ? x : R, y: y + bh + 13, "text-anchor": j === 0 ? "start" : "end", class: "c-tick" }, lab));
          x += pw;
        });
      });
      who.appendChild(s);
    }

    rows.appendChild(row("Recruited", "Email to about " + D.invited + " STEM teachers within " + D.radiusKm + " km (about " + D.radiusMi + " miles); " + D.n + " self-selected"));
    rows.appendChild(row("Elementary share", "17 of 23 = <strong>74%</strong> (the paper's figure; 73.9% before rounding)"));
    rows.appendChild(row("Response (page)", "23 of about 500 invited, roughly 5%", "ug grad res"));
    rows.appendChild(row("Teams", D.groups + " mixed-grade groups, each on its own research question; " + D.posters + " posters at a final community session"));
    rows.appendChild(row("Expert team", "Three physics and astronomy experts, one computer science and engineering expert, two graduate students, and one science education expert; five were active astronomy researchers"));
    rows.appendChild(row("Telescopes", "STAR: 16-inch Schmidt-Cassegrain on a campus roof, every evening of week one. WIRO: 2.4 m mirror at 2943.1 m (9656 ft), three half-nights"));
    rows.appendChild(row("Sessions", D.sessions.join(", "), "ug grad res"));

    drawGrid(); drawWho();
    redraws.push(drawGrid, drawWho);
  }

  /* -------------------------------------------- demo 2: the teachers' research */

  function mountProjects(root) {
    var picker = segmented("Project", D.projects.map(function (p) { return { value: p.id, label: p.name }; }), state.project, function (v) { state.project = v; draw(); });
    var about = el("p", { class: "w-note" });
    var body = el("div", { class: "as-pbody" });
    var src = el("p", { class: "w-source" });
    [el("div", { class: "w-actions" }, [picker]), about, body, src].forEach(function (n) { root.appendChild(n); });

    var timer = null;
    function stop() { if (timer) { clearInterval(timer); timer = null; } }

    function draw() {
      stop();
      clear(body);
      var p = D.projects.filter(function (q) { return q.id === state.project; })[0];
      about.innerHTML = "<strong>" + p.site + ":</strong> " + p.what;
      if (p.id === "jupiter") jupiter();
      else if (p.id === "angle") angle();
      else spectra(p.id === "hubble");
    }
    redraws.push(function () { if (!timer) draw(); });

    /* ---- the mass of Jupiter */
    function jupiter() {
      var moonCtrl = segmented("Moon", E.MOONS.map(function (m, i) { return { value: i, label: m.name }; }), state.moon, function (v) { state.moon = v; state.aErr = 0; state.pErr = 0; aIn.value = 0; pIn.value = 0; update(); });
      var view = el("div", { class: "as-chart" });
      var aIn = slider("Error in measured orbit size, percent", -20, 20, 1, state.aErr * 100, function (v) { state.aErr = v / 100; update(); }, "as-aerr");
      var pIn = slider("Error in measured period, percent", -20, 20, 1, state.pErr * 100, function (v) { state.pErr = v / 100; update(); }, "as-perr");
      var tIn = slider("Hours since first look", 0, 400, 1, state.t, function (v) { state.t = v; drawView(); }, "as-time");
      var play = button("Play nights", function () {
        if (timer) { stop(); play.textContent = "Play nights"; return; }
        play.textContent = "Pause";
        timer = setInterval(function () { state.t = (state.t + 2) % 400; tIn.value = state.t; drawView(); }, 60);
      });
      var out = el("div", { class: "as-rows" });
      [el("div", { class: "w-actions" }, [moonCtrl]), view,
        el("div", { class: "w-actions" }, [el("label", { for: "as-time", class: "as-k", text: "Time" }), tIn, play]),
        el("div", { class: "w-actions" }, [el("label", { for: "as-aerr", class: "as-k", text: "Orbit size error" }), aIn]),
        el("div", { class: "w-actions" }, [el("label", { for: "as-perr", class: "as-k", text: "Period error" }), pIn]),
        out].forEach(function (n) { body.appendChild(n); });

      function drawView() {
        clear(view);
        var W = chartWidth(view), H = 110, cx = W / 2, cy = 52;
        var maxA = E.MOONS[3].aKm / E.R_JUP_KM;
        var scale = (W / 2 - 14) / maxA;                    // pixels per Jupiter radius
        var s = svg("svg", { viewBox: "0 0 " + W + " " + H, class: "as-svg", role: "img",
          "aria-label": "Telescope view of Jupiter with its four Galilean moons in a line, at " + Math.round(state.t) + " hours." });
        s.appendChild(svg("line", { x1: 8, x2: W - 8, y1: cy, y2: cy, class: "c-grid" }));
        s.appendChild(svg("circle", { cx: cx, cy: cy, r: Math.max(4, scale), class: "as-planet" }));
        E.MOONS.forEach(function (m, i) {
          var a = m.aKm / E.R_JUP_KM, ph = 2 * Math.PI * (state.t / 24) / m.pDay + i * 1.3;
          var x = cx + a * scale * Math.sin(ph);
          var behind = Math.cos(ph) < 0 && Math.abs(a * Math.sin(ph)) < 1;
          s.appendChild(svg("circle", { cx: x, cy: cy, r: i === state.moon ? 4 : 3, class: i === state.moon ? "as-moon-on" : "as-moon", opacity: behind ? 0.25 : 1 }));
          if (i === state.moon) s.appendChild(svg("text", { x: x, y: cy - 10, "text-anchor": "middle", class: "c-label" }, m.name));
        });
        var day = Math.floor(state.t / 24) + 1;
        s.appendChild(svg("text", { x: 8, y: H - 10, class: "c-tick" }, "Night " + day + ", hour " + Math.round(state.t % 24) + (W < 520 ? " · real orbits, to scale" : " · positions from real orbits; Jupiter's disk to scale")));
        view.appendChild(s);
      }

      function update() {
        var m = E.MOONS[state.moon];
        var aTrue = m.aKm / (2 * E.R_JUP_KM), aMeas = aTrue * (1 + state.aErr), pMeas = m.pDay * (1 + state.pErr);
        var mass = E.keplerMass(m.aKm * (1 + state.aErr), pMeas).earth;
        var trueMass = E.keplerMass(m.aKm, m.pDay).earth;
        clear(out);
        out.appendChild(row("Farthest swing", fix(aMeas, 2) + " Jupiter diameters from the center (" + grp(m.aKm * (1 + state.aErr)) + " km)" + (state.aErr ? " · true " + fix(aTrue, 2) : "")));
        out.appendChild(row("Period", fix(pMeas, 3) + " days" + (state.pErr ? " · true " + fix(m.pDay, 3) : "")));
        out.appendChild(row("Kepler's third law", "M = a³ ÷ P² with a in AU and P in years gives the mass in Suns; × 332,946 for Earths", "hs ug grad res"));
        out.appendChild(row("Jupiter's mass", "<strong>" + fix(mass, 1) + "</strong> Earth masses" + (state.aErr || state.pErr ? " (" + (mass > trueMass ? "+" : "−") + fix(Math.abs(mass / trueMass - 1) * 100, 1) + "%)" : "") + " · reference 317.8"));
        out.appendChild(row("Why errors grow", "Mass goes as a³ ÷ P², so a 5% error in orbit size becomes a " + fix(E.keplerSensitivity(0.05, 0) * 100, 1) + "% error in mass, and a 5% error in period becomes " + fix(E.keplerSensitivity(0, 0.05) * 100, 1) + "%", "ug grad res"));
        src.textContent = "Orbits: JPL mean elements for the Galilean moons. With no error, each moon returns 317.9 Earth masses, within 0.02% of Jupiter's 317.83. The paper reports the method, not the teachers' measured values.";
        drawView();
      }
      update();
    }

    /* ---- angular size and distance */
    function angle() {
      var dIn = slider("Distance to the quarter, meters", 0.2, 10, 0.1, state.dist, function (v) { state.dist = v; update(); }, "as-dist");
      var mIn = slider("Measured angle of a mystery object, degrees", 0.1, 5, 0.05, state.mystery, function (v) { state.mystery = v; update(); }, "as-myst");
      var pic = el("div", { class: "as-chart" });
      var out = el("div", { class: "as-rows" });
      [el("div", { class: "w-actions" }, [el("label", { for: "as-dist", class: "as-k", text: "Quarter distance" }), dIn]), pic,
        el("div", { class: "w-actions" }, [el("label", { for: "as-myst", class: "as-k", text: "Mystery angle at 3 m" }), mIn]), out].forEach(function (n) { body.appendChild(n); });
      function update() {
        var L = E.QUARTER_MM / 1000, th = E.angularSize(L, state.dist);
        clear(pic);
        var W = chartWidth(pic), H = 90, x0 = 16, x1 = W - 40, cy = 45;
        var half = Math.min(40, Math.max(2, (x1 - x0) * Math.tan(th / 2) * 18));
        var s = svg("svg", { viewBox: "0 0 " + W + " " + H, class: "as-svg", role: "img", "aria-label": "A camera at left sights a quarter at right; the angle narrows as the quarter moves away." });
        s.appendChild(svg("rect", { x: x0 - 10, y: cy - 8, width: 14, height: 16, class: "as-c3" }));
        var xq = x0 + (x1 - x0) * (state.dist / 10);
        s.appendChild(svg("line", { x1: x0, y1: cy, x2: xq, y2: cy - half, class: "as-ray" }));
        s.appendChild(svg("line", { x1: x0, y1: cy, x2: xq, y2: cy + half, class: "as-ray" }));
        s.appendChild(svg("line", { x1: xq, y1: cy - half, x2: xq, y2: cy + half, class: "as-coin" }));
        s.appendChild(svg("text", { x: Math.min(xq + 6, W - 30), y: cy + 4, class: "c-label" }, fix(state.dist, 1) + " m"));
        s.appendChild(svg("text", { x: x0, y: H - 6, class: "c-tick" }, "Angle exaggerated 18× so it stays visible"));
        pic.appendChild(s);
        clear(out);
        out.appendChild(row("Quarter", "24.26 mm across (US Mint)"));
        out.appendChild(row("Angular size", "<strong>" + fix(th * E.RAD_DEG, 3) + "°</strong> = " + fix(th * E.RAD_DEG * 60, 1) + " arcminutes = " + fix(th, 5) + " radians"));
        out.appendChild(row("Rule", "a = L ÷ D: twice as far, half the angle (for small angles)", "hs ug grad res"));
        var mystL = E.sizeFromAngle(state.mystery / E.RAD_DEG, 3);
        out.appendChild(row("Mystery object", "At 3 m, " + fix(state.mystery, 2) + "° means it is about <strong>" + fix(mystL * 100, 1) + " cm</strong> across"));
        out.appendChild(row("Same rule, the Moon", "3,474 km across at 384,400 km: " + fix(E.angularSize(3474, 384400) * E.RAD_DEG, 2) + "°, about the size of the quarter at " + fix(E.QUARTER_MM / 1000 / E.angularSize(3474, 384400), 1) + " m", "ug grad res"));
        src.textContent = "Calculator built by the page from the paper's equation (a = L/D). The paper reports that the group succeeded and that small objects were harder to size; it gives no measured values.";
      }
      update();
    }

    /* ---- classifying spectra and Hubble's law */
    function spectra(hubbleFirst) {
      var spec = E.simulateSpectra(state.seed);
      var cards = el("div", { class: "w-actions" });
      var plot = el("div", { class: "as-chart" });
      var callRow = el("div", { class: "w-actions" });
      var tally = el("div", { class: "as-rows" });
      var hub = el("div", { class: "as-hub" });
      var h0 = segmented("Hubble constant", [{ value: 67.4, label: "H₀ 67.4" }, { value: 70, label: "H₀ 70" }, { value: 73, label: "H₀ 73.0" }], state.H0, function (v) { state.H0 = v; drawHubble(); });
      var actions = el("div", { class: "w-actions" }, [
        button("Reveal", function () { state.reveal = true; drawCards(); drawTally(); drawHubble(); }),
        button("New spectra", function () { state.seed = (state.seed * 7 + 11) % 100000; state.calls = {}; state.reveal = false; state.pick = 0; spec = E.simulateSpectra(state.seed); drawCards(); drawPlot(); drawTally(); drawHubble(); }, true)
      ]);
      [cards, plot, callRow, actions, tally, el("p", { class: "as-sub", text: "Hubble's law" }), el("div", { class: "w-actions" }, [h0]), hub].forEach(function (n) { body.appendChild(n); });

      ["star", "galaxy", "quasar"].forEach(function (k) {
        callRow.appendChild(button("Call it a " + k, function () { state.calls[state.pick] = k; drawCards(); drawTally(); drawHubble(); }, true));
      });

      function drawCards() {
        clear(cards);
        spec.forEach(function (sp, i) {
          var lab = String(i + 1) + (state.calls[i] ? " · " + state.calls[i].charAt(0).toUpperCase() : "");
          if (state.reveal && state.calls[i]) lab += state.calls[i] === sp.kind ? " ✓" : " ✗";
          var b = el("button", { type: "button", class: "seg-option as-card", "aria-pressed": i === state.pick ? "true" : "false", text: lab, "aria-label": "Spectrum " + (i + 1) });
          b.addEventListener("click", function () { state.pick = i; drawCards(); drawPlot(); });
          cards.appendChild(b);
        });
      }
      function drawPlot() {
        clear(plot);
        var sp = spec[state.pick];
        var W = chartWidth(plot), H = 170, L = 36, R = W - 8, T = 8, B = H - 28;
        var max = Math.max.apply(null, sp.flux) * 1.08;
        var s = svg("svg", { viewBox: "0 0 " + W + " " + H, class: "as-svg", role: "img", "aria-label": "Simulated spectrum " + (state.pick + 1) + ", brightness against wavelength from 380 to 920 nanometers." });
        [400, 500, 600, 700, 800, 900].forEach(function (w) {
          var x = L + (R - L) * (w - 380) / 540;
          s.appendChild(svg("line", { x1: x, x2: x, y1: T, y2: B, class: "c-grid" }));
          s.appendChild(svg("text", { x: x, y: B + 14, "text-anchor": "middle", class: "c-tick" }, String(w)));
        });
        s.appendChild(svg("text", { x: R, y: H - 2, "text-anchor": "end", class: "c-tick" }, "Wavelength (nm)"));
        s.appendChild(svg("text", { x: 2, y: T + 10, class: "c-tick" }, "Flux"));
        var d = sp.grid.map(function (w, i) {
          return (i ? "L" : "M") + fix(L + (R - L) * (w - 380) / 540, 1).replace("−", "-") + " " + fix(B - (B - T) * sp.flux[i] / max, 1).replace("−", "-");
        }).join(" ");
        s.appendChild(svg("path", { d: d, class: "as-spec" }));
        if (state.reveal) sp.lines.forEach(function (ln) {
          var x = L + (R - L) * (ln.obs - 380) / 540;
          s.appendChild(svg("line", { x1: x, x2: x, y1: T, y2: B, class: "as-linemark" }));
          s.appendChild(svg("text", { x: x + 3, y: T + 10, class: "c-label" }, ln.name));
        });
        s.appendChild(svg("text", { x: R, y: T + 10, "text-anchor": "end", class: "c-tick" }, "Simulated"));
        plot.appendChild(s);
      }
      function drawTally() {
        clear(tally);
        var made = Object.keys(state.calls).length, right = 0;
        Object.keys(state.calls).forEach(function (i) { if (state.calls[i] === spec[i].kind) right++; });
        tally.appendChild(row("Your calls", made + " of 9 made" + (state.reveal ? ", <strong>" + right + "</strong> right" : "")));
        tally.appendChild(row("Clues", "Stars: a smooth hump with hydrogen absorption dips at their lab wavelengths. Galaxies: a starlight step near 400 nm and calcium dips, shifted a little. Quasars: a blue slope with a few wide emission peaks, shifted far", "hs ug grad res"));
        tally.appendChild(row("The teachers' result", "Three stars, three galaxies, and three quasars (as printed)"));
      }
      function drawHubble() {
        clear(hub);
        var rowsOut = spec.map(function (sp, i) { return { i: i, sp: sp }; }).filter(function (o) { return o.sp.kind !== "star"; });
        if (!state.reveal) {
          hub.appendChild(el("p", { class: "w-note", text: "Press Reveal to mark the known lines; the page then measures each galaxy's and quasar's shift the way the teachers did." }));
          return;
        }
        var tbl = el("table", { class: "as-table" });
        var head = el("tr", {}, ["Spectrum", "Kind", "Line", "λ₀ (nm)", "λ (nm)", "z", "v = cz (km/s)", "d = v/H₀ (Mpc)"].map(function (h) { return el("th", { text: h }); }));
        var headRel = el("th", { text: "Relativistic v (km/s)", "data-levels": "grad res" });
        head.appendChild(headRel);
        tbl.appendChild(head);
        rowsOut.forEach(function (o) {
          var h = E.hubble(o.sp.ref.obs, o.sp.ref.rest, state.H0);
          var tr = el("tr", {}, [String(o.i + 1), cap(o.sp.kind), o.sp.ref.name, fix(o.sp.ref.rest, 1), fix(o.sp.ref.obs, 1), fix(h.z, 3), grp(h.v), grp(h.d)].map(function (t) { return el("td", { text: t }); }));
          tr.appendChild(el("td", { text: grp(h.vRel), "data-levels": "grad res" }));
          if (h.v > E.C_KMS) tr.setAttribute("class", "as-flag");
          tbl.appendChild(tr);
        });
        hub.appendChild(el("div", { class: "as-scroll" }, [tbl]));
        hub.appendChild(el("p", { class: "w-note", html: "The paper's equations, v/c = (λ − λ₀)/λ₀ and d = v/H₀, applied by the page to simulated spectra. The paper names H₀ only as \"the current best-measured value,\" so the page offers three. <span data-levels=\"grad res\">Rows in accent have z &gt; 1, where v = cz exceeds the speed of light; the relativistic column (and, properly, a cosmological distance) is needed there.</span>" }));
      }
      drawCards(); drawPlot(); drawTally(); drawHubble();
      src.textContent = "Spectra simulated by the page (the WIRO spectra are not published); line wavelengths are standard rest values. Seed " + state.seed + ".";
      if (hubbleFirst && !state.reveal) {
        hub.insertBefore(el("p", { class: "w-note", text: "Sort the spectra first; the Hubble table fills in once you press Reveal." }), hub.firstChild);
      }
    }

    draw();
  }

  /* -------------------------------------------- demo 3: the middle dip */

  function mountArc(root) {
    var chart = el("div", { class: "as-chart" });
    var quote = el("blockquote", { class: "as-quote" });
    var pick = segmented("Point in the program", D.arc.map(function (a, i) { return { value: i, label: "Day " + a.day + " · " + a.phase }; }), 1, function (v) { show(v); });
    var src = el("p", { class: "w-source", text: "Source: Results of Research and Discussion. The three quotes and their days are printed; the shading marks the three phases the paper describes and is not a measured score." });
    [el("div", { class: "w-actions" }, [pick]), chart, quote, src].forEach(function (n) { root.appendChild(n); });
    var current = 1;

    function draw() {
      clear(chart);
      var W = chartWidth(chart), L = 8, R = W - 8, H = 96, cw = (R - L) / 10;
      var s = svg("svg", { viewBox: "0 0 " + W + " " + H, class: "as-svg", role: "img",
        "aria-label": "Ten days: engaged at the start, a dip in the middle, and re-engaged at the end. Quotes on days three, six, and ten." });
      var phases = [[1, 4, "Engaged", "as-phase1"], [4, 8, "Dip", "as-phase2"], [8, 11, "Re-engaged", "as-phase1"]];
      phases.forEach(function (p) {
        var x = L + (p[0] - 1) * cw, w = (p[1] - p[0]) * cw;
        s.appendChild(svg("rect", { x: x, y: 18, width: w - 2, height: 40, class: p[3] }));
        s.appendChild(svg("text", { x: x + 6, y: 14, class: "c-label" }, p[2]));
      });
      // Qualitative path: high, low, high.
      var pts = [[1, 26], [3, 24], [5, 44], [6, 50], [7, 44], [9, 26], [10, 22]];
      s.appendChild(svg("path", { d: pts.map(function (p, i) { return (i ? "L" : "M") + (L + (p[0] - 0.5) * cw) + " " + p[1]; }).join(" "), class: "as-arcline" }));
      D.arc.forEach(function (a, i) {
        var x = L + (a.day - 0.5) * cw, y = pts.filter(function (p) { return p[0] === a.day; })[0][1];
        s.appendChild(svg("circle", { cx: x, cy: y, r: i === current ? 6 : 4, class: i === current ? "as-moon-on" : "as-moon" }));
      });
      for (var d = 1; d <= 10; d++) s.appendChild(svg("text", { x: L + (d - 0.5) * cw, y: 76, "text-anchor": "middle", class: "c-tick" }, String(d)));
      s.appendChild(svg("text", { x: L, y: 92, class: "c-tick" }, "Program day · shape as described, not measured"));
      chart.appendChild(s);
    }
    function show(i) {
      current = i;
      var a = D.arc[i];
      quote.innerHTML = "";
      quote.appendChild(el("p", { text: "“" + a.text + "”" }));
      quote.appendChild(el("p", { class: "w-mono", text: a.phase + " of the PD, day " + a.day + ", as quoted in Results of Research" }));
      draw();
    }
    show(1);
    redraws.push(draw);
  }

  /* -------------------------------------------- demo 4: in their words */

  function mountVoices(root) {
    var srcCtrl = segmented("Data source", [{ value: -1, label: "All sources" }].concat(D.sources.map(function (s, i) { return { value: i, label: s }; })), state.source, function (v) { state.source = v; draw(); });
    var viewCtrl = segmented("Themes", [{ value: "all", label: "All eight themes" }, { value: "asks", label: "What they asked for" }, { value: "gains", label: "What they gained" }], state.view, function (v) { state.view = v; draw(); });
    var list = el("div", { class: "as-rows" });
    var src = el("p", { class: "w-source", text: "Source: Table 1, qualitative samples by theme and data source. The two groupings follow the benefits and concerns named in Results of Research; assigning each theme to one group is the page's reading." });
    [el("div", { class: "w-actions" }, [srcCtrl]), el("div", { class: "w-actions" }, [viewCtrl]), list, src].forEach(function (n) { root.appendChild(n); });
    var asks = ["Project guidance", "Concrete activities for the PD", "Classroom support (activities and personnel)", "Time management", "Content knowledge"];
    var gains = ["Classroom lesson plans", "Expert interaction", "Surprises", "Content knowledge"];
    function draw() {
      clear(list);
      D.table1.forEach(function (t) {
        if (state.view === "asks" && asks.indexOf(t.theme) < 0) return;
        if (state.view === "gains" && gains.indexOf(t.theme) < 0) return;
        var html = t.q.map(function (q, i) {
          if (state.source >= 0 && state.source !== i) return "";
          return "<span class=\"as-q\">“" + q + "” <span class=\"w-mono\">" + D.sources[i] + "</span></span>";
        }).join("");
        list.appendChild(row(t.theme, html));
      });
    }
    draw();
  }

  /* -------------------------------------------- demo 5: what the tests showed */

  function mountTests(root) {
    var chart = el("div", { class: "as-chart" });
    var rows = el("div", { class: "as-rows" });
    var adv = el("div", { class: "as-adv", "data-levels": "grad res" });
    var res = el("div", { class: "as-adv", "data-levels": "res" });
    var src = el("p", { class: "w-source", text: "Source: Results of Research. Table 3 and Figure 2 hold the per-test statistics; they could not be read for this page, so no test is placed at its own value." });
    [chart, rows, adv, res, src].forEach(function (n) { root.appendChild(n); });

    function drawChart() {
      clear(chart);
      var W = chartWidth(chart), L = 8, R = W - 8, H = 84, gap = 6, bw = (R - L - gap * 7) / 8;
      var s = svg("svg", { viewBox: "0 0 " + W + " " + H, class: "as-svg", role: "img",
        "aria-label": "Eight pre-to-post content tests: all eight significant at p below 0.05, five of them at p below 0.00001, all with effect size of at least 0.8." });
      for (var i = 0; i < 8; i++) {
        var x = L + i * (bw + gap);
        s.appendChild(svg("rect", { x: x, y: 14, width: bw, height: 30, class: i < 5 ? "as-c2" : "as-c1" }));
        s.appendChild(svg("text", { x: x + bw / 2, y: 33, "text-anchor": "middle", class: "as-inbar" }, "Test"));
      }
      s.appendChild(svg("text", { x: L, y: 10, class: "c-label" }, "Eight tests, each given before and after its session"));
      s.appendChild(svg("text", { x: L, y: 60, class: "c-tick" }, "Accent: five at p < 0.00001 (which five is not stated; order is arbitrary)"));
      s.appendChild(svg("text", { x: L, y: 76, class: "c-tick" }, "All eight: p < 0.05 and effect size d ≥ 0.8"));
      chart.appendChild(s);
    }
    rows.appendChild(row("Topics named", D.testTopics.join("; ") + " (seven labels for eight tests)"));
    rows.appendChild(row("Null hypothesis", "No change from pre to post: rejected for every test"));
    rows.appendChild(row("Effect size", "Large (d ≥ 0.8) on all eight; the paper cites Sullivan and Feinn (2012) for reporting effect sizes", "ug grad res"));
    rows.appendChild(row("Not reported in the readable text", "Number of teachers per test, items per test, means, standard deviations, t values, and correlations", "ug grad res"));

    // Graduate and researcher: what the printed thresholds require of a paired test.
    var nIn = slider("Teachers taking a test", 5, 30, 1, state.n, function (v) { state.n = v; drawAdv(); }, "as-n");
    var rIn = slider("Pre-post correlation r", 0, 0.95, 0.05, state.r, function (v) { state.r = v; drawAdv(); }, "as-r");
    var advOut = el("div", { class: "as-rows" });
    adv.appendChild(el("p", { class: "as-sub", text: "Page analysis: what the thresholds require" }));
    adv.appendChild(el("div", { class: "w-actions" }, [el("label", { for: "as-n", class: "as-k", text: "Teachers (n)" }), nIn]));
    adv.appendChild(el("div", { class: "w-actions" }, [el("label", { for: "as-r", class: "as-k", text: "Correlation r" }), rIn]));
    adv.appendChild(advOut);
    function drawAdv() {
      clear(advOut);
      var n = state.n;
      [0.05, 0.00001].forEach(function (a) {
        var th = E.pairedThresholds(n, a);
        advOut.appendChild(row("p < " + (a === 0.05 ? "0.05" : "0.00001"), "needs |t| ≥ <strong>" + fix(th.t, 2) + "</strong> on " + (n - 1) + " df, so d<sub>z</sub> ≥ " + fix(th.dz, 2)));
      });
      var p8 = E.pFromDz(0.8, n);
      advOut.appendChild(row("d = 0.8 read as d<sub>z</sub>", "t = " + fix(0.8 * Math.sqrt(n), 2) + ", p = " + sci(p8) + (p8 < 0.05 ? ": d ≥ 0.8 alone already clears p < 0.05" : ": not enough for p < 0.05 at this n")));
      var dz5 = E.pairedThresholds(n, 0.00001).dz;
      advOut.appendChild(row("d = 0.8 read as d<sub>av</sub>", "With r = " + fix(state.r, 2) + ", d<sub>z</sub> = d<sub>av</sub> ÷ √(2(1 − r)) = " + fix(0.8 / Math.sqrt(2 * (1 - state.r)), 2) + "; p < 0.00001 needs d<sub>av</sub> ≥ " + fix(E.dAvFromDz(dz5, state.r), 2)));
      advOut.appendChild(el("p", { class: "w-note", text: "Computed by the page for a two-sided paired t test with n teachers; the paper does not name its standardizer or give n per test. Start at n = 23, the full cohort." }));
    }
    drawAdv();

    // Researcher: the companion paper's account of the same summer.
    res.appendChild(el("p", { class: "as-sub", text: "The same summer in the 2021 companion paper" }));
    var c = D.companion2021;
    var tbl = el("table", { class: "as-table" });
    tbl.appendChild(el("tr", {}, ["2021 Table 4 topic (2015 LASSI)", "2021 result"].map(function (h) { return el("th", { text: h }); })));
    c.topics.forEach(function (t) { tbl.appendChild(el("tr", {}, [el("td", { text: t[0] }), el("td", { text: t[1] ? "p < 0.0001" : "Not significant" })])); });
    res.appendChild(el("div", { class: "as-scroll" }, [tbl]));
    var cr = el("div", { class: "as-rows" });
    cr.appendChild(row("Cohort", "2016 paper: 23 teachers (18 female, 17 elementary). 2021 paper: 22 teachers, 21 sampled (16 female, 16 elementary)"));
    cr.appendChild(row("Content tests", "2016 paper: eight tests, all p < 0.05, five p < 0.00001. 2021 paper: seven topics, five at p < 0.0001 and two not significant"));
    res.appendChild(cr);
    res.appendChild(el("p", { class: "w-note", text: "From Education Sciences 11(1):21 (2021), Tables 1 and 4, which this site also presents at /papers/astronomy-stem-pld/. Placing the two side by side is the page's; the authors can say whether the counts and analyses differ by design." }));

    drawChart();
    redraws.push(drawChart);
  }

  /* ---------------------------------------------------------------- mount */

  function mount(id, fn) {
    var node = document.getElementById(id);
    if (!node) return;
    fn(node);
    node.classList.add("w-ready");
  }
  function init() {
    mount("as-design", mountDesign);
    mount("as-projects", mountProjects);
    mount("as-arc", mountArc);
    mount("as-voices", mountVoices);
    mount("as-tests", mountTests);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();

/*
  STEM partnerships widget for /papers/stem-partnerships/.
  Mount points in the page: #sp-ladder, #sp-design, #sp-talk, #sp-balloon.

  Demo 1 asks the reader to guess which of three teams built the strongest
         partnership, then places all three on Mullinix's ladder as the paper
         did, with the evidence the paper gives for each.
  Demo 2 walks the study design: two cases a decade apart, who took part
         (Tables 1 and 2), and what each case collected.
  Demo 3 lists the negotiations the paper reports (lessons, time, supplies) and
         the four themes of partnership meaning across the three teams.
  Demo 4 is the one tool demo: the Speed of Sound team's balloon physics, the
         1976 Standard Atmosphere the students' graphs can be checked against.
  Study data and the atmosphere live in sp-engine.js.
*/
(function () {
  "use strict";

  var E = window.PartnershipEngine;
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

  function teamByKey(k) { return E.TEAMS.filter(function (t) { return t.key === k; })[0]; }

  /* ---------------------------------------------------------------- demo 1: the ladder */

  function mountLadder(root) {
    var state = { guess: null, team: "coleman" };

    root.appendChild(el("p", { class: "w-source", text: "Paper, Sections 3.1 to 3.3: three teams, two cases, one framework" }));
    var ask = el("p", { class: "w-big", text: "Which team built the strongest partnership?" });
    root.appendChild(ask);

    var picks = el("div", { class: "sp-picks" });
    E.TEAMS.forEach(function (t) {
      var b = el("button", { type: "button", class: "sp-pick", "data-team": t.key }, [
        el("span", { class: "sp-pick-name", text: t.name }),
        el("span", { class: "sp-pick-meta", text: t.years + " · " + t.setting }),
        el("span", { class: "sp-pick-who", text: t.who }),
        el("span", { class: "sp-pick-time", text: t.evidence[0].text })
      ]);
      b.addEventListener("click", function () {
        state.guess = t.key; state.team = t.key; seg.set(t.key); render();
      });
      picks.appendChild(b);
    });
    root.appendChild(picks);

    var verdict = el("p", { class: "w-big", "aria-live": "polite" });
    var chartBox = el("div", { class: "sp-chart" });
    var segWrap = el("div", { class: "w-actions" });
    var seg = segmented("Team", E.TEAMS.map(function (t) { return { value: t.key, label: t.name }; }), state.team, function (v) { state.team = v; render(); });
    segWrap.appendChild(el("span", { class: "w-mono", text: "Evidence for" }));
    segWrap.appendChild(seg);
    var rows = el("div", { class: "sp-rows" });
    var reveal = el("div", { class: "sp-reveal", hidden: "" }, [verdict, chartBox, segWrap, rows]);
    root.appendChild(reveal);

    root.appendChild(note("Positions on the ladder show the level the paper assigns to each team. The paper gives no score; the Speed of Sound marker sits partway up the pre-partnership rung because the authors describe it as pre-partnership “with limited little-p aspects.”", "ug grad res"));

    function drawLadder() {
      chartBox.innerHTML = "";
      var W = chartWidth(root), H = 168;
      var narrow = W < 520, left = narrow ? 70 : 170, right = W - 14, rungH = 46, top = 16;
      var s = svg("svg", { class: "sp-svg", viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": "Mullinix's three partnership levels with the three teams placed as the paper places them." });
      // rungs, top = big P
      var rungs = E.LADDER.slice().reverse();
      rungs.forEach(function (r, i) {
        var y = top + i * rungH;
        s.appendChild(svg("rect", { x: left, y: y, width: right - left, height: rungH - 6, class: "sp-rung sp-rung-" + r.key }));
        s.appendChild(svg("text", { x: left - 8, y: y + rungH / 2, class: "c-label", "text-anchor": "end", "dominant-baseline": "middle" }, narrow ? r.short : r.label));
      });
      // empty big P note
      s.appendChild(svg("text", { x: left + 10, y: top + rungH / 2 - 3, class: "c-tick", "dominant-baseline": "middle" }, "No team reached this level"));
      // markers: x spread by team, y by level
      var xs = { coleman: 0.2, cosmic: 0.5, sound: 0.8 };
      E.TEAMS.forEach(function (t) {
        var rungIndex = t.level === "p" ? 1 : 2; // 0 = big P row
        var yTop = top + rungIndex * rungH, hRow = rungH - 6;
        var frac = t.level === "pre" ? Math.min(1, t.pos) : 0.5;
        var cy = yTop + hRow - 10 - frac * (hRow - 20);
        var cx = left + xs[t.key] * (right - left);
        var on = t.key === state.team;
        s.appendChild(svg("circle", { cx: cx, cy: cy, r: on ? 7 : 5, class: "sp-dot" + (on ? " sp-dot-on" : "") }));
        s.appendChild(svg("text", { x: cx + 10, y: cy, class: "c-label" + (on ? " sp-lab-on" : ""), "dominant-baseline": "middle" }, W < 420 ? t.name.split(" ")[0] : t.name));
      });
      chartBox.appendChild(s);
    }

    function render() {
      if (!state.guess) return;
      reveal.hidden = false;
      Array.prototype.forEach.call(picks.children, function (b) {
        b.classList.toggle("sp-pick-on", b.getAttribute("data-team") === state.guess);
      });
      var best = "cosmic";
      var g = teamByKey(state.guess);
      verdict.textContent = state.guess === best
        ? "Yes. The paper rates Cosmic Radiation the strongest: a partnership with a little p."
        : "The paper rates Cosmic Radiation the strongest. It places " + g.name + " at " + g.verdict.charAt(0).toLowerCase() + g.verdict.slice(1) + ".";
      drawLadder();
      var t = teamByKey(state.team);
      rows.innerHTML = "";
      rows.appendChild(el("div", { class: "sp-row sp-row-head" }, [
        el("span", { class: "sp-dim", text: "Level" }),
        el("span", { class: "sp-txt", text: t.verdict })
      ]));
      t.evidence.forEach(function (ev) {
        rows.appendChild(el("div", { class: "sp-row" }, [
          el("span", { class: "sp-dim", text: ev.dim }),
          el("span", { class: "sp-txt", text: ev.text })
        ]));
      });
    }
    redraws.push(function () { if (state.guess) drawLadder(); });
  }

  /* ---------------------------------------------------------------- demo 2: study design */

  function mountDesign(root) {
    var state = { open: 1, team: "all" };
    root.appendChild(el("p", { class: "w-source", text: "Paper, Section 2 and Tables 1 and 2: two qualitative cases, nearly a decade apart" }));

    var steps = el("div", { class: "sp-steps" });
    root.appendChild(steps);

    function renderSteps() {
      steps.innerHTML = "";
      E.STEPS.forEach(function (st, i) {
        var on = state.open === i;
        var b = el("button", { type: "button", class: "sp-srow" + (on ? " sp-srow-on" : ""), "aria-expanded": on ? "true" : "false" }, [
          el("span", { class: "sp-snum", text: String(i + 1) }),
          el("span", { class: "sp-stitle", text: st.title }),
          el("span", { class: "sp-swhen", text: st.when })
        ]);
        b.addEventListener("click", function () { state.open = on ? -1 : i; renderSteps(); });
        steps.appendChild(b);
        if (on) steps.appendChild(el("div", { class: "sp-sbody" }, [el("p", { text: st.body })]));
      });
    }
    renderSteps();

    var head = el("div", { class: "w-actions" });
    head.appendChild(el("span", { class: "w-mono", text: "Who took part" }));
    head.appendChild(segmented("Team", [{ value: "all", label: "All ten" }].concat(E.TEAMS.map(function (t) { return { value: t.key, label: t.name }; })), state.team, function (v) { state.team = v; renderPeople(); }));
    root.appendChild(head);
    var people = el("div", { class: "sp-people" });
    root.appendChild(people);
    var facts = el("p", { class: "w-mono" });
    root.appendChild(facts);

    function renderPeople() {
      people.innerHTML = "";
      people.appendChild(el("div", { class: "sp-prow sp-prow-head" }, [
        el("span", { text: "Pseudonym" }), el("span", { text: "Team" }), el("span", { text: "Role" }), el("span", { text: "Background", "data-levels": "hs ug grad res" })
      ]));
      E.PEOPLE.forEach(function (p) {
        if (state.team !== "all" && p.team !== state.team) return;
        people.appendChild(el("div", { class: "sp-prow" }, [
          el("span", { class: "sp-pname", text: p.name }),
          el("span", { text: teamByKey(p.team).name }),
          el("span", { class: "sp-role sp-role-" + p.role.split(" ")[0].toLowerCase(), text: p.role }),
          el("span", { class: "sp-pdetail", text: p.detail + " · " + p.gender.toLowerCase(), "data-levels": "hs ug grad res" })
        ]));
      });
      var list = state.team === "all" ? E.TEAMS : [teamByKey(state.team)];
      facts.textContent = list.map(function (t) {
        return t.name + ": " + t.lessons + " lessons" + (t.classMin ? ", " + t.classMin + "-minute classes" : "") + ", " + t.ages;
      }).join(" · ");
    }
    renderPeople();
  }

  /* ---------------------------------------------------------------- demo 3: negotiations and themes */

  function mountTalk(root) {
    var state = { topic: "all" };
    root.appendChild(el("p", { class: "w-source", text: "Paper, Sections 3.4 and 4: what partners negotiated, and how far" }));
    var head = el("div", { class: "w-actions" });
    head.appendChild(el("span", { class: "w-mono", text: "Topic" }));
    head.appendChild(segmented("Topic", [
      { value: "all", label: "All" }, { value: "lessons", label: "Lessons" }, { value: "time", label: "Time" }, { value: "supplies", label: "Supplies" }
    ], state.topic, function (v) { state.topic = v; render(); }));
    root.appendChild(head);

    var tally = el("div", { class: "sp-chart" });
    var list = el("div", { class: "sp-eps" });
    root.appendChild(tally);
    root.appendChild(list);
    root.appendChild(note("Each row is an episode the paper describes. The tag is the page’s reading of the paper’s wording: “settled together” where the paper says the partners decided jointly, “truncated” where one side made a change or a proposal and the other did not answer, “never negotiated” where an expectation was never raised. The paper itself gives no count of episodes.", "ug grad res"));

    var kindsOrder = ["agreed", "compromise", "truncated", "missing"];

    function shown() {
      return E.EPISODES.filter(function (ep) { return state.topic === "all" || ep.topic === state.topic; });
    }

    function drawTally() {
      tally.innerHTML = "";
      var eps = shown();
      var W = chartWidth(root), rowH = 26, left = W < 420 ? 96 : 130, H = E.TEAMS.length * rowH + 4;
      var maxN = 6;
      var unit = (W - left - 16) / maxN;
      var s = svg("svg", { class: "sp-svg", viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": "Negotiation episodes per team, by kind." });
      E.TEAMS.forEach(function (t, i) {
        var y = 6 + i * rowH;
        s.appendChild(svg("text", { x: left - 8, y: y + 10, class: "c-label", "text-anchor": "end", "dominant-baseline": "middle" }, W < 420 ? t.name.split(" ")[0] : t.name));
        var x = left;
        kindsOrder.forEach(function (k) {
          eps.forEach(function (ep) {
            if (ep.team !== t.key || ep.kind !== k) return;
            s.appendChild(svg("rect", { x: x + 1, y: y, width: unit - 3, height: 20, class: "sp-ep sp-ep-" + k }));
            x += unit;
          });
        });
        if (x === left) s.appendChild(svg("text", { x: left, y: y + 10, class: "c-tick", "dominant-baseline": "middle" }, "none reported"));
      });
      tally.appendChild(s);
      tally.appendChild(legend());
    }

    function legend() {
      var wrap = el("div", { class: "c-legend" });
      kindsOrder.forEach(function (k) {
        wrap.appendChild(el("span", { class: "lg sp-lg-" + k, text: E.KINDS[k].split(":")[0] }));
      });
      return wrap;
    }

    function render() {
      drawTally();
      list.innerHTML = "";
      shown().forEach(function (ep) {
        list.appendChild(el("div", { class: "sp-ep-row" }, [
          el("span", { class: "sp-ep-team", text: teamByKey(ep.team).name + " · " + ep.topic }),
          el("span", { class: "sp-ep-title", text: ep.title }),
          el("span", { class: "sp-ep-kind sp-k-" + ep.kind, text: E.KINDS[ep.kind] }),
          el("span", { class: "sp-ep-body", text: ep.body })
        ]));
      });
    }
    render();
    redraws.push(drawTally);

    // themes matrix
    root.appendChild(el("p", { class: "w-mono sp-thead", text: "Four themes of what partnership meant (Section 3.3)" }));
    var m = el("div", { class: "sp-themes" });
    m.appendChild(el("div", { class: "sp-trow sp-trow-head" }, [el("span", { text: "Theme" })].concat(E.TEAMS.map(function (t) { return el("span", { class: "sp-tcell", text: t.name }); }))));
    E.THEMES.forEach(function (th) {
      m.appendChild(el("div", { class: "sp-trow" }, [
        el("span", { class: "sp-tname" }, [th.name, el("span", { class: "sp-tnote", text: th.note, "data-levels": "hs ug grad res" })])
      ].concat(E.TEAMS.map(function (t) {
        var v = th[t.key];
        return el("span", { class: "sp-tcell " + (v ? "sp-yes" : "sp-na"), text: v ? "Present" : "Not assessed" });
      }))));
    });
    root.appendChild(m);
  }

  /* ---------------------------------------------------------------- demo 4: balloon physics */

  function mountBalloon(root) {
    var state = { km: 20, cm: 20 };
    root.appendChild(el("p", { class: "w-source", text: "Speed of Sound team’s post-launch lesson: graph temperature and pressure, relate them to the speed of sound" }));

    var r1 = el("label", { class: "w-range" });
    var alt = el("input", { type: "range", min: "0", max: "35", step: "0.5", value: String(state.km), "aria-label": "Altitude in kilometers" });
    var altOut = el("output");
    r1.appendChild(el("span", { text: "Altitude (km)" })); r1.appendChild(alt); r1.appendChild(altOut);
    root.appendChild(r1);

    var read = el("div", { class: "sp-read" });
    root.appendChild(read);
    var chart = el("div", { class: "sp-chart" });
    root.appendChild(chart);

    var r2 = el("label", { class: "w-range", "data-levels": "hs ug grad res" });
    var box = el("input", { type: "range", min: "5", max: "100", step: "1", value: String(state.cm), "aria-label": "Distance from speaker to wall in centimeters" });
    var boxOut = el("output");
    r2.appendChild(el("span", { text: "Box (cm)" })); r2.appendChild(box); r2.appendChild(boxOut);
    root.appendChild(r2);
    var echo = el("p", { class: "w-mono", "data-levels": "hs ug grad res" });
    root.appendChild(echo);
    root.appendChild(note("Computed by this page from the 1976 U.S. Standard Atmosphere (dry air). The paper reports neither the flight altitude nor the payload box size; the box slider is the page’s illustration of the echo timing the payload’s Arduino had to measure. Real flights differ from the standard day by several degrees.", "ug grad res"));

    var DIMS = [
      { key: "T", label: "Temperature (°C)", get: function (a) { return a.T - 273.15; }, lo: -60, hi: 20, fmt: function (v) { return v.toFixed(1) + " °C"; } },
      { key: "p", label: "Pressure (hPa)", get: function (a) { return a.p / 100; }, lo: 0, hi: 1050, fmt: function (v) { return v.toFixed(v < 10 ? 2 : 0) + " hPa"; } },
      { key: "c", label: "Speed of sound (m/s)", get: function (a) { return a.c; }, lo: 290, hi: 345, fmt: function (v) { return v.toFixed(1) + " m/s"; } }
    ];

    function draw() {
      chart.innerHTML = "";
      var W = chartWidth(root), H = 250, top = 10, bottom = 36, gap = 14, leftAxis = 46;
      var panelW = (W - leftAxis - gap * 2) / 3;
      var s = svg("svg", { class: "sp-svg", viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": "Temperature, pressure, and speed of sound against altitude from 0 to 35 kilometers in the standard atmosphere." });
      function yOf(km) { return top + (1 - km / 35) * (H - top - bottom); }
      [0, 10, 20, 30].forEach(function (km) {
        s.appendChild(svg("line", { x1: leftAxis, x2: W, y1: yOf(km), y2: yOf(km), class: "c-grid" }));
        s.appendChild(svg("text", { x: leftAxis - 6, y: yOf(km), class: "c-tick", "text-anchor": "end", "dominant-baseline": "middle" }, km + " km"));
      });
      var cur = E.atmosphere(state.km * 1000);
      DIMS.forEach(function (d, i) {
        var x0 = leftAxis + i * (panelW + gap), x1 = x0 + panelW;
        function xOf(v) { return x0 + (v - d.lo) / (d.hi - d.lo) * (x1 - x0); }
        s.appendChild(svg("line", { x1: x0, x2: x0, y1: top, y2: H - bottom, class: "c-grid" }));
        var path = "";
        for (var km = 0; km <= 35.001; km += 0.25) {
          var a = E.atmosphere(km * 1000);
          path += (km === 0 ? "M" : "L") + xOf(d.get(a)).toFixed(1) + "," + yOf(km).toFixed(1);
        }
        s.appendChild(svg("path", { d: path, class: "sp-line sp-line-" + d.key }));
        s.appendChild(svg("text", { x: x0, y: H - bottom + 14, class: "c-tick" }, String(d.lo)));
        s.appendChild(svg("text", { x: x1, y: H - bottom + 14, class: "c-tick", "text-anchor": "end" }, String(d.hi)));
        s.appendChild(svg("text", { x: (x0 + x1) / 2, y: H - 6, class: "c-label", "text-anchor": "middle" }, W < 480 ? d.label.replace(" of sound", "").replace("Temperature", "Temp.").replace("Pressure", "Press.") : d.label));
        var v = d.get(cur);
        s.appendChild(svg("circle", { cx: xOf(v), cy: yOf(state.km), r: 5, class: "sp-dot sp-dot-on" }));
      });
      s.appendChild(svg("line", { x1: leftAxis, x2: W, y1: yOf(state.km), y2: yOf(state.km), class: "sp-now" }));
      chart.appendChild(s);
    }

    function render() {
      altOut.textContent = String(state.km);
      boxOut.textContent = String(state.cm);
      var a = E.atmosphere(state.km * 1000), g = E.atmosphere(0);
      read.innerHTML = "";
      DIMS.forEach(function (d) {
        read.appendChild(el("div", { class: "sp-read-row" }, [
          el("span", { class: "sp-read-k", text: d.label.replace(/ \(.*\)/, "") }),
          el("span", { class: "sp-read-v", text: d.fmt(d.get(a)) }),
          el("span", { class: "sp-read-g", text: "ground " + d.fmt(d.get(g)) })
        ]));
      });
      var tGround = 2 * state.cm / 100 / g.c * 1e6, tHere = 2 * state.cm / 100 / a.c * 1e6;
      echo.textContent = "Echo across " + state.cm + " cm and back: " + tHere.toFixed(0) + " µs here, " + tGround.toFixed(0) + " µs on the ground (" + (tHere - tGround >= 0 ? "+" : "") + (tHere - tGround).toFixed(0) + " µs)";
      draw();
    }
    alt.addEventListener("input", function () { state.km = parseFloat(alt.value); render(); });
    box.addEventListener("input", function () { state.cm = parseFloat(box.value); render(); });
    render();
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
    mount("sp-ladder", mountLadder);
    mount("sp-design", mountDesign);
    mount("sp-talk", mountTalk);
    mount("sp-balloon", mountBalloon);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();

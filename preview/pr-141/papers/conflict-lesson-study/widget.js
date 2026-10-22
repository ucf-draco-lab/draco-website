/*
  Widget for /papers/conflict-lesson-study/.
  Mount points in the page: #cl-game, #cl-cycle, #cl-lesson, #cl-notes, #cl-themes.

  Demo 1 is the lesson's team game (Table 1), played in the browser on the page's own
  target. At the graduate and researcher levels it compares the two rule sets over
  simulated games (page's model).
  Demo 2 draws the year: three research lessons, their participants (18 + 38 + 29 = 85),
  and the four-step lesson study cycle. Demos 2 and 3 share one selected lesson.
  Demo 3 lays out the lesson's seven steps and what changed each time it was taught.
  Demo 4 asks the reader to code the 18 field-note excerpts the paper prints, then
  compares with the group's themes (kappa at graduate and researcher levels is the page's).
  Demo 5 draws the paper's ranking of the four themes beside the page's count of
  printed excerpts by theme and observer.
  All arithmetic lives in cl-engine.js.
*/
(function () {
  "use strict";

  var E = window.ConflictLessonEngine;
  var D = E.DATA;
  var SVGNS = "http://www.w3.org/2000/svg";

  var state = { lesson: 0, rule: "standard", members: 5, coding: D.notes.map(function () { return null; }), revealed: false };

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

  // Shared lesson picker (demos 2 and 3).
  var lessonControls = [], lessonDraws = [];
  function setLesson(v) {
    state.lesson = Number(v);
    lessonControls.forEach(function (c) { c.set(state.lesson); });
    lessonDraws.forEach(function (fn) { fn(); });
  }
  function lessonControl() {
    var c = segmented("Research lesson", D.lessons.map(function (l, i) {
      return { value: i, label: l.label, title: l.when };
    }), state.lesson, setLesson);
    lessonControls.push(c);
    return c;
  }

  /* ------------------------------------------------- demo 1: the team game */

  function mountGame(root) {
    var game = null, selected = -1, anim = null, seed = 1;
    var ruleSeg = segmented("Rules", [
      { value: "standard", label: "20 balls · 5 puffs", title: D.game.rules.standard.label },
      { value: "tight", label: "10 balls · 4 puffs", title: D.game.rules.tight.label }
    ], state.rule, function (v) { state.rule = v; reset(); });
    var teamSeg = segmented("Team size", [{ value: 4, label: "Team of 4" }, { value: 5, label: "Team of 5" }], state.members,
      function (v) { state.members = Number(v); reset(); });
    var resetBtn = el("button", { type: "button", class: "w-btn", text: "New game" });
    var autoBtn = el("button", { type: "button", class: "w-btn cl-ghost", text: "Let the page play" });
    var status = el("p", { class: "w-big", "aria-live": "polite" });
    var help = el("p", { class: "w-note" });
    var chart = el("div", { class: "cl-chart cl-game" });
    var roster = el("div", { class: "cl-roster" });
    var sim = el("div", { class: "cl-sim", "data-levels": "grad res" });
    var src = el("p", { class: "w-source", text: "Rules from the paper's Table 1 and its Lesson 3 variant · target rings, puff reach, and drift are the page's choices (simulated)" });
    [el("div", { class: "w-actions" }, [ruleSeg, teamSeg]), el("div", { class: "w-actions" }, [resetBtn, autoBtn]), status, chart, roster, help, sim, src]
      .forEach(function (n) { root.appendChild(n); });

    resetBtn.addEventListener("click", function () { seed++; reset(); });
    autoBtn.addEventListener("click", function () {
      if (!game || game.done()) { seed++; reset(); }
      selected = -1;
      (function step() {
        if (game.done()) { draw(); return; }
        var rec = game.autoPuff();
        if (!rec) { draw(); return; }
        animate(rec, function () { setTimeout(step, 60); });
      })();
    });

    function reset() {
      if (anim) cancelAnimationFrame(anim);
      anim = null;
      game = new E.Game({ rule: state.rule, members: state.members, seed: seed });
      selected = -1;
      draw();
    }

    var geom = null;
    function toModel(evt) {
      var svgEl = chart.querySelector("svg");
      var r = svgEl.getBoundingClientRect();
      var x = (evt.clientX - r.left) * (geom.W / r.width), y = (evt.clientY - r.top) * (geom.H / r.height);
      return { x: (x - geom.cx) / geom.s, y: (y - geom.cy) / geom.s };
    }

    function onPointer(evt) {
      if (!game || game.done() || anim) return;
      var p = toModel(evt), best = -1, bestD = 0.16;
      game.balls.forEach(function (b, i) {
        if (b.off) return;
        var d = Math.hypot(b.x - p.x, b.y - p.y);
        if (d < bestD) { bestD = d; best = i; }
      });
      if (best >= 0 && best !== selected) { selected = best; draw(); return; }
      if (selected < 0) return;
      var rec = game.puff(selected, p.x, p.y);
      if (!rec) return;
      if (rec.off) selected = -1;
      animate(rec, function () { draw(); });
    }

    function animate(rec, done) {
      var b = game.balls[rec.ball], to = rec.to, from = rec.from, t0 = null;
      b.x = from.x; b.y = from.y;
      var wasOff = b.off; b.off = false;
      function frame(ts) {
        if (t0 === null) t0 = ts;
        var u = Math.min(1, (ts - t0) / 220), e = 1 - Math.pow(1 - u, 3);
        b.x = from.x + (to.x - from.x) * e;
        b.y = from.y + (to.y - from.y) * e;
        draw(true);
        if (u < 1) anim = requestAnimationFrame(frame);
        else { b.x = to.x; b.y = to.y; b.off = wasOff; anim = null; draw(); done(); }
      }
      anim = requestAnimationFrame(frame);
    }

    function draw(fast) {
      var W = chartWidth(root), H = Math.min(W, 440), cx = W / 2, cy = H / 2;
      var s = (Math.min(W, H) / 2 - 8) / D.game.table;
      geom = { W: W, H: H, cx: cx, cy: cy, s: s };
      var g = svg("svg", { viewBox: "0 0 " + W + " " + H, class: "cl-svg", role: "img",
        "aria-label": "Target with " + game.nBalls + " paper balls; score " + game.score() });
      g.appendChild(svg("circle", { cx: cx, cy: cy, r: D.game.table * s, class: "cl-table" }));
      D.game.rings.slice().reverse().forEach(function (ring, i) {
        g.appendChild(svg("circle", { cx: cx, cy: cy, r: ring.r * s, class: "cl-ring cl-ring-" + i }));
      });
      D.game.rings.forEach(function (ring, i) {
        var inner = i ? D.game.rings[i - 1].r : 0;
        var ly = cy - ((ring.r + inner) / 2) * s;
        g.appendChild(svg("text", { x: cx, y: ly + 4, "text-anchor": "middle", class: "cl-ringlabel" }, String(ring.pts)));
      });
      if (selected >= 0 && !game.balls[selected].off) {
        var sb = game.balls[selected];
        g.appendChild(svg("circle", { cx: cx + sb.x * s, cy: cy + sb.y * s, r: D.game.reach * s, class: "cl-reach" }));
      }
      game.balls.forEach(function (b, i) {
        if (b.off) return;
        var pts = E.points(b.x, b.y);
        g.appendChild(svg("circle", { cx: cx + b.x * s, cy: cy + b.y * s, r: Math.max(5, 0.05 * s),
          class: "cl-ball" + (pts ? " is-in" : "") + (i === selected ? " is-sel" : "") }));
      });
      g.addEventListener("pointerdown", onPointer);
      chart.innerHTML = "";
      chart.appendChild(g);
      if (fast) return;

      var off = game.balls.filter(function (b) { return b.off; }).length;
      var left = game.totalPuffs() - game.turn;
      status.innerHTML = "Score <strong>" + game.score() + "</strong> · puffs left <strong>" + left + "</strong> of " + game.totalPuffs() +
        (off ? " · " + words(off) + " off the table" : "") + (game.done() ? " · game over" : "");
      roster.innerHTML = "";
      for (var m = 0; m < game.members; m++) {
        var used = Math.floor(game.turn / game.members) + (m < game.turn % game.members ? 1 : 0);
        var now = !game.done() && game.member() === m;
        roster.appendChild(el("span", { class: "cl-member" + (now ? " is-now" : ""),
          text: (m === 0 ? "Leader" : m === 1 ? "Associate" : "Member " + (m + 1)) + " " + used + "/" + game.puffsEach }));
      }
      help.textContent = game.done()
        ? "Every member has used every puff. In the lesson, an adjacent team verifies the score (Table 1, play step 6)."
        : selected < 0 ? "Tap a paper ball, then tap where you want the puff to send it. Members puff in a fixed order, one puff per turn."
        : "Tap a spot to puff the highlighted ball toward it. One puff reaches about the dashed circle and drifts a little.";
    }
    redraws.push(function () { if (!anim) draw(); });

    // Graduate and researcher: the two rule sets over simulated games.
    function drawSim() {
      var rows = [];
      [4, 5].forEach(function (m) {
        ["standard", "tight"].forEach(function (r) {
          var res = E.simulate(r, m, 400, 1000);
          rows.push("<tr><td>" + m + "</td><td>" + D.game.rules[r].balls + " balls, " + D.game.rules[r].puffs + " puffs each</td><td>" +
            (m * D.game.rules[r].puffs) + "</td><td>" + fix(res.mean, 1) + "</td><td>" + fix(res.sd, 1) + "</td><td>" + res.min + " to " + res.max + "</td></tr>");
        });
      });
      sim.innerHTML = "<p class=\"w-note\"><strong>Computed by the page (simulated).</strong> 400 games per row on the page's target, each puff sent to the ball that gains the most points from it. The paper reports no scores.</p>" +
        "<div class=\"cl-scroll\"><table class=\"cl-table-t\"><thead><tr><th>Team</th><th>Rules</th><th>Puffs in all</th><th>Mean score</th><th>SD</th><th>Range</th></tr></thead><tbody>" +
        rows.join("") + "</tbody></table></div>";
    }
    drawSim();
    reset();
  }

  /* -------------------------------------------- demo 2: one year, three lessons */

  function mountCycle(root) {
    var head = el("div", { class: "w-actions" }, [el("span", { class: "w-mono", text: "Research lesson:" }), lessonControl()]);
    var chart = el("div", { class: "cl-chart" });
    var readout = el("div", { class: "cl-readout" });
    var cyc = el("ol", { class: "cl-cycle" });
    var src = el("p", { class: "w-source", text: "Paper, methodology and findings sections · lesson study cycle after Lewis, Perry, and Murata (2006)" });
    [head, chart, readout, el("p", { class: "w-note", text: "The lesson study cycle the group followed around each research lesson:" }), cyc, src]
      .forEach(function (n) { root.appendChild(n); });
    D.cycle.forEach(function (c) { cyc.appendChild(el("li", { html: "<strong>" + c.name + ".</strong> " + c.text })); });

    function draw() {
      var W = chartWidth(root), H = 170, padL = 10, padR = 10;
      var months = 15; // January 2017 to March 2018
      var x = function (m) { return padL + (m / months) * (W - padL - padR); };
      var g = svg("svg", { viewBox: "0 0 " + W + " " + H, class: "cl-svg", role: "img",
        "aria-label": "Timeline of three research lessons with 18, 38, and 29 participants" });
      g.appendChild(svg("line", { x1: x(0), x2: x(months), y1: 120, y2: 120, class: "c-grid" }));
      var labels = [[0, "Jan 2017"], [6, "Jul"], [12, "Jan 2018"]];
      if (W > 460) labels = [[0, "Jan 2017"], [3, "Apr"], [6, "Jul"], [9, "Oct"], [12, "Jan 2018"]];
      labels.forEach(function (t) {
        g.appendChild(svg("line", { x1: x(t[0]), x2: x(t[0]), y1: 116, y2: 124, class: "c-grid" }));
        g.appendChild(svg("text", { x: x(t[0]), y: 140, class: "c-tick", "text-anchor": t[0] === 0 ? "start" : "middle" }, t[1]));
      });
      var maxN = 38;
      D.lessons.forEach(function (l, i) {
        var on = i === state.lesson;
        // About four weeks of planning before and two weeks of reflection after.
        g.appendChild(svg("rect", { x: x(l.month - 1), y: 110, width: x(l.month + 0.5) - x(l.month - 1), height: 20, class: "cl-window" + (on ? " is-on" : "") }));
        var bh = (l.n / maxN) * 80;
        var bar = svg("rect", { x: x(l.month) - 9, y: 108 - bh, width: 18, height: bh, class: "cl-bar" + (on ? " is-on" : "") });
        var grp = svg("g", { class: "cl-col", tabindex: "0", role: "button", "aria-label": l.label + ", " + l.when + ", " + l.n + " participants" });
        grp.appendChild(svg("rect", { x: x(l.month) - 22, y: 10, width: 44, height: 120, class: "cl-hit" }));
        grp.appendChild(bar);
        grp.appendChild(svg("text", { x: x(l.month), y: 102 - bh, "text-anchor": "middle", class: "cl-val" }, String(l.n)));
        grp.appendChild(svg("text", { x: x(l.month), y: 158, "text-anchor": "middle", class: "c-label" }, "L" + l.id));
        grp.addEventListener("click", function () { setLesson(i); });
        grp.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setLesson(i); } });
        g.appendChild(grp);
      });
      chart.innerHTML = "";
      chart.appendChild(g);

      var l = D.lessons[state.lesson], t = E.totals();
      readout.innerHTML = "<p class=\"w-big\"><strong>" + l.label + "</strong> · " + l.when + " · <strong>" + l.n + "</strong> participants · " +
        "running total <strong>" + t.per.slice(0, state.lesson + 1).reduce(function (a, b) { return a + b; }, 0) + "</strong> of " + t.all + "</p>" +
        "<p class=\"w-note\">Taught by the " + l.teacher + "; notes taken by the " + l.observers.join(" and the ").toLowerCase().replace("ceas", "CEAS").replace("coe", "CoE") + ".</p>";
    }
    lessonDraws.push(draw);
    redraws.push(draw);
    draw();
  }

  /* ------------------------------------------- demo 3: the lesson, three times */

  function mountLesson(root) {
    var head = el("div", { class: "w-actions" }, [el("span", { class: "w-mono", text: "Research lesson:" }), lessonControl()]);
    var table = el("div", { class: "cl-scroll" });
    var changes = el("ul", { class: "cl-changes" });
    var src = el("p", { class: "w-source", text: "Paper, methodology section and “Soft skill lesson adaptations”" });
    [head, table, el("p", { class: "w-note", text: "What the group changed, and why:" }), changes, src].forEach(function (n) { root.appendChild(n); });

    var rows = [
      { name: "Audience", v: D.lessons.map(function (l) { return l.audience; }) },
      { name: "Taught by", v: D.lessons.map(function (l) { return l.teacher; }) },
      { name: "Components", v: ["Four, taught together", "Five, each named and taught separately", "Five, each with an industry example"] },
      { name: "Conflict examples", v: ["Conflict levels and approaches", "One example per type (resource, objective, identity) and strategy (argumentation, resonance, innovation, action)", "Same, plus a class member's semiconductor-industry story"] },
      { name: "Team game", v: D.lessons.map(function (l) { return l.game; }) },
      { name: "Data", v: ["Field notes; pre- and post-surveys", "Field notes; pre- and post-surveys", "Field notes; pre- and post-surveys; whole-class feedback"] }
    ];

    function draw() {
      var i = state.lesson;
      var head = "<tr><th>Step</th>" + D.lessons.map(function (l, j) { return "<th" + (j === i ? " class=\"is-on\"" : "") + ">" + l.label + "</th>"; }).join("") + "</tr>";
      var body = D.steps.map(function (s, k) {
        return "<tr><td>" + (k + 1) + ". " + s + "</td>" + D.lessons.map(function (l, j) { return "<td" + (j === i ? " class=\"is-on\"" : "") + ">✓</td>"; }).join("") + "</tr>";
      }).join("");
      body += rows.map(function (r) {
        return "<tr class=\"cl-sep\"><td>" + r.name + "</td>" + r.v.map(function (v, j) { return "<td" + (j === i ? " class=\"is-on\"" : "") + ">" + v + "</td>"; }).join("") + "</tr>";
      }).join("");
      table.innerHTML = "<table class=\"cl-table-t cl-matrix\"><thead>" + head + "</thead><tbody>" + body + "</tbody></table>";
      changes.innerHTML = "";
      D.lessons[i].changes.forEach(function (c) { changes.appendChild(el("li", { text: c })); });
    }
    lessonDraws.push(draw);
    draw();
  }

  /* --------------------------------------------------- demo 4: code the notes */

  function mountNotes(root) {
    var intro = el("p", { class: "w-note", text: "Read each note and pick the theme you would mark it with. Then compare with the group's themes." });
    var list = el("ol", { class: "cl-notes" });
    var revealBtn = el("button", { type: "button", class: "w-btn", text: "Compare with the group" });
    var clearBtn = el("button", { type: "button", class: "w-btn cl-ghost", text: "Clear my coding" });
    var result = el("div", { class: "cl-readout", "aria-live": "polite" });
    var src = el("p", { class: "w-source", text: "The 18 excerpts printed in the paper's Findings, in print order, under the theme the paper printed each one with · some notes shortened" });
    [intro, list, el("div", { class: "w-actions" }, [revealBtn, clearBtn]), result, src].forEach(function (n) { root.appendChild(n); });

    var segs = [];
    var obsName = {}; D.observers.forEach(function (o) { obsName[o.key] = o.name; });
    D.notes.forEach(function (n, i) {
      var tag = el("p", { class: "cl-note-tag", text: obsName[n.o] + " notes" });
      var text = el("p", { class: "cl-note-text", text: n.text });
      var seg = segmented("Theme for note " + (i + 1), D.themes.map(function (t, k) { return { value: k, label: t.short, title: t.name }; }),
        "", function (v) { state.coding[i] = Number(v); if (state.revealed) drawResult(); });
      var mark = el("p", { class: "cl-note-mark" });
      segs.push({ seg: seg, mark: mark });
      list.appendChild(el("li", {}, [tag, text, seg, mark]));
    });

    revealBtn.addEventListener("click", function () { state.revealed = true; drawResult(); });
    clearBtn.addEventListener("click", function () {
      state.coding = D.notes.map(function () { return null; });
      state.revealed = false;
      segs.forEach(function (s) { s.seg.set(""); s.mark.textContent = ""; s.mark.className = "cl-note-mark"; });
      result.innerHTML = "";
    });

    function drawResult() {
      var coded = [], paper = [], match = 0, done = 0;
      D.notes.forEach(function (n, i) {
        var mine = state.coding[i], s = segs[i];
        var label = "Group: " + D.themes[n.t].name + (n.both !== undefined ? " (the paper says this note also fits " + D.themes[n.both].name.toLowerCase() + "; the group chose by context)" : "");
        s.mark.textContent = label;
        s.mark.className = "cl-note-mark" + (mine === null ? "" : mine === n.t ? " is-match" : " is-miss");
        if (mine !== null) { done++; coded.push(mine); paper.push(n.t); if (mine === n.t) match++; }
      });
      if (!done) {
        result.innerHTML = "<p class=\"w-big\">Pick a theme for at least one note to compare.</p>";
        return;
      }
      var html = "<p class=\"w-big\">You matched the group on <strong>" + match + "</strong> of " + done + " notes you coded.</p>";
      if (done >= 2) {
        var k = E.kappa(coded, paper, D.themes.length);
        html += "<p class=\"w-note\" data-levels=\"grad res\"><strong>Computed by the page.</strong> Cohen's kappa between your coding and the group's: <strong>" +
          fix(k.kappa, 2) + "</strong> (observed agreement " + fix(k.po, 2) + ", chance agreement " + fix(k.pe, 2) + ", " + done + " notes). The group did not measure inter-rater reliability; it agreed on each note's color before each meeting ended.</p>";
      }
      result.innerHTML = html;
    }
  }

  /* --------------------------------------------------- demo 5: the four themes */

  function mountThemes(root) {
    var chart = el("div", { class: "cl-chart" });
    var legend = el("div", { class: "c-legend" });
    var note = el("p", { class: "w-note" });
    var src = el("p", { class: "w-source", text: "Rank order from the paper's Findings · bar lengths count the 18 excerpts the paper prints (page's count), not the full notebooks" });
    [chart, legend, note, src].forEach(function (n) { root.appendChild(n); });
    D.observers.forEach(function (o, i) {
      legend.appendChild(el("span", { class: "cl-lg" }, [el("span", { class: "cl-sw cl-o" + i }), o.name]));
    });

    function draw() {
      var t = E.tally(), W = chartWidth(root), rowH = 34, padL = Math.min(230, W * 0.45), H = D.themes.length * rowH + 24;
      var maxV = 6, x = function (v) { return padL + (v / maxV) * (W - padL - 30); };
      var g = svg("svg", { viewBox: "0 0 " + W + " " + H, class: "cl-svg", role: "img",
        "aria-label": "Four themes ranked by how often they appeared in the notes, with 6, 5, 4, and 3 printed examples" });
      for (var v = 0; v <= maxV; v += 2) {
        g.appendChild(svg("line", { x1: x(v), x2: x(v), y1: 4, y2: H - 18, class: "c-grid" }));
        g.appendChild(svg("text", { x: x(v), y: H - 4, "text-anchor": "middle", class: "c-tick" }, String(v)));
      }
      D.themes.forEach(function (th, k) {
        var y = 8 + k * rowH, acc = 0;
        var name = W < 480 ? th.short : th.name;
        g.appendChild(svg("text", { x: 0, y: y + 15, class: "c-label" }, (k + 1) + ". " + name));
        D.observers.forEach(function (o, j) {
          var c = t.grid[o.key][k];
          if (!c) return;
          g.appendChild(svg("rect", { x: x(acc), y: y + 2, width: x(acc + c) - x(acc), height: 18, class: "cl-o" + j }));
          acc += c;
        });
        g.appendChild(svg("text", { x: x(acc) + 6, y: y + 15, class: "cl-val" }, String(acc)));
      });
      chart.innerHTML = "";
      chart.appendChild(g);
      note.innerHTML = "The paper ranks the themes by how often they appeared across four notebooks (1 = most often) but gives no counts. The printed examples fall in the same order: " +
        t.byTheme.join(", ") + " of " + t.n + ". By observer, the graduate student contributes " + words(t.byObs.gs) + ", the CoE faculty member " + words(t.byObs.coe) +
        ", and the CEAS faculty member " + words(t.byObs.ceas) + ".";
    }
    redraws.push(draw);
    draw();
  }

  /* ------------------------------------------------------------------ mount */

  function mount(id, fn) {
    var node = document.getElementById(id);
    if (!node) return;
    node.classList.add("w-ready");
    fn(node);
  }
  function init() {
    mount("cl-game", mountGame);
    mount("cl-cycle", mountCycle);
    mount("cl-lesson", mountLesson);
    mount("cl-notes", mountNotes);
    mount("cl-themes", mountThemes);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();

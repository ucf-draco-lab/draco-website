/*
  Portable Tor router widget for /papers/portable-tor-router/.
  Mount points: #ptr-onion, #ptr-observers, #ptr-speed, #ptr-pace.
  One shared state: the circuit, HTTPS on or off, the router on or off, and DNS
  through Tor. The onion uses real AES-128 counter-mode encryption from
  tor-engine.js; the speed data are the paper's Figures 2 to 5.
*/
(function () {
  "use strict";

  var E = window.TorRouter;
  if (!E) return;
  var SVGNS = "http://www.w3.org/2000/svg";

  /* ------------------------------------------------------------ state */

  var SITES = [
    { value: "library.example", label: "library.example" },
    { value: "clinic.example", label: "clinic.example" },
    { value: "news.example", label: "news.example" }
  ];
  var state = {
    seed: 7, site: "library.example", message: "search=privacy", https: false,
    tor: true, dnsViaTor: true, step: 0, dir: "down",
    level: window.PaperKit ? window.PaperKit.level() : "public"
  };
  state.circ = E.circuit(state.seed);
  var listeners = [];
  function onChange(fn) { listeners.push(fn); }
  function changed(what) { listeners.forEach(function (fn) { fn(what); }); }
  document.addEventListener("paperlevel", function (e) { state.level = e.detail.level; changed("level"); });
  function deep() { return state.level === "grad" || state.level === "res"; }
  function techy() { return state.level === "ug" || deep(); }

  /* ------------------------------------------------------------ helpers */

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
    if (text != null) node.textContent = text;
    return node;
  }
  function chartWidth(node) {
    var w = node && node.parentNode ? node.parentNode.clientWidth : 640;
    return Math.max(300, Math.min(760, w || 640));
  }
  var resizers = [], resizeTimer = null;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () { resizers.forEach(function (fn) { fn(); }); }, 150);
  });
  function seg(options, value, onPick, label) {
    var wrap = el("div", { class: "seg", role: "radiogroup", "aria-label": label }), btns = [];
    options.forEach(function (o) {
      var b = el("button", { type: "button", class: "seg-option", role: "radio", "aria-checked": String(o.value === value), text: o.label });
      b.addEventListener("click", function () { set(o.value); onPick(o.value); });
      wrap.appendChild(b); btns.push({ b: b, v: o.value });
    });
    function set(v) { btns.forEach(function (x) { x.b.setAttribute("aria-checked", String(x.v === v)); }); }
    wrap.set = set;
    return wrap;
  }
  function labeled(label, control, levels) {
    var row = el("div", { class: "pt-ctl" }, [el("span", { class: "pt-ctl-label", text: label }), control]);
    if (levels) row.setAttribute("data-levels", levels);
    return row;
  }
  function onOff(value, onPick, label) {
    return seg([{ value: true, label: "On" }, { value: false, label: "Off" }], value, onPick, label);
  }
  function fmt(x, d) { return Number(x).toFixed(d == null ? 2 : d); }
  function words(n) { return ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"][n] || String(n); }
  function pfmt(p) {
    if (p >= 0.001) return p.toFixed(3);
    var e = Math.floor(Math.log10(p)), m = p / Math.pow(10, e);
    return m.toFixed(1) + " × 10<sup>" + e + "</sup>";
  }
  function dur(s) {
    if (s < 90) return fmt(s, s < 10 ? 1 : 0) + " s";
    if (s < 5400) return fmt(s / 60, s < 600 ? 1 : 0) + " min";
    return fmt(s / 3600, 1) + " h";
  }
  function printable(bytes, max) {
    var s = E.fromUtf8(bytes.subarray(0, max || bytes.length));
    return s.replace(/[\u0000-\u0009\u000b-\u001f\u007f-\u009f�]/g, "·");
  }

  /* ------------------------------------------------------------ demo 1: wrap and peel */

  var HOPS = [
    { id: "router", label: "Tor router", short: "Router" },
    { id: "entry", label: "Entry relay", short: "Entry" },
    { id: "middle", label: "Middle relay", short: "Middle" },
    { id: "exit", label: "Exit relay", short: "Exit" },
    { id: "site", label: "Website", short: "Site" }
  ];

  function mountOnion(root) {
    root.classList.add("w-ready");
    var siteSeg = seg(SITES, state.site, function (v) { state.site = v; changed("onion"); }, "Website");
    var httpsSeg = seg([{ value: false, label: "HTTP" }, { value: true, label: "HTTPS" }], state.https, function (v) { state.https = v; changed("https"); }, "Website protocol");
    var msg = el("input", { type: "text", class: "pt-input", maxlength: "60", value: state.message, "aria-label": "Message to send" });
    msg.addEventListener("input", function () { state.message = msg.value; changed("onion"); });
    var ctrls = el("div", { class: "pt-ctrls" }, [
      labeled("Website", siteSeg), labeled("Protocol", httpsSeg), labeled("Message", msg)
    ]);
    var back = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "Back" });
    var next = el("button", { type: "button", class: "w-btn", text: "Next hop" });
    var fresh = el("button", { type: "button", class: "w-btn w-btn-quiet", text: "New circuit" });
    var actions = el("div", { class: "w-actions" }, [back, next, fresh]);
    var pic = svg("svg", { class: "pt-chain", role: "img" });
    var caption = el("p", { class: "pt-readout", "aria-live": "polite" });
    var rows = el("div", { class: "pt-rows" });
    var note = el("p", { class: "w-note" });
    [ctrls, actions, pic, caption, rows, note].forEach(function (n) { root.appendChild(n); });

    back.addEventListener("click", function () { state.step = Math.max(0, state.step - 1); draw(); });
    next.addEventListener("click", function () { state.step = state.step >= 4 ? 0 : state.step + 1; draw(); });
    fresh.addEventListener("click", function () { state.seed += 1; state.circ = E.circuit(state.seed); state.step = 0; changed("onion"); });

    function draw() {
      httpsSeg.set(state.https);
      next.textContent = state.step >= 4 ? "Start over" : "Next hop";
      back.disabled = state.step === 0;
      var circ = state.circ, o = E.wrap(circ, { site: state.site, path: "/", message: state.message, https: state.https });
      var W = chartWidth(pic), H = 150, n = HOPS.length, padX = 42, gap = (W - 2 * padX) / (n - 1);
      pic.setAttribute("viewBox", "0 0 " + W + " " + H);
      pic.setAttribute("aria-label", "A request travels from the Tor router through three relays to the website; it is at hop " + (state.step + 1) + " of five.");
      pic.innerHTML = "";
      var y = 64;
      pic.appendChild(svg("line", { x1: padX, y1: y, x2: W - padX, y2: y, class: "pt-wire" }));
      HOPS.forEach(function (h, i) {
        var x = padX + i * gap, here = i === state.step;
        var g = svg("g", {});
        if (h.id === "site") g.appendChild(svg("rect", { x: x - 15, y: y - 15, width: 30, height: 30, class: "pt-node" + (here ? " on" : "") }));
        else if (h.id === "router") g.appendChild(svg("rect", { x: x - 17, y: y - 12, width: 34, height: 24, class: "pt-node pt-pi" + (here ? " on" : "") }));
        else g.appendChild(svg("circle", { cx: x, cy: y, r: 14, class: "pt-node" + (here ? " on" : "") }));
        var narrow = W < 520;
        g.appendChild(svg("text", { x: x, y: y + 34, class: "c-label", "text-anchor": "middle" }, narrow ? h.short : h.label));
        var sub = h.id === "router" ? (narrow ? "home" : "your home") : h.id === "site" ? (narrow ? state.site.split(".")[0] : state.site) : circ.hops[i - 1].name;
        g.appendChild(svg("text", { x: x, y: y + 48, class: "c-tick", "text-anchor": "middle" }, sub));
        pic.appendChild(g);
      });
      // the onion travelling: rings = layers left
      var layers = Math.max(0, 3 - state.step), cx = padX + state.step * gap, cy = 22;
      for (var k = layers; k >= 1; k--) pic.appendChild(svg("circle", { cx: cx, cy: cy, r: 5 + 4 * k, class: "pt-layer l" + k }));
      pic.appendChild(svg("circle", { cx: cx, cy: cy, r: 5, class: "pt-core" + (state.https ? " locked" : "") }));

      // caption for the step
      var h = circ.hops, txt;
      if (state.step === 0) txt = "The router wraps the request in three layers, one for each relay, and sends it to the entry relay, " + h[0].name + ".";
      else if (state.step === 1) txt = h[0].name + " (entry) removes the outer layer with its key and finds one line: send this on to " + h[1].name + ". It knows your home address and nothing about the website.";
      else if (state.step === 2) txt = h[1].name + " (middle) removes the next layer and finds: send this on to " + h[2].name + ". It knows only its two neighbors.";
      else if (state.step === 3) txt = h[2].name + " (exit) removes the last layer and finds the website's address" + (state.https ? ", with the request still locked by HTTPS." : " and the request in plain text.");
      else txt = state.site + " receives the request from " + h[2].name + "'s address, " + h[2].addr + ". Your home address never reaches it.";
      caption.textContent = txt;

      // rows: what is on the wire at each hop
      rows.innerHTML = "";
      var labels = ["Router → " + h[0].name, h[0].name + " → " + h[1].name, h[1].name + " → " + h[2].name, h[2].name + " → " + state.site];
      o.stages.forEach(function (bytes, i) {
        var shown = i <= state.step;
        var r = el("div", { class: "pt-row" + (i === Math.min(state.step, 3) ? " on" : "") + (shown ? "" : " dim") });
        var left = layersLeft(i);
        r.appendChild(el("div", { class: "pt-row-head" }, [
          el("strong", { text: labels[i] }),
          el("span", { class: "w-mono", text: " · " + bytes.length + " bytes · " + (left ? left + (left === 1 ? " layer" : " layers") + " left" : (state.https ? "HTTPS only" : "no encryption")) })
        ]));
        if (shown) {
          var readable = i === 3 && !state.https;
          if (readable) r.appendChild(el("pre", { class: "pt-bytes plain", text: printable(bytes) }));
          else {
            r.appendChild(el("pre", { class: "pt-bytes", text: state.level !== "public" ? E.hex(bytes, 48) + (bytes.length > 48 ? "…" : "") : printable(bytes, 40) + "…" }));
          }
        }
        rows.appendChild(r);
      });
      if (techy() && state.step >= 1 && state.step <= 3) {
        var hop = h[state.step - 1], layer = o.layers[state.step - 1];
        rows.appendChild(el("p", { class: "w-mono pt-keyline", text: hop.name + " key " + E.hex(hop.key) + " · counter " + E.hex(hop.iv) + " · first line after decrypting: " + printable(layer.plain.subarray(0, layer.plain.indexOf(10))) }));
      }
      note.innerHTML = techy()
        ? "Every layer is AES-128 in counter mode, computed in your browser. Each layer adds one line naming the next hop, so the bundle shrinks by that line at each relay. The relay names, addresses (documentation ranges), and keys are invented for the demo; real Tor agrees on a key with each relay through a key exchange and sends fixed-size cells."
        : "The scrambling is real encryption, computed in your browser. The relay names and addresses are made up for the demo.";
    }
    function layersLeft(i) { return 3 - i; }
    onChange(function (what) { if (what !== "speed") draw(); });
    resizers.push(draw);
    draw();
  }

  /* ------------------------------------------------------------ demo 2: who sees what */

  var WHO = {
    wifi: "Others on the router's Wi-Fi",
    isp: "Your Internet provider",
    dns: "DNS lookup servers",
    entry: "Entry relay",
    middle: "Middle relay",
    exit: "Exit relay",
    site: "The website"
  };

  var WHO_LOWER = {
    wifi: "others on the router's Wi-Fi", isp: "your Internet provider", dns: "the DNS lookup servers",
    entry: "the entry relay", middle: "the middle relay", exit: "the exit relay", site: "the website"
  };

  function mountObservers(root) {
    root.classList.add("w-ready");
    var torSeg = onOff(state.tor, function (v) { state.tor = v; changed("obs"); }, "Tor router");
    var httpsSeg = seg([{ value: false, label: "HTTP" }, { value: true, label: "HTTPS" }], state.https, function (v) { state.https = v; changed("https"); }, "Website protocol");
    var dnsSeg = onOff(state.dnsViaTor, function (v) { state.dnsViaTor = v; changed("obs"); }, "DNS through Tor");
    var dnsRow = labeled("DNS through Tor", dnsSeg);
    root.appendChild(el("div", { class: "pt-ctrls" }, [labeled("Tor router", torSeg), labeled("Protocol", httpsSeg), dnsRow]));
    var wrap = el("div", { class: "pt-table-wrap" });
    var sum = el("p", { class: "pt-readout", "aria-live": "polite" });
    root.appendChild(wrap); root.appendChild(sum);

    function mark(v) { return v === "yes" ? '<span class="pt-yes">Yes</span>' : '<span class="pt-no">No</span>'; }
    function draw() {
      torSeg.set(state.tor); httpsSeg.set(state.https); dnsSeg.set(state.dnsViaTor);
      dnsRow.style.opacity = state.tor ? "1" : "0.45";
      var rows = E.observers({ tor: state.tor, https: state.https, dnsViaTor: state.dnsViaTor });
      var html = '<table class="results-table pt-obs"><thead><tr><th>Who</th><th>Knows it is you</th><th>Knows the site</th><th>Reads the request</th><th>Why</th></tr></thead><tbody>';
      rows.forEach(function (r) {
        html += "<tr><td>" + WHO[r.who] + "</td><td>" + mark(r.source) + "</td><td>" + mark(r.dest) + "</td><td>" + mark(r.content) + '</td><td class="pt-why">' + r.note + "</td></tr>";
      });
      wrap.innerHTML = html + "</tbody></table>";
      var both = rows.filter(function (r) { return r.source === "yes" && r.dest === "yes" && r.who !== "wifi"; }).map(function (r) { return WHO_LOWER[r.who]; });
      sum.innerHTML = both.length
        ? "Outside your home, <strong>" + words(both.length) + "</strong> " + (both.length === 1 ? "party links" : "parties link") + " you to the site: " + both.join(", ") + "."
        : "Outside your home, <strong>no single party</strong> links you to the site. Inside, the router's own Wi-Fi is still open to anyone connected to it" + (state.https ? "" : ", and the exit relay reads the request") + ".";
    }
    onChange(function (what) { if (what === "obs" || what === "https") draw(); });
    draw();
  }

  /* ------------------------------------------------------------ demo 3: speed */

  function mountSpeed(root) {
    root.classList.add("w-ready");
    var dirSeg = seg([{ value: "down", label: "Download" }, { value: "up", label: "Upload" }], state.dir, function (v) { state.dir = v; draw(); }, "Direction");
    root.appendChild(el("div", { class: "pt-ctrls" }, [labeled("Speed test", dirSeg)]));
    var chart = svg("svg", { class: "pt-hist", role: "img" });
    var key = el("p", { class: "w-note pt-key", html: '<span class="pt-k-tor"></span> through the Tor router &nbsp; <span class="pt-k-dir"></span> without Tor &nbsp; <span class="pt-k-avg"></span> average printed in the paper' });
    var readout = el("div", { class: "pt-readout", "aria-live": "polite" });
    var deepBox = el("div", { "data-levels": "grad res" });
    [chart, key, readout, deepBox].forEach(function (n) { root.appendChild(n); });

    function draw() {
      var tk = state.dir === "down" ? "torDown" : "torUp", dk = state.dir === "down" ? "directDown" : "directUp";
      var T = E.FIG[tk], D = E.FIG[dk], sT = E.summary(tk), sD = E.summary(dk);
      var W = chartWidth(chart), H = 230, L = 40, R = 14, top = 14, bot = 44;
      var xmax = state.dir === "down" ? 10 : 1, ymax = state.dir === "down" ? 10 : 10;
      chart.setAttribute("viewBox", "0 0 " + W + " " + H);
      chart.setAttribute("aria-label", "Histograms of " + (state.dir === "down" ? "download" : "upload") + " speeds from the paper's Figures " + T.fig + " and " + D.fig + ".");
      chart.innerHTML = "";
      function X(v) { return L + (W - L - R) * v / xmax; }
      function Y(c) { return top + (H - top - bot) * (1 - c / ymax); }
      for (var g = 0; g <= ymax; g += 2) {
        chart.appendChild(svg("line", { x1: L, x2: W - R, y1: Y(g), y2: Y(g), class: "c-grid" }));
        chart.appendChild(svg("text", { x: L - 6, y: Y(g) + 4, class: "c-tick", "text-anchor": "end" }, String(g)));
      }
      var step = state.dir === "down" ? 1 : 0.1;
      for (var t = 0; t <= xmax + 1e-9; t += step) {
        chart.appendChild(svg("text", { x: X(t), y: H - bot + 16, class: "c-tick", "text-anchor": "middle" }, state.dir === "down" ? String(Math.round(t)) : t.toFixed(1)));
      }
      chart.appendChild(svg("text", { x: (L + W - R) / 2, y: H - 8, class: "c-label", "text-anchor": "middle" }, (state.dir === "down" ? "Download" : "Upload") + " speed (Mb/s)"));
      chart.appendChild(svg("text", { x: 12, y: top + 2, class: "c-label", transform: "rotate(-90 12 " + (top + 2) + ")", "text-anchor": "end" }, "Tests"));
      [[T, "tor"], [D, "dir"]].forEach(function (pair) {
        pair[0].bins.forEach(function (b) {
          chart.appendChild(svg("rect", { x: X(b[0]), y: Y(b[2]), width: Math.max(1, X(b[1]) - X(b[0]) - 1), height: Y(0) - Y(b[2]), class: "pt-bar " + pair[1] }));
        });
      });
      // Paper's printed averages exist only for downloads.
      [[sT, "tor"], [sD, "dir"]].forEach(function (pair) {
        var s = pair[0];
        if (s.reported == null) return;
        chart.appendChild(svg("line", { x1: X(s.reported), x2: X(s.reported), y1: top, y2: Y(0), class: "c-ref" }));
        chart.appendChild(svg("text", { x: X(s.reported) + 4, y: top + 10, class: "c-tick" }, "avg " + s.reported));
      });
      chart.appendChild(svg("line", { x1: L, x2: W - R, y1: Y(0), y2: Y(0), class: "pt-axis" }));

      var ratio = sT.meanMid / sD.meanMid;
      var html = "<p><strong>" + sT.n + "</strong> tests through Tor ran from " + fmt(sT.min) + " to " + fmt(sT.max) + " Mb/s; the <strong>" + sD.n + "</strong> tests without Tor ran from " + fmt(sD.min) + " to " + fmt(sD.max) + " Mb/s. ";
      if (state.dir === "down") {
        var b2 = E.shareBelow("torDown", 2);
        html += "Every Tor download was slower than every direct one. Between " + b2.low + " and " + b2.high + " of the 30 Tor downloads came in at 2 Mb/s or less, the cap the paper reports.</p>";
      } else {
        html += "Uploads overlap: the fastest Tor uploads beat the slowest direct ones.</p>";
      }
      html += '<p class="w-mono">Counts and bin edges read from Figures ' + T.fig + " and " + D.fig + " of the paper. Bin midpoints put Tor at about " + Math.round(ratio * 100) + " percent of the direct speed.</p>";
      readout.innerHTML = html;

      var u = E.uRange(dk, tk);
      var pLo = E.mwP(u.nA, u.nB, u.Umax), pHi = E.mwP(u.nA, u.nB, u.Umin);
      var tbl = '<div class="pt-table-wrap"><table class="results-table"><caption class="w-mono">Computed by this page from the bars in Figures ' + T.fig + " and " + D.fig + '</caption><thead><tr><th></th><th>Tests (title says)</th><th>Range (Mb/s)</th><th>Mean must lie in</th><th>Paper’s average</th></tr></thead><tbody>';
      [[T, sT], [D, sD]].forEach(function (p) {
        var out = p[1].reported != null && (p[1].reported < p[1].meanLow || p[1].reported > p[1].meanHigh);
        tbl += "<tr><td>" + p[0].label + "</td><td class=\"pt-num\">" + p[1].n + " (" + p[1].titleN + ")</td><td class=\"pt-num\">" + fmt(p[1].min) + " – " + fmt(p[1].max) + "</td><td class=\"pt-num\">" + fmt(p[1].meanLow) + " – " + fmt(p[1].meanHigh) + "</td><td class=\"pt-num\">" + (p[1].reported == null ? "not given" : p[1].reported + (out ? ' <span class="pt-flag">outside</span>' : "")) + "</td></tr>";
      });
      tbl += "</tbody></table></div>";
      var test = u.Umin === u.Umax
        ? "Exact Mann–Whitney test (page's own): U = " + u.Umin + " of " + u.pairs + " pairs, two-sided p = " + pfmt(pHi) + ", which is 2 / C(" + (u.nA + u.nB) + ", " + u.nA + "): complete separation."
        : "Exact Mann–Whitney test (page's own): the bars fix U between " + u.Umin + " and " + u.Umax + " of " + u.pairs + " pairs (direct faster), so two-sided p lies between " + pfmt(pLo) + " and " + pfmt(pHi) + ".";
      deepBox.innerHTML = tbl + '<p class="w-note">' + test + " The test treats each speed test as independent and the bars as exact counts.</p>";
    }
    resizers.push(draw);
    onChange(function (what) { if (what === "level") draw(); });
    draw();
  }

  /* ------------------------------------------------------------ demo 4: the slowest link */

  var LINKS = [
    { label: "Home link", v: 9 },
    { label: "Entry relay", v: 6 },
    { label: "Middle relay", v: 1.5 },
    { label: "Exit relay", v: 4 }
  ];
  var FILES = [
    { value: 1, label: "1 MB" }, { value: 10, label: "10 MB" }, { value: 100, label: "100 MB" }, { value: 1000, label: "1 GB" }
  ];

  function mountPace(root) {
    root.classList.add("w-ready");
    var outs = [];
    var sliders = el("div", { class: "pt-sliders" });
    LINKS.forEach(function (lk, i) {
      var input = el("input", { type: "range", min: "0.5", max: "12", step: "0.5", value: String(lk.v), "aria-label": lk.label + " speed in megabits per second" });
      var out = el("output", { text: fmt(lk.v, 1) });
      input.addEventListener("input", function () { lk.v = Number(input.value); out.textContent = fmt(lk.v, 1); draw(); });
      outs.push(out);
      sliders.appendChild(el("label", { class: "w-range" }, [el("span", { text: lk.label }), input, out]));
    });
    var pipe = svg("svg", { class: "pt-pipe", role: "img" });
    var readout = el("p", { class: "pt-readout", "aria-live": "polite" });
    var size = 10;
    var fileSeg = seg(FILES, size, function (v) { size = v; draw(); }, "File size");
    var timeBox = el("div", {});
    [sliders, pipe, readout, el("div", { class: "pt-ctrls" }, [labeled("File size", fileSeg)]), timeBox].forEach(function (n) { root.appendChild(n); });

    function draw() {
      var res = E.chainSpeed(LINKS.map(function (l) { return l.v; }));
      var W = chartWidth(pipe), H = 96, n = LINKS.length, L = 8, R = 8, seg = (W - L - R) / n, mid = 44;
      pipe.setAttribute("viewBox", "0 0 " + W + " " + H);
      pipe.setAttribute("aria-label", "Four links in a row drawn as pipes whose widths match their speeds; the narrowest is " + LINKS[res.slowest].label + ".");
      pipe.innerHTML = "";
      LINKS.forEach(function (lk, i) {
        var h = 4 + 52 * lk.v / 12, x = L + i * seg;
        pipe.appendChild(svg("rect", { x: x + 2, y: mid - h / 2, width: seg - 4, height: h, class: "pt-pipe-seg" + (i === res.slowest ? " slow" : "") }));
        pipe.appendChild(svg("text", { x: x + seg / 2, y: H - 6, class: "c-tick", "text-anchor": "middle" }, W < 480 ? lk.label.split(" ")[0] : lk.label));
      });
      var flow = 4 + 52 * res.mbps / 12;
      pipe.appendChild(svg("rect", { x: L + 2, y: mid - flow / 2, width: W - L - R - 4, height: flow, class: "pt-flow" }));
      readout.innerHTML = "The connection runs at <strong>" + fmt(res.mbps, 1) + " Mb/s</strong>, the speed of the " + LINKS[res.slowest].label.toLowerCase() + ". Speeding up any other link changes nothing.";

      function rangeFor(key) {
        var tb = E.timeBins(key, size), fast = Infinity, slow = 0, total = 0, mids = [];
        tb.forEach(function (b) { fast = Math.min(fast, b[0]); slow = Math.max(slow, b[1]); total += b[2]; });
        return { fast: fast, slow: slow, n: total };
      }
      var t = rangeFor("torDown"), d = rangeFor("directDown");
      timeBox.innerHTML = '<table class="results-table pt-times"><thead><tr><th>' + FILES.filter(function (f) { return f.value === size; })[0].label + ' download</th><th>Fastest test</th><th>Slowest test</th></tr></thead><tbody>' +
        "<tr><td>Through the Tor router (" + t.n + " tests)</td><td class=\"pt-num\">" + dur(t.fast) + "</td><td class=\"pt-num\">" + dur(t.slow) + "</td></tr>" +
        "<tr><td>Without Tor (" + d.n + " tests)</td><td class=\"pt-num\">" + dur(d.fast) + "</td><td class=\"pt-num\">" + dur(d.slow) + "</td></tr>" +
        '<tr><td>Your chain above</td><td class="pt-num" colspan="2">' + dur(E.seconds(size, res.mbps)) + "</td></tr></tbody></table>" +
        '<p class="w-note">Times use the fastest and slowest download speeds in Figures 2 and 3 and 8 megabits per megabyte, with no allowance for protocol overhead. The sliders are yours to set; the paper did not measure individual relays.</p>';
    }
    resizers.push(draw);
    draw();
  }

  /* ------------------------------------------------------------ mount */

  function mount(id, fn) { var node = document.getElementById(id); if (node) fn(node); }
  function start() {
    mount("ptr-onion", mountOnion);
    mount("ptr-observers", mountObservers);
    mount("ptr-speed", mountSpeed);
    mount("ptr-pace", mountPace);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();

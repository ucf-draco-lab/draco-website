/*
  Malicious-URL feature widget for /papers/malicious-url-features/.
  Mount points: #mu-reader, #mu-gain, #mu-memory, #mu-results.
  Shared state: the feature view (the paper's 15 Table I features or all 55
  columns the authors' extractor writes) and the current URL.
  Feature values come from url-engine.js (a verified port of the authors'
  extractor). Memory curves come from mem-data.json, measured by running the
  authors' Classifier_gv4_w_mem.py on synthetic data of the paper's shape.
  Accuracy, time, and memory results are the paper's Tables III and IV, as printed.
*/
(function () {
  "use strict";

  var E = window.URLEngine;
  if (!E) return;
  var SVGNS = "http://www.w3.org/2000/svg";
  var BASE = (function () {
    var s = document.currentScript && document.currentScript.src;
    return s ? s.replace(/[^\/]*$/, "") : "/papers/malicious-url-features/";
  })();

  /* ------------------------------------------------------------ paper data */

  // Table III: [time s, memory as printed ("GB"), accuracy, precision, recall]
  var T3 = {
    RF:  { name: "Random forest", k: [[6.17, 36.48, 0.986, 0.986, 0.86], [2.86, 13.27, 0.98, 0.95, 0.86]], u: [[2.42, 36.48, 0.93, 0.66, 0.44], [1.17, 13.27, 0.92, 0.6, 0.45]] },
    LR:  { name: "Logistic regression", k: [[0.32, 115, 0.98, 0.89, 0.6], [0.67, 34.46, 0.95, 0.88, 0.57]], u: [[0.3, 115, 0.92, 0.6, 0.32], [0.15, 34.45, 0.92, 0.58, 0.28]] },
    SVM: { name: "Support vector machine", k: [[50.68, 92.12, 0.97, 0.98, 0.68], [64.29, 25.69, 0.98, 0.95, 0.67]], u: [[35.06, 94.65, 0.92, 0.68, 0.28], [28.99, 26.62, 0.92, 0.57, 0.5]] },
    KNN: { name: "k-nearest neighbors", k: [[0.84, 5.54, 0.96, 0.9, 0.58], [0.64, 21.79, 0.96, 0.86, 0.6]], u: [[0.82, 5.54, 0.92, 0.55, 0.43], [0.96, 21.79, 0.91, 0.52, 0.46]] },
    NB:  { name: "Naive Bayes", k: [[0.02, 29.68, 0.9, 0.47, 0.7], [0.01, 8.32, 0.94, 0.66, 0.65]], u: [[0.02, 29.68, 0.72, 0.24, 0.987], [0.01, 8.32, 0.69, 0.22, 0.997]] },
    MLPC: { name: "Neural network (CPU)", k: [[35.86, 45.07, 0.97, 0.94, 0.9], [127.8, 39.97, 0.98, 0.97, 0.91]], u: [[117.7, 45.08, 0.92, 0.75, 0.74], [51.19, 39.97, 0.93, 0.78, 0.71]] },
    MLPG: { name: "Neural network (GPU)", k: [[26.82, 17.65, 0.98, 0.96, 0.92], [27.56, 5.9, 0.98, 0.97, 0.89]], u: [[27.62, 17.65, 0.93, 0.78, 0.72], [26.97, 5.91, 0.92, 0.77, 0.68]] }
  };
  var T3_ORDER = ["RF", "LR", "SVM", "KNN", "NB", "MLPC", "MLPG"];
  // Table IV (UCI only): training time in seconds under an address-space limit; null = N/A, "W" = long wait
  var T4_LIMITS = [2, 2.3, 3, 4, 20];
  var T4 = {
    RF:   [[null, null, 2.5, 2.5, 2.46], [null, 1.2, 1.2, 1.2, 1.17]],
    LR:   [[null, 0.25, 0.25, 0.24, 0.25], [null, 0.16, 0.16, 0.16, 0.16]],
    SVM:  [[null, null, 35.2, 35.4, 34.9], [null, null, 22.1, 22.7, 22.2]],
    KNN:  [[null, null, "W", 0.8, 0.8], [null, 1.03, 1.02, 1.02, 1.02]],
    NB:   [[null, 0.02, 0.02, 0.02, 0.02], [null, 0.01, 0.01, 0.01, 0.01]],
    MLPC: [[null, 224, 234, 227, 216], [null, 84.7, 133.3, 81, 84]],
    MLPG: [[null, null, null, null, 26.8], [null, null, null, null, 27.4]]
  };

  // Table I, mapped to the extractor's columns. "page" marks a value the script
  // computes but does not write to its CSV (or does not compute); the page shows it.
  var TABLE1 = [
    { n: 1, name: "TLD", plain: "Length of the last part of the host name", col: "TLD", note: "The code stores the length of the last host label (\"com\" is 3), including any port." },
    { n: 2, name: "Ampersand", plain: "Ampersands (&)", col: "Count_&" },
    { n: 3, name: "HTTP Prefix", plain: "Times \"http\" appears", col: "Count_http", note: "Counts \"http\" anywhere, so \"https\" counts too." },
    { n: 4, name: "Dots in Domain", plain: "Dots in the host name", col: "Dots_domain" },
    { n: 5, name: "English Words", plain: "English words", col: null, page: "english_words_count", note: "Computed by the script but not written to its CSV." },
    { n: 6, name: "Alphabets in URL", plain: "Letters", col: "alphabets_url" },
    { n: 7, name: "Hyphens in Domain", plain: "Hyphens in the host name", col: "hyphen_domain" },
    { n: 8, name: "Dots Overall", plain: "Dots overall", col: "Dots Count", note: "The code counts the host name's dots here too, so this equals feature 4." },
    { n: 9, name: "Upper Case Ratio", plain: "Share of capital letters", col: null, page: "upper_ratio", note: "Not computed by the released script; the page shows capitals divided by URL length." },
    { n: 10, name: "Upper Case Letters", plain: "Capital letters", col: "upper_case_letter" },
    { n: 11, name: "Lower Case Letters", plain: "Lowercase letters", col: "lower_case_letter" },
    { n: 12, name: "Average English Words", plain: "Average English word length", col: "avg_english_words", note: "The code stores the average length of the English words found." },
    { n: 13, name: "IP or DNS", plain: "Host is a raw IP address", col: "ip_DNS" },
    { n: 14, name: "URL Length", plain: "Characters in the URL", col: "url_len" },
    { n: 15, name: "Percent Sign", plain: "Percent signs (%)", col: "Count_percent" }
  ];

  var PRESETS = [
    { label: "Plain page", url: "https://www.example.com/about" },
    { label: "Shop with a query", url: "https://shop.example.co.uk/Category/Shoes?size=10&color=Blue#reviews" },
    { label: "Raw IP address", url: "http://203.0.113.45/secure/login.php?acct=update&id=8812" },
    { label: "Look-alike login", url: "http://examplebank-secure-login.example.net/verify/account?session=7Fq2&user=A%20B" },
    { label: "No scheme", url: "example.org/downloads/Setup_v2.exe" }
  ];

  /* ------------------------------------------------------------ state */

  var state = {
    view: "t1",
    url: PRESETS[3].url,
    level: window.PaperKit ? window.PaperKit.level() : "public"
  };
  var listeners = [];
  function onChange(fn) { listeners.push(fn); }
  function changed(what) { listeners.forEach(function (fn) { fn(what); }); }
  document.addEventListener("paperlevel", function (e) { state.level = e.detail.level; changed("level"); });
  function deep() { return state.level === "grad" || state.level === "res"; }
  function atLeastUg() { return state.level === "ug" || deep(); }

  /* ------------------------------------------------------------ helpers */

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
    if (text != null) node.textContent = text;
    return node;
  }
  function chartWidth(node) {
    var w = node && node.parentNode ? node.parentNode.clientWidth : 640;
    return Math.max(300, Math.min(760, w || 640));
  }
  var resizers = [];
  var resizeTimer = null;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () { resizers.forEach(function (fn) { fn(); }); }, 150);
  });
  function seg(options, value, onPick, label) {
    var wrap = el("div", { class: "seg", role: "radiogroup", "aria-label": label });
    var btns = [];
    options.forEach(function (o) {
      var b = el("button", { type: "button", class: "seg-option", role: "radio", "aria-checked": String(o.value === value), text: o.label });
      if (o.title) b.title = o.title;
      b.addEventListener("click", function () { set(o.value); onPick(o.value); });
      wrap.appendChild(b);
      btns.push({ b: b, v: o.value });
    });
    function set(v) { value = v; btns.forEach(function (x) { x.b.setAttribute("aria-checked", String(x.v === v)); }); }
    wrap.set = set;
    return wrap;
  }
  function labeled(label, control, levels) {
    var row = el("div", { class: "mu-ctl" }, [el("span", { class: "mu-ctl-label", text: label }), control]);
    if (levels) row.setAttribute("data-levels", levels);
    return row;
  }
  function fmt(x, d) { return x == null || !isFinite(x) ? "–" : Number(x).toFixed(d == null ? 2 : d); }
  function num(x) {
    if (x == null) return "–";
    if (typeof x === "number" && !Number.isInteger(x)) return String(Number(x.toFixed(4)));
    return String(x);
  }
  function words(n) { return ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"][n] || String(n); }

  /* ------------------------------------------------------------ dictionary */

  var dictState = "idle", dictWaiters = [];
  function loadDict(cb) {
    if (E.wordsLoaded()) { cb(); return; }
    dictWaiters.push(cb);
    if (dictState === "loading") return;
    dictState = "loading";
    fetch(BASE + "en-us-words.txt").then(function (r) {
      if (!r.ok) throw new Error(r.status);
      return r.text();
    }).then(function (t) {
      E.loadWords(t); dictState = "ready";
      dictWaiters.splice(0).forEach(function (fn) { fn(); });
    }).catch(function () {
      dictState = "failed";
      dictWaiters.splice(0).forEach(function (fn) { fn(); });
    });
  }

  /* ------------------------------------------------------------ demo 1: read a link */

  function mountReader(root) {
    var input = el("input", { type: "text", class: "mu-url", spellcheck: "false", autocomplete: "off", "aria-label": "URL to read", value: state.url });
    var presets = el("div", { class: "w-actions" });
    PRESETS.forEach(function (p) {
      presets.appendChild(el("button", { type: "button", class: "w-btn w-btn-quiet", text: p.label, title: p.url, onclick: function () { input.value = p.url; state.url = p.url; changed("url"); } }));
    });
    var viewSeg = seg([
      { value: "t1", label: "The 15 kept features", title: "The paper's Table I" },
      { value: "all", label: "All 55 extracted", title: "Every column the authors' extractor writes" }
    ], state.view, function (v) { state.view = v; changed("view"); }, "Feature view");
    var viewRow = labeled("Show", viewSeg, "ug grad res");
    var parse = el("div", { class: "mu-parse" });
    var summary = el("p", { class: "mu-readout", "aria-live": "polite" });
    var tableWrap = el("div", { class: "mu-table-wrap" });
    var note = el("p", { class: "w-note" });
    root.appendChild(el("label", { class: "mu-ctl-label", for: "mu-url-input", text: "Type or paste a web address" }));
    input.id = "mu-url-input";
    root.appendChild(input);
    root.appendChild(presets);
    root.appendChild(viewRow);
    root.appendChild(parse);
    root.appendChild(summary);
    root.appendChild(tableWrap);
    root.appendChild(note);

    var timer = null;
    input.addEventListener("input", function () {
      clearTimeout(timer);
      timer = setTimeout(function () { state.url = input.value; changed("url"); }, 120);
    });

    function render() {
      var url = state.url;
      parse.innerHTML = ""; tableWrap.innerHTML = "";
      if (!url) { summary.textContent = "Type a web address to see what the detector reads from it."; return; }
      var r;
      try { r = E.extract(url); }
      catch (err) {
        summary.innerHTML = "";
        summary.appendChild(el("strong", { text: "Python would stop here. " }));
        summary.appendChild(document.createTextNode("Its URL parser rejects this address (" + err.message + "), so the authors' script would end with an error on this row."));
        return;
      }
      var f = r.features, x = r.extra, p = x.parsed;
      var dict = E.wordsLoaded();
      if (!dict && dictState !== "failed") loadDict(render);

      // parse breakdown (undergraduate and up)
      if (atLeastUg()) {
        [["scheme", p.scheme], ["netloc (host)", p.netloc], ["path", p.path], ["params", p.params], ["query", p.query], ["fragment", p.fragment]].forEach(function (kv) {
          parse.appendChild(el("span", { class: "mu-part" + (kv[1] ? "" : " empty") }, [
            el("span", { class: "mu-part-k", text: kv[0] }), el("code", { text: kv[1] || "(empty)" })
          ]));
        });
      }
      var ew = x.english_words;
      var host = p.netloc || "(none: no \"//\" after a scheme, so Python finds no host)";
      summary.innerHTML = "";
      summary.appendChild(el("strong", { text: f.url_len + " characters" }));
      summary.appendChild(document.createTextNode(", host " ));
      summary.appendChild(el("code", { text: host }));
      summary.appendChild(document.createTextNode(", " + f.alphabets_url + " letters (" + (f.upper_case_letter === 1 ? "one capital" : (f.upper_case_letter < 10 ? words(f.upper_case_letter) : f.upper_case_letter) + " capitals") + "), " +
        (dict ? (ew.length === 1 ? "one English word" : (ew.length < 10 ? words(ew.length) : ew.length) + " English words") + (ew.length ? ": " + ew.slice(0, 12).join(", ") + (ew.length > 12 ? ", …" : "") : "") : (dictState === "failed" ? "English words unavailable (the word list did not load)" : "loading the English word list…")) + "."));

      var showAll = state.view === "all" && atLeastUg();
      var t = el("table", { class: "results-table mu-ftable" });
      var head = el("tr", {}, showAll ?
        [el("th", { text: "Column" }), el("th", { text: "Value" }), el("th", { text: "Table I" })] :
        [el("th", { text: "#" }), el("th", { text: atLeastUg() ? "Table I feature" : "Feature" }), el("th", { text: "Value" }), el("th", { text: atLeastUg() ? "Column in the code" : "" })]);
      t.appendChild(el("thead", {}, [head]));
      var tb = el("tbody");
      if (showAll) {
        var inT1 = {};
        TABLE1.forEach(function (d) { if (d.col) inT1[d.col] = d.n; });
        E.COLUMNS.forEach(function (c) {
          var v = f[c];
          tb.appendChild(el("tr", { class: inT1[c] ? "on" : "" }, [
            el("td", {}, [el("code", { text: c })]),
            el("td", { class: "mu-num", text: v == null ? "…" : num(v) }),
            el("td", { class: "mu-num", text: inT1[c] ? "#" + inT1[c] : "" })
          ]));
        });
      } else {
        TABLE1.forEach(function (d) {
          var v;
          if (d.col) v = f[d.col];
          else if (d.page === "english_words_count") v = x.english_words_count;
          else if (d.page === "upper_ratio") v = f.url_len ? f.upper_case_letter / f.url_len : 0;
          var nameCell = el("td", {}, [document.createTextNode(atLeastUg() ? d.name : d.plain)]);
          if (d.note && atLeastUg()) nameCell.appendChild(el("span", { class: "mu-fnote", text: d.note }));
          tb.appendChild(el("tr", {}, [
            el("td", { class: "mu-num", text: String(d.n) }),
            nameCell,
            el("td", { class: "mu-num", text: v == null ? "…" : num(v) }),
            el("td", {}, [d.col ? el("code", { text: d.col }) : el("span", { class: "mu-fnote", text: atLeastUg() ? "page" : "" })])
          ]));
        });
      }
      t.appendChild(tb);
      tableWrap.appendChild(t);
      note.textContent = showAll ?
        "All 55 columns of the authors' Extracted_Features.csv, in order, computed by a JavaScript port checked against their Python on 59,981 addresses. Highlighted rows are Table I features with a column of their own." :
        (atLeastUg() ?
          "Values computed in your browser by a port of the authors' extractor. Two Table I features have no column in the released code; the page computes them and marks them \"page\"." :
          "Every number is computed in your browser from the text of the address alone. The detector never visits the page.");
    }
    onChange(function (what) {
      if (what === "url" || what === "view" || what === "level") {
        if (what === "url" && input.value !== state.url) input.value = state.url;
        render();
      }
    });
    render();
  }

  /* ------------------------------------------------------------ demo 2: information gain */

  function mountGain(root) {
    // Illustration counts the visitor sets; default follows the paper's 10:1 benign-to-malicious mix.
    var g = { a: [800, 1000], b: [200, 9000] };   // [malicious, benign] in each branch
    var presetsRow = el("div", { class: "w-actions" });
    var P = [
      { label: "Useless split", a: [500, 5000], b: [500, 5000] },
      { label: "Weak hint", a: [300, 1500], b: [700, 8500] },
      { label: "Strong hint", a: [800, 1000], b: [200, 9000] },
      { label: "Perfect split", a: [1000, 0], b: [0, 10000] }
    ];
    var sliders = {};
    var readout = el("p", { class: "mu-readout", "aria-live": "polite" });
    var chart = svg("svg", { class: "mu-chart", role: "img", "aria-label": "Entropy before and after the split" });
    P.forEach(function (p) {
      presetsRow.appendChild(el("button", { type: "button", class: "w-btn w-btn-quiet", text: p.label, onclick: function () { g.a = p.a.slice(); g.b = p.b.slice(); sync(); } }));
    });
    function slider(key, idx, label) {
      var s = el("input", { type: "range", min: "0", max: "10000", step: "50", value: String(g[key][idx]), "aria-label": label });
      var out = el("span", { class: "mu-num" });
      s.addEventListener("input", function () { g[key][idx] = +s.value; render(); });
      sliders[key + idx] = { s: s, out: out };
      return labeled(label, el("span", { class: "mu-slider" }, [s, out]));
    }
    root.appendChild(el("p", { class: "w-note", text: "Pick a yes-or-no feature, such as \"the host is a raw IP address.\" Set how many malicious and benign addresses land on each side." }));
    root.appendChild(presetsRow);
    var ctrls = el("div", { class: "mu-ctrls" }, [
      slider("a", 0, "Yes: malicious"), slider("a", 1, "Yes: benign"),
      slider("b", 0, "No: malicious"), slider("b", 1, "No: benign")
    ]);
    root.appendChild(ctrls);
    root.appendChild(chart);
    root.appendChild(readout);
    root.appendChild(el("p", { class: "w-note", text: "Illustration counts you set, not data from the paper. The paper keeps a feature when its importance score reaches 0.04." }));

    function sync() { Object.keys(sliders).forEach(function (k) { sliders[k].s.value = String(g[k[0]][+k[1]]); }); render(); }

    function render() {
      Object.keys(sliders).forEach(function (k) { sliders[k].out.textContent = g[k[0]][+k[1]].toLocaleString("en-US"); });
      var r = E.infoGain([g.a, g.b]);
      var hA = E.entropy(g.a[0], g.a[1]), hB = E.entropy(g.b[0], g.b[1]);
      var nA = g.a[0] + g.a[1], nB = g.b[0] + g.b[1], n = nA + nB;
      var W = chartWidth(chart), H = 214, L = 44, R = 16, T = 26, B = 44;
      chart.setAttribute("viewBox", "0 0 " + W + " " + H);
      chart.innerHTML = "";
      var y = function (v) { return T + (1 - v) * (H - T - B); };
      [0, 0.25, 0.5, 0.75, 1].forEach(function (v) {
        chart.appendChild(svg("line", { class: "c-grid", x1: L, x2: W - R, y1: y(v), y2: y(v) }));
        chart.appendChild(svg("text", { class: "c-tick", x: L - 6, y: y(v) + 4, "text-anchor": "end" }, v.toFixed(2)));
      });
      chart.appendChild(svg("text", { class: "c-label", x: 4, y: 10 }, "entropy (bits)"));
      var cols = [
        { lab: "Before", sub: "all " + n.toLocaleString("en-US"), v: r.parent, w: 1, cls: "mu-bar" },
        { lab: "Yes side", sub: (n ? Math.round(100 * nA / n) : 0) + "% of links", v: hA, w: n ? nA / n : 0, cls: "mu-bar alt" },
        { lab: "No side", sub: (n ? Math.round(100 * nB / n) : 0) + "% of links", v: hB, w: n ? nB / n : 0, cls: "mu-bar alt" },
        { lab: "After", sub: "weighted", v: r.remainder, w: 1, cls: "mu-bar" }
      ];
      var slot = (W - L - R) / cols.length;
      cols.forEach(function (c, i) {
        var bw = Math.max(6, slot * 0.6 * (i === 1 || i === 2 ? Math.max(0.15, c.w) : 1));
        var x0 = L + slot * i + (slot - bw) / 2;
        chart.appendChild(svg("rect", { class: c.cls, x: x0, y: y(c.v), width: bw, height: Math.max(0, y(0) - y(c.v)) }));
        chart.appendChild(svg("text", { class: "c-tick", x: L + slot * i + slot / 2, y: y(c.v) - 4, "text-anchor": "middle" }, c.v.toFixed(3)));
        chart.appendChild(svg("text", { class: "c-label", x: L + slot * i + slot / 2, y: H - 24, "text-anchor": "middle" }, c.lab));
        chart.appendChild(svg("text", { class: "c-tick", x: L + slot * i + slot / 2, y: H - 10, "text-anchor": "middle" }, c.sub));
      });
      readout.innerHTML = "";
      readout.appendChild(document.createTextNode("Information gain = " + r.parent.toFixed(3) + " − " + r.remainder.toFixed(3) + " = "));
      readout.appendChild(el("strong", { text: r.gain.toFixed(3) + " bits" }));
      readout.appendChild(document.createTextNode(r.gain >= 0.04 ? ". At or above 0.04, so this feature would be kept." : ". Below 0.04, so this feature would be dropped."));
      if (deep()) readout.appendChild(el("span", { class: "w-mono", text: "Eq. 3 in bits. The released code scores features with scikit-learn's mutual_info_classif, a nearest-neighbor estimate in nats; 0.04 nats is 0.058 bits." }));
    }
    resizers.push(render);
    onChange(function (what) { if (what === "level") render(); });
    render();
  }

  /* ------------------------------------------------------------ demo 3: memory */

  function mountMemory(root) {
    var data = null;
    var clf = "NB", nf = 15;
    var clfSeg = seg([
      { value: "NB", label: "Naive Bayes" },
      { value: "KNN", label: "k-nearest neighbors" },
      { value: "LR", label: "Logistic regression" }
    ], clf, function (v) { clf = v; render(); }, "Classifier");
    var slider = el("input", { type: "range", min: "1", max: "60", step: "1", value: String(nf), "aria-label": "Number of features" });
    var sOut = el("span", { class: "mu-num" });
    slider.addEventListener("input", function () { nf = +slider.value; render(); });
    var marks = el("div", { class: "w-actions" }, [
      el("button", { type: "button", class: "w-btn w-btn-quiet", text: "15 kept features", onclick: function () { nf = 15; slider.value = "15"; render(); } }),
      el("button", { type: "button", class: "w-btn w-btn-quiet", text: "All 55 features", onclick: function () { nf = 55; slider.value = "55"; render(); } })
    ]);
    var chart = svg("svg", { class: "mu-chart", role: "img", "aria-label": "Peak memory against number of features" });
    var readout = el("p", { class: "mu-readout", "aria-live": "polite" });
    var note = el("p", { class: "w-note" });
    root.appendChild(el("div", { class: "mu-ctrls" }, [labeled("Classifier", clfSeg), labeled("Features", el("span", { class: "mu-slider" }, [slider, sOut]))]));
    root.appendChild(marks);
    root.appendChild(chart);
    root.appendChild(readout);
    root.appendChild(note);

    fetch(BASE + "mem-data.json").then(function (r) { return r.json(); }).then(function (d) { data = d; render(); })
      .catch(function () { readout.textContent = "The measured memory data did not load."; });

    function series(c) { return data ? data.series[c] : []; }
    function at(c, n) {
      var s = series(c), best = null;
      s.forEach(function (p) { if (p[0] === n) best = p[1]; });
      if (best != null) return best;
      for (var i = 1; i < s.length; i++) if (s[i - 1][0] < n && s[i][0] > n) {
        var a = s[i - 1], b = s[i];
        if ((a[0] <= 15) !== (b[0] <= 15)) return null;
        return a[1] + (b[1] - a[1]) * (n - a[0]) / (b[0] - a[0]);
      }
      return null;
    }
    var PAPER = { NB: [8.32, 29.68], KNN: [21.79, 5.54], LR: [34.46, 115] };

    function render() {
      sOut.textContent = nf + (nf === 1 ? " feature" : " features");
      if (!data) return;
      var W = chartWidth(chart), H = 250, L = 46, R = 16, T = 26, B = 36;
      chart.setAttribute("viewBox", "0 0 " + W + " " + H);
      chart.innerHTML = "";
      var s = series(clf);
      var ymax = clf === "LR" ? 120 : 35;
      var x = function (n) { return L + (n - 1) / 59 * (W - L - R); };
      var y = function (v) { return T + (1 - v / ymax) * (H - T - B); };
      var step = clf === "LR" ? 20 : 5;
      for (var v = 0; v <= ymax; v += step) {
        chart.appendChild(svg("line", { class: "c-grid", x1: L, x2: W - R, y1: y(v), y2: y(v) }));
        chart.appendChild(svg("text", { class: "c-tick", x: L - 6, y: y(v) + 4, "text-anchor": "end" }, String(v)));
      }
      [1, 10, 15, 20, 30, 40, 55, 60].forEach(function (n) {
        chart.appendChild(svg("text", { class: "c-tick", x: x(n), y: H - B + 16, "text-anchor": "middle" }, String(n)));
      });
      chart.appendChild(svg("text", { class: "c-label", x: (L + W - R) / 2, y: H - 4, "text-anchor": "middle" }, "number of features"));
      chart.appendChild(svg("text", { class: "c-label", x: 4, y: 11 }, "peak memory, MiB (Table III prints it as GB)"));
      if (clf === "KNN") {
        chart.appendChild(svg("line", { class: "c-ref", x1: x(15.5), x2: x(15.5), y1: T, y2: H - B }));
        chart.appendChild(svg("text", { class: "c-tick", x: x(15.5) + 4, y: T + 10 }, "tree search ← | → brute force"));
      }
      // measured curve (split for KNN at the algorithm switch)
      var parts = clf === "KNN" ? [s.filter(function (p) { return p[0] <= 15; }), s.filter(function (p) { return p[0] > 15; })] : [s];
      parts.forEach(function (pp) {
        if (!pp.length) return;
        chart.appendChild(svg("path", { class: "mu-line", d: pp.map(function (p, i) { return (i ? "L" : "M") + x(p[0]).toFixed(1) + " " + y(p[1]).toFixed(1); }).join(" ") }));
      });
      // paper points
      [[15, PAPER[clf][0]], [55, PAPER[clf][1]]].forEach(function (pt) {
        var yy = y(Math.min(pt[1], ymax));
        chart.appendChild(svg("rect", { class: "mu-paper", x: x(pt[0]) - 5, y: yy - 5, width: 10, height: 10 }));
      });
      var cur = at(clf, nf);
      if (cur != null) chart.appendChild(svg("circle", { class: "mu-cur", cx: x(nf), cy: y(cur), r: 5 }));
      // legend
      var lg = svg("g", { transform: "translate(" + (L + 10) + "," + (T + 2) + ")" });
      lg.appendChild(svg("line", { class: "mu-line", x1: 0, x2: 18, y1: 6, y2: 6 }));
      lg.appendChild(svg("text", { class: "c-tick", x: 24, y: 10 }, "measured here (synthetic data)"));
      lg.appendChild(svg("rect", { class: "mu-paper", x: 4, y: 18, width: 10, height: 10 }));
      lg.appendChild(svg("text", { class: "c-tick", x: 24, y: 28 }, "Table III, as printed"));
      chart.appendChild(lg);

      var mb = cur == null ? null : cur * 1.048576;
      readout.innerHTML = "";
      if (cur == null) { readout.textContent = "No measurement at " + nf + " features."; }
      else {
        readout.appendChild(el("strong", { text: fmt(cur, 2) + " MiB" }));
        readout.appendChild(document.createTextNode(" peak for " + ({ NB: "Naive Bayes", KNN: "k-nearest neighbors", LR: "logistic regression" })[clf] + " with " + nf + " features" +
          (deep() ? " (" + fmt(mb, 1) + " MB, or " + fmt(cur / 1024, 4) + " GiB)" : "") +
          (clf === "KNN" && atLeastUg() ? ", using " + (E.knnAlgorithm(nf) === "brute" ? "brute-force distances" : "a k-d tree") : "") + "."));
        if (nf === 15 || nf === 55) {
          var pv = PAPER[clf][nf === 15 ? 0 : 1];
          readout.appendChild(document.createTextNode(" Table III prints " + pv + " \"GB\"" + (clf === "LR" ? "; this row does not reproduce." : "; the page measures " + fmt(cur, 2) + ", a difference of " + fmt(Math.abs(cur - pv), 2) + ".")));
        }
      }
      note.textContent = "Measured by running the authors' Classifier_gv4_w_mem.py, unchanged except for which classifier it calls, on random whole numbers shaped like the paper's data: " +
        data.rows.toLocaleString("en-US") + " rows, " + data.train.toLocaleString("en-US") + " used for training (scikit-learn " + data.sklearn + ", NumPy " + data.numpy + ", Python " + data.python + "). Naive Bayes and nearest-neighbor memory depends on the data's shape, not its values; logistic regression's does not match the paper.";
    }
    resizers.push(render);
    onChange(function (what) { if (what === "level") render(); });
    render();
  }

  /* ------------------------------------------------------------ demo 4: results */

  function mountResults(root) {
    var ds = "k", metric = 2;
    var dsSeg = seg([{ value: "k", label: "Kaggle (110K)" }, { value: "u", label: "UCI (110K)" }], ds, function (v) { ds = v; render(); }, "Dataset");
    var mSeg = seg([
      { value: 2, label: "Accuracy" }, { value: 3, label: "Precision" }, { value: 4, label: "Recall" },
      { value: 0, label: "Time (s)" }, { value: 1, label: "Memory" }
    ], metric, function (v) { metric = v; render(); }, "Measure");
    var chart = svg("svg", { class: "mu-chart", role: "img", "aria-label": "Table III, all features against the 15 kept features" });
    var readout = el("p", { class: "mu-readout", "aria-live": "polite" });
    var t4wrap = el("div", { class: "mu-table-wrap", "data-levels": "grad res" });
    root.appendChild(el("div", { class: "mu-ctrls" }, [labeled("Data set", dsSeg), labeled("Measure", mSeg)]));
    root.appendChild(chart);
    root.appendChild(readout);
    root.appendChild(t4wrap);

    function render() {
      var W = chartWidth(chart), rowH = 30, T = 26, L = W < 420 ? 62 : Math.min(170, W * 0.3), R = 96;
      var H = T + rowH * T3_ORDER.length + 10;
      chart.setAttribute("viewBox", "0 0 " + W + " " + H);
      chart.innerHTML = "";
      var max = 0;
      T3_ORDER.forEach(function (k) { T3[k][ds].forEach(function (r) { max = Math.max(max, r[metric]); }); });
      if (metric >= 2) max = 1;
      var x = function (v) { return L + (v / max) * (W - L - R); };
      [0, 0.25, 0.5, 0.75, 1].forEach(function (f) {
        chart.appendChild(svg("line", { class: "c-grid", x1: x(f * max), x2: x(f * max), y1: T - 6, y2: H - 6 }));
        chart.appendChild(svg("text", { class: "c-tick", x: x(f * max), y: T - 10, "text-anchor": "middle" }, metric >= 2 ? f.toFixed(2) : String(Math.round(f * max * 10) / 10)));
      });
      var better = 0, worse = 0;
      T3_ORDER.forEach(function (k, i) {
        var y0 = T + i * rowH, a = T3[k][ds][0][metric], b = T3[k][ds][1][metric];
        chart.appendChild(svg("text", { class: "c-label", x: 0, y: y0 + 16 }, W < 420 ? k.replace("MLPC", "MLP cpu").replace("MLPG", "MLP gpu") : T3[k].name));
        chart.appendChild(svg("rect", { class: "mu-bar alt", x: L, y: y0 + 3, width: Math.max(1, x(a) - L), height: 10 }));
        chart.appendChild(svg("rect", { class: "mu-bar", x: L, y: y0 + 14, width: Math.max(1, x(b) - L), height: 10 }));
        chart.appendChild(svg("text", { class: "c-tick", x: x(Math.max(a, b)) + 4, y: y0 + 18 }, num(a) + " → " + num(b)));
        var lowerBetter = metric <= 1;
        if (a !== b) { if ((b < a) === lowerBetter) better++; else worse++; }
      });
      var lg = svg("g", { transform: "translate(" + L + "," + (H - 2) + ")" });
      chart.setAttribute("viewBox", "0 0 " + W + " " + (H + 16));
      lg.appendChild(svg("rect", { class: "mu-bar alt", x: 0, y: 0, width: 12, height: 10 }));
      lg.appendChild(svg("text", { class: "c-tick", x: 16, y: 9 }, "all features"));
      lg.appendChild(svg("rect", { class: "mu-bar", x: 110, y: 0, width: 12, height: 10 }));
      lg.appendChild(svg("text", { class: "c-tick", x: 126, y: 9 }, "15 kept features"));
      chart.appendChild(lg);
      var mname = ["training time", "memory", "accuracy", "precision", "recall"][metric];
      readout.textContent = "Table III, as printed: with the 15 kept features, " + mname + " improves for " + words(better) + " of seven classifier rows and worsens for " + words(worse) +
        (7 - better - worse ? " (" + words(7 - better - worse) + " unchanged)" : "") + " on the " + (ds === "k" ? "Kaggle" : "UCI") + " data." +
        (metric === 1 ? " The memory column reads the same on both data sets, which fits a measurement set by the data's shape alone (see the demo above)." : "") +
        (metric === 0 ? " Times are the average of three runs on a Core i7-13700K." : "");

      // Table IV
      t4wrap.innerHTML = "";
      var t = el("table", { class: "results-table mu-t4" });
      t.appendChild(el("caption", { text: "Table IV (UCI): seconds to train under an address-space limit (RLIMIT_AS), as printed. N/A = out-of-memory failure." }));
      var hr = el("tr", {}, [el("th", { text: "Classifier" })]);
      ["All", "15 kept"].forEach(function (s) { T4_LIMITS.forEach(function (lim) { hr.appendChild(el("th", { class: "mu-num", text: s + " · " + lim + " GB" })); }); });
      t.appendChild(el("thead", {}, [hr]));
      var tb = el("tbody");
      T3_ORDER.forEach(function (k) {
        var tr = el("tr", {}, [el("td", { text: T3[k].name })]);
        T4[k].forEach(function (rowv) { rowv.forEach(function (v) { tr.appendChild(el("td", { class: "mu-num" + (v == null ? " na" : ""), text: v == null ? "N/A" : (v === "W" ? "long wait" : String(v)) })); }); });
        tb.appendChild(tr);
      });
      t.appendChild(tb);
      t4wrap.appendChild(t);
    }
    resizers.push(render);
    render();
  }

  /* ------------------------------------------------------------ mount */

  function mount(id, fn) {
    var node = document.getElementById(id);
    if (!node) return;
    node.classList.add("w-ready");
    fn(node);
  }
  function start() {
    mount("mu-reader", mountReader);
    mount("mu-gain", mountGain);
    mount("mu-memory", mountMemory);
    mount("mu-results", mountResults);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();

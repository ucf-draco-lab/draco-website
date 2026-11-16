/*
  Carbon credit ledger widget for /papers/carbon-credit-chain/.
  Mount points: #cc-offset, #cc-life, #cc-pool, #cc-chain.
  One shared state: the market (an illustrative 50/50 pool of DAI and carbon tokens with the
  paper's 0.3% fee, and a broker commission from the paper's 3 to 8% range), the number of
  verifiers, and which rules the ledger follows (the paper's design or the released code).
  Engines: carbon-engine.js (ledger model, design rules, SHA-256 chain) and balancer-math.js
  (Balancer V1 pool arithmetic, GPLv3).
*/
(function () {
  "use strict";

  var CC = window.CarbonChain, BM = window.BalancerMath;
  if (!CC || !BM || typeof BigInt === "undefined") return;

  var SVGNS = "http://www.w3.org/2000/svg";
  var B = BM.C.BONE;

  /* ------------------------------------------------------------ state */

  var state = {
    level: window.PaperKit ? window.PaperKit.level() : "public",
    poolDai: 50000, poolCarbon: 2000,   // illustrative pool: 25 DAI per token (the paper names no price)
    fee: 0.003,                          // Section 3.3.4
    broker: 0.05,                        // Section 1.3.2: 3 to 8 percent, average 5
    cap: 100, emitted: 120, land: 50,    // Section 1.3.1 example
    verifiers: 5,
    rules: "design",
    zeros: 3
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
      if (o.levels) b.setAttribute("data-levels", o.levels);
      b.addEventListener("click", function () { set(o.value); onPick(o.value); });
      wrap.appendChild(b);
      btns.push({ b: b, v: o.value });
    });
    function set(v) { value = v; btns.forEach(function (x) { x.b.setAttribute("aria-checked", String(x.v === v)); }); }
    wrap.set = set;
    return wrap;
  }
  function labeled(label, control, levels) {
    var row = el("div", { class: "cc-ctl" }, [el("span", { class: "cc-ctl-label", text: label }), control]);
    if (levels) row.setAttribute("data-levels", levels);
    return row;
  }
  function range(label, min, max, step, value, fmt, onInput, levels) {
    var input = el("input", { type: "range", min: String(min), max: String(max), step: String(step), value: String(value), "aria-label": label });
    var out = el("output", { text: fmt(value) });
    input.addEventListener("input", function () { out.textContent = fmt(Number(input.value)); onInput(Number(input.value)); });
    var row = el("label", { class: "w-range" }, [el("span", { text: label }), input, out]);
    if (levels) row.setAttribute("data-levels", levels);
    row.set = function (v) { input.value = String(v); out.textContent = fmt(v); };
    return row;
  }
  function btn(text, onClick, quiet) {
    return el("button", { type: "button", class: "w-btn" + (quiet ? " w-btn-quiet" : ""), text: text, onclick: onClick });
  }
  function int(x) { return Math.round(x).toLocaleString("en-US"); }
  function money(x, d) { return x.toLocaleString("en-US", { minimumFractionDigits: d == null ? 2 : d, maximumFractionDigits: d == null ? 2 : d }); }
  function pct(x, d) { return (x * 100).toFixed(d == null ? 1 : d).replace(/\.0+$/, "") + "%"; }
  function words(n) { return ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"][n] || int(n); }
  function feeFixed(f) { return BM.toFixed(f.toFixed(8)); }
  function poolOf() { return { dai: BM.toFixed(state.poolDai), carbon: BM.toFixed(state.poolCarbon) }; }
  function spot() {
    var p = poolOf();
    return BM.toNumber(BM.calcSpotPrice(p.dai, B, p.carbon, B, 0n));
  }
  // Cost in DAI of buying n carbon tokens from the pool (Balancer swapExactAmountOut).
  function poolBuy(n) {
    var p = poolOf();
    if (n <= 0) return { ok: true, cost: 0, fee: 0, spotAfter: spot(), avg: spot() };
    try {
      var r = BM.swapExactAmountOut(BM.pool(p.dai, B, p.carbon, B, feeFixed(state.fee)), BM.toFixed(n));
      var cost = BM.toNumber(r.amountIn);
      return { ok: true, cost: cost, fee: cost * state.fee, spotAfter: BM.toNumber(r.spotAfter) * (1 - state.fee), avg: cost / n };
    } catch (e) { return { ok: false, reason: e.revert || e.message }; }
  }

  /* ------------------------------------------------------------ demo 1: balance the books */

  function mountOffset(root) {
    root.classList.add("w-ready");
    var chart = svg("svg", { class: "cc-chart", role: "img" });
    var readout = el("p", { class: "cc-readout", "aria-live": "polite" });
    var table = el("div", { class: "cc-table-wrap" });
    var cap = range("Allowance (tons)", 50, 200, 5, state.cap, int, function (v) { state.cap = v; draw(); });
    var em = range("Emitted (tons)", 50, 250, 5, state.emitted, int, function (v) { state.emitted = v; draw(); });
    var land = range("Landowner's credits", 0, 120, 5, state.land, int, function (v) { state.land = v; draw(); });
    var brk = range("Broker commission", 3, 8, 0.5, state.broker * 100, function (v) { return v.toFixed(1) + "%"; }, function (v) { state.broker = v / 100; changed("market"); });
    var preset = btn("Paper's example (100, 120, 50)", function () {
      state.cap = 100; state.emitted = 120; state.land = 50;
      cap.set(100); em.set(120); land.set(50); draw();
    }, true);
    root.appendChild(el("div", { class: "cc-controls" }, [cap, em, land, brk]));
    root.appendChild(el("div", { class: "w-actions" }, [preset]));
    root.appendChild(chart);
    root.appendChild(readout);
    root.appendChild(table);
    root.appendChild(el("p", { class: "w-note", text: "Prices are the page's illustration: a pool holding 50,000 DAI (a dollar-pegged token) and 2,000 carbon tokens, so one token starts at 25 DAI. The paper names no price. The 0.3% pool fee and the 3 to 8% broker range are the paper's." }));

    function draw() {
      var o = CC.offset(state.cap, state.emitted, state.land);
      var W = chartWidth(chart), rowH = 30, labelW = 150, H = rowH * 4 + 26;
      chart.setAttribute("viewBox", "0 0 " + W + " " + H); chart.setAttribute("width", W); chart.setAttribute("height", H);
      chart.innerHTML = "";
      var maxV = Math.max(250, state.cap + o.bought, state.emitted, state.land);
      var sx = function (v) { return labelW + (W - labelW - 50) * v / maxV; };
      var rows = [
        { label: "Allowance", parts: [{ v: state.cap, cls: "cap" }, { v: o.bought, cls: "bought" }] },
        { label: "Emitted", parts: [{ v: state.emitted, cls: o.compliant ? "em" : "over" }] },
        { label: "Landowner sells", parts: [{ v: o.bought, cls: "bought" }] },
        { label: "Landowner keeps", parts: [{ v: o.sellerLeft, cls: "keep" }] }
      ];
      rows.forEach(function (r, i) {
        var y = 8 + i * rowH, x = labelW, tot = 0;
        chart.appendChild(svg("text", { class: "c-label", x: 0, y: y + 15 }, r.label));
        r.parts.forEach(function (p) {
          if (p.v <= 0) return;
          var w = sx(tot + p.v) - sx(tot);
          chart.appendChild(svg("rect", { class: "cc-bar " + p.cls, x: x, y: y + 3, width: Math.max(1, w), height: 16 }));
          x += w; tot += p.v;
        });
        chart.appendChild(svg("text", { class: "c-tick", x: sx(tot) + 6, y: y + 15 }, int(tot)));
      });
      var capX = sx(state.cap + o.bought);
      chart.appendChild(svg("line", { class: "cc-limit", x1: capX, x2: capX, y1: 4, y2: 8 + rowH * 2 }));
      chart.appendChild(svg("text", { class: "c-tick", x: labelW, y: H - 4 }, "tons of CO₂ (one credit = one ton)"));
      chart.setAttribute("aria-label", "Allowance " + state.cap + " plus " + o.bought + " credits bought; emitted " + state.emitted + ".");

      var txt;
      if (o.shortfall === 0) txt = "Company A emitted " + int(state.emitted) + " tons, within its allowance of " + int(state.cap) + ". It needs no credits, and the landowner keeps all " + int(state.land) + ".";
      else if (o.uncovered === 0) txt = "Company A emitted " + int(state.emitted) + " tons against an allowance of " + int(state.cap) + ", a shortfall of " + int(o.shortfall) + ". It buys " + int(o.bought) + " credits from Landowner B, who keeps " + int(o.sellerLeft) + ", and its limit rises to " + int(o.newCap) + ".";
      else txt = "Company A is " + int(o.shortfall) + " tons over. Landowner B has only " + int(state.land) + " credits to sell, so " + int(o.uncovered) + " tons stay uncovered and Company A is out of compliance.";
      readout.textContent = txt;

      var n = o.bought, s0 = spot(), pb = poolBuy(n);
      var brokerCost = n * s0 * (1 + state.broker);
      table.innerHTML = "";
      if (n === 0) return;
      var rowsT = [
        ["Through a broker", money(brokerCost) + " DAI", money(n * s0 * state.broker) + " DAI commission (" + pct(state.broker) + ")"],
        pb.ok ? ["Through the pool", money(pb.cost) + " DAI", money(pb.fee) + " DAI fee (" + pct(state.fee, 1) + "), " + money(pb.cost - pb.fee - n * s0) + " DAI price impact"] : ["Through the pool", "not possible", pb.reason]
      ];
      var t = el("table", { class: "results-table cc-cost" }, [
        el("caption", { class: "w-note", text: "Cost of " + int(n) + " credits at " + money(s0) + " DAI each, computed by the page." }),
        el("thead", null, [el("tr", null, [el("th", { text: "Route" }), el("th", { text: "Total" }), el("th", { text: "Paid to the middle" })])]),
        el("tbody", null, rowsT.map(function (r) { return el("tr", null, r.map(function (c, i) { return el("td", { class: i ? "cc-num" : "", text: c }); })); }))
      ]);
      table.appendChild(t);
    }
    draw();
    resizers.push(draw);
    onChange(function (w) { if (w === "market") draw(); });
  }

  /* ------------------------------------------------------------ demo 2: a token's life */

  var STEPS = [
    { key: "register", label: "Register" },
    { key: "verify", label: "Verifiers approve" },
    { key: "mint", label: "Mint" },
    { key: "trade", label: "Sell 20 to Company A" },
    { key: "burn", label: "Burn 20" },
    { key: "cert", label: "Certificate" }
  ];

  function mountLife(root) {
    root.classList.add("w-ready");
    var rulesSeg = seg([
      { value: "design", label: "The paper's design", title: "Four contracts as Section 3.3 describes them" },
      { value: "code", label: "The released code", title: "The three contracts in the paper's GitHub link, as they run" }
    ], state.rules, function (v) { state.rules = v; reset(); }, "Ledger rules");
    var nRange = range("Verifiers", 3, 10, 1, state.verifiers, int, function (v) { state.verifiers = v; votes = votes.slice(0, v); while (votes.length < v) votes.push(false); reset(); });
    var voteRow = el("div", { class: "cc-votes", role: "group", "aria-label": "Verifier approvals" });
    var need = el("p", { class: "w-note" });
    var stepRow = el("div", { class: "cc-steps" });
    var ledgerBox = el("div", { class: "cc-table-wrap" });
    var logBox = el("ol", { class: "cc-log", "aria-live": "polite" });
    var votes = [true, true, true, true, true];
    var L, D, done, logRows;

    root.appendChild(labeled("Rules", rulesSeg, "ug grad res"));
    root.appendChild(nRange);
    root.appendChild(el("div", { class: "cc-ctl" }, [el("span", { class: "cc-ctl-label", text: "Approvals" }), voteRow]));
    root.appendChild(need);
    root.appendChild(stepRow);
    root.appendChild(el("div", { class: "w-actions" }, [btn("Next step", next), btn("Mint again", mintAgain, true), btn("Start over", reset, true)]));
    root.appendChild(ledgerBox);
    root.appendChild(logBox);

    function rules() { return atLeastUg() ? state.rules : "design"; }
    var names = { owner: "Deployer", B: "Landowner B", A: "Company A" };
    function vname(i) { return "Verifier " + (i + 1); }
    function who(id) { return names[id] || (id.charAt(0) === "v" ? vname(Number(id.slice(1))) : id); }

    function reset() {
      L = new CC.Ledger("owner");
      D = { registered: false, approved: false, minted: 0, B: 0, A: 0, burned: 0, certs: 0, supply: 0 };
      done = 0; logRows = [];
      drawVotes(); draw();
    }
    function log(actor, action, ok, detail) { logRows.push({ actor: actor, action: action, ok: ok, detail: detail }); }
    function drawVotes() {
      voteRow.innerHTML = "";
      votes.forEach(function (v, i) {
        var b = el("button", { type: "button", class: "cc-vote", "aria-pressed": String(v), title: vname(i) + (v ? " approves" : " has not approved"), text: String(i + 1) });
        b.addEventListener("click", function () { votes[i] = !votes[i]; drawVotes(); drawNeed(); });
        voteRow.appendChild(b);
      });
      drawNeed();
    }
    function drawNeed() {
      var n = state.verifiers, yes = votes.filter(Boolean).length, k = CC.Design.needed(n);
      if (rules() === "design") need.textContent = yes + " of " + n + " verifiers approve; at least 70% means " + k + " of " + n + ". " + (CC.Design.approved(yes, n) ? "Enough to act." : "Not enough yet.");
      else need.textContent = "In the released code, each pressed verifier sends its own approval. Only the most recently registered verifier (Verifier " + n + ") passes the contract's check.";
    }
    function nextDesign(step) {
      var n = state.verifiers, yes = votes.filter(Boolean).length, ok;
      switch (step) {
        case "register":
          D.registered = true;
          log("Registry", "records Landowner B (50 credits awaiting verification), Company A, and " + n + " verifiers", true);
          return true;
        case "verify":
          ok = CC.Design.approved(yes, n);
          log(yes + " of " + n + " verifiers", "approve Landowner B's 50 credits", ok, ok ? null : "needs " + CC.Design.needed(n) + " of " + n);
          if (ok) D.approved = true;
          return ok;
        case "mint":
          if (D.minted) { log("Token contract", "mint 50 tokens again", false, "these credits were already tokenized"); return false; }
          D.minted = 50; D.B += 50; D.supply += 50;
          log("Token contract", "mints 50 carbon tokens to Landowner B", true);
          return true;
        case "trade":
          D.B -= 20; D.A += 20;
          log("Landowner B", "sends 20 tokens to Company A", true);
          return true;
        case "burn":
          ok = CC.Design.approved(yes, n);
          log(yes + " of " + n + " verifiers", "approve Company A's burn of 20 tokens", ok, ok ? null : "needs " + CC.Design.needed(n) + " of " + n);
          if (!ok) return false;
          D.A -= 20; D.burned += 20; D.supply -= 20;
          log("Company A", "burns 20 tokens (20 tons offset)", true);
          return true;
        case "cert":
          D.certs = CC.Design.certificates(D.burned);
          log("Certificate contract", "issues " + D.certs + " certificate" + (D.certs === 1 ? "" : "s") + " (one per 20 burned tokens)", D.certs > 0);
          return true;
      }
    }
    function call(sender, fn, args, value) {
      var r = L.call(fn, sender, args, value);
      log(who(sender), fn + "(" + (args || []).map(function (a) { return typeof a === "bigint" ? a.toString() : (names[a] || (a.charAt && a.charAt(0) === "v" ? vname(Number(a.slice(1))) : a)); }).join(", ") + ")", r.ok, r.ok ? null : (r.revert ? "reverted: “" + r.revert + "”" : "reverted (no reason given)"));
      return r.ok;
    }
    function nextCode(step) {
      var n = state.verifiers, any = false, i;
      switch (step) {
        case "register":
          for (i = 0; i < n; i++) call("v" + i, "registerVerifiers", [vname(i), "US", BigInt(100 + i), BigInt(i + 1)]);
          call("B", "registerCreditHolder", ["Landowner B", 1n, 50n, 25n, 365n]);
          call("A", "registerCustomer", ["Company", "A", "a@example.org", 0n]);
          return true;
        case "verify":
          for (i = 0; i < n; i++) if (votes[i]) any = call("v" + i, "approveCreditsHeld", ["B"]) || any;
          return any;
        case "mint": return call("B", "createCarbonToken", []);
        case "trade": return call("B", "transferCredits", ["A", 20n]);
        case "burn":
          call("v" + (n - 1), "approveBurn", [20n, "A"]);
          return call("A", "burnTokens", []);
        case "cert":
          call("A", "addBurnedTokens", ["A"]);
          log("Certificate contract", "mint(Company A, 1): declared internal, so no account can call it", false, "no certificate");
          return false;
      }
    }
    function next() {
      if (done >= STEPS.length) return;
      var step = STEPS[done].key;
      var ok = rules() === "design" ? nextDesign(step) : nextCode(step);
      if (ok || rules() === "code" || step === "cert") done++;
      draw();
    }
    function mintAgain() {
      if (done < 3) { log("", "mint again", false, "mint once first"); draw(); return; }
      if (rules() === "design") nextDesign("mint"); else call("B", "createCarbonToken", []);
      draw();
    }
    function balances() {
      if (rules() === "design") return { B: D.B, A: D.A, burned: D.burned, supply: D.supply, certs: D.certs };
      var g = function (f, a) { return Number(L.view(f, a)); };
      return { B: g("balanceOf", ["B"]), A: g("balanceOf", ["A"]), burned: g("burnedTokens", ["A"]), supply: g("totalSupply", []), certs: 0 };
    }
    function draw() {
      stepRow.innerHTML = "";
      STEPS.forEach(function (s, i) {
        stepRow.appendChild(el("span", { class: "cc-step" + (i < done ? " done" : i === done ? " now" : ""), text: (i + 1) + ". " + s.label }));
      });
      var b = balances();
      ledgerBox.innerHTML = "";
      ledgerBox.appendChild(el("table", { class: "results-table cc-ledger" }, [
        el("thead", null, [el("tr", null, ["Landowner B", "Company A", "Burned by A", "Tokens in existence", "Certificates"].map(function (h) { return el("th", { text: h }); }))]),
        el("tbody", null, [el("tr", null, [b.B, b.A, b.burned, b.supply, b.certs].map(function (v) { return el("td", { class: "cc-num", text: int(v) }); }))])
      ]));
      logBox.innerHTML = "";
      logRows.slice(-12).forEach(function (r) {
        logBox.appendChild(el("li", { class: r.ok ? "ok" : "bad" }, [
          el("span", { class: "cc-mark", text: r.ok ? "✓" : "✗" }),
          el("b", { text: r.actor ? r.actor + " " : "" }), r.action,
          r.detail ? el("i", { text: " — " + r.detail }) : null
        ]));
      });
      if (!logRows.length) logBox.appendChild(el("li", { class: "cc-empty", text: "Press Next step to register the parties." }));
    }
    onChange(function (w) { if (w === "level") { if (!atLeastUg() && state.rules === "code") { /* public views always show the design */ } reset(); } });
    reset();
  }

  /* ------------------------------------------------------------ demo 3: the pool */

  function mountPool(root) {
    root.classList.add("w-ready");
    var buy = 20;
    var chart = svg("svg", { class: "cc-chart", role: "img" });
    var readout = el("div", { class: "cc-rows", "aria-live": "polite" });
    var amt = range("Tokens to buy", 1, 650, 1, buy, int, function (v) { buy = v; draw(); });
    var depth = range("Pool size (DAI)", 5000, 500000, 5000, state.poolDai, function (v) { return int(v); }, function (v) { state.poolDai = v; state.poolCarbon = v / 25; changed("market"); }, "ug grad res");
    var fees = [0.0001, 0.001, 0.003, 0.01, 0.03, 0.1];
    var feeSeg = seg(fees.map(function (f) { return { value: f, label: pct(f, f < 0.001 ? 2 : 1), title: f === 0.003 ? "The paper's example fee" : "" }; }), state.fee, function (v) { state.fee = v; changed("market"); }, "Pool fee");
    root.appendChild(amt);
    root.appendChild(depth);
    root.appendChild(labeled("Pool fee", feeSeg, "grad res"));
    root.appendChild(chart);
    root.appendChild(readout);

    function draw() {
      var maxBuy = Math.floor(state.poolCarbon / 3);
      var n = Math.min(buy, maxBuy);
      var W = chartWidth(chart), H = Math.round(Math.min(360, W * 0.6)), m = { l: 58, r: 16, t: 30, b: 38 };
      chart.setAttribute("viewBox", "0 0 " + W + " " + H); chart.setAttribute("width", W); chart.setAttribute("height", H);
      chart.innerHTML = "";
      var x0 = state.poolDai, y0 = state.poolCarbon, k = x0 * y0;
      var xMax = x0 * 2.2, yMax = y0 * 1.6;
      var sx = function (x) { return m.l + (W - m.l - m.r) * x / xMax; };
      var sy = function (y) { return H - m.b - (H - m.t - m.b) * y / yMax; };
      for (var g = 0; g <= 4; g++) {
        var gx = xMax * g / 4, gy = yMax * g / 4;
        chart.appendChild(svg("line", { class: "c-grid", x1: sx(gx), x2: sx(gx), y1: sy(0), y2: sy(yMax) }));
        chart.appendChild(svg("line", { class: "c-grid", x1: sx(0), x2: sx(xMax), y1: sy(gy), y2: sy(gy) }));
        chart.appendChild(svg("text", { class: "c-tick", x: sx(gx), y: H - m.b + 14, "text-anchor": "middle" }, int(gx)));
        chart.appendChild(svg("text", { class: "c-tick", x: m.l - 6, y: sy(gy) + 4, "text-anchor": "end" }, int(gy)));
      }
      chart.appendChild(svg("text", { class: "c-label", x: (m.l + W - m.r) / 2, y: H - 6, "text-anchor": "middle" }, "DAI in the pool"));
      chart.appendChild(svg("text", { class: "c-label", x: m.l - 6, y: 12, "text-anchor": "end" }, "tokens"));
      var d = "", first = true;
      for (var i = 0; i <= 160; i++) {
        var x = xMax * (0.08 + 0.92 * i / 160), y = k / x;
        if (y > yMax) continue;
        d += (first ? "M" : "L") + sx(x).toFixed(1) + " " + sy(y).toFixed(1); first = false;
      }
      chart.appendChild(svg("path", { class: "cc-curve", d: d }));
      var r = poolBuy(n), s0 = x0 / y0;
      chart.appendChild(svg("circle", { class: "cc-pt start", cx: sx(x0), cy: sy(y0), r: 5 }));
      chart.appendChild(svg("text", { class: "c-label", x: sx(x0) - 10, y: sy(y0) - 10, "text-anchor": "end" }, "before: " + money(s0) + " DAI per token"));
      if (r.ok && n > 0) {
        var x1 = x0 + r.cost, y1 = y0 - n;
        chart.appendChild(svg("line", { class: "cc-move", x1: sx(x0), y1: sy(y0), x2: sx(x1), y2: sy(y1) }));
        chart.appendChild(svg("circle", { class: "cc-pt end", cx: sx(x1), cy: sy(y1), r: 5 }));
        chart.appendChild(svg("text", { class: "c-label cc-end-label", x: sx(x1) + 8, y: sy(y1) + 16 }, "after: " + money(x1 / y1) + " DAI per token"));
      }
      chart.setAttribute("aria-label", "Constant-product curve for a pool of " + int(x0) + " DAI and " + int(y0) + " tokens; buying " + n + " tokens.");

      readout.innerHTML = "";
      var rows = [];
      if (!r.ok) rows.push(["Pool says", r.reason]);
      else {
        var brokerTotal = n * s0 * (1 + state.broker);
        rows.push(["You pay the pool", money(r.cost) + " DAI for " + int(n) + " tokens (" + money(r.avg) + " each)"]);
        rows.push(["Of that, the pool fee", money(r.fee) + " DAI (" + pct(state.fee, state.fee < 0.001 ? 2 : 1) + "), kept for the liquidity providers"]);
        rows.push(["Price impact", money(r.cost - r.fee - n * s0) + " DAI (" + pct((r.cost - r.fee - n * s0) / (n * s0), 2) + " above the starting price)"]);
        rows.push(["A broker at " + pct(state.broker), money(brokerTotal) + " DAI at the starting price"]);
        rows.push(["Price after the trade", money(r.spotAfter) + " DAI per token, before the fee"]);
      }
      if (buy > maxBuy) rows.push(["Limit", "Balancer pools refuse to pay out more than a third of a balance in one trade (" + int(maxBuy) + " tokens here)"]);
      rows.forEach(function (rw) { readout.appendChild(el("div", { class: "cc-row" }, [el("span", { class: "cc-row-k", text: rw[0] }), el("span", { class: "cc-row-v", text: rw[1] })])); });
    }
    draw();
    resizers.push(draw);
    onChange(function (w) { if (w === "market") { depth.set(state.poolDai); feeSeg.set(state.fee); draw(); } });
  }

  /* ------------------------------------------------------------ demo 4: tamper with the chain */

  var CHAIN_DATA = [
    "Verifiers approve 50 credits for Landowner B",
    "Mint 50 carbon tokens to Landowner B",
    "Landowner B sends 20 tokens to Company A",
    "Company A burns 20 tokens"
  ];

  function mountChain(root) {
    root.classList.add("w-ready");
    var chain = [], busy = false, hashesTotal = 0;
    var zs = [1, 2, 3, 4, 5];
    var zSeg = seg(zs.map(function (z) { return { value: z, label: String(z), levels: z === 5 ? "grad res" : null }; }), state.zeros, function (v) { state.zeros = v; rebuild(); }, "Difficulty");
    var rowsBox = el("div", { class: "cc-blocks" });
    var status = el("p", { class: "cc-readout", "aria-live": "polite" });
    var tamperBtn = btn("Change 20 to 200 in block 2", tamper);
    var remineAll = btn("Re-mine from the change on", remineFrom, true);
    var honest = btn("Restore the honest chain", rebuild, true);
    root.appendChild(labeled("Leading zeros", zSeg));
    root.appendChild(el("div", { class: "w-actions" }, [tamperBtn, remineAll, honest]));
    root.appendChild(rowsBox);
    root.appendChild(status);

    function short(h) { return h.slice(0, 16) + "…"; }
    function hashSpan(h) {
      var z = 0; while (z < h.length && h.charCodeAt(z) === 48) z++;
      return el("span", { class: "cc-hash" }, [el("b", { text: h.slice(0, z) }), short(h).slice(z)]);
    }
    function draw() {
      var v = CC.validate(chain, state.zeros);
      rowsBox.innerHTML = "";
      chain.forEach(function (b, i) {
        var ok = v[i].linkOk && v[i].workOk;
        var input = el("input", { type: "text", class: "cc-data", value: b.data, "aria-label": "Block " + i + " contents" });
        input.addEventListener("input", function () { b.data = input.value; drawStatusOnly(); });
        var mineBtn = btn("Mine", function () { mineOne(i); }, true);
        var row = el("div", { class: "cc-block" + (ok ? "" : " broken") }, [
          el("span", { class: "cc-bidx", text: "Block " + i }),
          input,
          el("span", { class: "cc-bmeta" }, [el("span", { class: "w-mono", text: "prev " }), hashSpan(b.prev), el("span", { class: "w-mono", text: "  nonce " + int(b.nonce) + "  hash " }), hashSpan(v[i].hash)]),
          el("span", { class: "cc-bstat" }, [ok ? "valid" : [!v[i].workOk ? "proof of work missing" : "", !v[i].linkOk ? "link to block " + (i - 1) + " broken" : ""].filter(Boolean).join("; "), " ", mineBtn])
        ]);
        rowsBox.appendChild(row);
      });
      drawStatus(v);
    }
    var statusTimer = null;
    function drawStatusOnly() { clearTimeout(statusTimer); statusTimer = setTimeout(draw, 250); }
    function drawStatus(v) {
      var bad = v.filter(function (r) { return !(r.linkOk && r.workOk); }).length;
      var per = Math.pow(16, state.zeros);
      status.textContent = (bad ? bad + " of " + chain.length + " blocks fail. " : "All " + chain.length + " blocks check out. ") +
        "Each block needs a hash that starts with " + words(state.zeros) + " zero" + (state.zeros === 1 ? "" : "s") + ", about " + int(per) + " tries on average. Hashes computed on this device so far: " + int(hashesTotal) + ".";
    }
    // Mine block i in slices so the page stays responsive.
    function mineAsync(i, done) {
      var b = chain[i];
      b.prev = i === 0 ? CC.GENESIS_PREV : CC.blockHash(chain[i - 1]);
      var n = 0, t0 = Date.now();
      busy = true; root.classList.add("busy");
      (function slice() {
        var start = Date.now(), r;
        do { r = CC.mine(b, state.zeros, 4000, n); hashesTotal += r.tries; n = r.nonce; if (r.found) break; } while (Date.now() - start < 180);
        if (r.found) { b.nonce = r.nonce; b.hash = r.hash; busy = false; root.classList.remove("busy"); draw(); if (done) done(Date.now() - t0); }
        else { n = r.nonce; status.textContent = "Mining block " + i + ": " + int(n) + " nonces tried…"; setTimeout(slice, 0); }
      })();
    }
    function mineOne(i) { if (!busy) mineAsync(i); }
    function remineFrom() {
      if (busy) return;
      var v = CC.validate(chain, state.zeros), from = -1;
      for (var i = 0; i < v.length; i++) if (!(v[i].linkOk && v[i].workOk)) { from = i; break; }
      if (from < 0) { draw(); return; }
      (function go(j) { if (j >= chain.length) return; mineAsync(j, function () { go(j + 1); }); })(from);
    }
    function tamper() {
      if (busy) return;
      chain[2].data = CHAIN_DATA[2].replace("20 tokens", "200 tokens");
      draw();
    }
    function rebuild() {
      if (busy) return;
      chain = CHAIN_DATA.map(function (d, i) { return { index: i, prev: CC.GENESIS_PREV, data: d, nonce: 0, hash: "" }; });
      (function go(j) { if (j >= chain.length) { draw(); return; } mineAsync(j, function () { go(j + 1); }); })(0);
    }
    rebuild();
  }

  /* ------------------------------------------------------------ mount */

  function mount(id, fn) { var node = document.getElementById(id); if (node) fn(node); }
  function start() {
    mount("cc-offset", mountOffset);
    mount("cc-life", mountLife);
    mount("cc-pool", mountPool);
    mount("cc-chain", mountChain);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();

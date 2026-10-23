/*
  Blockchain election widget for /papers/blockchain-elections/.
  Mount points: #be-vote, #be-observe, #be-majority, #be-ring.
  One shared state: the reading level, the candidates, and the ballot choice.
  Engine: election-engine.js (SHA-256, hash-linked chains, the re-invent and
  re-use procedures, majority agreement, ElGamal, and LSAG ring signatures).
*/
(function () {
  "use strict";

  var E = window.ElectionEngine;
  if (!E || typeof BigInt === "undefined") return;

  var SVGNS = "http://www.w3.org/2000/svg";
  var state = {
    level: window.PaperKit ? window.PaperKit.level() : "public",
    candidates: ["Candidate A", "Candidate B", "Candidate C"],
    choice: 1
  };
  var listeners = [];
  function onChange(fn) { listeners.push(fn); }
  function changed(what) { listeners.forEach(function (fn) { fn(what); }); }
  document.addEventListener("paperlevel", function (e) { state.level = e.detail.level; changed("level"); });
  function deep() { return state.level === "grad" || state.level === "res"; }

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
  var resizers = [], resizeTimer = null;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () { resizers.forEach(function (fn) { fn(); }); }, 150);
  });
  function seg(options, value, onPick, label) {
    var wrap = el("div", { class: "seg", role: "radiogroup", "aria-label": label });
    var btns = [];
    options.forEach(function (o) {
      var b = el("button", { type: "button", class: "seg-option", role: "radio", "aria-checked": String(o.value === value), text: o.label });
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
    var row = el("div", { class: "be-ctl" }, [el("span", { class: "be-ctl-label", text: label }), control]);
    if (levels) row.setAttribute("data-levels", levels);
    return row;
  }
  function btn(text, onClick, quiet) {
    return el("button", { type: "button", class: "w-btn" + (quiet ? " w-btn-quiet" : ""), text: text, onclick: onClick });
  }
  function short(h, n) { h = String(h); n = n || 10; return h.length > n ? h.slice(0, n) + "…" : h; }
  function bigShort(b, n) { return short(E.hex(b), n || 12); }
  function words(n) { return ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"][n] || n.toLocaleString("en-US"); }
  function pct(x, d) { return (x * 100).toFixed(d == null ? 1 : d) + "%"; }
  function later(fn) { setTimeout(fn, 30); }
  function choiceSeg(onPick) {
    return seg(state.candidates.map(function (c, i) { return { label: c, value: i }; }), state.choice, function (v) { state.choice = v; if (onPick) onPick(v); changed("choice"); }, "Ballot choice");
  }

  // A key card: an 8 by 8 grid drawn from the key hash's first 64 bits (a stand-in for Figure 1's QR code).
  function keyCard(keyHash) {
    var s = svg("svg", { class: "be-card", viewBox: "0 0 80 80", width: "64", height: "64", role: "img", "aria-label": "Key card for key hash " + keyHash.slice(0, 8) });
    s.appendChild(svg("rect", { x: 0, y: 0, width: 80, height: 80, class: "be-card-bg" }));
    for (var i = 0; i < 64; i++) {
      var nib = parseInt(keyHash[i >> 2], 16);
      if ((nib >> (3 - (i & 3))) & 1) s.appendChild(svg("rect", { x: 4 + (i % 8) * 9, y: 4 + Math.floor(i / 8) * 9, width: 9, height: 9, class: "be-card-bit" }));
    }
    return s;
  }

  /* ------------------------------------------------------------ demo 1: Figure 1, step by step */

  var STEPS = [
    ["Voter", "Staff", "Provides basic voter information."],
    ["Staff", "ID chain", "Voter information and a unique key are encoded in the ID chain."],
    ["Staff", "Voter", "Staff provide the unique key, encoded as a QR code."],
    ["Voter", "Station", "Scans the key into the station to begin voting."],
    ["Station", "ID chain", "Checks that the key is on the ID chain and not used."],
    ["Voter", "Station", "Submits the ballot."],
    ["Station", "Vote chain", "Encodes the ballot with the key into the vote chain."]
  ];

  function mountVote(root) {
    root.classList.add("w-ready");
    var election, step, voterNo, current, lastKey, message;
    var stepList = el("ol", { class: "be-steps", "aria-label": "The paper's Figure 1 voting procedure" });
    var stepRows = STEPS.map(function (s, i) {
      var li = el("li", { class: "be-step" }, [
        el("span", { class: "be-step-n", text: String(i + 1) }),
        el("span", { class: "be-step-who", text: s[0] + " → " + s[1] }),
        el("span", { class: "be-step-what", text: s[2] })
      ]);
      stepList.appendChild(li);
      return li;
    });
    var card = el("div", { class: "be-cardrow" });
    var status = el("p", { class: "be-readout", "aria-live": "polite" });
    var idWrap = el("div", { class: "be-chainwrap" }), voteWrap = el("div", { class: "be-chainwrap" });
    var tallyOut = el("p", { class: "be-readout" });
    var next = btn("Next step", function () { advance(); });
    var reuse = btn("Scan the same key again", function () { tryKey(lastKey, "the key already used"); }, true);
    var fake = btn("Scan a made-up key", function () { tryKey(E.bytesHex(E.cryptoRng().bytes(16)), "a key nobody issued"); }, true);
    var close = btn("Close the polls and count", function () {
      election.closed = true;
      var counts = election.tally();
      tallyOut.textContent = "Count, using the election officials' key: " + counts.map(function (c, i) { return state.candidates[i] + " " + c; }).join(", ") + ".";
      message = "Polls closed. The station now refuses every key.";
      draw();
    }, true);
    var reset = btn("Start over", function () { init(); }, true);
    var choice = choiceSeg();

    root.appendChild(labeled("Ballot", choice));
    root.appendChild(el("div", { class: "w-actions" }, [next, reuse, fake, close, reset]));
    root.appendChild(stepList);
    root.appendChild(card);
    root.appendChild(status);
    root.appendChild(tallyOut);
    root.appendChild(idWrap);
    root.appendChild(voteWrap);
    root.appendChild(el("p", { class: "w-note", text: "The steps are the paper's Figure 1. The paper does not name its cipher, block format, or key length; the page encrypts each ballot with ElGamal under an election key held by officials, hashes keys and voter information with SHA-256, and issues 128-bit keys. Everything runs on your device." }));

    function init() {
      election = new E.Election({ candidates: state.candidates });
      step = 0; voterNo = 0; current = null; lastKey = null; message = "Press Next step to bring the first voter to the table.";
      tallyOut.textContent = "";
      draw();
    }
    function advance() {
      if (election.closed) { message = "The polls are closed. Start over to run another election."; draw(); return; }
      if (step === 0) { voterNo++; current = { name: "Voter " + voterNo, done: 0 }; }
      current.done = step + 1;
      if (step === 1) { var r = election.register(current.name); current.key = r.key; current.keyHash = E.sha256("key|" + r.key); current.idBlock = r.block.index; }
      if (step === 4) { current.check = election.check(current.key); }
      if (step === 6) {
        var res = election.cast(current.key, state.choice);
        current.voteBlock = res.ok ? res.block.index : null;
        lastKey = current.key;
      }
      message = current.name + ": " + STEPS[step][2];
      if (step === 4) message += current.check.ok ? " The key is issued and unused, so the ballot opens." : " Refused.";
      if (step === 6) message += " " + current.name + " is done; the next press brings " + "Voter " + (voterNo + 1) + ".";
      step = (step + 1) % STEPS.length;
      draw();
    }
    function tryKey(key, what) {
      if (!key) { message = "Finish one voter first, so there is a used key to try again."; draw(); return; }
      var chk = election.check(key);
      message = "The station hashes " + what + " and checks both chains. " +
        (chk.ok ? "Accepted." : chk.reason === "used" ? "Refused: that key's hash is already on the vote chain, so this would be a second vote." :
          chk.reason === "not-issued" ? "Refused: no block on the ID chain holds that key's hash, so staff never issued it." : "Refused: the polls are closed.");
      draw();
    }
    function chainTable(chain, kind) {
      var wrap = el("div");
      wrap.appendChild(el("p", { class: "be-chain-title", text: chain.name + " · " + chain.blocks.length + (chain.blocks.length === 1 ? " block" : " blocks") }));
      var rows = el("div", { class: "be-rows" });
      if (!chain.blocks.length) rows.appendChild(el("div", { class: "be-row be-empty", text: "Empty" }));
      chain.blocks.forEach(function (b) {
        var cells = [el("span", { class: "be-bidx", text: "#" + b.index })];
        if (kind === "id") {
          cells.push(el("span", { class: "be-cell" }, [el("i", { text: "voter " }), el("code", { text: short(E.field(b.data, "voter")) })]));
          cells.push(el("span", { class: "be-cell" }, [el("i", { text: "key " }), el("code", { text: short(E.field(b.data, "key")) })]));
        } else {
          cells.push(el("span", { class: "be-cell" }, [el("i", { text: "key " }), el("code", { text: short(E.field(b.data, "key")) })]));
          var ct = E.field(b.data, "ballot").split(",");
          cells.push(el("span", { class: "be-cell" }, [el("i", { text: "ballot " }), el("code", { text: short(ct[0], 8) + " " + short(ct[1], 8) })]));
        }
        var meta = el("span", { class: "be-cell be-meta", "data-levels": "ug grad res" }, [el("i", { text: "prev " }), el("code", { text: short(b.prev, 8) }), el("i", { text: " hash " }), el("code", { text: short(b.hash, 8) })]);
        cells.push(meta);
        rows.appendChild(el("div", { class: "be-row" + (current && ((kind === "id" && b.index === current.idBlock) || (kind === "vote" && b.index === current.voteBlock)) ? " now" : "") }, cells));
      });
      wrap.appendChild(rows);
      return wrap;
    }
    function draw() {
      var done = current ? current.done : 0;
      stepRows.forEach(function (li, i) {
        li.className = "be-step" + (i === done - 1 ? " now" : i < done - 1 ? " done" : "");
      });
      card.innerHTML = "";
      if (current && current.keyHash) {
        card.appendChild(keyCard(current.keyHash));
        card.appendChild(el("div", { class: "be-cardtext" }, [
          el("div", { text: current.name + "'s key card" }),
          el("div", { class: "w-mono", "data-levels": "ug grad res", text: "key " + current.key }),
          el("div", { class: "w-mono", "data-levels": "ug grad res", text: "SHA-256 of key " + short(current.keyHash, 24) })
        ]));
      }
      status.textContent = message;
      idWrap.innerHTML = ""; voteWrap.innerHTML = "";
      idWrap.appendChild(chainTable(election.idChain, "id"));
      voteWrap.appendChild(chainTable(election.voteChain, "vote"));
    }
    init();
  }

  /* ------------------------------------------------------------ demo 2: what an observer sees */

  var VOTERS = [
    { id: "4417", choice: 0 }, { id: "2093", choice: 1 }, { id: "7310", choice: 1 }, { id: "5582", choice: 2 },
    { id: "1846", choice: 0 }, { id: "9025", choice: 1 }, { id: "3361", choice: 2 }, { id: "6708", choice: 1 },
    { id: "8154", choice: 0 }, { id: "2879", choice: 1 }, { id: "5036", choice: 2 }, { id: "7621", choice: 0 }
  ];
  var BRIBED = 3; // Voter 4 (ID 5582) tries to prove a vote for Candidate C

  function mountObserve(root) {
    root.classList.add("w-ready");
    var sys = "reuse", receipt = false, built = null;
    var system = seg([
      { label: "Re-use (Ethereum branch)", value: "reuse" },
      { label: "Re-invent (two chains)", value: "reinvent" }
    ], sys, function (v) { sys = v; draw(); }, "Voting system");
    var receiptSeg = seg([
      { label: "No receipt", value: false },
      { label: "Receipt (the option the paper rejects)", value: true }
    ], receipt, function (v) { receipt = v; draw(); }, "Receipt");
    var table = el("div", { class: "be-tablewrap" });
    var tally = el("p", { class: "be-readout" });
    var bribe = el("div", { class: "be-bribe", "aria-live": "polite" });
    var guessOut = el("p", { class: "be-readout", "data-levels": "grad res" });
    var guess = btn("Hash every four-digit ID (page's test)", function () { runGuess(); }, true);
    guess.setAttribute("data-levels", "grad res");

    root.appendChild(labeled("System", system));
    root.appendChild(labeled("Re-invent receipts", receiptSeg));
    root.appendChild(el("p", { class: "be-chain-title", text: "The public ledger after twelve voters" }));
    root.appendChild(table);
    root.appendChild(tally);
    root.appendChild(el("p", { class: "be-chain-title", text: "A vote buyer asks Voter 4 to prove a vote for Candidate C" }));
    root.appendChild(bribe);
    root.appendChild(el("div", { class: "w-actions", "data-levels": "grad res" }, [guess]));
    root.appendChild(guessOut);
    root.appendChild(el("p", { class: "w-note", text: "Twelve simulated voters with made-up four-digit voter IDs; both systems record the same choices. The re-use ledger shows hashed IDs beside votes, as the paper describes. The re-invent ledger shows hashed keys beside encrypted ballots (ElGamal, the page's choice of cipher)." }));

    function build() {
      var reuse = new E.ReuseLedger(VOTERS.map(function (v) { return v.id; }), state.candidates);
      var rng = E.cryptoRng();
      var elx = new E.Election({ candidates: state.candidates, rng: rng });
      var keys = [];
      VOTERS.forEach(function (v, i) {
        reuse.cast(v.id, v.choice);
        var r = elx.register("Voter " + (i + 1) + " / " + v.id);
        keys.push(r.key);
        elx.cast(r.key, v.choice);
      });
      // A receipt is the encryption randomness: with it, anyone can re-encrypt a claimed choice and compare.
      // The station keeps it here only to show what the paper's rejected receipt option would allow.
      var b = VOTERS[BRIBED];
      var rr = E.randomScalar(rng);
      var ct = { a: E.modpow(E.G, rr, E.P), b: (E.modpow(E.G, BigInt(b.choice), E.P) * E.modpow(elx.key.y, rr, E.P)) % E.P };
      var blk = elx.voteChain.blocks[BRIBED];
      blk.data = "key=" + E.field(blk.data, "key") + ";ballot=" + E.hex(ct.a) + "," + E.hex(ct.b);
      for (var i = BRIBED; i < elx.voteChain.blocks.length; i++) {
        var bk = elx.voteChain.blocks[i];
        bk.prev = i ? elx.voteChain.blocks[i - 1].hash : E.GENESIS_PREV;
        bk.hash = E.blockHash(bk);
      }
      return { reuse: reuse, elx: elx, keys: keys, receiptR: rr, ct: ct };
    }
    function draw() {
      if (!built) built = build();
      receiptSeg.parentNode.style.display = sys === "reinvent" ? "" : "none";
      var rows = el("div", { class: "be-rows" });
      var head = el("div", { class: "be-row be-head" }, [el("span", { text: "Block" }), el("span", { text: sys === "reuse" ? "Hashed voter ID" : "Hashed key" }), el("span", { text: "Ballot as stored" })]);
      rows.appendChild(head);
      var blocks = sys === "reuse" ? built.reuse.chain.blocks : built.elx.voteChain.blocks;
      blocks.forEach(function (b, i) {
        var idh = E.field(b.data, sys === "reuse" ? "voter" : "key");
        var ballot = sys === "reuse" ? state.candidates[+E.field(b.data, "vote")] : (function () { var c = E.field(b.data, "ballot").split(","); return "encrypted " + short(c[0], 6) + " " + short(c[1], 6); })();
        rows.appendChild(el("div", { class: "be-row" + (i === BRIBED ? " now" : "") }, [
          el("span", { class: "be-bidx", text: "#" + b.index }),
          el("code", { text: short(idh, 12) }),
          el("span", { class: sys === "reuse" ? "be-clear" : "w-mono", text: ballot })
        ]));
      });
      table.innerHTML = ""; table.appendChild(rows);
      if (sys === "reuse") {
        var c = built.reuse.tally();
        tally.textContent = "Running count, visible to anyone during the election: " + c.map(function (n, i) { return state.candidates[i] + " " + n; }).join(", ") + ".";
      } else {
        tally.textContent = "Running count: sealed. Only the election officials' key opens the ballots, when the polls close.";
      }
      bribe.innerHTML = "";
      var v = VOTERS[BRIBED], idh = E.sha256("voter|" + v.id);
      if (sys === "reuse") {
        bribe.appendChild(el("p", { "data-levels": "public hs ug", text: "The paper: in the re-use system it is easy to see that a person voted, and the ledger shows whom each hash voted for, but not whose hash it is. Switch to the re-invent system to see the receipt question the paper raises." }));
        bribe.appendChild(el("p", { "data-levels": "grad res", text: "Page's analysis: Voter 4 tells the buyer the voter ID " + v.id + ". The buyer hashes it with SHA-256, gets " + short(idh, 12) + ", finds block #" + BRIBED + ", and reads " + state.candidates[v.choice] + " beside it." }));
        bribe.appendChild(el("p", { "data-levels": "grad res", class: "be-verdict bad", text: "The hashed ID works as a receipt: the vote is provable, so it can be sold or coerced." }));
      } else {
        var blk = built.elx.voteChain.blocks[BRIBED];
        bribe.appendChild(el("p", { text: "Voter 4 shows the key card. The buyer hashes the key, finds block #" + BRIBED + ", and sees only an encrypted ballot." }));
        if (!receipt) {
          bribe.appendChild(el("p", { class: "be-verdict ok", text: "Voter 4 can prove having voted, but not the choice. A claim of Candidate C is worth nothing to the buyer." }));
        } else {
          var claims = state.candidates.map(function (name, m) {
            var b2 = (E.modpow(E.G, BigInt(m), E.P) * E.modpow(built.elx.key.y, built.receiptR, E.P)) % E.P;
            return name + (b2 === built.ct.b && E.field(blk.data, "ballot").split(",")[1] === E.hex(b2) ? " matches" : " does not match");
          });
          bribe.appendChild(el("p", { text: "With a receipt (the encryption's random number), the buyer re-encrypts each possible choice and compares it with the block: " + claims.join("; ") + "." }));
          bribe.appendChild(el("p", { class: "be-verdict bad", text: "The receipt proves the choice, which is why the paper's re-invent system shows voters only that their block was added." }));
        }
      }
      guessOut.textContent = "";
    }
    function runGuess() {
      guessOut.textContent = "Hashing 9,000 IDs…";
      later(function () {
        var t0 = performance.now(), table = {}, found = 0;
        for (var id = 1000; id <= 9999; id++) table[E.sha256("voter|" + id)] = id;
        var blocks = sys === "reuse" ? built.reuse.chain.blocks : built.elx.idChain.blocks;
        var out = [];
        if (sys === "reuse") {
          blocks.forEach(function (b) { var id = table[E.field(b.data, "voter")]; if (id) { found++; out.push(id + " → " + state.candidates[+E.field(b.data, "vote")]); } });
          guessOut.textContent = "Computed by the page: hashing all 9,000 four-digit IDs took " + Math.round(performance.now() - t0) + " ms and unmasked " + found + " of 12 voters: " + out.slice(0, 4).join(", ") + (out.length > 4 ? ", …" : "") + ". A hash hides an ID only when the ID is hard to guess.";
        } else {
          guessOut.textContent = "Computed by the page: in " + Math.round(performance.now() - t0) + " ms the same 9,000 hashes match no block, because the vote chain stores hashes of 128-bit random keys, and the ballots stay encrypted either way.";
        }
      });
    }
    onChange(function (what) { if (what === "level") draw(); });
    draw();
  }

  /* ------------------------------------------------------------ demo 3: fifty-one percent */

  function mountMajority(root) {
    root.classList.add("w-ready");
    var n = 100, states = [];
    var grid = el("div", { class: "be-grid", role: "group", "aria-label": "Polling stations" });
    var readout = el("p", { class: "be-readout", "aria-live": "polite" });
    var chart = svg("svg", { class: "be-chart", role: "img", "data-levels": "grad res" });
    var pState = { p: 0.3 };
    var sizeSeg = seg([5, 11, 25, 100].map(function (v) { return { label: v + " stations", value: v }; }), n, function (v) { n = v; reset(); }, "Number of polling stations");
    root.appendChild(labeled("Stations", sizeSeg));
    root.appendChild(el("div", { class: "w-actions" }, [
      btn("Hack one more station", function () { flip("honest", "tampered"); }),
      btn("Take one offline", function () { flip("honest", "offline"); }, true),
      btn("Restore all", function () { reset(); }, true)
    ]));
    root.appendChild(grid);
    root.appendChild(readout);
    var pRow = el("label", { class: "w-range", "data-levels": "grad res" });
    var pIn = el("input", { type: "range", min: "0.01", max: "0.99", step: "0.01", value: String(pState.p), "aria-label": "Chance each station is hacked" });
    var pOut = el("output", { text: pct(pState.p, 0) });
    pIn.addEventListener("input", function () { pState.p = Number(pIn.value); pOut.textContent = pct(pState.p, 0); drawChart(); });
    pRow.appendChild(el("span", { text: "Chance per station" })); pRow.appendChild(pIn); pRow.appendChild(pOut);
    root.appendChild(pRow);
    root.appendChild(chart);
    root.appendChild(el("p", { class: "w-note", text: "Click a station to cycle it: honest, hacked, offline. A version of the ledger counts as the record when more than half of the stations still online hold it; the paper states the 51% figure, and the counting rule is the page's." }));

    function reset() { states = []; for (var i = 0; i < n; i++) states.push("honest"); draw(); }
    function flip(from, to) {
      var idx = []; states.forEach(function (s, i) { if (s === from) idx.push(i); });
      if (!idx.length) return;
      states[idx[Math.floor(Math.random() * idx.length)]] = to; draw();
    }
    function draw() {
      grid.innerHTML = "";
      grid.style.setProperty("--cols", n <= 11 ? n : n <= 25 ? 13 : 20);
      states.forEach(function (s, i) {
        var b = el("button", { type: "button", class: "be-station " + s, "aria-label": "Station " + (i + 1) + ": " + s, title: "Station " + (i + 1) + ": " + s });
        b.addEventListener("click", function () { states[i] = s === "honest" ? "tampered" : s === "tampered" ? "offline" : "honest"; draw(); });
        grid.appendChild(b);
      });
      var c = E.consensus(states);
      var verdict = c.winner === "honest" ? "The honest record stands." : c.winner === "tampered" ? "The hacked record wins: it is now the official count." : "No version holds a majority, so the stations cannot agree and the count stalls.";
      readout.innerHTML = "";
      readout.appendChild(document.createTextNode(c.online + " of " + n + " stations online; a version needs " + c.need + ". Honest " + c.honest + ", hacked " + c.tampered + ". " + verdict));
      if (n === 100 && c.online === 100) readout.appendChild(el("span", { class: "be-paper", text: " Paper: an attacker must hack 51% of the voting systems. Page: 51 of 100." }));
      if (c.online < n && deep()) readout.appendChild(el("span", { class: "be-paper", text: " With " + (n - c.online) + " offline, " + c.need + " hacked stations are enough, " + pct(c.need / n, 0) + " of all stations (page's computation)." }));
      drawChart();
    }
    function drawChart() {
      if (!deep()) return;
      var W = chartWidth(chart), H = 220, L = 46, R = 14, T = 16, B = 40;
      chart.setAttribute("viewBox", "0 0 " + W + " " + H);
      chart.innerHTML = "";
      var x = function (p) { return L + p * (W - L - R); }, y = function (v) { return T + (1 - v) * (H - T - B); };
      [0, 0.25, 0.5, 0.75, 1].forEach(function (v) {
        chart.appendChild(svg("line", { x1: L, x2: W - R, y1: y(v), y2: y(v), class: "c-grid" }));
        chart.appendChild(svg("text", { x: L - 6, y: y(v) + 4, "text-anchor": "end", class: "c-tick" }, Math.round(v * 100) + "%"));
        chart.appendChild(svg("text", { x: x(v), y: H - B + 16, "text-anchor": "middle", class: "c-tick" }, Math.round(v * 100) + "%"));
      });
      chart.appendChild(svg("text", { x: (L + W - R) / 2, y: H - 6, "text-anchor": "middle", class: "c-label" }, "chance each station is hacked"));
      chart.appendChild(svg("text", { x: 4, y: 10, class: "c-label" }, "chance the hacked record wins"));
      [5, 25, 100].forEach(function (m) {
        var d = "", k = E.minToFlip(m);
        for (var i = 0; i <= 98; i++) { var p = 0.01 + i * 0.01; d += (i ? "L" : "M") + x(p).toFixed(1) + " " + y(E.binomTail(m, k, p)).toFixed(1); }
        chart.appendChild(svg("path", { d: d, class: "be-curve" + (m === n ? " on" : "") }));
      });
      var shown = [5, 25, 100]; if (shown.indexOf(n) < 0) shown.push(n);
      shown.forEach(function (m, i) {
        var ly = T + 12 + i * 16;
        if (m !== n && [5, 25, 100].indexOf(m) < 0) return;
        chart.appendChild(svg("line", { x1: L + 10, x2: L + 34, y1: ly - 4, y2: ly - 4, class: "be-curve" + (m === n ? " on" : "") }));
        chart.appendChild(svg("text", { x: L + 40, y: ly, class: "c-tick" + (m === n ? " be-on" : "") }, m + " stations"));
      });
      if ([5, 25, 100].indexOf(n) < 0) {
        var d2 = "", k2 = E.minToFlip(n);
        for (var j = 0; j <= 98; j++) { var pp = 0.01 + j * 0.01; d2 += (j ? "L" : "M") + x(pp).toFixed(1) + " " + y(E.binomTail(n, k2, pp)).toFixed(1); }
        chart.appendChild(svg("path", { d: d2, class: "be-curve on" }));
      }
      var cur = E.binomTail(n, E.minToFlip(n), pState.p);
      chart.appendChild(svg("line", { x1: x(pState.p), x2: x(pState.p), y1: T, y2: H - B, class: "be-mark" }));
      chart.appendChild(svg("circle", { cx: x(pState.p), cy: y(cur), r: 4, class: "be-dot" }));
      var lx = x(pState.p) + 8, anchor = "start";
      if (lx > W - R - 170) { lx = x(pState.p) - 8; anchor = "end"; }
      chart.appendChild(svg("text", { x: lx, y: Math.min(Math.max(y(cur) - 8, T + 64), H - B - 6), "text-anchor": anchor, class: "c-label be-on" }, n + " stations: " + (cur < 0.0001 ? cur.toExponential(1) : pct(cur, 2))));
    }
    resizers.push(drawChart);
    onChange(function (what) { if (what === "level") draw(); });
    reset();
  }

  /* ------------------------------------------------------------ demo 4: a ring signature */

  function mountRing(root) {
    root.classList.add("w-ready");
    var RING = 5, keys = null, ring = null, signer = 2, sigs = [], tamper = false;
    var signerSeg = seg([0, 1, 2, 3, 4].map(function (i) { return { label: "Member " + (i + 1), value: i }; }), signer, function (v) { signer = v; }, "Who signs");
    var tamperSeg = seg([{ label: "Leave the ballot alone", value: false }, { label: "Change the ballot after signing", value: true }], tamper, function (v) { tamper = v; }, "Tampering");
    var choice = choiceSeg();
    var ringOut = el("div", { class: "be-rows" });
    var log = el("div", { class: "be-rows", "aria-live": "polite" });
    var signBtn = btn("Sign and submit", function () { sign(); });
    root.appendChild(labeled("Signer", signerSeg));
    root.appendChild(labeled("Ballot", choice));
    root.appendChild(labeled("In transit", tamperSeg, "ug grad res"));
    root.appendChild(el("div", { class: "w-actions" }, [signBtn, btn("New ring", function () { init(); }, true)]));
    root.appendChild(el("p", { class: "be-chain-title", text: "The ring: five public keys" }));
    root.appendChild(ringOut);
    root.appendChild(el("p", { class: "be-chain-title", text: "Signed ballots, as the station checks them" }));
    root.appendChild(log);
    root.appendChild(el("p", { class: "w-note", text: "A linkable ring signature (LSAG, Liu, Wei, and Wong 2004) over a 2048-bit group with a 256-bit prime order, computed on your device. The paper names ring signatures for the re-invent system without saying which scheme; this one is the page's choice." }));

    function init() {
      signBtn.disabled = true;
      ringOut.innerHTML = ""; log.innerHTML = ""; sigs = [];
      ringOut.appendChild(el("div", { class: "be-row be-empty", text: "Making five key pairs…" }));
      later(function () {
        var rng = E.cryptoRng();
        keys = []; for (var i = 0; i < RING; i++) keys.push(E.keygen(rng));
        ring = keys.map(function (k) { return k.y; });
        ringOut.innerHTML = "";
        ring.forEach(function (y, i) {
          ringOut.appendChild(el("div", { class: "be-row" }, [el("span", { class: "be-bidx", text: "Member " + (i + 1) }), el("code", { text: "public key " + bigShort(y, 16) })]));
        });
        log.appendChild(el("div", { class: "be-row be-empty", text: "No ballots yet." }));
        signBtn.disabled = false;
      });
    }
    function sign() {
      signBtn.disabled = true;
      later(function () {
        var msg = "ballot: " + state.candidates[state.choice];
        var t0 = performance.now();
        var sig = E.lsagSign(msg, ring, signer, keys[signer].x, E.cryptoRng());
        var t1 = performance.now();
        var seen = tamper ? "ballot: " + state.candidates[(state.choice + 1) % 3] : msg;
        var ok = E.lsagVerify(seen, ring, sig);
        var t2 = performance.now();
        var prior = -1;
        if (ok) sigs.forEach(function (s, i) { if (prior < 0 && s.ok && E.linked(s.sig, sig)) prior = i; });
        var entry = { sig: sig, ok: ok && prior < 0, by: signer };
        if (!sigs.length) log.innerHTML = "";
        sigs.push(entry);
        var verdict = !ok ? "Rejected: the signature does not match this ballot, so it was changed after signing." :
          prior >= 0 ? "Rejected: valid, and its tag matches ballot " + (prior + 1) + ", so the same member signed twice. The station still cannot tell which member." :
            "Accepted: signed by one of the five members. The station cannot tell which.";
        log.appendChild(el("div", { class: "be-row" + (entry.ok ? "" : " bad") }, [
          el("span", { class: "be-bidx", text: "Ballot " + sigs.length }),
          el("span", { class: "be-cell" }, [el("span", { text: seen + ". " + verdict }),
            el("span", { class: "w-mono be-sub", "data-levels": "ug grad res", text: " Tag " + bigShort(sig.I, 12) + " · " + (2 + RING) + " numbers (" + Math.round((256 * (1 + RING) + 2048) / 8) + " bytes) · signed in " + Math.round(t1 - t0) + " ms, checked in " + Math.round(t2 - t1) + " ms" })]),
          el("span", { class: "be-hidden-signer", text: "Only this page knows the signer: Member " + (signer + 1) + "." })
        ]));
        signBtn.disabled = false;
      });
    }
    init();
  }

  function mount(id, fn) { var node = document.getElementById(id); if (node) fn(node); }
  function start() {
    mount("be-vote", mountVote);
    mount("be-observe", mountObserve);
    mount("be-majority", mountMajority);
    mount("be-ring", mountRing);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();

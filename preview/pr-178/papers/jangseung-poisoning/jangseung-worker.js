/*
  Web Worker for /papers/jangseung-poisoning/: runs one attack sequence
  (Algorithm 2) on the tumor data and posts progress about every 180 ms.
*/
importScripts("jangseung-engine.js");

var W = null;
self.onmessage = function (e) {
  var m = e.data;
  if (m.type === "data") { W = m.wdbc; return; }
  if (m.type !== "run" || !W) return;
  var E = self.Jangseung;
  var sp = E.stratifiedSplit(W.y, m.train, m.test, m.seed);
  var ex = new E.Experiment(
    { rows: sp.train.map(function (i) { return W.X[i]; }), labels: sp.train.map(function (i) { return W.y[i]; }) },
    { rows: sp.test.map(function (i) { return W.X[i]; }), labels: sp.test.map(function (i) { return W.y[i]; }) },
    { attacks: m.attacks, seed: m.seed }
  );
  var last = Date.now(), r, sent = 0;
  function post(final) {
    self.postMessage({ type: final ? "done" : "progress", id: m.id, accU: ex.accU.slice(sent), accG: ex.accG.slice(sent), from: sent, summary: ex.summary(), steps: ex.log.length ? ex.log[ex.log.length - 1].steps : 0 });
    sent = ex.accU.length;
  }
  while ((r = ex.step())) {
    if (Date.now() - last > 180) { post(false); last = Date.now(); }
  }
  post(true);
};

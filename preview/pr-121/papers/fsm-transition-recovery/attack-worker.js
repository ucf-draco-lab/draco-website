/*
  Web Worker for /papers/fsm-transition-recovery/: builds simulated traces and
  runs the k-nearest-neighbor attack off the page's main thread.
  Message in:  { nClasses, perOracle, seed, kMax, keepKs, opts }
  Messages out: { type: "progress", stage, done, total }
                { type: "result", result }
*/
importScripts("fsm-engine.js");

self.onmessage = function (e) {
  var m = e.data, E = self.FsmTR, last = 0;
  function tick(stage, done, total) {
    var now = Date.now();
    if (now - last > 180 || done === total) { last = now; self.postMessage({ type: "progress", stage: stage, done: done, total: total }); }
  }
  var total = m.nClasses * m.perOracle, opts = E.opt(m.opts), X = [], y = [];
  for (var c = 0; c < m.nClasses; c++) {
    for (var i = 0; i < m.perOracle; i++) { X.push(E.trace(c, E.traceSeed(c, i, m.seed), opts)); y.push(c); }
    tick("capture", (c + 1) * m.perOracle, total);
  }
  var data = { X: X, y: y, len: opts.len, nClasses: m.nClasses, perOracle: m.perOracle };
  var sp = E.split(data, m.seed);
  var r = E.attack(data, sp, m.kMax, m.keepKs, function (done, n) { tick("classify", done, n); });
  self.postMessage({ type: "result", result: { kMax: r.kMax, nTest: r.nTest, nTrain: r.nTrain, correct: r.correct, accuracy: r.accuracy, bitErrors: r.bitErrors } });
};

/*
  Web Worker for /papers/control-flow-power/: builds simulated traces and
  trains the paper's four classifiers off the page's main thread.
  Message in:  { nValues, perOracle, w, seed, clfs: ["knn","tree","rf","lr"], trees, lrIter }
  Messages out: { type: "progress", stage, done, total }
                { type: "result", clf, correct, n, ms, steps, note }
                { type: "done", nTrain, nTest, len }
*/
importScripts("cf-engine.js", "cf-ml.js");

self.onmessage = function (e) {
  var m = e.data, E = self.CfPower, M = self.CfML, last = 0;
  function tick(stage, done, total) {
    var now = Date.now();
    if (now - last > 180 || done === total) { last = now; self.postMessage({ type: "progress", stage: stage, done: done, total: total }); }
  }
  var data = E.build(m.nValues, m.perOracle, m.w, m.seed, null, function (d, n) { tick("capture", d, n); });
  var sp = E.split(data, m.seed);
  var trX = sp.train.map(function (i) { return data.X[i]; }), trY = sp.train.map(function (i) { return data.y[i]; });
  var teX = sp.test.map(function (i) { return data.X[i]; }), teY = sp.test.map(function (i) { return data.y[i]; });
  var C = data.nClasses;
  function report(clf, pred, t0, note) {
    var a = M.accuracy(pred, teY), steps = [0, 0, 0, 0, 0, 0, 0, 0];
    for (var i = 0; i < pred.length; i++) {
      var d = data.values[pred[i]] ^ data.values[teY[i]];
      for (var b = 0; b < 8; b++) if ((d >>> b) & 1) steps[b]++;
    }
    self.postMessage({ type: "result", clf: clf, correct: a.correct, n: a.n, ms: Date.now() - t0, steps: steps, note: note || "" });
  }
  (m.clfs || []).forEach(function (clf) {
    var t0 = Date.now();
    if (clf === "knn") report(clf, M.knnPredict(trX, trY, teX, C, 5, function (d, n) { tick("knn", d, n); }), t0);
    if (clf === "tree") { tick("tree", 0, 1); var tr = M.treeFit(trX, trY, C); report(clf, M.treePredict(tr, teX), t0, tr.nodes + " nodes"); }
    if (clf === "rf") { var f = M.forestFit(trX, trY, C, m.trees || 30, m.seed + 17, function (d, n) { tick("rf", d, n); }); report(clf, M.forestPredict(f, teX), t0, (m.trees || 30) + " trees"); }
    if (clf === "lr") {
      var model = M.lrFit(trX, trY, C, { maxIter: m.lrIter || 150 }, function (d, n) { tick("lr", d, n); });
      report(clf, M.lrPredict(model, teX), t0, model.iterations + " iterations" + (model.converged ? "" : " (iteration cap reached)"));
    }
  });
  self.postMessage({ type: "done", nTrain: sp.train.length, nTest: sp.test.length, len: data.len });
};

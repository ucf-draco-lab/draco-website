/*
  Background worker for /papers/retail-liability-models/.
  Runs the heavy parts of liability-engine.js off the page thread:
    models  - fit all eight regressors on a simulated chain and score the test set
    rfe     - recursive feature elimination for one model, step by step
    tsne    - exact t-SNE with live progress every 50 iterations
    kcurve  - silhouette of k-means for k = 2 to 10 on the 28 standardized features
*/
/* global importScripts, Liability */
importScripts("liability-engine.js");

var cache = {};
function dataset(seed) {
  if (cache.seed === seed) return cache;
  var L = Liability, d = L.simulate(seed);
  var X = L.standardize(d.X);
  var sp = L.split(X.length, 0.1, seed);
  cache = {
    seed: seed, d: d, X: X, split: sp,
    Xtr: L.take(X, sp.train), ytr: Float64Array.from(L.take(d.y, sp.train)),
    Xte: L.take(X, sp.test), yte: Float64Array.from(L.take(d.y, sp.test))
  };
  return cache;
}

self.onmessage = function (e) {
  var msg = e.data, L = Liability, D, t0 = Date.now();
  try {
    if (msg.cmd === "models") {
      D = dataset(msg.seed);
      var out = {};
      L.MODELS.forEach(function (m, i) {
        var model = L.fitModel(m.id, D.Xtr, D.ytr, msg.opts || {});
        var pred = model.predict(D.Xte);
        out[m.id] = { metrics: L.metrics(D.yte, pred), pred: Array.from(pred) };
        self.postMessage({ id: msg.id, progress: (i + 1) / L.MODELS.length, model: m.id, result: out[m.id] });
      });
      self.postMessage({ id: msg.id, done: true, result: out, test: D.split.test, ms: Date.now() - t0 });
    } else if (msg.cmd === "rfe") {
      D = dataset(msg.seed);
      var steps = [];
      var res = L.rfe(msg.model, D.Xtr, D.ytr, 2, msg.opts || {}, function (s) {
        steps.push({ removed: s.removed, support: s.support, scores: s.scores });
        self.postMessage({ id: msg.id, progress: steps.length / 26, step: steps[steps.length - 1] });
      });
      self.postMessage({ id: msg.id, done: true, result: { kept: res.kept, steps: steps, final: res.final }, ms: Date.now() - t0 });
    } else if (msg.cmd === "tsne") {
      D = dataset(msg.seed);
      var last = 0;
      var t = L.tsne(D.X, msg.cfg, function (it, Y) {
        var now = Date.now();
        if (now - last < 150 && it < msg.cfg.nIter) return;
        last = now;
        var pts = [];
        for (var i = 0; i < Y.length / 2; i++) pts.push([Y[2 * i], Y[2 * i + 1]]);
        self.postMessage({ id: msg.id, progress: it / msg.cfg.nIter, it: it, Y: pts });
      });
      self.postMessage({ id: msg.id, done: true, result: { Y: t.Y, kl: t.kl, nIter: t.nIter + 1 }, ms: Date.now() - t0 });
    } else if (msg.cmd === "kcurve") {
      D = dataset(msg.seed);
      var curve = [];
      for (var k = 2; k <= 10; k++) {
        var km = L.kmeans(D.X, k, 11 + k, 10);
        curve.push({ k: k, s: L.silhouette(D.X, km.labels) });
        self.postMessage({ id: msg.id, progress: (k - 1) / 9 });
      }
      self.postMessage({ id: msg.id, done: true, result: curve, ms: Date.now() - t0 });
    }
  } catch (err) {
    self.postMessage({ id: msg.id, error: String(err && err.message || err) });
  }
};

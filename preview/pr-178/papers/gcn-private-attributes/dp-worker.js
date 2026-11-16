/*
  Web Worker for /papers/gcn-private-attributes/: trains the GCN baseline,
  DP-GCN, or the page's direction-removal check off the main thread.
  Message in:  { data, method: "gcn" | "dpgcn" | "ls" | "cov", seed, opts }
  Messages out: { type: "progress", epoch, total, stage, orth }
                { type: "result", result }
*/
importScripts("dpgcn-engine.js");

var D = null;
self.onmessage = function (e) {
  var m = e.data, E = self.DPGCN;
  if (m.data) D = E.prepare(m.data);
  var o = E.opts(m.opts), sp = E.split(D.n, 100 + m.seed, 10 + m.seed, o.known);
  var orth = null, last = 0, gen;
  if (m.method === "dpgcn") gen = E.dpgcn(D, sp, o, 2000 + m.seed, function (h) { orth = h.orth; });
  else if (m.method === "gcn") gen = E.baseline(D, sp, o, 1000 + m.seed);
  else gen = E.projected(D, sp, Object.assign({}, o, { dir: m.method }), 3000 + m.seed);
  var total = m.method === "dpgcn" ? o.epochs + o.inferEpochs : o.epochs + o.inferEpochs;
  var step = 0, r;
  do {
    r = gen.next();
    step++;
    var now = Date.now();
    if (now - last > 120) {
      last = now;
      self.postMessage({ type: "progress", epoch: Math.min(step, total), total: total, orth: orth });
    }
  } while (!r.done);
  var res = r.value;
  self.postMessage({ type: "result", result: {
    privacy: res.privacy, accuracy: res.accuracy, hidden: sp.hidden.length, known: sp.known.length, test: sp.test.length,
    hist: res.hist ? res.hist.map(function (h) { return h.orth; }) : null
  } });
};

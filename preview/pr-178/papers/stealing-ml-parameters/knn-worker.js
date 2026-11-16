/*
  Web Worker for /papers/stealing-ml-parameters/: builds simulated traces and
  runs the k-nearest-neighbor attack off the page's main thread.
  Message in:  { rows, task, perModel, seed, opts, configs: [{metric, dims, k}] }
  Messages out: { type: "progress", stage, done, total, config }
                { type: "result", config, result } (one per config)
                { type: "done" }
*/
importScripts("sidechannel-engine.js");

self.onmessage = function (e) {
  var m = e.data, E = self.StealML;
  if (m.rows) E.setData(m.rows);
  var T = E.TASKS[m.task], total = 0;
  T.classes.forEach(function (c) { total += c.length * m.perModel; });
  self.postMessage({ type: "progress", stage: "capture", done: 0, total: total });
  var built = E.buildTask(m.task, m.perModel, m.seed, m.opts);
  self.postMessage({ type: "progress", stage: "capture", done: total, total: total });
  var sp = E.split(built.labels.length, m.seed);
  m.configs.forEach(function (c, ci) {
    var last = 0;
    var r = E.classify(built, sp, c.dims, c.k, c.metric, function (done, n) {
      var now = Date.now();
      if (now - last > 150 || done === n) { last = now; self.postMessage({ type: "progress", stage: "classify", done: done, total: n, config: ci }); }
    });
    self.postMessage({ type: "result", config: ci, result: r });
  });
  self.postMessage({ type: "done" });
};

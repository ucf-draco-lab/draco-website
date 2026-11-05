/*
  Web Worker for /papers/tp-net-privacy/: simulates power captures and runs
  the k-nearest-neighbor attack off the page's main thread.
  Message in:  { rows, cfg }   (cfg as for TPNet.attack)
  Messages out: { type: "progress", stage, done, total }
                { type: "result", result }
*/
importScripts("tpnet-engine.js");

self.onmessage = function (e) {
  var m = e.data, E = self.TPNet, last = 0;
  if (m.rows) E.setData(m.rows);
  var result = E.attack(m.cfg, function (stage, done, total) {
    var now = Date.now();
    if (now - last > 150 || done === total) { last = now; self.postMessage({ type: "progress", stage: stage, done: done, total: total }); }
  });
  self.postMessage({ type: "result", result: result });
};

/* Runs SAGA's genetic algorithm off the page thread and posts progress about every 180 ms.
   Same license as saga-engine.js (GPL-3.0-or-later). */
/* global importScripts, SagaEngine */
importScripts("go-compat.js", "saga-engine.js");

var current = 0;

self.onmessage = function (e) {
  var job = e.data;
  if (job.task === "stop") { current = 0; return; }
  var E = SagaEngine;
  var g = E.parseBlif(job.blif);
  var id = job.id;
  current = id;
  var t0 = Date.now();
  var ga = new E.GA(g, { size: job.size, epsilon: job.epsilon, seed: job.seed });
  self.postMessage({ id: id, type: "start", initial: ga.initialFits, best: ga.best, avg: ga.avg, ms: Date.now() - t0 });
  var sent = 0;
  function chunk() {
    if (current !== id) return;
    var tStart = Date.now();
    while (!ga.done() && Date.now() - tStart < 180) ga.step();
    var fresh = ga.history.slice(sent);
    sent = ga.history.length;
    if (ga.done()) {
      var fin = ga.finalBest();
      self.postMessage({ id: id, type: "done", history: fresh, generations: ga.generations, final: fin.fit, finalSeq: fin.seq,
        bestEver: ga.bestEver, bestSeq: ga.bestSeq, ms: Date.now() - t0 });
      current = 0;
      return;
    }
    self.postMessage({ id: id, type: "progress", history: fresh, generations: ga.generations, bestEver: ga.bestEver, ms: Date.now() - t0 });
    setTimeout(chunk, 0);
  }
  setTimeout(chunk, 0);
};

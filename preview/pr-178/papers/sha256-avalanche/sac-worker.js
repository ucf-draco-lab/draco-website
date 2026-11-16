/*
  Runs the Strict Avalanche Criterion measurement off the main thread.
  Messages in:  {type:"run", mask, k} | {type:"stop"} | {type:"matrix", round}
  Messages out: {type:"progress"|"done", k, total, summary} | {type:"stopped"}
                {type:"matrix", round, data}
*/
importScripts("sha256-engine.js");

var acc = null;
var stopRequested = false;

self.onmessage = function (event) {
  var msg = event.data;

  if (msg.type === "run") {
    acc = new self.SHA256SAC.SacAccumulator(msg.mask);
    stopRequested = false;
    var total = msg.k;
    var block = new Uint32Array(16);

    var step = function () {
      var started = Date.now();
      while (acc.k < total && !stopRequested && Date.now() - started < 180) {
        self.crypto.getRandomValues(block);
        acc.addSample(block);
      }
      if (stopRequested) {
        self.postMessage({ type: "stopped", k: acc.k, total: total, summary: acc.k ? acc.summary() : null });
        return;
      }
      var done = acc.k >= total;
      self.postMessage({ type: done ? "done" : "progress", k: acc.k, total: total, summary: acc.summary() });
      if (!done) setTimeout(step, 0);
    };
    setTimeout(step, 0);
  } else if (msg.type === "stop") {
    stopRequested = true;
  } else if (msg.type === "matrix" && acc && acc.k > 0) {
    var data = acc.matrix(msg.round);
    self.postMessage({ type: "matrix", round: msg.round, k: acc.k, data: data }, [data.buffer]);
  }
};

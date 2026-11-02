/* Runs the constrained encoding search off the page thread. */
/* global importScripts, FSMEngine */
importScripts("fsm-engine.js");

self.onmessage = function (e) {
  var job = e.data, E = FSMEngine, t0 = Date.now();
  var built = E.fromData(job.fsm), stg = built.stg, trans = built.trans;
  var M = stg.names.length, part;
  if (job.task === "power") {
    part = { SN: new Int32Array(M).fill(-1), ST: trans.list.map(function () { return -1; }), sets: 0 };
    var R = Math.max(1, Math.ceil(Math.log2(M)));
    var r = E.searchEncoding(stg, trans, part, R, { minimizeSA: true, budget: job.budget || 4e7 });
    self.postMessage({ id: job.id, R: R, sa: r.sa, codes: r.codes, nodes: r.nodes, complete: r.complete, ms: Date.now() - t0 });
    return;
  }
  part = E.partition(stg, trans, job.l);
  var s = E.shortestEncoding(stg, trans, part, { budget: job.budget || 2e7 });
  var out = { id: job.id, l: job.l, R: s.R, complete: s.complete, nodes: s.nodes || 0, codes: s.codes, sa: s.sa };
  if (s.codes && job.task === "lowpower") {
    var m = E.searchEncoding(stg, trans, part, s.R, { minimizeSA: true, budget: job.budget || 2e7 });
    out.codes = m.codes; out.sa = m.sa; out.complete = m.complete; out.nodes += m.nodes;
  }
  out.ms = Date.now() - t0;
  self.postMessage(out);
};

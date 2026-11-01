/* Runs the secure-encoding search off the page thread. */
/* global importScripts, DFSEngine */
importScripts("dfs-engine.js");

self.onmessage = function (e) {
  var job = e.data, E = DFSEngine, t0 = Date.now();
  var g = E.graph(E.parseKiss2(job.kiss));
  var s = job.split ? E.sfsm(g) : g;
  var r = E.search(s, job.b, job.k, job.c2, { timeLimit: job.timeLimit || 8000 });
  var chk = r.codes ? E.check(s, r.codes) : null;
  self.postMessage({ id: job.id, status: r.status, codes: r.codes, nodes: r.nodes, check: chk, names: s.names, ms: Date.now() - t0 });
};

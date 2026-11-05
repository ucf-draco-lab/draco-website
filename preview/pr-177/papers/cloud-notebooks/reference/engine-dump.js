// Writes the engine's results as JSON for check-engine.py.
var E = require(require("path").join(__dirname, "..", "cn-engine.js"));
var out = { check622: E.check622(), groups: E.groupSummary(), counts: {}, shared: {}, sharedPostPost: {} };
E.DATA.items.forEach(function (it) {
  it.pct.forEach(function (p) { for (var n = 5; n <= 60; n++) out.counts[p + "/" + n] = E.counts(p, n); });
  out.shared[it.id] = E.sharedDenominators(it.pct, 5, 60);
  out.sharedPostPost[it.id] = E.sharedDenominators([it.pct[2], it.pct[3]], 5, 60);
});
console.log(JSON.stringify(out));

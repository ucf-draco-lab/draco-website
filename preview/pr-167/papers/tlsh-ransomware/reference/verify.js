// Verifies tlsh-engine.js against Trend Micro's reference TLSH regression outputs.
// Usage: git clone https://github.com/trendmicro/tlsh && node verify.js ./tlsh
// Expected: 80 of 80 digests and 6,480 of 6,480 distances match.
const fs = require("fs"), vm = require("vm"), path = require("path");
const ctx = { TextEncoder, Buffer, Math, console }; ctx.self = ctx; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "tlsh-engine.js"), "utf8"), ctx);
const E = ctx.TLSHEngine, T = process.argv[2] || "tlsh";
const dig = {}; let ok = 0, bad = 0;
for (const line of fs.readFileSync(T + "/Testing/exp/example_data.128.1.len.out_EXP", "utf8").trim().split("\n")) {
  const [d, f] = line.split("\t");
  const h = E.hash(new Uint8Array(fs.readFileSync(path.join(T, "Testing", f))));
  dig[f] = h.digest; if (h.digest === d) ok++; else bad++;
}
console.log("digests:", ok, "match,", bad, "differ");
for (const [fn, len] of [["example_data.128.1.len.scores_EXP", true], ["example_data.128.1.xlen.scores_EXP", false],
  ["example_data.128.1.len.xref.scores_EXP", true], ["example_data.128.1.xlen.xref.scores_EXP", false]]) {
  let o = 0, b = 0;
  for (const l of fs.readFileSync(path.join(T, "Testing/exp", fn), "utf8").trim().split("\n")) {
    const [a, c, s] = l.split("\t"); if (E.diff(dig[a], dig[c], len) === +s) o++; else b++;
  }
  console.log(fn + ":", o, "match,", b, "differ");
}

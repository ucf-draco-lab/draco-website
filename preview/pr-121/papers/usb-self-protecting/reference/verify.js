/*
  Checks trust-engine.js against the paper's printed Java (PaperTrust.java).
  Usage (from this folder):  javac PaperTrust.java && node verify.js
  Builds 3,028 address sequences (the four recorded FAT traces in six readings,
  3,000 random mixes of sequential, repeated, and jumping accesses, and four
  intruder patterns), runs both implementations, and compares every trust value.
*/
const path = require("path"), fs = require("fs"), cp = require("child_process");
const E = require(path.join(__dirname, "..", "trust-engine.js"));
const d = require(path.join(__dirname, "..", "fat-traces.json"));
const cases = [];
for (const t of Object.values(d.traces)) {
  const tr = t.ops.map(r => [r[0] ? "WRITE" : "READ", r[1], r[2]]);
  for (const unit of ["block", "request"]) for (const ops of ["all", "read", "write"]) {
    const al = E.addresses(tr, { unit, ops }).map(x => x.a);
    if (al.length) cases.push(al);
  }
}
const r = E.rng(42);
for (let c = 0; c < 3000; c++) {
  const n = 1 + Math.floor(r() * 300); let a = Math.floor(r() * 5000); const al = [];
  for (let i = 0; i < n; i++) {
    const u = r();
    if (i > 0) { if (u < 0.55) a = a + 1; else if (u < 0.65) {} else if (u < 0.7) a = a - 1; else a = Math.floor(r() * 5000); }
    al.push(a);
  }
  cases.push(al);
}
for (const k of ["dump", "wrongkey", "random", "replay"]) cases.push(E.intruder(k, 32768, 500, 7, 0x1234abcd));
const input = cases.map(c => c.join(" ")).join("\n") + "\n";
const java = cp.execFileSync("java", ["-cp", __dirname, "PaperTrust"], { input, maxBuffer: 1 << 28 }).toString().trim().split("\n");
let bad = 0, total = 0;
cases.forEach((c, i) => {
  const js = E.run(c).trust;
  const jv = java[i].split(" ").map(Number);
  total += c.length;
  if (js.length !== jv.length || js.some((v, k) => v !== jv[k])) bad++;
});
// Cipher: a bijection with an exact inverse on every address.
const N = 32768, seen = new Uint8Array(N); let cipherOk = true;
for (let a = 0; a < N; a++) { const x = E.encrypt(a, 0x1234abcd, N); if (seen[x]) cipherOk = false; seen[x] = 1; if (E.decrypt(x, 0x1234abcd, N) !== a) cipherOk = false; }
console.log(`${cases.length} sequences, ${total} accesses, ${bad} mismatches; cipher bijection ${cipherOk}`);
process.exit(bad || !cipherOk ? 1 : 0);

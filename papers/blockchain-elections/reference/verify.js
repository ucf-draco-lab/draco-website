// Replays reference/vectors.json (written by verify.py) in election-engine.js.
// Run: python3 -I verify.py && node verify.js
const E = require("../election-engine.js");
const V = require("./vectors.json");
const B = (h) => BigInt("0x" + h);
let n = 0, bad = 0;
function eq(a, b, what) { n++; if (JSON.stringify(a) !== JSON.stringify(b)) { bad++; if (bad < 10) console.log("MISMATCH", what, a, b); } }

V.sha.forEach(([s, h]) => { eq(E.sha256(s), h, "sha"); eq(require("crypto").createHash("sha256").update(s).digest("hex"), h, "node sha"); });
V.rng.forEach(([seed, bytes, sc]) => { const r = E.seededRng(seed); eq(E.bytesHex(r.bytes(64)), bytes, "rng"); eq(E.hex(E.randomScalar(r)), sc, "scalar"); });

V.lsag.forEach((v) => {
  const r = E.seededRng(v.seed);
  const keys = Array.from({ length: v.n }, () => E.keygen(r)), ring = keys.map((k) => k.y);
  eq(ring.map(E.hex), v.ring, "ring");
  const sig = E.lsagSign(v.msg, ring, v.pi, keys[v.pi].x, r);
  eq({ c0: E.hex(sig.c0), s: sig.s.map(E.hex), I: E.hex(sig.I) }, v.sig, "sig " + v.seed);
  const sig2 = E.lsagSign(v.msg + "!", ring, v.pi, keys[v.pi].x, r);
  const o = (v.pi + 1) % v.n, sig3 = E.lsagSign(v.msg, ring, o, keys[o].x, r);
  eq(E.hex(sig2.I), v.I2, "I2"); eq(E.hex(sig3.I), v.I3, "I3");
  const badSig = { c0: sig.c0, s: sig.s.slice(), I: sig.I }; badSig.s[0] = (badSig.s[0] + 1n) % E.Q;
  eq([E.lsagVerify(v.msg, ring, sig), E.lsagVerify(v.msg + "x", ring, sig), E.lsagVerify(v.msg, ring, badSig),
      E.linked(sig, sig2), E.linked(sig, sig3), E.lsagVerify(v.msg, ring, sig3)], v.res, "lsag results");
  // the Python signature verifies in JavaScript as well
  eq(E.lsagVerify(v.msg, ring, { c0: B(v.sig.c0), s: v.sig.s.map(B), I: B(v.sig.I) }), true, "py sig verifies");
});

V.election.forEach((v) => {
  const r = E.seededRng(v.seed), el = new E.Election({ rng: r, candidates: ["A", "B", "C"] });
  const keys = [];
  for (let i = 0; i < v.nv; i++) keys.push(el.register("v" + i).key);
  const script = keys.map((k, i) => [k, (i * 7 + Number(v.seed.slice(2))) % 3]).concat([[keys[0], 1], ["00".repeat(16), 2]]);
  const log = script.map(([k, c]) => { const res = el.cast(k, c); return res.ok ? "ok" : res.reason; });
  eq(log, v.log, "election log"); eq(el.tally(), v.tally, "tally");
  eq(el.idChain.blocks.map((b) => b.hash), v.idHashes, "id chain"); eq(el.voteChain.blocks.map((b) => b.hash), v.voteHashes, "vote chain");
  eq(E.firstBroken(el.voteChain.blocks), -1, "intact");
});
V.reuse.forEach((v) => {
  const ids = Array.from({ length: 6 }, (_, i) => "id" + i), L = new E.ReuseLedger(ids);
  const script = ids.map((id, i) => [id, (i + v.t) % 3]).concat([["id1", 0], ["intruder", 1]]);
  eq(script.map(([id, c]) => { const r = L.cast(id, c); return r.ok ? "ok" : r.reason; }), v.log, "reuse log");
  eq(L.chain.blocks.map((b) => b.hash), v.hashes, "reuse chain");
});
V.consensus.forEach(([st, out]) => eq(E.consensus(st), out, "consensus"));
V.binom.forEach(([nn, k, p, want]) => { n++; const got = E.binomTail(nn, k, p); if (Math.abs(got - want) > 1e-9 * Math.max(1, want)) { bad++; console.log("binom", nn, k, p, got, want); } });
eq(E.minToFlip(100), 51, "paper's 51 of 100");
console.log(`${n - bad}/${n} checks agree`);
process.exit(bad ? 1 : 0);

"""Independent Python reference for election-engine.js.

Uses hashlib's SHA-256 and Python integers. Re-implements the seeded sfc32
stream, the hash-linked chains, ElGamal in the exponent, the re-invent and
re-use procedures, majority agreement, the binomial tail, and LSAG, then
writes vectors.json for verify.js to replay in the browser engine.
Run: python3 -I verify.py   (from this folder)
"""
import hashlib, json, math, os, random, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(HERE, "..", "election-engine.js")).read()
def const(name):
    m = re.search(r"var %s = hexToBig\(([^;]*)\);" % name, src)
    return int("".join(re.findall(r'"([0-9a-f]+)"', m.group(1))), 16)
P, Q, G = const("P"), const("Q"), const("G")

def is_probable_prime(n, rounds=64):
    if n < 2: return False
    for sp in [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37]:
        if n % sp == 0: return n == sp
    d, s = n - 1, 0
    while d % 2 == 0: d //= 2; s += 1
    rnd = random.Random(1)
    for _ in range(rounds):
        a = rnd.randrange(2, n - 1); x = pow(a, d, n)
        if x in (1, n - 1): continue
        for _ in range(s - 1):
            x = pow(x, 2, n)
            if x == n - 1: break
        else: return False
    return True

checks = {"group": [P.bit_length(), Q.bit_length(), is_probable_prime(P), is_probable_prime(Q),
                    (P - 1) % Q == 0, pow(G, Q, P) == 1 and G != 1]}
assert checks["group"] == [2048, 256, True, True, True, True], checks
COF = (P - 1) // Q
sha = lambda s: hashlib.sha256(s.encode()).hexdigest()
hx = lambda n: format(n, "x")

class Rng:
    def __init__(self, seed):
        h = sha("rng|" + seed)
        self.a, self.b, self.c, self.d = (int(h[i:i + 8], 16) for i in range(0, 32, 8))
        for _ in range(12): self.next()
    def next(self):
        M = 0xffffffff
        t = (self.a + self.b + self.d) & M
        self.d = (self.d + 1) & M
        self.a = self.b ^ (self.b >> 9)
        self.b = (self.c + (self.c << 3)) & M
        self.c = ((self.c << 21) | (self.c >> 11)) & M
        self.c = (self.c + t) & M
        return t
    def bytes(self, n):
        out = bytearray()
        while len(out) < n: out += self.next().to_bytes(4, "big")
        return bytes(out[:n])

def scalar(r): return int.from_bytes(r.bytes(48), "big") % (Q - 1) + 1
def hscalar(parts): return int(sha("|".join(parts)), 16) % Q
def h2g(s):
    k = 0
    while True:
        tag = s + "#" + str(k) if k else s
        e = pow(int("".join(sha(tag + "|" + str(i)) for i in range(9)), 16) % P, COF, P)
        if e != 1: return e
        k += 1
def keygen(r): x = scalar(r); return x, pow(G, x, P)

def enc(pk, m, r): k = scalar(r); return pow(G, k, P), pow(G, m, P) * pow(pk, k, P) % P
def dec(sk, a, b, maxm):
    M = b * pow(a, Q - sk, P) % P
    for m in range(maxm + 1):
        if pow(G, m, P) == M: return m
    return -1

GEN = "0" * 64
class Chain:
    def __init__(s): s.blocks = []
    def append(s, data):
        prev = s.blocks[-1]["hash"] if s.blocks else GEN
        b = {"index": len(s.blocks), "prev": prev, "data": data}
        b["hash"] = sha("%d|%s|%s" % (b["index"], prev, data)); s.blocks.append(b); return b
def field(d, n):
    m = re.search(r"(?:^|;)" + n + r"=([^;]*)", d); return m.group(1) if m else None

def lsag_sign(msg, ring, pi, x, r):
    n, L = len(ring), ",".join(map(hx, ring))
    h = h2g("ring|" + L); I = pow(h, x, P); u = scalar(r)
    c, s = [0] * n, [0] * n
    c[(pi + 1) % n] = hscalar(["lsag", L, hx(I), msg, hx(pow(G, u, P)), hx(pow(h, u, P))])
    for k in range(1, n):
        i = (pi + k) % n; s[i] = scalar(r)
        z1 = pow(G, s[i], P) * pow(ring[i], c[i], P) % P
        z2 = pow(h, s[i], P) * pow(I, c[i], P) % P
        c[(i + 1) % n] = hscalar(["lsag", L, hx(I), msg, hx(z1), hx(z2)])
    s[pi] = (u - x * c[pi]) % Q
    return {"c0": c[0], "s": s, "I": I}
def lsag_verify(msg, ring, sig):
    n, L = len(ring), ",".join(map(hx, ring))
    if len(sig["s"]) != n or not (1 < sig["I"] < P and pow(sig["I"], Q, P) == 1): return False
    h = h2g("ring|" + L); c = sig["c0"]
    for i in range(n):
        z1 = pow(G, sig["s"][i], P) * pow(ring[i], c, P) % P
        z2 = pow(h, sig["s"][i], P) * pow(sig["I"], c, P) % P
        c = hscalar(["lsag", L, hx(sig["I"]), msg, hx(z1), hx(z2)])
    return c == sig["c0"]

def binom_tail(n, k, p):
    return sum(math.comb(n, i) * p ** i * (1 - p) ** (n - i) for i in range(max(k, 0), n + 1))

V = {"sha": [], "rng": [], "lsag": [], "election": [], "reuse": [], "consensus": [], "binom": []}
rnd = random.Random(2018)
for L in list(range(0, 200)) + [rnd.randrange(200, 3000) for _ in range(100)]:
    s = "".join(rnd.choice("abcxyz019|;=é漢") for _ in range(L)); V["sha"].append([s, sha(s)])
for seed in ["a", "b", "vote"]:
    r = Rng(seed); V["rng"].append([seed, r.bytes(64).hex(), hx(scalar(r))])

for t in range(40):
    r = Rng("lsag%d" % t); n = 2 + t % 7
    keys = [keygen(r) for _ in range(n)]; ring = [y for _, y in keys]; pi = t % n
    msg = "ballot %d" % t
    sig = lsag_sign(msg, ring, pi, keys[pi][0], r)
    sig2 = lsag_sign(msg + "!", ring, pi, keys[pi][0], r)
    other = (pi + 1) % n; sig3 = lsag_sign(msg, ring, other, keys[other][0], r)
    bad = dict(sig, s=list(sig["s"])); bad["s"][0] = (bad["s"][0] + 1) % Q
    res = [lsag_verify(msg, ring, sig), lsag_verify(msg + "x", ring, sig), lsag_verify(msg, ring, bad),
           sig["I"] == sig2["I"], sig["I"] == sig3["I"], lsag_verify(msg, ring, sig3)]
    assert res == [True, False, False, True, False, True], res
    V["lsag"].append({"seed": "lsag%d" % t, "n": n, "pi": pi, "msg": msg, "ring": list(map(hx, ring)),
                      "sig": {"c0": hx(sig["c0"]), "s": list(map(hx, sig["s"])), "I": hx(sig["I"])},
                      "I2": hx(sig2["I"]), "I3": hx(sig3["I"]), "res": res})

for t in range(25):
    r = Rng("el%d" % t)
    sk, pk = keygen(r); idc, vc = Chain(), Chain(); keys = []; log = []
    nv = 3 + t % 6
    for i in range(nv):
        key = r.bytes(16).hex(); keys.append(key)
        idc.append("voter=" + sha("voter|v%d" % i) + ";key=" + sha("key|" + key))
    script = [(keys[i], (i * 7 + t) % 3) for i in range(nv)] + [(keys[0], 1), ("00" * 16, 2)]
    for key, ch in script:
        kh = sha("key|" + key)
        if not any(field(b["data"], "key") == kh for b in idc.blocks): log.append("not-issued"); continue
        if any(field(b["data"], "key") == kh for b in vc.blocks): log.append("used"); continue
        a, b = enc(pk, ch, r); vc.append("key=" + kh + ";ballot=" + hx(a) + "," + hx(b)); log.append("ok")
    tally = [0, 0, 0]
    for b in vc.blocks:
        a, bb = (int(x, 16) for x in field(b["data"], "ballot").split(","))
        tally[dec(sk, a, bb, 2)] += 1
    V["election"].append({"seed": "el%d" % t, "nv": nv, "log": log, "tally": tally,
                          "idHashes": [b["hash"] for b in idc.blocks], "voteHashes": [b["hash"] for b in vc.blocks]})

for t in range(10):
    ids = ["id%d" % i for i in range(6)]; ch = Chain(); approved = {sha("voter|" + i) for i in ids}; log = []
    for vid, c in [("id%d" % i, (i + t) % 3) for i in range(6)] + [("id1", 0), ("intruder", 1)]:
        vh = sha("voter|" + vid)
        if vh not in approved: log.append("not-approved"); continue
        if any(field(b["data"], "voter") == vh for b in ch.blocks): log.append("used"); continue
        ch.append("voter=" + vh + ";vote=" + str(c)); log.append("ok")
    V["reuse"].append({"t": t, "log": log, "hashes": [b["hash"] for b in ch.blocks]})

states = ["honest", "tampered", "offline"]
for t in range(500):
    n = rnd.randrange(1, 40); st = [rnd.choice(states) for _ in range(n)]
    on = sum(s != "offline" for s in st); ho = st.count("honest"); ta = st.count("tampered"); need = on // 2 + 1
    w = "none" if on == 0 else "honest" if ho >= need else "tampered" if ta >= need else "none"
    V["consensus"].append([st, {"online": on, "honest": ho, "tampered": ta, "need": need, "winner": w}])
for t in range(300):
    n = rnd.randrange(1, 150); k = rnd.randrange(0, n + 2); p = rnd.choice([0, 1, rnd.random(), rnd.random() * 0.1])
    V["binom"].append([n, k, p, binom_tail(n, k, p)])
json.dump(V, open(os.path.join(HERE, "vectors.json"), "w"))
print("group checks", checks["group"], "| vectors:", {k: len(v) for k, v in V.items()})

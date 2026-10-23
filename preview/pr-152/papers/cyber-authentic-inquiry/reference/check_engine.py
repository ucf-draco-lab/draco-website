"""Independent check of ci-engine.js: exact agreement tests with Fractions,
kappa, and the group-size search, written without reference to the JS.
Run: python3 check_engine.py  (prints JSON the Node verifier compares)."""
import itertools, json, random
from fractions import Fraction
from math import factorial

T = {
  "midterm": [[5,1,0,0],[0,0,1,0],[0,0,1,0],[0,3,1,0]],
  "final":   [[5,0,0,0],[0,2,1,0],[0,1,2,0],[0,1,0,0]],
  "poster":  [[5,0,0,0],[0,2,1,0],[0,1,2,0],[0,1,0,0]],
  "actual":  [[5,0,0,0],[0,2,0,0],[0,0,2,0],[0,2,1,0]],
}

def compositions(total, caps):
    if len(caps) == 1:
        if total <= caps[0]: yield (total,)
        return
    for v in range(min(total, caps[0]) + 1):
        for rest in compositions(total - v, caps[1:]):
            yield (v,) + rest

def all_tables(r, c):
    def rec(i, cl):
        if i == len(r) - 1:
            if sum(cl) == r[i]: yield [list(cl)]
            return
        for row in compositions(r[i], cl):
            for rest in rec(i + 1, [a - b for a, b in zip(cl, row)]):
                yield [list(row)] + rest
    yield from rec(0, list(c))

def prob(Tab, r, c):
    n = sum(r); num = 1
    for x in r + c: num *= factorial(x)
    den = factorial(n)
    for row in Tab:
        for x in row: den *= factorial(x)
    return Fraction(num, den)

out = {}
for k, M in T.items():
    r = [sum(row) for row in M]; c = [sum(col) for col in zip(*M)]; n = sum(r)
    d = sum(M[i][i] for i in range(4))
    pe = Fraction(sum(a*b for a, b in zip(r, c)), n*n); po = Fraction(d, n)
    kappa = (po - pe) / (1 - pe)
    tabs = list(all_tables(r, c)); tot = Fraction(0); up = Fraction(0)
    for Tab in tabs:
        p = prob(Tab, r, c); tot += p
        if sum(Tab[i][i] for i in range(4)) >= d: up += p
    assert tot == 1
    # permutation check: shuffle which product each proposal receives
    props = [j for j in range(4) for _ in range(c[j])]
    prods = [i for i in range(4) for _ in range(r[i])]
    rng = random.Random(7); hit = 0; N = 100000
    for _ in range(N):
        rng.shuffle(prods)
        if sum(1 for a, b in zip(props, prods) if a == b) >= d: hit += 1
    out[k] = {"diag": d, "kappa": float(kappa), "kappa_frac": str(kappa), "tables": len(tabs),
              "p": float(up), "p_frac": str(up), "perm_p": hit / N}

# group sizes: brute force over every group's individual size (1..8)
def r1(x): return int(x * 10 + Fraction(1, 2)) / 10  # round half up at one decimal
cells = [("app","app",5),("res","res",2),("lit","res",2),("mix","mix",2),("lit","mix",1)]  # (product, proposal, groups)
self_t = {"app":3.6,"mix":2.3,"res":1.8}; act_t = {"app":3.6,"mix":2.5,"res":1.0,"lit":2.3}
sols = set()
choices = [range(g, 8 * g + 1) for _, _, g in cells]  # a cell's total size, each group 1..8
for combo in itertools.product(*choices):
    prop = {}; prod = {}; nprop = {}; nprod = {}
    for (pd, pp, g), tot in zip(cells, combo):
        prop[pp] = prop.get(pp, 0) + tot; nprop[pp] = nprop.get(pp, 0) + g
        prod[pd] = prod.get(pd, 0) + tot; nprod[pd] = nprod.get(pd, 0) + g
    if all(r1(Fraction(prop[t], nprop[t])) == v for t, v in self_t.items()) and \
       all(r1(Fraction(prod[t], nprod[t])) == v for t, v in act_t.items()):
        sols.add(tuple(combo))
out["group_sums"] = sorted(sols)
print(json.dumps(out, indent=1))

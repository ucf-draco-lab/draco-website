# Independent check of cn-engine.js: recomputes Table 6.2.2, the Local/Cloud means,
# and the denominator search with Python's fractions, then compares with the engine
# output written by engine-dump.js.   Run:  node engine-dump.js > engine.json && python3 check-engine.py engine.json
import json, sys
from fractions import Fraction as F
T = {"Q5": [6, 18, 44, 26], "Q7": [39, 45, 90, 82], "Q14": [32, 39, 55, 86], "Q17b": [29, 55, 59, 80]}
LOC = {"Q5": "Local", "Q7": "Local", "Q14": "Cloud", "Q17b": "Cloud"}
P622 = {"Q5": ([12, 26, -18], F(333, 100)), "Q7": ([6, 45, -8], F(1433, 100)), "Q14": ([7, 16, 31], F(18)), "Q17b": ([26, 4, 21], F(17))}
eng = json.load(open(sys.argv[1]))
bad = 0; checks = 0
def ok(cond, msg):
    global bad, checks
    checks += 1
    if not cond: bad += 1; print("FAIL", msg)
for row in eng["check622"]:
    q = row["id"]; p = T[q]
    d = [p[1] - p[0], p[2] - p[1], p[3] - p[2]]
    avg = F(sum(d), 3)
    ok(row["deltas"] == d, q + " deltas")
    ok(row["deltasMatch"] == (d == P622[q][0]), q + " delta match flag")
    ok(abs(F(row["average"]).limit_denominator(1000) - avg) == 0, q + " average")
    ok(row["averageMatch"] == (abs(round(avg, 2) - P622[q][1]) < F(6, 1000)), q + " average match flag")
    ok(avg == F(p[3] - p[0], 3), q + " telescoping")
for g in ["Local", "Cloud"]:
    its = [q for q in T if LOC[q] == g]
    mean = [F(sum(T[q][c] for q in its), len(its)) for c in range(4)]
    ok([F(x).limit_denominator(100) for x in eng["groups"][g]["mean"]] == mean, g + " means")
def counts(p, n): return [k for k in range(n + 1) if abs(F(100 * k, n) - p) <= F(1, 2)]
for key, val in eng["counts"].items():
    p, n = map(int, key.split("/"))
    ok(val == counts(p, n), "counts " + key)
for q, val in eng["shared"].items():
    want = [n for n in range(5, 61) if all(counts(x, n) for x in T[q])]
    ok(val == want, "shared " + q)
want_pp = {q: [n for n in range(5, 61) if counts(T[q][2], n) and counts(T[q][3], n)] for q in T}
for q in T: ok(eng["sharedPostPost"][q] == want_pp[q], "post/post-post " + q)
print(checks, "checks;", checks - bad, "agree,", bad, "differ")
sys.exit(1 if bad else 0)

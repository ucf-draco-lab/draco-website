"""Independent Python check of the page's Table 2 arithmetic (exact
fractions), the Fall 2022 non-major reconstruction, and Wilson intervals
(statsmodels). Writes ref.json for verify.js."""
import json, math
from fractions import Fraction as F
from statsmodels.stats.proportion import proportion_confint

PRINTED = {"f22": {"major": "98.15", "nonmajor": "91.42", "total": "94.35"},
           "s23": {"major": "88.88", "nonmajor": "90.41", "total": "90.11"},
           "ay":  {"major": "95.83", "nonmajor": "90.90", "total": "92.56"}}
TEXT = {"f22": {"major": (53, 54), "nonmajor": (71, 82)}, "s23": {"major": (16, 18), "nonmajor": (66, 73)}}

def pair(counts, row, g):
    rows = ["f22", "s23"] if row == "ay" else [row]
    gs = ["major", "nonmajor"] if g == "total" else [g]
    return sum(counts[r][x][0] for r in rows for x in gs), sum(counts[r][x][1] for r in rows for x in gs)

def rnd(fr):  # half-up to two decimals of a percent, exact
    v = fr * 10000
    return F(math.floor(v + F(1, 2)), 100)
def cut(fr):
    return F(math.floor(fr * 10000), 100)
def how(fr, printed):
    p = F(printed)
    r, t = rnd(fr) == p, cut(fr) == p
    return "both" if r and t else "round" if r else "trunc" if t else "none"

def table(counts):
    out = []
    for row in ["f22", "s23", "ay"]:
        for g in ["major", "nonmajor", "total"]:
            k, n = pair(counts, row, g)
            out.append({"row": row, "group": g, "k": k, "n": n, "how": how(F(k, n), PRINTED[row][g])})
    return out

def ok(fr, printed, rule):
    h = how(fr, printed)
    return h != "none" if rule == "either" else h in (rule, "both")

def rebuild(rule, maxN=1000):
    sols = []
    for n in range(1, maxN + 1):
        for k in range(n + 1):
            if ok(F(k, n), "91.42", rule) and ok(F(53 + k, 54 + n), "94.35", rule) \
               and ok(F(66 + k, 73 + n), "90.90", rule) and ok(F(135 + k, 145 + n), "92.56", rule):
                sols.append([k, n])
    return sols

alt = {"f22": {"major": (53, 54), "nonmajor": (64, 70)}, "s23": TEXT["s23"]}
ref = {
    "text_table": table(TEXT),
    "rebuilt_table": table(alt),
    "rebuild": {r: rebuild(r) for r in ["either", "round", "trunc"]},
    "wilson": {f"{k}/{n}": list(proportion_confint(k, n, alpha=0.05, method="wilson"))
               for k, n in [(53, 54), (16, 18), (69, 72), (71, 82), (66, 73), (137, 155), (124, 136), (82, 91), (206, 227),
                            (64, 70), (130, 143), (117, 124), (199, 215), (77, 129), (34, 90)]},
}
json.dump(ref, open("ref.json", "w"), indent=1)
print({r: v for r, v in ref["rebuild"].items()})
print([ (c["row"], c["group"], c["how"]) for c in ref["text_table"] ])
print([ (c["row"], c["group"], c["how"]) for c in ref["rebuilt_table"] ])

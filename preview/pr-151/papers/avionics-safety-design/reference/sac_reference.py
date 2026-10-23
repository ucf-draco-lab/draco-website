"""Independent reference for sac-engine.js (avionics-safety-design page).

Re-implements the page's control law, faults, monitors, and policies in Python and
checks the refinement logic by brute-force membership over a parameter grid, a method
that does not share code or interval arithmetic with the engine. Writes reference.json;
check-engine.js compares the engine against it.
"""
import json, struct, itertools, math, sys

T, FRAMES = 0.02, 400
KP, KI, SMAX, UMAX, RMAX, THMAX, EPS = 1.5, 2.0, 15.0, 25.0, 15.0, 30.0, 1e-9
WN, ZETA, G = 2.0, 0.6, 4.0

def clamp(x, m): return m if x > m else (-m if x < -m else x)
def cmd(k):
    t = k * T
    return 0.0 if t < 0.2 - 1e-12 else (10.0 if t < 4 - 1e-12 else -5.0)
def flip61(x):
    (b,) = struct.unpack(">Q", struct.pack(">d", x))
    return struct.unpack(">d", struct.pack(">Q", b ^ (1 << 61)))[0]
def near(a, b): return abs(a - b) <= EPS * (1 + abs(b))

LEAVES = ["SUM1", "GAIN", "INT", "SUM2", "SAT"]
ORDER = ["PI_r", "PI_th", "PO", "A", "B"] + LEAVES
MOD = {"SUM1": "A", "GAIN": "A", "INT": "B", "SUM2": "B", "SAT": "B"}
LEVEL = {"PI_r": "top", "PI_th": "top", "PO": "top", "A": "module", "B": "module"}
LEVEL.update({l: "leaf" for l in LEAVES})

def ok(name, x):
    r, thm, sp, e, p, s, v, u = (x[k] for k in "r thm sp e p s v u".split())
    if name == "PI_r": return abs(r) <= RMAX + EPS
    if name == "PI_th": return abs(thm) <= THMAX + EPS
    if name == "PO": return abs(u) <= UMAX + EPS and abs(u - clamp(KP * (r - thm), UMAX)) <= SMAX + EPS
    if name == "A": return near(p, KP * (r - thm))
    if name == "B": return abs(sp) <= SMAX + EPS and near(s, clamp(sp + KI * T * e, SMAX)) and near(u, clamp(p + s, UMAX))
    if name == "SUM1": return near(e, r - thm)
    if name == "GAIN": return near(p, KP * e)
    if name == "INT": return abs(sp) <= SMAX + EPS and near(s, clamp(sp + KI * T * e, SMAX)) and abs(s) <= SMAX + EPS
    if name == "SUM2": return near(v, p + s)
    if name == "SAT": return near(u, clamp(v, UMAX))

def run(fault, k0, policy, recover):
    s, stuck, th, q = 0.0, None, 0.0, 0.0
    on = {n: (policy == "all") for n in ORDER}
    on.update(PI_r=True, PI_th=True, PO=True)
    backup, det, loc, checks, ths, us = False, None, None, 0, [], []
    for k in range(FRAMES):
        r = cmd(k)
        act = (not backup) and fault != "none" and k >= k0
        thm = th
        if act and fault == "spike" and k == k0: thm = 90.0
        if fault == "stuck" and k >= k0:
            if stuck is None: stuck = th
            thm = stuck
        sp = s
        if act and fault == "upset" and k == k0: sp = flip61(sp)
        e = r - thm
        p = (10 * KP if act and fault == "gain" else KP) * e
        inc = KI * T * e
        s = clamp(sp - inc if act and fault == "sign" else sp + inc, SMAX)
        v = p + s
        u = clamp(v, UMAX)
        x = dict(r=r, thm=thm, sp=sp, e=e, p=p, s=s, v=v, u=u)
        failed = []
        for n in ORDER:
            if on[n]:
                checks += 1
                if not ok(n, x): failed.append(n)
        if failed:
            if det is None: det = (k, failed[0])
            if loc is None:
                leaves = [n for n in failed if LEVEL[n] == "leaf"]
                pins = [n for n in failed if n in ("PI_r", "PI_th")]
                if leaves: loc = (k, leaves[0])
                elif pins: loc = (k, "sensor" if pins[0] == "PI_th" else "command")
            if policy == "escalate":
                for n in failed:
                    if n == "PO": on["A"] = on["B"] = True
                    if n in ("A", "B"):
                        for l in LEAVES:
                            if MOD[l] == n: on[l] = True
            if recover == "backup" and not backup:
                backup = True
                s = clamp(s, SMAX)
        a = -WN * WN * th - 2 * ZETA * WN * q + G * u
        q = q + T * a
        th = th + T * q
        ths.append(th); us.append(u)
    return dict(det=det, loc=loc, checks=checks, th=ths, u=us)

def sweep(k0):
    ref = run("none", 0, "top", "log")["th"]
    rows = []
    for f in ["gain", "sign", "upset", "spike", "stuck"]:
        for pol in ["top", "all", "escalate"]:
            for rec in ["log", "backup"]:
                o = run(f, k0, pol, rec)
                dev = max(abs(o["th"][k] - ref[k]) for k in range(k0, FRAMES))
                rows.append(dict(fault=f, policy=pol, recover=rec,
                                 detect=None if o["det"] is None else o["det"][0] - k0,
                                 by=None if o["det"] is None else o["det"][1],
                                 localize=None if o["loc"] is None else o["loc"][0] - k0,
                                 to=None if o["loc"] is None else o["loc"][1],
                                 checks=o["checks"], dev=dev))
    return rows

# ---- refinement by brute-force membership ----
OPS = ["add", "sub", "mul", "div"]
N1S = range(0, 41)
D1S = [i / 4 for i in range(1, 161)]         # 0.25 .. 40 ms, includes 15 and 20
KS = range(0, 21)
FUS = [frozenset(c) for n in range(1, 5) for c in itertools.combinations(OPS, n)]

def pred(n1=lambda v: True, d1=lambda v: True, k=lambda v: True, fu=lambda v: True):
    return dict(n1=n1, d1=d1, k=k, fu=fu)
def meet(a, b): return {key: (lambda f, g: (lambda v: f(v) and g(v)))(a[key], b[key]) for key in a}
def members(d):
    return {"n1": [v for v in N1S if d["n1"](v)], "d1": [v for v in D1S if d["d1"](v)],
            "k": [v for v in KS if d["k"](v)], "fu": [sorted(v) for v in FUS if d["fu"](v)]}
def sub(a, b):  # every member of a is a member of b (per parameter; domains are boxes)
    return all(b[key](v) for key, vals in [("n1", N1S), ("d1", D1S), ("k", KS)] for v in vals if a[key](v)) and \
           all(b["fu"](v) for v in FUS if a["fu"](v))
def empty(d): return any(len(m) == 0 for m in members(d).values())

core = pred()
a1 = meet(core, pred(n1=lambda v: v > 4, d1=lambda v: v < 20))
a2 = meet(a1, pred(n1=lambda v: v == 9, d1=lambda v: v == 15))
a3 = meet(a1, pred(k=lambda v: v <= 3, fu=lambda v: v <= {"add", "sub"}))
a4 = meet(a2, a3)
a5 = meet(core, pred(n1=lambda v: v <= 6, d1=lambda v: v <= 30))
fam = dict(core=core, a1=a1, a2=a2, a3=a3, a4=a4, a5=a5)
props = dict(p1=pred(n1=lambda v: v >= 2, d1=lambda v: v < 20),
             p2=pred(n1=lambda v: v >= 8, d1=lambda v: v <= 15),
             p3=pred(k=lambda v: v <= 3, d1=lambda v: v < 20))
ref = {
    "refines": {f"{c}<{p}": sub(fam[c], fam[p]) for c in fam for p in fam},
    "holds": {f"{n}:{p}": (not empty(fam[n])) and sub(fam[n], props[p]) for n in fam for p in props},
    "composeEmpty": {f"{a}+{b}": empty(meet(fam[a], fam[b])) for a in fam for b in fam},
    "members_a5_a1": members(meet(a5, a1))["n1"],
    "paper_example": {"N1=9,D1=15 inside N1>4,D1<20": sub(a2, a1),
                      "N1=4 rejected": not a1["n1"](4), "D1=20 rejected": not a1["d1"](20)},
    "sweeps": {str(k0): sweep(k0) for k0 in (25, 100, 150, 250, 340)},
    "series_none": run("none", 0, "top", "log")["th"],
    "series_gain_all": run("gain", 100, "all", "backup")["th"],
    "flip": [flip61(x) for x in (5.0, -3.25, 0.0, 14.999, 1e-3)],
    "testHours": [-math.log(1 - c) / lam for lam in (1e-5, 1e-7, 1e-9) for c in (0.9, 0.95, 0.99)],
}
json.dump(ref, open(sys.argv[1] if len(sys.argv) > 1 else "reference.json", "w"))
print("wrote reference")

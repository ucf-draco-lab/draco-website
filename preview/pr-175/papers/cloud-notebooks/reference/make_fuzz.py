# Random arithmetic and comparison expressions (seeded) for MiniPy vs CPython.
import json, random
rng = random.Random(28571)
def atom():
    r = rng.random()
    if r < 0.45: return str(rng.randint(-20, 20))
    if r < 0.8: return repr(round(rng.uniform(-50, 50), rng.randint(0, 4)))
    if r < 0.9: return rng.choice(["True", "False"])
    return str(rng.randint(-10**20, 10**20))
def expr(d=0):
    if d > 2 or rng.random() < 0.3: return atom()
    op = rng.choice(["+", "-", "*", "/", "//", "%", "**", "<", "==", ">=", "and", "or"])
    a, b = expr(d + 1), expr(d + 1)
    if op == "**": b = str(rng.randint(-3, 6))
    return "(" + a + " " + op + " " + b + ")"
cells = [expr() for _ in range(1500)]
cells += ["round(%s, %d)" % (repr(rng.uniform(-1000, 1000)), rng.randint(-2, 6)) for _ in range(300)]
cells += ["round(%d.5)" % rng.randint(-50, 50) for _ in range(50)]
json.dump([{"name": "fuzz", "cells": cells}], open("minipy-fuzz.json", "w"))

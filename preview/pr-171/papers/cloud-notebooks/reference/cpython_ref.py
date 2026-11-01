# Runs minipy-cases.json under CPython with notebook semantics (shared globals per
# session; a trailing expression is displayed as its repr unless it is None).
import ast, io, json, sys, contextlib
cases = json.load(open(sys.argv[1]))
out = []
for c in cases:
    g = {"__name__": "__main__"}
    res = []
    for src in c["cells"]:
        buf = io.StringIO(); value = None; error = None
        try:
            tree = ast.parse(src, "<cell>", "exec")
            last = None
            if tree.body and isinstance(tree.body[-1], ast.Expr):
                last = ast.Expression(tree.body.pop().value)
            with contextlib.redirect_stdout(buf):
                exec(compile(tree, "<cell>", "exec"), g)
                if last is not None:
                    v = eval(compile(last, "<cell>", "eval"), g)
                    if v is not None: value = repr(v)
        except SyntaxError as e:
            error = type(e).__name__ + ": " + e.msg
        except Exception as e:
            error = type(e).__name__ + ": " + str(e)
        res.append({"stdout": buf.getvalue(), "value": value, "error": error})
    out.append({"name": c["name"], "cells": res})
json.dump(out, open(sys.argv[2], "w"), indent=1)

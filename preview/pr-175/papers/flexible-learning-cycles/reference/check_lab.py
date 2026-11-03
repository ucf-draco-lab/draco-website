"""Runs every filled-in version of Lab 3 (Collatz Numbers) from
github.com/cxedhub/cosc-1010-intro-labs (03/main.py) in Python and writes the
outcome of each of the lab's five test inputs to lab_ref.json.

Usage: python3 check_lab.py /path/to/cosc-1010-intro-labs/03/main.py
The six "???" placeholders are filled in file order with each menu choice
that flc-engine.js offers (TODOS). A run that has not finished after 0.1 s
counts as "loop"; the engine stops at 10,000 loop passes.
"""
import io, itertools, json, signal, sys, contextlib

MENUS = [
    ["iterations + 1", "iterations", "iterations - 1"],
    ["even_collatz(n)", "odd_collatz(n)", "n - 1"],
    ["odd_collatz(n)", "even_collatz(n)", "n + 1"],
    ["print(iterations)", "print(n)", 'print("iterations")', "return iterations"],
    ["n // 2", "n / 2", "n % 2", "n * 2"],
    ["def odd_collatz(n):", "def odd_collatz():", "def even_collatz(n):"],
]
TESTS = [6, 2, 100, 47, 17]

class Timeout(Exception):
    pass

def handler(signum, frame):
    raise Timeout()

def main(path):
    src = open(path).read()
    assert src.count("???") == 6
    # The public starter file leaves the odd function's body flush left;
    # completing the header TODO includes indenting it, as the page shows.
    assert src.count("\nreturn n * 3 + 1\n") == 1
    src = src.replace("\nreturn n * 3 + 1\n", "\n    return n * 3 + 1\n")
    out = {}
    signal.signal(signal.SIGALRM, handler)
    for combo in itertools.product(*[range(len(m)) for m in MENUS]):
        prog = src
        for i, k in enumerate(combo):
            prog = prog.replace("???", MENUS[i][k], 1)
        prog = prog.replace("\nmain()", "\n")  # call main() ourselves, once per input
        code = compile(prog, "main.py", "exec")
        res = []
        for x in TESTS:
            g = {"__name__": "lab"}
            buf = io.StringIO()
            g["input"] = lambda *a, _x=x: str(_x)
            try:
                exec(code, g)
                signal.setitimer(signal.ITIMER_REAL, 0.1)
                with contextlib.redirect_stdout(buf):
                    g["main"]()
                signal.setitimer(signal.ITIMER_REAL, 0)
                res.append("out:" + buf.getvalue().strip())
            except Timeout:
                res.append("loop")
            except Exception as e:
                signal.setitimer(signal.ITIMER_REAL, 0)
                res.append("err:" + type(e).__name__)
        out[",".join(map(str, combo))] = res
    json.dump(out, open("lab_ref.json", "w"), indent=0)
    print(len(out), "programs")

if __name__ == "__main__":
    main(sys.argv[1])

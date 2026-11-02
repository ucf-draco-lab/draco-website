"""Independent SciPy reference for vc-engine.js: Fisher exact tests (SciPy) and Wilson intervals (statsmodels)
over every 2x2 table with row totals up to 30, plus the page's own completion test.
Writes stats-reference.json. Run: python3 -I check_stats.py"""
import json, math
from scipy.stats import fisher_exact
from statsmodels.stats.proportion import proportion_confint

def wilson(k, n):
    return list(proportion_confint(k, n, alpha=0.05, method='wilson'))

cases = []
for n1 in range(1, 31, 3):
    for n2 in range(1, 31, 4):
        for a in range(0, n1+1):
            for c in range(0, n2+1, 2):
                cases.append([a, n1-a, c, n2-c, fisher_exact([[a, n1-a], [c, n2-c]])[1]])
wil = [[k, n, *wilson(k, n)] for n in range(1, 41) for k in range(0, n+1)]
json.dump({"fisher": cases, "wilson": wil,
           "completion": fisher_exact([[16, 8], [7, 6]])[1]}, open("stats-reference.json", "w"))
print(len(cases), "fisher cases;", len(wil), "wilson cases; completion p =", fisher_exact([[16, 8], [7, 6]])[1])

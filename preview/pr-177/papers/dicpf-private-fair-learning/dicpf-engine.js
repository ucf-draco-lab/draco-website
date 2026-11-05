/*
  DicPF engine for /papers/dicpf-private-fair-learning/.

  A browser port of the computation in Hu, Borowczak, and Chen, "Privacy-Preserving Fair
  Machine Learning Without Collecting Sensitive Demographic Data" (IJCNN 2021), following the
  authors' released code (github.com/HuiHu1/Privacy-Preserving-Fair-Learning, the zip
  "Privacy-Preserving-Fair-Learning-Without-Collecting-Sensitive-Data"):

    Dic_Learning/dic_learning.py  each local agent's accurate dictionary (K-SVD with OMP)
                                  and the rho-fair atom filter (step 3 of Algorithm 1).
                                  The dictionaries are learned offline with the authors'
                                  Python script and shipped in data.json; the filter runs here.
    Model/Sparsemodel.m, Cal.m    the z-Sparse Fair Learner (random coordinate descent on
                                  Eq. 4 with the three-case update of Eq. 9), the 0.5
                                  threshold, classifier error, and statistical parity (Eq. 12).
    Inference/*.m                 the genetic-algorithm privacy inference attack (Eq. 10, 11).

  Two learner modes:
    "released"  the MATLAB script as written. After the first update, the line
                [row column]=size(prediction_label) sets column to 1, so every later
                randi(column) picks coordinate 1 and the other coefficients keep their
                rand() starting values.
    "described" the method as the paper describes it: each step updates a coordinate drawn
                uniformly from all k.
  Loads as a page script or in a Web Worker. Plain ES5, no dependencies.
*/
(function (root) {
  "use strict";

  /* ---------------------------------------------------------------- RNG */

  // mulberry32: small, seedable, uniform on [0, 1).
  function rng(seed) {
    var a = (seed >>> 0) || 1;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  // MATLAB randi(n): uniform integer on 1..n.
  function randi(r, n) { return 1 + Math.floor(r() * n); }

  /* ---------------------------------------------------------------- data */

  function b64bytes(s) {
    if (typeof atob === "function") {
      var bin = atob(s), out = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
      return out;
    }
    return new Uint8Array(Buffer.from(s, "base64"));
  }

  /*
    data.json layout (written by build-data.py):
      n, p                 1,993 communities, 99 public features (columns 2 to 100 of
                           crimecommunity.csv; column 101 is the crime rate, column 102 the label)
      rows                 base64 Uint8, n x 102, value x 100 (the CSV has two decimals)
      perms                base64 Uint16 little-endian, 50 x n, 0-based (crimecommunity_index.csv)
      dict                 { agents: 3, m: 664, k: 99, atoms: base64 Float32 3 x k x p }
  */
  function decode(json) {
    var n = json.n, p = json.p, C = json.cols;
    var raw = b64bytes(json.rows);
    var X = new Float64Array(n * p), s = new Float64Array(n), y = new Float64Array(n), rate = new Float64Array(n);
    for (var i = 0; i < n; i++) {
      s[i] = raw[i * C] / 100;
      for (var j = 0; j < p; j++) X[i * p + j] = raw[i * C + 1 + j] / 100;
      rate[i] = raw[i * C + C - 2] / 100;
      y[i] = raw[i * C + C - 1] / 100;
    }
    var pb = b64bytes(json.perms), perms = [];
    for (var t = 0; t < json.trials; t++) {
      var col = new Int32Array(n);
      for (var q = 0; q < n; q++) { var o = 2 * (t * n + q); col[q] = pb[o] | (pb[o + 1] << 8); }
      perms.push(col);
    }
    var fb = b64bytes(json.dict.atoms);
    var f32 = new Float32Array(fb.buffer, fb.byteOffset, fb.byteLength / 4);
    var dict = [];
    for (var a = 0; a < json.dict.agents; a++) {
      var atoms = [];
      for (var k = 0; k < json.dict.k; k++) {
        var v = new Float64Array(p);
        for (var r = 0; r < p; r++) v[r] = f32[(a * json.dict.k + k) * p + r];
        atoms.push(v);
      }
      dict.push(atoms);
    }
    return { n: n, p: p, X: X, s: s, y: y, rate: rate, perms: perms, dict: dict,
             agentRows: json.dict.m, names: json.names || null };
  }

  /* ---------------------------------------------------------------- statistics */

  // Sample covariance, ddof = 1 (numpy.cov and MATLAB cov).
  function cov(a, b, len) {
    var n = len || a.length, ma = 0, mb = 0, i;
    for (i = 0; i < n; i++) { ma += a[i]; mb += b[i]; }
    ma /= n; mb /= n;
    var c = 0;
    for (i = 0; i < n; i++) c += (a[i] - ma) * (b[i] - mb);
    return c / (n - 1);
  }
  function meanStd(v) {
    var n = v.length, m = 0, i;
    if (!n) return { mean: NaN, std: NaN, n: 0 };
    for (i = 0; i < n; i++) m += v[i];
    m /= n;
    var q = 0;
    for (i = 0; i < n; i++) q += (v[i] - m) * (v[i] - m);
    return { mean: m, std: n > 1 ? Math.sqrt(q / (n - 1)) : 0, n: n };
  }

  /* ---------------------------------------------------------------- step 3: fair atoms */

  // Rows of agent a: the first m entries of shuffle a (dic_learning.py, start = 0, end = n/3).
  function agentRows(D, a) { return D.perms[a].subarray(0, D.agentRows); }

  // cov(X_i d, s_i) for every atom of agent a, on that agent's rows.
  function atomCovs(D, a) {
    var rows = agentRows(D, a), m = rows.length, p = D.p;
    var sv = new Float64Array(m), pre = new Float64Array(m), out = [];
    for (var i = 0; i < m; i++) sv[i] = D.s[rows[i]];
    D.dict[a].forEach(function (d) {
      for (var i = 0; i < m; i++) {
        var o = rows[i] * p, acc = 0;
        for (var j = 0; j < p; j++) acc += D.X[o + j] * d[j];
        pre[i] = acc;
      }
      out.push(cov(pre, sv, m));
    });
    return out;
  }

  // The modeler's aggregated dictionary: every atom with |cov| <= rho, agent by agent.
  function fairDictionary(D, covs, rho) {
    var W = [], from = [];
    for (var a = 0; a < covs.length; a++)
      for (var k = 0; k < covs[a].length; k++)
        if (Math.abs(covs[a][k]) <= rho) { W.push(D.dict[a][k]); from.push([a, k]); }
    return { W: W, from: from };
  }

  /* ---------------------------------------------------------------- z-Sparse Fair Learner */

  // P = X W for a row set: P[t][i] = x_rows[i] . W[t]
  function project(D, rows, W) {
    var n = rows.length, p = D.p, P = [];
    for (var t = 0; t < W.length; t++) {
      var w = W[t], col = new Float64Array(n);
      for (var i = 0; i < n; i++) {
        var o = rows[i] * p, acc = 0;
        for (var j = 0; j < p; j++) acc += D.X[o + j] * w[j];
        col[i] = acc;
      }
      P.push(col);
    }
    return P;
  }

  function allRows(D, W) { var idx = new Int32Array(D.n); for (var i = 0; i < D.n; i++) idx[i] = i; return project(D, idx, W); }

  // Cal.m: positives per group, per-group error, and statistical parity.
  function groupStats(pred, yv, sv) {
    var cmin = 0, cma = 0, emin = 0, ema = 0, pmin = 0, pma = 0, err = 0;
    for (var i = 0; i < pred.length; i++) {
      var wrong = pred[i] !== yv[i];
      if (wrong) err++;
      if (sv[i] === 1) { cmin++; if (wrong) emin++; if (pred[i] === 1) pmin++; }
      else { cma++; if (wrong) ema++; if (pred[i] === 1) pma++; }
    }
    return {
      error: err / pred.length,
      sp: Math.abs(pmin / cmin - pma / cma),
      errMin: emin / cmin, errMaj: ema / cma,
      posMin: pmin, posMaj: pma, nMin: cmin, nMaj: cma,
      rateMin: pmin / cmin, rateMaj: pma / cma
    };
  }

  /*
    One trial of Sparsemodel.m on shuffle `trial` (0-based): train on its first 1,493 rows,
    test on the last 500. opts: { W, lambda (50), iters (1500), mode, seed, beta0, jseq }.
    beta0 / jseq (1-based) override the RNG for draw-for-draw comparison with the reference.
  */
  function trainTrial(D, trial, opts) {
    var W = opts.W, k = W.length;
    var lambda = opts.lambda != null ? opts.lambda : 50;
    var iters = opts.iters != null ? opts.iters : 1500;
    var mode = opts.mode || "released";
    var perm = D.perms[trial];
    var ntr = opts.ntrain || 1493, nte = D.n - ntr;
    var tr = perm.subarray(0, ntr), te = perm.subarray(ntr, D.n);
    var Ptr, Pte;
    if (opts.Pall) {             // X W precomputed for all n rows; gather by shuffle
      Ptr = opts.Pall.map(function (col) { var o = new Float64Array(ntr); for (var q = 0; q < ntr; q++) o[q] = col[tr[q]]; return o; });
      Pte = opts.Pall.map(function (col) { var o = new Float64Array(nte); for (var q = 0; q < nte; q++) o[q] = col[te[q]]; return o; });
    } else { Ptr = project(D, tr, W); Pte = project(D, te, W); }
    var ytr = new Float64Array(ntr), yte = new Float64Array(nte), ste = new Float64Array(nte), i, t;
    for (i = 0; i < ntr; i++) ytr[i] = D.y[tr[i]];
    for (i = 0; i < nte; i++) { yte[i] = D.y[te[i]]; ste[i] = D.s[te[i]]; }
    var r = rng(opts.seed || 1);
    var beta = new Float64Array(k);
    for (t = 0; t < k; t++) beta[t] = opts.beta0 ? opts.beta0[t] : r();
    // residual res = Ptr beta - y
    var res = new Float64Array(ntr);
    for (i = 0; i < ntr; i++) { var acc = 0; for (t = 0; t < k; t++) acc += Ptr[t][i] * beta[t]; res[i] = acc - ytr[i]; }
    var norm2 = new Float64Array(k);
    for (t = 0; t < k; t++) { var q2 = 0, c = Ptr[t]; for (i = 0; i < ntr; i++) q2 += c[i] * c[i]; norm2[t] = q2; }
    var column = k, touched = new Uint8Array(k), lam2 = 2 * lambda;
    for (var it = 0; it < iters; it++) {
      var j = (opts.jseq ? opts.jseq[it] : randi(r, column)) - 1;
      touched[j] = 1;
      var pj = Ptr[j], bj = beta[j], Q = 0;
      for (i = 0; i < ntr; i++) Q += pj[i] * (res[i] - pj[i] * bj);
      Q *= 2;
      var R = 2 * norm2[j], nb;
      if (Q < -lam2) nb = (-lam2 - Q) / R;
      else if (Q > lam2) nb = (lam2 - Q) / R;
      else nb = 0;
      if (nb !== bj) { var dlt = nb - bj; for (i = 0; i < ntr; i++) res[i] += pj[i] * dlt; beta[j] = nb; }
      if (mode === "released") column = 1;
    }
    var pred = new Float64Array(nte), score = new Float64Array(nte);
    for (i = 0; i < nte; i++) {
      var sc = 0; for (t = 0; t < k; t++) sc += Pte[t][i] * beta[t];
      score[i] = sc; pred[i] = Math.abs(sc) >= 0.5 ? 1 : 0;
    }
    var g = groupStats(pred, yte, ste);
    var nz = 0, nt = 0; for (t = 0; t < k; t++) { if (beta[t] !== 0) nz++; if (touched[t]) nt++; }
    g.beta = beta; g.nonzero = nz; g.updated = nt; g.k = k; g.positives = g.posMin + g.posMaj;
    g.score = score; g.pred = pred; g.trial = trial;
    return g;
  }

  /*
    Sparsemodel.m's outer loop over trials. In the released script a trial in which either
    group gets no positive prediction prints "No positive predictions!!" and breaks out of the
    loop; `stopOnEmpty` keeps that behavior.
  */
  function runTrials(D, opts, nTrials, onTrial) {
    var errs = [], sps = [], results = [], stopped = null;
    var Pall = opts.Pall || allRows(D, opts.W);
    for (var t = 0; t < nTrials; t++) {
      var g = trainTrial(D, t, {
        W: opts.W, Pall: Pall, lambda: opts.lambda, iters: opts.iters, mode: opts.mode,
        seed: (opts.seed || 1) * 1000 + t + 1
      });
      results.push(g);
      if (onTrial) onTrial(t, g);
      if (opts.stopOnEmpty !== false && (g.posMin === 0 || g.posMaj === 0)) { stopped = t; break; }
      errs.push(g.error); sps.push(g.sp);
    }
    return { error: meanStd(errs), sp: meanStd(sps), results: results, stoppedAt: stopped };
  }

  /*
    Reference baseline computed by this page (not in the paper): the same learner on the
    identity dictionary (each public feature its own atom), i.e. a lasso on raw features with
    no fairness filter.
  */
  function identityAtoms(p) {
    var W = [];
    for (var j = 0; j < p; j++) { var v = new Float64Array(p); v[j] = 1; W.push(v); }
    return W;
  }

  /* ---------------------------------------------------------------- inference attack */

  /*
    Inference/Infer.m with Population, Crossover, Mutation, Fitness, Filter, and Selection,
    ported as written. pre: the model's 0/1 predictions on the attacked rows; truth: true s.
    Returns the privacy loss PL = 1 - mean((s_hat - s)^2) (Eq. 10) of the individual the
    script records as best, plus the population trace.
  */
  function inferAttack(pre, truth, opts) {
    var n = pre.length;
    var p = opts.pop || 200, c = opts.cross != null ? opts.cross : 0.1, m = opts.mut != null ? opts.mut : 0.01;
    var tg = opts.generations || 500, r = rng(opts.seed || 7);
    var P = [], i, g;
    for (i = 0; i < p; i++) { var row = new Uint8Array(n); for (var q = 0; q < n; q++) row[q] = r() < 0.5 ? 1 : 0; P.push(row); }
    var trace = [], best = [], bestSP = [];
    for (g = 0; g < tg; g++) {
      var x1 = P.length;
      // Crossover.m: round(x1*c) single-point swaps between two distinct rows
      var nc = Math.round(x1 * c);
      for (i = 0; i < nc; i++) {
        var a1, a2;
        do { a1 = randi(r, x1); a2 = randi(r, x1); } while (a1 === a2);
        var cut = 1 + randi(r, n - 1);              // 1-based cut: columns cut..n swap
        var A = P[a1 - 1], B = P[a2 - 1];
        for (var q2 = cut - 1; q2 < n; q2++) { var tmp = A[q2]; A[q2] = B[q2]; B[q2] = tmp; }
      }
      // Mutation.m: round(x1*m) times, flip one bit of a random row and write it into row i
      var nm = Math.round(x1 * m);
      for (i = 0; i < nm; i++) {
        var src = P[randi(r, x1) - 1], cp = new Uint8Array(src), bit = randi(r, n) - 1;
        cp[bit] = cp[bit] ? 0 : 1;
        P[i] = cp;
      }
      // Fitness.m: statistical parity of the predictions under each inferred s
      var E = P.map(function (row) {
        var mi = 0, ma = 0, c1 = 0, c2 = 0;
        for (var q = 0; q < n; q++) {
          if (row[q] === 1) { mi++; if (pre[q] === 1) c1++; } else { ma++; if (pre[q] === 1) c2++; }
        }
        return Math.abs(c1 / mi - c2 / ma);
      });
      // Filter.m: drop rows whose fitness is 0, 1, or NaN
      var keepP = [], keepE = [];
      for (i = 0; i < P.length; i++) if (!(E[i] === 0 || E[i] === 1 || isNaN(E[i]))) { keepP.push(P[i]); keepE.push(E[i]); }
      if (!keepP.length) { trace.push({ gen: g + 1, pop: 0 }); break; }
      // Selection.m: [value, idx] = sort(F); keep round(0.8x); YY2 = value(idx(1:p_num))
      var idx = keepE.map(function (v, k) { return k; });
      idx.sort(function (u, v) { return keepE[u] - keepE[v] || u - v; });
      var value = idx.map(function (k) { return keepE[k]; });
      var pn = Math.round(0.8 * keepP.length);
      P = []; var S = [];
      for (i = 0; i < pn; i++) { P.push(keepP[idx[i]]); S.push(value[idx[i]]); }
      var mn = Infinity, mi2 = 0, sum = 0;
      for (i = 0; i < S.length; i++) { sum += S[i]; if (S[i] < mn) { mn = S[i]; mi2 = i; } }
      best.push(new Uint8Array(P[mi2])); bestSP.push(mn);
      trace.push({ gen: g + 1, pop: P.length, avg: sum / S.length, best: mn });
    }
    // best_index = argmin over generations of K(:,2); P2 = P_best_i(best_index,:)
    if (!best.length) return { privacyLoss: NaN, emptied: true, trace: trace, bestGen: 0, inferredMinority: NaN, finalPop: 0 };
    var bi = 0;
    for (i = 1; i < bestSP.length; i++) if (bestSP[i] < bestSP[bi]) bi = i;
    var P2 = best[bi], loss = 0, ones = 0;
    for (i = 0; i < n; i++) { loss += (P2[i] - truth[i]) * (P2[i] - truth[i]); ones += P2[i]; }
    return { privacyLoss: 1 - loss / n, trace: trace, bestGen: bi + 1, inferredMinority: ones / n,
             finalPop: P.length };
  }

  // Share of rows a constant guess of "majority" labels correctly: 1 - mean(s).
  function majorityGuess(truth) { var o = 0; for (var i = 0; i < truth.length; i++) o += truth[i]; return 1 - o / truth.length; }

  var api = {
    rng: rng, randi: randi, decode: decode, cov: cov, meanStd: meanStd,
    agentRows: agentRows, atomCovs: atomCovs, fairDictionary: fairDictionary,
    project: project, allRows: allRows, groupStats: groupStats, trainTrial: trainTrial, runTrials: runTrials,
    identityAtoms: identityAtoms, inferAttack: inferAttack, majorityGuess: majorityGuess
  };
  root.DicPF = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof self !== "undefined" ? self : this);

/*
  Retail liability engine for /papers/retail-liability-models/.

  Rebuilds the analysis pipeline of Yang and Borowczak, "Predictive Liability
  Models and Visualizations of High Dimensional Retail Employee Data"
  (ICIAI 2018, DOI 10.1145/3194206.3195587), which used scikit-learn:
    - standardization, a 90/10 train/test split, MAE, MSE, and R^2
    - eight regressors: k nearest neighbors, ordinary least squares, lasso
      (coordinate descent), ridge, epsilon-SVR with linear and RBF kernels
      (a port of libsvm's solver), a CART regression tree, and a random forest
    - recursive feature elimination (RFE) from 28 features to two
    - principal component analysis, exact t-SNE with scikit-learn's two-stage
      schedule, k-means, and the silhouette score

  The tree and forest follow scikit-learn's DecisionTreeRegressor and
  RandomForestRegressor (best splitter, float32 features, Fisher-Yates feature
  order from its xorshift generator, bootstrap counts as sample weights), and
  numpy's legacy MT19937 RandomState supplies their seeds, so a random_state
  gives the same trees as scikit-learn.

  The study's 991-row retail dataset is private. Every dataset this engine
  makes is simulated (simulate()), and the page labels it so.

  Loads as a page script or in a Web Worker: exposes self.Liability.
*/
(function (root) {
  "use strict";

  var f32 = Math.fround;

  /* ================================================================ RNGs */

  // Small fast generator for simulation and page-level shuffles.
  function mulberry(seed) {
    var s = seed >>> 0;
    return function () {
      s = (s + 0x6D2B79F5) | 0;
      var t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function gaussFrom(rnd) {
    var u = 0, v = 0;
    while (u === 0) u = rnd();
    while (v === 0) v = rnd();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  // numpy.random.RandomState(seed): MT19937 with init_genrand seeding.
  function RandomState(seed) {
    var mt = new Uint32Array(624), i;
    mt[0] = seed >>> 0;
    for (i = 1; i < 624; i++) {
      var prev = mt[i - 1] ^ (mt[i - 1] >>> 30);
      // 1812433253 * prev + i, mod 2^32, without losing precision
      mt[i] = ((((prev & 0xffff0000) >>> 16) * 1812433253) << 16) + (prev & 0x0000ffff) * 1812433253 + i;
    }
    this.mt = mt;
    this.mti = 624;
  }
  RandomState.prototype.nextUint32 = function () {
    var mt = this.mt, y, kk;
    if (this.mti >= 624) {
      for (kk = 0; kk < 227; kk++) {
        y = (mt[kk] & 0x80000000) | (mt[kk + 1] & 0x7fffffff);
        mt[kk] = mt[kk + 397] ^ (y >>> 1) ^ ((y & 1) ? 0x9908b0df : 0);
      }
      for (; kk < 623; kk++) {
        y = (mt[kk] & 0x80000000) | (mt[kk + 1] & 0x7fffffff);
        mt[kk] = mt[kk - 227] ^ (y >>> 1) ^ ((y & 1) ? 0x9908b0df : 0);
      }
      y = (mt[623] & 0x80000000) | (mt[0] & 0x7fffffff);
      mt[623] = mt[396] ^ (y >>> 1) ^ ((y & 1) ? 0x9908b0df : 0);
      this.mti = 0;
    }
    y = mt[this.mti++];
    y ^= (y >>> 11);
    y ^= (y << 7) & 0x9d2c5680;
    y ^= (y << 15) & 0xefc60000;
    y ^= (y >>> 18);
    return y >>> 0;
  };
  // RandomState.randint(low, high) for the default int64 dtype: masked
  // rejection sampling on 32-bit draws when the range fits in 32 bits.
  RandomState.prototype.randint = function (low, high) {
    var rng = high - low - 1;
    if (rng === 0) return low;
    var mask = rng;
    mask |= mask >>> 1; mask |= mask >>> 2; mask |= mask >>> 4; mask |= mask >>> 8; mask |= mask >>> 16;
    mask >>>= 0;
    var v;
    do { v = (this.nextUint32() & mask) >>> 0; } while (v > rng);
    return low + v;
  };

  var RAND_R_MAX = 2147483647;
  var MAX_INT32 = 2147483647;
  // scikit-learn's our_rand_r: a 32-bit xorshift.
  function randR(st) {
    if (st.s === 0) st.s = 1;
    var s = st.s;
    s = (s ^ (s << 13)) >>> 0;
    s = (s ^ (s >>> 17)) >>> 0;
    s = (s ^ (s << 5)) >>> 0;
    st.s = s;
    return s % 2147483648;
  }
  function randInt(low, high, st) { return low + randR(st) % (high - low); }

  /* ================================================================ linear algebra */

  function zeros(n) { return new Float64Array(n); }
  function colMeans(X) {
    var n = X.length, p = X[0].length, m = zeros(p), i, j;
    for (i = 0; i < n; i++) for (j = 0; j < p; j++) m[j] += X[i][j];
    for (j = 0; j < p; j++) m[j] /= n;
    return m;
  }
  function mean(a) { var s = 0; for (var i = 0; i < a.length; i++) s += a[i]; return s / a.length; }

  // Solve A x = b for symmetric positive definite A (Cholesky), in place copies.
  function cholSolve(A, b) {
    var n = b.length, L = A.map(function (r) { return Float64Array.from(r); }), i, j, k, s;
    for (j = 0; j < n; j++) {
      s = L[j][j];
      for (k = 0; k < j; k++) s -= L[j][k] * L[j][k];
      if (s <= 0) throw new Error("matrix not positive definite");
      L[j][j] = Math.sqrt(s);
      for (i = j + 1; i < n; i++) {
        s = L[i][j];
        for (k = 0; k < j; k++) s -= L[i][k] * L[j][k];
        L[i][j] = s / L[j][j];
      }
    }
    var y = zeros(n), x = zeros(n);
    for (i = 0; i < n; i++) { s = b[i]; for (k = 0; k < i; k++) s -= L[i][k] * y[k]; y[i] = s / L[i][i]; }
    for (i = n - 1; i >= 0; i--) { s = y[i]; for (k = i + 1; k < n; k++) s -= L[k][i] * x[k]; x[i] = s / L[i][i]; }
    return x;
  }

  // Least squares by Householder QR (columns of X centered by the caller).
  function lstsq(X, y) {
    var n = X.length, p = X[0].length, i, j, k;
    var A = X.map(function (r) { return Float64Array.from(r); }), b = Float64Array.from(y);
    var d = zeros(p);
    for (k = 0; k < p; k++) {
      var norm = 0;
      for (i = k; i < n; i++) norm += A[i][k] * A[i][k];
      norm = Math.sqrt(norm);
      if (norm === 0) throw new Error("rank deficient");
      var alpha = A[k][k] > 0 ? -norm : norm;
      var v0 = A[k][k] - alpha;
      // v = [v0, A[k+1..n-1][k]], H = I - 2 v v^T / (v^T v)
      var vtv = v0 * v0;
      for (i = k + 1; i < n; i++) vtv += A[i][k] * A[i][k];
      for (j = k + 1; j < p; j++) {
        var s = v0 * A[k][j];
        for (i = k + 1; i < n; i++) s += A[i][k] * A[i][j];
        s = 2 * s / vtv;
        A[k][j] -= s * v0;
        for (i = k + 1; i < n; i++) A[i][j] -= s * A[i][k];
      }
      var sb = v0 * b[k];
      for (i = k + 1; i < n; i++) sb += A[i][k] * b[i];
      sb = 2 * sb / vtv;
      b[k] -= sb * v0;
      for (i = k + 1; i < n; i++) b[i] -= sb * A[i][k];
      d[k] = alpha;
    }
    var w = zeros(p);
    for (k = p - 1; k >= 0; k--) {
      var t = b[k];
      for (j = k + 1; j < p; j++) t -= A[k][j] * w[j];
      w[k] = t / d[k];
    }
    return w;
  }

  // Symmetric eigendecomposition by cyclic Jacobi. Returns {values, vectors}
  // with vectors[k] the k-th eigenvector, sorted by decreasing value.
  function eigSym(S) {
    var n = S.length, A = S.map(function (r) { return Float64Array.from(r); }), V = [], i, j, k, sweep;
    for (i = 0; i < n; i++) { V.push(zeros(n)); V[i][i] = 1; }
    for (sweep = 0; sweep < 100; sweep++) {
      var off = 0;
      for (i = 0; i < n; i++) for (j = i + 1; j < n; j++) off += A[i][j] * A[i][j];
      if (off < 1e-30) break;
      for (i = 0; i < n; i++) for (j = i + 1; j < n; j++) {
        if (Math.abs(A[i][j]) < 1e-300) continue;
        var theta = (A[j][j] - A[i][i]) / (2 * A[i][j]);
        var t = (theta >= 0 ? 1 : -1) / (Math.abs(theta) + Math.sqrt(theta * theta + 1));
        var c = 1 / Math.sqrt(t * t + 1), s = t * c;
        for (k = 0; k < n; k++) {
          var aki = A[k][i], akj = A[k][j];
          A[k][i] = c * aki - s * akj; A[k][j] = s * aki + c * akj;
        }
        for (k = 0; k < n; k++) {
          var aik = A[i][k], ajk = A[j][k];
          A[i][k] = c * aik - s * ajk; A[j][k] = s * aik + c * ajk;
        }
        for (k = 0; k < n; k++) {
          var vki = V[k][i], vkj = V[k][j];
          V[k][i] = c * vki - s * vkj; V[k][j] = s * vki + c * vkj;
        }
      }
    }
    var order = [];
    for (i = 0; i < n; i++) order.push(i);
    order.sort(function (a, b) { return A[b][b] - A[a][a]; });
    return {
      values: order.map(function (o) { return A[o][o]; }),
      vectors: order.map(function (o) { var v = zeros(n); for (k = 0; k < n; k++) v[k] = V[k][o]; return v; })
    };
  }

  /* ================================================================ preprocessing */

  // StandardScaler: zero mean, unit (population) variance per column.
  function standardize(X) {
    var n = X.length, p = X[0].length, m = colMeans(X), sd = zeros(p), i, j;
    for (i = 0; i < n; i++) for (j = 0; j < p; j++) { var d = X[i][j] - m[j]; sd[j] += d * d; }
    for (j = 0; j < p; j++) { sd[j] = Math.sqrt(sd[j] / n); if (sd[j] === 0) sd[j] = 1; }
    return X.map(function (r) { var o = zeros(p); for (var k = 0; k < p; k++) o[k] = (r[k] - m[k]) / sd[k]; return o; });
  }

  // A seeded 90/10 split (the page's own shuffle). Returns {train, test} index lists.
  function split(n, testFrac, seed) {
    var idx = [], i, r = mulberry(seed);
    for (i = 0; i < n; i++) idx.push(i);
    for (i = n - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)); var t = idx[i]; idx[i] = idx[j]; idx[j] = t; }
    var nt = Math.ceil(n * testFrac);
    return { test: idx.slice(0, nt), train: idx.slice(nt) };
  }
  function take(A, idx) { return idx.map(function (i) { return A[i]; }); }
  function cols(X, keep) { return X.map(function (r) { var o = zeros(keep.length); for (var k = 0; k < keep.length; k++) o[k] = r[keep[k]]; return o; }); }

  function metrics(yTrue, yPred) {
    var n = yTrue.length, mae = 0, mse = 0, m = mean(yTrue), sst = 0, i;
    for (i = 0; i < n; i++) {
      var e = yPred[i] - yTrue[i];
      mae += Math.abs(e); mse += e * e;
      sst += (yTrue[i] - m) * (yTrue[i] - m);
    }
    return { mae: mae / n, mse: mse / n, r2: 1 - mse / sst, varTest: sst / n, n: n };
  }

  /* ================================================================ regressors */
  // Each fit returns { predict(X) -> Float64Array, coef? , importances? }.

  function sqdist(a, b) { var s = 0; for (var k = 0; k < a.length; k++) { var d = a[k] - b[k]; s += d * d; } return s; }

  // KNeighborsRegressor (uniform weights, Euclidean).
  function fitKNN(X, y, k) {
    k = k || 5;
    return {
      k: k,
      neighbors: function (x) {
        var d = X.map(function (r, i) { return { i: i, d: sqdist(r, x) }; });
        d.sort(function (a, b) { return a.d - b.d || a.i - b.i; });
        return d.slice(0, k).map(function (o) { return o.i; });
      },
      predict: function (Xt) {
        var self = this;
        return Float64Array.from(Xt.map(function (x) {
          var nb = self.neighbors(x), s = 0;
          for (var t = 0; t < nb.length; t++) s += y[nb[t]];
          return s / nb.length;
        }));
      }
    };
  }

  function centered(X, y) {
    var mx = colMeans(X), my = mean(y), p = mx.length;
    var Xc = X.map(function (r) { var o = zeros(p); for (var k = 0; k < p; k++) o[k] = r[k] - mx[k]; return o; });
    var yc = Float64Array.from(y, function (v) { return v - my; });
    return { Xc: Xc, yc: yc, mx: mx, my: my };
  }
  function linearModel(w, mx, my) {
    var b = my;
    for (var k = 0; k < w.length; k++) b -= mx[k] * w[k];
    return {
      coef: w, intercept: b,
      predict: function (Xt) {
        return Float64Array.from(Xt.map(function (x) { var s = b; for (var k = 0; k < w.length; k++) s += w[k] * x[k]; return s; }));
      }
    };
  }

  // LinearRegression: least squares on centered data.
  function fitOLS(X, y) {
    var c = centered(X, y);
    return linearModel(lstsq(c.Xc, c.yc), c.mx, c.my);
  }

  // Ridge: (Xc'Xc + alpha I) w = Xc'yc.
  function fitRidge(X, y, alpha) {
    alpha = alpha == null ? 1 : alpha;
    var c = centered(X, y), p = c.mx.length, i, j, r;
    var A = [], b = zeros(p);
    for (i = 0; i < p; i++) A.push(zeros(p));
    for (r = 0; r < c.Xc.length; r++) {
      var x = c.Xc[r];
      for (i = 0; i < p; i++) { b[i] += x[i] * c.yc[r]; for (j = i; j < p; j++) A[i][j] += x[i] * x[j]; }
    }
    for (i = 0; i < p; i++) { A[i][i] += alpha; for (j = 0; j < i; j++) A[i][j] = A[j][i]; }
    return linearModel(cholSolve(A, b), c.mx, c.my);
  }

  // Lasso: minimize 1/(2n)||y - Xw||^2 + alpha ||w||_1 by cyclic coordinate
  // descent with scikit-learn's stopping rule (duality gap below tol * ||y||^2).
  function fitLasso(X, y, alpha, tol, maxIter) {
    alpha = alpha == null ? 1 : alpha; tol = tol == null ? 1e-4 : tol; maxIter = maxIter || 1000;
    var c = centered(X, y), n = c.Xc.length, p = c.mx.length, i, j, it;
    var a = alpha * n;                       // scikit-learn scales alpha by n_samples
    var colsX = [], norm2 = zeros(p);
    for (j = 0; j < p; j++) { var col = zeros(n); for (i = 0; i < n; i++) { col[i] = c.Xc[i][j]; norm2[j] += col[i] * col[i]; } colsX.push(col); }
    var w = zeros(p), R = Float64Array.from(c.yc), ynorm2 = 0;
    for (i = 0; i < n; i++) ynorm2 += c.yc[i] * c.yc[i];
    var tolAbs = tol * ynorm2, gap = Infinity;
    function dualityGap() {
      var XtR = 0, Rn = 0, l1 = 0, Ry = 0, k;
      for (k = 0; k < p; k++) { var s = 0, cc = colsX[k]; for (i = 0; i < n; i++) s += cc[i] * R[i]; XtR = Math.max(XtR, Math.abs(s)); l1 += Math.abs(w[k]); }
      for (i = 0; i < n; i++) { Rn += R[i] * R[i]; Ry += R[i] * c.yc[i]; }
      var const_ = XtR > a ? a / XtR : 1;
      return 0.5 * Rn * (1 + const_ * const_) + a * l1 - const_ * Ry;
    }
    for (it = 0; it < maxIter; it++) {
      var dwMax = 0, wMax = 0;
      for (j = 0; j < p; j++) {
        if (norm2[j] === 0) continue;
        var wj = w[j], cj = colsX[j], rho = 0;
        for (i = 0; i < n; i++) rho += cj[i] * R[i];
        rho += wj * norm2[j];
        var nw = Math.sign(rho) * Math.max(Math.abs(rho) - a, 0) / norm2[j];
        if (nw !== wj) { var d = nw - wj; for (i = 0; i < n; i++) R[i] -= d * cj[i]; }
        w[j] = nw;
        dwMax = Math.max(dwMax, Math.abs(nw - wj));
        wMax = Math.max(wMax, Math.abs(nw));
      }
      if (wMax === 0 || dwMax / wMax < tol || it === maxIter - 1) {
        gap = dualityGap();
        if (gap < tolAbs) break;
      }
    }
    var m = linearModel(w, c.mx, c.my);
    m.nIter = it + 1; m.gap = gap;
    return m;
  }

  /* ---------------------------------------------------------------- epsilon-SVR (libsvm) */

  var TAU = 1e-12;
  function dotv(a, b) { var s = 0; for (var k = 0; k < a.length; k++) s += a[k] * b[k]; return s; }

  // epsilon-SVR as libsvm solves it: 2l variables, y = +1 for the first l and -1
  // for the rest, second-order working set selection, kernel rows in single
  // precision, no shrinking. kernel: "linear" or "rbf". gamma for rbf.
  function fitSVR(X, y, opts) {
    opts = opts || {};
    var C = opts.C == null ? 1 : opts.C, eps = opts.epsilon == null ? 0.1 : opts.epsilon;
    var tol = opts.tol == null ? 1e-3 : opts.tol, kernel = opts.kernel || "rbf";
    var gamma = opts.gamma == null ? 1 / X[0].length : opts.gamma;
    var l = X.length, L = 2 * l, i, j, k;
    var x2 = zeros(l);
    for (i = 0; i < l; i++) x2[i] = dotv(X[i], X[i]);
    function kfun(a, b) {
      if (kernel === "linear") return dotv(X[a], X[b]);
      return Math.exp(-gamma * (x2[a] + x2[b] - 2 * dotv(X[a], X[b])));
    }
    var K = new Float32Array(l * l);
    for (i = 0; i < l; i++) for (j = i; j < l; j++) { var v = f32(kfun(i, j)); K[i * l + j] = v; K[j * l + i] = v; }
    var QD = zeros(L);
    for (k = 0; k < l; k++) { QD[k] = kfun(k, k); QD[k + l] = QD[k]; }
    var sign = new Int8Array(L), idx = new Int32Array(L), p = zeros(L);
    for (k = 0; k < l; k++) {
      sign[k] = 1; sign[k + l] = -1; idx[k] = k; idx[k + l] = k;
      p[k] = eps - y[k]; p[k + l] = eps + y[k];
    }
    var yy = sign; // y of the dual problem
    var alpha = zeros(L), G = Float64Array.from(p);
    // Q_ij = sign_i sign_j K(idx_i, idx_j), in single precision like libsvm's Qfloat rows
    function Qrow(r, out) {
      var off = idx[r] * l, sr = sign[r];
      for (var t = 0; t < L; t++) out[t] = f32(sr * sign[t] * K[off + idx[t]]);
      return out;
    }
    var Qi = new Float32Array(L), Qj = new Float32Array(L);
    function upper(t) { return alpha[t] >= C; }
    function lower(t) { return alpha[t] <= 0; }
    var maxIter = Math.max(10000000, 100 * L), iter = 0;
    while (iter < maxIter) {
      var Gmax = -Infinity, Gmax2 = -Infinity, Gi = -1, Gj = -1, objMin = Infinity, t;
      for (t = 0; t < L; t++) {
        if (yy[t] === 1) { if (!upper(t) && -G[t] >= Gmax) { Gmax = -G[t]; Gi = t; } }
        else { if (!lower(t) && G[t] >= Gmax) { Gmax = G[t]; Gi = t; } }
      }
      if (Gi !== -1) Qrow(Gi, Qi);
      for (t = 0; t < L; t++) {
        var gd, qc, od;
        if (yy[t] === 1) {
          if (!lower(t)) {
            gd = Gmax + G[t];
            if (G[t] >= Gmax2) Gmax2 = G[t];
            if (gd > 0) {
              qc = QD[Gi] + QD[t] - 2.0 * yy[Gi] * Qi[t];
              od = qc > 0 ? -(gd * gd) / qc : -(gd * gd) / TAU;
              if (od <= objMin) { Gj = t; objMin = od; }
            }
          }
        } else {
          if (!upper(t)) {
            gd = Gmax - G[t];
            if (-G[t] >= Gmax2) Gmax2 = -G[t];
            if (gd > 0) {
              qc = QD[Gi] + QD[t] + 2.0 * yy[Gi] * Qi[t];
              od = qc > 0 ? -(gd * gd) / qc : -(gd * gd) / TAU;
              if (od <= objMin) { Gj = t; objMin = od; }
            }
          }
        }
      }
      if (Gmax + Gmax2 < tol || Gj === -1) break;
      iter++;
      i = Gi; j = Gj;
      Qrow(j, Qj);
      var oldI = alpha[i], oldJ = alpha[j], quad, delta;
      if (yy[i] !== yy[j]) {
        quad = QD[i] + QD[j] + 2 * Qi[j];
        if (quad <= 0) quad = TAU;
        delta = (-G[i] - G[j]) / quad;
        var diff = alpha[i] - alpha[j];
        alpha[i] += delta; alpha[j] += delta;
        if (diff > 0) { if (alpha[j] < 0) { alpha[j] = 0; alpha[i] = diff; } }
        else { if (alpha[i] < 0) { alpha[i] = 0; alpha[j] = -diff; } }
        if (diff > 0) { if (alpha[i] > C) { alpha[i] = C; alpha[j] = C - diff; } }
        else { if (alpha[j] > C) { alpha[j] = C; alpha[i] = C + diff; } }
      } else {
        quad = QD[i] + QD[j] - 2 * Qi[j];
        if (quad <= 0) quad = TAU;
        delta = (G[i] - G[j]) / quad;
        var sum = alpha[i] + alpha[j];
        alpha[i] -= delta; alpha[j] += delta;
        if (sum > C) { if (alpha[i] > C) { alpha[i] = C; alpha[j] = sum - C; } }
        else { if (alpha[j] < 0) { alpha[j] = 0; alpha[i] = sum; } }
        if (sum > C) { if (alpha[j] > C) { alpha[j] = C; alpha[i] = sum - C; } }
        else { if (alpha[i] < 0) { alpha[i] = 0; alpha[j] = sum; } }
      }
      var dI = alpha[i] - oldI, dJ = alpha[j] - oldJ;
      for (t = 0; t < L; t++) G[t] += Qi[t] * dI + Qj[t] * dJ;
    }
    // rho (libsvm calculate_rho)
    var ub = Infinity, lb = -Infinity, nFree = 0, sumFree = 0;
    for (t = 0; t < L; t++) {
      var yG = yy[t] * G[t];
      if (upper(t)) { if (yy[t] === -1) ub = Math.min(ub, yG); else lb = Math.max(lb, yG); }
      else if (lower(t)) { if (yy[t] === 1) ub = Math.min(ub, yG); else lb = Math.max(lb, yG); }
      else { nFree++; sumFree += yG; }
    }
    var rho = nFree > 0 ? sumFree / nFree : (ub + lb) / 2;
    var sv = [], coef = [];
    for (k = 0; k < l; k++) { var cf = alpha[k] - alpha[k + l]; if (cf !== 0) { sv.push(X[k]); coef.push(cf); } }
    var model = {
      kernel: kernel, gamma: gamma, rho: rho, sv: sv, dualCoef: coef, iter: iter,
      predict: function (Xt) {
        return Float64Array.from(Xt.map(function (x) {
          var s = 0, xx = dotv(x, x);
          for (var q = 0; q < sv.length; q++) {
            var kv = kernel === "linear" ? dotv(sv[q], x) : Math.exp(-gamma * (dotv(sv[q], sv[q]) + xx - 2 * dotv(sv[q], x)));
            s += coef[q] * kv;
          }
          return s - rho;
        }));
      }
    };
    if (kernel === "linear") {
      var w = zeros(X[0].length);
      for (k = 0; k < sv.length; k++) for (var d2 = 0; d2 < w.length; d2++) w[d2] += coef[k] * sv[k][d2];
      model.coef = w;
    }
    return model;
  }

  /* ---------------------------------------------------------------- CART tree (scikit-learn) */

  var EPS_D = 2.220446049250313e-16;
  var FEATURE_THRESHOLD = f32(1e-7);

  // DecisionTreeRegressor(criterion="squared_error", splitter="best",
  // max_features=None, random_state=seed). X is cast to float32 as scikit-learn
  // does. sw: optional integer sample weights (bootstrap counts).
  function fitTree(X, y, seed, sw) {
    var n = X.length, p = X[0].length, i, j;
    var Xf = X.map(function (r) { return Float32Array.from(r); });
    var st = { s: new RandomState(seed >>> 0).randint(0, RAND_R_MAX) };
    var w = sw || null;
    var samples = [];
    var wTotal = 0;
    for (i = 0; i < n; i++) { if (!w || w[i] !== 0) samples.push(i); wTotal += w ? w[i] : 1; }
    samples = Int32Array.from(samples);
    var features = new Int32Array(p), constantFeatures = new Int32Array(p);
    for (j = 0; j < p; j++) features[j] = j;
    var fv = new Float32Array(samples.length);
    var nodes = [];  // {left, right, feature, threshold, value, impurity, n, wn}
    function wt(s) { return w ? w[s] : 1; }

    function nodeStats(start, end) {
      var sum = 0, sq = 0, wn = 0;
      for (var q = start; q < end; q++) { var s = samples[q], ww = wt(s); wn += ww; sum += ww * y[s]; sq += ww * y[s] * y[s]; }
      return { sum: sum, sq: sq, wn: wn, impurity: sq / wn - (sum / wn) * (sum / wn) };
    }

    function sortNode(start, end, feat) {
      var m = end - start, arr = new Array(m), q;
      for (q = 0; q < m; q++) { var s = samples[start + q]; arr[q] = { s: s, v: Xf[s][feat] }; }
      arr.sort(function (a, b) { return a.v - b.v; });
      for (q = 0; q < m; q++) { samples[start + q] = arr[q].s; fv[start + q] = arr[q].v; }
    }

    function nodeSplit(start, end, stats, nKnownConstants) {
      var fi = p, nVisited = 0, nFound = 0, nDrawn = 0, nTotal = nKnownConstants;
      var best = { pos: end, feature: -1, threshold: 0 }, bestProxy = -Infinity;
      while (fi > nTotal && (nVisited < p || nVisited <= nFound + nDrawn)) {
        nVisited++;
        var fj = randInt(nDrawn, fi - nFound, st), tmp;
        if (fj < nKnownConstants) {
          tmp = features[nDrawn]; features[nDrawn] = features[fj]; features[fj] = tmp;
          nDrawn++;
          continue;
        }
        fj += nFound;
        var feat = features[fj];
        sortNode(start, end, feat);
        if (fv[end - 1] <= f32(fv[start] + FEATURE_THRESHOLD)) {
          tmp = features[fj]; features[fj] = features[nTotal]; features[nTotal] = tmp;
          nFound++; nTotal++;
          continue;
        }
        fi--;
        tmp = features[fi]; features[fi] = features[fj]; features[fj] = tmp;
        // scan split positions
        var sumL = 0, wL = 0, pos = start, prevPos, moved = start;
        while (pos < end) {
          // next_p
          pos++;
          while (pos < end && fv[pos] <= f32(fv[pos - 1] + FEATURE_THRESHOLD)) pos++;
          prevPos = pos - 1;
          if (pos === end) break;
          // move samples [moved, pos) into the left child (exact for integer
          // targets and integer weights, so the summation order does not matter)
          for (var q = moved; q < pos; q++) { var s = samples[q], ww = wt(s); wL += ww; sumL += ww * y[s]; }
          moved = pos;
          var wR = stats.wn - wL, sumR = stats.sum - sumL;
          var proxy = sumL * sumL / wL + sumR * sumR / wR;
          if (proxy > bestProxy) {
            bestProxy = proxy;
            best = { pos: pos, feature: feat, threshold: fv[prevPos] / 2.0 + fv[pos] / 2.0 };
          }
        }
      }
      if (best.pos < end) {
        // partition samples[start:end] on the best feature and threshold
        var left = [], right = [];
        for (var r = start; r < end; r++) { var sr = samples[r]; if (Xf[sr][best.feature] <= best.threshold) left.push(sr); else right.push(sr); }
        best.pos = start + left.length;
        for (r = 0; r < left.length; r++) samples[start + r] = left[r];
        for (r = 0; r < right.length; r++) samples[best.pos + r] = right[r];
        var sl = nodeStats(start, best.pos), srr = nodeStats(best.pos, end);
        best.impurityLeft = sl.impurity; best.impurityRight = srr.impurity;
        best.improvement = (stats.wn / wTotal) * (stats.impurity - (srr.wn / stats.wn) * srr.impurity - (sl.wn / stats.wn) * sl.impurity);
      }
      // constant-feature bookkeeping, as scikit-learn keeps it across nodes
      for (var c = 0; c < nKnownConstants; c++) features[c] = constantFeatures[c];
      for (c = 0; c < nFound; c++) constantFeatures[nKnownConstants + c] = features[nKnownConstants + c];
      best.nConstant = nTotal;
      return best;
    }

    var stack = [{ start: 0, end: samples.length, depth: 0, parent: -1, isLeft: false, impurity: Infinity, nConst: 0 }];
    var first = true;
    while (stack.length) {
      var rec = stack.pop();
      var stats = nodeStats(rec.start, rec.end);
      var nNode = rec.end - rec.start;
      var isLeaf = nNode < 2;
      var imp = first ? stats.impurity : rec.impurity;
      first = false;
      isLeaf = isLeaf || imp <= EPS_D;
      var sp = null;
      if (!isLeaf) {
        stats.impurity = imp;
        sp = nodeSplit(rec.start, rec.end, stats, rec.nConst);
        isLeaf = sp.pos >= rec.end || sp.improvement + EPS_D < 0;
      }
      var id = nodes.length;
      nodes.push({ left: -1, right: -1, feature: isLeaf ? -1 : sp.feature, threshold: isLeaf ? -2 : sp.threshold, value: stats.sum / stats.wn, impurity: imp, n: nNode, wn: stats.wn });
      if (rec.parent >= 0) { if (rec.isLeft) nodes[rec.parent].left = id; else nodes[rec.parent].right = id; }
      if (!isLeaf) {
        stack.push({ start: sp.pos, end: rec.end, depth: rec.depth + 1, parent: id, isLeft: false, impurity: sp.impurityRight, nConst: sp.nConstant });
        stack.push({ start: rec.start, end: sp.pos, depth: rec.depth + 1, parent: id, isLeft: true, impurity: sp.impurityLeft, nConst: sp.nConstant });
      }
    }
    // impurity-based feature importances
    var imps = zeros(p);
    nodes.forEach(function (nd) {
      if (nd.left < 0) return;
      var L = nodes[nd.left], R = nodes[nd.right];
      imps[nd.feature] += nd.wn * nd.impurity - L.wn * L.impurity - R.wn * R.impurity;
    });
    var tot = 0;
    for (j = 0; j < p; j++) { imps[j] /= nodes[0].wn; tot += imps[j]; }
    if (tot > 0) for (j = 0; j < p; j++) imps[j] /= tot;
    var depth = 0;
    (function walk(id, d) { if (d > depth) depth = d; var nd = nodes[id]; if (nd.left >= 0) { walk(nd.left, d + 1); walk(nd.right, d + 1); } })(0, 0);
    return {
      nodes: nodes, importances: imps, depth: depth,
      leaves: nodes.filter(function (nd) { return nd.left < 0; }).length,
      predictOne: function (x) {
        var id = 0;
        while (nodes[id].left >= 0) id = f32(x[nodes[id].feature]) <= nodes[id].threshold ? nodes[id].left : nodes[id].right;
        return nodes[id].value;
      },
      predict: function (Xt) { var self = this; return Float64Array.from(Xt.map(function (x) { return self.predictOne(x); })); }
    };
  }

  // RandomForestRegressor(n_estimators, max_features=1.0, bootstrap=True,
  // random_state). The 2018 scikit-learn default was 10 trees.
  function fitForest(X, y, nTrees, seed) {
    nTrees = nTrees || 10;
    var rs = new RandomState(seed >>> 0), n = X.length, trees = [], t;
    var seeds = [];
    for (t = 0; t < nTrees; t++) seeds.push(rs.randint(0, MAX_INT32));
    for (t = 0; t < nTrees; t++) {
      var br = new RandomState(seeds[t]), counts = new Float64Array(n);
      for (var q = 0; q < n; q++) counts[br.randint(0, n)] += 1;
      trees.push(fitTree(X, y, seeds[t], counts));
    }
    var p = X[0].length, imps = zeros(p), tot = 0, j;
    trees.forEach(function (tr) { for (j = 0; j < p; j++) imps[j] += tr.importances[j] / nTrees; });
    for (j = 0; j < p; j++) tot += imps[j];
    if (tot > 0) for (j = 0; j < p; j++) imps[j] /= tot;
    return {
      trees: trees, seeds: seeds, importances: imps,
      predict: function (Xt) {
        var out = zeros(Xt.length);
        trees.forEach(function (tr) { var pr = tr.predict(Xt); for (var k = 0; k < out.length; k++) out[k] += pr[k]; });
        for (var k = 0; k < out.length; k++) out[k] /= trees.length;
        return out;
      }
    };
  }

  /* ---------------------------------------------------------------- model zoo */

  var MODELS = [
    { id: "knn", label: "KNN", paper: "KNN" },
    { id: "ols", label: "Linear regression", paper: "Linear Regression" },
    { id: "lasso", label: "Lasso regression", paper: "Lasso Regression" },
    { id: "ridge", label: "Ridge regression", paper: "Ridge Regression" },
    { id: "svrlin", label: "SVR (linear kernel)", paper: "SVR (Linear Kernel)" },
    { id: "svrrbf", label: "SVR (RBF kernel)", paper: "SVR (RBF Kernel)" },
    { id: "tree", label: "Decision tree", paper: "Decision Tree" },
    { id: "forest", label: "Random forest", paper: "Random Forest" }
  ];

  // Page defaults. The paper tunes k, the lasso and ridge alphas, and the t-SNE
  // settings but does not print the chosen k or alphas; these are the page's.
  var DEFAULTS = { k: 5, lassoAlpha: 0.02, ridgeAlpha: 1, C: 1, epsilon: 0.1, trees: 10, seed: 0 };

  function fitModel(id, X, y, opt) {
    opt = Object.assign({}, DEFAULTS, opt || {});
    var g = 1 / X[0].length;   // gamma="auto" (the 2018 default): 1 / n_features
    switch (id) {
      case "knn": return fitKNN(X, y, opt.k);
      case "ols": return fitOLS(X, y);
      case "lasso": return fitLasso(X, y, opt.lassoAlpha);
      case "ridge": return fitRidge(X, y, opt.ridgeAlpha);
      case "svrlin": return fitSVR(X, y, { kernel: "linear", C: opt.C, epsilon: opt.epsilon });
      case "svrrbf": return fitSVR(X, y, { kernel: "rbf", gamma: g, C: opt.C, epsilon: opt.epsilon });
      case "tree": return fitTree(X, y, opt.seed);
      case "forest": return fitForest(X, y, opt.trees, opt.seed);
    }
    throw new Error("unknown model " + id);
  }

  // Recursive feature elimination, one feature per step, down to nKeep.
  // Ranks by |coef| for linear models and by importances for the forest.
  // Returns the elimination order and the kept features.
  function rfe(id, X, y, nKeep, opt, onStep) {
    var p = X[0].length, support = [], j, steps = [];
    for (j = 0; j < p; j++) support.push(j);
    while (support.length > nKeep) {
      var m = fitModel(id, cols(X, support), y, opt);
      var score = m.coef ? Array.from(m.coef, Math.abs) : Array.from(m.importances);
      var worst = 0;
      for (j = 1; j < score.length; j++) if (score[j] < score[worst]) worst = j;
      steps.push({ removed: support[worst], scores: score.slice(), support: support.slice() });
      support.splice(worst, 1);
      if (onStep) onStep(steps[steps.length - 1]);
    }
    // the final fit on the kept features, as RFE.estimator_
    var fm = fitModel(id, cols(X, support), y, opt);
    var fs = fm.coef ? Array.from(fm.coef, Math.abs) : Array.from(fm.importances);
    return { kept: support, steps: steps, final: { support: support.slice(), scores: fs } };
  }

  /* ================================================================ embeddings */

  // PCA to k components (covariance eigenvectors, sign fixed so the largest
  // absolute loading is positive, as scikit-learn's svd_flip does).
  function pca(X, k) {
    k = k || 2;
    var n = X.length, p = X[0].length, m = colMeans(X), i, j, a, S = [];
    for (i = 0; i < p; i++) S.push(zeros(p));
    for (a = 0; a < n; a++) {
      var r = X[a];
      for (i = 0; i < p; i++) { var di = r[i] - m[i]; for (j = i; j < p; j++) S[i][j] += di * (r[j] - m[j]); }
    }
    for (i = 0; i < p; i++) for (j = i; j < p; j++) { S[i][j] /= (n - 1); S[j][i] = S[i][j]; }
    var e = eigSym(S), comps = e.vectors.slice(0, k);
    comps = comps.map(function (v) {
      var big = 0; for (var q = 1; q < v.length; q++) if (Math.abs(v[q]) > Math.abs(v[big])) big = q;
      return v[big] < 0 ? v.map(function (x) { return -x; }) : v;
    });
    var total = e.values.reduce(function (s, v) { return s + v; }, 0);
    return {
      components: comps,
      explained: e.values.slice(0, k).map(function (v) { return v / total; }),
      Y: X.map(function (r) { return comps.map(function (v) { var s = 0; for (var q = 0; q < p; q++) s += (r[q] - m[q]) * v[q]; return s; }); })
    };
  }

  // Exact t-SNE with scikit-learn's schedule: squared Euclidean input distances
  // in float32, perplexity binary search (100 steps, tolerance 1e-5), symmetric
  // P, 250 iterations at early exaggeration 12 and momentum 0.5, then momentum
  // 0.8 up to nIter, gains with minimum 0.01, progress checks every 50
  // iterations. init: n x 2 array. onProgress(it, Y) is called every 50.
  function tsneP(X, perplexity) {
    var n = X.length, i, j;
    var D = new Float32Array(n * n);
    for (i = 0; i < n; i++) for (j = i + 1; j < n; j++) { var d = f32(sqdist(X[i], X[j])); D[i * n + j] = d; D[j * n + i] = d; }
    var Pc = zeros(n * n), desired = Math.log(f32(perplexity)), TOL = f32(1e-5), EPSD = f32(1e-8);
    for (i = 0; i < n; i++) {
      var beta = 1, bmin = -Infinity, bmax = Infinity, off = i * n;
      for (var step = 0; step < 100; step++) {
        var sumP = 0;
        for (j = 0; j < n; j++) if (j !== i) { Pc[off + j] = Math.exp(-D[off + j] * beta); sumP += Pc[off + j]; }
        if (sumP === 0) sumP = EPSD;
        var sumDP = 0;
        for (j = 0; j < n; j++) { Pc[off + j] /= sumP; sumDP += D[off + j] * Pc[off + j]; }
        var H = Math.log(sumP) + beta * sumDP, diff = H - desired;
        if (Math.abs(diff) <= TOL) break;
        if (diff > 0) { bmin = beta; beta = bmax === Infinity ? beta * 2 : (beta + bmax) / 2; }
        else { bmax = beta; beta = bmin === -Infinity ? beta / 2 : (beta + bmin) / 2; }
      }
    }
    // condensed symmetric P / sum, floored at machine epsilon
    var m = n * (n - 1) / 2, P = zeros(m), s = 0, q = 0;
    for (i = 0; i < n; i++) for (j = i + 1; j < n; j++) { P[q] = Pc[i * n + j] + Pc[j * n + i]; s += P[q]; q++; }
    s = Math.max(2 * s, EPS_D);          // the full symmetric matrix sums to 2s
    for (q = 0; q < m; q++) P[q] = Math.max(P[q] / s, EPS_D);
    return P;
  }

  function tsne(X, opt, onProgress) {
    opt = opt || {};
    var perplexity = opt.perplexity || 30, lr = opt.learningRate || 200, nIter = opt.nIter || 1000;
    var n = X.length, i, j, q;
    var P = opt.P || tsneP(X, perplexity), m = P.length;
    var Y = zeros(2 * n);
    if (opt.init) for (i = 0; i < n; i++) { Y[2 * i] = opt.init[i][0]; Y[2 * i + 1] = opt.init[i][1]; }
    else { var r = mulberry(opt.seed || 1); for (i = 0; i < 2 * n; i++) Y[i] = 1e-4 * gaussFrom(r); }
    var Q = zeros(m), num = zeros(m), grad = zeros(2 * n), update = zeros(2 * n), gains = zeros(2 * n).fill(1);
    var exag = 12;
    function objective(computeError) {
      var sumNum = 0;
      q = 0;
      for (i = 0; i < n; i++) {
        var yi0 = Y[2 * i], yi1 = Y[2 * i + 1];
        for (j = i + 1; j < n; j++) {
          var d0 = yi0 - Y[2 * j], d1 = yi1 - Y[2 * j + 1];
          var v = 1 / (1 + (d0 * d0 + d1 * d1));
          num[q] = v; sumNum += v; q++;
        }
      }
      var kl = 0, denom = 2 * sumNum;
      for (q = 0; q < m; q++) {
        Q[q] = Math.max(num[q] / denom, EPS_D);
        if (computeError) kl += P[q] * exag * Math.log(Math.max(P[q] * exag, EPS_D) / Q[q]);
      }
      grad.fill(0);
      q = 0;
      for (i = 0; i < n; i++) {
        for (j = i + 1; j < n; j++) {
          var w = (P[q] * exag - Q[q]) * num[q];
          var e0 = (Y[2 * i] - Y[2 * j]) * w, e1 = (Y[2 * i + 1] - Y[2 * j + 1]) * w;
          grad[2 * i] += e0; grad[2 * i + 1] += e1;
          grad[2 * j] -= e0; grad[2 * j + 1] -= e1;
          q++;
        }
      }
      for (i = 0; i < 2 * n; i++) grad[i] *= 4;
      return 2 * kl;
    }
    function descend(it0, itEnd, momentum, nWithout) {
      var best = Infinity, bestIt = it0, it = it0, err = Infinity;
      if (it0 >= itEnd) return { it: it0, err: null, empty: true };
      for (it = it0; it < itEnd; it++) {
        if (opt.stopAt != null && it >= opt.stopAt) break;
        var check = (it + 1) % 50 === 0;
        err = objective(check || it === itEnd - 1);
        for (i = 0; i < 2 * n; i++) {
          if (update[i] * grad[i] < 0) gains[i] += 0.2; else gains[i] *= 0.8;
          if (gains[i] < 0.01) gains[i] = 0.01;
          grad[i] *= gains[i];
          update[i] = momentum * update[i] - lr * grad[i];
          Y[i] += update[i];
        }
        if (check) {
          var gn = 0; for (i = 0; i < 2 * n; i++) gn += grad[i] * grad[i];
          gn = Math.sqrt(gn);
          if (onProgress) onProgress(it + 1, Y, err);
          if (err < best) { best = err; bestIt = it; }
          else if (it - bestIt > nWithout) break;
          if (gn <= 1e-7) break;
        }
      }
      return { it: it >= itEnd ? itEnd - 1 : it, err: err };
    }
    var r1 = descend(0, 250, 0.5, 250);
    exag = 1;
    var last = r1;
    if (r1.it < 250 || nIter - 250 > 0) {
      var r2 = descend(r1.it + 1, nIter, 0.8, 300);
      last = r2.empty ? { it: r2.it, err: r1.err } : r2;
    }
    // the kl reported for the second stage uses exag = 1 already
    var out = [];
    for (i = 0; i < n; i++) out.push([Y[2 * i], Y[2 * i + 1]]);
    return { Y: out, kl: last.err, nIter: last.it, exaggeratedOnly: nIter <= 250 };
  }

  // Lloyd's k-means from given centers (as scikit-learn's "lloyd" algorithm).
  function lloyd(X, centers, maxIter, tol) {
    maxIter = maxIter || 300; tol = tol == null ? 1e-4 : tol;
    var n = X.length, p = X[0].length, k = centers.length, labels = new Int32Array(n), it, i, c, j;
    // scikit-learn scales tol by the mean feature variance
    var mu = colMeans(X), v = 0;
    for (i = 0; i < n; i++) for (j = 0; j < p; j++) v += (X[i][j] - mu[j]) * (X[i][j] - mu[j]);
    var tolAbs = tol * v / (n * p);
    var C = centers.map(function (r) { return Float64Array.from(r); });
    function assign() {
      var inertia = 0;
      for (i = 0; i < n; i++) {
        var best = 0, bd = Infinity;
        for (c = 0; c < k; c++) { var d = sqdist(X[i], C[c]); if (d < bd) { bd = d; best = c; } }
        labels[i] = best; inertia += bd;
      }
      return inertia;
    }
    var strict = false;
    for (it = 0; it < maxIter; it++) {
      var old = labels.slice();
      assign();
      var NC = [], cnt = new Int32Array(k);
      for (c = 0; c < k; c++) NC.push(zeros(p));
      for (i = 0; i < n; i++) { cnt[labels[i]]++; for (j = 0; j < p; j++) NC[labels[i]][j] += X[i][j]; }
      var shift = 0;
      for (c = 0; c < k; c++) {
        if (cnt[c] === 0) { NC[c] = C[c]; continue; }
        for (j = 0; j < p; j++) NC[c][j] /= cnt[c];
        shift += sqdist(NC[c], C[c]);
      }
      C = NC;
      var same = it > 0;
      for (i = 0; i < n && same; i++) if (labels[i] !== old[i]) same = false;
      if (same) { strict = true; break; }
      if (shift <= tolAbs) break;
    }
    var inertia = assign();
    return { labels: labels, centers: C, inertia: inertia, nIter: it + 1, strict: strict };
  }

  // k-means++ seeding (greedy, 2 + floor(ln k) local trials) and the best of
  // nInit runs; the page's own random numbers, so labels can differ from a
  // scikit-learn run with the same seed.
  function kmeans(X, k, seed, nInit) {
    nInit = nInit || 10;
    var r = mulberry(seed || 1), best = null, n = X.length;
    for (var run = 0; run < nInit; run++) {
      var centers = [X[Math.floor(r() * n)]], d2 = X.map(function (x) { return sqdist(x, centers[0]); });
      var trials = 2 + Math.floor(Math.log(k));
      while (centers.length < k) {
        var pot = d2.reduce(function (s, v) { return s + v; }, 0), bestC = null, bestPot = Infinity, bestD = null;
        for (var t = 0; t < trials; t++) {
          var u = r() * pot, acc = 0, pick = n - 1;
          for (var i = 0; i < n; i++) { acc += d2[i]; if (acc >= u) { pick = i; break; } }
          var nd = d2.map(function (v, ii) { return Math.min(v, sqdist(X[ii], X[pick])); });
          var np_ = nd.reduce(function (s, v) { return s + v; }, 0);
          if (np_ < bestPot) { bestPot = np_; bestC = X[pick]; bestD = nd; }
        }
        centers.push(bestC); d2 = bestD;
      }
      var res = lloyd(X, centers);
      if (!best || res.inertia < best.inertia) best = res;
    }
    return best;
  }

  // Mean silhouette coefficient (Euclidean).
  function silhouette(X, labels) {
    var n = X.length, k = 0, i, j;
    for (i = 0; i < n; i++) if (labels[i] + 1 > k) k = labels[i] + 1;
    var size = new Int32Array(k);
    for (i = 0; i < n; i++) size[labels[i]]++;
    var total = 0, sums = zeros(k);
    for (i = 0; i < n; i++) {
      sums.fill(0);
      for (j = 0; j < n; j++) if (j !== i) sums[labels[j]] += Math.sqrt(sqdist(X[i], X[j]));
      var li = labels[i];
      if (size[li] <= 1) continue;   // silhouette 0 for singleton clusters
      var a = sums[li] / (size[li] - 1), b = Infinity;
      for (var c = 0; c < k; c++) if (c !== li && size[c] > 0) b = Math.min(b, sums[c] / size[c]);
      total += (b - a) / Math.max(a, b);
    }
    return total / n;
  }

  /* ================================================================ simulated cashiers */

  // The paper's ten regions (about 100 cashiers each, 991 in all) and the five
  // features it names. The other 23 features are numbered, not named.
  var REGIONS = ["Denver", "Eastern", "Houston", "Inter-mountain", "Northern California", "Portland", "Seattle", "Southern California", "Southern", "Southwest"];
  var REGION_SIZES = [100, 98, 101, 99, 97, 102, 100, 96, 99, 99];
  var NAMED = ["Number of Sales Per Day", "Department Sales Item Count", "Department Sales Total Amount", "Department Refunds Item Count", "Number of Item Voids"];
  var FEATURE_NAMES = NAMED.slice();
  for (var fn = 6; fn <= 28; fn++) FEATURE_NAMES.push("Feature " + fn);
  var SHORT_NAMES = ["Sales/day", "Dept items", "Dept total", "Refund items", "Item voids"];
  for (fn = 6; fn <= 28; fn++) SHORT_NAMES.push("F" + fn);

  // A simulated cashier table with the paper's shape: 991 rows, 28 features,
  // and an integer risk factor from 4 to 16. Activity (a) drives volumes,
  // a hidden habit (h) drives refunds and voids, and risk rises with voids and
  // refunds relative to volume, with a nonlinear bump and noise. Simulated, not data.
  function simulate(seed) {
    var r = mulberry(seed == null ? 2018 : seed), g = function () { return gaussFrom(r); };
    var X = [], y = [], region = [];
    var regionShift = REGIONS.map(function () { return 0.35 * g(); });
    // loadings of the 23 unnamed features on (a, h, region, noise)
    var load = [];
    for (var f = 0; f < 23; f++) load.push([0.9 * g(), 0.7 * g(), 0.5 * g(), 0.4 + 0.8 * r()]);
    for (var reg = 0; reg < REGIONS.length; reg++) {
      for (var c = 0; c < REGION_SIZES[reg]; c++) {
        var a = g(), h = g(), z = g();
        var sales = Math.max(5, 60 * Math.exp(0.35 * a + 0.1 * regionShift[reg] + 0.15 * g()));
        var items = Math.max(10, sales * (3.2 * Math.exp(0.2 * g())));
        var total = items * (6.5 * Math.exp(0.15 * g() + 0.2 * regionShift[reg]));
        var refunds = Math.max(0, Math.round(items * 0.012 * Math.exp(0.55 * h + 0.25 * g())));
        var voids = Math.max(0, Math.round(sales * 0.05 * Math.exp(0.6 * h + 0.3 * z + 0.25 * g())));
        var row = [sales, items, total, refunds, voids];
        for (f = 0; f < 23; f++) {
          var L = load[f];
          row.push(L[0] * a + L[1] * (f % 3 === 0 ? h * h - 1 : h) + L[2] * regionShift[reg] + L[3] * g());
        }
        var voidRate = voids / sales, refundRate = refunds / items;
        var latent = 2.4 * Math.tanh(1.1 * h) + 6 * (voidRate - 0.05) + 40 * (refundRate - 0.012) + 0.9 * Math.exp(-0.5 * (a - 1.2) * (a - 1.2) / 0.3) + 0.6 * regionShift[reg] + 0.55 * g() * (r() < 0.08 ? 3.5 : 1);
        var risk = Math.min(16, Math.max(4, Math.round(9.3 + 0.66 * latent)));
        X.push(row); y.push(risk); region.push(reg);
      }
    }
    return { X: X, y: Float64Array.from(y), region: region, names: FEATURE_NAMES, short: SHORT_NAMES, simulated: true, seed: seed == null ? 2018 : seed };
  }

  /* ================================================================ the paper's tables */

  // Table 1: MAE, MSE, and R^2 on the test set.
  var TABLE1 = [
    { id: "knn", mae: 0.8455, mse: 1.173, r2: 0.458 },
    { id: "ols", mae: 0.8407, mse: 1.68, r2: 0.2239 },
    { id: "lasso", mae: 0.8567, mse: 1.26, r2: 0.4178 },
    { id: "ridge", mae: 0.8218, mse: 1.462, r2: 0.3243 },
    { id: "svrlin", mae: 0.8239, mse: 1.78, r2: 0.1776 },
    { id: "svrrbf", mae: 0.6816, mse: 0.7948, r2: 0.6328 },
    { id: "tree", mae: 0.9744, mse: 1.68, r2: 0.2239 },
    { id: "forest", mae: 0.7398, mse: 0.9143, r2: 0.5776 }
  ];
  // Table 2: silhouette score of each two-dimensional view.
  var TABLE2 = [
    { id: "rfe-ols", label: "Top 2 RFE features, linear regression", s: 0.06615 },
    { id: "rfe-svr", label: "Top 2 RFE features, SVR", s: 0.12499 },
    { id: "rfe-forest", label: "Top 2 RFE features, random forest", s: 0.12209 },
    { id: "pca", label: "Principal component analysis", s: 0.06615 },
    { id: "tsne-5-10-250", label: "t-SNE, perplexity 5, learning rate 10, 250 iterations", s: 0.14943, perplexity: 5, learningRate: 10, nIter: 250 },
    { id: "tsne-30-10-1000", label: "t-SNE, perplexity 30, learning rate 10, 1,000 iterations", s: 0.13992, perplexity: 30, learningRate: 10, nIter: 1000 },
    { id: "tsne-30-1000-500", label: "t-SNE, perplexity 30, learning rate 1,000, 500 iterations", s: 0.13929, perplexity: 30, learningRate: 1000, nIter: 500 }
  ];

  // Every Table 1 row fixes the test-set variance through R^2 = 1 - MSE / Var:
  // Var = MSE / (1 - R^2). Also bounds that variance from each row's rounding.
  function impliedVariance(row) {
    var v = row.mse / (1 - row.r2);
    var dm = decimalsHalfUlp(row.mse), dr = decimalsHalfUlp(row.r2);
    var lo = (row.mse - dm) / (1 - (row.r2 - dr)), hi = (row.mse + dm) / (1 - (row.r2 + dr));
    return { v: v, lo: lo, hi: hi };
  }
  function decimalsHalfUlp(x) {
    var s = String(x), dot = s.indexOf(".");
    var d = dot < 0 ? 0 : s.length - dot - 1;
    return 0.5 * Math.pow(10, -d);
  }

  root.Liability = {
    mulberry: mulberry, gaussFrom: gaussFrom, RandomState: RandomState, randR: randR,
    standardize: standardize, split: split, take: take, cols: cols, metrics: metrics,
    fitKNN: fitKNN, fitOLS: fitOLS, fitRidge: fitRidge, fitLasso: fitLasso, fitSVR: fitSVR,
    fitTree: fitTree, fitForest: fitForest, fitModel: fitModel, rfe: rfe,
    pca: pca, tsne: tsne, tsneP: tsneP, lloyd: lloyd, kmeans: kmeans, silhouette: silhouette,
    simulate: simulate, MODELS: MODELS, DEFAULTS: DEFAULTS,
    REGIONS: REGIONS, REGION_SIZES: REGION_SIZES, FEATURE_NAMES: FEATURE_NAMES, SHORT_NAMES: SHORT_NAMES, NAMED: NAMED,
    TABLE1: TABLE1, TABLE2: TABLE2, impliedVariance: impliedVariance
  };
})(typeof self !== "undefined" ? self : this);

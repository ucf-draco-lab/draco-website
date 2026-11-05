/*
  URL feature engine for /papers/malicious-url-features/.

  Browser port of the lexical feature extractor in Shah, Garu, Nguyen, and
  Borowczak, "Feature Selection Framework for Optimizing ML-based Malicious URL
  Detection" (IEEE CARS 2024), following the authors' repository
  (github.com/cybw90/MDND, commit 0af1167, Feature_Exctraction.py) line by line,
  including Python's urllib.parse.urlparse (3.11 rules) for the host and path.

  Adapted from MDND (Feature_Exctraction.py):
    MIT License
    Copyright (c) 2026 Sajjad H. Shah
    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:
    The above copyright notice and this permission notice shall be included in all
    copies or substantial portions of the Software.
    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE.

  The English-word features call pyenchant's en_US dictionary in the original.
  Here the check uses en-us-words.txt (every affixed form of the hunspell en_US
  dictionary, SCOWL; see SCOWL-LICENSE.txt) with hunspell's capitalization
  rules. It agrees with pyenchant on 433,524 of 433,526 test words.

  Also: entropy and information gain (paper Eqs. 2 and 3), and the memory model
  fitted to the authors' Classifier_gv4_w_mem.py run on data of the paper's shape.
  Loads as a page script or in a Web Worker.
*/
(function (root) {
  "use strict";

  // Column order of the authors' Extracted_Features.csv (55 features after URLs, Type, Label).
  var COLUMNS = ["ip_DNS", "url_len", "Dots Count", "Dots_domain", "hyphen_domain", "Count_&",
    "First Dir Len", "TLD", "Count_;", "Count_http", "alphabets_url", "lower_case_letter",
    "upper_case_letter", "avg_english_words",
    "Count_a", "Count_b", "Count_c", "Count_d", "Count_e", "Count_f", "Count_g", "Count_h",
    "Count_i", "Count_j", "Count_k", "Count_l", "Count_m", "Count_o", "Count_p", "Count_q",
    "Count_r", "Count_s", "Count_t", "Count_u", "Count_v", "Count_w", "Count_x", "Count_y",
    "Count_z", "Count_0", "Count_1", "Count_2", "Count_3", "Count_4", "Count_5", "Count_6",
    "Count_7", "Count_8", "Count_9", "Count_www", "Count_equal", "Count_underscore",
    "Count_at", "Count_dollar", "Count_percent"];

  // ---------- Python string helpers ----------
  function cps(s) { return Array.from(s); }              // code points, like a Python str
  function plen(s) { return cps(s).length; }
  function pcount(s, sub) {                              // str.count, non-overlapping
    if (sub === "") return plen(s) + 1;
    var n = 0, i = 0;
    while ((i = s.indexOf(sub, i)) !== -1) { n++; i += sub.length; }
    return n;
  }
  var RE_DIGIT = /^[\p{Nd}²³¹⁰⁴-⁹₀-₉①-⑨⑴-⑼⒈-⒐⓪⓵-⓽⓿❶-❾➀-➈➊-➒፩-፱᧚\u{10A40}-\u{10A43}\u{10E60}-\u{10E68}\u{1F100}-\u{1F10A}]$/u;
  var RE_ALPHA = /^\p{L}$/u;
  var RE_LOWER = /^\p{Lowercase}$/u;
  var RE_UPPER = /^\p{Uppercase}$/u;

  // ---------- urllib.parse.urlparse (Python 3.11) ----------
  var SCHEME_CHARS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+-.";
  var USES_PARAMS = ["", "ftp", "hdl", "prospero", "http", "imap", "https", "shttp", "rtsp",
    "rtspu", "sip", "sips", "mms", "sftp", "tel"];
  function lstripC0(s) { var i = 0; while (i < s.length && s.charCodeAt(i) <= 32) i++; return s.slice(i); }

  function urlparse(url) {
    url = lstripC0(url).replace(/[\t\r\n]/g, "");
    var scheme = "", netloc = "", query = "", fragment = "", params = "";
    var i = url.indexOf(":");
    if (i > 0 && /^[A-Za-z]/.test(url[0])) {
      var ok = true;
      for (var k = 0; k < i; k++) if (SCHEME_CHARS.indexOf(url[k]) < 0) { ok = false; break; }
      if (ok) { scheme = url.slice(0, i).toLowerCase(); url = url.slice(i + 1); }
    }
    if (url.slice(0, 2) === "//") {
      var delim = url.length;
      "/?#".split("").forEach(function (c) { var w = url.indexOf(c, 2); if (w >= 0) delim = Math.min(delim, w); });
      netloc = url.slice(2, delim); url = url.slice(delim);
      if ((netloc.indexOf("[") >= 0) !== (netloc.indexOf("]") >= 0)) throw new Error("Invalid IPv6 URL");
      if (netloc.indexOf("[") >= 0 && netloc.indexOf("]") >= 0) checkBracketedNetloc(netloc);
    }
    var h = url.indexOf("#");
    if (h >= 0) { fragment = url.slice(h + 1); url = url.slice(0, h); }
    var q = url.indexOf("?");
    if (q >= 0) { query = url.slice(q + 1); url = url.slice(0, q); }
    if (USES_PARAMS.indexOf(scheme) >= 0 && url.indexOf(";") >= 0) {
      var j;
      if (url.indexOf("/") >= 0) {
        j = url.indexOf(";", url.lastIndexOf("/"));
        if (j >= 0) { params = url.slice(j + 1); url = url.slice(0, j); }
      } else { j = url.indexOf(";"); params = url.slice(j + 1); url = url.slice(0, j); }
    }
    checkNetloc(netloc);
    return { scheme: scheme, netloc: netloc, path: url, params: params, query: query, fragment: fragment };
  }
  // Python's _check_bracketed_netloc, _check_bracketed_host, and _checknetloc (3.11.4 and later).
  function partition(s, sep) { var i = s.indexOf(sep); return i < 0 ? [s, "", ""] : [s.slice(0, i), sep, s.slice(i + sep.length)]; }
  function checkBracketedNetloc(netloc) {
    var hp = netloc.slice(netloc.lastIndexOf("@") + 1), hostname;
    var t = partition(hp, "[");
    if (t[1]) {
      if (t[0]) throw new Error("Invalid IPv6 URL");
      var u = partition(t[2], "]");
      hostname = u[0];
      if (u[2] && u[2][0] !== ":") throw new Error("Invalid IPv6 URL");
    } else hostname = partition(hp, ":")[0];
    if (hostname[0] === "v") {
      if (!/^v[a-fA-F0-9]+\.[\s\S]+$/.test(hostname)) throw new Error("IPvFuture address is invalid");
    } else {
      if (validIPv4(hostname)) throw new Error("An IPv4 address cannot be in brackets");
      var sc = partition(hostname, "%");
      if (!validIPv6(sc[0]) || (sc[1] && (!sc[2] || sc[2].indexOf("%") >= 0))) throw new Error("does not appear to be an IPv4 or IPv6 address");
    }
  }
  function checkNetloc(netloc) {
    if (!netloc || /^[\x00-\x7f]*$/.test(netloc)) return;
    var n = netloc.replace(/[@:#?]/g, ""), n2 = n.normalize("NFKC");
    if (n === n2) return;
    if (/[\/?#@:]/.test(n2)) throw new Error("netloc contains invalid characters under NFKC normalization");
  }
  function validIPv4(a) {
    var o = a.split(".");
    return o.length === 4 && o.every(function (t) { return /^[0-9]{1,3}$/.test(t) && +t <= 255 && !(t.length > 1 && t[0] === "0"); });
  }
  function validIPv6(a) {
    if (!/^[0-9A-Fa-f:.]+$/.test(a)) return false;
    var parts = a.split("::");
    if (parts.length > 2) return false;
    function groups(s) { return s === "" ? [] : s.split(":"); }
    var g = groups(parts[0]).concat(parts.length === 2 ? groups(parts[1]) : []);
    var n = 0;
    for (var i = 0; i < g.length; i++) {
      var x = g[i];
      if (i === g.length - 1 && x.indexOf(".") >= 0) {
        var o = x.split(".");
        if (!validIPv4(x)) return false;
        n += 2;
      } else { if (!/^[0-9A-Fa-f]{1,4}$/.test(x)) return false; n += 1; }
    }
    return parts.length === 2 ? n <= 7 : n === 8;
  }

  // ---------- en_US word check (hunspell capitalization rules) ----------
  var WORDS = null, UPPER = null;
  function loadWords(text) {
    WORDS = new Set(); UPPER = new Set();
    text.split("\n").forEach(function (w) {
      if (!w || w[0] === "#") return;
      WORDS.add(w); UPPER.add(w.toUpperCase());
    });
  }
  function isWord(w) {
    if (!WORDS) return null;
    if (WORDS.has(w)) return true;
    if (w === w.toUpperCase()) return UPPER.has(w);
    if (w[0] === w[0].toUpperCase() && w.slice(1) === w.slice(1).toLowerCase()) return WORDS.has(w.toLowerCase());
    return false;
  }
  function englishWords(url) {
    return url.replace(/[^a-zA-Z]/g, " ").split(" ").filter(Boolean).filter(function (w) { return isWord(w); });
  }

  // ---------- the authors' 55 features ----------
  var IP_RE = /^(?:(?:[0-9A-Fa-f]{1,4}:){7}[0-9A-Fa-f]{1,4}|(?:\p{Nd}{1,3}\.){3}\p{Nd}{1,3})/u;

  function extract(url) {
    var p = urlparse(url);       // may throw, as Python's does
    var f = {};
    f["ip_DNS"] = IP_RE.test(p.netloc) ? 1 : 0;
    f["url_len"] = plen(url);
    f["Dots Count"] = pcount(p.netloc, ".");        // dot_url: the code counts the host's dots
    f["Dots_domain"] = pcount(p.netloc, ".");
    f["hyphen_domain"] = pcount(p.netloc, "-");
    f["Count_&"] = pcount(url, "&");
    f["First Dir Len"] = plen(p.path);
    var labels = p.netloc.split(".");
    f["TLD"] = labels.length > 1 ? plen(labels[labels.length - 1]) : 0;
    f["Count_;"] = pcount(url, ";");
    f["Count_http"] = pcount(url, "http");
    var letter = 0, lower = 0, upper = 0;
    cps(url).forEach(function (ch) {
      if (RE_DIGIT.test(ch)) return;
      if (RE_ALPHA.test(ch)) {
        letter++;
        if (RE_LOWER.test(ch)) lower++; else if (RE_UPPER.test(ch)) upper++;
      }
    });
    f["alphabets_url"] = letter; f["lower_case_letter"] = lower; f["upper_case_letter"] = upper;
    var ew = WORDS ? englishWords(url) : null;
    f["avg_english_words"] = ew === null ? null : (ew.length ? ew.reduce(function (s, w) { return s + w.length; }, 0) / ew.length : 0);
    "abcdefghijklmopqrstuvwxyz".split("").forEach(function (c) { f["Count_" + c] = pcount(url, c); });
    "0123456789".split("").forEach(function (c) { f["Count_" + c] = pcount(url, c); });
    f["Count_www"] = pcount(url, "www");
    f["Count_equal"] = pcount(url, "=");
    f["Count_underscore"] = pcount(url, "_");
    f["Count_at"] = pcount(url, "@");
    f["Count_dollar"] = pcount(url, "$");
    f["Count_percent"] = pcount(url, "%");
    // Computed by the script but not written to its CSV:
    var extra = {
      english_words_count: ew === null ? null : ew.length,
      english_words: ew,
      count_https: pcount(url, "https"),
      count_n: pcount(url, "n"),
      scheme_http: pcount(p.scheme, "http"),
      parsed: p
    };
    return { features: f, extra: extra };
  }

  // ---------- information gain (paper Eqs. 2 and 3) ----------
  function entropy(pos, neg) {
    var n = pos + neg; if (!n) return 0;
    var h = 0;
    [pos, neg].forEach(function (c) { if (c > 0) { var p = c / n; h -= p * Math.log2(p); } });
    return h;
  }
  // groups: [[pos, neg], ...] for each value of attribute A
  function infoGain(groups) {
    var P = 0, N = 0;
    groups.forEach(function (g) { P += g[0]; N += g[1]; });
    var n = P + N, rem = 0;
    groups.forEach(function (g) { var m = g[0] + g[1]; if (m) rem += (m / n) * entropy(g[0], g[1]); });
    return { parent: entropy(P, N), remainder: rem, gain: entropy(P, N) - rem };
  }

  // ---------- memory model ----------
  // Peak tracemalloc readings (MiB) of the authors' Classifier_gv4_w_mem.py, run unchanged on
  // synthetic data with 109,998 rows (76,998 train), set by mem-data.json; see widget.
  function knnAlgorithm(nFeatures) { return nFeatures > 15 ? "brute" : "kd_tree"; } // scikit-learn's "auto" for dense data

  root.URLEngine = {
    COLUMNS: COLUMNS, urlparse: urlparse, extract: extract, loadWords: loadWords,
    isWord: isWord, englishWords: englishWords, entropy: entropy, infoGain: infoGain,
    knnAlgorithm: knnAlgorithm, wordsLoaded: function () { return !!WORDS; }
  };
})(typeof self !== "undefined" ? self : this);

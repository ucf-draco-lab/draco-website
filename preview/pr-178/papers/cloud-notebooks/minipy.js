/*
  MiniPy: a small Python subset for the notebook demo on /papers/cloud-notebooks/.

  The page's notebook needs to run the kind of first programs a teacher writes in a
  Jupyter notebook (loops, conditionals, variables, lists, print) with no server and
  no download. MiniPy implements that subset of Python 3 semantics directly:

    statements   assignment (including a, b = b, a and x[i] = v), +=  -=  *=  /=  //=  %=,
                 if / elif / else, while, for ... in ..., break, continue, pass,
                 def / return (positional parameters)
    expressions  int (arbitrary precision), float, str, bool, None, list, tuple,
                 + - * / // % ** with Python's rules for int, float, and str,
                 comparisons (chained), and / or / not, in / not in, indexing, slicing,
                 calls, methods append, pop, insert, upper, lower, join, split, replace
    built-ins    print (sep=, end=), range, len, str, int, float, abs, min, max, sum,
                 list, round, type
    errors       NameError, TypeError, ZeroDivisionError, IndexError, ValueError,
                 SyntaxError, and IndentationError, reported on Python's last line

  A Kernel keeps variables between cells, the way a notebook kernel does, and a cell
  whose last line is an expression shows its value as Out[n]. Every program in
  minipy-tests.json produces the same output under MiniPy and under CPython 3.13
  (checked by tests/check-minipy.js). Runs stop after a step budget so an endless
  loop cannot freeze the page.

  Loads as a page script or in a Web Worker (window.MiniPy / self.MiniPy) and as a
  Node module.
*/
(function (root) {
  "use strict";

  /* ------------------------------------------------------------ errors */

  function PyError(type, msg, line) { this.type = type; this.msg = msg; this.line = line; }
  PyError.prototype.toString = function () { return this.type + ": " + this.msg; };
  function err(type, msg, line) { return new PyError(type, msg, line); }

  function BreakSignal() {}
  function ContinueSignal() {}
  function ReturnSignal(v) { this.value = v; }

  /* ------------------------------------------------------------ values */

  var None = { __none: true };
  function PyTuple(items) { this.items = items; }
  function PyFunc(name, params, body, kernel) { this.name = name; this.params = params; this.body = body; this.kernel = kernel; }
  function Builtin(name, fn) { this.name = name; this.fn = fn; }
  function BoundMethod(self, name, fn) { this.self = self; this.name = name; this.fn = fn; }
  function PyRange(start, stop, step) { this.start = start; this.stop = stop; this.step = step; }

  function isInt(v) { return typeof v === "bigint"; }
  function isFloat(v) { return typeof v === "number"; }
  function isBool(v) { return typeof v === "boolean"; }
  function isStr(v) { return typeof v === "string"; }
  function isList(v) { return Array.isArray(v); }
  function isTuple(v) { return v instanceof PyTuple; }
  function isNum(v) { return isInt(v) || isFloat(v) || isBool(v); }

  function typeName(v) {
    if (v === None) return "NoneType";
    if (isBool(v)) return "bool";
    if (isInt(v)) return "int";
    if (isFloat(v)) return "float";
    if (isStr(v)) return "str";
    if (isList(v)) return "list";
    if (isTuple(v)) return "tuple";
    if (v instanceof PyRange) return "range";
    if (v instanceof PyFunc) return "function";
    if (v instanceof Builtin) return "builtin_function_or_method";
    if (v instanceof BoundMethod) return "builtin_function_or_method";
    return "object";
  }
  function asBig(v) { return isBool(v) ? (v ? 1n : 0n) : v; }
  function asFloat(v) { return isInt(v) ? Number(v) : isBool(v) ? (v ? 1 : 0) : v; }

  function truthy(v) {
    if (v === None) return false;
    if (isBool(v)) return v;
    if (isInt(v)) return v !== 0n;
    if (isFloat(v)) return v !== 0;
    if (isStr(v)) return v.length > 0;
    if (isList(v)) return v.length > 0;
    if (isTuple(v)) return v.items.length > 0;
    if (v instanceof PyRange) return rangeLen(v) > 0n;
    return true;
  }

  // Python's float repr: shortest round-trip digits, fixed notation for
  // exponents from -4 to 15, scientific otherwise.
  function floatRepr(x) {
    if (x !== x) return "nan";
    if (x === Infinity) return "inf";
    if (x === -Infinity) return "-inf";
    if (x === 0) return (1 / x < 0) ? "-0.0" : "0.0";
    var s = x.toExponential();               // shortest digits
    var m = /^(-?)(\d)(?:\.(\d+))?e([+-]\d+)$/.exec(s);
    var sign = m[1], digits = m[2] + (m[3] || ""), exp = parseInt(m[4], 10);
    if (exp >= -4 && exp < 16) {
      var out;
      if (exp >= 0) {
        if (digits.length <= exp + 1) out = digits + "0".repeat(exp + 1 - digits.length) + ".0";
        else out = digits.slice(0, exp + 1) + "." + digits.slice(exp + 1);
      } else {
        out = "0." + "0".repeat(-exp - 1) + digits;
      }
      return sign + out;
    }
    var mant = digits.length > 1 ? digits[0] + "." + digits.slice(1) : digits;
    var e = Math.abs(exp), es = (e < 10 ? "0" : "") + e;
    return sign + mant + "e" + (exp < 0 ? "-" : "+") + es;
  }

  function strRepr(s) {
    var q = (s.indexOf("'") >= 0 && s.indexOf('"') < 0) ? '"' : "'";
    var out = q;
    for (var i = 0; i < s.length; i++) {
      var c = s[i], code = s.charCodeAt(i);
      if (c === "\\") out += "\\\\";
      else if (c === q) out += "\\" + q;
      else if (c === "\n") out += "\\n";
      else if (c === "\t") out += "\\t";
      else if (c === "\r") out += "\\r";
      else if (code < 32 || code === 127) out += "\\x" + (code < 16 ? "0" : "") + code.toString(16);
      else out += c;
    }
    return out + q;
  }

  function repr(v) {
    if (v === None) return "None";
    if (isBool(v)) return v ? "True" : "False";
    if (isInt(v)) return v.toString();
    if (isFloat(v)) return floatRepr(v);
    if (isStr(v)) return strRepr(v);
    if (isList(v)) return "[" + v.map(repr).join(", ") + "]";
    if (isTuple(v)) return v.items.length === 1 ? "(" + repr(v.items[0]) + ",)" : "(" + v.items.map(repr).join(", ") + ")";
    if (v instanceof PyRange) return "range(" + v.start + ", " + v.stop + (v.step !== 1n ? ", " + v.step : "") + ")";
    if (v instanceof PyFunc) return "<function " + v.name + ">";
    if (v instanceof Builtin) return "<built-in function " + v.name + ">";
    if (v instanceof BoundMethod) return "<built-in method " + v.name + ">";
    return "<object>";
  }
  function str(v) { return isStr(v) ? v : repr(v); }

  /* ------------------------------------------------------------ tokenizer */

  var KEYWORDS = { "if": 1, "elif": 1, "else": 1, "while": 1, "for": 1, "in": 1, "and": 1, "or": 1, "not": 1,
    "True": 1, "False": 1, "None": 1, "break": 1, "continue": 1, "pass": 1, "def": 1, "return": 1, "is": 1 };
  var OPS3 = ["**=", "//=", "..."];
  var OPS2 = ["**", "//", "==", "!=", "<=", ">=", "+=", "-=", "*=", "/=", "%=", "->"];
  var OPS1 = "+-*/%<>=()[]{}:,.;";

  function tokenize(src) {
    var lines = src.replace(/\r\n?/g, "\n").split("\n");
    var toks = [], indents = [0], depth = 0;
    function push(type, value, line) { toks.push({ type: type, value: value, line: line }); }
    for (var ln = 0; ln < lines.length; ln++) {
      var line = lines[ln], lineNo = ln + 1, i = 0;
      if (depth === 0) {
        var col = 0;
        while (i < line.length && (line[i] === " " || line[i] === "\t")) { col += line[i] === "\t" ? 8 - (col % 8) : 1; i++; }
        if (i >= line.length || line[i] === "#") continue;      // blank or comment-only line
        var top = indents[indents.length - 1];
        if (col > top) {
          indents.push(col); push("INDENT", null, lineNo);
        } else if (col < top) {
          while (col < indents[indents.length - 1]) { indents.pop(); push("DEDENT", null, lineNo); }
          if (col !== indents[indents.length - 1]) throw err("IndentationError", "unindent does not match any outer indentation level", lineNo);
        }
      }
      while (i < line.length) {
        var c = line[i];
        if (c === " " || c === "\t") { i++; continue; }
        if (c === "#") break;
        if (c === "\\" && i === line.length - 1) { i++; break; }
        if (/[A-Za-z_]/.test(c)) {
          var j = i; while (j < line.length && /[A-Za-z0-9_]/.test(line[j])) j++;
          var word = line.slice(i, j);
          // string prefixes (r'..', f'..' unsupported except plain r)
          if ((word === "f" || word === "F") && (line[j] === "'" || line[j] === '"'))
            throw err("SyntaxError", "f-strings are not supported in this notebook; use print(a, b) or str()", lineNo);
          push(KEYWORDS[word] ? "KW" : "NAME", word, lineNo); i = j; continue;
        }
        if (/[0-9]/.test(c) || (c === "." && /[0-9]/.test(line[i + 1] || ""))) {
          var k = i, isF = false;
          while (k < line.length && /[0-9_]/.test(line[k])) k++;
          if (line[k] === "." ) { isF = true; k++; while (k < line.length && /[0-9_]/.test(line[k])) k++; }
          if (line[k] === "e" || line[k] === "E") {
            var k2 = k + 1; if (line[k2] === "+" || line[k2] === "-") k2++;
            if (/[0-9]/.test(line[k2] || "")) { isF = true; k = k2; while (k < line.length && /[0-9]/.test(line[k])) k++; }
          }
          if (/[A-Za-z_]/.test(line[k] || "")) throw err("SyntaxError", "invalid decimal literal", lineNo);
          var lit = line.slice(i, k).replace(/_/g, "");
          push("NUM", isF ? parseFloat(lit) : BigInt(lit), lineNo); i = k; continue;
        }
        if (c === "'" || c === '"') {
          var q = c, s = "", m = i + 1;
          if (line.substr(i, 3) === q + q + q) throw err("SyntaxError", "triple-quoted strings are not supported in this notebook", lineNo);
          while (m < line.length && line[m] !== q) {
            if (line[m] === "\\" && m + 1 < line.length) {
              var e2 = line[m + 1];
              s += e2 === "n" ? "\n" : e2 === "t" ? "\t" : e2 === "\\" ? "\\" : e2 === "'" ? "'" : e2 === '"' ? '"' : "\\" + e2;
              m += 2;
            } else { s += line[m]; m++; }
          }
          if (m >= line.length) throw err("SyntaxError", "unterminated string literal (detected at line " + lineNo + ")", lineNo);
          push("STR", s, lineNo); i = m + 1; continue;
        }
        var three = line.substr(i, 3), two = line.substr(i, 2);
        if (OPS3.indexOf(three) >= 0) { push("OP", three, lineNo); i += 3; continue; }
        if (OPS2.indexOf(two) >= 0) { push("OP", two, lineNo); i += 2; continue; }
        if (OPS1.indexOf(c) >= 0) {
          if ("([{".indexOf(c) >= 0) depth++;
          if (")]}".indexOf(c) >= 0) depth = Math.max(0, depth - 1);
          push("OP", c, lineNo); i++; continue;
        }
        throw err("SyntaxError", "invalid character '" + c + "'", lineNo);
      }
      if (depth === 0 && toks.length && toks[toks.length - 1].type !== "NEWLINE" && toks[toks.length - 1].type !== "INDENT" && toks[toks.length - 1].type !== "DEDENT")
        push("NEWLINE", null, lineNo);
    }
    if (depth > 0) throw err("SyntaxError", "'(' was never closed", lines.length);
    if (toks.length && toks[toks.length - 1].type !== "NEWLINE") push("NEWLINE", null, lines.length);
    while (indents.length > 1) { indents.pop(); push("DEDENT", null, lines.length); }
    push("EOF", null, lines.length);
    return toks;
  }

  /* ------------------------------------------------------------ parser */

  function Parser(toks) { this.t = toks; this.p = 0; }
  Parser.prototype = {
    peek: function () { return this.t[this.p]; },
    next: function () { return this.t[this.p++]; },
    is: function (type, value) { var k = this.t[this.p]; return k.type === type && (value === undefined || k.value === value); },
    isOp: function (v) { return this.is("OP", v); },
    isKw: function (v) { return this.is("KW", v); },
    expect: function (type, value) {
      var k = this.peek();
      if (k.type !== type || (value !== undefined && k.value !== value)) {
        if (k.type === "INDENT") throw err("IndentationError", "unexpected indent", k.line);
        if (type === "INDENT") throw err("IndentationError", "expected an indented block", k.line);
        if (type === "OP" && value === ":") throw err("SyntaxError", "expected ':'", k.line);
        throw err("SyntaxError", "invalid syntax", k.line);
      }
      return this.next();
    },
    program: function () {
      var body = [];
      while (!this.is("EOF")) {
        if (this.is("NEWLINE")) { this.next(); continue; }
        if (this.is("INDENT")) throw err("IndentationError", "unexpected indent", this.peek().line);
        body.push(this.statement());
      }
      return body;
    },
    block: function (what, line) {
      if (this.is("NEWLINE")) {
        this.next();
        if (!this.is("INDENT")) throw err("IndentationError", "expected an indented block after " + what + " on line " + line, this.peek().line);
        this.next();
        var body = [];
        while (!this.is("DEDENT") && !this.is("EOF")) {
          if (this.is("NEWLINE")) { this.next(); continue; }
          body.push(this.statement());
        }
        if (this.is("DEDENT")) this.next();
        return body;
      }
      return this.simpleLine();
    },
    statement: function () {
      var k = this.peek();
      if (k.type === "KW") {
        if (k.value === "if") return this.ifStmt();
        if (k.value === "while") {
          this.next(); var cond = this.expr(); this.expect("OP", ":");
          return { k: "while", cond: cond, body: this.block("'while' statement", k.line), line: k.line };
        }
        if (k.value === "for") {
          this.next(); var target = this.targetList(); this.expect("KW", "in"); var it = this.exprList();
          this.expect("OP", ":");
          return { k: "for", target: target, iter: it, body: this.block("'for' statement", k.line), line: k.line };
        }
        if (k.value === "def") {
          this.next(); var name = this.expect("NAME").value; this.expect("OP", "(");
          var params = [];
          while (!this.isOp(")")) { params.push(this.expect("NAME").value); if (!this.isOp(")")) this.expect("OP", ","); }
          this.expect("OP", ")"); this.expect("OP", ":");
          return { k: "def", name: name, params: params, body: this.block("function definition", k.line), line: k.line };
        }
      }
      var stmts = this.simpleLine();
      return stmts.length === 1 ? stmts[0] : { k: "seq", body: stmts, line: k.line };
    },
    ifStmt: function () {
      var k = this.next(); var cond = this.expr(); this.expect("OP", ":");
      var body = this.block("'" + k.value + "' statement", k.line), orelse = [];
      if (this.isKw("elif")) { orelse = [this.ifStmt()]; }
      else if (this.isKw("else")) { var e = this.next(); this.expect("OP", ":"); orelse = this.block("'else' statement", e.line); }
      return { k: "if", cond: cond, body: body, orelse: orelse, line: k.line };
    },
    simpleLine: function () {
      var out = [this.simple()];
      while (this.isOp(";")) { this.next(); if (this.is("NEWLINE")) break; out.push(this.simple()); }
      this.expect("NEWLINE");
      return out;
    },
    simple: function () {
      var k = this.peek();
      if (k.type === "KW") {
        if (k.value === "pass") { this.next(); return { k: "pass", line: k.line }; }
        if (k.value === "break") { this.next(); return { k: "break", line: k.line }; }
        if (k.value === "continue") { this.next(); return { k: "continue", line: k.line }; }
        if (k.value === "return") {
          this.next();
          var v = (this.is("NEWLINE") || this.isOp(";")) ? null : this.exprList();
          return { k: "return", value: v, line: k.line };
        }
        if (k.value === "elif" || k.value === "else") throw err("SyntaxError", "invalid syntax", k.line);
      }
      var first = this.exprList();
      if (this.isOp("=")) {
        var targets = [first], value;
        while (this.isOp("=")) { this.next(); value = this.exprList(); targets.push(value); }
        value = targets.pop();
        targets.forEach(function (t) { checkTarget(t, k.line); });
        return { k: "assign", targets: targets, value: value, line: k.line };
      }
      var aug = ["+=", "-=", "*=", "/=", "//=", "%=", "**="];
      if (this.is("OP") && aug.indexOf(this.peek().value) >= 0) {
        var op = this.next().value.slice(0, -1);
        if (first.k !== "name" && first.k !== "index") throw err("SyntaxError", "'" + describe(first) + "' is an illegal expression for augmented assignment", k.line);
        return { k: "aug", target: first, op: op, value: this.exprList(), line: k.line };
      }
      return { k: "expr", value: first, line: k.line };
    },
    targetList: function () {
      var items = [this.primary()];
      var tuple = false;
      while (this.isOp(",")) { tuple = true; this.next(); if (this.isKw("in")) break; items.push(this.primary()); }
      var t = tuple ? { k: "tuple", items: items } : items[0];
      checkTarget(t, this.peek().line);
      return t;
    },
    exprList: function () {
      var first = this.expr();
      if (!this.isOp(",")) return first;
      var items = [first];
      while (this.isOp(",")) {
        this.next();
        if (this.is("NEWLINE") || this.isOp("=") || this.isOp(")") || this.isOp(":")) break;
        items.push(this.expr());
      }
      return { k: "tuple", items: items };
    },
    expr: function () {
      var body = this.orExpr();
      if (this.isKw("if")) {
        var line = this.next().line, cond = this.orExpr();
        this.expect("KW", "else");
        return { k: "ifexp", cond: cond, a: body, b: this.expr(), line: line };
      }
      return body;
    },
    orExpr: function () {
      var left = this.andExpr();
      while (this.isKw("or")) { var line = this.next().line; left = { k: "or", a: left, b: this.andExpr(), line: line }; }
      return left;
    },
    andExpr: function () {
      var left = this.notExpr();
      while (this.isKw("and")) { var line = this.next().line; left = { k: "and", a: left, b: this.notExpr(), line: line }; }
      return left;
    },
    notExpr: function () {
      if (this.isKw("not")) { var line = this.next().line; return { k: "not", a: this.notExpr(), line: line }; }
      return this.comparison();
    },
    comparison: function () {
      var first = this.arith(), ops = [], rest = [];
      for (;;) {
        var k = this.peek(), op = null;
        if (k.type === "OP" && ["<", ">", "==", "!=", "<=", ">="].indexOf(k.value) >= 0) { op = k.value; this.next(); }
        else if (k.type === "KW" && k.value === "in") { op = "in"; this.next(); }
        else if (k.type === "KW" && k.value === "not" && this.t[this.p + 1].type === "KW" && this.t[this.p + 1].value === "in") { op = "not in"; this.p += 2; }
        else if (k.type === "KW" && k.value === "is") {
          this.next();
          if (this.isKw("not")) { this.next(); op = "is not"; } else op = "is";
        }
        else break;
        ops.push(op); rest.push(this.arith());
      }
      if (!ops.length) return first;
      return { k: "cmp", first: first, ops: ops, rest: rest, line: this.peek().line };
    },
    arith: function () {
      var left = this.term();
      while (this.isOp("+") || this.isOp("-")) { var t = this.next(); left = { k: "bin", op: t.value, a: left, b: this.term(), line: t.line }; }
      return left;
    },
    term: function () {
      var left = this.factor();
      while (this.isOp("*") || this.isOp("/") || this.isOp("//") || this.isOp("%")) { var t = this.next(); left = { k: "bin", op: t.value, a: left, b: this.factor(), line: t.line }; }
      return left;
    },
    factor: function () {
      if (this.isOp("-") || this.isOp("+")) { var t = this.next(); return { k: "unary", op: t.value, a: this.factor(), line: t.line }; }
      return this.power();
    },
    power: function () {
      var base = this.primary();
      if (this.isOp("**")) { var t = this.next(); return { k: "bin", op: "**", a: base, b: this.factor(), line: t.line }; }
      return base;
    },
    primary: function () {
      var node = this.atom();
      for (;;) {
        if (this.isOp("(")) {
          var line = this.next().line, args = [], kwargs = [];
          while (!this.isOp(")")) {
            if (this.is("NAME") && this.t[this.p + 1].type === "OP" && this.t[this.p + 1].value === "=") {
              var kn = this.next().value; this.next(); kwargs.push({ name: kn, value: this.expr() });
            } else {
              if (kwargs.length) throw err("SyntaxError", "positional argument follows keyword argument", line);
              args.push(this.expr());
            }
            if (!this.isOp(")")) this.expect("OP", ",");
          }
          this.next();
          node = { k: "call", fn: node, args: args, kwargs: kwargs, line: line };
        } else if (this.isOp("[")) {
          var l2 = this.next().line, lo = null, hi = null, st = null, isSlice = false;
          if (!this.isOp(":")) lo = this.expr();
          if (this.isOp(":")) {
            isSlice = true; this.next();
            if (!this.isOp("]") && !this.isOp(":")) hi = this.expr();
            if (this.isOp(":")) { this.next(); if (!this.isOp("]")) st = this.expr(); }
          }
          this.expect("OP", "]");
          node = isSlice ? { k: "slice", obj: node, lo: lo, hi: hi, step: st, line: l2 } : { k: "index", obj: node, idx: lo, line: l2 };
        } else if (this.isOp(".")) {
          var l3 = this.next().line;
          node = { k: "attr", obj: node, name: this.expect("NAME").value, line: l3 };
        } else break;
      }
      return node;
    },
    atom: function () {
      var k = this.next();
      if (k.type === "NUM") return { k: "const", value: k.value, line: k.line };
      if (k.type === "STR") {
        var s = k.value;
        while (this.is("STR")) s += this.next().value;
        return { k: "const", value: s, line: k.line };
      }
      if (k.type === "NAME") return { k: "name", name: k.value, line: k.line };
      if (k.type === "KW") {
        if (k.value === "True") return { k: "const", value: true, line: k.line };
        if (k.value === "False") return { k: "const", value: false, line: k.line };
        if (k.value === "None") return { k: "const", value: None, line: k.line };
      }
      if (k.type === "OP" && k.value === "(") {
        if (this.isOp(")")) { this.next(); return { k: "tuple", items: [], line: k.line }; }
        var first = this.expr();
        if (this.isOp(")")) { this.next(); return first; }
        var items = [first];
        while (this.isOp(",")) { this.next(); if (this.isOp(")")) break; items.push(this.expr()); }
        this.expect("OP", ")");
        return { k: "tuple", items: items, line: k.line };
      }
      if (k.type === "OP" && k.value === "[") {
        var els = [];
        while (!this.isOp("]")) { els.push(this.expr()); if (!this.isOp("]")) this.expect("OP", ","); }
        this.next();
        return { k: "list", items: els, line: k.line };
      }
      if (k.type === "INDENT") throw err("IndentationError", "unexpected indent", k.line);
      if (k.type === "NEWLINE" || k.type === "EOF") throw err("SyntaxError", "invalid syntax", k.line);
      throw err("SyntaxError", "invalid syntax", k.line);
    }
  };

  function describe(node) {
    if (node.k === "call") return "function call";
    if (node.k === "const") return "literal";
    if (node.k === "tuple") return "tuple";
    return "expression";
  }
  function checkTarget(t, line) {
    if (t.k === "name" || t.k === "index") return;
    if (t.k === "tuple") { t.items.forEach(function (x) { checkTarget(x, line); }); return; }
    if (t.k === "call") throw err("SyntaxError", "cannot assign to function call here. Maybe you meant '==' instead of '='?", line);
    if (t.k === "const") throw err("SyntaxError", "cannot assign to literal here. Maybe you meant '==' instead of '='?", line);
    throw err("SyntaxError", "cannot assign to expression here. Maybe you meant '==' instead of '='?", line);
  }

  /* ------------------------------------------------------------ operators */

  // Exact helpers so float results match CPython bit for bit.
  function floatParts(x) {            // x = sign * mant * 2^e2, x finite and nonzero
    var buf = new DataView(new ArrayBuffer(8)); buf.setFloat64(0, x);
    var hi = buf.getUint32(0), lo = buf.getUint32(4);
    var bexp = (hi >>> 20) & 0x7ff, mant = (BigInt(hi & 0xfffff) << 32n) | BigInt(lo), e2;
    if (bexp === 0) e2 = -1074; else { mant |= 1n << 52n; e2 = bexp - 1075; }
    return { neg: (hi >>> 31) === 1, mant: mant, e2: e2 };
  }
  function bitLen(n) { return n === 0n ? 0 : n.toString(2).length; }
  // The double nearest num / den (num >= 0, den > 0), ties to even.
  function ratToDouble(num, den) {
    if (num === 0n) return 0;
    var sh = bitLen(num) - bitLen(den) - 55;          // aim for a 55- or 56-bit quotient
    var n2 = num, d2 = den;
    if (sh > 0) d2 <<= BigInt(sh); else n2 <<= BigInt(-sh);
    var q = n2 / d2, sticky = (n2 % d2) !== 0n;
    var exp = sh;                                       // value = (q + frac) * 2^exp
    var qb = bitLen(q), keep = 53;
    var top = exp + qb - 1;                             // binary exponent of the leading bit
    if (top > 1023) return Infinity;
    if (top < -1022) keep = Math.max(0, 53 - (-1022 - top));
    var drop = qb - keep;
    var m;
    if (drop > 0) {
      var rem = q & ((1n << BigInt(drop)) - 1n), half = 1n << BigInt(drop - 1);
      m = q >> BigInt(drop);
      if (rem > half || (rem === half && (sticky || (m & 1n) === 1n))) m += 1n;
      exp += drop;
    } else { m = q; }
    // m * 2^exp is exact in double range (m <= 2^53)
    return Number(m) * Math.pow(2, exp > 1023 ? 1023 : exp) * (exp > 1023 ? Math.pow(2, exp - 1023) : 1);
  }
  function bigToFloat(b) {
    var f = Number(b);
    if (!isFinite(f)) throw err("OverflowError", "int too large to convert to float");
    return f;
  }
  function trueDivInt(a, b) {
    if (b === 0n) throw err("ZeroDivisionError", "division by zero");
    var neg = (a < 0n) !== (b < 0n), r = ratToDouble(a < 0n ? -a : a, b < 0n ? -b : b);
    if (!isFinite(r)) throw err("OverflowError", "integer division result too large for a float");
    return neg ? -r : r;
  }
  // float ** integer, computed exactly and rounded once (as glibc's pow does).
  function powFloatInt(x, n) {
    if (x === 0) {
      if (n < 0n) throw err("ZeroDivisionError", "0.0 cannot be raised to a negative power");
      return n === 0n ? 1 : ((n & 1n) === 1n ? x : 0);
    }
    if (!isFinite(x)) return Math.pow(x, Number(n));
    if (n === 0n) return 1;
    var p = floatParts(x), an = n < 0n ? -n : n;
    if (an > 2000n) return Math.pow(x, Number(n));
    var num = p.mant ** an, e = BigInt(p.e2) * an, den = 1n;
    if (e >= 0n) num <<= e; else den <<= -e;
    if (n < 0n) { var t = num; num = den; den = t; }
    var r = ratToDouble(num, den);
    if (!isFinite(r)) throw err("OverflowError", "(34, 'Numerical result out of range')");
    return (p.neg && (an & 1n) === 1n) ? -r : r;
  }
  // CPython's float floor division and modulo (float_divmod).
  function floatDivmod(vx, wx) {
    var mod = vx % wx, div = (vx - mod) / wx, floordiv;
    if (mod) { if ((wx < 0) !== (mod < 0)) { mod += wx; div -= 1; } }
    else mod = wx < 0 ? -0 : 0;
    if (div) { floordiv = Math.floor(div); if (div - floordiv > 0.5) floordiv += 1; }
    else floordiv = (vx / wx) < 0 || Object.is(vx / wx, -0) ? -0 : 0;
    return [floordiv, mod];
  }

  function floorDivBig(a, b) {
    var q = a / b;
    if ((a % b !== 0n) && ((a < 0n) !== (b < 0n))) q -= 1n;
    return q;
  }
  function modBig(a, b) { var r = a % b; if (r !== 0n && ((r < 0n) !== (b < 0n))) r += b; return r; }
  function unsupported(op, a, b) { return err("TypeError", "unsupported operand type(s) for " + op + ": '" + typeName(a) + "' and '" + typeName(b) + "'"); }

  function binop(op, a, b) {
    if (isNum(a) && isNum(b)) {
      if (!isFloat(a) && !isFloat(b)) {
        var x = asBig(a), y = asBig(b);
        switch (op) {
          case "+": return x + y;
          case "-": return x - y;
          case "*": return x * y;
          case "/": return trueDivInt(x, y);
          case "//": if (y === 0n) throw err("ZeroDivisionError", "integer division or modulo by zero"); return floorDivBig(x, y);
          case "%": if (y === 0n) throw err("ZeroDivisionError", "integer modulo by zero"); return modBig(x, y);
          case "**":
            if (y < 0n) {
              if (x === 0n) throw err("ZeroDivisionError", "0.0 cannot be raised to a negative power");
              return powFloatInt(bigToFloat(x), y);
            }
            if (y > 100000n) throw err("ValueError", "exponent too large for this notebook");
            return x ** y;
        }
      }
      var p = isFloat(a) ? a : bigToFloat(asBig(a)), q = isFloat(b) ? b : bigToFloat(asBig(b));
      switch (op) {
        case "+": return p + q;
        case "-": return p - q;
        case "*": return p * q;
        case "/": if (q === 0) throw err("ZeroDivisionError", "float division by zero"); return p / q;
        case "//": if (q === 0) throw err("ZeroDivisionError", "float floor division by zero"); return floatDivmod(p, q)[0];
        case "%": if (q === 0) throw err("ZeroDivisionError", "float modulo by zero"); return floatDivmod(p, q)[1];
        case "**":
          if (q === Math.trunc(q) && Math.abs(q) < 1e6) return powFloatInt(p, BigInt(q));
          if (p === 0 && q < 0) throw err("ZeroDivisionError", "0.0 cannot be raised to a negative power");
          if (p < 0 && isFinite(q)) throw err("ValueError", "complex results are not supported in this notebook");
          var r = q === 0.5 ? Math.sqrt(p) : Math.pow(p, q);
          if (!isFinite(r) && isFinite(p) && isFinite(q)) throw err("OverflowError", "(34, 'Numerical result out of range')");
          return r;
      }
    }
    if (op === "+") {
      if (isStr(a) && isStr(b)) return a + b;
      if (isList(a) && isList(b)) return a.concat(b);
      if (isTuple(a) && isTuple(b)) return new PyTuple(a.items.concat(b.items));
      if (isStr(a) && !isStr(b)) throw err("TypeError", "can only concatenate str (not \"" + typeName(b) + "\") to str");
      if (isList(a) && !isList(b)) throw err("TypeError", "can only concatenate list (not \"" + typeName(b) + "\") to list");
    }
    if (op === "*") {
      var seq = null, n = null;
      if ((isStr(a) || isList(a) || isTuple(a)) && (isInt(b) || isBool(b))) { seq = a; n = asBig(b); }
      else if ((isStr(b) || isList(b) || isTuple(b)) && (isInt(a) || isBool(a))) { seq = b; n = asBig(a); }
      if (seq !== null) {
        var times = n < 0n ? 0 : Number(n);
        if (times * (isStr(seq) ? seq.length : isList(seq) ? seq.length : seq.items.length) > 1e6) throw err("MemoryError", "result too large for this notebook");
        if (isStr(seq)) return seq.repeat(times);
        var src = isList(seq) ? seq : seq.items, out = [];
        for (var i = 0; i < times; i++) out = out.concat(src);
        return isList(seq) ? out : new PyTuple(out);
      }
      if (isStr(a) || isStr(b)) throw err("TypeError", "can't multiply sequence by non-int of type '" + typeName(isStr(a) ? b : a) + "'");
    }
    if (op === "%" && isStr(a)) throw err("TypeError", "%-formatting is not supported in this notebook");
    throw unsupported(op === "**" ? "** or pow()" : op, a, b);
  }

  function eq(a, b) {
    if (isNum(a) && isNum(b)) {
      if (isFloat(a) || isFloat(b)) return asFloat(a) === asFloat(b);
      return asBig(a) === asBig(b);
    }
    if (isStr(a) && isStr(b)) return a === b;
    if (isList(a) && isList(b)) { if (a.length !== b.length) return false; for (var i = 0; i < a.length; i++) if (!eq(a[i], b[i])) return false; return true; }
    if (isTuple(a) && isTuple(b)) return eq(a.items, b.items);
    if (a instanceof PyRange && b instanceof PyRange) return eq(rangeList(a), rangeList(b));
    return a === b;
  }
  function lt(a, b, op) {
    if (isNum(a) && isNum(b)) {
      if (isFloat(a) || isFloat(b)) return asFloat(a) < asFloat(b);
      return asBig(a) < asBig(b);
    }
    if (isStr(a) && isStr(b)) return a < b;
    if ((isList(a) && isList(b)) || (isTuple(a) && isTuple(b))) {
      var x = isList(a) ? a : a.items, y = isList(b) ? b : b.items;
      for (var i = 0; i < Math.min(x.length, y.length); i++) {
        if (!eq(x[i], y[i])) return lt(x[i], y[i], op);
      }
      return x.length < y.length;
    }
    throw err("TypeError", "'" + op + "' not supported between instances of '" + typeName(a) + "' and '" + typeName(b) + "'");
  }
  function compare(op, a, b) {
    switch (op) {
      case "==": return eq(a, b);
      case "!=": return !eq(a, b);
      case "<": return lt(a, b, "<");
      case ">": return lt(b, a, ">") ;
      case "<=": return lt(a, b, "<=") || eq(a, b);
      case ">=": return lt(b, a, ">=") || eq(a, b);
      case "is": return a === b || (a === None && b === None);
      case "is not": return !(a === b || (a === None && b === None));
      case "in": return contains(b, a);
      case "not in": return !contains(b, a);
    }
  }
  function contains(container, item) {
    if (isStr(container)) {
      if (!isStr(item)) throw err("TypeError", "'in <string>' requires string as left operand, not " + typeName(item));
      return container.indexOf(item) >= 0;
    }
    if (isList(container)) return container.some(function (x) { return eq(x, item); });
    if (isTuple(container)) return container.items.some(function (x) { return eq(x, item); });
    if (container instanceof PyRange) return rangeList(container).some(function (x) { return eq(x, item); });
    throw err("TypeError", "argument of type '" + typeName(container) + "' is not iterable");
  }

  /* ------------------------------------------------------------ sequences */

  function rangeLen(r) {
    if (r.step > 0n) return r.start < r.stop ? (r.stop - r.start + r.step - 1n) / r.step : 0n;
    return r.start > r.stop ? (r.start - r.stop - r.step - 1n) / (-r.step) : 0n;
  }
  function rangeList(r) {
    var n = rangeLen(r);
    if (n > 1000000n) throw err("MemoryError", "range too large for this notebook");
    var out = [], v = r.start;
    for (var i = 0n; i < n; i++) { out.push(v); v += r.step; }
    return out;
  }
  function iterate(v) {
    if (isList(v)) return v.slice();
    if (isTuple(v)) return v.items.slice();
    if (isStr(v)) return v.split("");
    if (v instanceof PyRange) return rangeList(v);
    throw err("TypeError", "'" + typeName(v) + "' object is not iterable");
  }
  function seqItems(v) { return isList(v) ? v : isTuple(v) ? v.items : isStr(v) ? v : v instanceof PyRange ? rangeList(v) : null; }

  function normIndex(i, n, what) {
    if (!(isInt(i) || isBool(i))) throw err("TypeError", what + " indices must be integers or slices, not " + typeName(i));
    var k = Number(asBig(i));
    if (k < 0) k += n;
    if (k < 0 || k >= n) throw err("IndexError", what + " index out of range");
    return k;
  }
  function getIndex(obj, i) {
    if (isList(obj)) return obj[normIndex(i, obj.length, "list")];
    if (isTuple(obj)) return obj.items[normIndex(i, obj.items.length, "tuple")];
    if (isStr(obj)) return obj[normIndex(i, obj.length, "string")];
    if (obj instanceof PyRange) { var l = rangeList(obj); return l[normIndex(i, l.length, "range object")]; }
    throw err("TypeError", "'" + typeName(obj) + "' object is not subscriptable");
  }
  function sliceIdx(v, n, dflt) {
    if (v === null || v === None) return dflt;
    if (!(isInt(v) || isBool(v))) throw err("TypeError", "slice indices must be integers or None or have an __index__ method");
    var k = Number(asBig(v));
    if (k < 0) k += n;
    return k;
  }
  function getSlice(obj, lo, hi, step) {
    var items = seqItems(obj);
    if (items === null) throw err("TypeError", "'" + typeName(obj) + "' object is not subscriptable");
    var n = items.length;
    var st = (step === null || step === None) ? 1 : Number(asBig(step));
    if (st === 0) throw err("ValueError", "slice step cannot be zero");
    var out = [], a, b, i;
    if (st > 0) {
      a = Math.min(Math.max(sliceIdx(lo, n, 0), 0), n); b = Math.min(Math.max(sliceIdx(hi, n, n), 0), n);
      for (i = a; i < b; i += st) out.push(items[i]);
    } else {
      a = Math.min(Math.max(sliceIdx(lo, n, n - 1), -1), n - 1); b = Math.min(Math.max(sliceIdx(hi, n, -1), -1), n - 1);
      if (hi !== null && hi !== None && sliceIdx(hi, n, -1) < 0) b = -1;
      for (i = a; i > b; i += st) out.push(items[i]);
    }
    if (isStr(obj)) return out.join("");
    if (isTuple(obj)) return new PyTuple(out);
    return out;
  }

  /* ------------------------------------------------------------ built-ins */

  function toInt(v) {
    if (isInt(v)) return v;
    if (isBool(v)) return v ? 1n : 0n;
    if (isFloat(v)) {
      if (!isFinite(v)) throw err(v !== v ? "ValueError" : "OverflowError", v !== v ? "cannot convert float NaN to integer" : "cannot convert float infinity to integer");
      return BigInt(Math.trunc(v));
    }
    if (isStr(v)) {
      var s = v.trim().replace(/_/g, "");
      if (!/^[+-]?\d+$/.test(s)) throw err("ValueError", "invalid literal for int() with base 10: " + strRepr(v));
      return BigInt(s);
    }
    throw err("TypeError", "int() argument must be a string, a bytes-like object or a real number, not '" + typeName(v) + "'");
  }
  function toFloat(v) {
    if (isNum(v)) return asFloat(v);
    if (isStr(v)) {
      var s = v.trim().toLowerCase();
      if (s === "inf" || s === "+inf" || s === "infinity") return Infinity;
      if (s === "-inf" || s === "-infinity") return -Infinity;
      if (s === "nan") return NaN;
      if (!/^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/.test(s)) throw err("ValueError", "could not convert string to float: " + strRepr(v));
      return parseFloat(s);
    }
    throw err("TypeError", "float() argument must be a string or a real number, not '" + typeName(v) + "'");
  }
  // round(x, k) on a float: round the exact binary value half to even at k
  // decimals, then return the nearest double, as CPython does.
  function exactRound(x, k) {
    if (!isFinite(x) || x === 0) return x;
    var buf = new DataView(new ArrayBuffer(8)); buf.setFloat64(0, x);
    var hi = buf.getUint32(0), lo = buf.getUint32(4);
    var neg = hi >>> 31, bexp = (hi >>> 20) & 0x7ff;
    var mant = (BigInt(hi & 0xfffff) << 32n) | BigInt(lo);
    var e2;
    if (bexp === 0) e2 = -1074; else { mant |= 1n << 52n; e2 = bexp - 1075; }
    var num = mant, den = 1n;
    if (e2 >= 0) num <<= BigInt(e2); else den <<= BigInt(-e2);
    if (k >= 0) num *= 10n ** BigInt(k); else den *= 10n ** BigInt(-k);
    var q = num / den, r = num - q * den;
    if (2n * r > den || (2n * r === den && (q & 1n) === 1n)) q += 1n;
    var v = parseFloat(q.toString() + "e" + (-k));
    return neg ? -v : v;
  }
  function pyRound(x, nd) {
    if (nd === undefined || nd === None) {
      if (isInt(x) || isBool(x)) return asBig(x);
      if (!isFinite(x)) throw err(x !== x ? "ValueError" : "OverflowError", x !== x ? "cannot convert float NaN to integer" : "cannot convert float infinity to integer");
      return BigInt(exactRound(x, 0));
    }
    var k = Number(asBig(nd));
    if (isInt(x) || isBool(x)) {
      if (k >= 0) return asBig(x);
      var m = 10n ** BigInt(-k), b = asBig(x), q = floorDivBig(b, m), r = b - q * m;
      if (2n * r > m || (2n * r === m && (q & 1n) === 1n)) q += 1n;
      return q * m;
    }
    var out = exactRound(x, k);
    return out === 0 && x < 0 ? -0 : out;
  }

  function makeBuiltins(kernel) {
    var b = {};
    function def(name, fn) { b[name] = new Builtin(name, fn); }
    def("print", function (args, kw) {
      var sep = " ", end = "\n";
      if (kw.sep !== undefined && kw.sep !== None) { if (!isStr(kw.sep)) throw err("TypeError", "sep must be None or a string, not " + typeName(kw.sep)); sep = kw.sep; }
      if (kw.end !== undefined && kw.end !== None) { if (!isStr(kw.end)) throw err("TypeError", "end must be None or a string, not " + typeName(kw.end)); end = kw.end; }
      Object.keys(kw).forEach(function (k) { if (k !== "sep" && k !== "end") throw err("TypeError", "'" + k + "' is an invalid keyword argument for print()"); });
      kernel.write(args.map(str).join(sep) + end);
      return None;
    });
    def("range", function (a) {
      if (a.length < 1 || a.length > 3) throw err("TypeError", a.length < 1 ? "range expected at least 1 argument, got 0" : "range expected at most 3 arguments, got " + a.length);
      a.forEach(function (x) { if (!(isInt(x) || isBool(x))) throw err("TypeError", "'" + typeName(x) + "' object cannot be interpreted as an integer"); });
      var v = a.map(asBig);
      if (v.length === 1) return new PyRange(0n, v[0], 1n);
      if (v.length === 3 && v[2] === 0n) throw err("ValueError", "range() arg 3 must not be zero");
      return new PyRange(v[0], v[1], v.length === 3 ? v[2] : 1n);
    });
    def("len", function (a) {
      var v = a[0];
      if (isStr(v) || isList(v)) return BigInt(v.length);
      if (isTuple(v)) return BigInt(v.items.length);
      if (v instanceof PyRange) return rangeLen(v);
      throw err("TypeError", "object of type '" + typeName(v) + "' has no len()");
    });
    def("str", function (a) { return a.length ? str(a[0]) : ""; });
    def("int", function (a) { return a.length ? toInt(a[0]) : 0n; });
    def("float", function (a) { return a.length ? toFloat(a[0]) : 0; });
    def("abs", function (a) {
      var v = a[0];
      if (isInt(v)) return v < 0n ? -v : v;
      if (isBool(v)) return v ? 1n : 0n;
      if (isFloat(v)) return Math.abs(v);
      throw err("TypeError", "bad operand type for abs(): '" + typeName(v) + "'");
    });
    function extreme(name, better) {
      return function (a) {
        var items = a.length === 1 ? iterate(a[0]) : a;
        if (!items.length) throw err("ValueError", name + "() iterable argument is empty");
        var best = items[0];
        for (var i = 1; i < items.length; i++) if (better(items[i], best)) best = items[i];
        return best;
      };
    }
    def("min", extreme("min", function (x, y) { return lt(x, y, "<"); }));
    def("max", extreme("max", function (x, y) { return lt(y, x, ">"); }));
    def("sum", function (a) {
      var total = a.length > 1 ? a[1] : 0n;
      iterate(a[0]).forEach(function (x) {
        if (isStr(x)) throw err("TypeError", "unsupported operand type(s) for +: '" + typeName(total) + "' and 'str'");
        total = binop("+", total, x);
      });
      return total;
    });
    def("list", function (a) { return a.length ? iterate(a[0]) : []; });
    def("round", function (a) {
      if (!isNum(a[0])) throw err("TypeError", "type " + typeName(a[0]) + " doesn't define __round__ method");
      return pyRound(a[0], a[1]);
    });
    def("type", function (a) { return "<class '" + typeName(a[0]) + "'>"; });
    return b;
  }

  function method(obj, name) {
    if (isList(obj)) {
      if (name === "append") return function (a) { obj.push(a[0]); return None; };
      if (name === "pop") return function (a) {
        if (!obj.length) throw err("IndexError", "pop from empty list");
        var k = a.length ? normIndex(a[0], obj.length, "pop") : obj.length - 1;
        return obj.splice(k, 1)[0];
      };
      if (name === "insert") return function (a) {
        var k = Number(asBig(a[0])); if (k < 0) k = Math.max(0, k + obj.length); k = Math.min(k, obj.length);
        obj.splice(k, 0, a[1]); return None;
      };
      if (name === "reverse") return function () { obj.reverse(); return None; };
      if (name === "count") return function (a) { return BigInt(obj.filter(function (x) { return eq(x, a[0]); }).length); };
      if (name === "index") return function (a) {
        for (var i = 0; i < obj.length; i++) if (eq(obj[i], a[0])) return BigInt(i);
        throw err("ValueError", repr(a[0]) + " is not in list");
      };
    }
    if (isStr(obj)) {
      if (name === "upper") return function () { return obj.toUpperCase(); };
      if (name === "lower") return function () { return obj.toLowerCase(); };
      if (name === "strip") return function () { return obj.trim(); };
      if (name === "replace") return function (a) { return obj.split(a[0]).join(a[1]); };
      if (name === "split") return function (a) {
        if (!a.length || a[0] === None) return obj.trim() === "" ? [] : obj.trim().split(/\s+/);
        if (a[0] === "") throw err("ValueError", "empty separator");
        return obj.split(a[0]);
      };
      if (name === "join") return function (a) {
        var parts = iterate(a[0]);
        parts.forEach(function (p, i) { if (!isStr(p)) throw err("TypeError", "sequence item " + i + ": expected str instance, " + typeName(p) + " found"); });
        return parts.join(obj);
      };
      if (name === "count") return function (a) { return BigInt(a[0] === "" ? obj.length + 1 : obj.split(a[0]).length - 1); };
    }
    throw err("AttributeError", "'" + typeName(obj) + "' object has no attribute '" + name + "'");
  }

  /* ------------------------------------------------------------ kernel */

  function Kernel(opts) {
    opts = opts || {};
    this.globals = Object.create(null);
    this.builtins = makeBuiltins(this);
    this.out = "";
    this.steps = 0;
    this.maxSteps = opts.maxSteps || 200000;
    this.maxOutput = opts.maxOutput || 20000;
    this.count = 0;
    this.depth = 0;
  }
  Kernel.prototype.write = function (s) {
    if (this.out.length + s.length > this.maxOutput) {
      this.out += s.slice(0, Math.max(0, this.maxOutput - this.out.length));
      throw err("OutputLimit", "output stopped after " + this.maxOutput + " characters");
    }
    this.out += s;
  };
  Kernel.prototype.tick = function (line) {
    if (++this.steps > this.maxSteps) throw err("StepLimit", "stopped after " + this.maxSteps.toLocaleString("en-US") + " steps; check the loop's stopping condition", line);
  };
  Kernel.prototype.lookup = function (name, scope, line) {
    if (scope && name in scope) return scope[name];
    if (name in this.globals) return this.globals[name];
    if (name in this.builtins) return this.builtins[name];
    throw err("NameError", "name '" + name + "' is not defined", line);
  };
  Kernel.prototype.variables = function () {
    var g = this.globals;
    return Object.keys(g).map(function (k) { return { name: k, type: typeName(g[k]), repr: repr(g[k]) }; });
  };

  Kernel.prototype.evalNode = function (n, scope) {
    var self = this, v, i;
    switch (n.k) {
      case "const": return n.value;
      case "name": return this.lookup(n.name, scope, n.line);
      case "tuple": return new PyTuple(n.items.map(function (x) { return self.evalNode(x, scope); }));
      case "list": return n.items.map(function (x) { return self.evalNode(x, scope); });
      case "unary":
        v = this.evalNode(n.a, scope);
        if (n.op === "-") {
          if (isInt(v) || isBool(v)) return -asBig(v);
          if (isFloat(v)) return -v;
          throw err("TypeError", "bad operand type for unary -: '" + typeName(v) + "'", n.line);
        }
        if (isNum(v)) return isBool(v) ? asBig(v) : v;
        throw err("TypeError", "bad operand type for unary +: '" + typeName(v) + "'", n.line);
      case "bin":
        var a = this.evalNode(n.a, scope), b = this.evalNode(n.b, scope);
        this.tick(n.line);
        return binop(n.op, a, b);
      case "ifexp": return truthy(this.evalNode(n.cond, scope)) ? this.evalNode(n.a, scope) : this.evalNode(n.b, scope);
      case "and": v = this.evalNode(n.a, scope); return truthy(v) ? this.evalNode(n.b, scope) : v;
      case "or": v = this.evalNode(n.a, scope); return truthy(v) ? v : this.evalNode(n.b, scope);
      case "not": return !truthy(this.evalNode(n.a, scope));
      case "cmp":
        var left = this.evalNode(n.first, scope);
        for (i = 0; i < n.ops.length; i++) {
          var right = this.evalNode(n.rest[i], scope);
          if (!compare(n.ops[i], left, right)) return false;
          left = right;
        }
        return true;
      case "index": return getIndex(this.evalNode(n.obj, scope), this.evalNode(n.idx, scope));
      case "slice":
        return getSlice(this.evalNode(n.obj, scope),
          n.lo ? this.evalNode(n.lo, scope) : null, n.hi ? this.evalNode(n.hi, scope) : null, n.step ? this.evalNode(n.step, scope) : null);
      case "attr":
        var obj = this.evalNode(n.obj, scope);
        return new BoundMethod(obj, n.name, method(obj, n.name));
      case "call":
        var fn = this.evalNode(n.fn, scope);
        var args = n.args.map(function (x) { return self.evalNode(x, scope); });
        var kw = {};
        n.kwargs.forEach(function (k) { kw[k.name] = self.evalNode(k.value, scope); });
        this.tick(n.line);
        return this.call(fn, args, kw, n.line);
    }
    throw err("SyntaxError", "unsupported expression", n.line);
  };

  Kernel.prototype.call = function (fn, args, kw, line) {
    if (fn instanceof Builtin) {
      if (fn.name !== "print" && Object.keys(kw).length) throw err("TypeError", fn.name + "() takes no keyword arguments", line);
      return fn.fn(args, kw);
    }
    if (fn instanceof BoundMethod) return fn.fn(args, kw);
    if (fn instanceof PyFunc) {
      if (Object.keys(kw).length) throw err("TypeError", "keyword arguments are not supported for functions in this notebook", line);
      if (args.length > fn.params.length) {
        throw err("TypeError", fn.name + "() takes " + fn.params.length + " positional argument" + (fn.params.length === 1 ? "" : "s") + " but " + args.length + (args.length === 1 ? " was" : " were") + " given", line);
      }
      if (args.length < fn.params.length) {
        var miss = fn.params.slice(args.length).map(function (p) { return "'" + p + "'"; }), list;
        if (miss.length === 1) list = miss[0];
        else if (miss.length === 2) list = miss[0] + " and " + miss[1];
        else list = miss.slice(0, -1).join(", ") + ", and " + miss[miss.length - 1];
        throw err("TypeError", fn.name + "() missing " + miss.length + " required positional argument" + (miss.length === 1 ? "" : "s") + ": " + list, line);
      }
      if (this.depth > 200) throw err("RecursionError", "maximum recursion depth exceeded", line);
      var local = Object.create(null);
      fn.params.forEach(function (p, i) { local[p] = args[i]; });
      this.depth++;
      try { this.execBlock(fn.body, local); }
      catch (e) { if (e instanceof ReturnSignal) return e.value; throw e; }
      finally { this.depth--; }
      return None;
    }
    throw err("TypeError", "'" + typeName(fn) + "' object is not callable", line);
  };

  Kernel.prototype.assign = function (t, v, scope, line) {
    var self = this;
    if (t.k === "name") { (scope || this.globals)[t.name] = v; return; }
    if (t.k === "index") {
      var obj = this.evalNode(t.obj, scope), idx = this.evalNode(t.idx, scope);
      if (isList(obj)) { obj[normIndex(idx, obj.length, "list assignment")] = v; return; }
      if (isStr(obj)) throw err("TypeError", "'str' object does not support item assignment", line);
      if (isTuple(obj)) throw err("TypeError", "'tuple' object does not support item assignment", line);
      throw err("TypeError", "'" + typeName(obj) + "' object does not support item assignment", line);
    }
    if (t.k === "tuple") {
      var items = iterate(v);
      if (items.length !== t.items.length) {
        if (items.length > t.items.length) throw err("ValueError", "too many values to unpack (expected " + t.items.length + ")", line);
        throw err("ValueError", "not enough values to unpack (expected " + t.items.length + ", got " + items.length + ")", line);
      }
      t.items.forEach(function (x, i) { self.assign(x, items[i], scope, line); });
    }
  };

  Kernel.prototype.execBlock = function (body, scope) {
    for (var i = 0; i < body.length; i++) this.exec(body[i], scope);
  };

  Kernel.prototype.exec = function (s, scope) {
    var self = this;
    this.tick(s.line);
    try {
      switch (s.k) {
        case "seq": this.execBlock(s.body, scope); return;
        case "expr": this.evalNode(s.value, scope); return;
        case "assign":
          var v = this.evalNode(s.value, scope);
          s.targets.forEach(function (t) { self.assign(t, v, scope, s.line); });
          return;
        case "aug":
          var cur = this.evalNode(s.target, scope), rhs = this.evalNode(s.value, scope), nv;
          if (s.op === "+" && isList(cur)) { iterate(rhs).forEach(function (x) { cur.push(x); }); nv = cur; }
          else nv = binop(s.op, cur, rhs);
          this.assign(s.target, nv, scope, s.line);
          return;
        case "pass": return;
        case "break": throw new BreakSignal();
        case "continue": throw new ContinueSignal();
        case "return":
          if (this.depth === 0) throw err("SyntaxError", "'return' outside function", s.line);
          throw new ReturnSignal(s.value ? this.evalNode(s.value, scope) : None);
        case "def":
          (scope || this.globals)[s.name] = new PyFunc(s.name, s.params, s.body, this);
          return;
        case "if":
          if (truthy(this.evalNode(s.cond, scope))) this.execBlock(s.body, scope);
          else this.execBlock(s.orelse, scope);
          return;
        case "while":
          while (truthy(this.evalNode(s.cond, scope))) {
            this.tick(s.line);
            try { this.execBlock(s.body, scope); }
            catch (e) { if (e instanceof BreakSignal) break; if (e instanceof ContinueSignal) continue; throw e; }
          }
          return;
        case "for":
          var items = iterate(this.evalNode(s.iter, scope));
          for (var i = 0; i < items.length; i++) {
            this.tick(s.line);
            this.assign(s.target, items[i], scope, s.line);
            try { this.execBlock(s.body, scope); }
            catch (e2) { if (e2 instanceof BreakSignal) break; if (e2 instanceof ContinueSignal) continue; throw e2; }
          }
          return;
      }
    } catch (e) {
      if (e instanceof PyError && e.line === undefined) e.line = s.line;
      throw e;
    }
  };

  function checkLoops(body, inLoop, inDef) {
    body.forEach(function (s) {
      if ((s.k === "break" || s.k === "continue") && !inLoop) throw err("SyntaxError", "'" + s.k + "' outside loop", s.line);
      if (s.k === "return" && !inDef) throw err("SyntaxError", "'return' outside function", s.line);
      if (s.k === "seq") checkLoops(s.body, inLoop, inDef);
      if (s.k === "if") { checkLoops(s.body, inLoop, inDef); checkLoops(s.orelse, inLoop, inDef); }
      if (s.k === "while" || s.k === "for") checkLoops(s.body, true, inDef);
      if (s.k === "def") checkLoops(s.body, false, true);
    });
  }

  // Run one cell. Returns { stdout, value (repr or null), error ("Type: msg" or null),
  // errorType, line, count }.
  Kernel.prototype.run = function (src, opts) {
    opts = opts || {};
    this.out = ""; this.steps = 0; this.depth = 0;
    var count = ++this.count;
    var result = { stdout: "", value: null, error: null, errorType: null, line: null, count: count };
    try {
      var prog = new Parser(tokenize(src)).program();
      checkLoops(prog, false, false);
      var last = prog.length && prog[prog.length - 1].k === "expr" && opts.display !== false ? prog.pop() : null;
      this.execBlock(prog, null);
      if (last) {
        this.tick(last.line);
        var v = this.evalNode(last.value, null);
        if (v !== None) result.value = repr(v);
      }
    } catch (e) {
      if (e instanceof PyError) {
        result.error = e.type === "StepLimit" || e.type === "OutputLimit" ? e.msg : e.type + ": " + e.msg;
        result.errorType = e.type; result.line = e.line || null;
      } else if (e instanceof BreakSignal || e instanceof ContinueSignal) {
        result.error = "SyntaxError: 'break' outside loop"; result.errorType = "SyntaxError";
      } else if (e instanceof RangeError) {
        result.error = "RecursionError: maximum recursion depth exceeded"; result.errorType = "RecursionError";
      } else throw e;
    }
    result.stdout = this.out;
    return result;
  };

  var MiniPy = { Kernel: Kernel, repr: repr, floatRepr: floatRepr, tokenize: tokenize };
  if (typeof module !== "undefined" && module.exports) module.exports = MiniPy;
  root.MiniPy = MiniPy;
})(typeof self !== "undefined" ? self : this);

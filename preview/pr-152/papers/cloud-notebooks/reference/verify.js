// Compares MiniPy with CPython 3.13 on every notebook session in minipy-cases.json.
// Regenerate the reference with:  python3 cpython_ref.py minipy-cases.json cpython-reference.json
// Run:  node verify.js
var fs = require("fs"), path = require("path");
var MiniPy = require(path.join(__dirname, "..", "minipy.js"));
var cases = JSON.parse(fs.readFileSync(path.join(__dirname, "minipy-cases.json")));
var ref = JSON.parse(fs.readFileSync(path.join(__dirname, "cpython-reference.json")));
var cells = 0, bad = 0;
cases.forEach(function (c, i) {
  var k = new MiniPy.Kernel();
  c.cells.forEach(function (src, j) {
    cells++;
    var r = k.run(src), want = ref[i].cells[j];
    var got = { stdout: r.stdout, value: r.value, error: r.error };
    // On an error, CPython keeps what was printed before it; so does MiniPy.
    if (got.stdout !== want.stdout || got.value !== want.value || got.error !== want.error) {
      bad++;
      console.log("MISMATCH", c.name, "cell", j, "\n  minipy ", JSON.stringify(got), "\n  cpython", JSON.stringify(want));
    }
  });
});
console.log(cells + " cells in " + cases.length + " sessions; " + (cells - bad) + " match CPython exactly, " + bad + " differ");
process.exit(bad ? 1 : 0);

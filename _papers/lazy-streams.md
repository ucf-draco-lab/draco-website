---
title: "Lazy Streams in C++: Computing Only What Is Asked For"
kicker: "Interactive paper · Morehead Electronic Journal of Applicable Mathematics 2005"
subtitle: "An interactive companion to David Renz and Mike Borowczak's honors project, which builds infinite, on-demand sequences in C++ out of small objects that each know one number and how to make the next."
description: "Read lazy streams one token at a time, watch the paper's generalized Hamming stream feed on itself, race an eager evaluation that never returns against a lazy one that does, fill a Stirling-number table from a single stream, and topologically sort a graph as a stream, all with a JavaScript port of the paper's C++ classes."
share_description: "Some sequences never end, yet a program can still hand you the next number the moment you ask. A 2005 honors project shows how to build such lazy streams in plain C++. Try the paper's streams in your browser, written for five reading levels."
share_text: "An endless sequence, computed one number at a time, only when asked. Try the paper's lazy streams in your browser:"
share_image: /papers/lazy-streams/share.png
share_image_alt: "The first tokens of the Hamming stream for the primes 3, 5, and 11 above a tree of Merge and Times stream objects, under the title Lazy Streams in C++."
date: 2026-10-20
topics: ["Programming languages"]
default_level: public
level_hints:
  public: No background needed
  hs: Sequences, multiples, and a little coding
  ug: Classes, recursion, and data structures
  grad: Evaluation strategies and their cost
  res: Full method, reproduction, and open questions
authors:
  - name: David O. Renz
    affiliation: University of Cincinnati
  - name: Mike Borowczak
    affiliation: University of Cincinnati
    member: mike-borowczak
sources:
  - venue: "Morehead Electronic Journal of Applicable Mathematics, Issue 4 (COSC-2005-01) · 2005"
    title: "Implementing Lazy Streams in C++"
    url: https://scholarworks.moreheadstate.edu/mejam_archives/5
    access: Open access
citations:
  - renz2005implementing
widget:
  css:
    - /papers/lazy-streams/widget.css
  js:
    - /papers/lazy-streams/stream-engine.js
    - /papers/lazy-streams/widget.js
credit: "Interactive page by the [DRACO Lab](/). The browser engine (`stream-engine.js`) ports the paper's C++ classes (Stream, Successor, Times, Merge, List, Hamming, Stirling2, Topo, and Vertex) one constructor and one `tail()` at a time. It was checked against a compiled C++ reconstruction of the paper's listings on 410 cases (every figure's example, Hamming streams over 11 prime lists at up to 150 tokens, Stirling tables up to 12 rows, and 301 dependency graphs, 63 of them with cycles): identical tokens, identical cycle reports, and identical counts of every class of object constructed. The page reproduces the paper's printed results: the first ten Hamming tokens for 3, 5, and 11, all eight rows of the Stirling table in Fig. 7.1, and the order d, c, a, e, f, b for the graph of Fig. 7.3. Object counts and the memoized comparison are this page's own measurements. Everything runs on your device."
bibtex: |
  @article{renz2005implementing,
    author  = {Renz, David O. and Borowczak, Mike},
    title   = {Implementing Lazy Streams in {C++}},
    journal = {Morehead Electronic Journal of Applicable Mathematics},
    number  = {4},
    note    = {COSC-2005-01},
    year    = {2005},
    url     = {https://scholarworks.moreheadstate.edu/mejam_archives/5}
  }
---

<div class="lede" data-levels="public" markdown="1">
Some lists never end: the counting numbers, the multiples of five, every number built only from the primes 3, 5, and 11. A computer cannot store an endless list, yet it can still hand over the next number the moment someone asks for it, and do no work before then. That habit is called lazy evaluation. In 2005, two University of Cincinnati students, David Renz and Mike Borowczak, showed how to write such "lazy streams" in C++, a language that normally computes everything right away. Their trick: each stream is a small object that knows one number and how to build the object that knows the next.
</div>

<div class="lede" data-levels="hs" markdown="1">
A stream is a sequence of numbers read one at a time, from a producer to a consumer. An eager producer computes the whole sequence first; a lazy producer computes each number only when the consumer asks. Renz and Borowczak's test case is Hamming's problem: list, in increasing order, every number whose prime factors all come from a given list. For the primes 3, 5, and 11 the sequence starts 3, 5, 9, 11, 15, 25, 27, 33, 45, 55 and never stops. A short program in the language Haskell solves it in a few lines; the same program translated directly into C++ never finishes. The paper shows how to write it in C++ so that it works.
</div>

<div class="lede" data-levels="ug" markdown="1">
Haskell evaluates lazily, so a recursive definition of an infinite list runs fine as long as the consumer asks for finitely many elements. C++ evaluates arguments eagerly, so the same recursion descends forever. Renz and Borowczak model a lazy stream as an object with a public `head` and a virtual `tail()` that returns a new stream object. A closure becomes a class whose members hold the function's environment (the multiplier, the input stream, the remaining primes). From this one pattern they build `Successor`, `Times`, `Merge`, `List`, a generalized `Hamming` stream, a Stirling-number stream, and a topological sort that emits one vertex per `tail()`.
</div>

<div class="lede" data-levels="grad" markdown="1">
The paper encodes call-by-need streams in C++ without libraries such as FC++: every stream is an immutable object whose constructor computes the head eagerly and whose `tail()` allocates the successor stream. Recursion through `this` (a Hamming stream passes itself to a `Times` filter) gives the self-referential definitions that make Hamming's problem a two-line specification. The authors note the two places the encoding departs from Haskell: heads are computed at construction, so the streams are not fully lazy, and nothing is garbage collected. This page runs the classes live, measures what they cost, and compares them with a memoized version that shares computed tails the way a Haskell list does.
</div>

<div class="lede" data-levels="res" markdown="1">
Renz and Borowczak (MEJAM Issue 4, 2005) present a coding style for lazy streams in C++: one class per stream operator, eager heads, and fresh objects from `tail()`. They demonstrate it on the generalized Hamming problem (Figs. 2.13 and 2.14), Stirling numbers of the second kind (Figs. 3.1, 3.2, and 7.1), and topological sort (Figs. 3.4, 3.5, and 7.3 to 7.5). The paper reports outputs and no measurements. This page ports every class, checks the port against a compiled reconstruction of the listings (tokens and per-class constructor counts on 410 cases), reproduces the three printed results, and adds what the listings imply but the text does not state: the cost of recomputation without sharing, duplicate handling in `Merge`, 32-bit overflow of `int` heads, and the behavior of `Topo` on cyclic input.
</div>

## One token at a time

<div id="ls-pull" class="w-demo"></div>

<div data-levels="public" markdown="1">
Press **Read one token** a few times. Each press asks the stream for one more number, and the stream does just enough work to answer. The dashed number at the end is already waiting: the stream always knows its next number, and nothing past that. **Count up** produces 1, 2, 3, and so on forever. **Merge 2s and 3s** blends the even numbers with the multiples of three in order, and the orange numbers show where both sides offer the same value, so it appears twice.
</div>

<div data-levels="hs" markdown="1">
The boxes show the objects working behind the next number. **Times 5** is a filter: it reads from a counter and multiplies each number by five. **Merge** reads from two increasing streams and always passes along the smaller head. **One counter, two readers** feeds a single counter into both a Times filter and the Merge itself, so the output is 1, 2, 2, 3, 4, 4, and so on: every number from the counter, plus every double. The count of objects built grows by only a few with each read.
</div>

<div data-levels="ug grad res" markdown="1">
The four presets are the paper's Figs. 2.4, 2.6, 2.8, and 2.10. A read takes `head` and replaces the stream with `tail()`, as in the consumer of Fig. 2.3, which calls `tail()` after every token it prints. `Times` builds `new Times(multiplier, inStream->tail())`; `Merge` builds `new Merge(branch1->tail(), branch2)`, advancing only the branch that supplied the head. On equal heads `Merge` takes its second argument first and keeps the first argument's equal token, so duplicates survive (6, 6 and 12, 12 in Fig. 2.8). Sharing one `Successor` in Fig. 2.10 is safe because no stream object ever changes after construction: each reader advances by building its own successors.
</div>

## Hamming's problem: a stream that feeds itself

<div id="ls-hamming" class="w-demo"></div>

<div data-levels="public" markdown="1">
This stream lists every number you can make by multiplying together the chosen primes, as many times as you like, in increasing order. Start with 3, 5, and 11 (the paper's example) and read ten numbers: they match the list printed in the paper. Then toggle primes on and off. With only 2 the stream doubles forever; with 2, 3, and 5 it gives the classic Hamming numbers (without their leading 1): 2, 3, 4, 5, 6, 8, 9, 10, 12, and so on.
</div>

<div data-levels="hs" markdown="1">
The small print under each number is its prime factorization. The stream works by a recursive rule: the Hamming numbers for 3, 5, and 11 are 3, followed by a merge of two streams, three times every Hamming number for 3, 5, and 11, and the Hamming numbers for 5 and 11 alone. The stream uses its own output to make more of its output. Each number therefore appears exactly once, as long as the list holds distinct primes.
</div>

<div data-levels="ug" markdown="1">
`Hamming::tail()` returns `new Merge(new Times(p->head, this), new Hamming(p->tail()))`. Passing `this` makes the stream its own input: the `Times` filter multiplies the Hamming stream it belongs to. The tree shows the live objects behind the next token, three levels deep, with the path of the next token highlighted. A `Hamming` over an empty prime list is empty, so the last `Merge` in the chain falls through to its `Times` branch, which is how the paper's `Merge` handles one empty input.
</div>

<div data-levels="grad res" markdown="1">
The chart counts constructor calls while reading *n* tokens, once with the paper's classes and once with a memoized stream in which each node computes its tail once and keeps it (the sharing a Haskell list gets for free). Both produce identical tokens. The paper's version recomputes: each `Times` over `this` walks its own copy of the stream it multiplies, rebuilding tokens the consumer has already seen. With one prime the count is exactly quadratic, and with three primes it grows as roughly *n*<sup>1.3</sup>, while the memoized version stays near two objects per token. Tokens above 2,147,483,647 are flagged: the paper's `head` is an `int`, and the compiled C++ wraps there (the stream for 2 alone prints −2,147,483,648 as its 31st token on a common compiler, then zeros).
</div>

## Why C++ needs the trick

<div id="ls-eager" class="w-demo"></div>

<div data-levels="public" markdown="1">
Press **Run both**. The left side tries to compute the whole endless list before handing over anything. To get the list it needs three times the list, which needs three times the list again, and so on; it digs deeper forever and never produces a single number. The right side hands over a number at every step. Lazy evaluation turns an impossible job into a series of small ones.
</div>

<div data-levels="hs ug" markdown="1">
The paper's Fig. 1.2 draws this as a tree of calls. Each `hamming` node has two children: the times branch on the left and the remaining primes on the right. An eager program evaluates every argument before calling a function, so it always expands the left child first, and the left child is another copy of the same problem. A lazy program stops after computing the head and leaves both children as unfinished promises until a consumer asks.
</div>

<div data-levels="grad res" markdown="1">
Under call-by-value the definition `hamming (p:ps) = p : merge (times p (hamming (p:ps))) (hamming ps)` diverges because the argument `hamming (p:ps)` is the expression being defined. The paper's encoding delays it by making the recursive call inside `tail()` rather than in the constructor, which corresponds to wrapping each tail in a thunk. The heads are still strict: constructing a stream computes its first token, which the authors name as the reason the streams are not fully lazy. The left lane is a schematic of the eager call chain, drawn by the page; the right lane runs the paper's classes.
</div>

## Stirling numbers from a single stream

<div id="ls-stirling" class="w-demo"></div>

<div data-levels="public" markdown="1">
Each number counts the ways to split a group of *n* friends into *m* teams, with nobody left out and no empty team. Four friends can form two teams in seven ways. Press **Next number** to fill the table one cell at a time; the whole table comes from one stream that walks along each row and then jumps to the next. Fill eight rows and the last row matches the paper's printout: 1, 127, 966, 1,701, 1,050, 266, 28, 1.
</div>

<div data-levels="hs" markdown="1">
Each new number comes from two numbers in the row above: S(*n*, *m*) = S(*n* − 1, *m* − 1) + *m* × S(*n* − 1, *m*). The two highlighted cells are the ones that went into the latest number. The reasoning: the newest friend either forms a team alone (the first term) or joins one of the *m* teams already formed by the others (the second term, times *m*). The edges of the table are 1: one team, or everyone alone.
</div>

<div data-levels="ug grad res" markdown="1">
`Stirling2(m, n)` takes the number of groups first and the number of elements second; the page writes S(*n*, *m*) with rows as *n*. Its constructor sets the head to 1 on the diagonal and resets *m* to 0 and increments *n*, so the next `tail()` (`new Stirling2(m + 1, n)`) starts the following row; that one branch is what lets a single stream walk a triangle. Off the edges, the constructor builds two fresh `Stirling2` objects for the two terms, which build their own, with no table of earlier results. Eight rows (36 cells) cost 475 constructions, 10 rows 1,992, and 12 rows 8,113 (this page's counts).
</div>

## Topological sort as a stream

<div id="ls-topo" class="w-demo"></div>

<div data-levels="public" markdown="1">
Each circle is a task, and an arrow means "do this first." Getting dressed works the same way: socks before shoes. Press **Next vertex** to ask the stream for the next task that has nothing left blocking it. The paper's example comes out d, c, a, e, f, b. **Add a cycle** makes two tasks wait on each other; no order can work, and the stream says so.
</div>

<div data-levels="hs" markdown="1">
The stream checks the tasks in the order they are listed. For each unfinished task, it follows that task's requirements back until it finds one with nothing unfinished in front of it, and hands that one over. **Same graph, names reordered** keeps every arrow but lists the tasks in a different order: the answer changes to d, c, a, e, b, f, and it is still correct. Many problems have more than one right answer.
</div>

<div data-levels="ug grad res" markdown="1">
`Topo`'s constructor scans its vertex array; for the first vertex not yet `done`, it sets that vertex's `error` flag, builds a nested `Topo` over the vertex's dependencies, and clears the flag. If the nested stream is empty, the vertex itself is the head; otherwise the nested head (a dependency found depth first) is. The head is marked `done`, and `tail()` simply builds a new `Topo` over the same array, which rescans from the start. Reaching a vertex whose `error` flag is still set means the search has come back around a cycle; the C++ prints "A cycle was found" and exits, which this page shows as the end of the stream. The trace line lists the vertices the last `tail()` visited. The input format is the paper's (Figs. 7.3 and 7.5).
</div>

## What the paper found

<div data-levels="public" markdown="1">
- Lazy streams can be written in C++, a language that normally computes everything immediately, by packaging each step as a small object.
- The resulting programs read almost like the mathematical definitions they come from.
- The same pattern handles endless sequences, a table of numbers, and putting tasks in a workable order.
</div>

<div data-levels="hs" markdown="1">
- A direct translation of the three-line Haskell solution to Hamming's problem never finishes in C++, because C++ computes every argument first.
- Writing each stream as an object with a current number and a "make the next one" function fixes this.
- The generalized Hamming stream for 3, 5, and 11 produces 3, 5, 9, 11, 15, 25, 27, 33, 45, 55, and onward without end.
- One stream can fill the whole Stirling table row by row, and another can list the vertices of a graph in a valid order.
</div>

<div data-levels="ug grad res" markdown="1">
- **A closure is a class.** The function's local environment becomes member variables, and the deferred computation becomes a virtual `tail()`.
- **Infinite, self-referential streams work.** `Hamming` passes `this` to `Times`, so the specification and the implementation have the same shape.
- **One producer can feed many consumers.** Because stream objects never change, a `Successor` can feed both a `Times` and a `Merge` (Fig. 2.10).
- **The style generalizes beyond integers.** Stirling numbers come from one stream that walks a triangle; topological sort emits `void *` heads (Fig. 7.2) and stops on cycles.
- **Two limits, stated by the authors.** Each constructor computes its head eagerly, so the streams are not fully lazy, and no memory is reclaimed.
</div>

<div data-levels="grad res" markdown="1">
<div class="ls-table-wrap">
<table class="results-table">
<caption class="w-note">The paper's printed results and this page's values (the page's from the ported classes).</caption>
<thead><tr><th>Result</th><th>Paper</th><th>This page</th></tr></thead>
<tbody>
<tr><td>Hamming [3, 5, 11], first ten tokens (Section 1)</td><td>3, 5, 9, 11, 15, 25, 27, 33, 45, 55</td><td>identical</td></tr>
<tr><td>Stirling table, rows 1 to 8 (Fig. 7.1)</td><td>row 8: 1, 127, 966, 1,701, 1,050, 266, 28, 1</td><td>all 36 cells identical</td></tr>
<tr><td>Topological order for Fig. 3.3 / Fig. 7.3</td><td>d, c, a, e, f, b</td><td>identical</td></tr>
<tr><td>Constructions for ten Hamming [3, 5, 11] tokens</td><td>not reported</td><td>70 (19 Times, 29 Merge, 11 Hamming, 11 List)</td></tr>
<tr><td>Constructions for the eight-row Stirling table</td><td>not reported</td><td>475</td></tr>
</tbody>
</table>
</div>
</div>

## Why it matters

<div data-levels="public hs" markdown="1">
Lazy evaluation shows up far from this paper: a video that streams instead of downloading first, a feed that loads the next post as you scroll, a spreadsheet that recalculates only the cells you changed. Each one does the work at the moment it is needed. This undergraduate project shows that the idea does not belong to any one language; with a clear pattern, a programmer can bring it into a language that was never designed for it. Ultimately, the paper is a lesson in reading a specification closely enough to make it run.
</div>

<div data-levels="ug" markdown="1">
The pattern in this paper predates the tools modern C++ now ships for the same job: lambdas with captures (C++11), coroutine generators (C++20 and `std::generator` in C++23), and lazy range views. Writing the closures out by hand as classes makes visible what those features hide: where the environment lives, when the next value is computed, and who owns each object. That visibility is why the paper still works as a teaching example for data structures and programming-language courses.
</div>

<div data-levels="grad res" markdown="1">
The contribution is a small, general recipe (one class per stream operator, strict heads, immutable nodes, deferred tails) applied to three classic problems, with no runtime support beyond virtual dispatch. Its costs are the ones a reader should expect from call-by-name without sharing: repeated work wherever a definition refers to itself, and unbounded allocation without collection. Both are fixable inside the same style (a cached tail pointer gives call-by-need; reference counting reclaims dead nodes), which makes the paper a clean starting point for discussing evaluation strategies.
</div>

<div data-levels="res" markdown="1">
## Notes from building this page

- **Recomputation without sharing.** The paper's `Hamming` builds fresh objects every time a `Times` filter advances through `this`, so the consumer's stream and each filter's view of it are computed separately. Counting every constructor, ten tokens of Hamming [3, 5, 11] cost 70 objects, 100 tokens 1,403, and 1,000 tokens 29,477; a memoized version (each node keeps its computed tail) costs 27, 224, and 2,110 with identical output. With a single prime the paper-style `Times` count is exactly *n*(*n* + 1)/2. These are the page's measurements; the paper reports none.
- **Duplicates.** `Merge` keeps equal tokens from both inputs (Fig. 2.8 yields 6, 6 and 12, 12). The generalized Hamming stream never generates a duplicate when the list holds distinct primes, but a list such as [2, 4] produces 2, 4, 4, 8, 8, 16, 16, 16.
- **Integer overflow.** `head` is an `int`. Compiled with GCC, Hamming [2] prints −2,147,483,648 as its 31st token and zeros afterward, and Hamming [3] goes negative at its 20th. The page shows exact values and marks tokens above 2,147,483,647 at this level.
- **Stirling cost.** `Stirling2`'s constructor recomputes both terms from scratch, so filling *r* rows costs 475 constructions for 8 rows, 1,992 for 10, and 8,113 for 12.
- **Topo details.** Each `tail()` rescans the vertex array from the start, so a sort of *V* vertices performs *V* + 1 scans, each with a depth-first search. A cycle is reported only when the search reaches it, so a graph whose cycle lies behind acyclic vertices prints part of an order before "A cycle was found"; all 63 cyclic test graphs behaved identically in the port and the compiled reconstruction. The output order depends on the order of names in the file (the reordered preset gives d, c, a, e, b, f).
- **Undefined corners.** A `Merge` of two empty streams reads `head` from an empty branch, and `tail()` on an empty stream is never guarded; the paper's consumers stop before either matters, and so does this page.
- **Argument order.** `Stirling2(m, n)` takes the number of groups before the number of elements, the reverse of the common S(*n*, *k*) notation; the page labels its table by rows *n* and columns *m* to match Fig. 7.1.
- **How the port was checked.** No source files accompany the paper, so the reference was a C++ program reconstructed from the paper's listings, compiled with GCC, and instrumented to count constructions. The JavaScript port matched it token for token and count for count on 410 cases when set to wrap arithmetic at 32 bits.
</div>

<div data-levels="hs" markdown="1">
## Try this in class

1. By hand, list the first 12 numbers whose only prime factors are 2 and 3. Then set the second demo to 2 and 3 and compare. Which numbers did you almost miss?
2. Write the rule S(*n*, *m*) = S(*n* − 1, *m* − 1) + *m* × S(*n* − 1, *m*) on the board and fill the first five rows of the table as a class. Check the result with the fourth demo, then split four classmates into two teams and count the seven ways.
3. List five chores with at least two "must happen first" rules among them, draw the arrows, and find two different valid orders. Then add one rule that makes the list impossible, and explain why no order can work.
</div>

/* Interactive paper listings outside the paper pages.
 *
 * [data-paper-gallery] (Research page): a small grid of the most viewed papers
 * (data-views, from _data/views.yaml) plus a few random picks. The markup lists
 * every paper newest first with the first few visible, so it works without
 * JavaScript; this script chooses which tiles show and labels them.
 *
 * [data-paper-browse] (/papers/): search, topic filter, and sort controls for
 * the full list, kept in ?q=, ?topic= and ?sort= so a view can be linked.
 */
(function () {
  "use strict";

  var toArray = function (list) { return Array.prototype.slice.call(list); };
  var viewsOf = function (el) { return parseInt(el.getAttribute("data-views"), 10) || 0; };

  var shuffled = function (list) {
    var a = list.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  };

  /* ---------- Research page gallery ---------- */

  var gallery = document.querySelector("[data-paper-gallery]");
  if (gallery) {
    var grid = gallery.querySelector(".paper-gallery-grid");
    var tiles = toArray(grid.children);
    var nTop = parseInt(gallery.getAttribute("data-top"), 10) || 3;
    var nRandom = parseInt(gallery.getAttribute("data-random"), 10) || 3;
    var hasViews = tiles.some(function (li) { return viewsOf(li) > 0; });
    var shuffleButton = gallery.querySelector("[data-gallery-shuffle]");

    // The top slots: most viewed when counts exist, else the newest (markup
    // order). Shuffling first breaks view-count ties differently each visit.
    var top = hasViews
      ? shuffled(tiles).sort(function (a, b) { return viewsOf(b) - viewsOf(a); }).slice(0, nTop)
      : tiles.slice(0, nTop);
    var rest = tiles.filter(function (li) { return top.indexOf(li) < 0; });

    var label = function (li, text) {
      var badge = li.querySelector(".paper-tile-badge");
      badge.textContent = text;
      badge.hidden = !text;
    };

    var draw = function () {
      var picks = shuffled(rest).slice(0, nRandom);
      tiles.forEach(function (li) { li.hidden = true; label(li, ""); });
      top.forEach(function (li) {
        li.hidden = false;
        label(li, hasViews ? "Most viewed" : "New");
        grid.appendChild(li);
      });
      picks.forEach(function (li) {
        li.hidden = false;
        label(li, "Random pick");
        grid.appendChild(li);
      });
    };

    draw();
    if (rest.length > nRandom && shuffleButton) {
      shuffleButton.hidden = false;
      shuffleButton.addEventListener("click", draw);
    }
  }

  /* ---------- /papers/ sort and filter ---------- */

  var browse = document.querySelector("[data-paper-browse]");
  var list = document.querySelector("[data-browse-list]");
  if (browse && list) {
    var items = toArray(list.children);
    var search = browse.querySelector("[data-browse-q]");
    var sortSelect = browse.querySelector("[data-browse-sort]");
    var topicButtons = toArray(browse.querySelectorAll("[data-browse-topic]"));
    var status = browse.querySelector("[data-browse-status]");
    var empty = document.querySelector("[data-browse-empty]");
    var reset = document.querySelector("[data-browse-reset]");
    var anyViews = items.some(function (li) { return viewsOf(li) > 0; });

    // Without view counts (previews, forks, before the first fetch) "Most
    // viewed" would just be date order, so leave it out.
    if (!anyViews) {
      toArray(sortSelect.querySelectorAll("[data-needs-views]")).forEach(function (o) { o.remove(); });
    }

    // Text to search, and the latest publication year named in the kicker.
    var meta = new Map();
    items.forEach(function (li) {
      var kicker = li.querySelector(".paper-index-meta");
      var years = (kicker ? kicker.textContent : "").match(/\b(19|20)\d{2}\b/g) || [];
      meta.set(li, {
        text: li.textContent.replace(/\s+/g, " ").toLowerCase(),
        year: years.length ? Math.max.apply(null, years.map(Number)) : 0,
        title: li.getAttribute("data-title") || "",
        added: li.getAttribute("data-added") || ""
      });
    });

    var state = { q: "", topic: "", sort: "added" };
    var randomOrder = null;

    var validSort = function (s) {
      return toArray(sortSelect.options).some(function (o) { return o.value === s; });
    };
    var validTopic = function (t) {
      return topicButtons.some(function (b) { return b.getAttribute("data-browse-topic") === t; });
    };

    var readUrl = function () {
      var params = new URLSearchParams(window.location.search);
      state.q = params.get("q") || "";
      state.topic = validTopic(params.get("topic") || "") ? params.get("topic") || "" : "";
      state.sort = validSort(params.get("sort") || "") ? params.get("sort") : "added";
    };

    var writeUrl = function () {
      var params = new URLSearchParams(window.location.search);
      [["q", state.q], ["topic", state.topic], ["sort", state.sort === "added" ? "" : state.sort]]
        .forEach(function (kv) { if (kv[1]) params.set(kv[0], kv[1]); else params.delete(kv[0]); });
      var query = params.toString();
      try {
        history.replaceState(null, "", window.location.pathname + (query ? "?" + query : "") + window.location.hash);
      } catch (err) { /* file:// previews */ }
    };

    var compare = {
      added: function (a, b) { return meta.get(b).added.localeCompare(meta.get(a).added); },
      popular: function (a, b) { return viewsOf(b) - viewsOf(a); },
      year: function (a, b) { return meta.get(b).year - meta.get(a).year; },
      title: function (a, b) { return meta.get(a).title.localeCompare(meta.get(b).title); }
    };

    var render = function () {
      // Sort from a fixed base order so ties keep the newest-first listing
      // (Array.prototype.sort is stable).
      var order;
      if (state.sort === "random") {
        randomOrder = randomOrder || shuffled(items);
        order = randomOrder;
      } else {
        randomOrder = null;
        order = items.slice().sort(compare.added);
        if (state.sort !== "added") order.sort(compare[state.sort]);
      }

      var words = state.q.toLowerCase().split(/\s+/).filter(Boolean);
      var shown = 0;
      order.forEach(function (li) {
        var m = meta.get(li);
        var match = (!state.topic || li.getAttribute("data-topics").indexOf(" " + state.topic + " ") >= 0) &&
          words.every(function (w) { return m.text.indexOf(w) >= 0; });
        li.hidden = !match;
        if (match) shown++;
        list.appendChild(li);
      });

      topicButtons.forEach(function (b) {
        var on = b.getAttribute("data-browse-topic") === state.topic;
        b.setAttribute("aria-pressed", on ? "true" : "false");
        if (on) b.setAttribute("data-active", ""); else b.removeAttribute("data-active");
      });
      sortSelect.value = state.sort;
      if (search.value !== state.q) search.value = state.q;

      status.textContent = shown === items.length
        ? "Showing all " + items.length + " papers"
        : "Showing " + shown + " of " + items.length + " papers";
      empty.hidden = shown > 0;
    };

    var update = function () { writeUrl(); render(); };

    search.addEventListener("input", function () { state.q = search.value; update(); });
    sortSelect.addEventListener("change", function () {
      state.sort = sortSelect.value;
      randomOrder = null;
      update();
    });
    topicButtons.forEach(function (b) {
      b.addEventListener("click", function () { state.topic = b.getAttribute("data-browse-topic"); update(); });
    });
    if (reset) {
      reset.addEventListener("click", function () { state.q = ""; state.topic = ""; update(); search.focus(); });
    }

    readUrl();
    browse.hidden = false;
    render();
  }
})();

/*
  Paper kit: reading-level switch, share links, and copy buttons for every
  page in the _papers collection. Widgets subscribe with
    document.addEventListener("paperlevel", e => e.detail.level)
  and can read the current level from window.PaperKit.level().
*/
(function () {
  "use strict";

  var article = document.querySelector(".paper");
  if (!article) return;

  var options = Array.prototype.slice.call(article.querySelectorAll("[data-set-level]"));
  var known = options.map(function (b) { return b.getAttribute("data-set-level"); });
  var fallback = article.getAttribute("data-default-level") || known[0];
  var STORE = "paper-level";

  function store(key, value) {
    try {
      if (value === undefined) return window.localStorage.getItem(key);
      window.localStorage.setItem(key, value);
    } catch (err) { return null; }
    return null;
  }

  function fromUrl() {
    try { return new URL(window.location.href).searchParams.get("level"); }
    catch (err) { return null; }
  }

  function current() { return article.getAttribute("data-level") || fallback; }

  // Address to share: this page plus the level, when it differs from the default.
  function shareUrl() {
    var url = new URL(window.location.href);
    url.hash = "";
    url.search = "";
    var level = current();
    if (level !== fallback) url.searchParams.set("level", level);
    return url.toString();
  }

  function setLevel(level, opts) {
    opts = opts || {};
    if (known.indexOf(level) < 0) level = fallback;
    article.setAttribute("data-level", level);
    options.forEach(function (b) {
      var on = b.getAttribute("data-set-level") === level;
      b.setAttribute("aria-checked", on ? "true" : "false");
      b.tabIndex = on ? 0 : -1;
    });
    if (opts.remember !== false) store(STORE, level);
    if (opts.updateUrl !== false) {
      try {
        var url = new URL(window.location.href);
        if (level === fallback) url.searchParams.delete("level");
        else url.searchParams.set("level", level);
        window.history.replaceState(null, "", url.toString());
      } catch (err) { /* file:// previews */ }
    }
    refreshShareLinks();
    document.dispatchEvent(new CustomEvent("paperlevel", { detail: { level: level } }));
  }

  options.forEach(function (b, i) {
    b.addEventListener("click", function () { setLevel(b.getAttribute("data-set-level")); });
    b.addEventListener("keydown", function (e) {
      var step = (e.key === "ArrowRight" || e.key === "ArrowDown") ? 1
        : (e.key === "ArrowLeft" || e.key === "ArrowUp") ? -1 : 0;
      if (!step) return;
      e.preventDefault();
      var next = options[(i + step + options.length) % options.length];
      setLevel(next.getAttribute("data-set-level"));
      next.focus();
    });
  });

  // Keep the level bar below the site's sticky header.
  function syncStickyOffset() {
    var header = document.querySelector("body > header");
    var h = header ? header.getBoundingClientRect().height : 0;
    article.style.setProperty("--paper-sticky-top", Math.round(h) + "px");
  }
  window.addEventListener("resize", syncStickyOffset);
  syncStickyOffset();

  /* ---------- sharing ---------- */

  function intentFor(kind, bar) {
    var url = shareUrl();
    var title = bar.getAttribute("data-share-title") || document.title;
    var text = bar.getAttribute("data-share-text") || title;
    var e = encodeURIComponent;
    switch (kind) {
      case "linkedin": return "https://www.linkedin.com/sharing/share-offsite/?url=" + e(url);
      case "bluesky": return "https://bsky.app/intent/compose?text=" + e(text + " " + url);
      case "x": return "https://x.com/intent/tweet?text=" + e(text) + "&url=" + e(url);
      case "facebook": return "https://www.facebook.com/sharer/sharer.php?u=" + e(url);
      case "reddit": return "https://www.reddit.com/submit?url=" + e(url) + "&title=" + e(title);
      case "email": return "mailto:?subject=" + e(title) + "&body=" + e(text + "\n\n" + url);
      default: return null;
    }
  }

  var bars = Array.prototype.slice.call(document.querySelectorAll(".share-bar"));

  function refreshShareLinks() {
    bars.forEach(function (bar) {
      bar.querySelectorAll("a[data-share]").forEach(function (a) {
        var href = intentFor(a.getAttribute("data-share"), bar);
        if (href) a.setAttribute("href", href);
      });
    });
  }

  function say(bar, msg) {
    var status = bar.querySelector(".share-status");
    if (!status) return;
    status.textContent = msg;
    clearTimeout(status._t);
    status._t = setTimeout(function () { status.textContent = ""; }, 4000);
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    return new Promise(function (resolve, reject) {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy") ? resolve() : reject(); } catch (err) { reject(err); }
      document.body.removeChild(ta);
    });
  }

  bars.forEach(function (bar) {
    var native = bar.querySelector('[data-share="native"]');
    if (native && navigator.share) native.hidden = false;

    bar.addEventListener("click", function (ev) {
      var el = ev.target.closest("[data-share]");
      if (!el) return;
      var kind = el.getAttribute("data-share");
      var title = bar.getAttribute("data-share-title") || document.title;
      var text = bar.getAttribute("data-share-text") || title;

      if (kind === "native") {
        navigator.share({ title: title, text: text, url: shareUrl() }).catch(function () {});
        return;
      }
      if (kind === "copy") {
        copyText(shareUrl()).then(function () { say(bar, "Link copied."); },
          function () { say(bar, "Copy failed. The address is " + shareUrl()); });
        return;
      }
      if (kind === "mastodon") {
        ev.preventDefault();
        var saved = store("mastodon-instance") || "";
        var instance = window.prompt("Your Mastodon server (for example, mastodon.social)", saved);
        if (!instance) return;
        instance = instance.trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
        if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(instance)) { say(bar, "That does not look like a server name."); return; }
        store("mastodon-instance", instance);
        window.open("https://" + instance + "/share?text=" + encodeURIComponent(text + " " + shareUrl()),
          "_blank", "noopener,noreferrer");
        return;
      }
      // Links already carry the current intent URL; refresh in case the level changed.
      var href = intentFor(kind, bar);
      if (href) el.setAttribute("href", href);
    });
  });

  /* ---------- copy buttons (BibTeX and friends) ---------- */

  document.querySelectorAll("[data-copy-target]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var target = document.getElementById(btn.getAttribute("data-copy-target"));
      if (!target) return;
      var label = btn.textContent;
      copyText(target.textContent).then(function () {
        btn.textContent = "Copied";
        setTimeout(function () { btn.textContent = label; }, 2000);
      });
    });
  });

  /* ---------- more interactive papers ---------- */

  // The layout lists every other paper in date order with the first few
  // visible. Reorder by view count (data-views, from _data/views.yaml) or at
  // random, and show the first `data-show` of the result.
  var more = document.querySelector("[data-paper-more]");
  if (more) {
    var moreList = more.querySelector(".paper-more-list");
    var moreItems = Array.prototype.slice.call(moreList.children);
    var moreShow = parseInt(more.getAttribute("data-show"), 10) || 3;
    var moreGroup = more.querySelector(".paper-more-sort");
    var moreButtons = Array.prototype.slice.call(more.querySelectorAll("[data-more-sort]"));
    var viewsOf = function (li) { return parseInt(li.getAttribute("data-views"), 10) || 0; };
    var hasViews = moreItems.some(function (li) { return viewsOf(li) > 0; });

    var shuffled = function (list) {
      var a = list.slice();
      for (var i = a.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var t = a[i]; a[i] = a[j]; a[j] = t;
      }
      return a;
    };

    var arrange = function (mode) {
      // Shuffle first so equal view counts come out in a fresh order each time
      // (Array.prototype.sort is stable).
      var order = shuffled(moreItems);
      if (mode === "popular") order.sort(function (a, b) { return viewsOf(b) - viewsOf(a); });
      order.forEach(function (li, i) {
        li.hidden = i >= moreShow;
        moreList.appendChild(li);
      });
      if (hasViews) {
        moreButtons.forEach(function (b) {
          b.setAttribute("aria-pressed", b.getAttribute("data-more-sort") === mode ? "true" : "false");
        });
      }
    };

    if (moreItems.length > moreShow) {
      moreGroup.hidden = false;
      if (!hasViews) {
        // No counts yet (previews, forks, or before the first fetch): one
        // button that draws another random set.
        moreButtons.forEach(function (b) {
          if (b.getAttribute("data-more-sort") === "popular") b.hidden = true;
          else { b.textContent = "Show others"; b.removeAttribute("aria-pressed"); }
        });
      }
      moreButtons.forEach(function (b) {
        b.addEventListener("click", function () { arrange(b.getAttribute("data-more-sort")); });
      });
    }
    arrange(hasViews ? "popular" : "random");
  }

  /* ---------- start ---------- */

  var initial = fromUrl();
  if (known.indexOf(initial) < 0) initial = store(STORE);
  if (known.indexOf(initial) < 0) initial = fallback;
  setLevel(initial, { remember: false, updateUrl: fromUrl() !== null });

  window.PaperKit = { level: current, setLevel: setLevel, shareUrl: shareUrl };
})();

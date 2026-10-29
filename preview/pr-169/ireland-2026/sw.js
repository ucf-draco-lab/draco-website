/* Ireland 2026 trip dashboard: keeps the page, slides, and tickets on this device so they open without a
   connection. Everything it stores is the same ciphertext the site serves; the password is still needed.
   Map tiles are kept only after you view or save them, and are dropped after 28 days (CARTO's terms allow
   up to 30 days of on-device caching). */
"use strict";
var VERSION = "bcb46098405a";
var SHELL = "ie26-shell-" + VERSION, TILES = "ie26-tiles", FONTS = "ie26-fonts";
var PRECACHE = ["./", "ucf-mark.png", "manifest.webmanifest", "icon-180.png", "icon-192.png", "icon-512.png", "decks/2026-11-04-1200-seminar-from-ideas-to-impact.pdf.enc", "decks/2026-11-04-1400-pme-year-1-craft-cycle-with-ai.pdf.enc", "decks/2026-11-05-0900-pme-year-2-partnering-science-and-art.pdf.enc", "decks/2026-11-05-1115-microbit-code-a-tiny-computer.pdf.enc", "decks/2026-11-05-1115-unplugged-sort-and-search.pdf.enc", "decks/2026-11-05-unplugged-printables.pdf.enc", "decks/2026-11-07-1015-lai-leading-teachers-through-ai.pdf.enc", "decks/2026-11-07-1045-lai-check-the-machine.pdf.enc", "decks/citylink-ticket-1.pdf.enc", "decks/citylink-ticket-2.pdf.enc"];
var SCOPE = self.registration.scope;
var TILE_HOST = "basemaps.cartocdn.com", TILE_DAYS = 28, TILE_MAX = 600;

self.addEventListener("install", function (ev) {
  ev.waitUntil(caches.open(SHELL).then(function (c) {
    return c.addAll(PRECACHE.map(function (u) { return new Request(u, { cache: "reload" }); }));
  }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener("activate", function (ev) {
  ev.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k.indexOf("ie26-shell-") === 0 && k !== SHELL; })
      .map(function (k) { return caches.delete(k); }));
  }).then(expireTiles).then(function () { return self.clients.claim(); }));
});

function timed(p, ms) {
  return Promise.race([p, new Promise(function (_, no) { setTimeout(function () { no(new Error("timeout")); }, ms); })]);
}

// the page: network first (so updates arrive), the saved copy when the network is slow or absent
function page(req) {
  var net = fetch(req).then(function (r) {
    if (r && r.ok && r.type === "basic") { var copy = r.clone(); caches.open(SHELL).then(function (c) { return c.put(SCOPE, copy); }); }
    return r;
  });
  return timed(net, 4000).catch(function () {
    return caches.open(SHELL).then(function (c) { return c.match(SCOPE); }).then(function (hit) { return hit || net; });
  });
}

// slides, tickets, icons: the saved copy (refreshed whenever the site publishes a new version)
function asset(req) {
  return caches.open(SHELL).then(function (c) {
    return c.match(req, { ignoreSearch: true }).then(function (hit) { return hit || fetch(req); });
  });
}

// map tiles: network first with a short wait, then the saved tile
function tile(req) {
  return timed(fetch(req), 5000).then(function (r) {
    if (r && r.ok) return keepTile(req, r);
    return r;
  }).catch(function () {
    return caches.open(TILES).then(function (c) { return c.match(req); }).then(function (hit) { return hit || Response.error(); });
  });
}
function keepTile(req, r) {
  return r.blob().then(function (b) {
    var hdr = { "content-type": r.headers.get("content-type") || "image/png", "x-ie26-saved": String(Date.now()) };
    var keep = new Response(b, { headers: hdr });
    caches.open(TILES).then(function (c) { return c.put(req, keep); }).then(trimSoon);
    return new Response(b, { headers: hdr });
  });
}
var trimTimer = null;
function trimSoon() { if (!trimTimer) trimTimer = setTimeout(function () { trimTimer = null; expireTiles(); }, 5000); }
function expireTiles() {
  var cutoff = Date.now() - TILE_DAYS * 864e5;
  return caches.open(TILES).then(function (c) {
    return c.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) { return c.match(k).then(function (r) { return { k: k, t: +(r && r.headers.get("x-ie26-saved")) || 0 }; }); }))
        .then(function (rows) {
          var old = rows.filter(function (x) { return x.t < cutoff; });
          var fresh = rows.filter(function (x) { return x.t >= cutoff; }).sort(function (a, b) { return a.t - b.t; });
          var extra = fresh.slice(0, Math.max(0, fresh.length - TILE_MAX));
          return Promise.all(old.concat(extra).map(function (x) { return c.delete(x.k); }));
        });
    });
  });
}

// fonts: the saved copy once fetched
function font(req) {
  return caches.open(FONTS).then(function (c) {
    return c.match(req).then(function (hit) {
      return hit || fetch(req).then(function (r) { if (r && (r.ok || r.type === "opaque")) c.put(req, r.clone()); return r; });
    });
  });
}

self.addEventListener("fetch", function (ev) {
  var req = ev.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  if (req.url.indexOf(SCOPE) === 0) {
    if (req.mode === "navigate") { ev.respondWith(page(req)); return; }
    if (url.pathname.slice(-6) === "/sw.js") return;
    if (url.href.split(/[?#]/)[0] === SCOPE) { ev.respondWith(page(req)); return; }
    ev.respondWith(asset(req)); return;
  }
  if (url.hostname === TILE_HOST) { ev.respondWith(tile(req)); return; }
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") { ev.respondWith(font(req)); return; }
});

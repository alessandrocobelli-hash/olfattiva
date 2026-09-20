/* Olfattiva · service worker: il guscio dell'app è in cache (offline), i contenuti cifrati si aggiornano dalla rete quando c'è */
var VERSION = 'e29e0d1e6d';
var CACHE = 'olfattiva-' + VERSION;
var SHELL = ["assets/app.css", "assets/app.js", "assets/core.js", "assets/engine.js", "assets/fonts/bodoni-moda-latin-400-italic.woff2", "assets/fonts/bodoni-moda-latin-400-normal.woff2", "assets/fonts/dm-mono-latin-400-normal.woff2", "assets/fonts/dm-mono-latin-500-normal.woff2", "assets/fonts/instrument-sans-latin-400-normal.woff2", "assets/fonts/instrument-sans-latin-500-normal.woff2", "assets/fonts/instrument-sans-latin-600-normal.woff2", "assets/icons/apple-touch-icon.png", "assets/icons/favicon-32.png", "assets/icons/icon-192.png", "assets/icons/icon-512.png", "assets/icons/icon-maskable-512.png", "assets/views-a.js", "assets/views-b.js", "assets/views-c.js", "index.html", "manifest.webmanifest"];
self.addEventListener('install', function (e) { e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(['./'].concat(SHELL)); }).then(function () { return self.skipWaiting(); })); });
self.addEventListener('activate', function (e) { e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k.indexOf('olfattiva-') === 0 && k !== CACHE; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); })); });
self.addEventListener('fetch', function (e) {
  var url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;               // API esterne: mai in cache
  if (url.pathname.indexOf('/data/') >= 0) {                                              // contenuti cifrati: prima la rete, poi la copia locale
    e.respondWith(fetch(e.request).then(function (r) { var cp = r.clone(); caches.open(CACHE).then(function (c) { c.put(e.request, cp); }); return r; }).catch(function () { return caches.match(e.request); }));
    return;
  }
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(function (hit) { return hit || fetch(e.request).then(function (r) { if (r.ok) { var cp = r.clone(); caches.open(CACHE).then(function (c) { c.put(e.request, cp); }); } return r; }).catch(function () { return e.request.mode === 'navigate' ? caches.match('./') : Response.error(); }); }));
});

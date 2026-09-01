/* ============================================================
   sw.js — offline cache so the game works on a tablet with no
   internet. Cache-first: this app is fully static and every
   release bumps CACHE, so stale content is never a risk.
   ============================================================ */

const CACHE = 'dimaag-ka-khel-v1';

const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/base.css',
  './css/screens.css',
  './css/games.css',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './js/main.js',
  './js/core/rng.js',
  './js/core/i18n.js',
  './js/core/audio.js',
  './js/core/state.js',
  './js/core/ui.js',
  './js/core/drag.js',
  './js/core/engine.js',
  './js/core/catalog.js',
  './js/content/packs.js',
  './js/content/worlds.js',
  './js/screens/hub.js',
  './js/screens/map.js',
  './js/screens/levelselect.js',
  './js/screens/settings.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      // addAll is atomic: one 404 kills the whole install. Game
      // modules are added lazily by the fetch handler instead, so
      // the shell list stays small and reliable.
      .then((c) => c.addAll(SHELL))
      .then(() => self.skipWaiting())
      .catch((err) => console.warn('[sw] precache skipped:', err))
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  e.respondWith(
    caches.match(request).then((hit) => {
      if (hit) return hit;
      return fetch(request).then((res) => {
        // Cache each game engine the first time it is loaded, so a
        // level played once is playable offline forever after.
        if (res.ok && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(request, copy));
        }
        return res;
      }).catch(() =>
        // Offline and uncached: for a navigation, fall back to the
        // app shell so the SPA router can still boot.
        request.mode === 'navigate' ? caches.match('./index.html') : Response.error()
      );
    })
  );
});

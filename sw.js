/* ============================================================
   sw.js — offline cache so the game works on a tablet with no
   internet.

   Stale-while-revalidate, not cache-first. Cache-first served the
   cached copy and stopped there, so once a tablet had the game it
   never saw another version: the browser only reinstalls a service
   worker whose own bytes changed, and shipping a fix to a game file
   does not change sw.js. Now every request is answered from the
   cache immediately AND refetched in the background, so a fix
   reaches a returning player on their next visit while the app
   still opens instantly and still works with no network at all.
   ============================================================ */

const CACHE = 'dimaag-ka-khel-v2';

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

  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(request);

    const fresh = fetch(request)
      .then((res) => {
        // Cache each game engine the first time it is loaded, and
        // refresh anything already cached, so the next visit is current.
        if (res.ok && res.type === 'basic') cache.put(request, res.clone());
        return res;
      })
      .catch(() => null);

    // Answer from the cache at once, but let the refetch finish so the
    // stored copy is up to date for next time.
    if (cached) {
      e.waitUntil(fresh);
      return cached;
    }

    const res = await fresh;
    if (res) return res;

    // Offline and never cached: for a navigation, fall back to the app
    // shell so the router can still boot.
    if (request.mode === 'navigate') {
      const shell = await cache.match('./index.html');
      if (shell) return shell;
    }
    return Response.error();
  })());
});

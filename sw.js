/* Chat City Premium Dark PWA service worker - v3 */
const CACHE_NAME = "chat-city-shell-v3-dark";
const FIREBASE_CACHE = "chat-city-firebase-v3";
const APP_SHELL = ["./", "./index.html", "./manifest.webmanifest"];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys
        .filter(key => key.startsWith("chat-city-") &&
          key !== CACHE_NAME && key !== FIREBASE_CACHE)
        .map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  // Firebase ES modules: use cached copy offline; cache successful online fetches.
  if (url.hostname === "www.gstatic.com" && url.pathname.includes("/firebasejs/")) {
    event.respondWith((async () => {
      const cache = await caches.open(FIREBASE_CACHE);
      const cached = await cache.match(request);
      if (cached) return cached;
      const response = await fetch(request);
      if (response && response.ok) {
        try { await cache.put(request, response.clone()); } catch (_) {}
      }
      return response;
    })());
    return;
  }

  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response && response.ok) {
          const cache = await caches.open(CACHE_NAME);
          try { await cache.put("./index.html", response.clone()); } catch (_) {}
        }
        return response;
      } catch (_) {
        return (await caches.match("./index.html")) ||
          new Response("Chat City is offline and the app shell is not cached yet.", {
            status: 503, headers: {"Content-Type":"text/plain; charset=utf-8"}
          });
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cached = await caches.match(request);
    if (cached) return cached;
    const response = await fetch(request);
    if (response && response.ok) {
      const cache = await caches.open(CACHE_NAME);
      try { await cache.put(request, response.clone()); } catch (_) {}
    }
    return response;
  })());
});

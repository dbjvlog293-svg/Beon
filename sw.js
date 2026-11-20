const CACHE_NAME = "chat-city-shell-v2";
const FIREBASE_CACHE = "chat-city-firebase-v1";
const APP_SHELL = ["./", "./index.html", "./manifest.webmanifest", "./chat-city-logo.png"];
self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(key => ![CACHE_NAME, FIREBASE_CACHE].includes(key)).map(key => caches.delete(key))
  )).then(() => self.clients.claim()));
});
self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  // Keep Firebase's ES modules available after the first successful online load.
  if (url.hostname === "www.gstatic.com" && url.pathname.includes("/firebasejs/")) {
    event.respondWith(caches.open(FIREBASE_CACHE).then(async cache => {
      const cached = await cache.match(request);
      if (cached) return cached;
      const response = await fetch(request);
      if (response && response.ok) cache.put(request, response.clone());
      return response;
    }));
    return;
  }
  if (url.origin !== self.location.origin) return;
  event.respondWith(caches.match(request).then(cached => cached || fetch(request).then(response => {
    if (response && response.ok) caches.open(CACHE_NAME).then(cache => cache.put(request, response.clone()));
    return response;
  }).catch(() => caches.match("./index.html"))));
});

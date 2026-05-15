const CACHE_NAME = "gym-tracker-v3";

const urlsToCache = [
  "auth.html",
  "progress.html",
  "style.css",
  "progress.js",
    "app.js",
    "index.html",
    "auth.js",
    "firebase.js"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
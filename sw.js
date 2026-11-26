const CACHE_NAME = "workout-froggy-v9";

const APP_SHELL = [
  "./",
  "auth.html",
  "index.html",
  "exerciseList.html",
  "addExercise.html",
  "addSplit.html",
  "progress.html",
  "user.html",
  "style.css",
  "manifest.json",
  "js/core/firebase.js",
  "js/core/auth.js",
  "js/data/helpers.js",
  "js/data/exerciseRepository.js",
  "js/data/splitRepository.js",
  "js/data/logRepository.js",
  "js/services/exerciseService.js",
  "js/services/splitService.js",
  "js/services/migrationService.js",
  "js/components/dom.js",
  "js/components/navigation.js",
  "js/components/exerciseCard.js",
  "js/components/splitCard.js",
  "js/components/splitPills.js",
  "js/components/exerciseDialog.js",
  "js/components/splitDialog.js",
  "js/pages/common.js",
  "js/pages/exercisesPage.js",
  "js/pages/splitsPage.js",
  "js/pages/addExercisePage.js",
  "js/pages/addSplitPage.js",
  "js/pages/profilePage.js",
  "js/pages/progressPage.js",
  "js/pages/authPage.js",
  "js/pages/registerServiceWorker.js",
  "icons/gym.png",
  "icons/gym-icon.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
      caches.open(CACHE_NAME)
          .then(cache => cache.addAll(APP_SHELL))
          .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
      caches.keys()
          .then(keys =>
              Promise.all(
                  keys
                      .filter(key => key !== CACHE_NAME)
                      .map(key => caches.delete(key))
              )
          )
          .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return;

  // Network-first for CSS and JavaScript
  if (
      url.pathname.endsWith(".css") ||
      url.pathname.endsWith(".js")
  ) {
    event.respondWith(
        fetch(request)
            .then(response => {
              if (response.ok) {
                const copy = response.clone();

                caches.open(CACHE_NAME)
                    .then(cache => cache.put(request, copy));
              }

              return response;
            })
            .catch(() => caches.match(request))
    );

    return;
  }

  // Network-first for HTML navigation
  if (request.mode === "navigate") {
    event.respondWith(
        fetch(request)
            .then(response => {
              if (response.ok) {
                const copy = response.clone();

                caches.open(CACHE_NAME)
                    .then(cache => cache.put(request, copy));
              }

              return response;
            })
            .catch(() =>
                caches.match(request).then(cached => {
                  return cached || caches.match("./index.html");
                })
            )
    );

    return;
  }

  // Cache-first for other static assets
  event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;

        return fetch(request).then(response => {
          if (!response.ok || response.type === "opaque") {
            return response;
          }

          const copy = response.clone();

          caches.open(CACHE_NAME)
              .then(cache => cache.put(request, copy));

          return response;
        });
      })
  );
});

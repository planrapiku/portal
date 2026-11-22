
const CACHE_NAME = "planrapiku-portal-v1";

// Lokasi file yang akan disimpan
const APP_SHELL = [
  new URL("./", self.registration.scope).href,
  new URL("./manifest.webmanifest", self.registration.scope).href,
  new URL("./icons/icon-192.png", self.registration.scope).href,
  new URL("./icons/icon-512.png", self.registration.scope).href,
  new URL("./icons/icon-maskable-512.png", self.registration.scope).href
];

// =====================================
// 1. INSTALL SERVICE WORKER
// =====================================

self.addEventListener("install", event => {

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(APP_SHELL);
      })
      .then(() => self.skipWaiting())
  );

});


// =====================================
// 2. ACTIVATE SERVICE WORKER
// =====================================

self.addEventListener("activate", event => {

  event.waitUntil(

    caches.keys().then(keys => {

      return Promise.all(

        keys
          .filter(key =>
            key.startsWith("planrapiku-portal-") &&
            key !== CACHE_NAME
          )
          .map(key => caches.delete(key))

      );

    }).then(() => self.clients.claim())

  );

});


// =====================================
// 3. HANDLE FETCH REQUEST
// =====================================

self.addEventListener("fetch", event => {

  const request = event.request;
  const url = new URL(request.url);

  // Hanya request GET
  if (request.method !== "GET") return;

  // Hanya kelola aset dari domain GitHub Pages
  if (url.origin !== self.location.origin) return;

  // ===================================
  // NAVIGATION: NETWORK FIRST
  // ===================================

  if (request.mode === "navigate") {

    event.respondWith(

      fetch(request).catch(async () => {

        const cachedPage = await caches.match(
          new URL("./", self.registration.scope).href
        );

        return cachedPage || new Response(
          "Koneksi internet diperlukan untuk membuka Planrapiku.",
          {
            status: 503,
            headers: {
              "Content-Type": "text/plain; charset=utf-8"
            }
          }
        );

      })

    );

    return;

  }


  // ===================================
  // STATIC ASSETS: CACHE FIRST
  // ===================================

  event.respondWith(

    caches.match(request).then(async cached => {

      if (cached) return cached;

      const response = await fetch(request);

      if (response.ok && response.type === "basic") {

        const cache = await caches.open(CACHE_NAME);

        await cache.put(request, response.clone());

      }

      return response;

    })

  );

});

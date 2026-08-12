// Minimal service worker: precache the app shell, cache product images in
// the browser, and fall back to the network for everything else. IndexedDB
// (lib/offline/db.ts) — not the cache — is what makes billing itself work
// offline; this worker's job is keeping the POS screen + photos loadable.
const CACHE_NAME = "pos-shell-v2";
const IMAGE_CACHE = "pos-images-v1";
const APP_SHELL = ["/", "/billing", "/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  const keep = new Set([CACHE_NAME, IMAGE_CACHE]);
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => !keep.has(k)).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

function isProductImage(url) {
  return (
    url.includes("res.cloudinary.com") ||
    url.includes("/uploads/products/") ||
    url.includes("/_next/image")
  );
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  // Never cache API calls — billing must always hit the network or the
  // offline queue, never a stale cached response.
  if (event.request.url.includes("/api/")) return;

  if (isProductImage(event.request.url)) {
    event.respondWith(
      caches.open(IMAGE_CACHE).then(async (cache) => {
        const cached = await cache.match(event.request);
        if (cached) return cached;
        try {
          const res = await fetch(event.request);
          if (res.ok) cache.put(event.request, res.clone());
          return res;
        } catch {
          return cached || Response.error();
        }
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});

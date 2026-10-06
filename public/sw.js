// Minimal service worker — ONLY to make the app installable.
// Do NOT cache pages/API: a bad cache was breaking /dashboard in normal
// tabs ("site can't be reached") while Incognito (no SW) still worked.
const CACHE_VERSION = "pos-sw-v5";

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

// Passthrough only — browser handles every request normally.
self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});

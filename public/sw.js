// Billo service worker — lets the app OPEN and BILL without internet.
//
// Rules (kept strict, because an old cache-first worker once broke /dashboard):
//  • Pages: NETWORK FIRST. The cached copy is used only when the network fails
//    (or is very slow and a cached copy exists). Online users always get fresh pages.
//  • Only clean 200 HTML responses are cached — never redirects, errors or API data.
//  • /api/* and Next.js RSC requests are never cached (always live).
//  • Static build files (/_next/static) are cache-first — their names change every deploy.
const VERSION = "billo-sw-v7";
const STATIC_CACHE = "billo-static-v1";
const PAGE_CACHE = "billo-pages-v1";
const KEEP = [STATIC_CACHE, PAGE_CACHE];

// App screens that should open offline (cached after they're visited or warmed).
const APP_PAGES = ["/billing", "/dashboard", "/bills", "/udhaari", "/customers", "/tiffin", "/products", "/sales", "/more", "/settings", "/shifts", "/day-closing", "/expenses", "/inventory", "/reports", "/staff", "/performance", "/profile"];
// Where an offline app launch should land (first one that's cached).
const OFFLINE_START = ["/billing", "/dashboard"];
const PRECACHE = ["/offline.html", "/manifest.json", "/brand/billo-icon.png", "/brand/billo-logo.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);
      await Promise.all(PRECACHE.map((u) => cache.add(new Request(u, { cache: "reload" })).catch(() => {})));
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => !KEEP.includes(k)).map((k) => caches.delete(k)));
      await trimCache(STATIC_CACHE, 400);
      await self.clients.claim();
    })()
  );
});

self.addEventListener("message", (event) => {
  const msg = event.data || {};
  if (msg.type === "SKIP_WAITING") self.skipWaiting();
  if (msg.type === "WARM" && Array.isArray(msg.urls)) event.waitUntil(warm(msg.urls));
  if (msg.type === "CLEAR_PAGES") event.waitUntil(caches.delete(PAGE_CACHE));
});

const isAppPage = (path) => path === "/login" || APP_PAGES.some((p) => path === p || path.startsWith(p + "/"));

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return; // always live
  if (req.headers.get("RSC") === "1" || url.searchParams.has("_rsc")) return; // Next.js data requests

  if (req.mode === "navigate") {
    if (isAppPage(url.pathname)) event.respondWith(pageNetworkFirst(req, url));
    return; // website pages: browser default
  }

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(req));
    return;
  }
  if (
    url.pathname.startsWith("/_next/image") ||
    url.pathname.startsWith("/brand/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/food-library/") ||
    /\.(png|jpe?g|webp|svg|ico|woff2?)$/i.test(url.pathname)
  ) {
    event.respondWith(staleWhileRevalidate(req));
  }
});

async function pageNetworkFirst(req, url) {
  const cache = await caches.open(PAGE_CACHE);
  // /login is never cached: an offline launch should open Billing, not the login form.
  const isLogin = url.pathname === "/login";
  const cached = isLogin ? undefined : await cache.match(url.pathname);
  const network = fetch(req).then(async (res) => {
    if (!isLogin && isCacheablePage(res)) await cache.put(url.pathname, res.clone());
    return res;
  });
  network.catch(() => {}); // avoid "unhandled rejection" noise when we answer from cache

  try {
    if (!cached) return await network;
    // Slow network + cached copy → show the cached screen after 4s; the fresh copy still updates the cache.
    return await Promise.race([network, new Promise((resolve) => setTimeout(() => resolve(cached), 4000))]);
  } catch {
    if (cached) return cached;
    // Offline app launch (/login is the app's start page) → open Billing if we have it.
    if (isLogin) {
      for (const p of OFFLINE_START) {
        const hit = await cache.match(p);
        if (hit) return hit;
      }
    }
    // Any other screen not saved yet → friendly offline page with an "Open Billing" button.
    return (await caches.match("/offline.html")) || new Response("Offline", { status: 503, headers: { "Content-Type": "text/plain" } });
  }
}

function isCacheablePage(res) {
  return res && res.ok && res.status === 200 && !res.redirected && res.type === "basic" && (res.headers.get("content-type") || "").includes("text/html");
}

async function cacheFirst(req) {
  const cache = await caches.open(STATIC_CACHE);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok) cache.put(req, res.clone());
  return res;
}

async function staleWhileRevalidate(req) {
  const cache = await caches.open(STATIC_CACHE);
  const hit = await cache.match(req);
  const fresh = fetch(req)
    .then((res) => {
      if (res.ok) cache.put(req, res.clone());
      return res;
    })
    .catch(() => hit);
  return hit || fresh;
}

/** Fetch app screens (with login cookie) and the JS/CSS they need, so they open offline later. */
async function warm(paths) {
  const pages = await caches.open(PAGE_CACHE);
  const statics = await caches.open(STATIC_CACHE);
  for (const path of paths) {
    try {
      const res = await fetch(path, { credentials: "same-origin", cache: "no-store" });
      if (!isCacheablePage(res)) continue;
      const html = await res.clone().text();
      await pages.put(path, res);
      const assets = new Set();
      for (const m of html.matchAll(/(?:src|href)="(\/_next\/static\/[^"]+)"/g)) assets.add(m[1]);
      await Promise.all(
        [...assets].map(async (a) => {
          if (await statics.match(a)) return;
          const r = await fetch(a).catch(() => null);
          if (r && r.ok) await statics.put(a, r);
        })
      );
    } catch {
      /* offline or not logged in — skip */
    }
  }
}

async function trimCache(name, max) {
  const cache = await caches.open(name);
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - max; i++) await cache.delete(keys[i]);
}

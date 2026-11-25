"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

/**
 * Makes going back to a screen instant.
 *
 * 1. Every GET to our own /api/* is remembered in memory. Opening the same screen again shows the
 *    saved answer straight away (no spinner) and quietly refreshes it in the background:
 *      - under 20s old → used as-is, no network at all
 *      - 20s–10min old → shown instantly, refreshed in the background for next time
 *      - older → normal fetch
 * 2. Any change (POST/PUT/PATCH/DELETE to /api) clears the memory, so after a bill, edit or
 *    payment every screen shows fresh data.
 * 3. Server-rendered screens are kept by Next.js for 3 min (next.config staleTimes); after a
 *    change we refresh them once on the next screen change.
 * Calls with { cache: "no-store" } (e.g. the kitchen screen) always go to the network.
 */
const FRESH_MS = 20_000;
const MAX_AGE_MS = 10 * 60_000;
const SKIP = ["/api/auth", "/api/kitchen", "/api/health", "/api/session-reset", "/api/where"];
/** POSTs that only record activity — they don't change shop data, so they must not clear the cache. */
const QUIET_POSTS = ["/api/presence", "/api/track/", "/api/report-error"];

type Entry = { at: number; status: number; headers: [string, string][]; body: string };
let installed = false;
let dirty = false;
let gen = 0; // bumps on every change, so an answer that started before the change is never saved
const store = new Map<string, Entry>();
const inflight = new Map<string, Promise<Response>>();

function toResponse(e: Entry) {
  return new Response(e.body, { status: e.status, headers: e.headers });
}

function install() {
  if (installed || typeof window === "undefined") return;
  installed = true;
  const realFetch = window.fetch.bind(window);

  const fetchAndStore = (key: string, input: RequestInfo | URL, init?: RequestInit) => {
    const existing = inflight.get(key);
    if (existing) return existing.then((r) => r.clone());
    const startGen = gen;
    const p = realFetch(input, init)
      .then(async (res) => {
        if (startGen !== gen) return res;
        const type = res.headers.get("content-type") || "";
        if (res.ok && type.includes("application/json")) {
          const body = await res.clone().text();
          store.set(key, { at: Date.now(), status: res.status, headers: [["content-type", type]], body });
        }
        return res;
      })
      .finally(() => inflight.delete(key));
    inflight.set(key, p);
    return p.then((r) => r.clone());
  };

  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    let url: URL;
    try {
      url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url, window.location.origin);
    } catch {
      return realFetch(input, init);
    }
    const method = (init?.method || (input instanceof Request ? input.method : "GET")).toUpperCase();
    const ours = url.origin === window.location.origin && url.pathname.startsWith("/api/");
    if (!ours) return realFetch(input, init);

    if (method !== "GET" && method !== "HEAD" && QUIET_POSTS.some((p) => url.pathname.startsWith(p))) return realFetch(input, init);
    if (method !== "GET" && method !== "HEAD") {
      // Something changed → everything we remembered may be old now.
      store.clear();
      gen++;
      dirty = true;
      return realFetch(input, init).finally(() => {
        // Clear again once the server has saved it (a read may have slipped in meanwhile).
        store.clear();
        gen++;
      });
    }
    if (init?.cache === "no-store" || SKIP.some((p) => url.pathname.startsWith(p))) return realFetch(input, init);

    const key = url.pathname + url.search;
    const hit = store.get(key);
    const age = hit ? Date.now() - hit.at : Infinity;
    if (hit && age < FRESH_MS) return Promise.resolve(toResponse(hit));
    if (hit && age < MAX_AGE_MS) {
      fetchAndStore(key, input, init).catch(() => {}); // refresh quietly for next time
      return Promise.resolve(toResponse(hit));
    }
    return fetchAndStore(key, input, init);
  };
}

export function ApiCacheBoot() {
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    install();
  }, []);
  // After a change, refresh server-rendered screens once when the user moves to another screen.
  useEffect(() => {
    if (dirty) {
      dirty = false;
      router.refresh();
    }
  }, [pathname, router]);
  return null;
}

"use client";

/**
 * Daily token numbers on this phone, so offline bills still print a token.
 * Every online bill records the server's token; offline bills continue from it.
 * (Two phones billing offline at the same time could print the same token.)
 */
const KEY = "billo-token-day";

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function read(): { day: string; last: number } {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "null");
    if (v && v.day === today() && typeof v.last === "number") return v;
  } catch {
    /* ignore */
  }
  return { day: today(), last: 0 };
}

/** Call with the server's token after every online bill. */
export function recordServerToken(token: number | undefined) {
  if (!token) return;
  const cur = read();
  try {
    localStorage.setItem(KEY, JSON.stringify({ day: cur.day, last: Math.max(cur.last, token) }));
  } catch {
    /* ignore */
  }
}

/** Next token for a bill made offline. */
export function nextOfflineToken(): number {
  const cur = read();
  const next = cur.last + 1;
  try {
    localStorage.setItem(KEY, JSON.stringify({ day: cur.day, last: next }));
  } catch {
    /* ignore */
  }
  return next;
}

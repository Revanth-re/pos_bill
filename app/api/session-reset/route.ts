import { NextResponse } from "next/server";

// Clears a stale login (session cookie for a shop that doesn't exist any more) and goes to /login.
export function GET(req: Request) {
  const res = NextResponse.redirect(new URL("/login", req.url));
  for (const name of [
    "authjs.session-token",
    "__Secure-authjs.session-token",
    "authjs.callback-url",
    "__Secure-authjs.callback-url",
    "authjs.csrf-token",
    "__Host-authjs.csrf-token",
  ]) {
    res.cookies.set(name, "", { maxAge: 0, path: "/", secure: name.startsWith("__") || undefined });
  }
  return res;
}

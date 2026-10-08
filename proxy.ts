import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import { edgeAuthConfig } from "@/lib/auth/edgeConfig";

// Next.js middleware/proxy runs on the Edge runtime, which can't load
// Node-native modules like the `pg` driver Prisma depends on. So this
// creates its own lightweight NextAuth instance from the edge-safe config
// (JWT decode only, no providers, no Prisma) instead of importing the
// full auth() from lib/auth — see lib/auth/edgeConfig.ts for why.
const { auth } = NextAuth(edgeAuthConfig);

// Next.js 16 renamed the `middleware.ts` file convention to `proxy.ts`.
// A default export is still valid here — only the filename changed.
// Public website pages (SEO) — open to everyone, logged in or not.
const PUBLIC_EXACT = new Set(["/", "/pricing", "/features", "/hi", "/te", "/contact", "/privacy", "/terms"]);
const PUBLIC_PREFIXES = ["/for/", "/billing-software/"];
function isPublicPage(pathname: string) {
  return PUBLIC_EXACT.has(pathname) || PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
}

// next-auth rewrites req.url to NEXTAUTH_URL/AUTH_URL (e.g. an old domain). Always redirect on the
// domain the visitor actually opened (getbillo.vercel.app, custom domain, localhost…).
function realOrigin(req: Request & { nextUrl: URL }) {
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (host && /pos-bill-gamma|billo-quick/.test(host)) return "https://getbillo.vercel.app";
  if (!host) return req.nextUrl.origin;
  const proto = req.headers.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto.split(",")[0]}://${host.split(",")[0]}`;
}

export default auth((req) => {
  if (isPublicPage(req.nextUrl.pathname)) return NextResponse.next();
  const origin = realOrigin(req);

  const isAuthed = !!req.auth;
  const isAuthRoute = req.nextUrl.pathname.startsWith("/login") || req.nextUrl.pathname.startsWith("/register");

  if (!isAuthed && !isAuthRoute) {
    const loginUrl = new URL("/login", origin);
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthed && isAuthRoute) {
    // Keep ?install=1 (from the website's "Get Billo") so the dashboard can offer install too.
    const dest = new URL("/dashboard", origin);
    if (req.nextUrl.searchParams.get("install") === "1") dest.searchParams.set("install", "1");
    return NextResponse.redirect(dest);
  }

  return NextResponse.next();
});

export const config = {
  // Skip auth for API routes, Next internals and ANY static file (has a file extension:
  // /brand/*.png logo, /food-library/*.jpg, /icons/*, icon.png, apple-icon.png, manifest, sw.js…).
  // Previously only /icons was excluded, so the logo images redirected to /login when logged out.
  matcher: ["/((?!api|_next/static|_next/image|.*\\.[a-zA-Z0-9]+$).*)"],
};

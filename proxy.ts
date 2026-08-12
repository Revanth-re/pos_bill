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
export default auth((req) => {
  const isAuthed = !!req.auth;
  const isAuthRoute = req.nextUrl.pathname.startsWith("/login") || req.nextUrl.pathname.startsWith("/register");

  if (!isAuthed && !isAuthRoute) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthed && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|manifest.json|sw.js|icons).*)"],
};

import { NextResponse } from "next/server";

// Debug: open https://getbillo.vercel.app/api/where to see which build/env Vercel is running.
export const dynamic = "force-dynamic";
export function GET(req: Request) {
  return NextResponse.json({
    build: "2026-10-08-getbillo-fix-2",
    host: req.headers.get("x-forwarded-host") ?? req.headers.get("host"),
    NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? null,
    AUTH_URL: process.env.AUTH_URL ?? null,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ?? null,
  });
}

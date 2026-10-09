import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

// Health check: open https://getbillo.vercel.app/api/where
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  const dbUrl = process.env.DATABASE_URL ?? "";
  let db: string;
  try {
    const t = Date.now();
    const users = await prisma.user.count();
    db = `OK — ${users} users, ${Date.now() - t}ms`;
  } catch (e) {
    db = `FAILED — ${e instanceof Error ? e.message.slice(0, 300) : String(e)}`;
  }
  return NextResponse.json({
    build: "2026-10-09-mumbai-3",
    region: process.env.VERCEL_REGION ?? null,
    host: req.headers.get("x-forwarded-host") ?? req.headers.get("host"),
    database: db,
    databaseHost: dbUrl.replace(/^.*@/, "").replace(/\/.*$/, "") || "NOT SET",
    AUTH_SECRET: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET ? "set" : "MISSING",
    NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? null,
    AUTH_URL: process.env.AUTH_URL ?? null,
  });
}

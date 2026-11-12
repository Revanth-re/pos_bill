import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

/**
 * GET /api/health — tiny database ping. Vercel calls it once a day (vercel.json "crons"),
 * which counts as database activity so the Supabase free plan doesn't pause the project.
 * Also handy for uptime monitors. Shows no settings or data.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const t = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, db: "up", ms: Date.now() - t });
  } catch {
    return NextResponse.json({ ok: false, db: "down" }, { status: 503 });
  }
}

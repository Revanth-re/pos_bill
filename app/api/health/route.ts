import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { alertDbDown, alertDbRecovered } from "@/lib/alerts";

/**
 * GET /api/health — tiny database ping.
 * - Vercel calls it once a day (vercel.json "crons") so the Supabase free plan sees activity.
 * - An uptime monitor (e.g. UptimeRobot, every 5 min) calls it too: if the database is paused or
 *   down it answers 503 AND emails ALERT_EMAIL. Shows no settings or data.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const t = Date.now();
  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) => setTimeout(() => reject(new Error("timeout after 10s")), 10_000)),
    ]);
    await alertDbRecovered();
    return NextResponse.json({ ok: true, db: "up", ms: Date.now() - t });
  } catch (err) {
    await alertDbDown(err, "health check");
    return NextResponse.json({ ok: false, db: "down" }, { status: 503 });
  }
}

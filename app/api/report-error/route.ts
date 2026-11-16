import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { alertDbDown, sendAlert } from "@/lib/alerts";

/**
 * POST /api/report-error — called by the app's error screen when a user can't open a page.
 * Checks the database itself; if it's down → "DATABASE DOWN" email, otherwise "app error" email.
 * Rate-limited by lib/alerts (max one email per problem every 30 min). Sends no user data.
 */
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { page?: string; digest?: string };
  const page = String(body.page ?? "").slice(0, 80);
  const digest = String(body.digest ?? "").slice(0, 40);
  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) => setTimeout(() => reject(new Error("timeout after 8s")), 8_000)),
    ]);
    await sendAlert(
      "app-error",
      "Users are seeing an error screen",
      `A user got "Couldn't load this page".\nThe database is UP, so it's an app/server error.\nPage: ${page}\nError code: ${digest}\nCheck Vercel → Logs for this error code.`
    );
  } catch (err) {
    await alertDbDown(err, `user error screen on ${page}`);
  }
  return NextResponse.json({ ok: true });
}

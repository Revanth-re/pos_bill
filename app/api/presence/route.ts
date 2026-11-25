import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireSession } from "@/lib/auth";

/** Heartbeat: the app calls this about once a minute while it is open, for "Online now" on /admin. */
export async function POST(req: Request) {
  const session = await requireSession().catch(() => null);
  if (!session?.staffId) return NextResponse.json({ ok: false }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { path?: string };
  const path = String(body.path ?? "").slice(0, 80) || null;
  await prisma.staff
    .update({ where: { id: session.staffId }, data: { lastSeenAt: new Date(), lastSeenPath: path } })
    .catch(() => {});
  return NextResponse.json({ ok: true });
}

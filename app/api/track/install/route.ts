import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireSession, UnauthenticatedError } from "@/lib/auth";

/**
 * Records that a shop uses Billo as an INSTALLED app on a device (home-screen app or Play Store app).
 * Once per device (random id kept on the phone). Shown on /admin. Stored as an audit-log row: no table change.
 */
const Body = z.object({
  deviceId: z.string().regex(/^[a-z0-9-]{8,64}$/i),
  source: z.enum(["playstore", "chrome"]),
  platform: z.string().max(40).optional(),
});

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });
    const { deviceId, source, platform } = parsed.data;
    const seen = await prisma.auditLog.findFirst({
      where: { businessId: session.businessId, action: "APP_INSTALLED", metadata: { path: ["deviceId"], equals: deviceId } },
      select: { id: true },
    });
    if (!seen) {
      await prisma.auditLog.create({
        data: {
          businessId: session.businessId,
          staffId: session.staffId,
          action: "APP_INSTALLED",
          entity: "Device",
          entityId: deviceId,
          metadata: { deviceId, source, platform: platform ?? "" },
        },
      });
    }
    return NextResponse.json({ ok: true, new: !seen });
  } catch (e) {
    if (e instanceof UnauthenticatedError) return NextResponse.json({ ok: false }, { status: 401 });
    console.error("[track install]", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

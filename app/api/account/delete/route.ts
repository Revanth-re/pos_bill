import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireSession, UnauthenticatedError } from "@/lib/auth";
import { deleteOwnerAccount } from "@/lib/account/deleteAccount";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const Body = z.object({ password: z.string().min(1), confirm: z.literal("DELETE") });

/** Owner deletes their account and every shop they own. Needs their password + typing DELETE. */
export async function POST(req: Request) {
  try {
    const session = await requireSession();
    if (session.role !== "OWNER") {
      return NextResponse.json({ error: "Only the shop owner can delete the account." }, { status: 403 });
    }
    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Type DELETE and enter your password to confirm." }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { passwordHash: true } });
    if (!user?.passwordHash || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
      return NextResponse.json({ error: "Wrong password. Nothing was deleted." }, { status: 401 });
    }

    const result = await deleteOwnerAccount(session.userId);
    console.info("[account delete]", session.userId, result.businesses, "shops", result.counts);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    if (e instanceof UnauthenticatedError) return NextResponse.json({ error: "Login required" }, { status: 401 });
    console.error("[account delete]", e);
    return NextResponse.json({ error: "Could not delete the account. Nothing was deleted — please try again." }, { status: 500 });
  }
}

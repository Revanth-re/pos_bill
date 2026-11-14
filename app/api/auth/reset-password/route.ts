import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { clearFailedLogins, verifyResetOtp } from "@/lib/auth/security";

const schema = z.object({
  email: z.string().email(),
  otp: z.string().regex(/^\d{6}$/, "Enter the 6-digit code"),
  password: z.string().min(6, "At least 6 characters").max(100),
});

/** POST /api/auth/reset-password { email, otp, password } */
export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Check the details." }, { status: 400 });
  try {
    const email = parsed.data.email.toLowerCase().trim();
    const result = await verifyResetOtp(email, parsed.data.otp);
    if (result === "too-many") return NextResponse.json({ error: "Too many wrong codes. Ask for a new code." }, { status: 429 });
    if (result === "expired") return NextResponse.json({ error: "This code has expired. Ask for a new code." }, { status: 400 });
    if (result === "wrong") return NextResponse.json({ error: "Wrong code. Check the email and try again." }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (!user) return NextResponse.json({ error: "Wrong code. Check the email and try again." }, { status: 400 });
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(parsed.data.password, 10) } });
    await clearFailedLogins(email);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Couldn't reset the password. Please try again." }, { status: 500 });
  }
}
// sj
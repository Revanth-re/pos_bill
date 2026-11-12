import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { createResetOtp, emailConfigured, sendResetEmail } from "@/lib/auth/security";

/**
 * POST /api/auth/forgot-password { email } — emails a 6-digit reset code.
 * Always answers the same way whether or not the email exists (doesn't reveal accounts).
 */
export async function POST(req: Request) {
  const parsed = z.object({ email: z.string().email() }).safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
  if (!emailConfigured()) {
    return NextResponse.json(
      { error: "Email reset isn't switched on yet. Ask your shop owner to reset your password from Staff, or WhatsApp Billo support." },
      { status: 503 }
    );
  }
  try {
    const email = parsed.data.email.toLowerCase().trim();
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (user) {
      const otp = await createResetOtp(email);
      if (!otp) return NextResponse.json({ error: "Too many codes sent. Please wait 15 minutes." }, { status: 429 });
      await sendResetEmail(email, otp);
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Couldn't send the code. Please try again." }, { status: 500 });
  }
}

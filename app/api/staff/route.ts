import { NextResponse } from "next/server";
import { ensureKitchenRole } from "@/lib/db/ensureKitchenRole";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireSession, UnauthenticatedError } from "@/lib/auth";
import { assertPermission, PermissionError } from "@/lib/permissions";

export async function GET() {
  try {
    const session = await requireSession();
    assertPermission(session.role, "staff.manage");

    const staff = await prisma.staff.findMany({
      where: { businessId: session.businessId },
      include: {
        user: { select: { name: true, email: true } },
        _count: { select: { invoices: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ staff });
  } catch (err) {
    if (err instanceof UnauthenticatedError) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    if (err instanceof PermissionError) return NextResponse.json({ error: "Not permitted" }, { status: 403 });
    console.error(err);
    return NextResponse.json({ error: "Unable to load staff." }, { status: 500 });
  }
}

const staffSchema = z.object({
  name: z.string().min(1).max(80),
  email: z.string().email(),
  password: z.string().min(6).max(72),
  role: z.enum(["OWNER", "MANAGER", "CASHIER", "KITCHEN"]),
});

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    assertPermission(session.role, "staff.manage");

    const parsed = staffSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid staff details", issues: parsed.error.flatten() }, { status: 400 });
    }

    // One email = one login. Every staff member (any role) needs a NEW email that isn't used anywhere in Billo.
    const email = parsed.data.email.trim().toLowerCase();
    const existingUser = await prisma.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } }, select: { id: true } });
    if (existingUser) {
      return NextResponse.json(
        { error: "This email already has a Billo account. Please use a different email for this staff member." },
        { status: 409 }
      );
    }

    if (parsed.data.role === "KITCHEN") await ensureKitchenRole();
    const passwordHash = await bcrypt.hash(parsed.data.password, 10);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { name: parsed.data.name, email, passwordHash },
      });

      const staff = await tx.staff.create({
        data: { businessId: session.businessId, userId: user.id, role: parsed.data.role },
        include: { user: { select: { name: true, email: true } } },
      });

      await tx.auditLog.create({
        data: {
          businessId: session.businessId,
          staffId: session.staffId,
          action: "STAFF_ADDED",
          entity: "Staff",
          entityId: staff.id,
          metadata: { role: parsed.data.role, email: parsed.data.email },
        },
      });

      return staff;
    });

    return NextResponse.json({ staff: result }, { status: 201 });
  } catch (err) {
    if (err instanceof UnauthenticatedError) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    if (err instanceof PermissionError) return NextResponse.json({ error: "Not permitted" }, { status: 403 });
    if ((err as { code?: string })?.code === "P2002") {
      return NextResponse.json({ error: "This email already has a Billo account. Please use a different email for this staff member." }, { status: 409 });
    }
    console.error(err);
    const msg = String((err as Error)?.message ?? "");
    if (/KITCHEN|StaffRole|invalid input value for enum/i.test(msg)) {
      return NextResponse.json(
        { error: "Kitchen role isn't set up yet. Run: npx prisma generate, then npx prisma migrate deploy, and restart the app." },
        { status: 500 }
      );
    }
    return NextResponse.json({ error: "Unable to add the staff member." }, { status: 500 });
  }
}

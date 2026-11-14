import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireSession, UnauthenticatedError } from "@/lib/auth";
import { assertPermission, PermissionError } from "@/lib/permissions";
import bcrypt from "bcryptjs";
import { clearFailedLogins } from "@/lib/auth/security";
import { ensureKitchenRole } from "@/lib/db/ensureKitchenRole";

const updateSchema = z.object({
  role: z.enum(["OWNER", "MANAGER", "CASHIER", "KITCHEN"]).optional(),
  status: z.enum(["ACTIVE", "DISABLED"]).optional(),
  /** Owner/manager sets a new password for this staff member (e.g. they forgot it). */
  password: z.string().min(6).max(100).optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    assertPermission(session.role, "staff.manage");
    const { id } = await params;

    const parsed = updateSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid update" }, { status: 400 });

    const target = await prisma.staff.findFirst({ where: { id, businessId: session.businessId }, include: { user: { select: { id: true, email: true } } } });
    if (!target) return NextResponse.json({ error: "Staff member not found" }, { status: 404 });

    // Password reset: never another owner's (only your own).
    if (parsed.data.password) {
      if (target.role === "OWNER" && target.id !== session.staffId) {
        return NextResponse.json({ error: "Only that owner can change their own password." }, { status: 403 });
      }
      await prisma.user.update({ where: { id: target.user.id }, data: { passwordHash: await bcrypt.hash(parsed.data.password, 10) } });
      await clearFailedLogins(target.user.email);
      await prisma.auditLog.create({
        data: { businessId: session.businessId, staffId: session.staffId, action: "STAFF_PASSWORD_RESET", entity: "Staff", entityId: target.id },
      });
      if (!parsed.data.role && !parsed.data.status) return NextResponse.json({ ok: true });
    }
    if (parsed.data.role === "KITCHEN") await ensureKitchenRole();
    const updates = { role: parsed.data.role, status: parsed.data.status };

    // Guard: never allow the business to end up with zero active owners.
    const demotingOwner =
      target.role === "OWNER" && ((parsed.data.role && parsed.data.role !== "OWNER") || parsed.data.status === "DISABLED");
    if (demotingOwner) {
      const activeOwners = await prisma.staff.count({
        where: { businessId: session.businessId, role: "OWNER", status: "ACTIVE" },
      });
      if (activeOwners <= 1) {
        return NextResponse.json({ error: "A business must have at least one active owner." }, { status: 422 });
      }
    }

    const staff = await prisma.staff.update({
      where: { id },
      data: updates,
      include: { user: { select: { name: true, email: true } } },
    });

    return NextResponse.json({ staff });
  } catch (err) {
    if (err instanceof UnauthenticatedError) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    if (err instanceof PermissionError) return NextResponse.json({ error: "Not permitted" }, { status: 403 });
    console.error(err);
    return NextResponse.json({ error: "Unable to update the staff member." }, { status: 500 });
  }
}

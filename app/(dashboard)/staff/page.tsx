import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { StaffScreen } from "./StaffScreen";

export default async function StaffPage() {
  const session = await requireSession();

  const staff = await prisma.staff.findMany({
    where: { businessId: session.businessId },
    include: { user: { select: { name: true, email: true } }, _count: { select: { invoices: true } } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <StaffScreen
      currentStaffId={session.staffId}
      initialStaff={staff.map((s) => ({
        id: s.id,
        name: s.user.name,
        email: s.user.email,
        role: s.role,
        status: s.status,
        billCount: s._count.invoices,
      }))}
    />
  );
}

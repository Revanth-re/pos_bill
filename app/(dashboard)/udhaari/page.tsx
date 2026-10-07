import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { can } from "@/lib/permissions";
import { CustomersScreen } from "../customers/CustomersScreen";

// Udhaari (eat now, pay later) — separate from Tiffin plans (pay first, eat later).
export default async function UdhaariPage() {
  const session = await requireSession();
  const business = await prisma.business.findUniqueOrThrow({ where: { id: session.businessId }, select: { name: true } });
  return (
    <CustomersScreen
      mode="udhaari"
      businessName={business.name}
      canManage={can(session.role, "customers.manage")}
      canRecordPayment={can(session.role, "payments.record")}
    />
  );
}

import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { can } from "@/lib/permissions";
import { CustomersScreen } from "./CustomersScreen";

export default async function CustomersPage() {
  const session = await requireSession();
  const business = await prisma.business.findUniqueOrThrow({ where: { id: session.businessId }, select: { name: true } });
  return (
    <CustomersScreen
      businessName={business.name}
      canManage={can(session.role, "customers.manage")}
      canRecordPayment={can(session.role, "payments.record")}
      canDelete={can(session.role, "billing.void")}
    />
  );
}

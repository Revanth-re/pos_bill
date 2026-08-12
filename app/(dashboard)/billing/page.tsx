import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { BillingScreen } from "@/components/pos/BillingScreen";

export default async function BillingPage() {
  const session = await requireSession();
  const business = await prisma.business.findUniqueOrThrow({
    where: { id: session.businessId },
    select: { name: true },
  });

  return <BillingScreen businessName={business.name} cashierName={session.name} />;
}

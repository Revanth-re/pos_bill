import { requireSession } from "@/lib/auth";
import { getShellBusiness } from "@/lib/data/business";
import { BillingScreen } from "@/components/pos/BillingScreen";

export default async function BillingPage() {
  const session = await requireSession();
  // Cached shop name (same cache the app shell uses) — no database trip on every visit.
  const business = await getShellBusiness(session.businessId);

  return <BillingScreen businessName={business?.name ?? ""} cashierName={session.name} />;
}

import type { Metadata } from "next";
import { requireSession } from "@/lib/auth";
import { KitchenScreen } from "./KitchenScreen";

export const metadata: Metadata = { title: "Kitchen · Billo" };

export default async function KitchenPage() {
  const session = await requireSession();
  return <KitchenScreen kitchenOnly={session.role === "KITCHEN"} userName={session.name} />;
}

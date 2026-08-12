import Link from "next/link";
import { ShoppingBag, Users, Wallet, Utensils, BarChart3, Lock, UserCog, Settings, User, ChevronRight } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { can, type Permission } from "@/lib/permissions";

const ITEMS: { href: string; label: string; icon: typeof Users; permission?: Permission }[] = [
  { href: "/profile", label: "Profile", icon: User },
  { href: "/products", label: "Products", icon: ShoppingBag, permission: "products.view" },
  { href: "/customers", label: "Customers & Udhaari", icon: Users, permission: "customers.view" },
  { href: "/expenses", label: "Expenses", icon: Wallet, permission: "expenses.view" },
  { href: "/tiffin", label: "Tiffin / Meal Subscriptions", icon: Utensils, permission: "tiffin.manage" },
  { href: "/reports", label: "Reports", icon: BarChart3, permission: "reports.view" },
  { href: "/day-closing", label: "Day Closing", icon: Lock, permission: "dayClosing.perform" },
  { href: "/staff", label: "Staff", icon: UserCog, permission: "staff.manage" },
  { href: "/settings", label: "Settings", icon: Settings, permission: "settings.manage" },
];

export default async function MorePage() {
  const session = await requireSession();
  const visible = ITEMS.filter((item) => !item.permission || can(session.role, item.permission));

  return (
    <div className="p-4">
      <h1 className="mb-4 text-2xl font-extrabold text-ink">More</h1>
      <ul className="rounded-2xl border border-border bg-surface divide-y divide-border shadow-sm overflow-hidden">
        {visible.map(({ href, label, icon: Icon }) => (
          <li key={href}>
            <Link href={href} className="flex items-center gap-3 p-4 touch-target transition-colors hover:bg-paper">
              <Icon className="h-5 w-5 text-ink-soft shrink-0" />
              <span className="flex-1 font-bold text-ink">{label}</span>
              <ChevronRight className="h-5 w-5 text-muted shrink-0" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

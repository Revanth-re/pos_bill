"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Receipt,
  LineChart,
  ShoppingBag,
  Package,
  Users,
  Wallet,
  Utensils,
  BarChart3,
  UserCog,
  Settings,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { can, type Permission } from "@/lib/permissions";
import type { StaffRole } from "@prisma/client";

const ITEMS: { href: string; label: string; icon: typeof LayoutDashboard; permission?: Permission }[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/billing", label: "Billing", icon: Receipt, permission: "billing.create" },
  { href: "/sales", label: "Sales", icon: LineChart, permission: "sales.view.own" },
  { href: "/products", label: "Products", icon: ShoppingBag, permission: "products.view" },
  { href: "/inventory", label: "Inventory", icon: Package, permission: "inventory.view" },
  { href: "/customers", label: "Customers", icon: Users, permission: "customers.view" },
  { href: "/expenses", label: "Expenses", icon: Wallet, permission: "expenses.view" },
  { href: "/tiffin", label: "Tiffin", icon: Utensils, permission: "tiffin.manage" },
  { href: "/reports", label: "Reports", icon: BarChart3, permission: "reports.view" },
  { href: "/day-closing", label: "Day Closing", icon: Lock, permission: "dayClosing.perform" },
  { href: "/staff", label: "Staff", icon: UserCog, permission: "staff.manage" },
  { href: "/settings", label: "Settings", icon: Settings, permission: "settings.manage" },
];

export function Sidebar({ role, businessName }: { role: StaffRole; businessName: string }) {
  const pathname = usePathname();
  const visibleItems = ITEMS.filter((item) => !item.permission || can(role, item.permission));

  return (
    <aside className="hidden md:flex md:w-56 lg:w-64 shrink-0 flex-col border-r border-border bg-surface">
      <div className="flex items-center gap-2 px-4 py-4">
        <div className="flex h-9 w-9 items-center justify-center border-2 border-ink bg-brand text-base font-black text-white">
          ₹
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-ink">{businessName}</p>
          <p className="text-xs text-muted">{role.charAt(0) + role.slice(1).toLowerCase()}</p>
        </div>
      </div>
      <nav className="flex-1 space-y-0.5 px-2 py-2">
        {visibleItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active ? "bg-brand-soft text-brand-dark" : "text-ink-soft hover:bg-paper"
              )}
            >
              <Icon className="h-4.5 w-4.5" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

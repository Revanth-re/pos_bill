"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Receipt, LineChart, Package, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/billing", label: "Billing", icon: Receipt },
  { href: "/sales", label: "Sales", icon: LineChart },
  { href: "/inventory", label: "Inventory", icon: Package },
  { href: "/more", label: "More", icon: MoreHorizontal },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 flex border-t border-border bg-surface pb-[env(safe-area-inset-bottom)]">
      {ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium touch-target",
              active ? "text-brand" : "text-muted"
            )}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

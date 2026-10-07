"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Receipt, LineChart, ReceiptText, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/LanguageProvider";

const ITEMS = [
  { href: "/dashboard", labelKey: "nav.home", icon: Home },
  { href: "/billing", labelKey: "nav.billing", icon: Receipt },
  { href: "/bills", labelKey: "nav.bills", icon: ReceiptText },
  { href: "/sales", labelKey: "nav.sales", icon: LineChart },
  { href: "/more", labelKey: "nav.more", icon: MoreHorizontal },
];

export function BottomNav() {
  const pathname = usePathname();
  const t = useT();

  return (
    <nav className="no-select md:hidden fixed bottom-0 left-0 right-0 z-30 flex border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_rgba(6,72,76,0.06)]">
      {ITEMS.map(({ href, labelKey, icon: Icon }) => {
        const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "relative flex h-14 flex-1 flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors duration-150",
              active ? "text-brand-dark font-semibold" : "text-muted active:text-ink"
            )}
          >
            {active && <span className="absolute top-0 h-[3px] w-8 rounded-b-full bg-brand" />}
            <span className={cn("flex h-7 w-12 items-center justify-center rounded-full transition-colors duration-150", active && "bg-brand-soft")}>
              <Icon className="h-5 w-5" />
            </span>
            {t(labelKey)}
          </Link>
        );
      })}
    </nav>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User } from "lucide-react";

export function TopBar({ businessName }: { businessName: string }) {
  const pathname = usePathname();

  // The billing/POS screen has its own dense header (search, connection
  // status, held bills) — stacking a second top bar there would eat
  // screen space the cashier needs. Every other screen gets this one.
  if (pathname.startsWith("/billing")) return null;

  return (
    <header className="no-select flex items-center justify-between border-b border-border bg-surface px-4 py-3 md:hidden">
      <span className="truncate text-base font-extrabold text-ink">{businessName}</span>
      <Link
        href="/profile"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand-dark"
        aria-label="Profile"
      >
        <User className="h-4.5 w-4.5" />
      </Link>
    </header>
  );
}

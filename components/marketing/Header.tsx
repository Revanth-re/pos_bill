"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { InstallButton } from "./InstallButton";
import { useSession } from "next-auth/react";
import { SITE } from "@/lib/marketing/site";

const NAV = [
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/for/tiffin-centre-billing-app", label: "Tiffin centres" },
  { href: "/for/restaurant-billing-software", label: "Restaurants" },
  { href: "/hi", label: "हिन्दी" },
  { href: "/contact", label: "Contact" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const { status } = useSession();
  const loggedIn = status === "authenticated";
  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-paper/90 backdrop-blur">
      <div className="container-x flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5" aria-label="Billo home">
          <img src="/brand/billo-icon.png" alt="" width={36} height={36} className="h-9 w-9 object-contain" />
          <img src="/brand/billo-wordmark.png" alt="Billo" width={84} height={28} className="h-7 w-auto" />
        </Link>
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} lang={n.href === "/hi" ? "hi" : undefined} className={`rounded-lg px-3 py-2 text-sm font-semibold text-ink-soft transition-colors hover:bg-brand-soft/60 hover:text-brand-dark ${n.href === "/hi" ? "font-[family-name:var(--font-hindi-face)]" : ""}`}>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <Link href={loggedIn ? SITE.appUrl : SITE.loginUrl} className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-brand-dark hover:bg-brand-soft/60 sm:inline-flex">
            {loggedIn ? "Open Billo" : "Login"}
          </Link>
          <InstallButton className="btn btn-primary !min-h-11 !gap-1.5 whitespace-nowrap !px-3.5 text-sm" iconClass="hidden h-4 w-4 min-[360px]:block" />
          <button onClick={() => setOpen(!open)} className="flex h-11 w-11 items-center justify-center rounded-xl text-brand-dark hover:bg-brand-soft/60 lg:hidden" aria-label="Menu" aria-expanded={open}>
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>
      {open && (
        <nav className="border-t border-border bg-paper lg:hidden" aria-label="Mobile">
          <div className="container-x grid gap-1 py-3">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} onClick={() => setOpen(false)} lang={n.href === "/hi" ? "hi" : undefined} className={`rounded-xl px-3 py-3 text-base font-semibold text-ink hover:bg-brand-soft/60 ${n.href === "/hi" ? "font-[family-name:var(--font-hindi-face)]" : ""}`}>
                {n.label}
              </Link>
            ))}
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Link href={loggedIn ? SITE.appUrl : SITE.loginUrl} className="btn btn-ghost">{loggedIn ? "Open Billo" : "Login"}</Link>
              <InstallButton className="btn btn-primary" />
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}

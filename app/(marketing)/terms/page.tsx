import type { Metadata } from "next";
import { PageHero } from "@/components/marketing/PageHero";
import { SITE } from "@/lib/marketing/site";

export const metadata: Metadata = { title: "Terms of Service | Billo", description: "Terms for using the Billo billing app and Counter Kit.", alternates: { canonical: "/terms" } };

export default function Terms() {
  return (
    <>
      <PageHero crumbs={[{ name: "Terms", href: "/terms" }]} title="Terms of Service" text="Last updated: October 2026" />
      <article className="container-x max-w-3xl space-y-5 py-12 text-[16px] leading-relaxed text-ink-soft [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-ink">
        <h2>Plans</h2>
        <p>App plans are prepaid for the period purchased (3, 6 or 12 months). The ₹299 offer is for first-time customers only. The Counter Kit (₹4,799) includes a 58mm Bluetooth printer, setup and 12 months of app access.</p>
        <h2>Renewals</h2>
        <p>Plans do not auto-renew. We will remind you on WhatsApp before your plan ends.</p>
        <h2>Printer warranty</h2>
        <p>Printers supplied with the Counter Kit carry the manufacturer&apos;s warranty. We help with replacements during the warranty period.</p>
        <h2>Your responsibilities</h2>
        <p>You are responsible for the accuracy of prices, taxes and GST details entered in the app and for complying with applicable tax laws.</p>
        <h2>Availability</h2>
        <p>We aim for high availability but cannot guarantee uninterrupted service; Billo keeps billing during short network drops and syncs later.</p>
        <h2>Contact</h2>
        <p>{SITE.email} · {SITE.phone}</p>
      </article>
    </>
  );
}

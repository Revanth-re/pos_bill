import type { Metadata } from "next";
import { PageHero } from "@/components/marketing/PageHero";
import { SITE } from "@/lib/marketing/site";

export const metadata: Metadata = { title: "Terms of Service | Billo", description: "Terms for using the Billo billing app.", alternates: { canonical: "/terms" } };

export default function Terms() {
  return (
    <>
      <PageHero crumbs={[{ name: "Terms", href: "/terms" }]} title="Terms of Service" text="Last updated: October 2026" />
      <article className="container-x max-w-3xl space-y-5 py-12 text-[16px] leading-relaxed text-ink-soft [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-ink">
        <h2>Free use</h2>
        <p>Billo is currently free to use, and setup of the app and your printer at your counter is free. If we ever introduce paid features, we will tell you in advance on WhatsApp — nothing will be charged without your agreement.</p>
        <h2>Printers</h2>
        <p>If you buy a printer yourself, it is between you and the seller. We help you choose a printer that works with Billo and set it up free.</p>
        <h2>Printer warranty</h2>
        <p>Printers carry their manufacturer&apos;s warranty. We help you with printer setup and troubleshooting.</p>
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

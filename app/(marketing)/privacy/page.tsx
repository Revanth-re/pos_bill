import type { Metadata } from "next";
import { PageHero } from "@/components/marketing/PageHero";
import { SITE } from "@/lib/marketing/site";

export const metadata: Metadata = { title: "Privacy Policy | Billo", description: "How Billo collects, uses and protects your business data.", alternates: { canonical: "/privacy" } };

export default function Privacy() {
  return (
    <>
      <PageHero crumbs={[{ name: "Privacy", href: "/privacy" }]} title="Privacy Policy" text="Last updated: October 2026" />
      <article className="container-x max-w-3xl space-y-5 py-12 text-[16px] leading-relaxed text-ink-soft [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-ink">
        <p>Billo (&quot;we&quot;) provides billing software for restaurants and food businesses at {SITE.url} and {SITE.appUrl}. This policy explains what data we handle and why.</p>
        <h2>Data we collect</h2>
        <p>Account details (name, email, phone, business name, GSTIN), and the business data you enter — products, bills, payments, customers, udhaari, staff and expenses.</p>
        <h2>How we use it</h2>
        <p>Only to run the service for you: storing bills, generating reports, printing receipts and providing support. We do not sell your data or your customers&apos; data.</p>
        <h2>Your customers&apos; data</h2>
        <p>Customer names and phone numbers you add for udhaari belong to your business. We process them only on your behalf.</p>
        <h2>Storage & security</h2>
        <p>Data is stored on secure cloud servers with encrypted connections (HTTPS). Access inside your business is controlled by staff roles.</p>
        <h2>Deleting your data</h2>
        <p>Email {SITE.email} to export or delete your business data.</p>
        <h2>Contact</h2>
        <p>{SITE.email} · {SITE.phone}</p>
      </article>
    </>
  );
}

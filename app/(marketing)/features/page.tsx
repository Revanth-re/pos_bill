import type { Metadata } from "next";
import { FeatureGrid, CtaBand } from "@/components/marketing/Sections";
import { PageHero } from "@/components/marketing/PageHero";
import { FreeBill } from "@/components/marketing/FreeBill";
import { JsonLd, breadcrumbLd } from "@/components/marketing/JsonLd";

export const metadata: Metadata = {
  title: "All Features Free – Token Printing, Udhaari, GST Bills & Reports | Billo",
  description: "Every Billo feature is free:  3-second billing, token printing on Bluetooth thermal printers, udhaari khata, tiffin plans, bill reprint/refund, staff roles, cashier shifts, GST bills and owner dashboard.",
  alternates: { canonical: "/features" },
  openGraph: { url: "/features", images: ["/og-image.png"] },
};

const GROUPS = [
  { title: "Fast billing", points: ["One-tap product buttons with photos", "Categories, search and favourites", "Quantity +/− and line discounts", "Hold bills and resume later", "Save without printing, or print instantly"] },
  { title: "Printing & bill formats", points: ["58mm & 80mm Bluetooth thermal printers", "Large token number for the kitchen", "Classic, Quick Token, GST Invoice, Paper Saver formats", "Optional separate kitchen slip", "Live bill preview before printing"] },
  { title: "Bill management", points: ["Search & filter every bill", "Reprint and download", "Cancel (same day) or refund with reason", "Udhaari auto-reversed on cancel", "Full audit: who, when, why, how much"] },
  { title: "Udhaari & tiffin", points: ["One-tap udhaari to customer's khata", "Day-by-day history with items", "Part payments by cash or UPI", "WhatsApp & printed statements", "Prepaid tiffin plans with meals left"] },
  { title: "Staff & cash control", points: ["Owner, manager & cashier roles", "Cashier shifts with opening cash", "Expected vs actual cash difference", "Day closing summary", "Staff performance ranking"] },
  { title: "Owner reports", points: ["Today's sales, orders, average bill", "Cash / UPI / card / credit split", "Best sellers & peak hours", "Expenses and profit view", "Daily, weekly, monthly trends"] },
];

export default function FeaturesPage() {
  return (
    <>
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Features", path: "/features" }])} />
      <PageHero crumbs={[{ name: "Features", href: "/features" }]} eyebrow="Every feature · 100% free" title="Everything you need at the counter — all free" text="No premium plan, no locked features, no setup cost. Billo keeps the traditional Indian counter workflow and makes every part of it faster." />
      <section className="container-x py-14"><FeatureGrid /></section>
      <section className="bg-white py-16">
        <div className="container-x grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {GROUPS.map((g) => (
            <div key={g.title} className="card p-6">
              <h2 className="flex items-center justify-between gap-2 text-xl font-extrabold text-ink">{g.title}<span className="rounded-md bg-accent px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-wide text-brand-deep">Free</span></h2>
              <ul className="mt-3 space-y-2 text-[15px] text-ink-soft">
                {g.points.map((p) => <li key={p} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-dark" />{p}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </section>
      <section className="container-x py-16"><FreeBill /></section>
      <CtaBand />
    </>
  );
}

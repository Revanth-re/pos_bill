import type { Metadata } from "next";
import { Pricing, Faq, CtaBand } from "@/components/marketing/Sections";
import { PageHero } from "@/components/marketing/PageHero";
import { JsonLd, faqLd, breadcrumbLd } from "@/components/marketing/JsonLd";
import { FAQS } from "@/lib/marketing/site";

export const metadata: Metadata = {
  title: "Billo is Free – Free Billing App + Free Setup at Your Shop",
  description: "Billo is a free billing app for Indian shops and restaurants. Free setup of your printer and app at your counter, free live demo, free support. No card, no hidden charges.",
  alternates: { canonical: "/pricing" },
  openGraph: { url: "/pricing", title: "Billo is free – free app + free setup", images: ["/og-image.png"] },
};

const PRICE_FAQ = [
  FAQS[1],
  { q: "Is Billo really free?", a: "Yes. The Billo platform is free to use — unlimited bills, token printing, udhaari, staff and reports. There is no card, contract or hidden charge." },
  { q: "Is setup free too?", a: "Yes. We set up the billing machine — your Bluetooth printer and the Billo app — load your menu with photos, train your staff and give you a live demo, free." },
  { q: "I don't have a printer. What do I do?", a: "Tell us when you book. We'll suggest a printer that works with Billo and set it up for you." },
  FAQS[2],
];

export default function PricingPage() {
  return (
    <>
      <JsonLd data={[faqLd(PRICE_FAQ), breadcrumbLd([{ name: "Home", path: "/" }, { name: "Free setup", path: "/pricing" }])]} />
      <PageHero crumbs={[{ name: "Free setup", href: "/pricing" }]} eyebrow="Free for your shop" title="Billo is free — and we set it up for you" text="Free platform, free setup of your printer and app, and a free live demo at your counter." />
      <section className="container-x py-14"><Pricing /></section>
      <section className="bg-white py-16"><div className="container-x"><h2 className="mb-8 text-center text-3xl font-extrabold">Questions about free setup</h2><Faq items={PRICE_FAQ} /></div></section>
      <CtaBand title="Not sure which plan fits?" text="Message us on WhatsApp — we'll suggest the right setup for your shop in 2 minutes." />
    </>
  );
}

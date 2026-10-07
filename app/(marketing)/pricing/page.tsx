import type { Metadata } from "next";
import { Pricing, Faq, CtaBand } from "@/components/marketing/Sections";
import { PageHero } from "@/components/marketing/PageHero";
import { JsonLd, faqLd, breadcrumbLd } from "@/components/marketing/JsonLd";
import { FAQS } from "@/lib/marketing/site";

export const metadata: Metadata = {
  title: "Billo Pricing – Restaurant Billing App from ₹299 | Printer Kit ₹4,799",
  description: "Billo pricing: ₹299 for 3 months (first-time offer), ₹599 for 6 months, ₹999 for 1 year. Counter Kit with 58mm Bluetooth printer, setup and 1 year app free for ₹4,799.",
  alternates: { canonical: "/pricing" },
  openGraph: { url: "/pricing", title: "Billo Pricing – from ₹299", images: ["/og-image.png"] },
};

const PRICE_FAQ = [FAQS[1], FAQS[3], FAQS[2], { q: "Is there any setup or yearly hidden fee?", a: "No hidden fees. The Counter Kit is a one-time ₹4,799 with the first year of the app included. After that, renew the app at ₹999/year or ₹599 for 6 months." }];

export default function PricingPage() {
  return (
    <>
      <JsonLd data={[faqLd(PRICE_FAQ), breadcrumbLd([{ name: "Home", path: "/" }, { name: "Pricing", path: "/pricing" }])]} />
      <PageHero crumbs={[{ name: "Pricing", href: "/pricing" }]} eyebrow="Pricing" title="Simple, honest pricing for every counter" text="Start with the complete Counter Kit — printer, setup and a full year of Billo — or use the app with the printer you already have." />
      <section className="container-x py-14"><Pricing /></section>
      <section className="bg-white py-16"><div className="container-x"><h2 className="mb-8 text-center text-3xl font-extrabold">Pricing questions</h2><Faq items={PRICE_FAQ} /></div></section>
      <CtaBand title="Not sure which plan fits?" text="Message us on WhatsApp — we'll suggest the right setup for your shop in 2 minutes." />
    </>
  );
}

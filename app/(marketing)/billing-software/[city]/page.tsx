import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MapPin, MessageCircle, Phone } from "lucide-react";
import { CITIES, USE_CASES, SITE, whatsapp } from "@/lib/marketing/site";
import { PageHero } from "@/components/marketing/PageHero";
import { FeatureGrid, Pricing, Faq, CtaBand, SectionHead } from "@/components/marketing/Sections";
import { JsonLd, faqLd, breadcrumbLd } from "@/components/marketing/JsonLd";

export const dynamicParams = false;
export function generateStaticParams() {
  return CITIES.map((c) => ({ city: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ city: string }> }): Promise<Metadata> {
  const { city } = await params;
  const c = CITIES.find((x) => x.slug === city);
  if (!c) return {};
  const title = `Restaurant Billing Software in ${c.name} | Billo – Token Printing & Udhaari`;
  const description = `Billo is restaurant & tiffin centre billing software in ${c.name}, ${c.state}. Bluetooth token printing, udhaari khata, GST bills and setup at your shop. Plans from ₹299, printer kit ₹4,799.`;
  return {
    title,
    description,
    keywords: [`restaurant billing software ${c.name}`, `billing software ${c.name}`, `POS ${c.name}`, `tiffin billing app ${c.name}`, `billing machine ${c.name}`],
    alternates: { canonical: `/billing-software/${c.slug}` },
    openGraph: { url: `/billing-software/${c.slug}`, title, description, images: ["/og-image.png"] },
  };
}

export default async function CityPage({ params }: { params: Promise<{ city: string }> }) {
  const { city } = await params;
  const c = CITIES.find((x) => x.slug === city);
  if (!c) notFound();
  const faqs = [
    { q: `Do you set up Billo at shops in ${c.name}?`, a: `Yes. We ship the Billo Counter Kit to your shop in ${c.name} — including areas like ${c.areas.slice(0, 3).join(", ")} — and set up the printer, menu and staff logins with you on a video call. Most shops are billing the same day.` },
    { q: `How much does billing software cost in ${c.name}?`, a: "Billo app plans are ₹299 for the first 3 months, ₹599 for 6 months or ₹999 for a year. The Counter Kit with a 58mm Bluetooth printer, setup and 1 year of the app is ₹4,799." },
    { q: "Which languages does Billo support?", a: "The Billo app is available in 10 Indian languages including Hindi, Tamil, Telugu, Kannada, Marathi, Bengali, Gujarati, Punjabi and Malayalam. Support on WhatsApp and phone in Hindi, English and Telugu." },
  ];
  return (
    <>
      <JsonLd data={[faqLd(faqs), breadcrumbLd([{ name: "Home", path: "/" }, { name: `Billing software in ${c.name}`, path: `/billing-software/${c.slug}` }]),
        { "@context": "https://schema.org", "@type": "Service", serviceType: "Restaurant billing software & POS setup", provider: { "@id": `${SITE.url}/#org` }, areaServed: { "@type": "City", name: c.name, containedInPlace: { "@type": "State", name: c.state } } }]} />
      <PageHero
        crumbs={[{ name: `Billing software in ${c.name}`, href: `/billing-software/${c.slug}` }]}
        eyebrow={`${c.name}, ${c.state}`}
        title={`Restaurant billing software in ${c.name}`}
        text={`Billo helps restaurants, tiffin centres, fast food counters and cafés in ${c.name} bill faster — with token printing, udhaari khata and daily reports on your phone.`}
      >
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <a href={whatsapp(`Hi Billo, I have a shop in ${c.name} and want a demo.`)} target="_blank" rel="noopener" className="btn btn-primary"><MessageCircle className="h-5 w-5" /> Demo in {c.name}</a>
          <a href={`tel:+${SITE.phoneRaw}`} className="btn btn-ghost"><Phone className="h-4 w-4" /> {SITE.phone}</a>
        </div>
      </PageHero>
      <section className="container-x py-14">
        <div className="card flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
          <MapPin className="h-8 w-8 shrink-0 text-brand" />
          <div>
            <h2 className="text-xl font-bold">{`Same-day setup in ${c.name}`}</h2>
            <p className="mt-1 text-muted">{`Printer shipped to your shop in ${c.areas.join(", ")} and nearby. Setup and training over video call — you're billing the same day.`}</p>
          </div>
        </div>
      </section>
      <section className="bg-white py-16"><div className="container-x"><SectionHead title={`Why ${c.name} restaurants choose Billo`} /><FeatureGrid limit={6} /></div></section>
      <section className="container-x py-16"><SectionHead title="Pricing" /><Pricing /></section>
      <section className="bg-white py-16"><div className="container-x"><SectionHead title="FAQ" /><Faq items={faqs} /></div></section>
      <section className="container-x pt-14 text-center">
        <p className="text-sm font-semibold text-muted">Billo in {c.name} for</p>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {USE_CASES.map((u) => <Link key={u.slug} href={`/for/${u.slug}`} className="rounded-lg border border-border bg-white px-3 py-1.5 text-sm text-ink-soft hover:text-brand">{u.name}</Link>)}
        </div>
      </section>
      <CtaBand title={`Start billing faster in ${c.name}`} />
    </>
  );
}

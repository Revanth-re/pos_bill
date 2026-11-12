import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { GUIDES } from "@/lib/marketing/guides";
import { PageHero } from "@/components/marketing/PageHero";
import { CtaBand } from "@/components/marketing/Sections";
import { JsonLd, breadcrumbLd } from "@/components/marketing/JsonLd";

export const metadata: Metadata = {
  title: "Billing Guides for Restaurants & Shops – Free Tips | Billo",
  description: "Free guides on billing software, mini billing machines, Bluetooth bill printing, GST bills, token systems and udhaari khata for Indian restaurants and shops.",
  alternates: { canonical: "/guides" },
  openGraph: { url: "/guides", title: "Billing Guides for Restaurants & Shops | Billo", images: ["/og-image.png"] },
};

export default function GuidesIndex() {
  return (
    <>
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Guides", path: "/guides" }])} />
      <PageHero
        crumbs={[{ name: "Guides", href: "/guides" }]}
        eyebrow="Billo guides"
        title="Billing guides for restaurants & shops"
        text="Simple, practical tips on billing software, printers, GST bills, tokens and udhaari — written for Indian counters."
      />
      <section className="container-x py-14">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {GUIDES.map((g) => (
            <Link key={g.slug} href={`/guides/${g.slug}`} className="card group overflow-hidden transition-shadow hover:shadow-lg">
              <img src={g.image} alt="" width={640} height={360} loading="lazy" className="aspect-[16/9] w-full object-cover" />
              <div className="p-5">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-muted"><Clock className="h-3.5 w-3.5" /> {g.readMins} min read</p>
                <h2 className="mt-2 text-lg font-extrabold leading-snug text-ink group-hover:text-brand-dark">{g.h1}</h2>
                <p className="mt-2 line-clamp-3 text-[15px] text-muted">{g.description}</p>
                <p className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-brand">Read guide <ArrowRight className="h-4 w-4" /></p>
              </div>
            </Link>
          ))}
        </div>
      </section>
      <CtaBand />
    </>
  );
}

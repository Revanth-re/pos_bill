import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Check, MessageCircle } from "lucide-react";
import { USE_CASES, CITIES, whatsapp } from "@/lib/marketing/site";
import { PageHero } from "@/components/marketing/PageHero";
import { FeatureGrid, Pricing, Faq, CtaBand, SectionHead } from "@/components/marketing/Sections";
import { JsonLd, faqLd, breadcrumbLd } from "@/components/marketing/JsonLd";
import { FAQS } from "@/lib/marketing/site";

export const dynamicParams = false;
export function generateStaticParams() {
  return USE_CASES.map((u) => ({ slug: u.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const u = USE_CASES.find((x) => x.slug === slug);
  if (!u) return {};
  return {
    title: u.title,
    description: u.description,
    keywords: u.keywords,
    alternates: { canonical: `/for/${u.slug}` },
    openGraph: { url: `/for/${u.slug}`, title: u.title, description: u.description, images: ["/og-image.png"] },
  };
}

export default async function UseCasePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const u = USE_CASES.find((x) => x.slug === slug);
  if (!u) notFound();
  const faqs = [FAQS[0], FAQS[1], FAQS[4], FAQS[3]];
  return (
    <>
      <JsonLd data={[faqLd(faqs), breadcrumbLd([{ name: "Home", path: "/" }, { name: u.name, path: `/for/${u.slug}` }])]} />
      <PageHero crumbs={[{ name: `Billo for ${u.name}`, href: `/for/${u.slug}` }]} eyebrow={`Billo for ${u.name}`} title={u.h1} text={u.intro}>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <a href={whatsapp(`Hi Billo, I run a ${u.name.toLowerCase().replace(/s$/, "")} and want a demo.`)} target="_blank" rel="noopener" className="btn btn-primary"><MessageCircle className="h-5 w-5" /> Free demo on WhatsApp</a>
          <Link href="/pricing" className="btn btn-ghost">Plans from ₹299</Link>
        </div>
      </PageHero>
      <section className="container-x grid items-center gap-10 py-16 lg:grid-cols-2">
        <div className="grid gap-4 sm:grid-cols-2">
          {u.points.map((p) => (
            <div key={p.title} className="card p-5">
              <Check className="h-6 w-6 text-success" />
              <h2 className="mt-2 text-lg font-bold text-ink">{p.title}</h2>
              <p className="mt-1 text-[15px] text-muted">{p.text}</p>
            </div>
          ))}
        </div>
        <img src={u.image} alt={`${u.name} billing with Billo`} width={640} height={400} loading="lazy" className="w-full rounded-3xl object-cover shadow-xl" />
      </section>
      <section className="bg-white py-16"><div className="container-x"><SectionHead title="Also included" /><FeatureGrid limit={6} /></div></section>
      <section className="container-x py-16"><SectionHead title="Pricing" /><Pricing /></section>
      <section className="bg-white py-16"><div className="container-x"><SectionHead title="FAQ" /><Faq items={faqs} /></div></section>
      <section className="container-x pt-14 text-center">
        <p className="text-sm font-semibold text-muted">Billo for {u.name.toLowerCase()} in</p>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {CITIES.slice(0, 10).map((c) => <Link key={c.slug} href={`/billing-software/${c.slug}`} className="rounded-lg border border-border bg-white px-3 py-1.5 text-sm text-ink-soft hover:text-brand">{c.name}</Link>)}
        </div>
      </section>
      <CtaBand />
    </>
  );
}

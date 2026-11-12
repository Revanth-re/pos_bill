import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Check, Clock, MessageCircle, ArrowRight } from "lucide-react";
import { GUIDES } from "@/lib/marketing/guides";
import { SITE, USE_CASES, whatsapp } from "@/lib/marketing/site";
import { PageHero } from "@/components/marketing/PageHero";
import { Faq, CtaBand, Pricing, SectionHead } from "@/components/marketing/Sections";
import { JsonLd, faqLd, breadcrumbLd } from "@/components/marketing/JsonLd";

export const dynamicParams = false;
export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const g = GUIDES.find((x) => x.slug === slug);
  if (!g) return {};
  return {
    title: g.title,
    description: g.description,
    keywords: g.keywords,
    alternates: { canonical: `/guides/${g.slug}` },
    openGraph: { type: "article", url: `/guides/${g.slug}`, title: g.title, description: g.description, images: [g.image], publishedTime: g.published, modifiedTime: g.updated },
  };
}

const fmt = (ymd: string) => new Date(`${ymd}T00:00:00+05:30`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const g = GUIDES.find((x) => x.slug === slug);
  if (!g) notFound();
  const related = g.related.map((s) => USE_CASES.find((u) => u.slug === s)).filter((u): u is (typeof USE_CASES)[number] => !!u);
  const more = GUIDES.filter((x) => x.slug !== g.slug).slice(0, 3);
  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: g.h1,
    description: g.description,
    image: `${SITE.url}${g.image}`,
    datePublished: g.published,
    dateModified: g.updated,
    author: { "@type": "Organization", name: "Billo", url: SITE.url },
    publisher: { "@id": `${SITE.url}/#org` },
    mainEntityOfPage: `${SITE.url}/guides/${g.slug}`,
    inLanguage: "en-IN",
  };
  return (
    <>
      <JsonLd data={[articleLd, faqLd(g.faqs), breadcrumbLd([{ name: "Home", path: "/" }, { name: "Guides", path: "/guides" }, { name: g.h1, path: `/guides/${g.slug}` }])]} />
      <PageHero crumbs={[{ name: "Guides", href: "/guides" }, { name: g.h1, href: `/guides/${g.slug}` }]} eyebrow="Billo guide" title={g.h1} text={g.intro}>
        <p className="mt-4 flex items-center gap-1.5 text-sm text-muted"><Clock className="h-4 w-4" /> {g.readMins} min read · Updated {fmt(g.updated)}</p>
      </PageHero>

      <div className="container-x grid gap-10 py-14 lg:grid-cols-[minmax(0,1fr)_320px]">
        <article className="max-w-3xl">
          <img src={g.image} alt={g.h1} width={960} height={540} className="mb-8 aspect-[16/9] w-full rounded-2xl object-cover shadow" />
          {g.sections.map((s) => (
            <section key={s.h2} className="mb-9">
              <h2 className="text-2xl font-extrabold text-ink">{s.h2}</h2>
              {s.paras.map((p) => <p key={p} className="mt-3 text-[17px] leading-relaxed text-ink-soft">{p}</p>)}
              {s.list && (
                <ul className="mt-4 space-y-2.5">
                  {s.list.map((l) => <li key={l} className="flex items-start gap-2.5 text-[16px] text-ink-soft"><Check className="mt-0.5 h-5 w-5 shrink-0 text-success" />{l}</li>)}
                </ul>
              )}
            </section>
          ))}
        </article>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl bg-brand-dark p-6 text-white shadow-lg">
            <p className="text-xs font-extrabold uppercase tracking-wide text-accent">100% free</p>
            <p className="mt-2 text-xl font-extrabold">Use Billo free. We set it up free.</p>
            <p className="mt-2 text-sm text-white/75">Printer + app setup at your counter and a live demo with your own menu — at no cost.</p>
            <a href={whatsapp(`Hi Billo, I read your guide "${g.h1}" and want the free setup + demo.`)} target="_blank" rel="noopener" className="btn btn-accent mt-4 w-full"><MessageCircle className="h-5 w-5" /> Book free setup</a>
          </div>
          {related.length > 0 && (
            <div className="card p-5">
              <p className="text-sm font-bold text-ink">Related</p>
              <ul className="mt-2 space-y-1.5">
                {related.map((u) => <li key={u.slug}><Link href={`/for/${u.slug}`} className="text-[15px] font-semibold text-brand hover:underline">{u.eyebrow ?? `Billo for ${u.name}`}</Link></li>)}
              </ul>
            </div>
          )}
        </aside>
      </div>

      <section className="bg-white py-16"><div className="container-x"><SectionHead title="FAQ" /><Faq items={g.faqs} /></div></section>
      <section className="container-x py-16"><SectionHead eyebrow="Free for your shop" title="Free platform. Free setup. Free demo." /><Pricing /></section>
      <section className="bg-white py-16">
        <div className="container-x">
          <SectionHead title="More guides" />
          <div className="grid gap-4 md:grid-cols-3">
            {more.map((m) => (
              <Link key={m.slug} href={`/guides/${m.slug}`} className="card p-5 transition-shadow hover:shadow-md">
                <p className="font-extrabold text-ink">{m.h1}</p>
                <p className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-brand">Read <ArrowRight className="h-4 w-4" /></p>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <CtaBand />
    </>
  );
}

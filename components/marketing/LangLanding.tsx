import Link from "next/link";
import { Check, MessageCircle, Phone } from "lucide-react";
import { PhoneMock } from "@/components/marketing/Sections";
import { JsonLd, faqLd } from "@/components/marketing/JsonLd";
import { SITE, whatsapp } from "@/lib/marketing/site";

export interface LangContent {
  lang: "hi" | "te";
  fontVar: string;
  eyebrow: string;
  h1a: string;
  h1b: string;
  intro: string;
  cta: string;
  waText: string;
  featuresTitle: string;
  features: [string, string][];
  pricingTitle: string;
  kitLabel: string;
  kitName: string;
  kitItems: string[];
  appOnly: string;
  appRows: [string, string][];
  faqTitle: string;
  faqs: { q: string; a: string }[];
}

/** Shared layout for regional-language landing pages (/hi, /te, …). */
export function LangLanding({ c }: { c: LangContent }) {
  return (
    <div lang={c.lang} style={{ fontFamily: `var(${c.fontVar}), var(--font-jakarta), sans-serif` }}>
      <JsonLd data={faqLd(c.faqs)} />
      <section className="relative overflow-hidden bg-[radial-gradient(60%_60%_at_80%_10%,rgba(242,210,27,.18),transparent)]">
        <div className="container-x grid items-center gap-10 py-14 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <p className="eyebrow">{c.eyebrow}</p>
            <h1 className="mt-3 text-[clamp(2rem,5.5vw,3.4rem)] font-bold leading-[1.25] text-ink">
              {c.h1a} <span className="text-brand">{c.h1b}</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-soft">{c.intro}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href={whatsapp(c.waText)} target="_blank" rel="noopener" className="btn btn-primary text-base">
                <MessageCircle className="h-5 w-5" /> {c.cta}
              </a>
              <a href={`tel:+${SITE.phoneRaw}`} className="btn btn-ghost text-base">
                <Phone className="h-4 w-4" /> {SITE.phone}
              </a>
            </div>
          </div>
          <PhoneMock />
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="container-x">
          <h2 className="mb-8 text-center text-3xl font-bold">{c.featuresTitle}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {c.features.map(([t, d]) => (
              <div key={t} className="card p-5">
                <Check className="h-6 w-6 text-success" />
                <h3 className="mt-2 text-lg font-bold text-ink">{t}</h3>
                <p className="mt-1 text-[15px] leading-relaxed text-muted">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-x py-16">
        <h2 className="mb-8 text-center text-3xl font-bold">{c.pricingTitle}</h2>
        <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          <div className="rounded-3xl bg-brand-dark p-6 text-white sm:p-8">
            <p className="text-sm font-semibold text-accent">{c.kitLabel}</p>
            <p className="mt-1 text-2xl font-bold">{c.kitName}</p>
            <p className="mt-2 text-5xl font-extrabold text-accent">₹4,799</p>
            <ul className="mt-4 space-y-2">
              {c.kitItems.map((x) => (
                <li key={x} className="flex gap-2"><Check className="h-5 w-5 shrink-0 text-accent" /> {x}</li>
              ))}
            </ul>
          </div>
          <div className="card p-6 sm:p-8">
            <p className="font-bold text-ink">{c.appOnly}</p>
            <ul className="mt-4 divide-y divide-border">
              {c.appRows.map(([a, b]) => (
                <li key={a} className="flex items-center justify-between gap-3 py-3">
                  <span className="text-ink-soft">{a}</span>
                  <span className="text-2xl font-extrabold text-brand">{b}</span>
                </li>
              ))}
            </ul>
            <Link href="/pricing" className="btn btn-ghost mt-4 w-full">Pricing (English)</Link>
          </div>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="container-x">
          <h2 className="mb-8 text-center text-3xl font-bold">{c.faqTitle}</h2>
          <div className="mx-auto max-w-3xl divide-y divide-border overflow-hidden rounded-2xl border border-border">
            {c.faqs.map((f) => (
              <details key={f.q} className="group">
                <summary className="cursor-pointer list-none px-5 py-4 font-bold text-ink hover:bg-paper">{f.q}</summary>
                <p className="px-5 pb-5 leading-relaxed text-muted">{f.a}</p>
              </details>
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-muted">
            <Link href="/" className="font-semibold text-brand hover:underline">English</Link> ·{" "}
            <Link href="/hi" lang="hi" className="font-semibold text-brand hover:underline">हिन्दी</Link> ·{" "}
            <Link href="/te" lang="te" className="font-semibold text-brand hover:underline">తెలుగు</Link>
          </p>
        </div>
      </section>
    </div>
  );
}

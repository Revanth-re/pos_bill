import Link from "next/link";
import { ArrowRight, MessageCircle, Check, ShieldCheck, Languages, Smartphone } from "lucide-react";
import { PhoneMock, FeatureGrid, Pricing, Faq, CtaBand, SectionHead } from "@/components/marketing/Sections";
import { JsonLd, faqLd } from "@/components/marketing/JsonLd";
import { InstallButton } from "@/components/marketing/InstallButton";
import { USE_CASES, CITIES, whatsapp } from "@/lib/marketing/site";

export default function Home() {
  return (
    <>
      <JsonLd data={faqLd()} />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 -z-10 h-[620px] bg-[radial-gradient(60%_60%_at_80%_10%,rgba(242,210,27,.18),transparent),radial-gradient(50%_60%_at_10%_0%,rgba(7,94,99,.12),transparent)]" />
        <div className="container-x grid items-center gap-12 py-12 sm:py-16 lg:grid-cols-[1.1fr_1fr] lg:py-20">
          <div className="rise">
            <p className="eyebrow rounded-full bg-brand-soft px-3 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" /> Made in India · for every Indian food business
            </p>
            <h1 className="mt-5 text-[clamp(2.3rem,6vw,3.9rem)] font-extrabold leading-[1.05] text-ink">
              Fast billing for <span className="text-brand">Indian restaurants</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-soft">
              Billo turns your phone into a billing counter. Tap items, print the bill with a big <strong>token number</strong> on a Bluetooth printer,
              track <strong>udhaari</strong>, staff and cash — and see today&apos;s sales from anywhere.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href={whatsapp()} target="_blank" rel="noopener" className="btn btn-primary text-base">
                <MessageCircle className="h-5 w-5" /> Book a free demo
              </a>
              <InstallButton className="btn btn-ghost text-base" label="Get Billo app" iconClass="h-5 w-5" />
            </div>
            <p className="mt-3 text-sm text-muted">
              Plans from ₹299 · <Link href="/pricing" className="font-semibold text-brand hover:underline">see pricing <ArrowRight className="inline h-3.5 w-3.5" /></Link>
            </p>
            <ul className="mt-8 grid gap-2 text-sm font-medium text-ink-soft sm:grid-cols-3">
              <li className="flex items-center gap-2"><Smartphone className="h-4 w-4 text-brand" /> Runs on your phone</li>
              <li className="flex items-center gap-2"><Languages className="h-4 w-4 text-brand" /> 10 Indian languages</li>
              <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-brand" /> Same-day setup</li>
            </ul>
          </div>
          <div className="rise rise-2">
            <PhoneMock />
          </div>
        </div>
      </section>

      {/* BUILT FOR */}
      <section className="border-y border-border bg-white">
        <div className="container-x flex flex-wrap items-center justify-center gap-2 py-5">
          <span className="mr-2 text-sm font-semibold text-muted">Built for</span>
          {USE_CASES.map((u) => (
            <Link key={u.slug} href={`/for/${u.slug}`} className="rounded-xl border border-border px-3.5 py-2 text-sm font-semibold text-ink-soft transition-colors hover:border-brand/40 hover:bg-brand-soft/50 hover:text-brand-dark">
              {u.name}
            </Link>
          ))}
        </div>
      </section>

      {/* WORKFLOW */}
      <section className="container-x py-20">
        <SectionHead eyebrow="Your workflow, just faster" title="Same counter routine. No more cash register." text="Billo doesn't change how your restaurant works — it removes the slow parts." />
        <ol className="grid gap-4 md:grid-cols-4">
          {[
            ["1", "Customer orders", "At the counter, like always."],
            ["2", "Tap items in Billo", "Big photo buttons, search and categories."],
            ["3", "Bill + token prints", "Bluetooth printer, in about 2 seconds."],
            ["4", "Token to kitchen", "Kitchen reads the big token and prepares."],
          ].map(([n, t, d]) => (
            <li key={n} className="card relative p-5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-sm font-extrabold text-brand-deep">{n}</span>
              <p className="mt-3 text-lg font-bold text-ink">{t}</p>
              <p className="mt-1 text-[15px] text-muted">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* FEATURES */}
      <section className="bg-white py-20">
        <div className="container-x">
          <SectionHead eyebrow="Features" title="Everything a busy counter needs" text="Fast billing, bill management, staff control, payments and owner reports — in one simple app." />
          <FeatureGrid limit={9} />
          <div className="mt-8 text-center">
            <Link href="/features" className="btn btn-ghost">See all features <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </section>

      {/* UDHAARI SPOTLIGHT */}
      <section className="container-x grid items-center gap-10 py-20 lg:grid-cols-2">
        <div>
          <p className="eyebrow">Udhaari khata</p>
          <h2 className="mt-2 text-3xl font-extrabold text-ink sm:text-4xl">Regular customers? Track udhaari without a notebook.</h2>
          <p className="mt-4 text-lg text-muted">Tap <strong className="text-ink">Udhaari</strong> at billing and the amount goes to the customer&apos;s khata — no bill printed. When they pay, show them exactly what they ate each day.</p>
          <ul className="mt-6 space-y-3">
            {["Day-by-day items and amounts with running balance", "Full or part payment by cash or UPI", "Send the statement on WhatsApp or print it", "Separate from prepaid tiffin plans"].map((t) => (
              <li key={t} className="flex items-start gap-2.5 text-[16px] text-ink-soft"><Check className="mt-0.5 h-5 w-5 shrink-0 text-success" />{t}</li>
            ))}
          </ul>
        </div>
        <div className="card mx-auto w-full max-w-md overflow-hidden" aria-hidden>
          <div className="bg-brand-dark p-5 text-white">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/70">Ramesh · Udhaari due</p>
            <p className="text-4xl font-extrabold text-accent tabular">₹435</p>
            <p className="mt-1 text-xs text-white/70">6 days · 7 bills unpaid · Last paid 30 Sep</p>
          </div>
          <ul className="divide-y divide-border text-sm">
            {[
              ["Mon 6 Oct", "2× Idli, 1× Coffee", "+80"],
              ["Sat 4 Oct", "Paid by UPI", "−200"],
              ["Fri 3 Oct", "1× Meals, 1× Lassi", "+125"],
              ["Thu 2 Oct", "1× Masala Dosa, 1× Tea", "+75"],
            ].map(([d, i, a]) => (
              <li key={d} className="flex items-center justify-between gap-3 px-5 py-3">
                <div>
                  <p className="font-semibold text-ink">{i}</p>
                  <p className="text-xs text-muted">{d}</p>
                </div>
                <p className={`font-extrabold tabular ${a.startsWith("−") ? "text-success" : "text-ink"}`}>{a}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="bg-white py-20">
        <div className="container-x">
          <SectionHead eyebrow="Pricing" title="Simple pricing. No hidden charges." text="Get the complete counter kit, or use the app with your own printer." />
          <Pricing />
        </div>
      </section>

      {/* CITIES */}
      <section className="container-x py-20">
        <SectionHead eyebrow="Across India" title="Restaurant billing software across India" text="Printer shipped anywhere in India with same-day setup and WhatsApp support — from metros to small towns." />
        <div className="flex flex-wrap justify-center gap-2">
          {CITIES.map((c) => (
            <Link key={c.slug} href={`/billing-software/${c.slug}`} className="rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-semibold text-ink-soft transition-colors hover:border-brand/40 hover:text-brand-dark">
              {c.name}
            </Link>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white py-20">
        <div className="container-x">
          <SectionHead eyebrow="FAQ" title="Questions owners ask us" />
          <Faq />
        </div>
      </section>

      <CtaBand />
    </>
  );
}
